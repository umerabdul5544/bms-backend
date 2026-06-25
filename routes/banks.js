const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const Bank = require('../models/Bank');

router.get('/', auth, async (req, res) => {
  try {
    const banks = await Bank.find({ shopId: req.user.id });
    const mapped = banks.map(b => ({
      id: b._id,
      name: b.name,
      balance: b.balance,
      type: b.type,
      category: b.category,
      description: b.description,
      qrCode: b.qrCode || null,        // ✅ QR  code  field  added  ((..(.)..(.)..(.)..)) 
      qrCode: b.qrCode || null,        // ✅ QR  code  field  added  ((..(.)..(.)..(.)..)) 
      shopId: b.shopId,                 
      createdAt: b.createdAt,
    }));
    res.json(mapped);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const bank = await Bank.create({ ...req.body, shopId: req.user.id });
    res.json({ id: bank._id, ...bank._doc });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const bank = await Bank.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ id: bank._id, ...bank._doc });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await Bank.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/deposit', auth, async (req, res) => {
  try {
    const { amount, description } = req.body;
    const bank = await Bank.findByIdAndUpdate(
      req.params.id, 
      { $inc: { balance: amount } }, 
      { new: true }
    );
    res.json({ id: bank._id, ...bank._doc });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/withdraw', auth, async (req, res) => {
  try {
    const { amount, description } = req.body;
    const bank = await Bank.findByIdAndUpdate(
      req.params.id, 
      { $inc: { balance: -amount } }, 
      { new: true }
    );
    res.json({ id: bank._id, ...bank._doc });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;