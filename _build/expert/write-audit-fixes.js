#!/usr/bin/env node
// Verdict entries for the defects found by audit-paragraphs.js.
const fs = require('fs');

const P = s => String(s || '').split(/\n{2,}/).map(x => x.trim()).filter(Boolean);
const load = (page, id) => {
  const w = JSON.parse(fs.readFileSync(`_build/expert/work/${page}.json`, 'utf8')).find(x => x.id === id);
  const b = JSON.parse(fs.readFileSync(`_build/expert/batches/${page}.json`, 'utf8'));
  const fa = String(b[w.hash] || '').trim();
  return { w, fa, en: P(w.text), fp: P(fa) };
};
const merge = (page, entries) => {
  const f = `_build/expert/review/${page}.review.json`;
  let cur = {};
  try { cur = JSON.parse(fs.readFileSync(f, 'utf8')); } catch {}
  Object.assign(cur, entries);
  fs.writeFileSync(f, JSON.stringify(cur, null, 1), 'utf8');
  console.log('wrote', f, Object.keys(entries).join(', '));
};

const entries59 = {};
for (const id of ['if_p59_20', 'if_p59_25']) {
  const { fp } = load('if-p59', id);
  if (!fp[3].endsWith('فقرای') || !/26 سال دارم/.test(fp[4])) throw new Error('unexpected body ' + id);
  const fixed = fp.slice();
  fixed[3] = fp[3] + ' بسیاری دارد و من الان در موقعیتی نیستم که به آن‌ها کمک کنم؛ خودم 26 سال دارم.';
  fixed[4] = 'خیلی سختی کشیده‌ام، ولی می‌جنگم تا به هدفم برسم؛ مراقبت از خانواده‌ام و کمک به دیگران.';
  entries59[id] = {
    ok: false,
    issue: 'پاراگراف جابه‌جا: عدد 26 و ادامهٔ جملهٔ پاراگراف 4 در پاراگراف 5 افتاده',
    why: 'EN p4 ends «…me myself is 26 years old have» and p5 starts «been struggle alot…»; FA p4 stops at «کشور من فقرای» and moves «بسیاری دارد … 26 سال دارم» into p5, so each English paragraph gets the wrong Persian half.',
    fix: fixed.join('\n\n')
  };
}
merge('if-p59', entries59);

{
  const { fp } = load('if-p115', 'if_p115_15');
  if (!fp[0].includes('HCDE نوشت:')) throw new Error('handle already fixed');
  const fixed = fp.slice();
  fixed[0] = fp[0].replace('HCDE نوشت:', 'risky.HCDE نوشت:');
  merge('if-p115', {
    if_p115_15: {
      ok: false,
      issue: 'handle کوته‌شده در سرِ نقل‌قول',
      why: 'The source quote head is «risky.HCDE wrote:» (glued to the previous line); FA writes only «HCDE نوشت:». Handles must be preserved character-for-character.',
      fix: fixed.join('\n\n')
    }
  });
}

{
  const { en, fp } = load('staurum-p3', 'staurum_p3_13');
  if (!/start=50/.test(en[1])) throw new Error('unexpected url');
  const fixed = fp.slice();
  fixed[1] = en[1];
  fixed[2] = en[2];
  merge('staurum-p3', {
    staurum_p3_13: {
      ok: false,
      issue: 'لینک‌های مبدأ با متن فارسی جایگزین شده‌اند',
      why: 'The two BBCode links are source content; URLs stay Latin and nothing may be added. FA replaced them with «از تاپیک هنر جنگ، پست …», losing the links.',
      fix: fixed.join('\n\n')
    }
  });
}
