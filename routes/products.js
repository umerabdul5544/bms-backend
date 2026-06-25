const router = require('express').Router();
const Product = require('../models/Product');
const auth = require('../middleware/authMiddleware');

// ✅ GET all products (WITH LIVE SEARCH)
router.get('/', auth, async (req, res) => {
  try {
    const { search } = req.query;
    let query = { shopId: req.user.id };

    // Agar cashier search bar mein kuch type kare
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } }, // Case-insensitive name search
        { barcode: search },                         // Exact barcode match
        { serialNumber: search }                     // Exact serial number match
      ];
    }

    const products = await Product.find(query);
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ ADD product
router.post('/', auth, async (req, res) => {
  try {
    // Strip empty strings for unique fields — MongoDB treats '' as a real value for unique indexes
    const data = { ...req.body };
    if (!data.serialNumber || data.serialNumber.trim() === '') delete data.serialNumber;
    if (!data.barcode || data.barcode.trim() === '') delete data.barcode;

    const newProduct = new Product({
      ...data,
      shopId: req.user.id
    });
    const saved = await newProduct.save();
    res.json(saved);
  } catch (err) {
    // Handle duplicate key errors (barcode or serialNumber already exists)
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || 'field';
      return res.status(400).json({ message: `A product with this ${field} already exists.` });
    }
    console.error('Product create error:', err);
    res.status(500).json({ message: err.message || 'Failed to add product' });
  }
});

// ✅ UPDATE product
router.put('/:id', auth, async (req, res) => {
  try {
    const data = { ...req.body };
    if (!data.serialNumber || data.serialNumber.trim() === '') data.serialNumber = null;
    if (!data.barcode || data.barcode.trim() === '') data.barcode = null;

    const updated = await Product.findOneAndUpdate(
      { _id: req.params.id, shopId: req.user.id },
      data,
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Product not found' });
    res.json(updated);
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || 'field';
      return res.status(400).json({ message: `A product with this ${field} already exists.` });
    }
    console.error('Product update error:', err);
    res.status(500).json({ message: err.message || 'Failed to update product' });
  }
});

// ✅ DELETE product
router.delete('/:id', auth, async (req, res) => {
  try {
    await Product.findOneAndDelete({
      _id: req.params.id,
      shopId: req.user.id
    });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ SCAN API (For Instant Add to Cart)
router.get('/scan/:code', auth, async (req, res) => {
  try {
    const code = req.params.code.trim();
    const product = await Product.findOne({
      shopId: req.user.id,
      $or: [
        { barcode: code },
        { serialNumber: code }
      ]
    });

    if (!product) {
      return res.json({ product: null });
    }

    res.json({
      product: {
        id: product._id,
        name: product.name,
        price: product.price,
        costPrice: product.costPrice,
        imageUrl: product.imageUrl,
        stock: product.stock,
        barcode: product.barcode,
        serialNumber: product.serialNumber
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;