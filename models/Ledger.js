const mongoose = require('mongoose');
const LedgerSchema = new mongoose.Schema({
  date: { type: String, default: '' },
  type: { type: String, default: '' },
  description: { type: String, default: '' },
  debit: { type: Number, default: 0 },
  credit: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  customerName: { type: String, default: '' },
  supplierName: { type: String, default: '' },
  accountName: { type: String, default: '' },
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
module.exports = mongoose.model('Ledger', LedgerSchema);