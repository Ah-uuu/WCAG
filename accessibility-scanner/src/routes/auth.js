const { toNodeHandler } = require('better-auth/node');
const { auth } = require('../lib/auth');

// ─────────────────────────────────────────────────────────────────────────────
// /api/auth/* — 全部交給 Better Auth 處理
//
// Better Auth 自動掛載以下端點：
//   POST /api/auth/sign-up/email
//   POST /api/auth/sign-in/email
//   POST /api/auth/sign-out
//   GET  /api/auth/session
//   GET  /api/auth/sign-in/google
//   GET  /api/auth/callback/google
//   POST /api/auth/forget-password
//   POST /api/auth/reset-password
// ─────────────────────────────────────────────────────────────────────────────
module.exports = toNodeHandler(auth);
