const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const { v4: uuidv4 } = require('uuid');

// WCAG 條款對應說明（完整版）
const WCAG_DESCRIPTIONS = {
  // ── Perceivable ──────────────────────────────────────────────────────────
  'image-alt':                    { wcag: '1.1.1', level: 'A',  description: 'Images must have alternative text' },
  'input-image-alt':              { wcag: '1.1.1', level: 'A',  description: 'Image inputs must have alternative text' },
  'object-alt':                   { wcag: '1.1.1', level: 'A',  description: 'Object elements must have alternative text' },
  'role-img-alt':                 { wcag: '1.1.1', level: 'A',  description: 'Elements with role=img must have alternative text' },
  'svg-img-alt':                  { wcag: '1.1.1', level: 'A',  description: 'SVG elements with img role must have alternative text' },
  'area-alt':                     { wcag: '1.1.1', level: 'A',  description: 'Active area elements must have alternative text' },
  'video-caption':                { wcag: '1.2.2', level: 'A',  description: 'Videos must have captions' },
  'audio-caption':                { wcag: '1.2.1', level: 'A',  description: 'Audio elements must have captions' },
  'color-contrast':               { wcag: '1.4.3', level: 'AA', description: 'Text must have sufficient color contrast ratio' },
  'color-contrast-enhanced':      { wcag: '1.4.6', level: 'AAA',description: 'Text must have enhanced color contrast ratio' },
  'meta-viewport':                { wcag: '1.4.4', level: 'AA', description: 'Zooming must not be disabled' },
  'css-orientation-lock':         { wcag: '1.3.4', level: 'AA', description: 'CSS must not lock display orientation' },
  'identical-links-same-purpose': { wcag: '2.4.9', level: 'AAA',description: 'Links with the same name must have the same purpose' },

  // ── Structure / Semantic ─────────────────────────────────────────────────
  'label':                        { wcag: '1.3.1', level: 'A',  description: 'Form inputs must have associated labels' },
  'label-content-name-mismatch':  { wcag: '2.5.3', level: 'A',  description: 'Visible label must be part of accessible name' },
  'heading-order':                { wcag: '1.3.1', level: 'A',  description: 'Heading levels must not be skipped' },
  'empty-heading':                { wcag: '1.3.1', level: 'A',  description: 'Headings must not be empty' },
  'p-as-heading':                 { wcag: '1.3.1', level: 'A',  description: 'Bold/italic text should not be used as headings' },
  'html-has-lang':                { wcag: '3.1.1', level: 'A',  description: 'HTML element must have a lang attribute' },
  'html-lang-valid':              { wcag: '3.1.1', level: 'A',  description: 'HTML lang attribute must have a valid value' },
  'document-title':               { wcag: '2.4.2', level: 'A',  description: 'Page must have a title' },
  'duplicate-id':                 { wcag: '4.1.1', level: 'A',  description: 'IDs must be unique' },
  'duplicate-id-active':          { wcag: '4.1.1', level: 'A',  description: 'Active interactive elements must not share IDs' },
  'duplicate-id-aria':            { wcag: '4.1.1', level: 'A',  description: 'IDs referenced by ARIA must be unique' },
  'list':                         { wcag: '1.3.1', level: 'A',  description: 'List items must be contained in parent lists' },
  'listitem':                     { wcag: '1.3.1', level: 'A',  description: 'List item must have a parent list element' },
  'definition-list':              { wcag: '1.3.1', level: 'A',  description: 'dl elements must only contain dt/dd groups' },
  'dlitem':                       { wcag: '1.3.1', level: 'A',  description: 'dl items must be wrapped in a dl element' },
  'table-duplicate-name':         { wcag: '1.3.1', level: 'A',  description: 'Table summary and caption must not be identical' },
  'table-fake-caption':           { wcag: '1.3.1', level: 'A',  description: 'Data tables should use caption element' },
  'td-headers-attr':              { wcag: '1.3.1', level: 'A',  description: 'Cells using headers attribute must reference existing headers' },
  'th-has-data-cells':            { wcag: '1.3.1', level: 'A',  description: 'TH elements must have data cells' },

  // ── Navigation / Keyboard ────────────────────────────────────────────────
  'keyboard':                     { wcag: '2.1.1', level: 'A',  description: 'All functionality must be accessible via keyboard' },
  'tabindex':                     { wcag: '2.4.3', level: 'A',  description: 'tabindex values must not be positive' },
  'skip-link':                    { wcag: '2.4.1', level: 'A',  description: 'Page must have skip navigation link' },
  'bypass':                       { wcag: '2.4.1', level: 'A',  description: 'Page must have means to bypass repeated blocks' },
  'frame-title':                  { wcag: '2.4.1', level: 'A',  description: 'Frames must have title attributes' },
  'frame-focusable-content':      { wcag: '2.1.1', level: 'A',  description: 'Frames with focusable content must not be hidden' },
  'link-name':                    { wcag: '2.4.4', level: 'A',  description: 'Links must have discernible text' },
  'link-in-text-block':           { wcag: '1.4.1', level: 'A',  description: 'Links must be distinguishable without color alone' },
  'focus-order-semantics':        { wcag: '1.3.1', level: 'A',  description: 'Focus order must follow the semantic structure' },
  'scrollable-region-focusable':  { wcag: '2.1.1', level: 'A',  description: 'Scrollable regions must be keyboard accessible' },

  // ── ARIA ─────────────────────────────────────────────────────────────────
  'aria-allowed-attr':            { wcag: '4.1.2', level: 'A',  description: 'ARIA attributes must be allowed for the element role' },
  'aria-required-attr':           { wcag: '4.1.2', level: 'A',  description: 'Required ARIA attributes must be provided' },
  'aria-required-children':       { wcag: '1.3.1', level: 'A',  description: 'Certain ARIA roles must contain required child roles' },
  'aria-required-parent':         { wcag: '1.3.1', level: 'A',  description: 'Certain ARIA roles must be contained by a parent role' },
  'aria-roles':                   { wcag: '4.1.2', level: 'A',  description: 'ARIA roles must conform to valid values' },
  'aria-valid-attr':              { wcag: '4.1.2', level: 'A',  description: 'ARIA attributes must conform to valid names' },
  'aria-valid-attr-value':        { wcag: '4.1.2', level: 'A',  description: 'ARIA attributes must conform to valid values' },
  'aria-hidden-body':             { wcag: '4.1.2', level: 'A',  description: 'aria-hidden must not be applied to the body element' },
  'aria-hidden-focus':            { wcag: '4.1.3', level: 'AA', description: 'aria-hidden elements must not contain focusable elements' },
  'aria-input-field-name':        { wcag: '4.1.2', level: 'A',  description: 'ARIA input fields must have accessible names' },
  'aria-meter-name':              { wcag: '1.1.1', level: 'A',  description: 'Ensure role=meter has an accessible name' },
  'aria-progressbar-name':        { wcag: '1.1.1', level: 'A',  description: 'Ensure role=progressbar has an accessible name' },
  'aria-toggle-field-name':       { wcag: '4.1.2', level: 'A',  description: 'ARIA toggle fields must have accessible names' },
  'aria-tooltip-name':            { wcag: '4.1.2', level: 'A',  description: 'Ensure role=tooltip has an accessible name' },
  'aria-treeitem-name':           { wcag: '4.1.2', level: 'A',  description: 'Ensure role=treeitem has an accessible name' },
  'aria-command-name':            { wcag: '4.1.2', level: 'A',  description: 'ARIA command elements must have accessible names' },

  // ── Forms / Buttons ──────────────────────────────────────────────────────
  'button-name':                  { wcag: '4.1.2', level: 'A',  description: 'Buttons must have accessible names' },
  'select-name':                  { wcag: '4.1.2', level: 'A',  description: 'Select elements must have accessible names' },
  'textarea-name':                { wcag: '4.1.2', level: 'A',  description: 'Textarea elements must have accessible names' },
  'input-button-name':            { wcag: '4.1.2', level: 'A',  description: 'Input buttons must have discernible text' },
  'autocomplete-valid':           { wcag: '1.3.5', level: 'AA', description: 'Autocomplete attribute must be used correctly' },

  // ── Images / Media ───────────────────────────────────────────────────────
  'image-redundant-alt':          { wcag: '1.1.1', level: 'A',  description: 'Image alt text must not repeat adjacent text' },
  'blink':                        { wcag: '2.2.2', level: 'A',  description: 'Blink elements must not be used' },
  'marquee':                      { wcag: '2.2.2', level: 'A',  description: 'Marquee elements must not be used' },

  // ── Language ─────────────────────────────────────────────────────────────
  'valid-lang':                   { wcag: '3.1.2', level: 'AA', description: 'lang attributes must have valid values' },
};

// ── Fix Guidance（完整版）────────────────────────────────────────────────────
const FIX_GUIDANCE = {
  'image-alt':
    'Add an alt attribute to the <img> tag. Use descriptive text for informative images and empty alt="" for decorative images.\nExample: <img src="photo.jpg" alt="Team meeting in conference room">',
  'input-image-alt':
    'Add an alt attribute to the <input type="image"> element describing its action.\nExample: <input type="image" src="search.png" alt="Search">',
  'color-contrast':
    'Increase the contrast ratio between text and its background. WCAG requires at least 4.5:1 for normal text and 3:1 for large text (18pt+ or 14pt bold+).\nTool: https://webaim.org/resources/contrastchecker/',
  'label':
    'Associate a <label> element with each form input using the "for" attribute matching the input\'s "id".\nExample: <label for="email">Email address</label><input id="email" type="email">',
  'label-content-name-mismatch':
    'Ensure the accessible name (aria-label) of an element contains the visible label text so voice control users can activate it by speaking what they see.',
  'link-name':
    'Add descriptive text inside the <a> tag, or use aria-label/aria-labelledby. Avoid generic text like "click here" or "read more".\nExample: <a href="/report">Download Accessibility Report</a>',
  'button-name':
    'Add visible text or aria-label to all buttons.\nExample: <button aria-label="Close dialog">✕</button>',
  'heading-order':
    'Use heading tags in sequential order (h1 → h2 → h3). Do not skip levels. Each page should have exactly one <h1> that describes the page.',
  'empty-heading':
    'Headings must contain text content. Remove empty heading tags or add meaningful content.',
  'html-has-lang':
    'Add a lang attribute to the <html> element to declare the page language.\nExample: <html lang="en"> or <html lang="zh-TW">',
  'html-lang-valid':
    'Ensure the lang attribute uses a valid BCP 47 language tag.\nValid examples: en, zh-TW, zh-CN, ja, ko',
  'document-title':
    'Add a descriptive <title> inside <head>. It should uniquely identify the page.\nExample: <title>Contact Us — YourCompany</title>',
  'duplicate-id':
    'All id attributes on a page must be unique. Use classes for shared styling. Search your HTML for duplicate id values and rename them.',
  'duplicate-id-active':
    'Interactive elements (inputs, buttons, links) must not share id values. Each must have a unique id.',
  'duplicate-id-aria':
    'IDs referenced by aria-labelledby, aria-describedby, or aria-controls must be unique across the page.',
  'meta-viewport':
    'Remove user-scalable=no and maximum-scale=1 from your viewport meta tag to allow users to zoom.\nCorrect: <meta name="viewport" content="width=device-width, initial-scale=1">',
  'frame-title':
    'Add a descriptive title attribute to all <iframe> elements.\nExample: <iframe title="YouTube video: Product Demo" src="...">',
  'tabindex':
    'Remove positive tabindex values (tabindex="1", "2", etc). Use tabindex="0" to include an element in focus order, or tabindex="-1" to make it programmatically focusable only.',
  'skip-link':
    'Add a "Skip to main content" link as the first focusable element on the page.\nExample: <a href="#main-content" class="skip-link">Skip to main content</a>',
  'bypass':
    'Add a "Skip to main content" link as the first focusable element on the page.\nExample: <a href="#main-content" class="skip-link">Skip to main content</a>',
  'aria-required-children':
    'Ensure elements with certain ARIA roles contain the required child roles. For example, role="list" must contain role="listitem", and role="menu" must contain role="menuitem".\nCheck the WCAG reference for the specific role requirements.',
  'aria-required-parent':
    'Ensure elements with certain ARIA roles are contained within the correct parent role. For example, role="listitem" must be inside role="list".',
  'aria-allowed-attr':
    'Remove ARIA attributes that are not valid for the element\'s role. Each ARIA role has a defined set of allowed attributes.\nCheck: https://www.w3.org/TR/wai-aria/#role_definitions',
  'aria-required-attr':
    'Add all required ARIA attributes for the element\'s role. For example, role="checkbox" requires aria-checked.',
  'aria-roles':
    'Use only valid ARIA role values. Check the WAI-ARIA specification for a list of valid roles.\nReference: https://www.w3.org/TR/wai-aria/#role_definitions',
  'aria-valid-attr':
    'Remove or correct invalid ARIA attribute names. ARIA attributes must be from the official specification.',
  'aria-valid-attr-value':
    'Ensure ARIA attribute values are valid. For example, aria-expanded must be "true" or "false", not "yes" or "no".',
  'aria-hidden-focus':
    'Do not place focusable elements inside aria-hidden="true" containers. Either remove aria-hidden or move focusable elements outside.',
  'autocomplete-valid':
    'Add valid autocomplete attributes to form inputs to help users with cognitive disabilities.\nExample: <input type="email" autocomplete="email">',
  'select-name':
    'Add a <label> or aria-label to all <select> elements.\nExample: <label for="country">Country</label><select id="country">',
  'textarea-name':
    'Add a <label> or aria-label to all <textarea> elements.\nExample: <label for="message">Your message</label><textarea id="message">',
  'list':
    'Ensure <ul> and <ol> elements only contain <li> elements as direct children.',
  'listitem':
    'Ensure <li> elements are always direct children of <ul> or <ol>.',
  'valid-lang':
    'Ensure all lang attributes use valid BCP 47 language subtags.\nValid: lang="en", lang="zh-TW". Invalid: lang="english", lang="chinese"',
  'image-redundant-alt':
    'Do not repeat the surrounding text in an image\'s alt attribute — it causes screen readers to announce the same content twice. Use alt="" for purely decorative images.',
  'blink':
    'Remove <blink> elements. Blinking content can cause seizures. Use CSS animations with prefers-reduced-motion support instead.',
  'marquee':
    'Remove <marquee> elements. Moving content is distracting and inaccessible. Use static text or CSS with user controls instead.',
  'scrollable-region-focusable':
    'Ensure scrollable elements are keyboard accessible by adding tabindex="0" so keyboard users can scroll them.\nExample: <div tabindex="0" style="overflow:auto">...</div>',
  'link-in-text-block':
    'Links within blocks of text must be distinguishable from surrounding text by more than color alone — add underline or another visual indicator.',
};

/**
 * 取得 Chromium 執行路徑（本地開發 vs Render 部署自動切換）
 */
async function getBrowserArgs() {
  if (process.env.NODE_ENV === 'production') {
    return {
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    };
  }
  return {
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
    headless: true,
  };
}

/**
 * 主要掃描函數
 * @param {string} url   - 要掃描的網址
 * @param {Function} onProgress - 進度回呼 (step: 1-4, message: string)
 * @returns {Object} 掃描結果
 */
async function scanUrl(url, onProgress = () => {}) {
  const scanId = uuidv4();
  const startTime = Date.now();
  let browser = null;

  const progress = (step, message) => {
    try { onProgress(step, message); } catch (_) {}
  };

  try {
    // ── Step 1: 啟動瀏覽器 ───────────────────────────────────────────────
    progress(1, 'Launching browser...');
    const browserArgs = await getBrowserArgs();
    browser = await puppeteer.launch(browserArgs);

    const page = await browser.newPage();

    // 封鎖圖片、字型、CSS、媒體：對 DOM 分析無影響，大幅加速載入
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const type = req.resourceType();
      if (['image', 'media', 'font', 'stylesheet'].includes(type)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.setDefaultNavigationTimeout(25000);
    await page.setViewport({ width: 1280, height: 800 });

    // ── Step 2: 載入頁面 ─────────────────────────────────────────────────
    // domcontentloaded：DOM 就緒即掃，不等廣告、追蹤腳本載完
    progress(2, 'Loading page...');
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });

    // 等 1.5 秒讓關鍵 JS 完成渲染（取代 networkidle2 的漫長等待）
    await new Promise((r) => setTimeout(r, 1500));

    // ── Step 3: 執行 axe-core 掃描 ──────────────────────────────────────
    progress(3, 'Scanning accessibility...');
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

    // ── Step 4: 整理結果 ─────────────────────────────────────────────────
    progress(4, 'Building report...');

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
        impact: v.impact,
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

    const summary = {
      total: violations.length,
      critical: violations.filter((v) => v.impact === 'critical').length,
      serious: violations.filter((v) => v.impact === 'serious').length,
      moderate: violations.filter((v) => v.impact === 'moderate').length,
      minor: violations.filter((v) => v.impact === 'minor').length,
      passed: axeResults.passes.length,
      incomplete: axeResults.incomplete.length,
    };

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
  return FIX_GUIDANCE[ruleId]
    || 'Review the WCAG documentation for this criterion and update your code accordingly. See the WCAG Reference link above for specific guidance.';
}

module.exports = { scanUrl };
