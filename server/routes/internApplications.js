const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const InternApplication = require('../models/InternApplication');
const AccessCode = require('../models/AccessCode');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Uploads directory
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Multer â€” accept images (jpg/png) and PDF
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) {
      return cb(new Error(`File type not allowed: ${ext}. Use JPG, PNG or PDF.`));
    }
    cb(null, true);
  }
});

// Auth â€” session or JWT
const allowSessionOrJwt = (req, res, next) => {
  if (req.session?.accessCodeId) {
    req.accessCodeId = req.session.accessCodeId;
    req.internLabel = req.session.internLabel || '';
    return next();
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.slice(7), process.env.JWT_KEY);
      req.jwtUser = decoded;
      return next();
    } catch {
      return res.status(401).json({ error: 'Invalid token' });
    }
  }
  return res.status(401).json({ error: 'Not authenticated' });
};

// @route   POST /api/intern-applications
// @desc    Submit internship application form
// @access  Portal session
router.post('/',
  allowSessionOrJwt,
  upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'cnicFront', maxCount: 1 },
    { name: 'cnicBack', maxCount: 1 },
    { name: 'cv', maxCount: 1 },
    { name: 'matricDmc', maxCount: 1 },
    { name: 'fscDmc', maxCount: 1 },
    { name: 'uniDegree', maxCount: 1 },
    { name: 'recommendationLetter', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const body = req.body;
      const files = req.files || {};

      // Parse JSON fields sent as strings
      let qualifications = [];
      let experience = [];
      try { qualifications = JSON.parse(body.qualifications || '[]'); } catch {}
      try { experience = JSON.parse(body.experience || '[]'); } catch {}

      const application = await InternApplication.create({
        accessCodeId: req.accessCodeId || null,
        internLabel: req.internLabel || '',
        cnicNo: body.cnicNo,
        name: body.name,
        fatherName: body.fatherName,
        fatherOccupation: body.fatherOccupation,
        presentAddress: body.presentAddress,
        presentPhone: body.presentPhone,
        permanentAddress: body.permanentAddress,
        permanentPhone: body.permanentPhone,
        email: body.email,
        mobileNo: body.mobileNo,
        dateOfBirth: body.dateOfBirth,
        ageYears: body.ageYears,
        ageMonths: body.ageMonths,
        maritalStatus: body.maritalStatus,
        domicileCity: body.domicileCity,
        domicileProvince: body.domicileProvince,
        religion: body.religion,
        sect: body.sect,
        nationality: body.nationality,
        foreignNationality: body.foreignNationality,
        dualNationalityHolder: body.dualNationalityHolder,
        spouseOnForeignMission: body.spouseOnForeignMission,
        marriedToForeignNational: body.marriedToForeignNational,
        qualifications,
        experience,
        purposeOfInternship: body.purposeOfInternship,
        duration: body.duration,
        date: body.date,
        referredBy: body.referredBy,
        photo: files.photo?.[0]?.filename || '',
        cnicFront: files.cnicFront?.[0]?.filename || '',
        cnicBack: files.cnicBack?.[0]?.filename || '',
        cv: files.cv?.[0]?.filename || '',
        matricDmc: files.matricDmc?.[0]?.filename || '',
        fscDmc: files.fscDmc?.[0]?.filename || '',
        uniDegree: files.uniDegree?.[0]?.filename || '',
        recommendationLetter: files.recommendationLetter?.[0]?.filename || ''
      });

      res.status(201).json({ success: true, message: 'Application submitted successfully', application });
    } catch (error) {
      console.error('Application submit error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// @route   PATCH /api/intern-applications/:id/cnic-front
// @desc    Upload CNIC front separately after form submission
// @access  Portal session
router.patch('/:id/cnic-front',
  allowSessionOrJwt,
  upload.single('cnicFront'),
  async (req, res) => {
    try {
      const application = await InternApplication.findById(req.params.id);
      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Delete old cnicFront file if it exists
      if (application.cnicFront) {
        const oldPath = path.join(uploadsDir, application.cnicFront);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      application.cnicFront = req.file.filename;
      await application.save();

      res.status(200).json({ success: true, message: 'CNIC front uploaded successfully' });
    } catch (error) {
      console.error('CNIC front upload error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// @route   GET /api/intern-applications/file/:filename
// @desc    Serve an uploaded file (photo, cnic, cv) â€” admin only
// @access  Admin only
router.get('/file/:filename', protect, authorize('admin'), (req, res) => {
  const filename = req.params.filename;
  // Basic path traversal guard
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return res.status(400).json({ error: 'Invalid filename' });
  }
  const filePath = path.join(uploadsDir, filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  res.sendFile(filePath);
});

// @route   GET /api/intern-applications
// @desc    Get all applications (admin/superadmin)
// @access  Admin only
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const applications = await InternApplication.find()
      .sort({ submittedAt: -1 });
    res.status(200).json({ success: true, count: applications.length, applications });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/intern-applications/:id
// @desc    Get single application
// @access  Admin only
router.get('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const application = await InternApplication.findById(req.params.id);
    if (!application) return res.status(404).json({ error: 'Application not found' });
    res.status(200).json({ success: true, application });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   DELETE /api/intern-applications/:id
// @desc    Delete an application
// @access  Admin only
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const application = await InternApplication.findById(req.params.id);
    if (!application) return res.status(404).json({ error: 'Application not found' });

    // Delete uploaded files
    ['photo', 'cnicFront', 'cnicBack', 'cv', 'matricDmc', 'fscDmc', 'uniDegree', 'recommendationLetter'].forEach(field => {
      if (application[field]) {
        const filePath = path.join(uploadsDir, application[field]);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    });

    await InternApplication.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Application deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

