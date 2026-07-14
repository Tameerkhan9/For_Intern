import React, { useEffect, useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import MainLogin from './pages/MainLogin';
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import Dashboard from './pages/Dashboard';
import InternApplicationForm from './pages/InternApplicationForm';
import CnicUpload from './pages/CnicUpload';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import api from './services/api';
import accessCodeAPI from './services/accessCodeAPI';

const NavbarWrapper = () => {
  const location = useLocation();
  if (location.pathname === '/') return null;
  return <Navbar />;
};

function App() {
  const [hasDashboardAccess, setHasDashboardAccess] = useState(false);
  const [hasPortalAccess, setHasPortalAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  const verifyAccess = useCallback(async () => {
    let dashboardAllowed = false;
    let portalAllowed = false;

    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      if (token) {
        try {
          const me = await api.get('/auth/me');
          const role = me?.data?.user?.role;
          dashboardAllowed = role === 'superadmin' || role === 'admin';
          portalAllowed = role === 'student';
        } catch (error) {
          if (error.response?.status === 401 || error.response?.status === 403) {
            sessionStorage.removeItem('token');
            localStorage.removeItem('token');
          }
        }
      }

      const accessToken = localStorage.getItem('accessToken');
      if (accessToken) {
        try {
          await accessCodeAPI.verifySession();
          portalAllowed = true;
        } catch (error) {
          if (error.response?.status === 401 || error.response?.status === 403) {
            localStorage.removeItem('accessToken');
          }
        }
      }
    } finally {
      setHasDashboardAccess(dashboardAllowed);
      setHasPortalAccess(portalAllowed);
      setCheckingAccess(false);
    }
  }, []);

  useEffect(() => {
    verifyAccess();
  }, [verifyAccess]);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'portalLogout') {
        localStorage.removeItem('accessToken');
        setHasPortalAccess(false);
      }
      if (e.key === 'logoutUser') {
        setHasDashboardAccess(false);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    if (!hasPortalAccess) return;

    const check = async () => {
      try {
        await accessCodeAPI.verifySession();
      } catch (error) {
        if (error.response?.status === 401) {
          localStorage.removeItem('accessToken');
          setHasPortalAccess(false);
        }
      }
    };

    const intervalId = setInterval(check, 30000);
    window.addEventListener('focus', check);
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', check);
    };
  }, [hasPortalAccess]);

  useEffect(() => {
    if (!hasDashboardAccess) return;

    const checkDashboardSession = async () => {
      try {
        const response = await api.get('/auth/me');
        const role = response?.data?.user?.role;
        if (role !== 'admin' && role !== 'superadmin') {
          sessionStorage.removeItem('token');
          localStorage.removeItem('token');
          setHasDashboardAccess(false);
        }
      } catch (error) {
        if (error.response?.status === 401 || error.response?.status === 403) {
          sessionStorage.removeItem('token');
          localStorage.removeItem('token');
          setHasDashboardAccess(false);
        }
      }
    };

    const intervalId = setInterval(checkDashboardSession, 10000);
    window.addEventListener('focus', checkDashboardSession);
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', checkDashboardSession);
    };
  }, [hasDashboardAccess]);

  const handleAccessGranted = useCallback(() => setHasPortalAccess(true), []);
  const handleJwtAccessGranted = useCallback((role) => {
    setHasDashboardAccess(role === 'superadmin' || role === 'admin');
    setHasPortalAccess(role === 'student');
  }, []);

  const loadingView = <div className="flex items-center justify-center h-screen bg-gray-900"><div className="text-white">Loading...</div></div>;

  return (
    <Router basename="/For_Intern">
      <AuthProvider>
        <div className="min-h-screen bg-white">
          <NavbarWrapper />
          <Routes>
            <Route path="/" element={<MainLogin onLoginSuccess={handleJwtAccessGranted} onAccessCodeSuccess={handleAccessGranted} />} />
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="/dashboard" element={checkingAccess ? loadingView : (hasDashboardAccess ? <Dashboard /> : <Navigate to="/" replace />)} />
            <Route path="/portal/apply" element={checkingAccess ? loadingView : (hasPortalAccess ? <InternApplicationForm /> : <Navigate to="/" replace />)} />
            <Route path="/portal/cnic-upload/:id" element={checkingAccess ? loadingView : (hasPortalAccess ? <CnicUpload /> : <Navigate to="/" replace />)} />
            <Route path="/portal" element={checkingAccess ? loadingView : (hasPortalAccess ? <Landing /> : <Navigate to="/" replace />)} />
            <Route path="/jobs" element={checkingAccess ? loadingView : (hasPortalAccess ? <Jobs /> : <Navigate to="/" replace />)} />
            <Route path="/jobs/:id" element={checkingAccess ? loadingView : (hasPortalAccess ? <JobDetail /> : <Navigate to="/" replace />)} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </AuthProvider>
      <Toaster position="top-right" />
    </Router>
  );
}

export default App;
