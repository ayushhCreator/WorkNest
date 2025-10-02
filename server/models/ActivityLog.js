import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    enum: [
      'task_created',
      'task_updated',
      'task_deleted',
      'task_moved',
      'comment_added',
      'member_added',
      'member_removed',
      'member_role_changed',
      'project_created',
      'project_updated',
      'file_uploaded',
      'file_deleted' 
    ],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  metadata: {
    taskId: mongoose.Schema.Types.ObjectId,
    taskTitle: String,
    fromStatus: String,
    toStatus: String,
    memberEmail: String,
    fileName: String
  }
}, {
  timestamps: true
});

activityLogSchema.index({ project: 1, createdAt: -1 });

export default mongoose.model('ActivityLog', activityLogSchema);
