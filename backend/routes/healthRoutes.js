import express from 'express';
import { getDatabaseStatus } from '../config/db.js';

const router = express.Router();

// @desc    Get API & database health status
// @route   GET /api/health
// @access  Public
router.get('/', (req, res) => {
  const dbStatus = getDatabaseStatus();

  res.status(200).json({
    status: 'ok',
    appName: 'ExpenseX API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: dbStatus,
    environment: process.env.NODE_ENV || 'development',
  });
});

export default router;
