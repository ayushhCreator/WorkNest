import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace'
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['admin', 'member', 'viewer'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  columns: [{
    id: String,
    title: String,
    taskIds: [String]
  }],
  tasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  color: {
    type: String,
    default: '#3B82F6'
  },
  status: {
    type: String,
    enum: ['active', 'archived', 'completed'],
    default: 'active'
  },
  settings: {
    allowComments: {
      type: Boolean,
      default: true
    },
    allowFileUploads: {
      type: Boolean,
      default: true
    },
    emailNotifications: {
      type: Boolean,
      default: true
    }
  },
  // GitHub integration
  githubIntegration: {
    repoFullName: String,
    accessToken: String, // Should be encrypted in production
    connected: {
      type: Boolean,
      default: false
    },
    connectedAt: Date,
    webhookId: String // GitHub webhook ID for management
  },
  // Slack integration
  slackIntegration: {
    token: String, // Should be encrypted in production
    connected: {
      type: Boolean,
      default: false
    },
    connectedAt: Date,
    channelId: String,
    workspace: String
  }
}, {
  timestamps: true
});

projectSchema.index({ workspace: 1 });
projectSchema.index({ team: 1 });
projectSchema.index({ 'members.user': 1 });
projectSchema.index({ owner: 1 });

export default mongoose.model('Project', projectSchema);