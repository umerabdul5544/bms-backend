const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name:         { type: String, required: true },
  category:     { type: String },
  unit:         { type: String, default: 'kg' },
  price:        { type: Number, default: 0 },
  costPrice:    { type: Number, default: 0 },
  stock:        { type: Number, default: 0},
  minStock:     { type: Number, default: 0 },
  imageUrl:     { type: String, default: null },
  expiryDate:   { type: Date, default: null },
  shopId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // ✅ Serial number (unique per product)
  serialNumber: { type: String, unique: true, sparse: true },

  // ✅ Barcode (for scanner)
  barcode:      { type: String, unique: true, sparse: true },

}, { timestamps: true });

// ✅ Fast search indexes
productSchema.index({ barcode: 1 });
productSchema.index({ serialNumber: 1 });

module.exports = mongoose.model('Product', productSchema);