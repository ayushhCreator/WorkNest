import mongoose from 'mongoose';

const webhookSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  // Webhook secret for verification
  secret: {
    type: String,
    required: true
  },
  // Events that trigger this webhook
  events: [{
    type: String,
    required: true
  }],
  // Integration type (github, slack, custom, etc.)
  integrationType: {
    type: String,
    enum: ['github', 'slack', 'custom', 'jira', 'trello'],
    default: 'custom'
  },
  // Headers to include with webhook requests
  headers: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Whether the webhook is active
  active: {
    type: Boolean,
    default: true
  },
  // Creator of the webhook
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Verification details
  verifySSL: {
    type: Boolean,
    default: true
  },
  // Retry configuration
  retryCount: {
    type: Number,
    default: 3
  },
  lastTriggeredAt: Date,
  lastResponse: {
    status: Number,
    body: String,
    timestamp: Date
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
webhookSchema.index({ projectId: 1 });
webhookSchema.index({ workspaceId: 1 });
webhookSchema.index({ active: 1 });
webhookSchema.index({ events: 1 });

export default mongoose.model('Webhook', webhookSchema);