const express = require('express');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// ── SUPER ADMIN ROUTES ───────────────────────────────────────────────────────

// @route   GET /api/users/dashboard-users
// @desc    Get all dashboard users (admin accounts)
// @access  Super Admin only
router.get('/dashboard-users', protect, authorize('superadmin'), async (req, res) => {
  try {
    const users = await User.find({ role: { $in: ['admin', 'superadmin'] } })
      .select('_id name email role createdAt isBlocked plainPassword')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/users/dashboard-users
// @desc    Create a new dashboard user (admin)
// @access  Super Admin only
router.post('/dashboard-users', protect, authorize('superadmin'), async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }

    // Max 4 dashboard users (excluding superadmin)
    const count = await User.countDocuments({ role: 'admin' });
    if (count >= 4) {
      return res.status(400).json({ error: 'Maximum 4 dashboard users allowed. Delete one to create a new one.' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'A user with this email already exists' });
    }

    const user = await User.create({ name, email, password, plainPassword: password, role: 'admin' });

    res.status(201).json({
      success: true,
      message: `Dashboard user "${name}" created successfully.`,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, plainPassword: password }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT /api/users/dashboard-users/:id/password
// @desc    Set/reset a dashboard user's password
// @access  Super Admin only
router.put('/dashboard-users/:id/password', protect, authorize('superadmin'), async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const user = await User.findById(req.params.id).select('+password +plainPassword');
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role !== 'admin') return res.status(403).json({ error: 'Only dashboard admin passwords can be changed here' });

    user.password = password;
    user.plainPassword = password;
    await user.save();

    res.status(200).json({
      success: true,
      message: `Password updated for "${user.name}".`,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, plainPassword: password }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   DELETE /api/users/dashboard-users/:id
// @desc    Delete a dashboard user
// @access  Super Admin only
router.delete('/dashboard-users/:id', protect, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    // Only superadmin can delete dashboard users — double check here
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Only super admin can remove dashboard users' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role === 'superadmin') return res.status(403).json({ error: 'Cannot delete super admin' });
    if (user.role !== 'admin') return res.status(403).json({ error: 'This is not a dashboard user' });

    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: `Dashboard user "${user.name}" deleted.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/users/dashboard-users/logout-all-admins
// @desc    Invalidate all normal dashboard admin sessions
// @access  Super Admin only
router.post('/dashboard-users/logout-all-admins', protect, authorize('superadmin'), async (req, res) => {
  try {
    const result = await User.updateMany(
      { role: 'admin' },
      { $inc: { tokenVersion: 1 } }
    );

    res.status(200).json({
      success: true,
      message: 'All dashboard admin sessions have been logged out.',
      affected: result.modifiedCount || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────

// @route   GET /api/users/interns
// @desc    Get all registered interns with their access code details
// @access  Private (Admin)
router.get('/interns', protect, authorize('admin'), async (req, res) => {
  try {
    const AccessCode = require('../models/AccessCode');

    const interns = await User.find({ role: 'student' })
      .select('_id name email createdAt cvs isBlocked isApproved')
      .sort({ createdAt: -1 });

    // For each intern, fetch their access code
    const internsWithCodes = await Promise.all(
      interns.map(async (u) => {
        const code = await AccessCode.findOne({ userId: u._id })
          .sort({ createdAt: -1 })
          .select('code isActive expiresAt uses maxUses lastUsedAt createdAt deviceFingerprint revokedAt');

        return {
          _id: u._id,
          name: u.name,
          email: u.email,
          registeredAt: u.createdAt,
          cvCount: u.cvs ? u.cvs.length : 0,
          isBlocked: u.isBlocked || false,
          isApproved: u.isApproved || false,
          accessCode: code ? {
            code: code.code,
            isActive: code.isActive,
            expiresAt: code.expiresAt,
            uses: code.uses,
            maxUses: code.maxUses,
            lastUsedAt: code.lastUsedAt,
            createdAt: code.createdAt,
            revokedAt: code.revokedAt,
            deviceLocked: !!code.deviceFingerprint
          } : null
        };
      })
    );

    res.status(200).json({
      success: true,
      count: internsWithCodes.length,
      interns: internsWithCodes
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/users/search
// @desc    Search users by name/email for admin tools
// @access  Private (Admin)
router.get('/search', protect, authorize('admin'), async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const users = await User.find({
      $or: [{ name: regex }, { email: regex }]
    })
      .select('_id name email role')
      .limit(20);

    res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/users/:id
// @desc    Get user profile
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      success: true,
      user: user.toJSON()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone, bio, skills, experience, education, location, companyName, companyWebsite } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        name,
        phone,
        bio,
        skills,
        experience,
        education,
        location,
        companyName,
        companyWebsite
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      user: user.toJSON()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT /api/users/:id/approve
// @desc    Approve an intern to access the portal
// @access  Private (Admin)
router.put('/:id/approve', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    ).select('_id name email isApproved');

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.status(200).json({ success: true, message: `${user.name} has been approved.`, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT /api/users/:id/block
// @desc    Block an intern — revokes access code and blocks account
// @access  Private (Admin)
router.put('/:id/block', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBlocked: true, isApproved: false },
      { new: true }
    ).select('_id name email isBlocked');

    if (!user) return res.status(404).json({ error: 'User not found' });

    // Revoke ALL active access codes — this kills portal session on next verify-session poll
    const AccessCode = require('../models/AccessCode');
    await AccessCode.updateMany(
      { userId: req.params.id, isActive: true },
      { isActive: false, revokedAt: new Date() }
    );

    res.status(200).json({ success: true, message: `${user.name} has been blocked and access revoked.`, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT /api/users/:id/unblock
// @desc    Unblock an intern
// @access  Private (Admin)
router.put('/:id/unblock', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBlocked: false },
      { new: true }
    ).select('_id name email isBlocked');

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.status(200).json({ success: true, message: `${user.name} has been unblocked.`, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete an intern account
// @access  Private (Admin)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role === 'admin' || user.role === 'superadmin') return res.status(403).json({ error: 'Cannot delete an admin account from here' });

    // Revoke all access codes
    const AccessCode = require('../models/AccessCode');
    await AccessCode.deleteMany({ userId: req.params.id });

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: `${user.name} has been deleted.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
