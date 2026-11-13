'use strict';

/* ============================================================
   RTM Journal Archive — annotation layer
   The reader's own ink on a plate: pins, notes, boxes, arrows, stamps and
   freehand marks, grouped by reading pass so a second or third look adds to
   the first instead of replacing it.

   Two rules hold this whole subsystem together:
   • Geometry is normalised to the plate (0…1 of its width and height). The
     same note lands in the same place on the thumbnail, the fitted plate, a
     zoomed plate, the baked copy and a re-downloaded file of different size.
   • The plate file is never modified. Marks are data; the marked picture is a
     derived copy written beside the original, on demand.
   ============================================================ */

const Anno = (function () {
  const DB_NAME = 'rtm_annotations';
  const DB_VERSION = 2;
  const SETS = 'sets';
  const KV = 'kv';
  const FILES = 'files';
  const SCHEMA = 1;
  const PREFS_KEY = 'rtm_annotate_prefs_v1';

  /* One row per instrument. The rail button, its shortcut, its Persian name,
     its title and the cursor it arms all come from here, so a tool cannot be
     added in the markup and forgotten by the keyboard (or the reverse). The
     physical code matters: on a Persian layout e.key is «د», not «n». */
  const TOOL_DEFS = [
    { id: 'select', name: 'برگزیدن', label: 'برگزیدن و جابه‌جایی', icon: 'cursor', letter: 'v', code: 'KeyV' },
    { id: 'note', name: 'یادداشت', label: 'یادداشتِ جعبه‌ای', icon: 'note', letter: 'n', code: 'KeyN' },
    { id: 'text', name: 'متن', label: 'متن آزاد', icon: 'type', letter: 't', code: 'KeyT' },
    { id: 'pin', name: 'شماره', label: 'شماره', icon: 'pin', letter: 'i', code: 'KeyI' },
    { id: 'rect', name: 'چارچوب', label: 'چارچوب', icon: 'box', letter: 'r', code: 'KeyR' },
    { id: 'ellipse', name: 'بیضی', label: 'بیضی', icon: 'circle', letter: 'o', code: 'KeyO' },
    { id: 'arrow', name: 'پیکان', label: 'پیکان', icon: 'arrow-anno', letter: 'a', code: 'KeyA' },
    { id: 'line', name: 'خط', label: 'خطِ راست', icon: 'line', letter: 'q', code: 'KeyQ' },
    { id: 'path', name: 'مسیر', label: 'مسیرِ چندنقطه‌ای', icon: 'path', letter: 'g', code: 'KeyG' },
    { id: 'pen', name: 'قلم', label: 'قلم آزاد', icon: 'pen', letter: 'p', code: 'KeyP' },
    { id: 'highlight', name: 'هایلایتر', label: 'هایلایتر', icon: 'highlight', letter: 'h', code: 'KeyH' },
    { id: 'stamp', name: 'مُهر', label: 'مُهر اصطلاح', icon: 'stamp', letter: 's', code: 'KeyS' },
    /* A command rather than an instrument: pressing it opens the file picker
       once instead of arming a drag. `command` keeps the rail's active state
       and the automatic relax-back out of its way. */
    { id: 'image', name: 'تصویر', label: 'افزودن تصویر — یا روی تخته رها کنید', icon: 'image', letter: 'u', code: 'KeyU', command: true },
    { id: 'erase', name: 'پاک‌کن', label: 'پاک‌کن', icon: 'erase', letter: 'e', code: 'KeyE' },
  ];
  const TOOLS = TOOL_DEFS.map(t => t.id);
  const TOOL_BY_CODE = {};
  const TOOL_BY_LETTER = {};
  for (const t of TOOL_DEFS) { TOOL_BY_CODE[t.code] = t.id; TOOL_BY_LETTER[t.letter] = t.id; }
  const KIND_ICON = {
    pin: 'pin', note: 'note', text: 'type', rect: 'box', ellipse: 'circle',
    arrow: 'arrow-anno', line: 'line', path: 'path', pen: 'pen',
    highlight: 'highlight', stamp: 'stamp', image: 'image',
  };
  /* One Persian name per mark kind. The row, the screen-reader description,
     the Markdown sidecar and the status line all read it, so a tool cannot be
     renamed in one place and left stale in another. */
  const KIND_LABEL = {
    pin: 'شماره', note: 'یادداشت', text: 'متن', rect: 'چارچوب', ellipse: 'بیضی',
    arrow: 'پیکان', line: 'خط', path: 'مسیر', pen: 'قلم',
    highlight: 'هایلایتر', stamp: 'مُهر', image: 'تصویر',
  };
  const TOOL_LABEL = Object.fromEntries(TOOL_DEFS.map(t => [t.id, t.name]));
  /* The palette is deliberately small on screen and wide in range: eight
     columns, two rows, plus the reader's own colour and a screen eyedropper.
     Presets keep stable ids so older notes stay readable when a hex changes. */
  const INKS = [
    { id: 'ink', label: 'مرکب', hex: '#1d1b16' },
    { id: 'graphite', label: 'گرافیت', hex: '#4a463b' },
    { id: 'gray', label: 'خاکستری', hex: '#77716a' },
    { id: 'copper', label: 'مس', hex: '#a8532b' },
    { id: 'orange', label: 'نارنجی', hex: '#c26a1f' },
    { id: 'gold', label: 'طلایی', hex: '#8a5a16' },
    { id: 'red', label: 'سرخ', hex: '#8f3524' },
    { id: 'rose', label: 'گلبهی', hex: '#a03e63' },
    { id: 'olive', label: 'زیتونی', hex: '#6f7a2a' },
    { id: 'green', label: 'سبز', hex: '#3f6b46' },
    { id: 'teal', label: 'فیروزه‌ای', hex: '#2b6f70' },
    { id: 'sky', label: 'آبی روشن', hex: '#4a7fa5' },
    { id: 'blue', label: 'نیلی', hex: '#2f5573' },
    { id: 'indigo', label: 'بنفشه', hex: '#4c4a8a' },
    { id: 'violet', label: 'ارغوانی', hex: '#6b3f66' },
    { id: 'brown', label: 'قهوه‌ای', hex: '#6b4326' },
  ];
  /* The six most-used colours stay a single click away in the floating bar and
     the context menu; the full palette is behind the rail's colour button. */
  const CORE_INKS = ['ink', 'copper', 'red', 'green', 'blue', 'gold']
    .map(id => INKS.find(i => i.id === id)).filter(Boolean);
  const MIXED_INK = 'conic-gradient(#1d1b16, #8f3524, #8a5a16, #3f6b46, #2f5573, #6b3f66, #1d1b16)';
  const STATUSES = [
    { id: '', label: '—' },
    { id: 'idea', label: 'ایده' },
    { id: 'ask', label: 'پرسش' },
    { id: 'todo', label: 'باید ببینم' },
    { id: 'done', label: 'انجام شد' },
  ];
  /* RTM shorthand the reader marks a chart with, in the words the journals
     themselves use. Kept English because that is how the traders write them. */
  const STAMPS = ['SL', 'TP', 'EN', 'IF', 'FF', 'FL', 'HF', 'OTE', 'NDB', 'BOS', 'CHoCH', 'Demand', 'Supply', 'Liquidity', 'MB', 'FTR'];
  const WIDTH_STEPS = [0.0022, 0.0035, 0.0055, 0.0085, 0.013];   // stroke, fraction of plate height
  const SIZE_STEPS = [0.018, 0.026, 0.036, 0.05];                // text, fraction of plate height
  /* Handwriting is one object per thought, not one per pen lift. A stroke that
     lands soon enough and close enough to the last one joins it, a tap leaves a
     dot, and the pen stays in the hand until the reader puts it down. */
  const INK_JOIN_MS = 2000;
  const INK_JOIN_GAP = 0.05;   // fraction of plate height
  /* The work space around the plate, as a fraction of each side of it. Pictures
     live on this margin so a reference chart never has to cover the candles. */
  const BOARD = 0.5;
  const PASS_COLORS = ['#a8532b', '#2f5573', '#3f6b46', '#8a5a16', '#6b3f66', '#4a463b'];

  /* ------------------------------------------------------------ preferences */

  const DEFAULT_PREFS = {
    tool: 'note',
    lastTool: 'note',
    sticky: false,
    ink: 'copper',
    recentInks: [],
    width: 1,
    size: 1,
    fill: false,
    stamp: 'SL',
    activeProfile: 'me',
    profiles: [{ id: 'me', name: 'من', initials: 'م', color: '#a8532b' }],
  };
  let prefs = loadPrefs();

  function loadPrefs() {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem(PREFS_KEY) || 'null'); } catch { stored = null; }
    const p = Object.assign({}, DEFAULT_PREFS, stored || {});
    if (!Array.isArray(p.profiles) || !p.profiles.length) p.profiles = DEFAULT_PREFS.profiles.slice();
    if (!inkRef(p.ink)) p.ink = DEFAULT_PREFS.ink;
    p.recentInks = Array.isArray(p.recentInks) ? p.recentInks.map(normHex).filter(Boolean).slice(0, 6) : [];
    return p;
  }

  function savePrefs() {
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch { /* private mode: settings are lost, marks are not */ }
  }

  function profile(id) {
    const want = id || prefs.activeProfile;
    return prefs.profiles.find(p => p.id === want) || prefs.profiles[0] || DEFAULT_PREFS.profiles[0];
  }

  /* ---------------------------------------------------------------- storage */

  let db = null;
  let dbPromise = null;

  function open() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) { reject(new Error('no indexedDB')); return; }
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const d = req.result;
        if (!d.objectStoreNames.contains(SETS)) {
          const s = d.createObjectStore(SETS, { keyPath: 'imageKey' });
          s.createIndex('byUpdatedAt', 'updatedAt');
        }
        if (!d.objectStoreNames.contains(KV)) d.createObjectStore(KV);
        /* Picture files sit outside the set document on purpose: undo keeps
           JSON snapshots of every pass, and a snapshot must not drag a few
           megabytes of PNG along with it. A note carries only a `fileId`. */
        if (!d.objectStoreNames.contains(FILES)) d.createObjectStore(FILES, { keyPath: 'id' });
      };
      req.onblocked = () => reject(new Error('another tab is holding an older database open'));
      req.onsuccess = () => { db = req.result; resolve(db); };
      req.onerror = () => reject(req.error || new Error('database refused to open'));
    });
    return dbPromise;
  }

  function tx(store, mode, fn) {
    return open().then(d => new Promise((resolve, reject) => {
      const t = d.transaction(store, mode);
      let out;
      try { out = fn(t.objectStore(store)); } catch (e) { reject(e); return; }
      t.onabort = () => reject(t.error || new Error('transaction aborted'));
      const done = () => resolve(out && out.result !== undefined ? out.result : undefined);
      t.oncomplete = done;
      if (out && 'onsuccess' in out) out.onsuccess = done;
    }));
  }

  const kvGet = key => tx(KV, 'readonly', s => s.get(key)).then(r => (r === undefined ? null : r));
  const kvSet = (key, value) => tx(KV, 'readwrite', s => s.put(value, key));
  const kvDel = key => tx(KV, 'readwrite', s => s.delete(key));
  const getSet = imageKey => tx(SETS, 'readonly', s => s.get(imageKey)).then(r => r || null);
  const putSet = set => tx(SETS, 'readwrite', s => s.put(set));
  const allSets = () => tx(SETS, 'readonly', s => s.getAll());
  const getFile = id => tx(FILES, 'readonly', s => s.get(id)).then(r => r || null);
  const putFile = rec => tx(FILES, 'readwrite', s => s.put(rec));

  /* ------------------------------------------------------------ picture files */

  /* The bytes live in FILES; this map holds only the session's decoded copies
     and object URLs. An image note carries a fileId and a rectangle, so undo
     snapshots, copy/paste and the set document stay small no matter how large
     the reference picture is. */
  const imgCache = new Map();   // fileId -> { url, img, rec, ok, failed, loading }

  function decodeInto(entry, rec) {
    const url = URL.createObjectURL(rec.blob);
    const img = new Image();
    img.decoding = 'async';
    entry.url = url; entry.img = img; entry.rec = rec;
    const decoded = new Promise((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('image would not decode'));
    });
    img.src = url;
    return decoded.then(() => { entry.ok = true; scheduleRender(); })
      .catch(() => { entry.failed = true; scheduleRender(); })
      .then(() => entry);
  }

  function imageEntry(fileId) {
    if (!fileId) return null;
    let entry = imgCache.get(fileId);
    if (entry) return entry;
    entry = { url: '', img: null, rec: null, ok: false, failed: false, loading: null };
    imgCache.set(fileId, entry);
    entry.loading = getFile(fileId)
      .then(rec => {
        if (!rec || !rec.blob) throw new Error('missing image file');
        return decodeInto(entry, rec);
      })
      .catch(() => { entry.failed = true; scheduleRender(); return entry; });
    return entry;
  }

  function imageReady(n) {
    const e = imageEntry(n && n.fileId);
    return e && e.ok && e.img ? e : null;
  }

  function imageIdsOf(set) {
    const ids = new Set();
    for (const pass of (set && set.passes) || []) {
      for (const n of pass.notes || []) if (n.kind === 'image' && n.fileId) ids.add(n.fileId);
    }
    return ids;
  }

  async function ensureImages(set) {
    const ids = Array.from(imageIdsOf(set));
    await Promise.all(ids.map(id => { const e = imageEntry(id); return e && e.loading; }));
  }

  function imageDims(blob) {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.decoding = 'async';
    const done = new Promise((resolve, reject) => {
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = () => reject(new Error('image would not decode'));
    });
    img.src = url;
    return done.finally(() => URL.revokeObjectURL(url));
  }

  async function saveImageFile(file) {
    if (!file || !/^image\//.test(file.type)) throw new Error('not an image');
    const dims = await imageDims(file);
    if (!dims.w || !dims.h) throw new Error('image has no size');
    const rec = {
      id: 'f' + uid().slice(1),
      name: String(file.name || 'image').slice(0, 160),
      mime: file.type || 'image/png',
      blob: file, w: dims.w, h: dims.h, bytes: file.size || 0, createdAt: Date.now(),
    };
    await putFile(rec);
    const entry = { url: '', img: null, rec: null, ok: false, failed: false, loading: null };
    imgCache.set(rec.id, entry);
    decodeInto(entry, rec);
    return rec;
  }

  /* Where the board starts and ends, in plate-relative units. Marks were
     always fractions of the plate; a picture is the one thing allowed past
     them, so the margin is the same fraction at every zoom level. */
  function boardBox() {
    return { x0: -BOARD, y0: -BOARD, x1: 1 + BOARD, y1: 1 + BOARD };
  }

  function boardOn() {
    const lb = document.getElementById('lightbox');
    if (!lb) return false;
    return lb.classList.contains('is-annotating') || lb.classList.contains('has-board');
  }

  function setHasOutside() {
    const lb = document.getElementById('lightbox');
    const set = state.set;
    if (!lb) return;
    let out = false;
    if (set) {
      for (const pass of set.passes) {
        for (const n of pass.notes) {
          if (n.kind !== 'image') continue;
          if (n.x < -0.001 || n.y < -0.001 || n.x + n.w > 1.001 || n.y + n.h > 1.001) { out = true; break; }
        }
        if (out) break;
      }
    }
    lb.classList.toggle('has-board', out);
  }

  /* Opening a margin makes the content wider than the pane. Without this the
     chart would jump to one edge; the reader should get the same view, now with
     room around it. */
  function centerBoard() {
    const scroller = document.getElementById('lbImageScroll');
    const stage = document.getElementById('lbImageStage');
    if (!scroller || !stage) return;
    const sr = stage.getBoundingClientRect();
    const cr = scroller.getBoundingClientRect();
    scroller.scrollLeft += (sr.left + sr.width / 2) - (cr.left + scroller.clientWidth / 2);
    scroller.scrollTop += (sr.top + sr.height / 2) - (cr.top + scroller.clientHeight / 2);
  }

  /* The board margin in screen pixels, mirrored into the two custom
     properties the stylesheet uses. The stage keeps its own size, so the
     plate never shrinks when the margin opens. */
  let boardPadKey = '';
  function paintBoardPad() {
    const board = document.getElementById('lbBoard');
    const stage = document.getElementById('lbImageStage');
    const lb = document.getElementById('lightbox');
    if (!board || !stage || !lb) return;
    if (!boardOn()) {
      if (boardPadKey === '') return;
      boardPadKey = '';
      board.style.padding = '';
      lb.style.setProperty('--board-pad-x', '0px');
      lb.style.setProperty('--board-pad-y', '0px');
      return;
    }
    const r = stage.getBoundingClientRect();
    const padX = Math.round(r.width * BOARD);
    const padY = Math.round(r.height * BOARD);
    const key = padX + 'x' + padY;
    if (key === boardPadKey) return;
    boardPadKey = key;
    board.style.padding = padY + 'px ' + padX + 'px';
    lb.style.setProperty('--board-pad-x', padX + 'px');
    lb.style.setProperty('--board-pad-y', padY + 'px');
  }

  /* Default footprint: big enough to read a wireframe, small enough that the
     chart underneath is still visible. Aspect ratio is preserved by converting
     the file's pixel ratio into plate-relative units. */
  function imageBoxFor(rec, at, i, count) {
    const { W, H } = plateSize();
    const ratio = (rec.w || 1) / (rec.h || 1);
    const placedOnPoint = !!(at && Number.isFinite(at.x) && Number.isFinite(at.y));
    const maxW = placedOnPoint ? (count > 1 ? 0.28 : 0.34) : Math.min(0.28, BOARD * 0.8);
    let w = maxW;
    let h = w * W / (H * ratio);
    if (h > 0.42) { h = 0.42; w = h * H * ratio / W; }
    if (w < 0.06) { w = 0.06; h = w * W / (H * ratio); }
    if (h > 0.9) { h = 0.9; w = h * H * ratio / W; }
    const lim = boardBox();
    let cx, cy;
    if (placedOnPoint) {
      const step = (i - (count - 1) / 2) * 0.035;
      cx = at.x + step;
      cy = at.y + step;
    } else {
      /* No pointer to obey, so a picked or pasted picture goes into the work
         space beside the chart — the reason the board exists. */
      cx = 1 + BOARD / 2;
      cy = 0.5 + (i - (count - 1) / 2) * 0.12;
    }
    let x = clamp(cx - w / 2, lim.x0, Math.max(lim.x0, lim.x1 - w));
    let y = clamp(cy - h / 2, lim.y0, Math.max(lim.y0, lim.y1 - h));
    /* A drop that lands past an edge means "beside the chart", not "half on
       it": the new picture is nudged until its near edge clears the plate. */
    if (placedOnPoint) {
      if (at.x >= 1 && x < 1) x = Math.min(1, Math.max(lim.x0, lim.x1 - w));
      else if (at.x <= 0 && x + w > 0) x = Math.max(lim.x0, -w);
      if (at.y >= 1 && y < 1) y = Math.min(1, Math.max(lim.y0, lim.y1 - h));
      else if (at.y <= 0 && y + h > 0) y = Math.max(lim.y0, -h);
    }
    return { x, y, w, h };
  }

  async function insertImages(files, at) {
    if (!state.set) { toast('اول یک تصویرِ ژورنال را باز کنید'); return; }
    const pass = activePass(state.set);
    if (!pass) return;
    /* Dropping or pasting a picture is a board action: the rail comes up so the
       new image can be moved, resized and layered without another step. */
    if (!annotating()) { toggleAnno(true); setTool('select', { quiet: true }); }
    const list = Array.from(files || []).filter(f => f && /^image\//.test(f.type));
    if (!list.length) { toast('فایلِ تصویری پیدا نشد'); return; }
    const recs = [];
    for (const file of list) {
      try { recs.push(await saveImageFile(file)); }
      catch (err) { console.warn('image file refused', err); }
    }
    if (!recs.length) { toast('این تصویر خوانده نشد'); return; }
    pushUndo();
    const ids = [];
    recs.forEach((rec, i) => {
      const box = imageBoxFor(rec, at, i, recs.length);
      const note = {
        id: uid(), kind: 'image', fileId: rec.id, name: rec.name,
        x: box.x, y: box.y, w: box.w, h: box.h,
        author: prefs.activeProfile, createdAt: Date.now(), status: '', tags: [], locked: false,
      };
      pass.notes.push(note);
      ids.push(note.id);
    });
    writeSelection(ids);
    state.flash = ids[ids.length - 1];
    touch(); renderLayer(); renderList(); paintTools(); paintBadge();
    /* The work space starts off screen, so a picture put there by the picker
       must be brought into view or it looks like the insert failed. */
    if (!at) requestAnimationFrame(() => revealOnBoard({ x: 1, y: 0, w: BOARD, h: 1 }));
    toast(toFa(ids.length) + ' تصویر روی تخته گذاشته شد');
  }

  /* Scroll the pane just enough to centre a box given in plate units. */
  function revealOnBoard(b) {
    const scroller = document.getElementById('lbImageScroll');
    const stage = document.getElementById('lbImageStage');
    if (!scroller || !stage || !b) return;
    const sr = stage.getBoundingClientRect();
    const cr = scroller.getBoundingClientRect();
    const cx = sr.left + (b.x + (b.w || 0) / 2) * sr.width;
    const cy = sr.top + (b.y + (b.h || 0) / 2) * sr.height;
    scroller.scrollLeft += cx - (cr.left + scroller.clientWidth / 2);
    scroller.scrollTop += cy - (cr.top + scroller.clientHeight / 2);
  }

  let imageInput = null;
  function pickImages(replaceId) {
    if (!state.set) { toast('اول یک تصویرِ ژورنال را باز کنید'); return; }
    if (!imageInput) {
      imageInput = document.createElement('input');
      imageInput.type = 'file';
      imageInput.accept = 'image/*';
      imageInput.hidden = true;
      document.body.appendChild(imageInput);
      imageInput.addEventListener('change', () => {
        const files = Array.from(imageInput.files || []);
        const replace = imageInput.dataset.replace || '';
        imageInput.value = '';
        imageInput.dataset.replace = '';
        if (!files.length) return;
        if (replace) replaceImage(replace, files[0]);
        else insertImages(files);
      });
    }
    imageInput.dataset.replace = replaceId || '';
    imageInput.multiple = !replaceId;
    imageInput.click();
  }

  async function replaceImage(id, file) {
    const found = findNote(state.set, id);
    if (!found || found.note.kind !== 'image') return;
    if (!file || !/^image\//.test(file.type)) { toast('این فایل تصویر نیست'); return; }
    try {
      const rec = await saveImageFile(file);
      pushUndo();
      const n = found.note;
      const { W, H } = plateSize();
      const ratio = (rec.w || 1) / (rec.h || 1);
      n.fileId = rec.id;
      n.name = rec.name;
      n.h = clamp(n.w * W / (H * ratio), 0.02, 0.9);
      if (n.h >= 0.9) n.w = clamp(n.h * H * ratio / W, 0.02, 1);
      touch(); renderLayer(); renderList(); paintTools();
      toast('تصویر عوض شد', { label: 'واگرد', onClick: undo });
    } catch { toast('این تصویر خوانده نشد'); }
  }

  async function openImageFile(id) {
    const found = findNote(state.set, id);
    if (!found || found.note.kind !== 'image') return;
    const entry = imageEntry(found.note.fileId);
    if (!entry) return;
    await entry.loading;
    if (!entry.url) { toast('فایل تصویر پیدا نشد'); return; }
    const w = window.open(entry.url, '_blank', 'noopener');
    if (!w) toast('مرورگر پنجرهٔ تازه را باز نکرد');
  }

  function draggedImages(dt) {
    if (!dt) return [];
    const out = [];
    if (dt.items) {
      for (const it of Array.from(dt.items)) {
        if (it.kind === 'file' && /^image\//.test(it.type)) {
          const f = it.getAsFile();
          if (f) out.push(f);
        }
      }
    }
    if (!out.length && dt.files) {
      for (const f of Array.from(dt.files)) if (f && /^image\//.test(f.type)) out.push(f);
    }
    return out;
  }

  function isFileDrag(dt) {
    return !!(dt && Array.from(dt.types || []).indexOf('Files') >= 0);
  }

  let imageIoWired = false;
  function wireImageIo() {
    if (imageIoWired) return;
    imageIoWired = true;
    const board = document.getElementById('lbBoard');
    if (!board) return;
    board.addEventListener('dragover', e => {
      if (!state.set) return;
      if (!isFileDrag(e.dataTransfer) && !draggedImages(e.dataTransfer).length) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      board.classList.add('is-drop');
    });
    board.addEventListener('dragleave', e => {
      if (!board.contains(e.relatedTarget)) board.classList.remove('is-drop');
    });
    board.addEventListener('drop', e => {
      if (!state.set) return;
      const files = draggedImages(e.dataTransfer);
      board.classList.remove('is-drop');
      if (!files.length) return;
      e.preventDefault();
      e.stopPropagation();
      insertImages(files, normAt(e, true));
    });
    /* A file dropped anywhere else must not navigate the tab away from the
       journal; only the plate turns a file into a picture. */
    document.addEventListener('dragover', e => {
      if (state.set && isFileDrag(e.dataTransfer)) e.preventDefault();
    });
    document.addEventListener('drop', e => {
      if (state.set && (isFileDrag(e.dataTransfer) || draggedImages(e.dataTransfer).length)) e.preventDefault();
    });
    document.addEventListener('paste', e => {
      if (!state.set) return;
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (editor && !editor.hidden) return;
      const files = draggedImages(e.clipboardData);
      if (files.length) { e.preventDefault(); insertImages(files); return; }
      /* No picture on the OS clipboard, so the editor's own buffer answers —
         but only while the board owns the keys. */
      if (annotating() && clipboard.length) { e.preventDefault(); pasteClipboard(); }
    });
  }


  /* ---------------------------------------------------------------- the model */

  const state = {
    imageKey: '',
    plate: null,          // { k, o, w, h, pid, jid, p }
    journal: null,
    set: null,            // the document being edited
    passId: '',
    /* Selection is a list, last one is the primary. The old single-selection
       field stays as an accessor, so every existing call site keeps working
       and only the new gestures know there may be more than one mark. */
    selection: [],
    get selected() { return this.selection.length ? this.selection[this.selection.length - 1] : ''; },
    set selected(id) { this.selection = id ? [id] : []; },
    flash: '',            // row to point at after a render, so a new mark is findable
    capturing: false,
    dirty: false,
    folder: null,         // FileSystemDirectoryHandle
    folderName: '',
    saveLabel: '',
    panelOpen: false,     // the notes column is opened by hand, never by itself
    undo: [],
    redo: [],
    listFilter: 'all',    // all | mine | open | done
    centerPending: false, // a freshly opened board centres once, never on every edit
  };

  /* Kinds that carry words. A box and an arrow carry a caption too; making
     them editable was the first thing readers asked for after drawing one. */
  function textKind(kind) {
    return kind === 'note' || kind === 'text' || kind === 'stamp'
      || kind === 'rect' || kind === 'ellipse' || kind === 'arrow';
  }

  function isSelected(id) { return !!id && state.selection.indexOf(id) >= 0; }
  function selectedNotes() {
    return state.selection.map(id => findNote(state.set, id)).filter(Boolean);
  }
  function clearSelection() { state.selection = []; }

  function writeSelection(ids) {
    state.selection = (ids || []).filter((id, i, all) => id && all.indexOf(id) === i);
    paintSelectionClasses();
    paintFrame();
    paintTools();
    syncRowSelection();
  }

  function toggleInSelection(id) {
    if (!id) return;
    const at = state.selection.indexOf(id);
    if (at >= 0) state.selection.splice(at, 1);
    else state.selection.push(id);
    paintSelectionClasses();
    paintFrame();
    paintTools();
    syncRowSelection();
  }

  function syncRowSelection() {
    $$('.anno-row').forEach(r => r.classList.toggle('is-selected', isSelected(r.getAttribute('data-id'))));
  }

  function uid() {
    return 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function todayLabel() {
    try {
      return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date());
    } catch { return new Date().toLocaleDateString(); }
  }

  function stampTime(ts) {
    try {
      return new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(ts));
    } catch { return new Date(ts).toLocaleString(); }
  }

  function newPass(set, label) {
    const p = {
      id: uid(),
      label: label || ('گذر ' + toFa(set.passes.length + 1) + ' · ' + todayLabel()),
      createdAt: Date.now(),
      author: prefs.activeProfile,
      notes: [],
    };
    set.passes.push(p);
    return p;
  }

  function ensureSet(imageKey, plate, journal) {
    return getSet(imageKey).then(existing => {
      if (existing && Array.isArray(existing.passes)) {
        existing.passes = existing.passes.filter(p => p && Array.isArray(p.notes));
        if (!existing.passes.length) newPass(existing);
        syncWhere(existing, plate, journal);
        return existing;
      }
      const fresh = {
        v: SCHEMA,
        imageKey,
        name: plate && plate.o ? plate.o : imageKey,
        where: whereOf(plate, journal),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        passes: [],
      };
      newPass(fresh);
      return fresh;
    });
  }

  function whereOf(plate, journal) {
    const jid = (journal && journal.id) || (plate && plate.jid) || '';
    return {
      jid,
      jname: (journal && journal.name) || '',
      pid: plate ? plate.pid || '' : '',
      page: plate ? plate.p || plate.pageNum || 1 : 1,
    };
  }

  /* The plate can be reached from several posts; the last place it was seen is
     the one the sidecar and the note list should link back to. */
  function syncWhere(set, plate, journal) {
    const w = whereOf(plate, journal);
    if (w.jid && (set.where.jid !== w.jid || set.where.pid !== w.pid)) set.where = w;
    if (plate && plate.o && set.name !== plate.o) set.name = plate.o;
  }

  function activePass(set) {
    if (!set) return null;
    return set.passes.find(p => p.id === state.passId) || set.passes[set.passes.length - 1] || null;
  }

  function noteList(set) {
    if (!set) return [];
    const out = [];
    for (const p of set.passes) for (const n of p.notes) out.push(Object.assign({ passId: p.id, passLabel: p.label }, n));
    return out;
  }

  function findNote(set, id) {
    if (!set || !id) return null;
    for (const p of set.passes) {
      const i = p.notes.findIndex(n => n.id === id);
      if (i >= 0) return { pass: p, note: p.notes[i], index: i };
    }
    return null;
  }

  function toFa(n) {
    return String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d]);
  }

  /* -------------------------------------------------------------- geometry */

  /* Marks are ink on the plate: every dimension is a fraction of the plate, so
     it is drawn in the same place at 20٪ or 800٪ and in the baked copy. */
  function px(x, y, W, H) { return { x: x * W, y: y * H }; }
  function rel(v, H) { return v * H; }

  function boxOf(n, W, H) {
    const w = (n.w || 0) * W;
    const h = (n.h || 0) * H;
    return { x: n.x * W, y: n.y * H, w, h, x2: n.x * W + w, y2: n.y * H + h };
  }

  function pointsOf(n, W, H) {
    return (n.pts || []).map(p => ({ x: p[0] * W, y: p[1] * H }));
  }

  function isInkKind(kind) { return kind === 'pen' || kind === 'highlight'; }

  /* A pen note may hold several strokes: one word, a dot over a letter, an
     `i` crossed after the fact. Older notes keep the single `pts` they were
     written with, so both shapes read through the same helpers. */
  function inkStrokes(n) {
    if (n && n.strokes && n.strokes.length) return n.strokes;
    return n && n.pts && n.pts.length ? [n.pts] : [];
  }

  function inkStrokesPx(n, W, H) {
    return inkStrokes(n).map(s => s.map(p => ({ x: p[0] * W, y: p[1] * H })));
  }

  /* Several subpaths in one `d`: lifted strokes must not be joined by a false
     segment. A single point becomes a hairline dot through the round cap, so a
     tap and a dot over a letter render the same way in both renderers. */
  function inkPathD(strokesPx, close) {
    let d = '';
    for (const s of strokesPx) {
      if (!s.length) continue;
      if (s.length === 1) { d += `M${s[0].x.toFixed(1)} ${s[0].y.toFixed(1)}l0.01 0 `; continue; }
      d += s.map((p, i) => (i ? 'L' : 'M') + p.x.toFixed(1) + ' ' + p.y.toFixed(1)).join(' ') + ' ';
    }
    return d + (close ? 'Z' : '');
  }

  /* --------------------------------------------------------- freehand ink */

  /* Handwriting is not a chain of straight segments: perfect-freehand (the
     engine Excalidraw draws with) turns the raw pointer samples into a filled
     outline that thins with speed and pressure, smooths the corners and tapers
     the ends. The outline is cached per note, and the stroke under the hand is
     painted on its own path, so a pointermove never rebuilds the layer. */
  const inkCache = new WeakMap();
  let inkLive = null;
  let inkLiveRaf = 0;
  let inkCursor = null;

  function freehandStroke() {
    const pf = typeof window !== 'undefined' ? window.PerfectFreehand : null;
    return pf && typeof pf.getStroke === 'function' ? pf.getStroke : null;
  }

  /* The canonical quadratic smoothing from the perfect-freehand README: the
     outline points are already dense, so one `Q … T` chain through their
     midpoints reads as a pen line instead of a polygon. */
  function getSvgPathFromStroke(points, closed) {
    const len = points.length;
    if (len < 4) return '';
    const mid = (a, b) => ((a[0] + b[0]) / 2).toFixed(2) + ',' + ((a[1] + b[1]) / 2).toFixed(2);
    let a = points[0];
    let b = points[1];
    let out = 'M' + a[0].toFixed(2) + ',' + a[1].toFixed(2)
      + ' Q' + b[0].toFixed(2) + ',' + b[1].toFixed(2) + ' ' + mid(b, points[2]) + ' T';
    for (let i = 2, max = len - 1; i < max; i++) {
      a = points[i]; b = points[i + 1];
      out += mid(a, b) + ' ';
    }
    return closed === false ? out : out + 'Z';
  }

  function inkOptions(n, sw, live) {
    const hi = n && n.kind === 'highlight';
    return {
      size: sw * (hi ? 3.2 : 1),
      /* A highlighter is a flat band; a pen is thin when it moves fast and
         fat when it rests, which is what makes the line look written. */
      thinning: hi ? 0 : 0.6,
      smoothing: hi ? 0.5 : 0.55,
      streamline: hi ? 0.55 : 0.45,
      easing: t => t,
      simulatePressure: !(n && n.stylus),
      /* While the pen is down there is no end yet; the taper belongs to the
         lift, which is exactly when the eye expects it. */
      last: !live,
    };
  }

  function strokeOutlineD(stroke, W, H, n, sw, live) {
    const getStroke = freehandStroke();
    if (!getStroke || !stroke || !stroke.length) return '';
    const stylus = !!(n && n.stylus);
    const pts = stroke.map(p => [
      p[0] * W, p[1] * H,
      stylus && p.length > 2 && Number.isFinite(p[2]) ? clamp01(p[2]) : 0.5,
    ]);
    return getSvgPathFromStroke(getStroke(pts, inkOptions(n, sw, live)), true);
  }

  function buildInkDs(n, W, H, live) {
    const sw = Math.max(1, rel(n.sw || WIDTH_STEPS[1], H));
    const out = [];
    for (const s of inkStrokes(n)) {
      const d = strokeOutlineD(s, W, H, n, sw, live);
      if (d) out.push(d);
    }
    return out;
  }

  /* One outline per lifted stroke, never one concatenated path: two strokes
     that cross can wind opposite ways, and a single fill would then punch a
     hole exactly where the hand crossed itself. */
  function noteInkDs(n, W, H) {
    const ref = n.strokes || n.pts;
    const sw = n.sw || WIDTH_STEPS[1];
    const hit = inkCache.get(n);
    if (hit && hit.ref === ref && hit.sw === sw && hit.W === W && hit.H === H) return hit.ds;
    const ds = buildInkDs(n, W, H, false);
    inkCache.set(n, { ref, sw, W, H, ds });
    return ds;
  }

  function clearLiveInk() {
    if (inkLiveRaf) { cancelAnimationFrame(inkLiveRaf); inkLiveRaf = 0; }
    if (inkLive && inkLive.parentNode) inkLive.parentNode.removeChild(inkLive);
    inkLive = null;
  }

  function paintLiveInk() {
    inkLiveRaf = 0;
    if (!layer || !draft || !isInkKind(draft.kind) || !draft.pts || !draft.pts.length) {
      clearLiveInk();
      return;
    }
    const { W, H } = plateSize();
    const d = buildInkDs(draft, W, H, true)[0];
    if (!d) { clearLiveInk(); return; }
    if (!inkLive || inkLive.parentNode !== layer) {
      inkLive = svgEl('path', { class: 'anno-live-ink' });
      layer.appendChild(inkLive);
    }
    const hi = draft.kind === 'highlight';
    inkLive.setAttribute('d', d);
    inkLive.setAttribute('fill', hexOf(draft));
    inkLive.setAttribute('fill-opacity', hi ? 0.34 : 1);
    inkLive.setAttribute('style', 'pointer-events:none' + (hi ? ';mix-blend-mode:multiply' : ''));
  }

  function scheduleLiveInk() {
    if (inkLiveRaf) return;
    inkLiveRaf = requestAnimationFrame(paintLiveInk);
  }

  function pressureAt(e) {
    const p = e && typeof e.pressure === 'number' ? e.pressure : 0.5;
    return p > 0 ? clamp01(p) : 0.5;
  }

  /* One pointermove can carry several samples the browser coalesced while the
     main thread was busy. Taking all of them keeps a quick letter round
     instead of a chain of long chords between animation frames. */
  function collectInk(e, fallback) {
    if (!draft || !draft.pts) return;
    const coalesced = e && typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : null;
    const evs = coalesced && coalesced.length ? coalesced : (e ? [e] : []);
    let added = false;
    for (const ev of evs) {
      const q = normAt(ev);
      if (!q) continue;
      if (inkCursor && Math.hypot(ev.clientX - inkCursor.x, ev.clientY - inkCursor.y) < 0.8) continue;
      draft.pts.push([q.x, q.y, pressureAt(ev)]);
      inkCursor = { x: ev.clientX, y: ev.clientY };
      added = true;
    }
    if (!added && fallback && !e) draft.pts.push([fallback.x, fallback.y, 0.5]);
  }

  /* One mark, not the whole layer: after a pen lift only the note the hand was
     writing on is rebuilt, so a page full of ink does not make a letter slow. */
  function repaintInk(id, passId) {
    if (!layer || !state.set) return;
    const found = findNote(state.set, id);
    if (!found) { renderLayer(); return; }
    const { W, H } = plateSize();
    const node = buildMark(found.note, W, H, {});
    const old = layer.querySelector('.anno-mark[data-id="' + id + '"]');
    if (old && old.parentNode) {
      old.parentNode.replaceChild(node, old);
    } else {
      const group = layer.querySelector('.anno-pass[data-pass="' + (passId || found.pass.id) + '"]');
      if (group) group.appendChild(node);
      else { renderLayer(); return; }
    }
    paintFrame();
  }

  /* A filled triangular head, the shape every mapping tool uses. The shaft
     stops at the base of the triangle, so the tip is one clean point instead
     of two thin strokes meeting at a cross — the old open wings read as a plus
     sign on a busy chart, not as an arrow. */
  function arrowHeadGeom(p0, p1, sw, H) {
    const dx = p1.x - p0.x;
    const dy = p1.y - p0.y;
    const len = Math.hypot(dx, dy);
    if (!len) return null;
    const head = Math.min(len * 0.72, Math.max(sw * 4.4, Math.min(len * 0.34, rel(0.026, H))));
    const ang = Math.atan2(dy, dx);
    const ux = Math.cos(ang), uy = Math.sin(ang);
    const nx = -uy, ny = ux;
    const bx = p1.x - ux * head;
    const by = p1.y - uy * head;
    const hw = head * 0.52;
    return {
      ang, head,
      tip: p1,
      base: { x: bx, y: by },
      wing1: { x: bx + nx * hw, y: by + ny * hw },
      wing2: { x: bx - nx * hw, y: by - ny * hw },
    };
  }

  /* Distance from a point to a segment, in plate units. */
  function pointSegDist(px2, py2, ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    if (!len2) return Math.hypot(px2 - ax, py2 - ay);
    const t = Math.max(0, Math.min(1, ((px2 - ax) * dx + (py2 - ay) * dy) / len2));
    return Math.hypot(px2 - (ax + t * dx), py2 - (ay + t * dy));
  }

  /* Smallest distance between two segments. Endpoint-to-segment distances cover
     the parallel cases; a proper crossing is zero, which the sign test finds. */
  function segSegDist(ax, ay, bx, by, cx, cy, dx, dy) {
    const side = (x1, y1, x2, y2, x3, y3) => (x2 - x1) * (y3 - y1) - (y2 - y1) * (x3 - x1);
    const o1 = side(ax, ay, bx, by, cx, cy);
    const o2 = side(ax, ay, bx, by, dx, dy);
    const o3 = side(cx, cy, dx, dy, ax, ay);
    const o4 = side(cx, cy, dx, dy, bx, by);
    if ((o1 > 0) !== (o2 > 0) && (o3 > 0) !== (o4 > 0)) return 0;
    return Math.min(
      pointSegDist(cx, cy, ax, ay, bx, by),
      pointSegDist(dx, dy, ax, ay, bx, by),
      pointSegDist(ax, ay, cx, cy, dx, dy),
      pointSegDist(bx, by, cx, cy, dx, dy),
    );
  }

  /* Does the segment touch the axis-aligned box? Liang–Barsky: cheaper and
     exact, where sampling the segment could step over a thin mark. */
  function segHitsBox(ax, ay, bx, by, x0, y0, x1, y1) {
    let t0 = 0;
    let t1 = 1;
    const dx = bx - ax;
    const dy = by - ay;
    const clip = (p, q) => {
      if (!p) return q >= 0;
      const r = q / p;
      if (p < 0) { if (r > t1) return false; if (r > t0) t0 = r; }
      else { if (r < t0) return false; if (r < t1) t1 = r; }
      return true;
    };
    return clip(-dx, ax - x0) && clip(dx, x1 - ax) && clip(-dy, ay - y0) && clip(dy, y1 - ay);
  }

  /* Freeze a mark's hit geometry once per sweep. Text bounds are measured, not
     stored, so testing them on every pointermove would make a sweep over many
     notes slower than the redraw it replaces. */
  function eraseShapeOf(n, W, H) {
    const shape = { id: n.id, ink: Math.max(1, rel(n.sw || WIDTH_STEPS[1], H)) / 2 };
    if (n.kind === 'pen' || n.kind === 'highlight') {
      shape.strokes = inkStrokesPx(n, W, H).filter(s => s.length);
      if (n.kind === 'highlight') shape.ink *= 3.2;
      return shape.strokes.length ? shape : null;
    }
    if (n.kind === 'path') {
      shape.pts = pointsOf(n, W, H);
      return shape.pts.length ? shape : null;
    }
    if (n.kind === 'arrow' || n.kind === 'line') {
      shape.segs = pointsOf(n, W, H);
      return shape.segs.length >= 2 ? shape : null;
    }
    const b = normBounds(n, W, H);
    shape.box = [b.x * W, b.y * H, (b.x + b.w) * W, (b.y + b.h) * H];
    const lead = tailGeometry(n, W, H);
    if (lead) shape.tail = [lead.from.x, lead.from.y, lead.to.x, lead.to.y];
    return shape;
  }

  /* Does one eraser step touch this mark? The test is the mark's own geometry,
     so a fast sweep catches every mark along the way and a mark hidden under
     another is still reachable — elementFromPoint could do neither. */
  function eraseHit(shape, ax, ay, bx, by, reach) {
    const ink = reach + shape.ink;
    if (shape.strokes) {
      for (const s of shape.strokes) {
        if (s.length === 1) {
          if (pointSegDist(s[0].x, s[0].y, ax, ay, bx, by) <= ink) return true;
          continue;
        }
        for (let i = 1; i < s.length; i++) {
          if (segSegDist(ax, ay, bx, by, s[i - 1].x, s[i - 1].y, s[i].x, s[i].y) <= ink) return true;
        }
      }
      return false;
    }
    if (shape.pts) {
      if (shape.pts.length === 1) return pointSegDist(shape.pts[0].x, shape.pts[0].y, ax, ay, bx, by) <= ink;
      for (let i = 1; i < shape.pts.length; i++) {
        if (segSegDist(ax, ay, bx, by, shape.pts[i - 1].x, shape.pts[i - 1].y, shape.pts[i].x, shape.pts[i].y) <= ink) return true;
      }
      return false;
    }
    if (shape.segs) return segSegDist(ax, ay, bx, by, shape.segs[0].x, shape.segs[0].y, shape.segs[1].x, shape.segs[1].y) <= ink;
    const [x0, y0, x1, y1] = shape.box;
    if (segHitsBox(ax, ay, bx, by, x0 - ink, y0 - ink, x1 + ink, y1 + ink)) return true;
    return !!shape.tail && segSegDist(ax, ay, bx, by, shape.tail[0], shape.tail[1], shape.tail[2], shape.tail[3]) <= ink;
  }

  /* The plate box a mark occupies, in normalised units — used to fly the viewer
     to a note, to draw the selection frame and to make thin ink clickable.
     A text mark measures itself through textLayout(), so the frame, the hit
     area and the pixels all agree on where the words end. */
  function normBounds(n, W, H) {
    const w = W || 1;
    const h = H || 1;
    if (n.kind === 'pen' || n.kind === 'highlight') {
      const strokes = inkStrokes(n);
      if (strokes.length) {
        let x0 = 1, y0 = 1, x1 = 0, y1 = 0;
        for (const s of strokes) {
          for (const p of s) {
            x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]);
            x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]);
          }
        }
        return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
      }
    }
    if ((n.kind === 'path' || n.kind === 'line') && n.pts && n.pts.length) {
      let x0 = 1, y0 = 1, x1 = 0, y1 = 0;
      for (const p of n.pts) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }
      return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
    }
    if (n.kind === 'arrow') {
      const a = n.pts || [[n.x, n.y], [n.x + (n.w || 0), n.y + (n.h || 0)]];
      return {
        x: Math.min(a[0][0], a[1][0]), y: Math.min(a[0][1], a[1][1]),
        w: Math.abs(a[1][0] - a[0][0]), h: Math.abs(a[1][1] - a[0][1]),
      };
    }
    if (n.kind === 'pin') {
      const r = 0.013;
      return { x: n.x - r, y: n.y - r, w: r * 2, h: r * 2 };
    }
    if (n.kind === 'note' || n.kind === 'text') {
      const t = textLayout(n, w, h);
      return {
        x: n.x, y: n.y - (n.kind === 'text' ? 0 : 0),
        w: n.kind === 'text' ? Math.min(1, t.boxW / w) : t.boxW / w,
        h: t.boxH / h,
      };
    }
    if (n.kind === 'stamp') {
      const size = n.size || SIZE_STEPS[1];
      const bw = size * (String(n.text || '').length * 0.66 + 0.9) / (w / Math.max(1, h));
      return { x: n.x - bw / 2, y: n.y - size * 0.85, w: bw, h: size * 1.7 };
    }
    return { x: n.x, y: n.y, w: n.w || 0.02, h: n.h || 0.02 };
  }

  /* One measurement for both renderers: how a text mark is laid out on a plate
     of these pixels. If this is wrong, the editor, the baked copy and the
     selection frame are all wrong together — which is the only way to be sure
     they never disagree with each other. */
  function textLayout(n, W, H) {
    const size = rel(n.size || SIZE_STEPS[1], H);
    const defaultW = n.kind === 'note' ? 0.28 : 0.34;
    const font = fontFor(n, H);
    const inset = size * 0.35;
    let boxW = Math.max(size * 4, Math.min(W * 0.6, (n.w || defaultW) * W));
    /* A short word should not sit in a wide empty box. The stored width is the
       ceiling — the reader can still narrow a note and let the words wrap —
       but the visible box hugs the longest written line. */
    if ((n.kind === 'note' || n.kind === 'text') && String(n.text || '').trim()) {
      let natural = size * 4;
      for (const line of String(n.text).split('\n')) {
        natural = Math.max(natural, textWidth(line, font) + inset * 2 + size * 0.2);
      }
      boxW = Math.max(size * 4, Math.min(boxW, W * 0.6, natural));
    }
    const lines = wrapToFit(n.text || '', Math.max(size, boxW - inset * 2), font);
    const boxH = lines.length * size * 1.55 + size * 0.6;
    const rtl = detectDir(n.text) === 'rtl';
    return {
      size, boxW, boxH, lines, rtl, inset,
      textX: rtl ? boxW - inset : inset,
      baseline: size * 1.25,
      leading: size * 1.45,
    };
  }

  function textBlock(n, p, W, H, ink) {
    const t = textLayout(n, W, H);
    const align = n.align === 'center' || n.align === 'end' ? n.align : 'start';
    const x = align === 'center' ? p.x + t.boxW / 2
      : align === 'end' ? p.x + (t.rtl ? t.inset : t.boxW - t.inset)
      : p.x + t.textX;
    const anchor = align === 'center' ? 'middle' : align;
    const text = svgEl('text', Object.assign({
      x, y: p.y + t.baseline, fill: ink, class: 'anno-note-text',
      direction: t.rtl ? 'rtl' : 'ltr', 'text-anchor': anchor,
    }, fontAttrs(n, t.size)));
    t.lines.forEach((ln, i) => {
      const ts = svgEl('tspan', { x, dy: i ? t.leading : 0 });
      ts.textContent = ln;
      text.appendChild(ts);
    });
    const hasBg = n.kind === 'note' || (n.kind === 'text' && n.bg);
    const bg = hasBg ? svgEl('rect', {
      x: p.x, y: p.y, width: t.boxW, height: t.boxH, rx: Math.max(3, t.size * 0.3),
      fill: '#fffdf7', 'fill-opacity': n.kind === 'note' ? 0.94 : 0.88,
      stroke: ink, 'stroke-width': Math.max(1, rel(WIDTH_STEPS[0], H)),
    }) : null;
    return { p, size: t.size, bg, text, dot: n.kind === 'note' };
  }

  /* ---------------------------------------------------------------- the tail */

  /* A note is about a place on the chart, and the box rarely sits on it. The
     tail is the line from the box to that place: one point in the model, drawn
     by both renderers from the same geometry, dragged by its own grip. */
  function tailOf(n) {
    const t = n && n.tail;
    return Array.isArray(t) && t.length === 2 && Number.isFinite(t[0]) && Number.isFinite(t[1]) ? t : null;
  }

  function hasTail(n) { return !!tailOf(n) && (n.kind === 'note' || n.kind === 'text'); }

  /* The line leaves the box from the edge that faces the target, so it never
     crosses its own words, and it is measured in the same units as the box. */
  function tailGeometry(n, W, H) {
    if (!hasTail(n)) return null;
    const t = textLayout(n, W, H);
    const p = px(n.x, n.y, W, H);
    const cx = p.x + t.boxW / 2;
    const cy = p.y + t.boxH / 2;
    const q = px(n.tail[0], n.tail[1], W, H);
    const dx = q.x - cx;
    const dy = q.y - cy;
    if (!dx && !dy) return null;
    const hw = Math.max(1, t.boxW / 2);
    const hh = Math.max(1, t.boxH / 2);
    const s = Math.min(hw / Math.abs(dx || 1e-6), hh / Math.abs(dy || 1e-6), 1);
    const sw = Math.max(1, rel(WIDTH_STEPS[0], H));
    const len = Math.hypot(dx, dy) * s;
    return {
      from: { x: cx + dx * s, y: cy + dy * s },
      to: q,
      sw,
      head: Math.max(sw * 3.5, Math.min(len * 0.34, rel(0.016, H))),
      ang: Math.atan2(dy, dx),
    };
  }

  /* Where the tail grip lives: on the tip once there is one, and otherwise on
     the edge of the box, so pulling it out is the only gesture there is. */
  function tailGrip(n, W, H) {
    if (n.kind !== 'note' && n.kind !== 'text') return null;
    const t = textLayout(n, W, H);
    if (tailOf(n)) return { x: n.tail[0], y: n.tail[1] };
    return { x: n.x + Math.min(1, t.boxW / W) / 2, y: n.y + t.boxH / H };
  }

  function tailInsideBox(n, W, H) {
    const t = textLayout(n, W, H);
    const tl = tailOf(n);
    if (!tl) return true;
    const x0 = n.x, y0 = n.y;
    const x1 = n.x + t.boxW / (W || 1), y1 = n.y + t.boxH / (H || 1);
    return tl[0] >= x0 - 0.01 && tl[0] <= x1 + 0.01 && tl[1] >= y0 - 0.01 && tl[1] <= y1 + 0.01;
  }

  /* The leader is the same ink and the same thin stroke as the box border, with
     a head at the target — the reader points, they do not draw a second arrow. */
  function tailNode(lead, ink) {
    const g = svgEl('g', { class: 'anno-tail' });
    const ux = Math.cos(lead.ang), uy = Math.sin(lead.ang);
    const nx = -uy, ny = ux;
    const bx = lead.to.x - ux * lead.head;
    const by = lead.to.y - uy * lead.head;
    const hw = lead.head * 0.52;
    g.appendChild(svgEl('line', {
      x1: lead.from.x, y1: lead.from.y, x2: bx, y2: by,
      stroke: ink, 'stroke-width': lead.sw, 'stroke-linecap': 'round',
    }));
    g.appendChild(svgEl('polygon', {
      points: `${lead.to.x},${lead.to.y} ${bx + nx * hw},${by + ny * hw} ${bx - nx * hw},${by - ny * hw}`,
      fill: ink, stroke: ink, 'stroke-width': Math.max(1, lead.sw * 0.6), 'stroke-linejoin': 'round',
    }));
    return g;
  }

  /* A colour is either a preset id or a `#rrggbb` value; both resolve to one
     hex, so a preset picked in 2024 and a custom colour picked today compare,
     render and bake the same way. */
  function normHex(v) {
    const s = String(v == null ? '' : v).trim();
    if (/^#[0-9a-f]{6}$/i.test(s)) return s.toLowerCase();
    if (/^#[0-9a-f]{3}$/i.test(s)) return '#' + s.slice(1).split('').map(c => c + c).join('').toLowerCase();
    return '';
  }

  function inkHex(v) {
    const preset = INKS.find(i => i.id === v);
    return preset ? preset.hex : (normHex(v) || INKS.find(i => i.id === 'copper').hex);
  }

  function inkRef(v) {
    const s = String(v == null ? '' : v).trim();
    return INKS.some(i => i.id === s) ? s : normHex(s);
  }

  function sameInk(a, b) {
    return !!inkRef(a) && !!inkRef(b) && inkHex(a) === inkHex(b);
  }

  function inkLabel(v) {
    const preset = INKS.find(i => i.id === v) || INKS.find(i => sameInk(i.hex, v));
    return preset ? preset.label : (normHex(v) || 'مرکب');
  }

  /* What the controls should say about colour: the selected marks when they
     agree, otherwise the last colour chosen for the next mark. */
  function effectiveInk() {
    const picked = selectedNotes();
    if (!picked.length) return prefs.ink;
    const first = picked[0].note.color || prefs.ink;
    return picked.every(f => sameInk(f.note.color || prefs.ink, first)) ? first : '';
  }

  function hexOf(n) {
    return inkHex(n && n.color);
  }

  function statusMeta(id) { return STATUSES.find(s => s.id === id) || STATUSES[0]; }

  /* The base direction of a run of words, by Unicode's first-strong rule — the
     one `dir="auto"` and every chat app follow: the direction comes from the
     first letter that *has* a direction, not from whichever script happens to
     appear somewhere later. A note like «this high از LS دورتره» is an English
     sentence with two Persian words in it, and must not be laid out as Persian.
     Digits and punctuation are neutral and are skipped, as the rule says. */
  const STRONG_LTR = /[A-Za-z\u00C0-\u024F\u0370-\u03FF\u0400-\u04FF\u0530-\u058F\u10A0-\u10FF\u1E00-\u1EFF]/;
  const STRONG_RTL = /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u0870-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;

  function detectDir(text) {
    for (const ch of String(text || '')) {
      if (STRONG_LTR.test(ch)) return 'ltr';
      if (STRONG_RTL.test(ch)) return 'rtl';
    }
    /* Nothing decided: a note of numbers and brackets alone is written by a
       Persian reader over a Persian archive, so it starts from the right. */
    return 'rtl';
  }

  /* Wrapping is measured in pixels, never counted in characters: a Persian word
     and an English word are not the same width at the same size, and the same
     measurement feeds the live SVG and the baked copy, so the two cannot break
     a line in different places. Words are the unit — a Latin word or a number
     like 1.45355 is never split, which is what a reader expects to read back. */
  let measureCtx = null;
  const measureCache = new Map();

  function textWidth(s, font) {
    if (!measureCtx) {
      const cv = document.createElement('canvas');
      cv.width = 8; cv.height = 8;
      measureCtx = cv.getContext('2d');
    }
    const key = font + '\u0000' + s;
    let w = measureCache.get(key);
    if (w === undefined) {
      measureCtx.font = font;
      w = measureCtx.measureText(s).width;
      if (measureCache.size > 3000) measureCache.clear();
      measureCache.set(key, w);
    }
    return w;
  }

  function wrapToFit(text, maxWidth, font) {
    const out = [];
    for (const raw of String(text || '').split('\n')) {
      const words = raw.split(/\s+/).filter(Boolean);
      if (!words.length) { out.push(''); continue; }
      let line = words[0];
      for (let i = 1; i < words.length; i++) {
        const next = line + ' ' + words[i];
        if (textWidth(next, font) > maxWidth && textWidth(line, font) <= maxWidth) { out.push(line); line = words[i]; }
        else line = next;
      }
      out.push(line);
    }
    return out;
  }

  /* ---------------------------------------------------------------- drawing */

  const NS = 'http://www.w3.org/2000/svg';
  function svgEl(name, attrs) {
    const e = document.createElementNS(NS, name);
    for (const k in attrs) if (attrs[k] !== undefined && attrs[k] !== null) e.setAttribute(k, attrs[k]);
    return e;
  }

  /* One builder per kind, used for the live layer; the baker walks the same
     geometry through a 2D context. */
  function fontAttrs(n, size) {
    return {
      'font-size': size,
      'font-weight': n.bold ? 700 : 500,
      'font-style': n.italic ? 'italic' : null,
    };
  }

  /* Where a one-line caption sits, in plate pixels, and which anchor it uses.
     Kept in one place so the live layer and the baked copy cannot disagree. */
  function labelAnchor(n, W, H) {
    const align = n.align === 'start' || n.align === 'end' ? n.align : 'center';
    if (n.kind === 'arrow') {
      const a = pointsOf(n, W, H);
      const p0 = a[0] || { x: 0, y: 0 };
      const p1 = a[1] || p0;
      const t = align === 'start' ? 0.22 : align === 'end' ? 0.78 : 0.5;
      return { x: p0.x + (p1.x - p0.x) * t, y: p0.y + (p1.y - p0.y) * t - rel(0.012, H), anchor: align === 'center' ? 'middle' : align };
    }
    const b = boxOf(n, W, H);
    return {
      x: align === 'start' ? b.x : align === 'end' ? b.x + b.w : b.x + b.w / 2,
      y: b.y - 4,
      anchor: align === 'center' ? 'middle' : align,
    };
  }

  function buildMark(n, W, H, opts) {
    const interactive = !(opts && opts.static);
    const g = svgEl('g', {
      class: 'anno-mark kind-' + n.kind + (isSelected(n.id) && interactive ? ' is-selected' : '') + (n.locked ? ' is-locked' : ''),
      'data-id': n.id || '',
    });
    g.setAttribute('role', 'img');
    const ink = hexOf(n);
    const sw = Math.max(1, rel(n.sw || WIDTH_STEPS[1], H));
    const lead = n.kind === 'note' || n.kind === 'text' ? tailGeometry(n, W, H) : null;
    const title = svgEl('title');
    title.textContent = describe(n);
    g.appendChild(title);

    if (n.kind === 'rect' || n.kind === 'ellipse') {
      const b = boxOf(n, W, H);
      const common = {
        fill: n.fill ? ink : 'none', 'fill-opacity': n.fill ? 0.14 : null,
        stroke: ink, 'stroke-width': sw, 'stroke-linejoin': 'round',
      };
      if (n.kind === 'rect') g.appendChild(svgEl('rect', Object.assign({ x: b.x, y: b.y, width: Math.max(1, b.w), height: Math.max(1, b.h), rx: Math.min(6, b.w / 8) }, common)));
      else g.appendChild(svgEl('ellipse', Object.assign({ cx: b.x + b.w / 2, cy: b.y + b.h / 2, rx: Math.max(1, b.w / 2), ry: Math.max(1, b.h / 2) }, common)));
      if (n.text) g.appendChild(labelNode(n, W, H, ink));
    } else if (n.kind === 'arrow') {
      const a = pointsOf(n, W, H);
      const p0 = a[0] || { x: 0, y: 0 };
      const p1 = a[1] || p0;
      const hd = arrowHeadGeom(p0, p1, sw, H);
      if (hd) {
        g.appendChild(svgEl('line', {
          x1: p0.x, y1: p0.y, x2: hd.base.x, y2: hd.base.y,
          stroke: ink, 'stroke-width': sw, 'stroke-linecap': 'round',
        }));
        g.appendChild(svgEl('polygon', {
          points: `${hd.tip.x},${hd.tip.y} ${hd.wing1.x},${hd.wing1.y} ${hd.wing2.x},${hd.wing2.y}`,
          fill: ink, stroke: ink, 'stroke-width': Math.max(1, sw * 0.6), 'stroke-linejoin': 'round',
        }));
      }
      if (n.text) g.appendChild(labelNode(n, W, H, ink));
    } else if (n.kind === 'line') {
      const a = pointsOf(n, W, H);
      if (a.length >= 2) g.appendChild(svgEl('line', {
        x1: a[0].x, y1: a[0].y, x2: a[1].x, y2: a[1].y,
        stroke: ink, 'stroke-width': sw, 'stroke-linecap': 'round',
      }));
    } else if (n.kind === 'path') {
      const a = pointsOf(n, W, H);
      if (a.length) {
        const d = a.map((p, i) => (i ? 'L' : 'M') + p.x.toFixed(1) + ' ' + p.y.toFixed(1)).join(' ') + (n.closed ? ' Z' : '');
        g.appendChild(svgEl('path', {
          d, fill: 'none', stroke: ink, 'stroke-width': sw,
          'stroke-linecap': 'round', 'stroke-linejoin': 'round',
        }));
      }
    } else if (n.kind === 'pen' || n.kind === 'highlight') {
      const hi = n.kind === 'highlight';
      const ds = noteInkDs(n, W, H);
      if (ds.length) {
        const attrs = { fill: ink, stroke: 'none' };
        if (hi) { attrs['fill-opacity'] = 0.34; attrs.style = 'mix-blend-mode:multiply'; }
        for (const d of ds) g.appendChild(svgEl('path', Object.assign({ d }, attrs)));
      } else {
        /* The outline engine is vendored beside the layer; if it is ever
           missing the old centreline still draws the mark. */
        const fallback = inkPathD(inkStrokesPx(n, W, H), false);
        if (fallback) g.appendChild(svgEl('path', {
          d: fallback, fill: 'none', stroke: ink,
          'stroke-width': hi ? sw * 3.2 : sw,
          'stroke-linecap': 'round', 'stroke-linejoin': 'round',
          'stroke-opacity': hi ? 0.34 : 1,
          style: hi ? 'mix-blend-mode:multiply' : null,
        }));
      }
    } else if (n.kind === 'text' || n.kind === 'note') {
      if (lead) g.appendChild(tailNode(lead, ink));
      const box = textBlock(n, px(n.x, n.y, W, H), W, H, ink);
      if (box.bg) g.appendChild(box.bg);
      g.appendChild(box.text);
      if (box.dot) g.appendChild(svgEl('circle', { cx: box.p.x, cy: box.p.y, r: Math.max(2, box.size * 0.24), fill: ink }));
    } else if (n.kind === 'pin') {
      const p = px(n.x, n.y, W, H);
      const r = rel(0.013, H);
      g.appendChild(svgEl('circle', { cx: p.x, cy: p.y, r, fill: ink, 'fill-opacity': 0.92, stroke: '#fffdf7', 'stroke-width': Math.max(1, rel(0.0022, H)) }));
      const label = svgEl('text', {
        x: p.x, y: p.y + r * 0.42, 'text-anchor': 'middle', fill: '#fffdf7',
        'font-size': r * 1.15, class: 'anno-pin-num',
      });
      label.textContent = String(n.number || '');
      g.appendChild(label);
    } else if (n.kind === 'stamp') {
      const p = px(n.x, n.y, W, H);
      const size = rel(n.size || SIZE_STEPS[1], H);
      const w = size * (String(n.text || '').length * 0.66 + 0.9);
      g.appendChild(svgEl('rect', {
        x: p.x - w / 2, y: p.y - size * 0.85, width: w, height: size * 1.7, rx: size * 0.3,
        fill: 'none', stroke: ink, 'stroke-width': Math.max(1, rel(WIDTH_STEPS[0], H)),
      }));
      const t = svgEl('text', Object.assign({
        x: p.x, y: p.y + size * 0.4, 'text-anchor': 'middle', fill: ink,
        class: 'anno-stamp-text', direction: 'ltr',
      }, fontAttrs(n, size)));
      t.textContent = n.text || '';
      g.appendChild(t);
    } else if (n.kind === 'image') {
      const b = boxOf(n, W, H);
      const ready = imageReady(n);
      if (ready) {
        g.appendChild(svgEl('image', {
          href: ready.url, x: b.x, y: b.y,
          width: Math.max(1, b.w), height: Math.max(1, b.h),
          preserveAspectRatio: 'none', class: 'anno-image',
        }));
      } else {
        const e = imageEntry(n.fileId);
        g.appendChild(svgEl('rect', {
          x: b.x, y: b.y, width: Math.max(1, b.w), height: Math.max(1, b.h),
          rx: Math.min(8, b.w / 12), class: 'anno-image-void',
        }));
        const label = svgEl('text', {
          x: b.x + b.w / 2, y: b.y + b.h / 2, 'text-anchor': 'middle',
          'dominant-baseline': 'middle', direction: 'rtl', class: 'anno-image-void-text',
          'font-size': Math.max(10, rel(0.018, H)),
        });
        label.textContent = e && e.failed ? 'تصویر پیدا نشد' : 'بارگذاری تصویر…';
        g.appendChild(label);
      }
    }

    if (interactive) {
      g.setAttribute('tabindex', '0');
      /* The leader is thin ink too, and it is part of the note: clicking it
         must select the note, not fall through to the chart underneath. */
      if (lead) {
        g.insertBefore(svgEl('line', {
          x1: lead.from.x, y1: lead.from.y, x2: lead.to.x, y2: lead.to.y,
          class: 'anno-hit', 'stroke-width': Math.max(12, rel(0.016, H)),
        }), g.firstChild);
      }
      const hit = hitArea(n, W, H);
      if (hit) g.insertBefore(hit, g.firstChild);
    }
    return g;
  }

  /* Centred on purpose by default: an RTL run anchored to a left edge mirrors
     and walks off the mark it labels. A caption the reader moved to one side
     says so with `align`. */
  function labelNode(n, W, H, ink) {
    const size = rel(n.size || SIZE_STEPS[1], H);
    const at = labelAnchor(n, W, H);
    const t = svgEl('text', Object.assign({
      x: at.x, y: at.y, fill: ink, class: 'anno-label-text',
      'text-anchor': at.anchor, direction: detectDir(n.text),
    }, fontAttrs(n, size)));
    t.textContent = n.text || '';
    return t;
  }

  /* A transparent shape that makes thin ink clickable. */
  function hitArea(n, W, H) {
    const pad = Math.max(10, rel(0.012, H));
    if (n.kind === 'pen' || n.kind === 'highlight') {
      const d = inkPathD(inkStrokesPx(n, W, H), false);
      return d ? svgEl('path', { d, class: 'anno-hit', 'stroke-width': pad * 2, fill: 'none' }) : null;
    }
    if (n.kind === 'path' || n.kind === 'line' || n.kind === 'arrow') {
      const a = pointsOf(n, W, H);
      if (!a.length) return null;
      if (n.kind === 'path') {
        const d = a.map((p, i) => (i ? 'L' : 'M') + p.x.toFixed(1) + ' ' + p.y.toFixed(1)).join(' ') + (n.closed ? ' Z' : '');
        return svgEl('path', { d, class: 'anno-hit', 'stroke-width': pad * 2, fill: 'none' });
      }
      const p0 = a[0]; const p1 = a[1] || a[0];
      return svgEl('line', { x1: p0.x, y1: p0.y, x2: p1.x, y2: p1.y, class: 'anno-hit', 'stroke-width': pad * 2 });
    }
    const b = normBounds(n, W, H);
    return svgEl('rect', {
      x: Math.max(0, b.x * W - pad), y: Math.max(0, b.y * H - pad),
      width: Math.min(W, b.w * W + pad * 2), height: Math.min(H, b.h * H + pad * 2),
      class: 'anno-hit', fill: 'transparent',
    });
  }

  function describe(n) {
    const who = profile(n.author);
    const st = statusMeta(n.status).label;
    const body = (n.text || '').trim();
    const head = (who ? who.name : '') + ' · ' + stampTime(n.createdAt || Date.now());
    /* A mark with no text still says what it is, so the tooltip of a box is
       «چارچوب» and not an empty line. */
    const kind = body ? (KIND_LABEL[n.kind] || n.kind) : markLabel(n);
    return kind + (body ? ' · ' + body : '') + (n.locked ? ' · قفل' : '') + (st !== '—' ? ' · ' + st : '') + '\n' + head;
  }

  function markLabel(n) {
    if (n.kind === 'pin') return 'شمارهٔ ' + toFa(n.number || 0);
    if (n.kind === 'note') return 'یادداشتِ بی‌متن';
    if (n.kind === 'image') return n.name ? 'تصویرِ ' + n.name : 'تصویر';
    return KIND_LABEL[n.kind] || 'یادداشت';
  }

  /* What a mark is called when it has to be named in a sentence — a row, or
     the toast after it is deleted. */
  function previewOf(n, max) {
    const s = (n.text || markLabel(n)).replace(/\s+/g, ' ').trim();
    const cap = max || 84;
    return s.length > cap ? s.slice(0, cap - 1) + '…' : s;
  }

  /* ---------------------------------------------------------- the live layer */

  let layer = null;      // svg element
  let draft = null;      // the mark being drawn
  let inkTail = null;    // the last pen note a new stroke may still join
  let lastTap = null;    // the previous click, so a second one can mean “edit”
  let drag = null;       // move/resize/marquee session
  let sweep = null;      // marks removed by one held-down eraser
  let frame = null;      // selection frame + handle
  let guideGroup = null; // snap guides for the current move
  let marqueeNode = null;
  let quickEl = null;    // floating actions over the selection
  let menuEl = null;     // right-click menu
  let menuOpener = null; // where focus goes when the menu closes
  let clipboard = [];    // internal copy buffer
  let selectionUiWired = false;
  let raf = 0;
  let spaceDown = false; // Space turns any tool into a hand, as on every canvas
  let panRaf = 0;
  /* Touch pointers live on the layer while a tool is armed, and `touch-action:
     none` (rightly) stops the browser's own pinch. Two fingers therefore get a
     first-class zoom-and-pan gesture here; `suppressed` keeps the finger that
     started a stroke from drawing again once the pinch has taken over. */
  const touchPointers = new Map();
  const suppressedTouches = new Set();
  let pinch = null;

  function mountLayer() {
    const stage = document.getElementById('lbImageStage');
    if (!stage) return null;
    if (layer && layer.parentNode === stage) return layer;
    layer = svgEl('svg', { class: 'anno-layer', xmlns: NS });
    layer.setAttribute('aria-hidden', 'false');
    stage.appendChild(layer);
    wireLayer();
    return layer;
  }

  function plateSize() {
    const img = document.getElementById('lbImage');
    if (img && img.naturalWidth && img.naturalHeight) return { W: img.naturalWidth, H: img.naturalHeight };
    const p = state.plate || {};
    return { W: p.w || 1280, H: p.h || 720 };
  }

  /* A screen-pixel counted in plate units, so a hit target keeps the size the
     finger was given even when the plate is zoomed out to a stamp. */
  function unitsOf(cssPx) {
    const stage = document.getElementById('lbImageStage');
    const shown = stage ? stage.getBoundingClientRect().width : 0;
    const { W } = plateSize();
    if (!shown) return cssPx;
    return cssPx * W / shown;
  }

  /* Normalised position of a pointer event on the plate. Drawing and writing
     stay on the plate itself; `free` is for the board margin, where pictures
     are allowed to sit past the frame. */
  function normAt(e, free) {
    const stage = document.getElementById('lbImageStage');
    if (!stage) return null;
    const r = stage.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    let x = (e.clientX - r.left) / r.width;
    let y = (e.clientY - r.top) / r.height;
    if (free) {
      const lim = boardBox();
      x = clamp(x, lim.x0, lim.x1);
      y = clamp(y, lim.y0, lim.y1);
    } else {
      x = clamp01(x);
      y = clamp01(y);
    }
    return { x, y };
  }

  function renderLayer() {
    if (!layer) return;
    /* The wrapper remembers whether anything sits past the plate; the layer
       only opens its viewBox when there is a board to draw on. */
    setHasOutside();
    paintBoardPad();
    const { W, H } = plateSize();
    const m = boardOn() ? BOARD : 0;
    layer.setAttribute('viewBox', `${-m * W} ${-m * H} ${W * (1 + 2 * m)} ${H * (1 + 2 * m)}`);
    layer.setAttribute('preserveAspectRatio', 'none');
    while (layer.firstChild) layer.removeChild(layer.firstChild);
    inkLive = null;
    const set = state.set;
    if (!set) { paintFrame(); return; }
    const hidden = hiddenPasses();
    renumber(set, hidden);
    for (const pass of set.passes) {
      if (hidden.has(pass.id)) continue;
      const g = svgEl('g', { class: 'anno-pass', 'data-pass': pass.id });
      for (const n of pass.notes) g.appendChild(buildMark(n, W, H, {}));
      layer.appendChild(g);
    }
    if (draft) {
      /* A live pen stroke is the layer's own path, not a rebuilt mark: the
         sample array grows every move and the outline must follow it without
         a full mark being built underneath it. */
      if (isInkKind(draft.kind)) scheduleLiveInk();
      else {
        layer.appendChild(buildMark(draft, W, H, { static: true }));
        if (draft.kind === 'path' && draft.building) layer.appendChild(pathDraftOverlay(W, H));
      }
    }
    paintFrame();
    /* The viewer opens before a big plate has decoded, so the first real
       measurement of the stage is the moment the board can be centred. */
    if (state.centerPending) {
      const img = document.getElementById('lbImage');
      const stage = document.getElementById('lbImageStage');
      const sized = img && img.complete && img.naturalWidth && stage && !stage.classList.contains('is-void');
      if (sized) {
        state.centerPending = false;
        requestAnimationFrame(centerBoard);
      }
    }
  }

  /* Pins are numbered in plate order, so a mark and its row in the list always
     say the same number. Hidden passes are skipped: the reader sees what shows. */
  function renumber(set, hidden) {
    let i = 0;
    for (const pass of set.passes) {
      if (hidden.has(pass.id)) continue;
      for (const n of pass.notes) if (n.kind === 'pin') n.number = ++i;
    }
  }

  function hiddenPasses() {
    const hidden = new Set();
    const set = state.set;
    if (set && Array.isArray(set.hidden)) for (const id of set.hidden) hidden.add(id);
    return hidden;
  }

  function togglePassHidden(passId) {
    const set = state.set;
    if (!set) return;
    if (!Array.isArray(set.hidden)) set.hidden = [];
    const i = set.hidden.indexOf(passId);
    if (i >= 0) set.hidden.splice(i, 1);
    else set.hidden.push(passId);
    touch();
    renderLayer();
    renderList();
  }

  function paintFrame() {
    if (!layer) return;
    if (frame && frame.parentNode) frame.parentNode.removeChild(frame);
    frame = null;
    const found = selectedNotes();
    if (!found.length) { paintQuick(); return; }
    const { W, H } = plateSize();
    const locked = found.length === 1 && !!found[0].note.locked;
    /* One frame around everything, so a shift-clicked pile reads as one
       selection and moves as one. */
    let x0 = 1, y0 = 1, x1 = 0, y1 = 0;
    for (const f of found) {
      const b = normBounds(f.note, W, H);
      x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y);
      x1 = Math.max(x1, b.x + b.w); y1 = Math.max(y1, b.y + b.h);
    }
    const pad = Math.max(6, rel(0.008, H));
    frame = svgEl('g', { class: 'anno-frame' + (found.length > 1 ? ' is-multi' : '') + (locked ? ' is-locked' : '') });
    /* No clipping to the plate: the frame has to follow a picture that was
       parked in the margin. */
    frame.appendChild(svgEl('rect', {
      x: x0 * W - pad, y: y0 * H - pad,
      width: (x1 - x0) * W + pad * 2, height: (y1 - y0) * H + pad * 2,
      rx: 3,
    }));
    if (found.length === 1 && !locked) {
      const n = found[0].note;
      for (const grip of resizeHandles(n, W, H)) {
        const s = Math.max(10, rel(0.012, H));
        const hs = Math.max(s, unitsOf(26));
        const say = n.kind === 'line'
          ? (grip.handle === 'start' ? 'سرِ ابتدای خط را بکش' : 'سرِ انتهای خط را بکش')
          : n.kind === 'arrow' && grip.handle === 'start'
            ? 'دمِ پیکان را بکش؛ با X سرِ پیکان را به آن سرِ دیگر ببر'
            : n.kind === 'arrow' ? 'سرِ پیکان را بکش'
            : n.kind === 'image' ? 'اندازه را تغییر بده — نسبتِ تصویر حفظ می‌شود'
            : 'اندازه را تغییر بده';
        const hit = svgEl('rect', {
          x: grip.x * W - hs / 2, y: grip.y * H - hs / 2, width: hs, height: hs,
          class: 'anno-handle anno-handle-hit', 'data-handle': grip.handle,
        });
        const ht = svgEl('title');
        ht.textContent = say;
        hit.appendChild(ht);
        frame.appendChild(hit);
        const knob = svgEl('rect', {
          x: grip.x * W - s / 2, y: grip.y * H - s / 2, width: s, height: s,
          class: 'anno-handle', 'data-handle': grip.handle, rx: 2,
        });
        const kt = svgEl('title');
        kt.textContent = say;
        knob.appendChild(kt);
        frame.appendChild(knob);
      }
      /* A second handle, and a different shape on purpose: a square drags a
         size, a circle drags the point the note is about. It is there whether or
         not a tail exists yet, so pulling one out is the same gesture as moving
         it, and the grip is only ever shown on the selected note. */
      const tail = tailGrip(n, W, H);
      if (tail) {
        const r = Math.max(6, rel(0.008, H));
        const hint = tailOf(n) ? 'نوکِ دُم را جابه‌جا کن؛ داخلِ جعبه رها کن تا برداشته شود' : 'از اینجا بکش تا یادداشت به آن نقطه وصل شود';
        const hit = svgEl('circle', {
          cx: tail.x * W, cy: tail.y * H, r: Math.max(r * 2, unitsOf(13)),
          class: 'anno-handle anno-tail-grip anno-handle-hit', 'data-handle': 'tail',
        });
        const ht = svgEl('title');
        ht.textContent = hint;
        hit.appendChild(ht);
        frame.appendChild(hit);
        const knob = svgEl('circle', { cx: tail.x * W, cy: tail.y * H, r, class: 'anno-handle anno-tail-grip', 'data-handle': 'tail' });
        const gt = svgEl('title');
        gt.textContent = hint;
        knob.appendChild(gt);
        frame.appendChild(knob);
      }
    }
    /* A multi-selection says how many it holds; a locked mark says why its
       grips are gone. */
    const badge = found.length > 1 ? toFa(found.length) : locked ? 'قفل' : '';
    if (badge) {
      const size = rel(0.021, H);
      const bw = size * (badge.length * 0.62 + 0.7);
      const lim = boardBox();
      const bx = Math.min(lim.x1 * W - bw / 2, x1 * W + pad);
      const by = Math.max(lim.y0 * H + size, y0 * H - pad - size * 0.65);
      const bg = svgEl('rect', {
        x: bx - bw / 2, y: by - size, width: bw, height: size * 1.5, rx: size * 0.75,
        class: 'anno-frame-badge',
      });
      frame.appendChild(bg);
      const label = svgEl('text', {
        x: bx, y: by - size * 0.18, 'text-anchor': 'middle', 'font-size': size * 0.95,
        class: 'anno-frame-badge-text', direction: 'rtl',
      });
      label.textContent = badge;
      frame.appendChild(label);
    }
    layer.appendChild(frame);
    paintGuides();
    paintQuick();
  }

  function paintSelectionClasses() {
    if (!layer) return;
    for (const g of layer.querySelectorAll('.anno-mark')) {
      g.classList.toggle('is-selected', isSelected(g.getAttribute('data-id')));
    }
  }

  /* Two thin cyan lines say which edge the move locked onto. They live in
     their own group so a full layer rebuild does not leave them behind. */
  function paintGuides() {
    if (guideGroup && guideGroup.parentNode) guideGroup.parentNode.removeChild(guideGroup);
    guideGroup = null;
    if (!layer || !drag || !drag.guides) return;
    const { W, H } = plateSize();
    guideGroup = svgEl('g', { class: 'anno-guides' });
    if (drag.guides.x !== null && drag.guides.x !== undefined) {
      guideGroup.appendChild(svgEl('line', {
        x1: drag.guides.x * W, y1: 0, x2: drag.guides.x * W, y2: H, class: 'anno-guide',
      }));
    }
    if (drag.guides.y !== null && drag.guides.y !== undefined) {
      guideGroup.appendChild(svgEl('line', {
        x1: 0, y1: drag.guides.y * H, x2: W, y2: drag.guides.y * H, class: 'anno-guide',
      }));
    }
    layer.appendChild(guideGroup);
  }

  /* A drag on the empty plate is a rubber band, not a lost click. It reads the
     same normalized bounds the frame uses, so what looks inside is inside. */
  function startMarquee(e) {
    const p = normAt(e, true);
    if (!p) return;
    const additive = e.shiftKey || e.metaKey || e.ctrlKey;
    if (!additive) { clearSelection(); paintSelectionClasses(); }
    try { layer.setPointerCapture(e.pointerId); } catch { /* older engines */ }
    drag = {
      mode: 'marquee', from: p, at: p, moved: false, pointerId: e.pointerId,
      base: additive ? state.selection.slice() : [],
    };
    if (!marqueeNode) {
      marqueeNode = svgEl('rect', { class: 'anno-marquee', rx: 2 });
      layer.appendChild(marqueeNode);
    }
    paintFrame();
    paintTools();
  }

  function moveMarquee(e) {
    if (!drag || drag.mode !== 'marquee') return;
    const p = normAt(e, true);
    if (!p) return;
    drag.at = p;
    if (!drag.moved && Math.hypot(p.x - drag.from.x, p.y - drag.from.y) < 0.004) return;
    drag.moved = true;
    const r = {
      x0: Math.min(drag.from.x, p.x), y0: Math.min(drag.from.y, p.y),
      x1: Math.max(drag.from.x, p.x), y1: Math.max(drag.from.y, p.y),
    };
    if (marqueeNode) {
      const { W, H } = plateSize();
      marqueeNode.setAttribute('x', r.x0 * W);
      marqueeNode.setAttribute('y', r.y0 * H);
      marqueeNode.setAttribute('width', (r.x1 - r.x0) * W);
      marqueeNode.setAttribute('height', (r.y1 - r.y0) * H);
    }
    const { W, H } = plateSize();
    const hidden = hiddenPasses();
    const ids = drag.base.slice();
    for (const pass of (state.set ? state.set.passes : [])) {
      if (hidden.has(pass.id)) continue;
      for (const n of pass.notes) {
        if (ids.indexOf(n.id) >= 0) continue;
        const b = normBounds(n, W, H);
        if (b.x <= r.x1 && b.x + b.w >= r.x0 && b.y <= r.y1 && b.y + b.h >= r.y0) ids.push(n.id);
      }
    }
    state.selection = ids;
    paintSelectionClasses();
    paintFrame();
  }

  function endMarquee() {
    const moved = !!(drag && drag.moved);
    drag = null;
    if (marqueeNode && marqueeNode.parentNode) marqueeNode.parentNode.removeChild(marqueeNode);
    marqueeNode = null;
    if (!moved) { /* a plain click on the plate already cleared it */ }
    paintSelectionClasses();
    paintFrame();
    paintTools();
    syncRowSelection();
  }

  /* ------------------------------------------------------------- panning

     The plate is often bigger than the pane while a tool is in the hand, and
     until now the only ways to reach the far corner were the scrollbars and
     the arrow keys. A drag on empty plate pans when there is anywhere to go —
     the picture follows the hand, one scroll write per frame, exactly like the
     viewer's own drag. Shift-drag still draws the selection band, and holding
     Space (or pressing the middle button) pans no matter which tool is active,
     which is the gesture every canvas editor teaches. */
  const panScroll = () => {
    const scroll = document.getElementById('lbImageScroll');
    if (!scroll) return null;
    const more = scroll.scrollWidth - scroll.clientWidth > 1
      || scroll.scrollHeight - scroll.clientHeight > 1;
    return more ? scroll : null;
  };

  const flushPan = () => {
    panRaf = 0;
    if (!drag || drag.mode !== 'pan') return;
    const scroll = document.getElementById('lbImageScroll');
    if (!scroll) return;
    scroll.scrollLeft = drag.left;
    scroll.scrollTop = drag.top;
  };

  function startPan(e) {
    const scroll = panScroll();
    if (!scroll) return false;
    try { layer.setPointerCapture(e.pointerId); } catch { /* older engines */ }
    drag = {
      mode: 'pan', pointerId: e.pointerId, x: e.clientX, y: e.clientY,
      left: scroll.scrollLeft, top: scroll.scrollTop,
      startLeft: scroll.scrollLeft, startTop: scroll.scrollTop, moved: false,
    };
    layer.classList.add('is-panning');
    e.preventDefault();
    return true;
  }

  function movePan(e) {
    if (!drag || drag.mode !== 'pan' || drag.pointerId !== e.pointerId) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    if (!drag.moved && Math.abs(dx) + Math.abs(dy) > 2) drag.moved = true;
    drag.left = drag.startLeft - dx;
    drag.top = drag.startTop - dy;
    if (!panRaf) panRaf = requestAnimationFrame(flushPan);
    e.preventDefault();
  }

  function endPan() {
    if (panRaf) { cancelAnimationFrame(panRaf); flushPan(); }
    const tapped = !!(drag && !drag.moved);
    drag = null;
    if (layer) layer.classList.remove('is-panning');
    if (tapped) {
      clearSelection();
      paintSelectionClasses();
      paintFrame();
      paintTools();
      syncRowSelection();
    }
  }

  /* ------------------------------------------------------- two-finger zoom
     The plate is a chart: on a phone the reader needs to pinch into a candle
     cluster and slide the paper under the fingers, exactly as in the viewer's
     own pinch. A second touch cancels the half-started stroke (nobody meant to
     draw the first 80 ms of a pinch), then the gesture zooms around the
     previous midpoint and pans by however far that midpoint travelled, so the
     content stays glued to the fingers at every scale. */
  const touchMid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const touchDist = (a, b) => Math.max(1, Math.hypot(a.x - b.x, a.y - b.y));

  function beginPinch() {
    const api = window.RTM_VIEWER;
    if (!api || touchPointers.size < 2) return;
    /* Drop the stroke, marquee or move the first finger had begun; a pinch is
       never also a drawing. */
    if (draft) {
      draft = null;
      clearLiveInk();
      inkCursor = null;
    }
    if (drag) {
      /* A second finger during a move/resize means the gesture was a pinch,
         not an edit: put the marks back where they were. */
      const restore = drag.moved && (drag.mode === 'move' || drag.mode === 'resize' || drag.mode === 'tail');
      if (drag.pointerId !== undefined) { try { layer.releasePointerCapture(drag.pointerId); } catch { /* already gone */ } }
      if (drag.mode === 'marquee' && marqueeNode && marqueeNode.parentNode) marqueeNode.parentNode.removeChild(marqueeNode);
      if (drag.mode === 'marquee') marqueeNode = null;
      drag = null;
      if (restore) undo();
    }
    if (sweep) endSweep();
    for (const id of touchPointers.keys()) suppressedTouches.add(id);
    const [a, b] = [...touchPointers.values()];
    pinch = {
      dist: touchDist(a, b),
      mid: touchMid(a, b),
      scale: api.getScale(),
    };
    layer.classList.add('is-panning');
    renderLayer();
  }

  function movePinch() {
    const api = window.RTM_VIEWER;
    if (!pinch || !api || touchPointers.size < 2) return;
    const [a, b] = [...touchPointers.values()];
    const mid = touchMid(a, b);
    const scale = pinch.scale * (touchDist(a, b) / pinch.dist);
    /* Anchor on the previous midpoint, then translate by the midpoint's own
       travel: zoom first, pan second, so a stationary pinch does not drift. */
    api.setZoom(scale, pinch.mid);
    api.panBy(pinch.mid.x - mid.x, pinch.mid.y - mid.y);
    pinch.dist = touchDist(a, b);
    pinch.mid = mid;
    pinch.scale = api.getScale();
  }

  function endPinch() {
    pinch = null;
    if (layer) layer.classList.remove('is-panning');
  }

  /* Closing the plate or leaving the mode can land between the two downs of a
     gesture; stale ids would make the next single finger look like a pinch. */
  function resetTouches() {
    touchPointers.clear();
    suppressedTouches.clear();
    endPinch();
  }

  /* Where the grips for this kind sit, in normalised units, and which one each
     is. An arrow gets two because either end may be the one the reader meant to
     move — with a single tip grip, an arrow that points the wrong way can only
     be deleted and redrawn. A pen or a pin has nothing to resize, so it gets no
     grip rather than a dead one. */
  function resizeHandles(n, W, H) {
    if (n.locked) return [];
    const b = normBounds(n, W, H);
    if (n.kind === 'arrow' || n.kind === 'line') {
      const a = n.pts || [];
      if (a.length < 2) return [];
      return [{ x: a[0][0], y: a[0][1], handle: 'start' }, { x: a[1][0], y: a[1][1], handle: 'end' }];
    }
    if (n.kind === 'rect' || n.kind === 'ellipse' || n.kind === 'note' || n.kind === 'image') {
      return [{ x: b.x + b.w, y: b.y + b.h, handle: 'end' }];
    }
    return [];
  }

  function wireLayer() {
    layer.addEventListener('pointerdown', onLayerDown);
    layer.addEventListener('pointermove', onLayerMove);
    layer.addEventListener('pointerup', onLayerUp);
    layer.addEventListener('pointercancel', onLayerUp);
    layer.addEventListener('dblclick', (e) => {
      const g = e.target.closest('.anno-mark');
      if (!g) return;
      e.preventDefault(); e.stopPropagation();
      /* Drawing tools own the gesture (a pen double-tap is two dots), and the
         manual second-click test has usually opened the editor already. */
      if (prefs.tool !== 'select') return;
      const id = g.getAttribute('data-id');
      if (editor && !editor.hidden && editor.dataset.id === id) return;
      openMark(id, e.clientX, e.clientY);
    });
    layer.addEventListener('keydown', (e) => {
      const g = e.target.closest ? e.target.closest('.anno-mark') : null;
      if (!g) return;
      const id = g.getAttribute('data-id');
      if (e.key === 'Enter') { e.preventDefault(); openEditor(id); }
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); select(id); removeSelected(); }
    });
    layer.addEventListener('contextmenu', onLayerContext);
  }

  function ownsPointer() {
    return !!layer && layer.classList.contains('is-capturing');
  }

  function onLayerDown(e) {
    const middle = e.pointerType === 'mouse' && e.button === 1;
    if (e.pointerType === 'mouse' && e.button !== 0 && !middle) return;
    e.stopPropagation();
    if (e.pointerType === 'touch') {
      if (suppressedTouches.has(e.pointerId)) { e.preventDefault(); return; }
      touchPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (touchPointers.size >= 2) {
        if (!pinch) beginPinch();
        e.preventDefault();
        return;
      }
    }
    /* Space and the middle button are a hand in every tool: they never draw,
       never erase and never touch the selection. */
    if ((middle || spaceDown) && startPan(e)) return;
    const target = e.target;
    if (target.classList && target.classList.contains('anno-handle')) {
      startResize(e, target.getAttribute('data-handle'));
      return;
    }
    const g = target.closest ? target.closest('.anno-mark') : null;
    const id = g ? g.getAttribute('data-id') : '';
    if (prefs.tool === 'erase') {
      /* Held down, the eraser is a sweep: one stroke, one undo for the whole
         line of marks it crosses. The reach is counted in screen pixels so the
         brush feels the same at every zoom, then converted to plate units. */
      const { W, H } = plateSize();
      sweep = { ids: new Set(), at: null, reach: Math.max(rel(0.006, H), unitsOf(9)), shapes: [] };
      const hidden = hiddenPasses();
      for (const pass of (state.set ? state.set.passes : [])) {
        if (hidden.has(pass.id)) continue;
        for (const n of pass.notes) {
          if (n.locked) continue;   // a locked mark is not ink under the hand
          const shape = eraseShapeOf(n, W, H);
          if (shape) sweep.shapes.push(shape);
        }
      }
      try { layer.setPointerCapture(e.pointerId); } catch { /* older engines */ }
      eraseAlong(e);
      return;
    }
    if (prefs.tool === 'select') {
      const additive = e.shiftKey || e.metaKey || e.ctrlKey;
      const now = Date.now();
      /* The second click belongs to the mark, not to the chart: opening the
         editor (or the full action menu for a mark without words) is what a
         double click means everywhere else in this app. */
      if (!additive && id && lastTap && lastTap.id === id
        && now - lastTap.at < 420
        && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 9) {
        lastTap = null;
        openMark(id, e.clientX, e.clientY);
        return;
      }
      lastTap = id && !additive ? { id, at: now, x: e.clientX, y: e.clientY } : null;
      if (!id) {
        if (additive) { startMarquee(e); return; }
        /* An empty drag moves the picture when there is somewhere to move it
           to; with the whole plate on screen it keeps meaning "select a box". */
        if (startPan(e)) {
          clearSelection();
          paintSelectionClasses();
          paintFrame();
          paintTools();
          return;
        }
        startMarquee(e);
        return;
      }
      if (additive) { toggleInSelection(id); paintSelectionClasses(); paintFrame(); return; }
      /* Dragging one of several selected marks must not throw the rest away:
         the pile moves together, exactly like a group. */
      if (!isSelected(id)) writeSelection([id]);
      startMove(e, id);
      return;
    }
    /* A path is built click by click, so it owns pointerdown itself and never
       enters the drag-to-draw draft that ends on pointerup. */
    if (prefs.tool === 'path') { pathDown(e); return; }
    startDraw(e, id);
  }

  /* The pointer in plate pixels; the eraser tests geometry, never screen
     elements, so nothing between two pointer samples can be skipped. */
  function platePoint(e) {
    const p = normAt(e, true);
    if (!p) return null;
    const { W, H } = plateSize();
    return { x: p.x * W, y: p.y * H };
  }

  function eraseAlong(e) {
    if (!sweep || !state.set) return;
    const p = platePoint(e);
    if (!p) return;
    const from = sweep.at || p;
    sweep.at = p;
    const hits = [];
    for (const shape of sweep.shapes) {
      if (sweep.ids.has(shape.id)) continue;
      if (eraseHit(shape, from.x, from.y, p.x, p.y, sweep.reach)) hits.push(shape.id);
    }
    if (!hits.length) return;
    if (!sweep.ids.size) pushUndo();
    const gone = new Set(hits);
    for (const id of gone) sweep.ids.add(id);
    for (const pass of state.set.passes) {
      const removed = pass.notes.filter(n => gone.has(n.id));
      if (removed.length) trashPush(state.set, pass.id, removed);
      pass.notes = pass.notes.filter(n => !gone.has(n.id));
    }
    const left = state.selection.filter(id => !gone.has(id));
    if (left.length !== state.selection.length) { state.selection = left; paintFrame(); paintTools(); }
    /* Take the marks off the plate now and rebuild the layer once, when the
       gesture ends. Rebuilding all marks per erased object was the reason a
       sweep slowed down as the drawing grew. */
    for (const g of layer.querySelectorAll('.anno-mark')) {
      if (gone.has(g.getAttribute('data-id'))) g.remove();
    }
    touch();
  }

  function endSweep() {
    if (!sweep) return;
    const n = sweep.ids.size;
    sweep = null;
    if (!n) return;
    /* One exact rebuild settles pin numbers, titles and the list at once. */
    renumber(state.set, hiddenPasses());
    renderLayer();
    renderList();
    paintTools();
    toast(toFa(n) + ' یادداشت پاک شد', { label: 'بازگردانی', onClick: undo });
  }

  function onLayerMove(e) {
    if (e.pointerType === 'touch') {
      if (touchPointers.has(e.pointerId)) touchPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pinch) { movePinch(); e.preventDefault(); e.stopPropagation(); return; }
      if (suppressedTouches.has(e.pointerId)) return;
    }
    if (sweep) { eraseAlong(e); return; }
    if (drag && drag.mode === 'pan') { movePan(e); return; }
    if (drag && drag.mode === 'marquee') { moveMarquee(e); return; }
    if (!drag && !draft) return;
    const p = normAt(e, !!drag);
    if (!p) return;
    e.stopPropagation();
    if (drag) { applyDrag(p, e); return; }
    extendDraft(p, e);
  }

  function onLayerUp(e) {
    if (e.pointerType === 'touch') {
      touchPointers.delete(e.pointerId);
      if (pinch) {
        if (touchPointers.size < 2) endPinch();
        e.preventDefault();
        return;
      }
      if (suppressedTouches.delete(e.pointerId)) {
        if (!touchPointers.size) suppressedTouches.clear();
        e.preventDefault();
        return;
      }
    }
    if (sweep) { endSweep(); return; }
    if (drag && drag.mode === 'pan') { endPan(); return; }
    if (drag && drag.mode === 'marquee') { endMarquee(); return; }
    if (drag) { endDrag(); return; }
    if (draft && draft.kind === 'path' && draft.building) return;
    if (draft) { commitDraft(); }
  }

  function grab(e, id) {
    const p = normAt(e, true);
    const found = findNote(state.set, id);
    if (!p || !found) return null;
    try { layer.setPointerCapture(e.pointerId); } catch { /* older engines let the pointer leave */ }
    return { p, found, pointerId: e.pointerId };
  }

  function startMove(e, id) {
    if (!state.set) return;
    const p = normAt(e, true);
    if (!p) return;
    const ids = state.selection.filter(sid => {
      const f = findNote(state.set, sid);
      return f && !f.note.locked;
    });
    if (!ids.length) {
      const f = findNote(state.set, id);
      if (f && f.note.locked) toast('این یادداشت قفل است — اول بازش کنید');
      return;
    }
    try { layer.setPointerCapture(e.pointerId); } catch { /* older engines let the pointer leave */ }
    const { W, H } = plateSize();
    const items = ids.map(sid => {
      const n = findNote(state.set, sid).note;
      return {
        note: n, x: n.x, y: n.y,
        pts: (n.pts || []).map(q => q.slice()),
        strokes: n.strokes ? n.strokes.map(s => s.map(q => q.slice())) : null,
        b: normBounds(n, W, H),
      };
    });
    let x0 = 1, y0 = 1, x1 = 0, y1 = 0;
    for (const it of items) {
      x0 = Math.min(x0, it.b.x); y0 = Math.min(y0, it.b.y);
      x1 = Math.max(x1, it.b.x + it.b.w); y1 = Math.max(y1, it.b.y + it.b.h);
    }
    drag = {
      mode: 'move', from: p, moved: false, pointerId: e.pointerId, items,
      bounds: { x0, y0, x1, y1 }, snap: snapTargets(new Set(ids)),
    };
  }

  /* Edges and centres of everything else on the plate, plus the three plate
     lines. Snap targets are frozen when the drag starts so a big pass does not
     re-measure itself on every pointer sample. */
  function snapTargets(exclude) {
    const { W, H } = plateSize();
    const out = { x: [0, 0.5, 1], y: [0, 0.5, 1] };
    const hidden = hiddenPasses();
    for (const pass of (state.set ? state.set.passes : [])) {
      if (hidden.has(pass.id)) continue;
      for (const n of pass.notes) {
        if (exclude.has(n.id)) continue;
        const b = normBounds(n, W, H);
        out.x.push(b.x, b.x + b.w / 2, b.x + b.w);
        out.y.push(b.y, b.y + b.h / 2, b.y + b.h);
      }
    }
    return out;
  }

  function snapDelta(d, dx, dy) {
    const stage = document.getElementById('lbImageStage');
    const r = stage ? stage.getBoundingClientRect() : null;
    const thx = r && r.width ? 7 / r.width : 0;
    const thy = r && r.height ? 7 / r.height : 0;
    const b = d.bounds;
    const edgesX = [b.x0 + dx, (b.x0 + b.x1) / 2 + dx, b.x1 + dx];
    const edgesY = [b.y0 + dy, (b.y0 + b.y1) / 2 + dy, b.y1 + dy];
    let bestX = null, bestY = null;
    for (const target of d.snap.x) {
      for (const edge of edgesX) {
        const delta = target - edge;
        if (Math.abs(delta) <= thx && (!bestX || Math.abs(delta) < Math.abs(bestX.delta))) bestX = { delta, at: target };
      }
    }
    for (const target of d.snap.y) {
      for (const edge of edgesY) {
        const delta = target - edge;
        if (Math.abs(delta) <= thy && (!bestY || Math.abs(delta) < Math.abs(bestY.delta))) bestY = { delta, at: target };
      }
    }
    return {
      dx: dx + (bestX ? bestX.delta : 0),
      dy: dy + (bestY ? bestY.delta : 0),
      guides: bestX || bestY ? { x: bestX ? bestX.at : null, y: bestY ? bestY.at : null } : null,
    };
  }

  /* The size a grip drag starts from. Only the kinds that get a grip reach
     here, and each stores its size differently: a box in w/h, a note in w
     alone (its height is the wrapped text), an arrow in pts. */
  function resizeStart(n) {
    if (n.kind === 'arrow' || n.kind === 'line') return { w: 0, h: 0 };
    /* A note hugs its words, so the stored width can be wider than what is
       seen. The grip starts from the visible width or the first drag would
       move nothing until it ate up that hidden slack. */
    if (n.kind === 'note') {
      const { W, H } = plateSize();
      const t = textLayout(n, W, H);
      return { w: clamp(t.boxW / W, 0.08, 0.6), h: 0 };
    }
    return { w: n.w || 0.02, h: n.h || 0.02 };
  }

  function startResize(e, handle) {
    const id = state.selected;
    const s = grab(e, id);
    if (!s) return;
    const n = s.found.note;
    if (n.locked) return;
    if (handle === 'tail') {
      const tl = tailOf(n);
      drag = {
        mode: 'tail', note: n, from: s.p, moved: false, pointerId: s.pointerId,
        start: { tail: tl ? tl.slice() : null },
      };
      return;
    }
    const start = resizeStart(n);
    drag = {
      mode: 'resize', note: n, from: s.p, moved: false, handle: handle || 'end',
      start: { w: start.w, h: start.h, pts: (n.pts || []).map(q => q.slice()) },
    };
  }

  function applyDrag(p, e) {
    if (!drag) return;
    let dx = p.x - drag.from.x;
    let dy = p.y - drag.from.y;
    if (!drag.moved && Math.hypot(dx, dy) < 0.004) return;
    if (drag.mode === 'move' && drag.snap && !(e && e.altKey)) {
      const sn = snapDelta(drag, dx, dy);
      dx = sn.dx; dy = sn.dy; drag.guides = sn.guides;
    } else if (drag.mode !== 'tail') {
      drag.guides = null;
    }
    if (!drag.moved) { pushUndo(); drag.moved = true; }
    if (drag.mode === 'tail') {
      /* The tip lands exactly under the hand. The leader is not stored — it is
         recomputed from the box every frame, so it always leaves from the edge
         that faces the target and never crosses its own words. */
      const n = drag.note;
      n.tail = [clamp01(p.x), clamp01(p.y)];
      scheduleRender();
      return;
    }
    if (drag.mode === 'resize') {
      /* The grip means different things per kind: a box grows both ways, a note
         only widens (its height comes from the wrapped text), an arrow moves its
         tip. */
      const n = drag.note;
      if ((n.kind === 'arrow' || n.kind === 'line') && drag.start.pts.length > 1) {
        const i = drag.handle === 'start' ? 0 : 1;
        n.pts = drag.start.pts.map((q, j) => (j === i ? [clamp01(q[0] + dx), clamp01(q[1] + dy)] : q.slice()));
      } else if (n.kind === 'note') {
        n.w = clamp(drag.start.w + dx, 0.08, 0.6);
      } else if (n.kind === 'image') {
        /* A picture keeps its own proportions: the grip scales it, it does not
           stretch it. Space left on the plate caps the growth on both axes. */
        const aspect = drag.start.w / Math.max(1e-6, drag.start.h);
        const byX = drag.start.w + dx;
        const byY = (drag.start.h + dy) * aspect;
        let w = Math.abs(dx) >= Math.abs(dy) ? byX : byY;
        w = Math.max(0.03, w);
        let h = w / aspect;
        /* A picture may grow into the board margin, so the ceiling is the
           edge of the work space rather than the edge of the chart. */
        const lim = boardBox();
        const maxW = Math.max(0.03, lim.x1 - n.x);
        const maxH = Math.max(0.03, lim.y1 - n.y);
        if (w > maxW) { w = maxW; h = w / aspect; }
        if (h > maxH) { h = maxH; w = h * aspect; }
        n.w = w; n.h = h;
      } else {
        n.w = clamp(drag.start.w + dx, 0.012, 1);
        n.h = clamp(drag.start.h + dy, 0.012, 1);
      }
      scheduleRender();
      return;
    }
    /* One offset for the whole pile, each mark keeping its own geometry. */
    for (const it of drag.items) {
      const n = it.note;
      if (n.strokes && it.strokes) {
        n.strokes = it.strokes.map(s => s.map(q => [clamp01(q[0] + dx), clamp01(q[1] + dy)]));
      } else if (n.kind === 'pen' || n.kind === 'arrow' || n.kind === 'line'
        || n.kind === 'path' || n.kind === 'highlight') {
        n.pts = it.pts.map(q => [clamp01(q[0] + dx), clamp01(q[1] + dy)]);
      } else if (n.kind === 'image') {
        /* Pictures are the only marks allowed past the plate: the board margin
           is where reference material belongs. The far edge keeps the whole
           picture on the board instead of letting it slide out of reach. */
        const lim = boardBox();
        n.x = clamp(it.x + dx, lim.x0, Math.max(lim.x0, lim.x1 - (n.w || 0)));
        n.y = clamp(it.y + dy, lim.y0, Math.max(lim.y0, lim.y1 - (n.h || 0)));
      } else {
        n.x = clamp01(it.x + dx);
        n.y = clamp01(it.y + dy);
        /* The box and the point it talks about are two anchors: moving the
           words leaves the leader's tip on the candle it was set on, and the
           line is re-routed from the edge facing it. Only the round grip moves
           the tip, so neither needs re-adjusting after the other moves. */
      }
    }
    scheduleRender();
  }

  function endDrag() {
    const d = drag;
    if (d && d.mode === 'tail' && d.moved) {
      const { W, H } = plateSize();
      /* Releasing the tip on its own box un-makes the tail: a leader that
         points at the note it belongs to says nothing. */
      if (tailInsideBox(d.note, W, H)) {
        d.note.tail = null;
        if (!d.start.tail) {
          state.undo.pop();   // an edit abandoned before it went anywhere
          drag = null;
          renderLayer();
          return;
        }
        toast('دُم برداشته شد', { label: 'بازگردانی', onClick: undo });
      }
    }
    if (drag && drag.moved) touch();
    const moved = !!(drag && drag.moved);
    if (drag && drag.pointerId !== undefined) { try { layer.releasePointerCapture(drag.pointerId); } catch { /* already gone */ } }
    drag = null;
    /* A click that only selected a mark must leave the DOM alone. Rebuilding
       the layer between the two clicks replaced the node under the pointer and
       the browser never reported the double click — the editor never opened. */
    if (moved) renderLayer();
  }

  function clamp01(v) { return Math.min(Math.max(v, 0), 1); }

  /* A new stroke joins the last pen note when it lands close in time and space:
     that is what turns letters, dots and crossings into one handwritten word.
     A pause, a colour change or a mark far away starts a fresh object. */
  function recentInkTarget(p, sw) {
    if (!inkTail || !state.set) return null;
    if (Date.now() - inkTail.at > INK_JOIN_MS) return null;
    const found = findNote(state.set, inkTail.id);
    if (!found || found.note.locked) return null;
    const n = found.note;
    if (n.kind !== prefs.tool || !sameInk(n.color, prefs.ink)) return null;
    if (Math.abs((n.sw || WIDTH_STEPS[1]) - sw) > 1e-9) return null;
    const pass = activePass(state.set);
    if (!pass || pass.id !== found.pass.id) return null;
    const { W, H } = plateSize();
    const b = normBounds(n, W, H);
    const gap = rel(INK_JOIN_GAP, H);
    const x = p.x * W, y = p.y * H;
    if (x < b.x * W - gap || x > (b.x + b.w) * W + gap) return null;
    if (y < b.y * H - gap || y > (b.y + b.h) * H + gap) return null;
    return n.id;
  }

  function startDraw(e) {
    const p = normAt(e);
    if (!p) return;
    try { layer.setPointerCapture(e.pointerId); } catch { /* see above */ }
    const size = SIZE_STEPS[prefs.size] || SIZE_STEPS[1];
    const sw = WIDTH_STEPS[prefs.width] || WIDTH_STEPS[1];
    const base = {
      id: uid(), kind: prefs.tool, color: prefs.ink, sw, size,
      author: prefs.activeProfile, createdAt: Date.now(), status: '', tags: [],
    };
    if (prefs.tool === 'pen' || prefs.tool === 'highlight') {
      const join = recentInkTarget(p, sw);
      draft = Object.assign(base, {
        pts: [[p.x, p.y, pressureAt(e)]],
        stylus: e.pointerType === 'pen',
      });
      if (join) draft.mergeInto = join;
      draft.origin = p;
      inkCursor = { x: e.clientX, y: e.clientY };
      /* The hand must not wait for the layer. The old selection comes off and
         the live outline follows the pointer on its own frame; the note is
         rebuilt once, when the pen lifts. */
      clearSelection();
      paintSelectionClasses();
      paintFrame();
      clearLiveInk();
      scheduleLiveInk();
      return;
    }
    else if (prefs.tool === 'arrow' || prefs.tool === 'line') draft = Object.assign(base, { pts: [[p.x, p.y], [p.x, p.y]] });
    else if (prefs.tool === 'rect' || prefs.tool === 'ellipse') draft = Object.assign(base, { x: p.x, y: p.y, w: 0.001, h: 0.001, fill: !!prefs.fill });
    else if (prefs.tool === 'note') draft = Object.assign(base, { x: p.x, y: p.y, w: 0.28, h: 0.12, text: '' });
    else draft = Object.assign(base, { x: p.x, y: p.y, text: prefs.tool === 'stamp' ? prefs.stamp : '' });
    draft.origin = p;
    renderLayer();
  }

  function extendDraft(p, e) {
    if (!draft) return;
    const shift = !!(e && e.shiftKey);
    if (draft.kind === 'pen' || draft.kind === 'highlight') {
      collectInk(e, p);
      scheduleLiveInk();
      return;
    } else if (draft.kind === 'path') {
      draft.hover = [p.x, p.y];
    } else if (draft.kind === 'arrow' || draft.kind === 'line') {
      let q = p;
      if (shift) {
        /* Shift is the same promise every drawing app makes: the line lands on
           a 45° step, so a callout is never almost horizontal. */
        const o = draft.origin;
        const dx = p.x - o.x, dy = p.y - o.y;
        const size = Math.hypot(dx, dy);
        const a = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4);
        q = { x: clamp01(o.x + Math.cos(a) * size), y: clamp01(o.y + Math.sin(a) * size) };
      }
      draft.pts[1] = [q.x, q.y];
    } else if (draft.kind === 'rect' || draft.kind === 'ellipse') {
      const o = draft.origin;
      let dx = p.x - o.x, dy = p.y - o.y;
      if (shift) {
        const side = Math.max(Math.abs(dx), Math.abs(dy));
        dx = Math.sign(dx || 1) * side;
        dy = Math.sign(dy || 1) * side;
      }
      draft.x = Math.min(o.x, o.x + dx); draft.y = Math.min(o.y, o.y + dy);
      draft.w = Math.abs(dx); draft.h = Math.abs(dy);
    }
    scheduleRender();
  }

  function commitDraft() {
    const d = draft;
    if (!d || (d.kind === 'path' && d.building)) return;   // a path ends with Enter or a double click
    draft = null;
    clearLiveInk();
    inkCursor = null;
    if (d.pointerId !== undefined) { try { layer.releasePointerCapture(d.pointerId); } catch { /* ignore */ } }
    const tiny = (d.kind === 'rect' || d.kind === 'ellipse') && (d.w < 0.012 || d.h < 0.012);
    const dot = (d.kind === 'arrow' || d.kind === 'line') && d.pts
      && Math.hypot(d.pts[1][0] - d.pts[0][0], d.pts[1][1] - d.pts[0][1]) < 0.012;
    if (tiny || dot) { renderLayer(); return; }   // a stray click is not a drawing
    delete d.origin;
    const ink = isInkKind(d.kind);
    const mergeId = d.mergeInto;
    delete d.mergeInto;
    const pass = activePass(state.set);
    if (!pass) { renderLayer(); return; }
    /* The lifted stroke is the next letter of the same word, not a new mark:
       append it to the note the hand was already writing on. */
    if (ink && mergeId) {
      const found = findNote(state.set, mergeId);
      if (found && found.pass === pass && !found.note.locked && found.note.kind === d.kind) {
        pushUndo();
        const t = found.note;
        const strokes = inkStrokes(t).map(s => s.map(q => q.slice()));
        strokes.push(d.pts.map(q => q.slice()));
        t.strokes = strokes;
        delete t.pts;
        if (d.stylus) t.stylus = true;
        inkTail = { id: t.id, at: Date.now() };
        /* The note being written stays unselected: a frame around it after
           every letter would sit under the next stroke. Its row already says
           everything a lift changes, so the list is left alone too. */
        touch();
        repaintInk(t.id);
        paintTools();
        return;   // the pen stays in the hand
      }
    }
    pushUndo();
    pass.notes.push(d);
    if (ink) {
      inkTail = { id: d.id, at: Date.now() };
      touch();
      repaintInk(d.id, pass.id);
      renderList();
      paintTools();
      return;   // a pen is never spent after one letter
    }
    state.selected = d.id;
    state.flash = d.id;
    touch();
    renderLayer();
    renderList();
    /* The other instruments still step back unless they are locked (§rail). */
    if (wantsText(d.kind)) { openEditor(d.id); freshId = d.id; }
    if (!prefs.sticky) setTool('select', { quiet: true });
  }

  /* Click-by-click path. The first click opens it, later clicks add vertices,
     a second click on the same spot or Enter ends it, and clicking the first
     vertex closes the loop. Escape throws the unfinished path away. */
  function pathDown(e) {
    const p = normAt(e);
    if (!p) return;
    const now = Date.now();
    if (draft && draft.kind === 'path' && draft.building) {
      const pts = draft.pts;
      const last = pts[pts.length - 1];
      const nearLast = last && Math.hypot(p.x - last[0], p.y - last[1]) < 0.02;
      if (nearLast && now - (draft.lastClick || 0) < 320) { finishPath(true); return; }
      const first = pts[0];
      if (pts.length >= 3 && Math.hypot(p.x - first[0], p.y - first[1]) < 0.018) {
        draft.closed = true;
        finishPath(true);
        return;
      }
      pts.push([p.x, p.y]);
      draft.lastClick = now;
      draft.hover = [p.x, p.y];
      renderLayer();
      return;
    }
    const size = SIZE_STEPS[prefs.size] || SIZE_STEPS[1];
    const sw = WIDTH_STEPS[prefs.width] || WIDTH_STEPS[1];
    draft = {
      id: uid(), kind: 'path', color: prefs.ink, sw, size,
      author: prefs.activeProfile, createdAt: Date.now(), status: '', tags: [],
      pts: [[p.x, p.y]], building: true, lastClick: now, hover: [p.x, p.y], closed: false,
    };
    renderLayer();
  }

  function finishPath(commit) {
    const d = draft;
    if (!d || d.kind !== 'path') return;
    if (!commit || !d.pts || d.pts.length < 2) {
      draft = null;
      renderLayer();
      return;
    }
    draft = null;
    delete d.building;
    delete d.hover;
    delete d.lastClick;
    pushUndo();
    const pass = activePass(state.set);
    if (!pass) { renderLayer(); return; }
    pass.notes.push(d);
    state.selected = d.id;
    state.flash = d.id;
    touch(); renderLayer(); renderList();
    if (!prefs.sticky) setTool('select', { quiet: true });
  }

  /* The vertices and the rubber-band segment are a preview, not part of the
     plate; they disappear the moment the path is committed. */
  function pathDraftOverlay(W, H) {
    const g = svgEl('g', { class: 'anno-path-draft' });
    const ink = hexOf(draft);
    const sw = Math.max(1, rel(draft.sw || WIDTH_STEPS[1], H));
    const pts = pointsOf(draft, W, H);
    if (draft.hover && pts.length) {
      const last = pts[pts.length - 1];
      const h = px(draft.hover[0], draft.hover[1], W, H);
      g.appendChild(svgEl('line', {
        x1: last.x, y1: last.y, x2: h.x, y2: h.y,
        stroke: ink, 'stroke-width': sw, 'stroke-dasharray': `${sw * 2.4} ${sw * 2.4}`,
        'stroke-opacity': 0.55, 'stroke-linecap': 'round',
      }));
    }
    const r = Math.max(3, rel(0.005, H));
    pts.forEach((p, i) => {
      g.appendChild(svgEl('circle', {
        cx: p.x, cy: p.y, r: i === 0 ? r * 1.25 : r,
        fill: i === 0 && pts.length >= 3 ? ink : '#fffdf7',
        stroke: ink, 'stroke-width': Math.max(1, rel(0.0018, H)),
      }));
    });
    return g;
  }

  function wantsText(kind) {
    return kind === 'note' || kind === 'text' || kind === 'stamp';
  }

  function scheduleRender() {
    if (raf) return;
    raf = requestAnimationFrame(() => { raf = 0; renderLayer(); });
  }

  /* ------------------------------------------------------------ text editor */

  let editor = null;
  let freshId = '';   // a mark made by this drag; empty words on close means it was a mis-click

  function oneLineKind(id) {
    const found = findNote(state.set, id);
    return !!found && found.note.kind !== 'note';
  }

  /* A double click asks for the mark itself. Words open their editor; a mark
     without words opens the same full action menu as a right click, so every
     mark has one gesture that reaches everything it can do. */
  function openMark(id, x, y) {
    const found = findNote(state.set, id);
    if (!found) return;
    if (textKind(found.note.kind)) { select(id); openEditor(id); return; }
    writeSelection([id]);
    openMenu(x, y);
  }

  function openEditor(id) {
    const found = findNote(state.set, id);
    /* A pin is a number, and a pen stroke is a gesture: the rest — note, free
       text, stamp, and the caption of a box or an arrow — carry words. */
    if (!found || !textKind(found.note.kind)) return;
    // Opening a second sentence closes the first one, with its words kept.
    if (editor && !editor.hidden && editor.dataset.id && editor.dataset.id !== id) closeEditor(true);
    const n = found.note;
    if (!editor) {
      editor = document.createElement('textarea');
      editor.className = 'anno-editor';
      editor.id = 'annoEditor';
      editor.wrap = 'soft';
      editor.spellcheck = false;
      editor.setAttribute('aria-label', 'متن یادداشت');
      document.getElementById('lightbox').appendChild(editor);
      editor.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeEditor(true); return; }
        if (e.key !== 'Enter' || e.shiftKey) return;
        /* A note is prose, so Enter breaks the line and Ctrl+Enter closes it;
           a stamp, a caption or a free-text line closes on Enter. */
        if (oneLineKind(editor.dataset.id)) { e.preventDefault(); closeEditor(true); }
        else if (e.ctrlKey || e.metaKey) { e.preventDefault(); closeEditor(true); }
      });
      editor.addEventListener('input', () => {
        editor.style.height = 'auto';
        editor.style.height = Math.min(editor.scrollHeight, 320) + 'px';
        const dir = detectDir(editor.value);
        if (editor.value.trim() && editor.dir !== dir) {
          editor.dir = dir;
          editor.style.direction = dir;
        }
      });
      editor.addEventListener('blur', () => closeEditor(true));
    }
    editor.value = n.text || '';
    editor.dataset.id = id;
    editor.placeholder = n.kind === 'note' ? 'یادداشت…' : n.kind === 'text' ? 'متن…' : n.kind === 'stamp' ? 'واژهٔ مُهر…' : 'برچسب…';
    /* An empty note is written by a Persian reader first, so the caret and the
       punctuation start on the right; the moment Latin arrives the direction
       flips to what is actually typed. */
    const dir = (n.text || '').trim() ? detectDir(n.text) : 'rtl';
    editor.dir = dir;
    editor.style.direction = dir;
    const { W, H } = plateSize();
    const stage = document.getElementById('lbImageStage').getBoundingClientRect();
    const lb = document.getElementById('lightbox').getBoundingClientRect();
    const size = rel(n.size || SIZE_STEPS[1], H);
    const scale = stage.width / Math.max(1, W);
    let ex = n.x || 0, ey = n.y || 0, ew = n.w || 0.28;
    if (n.kind === 'rect' || n.kind === 'ellipse') {
      const b = boxOf(n, W, H);
      ew = clamp(b.w / W, 0.12, 0.6);
      const at = n.align === 'start' || n.align === 'end' ? n.align : 'center';
      ex = at === 'start' ? b.x / W : at === 'end' ? (b.x + b.w) / W - ew : (b.x + b.w / 2) / W - ew / 2;
      ey = b.y / H;
    } else if (n.kind === 'arrow') {
      const a = pointsOf(n, W, H);
      const p0 = a[0] || { x: 0, y: 0 };
      const p1 = a[1] || p0;
      ew = 0.26;
      ex = (p0.x + p1.x) / 2 / W - ew / 2;
      ey = (p0.y + p1.y) / 2 / H - size * 1.6 / H;
    } else if (n.kind === 'stamp') {
      ew = 0.2;
      ex = (n.x || 0) - ew / 2;
      ey = (n.y || 0) - size * 0.9 / H;
    }
    editor.style.fontSize = Math.max(13, size * scale) + 'px';
    editor.style.fontWeight = n.bold ? '700' : '';
    editor.style.fontStyle = n.italic ? 'italic' : '';
    editor.style.left = (stage.left - lb.left + ex * stage.width) + 'px';
    editor.style.top = (stage.top - lb.top + ey * stage.height) + 'px';
    editor.style.width = Math.max(n.kind === 'note' || n.kind === 'text' ? 160 : 110, ew * stage.width) + 'px';
    editor.hidden = false;
    editor.focus();
    /* Caret at the end, not the old text selected: editing a note you wrote on
       a previous reading must not delete it on the first keystroke. */
    const end = editor.value.length;
    editor.setSelectionRange(end, end);
    editor.style.height = 'auto';
    editor.style.height = Math.min(editor.scrollHeight, 320) + 'px';
    paintQuick();
  }

  function closeEditor(commit) {
    if (!editor || editor.hidden) return;
    const id = editor.dataset.id;
    const text = editor.value;
    const fresh = id === freshId;
    editor.hidden = true;
    editor.dataset.id = '';
    freshId = '';
    paintQuick();
    if (!commit || !id) return;
    if (fresh && !(text || '').trim()) {
      // Nothing was written on the mark this same gesture made, so it goes back.
      const found = findNote(state.set, id);
      if (found) { found.pass.notes.splice(found.index, 1); state.selected = ''; touch(); renderLayer(); renderList(); }
      return;
    }
    const found = findNote(state.set, id);
    if (found && found.note.text !== text) {
      pushUndo();
      found.note.text = text;
      touch();
      renderLayer();
      renderList();
    }
  }

  /* ------------------------------------------------------------- the panel */

  function renderList() {
    const host = document.getElementById('annoList');
    if (!host) return;
    const set = state.set;
    paintPeekCount();
    if (!set) { host.innerHTML = ''; return; }
    const parts = [];
    for (const pass of set.passes.slice().reverse()) {
      const rows = pass.notes.filter(n => matchesFilter(n)).map((n, i) => rowHTML(n, pass)).join('');
      parts.push(`<div class="anno-pass-block${pass.id === state.passId ? ' is-current' : ''}" data-pass="${pass.id}">
        <div class="anno-pass-head">
          <button type="button" class="anno-pass-toggle" data-act="focus-pass" data-pass="${pass.id}" title="به این گذر بنویس">
            <bdi dir="auto">${escText(pass.label)}</bdi>
          </button>
          <span class="anno-pass-count">${toFa(pass.notes.length)}</span>
          ${pass.notes.length ? `<button type="button" class="anno-pass-clear" data-act="clear-pass" data-pass="${pass.id}" title="این گذر را خالی کن">خالی</button>` : ''}
          ${!pass.notes.length && set.passes.length > 1 ? `<button type="button" class="anno-pass-clear" data-act="drop-pass" data-pass="${pass.id}" title="این گذرِ خالی را بردار">حذف</button>` : ''}
        </div>
        ${rows || '<p class="anno-empty-pass">در این گذر چیزی نگذاشته‌اید.</p>'}
      </div>`);
    }
    host.innerHTML = parts.join('') || '<p class="anno-empty-pass">هنوز یادداشتی روی این تصویر نیست. ابزاری را برگزینید و روی نمودار بکشید.</p>';
    const sum = document.getElementById('annoCount');
    if (sum) sum.textContent = toFa(noteList(set).length) + ' یادداشت · ' + toFa(set.passes.length) + ' گذر';
    renderFooter();
    /* A mark the reader just made is shown where it landed, not left at the
       bottom of a scrolled list. */
    if (state.flash) {
      const row = host.querySelector('.anno-row[data-id="' + state.flash + '"]');
      state.flash = '';
      if (row) {
        row.classList.add('is-new');
        row.scrollIntoView({ block: 'nearest' });
        setTimeout(() => row.classList.remove('is-new'), 1200);
      }
    }
  }

  function matchesFilter(n) {
    if (state.listFilter === 'mine') return n.author === prefs.activeProfile;
    if (state.listFilter === 'open') return !n.status || n.status === 'todo' || n.status === 'ask';
    if (state.listFilter === 'done') return n.status === 'done';
    return true;
  }

  function rowHTML(n, pass) {
    const who = profile(n.author);
    const st = statusMeta(n.status);
    const icon = iconFor(KIND_ICON[n.kind] || 'note');
    const preview = (n.text || markLabel(n)).replace(/\s+/g, ' ').slice(0, 84);
    return `<div class="anno-row${isSelected(n.id) ? ' is-selected' : ''}${n.locked ? ' is-locked' : ''}" data-id="${n.id}" tabindex="0" role="button">
      <span class="anno-row-ink" style="--ink-dot:${n.kind === 'image' ? 'var(--accent-line)' : hexOf(n)}"></span>
      ${icon}
      <span class="anno-row-main">
        <bdi dir="${detectDir(preview)}" class="anno-row-text">${escText(preview)}</bdi>
        <span class="anno-row-meta">${n.locked ? 'قفل · ' : ''}${who ? escText(who.name) : ''}${st.label !== '—' ? ' · ' + st.label : ''}</span>
      </span>
      <button class="anno-row-btn" type="button" data-act="jump" title="نشانم بده">${iconFor('fit')}</button>
      ${textKind(n.kind) ? `<button class="anno-row-btn" type="button" data-act="edit" title="ویرایش">${iconFor('type')}</button>` : ''}
      ${n.kind === 'arrow' ? `<button class="anno-row-btn" type="button" data-act="flip" title="سرِ پیکان را به آن سرِ دیگر ببر">${iconFor('flip')}</button>` : ''}
      <button class="anno-row-btn" type="button" data-act="delete" title="پاک کردن">${iconFor('close')}</button>
    </div>`;
  }

  function renderFooter() {
    const who = profile();
    const whoEl = document.getElementById('annoAuthor');
    if (whoEl) whoEl.innerHTML = `<span class="anno-author-dot" style="background:${who.color}"></span>${escText(who.name)}`;
    const passEl = document.getElementById('annoPassLabel');
    if (passEl) passEl.textContent = activePass(state.set) ? activePass(state.set).label : '—';
    const fs = document.getElementById('annoFolderState');
    if (fs) {
      if (state.folder) { fs.textContent = state.folderName ? state.folderName : 'وصل است'; fs.className = 'anno-state is-on'; }
      else { fs.textContent = 'فقط در این مرورگر'; fs.className = 'anno-state is-off'; }
    }
    const sv = document.getElementById('annoSavedState');
    if (sv) sv.textContent = state.saveLabel;
    const un = document.getElementById('annoUndelete');
    if (un) {
      const n = state.set && Array.isArray(state.set.trash) ? state.set.trash.length : 0;
      un.hidden = !n;
      un.textContent = n ? 'بازگردانی (' + toFa(n) + ')' : 'بازگردانی';
    }
  }

  function iconFor(name) {
    return `<svg class="icon" aria-hidden="true"><use href="#i-${name}"></use></svg>`;
  }

  function escText(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  /* ------------------------------------------------------------- mutations */

  function snapshot() {
    return JSON.parse(JSON.stringify(state.set || { passes: [] }));
  }

  function pushUndo() {
    if (!state.set) return;
    state.undo.push(snapshot());
    if (state.undo.length > 60) state.undo.shift();
    state.redo.length = 0;
  }

  function undo() {
    if (!state.undo.length || !state.set) return;
    state.redo.push(snapshot());
    const prev = state.undo.pop();
    const key = state.set.imageKey;
    state.set = prev;
    state.set.imageKey = key;
    state.passId = state.set.passes.length ? state.set.passes[state.set.passes.length - 1].id : '';
    state.selected = '';
    touch(); renderLayer(); renderList(); paintTools();
  }

  function redo() {
    if (!state.redo.length || !state.set) return;
    state.undo.push(snapshot());
    const next = state.redo.pop();
    state.set = next;
    state.selected = '';
    touch(); renderLayer(); renderList(); paintTools();
  }

  /* Deleting is never confirmed with a dialog here — the mark is named, the
     undo is put in front of the reader, and one gesture reverses it. */
  function removeSelected() {
    deleteNotes(state.selection.slice());
  }

  function deleteNotes(ids) {
    if (!state.set || !ids.length) return 0;
    const picked = [];
    for (const id of ids) {
      const found = findNote(state.set, id);
      if (found) picked.push(found);
    }
    if (!picked.length) return 0;
    const named = picked.length === 1 ? '«' + previewOf(picked[0].note, 34) + '»' : toFa(picked.length) + ' یادداشت';
    pushUndo();
    /* A copy goes to the set's own trash before the mark leaves the plate, so
       a delete made by mistake survives a reload as well as an undo. */
    const gone = new Set(ids);
    for (const pass of state.set.passes) {
      const removed = pass.notes.filter(n => gone.has(n.id));
      if (removed.length) trashPush(state.set, pass.id, removed);
      pass.notes = pass.notes.filter(n => !gone.has(n.id));
    }
    state.selected = '';
    touch(); renderLayer(); renderList(); paintTools();
    toast(named + ' پاک شد', { label: 'بازگردانی', onClick: undo });
    return picked.length;
  }

  /* Per-image recycle bin. It lives inside the set (IndexedDB and the sidecar
     carry it together), so a browser restart does not turn an accidental
     delete into a permanent one. Old entries fall off the end, not the new. */
  function trashPush(set, passId, notes) {
    if (!set || !notes || !notes.length) return;
    if (!Array.isArray(set.trash)) set.trash = [];
    const at = Date.now();
    for (const n of notes) {
      set.trash.push({ passId, at, note: JSON.parse(JSON.stringify(n)) });
    }
    while (set.trash.length > 80) set.trash.shift();
  }

  function restoreLastDeleted() {
    if (!state.set) return;
    const trash = Array.isArray(state.set.trash) ? state.set.trash : [];
    if (!trash.length) { toast('چیزی برای بازگرداندن نیست'); return; }
    const entry = trash[trash.length - 1];
    if (!entry || !entry.note || !entry.note.id) { trash.pop(); touch(); renderFooter(); return; }
    let pass = state.set.passes.find(p => p.id === entry.passId);
    if (!pass) pass = activePass(state.set);
    if (!pass) { toast('گذری برای بازگرداندن پیدا نشد'); return; }
    trash.pop();
    const note = entry.note;
    /* Undo may already have put this one back; restoring it again must not
       leave two identical marks on the chart. */
    if (findNote(state.set, note.id)) {
      touch(); renderList();
      toast('این یادداشت از قبل روی تصویر است');
      return;
    }
    pushUndo();
    pass.notes.push(note);
    state.selected = note.id;
    state.flash = note.id;
    touch(); renderLayer(); renderList(); paintTools();
    toast('«' + previewOf(note, 34) + '» برگشت', { label: 'واگرد', onClick: undo });
  }

  /* The head of an arrow is the end the drag finished at, which is not always
     the end the reader meant. Swapping the two points is the whole fix, and it
     is the one edit that cannot be made by dragging a grip. */
  function flipArrow(id) {
    const found = findNote(state.set, id || state.selected);
    if (!found || found.note.kind !== 'arrow' || (found.note.pts || []).length < 2) return;
    pushUndo();
    const a = found.note.pts;
    found.note.pts = [a[1].slice(), a[0].slice()];
    state.selected = found.note.id;
    touch(); renderLayer(); renderList();
    toast('سرِ پیکان به آن سرِ دیگر رفت', { label: 'بازگردانی', onClick: undo });
  }

  function duplicateSelected() {
    const found = selectedNotes();
    if (!found.length) return;
    pushUndo();
    const ids = [];
    for (const f of found) {
      const copy = JSON.parse(JSON.stringify(f.note));
      copy.id = uid();
      copy.createdAt = Date.now();
      copy.author = prefs.activeProfile;
      copy.locked = false;
      translateNote(copy, 0.02, 0.02, true);
      f.pass.notes.push(copy);
      ids.push(copy.id);
    }
    writeSelection(ids);
    touch(); renderLayer(); renderList();
    toast(toFa(ids.length) + ' نسخهٔ دیگر ساخته شد');
  }

  /* One gesture, one offset, whichever geometry the mark keeps. A copied
     callout travels whole (its leader belongs to the copy); nudging the box
     leaves the anchor where the reader set it. */
  function translateNote(n, dx, dy, moveTail) {
    if (n.strokes && n.strokes.length) {
      n.strokes = n.strokes.map(s => s.map(q => [clamp01(q[0] + dx), clamp01(q[1] + dy)]));
    } else if (n.pts && n.pts.length) {
      n.pts = n.pts.map(q => [clamp01(q[0] + dx), clamp01(q[1] + dy)]);
    } else if (n.kind === 'image') {
      const lim = boardBox();
      n.x = clamp((n.x || 0) + dx, lim.x0, Math.max(lim.x0, lim.x1 - (n.w || 0)));
      n.y = clamp((n.y || 0) + dy, lim.y0, Math.max(lim.y0, lim.y1 - (n.h || 0)));
    } else {
      n.x = clamp01((n.x || 0) + dx);
      n.y = clamp01((n.y || 0) + dy);
    }
    if (moveTail && tailOf(n)) n.tail = [clamp01(n.tail[0] + dx), clamp01(n.tail[1] + dy)];
  }

  function nudgeSelection(dx, dy) {
    const found = selectedNotes().filter(f => !f.note.locked);
    if (!found.length) return;
    pushUndo();
    for (const f of found) translateNote(f.note, dx, dy);
    touch(); renderLayer(); renderList();
  }

  function selectAll() {
    if (!state.set) return;
    const hidden = hiddenPasses();
    const ids = [];
    for (const pass of state.set.passes) {
      if (hidden.has(pass.id)) continue;
      for (const n of pass.notes) ids.push(n.id);
    }
    writeSelection(ids);
    if (ids.length) toast(toFa(ids.length) + ' یادداشت برگزیده شد');
  }

  /* Tab walks the plate in reading order: the list is closed most of the time,
     and the keyboard should still reach every mark without opening it. */
  function cycleSelection(dir) {
    if (!state.set) return;
    const hidden = hiddenPasses();
    const ids = [];
    for (const pass of state.set.passes) {
      if (hidden.has(pass.id)) continue;
      for (const n of pass.notes) ids.push(n.id);
    }
    if (!ids.length) return;
    const at = ids.indexOf(state.selected);
    writeSelection([ids[(at + dir + ids.length) % ids.length]]);
    const id = state.selected;
    const row = document.querySelector('.anno-row[data-id="' + id + '"]');
    if (row) row.scrollIntoView({ block: 'nearest' });
    renderLayer();
  }

  /* Copy is internal on purpose: a reader marking a chart should not lose the
     clipboard they filled in another app, and annotations are JSON anyway. */
  function copySelection(cut) {
    const found = selectedNotes();
    if (!found.length) return;
    clipboard = found.map(f => JSON.parse(JSON.stringify(f.note)));
    if (cut) {
      deleteNotes(found.map(f => f.note.id));
      toast(toFa(clipboard.length) + ' بریده شد');
      return;
    }
    toast(toFa(clipboard.length) + ' رونوشت شد', { label: 'جای‌گذاری', onClick: pasteClipboard });
  }

  function pasteClipboard() {
    if (!clipboard.length) { toast('چیزی برای جای‌گذاری نیست'); return; }
    if (!state.set) return;
    const pass = activePass(state.set);
    if (!pass) return;
    pushUndo();
    const ids = [];
    for (const src of clipboard) {
      const copy = JSON.parse(JSON.stringify(src));
      copy.id = uid();
      copy.createdAt = Date.now();
      copy.author = prefs.activeProfile;
      copy.locked = false;
      translateNote(copy, 0.02, 0.02, true);
      pass.notes.push(copy);
      ids.push(copy.id);
    }
    writeSelection(ids);
    state.flash = ids[ids.length - 1];
    touch(); renderLayer(); renderList();
    toast(toFa(ids.length) + ' چسبانده شد');
  }

  /* Z-order is the array order inside a pass — no extra field to keep in sync,
     and the bake walks the same order. */
  function arrangeSelection(mode) {
    const found = selectedNotes();
    if (!found.length) return;
    pushUndo();
    const byPass = new Map();
    for (const f of found) {
      if (!byPass.has(f.pass)) byPass.set(f.pass, new Set());
      byPass.get(f.pass).add(f.note.id);
    }
    for (const [pass, ids] of byPass) {
      const list = pass.notes;
      if (mode === 'front' || mode === 'back') {
        const picked = list.filter(n => ids.has(n.id));
        const rest = list.filter(n => !ids.has(n.id));
        pass.notes = mode === 'front' ? rest.concat(picked) : picked.concat(rest);
      } else if (mode === 'forward') {
        for (let i = list.length - 2; i >= 0; i--) {
          if (ids.has(list[i].id) && !ids.has(list[i + 1].id)) [list[i], list[i + 1]] = [list[i + 1], list[i]];
        }
      } else if (mode === 'backward') {
        for (let i = 1; i < list.length; i++) {
          if (ids.has(list[i].id) && !ids.has(list[i - 1].id)) [list[i], list[i - 1]] = [list[i - 1], list[i]];
        }
      }
    }
    touch(); renderLayer(); renderList();
  }

  function toggleLock() {
    const found = selectedNotes();
    if (!found.length) return;
    const on = !found.every(f => !!f.note.locked);
    pushUndo();
    for (const f of found) f.note.locked = on;
    touch(); renderLayer(); renderList(); paintTools();
    toast(on ? toFa(found.length) + ' یادداشت قفل شد' : 'قفل برداشته شد', { label: 'بازگردانی', onClick: undo });
  }

  function rememberInk(ref) {
    const hex = normHex(ref);
    if (!hex || INKS.some(i => i.hex === hex)) return false;
    const list = (Array.isArray(prefs.recentInks) ? prefs.recentInks : []).map(normHex).filter(Boolean);
    prefs.recentInks = [hex].concat(list.filter(x => x !== hex)).slice(0, 6);
    return true;
  }

  /* One entry point for every colour surface. With marks selected it recolours
     them; with nothing selected it only loads the pen, so the reader can choose
     a colour before drawing. `live` is the native picker's drag: the notes
     follow the cursor, but only one undo entry is pushed when the picker
     closes. */
  function chooseInk(color, opts) {
    const o = opts || {};
    const ref = inkRef(color);
    if (!ref) return;
    prefs.ink = ref;
    if (!o.live) {
      rememberInk(ref);
      savePrefs();
    }
    const changed = selectedNotes().filter(f => !sameInk(f.note.color, ref));
    if (changed.length) {
      if (!o.live) pushUndo();
      for (const f of changed) f.note.color = ref;
      touch(); renderLayer(); renderList();
    }
    paintTools();
  }

  function applyInk(color) { return chooseInk(color); }

  let inkGesture = null;
  function beginInkGesture() {
    if (inkGesture || !state.set) return;
    inkGesture = {
      before: snapshot(),
      colors: new Map(selectedNotes().map(f => [f.note.id, f.note.color || ''])),
    };
  }

  function finishInkGesture() {
    if (!inkGesture) return;
    const g = inkGesture;
    inkGesture = null;
    const changed = selectedNotes().some(f =>
      g.colors.has(f.note.id) && !sameInk(g.colors.get(f.note.id), f.note.color));
    if (changed) {
      state.undo.push(g.before);
      if (state.undo.length > 60) state.undo.shift();
      state.redo.length = 0;
      touch(); renderList(); paintTools();
    }
    rememberInk(prefs.ink);
    savePrefs();
    paintInkUi();
  }

  async function pickInkFromScreen() {
    if (!('EyeDropper' in window)) {
      toast('این مرورگر قطره‌چین ندارد؛ از رنگ دلخواه استفاده کنید');
      return;
    }
    try {
      const picked = await new window.EyeDropper().open();
      if (picked && picked.sRGBHex) chooseInk(picked.sRGBHex);
    } catch { /* the reader closed the pipette */ }
  }

  function toggleTextStyle(prop) {
    const found = selectedNotes().filter(f => textKind(f.note.kind));
    if (!found.length) { toast('این برگزیده متنی ندارد'); return; }
    const on = !found.every(f => !!f.note[prop]);
    pushUndo();
    for (const f of found) f.note[prop] = on;
    touch(); renderLayer(); renderList(); paintTools();
  }

  function alignOf(n) {
    return n.align === 'center' || n.align === 'end' ? n.align
      : n.align === 'start' ? 'start'
      : (n.kind === 'note' || n.kind === 'text' ? 'start' : 'center');
  }

  const ALIGN_LABEL = { start: 'ابتدا', center: 'وسط', end: 'انتها' };

  function cycleAlign() {
    const found = selectedNotes().filter(f => textKind(f.note.kind));
    if (!found.length) { toast('این برگزیده متنی ندارد'); return; }
    const order = ['start', 'center', 'end'];
    const next = order[(order.indexOf(alignOf(found[0].note)) + 1) % order.length];
    pushUndo();
    for (const f of found) f.note.align = next;
    touch(); renderLayer(); renderList(); paintTools();
    toast('چیدنِ متن: ' + ALIGN_LABEL[next]);
  }

  function toggleFill() {
    const found = selectedNotes().filter(f => f.note.kind === 'rect' || f.note.kind === 'ellipse');
    if (!found.length) { toast('این برگزیده چارچوب یا بیضی نیست'); return; }
    const on = !found.every(f => !!f.note.fill);
    pushUndo();
    for (const f of found) f.note.fill = on;
    touch(); renderLayer(); renderList(); paintTools();
  }

  function toggleTextBackground() {
    const found = selectedNotes().filter(f => f.note.kind === 'text');
    if (!found.length) { toast('این برگزیده متنِ آزاد نیست'); return; }
    const on = !found.every(f => !!f.note.bg);
    pushUndo();
    for (const f of found) f.note.bg = on;
    touch(); renderLayer(); renderList(); paintTools();
  }

  /* The rail link counts every mark in the database, so «یادداشت‌ها» shows a
     number only where there is something to read. */
  function paintRailBadge() {
    const el = document.getElementById('railNotesCount');
    if (!el) return Promise.resolve();
    return allSets().then(sets => {
      const n = sets.reduce((sum, s) => sum + (s && s.passes ? noteList(s).length : 0), 0);
      el.textContent = toFa(n);
      el.hidden = !n;
      return n;
    }).catch(() => 0);
  }

  function touch() {
    state.dirty = true;
    if (!state.set) return;
    state.set.updatedAt = Date.now();
    scheduleSave();
    scheduleDisk();
    paintSaveState('…');
  }

  let saveTimer = 0;
  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(flushSave, 500);
  }

  function flushSave() {
    if (!state.set || !state.dirty) return Promise.resolve();
    const set = state.set;
    return putSet(set).then(() => {
      state.dirty = false;
      paintSaveState(stampTime(Date.now()));
      paintRailBadge();
      /* The chips behind the viewer are part of the promise that a marked
         chart is recognisable before it is opened, so they have to follow the
         edit at once — otherwise a cleared pass keeps showing its old count
         until the reader navigates away and back. */
      paintPlateBadges(document);
      paintPeekCount();
      return bumpIndex(set);
    }).catch(err => {
      paintSaveState('ذخیره نشد');
      console.warn('annotation save failed', err);
    });
  }

  let diskTimer = 0;
  function scheduleDisk() {
    if (!state.folder) return;
    clearTimeout(diskTimer);
    diskTimer = setTimeout(writeSidecar, 1200);
  }

  /* ---------------------------------------------------------------- the disk */

  async function linkFolder() {
    if (!window.showDirectoryPicker) throw new Error('this browser cannot write to disk; use «پشتیبان‌گیری»');
    const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
    state.folder = handle;
    state.folderName = handle.name || '';
    try { await kvSet('folder', handle); } catch { /* a handle that cannot be parked still works for this session */ }
    await writeSidecar();
    renderFooter();
    return handle;
  }

  async function unlinkFolder() {
    state.folder = null;
    state.folderName = '';
    try { await kvDel('folder'); } catch { /* nothing to forget */ }
    renderFooter();
  }

  async function restoreFolder() {
    let handle = null;
    try { handle = await kvGet('folder'); } catch { handle = null; }
    if (!handle || typeof handle.queryPermission !== 'function') return false;
    let perm = await handle.queryPermission({ mode: 'readwrite' });
    if (perm !== 'granted') perm = await handle.requestPermission({ mode: 'readwrite' }).catch(() => 'denied');
    if (perm !== 'granted') return false;
    state.folder = handle;
    state.folderName = handle.name || '';
    renderFooter();
    return true;
  }

  /* The sidecar set lives in annotations/<sha1>/ beside assets/images and
     assets/thumbs, so the content-addressed store keeps its one rule: the name
     of a file is the hash of its bytes. */
  async function annoDir(create) {
    if (!state.folder) throw new Error('no folder linked');
    return state.folder.getDirectoryHandle('annotations', create ? { create: true } : undefined);
  }

  async function writeFile(dir, name, data, type) {
    const fh = await dir.getFileHandle(name, { create: true });
    const w = await fh.createWritable();
    await w.write(new Blob([data], { type: type || 'application/octet-stream' }));
    await w.close();
  }

  function sidecarName(set) {
    return set.imageKey.slice(0, 24) + '-' + (set.name || 'plate').replace(/[^\w.\-]+/g, '_').slice(-40);
  }

  function extForMime(mime, name) {
    const known = {
      'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp',
      'image/gif': 'gif', 'image/svg+xml': 'svg', 'image/avif': 'avif',
    };
    if (known[mime]) return known[mime];
    const m = String(name || '').match(/\.([a-z0-9]{2,5})$/i);
    return m ? m[1].toLowerCase() : 'bin';
  }

  /* The disk copy has to stand on its own: pictures written once beside the
     sidecar and referenced by path, never re-encoded into a new hash. */
  async function writeSidecarImages(set, dir) {
    const ids = Array.from(imageIdsOf(set));
    if (!ids.length) return [];
    const imgDir = await dir.getDirectoryHandle('images', { create: true });
    const refs = [];
    for (const id of ids) {
      const rec = await getFile(id).catch(() => null);
      if (!rec || !rec.blob) continue;
      const name = id + '.' + extForMime(rec.mime, rec.name);
      try {
        await imgDir.getFileHandle(name);
      } catch {
        try { await writeFile(imgDir, name, rec.blob, rec.mime); }
        catch { continue; }
      }
      refs.push({ id, name: rec.name || name, mime: rec.mime, w: rec.w, h: rec.h, path: 'images/' + name });
    }
    return refs;
  }

  async function writeSidecar() {
    if (!state.folder || !state.set) return false;
    try {
      const set = state.set;
      const dir = await annoDir(true);
      const stem = sidecarName(set);
      const refs = await writeSidecarImages(set, dir);
      const doc = refs.length ? Object.assign({}, set, { files: refs }) : set;
      await writeFile(dir, stem + '.notes.json', JSON.stringify(doc, null, 1), 'application/json');
      await writeFile(dir, stem + '.notes.md', toMarkdown(set), 'text/plain;charset=utf-8');
      const png = await bakePng(set);
      if (png) await writeFile(dir, stem + '.marked.png', png, 'image/png');
      state.diskOk = true;
      paintSaveState('روی دیسک · ' + stampTime(Date.now()));
      return true;
    } catch (err) {
      state.diskOk = false;
      paintSaveState('دیسک نوشته نشد');
      console.warn('sidecar write failed', err);
      return false;
    }
  }

  /* ------------------------------------------------------------ the exports */

  function notesByPass(set) {
    return (set.passes || []).map(p => ({
      label: p.label, author: (profile(p.author) || {}).name || '', notes: (p.notes || []).map((n, i) => Object.assign({ n: i + 1 }, n)),
    }));
  }

  function toMarkdown(set) {
    const lines = [];
    const where = set.where || {};
    lines.push('# یادداشت‌های تصویر — ' + (set.name || set.imageKey));
    lines.push('');
    if (set.imageKey) lines.push('کلید: `' + set.imageKey + '`');
    if (where.jid && where.pid) lines.push('پست: ' + where.jid + ' / صفحهٔ ' + where.page + ' / ' + where.pid);
    lines.push('آخرین ویرایش: ' + stampTime(set.updatedAt || Date.now()));
    for (const pass of notesByPass(set)) {
      lines.push('');
      lines.push('## ' + pass.label + (pass.author ? ' · ' + pass.author : ''));
      if (!pass.notes.length) { lines.push('_— بی‌محتوا —_'); continue; }
      for (const n of pass.notes) {
        const st = statusMeta(n.status);
        /* A stroke has no x/y of its own; report the centre of its points so
           a line or a path does not export as `(NaN٪ , NaN٪)`. */
        let cx = n.x, cy = n.y;
        if (n.kind === 'image') {
          cx = (n.x || 0) + (n.w || 0) / 2;
          cy = (n.y || 0) + (n.h || 0) / 2;
        } else if ((n.pts && n.pts.length) || (n.strokes && n.strokes.length)) {
          const b = normBounds(n, 1, 1);
          cx = b.x + b.w / 2;
          cy = b.y + b.h / 2;
        }
        const where2 = `(${(cx * 100).toFixed(1)}٪ , ${(cy * 100).toFixed(1)}٪)`;
        /* A tail is part of the note's meaning: «about this point» survives the
           export instead of collapsing into the box's own corner. */
        const tl = tailOf(n);
        const aim = tl ? ` ← نقطهٔ \`(${(tl[0] * 100).toFixed(1)}٪ , ${(tl[1] * 100).toFixed(1)}٪)\`` : '';
        const body = (n.text || '').replace(/\n/g, ' ').trim();
        const label = body ? (KIND_LABEL[n.kind] || n.kind) : markLabel(n);
        lines.push(`${n.n}. **${label}**${body ? ' — ' + body : ''} · ${where2}${aim}${st.id ? ' · ' + st.label : ''}`);
      }
    }
    const pics = noteList(set).filter(n => n.kind === 'image').map(n => n.name).filter(Boolean);
    if (pics.length) lines.push('تصاویرِ تخته: ' + pics.join(' · ') + ' — فایل‌ها در پوشهٔ `images/` کنار همین برگه نگه داشته می‌شوند.');
    lines.push('');
    lines.push('_این فایل کنار تصویرِ اصلیِ بی‌نوشته نگه داشته می‌شود؛ خودِ فایل تصویر دست‌نخورده است._');
    return lines.join('\n');
  }

  /* How far past the plate the baked copy has to reach, in plate fractions.
     Only pictures can sit out there, and never past the visible board. */
  function bakeMargins(set) {
    const out = { l: 0, t: 0, r: 0, b: 0 };
    if (!set) return out;
    for (const pass of set.passes) {
      for (const n of pass.notes) {
        if (n.kind !== 'image') continue;
        out.l = Math.max(out.l, -n.x);
        out.t = Math.max(out.t, -n.y);
        out.r = Math.max(out.r, n.x + (n.w || 0) - 1);
        out.b = Math.max(out.b, n.y + (n.h || 0) - 1);
      }
    }
    out.l = clamp(out.l, 0, BOARD);
    out.t = clamp(out.t, 0, BOARD);
    out.r = clamp(out.r, 0, BOARD);
    out.b = clamp(out.b, 0, BOARD);
    return out;
  }

  /* The marked copy: the plate at its own pixels, then the reader's ink on top.
     Nothing is resampled, so the chart is exactly the file beside it. A board
     picture parked outside the chart widens the canvas instead of vanishing. */
  async function bakePng(set, imgEl) {
    const src = imgEl || document.getElementById('lbImage');
    if (!src || !src.naturalWidth) return null;
    /* Reference pictures are decoded off the note; wait for them or the baked
       copy would quietly lose every image placed on the board. */
    await ensureImages(set);
    const W = src.naturalWidth;
    const H = src.naturalHeight;
    const m = bakeMargins(set);
    const cv = document.createElement('canvas');
    cv.width = Math.round(W * (1 + m.l + m.r));
    cv.height = Math.round(H * (1 + m.t + m.b));
    const ctx = cv.getContext('2d');
    try { ctx.drawImage(src, m.l * W, m.t * H); } catch { return null; }
    ctx.translate(m.l * W, m.t * H);
    drawMarks(ctx, set, W, H);
    return new Promise(resolve => cv.toBlob(b => resolve(b || null), 'image/png'));
  }

  function drawMarks(ctx, set, W, H) {
    if (!set) return;
    for (const pass of set.passes) {
      for (const n of pass.notes) drawOne(ctx, n, W, H);
    }
  }

  function drawOne(ctx, n, W, H) {
    const ink = hexOf(n);
    const sw = Math.max(1, rel(n.sw || WIDTH_STEPS[1], H));
    ctx.save();
    ctx.strokeStyle = ink; ctx.fillStyle = ink; ctx.lineWidth = sw;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (n.kind === 'rect') {
      const b = boxOf(n, W, H);
      if (n.fill) { ctx.globalAlpha = 0.14; ctx.fillRect(b.x, b.y, b.w, b.h); ctx.globalAlpha = 1; }
      ctx.strokeRect(b.x, b.y, b.w, b.h);
    } else if (n.kind === 'ellipse') {
      const b = boxOf(n, W, H);
      ctx.beginPath();
      ctx.ellipse(b.x + b.w / 2, b.y + b.h / 2, Math.max(1, b.w / 2), Math.max(1, b.h / 2), 0, 0, Math.PI * 2);
      if (n.fill) { ctx.globalAlpha = 0.14; ctx.fill(); ctx.globalAlpha = 1; }
      ctx.stroke();
    } else if (n.kind === 'arrow') {
      const a = pointsOf(n, W, H);
      const p0 = a[0] || { x: 0, y: 0 }; const p1 = a[1] || p0;
      const hd = arrowHeadGeom(p0, p1, sw, H);
      if (hd) {
        ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(hd.base.x, hd.base.y); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(hd.tip.x, hd.tip.y);
        ctx.lineTo(hd.wing1.x, hd.wing1.y);
        ctx.lineTo(hd.wing2.x, hd.wing2.y);
        ctx.closePath(); ctx.fill();
      }
    } else if (n.kind === 'line') {
      const a = pointsOf(n, W, H);
      if (a.length >= 2) {
        ctx.beginPath(); ctx.moveTo(a[0].x, a[0].y); ctx.lineTo(a[1].x, a[1].y); ctx.stroke();
      }
    } else if (n.kind === 'path') {
      const a = pointsOf(n, W, H);
      if (a.length) {
        ctx.beginPath(); ctx.moveTo(a[0].x, a[0].y);
        for (let i = 1; i < a.length; i++) ctx.lineTo(a[i].x, a[i].y);
        if (n.closed) ctx.closePath();
        ctx.stroke();
      }
    } else if (n.kind === 'pen' || n.kind === 'highlight') {
      const hi = n.kind === 'highlight';
      const ds = noteInkDs(n, W, H);
      if (ds.length && typeof Path2D === 'function') {
        if (hi) { ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.34; }
        for (const d of ds) ctx.fill(new Path2D(d));
        if (hi) { ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; }
      } else {
        const strokes = inkStrokesPx(n, W, H);
        if (hi) {
          ctx.globalCompositeOperation = 'multiply';
          ctx.globalAlpha = 0.34;
          ctx.lineWidth = sw * 3.2;
        }
        for (const s of strokes) {
          if (!s.length) continue;
          ctx.beginPath();
          ctx.moveTo(s[0].x, s[0].y);
          if (s.length === 1) ctx.lineTo(s[0].x + 0.01, s[0].y);
          else for (let i = 1; i < s.length; i++) ctx.lineTo(s[i].x, s[i].y);
          ctx.stroke();
        }
        if (hi) {
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = 1;
          ctx.lineWidth = sw;
        }
      }
    } else if (n.kind === 'image') {
      const b = boxOf(n, W, H);
      const ready = imageReady(n);
      if (ready) {
        try { ctx.drawImage(ready.img, b.x, b.y, Math.max(1, b.w), Math.max(1, b.h)); }
        catch { /* a file the canvas refuses leaves the plate alone */ }
      } else {
        ctx.fillStyle = 'rgba(29,27,22,.05)';
        ctx.fillRect(b.x, b.y, Math.max(1, b.w), Math.max(1, b.h));
        ctx.strokeStyle = 'rgba(29,27,22,.28)';
        ctx.setLineDash([5, 4]);
        ctx.strokeRect(b.x, b.y, Math.max(1, b.w), Math.max(1, b.h));
        ctx.setLineDash([]);
      }
    } else if (n.kind === 'pin') {
      const p = px(n.x, n.y, W, H);
      const r = rel(0.013, H);
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.globalAlpha = 0.92; ctx.fill(); ctx.globalAlpha = 1;
      ctx.strokeStyle = '#fffdf7'; ctx.lineWidth = Math.max(1, rel(0.0022, H));
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#fffdf7';
      ctx.font = `${(r * 1.15).toFixed(1)}px Vazirmatn, sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(n.number || ''), p.x, p.y);
      ctx.fillStyle = ink;
    } else if (n.kind === 'note' || n.kind === 'text') {
      /* Same layout the SVG layer uses, so the baked pixels cannot disagree
         with what the reader saw while marking. */
      const p = px(n.x, n.y, W, H);
      const t = textLayout(n, W, H);
      ctx.textBaseline = 'alphabetic';
      /* The leader goes under the box, so the junction is the border and not a
         line laid over the words — the same order the SVG layer paints in. */
      const lead = tailGeometry(n, W, H);
      if (lead) {
        const ux = Math.cos(lead.ang), uy = Math.sin(lead.ang);
        const nx = -uy, ny = ux;
        const bx = lead.to.x - ux * lead.head;
        const by = lead.to.y - uy * lead.head;
        const hw = lead.head * 0.52;
        ctx.strokeStyle = ink; ctx.lineWidth = lead.sw;
        ctx.beginPath(); ctx.moveTo(lead.from.x, lead.from.y); ctx.lineTo(bx, by); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(lead.to.x, lead.to.y);
        ctx.lineTo(bx + nx * hw, by + ny * hw);
        ctx.lineTo(bx - nx * hw, by - ny * hw);
        ctx.closePath(); ctx.fill();
      }
      if (n.kind === 'note' || (n.kind === 'text' && n.bg)) {
        ctx.fillStyle = '#fffdf7'; ctx.globalAlpha = n.kind === 'note' ? 0.94 : 0.88;
        roundRect(ctx, p.x, p.y, t.boxW, t.boxH, Math.max(3, t.size * 0.3)); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = ink; ctx.lineWidth = Math.max(1, rel(WIDTH_STEPS[0], H));
        roundRect(ctx, p.x, p.y, t.boxW, t.boxH, Math.max(3, t.size * 0.3)); ctx.stroke();
      }
      ctx.fillStyle = ink; ctx.font = fontFor(n, H);
      ctx.direction = t.rtl ? 'rtl' : 'ltr';
      /* Canvas "start"/"end" follow the context direction, exactly as SVG's
         text-anchor follows the text direction. */
      const align = n.align === 'center' || n.align === 'end' ? n.align : 'start';
      const tx = align === 'center' ? p.x + t.boxW / 2
        : align === 'end' ? p.x + (t.rtl ? t.inset : t.boxW - t.inset)
        : p.x + t.textX;
      ctx.textAlign = align;
      t.lines.forEach((ln, i) => ctx.fillText(ln, tx, p.y + t.baseline + i * t.leading));
      ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(2, t.size * 0.24), 0, Math.PI * 2); ctx.fill();
      ctx.direction = 'ltr';
    } else if (n.kind === 'stamp') {
      const p = px(n.x, n.y, W, H);
      const fontPx = rel(n.size || SIZE_STEPS[1], H);
      const txt = n.text || '';
      const w = fontPx * (txt.length * 0.66 + 0.9);
      roundRect(ctx, p.x - w / 2, p.y - fontPx * 0.85, w, fontPx * 1.7, fontPx * 0.3);
      ctx.lineWidth = Math.max(1, rel(WIDTH_STEPS[0], H));
      ctx.stroke();
      ctx.font = fontFor(n, H);
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillText(txt, p.x, p.y + fontPx * 0.4);
    }
    if (n.text && (n.kind === 'rect' || n.kind === 'ellipse' || n.kind === 'arrow')) {
      drawLabel(ctx, n, W, H, ink);
    }
    ctx.restore();
  }

  function fontFor(n, H) {
    const size = rel(n.size || SIZE_STEPS[1], H);
    /* The canvas has no CSS class to inherit, so this string has to say what
       .anno-note-text says in style.css — the 500 weight and the family order
       included. Baking at 400 while the screen draws at 500 breaks the lines in
       different places, and the copy disagrees with what was just read. */
    const weight = n.bold ? 700 : 500;
    const style = n.italic ? 'italic ' : '';
    return `${style}${weight} ${size.toFixed(1)}px Vazirmatn, 'Segoe UI', Tahoma, sans-serif`;
  }

  /* The one-line caption a box or an arrow carries. Anchored through the same
     helper the live layer uses, so the baked copy keeps the side the reader
     chose. */
  function drawLabel(ctx, n, W, H, ink) {
    const at = labelAnchor(n, W, H);
    ctx.font = fontFor(n, H);
    ctx.fillStyle = ink;
    ctx.direction = detectDir(n.text);
    ctx.textAlign = at.anchor;
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(n.text, at.x, at.y);
    ctx.direction = 'ltr';
  }

  function roundRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y); ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
    ctx.lineTo(x + w, y + h - rr); ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    ctx.lineTo(x + rr, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
    ctx.lineTo(x, y + rr); ctx.quadraticCurveTo(x, y, x + rr, y);
    ctx.closePath();
  }

  async function bakeNamed(set, imgSrc) {
    /* Baking a plate that is not the one on screen: load it off-DOM first. */
    const src = imgSrc || plateHref(set.imageKey);
    if (!src) return null;
    const img = new Image();
    img.decoding = 'sync';
    const loaded = new Promise((res, rej) => { img.onload = res; img.onerror = () => rej(new Error('plate would not load')); });
    img.src = src;
    try { await loaded; } catch { return null; }
    const W = img.naturalWidth;
    const H = img.naturalHeight;
    const m = bakeMargins(set);
    const cv = document.createElement('canvas');
    cv.width = Math.round(W * (1 + m.l + m.r));
    cv.height = Math.round(H * (1 + m.t + m.b));
    const ctx = cv.getContext('2d');
    try { ctx.drawImage(img, m.l * W, m.t * H); } catch { return null; }
    await ensureImages(set);
    ctx.translate(m.l * W, m.t * H);
    drawMarks(ctx, set, W, H);
    return cv;
  }

  /* A plate's file name is the hash of its bytes and the extension follows the
     format (png, webp, gif), so it is read off the record the viewer was opened
     with. Guessing «.png» would bake a gif as nothing. */
  function plateHref(imageKey) {
    const p = state.plate || {};
    if (p.k === imageKey && (p.f || p.asset)) return p.f || p.asset;
    const img = document.getElementById('lbImage');
    const src = img && img.getAttribute('src');
    if (src && src.indexOf(imageKey) >= 0) return src;
    return '';
  }

  function download(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  async function backupAll() {
    const sets = await allSets();
    if (!sets.length) { toast('یادداشتی برای پشتیبان‌گیری نیست'); return; }
    /* A backup that leaves the pictures behind is not a backup of the board.
       Bytes are carried as data URLs because a single JSON file is the one
       thing every browser can hand back. */
    const ids = new Set();
    for (const set of sets) {
      for (const id of imageIdsOf(set)) ids.add(id);
      for (const t of (set.trash || [])) {
        if (t && t.note && t.note.kind === 'image' && t.note.fileId) ids.add(t.note.fileId);
      }
    }
    const files = [];
    for (const id of ids) {
      const rec = await getFile(id).catch(() => null);
      if (!rec || !rec.blob) continue;
      try {
        files.push({
          id: rec.id, name: rec.name, mime: rec.mime, w: rec.w, h: rec.h,
          dataURL: await blobToDataUrl(rec.blob),
        });
      } catch { /* one unreadable file must not sink the whole backup */ }
    }
    const bundle = {
      v: SCHEMA, exportedAt: new Date().toISOString(), reader: prefs.profiles, sets, files,
    };
    download(new Blob([JSON.stringify(bundle, null, 1)], { type: 'application/json' }), 'rtm-annotations-' + Date.now() + '.json');
    toast('پشتیبان ' + toFa(sets.length) + ' تصویر' + (files.length ? ' و ' + toFa(files.length) + ' تصویرِ تخته' : '') + ' دانلود شد');
  }

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result || ''));
      r.onerror = () => reject(r.error || new Error('read failed'));
      r.readAsDataURL(blob);
    });
  }

  function dataUrlToBlob(url) {
    const s = String(url || '');
    const at = s.indexOf(',');
    if (at < 0) return null;
    const mime = (s.slice(0, at).match(/^data:([^;]+)/) || [])[1] || 'application/octet-stream';
    try {
      const bin = atob(s.slice(at + 1));
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return new Blob([bytes], { type: mime });
    } catch { return null; }
  }

  async function restoreFile(file) {
    const text = await file.text();
    let bundle;
    try { bundle = JSON.parse(text); } catch { toast('فایل پشتیبان خوانده نشد'); return; }
    if (!bundle || !Array.isArray(bundle.sets)) { toast('این فایل پشتیبان یادداشت نیست'); return; }
    let files = 0;
    for (const f of (Array.isArray(bundle.files) ? bundle.files : [])) {
      if (!f || !f.id || !f.dataURL) continue;
      if (await getFile(f.id).catch(() => null)) continue;
      const blob = dataUrlToBlob(f.dataURL);
      if (!blob) continue;
      await putFile({
        id: f.id, name: f.name || '', mime: f.mime || blob.type || 'image/png',
        blob, w: f.w || 0, h: f.h || 0, bytes: blob.size || 0, createdAt: Date.now(),
      }).catch(() => {});
      imgCache.delete(f.id);   // a failed older attempt must get another chance
      files += 1;
    }
    let n = 0;
    for (const set of bundle.sets) {
      if (!set || !set.imageKey) continue;
      const doc = Object.assign({}, set, { v: SCHEMA, updatedAt: set.updatedAt || Date.now() });
      await putSet(doc);
      await bumpIndex(doc);
      n += 1;
    }
    toast('بازگردانی شد: ' + toFa(n) + ' تصویر' + (files ? ' و ' + toFa(files) + ' تصویرِ تخته' : ''));
    paintRailBadge();
    if (state.set) show(state.set.imageKey, state.plate, state.journal);
  }

  /* ----------------------------------------------------------- folder index */

  let indexCache = null;
  function bumpIndex(set) {
    const key = set.imageKey;
    const row = {
      name: set.name, updatedAt: set.updatedAt,
      marks: noteList(set).length, passes: set.passes.length,
      jid: (set.where || {}).jid || '', pid: (set.where || {}).pid || '',
      authors: Array.from(new Set(noteList(set).map(n => n.author))),
    };
    if (!indexCache) indexCache = kvGet('index').then(v => (v && typeof v === 'object') ? v : {});
    return indexCache.then(idx => {
      idx[key] = row;
      return kvSet('index', idx);
    });
  }

  function indexAll() {
    return allSets().then(sets => {
      const out = [];
      for (const set of sets) {
        if (!set || !set.passes) continue;
        for (const pass of set.passes) {
          for (const n of pass.notes) {
            out.push({
              imageKey: set.imageKey, name: set.name, where: set.where || {},
              passId: pass.id, passLabel: pass.label, passCreated: pass.createdAt,
              note: n, count: pass.notes.length, total: noteList(set).length,
            });
          }
        }
      }
      out.sort((a, b) => (b.note.updatedAt || b.note.createdAt || 0) - (a.note.updatedAt || a.note.createdAt || 0));
      return out;
    });
  }

  async function countFor(imageKey) {
    if (!imageKey) return 0;
    if (state.set && state.set.imageKey === imageKey) return noteList(state.set).length;
    const set = await getSet(imageKey);
    return set ? noteList(set).length : 0;
  }

  async function countsFor(keys) {
    const out = {};
    for (const k of keys) {
      if (!k) continue;
      out[k] = await countFor(k);
    }
    return out;
  }

  /* ---------------------------------------------------------------- chrome */

  function toast(msg, action) {
    if (typeof window.showToast === 'function') { window.showToast(msg, action ? { action } : undefined); return; }
    console.info(msg + (action ? ' [' + action.label + ']' : ''));
  }

  function paintSaveState(text) {
    state.saveLabel = text || '';
    const el = document.getElementById('annoSavedState');
    if (el) el.textContent = text || '';
  }

  function paintTools() {
    $$('.anno-tool').forEach(b => {
      const on = b.getAttribute('data-tool') === prefs.tool;
      b.classList.toggle('is-active', on);
      b.classList.toggle('is-locked', on && !!prefs.sticky);
      b.setAttribute('aria-pressed', String(on));
      /* The written title stays the tool's own name; the lock state is added
         to it, because the second click means something different now. */
      if (!b.getAttribute('data-tool')) return;
      if (!b.dataset.title) b.dataset.title = b.title;
      b.title = on ? b.dataset.title + (prefs.sticky ? ' — قفل است، هر کشیدن تکرار می‌کند' : ' — دوباره بزنید تا قفل شود') : b.dataset.title;
    });
    paintInkUi();
    const w = document.getElementById('annoWidthVal');
    if (w) w.textContent = toFa(prefs.width + 1);
    const s = document.getElementById('annoSizeVal');
    if (s) s.textContent = toFa(prefs.size + 1);
    /* The chips say what the selected mark is, not what the last click left in
       the prefs: otherwise the rail lies after a jump from one mark to another.
       With several marks they say what the whole pile agrees on. */
    const found = findNote(state.set, state.selected);
    const note = found ? found.note : null;
    const picked = selectedNotes();
    const boxes = picked.filter(f => f.note.kind === 'rect' || f.note.kind === 'ellipse');
    const box = !!note && (note.kind === 'rect' || note.kind === 'ellipse');
    const textPicked = picked.filter(f => textKind(f.note.kind));
    /* A control that cannot change anything is noise. Width belongs to the
       stroke tools, size to the written ones, fill to boxes, the stamp word to
       the stamp, and status to a mark that exists; with no selection the tool
       decides. */
    const tool = prefs.tool;
    const inSet = (list) => list.indexOf(tool) >= 0;
    const widthOn = inSet(['note', 'rect', 'ellipse', 'arrow', 'line', 'path', 'pen', 'highlight', 'stamp', 'erase'])
      || picked.some(f => ['note', 'rect', 'ellipse', 'arrow', 'line', 'path', 'pen', 'highlight', 'stamp'].indexOf(f.note.kind) >= 0);
    const sizeOn = inSet(['note', 'text', 'rect', 'ellipse', 'arrow', 'stamp']) || textPicked.length > 0;
    const fillOn = boxes.length > 0 || tool === 'rect' || tool === 'ellipse';
    const stampOn = tool === 'stamp' || picked.some(f => f.note.kind === 'stamp');
    const statusOn = picked.length > 0;
    const show = (el, on) => { if (el) el.hidden = !on; };
    show(document.getElementById('annoWidthGroup'), widthOn);
    show(document.getElementById('annoSizeGroup'), sizeOn);
    show(document.getElementById('annoFill'), fillOn);
    show(document.getElementById('annoStampPick'), stampOn);
    show(document.getElementById('annoStatusVal'), statusOn);
    show(document.getElementById('annoStatus'), statusOn);
    const fill = document.getElementById('annoFill');
    if (fill) {
      fill.setAttribute('aria-pressed', String(boxes.length ? boxes.every(f => !!f.note.fill) : (box ? !!note.fill : !!prefs.fill)));
      fill.disabled = !boxes.length && tool !== 'rect' && tool !== 'ellipse';
    }
    const st = document.getElementById('annoStatusVal');
    if (st) st.textContent = picked.length > 1 ? toFa(picked.length) + ' برگزیده' : statusMeta(note ? note.status : '').label;
    const stamp = document.getElementById('annoStampVal');
    if (stamp) stamp.textContent = prefs.stamp;
    const un = document.getElementById('annoUndo');
    if (un) un.disabled = !state.undo.length;
    const rd = document.getElementById('annoRedo');
    if (rd) rd.disabled = !state.redo.length;
    const dup = document.getElementById('annoDuplicate');
    if (dup) dup.disabled = !picked.length;
    const del = document.getElementById('annoDelete');
    if (del) del.disabled = !picked.length;
    paintQuick();
  }

  function $$(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }
  function $(sel) { return document.querySelector(sel); }

  /* `quiet` is the automatic relax back to the pointer after a mark: it must
     not overwrite the instrument the reader actually chose. */
  function setTool(tool, opts) {
    const quiet = !!(opts && opts.quiet);
    if (!TOOLS.includes(tool)) return;
    /* «تصویر» is a one-shot command, not an instrument: choosing it opens the
       picker and leaves the pen where it was. */
    if (tool === 'image') { pickImages(); return; }
    /* Changing the instrument by hand ends the sentence being typed; the
       automatic relax back to the pointer must not, or a note would close the
       moment it is born. */
    if (!quiet) closeEditor(true);
    /* Changing instrument mid-stroke abandons the live line instead of leaving
       an outline glued to the plate that no pointerup will ever finish. */
    if (draft && isInkKind(draft.kind) && draft.kind !== tool) {
      draft = null;
      clearLiveInk();
      inkCursor = null;
    }
    /* Leaving the path tool abandons an unfinished path instead of parking it
       over the chart where the next click in another tool could not end it. */
    if (draft && draft.kind === 'path' && tool !== 'path') { draft = null; renderLayer(); }
    prefs.tool = tool;
    lastTap = null;
    if (!quiet) { prefs.lastTool = tool; hideHelp(); }
    savePrefs();
    if (layer) layer.classList.toggle('is-capturing', tool !== 'select');
    /* One tool class at a time: they set the cursor, and a layer that still
       carries tool-erase after the pointer is back reports the wrong hand. */
    if (layer) {
      for (const t of TOOLS) layer.classList.toggle('tool-' + t, t === tool);
    }
    paintTools();
    const el = document.getElementById('lbStatus');
    if (el) el.textContent = 'ابزار: ' + (TOOL_LABEL[tool] || tool) + (isInkKind(tool) ? ' — Esc قلم را زمین می‌گذارد' : '');
  }

  /* The notes column is the reader's to open. It never shows itself — not when
     the mode starts, not while the hand is on the plate, not when a note is
     being typed — because measured at 720x900 an open sheet covered 39% of the
     chart and at 632x570 73% of it, and marks under it could not be clicked.
     The plate keeps every pixel until the edge tab is pressed. */
  function paintPanel() {
    const on = annotating();
    const shown = on && !!state.panelOpen;
    const panel = $('#annoPanel');
    if (panel) panel.hidden = !shown;
    const shell = $('#viewerShell');
    /* The grid track is only reserved with the list standing in it; a shut
       panel would otherwise leave a 300–420px hole where the chart belongs. */
    if (shell) shell.classList.toggle('has-anno', shown);
    const peek = $('#annoPeek');
    if (peek) peek.hidden = !on || shown;
    paintPeekCount();
  }

  function paintPeekCount() {
    const el = $('#annoPeekCount');
    if (!el) return;
    const n = state.set ? noteList(state.set).length : 0;
    el.textContent = n ? toFa(n) : '';
  }

  function setPanel(open) {
    state.panelOpen = !!open;
    paintPanel();
    /* The surface itself takes focus, not its «بستن» button: a programmatic
       focus on the button painted a blue ring on a touch screen, where it read
       as a selection. The panel still catches Tab and Esc like before. */
    const el = open ? $('#annoPanel') : $('#annoPeek');
    if (el && !el.hidden) el.focus({ preventScroll: true });
  }

  /* The sheet is open only while it is being read: picking a tool, leaving the
     mode or pressing Esc puts the surface back under the pointer. */
  function toggleHelp() {
    const box = document.getElementById('annoHelp');
    if (!box) return;
    box.hidden = !box.hidden;
    const btn = document.getElementById('annoHelpBtn');
    if (btn) btn.setAttribute('aria-expanded', String(!box.hidden));
  }

  function hideHelp() {
    const box = document.getElementById('annoHelp');
    if (box && !box.hidden) toggleHelp();
  }

  function toggleAnno(force) {
    const lb = $('#lightbox');
    if (!lb) return false;
    const on = force === undefined ? !lb.classList.contains('is-annotating') : !!force;
    const hadBoard = boardOn();
    lb.classList.toggle('is-annotating', on);
    /* Turning the mode on or off always leaves the list shut: the column is
       asked for, never handed over — and a shut column gives the plate its
       width back instead of reserving an empty track. */
    state.panelOpen = false;
    const rail = $('#annoRail');
    if (rail) rail.hidden = !on;
    paintPanel();
    const btn = $('#lbAnnotate');
    if (btn) { btn.classList.toggle('is-active', on); btn.setAttribute('aria-pressed', String(on)); }
    if (layer) layer.classList.toggle('is-shown', on);
    if (on) {
      /* Entering the mode hands back the instrument the reader was last using,
         so a second reading starts where the first stopped. */
      if (TOOLS.includes(prefs.lastTool) && prefs.lastTool !== 'select') setTool(prefs.lastTool, { quiet: true });
      if (layer) layer.classList.toggle('is-capturing', prefs.tool !== 'select');
      paintTools(); renderList();
    }
    else {
      closeEditor(true);
      hideHelp();
      closeInkPop(false);
      hideMenu();
      draft = null;
      clearLiveInk();
      inkCursor = null;
      resetTouches();
      if (layer) { layer.classList.remove('is-capturing'); }
    }
    /* The layer's viewBox and the board's padding both depend on the mode. */
    paintBoardPad();
    renderLayer();
    if (hadBoard !== boardOn()) requestAnimationFrame(centerBoard);
    return on;
  }

  function annotating() {
    const lb = $('#lightbox');
    return !!lb && lb.classList.contains('is-annotating');
  }

  /* --------------------------------------------------------------- bindings */

  /* -------------------------------------------- selection actions (quick/menu) */

  const LOCK_SVG = `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10V8a5 5 0 0 1 10 0v2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><rect x="5" y="10" width="14" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;

  function ensureQuick() {
    if (quickEl) return quickEl;
    const lb = document.getElementById('lightbox');
    if (!lb) return null;
    quickEl = document.createElement('div');
    quickEl.className = 'anno-quick';
    quickEl.id = 'annoQuick';
    quickEl.hidden = true;
    quickEl.setAttribute('role', 'toolbar');
    quickEl.setAttribute('aria-label', 'کارهای یادداشتِ برگزیده');
    quickEl.innerHTML = `
      <button type="button" class="aq-btn" data-qact="edit" title="ویرایش متن (Enter)">${iconFor('type')}</button>
      <button type="button" class="aq-btn aq-inkbtn" data-qact="ink" title="رنگ" aria-label="رنگ" aria-haspopup="dialog" aria-expanded="false"><span class="aq-inkdot"></span></button>
      <span class="aq-sep" data-qsep="1"></span>
      <button type="button" class="aq-btn aq-glyph" data-qact="bold" title="توپُر"><b>B</b></button>
      <button type="button" class="aq-btn aq-glyph" data-qact="italic" title="کج"><i>I</i></button>
      <button type="button" class="aq-btn aq-glyph" data-qact="align" title="چیدنِ متن"><span class="aq-align-glyph">≡</span></button>
      <span class="aq-sep"></span>
      <button type="button" class="aq-btn" data-qact="dup" title="یک نسخهٔ دیگر (Ctrl+D)">${iconFor('copy')}</button>
      <button type="button" class="aq-btn" data-qact="front" title="بیاور روی همه">${iconFor('layer')}</button>
      <button type="button" class="aq-btn" data-qact="lock" title="قفل">${LOCK_SVG}</button>
      <button type="button" class="aq-btn" data-qact="more" title="همهٔ کارها">⋯</button>
      <button type="button" class="aq-btn is-danger" data-qact="delete" title="پاک کردن (Delete)">${iconFor('trash')}</button>`;
    lb.appendChild(quickEl);
    quickEl.addEventListener('pointerdown', e => e.stopPropagation());
    quickEl.addEventListener('click', onQuickClick);
    return quickEl;
  }

  function paintQuick() {
    const el = ensureQuick();
    if (!el) return;
    const picked = selectedNotes();
    if (!annotating() || !picked.length || drag || draft || (editor && !editor.hidden)) {
      el.hidden = true;
      return;
    }
    const pn = (findNote(state.set, state.selected) || {}).note || null;
    const textPicked = picked.filter(f => textKind(f.note.kind));
    const show = (sel, on) => { const b = el.querySelector(sel); if (b) b.hidden = !on; };
    show('[data-qact="edit"]', !!pn && textKind(pn.kind));
    const hasPainted = picked.some(f => f.note.kind !== 'image');
    show('[data-qact="ink"]', hasPainted);
    show('[data-qsep="1"]', hasPainted);
    show('[data-qact="bold"]', textPicked.length > 0);
    show('[data-qact="italic"]', textPicked.length > 0);
    show('[data-qact="align"]', textPicked.length > 0);

    const bold = el.querySelector('[data-qact="bold"]');
    if (bold) bold.setAttribute('aria-pressed', String(textPicked.length > 0 && textPicked.every(f => !!f.note.bold)));
    const italic = el.querySelector('[data-qact="italic"]');
    if (italic) italic.setAttribute('aria-pressed', String(textPicked.length > 0 && textPicked.every(f => !!f.note.italic)));
    const align = el.querySelector('[data-qact="align"]');
    if (align) align.title = 'چیدنِ متن: ' + ALIGN_LABEL[alignOf(pn || { kind: 'note' })];
    const lock = el.querySelector('[data-qact="lock"]');
    if (lock) {
      const all = picked.every(f => !!f.note.locked);
      lock.classList.toggle('is-on', all);
      lock.setAttribute('aria-pressed', String(all));
      lock.title = all ? 'برداشتنِ قفل' : 'قفل کردن';
    }
    const inkBtn = el.querySelector('.aq-inkbtn');
    if (inkBtn) {
      const cur = effectiveInk();
      const dot = inkBtn.querySelector('.aq-inkdot');
      if (dot) dot.style.setProperty('--ink-dot', cur ? inkHex(cur) : MIXED_INK);
      inkBtn.title = cur ? 'رنگ — ' + inkLabel(cur) : 'رنگ — چند رنگ';
    }

    const stage = document.getElementById('lbImageStage');
    const lb = document.getElementById('lightbox');
    if (!stage || !lb) { el.hidden = true; return; }
    const sr = stage.getBoundingClientRect();
    const lr = lb.getBoundingClientRect();
    const { W, H } = plateSize();
    let x0 = 1, y0 = 1, x1 = 0, y1 = 0;
    for (const f of picked) {
      const b = normBounds(f.note, W, H);
      x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y);
      x1 = Math.max(x1, b.x + b.w); y1 = Math.max(y1, b.y + b.h);
    }
    const left = sr.left - lr.left + x0 * sr.width;
    const right = sr.left - lr.left + x1 * sr.width;
    const top = sr.top - lr.top + y0 * sr.height;
    const bottom = sr.top - lr.top + y1 * sr.height;
    el.hidden = false;
    el.style.visibility = 'hidden';
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    let x = clamp((left + right) / 2 - w / 2, 8, Math.max(8, lr.width - w - 8));
    let y = top - h - 10;
    if (y < 8) y = bottom + 10;
    y = clamp(y, 8, Math.max(8, lr.height - h - 8));
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.visibility = '';
  }

  /* One switch for every surface that runs a selection command. The quick bar,
     the context menu and (later) any new surface call the same names, so an
     action cannot mean one thing in one place and something else in another. */
  function runCommand(act) {
    if (act === 'edit') return openEditor(state.selected);
    if (act === 'openimage') return openImageFile(state.selected);
    if (act === 'replaceimage') return pickImages(state.selected);
    if (act === 'duplicate' || act === 'dup') return duplicateSelected();
    if (act === 'flip') return flipArrow(state.selected);
    if (act === 'copy') return copySelection(false);
    if (act === 'cut') return copySelection(true);
    if (act === 'paste') return pasteClipboard();
    if (act === 'front' || act === 'forward' || act === 'backward' || act === 'back') return arrangeSelection(act);
    if (act === 'bold') return toggleTextStyle('bold');
    if (act === 'italic') return toggleTextStyle('italic');
    if (act === 'align') return cycleAlign();
    if (act === 'bg') return toggleTextBackground();
    if (act === 'fill') return toggleFill();
    if (act === 'lock') return toggleLock();
    if (act === 'delete') return removeSelected();
    if (act === 'restore') return restoreLastDeleted();
    if (act === 'selectAll') return selectAll();
  }

  function onQuickClick(e) {
    const b = e.target.closest('[data-qact]');
    if (!b) return;
    e.preventDefault();
    const act = b.getAttribute('data-qact');
    if (act === 'ink') return toggleInkPop(b);
    if (act === 'more') {
      const r = quickEl.getBoundingClientRect();
      return openMenu(r.left + 6, r.bottom + 6);
    }
    return runCommand(act);
  }

  function ensureMenu() {
    if (menuEl) return menuEl;
    const lb = document.getElementById('lightbox');
    if (!lb) return null;
    menuEl = document.createElement('div');
    menuEl.className = 'anno-menu';
    menuEl.id = 'annoMenu';
    menuEl.hidden = true;
    menuEl.tabIndex = -1;
    menuEl.setAttribute('role', 'menu');
    lb.appendChild(menuEl);
    menuEl.addEventListener('pointerdown', e => e.stopPropagation());
    menuEl.addEventListener('click', onMenuClick);
    return menuEl;
  }

  function hideMenu(refocus) {
    if (!menuEl || menuEl.hidden) { menuOpener = null; return; }
    const hadFocus = menuEl.contains(document.activeElement);
    menuEl.hidden = true;
    if (hadFocus) {
      const back = menuOpener && menuOpener.isConnected ? menuOpener : null;
      if (back && typeof back.focus === 'function') back.focus({ preventScroll: true });
      else if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    }
    menuOpener = null;
  }

  /* A menu is a small mode: arrows walk it, Home/End jump, Enter activates,
     Escape returns where the reader came from, and canvas letters wait until
     it closes. Without this a right-click menu is mouse-only. */
  function menuKey(e, k) {
    const items = Array.from(menuEl.querySelectorAll('.anno-menu-item:not(:disabled)'));
    const active = document.activeElement;
    const at = items.indexOf(active);
    if (k === 'escape') { e.preventDefault(); hideMenu(); return true; }
    if (k === 'tab') { hideMenu(); return false; }
    if (k === 'arrowdown' || k === 'arrowup' || k === 'home' || k === 'end') {
      e.preventDefault();
      let i = at;
      if (k === 'arrowdown') i = at < 0 ? 0 : (at + 1) % items.length;
      else if (k === 'arrowup') i = at < 0 ? items.length - 1 : (at - 1 + items.length) % items.length;
      else if (k === 'home') i = 0;
      else i = items.length - 1;
      if (items[i]) items[i].focus();
      return true;
    }
    if (k === 'enter' || k === ' ' || k === 'spacebar') {
      if (items[at]) { e.preventDefault(); items[at].click(); }
      return true;
    }
    return true;
  }

  function openMenu(clientX, clientY) {
    const el = ensureMenu();
    if (!el) return;
    menuOpener = document.activeElement && document.activeElement !== document.body ? document.activeElement : null;
    const picked = selectedNotes();
    const pn = (findNote(state.set, state.selected) || {}).note || null;
    const rows = [];
    const item = (act, label, hint, opts) => {
      const o = opts || {};
      rows.push(`<button type="button" class="anno-menu-item${o.danger ? ' is-danger' : ''}" data-mact="${act}" role="menuitem"${o.disabled ? ' disabled' : ''}><span>${label}</span>${hint ? `<kbd>${hint}</kbd>` : ''}</button>`);
    };
    const sep = () => rows.push('<div class="anno-menu-sep" role="separator"></div>');

    if (picked.length) {
      if (pn && textKind(pn.kind)) item('edit', 'ویرایش متن', 'Enter');
      if (picked.length === 1 && pn && pn.kind === 'image') {
        item('openimage', 'بازکردن تصویر در زبانهٔ تازه');
        item('replaceimage', 'جایگزینی با تصویر دیگر');
        sep();
      }
      item('duplicate', 'یک نسخهٔ دیگر', 'Ctrl+D');
      if (picked.length === 1 && pn && pn.kind === 'arrow') item('flip', 'سرِ پیکان را برگردان', 'X');
      sep();
      item('copy', 'رونوشت', 'Ctrl+C');
      item('cut', 'برش', 'Ctrl+X');
      item('paste', 'جای‌گذاری', 'Ctrl+V', { disabled: !clipboard.length });
      sep();
      item('front', 'بیاور روی همه');
      item('forward', 'یک لایه جلو');
      item('backward', 'یک لایه عقب');
      item('back', 'بفرست زیر همه');
      sep();
      if (picked.some(f => textKind(f.note.kind))) {
        item('bold', 'توپُر');
        item('italic', 'کج');
        item('align', 'چیدنِ متن: ' + ALIGN_LABEL[alignOf(pn || { kind: 'note' })]);
        if (picked.some(f => f.note.kind === 'text')) item('bg', 'پس‌زمینهٔ متن');
        sep();
      }
      if (picked.some(f => f.note.kind === 'rect' || f.note.kind === 'ellipse')) {
        item('fill', 'پُر کردن چارچوب');
        sep();
      }
      item('lock', picked.every(f => f.note.locked) ? 'برداشتنِ قفل' : 'قفل کردن');
      sep();
      item('delete', 'پاک کردن', 'Del', { danger: true });
      rows.push(`<div class="anno-menu-inks" role="group" aria-label="رنگ"><span>رنگ</span>${CORE_INKS.map(i =>
        `<button type="button" class="anno-ink${picked.every(f => sameInk(f.note.color, i.id)) ? ' is-active' : ''}" data-mink="${i.id}" title="${escText(i.label)}" style="--ink-dot:${i.hex}"></button>`).join('')}<button type="button" class="anno-ink is-more" data-inkopen title="رنگ دلخواه" aria-label="رنگ دلخواه" style="--ink-dot:${MIXED_INK}"></button></div>`);
    } else {
      item('paste', 'جای‌گذاری', 'Ctrl+V', { disabled: !clipboard.length });
      item('selectAll', 'برگزیدن همه', 'Ctrl+A');
      sep();
      item('close', 'بستن');
    }
    const trashCount = state.set && Array.isArray(state.set.trash) ? state.set.trash.length : 0;
    if (trashCount) {
      sep();
      item('restore', 'بازگرداندنِ آخرین پاک‌شده (' + toFa(trashCount) + ')');
    }
    el.innerHTML = rows.join('');
    el.hidden = false;
    el.style.visibility = 'hidden';
    const lb = document.getElementById('lightbox').getBoundingClientRect();
    let x = clientX - lb.left;
    let y = clientY - lb.top;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    x = clamp(x, 8, Math.max(8, lb.width - w - 8));
    y = clamp(y, 8, Math.max(8, lb.height - h - 8));
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.visibility = '';
    el.focus({ preventScroll: true });
  }

  function onMenuClick(e) {
    if (e.target.closest('[data-inkopen]')) {
      hideMenu();
      openInkPop(document.getElementById('annoInk') || document.querySelector('.aq-inkbtn'));
      return;
    }
    const ink = e.target.closest('[data-mink]');
    if (ink) { applyInk(ink.getAttribute('data-mink')); hideMenu(); return; }
    const b = e.target.closest('[data-mact]');
    if (!b || b.disabled) return;
    const act = b.getAttribute('data-mact');
    hideMenu();
    if (act === 'close') return;
    return runCommand(act);
  }

  function onLayerContext(e) {
    e.preventDefault();
    e.stopPropagation();
    const g = e.target.closest ? e.target.closest('.anno-mark') : null;
    const id = g && g.getAttribute('data-id');
    if (id && !isSelected(id)) { writeSelection([id]); renderLayer(); }
    openMenu(e.clientX, e.clientY);
  }

  /* ------------------------------------------------------------- ink picker */

  let inkPop = null;
  let inkPopOpener = null;

  function ensureInkPop() {
    if (inkPop) return inkPop;
    const lb = document.getElementById('lightbox');
    if (!lb) return null;
    inkPop = document.createElement('div');
    inkPop.className = 'anno-inkpop';
    inkPop.id = 'annoInkPop';
    inkPop.hidden = true;
    inkPop.tabIndex = -1;
    inkPop.setAttribute('role', 'dialog');
    inkPop.setAttribute('aria-label', 'رنگ مرکب');
    inkPop.innerHTML = `
      <div class="anno-inkpop-head"><span>رنگ مرکب</span><span class="anno-inkpop-hex" id="annoInkHex">—</span></div>
      <div class="anno-inkpop-grid" role="group" aria-label="رنگ‌های آماده">${INKS.map(i =>
        `<button type="button" class="anno-ink" data-inkref="${i.id}" data-inkhex="${i.hex}" title="${escText(i.label)}" aria-label="${escText(i.label)}" aria-pressed="false" style="--ink-dot:${i.hex}"></button>`).join('')}</div>
      <div class="anno-inkpop-recent" id="annoInkRecent" role="group" aria-label="رنگ‌های اخیر" hidden><span class="anno-inkpop-tag">اخیر</span></div>
      <div class="anno-inkpop-foot">
        <label class="anno-inkpop-custom" title="رنگ دلخواه">
          <span class="anno-rainbow" aria-hidden="true"></span><span>رنگ دلخواه</span>
          <input type="color" id="annoInkCustom" aria-label="رنگ دلخواه">
        </label>
        <button type="button" class="anno-inkpop-eye" id="annoInkEye" title="برداشتن رنگ از تصویر" aria-label="برداشتن رنگ از تصویر"><svg class="icon"><use href="#i-eyedropper"/></svg></button>
      </div>`;
    lb.appendChild(inkPop);
    inkPop.addEventListener('pointerdown', e => e.stopPropagation());
    inkPop.addEventListener('click', onInkPopClick);
    const custom = inkPop.querySelector('#annoInkCustom');
    custom.addEventListener('input', () => {
      beginInkGesture();
      chooseInk(custom.value, { live: true });
      const hex = inkPop.querySelector('#annoInkHex');
      if (hex) hex.textContent = normHex(custom.value) || '—';
    });
    custom.addEventListener('change', finishInkGesture);
    custom.addEventListener('blur', finishInkGesture);
    const eye = inkPop.querySelector('#annoInkEye');
    eye.disabled = !('EyeDropper' in window);
    if (eye.disabled) eye.title = 'این مرورگر قطره‌چین ندارد';
    return inkPop;
  }

  function onInkPopClick(e) {
    if (e.target.closest('#annoInkEye')) { pickInkFromScreen(); return; }
    const sw = e.target.closest('[data-inkref], [data-inkhex]');
    if (!sw) return;
    chooseInk(sw.getAttribute('data-inkref') || sw.getAttribute('data-inkhex'));
  }

  function paintInkButton() {
    const cur = effectiveInk();
    const btn = document.getElementById('annoInk');
    if (btn) {
      btn.title = 'رنگ مرکب' + (cur ? ' — ' + inkLabel(cur) : ' — چند رنگ');
      btn.setAttribute('aria-label', btn.title);
    }
    const dot = document.getElementById('annoInkDot');
    if (dot) dot.style.setProperty('--ink-dot', cur ? inkHex(cur) : MIXED_INK);
  }

  function paintInkPop() {
    if (!inkPop || inkPop.hidden) return;
    const cur = effectiveInk();
    const hexEl = inkPop.querySelector('#annoInkHex');
    if (hexEl) hexEl.textContent = cur ? inkHex(cur) : 'چند رنگ';
    for (const b of inkPop.querySelectorAll('[data-inkref]')) {
      const on = !!cur && sameInk(cur, b.getAttribute('data-inkref'));
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', String(on));
    }
    const recent = inkPop.querySelector('#annoInkRecent');
    if (recent) {
      const list = (Array.isArray(prefs.recentInks) ? prefs.recentInks : [])
        .map(normHex).filter(Boolean).slice(0, 6);
      const sig = list.join(',');
      if (recent.dataset.sig !== sig) {
        recent.dataset.sig = sig;
        recent.innerHTML = '<span class="anno-inkpop-tag">اخیر</span>' + list.map(h =>
          `<button type="button" class="anno-ink" data-inkhex="${h}" title="${escText(h)}" aria-label="${escText(h)}" style="--ink-dot:${h}"></button>`).join('');
      }
      for (const b of recent.querySelectorAll('[data-inkhex]')) {
        b.classList.toggle('is-active', !!cur && sameInk(cur, b.getAttribute('data-inkhex')));
      }
      recent.hidden = !list.length;
    }
    const custom = inkPop.querySelector('#annoInkCustom');
    if (custom && document.activeElement !== custom) custom.value = cur ? inkHex(cur) : inkHex(prefs.ink);
  }

  function paintInkUi() {
    paintInkButton();
    if (inkPop && !inkPop.hidden) paintInkPop();
  }

  function openInkPop(anchor) {
    const el = ensureInkPop();
    if (!el) return;
    inkPopOpener = anchor || document.activeElement;
    el.hidden = false;
    el.style.visibility = 'hidden';
    paintInkPop();
    const lb = document.getElementById('lightbox');
    if (!lb) { el.hidden = true; return; }
    const lr = lb.getBoundingClientRect();
    const ar = anchor && anchor.getBoundingClientRect ? anchor.getBoundingClientRect() : null;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    let x = ar ? ar.left - lr.left : (lr.width - w) / 2;
    let y = ar ? ar.bottom - lr.top + 8 : 60;
    if (y + h > lr.height - 8) y = ar ? ar.top - lr.top - h - 8 : y;
    x = clamp(x, 8, Math.max(8, lr.width - w - 8));
    y = clamp(y, 8, Math.max(8, lr.height - h - 8));
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.visibility = '';
    if (anchor && anchor.setAttribute) anchor.setAttribute('aria-expanded', 'true');
    const first = el.querySelector('.anno-ink.is-active') || el.querySelector('.anno-ink');
    if (first) first.focus({ preventScroll: true });
  }

  function closeInkPop(refocus) {
    finishInkGesture();
    if (!inkPop || inkPop.hidden) return;
    const hadFocus = inkPop.contains(document.activeElement);
    inkPop.hidden = true;
    const back = inkPopOpener;
    inkPopOpener = null;
    if (back && back.setAttribute) back.setAttribute('aria-expanded', 'false');
    const railBtn = document.getElementById('annoInk');
    if (railBtn) railBtn.setAttribute('aria-expanded', 'false');
    const quickBtn = document.querySelector('.aq-inkbtn');
    if (quickBtn) quickBtn.setAttribute('aria-expanded', 'false');
    if (hadFocus && refocus !== false && back && back.isConnected && typeof back.focus === 'function') {
      back.focus({ preventScroll: true });
    }
  }

  function toggleInkPop(anchor) {
    if (inkPop && !inkPop.hidden) { closeInkPop(); return; }
    openInkPop(anchor);
  }

  function wireSelectionUi() {
    if (selectionUiWired) return;
    selectionUiWired = true;
    document.addEventListener('pointerdown', (e) => {
      if (menuEl && !menuEl.hidden && !menuEl.contains(e.target)) hideMenu();
      if (inkPop && !inkPop.hidden && !inkPop.contains(e.target)
          && !e.target.closest('#annoInk') && !e.target.closest('.aq-inkbtn')) {
        closeInkPop(false);
      }
    }, true);
    /* The quick bar and the menu hang off the plate in screen space, so when
       the plate slides under them the anchoring has to be recomputed. The
       menu closes instead of chasing the cursor: it points at a spot. */
    const scroller = document.getElementById('lbImageScroll');
    if (scroller) {
      scroller.addEventListener('scroll', () => {
        if (menuEl && !menuEl.hidden) hideMenu();
        if (inkPop && !inkPop.hidden) closeInkPop(false);
        if (annotating()) paintQuick();
      }, { passive: true });
    }
    window.addEventListener('resize', () => {
      if (menuEl && !menuEl.hidden) hideMenu();
      if (inkPop && !inkPop.hidden) closeInkPop(false);
      if (annotating()) paintQuick();
    }, { passive: true });
  }

  function wirePanel() {
    const panel = $('#annoPanel');
    if (!panel || panel.dataset.bound) return;
    panel.dataset.bound = '1';

    panel.addEventListener('click', (e) => {
      const row = e.target.closest('.anno-row');
      const act = e.target.closest('[data-act]');
      if (act) {
        const kind = act.getAttribute('data-act');
        const id = row ? row.getAttribute('data-id') : act.getAttribute('data-pass') || '';
        if (kind === 'jump') return jumpTo(id);
        if (kind === 'edit') { select(id); return openEditor(id); }
        if (kind === 'flip') { select(id); return flipArrow(id); }
        if (kind === 'delete') { select(id); return removeSelected(); }
        if (kind === 'focus-pass') { state.passId = act.getAttribute('data-pass'); renderList(); renderLayer(); return; }
        if (kind === 'clear-pass') {
          /* Named by its own button, not by whichever pass happens to be
             current — the older pass is the one that gets emptied. */
          const p = (state.set ? state.set.passes : []).find(x => x.id === id);
          if (!p) return;
          if (!p.notes.length) { toast('«' + p.label + '» خالی است'); return; }
          const count = p.notes.length;
          pushUndo();
          trashPush(state.set, p.id, p.notes);
          p.notes.length = 0;
          if (state.selected && !findNote(state.set, state.selected)) state.selected = '';
          touch(); renderList(); renderLayer(); paintTools();
          toast(toFa(count) + ' یادداشتِ «' + p.label + '» پاک شد', { label: 'بازگردانی', onClick: undo });
          return;
        }
        if (kind === 'drop-pass') {
          /* Only an empty pass can be removed, and never the last one — an
             empty pass is a mis-click, not a place where work was stored. */
          const list = state.set ? state.set.passes : [];
          const i = list.findIndex(x => x.id === id);
          if (i < 0 || list[i].notes.length || list.length < 2) return;
          pushUndo();
          list.splice(i, 1);
          if (state.passId === id) state.passId = list[list.length - 1].id;
          touch(); renderList(); renderLayer();
          return;
        }
      }
      if (row) {
        const id = row.getAttribute('data-id');
        if (e.shiftKey || e.metaKey || e.ctrlKey) toggleInSelection(id);
        else { select(id); renderLayer(); }
      }
    });

    panel.addEventListener('dblclick', (e) => {
      const row = e.target.closest('.anno-row');
      if (row) openEditor(row.getAttribute('data-id'));
    });

    panel.addEventListener('contextmenu', (e) => {
      const row = e.target.closest('.anno-row');
      if (!row) return;
      e.preventDefault();
      const id = row.getAttribute('data-id');
      if (!isSelected(id)) writeSelection([id]);
      renderLayer();
      openMenu(e.clientX, e.clientY);
    });

    panel.addEventListener('keydown', (e) => {
      const row = e.target.closest('.anno-row');
      if (!row) return;
      if (e.key === 'Enter') { e.preventDefault(); select(row.getAttribute('data-id')); openEditor(row.getAttribute('data-id')); }
    });

    $('#annoNewPass')?.addEventListener('click', () => {
      if (!state.set) return;
      pushUndo();
      const p = newPass(state.set);
      state.passId = p.id;
      touch(); renderList(); renderLayer();
      toast('گذر تازه: ' + p.label);
    });
    $('#annoPassName')?.addEventListener('change', () => {
      const p = activePass(state.set);
      const v = $('#annoPassName').value.trim();
      if (!p || !v) return;
      pushUndo(); p.label = v; touch(); renderList();
    });
    $('#annoLinkFolder')?.addEventListener('click', () => {
      linkFolder().then(() => toast('پوشه وصل شد — از این پس کپیِ یادداشت‌دار کنار تصویر نوشته می‌شود'))
        .catch(err => toast(err && err.message ? err.message : 'اتصال پوشه ممکن نشد'));
    });
    $('#annoUnlinkFolder')?.addEventListener('click', () => { unlinkFolder(); toast('وصل‌کردن پوشه لغو شد؛ یادداشت‌ها در همین مرورگر می‌مانند'); });
    $('#annoWriteNow')?.addEventListener('click', () => {
      if (!state.folder) { toast('پوشه‌ای وصل نیست — «وصل کردن پوشه» را بزنید'); return; }
      writeSidecar().then(ok => toast(ok ? 'روی دیسک نوشته شد' : 'نوشتن روی دیسک ممکن نشد'));
    });
    $('#annoBake')?.addEventListener('click', () => {
      if (!state.set) return;
      bakePng(state.set).then(b => {
        if (!b) { toast('تصویر ساخته نشد'); return; }
        download(b, sidecarName(state.set) + '.marked.png');
        toast('کپیِ یادداشت‌دار دانلود شد');
      });
    });
    $('#annoExportMd')?.addEventListener('click', () => {
      if (!state.set) return;
      download(new Blob([toMarkdown(state.set)], { type: 'text/markdown;charset=utf-8' }), sidecarName(state.set) + '.notes.md');
    });
    $('#annoBackup')?.addEventListener('click', () => backupAll());
    $('#annoUndelete')?.addEventListener('click', () => restoreLastDeleted());
    $('#annoRestore')?.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file'; input.accept = 'application/json,.json';
      input.addEventListener('change', () => { if (input.files && input.files[0]) restoreFile(input.files[0]); });
      input.click();
    });
    $$('.anno-filter', $('#annoPanel') || document).forEach(b => b.addEventListener('click', () => {
      state.listFilter = b.getAttribute('data-filter');
      $$('.anno-filter').forEach(x => x.classList.toggle('is-active', x === b));
      renderList();
    }));
    $('#annoHelpBtn')?.addEventListener('click', toggleHelp);
    $('#annoPeek')?.addEventListener('click', () => setPanel(true));
    $('#annoPanelClose')?.addEventListener('click', () => setPanel(false));
    $('#annoAuthorPick')?.addEventListener('click', () => cycleProfile());
    $('#annoStatus')?.addEventListener('click', () => {
      const order = STATUSES.map(s => s.id);
      const picked = selectedNotes();
      const found = findNote(state.set, state.selected);
      if (!picked.length || !found) { toast('اول یک یادداشت را برگزینید'); return; }
      const next = order[(order.indexOf(found.note.status || '') + 1) % order.length];
      pushUndo();
      for (const f of picked) f.note.status = next;
      touch(); renderLayer(); renderList(); paintTools();
    });
    $('#annoDuplicate')?.addEventListener('click', () => duplicateSelected());
    $('#annoDelete')?.addEventListener('click', () => removeSelected());
    $('#annoUndo')?.addEventListener('click', undo);
    $('#annoRedo')?.addEventListener('click', redo);
  }

  function wireRail() {
    const rail = $('#annoRail');
    if (!rail || rail.dataset.bound) return;
    rail.dataset.bound = '1';
    rail.addEventListener('click', (e) => {
      const tool = e.target.closest('.anno-tool');
      if (tool) {
        const name = tool.getAttribute('data-tool');
        if (!name) return;
        /* The same tool clicked again is the lock: like Excalidraw's lock, it
           says “I am drawing several of these”, and until then one drag makes
           one mark and the pointer comes back. */
        if (name === prefs.tool && name !== 'select') {
          prefs.sticky = !prefs.sticky;
          savePrefs(); paintTools();
          const el = document.getElementById('lbStatus');
          if (el) el.textContent = TOOL_LABEL[name] + (prefs.sticky ? ' قفل شد — هر کشیدن یکی می‌سازد' : ' آزاد شد — بعد از هر یادداشت به برگزیدن برمی‌گردد');
          return;
        }
        if (name === 'select' && prefs.sticky) { prefs.sticky = false; savePrefs(); }
        setTool(name);
        return;
      }
      const inkBtn = e.target.closest('#annoInk');
      if (inkBtn) { toggleInkPop(inkBtn); return; }
      const step = e.target.closest('[data-step]');
      if (step) {
        const kind = step.getAttribute('data-step');
        const dir = step.getAttribute('data-dir') === 'up' ? 1 : -1;
        if (kind === 'width') prefs.width = clamp(prefs.width + dir, 0, WIDTH_STEPS.length - 1);
        if (kind === 'size') prefs.size = clamp(prefs.size + dir, 0, SIZE_STEPS.length - 1);
        savePrefs(); paintTools();
        const found = selectedNotes();
        if (found.length) {
          pushUndo();
          for (const f of found) {
            if (kind === 'width') f.note.sw = WIDTH_STEPS[prefs.width];
            if (kind === 'size') f.note.size = SIZE_STEPS[prefs.size];
          }
          touch(); renderLayer(); renderList();
        }
        return;
      }
      if (e.target.closest('#annoFill')) {
        prefs.fill = !prefs.fill;
        savePrefs();
        if (selectedNotes().length) toggleFill();
        else paintTools();
        return;
      }
      if (e.target.closest('#annoStampPick')) {
        const i = STAMPS.indexOf(prefs.stamp);
        prefs.stamp = STAMPS[(i + 1) % STAMPS.length];
        savePrefs(); paintTools();
        const found = selectedNotes().filter(f => f.note.kind === 'stamp');
        if (found.length) {
          pushUndo();
          for (const f of found) f.note.text = prefs.stamp;
          touch(); renderLayer(); renderList();
        }
        return;
      }
    });
  }

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function cycleProfile() {
    const i = prefs.profiles.findIndex(p => p.id === prefs.activeProfile);
    const next = prefs.profiles[(i + 1) % prefs.profiles.length];
    prefs.activeProfile = next.id;
    savePrefs();
    renderFooter();
    renderList();
    toast('نویسندهٔ یادداشت‌ها: ' + next.name);
  }

  function addProfile(name) {
    const clean = String(name || '').trim();
    if (!clean) return null;
    const color = PASS_COLORS[prefs.profiles.length % PASS_COLORS.length];
    const p = { id: 'p' + Date.now().toString(36), name: clean, initials: clean.slice(0, 2), color };
    prefs.profiles.push(p);
    prefs.activeProfile = p.id;
    savePrefs();
    renderFooter();
    return p;
  }

  function select(id) {
    writeSelection(id ? [id] : []);
  }

  /* The viewer flies to the chosen mark, using the same shift-frame zoom the
     reader uses by hand, so a note in the corner is reachable in one click. */
  function jumpTo(id) {
    const found = findNote(state.set, id);
    if (!found) return;
    select(id);
    renderLayer();
    const { W, H } = plateSize();
    const b = normBounds(found.note, W, H);
    const pad = 0.06;
    const lim = boardBox();
    const rect = {
      x: clamp(b.x * W - b.w * W * pad, lim.x0 * W, lim.x1 * W),
      y: clamp(b.y * H - b.h * H * pad, lim.y0 * H, lim.y1 * H),
      w: Math.max(W * 0.04, b.w * W * (1 + pad * 2)),
      h: Math.max(H * 0.04, b.h * H * (1 + pad * 2)),
    };
    if (typeof window.zoomToRect === 'function') window.zoomToRect(rect);
    const el = layer && layer.querySelector(`.anno-mark[data-id="${id}"]`);
    if (el) el.focus({ preventScroll: true });
  }

  /* ----------------------------------------------------------------- opening */

  function show(imageKey, plate, journal) {
    /* Paging to another plate used to drop whatever was typed in the last half
       second: the debounced writer reads state.set at flush time, and by then
       the set had already been swapped for the next image's. */
    if (state.set && state.imageKey !== imageKey) flushSave();
    closeEditor(true);
    draft = null; drag = null; sweep = null; freshId = '';
    resetTouches();
    state.imageKey = imageKey;
    state.plate = plate;
    state.journal = journal;
    state.undo.length = 0;
    state.redo.length = 0;
    state.selected = '';
    state.flash = '';
    state.centerPending = true;
    return ensureSet(imageKey, plate, journal).then(set => {
      /* A second look at a plate you have already written on opens a new pass,
         so the ideas of this visit are never lost under the last visit's. */
      if (set.passes.length && set.passes[set.passes.length - 1].notes.length) {
        const last = set.passes[set.passes.length - 1];
        const sameDay = Date.now() - last.createdAt < 6 * 3600 * 1000;
        if (!sameDay) newPass(set);
      }
      state.set = set;
      state.passId = set.passes[set.passes.length - 1].id;
      renderLayer();
      renderList();
      paintTools();
      paintBadge();
      return set;
    });
  }

  function paintBadge() {
    const btn = $('#lbAnnotate');
    if (!btn) return;
    const n = state.set ? noteList(state.set).length : 0;
    btn.classList.toggle('has-notes', n > 0);
    const lab = btn.querySelector('.anno-badge');
    if (n && lab) lab.textContent = toFa(n);
    else if (lab) lab.textContent = '';
  }

  /* The rail's colour dot is painted from the same resolver the marks use, so
     it can never show a colour the pen would not draw. */
  function renderInks() {
    paintInkButton();
  }

  function renderTools() {
    const host = document.getElementById('annoTools');
    if (!host || host.childElementCount) return;
    host.innerHTML = TOOL_DEFS.map(t =>
      `<button class="anno-tool" type="button" data-tool="${t.id}" title="${escText(t.label)} (${t.letter.toUpperCase()})" aria-label="${escText(t.name)}" aria-keyshortcuts="${t.letter.toUpperCase()}" aria-pressed="false">${iconFor(t.icon)}</button>`).join('');
  }

  /* Every reader's marks belong to their own browser profile; this origin has
     one IndexedDB and the site never sends a note anywhere. Asking the browser
     for persistent storage keeps it from evicting that database under disk
     pressure, and the page-hide flush closes the half-second save window. */
  let persistenceAsked = false;
  function guardLocalStore() {
    if (persistenceAsked) return;
    persistenceAsked = true;
    try {
      if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
    } catch { /* browsers without the Storage API still keep IndexedDB */ }
    window.addEventListener('pagehide', () => { clearTimeout(saveTimer); flushSave(); });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') { clearTimeout(saveTimer); flushSave(); }
    });
  }

  let boardObserver = null;
  function watchBoard() {
    const stage = document.getElementById('lbImageStage');
    if (!stage || !window.ResizeObserver) return;
    if (!boardObserver) boardObserver = new ResizeObserver(() => paintBoardPad());
    boardObserver.observe(stage);
    paintBoardPad();
  }

  /* Space is claimed through the lightbox keydown path but released on the
     window: the reader lets go wherever the hand happens to be. */
  function releaseSpace(e) {
    if (e && e.type === 'keyup' && e.key !== ' ' && e.key !== 'Spacebar' && e.code !== 'Space') return;
    spaceDown = false;
    if (layer) layer.classList.remove('is-pan-ready');
  }
  window.addEventListener('keyup', releaseSpace);
  window.addEventListener('blur', releaseSpace);

  function attach() {
    mountLayer();
    watchBoard();
    renderTools();
    renderInks();
    wirePanel();
    wireRail();
    wireSelectionUi();
    wireImageIo();
    guardLocalStore();
    restoreFolder().then(ok => { if (ok) renderFooter(); });
  }

  function detach() {
    closeEditor(true);
    draft = null; drag = null; sweep = null; freshId = '';
    resetTouches();
    if (panRaf) { cancelAnimationFrame(panRaf); panRaf = 0; }
    spaceDown = false;
    if (layer) layer.classList.remove('is-panning', 'is-pan-ready');
    clearLiveInk();
    inkCursor = null;
    if (marqueeNode && marqueeNode.parentNode) marqueeNode.parentNode.removeChild(marqueeNode);
    marqueeNode = null;
    hideMenu();
    closeInkPop(false);
    if (quickEl) quickEl.hidden = true;
    const dropBoard = document.getElementById('lbBoard');
    if (dropBoard) dropBoard.classList.remove('is-drop');
    if (layer) layer.classList.remove('is-capturing');
    const lb = $('#lightbox');
    if (lb) {
      lb.classList.remove('has-board');
      lb.style.setProperty('--board-pad-x', '0px');
      lb.style.setProperty('--board-pad-y', '0px');
    }
    const boardEl = document.getElementById('lbBoard');
    if (boardEl) boardEl.style.padding = '';
    boardPadKey = '';
    if (lb && lb.classList.contains('is-annotating')) toggleAnno(false);
    select('');
    /* Both writers read state.set, so they have to run before it is cleared —
       a note typed a second before closing the viewer would else be dropped. */
    clearTimeout(saveTimer);
    clearTimeout(diskTimer);
    flushSave();
    if (state.folder) writeSidecar();
    state.set = null;
    state.imageKey = '';
    state.plate = null;
    state.centerPending = false;
    state.undo.length = 0;
    state.redo.length = 0;
    if (layer) while (layer.firstChild) layer.removeChild(layer.firstChild);
  }

  function key(e) {
    if (!annotating()) return false;
    const t = e.target;
    const k = e.key.toLowerCase();
    /* Physical codes, with the printed letter as a fallback: a Persian layout
       reports «د» for the N key, and a shortcut that only knows English makes
       the whole editor keyboard-hostile for the people who read these charts. */
    const code = e.code || '';
    /* The menu is a mode of its own: one key closes it and nothing behind it
       happens on the same press. */
    if (menuEl && !menuEl.hidden) return menuKey(e, k);
    /* The picker is a mode too: Escape closes it and its own controls keep
       their keys. A key pressed on the plate closes it first, so Delete still
       deletes the selected mark instead of being swallowed. */
    if (inkPop && !inkPop.hidden) {
      if (k === 'escape') { e.preventDefault(); closeInkPop(); return true; }
      if (t && t.closest && t.closest('#annoInkPop')) return false;
      closeInkPop(false);
    }
    if (t && ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName)) return false;
    /* Chrome controls own their activation keys: Enter on a focused toolbar
       button must press that button, not open the selected mark's words. */
    const inControl = !!(t && t.closest && t.closest('button, a[href], input, textarea, select, [role="menu"]'));
    const mod = e.ctrlKey || e.metaKey;
    const is = (c, letter) => code === c || k === letter;
    if (mod && is('KeyZ', 'z')) { e.preventDefault(); e.shiftKey ? redo() : undo(); return true; }
    if (mod && is('KeyD', 'd')) { e.preventDefault(); if (state.selection.length) duplicateSelected(); return true; }
    if (mod && is('KeyA', 'a')) { e.preventDefault(); selectAll(); return true; }
    if (mod && is('KeyC', 'c')) { e.preventDefault(); copySelection(false); return true; }
    if (mod && is('KeyX', 'x')) { e.preventDefault(); copySelection(true); return true; }
    /* Ctrl+V is deliberately not claimed here: leaving it to the browser lets
       the paste event decide between a picture copied elsewhere and the
       editor's own note buffer. */
    if (mod && code === 'BracketRight') { e.preventDefault(); arrangeSelection(e.shiftKey ? 'front' : 'forward'); return true; }
    if (mod && code === 'BracketLeft') { e.preventDefault(); arrangeSelection(e.shiftKey ? 'back' : 'backward'); return true; }
    if (k === '?' || (code === 'Slash' && e.shiftKey)) { e.preventDefault(); toggleHelp(); return true; }
    /* Every modified shortcut this editor owns has already returned; anything
       else with Ctrl/Cmd is the browser's (find, print, reload). */
    if (mod) return false;
    /* Held down, Space is the hand: the next drag pans whatever tool is
       selected, so a zoomed plate never traps the reader inside a drawing. */
    if (k === ' ' || k === 'spacebar') {
      if (inControl) return false;
      if (!spaceDown) {
        spaceDown = true;
        if (layer) layer.classList.add('is-pan-ready');
      }
      e.preventDefault();
      return true;
    }
    /* An unfinished path is a mode of its own: Enter ends it, Backspace takes
       back the last vertex, Escape throws the whole run away. */
    if (draft && draft.kind === 'path' && draft.building) {
      if (k === 'enter') { e.preventDefault(); finishPath(true); return true; }
      if (k === 'escape') { e.preventDefault(); finishPath(false); return true; }
      if (k === 'backspace' || k === 'delete') {
        e.preventDefault();
        if (draft.pts.length > 1) {
          draft.pts.pop();
          draft.hover = draft.pts[draft.pts.length - 1].slice();
          renderLayer();
        } else { draft = null; renderLayer(); }
        return true;
      }
    }
    /* Esc walks back one layer at a time: the help card, the selection,
       then the viewer — the reader never loses more with one key than they
       meant to. The notes column is not on this ladder: it shuts with its own
       key, because a list is not something an Escape was ever meant to erase. */
    if (k === 'escape') {
      const help = document.getElementById('annoHelp');
      if (help && !help.hidden) { hideHelp(); return true; }
      if (state.selection.length) { clearSelection(); paintSelectionClasses(); paintFrame(); paintTools(); syncRowSelection(); return true; }
      /* The pen stays in the hand, so Escape is how it gets put down: one more
         press then clears the selection and one more closes the viewer. */
      if (isInkKind(prefs.tool)) { setTool('select'); return true; }
      return false;
    }
    if (k === 'delete' || k === 'backspace') { if (state.selection.length) { e.preventDefault(); removeSelected(); return true; } return false; }
    /* Enter opens the words of the selected mark, the same key every canvas
       editor uses; F2 is there for keyboards that treat Enter differently. */
    if ((k === 'enter' || k === 'f2') && state.selection.length && !inControl) {
      const pn = (findNote(state.set, state.selected) || {}).note;
      if (pn && textKind(pn.kind)) { e.preventDefault(); openEditor(state.selected); return true; }
      return false;
    }
    if (k === 'tab') {
      /* Inside the toolbar Tab belongs to the browser: hijacking it would
         make every control unreachable by keyboard. On the plate it walks
         the marks, which is the gesture the canvas has taught the reader. */
      if (inControl) return false;
      if (!state.set || !noteList(state.set).length) return false;
      e.preventDefault();
      cycleSelection(e.shiftKey ? -1 : 1);
      return true;
    }
    if (k === 'arrowleft' || k === 'arrowright' || k === 'arrowup' || k === 'arrowdown') {
      if (!state.selection.length) return false;
      e.preventDefault();
      const nudge = e.shiftKey ? 0.01 : 0.0015;
      const dx = k === 'arrowleft' ? -nudge : k === 'arrowright' ? nudge : 0;
      const dy = k === 'arrowup' ? -nudge : k === 'arrowdown' ? nudge : 0;
      nudgeSelection(dx, dy);
      return true;
    }
    const tool = TOOL_BY_CODE[code] || TOOL_BY_LETTER[k];
    if (tool) { e.preventDefault(); setTool(tool); return true; }
    if (is('KeyF', 'f')) {
      prefs.fill = !prefs.fill; savePrefs(); paintTools();
      if (selectedNotes().some(f => f.note.kind === 'rect' || f.note.kind === 'ellipse')) toggleFill();
      return true;
    }
    /* The head of an arrow lands wherever the drag ended, which is often the
       wrong end; swapping the two points is one key and needs no list open. */
    if (is('KeyX', 'x')) { e.preventDefault(); if (state.selected) flipArrow(state.selected); return true; }
    if (is('KeyK', 'k')) { e.preventDefault(); if (state.selection.length) toggleLock(); return true; }
    if (is('KeyM', 'm')) { e.preventDefault(); cycleProfile(); return true; }
    /* The list is shut unless asked for, so asking has to be as fast as the pen. */
    if (is('KeyL', 'l')) { e.preventDefault(); setPanel(!state.panelOpen); return true; }
    return false;
  }

  /* ----------------------------------------------------- reader-facing views */

  function notesViewHTML(rows) {
    if (!rows.length) {
      return `<p class="notes-empty">هنوز یادداشتی نگذاشته‌اید. تصویری را باز کنید و دکمهٔ «یادداشت» را بزنید.</p>`;
    }
    const byImage = new Map();
    for (const r of rows) {
      if (!byImage.has(r.imageKey)) byImage.set(r.imageKey, []);
      byImage.get(r.imageKey).push(r);
    }
    const parts = [];
    for (const [imageKey, list] of byImage) {
      const first = list[0];
      const w = first.where || {};
      const href = w.jid && w.pid ? `#/p/${encodeURIComponent(w.jid)}/${w.page || 1}/${encodeURIComponent(w.pid)}` : '#/gallery';
      parts.push(`<section class="notes-card" data-key="${escAttr(imageKey)}">
        <header class="notes-head">
          <a class="notes-plate" href="${escAttr(href)}" data-act="open-plate" data-key="${escAttr(imageKey)}" data-pid="${escAttr(w.pid || '')}" data-page="${escAttr(String(w.page || 1))}" data-jid="${escAttr(w.jid || '')}">
            <img src="${escAttr(thumbOf(imageKey))}" alt="${escAttr(first.name || '')}" loading="lazy" decoding="async" draggable="false">
          </a>
          <div class="notes-title">
            <a href="${escAttr(href)}"><bdi dir="auto">${escAttr(first.name || imageKey)}</bdi></a>
            <span class="notes-meta">${toFa(list.length)} یادداشت · ${toFa(new Set(list.map(r => r.passId)).size)} گذر${w.jname ? ' · ' + escText(w.jname) : ''}</span>
          </div>
        </header>
        <ul class="notes-list">
          ${list.map(r => `<li class="notes-item" dir="${detectDir(r.note.text)}">
            <span class="anno-row-ink" style="--ink-dot:${hexOf(r.note)}"></span>
            <span class="notes-item-text">${escText((r.note.text || markLabel(r.note)).replace(/\s+/g, ' ').slice(0, 160))}</span>
            <span class="notes-item-meta">${escText((profile(r.note.author) || {}).name || '')} · ${escText(r.passLabel)}</span>
          </li>`).join('')}
        </ul>
      </section>`);
    }
    return parts.join('');
  }

  function thumbOf(imageKey) {
    return `assets/thumbs/${imageKey}.webp`;
  }

  function escAttr(v) { return escText(v); }

  async function renderNotesView(filterText) {
    const host = $('#notesList');
    if (!host) return;
    host.innerHTML = '<p class="notes-empty">در حال خواندن یادداشت‌ها…</p>';
    let rows = [];
    try { rows = await indexAll(); } catch (err) { host.innerHTML = '<p class="notes-empty">دیتابیس یادداشت‌ها باز نشد.</p>'; return; }
    const q = String(filterText || '').trim().toLowerCase();
    if (q) {
      rows = rows.filter(r => (r.note.text || '').toLowerCase().includes(q)
        || String(r.name || '').toLowerCase().includes(q)
        || String((r.where || {}).jid || '').includes(q)
        || String(r.passLabel || '').toLowerCase().includes(q));
    }
    host.dataset.count = String(rows.length);
    host.innerHTML = notesViewHTML(rows);
    const total = $('#notesTotal');
    if (total) total.textContent = toFa(rows.length);
    const images = $('#notesImages');
    if (images) images.textContent = toFa(new Set(rows.map(r => r.imageKey)).size);
    const authors = $('#notesAuthors');
    if (authors) authors.textContent = toFa(new Set(rows.map(r => r.note.author)).size);
    const sync = $('#notesSyncState');
    if (sync) sync.textContent = state.folder ? 'کپیِ یادداشت‌دار روی دیسک نوشته می‌شود' : 'برای نوشتن کپی کنار تصویر، پوشه را وصل کنید';
  }

  /* A plate badge in the post list, the detail figure and the gallery board.
     The chip is created when the markup has none, so a surface added later
     still shows its counts instead of silently skipping them. */
  async function paintPlateBadges(root) {
    if (!root) return;
    const plates = Array.from(root.querySelectorAll('.plate[data-key], [data-gallery-key]'));
    if (!plates.length) return;
    const counts = await countsFor(plates.map(p => p.getAttribute('data-key') || p.getAttribute('data-gallery-key')));
    for (const p of plates) {
      const key = p.getAttribute('data-key') || p.getAttribute('data-gallery-key');
      const n = counts[key] || 0;
      const host = p.querySelector('.plate-media') || p;
      let chip = host.querySelector(':scope > .plate-anno');
      if (!chip) {
        if (!n) continue;
        chip = document.createElement('span');
        chip.className = 'plate-anno';
        host.appendChild(chip);
      }
      chip.hidden = !n;
      chip.innerHTML = n ? `${iconFor('pencil')}${toFa(n)}` : '';
      chip.title = n ? toFa(n) + ' یادداشت روی این تصویر' : '';
    }
  }

  return {
    TOOLS, INKS, STATUSES, STAMPS,
    attach, detach, show, renderLayer, renderList, toggleAnno, annotating, key,
    setPanel, panelOpen: () => !!state.panelOpen,
    setTool, getTool: () => prefs.tool,
    linkFolder, unlinkFolder, restoreFolder,
    hasFolder: () => !!state.folder,
    bakePng, bakeNamed, drawMarks, toMarkdown, sidecarName, writeSidecar,
    backupAll, restoreFile, download,
    indexAll, countFor, countsFor, paintPlateBadges, renderNotesView, notesViewHTML, paintRailBadge,
    noteList, snapshot: () => state.set, currentKey: () => state.imageKey,
    prefs: () => prefs, profile, addProfile, cycleProfile, state,
    flushSave, plateSize, fmtFa: toFa, detectDir,
    /* The board margin is a fraction of the plate, so a zoom step changes it.
       The viewer calls this between resizing the stage and measuring where it
       landed, or the scroll anchor would be computed against the old margin. */
    reflowBoard: paintBoardPad,
    isCapturing: () => ownsPointer() && annotating(),
  };
})();

window.Anno = Anno;
