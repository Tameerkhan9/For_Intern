const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
    trim: true
  },
  user: {
    type: String,
    default: 'User',
    trim: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
