import express from 'express';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import User from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'admin' } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = new User({ name, email, password, role });
    await user.save();

    // Generate tokens
    const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRY || '15m'
    });
    const refreshToken = await RefreshToken.generateRefreshToken(
      user._id,
      req.get('User-Agent')
    );

    res.status(201).json({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate tokens
    const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRY || '15m'
    });
    const refreshToken = await RefreshToken.generateRefreshToken(
      user._id,
      req.get('User-Agent')
    );

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Google OAuth routes
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { session: false }),
  async (req, res) => {
    try {
      const user = req.user;

      // Generate tokens
      const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRY || '15m'
      });
      const refreshToken = await RefreshToken.generateRefreshToken(
        user._id,
        req.get('User-Agent')
      );

      // Redirect with tokens to frontend
      res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}&user=${encodeURIComponent(JSON.stringify({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }))}`);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// GitHub OAuth routes
router.get('/github',
  passport.authenticate('github', { scope: ['user:email'] })
);

router.get('/github/callback',
  passport.authenticate('github', { session: false }),
  async (req, res) => {
    try {
      const user = req.user;

      // Generate tokens
      const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRY || '15m'
      });
      const refreshToken = await RefreshToken.generateRefreshToken(
        user._id,
        req.get('User-Agent')
      );

      // Redirect with tokens to frontend
      res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}&user=${encodeURIComponent(JSON.stringify({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }))}`);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Refresh token endpoint
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    // Verify the refresh token
    const refreshTokenDoc = await RefreshToken.verifyRefreshToken(refreshToken);

    // Generate new access token
    const newAccessToken = jwt.sign(
      { id: refreshTokenDoc.userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '15m' }
    );

    // Generate new refresh token (rolling refresh)
    const newRefreshToken = await RefreshToken.generateRefreshToken(
      refreshTokenDoc.userId,
      req.get('User-Agent')
    );

    // Revoke the old refresh token
    await RefreshToken.revokeRefreshToken(refreshToken);

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    res.status(403).json({ message: error.message });
  }
});

// Logout endpoint
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      // In a real implementation, you might want to blacklist the access token
      // For now, we'll just revoke all refresh tokens for the user
      await RefreshToken.revokeAllUserTokens(req.user._id);
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      avatar: req.user.avatar
    }
  });
});

export default router;