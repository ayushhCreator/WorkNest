import express from 'express';
import Task from '../models/Task.js';
import Project from '../models/Project.js';
import ActivityLog from '../models/ActivityLog.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get project analytics
router.get('/project/:projectId', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { timeframe = '30' } = req.query; // days
    
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if user is a member
    const isMember = project.members.some(member => 
      member.user.toString() === req.user._id.toString()
    );
    
    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeframe));
    
    // Task statistics
    const taskStats = await Task.aggregate([
      { $match: { project: project._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Priority distribution
    const priorityStats = await Task.aggregate([
      { $match: { project: project._id } },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Tasks by assignee
    const assigneeStats = await Task.aggregate([
      { $match: { project: project._id, assignee: { $exists: true } } },
      {
        $group: {
          _id: '$assignee',
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          name: '$user.name',
          email: '$user.email',
          total: 1,
          completed: 1,
          pending: { $subtract: ['$total', '$completed'] }
        }
      }
    ]);
    
    // Task completion over time
    const completionTrend = await Task.aggregate([
      {
        $match: {
          project: project._id,
          completedAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$completedAt'
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);
    
    // Overdue tasks
    const overdueTasks = await Task.countDocuments({
      project: project._id,
      dueDate: { $lt: new Date() },
      status: { $ne: 'done' }
    });
    
    // Recent activity
    const recentActivity = await ActivityLog.find({
      project: project._id,
      createdAt: { $gte: startDate }
    })
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .limit(10);
    
    res.json({
      taskStats: taskStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, { todo: 0, inprogress: 0, done: 0 }),
      priorityStats: priorityStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, { low: 0, medium: 0, high: 0, urgent: 0 }),
      assigneeStats,
      completionTrend,
      overdueTasks,
      recentActivity,
      totalTasks: await Task.countDocuments({ project: project._id }),
      totalMembers: project.members.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user analytics
router.get('/user', authenticateToken, async (req, res) => {
  try {
    const { timeframe = '30' } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeframe));
    
    // User's task statistics
    const userTasks = await Task.aggregate([
      { $match: { assignee: req.user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Tasks completed over time
    const completionTrend = await Task.aggregate([
      {
        $match: {
          assignee: req.user._id,
          completedAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$completedAt'
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);
    
    // Projects user is involved in
    const userProjects = await Project.find({
      'members.user': req.user._id
    }).select('title members');
    
    res.json({
      taskStats: userTasks.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, { todo: 0, inprogress: 0, done: 0 }),
      completionTrend,
      totalProjects: userProjects.length,
      overdueTasks: await Task.countDocuments({
        assignee: req.user._id,
        dueDate: { $lt: new Date() },
        status: { $ne: 'done' }
      })
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;