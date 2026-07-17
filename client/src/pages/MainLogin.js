import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import {
  FaArrowRight,
  FaBriefcase,
  FaCheckCircle,
  FaKey,
  FaLock,
  FaMicrochip,
  FaUserShield
} from 'react-icons/fa';
import PasswordInput from '../components/PasswordInput';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

const MainLogin = ({ onLoginSuccess, onAccessCodeSuccess }) => {
  const [form, setForm] = useState({ email: '', password: '', accessCode: '' });
  const [showAccessCode, setShowAccessCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      if (showAccessCode && form.accessCode.trim()) {
        try {
          const response = await api.post('/access/verify-code', {
            code: form.accessCode.toUpperCase()
          });
          if (response.data.success) {
            localStorage.setItem('accessToken', response.data.sessionToken);
            toast.success('Access granted! Welcome to the portal.');
            if (onAccessCodeSuccess) onAccessCodeSuccess();
            navigate('/portal');
          }
        } catch (error) {
          toast.error(error.response?.data?.error || 'Invalid access code');
        }
        return;
      }

      const result = await login(form.email, form.password);
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      const role = result.user?.role;
      if (role === 'superadmin' || role === 'admin') {
        toast.success('Welcome back!');
        if (onLoginSuccess) onLoginSuccess(role);
        navigate('/dashboard');
      } else if (role === 'student') {
        toast.success('Welcome back!');
        if (onLoginSuccess) onLoginSuccess(role);
        navigate('/portal');
      } else {
        navigate('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 shadow-[0_32px_90px_-35px_rgba(15,23,42,0.4)] backdrop-blur-xl lg:grid-cols-[1.08fr_0.92fr]">
          <section className="relative hidden min-h-[680px] overflow-hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
            <div className="login-orb login-orb-one" />
            <div className="login-orb login-orb-two" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 text-lg shadow-lg shadow-blue-950/30">
                  <FaMicrochip />
                </span>
                <div>
                  <p className="font-bold tracking-tight">Intern Portal</p>
                  <p className="text-xs text-slate-300">Career operations workspace</p>
                </div>
              </div>

              <div className="mt-16 max-w-lg">
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-300">One connected platform</p>
                <h1 className="mt-5 text-5xl font-black leading-[1.08] tracking-tight">
                  Build better internship experiences.
                </h1>
                <p className="mt-6 max-w-md text-base leading-7 text-slate-300">
                  A focused workspace for applications, CVs, access management, and intern opportunities.
                </p>
              </div>
            </div>

            <div className="relative z-10 grid gap-3">
              {[
                { icon: FaBriefcase, text: 'Manage applications in one workspace' },
                { icon: FaUserShield, text: 'Protected access for authorized users' },
                { icon: FaCheckCircle, text: 'Simple, secure, and built for fast review' }
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3.5 text-sm text-slate-200 backdrop-blur">
                  <item.icon className="shrink-0 text-blue-300" />
                  {item.text}
                </div>
              ))}
            </div>
          </section>

          <section className="flex min-h-[620px] flex-col justify-center p-6 sm:p-10 lg:p-12">
            <div className="mx-auto w-full max-w-md">
              <div className="mb-9">
                <div className="mb-7 flex items-center gap-3 lg:hidden">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
                    <FaMicrochip />
                  </span>
                  <div>
                    <p className="font-extrabold text-slate-950">Intern Portal</p>
                    <p className="text-xs font-medium text-slate-500">Career operations workspace</p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-700 ring-1 ring-blue-100">
                  {showAccessCode ? <FaKey /> : <FaLock />}
                  {showAccessCode ? 'Intern access' : 'Secure sign in'}
                </span>
                <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                  {showAccessCode ? 'Enter your access code' : 'Welcome back'}
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  {showAccessCode
                    ? 'Use the code shared by your administrator to continue to the intern portal.'
                    : 'Enter your account details to continue to your dashboard.'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
          {!showAccessCode && (
            <>
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Email address</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="modern-input"
                  placeholder="your@email.com"
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Password</label>
                <PasswordInput
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="modern-input"
                  placeholder="Enter your password"
                />
              </div>
            </>
          )}

          {showAccessCode && (
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Access code</label>
              <input
                type="text"
                name="accessCode"
                value={form.accessCode}
                onChange={(event) => setForm({ ...form, accessCode: event.target.value.toUpperCase() })}
                required
                maxLength={14}
                disabled={loading}
                className="modern-input text-center font-mono text-lg font-bold uppercase tracking-[0.22em]"
                placeholder="XXXX-XXXX-XXXX"
                autoFocus
              />
              <p className="mt-2 text-center text-xs font-medium text-slate-400">
                Enter the code provided by your administrator
              </p>
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-1.5">
            <button
              type="button"
              onClick={() => {
                setShowAccessCode((value) => !value);
                setForm({ email: '', password: '', accessCode: '' });
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-white hover:text-blue-700 hover:shadow-sm"
            >
              {showAccessCode ? <FaLock /> : <FaKey />}
              {showAccessCode ? 'Back to account sign in' : 'New intern? Use an access code'}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-slate-950 px-5 py-4 text-base font-extrabold text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-900/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          >
            <span>
              {loading
                ? (showAccessCode ? 'Verifying...' : 'Signing in...')
                : (showAccessCode ? 'Enter portal' : 'Sign in')}
            </span>
            {!loading && <FaArrowRight className="text-sm transition-transform group-hover:translate-x-1" />}
          </button>
              </form>

              <div className="mt-8 flex items-center justify-center gap-2 text-xs font-medium text-slate-400">
                <FaLock className="text-[10px]" />
                Secure access · Intern Portal © {new Date().getFullYear()}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default MainLogin;
