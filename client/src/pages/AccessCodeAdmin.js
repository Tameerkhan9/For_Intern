import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import accessCodeAPI from '../services/accessCodeAPI';
import { usersAPI } from '../services/api';
import toast from 'react-hot-toast';

const AccessCodeAdmin = () => {
  const { user } = useAuth();
  const [generateForm, setGenerateForm] = useState({ userId: '', expiresIn: 30 });
  const [generated, setGenerated] = useState(null);
  const [statusCodeId, setStatusCodeId] = useState('');
  const [statusData, setStatusData] = useState(null);
  const [revokeCodeId, setRevokeCodeId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
          <p className="text-gray-600">Only admin users can manage access codes.</p>
        </div>
      </div>
    );
  }

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await accessCodeAPI.generateCode(
        generateForm.userId.trim(),
        Number(generateForm.expiresIn)
      );
      setGenerated(response.data);
      toast.success('Access code generated');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to generate code');
    } finally {
      setLoading(false);
    }
  };

  const handleUserSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      toast.error('Enter a name or email to search');
      return;
    }
    setLoading(true);
    try {
      const response = await usersAPI.search(searchQuery.trim());
      setSearchResults(response.data.users || []);
      if (!response.data.users?.length) {
        toast('No users found for this search');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to search users');
    } finally {
      setLoading(false);
    }
  };

  const handleStatus = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await accessCodeAPI.getStatus(statusCodeId.trim());
      setStatusData(response.data);
      toast.success('Code status fetched');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to fetch status');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await accessCodeAPI.revokeCode(revokeCodeId.trim());
      toast.success('Access code revoked');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to revoke code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Access Code Admin</h1>
          <p className="text-gray-600">Generate private codes and control access for known people.</p>
        </div>

        <form onSubmit={handleGenerate} className="bg-white p-8 rounded-lg shadow-md space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">Generate Code</h2>
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
            <p className="text-sm text-gray-700 font-medium">Find User by Name or Email</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search user (name or email)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
              />
              <button
                type="button"
                onClick={handleUserSearch}
                disabled={loading}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
              >
                Search
              </button>
            </div>
            {searchResults.length > 0 && (
              <select
                value={generateForm.userId}
                onChange={(e) => setGenerateForm((prev) => ({ ...prev, userId: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select user from results</option>
                {searchResults.map((resultUser) => (
                  <option key={resultUser._id} value={resultUser._id}>
                    {resultUser.name} ({resultUser.email}) - {resultUser.role}
                  </option>
                ))}
              </select>
            )}
          </div>
          <input
            type="text"
            value={generateForm.userId}
            onChange={(e) => setGenerateForm((prev) => ({ ...prev, userId: e.target.value }))}
            placeholder="Target User ID (Mongo ObjectId)"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            required
          />
          <input
            type="number"
            min="1"
            max="365"
            value={generateForm.expiresIn}
            onChange={(e) => setGenerateForm((prev) => ({ ...prev, expiresIn: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Generate Access Code
          </button>
          {generated?.code && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
              <p><strong>Code:</strong> {generated.code}</p>
              <p><strong>Expires:</strong> {new Date(generated.expiresAt).toLocaleString()}</p>
            </div>
          )}
        </form>

        <form onSubmit={handleStatus} className="bg-white p-8 rounded-lg shadow-md space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">Check Code Status</h2>
          <input
            type="text"
            value={statusCodeId}
            onChange={(e) => setStatusCodeId(e.target.value)}
            placeholder="Access Code Document ID"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            Get Status
          </button>
          {statusData?.success && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 space-y-1">
              <p><strong>Code:</strong> {statusData.code}</p>
              <p><strong>Uses:</strong> {statusData.uses} / {statusData.maxUses}</p>
              <p><strong>Last Used:</strong> {statusData.lastUsedAt ? new Date(statusData.lastUsedAt).toLocaleString() : 'Never'}</p>
              <p><strong>Unauthorized Attempts:</strong> {statusData.unauthorizedAttempts?.length || 0}</p>
            </div>
          )}
        </form>

        <form onSubmit={handleRevoke} className="bg-white p-8 rounded-lg shadow-md space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">Revoke Code</h2>
          <input
            type="text"
            value={revokeCodeId}
            onChange={(e) => setRevokeCodeId(e.target.value)}
            placeholder="Access Code Document ID"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            Revoke Code
          </button>
        </form>
      </div>
    </div>
  );
};

export default AccessCodeAdmin;
