import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';

/* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ constants Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */
const QUAL_LEVELS = [
  'Matric / O-Level',
  'Intermediate / A-Level / F.A / F.Sc / I.Com',
  'B.A / B.Sc / B.Com / BBA / BCS / BIT',
  'B.Sc (Engg) / B.E / BS (4 Years) / M.A / M.Sc / MS or equivalent (16 years)',
  'Any other Qualification',
];
const emptyQual = { level: '', passingYear: '', marksDiv: '', percentage: '', cgpa: '', institute: '', subjects: '' };
const emptyExp  = { organization: '', designation: '', from: '', to: '' };

const STEPS = [
  { id: 1, label: 'Personal Record' },
  { id: 2, label: 'Academic Record' },
  { id: 3, label: 'Review & Print'  },
];

/* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ shared style tokens Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */
const inputCls = 'w-full border-b border-gray-400 focus:border-blue-600 outline-none py-1 px-1 text-sm bg-transparent';
const labelCls = 'text-sm font-medium text-gray-700';

/* format yyyy-mm-dd Ã¢â€ â€™ DD-MM-YYYY for display/print */
const formatDob = (val) => {
  if (!val) return 'â€”';
  const raw = String(val).trim();
  if (/^\d{2}-\d{2}-\d{4}$/.test(raw)) return raw;
  const ymd = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymd) return `${ymd[3]}-${ymd[2]}-${ymd[1]}`;
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    const d = String(parsed.getDate()).padStart(2, '0');
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const y = parsed.getFullYear();
    return `${d}-${m}-${y}`;
  }
  return raw;
};

/* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ small helpers Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */
const FileBox = ({ label, file, setter, accept, hint, required }) => (
  <div>
    <p className="text-sm font-semibold text-gray-700 mb-2">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </p>
    <label className="block cursor-pointer">
      <div className={`border-2 border-dashed rounded-xl p-4 text-center transition
        ${file ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}>
        {file ? (
          <div className="space-y-1">
            {file.type?.startsWith('image/') ? (
              <img src={URL.createObjectURL(file)} alt={label}
                className="mx-auto max-h-28 rounded object-contain border border-gray-200" />
            ) : (
              <p className="text-3xl">PDF</p>
            )}
            <p className="text-xs font-semibold text-blue-700 truncate">{file.name}</p>
            <p className="text-xs text-gray-400">click to change</p>
          </div>
        ) : (
          <div className="text-gray-400 space-y-1">
            <p className="text-3xl">{accept?.includes('pdf') ? 'PDF' : 'IMG'}</p>
            <p className="text-xs font-medium text-gray-600">Click to upload</p>
            <p className="text-xs">{hint}</p>
          </div>
        )}
      </div>
      <input type="file" accept={accept} className="hidden"
        onChange={e => {
          const f = e.target.files[0];
          if (!f) return;
          if (f.size > 5 * 1024 * 1024) { toast.error('Max 5 MB'); e.target.value = ''; return; }
          setter(f);
        }} />
    </label>
  </div>
);

/* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Step indicator Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */
const StepBar = ({ current, onStepClick }) => (
  <div className="flex items-center justify-center gap-0 px-6 py-4 border-b border-gray-200 bg-gray-50">
    {STEPS.map((s, i) => (
      <React.Fragment key={s.id}>
        <button
          type="button"
          onClick={() => onStepClick?.(s.id)}
          className="flex flex-col items-center gap-1"
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition
            ${current > s.id ? 'bg-green-600 text-white'
              : current === s.id ? 'bg-blue-600 text-white ring-4 ring-blue-100'
              : 'bg-gray-200 text-gray-500'}`}>
            {current > s.id ? (
              <span aria-label="Completed" role="img">&#10003;</span>
            ) : s.id}
          </div>
          <span className={`text-xs font-semibold whitespace-nowrap
            ${current === s.id ? 'text-blue-700' : current > s.id ? 'text-green-700' : 'text-gray-400'}`}>
            {s.label}
          </span>
        </button>
        {i < STEPS.length - 1 && (
          <div className={`h-0.5 w-16 sm:w-24 mx-2 mb-5 transition
            ${current > s.id ? 'bg-green-400' : 'bg-gray-200'}`} />
        )}
      </React.Fragment>
    ))}
  </div>
);

/* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Print-only full summary Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */
/* MAIN COMPONENT */
const InternApplicationForm = () => {
  const navigate   = useNavigate();
    const [step, setStep]           = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  
  /* Ã¢â€â‚¬Ã¢â€â‚¬ text form state Ã¢â€â‚¬Ã¢â€â‚¬ */
  const [form, setForm] = useState({
    cnicNo: '', name: '', fatherName: '', fatherOccupation: '',
    presentAddress: '', presentPhone: '', permanentAddress: '', permanentPhone: '',
    email: '', mobileNo: '', dateOfBirth: '', ageYears: '', ageMonths: '',
    maritalStatus: '', domicileCity: '', domicileProvince: '',
    religion: '', sect: '', nationality: 'Pakistani', foreignNationality: '',
    dualNationalityHolder: 'No', spouseOnForeignMission: 'No', marriedToForeignNational: 'No',
    purposeOfInternship: '', duration: '', date: '', referredBy: '',
  });

  /* Ã¢â€â‚¬Ã¢â€â‚¬ table state Ã¢â€â‚¬Ã¢â€â‚¬ */
  const [qualifications, setQualifications] = useState(
    QUAL_LEVELS.map(level => ({ ...emptyQual, level }))
  );
  const [experience, setExperience] = useState([{ ...emptyExp }, { ...emptyExp }]);

  /* Ã¢â€â‚¬Ã¢â€â‚¬ file state Ã¢â€â‚¬Ã¢â€â‚¬ */
  const [photo,     setPhoto]     = useState(null);
  const [cnicFront, setCnicFront] = useState(null);
  const [cnicBack,  setCnicBack]  = useState(null);
  const [cv,        setCv]        = useState(null);
  const [matricDmc, setMatricDmc] = useState(null);
  const [fscDmc,    setFscDmc]    = useState(null);
  const [uniDegree, setUniDegree] = useState(null);
  const [recommendationLetter, setRecommendationLetter] = useState(null);

  const toTitleCase = (value = '') =>
    value
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'email') {
      setForm({ ...form, [name]: value });
      return;
    }

    const shouldCapitalize = [
      'name',
      'fatherName',
      'fatherOccupation',
      'presentAddress',
      'permanentAddress',
      'domicileCity',
      'domicileProvince',
      'religion',
      'sect',
      'nationality',
      'foreignNationality',
      'purposeOfInternship',
      'referredBy'
    ].includes(name);

    setForm({
      ...form,
      [name]: shouldCapitalize ? toTitleCase(value) : value
    });
  };

  /* Ã¢â€â‚¬Ã¢â€â‚¬ DOB picker: auto-calculates age in years & months Ã¢â€â‚¬Ã¢â€â‚¬ */
  const handleDobChange = (e) => {
    const val = e.target.value;
    let ageYears = '', ageMonths = '';
    if (val) {
      const today = new Date();
      const dob   = new Date(val);
      let years  = today.getFullYear() - dob.getFullYear();
      let months = today.getMonth()    - dob.getMonth();
      if (today.getDate() < dob.getDate()) months--;
      if (months < 0) { years--; months += 12; }
      ageYears  = String(years);
      ageMonths = String(months);
    }
    setForm(prev => ({ ...prev, dateOfBirth: val, ageYears, ageMonths }));
  };

  /* Ã¢â€â‚¬Ã¢â€â‚¬ CNIC auto-format: 12345-1234567-1 Ã¢â€â‚¬Ã¢â€â‚¬ */
  const handleCnicChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 13);
    let formatted = digits;
    if (digits.length > 5 && digits.length <= 12) {
      formatted = digits.slice(0, 5) + '-' + digits.slice(5);
    } else if (digits.length > 12) {
      formatted = digits.slice(0, 5) + '-' + digits.slice(5, 12) + '-' + digits.slice(12);
    }
    setForm(prev => ({ ...prev, cnicNo: formatted }));
  };

  const handleQualChange = (idx, field, value) => {
    const u = [...qualifications]; u[idx] = { ...u[idx], [field]: value }; setQualifications(u);
  };
  const handleExpChange = (idx, field, value) => {
    const u = [...experience]; u[idx] = { ...u[idx], [field]: value }; setExperience(u);
  };

  /* Ã¢â€â‚¬Ã¢â€â‚¬ step 1 validation Ã¢â€â‚¬Ã¢â€â‚¬ */
  const validateStep1 = () => {
    if (!form.cnicNo || !form.name) { toast.error('CNIC No and Name are required'); return false; }
    if (!photo)     { toast.error('Please upload your passport-size photo'); return false; }
    if (!cnicFront) { toast.error('Please upload CNIC front'); return false; }
    if (!cnicBack)  { toast.error('Please upload CNIC back'); return false; }
    return true;
  };

  /* Ã¢â€â‚¬Ã¢â€â‚¬ final submit (step 2 Ã¢â€ â€™ step 3) Ã¢â€â‚¬Ã¢â€â‚¬ */
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append('qualifications', JSON.stringify(qualifications));
      fd.append('experience',     JSON.stringify(experience));
      if (photo)     fd.append('photo',     photo);
      if (cnicFront) fd.append('cnicFront', cnicFront);
      if (cnicBack)  fd.append('cnicBack',  cnicBack);
      if (cv)        fd.append('cv',        cv);
      if (matricDmc) fd.append('matricDmc', matricDmc);
      if (fscDmc)    fd.append('fscDmc',    fscDmc);
      if (uniDegree) fd.append('uniDegree', uniDegree);
      if (recommendationLetter) fd.append('recommendationLetter', recommendationLetter);

      await api.post('/intern-applications', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });      setSubmitted(true);
      toast.success('Application submitted successfully!');
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    // Convert a File object to a base64 data URL
    const toDataUrl = (file) => new Promise((resolve) => {
      if (!file) return resolve('');
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.readAsDataURL(file);
    });
    Promise.all([
      toDataUrl(photo), toDataUrl(cnicFront), toDataUrl(cnicBack),
      toDataUrl(matricDmc), toDataUrl(fscDmc), toDataUrl(uniDegree), toDataUrl(recommendationLetter)
    ]).then(([photoSrc, cnicFrontSrc, cnicBackSrc, matricSrc, fscSrc, uniSrc, recommendationSrc]) => {

      const qualRows = qualifications.map((q, i) =>
        `<tr>
          <td style="text-align:center">${['i','ii','iii','iv','v'][i]}</td>
          <td>${q.level||''}</td>
          <td style="text-align:center">${q.passingYear||''}</td>
          <td style="text-align:center">${q.marksDiv||''}</td>
          <td style="text-align:center">${q.percentage||''}</td>
          <td style="text-align:center">${q.cgpa||''}</td>
          <td>${q.institute||''}</td>
          <td>${q.subjects||''}</td>
        </tr>`
      ).join('');

      const expRows = experience.map((exp, i) =>
        `<tr>
          <td style="text-align:center">${['i','ii'][i]}</td>
          <td>${exp.organization||''}</td>
          <td>${exp.designation||''}</td>
          <td>${exp.from||''}</td>
          <td>${exp.to||''}</td>
        </tr>`
      ).join('');

      const line = (label, value) => `<p><strong>${label}</strong> ${value || '____________________'}</p>`;

      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
      <title>Internship Application</title>
      <style>
        body { font-family: Arial, sans-serif; color: #111827; margin: 0; }
        .app-page { padding: 10mm 10mm; }
        h1 { margin: 0; font-size: 30px; text-align: center; text-decoration: underline; }
        h2 { margin: 2px 0 0; text-align: center; font-size: 22px; }
        h3 { margin: 8px 0 12px; text-align: center; font-size: 18px; text-decoration: underline; }
        .top-grid { display: grid; grid-template-columns: 1fr 170px; gap: 14px; align-items: start; }
        .photo-box { border: 1px solid #111; height: 200px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .photo-box img { width: 100%; height: 100%; object-fit: cover; }
        .photo-box span { font-size: 12px; letter-spacing: 1px; color: #555; }
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
      </head><body>
      <section class="app-page">
        <h1>NATIONAL ELECTRONICS COMPLEX OF PAKISTAN</h1>
        <h2>(HRM Directorate)</h2>
        <h3>APPLICATION FORM FOR INTERNSHIP</h3>
        <div class="top-grid">
          <div>
            ${line('CNIC No:', form.cnicNo)}
            ${line('1. Name:', form.name)}
            ${line("2. Father's Name:", form.fatherName)}
            ${line("3. Father's Occupation:", form.fatherOccupation)}
            ${line('4. Address - Present (a):', form.presentAddress)}
            ${line('Phone:', form.mobileNo)}
            ${line('b) Permanent:', form.permanentAddress)}
            ${line('c) E-Mail Address:', form.email)}
            ${line('5. Date of Birth (DD-MM-YYYY):', formatDob(form.dateOfBirth))}
            ${line('Age:', form.ageYears ? `${form.ageYears} yr(s), ${form.ageMonths || 0} month(s)` : '-')}
            ${line('6. Marital Status:', form.maritalStatus)}
            ${line('7. Domicile (City / Province):', `${form.domicileCity || '-'} / ${form.domicileProvince || '-'}`)}
            ${line('8. Religion:', form.religion)}
            ${line('9. Sect:', form.sect)}
            ${line('10. Nationality:', form.nationality)}
            ${line('11. Foreign Nationality (if any):', form.foreignNationality)}
            ${line('12(a). Pakistani born dual nationality holder?', form.dualNationalityHolder)}
            ${line('12(b). Spouse currently serving in a foreign mission?', form.spouseOnForeignMission)}
            ${line('12(c). Married to a foreign national / dual nationality holder?', form.marriedToForeignNational)}
          </div>
          <div class="photo-box">
            ${photoSrc ? `<img src="${photoSrc}" alt="Profile" />` : '<span>PHOTO</span>'}
          </div>
        </div>
        <p class="section-title">13. Qualification: (please mention) % age in case of annual system and CGPA in case of semester system</p>
        <table class="tbl"><thead><tr><th>SR#</th><th>LEVEL</th><th>PASSING YEAR</th><th>MARKS & DIV</th><th>% AGE</th><th>CGPA</th><th>INSTITUTE</th><th>SUBJECTS/QUALIFICATION</th></tr></thead>
        <tbody>${qualRows}</tbody></table>
        <p class="section-title">14. Previous Experience: - (If any)</p>
        <table class="tbl exp"><thead><tr><th>SR#</th><th>Organization/Company</th><th>Designation</th><th>From</th><th>To</th></tr></thead>
        <tbody>${expRows}</tbody></table>
        <div class="purpose-row">
          ${line('15. Purpose of Internship:', form.purposeOfInternship)}
          ${line('16. Duration:', `${form.duration || ''} (In weeks)`)}
        </div>
        <div class="sign-row">
          <p><strong>Dated:</strong> ${form.date || ''}</p>
          <p><strong>Signature of Candidate:</strong> ____________________</p>
        </div>
      </section>
      </body></html>`;
const win = window.open('', '_blank', 'width=1100,height=800');
      win.document.write(html);
      win.document.close();
      win.onload = () => { win.focus(); win.print(); };
    });
  };

  /* Ã¢â€â‚¬Ã¢â€â‚¬ shared nav buttons Ã¢â€â‚¬Ã¢â€â‚¬ */
  const NavButtons = ({ onNext, nextLabel = 'Next ->', nextDisabled = false, showBack = true }) => (
    <div className="flex gap-3 pt-4 border-t mt-6">
      {showBack && (
        <button type="button" onClick={() => setStep(s => s - 1)}
          className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-semibold">
          {'<- Back'}
        </button>
      )}
      <button type="button" onClick={onNext} disabled={nextDisabled}
        className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-blue-800 text-white font-bold rounded-lg hover:shadow-lg transition disabled:opacity-50 text-sm">
        {nextLabel}
      </button>
      <button type="button" onClick={() => navigate('/portal')}
        className="px-5 py-2.5 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition text-sm">
        Cancel
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto mb-3">
        <button
          type="button"
          onClick={() => navigate('/portal')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-blue-700 transition"
        >
          <span aria-hidden="true">&larr;</span>
          Back to Portal
        </button>
      </div>

      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden print:hidden">

        {/* Header */}
        <div className="text-center py-5 border-b-2 border-gray-800 px-6">
          <h1 className="text-xl font-bold uppercase">National Electronics Complex of Pakistan</h1>
          <h2 className="text-lg font-bold">(HRM Directorate)</h2>
          <h3 className="text-base font-semibold underline mt-1">Application Form for Internship</h3>
        </div>

        {/* Step bar */}
        <StepBar
          current={step}
          onStepClick={(targetStep) => {
            if (targetStep === 3 && !submitted) {
              toast.error('Please complete required fields and submit before opening Review & Print.');
              return;
            }
            setStep(targetStep);
          }}
        />

        <div className="p-6">

          {/* Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â
              STEP 1 Ã¢â‚¬â€ PERSONAL RECORD
          Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-base font-bold text-blue-700 border-b pb-2">Personal Record</h2>

              {/* CNIC + Photo row */}
              <div className="flex gap-6">
                <div className="flex-1 space-y-4">
                  <div>
                    <label className={labelCls}>CNIC No <span className="text-red-500">*</span></label>
                    <input name="cnicNo" value={form.cnicNo} onChange={handleCnicChange}
                      placeholder="XXXXX-XXXXXXX-X" maxLength={15} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>1. Name <span className="text-red-500">*</span></label>
                    <input name="name" value={form.name}
                      onChange={e => setForm(prev => ({ ...prev, name: e.target.value.toUpperCase() }))}
                      className={`${inputCls} uppercase`} />
                  </div>
                  <div>
                    <label className={labelCls}>2. Father's Name</label>
                    <input name="fatherName" value={form.fatherName}
                      onChange={e => setForm(prev => ({ ...prev, fatherName: e.target.value.toUpperCase() }))}
                      className={`${inputCls} uppercase`} />
                  </div>
                  <div>
                    <label className={labelCls}>3. Father's Occupation</label>
                    <input name="fatherOccupation" value={form.fatherOccupation} onChange={handleChange} className={inputCls} />
                  </div>
                </div>
                {/* Passport photo */}
                <div className="w-36 flex flex-col items-center gap-2 shrink-0">
                  <label className="cursor-pointer block">
                    <div className="w-32 h-40 border-2 border-gray-400 flex items-center justify-center overflow-hidden bg-gray-50 rounded hover:border-blue-400 transition">
                      {photo
                        ? <img src={URL.createObjectURL(photo)} alt="Profile" className="w-full h-full object-cover" />
                        : <span className="text-xs text-gray-400 text-center px-2">Photo<br/>(Passport Size)</span>}
                    </div>
                    <input type="file" accept=".jpg,.jpeg,.png" className="hidden"
                      onChange={e => { const f = e.target.files[0]; if (f && f.size <= 5*1024*1024) setPhoto(f); }} />
                  </label>
                  <span className="text-xs text-blue-600 font-medium">Upload Photo <span className="text-red-500">*</span></span>
                </div>
              </div>

              {/* Addresses */}
              <div>
                <label className={labelCls}>4. Address - Present (a)</label>
                <input name="presentAddress" value={form.presentAddress} onChange={handleChange} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Phone</label>
                  <input name="presentPhone" value={form.presentPhone} onChange={handleChange} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>b) Permanent Address</label>
                  <input name="permanentAddress" value={form.permanentAddress} onChange={handleChange} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Phone</label>
                  <input name="permanentPhone" value={form.permanentPhone} onChange={handleChange} className={inputCls} />
                </div>
              </div>

              {/* Contact */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>c) E-Mail Address</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Mobile No.</label>
                  <input name="mobileNo" value={form.mobileNo} onChange={e => setForm(prev => ({ ...prev, mobileNo: e.target.value.replace(/-/g, '') }))} inputMode="numeric" className={inputCls} />
                </div>
              </div>

              {/* DOB / Age / Marital / Domicile */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>5. Date of Birth</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={form.dateOfBirth}
                    onChange={handleDobChange}
                    max={new Date().toISOString().split('T')[0]}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>(b) Age</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      value={form.ageYears}
                      readOnly
                      placeholder="-"
                      className={`${inputCls} w-16 text-center bg-gray-50 text-gray-600 cursor-not-allowed`}
                    />
                    <span className="text-sm text-gray-600 whitespace-nowrap">yr. (s)</span>
                    <input
                      value={form.ageMonths}
                      readOnly
                      placeholder="-"
                      className={`${inputCls} w-16 text-center bg-gray-50 text-gray-600 cursor-not-allowed`}
                    />
                    <span className="text-sm text-gray-600 whitespace-nowrap">month(s)</span>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>6. Marital Status</label>
                  <select name="maritalStatus" value={form.maritalStatus} onChange={handleChange} className={inputCls}>
                    <option value="">Select</option>
                    <option>Single</option><option>Married</option>
                    <option>Divorced</option><option>Widowed</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelCls}>7. Domicile City</label>
                    <input name="domicileCity" value={form.domicileCity} onChange={handleChange} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Province</label>
                    <input name="domicileProvince" value={form.domicileProvince} onChange={handleChange} className={inputCls} />
                  </div>
                </div>
              </div>

              {/* Religion / Nationality */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>8. Religion</label>
                  <input name="religion" value={form.religion} onChange={handleChange} placeholder="Islam/Christianity/etc." className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>9. Sect</label>
                  <input name="sect" value={form.sect} onChange={handleChange} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>10. Nationality</label>
                  <input name="nationality" value={form.nationality} onChange={handleChange} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>11. Foreign Nationality (if any)</label>
                  <input name="foreignNationality" value={form.foreignNationality} onChange={handleChange} className={inputCls} />
                </div>
              </div>

              {/* Dual nationality questions */}
              <div className="space-y-2 bg-gray-50 rounded-lg p-4 border border-gray-200">
                {[
                  { name: 'dualNationalityHolder',    label: '(a) Are you a Pakistani born dual nationality Holder?' },
                  { name: 'spouseOnForeignMission',   label: '(b) Spouse/Family residing with you on Foreign Mission(s)?' },
                  { name: 'marriedToForeignNational', label: '(c) Are you married to a Foreign National / dual nationality holder?' },
                ].map(q => (
                  <div key={q.name} className="flex items-center gap-4">
                    <label className="text-sm text-gray-700 flex-1">{q.label}</label>
                    <select name={q.name} value={form[q.name]} onChange={handleChange}
                      className="border border-gray-300 rounded px-2 py-1 text-sm">
                      <option>No</option><option>Yes</option>
                    </select>
                  </div>
                ))}
              </div>

              {/* CNIC Front + Back uploads */}
              <div className="border-t pt-5">
                <h3 className="text-sm font-bold text-gray-700 mb-1">CNIC Images</h3>
                <p className="text-xs text-gray-500 mb-4">Upload clear photos of both sides of your CNIC. JPG or PNG - max 5 MB each.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FileBox label="CNIC Front" file={cnicFront} setter={setCnicFront}
                    accept=".jpg,.jpeg,.png" hint="JPG or PNG - max 5 MB" required />
                  <FileBox label="CNIC Back" file={cnicBack} setter={setCnicBack}
                    accept=".jpg,.jpeg,.png" hint="JPG or PNG - max 5 MB" required />
                </div>
              </div>

              <NavButtons showBack={false}
                onNext={() => { if (validateStep1()) setStep(2); }}
                nextLabel="Next: Academic Record ->" />
            </div>
          )}

          {/* Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â
              STEP 2 Ã¢â‚¬â€ ACADEMIC RECORD
          Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-base font-bold text-blue-700 border-b pb-2">Academic Record</h2>

              {/* Qualifications table */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">12. Qualification</h3>
                <p className="text-xs text-gray-500 mb-3">
                  Fill in the rows that apply. Use % Age <em>or</em> CGPA depending on your grading system.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border border-gray-300">
                    <thead className="bg-gray-100">
                      <tr>
                        {[
                          ['SR#','w-6'],['Level','min-w-[140px]'],['Passing Year','w-20'],
                          ['Marks & Div','w-20'],['% Age','w-14'],['CGPA','w-14'],
                          ['Institute','w-44'],['Subjects/Qualification','w-32']
                        ].map(([h, w]) => (
                          <th key={h} className={`border border-gray-300 px-2 py-2 text-left whitespace-nowrap ${w}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {qualifications.map((q, idx) => (
                        <tr key={idx} className="hover:bg-blue-50/30">
                          <td className="border border-gray-300 px-2 py-1 text-center text-gray-500 font-mono">
                            {['i','ii','iii','iv','v'][idx]}
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-gray-600 text-xs min-w-[140px]">{q.level}</td>
                          {['passingYear','marksDiv','percentage','cgpa','institute','subjects'].map(field => (
                            <td key={field} className="border border-gray-300 p-0">
                              <input value={q[field]} onChange={e => handleQualChange(idx, field, e.target.value)}
                                className={`w-full px-1 py-1.5 text-xs outline-none focus:bg-blue-50 ${
                                  field === 'institute' ? 'min-w-[160px]' : field === 'subjects' ? 'min-w-[110px]' : 'min-w-[60px]'
                                }`} />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Experience table */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">13. Previous Experience (If any)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border border-gray-300">
                    <thead className="bg-gray-100">
                      <tr>
                        {['SR#','Organization / Company','Designation','From','To'].map(h => (
                          <th key={h} className="border border-gray-300 px-2 py-2 text-left">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {experience.map((exp, idx) => (
                        <tr key={idx} className="hover:bg-blue-50/30">
                          <td className="border border-gray-300 px-2 py-1 text-center text-gray-500 font-mono">
                            {['i','ii'][idx]}
                          </td>
                          {['organization','designation','from','to'].map(field => (
                            <td key={field} className="border border-gray-300 p-0">
                              <input value={exp[field]} onChange={e => handleExpChange(idx, field, e.target.value)}
                                className="w-full px-1 py-1.5 text-xs outline-none focus:bg-blue-50" />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Purpose / Duration / Date / Referred By */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>14. Purpose of Internship</label>
                  <input name="purposeOfInternship" value={form.purposeOfInternship} onChange={handleChange} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>15. Duration (In weeks)</label>
                  <input name="duration" value={form.duration} onChange={handleChange} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Dated</label>
                  <input name="date" value={form.date} onChange={handleChange} placeholder="DD-MM-YYYY" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Referred By</label>
                  <input name="referredBy" value={form.referredBy} onChange={handleChange} className={inputCls} />
                </div>
              </div>

              {/* Academic document uploads */}
              <div className="border-t pt-5">
                <h3 className="font-semibold text-gray-800 mb-1">Academic Documents</h3>
                <p className="text-xs text-gray-500 mb-4">
                  Upload clear scans or photos. JPG / PNG - max 5 MB each.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  <FileBox label="Matric DMC" file={matricDmc} setter={setMatricDmc}
                    accept=".jpg,.jpeg,.png" hint="JPG or PNG - max 5 MB" required />
                  <FileBox label="FSc DMC" file={fscDmc} setter={setFscDmc}
                    accept=".jpg,.jpeg,.png" hint="JPG or PNG - max 5 MB" required />
                  <FileBox label="University Degree / Transcript" file={uniDegree} setter={setUniDegree}
                    accept=".jpg,.jpeg,.png,.pdf" hint="JPG, PNG or PDF - max 5 MB" required />
                  <FileBox label="Recommendation Letter" file={recommendationLetter} setter={setRecommendationLetter}
                    accept=".jpg,.jpeg,.png,.pdf" hint="JPG, PNG or PDF - max 5 MB" required />
                </div>
              </div>

              {/* CV optional */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-800 mb-3">CV / Resume <span className="text-gray-400 font-normal text-xs">(optional)</span></h3>
                <div className="max-w-xs">
                  <FileBox label="CV / Resume" file={cv} setter={setCv}
                    accept=".pdf" hint="PDF only - max 5 MB" />
                </div>
              </div>

              <NavButtons
                onNext={() => {
                  if (!matricDmc) { toast.error('Please upload Matric DMC'); return; }
                  if (!fscDmc)    { toast.error('Please upload FSc DMC'); return; }
                  if (!uniDegree) { toast.error('Please upload University Degree / Transcript'); return; }
                  if (!recommendationLetter) { toast.error('Please upload Recommendation Letter'); return; }
                  handleSubmit();
                }}
                nextLabel={submitting ? 'Submitting...' : 'Submit & Review ->'}
                nextDisabled={submitting}
              />
            </div>
          )}

          {/* Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â
              STEP 3 Ã¢â‚¬â€ REVIEW & PRINT
          Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xl">
                  <span aria-label="Completed" role="img">&#10003;</span>
                </div>
                <div>
                  <h2 className="text-base font-bold text-green-700">Application Submitted Successfully</h2>
                  <p className="text-xs text-gray-500">Review your details below, then print or proceed to upload your CNIC front.</p>
                </div>
              </div>

              {/* Ã¢â€â‚¬Ã¢â€â‚¬ Personal summary Ã¢â€â‚¬Ã¢â€â‚¬ */}
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <div className="bg-blue-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-blue-800">Personal Record</h3>
                  {photo && (
                    <img src={URL.createObjectURL(photo)} alt="Profile"
                      className="w-12 h-16 object-cover rounded border border-gray-300" />
                  )}
                </div>
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-sm">
                  {[
                    ['CNIC No', form.cnicNo], ['Name', form.name],
                    ["Father's Name", form.fatherName], ["Father's Occupation", form.fatherOccupation],
                    ['Present Address', form.presentAddress], ['Phone', form.presentPhone],
                    ['Permanent Address', form.permanentAddress], ['Phone', form.permanentPhone],
                    ['Email', form.email], ['Mobile No', form.mobileNo],
                    ['Date of Birth', formatDob(form.dateOfBirth)], ['Age', form.ageYears && `${form.ageYears} yr. ${form.ageMonths} month(s)`],
                    ['Marital Status', form.maritalStatus], ['Domicile City', form.domicileCity],
                    ['Domicile Province', form.domicileProvince], ['Religion', form.religion],
                    ['Sect', form.sect], ['Nationality', form.nationality],
                    ['Foreign Nationality', form.foreignNationality],
                    ['Dual Nationality Holder', form.dualNationalityHolder],
                    ['Spouse on Foreign Mission', form.spouseOnForeignMission],
                    ['Married to Foreign National', form.marriedToForeignNational],
                  ].map(([label, value]) => (
                    <div key={label} className="flex gap-2 border-b border-dotted border-gray-200 py-0.5">
                      <span className="w-44 shrink-0 text-gray-500 text-xs">{label}</span>
                      <span className="text-gray-800 text-xs font-medium">{value || 'Ã¢â‚¬â€'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ã¢â€â‚¬Ã¢â€â‚¬ Qualifications summary Ã¢â€â‚¬Ã¢â€â‚¬ */}
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <div className="bg-blue-50 px-4 py-2 border-b border-gray-200">
                  <h3 className="text-sm font-bold text-blue-800">Academic Record Ã¢â‚¬â€ Qualifications</h3>
                </div>
                <div className="overflow-x-auto p-2">
                  <table className="w-full text-xs border border-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {['SR#','Level','Year','Marks/Div','%','CGPA','Institute','Subjects/Qualification'].map(h => (
                          <th key={h} className="border border-gray-200 px-2 py-1 text-left text-gray-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {qualifications.map((q, i) => (
                        <tr key={i} className="border-b border-gray-100">
                          <td className="px-2 py-1 text-center text-gray-400 font-mono">{['i','ii','iii','iv','v'][i]}</td>
                          <td className="px-2 py-1 text-gray-600">{q.level}</td>
                          <td className="px-2 py-1 text-center">{q.passingYear || 'Ã¢â‚¬â€'}</td>
                          <td className="px-2 py-1 text-center">{q.marksDiv || 'Ã¢â‚¬â€'}</td>
                          <td className="px-2 py-1 text-center">{q.percentage || 'Ã¢â‚¬â€'}</td>
                          <td className="px-2 py-1 text-center">{q.cgpa || 'Ã¢â‚¬â€'}</td>
                          <td className="px-2 py-1 break-words max-w-[140px]">{q.institute || 'Ã¢â‚¬â€'}</td>
                          <td className="px-2 py-1">{q.subjects || 'Ã¢â‚¬â€'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Ã¢â€â‚¬Ã¢â€â‚¬ Experience + internship details Ã¢â€â‚¬Ã¢â€â‚¬ */}
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <div className="bg-blue-50 px-4 py-2 border-b border-gray-200">
                  <h3 className="text-sm font-bold text-blue-800">Experience & Internship Details</h3>
                </div>
                <div className="p-4 space-y-3">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border border-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {['SR#','Organization','Designation','From','To'].map(h => (
                            <th key={h} className="border border-gray-200 px-2 py-1 text-left text-gray-500">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {experience.map((exp, i) => (
                          <tr key={i} className="border-b border-gray-100">
                            <td className="px-2 py-1 text-center text-gray-400 font-mono">{['i','ii'][i]}</td>
                            <td className="px-2 py-1">{exp.organization || 'Ã¢â‚¬â€'}</td>
                            <td className="px-2 py-1">{exp.designation || 'Ã¢â‚¬â€'}</td>
                            <td className="px-2 py-1">{exp.from || 'Ã¢â‚¬â€'}</td>
                            <td className="px-2 py-1">{exp.to || 'Ã¢â‚¬â€'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-xs pt-2">
                    <div><span className="text-gray-500">Purpose: </span><span className="font-medium">{form.purposeOfInternship || 'Ã¢â‚¬â€'}</span></div>
                    <div><span className="text-gray-500">Duration: </span><span className="font-medium">{form.duration ? `${form.duration} weeks` : 'Ã¢â‚¬â€'}</span></div>
                    <div><span className="text-gray-500">Dated: </span><span className="font-medium">{form.date || 'Ã¢â‚¬â€'}</span></div>
                    <div><span className="text-gray-500">Referred By: </span><span className="font-medium">{form.referredBy || 'Ã¢â‚¬â€'}</span></div>
                  </div>
                </div>
              </div>

              {/* Ã¢â€â‚¬Ã¢â€â‚¬ Uploaded documents thumbnails Ã¢â€â‚¬Ã¢â€â‚¬ */}
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <div className="bg-blue-50 px-4 py-2 border-b border-gray-200">
                  <h3 className="text-sm font-bold text-blue-800">Uploaded Documents</h3>
                </div>
                <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    { file: cnicFront, label: 'CNIC Front' },
                    { file: cnicBack,  label: 'CNIC Back' },
                    { file: matricDmc, label: 'Matric DMC' },
                    { file: fscDmc,    label: 'FSc DMC' },
                    { file: uniDegree, label: 'Uni Degree / Transcript' },
                    { file: recommendationLetter, label: 'Recommendation Letter' },
                  ].map(({ file, label }) => (
                    <div key={label} className="text-center">
                      <p className="text-xs font-semibold text-gray-500 mb-1">{label}</p>
                      {file ? (
                        file.type === 'application/pdf'
                          ? <div className="h-20 flex items-center justify-center bg-gray-50 rounded border border-gray-200 text-2xl">PDF</div>
                          : <img src={URL.createObjectURL(file)} alt={label}
                              className="h-20 w-full object-contain rounded border border-gray-200 bg-gray-50" />
                      ) : (
                        <div className="h-20 flex items-center justify-center bg-gray-50 rounded border border-dashed border-gray-300 text-xs text-gray-400">Not uploaded</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Ã¢â€â‚¬Ã¢â€â‚¬ Action buttons Ã¢â€â‚¬Ã¢â€â‚¬ */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t">
                <button type="button" onClick={handlePrint}
                  className="flex-1 py-3 bg-gray-800 text-white font-bold rounded-lg hover:bg-gray-900 transition flex items-center justify-center gap-2">
                  Print Application
                </button>
                <button type="button" onClick={() => navigate('/portal')}
                  className="px-6 py-3 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition text-sm">
                  Go to Portal
                </button>
              </div>
            </div>
          )}

        </div>{/* /p-6 */}
      </div>{/* /card */}
    </div>
  );
};

export default InternApplicationForm;




