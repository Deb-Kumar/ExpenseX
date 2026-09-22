import {
  getBudgets,
  setBudget,
  deleteBudget,
  getTransactions,
} from '../services/dataStore.js';

// @desc    Get all budgets for current/specified month with actual spend tracking
// @route   GET /api/budgets
// @access  Private
export const getMyBudgets = async (req, res, next) => {
  try {
    const now = new Date();
    const month = parseInt(req.query.month || now.getMonth() + 1, 10);
    const year = parseInt(req.query.year || now.getFullYear(), 10);

    // Fetch user budgets for this month/year
    const budgets = await getBudgets(req.user._id, month, year);

    // Compute start and end dates of this month to aggregate actual spending
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Fetch user expense transactions for this month
    const { transactions } = await getTransactions(req.user._id, {
      type: 'expense',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      limit: 1000,
    });

    // Sum spend by category
    const spendByCategory = {};
    let totalMonthlySpend = 0;

    transactions.forEach((tx) => {
      const amt = Number(tx.amount);
      totalMonthlySpend += amt;
      spendByCategory[tx.category] = (spendByCategory[tx.category] || 0) + amt;
    });

    // Merge budgets with actual spend data
    let totalBudgeted = 0;
    const budgetList = budgets.map((b) => {
      const budgetObj = b.toObject ? b.toObject() : { ...b };
      const spent = spendByCategory[budgetObj.category] || 0;
      const budgetAmount = Number(budgetObj.amount);
      totalBudgeted += budgetAmount;

      const remaining = budgetAmount - spent;
      const percentage = budgetAmount > 0 ? Math.min(Math.round((spent / budgetAmount) * 100), 999) : 0;

      return {
        ...budgetObj,
        spent,
        remaining,
        percentage,
        isOverBudget: spent > budgetAmount,
        isWarning: percentage >= 80 && spent <= budgetAmount,
      };
    });

    res.status(200).json({
      success: true,
      month,
      year,
      totalBudgeted,
      totalMonthlySpend,
      budgets: budgetList,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create or update monthly budget for a category
// @route   POST /api/budgets
// @access  Private
export const createOrUpdateBudget = async (req, res, next) => {
  try {
    const { category, amount, month, year } = req.body;

    if (!category || category.trim() === '') {
      return res.status(400).json({ success: false, message: 'Category is required' });
    }

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Budget amount must be greater than 0' });
    }

    const now = new Date();
    const targetMonth = month ? Number(month) : now.getMonth() + 1;
    const targetYear = year ? Number(year) : now.getFullYear();

    const budget = await setBudget(req.user._id, {
      category: category.trim(),
      amount: Number(amount),
      month: targetMonth,
      year: targetYear,
    });

    res.status(200).json({
      success: true,
      message: 'Budget saved successfully',
      budget,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete budget
// @route   DELETE /api/budgets/:id
// @access  Private
export const deleteBudgetById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await deleteBudget(id, req.user._id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found or unauthorized',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Budget deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
