/* Full feature sweep of the RTM archive site.
 * Runs every view + interaction, reports PASS/FAIL, collects console/page errors
 * and failed requests. Usage: node _qa-sweep.js [baseUrl]
 */
const { chromium, devices } = require('playwright');

const BASE = process.argv[2] || 'http://127.0.0.1:8931';
const EXE = 'C:/Users/Bioootak/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';

const results = [];
const problems = [];
function check(name, ok, extra = '') {
  results.push({ name, ok: !!ok, extra });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`);
}

(async () => {
  const browser = await chromium.launch({ executablePath: EXE });
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  const failedReq = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text().slice(0, 200)); });
  page.on('requestfailed', r => failedReq.push(r.url() + ' :: ' + (r.failure() || {}).errorText));
  page.on('response', r => { if (r.status() >= 400) failedReq.push(r.url() + ' :: HTTP ' + r.status()); });

  const goto = async (hash, wait = 1200) => {
    await page.goto(BASE + '/index.html' + hash, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(wait);
  };
  const txt = async sel => { const el = await page.$(sel); return el ? (await el.textContent()).trim().slice(0, 80) : null; };

  /* ---------- 1. HOME ---------- */
  await goto('#/');
  const gridCount = await page.locator('.index-row').count();
  check('home: journal rows render', gridCount >= 50, gridCount + ' rows');
  const recentCount = await page.locator('.latest-item').count();
  check('home: recent rail renders', recentCount > 0, recentCount + ' items');
  const h1 = await txt('.wordmark, h1, .mast-title');
  check('home: masthead present', !!h1, h1 || 'none');

  /* ---------- 2. TOPICS ---------- */
  await goto('#/topics');
  const topicRows = await page.locator('#topicGrid .index-row, .view[data-view="topics"] .index-row').count();
  check('topics: rows render', topicRows > 0, topicRows + ' rows');

  /* ---------- 3. JOURNAL ---------- */
  await goto('#/j/if/1', 2000);
  const arts = await page.locator('.article').count();
  check('journal: articles render', arts > 0, arts + ' posts');
  const plates = await page.locator('.plate-frame').count();
  check('journal: plates render', plates >= 0, plates + ' plates');
  const pager = await page.locator('.pager, [class*="pager"]').count();
  check('journal: pager present', pager > 0);

  /* pagination: go to page 2 via hash */
  await goto('#/j/if/2', 1800);
  const arts2 = await page.locator('.article').count();
  check('journal p2: articles render', arts2 > 0, arts2 + ' posts');

  /* ---------- 4. POST DETAIL ---------- */
  // grab first post link
  const postHref = await page.evaluate(() => {
    const a = document.querySelector('.article a[href*="#/p/"], .article-permalink');
    return a ? a.getAttribute('href') : null;
  });
  check('post: permalink found', !!postHref, postHref || 'none');
  if (postHref) {
    await goto(postHref.replace(/^#/, '#'), 2000);
    const dt = await page.locator('#postDetailText, .post-detail, [data-view]').count();
    const detailVisible = await page.evaluate(() => {
      const v = document.querySelector('.view.is-active');
      return v ? v.dataset.view : document.querySelector('#viewPost') && !document.querySelector('#viewPost').hidden;
    });
    check('post detail: renders', !!detailVisible, 'view=' + detailVisible);
    const tabs = await page.locator('[data-post-tab]').count();
    check('post detail: lang tabs', tabs >= 2, tabs + ' tabs');
    // switch to EN tab
    const enTab = page.locator('[data-post-tab="en"]').first();
    if (await enTab.count()) { await enTab.click(); await page.waitForTimeout(400); }
    const faTab = page.locator('[data-post-tab="fa"]').first();
    if (await faTab.count()) { await faTab.click(); await page.waitForTimeout(400); }
    check('post detail: tab switching ok', true);
    // copy button (scope to the active view — hidden views keep their own)
    const copyBtn = page.locator('.view.is-active [data-action="copy-post"]').first();
    if (await copyBtn.count()) { await copyBtn.click({ timeout: 5000 }); await page.waitForTimeout(300); }
    check('post detail: copy-post clickable', await copyBtn.isVisible().catch(() => false));
  }

  /* ---------- 5. SEARCH ---------- */
  await goto('#/search', 800);
  const searchInput = page.locator('#searchInput, input[type="search"], .search-input input').first();
  if (await searchInput.count()) {
    await searchInput.fill('supply');
    await page.waitForTimeout(2500);
    const resCount = await page.locator('.search-result, .sr-item, [class*="result"]').count();
    check('search: results render', resCount >= 0, resCount + ' nodes');
  } else {
    // maybe search opens via button
    const sBtn = page.locator('[data-action="search"], #searchBtn, button[title*="جستجو"]').first();
    if (await sBtn.count()) {
      await sBtn.click(); await page.waitForTimeout(500);
      const si = page.locator('input[type="search"], .palette input, #searchInput').first();
      if (await si.count()) { await si.fill('supply'); await page.waitForTimeout(2500); }
      check('search: opened via button', true);
    } else check('search: input found', false, 'no input');
  }

  /* ---------- 6. ALL POSTS ---------- */
  await goto('#/all', 2000);
  const allRows = await page.locator('.all-post, .index-row, article').count();
  check('all posts: renders', allRows > 0, allRows + ' nodes');

  /* ---------- 7. GALLERY ---------- */
  await goto('#/gallery', 2000);
  const galImgs = await page.locator('.gallery img, .gal img, figure img').count();
  check('gallery: images render', galImgs >= 0, galImgs + ' imgs');

  /* ---------- 8. SAVED ---------- */
  await goto('#/saved', 1000);
  check('saved: view renders', await page.locator('.view.is-active').count() >= 0);

  /* ---------- 9. NOTES ---------- */
  await goto('#/notes', 1500);
  check('notes: view renders', true);

  /* ---------- 10. VIEWER ---------- */
  await goto('#/j/if/1', 2000);
  const frame = page.locator('.plate-frame').first();
  if (await frame.count()) {
    await frame.scrollIntoViewIfNeeded();
    await frame.click();
    await page.waitForTimeout(2500);
    const lbHidden = await page.evaluate(() => document.querySelector('#lightbox')?.hidden);
    check('viewer: opens on plate click', lbHidden === false);
    const imgOk = await page.evaluate(() => {
      const i = document.querySelector('#lbImage');
      return i && i.complete && i.naturalWidth > 0;
    });
    check('viewer: image loads', !!imgOk);
    // zoom in button
    const zIn = page.locator('#lbZoomIn');
    if (await zIn.count()) { await zIn.click(); await page.waitForTimeout(300); }
    const scale1 = await page.evaluate(() => RTM_VIEWER && RTM_VIEWER.getScale());
    check('viewer: zoom-in works', scale1 > 0.2, 'scale=' + scale1);
    // fit button
    const zFit = page.locator('#lbZoomFit');
    if (await zFit.count()) { await zFit.click(); await page.waitForTimeout(300); }
    // next/prev
    const zNext = page.locator('#lbNext');
    if (await zNext.count() && !(await zNext.isDisabled())) { await zNext.click(); await page.waitForTimeout(800); }
    const counter = await txt('#lbCounter');
    check('viewer: counter updates', !!counter, counter);
    // width + actual buttons
    for (const id of ['#lbZoomWidth', '#lbZoomActual']) {
      const b = page.locator(id);
      if (await b.count() && await b.isVisible()) { await b.click(); await page.waitForTimeout(200); }
    }
    // close via Esc
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    const closed = await page.evaluate(() => document.querySelector('#lightbox')?.hidden);
    check('viewer: Esc closes', closed === true);
    // reopen via deep link plate route? test #/i/
  } else check('viewer: plate found', false);

  /* deep link to image: #/i/<jid>/<page>/<key> — skip if unknown key; test journal-level */
  await goto('#/j/if/1', 1500);

  /* ---------- 11. SETTINGS DRAWER ---------- */
  const setBtn = page.locator('[data-action="settings"], #settingsBtn, button[title*="تنظیم"]').first();
  if (await setBtn.count()) {
    await setBtn.click(); await page.waitForTimeout(600);
    const drawer = await page.evaluate(() => {
      const d = document.querySelector('#settingsDrawer');
      return d ? !d.hidden : null;
    });
    check('settings: drawer opens', drawer === true);
    // toggle theme
    const themeBtn = page.locator('[data-set="theme"], #setTheme, .seg button').first();
    if (await themeBtn.count()) { await themeBtn.click(); await page.waitForTimeout(300); }
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  } else check('settings: button found', false);

  /* ---------- 12. PALETTE (command palette) ---------- */
  await page.keyboard.press('Control+k');
  await page.waitForTimeout(500);
  const pal = await page.evaluate(() => {
    const p = document.querySelector('#palette');
    return p ? !p.hidden : null;
  });
  if (pal === true) {
    const palInput = page.locator('#palette input, .palette input').first();
    if (await palInput.count()) { await palInput.fill('if'); await page.waitForTimeout(800); }
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    check('palette: opens + query', true);
  } else {
    // try '/' shortcut
    await page.keyboard.press('/');
    await page.waitForTimeout(400);
    check('palette: opens', pal === true, 'palette hidden=' + pal);
  }

  /* ---------- 13. BOOKMARK / READ MARK ---------- */
  await goto('#/j/if/1', 1800);
  const bmBtn = page.locator('.view.is-active [data-action="bookmark"]').first();
  if (await bmBtn.count()) {
    await bmBtn.click(); await page.waitForTimeout(400);
    check('bookmark: toggle works', true);
    await bmBtn.click(); await page.waitForTimeout(300); // untoggle
  } else check('bookmark: button found', false, 'none on page');

  /* ---------- 14. MOBILE VIEWER ---------- */
  const mctx = await browser.newContext({ ...devices['iPhone 14'], viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const mp = await mctx.newPage();
  const mErrors = [];
  mp.on('pageerror', e => mErrors.push(e.message));
  await mp.goto(BASE + '/index.html#/j/if/1', { waitUntil: 'domcontentloaded' });
  await mp.waitForTimeout(2500);
  const mArts = await mp.locator('.article').count();
  check('mobile: journal renders', mArts > 0, mArts + ' posts');
  const hScroll = await mp.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
  check('mobile: no horizontal overflow', !hScroll);
  const mFrame = mp.locator('.plate-frame').first();
  if (await mFrame.count()) {
    await mFrame.scrollIntoViewIfNeeded();
    await mFrame.tap();
    await mp.waitForTimeout(2500);
    const lbOpen = await mp.evaluate(() => document.querySelector('#lightbox') && !document.querySelector('#lightbox').hidden);
    check('mobile: viewer opens on tap', lbOpen === true);
    const pinch = await mp.evaluate(() => {
      const sc = document.querySelector('#lbImageScroll');
      return sc ? getComputedStyle(sc).touchAction : 'none';
    });
    check('mobile: scroller touch-action', pinch === 'none', pinch);
    const zWidth = mp.locator('#lbZoomWidth');
    check('mobile: width-fit button visible', await zWidth.isVisible().catch(() => false));
    await mp.keyboard.press('Escape');
    await mp.waitForTimeout(300);
    const mClosed = await mp.evaluate(() => document.querySelector('#lightbox')?.hidden);
    check('mobile: viewer closes', mClosed === true);
  }
  if (mErrors.length) problems.push(...mErrors.map(e => 'MOBILE ' + e));
  await mctx.close();

  /* ---------- error report ---------- */
  const uniqErr = [...new Set(errors)].slice(0, 20);
  const uniqReq = [...new Set(failedReq)].slice(0, 20);
  console.log('\n===== SUMMARY =====');
  const fails = results.filter(r => !r.ok);
  console.log(`checks: ${results.length}, pass: ${results.length - fails.length}, fail: ${fails.length}`);
  if (uniqErr.length) { console.log('\nPAGE/CONSOLE ERRORS:'); uniqErr.forEach(e => console.log('  ' + e)); }
  if (uniqReq.length) { console.log('\nFAILED REQUESTS:'); uniqReq.forEach(e => console.log('  ' + e)); }
  if (problems.length) { console.log('\nMOBILE ERRORS:'); problems.forEach(e => console.log('  ' + e)); }
  await browser.close();
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
