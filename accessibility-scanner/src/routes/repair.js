const express = require('express');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const { prisma } = require('../lib/db');
const { requireAuth } = require('../middleware/requireAuth');

const router = express.Router();

// Apply rule-based HTML fixes based on axe-core violation IDs
function applyFixes(html, violations) {
  let fixed = html;
  const fixesApplied = [];

  for (const v of violations) {
    switch (v.id) {
      case 'meta-refresh': {
        const before = fixed;
        fixed = fixed.replace(
          /<meta[^>]*http-equiv\s*=\s*["']refresh["'][^>]*\/?>\s*/gi,
          '<!-- meta-refresh removed: WCAG 2.2.2 -->\n'
        );
        if (fixed !== before) fixesApplied.push('Removed <meta http-equiv="refresh"> (WCAG 2.2.2)');
        break;
      }

      case 'html-has-lang': {
        if (!/<html[^>]*\blang\s*=/i.test(fixed)) {
          // Detect language from page metadata before defaulting to 'en'
          let detectedLang = 'en';

          // 1. Check xml:lang attribute on <html>
          const xmlLangMatch = fixed.match(/<html[^>]*\bxml:lang\s*=\s*["']([^"']+)["']/i);
          if (xmlLangMatch) {
            detectedLang = xmlLangMatch[1].trim();
          }

          // 2. Check <meta http-equiv="Content-Language" content="...">
          const metaHttpA = fixed.match(/<meta[^>]*http-equiv\s*=\s*["']Content-Language["'][^>]*content\s*=\s*["']([^"']+)["']/i);
          const metaHttpB = fixed.match(/<meta[^>]*content\s*=\s*["']([^"']+)["'][^>]*http-equiv\s*=\s*["']Content-Language["']/i);
          const metaHttp = metaHttpA || metaHttpB;
          if (metaHttp) {
            detectedLang = metaHttp[1].split(',')[0].trim();
          }

          // 3. Check <meta name="language" content="...">
          const metaNameA = fixed.match(/<meta[^>]*name\s*=\s*["']language["'][^>]*content\s*=\s*["']([^"']+)["']/i);
          const metaNameB = fixed.match(/<meta[^>]*content\s*=\s*["']([^"']+)["'][^>]*name\s*=\s*["']language["']/i);
          const metaName = metaNameA || metaNameB;
          if (metaName) {
            detectedLang = metaName[1].trim();
          }

          fixed = fixed.replace(/<html([^>]*)>/i, `<html$1 lang="${detectedLang}">`);
          fixesApplied.push(`Added lang="${detectedLang}" to <html> (WCAG 3.1.1)`);
        }
        break;
      }

      case 'document-title': {
        if (!/<title[\s>]/i.test(fixed)) {
          fixed = fixed.replace(/<head([^>]*)>/i, '<head$1>\n  <title>Accessible Page</title>');
          fixesApplied.push('Added <title> element (WCAG 2.4.2)');
        }
        break;
      }

      case 'meta-viewport': {
        const before = fixed;
        fixed = fixed.replace(
          /(<meta[^>]*name=["']viewport["'][^>]*content=["'][^"']*)user-scalable=no,?\s*/gi,
          '$1'
        );
        fixed = fixed.replace(
          /(<meta[^>]*content=["'][^"']*)maximum-scale=1,?\s*/gi,
          '$1'
        );
        if (fixed !== before) fixesApplied.push('Removed user-scalable=no from viewport (WCAG 1.4.4)');
        break;
      }

      case 'image-alt': {
        const before = fixed;
        fixed = fixed.replace(
          /<img(?![^>]*\balt=)[^>]*>/gi,
          (m) => {
            // Extract src filename to generate descriptive alt text
            const srcMatch = m.match(/\bsrc\s*=\s*["']([^"']+)["']/i);
            let altText = '';
            if (srcMatch) {
              try {
                const filename = srcMatch[1].split('/').pop().split('?')[0];
                const nameWithoutExt = filename.replace(/\.[^.]+$/, '');
                altText = decodeURIComponent(nameWithoutExt)
                  .replace(/[-_.]+/g, ' ')
                  .replace(/\s+/g, ' ')
                  .trim();
                if (altText.length > 0) {
                  altText = altText.charAt(0).toUpperCase() + altText.slice(1);
                }
              } catch (e) {
                altText = '';
              }
            }
            return m.replace(/\s*\/?>$/, ` alt="${altText}">`);
          }
        );
        if (fixed !== before) fixesApplied.push('Added descriptive alt text to images missing alt (WCAG 1.1.1)');
        break;
      }

      case 'bypass':
      case 'skip-link': {
        if (!/<a[^>]*href=["']#main/i.test(fixed)) {
          fixed = fixed.replace(
            /<body([^>]*)>/i,
            `<body$1>\n  <a href="#main-content" style="position:absolute;top:-40px;left:0;background:#000;color:#fff;padding:8px;z-index:9999" onfocus="this.style.top='0'" onblur="this.style.top='-40px'">Skip to main content</a>`
          );
          fixesApplied.push('Added skip navigation link (WCAG 2.4.1)');
        }
        break;
      }

      default:
        break;
    }
  }

  return { fixedHtml: fixed, fixesApplied };
}

function generateDiff(original, fixed) {
  const a = original.split('\n'), b = fixed.split('\n');
  const out = [];
  for (let i = 0; i < Math.max(a.length, b.length) && out.length < 120; i++) {
    if (a[i] !== b[i]) {
      if (a[i] !== undefined) out.push('- ' + a[i]);
      if (b[i] !== undefined) out.push('+ ' + b[i]);
    }
  }
  return out.join('\n');
}

async function getPageHtml(url) {
  let browser = null;
  try {
    const opts =
      process.env.NODE_ENV === 'production'
        ? {
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
          }
        : {
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
            executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
            headless: true,
          };

    browser = await puppeteer.launch(opts);
    const page = await browser.newPage();

    await page.setRequestInterception(true);
    page.on('request', (req) =>
      ['image', 'media', 'font', 'stylesheet'].includes(req.resourceType())
        ? req.abort()
        : req.continue()
    );

    await page.setDefaultNavigationTimeout(25000);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await new Promise((r) => setTimeout(r, 1000));
    return await page.content();
  } finally {
    if (browser) await browser.close();
  }
}

// POST /api/repair — generate auto-fix for a scanned URL
router.post('/', requireAuth, async (req, res) => {
  const { url, violations } = req.body;
  if (!url) return res.status(400).json({ error: 'url is required' });
  if (!Array.isArray(violations)) return res.status(400).json({ error: 'violations must be an array' });

  try {
    console.log(`[REPAIR] Fetching HTML for: ${url}`);
    const originalHtml = await getPageHtml(url);

    const { fixedHtml, fixesApplied } = applyFixes(originalHtml, violations);
    const diff = generateDiff(originalHtml, fixedHtml);

    await prisma.Repair.create({
      data: {
        userId: req.user.id,
        originalHtml,
        repairedHtml: fixedHtml,
        diff,
        issueCount: violations.length,
        status: 'COMPLETED',
      },
    });

    console.log(`[REPAIR] Applied ${fixesApplied.length} fixes to ${url}`);
    return res.json({
      fixesApplied,
      fixesCount: fixesApplied.length,
      issueCount: violations.length,
      repairedHtml: fixedHtml,
      diff,
    });
  } catch (err) {
    console.error('[REPAIR ERROR]', err.message);
    return res.status(500).json({ error: 'Auto-fix failed. Please try again.' });
  }
});

module.exports = router;
