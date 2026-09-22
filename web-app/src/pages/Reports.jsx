import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  PieChart,
  CreditCard,
  Percent,
  Calendar,
  Loader2,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import { fetchSummaryApi, fetchTransactionsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getCurrencySymbol } from '../utils/currency';
import Loader from '../components/Loader';
import ReportExportSection from '../components/ReportExportSection';

// Custom sleek Glassmorphism Chart Tooltip
const CustomChartTooltip = ({ active, payload, label, currency }) => {
  if (!active || !payload || !payload.length) return null;

  const incomeItem = payload.find((p) => p.dataKey === 'income');
  const expenseItem = payload.find((p) => p.dataKey === 'expense');

  const incomeVal = Number(incomeItem?.value || 0);
  const expenseVal = Number(expenseItem?.value || 0);
  const netVal = incomeVal - expenseVal;

  return (
    <div className="bg-[#0b1329]/95 backdrop-blur-md border border-white/15 p-3.5 rounded-2xl shadow-2xl space-y-2.5 min-w-[210px] animate-in fade-in zoom-in-95 duration-150">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <span className="text-xs font-bold text-white flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-brand-400" />
          {label}
        </span>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
            netVal >= 0
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
          }`}
        >
          {netVal >= 0 ? 'Surplus' : 'Deficit'}
        </span>
      </div>

      <div className="space-y-1.5 text-xs">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-xs shadow-emerald-400/50" />
            <span className="text-slate-400 font-medium">Total Inflow</span>
          </div>
          <span className="font-bold text-emerald-400 font-mono">
            +{currency} {incomeVal.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shadow-xs shadow-rose-400/50" />
            <span className="text-slate-400 font-medium">Total Outflow</span>
          </div>
          <span className="font-bold text-rose-400 font-mono">
            -{currency} {expenseVal.toLocaleString()}
          </span>
        </div>

        <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-4">
          <span className="text-[11px] font-semibold text-slate-400">Net Growth</span>
          <span
            className={`font-mono text-xs font-extrabold ${
              netVal >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {netVal >= 0 ? '+' : ''}
            {currency} {netVal.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default function Reports() {
  const { user } = useAuth();
  const currency = getCurrencySymbol(user?.currency);

  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadReports = async () => {
      setLoading(true);
      setError('');
      try {
        const [sumData, txData] = await Promise.all([
          fetchSummaryApi(),
          fetchTransactionsApi({ limit: 500 }),
        ]);
        setSummary(sumData.summary);
        setTransactions(txData.transactions || []);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load report data');
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, []);

  const totalIncome = summary?.totalIncome || 0;
  const totalExpense = summary?.totalExpense || 0;
  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.max(0, Math.round((netSavings / totalIncome) * 100)) : 0;
  const monthlyTrends = summary?.monthlyTrends || [];
  const categoryBreakdown = summary?.categoryBreakdown || [];

  // Payment methods calculation
  const paymentStats = {};
  transactions.forEach((tx) => {
    const method = tx.paymentMethod || 'Other';
    paymentStats[method] = (paymentStats[method] || 0) + Number(tx.amount);
  });

  const paymentBreakdown = Object.entries(paymentStats).map(([method, amount]) => ({
    method,
    amount,
  })).sort((a, b) => b.amount - a.amount);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader size="md" label="Compiling financial analytics and reports..." />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">
          Financial Reports & Analytics
        </h1>
        <p className="text-xs text-slate-400">
          In-depth insights into your saving habits, expense distributions, and payment flows.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* 4 Analytics KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Savings Rate */}
        <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase mb-3">
            <span>Savings Rate</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-400">{savingsRate}%</div>
          <p className="text-xs text-slate-400 mt-2">
            Of total earnings retained as net savings
          </p>
        </div>

        {/* Net Savings */}
        <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase mb-3">
            <span>Net Accumulated</span>
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">
            {currency} {netSavings.toLocaleString()}
          </div>
          <p className="text-xs text-slate-400 mt-2">Income minus total expenditure</p>
        </div>

        {/* Total Volume */}
        <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase mb-3">
            <span>Cash Flow Volume</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">
            {currency} {(totalIncome + totalExpense).toLocaleString()}
          </div>
          <p className="text-xs text-slate-400 mt-2">Total gross money moved</p>
        </div>

        {/* Total Transactions */}
        <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase mb-3">
            <span>Total Transactions</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">
            {transactions.length}
          </div>
          <p className="text-xs text-slate-400 mt-2">Logged across all time</p>
        </div>
      </div>

      {/* Monthly Cash Flow Graph */}
      <div className="glass-panel p-6 rounded-2xl space-y-4 relative overflow-hidden">
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between relative z-10">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Monthly Cash Inflow vs Outflow
            </h2>
            <p className="text-xs text-slate-400">Track balance growth across billing periods</p>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20">
            Cash Flow Trends
          </span>
        </div>

        <div className="h-80 w-full pt-4 relative z-10">
          {monthlyTrends.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyTrends}
                margin={{ top: 15, right: 15, left: 10, bottom: 5 }}
                barGap={8}
                barCategoryGap="25%"
              >
                <defs>
                  <linearGradient id="reportsIncomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                    <stop offset="100%" stopColor="#047857" stopOpacity={0.85} />
                  </linearGradient>
                  <linearGradient id="reportsExpenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity={1} />
                    <stop offset="100%" stopColor="#be123c" stopOpacity={0.85} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255, 255, 255, 0.06)"
                  vertical={false}
                  fill="none"
                />
                <XAxis
                  dataKey="month"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                  dy={6}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  dx={-4}
                  tickFormatter={(v) =>
                    v === 0
                      ? '0'
                      : v >= 1000000
                      ? `${currency}${(v / 1000000).toFixed(1)}M`
                      : v >= 1000
                      ? `${currency}${Math.round(v / 1000)}k`
                      : `${currency}${v}`
                  }
                />
                <Tooltip content={<CustomChartTooltip currency={currency} />} cursor={false} />
                <Bar
                  dataKey="income"
                  name="Total Inflow"
                  fill="url(#reportsIncomeGrad)"
                  radius={[8, 8, 2, 2]}
                  maxBarSize={38}
                />
                <Bar
                  dataKey="expense"
                  name="Total Outflow"
                  fill="url(#reportsExpenseGrad)"
                  radius={[8, 8, 2, 2]}
                  maxBarSize={38}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">
              No historical data available.
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 pt-1 text-xs text-slate-400 relative z-10">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-md bg-gradient-to-tr from-emerald-600 to-emerald-400 shadow-sm" />
            <span className="font-medium text-slate-300">Total Inflow</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-md bg-gradient-to-tr from-rose-600 to-rose-400 shadow-sm" />
            <span className="font-medium text-slate-300">Total Outflow</span>
          </div>
        </div>
      </div>

      {/* Interactive Statement & Filtered Export Section */}
      <ReportExportSection
        allTransactions={transactions}
        user={user}
        currency={currency}
      />

      {/* Two Column Section: Category Ranking & Payment Method Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Expense Ranking */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <h2 className="text-base font-bold text-white tracking-tight">
            Spending by Category
          </h2>

          <div className="space-y-3">
            {categoryBreakdown.map((cat) => (
              <div key={cat.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">{cat.name}</span>
                  <span className="text-slate-400 font-mono">
                    {currency} {cat.value.toLocaleString()} ({cat.percentage}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-500 to-indigo-500"
                    style={{ width: `${cat.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}

            {categoryBreakdown.length === 0 && (
              <div className="text-xs text-slate-500 py-6 text-center">
                No expense entries found.
              </div>
            )}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <h2 className="text-base font-bold text-white tracking-tight">
            Payment Method Breakdown
          </h2>

          <div className="space-y-3">
            {paymentBreakdown.map((pm) => {
              const pct =
                totalIncome + totalExpense > 0
                  ? Math.round((pm.amount / (totalIncome + totalExpense)) * 100)
                  : 0;

              return (
                <div key={pm.method} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200 flex items-center gap-2">
                      <CreditCard className="w-3.5 h-3.5 text-brand-400" />
                      <span>{pm.method}</span>
                    </span>
                    <span className="text-slate-400 font-mono">
                      {currency} {pm.amount.toLocaleString()} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}

            {paymentBreakdown.length === 0 && (
              <div className="text-xs text-slate-500 py-6 text-center">
                No payment methods logged.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
