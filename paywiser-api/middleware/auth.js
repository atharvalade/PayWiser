const jwt = require('jsonwebtoken');
const { circleService } = require('../services/circleService');

/**
 * Authentication middleware for PayWiser API
 * Validates JWT tokens and user sessions
 */
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ 
            error: 'Access token required',
            code: 'MISSING_TOKEN'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ 
            error: 'Invalid or expired token',
            code: 'INVALID_TOKEN'
        });
    }
};

/**
 * Face authentication middleware
 * Validates face recognition for sensitive operations
 */
const authenticateFace = async (req, res, next) => {
    const { faceImage, userId } = req.body;

    if (!faceImage || !userId) {
        return res.status(400).json({
            error: 'Face image and user ID required for authentication',
            code: 'MISSING_FACE_DATA'
        });
    }

    try {
        const faceRecognitionService = require('../services/faceRecognitionService');
        const isValid = await faceRecognitionService.verifyFace(userId, faceImage);
        
        if (!isValid) {
            return res.status(401).json({
                error: 'Face authentication failed',
                code: 'FACE_AUTH_FAILED'
            });
        }

        req.faceVerified = true;
        next();
    } catch (error) {
        console.error('Face authentication error:', error);
        return res.status(500).json({
            error: 'Face authentication service error',
            code: 'FACE_AUTH_ERROR'
        });
    }
};

/**
 * Role-based authorization middleware
 */
const authorizeRole = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'Insufficient permissions',
                code: 'INSUFFICIENT_PERMISSIONS'
            });
        }
        next();
    };
};

module.exports = {
    authenticateToken,
    authenticateFace,
    authorizeRole
};
