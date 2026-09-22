import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';

// In-memory storage for development fallback when MongoDB Atlas is not yet connected
const memUsers = new Map();
const memTransactions = new Map();
const memBudgets = new Map();

// Helper to check if Mongoose is connected to MongoDB
export const isMongoConnected = () => mongoose.connection.readyState === 1;

// ================= USER OPERATIONS =================
export const findUserById = async (id) => {
  if (isMongoConnected()) {
    return await User.findById(id);
  }
  return memUsers.get(id.toString()) || null;
};

export const findUserByEmail = async (email) => {
  if (isMongoConnected()) {
    return await User.findOne({ email: email.toLowerCase() });
  }
  for (const user of memUsers.values()) {
    if (user.email.toLowerCase() === email.toLowerCase()) {
      return user;
    }
  }
  return null;
};

export const findUserByGoogleId = async (googleId) => {
  if (isMongoConnected()) {
    return await User.findOne({ googleId });
  }
  for (const user of memUsers.values()) {
    if (user.googleId === googleId) {
      return user;
    }
  }
  return null;
};

export const createOrUpdateUser = async ({
  googleId,
  name,
  email,
  profilePicture,
  authProvider = 'email',
  hasPassword = false,
  password,
  isEmailVerified,
}) => {
  const isGoogle = authProvider === 'google' || Boolean(googleId && !googleId.startsWith('firebase-'));
  const shouldVerifyEmail = isGoogle || isEmailVerified === true;

  if (isMongoConnected()) {
    let user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      if (googleId) user.googleId = googleId;
      if (profilePicture && !user.profilePicture) user.profilePicture = profilePicture;
      if (name) user.name = name;
      if (authProvider) user.authProvider = authProvider;
      if (password && !user.password) {
        user.password = password;
        user.hasPassword = true;
        user.passwordUpdatedAt = new Date();
      }
      if (shouldVerifyEmail) {
        user.isEmailVerified = true;
      }
      await user.save();
      return user;
    }
    return await User.create({
      googleId,
      name,
      email: email.toLowerCase(),
      profilePicture: profilePicture || '',
      currency: '₹',
      authProvider,
      hasPassword: Boolean(password || hasPassword),
      password: password || '',
      passwordUpdatedAt: (password || hasPassword) ? new Date() : null,
      isEmailVerified: shouldVerifyEmail,
    });
  }

  // Fallback in-memory
  let existing = await findUserByEmail(email);
  if (existing) {
    existing.name = name || existing.name;
    if (profilePicture && !existing.profilePicture) existing.profilePicture = profilePicture;
    existing.googleId = googleId || existing.googleId;
    if (authProvider) existing.authProvider = authProvider;
    if (shouldVerifyEmail) {
      existing.isEmailVerified = true;
    }
    existing.updatedAt = new Date();
    memUsers.set(existing._id.toString(), existing);
    return existing;
  }

  const newId = new mongoose.Types.ObjectId().toString();
  const newUser = {
    _id: newId,
    googleId: googleId || `local-${Date.now()}`,
    name,
    email: email.toLowerCase(),
    profilePicture: profilePicture || '',
    currency: '₹',
    authProvider,
    hasPassword,
    passwordUpdatedAt: hasPassword ? new Date() : null,
    isEmailVerified: shouldVerifyEmail,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  memUsers.set(newId, newUser);
  return newUser;
};

export const setUserEmailOtp = async (userId, { newEmail, otp, expires }) => {
  if (isMongoConnected()) {
    const user = await User.findById(userId);
    if (!user) return null;
    if (user.authProvider === 'google' || user.googleId) {
      const error = new Error('Email address cannot be modified for accounts authenticated via Google.');
      error.statusCode = 403;
      throw error;
    }
    user.pendingEmail = newEmail.toLowerCase();
    user.emailOtp = otp;
    user.emailOtpExpires = expires;
    await user.save();
    return user;
  }

  const user = memUsers.get(userId.toString());
  if (!user) return null;
  if (user.authProvider === 'google' || user.googleId) {
    const error = new Error('Email address cannot be modified for accounts authenticated via Google.');
    error.statusCode = 403;
    throw error;
  }
  user.pendingEmail = newEmail.toLowerCase();
  user.emailOtp = otp;
  user.emailOtpExpires = expires;
  user.updatedAt = new Date();
  return user;
};

export const verifyUserEmailOtp = async (userId, { newEmail, otp }) => {
  if (isMongoConnected()) {
    const user = await User.findById(userId);
    if (!user) return { success: false, message: 'User not found' };
    if (user.authProvider === 'google' || user.googleId) {
      return { success: false, message: 'Email address cannot be modified for accounts authenticated via Google.' };
    }
    if (!user.pendingEmail || user.pendingEmail.toLowerCase() !== newEmail.toLowerCase()) {
      return { success: false, message: 'Invalid verification session for this email' };
    }
    if (user.emailOtp !== otp) {
      return { success: false, message: 'Incorrect OTP code. Please try again.' };
    }
    if (new Date() > new Date(user.emailOtpExpires)) {
      return { success: false, message: 'OTP code has expired. Please request a new code.' };
    }
    // Commit new verified email immediately to database
    user.email = user.pendingEmail.toLowerCase();
    user.pendingEmail = '';
    user.emailOtp = '';
    user.emailOtpExpires = null;
    user.isEmailVerified = true;
    await user.save();
    return { success: true, user };
  }

  const user = memUsers.get(userId.toString());
  if (!user) return { success: false, message: 'User not found' };
  if (user.authProvider === 'google' || user.googleId) {
    return { success: false, message: 'Email address cannot be modified for accounts authenticated via Google.' };
  }
  if (!user.pendingEmail || user.pendingEmail.toLowerCase() !== newEmail.toLowerCase()) {
    return { success: false, message: 'Invalid verification session for this email' };
  }
  if (user.emailOtp !== otp) {
    return { success: false, message: 'Incorrect OTP code. Please try again.' };
  }
  if (new Date() > new Date(user.emailOtpExpires)) {
    return { success: false, message: 'OTP code has expired. Please request a new code.' };
  }
  user.email = user.pendingEmail.toLowerCase();
  user.pendingEmail = '';
  user.emailOtp = '';
  user.emailOtpExpires = null;
  user.isEmailVerified = true;
  user.updatedAt = new Date();
  return { success: true, user };
};

export const updateUserProfile = async (userId, { name, profilePicture, email }) => {
  if (isMongoConnected()) {
    const user = await User.findById(userId);
    if (!user) return null;
    if (name) user.name = name.trim();
    if (profilePicture !== undefined) user.profilePicture = profilePicture;
    if (email && email.toLowerCase() !== user.email.toLowerCase()) {
      if (user.authProvider === 'google' || user.googleId) {
        const error = new Error('Email address cannot be modified for accounts authenticated via Google.');
        error.statusCode = 403;
        throw error;
      }
      if (!user.isEmailVerified || (user.pendingEmail && user.pendingEmail !== email.toLowerCase())) {
        const error = new Error('New email address must be verified with OTP before saving.');
        error.statusCode = 400;
        throw error;
      }
      user.email = email.toLowerCase();
      user.pendingEmail = '';
      user.emailOtp = '';
      user.emailOtpExpires = null;
      user.isEmailVerified = true;
    } else {
      if (user.authProvider === 'google' || user.isEmailVerified) {
        user.isEmailVerified = true;
      }
    }
    await user.save();
    return user;
  }

  const user = memUsers.get(userId.toString());
  if (!user) return null;
  if (name) user.name = name.trim();
  if (profilePicture !== undefined) user.profilePicture = profilePicture;
  if (email && email.toLowerCase() !== user.email.toLowerCase()) {
    if (user.authProvider === 'google' || user.googleId) {
      const error = new Error('Email address cannot be modified for accounts authenticated via Google.');
      error.statusCode = 403;
      throw error;
    }
    if (!user.isEmailVerified || (user.pendingEmail && user.pendingEmail !== email.toLowerCase())) {
      const error = new Error('New email address must be verified with OTP before saving.');
      error.statusCode = 400;
      throw error;
    }
    user.email = email.toLowerCase();
    user.pendingEmail = '';
    user.emailOtp = '';
    user.emailOtpExpires = null;
    user.isEmailVerified = true;
  } else {
    if (user.authProvider === 'google' || user.isEmailVerified) {
      user.isEmailVerified = true;
    }
  }
  user.updatedAt = new Date();
  return user;
};

export const setUserPassword = async (userId, password) => {
  const now = new Date();
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  if (isMongoConnected()) {
    const user = await User.findById(userId);
    if (!user) return null;
    user.password = hashedPassword;
    user.hasPassword = true;
    user.passwordUpdatedAt = now;
    await user.save();
    return user;
  }

  const user = memUsers.get(userId.toString());
  if (!user) return null;
  user.password = hashedPassword;
  user.hasPassword = true;
  user.passwordUpdatedAt = now;
  user.updatedAt = now;
  return user;
};

export const verifyUserPassword = async (userId, enteredPassword) => {
  if (!enteredPassword) return false;

  let user = null;
  if (isMongoConnected()) {
    user = await User.findById(userId);
  } else {
    user = memUsers.get(userId.toString());
  }

  if (!user || !user.password) return false;

  // Check if bcrypt hash
  if (/^\$2[abxy]\$\d+\$/.test(user.password)) {
    return await bcrypt.compare(enteredPassword, user.password);
  }

  // Plaintext comparison for older passwords + auto-upgrade to bcrypt hash
  if (user.password === enteredPassword) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(enteredPassword, salt);
    if (isMongoConnected()) {
      await user.save();
    }
    return true;
  }

  return false;
};

// Automatically encrypt any existing legacy plaintext passwords on startup
export const encryptLegacyPlaintextPasswords = async () => {
  if (!isMongoConnected()) return;
  try {
    const users = await User.find({ password: { $exists: true, $ne: '' } });
    let updatedCount = 0;
    for (const user of users) {
      if (user.password && !/^\$2[abxy]\$\d+\$/.test(user.password)) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
        await user.save();
        updatedCount++;
      }
    }
    if (updatedCount > 0) {
      console.log(`🔒 Encrypted ${updatedCount} legacy plaintext password(s) with bcrypt in ExpenseX database.`);
    }
  } catch (err) {
    console.error('Password encryption migration notice:', err.message);
  }
};

// Automatically sync email verification status for Google accounts and verified emails
export const syncEmailVerificationStatus = async () => {
  if (!isMongoConnected()) return;
  try {
    const result = await User.updateMany(
      {
        $or: [
          { authProvider: 'google' },
          { googleId: { $exists: true, $ne: null, $ne: '' } },
        ],
        isEmailVerified: { $ne: true },
      },
      { $set: { isEmailVerified: true } }
    );
    if (result.modifiedCount > 0) {
      console.log(`✉️ Synced and verified email status for ${result.modifiedCount} Google user account(s) in ExpenseX database.`);
    }
  } catch (err) {
    console.error('Email verification sync notice:', err.message);
  }
};

// ================= TRANSACTION OPERATIONS =================
export const getTransactions = async (userId, query = {}) => {
  const { type, category, paymentMethod, startDate, endDate, search, limit = 100, page = 1 } = query;

  if (isMongoConnected()) {
    const filter = { userId };
    if (type && type !== 'all') filter.type = type;
    if (category && category !== 'all') filter.category = category;
    if (paymentMethod && paymentMethod !== 'all') filter.paymentMethod = paymentMethod;

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await Transaction.countDocuments(filter);
    const transactions = await Transaction.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    return { total, transactions };
  }

  // In-memory fallback
  let list = Array.from(memTransactions.values()).filter(
    (t) => t.userId.toString() === userId.toString()
  );

  if (type && type !== 'all') list = list.filter((t) => t.type === type);
  if (category && category !== 'all') list = list.filter((t) => t.category === category);
  if (paymentMethod && paymentMethod !== 'all') list = list.filter((t) => t.paymentMethod === paymentMethod);
  if (startDate) list = list.filter((t) => new Date(t.date) >= new Date(startDate));
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    list = list.filter((t) => new Date(t.date) <= end);
  }
  if (search) {
    const s = search.toLowerCase();
    list = list.filter(
      (t) =>
        (t.title && t.title.toLowerCase().includes(s)) ||
        (t.description && t.description.toLowerCase().includes(s)) ||
        (t.category && t.category.toLowerCase().includes(s)) ||
        (t.notes && t.notes.toLowerCase().includes(s))
    );
  }

  list.sort((a, b) => new Date(b.date) - new Date(a.date));
  const total = list.length;
  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const transactions = list.slice(skip, skip + parseInt(limit, 10));

  return { total, transactions };
};

export const createTransaction = async (userId, data) => {
  if (isMongoConnected()) {
    return await Transaction.create({
      ...data,
      userId,
    });
  }

  const id = new mongoose.Types.ObjectId().toString();
  const tx = {
    _id: id,
    userId: userId.toString(),
    type: data.type,
    amount: Number(data.amount),
    category: data.category,
    description: data.description || '',
    paymentMethod: data.paymentMethod || 'UPI',
    date: data.date ? new Date(data.date) : new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  memTransactions.set(id, tx);
  return tx;
};

export const updateTransaction = async (id, userId, data) => {
  if (isMongoConnected()) {
    return await Transaction.findOneAndUpdate(
      { _id: id, userId },
      { $set: data },
      { new: true, runValidators: true }
    );
  }

  const tx = memTransactions.get(id.toString());
  if (!tx || tx.userId.toString() !== userId.toString()) return null;

  const updated = {
    ...tx,
    ...data,
    amount: data.amount !== undefined ? Number(data.amount) : tx.amount,
    date: data.date ? new Date(data.date) : tx.date,
    updatedAt: new Date(),
  };
  memTransactions.set(id.toString(), updated);
  return updated;
};

export const deleteTransaction = async (id, userId) => {
  if (isMongoConnected()) {
    return await Transaction.findOneAndDelete({ _id: id, userId });
  }

  const tx = memTransactions.get(id.toString());
  if (!tx || tx.userId.toString() !== userId.toString()) return null;
  memTransactions.delete(id.toString());
  return tx;
};

export const getTransactionById = async (id, userId) => {
  if (isMongoConnected()) {
    return await Transaction.findOne({ _id: id, userId });
  }
  const tx = memTransactions.get(id.toString());
  if (!tx || tx.userId.toString() !== userId.toString()) return null;
  return tx;
};

export const calculateUserNetBalance = async (userId) => {
  if (isMongoConnected()) {
    const txs = await Transaction.find({ userId }).select('type amount').lean();
    let income = 0;
    let expense = 0;
    for (const t of txs) {
      if (t.type === 'income') income += Number(t.amount);
      else if (t.type === 'expense') expense += Number(t.amount);
    }
    return income - expense;
  }

  // In-memory fallback
  let income = 0;
  let expense = 0;
  for (const t of memTransactions.values()) {
    if (t.userId.toString() === userId.toString()) {
      if (t.type === 'income') income += Number(t.amount);
      else if (t.type === 'expense') expense += Number(t.amount);
    }
  }
  return income - expense;
};

// ================= BUDGET OPERATIONS =================
export const getBudgets = async (userId, month, year) => {
  if (isMongoConnected()) {
    const filter = { userId };
    if (month) filter.month = Number(month);
    if (year) filter.year = Number(year);
    return await Budget.find(filter).sort({ category: 1 });
  }

  return Array.from(memBudgets.values()).filter((b) => {
    if (b.userId.toString() !== userId.toString()) return false;
    if (month && Number(b.month) !== Number(month)) return false;
    if (year && Number(b.year) !== Number(year)) return false;
    return true;
  });
};

export const setBudget = async (userId, { category, amount, month, year }) => {
  const m = Number(month);
  const y = Number(year);
  const amt = Number(amount);

  if (isMongoConnected()) {
    return await Budget.findOneAndUpdate(
      { userId, category, month: m, year: y },
      { $set: { amount: amt } },
      { upsert: true, new: true, runValidators: true }
    );
  }

  const key = `${userId}_${category}_${m}_${y}`;
  let existing = null;
  for (const b of memBudgets.values()) {
    if (b.userId.toString() === userId.toString() && b.category === category && b.month === m && b.year === y) {
      existing = b;
      break;
    }
  }

  if (existing) {
    existing.amount = amt;
    existing.updatedAt = new Date();
    memBudgets.set(existing._id.toString(), existing);
    return existing;
  }

  const id = new mongoose.Types.ObjectId().toString();
  const b = {
    _id: id,
    userId: userId.toString(),
    category,
    amount: amt,
    month: m,
    year: y,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  memBudgets.set(id, b);
  return b;
};

export const deleteBudget = async (id, userId) => {
  if (isMongoConnected()) {
    return await Budget.findOneAndDelete({ _id: id, userId });
  }

  const b = memBudgets.get(id.toString());
  if (!b || b.userId.toString() !== userId.toString()) return null;
  memBudgets.delete(id.toString());
  return b;
};
