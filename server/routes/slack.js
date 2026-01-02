import express from 'express';
import axios from 'axios';
import Project from '../models/Project.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Slack OAuth setup
router.get('/oauth', authenticateToken, async (req, res) => {
  const clientId = process.env.SLACK_CLIENT_ID;
  const redirectUri = `${process.env.SERVER_URL}/api/integrations/slack/callback`;
  
  // Scopes needed for basic notifications
  const scopes = 'chat:write,chat:write.public,commands';
  
  const slackAuthUrl = `https://slack.com/oauth/v2/authorize?` +
    `client_id=${clientId}&` +
    `redirect_uri=${redirectUri}&` +
    `scope=${scopes}&` +
    `user_scope=`;
  
  res.redirect(slackAuthUrl);
});

// Slack OAuth callback
router.get('/callback', async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    return res.status(400).json({ message: 'No authorization code provided' });
  }
  
  try {
    // Exchange code for access token
    const tokenResponse = await axios.post('https://slack.com/api/oauth.v2.access', {
      client_id: process.env.SLACK_CLIENT_ID,
      client_secret: process.env.SLACK_CLIENT_SECRET,
      code: code,
      redirect_uri: `${process.env.SERVER_URL}/api/integrations/slack/callback`
    });
    
    if (!tokenResponse.data.ok) {
      return res.status(400).json({ message: 'Failed to authenticate with Slack', error: tokenResponse.data.error });
    }
    
    const { access_token: accessToken, team } = tokenResponse.data;
    
    // Store the access token and team info in user's session or database
    // For now, we'll just send it back to the frontend for storage
    res.redirect(`${process.env.CLIENT_URL}/settings/integrations?slack_token=${accessToken}&team_id=${team.id}&team_name=${team.name}`);
  } catch (error) {
    console.error('Slack OAuth error:', error);
    res.status(500).json({ message: 'Failed to authenticate with Slack' });
  }
});

// Link Slack workspace to project
router.post('/link-workspace', authenticateToken, async (req, res) => {
  try {
    const { projectId, slackToken, channelId } = req.body;
    
    // Verify user has access to the project
    const project = await Project.findById(projectId).populate('members.user');
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const isMember = project.members.some(member => 
      member.user.toString() === req.user._id.toString()
    );
    
    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Verify that the Slack token is valid
    try {
      const authTestResponse = await axios.post('https://slack.com/api/auth.test', null, {
        headers: {
          'Authorization': `Bearer ${slackToken}`
        }
      });
      
      if (!authTestResponse.data.ok) {
        return res.status(400).json({ message: 'Invalid Slack token' });
      }
    } catch (error) {
      return res.status(400).json({ message: 'Could not verify Slack connection' });
    }
    
    // Verify that the channel exists and is accessible
    if (channelId) {
      try {
        const channelResponse = await axios.get('https://slack.com/api/conversations.info', {
          headers: {
            'Authorization': `Bearer ${slackToken}`
          },
          params: {
            channel: channelId
          }
        });
        
        if (!channelResponse.data.ok) {
          return res.status(400).json({ message: 'Could not access specified Slack channel' });
        }
      } catch (error) {
        return res.status(400).json({ message: 'Could not verify Slack channel' });
      }
    }
    
    // Update project with Slack integration details
    project.slackIntegration = {
      token: slackToken, // In production, this should be encrypted
      connected: true,
      connectedAt: new Date(),
      channelId: channelId,
      workspace: authTestResponse.data.team
    };
    
    await project.save();
    
    res.json({
      message: 'Slack workspace connected successfully',
      project
    });
  } catch (error) {
    console.error('Slack workspace linking error:', error);
    res.status(500).json({ message: 'Failed to connect Slack workspace' });
  }
});

// Send a test message to Slack
router.post('/test-message', authenticateToken, async (req, res) => {
  try {
    const { projectId, message } = req.body;
    
    const project = await Project.findById(projectId);
    if (!project || !project.slackIntegration || !project.slackIntegration.token) {
      return res.status(400).json({ message: 'Project not connected to Slack' });
    }
    
    const { token, channelId } = project.slackIntegration;
    
    // Send test message to Slack
    const slackResponse = await axios.post('https://slack.com/api/chat.postMessage', {
      channel: channelId || '#general', // Use a default channel if none specified
      text: message || 'Test message from WorkNest',
      mrkdwn: true
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!slackResponse.data.ok) {
      return res.status(400).json({ 
        message: 'Failed to send message to Slack', 
        error: slackResponse.data.error 
      });
    }
    
    res.json({
      message: 'Test message sent successfully',
      ts: slackResponse.data.ts
    });
  } catch (error) {
    console.error('Slack test message error:', error);
    res.status(500).json({ message: 'Failed to send test message to Slack' });
  }
});

// Function to send a notification to Slack
export const sendSlackNotification = async (projectId, notificationText, options = {}) => {
  try {
    const project = await Project.findById(projectId);
    if (!project || !project.slackIntegration || !project.slackIntegration.token) {
      console.log('Project not connected to Slack or no token available');
      return;
    }
    
    const { token, channelId } = project.slackIntegration;
    const channel = options.channel || channelId || '#general';
    
    const slackResponse = await axios.post('https://slack.com/api/chat.postMessage', {
      channel,
      text: notificationText,
      mrkdwn: true,
      ...options
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!slackResponse.data.ok) {
      console.error('Failed to send Slack notification:', slackResponse.data.error);
    } else {
      console.log('Slack notification sent successfully');
    }
  } catch (error) {
    console.error('Error sending Slack notification:', error);
  }
};

// Format different types of notifications for Slack
export const formatSlackNotification = (type, data) => {
  switch (type) {
    case 'task_assigned':
      return `:memo: *${data.senderName}* assigned you to task *<${process.env.CLIENT_URL}/project/${data.projectId}/task/${data.taskId}|${data.title}>*`;
    case 'task_status_changed':
      return `:arrows_counterclockwise: *${data.senderName}* updated task status: *<${process.env.CLIENT_URL}/project/${data.projectId}/task/${data.taskId}|${data.title}>* - ${data.message}`;
    case 'task_comment':
      return `:speech_balloon: *${data.senderName}* added a comment to task *<${process.env.CLIENT_URL}/project/${data.projectId}/task/${data.taskId}|${data.title}>*`;
    case 'project_invite':
      return `:wave: *${data.senderName}* invited you to join the project *${data.projectTitle}*`;
    default:
      return data.message || 'New notification';
  }
};

export default router;