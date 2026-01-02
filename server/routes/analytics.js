import express from 'express';
import mongoose from 'mongoose';
import Task from '../models/Task.js';
import Project from '../models/Project.js';
import Cycle from '../models/Cycle.js';
import User from '../models/User.js';
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

// Get velocity data for a cycle or project
router.get('/velocity', authenticateToken, async (req, res) => {
  try {
    const { cycleId, projectId, teamId, period } = req.query;

    // Build query based on provided parameters
    let query = {};
    if (cycleId) {
      query.cycle = cycleId;
    } else if (projectId) {
      const projectCycles = await Cycle.find({ project: projectId });
      query.cycle = { $in: projectCycles.map(c => c._id) };
    } else if (teamId) {
      const teamCycles = await Cycle.find({ team: teamId });
      query.cycle = { $in: teamCycles.map(c => c._id) };
    } else {
      return res.status(400).json({ message: 'Either cycleId, projectId, or teamId is required' });
    }

    // Calculate velocity based on completed story points
    const tasks = await Task.find(query)
      .populate('cycle', 'name startDate endDate')
      .populate('assignee', 'name');

    // Calculate velocity metrics
    const completedTasks = tasks.filter(task => task.status === 'done' && task.storyPoints);
    const completedPoints = completedTasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);

    // Group by assignee for team velocity
    const teamVelocity = completedTasks.reduce((acc, task) => {
      const assigneeId = task.assignee ? task.assignee._id : 'unassigned';
      const assigneeName = task.assignee ? task.assignee.name : 'Unassigned';

      if (!acc[assigneeId]) {
        acc[assigneeId] = {
          name: assigneeName,
          points: 0,
          tasks: 0
        };
      }

      acc[assigneeId].points += task.storyPoints || 0;
      acc[assigneeId].tasks += 1;

      return acc;
    }, {});

    res.json({
      totalCompletedPoints: completedPoints,
      totalCompletedTasks: completedTasks.length,
      averageTaskPoints: completedTasks.length ? completedPoints / completedTasks.length : 0,
      teamVelocity: Object.values(teamVelocity),
      tasks: completedTasks.map(task => ({
        id: task._id,
        title: task.title,
        points: task.storyPoints,
        assignee: task.assignee,
        completedAt: task.completedAt
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get burndown data for a cycle
router.get('/burndown/:cycleId', authenticateToken, async (req, res) => {
  try {
    const cycle = await Cycle.findById(req.params.cycleId);
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

    // Get all tasks in this cycle
    const tasks = await Task.find({ cycle: req.params.cycleId })
      .select('createdAt completedAt storyPoints status')
      .sort({ createdAt: 1 });

    // Calculate burndown data
    const startDate = new Date(cycle.startDate);
    const endDate = new Date(cycle.endDate);
    const totalPoints = tasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);

    // Generate daily burndown data points
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    const burndownData = [];

    // Calculate ideal burndown (straight line from total to 0)
    const idealPointsPerDay = totalPoints / days;
    let remainingPoints = totalPoints;
    let idealRemaining = totalPoints;

    for (let i = 0; i < days; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);

      // Calculate actual completed points up to this day
      const completedToday = tasks.filter(task =>
        task.completedAt &&
        new Date(task.completedAt).toDateString() === currentDate.toDateString()
      );

      // Subtract completed points for this day
      const completedPointsToday = completedToday.reduce((sum, task) => sum + (task.storyPoints || 0), 0);
      remainingPoints -= completedPointsToday;

      // Calculate ideal remaining for this day
      idealRemaining = Math.max(0, totalPoints - (idealPointsPerDay * i));

      burndownData.push({
        date: currentDate.toISOString().split('T')[0],
        actualRemaining: Math.max(0, remainingPoints),
        idealRemaining: Math.round(idealRemaining),
        completedToday: completedPointsToday
      });
    }

    res.json({
      cycle: {
        name: cycle.name,
        startDate: cycle.startDate,
        endDate: cycle.endDate,
        totalPoints: totalPoints
      },
      burndownData
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get sprint/cycle progress
router.get('/cycle/:cycleId', authenticateToken, async (req, res) => {
  try {
    const cycle = await Cycle.findById(req.params.cycleId)
      .populate('project', 'title')
      .populate('workspace', 'name');

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

    // Get tasks for this cycle
    const tasks = await Task.find({ cycle: req.params.cycleId })
      .populate('assignee', 'name email');

    // Calculate cycle metrics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'done').length;
    const inProgressTasks = tasks.filter(task => task.status === 'inprogress').length;

    // Calculate story points metrics
    const totalPoints = tasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);
    const completedPoints = tasks
      .filter(task => task.status === 'done')
      .reduce((sum, task) => sum + (task.storyPoints || 0), 0);
    const inProgressPoints = tasks
      .filter(task => task.status === 'inprogress')
      .reduce((sum, task) => sum + (task.storyPoints || 0), 0);

    // Calculate progress percentage
    const progressPercentage = totalPoints ? (completedPoints / totalPoints) * 100 : 0;

    // Calculate days remaining
    const now = new Date();
    const endDate = new Date(cycle.endDate);
    const daysRemaining = Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)));

    res.json({
      cycle: {
        name: cycle.name,
        status: cycle.status,
        startDate: cycle.startDate,
        endDate: cycle.endDate,
        daysRemaining,
        project: cycle.project,
        workspace: cycle.workspace
      },
      metrics: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        totalPoints,
        completedPoints,
        inProgressPoints,
        progressPercentage: Math.round(progressPercentage),
        completionRate: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0
      },
      tasks
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get lead time and cycle time analytics
router.get('/lead-cycle-time/:projectId', authenticateToken, async (req, res) => {
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

    // Get all completed tasks for this project
    const completedTasks = await Task.find({
      project: projectId,
      status: 'done',
      createdAt: { $exists: true },
      completedAt: { $exists: true }
    });

    // Calculate lead time (time from creation to completion) and cycle time (time from in-progress to completion)
    const analytics = completedTasks.map(task => {
      const created = new Date(task.createdAt);
      const completed = new Date(task.completedAt);

      // Find when task moved to in-progress for cycle time calculation
      let inProgressAt = created; // Default to creation date if no specific in-progress date

      // In a real implementation, we'd track actual status change dates
      // For now, we'll calculate from creation to completion as lead time
      // and from first status change out of 'todo' as cycle time

      const leadTimeMs = completed - created; // Total time
      const leadTimeDays = leadTimeMs / (1000 * 60 * 60 * 24); // Convert to days

      return {
        taskId: task._id,
        title: task.title,
        leadTime: leadTimeDays, // in days
        cycleTime: leadTimeDays, // placeholder - would track actual cycle time in real implementation
        created: created,
        completed: completed
      };
    });

    // Calculate overall averages
    if (analytics.length > 0) {
      const totalLeadTime = analytics.reduce((sum, task) => sum + task.leadTime, 0);
      const avgLeadTime = totalLeadTime / analytics.length;

      const totalCycleTime = analytics.reduce((sum, task) => sum + task.cycleTime, 0);
      const avgCycleTime = totalCycleTime / analytics.length;

      // Calculate percentiles (for demonstration, simplified)
      const leadTimes = analytics.map(t => t.leadTime).sort((a, b) => a - b);
      const cycleTimes = analytics.map(t => t.cycleTime).sort((a, b) => a - b);

      const medianLeadTime = leadTimes[Math.floor(leadTimes.length / 2)];
      const medianCycleTime = cycleTimes[Math.floor(cycleTimes.length / 2)];

      res.json({
        project: {
          id: project._id,
          title: project.title
        },
        summary: {
          totalTasks: analytics.length,
          avgLeadTime: Number(avgLeadTime.toFixed(2)),
          avgCycleTime: Number(avgCycleTime.toFixed(2)),
          medianLeadTime: Number(medianLeadTime.toFixed(2)),
          medianCycleTime: Number(medianCycleTime.toFixed(2))
        },
        tasks: analytics
      });
    } else {
      res.json({
        project: {
          id: project._id,
          title: project.title
        },
        summary: {
          totalTasks: 0,
          avgLeadTime: 0,
          avgCycleTime: 0,
          medianLeadTime: 0,
          medianCycleTime: 0
        },
        tasks: []
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get time-to-completion by assignee
router.get('/time-completion-by-assignee/:projectId', authenticateToken, async (req, res) => {
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

    // Get completed tasks grouped by assignee
    const completedTasks = await Task.aggregate([
      {
        $match: {
          project: mongoose.Types.ObjectId(projectId),
          status: 'done',
          assignee: { $exists: true },
          createdAt: { $exists: true },
          completedAt: { $exists: true }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'assignee',
          foreignField: '_id',
          as: 'assigneeInfo'
        }
      },
      {
        $addFields: {
          assigneeName: { $arrayElemAt: ['$assigneeInfo.name', 0] },
          leadTime: {
            $divide: [
              { $subtract: ['$completedAt', '$createdAt'] },
              1000 * 60 * 60 * 24 // Convert milliseconds to days
            ]
          }
        }
      },
      {
        $group: {
          _id: '$assignee',
          assigneeName: { $first: '$assigneeName' },
          tasksCompleted: { $sum: 1 },
          avgLeadTime: { $avg: '$leadTime' },
          totalLeadTime: { $sum: '$leadTime' },
          minLeadTime: { $min: '$leadTime' },
          maxLeadTime: { $max: '$leadTime' }
        }
      },
      { $sort: { tasksCompleted: -1 } }
    ]);

    res.json({
      project: {
        id: project._id,
        title: project.title
      },
      assigneeAnalytics: completedTasks
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;