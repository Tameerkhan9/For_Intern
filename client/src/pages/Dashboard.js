import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaClipboardList,
  FaComments,
  FaCopy,
  FaExternalLinkAlt,
  FaEye,
  FaEyeSlash,
  FaFileUpload,
  FaIdCard,
  FaInfoCircle,
  FaKey,
  FaSearch,
  FaTimes,
  FaTrash,
  FaUserMinus,
  FaUserPlus,
  FaUserShield
} from 'react-icons/fa';
import api, { cvAPI, usersAPI } from '../services/api';
import { feedbackAPI } from '../services/feedbackAPI';
import accessCodeAPI from '../services/accessCodeAPI';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { useAuth } from '../hooks/useAuth';
import PasswordInput from '../components/PasswordInput';

const formatDate = (value, fallback = '-') => {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date.toLocaleString();
};

const shortDate = (value, fallback = '-') => {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date.toLocaleDateString();
};

const parseCgpa = (value) => {
  const parsed = Number.parseFloat(String(value ?? '').replace(',', '.'));
  return Number.isNaN(parsed) ? null : parsed;
};

const getApplicationCgpa = (app) => {
  const quals = app?.qualifications || [];
  for (let i = quals.length - 1; i >= 0; i -= 1) {
    const val = parseCgpa(quals[i]?.cgpa);
    if (val !== null) return val;
  }
  return null;
};

const getCvEmail = (cv) => {
  return cv?.parsedData?.email || cv?.parsedData?.data?.email || '-';
};

const cx = (...classes) => classes.filter(Boolean).join(' ');

const StatusPill = ({ tone = 'gray', children }) => {
  const tones = {
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    red: 'bg-red-50 text-red-700 ring-red-200',
    amber: 'bg-amber-50 text-amber-700 ring-amber-200',
    blue: 'bg-blue-50 text-blue-700 ring-blue-200',
    gray: 'bg-gray-100 text-gray-700 ring-gray-200'
  };

  return (
    <span className={cx('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1', tones[tone])}>
      {children}
    </span>
  );
};

const IconButton = ({ children, className = '', ...props }) => (
  <button
    type="button"
    className={cx(
      'inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    {...props}
  >
    {children}
  </button>
);

const PrimaryButton = ({ children, className = '', ...props }) => (
  <button
    type="button"
    className={cx(
      'inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    {...props}
  >
    {children}
  </button>
);

const SecondaryButton = ({ children, className = '', ...props }) => (
  <button
    type="button"
    className={cx(
      'inline-flex items-center justify-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    {...props}
  >
    {children}
  </button>
);

const DangerButton = ({ children, className = '', ...props }) => (
  <button
    type="button"
    className={cx(
      'inline-flex items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    {...props}
  >
    {children}
  </button>
);

const SectionPanel = ({ id, title, description, icon: Icon, children, action }) => (
  <section id={id} className="rounded-lg border border-gray-200 bg-white shadow-sm">
    <div className="flex flex-col gap-4 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-700">
            <Icon />
          </div>
        )}
        <div>
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
        </div>
      </div>
      {action}
    </div>
    <div className="p-5">{children}</div>
  </section>
);

const StatCard = ({ label, value, helper, icon: Icon, tone = 'blue' }) => {
  const tones = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700',
    gray: 'bg-gray-100 text-gray-700'
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-3 text-3xl font-bold text-gray-950">{value}</p>
        </div>
        <div className={cx('flex h-11 w-11 items-center justify-center rounded-md', tones[tone])}>
          <Icon />
        </div>
      </div>
      {helper && <p className="mt-4 text-sm text-gray-500">{helper}</p>}
    </div>
  );
};

const SearchBox = ({ value, onChange, placeholder }) => (
  <div className="relative w-full sm:max-w-xs">
    <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400" />
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-md border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
    />
  </div>
);

const EmptyState = ({ title, message }) => (
  <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-5 py-10 text-center">
    <p className="font-semibold text-gray-800">{title}</p>
    <p className="mt-1 text-sm text-gray-500">{message}</p>
  </div>
);

const ConfirmModal = ({ config, onClose }) => {
  const [working, setWorking] = useState(false);
  if (!config) return null;

  const handleConfirm = async () => {
    try {
      setWorking(true);
      await config.onConfirm();
      onClose();
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h3 className="text-lg font-bold text-gray-950">{config.title}</h3>
            <p className="mt-1 text-sm text-gray-500">{config.message}</p>
          </div>
          <IconButton onClick={onClose} aria-label="Close confirmation">
            <FaTimes />
          </IconButton>
        </div>
        <div className="flex flex-col-reverse gap-3 px-5 py-4 sm:flex-row sm:justify-end">
          <SecondaryButton onClick={onClose} disabled={working}>Cancel</SecondaryButton>
          {config.tone === 'red' ? (
            <DangerButton onClick={handleConfirm} disabled={working}>
              {working ? 'Working...' : config.actionLabel}
            </DangerButton>
          ) : (
            <PrimaryButton onClick={handleConfirm} disabled={working}>
              {working ? 'Working...' : config.actionLabel}
            </PrimaryButton>
          )}
        </div>
      </div>
    </div>
  );
};

const FeedbackModal = ({ feedback, onClose }) => {
  if (!feedback) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Feedback</p>
            <h3 className="mt-1 text-xl font-bold text-gray-950">{feedback.user || 'User'}</h3>
            <p className="mt-1 text-sm text-gray-500">{formatDate(feedback.createdAt)}</p>
          </div>
          <IconButton onClick={onClose} aria-label="Close feedback">
            <FaTimes />
          </IconButton>
        </div>
        <div className="max-h-[65vh] overflow-y-auto px-5 py-5">
          <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">{feedback.message}</p>
        </div>
      </div>
    </div>
  );
};

const DashboardUserRow = ({ user, index, onDelete, onPasswordSave }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [editing, setEditing] = useState(false);
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!password || password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    try {
      setSaving(true);
      await onPasswordSave(user._id, password);
      setEditing(false);
      setPassword('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
      <td className="px-4 py-3">
        <p className="font-semibold text-gray-900">{user.name}</p>
        <p className="text-xs text-gray-500">{user.role}</p>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
      <td className="px-4 py-3">
        {user.plainPassword && !editing ? (
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-gray-800">
              {showPassword ? user.plainPassword : '********'}
            </span>
            <IconButton onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </IconButton>
          </div>
        ) : (
          <div className="flex min-w-[230px] flex-col gap-2 sm:flex-row">
            {editing ? (
              <>
                <input
                  type="text"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="New password"
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <PrimaryButton onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving' : 'Save'}
                </PrimaryButton>
                <SecondaryButton onClick={() => setEditing(false)} disabled={saving}>
                  Cancel
                </SecondaryButton>
              </>
            ) : (
              <SecondaryButton onClick={() => setEditing(true)}>Set password</SecondaryButton>
            )}
          </div>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">{shortDate(user.createdAt)}</td>
      <td className="px-4 py-3 text-right">
        <DangerButton onClick={() => onDelete(user)} className="px-3 py-2">
          <FaUserMinus /> Remove
        </DangerButton>
      </td>
    </tr>
  );
};

/* ─── AuthImage: fetches a protected file with JWT and renders it ── */
const useAuthBlob = (filename) => {
  const [blobUrl, setBlobUrl] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!filename) return;
    let revoked = false;
    setLoading(true);
    const token = (sessionStorage.getItem('token') || localStorage.getItem('token'));
    const apiBase = process.env.NODE_ENV === 'development'
      ? '/api'
      : (process.env.REACT_APP_API_URL || '/api');
    fetch(`${apiBase}/intern-applications/file/${encodeURIComponent(filename)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
      .then(r => r.ok ? r.blob() : null)
      .then(blob => {
        if (!revoked && blob) setBlobUrl(URL.createObjectURL(blob));
      })
      .catch(() => {})
      .finally(() => { if (!revoked) setLoading(false); });
    return () => {
      revoked = true;
      setBlobUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null; });
    };
  }, [filename]);

  return { blobUrl, loading };
};

const AuthImage = ({ filename, alt, className, onClick }) => {
  const { blobUrl, loading } = useAuthBlob(filename);
  if (loading) return (
    <div className={`${className} flex items-center justify-center bg-gray-100 animate-pulse`}>
      <span className="text-xs text-gray-400">Loading…</span>
    </div>
  );
  if (!blobUrl) return (
    <div className={`${className} flex items-center justify-center bg-gray-100`}>
      <span className="text-xs text-gray-400 italic">No image</span>
    </div>
  );
  return <img src={blobUrl} alt={alt} className={className} onClick={onClick} />;
};

const AuthPdfLink = ({ filename, label }) => {
  const { blobUrl, loading } = useAuthBlob(filename);
  if (loading) return <span className="text-xs text-gray-400">Loading…</span>;
  if (!blobUrl) return <span className="text-xs text-gray-400 italic">Not available</span>;
  return (
    <a href={blobUrl} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline font-semibold">
      <FaExternalLinkAlt className="text-[10px]" /> Open {label}
    </a>
  );
};

const AuthDownloadLink = ({ filename, label }) => {
  const { blobUrl, loading } = useAuthBlob(filename);
  if (loading) return <span className="text-xs text-gray-400">Loadingâ€¦</span>;
  if (!blobUrl) return null;
  return (
    <a
      href={blobUrl}
      download={filename || `${label}.file`}
      className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:underline font-semibold"
    >
      <FaExternalLinkAlt className="text-[10px]" /> Download
    </a>
  );
};

const ApplicationDetailModal = ({ application: app, onClose, onPrintDocuments, onOpenPdfDocuments }) => {
  const [lightbox, setLightbox] = useState(null); // { filename, label }
  if (!app) return null;
  const getCgpaTone = (value) => {
    const parsed = Number.parseFloat(String(value ?? '').replace(',', '.'));
    if (Number.isNaN(parsed)) return 'text-gray-600';
    return parsed < 3 ? 'text-red-600 font-semibold' : 'text-emerald-700 font-semibold';
  };

  /* DocCard — uses AuthImage so the JWT token is sent with the request */
  const DocCard = ({ filename, label }) => {
    const isPdf = filename?.toLowerCase().endsWith('.pdf');
    if (!filename) return (
      <div className="rounded-lg border border-dashed border-gray-200 p-3 text-center">
        <p className="text-xs font-semibold text-gray-500 mb-2">{label}</p>
        <div className="h-28 flex items-center justify-center text-xs text-gray-400 italic">Not uploaded</div>
      </div>
    );
    return (
      <div className="rounded-lg border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-3 py-1.5 border-b border-gray-200 flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-600">{label}</p>
          <div className="flex items-center gap-2">
            {isPdf && <AuthPdfLink filename={filename} label={label} />}
            <AuthDownloadLink filename={filename} label={label} />
          </div>
        </div>
        {isPdf ? (
          <div className="h-32 flex flex-col items-center justify-center bg-gray-50 gap-2">
            <span className="text-4xl">📄</span>
            <AuthPdfLink filename={filename} label="View PDF" />
          </div>
        ) : (
          <button type="button" onClick={() => setLightbox({ filename, label })}
            className="block w-full group relative overflow-hidden bg-gray-50 cursor-zoom-in">
            <AuthImage
              filename={filename} alt={label}
              className="w-full h-32 object-contain transition group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition flex items-center justify-center pointer-events-none">
              <span className="opacity-0 group-hover:opacity-100 text-white text-xs font-semibold bg-black/50 px-2 py-1 rounded transition">
                Click to enlarge
              </span>
            </div>
          </button>
        )}
      </div>
    );
  };

  const Row = ({ label, value }) => (
    <div className="flex gap-2 text-sm">
      <span className="w-44 shrink-0 font-semibold text-gray-600">{label}</span>
      <span className="text-gray-800">{value || '-'}</span>
    </div>
  );

  return (
    <>
      {/* Lightbox — uses AuthImage for the enlarged view */}
      {lightbox && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4"
          onClick={() => setLightbox(null)}>
          <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-white font-semibold">{lightbox.label}</p>
              <button onClick={() => setLightbox(null)}
                className="text-white hover:text-gray-300 text-3xl leading-none font-light">×</button>
            </div>
            <AuthImage
              filename={lightbox.filename} alt={lightbox.label}
              className="w-full max-h-[82vh] object-contain rounded-lg shadow-2xl bg-white"
            />
          </div>
        </div>
      )}

      <div className="fixed inset-0 z-50 flex items-start justify-center bg-gray-950/60 p-4 overflow-y-auto">
        <div className="w-full max-w-3xl rounded-lg bg-white shadow-xl my-8">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
            <div className="flex items-center gap-4">
              {app.photo ? (
                <AuthImage
                  filename={app.photo} alt={app.name}
                  className="h-16 w-16 rounded-full object-cover border-2 border-blue-200"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-400 text-2xl">
                  <FaIdCard />
                </div>
              )}
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Internship Application</p>
                <h3 className="text-xl font-bold text-gray-950">{app.name}</h3>
                <p className="text-sm text-gray-500 font-mono">{app.cnicNo}</p>
              </div>
            </div>
            <IconButton onClick={onClose} aria-label="Close application detail">
              <FaTimes />
            </IconButton>
          </div>

          <div className="max-h-[75vh] overflow-y-auto px-6 py-5 space-y-6">
            {/* Personal Info */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3">Personal Information</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <Row label="Father's Name" value={app.fatherName} />
                <Row label="Father's Occupation" value={app.fatherOccupation} />
                <Row label="Date of Birth" value={app.dateOfBirth} />
                <Row label="Age" value={app.ageYears ? `${app.ageYears} yr. (s)  ${app.ageMonths} month(s)` : '-'} />
                <Row label="Marital Status" value={app.maritalStatus} />
                <Row label="Religion" value={app.religion} />
                <Row label="Sect" value={app.sect} />
                <Row label="Nationality" value={app.nationality} />
                <Row label="Foreign Nationality" value={app.foreignNationality} />
                <Row label="Domicile City" value={app.domicileCity} />
                <Row label="Domicile Province" value={app.domicileProvince} />
              </div>
            </div>

            {/* Contact */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3">Contact Details</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <Row label="Email" value={app.email} />
                <Row label="Mobile" value={app.mobileNo} />
                <Row label="Present Address" value={app.presentAddress} />
                <Row label="Phone" value={app.presentPhone} />
                <Row label="Permanent Address" value={app.permanentAddress} />
                <Row label="Phone" value={app.permanentPhone} />
              </div>
            </div>

            {/* Nationality Questions */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3">Nationality Questions</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <Row label="Dual Nationality Holder" value={app.dualNationalityHolder} />
                <Row label="Spouse on Foreign Mission" value={app.spouseOnForeignMission} />
                <Row label="Married to Foreign National" value={app.marriedToForeignNational} />
              </div>
            </div>

            {/* Qualifications */}
            {app.qualifications?.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3">Qualifications</p>
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="min-w-full text-xs divide-y divide-gray-200">
                    <thead className="bg-gray-50 text-gray-500 uppercase tracking-wide">
                      <tr>
                        <th className="px-3 py-2 text-left">Level</th>
                        <th className="px-3 py-2">Year</th>
                        <th className="px-3 py-2">Marks/Div</th>
                        <th className="px-3 py-2">%</th>
                        <th className="px-3 py-2">CGPA</th>
                        <th className="px-3 py-2 text-left">Institute</th>
                        <th className="px-3 py-2 text-left">Subjects/Qualification</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {app.qualifications.map((q, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2 text-gray-700">{q.level}</td>
                          <td className="px-3 py-2 text-center text-gray-600">{q.passingYear || '-'}</td>
                          <td className="px-3 py-2 text-center text-gray-600">{q.marksDiv || '-'}</td>
                          <td className="px-3 py-2 text-center text-gray-600">{q.percentage || '-'}</td>
                          <td className={cx('px-3 py-2 text-center', getCgpaTone(q.cgpa))}>{q.cgpa || '-'}</td>
                          <td className="px-3 py-2 text-gray-600 break-words max-w-[160px]">{q.institute || '-'}</td>
                          <td className="px-3 py-2 text-gray-600">{q.subjects || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Experience */}
            {app.experience?.some(e => e.organization) && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3">Previous Experience</p>
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="min-w-full text-xs divide-y divide-gray-200">
                    <thead className="bg-gray-50 text-gray-500 uppercase tracking-wide">
                      <tr>
                        <th className="px-3 py-2 text-left">Organization</th>
                        <th className="px-3 py-2 text-left">Designation</th>
                        <th className="px-3 py-2">From</th>
                        <th className="px-3 py-2">To</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {app.experience.filter(e => e.organization).map((exp, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2 text-gray-700">{exp.organization}</td>
                          <td className="px-3 py-2 text-gray-600">{exp.designation || '-'}</td>
                          <td className="px-3 py-2 text-center text-gray-600">{exp.from || '-'}</td>
                          <td className="px-3 py-2 text-center text-gray-600">{exp.to || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Internship Details */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3">Internship Details</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <Row label="Purpose" value={app.purposeOfInternship} />
                <Row label="Duration" value={app.duration ? `${app.duration} weeks` : '-'} />
                <Row label="Dated" value={app.date} />
                <Row label="Referred By" value={app.referredBy} />
                <Row label="Intern Label" value={app.internLabel} />
              </div>
            </div>

            {/* ── Documents — full visible previews ── */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3">Uploaded Documents</p>

              {/* CNIC row — side by side, prominent */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">CNIC</p>
                <div className="grid grid-cols-2 gap-3">
                  <DocCard filename={app.cnicFront} label="CNIC Front" />
                  <DocCard filename={app.cnicBack}  label="CNIC Back" />
                </div>
              </div>

              {/* Academic documents */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Academic Documents</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <DocCard filename={app.matricDmc} label="Matric DMC" />
                  <DocCard filename={app.fscDmc}    label="FSc DMC" />
                  <DocCard filename={app.uniDegree} label="Uni Degree / Transcript" />
                  <DocCard filename={app.recommendationLetter} label="Recommendation Letter" />
                </div>
              </div>

              {/* CV */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">CV / Resume</p>
                <div className="max-w-[200px]">
                  <DocCard filename={app.cv} label="CV / Resume" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end border-t border-gray-200 px-6 py-4">
            <SecondaryButton onClick={() => onOpenPdfDocuments?.(app)}>Open PDF Docs</SecondaryButton>
            <SecondaryButton onClick={() => onPrintDocuments?.(app)}>Print Documents</SecondaryButton>
            <SecondaryButton onClick={onClose}>Close</SecondaryButton>
          </div>
        </div>
      </div>
    </>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useAuth();
  const [activeSection, setActiveSection] = useState('overview');
  const [cvs, setCvs] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [allCodes, setAllCodes] = useState([]);
  const [dashboardUsers, setDashboardUsers] = useState([]);
  const [loadingCvs, setLoadingCvs] = useState(true);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(true);
  const [loadingCodes, setLoadingCodes] = useState(true);
  const [loadingDashboardUsers, setLoadingDashboardUsers] = useState(true);
  const [newUserForm, setNewUserForm] = useState({ name: '', email: '', password: '' });
  const [creatingUser, setCreatingUser] = useState(false);
  const [accessLabel, setAccessLabel] = useState('');
  const [liveAccessCode, setLiveAccessCode] = useState('');
  const [generatingCode, setGeneratingCode] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [cvSearch, setCvSearch] = useState('');
  const [feedbackSearch, setFeedbackSearch] = useState('');
  const [codeSearch, setCodeSearch] = useState('');
  // Intern applications
  const [applications, setApplications] = useState([]);
  const [loadingApplications, setLoadingApplications] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [selectedApplicationIds, setSelectedApplicationIds] = useState([]);
  const [appSearch, setAppSearch] = useState('');

  const isSuperAdmin = user?.role === 'superadmin';

  const fetchCvs = useCallback(async () => {
    try {
      setLoadingCvs(true);
      const response = await cvAPI.getAll();
      setCvs(response.data.cvs || []);
    } catch (error) {
      toast.error('Failed to load uploaded CVs');
    } finally {
      setLoadingCvs(false);
    }
  }, []);

  const fetchFeedbacks = useCallback(async () => {
    try {
      setLoadingFeedbacks(true);
      const response = await feedbackAPI.getAll();
      setFeedbacks(response.data.feedbacks || []);
    } catch (error) {
      toast.error('Failed to load feedback');
    } finally {
      setLoadingFeedbacks(false);
    }
  }, []);

  const fetchCodes = useCallback(async () => {
    try {
      setLoadingCodes(true);
      const response = await accessCodeAPI.getAllCodes();
      setAllCodes(response.data.codes || []);
    } catch (error) {
      setAllCodes([]);
    } finally {
      setLoadingCodes(false);
    }
  }, []);

  const fetchDashboardUsers = useCallback(async () => {
    if (!isSuperAdmin) {
      setDashboardUsers([]);
      setLoadingDashboardUsers(false);
      return;
    }

    try {
      setLoadingDashboardUsers(true);
      const response = await usersAPI.getDashboardUsers();
      const stored = JSON.parse(localStorage.getItem('dashboardUserPasswords') || '{}');
      const usersWithPasswords = (response.data.users || []).map((dashboardUser) => ({
        ...dashboardUser,
        plainPassword: dashboardUser.plainPassword || stored[dashboardUser._id] || null
      }));
      setDashboardUsers(usersWithPasswords);
    } catch (error) {
      setDashboardUsers([]);
    } finally {
      setLoadingDashboardUsers(false);
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = isSuperAdmin ? 'Super Admin Dashboard' : 'Admin Dashboard';
    return () => {
      document.title = previousTitle;
    };
  }, [isSuperAdmin]);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      navigate('/', { replace: true });
      return;
    }

    fetchCvs();
    fetchFeedbacks();
    fetchCodes();
    fetchDashboardUsers();
    // Fetch intern applications
    const fetchApplications = async () => {
      try {
        const res = await api.get('/intern-applications');
        setApplications(res.data.applications || []);
      } catch { setApplications([]); }
      finally { setLoadingApplications(false); }
    };
    fetchApplications();
  }, [
    fetchCodes,
    fetchCvs,
    fetchDashboardUsers,
    fetchFeedbacks,
    isAuthenticated,
    loading,
    navigate
  ]);

  const dashboardAdmins = useMemo(
    () => dashboardUsers.filter((dashboardUser) => dashboardUser.role === 'admin'),
    [dashboardUsers]
  );

  const activeCodes = useMemo(() => allCodes.filter((code) => code.isActive).length, [allCodes]);

  const filteredCodes = useMemo(() => {
    const query = codeSearch.toLowerCase().trim();
    if (!query) return allCodes;
    return allCodes.filter((code) => {
      return [
        code.code,
        code.internLabel,
        code.intern?.name,
        code.intern?.email
      ].some((value) => String(value || '').toLowerCase().includes(query));
    });
  }, [allCodes, codeSearch]);

  const filteredCvs = useMemo(() => {
    const query = cvSearch.toLowerCase().trim();
    if (!query) return cvs;
    return cvs.filter((cv) => {
      return [
        cv.filename,
        cv.internLabel,
        getCvEmail(cv)
      ].some((value) => String(value || '').toLowerCase().includes(query));
    });
  }, [cvs, cvSearch]);

  const filteredFeedbacks = useMemo(() => {
    const query = feedbackSearch.toLowerCase().trim();
    if (!query) return feedbacks;
    return feedbacks.filter((feedback) => {
      return [
        feedback.user,
        feedback.message
      ].some((value) => String(value || '').toLowerCase().includes(query));
    });
  }, [feedbacks, feedbackSearch]);

  const filteredApplications = useMemo(() => {
    const query = appSearch.toLowerCase().trim();
    if (!query) return applications;
    return applications.filter((app) =>
      [app.name, app.cnicNo, app.email, app.mobileNo, app.internLabel]
        .some((v) => String(v || '').toLowerCase().includes(query))
    );
  }, [applications, appSearch]);

  const selectedApplications = useMemo(() => (
    applications.filter((app) => selectedApplicationIds.includes(app._id))
  ), [applications, selectedApplicationIds]);

  const allFilteredSelected = useMemo(() => (
    filteredApplications.length > 0
    && filteredApplications.every((app) => selectedApplicationIds.includes(app._id))
  ), [filteredApplications, selectedApplicationIds]);

  const handleDeleteApplication = (appId) => {
    requestConfirm({
      title: 'Delete application',
      message: 'This internship application and all its uploaded files will be removed permanently.',
      actionLabel: 'Delete application',
      tone: 'red',
      onConfirm: async () => {
        await api.delete(`/intern-applications/${appId}`);
        toast.success('Application deleted');
        setApplications((prev) => prev.filter((a) => a._id !== appId));
      }
    });
  };

  const toggleApplicationSelection = (appId) => {
    setSelectedApplicationIds((current) => (
      current.includes(appId)
        ? current.filter((id) => id !== appId)
        : [...current, appId]
    ));
  };

  const toggleSelectAllFilteredApplications = () => {
    if (allFilteredSelected) {
      setSelectedApplicationIds((current) => (
        current.filter((id) => !filteredApplications.some((app) => app._id === id))
      ));
      return;
    }
    const filteredIds = filteredApplications.map((app) => app._id);
    setSelectedApplicationIds((current) => Array.from(new Set([...current, ...filteredIds])));
  };

  const exportApplicationsToExcel = useCallback(() => {
    const noData = !applications.length && !allCodes.length && !cvs.length && !feedbacks.length && !dashboardUsers.length;
    if (noData) {
      toast.error('No dashboard data available to export.');
      return;
    }

    const workbook = XLSX.utils.book_new();
    const formatSheet = (sheet, rows) => {
      if (!sheet) return;
      const keys = rows && rows.length ? Object.keys(rows[0]) : [];
      sheet['!cols'] = keys.map((key) => {
        const headerLen = String(key).length;
        const maxCellLen = rows.reduce((max, row) => {
          const len = String(row?.[key] ?? '').length;
          return Math.max(max, len);
        }, 0);
        return { wch: Math.min(45, Math.max(12, headerLen + 2, maxCellLen + 2)) };
      });
      if (sheet['!ref']) {
        const range = XLSX.utils.decode_range(sheet['!ref']);
        sheet['!autofilter'] = { ref: sheet['!ref'] };
        sheet['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2', activePane: 'bottomLeft', state: 'frozen' };
        range.s.r = 0;
      }
    };

    const applicationsRows = applications.map((app) => {
      const qualifications = app.qualifications || [];
      const row = {
        submittedAt: formatDate(app.submittedAt, ''),
        internLabel: app.internLabel || '',
        cnicNo: app.cnicNo || '',
        name: app.name || '',
        fatherName: app.fatherName || '',
        fatherOccupation: app.fatherOccupation || '',
        presentAddress: app.presentAddress || '',
        presentPhone: app.presentPhone || '',
        permanentAddress: app.permanentAddress || '',
        permanentPhone: app.permanentPhone || '',
        email: app.email || '',
        mobileNo: app.mobileNo || '',
        dateOfBirth: app.dateOfBirth || '',
        ageYears: app.ageYears || '',
        ageMonths: app.ageMonths || '',
        maritalStatus: app.maritalStatus || '',
        domicileCity: app.domicileCity || '',
        domicileProvince: app.domicileProvince || '',
        religion: app.religion || '',
        sect: app.sect || '',
        nationality: app.nationality || '',
        foreignNationality: app.foreignNationality || '',
        dualNationalityHolder: app.dualNationalityHolder || '',
        spouseOnForeignMission: app.spouseOnForeignMission || '',
        marriedToForeignNational: app.marriedToForeignNational || ''
      };
      for (let i = 0; i < 5; i += 1) {
        const q = qualifications[i] || {};
        row[`q${i + 1}_level`] = q.level || '';
        row[`q${i + 1}_passingYear`] = q.passingYear || '';
        row[`q${i + 1}_marksDiv`] = q.marksDiv || '';
        row[`q${i + 1}_percentage`] = q.percentage || '';
        row[`q${i + 1}_cgpa`] = q.cgpa || '';
        row[`q${i + 1}_institute`] = q.institute || '';
        row[`q${i + 1}_subjects`] = q.subjects || '';
      }
      const exp1 = app.experience?.[0] || {};
      const exp2 = app.experience?.[1] || {};
      row.exp1Organization = exp1.organization || '';
      row.exp1Designation = exp1.designation || '';
      row.exp1From = exp1.from || '';
      row.exp1To = exp1.to || '';
      row.exp2Organization = exp2.organization || '';
      row.exp2Designation = exp2.designation || '';
      row.exp2From = exp2.from || '';
      row.exp2To = exp2.to || '';
      row.purposeOfInternship = app.purposeOfInternship || '';
      row.durationWeeks = app.duration || '';
      row.dated = app.date || '';
      row.referredBy = app.referredBy || '';
      row.photoFile = app.photo || '';
      row.cnicFrontFile = app.cnicFront || '';
      row.cnicBackFile = app.cnicBack || '';
      row.matricDmcFile = app.matricDmc || '';
      row.fscDmcFile = app.fscDmc || '';
      row.uniDegreeFile = app.uniDegree || '';
      row.recommendationLetterFile = app.recommendationLetter || '';
      row.cvFile = app.cv || '';
      return row;
    });
    const applicationsSheet = XLSX.utils.json_to_sheet(applicationsRows);
    formatSheet(applicationsSheet, applicationsRows);
    XLSX.utils.book_append_sheet(workbook, applicationsSheet, 'Applications');

    const accessCodesRows = allCodes.map((code) => ({
      code: code.code || '',
      internLabel: code.internLabel || '',
      internName: code.intern?.name || '',
      internEmail: code.intern?.email || '',
      isActive: code.isActive ? 'Yes' : 'No',
      uses: code.uses ?? 0,
      maxUses: code.maxUses ?? '',
      expiresAt: formatDate(code.expiresAt, ''),
      createdAt: formatDate(code.createdAt, ''),
      lastUsedAt: formatDate(code.lastUsedAt, ''),
      deviceLocked: code.deviceFingerprint ? 'Yes' : 'No',
      revokedAt: formatDate(code.revokedAt, ''),
      cvCount: code.cvCount ?? 0
    }));
    const accessCodesSheet = XLSX.utils.json_to_sheet(accessCodesRows);
    formatSheet(accessCodesSheet, accessCodesRows);
    XLSX.utils.book_append_sheet(workbook, accessCodesSheet, 'Access Codes');

    const cvRows = cvs.map((cv) => ({
      filename: cv.filename || '',
      url: cv.url || '',
      internLabel: cv.internLabel || '',
      email: getCvEmail(cv),
      uploadedAt: formatDate(cv.uploadedAt, '')
    }));
    const cvSheet = XLSX.utils.json_to_sheet(cvRows);
    formatSheet(cvSheet, cvRows);
    XLSX.utils.book_append_sheet(workbook, cvSheet, 'CV Library');

    const feedbackRows = feedbacks.map((feedback) => ({
      user: feedback.user || '',
      message: feedback.message || '',
      createdAt: formatDate(feedback.createdAt, '')
    }));
    const feedbackSheet = XLSX.utils.json_to_sheet(feedbackRows);
    formatSheet(feedbackSheet, feedbackRows);
    XLSX.utils.book_append_sheet(workbook, feedbackSheet, 'Feedback');

    const usersRows = dashboardUsers.map((u) => ({
      name: u.name || '',
      email: u.email || '',
      role: u.role || '',
      createdAt: formatDate(u.createdAt, ''),
      plainPassword: u.plainPassword || ''
    }));
    const usersSheet = XLSX.utils.json_to_sheet(usersRows);
    formatSheet(usersSheet, usersRows);
    XLSX.utils.book_append_sheet(workbook, usersSheet, 'Dashboard Users');

    const stamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `dashboard-export-${stamp}.xlsx`);
    toast.success('Dashboard Excel exported successfully.');
  }, [applications, allCodes, cvs, feedbacks, dashboardUsers]);

  const printSelectedApplications = useCallback(async () => {
    if (!selectedApplications.length) {
      toast.error('Select at least one application to print.');
      return;
    }

    const apiBase = process.env.NODE_ENV === 'development'
      ? '/api'
      : (process.env.REACT_APP_API_URL || '/api');
    const token = (sessionStorage.getItem('token') || localStorage.getItem('token'));

    const toDataUrl = async (filename) => {
      if (!filename) return null;
      try {
        const res = await fetch(`${apiBase}/intern-applications/file/${encodeURIComponent(filename)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (!res.ok) return null;
        const blob = await res.blob();
        return await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      } catch {
        return null;
      }
    };

    const appsWithPhoto = await Promise.all(selectedApplications.map(async (app) => ({
      ...app,
      __photoDataUrl: await toDataUrl(app.photo)
    })));

    const line = (label, value) => `<p><strong>${label}</strong> ${value || '____________________'}</p>`;
    const cgpaColor = (value) => {
      const parsed = Number.parseFloat(String(value ?? '').replace(',', '.'));
      if (Number.isNaN(parsed)) return '#4b5563';
      return parsed < 3 ? '#dc2626' : '#15803d';
    };
    const qRow = (sr, level, q = {}) => `
      <tr>
        <td>${sr}</td><td>${level}</td><td>${q.passingYear || ''}</td><td>${q.marksDiv || ''}</td>
        <td>${q.percentage || ''}</td><td style="color:${cgpaColor(q.cgpa)};font-weight:700;">${q.cgpa || ''}</td><td>${q.institute || ''}</td><td>${q.subjects || ''}</td>
      </tr>
    `;
    const eRow = (sr, e = {}) => `
      <tr><td>${sr}</td><td>${e.organization || ''}</td><td>${e.designation || ''}</td><td>${e.from || ''}</td><td>${e.to || ''}</td></tr>
    `;
    const rowsHtml = appsWithPhoto.map((app, index) => `
      <section class="app-page">
        <h1>NATIONAL ELECTRONICS COMPLEX OF PAKISTAN</h1>
        <h2>(HRM Directorate)</h2>
        <h3>APPLICATION FORM FOR INTERNSHIP</h3>

        <div class="top-grid">
          <div>
            ${line('CNIC No:', app.cnicNo)}
            ${line('1. Name:', app.name)}
            ${line("2. Father's Name:", app.fatherName)}
            ${line("3. Father's Occupation:", app.fatherOccupation)}
            ${line('4. Address - Present (a):', app.presentAddress)}
            ${line('Phone:', app.mobileNo)}
            ${line('b) Permanent:', app.permanentAddress)}
            ${line('c) E-Mail Address:', app.email)}
            ${line('5. Date of Birth (DD-MM-YYYY):', app.dateOfBirth)}
            ${line('Age:', app.ageYears ? `${app.ageYears} yr(s), ${app.ageMonths || 0} month(s)` : '-')}
            ${line('6. Marital Status:', app.maritalStatus)}
            ${line('7. Domicile (City / Province):', `${app.domicileCity || '-'} / ${app.domicileProvince || '-'}`)}
            ${line('8. Religion:', app.religion)}
            ${line('9. Sect:', app.sect)}
            ${line('10. Nationality:', app.nationality)}
            ${line('11. Foreign Nationality (if any):', app.foreignNationality)}
            ${line('12(a). Pakistani born dual nationality holder?', app.dualNationalityHolder)}
            ${line('12(b). Spouse currently serving in a foreign mission?', app.spouseOnForeignMission)}
            ${line('12(c). Married to a foreign national / dual nationality holder?', app.marriedToForeignNational)}
          </div>
          <div class="photo-box">
            ${app.__photoDataUrl ? `<img src="${app.__photoDataUrl}" alt="Profile" />` : '<span>PHOTO</span>'}
          </div>
        </div>

        <p class="section-title">13. Qualification: (please mention) % age in case of annual system and CGPA in case of semester system</p>
        <table class="tbl">
          <thead>
            <tr>
              <th>SR#</th><th>LEVEL</th><th>PASSING YEAR</th><th>MARKS & DIV</th><th>% AGE</th><th>CGPA</th><th>INSTITUTE</th><th>SUBJECTS/QUALIFICATION</th>
            </tr>
          </thead>
          <tbody>
            ${qRow('i.', 'Matric/ O-Level', app.qualifications?.[0] || { passingYear: app.matricYear, marksDiv: app.matricMarks, institute: app.matricBoard })}
            ${qRow('ii.', 'Intermediate/ A-Level F.A/F.sc/I.Com', app.qualifications?.[1] || { passingYear: app.interYear, marksDiv: app.interMarks, institute: app.interBoard })}
            ${qRow('iii.', 'B.A/B.Sc./B.Com/BBA/BCS/BIT', app.qualifications?.[2])}
            ${qRow('iv.', 'B.Sc. (Engg)/B.E/BS (04 Years) M.A/M.Sc./MS or equivalent (16 years education)', app.qualifications?.[3] || { passingYear: app.bachelorYear || app.masterYear, marksDiv: app.bachelorMarks || app.masterMarks, institute: app.bachelorUniversity || app.masterUniversity, subjects: app.bachelorDegree || app.masterDegree })}
            ${qRow('v.', 'Any other Qualification', app.qualifications?.[4])}
          </tbody>
        </table>

        <p class="section-title">14. Previous Experience: - (If any)</p>
        <table class="tbl exp">
          <thead><tr><th>SR#</th><th>Organization/Company</th><th>Designation</th><th>From</th><th>To</th></tr></thead>
          <tbody>
            ${eRow('i.', app.experience?.[0] || {})}
            ${eRow('ii.', app.experience?.[1] || {})}
          </tbody>
        </table>

        <div class="purpose-row">
          ${line('15. Purpose of Internship:', app.purposeOfInternship)}
          ${line('16. Duration:', `${app.duration || app.internshipDurationWeeks || ''} (In weeks)`)}
        </div>

        <div class="sign-row">
          <p><strong>Dated:</strong> ${shortDate(app.submittedAt)}</p>
          <p><strong>Signature of Candidate:</strong> ____________________</p>
        </div>
      </section>
    `).join('');

    const win = window.open('', '_blank', 'width=1100,height=800');
    if (!win) {
      toast.error('Popup blocked. Please allow popups to print selected applications.');
      return;
    }

    win.document.write(`
      <html>
        <head>
          <title>Selected Applications (${selectedApplications.length})</title>
          <style>
            body { font-family: Arial, sans-serif; color: #111827; margin: 0; }
            .app-page { padding: 10mm 10mm; page-break-after: always; }
            .app-page:last-child { page-break-after: auto; }
            h1 { margin: 0; font-size: 30px; text-align: center; text-decoration: underline; }
            h2 { margin: 2px 0 0; text-align: center; font-size: 22px; }
            h3 { margin: 8px 0 12px; text-align: center; font-size: 18px; text-decoration: underline; }
            h4 { margin: 0 0 8px; font-size: 13px; text-transform: uppercase; }
            .top-grid { display: grid; grid-template-columns: 1fr 170px; gap: 14px; align-items: start; }
            .photo-box { border: 1px solid #111; height: 200px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
            .photo-box img { width: 100%; height: 100%; object-fit: cover; }
            .photo-box span { font-size: 12px; letter-spacing: 1px; color: #555; }
            .block { border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; margin-bottom: 12px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 14px; }
            p { margin: 0 0 6px; font-size: 12px; line-height: 1.4; word-break: break-word; }
            .section-title { font-weight: 700; margin: 8px 0 6px; }
            .tbl { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 11px; }
            .tbl th, .tbl td { border: 1px solid #111; padding: 4px; vertical-align: top; }
            .tbl th { text-align: center; font-weight: 700; }
            .exp th, .exp td { font-size: 11px; }
            .purpose-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 8px 0; }
            .sign-row { margin-top: 10px; display: flex; justify-content: space-between; gap: 10px; }
            @page { size: A4 portrait; margin: 8mm; }
          </style>
        </head>
        <body>
          ${rowsHtml}
        </body>
      </html>
    `);
    win.document.close();

    const printWhenReady = () => {
      const images = Array.from(win.document.images || []);
      if (!images.length) {
        win.focus();
        win.print();
        return;
      }

      let loaded = 0;
      const total = images.length;
      const done = () => {
        loaded += 1;
        if (loaded >= total) {
          win.focus();
          win.print();
        }
      };

      images.forEach((img) => {
        if (img.complete) {
          done();
          return;
        }
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
      });
    };

    if (win.document.readyState === 'complete') {
      printWhenReady();
    } else {
      win.addEventListener('load', printWhenReady, { once: true });
    }
  }, [selectedApplications]);

  const printApplicationDocuments = useCallback(async (app) => {
    if (!app) return;
    const apiBase = process.env.NODE_ENV === 'development'
      ? '/api'
      : (process.env.REACT_APP_API_URL || '/api');
    const token = (sessionStorage.getItem('token') || localStorage.getItem('token'));
    const toDataUrl = async (filename) => {
      if (!filename) return null;
      try {
        const res = await fetch(`${apiBase}/intern-applications/file/${encodeURIComponent(filename)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (!res.ok) return null;
        const blob = await res.blob();
        return await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      } catch {
        return null;
      }
    };

    const docs = [
      { label: 'Photo', file: app.photo },
      { label: 'CNIC Front', file: app.cnicFront },
      { label: 'CNIC Back', file: app.cnicBack },
      { label: 'Matric DMC', file: app.matricDmc },
      { label: 'FSc DMC', file: app.fscDmc },
      { label: 'Uni Degree / Transcript', file: app.uniDegree },
      { label: 'Recommendation Letter', file: app.recommendationLetter },
      { label: 'CV / Resume', file: app.cv }
    ];

    const docsWithSrc = await Promise.all(docs.map(async (d) => ({
      ...d,
      src: await toDataUrl(d.file),
      isPdf: String(d.file || '').toLowerCase().endsWith('.pdf')
    })));

    const html = `
      <html>
        <head>
          <title>Documents - ${app.name || 'Application'}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 12mm; color: #111827; }
            h1 { margin: 0 0 10px; font-size: 20px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
            .card { border: 1px solid #d1d5db; border-radius: 8px; padding: 8px; page-break-inside: avoid; }
            .label { font-size: 12px; font-weight: 700; margin-bottom: 6px; }
            img { width: 100%; max-height: 260px; object-fit: contain; border: 1px solid #e5e7eb; border-radius: 4px; }
            .note { font-size: 12px; color: #6b7280; }
            @page { size: A4 portrait; margin: 8mm; }
          </style>
        </head>
        <body>
          <h1>Submitted Documents - ${app.name || ''}</h1>
          <div class="grid">
            ${docsWithSrc.map((d) => `
              <div class="card">
                <div class="label">${d.label}</div>
                ${d.src && !d.isPdf ? `<img src="${d.src}" alt="${d.label}" />` : `<div class="note">${d.file ? 'PDF document (print separately from opened PDF if needed)' : 'Not uploaded'}</div>`}
              </div>
            `).join('')}
          </div>
        </body>
      </html>
    `;

    const win = window.open('', '_blank', 'width=1100,height=800');
    if (!win) {
      toast.error('Popup blocked. Please allow popups to print documents.');
      return;
    }
    win.document.write(html);
    win.document.close();
    win.onload = () => { win.focus(); win.print(); };
  }, []);

  const openPdfDocumentsForPrint = useCallback(async (app) => {
    if (!app) return;
    const apiBase = process.env.NODE_ENV === 'development'
      ? '/api'
      : (process.env.REACT_APP_API_URL || '/api');
    const token = (sessionStorage.getItem('token') || localStorage.getItem('token'));
    const pdfFiles = [
      app.cv,
      app.uniDegree,
      app.recommendationLetter
    ].filter((filename) => String(filename || '').toLowerCase().endsWith('.pdf'));

    if (!pdfFiles.length) {
      toast.error('No PDF documents found for this application.');
      return;
    }

    let opened = 0;
    for (const filename of pdfFiles) {
      try {
        const res = await fetch(`${apiBase}/intern-applications/file/${encodeURIComponent(filename)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (!res.ok) continue;
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const win = window.open(url, '_blank', 'noopener,noreferrer');
        if (win) opened += 1;
      } catch {
        // Skip failed file fetch and continue
      }
    }

    if (!opened) {
      toast.error('Could not open PDF documents. Please allow popups.');
      return;
    }
    toast.success(`Opened ${opened} PDF document(s). Use browser print in each tab.`);
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'p') return;
      if (activeSection !== 'applications') return;
      event.preventDefault();
      printSelectedApplications();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeSection, printSelectedApplications]);


  const requestConfirm = (config) => setConfirmAction(config);

  const copyText = async (text, label = 'Copied') => {
    if (!text) {
      toast.error('Nothing to copy');
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      toast.success(label);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const generateAccessCode = async () => {
    try {
      setGeneratingCode(true);
      const response = await accessCodeAPI.generateCode(accessLabel.trim());
      setLiveAccessCode(response.data.code);
      toast.success('Access code generated');
      setAccessLabel('');
      fetchCodes();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to generate access code');
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleViewCV = async (filename) => {
    try {
      const token = (sessionStorage.getItem('token') || localStorage.getItem('token'));
      if (!token) {
        toast.error('Please log in first');
        return;
      }

      const apiBase = process.env.NODE_ENV === 'development'
        ? '/api'
        : (process.env.REACT_APP_API_URL || '/api');

      const response = await fetch(`${apiBase}/cv/download/${encodeURIComponent(filename)}`, {
        method: 'GET',
        credentials: 'include',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to download CV');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to open CV. Please try again.');
    }
  };

  const handleDeleteCV = (filename) => {
    requestConfirm({
      title: 'Delete CV',
      message: 'This CV file and its database record will be removed permanently.',
      actionLabel: 'Delete CV',
      tone: 'red',
      onConfirm: async () => {
        await cvAPI.delete(filename);
        toast.success('CV deleted successfully');
        fetchCvs();
      }
    });
  };

  const handleDeleteFeedback = (feedbackId) => {
    requestConfirm({
      title: 'Delete feedback',
      message: 'This feedback item will be removed from the dashboard.',
      actionLabel: 'Delete feedback',
      tone: 'red',
      onConfirm: async () => {
        await feedbackAPI.delete(feedbackId);
        toast.success('Feedback deleted successfully');
        fetchFeedbacks();
      }
    });
  };

  const handleCreateDashboardUser = async (event) => {
    event.preventDefault();
    setCreatingUser(true);
    try {
      const plainPassword = newUserForm.password;
      const response = await usersAPI.createDashboardUser(newUserForm);
      const createdUser = {
        ...response.data.user,
        plainPassword: response.data.user?.plainPassword || plainPassword
      };
      const stored = JSON.parse(localStorage.getItem('dashboardUserPasswords') || '{}');
      stored[createdUser._id] = createdUser.plainPassword;
      localStorage.setItem('dashboardUserPasswords', JSON.stringify(stored));
      setDashboardUsers((current) => [createdUser, ...current]);
      setNewUserForm({ name: '', email: '', password: '' });
      toast.success(response.data.message || 'Dashboard user created');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create user');
    } finally {
      setCreatingUser(false);
    }
  };

  const handleSaveDashboardPassword = async (userId, password) => {
    const response = await usersAPI.updateDashboardUserPassword(userId, password);
    const savedPassword = response.data.user?.plainPassword || password;
    const stored = JSON.parse(localStorage.getItem('dashboardUserPasswords') || '{}');
    stored[userId] = savedPassword;
    localStorage.setItem('dashboardUserPasswords', JSON.stringify(stored));
    setDashboardUsers((current) => current.map((dashboardUser) => (
      dashboardUser._id === userId
        ? { ...dashboardUser, plainPassword: savedPassword }
        : dashboardUser
    )));
    toast.success('Password saved');
  };

  const handleDeleteDashboardUser = (dashboardUser) => {
    requestConfirm({
      title: 'Remove dashboard user',
      message: `${dashboardUser.name} will lose dashboard access immediately.`,
      actionLabel: 'Remove user',
      tone: 'red',
      onConfirm: async () => {
        await usersAPI.deleteDashboardUser(dashboardUser._id);
        const stored = JSON.parse(localStorage.getItem('dashboardUserPasswords') || '{}');
        delete stored[dashboardUser._id];
        localStorage.setItem('dashboardUserPasswords', JSON.stringify(stored));
        setDashboardUsers((current) => current.filter((item) => item._id !== dashboardUser._id));
        toast.success(`${dashboardUser.name} removed`);
      }
    });
  };

  const handleRevokeCode = (codeId) => {
    requestConfirm({
      title: 'Revoke access code',
      message: 'The portal user will lose access on the next session check.',
      actionLabel: 'Revoke code',
      tone: 'red',
      onConfirm: async () => {
        await accessCodeAPI.revokeCode(codeId);
        toast.success('Access code revoked');
        fetchCodes();
      }
    });
  };

  const handleDeleteCode = (codeId) => {
    requestConfirm({
      title: 'Delete access-code record',
      message: 'This removes the access-code record permanently.',
      actionLabel: 'Delete record',
      tone: 'red',
      onConfirm: async () => {
        await accessCodeAPI.deleteCode(codeId);
        toast.success('Code deleted');
        fetchCodes();
      }
    });
  };

  const sections = [
    { id: 'overview', label: 'Overview', icon: FaClipboardList },
    { id: 'applications', label: 'Applications', icon: FaIdCard },
    { id: 'access', label: 'Access Codes', icon: FaKey },
    { id: 'cvs', label: 'CV Library', icon: FaFileUpload },
    { id: 'feedback', label: 'Feedback', icon: FaComments },
    ...(isSuperAdmin ? [{ id: 'team', label: 'Dashboard Users', icon: FaUserShield }] : [])
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="rounded-lg border border-gray-200 bg-white px-5 py-4 text-sm font-semibold text-gray-700 shadow-sm">
          Checking authentication...
        </div>
      </div>
    );
  }

  return (
    <div id="home" className="min-h-screen bg-gray-50 text-gray-900">
      <ConfirmModal config={confirmAction} onClose={() => setConfirmAction(null)} />
      <FeedbackModal feedback={selectedFeedback} onClose={() => setSelectedFeedback(null)} />
      <ApplicationDetailModal
        application={selectedApplication}
        onClose={() => setSelectedApplication(null)}
        onPrintDocuments={printApplicationDocuments}
        onOpenPdfDocuments={openPdfDocumentsForPrint}
      />

      <div className="mx-auto flex max-w-[1500px] flex-col lg:flex-row">
        <aside className="border-b border-gray-200 bg-white px-4 py-4 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:w-72 lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-blue-600 text-white">
              <FaUserShield />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500">Intern Portal</p>
              <p className="text-lg font-bold text-gray-950">{isSuperAdmin ? 'Super Admin' : 'Dashboard'}</p>
            </div>
          </div>

          <nav className="mt-6 grid gap-1">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={cx(
                    'flex items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-semibold transition',
                    activeSection === section.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-950'
                  )}
                >
                  <Icon className="text-base" />
                  {section.label}
                </button>
              );
            })}
          </nav>

          <div id="about" className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="flex items-center gap-2 text-sm font-bold text-gray-900">
              <FaInfoCircle className="text-blue-700" /> Admin workspace
            </p>
            <p className="mt-2 text-sm leading-5 text-gray-500">
              Manage codes, uploaded CVs, feedback, and user access from one place.
            </p>
          </div>

          <div id="contact" className="mt-4 rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600">
            <p className="font-bold text-gray-900">Support</p>
            <p className="mt-2 break-all">tameer.corvit999@gmail.com</p>
            <p className="mt-1">03174149991</p>
          </div>
        </aside>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <header className="mb-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
                  {isSuperAdmin ? 'Super admin console' : 'Admin console'}
                </p>
                <h1 className="mt-2 text-3xl font-bold text-gray-950">
                  Welcome back, {user?.name || user?.email || 'Admin'}
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-500">
                  A cleaner command center for reviewing activity, managing access, and keeping the intern portal tidy.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <PrimaryButton onClick={() => setActiveSection('access')}>
                  <FaKey /> Generate code
                </PrimaryButton>
                <SecondaryButton onClick={() => setActiveSection('cvs')}>
                  <FaFileUpload /> Review CVs
                </SecondaryButton>
              </div>
            </div>
          </header>

          {activeSection === 'overview' && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Uploaded CVs" value={cvs.length} helper="Total CV records stored" icon={FaFileUpload} tone="blue" />
                <StatCard label="Active Codes" value={activeCodes} helper={`${allCodes.length} total code records`} icon={FaKey} tone="green" />
                <StatCard label="Applications" value={applications.length} helper="Internship form submissions" icon={FaIdCard} tone="amber" />
                <StatCard label="Feedback" value={feedbacks.length} helper="Messages from portal users" icon={FaComments} tone="gray" />
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <SectionPanel
                  title="Recent Feedback"
                  description="Latest messages submitted from the portal."
                  icon={FaComments}
                  action={<SecondaryButton onClick={() => setActiveSection('feedback')}>View all</SecondaryButton>}
                >
                  {loadingFeedbacks ? (
                    <p className="text-sm text-gray-500">Loading feedback...</p>
                  ) : feedbacks.length === 0 ? (
                    <EmptyState title="No feedback yet" message="Feedback submitted from the portal will appear here." />
                  ) : (
                    <div className="space-y-3">
                      {feedbacks.slice(0, 4).map((feedback) => (
                        <button
                          key={feedback.id || feedback._id}
                          type="button"
                          onClick={() => setSelectedFeedback(feedback)}
                          className="block w-full rounded-md border border-gray-200 bg-white p-4 text-left transition hover:border-blue-200 hover:bg-blue-50/40"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-semibold text-gray-900">{feedback.user || 'User'}</p>
                            <span className="text-xs text-gray-500">{shortDate(feedback.createdAt)}</span>
                          </div>
                          <p className="mt-2 line-clamp-2 text-sm text-gray-600">{feedback.message}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </SectionPanel>

                <SectionPanel title="Quick Code" description="Create a new portal access code." icon={FaKey}>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-gray-700">User label</label>
                      <input
                        type="text"
                        value={accessLabel}
                        onChange={(event) => setAccessLabel(event.target.value)}
                        placeholder="e.g. Ahmed - Batch 3"
                        className="w-full rounded-md border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                    <PrimaryButton onClick={generateAccessCode} disabled={generatingCode} className="w-full">
                      <FaKey /> {generatingCode ? 'Generating...' : 'Generate access code'}
                    </PrimaryButton>
                    <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Latest code</p>
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <p className="font-mono text-lg font-bold tracking-widest text-gray-950">{liveAccessCode || '---- ---- ----'}</p>
                        <IconButton onClick={() => copyText(liveAccessCode, 'Code copied')} aria-label="Copy latest access code">
                          <FaCopy />
                        </IconButton>
                      </div>
                    </div>
                  </div>
                </SectionPanel>
              </div>
            </div>
          )}

          {activeSection === 'access' && (
            <SectionPanel
              id="access"
              title="Access Codes"
              description="Generate, copy, revoke, and audit portal access codes."
              icon={FaKey}
              action={<SearchBox value={codeSearch} onChange={setCodeSearch} placeholder="Search code or label" />}
            >
              <div className="mb-5 grid gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 lg:grid-cols-[1fr_auto]">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">User label</label>
                  <input
                    type="text"
                    value={accessLabel}
                    onChange={(event) => setAccessLabel(event.target.value)}
                    placeholder="e.g. Ayesha - Frontend"
                    className="w-full rounded-md border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div className="flex items-end">
                  <PrimaryButton onClick={generateAccessCode} disabled={generatingCode} className="w-full lg:w-auto">
                    <FaKey /> {generatingCode ? 'Generating...' : 'Generate code'}
                  </PrimaryButton>
                </div>
                {liveAccessCode && (
                  <div className="lg:col-span-2 rounded-md border border-blue-100 bg-white p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Generated code</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <p className="font-mono text-xl font-bold tracking-widest text-gray-950">{liveAccessCode}</p>
                      <SecondaryButton onClick={() => copyText(liveAccessCode, 'Code copied')}>
                        <FaCopy /> Copy
                      </SecondaryButton>
                    </div>
                  </div>
                )}
              </div>

              {loadingCodes ? (
                <p className="text-sm text-gray-500">Loading access codes...</p>
              ) : filteredCodes.length === 0 ? (
                <EmptyState title="No access codes found" message="Generate a code or adjust your search." />
              ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                      <tr>
                         <th className="px-4 py-3">CGPA</th>
                         <th className="px-4 py-3">Label</th>
                        <th className="px-4 py-3">Code</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Uses</th>
                        <th className="px-4 py-3">CVs</th>
                        <th className="px-4 py-3">Last Used</th>
                        <th className="px-4 py-3">Created</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {filteredCodes.map((code) => (
                        <tr key={code._id} className={!code.isActive ? 'bg-gray-50 text-gray-500' : ''}>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-gray-900">{code.internLabel || code.intern?.name || 'Unlabeled code'}</p>
                            {code.deviceLocked && <p className="mt-1 text-xs text-gray-500">Device locked</p>}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold tracking-widest text-blue-700">{code.code}</span>
                              <IconButton onClick={() => copyText(code.code, 'Code copied')} aria-label="Copy code">
                                <FaCopy />
                              </IconButton>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {code.isActive ? <StatusPill tone="green">Active</StatusPill> : <StatusPill tone="red">Revoked</StatusPill>}
                          </td>
                          <td className="px-4 py-3 text-gray-600">{code.uses || 0}</td>
                          <td className="px-4 py-3 text-gray-600">{code.cvCount || 0}</td>
                          <td className="px-4 py-3 text-gray-500">{formatDate(code.lastUsedAt, 'Never')}</td>
                          <td className="px-4 py-3 text-gray-500">{shortDate(code.createdAt)}</td>
                          <td className="px-4 py-3 text-right">
                            {code.isActive ? (
                              <DangerButton onClick={() => handleRevokeCode(code._id)} className="px-3 py-2">
                                Revoke
                              </DangerButton>
                            ) : (
                              <SecondaryButton onClick={() => handleDeleteCode(code._id)} className="px-3 py-2">
                                <FaTrash /> Delete
                              </SecondaryButton>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionPanel>
          )}

          {activeSection === 'cvs' && (
            <SectionPanel
              id="cvs"
              title="CV Library"
              description="Review uploaded PDF CVs and open or remove files."
              icon={FaFileUpload}
              action={<SearchBox value={cvSearch} onChange={setCvSearch} placeholder="Search CVs" />}
            >
              {loadingCvs ? (
                <p className="text-sm text-gray-500">Loading uploaded CVs...</p>
              ) : filteredCvs.length === 0 ? (
                <EmptyState title="No CVs found" message="Uploaded CVs will appear in this library." />
              ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="px-4 py-3">File</th>
                        <th className="px-4 py-3">User Label</th>
                        <th className="px-4 py-3">Parsed Email</th>
                        <th className="px-4 py-3">Uploaded</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {filteredCvs.map((cv, index) => (
                        <tr key={cv._id || `${cv.filename}-${index}`}>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-gray-900">{cv.filename || `CV ${index + 1}`}</p>
                            <p className="mt-1 text-xs text-gray-500">{cv.url || '-'}</p>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{cv.internLabel || '-'}</td>
                          <td className="px-4 py-3 text-gray-600">{getCvEmail(cv)}</td>
                          <td className="px-4 py-3 text-gray-500">{formatDate(cv.uploadedAt)}</td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-2">
                              <SecondaryButton onClick={() => handleViewCV(cv.filename)} className="px-3 py-2">
                                <FaExternalLinkAlt /> View
                              </SecondaryButton>
                              <DangerButton onClick={() => handleDeleteCV(cv.filename)} className="px-3 py-2">
                                <FaTrash /> Delete
                              </DangerButton>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionPanel>
          )}

          {activeSection === 'feedback' && (
            <SectionPanel
              id="feedback"
              title="User Feedback"
              description="Read and manage feedback submitted by portal users."
              icon={FaComments}
              action={<SearchBox value={feedbackSearch} onChange={setFeedbackSearch} placeholder="Search feedback" />}
            >
              {loadingFeedbacks ? (
                <p className="text-sm text-gray-500">Loading feedback...</p>
              ) : filteredFeedbacks.length === 0 ? (
                <EmptyState title="No feedback found" message="Feedback submitted from the portal will show here." />
              ) : (
                <div className="grid gap-3">
                  {filteredFeedbacks.map((feedback) => (
                    <div key={feedback.id || feedback._id} className="rounded-lg border border-gray-200 bg-white p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-bold text-gray-900">{feedback.user || 'User'}</p>
                            <span className="text-xs text-gray-400">{formatDate(feedback.createdAt)}</span>
                          </div>
                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-600">{feedback.message}</p>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <SecondaryButton onClick={() => setSelectedFeedback(feedback)} className="px-3 py-2">
                            <FaExternalLinkAlt /> View
                          </SecondaryButton>
                          <DangerButton onClick={() => handleDeleteFeedback(feedback.id || feedback._id)} className="px-3 py-2">
                            <FaTrash /> Delete
                          </DangerButton>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionPanel>
          )}

          {activeSection === 'applications' && (
            <SectionPanel
              id="applications"
              title="Internship Applications"
              description="Review submitted internship application forms with photos and CNIC documents."
              icon={FaIdCard}
              action={(
                <div className="flex flex-wrap items-center gap-2">
                  <SearchBox value={appSearch} onChange={setAppSearch} placeholder="Search by name, CNIC, email" />
                  <SecondaryButton onClick={toggleSelectAllFilteredApplications} className="px-3 py-2">
                    {allFilteredSelected ? 'Unselect all' : 'Select all'}
                  </SecondaryButton>
                  <PrimaryButton onClick={printSelectedApplications} className="px-3 py-2">
                    Print selected ({selectedApplicationIds.length})
                  </PrimaryButton>
                  <SecondaryButton onClick={exportApplicationsToExcel} className="px-3 py-2">
                    Export Excel (.xlsx)
                  </SecondaryButton>
                </div>
              )}
            >
              {loadingApplications ? (
                <p className="text-sm text-gray-500">Loading applications...</p>
              ) : filteredApplications.length === 0 ? (
                <EmptyState title="No applications found" message="Submitted internship forms will appear here." />
              ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={allFilteredSelected}
                            onChange={toggleSelectAllFilteredApplications}
                            aria-label="Select all applications"
                          />
                        </th>
                        <th className="px-4 py-3">#</th>
                        <th className="px-4 py-3">Photo</th>
                        <th className="px-4 py-3">Name / CNIC</th>
                        <th className="px-4 py-3">Contact</th>
                        <th className="px-4 py-3">Label</th>
                        <th className="px-4 py-3">Submitted</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {filteredApplications.map((app, idx) => (
                        <tr key={app._id}>
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedApplicationIds.includes(app._id)}
                              onChange={() => toggleApplicationSelection(app._id)}
                              aria-label={`Select ${app.name || 'application'}`}
                            />
                          </td>
                          <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                          <td className="px-4 py-3">
                            {app.photo ? (
                              <AuthImage
                                filename={app.photo}
                                alt={app.name}
                                className="h-10 w-10 rounded-full object-cover border border-gray-200"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs">N/A</div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-gray-900">{app.name}</p>
                            <p className="text-xs text-gray-500 font-mono">{app.cnicNo}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-gray-700">{app.email || '-'}</p>
                            <p className="text-xs text-gray-500">{app.mobileNo || '-'}</p>
                          </td>
                          <td className="px-4 py-3">
                            {(() => {
                              const cgpa = getApplicationCgpa(app);
                              if (cgpa === null) return <span className="text-gray-500">-</span>;
                              return (
                                <span className={cgpa < 3 ? 'font-semibold text-red-600' : 'font-semibold text-emerald-700'}>
                                  {cgpa.toFixed(2)}
                                </span>
                              );
                            })()}
                          </td>
                          <td className="px-4 py-3 text-gray-600">{app.internLabel || '-'}</td>
                          <td className="px-4 py-3 text-gray-500">{shortDate(app.submittedAt)}</td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-2">
                              <SecondaryButton onClick={() => setSelectedApplication(app)} className="px-3 py-2">
                                <FaEye /> View
                              </SecondaryButton>
                              <DangerButton onClick={() => handleDeleteApplication(app._id)} className="px-3 py-2">
                                <FaTrash /> Delete
                              </DangerButton>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionPanel>
          )}

          {activeSection === 'team' && isSuperAdmin && (
            <SectionPanel
              id="team"
              title="Dashboard Users"
              description={`Create and manage dashboard admins. ${dashboardAdmins.length} of 4 admin slots used.`}
              icon={FaUserShield}
            >
              <form onSubmit={handleCreateDashboardUser} className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="grid gap-4 lg:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">Full name</label>
                    <input
                      type="text"
                      value={newUserForm.name}
                      onChange={(event) => setNewUserForm((current) => ({ ...current, name: event.target.value }))}
                      required
                      placeholder="e.g. John Doe"
                      className="w-full rounded-md border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">Email</label>
                    <input
                      type="email"
                      value={newUserForm.email}
                      onChange={(event) => setNewUserForm((current) => ({ ...current, email: event.target.value }))}
                      required
                      placeholder="user@email.com"
                      className="w-full rounded-md border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">Password</label>
                    <PasswordInput
                      value={newUserForm.password}
                      onChange={(event) => setNewUserForm((current) => ({ ...current, password: event.target.value }))}
                      required
                      className="w-full rounded-md border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-gray-500">
                    Passwords are shown here only for dashboard users managed by the super admin.
                  </p>
                  <PrimaryButton
                    type="submit"
                    disabled={creatingUser || dashboardAdmins.length >= 4}
                    onClick={() => {}}
                  >
                    <FaUserPlus /> {creatingUser ? 'Creating...' : 'Create dashboard user'}
                  </PrimaryButton>
                </div>
                {dashboardAdmins.length >= 4 && (
                  <p className="mt-3 text-sm font-semibold text-red-600">Maximum 4 dashboard users reached.</p>
                )}
              </form>

              {loadingDashboardUsers ? (
                <p className="text-sm text-gray-500">Loading dashboard users...</p>
              ) : dashboardAdmins.length === 0 ? (
                <EmptyState title="No dashboard users yet" message="Create one above to grant dashboard access." />
              ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="px-4 py-3">#</th>
                        <th className="px-4 py-3">User</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Password</th>
                        <th className="px-4 py-3">Created</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {dashboardAdmins.map((dashboardUser, index) => (
                        <DashboardUserRow
                          key={dashboardUser._id}
                          user={dashboardUser}
                          index={index}
                          onDelete={handleDeleteDashboardUser}
                          onPasswordSave={handleSaveDashboardPassword}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionPanel>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
