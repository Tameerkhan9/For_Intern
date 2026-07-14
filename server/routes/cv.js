const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const CV = require('../models/CV');
const AccessCode = require('../models/AccessCode');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer config — PDF only
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'cv-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.pdf' || file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed'));
    }
    cb(null, true);
  }
});

// Auth middleware — accepts session (access code) or JWT (admin)
const allowSessionOrJwt = (req, res, next) => {
  if (req.session?.accessCodeId) {
    req.accessCodeId = req.session.accessCodeId;
    req.internLabel = req.session.internLabel || '';
    req.isPortalUser = true;
    return next();
  }
  // Legacy: session with userId (old registered users)
  if (req.session?.userId) {
    req.legacyUserId = req.session.userId;
    req.isPortalUser = true;
    return next();
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.jwtUser = decoded;
      return next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  }
  return res.status(401).json({ error: 'Not authenticated. Please enter your access code.' });
};

// @route   POST /api/cv/upload
// @desc    Upload CV (anonymous — linked to access code)
// @access  Portal session or JWT
router.post('/upload', allowSessionOrJwt, (req, res, next) => {
  upload.single('cv')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    }
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Please select a PDF file.' });
    }
    next();
  });
}, async (req, res) => {
  try {
    const cvData = {
      filename: req.file.filename,
      url: `/uploads/${req.file.filename}`,
      uploadedAt: new Date()
    };

    // Get intern label from access code
    let internLabel = req.internLabel || '';
    let accessCodeId = req.accessCodeId || null;

    if (accessCodeId) {
      const code = await AccessCode.findById(accessCodeId).select('internLabel');
      if (code) internLabel = code.internLabel || '';
    }

    // Try Python parsing service
    if (process.env.PYTHON_SERVICE_URL) {
      try {
        const formData = new FormData();
        formData.append('file', fs.createReadStream(req.file.path));
        const pythonResponse = await axios.post(
          `${process.env.PYTHON_SERVICE_URL}/parse-cv`,
          formData,
          { headers: formData.getHeaders(), timeout: 30000 }
        );
        cvData.parsedData = pythonResponse.data;
      } catch (pythonError) {
        console.warn('CV parsing service unavailable:', pythonError.message);
      }
    }

    // Save to CV collection
    const cv = await CV.create({
      filename: cvData.filename,
      url: cvData.url,
      accessCodeId,
      internLabel,
      parsedData: cvData.parsedData || {}
    });

    res.status(201).json({
      success: true,
      message: 'CV uploaded successfully',
      cv
    });
  } catch (error) {
    console.error('CV upload error:', error);
    res.status(500).json({ error: error.message || 'Error uploading CV' });
  }
});

// @route   GET /api/cv
// @desc    Get CVs — admin gets all, portal user gets their own (by accessCodeId)
// @access  Private
router.get('/', allowSessionOrJwt, async (req, res) => {
  try {
    let cvs;
    if (req.jwtUser) {
      // Admin — get all CVs
      cvs = await CV.find().sort({ uploadedAt: -1 });
    } else if (req.accessCodeId) {
      // Portal user — get CVs uploaded with their code
      cvs = await CV.find({ accessCodeId: req.accessCodeId }).sort({ uploadedAt: -1 });
    } else {
      cvs = [];
    }
    res.status(200).json({ success: true, cvs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/cv/download/:filename
// @desc    Download/view a CV
// @access  Admin (JWT) or owner (session)
router.get('/download/:filename', allowSessionOrJwt, async (req, res) => {
  try {
    const { filename } = req.params;

    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    // Verify ownership
    if (req.jwtUser) {
      // Admin can download any CV
    } else if (req.accessCodeId) {
      const cv = await CV.findOne({ filename, accessCodeId: req.accessCodeId });
      if (!cv) return res.status(404).json({ error: 'CV not found' });
    } else {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const filePath = path.join(uploadsDir, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.sendFile(filePath);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   DELETE /api/cv/delete/:filename
// @desc    Delete a CV
// @access  Admin (JWT) or owner (session)
router.delete('/delete/:filename', allowSessionOrJwt, async (req, res) => {
  try {
    const { filename } = req.params;

    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    const cv = await CV.findOne({ filename });
    if (!cv) return res.status(404).json({ error: 'CV not found' });

    // Only admin or the code owner can delete
    if (!req.jwtUser && req.accessCodeId?.toString() !== cv.accessCodeId?.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const filePath = path.join(uploadsDir, filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await CV.findByIdAndDelete(cv._id);

    res.status(200).json({ success: true, message: 'CV deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Keep old delete route for compatibility
router.delete('/:filename', allowSessionOrJwt, async (req, res) => {
  req.params.filename = req.params.filename;
  const { filename } = req.params;
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return res.status(400).json({ error: 'Invalid filename' });
  }
  const cv = await CV.findOne({ filename });
  if (!cv) return res.status(404).json({ error: 'CV not found' });
  if (!req.jwtUser && req.accessCodeId?.toString() !== cv.accessCodeId?.toString()) {
    return res.status(403).json({ error: 'Not authorized' });
  }
  const filePath = path.join(uploadsDir, filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  await CV.findByIdAndDelete(cv._id);
  res.status(200).json({ success: true, message: 'CV deleted successfully' });
});

module.exports = router;
