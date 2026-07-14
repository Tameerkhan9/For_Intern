import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { FaMicrochip } from 'react-icons/fa';
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-300 px-4 py-20">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full flex flex-col items-center">
        <div className="w-full bg-gradient-to-r from-blue-700 to-blue-500 rounded-t-2xl py-8 flex flex-col items-center gap-2">
          <FaMicrochip className="text-white text-4xl" />
          <h1 className="text-3xl font-extrabold text-white tracking-wide">Intern Portal</h1>
          <p className="text-blue-100 text-sm">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="w-full px-8 py-6 space-y-5">
          {!showAccessCode && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent disabled:bg-gray-50"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Password</label>
                <PasswordInput
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent disabled:bg-gray-50"
                />
              </div>
            </>
          )}

          {showAccessCode && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Access Code</label>
              <input
                type="text"
                name="accessCode"
                value={form.accessCode}
                onChange={(event) => setForm({ ...form, accessCode: event.target.value.toUpperCase() })}
                required
                maxLength={14}
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent font-mono tracking-widest text-center text-lg disabled:bg-gray-50"
                placeholder="XXXX-XXXX-XXXX"
                autoFocus
              />
              <p className="text-xs text-gray-400 mt-1 text-center">
                Enter the code provided by your administrator
              </p>
            </div>
          )}

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setShowAccessCode((value) => !value);
                setForm({ email: '', password: '', accessCode: '' });
              }}
              className="text-xs text-blue-600 font-semibold hover:underline"
            >
              {showAccessCode ? 'Back to Sign In' : 'New intern? Enter access code instead'}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-800 text-white font-bold rounded-lg hover:shadow-lg transition disabled:opacity-50 text-lg"
          >
            {loading
              ? (showAccessCode ? 'Verifying...' : 'Signing In...')
              : (showAccessCode ? 'Enter Portal' : 'Sign In')}
          </button>
        </form>

        <div className="w-full text-center pb-4 text-xs text-gray-400">
          Copyright {new Date().getFullYear()} Intern Portal. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default MainLogin;
