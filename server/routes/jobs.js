const express = require('express');
const Job = require('../models/Job');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/jobs
// @desc    Get all jobs with filters
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category, location, jobType, search } = req.query;
    let filter = { isActive: true };

    if (category) filter.category = category;
    if (location) filter.location = new RegExp(location, 'i');
    if (jobType) filter.jobType = jobType;
    if (search) {
      filter.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { companyName: new RegExp(search, 'i') }
      ];
    }

    const jobs = await Job.find(filter)
      .populate('company', 'name companyName email')
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      count: jobs.length,
      jobs
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/jobs/:id
// @desc    Get single job
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('company', 'name companyName email location')
      .populate('applicants');

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Increment views
    job.views += 1;
    await job.save();

    res.status(200).json({
      success: true,
      job
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/jobs
// @desc    Create a new job
// @access  Private (Employer only)
router.post('/', protect, authorize('employer'), async (req, res) => {
  try {
    const { title, description, category, jobType, salary, location, skills, experience, education } = req.body;

    const job = await Job.create({
      title,
      description,
      category,
      jobType,
      salary,
      location,
      skills,
      experience,
      education,
      company: req.user.id,
      postedBy: req.user.id,
      companyName: req.user.companyName
    });

    res.status(201).json({
      success: true,
      job
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT /api/jobs/:id
// @desc    Update job
// @access  Private (Job owner only)
router.put('/:id', protect, async (req, res) => {
  try {
    let job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if user is job owner
    if (job.postedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this job' });
    }

    job = await Job.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      job
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   DELETE /api/jobs/:id
// @desc    Delete job
// @access  Private (Job owner only)
router.delete('/:id', protect, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if user is job owner
    if (job.postedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this job' });
    }

    await Job.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
