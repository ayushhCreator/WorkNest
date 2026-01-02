import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  // Rich content in Markdown format
  content: {
    type: String,
    default: ''
  },
  // Human-readable ID (e.g. WN-123)
  taskId: {
    type: String,
    required: true,
    unique: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['todo', 'inprogress', 'done'],
    default: 'todo'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  dueDate: {
    type: Date
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  // Story points for estimation
  storyPoints: {
    type: Number,
    min: 0,
    max: 21
  },
  // Task hierarchy - for subtasks
  parentTask: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },
  subtasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  // Workflow
  workflow: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workflow'
  },
  // Milestone reference
  milestone: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Milestone'
  },
  // Cycle/Sprint reference
  cycle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cycle'
  },
  // Dependencies
  dependencies: [{
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task'
    },
    type: {
      type: String,
      enum: ['blocking', 'blocked_by', 'related'],
      default: 'blocking'
    }
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  attachments: [{
    filename: String,
    originalName: String,
    url: String,
    publicId: String, // Added for Cloudinary deletion
    size: Number,
    mimetype: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [String],
  columnId: String,
  estimatedHours: Number,
  actualHours: Number,
  completedAt: Date
}, {
  timestamps: true
});

taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ assignee: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ taskId: 1 }, { unique: true });
taskSchema.index({ parentTask: 1 });
taskSchema.index({ title: 'text', description: 'text' });

export default mongoose.model('Task', taskSchema);