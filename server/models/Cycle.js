import mongoose from 'mongoose';

const cycleSchema = new mongoose.Schema({
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
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['planning', 'active', 'completed', 'archived'],
    default: 'planning'
  },
  // Tasks assigned to this cycle
  tasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  // Metrics
  totalPoints: {
    type: Number,
    default: 0
  },
  completedPoints: {
    type: Number,
    default: 0
  },
  totalTasks: {
    type: Number,
    default: 0
  },
  completedTasks: {
    type: Number,
    default: 0
  },
  settings: {
    // Auto rollover incomplete tasks to next cycle
    autoRollover: {
      type: Boolean,
      default: false
    },
    // Cycle goals
    goals: [String]
  }
}, {
  timestamps: true
});

// Indexes for better query performance
cycleSchema.index({ project: 1 });
cycleSchema.index({ team: 1 });
cycleSchema.index({ workspace: 1 });
cycleSchema.index({ startDate: 1, endDate: 1 });
cycleSchema.index({ status: 1 });
cycleSchema.index({ owner: 1 });

// Pre-save middleware to calculate metrics
cycleSchema.pre('save', async function(next) {
  // Calculate metrics when saving if tasks are provided
  if (this.isModified('tasks') && this.tasks && this.tasks.length > 0) {
    // We'll need to populate task details to calculate metrics
    // This is just a basic implementation - in a real app, we'd have more complex logic
  }
  
  next();
});

export default mongoose.model('Cycle', cycleSchema);