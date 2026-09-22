/**
 * Unified Category Definitions for ExpenseX
 * Strict separation between Income and Expense categories to prevent conflicts
 */

export const EXPENSE_CATEGORIES = [
  'Food',
  'Transport',
  'Shopping',
  'Bills',
  'Entertainment',
  'Health',
  'Education',
  'Travel',
  'Other',
];

export const INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Business',
  'Investment',
  'Gift',
  'Other',
];

/**
 * Helper to get valid categories for a given transaction type
 * @param {'all' | 'income' | 'expense'} type 
 * @returns {string[]}
 */
export const getCategoriesByType = (type) => {
  if (type === 'income') {
    return ['All Categories', ...INCOME_CATEGORIES];
  }
  if (type === 'expense') {
    return ['All Categories', ...EXPENSE_CATEGORIES];
  }
  // 'all' type: combine unique categories
  return [
    'All Categories',
    ...EXPENSE_CATEGORIES,
    ...INCOME_CATEGORIES.filter((c) => !EXPENSE_CATEGORIES.includes(c)),
  ];
};

/**
 * Check if a category belongs to income
 */
export const isIncomeCategory = (category) => {
  return INCOME_CATEGORIES.includes(category);
};

/**
 * Check if a category belongs to expense
 */
export const isExpenseCategory = (category) => {
  return EXPENSE_CATEGORIES.includes(category);
};
