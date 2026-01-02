import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Middleware to authenticate API key requests
export const authenticateApiKey = async (req, res, next) => {
  try {
    // Check for API key in header, query param, or body
    const apiKey = req.headers['x-api-key'] || 
                   req.query.api_key || 
                   req.body.api_key;

    if (!apiKey) {
      return res.status(401).json({ message: 'API key required' });
    }

    // Find user by API key
    const user = await User.findOne({ 
      'apiKeys.key': apiKey,
      'apiKeys.active': true
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid or inactive API key' });
    }

    // Find the specific API key in the user's keys
    const apiKeyObj = user.apiKeys.find(key => key.key === apiKey);
    
    if (!apiKeyObj) {
      return res.status(401).json({ message: 'Invalid API key' });
    }

    // Update last used timestamp
    apiKeyObj.lastUsedAt = new Date();
    await user.save();

    // Attach user to request for use in route handlers
    req.user = user;
    req.apiKey = apiKeyObj;

    // Check if the API key has the required permissions for this route
    // For now, we'll allow all authenticated API keys to proceed
    next();
  } catch (error) {
    res.status(500).json({ message: 'Authentication error' });
  }
};

// Middleware to check specific permissions
export const requireApiKeyPermission = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.apiKey) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Check if the API key has the required permission
    if (!req.apiKey.permissions.includes(requiredPermission) && 
        !req.apiKey.permissions.includes('admin')) {
      return res.status(403).json({ 
        message: `Permission denied: API key lacks ${requiredPermission} permission` 
      });
    }

    next();
  };
};