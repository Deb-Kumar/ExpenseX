import express from 'express';
import {
  getMyTransactions,
  getFinancialSummary,
  createNewTransaction,
  updateTransactionById,
  deleteTransactionById,
} from '../controllers/transactionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // All transaction routes are private

router.route('/')
  .get(getMyTransactions)
  .post(createNewTransaction);

router.get('/summary', getFinancialSummary);

router.route('/:id')
  .put(updateTransactionById)
  .delete(deleteTransactionById);

export default router;
