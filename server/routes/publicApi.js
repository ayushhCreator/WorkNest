import express from 'express';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import Cycle from '../models/Cycle.js';
import User from '../models/User.js';
import { authenticateApiKey, requireApiKeyPermission } from '../middleware/apiAuth.js';

const router = express.Router();

// Get all projects for authenticated user
router.get('/projects', authenticateToken, async (req, res) => {
  try {
    const projects = await Project.find({
      'members.user': req.user._id
    }).populate('members.user', 'name email');

    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a specific project by ID
router.get('/projects/:id', authenticateToken, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('members.user', 'name email')
      .populate('tasks', 'title description status');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Verify user has access to this project
    const hasAccess = project.members.some(member => 
      member.user.toString() === req.user._id.toString()
    );

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get tasks for a specific project
router.get('/projects/:projectId/tasks', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;

    // Verify user has access to the project
    const project = await Project.findById(projectId)
      .populate('members.user', 'name email');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const hasAccess = project.members.some(member => 
      member.user.toString() === req.user._id.toString()
    );

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const tasks = await Task.find({ project: projectId })
      .populate('assignee', 'name email')
      .populate('subtasks', 'title status')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a specific task by ID
router.get('/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('project', 'title')
      .populate('assignee', 'name email')
      .populate('subtasks', 'title status')
      .populate('dependencies.taskId', 'title status');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Verify user has access to the project
    const project = await Project.findById(task.project)
      .populate('members.user', 'name email');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const hasAccess = project.members.some(member => 
      member.user.toString() === req.user._id.toString()
    );

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new task (for authorized users only)
router.post('/projects/:projectId/tasks', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, assignee, status, priority, dueDate, storyPoints } = req.body;

    // Verify user has access to the project
    const project = await Project.findById(projectId)
      .populate('members.user', 'name email role');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const projectMember = project.members.find(member => 
      member.user.toString() === req.user._id.toString()
    );

    if (!projectMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Only allow creating tasks if user has write permissions
    if (projectMember.role === 'viewer') {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    // Check if assignee exists and is a project member
    if (assignee) {
      const assigneeExists = project.members.some(member =>
        member.user.toString() === assignee.toString()
      );
      
      if (!assigneeExists) {
        return res.status(400).json({ message: 'Assignee must be a project member' });
      }
    }

    const task = new Task({
      title,
      description,
      project: projectId,
      assignee,
      status: status || 'todo',
      priority: priority || 'medium',
      dueDate,
      storyPoints
    });

    await task.save();

    // Populate before returning
    await task.populate('project', 'title')
               .populate('assignee', 'name email');

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a task
router.put('/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Verify user has access to the project
    const project = await Project.findById(task.project)
      .populate('members.user', 'name email role');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const projectMember = project.members.find(member => 
      member.user.toString() === req.user._id.toString()
    );

    if (!projectMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Only allow updating tasks if user has write permissions
    if (projectMember.role === 'viewer') {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        task[key] = req.body[key];
      }
    });

    await task.save();

    // Populate before returning
    await task.populate('project', 'title')
               .populate('assignee', 'name email');

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a task
router.delete('/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Verify user has access to the project
    const project = await Project.findById(task.project)
      .populate('members.user', 'name email role');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const projectMember = project.members.find(member => 
      member.user.toString() === req.user._id.toString()
    );

    if (!projectMember || (projectMember.role === 'viewer' || projectMember.role === 'member')) {
      // Only admin/owner can delete
      return res.status(403).json({ message: 'Access denied' });
    }

    await Task.findByIdAndDelete(req.params.id);

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get cycles for a project
router.get('/projects/:projectId/cycles', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;

    // Verify user has access to the project
    const project = await Project.findById(projectId)
      .populate('members.user', 'name email');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const hasAccess = project.members.some(member => 
      member.user.toString() === req.user._id.toString()
    );

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const cycles = await Cycle.find({ project: projectId })
      .populate('owner', 'name email')
      .sort({ startDate: -1 });

    res.json(cycles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// API key management routes
// Get user's API keys
router.get('/api-keys', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('apiKeys');
    res.json(user.apiKeys);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Generate a new API key
router.post('/api-keys', authenticateToken, async (req, res) => {
  try {
    const { name, permissions } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'API key name is required' });
    }

    // Generate a unique API key
    const crypto = await import('crypto');
    const apiKey = 'wornest_' + crypto.default.randomBytes(32).toString('hex');

    const user = await User.findById(req.user._id);

    // Add new API key to user's keys
    user.apiKeys.push({
      key: apiKey,
      name,
      permissions: permissions || ['read']
    });

    await user.save();

    // Return the new API key (without the full list)
    res.status(201).json({
      key: apiKey,
      name,
      permissions: permissions || ['read'],
      createdAt: new Date()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Revoke an API key
router.delete('/api-keys/:keyId', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    // Find the API key by index (safely)
    const apiKeyIndex = user.apiKeys.findIndex(
      key => key._id.toString() === req.params.keyId
    );

    if (apiKeyIndex === -1) {
      return res.status(404).json({ message: 'API key not found' });
    }

    // Remove the API key
    user.apiKeys.splice(apiKeyIndex, 1);
    await user.save();

    res.json({ message: 'API key revoked successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;