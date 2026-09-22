import express from 'express';
import {
  getMyBudgets,
  createOrUpdateBudget,
  deleteBudgetById,
} from '../controllers/budgetController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // All budget routes are private

router.route('/')
  .get(getMyBudgets)
  .post(createOrUpdateBudget);

router.route('/:id')
  .delete(deleteBudgetById);

export default router;
