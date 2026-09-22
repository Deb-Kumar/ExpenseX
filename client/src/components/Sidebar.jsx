import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Target,
  BarChart3,
  Settings,
  LogOut,
  X,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ConfirmModal from './ConfirmModal';
import UserAvatar from './UserAvatar';

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    logout();
    toast.info('You have signed out successfully.', 'Signed Out');
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Transactions', path: '/transactions', icon: ArrowLeftRight },
    { label: 'Budgets', path: '/budgets', icon: Target },
    { label: 'Reports', path: '/reports', icon: BarChart3 },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-64 bg-[#0d1326] border-r border-white/5 flex flex-col justify-between z-50 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand & Close */}
        <div>
          <div className="h-16 px-6 flex items-center justify-between border-b border-white/5">
            <NavLink to="/dashboard" className="flex items-center gap-3 group">
              <img
                src="/logo-badge.png"
                alt="ExpenseX Logo"
                className="w-9 h-9 object-contain rounded-xl shadow-md shadow-black/20 ring-1 ring-white/15 group-hover:scale-105 transition-transform duration-200"
              />
              <span className="text-xl font-extrabold tracking-tight text-white">
                Expense<span className="text-emerald-400">X</span>
              </span>
            </NavLink>

            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-brand-500/15 text-brand-300 font-semibold border border-brand-500/30 shadow-sm shadow-brand-500/10'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.label === 'Settings' && !user?.hasPassword && (
                    <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                      Critical
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-white/5 bg-slate-900/40">
          <div className="flex items-center gap-3 mb-3 p-2 rounded-xl bg-white/5">
            <UserAvatar
              src={user?.profilePicture}
              name={user?.name}
              size="md"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{user?.name || 'User'}</p>
              <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 active:scale-95 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Sign Out Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        title="Sign Out of ExpenseX?"
        message="Are you sure you want to end your current session? You can easily sign back in anytime with Google or your email."
        confirmText="Yes, Sign Out"
        cancelText="Stay Logged In"
        type="logout"
      />
    </>
  );
}
