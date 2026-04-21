const express = require('express');
const { scanUrl } = require('../services/scanner');
const { prisma }  = require('../lib/db');
const { optionalAuth, requireAuth } = require('../middleware/requireAuth');
const { scanLimit }    = require('../middleware/scanLimit');

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/scan
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', optionalAuth, scanLimit, async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'url is required' });
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL format. Include https://' });
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    return res.status(400).json({ error: 'Only http and https URLs are supported' });
  }

  // ── 訪客掃描次數限制（每個 fingerprint 只能掃描一次）────────────────────────
  if (!req.user) {
    const rawIp = (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
      || req.socket?.remoteAddress
      || 'unknown';
    // 優先使用前端傳來的 localStorage UUID；沒有時 fallback 到 IP
    const fingerprint = req.headers['x-guest-id'] || `ip:${rawIp}`;

    try {
      const existing = await prisma.GuestScan.findUnique({ where: { fingerprint } });
      if (existing) {
        return res.status(403).json({
          error: 'GUEST_LIMIT_REACHED',
          message: '已達免費掃描次數上限，請註冊帳號以繼續使用。',
        });
      }
    } catch (dbErr) {
      // 查詢失敗時允許掃描（fail open），避免誤傷正常使用者
      console.error('[SCAN] Guest fingerprint check failed:', dbErr.message);
    }

    req._guestFingerprint = fingerprint;
    req._guestIp = rawIp !== 'unknown' ? rawIp : null;
  }

  // ── 執行掃描 ──────────────────────────────────────────────────────────────
  try {
    console.log(`[SCAN] Starting scan for: ${url} (user: ${req.user?.id ?? 'anonymous'})`);
    const result = await scanUrl(url);
    console.log(`[SCAN] Completed. Score: ${result.complianceScore}%, Violations: ${result.summary.total}`);

    // ── 所有掃描都存入 DB（訪客用戶 userId 為 null）─────────────────────────
    try {
      const savedScan = await prisma.Scan.create({
        data: {
          userId: req.user?.id ?? null,
          url,
          result,
          score:  result.complianceScore,
          status: result.status,
        },
      });
      result.scanId = savedScan.id;
    } catch (dbErr) {
      console.error('[SCAN] Failed to save scan to DB:', dbErr.message);
    }

    // ── 訪客掃描：記錄 fingerprint，防止再次掃描 ─────────────────────────────
    if (!req.user && req._guestFingerprint) {
      try {
        await prisma.GuestScan.create({
          data: {
            fingerprint: req._guestFingerprint,
            ip: req._guestIp || null,
          },
        });
      } catch (dbErr) {
        // race condition 或重複 key — 忽略
        console.error('[SCAN] Failed to record guest fingerprint:', dbErr.message);
      }
    }

    // ── 已登入用戶：附加用量資訊給前端顯示 ─────────────────────────────────
    if (req.user && req.scanLimit !== undefined) {
      result._usage = {
        plan:  req.scanPlan,
        used:  (req.scanUsed ?? 0) + 1,
        limit: req.scanLimit,
        unlimited: req.scanLimit === -1,
      };
    }

    return res.json(result);
  } catch (err) {
    console.error(`[SCAN ERROR] ${err.message}`);

    if (err.message.includes('net::ERR') || err.message.includes('Navigation timeout')) {
      return res.status(422).json({
        error: 'Could not reach the URL. Make sure the site is accessible and try again.',
      });
    }

    return res.status(500).json({ error: 'Scan failed. Please try again.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/scan/history
// ─────────────────────────────────────────────────────────────────────────────
router.get('/history', requireAuth, async (req, res) => {
  try {
    const scans = await prisma.Scan.findMany({
      where:   { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take:    50,
      select: {
        id:        true,
        url:       true,
        score:     true,
        status:    true,
        createdAt: true,
        result:    true,
      },
    });

    const mapped = scans.map(({ result, ...rest }) => ({
      ...rest,
      violations: result?.summary?.total ?? (Array.isArray(result?.violations) ? result.violations.length : 0),
    }));

    return res.json({ scans: mapped });
  } catch (err) {
    console.error('[SCAN HISTORY] Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch scan history.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/scan/:id — full detail
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const scan = await prisma.Scan.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!scan) {
      return res.status(404).json({ error: 'Scan not found.' });
    }

    return res.json(scan);
  } catch (err) {
    console.error('[SCAN DETAIL] Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch scan detail.' });
  }
});

module.exports = router;
