import express from 'express';
import {
  loginWithGoogle,
  loginWithFirebase,
  loginWithEmail,
  getMe,
  updateCurrency,
  updateProfile,
  setPassword,
  verifyPassword,
  sendEmailOtp,
  verifyEmailOtp,
  deleteAccount,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', loginWithEmail);
router.post('/google', loginWithGoogle);
router.post('/firebase', loginWithFirebase);
router.get('/me', protect, getMe);
router.put('/currency', protect, updateCurrency);
router.put('/profile', protect, updateProfile);
router.put('/set-password', protect, setPassword);
router.post('/verify-password', protect, verifyPassword);
router.post('/send-email-otp', protect, sendEmailOtp);
router.post('/verify-email-otp', protect, verifyEmailOtp);
router.delete('/account', protect, deleteAccount);

export default router;
