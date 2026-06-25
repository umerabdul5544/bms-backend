const mongoose = require('mongoose');
const AccountTransactionSchema = new mongoose.Schema({
  date: { type: String, default: '' },
  description: { type: String, default: '' },
  debitAccountId: { type: String, default: '' },
  creditAccountId: { type: String, default: '' },
  amount: { type: Number, default: 0 },
  reference: { type: String, default: '' },
  createdBy: { type: String, default: '' },
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
module.exports = mongoose.model('AccountTransaction', AccountTransactionSchema);