const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Users/Bioootak/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
  const page = await (await browser.newContext({ viewport: { width: 1366, height: 900 } })).newPage();
  const bad = [];
  page.on('response', r => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url()); });
  // gallery
  await page.goto('http://127.0.0.1:8931/index.html#/gallery', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(6000);
  const gal = await page.evaluate(() => ({
    cells: document.querySelectorAll('#galleryGrid .contact-cell').length,
    imgs: document.querySelectorAll('#galleryGrid img').length,
    count: document.querySelector('#galleryCount')?.textContent,
    err: document.querySelector('#galleryGrid .empty-state, #galleryGrid [class*="error"]')?.textContent?.slice(0, 100),
  }));
  console.log('GALLERY:', JSON.stringify(gal));
  // post detail copy-post presence
  await page.goto('http://127.0.0.1:8931/index.html#/p/if/2/if_p2_1', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  const cp = await page.evaluate(() => ({
    activeView: document.querySelector('.view.is-active')?.dataset.view,
    copyPostInActive: !!document.querySelector('.view.is-active [data-action="copy-post"]'),
    postCopyBtn: !!document.querySelector('#postCopy'),
    anyCopyPost: document.querySelectorAll('[data-action="copy-post"]').length,
  }));
  console.log('POST DETAIL:', JSON.stringify(cp));
  console.log('BAD REQ:', bad.slice(0, 10));
  await browser.close();
})();
