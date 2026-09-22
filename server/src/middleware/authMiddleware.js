import jwt from 'jsonwebtoken';
import { findUserById } from '../services/dataStore.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const secret = process.env.JWT_SECRET || 'expensex_super_secret_jwt_dev_key_2026';
      const decoded = jwt.verify(token, secret);

      const user = await findUserById(decoded.id);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User session not found or expired',
        });
      }

      req.user = user;
      return next();
    } catch (error) {
      console.error('Auth verification error:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired authentication token',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authorization token provided.',
    });
  }
};
