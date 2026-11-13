const { chromium, devices } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Users/Bioootak/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
  const ctx = await browser.newContext({ ...devices['iPhone 14'], viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.goto('http://127.0.0.1:8931/index.html#/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await page.goto('http://127.0.0.1:8931/index.html#/j/if/1', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  await page.locator('.plate-frame').first().tap();
  await page.waitForTimeout(2500);
  // close via X button while open
  await page.locator('#lbCloseTop').click();
  await page.waitForTimeout(900);
  console.log('after X close:', JSON.stringify(await page.evaluate(() => ({ h: location.hash, vh: document.querySelector('#lightbox').hidden }))));
  // now system back should leave the journal (pushed entry already spent)
  await page.goBack();
  await page.waitForTimeout(900);
  console.log('after back:', JSON.stringify(await page.evaluate(() => ({ h: location.hash, view: document.querySelector('.view.is-active')?.dataset.view }))));
  console.log('ERRORS:', errs.length ? errs : 'none');
  await browser.close();
})();
