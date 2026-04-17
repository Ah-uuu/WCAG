const { betterAuth } = require('better-auth');
const { prismaAdapter } = require('better-auth/adapters/prisma');
const { prisma } = require('./db');

// ── Email transport (nodemailer) ──────────────────────────────────────────────
// Set these env vars in Render to enable email verification:
//   SMTP_HOST   e.g. smtp.gmail.com
//   SMTP_PORT   e.g. 587
//   SMTP_USER   your SMTP username / email address
//   SMTP_PASS   your SMTP password or app-password
//   EMAIL_FROM  display address, e.g. "AccessScan <noreply@yourdomain.com>"
// ─────────────────────────────────────────────────────────────────────────────
let transporter = null;
const smtpReady = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

if (smtpReady) {
  try {
    const nodemailer = require('nodemailer');
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: parseInt(process.env.SMTP_PORT || '587', 10) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    console.log('[AUTH] SMTP transport configured — email verification enabled');
  } catch (err) {
    console.warn('[AUTH] nodemailer not available:', err.message);
  }
} else {
  console.warn('[AUTH] SMTP env vars not set — email verification disabled');
}

async function sendVerificationEmail(user, url) {
  if (!transporter) {
    console.log(`[AUTH] Verification link for ${user.email}: ${url}`);
    return;
  }
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to: user.email,
    subject: '⚔ AccessScan — Verify your email',
    html: `
      <div style="font-family:monospace;background:#0d0d0d;color:#00ff41;padding:32px;max-width:480px;margin:auto;border:2px solid #00ff41">
        <h2 style="color:#00ff41;font-size:1.2rem;margin-bottom:16px">▶ VERIFY YOUR EMAIL</h2>
        <p style="color:#aaa;margin-bottom:24px">Click the button below to activate your AccessScan account.</p>
        <a href="${url}" style="display:inline-block;background:#00ff41;color:#0d0d0d;padding:10px 24px;text-decoration:none;font-weight:bold;margin-bottom:24px">
          ✔ VERIFY EMAIL
        </a>
        <p style="color:#555;font-size:0.8rem">If you didn't create an account, ignore this email.<br>Link expires in 24 hours.</p>
      </div>
    `,
  });
}

const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: !!transporter,   // only enforce if SMTP is ready
    minPasswordLength: 8,
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail(user, url);
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  trustedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [],
  advanced: {
    defaultCookieAttributes: { sameSite: 'none', secure: true },
  },
});

module.exports = { auth };
