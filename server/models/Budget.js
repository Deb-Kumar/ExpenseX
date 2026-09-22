import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Please provide a category for the budget'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Please specify the monthly budget limit'],
      min: [1, 'Budget limit must be at least 1'],
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure unique budget per user, category, month, and year
budgetSchema.index({ userId: 1, category: 1, month: 1, year: 1 }, { unique: true });

const Budget = mongoose.models.Budget || mongoose.model('Budget', budgetSchema);

export default Budget;
