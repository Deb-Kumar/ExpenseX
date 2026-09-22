import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  X,
} from 'lucide-react';
import { fetchTransactionsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getCurrencySymbol } from '../utils/currency';
import TransactionModal from '../components/TransactionModal';
import DeleteAuthModal from '../components/DeleteAuthModal';
import Loader from '../components/Loader';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  isIncomeCategory,
  isExpenseCategory,
} from '../utils/categories';

export default function Transactions() {
  const { user } = useAuth();
  const currency = getCurrencySymbol(user?.currency);
  const [searchParams] = useSearchParams();

  const [transactions, setTransactions] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingTransaction, setDeletingTransaction] = useState(null);

  // Filters state initialized from URL params if present
  const [search, setSearch] = useState('');
  const [type, setType] = useState(searchParams.get('type') || 'all');
  const [category, setCategory] = useState(searchParams.get('category') || 'All Categories');
  const [startDate, setStartDate] = useState(searchParams.get('startDate') || '');
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || '');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  const loadTransactions = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        ...(type !== 'all' && { type }),
        ...(category !== 'All Categories' && { category }),
        ...(search.trim() && { search: search.trim() }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      };

      const data = await fetchTransactionsApi(params);
      setTransactions(data.transactions || []);
      setTotalCount(data.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error fetching transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [type, category, startDate, endDate]);

  useEffect(() => {
    const handleTxAdded = () => loadTransactions();
    window.addEventListener('expensex:transaction-added', handleTxAdded);
    return () => window.removeEventListener('expensex:transaction-added', handleTxAdded);
  }, []);

  // Sync state if URL query params change (e.g. from graph drilldown click)
  useEffect(() => {
    const urlType = searchParams.get('type');
    const urlStart = searchParams.get('startDate');
    const urlEnd = searchParams.get('endDate');
    const urlCat = searchParams.get('category');
    if (urlType) setType(urlType);
    if (urlStart) setStartDate(urlStart);
    if (urlEnd) setEndDate(urlEnd);
    if (urlCat) setCategory(urlCat);
  }, [searchParams]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadTransactions();
  };

  const handleResetFilters = () => {
    setSearch('');
    setType('all');
    setCategory('All Categories');
    setStartDate('');
    setEndDate('');
  };

  const handleTypeFilterChange = (newType) => {
    setType(newType);
    if (category !== 'All Categories') {
      if (newType === 'income' && !isIncomeCategory(category)) {
        setCategory('All Categories');
      } else if (newType === 'expense' && !isExpenseCategory(category)) {
        setCategory('All Categories');
      }
    }
  };

  const handleDelete = (tx) => {
    setDeletingTransaction(tx);
  };

  const handleEdit = (tx) => {
    setEditingTransaction(tx);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Transactions
          </h1>
          <p className="text-xs text-slate-400">
            View, search, filter, and organize all your income and expenses.
          </p>
        </div>

        <button
          onClick={handleAddNew}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-600/25 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Transaction</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="glass-panel p-4 sm:p-5 rounded-2xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-brand-400"
            />
          </form>

          {/* Type Filter */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-white/10">
            {['all', 'income', 'expense'].map((t) => (
              <button
                key={t}
                onClick={() => handleTypeFilterChange(t)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  type === t
                    ? t === 'income'
                      ? 'bg-emerald-500 text-white'
                      : t === 'expense'
                      ? 'bg-rose-500 text-white'
                      : 'bg-brand-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Category Dropdown (Dynamically filtered by transaction type to prevent conflicts) */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-brand-400"
          >
            <option value="All Categories">All Categories</option>
            {type === 'income' ? (
              INCOME_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))
            ) : type === 'expense' ? (
              EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))
            ) : (
              <>
                <optgroup label="Income Categories" className="text-emerald-400 bg-slate-900 font-bold">
                  {INCOME_CATEGORIES.map((cat) => (
                    <option key={`inc-${cat}`} value={cat} className="text-white font-normal">
                      {cat}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Expense Categories" className="text-rose-400 bg-slate-900 font-bold">
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={`exp-${cat}`} value={cat} className="text-white font-normal">
                      {cat}
                    </option>
                  ))}
                </optgroup>
              </>
            )}
          </select>

          {/* Date Filter */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-2.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-brand-400"
              title="Start Date"
            />
            <span className="text-slate-500 text-xs">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-2.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-brand-400"
              title="End Date"
            />
          </div>
        </div>

        {/* Reset Filter Action */}
        {(type !== 'all' || category !== 'All Categories' || search || startDate || endDate) && (
          <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-slate-400">
            <span>Filters active: Showing filtered records</span>
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1 text-brand-400 hover:text-brand-300 font-semibold"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear all filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Transactions Table / Card List */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-white/5">
        {loading ? (
          <div className="p-16 flex items-center justify-center">
            <Loader size="md" label="Loading transactions..." />
          </div>
        ) : transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 border-b border-white/5 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Transaction</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Method</th>
                  <th className="px-6 py-3.5 text-right">Amount</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {transactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
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
                          <p className="font-bold text-white text-xs">
                            {tx.description || tx.category}
                          </p>
                          <span
                            className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded capitalize mt-0.5 ${
                              tx.type === 'income'
                                ? 'bg-emerald-500/15 text-emerald-300'
                                : 'bg-rose-500/15 text-rose-300'
                            }`}
                          >
                            {tx.type}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 font-medium text-slate-200">{tx.category}</td>

                    <td className="px-6 py-4 text-slate-400">
                      {new Date(tx.date).toLocaleDateString()}
                    </td>

                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-md bg-slate-800 border border-white/5 text-[11px] font-medium text-slate-300">
                        {tx.paymentMethod}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <span
                        className={`text-sm font-bold ${
                          tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : '-'}
                        {currency} {Number(tx.amount).toLocaleString()}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(tx)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-300 hover:bg-brand-500/10 transition-all"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(tx)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-xs text-slate-500 space-y-3">
            <p>No transactions match the selected filters.</p>
            <button
              onClick={handleAddNew}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold transition-all"
            >
              Add a Transaction Now
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        initialData={editingTransaction}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTransaction(null);
        }}
        onSuccess={loadTransactions}
      />

      {/* Password Authorization Delete Modal */}
      {deletingTransaction && (
        <DeleteAuthModal
          isOpen={Boolean(deletingTransaction)}
          transaction={deletingTransaction}
          onClose={() => setDeletingTransaction(null)}
          onSuccess={() => {
            setDeletingTransaction(null);
            loadTransactions();
          }}
        />
      )}
    </div>
  );
}
