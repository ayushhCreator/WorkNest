import cron from 'node-cron';
import Notification from '../models/Notification.js';
import NotificationPreference from '../models/NotificationPreference.js';
import User from '../models/User.js';
import { createNotification } from '../utils/notifications.js';
import { sendReminderEmail } from '../config/email.js';

// Function to send daily digest emails
const sendDailyDigest = async () => {
  console.log('Running daily digest job...');
  
  try {
    // Find users who have digest enabled and set to daily
    const usersWithDailyDigest = await NotificationPreference.find({
      'general.digest_enabled': true,
      'general.digest_frequency': 'daily'
    }).populate('user', 'name email emailNotifications');

    for (const preference of usersWithDailyDigest) {
      const user = preference.user;
      
      if (!user || !user.emailNotifications) {
        continue; // Skip users who have disabled emails
      }

      try {
        // Get unread notifications from the past day
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        const notifications = await Notification.find({
          recipient: user._id,
          createdAt: { $gte: yesterday },
          read: false
        })
        .sort({ createdAt: -1 })
        .limit(50); // Limit to 50 most recent
        
        if (notifications.length > 0) {
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

          // Format notifications for email
          const notificationList = notifications.slice(0, 10).map(notification => 
            `<li style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #eee;">
              <strong>${notification.title}</strong>
              <br><span style="color: #666;">${notification.message}</span>
              <br><small>${new Date(notification.createdAt).toLocaleString()}</small>
            </li>`
          ).join('');

          const mailOptions = {
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: user.email,
            subject: `Daily Digest: ${notifications.length} New Notification${notifications.length > 1 ? 's' : ''}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #3B82F6;">Daily Digest</h2>
                <p>Hi ${user.name},</p>
                <p>You have ${notifications.length} new notification${notifications.length > 1 ? 's' : ''} since your last visit:</p>
                <ul style="list-style: none; padding: 0;">
                  ${notificationList}
                </ul>
                <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}" style="display: inline-block; background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">View All Notifications</a>
                <p style="color: #666; font-size: 12px;">You're receiving this because you subscribed to daily digest emails. You can change your notification preferences in your account settings.</p>
              </div>
            `
          };

          await transporter.sendMail(mailOptions);
          console.log(`Daily digest sent to user: ${user.email}`);
        }
      } catch (error) {
        console.error(`Failed to send daily digest to user ${user.email}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in daily digest job:', error);
  }
};

// Function to send weekly digest emails
const sendWeeklyDigest = async () => {
  console.log('Running weekly digest job...');
  
  try {
    // Check if today is the user's preferred digest day
    const today = new Date().toLocaleString('en', { weekday: 'long' }).toLowerCase();
    
    // Find users who have digest enabled and set to weekly with today as their day
    const usersWithWeeklyDigest = await NotificationPreference.find({
      'general.digest_enabled': true,
      'general.digest_frequency': 'weekly',
      'general.digest_day': today
    }).populate('user', 'name email emailNotifications');

    for (const preference of usersWithWeeklyDigest) {
      const user = preference.user;
      
      if (!user || !user.emailNotifications) {
        continue; // Skip users who have disabled emails
      }

      try {
        // Get unread notifications from the past week
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const notifications = await Notification.find({
          recipient: user._id,
          createdAt: { $gte: weekAgo },
          read: false
        })
        .sort({ createdAt: -1 })
        .limit(50); // Limit to 50 most recent
        
        if (notifications.length > 0) {
          // Group notifications by type
          const groupedNotifications = notifications.reduce((acc, notification) => {
            if (!acc[notification.type]) {
              acc[notification.type] = [];
            }
            acc[notification.type].push(notification);
            return acc;
          }, {});
          
          // Format grouped notifications for email
          let notificationContent = '';
          for (const [type, notifs] of Object.entries(groupedNotifications)) {
            notificationContent += `
              <div style="margin-bottom: 20px;">
                <h3 style="color: #3B82F6; border-bottom: 1px solid #eee; padding-bottom: 5px;">${type.replace(/_/g, ' ').toUpperCase()}</h3>
                <ul style="list-style: none; padding: 0;">
                  ${notifs.slice(0, 5).map(n => 
                    `<li style="margin-bottom: 8px;">
                      <strong>${n.title}</strong>
                      <br><span style="color: #666;">${n.message}</span>
                    </li>`
                  ).join('')}
                  ${notifs.length > 5 ? `<li>+ ${notifs.length - 5} more...</li>` : ''}
                </ul>
              </div>
            `;
          }

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

          const mailOptions = {
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: user.email,
            subject: `Weekly Digest: ${notifications.length} New Notification${notifications.length > 1 ? 's' : ''}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #3B82F6;">Weekly Digest</h2>
                <p>Hi ${user.name},</p>
                <p>Here's your weekly summary with ${notifications.length} notification${notifications.length > 1 ? 's' : ''} from the past week:</p>
                ${notificationContent}
                <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}" style="display: inline-block; background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">View All Notifications</a>
                <p style="color: #666; font-size: 12px;">You're receiving this because you subscribed to weekly digest emails. You can change your notification preferences in your account settings.</p>
              </div>
            `
          };

          await transporter.sendMail(mailOptions);
          console.log(`Weekly digest sent to user: ${user.email}`);
        }
      } catch (error) {
        console.error(`Failed to send weekly digest to user ${user.email}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in weekly digest job:', error);
  }
};

// Schedule daily digest at 8 AM
// This cron expression runs every day at 8:00 AM
cron.schedule('0 8 * * *', sendDailyDigest);

// Schedule weekly digest at 8 AM on the configured day
// Since we check the day in the function itself, we run this daily at 8 AM
cron.schedule('0 8 * * *', sendWeeklyDigest);

export { sendDailyDigest, sendWeeklyDigest };
export default cron;