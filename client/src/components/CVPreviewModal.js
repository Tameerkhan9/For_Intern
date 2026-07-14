import React from 'react';
import { FaFile, FaTimes } from 'react-icons/fa';

const CVPreviewModal = ({ file, onConfirm, onCancel, isLoading }) => {
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">Review CV</h3>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded transition"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* File Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-blue-100 rounded-lg flex items-center justify-center">
              <FaFile className="text-4xl text-blue-600" />
            </div>
          </div>

          {/* File Info */}
          <div className="space-y-3 mb-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">File Name</p>
              <p className="text-lg font-semibold text-gray-800 break-words">{file.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">File Type</p>
              <p className="text-gray-700">{file.type === 'application/pdf' ? 'PDF Document' : 'Word Document'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">File Size</p>
              <p className="text-gray-700">{formatFileSize(file.size)}</p>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
            <p className="text-sm text-yellow-800">
              ⚠️ Make sure your CV is properly formatted and doesn't contain any sensitive information.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                'Submit CV'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CVPreviewModal;
