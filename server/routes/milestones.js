import express from 'express';
import Milestone from '../models/Milestone.js';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import Cycle from '../models/Cycle.js';
import Workspace from '../models/Workspace.js';
import Team from '../models/Team.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Create milestone
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, project, team, dueDate, tags, priority } = req.body;

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

    const milestone = new Milestone({
      title,
      description,
      project,
      team,
      workspace: projectDoc.workspace._id,
      owner: req.user._id,
      dueDate,
      tags,
      priority
    });

    await milestone.save();
    await milestone.populate('project', 'title')
                  .populate('workspace', 'name')
                  .populate('team', 'name')
                  .populate('owner', 'name email');

    res.status(201).json(milestone);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get milestones for a project
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

    const milestones = await Milestone.find({ project: projectId })
      .populate('owner', 'name email')
      .populate('project', 'title')
      .populate('workspace', 'name')
      .populate('team', 'name')
      .populate('tasks', 'title status taskId')
      .sort({ dueDate: 1 });

    res.json(milestones);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get milestone by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const milestone = await Milestone.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('project', 'title')
      .populate('workspace', 'name')
      .populate('team', 'name')
      .populate('tasks', 'title status taskId storyPoints')
      .populate('dependencies', 'title status')
      .populate('parent', 'title status');

    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found' });
    }

    // Check if user has access to the project
    const project = await Project.findById(milestone.project).populate('members.user');
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isMember = project.members.some(member =>
      member.user._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(milestone);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update milestone
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const milestone = await Milestone.findById(req.params.id);
    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found' });
    }

    // Check if user has access to the project
    const project = await Project.findById(milestone.project).populate('members.user');
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const projectMember = project.members.find(member =>
      member.user._id.toString() === req.user._id.toString()
    );

    if (!projectMember || (projectMember.role !== 'admin' && projectMember.role !== 'owner')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { title, description, dueDate, status, progress, tags, priority } = req.body;

    // Update fields
    if (title) milestone.title = title;
    if (description) milestone.description = description;
    if (dueDate) milestone.dueDate = dueDate;
    if (status) milestone.status = status;
    if (progress !== undefined) milestone.progress = progress;
    if (tags) milestone.tags = tags;
    if (priority) milestone.priority = priority;

    // Update status based on progress
    if (progress === 100 && milestone.status !== 'completed') {
      milestone.status = 'completed';
      milestone.completedAt = new Date();
    } else if (progress > 0 && progress < 100 && milestone.status !== 'completed') {
      milestone.status = 'in_progress';
    } else if (progress === 0 && milestone.status !== 'completed') {
      milestone.status = 'not_started';
    }

    // Check if milestone is delayed
    if (milestone.status !== 'completed' && new Date() > new Date(milestone.dueDate)) {
      milestone.status = 'delayed';
    }

    await milestone.save();
    await milestone.populate('project', 'title')
                  .populate('workspace', 'name')
                  .populate('team', 'name')
                  .populate('owner', 'name email');

    res.json(milestone);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete milestone
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const milestone = await Milestone.findById(req.params.id);
    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found' });
    }

    // Check if user has access to the project
    const project = await Project.findById(milestone.project).populate('members.user');
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const projectMember = project.members.find(member =>
      member.user._id.toString() === req.user._id.toString()
    );

    if (!projectMember || (projectMember.role !== 'admin' && projectMember.role !== 'owner')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Milestone.findByIdAndDelete(req.params.id);

    res.json({ message: 'Milestone deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add task to milestone
router.post('/:id/tasks', authenticateToken, async (req, res) => {
  try {
    const milestone = await Milestone.findById(req.params.id);
    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found' });
    }

    // Check if user has access to the project
    const project = await Project.findById(milestone.project).populate('members.user');
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
    if (!task || task.project.toString() !== milestone.project.toString()) {
      return res.status(404).json({ message: 'Task not found in this project' });
    }

    // Check if task is already in this milestone
    if (milestone.tasks.includes(taskId)) {
      return res.status(400).json({ message: 'Task already exists in this milestone' });
    }

    // Add task to milestone
    milestone.tasks.push(taskId);
    await milestone.save();

    // Update task to reference this milestone if needed
    await Task.findByIdAndUpdate(taskId, { milestone: milestone._id });

    await milestone.populate('tasks', 'title taskId status storyPoints');

    res.status(201).json({
      message: 'Task added to milestone successfully',
      milestone
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Remove task from milestone
router.delete('/:id/tasks/:taskId', authenticateToken, async (req, res) => {
  try {
    const milestone = await Milestone.findById(req.params.id);
    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found' });
    }

    // Check if user has access to the project
    const project = await Project.findById(milestone.project).populate('members.user');
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const projectMember = project.members.find(member =>
      member.user._id.toString() === req.user._id.toString()
    );

    if (!projectMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Remove task from milestone
    milestone.tasks = milestone.tasks.filter(task => 
      task.toString() !== req.params.taskId
    );
    await milestone.save();

    // Remove milestone reference from task
    await Task.findByIdAndUpdate(req.params.taskId, { $unset: { milestone: 1 } });

    await milestone.populate('tasks', 'title taskId status storyPoints');

    res.json({
      message: 'Task removed from milestone successfully',
      milestone
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get project timeline (milestones and cycles)
router.get('/timeline/:projectId', authenticateToken, async (req, res) => {
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

    // Get all milestones and cycles for the project
    const [milestones, cycles] = await Promise.all([
      Milestone.find({ project: projectId })
        .populate('owner', 'name email')
        .select('title description dueDate completedAt status progress priority createdAt'),
      Cycle.find({ project: projectId })
        .populate('owner', 'name email')
        .select('name description startDate endDate status createdAt')
    ]);

    // Combine and sort timeline items by date
    const timelineData = [
      ...milestones.map(m => ({
        ...m.toObject(),
        type: 'milestone',
        date: m.dueDate
      })),
      ...cycles.map(c => ({
        ...c.toObject(),
        type: 'cycle',
        title: c.name,
        date: c.endDate // Use end date for positioning in timeline
      }))
    ].sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({
      timeline: timelineData,
      summary: {
        totalMilestones: milestones.length,
        totalCycles: cycles.length,
        completedMilestones: milestones.filter(m => m.status === 'completed').length,
        activeCycles: cycles.filter(c => c.status === 'active').length
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;