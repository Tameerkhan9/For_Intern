const express = require('express');
const Feedback = require('../models/Feedback');
const router = express.Router();

const normalizeFeedbackUser = (user) => {
  const name = typeof user === 'string' ? user.trim() : '';
  return !name || name.toLowerCase() === 'anonymous' ? 'User' : name;
};

// POST /api/feedback - submit feedback
router.post('/', async (req, res) => {
  try {
    const { message, user } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Feedback message is required.' });
    }
    const feedback = await Feedback.create({
      message: message.trim(),
      user: normalizeFeedbackUser(user)
    });
    res.status(201).json({ success: true, feedback });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/feedback - get all feedback (for dashboard)
router.get('/', async (req, res) => {
  try {
    const feedbacks = await Feedback.find()
      .sort({ createdAt: -1 })
      .lean();

    // Normalize _id to id for frontend compatibility
    const normalized = feedbacks.map(fb => ({
      ...fb,
      user: normalizeFeedbackUser(fb.user),
      id: fb._id.toString()
    }));

    res.json({ feedbacks: normalized });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/feedback/:id - delete feedback by id
router.delete('/:id', async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params.id);
    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }
    res.json({ success: true, message: 'Feedback deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
