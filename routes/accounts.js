const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const Account = require('../models/Account');

const mapAccount = (a) => ({
  id: a._id, name: a.name, type: a.type, category: a.category,
  balance: a.balance, description: a.description,
  shopId: a.shopId, createdAt: a.createdAt,
});

router.get('/', auth, async (req, res) => {
  try {
    const accounts = await Account.find({ shopId: req.user.id });
    res.json({ accounts: accounts.map(mapAccount) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const account = await Account.create({ ...req.body, shopId: req.user.id });
    res.json({ account: mapAccount(account) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const account = await Account.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ account: mapAccount(account) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await Account.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;