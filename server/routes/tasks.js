import express from 'express';
import Task from '../models/Task.js';
import Project from '../models/Project.js';
import { upload, uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary.js';
import { io } from '../server.js';
import { generateTaskId } from '../utils/idGenerator.js';
import { cache, clearCache } from '../middleware/cache.js';

import {
  notifyTaskAssigned,
  notifyTaskComment,
  notifyTaskStatusChanged,
  createNotification
} from '../utils/notifications.js';
import {
  logTaskCreated,
  logTaskMoved,
  logCommentAdded,
  logActivity
} from '../utils/activityLogger.js';

const router = express.Router();

// Get tasks for project with search and filters
router.get('/project/:projectId', cache(300), async (req, res) => {
  try {
    const { 
      search, 
      assignee, 
      status, 
      priority, 
      dueDateFrom, 
      dueDateTo,
      page = 1,
      limit = 50
    } = req.query;
    
    let query = { project: req.params.projectId };
    
    // Search in title and description
    if (search) {
      query.$text = { $search: search };
    }
    
    // Filter by assignee
    if (assignee && assignee !== 'all') {
      query.assignee = assignee;
    }
    
    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Filter by priority
    if (priority && priority !== 'all') {
      query.priority = priority;
    }
    
    // Filter by due date range
    if (dueDateFrom || dueDateTo) {
      query.dueDate = {};
      if (dueDateFrom) query.dueDate.$gte = new Date(dueDateFrom);
      if (dueDateTo) query.dueDate.$lte = new Date(dueDateTo);
    }
    
    const tasks = await Task.find(query)
      .populate('assignee', 'name email')
      .populate('comments.user', 'name email')
      .populate('attachments.uploadedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Task.countDocuments(query);
    
    res.json({
      tasks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create task
router.post('/', async (req, res) => {
  try {
    const { title, description, project, assignee, priority, dueDate, columnId, estimatedHours, storyPoints, parentTask } = req.body;

    // Check if project exists and user is a member
    const projectDoc = await Project.findById(project).populate('members.user');
    if (!projectDoc) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isMember = projectDoc.members.some(member =>
      member.user._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Generate a unique task ID
    const taskId = await generateTaskId(project);

    // If this is a subtask, validate that the parent task exists and belongs to the same project
    if (parentTask) {
      const parent = await Task.findById(parentTask);
      if (!parent || parent.project.toString() !== project.toString()) {
        return res.status(400).json({ message: 'Parent task does not exist in this project' });
      }
    }

    const task = new Task({
      title,
      description,
      taskId,
      project,
      assignee,
      priority,
      dueDate,
      columnId,
      estimatedHours,
      storyPoints,
      parentTask
    });

    await task.save();
    await task.populate('assignee', 'name email');

    // If this is a subtask, add it to the parent task's subtasks array
    if (parentTask) {
      await Task.findByIdAndUpdate(parentTask, {
        $push: { subtasks: task._id }
      });
    }

    // Log activity
    await logTaskCreated(task, req.user);

    // Notify assignee
    if (assignee && assignee !== req.user._id.toString()) {
      await notifyTaskAssigned(task, req.user._id);
    }

    // Emit real-time update
    io.to(project).emit('task-created', task);

    // Clear cache for all users viewing this project
    await clearCache(`*:*/api/tasks/project/${project}`);

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update task
router.put('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('dependencies.taskId');
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user is project member
    const project = await Project.findById(task.project).populate('members.user');
    const isMember = project.members.some(member =>
      member.user._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const oldStatus = task.status;
    const oldAssignee = task.assignee;

    // Check if trying to move a task to 'done' but it has blocking dependencies that are not done
    if (req.body.status === 'done') {
      const blockingDependencies = task.dependencies.filter(dep =>
        dep.type === 'blocking' && dep.taskId.status !== 'done'
      );

      if (blockingDependencies.length > 0) {
        return res.status(400).json({
          message: 'Cannot complete task. Blocking dependencies are not completed',
          blockingTasks: blockingDependencies.map(dep => dep.taskId.title)
        });
      }
    }

    // Update task
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        task[key] = req.body[key];
      }
    });

    // Set completion date if task is marked as done
    if (req.body.status === 'done' && oldStatus !== 'done') {
      task.completedAt = new Date();
    } else if (req.body.status !== 'done' && oldStatus === 'done') {
      task.completedAt = undefined;
    }

    await task.save();
    await task.populate('assignee', 'name email');
    await task.populate('dependencies.taskId', 'title status');

    // Log status change
    if (oldStatus !== task.status) {
      await logTaskMoved(task, req.user, oldStatus, task.status);

      // Notify about status change
      if (task.assignee && task.assignee._id.toString() !== req.user._id.toString()) {
        await notifyTaskStatusChanged(task, req.user._id, oldStatus, task.status);
      }
    }

    // Notify new assignee
    if (req.body.assignee && req.body.assignee !== oldAssignee?.toString() && req.body.assignee !== req.user._id.toString()) {
      await notifyTaskAssigned(task, req.user._id);
    }

    // Emit real-time update
    io.to(task.project.toString()).emit('task-updated', task);

    // Clear cache
    await clearCache(`*:*/api/tasks/project/${task.project}`);

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Upload attachment - UPDATED VERSION
router.post('/:id/attachments', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const task = await Task.findById(req.params.id).populate('project');
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check if user has permission to upload to this task
    const project = await Project.findById(task.project._id);
    const userRole = project.members.find(member => 
      member.user.toString() === req.user._id.toString()
    )?.role;

    if (!userRole || userRole === 'viewer') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Check Project Settings
    if (userRole !== 'admin' && project.settings && project.settings.allowFileUploads === false) {
      return res.status(403).json({ error: 'File uploads are disabled for this project' });
    }

    // Upload file to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'worknest-attachments',
      resource_type: 'auto'
    });

    // Create attachment object
    const attachment = {
      filename: req.file.originalname,
      originalName: req.file.originalname,
      url: result.secure_url,
      publicId: result.public_id,
      size: req.file.size,
      mimetype: req.file.mimetype,
      uploadedBy: req.user._id,
      uploadedAt: new Date()
    };

    // Add attachment to task
    task.attachments.push(attachment);
    await task.save();
    await task.populate('attachments.uploadedBy', 'name email');

    // Log activity
    await logActivity({
      project: task.project._id,
      user: req.user._id,
      action: 'file_uploaded',
      description: `uploaded ${req.file.originalname} to task "${task.title}"`,
      metadata: {
        taskId: task._id,
        taskTitle: task.title,
        filename: req.file.originalname,
        fileSize: req.file.size
      }
    });

    // Create notification for task assignee (if different from uploader)
    if (task.assignee && task.assignee.toString() !== req.user._id.toString()) {
      await createNotification({
        recipient: task.assignee,
        sender: req.user._id,
        type: 'task_file_uploaded',
        title: 'New file attached',
        message: `${req.user.name} attached a file to "${task.title}"`,
        data: {
          taskId: task._id,
          projectId: task.project._id,
          filename: req.file.originalname
        }
      });
    }

    // Emit real-time update
    io.to(task.project._id.toString()).emit('task-updated', task);

    res.json({
      message: 'File uploaded successfully',
      attachment: attachment
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Delete attachment - UPDATED VERSION
router.delete('/:id/attachments/:attachmentId', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('project');
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check permissions
    const project = await Project.findById(task.project._id);
    const userRole = project.members.find(member => 
      member.user.toString() === req.user._id.toString()
    )?.role;

    if (!userRole || userRole === 'viewer') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Find the attachment
    const attachment = task.attachments.id(req.params.attachmentId);
    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    // Only allow deletion by uploader, task assignee, or project admins/owner
    const canDelete = attachment.uploadedBy.toString() === req.user._id.toString() ||
                     task.assignee?.toString() === req.user._id.toString() ||
                     userRole === 'admin';

    if (!canDelete) {
      return res.status(403).json({ error: 'Cannot delete this attachment' });
    }

    // Delete from Cloudinary
    if (attachment.publicId) {
      await deleteFromCloudinary(attachment.publicId);
    }

    // Remove attachment from task
    task.attachments.pull(req.params.attachmentId);
    await task.save();

    // Log activity
    await logActivity({
      project: task.project._id,
      user: req.user._id,
      action: 'file_deleted',
      description: `deleted ${attachment.filename} from task "${task.title}"`,
      metadata: {
        taskId: task._id,
        taskTitle: task.title,
        filename: attachment.filename
      }
    });

    // Emit real-time update
    io.to(task.project._id.toString()).emit('task-updated', task);

    res.json({ message: 'Attachment deleted successfully' });

  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete attachment' });
  }
});

// Add comment to task
router.post('/:id/comments', async (req, res) => {
  try {
    const { text } = req.body;
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user is project member
    const project = await Project.findById(task.project).populate('members.user');
    const memberRecord = project.members.find(member => 
      member.user._id.toString() === req.user._id.toString()
    );

    if (!memberRecord) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (memberRecord.role !== 'admin' && project.settings && project.settings.allowComments === false) {
      return res.status(403).json({ message: 'Comments are disabled for this project' });
    }

    const comment = {
      user: req.user._id,
      text,
      timestamp: new Date()
    };

    task.comments.push(comment);
    await task.save();
    await task.populate('comments.user', 'name email');

    // Log activity
    await logCommentAdded(task, req.user);

    // Notify project members
    await notifyTaskComment(task, req.user._id, project.members);

    // Emit real-time update
    io.to(task.project.toString()).emit('comment-added', {
      taskId: task._id,
      comment: task.comments[task.comments.length - 1]
    });

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete task
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user is project member with appropriate permissions
    const project = await Project.findById(task.project);
    const userMember = project.members.find(member => 
      member.user.toString() === req.user._id.toString()
    );

    if (!userMember || userMember.role === 'viewer') {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Task.findByIdAndDelete(req.params.id);

    // Emit real-time update
    io.to(task.project.toString()).emit('task-deleted', { taskId: req.params.id });

    // Clear cache
    await clearCache(`*:*/api/tasks/project/${task.project}`);

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add dependency to task
router.post('/:id/dependencies', async (req, res) => {
  try {
    const { dependentTaskId, type = 'blocking' } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user is project member
    const project = await Project.findById(task.project).populate('members.user');
    const isMember = project.members.some(member =>
      member.user._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Verify that the dependent task exists and is in the same project
    const dependentTask = await Task.findById(dependentTaskId);
    if (!dependentTask || dependentTask.project.toString() !== task.project.toString()) {
      return res.status(404).json({ message: 'Dependent task not found in same project' });
    }

    // Check if dependency already exists
    const existingDependency = task.dependencies.find(
      dep => dep.taskId.toString() === dependentTaskId
    );

    if (existingDependency) {
      return res.status(400).json({ message: 'Dependency already exists' });
    }

    // Add dependency
    task.dependencies.push({
      taskId: dependentTaskId,
      type
    });

    await task.save();
    await task.populate('dependencies.taskId', 'title status');

    res.status(201).json({
      message: 'Dependency added successfully',
      task
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Remove dependency from task
router.delete('/:id/dependencies/:dependencyId', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user is project member
    const project = await Project.findById(task.project).populate('members.user');
    const isMember = project.members.some(member =>
      member.user._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Remove dependency
    task.dependencies = task.dependencies.filter(
      dep => dep.taskId.toString() !== req.params.dependencyId
    );

    await task.save();
    await task.populate('dependencies.taskId', 'title status');

    res.json({
      message: 'Dependency removed successfully',
      task
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get task dependencies
router.get('/:id/dependencies', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('dependencies.taskId', 'title status taskId')
      .populate('project', 'title');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user is project member
    const project = await Project.findById(task.project._id).populate('members.user');
    const isMember = project.members.some(member =>
      member.user._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({
      dependencies: task.dependencies,
      taskId: task.taskId,
      title: task.title
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;