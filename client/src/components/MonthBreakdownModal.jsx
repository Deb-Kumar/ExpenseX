import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Calendar,
  ArrowDownLeft,
  ArrowUpRight,
  ExternalLink,
  Loader2,
  AlertCircle,
  Receipt,
  Wallet,
} from 'lucide-react';
import { fetchTransactionsApi } from '../services/api';

// Helper to convert "Sep 2026" to YYYY-MM-DD range
export const parseMonthKeyToDateRange = (monthKey) => {
  if (!monthKey) return { startDate: '', endDate: '' };
  const parts = monthKey.trim().split(' ');
  if (parts.length < 2) return { startDate: '', endDate: '' };

  const [monStr, yearStr] = parts;
  const year = parseInt(yearStr, 10);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthIndex = months.indexOf(monStr);
  if (monthIndex === -1 || isNaN(year)) return { startDate: '', endDate: '' };

  const start = new Date(year, monthIndex, 1);
  const end = new Date(year, monthIndex + 1, 0);

  const formatDate = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  return {
    startDate: formatDate(start),
    endDate: formatDate(end),
  };
};

export default function MonthBreakdownModal({ isOpen, onClose, monthData, currency = '₹' }) {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(monthData?.type || 'all');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const monthLabel = monthData?.month || '';
  const dateRange = parseMonthKeyToDateRange(monthLabel);

  // Sync tab whenever modal opens with a new monthData
  useEffect(() => {
    if (isOpen && monthData) {
      setActiveTab(monthData.type && monthData.type !== 'all' ? monthData.type : 'all');
    }
  }, [isOpen, monthData]);

  // Fetch transactions for that month
  useEffect(() => {
    if (isOpen && monthLabel) {
      setLoading(true);
      setError('');

      fetchTransactionsApi({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        limit: 150,
      })
        .then((data) => {
          setTransactions(data.transactions || []);
        })
        .catch((err) => {
          setError(err.response?.data?.message || err.message || 'Failed to fetch transactions');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, monthLabel]);

  if (!isOpen || !monthData) return null;

  // Filter transactions by selected tab
  const filteredTransactions = transactions.filter((tx) => {
    if (activeTab === 'all') return true;
    return tx.type === activeTab;
  });

  const totalInflow = transactions
    .filter((t) => t.type === 'income')
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  const totalOutflow = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  const netBalance = totalInflow - totalOutflow;

  // Navigate to full transactions page with pre-set filters
  const handleOpenFullPage = () => {
    const params = new URLSearchParams();
    if (activeTab !== 'all') params.set('type', activeTab);
    if (dateRange.startDate) params.set('startDate', dateRange.startDate);
    if (dateRange.endDate) params.set('endDate', dateRange.endDate);

    onClose();
    navigate(`/transactions?${params.toString()}`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-[#0f172a] border border-white/10 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-brand-900/40 via-indigo-950/40 to-slate-900 border-b border-white/5 flex items-center justify-between shrink-0 relative overflow-hidden">
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-2xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 shadow-md shadow-brand-500/10">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-white tracking-tight">
                  {monthLabel} Breakdown
                </h2>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                    netBalance >= 0
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                  }`}
                >
                  {netBalance >= 0 ? 'Net Surplus' : 'Net Deficit'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Detailed transaction records for {monthLabel}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 active:scale-95 transition-all cursor-pointer relative z-10"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Summary Chips Bar */}
        <div className="p-4 sm:px-6 bg-slate-950/40 border-b border-white/5 grid grid-cols-3 gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('income')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              activeTab === 'income'
                ? 'bg-emerald-500/20 border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                : 'bg-slate-900/60 border-white/5 hover:border-emerald-500/30'
            }`}
          >
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Inflow
            </span>
            <span className="text-xs sm:text-sm font-extrabold text-emerald-400 font-mono">
              +{currency} {totalInflow.toLocaleString()}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('expense')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              activeTab === 'expense'
                ? 'bg-rose-500/20 border-rose-500/40 shadow-sm shadow-rose-500/20'
                : 'bg-slate-900/60 border-white/5 hover:border-rose-500/30'
            }`}
          >
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Outflow
            </span>
            <span className="text-xs sm:text-sm font-extrabold text-rose-400 font-mono">
              -{currency} {totalOutflow.toLocaleString()}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-brand-500/20 border-brand-500/40 shadow-sm shadow-brand-500/20'
                : 'bg-slate-900/60 border-white/5 hover:border-brand-500/30'
            }`}
          >
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Net Balance
            </span>
            <span
              className={`text-xs sm:text-sm font-extrabold font-mono ${
                netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {netBalance >= 0 ? '+' : ''}
              {currency} {netBalance.toLocaleString()}
            </span>
          </button>
        </div>

        {/* Tab Filters */}
        <div className="px-5 sm:px-6 pt-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/60 border border-white/5">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({transactions.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('income')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'income'
                  ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Income ({transactions.filter((t) => t.type === 'income').length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('expense')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'expense'
                  ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Expenses ({transactions.filter((t) => t.type === 'expense').length})
            </button>
          </div>

          <button
            type="button"
            onClick={handleOpenFullPage}
            className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-brand-400 hover:text-brand-300 transition-colors cursor-pointer"
          >
            <span>Open in Full Table</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Scrollable Transaction List */}
        <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-2.5">
          {error && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-7 h-7 text-brand-400 animate-spin" />
              <p className="text-xs">Loading {monthLabel} transactions...</p>
            </div>
          ) : filteredTransactions.length > 0 ? (
            <div className="space-y-2">
              {filteredTransactions.map((tx) => (
                <div
                  key={tx._id}
                  className="p-3 rounded-xl bg-slate-900/80 border border-white/5 hover:border-white/10 flex items-center justify-between gap-3 transition-colors shadow-inner"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        tx.type === 'income'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {tx.type === 'income' ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">
                        {tx.description || tx.category}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span>{tx.category}</span>
                        <span>&bull;</span>
                        <span>{new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        {tx.paymentMethod && (
                          <>
                            <span>&bull;</span>
                            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-950/60 border border-white/5">
                              {tx.paymentMethod}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`font-mono text-xs font-extrabold shrink-0 ${
                      tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : '-'}
                    {currency} {Number(tx.amount).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-500">
              <Receipt className="w-8 h-8 text-slate-600" />
              <p className="text-xs font-medium">
                No {activeTab !== 'all' ? activeTab : ''} transactions recorded for {monthLabel}.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:px-6 bg-slate-950/60 border-t border-white/5 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-400">
            Showing <span className="text-white font-bold">{filteredTransactions.length}</span> records
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleOpenFullPage}
              className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs shadow-md shadow-brand-500/20 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <span>View Full Table</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
