const express = require('express');
const { scanUrl } = require('../services/scanner');
const { prisma } = require('../lib/db');
const { optionalAuth, requireAuth } = require('../middleware/requireAuth');
const { scanLimit } = require('../middleware/scanLimit');

const router = express.Router();

// POST /api/scan
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

  try {
    console.log(`[SCAN] Starting scan for: ${url} (user: ${req.user?.id ?? 'anonymous'})`);
    const result = await scanUrl(url);
    console.log(`[SCAN] Completed. Score: ${result.complianceScore}%, Violations: ${result.summary.total}`);

    if (req.user) {
      try {
        const savedScan = await prisma.Scan.create({
          data: {
            userId: req.user.id,
            url,
            result,
            score: result.complianceScore,
            status: result.status,
          },
        });
        // Override the scanner-generated UUID with the Prisma DB id
        // so the frontend can use it to fetch the PDF report
        result.scanId = savedScan.id;
      } catch (dbErr) {
        console.error('[SCAN] Failed to save scan to DB:', dbErr.message);
      }
    }

    if (req.user && req.scanLimit !== undefined) {
      result._usage = {
        plan: req.scanPlan,
        used: (req.scanUsed ?? 0) + 1,
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

// GET /api/scan/history
router.get('/history', requireAuth, async (req, res) => {
  try {
    const scans = await prisma.Scan.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        url: true,
        score: true,
        status: true,
        createdAt: true,
      },
    });
    return res.json({ scans });
  } catch (err) {
    console.error('[SCAN HISTORY] Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch scan history.' });
  }
});

module.exports = router;
