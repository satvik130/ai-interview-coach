import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Reusable navigation bar for AI Interview Coach
 * Adapts links based on authentication state
 */
const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <Link to="/dashboard" className="flex items-center space-x-3 group">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm group-hover:bg-indigo-700 transition">
              AI
            </div>
            <div>
              <span className="font-semibold text-slate-900 text-lg tracking-tight">
                AI Interview Coach
              </span>
              <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Beta
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-1 sm:space-x-3">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                    isActive('/dashboard')
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Dashboard
                </Link>

                {/* User badge */}
                <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span>{user?.name || 'User'}</span>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                    isActive('/login')
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Login
                </Link>

                <Link
                  to="/register"
                  className="px-4 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-sm"
                >
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
