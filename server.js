const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Load env from backend/.env first, otherwise fallback to project root ../.env.
const possibleEnvPaths = [
  path.join(__dirname, '.env'),
  path.join(__dirname, '..', '.env'),
];
let envPath = process.env.ENV_PATH || possibleEnvPaths.find((p) => require('fs').existsSync(p));
if (!envPath) {
  envPath = possibleEnvPaths[1];
}
require('dotenv').config({ path: envPath, override: true });

const app = express();

const isProd = (process.env.NODE_ENV || 'development') === 'production';
app.use(
  cors({
    origin: (origin, cb) => {
      // Allow non-browser tools (no Origin) and dev localhost variants.
      if (!origin) return cb(null, true);

      if (!isProd) {
        const ok =
          /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
        return cb(null, ok);
      }

      // In production, now it checks CORS_ORIGINS variable from Railway.
      // Make sure to add CORS_ORIGINS = * in Railway Dashboard Variables
      const allowed = (process.env.CORS_ORIGINS || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      
      // If CORS_ORIGINS is '*', allow all
      if (allowed.includes('*')) return cb(null, true);

      return cb(null, allowed.includes(origin));
    },
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.get('/', (req, res) => res.json({ message: '✅ BMS Backend is running!' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/ledger', require('./routes/ledger'));
app.use('/api/suppliers', require('./routes/suppliers'));
app.use('/api/purchases', require('./routes/purchases'));
app.use('/api/accounts', require('./routes/accounts'));
app.use('/api/account-transactions', require('./routes/accountTransactions'));
app.use('/api/banks', require('./routes/banks'));
app.use('/api/trial-balance', require('./routes/trialBalance'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/users', require('./routes/users'));
app.use('/api/chatbot', require('./routes/chatbot'));

// terminal mein ye check karein restart ke baad
console.log("--- SYSTEM CHECK ---");
console.log("Environment:", process.env.NODE_ENV || "development");
console.log("Env Path:", envPath);
console.log("GEMINI_API_KEY loaded:", !!process.env.GEMINI_API_KEY ? "YES ✅" : "NO ❌");
console.log("--------------------");

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB Connected');
  })
  .catch((err) => {
    console.error('❌ MongoDB Error:', err);
  });