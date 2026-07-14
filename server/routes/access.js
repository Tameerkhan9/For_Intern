const express = require('express');
const crypto = require('crypto');
const AccessCode = require('../models/AccessCode');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

function generateAccessCode() {
  const raw = crypto.randomBytes(6).toString('hex').toUpperCase();
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;
}

function getRequestIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  const firstForwarded = Array.isArray(forwarded) ? forwarded[0] : (forwarded || '').split(',')[0].trim();
  const rawIp = firstForwarded || req.ip || req.connection.remoteAddress || '';
  // Normalize loopback forms so localhost doesn't trigger false device mismatch.
  if (rawIp === '::1' || rawIp === '::ffff:127.0.0.1') {
    return '127.0.0.1';
  }
  return rawIp;
}

// Generate device fingerprint
function generateDeviceFingerprint(req) {
  const ua = req.headers['user-agent'];
  const ip = getRequestIp(req);
  const hash = crypto.createHash('sha256').update(ua + ip).digest('hex');
  return hash;
}

// @route   POST /api/access/generate-code
// @desc    Generate a standalone access code (no user account needed)
// @access  Admin only
router.post('/generate-code', protect, authorize('admin'), async (req, res) => {
  try {
    const { internLabel = '' } = req.body;

    const code = generateAccessCode();

    // Lifetime expiry — 100 years
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 100);

    await AccessCode.create({
      code,
      internLabel: internLabel.trim(),
      expiresAt: expiryDate,
      maxUses: 9999,
    });

    res.status(201).json({
      success: true,
      code,
      internLabel: internLabel.trim(),
      message: 'Access code generated. Valid for lifetime.'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/access/generate-next-code
// @desc    Generate a new code for current access-session user
// @access  Session (code-authenticated user)
router.post('/generate-next-code', async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ error: 'Access session required' });
    }

    const { expiresInMinutes = 60 } = req.body || {};
    const userId = req.session.userId;
    const code = generateAccessCode();
    const expiryDate = new Date();
    expiryDate.setMinutes(expiryDate.getMinutes() + Number(expiresInMinutes));

    await AccessCode.updateMany(
      { userId, isActive: true, expiresAt: { $gt: new Date() } },
      { isActive: false, revokedAt: new Date() }
    );

    await AccessCode.create({
      code,
      userId,
      expiresAt: expiryDate,
      maxUses: 1
    });

    res.status(201).json({
      success: true,
      code,
      expiresAt: expiryDate,
      message: `New access code generated. Valid for ${expiresInMinutes} minutes.`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/access/verify-code
// @desc    Verify access code and create session
// @access  Public
router.post('/verify-code', async (req, res) => {
  try {
    const { code } = req.body;
    const deviceFingerprint = generateDeviceFingerprint(req);
    const ipAddress = getRequestIp(req);

    if (!code) {
      return res.status(400).json({ error: 'Access code required' });
    }

    // Find code
    const accessCode = await AccessCode.findOne({ code: code.toUpperCase() });

    if (!accessCode) {
      return res.status(401).json({ error: 'Invalid access code' });
    }

    if (!accessCode.isActive) {
      return res.status(401).json({ error: 'Access code has been revoked' });
    }

    // If code is expired but still active, auto-extend to lifetime (migration for old codes)
    if (new Date() > accessCode.expiresAt) {
      const newExpiry = new Date();
      newExpiry.setFullYear(newExpiry.getFullYear() + 100);
      accessCode.expiresAt = newExpiry;
      await accessCode.save();
    }

    // Check if max uses exceeded (only enforce for non-lifetime codes)
    if (accessCode.maxUses < 9999 && accessCode.uses >= accessCode.maxUses) {
      // Auto-upgrade old one-time codes to lifetime
      accessCode.maxUses = 9999;
      await accessCode.save();
    }

    // Check device fingerprint (first use sets it, subsequent uses must match)
    if (accessCode.deviceFingerprint && accessCode.deviceFingerprint !== deviceFingerprint) {
      // Log unauthorized access attempt
      await AccessCode.updateOne(
        { _id: accessCode._id },
        { $push: { unauthorizedAttempts: { ip: ipAddress, timestamp: new Date() } } }
      );
      return res.status(401).json({ 
        error: 'This code was accessed from a different device. Access codes cannot be shared.' 
      });
    }

    // Update usage
    accessCode.uses += 1;
    if (!accessCode.deviceFingerprint) {
      accessCode.deviceFingerprint = deviceFingerprint;
    }
    accessCode.lastUsedAt = new Date();
    accessCode.accessHistory.push({ ip: ipAddress, userAgent: req.headers['user-agent'], timestamp: new Date() });
    await accessCode.save();

    // Generate session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    req.session.accessToken = sessionToken;
    req.session.accessCodeId = accessCode._id;
    req.session.userId = accessCode.userId || null;
    req.session.internLabel = accessCode.internLabel || '';
    req.session.codeUsedAt = new Date();

    res.status(200).json({
      success: true,
      sessionToken,
      message: 'Access granted',
      expiresAt: accessCode.expiresAt
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/access/verify-session
// @desc    Verify if session is still valid
// @access  Private
router.get('/verify-session', async (req, res) => {
  if (!req.session.accessToken) {
    return res.status(401).json({ error: 'No active session' });
  }
  try {
    const accessCodeId = req.session.accessCodeId;
    if (!accessCodeId) {
      req.session.destroy(() => {});
      return res.status(401).json({ error: 'Access revoked' });
    }

    const accessCode = await AccessCode.findById(accessCodeId).select('isActive expiresAt');
    if (!accessCode || !accessCode.isActive || new Date() > accessCode.expiresAt) {
      req.session.destroy(() => {});
      return res.status(401).json({ error: 'Access code expired or revoked' });
    }

    // Only check blocked state when this access session is tied to a user account.
    if (req.session.userId) {
      const User = require('../models/User');
      const user = await User.findById(req.session.userId).select('isBlocked');
      if (!user || user.isBlocked) {
        req.session.destroy(() => {});
        return res.status(401).json({ error: 'Access revoked' });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Session valid',
      expiresAt: req.session.cookie._expires
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/access/logout
// @desc    End access session
// @access  Private
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  });
});

// @route   GET /api/access/status/:codeId
// @desc    Get access code usage status
// @access  Admin only
router.get('/status/:codeId', protect, authorize('admin'), async (req, res) => {
  try {
    const accessCode = await AccessCode.findById(req.params.codeId);

    if (!accessCode) {
      return res.status(404).json({ error: 'Access code not found' });
    }

    res.status(200).json({
      success: true,
      code: accessCode.code,
      uses: accessCode.uses,
      maxUses: accessCode.maxUses,
      expiresAt: accessCode.expiresAt,
      lastUsedAt: accessCode.lastUsedAt,
      accessHistory: accessCode.accessHistory,
      unauthorizedAttempts: accessCode.unauthorizedAttempts
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/access/all-codes
// @desc    Get all generated access codes with CV count
// @access  Admin only
router.get('/all-codes', protect, authorize('admin'), async (req, res) => {
  try {
    const CV = require('../models/CV');
    const codes = await AccessCode.find().sort({ createdAt: -1 }).lean();

    const codesWithCvs = await Promise.all(
      codes.map(async (code) => {
        const cvCount = await CV.countDocuments({ accessCodeId: code._id });
        return {
          _id: code._id,
          code: code.code,
          internLabel: code.internLabel || '',
          isActive: code.isActive,
          uses: code.uses,
          lastUsedAt: code.lastUsedAt,
          createdAt: code.createdAt,
          revokedAt: code.revokedAt,
          deviceLocked: !!code.deviceFingerprint,
          cvCount
        };
      })
    );

    res.status(200).json({ success: true, codes: codesWithCvs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT /api/access/revoke/:codeId
// @desc    Revoke an access code
// @access  Admin only
router.put('/revoke/:codeId', protect, authorize('admin'), async (req, res) => {
  try {
    const accessCode = await AccessCode.findByIdAndUpdate(
      req.params.codeId,
      { isActive: false, revokedAt: new Date() },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Access code revoked',
      code: accessCode.code
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/access/expire-my-code
// @desc    Manually expire the current user's access code
// @access  Private (session required)
router.post('/expire-my-code', async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ error: 'Access session required' });
    }
    // Find the active code for this user
    const accessCode = await AccessCode.findOne({ userId: req.session.userId, isActive: true });
    if (!accessCode) {
      return res.status(404).json({ error: 'No active access code found' });
    }
    accessCode.isActive = false;
    accessCode.revokedAt = new Date();
    await accessCode.save();
    res.status(200).json({ success: true, message: 'Access code expired successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   DELETE /api/access/:codeId
// @desc    Permanently delete an access code record
// @access  Admin only
router.delete('/:codeId', protect, authorize('admin'), async (req, res) => {
  try {
    const accessCode = await AccessCode.findByIdAndDelete(req.params.codeId);
    if (!accessCode) {
      return res.status(404).json({ error: 'Access code not found' });
    }
    res.status(200).json({ success: true, message: 'Access code deleted.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
