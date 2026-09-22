import jwt from 'jsonwebtoken';
import {
  createOrUpdateUser,
  findUserById,
  findUserByEmail,
  updateUserProfile,
  setUserPassword,
  verifyUserPassword,
  setUserEmailOtp,
  verifyUserEmailOtp,
  getTransactions,
  deleteUserData,
} from '../services/dataStore.js';
import { verifyGoogleToken } from '../services/googleAuth.js';
import { sendVerificationOtpEmail } from '../services/emailService.js';

// Helper to generate JWT token
const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET || 'expensex_super_secret_jwt_dev_key_2026';
  return jwt.sign({ id: userId.toString() }, secret, {
    expiresIn: '30d',
  });
};

// @desc    Authenticate with Google OAuth token
// @route   POST /api/auth/google
// @access  Public
export const loginWithGoogle = async (req, res, next) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Google credential token is required',
      });
    }

    const googlePayload = await verifyGoogleToken(credential);
    const user = await createOrUpdateUser({
      ...googlePayload,
      authProvider: 'google',
      isEmailVerified: true,
    });
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Successfully authenticated with Google',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        currency: user.currency || '₹',
        hasPassword: Boolean(user.hasPassword),
        passwordUpdatedAt: user.passwordUpdatedAt || null,
        authProvider: user.authProvider || 'google',
        isEmailVerified: true,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Google authentication failed',
    });
  }
};

// @desc    Authenticate with Firebase Google credentials
// @route   POST /api/auth/firebase
// @access  Public
export const loginWithFirebase = async (req, res, next) => {
  try {
    const { googleId, name, email, profilePicture, authProvider, hasPassword, password } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required from Firebase authentication',
      });
    }

    const provider = authProvider || (googleId?.startsWith('firebase-') ? 'email' : 'google');
    const isGoogle = provider === 'google';

    const user = await createOrUpdateUser({
      googleId: googleId || `firebase-${Date.now()}`,
      name: name || 'User',
      email: email.toLowerCase(),
      profilePicture: profilePicture || '',
      authProvider: provider,
      hasPassword: hasPassword !== undefined ? hasPassword : Boolean(password || provider === 'email'),
      password: password || undefined,
      isEmailVerified: isGoogle ? true : undefined,
    });

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Successfully authenticated via Firebase',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        currency: user.currency || '₹',
        hasPassword: Boolean(user.hasPassword),
        passwordUpdatedAt: user.passwordUpdatedAt || null,
        authProvider: user.authProvider || provider,
        isEmailVerified: Boolean(user.isEmailVerified),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate with email and master password
// @route   POST /api/auth/login
// @access  Public
export const loginWithEmail = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await findUserByEmail(cleanEmail);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'No account found with this email address.',
      });
    }

    if (!user.hasPassword || !user.password) {
      return res.status(400).json({
        success: false,
        message:
          'This account was created with Google and has no master password set yet. Please sign in with Google first, then set your master password in Settings.',
      });
    }

    const isMatch = await verifyUserPassword(user._id, password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password. Please try again.',
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Successfully signed in',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        currency: user.currency || '₹',
        hasPassword: Boolean(user.hasPassword),
        passwordUpdatedAt: user.passwordUpdatedAt || null,
        authProvider: user.authProvider || 'email',
        isEmailVerified: Boolean(user.isEmailVerified),
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current authenticated user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    user: {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      profilePicture: req.user.profilePicture,
      currency: req.user.currency || '₹',
      hasPassword: Boolean(req.user.hasPassword),
      passwordUpdatedAt: req.user.passwordUpdatedAt || null,
      authProvider: req.user.authProvider || 'email',
      isEmailVerified: Boolean(req.user.isEmailVerified),
      createdAt: req.user.createdAt,
    },
  });
};

// @desc    Send OTP to new email address for verification
// @route   POST /api/auth/send-email-otp
// @access  Private
export const sendEmailOtp = async (req, res, next) => {
  try {
    if (req.user.authProvider === 'google' || req.user.googleId) {
      return res.status(403).json({
        success: false,
        message: 'Email address cannot be modified for accounts authenticated via Google.',
      });
    }

    const { newEmail } = req.body;

    if (!newEmail || !newEmail.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    const cleanEmail = newEmail.trim().toLowerCase();

    if (cleanEmail === req.user.email.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: 'The new email is the same as your current email.',
      });
    }

    // Check if email already registered to someone else
    const existing = await findUserByEmail(cleanEmail);
    if (existing && existing._id.toString() !== req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'This email address is already associated with another account.',
      });
    }

    // Generate 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await setUserEmailOtp(req.user._id, {
      newEmail: cleanEmail,
      otp,
      expires,
    });

    // Send email via Nodemailer
    await sendVerificationOtpEmail({
      toEmail: cleanEmail,
      otp,
      userName: req.user.name || 'User',
    });

    res.status(200).json({
      success: true,
      message: `A 6-digit verification code has been sent to ${cleanEmail}.`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify OTP for pending email change
// @route   POST /api/auth/verify-email-otp
// @access  Private
export const verifyEmailOtp = async (req, res, next) => {
  try {
    if (req.user.authProvider === 'google' || req.user.googleId) {
      return res.status(403).json({
        success: false,
        message: 'Email address cannot be modified for accounts authenticated via Google.',
      });
    }

    const { newEmail, otp } = req.body;

    if (!newEmail || !otp) {
      return res.status(400).json({
        success: false,
        message: 'New email and 6-digit verification code are required.',
      });
    }

    const cleanEmail = newEmail.trim().toLowerCase();
    const cleanOtp = otp.toString().trim();

    const result = await verifyUserEmailOtp(req.user._id, {
      newEmail: cleanEmail,
      otp: cleanOtp,
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Email address verified and updated successfully in database!',
      user: {
        _id: result.user._id,
        name: result.user.name,
        email: result.user.email,
        profilePicture: result.user.profilePicture,
        currency: result.user.currency || '₹',
        hasPassword: Boolean(result.user.hasPassword),
        passwordUpdatedAt: result.user.passwordUpdatedAt || null,
        authProvider: result.user.authProvider || 'email',
        isEmailVerified: Boolean(result.user.isEmailVerified),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile details (name, avatar, verified email)
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res, next) => {
  try {
    const { name, profilePicture, email } = req.body;
    const isGoogleAccount = req.user.authProvider === 'google' || Boolean(req.user.googleId);

    if (isGoogleAccount && email && email.toLowerCase() !== req.user.email.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: 'Email address cannot be modified for accounts authenticated via Google.',
      });
    }

    const updatedUser = await updateUserProfile(req.user._id, {
      name,
      profilePicture,
      email: isGoogleAccount ? undefined : (email ? email.trim().toLowerCase() : undefined),
    });

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        profilePicture: updatedUser.profilePicture,
        currency: updatedUser.currency || '₹',
        hasPassword: Boolean(updatedUser.hasPassword),
        passwordUpdatedAt: updatedUser.passwordUpdatedAt || null,
        authProvider: updatedUser.authProvider || 'email',
        isEmailVerified: Boolean(updatedUser.isEmailVerified),
      },
    });
  } catch (error) {
    res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || 'Failed to update profile',
    });
  }
};

// @desc    Set password for account (e.g. Google OAuth user)
// @route   PUT /api/auth/set-password
// @access  Private
export const setPassword = async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    const updatedUser = await setUserPassword(req.user._id, password);

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Account password set successfully',
      hasPassword: true,
      passwordUpdatedAt: updatedUser.passwordUpdatedAt || new Date(),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update currency preference
// @route   PUT /api/auth/currency
// @access  Private
export const updateCurrency = async (req, res, next) => {
  try {
    const { currency } = req.body;
    if (!currency) {
      return res.status(400).json({ success: false, message: 'Currency is required' });
    }

    req.user.currency = currency;
    if (typeof req.user.save === 'function') {
      await req.user.save();
    }

    res.status(200).json({
      success: true,
      currency: req.user.currency,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify master password for sensitive operations (e.g. transaction deletion)
// @route   POST /api/auth/verify-password
// @access  Private
export const verifyPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required for authorization',
      });
    }

    const isValid = await verifyUserPassword(req.user._id, password);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password. Authorization failed.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Password verified successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Permanently delete account and all associated data
// @route   DELETE /api/auth/account
// @access  Private
export const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    await deleteUserData(userId);

    res.status(200).json({
      success: true,
      message: 'Your account and all associated financial records have been permanently deleted.',
    });
  } catch (error) {
    next(error);
  }
};

