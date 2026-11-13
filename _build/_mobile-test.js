/* Mobile viewer audit: emulate a phone, open a plate, inspect zoom/pan wiring. */
const { chromium, devices } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:/Users/Bioootak/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe',
  });
  const ctx = await browser.newContext({
    ...devices['iPhone 14'],
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });

  await page.goto('http://127.0.0.1:8931/#/j/if/1', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1500);

  // find a plate frame and click it
  const frame = page.locator('.plate-frame').first();
  const count = await page.locator('.plate-frame').count();
  console.log('plate frames on page:', count);
  if (!count) { console.log('NO PLATES'); await browser.close(); return; }

  await frame.scrollIntoViewIfNeeded();
  await frame.tap();
  await page.waitForTimeout(2500);

  const lbHidden = await page.evaluate(() => document.querySelector('#lightbox')?.hidden);
  console.log('lightbox hidden after tap:', lbHidden);
  if (lbHidden) { await page.screenshot({ path: '_mobile-test-noviewer.png' }); await browser.close(); return; }

  const info = await page.evaluate(() => {
    const sc = document.querySelector('#lbImageScroll');
    const img = document.querySelector('#lbImage');
    const stage = document.querySelector('#lbImageStage');
    const cs = sc ? getComputedStyle(sc) : null;
    return {
      scrollerTouchAction: cs && cs.touchAction,
      scrollerOverflow: cs && cs.overflow,
      imgSrc: img && img.src,
      imgComplete: img && img.complete,
      imgNatural: img && [img.naturalWidth, img.naturalHeight],
      stageSize: stage && [stage.style.width, stage.style.height],
      zoomScale: window.RTM_VIEWER && RTM_VIEWER.getScale(),
      viewerHidden: document.querySelector('#lightbox')?.hidden,
      paneRect: (() => { const p = document.querySelector('.pane'); const r = p && p.getBoundingClientRect(); return r && [r.width | 0, r.height | 0]; })(),
      shellCols: (() => { const s = document.querySelector('.viewer-shell'); return s && getComputedStyle(s).gridTemplateColumns; })(),
      hasAnno: document.querySelector('.viewer-shell')?.classList.contains('has-anno'),
      visualViewportScale: window.visualViewport && window.visualViewport.scale,
    };
  });
  console.log(JSON.stringify(info, null, 2));

  // Simulate pinch via CDP touch events on the scroller center
  const scRect = await page.evaluate(() => {
    const r = document.querySelector('#lbImageScroll').getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  const cdp = await ctx.newCDPSession(page);
  const t1 = { x: scRect.x - 40, y: scRect.y };
  const t2 = { x: scRect.x + 40, y: scRect.y };
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [
    { x: t1.x, y: t1.y, id: 1 }, { x: t2.x, y: t2.y, id: 2 }] });
  for (let i = 1; i <= 6; i++) {
    const spread = 40 + i * 25;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [
      { x: scRect.x - spread, y: scRect.y, id: 1 }, { x: scRect.x + spread, y: scRect.y, id: 2 }] });
    await page.waitForTimeout(50);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(800);

  const after = await page.evaluate(() => ({
    zoomScale: RTM_VIEWER.getScale(),
    vvScale: window.visualViewport && window.visualViewport.scale,
    scrollW: document.documentElement.scrollWidth,
    innerW: window.innerWidth,
  }));
  console.log('after pinch:', JSON.stringify(after));
  await page.screenshot({ path: '_mobile-test-viewer.png' });
  console.log('errors:', errors.length ? errors.slice(0, 10) : 'none');
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
