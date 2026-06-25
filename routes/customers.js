const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const Customer = require('../models/Customer');

const mapCustomer = (c) => ({
  id: c._id, name: c.name, phone: c.phone,
  address: c.address, balance: c.balance,
  shopId: c.shopId, createdAt: c.createdAt,
});

router.get('/', auth, async (req, res) => {
  try {
    const customers = await Customer.find({ shopId: req.user.id });
    res.json({ customers: customers.map(mapCustomer) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const customer = await Customer.create({ ...req.body, shopId: req.user.id });
    res.json({ customer: mapCustomer(customer) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ customer: mapCustomer(customer) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await Customer.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;