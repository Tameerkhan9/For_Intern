import React, { useCallback, useEffect, useState } from 'react';
import { jobsAPI } from '../services/api';
import { FaStar, FaMapMarkerAlt, FaBriefcase } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    location: '',
    jobType: '',
    search: ''
  });

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await jobsAPI.getAll(filters);
      setJobs(response.data.jobs);
    } catch (error) {
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 overflow-hidden rounded-3xl bg-slate-950 px-6 py-8 text-white shadow-xl shadow-slate-900/10 sm:px-9">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">Opportunity board</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Find your next opportunity</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
            Explore current internships and roles, then open any listing to review the full requirements.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_35px_-28px_rgba(15,23,42,0.45)] sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><FaBriefcase /></span>
            <div>
              <h2 className="font-semibold text-slate-950">Search & filters</h2>
              <p className="text-xs text-slate-500">Narrow the list to the roles that fit you.</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Search</label>
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Job title, company..."
                className="modern-input py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Category</label>
              <select
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                className="modern-input py-2.5 text-sm"
              >
                <option value="">All Categories</option>
                <option value="Electronics">Electronics</option>
                <option value="IT">IT</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Engineering">Engineering</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Location</label>
              <input
                type="text"
                name="location"
                value={filters.location}
                onChange={handleFilterChange}
                placeholder="City..."
                className="modern-input py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Job type</label>
              <select
                name="jobType"
                value={filters.jobType}
                onChange={handleFilterChange}
                className="modern-input py-2.5 text-sm"
              >
                <option value="">All Types</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Internship">Internship</option>
              </select>
            </div>
          </div>
        </div>

        {/* Job Listings */}
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center font-semibold text-slate-500">Loading opportunities...</div>
        ) : jobs.length > 0 ? (
          <div className="grid gap-5">
            {jobs.map(job => (
              <Link key={job._id} to={`/jobs/${job._id}`}>
                <div className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_10px_30px_-26px_rgba(15,23,42,0.4)] transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_20px_45px_-28px_rgba(37,99,235,0.38)]">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="mb-2 text-xl font-semibold tracking-tight text-slate-950 transition group-hover:text-blue-700 sm:text-2xl">{job.title}</h3>
                      <p className="font-semibold text-blue-600">{job.companyName}</p>
                    </div>
                    <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 ring-1 ring-inset ring-blue-100">
                      {job.jobType}
                    </span>
                  </div>

                  <div className="mb-4 flex flex-wrap gap-5 text-sm font-medium text-slate-500">
                    <div className="flex items-center gap-2">
                      <FaMapMarkerAlt />
                      <span>{job.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaBriefcase />
                      <span>{job.category}</span>
                    </div>
                    {job.salary?.min && (
                      <div className="flex items-center gap-2">
                        <FaStar />
                        <span>PKR {job.salary.min.toLocaleString()} - {job.salary.max.toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  <p className="line-clamp-2 leading-7 text-slate-600">{job.description}</p>
                  {job.skills?.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {job.skills.slice(0, 3).map((skill, idx) => (
                        <span key={idx} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center text-slate-500">
            <FaBriefcase className="mx-auto mb-4 text-3xl text-slate-300" />
            <p className="font-bold text-slate-700">No matching opportunities</p>
            <p className="mt-1 text-sm">Try changing one or more filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Jobs;
