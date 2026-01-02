import express from 'express';
import Cycle from '../models/Cycle.js';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import Workspace from '../models/Workspace.js';
import Team from '../models/Team.js';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Create cycle
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, project, team, startDate, endDate, settings } = req.body;

    // Check if user has access to the project
    const projectDoc = await Project.findById(project).populate('members.user workspace');
    if (!projectDoc) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const projectMember = projectDoc.members.find(member =>
      member.user.toString() === req.user._id.toString()
    );

    if (!projectMember) {
      return res.status(403).json({ message: 'Access denied to project' });
    }

    // Validate dates
    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ message: 'Start date must be before end date' });
    }

    const cycle = new Cycle({
      name,
      description,
      project,
      team,
      workspace: projectDoc.workspace._id,
      owner: req.user._id,
      startDate,
      endDate,
      settings
    });

    await cycle.save();
    await cycle.populate('project', 'title')
               .populate('workspace', 'name')
               .populate('team', 'name')
               .populate('owner', 'name email');

    res.status(201).json(cycle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get cycles for a project
router.get('/project/:projectId', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;

    // Check if user has access to the project
    const project = await Project.findById(projectId).populate('members.user');
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isMember = project.members.some(member =>
      member.user._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get all cycles for this project
    const cycles = await Cycle.find({ project: projectId })
      .populate('owner', 'name email')
      .populate('project', 'title')
      .populate('workspace', 'name')
      .populate('team', 'name')
      .sort({ startDate: -1 });

    res.json(cycles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get cycle by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const cycle = await Cycle.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('project', 'title')
      .populate('workspace', 'name')
      .populate('team', 'name')
      .populate('tasks', 'title taskId status storyPoints');

    if (!cycle) {
      return res.status(404).json({ message: 'Cycle not found' });
    }

    // Check if user has access to the project
    const project = await Project.findById(cycle.project).populate('members.user');
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isMember = project.members.some(member =>
      member.user._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(cycle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update cycle
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const cycle = await Cycle.findById(req.params.id);
    if (!cycle) {
      return res.status(404).json({ message: 'Cycle not found' });
    }

    // Check if user has access to the project
    const project = await Project.findById(cycle.project).populate('members.user');
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const projectMember = project.members.find(member =>
      member.user._id.toString() === req.user._id.toString()
    );

    if (!projectMember || (projectMember.role !== 'admin' && projectMember.role !== 'owner')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { name, description, startDate, endDate, status, settings } = req.body;

    // Validate dates if they are being updated
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ message: 'Start date must be before end date' });
    }

    cycle.name = name || cycle.name;
    cycle.description = description || cycle.description;
    cycle.startDate = startDate || cycle.startDate;
    cycle.endDate = endDate || cycle.endDate;
    cycle.status = status || cycle.status;
    cycle.settings = settings || cycle.settings;

    await cycle.save();
    await cycle.populate('project', 'title')
               .populate('workspace', 'name')
               .populate('team', 'name')
               .populate('owner', 'name email');

    res.json(cycle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete cycle
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const cycle = await Cycle.findById(req.params.id);
    if (!cycle) {
      return res.status(404).json({ message: 'Cycle not found' });
    }

    // Check if user has access to the project
    const project = await Project.findById(cycle.project).populate('members.user');
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const projectMember = project.members.find(member =>
      member.user._id.toString() === req.user._id.toString()
    );

    if (!projectMember || (projectMember.role !== 'admin' && projectMember.role !== 'owner')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Cycle.findByIdAndDelete(req.params.id);

    res.json({ message: 'Cycle deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add task to cycle
router.post('/:id/tasks', authenticateToken, async (req, res) => {
  try {
    const cycle = await Cycle.findById(req.params.id);
    if (!cycle) {
      return res.status(404).json({ message: 'Cycle not found' });
    }

    // Check if user has access to the project
    const project = await Project.findById(cycle.project).populate('members.user');
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const projectMember = project.members.find(member =>
      member.user._id.toString() === req.user._id.toString()
    );

    if (!projectMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { taskId } = req.body;

    // Verify task exists and belongs to the same project
    const task = await Task.findById(taskId);
    if (!task || task.project.toString() !== cycle.project.toString()) {
      return res.status(404).json({ message: 'Task not found in this project' });
    }

    // Check if task is already in this cycle
    if (cycle.tasks.includes(taskId)) {
      return res.status(400).json({ message: 'Task already exists in this cycle' });
    }

    // Add task to cycle
    cycle.tasks.push(taskId);
    await cycle.save();

    // Update task to reference this cycle if needed
    await Task.findByIdAndUpdate(taskId, { cycle: cycle._id });

    await cycle.populate('tasks', 'title taskId status storyPoints');

    res.status(201).json({
      message: 'Task added to cycle successfully',
      cycle
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Remove task from cycle
router.delete('/:id/tasks/:taskId', authenticateToken, async (req, res) => {
  try {
    const cycle = await Cycle.findById(req.params.id);
    if (!cycle) {
      return res.status(404).json({ message: 'Cycle not found' });
    }

    // Check if user has access to the project
    const project = await Project.findById(cycle.project).populate('members.user');
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const projectMember = project.members.find(member =>
      member.user._id.toString() === req.user._id.toString()
    );

    if (!projectMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Remove task from cycle
    cycle.tasks = cycle.tasks.filter(task => 
      task.toString() !== req.params.taskId
    );
    await cycle.save();

    // Remove cycle reference from task
    await Task.findByIdAndUpdate(req.params.taskId, { $unset: { cycle: 1 } });

    await cycle.populate('tasks', 'title taskId status storyPoints');

    res.json({
      message: 'Task removed from cycle successfully',
      cycle
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Start cycle
router.patch('/:id/start', authenticateToken, async (req, res) => {
  try {
    const cycle = await Cycle.findById(req.params.id);
    if (!cycle) {
      return res.status(404).json({ message: 'Cycle not found' });
    }

    // Check if user has access to the project
    const project = await Project.findById(cycle.project).populate('members.user');
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const projectMember = project.members.find(member =>
      member.user._id.toString() === req.user._id.toString()
    );

    if (!projectMember || (projectMember.role !== 'admin' && projectMember.role !== 'owner')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Can only start a cycle if it's in planning status
    if (cycle.status !== 'planning') {
      return res.status(400).json({ message: 'Can only start a cycle that is in planning status' });
    }

    // Check if current date is within the cycle date range
    const now = new Date();
    if (now < new Date(cycle.startDate)) {
      return res.status(400).json({ message: 'Cannot start cycle before start date' });
    }

    cycle.status = 'active';
    await cycle.save();

    res.json({
      message: 'Cycle started successfully',
      cycle
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Complete cycle
router.patch('/:id/complete', authenticateToken, async (req, res) => {
  try {
    const cycle = await Cycle.findById(req.params.id);
    if (!cycle) {
      return res.status(404).json({ message: 'Cycle not found' });
    }

    // Check if user has access to the project
    const project = await Project.findById(cycle.project).populate('members.user');
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const projectMember = project.members.find(member =>
      member.user._id.toString() === req.user._id.toString()
    );

    if (!projectMember || (projectMember.role !== 'admin' && projectMember.role !== 'owner')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Can only complete a cycle if it's active
    if (cycle.status !== 'active') {
      return res.status(400).json({ message: 'Can only complete an active cycle' });
    }

    // Check if current date is after the end date
    const now = new Date();
    if (now < new Date(cycle.endDate)) {
      // This is fine - early completion is allowed
    }

    cycle.status = 'completed';
    await cycle.save();

    // If auto-rollover is enabled, move incomplete tasks to the next cycle
    if (cycle.settings?.autoRollover) {
      // In a real implementation, we'd move incomplete tasks to the next cycle
      // For now, we'll skip this part
    }

    res.json({
      message: 'Cycle completed successfully',
      cycle
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;