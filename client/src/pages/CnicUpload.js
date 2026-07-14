import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';

const CnicUpload = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cnicFront, setCnicFront] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File must be less than 5MB');
      e.target.value = '';
      return;
    }
    setCnicFront(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cnicFront) {
      toast.error('Please select your CNIC front image');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('cnicFront', cnicFront);

      await api.patch(`/intern-applications/${id}/cnic-front`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('CNIC front uploaded successfully!');
      navigate('/portal');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSkip = () => {
    toast('You can upload your CNIC front later if needed.', { icon: 'ℹ️' });
    navigate('/portal');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-lg bg-white shadow-lg rounded-lg overflow-hidden">

        {/* Header */}
        <div className="text-center py-6 border-b-2 border-gray-800 px-6">
          <h1 className="text-xl font-bold uppercase">National Electronics Complex of Pakistan</h1>
          <h2 className="text-lg font-bold">(HRM Directorate)</h2>
          <h3 className="text-base font-semibold underline mt-1">CNIC Front Upload</h3>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-0 px-6 pt-5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-green-600 text-white text-xs font-bold flex items-center justify-center">✓</div>
            <span className="text-sm font-semibold text-green-700">Application Form</span>
          </div>
          <div className="flex-1 h-0.5 bg-gray-300 mx-3" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">2</div>
            <span className="text-sm font-semibold text-blue-700">CNIC Front</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          <div>
            <p className="text-sm text-gray-600 leading-6">
              Your application has been submitted. Please upload a clear photo of the
              <strong> front side of your CNIC</strong> to complete your submission.
            </p>
          </div>

          {/* Upload box */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              CNIC Front <span className="text-red-500">*</span>
            </label>
            <label className="block cursor-pointer">
              <div className={`border-2 border-dashed rounded-xl p-6 text-center transition ${
                cnicFront
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
              }`}>
                {cnicFront ? (
                  <div className="space-y-3">
                    <img
                      src={URL.createObjectURL(cnicFront)}
                      alt="CNIC Front preview"
                      className="mx-auto max-h-48 rounded-lg object-contain border border-gray-200 shadow-sm"
                    />
                    <p className="text-sm font-semibold text-blue-700">{cnicFront.name}</p>
                    <p className="text-xs text-gray-500">
                      {(cnicFront.size / 1024).toFixed(0)} KB — click to change
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 text-gray-400">
                    <p className="text-5xl">🪪</p>
                    <p className="text-sm font-semibold text-gray-600">Click to select CNIC front</p>
                    <p className="text-xs">JPG or PNG — max 5MB</p>
                    <p className="text-xs text-gray-300">Make sure the image is clear and all text is readable</p>
                  </div>
                )}
              </div>
              <input
                type="file"
                accept=".jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Tips */}
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-xs text-amber-800 space-y-1">
            <p className="font-semibold">Tips for a good CNIC photo:</p>
            <ul className="list-disc list-inside space-y-0.5 mt-1">
              <li>Place the CNIC on a flat, well-lit surface</li>
              <li>Ensure all four corners are visible</li>
              <li>All text must be clearly readable</li>
              <li>Avoid glare or shadows on the card</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-2">
            <button
              type="submit"
              disabled={uploading || !cnicFront}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-800 text-white font-bold rounded-lg hover:shadow-lg transition disabled:opacity-50 text-base"
            >
              {uploading ? 'Uploading...' : 'Upload & Finish'}
            </button>
            <button
              type="button"
              onClick={handleSkip}
              className="w-full py-2.5 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition text-sm"
            >
              Skip for now
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default CnicUpload;
