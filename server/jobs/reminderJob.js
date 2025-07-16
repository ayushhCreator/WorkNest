import cron from 'node-cron';
import Task from '../models/Task.js';
import User from '../models/User.js';
import { sendReminderEmail } from '../config/email.js';
import { createNotification } from '../utils/notifications.js';

// Run every day at 9 AM
cron.schedule('0 9 * * *', async () => {
  console.log('Running due date reminder job...');
  
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find tasks due within 24 hours that haven't had reminders sent
    const dueTasks = await Task.find({
      dueDate: {
        $gte: today,
        $lte: tomorrow
      },
      reminderSent: false,
      status: { $ne: 'done' },
      assignee: { $exists: true }
    })
    .populate('assignee', 'name email emailNotifications')
    .populate('project', 'title');
    
    for (const task of dueTasks) {
      if (task.assignee && task.assignee.emailNotifications) {
        try {
          // Send email reminder
          await sendReminderEmail(
            task.assignee.email,
            task.assignee.name,
            task.title,
            task.project.title,
            task.dueDate
          );
          
          // Create in-app notification
          await createNotification({
            recipient: task.assignee._id,
            sender: task.assignee._id, // System notification
            type: 'task_due_soon',
            title: 'Task Due Soon',
            message: `Task "${task.title}" is due soon`,
            data: {
              projectId: task.project._id,
              taskId: task._id
            }
          });
          
          // Mark reminder as sent
          task.reminderSent = true;
          await task.save();
          
          console.log(`Reminder sent for task: ${task.title}`);
        } catch (error) {
          console.error(`Failed to send reminder for task ${task.title}:`, error);
        }
      }
    }
    
    console.log(`Processed ${dueTasks.length} due tasks`);
  } catch (error) {
    console.error('Error in reminder job:', error);
  }
});

export default cron;