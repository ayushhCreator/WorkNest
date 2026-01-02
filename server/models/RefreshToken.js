import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

const refreshTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userAgent: {
    type: String
  },
  expiresAt: {
    type: Date,
    required: true,
    expires: 0 // This will automatically delete the document after expiration
  }
}, {
  timestamps: true
});

// Create indexes for better query performance
refreshTokenSchema.index({ token: 1 });
refreshTokenSchema.index({ userId: 1 });
refreshTokenSchema.index({ expiresAt: 1 });

// Method to generate a refresh token
refreshTokenSchema.statics.generateRefreshToken = async function(userId, userAgent) {
  // Create a refresh token
  const refreshToken = jwt.sign(
    { userId },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d' }
  );

  // Create expiration date
  const expiresAt = new Date();
  const expiryDays = parseInt(process.env.REFRESH_TOKEN_EXPIRY_DAYS || '7', 10);
  expiresAt.setDate(expiresAt.getDate() + expiryDays);

  // Save the refresh token to the database
  const refreshTokenDoc = new this({
    token: refreshToken,
    userId,
    userAgent,
    expiresAt
  });

  await refreshTokenDoc.save();
  return refreshToken;
};

// Method to verify a refresh token
refreshTokenSchema.statics.verifyRefreshToken = async function(token) {
  try {
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    
    // Check if the token exists in the database
    const refreshTokenDoc = await this.findOne({
      token,
      userId: decoded.userId,
      expiresAt: { $gt: new Date() } // Not expired
    });

    if (!refreshTokenDoc) {
      throw new Error('Invalid or expired refresh token');
    }

    return refreshTokenDoc;
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

// Method to revoke a refresh token
refreshTokenSchema.statics.revokeRefreshToken = async function(token) {
  await this.findOneAndDelete({ token });
};

// Method to revoke all refresh tokens for a user
refreshTokenSchema.statics.revokeAllUserTokens = async function(userId) {
  await this.deleteMany({ userId });
};

export default mongoose.model('RefreshToken', refreshTokenSchema);