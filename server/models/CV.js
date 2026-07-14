const mongoose = require('mongoose');

const cvSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  url: { type: String, required: true },
  // Link to the access code used to upload
  accessCodeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AccessCode',
    default: null
  },
  // Label from the access code (e.g. "Ahmed - Batch 3")
  internLabel: { type: String, default: '' },
  parsedData: {
    name: String,
    email: String,
    phone: String,
    skills: [String],
    experience: [String],
    education: [String]
  },
  uploadedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('CV', cvSchema);
