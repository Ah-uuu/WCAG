const { auth } = require('../lib/auth');
const { fromNodeHeaders } = require('better-auth/node');

async function requireAuth(req, res, next) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    if (!session?.user) {
      return res.status(401).json({ error: 'Authentication required. Please sign in.' });
    }
    req.user    = session.user;
    req.session = session.session;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Authentication failed.' });
  }
}

async function optionalAuth(req, res, next) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    req.user    = session?.user    ?? null;
    req.session = session?.session ?? null;
  } catch (_) {
    req.user = null; req.session = null;
  }
  next();
}

module.exports = { requireAuth, optionalAuth };
