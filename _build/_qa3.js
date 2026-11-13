const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Users/Bioootak/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
  const page = await (await browser.newContext({ viewport: { width: 1366, height: 900 } })).newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  page.on('response', r => { if (r.status() >= 400) errs.push(r.status() + ' ' + r.url()); });
  await page.goto('http://127.0.0.1:8931/index.html#/j/if/1', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await page.locator('.plate-frame').first().click();
  await page.waitForTimeout(2500);
  // open annotate mode
  const annoBtn = page.locator('#lbAnnotate');
  if (await annoBtn.count()) {
    await annoBtn.click();
    await page.waitForTimeout(3000); // lazy-loads annotate.min.js
    const state = await page.evaluate(() => ({
      annoRail: !document.querySelector('#annoRail')?.hidden,
      anno: !!window.Anno,
      viewerAnno: document.querySelector('#lightbox')?.classList.contains('is-annotating'),
    }));
    console.log('ANNO:', JSON.stringify(state));
    // pick a tool if rail visible
    const tool = page.locator('#annoTools button').first();
    if (await tool.count() && await tool.isVisible()) { await tool.click(); await page.waitForTimeout(300); }
    // draw a stroke on the stage via mouse
    const stage = await page.locator('#lbImageStage').boundingBox();
    if (stage) {
      await page.mouse.move(stage.x + stage.width * 0.3, stage.y + stage.height * 0.3);
      await page.mouse.down();
      await page.mouse.move(stage.x + stage.width * 0.5, stage.y + stage.height * 0.5, { steps: 8 });
      await page.mouse.up();
      await page.waitForTimeout(500);
      const marks = await page.evaluate(() => document.querySelectorAll('.anno-mark').length);
      console.log('marks after stroke:', marks);
    }
  } else console.log('ANNO: button missing');
  console.log('ERRORS:', errs.length ? errs.slice(0, 10) : 'none');
  await browser.close();
})();
