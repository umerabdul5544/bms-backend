const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const Ledger = require('../models/Ledger');

router.get('/', auth, async (req, res) => {
  try {
    const ledger = await Ledger.find({ shopId: req.user.id });
    res.json({ ledger });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const entry = await Ledger.create({ ...req.body, shopId: req.user.id });
    res.json({ entry });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/payment', auth, async (req, res) => {
  try {
    const { customerId, amount, description } = req.body;
    const entry = await Ledger.create({ customerId, amount, description, type: 'payment', shopId: req.user.id });
    res.json({ entry });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/supplier-payment', auth, async (req, res) => {
  try {
    const { supplierId, amount, description } = req.body;
    const entry = await Ledger.create({ supplierId, amount, description, type: 'supplier-payment', shopId: req.user.id });
    res.json({ entry });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;