'use strict';

/* ============================================================
   RTM Journal Archive — front-end
   Static, offline-friendly, RTL Persian reading archive.
   "Paper & ink" shell: no cards, no glass. The chrome is typographic,
   the reading surface keeps its measure, and every overlay gives the
   height back to the text when the reader is done with it.
   ============================================================ */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const SETTINGS_KEY = 'rtm_archive_settings_v3';
const BOOKMARKS_KEY = 'rtm_bookmarks_v1';
const READING_KEY = 'rtm_reading_v1';
const PROGRESS_KEY = 'rtm_progress_v1';

const DEFAULT_SETTINGS = {
  fontSize: 15,            // the one reading-size token; every text surface derives from it
  theme: 'paper',          // paper | dark — the plain base theme, independent of the lamp
  lamp: false,             // reading lamp: warm palette + focus + bigger text + calm motion
  lampTone: 'dark',        // dark | sepia — which warm palette the lamp casts
  lampAuto: false,         // lamp switches itself on during the night hours
  skim: false,             // skim mode: text only, plates and quotes hidden
  focus: false,            // hide the chrome, keep the text
  sidebar: 'auto',         // auto | open | closed
  header: 'compact',       // compact | static
  imageFit: 'fit',         // fit | width | actual
  wheel: 'zoom',           // zoom | pan — what a bare wheel does over a plate
  language: 'both',        // both | fa | en — one reading mode for cards and posts
};

const App = {
  index: null,
  cache: window.RTM_JOURNAL_CACHE || {},
  settings: loadSettings(),
  currentView: 'home',
  currentJournal: null,
  currentPage: 1,
  currentPagePosts: [],
  postDetail: { journal: null, post: null, page: 1, view: 'both' },
  journalToken: 0,
  search: { shards: {}, q: '', postLimit: 30, posts: [], loading: false, error: '', token: 0, loaded: 0, total: 0, failed: 0 },
  all: {
    shards: {}, rows: null, filter: 'all', text: '', savedOnly: false, limit: 40,
    loading: false, error: '', loaded: 0, total: 0, failed: 0, renderTimer: 0,
  },
  gallery: { journalId: '', items: [], currentJournal: null, limit: 48, loading: false, error: '' },
  viewer: { items: [], idx: 0, journal: null, returnFocus: null, zoom: { scale: 1, fit: 1, fitW: 1, natW: 0, natH: 0, mode: 'fit' } },
  railOpen: false,
  postReturn: null,
  pendingRestore: null,
  pendingScrollPost: null,
  paletteReturnFocus: null,
  paletteItems: [],
  promises: {},
  bookmarks: loadBookmarks(),
  reading: loadReading(),
  progress: loadProgress(),
  unreadOnly: false,
  journalFilter: '',
  _readObserver: undefined,
};

/* ============================== utilities ============================== */

function icon(name, cls = '') {
  return `<svg class="icon ${cls}" aria-hidden="true"><use href="#i-${name}"></use></svg>`;
}

function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function faNum(n) {
  if (n == null || Number.isNaN(Number(n))) return '—';
  try { return new Intl.NumberFormat('fa-IR').format(Number(n)); } catch { return String(n); }
}

const RANK_FA = {
  'Master Trader': 'مستر تریدر',
  'Expert Trader': 'اکسپرت تریدر',
  'Senior Trader': 'سینیور تریدر',
  'Associate Trader': 'آسوشیت تریدر',
  'Trader': 'تریدر',
  'Junior Trader': 'جونیور تریدر',
  'Student': 'دانشجو',
  'Newbie': 'تازه‌کار',
  'Moderator': 'مدیر انجمن',
  'Administrator': 'مدیر',
  'Fresh Boarder': 'کاربر تازه',
  'Junior Boarder': 'کاربر جونیور',
  'Senior Boarder': 'کاربر سینیور',
  'Expert Boarder': 'کاربر اکسپرت',
  'Gold Boarder': 'کاربر طلایی',
  'Platinum Boarder': 'کاربر پلاتینیوم',
  'Boarder': 'کاربر انجمن',
  'Guest': 'مهمان',
};

function rankLabel(rank) {
  /* The archive shows the forum's own English title — «Master Trader»,
     «Trader» — the way the author card printed it. */
  return String(rank || '').trim();
}

/* The forum prints a small icon under each rank title; the archive keeps it
   beside the Persian label so a Master Trader reads like the original card. */
function rankBadgeHTML(rank) {
  const key = String(rank || '').trim();
  const b = ((App.index && App.index.rankBadges) || {})[key];
  if (!b || !b.src) return '';
  return `<img class="rank-badge" src="${esc(b.src)}" alt="" width="18" height="18" loading="lazy" decoding="async">`;
}

function norm(value) {
  return String(value || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[يى]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/[\u064B-\u0652\u0670\u0640]/g, '')
    .replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 0x06F0))
    .replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 0x0660))
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function debounce(fn, ms) {
  let t = 0;
  return function (...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), ms);
  };
}

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlight(text, q) {
  const raw = String(text == null ? '' : text);
  const needle = String(q || '').trim();
  if (!needle) return esc(raw);
  /* Match on the raw text and escape only the pieces: searching the escaped
     HTML let a query like "amp" mark the inside of an `&amp;` entity and
     printed a broken entity on screen. */
  let re;
  try { re = new RegExp(escapeRegex(needle), 'gi'); } catch { return esc(raw); }
  let out = '';
  let last = 0;
  let m;
  while ((m = re.exec(raw))) {
    if (!m[0]) { re.lastIndex += 1; continue; }
    out += esc(raw.slice(last, m.index)) + '<mark>' + esc(m[0]) + '</mark>';
    last = m.index + m[0].length;
  }
  return out + esc(raw.slice(last));
}

function snippet(text, q, max = 230) {
  const raw = String(text || '').replace(/\s+/g, ' ').trim();
  if (!raw) return '';
  let idx = -1;
  if (q) {
    idx = raw.toLowerCase().indexOf(q.toLowerCase());
    if (idx < 0) idx = raw.indexOf(q);
  }
  if (idx < 0) idx = 0;
  const start = Math.max(0, idx - Math.floor(max * .35));
  const end = Math.min(raw.length, start + max);
  return (start > 0 ? '… ' : '') + raw.slice(start, end) + (end < raw.length ? ' …' : '');
}

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

/* The owner reads four journals first. They lead every list and carry a badge;
   the rest stay alphabetical. */
const JOURNAL_PRIORITY = ['if', 'salivan', 'pedini', 'benhur'];
function priorityRank(id) {
  const i = JOURNAL_PRIORITY.indexOf(id);
  return i < 0 ? 0 : i + 1;
}
/* The archive holds two kinds of thread: a member's journal and a subject
   thread (education). They share the reader, the data contract and the cards,
   so the kind only decides which list a thread appears in. */
function isTopic(unit) { return !!(unit && unit.kind === 'topic'); }
function orderedJournals(list) {
  const src = (list || (App.index && App.index.journals) || []).filter(j => !isTopic(j));
  return [...src].sort((a, b) => {
    const ra = priorityRank(a.id) || 99;
    const rb = priorityRank(b.id) || 99;
    return ra - rb || a.name.localeCompare(b.name, 'en');
  });
}
function orderedTopics() {
  const src = ((App.index && App.index.journals) || []).filter(isTopic);
  return [...src].sort((a, b) => a.name.localeCompare(b.name, 'en'));
}
function orderedUnits() { return orderedJournals().concat(orderedTopics()); }
/* The nav entry only earns its place once a subject thread exists; with none
   archived yet, hide it instead of leading visitors to an empty page. */
function hideEmptyTopics() {
  if (orderedTopics().length) return;
  $$('[data-nav="topics"]').forEach(el => { el.hidden = true; });
}

function journalById(id) {
  const list = (App.index && App.index.journals) || [];
  if (!id) return null;
  const hit = list.find(j => j.id === id);
  if (hit) return hit;
  /* Ids are baked lowercase, but the name a reader sees is not — "Astrokillah"
   * with a capital A, or `IF` typed uppercase, or an id pasted with the
   * apostrophe a journal title actually has, is what a copied link or a typed
   * address gives you. The exact-match lookup sent every one of those straight
   * to the not-found page. Matching stays case- and punctuation-insensitive,
   * but the rewrite that fixes the address bar lives in openJournal: this
   * function is also a pure display helper (journalName) and must not move the
   * reader's URL while a page is rendering. RD-40. */
  const norm = s => String(s).toLowerCase().replace(/[\s_\-']/g, '');
  const want = norm(id);
  return list.find(j => norm(j.id) === want || norm(j.name) === want) || null;
}

function journalName(id) {
  const j = journalById(id);
  return j ? j.name : id;
}

/* Chart files may be served by the FinancialMarket media proxy while the data
 * stays same-origin. `RTM_ASSETS_BASE` is empty for the local build; the
 * deployed index.html points it at `<domain>/uploads/general`. That route
 * accepts one flat name under `general`, so plates and thumbnails get a type
 * prefix and lose their directories. Rewriting once at ingestion keeps every
 * <img>, lightbox and download link consistent. */
function assetUrl(path) {
  const p = String(path || '');
  const base = String(window.RTM_ASSETS_BASE || '').replace(/\/+$/, '');
  if (!base || /^https?:\/\//i.test(p)) return p;
  const m = p.match(/^assets\/(images|thumbs)\/(.+)$/);
  if (!m) return base + '/' + p.replace(/^\/+/, '');
  const prefix = m[1] === 'images' ? 'rtm-img-' : 'rtm-thumb-';
  return base + '/' + prefix + m[2].split('/').pop();
}

function rebaseImage(im) {
  if (!im || typeof im !== 'object') return im;
  for (const k of ['f', 't', 'asset', 'thumb']) {
    if (im[k]) im[k] = assetUrl(im[k]);
  }
  return im;
}

function imageMap(journal) {
  const map = new Map();
  if (!journal || !Array.isArray(journal.images)) return map;
  for (const im of journal.images) if (!map.has(im.k)) map.set(im.k, im);
  return map;
}

function findImage(journal, key) {
  if (!journal || !Array.isArray(journal.images)) return null;
  return journal.images.find(im => im.k === key) || null;
}

function pidLabel(post) {
  return post.id ? String(post.id).split('_').pop() : '';
}

function postHref(jid, page, pid) {
  return `#/p/${encodeURIComponent(jid)}/${page}/${encodeURIComponent(pid)}`;
}

/* A toast can carry one action. Deletion of the reader's own work always does,
   because an undo the user cannot see is not an undo. With an action the toast
   waits, since 2.4 seconds is too short to notice and reach. */
function showToast(message, opts) {
  const toast = $('#toast');
  if (!toast) return;
  const o = opts || {};
  toast.replaceChildren(document.createTextNode(message));
  if (o.action && typeof o.action.onClick === 'function') {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'toast-action';
    btn.textContent = o.action.label;
    btn.addEventListener('click', () => { hideToast(); o.action.onClick(); });
    toast.append(btn);
  }
  toast.classList.toggle('has-action', !!(o.action && o.action.onClick));
  toast.classList.add('is-on');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(hideToast, o.duration || (o.action ? 6000 : 2400));
}

function hideToast() {
  const toast = $('#toast');
  if (toast) toast.classList.remove('is-on');
}

function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text).then(() => true).catch(() => fallbackCopy(text));
  }
  return Promise.resolve(fallbackCopy(text));
}

function fallbackCopy(text) {
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    return true;
  } catch { return false; }
}

/* Saved straight from memory: the archive has no server to upload to, and a
   Blob URL works over file:// as well as over http. */
function downloadText(filename, text, mime = 'text/markdown;charset=utf-8') {
  try {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return true;
  } catch { return false; }
}

function fileSafe(name, max = 60) {
  const s = String(name || 'rtm').replace(/[\\/:*?"<>|]+/g, '_').replace(/\s+/g, '-').slice(0, max);
  return s || 'rtm';
}

/* Every caption fragment is its own bidi isolate: a Latin byte size next to a
   Persian line count inside an RTL paragraph otherwise re-orders around the
   neutral "·" separator. The dimension string keeps its explicit dir="ltr"
   because "×" between two Persian numbers is mirrored without it. */
function metaIsolate(html) {
  return html ? `<bdi>${html}</bdi>` : '';
}

function formatBytes(bytes) {
  if (!bytes) return '';
  const units = ['B', 'KB', 'MB'];
  let n = Number(bytes);
  let i = 0;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

/* The three "load more" rows carry a real button in the markup so the affordance
   exists before any list is drawn; this only names how much is still hidden. */
function paintMoreRow(id, remaining, unit) {
  const row = $(id);
  if (!row) return;
  const btn = row.querySelector('button');
  row.hidden = remaining <= 0;
  if (btn) btn.textContent = `نمایش ${faNum(remaining)} ${unit} بعدی`;
}

/* ============================== settings ============================== */

/* A stored profile is untrusted input: an old build, a hand-edited value or a
   half-written object could carry a font size that is a string, a theme that
   selects no stylesheet, or a wheel mode that leaves the plate dead. Every
   value is checked against the closed set the UI actually offers. */
function loadSettings() {
  const clean = (input) => {
    const src = input && typeof input === 'object' ? input : {};
    const out = { ...DEFAULT_SETTINGS, ...src };
    out.fontSize = clamp(Number(out.fontSize) || DEFAULT_SETTINGS.fontSize, 13, 24);
    for (const [key, allowed] of Object.entries({
      sidebar: ['auto', 'open', 'closed'],
      header: ['compact', 'static'],
      imageFit: ['fit', 'width', 'actual'],
      wheel: ['zoom', 'pan'],
      language: ['both', 'fa', 'en'],
      theme: ['paper', 'dark'],
      lampTone: ['dark', 'sepia'],
    })) {
      if (!allowed.includes(out[key])) out[key] = DEFAULT_SETTINGS[key];
    }
    out.lamp = !!out.lamp;
    out.lampAuto = !!out.lampAuto;
    out.skim = !!out.skim;
    out.focus = !!out.focus;
    return out;
  };
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const merged = clean(JSON.parse(raw));
      /* The first v3 build shipped wheel:'pan'. A stored 'pan' nobody picked is
         that old default, not a decision — move it to the new default instead
         of leaving the wheel dead on every existing profile. */
      if (merged.wheel === 'pan' && !merged.wheelPicked) merged.wheel = DEFAULT_SETTINGS.wheel;
      return merged;
    }
    // v2 defaulted to dark. Paper is the default now, so the old theme flag
    // is dropped rather than inverted onto the reader.
    const old = localStorage.getItem('rtm_archive_settings_v2');
    if (old) {
      const merged = clean(JSON.parse(old));
      delete merged.light;
      return merged;
    }
    return { ...DEFAULT_SETTINGS };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings() {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(App.settings)); } catch {}
}

/* The lamp's effective state: the manual switch wins; otherwise the auto
   schedule decides — on from 19:00 to 07:00 local, when cool screen light is
   hardest on the eyes. */
function lampOn() {
  const s = App.settings;
  if (s.lamp) return true;
  if (!s.lampAuto) return false;
  const h = new Date().getHours();
  return h >= 19 || h < 7;
}

function applySettings() {
  const s = App.settings;
  const lamp = lampOn();
  const de = document.documentElement;
  de.dataset.theme = s.theme === 'dark' ? 'dark' : 'paper';
  if (lamp) de.dataset.lamp = s.lampTone; else delete de.dataset.lamp;
  /* The lamp lends the text two more pixels — comfort, not a new setting. */
  de.style.setProperty('--fs', clamp(s.fontSize + (lamp ? 2 : 0), 13, 26) + 'px');
  const themeBtn = $('#themeBtn');
  if (themeBtn) {
    themeBtn.innerHTML = icon('lamp');
    themeBtn.title = lamp ? 'خاموش‌کردن چراغ مطالعه' : 'چراغ مطالعه';
    themeBtn.setAttribute('aria-label', themeBtn.title);
    themeBtn.classList.toggle('is-on', lamp);
  }
  const dayBtn = $('#dayBtn');
  if (dayBtn) {
    dayBtn.innerHTML = icon(s.theme === 'dark' ? 'sun' : 'moon');
    dayBtn.title = s.theme === 'dark' ? 'تم روشن' : 'تم تیره';
    dayBtn.setAttribute('aria-label', dayBtn.title);
    dayBtn.classList.toggle('is-on', s.theme === 'dark');
  }
  const focusBtn = $('#focusBtn');
  if (focusBtn) {
    focusBtn.setAttribute('aria-pressed', String(!!s.focus));
    focusBtn.classList.toggle('is-on', !!s.focus);
  }
  applyChrome();
  syncSettingsControls();
}

function isRailLayout() {
  return window.matchMedia('(max-width: 1000px)').matches;
}

function railHiddenOnDesktop() {
  return !!App.settings.focus || lampOn() || App.settings.sidebar === 'closed';
}

/* Header, rail and reading mode are chrome: they hand height back to the text
   instead of decorating it. */
function applyChrome() {
  const s = App.settings;
  document.body.classList.toggle('head-static', s.header === 'static');
  document.body.classList.toggle('focus-mode', !!s.focus || lampOn());
  document.body.classList.toggle('skim-mode', !!s.skim);
  if (s.header !== 'compact') document.body.classList.remove('head-compact');
  syncRail();
  setMastVar();
  updateHeaderState();
}

function syncRail() {
  const shell = $('#appShell');
  const btn = $('#menuBtn');
  const backdrop = $('#sideBackdrop');
  if (!shell) return;
  const phone = isRailLayout();
  const hidden = railHiddenOnDesktop();
  document.body.classList.toggle('rail-open', phone && App.railOpen);
  shell.classList.toggle('rail-hidden', !phone && hidden);
  if (backdrop) backdrop.hidden = !(phone && App.railOpen);
  if (btn) {
    const expanded = phone ? App.railOpen : !hidden;
    btn.setAttribute('aria-expanded', String(expanded));
    btn.classList.toggle('is-on', expanded);
  }
  const modalOpen = !$('#lightbox')?.hidden || !$('#settingsDrawer')?.hidden || !$('#palette')?.hidden;
  document.body.style.overflow = ((phone && App.railOpen) || modalOpen) ? 'hidden' : '';
}

function toggleRail() {
  if (isRailLayout()) {
    App.railOpen = !App.railOpen;
    syncRail();
    if (App.railOpen) setTimeout(() => $('#journalFilter')?.focus(), 60);
    return;
  }
  if (App.settings.focus) {
    updateSetting('focus', false);
    updateSetting('sidebar', 'open');
    return;
  }
  updateSetting('sidebar', App.settings.sidebar === 'closed' ? 'open' : 'closed');
}

function setMastVar() {
  const bar = $('#masthead');
  if (!bar) return;
  const h = Math.round(bar.getBoundingClientRect().height);
  document.documentElement.style.setProperty('--mast-h', h + 'px');
}

function updateHeaderState() {
  const compact = App.settings.header === 'compact' && window.scrollY > 90;
  document.body.classList.toggle('head-compact', !!compact);
  setMastVar();
}

function setSearchOpen(open) {
  document.body.classList.toggle('search-open', !!open);
  const btn = $('#searchToggle');
  if (btn) btn.setAttribute('aria-expanded', String(!!open));
}

function focusSearch() {
  document.body.classList.remove('head-compact', 'head-hidden');
  /* On a phone the band is not on screen until asked for; without opening it
     first, focusing the input was focusing a display:none element and the
     search button did nothing at all. */
  setSearchOpen(window.matchMedia('(max-width:700px)').matches);
  const input = $('#globalSearch');
  if (input) { input.focus(); input.select(); }
  setMastVar();
}

function syncSettingsControls() {
  const s = App.settings;
  const seg = (id, settingKey, dataKey) => {
    const box = $('#' + id);
    if (!box) return;
    $$('button', box).forEach(b => {
      const on = b.dataset[dataKey] === s[settingKey];
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
  };
  seg('setImageFit', 'imageFit', 'imagefit');
  seg('setWheel', 'wheel', 'wheel');
  seg('setHeader', 'header', 'header');
  seg('setSidebar', 'sidebar', 'sidebar');
  seg('setTheme', 'theme', 'base');
  seg('setLampTone', 'lampTone', 'lamptone');
  const range = $('#setFont');
  if (range) range.value = String(s.fontSize);
  const fv = $('#fontValue');
  if (fv) fv.textContent = faNum(s.fontSize);
  const check = (id, value) => { const el = $('#' + id); if (el) el.checked = !!value; };
  check('setLight', s.lamp);
  check('setLampAuto', s.lampAuto);
  check('setSkim', s.skim);
  syncLangTabs();
}

/* Settings that change the shape of the markup already on screen. Their cards
   are strings built at render time, so the visible page is rebuilt after a
   change instead of keeping a reading mode that no longer matches the setting. */
const MARKUP_SETTINGS = ['language'];

function refreshMarkupViews() {
  const y = window.scrollY;
  if (App.currentView === 'journal' && App.currentJournal) renderJournalPage();
  else if (App.currentView === 'post' && App.postDetail.post) renderPostDetail();
  else if (App.currentView === 'all' && App.all.rows) renderAllPosts();
  syncLangTabs();
  window.scrollTo(0, y);
}

function updateSetting(key, value) {
  App.settings[key] = value;
  saveSettings();
  applySettings();
  if (MARKUP_SETTINGS.includes(key)) refreshMarkupViews();
}

function resetSettings() {
  App.settings = { ...DEFAULT_SETTINGS };
  saveSettings();
  applySettings();
  refreshMarkupViews();
  showToast('تنظیمات به پیش‌فرض برگشت');
}

function openSettings() {
  const drawer = $('#settingsDrawer');
  if (!drawer) return;
  syncSettingsControls();
  drawer.hidden = false;
  syncRail();
  setTimeout(() => $('#drawerClose')?.focus(), 30);
}

function closeSettings() {
  const drawer = $('#settingsDrawer');
  if (!drawer) return;
  drawer.hidden = true;
  syncRail();
  $('#settingsBtn')?.focus();
}

/* ===================== bookmarks & reading history ===================== */

function loadBookmarks() {
  try {
    const raw = JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch { return []; }
}

function saveBookmarks() {
  try { localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(App.bookmarks)); } catch {}
}

function loadReading() {
  try {
    const raw = JSON.parse(localStorage.getItem(READING_KEY) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch { return []; }
}

function saveReading() {
  try { localStorage.setItem(READING_KEY, JSON.stringify(App.reading.slice(0, 10))); } catch {}
}

/* Per-journal read progress: which post ids the reader has actually seen.
   Powers the percent chips on the index rows, the journal header and the
   «کدام را تمام کرده‌ام» question at a glance. */
function loadProgress() {
  try {
    const raw = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}');
    return raw && typeof raw === 'object' ? raw : {};
  } catch { return {}; }
}

function saveProgress() {
  try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(App.progress)); } catch {}
}

function progressEntry(jid) {
  let e = App.progress[jid];
  if (!e || typeof e !== 'object') { e = { read: {}, last: null, updated: 0 }; App.progress[jid] = e; }
  if (!e.read || typeof e.read !== 'object') e.read = {};
  return e;
}

function progressStats(jid, total) {
  const e = App.progress[jid];
  const n = e && e.read ? Object.keys(e.read).length : 0;
  const t = total || 0;
  return { read: n, total: t, pct: t ? Math.min(100, Math.round((n / t) * 100)) : 0 };
}

function markPostRead(jid, pid) {
  if (!jid || !pid) return;
  const e = progressEntry(jid);
  const fresh = !e.read[pid];
  e.read[pid] = 1;
  e.last = { pid, page: App.currentPage || 1 };
  e.updated = Date.now();
  saveProgress();
  if (fresh) { bumpDaily(jid); paintJournalProg(); }
}

/* Today-at-a-glance: how many posts across how many journals today. */
const DAILY_KEY = 'rtm_daily_v1';
function bumpDaily(jid) {
  try {
    const day = new Date().toISOString().slice(0, 10);
    const raw = JSON.parse(localStorage.getItem(DAILY_KEY) || '{}');
    const d = raw[day] || (raw[day] = { posts: 0, journals: {} });
    d.posts += 1;
    d.journals[jid] = 1;
    localStorage.setItem(DAILY_KEY, JSON.stringify(raw));
  } catch {}
}
function dailyToday() {
  try {
    const day = new Date().toISOString().slice(0, 10);
    const raw = JSON.parse(localStorage.getItem(DAILY_KEY) || '{}');
    return raw[day] || null;
  } catch { return null; }
}

/* Journals the reader starred for later — a lighter mark than a bookmark,
   meant for «still reading this one». */
const JM_KEY = 'rtm_journal_marks_v1';
function loadJournalMarks() {
  try { const r = JSON.parse(localStorage.getItem(JM_KEY) || '[]'); return Array.isArray(r) ? r : []; } catch { return []; }
}
App.journalMarks = loadJournalMarks();
function saveJournalMarks() { try { localStorage.setItem(JM_KEY, JSON.stringify(App.journalMarks)); } catch {} }
function isJournalMarked(jid) { return App.journalMarks.includes(jid); }
function toggleJournalMark(jid) {
  App.journalMarks = isJournalMarked(jid) ? App.journalMarks.filter(x => x !== jid) : [...App.journalMarks, jid];
  saveJournalMarks();
}

function isPostRead(jid, pid) {
  const e = App.progress[jid];
  return !!(e && e.read && e.read[pid]);
}

function markPostUnread(jid, pid) {
  const e = App.progress[jid];
  if (e && e.read && e.read[pid]) {
    delete e.read[pid];
    saveProgress();
    paintJournalProg();
  }
}

/* The reader's own verdict beats the scroll heuristic in both directions:
   mark read without scrolling, or undo a post the observer counted. */
function togglePostRead(jid, pid) {
  if (isPostRead(jid, pid)) { markPostUnread(jid, pid); return false; }
  markPostRead(jid, pid);
  return true;
}

function paintJournalProg() {
  const j = App.currentJournal;
  if (!j || App.currentView !== 'journal') return;
  const el = $('#journalProg');
  if (!el) return;
  const s = progressStats(j.id, j.posts.length);
  el.innerHTML = `<span class="prog-bar"><i style="width:${s.pct}%"></i></span> ${faNum(s.pct)}٪ خوانده‌شده`;
}

function syncPostReadBtn() {
  const d = App.postDetail;
  const btn = $('#postRead');
  if (!btn || !d || !d.post || !d.journal) return;
  const on = isPostRead(d.journal.id, d.post.id);
  btn.setAttribute('aria-pressed', String(on));
  btn.classList.toggle('is-on', on);
  const sp = btn.querySelector('span');
  if (sp) sp.textContent = on ? 'خوانده‌شده' : 'خوانده‌نشده';
  const ic = btn.querySelector('svg use');
  if (ic) ic.setAttribute('href', on ? '#i-check' : '#i-eye');
}

function estimateReadMinutes(post) {
  if (!post) return 0;
  const en = String(post.t || post.text || '').split(/\s+/).filter(Boolean).length;
  const fa = String(post.fa || '').split(/\s+/).filter(Boolean).length;
  const w = Math.max(en, Math.round(fa * 0.6));
  return w ? Math.max(1, Math.round(w / 170)) : 0;
}

function ensureReadObserver() {
  if (App._readObserver !== undefined) return;
  if (!('IntersectionObserver' in window)) { App._readObserver = null; return; }
  App._readObserver = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      App._readObserver.unobserve(e.target);
      markPostRead(e.target.dataset.jid, e.target.dataset.postId);
    }
  }, { threshold: 0.4 });
}

/* Viewing a journal page marks every post that scrolls meaningfully into view;
   opening a post detail marks it directly. */
function wireReadTracking(root) {
  ensureReadObserver();
  if (!App._readObserver) return;
  $$('.article[data-post-id]', root).forEach(el => App._readObserver.observe(el));
}

function bookmarkKey(jid, pid) { return jid + '::' + pid; }

function findBookmark(jid, pid) {
  return App.bookmarks.find(b => bookmarkKey(b.jid, b.pid) === bookmarkKey(jid, pid)) || null;
}

function recordReading(jid, page, pid, label, author) {
  const key = bookmarkKey(jid, pid);
  App.reading = App.reading.filter(r => bookmarkKey(r.jid, r.pid) !== key);
  App.reading.unshift({ jid, page, pid, label: label || '', author: author || '', ts: Date.now() });
  saveReading();
  renderReadingRail();
}

function toggleBookmark(jid, page, pid, meta = {}) {
  const existing = findBookmark(jid, pid);
  if (existing) {
    App.bookmarks = App.bookmarks.filter(b => b !== existing);
    saveBookmarks();
    showToast('از نشان‌شده‌ها برداشته شد');
  } else {
    App.bookmarks.unshift({
      jid, pid, page,
      author: meta.author || '',
      date: meta.date || '',
      number: meta.number || '',
      excerpt: (meta.text || '').slice(0, 240),
      ts: Date.now(),
    });
    saveBookmarks();
    showToast('نشان شد؛ از فهرست «نشان‌شده» یا همین‌جا بازمی‌گردید');
  }
  syncBookmarkButtons();
  renderShelf();
  if (App.currentView === 'saved') renderSavedView();
}

function syncBookmarkButtons() {
  const d = App.postDetail;
  const btn = $('#postBookmark');
  if (btn && d.post && d.journal) {
    const on = !!findBookmark(d.journal.id, d.post.id);
    btn.setAttribute('aria-pressed', String(on));
    btn.classList.toggle('is-on', on);
    btn.querySelector('span').textContent = on ? 'نشان‌شده' : 'نشان‌کردن';
    btn.querySelector('svg use').setAttribute('href', on ? '#i-bookmark-on' : '#i-bookmark');
  }
  $$('[data-bookmark-btn]').forEach(el => {
    const on = !!findBookmark(el.dataset.jid, el.dataset.pid);
    el.classList.toggle('is-on', on);
    el.setAttribute('aria-pressed', String(on));
    el.setAttribute('title', on ? 'برداشتن نشان' : 'نشان‌کردن این پست');
  });
}

function bookmarkHref(b) { return postHref(b.jid, b.page || 1, b.pid); }

function shelfHTML(items, withRemove = true) {
  if (!items.length) return '';
  return items.map(b => `
    <a class="shelf-item" href="${bookmarkHref(b)}">
      <span class="shelf-j" dir="auto">${esc(journalName(b.jid))}</span>
      <bdi dir="auto">${esc(b.number || pidLabel({ id: b.pid }))}</bdi>
      <span class="muted">${esc(b.author || '')}</span>
      ${withRemove ? `<button class="shelf-x" type="button" data-action="dismiss-reading" data-jid="${esc(b.jid)}" data-pid="${esc(b.pid)}" aria-label="حذف از ادامهٔ مطالعه" title="حذف از ادامهٔ مطالعه">${icon('close')}</button>` : ''}
    </a>`).join('');
}

function renderShelf() {
  const wrap = $('#shelfWrap');
  if (!wrap) return;
  const list = App.reading.slice(0, 10).map(r => ({
    jid: r.jid, pid: r.pid, page: r.page || 1,
    number: r.label || '', author: r.author || '',
  }));
  if (!list.length) {
    wrap.hidden = true;
    wrap.innerHTML = '';
    return;
  }
  wrap.hidden = false;
  wrap.innerHTML = `
    <div class="shelf-head">
      <h2>ادامهٔ مطالعه</h2>
      <span class="shelf-note">آخرین پست‌هایی که در این مرورگر باز کرده‌اید</span>
      <span class="dot-leader"></span>
      <a class="text-action" href="#/all">همهٔ پست‌ها</a>
    </div>
    <div class="shelf-list" data-shelf>${shelfHTML(list)}</div>`;
}

function renderSavedView() {
  const list = $('#savedList');
  const sub = $('#savedSubtitle');
  if (!list || !sub) return;
  sub.innerHTML = App.bookmarks.length
    ? `${faNum(App.bookmarks.length)} پست نشان‌شده · فقط در همین مرورگر ذخیره شده`
    : 'هنوز پستی را نشان نکرده‌اید';
  if (!App.bookmarks.length) {
    list.innerHTML = `<div class="empty-state">${icon('bookmark')}<h3>فهرست خالی است</h3>
      <p>در سرِ هر پست دکمهٔ «نشان‌کردن» هست. نشان‌ها در localStorage همین مرورگر می‌مانند و به جایی فرستاده نمی‌شوند.</p>
      <div class="more-row"><a class="btn btn-solid" href="#/all">مرور همهٔ پست‌ها</a></div></div>`;
    return;
  }
  list.innerHTML = App.bookmarks.map(b => `
    <article class="article">
      <div class="article-head">
        <span class="article-num" dir="ltr">${esc(b.number || pidLabel({ id: b.pid }))}</span>
        <span class="article-author" dir="auto">${esc(b.author || '—')}</span>
        ${b.date ? `<span class="article-date" dir="ltr">${esc(b.date)}</span>` : ''}
        <span class="article-page">${metaIsolate(esc(journalName(b.jid)))} · ص ${faNum(b.page || 1)}</span>
        <span class="dot-leader"></span>
        <a class="article-permalink" href="${bookmarkHref(b)}">${icon('arrow-left')} بازشو</a>
        <button class="text-action is-on" type="button" data-action="unbookmark" data-jid="${esc(b.jid)}" data-pid="${esc(b.pid)}" aria-pressed="true">${icon('bookmark-on')} برداشتن نشان</button>
      </div>
      ${b.excerpt ? `<p class="article-text" dir="auto">${esc(b.excerpt)}</p>` : ''}
    </article>`).join('');
}

function renderReadingRail() {
  const box = $('#recentRead');
  if (!box) return;
  if (!App.reading.length) {
    box.innerHTML = `<div class="rail-note" style="padding:8px 0">هنوز پستی نخوانده‌اید.</div>`;
    return;
  }
  const day = dailyToday();
  const today = day ? `<div class="rail-note" style="padding:2px 0 10px">امروز: ${faNum(day.posts)} پست در ${faNum(Object.keys(day.journals || {}).length)} ژورنال</div>` : '';
  box.innerHTML = today + App.reading.slice(0, 8).map(r => `
    <a class="toc-item" href="${postHref(r.jid, r.page || 1, r.pid)}">
      <span class="toc-num">${icon('clock')}</span>
      <span class="toc-name" dir="auto">${esc(r.label || pidLabel({ id: r.pid }))}</span>
      <span class="toc-count">${esc(journalName(r.jid))}</span>
    </a>`).join('');
}

/* ============================== markdown export ============================== */

function postToMarkdown(journal, post) {
  const pnum = post.p ?? post.pageNum ?? 1;
  const text = String(post.t || '').trim();
  const fa = String(post.fa || '').trim();
  const imgs = Array.isArray(post.im) ? post.im : [];
  const map = imageMap(journal);
  const name = journal ? journal.name : 'rtm';
  let out = `# ${name} — ${post.n || pidLabel(post)}\n\n`;
  out += `- نویسنده: ${post.a || '—'}\n- تاریخ: ${post.d || '—'}\n- صفحه: ${pnum}\n`;
  out += `- پیوند: ${location.href.split('#')[0]}${postHref(journal ? journal.id : '', pnum, post.id)}\n`;
  if (post.m) out += `- شمارهٔ پیام در انجمن: ${post.m}\n`;
  /* The exported note has to carry the conversation with it: a trader who
   * pastes this into their own journal needs to know what was answered. */
  if (journal) {
    const th = threadOf(journal);
    if (th) {
      for (const p of th.parents.get(post.id) || []) out += `- در پاسخ به: ${p.n || pidLabel(p)} — ${p.a || '—'}\n`;
      for (const k of th.children.get(post.id) || []) out += `- پاسخ از: ${k.n || pidLabel(k)} — ${k.a || '—'}\n`;
    }
  }
  out += '\n';
  if (fa) out += `## ترجمهٔ فارسی\n\n${fa}\n\n`;
  if (text) out += `## متن اصلی\n\n${text}\n\n`;
  const plates = [];
  for (const key of imgs) {
    const im = map.get(key);
    if (!im || plates.includes(key)) continue;
    const name2 = im.o || im.f || key;
    out += `## تصویر: ${name2}\n\n`;
    plates.push(key);
  }
  out += `---\n\nساخته‌شده از آرشیو RTM. ترجمهٔ فارسی دستی و بازبینی‌شده است؛ متن اصلی هم در ادامه آمده.\n`;
  return out;
}

function exportPostMarkdown() {
  const d = App.postDetail;
  if (!d || !d.post) return;
  const md = postToMarkdown(d.journal, d.post);
  const name = `${fileSafe(d.journal ? d.journal.name : 'rtm')}_${fileSafe(d.post.n || d.post.id, 30)}.md`;
  showToast(downloadText(name, md) ? 'فایل Markdown ذخیره شد' : 'ذخیره ممکن نشد');
}

/* ============================== data loading ============================== */

/* Data is sharded JSON: a journal's metadata, one file per page, a light image
   index for the gallery, and per-journal search / all-posts shards. `fetch`
   lets the service worker cache each request and keeps a 9 MB journal from
   blocking the first paint as a <script> assignment did. */
function loadJson(src) {
  return fetch(src, { credentials: 'same-origin', cache: 'no-cache' }).then(res => {
    if (!res.ok) throw new Error('بارگذاری فایل داده ناموفق بود: ' + src);
    return res.json();
  });
}

function journalUrl(id) {
  return 'data/journals/' + encodeURIComponent(id) + '.json';
}

function journalPageUrl(id, page) {
  return 'data/journals/' + encodeURIComponent(id) + '/p' + page + '.json';
}

/* annotate.js is the heaviest script on the page and only the image viewer and
   the notes view ever call into it, so it is fetched the first time one of
   those opens instead of riding along on every visit. */
let annoPromise = null;
function ensureAnnotate() {
  if (window.Anno) return Promise.resolve(true);
  if (!annoPromise) {
    annoPromise = new Promise((resolve) => {
      const s = document.createElement('script');
      s.src = 'js/annotate.js';
      s.onload = () => resolve(!!window.Anno);
      s.onerror = () => resolve(false);
      document.head.appendChild(s);
    }).then(ok => {
      if (ok && window.Anno && window.Anno.attach) {
        try { window.Anno.attach(); window.Anno.paintRailBadge(); } catch {}
      }
      return ok;
    });
  }
  return annoPromise;
}

function journalImagesUrl(id) {
  return 'data/journals/' + encodeURIComponent(id) + '-images.json';
}

/* Every journal starts as metadata plus a stub per post (id, page, number,
   author). The stub list keeps counts, prev/next navigation and deep links
   working without shipping 3,448 bodies to render page one. */
function ensureJournal(id) {
  if (App.cache[id]) return Promise.resolve(App.cache[id]);
  return cachedLoad('journal_meta_' + id, () => loadJson(journalUrl(id)).then(data => {
    const journal = Object.assign({}, data, {
      posts: Array.isArray(data.posts) ? data.posts : [],
      images: [],
      loadedPages: new Set(),
      imagesLoaded: false,
    });
    App.cache[id] = journal;
    return journal;
  }));
}

function mergeJournalPage(journal, page, chunk) {
  if (!chunk) return journal;
  const at = new Map();
  journal.posts.forEach((post, i) => { if (post && post.id) at.set(post.id, i); });
  for (const post of (chunk.posts || [])) {
    const found = at.get(post.id);
    if (found == null) journal.posts.push(post);
    else journal.posts[found] = post;
  }
  const seen = new Set(journal.images.map(im => im.k));
  for (const im of (chunk.images || [])) {
    if (!seen.has(im.k)) { seen.add(im.k); journal.images.push(rebaseImage(im)); }
  }
  journal.loadedPages.add(page);
  return journal;
}

function ensureJournalPage(id, page) {
  page = Number(page) || 1;
  return ensureJournal(id).then(journal => {
    if (journal.loadedPages.has(page)) return journal;
    return cachedLoad('journal_page_' + id + '_' + page, () =>
      loadJson(journalPageUrl(id, page)).then(chunk => mergeJournalPage(journal, page, chunk)));
  });
}

function prefetchJournalPage(id, page) {
  const journal = App.cache[id];
  if (!journal || !page || page < 1 || page > (journal.pages || 0)) return;
  if (journal.loadedPages.has(page)) return;
  const key = 'journal_page_' + id + '_' + page;
  if (App.promises[key]) return;
  const run = () => {
    cachedLoad(key, () => loadJson(journalPageUrl(id, page))
      .then(chunk => mergeJournalPage(journal, page, chunk)))
      /* A prefetch is opportunistic: a phone that goes offline must not leave
         an unhandled rejection behind. */
      .catch(() => {});
  };
  if ('requestIdleCallback' in window) requestIdleCallback(run, { timeout: 1600 });
  else setTimeout(run, 700);
}

function ensureJournalImages(id) {
  return ensureJournal(id).then(journal => {
    if (journal.imagesLoaded) return journal;
    return cachedLoad('journal_images_' + id, () =>
      loadJson(journalImagesUrl(id)).then(list => {
        const seen = new Set(journal.images.map(im => im.k));
        for (const im of (list || [])) {
          if (!seen.has(im.k)) { seen.add(im.k); journal.images.push(rebaseImage(im)); }
        }
        journal.imagesLoaded = true;
        return journal;
      }));
  });
}

/* ------------------------------------------------------------------------
 * Asset integrity. `_build/image-census.js --write-integrity` measures every
 * full-size file on disk — signature, real format, and whether the stream is
 * actually closed — and hands us the handful of keys whose full image will not
 * open whole. The thumbnails are all intact, so the grid never lies; this only
 * changes what the viewer loads and what the caption admits. RD-39.
 * ------------------------------------------------------------------------ */
function assetNotch(key) {
  const I = window.RTM_ASSET_INTEGRITY;
  if (!I || !I.notched || !key) return null;
  return I.notched[key] || null;
}

/* The source a reader can safely be given at full size. A truncated JPEG paints
 * its top third and stops, which reads as "the picture isn't showing"; the
 * thumbnail of the same file is complete, so it is the better full-screen
 * source even though it is smaller. */
function safeFullSrc(im) {
  if (!im) return '';
  const full = im.f || im.asset || '';
  const thumb = im.t || im.thumb || '';
  const notch = assetNotch(im.k);
  if (notch && thumb) return thumb;
  return full || thumb;
}

function notchNotice(key) {
  const notch = assetNotch(key);
  if (!notch) return '';
  const why = notch.reason === 'truncated'
    ? 'فایل اصلی در سال ۲۰۲۱ نصفه دانلود شده'
    : 'فایل اصلی خوانده نمی‌شود';
  return `<span class="cap-note" role="note" title="${esc(why)}">${icon('warning')} نسخهٔ کامل موجود نیست — ${esc(why)}؛ همان تصویرِ سالمِ کوچک‌تر نشان داده می‌شود.</span>`;
}

/* ------------------------------------------------------- missing plates -----
 * A post's own record can name three plates while the build ships one. The
 * reasons are measured, not guessed: `_build/lost-images.js` walks every
 * reference, opens the file behind it, and writes the class into
 * site/data/integrity.js as `lost[postId] = {n, cls}`. Without this note the
 * reader sees an empty gap and concludes the archive is broken; the archive is
 * not — the 2021 save is. RD-43. */
const LOST_WHY = {
  'remote-url-dead': 'لینک به سایتِ بستهٔ readthemarket',
  'not-an-image': 'صفحهٔ خطای ۴۰۴ به جای تصویر ذخیره شده',
  'header-only-2021-download': 'در ۲۰۲۱ فقط سرصفحهٔ فایل دانلود شد',
  'file-not-on-disk': 'فایلش روی دیسک نیست',
  'excluded-by-build': 'در ساختِ سایت کنار گذاشته شده',
  'record-not-in-journal': 'رکوردش در فهرست تصاویرِ این ژورنال نیست',
};

function lostInfo(postId) {
  const I = window.RTM_ASSET_INTEGRITY;
  const row = I && I.lost && I.lost[postId];
  return row && row.n ? row : null;
}

/* Counted from the data the post itself carries, so the note cannot disagree
 * with the build. `post.gap` is written by build-site.js with the reason for
 * every reference it could not ship; the integrity file is the fallback for a
 * cache built before that field existed. */
function missingPlates(imgs, map) {
  const seen = new Set();
  let n = 0;
  for (const key of imgs || []) {
    if (seen.has(key)) continue;
    seen.add(key);
    if (!map.get(key)) n++;
  }
  return n;
}

function plateGapInfo(post, map) {
  const g = post && post.gap;
  if (g && typeof g === 'object') {
    const keys = Object.keys(g);
    const cls = {};
    for (const k of keys) cls[g[k]] = (cls[g[k]] || 0) + 1;
    return { n: keys.length, cls, keys };
  }
  const row = lostInfo(post && post.id);
  return { n: missingPlates(Array.isArray(post && post.im) ? post.im : [], map), cls: (row && row.cls) || {}, keys: [] };
}

function plateGapNotice(post, map) {
  const gap = plateGapInfo(post, map);
  if (!gap.n) return '';
  const parts = Object.keys(gap.cls).sort((a, b) => gap.cls[b] - gap.cls[a])
    .map(k => faNum(gap.cls[k]) + ' ' + (LOST_WHY[k] || k));
  const why = parts.length ? parts.join('، ') : 'دلیلش در دادهٔ این بیلد ثبت نشده است';
  return `<div class="plate-gap" role="note">
    <span class="gap-icon">${icon('image-off')}</span>
    <span><bdi dir="rtl"><b>${faNum(gap.n)} تصویرِ این پست در آرشیو نیست</b> — ${esc(why)}.</bdi>
    <span class="muted">جست‌وجو در همهٔ پوشه‌های همین دفتر و در بایگانی اینترنت انجام شد؛ این فایل‌ها هیچ‌جا نمانده‌اند.</span></span>
  </div>`;
}

/* ============================== threading ============================== */
/* The forum numbered every message and printed the words a reply answered
 * inside a quote block. _build/reply-graph.js recovered both from the mirrored
 * pages, so a post can say whom it answers and who answered it.
 *
 * Two sources, and the reader keeps them apart:
 *   post.q  — a link the build proved (one older post by that author contains
 *             these exact words). Rendered as a jump.
 *   «X wrote:» inside post.t — what the forum printed. The build's proof is
 *             used when it has one; otherwise the name is shown without a
 *             link, because an unproven jump is worse than no jump. */
function threadOf(journal) {
  if (!journal) return null;
  if (journal._thread) return journal._thread;
  const byPid = new Map((journal.posts || []).map(p => [p.id, p]));
  const parents = new Map(), children = new Map();
  for (const p of journal.posts || []) {
    for (const q of p.q || []) {
      const par = byPid.get(q.p);
      if (!par || par.id === p.id) continue;
      if (!parents.has(p.id)) parents.set(p.id, []);
      /* A copy, so the excerpt that belongs to this link never lands on the
       * parent post itself, where a second quote would overwrite it. */
      parents.get(p.id).push(q.x ? { ...par, x: q.x } : par);
      if (!children.has(par.id)) children.set(par.id, []);
      children.get(par.id).push(p);
    }
  }
  parents.forEach(list => list.sort((a, b) => (a.m || 0) - (b.m || 0)));
  children.forEach(list => list.sort((a, b) => (a.m || 0) - (b.m || 0)));
  journal._thread = { parents, children, byPid, authors: new Set((journal.posts || []).map(p => String(p.a || p.author || '').toLowerCase())) };
  return journal._thread;
}

/* The forum's own message number, bare: the archive stores "#13", the chip
 * prints its own "#", and a title attribute that reads "پست ##13" is a typo the
 * reader would blame on the forum. */
function postNumber(p) {
  return String(p.n ?? p.number ?? pidLabel(p) ?? '').replace(/^#/, '');
}

/* The forum prints the quoted writer in the past tense — "gslao wrote:" — and
 * `writes?` alone matches only the present, so the first version of this found
 * nothing at all. A name is one token at the start of a line: forum usernames
 * carry no space, and letting the pattern cross spaces turned whole sentences
 * ("dge for your valuable words Edge") into invented author names. */
const QUOTE_HEAD_RE = /(?:^|\n)([A-Za-z0-9_.\-+]{2,32})[^\S\n]{0,4}(?:wrote|writes)[^\S\n]{0,3}:(?=[^\S\n]|\n)/gi;
/* The names the forum printed as quoted writers, outermost first. */
function quoteHeaders(post) {
  const text = String(post && (post.t || post.text) || '');
  const out = [];
  QUOTE_HEAD_RE.lastIndex = 0;
  let m;
  while ((m = QUOTE_HEAD_RE.exec(text)) && out.length < 6) {
    const who = m[1].trim();
    if (who.length < 2) continue;
    if (!out.includes(who)) out.push(who);
  }
  return out;
}

function threadChip(post, journal, kind) {
  const page = post.p ?? post.pageNum ?? 1;
  const same = App.currentJournal && App.currentJournal.id === journal.id && Number(page) === Number(App.currentPage);
  const who = post.a || post.author || '—';
  const bits = [
    `<bdi dir="ltr" class="thread-num">#${esc(postNumber(post))}</bdi>`,
    `<bdi dir="auto" class="thread-who">${esc(who)}</bdi>`,
  ];
  if (!same) bits.push(`<span class="thread-page">ص ${faNum(page)}</span>`);
  const label = (kind === 'parent' ? 'در پاسخ به پست #' : 'پاسخِ پست #') + postNumber(post) + ' — ' + who;
  return `<a class="thread-chip is-${kind}" href="${postHref(journal.id, page, post.id)}"
    data-action="thread-jump" data-jid="${esc(journal.id)}" data-page="${page}" data-pid="${esc(post.id)}"
    aria-label="${esc(label)}" title="${esc(label)}">${bits.join(' ')}</a>`;
}

/* One line under the ledger head: whom this post answers, and its answers.
 * `opts.detail` adds the quoted words beside each parent — the forum printed
 * them, so the reader should be able to see what was answered, not only who. */
function threadLine(post, journal, opts = {}) {
  const th = threadOf(journal);
  if (!th) return '';
  const parents = th.parents.get(post.id) || [];
  const kids = th.children.get(post.id) || [];
  const linkedAuthors = new Set(parents.map(p => String(p.a || p.author || '').toLowerCase()));
  const unproven = quoteHeaders(post).filter(h => !linkedAuthors.has(h.toLowerCase()));
  const named = unproven.filter(h => th.authors.has(h.toLowerCase()));
  const max = opts.full ? 12 : 4;
  const out = [];
  if (parents.length) {
    const chips = parents.slice(0, max).map(p => {
      const chip = threadChip(p, journal, 'parent');
      if (!opts.detail || !p.x) return chip;
      return `<span class="thread-rel">${chip}<bdi dir="auto" class="thread-quote">${esc(p.x)}</bdi></span>`;
    }).join('');
    out.push(`<span class="thread-in">${icon('quote')}<span class="thread-label">در پاسخ به</span>
      ${chips}
      ${parents.length > max ? `<span class="thread-more">+${faNum(parents.length - max)}</span>` : ''}</span>`);
  }
  /* The forum printed words being answered that the build could not pin to one
   * post. A name is shown only when this journal actually has posts by it —
   * flattening the page sometimes glues the sentence before a quote onto the
   * writer's name, and an invented author is worse than no author. Everything
   * else is labelled as unlinked, and nothing is linked on a guess. */
  if (named.length) {
    out.push(`<span class="thread-in is-loose">${icon('quote')}<span class="thread-label">نقل‌قول از</span>
      ${named.slice(0, max).map(a => `<bdi dir="auto" class="thread-who">${esc(a)}</bdi>`).join(' · ')}
      <span class="thread-note">بی‌پیوند</span></span>`);
  } else if (unproven.length) {
    out.push(`<span class="thread-in is-loose">${icon('quote')}<span class="thread-label">نقل‌قولِ درون‌متنی</span>
      <span class="thread-note">نویسندهٔ این نقل در این دفتر شناخته نیست، پس پیوند داده نشده است</span></span>`);
  }
  if (kids.length) {
    out.push(`<span class="thread-out">${icon('arrow-right')}<span class="thread-label">${faNum(kids.length)} پاسخ به این پست</span>
      ${kids.slice(0, max).map(k => threadChip(k, journal, 'child')).join('')}
      ${kids.length > max ? `<span class="thread-more">+${faNum(kids.length - max)}</span>` : ''}</span>`);
  }
  if (!out.length) return '';
  return `<div class="thread-line"${opts.detail ? ' data-thread-detail' : ''}>${out.join('')}</div>`;
}

/* Where a thread chip takes the reader, as the forum did: to the message
 * itself, in the journal page that shows it. Same page → scroll and flash the
 * row; other page → change page, then scroll once it is drawn. From the post
 * view there is no list to scroll, so the other post simply opens as a post. */
function threadJump(target) {
  const jid = target.dataset.jid;
  const pid = target.dataset.pid;
  const page = num(target.dataset.page) || 1;
  if (!jid || !pid) return;
  const here = App.currentJournal && App.currentJournal.id === jid;
  if (here && App.currentView === 'journal') {
    if (document.getElementById('post-' + pid)) { scrollToPost(pid); return; }
    App.pendingScrollPost = pid;
    go(`j/${encodeURIComponent(jid)}/${page}`);
    return;
  }
  go(`p/${encodeURIComponent(jid)}/${page}/${encodeURIComponent(pid)}`);
}

/* A rejected promise must not be cached: one flaky load used to poison the
   key for the rest of the session, so pressing «تلاش دوباره» could never
   actually try again. */
function cachedLoad(key, start) {
  if (!App.promises[key]) {
    const p = start();
    App.promises[key] = p;
    p.catch(() => { if (App.promises[key] === p) delete App.promises[key]; });
  }
  return App.promises[key];
}

/* ============================== boot ============================== */

document.addEventListener('DOMContentLoaded', init);

function init() {
  App.index = window.RTM_INDEX;
  if (!App.index) {
    $('#mainContent').innerHTML = `<div class="empty-state">${icon('warning')}<h3>دادهٔ آرشیو بارگذاری نشد</h3>
      <p>فایل <span class="mono">data/index.js</span> پیدا نشد. خط لولهٔ ساخت داده را دوباره اجرا کنید: <span class="mono">node _build/build-site.js</span></p></div>`;
    return;
  }
  applySettings();
  renderStats();
  hideEmptyTopics();
  renderRail();
  renderHome();
  renderReadingRail();
  renderShelf();
  setupEvents();
  setupViewer();
  setupNotesView();
  setupSettings();
  setupPostView();
  setupPalette();
  route();
  registerServiceWorker();
  // Chrome settles after the first paint: measure the real masthead height and
  // honour the saved reading position when coming back from a post.
  requestAnimationFrame(() => {
    setMastVar();
    restoreReadingPosition();
  });
  /* The auto lamp flips at 19:00 and 07:00; re-check once a minute so a tab
     left open overnight follows the clock without a reload. */
  setInterval(() => {
    const now = lampOn();
    if (now !== App._lampWas) { App._lampWas = now; applySettings(); applyChrome(); }
  }, 60000);
  App._lampWas = lampOn();
}

function restoreReadingPosition() {
  if (!App.pendingRestore) return;
  const y = App.pendingRestore.y;
  App.pendingRestore = null;
  window.scrollTo({ top: y, behavior: 'instant' });
}

/* Repeat visits are what a phone reader actually feels: the shell and the
   shards already read are served from disk, and the next deploy replaces the
   cache through the version in sw.js. A browser without service workers, or
   a copy opened from file://, simply keeps working online. */
/* The worker's shell cache exists for repeat visits on the real host. On any
   local address — localhost, loopback, a LAN IP, a dev tunnel name — it must
   stay out of the way: a stale shell there reads as "my edits did nothing". */
function isLocalAddress(hostname) {
  const h = String(hostname || '').toLowerCase();
  return h === 'localhost' || h.endsWith('.localhost') || h === '::1' || h === '[::1]'
    || /^127\./.test(h)
    || /^10\./.test(h) || /^192\.168\./.test(h) || /^172\.(1[6-9]|2\d|3[01])\./.test(h)
    || h.endsWith('.local') || h.endsWith('.test') || h.endsWith('.invalid');
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
  if (isLocalAddress(location.hostname)) {
    navigator.serviceWorker.getRegistrations()
      .then(rs => rs.forEach(r => r.unregister()))
      .catch(() => {});
    return;
  }
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

function renderStats() {
  const s = App.index.stats || {};
  const setText = (id, value) => { const el = $('#' + id); if (el) el.textContent = value; };
  /* The builder publishes `translatedPosts`; it has never published a line
     count for the Persian post bodies. Counting them at run time meant walking
     `App.cache`, which is filled lazily per journal — so on first paint the
     headline number read ۰. Show the fact that is actually known. RD-31. */
  const translatedPosts = Number.isFinite(s.translatedPosts) ? s.translatedPosts : 0;
  setText('statJournals', faNum(s.journals ?? App.index.journals.length));
  setText('statPages', faNum(s.pages ?? 0));
  setText('statPosts', faNum(s.posts ?? 0));
  setText('statImages', faNum(s.images ?? s.uniqueImages ?? 0));
  setText('heroImages', faNum(s.uniqueImages ?? s.images ?? 0));
  setText('heroLines', faNum(translatedPosts));
  setText('heroPosts', faNum(s.posts ?? 0));
  /* The rail list under this badge holds journals only — topics live in their
     own view — so the count must not include them. */
  setText('journalCount', faNum((App.index.journals || []).filter(j => !isTopic(j)).length));
  // The masthead headline counts the journals in words, so it follows the
  // build instead of a number frozen into the markup when the site was written.
  setText('mastCount', faNum(s.journals ?? App.index.journals.length));
  const side = $('#sideMeta');
  if (side) {
    side.innerHTML = `
      <div><b>${faNum(s.posts || 0)}</b> پست · <b>${faNum(s.uniqueImages || 0)}</b> تصویر یکتا</div>
      <div><b>${faNum(translatedPosts)}</b> پستِ ترجمه‌شده به فارسی</div>
      <div>ساخته‌شده: <b>${esc(s.generatedAtLabel || '—')}</b></div>`;
  }
  const footer = $('#footerMeta');
  if (footer) {
    /* The footer is the only navigation a reader reaches after scrolling to the
     * bottom of a long journal page, and it had zero links. RD-36. */
    footer.innerHTML = `<nav class="footer-nav" aria-label="بخش‌های آرشیو">
      <a href="#/">خانه</a><a href="#/all">همهٔ پست‌ها</a><a href="#/gallery">تابلوی تصاویر</a><a href="#/saved">نشان‌شده</a>
    </nav>
    <span>${faNum(s.journals || 0)} دفتر · ${faNum(s.pages || 0)} صفحه · ${faNum(s.posts || 0)} پست · ${faNum(s.uniqueImages || 0)} تصویر یکتا</span>
      <span>ترجمهٔ فارسی دستی و بازبینی‌شده، همراه با متن اصلی هر پست</span>
      <span class="mono">build: ${esc(s.generatedAtLabel || '—')}</span>`;
  }
}

function renderRail() {
  const list = $('#journalList');
  if (!list) return;
  const journals = orderedJournals();
  list.innerHTML = journals.map((j, i) => {
    const rank = priorityRank(j.id);
    return `
    <a class="toc-item${rank ? ' is-priority' : ''}" href="#/j/${encodeURIComponent(j.id)}/1" data-journal="${esc(j.id)}" data-name="${esc(j.name)}">
      <span class="toc-num">${faNum(i + 1)}</span>
      <span class="toc-name"><bdi dir="auto">${esc(j.name)}</bdi>${rank ? `<span class="toc-star" role="img" aria-label="ژورنال اولویت‌دار — اولویت ${faNum(rank)}">★</span>` : ''}</span>
      <span class="toc-count" title="${faNum(j.pages)} صفحه">${faNum(j.pages)}</span>
    </a>`;
  }).join('')
    + `<p class="toc-empty" id="railFilterEmpty" hidden>موردی با این نام نیست.</p>`;
  syncActiveNav();
}

/* The rail filter hides rows. Without a note the list simply looks shorter and
   the header count still claims the whole archive is on screen. */
function applyRailFilter(rawQ) {
  const q = norm(rawQ);
  const rows = $$('.toc-item[data-journal]');
  let shown = 0;
  rows.forEach(el => {
    const hit = !q || norm(el.dataset.name || el.querySelector('.toc-name')?.textContent || '').includes(q);
    el.hidden = !hit;
    if (hit) shown++;
  });
  const count = $('#journalCount');
  if (count) count.textContent = q ? `${faNum(shown)} از ${faNum(rows.length)}` : faNum(rows.length);
  const empty = $('#railFilterEmpty');
  if (empty) empty.hidden = !(q && !shown);
  return shown;
}

function renderHome() {
  const grid = $('#journalGrid');
  const recent = $('#recentList');
  if (!grid || !recent) return;
  const journals = orderedJournals();
  grid.innerHTML = journals.map((j, i) => {
    const rank = priorityRank(j.id);
    const ps = progressStats(j.id, j.posts);
    const prog = ps.pct ? `<span class="idx-prog" title="${faNum(ps.read)} از ${faNum(ps.total)} پست خوانده شده"><i style="width:${ps.pct}%"></i></span>` : '';
    return `
    <a class="index-row${rank ? ' is-priority' : ''}" href="#/j/${encodeURIComponent(j.id)}/1">
      <span class="idx-num">${faNum(i + 1)}</span>
      <span class="idx-name"><bdi dir="auto">${esc(j.name)}</bdi>${rank ? `<span class="idx-priority">اولویت ${faNum(rank)}</span>` : ''}${prog}</span>
      <span class="idx-title"><bdi dir="auto">${esc(j.title || '')}</bdi></span>
      <span class="idx-cell"><b>${faNum(j.posts)}</b> پست</span>
      <span class="idx-cell is-accent"><b>${faNum(j.images)}</b> تصویر</span>
    </a>`;
  }).join('');

  const items = (App.index.recent || []).slice(0, 12);
  if (!items.length) {
    recent.innerHTML = `<div class="rail-note" style="padding:14px 0">پستی برای نمایش نیست.</div>`;
    return;
  }
  recent.innerHTML = items.map(r => {
    const jid = r.j;
    const pnum = r.p ?? 1;
    const href = r.id ? postHref(jid, pnum, r.id) : `#/j/${encodeURIComponent(jid)}/${pnum}`;
    const body = r.f || r.x || '';
    /* Each Latin fragment gets its own isolate: a journal name or author between
       two "·" separators in an RTL paragraph is a strong-LTR run, and the
       neutrals join the paragraph direction, so the row reads out of order. */
    const meta = [metaIsolate(esc(journalName(jid))), `صفحهٔ ${faNum(pnum)}`, metaIsolate(esc(r.a || '—'))];
    if (r.imgs) meta.push(`${faNum(r.imgs)} تصویر`);
    return `<a class="latest-item" href="${href}">
      <span class="latest-when" dir="ltr"><b>${esc(r.d || '—')}</b><span class="sep">·</span>${esc(r.n || pidLabel({ id: r.id }))}</span>
      <span class="latest-body">
        <span class="latest-journal">${meta.join(' · ')}</span>
        ${r.f ? `<p class="latest-text" dir="rtl" lang="fa">${esc(r.f)}</p><p class="latest-orig" dir="ltr" lang="en">${esc(r.x || '')}</p>` : `<p class="latest-text" dir="auto" lang="en">${esc(body)}</p>`}
      </span>
    </a>`;
  }).join('');
}

/* Education threads: the same rows as the journal index, sorted by subject.
   They are not one author's diary, so they carry no priority badge. */
function openTopics() {
  showView('topics');
  const grid = $('#topicGrid');
  const topics = orderedTopics();
  if (grid) {
    grid.innerHTML = topics.map((j, i) => {
      const ps = progressStats(j.id, j.posts);
      const prog = ps.pct ? `<span class="idx-prog" title="${faNum(ps.read)} از ${faNum(ps.total)} پست خوانده شده"><i style="width:${ps.pct}%"></i></span>` : '';
      return `
    <a class="index-row" href="#/j/${encodeURIComponent(j.id)}/1">
      <span class="idx-num">${faNum(i + 1)}</span>
      <span class="idx-name"><bdi dir="auto">${esc(j.name)}</bdi>${prog}</span>
      <span class="idx-title"><bdi dir="auto">${esc(j.title || '')}</bdi></span>
      <span class="idx-cell"><b>${faNum(j.posts)}</b> پست</span>
      <span class="idx-cell is-accent"><b>${faNum(j.images)}</b> تصویر</span>
    </a>`;
    }).join('');
  }
  const pages = topics.reduce((s, j) => s + (j.pages || 0), 0);
  const posts = topics.reduce((s, j) => s + (j.posts || 0), 0);
  const meta = $('#topicMeta');
  if (meta) meta.textContent = `${faNum(topics.length)} موضوع · ${faNum(pages)} صفحه · ${faNum(posts)} پست`;
}

/* ============================== routing ============================== */

function route() {
  const raw = location.hash.replace(/^#\/?/, '');
  const parts = raw.split('/').filter(Boolean).map(p => {
    try { return decodeURIComponent(p); } catch { return p; }
  });
  const view = parts[0] || 'home';
  /* A deep link to a plate is the only route that owns the viewer; walking to
     any other address has to put the viewer away, or the plate stays pasted
     over the page the address bar now names. */
  const plateRoute = view === 'i' && !!(parts[1] && parts[3]);
  if (!plateRoute) closeViewer();
  if (document.body.classList.contains('search-open')) setSearchOpen(false);
  if (view === 'home' || view === '') {
    showView('home');
    /* Hash routing never reloads the page, so the shelf, the progress chips
       and the recent rail would otherwise keep whatever they rendered at
       boot — a post read a minute ago would be missing until F5. */
    renderHome();
    renderShelf();
    renderReadingRail();
    syncActiveNav();
    return;
  }
  if (view === 'j' && parts[1]) { openJournal(parts[1], num(parts[2]) || 1, null, null); return; }
  if (view === 'p' && parts[1] && parts[3]) { openPost(parts[1], num(parts[2]) || 1, parts[3]); return; }
  if (view === 'p' && parts[1]) { openJournal(parts[1], num(parts[2]) || 1, null, null); return; }
  if (view === 'i' && parts[1]) { openJournal(parts[1], num(parts[2]) || 1, null, parts[3] || null); return; }
  if (view === 'search') {
    const q = parts[1] || '';
    const input = $('#globalSearch');
    if (input && input.value !== q) input.value = q;
    runSearch(q);
    return;
  }
  if (view === 'all') { openAll(); return; }
  if (view === 'topics') {
    if (!orderedTopics().length) { location.replace('#/'); return; }
    openTopics();
    return;
  }
  if (view === 'gallery') { openGallery(); return; }
  if (view === 'saved') { openSaved(); return; }
  if (view === 'notes') { openNotes(parts.slice(1).join('/')); return; }
  showView('notfound');
}

function num(value) {
  const n = parseInt(String(value || '1'), 10);
  return Number.isFinite(n) ? n : 1;
}

function go(path, replace = false) {
  const hash = '#/' + String(path).replace(/^#?\/?/, '');
  if (location.hash === hash) { route(); return; }
  try {
    if (replace) { history.replaceState(null, '', hash); route(); }
    else location.hash = hash;
  } catch {
    location.hash = hash;
  }
}

function replaceHash(path) {
  const hash = '#/' + String(path).replace(/^#?\/?/, '');
  try { history.replaceState(null, '', hash); } catch { location.hash = hash; }
}

/* The views where the reader is reading, not browsing the archive. */
const READING_VIEWS = new Set(['post', 'journal']);

function showView(name) {
  App.currentView = name;
  $$('.view').forEach(v => v.classList.toggle('is-active', v.dataset.view === name));
  document.body.classList.toggle('is-reading', READING_VIEWS.has(name));
  // The reading views strip rows off the bar, so the sticky rail and the
  // scroll-margin offsets have to be told the new height before the first paint.
  setMastVar();
  syncActiveNav();
}

function syncActiveNav() {
  $$('[data-nav]').forEach(el => {
    const active = el.dataset.nav === App.currentView;
    el.classList.toggle('is-active', active);
    if (active) el.setAttribute('aria-current', 'page');
    else el.removeAttribute('aria-current');
  });
  $$('.toc-item[data-journal]').forEach(el => {
    const active = !!(App.currentJournal && el.dataset.journal === App.currentJournal.id);
    el.classList.toggle('is-active', active);
    if (active) el.setAttribute('aria-current', 'true');
    else el.removeAttribute('aria-current');
  });
  // A filter left over from earlier browsing must not hide the journal that is
  // currently on screen — the row would be marked current and still be invisible.
  const jf = $('#journalFilter');
  if (jf && jf.value && App.currentJournal) {
    const row = $(`.toc-item[data-journal="${CSS.escape(App.currentJournal.id)}"]`);
    if (row && row.hidden) { jf.value = ''; applyRailFilter(''); }
  }
}

/* ============================== journal view ============================== */

async function openJournal(rawId, page = 1, postId = null, imageKey = null) {
  const meta = journalById(rawId);
  if (!meta) { showView('notfound'); return; }
  /* The data files are named by the canonical lowercase id, so a link that
   * arrived as `#/j/Astrokillah/1` has to be rewritten before it can load —
   * and rewriting the address bar is what keeps a copy of the URL, the back
   * button and a refresh all telling the truth afterwards. */
  if (meta.id !== rawId) {
    replaceHash('j/' + encodeURIComponent(meta.id) + '/' + (page || 1) +
      (imageKey ? '/' + encodeURIComponent(imageKey) : ''));
  }
  const id = meta.id;
  const token = ++App.journalToken;
  if (App.postReturn && App.postReturn.hash === location.hash) App.pendingRestore = App.postReturn;
  App.postReturn = null;
  showView('journal');
  App.currentJournal = null;
  App.currentPage = page;
  renderJournalHeaderPlaceholder(meta);
  setJournalLoading();
  window.scrollTo({ top: 0, behavior: 'instant' });
  try {
    const journal = await ensureJournal(id);
    if (token !== App.journalToken) return;
    App.currentJournal = journal;
    App.currentPage = clamp(page || 1, 1, journal.pages || 1);
    /* The reader may have typed a page the journal does not have; the content
       is clamped, so the address bar has to tell the same story. */
    if (App.currentPage !== page && !imageKey) {
      replaceHash('j/' + encodeURIComponent(id) + '/' + App.currentPage);
    }
    await ensureJournalPage(id, App.currentPage);
    if (token !== App.journalToken) return;
    renderJournalHeader(journal);
    renderJournalPage();
    prefetchJournalPage(id, App.currentPage + 1);
    prefetchJournalPage(id, App.currentPage - 1);
    syncActiveNav();
    if (App.pendingRestore && App.pendingRestore.hash === location.hash) {
      const y = App.pendingRestore.y;
      App.pendingRestore = null;
      const jump = () => window.scrollTo({ top: y, behavior: 'instant' });
      jump();
      // Plates and the sticky masthead settle a beat later; re-apply so the
      // reader lands exactly where they left off.
      setTimeout(jump, 80);
      setTimeout(jump, 320);
    }
    if (postId) scrollToPost(postId);
    if (App.pendingScrollPost) {
      const pid = App.pendingScrollPost;
      App.pendingScrollPost = null;
      scrollToPost(pid);
    }
    if (imageKey) {
      const im = findImage(journal, imageKey);
      if (im) openViewerForImage(imageKey, im.pid || postId || null);
    }
  } catch (e) {
    if (token !== App.journalToken) return;
    $('#journalPosts').innerHTML = errorState('دادهٔ این دفتر بارگذاری نشد', e.message);
  }
}

function renderJournalHeaderPlaceholder(meta) {
  $('#journalTitle').textContent = meta.name;
  $('#journalSubtitle').textContent = 'در حال بارگذاری…';
  $('#openOriginal').removeAttribute('href');
  $('#pageSelect').innerHTML = '';
  $('#pageOf').textContent = '';
  $('#prevPage').disabled = true;
  $('#nextPage').disabled = true;
  $('#journalPagerBottom').innerHTML = '';
}

/* Reading aids on the journal page itself: unread-only filter, an in-journal
   text filter, and a star for «still reading this». Injected once, rebound
   per journal through App.currentJournal. */
function injectJournalTools(journal) {
  const sub = $('#journalSubtitle');
  if (!sub) return;
  if (!$('#journalTools')) {
    sub.insertAdjacentHTML('afterend', `
      <div class="journal-tools" id="journalTools">
        <button class="text-action" id="unreadToggle" type="button" title="فقط پست‌هایی که هنوز نخوانده‌اید">فقط خوانده‌نشده‌ها</button>
        <input class="jfilter" id="journalFilterInput" type="search" placeholder="فیلتر در همین ژورنال…" aria-label="فیلتر در همین ژورنال">
        <button class="text-action" id="journalMark" type="button" title="نشان‌کردن ژورنال برای مرور بعدی">★ ژورنال</button>
      </div>`);
    const tools = $('#journalTools');
    tools.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b || !App.currentJournal) return;
      if (b.id === 'unreadToggle') {
        App.unreadOnly = !App.unreadOnly;
        b.classList.toggle('is-on', App.unreadOnly);
        b.textContent = App.unreadOnly ? 'همهٔ پست‌ها' : 'فقط خوانده‌نشده‌ها';
        renderJournalPage();
      } else if (b.id === 'journalMark') {
        toggleJournalMark(App.currentJournal.id);
        syncJournalMark();
      }
    });
    tools.querySelector('#journalFilterInput').addEventListener('input', (e) => {
      App.journalFilter = e.target.value;
      renderJournalPage();
    });
  }
  const inp = $('#journalFilterInput');
  if (inp && inp.value !== App.journalFilter) inp.value = App.journalFilter || '';
  const tog = $('#unreadToggle');
  if (tog) { tog.classList.toggle('is-on', !!App.unreadOnly); tog.textContent = App.unreadOnly ? 'همهٔ پست‌ها' : 'فقط خوانده‌نشده‌ها'; }
  syncJournalMark();
}

function syncJournalMark() {
  const b = $('#journalMark');
  if (!b || !App.currentJournal) return;
  const on = isJournalMarked(App.currentJournal.id);
  b.classList.toggle('is-on', on);
  b.textContent = on ? '★ نشان‌شده' : '☆ ژورنال';
  b.title = on ? 'برداشتن نشان از ژورنال' : 'نشان‌کردن ژورنال برای مرور بعدی';
}

/* The next post in journal order the reader has not seen yet — one tap
   forward instead of scrolling to find it. */
function appendNextUnread(journal, post) {
  const nav = $('#postDetailNav');
  if (!nav || !journal || !post) return;
  const posts = journal.posts || [];
  const i = posts.findIndex(p => p.id === post.id);
  if (i < 0) return;
  const next = posts.slice(i + 1).find(p => !isPostRead(journal.id, p.id));
  if (!next) return;
  const page = next.p ?? next.pageNum ?? 1;
  nav.insertAdjacentHTML('beforeend',
    `<a class="pager-btn" href="${postHref(journal.id, page, next.id)}">${icon('arrow-left')} پستِ خوانده‌نشدهٔ بعدی</a>`);
}

function renderJournalHeader(journal) {
  $('#journalTitle').innerHTML = `<bdi dir="auto">${esc(journal.name)}</bdi>`;
  const ps = progressStats(journal.id, journal.posts.length);
  $('#journalSubtitle').innerHTML = [
    `${faNum(journal.pages)} صفحه`,
    `${faNum(journal.posts.length)} پست`,
    `${faNum(journal.imageCount ?? journal.images.length)} تصویر`,
    journal.title ? `<bdi dir="auto">${esc(journal.title)}</bdi>` : '',
    `<span class="prog-chip" id="journalProg" title="پست‌های دیده‌شده"><span class="prog-bar"><i style="width:${ps.pct}%"></i></span> ${faNum(ps.pct)}٪ خوانده‌شده</span>`,
  ].filter(Boolean).join(' <span class="sep">·</span> ');
  const sel = $('#pageSelect');
  sel.innerHTML = Array.from({ length: journal.pages }, (_, i) => `<option value="${i + 1}">${faNum(i + 1)}</option>`).join('');
  sel.value = String(App.currentPage);
  sel.onchange = () => go(`j/${encodeURIComponent(journal.id)}/${sel.value}`);
  $('#pageOf').innerHTML = `<b>${faNum(App.currentPage)}</b> از ${faNum(journal.pages)}`;
  wirePageButtons(journal);
  injectJournalTools(journal);
  const original = $('#openOriginal');
  if (original) {
    const url = originalPageUrl(journal, App.currentPage);
    original.hidden = url === '#';
    if (url === '#') {
      original.removeAttribute('href');
      original.title = 'پیوند فایل اصلی برای این صفحه ثبت نشده است';
    } else {
      original.href = url;
      original.title = url;
    }
  }
  $('#journalBack').onclick = () => go('');
  renderJournalBottomPager(journal);
}

function wirePageButtons(journal) {
  const prev = $('#prevPage');
  const next = $('#nextPage');
  if (prev) {
    prev.disabled = App.currentPage <= 1;
    prev.onclick = () => { if (App.currentPage > 1) go(`j/${encodeURIComponent(journal.id)}/${App.currentPage - 1}`); };
  }
  if (next) {
    next.disabled = App.currentPage >= journal.pages;
    next.onclick = () => { if (App.currentPage < journal.pages) go(`j/${encodeURIComponent(journal.id)}/${App.currentPage + 1}`); };
  }
  syncLangTabs();
}

/* Every view that shows posts carries the same three-way switch; one function
   keeps them in step with the stored reading mode. */
function syncLangTabs() {
  const lang = cardLanguage();
  $$('.lang-tabs [data-card-lang]').forEach(tab => {
    const on = tab.dataset.cardLang === lang;
    tab.classList.toggle('is-active', on);
    tab.setAttribute('aria-selected', String(on));
    tab.onclick = () => updateSetting('language', tab.dataset.cardLang);
  });
}

function renderJournalBottomPager(journal) {
  const box = $('#journalPagerBottom');
  if (!box) return;
  const page = App.currentPage;
  const atEnd = page >= journal.pages;
  const list = orderedJournals();
  const idx = list.findIndex(j => j.id === journal.id);
  const after = idx >= 0 ? list[idx + 1] : null;
  const nextLink = !atEnd ? '' : (after
    ? `<a class="btn btn-quiet" href="#/j/${encodeURIComponent(after.id)}/1">دفتر بعدی: <bdi dir="auto">${esc(after.name)}</bdi> ${icon('arrow-left')}</a>`
    : `<a class="btn btn-quiet" href="#/">پایان آرشیو — بازگشت به خانه ${icon('home')}</a>`);
  box.innerHTML = `
    <div class="pager-side">
      <button class="pager-btn" type="button" data-edge="prev" ${page <= 1 ? 'disabled' : ''}>${icon('chevron-right')} قبلی</button>
      <button class="pager-btn" type="button" data-edge="next" ${atEnd ? 'disabled' : ''}>بعدی ${icon('chevron-left')}</button>
    </div>
    <span class="pager-pos">صفحه <b>${faNum(page)}</b> از ${faNum(journal.pages)}</span>
    <span class="grow"></span>
    ${nextLink}`;
  const jump = (delta) => {
    const target = page + delta;
    if (target < 1 || target > journal.pages) return;
    go(`j/${encodeURIComponent(journal.id)}/${target}`);
  };
  box.querySelector('[data-edge="prev"]')?.addEventListener('click', () => jump(-1));
  box.querySelector('[data-edge="next"]')?.addEventListener('click', () => jump(1));
}

/* The scanned originals are far too large to publish with the archive, so a
   `../dir/file` guess was a guaranteed 404 on every deployed page. The link is
   only offered when the deployment actually names a base for them. */
function originalPageUrl(journal, page) {
  const base = String(window.RTM_ORIGINALS_BASE || '').replace(/\/+$/, '');
  const file = Array.isArray(journal.pageFiles) ? journal.pageFiles[page - 1] : null;
  if (!base || !file || !journal.dir) return '#';
  const enc = s => encodeURIComponent(s).replace(/%2F/gi, '/');
  return base + '/' + enc(journal.dir) + '/' + enc(file);
}

function setJournalLoading() {
  const box = $('#journalPosts');
  box.innerHTML = Array.from({ length: 3 }, () => `
    <div class="article" aria-hidden="true">
      <div class="article-head"><span class="article-num">…</span><span class="article-author">در حال بارگذاری</span></div>
      <div class="skeleton-line w-90"></div>
      <div class="skeleton-line w-70"></div>
      <div class="skeleton-line w-40"></div>
    </div>`).join('');
}

function renderJournalPage() {
  const journal = App.currentJournal;
  if (!journal) return;
  const box = $('#journalPosts');
  let posts = journal.posts.filter(p => (p.p ?? p.pageNum) === App.currentPage);
  const q = (App.journalFilter || '').trim().toLowerCase();
  if (q) posts = posts.filter(p =>
    String(p.t || p.text || '').toLowerCase().includes(q) ||
    String(p.fa || '').toLowerCase().includes(q) ||
    String(p.a || p.author || '').toLowerCase().includes(q));
  if (App.unreadOnly) posts = posts.filter(p => !isPostRead(journal.id, p.id));
  App.currentPagePosts = posts;
  const sel = $('#pageSelect');
  if (sel) sel.value = String(App.currentPage);
  wirePageButtons(journal);
  const of = $('#pageOf');
  if (of) of.innerHTML = `<b>${faNum(App.currentPage)}</b> از ${faNum(journal.pages)}`;
  renderJournalBottomPager(journal);
  if (!posts.length) {
    box.innerHTML = `<div class="empty-state">${icon('book')}<h3>این صفحه پستی ندارد</h3><p>با فهرست صفحه‌ها در بالا، صفحهٔ دیگری را انتخاب کنید.</p></div>`;
    return;
  }
  const map = imageMap(journal);
  box.innerHTML = posts.map(p => renderPostCard(p, journal, map)).join('');
  wirePlateImages(box);
  wireReadTracking(box);
}

/* The ledger row is the article: a hairline, a number, a name, then text.
   No card, no avatar — the archive reads like a newspaper page. */
function renderPostCard(post, journal, map) {
  const text = post.t || post.text || '';
  const fa = post.fa || '';
  const imgs = Array.isArray(post.im) ? post.im : (post.images || []);
  const pnum = post.p ?? post.pageNum ?? App.currentPage;
  const author = post.a || post.author || '—';
  const date = post.d || post.date || '';
  const rank = post.r || post.rank || '';
  const number = post.n || post.number || pidLabel(post);
  const detailHref = postHref(journal.id, pnum, post.id);
  const saved = !!findBookmark(journal.id, post.id);
  /* `ib` anchors a plate to the paragraph it follows, so a chart sitting
     between two paragraphs stays between them instead of being swept into
     the gallery under the whole post. Plates without an anchor keep the old
     trailing gallery. */
  const figures = new Map();
  const seenKeys = new Set();
  for (const key of imgs) {
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);
    const im = map.get(key);
    if (!im) continue;
    const fig = renderFigure(im, post);
    if (fig) figures.set(key, fig);
  }
  const anchors = new Map();
  const anchored = new Set();
  for (const [key, after] of Object.entries(post.ib || {})) {
    if (!figures.has(key)) continue;
    const at = Number(after);
    if (!Number.isFinite(at) || at < 0) continue;
    if (!anchors.has(at)) anchors.set(at, []);
    anchors.get(at).push(figures.get(key));
    anchored.add(key);
  }
  const plates = [];
  for (const [key, fig] of figures) if (!anchored.has(key)) plates.push(fig);
  const gap = plateGapInfo(post, map);
  const shown = new Set(imgs.filter(k => { const im = map.get(k); return im && !isTinyPlate(im); })).size;
  const body = (() => {
    if (!fa) return `<div class="article-text" data-post-text dir="auto" lang="en">${singleLangHTML(post, 'en', anchors)}</div>`;
    const mode = cardLanguage();
    if (mode === 'fa') return `<div class="article-text" data-post-text dir="rtl" lang="fa">${singleLangHTML(post, 'fa', anchors)}</div>`;
    if (mode === 'en') return `<div class="article-text" data-post-text dir="ltr" lang="en">${singleLangHTML(post, 'en', anchors)}</div>`;
    /* Dual in the card itself — each paragraph, original above, Persian beneath. */
    return `<div class="dual" data-post-text>${dualRowsHTML(post, anchors)}</div>`;
  })();
  return `<article class="article" id="post-${esc(post.id)}" data-post-id="${esc(post.id)}" data-jid="${esc(journal.id)}">
    <div class="article-head">
      <span class="article-num" dir="ltr">${esc(number)}</span>
      <span class="article-author" dir="auto">${esc(author)}</span>
      ${rank ? `<span class="article-rank" dir="auto" title="${esc(rank)}">${rankBadgeHTML(rank)}${esc(rankLabel(rank))}</span>` : ''}
      ${date ? `<span class="article-date" dir="ltr">${esc(date)}</span>` : ''}
      <span class="article-page">ص ${faNum(pnum)}</span>
      ${shown || gap.n ? `<span class="article-page" title="${gap.n ? esc(faNum(gap.n) + ' تصویرِ دیگرِ این پست در آرشیو موجود نیست') : ''}">${icon('image')} ${faNum(shown)}${gap.n ? `<span class="page-gap">+${faNum(gap.n)}</span>` : ''}</span>` : ''}
      ${fa ? '<span class="tag is-gloss" title="متن فارسی این پست ترجمه شده است">' + icon('translate') + ' ترجمهٔ فارسی</span>' : ''}
      <span class="dot-leader"></span>
      <a class="text-action article-jump" href="${detailHref}" title="پست کامل" aria-label="پست کامل">${icon('external')}</a>
      <button class="text-action${saved ? ' is-on' : ''}" type="button" data-action="bookmark" data-bookmark-btn
        data-jid="${esc(journal.id)}" data-pid="${esc(post.id)}" aria-pressed="${saved}"
        title="${saved ? 'برداشتن نشان' : 'نشان‌کردن این پست'}">${icon(saved ? 'bookmark-on' : 'bookmark')}</button>
      <button class="text-action" type="button" data-action="copy-post" title="کپی پیوند این پست">${icon('copy')}</button>
      <button class="text-action${isPostRead(journal.id, post.id) ? ' is-on' : ''}" type="button" data-action="read-toggle"
        data-jid="${esc(journal.id)}" data-pid="${esc(post.id)}" aria-pressed="${isPostRead(journal.id, post.id)}"
        title="${isPostRead(journal.id, post.id) ? 'خوانده‌نشده علامت بزن' : 'خوانده‌شده علامت بزن'}">${icon(isPostRead(journal.id, post.id) ? 'check' : 'eye')}</button>
    </div>
    ${threadLine(post, journal)}
    ${body}
    ${plates.length || gap.n ? `<div class="plates">${plates.join('')}${plateGapNotice(post, map)}</div>` : ''}
    <div class="article-foot">
      <a class="article-more link-end" href="${detailHref}">${imgs.length ? 'جزئیات پست و تصویرها' : 'پست کامل'} ${icon('arrow-left')}</a>
    </div>
  </article>`;
}

/* A plate is the image unit. The frame keeps its aspect ratio before the bytes
   arrive, so the page never jumps under the reader. */
/* Avatars, rank icons and smileys are card chrome, not plates — the forum
   avatar is ~60px and would only ever render as a meaningless thumbnail. */
function isTinyPlate(im) {
  const w = (im && im.w) || 0;
  const h = (im && im.h) || 0;
  return !!(w && h && w <= 96 && h <= 96);
}

function renderFigure(im, post) {
  if (isTinyPlate(im)) return '';
  const key = im.k;
  const full = im.f || im.asset || '';
  const thumb = im.t || im.thumb || full;
  const w = im.w || 0;
  const h = im.h || 0;
  const ar = w && h ? `${w} / ${h}` : 'auto';
  const name = im.o || im.originalName || 'تصویر';
  const metaBits = [
    w && h ? `<bdi dir="ltr">${faNum(w)}×${faNum(h)}</bdi>` : '',
    metaIsolate(im.b ? formatBytes(im.b) : ''),
  ].filter(Boolean);
  return `<figure class="plate" data-key="${esc(key)}" data-post="${esc(post.id)}"${w ? ` style="--pw: ${w}px"` : ''}>
    <div class="plate-frame" data-action="figure" tabindex="0" role="button" aria-label="بزرگ‌نمایی تصویر">
      <div class="plate-media" style="--ar: ${esc(ar)}">
        <div class="plate-skeleton" data-skeleton></div>
        <img src="${esc(thumb)}" alt="${esc(name)}" loading="lazy" decoding="async" draggable="false"
          ${w && h ? `width="${w}" height="${h}"` : ''} data-thumb="${esc(thumb)}" data-full="${esc(full)}">
        <span class="plate-anno" hidden></span>
      </div>
    </div>
    <figcaption class="plate-caption">
      <span class="cap-file" dir="ltr" title="${esc(name)}">${esc(name)}</span>
      ${metaBits.length ? `<span>${metaBits.join(' · ')}</span>` : ''}
      ${notchNotice(key)}
    </figcaption>
  </figure>`;
}

function wirePlateImages(root) {
  $$('img[data-thumb]', root).forEach(img => {
    const settle = () => {
      const media = img.closest('.plate-media');
      if (!media) return;
      const skeleton = media.querySelector('[data-skeleton]');
      if (img.naturalWidth === 0) {
        media.classList.add('is-broken');
      } else {
        img.classList.add('is-loaded');
      }
      if (skeleton) skeleton.remove();
    };
    if (img.complete) settle();
    else {
      img.addEventListener('load', settle, { once: true });
      img.addEventListener('error', settle, { once: true });
    }
  });
  /* Every plate list that is wired gets its note counts too, so a chart you
     wrote on is recognisable before it is opened, not only after. */
  if (window.Anno) Anno.paintPlateBadges(root);
}

function scrollToPost(postId) {
  setTimeout(() => {
    const el = document.getElementById('post-' + postId);
    if (!el) return;
    const from = window.scrollY;
    /* block: 'start', not 'center': a journal post with four charts in it is
     * taller than the viewport, and centring it buries the very head — the
     * number, the author, the thread line — above the fold. `.article` carries
     * scroll-margin-top for the sticky masthead, so 'start' lands the signature
     * line just under it, which is what "jump to message" means on the forum. */
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    el.classList.add('is-target');
    setTimeout(() => el.classList.remove('is-target'), 2600);
    /* Smooth scrolling is an animation, so it needs frames: a throttled tab, a
     * reader with prefers-reduced-motion, or a page that cannot scroll at all
     * leaves the click with nothing moving. If the page has not budged, make
     * the same jump without the animation — a thread chip that silently does
     * nothing is the one failure this control cannot have. */
    setTimeout(() => {
      if (Math.abs(window.scrollY - from) > 8) return;
      el.scrollIntoView({ behavior: 'instant', block: 'start' });
    }, 420);
  }, 80);
}

function errorState(title, message) {
  return `<div class="error-state"><b>${esc(title)}</b>
    <code>${esc(message || 'خطای نامشخص')}</code>
    <div class="more-row"><button class="btn btn-quiet" type="button" onclick="location.reload()">تلاش دوباره</button></div></div>`;
}

/* ============================== post detail ============================== */

async function openPost(jid, page = 1, pid = '') {
  const meta = journalById(jid);
  if (!meta || !pid) { showView('notfound'); return; }
  const token = ++App.journalToken;
  // Remember where the reader was in the journal so "back" returns to the same
  // scroll position, not the top of a 139-page thread.
  if (App.currentView === 'journal' && App.currentJournal && App.currentJournal.id === jid) {
    App.postReturn = { hash: `#/j/${encodeURIComponent(jid)}/${App.currentPage || page}`, y: window.scrollY };
  } else {
    App.postReturn = null;
  }
  showView('post');
  App.postDetail = { journal: null, post: null, page, view: 'both' };
  $('#postTitle').innerHTML = `<span class="spinner"></span> در حال بارگذاری…`;
  $('#postSubtitle').textContent = '';
  $('#postDetailText').innerHTML = `<div class="loading-row"><span class="spinner"></span> پست آماده می‌شود…</div>`;
  $('#postDetailMedia').innerHTML = '';
  $('#postDetailNav').innerHTML = '';
  window.scrollTo({ top: 0, behavior: 'instant' });
  try {
    const journal = await ensureJournal(jid);
    if (token !== App.journalToken) return;
    const stub = (journal.posts || []).find(p => p.id === pid);
    if (!stub) { showView('notfound'); return; }
    const targetPage = stub.p ?? stub.pageNum ?? page;
    await ensureJournalPage(jid, targetPage);
    if (token !== App.journalToken) return;
    const post = (journal.posts || []).find(p => p.id === pid);
    if (!post) { showView('notfound'); return; }
    App.currentJournal = journal;
    App.currentPage = targetPage;
    App.currentPagePosts = (journal.posts || []).filter(p => (p.p ?? p.pageNum) === App.currentPage);
    const preferred = post.fa ? 'both' : 'en';
    App.postDetail = { journal, post, page: App.currentPage, view: preferred };
    renderPostDetail();
    prefetchJournalPage(jid, App.currentPage + 1);
    prefetchJournalPage(jid, App.currentPage - 1);
    recordReading(jid, App.currentPage, pid, post.n || pidLabel(post), post.a || '');
    markPostRead(jid, pid);
    const mins = estimateReadMinutes(post);
    const sub = $('#postSubtitle');
    if (sub && mins) sub.insertAdjacentHTML('beforeend', ` <span class="sep">·</span> حدود ${faNum(mins)} دقیقه مطالعه`);
  } catch (e) {
    if (token !== App.journalToken) return;
    $('#postDetailText').innerHTML = errorState('پست بارگذاری نشد', e.message);
  }
}

function renderPostDetail() {
  const d = App.postDetail;
  if (!d || !d.journal || !d.post) return;
  const { journal, post } = d;
  const pnum = post.p ?? post.pageNum ?? d.page;
  const fa = post.fa || '';
  const text = post.t || post.text || '';
  const imgs = Array.isArray(post.im) ? post.im : (post.images || []);
  const author = post.a || post.author || '—';
  const date = post.d || post.date || '';
  const rank = post.r || post.rank || '';
  const number = post.n || post.number || pidLabel(post);
  const view = fa ? d.view : 'en';
  if (d.view !== view) d.view = view;

  $('#postTitle').innerHTML = `<span class="kicker">${esc(journal.name)}</span>
    <bdi dir="ltr">${esc(number)}</bdi>`;
  const gapEarly = post.gap ? Object.keys(post.gap).length : 0;
  $('#postSubtitle').innerHTML = [
    `<bdi dir="auto">${esc(author)}</bdi>`,
    rank ? `<span class="article-rank" dir="auto" title="${esc(rank)}">${rankBadgeHTML(rank)}${esc(rankLabel(rank))}</span>` : '',
    date ? `<span dir="ltr">${esc(date)}</span>` : '',
    `صفحهٔ ${faNum(pnum)}`,
    (imgs.length || gapEarly) ? `${faNum(new Set(imgs).size)} تصویر${gapEarly ? ` <span class="gap-inline">(+${faNum(gapEarly)} در آرشیو نیست)</span>` : ''}` : '',
    fa ? `<span class="tag is-gloss">${icon('translate')} ترجمهٔ فارسی</span>`
       : `<span class="tag is-none">${icon('info')} ترجمهٔ فارسی موجود نیست</span>`,
  ].filter(Boolean).join('<span class="sep">·</span>');

  $('#postBack').onclick = () => go(`j/${encodeURIComponent(journal.id)}/${pnum}`);
  const original = $('#postOriginal');
  if (original) {
    const url = originalPageUrl(journal, pnum);
    original.hidden = url === '#';
    if (url === '#') original.removeAttribute('href');
    else original.href = url;
    original.onclick = (e) => { if (!original.getAttribute('href')) e.preventDefault(); };
  }
  syncBookmarkButtons();

  /* Thread context sits above the text column, in both languages at once —
   * it is a fact about the conversation, not a translation of it. */
  const threadBox = $('#postThread');
  if (threadBox) {
    const line = threadLine(post, journal, { detail: true, full: true });
    threadBox.innerHTML = line;
    threadBox.hidden = !line;
  }

  /* Some print posts interleave prose and charts. `ib` maps a plate to the
     paragraph it follows, so the chart stays where the author put it instead
     of being swept into a gallery below the whole post. */
  const map = imageMap(journal);
  const seen = new Set();
  const figures = new Map();
  for (const key of imgs) {
    if (seen.has(key)) continue;
    seen.add(key);
    const im = map.get(key);
    if (im) figures.set(key, renderDetailFigure(im, post));
  }
  const anchors = new Map();
  const anchored = new Set();
  for (const [key, after] of Object.entries(post.ib || {})) {
    if (!figures.has(key)) continue;
    const at = Number(after);
    if (!Number.isFinite(at) || at < 0) continue;
    if (!anchors.has(at)) anchors.set(at, []);
    anchors.get(at).push(figures.get(key));
    anchored.add(key);
  }

  /* Above 1100px the detail page is two columns: the prose and a sticky plate
     column. A plate drawn inside the text would leave that column empty and
     squeeze the prose into half the page, so there the plates move into the
     column in the author's order; below the breakpoint they stay inline. */
  const sideBySide = window.matchMedia('(min-width:1101px)').matches;
  const inlineAnchors = sideBySide ? new Map() : anchors;

  const textBox = $('#postDetailText');
  textBox.dataset.view = view;
  textBox.innerHTML = postTextHTML(post, text, fa, d, inlineAnchors);
  wirePlateImages(textBox);
  $$('#viewPost [data-post-tab]').forEach(t => {
    const on = t.dataset.postTab === view;
    t.classList.toggle('is-active', on);
    t.setAttribute('aria-selected', String(on));
    /* A post with no Persian gloss has no «فارسی» to show. Leaving the tab live
       snapped it back without explanation and quietly rewrote the reader's
       global language default on the way. */
    const impossible = !fa && t.dataset.postTab === 'fa';
    t.disabled = impossible;
    t.title = impossible ? 'این پست ترجمهٔ فارسی ندارد' : '';
  });

  const plates = [];
  if (sideBySide) {
    for (const at of [...anchors.keys()].sort((a, b) => a - b)) plates.push(...anchors.get(at));
  }
  for (const [key, fig] of figures) {
    if (!anchored.has(key)) plates.push(fig);
  }
  const gap = plateGapInfo(post, map);
  if (!plates.length && !anchored.size && !gap.n) {
    $('#postDetailMedia').innerHTML = `<div class="footnote">${icon('image-off')}<span>تصویری ثبت نشده است.</span></div>`;
  } else if (!plates.length && !gap.n) {
    $('#postDetailMedia').innerHTML = '';
  } else {
    /* "no image was recorded" was the old wording whenever nothing resolved, and
     * it is wrong: the post did record plates, the bytes are what is missing. */
    $('#postDetailMedia').innerHTML =
      `<div class="plates is-column">${plates.join('')}${plateGapNotice(post, map)}</div>`;
  }
  wirePlateImages($('#postDetailMedia'));

  renderPostDetailNav();
  syncPostReadBtn();
  appendNextUnread(journal, post);
}

/* The reading pane. Bilingual mode puts the English it was written in and the
   Persian under it in one ruled pair, so checking a sentence never costs a tab
   switch. "پاراگراف" keeps each language whole for continuous reading. */
function postTextHTML(post, text, fa, d, anchors) {
  const view = d.view || 'both';
  const enBox = text
    ? `<div class="paras-en" dir="ltr" lang="en">${singleLangHTML(post, 'en', anchors)}</div>`
    : `<div class="footnote">${icon('info')}<span>متنی برای این پست ثبت نشده است.</span></div>`;
  const faBox = fa
    ? `<div class="article-text" dir="rtl" lang="fa">${singleLangHTML(post, 'fa', anchors)}</div>`
    : '';
  const label = (kind) => `<div class="rule-head is-first"><h2>${kind === 'fa' ? 'ترجمهٔ فارسی' : kind === 'both' ? 'دوزبانه' : 'متن اصلی'}</h2></div>`;

  if (view === 'en') return `${label('en')}${enBox}`;
  if (view === 'fa') {
    return `${label('fa')}${faBox || `<div class="footnote">${icon('info')}<span>ترجمه‌ای برای این پست نیست.</span></div>`}`;
  }
  if (!fa) return `${label('en')}${enBox}`;
  return `${label('both')}<div class="dual">${dualRowsHTML(post, anchors)}</div>`;
}

function paragraphsHTML(value) {
  return articleBlocksHTML({ fa: value, t: '' }, 'fa');
}

function splitSentencesFa(text) {
  const s = String(text || '').replace(/\r\n?/g, '\n').trim();
  if (!s) return [];
  const parts = [];
  let buf = '';
  for (let i = 0; i < s.length; i++) {
    buf += s[i];
    const ch = s[i];
    const next = s[i + 1];
    if (/[.!?。؟؛:$)]/.test(ch)) {
      // Avoid splitting decimal / acronyms / time — next char is letter & space/end
      if (next == null || /[\s)\"'»]/.test(next) || (/[A-Za-z\u0600-\u06FF]/.test(next) && /\s/.test(next))) {
        if (buf.length > 8) { parts.push(buf.trim()); buf = ''; }
      }
    }
    if (ch === '\n' && buf.trim().length > 12) {
      parts.push(buf.trim().replace(/\n/g, ' '));
      buf = '';
    }
  }
  if (buf.trim().length > 2) parts.push(buf.trim().replace(/\n/g, ' '));
  // merge very short fragments with next
  const merged = [];
  for (const p of parts) {
    if (merged.length && p.length < 14 && !/[.!?؟]/.test(p)) merged[merged.length - 1] += ' ' + p;
    else merged.push(p);
  }
  return merged.filter(Boolean);
}

/* ---------------------------------------------------- paragraph model --
   One row per forum paragraph, which is the unit Kunena actually used. The
   old code split each language on its own and paired the two lists by index,
   so an English paragraph broken into hard-wrapped lines ended up under the
   wrong Persian sentence, and a translated quote head ("X نوشت:") became a
   second, empty quote box. Both are fixed by pairing paragraphs, not blocks. */

const QUOTE_WHO_RE = /^([A-Za-z][A-Za-z0-9_.\-+]{1,32})\s*(?:wrote|نوشت)\s*:\s*/i;

function cardLanguage() {
  const v = App.settings.language;
  return v === 'fa' || v === 'en' ? v : 'both';
}

/* Forum text hard-wraps at ~70 columns with single newlines; a blank line is a
   real paragraph break. Joining single newlines is what keeps "so / every
   member…" one sentence instead of two fake paragraphs. */
function splitForumParagraphs(raw) {
  return String(raw || '')
    .replace(/\r\n?/g, '\n')
    .replace(/\u00a0/g, ' ')
    .split(/\n{2,}/)
    .map(p => p.replace(/\s*\n\s*/g, ' ').replace(/[ \t]+/g, ' ').trim())
    .filter(Boolean);
}

/* "X wrote: …" / "X نوشت: …" at the start, repeated for quote chains. */
function quoteHead(text) {
  let s = String(text || '').trim();
  const who = [];
  let m;
  while (who.length < 4 && (m = s.match(QUOTE_WHO_RE))) {
    who.push(m[1]);
    s = s.slice(m[0].length).trim();
  }
  return who.length && s ? { who, body: s } : null;
}

/* "X wrote:" on its own line is a head for the paragraph that follows, not a
   paragraph of its own — left alone it shows up as an orphan head above the
   quote, which reads like the quote is there twice. */
function mergeQuoteHeads(parts) {
  const merged = [];
  let pending = '';
  for (const p of parts) {
    const head = p.match(QUOTE_WHO_RE);
    if (head && !p.slice(head[0].length).trim()) {
      pending += (pending ? ' ' : '') + p;
      continue;
    }
    merged.push(pending ? pending + ' ' + p : p);
    pending = '';
  }
  return merged;
}

function paragraphModel(raw) {
  return mergeQuoteHeads(splitForumParagraphs(raw)).map(text => quoteHead(text) || { text });
}

/* One wall of Persian, no blank lines. Machine translations also drop full
 * stops, so the only safe visible unit is the sentence: a Persian sentence is
 * never cut between two rows, because half a sentence under one English
 * paragraph and the other half under the next reads as two broken translations. */
function wallSentenceGroups(text, enLens) {
  const sentences = splitSentencesFa(String(text || '').trim()).filter(Boolean);
  /* "X نوشت:" split off as its own sentence is a head for the next one. */
  const head = sentences[0] && sentences[0].match(QUOTE_WHO_RE);
  if (head && !sentences[0].slice(head[0].length).trim() && sentences.length > 1) {
    sentences.splice(0, 2, sentences[0] + ' ' + sentences[1]);
  }
  const totalEn = enLens.reduce((a, b) => a + b, 0) || 1;
  const totalFa = sentences.reduce((a, s) => a + s.length, 0) || 1;
  const out = [];
  let at = 0;
  let cumEn = 0;
  let cumFa = 0;
  for (let i = 0; i < enLens.length; i++) {
    cumEn += enLens[i] || 0;
    const target = totalFa * (cumEn / totalEn);
    const group = [];
    while (at < sentences.length) {
      if (group.length && cumFa + sentences[at].length > target) break;
      group.push(sentences[at]);
      cumFa += sentences[at].length;
      at++;
      if (cumFa >= target) break;
    }
    out.push(group.join(' '));
  }
  if (at < sentences.length && out.length) out[out.length - 1] += ' ' + sentences.slice(at).join(' ');
  return out.filter(Boolean);
}

function faParagraphModels(post, enCount) {
  const parts = mergeQuoteHeads(splitForumParagraphs(post.fa || ''));
  let groups = parts;
  if (parts.length === 1 && enCount > 1) {
    const enLens = paragraphModel(post.t || post.text || '').map(m => (m.body || m.text || '').length);
    groups = wallSentenceGroups(parts[0], enLens);
  }
  return groups.map(text => quoteHead(text) || { text });
}

function pairPostParagraphs(post) {
  const en = paragraphModel(post.t || post.text || '');
  const fa = faParagraphModels(post, en.length);
  const n = Math.max(en.length, fa.length);
  const rows = [];
  for (let i = 0; i < n; i++) rows.push({ en: en[i] || null, fa: fa[i] || null });
  return rows;
}

/* One amber quote box for both languages: the original above, its Persian
   translation beneath. The old markup drew the quote once per language, which
   read as the same quote twice. */
function quoteHTML(who, bodies, verb) {
  const label = verb === 'fa' ? 'نوشت:' : 'wrote:';
  let html = bodies.filter(b => b.text).map(b =>
    `<span class="post-quote-body${b.lang === 'fa' ? ' is-fa' : ''}" dir="${b.lang === 'fa' ? 'rtl' : 'ltr'}" lang="${b.lang}">${esc(b.text)}</span>`
  ).join('');
  for (let i = who.length - 1; i >= 0; i--) {
    html = `<blockquote class="post-quote${i < who.length - 1 ? ' is-nested' : ''}">
      <span class="post-quote-head"><bdi dir="ltr">${esc(who[i])}</bdi> ${label}</span>${html}</blockquote>`;
  }
  return html;
}

function quoteRowHTML(en, fa) {
  const who = (en && en.who) || (fa && fa.who) || ['—'];
  const verb = en && en.who ? 'en' : 'fa';
  const bodies = [];
  if (en) bodies.push({ lang: 'en', text: en.body });
  if (fa) bodies.push({ lang: 'fa', text: fa.body });
  return quoteHTML(who, bodies, verb);
}

function anchorHTML(anchors, after) {
  const figs = anchors && anchors.get(after);
  return figs && figs.length ? `<div class="post-inline-plates">${figs.join('')}</div>` : '';
}

/* Anchor indexes count source paragraphs; quote-head merging and the fa
   regroup can leave the rendered model shorter, so an anchor past the last
   row is flushed at the end rather than dropped with its plate. */
function anchorTailHTML(anchors, count) {
  if (!anchors || !anchors.size) return '';
  let out = '';
  for (const k of [...anchors.keys()].sort((a, b) => a - b)) {
    if (k > count) out += anchorHTML(anchors, k);
  }
  return out;
}

function dualRowsHTML(post, anchors) {
  const rows = pairPostParagraphs(post);
  return anchorHTML(anchors, 0) + rows.map(({ en, fa }, i) => {
    let body;
    if ((en && en.who) || (fa && fa.who)) body = quoteRowHTML(en, fa);
    else {
      const out = [];
      if (en) out.push(`<div class="dual-en" dir="ltr" lang="en"><p>${esc(en.text)}</p></div>`);
      if (fa) out.push(`<div class="dual-fa" dir="rtl" lang="fa"><p>${esc(fa.text)}</p></div>`);
      body = out.join('');
    }
    return body + anchorHTML(anchors, i + 1);
  }).join('') + anchorTailHTML(anchors, rows.length);
}

function singleLangHTML(post, lang, anchors) {
  const en = paragraphModel(post.t || post.text || '');
  const models = lang === 'fa' ? faParagraphModels(post, en.length) : en;
  return anchorHTML(anchors, 0) + models.map((m, i) =>
    (m.who
      ? quoteHTML(m.who, [{ lang, text: m.body }], lang)
      : `<p>${esc(m.text)}</p>`) + anchorHTML(anchors, i + 1)
  ).join('') + anchorTailHTML(anchors, models.length);
}

/* Split raw text into atomic blocks: forum paragraphs (\n\n) AND sentence
 * groups (for fluid CJK-like rendering). Quote heads (X wrote:) become
 * separate blockquotes. Whitespace normalized: NBSP → space, double-space →
 * single, hyphen-space corruption removed. */
function articleBlocksHTML(post, lang) {
  const text = String((lang === 'fa' ? post.fa : post.t) || '');
  if (!text) return '';
  // Auto-paragraph for fa from the English forum breaks when the machine
  // translation shipped as a single wall (no \n\n). Paragraph numbers are
  // preserved 1-by-1 so fa and en stay aligned in the dual view.
  if (lang === 'fa' && !text.includes('\n\n')) {
    const enBlocks = articleBlocksHTML(post, 'en');
    const enParas = [...enBlocks.matchAll(/<(?:p|blockquote)[^>]*>(.*?)<\/(?:p|blockquote)>/gs)];
    const enCount = enParas.length;
    if (enParas.length >= 2) {
      // Rebuild fa paragraphs from its own punctuation & sentence split, then
      // group to match en. Cheap heuristic that keeps order and readable line breaks.
      const normalized = text.replace(/\r\n?/g, '\n').replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ').trim();
      const flat = normalized.replace(/\s+/g, ' ');
      // Split by Persian sentence endings + code boundaries
      const sents = splitSentencesFa(flat);
      const groups = [];
      const per = Math.max(1, Math.ceil(sents.length / enCount));
      for (let i = 0; i < sents.length; i += per) {
        groups.push(sents.slice(i, i + per).join(' '));
      }
      // If custom quote chain broke the fa head, keep that as quote and cut rest
      const headNew = groups[0] || flat;
      const quote = extractQuoteChain(headNew);
      const out = [];
      if (quote) {
        for (const q of quote) out.push(`<blockquote class="post-quote"><span class="post-quote-head">${esc(q.who)} نوشت:</span><span class="post-quote-body">${esc(q.body.slice(0, 400))}</span></blockquote>`);
        // rebuild from the real body
        const rest = groups.slice(1);
        for (const g of rest) if (g) out.push(`<p>${esc(normalizeSpaces(g))}</p>`);
        return out.join('');
      }
      return groups.map(g => `<p>${esc(normalizeSpaces(g))}</p>`).join('');
    }
  }
  const normalized = text
    .replace(/\r\n?/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  if (!normalized) return '';
  // Original forum paragraphs
  const forumParas = normalized.split(/(?:\n){2,}/).map(s => s.trim()).filter(Boolean);
  const blocks = [];
  for (const para of forumParas) {
    // Quote chain: "dengaima wrote: andrew519 wrote: …" → nested quotes.
    const quote = extractQuoteChain(para);
    if (quote) {
      for (const q of quote) {
        blocks.push({ type: 'quote', who: q.who, body: normalizeSpaces(q.body) });
      }
      continue;
    }
    // Break very long paragraphs into readable sentence groups (max ~90 chars)
    const sentences = splitSentencesFa(para);
    if (sentences.length <= 1 || para.length <= 90) {
      blocks.push({ type: 'p', text: normalizeSpaces(para) });
      continue;
    }
    let cur = '';
    for (const sent of sentences) {
      const next = cur ? cur + ' ' + sent : sent;
      if (next.length > 90 && cur) {
        blocks.push({ type: 'p', text: normalizeSpaces(cur) });
        cur = sent;
      } else cur = next;
    }
    if (cur) blocks.push({ type: 'p', text: normalizeSpaces(cur) });
  }
  if (!blocks.length) return '';
  const chain = blocks.map(b => b.type === 'quote' ? b.who : '').filter(Boolean);
  const depth = chain.length;
  const quoteLabel = (idx) => {
    if (depth < 2) return '';
    const before = blocks.slice(0, idx).filter(b => b.type === 'quote').map(b => b.who);
    const after = blocks.slice(idx + 1).filter(b => b.type === 'quote').map(b => b.who);
    const bits = [];
    if (before.length) bits.push(`نقل از ${esc(before.join(' ← '))}`);
    if (after.length) bits.push(`داخلش ${esc(after.join(' ← '))} نقل شده`);
    bits.push('→ این پست');
    return `<span class="post-quote-chain">${bits.join(' · ')}</span>`;
  };
  return blocks.map((b, idx) => {
    if (b.type === 'quote') {
      const whoFa = lang === 'fa' ? 'نوشت:' : 'wrote:';
      const isNested = idx > 0 && blocks[idx - 1].type === 'quote';
      return `<blockquote class="post-quote${isNested ? ' is-nested' : ''}"><span class="post-quote-head">${esc(b.who)} ${whoFa}${quoteLabel(idx) ? ' ' + quoteLabel(idx) : ''}</span><span class="post-quote-body">${esc(b.body)}</span></blockquote>`;
    }
    return `<p>${esc(b.text)}</p>`;
  }).join('');
}

function extractQuoteChain(raw) {
  const s = String(raw || '').trim();
  if (!s) return null;
  if (/^(?:Hi|Bye|Thanks|Hello|Dear|Re|Fwd)\s+/i.test(s)) return null;
  if (/^[\u0600-\u06FF]/.test(s)) {
    // Persian machine head: "dengaima نوشت: andrew519 نوشت: …"
    let body = s;
    const whos = [];
    let m;
    const RE_FA = /([A-Za-z][A-Za-z0-9_.\-+]{1,32})\s*(?:wrote|نوشت)\s*:/gi;
    while ((m = RE_FA.exec(body)) && whos.length < 4) {
      whos.push(m[1]);
      body = body.slice(RE_FA.lastIndex).trim();
      if (!body) break;
    }
    if (whos.length < 1) return null;
    const rest = body;
    return whos.map(w => ({ who: w, body: rest }));
  }
  const m = s.match(QUOTE_HEAD_EN);
  if (!m) return null;
  // Nested: "X wrote: Y wrote: …" — keep order outer→inner
  const chainPart = s.slice(0, m.index + m[0].length);
  const whos = [...chainPart.matchAll(/([A-Za-z][A-Za-z0-9_.\-+]{1,32})\s+wrote:/gi)].map(x => x[1]);
  if (whos.length < 1) return null;
  const last = m[1];
  if (whos[whos.length - 1] !== last) whos.push(last);
  const body = (m[2] || '').trim();
  if (!body) return null;
  return whos.map(w => ({ who: w, body }));
}

function normalizeSpaces(s) {
  return String(s || '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\s+([،.؛:؟!%)\]])\s*/g, ' $1 ')
    .replace(/\s*-\s+(?=[A-Za-z\u0600-\u06FF])/g, ' — ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

const QUOTE_HEAD_EN = /(?:^|[\s])((?:[A-Za-z][A-Za-z0-9_.\-+]{1,32}))\s+wrote:([\s\S]+)$/i;

function quoteFromBlock(block) {
  const chain = extractQuoteChain(block);
  return chain ? chain[0] : null;
}

function quoteInline(block) {
  const s = String(block || '');
  const m = s.match(QUOTE_HEAD_EN);
  if (!m || m.index <= 5) return null;
  const who = m[1].trim();
  if (who.length < 2 || who.length > 32) return null;
  if (/^(?:Hi|Bye|Thanks|Hello|Dear|Re|Fwd)$/i.test(who)) return null;
  const body = (m[2] || '').trim();
  if (!body) return null;
  return { index: m.index + m[0].indexOf(m[1]), who, body };
}

function renderDetailFigure(im, post) {
  if (isTinyPlate(im)) return '';
  const key = im.k;
  const full = im.f || im.asset || '';
  const thumb = im.t || im.thumb || full;
  const w = im.w || 0;
  const h = im.h || 0;
  const ar = w && h ? `${w} / ${h}` : 'auto';
  const name = im.o || im.originalName || 'تصویر';
  const meta = [
    w && h ? `<bdi dir="ltr">${faNum(w)}×${faNum(h)}</bdi>` : '',
    metaIsolate(im.b ? formatBytes(im.b) : ''),
  ].filter(Boolean).join(' · ');
  return `<figure class="plate is-wide" data-key="${esc(key)}" data-post="${esc(post.id)}">
    <div class="plate-frame" data-action="post-lightbox" tabindex="0" role="button" aria-label="بزرگ‌نمایی تصویر">
      <div class="plate-media" style="--ar: ${esc(ar)}">
        <div class="plate-skeleton" data-skeleton></div>
        <img src="${esc(safeFullSrc(im))}" alt="${esc(name)}" loading="lazy" decoding="async" draggable="false"
          ${w && h ? `width="${w}" height="${h}"` : ''} data-thumb="${esc(thumb)}" data-full="${esc(full)}">
        <span class="plate-anno" hidden></span>
      </div>
      <button class="plate-chip" type="button" data-action="post-lightbox">${icon('zoom-in')} بزرگ‌نمایی</button>
    </div>
    <figcaption class="plate-caption">
      <span class="cap-file" dir="ltr" title="${esc(name)}">${esc(name)}</span>
      <span>${meta}</span>
      ${notchNotice(key)}
    </figcaption>
  </figure>`;
}

function renderPostDetailNav() {
  const d = App.postDetail;
  if (!d || !d.journal || !d.post) return;
  const { journal, post } = d;
  const posts = journal.posts || [];
  const idx = posts.findIndex(p => p.id === post.id);
  const prev = idx > 0 ? posts[idx - 1] : null;
  const next = idx >= 0 && idx < posts.length - 1 ? posts[idx + 1] : null;
  const link = (p, label, cls) => {
    if (!p) return `<span class="pager-btn ${cls} is-disabled" aria-hidden="true">${label} · —</span>`;
    const pp = p.p ?? p.pageNum ?? 1;
    return `<a class="pager-btn ${cls}" href="${postHref(journal.id, pp, p.id)}">
      ${icon(cls === 'is-prev' ? 'chevron-right' : 'chevron-left')} ${label} ·
      <bdi dir="auto">${esc(p.n || pidLabel(p))}</bdi> <span class="muted">${esc(p.a || '—')}</span>
    </a>`;
  };
  $('#postDetailNav').innerHTML =
    link(prev, 'پست قبلی', 'is-prev') +
    `<a class="text-action" href="#/j/${encodeURIComponent(journal.id)}/${post.p ?? 1}">${icon('list')} فهرست همین صفحه</a>` +
    link(next, 'پست بعدی', 'is-next');
}

function setPostView(view, persist = false) {
  if (!['both', 'fa', 'en'].includes(view)) view = 'both';
  App.postDetail.view = view;
  if (persist) updateSetting('language', view);
  renderPostDetail();
}

function setTextSize(delta) {
  // One size for the whole archive — the drawer slider, A−/A+ on a post and [ / ]
  // in the viewer all move the same token, so no control is a no-op.
  updateSetting('fontSize', clamp(Number(App.settings.fontSize) + delta, 13, 24));
}

function copyPostText() {
  const d = App.postDetail;
  if (!d || !d.post) return;
  const fa = d.post.fa || '';
  const en = d.post.t || d.post.text || '';
  const view = $('#postDetailText')?.dataset.view || d.view || 'both';
  const parts = view === 'fa' ? [fa] : view === 'en' ? [en] : [fa, en];
  const out = parts.filter(Boolean).join('\n\n———\n\n').trim();
  if (!out) { showToast('متنی برای کپی نیست'); return; }
  copyText(out).then(ok => showToast(ok ? 'متن پست کپی شد' : 'کپی ممکن نشد'));
}

function openViewerForPostImage(key) {
  const d = App.postDetail;
  if (!d || !d.journal || !d.post) return;
  const map = imageMap(d.journal);
  const items = [];
  const seen = new Set();
  for (const k of (d.post.im || [])) {
    if (seen.has(k)) continue;
    seen.add(k);
    const im = map.get(k);
    if (!im || isTinyPlate(im)) continue;
    items.push({ ...im, pid: d.post.id, p: d.post.p ?? d.post.pageNum ?? d.page });
  }
  if (!items.length) return;
  let idx = items.findIndex(im => im.k === key);
  if (idx < 0) idx = 0;
  openViewer(items, idx, d.journal);
}

function handlePostClick(e) {
  const action = e.target.closest('[data-action]');
  if (!action) return;
  const d = App.postDetail;
  if (!d || !d.journal || !d.post) return;
  const plate = action.closest('.plate');
  switch (action.dataset.action) {
    case 'post-lightbox':
      e.preventDefault();
      openViewerForPostImage(plate ? plate.dataset.key : '');
      break;
    case 'post-top':
      window.scrollTo({ top: 0, behavior: 'smooth' });
      break;
  }
}

/* A plate-frame is role="button" with tabindex="0", so Enter and Space have to
   do what the click does — on every view that draws one, not only the post view. */
function plateKeyActivate(e) {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const frame = e.target.closest('.plate-frame[data-action]');
  if (!frame) return;
  e.preventDefault();
  frame.click();
}

function setupPostView() {
  const view = $('#viewPost');
  if (!view || view.dataset.bound) return;
  view.dataset.bound = '1';
  view.addEventListener('click', handlePostClick);
  view.addEventListener('keydown', plateKeyActivate);
  /* Crossing the 1100px breakpoint changes where the plates live, so the open
     post is rebuilt instead of being left with an empty second column. */
  const wide = window.matchMedia('(min-width:1101px)');
  const onWideChange = () => {
    if (!App.postDetail || !view.classList.contains('is-active')) return;
    renderPostDetail();
  };
  if (wide.addEventListener) wide.addEventListener('change', onWideChange);
  else if (wide.addListener) wide.addListener(onWideChange);
  $('#postCopy')?.addEventListener('click', copyPostText);
  $('#postExport')?.addEventListener('click', exportPostMarkdown);
  $('#postBookmark')?.addEventListener('click', () => {
    const d = App.postDetail;
    if (!d || !d.post || !d.journal) return;
    toggleBookmark(d.journal.id, d.post.p ?? d.page, d.post.id, {
      author: d.post.a || '', date: d.post.d || '', number: d.post.n || pidLabel(d.post), text: d.post.t || '',
    });
  });
  $('#postFontMinus')?.addEventListener('click', () => setTextSize(-1));
  $('#postFontPlus')?.addEventListener('click', () => setTextSize(1));
  $('#postSpeak')?.addEventListener('click', () => {
    const d = App.postDetail;
    if (!d || !d.post) return;
    if (!('speechSynthesis' in window)) { showToast('خواندن با صدا در این مرورگر نیست'); return; }
    if (window.speechSynthesis.speaking) { window.speechSynthesis.cancel(); return; }
    const text = ((d.view === 'en' ? (d.post.t || d.post.text) : d.post.fa) || d.post.t || d.post.text || '')
      .replace(/\s+/g, ' ').trim().slice(0, 4000);
    if (!text) { showToast('متنی برای خواندن نیست'); return; }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = d.view === 'en' ? 'en-US' : 'fa-IR';
    u.rate = 0.95;
    const v = speechSynthesis.getVoices().find(v => v.lang && v.lang.toLowerCase().startsWith(u.lang.slice(0, 2)));
    if (v) u.voice = v;
    speechSynthesis.speak(u);
  });
  $('#postRead')?.addEventListener('click', () => {
    const d = App.postDetail;
    if (!d || !d.post || !d.journal) return;
    const on = togglePostRead(d.journal.id, d.post.id);
    syncPostReadBtn();
  });
  $$('#viewPost [data-post-tab]').forEach(tab => {
    tab.addEventListener('click', () => setPostView(tab.dataset.postTab, true));
  });
}

/* ============================== plate viewer ============================== */

function setupViewer() {
  const lb = $('#lightbox');
  if (!lb || lb.dataset.bound) return;
  lb.dataset.bound = '1';
  $('.viewer-backdrop', lb)?.addEventListener('click', closeViewer);
  $('#lbCloseTop')?.addEventListener('click', closeViewer);
  $('#lbPrev')?.addEventListener('click', () => moveViewer(-1));
  $('#lbNext')?.addEventListener('click', () => moveViewer(1));
  $('#lbZoomIn')?.addEventListener('click', () => zoomStep(1, centerAnchor()));
  $('#lbZoomOut')?.addEventListener('click', () => zoomStep(-1, centerAnchor()));
  $('#lbZoomFit')?.addEventListener('click', () => applyFitZoom());
  $('#lbZoomWidth')?.addEventListener('click', () => applyWidthZoom());
  $('#lbZoomLevel')?.addEventListener('click', () => applyFitZoom());
  $('#lbZoomActual')?.addEventListener('click', () => setZoom(1));
  $('#lbFullscreen')?.addEventListener('click', toggleViewerFullscreen);
  $('#lbAnnotate')?.addEventListener('click', () => {
    ensureAnnotate().then(ok => {
      const on = ok ? Anno.toggleAnno() : false;
      const status = $('#lbStatus');
      if (status) status.textContent = on ? 'حالت یادداشت روشن است — ابزاری را از نوار ابزار برگزینید' : 'حالت یادداشت خاموش شد';
    });
  });
  // A double-click is a request to see that corner properly: it zooms into the
  // point under the cursor, and a second double-click gives the whole plate back.
  $('#lbImage')?.addEventListener('dblclick', (e) => {
    const z = App.viewer.zoom;
    if (z.scale > (z.fit || 1) * 1.02) applyFitZoom();
    else setZoom(clamp(Math.max(2, (z.fit || 1) * 2), 0.05, ZOOM_MAX_SCALE), { x: e.clientX, y: e.clientY });
  });
  setupViewerGestures();
  // The pane changes size when the window, the shell or the fullscreen state moves.
  if (window.ResizeObserver) {
    const pane = $('.pane', lb);
    if (pane) {
      let raf = 0;
      new ResizeObserver(() => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => { if (!$('#lightbox').hidden) handleViewerResize(); });
      }).observe(pane);
    }
  }
  document.addEventListener('fullscreenchange', () => {
    const box = $('#lightbox');
    // Leaving by the browser's own control (Esc, the system bar) has to undo what
    // the button did.
    if (!document.fullscreenElement && box.classList.contains('lb-full')) box.classList.remove('lb-full');
    paintFullscreenButton(!!document.fullscreenElement || box.classList.contains('lb-full'));
  });
  $('#lbOpenPost')?.addEventListener('click', openViewerPost);
  $('#lbImage')?.addEventListener('load', settleViewerImage);
  $('#lbImage')?.addEventListener('error', () => {
    /* A plate whose full-size file is missing used to leave the pane painted
       blank with nothing said about it: the veil hid, the image never came, and
       the only clue was a small tag in a foot that scrolls out of view. */
    const im = App.viewer.items[App.viewer.idx];
    const thumb = im && (im.t || im.thumb);
    if (thumb && $('#lbImage').src !== new URL(thumb, document.baseURI).href) {
      $('#lbImage').src = thumb;
      return;
    }
    showViewerPlateMissing();
  });
  lb.addEventListener('keydown', (e) => {
    const inField = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName);
    /* Writing on the plate owns the keyboard first. Esc steps down the ladder —
       deselect, then leave note mode, then close the viewer — and the tool
       letters have to be read before the page-turning arrows below. */
    if (window.Anno && Anno.key(e)) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      if (lb.classList.contains('lb-full')) { toggleViewerFullscreen(); return; }
      closeViewer();
      return;
    }
    if (inField) return;
    /* The arrows do what is on screen: while part of the plate is off-view they
       walk around inside it, and once the whole plate fits they turn the page.
       Shift always turns the page, so the reader never has to know which mode
       they are in. */
    const panning = viewerCanPan() && !e.shiftKey;
    const step = e.altKey ? 40 : 160;
    if (e.key === 'ArrowLeft') { e.preventDefault(); if (panning) panViewer(-step, 0); else moveViewer(1); return; }
    if (e.key === 'ArrowRight') { e.preventDefault(); if (panning) panViewer(step, 0); else moveViewer(-1); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); if (panning) panViewer(0, -step); else zoomStep(1, centerAnchor()); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); if (panning) panViewer(0, step); else zoomStep(-1, centerAnchor()); return; }
    if (e.key === 'PageDown' || e.key === 'n') { e.preventDefault(); moveViewer(1); return; }
    if (e.key === 'PageUp' || e.key === 'p') { e.preventDefault(); moveViewer(-1); return; }
    if (e.key === 'Home') { e.preventDefault(); jumpViewer(0); return; }
    if (e.key === 'End') { e.preventDefault(); jumpViewer(App.viewer.items.length - 1); return; }
    if (e.key === 'f' || e.key === 'F') { e.preventDefault(); toggleViewerFullscreen(); return; }
    if (e.key === '0') { e.preventDefault(); applyFitZoom(); return; }
    if (e.key === '1') { e.preventDefault(); setZoom(1); return; }
    if (e.key === '2') { e.preventDefault(); applyWidthZoom(); return; }
    if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomStep(1, centerAnchor()); return; }
    if (e.key === '-' || e.key === '_') { e.preventDefault(); zoomStep(-1, centerAnchor()); return; }
    if (e.key === 'Tab') trapFocus(e, lb);
  });
}

function openViewerForImage(key, postId) {
  const journal = App.currentJournal;
  if (!journal) return;
  const map = imageMap(journal);
  const items = [];
  const seen = new Set();
  for (const post of App.currentPagePosts) {
    for (const k of (post.im || [])) {
      const im = map.get(k);
      if (!im || isTinyPlate(im) || seen.has(k)) continue;
      // One entry per unique plate: the same chart is often posted by several
      // people, and paging through duplicates looks like a broken viewer.
      seen.add(k);
      items.push({ ...im, pid: post.id, p: post.p ?? post.pageNum ?? im.p });
    }
  }
  if (!items.length) {
    const im = findImage(journal, key);
    if (im) items.push({ ...im });
  }
  let idx = items.findIndex(im => im.k === key && (!postId || im.pid === postId));
  if (idx < 0) idx = items.findIndex(im => im.k === key);
  if (idx < 0) { const im = findImage(journal, key); if (im) { items.push({ ...im }); idx = items.length - 1; } }
  if (idx >= 0) openViewer(items, idx, journal);
}

function openViewer(items, idx, journal) {
  if (!items || !items.length) return;
  App.viewer.items = items;
  App.viewer.idx = clamp(idx || 0, 0, items.length - 1);
  App.viewer.journal = journal;
  App.viewer.returnFocus = document.activeElement;
  const lb = $('#lightbox');
  if (!lb) return;
  lb.hidden = false;
  syncRail();
  renderViewer();
  /* Focus the dialog itself, not its close button: on a phone the button's
     focus ring read as a selection and painted a blue halo over the plate. */
  lb.tabIndex = -1;
  lb.focus({ preventScroll: true });
}

function closeViewer() {
  const lb = $('#lightbox');
  if (!lb || lb.hidden) return;
  if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
  lb.classList.remove('lb-full');
  const fsBtn = $('#lbFullscreen');
  if (fsBtn) fsBtn.innerHTML = icon('maximize');
  lb.hidden = true;
  if (window.Anno) Anno.detach();
  resetViewer();
  syncRail();
  const ret = App.viewer.returnFocus;
  if (ret && typeof ret.focus === 'function') ret.focus();
}

function moveViewer(delta) {
  const items = App.viewer.items;
  if (items.length < 2) return;
  App.viewer.idx = (App.viewer.idx + delta + items.length) % items.length;
  renderViewer();
}

function jumpViewer(idx) {
  const items = App.viewer.items;
  if (!items.length) return;
  const next = clamp(idx, 0, items.length - 1);
  if (next === App.viewer.idx) return;
  App.viewer.idx = next;
  renderViewer();
}

function renderViewer() {
  const im = App.viewer.items[App.viewer.idx];
  if (!im) return;
  const journal = App.viewer.journal;
  const full = im.f || im.asset || '';
  const thumb = im.t || im.thumb || '';
  const img = $('#lbImage');
  const load = $('#lbLoading');
  if (load) { load.hidden = false; load.innerHTML = `<span class="spinner"></span><span>بارگذاری تصویر…</span>`; }
  resetViewer();
  const stage = $('#lbImageStage');
  if (stage) stage.classList.add('is-void');
  const wanted = safeFullSrc(im);
  /* Assigning the string src already holds fires no `load` event at all — so
     re-opening the plate you just closed left the veil up over an image that was
     perfectly on screen. That is the "sometimes the picture isn't shown". */
  const unchanged = img.getAttribute('src') === wanted;
  img.src = wanted;
  img.alt = im.o || im.originalName || 'تصویر';
  if (unchanged && img.complete && img.naturalWidth) settleViewerImage();
  $('#lbCounter').textContent = `${faNum(App.viewer.idx + 1)} از ${faNum(App.viewer.items.length)}`;
  $('#lbPrev').disabled = App.viewer.items.length < 2;
  $('#lbNext').disabled = App.viewer.items.length < 2;
  $('#lbImageMeta').innerHTML = [
    im.o ? `<span class="cap-file" dir="ltr">${esc(im.o)}</span>` : '',
    im.w && im.h ? `<bdi dir="ltr">${faNum(im.w)}×${faNum(im.h)}</bdi>` : '',
    metaIsolate(im.b ? formatBytes(im.b) : ''),
    notchNotice(im.k),
  ].filter(Boolean).join('<span>·</span> ');
  const dl = $('#lbDownload');
  if (dl) {
    /* Hand the reader the file that opens whole, not the one with the bigger
     * number in the caption. */
    dl.href = wanted || full || thumb || '#';
    dl.setAttribute('download', im.o || 'rtm-plate');
  }
  /* Marks are loaded for every plate, not only in note mode: the reader who
     wrote on a chart last week expects to see those notes the moment it opens. */
  ensureAnnotate().then(ok => {
    if (ok) Anno.show(im.k, { ...im, jid: journal && journal.id }, journal);
  });
}

function openViewerPost() {
  const im = App.viewer.items[App.viewer.idx];
  if (!im) return;
  const journal = App.viewer.journal;
  const pid = im.pid;
  const jid = journal ? journal.id : im.journalId;
  const page = im.p || im.pageNum || 1;
  closeViewer();
  if (pid) go(`p/${encodeURIComponent(jid)}/${page}/${encodeURIComponent(pid)}`);
  else go(`j/${encodeURIComponent(jid)}/${page}`);
}

/* ============================== viewer zoom & pan ==============================
 * The stage is resized in CSS pixels (scale 1 = 100% of the plate's own
 * pixels) so the scroll area always matches what the reader sees, and panning
 * is native scrolling rather than a transform hack.
 *
 * Every scroll-position calculation below reads `scrollLeft` as "distance from
 * the left content edge". That is only true for a left-to-right scroll
 * container: in an RTL one the browser puts 0 at the right edge and counts
 * negative to the left, which mirrors the zoom anchor across the plate. The
 * scroller is therefore pinned to `direction: ltr` in the stylesheet — the
 * plates inside it are charts whose own time axis runs left to right anyway.
 */

const ZOOM_MAX_SCALE = 12;
const ZOOM_MIN_FIT_RATIO = 0.2;
const ZOOM_FLOOR = 0.05;

function viewerBox() {
  const scroller = $('#lbImageScroll');
  if (!scroller) return null;
  const cs = getComputedStyle(scroller);
  const padL = parseFloat(cs.paddingLeft) || 0;
  const padT = parseFloat(cs.paddingTop) || 0;
  const padR = parseFloat(cs.paddingRight) || 0;
  const padB = parseFloat(cs.paddingBottom) || 0;
  return {
    scroller, padL, padT, padR, padB,
    contentW: Math.max(1, scroller.clientWidth - padL - padR),
    contentH: Math.max(1, scroller.clientHeight - padT - padB),
  };
}

/* The middle of the visible pane, in viewport coordinates: what the keyboard
   and the toolbar buttons zoom around when there is no cursor to ask. */
function centerAnchor() {
  const box = viewerBox();
  if (!box) return null;
  const r = box.scroller.getBoundingClientRect();
  return { x: r.left + box.padL + box.contentW / 2, y: r.top + box.padT + box.contentH / 2 };
}

function viewerCanPan() {
  const box = viewerBox();
  const z = App.viewer.zoom;
  if (!box || !z.natW) return false;
  return z.natW * z.scale > box.contentW + 1 || z.natH * z.scale > box.contentH + 1;
}

function panViewer(dx, dy) {
  const box = viewerBox();
  if (!box) return;
  box.scroller.scrollLeft += dx;
  box.scroller.scrollTop += dy;
}

function resetViewer() {
  const stage = $('#lbImageStage');
  if (stage) { stage.style.width = ''; stage.style.height = ''; }
  App.viewer.zoom = { scale: 1, fit: 1, fitW: 1, natW: 0, natH: 0, mode: 'fit' };
  // A percentage carried over from the previous plate reads as a fact about this
  // one, which is how a plate that never loaded still looked like it had.
  const label = $('#lbZoomLevel');
  if (label) label.textContent = '—';
  const pane = $('#lightbox .pane');
  const scroll = $('#lbImageScroll');
  scroll?.classList.remove('can-pan', 'is-dragging');
  pane?.classList.remove('can-pan');
  document.querySelectorAll('.marquee').forEach(n => n.remove());
  if (scroll) scroll.scrollTo({ top: 0, left: 0 });
}

function computeFitScale() {
  const box = viewerBox();
  const z = App.viewer.zoom;
  if (!box || !z.natW || !z.natH) return 1;
  return clamp(Math.min(box.contentW / z.natW, box.contentH / z.natH), ZOOM_FLOOR, 3);
}

/* Fit-to-width is the mode a trading chart actually wants: the plate is wide
   and short, so fitting the whole thing on screen shrinks it to a thumbnail,
   while fitting the width keeps every candle readable and lets the reader pan
   down the price axis. */
function computeWidthScale() {
  const box = viewerBox();
  const z = App.viewer.zoom;
  if (!box || !z.natW) return 1;
  return clamp(box.contentW / z.natW, ZOOM_FLOOR, 3);
}

function zoomFloor() {
  const z = App.viewer.zoom;
  return Math.max(ZOOM_FLOOR, Math.min(z.fit || 1, z.fitW || 1) * ZOOM_MIN_FIT_RATIO);
}

function setZoom(scale, anchor) {
  const box = viewerBox();
  const stage = $('#lbImageStage');
  const z = App.viewer.zoom;
  if (!box || !stage || !z.natW || !z.natH) return;
  const next = clamp(scale, zoomFloor(), ZOOM_MAX_SCALE);
  // At the floor or the ceiling the gesture is spent; re-measuring and writing
  // the scroll offsets for nothing is what nudged the plate at the limits.
  if (Math.abs(next - z.scale) < 1e-5 && stage.style.width) return;
  const rect = box.scroller.getBoundingClientRect();
  const ax = anchor && Number.isFinite(anchor.x) ? anchor.x : rect.left + box.padL + box.contentW / 2;
  const ay = anchor && Number.isFinite(anchor.y) ? anchor.y : rect.top + box.padT + box.contentH / 2;
  /* Measured from the stage itself rather than the pane: the stage may sit
     inside a board wrapper (note mode) whose margin is part of the content. */
  const before = stage.getBoundingClientRect();
  const pointX = (ax - before.left) / z.scale;
  const pointY = (ay - before.top) / z.scale;
  z.scale = next;
  const near = (a, b) => Math.abs(a - b) < 0.005;
  z.mode = near(next, z.fit) ? 'fit' : near(next, z.fitW) ? 'width' : near(next, 1) ? 'actual' : 'free';
  stage.style.width = Math.max(1, Math.round(z.natW * next)) + 'px';
  stage.style.height = Math.max(1, Math.round(z.natH * next)) + 'px';
  /* The note board's margin follows the plate size; settle it before reading
     the stage's new position, or the anchor is off by the margin's growth. */
  if (window.Anno && typeof Anno.reflowBoard === 'function') Anno.reflowBoard();
  const after = stage.getBoundingClientRect();
  box.scroller.scrollLeft += (after.left + pointX * next) - ax;
  box.scroller.scrollTop += (after.top + pointY * next) - ay;
  const pct = Math.round(next * 100);
  const label = $('#lbZoomLevel');
  if (label) {
    label.textContent = faNum(pct) + '٪';
    label.title = (z.mode === 'fit' ? 'اندازهٔ پنجره · ' : z.mode === 'width' ? 'اندازهٔ پهنا · ' : '')
      + 'بازنشانی با کلید ۰ · چرخ یا Ctrl+چرخ برای زوم زیر نشانگر';
  }
  const canPan = viewerCanPan();
  box.scroller.classList.toggle('can-pan', canPan);
  $('#lightbox .pane')?.classList.toggle('can-pan', canPan);
  paintZoomModes();
  const status = $('#lbStatus');
  if (status) status.textContent = `بزرگ‌نمایی ${faNum(pct)} درصد`;
}

/* Which of the three fitting buttons is the current one. */
function paintZoomModes() {
  const mode = App.viewer.zoom.mode;
  const map = { fit: '#lbZoomFit', width: '#lbZoomWidth', actual: '#lbZoomActual' };
  Object.entries(map).forEach(([key, sel]) => {
    const btn = $(sel);
    if (!btn) return;
    btn.classList.toggle('is-active', mode === key);
    btn.setAttribute('aria-pressed', String(mode === key));
  });
}

function zoomStep(dir, anchor) {
  const z = App.viewer.zoom;
  if (!z.natW) return;
  const factor = dir > 0 ? 1.25 : 1 / 1.25;
  setZoom(z.scale * factor, anchor || centerAnchor());
}

function applyFitZoom(anchor) {
  const z = App.viewer.zoom;
  if (!z.natW) return;
  z.fit = computeFitScale();
  setZoom(z.fit, anchor || centerAnchor());
}

function applyWidthZoom(anchor) {
  const z = App.viewer.zoom;
  if (!z.natW) return;
  z.fitW = computeWidthScale();
  setZoom(z.fitW, anchor || centerAnchor());
}

/* Zoom so a region of the plate — given in the plate's own pixels — fills the
   pane and sits in the middle of it. */
function zoomToRect(rect) {
  const box = viewerBox();
  const z = App.viewer.zoom;
  if (!box || !z.natW || !z.natH || !rect || !rect.w || !rect.h) return;
  const scale = clamp(Math.min(box.contentW / rect.w, box.contentH / rect.h), zoomFloor(), ZOOM_MAX_SCALE);
  setZoom(scale);
  /* Read where the stage actually landed after the zoom (the board wrapper
     may have margins) instead of assuming it was centred. */
  const stage = $('#lbImageStage');
  if (!stage) return;
  const sr = stage.getBoundingClientRect();
  const cr = box.scroller.getBoundingClientRect();
  box.scroller.scrollLeft += (sr.left + (rect.x + rect.w / 2) * z.scale) - (cr.left + box.padL + box.contentW / 2);
  box.scroller.scrollTop += (sr.top + (rect.y + rect.h / 2) * z.scale) - (cr.top + box.padT + box.contentH / 2);
  const status = $('#lbStatus');
  if (status) status.textContent = 'ناحیهٔ انتخابی بزرگ شد';
}

/* The annotation layer owns the pointers while a tool is in hand, so its
   two-finger gesture has to drive the same zoom path the viewer uses. These
   three are the whole contract: scale around a screen point, pan by a screen
   delta, and read the resulting scale after the clamp. */
window.RTM_VIEWER = {
  setZoom,
  panBy: panViewer,
  getScale: () => App.viewer.zoom.scale,
};
/* The notes panel's «پرش به نشانه» calls this through the global lookup; it was
   never exposed, so choosing a note in a zoomed-out plate did nothing. */
window.zoomToRect = zoomToRect;

/* The plate is only "shown" once this runs: it lifts the loading veil and lets
   the zoom code measure the image. Both the `load` event and renderViewer's own
   already-complete check go through here, so neither path can leave the veil up. */
function settleViewerImage() {
  const load = $('#lbLoading');
  if (load) load.hidden = true;
  $('#lbImageStage')?.classList.remove('is-void');
  initViewerForImage();
  /* The mark layer measures the plate in its own pixels, so it can only be laid
     out once the image has actually decoded. */
  if (window.Anno) Anno.renderLayer();
}

function showViewerPlateMissing() {
  const load = $('#lbLoading');
  if (load) {
    load.hidden = false;
    load.innerHTML = `${icon('image-off')}<span>این تصویر روی این دستگاه نیست</span>
      <small>فایلش هرگز دانلود نشده — OCR-11 آن را دنبال می‌کند.</small>`;
  }
  const meta = $('#lbImageMeta');
  if (meta) meta.insertAdjacentHTML('beforeend', ` <span class="tag is-noise">${icon('warning')} تصویر در دسترس نیست</span>`);
  const label = $('#lbZoomLevel');
  if (label) label.textContent = '—';
}

function initViewerForImage() {
  const img = $('#lbImage');
  const z = App.viewer.zoom;
  if (!img || !img.naturalWidth) return;
  z.natW = img.naturalWidth;
  z.natH = img.naturalHeight;
  z.fit = computeFitScale();
  z.fitW = computeWidthScale();
  const pref = App.settings.imageFit;
  if (pref === 'actual') setZoom(1);
  else if (pref === 'width') setZoom(z.fitW);
  else setZoom(z.fit);
}

function handleViewerResize() {
  const z = App.viewer.zoom;
  if (!z.natW) return;
  const keep = z.scale;
  z.fit = computeFitScale();
  z.fitW = computeWidthScale();
  if (z.mode === 'fit') { applyFitZoom(); return; }
  if (z.mode === 'width') { applyWidthZoom(); return; }
  setZoom(keep);
}

function viewerFullscreenActive() {
  return !!document.fullscreenElement || $('#lightbox')?.classList.contains('lb-full');
}

function paintFullscreenButton(on) {
  const btn = $('#lbFullscreen');
  if (btn) {
    btn.innerHTML = icon(on ? 'minimize' : 'maximize');
    btn.setAttribute('aria-pressed', String(on));
  }
  handleViewerResize();
}

/* The expanded shell is applied immediately so the button answers at once; the
   real Fullscreen API is requested on top of it. If the browser refuses, the
   expanded shell is already there, so nothing jumps or breaks. */
function toggleViewerFullscreen() {
  const lb = $('#lightbox');
  if (!lb) return;
  if (viewerFullscreenActive()) {
    lb.classList.remove('lb-full');
    paintFullscreenButton(false);
    if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
    return;
  }
  lb.classList.add('lb-full');
  paintFullscreenButton(true);
  if (lb.requestFullscreen) lb.requestFullscreen({ navigationUI: 'hide' }).catch(() => {});
}

/* Drag-to-pan for a scrollable surface that shows plates — the marginal column
   on a post page had the same complaint as the viewer: the only way to move it
   was the hairline bar at its edge.
   Deliberately not shared with setupViewerGestures: the viewer's loop also owns
   pinch, the shift-marquee and a zoom model to keep in step, and pulling the two
   together would put an untested refactor in the path of a working gesture.
   What is copied is the rule that made the difference — one scroll write per
   animation frame, and no layout read inside the move loop. */
function enableDragScroll(el) {
  if (!el || el.dataset.dragPan) return;
  el.dataset.dragPan = '1';
  let drag = null;
  let raf = 0;

  const flush = () => {
    raf = 0;
    if (!drag) return;
    el.scrollLeft = drag.left;
    el.scrollTop = drag.top;
  };

  const onMove = (e) => {
    if (!drag || drag.id !== e.pointerId) return;
    drag.left = drag.startLeft - (e.clientX - drag.x);
    drag.top = drag.startTop - (e.clientY - drag.y);
    const moved = Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y);
    if (moved > 4) el.classList.add('is-panning');
    if (!raf) raf = requestAnimationFrame(flush);
  };

  const end = (e) => {
    if (!drag || drag.id !== e.pointerId) return;
    if (raf) { cancelAnimationFrame(raf); flush(); }
    el.classList.remove('is-panning');
    drag = null;
  };

  el.addEventListener('pointerdown', (e) => {
    // Touch already pans natively here; capturing it would move the column twice.
    if (e.pointerType === 'touch') return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (e.target.closest('input, textarea, select, a, button')) return;
    // One read per press, never inside the move loop.
    if (el.scrollHeight - el.clientHeight < 2 && el.scrollWidth - el.clientWidth < 2) return;
    drag = {
      id: e.pointerId, x: e.clientX, y: e.clientY,
      startLeft: el.scrollLeft, startTop: el.scrollTop,
      left: el.scrollLeft, top: el.scrollTop,
    };
  });
  // Window-scoped rather than setPointerCapture: capture retargets the eventual
  // click to the captured element, which would stop a plate from opening.
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', end);
  window.addEventListener('pointercancel', end);
}

function setupViewerGestures() {
  const scroller = $('#lbImageScroll');
  if (!scroller || scroller.dataset.bound) return;
  scroller.dataset.bound = '1';
  const pointers = new Map();
  let drag = null;
  let pinch = null;

  /* Shift-draws a box and zooms into exactly that box — the direct answer to
     "I want to see this corner properly", which wheel-zoom only gets to by
     accident. The rectangle is drawn in the stage's own (already scaled) pixels,
     so it tracks the plate while the reader drags. */
  let marquee = null;
  let draft = null;

  /* A drag writes exactly one scroll position per animation frame, and reads no
     layout while doing it. Asking viewerCanPan() inside pointermove ran
     getComputedStyle + clientWidth on every one of the ~120 move events a second
     — a forced reflow wedged between two scroll writes, which is what made the
     plate arrive in lumps instead of following the hand. Whether a pan is
     possible at all is already kept in the `can-pan` class by setZoom(). */
  let dragRaf = 0;
  let dragTarget = null;
  const flushDrag = () => {
    dragRaf = 0;
    if (!dragTarget) return;
    scroller.scrollLeft = dragTarget.left;
    scroller.scrollTop = dragTarget.top;
    dragTarget = null;
  };

  const paintMarquee = () => {
    if (!marquee || !draft) return;
    marquee.style.left = Math.min(draft.x0, draft.x1) + 'px';
    marquee.style.top = Math.min(draft.y0, draft.y1) + 'px';
    marquee.style.width = Math.abs(draft.x1 - draft.x0) + 'px';
    marquee.style.height = Math.abs(draft.y1 - draft.y0) + 'px';
  };

  const startMarquee = (e) => {
    const stage = $('#lbImageStage');
    if (!stage) return;
    const r = stage.getBoundingClientRect();
    // Start inside the plate: a shift-press on the margin should not frame the
    // padding as part of the chart.
    const ox = clamp(e.clientX, r.left, r.right) - r.left;
    const oy = clamp(e.clientY, r.top, r.bottom) - r.top;
    draft = { x0: ox, y0: oy, x1: ox, y1: oy };
    marquee = document.createElement('div');
    marquee.className = 'marquee';
    stage.appendChild(marquee);
    paintMarquee();
  };

  const endMarquee = () => {
    if (!marquee || !draft) return;
    const z = App.viewer.zoom;
    const w = Math.abs(draft.x1 - draft.x0);
    const h = Math.abs(draft.y1 - draft.y0);
    const x = Math.min(draft.x0, draft.x1);
    const y = Math.min(draft.y0, draft.y1);
    marquee.remove();
    marquee = null;
    draft = null;
    // A click is not a choice: under 24 px on screen the reader meant to pan or
    // to open, not to frame a region.
    if (w < 24 || h < 24 || !z.natW || !z.scale) return;
    zoomToRect({ x: x / z.scale, y: y / z.scale, w: w / z.scale, h: h / z.scale });
  };

  scroller.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (e.target.closest('button, a')) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1 && e.shiftKey && App.viewer.zoom.natW) {
      drag = null;
      startMarquee(e);
      try { scroller.setPointerCapture(e.pointerId); } catch {}
      e.preventDefault();
    } else if (pointers.size === 1) {
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, left: scroller.scrollLeft, top: scroller.scrollTop, time: Date.now() };
      try { scroller.setPointerCapture(e.pointerId); } catch {}
    } else if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinch = { dist: Math.hypot(a.x - b.x, a.y - b.y), scale: App.viewer.zoom.scale };
      drag = null;
    }
  });

  scroller.addEventListener('pointermove', (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (marquee && draft && pointers.size === 1) {
      const stage = $('#lbImageStage');
      if (!stage) return;
      const r = stage.getBoundingClientRect();
      draft.x1 = e.clientX - r.left;
      draft.y1 = e.clientY - r.top;
      paintMarquee();
      e.preventDefault();
      return;
    }
    if (pinch && pointers.size >= 2) {
      const [a, b] = [...pointers.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch.dist > 16) {
        setZoom(pinch.scale * (dist / pinch.dist), { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
        e.preventDefault();
      }
      return;
    }
    if (!drag || drag.id !== e.pointerId) return;
    if (!scroller.classList.contains('can-pan')) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    dragTarget = { left: drag.left - dx, top: drag.top - dy };
    if (!dragRaf) dragRaf = requestAnimationFrame(flushDrag);
    scroller.classList.add('is-dragging');
    e.preventDefault();
  });

  const endPointer = (e) => {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch = null;
    if (marquee) { endMarquee(); return; }
    if (!drag || drag.id !== e.pointerId) return;
    scroller.classList.remove('is-dragging');
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    const quick = Date.now() - drag.time < 600;
    if (!viewerCanPan() && quick && Math.abs(dx) > 60 && Math.abs(dy) < 50) moveViewer(dx < 0 ? 1 : -1);
    drag = null;
  };
  scroller.addEventListener('pointerup', endPointer);
  scroller.addEventListener('pointercancel', endPointer);
  // Belt to the draggable="false" braces: a gesture that starts on the padding
  // or on a marker chip must not be allowed to leave the pane as a file drag.
  scroller.addEventListener('dragstart', (e) => e.preventDefault());

  /* Wheel zoom follows the model every serious image viewer uses (panzoom,
     React Flow, Fancybox): the wheel scales around the pointer, the drag pans,
     and the page behind never moves. Ctrl/Cmd joins the same path because that
     is how every browser reports a trackpad pinch. Shift keeps its native
     meaning (horizontal pan), and a reader who would rather wheel-pan picks
     «پیمایش» in the personalisation drawer. Nothing here asks whether content
     overflows: the board margin made that answer useless, and the gesture the
     reader expects over a picture is zoom. */
  scroller.addEventListener('wheel', (e) => {
    const z = App.viewer.zoom;
    if (!z.natW) return;
    if (e.shiftKey && !e.ctrlKey && !e.metaKey) return;
    if (!(e.ctrlKey || e.metaKey || App.settings.wheel === 'zoom')) return;
    if (!e.deltaY) return;
    e.preventDefault();
    /* A wheel notch is 100 px, a line-mode notch is lines, and a page-mode
       notch is a viewport; normalise before the exponential so the same
       physical gesture always scales by the same amount. The clamp keeps a
       runaway delta (some mice send thousands) from jumping several steps. */
    const box = viewerBox();
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? (box ? box.contentH : 800) : 1;
    const px = clamp(e.deltaY * unit, -600, 600);
    const factor = clamp(Math.exp(-px * 0.0018), 0.5, 2);
    setZoom(z.scale * factor, { x: e.clientX, y: e.clientY });
  }, { passive: false });
}

function plateImage(plateEl) {
  const jid = plateEl.dataset.jid || (App.currentJournal && App.currentJournal.id);
  const journal = (App.postDetail.journal && App.postDetail.journal.id === jid) ? App.postDetail.journal : journalById(jid);
  if (!journal || !Array.isArray(journal.images)) return null;
  return journal.images.find(im => im.k === plateEl.dataset.key) || null;
}

function trapFocus(e, container) {
  const focusables = $$('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', container)
    .filter(el => !el.disabled && el.offsetParent !== null);
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

/* ============================== search ============================== */

const onSearchInput = debounce(() => {
  const input = $('#globalSearch');
  const q = input.value.trim();
  const clear = $('#searchClear');
  if (clear) clear.hidden = !q;
  if (!q) { if (App.currentView === 'search') go(''); return; }
  if (q.length < 2) {
    showView('search');
    $('#searchTitle').textContent = 'جستجو';
    $('#searchSubtitle').textContent = 'دو حرف به بالا';
    $('#searchStatus').textContent = '';
    $('#searchResults').innerHTML = '';
    $('#searchMore').hidden = true;
    return;
  }
  replaceHash('search/' + encodeURIComponent(q));
  runSearch(q);
}, 260);

/* ============================== search ============================== */

function searchShardUrl(id) {
  return 'data/search/' + encodeURIComponent(id) + '.json';
}

function ensureSearchShard(id) {
  if (App.search.shards[id]) return Promise.resolve(App.search.shards[id]);
  return cachedLoad('search_' + id, () => loadJson(searchShardUrl(id)).then(data => {
    const shard = data && Array.isArray(data.posts) ? data : { posts: [] };
    App.search.shards[id] = shard;
    return shard;
  }));
}

/* The small journals answer first, so the reader sees real results while the
   two large books are still arriving. */
function searchJournalOrder() {
  return (App.index.journals || []).slice()
    .sort((a, b) => (a.posts || 0) - (b.posts || 0) || String(a.name).localeCompare(String(b.name), 'en'));
}

async function runSearch(q) {
  q = String(q || '').trim();
  const input = $('#globalSearch');
  if (input && input.value !== q) input.value = q;
  const clear = $('#searchClear');
  if (clear) clear.hidden = !q;
  showView('search');
  const token = ++App.search.token;
  App.search.q = q;
  App.search.postLimit = 30;
  $('#searchTitle').innerHTML = q ? `جستجو: <bdi dir="auto">${esc(q)}</bdi>` : 'جستجو در آرشیو';
  $('#searchSubtitle').textContent = 'در متن پست‌ها و ترجمهٔ فارسی آن‌ها';
  if (!q || q.length < 2) {
    App.search.loading = false;
    App.search.posts = [];
    $('#searchStatus').textContent = 'دو حرف به بالا';
    $('#searchResults').innerHTML = '';
    $('#searchMore').hidden = true;
    return;
  }
  App.search.loading = true;
  App.search.error = '';
  App.search.posts = [];
  App.search.loaded = 0;
  App.search.failed = 0;
  const ids = searchJournalOrder().map(j => j.id);
  App.search.total = ids.length;
  $('#searchStatus').innerHTML = `<span class="spinner"></span> جستجو در ${faNum(ids.length)} دفتر…`;
  $('#searchResults').innerHTML = '';
  $('#searchMore').hidden = true;
  const nq = norm(q);
  let timer = 0;
  const paint = () => {
    if (timer) return;
    timer = setTimeout(() => {
      timer = 0;
      if (token === App.search.token) renderSearchResults();
    }, 90);
  };
  await Promise.all(ids.map(id => ensureSearchShard(id).then(shard => {
    if (token !== App.search.token) return;
    for (const row of (shard.posts || [])) {
      const text = row[3] || '';
      const fa = row[4] || '';
      if (norm(text).includes(nq) || (fa && norm(fa).includes(nq))) App.search.posts.push(row);
    }
    App.search.loaded++;
    paint();
  }).catch(() => {
    if (token !== App.search.token) return;
    App.search.failed++;
    App.search.loaded++;
    paint();
  })));
  if (token !== App.search.token) return;
  App.search.loading = false;
  if (!App.search.posts.length && ids.length && App.search.failed === ids.length) {
    App.search.error = 'هیچ دفتری خوانده نشد؛ اتصال را بررسی کنید.';
    $('#searchStatus').textContent = '';
    $('#searchResults').innerHTML = errorState('جستجو انجام نشد', App.search.error);
    $('#searchMore').hidden = true;
    return;
  }
  renderSearchResults();
}

function renderSearchResults() {
  const posts = App.search.posts || [];
  const q = App.search.q;
  const partial = !!App.search.loading;
  const progress = partial ? ` · ${faNum(App.search.loaded)}/${faNum(App.search.total)} دفتر` : '';
  if (partial) {
    $('#searchStatus').innerHTML = posts.length
      ? `<span class="spinner"></span> ${faNum(posts.length)} نتیجه تا اینجا${progress}`
      : `<span class="spinner"></span> جستجو در دفترها${progress}`;
  } else if (posts.length) {
    const failed = App.search.failed ? ` · ${faNum(App.search.failed)} دفتر خوانده نشد` : '';
    $('#searchStatus').innerHTML = `${faNum(posts.length)} پست برای «<bdi dir="auto">${esc(q)}</bdi>»${failed}`;
  } else {
    $('#searchStatus').innerHTML = `${icon('info')} چیزی برای «<bdi dir="auto">${esc(q)}</bdi>» پیدا نشد.`;
  }
  let html = '';
  if (posts.length) {
    const list = posts.slice(0, App.search.postLimit);
    html += `<div class="rule-head"><h2>پست‌ها</h2><span class="rule-head-note">${partial ? 'در حال جستجو' : faNum(posts.length) + ' نتیجه'}</span></div>`;
    html += list.map(row => {
      const [jid, page, pid, text, fa] = row;
      const hitFa = !!fa && norm(fa).includes(norm(q));
      const hitEn = norm(text).includes(norm(q));
      const shown = hitFa ? fa : text;
      const shownSnippet = snippet(shown, q);
      const enSnippet = hitFa && hitEn && text !== fa ? snippet(text, q, 180) : '';
      return `<a class="result" href="${postHref(jid, page, pid)}">
        <div class="result-aside"><b>${metaIsolate(esc(journalName(jid)))}</b><span class="sep">·</span>ص ${faNum(page)}<br><span dir="ltr">${esc(pidLabel({ id: pid }))}</span></div>
        <div class="result-main">
          <div class="result-title" dir="${hitFa ? 'rtl' : 'auto'}" lang="${hitFa ? 'fa' : 'en'}">${highlight(snippet(shown, q, 90), q)}</div>
          <div class="result-snippet" dir="${hitFa ? 'rtl' : 'auto'}" lang="${hitFa ? 'fa' : 'en'}">${highlight(shownSnippet, q)}</div>
          ${enSnippet ? `<div class="result-line">${highlight(enSnippet, q)}</div>` : ''}
        </div>
      </a>`;
    }).join('');
  }
  if (!html && !partial) {
    html = `<div class="empty-state">${icon('search')}<h3>نتیجه‌ای نیست</h3>
      <p>عبارت دیگری را امتحان کنید؛ مثلاً «liquidity» یا «نقدینگی».</p></div>`;
  }
  $('#searchResults').innerHTML = html;
  paintMoreRow('#searchMore', Math.max(0, posts.length - App.search.postLimit), 'پست');
}

/* ============================== all posts ============================== */

function postsShardUrl(id) {
  return 'data/posts/' + encodeURIComponent(id) + '.json';
}

function ensurePostsShard(id) {
  if (App.all.shards[id]) return Promise.resolve(App.all.shards[id]);
  return cachedLoad('posts_' + id, () => loadJson(postsShardUrl(id)).then(rows => {
    App.all.shards[id] = Array.isArray(rows) ? rows : [];
    return App.all.shards[id];
  }));
}

/* Shards finish in whatever order the network gives them; rebuild the flat
   list in journal order so the ledger never reshuffles under the reader. */
function rebuildAllRows() {
  const rows = [];
  for (const journal of (App.index.journals || [])) {
    const list = App.all.shards[journal.id];
    if (!list) continue;
    for (const row of list) rows.push(row);
  }
  App.all.rows = rows;
}

function scheduleAllRender() {
  if (App.all.renderTimer) return;
  App.all.renderTimer = setTimeout(() => {
    App.all.renderTimer = 0;
    if (App.currentView === 'all') renderAllPosts();
  }, 140);
}

async function openAll() {
  showView('all');
  syncActiveNav();
  const select = $('#allJournalSelect');
  if (select && !select.options.length) {
    /* Journals and subject threads are separate lists, exactly as on the forum:
       the opening option never mixes the two. */
    const topics = orderedTopics();
    select.innerHTML = `<option value="all">همهٔ دفترها</option>`
      + `<optgroup label="دفترها">` + orderedJournals()
        .map(j => `<option value="${esc(j.id)}">${esc(j.name)}</option>`).join('') + `</optgroup>`
      + (topics.length ? `<optgroup label="موضوع‌های آموزشی">` + topics
        .map(j => `<option value="${esc(j.id)}">${esc(j.name)}</option>`).join('') + `</optgroup>` : '');
    select.value = App.all.filter;
  }
  if (App.all.rows && !App.all.loading) { renderAllPosts(); return; }
  if (App.all.loading) return;
  App.all.loading = true;
  App.all.error = '';
  App.all.rows = [];
  App.all.loaded = 0;
  App.all.failed = 0;
  const ids = (App.index.journals || []).map(j => j.id);
  App.all.total = ids.length;
  $('#allPosts').innerHTML = `<div class="loading-row"><span class="spinner"></span> فهرست ${faNum(App.index.stats?.posts || 0)} پست بارگذاری می‌شود…</div>`;
  $('#allMore').hidden = true;
  renderAllPosts();
  await Promise.all(ids.map(id => ensurePostsShard(id).then(() => {
    App.all.loaded++;
    rebuildAllRows();
    scheduleAllRender();
  }).catch(() => {
    App.all.failed++;
    App.all.loaded++;
    scheduleAllRender();
  })));
  App.all.loading = false;
  if (ids.length && App.all.failed === ids.length) {
    App.all.error = 'هیچ دفتری خوانده نشد؛ اتصال را بررسی کنید.';
    $('#allPosts').innerHTML = errorState('فهرست پست‌ها بارگذاری نشد', App.all.error);
    return;
  }
  renderAllPosts();
}

function renderAllPosts() {
  const all = App.all.rows || [];
  const journal = App.all.filter;
  const text = norm(App.all.text);
  const savedKeys = new Set(App.bookmarks.map(b => bookmarkKey(b.jid, b.pid)));
  /* "همهٔ دفترها" means the journals: a subject thread shows up only when it is
     picked from the topics group, or through search. */
  const journalIds = new Set(orderedJournals().map(j => j.id));
  let rows = journal === 'all'
    ? all.filter(row => journalIds.has(row[0]))
    : all.filter(row => row[0] === journal);
  if (App.all.savedOnly) rows = rows.filter(row => savedKeys.has(bookmarkKey(row[0], row[2])));
  if (text) {
    rows = rows.filter(row => norm((row[5] || '') + ' ' + (row[7] || '') + ' ' + (row[4] || '')).includes(text));
  }
  const list = rows.slice(0, App.all.limit);
  const loading = !!App.all.loading;
  const total = loading ? (App.index.stats?.posts || all.length) : rows.length;
  const unitCount = journal === 'all' ? journalIds.size : 1;
  const unitWord = journal === 'all' ? 'دفتر' : (isTopic(journalById(journal)) ? 'موضوع' : 'دفتر');
  $('#allSubtitle').innerHTML = `${faNum(total)} پست در ${faNum(unitCount)} ${unitWord} · نشان‌شده‌ها ${faNum(App.bookmarks.length)}${loading ? ' · در حال بارگذاری…' : ''}`;
  $('#allCount').textContent = loading
    ? `${faNum(list.length)} از ${faNum(rows.length)} تا اینجا · ${faNum(App.all.loaded)}/${faNum(App.all.total)} دفتر`
    : `${faNum(list.length)} از ${faNum(rows.length)} نمایش داده می‌شود`;
  const box = $('#allPosts');
  if (!list.length) {
    box.innerHTML = loading
      ? `<div class="loading-row"><span class="spinner"></span> فهرست پست‌ها بارگذاری می‌شود… (${faNum(App.all.loaded)}/${faNum(App.all.total)} دفتر)</div>`
      : `<div class="empty-state">${icon('list')}<h3>پستی نیست</h3><p>پالایش یا عبارت جستجو را تغییر دهید.</p></div>`;
    $('#allMore').hidden = true;
    return;
  }
  const langMode = cardLanguage();
  box.innerHTML = list.map(row => {
    const [jid, page, pid, date, author, excerpt, imgCount, fa] = row;
    const showFa = langMode !== 'en' && !!fa;
    const body = langMode === 'en' ? (excerpt || fa || '') : (fa || excerpt || '');
    const saved = savedKeys.has(bookmarkKey(jid, pid));
    const href = postHref(jid, page, pid);
    return `<a class="result" href="${href}">
      <div class="result-aside">
        <b dir="auto">${esc(journalName(jid))}</b>
        <span>ص ${faNum(page)}</span>
        <span dir="ltr">${esc(pidLabel({ id: pid }))}</span>
        ${imgCount ? `<span>${icon('image')} ${faNum(imgCount)}</span>` : ''}
      </div>
      <div class="result-main">
        <div class="byline"><bdi dir="auto">${esc(author || '—')}</bdi>${date ? `<span class="mono" dir="ltr">${esc(date)}</span>` : ''}${fa ? `<span class="tag is-gloss">${icon('translate')} ترجمهٔ فارسی</span>` : ''}</div>
        <div class="result-snippet" dir="${showFa ? 'rtl' : 'auto'}" lang="${showFa ? 'fa' : 'en'}">${text ? highlight(snippet(body, App.all.text, 220), App.all.text) : esc(body)}</div>
      </div>
      <span class="result-side" title="${saved ? 'نشان‌شده' : 'بدون نشان'}">${icon(saved ? 'bookmark-on' : 'bookmark')}</span>
    </a>`;
  }).join('');
  paintMoreRow('#allMore', rows.length - list.length, 'پست');
  syncLangTabs();
}

/* ============================== gallery ============================== */

async function openGallery() {
  showView('gallery');
  syncActiveNav();
  const sel = $('#galleryJournal');
  if (sel && !sel.options.length) {
    sel.innerHTML = orderedJournals()
      .map(j => `<option value="${esc(j.id)}">${esc(j.name)}</option>`).join('');
  }
  if (!App.gallery.journalId) App.gallery.journalId = (App.currentJournal && App.currentJournal.id) || App.index.journals[0]?.id || '';
  if (sel) sel.value = App.gallery.journalId;
  await loadGalleryJournal();
}

async function loadGalleryJournal() {
  const jid = App.gallery.journalId;
  if (!jid) return;
  App.gallery.loading = true;
  App.gallery.error = '';
  $('#galleryGrid').innerHTML = `<div class="loading-row"><span class="spinner"></span> تصویرها بارگذاری می‌شوند…</div>`;
  $('#galleryCount').textContent = '';
  $('#galleryMore').hidden = true;
  try {
    const journal = await ensureJournalImages(jid);
    App.gallery.currentJournal = journal;
    App.gallery.items = journal.images.slice();
    App.gallery.loading = false;
    renderGallery();
  } catch (e) {
    App.gallery.loading = false;
    App.gallery.error = e.message;
    $('#galleryGrid').innerHTML = errorState('تابلوی تصاویر بارگذاری نشد', e.message);
  }
}

function renderGallery() {
  const journal = App.gallery.currentJournal;
  if (!journal) return;
  const seen = new Set();
  const all = [];
  for (const im of App.gallery.items) {
    if (seen.has(im.k)) continue;
    seen.add(im.k);
    if (!isTinyPlate(im)) all.push(im);
  }
  const list = all.slice(0, App.gallery.limit);
  $('#galleryCount').innerHTML = `${faNum(list.length)} از ${faNum(all.length)} تصویرِ یکتا در <bdi dir="auto">${esc(journal.name)}</bdi>`;
  const grid = $('#galleryGrid');
  if (!list.length) {
    grid.innerHTML = `<div class="empty-state">${icon('image')}<h3>تصویری نیست</h3>
      <p>این دفتر تصویری ندارد.</p></div>`;
    $('#galleryMore').hidden = true;
    return;
  }
  grid.innerHTML = list.map(im => {
    const src = im.t || im.f || '';
    const name = im.o || 'تصویر';
    const ar = im.w && im.h ? `${im.w} / ${im.h}` : 'auto';
    return `<div class="contact-cell">
      <a class="plate" href="#/i/${encodeURIComponent(journal.id)}/${im.p || 1}/${encodeURIComponent(im.k)}"
        data-gallery-key="${esc(im.k)}" aria-label="${esc(name)}">
        <span class="plate-frame">
          <span class="plate-media" style="--ar: ${esc(ar)}">
            ${src ? `<img src="${esc(src)}" alt="${esc(name)}" loading="lazy" decoding="async" draggable="false" data-thumb="${esc(src)}">` : ''}
          </span>
        </span>
        <span class="contact-cap">
          <span class="cap-page">ص ${faNum(im.p || 1)}</span>
        </span>
      </a>
    </div>`;
  }).join('');
  wirePlateImages(grid);
  paintMoreRow('#galleryMore', all.length - list.length, 'تصویر');
}

/* ============================== saved ============================== */

function openSaved() {
  showView('saved');
  syncActiveNav();
  renderSavedView();
}

/* ============================== my notes ============================== */

function openNotes(query) {
  showView('notes');
  syncActiveNav();
  const input = $('#notesFilter');
  if (input && query && input.value !== query) input.value = query;
  ensureAnnotate().then(ok => {
    if (ok) Anno.renderNotesView(input ? input.value : '');
  });
}

function setupNotesView() {
  $('#notesFilter')?.addEventListener('input', () => {
    if (window.Anno) Anno.renderNotesView($('#notesFilter').value);
  });
  $('#notesBackup')?.addEventListener('click', () => { if (window.Anno) Anno.backupAll(); });
  $('#notesList')?.addEventListener('click', (e) => {
    const plate = e.target.closest('[data-act="open-plate"]');
    if (!plate) return;
    e.preventDefault();
    openNotesPlate(plate.dataset.key, plate.dataset.jid, plate.dataset.pid, num(plate.dataset.page));
  });
}

/* A note row on the «یادداشت‌ها» page names a plate, but its journal has to be
   loaded before the viewer can page through anything. */
async function openNotesPlate(key, jid, pid, page) {
  /* The note names its own journal. Falling back to whatever journal happened
     to be open opened the right key in the wrong book — or nothing at all. */
  const meta = journalById(jid);
  if (!meta) { showToast('دفترِ این تصویر پیدا نشد'); return; }
  try {
    const journal = await ensureJournal(meta.id);
    App.currentPage = clamp(page || 1, 1, journal.pages || 1);
    await ensureJournalPage(meta.id, App.currentPage);
    /* The note carries the page it was taken on; if the archive moved that
       plate, the light image index still knows where it lives now. */
    if (!findImage(journal, key)) {
      await ensureJournalImages(meta.id);
      const im = findImage(journal, key);
      if (im && im.p) App.currentPage = clamp(im.p, 1, journal.pages || 1);
    }
    App.currentJournal = journal;
    App.currentPagePosts = (journal.posts || []).filter(p => (p.p ?? p.pageNum) === App.currentPage);
    openViewerForImage(key, pid);
  } catch (e) {
    showToast('تصویر این یادداشت باز نشد');
  }
}

function exportAllBookmarks() {
  if (!App.bookmarks.length) { showToast('فهرست نشان‌شده خالی است'); return; }
  let md = `# نشان‌شده‌ها — آرشیو RTM\n\n`;
  md += `${faNum(App.bookmarks.length)} پست، تاریخ خروجی: ${new Date().toLocaleDateString('fa-IR')}\n\n`;
  for (const b of App.bookmarks) {
    md += `## ${journalName(b.jid)} — ${b.number || b.pid}\n`;
    md += `- نویسنده: ${b.author || '—'}\n- تاریخ: ${b.date || '—'}\n- صفحه: ${b.page || 1}\n`;
    md += `- پیوند: ${location.href.split('#')[0]}${bookmarkHref(b)}\n\n`;
    if (b.excerpt) md += `${b.excerpt}\n\n`;
  }
  showToast(downloadText('rtm-bookmarks.md', md) ? 'فایل Markdown ذخیره شد' : 'ذخیره ممکن نشد');
}

function clearBookmarks() {
  if (!App.bookmarks.length) { showToast('فهرست خالی است'); return; }
  const n = App.bookmarks.length;
  if (!window.confirm(`همهٔ ${faNum(n)} نشان حذف شود؟ این کار برگشت‌پذیر نیست.`)) return;
  App.bookmarks = [];
  saveBookmarks();
  renderShelf();
  renderSavedView();
  syncBookmarkButtons();
  showToast(`${faNum(n)} نشان حذف شد`);
}

/* ============================== journal click ============================== */

function handleJournalClick(e) {
  const action = e.target.closest('[data-action]');
  if (!action) return;
  const journal = App.currentJournal;
  const plate = action.closest('.plate');
  const articleEl = action.closest('.article');
  const map = journal ? imageMap(journal) : new Map();
  const im = plate && journal ? map.get(plate.dataset.key) : null;
  const key = plate ? plate.dataset.key : '';
  const postId = plate ? plate.dataset.post : (articleEl ? articleEl.dataset.postId : '');
  switch (action.dataset.action) {
    case 'copy-post': {
      e.preventDefault();
      const pid = articleEl?.dataset.postId || postId;
      if (!journal || !pid) break;
      const base = location.href.split('#')[0];
      const href = `${base}${postHref(journal.id, App.currentPage, pid)}`;
      copyText(href).then(ok => showToast(ok ? 'پیوند پست کپی شد' : 'کپی ممکن نشد'));
      break;
    }
    case 'bookmark': {
      e.preventDefault();
      const jid = action.dataset.jid || (journal && journal.id);
      const pid = action.dataset.pid || postId;
      if (!jid || !pid) break;
      const post = journal ? (journal.posts || []).find(p => p.id === pid) : null;
      toggleBookmark(jid, post ? (post.p ?? App.currentPage) : App.currentPage, pid, {
        author: post?.a || '', date: post?.d || '', number: post?.n || pidLabel({ id: pid }), text: post?.t || '',
      });
      break;
    }
    case 'read-toggle': {
      e.preventDefault();
      const jid = action.dataset.jid || (journal && journal.id);
      const pid = action.dataset.pid || postId;
      if (!jid || !pid) break;
      const on = togglePostRead(jid, pid);
      action.classList.toggle('is-on', on);
      action.setAttribute('aria-pressed', String(on));
      action.title = on ? 'خوانده‌نشده علامت بزن' : 'خوانده‌شده علامت بزن';
      const ic = action.querySelector('svg use');
      if (ic) ic.setAttribute('href', on ? '#i-check' : '#i-eye');
      break;
    }
    case 'dismiss-reading': {
      e.preventDefault();
      const jid = action.dataset.jid;
      const pid = action.dataset.pid;
      if (!jid || !pid) break;
      const key = bookmarkKey(jid, pid);
      const before = App.reading.length;
      App.reading = App.reading.filter(r => bookmarkKey(r.jid, r.pid) !== key);
      if (App.reading.length !== before) {
        saveReading();
        showToast('از ادامهٔ مطالعه حذف شد');
      }
      renderShelf();
      renderReadingRail();
      break;
    }
    case 'unbookmark': {
      e.preventDefault();
      const jid = action.dataset.jid;
      const pid = action.dataset.pid;
      if (!jid || !pid) break;
      const existing = findBookmark(jid, pid);
      if (existing) {
        App.bookmarks = App.bookmarks.filter(b => b !== existing);
        saveBookmarks();
        showToast('از نشان‌شده‌ها برداشته شد');
      }
      syncBookmarkButtons();
      renderShelf();
      if (App.currentView === 'saved') renderSavedView();
      if (App.currentView === 'all') renderAllPosts();
      break;
    }
    case 'thread-jump': {
      e.preventDefault();
      threadJump(action);
      break;
    }
    case 'open-lightbox':
      e.preventDefault();
      openViewerForImage(key, postId);
      break;
    case 'figure':
      openViewerForImage(key, postId);
      break;
  }
}

function toggleFocusMode() {
  updateSetting('focus', !App.settings.focus);
  const on = !!App.settings.focus;
  showToast(on ? 'حالت تمرکز روشن شد' : 'حالت تمرکز خاموش شد');
  /* Real fullscreen when the browser allows it (the click is a user gesture);
     failure is silent — the CSS immersive layout still applies. */
  try {
    if (on && !document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else if (!on && document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
  } catch (_) { /* fullscreen unavailable */ }
}

/* ============================== events ============================== */

function setupEvents() {
  const jf = $('#journalFilter');
  if (jf) {
    jf.addEventListener('input', () => applyRailFilter(jf.value));
    jf.addEventListener('search', () => applyRailFilter(jf.value));
  }

  const search = $('#globalSearch');
  search?.addEventListener('input', onSearchInput);
  search?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const q = search.value.trim();
      if (q.length >= 2) {
        replaceHash('search/' + encodeURIComponent(q));
        runSearch(q);
        setSearchOpen(false);
      }
    }
    if (e.key === 'Escape') { search.value = ''; $('#searchClear').hidden = true; setSearchOpen(false); go(''); search.blur(); }
  });
  $('#searchClear')?.addEventListener('click', () => {
    search.value = '';
    $('#searchClear').hidden = true;
    setSearchOpen(false);
    go('');
    search.focus();
  });

  const posts = $('#journalPosts');
  if (posts) {
    posts.addEventListener('click', handleJournalClick);
    posts.addEventListener('keydown', plateKeyActivate);
  }
  enableDragScroll($('#postDetailMedia'));
  $('#shelfWrap')?.addEventListener('click', handleJournalClick);
  $('#savedList')?.addEventListener('click', handleJournalClick);

  $('#searchMore')?.addEventListener('click', () => {
    App.search.postLimit += 40;
    renderSearchResults();
  });

  $('#allMore')?.addEventListener('click', () => { App.all.limit += 40; renderAllPosts(); });
  $('#allJournalSelect')?.addEventListener('change', (e) => {
    App.all.filter = e.target.value;
    App.all.limit = 40;
    renderAllPosts();
  });
  $('#allSavedOnly')?.addEventListener('change', (e) => {
    App.all.savedOnly = e.target.checked;
    App.all.limit = 40;
    renderAllPosts();
  });
  $('#allJournalFilter')?.addEventListener('input', debounce((e) => {
    App.all.text = e.target.value;
    App.all.limit = 40;
    renderAllPosts();
  }, 220));

  $('#galleryJournal')?.addEventListener('change', (e) => {
    App.gallery.journalId = e.target.value;
    App.gallery.limit = 48;
    loadGalleryJournal();
  });
  $('#galleryMore')?.addEventListener('click', () => { App.gallery.limit += 48; renderGallery(); });

  $('#savedExport')?.addEventListener('click', exportAllBookmarks);
  $('#savedClear')?.addEventListener('click', clearBookmarks);

  $('#themeBtn')?.addEventListener('click', () => updateSetting('lamp', !App.settings.lamp));
  $('#dayBtn')?.addEventListener('click', () => updateSetting('theme', App.settings.theme === 'dark' ? 'paper' : 'dark'));
  $('#settingsBtn')?.addEventListener('click', openSettings);
  $('#menuBtn')?.addEventListener('click', toggleRail);
  $('#sideBackdrop')?.addEventListener('click', () => { App.railOpen = false; syncRail(); });
  $('#focusBtn')?.addEventListener('click', toggleFocusMode);
  $('#searchToggle')?.addEventListener('click', () => {
    if (document.body.classList.contains('search-open')) setSearchOpen(false);
    else focusSearch();
  });
  $('#paletteBtn')?.addEventListener('click', () => openPalette());

  /* Compact chrome. An IntersectionObserver on a sentinel near the top is used
     instead of a scroll listener so nothing runs on the scroll thread. */
  const sentinel = $('#scrollSentinel');
  if (sentinel && window.IntersectionObserver) {
    new IntersectionObserver((entries) => {
      const visible = entries[0] ? entries[0].isIntersecting : true;
      document.body.classList.toggle('head-compact', App.settings.header === 'compact' && !visible);
      setMastVar();
    }, { threshold: 0 }).observe(sentinel);
  } else {
    window.addEventListener('scroll', updateHeaderState, { passive: true });
  }

  let barRaf = 0;
  let lastScrollY = window.scrollY;
  const updateBar = () => {
    barRaf = 0;
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    const p = max > 40 ? clamp(window.scrollY / max, 0, 1) : 0;
    const bar = $('#readingBar');
    if (bar) bar.style.setProperty('--p', p.toFixed(4));
    const y = window.scrollY;
    // The bar tucks away as the reader moves into the text and returns the
    // moment they come back up. Near the top it is always shown, so the page
    // never opens on a missing header.
    if (y > lastScrollY + 8) document.body.classList.add('head-hidden');
    else if (y < lastScrollY - 8 || y < 140) document.body.classList.remove('head-hidden');
    if (Math.abs(y - lastScrollY) > 8) lastScrollY = y;
  };
  window.addEventListener('scroll', () => { if (!barRaf) barRaf = requestAnimationFrame(updateBar); }, { passive: true });
  window.addEventListener('resize', () => {
    applyChrome();
    if (App.railOpen && !isRailLayout()) { App.railOpen = false; syncRail(); }
    if (!$('#lightbox')?.hidden) handleViewerResize();
    updateBar();
  }, { passive: true });
  updateBar();

  document.addEventListener('keydown', (e) => {
    const tag = (e.target && e.target.tagName || '').toLowerCase();
    const typing = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;
    const viewerOpen = !$('#lightbox')?.hidden;
    const paletteOpen = !$('#palette')?.hidden;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (paletteOpen) closePalette(); else openPalette();
      return;
    }
    if (paletteOpen) return;
    if (viewerOpen) return;
    if (!typing && e.key === '/') { e.preventDefault(); focusSearch(); return; }
    if (e.key === 'Escape') {
      if (!$('#settingsDrawer')?.hidden) { closeSettings(); return; }
      if (App.railOpen && isRailLayout()) { App.railOpen = false; syncRail(); return; }
    }
    if (!typing && e.key === 'm') { toggleRail(); return; }
    if (!typing && (e.key === 'f' || e.key === 'F')) { toggleFocusMode(); return; }
    if (!typing && (e.key === 't' || e.key === 'T')) { updateSetting('lamp', !App.settings.lamp); return; }
  });

  window.addEventListener('hashchange', route);
}

/* ============================== settings events ============================== */

/* Random discovery: pick a journal, a page inside it, then a post on that
   page. The chunks it needs are the same ones a deep link would load. */
async function goRandomPost() {
  const js = orderedJournals().filter(j => (j.posts || 0) > 0 && (j.pages || 0) > 0);
  if (!js.length) return;
  for (let tries = 0; tries < 4; tries++) {
    const j = js[Math.floor(Math.random() * js.length)];
    const page = 1 + Math.floor(Math.random() * j.pages);
    try {
      const journal = await ensureJournal(j.id);
      await ensureJournalPage(j.id, page);
      const posts = (journal.posts || []).filter(p => (p.p ?? p.pageNum) === page);
      if (!posts.length) continue;
      const post = posts[Math.floor(Math.random() * posts.length)];
      go(postHref(j.id, page, post.id));
      return;
    } catch { /* try another journal */ }
  }
  showToast('پستِ تصادفی پیدا نشد؛ دوباره تلاش کنید');
}

/* Personal backup: bookmarks, reading history, progress and settings in one
   JSON file. Nothing leaves the machine — the file is the user's to keep. */
function exportUserData() {
  const data = {
    v: 1,
    exportedAt: new Date().toISOString(),
    settings: App.settings,
    bookmarks: App.bookmarks,
    reading: App.reading,
    progress: App.progress,
  };
  const blob = new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'rtm-archive-data.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  showToast('فایل پشتیبان دانلود شد');
}

async function importUserData(e) {
  const f = e.target.files && e.target.files[0];
  e.target.value = '';
  if (!f) return;
  try {
    const data = JSON.parse(await f.text());
    if (!data || typeof data !== 'object') throw new Error('bad');
    if (Array.isArray(data.bookmarks)) { App.bookmarks = data.bookmarks.slice(0, 500); saveBookmarks(); }
    if (Array.isArray(data.reading)) { App.reading = data.reading.slice(0, 50); saveReading(); }
    if (data.progress && typeof data.progress === 'object') { App.progress = data.progress; saveProgress(); }
    if (data.settings && typeof data.settings === 'object') {
      App.settings = { ...DEFAULT_SETTINGS, ...data.settings };
      App.settings.fontSize = clamp(Number(App.settings.fontSize) || 15, 13, 24);
      App.settings.lamp = !!App.settings.lamp;
      App.settings.lampAuto = !!App.settings.lampAuto;
      App.settings.focus = !!App.settings.focus;
      saveSettings();
      applySettings();
      applyChrome();
    }
    syncBookmarkButtons();
    renderShelf();
    renderReadingRail();
    if (App.currentView === 'saved') renderSavedView();
    showToast('پشتیبان با موفقیت وارد شد');
  } catch {
    showToast('فایل معتبر نیست یا خوانده نشد');
  }
}

function setupSettings() {
  const drawer = $('#settingsDrawer');
  if (!drawer || drawer.dataset.bound) return;
  drawer.dataset.bound = '1';
  $('#settingsBackdrop')?.addEventListener('click', closeSettings);
  $('#drawerClose')?.addEventListener('click', closeSettings);
  drawer.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); closeSettings(); }
    if (e.key === 'Tab') trapFocus(e, drawer);
  });
  const segs = [
    ['setImageFit', 'imageFit', 'imagefit'],
    ['setWheel', 'wheel', 'wheel'],
    ['setHeader', 'header', 'header'],
    ['setSidebar', 'sidebar', 'sidebar'],
    ['setTheme', 'theme', 'base'],
    ['setLampTone', 'lampTone', 'lamptone'],
  ];
  for (const [id, settingKey, dataKey] of segs) {
    const box = $('#' + id);
    if (!box) continue;
    box.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn || !btn.dataset[dataKey]) return;
      if (settingKey === 'wheel') App.settings.wheelPicked = true;
      updateSetting(settingKey, btn.dataset[dataKey]);
    });
  }
  const range = $('#setFont');
  if (range) {
    range.addEventListener('input', () => {
      const v = clamp(parseInt(range.value, 10) || 15, 13, 24);
      App.settings.fontSize = v;
      $('#fontValue').textContent = faNum(v);
      document.documentElement.style.setProperty('--fs', (v + (lampOn() ? 2 : 0)) + 'px');
    });
    range.addEventListener('change', () => updateSetting('fontSize', App.settings.fontSize));
  }
  $('#setLight')?.addEventListener('change', (e) => updateSetting('lamp', e.target.checked));
  $('#setLampAuto')?.addEventListener('change', (e) => updateSetting('lampAuto', e.target.checked));
  $('#setSkim')?.addEventListener('change', (e) => updateSetting('skim', e.target.checked));
  $('#resetSettings')?.addEventListener('click', resetSettings);
  $('#exportData')?.addEventListener('click', exportUserData);
  $('#importData')?.addEventListener('click', () => $('#importFile')?.click());
  $('#importFile')?.addEventListener('change', importUserData);
  syncSettingsControls();
}

/* ============================== command palette ============================== */

const PALETTE_COMMANDS = [
  { icon: 'home', title: 'صفحهٔ نخست', sub: 'نمای کلی و دفترها', run: () => go('') },
  { icon: 'list', title: 'همهٔ پست‌ها', sub: 'دفتر به دفتر، صفحه به صفحه', run: () => go('all') },
  { icon: 'grid', title: 'تابلوی تصاویر', sub: 'شبکه‌ای از بندانگشتی‌های هر دفتر', run: () => go('gallery') },
  { icon: 'bookmark', title: 'نشان‌شده‌ها', sub: 'فهرست مطالعهٔ نشان‌شده', run: () => go('saved') },
  { icon: 'search', title: 'جستجو در آرشیو', sub: 'متن پست‌ها و تصویرها', run: () => focusSearch() },
  { icon: 'lamp', title: 'چراغ مطالعه', sub: 'حالت مطالعهٔ راحت: تم گرم، متن بزرگ‌تر، حرکت کمتر', toggle: 'lamp', run: () => updateSetting('lamp', !App.settings.lamp) },
  { icon: 'moon', title: 'تغییر تم', sub: 'کاغذ روشن یا تیره', run: () => updateSetting('theme', App.settings.theme === 'dark' ? 'paper' : 'dark') },
  { icon: 'image', title: 'کشفِ تصادفی', sub: 'یک پستِ رندوم از آرشیو', run: () => { goRandomPost(); } },
  { icon: 'focus', title: 'حالت تمرکز', sub: 'کم کردن عناصر دور متن', toggle: 'focus', run: toggleFocusMode },
  { icon: 'settings', title: 'تنظیمات نمایش', sub: 'زبان، اندازهٔ نوشته، سرستون', run: openSettings },
  { icon: 'reset', title: 'بازگشت به پیش‌فرض‌ها', sub: 'پاک کردن تنظیمات این مرورگر', run: resetSettings },
];

function setupPalette() {
  const box = $('#palette');
  if (!box || box.dataset.bound) return;
  box.dataset.bound = '1';
  $('#paletteBackdrop')?.addEventListener('click', closePalette);
  const input = $('#paletteInput');
  input?.addEventListener('input', () => renderPalette(input.value));
  $('#paletteList')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.palette-item');
    if (!btn) return;
    runPaletteItem(Number(btn.dataset.index));
  });
  input?.addEventListener('keydown', (e) => {
    const items = $$('.palette-item', $('#paletteList'));
    const activeIdx = items.findIndex(el => el.classList.contains('is-active'));
    if (e.key === 'ArrowDown') { e.preventDefault(); movePaletteItem(1, items, activeIdx); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); movePaletteItem(-1, items, activeIdx); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      const target = items[activeIdx >= 0 ? activeIdx : 0];
      if (target) runPaletteItem(Number(target.dataset.index));
    } else if (e.key === 'Escape') { e.preventDefault(); closePalette(); }
  });
}

function runPaletteItem(index) {
  const item = (App.paletteItems || [])[index];
  if (!item) return;
  closePalette();
  if (item.kind === 'journal') { go(`j/${encodeURIComponent(item.value)}/1`); return; }
  if (item.kind === 'search') { runSearch(item.value); return; }
  const cmd = PALETTE_COMMANDS.find(c => c.title === item.title);
  if (cmd) cmd.run();
}

function openPalette(seed = '') {
  const box = $('#palette');
  if (!box) return;
  App.paletteReturnFocus = document.activeElement;
  box.hidden = false;
  syncRail();
  const input = $('#paletteInput');
  input.value = seed;
  renderPalette(seed);
  setTimeout(() => input.focus(), 20);
}

function closePalette() {
  const box = $('#palette');
  if (!box || box.hidden) return;
  box.hidden = true;
  syncRail();
  if (App.paletteReturnFocus?.focus) App.paletteReturnFocus.focus();
}

function movePaletteItem(delta, items, activeIdx) {
  if (!items.length) return;
  const next = clamp((activeIdx < 0 ? (delta > 0 ? -1 : items.length) : activeIdx) + delta, 0, items.length - 1);
  items.forEach((el, i) => el.classList.toggle('is-active', i === next));
  items[next].scrollIntoView({ block: 'nearest' });
}

function renderPalette(q) {
  const list = $('#paletteList');
  if (!list) return;
  const nq = norm(q);
  const journals = orderedUnits();
  const items = [];
  if (nq.length >= 2) {
    items.push({ icon: 'search', title: `جستجوی «${q}»`, sub: 'در متن پست‌ها و تصویرها', kind: 'search', value: q });
  }
  for (const j of journals) {
    if (items.length >= 9) break;
    if (!nq || norm(j.name).includes(nq) || norm(j.title || '').includes(nq)) {
      items.push({ icon: 'journal', title: j.name, sub: `${isTopic(j) ? 'آموزش' : 'ژورنال'} · ${faNum(j.pages)} صفحه · ${faNum(j.posts)} پست`, kind: 'journal', value: j.id });
    }
  }
  for (const c of PALETTE_COMMANDS) {
    if (!nq || norm(c.title).includes(nq) || norm(c.sub || '').includes(nq)) {
      items.push({ icon: c.icon, title: c.title, sub: c.sub, kind: 'command', value: c.title });
    }
  }
  App.paletteItems = items.slice(0, 20);
  if (!App.paletteItems.length) {
    list.innerHTML = `<div class="palette-group"><span class="pi-sub">موردی نیست — عبارت را بنویسید و Enter بزنید تا در آرشیو جستجو شود.</span></div>`;
    return;
  }
  list.innerHTML = App.paletteItems.map((it, i) => `<button class="palette-item${i === 0 ? ' is-active' : ''}" type="button"
    role="option" data-index="${i}">
    <span class="pi-icon">${icon(it.icon)}</span>
    <span class="pi-main"><span class="pi-title" dir="auto">${esc(it.title)}</span><span class="pi-sub">${esc(it.sub || '')}</span></span>
    <span class="pi-kbd">${i === 0 ? '↵' : ''}</span>
  </button>`).join('');
}
