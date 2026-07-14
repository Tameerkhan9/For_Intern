const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Generate JWT Token
const generateToken = (id, role, tokenVersion = 0) => {
  return jwt.sign({ id, role, tokenVersion }, process.env.JWT_KEY, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Please provide name, email and password' });
    }

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      // If user exists and is a student, they are already registered —
      // return a clear message so the frontend can redirect them to sign in
      return res.status(400).json({
        error: 'This email is already registered. Please sign in using the "Registered Interns" tab.',
        alreadyExists: true
      });
    }

    // Create user — force role to 'student', never trust client-provided role
    user = await User.create({
      name,
      email,
      password,
      role: 'student'
    });

    const token = generateToken(user._id, user.role, user.tokenVersion || 0);

    res.status(201).json({
      success: true,
      token,
      user: user.toJSON()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password' });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is blocked
    if (user.isBlocked) {
      return res.status(403).json({ error: 'Your account has been blocked. Please contact the administrator.' });
    }

    // Check if intern is approved (students must be approved by admin)
    if (user.role === 'student' && !user.isApproved) {
      return res.status(403).json({ 
        error: 'Your account is pending approval. Please wait for the administrator to approve your registration.',
        pendingApproval: true
      });
    }
    const token = generateToken(user._id, user.role, user.tokenVersion || 0);

    res.status(200).json({
      success: true,
      token,
      user: user.toJSON()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/auth/me
// @desc    Get current logged in user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      user: user.toJSON()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = router;
