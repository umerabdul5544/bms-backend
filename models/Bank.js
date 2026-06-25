const mongoose = require('mongoose');

const BankSchema = new mongoose.Schema({
  name: { type: String, required: true },
  balance: { type: Number, default: 0 },
  type: { type: String, default: 'bank' },
  category: { type: String, default: 'Assets' },
  description: { type: String, default: '' },
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Bank', BankSchema);