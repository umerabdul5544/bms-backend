const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const Supplier = require('../models/Supplier');

const mapSupplier = (s) => ({
  id: s._id, name: s.name, contact: s.contact,
  phone: s.phone, address: s.address, balance: s.balance,
  shopId: s.shopId, createdAt: s.createdAt,
});

router.get('/', auth, async (req, res) => {
  try {
    const suppliers = await Supplier.find({ shopId: req.user.id });
    res.json({ suppliers: suppliers.map(mapSupplier) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const supplier = await Supplier.create({ ...req.body, shopId: req.user.id });
    res.json({ supplier: mapSupplier(supplier) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ supplier: mapSupplier(supplier) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await Supplier.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;