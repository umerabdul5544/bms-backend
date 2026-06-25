const mongoose = require('mongoose');
const AccountSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, default: 'other' },
  category: { type: String, default: 'Assets' },
  balance: { type: Number, default: 0 },
  description: { type: String, default: '' },
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
module.exports = mongoose.model('Account', AccountSchema);