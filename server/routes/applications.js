const express = require('express');
const Application = require('../models/Application');
const Job = require('../models/Job');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/applications
// @desc    Apply for a job
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { jobId, coverLetter } = req.body;

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if already applied
    const existingApplication = await Application.findOne({
      job: jobId,
      applicant: req.user.id
    });

    if (existingApplication) {
      return res.status(400).json({ error: 'You have already applied for this job' });
    }

    // Create application
    const application = await Application.create({
      job: jobId,
      applicant: req.user.id,
      coverLetter
    });

    // Add to job's applicants list
    job.applicants.push(application._id);
    job.applicantCount += 1;
    await job.save();

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      application
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/applications
// @desc    Get applications (for current user or their posted jobs)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let applications;

    if (req.query.forJobs) {
      // Get applications for jobs posted by current user
      const jobs = await Job.find({ postedBy: req.user.id });
      const jobIds = jobs.map(j => j._id);
      applications = await Application.find({ job: { $in: jobIds } })
        .populate('applicant', 'name email phone skills')
        .populate('job', 'title company');
    } else {
      // Get applications of current user
      applications = await Application.find({ applicant: req.user.id })
        .populate('job', 'title companyName salary location')
        .sort({ appliedAt: -1 });
    }

    res.status(200).json({
      success: true,
      count: applications.length,
      applications
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT /api/applications/:id/status
// @desc    Update application status
// @access  Private (Employer only)
router.put('/:id/status', protect, authorize('employer', 'admin'), async (req, res) => {
  try {
    const { status } = req.body;

    const application = await Application.findById(req.params.id).populate('job');

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Check if user is job owner
    if (application.job.postedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this application' });
    }

    application.status = status;
    application.statusUpdatedAt = new Date();
    await application.save();

    res.status(200).json({
      success: true,
      message: 'Application status updated',
      application
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
