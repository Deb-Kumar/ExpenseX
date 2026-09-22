import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  calculateUserNetBalance,
  getTransactionById,
} from '../services/dataStore.js';

// @desc    Get all transactions for logged in user with filters
// @route   GET /api/transactions
// @access  Private
export const getMyTransactions = async (req, res, next) => {
  try {
    const result = await getTransactions(req.user._id, req.query);
    res.status(200).json({
      success: true,
      total: result.total,
      transactions: result.transactions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get financial summary (Totals, balance, category breakdown, monthly stats)
// @route   GET /api/transactions/summary
// @access  Private
export const getFinancialSummary = async (req, res, next) => {
  try {
    // Fetch all user transactions without pagination for analytics
    const { transactions } = await getTransactions(req.user._id, { limit: 1000 });

    let totalIncome = 0;
    let totalExpense = 0;
    const categoryTotals = {};
    const monthlyStats = {};

    transactions.forEach((tx) => {
      const amount = Number(tx.amount);
      const txDate = new Date(tx.date);
      const monthKey = txDate.toLocaleString('default', { month: 'short' }) + ' ' + txDate.getFullYear();

      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = { month: monthKey, income: 0, expense: 0 };
      }

      if (tx.type === 'income') {
        totalIncome += amount;
        monthlyStats[monthKey].income += amount;
      } else if (tx.type === 'expense') {
        totalExpense += amount;
        monthlyStats[monthKey].expense += amount;

        // Group expense categories
        categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + amount;
      }
    });

    const netBalance = totalIncome - totalExpense;

    // Format category distribution for charts
    const categoryBreakdown = Object.entries(categoryTotals).map(([name, value]) => ({
      name,
      value,
      percentage: totalExpense > 0 ? ((value / totalExpense) * 100).toFixed(1) : 0,
    })).sort((a, b) => b.value - a.value);

    // Format monthly trends array
    const monthlyTrends = Object.values(monthlyStats);

    // Recent 5 transactions
    const recentTransactions = transactions.slice(0, 5);

    res.status(200).json({
      success: true,
      summary: {
        totalIncome,
        totalExpense,
        netBalance,
        totalTransactions: transactions.length,
        categoryBreakdown,
        monthlyTrends,
        recentTransactions,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new transaction
// @route   POST /api/transactions
// @access  Private
export const createNewTransaction = async (req, res, next) => {
  try {
    const { type, amount, category, description, paymentMethod, date } = req.body;

    if (!type || !['income', 'expense'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type must be either income or expense',
      });
    }

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid positive amount',
      });
    }

    const numAmount = Number(amount);

    // If type is expense, verify that user has sufficient net balance
    if (type === 'expense') {
      const netBalance = await calculateUserNetBalance(req.user._id);
      if (netBalance < numAmount) {
        const currency = req.user.currency || '₹';
        const formattedBal = netBalance <= 0 ? `${currency} 0` : `${currency} ${netBalance.toLocaleString()}`;
        return res.status(400).json({
          success: false,
          message: `Insufficient balance! Your current net balance is ${formattedBal}, which cannot cover an expense of ${currency} ${numAmount.toLocaleString()}. Please add income first.`,
        });
      }
    }

    if (!category || category.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Category is required',
      });
    }

    const tx = await createTransaction(req.user._id, {
      type,
      amount: numAmount,
      category: category.trim(),
      description: description ? description.trim() : '',
      paymentMethod: paymentMethod || 'UPI',
      date: date ? new Date(date) : new Date(),
    });

    res.status(201).json({
      success: true,
      message: 'Transaction added successfully',
      transaction: tx,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update existing transaction
// @route   PUT /api/transactions/:id
// @access  Private
export const updateTransactionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type, amount, category, description, paymentMethod, date } = req.body;

    const existingTx = await getTransactionById(id, req.user._id);
    if (!existingTx) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found or unauthorized',
      });
    }

    const targetType = type || existingTx.type;
    const targetAmount = amount !== undefined ? Number(amount) : Number(existingTx.amount);

    if (isNaN(targetAmount) || targetAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid positive amount',
      });
    }

    // If target is an expense, verify that user has sufficient available balance
    if (targetType === 'expense') {
      const netBalance = await calculateUserNetBalance(req.user._id);
      const availableBalance =
        existingTx.type === 'expense'
          ? netBalance + Number(existingTx.amount)
          : netBalance - Number(existingTx.amount);

      if (availableBalance < targetAmount) {
        const currency = req.user.currency || '₹';
        const formattedBal = availableBalance <= 0 ? `${currency} 0` : `${currency} ${availableBalance.toLocaleString()}`;
        return res.status(400).json({
          success: false,
          message: `Insufficient balance! Your available balance is ${formattedBal}, which cannot cover the updated expense of ${currency} ${targetAmount.toLocaleString()}. Please add income first.`,
        });
      }
    }

    const updated = await updateTransaction(id, req.user._id, {
      ...(type && { type }),
      ...(amount !== undefined && { amount: targetAmount }),
      ...(category && { category: category.trim() }),
      ...(description !== undefined && { description: description.trim() }),
      ...(paymentMethod && { paymentMethod }),
      ...(date && { date: new Date(date) }),
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found or unauthorized',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Transaction updated successfully',
      transaction: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete transaction
// @route   DELETE /api/transactions/:id
// @access  Private
export const deleteTransactionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await deleteTransaction(id, req.user._id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found or unauthorized',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
