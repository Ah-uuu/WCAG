const express = require('express');
const router = express.Router();
const { scanUrl } = require('../services/scanner');
const { generatePDFReport } = require('../services/reportGenerator');
const { prisma } = require('../lib/db');

/**
 * POST /api/report/pdf
 * Body: { url: "https://example.com" }
 *
 * 掃描後直接回傳 PDF 檔案（ACR 格式）
 */
router.post('/pdf', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'url is required' });
  }

  try {
    new URL(url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  try {
    console.log(`[REPORT] Scanning and generating PDF for: ${url}`);

    // 1. 掃描
    const scanResult = await scanUrl(url);

    // 2. 產生 PDF
    const pdfBuffer = await generatePDFReport(scanResult);

    // 3. 回傳 PDF
    const filename = `accessibility-report-${scanResult.scanId}.pdf`;
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBuffer.length,
    });

    console.log(`[REPORT] PDF generated. Size: ${pdfBuffer.length} bytes`);
    return res.send(pdfBuffer);
  } catch (err) {
    console.error(`[REPORT ERROR] ${err.message}`);
    return res.status(500).json({ error: 'Report generation failed. Please try again.' });
  }
});

/**
 * GET /api/report/pdf/:scanId
 * 根據已儲存的掃描 ID 直接生成 PDF（不重新掃描）
 */
router.get('/pdf/:scanId', async (req, res) => {
  const { scanId } = req.params;

  try {
    const scan = await prisma.Scan.findUnique({ where: { id: scanId } });
    if (!scan) {
      return res.status(404).json({ error: 'Scan not found.' });
    }

    console.log(`[REPORT] Generating PDF for scan: ${scanId}`);
    const pdfBuffer = await generatePDFReport(scan.result);

    const filename = `accessibility-report-${scanId}.pdf`;
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBuffer.length,
    });

    console.log(`[REPORT] PDF generated for scan ${scanId}. Size: ${pdfBuffer.length} bytes`);
    return res.send(pdfBuffer);
  } catch (err) {
    console.error(`[REPORT PDF BY ID ERROR] ${err.message}`);
    return res.status(500).json({ error: 'Failed to generate PDF report.' });
  }
});

/**
 * POST /api/report/json
 * 同上但回傳 JSON（給前端用）
 */
router.post('/json', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'url is required' });
  }

  try {
    const scanResult = await scanUrl(url);
    return res.json(scanResult);
  } catch (err) {
    console.error(`[JSON REPORT ERROR] ${err.message}`);
    return res.status(500).json({ error: 'Failed to generate report' });
  }
});

module.exports = router;
