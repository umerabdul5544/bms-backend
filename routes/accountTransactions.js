const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const AccountTransaction = require('../models/AccountTransaction');

const mapTransaction = (t) => ({
  id: t._id, date: t.date, description: t.description,
  debitAccountId: t.debitAccountId, creditAccountId: t.creditAccountId,
  amount: t.amount, reference: t.reference, createdBy: t.createdBy,
  shopId: t.shopId, createdAt: t.createdAt,
});

router.get('/', auth, async (req, res) => {
  try {
    const transactions = await AccountTransaction.find({ shopId: req.user.id });
    res.json({ transactions: transactions.map(mapTransaction) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const transaction = await AccountTransaction.create({ ...req.body, shopId: req.user.id });
    res.json({ transaction: mapTransaction(transaction) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await AccountTransaction.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;