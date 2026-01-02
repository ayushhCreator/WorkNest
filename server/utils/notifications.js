import Notification from '../models/Notification.js';
import NotificationPreference from '../models/NotificationPreference.js';
import User from '../models/User.js';
import { io } from '../server.js';

// Function to get user's notification preferences
const getUserNotificationPreferences = async (userId, notificationType) => {
  try {
    let preferences = await NotificationPreference.findOne({ user: userId });

    if (!preferences) {
      // Return default preferences if none exist
      return {
        email: true,
        push: true,
        in_app: true
      };
    }

    // Return preferences for the specific notification type
    return preferences.preferences[notificationType] || {
      email: true,
      push: true,
      in_app: true
    };
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    // Return default preferences on error
    return {
      email: true,
      push: true,
      in_app: true
    };
  }
};

// Function to send email notification based on user preferences
const sendEmailNotification = async (recipientId, notificationData) => {
  try {
    const user = await User.findById(recipientId);
    if (!user) return;

    const userPrefs = await getUserNotificationPreferences(recipientId, notificationData.type);

    if (!userPrefs.email) {
      // User has disabled email notifications for this type
      return;
    }

    // Don't send email if user has already disabled emails globally
    if (user.emailNotifications === false) {
      return;
    }

    // Import email transporter
    const { sendInvitationEmail: sendNotificationEmail } = await import('../config/email.js');

    // Create a generic notification email function
    const emailTransport = await import('nodemailer');
    const transporter = emailTransport.default.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    // Prepare email content based on notification type
    const subjectMap = {
      task_assigned: `New Task Assigned: ${notificationData.title}`,
      task_comment: `New Comment: ${notificationData.title}`,
      task_status_changed: `Task Status Updated: ${notificationData.title}`,
      project_invite: `Project Invitation: ${notificationData.title}`,
      task_due_soon: `Task Due Soon: ${notificationData.title}`,
      task_file_uploaded: `File Uploaded: ${notificationData.title}`
    };

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: user.email,
      subject: subjectMap[notificationData.type] || notificationData.title,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3B82F6;">New Notification</h2>
          <p>Hi ${user.name},</p>
          <p>You have a new notification:</p>
          <div style="background-color: #F3F4F6; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold; color: #374151;">${notificationData.title}</p>
            <p style="margin: 8px 0 0 0; color: #666;">${notificationData.message}</p>
          </div>
          <p>Log in to WorkNest to view all your notifications.</p>
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}" style="display: inline-block; background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">View Notifications</a>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending email notification:', error);
  }
};

export const createNotification = async (data) => {
  try {
    // Check if user wants to receive this type of notification
    const userPrefs = await getUserNotificationPreferences(data.recipient, data.type);

    // Create in-app notification if enabled
    let notification = null;
    if (userPrefs.in_app) {
      notification = new Notification(data);
      await notification.save();
      await notification.populate('sender', 'name email');

      // Emit real-time notification
      io.to(data.recipient.toString()).emit('new-notification', notification);
    }

    // Send email notification if enabled
    if (userPrefs.email) {
      await sendEmailNotification(data.recipient, data);
    }

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