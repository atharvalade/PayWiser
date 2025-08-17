// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

// Hyperlane Interfaces
interface IInterchainAccountRouter {
    function callRemote(
        uint32 _destinationDomain,
        CallLib.Call[] calldata calls
    ) external payable returns (bytes32);

    function getRemoteInterchainAccount(
        uint32 _destination,
        address _owner
    ) external view returns (address);

    function quoteGasPayment(uint32 _destinationDomain)
        external
        view
        returns (uint256);
}

library CallLib {
    struct Call {
        bytes32 to;
        uint256 value;
        bytes data;
    }

    function build(address to, uint256 value, bytes memory data)
        internal
        pure
        returns (Call memory)
    {
        return Call({
            to: addressToBytes32(to),
            value: value,
            data: data
        });
    }

    function addressToBytes32(address addr) internal pure returns (bytes32) {
        return bytes32(uint256(uint160(addr)));
    }
}

/**
 * @title PayWiserSettlement
 * @dev Handles cross-chain settlements for PayWiser merchants using Hyperlane Interchain Accounts
 */
contract PayWiserSettlement is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    using CallLib for address;

    // Events
    event PaymentReceived(
        address indexed merchant,
        address indexed customer,
        address indexed token,
        uint256 amount,
        string paymentId
    );

    event SettlementInitiated(
        address indexed merchant,
        uint32 indexed destinationChain,
        address indexed token,
        uint256 amount,
        bytes32 hyperlaneMessageId
    );

    event MerchantConfigured(
        address indexed merchant,
        uint32 preferredChain,
        address settlementAddress,
        uint256 minimumAmount
    );

    event SettlementCompleted(
        address indexed merchant,
        address indexed token,
        uint256 amount,
        bytes32 hyperlaneMessageId
    );

    // Structs
    struct MerchantConfig {
        uint32 preferredSettlementChain;  // Hyperlane domain ID
        address settlementAddress;        // Address to receive settlements
        uint256 minimumSettlementAmount; // Minimum amount before settlement
        bool isActive;                    // Whether merchant is active
    }

    struct PendingSettlement {
        address merchant;
        address token;
        uint256 amount;
        uint32 destinationChain;
        bool isSettled;
        uint256 timestamp;
    }

    // State variables
    IInterchainAccountRouter public immutable hyperlaneRouter;
    
    mapping(address => MerchantConfig) public merchantConfigs;
    mapping(address => mapping(address => uint256)) public pendingBalances; // merchant => token => amount
    mapping(bytes32 => PendingSettlement) public settlements; // messageId => settlement
    
    address[] public supportedTokens;
    mapping(address => bool) public isSupportedToken;

    uint256 public settlementFee; // Fee in basis points (100 = 1%)
    address public feeRecipient;

    // Constants
    uint256 public constant MAX_SETTLEMENT_FEE = 500; // 5% max fee
    uint256 public constant BASIS_POINTS = 10000;

    constructor(
        address _hyperlaneRouter,
        address _feeRecipient,
        uint256 _settlementFee
    ) Ownable(msg.sender) {
        require(_hyperlaneRouter != address(0), "Invalid router address");
        require(_feeRecipient != address(0), "Invalid fee recipient");
        require(_settlementFee <= MAX_SETTLEMENT_FEE, "Fee too high");

        hyperlaneRouter = IInterchainAccountRouter(_hyperlaneRouter);
        feeRecipient = _feeRecipient;
        settlementFee = _settlementFee;
    }

    /**
     * @dev Configure merchant settlement preferences
     */
    function configureMerchant(
        uint32 _preferredChain,
        address _settlementAddress,
        uint256 _minimumAmount
    ) external {
        require(_settlementAddress != address(0), "Invalid settlement address");
        require(_minimumAmount > 0, "Invalid minimum amount");

        merchantConfigs[msg.sender] = MerchantConfig({
            preferredSettlementChain: _preferredChain,
            settlementAddress: _settlementAddress,
            minimumSettlementAmount: _minimumAmount,
            isActive: true
        });

        emit MerchantConfigured(msg.sender, _preferredChain, _settlementAddress, _minimumAmount);
    }

    /**
     * @dev Accept payment from customer (called by PayWiser frontend/Circle integration)
     */
    function acceptPayment(
        address _merchant,
        address _customer,
        address _token,
        uint256 _amount,
        string calldata _paymentId
    ) external nonReentrant whenNotPaused {
        require(isSupportedToken[_token], "Token not supported");
        require(_amount > 0, "Invalid amount");
        require(merchantConfigs[_merchant].isActive, "Merchant not configured");

        // Transfer tokens from customer to this contract
        IERC20(_token).safeTransferFrom(_customer, address(this), _amount);

        // Add to merchant's pending balance
        pendingBalances[_merchant][_token] += _amount;

        emit PaymentReceived(_merchant, _customer, _token, _amount, _paymentId);
    }

    /**
     * @dev Initiate cross-chain settlement for merchant
     */
    function initiateSettlement(
        address _token,
        uint256 _amount
    ) external payable nonReentrant whenNotPaused {
        MerchantConfig memory config = merchantConfigs[msg.sender];
        require(config.isActive, "Merchant not configured");
        require(isSupportedToken[_token], "Token not supported");
        require(pendingBalances[msg.sender][_token] >= _amount, "Insufficient balance");
        require(_amount >= config.minimumSettlementAmount, "Amount below minimum");

        // Calculate fee
        uint256 fee = (_amount * settlementFee) / BASIS_POINTS;
        uint256 settlementAmount = _amount - fee;

        // Update pending balance
        pendingBalances[msg.sender][_token] -= _amount;

        // Transfer fee to fee recipient
        if (fee > 0) {
            IERC20(_token).safeTransfer(feeRecipient, fee);
        }

        // Check if settlement is on the same chain
        uint32 currentChain = getCurrentChainDomain();
        if (config.preferredSettlementChain == currentChain) {
            // Same chain settlement - direct transfer
            IERC20(_token).safeTransfer(config.settlementAddress, settlementAmount);
            emit SettlementCompleted(msg.sender, _token, settlementAmount, bytes32(0));
            return;
        }

        // Cross-chain settlement via Hyperlane
        bytes32 messageId = _initiateCrossChainSettlement(
            config.preferredSettlementChain,
            config.settlementAddress,
            _token,
            settlementAmount
        );

        // Store settlement info
        settlements[messageId] = PendingSettlement({
            merchant: msg.sender,
            token: _token,
            amount: settlementAmount,
            destinationChain: config.preferredSettlementChain,
            isSettled: false,
            timestamp: block.timestamp
        });

        emit SettlementInitiated(
            msg.sender,
            config.preferredSettlementChain,
            _token,
            settlementAmount,
            messageId
        );
    }

    /**
     * @dev Internal function to handle cross-chain settlement
     */
    function _initiateCrossChainSettlement(
        uint32 _destinationChain,
        address _settlementAddress,
        address _token,
        uint256 _amount
    ) internal returns (bytes32) {
        // Get the interchain account address on destination chain
        address icaAddress = hyperlaneRouter.getRemoteInterchainAccount(
            _destinationChain,
            address(this)
        );

        // Prepare the call to transfer tokens on destination chain
        bytes memory transferCallData = abi.encodeWithSignature(
            "transfer(address,uint256)",
            _settlementAddress,
            _amount
        );

        CallLib.Call[] memory calls = new CallLib.Call[](1);
        calls[0] = CallLib.build(_token, 0, transferCallData);

        // Execute cross-chain call
        return hyperlaneRouter.callRemote{value: msg.value}(_destinationChain, calls);
    }

    /**
     * @dev Get quote for cross-chain settlement gas cost
     */
    function getSettlementQuote(uint32 _destinationChain)
        external
        view
        returns (uint256)
    {
        return hyperlaneRouter.quoteGasPayment(_destinationChain);
    }

    /**
     * @dev Get merchant's pending balance for a token
     */
    function getPendingBalance(address _merchant, address _token)
        external
        view
        returns (uint256)
    {
        return pendingBalances[_merchant][_token];
    }

    /**
     * @dev Get merchant configuration
     */
    function getMerchantConfig(address _merchant)
        external
        view
        returns (MerchantConfig memory)
    {
        return merchantConfigs[_merchant];
    }

    /**
     * @dev Get interchain account address for this contract on destination chain
     */
    function getInterchainAccount(uint32 _destinationChain)
        external
        view
        returns (address)
    {
        return hyperlaneRouter.getRemoteInterchainAccount(_destinationChain, address(this));
    }

    // Admin functions
    function addSupportedToken(address _token) external onlyOwner {
        require(_token != address(0), "Invalid token address");
        require(!isSupportedToken[_token], "Token already supported");
        
        supportedTokens.push(_token);
        isSupportedToken[_token] = true;
    }

    function removeSupportedToken(address _token) external onlyOwner {
        require(isSupportedToken[_token], "Token not supported");
        
        isSupportedToken[_token] = false;
        
        // Remove from array
        for (uint i = 0; i < supportedTokens.length; i++) {
            if (supportedTokens[i] == _token) {
                supportedTokens[i] = supportedTokens[supportedTokens.length - 1];
                supportedTokens.pop();
                break;
            }
        }
    }

    function updateSettlementFee(uint256 _fee) external onlyOwner {
        require(_fee <= MAX_SETTLEMENT_FEE, "Fee too high");
        settlementFee = _fee;
    }

    function updateFeeRecipient(address _recipient) external onlyOwner {
        require(_recipient != address(0), "Invalid recipient");
        feeRecipient = _recipient;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // Emergency functions
    function emergencyWithdraw(address _token, uint256 _amount) external onlyOwner {
        IERC20(_token).safeTransfer(owner(), _amount);
    }

    function emergencyWithdrawETH() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    /**
     * @dev Get current chain's Hyperlane domain ID
     * This should be updated based on deployment chain
     */
    function getCurrentChainDomain() public view returns (uint32) {
        uint256 chainId = block.chainid;
        
        if (chainId == 11155111) return 11155111; // Sepolia
        if (chainId == 421614) return 421614;    // Arbitrum Sepolia
        if (chainId == 80002) return 80002;      // Polygon Amoy
        if (chainId == 84532) return 84532;      // Base Sepolia
        
        revert("Unsupported chain");
    }

    // Receive ETH for gas payments
    receive() external payable {}
}
