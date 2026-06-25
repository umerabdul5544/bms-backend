const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const Purchase = require('../models/Purchase');
const Product = require('../models/Product');
const Ledger = require('../models/Ledger');

const mapPurchase = (p) => ({
  id: p._id, supplierId: p.supplierId, supplierName: p.supplierName,
  items: p.items, subtotal: p.subtotal, discount: p.discount,
  total: p.total, paymentMethod: p.paymentMethod, amountPaid: p.amountPaid,
  balance: p.balance, date: p.date, status: p.status, shopId: p.shopId, createdAt: p.createdAt,
});

router.get('/', auth, async (req, res) => {
  try {
    const purchases = await Purchase.find({ shopId: req.user.id });
    res.json({ purchases: purchases.map(mapPurchase) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { items, ...purchaseData } = req.body;

    // ✅ Step 1 — Create purchase (supplier is optional)
    const billNumber = `PO-${Date.now().toString().slice(-8)}`;
    const purchase = await Purchase.create({
      ...purchaseData,
      items,
      shopId: req.user.id,
      supplierName: purchaseData.supplierName || 'Walk-in Supplier',
      date: purchaseData.date || new Date().toISOString().split('T')[0],
      billNumber,
    });

    // ✅ Step 2 — Increase stock
    const updatedProducts = [];
    for (const item of items) {
      const updatedProduct = await Product.findByIdAndUpdate(
        item.productId, { $inc: { stock: item.quantity } }, { new: true }
      );
      if (updatedProduct) {
        updatedProducts.push({
          id: updatedProduct._id,
          name: updatedProduct.name,
          stock: updatedProduct.stock,
          minStock: updatedProduct.minStock,
        });
      }
    }

    // ✅ Step 3 — Create ledger entry
    await Ledger.create({
      date: purchase.date,
      type: 'purchase',
      description: `Purchase (${billNumber}) - ${purchase.supplierName}`,
      debit: purchaseData.total,
      credit: 0,
      balance: -purchaseData.total,
      supplierName: purchase.supplierName,
      shopId: req.user.id,
    });

    res.json({ purchase: mapPurchase(purchase), updatedProducts });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 🔍 Search purchase by bill number
router.get('/search', auth, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Search query required' });

    const purchases = await Purchase.find({ shopId: req.user.id });
    const query = String(q).trim().toUpperCase();

    const matched = purchases.filter(p =>
      (p.billNumber && p.billNumber.toUpperCase().includes(query)) ||
      p._id.toString().slice(-6).toUpperCase() === query ||
      p._id.toString().toUpperCase().includes(query)
    );

    res.json({ purchases: matched.map(mapPurchase) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ↩️ Return a purchase (reduce stock, mark returned, ledger entry)
router.post('/:id/return', auth, async (req, res) => {
  try {
    const purchase = await Purchase.findOne({ _id: req.params.id, shopId: req.user.id });
    if (!purchase) return res.status(404).json({ error: 'Purchase not found' });
    if (purchase.status === 'returned') return res.status(400).json({ error: 'Purchase already returned' });

    // ✅ Step 1 — Reduce stock (reverse the purchase)
    for (const item of purchase.items) {
      await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } });
    }

    // ✅ Step 2 — Mark as returned
    purchase.status = 'returned';
    await purchase.save();

    // ✅ Step 3 — Record in Ledger
    await Ledger.create({
      date: new Date().toISOString().split('T')[0],
      type: 'purchase_return',
      description: `Purchase Return (${purchase.billNumber || purchase._id.toString().slice(-6).toUpperCase()}) - ${purchase.supplierName}`,
      debit: 0,
      credit: purchase.total,
      balance: purchase.total,
      supplierName: purchase.supplierName,
      shopId: req.user.id,
    });

    res.json({
      message: 'Purchase returned successfully. Stock reduced and credit recorded.',
      purchase: mapPurchase(purchase),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;