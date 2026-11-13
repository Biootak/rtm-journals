// Scan batch/store translations for likely defects: transliterated slang,
// leftover English prose, welded Latin, Persian digits, known bad terms.
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const BATCHES = path.join(ROOT, '_build/expert/batches');
const WORK = path.join(ROOT, '_build/expert/work');
const STORE = path.join(ROOT, '_build/expert/posts.json');

const EN_WORDS = /\b(the|and|you|is|to|of|in|that|it|for|on|with|as|are|was|be|have|not|but|they|we|this|from|or|an|will|would|there|their|what|so|up|out|if|about|who|get|which|when|make|can|like|time|just|him|know|take|people|into|year|your|good|some|could|them|see|other|than|then|now|look|only|come|its|over|think|also|back|after|use|two|how|our|work|first|well|way|even|new|want|because|any|these|give|day|most|us|very|much|here|where|being|been|has|had|were|does|did|said|each|she|himself|one|all|both|few|more|such|no|nor|own|same|too|very|can|just|should|now)\b/gi;
const BAD = [
  ['کینک', 'kink->پیچش'], ['کبوم', 'kaboom'], ['مرسی', 'merci'],
  ['زون', 'zone->ناحیه'], ['اسکرین‌شات', 'screenshot'], ['دایموند', 'diamond->الماس'],
  ['خرده‌فروش', 'retail->خرده‌معامله‌گران'], ['دیماند', 'demand->تقاضا'], ['دیمند', 'demand'],
  ['ساپلای', 'supply->عرضه'], ['فلگ', 'flag->پرچم/FL'], ['پرایس اکشن', 'price action->PA'],
  ['های\u200c', 'welded?'], ['\u06F0-\u06F9', 'persian digits']
];

const files = process.argv.slice(2);
const store = fs.existsSync(STORE) ? JSON.parse(fs.readFileSync(STORE, 'utf8')) : {};
for (const base of files) {
  const workFile = path.join(WORK, base + '.json');
  const batchFile = path.join(BATCHES, base + '.json');
  if (!fs.existsSync(workFile)) continue;
  const work = JSON.parse(fs.readFileSync(workFile, 'utf8'));
  const batch = fs.existsSync(batchFile) ? JSON.parse(fs.readFileSync(batchFile, 'utf8')) : store;
  for (const w of work) {
    const fa = String(batch[w.hash] || '');
    if (!fa) continue;
    const issues = [];
    for (const [pat, label] of BAD) {
      const re = new RegExp(pat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      if (re.test(fa)) issues.push(label);
    }
    if (/[\u06F0-\u06F9]/.test(fa)) issues.push('PERSIAN-DIGITS');
    // leftover English: count english-word hits
    const m = fa.match(EN_WORDS);
    if (m && m.length >= 4) issues.push('EN-WORDS:' + m.length);
    // welded latin+persian like traderهای
    if (/[A-Za-z](های|های|‌ها)/.test(fa)) issues.push('WELDED');
    if (issues.length) {
      console.log(base, w.id, issues.join(','));
      const snippet = fa.split('\n').filter(l => /[A-Za-z]{4,}/.test(l)).slice(0, 2).join(' ~ ').slice(0, 220);
      if (snippet) console.log('   ', snippet);
    }
  }
}
