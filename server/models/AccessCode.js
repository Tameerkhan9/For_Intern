const mongoose = require('mongoose');

const accessCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  // Optional label — who this code is for (e.g. "Ahmed - Batch 3")
  internLabel: {
    type: String,
    default: ''
  },
  // Legacy field — kept for backward compat with old registered-user codes
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // Device security
  deviceFingerprint: String,
  accessHistory: [{
    ip: String,
    userAgent: String,
    timestamp: { type: Date, default: Date.now }
  }],
  unauthorizedAttempts: [{
    ip: String,
    timestamp: { type: Date, default: Date.now }
  }],
  // Usage tracking
  uses: { type: Number, default: 0 },
  maxUses: { type: Number, default: 9999 },
  lastUsedAt: Date,
  // No expiry — set far future
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  isActive: { type: Boolean, default: true },
  revokedAt: Date
}, { timestamps: true });

module.exports = mongoose.model('AccessCode', accessCodeSchema);
