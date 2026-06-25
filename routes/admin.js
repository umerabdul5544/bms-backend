const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const User = require('../models/User');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Customer = require('../models/Customer');

// Get all pending users
router.get('/pending', auth, async (req, res) => {
  try {
    const pending = await User.find({ status: 'pending' }).select('-password');
    const mapped = pending.map(u => ({
      id: u._id,
      email: u.email,
      name: u.name,
      shopName: u.shopName,
      ownerName: u.ownerName || u.name,
      phone: u.phone,
      address: u.address,
      status: u.status,
      createdAt: u.createdAt,
    }));
    res.json({ pending: mapped });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get all approved shops
router.get('/approved', auth, async (req, res) => {
  try {
    const shops = await User.find({
      status: { $in: ['active', 'inactive'] },
      role: { $ne: 'super_admin' }
    }).select('-password');
    const mapped = shops.map(u => ({

      id: u._id,
      email: u.email,
      name: u.name,
      shopName: u.shopName,
      ownerName: u.ownerName || u.name,
      phone: u.phone,
      address: u.address,
      status: u.status,
      createdAt: u.createdAt,
      approvedAt: u.updatedAt,
      subscriptionEndDate: u.subscriptionEndDate || null,
      lastSuspendedAt: u.lastSuspendedAt || null,
      lastReactivatedAt: u.lastReactivatedAt || null,
    }));
    res.json({ shops: mapped });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get all shops
router.get('/', auth, async (req, res) => {
  try {
    const shops = await User.find({ role: { $ne: 'super_admin' } }).select('-password');
    res.json({ shops });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get stats
router.get('/stats', auth, async (req, res) => {
  try {
    const total = await User.countDocuments({ role: { $ne: 'super_admin' } });
    const pending = await User.countDocuments({ status: 'pending' });
    const active = await User.countDocuments({ status: 'active' });
    const inactive = await User.countDocuments({ status: 'inactive' });
    res.json({ total, pending, active, inactive });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Approve shop
router.put('/shops/:id/approve', auth, async (req, res) => {
  try {
    const shop = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'active' },
      { new: true }
    ).select('-password');
    res.json({ shop });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Reject shop
router.put('/shops/:id/reject', auth, async (req, res) => {
  try {
    const shop = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'inactive' },
      { new: true }
    ).select('-password');
    res.json({ shop });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Toggle status suspend/reactivate
router.put('/shops/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    // CORRECT - Plain JavaScript
const updateData = { status };
    if (status === 'inactive') updateData.lastSuspendedAt = new Date();
    if (status === 'active') updateData.lastReactivatedAt = new Date();
    const shop = await User.findByIdAndUpdate(
      req.params.id, updateData, { new: true }
    ).select('-password');
    res.json({ shop });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Extend subscription
router.put('/shops/:id/extend', auth, async (req, res) => {
  try {
    const { days } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const currentEnd = user.subscriptionEndDate
      ? new Date(user.subscriptionEndDate)
      : new Date();

      

    if (currentEnd < new Date()) currentEnd.setTime(new Date().getTime());
    currentEnd.setDate(currentEnd.getDate() + Number(days));

    const shop = await User.findByIdAndUpdate(
      req.params.id,
      { subscriptionEndDate: currentEnd },
      { new: true }
    ).select('-password');

    res.json({ shop });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update shop
router.put('/shops/:id', auth, async (req, res) => {
  try {
    const shop = await User.findByIdAndUpdate(
      req.params.id, req.body, { new: true }
    ).select('-password');
    res.json({ shop });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Delete shop
router.delete('/shops/:id', auth, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;