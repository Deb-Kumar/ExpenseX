import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import { connectDB } from './config/db.js';
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import budgetRoutes from './routes/budgetRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

// Load environment variables from .env
dotenv.config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Connect to MongoDB Atlas
connectDB();

const allowedOrigins = [
  process.env.CLIENT_URL,
  'https://expensex-finance.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
].filter(Boolean);

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        process.env.NODE_ENV !== 'production'
      ) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to ExpenseX API',
    documentation: '/api/health',
    status: 'online',
  });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start listening
app.listen(PORT, () => {
  console.log(`\n🚀 ExpenseX Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`🔗 API Base: http://localhost:${PORT}/api`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/api/health\n`);
});

export default app;
