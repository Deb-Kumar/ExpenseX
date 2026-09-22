import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getMeApi,
  loginWithEmailApi,
  loginWithGoogleApi,
  loginWithFirebaseApi,
  updateCurrencyApi,
  updateProfileApi,
  setPasswordApi,
  sendEmailOtpApi,
  verifyEmailOtpApi,
  deleteAccountApi,
} from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('expensex_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('expensex_token'));
  const [loading, setLoading] = useState(true);

  // Validate and rehydrate session on app startup
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('expensex_token');
      if (savedToken) {
        try {
          const data = await getMeApi();
          setUser(data.user);
          localStorage.setItem('expensex_user', JSON.stringify(data.user));
        } catch (err) {
          console.warn('Session expired, logging out:', err.message);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const handleAuthSuccess = (data) => {
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('expensex_token', data.token);
    localStorage.setItem('expensex_user', JSON.stringify(data.user));
  };

  const loginWithEmail = async (email, password) => {
    setLoading(true);
    try {
      const data = await loginWithEmailApi({ email, password });
      handleAuthSuccess(data);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (credential) => {
    setLoading(true);
    try {
      const data = await loginWithGoogleApi(credential);
      handleAuthSuccess(data);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const loginWithFirebase = async (firebaseUser, extraOptions = {}) => {
    setLoading(true);
    try {
      const isGoogle = firebaseUser.providerData?.[0]?.providerId === 'google.com' || extraOptions.authProvider === 'google';
      const data = await loginWithFirebaseApi({
        googleId: firebaseUser.uid,
        name: firebaseUser.displayName || firebaseUser.name || 'User',
        email: firebaseUser.email,
        profilePicture: firebaseUser.photoURL || firebaseUser.profilePicture || '',
        authProvider: isGoogle ? 'google' : 'email',
        hasPassword: isGoogle ? false : true,
        ...extraOptions,
      });
      handleAuthSuccess(data);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('expensex_token');
    localStorage.removeItem('expensex_user');
  };

  const updateCurrency = async (newCurrency) => {
    try {
      await updateCurrencyApi(newCurrency);
      const updatedUser = { ...user, currency: newCurrency };
      setUser(updatedUser);
      localStorage.setItem('expensex_user', JSON.stringify(updatedUser));
    } catch (err) {
      console.error('Failed to update currency:', err);
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const data = await updateProfileApi(profileData);
      setUser(data.user);
      localStorage.setItem('expensex_user', JSON.stringify(data.user));
      return data.user;
    } catch (err) {
      console.error('Failed to update profile:', err);
      throw err;
    }
  };

  const setAccountPassword = async (password) => {
    try {
      const data = await setPasswordApi(password);
      const updatedUser = {
        ...user,
        hasPassword: true,
        passwordUpdatedAt: data.passwordUpdatedAt || new Date().toISOString(),
      };
      setUser(updatedUser);
      localStorage.setItem('expensex_user', JSON.stringify(updatedUser));
      return data;
    } catch (err) {
      console.error('Failed to set password:', err);
      throw err;
    }
  };

  const sendEmailOtp = async (newEmail) => {
    return await sendEmailOtpApi(newEmail);
  };

  const verifyEmailOtp = async ({ newEmail, otp }) => {
    const data = await verifyEmailOtpApi({ newEmail, otp });
    if (data.user) {
      setUser(data.user);
      localStorage.setItem('expensex_user', JSON.stringify(data.user));
    }
    return data;
  };

  const deleteAccount = async () => {
    try {
      await deleteAccountApi();
    } finally {
      logout();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: Boolean(token && user),
        loginWithEmail,
        loginWithGoogle,
        loginWithFirebase,
        logout,
        deleteAccount,
        updateCurrency,
        updateProfile,
        setAccountPassword,
        sendEmailOtp,
        verifyEmailOtp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
