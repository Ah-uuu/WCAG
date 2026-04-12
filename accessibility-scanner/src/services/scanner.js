const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const { v4: uuidv4 } = require('uuid');

// WCAG 條款對應說明（中英對照，方便之後做多語言）
const WCAG_DESCRIPTIONS = {
  'color-contrast': { wcag: '1.4.3', level: 'AA', description: 'Text must have sufficient color contrast ratio' },
  'image-alt': { wcag: '1.1.1', level: 'A', description: 'Images must have alternative text' },
  'label': { wcag: '1.3.1', level: 'A', description: 'Form inputs must have associated labels' },
  'link-name': { wcag: '2.4.4', level: 'A', description: 'Links must have discernible text' },
  'button-name': { wcag: '4.1.2', level: 'A', description: 'Buttons must have accessible names' },
  'heading-order': { wcag: '1.3.1', level: 'A', description: 'Heading levels must not be skipped' },
  'html-has-lang': { wcag: '3.1.1', level: 'A', description: 'HTML element must have a lang attribute' },
  'keyboard': { wcag: '2.1.1', level: 'A', description: 'All functionality must be accessible via keyboard' },
  'frame-title': { wcag: '2.4.1', level: 'A', description: 'Frames must have title attributes' },
  'document-title': { wcag: '2.4.2', level: 'A', description: 'Page must have a title' },
  'duplicate-id': { wcag: '4.1.1', level: 'A', description: 'IDs must be unique' },
  'meta-viewport': { wcag: '1.4.4', level: 'AA', description: 'Zooming must not be disabled' },
  'skip-link': { wcag: '2.4.1', level: 'A', description: 'Page must have skip navigation link' },
  'tabindex': { wcag: '2.4.3', level: 'A', description: 'tabindex values must not be positive' },
  'aria-allowed-attr': { wcag: '4.1.2', level: 'A', description: 'ARIA attributes must be allowed for element role' },
  'aria-required-attr': { wcag: '4.1.2', level: 'A', description: 'Required ARIA attributes must be provided' },
};

/**
 * 取得 Chromium 執行路徑（本地開發 vs Render 部署自動切換）
 */
async function getBrowserArgs() {
  // Render / 生產環境
  if (process.env.NODE_ENV === 'production') {
    return {
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    };
  }

  // 本地開發：使用系統安裝的 Chrome
  // Mac: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  // Linux: '/usr/bin/google-chrome'
  // Windows: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  return {
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
    headless: true,
  };
}

/**
 * 主要掃描函數
 * @param {string} url - 要掃描的網址
 * @returns {Object} 掃描結果
 */
async function scanUrl(url) {
  const scanId = uuidv4();
  const startTime = Date.now();
  let browser = null;

  try {
    const browserArgs = await getBrowserArgs();
    browser = await puppeteer.launch(browserArgs);

    const page = await browser.newPage();

    // 設定 timeout 與 viewport
    await page.setDefaultNavigationTimeout(30000);
    await page.setViewport({ width: 1280, height: 800 });

    // 前往目標網址
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // 注入 axe-core 並執行掃描
    const axeSource = require('axe-core').source;
    await page.evaluate(axeSource);

    const axeResults = await page.evaluate(async () => {
      return await axe.run({
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
        },
      });
    });

    const pageTitle = await page.title();
    const scanDuration = Date.now() - startTime;

    // 整理違規項目
    const violations = axeResults.violations.map((v) => {
      const wcagInfo = WCAG_DESCRIPTIONS[v.id] || {
        wcag: 'N/A',
        level: v.tags.includes('wcag2aa') || v.tags.includes('wcag21aa') ? 'AA' : 'A',
        description: v.description,
      };

      return {
        id: v.id,
        wcagCriteria: wcagInfo.wcag,
        level: wcagInfo.level,
        impact: v.impact, // critical, serious, moderate, minor
        description: v.description,
        help: v.help,
        helpUrl: v.helpUrl,
        affectedElements: v.nodes.length,
        elements: v.nodes.slice(0, 3).map((n) => ({
          html: n.html.substring(0, 200),
          target: n.target,
          failureSummary: n.failureSummary,
        })),
        howToFix: generateFixGuidance(v.id),
      };
    });

    // 統計摘要
    const summary = {
      total: violations.length,
      critical: violations.filter((v) => v.impact === 'critical').length,
      serious: violations.filter((v) => v.impact === 'serious').length,
      moderate: violations.filter((v) => v.impact === 'moderate').length,
      minor: violations.filter((v) => v.impact === 'minor').length,
      passed: axeResults.passes.length,
      incomplete: axeResults.incomplete.length,
    };

    // 合規評分（簡單算法：通過項目 / 總檢查項目）
    const totalChecks = summary.passed + summary.total;
    const complianceScore = totalChecks > 0
      ? Math.round((summary.passed / totalChecks) * 100)
      : 100;

    return {
      scanId,
      url,
      pageTitle,
      scannedAt: new Date().toISOString(),
      scanDuration: `${scanDuration}ms`,
      wcagVersion: 'WCAG 2.1 Level AA',
      complianceScore,
      summary,
      violations,
      status: summary.total === 0 ? 'PASS' : summary.critical > 0 ? 'FAIL' : 'WARNING',
    };
  } finally {
    if (browser) await browser.close();
  }
}

/**
 * 針對常見問題提供修復建議
 */
function generateFixGuidance(ruleId) {
  const guidance = {
    'image-alt': 'Add an alt attribute to the <img> tag. Use empty alt="" for decorative images. Example: <img src="photo.jpg" alt="Team meeting in conference room">',
    'color-contrast': 'Increase the contrast ratio between text and background. Use a contrast ratio of at least 4.5:1 for normal text and 3:1 for large text. Tools: WebAIM Contrast Checker.',
    'label': 'Associate a <label> element with each form input using the "for" attribute matching the input\'s "id". Example: <label for="email">Email</label><input id="email" type="email">',
    'link-name': 'Add descriptive text inside the <a> tag, or use aria-label. Avoid generic text like "click here". Example: <a href="/report">Download Accessibility Report</a>',
    'button-name': 'Add visible text or aria-label to buttons. Example: <button aria-label="Close dialog">X</button>',
    'heading-order': 'Use heading tags in order (h1 → h2 → h3). Do not skip levels. Each page should have exactly one <h1>.',
    'html-has-lang': 'Add a lang attribute to the <html> element. Example: <html lang="en"> or <html lang="zh-TW">',
    'document-title': 'Add a descriptive <title> tag inside <head>. Example: <title>Accessibility Scan Report | YourCompany</title>',
    'duplicate-id': 'Ensure all id attributes on a page are unique. Use classes for repeated styling instead.',
    'meta-viewport': 'Remove user-scalable=no and maximum-scale=1 from your viewport meta tag. Allow users to zoom.',
    'frame-title': 'Add a title attribute to all <iframe> elements. Example: <iframe title="Payment form" src="...">',
  };
  return guidance[ruleId] || 'Review the WCAG documentation for this criterion and update your code accordingly. See helpUrl for specific guidance.';
}

module.exports = { scanUrl };
