import express from 'express';
import Notification from '../models/Notification.js';
import NotificationPreference from '../models/NotificationPreference.js';
import User from '../models/User.js';
import Project from '../models/Project.js';
import Workspace from '../models/Workspace.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get user notifications
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, unread } = req.query;
    
    const query = { recipient: req.user._id };
    if (unread === 'true') {
      query.read = false;
    }
    
    const notifications = await Notification.find(query)
      .populate('sender', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      read: false
    });
    
    res.json({
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      unreadCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark notification as read
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { read: true, readAt: new Date() },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark all notifications as read
router.put('/mark-all-read', authenticateToken, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { read: true, readAt: new Date() }
    );
    
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete notification
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id
    });
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user's notification preferences
router.get('/preferences', authenticateToken, async (req, res) => {
  try {
    let preferences = await NotificationPreference.findOne({ user: req.user._id });

    if (!preferences) {
      // Create default preferences if they don't exist
      preferences = new NotificationPreference({
        user: req.user._id
      });
      await preferences.save();
    }

    res.json(preferences);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user's notification preferences
router.put('/preferences', authenticateToken, async (req, res) => {
  try {
    const { preferences, general, workspaceSettings, teamSettings } = req.body;

    let notificationPreferences = await NotificationPreference.findOneAndUpdate(
      { user: req.user._id },
      {
        preferences,
        general,
        workspaceSettings,
        teamSettings
      },
      { new: true, upsert: true }
    );

    res.json(notificationPreferences);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get rule-based notifications (notifications based on custom rules)
router.get('/rules', authenticateToken, async (req, res) => {
  try {
    // This would be expanded to include more complex rule systems
    const userPrefs = await NotificationPreference.findOne({ user: req.user._id });

    res.json({
      message: 'Rule-based notification system',
      preferences: userPrefs,
      rules: [
        {
          id: 'assignment-rule',
          name: 'Task Assignment',
          description: 'Notify when assigned to a task',
          conditions: [
            { type: 'task_assigned', enabled: true }
          ],
          actions: [
            { channel: 'email', enabled: userPrefs?.preferences?.task_assigned?.email || true },
            { channel: 'push', enabled: userPrefs?.preferences?.task_assigned?.push || true },
            { channel: 'in_app', enabled: userPrefs?.preferences?.task_assigned?.in_app || true }
          ]
        },
        {
          id: 'comment-rule',
          name: 'Task Comments',
          description: 'Notify when someone comments on your tasks',
          conditions: [
            { type: 'task_comment', enabled: true }
          ],
          actions: [
            { channel: 'email', enabled: userPrefs?.preferences?.task_comment?.email || true },
            { channel: 'push', enabled: userPrefs?.preferences?.task_comment?.push || true },
            { channel: 'in_app', enabled: userPrefs?.preferences?.task_comment?.in_app || true }
          ]
        }
      ]
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;