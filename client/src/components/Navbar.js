import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FaBars,
  FaBriefcase,
  FaComments,
  FaHome,
  FaMicrochip,
  FaMoon,
  FaSignOutAlt,
  FaSun,
  FaTimes,
  FaUserShield
} from 'react-icons/fa';
import accessCodeAPI from '../services/accessCodeAPI';
import { usersAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const cx = (...classes) => classes.filter(Boolean).join(' ');

const NavButton = ({ active, children, className = '', ...props }) => (
  <button
    type="button"
    className={cx(
      'inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition',
      active ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-950',
      className
    )}
    {...props}
  >
    {children}
  </button>
);

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [activeSection, setActiveSection] = useState('home');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const pathname = location.pathname;
  const isDashboardArea = pathname.startsWith('/dashboard');
  const isPortalArea = pathname.startsWith('/portal') || pathname.startsWith('/jobs');
  const isLoginPage = pathname === '/' || pathname === '/login';
  const isSuperAdmin = user?.role === 'superadmin';

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    setActiveSection('home');
    setIsMenuOpen(false);
  }, [pathname]);

  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);

    if (element) {
      const top = element.getBoundingClientRect().top + window.pageYOffset - 80;
      window.scrollTo({ top, behavior: 'smooth' });
      return;
    }

    navigate(isDashboardArea ? '/dashboard' : '/portal');
  };

  const handlePortalLogout = async () => {
    setShowLogoutConfirm(false);
    try {
      await accessCodeAPI.logout();
    } catch (error) {
      // Best-effort logout.
    } finally {
      localStorage.setItem('portalLogout', Date.now().toString());
      localStorage.removeItem('accessToken');
      toast.success('Portal logged out');
      if (isDashboardArea && isAuthenticated) {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  };

  const handleDashboardLogoutOnly = () => {
    logout({ preservePortal: true, broadcast: false });
    toast.success('Dashboard logged out');
    navigate('/', { replace: true });
  };

  const handleLogoutNormalDashboardAdmins = async () => {
    try {
      const response = await usersAPI.logoutAllDashboardAdmins();
      toast.success(response?.data?.message || 'Dashboard admins logged out');
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to logout dashboard admins');
    }
  };

  const navItems = [
    ...(!isLoginPage && (isDashboardArea || isPortalArea)
      ? [{ id: 'home', label: 'Home', icon: FaHome }]
      : []),
    ...(!isLoginPage
      ? [
          { id: 'about', label: 'About', icon: FaMicrochip },
          { id: 'contact', label: 'Contact', icon: FaComments }
        ]
      : []),
    ...(isPortalArea ? [{ id: 'feedback', label: 'Feedback', icon: FaComments }] : [])
  ];

  const brandTarget = isDashboardArea && isAuthenticated ? '/dashboard' : isPortalArea ? '/portal' : '/';

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link to={brandTarget} className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-600 text-white">
              <FaMicrochip />
            </div>
            <div className="leading-tight">
              <p className="text-base font-bold text-gray-950 dark:text-white">Intern</p>
              <p className="hidden text-xs font-semibold text-gray-500 dark:text-gray-400 sm:block">
                {isDashboardArea ? 'Admin console' : 'Career portal'}
              </p>
            </div>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavButton
                  key={item.id}
                  active={activeSection === item.id}
                  onClick={() => scrollToSection(item.id)}
                >
                  <Icon className="text-xs" />
                  {item.label}
                </NavButton>
              );
            })}
            {isPortalArea && (
              <Link
                to="/jobs"
                className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 hover:text-gray-950"
              >
                <FaBriefcase className="text-xs" />
                Jobs
              </Link>
            )}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <button
              type="button"
              onClick={() => setDarkMode((value) => !value)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-gray-200 text-gray-600 transition hover:bg-gray-50 hover:text-gray-950 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-900"
              aria-label="Toggle dark mode"
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? <FaSun /> : <FaMoon />}
            </button>

            {isDashboardArea && isAuthenticated && (
              <div className="hidden items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 lg:flex">
                <FaUserShield className="text-blue-700" />
                {user?.name || 'Admin'}
              </div>
            )}

            {isDashboardArea && isAuthenticated && (
              <>
                {isSuperAdmin ? (
                  <>
                    <button
                      type="button"
                      onClick={handleDashboardLogoutOnly}
                      className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
                    >
                      <FaSignOutAlt />
                      Logout Super Admin
                    </button>
                    <button
                      type="button"
                      onClick={handleLogoutNormalDashboardAdmins}
                      className="inline-flex items-center gap-2 rounded-md bg-red-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
                    >
                      <FaSignOutAlt />
                      Logout Dashboard
                    </button>
                    <button
                      type="button"
                      onClick={handlePortalLogout}
                      className="inline-flex items-center gap-2 rounded-md bg-amber-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700"
                    >
                      <FaSignOutAlt />
                      Logout Portal
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleDashboardLogoutOnly}
                      className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
                    >
                      <FaSignOutAlt />
                      Logout Dashboard
                    </button>
                    <button
                      type="button"
                      onClick={handlePortalLogout}
                      className="inline-flex items-center gap-2 rounded-md bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700"
                    >
                      <FaSignOutAlt />
                      Logout Portal
                    </button>
                  </>
                )}
              </>
            )}

            {isPortalArea && (
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(true)}
                className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                <FaSignOutAlt />
                Logout
              </button>
            )}
          </div>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-gray-200 text-gray-700 md:hidden"
            onClick={() => setIsMenuOpen((value) => !value)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="border-t border-gray-200 py-3 md:hidden">
            <div className="grid gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavButton
                    key={item.id}
                    active={activeSection === item.id}
                    onClick={() => scrollToSection(item.id)}
                    className="justify-start"
                  >
                    <Icon className="text-xs" />
                    {item.label}
                  </NavButton>
                );
              })}
              {isPortalArea && (
                <Link to="/jobs" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-gray-600">
                  <FaBriefcase className="text-xs" />
                  Jobs
                </Link>
              )}
              <button
                type="button"
                onClick={() => setDarkMode((value) => !value)}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold text-gray-600"
              >
                {darkMode ? <FaSun /> : <FaMoon />}
                {darkMode ? 'Light mode' : 'Dark mode'}
              </button>
              {isDashboardArea && isAuthenticated && (
                <>
                  {isSuperAdmin ? (
                    <>
                      <button
                        type="button"
                        onClick={handleDashboardLogoutOnly}
                        className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold text-red-600"
                      >
                        <FaSignOutAlt />
                        Logout Super Admin
                      </button>
                      <button
                        type="button"
                        onClick={handleLogoutNormalDashboardAdmins}
                        className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold text-red-600"
                      >
                        <FaSignOutAlt />
                        Logout Dashboard
                      </button>
                      <button
                        type="button"
                        onClick={handlePortalLogout}
                        className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold text-red-600"
                      >
                        <FaSignOutAlt />
                        Logout Portal
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleDashboardLogoutOnly}
                        className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold text-red-600"
                      >
                        <FaSignOutAlt />
                        Logout Dashboard
                      </button>
                      <button
                        type="button"
                        onClick={handlePortalLogout}
                        className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold text-red-600"
                      >
                        <FaSignOutAlt />
                        Logout Portal
                      </button>
                    </>
                  )}
                </>
              )}
              {isPortalArea && (
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(true)}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold text-red-600"
                >
                  <FaSignOutAlt />
                  Logout
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
            <div className="border-b border-gray-200 px-5 py-4">
              <h2 className="text-lg font-bold text-gray-950">Log out of portal?</h2>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                This ends the current portal session on this browser.
              </p>
            </div>
            <div className="flex flex-col-reverse gap-3 px-5 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="rounded-md border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePortalLogout}
                className="rounded-md bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
