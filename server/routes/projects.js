import express from 'express';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Get all projects for user
router.get('/', async (req, res) => {
  try {
    const { status = 'active', search } = req.query;
    
    let query = {
      $or: [
        { owner: req.user._id },
        { 'members.user': req.user._id }
      ]
    };
    
    if (status !== 'all') {
      query.status = status;
    }
    
    if (search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      });
    }
    
    const projects = await Project.find(query)
      .populate('owner', 'name email')
      .populate('members.user', 'name email')
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create project
router.post('/', async (req, res) => {
  try {
    const { title, description, color } = req.body;

    const project = new Project({
      title,
      description,
      owner: req.user._id,
      color: color || '#3B82F6',
      members: [{ user: req.user._id, role: 'owner' }],
      columns: [
        { id: uuidv4(), title: 'To Do', taskIds: [] },
        { id: uuidv4(), title: 'In Progress', taskIds: [] },
        { id: uuidv4(), title: 'Done', taskIds: [] }
      ]
    });

    await project.save();
    await project.populate('owner', 'name email');
    await project.populate('members.user', 'name email');

    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get project by ID with activity logs
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email')
      .populate({
        path: 'tasks',
        populate: {
          path: 'assignee',
          select: 'name email'
        }
      });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is a member
    const isMember = project.members.some(member => 
      member.user._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get recent activity logs
    const activityLogs = await ActivityLog.find({ project: req.params.id })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ ...project.toObject(), activityLogs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update project
router.put('/:id', async (req, res) => {
  try {
    const { title, description, color, status } = req.body;
    
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user has permission to update
    const userMember = project.members.find(member => 
      member.user.toString() === req.user._id.toString()
    );
    
    if (!userMember || !['owner', 'admin'].includes(userMember.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (title) project.title = title;
    if (description !== undefined) project.description = description;
    if (color) project.color = color;
    if (status) project.status = status;

    await project.save();
    await project.populate('owner', 'name email');
    await project.populate('members.user', 'name email');

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update member role
router.put('/:id/members/:userId/role', async (req, res) => {
  try {
    const { role } = req.body;
    
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user has permission
    const userMember = project.members.find(member => 
      member.user.toString() === req.user._id.toString()
    );
    
    if (!userMember || userMember.role !== 'owner') {
      return res.status(403).json({ message: 'Only project owners can change roles' });
    }

    // Find and update member role
    const memberToUpdate = project.members.find(member => 
      member.user.toString() === req.params.userId
    );
    
    if (!memberToUpdate) {
      return res.status(404).json({ message: 'Member not found' });
    }

    // Prevent changing owner role
    if (memberToUpdate.role === 'owner') {
      return res.status(400).json({ message: 'Cannot change owner role' });
    }

    memberToUpdate.role = role;
    await project.save();
    await project.populate('members.user', 'name email');

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Remove member from project
router.delete('/:id/members/:userId', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user has permission
    const userMember = project.members.find(member => 
      member.user.toString() === req.user._id.toString()
    );
    
    if (!userMember || !['owner', 'admin'].includes(userMember.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Prevent removing owner
    const memberToRemove = project.members.find(member => 
      member.user.toString() === req.params.userId
    );
    
    if (memberToRemove && memberToRemove.role === 'owner') {
      return res.status(400).json({ message: 'Cannot remove project owner' });
    }

    // Remove member
    project.members = project.members.filter(member => 
      member.user.toString() !== req.params.userId
    );
    
    await project.save();
    await project.populate('members.user', 'name email');

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete project
router.delete('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is project owner
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only project owner can delete the project' });
    }

    // Delete all tasks associated with the project
    await Task.deleteMany({ project: req.params.id });
    
    // Delete all activity logs
    await ActivityLog.deleteMany({ project: req.params.id });
    
    // Delete the project
    await Project.findByIdAndDelete(req.params.id);

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;