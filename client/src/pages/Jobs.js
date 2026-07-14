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
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-800">Browse Jobs</h1>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Job title, company..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                <option value="Electronics">Electronics</option>
                <option value="IT">IT</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Engineering">Engineering</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <input
                type="text"
                name="location"
                value={filters.location}
                onChange={handleFilterChange}
                placeholder="City..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Job Type</label>
              <select
                name="jobType"
                value={filters.jobType}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
          <div className="text-center py-12">Loading jobs...</div>
        ) : jobs.length > 0 ? (
          <div className="grid gap-6">
            {jobs.map(job => (
              <Link key={job._id} to={`/jobs/${job._id}`}>
                <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition cursor-pointer">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">{job.title}</h3>
                      <p className="text-lg text-blue-600 font-semibold">{job.companyName}</p>
                    </div>
                    <span className="bg-blue-100 text-blue-600 px-4 py-2 rounded-full text-sm font-semibold">
                      {job.jobType}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-6 mb-4 text-gray-600">
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

                  <p className="text-gray-600 line-clamp-2">{job.description}</p>
                  {job.skills?.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {job.skills.slice(0, 3).map((skill, idx) => (
                        <span key={idx} className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm">
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
          <div className="text-center py-12 text-gray-500">
            No jobs found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
};

export default Jobs;
