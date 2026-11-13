const { chromium, devices } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Users/Bioootak/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
  const ctx = await browser.newContext({ ...devices['iPhone 14'], viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  // journal page -> open a plate -> system back -> should stay on journal
  await page.goto('http://127.0.0.1:8931/index.html#/j/if/1', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  const hashBefore = await page.evaluate(() => location.hash);
  const frame = page.locator('.plate-frame').first();
  console.log('frames:', await page.locator('.plate-frame').count());
  await frame.scrollIntoViewIfNeeded();
  await frame.tap();
  await page.waitForTimeout(2500);
  console.log('viewer open:', await page.evaluate(() => !document.querySelector('#lightbox').hidden), '| hash:', await page.evaluate(() => location.hash));
  await page.goBack();
  await page.waitForTimeout(900);
  const st = await page.evaluate(() => ({
    viewerHidden: document.querySelector('#lightbox').hidden,
    hash: location.hash,
    view: document.querySelector('.view.is-active')?.dataset.view,
    articles: document.querySelectorAll('.article').length,
  }));
  console.log('after back:', JSON.stringify(st), '| expected hash:', hashBefore);
  await page.goForward();
  await page.waitForTimeout(600);
  console.log('after forward:', JSON.stringify(await page.evaluate(() => ({ h: location.hash, vh: document.querySelector('#lightbox').hidden }))));
  // now close via X and press back — should leave journal
  await page.locator('#lightbox').evaluate(el => { if (el.hidden === false) document.querySelector('#lbCloseTop')?.click(); });
  await page.goBack();
  await page.waitForTimeout(900);
  console.log('after X-close + back:', JSON.stringify(await page.evaluate(() => ({ h: location.hash, view: document.querySelector('.view.is-active')?.dataset.view }))));
  console.log('ERRORS:', errs.length ? errs : 'none');
  await browser.close();
})();
