import express from 'express';
import Webhook from '../models/Webhook.js';
import Project from '../models/Project.js';
import Workspace from '../models/Workspace.js';
import Team from '../models/Team.js';
import crypto from 'crypto';
import axios from 'axios';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Create a new webhook
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, projectId, url, events, integrationType, headers, active } = req.body;

    // Verify user has access to the project
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

    // Generate a secret for webhook verification
    const secret = crypto.randomBytes(32).toString('hex');

    // Create webhook
    const webhook = new Webhook({
      name,
      description,
      projectId,
      workspaceId: project.workspace,
      teamId: project.team,
      url,
      events,
      integrationType,
      headers,
      active,
      secret,
      createdBy: req.user._id
    });

    await webhook.save();

    // Return the webhook without the secret
    const webhookResponse = webhook.toObject();
    delete webhookResponse.secret;

    res.status(201).json(webhookResponse);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get webhooks for a project
router.get('/project/:projectId', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;

    // Verify user has access to the project
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

    const webhooks = await Webhook.find({ projectId }).populate('createdBy', 'name email');

    // Remove secrets from response
    const webhooksResponse = webhooks.map(webhook => {
      const webhookObj = webhook.toObject();
      delete webhookObj.secret;
      return webhookObj;
    });

    res.json(webhooksResponse);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get webhook by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const webhook = await Webhook.findById(req.params.id).populate('createdBy', 'name email');

    if (!webhook) {
      return res.status(404).json({ message: 'Webhook not found' });
    }

    // Verify user has access to the project
    const project = await Project.findById(webhook.projectId).populate('members.user');
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isMember = project.members.some(member =>
      member.user._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Remove secret from response
    const webhookResponse = webhook.toObject();
    delete webhookResponse.secret;

    res.json(webhookResponse);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update webhook
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const webhook = await Webhook.findById(req.params.id);

    if (!webhook) {
      return res.status(404).json({ message: 'Webhook not found' });
    }

    // Verify user has access to the project
    const project = await Project.findById(webhook.projectId).populate('members.user');
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const projectMember = project.members.find(member =>
      member.user._id.toString() === req.user._id.toString()
    );

    if (!projectMember || (projectMember.role !== 'admin' && projectMember.role !== 'owner')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (key !== 'secret' && req.body[key] !== undefined) { // Don't allow updating secret directly
        webhook[key] = req.body[key];
      }
    });

    await webhook.save();

    // Remove secret from response
    const webhookResponse = webhook.toObject();
    delete webhookResponse.secret;

    res.json(webhookResponse);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete webhook
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const webhook = await Webhook.findById(req.params.id);

    if (!webhook) {
      return res.status(404).json({ message: 'Webhook not found' });
    }

    // Verify user has access to the project
    const project = await Project.findById(webhook.projectId).populate('members.user');
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const projectMember = project.members.find(member =>
      member.user._id.toString() === req.user._id.toString()
    );

    if (!projectMember || (projectMember.role !== 'admin' && projectMember.role !== 'owner')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Webhook.findByIdAndDelete(req.params.id);

    res.json({ message: 'Webhook deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Test webhook
router.post('/test/:id', authenticateToken, async (req, res) => {
  try {
    const webhook = await Webhook.findById(req.params.id);

    if (!webhook) {
      return res.status(404).json({ message: 'Webhook not found' });
    }

    // Verify user has access to the project
    const project = await Project.findById(webhook.projectId).populate('members.user');
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isMember = project.members.some(member =>
      member.user._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Example payload for testing
    const testPayload = {
      event: 'test_event',
      timestamp: new Date().toISOString(),
      message: 'Test webhook from WorkNest',
      project: {
        id: project._id,
        name: project.title
      }
    };

    const response = await triggerWebhook(webhook, testPayload);

    res.json({
      message: 'Webhook test completed',
      response: {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Function to trigger a webhook
export const triggerWebhook = async (webhook, payload) => {
  try {
    // Create signature for verification
    const signature = crypto
      .createHmac('sha256', webhook.secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    const response = await axios.post(webhook.url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-WorkNest-Signature': signature,
        'User-Agent': 'WorkNest Webhook Service',
        ...webhook.headers
      },
      timeout: 10000, // 10 seconds timeout
      maxRedirects: 3
    });

    // Update last response
    webhook.lastResponse = {
      status: response.status,
      body: typeof response.data === 'object' ? JSON.stringify(response.data) : response.data,
      timestamp: new Date()
    };
    webhook.lastTriggeredAt = new Date();
    await webhook.save();

    return response;
  } catch (error) {
    console.error(`Webhook ${webhook._id} failed:`, error.message);

    // Update last response with error
    webhook.lastResponse = {
      status: error.response?.status || 0,
      body: error.response?.data || error.message,
      timestamp: new Date()
    };
    webhook.lastTriggeredAt = new Date();
    await webhook.save();

    throw error;
  }
};

// Trigger webhooks for specific event
export const triggerWebhooksForEvent = async (projectId, event, payload) => {
  try {
    // Find active webhooks that listen to this event
    const webhooks = await Webhook.find({
      projectId: projectId,
      events: { $in: [event] },
      active: true
    });

    // Trigger each webhook
    const results = [];
    for (const webhook of webhooks) {
      try {
        const response = await triggerWebhook(webhook, payload);
        results.push({
          webhookId: webhook._id,
          status: 'success',
          responseStatus: response.status
        });
      } catch (error) {
        results.push({
          webhookId: webhook._id,
          status: 'error',
          error: error.message
        });
      }
    }

    return results;
  } catch (error) {
    console.error('Error triggering webhooks:', error);
    throw error;
  }
};

// Webhook endpoint for receiving callbacks from external services
router.post('/callback/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const payload = req.body;
    const signature = req.headers['x-wornest-signature'];

    // In a real implementation, this would be used to receive callbacks from external services
    // For now, we'll just acknowledge receipt
    
    // Verify this is a known project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Process the webhook payload based on its source
    // This would vary depending on the service (GitHub, Slack, etc.)
    
    res.status(200).json({ message: 'Webhook received' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;