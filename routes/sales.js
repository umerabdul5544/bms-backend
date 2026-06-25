const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Ledger = require('../models/Ledger');

const toNum = (v) => {
  if (v == null) return 0;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  const n = Number(String(v).replace(/[^0-9.-]+/g, ''));
  return Number.isFinite(n) ? n : 0;
};

const computeSaleTotals = ({ items, discount }) => {
  const safeItems = Array.isArray(items) ? items : [];
  const subtotal = safeItems.reduce((sum, it) => {
    if (!it) return sum;
    const lineTotal = toNum(it.total);
    if (lineTotal > 0) return sum + lineTotal;
    const qty = toNum(it.quantity);
    const price = toNum(it.price);
    return sum + qty * price;
  }, 0);
  const disc = Math.max(0, toNum(discount));
  const total = Math.max(0, subtotal - disc);
  return { subtotal, discount: disc, total };
};

const mapSale = (s) => ({
  id: s._id, customerId: s.customerId, customerName: s.customerName,
  items: s.items, subtotal: s.subtotal, discount: s.discount,
  total: s.total, paymentMethod: s.paymentMethod, amountPaid: s.amountPaid,
  balance: s.balance, soldBy: s.soldBy, date: s.date, status: s.status,
  billNumber: s.billNumber, onlineMethod: s.onlineMethod,
  shopId: s.shopId, createdAt: s.createdAt,
});

router.get('/', auth, async (req, res) => {
  try {
    const sales = await Sale.find({ shopId: req.user.id });
    res.json({ sales: sales.map(mapSale) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 🔍 Search sale by bill number or last 6 chars of ID
router.get('/search', auth, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Search query required' });

    const sales = await Sale.find({ shopId: req.user.id });
    const query = String(q).trim().toUpperCase();

    const matched = sales.filter(s =>
      (s.billNumber && s.billNumber.toUpperCase().includes(query)) ||
      s._id.toString().slice(-6).toUpperCase() === query ||
      s._id.toString().toUpperCase().includes(query)
    );

    res.json({ sales: matched.map(mapSale) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { items, ...saleData } = req.body;

    // ✅ Step 1 — Check stock
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) return res.status(404).json({ error: `Product "${item.productName}" not found` });
      if (product.stock < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}` });
      }
    }

    // ✅ Step 2 — Create sale
    const computed = computeSaleTotals({ items, discount: saleData.discount });
    const finalSubtotal = toNum(saleData.subtotal) > 0 ? toNum(saleData.subtotal) : computed.subtotal;
    const finalDiscount = toNum(saleData.discount) > 0 ? toNum(saleData.discount) : computed.discount;
    const finalTotal = toNum(saleData.total) > 0 ? toNum(saleData.total) : computed.total;
    const finalAmountPaid = toNum(saleData.amountPaid);

    const sale = await Sale.create({
      ...saleData,
      items,
      shopId: req.user.id,
      subtotal: finalSubtotal,
      discount: finalDiscount,
      total: finalTotal,
      amountPaid: finalAmountPaid,
      balance: Math.max(0, finalTotal - finalAmountPaid),
      date: saleData.date || new Date().toISOString().split('T')[0],
      billNumber: saleData.billNumber || `BILL-${Date.now().toString().slice(-8)}`,
    });

    // ✅ Step 3 — Reduce stock
    const updatedProducts = [];
    for (const item of items) {
      const updatedProduct = await Product.findByIdAndUpdate(
        item.productId, { $inc: { stock: -item.quantity } }, { new: true }
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

    // ✅ Step 4 — Create ledger entry
    const paidAmount = finalAmountPaid || 0;
    const balanceDue = finalTotal - paidAmount;
    const methodLabel = saleData.paymentMethod === 'cash' ? 'Cash'
      : saleData.paymentMethod === 'online' ? `Online (${saleData.onlineMethod || 'Digital'})`
      : 'Credit';

    await Ledger.create({
      date: sale.date,
      type: saleData.paymentMethod === 'cash' ? 'cash_sale'
        : saleData.paymentMethod === 'online' ? 'online_sale'
        : 'credit_sale',
      description: `${methodLabel} Sale - ${saleData.customerName}`,
      debit: 0,
      credit: finalTotal,
      balance: finalTotal,
      customerName: saleData.customerName,
      shopId: req.user.id,
    });

    // If partial payment on credit sale, record the payment too
    if (saleData.paymentMethod === 'credit' && paidAmount > 0) {
      await Ledger.create({
        date: sale.date,
        type: 'payment_received',
        description: `Partial Payment - ${saleData.customerName}`,
        debit: paidAmount,
        credit: 0,
        balance: balanceDue,
        customerName: saleData.customerName,
        shopId: req.user.id,
      });
    }

    res.json({ sale: mapSale(sale), updatedProducts });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/return', auth, async (req, res) => {
  try {
    const sale = await Sale.findOne({ _id: req.params.id, shopId: req.user.id });
    if (!sale) return res.status(404).json({ error: 'Sale not found' });
    if (sale.status === 'returned') return res.status(400).json({ error: 'Sale already returned' });

    // ✅ Step 1 — Restore stock for each item
    for (const item of sale.items) {
      await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } });
    }

    // ✅ Step 2 — Mark sale as returned
    sale.status = 'returned';
    await sale.save();

    // ✅ Step 3 — Record refund in Ledger
    await Ledger.create({
      date: new Date().toISOString().split('T')[0],
      type: 'sale_return',
      description: `Refund - ${sale.customerName} (Bill: ${sale.billNumber || sale._id.toString().slice(-6).toUpperCase()})`,
      debit: sale.total,
      credit: 0,
      balance: -sale.total,
      customerName: sale.customerName,
      shopId: req.user.id,
    });

    res.json({ 
      message: 'Sale returned successfully. Stock restored and refund recorded.', 
      sale: mapSale(sale),
      refundAmount: sale.amountPaid,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;