import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaArrowRight,
  FaBell,
  FaBriefcase,
  FaBuilding,
  FaCheckCircle,
  FaComments,
  FaFileUpload,
  FaGraduationCap,
  FaHeadset,
  FaMicrochip,
  FaPaperPlane,
  FaSearch,
  FaShieldAlt
} from 'react-icons/fa';
import { cvAPI } from '../services/api';
import toast from 'react-hot-toast';
import { feedbackAPI } from '../services/feedbackAPI';
import UploadCvModal from '../components/UploadCvModal';

const ActionCard = ({ icon: Icon, title, description, action, children }) => (
  <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
    <div className="flex items-start gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-700">
        <Icon />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-lg font-bold text-gray-950">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-gray-500">{description}</p>
      </div>
    </div>
    {children && <div className="mt-5">{children}</div>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

const StepItem = ({ number, title, text }) => (
  <div className="flex gap-4">
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-950 text-sm font-bold text-white">
      {number}
    </div>
    <div>
      <p className="font-semibold text-gray-950">{title}</p>
      <p className="mt-1 text-sm leading-6 text-gray-500">{text}</p>
    </div>
  </div>
);

const Landing = () => {
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Intern Portal';
    return () => {
      document.title = previousTitle;
    };
  }, []);

  const openUploadModal = () => {
    setSelectedFile(null);
    setIsUploadModalOpen(true);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed');
      event.target.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      event.target.value = '';
      return;
    }

    setSelectedFile(file);
  };

  const handleConfirmUpload = async () => {
    if (!selectedFile) {
      toast.error('Choose a CV before uploading');
      return;
    }

    const hasAuth = (sessionStorage.getItem('token') || localStorage.getItem('token')) || localStorage.getItem('accessToken');
    if (!hasAuth) {
      toast.error('Please sign in to upload your CV');
      navigate('/');
      return;
    }

    try {
      setUploading(true);
      await cvAPI.upload(selectedFile);
      toast.success('CV uploaded successfully');
      setIsUploadModalOpen(false);
      setSelectedFile(null);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to upload CV');
    } finally {
      setUploading(false);
    }
  };

  const handleCancelUpload = () => {
    setIsUploadModalOpen(false);
    setSelectedFile(null);
  };

  const handleFeedbackSubmit = async (event) => {
    event.preventDefault();
    if (!feedback.trim()) {
      toast.error('Please enter your feedback.');
      return;
    }

    setFeedbackSubmitting(true);
    try {
      await feedbackAPI.submit(feedback);
      toast.success('Thank you for your feedback.');
      setFeedback('');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit feedback');
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <UploadCvModal
        isOpen={isUploadModalOpen}
        onClose={handleCancelUpload}
        file={selectedFile}
        onFileChange={handleFileSelect}
        onSubmit={handleConfirmUpload}
        uploading={uploading}
      />

      <section id="home" className="border-b border-gray-200 bg-white px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
              <FaMicrochip />
              Intern Career Portal
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight text-gray-950 sm:text-5xl">
              Submit your CV and stay connected with internship opportunities.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-gray-600">
              Use this portal to upload your latest PDF CV, review available jobs, and send feedback to the admin team.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={openUploadModal}
                disabled={uploading}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FaFileUpload />
                {uploading ? 'Uploading...' : 'Upload CV'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/jobs')}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-800 transition hover:bg-gray-50"
              >
                <FaBriefcase />
                Browse jobs
              </button>
              <button
                type="button"
                onClick={() => navigate('/portal/apply')}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-green-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-green-700"
              >
                📋 Apply for Internship
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: 'File type', value: 'PDF', icon: FaFileUpload },
                { label: 'Max size', value: '10 MB', icon: FaShieldAlt },
                { label: 'Review', value: 'Admin', icon: FaCheckCircle }
              ].map((item) => (
                <div key={item.label} className="rounded-md border border-gray-200 bg-white p-4">
                  <item.icon className="text-blue-700" />
                  <p className="mt-4 text-xs font-bold uppercase tracking-wide text-gray-500">{item.label}</p>
                  <p className="mt-1 text-xl font-bold text-gray-950">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-md border border-blue-100 bg-white p-4">
              <p className="font-semibold text-gray-950">Before uploading</p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-gray-600">
                <li className="flex gap-2"><FaCheckCircle className="mt-1 text-emerald-600" /> Use your latest CV.</li>
                <li className="flex gap-2"><FaCheckCircle className="mt-1 text-emerald-600" /> Keep contact details readable.</li>
                <li className="flex gap-2"><FaCheckCircle className="mt-1 text-emerald-600" /> Upload only a PDF file.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Portal tools</p>
              <h2 className="mt-2 text-2xl font-bold text-gray-950">Everything you need from this page</h2>
            </div>
            <button
              type="button"
              onClick={() => navigate('/jobs')}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
            >
              Open job board <FaArrowRight />
            </button>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <ActionCard
              icon={FaFileUpload}
              title="Submit CV"
              description="Upload your CV as a PDF so the admin team can review and manage it from the dashboard."
              action={
                <button
                  type="button"
                  onClick={openUploadModal}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Upload CV <FaArrowRight />
                </button>
              }
            />
            <ActionCard
              icon={FaSearch}
              title="Browse opportunities"
              description="Search available job posts by category, location, job type, and keywords."
              action={
                <button
                  type="button"
                  onClick={() => navigate('/jobs')}
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
                >
                  View jobs <FaArrowRight />
                </button>
              }
            />
            <ActionCard
              icon={FaComments}
              title="Send feedback"
              description="Share issues, corrections, or suggestions directly with the dashboard team."
              action={
                <a
                  href="#feedback"
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
                >
                  Give feedback <FaArrowRight />
                </a>
              }
            />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-bold text-gray-950">What happens next</h3>
              <div className="mt-5 space-y-5">
                <StepItem number="1" title="Upload your CV" text="The portal stores the PDF and links it to your access session." />
                <StepItem number="2" title="Admin review" text="The dashboard team can view, organize, and delete CV records when needed." />
                <StepItem number="3" title="Stay available" text="Use the job board and keep your contact information updated in your CV." />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {[
                { icon: FaBuilding, title: 'Partner companies', text: 'Opportunities from technology and electronics teams.' },
                { icon: FaGraduationCap, title: 'Student focused', text: 'Built for interns, students, and fresh graduates.' },
                { icon: FaBell, title: 'Useful updates', text: 'Admins can review feedback and portal activity.' },
                { icon: FaShieldAlt, title: 'Controlled access', text: 'Access codes keep the portal limited to approved users.' }
              ].map((item) => (
                <div key={item.title} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                  <item.icon className="text-xl text-blue-700" />
                  <h3 className="mt-4 font-bold text-gray-950">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-gray-500">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="feedback" className="border-y border-gray-200 bg-white px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Feedback</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-950">Tell the team what needs attention</h2>
            <p className="mt-4 text-sm leading-7 text-gray-600">
              Your feedback goes to the dashboard so admins and super admins can review it quickly.
            </p>
          </div>

          <form onSubmit={handleFeedbackSubmit} className="rounded-lg border border-gray-200 bg-gray-50 p-5">
            <label className="mb-2 block text-sm font-semibold text-gray-700">Message</label>
            <textarea
              className="min-h-[150px] w-full resize-none rounded-md border border-gray-200 bg-white p-4 text-sm leading-6 text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Write your feedback here..."
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
              disabled={feedbackSubmitting}
              required
            />
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={feedbackSubmitting}
              >
                <FaPaperPlane />
                {feedbackSubmitting ? 'Submitting...' : 'Submit feedback'}
              </button>
            </div>
          </form>
        </div>
      </section>

      <section id="contact" className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-3">
          <div className="md:col-span-2 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-700">
                <FaHeadset />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-950">Need help?</h2>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Contact support for access-code issues, CV upload problems, or dashboard assistance.
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-950 p-5 text-white shadow-sm">
            <p className="font-bold">Support contact</p>
            <p className="mt-3 break-all text-sm text-gray-300">tameer.corvit999@gmail.com</p>
            <p className="mt-2 text-sm text-gray-300">03174149991</p>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-200 bg-white px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-semibold text-gray-800">Intern Portal</p>
          <p>Copyright {new Date().getFullYear()} Intern Portal. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
