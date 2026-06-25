const mongoose = require('mongoose');
const PurchaseSchema = new mongoose.Schema({
  supplierId: { type: String, default: '' },
  supplierName: { type: String, default: 'Walk-in Supplier' },
  items: { type: Array, default: [] },
  subtotal: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  paymentMethod: { type: String, default: 'cash' },
  amountPaid: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  date: { type: String, default: '' },
  status: { type: String, default: 'completed', enum: ['completed', 'returned'] },
  billNumber: { type: String, default: '' },
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
module.exports = mongoose.model('Purchase', PurchaseSchema);