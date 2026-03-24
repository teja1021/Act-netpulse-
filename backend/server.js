'use strict';
require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const connectDB = require('./config/database');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Connect DB ─────────────────────────────────────
connectDB();

// ── Global Middleware ───────────────────────────────
app.use(cors({
  origin: ['http://localhost:4200', 'http://localhost:4000', 'http://127.0.0.1:4200'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser — skip for upload route (we want raw stream)
app.use((req, res, next) => {
  if (req.path === '/api/speed/upload') return next();
  express.json({ limit: '1mb' })(req, res, next);
});
app.use((req, res, next) => {
  if (req.path === '/api/speed/upload') return next();
  express.urlencoded({ extended: true })(req, res, next);
});

// ── Routes ──────────────────────────────────────────
app.use('/api/auth',  require('./routes/auth.routes'));
app.use('/api/user',  require('./routes/user.routes'));
app.use('/api/speed', require('./routes/speed.routes'));
app.use('/api/logs',  require('./routes/log.routes'));

app.get('/api/health', (_req, res) =>
  res.json({ ok: true, ts: Date.now() })
);

// ── Error handler ───────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ success: false, message: err.message || 'Server error' });
});

app.listen(PORT, () =>
  console.log(`✅  NetPulse API  →  http://localhost:${PORT}`)
);
