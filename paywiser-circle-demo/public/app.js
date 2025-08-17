// PayWiser Circle Demo Frontend Application
class PayWiserApp {
    constructor() {
        this.baseUrl = window.location.origin;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadStats();
        this.loadUsers();
    }

    bindEvents() {
        // Register form
        document.getElementById('registerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.registerUser();
        });

        // Lookup form
        document.getElementById('lookupForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.lookupUser();
        });

        // Send payment form
        document.getElementById('sendForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendPayment();
        });

        // Transaction history form
        document.getElementById('historyForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.loadTransactionHistory();
        });

        // Refresh users button
        document.getElementById('refreshUsers').addEventListener('click', () => {
            this.loadUsers();
        });
    }

    // Utility methods
    showAlert(message, type = 'info') {
        const alertContainer = document.getElementById('alertContainer');
        const alertId = 'alert-' + Date.now();
        
        const alertColors = {
            success: 'bg-green-100 border-green-500 text-green-700',
            error: 'bg-red-100 border-red-500 text-red-700',
            warning: 'bg-yellow-100 border-yellow-500 text-yellow-700',
            info: 'bg-blue-100 border-blue-500 text-blue-700'
        };

        const alertHtml = `
            <div id="${alertId}" class="border-l-4 p-4 mb-4 ${alertColors[type]} rounded-r-lg">
                <div class="flex justify-between items-center">
                    <p>${message}</p>
                    <button onclick="document.getElementById('${alertId}').remove()" class="ml-4 text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
        
        alertContainer.insertAdjacentHTML('beforeend', alertHtml);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            const alert = document.getElementById(alertId);
            if (alert) alert.remove();
        }, 5000);
    }

    showLoading(button, show = true) {
        const loading = button.querySelector('.loading');
        if (loading) {
            loading.classList.toggle('show', show);
        }
        button.disabled = show;
    }

    async apiCall(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.baseUrl}/api${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'API request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // User registration
    async registerUser() {
        const button = document.querySelector('#registerForm button');
        this.showLoading(button, true);

        try {
            const userId = document.getElementById('userId').value.trim();
            const name = document.getElementById('userName').value.trim();
            const email = document.getElementById('userEmail').value.trim();

            if (!userId) {
                throw new Error('User ID is required');
            }

            const result = await this.apiCall('/wallets/register', {
                method: 'POST',
                body: JSON.stringify({ userId, name, email })
            });

            this.showAlert(`✅ User ${userId} registered successfully! Wallet created: ${result.wallet.address}`, 'success');
            
            // Clear form
            document.getElementById('registerForm').reset();
            
            // Refresh users list
            this.loadUsers();
            this.loadStats();

        } catch (error) {
            this.showAlert(`❌ Registration failed: ${error.message}`, 'error');
        } finally {
            this.showLoading(button, false);
        }
    }

    // User lookup
    async lookupUser() {
        const button = document.querySelector('#lookupForm button');
        this.showLoading(button, true);

        try {
            const userId = document.getElementById('lookupUserId').value.trim();
            
            if (!userId) {
                throw new Error('User ID is required');
            }

            const result = await this.apiCall(`/wallets/user/${userId}`);
            const user = result.user;

            // Display user details
            const userDetails = document.getElementById('userDetails');
            const userInfo = document.getElementById('userInfo');
            
            userInfo.innerHTML = `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h5 class="font-semibold text-gray-700">User Information</h5>
                        <p><strong>ID:</strong> ${user.id}</p>
                        <p><strong>Name:</strong> ${user.profile?.name || 'Not provided'}</p>
                        <p><strong>Email:</strong> ${user.profile?.email || 'Not provided'}</p>
                        <p><strong>Created:</strong> ${new Date(user.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                        <h5 class="font-semibold text-gray-700">Wallet Information</h5>
                        <p><strong>Wallet ID:</strong> ${user.walletId}</p>
                        <p><strong>Address:</strong> <code class="bg-gray-200 px-1 rounded text-xs">${user.walletAddress}</code></p>
                        <p><strong>Balance:</strong> Loading...</p>
                    </div>
                </div>
            `;
            
            userDetails.classList.remove('hidden');
            this.showAlert(`✅ User ${userId} found successfully!`, 'success');

            // Load balance
            try {
                const balanceResult = await this.apiCall(`/wallets/balance/${userId}`);
                const balanceElement = userInfo.querySelector('p:last-child');
                balanceElement.innerHTML = `<strong>Balance:</strong> ${JSON.stringify(balanceResult.balance, null, 2)}`;
            } catch (balanceError) {
                console.error('Error loading balance:', balanceError);
            }

        } catch (error) {
            this.showAlert(`❌ User lookup failed: ${error.message}`, 'error');
            document.getElementById('userDetails').classList.add('hidden');
        } finally {
            this.showLoading(button, false);
        }
    }

    // Send payment
    async sendPayment() {
        const button = document.querySelector('#sendForm button');
        this.showLoading(button, true);

        try {
            const fromUserId = document.getElementById('fromUserId').value.trim();
            const toUserId = document.getElementById('toUserId').value.trim();
            const amount = document.getElementById('amount').value.trim();
            const memo = document.getElementById('memo').value.trim();

            if (!fromUserId || !toUserId || !amount) {
                throw new Error('All required fields must be filled');
            }

            const result = await this.apiCall('/wallets/send', {
                method: 'POST',
                body: JSON.stringify({ fromUserId, toUserId, amount, memo })
            });

            this.showAlert(`✅ Payment sent successfully! Transaction ID: ${result.transaction.id}`, 'success');
            
            // Clear form
            document.getElementById('sendForm').reset();
            
            // Refresh stats
            this.loadStats();

        } catch (error) {
            this.showAlert(`❌ Payment failed: ${error.message}`, 'error');
        } finally {
            this.showLoading(button, false);
        }
    }

    // Load transaction history
    async loadTransactionHistory() {
        const button = document.querySelector('#historyForm button');
        this.showLoading(button, true);

        try {
            const userId = document.getElementById('historyUserId').value.trim();
            
            if (!userId) {
                throw new Error('User ID is required');
            }

            const result = await this.apiCall(`/wallets/transactions/${userId}`);
            
            // Display transactions
            const historySection = document.getElementById('transactionHistory');
            const transactionList = document.getElementById('transactionList');
            
            const { circleTransactions, localTransactions } = result.transactions;
            
            let transactionsHtml = '';
            
            if (localTransactions && localTransactions.length > 0) {
                transactionsHtml += '<h5 class="font-semibold text-gray-700 mb-2">Local Transactions</h5>';
                localTransactions.forEach(tx => {
                    transactionsHtml += `
                        <div class="bg-gray-50 p-3 rounded border">
                            <div class="flex justify-between items-start">
                                <div>
                                    <p class="font-medium">${tx.fromUserId} → ${tx.toUserId}</p>
                                    <p class="text-sm text-gray-600">Amount: $${tx.amount}</p>
                                    ${tx.memo ? `<p class="text-sm text-gray-600">Memo: ${tx.memo}</p>` : ''}
                                </div>
                                <div class="text-right">
                                    <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">${tx.status}</span>
                                    <p class="text-xs text-gray-500 mt-1">${new Date(tx.createdAt).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    `;
                });
            }
            
            if (circleTransactions && circleTransactions.length > 0) {
                transactionsHtml += '<h5 class="font-semibold text-gray-700 mb-2 mt-4">Circle Transactions</h5>';
                transactionsHtml += `<pre class="bg-gray-100 p-2 rounded text-xs overflow-auto">${JSON.stringify(circleTransactions, null, 2)}</pre>`;
            }
            
            if (!transactionsHtml) {
                transactionsHtml = '<p class="text-gray-500 text-center py-4">No transactions found</p>';
            }
            
            transactionList.innerHTML = transactionsHtml;
            historySection.classList.remove('hidden');
            
            this.showAlert(`✅ Transaction history loaded for ${userId}`, 'success');

        } catch (error) {
            this.showAlert(`❌ Failed to load transactions: ${error.message}`, 'error');
            document.getElementById('transactionHistory').classList.add('hidden');
        } finally {
            this.showLoading(button, false);
        }
    }

    // Load system stats
    async loadStats() {
        try {
            const result = await this.apiCall('/wallets/stats');
            const stats = result.stats;
            
            document.getElementById('stats').textContent = 
                `👥 ${stats.totalUsers} users | 💳 ${stats.totalWallets} wallets | 💸 ${stats.totalTransactions} transactions`;
        } catch (error) {
            console.error('Error loading stats:', error);
            document.getElementById('stats').textContent = 'Stats unavailable';
        }
    }

    // Load users list
    async loadUsers() {
        try {
            const result = await this.apiCall('/wallets/users');
            const users = result.users;
            const usersList = document.getElementById('usersList');
            
            if (users.length === 0) {
                usersList.innerHTML = '<p class="text-gray-500 col-span-full text-center py-8">No users registered yet</p>';
                return;
            }
            
            usersList.innerHTML = users.map(user => `
                <div class="bg-gray-50 p-4 rounded-lg border">
                    <div class="flex items-center justify-between mb-2">
                        <h4 class="font-semibold text-gray-800">${user.id}</h4>
                        <i class="fas fa-wallet text-blue-600"></i>
                    </div>
                    <p class="text-sm text-gray-600 mb-1">
                        <strong>Name:</strong> ${user.profile?.name || 'N/A'}
                    </p>
                    <p class="text-sm text-gray-600 mb-2">
                        <strong>Email:</strong> ${user.profile?.email || 'N/A'}
                    </p>
                    <p class="text-xs text-gray-500 break-all">
                        <strong>Wallet:</strong> ${user.walletAddress.substring(0, 20)}...
                    </p>
                    <p class="text-xs text-gray-400 mt-2">
                        Created: ${new Date(user.createdAt).toLocaleDateString()}
                    </p>
                    <div class="mt-3 flex space-x-2">
                        <button onclick="app.fillLookupForm('${user.id}')" class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200">
                            View Details
                        </button>
                        <button onclick="app.fillSendForm('${user.id}')" class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200">
                            Send To
                        </button>
                    </div>
                </div>
            `).join('');
            
        } catch (error) {
            console.error('Error loading users:', error);
            document.getElementById('usersList').innerHTML = '<p class="text-red-500 col-span-full text-center py-8">Error loading users</p>';
        }
    }

    // Helper methods for quick form filling
    fillLookupForm(userId) {
        document.getElementById('lookupUserId').value = userId;
        document.getElementById('lookupUserId').scrollIntoView({ behavior: 'smooth' });
    }

    fillSendForm(userId) {
        document.getElementById('toUserId').value = userId;
        document.getElementById('toUserId').scrollIntoView({ behavior: 'smooth' });
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new PayWiserApp();
});

// Add some helper functions to window for debugging
window.debugApi = {
    async health() {
        const response = await fetch('/health');
        return response.json();
    },
    
    async apiDocs() {
        const response = await fetch('/api');
        return response.json();
    }
};
