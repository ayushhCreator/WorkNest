import ActivityLog from '../models/ActivityLog.js';

export const logActivity = async (data) => {
  try {
    const activity = new ActivityLog(data);
    await activity.save();
    return activity;
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

export const logTaskCreated = async (task, user) => {
  await logActivity({
    project: task.project,
    user: user._id,
    action: 'task_created',
    description: `${user.name} created task "${task.title}"`,
    metadata: {
      taskId: task._id,
      taskTitle: task.title
    }
  });
};

export const logTaskMoved = async (task, user, fromStatus, toStatus) => {
  await logActivity({
    project: task.project,
    user: user._id,
    action: 'task_moved',
    description: `${user.name} moved task "${task.title}" from ${fromStatus} to ${toStatus}`,
    metadata: {
      taskId: task._id,
      taskTitle: task.title,
      fromStatus,
      toStatus
    }
  });
};

export const logMemberAdded = async (project, user, memberEmail) => {
  await logActivity({
    project: project._id,
    user: user._id,
    action: 'member_added',
    description: `${user.name} added ${memberEmail} to the project`,
    metadata: {
      memberEmail
    }
  });
};

export const logCommentAdded = async (task, user) => {
  await logActivity({
    project: task.project,
    user: user._id,
    action: 'comment_added',
    description: `${user.name} commented on task "${task.title}"`,
    metadata: {
      taskId: task._id,
      taskTitle: task.title
    }
  });
};