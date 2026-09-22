import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Plus, ChevronDown, Check, Settings, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CURRENCIES, getCurrencyInfo } from '../utils/currency';
import ConfirmModal from './ConfirmModal';
import UserAvatar from './UserAvatar';

export default function Navbar({ onOpenSidebar, onOpenAddTransaction }) {
  const { user, updateCurrency, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const dropdownRef = useRef(null);
  const profileRef = useRef(null);

  const currencyInfo = getCurrencyInfo(user?.currency);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setCurrencyOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    toast.info('You have signed out successfully.', 'Signed Out');
    navigate('/login');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.name ? user.name.split(' ')[0] : 'there';

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#0a0f1d]/80 backdrop-blur-md border-b border-white/5 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
      {/* Left: Mobile hamburger & Greeting */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <img
          src="/logo-badge.png"
          alt="ExpenseX"
          className="w-7 h-7 object-contain rounded-lg lg:hidden shadow-sm shadow-black/30"
        />

        <div>
          <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-1.5">
            <span>{getGreeting()}, {firstName}</span>
            <span className="text-base">👋</span>
          </h1>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            Track, analyze and optimize your finances effortlessly
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Interactive Currency Badge & Selector */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setCurrencyOpen((prev) => !prev)}
            aria-label="Switch currency"
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-white/10 hover:border-brand-500/40 text-slate-300 hover:text-white shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer"
            title={`Current currency: ${currencyInfo.symbol} ${currencyInfo.code} (${currencyInfo.name}). Click to change.`}
          >
            <span className="w-5 h-5 rounded-md bg-brand-500/20 text-brand-300 flex items-center justify-center font-bold text-xs shadow-inner">
              {currencyInfo.symbol}
            </span>
            <span className="text-white font-bold tracking-wide">
              {currencyInfo.code}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                currencyOpen ? 'rotate-180 text-brand-400' : ''
              }`}
            />
          </button>

          {/* Currency Dropdown Menu */}
          {currencyOpen && (
            <div className="absolute right-0 mt-2 w-52 py-1.5 rounded-2xl bg-[#0f172a]/95 border border-white/10 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-white/5 flex items-center justify-between">
                <span>Select Currency</span>
                <span className="text-[9px] text-brand-400 lowercase font-normal">instant update</span>
              </div>
              <div className="py-1">
                {CURRENCIES.map((c) => {
                  const isSelected = currencyInfo.code === c.code;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => {
                        updateCurrency(c.symbol);
                        toast.success(`Currency switched to ${c.symbol} ${c.code} (${c.name})`, 'Currency Updated');
                        setCurrencyOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? 'text-brand-400 bg-brand-500/10 font-bold'
                          : 'text-slate-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-md bg-slate-800/90 border border-white/10 flex items-center justify-center font-bold text-xs text-white">
                          {c.symbol}
                        </span>
                        <div className="text-left">
                          <span className="font-bold text-white">{c.code}</span>
                          <span className="text-[11px] text-slate-400 ml-1.5">({c.name})</span>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-brand-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Quick Add Transaction Button */}
        <button
          onClick={onOpenAddTransaction}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-brand-500/25 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden xs:inline">Add Transaction</span>
          <span className="xs:hidden">Add</span>
        </button>

        {/* User Profile Avatar with Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileOpen((prev) => !prev)}
            className="relative flex items-center gap-1.5 p-0.5 rounded-full hover:ring-2 hover:ring-brand-500/50 transition-all cursor-pointer focus:outline-none"
            aria-label="User profile menu"
            aria-expanded={profileOpen}
          >
            <UserAvatar
              src={user?.profilePicture}
              name={user?.name}
              size="sm"
            />
            {!user?.hasPassword && (
              <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3" title="Action Required: Master Password Not Set">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 ring-2 ring-[#0a0f1d]"></span>
              </span>
            )}
          </button>

          {/* Profile Dropdown Menu */}
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#0f172a]/95 border border-white/10 shadow-2xl backdrop-blur-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Header Info */}
              <div className="p-4 border-b border-white/5 bg-slate-900/60 flex items-center gap-3">
                <UserAvatar
                  src={user?.profilePicture}
                  name={user?.name}
                  size="lg"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-white truncate">{user?.name || 'User'}</h4>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                  {!user?.hasPassword && (
                    <p className="text-[10px] text-rose-400 font-semibold pt-0.5 flex items-center gap-1">
                      <span>⚠️ Master password not set</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Menu Options */}
              <div className="p-2 space-y-1">
                {/* 1. Profile & Settings */}
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    navigate('/settings');
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-2.5">
                    <Settings className="w-4 h-4 text-brand-400" />
                    <span>Profile & Settings</span>
                  </div>
                  {!user?.hasPassword && (
                    <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                      Critical
                    </span>
                  )}
                </button>

                {/* 2. Log Out */}
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    setShowLogoutModal(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all cursor-pointer text-left"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sign Out Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        title="Sign Out of ExpenseX?"
        message="Are you sure you want to end your current session? You can easily sign back in anytime."
        confirmText="Yes, Sign Out"
        cancelText="Stay Logged In"
        type="logout"
      />
    </header>
  );
}
