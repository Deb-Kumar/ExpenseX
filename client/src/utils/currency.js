export const CURRENCIES = [
  { symbol: '₹', code: 'INR', name: 'Indian Rupee' },
  { symbol: '$', code: 'USD', name: 'US Dollar' },
  { symbol: '€', code: 'EUR', name: 'Euro' },
  { symbol: '£', code: 'GBP', name: 'British Pound' },
  { symbol: '¥', code: 'JPY', name: 'Japanese Yen' },
];

export const getCurrencyInfo = (curr) => {
  if (!curr) return CURRENCIES[0]; // default: INR
  const match = CURRENCIES.find(
    (c) => c.symbol === curr || c.code.toUpperCase() === String(curr).toUpperCase()
  );
  if (match) return match;
  return { symbol: curr, code: curr, name: curr };
};

export const getCurrencySymbol = (curr) => {
  return getCurrencyInfo(curr).symbol;
};
