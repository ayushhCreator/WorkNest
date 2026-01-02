import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['admin', 'member'],
    default: 'member'
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true // Allows multiple null values
  },
  githubId: {
    type: String,
    unique: true,
    sparse: true // Allows multiple null values
  },
  projects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  }],
  avatar: {
    type: String,
    default: ''
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  emailNotifications: {
    type: Boolean,
    default: true
  },
  isOAuthUser: {
    type: Boolean,
    default: false
  },
  // API keys for public API access
  apiKeys: [{
    key: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    lastUsedAt: Date,
    active: {
      type: Boolean,
      default: true
    },
    permissions: [{
      type: String,
      enum: ['read', 'write', 'admin'],
      default: 'read'
    }]
  }]
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  // Don't hash password if it's an OAuth user without a password
  if (this.isOAuthUser && !this.password) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  // If user is an OAuth user, deny password comparison
  if (this.isOAuthUser && !this.password) {
    return false;
  }
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);