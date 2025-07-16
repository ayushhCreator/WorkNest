import Notification from '../models/Notification.js';
import { io } from '../server.js';

export const createNotification = async (data) => {
  try {
    const notification = new Notification(data);
    await notification.save();
    await notification.populate('sender', 'name email');
    
    // Emit real-time notification
    io.to(data.recipient.toString()).emit('new-notification', notification);
    
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

export const notifyTaskAssigned = async (task, assignedBy) => {
  if (!task.assignee || task.assignee.toString() === assignedBy.toString()) return;
  
  await createNotification({
    recipient: task.assignee,
    sender: assignedBy,
    type: 'task_assigned',
    title: 'New Task Assigned',
    message: `You have been assigned to task "${task.title}"`,
    data: {
      projectId: task.project,
      taskId: task._id
    }
  });
};

export const notifyTaskComment = async (task, commenter, projectMembers) => {
  const recipients = projectMembers
    .filter(member => member.user._id.toString() !== commenter.toString())
    .map(member => member.user._id);
  
  for (const recipient of recipients) {
    await createNotification({
      recipient,
      sender: commenter,
      type: 'task_comment',
      title: 'New Comment',
      message: `New comment on task "${task.title}"`,
      data: {
        projectId: task.project,
        taskId: task._id
      }
    });
  }
};

export const notifyTaskStatusChanged = async (task, changedBy, oldStatus, newStatus) => {
  if (!task.assignee || task.assignee.toString() === changedBy.toString()) return;
  
  await createNotification({
    recipient: task.assignee,
    sender: changedBy,
    type: 'task_status_changed',
    title: 'Task Status Updated',
    message: `Task "${task.title}" moved from ${oldStatus} to ${newStatus}`,
    data: {
      projectId: task.project,
      taskId: task._id
    }
  });
};