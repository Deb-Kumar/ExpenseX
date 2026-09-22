import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import { connectDB } from './src/config/db.js';
import healthRoutes from './src/routes/healthRoutes.js';
import authRoutes from './src/routes/authRoutes.js';
import transactionRoutes from './src/routes/transactionRoutes.js';
import budgetRoutes from './src/routes/budgetRoutes.js';
import { notFound, errorHandler } from './src/middleware/errorMiddleware.js';

// Load environment variables from .env
dotenv.config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Connect to MongoDB Atlas
connectDB();

// Middleware to ensure DB connection before handling serverless requests
app.use(async (req, res, next) => {
  if (process.env.MONGO_URI) {
    await connectDB();
  }
  next();
});

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);
      // Allow localhost, client URL, or any vercel.app deployment
      if (
        origin === CLIENT_URL ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1') ||
        origin.endsWith('.vercel.app')
      ) {
        return callback(null, true);
      }
      return callback(null, true);
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

// Export for serverless environments (Vercel)
export default app;

// Start listening if not running in a serverless environment
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n🚀 ExpenseX Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`🔗 API Base: http://localhost:${PORT}/api`);
    console.log(`🔗 Health Check: http://localhost:${PORT}/api/health\n`);
  });
}
