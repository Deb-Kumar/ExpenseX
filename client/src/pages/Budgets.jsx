import React, { useState, useEffect } from 'react';
import {
  Target,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Loader2,
  AlertCircle,
  TrendingDown,
  Calendar,
} from 'lucide-react';
import { fetchBudgetsApi, deleteBudgetApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getCurrencySymbol } from '../utils/currency';
import BudgetModal from '../components/BudgetModal';
import ConfirmModal from '../components/ConfirmModal';
import Loader from '../components/Loader';

export default function Budgets() {
  const { user } = useAuth();
  const toast = useToast();
  const currency = getCurrencySymbol(user?.currency);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [budgetData, setBudgetData] = useState({ budgets: [], totalBudgeted: 0, totalMonthlySpend: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState(null);

  const loadBudgets = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchBudgetsApi({ month: selectedMonth, year: selectedYear });
      setBudgetData(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load budgets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBudgets();
  }, [selectedMonth, selectedYear]);

  const handleDeleteBudget = async () => {
    if (!budgetToDelete) return;
    try {
      await deleteBudgetApi(budgetToDelete._id);
      toast.success(`Budget for ${budgetToDelete.category} deleted`, 'Budget Removed');
      setBudgetToDelete(null);
      loadBudgets();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete budget';
      toast.error(msg, 'Delete Error');
      setBudgetToDelete(null);
    }
  };

  const totalBudgeted = budgetData.totalBudgeted || 0;
  const totalSpend = budgetData.totalMonthlySpend || 0;
  const totalRemaining = totalBudgeted - totalSpend;
  const overallPercentage = totalBudgeted > 0 ? Math.round((totalSpend / totalBudgeted) * 100) : 0;

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header & Month Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Monthly Budgets
          </h1>
          <p className="text-xs text-slate-400">
            Establish spending caps for categories and monitor real-time limits.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* Month Dropdown */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-brand-400"
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          {/* Year Dropdown */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-brand-400"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-600/25 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Set Budget</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Monthly Aggregate Usage Banner */}
      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Budgeted
            </span>
            <div className="text-2xl font-extrabold text-white mt-1">
              {currency} {totalBudgeted.toLocaleString()}
            </div>
            <p className="text-xs text-slate-400 mt-1">For {months.find(m => m.value === selectedMonth)?.label} {selectedYear}</p>
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Actual Expenses
            </span>
            <div className="text-2xl font-extrabold text-rose-400 mt-1">
              {currency} {totalSpend.toLocaleString()}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {overallPercentage}% of monthly budget consumed
            </p>
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Remaining Cushion
            </span>
            <div
              className={`text-2xl font-extrabold mt-1 ${
                totalRemaining >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {currency} {Math.abs(totalRemaining).toLocaleString()}{' '}
              {totalRemaining < 0 && '(Over)'}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {totalRemaining >= 0 ? 'Available to spend safely' : 'Exceeded allocated budget limit'}
            </p>
          </div>
        </div>

        {/* Overall Meter */}
        <div className="w-full h-3 rounded-full bg-slate-900 overflow-hidden border border-white/5">
          <div
            className={`h-full transition-all duration-700 rounded-full ${
              overallPercentage > 100
                ? 'bg-rose-500'
                : overallPercentage >= 80
                ? 'bg-amber-400'
                : 'bg-emerald-400'
            }`}
            style={{ width: `${Math.min(overallPercentage, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Category Budgets Grid */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4">Category Budgets</h2>

        {loading ? (
          <div className="p-16 flex items-center justify-center">
            <Loader size="md" label="Loading budget allowances..." />
          </div>
        ) : budgetData.budgets && budgetData.budgets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {budgetData.budgets.map((b) => (
              <div
                key={b._id}
                className="glass-card p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-white tracking-tight">
                      {b.category}
                    </span>

                    <div className="flex items-center gap-2">
                      {b.isOverBudget ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/20">
                          <AlertTriangle className="w-3 h-3" /> Over Limit
                        </span>
                      ) : b.isWarning ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/20">
                          <AlertTriangle className="w-3 h-3" /> &gt;80% Used
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> On Track
                        </span>
                      )}

                      <button
                        onClick={() => setBudgetToDelete(b)}
                        className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                        title="Delete Budget"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-xs text-slate-400">Spent:</span>
                    <span className="text-base font-extrabold text-white">
                      {currency} {Number(b.spent).toLocaleString()}{' '}
                      <span className="text-xs text-slate-500 font-normal">
                        / {currency} {Number(b.amount).toLocaleString()}
                      </span>
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden mb-2">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        b.isOverBudget
                          ? 'bg-rose-500'
                          : b.isWarning
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                      }`}
                      style={{ width: `${Math.min(b.percentage, 100)}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">{b.percentage}% spent</span>
                    <span
                      className={`font-semibold ${
                        b.remaining >= 0 ? 'text-slate-300' : 'text-rose-400'
                      }`}
                    >
                      {b.remaining >= 0
                        ? `${currency} ${b.remaining.toLocaleString()} remaining`
                        : `${currency} ${Math.abs(b.remaining).toLocaleString()} over budget`}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-panel p-12 rounded-2xl text-center text-xs text-slate-500 space-y-3">
            <Target className="w-8 h-8 text-slate-600 mx-auto" />
            <p>No budgets set for {months.find(m => m.value === selectedMonth)?.label} {selectedYear}.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold transition-all"
            >
              Set First Budget Limit
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadBudgets}
        currentMonth={selectedMonth}
        currentYear={selectedYear}
      />

      {/* Delete Budget Confirm Modal */}
      {budgetToDelete && (
        <ConfirmModal
          isOpen={Boolean(budgetToDelete)}
          onClose={() => setBudgetToDelete(null)}
          onConfirm={handleDeleteBudget}
          title="Delete Budget Limit?"
          message={`Are you sure you want to delete the ${currency}${Number(budgetToDelete.amount).toLocaleString()} budget limit for ${budgetToDelete.category}?`}
          confirmText="Yes, Delete"
          cancelText="Keep Budget"
          type="danger"
        />
      )}
    </div>
  );
}
