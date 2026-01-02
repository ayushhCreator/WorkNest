import mongoose from 'mongoose';

const milestoneSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
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
  dueDate: {
    type: Date,
    required: true
  },
  completedAt: Date,
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed', 'delayed'],
    default: 'not_started'
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  // Tasks associated with this milestone
  tasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  // Dependencies
  dependencies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Milestone'
  }],
  // Parent milestone for hierarchy
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Milestone'
  },
  // Child milestones
  children: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Milestone'
  }],
  // Tags for categorization
  tags: [String],
  // Priority
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
milestoneSchema.index({ project: 1 });
milestoneSchema.index({ workspace: 1 });
milestoneSchema.index({ team: 1 });
milestoneSchema.index({ owner: 1 });
milestoneSchema.index({ dueDate: 1 });
milestoneSchema.index({ status: 1 });
milestoneSchema.index({ parent: 1 });

export default mongoose.model('Milestone', milestoneSchema);