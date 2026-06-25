const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name:     { type: String },
  role:     { type: String, enum: ['admin', 'manager', 'salesman', 'super_admin'], default: 'salesman' },
  shopName: { type: String },
  shopId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  phone:    { type: String },
  address:  { type: String },
  ownerName: { type: String },
  status:   { type: String, enum: ['active', 'inactive', 'pending'], default: 'pending' },
  subscriptionEndDate: { type: Date, default: null },
  lastSuspendedAt:     { type: Date, default: null },
  lastReactivatedAt:   { type: Date, default: null },

  // ✅ OTP fields for email verification
  isVerified: { type: Boolean, default: false },
  otp: { type: String },
  otpExpires: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);