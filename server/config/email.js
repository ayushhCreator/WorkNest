import * as brevo from '@getbrevo/brevo';
import dotenv from 'dotenv';
dotenv.config();

// Initialize Brevo API client
const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(
  brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY
);

/**
 * Send project invitation email using Brevo API
 */
export const sendInvitationEmail = async (email, inviterName, projectTitle, inviteToken, role = 'member') => {
  console.log('📧 Attempting to send email via Brevo API to:', email);
  
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const inviteUrl = `${clientUrl}/accept-invite/${inviteToken}`;
  
  // Role descriptions for email
  const roleDescriptions = {
    viewer: 'Viewer (can view tasks and comments)',
    member: 'Member (can create and edit tasks)',
    admin: 'Admin (can manage project and members)',
    owner: 'Owner (full project control)'
  };

  const sendSmtpEmail = new brevo.SendSmtpEmail();
  
  sendSmtpEmail.sender = { 
    name: 'WorkNest', 
    email: process.env.SMTP_FROM_EMAIL || 'ayushraj150103@gmail.com'
  };
  
  sendSmtpEmail.to = [{ email: email }];
  sendSmtpEmail.subject = `You're invited to join ${projectTitle} on WorkNest`;
  sendSmtpEmail.htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3B82F6;">You're invited to WorkNest!</h2>
      <p>Hi there,</p>
      <p><strong>${inviterName}</strong> has invited you to join the project <strong>"${projectTitle}"</strong> on WorkNest.</p>
      <div style="background-color: #F3F4F6; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; font-weight: bold; color: #374151;">Your Role: ${roleDescriptions[role] || role}</p>
      </div>
      <p>Click the button below to accept the invitation and create your account:</p>
      <a href="${inviteUrl}" style="display: inline-block; background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Accept Invitation</a>
      <p>Or copy and paste this link in your browser:</p>
      <p style="word-break: break-all; color: #666;">${inviteUrl}</p>
      <p>This invitation will expire in 7 days.</p>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
      <p style="color: #666; font-size: 12px;">If you didn't expect this invitation, you can safely ignore this email.</p>
    </div>
  `;

  try {
    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('✅ Email sent successfully via Brevo API:', result.messageId);
    return result;
  } catch (error) {
    console.error('❌ Failed to send email via Brevo API:', error);
    throw error;
  }
};

/**
 * Send task reminder email using Brevo API
 */
export const sendReminderEmail = async (email, userName, taskTitle, projectTitle, dueDate) => {
  const formattedDate = new Date(dueDate).toLocaleDateString();

  const sendSmtpEmail = new brevo.SendSmtpEmail();
  
  sendSmtpEmail.sender = { 
    name: 'WorkNest', 
    email: process.env.SMTP_FROM_EMAIL || 'ayushraj150103@gmail.com'
  };
  
  sendSmtpEmail.to = [{ email: email }];
  sendSmtpEmail.subject = `Task Due Soon: ${taskTitle}`;
  sendSmtpEmail.htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #F59E0B;">Task Due Soon</h2>
      <p>Hi ${userName},</p>
      <p>This is a reminder that your task <strong>"${taskTitle}"</strong> in project <strong>"${projectTitle}"</strong> is due soon.</p>
      <p><strong>Due Date:</strong> ${formattedDate}</p>
      <p>Please make sure to complete it on time or update the due date if needed.</p>
      <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard" style="display: inline-block; background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">View Task</a>
    </div>
  `;

  try {
    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    return result;
  } catch (error) {
    console.error('Failed to send reminder email:', error);
    throw error;
  }
};

export default { sendInvitationEmail, sendReminderEmail };
