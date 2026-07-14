const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['applied', 'reviewed', 'shortlisted', 'rejected', 'hired'],
    default: 'applied'
  },
  coverLetter: String,
  resume: {
    filename: String,
    url: String,
    parsedData: {
      name: String,
      email: String,
      phone: String,
      skills: [String],
      experience: [String],
      education: [String]
    }
  },
  appliedAt: {
    type: Date,
    default: Date.now
  },
  statusUpdatedAt: Date,
  feedback: String,
  rating: {
    type: Number,
    min: 1,
    max: 5
  }
}, { timestamps: true });

module.exports = mongoose.model('Application', applicationSchema);
