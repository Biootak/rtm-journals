#!/usr/bin/env node
/* Restore the three capnp posts whose text layer survived only in the PDF. */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..', '..');
const BUILD = path.join(ROOT, '_build');
const PAGE = 'capnp-p6';
const PARSED = path.join(BUILD, 'parsed.json');
const WORK = path.join(__dirname, 'work', PAGE + '.json');
const BATCH = path.join(__dirname, 'batches', PAGE + '.json');
const STORE = path.join(__dirname, 'posts.json');

const normalize = t => String(t || '').replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ')
  .replace(/\n{3,}/g, '\n\n').trim();
const hashOf = t => crypto.createHash('sha1').update(normalize(t)).digest('hex');

const TARGETS = [
  {
    id: 'capnp_p6_127',
    text: `I have been working the whole morning to come up with a video that summaries's the whole process in a brilliantly concise format.`,
    fa: `تمام صبح کار کرده‌ام تا ویدئویی بسازم که کل فرایند را به شکلی درخشان و فشرده خلاصه کند.`,
  },
  {
    id: 'capnp_p6_133',
    text: `ERR - Guys, how do I say this................

I put on one too many "boxes" on the chart - and, however hard I tried, I could not delete the "box"

So I thought "feck it" and simply added a new box labeled "blank space" as a joke ( as I had no intention of doing the whole thing again)

My sense of humor demanded this.

As my grandmother always taught me "Always make a Feature out of a F*ck up"

still studying charts is never a waste of time`,
    fa: `خطا — بچه‌ها، چطور بگویم................

روی چارت یکی دو تا «باکس» زیاد گذاشتم — و هرقدر تلاش کردم نتوانستم «باکس» را پاک کنم.

پس با خودم گفتم «بی‌خیال» و فقط برای شوخی یک باکس تازه با برچسب «فضای خالی» اضافه کردم (چون اصلاً قصد نداشتم کل کار را از نو انجام دهم).

حس شوخ‌طبعی‌ام این را می‌طلبید.

همان‌طور که مادربزرگم همیشه یادم می‌داد: «همیشه از یک گندکاری یک ویژگی بساز.»

به هر حال مطالعهٔ چارت‌ها وقت تلف کردن نیست.`,
  },
  {
    id: 'capnp_p6_135',
    text: `I can not view the charts..In some posts it says "This post contained the holy grail ecc...". Is there someone who keeps a file containing all the posts of this thread? Thanks in advance.`,
    fa: `نمی‌توانم چارت‌ها را ببینم..در بعضی پست‌ها نوشته «این پست شامل جام مقدس است...». کسی هست که فایلی از همهٔ پست‌های این تاپیک نگه دارد؟ پیشاپیش ممنون.`,
  },
];

const parsed = JSON.parse(fs.readFileSync(PARSED, 'utf8'));
const postById = new Map();
for (const j of parsed.journals) for (const p of j.posts) postById.set(p.id, p);
const work = JSON.parse(fs.readFileSync(WORK, 'utf8'));
const batch = JSON.parse(fs.readFileSync(BATCH, 'utf8'));
const store = JSON.parse(fs.readFileSync(STORE, 'utf8'));

for (const t of TARGETS) {
  const post = postById.get(t.id);
  if (!post) throw new Error('missing post ' + t.id);
  const oldHash = hashOf(post.text);
  const newHash = hashOf(t.text);
  const oldFa = batch[oldHash] ?? store[oldHash];
  const fa = t.fa;
  post.text = t.text;
  let w = work.find(x => x.id === t.id);
  if (w) {
    w.hash = newHash;
    w.text = normalize(t.text);
    w.author = post.author || w.author || '';
  } else {
    work.push({ id: t.id, hash: newHash, author: post.author || '', text: normalize(t.text) });
  }
  delete batch[oldHash];
  if (store[oldHash]) delete store[oldHash];
  batch[newHash] = fa;
  store[newHash] = fa;
  console.log(t.id, oldHash.slice(0, 8), '->', newHash.slice(0, 8), 'oldFa', !!oldFa);
}

fs.writeFileSync(PARSED, JSON.stringify(parsed), 'utf8');
fs.writeFileSync(WORK, JSON.stringify(work), 'utf8');
fs.writeFileSync(BATCH, JSON.stringify(batch), 'utf8');
fs.writeFileSync(STORE, JSON.stringify(store), 'utf8');
console.log('written', PAGE);
