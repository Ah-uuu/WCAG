require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const rateLimit = require('express-rate-limit');

const scanRouter    = require('./routes/scan');
const reportRouter  = require('./routes/report');
const authRouter    = require('./routes/auth');
const stripeRouter  = require('./routes/stripe');
const webhookRouter = require('./routes/webhook');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─────────────────────────────────────────────────────────────────────────────
// Stripe Webhook 必須在 express.json() 之前掛載（需要 raw body）
// ─────────────────────────────────────────────────────────────────────────────
app.use('/webhook/stripe', webhookRouter);

// ─── Security & Middleware ───────────────────────────────────────────────────
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
    origin:      process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true,
}));

app.use(express.json());

// ─── Rate Limiting ───────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 100,
    message: { error: 'Too many requests. Please try again later.' },
    skip: (req) => req.path === '/health',
});
app.use(globalLimiter);

const scanLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: { error: 'Scan rate limit exceeded. Sign in for a higher quota.' },
});
app.use('/api/scan', scanLimiter);

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth',   authRouter);
app.use('/api/scan',   scanRouter);
app.use('/api/report', reportRouter);
app.use('/api/stripe', stripeRouter);

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── 404 ─────────────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// ─── Error Handler ───────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`✅ AccessScan API running on port ${PORT}`);
    console.log(`   Auth:    /api/auth/*`);
    console.log(`   Scan:    POST /api/scan`);
    console.log(`   Report:  POST /api/report/pdf`);
    console.log(`   Stripe:  /api/stripe/*`);
    console.log(`   Webhook: POST /webhook/stripe`);
});
