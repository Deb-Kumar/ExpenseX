import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
      sparse: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    profilePicture: {
      type: String,
      default: '',
    },
    currency: {
      type: String,
      default: '₹',
    },
    hasPassword: {
      type: Boolean,
      default: false,
    },
    authProvider: {
      type: String,
      enum: ['google', 'firebase', 'email', 'demo'],
      default: 'email',
    },
    password: {
      type: String,
      default: '',
    },
    passwordUpdatedAt: {
      type: Date,
      default: null,
    },
    pendingEmail: {
      type: String,
      default: '',
    },
    emailOtp: {
      type: String,
      default: '',
    },
    emailOtpExpires: {
      type: Date,
      default: null,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook: automatically encrypt password with bcrypt before saving to database
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  // If already a bcrypt hash ($2a$ or $2b$), do not re-hash
  if (/^\$2[abxy]\$\d+\$/.test(this.password)) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method to verify an entered password against the stored bcrypt hash
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  if (/^\$2[abxy]\$\d+\$/.test(this.password)) {
    return await bcrypt.compare(enteredPassword, this.password);
  }
  // Plaintext comparison for older records, then upgrade to bcrypt hash
  return this.password === enteredPassword;
};

// Prevent re-compilation in dev environments with hot reload
const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
