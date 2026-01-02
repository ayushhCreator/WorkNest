import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    ref: 'User'
  },
  action: {
    type: String,
    required: true
  },
  resourceType: {
    type: String,
    required: true
  },
  resourceId: {
    type: String, // Can be ObjectId or other identifier
    required: true
  },
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace'
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  actionData: {
    type: mongoose.Schema.Types.Mixed, // Store additional action-specific data
    default: {}
  },
  ip: String,
  userAgent: String,
  success: {
    type: Boolean,
    default: true
  },
  statusCode: Number,
  errorMessage: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create indexes for common queries
auditLogSchema.index({ userId: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ resourceType: 1 });
auditLogSchema.index({ resourceId: 1 });
auditLogSchema.index({ workspaceId: 1 });
auditLogSchema.index({ timestamp: -1 });

export default mongoose.model('AuditLog', auditLogSchema);