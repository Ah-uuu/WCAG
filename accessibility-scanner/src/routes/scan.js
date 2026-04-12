const express = require('express');
const router = express.Router();
const { scanUrl } = require('../services/scanner');

/**
 * POST /api/scan
 * Body: { url: "https://example.com" }
 * 
 * 回傳 JSON 掃描結果
 */
router.post('/', async (req, res) => {
  const { url } = req.body;

  // ── Validation ────────────────────────────────────────────────────────────
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

  // ── Scan ──────────────────────────────────────────────────────────────────
  try {
    console.log(`[SCAN] Starting scan for: ${url}`);
    const result = await scanUrl(url);
    console.log(`[SCAN] Completed. Violations: ${result.summary.total}, Score: ${result.complianceScore}%`);
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

module.exports = router;
