const mongoose = require('mongoose');
const SupplierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contact: { type: String, default: '' },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  balance: { type: Number, default: 0 },
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
module.exports = mongoose.model('Supplier', SupplierSchema);