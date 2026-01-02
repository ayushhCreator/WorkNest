import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';
import Workspace from '../models/Workspace.js';
import Team from '../models/Team.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      // Try to refresh the token
      return res.status(401).json({ 
        message: 'Access token expired', 
        refreshRequired: true 
      });
    } else {
      res.status(403).json({ message: 'Invalid token' });
    }
  }
};

export const authorizeRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
};

// Middleware to handle automatic token refresh if needed
export const handleTokenRefresh = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      // No token provided, let the authenticateToken middleware handle it
      return next();
    }

    try {
      // Try to verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');

      if (req.user) {
        return next();
      }
    } catch (verifyError) {
      if (verifyError.name === 'TokenExpiredError') {
        // Token is expired, check for refresh token in body or headers
        const refreshToken = req.body.refreshToken || req.query.refreshToken || req.headers['x-refresh-token'];

        if (refreshToken) {
          try {
            // Verify the refresh token
            const refreshTokenDoc = await RefreshToken.verifyRefreshToken(refreshToken);

            // Generate new access token
            const newAccessToken = jwt.sign(
              { id: refreshTokenDoc.userId },
              process.env.JWT_SECRET,
              { expiresIn: process.env.JWT_EXPIRY || '15m' }
            );

            // Generate new refresh token
            const newRefreshToken = await RefreshToken.generateRefreshToken(
              refreshTokenDoc.userId,
              req.get('User-Agent')
            );

            // Revoke the old refresh token
            await RefreshToken.revokeRefreshToken(refreshToken);

            // Add new tokens to the request for the response
            req.newAccessToken = newAccessToken;
            req.newRefreshToken = newRefreshToken;

            // Set the user in the request
            req.user = await User.findById(refreshTokenDoc.userId).select('-password');

            return next();
          } catch (refreshError) {
            return res.status(403).json({ message: 'Invalid refresh token' });
          }
        } else {
          return res.status(401).json({ message: 'Access token expired and no refresh token provided' });
        }
      } else {
        return res.status(403).json({ message: 'Invalid token' });
      }
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Middleware for workspace-based authorization
export const requireWorkspaceAccess = (level = 'read') => {
  return async (req, res, next) => {
    try {
      // Extract workspace ID from params or body
      const workspaceId = req.params.workspaceId || req.body.workspaceId || req.params.id;

      if (!workspaceId) {
        return res.status(400).json({ message: 'Workspace ID required' });
      }

      // Find the workspace and user's role
      const workspace = await Workspace.findById(workspaceId);
      if (!workspace) {
        return res.status(404).json({ message: 'Workspace not found' });
      }

      const member = workspace.members.find(m =>
        m.user.toString() === req.user._id.toString()
      );

      if (!member) {
        return res.status(403).json({ message: 'Not a member of this workspace' });
      }

      // Define role-based permissions
      const permissions = {
        'viewer': { read: true, write: false, admin: false },
        'member': { read: true, write: true, admin: false },
        'admin': { read: true, write: true, admin: true },
        'owner': { read: true, write: true, admin: true }
      };

      const userPermissions = permissions[member.role] || permissions.viewer;

      // Check if user has required permission level
      if (level === 'admin' && !userPermissions.admin) {
        return res.status(403).json({
          message: `Admin access required for this action. Your role: ${member.role}`
        });
      }

      if (level === 'write' && !userPermissions.write) {
        return res.status(403).json({
          message: `Write access required for this action. Your role: ${member.role}`
        });
      }

      if (level === 'read' && !userPermissions.read) {
        return res.status(403).json({
          message: `Read access required for this action. Your role: ${member.role}`
        });
      }

      // Attach member info to request for use in route handlers
      req.workspaceMember = member;
      req.workspace = workspace;

      next();
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
};

// Middleware for team-based authorization
export const requireTeamAccess = (level = 'read') => {
  return async (req, res, next) => {
    try {
      // Extract team ID from params or body
      const teamId = req.params.teamId || req.body.teamId || req.params.id;

      if (!teamId) {
        return res.status(400).json({ message: 'Team ID required' });
      }

      // Find the team and user's role
      const team = await Team.findById(teamId);
      if (!team) {
        return res.status(404).json({ message: 'Team not found' });
      }

      const member = team.members.find(m =>
        m.user.toString() === req.user._id.toString()
      );

      if (!member) {
        return res.status(403).json({ message: 'Not a member of this team' });
      }

      // Define role-based permissions
      const permissions = {
        'viewer': { read: true, write: false, admin: false },
        'member': { read: true, write: true, admin: false },
        'admin': { read: true, write: true, admin: true },
        'owner': { read: true, write: true, admin: true }
      };

      const userPermissions = permissions[member.role] || permissions.viewer;

      // Check if user has required permission level
      if (level === 'admin' && !userPermissions.admin) {
        return res.status(403).json({
          message: `Admin access required for this action. Your role: ${member.role}`
        });
      }

      if (level === 'write' && !userPermissions.write) {
        return res.status(403).json({
          message: `Write access required for this action. Your role: ${member.role}`
        });
      }

      if (level === 'read' && !userPermissions.read) {
        return res.status(403).json({
          message: `Read access required for this action. Your role: ${member.role}`
        });
      }

      // Attach member info to request for use in route handlers
      req.teamMember = member;
      req.team = team;

      next();
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
};