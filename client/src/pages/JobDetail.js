import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jobsAPI, applicationsAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { FaMapMarkerAlt, FaBriefcase, FaStar, FaArrowLeft } from 'react-icons/fa';
import toast from 'react-hot-toast';

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [hasApplied, setHasApplied] = useState(false);

  const fetchJobDetail = useCallback(async () => {
    try {
      setLoading(true);
      const response = await jobsAPI.getById(id);
      setJob(response.data.job);
    } catch (error) {
      toast.error('Failed to load job details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchJobDetail();
  }, [fetchJobDetail]);

  const handleApply = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error('Please login to apply');
      navigate('/login');
      return;
    }

    if (user.role === 'employer') {
      toast.error('Employers cannot apply for jobs');
      return;
    }

    try {
      setApplying(true);
      await applicationsAPI.apply({
        jobId: id,
        coverLetter
      });
      toast.success('Application submitted successfully!');
      setHasApplied(true);
      setCoverLetter('');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  if (!job) return <div className="min-h-screen flex items-center justify-center">Job not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/jobs')}
          className="mb-6 flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold"
        >
          <FaArrowLeft /> Back to Jobs
        </button>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          <div className="p-8 border-b border-gray-200">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-4xl font-bold text-gray-800 mb-2">{job.title}</h1>
                <p className="text-xl text-blue-600 font-semibold">{job.companyName}</p>
              </div>
              <span className="bg-blue-100 text-blue-600 px-6 py-2 rounded-full text-sm font-semibold">
                {job.jobType}
              </span>
            </div>

            <div className="grid md:grid-cols-3 gap-4 text-gray-600 mb-6">
              <div className="flex items-center gap-2">
                <FaMapMarkerAlt className="text-blue-600" />
                <span>{job.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <FaBriefcase className="text-blue-600" />
                <span>{job.category}</span>
              </div>
              {job.salary?.min && (
                <div className="flex items-center gap-2">
                  <FaStar className="text-blue-600" />
                  <span>PKR {job.salary.min.toLocaleString()} - {job.salary.max.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          <div className="p-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Job Description</h2>
            <p className="text-gray-600 mb-8 leading-relaxed whitespace-pre-wrap">{job.description}</p>

            {job.skills?.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-4 text-gray-800">Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill, idx) => (
                    <span key={idx} className="bg-blue-100 text-blue-600 px-4 py-2 rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {job.qualifications?.length > 0 && (
              <div>
                <h3 className="text-xl font-bold mb-4 text-gray-800">Qualifications</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                  {job.qualifications.map((qual, idx) => (
                    <li key={idx}>{qual}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Application Form */}
        {isAuthenticated && user.role === 'student' && !hasApplied && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Apply for this Job</h2>
            <form onSubmit={handleApply} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cover Letter</label>
                <textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Tell us why you're interested in this position..."
                  rows="6"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={applying}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-800 text-white font-bold rounded-lg hover:shadow-lg transition disabled:opacity-50"
              >
                {applying ? 'Submitting...' : 'Submit Application'}
              </button>
            </form>
          </div>
        )}

        {hasApplied && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-8 py-6 rounded-lg text-center">
            <p className="text-lg font-semibold">✓ You have already applied for this job</p>
            <p className="text-green-600 mt-2">We'll notify you when the employer reviews your application.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobDetail;
