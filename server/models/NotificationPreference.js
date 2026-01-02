import mongoose from 'mongoose';

const notificationPreferenceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // Notification preferences by type
  preferences: {
    task_assigned: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      in_app: { type: Boolean, default: true }
    },
    task_comment: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      in_app: { type: Boolean, default: true }
    },
    task_status_changed: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      in_app: { type: Boolean, default: true }
    },
    project_invite: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      in_app: { type: Boolean, default: true }
    },
    task_due_soon: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      in_app: { type: Boolean, default: true }
    },
    task_file_uploaded: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      in_app: { type: Boolean, default: true }
    }
  },
  // General settings
  general: {
    // Digest settings
    digest_enabled: { type: Boolean, default: false },
    digest_frequency: { 
      type: String, 
      enum: ['daily', 'weekly'], 
      default: 'daily' 
    },
    digest_time: { type: String, default: '09:00' }, // Format: HH:MM
    digest_day: { 
      type: String, 
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      default: 'monday'
    }
  },
  // Workspace-specific settings
  workspaceSettings: [{
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace'
    },
    preferences: {
      task_assigned: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        in_app: { type: Boolean, default: true }
      },
      task_comment: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        in_app: { type: Boolean, default: true }
      },
      // ... other notification types
    }
  }],
  // Team-specific settings
  teamSettings: [{
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
    },
    preferences: {
      task_assigned: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        in_app: { type: Boolean, default: true }
      },
      task_comment: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        in_app: { type: Boolean, default: true }
      },
      // ... other notification types
    }
  }]
}, {
  timestamps: true
});

notificationPreferenceSchema.index({ user: 1 });

export default mongoose.model('NotificationPreference', notificationPreferenceSchema);