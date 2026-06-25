const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const Account = require('../models/Account');
const Bank = require('../models/Bank');

router.get('/', auth, async (req, res) => {
  try {
    const accounts = await Account.find({ shopId: req.user.id });
    const banks = await Bank.find({ shopId: req.user.id });
    res.json({ accounts, banks });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;