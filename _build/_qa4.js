const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Users/Bioootak/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
  const page = await (await browser.newContext({ viewport: { width: 1366, height: 900 } })).newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.goto('http://127.0.0.1:8931/index.html#/j/if/1', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await page.locator('.plate-frame').first().click();
  await page.waitForTimeout(2500);
  await page.locator('#lbAnnotate').click();
  await page.waitForTimeout(3000);
  await page.locator('.anno-tool[data-tool="pen"]').click();
  await page.waitForTimeout(300);
  const stage = await page.locator('#lbImageStage').boundingBox();
  await page.mouse.move(stage.x + stage.width * 0.3, stage.y + stage.height * 0.3);
  await page.mouse.down();
  await page.mouse.move(stage.x + stage.width * 0.5, stage.y + stage.height * 0.55, { steps: 10 });
  await page.mouse.move(stage.x + stage.width * 0.7, stage.y + stage.height * 0.4, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(800);
  const res = await page.evaluate(() => ({
    marks: document.querySelectorAll('.anno-mark').length,
    paths: document.querySelectorAll('.anno-mark path, .anno-mark polyline').length,
    count: document.querySelector('#annoCount')?.textContent,
  }));
  console.log('PEN DRAW:', JSON.stringify(res));
  // undo
  const undo = page.locator('#annoUndo');
  if (await undo.isEnabled().catch(() => false)) { await undo.click(); await page.waitForTimeout(400); }
  console.log('after undo marks:', await page.evaluate(() => document.querySelectorAll('.anno-mark').length));
  console.log('ERRORS:', errs.length ? errs : 'none');
  await browser.close();
})();
