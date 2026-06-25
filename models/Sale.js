const mongoose = require('mongoose');
const SaleSchema = new mongoose.Schema({
  customerId: { type: String, default: '' },
  customerName: { type: String, default: '' },
  items: { type: Array, default: [] },
  subtotal: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  paymentMethod: { type: String, default: 'cash', enum: ['cash', 'credit', 'online'] },
  onlineMethod: { type: String, default: '' }, // easypaisa, jazzcash, bank_transfer, etc.
  amountPaid: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  soldBy: { type: String, default: '' },
  date: { type: String, default: '' },
  billNumber: { type: String, default: '' },
  status: { type: String, default: 'completed', enum: ['completed', 'returned'] },
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
module.exports = mongoose.model('Sale', SaleSchema);