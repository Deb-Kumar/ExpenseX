import React, { useState, useEffect } from 'react';
import { X, ArrowDownLeft, ArrowUpRight, Loader2, AlertCircle, AlertTriangle, Wallet } from 'lucide-react';
import { createTransactionApi, updateTransactionApi, fetchSummaryApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getCurrencySymbol } from '../utils/currency';
import ConfirmModal from './ConfirmModal';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../utils/categories';

const PAYMENT_METHODS = ['UPI', 'Cash', 'Card', 'Net Banking', 'Other'];

export default function TransactionModal({ isOpen, onClose, onSuccess, initialData = null }) {
  const { user } = useAuth();
  const toast = useToast();
  const currency = getCurrencySymbol(user?.currency);

  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmUpdate, setShowConfirmUpdate] = useState(false);
  const [netBalance, setNetBalance] = useState(null);

  const isEditing = Boolean(initialData?._id);

  // Fetch current net balance whenever modal opens
  useEffect(() => {
    if (isOpen) {
      fetchSummaryApi()
        .then((data) => {
          setNetBalance(data.summary?.netBalance ?? 0);
        })
        .catch(() => {
          setNetBalance(0);
        });
    }
  }, [isOpen]);

  // Sync state if editing
  useEffect(() => {
    if (initialData) {
      setType(initialData.type || 'expense');
      setAmount(initialData.amount || '');
      setCategory(initialData.category || EXPENSE_CATEGORIES[0]);
      setDescription(initialData.description || '');
      setPaymentMethod(initialData.paymentMethod || 'UPI');
      setDate(
        initialData.date
          ? new Date(initialData.date).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]
      );
    } else {
      setType('expense');
      setAmount('');
      setCategory(EXPENSE_CATEGORIES[0]);
      setDescription('');
      setPaymentMethod('UPI');
      setDate(new Date().toISOString().split('T')[0]);
    }
    setError('');
  }, [initialData, isOpen]);

  // Handle type change and update default category
  const handleTypeChange = (newType) => {
    setType(newType);
    setCategory(newType === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
    setError('');
  };

  // Compute available balance for expense
  const availableBalance = (() => {
    if (netBalance === null) return null;
    if (!isEditing) return netBalance;
    if (initialData?.type === 'expense') {
      return netBalance + Number(initialData.amount || 0);
    }
    return netBalance - Number(initialData.amount || 0);
  })();

  const numAmount = Number(amount) || 0;
  const isExpenseExceeded =
    type === 'expense' &&
    availableBalance !== null &&
    (availableBalance <= 0 || (numAmount > 0 && numAmount > availableBalance));

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      setError('Please enter a valid amount greater than zero');
      return;
    }

    if (type === 'expense' && availableBalance !== null) {
      if (availableBalance <= 0) {
        const msg = `Insufficient balance! Your current net balance is ${currency} 0. Please add income first before recording an expense.`;
        setError(msg);
        toast.error(msg, 'Insufficient Balance');
        return;
      }
      if (numAmount > availableBalance) {
        const msg = `Insufficient balance! Your available balance is ${currency} ${availableBalance.toLocaleString()}, but this expense is ${currency} ${numAmount.toLocaleString()}.`;
        setError(msg);
        toast.error(msg, 'Expense Exceeds Balance');
        return;
      }
    }

    if (isEditing) {
      setShowConfirmUpdate(true);
      return;
    }

    performSave();
  };

  const performSave = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = {
        type,
        amount: Number(amount),
        category,
        description,
        paymentMethod,
        date: new Date(date).toISOString(),
      };

      if (isEditing) {
        await updateTransactionApi(initialData._id, payload);
        toast.success(`Updated ${type} of ${currency} ${Number(amount).toLocaleString()} (${category})`, 'Transaction Updated');
      } else {
        await createTransactionApi(payload);
        toast.success(`Added ${type} of ${currency} ${Number(amount).toLocaleString()} in ${category}`, 'Transaction Created');
      }

      setShowConfirmUpdate(false);
      onSuccess?.();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to save transaction';
      setError(msg);
      toast.error(msg, 'Transaction Failed');
      setShowConfirmUpdate(false);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentCategories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-slate-900/60">
          <h2 className="text-base font-bold text-white">
            {isEditing ? 'Edit Transaction' : 'Add New Transaction'}
          </h2>
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
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Type Toggle: Income vs Expense */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              TRANSACTION TYPE
            </label>
            <div className="grid grid-cols-2 gap-3 p-1 rounded-xl bg-slate-950/60 border border-white/5">
              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                  type === 'expense'
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Expense</span>
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('income')}
                className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                  type === 'income'
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ArrowDownLeft className="w-3.5 h-3.5" />
                <span>Income</span>
              </button>
            </div>
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-400">
                  AMOUNT ({currency}) *
                </label>
                {type === 'expense' && availableBalance !== null && (
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border transition-colors ${
                      availableBalance <= 0
                        ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                        : numAmount > availableBalance
                        ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                        : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                    }`}
                  >
                    <Wallet className="w-3 h-3" />
                    <span>Balance: {currency} {availableBalance <= 0 ? 0 : availableBalance.toLocaleString()}</span>
                  </span>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                  {currency}
                </span>
                <input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={`w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-900 border text-white text-sm focus:outline-none transition-all ${
                    isExpenseExceeded
                      ? 'border-rose-500/60 focus:border-rose-400 focus:ring-1 focus:ring-rose-400'
                      : 'border-white/10 focus:border-brand-400 focus:ring-1 focus:ring-brand-400'
                  }`}
                />
              </div>

              {type === 'expense' && availableBalance !== null && availableBalance <= 0 && (
                <p className="text-[11px] text-rose-400 flex items-center gap-1.5 pt-1.5 animate-in fade-in">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                  <span>Net balance is {currency} 0. Add income first.</span>
                </p>
              )}

              {type === 'expense' && availableBalance !== null && availableBalance > 0 && numAmount > availableBalance && (
                <p className="text-[11px] text-rose-400 flex items-center gap-1.5 pt-1.5 animate-in fade-in">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                  <span>Exceeds balance by {currency} {(numAmount - availableBalance).toLocaleString()}!</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                DATE *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
              />
            </div>
          </div>

          {/* Category & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                CATEGORY *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
              >
                {currentCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                PAYMENT METHOD
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              DESCRIPTION / NOTE
            </label>
            <input
              type="text"
              placeholder="e.g., Grocery shopping at Walmart, Freelance invoice #104"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || isExpenseExceeded}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                type === 'expense'
                  ? isExpenseExceeded
                    ? 'bg-rose-900/60 text-rose-300 border border-rose-500/30 shadow-none'
                    : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/25'
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/25'
              }`}
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>
                {isExpenseExceeded
                  ? availableBalance <= 0
                    ? 'No Balance Available'
                    : 'Expense Exceeds Balance'
                  : isEditing
                  ? 'Update Transaction'
                  : 'Save Transaction'}
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* Confirmation Modal when Updating Transaction */}
      {showConfirmUpdate && (
        <ConfirmModal
          isOpen={showConfirmUpdate}
          onClose={() => setShowConfirmUpdate(false)}
          onConfirm={performSave}
          title="Confirm Transaction Update"
          message={`Are you sure you want to update this transaction? The details will be modified to ${type === 'income' ? '+' : '-'}${currency} ${Number(amount).toLocaleString()} (${category}).`}
          confirmText="Yes, Update"
          cancelText="Keep Editing"
          type="warning"
        />
      )}
    </div>
  );
}
