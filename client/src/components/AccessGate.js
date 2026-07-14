import React, { useState } from 'react';
import api from '../services/api';
import './AccessGate.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const AccessGate = ({ onAccessGranted }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const [showCode, setShowCode] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/access/verify-code', { code: code.toUpperCase() });

      if (response.data.success) {
        localStorage.setItem('accessToken', response.data.sessionToken);
        localStorage.setItem('accessGrantedAt', new Date().toISOString());
        onAccessGranted();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid access code. Access codes cannot be shared.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="access-gate-container">
      <div className="access-gate-overlay"></div>
      
      <div className="access-gate-content">
        {/* Security Badge */}
        <div className="security-badge">
          <i className="fas fa-shield-alt"></i>
        </div>

        <h1>Intern Portal</h1>
        <p className="subtitle">Authorized Intern Access Only</p>

        <form onSubmit={handleSubmit} className="access-form">
          <div className="form-group">
            <label htmlFor="access-code">Access Code</label>
            <div style={{ position: 'relative' }}>
              <input
                id="access-code"
                type={showCode ? 'text' : 'password'}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Enter your access code"
                maxLength="16"
                required
                disabled={loading}
                className="access-input"
                style={{ paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowCode(prev => !prev)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}
                tabIndex={-1}
                aria-label={showCode ? 'Hide code' : 'Show code'}
              >
                {showCode ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
              </button>
            </div>
            <p className="code-hint">Format: XXXX-XXXX-XXXX</p>
          </div>

          {error && (
            <div className="error-message">
              <i className="fas fa-exclamation-circle"></i>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !code}
            className="access-submit-btn"
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Verifying...
              </>
            ) : (
              <>
                <i className="fas fa-lock-open"></i>
                Grant Access
              </>
            )}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setShowInfo(!showInfo)}
          className="info-toggle"
        >
          <i className="fas fa-question-circle"></i>
          About This Access Code
        </button>

        {showInfo && (
          <div className="info-box">
            <h3>How This Works</h3>
            <ul>
              <li>
                <strong>Personal Code:</strong> Your access code is unique to you. Do not share it with anyone.
              </li>
              <li>
                <strong>Device Locked:</strong> Your code is locked to your device. It cannot be used from another device.
              </li>
              <li>
                <strong>Expiration:</strong> Your code expires on the date provided to you.
              </li>
              <li>
                <strong>Tracked Usage:</strong> All access attempts are logged for security purposes.
              </li>
              <li>
                <strong>One User Per Code:</strong> Sharing your code is a security violation and will be detected and blocked.
              </li>
            </ul>
          </div>
        )}

        <footer className="access-footer">
          <p>🔐 Portal Security • Device Fingerprinting • IP Logging</p>
        </footer>
      </div>
    </div>
  );
};

export default AccessGate;
