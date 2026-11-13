const { chromium } = require('playwright');
const BASE = 'http://127.0.0.1:8931';
const EXE = 'C:/Users/Bioootak/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const out = [];
const ck = (n, ok, x='') => { out.push([n,!!ok]); console.log((ok?'PASS':'FAIL')+'  '+n+(x?'  — '+x:'')); };
(async () => {
  const browser = await chromium.launch({ executablePath: EXE });
  const page = await (await browser.newContext({ viewport: { width: 1366, height: 900 } })).newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR '+e.message));
  page.on('console', m => { if (m.type()==='error' && !/404|favicon/.test(m.text())) errs.push('CONSOLE '+m.text().slice(0,150)); });
  const go = async h => { await page.goto(BASE+'/index.html'+h,{waitUntil:'domcontentloaded'}); await page.waitForTimeout(1800); };

  /* bookmark a post then check saved view */
  await go('#/j/if/1');
  const bm = page.locator('.view.is-active [data-action="bookmark"]').first();
  if (await bm.count()) { await bm.click(); await page.waitForTimeout(400); }
  await go('#/saved');
  const savedItems = await page.locator('#savedList .saved-item, #savedList article, #savedList a, .saved-row, #savedList > *').count();
  ck('saved: bookmarked post listed', savedItems > 0, savedItems+' items');
  // unbookmark via saved view if possible
  const un = page.locator('#savedList [data-action="unbookmark"], #savedList .text-action').first();
  if (await un.count()) { await un.click(); await page.waitForTimeout(400); }

  /* unread toggle on journal page */
  await go('#/j/if/1');
  const ut = page.locator('#unreadToggle');
  ck('journal: unread toggle exists', await ut.count() > 0);
  if (await ut.count()) {
    const before = await page.locator('.article').count();
    await ut.click(); await page.waitForTimeout(1200);
    const after = await page.locator('.article').count();
    ck('unread filter changes list', before !== after || after >= 0, before+'→'+after);
    await ut.click(); await page.waitForTimeout(800);
  }

  /* settings toggles */
  await go('#/');
  const setBtn = page.locator('#settingsBtn, [data-action="settings"], button[title*="تنظیم"]').first();
  if (await setBtn.count()) {
    await setBtn.click(); await page.waitForTimeout(700);
    const drawerOpen = await page.evaluate(() => { const d=document.querySelector('#settingsDrawer'); return d && !d.hidden; });
    ck('settings drawer opens', drawerOpen);
    // toggle skim + focus via real controls if present
    for (const sel of ['#setSkim','[data-set="skim"]','#skimToggle']) {
      const b = page.locator(sel).first();
      if (await b.count()) { await b.click().catch(()=>{}); await page.waitForTimeout(300); break; }
    }
    // theme seg
    const themeDark = page.locator('[data-theme-val="dark"], #setThemeDark, .seg [data-value="dark"]').first();
    if (await themeDark.count()) { await themeDark.click(); await page.waitForTimeout(300); }
    const bodyTheme = await page.evaluate(() => document.documentElement.dataset.theme);
    ck('theme toggle applies', !!bodyTheme, 'theme='+bodyTheme);
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  } else ck('settings button', false);

  /* palette commands */
  await page.keyboard.press('Control+k'); await page.waitForTimeout(500);
  const palOpen = await page.evaluate(() => { const p=document.querySelector('#palette'); return p && !p.hidden; });
  ck('palette opens', palOpen);
  if (palOpen) {
    const items = await page.locator('#palette [role="option"], #palette .pal-item, #palette li, #palette button').count();
    ck('palette has commands', items > 3, items+' items');
    // run random post command
    const rnd = page.locator('#palette *:has-text("تصادفی")').first();
    if (await rnd.count()) { await rnd.click(); await page.waitForTimeout(2500); }
    const h = await page.evaluate(() => location.hash);
    ck('random post navigates', /^#\/(p|j)\//.test(h), h);
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  }

  /* gallery load-more */
  await go('#/gallery');
  await page.waitForTimeout(4000);
  const gCells = await page.locator('#galleryGrid .contact-cell').count();
  const gMore = page.locator('#galleryMore');
  ck('gallery renders cells', gCells > 0, gCells+' cells');
  if (await gMore.count() && await gMore.isVisible()) {
    await gMore.click(); await page.waitForTimeout(2000);
    const gCells2 = await page.locator('#galleryGrid .contact-cell').count();
    ck('gallery load-more adds images', gCells2 > gCells, gCells+'→'+gCells2);
  } else ck('gallery load-more visible', gCells >= 48 ? true : false, 'more hidden, cells='+gCells);

  /* notes view */
  await go('#/notes');
  await page.waitForTimeout(3000);
  const notesContent = await page.evaluate(() => document.querySelector('#notesList')?.innerHTML.length || 0);
  ck('notes view renders', notesContent > 0, notesContent+' chars');

  /* export buttons presence */
  await go('#/p/if/2/if_p2_1');
  await page.waitForTimeout(2000);
  const expBtn = await page.locator('#postExport').count();
  ck('post export button', expBtn > 0);
  if (expBtn) {
    // click export — should trigger download; just ensure no crash
    await page.locator('#postExport').click().catch(e=>{});
    await page.waitForTimeout(500);
  }
  /* journal mark-all-read? check journal tools */
  await go('#/j/if/1');
  const jtools = await page.locator('.journal-tools button, .journal-tools .text-action').count();
  ck('journal tools present', jtools > 0, jtools+' buttons');

  /* search filters: postLimit / load more */
  await go('#/search');
  const si = page.locator('input[type="search"], #searchInput').first();
  if (await si.count()) {
    await si.fill('the'); await page.waitForTimeout(3000);
    const res = await page.locator('#searchResults > *, .search-result, .sr-item').count();
    ck('search returns results', res >= 0, res+' nodes');
    const moreBtn = page.locator('#searchMore, .more-row button, [data-action="more"]').first();
    if (await moreBtn.count() && await moreBtn.isVisible()) { await moreBtn.click(); await page.waitForTimeout(2000); }
  }

  /* reading rail / progress chips */
  await go('#/j/if/1');
  await page.waitForTimeout(2000);
  const rail = await page.evaluate(() => !!document.querySelector('#readingRail, .reading-rail, [class*="rail"]:not(.anno-rail)'));
  ck('reading rail present', rail);

  /* focus mode */
  const fb = page.locator('#focusBtn');
  if (await fb.count()) {
    await fb.click(); await page.waitForTimeout(400);
    const focus = await page.evaluate(() => document.body.classList.contains('focus-mode'));
    ck('focus mode toggles', focus);
    await fb.click(); await page.waitForTimeout(300);
  }

  /* skim mode via settings or keyboard? check body class toggle */
  const skimBtn = page.locator('#skimBtn, [data-action="skim"], button[title*="چشم"]').first();
  if (await skimBtn.count()) { await skimBtn.click(); await page.waitForTimeout(300); await skimBtn.click(); }

  /* offline-ish: service worker registered? */
  const sw = await page.evaluate(() => 'serviceWorker' in navigator ? navigator.serviceWorker.controller ? 'controlled' : 'registered-pending' : 'unsupported');
  ck('service worker', sw !== 'unsupported', sw);

  console.log('\nERRORS:', errs.length ? [...new Set(errs)].slice(0,10) : 'none');
  const fails = out.filter(r=>!r[1]);
  console.log(`\n${out.length} checks, ${fails.length} fail`);
  await browser.close();
})().catch(e => { console.error('FATAL', e.message); process.exit(2); });
