const mongoose = require('mongoose');

const qualificationSchema = new mongoose.Schema({
  level: String,
  passingYear: String,
  marksDiv: String,
  percentage: String,
  cgpa: String,
  institute: String,
  subjects: String
}, { _id: false });

const experienceSchema = new mongoose.Schema({
  organization: String,
  designation: String,
  from: String,
  to: String
}, { _id: false });

const internApplicationSchema = new mongoose.Schema({
  // Access code reference
  accessCodeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AccessCode',
    default: null
  },
  internLabel: { type: String, default: '' },

  // Personal Info
  cnicNo: { type: String, required: true },
  name: { type: String, required: true },
  fatherName: String,
  fatherOccupation: String,
  presentAddress: String,
  presentPhone: String,
  permanentAddress: String,
  permanentPhone: String,
  email: String,
  mobileNo: String,
  dateOfBirth: String,
  ageYears: String,
  ageMonths: String,
  maritalStatus: String,
  domicileCity: String,
  domicileProvince: String,
  religion: String,
  sect: String,
  nationality: String,
  foreignNationality: String,
  dualNationalityHolder: String,
  spouseOnForeignMission: String,
  marriedToForeignNational: String,

  // Qualifications table
  qualifications: [qualificationSchema],

  // Experience
  experience: [experienceSchema],

  // Internship details
  purposeOfInternship: String,
  duration: String,
  date: String,
  referredBy: String,

  // File uploads
  photo: String,        // filename
  cnicFront: String,    // filename
  cnicBack: String,     // filename
  cv: String,           // filename (optional)
  matricDmc: String,    // filename
  fscDmc: String,       // filename
  uniDegree: String,    // filename (degree or transcript)
  recommendationLetter: String, // filename

  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('InternApplication', internApplicationSchema);

