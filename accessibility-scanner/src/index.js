require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const scanRouter = require('./routes/scan');
const reportRouter = require('./routes/report');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Security & Middleware ───────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
}));
app.use(express.json());

// Rate limiting：免費版每小時最多 10 次掃描
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: { error: 'Too many requests. Please try again later.' },
});
app.use('/api/scan', limiter);

// ─── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/scan', scanRouter);
app.use('/api/report', reportRouter);

// Health check（Render 需要這個）
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`✅ Accessibility Scanner API running on port ${PORT}`);
});
