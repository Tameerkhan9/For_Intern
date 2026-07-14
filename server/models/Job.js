const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a job title']
  },
  description: {
    type: String,
    required: [true, 'Please provide a job description']
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  companyName: String,
  jobType: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract', 'Internship'],
    default: 'Full-time'
  },
  category: {
    type: String,
    enum: ['Electronics', 'IT', 'Manufacturing', 'Engineering', 'Sales', 'HR', 'Other'],
    required: true
  },
  salary: {
    min: Number,
    max: Number,
    currency: { type: String, default: 'PKR' }
  },
  location: String,
  skills: [String],
  experience: String,
  education: String,
  qualifications: [String],
  applicants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application'
  }],
  applicantCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: Date,
  views: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Index for search optimization
jobSchema.index({ title: 'text', description: 'text', category: 1, location: 1 });

module.exports = mongoose.model('Job', jobSchema);
