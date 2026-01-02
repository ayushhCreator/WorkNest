import mongoose from 'mongoose';

const workflowSchema = new mongoose.Schema({
  name: {
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
    ref: 'Workspace',
    required: true
  },
  // Define the statuses in the workflow
  statuses: [{
    id: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['todo', 'inprogress', 'done', 'backlog', 'cancelled'],
      default: 'todo'
    },
    color: {
      type: String,
      default: '#6B7280' // gray
    },
    description: String
  }],
  // Define transition rules between statuses
  transitions: [{
    from: String,
    to: String,
    allowedRoles: [{
      type: String,
      enum: ['owner', 'admin', 'member', 'viewer']
    }]
  }],
  // Default status for new tasks
  defaultStatus: {
    type: String,
    default: 'todo'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better query performance
workflowSchema.index({ workspace: 1 });
workflowSchema.index({ isActive: 1 });
workflowSchema.index({ isDefault: 1 });

export default mongoose.model('Workflow', workflowSchema);