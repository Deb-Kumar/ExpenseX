import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Target,
  Plus,
  TrendingUp,
  CreditCard,
  Trash2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ChevronRight,
  BarChart3,
  Sparkles,
  MousePointerClick,
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { fetchSummaryApi, fetchBudgetsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getCurrencySymbol } from '../utils/currency';
import TransactionModal from '../components/TransactionModal';
import DeleteAuthModal from '../components/DeleteAuthModal';
import MonthBreakdownModal from '../components/MonthBreakdownModal';
import Loader from '../components/Loader';
import UserAvatar from '../components/UserAvatar';

const CATEGORY_COLORS = [
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#14b8a6', // Teal
];
const CHART_COLORS = CATEGORY_COLORS;

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
            <span className="text-slate-400 font-medium">Income</span>
          </div>
          <span className="font-bold text-emerald-400 font-mono">
            +{currency} {incomeVal.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shadow-xs shadow-rose-400/50" />
            <span className="text-slate-400 font-medium">Expense</span>
          </div>
          <span className="font-bold text-rose-400 font-mono">
            -{currency} {expenseVal.toLocaleString()}
          </span>
        </div>

        <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-4">
          <span className="text-[11px] font-semibold text-slate-400">Net Flow</span>
          <span
            className={`font-mono text-xs font-extrabold ${
              netVal >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {netVal >= 0 ? '+' : ''}
            {currency} {netVal.toLocaleString()}
          </span>
        </div>

        <div className="pt-1.5 border-t border-white/5 flex items-center justify-center gap-1.5 text-[10px] font-bold text-brand-300">
          <MousePointerClick className="w-3 h-3 text-brand-400" />
          <span>Click bar to view transactions</span>
        </div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const { user } = useAuth();
  const currency = getCurrencySymbol(user?.currency);

  const [summary, setSummary] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [deletingTransaction, setDeletingTransaction] = useState(null);
  const [chartView, setChartView] = useState('bar'); // 'bar' | 'area'
  const [selectedMonthModal, setSelectedMonthModal] = useState(null);

  const handleBarClick = (data, barType = 'all') => {
    const payload = data?.payload || data;
    const monthKey = payload?.month || data?.activeLabel;
    if (!monthKey) return;
    setSelectedMonthModal({
      month: monthKey,
      type: barType,
      income: payload.income || 0,
      expense: payload.expense || 0,
    });
  };

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const [sumData, budData] = await Promise.all([
        fetchSummaryApi(),
        fetchBudgetsApi(),
      ]);
      setSummary(sumData.summary);
      setBudgets(budData.budgets || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    const handleTxAdded = () => loadDashboardData();
    window.addEventListener('expensex:transaction-added', handleTxAdded);
    return () => window.removeEventListener('expensex:transaction-added', handleTxAdded);
  }, []);

  const handleDeleteTransaction = (tx) => {
    setDeletingTransaction(tx);
  };

  const totalIncome = summary?.totalIncome || 0;
  const totalExpense = summary?.totalExpense || 0;
  const netBalance = summary?.netBalance || 0;
  const categoryData = summary?.categoryBreakdown || [];
  const monthlyTrends = summary?.monthlyTrends || [];
  const recentTransactions = summary?.recentTransactions || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader size="md" label="Loading your financial dashboard..." />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <UserAvatar
            src={user?.profilePicture}
            name={user?.name}
            size="xl"
            rounded="rounded-2xl"
          />
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Welcome back, {user?.name ? user.name.split(' ')[0] : 'there'} 👋
            </h1>
            <p className="text-xs text-slate-400">
              Real-time balance, income & expense breakdown, and monthly budget limits.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-brand-500/25 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Transaction</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* 3 Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Net Balance Card */}
        <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-brand-500/10 rounded-full blur-2xl group-hover:bg-brand-500/15 transition-all"></div>
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <span>Net Balance</span>
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white tracking-tight">
            {currency} {netBalance.toLocaleString()}
          </div>
          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
            <span className={netBalance >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
              {netBalance >= 0 ? 'Surplus' : 'Deficit'}
            </span>
            <span>across all recorded entries</span>
          </p>
        </div>

        {/* Total Income Card */}
        <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/15 transition-all"></div>
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <span>Total Income</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-400 tracking-tight">
            +{currency} {totalIncome.toLocaleString()}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            From salary, freelance, & investments
          </p>
        </div>

        {/* Total Expense Card */}
        <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/15 transition-all"></div>
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <span>Total Expenses</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-rose-400 tracking-tight">
            -{currency} {totalExpense.toLocaleString()}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Spent across {categoryData.length} categories
          </p>
        </div>
      </div>

      {/* Charts Section: Income vs Expense Bar Chart & Expense Category Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income vs Expense Trends (2 cols on large screen) */}
        <div className="lg:col-span-2 glass-panel p-5 sm:p-6 rounded-2xl space-y-4 relative overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Income vs Expenses Overview
                </h2>
                <span className="hidden sm:inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20">
                  Monthly Trends
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Monthly comparison of cash inflows and outflows
              </p>
            </div>

            {/* View Switcher & Period Tag */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <div className="flex items-center p-1 rounded-xl bg-slate-950/60 border border-white/5">
                <button
                  type="button"
                  onClick={() => setChartView('bar')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    chartView === 'bar'
                      ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Bar Comparison"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Bars</span>
                </button>
                <button
                  type="button"
                  onClick={() => setChartView('area')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    chartView === 'area'
                      ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Smooth Flow"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Area</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-1 border-b border-white/5 pb-3 text-xs relative z-10">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-xs shadow-emerald-400/50" />
              <span className="text-slate-400 text-[11px]">Income:</span>
              <span className="font-bold text-emerald-400 font-mono text-xs">
                +{currency} {totalIncome.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shadow-xs shadow-rose-400/50" />
              <span className="text-slate-400 text-[11px]">Expense:</span>
              <span className="font-bold text-rose-400 font-mono text-xs">
                -{currency} {totalExpense.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/5">
              <span className="text-slate-400 text-[11px]">Net:</span>
              <span
                className={`font-bold font-mono text-xs ${
                  netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {netBalance >= 0 ? '+' : ''}
                {currency} {netBalance.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Chart Canvas */}
          <div className="h-72 w-full pt-2 relative z-10">
            {monthlyTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                {chartView === 'bar' ? (
                  <BarChart
                    data={monthlyTrends}
                    margin={{ top: 15, right: 15, left: 10, bottom: 5 }}
                    barGap={8}
                    barCategoryGap="25%"
                    onClick={(state) => {
                      if (state?.activeLabel) {
                        const p = state.activePayload?.[0]?.payload || { month: state.activeLabel };
                        handleBarClick(p, 'all');
                      }
                    }}
                  >
                    <defs>
                      <linearGradient id="incomeBarGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                        <stop offset="100%" stopColor="#047857" stopOpacity={0.85} />
                      </linearGradient>
                      <linearGradient id="expenseBarGrad" x1="0" y1="0" x2="0" y2="1">
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
                      name="Income"
                      fill="url(#incomeBarGrad)"
                      radius={[8, 8, 2, 2]}
                      maxBarSize={38}
                      className="cursor-pointer"
                      onClick={(entry) => handleBarClick(entry, 'income')}
                    />
                    <Bar
                      dataKey="expense"
                      name="Expense"
                      fill="url(#expenseBarGrad)"
                      radius={[8, 8, 2, 2]}
                      maxBarSize={38}
                      className="cursor-pointer"
                      onClick={(entry) => handleBarClick(entry, 'expense')}
                    />
                  </BarChart>
                ) : (
                  <AreaChart
                    data={monthlyTrends}
                    margin={{ top: 15, right: 15, left: 10, bottom: 5 }}
                    onClick={(state) => {
                      if (state?.activeLabel) {
                        const p = state.activePayload?.[0]?.payload || { month: state.activeLabel };
                        handleBarClick(p, 'all');
                      }
                    }}
                  >
                    <defs>
                      <linearGradient id="incomeAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="expenseAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.0} />
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
                    <Area
                      type="monotone"
                      dataKey="income"
                      name="Income"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fill="url(#incomeAreaGrad)"
                      dot={{ fill: '#10b981', r: 4, strokeWidth: 2, stroke: '#0f172a', className: 'cursor-pointer' }}
                      activeDot={{ r: 7, fill: '#34d399', stroke: '#fff', strokeWidth: 2, className: 'cursor-pointer' }}
                      className="cursor-pointer"
                      onClick={(entry) => handleBarClick(entry, 'income')}
                    />
                    <Area
                      type="monotone"
                      dataKey="expense"
                      name="Expense"
                      stroke="#f43f5e"
                      strokeWidth={2.5}
                      fill="url(#expenseAreaGrad)"
                      dot={{ fill: '#f43f5e', r: 4, strokeWidth: 2, stroke: '#0f172a', className: 'cursor-pointer' }}
                      activeDot={{ r: 7, fill: '#fb7185', stroke: '#fff', strokeWidth: 2, className: 'cursor-pointer' }}
                      className="cursor-pointer"
                      onClick={(entry) => handleBarClick(entry, 'expense')}
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No monthly transaction trends recorded yet.
              </div>
            )}
          </div>

          {/* Footer Legend */}
          <div className="flex items-center justify-center gap-6 pt-1 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md bg-gradient-to-tr from-emerald-600 to-emerald-400 shadow-sm" />
              <span className="font-medium text-slate-300">Income Inflow</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md bg-gradient-to-tr from-rose-600 to-rose-400 shadow-sm" />
              <span className="font-medium text-slate-300">Expense Outflow</span>
            </div>
          </div>
        </div>

        {/* Expense by Category Pie Chart */}
        <div className="glass-panel p-6 rounded-2xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white tracking-tight">
                Expense Breakdown
              </h2>
              <span className="text-xs text-slate-400">By Category</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Where your money went</p>
          </div>

          <div className="h-56 w-full relative flex items-center justify-center">
            {categoryData.length > 0 ? (
              <>
                {/* Center Donut Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Spent</span>
                  <span className="text-sm font-extrabold text-white tracking-tight">
                    {currency} {totalExpense.toLocaleString()}
                  </span>
                </div>

                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={82}
                      paddingAngle={categoryData.length > 1 ? 4 : 0}
                      stroke="none"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                          stroke="transparent"
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val, name) => [
                        `${currency} ${Number(val).toLocaleString()}`,
                        name || 'Amount',
                      ]}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: 'rgba(255,255,255,0.15)',
                        borderRadius: '12px',
                        fontSize: '12px',
                        color: '#f8fafc',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                      }}
                      itemStyle={{ color: '#f8fafc', fontWeight: 600 }}
                      labelStyle={{ color: '#94a3b8', fontWeight: 500 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </>
            ) : (
              <div className="text-xs text-slate-500">No expense records found.</div>
            )}
          </div>

          {/* Top 3 Category Mini Legend */}
          <div className="space-y-1.5 pt-2 border-t border-white/5">
            {categoryData.slice(0, 3).map((cat, idx) => (
              <div key={cat.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                  ></span>
                  <span className="text-slate-300">{cat.name}</span>
                </div>
                <span className="font-semibold text-slate-200">
                  {cat.percentage}% ({currency}{cat.value.toLocaleString()})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Transactions & Budget Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions List (2 cols) */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white tracking-tight">
              Recent Transactions
            </h2>
            <NavLink
              to="/transactions"
              className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </NavLink>
          </div>

          {recentTransactions.length > 0 ? (
            <div className="divide-y divide-white/5">
              {recentTransactions.map((tx) => (
                <div
                  key={tx._id}
                  className="py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors rounded-lg px-2"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        tx.type === 'income'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-rose-500/10 text-rose-400'
                      }`}
                    >
                      {tx.type === 'income' ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white">
                        {tx.description || tx.category}
                      </h3>
                      <p className="text-[11px] text-slate-400 flex items-center gap-2">
                        <span>{tx.category}</span>
                        <span>•</span>
                        <span>{new Date(tx.date).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 text-[10px]">
                          {tx.paymentMethod}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-bold ${
                        tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}
                      {currency} {Number(tx.amount).toLocaleString()}
                    </span>
                    <button
                      onClick={() => handleDeleteTransaction(tx)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                      title="Delete Transaction"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-500">
              No transactions recorded yet. Click "New Transaction" to add your first entry!
            </div>
          )}
        </div>

        {/* Monthly Budgets Snapshot */}
        <div className="glass-panel p-6 rounded-2xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white tracking-tight">
                Budget Snapshot
              </h2>
              <NavLink
                to="/budgets"
                className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1"
              >
                <span>Manage</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </NavLink>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Current month limits</p>
          </div>

          <div className="space-y-3.5">
            {budgets.slice(0, 4).map((b) => (
              <div key={b._id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">{b.category}</span>
                  <span className="text-slate-400">
                    {currency}{b.spent.toLocaleString()} / {currency}{b.amount.toLocaleString()}
                  </span>
                </div>
                {/* Progress Bar */}
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
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
              </div>
            ))}

            {budgets.length === 0 && (
              <div className="text-xs text-slate-500 text-center py-4">
                No monthly budgets set yet.
              </div>
            )}
          </div>

          <NavLink
            to="/budgets"
            className="w-full text-center py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/5 text-xs font-semibold text-slate-300 transition-all"
          >
            Open Budget Planner
          </NavLink>
        </div>
      </div>

      {/* Add Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadDashboardData}
      />

      {/* Password Authorization Delete Modal */}
      {deletingTransaction && (
        <DeleteAuthModal
          isOpen={Boolean(deletingTransaction)}
          transaction={deletingTransaction}
          onClose={() => setDeletingTransaction(null)}
          onSuccess={() => {
            setDeletingTransaction(null);
            loadDashboardData();
          }}
        />
      )}

      {/* Interactive Month Breakdown Modal from Clickable Graph */}
      <MonthBreakdownModal
        isOpen={Boolean(selectedMonthModal)}
        onClose={() => setSelectedMonthModal(null)}
        monthData={selectedMonthModal}
        currency={currency}
      />
    </div>
  );
}
