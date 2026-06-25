const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendOTP } = require('../services/emailService');
const authMiddleware = require('../middleware/authMiddleware');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

global.tempOTPStore = global.tempOTPStore || new Map();

// Send OTP (unchanged)
router.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Email already registered' });

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    global.tempOTPStore.set(email, { otp, otpExpires });
    await sendOTP(email, otp);

    res.json({ message: 'OTP sent to email' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Verify OTP (unchanged)
router.post('/verify-otp', async (req, res) => {
  const { email, otp, name, password } = req.body;
  if (!email || !otp || !name || !password) {
    return res.status(400).json({ error: 'All fields required' });
  }

  const stored = global.tempOTPStore.get(email);
  if (!stored || stored.otp !== otp || new Date() > stored.otpExpires) {
    return res.status(400).json({ error: 'Invalid or expired OTP' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    isVerified: true,
    status: 'pending',
    role: 'salesman',
  });

  global.tempOTPStore.delete(email);

  const token = jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role }
  });
});

// ✅ LOGIN with skip verification for superadmin / specific emails
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    // ✅ Skip verification check for superadmin or any admin email
    const isAdminEmail = email === 'superadmin@bms.com' || email === 'admin@bms.com' || user.role === 'super_admin' || user.role === 'admin';
    
    if (!isAdminEmail && !user.isVerified) {
      return res.status(400).json({ error: 'Please verify your email first' });
    }

    if (user.status !== 'active') {
      if (user.status === 'pending') {
        return res.status(403).json({ error: 'Account pending approval', isPending: true });
      }
      if (user.status === 'inactive') {
        return res.status(403).json({ error: 'Account inactive', isInactive: true });
      }
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      shop: {
        id: user._id,
        shopName: user.shopName || user.name,
        ownerName: user.ownerName,
        phone: user.phone,
        address: user.address,
        status: user.status,
        role: user.role
      },
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ GET current session
router.get('/session', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      shop: {
        id: user._id,
        shopName: user.shopName || user.name,
        ownerName: user.ownerName,
        phone: user.phone,
        address: user.address,
        status: user.status,
        role: user.role
      },
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;