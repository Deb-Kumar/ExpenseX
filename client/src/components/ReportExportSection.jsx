import React, { useState, useMemo } from 'react';
import {
  Download,
  FileText,
  FileSpreadsheet,
  Filter,
  Calendar,
  CreditCard,
  Tag,
  Search,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { getCategoriesByType } from '../utils/categories';
import { exportToPDF, exportToExcel } from '../utils/exportReport';
import { fetchTransactionsApi } from '../services/api';
import { useToast } from '../context/ToastContext';

const PAYMENT_METHODS = ['All Methods', 'UPI', 'Cash', 'Card', 'Net Banking', 'Other'];

// Helper to compute date range strings based on preset
const getDateRangeFromPreset = (preset) => {
  const now = new Date();
  const formatYMD = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  switch (preset) {
    case 'this_month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { startDate: formatYMD(start), endDate: formatYMD(end) };
    }
    case 'last_month': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { startDate: formatYMD(start), endDate: formatYMD(end) };
    }
    case 'last_3_months': {
      const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { startDate: formatYMD(start), endDate: formatYMD(end) };
    }
    case 'last_6_months': {
      const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { startDate: formatYMD(start), endDate: formatYMD(end) };
    }
    case 'this_year': {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31);
      return { startDate: formatYMD(start), endDate: formatYMD(end) };
    }
    case 'all':
    default:
      return { startDate: '', endDate: '' };
  }
};

export default function ReportExportSection({ allTransactions = [], user = {}, currency = '₹' }) {
  const toast = useToast();

  // Filter States
  const [datePreset, setDatePreset] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [type, setType] = useState('all'); // 'all' | 'income' | 'expense'
  const [category, setCategory] = useState('All Categories');
  const [paymentMethod, setPaymentMethod] = useState('All Methods');
  const [search, setSearch] = useState('');

  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);

  // Available categories based on current type
  const availableCategories = useMemo(() => {
    return getCategoriesByType(type);
  }, [type]);

  // Compute effective date range
  const { effectiveStartDate, effectiveEndDate, dateRangeLabel } = useMemo(() => {
    if (datePreset === 'custom') {
      const label =
        customStartDate || customEndDate
          ? `${customStartDate || 'Beginning'} → ${customEndDate || 'Present'}`
          : 'Custom Range (Unspecified)';
      return {
        effectiveStartDate: customStartDate,
        effectiveEndDate: customEndDate,
        dateRangeLabel: label,
      };
    }

    const { startDate, endDate } = getDateRangeFromPreset(datePreset);
    let label = 'All Time';
    if (datePreset === 'this_month') label = 'This Month';
    else if (datePreset === 'last_month') label = 'Last Month';
    else if (datePreset === 'last_3_months') label = 'Last 3 Months';
    else if (datePreset === 'last_6_months') label = 'Last 6 Months';
    else if (datePreset === 'this_year') label = 'This Year';

    return {
      effectiveStartDate: startDate,
      effectiveEndDate: endDate,
      dateRangeLabel: label,
    };
  }, [datePreset, customStartDate, customEndDate]);

  // Reset category if not in available list
  const handleTypeChange = (newType) => {
    setType(newType);
    setCategory('All Categories');
  };

  // Reset all filters to default
  const handleResetFilters = () => {
    setDatePreset('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setType('all');
    setCategory('All Categories');
    setPaymentMethod('All Methods');
    setSearch('');
  };

  const isFiltered =
    datePreset !== 'all' ||
    customStartDate !== '' ||
    customEndDate !== '' ||
    type !== 'all' ||
    category !== 'All Categories' ||
    paymentMethod !== 'All Methods' ||
    search.trim() !== '';

  // Local filtered transactions preview
  const filteredPreviewList = useMemo(() => {
    return allTransactions.filter((tx) => {
      // Type filter
      if (type !== 'all' && tx.type !== type) return false;

      // Category filter
      if (category !== 'All Categories' && tx.category !== category) return false;

      // Payment method filter
      if (paymentMethod !== 'All Methods' && (tx.paymentMethod || 'Cash') !== paymentMethod)
        return false;

      // Date range filter
      if (effectiveStartDate) {
        const txDate = new Date(tx.date);
        const start = new Date(effectiveStartDate);
        if (txDate < start) return false;
      }
      if (effectiveEndDate) {
        const txDate = new Date(tx.date);
        const end = new Date(effectiveEndDate);
        end.setHours(23, 59, 59, 999);
        if (txDate > end) return false;
      }

      // Search keyword
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const titleMatch = (tx.title || '').toLowerCase().includes(q);
        const descMatch = (tx.description || '').toLowerCase().includes(q);
        const catMatch = (tx.category || '').toLowerCase().includes(q);
        const noteMatch = (tx.notes || '').toLowerCase().includes(q);
        if (!titleMatch && !descMatch && !catMatch && !noteMatch) return false;
      }

      return true;
    });
  }, [
    allTransactions,
    type,
    category,
    paymentMethod,
    effectiveStartDate,
    effectiveEndDate,
    search,
  ]);

  // Summary for filtered list
  const filteredSummary = useMemo(() => {
    let totalInflow = 0;
    let totalOutflow = 0;

    filteredPreviewList.forEach((t) => {
      const amt = Number(t.amount || 0);
      if (t.type === 'income') totalInflow += amt;
      else if (t.type === 'expense') totalOutflow += amt;
    });

    return {
      totalInflow,
      totalOutflow,
      netFlow: totalInflow - totalOutflow,
      count: filteredPreviewList.length,
    };
  }, [filteredPreviewList]);

  // Construct condition information for statement metadata
  const getFilterInfo = () => {
    return {
      dateRangeLabel,
      typeLabel:
        type === 'income'
          ? 'Income Inflow Only'
          : type === 'expense'
          ? 'Expenses Outflow Only'
          : 'All Transaction Types',
      categoryLabel: category,
      paymentMethodLabel: paymentMethod,
      searchQuery: search.trim() || undefined,
    };
  };

  // Helper to fetch complete dataset from server matching conditions if user has more transactions
  const fetchFullExportData = async () => {
    try {
      const params = {
        limit: 2000,
        ...(type !== 'all' && { type }),
        ...(category !== 'All Categories' && { category }),
        ...(paymentMethod !== 'All Methods' && { paymentMethod }),
        ...(effectiveStartDate && { startDate: effectiveStartDate }),
        ...(effectiveEndDate && { endDate: effectiveEndDate }),
        ...(search.trim() && { search: search.trim() }),
      };
      const res = await fetchTransactionsApi(params);
      if (res?.transactions?.length) {
        return res.transactions;
      }
      return filteredPreviewList;
    } catch {
      // Fallback to locally filtered list
      return filteredPreviewList;
    }
  };

  // Handler for PDF download
  const handleDownloadPDF = async () => {
    if (filteredPreviewList.length === 0) {
      toast?.showToast?.({
        type: 'warning',
        title: 'No Transactions',
        message: 'No transactions match the selected filters to export.',
      });
      return;
    }

    setDownloadingPDF(true);
    try {
      const exportList = await fetchFullExportData();
      const info = getFilterInfo();

      let inflow = 0;
      let outflow = 0;
      exportList.forEach((t) => {
        const a = Number(t.amount || 0);
        if (t.type === 'income') inflow += a;
        else outflow += a;
      });

      exportToPDF({
        transactions: exportList,
        filterInfo: info,
        summary: { totalInflow: inflow, totalOutflow: outflow },
        user,
        currency,
      });

      toast?.success?.('PDF statement downloaded successfully!', 'Export Complete');
    } catch (err) {
      toast?.showToast?.({
        type: 'error',
        title: 'Export Failed',
        message: err.message || 'Failed to generate PDF report',
      });
    } finally {
      setDownloadingPDF(false);
    }
  };

  // Handler for Excel download
  const handleDownloadExcel = async () => {
    if (filteredPreviewList.length === 0) {
      toast?.showToast?.({
        type: 'warning',
        title: 'No Transactions',
        message: 'No transactions match the selected filters to export.',
      });
      return;
    }

    setDownloadingExcel(true);
    try {
      const exportList = await fetchFullExportData();
      const info = getFilterInfo();

      let inflow = 0;
      let outflow = 0;
      exportList.forEach((t) => {
        const a = Number(t.amount || 0);
        if (t.type === 'income') inflow += a;
        else outflow += a;
      });

      exportToExcel({
        transactions: exportList,
        filterInfo: info,
        summary: { totalInflow: inflow, totalOutflow: outflow },
        user,
        currency,
      });

      toast?.success?.('Excel spreadsheet (.xlsx) downloaded successfully!', 'Export Complete');
    } catch (err) {
      toast?.showToast?.({
        type: 'error',
        title: 'Export Failed',
        message: err.message || 'Failed to generate Excel report',
      });
    } finally {
      setDownloadingExcel(false);
    }
  };

  return (
    <div className="glass-panel p-6 sm:p-8 rounded-3xl relative overflow-hidden border border-white/10 shadow-2xl space-y-6">
      {/* Ambient background glow */}
      <div className="absolute -top-24 -left-24 w-80 h-80 bg-gradient-to-br from-brand-600/15 via-indigo-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-gradient-to-tl from-emerald-600/10 via-teal-600/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Card Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10 border-b border-white/10 pb-5">
        <div className="flex items-start gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-violet-600 text-white shadow-lg shadow-brand-500/20 shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-white tracking-tight">
                Export Financial Statement & Reports
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-brand-500/15 text-brand-300 border border-brand-500/30">
                PDF & Excel
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Download complete transaction records with custom conditions, date ranges, and formatted balance summaries.
            </p>
          </div>
        </div>

        {/* Right Header Actions: Reset Filters button */}
        {isFiltered && (
          <button
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-all self-start md:self-center"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* Filter Controls Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        {/* 1. Timeframe / Date Range */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-brand-400" />
            <span>Timeframe / Range</span>
          </label>
          <select
            value={datePreset}
            onChange={(e) => setDatePreset(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-xs font-medium text-slate-200 focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 cursor-pointer"
          >
            <option value="all">All Time</option>
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="last_3_months">Last 3 Months</option>
            <option value="last_6_months">Last 6 Months</option>
            <option value="this_year">This Year</option>
            <option value="custom">Custom Date Range...</option>
          </select>
        </div>

        {/* 2. Transaction Type */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-indigo-400" />
            <span>Transaction Type</span>
          </label>
          <select
            value={type}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-xs font-medium text-slate-200 focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 cursor-pointer"
          >
            <option value="all">All Types (Income & Expenses)</option>
            <option value="income">Income Inflow Only (+)</option>
            <option value="expense">Expenses Outflow Only (-)</option>
          </select>
        </div>

        {/* 3. Category */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-emerald-400" />
            <span>Category</span>
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-xs font-medium text-slate-200 focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 cursor-pointer"
          >
            {availableCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* 4. Payment Method */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-amber-400" />
            <span>Payment Method</span>
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-xs font-medium text-slate-200 focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 cursor-pointer"
          >
            {PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Optional Custom Date Range Row (Shown when 'custom' is selected) */}
      {datePreset === 'custom' && (
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in zoom-in-95 duration-150 relative z-10">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">
              Start Date (From)
            </label>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-brand-400"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">
              End Date (To)
            </label>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-brand-400"
            />
          </div>
        </div>
      )}

      {/* Search Input Filter */}
      <div className="relative z-10">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Filter by keyword (description, merchant, notes)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/60 border border-white/10 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-white/10"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Live Preview Metrics & Condition Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#090e1a]/80 border border-white/10 relative z-10 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
            <span className="font-semibold text-white">
              Export Match Preview:
            </span>
            <span className="px-2 py-0.5 rounded-md bg-white/10 text-white font-bold text-[11px]">
              {filteredSummary.count} {filteredSummary.count === 1 ? 'transaction' : 'transactions'}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-emerald-400">
              +{currency} {filteredSummary.totalInflow.toLocaleString()}
            </span>
            <span className="text-rose-400">
              -{currency} {filteredSummary.totalOutflow.toLocaleString()}
            </span>
            <span
              className={`font-bold px-2 py-0.5 rounded-md border ${
                filteredSummary.netFlow >= 0
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
              }`}
            >
              Net: {filteredSummary.netFlow >= 0 ? '+' : ''}
              {currency} {filteredSummary.netFlow.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Applied Condition Tags */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5 text-[11px]">
          <span className="text-slate-400 font-medium">Applied Statement Conditions:</span>
          <span className="px-2.5 py-0.5 rounded-md bg-brand-500/10 text-brand-300 border border-brand-500/20 font-medium">
            📅 {dateRangeLabel}
          </span>
          <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium">
            ⚡ {type === 'all' ? 'All Types' : type === 'income' ? 'Income (+)' : 'Expense (-)'}
          </span>
          <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium">
            🏷️ {category}
          </span>
          <span className="px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
            💳 {paymentMethod}
          </span>
          {search.trim() && (
            <span className="px-2.5 py-0.5 rounded-md bg-violet-500/10 text-violet-300 border border-violet-500/20 font-medium">
              🔍 "{search.trim()}"
            </span>
          )}
        </div>
      </div>

      {/* Action Download Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2 relative z-10">
        {/* Download PDF Button */}
        <button
          onClick={handleDownloadPDF}
          disabled={downloadingPDF || downloadingExcel || filteredSummary.count === 0}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-violet-600 hover:from-brand-500 hover:to-violet-500 text-white text-xs font-bold shadow-lg shadow-brand-500/25 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
        >
          {downloadingPDF ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : (
            <FileText className="w-4 h-4 text-brand-200 group-hover:scale-110 transition-transform" />
          )}
          <span>Download PDF Report</span>
          <span className="ml-1 text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-white/20 text-white">
            PDF
          </span>
        </button>

        {/* Download Excel (.xlsx) Button */}
        <button
          onClick={handleDownloadExcel}
          disabled={downloadingPDF || downloadingExcel || filteredSummary.count === 0}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
        >
          {downloadingExcel ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : (
            <FileSpreadsheet className="w-4 h-4 text-emerald-200 group-hover:scale-110 transition-transform" />
          )}
          <span>Download Excel (.xlsx)</span>
          <span className="ml-1 text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-white/20 text-white">
            XLSX
          </span>
        </button>
      </div>
    </div>
  );
}
