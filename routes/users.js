const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Get all users for the shop (exclude sensitive fields)
router.get('/', auth, async (req, res) => {
  try {
    const users = await User.find({ shopId: req.user.id })
      .select('-password -otp -otpExpires'); // exclude OTP fields as well
    res.json({ users });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create a new user (admin only)
router.post('/', auth, async (req, res) => {
  try {
    const { password, ...rest } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    // New users created by admin are verified by default? Set isVerified true.
    const user = await User.create({ 
      ...rest, 
      password: hashed, 
      shopId: req.user.id,
      isVerified: true  // admin-created users are pre-verified
    });
    const userWithoutSensitive = user.toObject();
    delete userWithoutSensitive.password;
    delete userWithoutSensitive.otp;
    delete userWithoutSensitive.otpExpires;
    res.json({ user: userWithoutSensitive });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update user (admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    // Prevent updating sensitive fields directly
    const updateData = { ...req.body };
    delete updateData.password; // password reset should be separate endpoint
    delete updateData.otp;
    delete updateData.otpExpires;
    delete updateData.isVerified; // prevent admin from changing verification status manually? optional
    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .select('-password -otp -otpExpires');
    res.json({ user });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Delete user
router.delete('/:id', auth, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;