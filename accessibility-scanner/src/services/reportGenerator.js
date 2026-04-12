const PDFDocument = require('pdfkit');

// 顏色系統
const COLORS = {
  primary: '#2563EB',
  danger: '#DC2626',
  warning: '#D97706',
  success: '#16A34A',
  muted: '#6B7280',
  light: '#F3F4F6',
  border: '#E5E7EB',
  text: '#111827',
};

const IMPACT_COLORS = {
  critical: COLORS.danger,
  serious: '#EA580C',
  moderate: COLORS.warning,
  minor: COLORS.muted,
};

/**
 * 產生 ACR 格式 PDF 報告
 * @param {Object} scanResult - scanUrl() 的回傳結果
 * @returns {Buffer} PDF buffer
 */
async function generatePDFReport(scanResult) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // ── Cover Page ────────────────────────────────────────────────────────────
    drawCoverPage(doc, scanResult);

    doc.addPage();

    // ── Executive Summary ─────────────────────────────────────────────────────
    drawSectionHeader(doc, 'Executive Summary');
    drawSummaryTable(doc, scanResult);

    doc.moveDown(1);

    // ── Compliance Score ──────────────────────────────────────────────────────
    drawSectionHeader(doc, 'Compliance Score');
    drawScoreSection(doc, scanResult);

    doc.addPage();

    // ── Violations Detail ─────────────────────────────────────────────────────
    drawSectionHeader(doc, 'Accessibility Issues Found');

    if (scanResult.violations.length === 0) {
      doc.fontSize(12).fillColor(COLORS.success)
        .text('✓ No accessibility violations were detected.', { align: 'center' });
    } else {
      scanResult.violations.forEach((v, i) => {
        if (doc.y > 650) doc.addPage();
        drawViolationCard(doc, v, i + 1);
        doc.moveDown(0.5);
      });
    }

    // ── Footer ────────────────────────────────────────────────────────────────
    doc.addPage();
    drawSectionHeader(doc, 'About This Report');
    drawAboutSection(doc, scanResult);

    doc.end();
  });
}

function drawCoverPage(doc, result) {
  // Header bar
  doc.rect(0, 0, doc.page.width, 8).fill(COLORS.primary);

  doc.moveDown(4);

  // Logo / title area
  doc.fontSize(28).fillColor(COLORS.primary).font('Helvetica-Bold')
    .text('Accessibility Compliance Report', { align: 'center' });

  doc.moveDown(0.5);
  doc.fontSize(13).fillColor(COLORS.muted).font('Helvetica')
    .text('WCAG 2.1 Level AA — ACR Format', { align: 'center' });

  doc.moveDown(3);

  // Status badge
  const statusColor = result.status === 'PASS' ? COLORS.success
    : result.status === 'FAIL' ? COLORS.danger : COLORS.warning;
  const statusText = result.status === 'PASS' ? '✓ PASS'
    : result.status === 'FAIL' ? '✗ FAIL' : '⚠ WARNING';

  doc.fontSize(18).fillColor(statusColor).font('Helvetica-Bold')
    .text(statusText, { align: 'center' });

  doc.moveDown(2);

  // Meta info box
  const boxX = 80;
  const boxY = doc.y;
  const boxW = doc.page.width - 160;
  doc.rect(boxX, boxY, boxW, 130).fill(COLORS.light).stroke(COLORS.border);

  doc.fontSize(11).fillColor(COLORS.text).font('Helvetica');
  const lineH = 22;
  const textX = boxX + 20;
  let ty = boxY + 15;

  const fields = [
    ['URL', result.url],
    ['Page Title', result.pageTitle || 'N/A'],
    ['Scan Date', new Date(result.scannedAt).toLocaleString()],
    ['Standard', result.wcagVersion],
    ['Report ID', result.scanId],
  ];

  fields.forEach(([label, value]) => {
    doc.font('Helvetica-Bold').text(`${label}:`, textX, ty, { continued: true });
    doc.font('Helvetica').text(`  ${value}`, { lineBreak: false });
    ty += lineH;
  });

  doc.moveDown(6);

  // Bottom bar
  doc.rect(0, doc.page.height - 8, doc.page.width, 8).fill(COLORS.primary);
}

function drawSectionHeader(doc, title) {
  doc.moveDown(0.5);
  doc.fontSize(16).fillColor(COLORS.primary).font('Helvetica-Bold').text(title);
  doc.moveDown(0.2);
  doc.rect(50, doc.y, doc.page.width - 100, 2).fill(COLORS.primary);
  doc.moveDown(0.8);
}

function drawSummaryTable(doc, result) {
  const { summary } = result;
  const cols = [
    { label: 'Critical', value: summary.critical, color: COLORS.danger },
    { label: 'Serious', value: summary.serious, color: '#EA580C' },
    { label: 'Moderate', value: summary.moderate, color: COLORS.warning },
    { label: 'Minor', value: summary.minor, color: COLORS.muted },
    { label: 'Passed', value: summary.passed, color: COLORS.success },
  ];

  const cellW = (doc.page.width - 100) / cols.length;
  const cellH = 60;
  const startX = 50;
  const startY = doc.y;

  cols.forEach((col, i) => {
    const x = startX + i * cellW;
    doc.rect(x, startY, cellW - 4, cellH).fill(COLORS.light).stroke(COLORS.border);
    doc.fontSize(22).fillColor(col.color).font('Helvetica-Bold')
      .text(String(col.value), x, startY + 8, { width: cellW - 4, align: 'center' });
    doc.fontSize(10).fillColor(COLORS.muted).font('Helvetica')
      .text(col.label, x, startY + 38, { width: cellW - 4, align: 'center' });
  });

  doc.y = startY + cellH + 10;
}

function drawScoreSection(doc, result) {
  const score = result.complianceScore;
  const color = score >= 90 ? COLORS.success : score >= 70 ? COLORS.warning : COLORS.danger;

  doc.fontSize(48).fillColor(color).font('Helvetica-Bold')
    .text(`${score}%`, { align: 'center' });

  doc.fontSize(12).fillColor(COLORS.muted).font('Helvetica')
    .text(
      score >= 90
        ? 'Good — Minor improvements recommended'
        : score >= 70
          ? 'Fair — Several issues need attention'
          : 'Poor — Critical issues must be fixed',
      { align: 'center' }
    );
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor(COLORS.muted)
    .text(`Score = Passed checks / Total checks × 100`, { align: 'center' });
}

function drawViolationCard(doc, violation, index) {
  const impactColor = IMPACT_COLORS[violation.impact] || COLORS.muted;
  const cardX = 50;
  const cardW = doc.page.width - 100;
  const startY = doc.y;

  // Card border (left accent)
  doc.rect(cardX, startY, 4, 1).fill(impactColor); // placeholder, will expand

  // Title row
  doc.fontSize(12).fillColor(COLORS.text).font('Helvetica-Bold')
    .text(`${index}. ${violation.help}`, cardX + 10, startY);

  // Tags row
  doc.y = doc.y + 2;
  const tagY = doc.y;
  doc.fontSize(9).fillColor('#fff').font('Helvetica');

  // Impact badge
  drawBadge(doc, violation.impact.toUpperCase(), cardX + 10, tagY, impactColor);
  drawBadge(doc, `WCAG ${violation.wcagCriteria}`, cardX + 80, tagY, COLORS.primary);
  drawBadge(doc, `Level ${violation.level}`, cardX + 160, tagY, COLORS.muted);

  doc.moveDown(0.8);

  doc.fontSize(10).fillColor(COLORS.muted).font('Helvetica')
    .text(`Affected elements: ${violation.affectedElements}`, cardX + 10);

  doc.moveDown(0.3);
  doc.fontSize(10).fillColor(COLORS.text).font('Helvetica-Bold').text('How to Fix:', cardX + 10);
  doc.font('Helvetica').fillColor(COLORS.text)
    .text(violation.howToFix, cardX + 10, doc.y, { width: cardW - 20 });

  doc.moveDown(0.3);
  doc.fontSize(9).fillColor(COLORS.primary)
    .text(`Reference: ${violation.helpUrl}`, cardX + 10, doc.y, {
      link: violation.helpUrl,
      underline: true,
    });

  // Draw card border now that we know the height
  const cardH = doc.y - startY + 8;
  doc.rect(cardX, startY - 4, 4, cardH).fill(impactColor);
  doc.rect(cardX, startY - 4, cardW, cardH).stroke(COLORS.border);

  doc.moveDown(0.5);
}

function drawBadge(doc, text, x, y, color) {
  const textW = text.length * 5.5 + 8;
  doc.rect(x, y, textW, 14).fill(color);
  doc.fontSize(8).fillColor('#fff').font('Helvetica-Bold')
    .text(text, x + 4, y + 3, { lineBreak: false });
}

function drawAboutSection(doc, result) {
  const lines = [
    'This report was generated automatically using axe-core, the industry-standard',
    'accessibility testing engine maintained by Deque Systems.',
    '',
    'Standards Referenced:',
    '• WCAG 2.1 Level A and AA (W3C)',
    '• ADA Title III (Americans with Disabilities Act)',
    '• Section 508 of the Rehabilitation Act',
    '',
    'Limitations:',
    'Automated scanning detects approximately 30–50% of accessibility issues.',
    'Manual testing with assistive technologies (screen readers, keyboard navigation)',
    'is recommended for full compliance verification.',
    '',
    `Scan ID: ${result.scanId}`,
    `Generated: ${new Date(result.scannedAt).toISOString()}`,
  ];

  doc.fontSize(11).fillColor(COLORS.text).font('Helvetica');
  lines.forEach((line) => {
    if (line.startsWith('•')) {
      doc.text(line, { indent: 15 });
    } else if (line === '') {
      doc.moveDown(0.4);
    } else {
      doc.text(line);
    }
  });
}

module.exports = { generatePDFReport };
