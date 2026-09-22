import axios from 'axios';

// Determine API base URL dynamically
const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  // If deployed on Vercel and env is default '/api', automatically route to live Render backend
  if (
    typeof window !== 'undefined' &&
    window.location.hostname.endsWith('.vercel.app') &&
    (!envUrl || envUrl === '/api')
  ) {
    return 'https://expensex-finance.onrender.com/api';
  }
  return envUrl || '/api';
};

// Configured Axios instance
const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Attach JWT token if available in localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('expensex_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If 401 Unauthorized, clear stale token
    if (error.response && error.response.status === 401) {
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('expensex_token');
        localStorage.removeItem('expensex_user');
      }
    }
    return Promise.reject(error);
  }
);

// ================= API SERVICES =================

// Health
export const checkHealth = async () => {
  const res = await api.get('/health');
  return res.data;
};

// Auth
export const loginWithEmailApi = async ({ email, password }) => {
  const res = await api.post('/auth/login', { email, password });
  return res.data;
};

export const loginWithGoogleApi = async (credential) => {
  const res = await api.post('/auth/google', { credential });
  return res.data;
};

export const loginWithFirebaseApi = async (userData) => {
  const res = await api.post('/auth/firebase', userData);
  return res.data;
};

export const getMeApi = async () => {
  const res = await api.get('/auth/me');
  return res.data;
};

export const updateCurrencyApi = async (currency) => {
  const res = await api.put('/auth/currency', { currency });
  return res.data;
};

export const updateProfileApi = async (profileData) => {
  const res = await api.put('/auth/profile', profileData);
  return res.data;
};

export const setPasswordApi = async (password) => {
  const res = await api.put('/auth/set-password', { password });
  return res.data;
};

export const verifyPasswordApi = async (password) => {
  const res = await api.post('/auth/verify-password', { password });
  return res.data;
};

export const sendEmailOtpApi = async (newEmail) => {
  const res = await api.post('/auth/send-email-otp', { newEmail });
  return res.data;
};

export const verifyEmailOtpApi = async ({ newEmail, otp }) => {
  const res = await api.post('/auth/verify-email-otp', { newEmail, otp });
  return res.data;
};

// Transactions
export const fetchTransactionsApi = async (params = {}) => {
  const res = await api.get('/transactions', { params });
  return res.data;
};

export const fetchSummaryApi = async () => {
  const res = await api.get('/transactions/summary');
  return res.data;
};

export const createTransactionApi = async (transactionData) => {
  const res = await api.post('/transactions', transactionData);
  return res.data;
};

export const updateTransactionApi = async (id, transactionData) => {
  const res = await api.put(`/transactions/${id}`, transactionData);
  return res.data;
};

export const deleteTransactionApi = async (id) => {
  const res = await api.delete(`/transactions/${id}`);
  return res.data;
};

// Budgets
export const fetchBudgetsApi = async (params = {}) => {
  const res = await api.get('/budgets', { params });
  return res.data;
};

export const saveBudgetApi = async (budgetData) => {
  const res = await api.post('/budgets', budgetData);
  return res.data;
};

export const deleteBudgetApi = async (id) => {
  const res = await api.delete(`/budgets/${id}`);
  return res.data;
};

export default api;
