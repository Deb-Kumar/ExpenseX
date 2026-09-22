import React, { useState } from 'react';
import { X, Target, Loader2, AlertCircle } from 'lucide-react';
import { saveBudgetApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getCurrencySymbol } from '../utils/currency';

import { EXPENSE_CATEGORIES as BUDGET_CATEGORIES } from '../utils/categories';

export default function BudgetModal({ isOpen, onClose, onSuccess, initialCategory = '', currentMonth, currentYear }) {
  const { user } = useAuth();
  const toast = useToast();
  const currency = getCurrencySymbol(user?.currency);

  const [category, setCategory] = useState(initialCategory || BUDGET_CATEGORIES[0]);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const now = new Date();
  const targetMonth = currentMonth || now.getMonth() + 1;
  const targetYear = currentYear || now.getFullYear();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      setError('Please provide a valid budget limit greater than 0');
      return;
    }

    setLoading(true);
    try {
      await saveBudgetApi({
        category,
        amount: Number(amount),
        month: targetMonth,
        year: targetYear,
      });

      toast.success(`Budget for ${category} set to ${currency} ${Number(amount).toLocaleString()}`, 'Budget Saved');
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to save budget limit';
      setError(msg);
      toast.error(msg, 'Budget Error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-slate-900/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-white">Set Monthly Budget</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              CATEGORY *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
            >
              {BUDGET_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              MONTHLY LIMIT ({currency}) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                {currency}
              </span>
              <input
                type="number"
                step="any"
                placeholder="e.g., 5000"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 text-xs text-slate-400">
            Targeting: <strong className="text-slate-200">Month {targetMonth}, {targetYear}</strong>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 shadow-lg shadow-brand-600/25 active:scale-95 transition-all"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Save Budget Limit</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
