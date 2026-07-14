import React from 'react';
import { FaFilePdf, FaFileUpload, FaTimes } from 'react-icons/fa';

const formatFileSize = (bytes) => {
  if (!bytes) return '0 KB';
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

const UploadCvModal = ({ isOpen, onClose, file, onFileChange, onSubmit, uploading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 p-4">
      <div className="w-full max-w-xl overflow-hidden rounded-lg bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-gray-200 px-5 py-4">
          <div className="flex gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-700">
              <FaFileUpload />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-950">Upload CV</h2>
              <p className="mt-1 text-sm text-gray-500">Select a PDF file up to 10 MB.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={uploading}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 text-gray-500 transition hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            aria-label="Close upload modal"
          >
            <FaTimes />
          </button>
        </div>

        <div className="px-5 py-5">
          <label
            htmlFor="cv-upload"
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-5 py-8 text-center transition hover:border-blue-300 hover:bg-blue-50/50"
          >
            <FaFilePdf className="text-4xl text-red-500" />
            <span className="mt-4 text-sm font-bold text-gray-900">Choose PDF file</span>
            <span className="mt-1 text-xs text-gray-500">Your file will be uploaded after confirmation.</span>
            <input
              id="cv-upload"
              key={file ? file.name : 'upload-cv-input'}
              type="file"
              accept=".pdf"
              onChange={onFileChange}
              disabled={uploading}
              className="sr-only"
            />
          </label>

          {file && (
            <div className="mt-4 rounded-md border border-blue-100 bg-blue-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Selected file</p>
              <p className="mt-2 break-words text-sm font-semibold text-gray-900">{file.name}</p>
              <p className="mt-1 text-xs text-gray-500">{formatFileSize(file.size)}</p>
            </div>
          )}

          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={!file || uploading}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FaFileUpload />
              {uploading ? 'Uploading...' : 'Upload CV'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadCvModal;
