const { chromium, devices } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Users/Bioootak/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
  const ctx = await browser.newContext({ ...devices['iPhone 14'], viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:8931/#/j/if/1', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1200);
  await page.locator('.plate-frame').first().tap();
  await page.waitForTimeout(2000);

  const cdp = await ctx.newCDPSession(page);
  async function pinchAt(x, y, spread0, spread1) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [
      { x: x - spread0, y, id: 1 }, { x: x + spread0, y, id: 2 }] });
    for (let i = 1; i <= 5; i++) {
      const s = spread0 + (spread1 - spread0) * i / 5;
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [
        { x: x - s, y, id: 1 }, { x: x + s, y, id: 2 }] });
      await page.waitForTimeout(40);
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(400);
  }
  const probe = () => page.evaluate(() => ({
    vv: window.visualViewport.scale,
    scrollW: document.documentElement.scrollWidth,
    iw: window.innerWidth,
    zoom: RTM_VIEWER.getScale(),
  }));

  // pinch ON THE TOOLBAR — must not page-zoom
  const tb = await page.evaluate(() => { const r = document.querySelector('.viewer-toolbar').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  const ta = await page.evaluate(() => getComputedStyle(document.querySelector('.viewer-toolbar')).touchAction);
  console.log('toolbar touch-action:', ta);
  await pinchAt(tb.x, tb.y, 30, 90);
  console.log('after toolbar pinch:', JSON.stringify(await probe()));

  // pinch on the image — must zoom image, not page
  const sc = await page.evaluate(() => { const r = document.querySelector('#lbImageScroll').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await pinchAt(sc.x, sc.y + 200, 30, 90);
  console.log('after image pinch:', JSON.stringify(await probe()));

  // single-finger drag pan while zoomed — should pan, not scroll page
  const before = await probe();
  const cdp2 = cdp;
  await cdp2.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: sc.x, y: sc.y + 200, id: 1 }] });
  for (let i = 1; i <= 5; i++) {
    await cdp2.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: sc.x - i * 20, y: sc.y + 200, id: 1 }] });
    await page.waitForTimeout(30);
  }
  await cdp2.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(300);
  const sl = await page.evaluate(() => document.querySelector('#lbImageScroll').scrollLeft);
  console.log('pan scrollLeft:', sl, '(was panning, page vv still', (await probe()).vv + ')');
  await page.screenshot({ path: '_mobile-test2.png' });
  await browser.close();
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
