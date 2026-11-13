#!/usr/bin/env node
/* Restore Rinehart FL homework #25 from Page 1 PDF pp.16-17. */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..', '..');
const BUILD = path.join(ROOT, '_build');
const PAGE = 'rinehartfl-p1';
const PARSED = path.join(BUILD, 'parsed.json');
const WORK = path.join(__dirname, 'work', PAGE + '.json');
const BATCH = path.join(__dirname, 'batches', PAGE + '.json');
const STORE = path.join(__dirname, 'posts.json');

const normalize = t => String(t || '').replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ')
  .replace(/\n{3,}/g, '\n\n').trim();
const hashOf = t => crypto.createHash('sha1').update(normalize(t)).digest('hex');

const ID = 'rinehartfl_p1_25';
const text = `Astrokillah wrote: Hey Rinehart, Great work; you're miles ahead of me when it comes to applying FLs! Quick question regarding this statement, "A FL needs to hit its target to be considered a FL" - does the target have to be another FL? or can it be SR, SD area, DP or CAP?

Thanks man! AK.

Hi Astrokillah, Thank you for the kind words. I too find (and still do at times) FLs the most confusing part of RTM. But obviously also the most important part lol. IF talked about FLs, FTRs, DPs etc before. But now we call them all FLs because people get caught up in terminology.

It is our job to identify the good FLs. The ones that were formed from breaking a significant barrier like S/R or a past FL of significance (or sometimes the ones that preceded the breaking of the significant level--DPs). If we accept that all these DPs, FTR, FL,etc can all be called FLs. Then the only other thing is what is in between the FLs which are the PAZs. So the market is really just FL, PAZ, FL, PAZ, FL, PAZ, FL.

To answer your question. We don't consider a FL a FL until it passes through the PAZ to the next FL and hits it. SR alone is not a target (though it usually is formed from a past FL). If price hits an important DP (that led to the breaking of a SR), then I call that DP a FL and say price has hit its target. If it hits a CAP, that CAP was usually formed from a previous FL and I say it has hit its target.

The times we don't consider price hitting its target is when price engulfs a FL but doesn't quite make it all the way through the PAZ. These are the engulfs, FOs, BSZs etc. These are great because they are a sign of where to start looking for a trade. Other times price will engulf a FL, for example engulf a FL and pull back a lot and then eventually push to the target. These are the times were you end up with a much bigger FL. The ones that were formed from price will bounce, annihilation of mentality etc.`;

const fa = `Astrokillah نوشت: سلام رینهارت، کارت عالی است؛ وقتی نوبت به به‌کارگیری FL می‌رسد، صدها مایل از من جلوتری! یک سؤال سریع دربارهٔ این جمله: "FL باید به تارگت خود برسد تا FL حساب شود" — آیا تارگت باید یک FL دیگر باشد؟ یا می‌تواند SR، ناحیهٔ SD، DP یا CAP باشد؟

ممنون رفیق! AK.

سلام Astrokillah، از حرف‌های مهربانت ممنونم. من هم (و هنوز گاهی) FLها را گیج‌کننده‌ترین بخش RTM می‌دانم. ولی خب مهم‌ترین بخش هم هستند، خنده. قبلاً IF دربارهٔ FL، FTR، DPها و غیره حرف می‌زد. اما حالا همه‌شان را FL صدا می‌زنیم چون مردم درگیر اصطلاحات می‌شوند.

کار ما این است که FLهای خوب را تشخیص دهیم. آن‌هایی که از شکستن یک سد مهم مثل S/R یا یک FL مهم گذشته (یا گاهی آن‌هایی که پیش از شکستن سطح مهم می‌آمدند — DPها) شکل گرفته‌اند. اگر بپذیریم همهٔ این DPها، FTRها، FLها و غیره را می‌توان FL نامید، آن‌وقت تنها چیز دیگر چیزی است که بین FLها قرار دارد: PAZها. پس بازار واقعاً فقط FL، PAZ، FL، PAZ، FL، PAZ، FL است.

پاسخ سؤالت: ما تا وقتی FL از PAZ به FL بعدی عبور نکند و آن را لمس نکند، نمی‌دانیم FL است. SR به‌تنهایی تارگت نیست (هرچند معمولاً از یک FL گذشته شکل می‌گیرد). اگر قیمت به یک DP مهم برسد (که به شکستن S/R منجر شده)، آن DP را FL می‌نامم و می‌گویم قیمت به تارگت رسیده. اگر به CAP برسد، آن CAP معمولاً از FL قبلی شکل گرفته و می‌گویم به تارگت رسیده.

زمان‌هایی که رسیدن قیمت به تارگت را قبول نمی‌کنیم، مواقعی است که قیمت FL را می‌شکند ولی کاملاً از PAZ عبور نمی‌کند. این‌ها همان engulfها، FOها، BSZها و غیره‌اند. این‌ها عالی‌اند چون نشانهٔ شروع جست‌وجو برای معامله‌اند. مواقع دیگر، قیمت مثلاً یک FL را engulf می‌کند، کمی عقب می‌کشد و بعد به‌سمت تارگت می‌رود. این‌ها مواقعی است که با FL بسیار بزرگ‌تری روبه‌رو می‌شوی. آن‌هایی که از «قیمت برمی‌گردد، نابودی ذهنیت» و غیره ساخته شده‌اند.`;

const parsed = JSON.parse(fs.readFileSync(PARSED, 'utf8'));
const post = parsed.journals.flatMap(j => j.posts).find(p => p.id === ID);
if (!post) throw new Error('missing ' + ID);
const oldHash = hashOf(post.text);
const newHash = hashOf(text);
post.text = text;

const work = fs.existsSync(WORK) ? JSON.parse(fs.readFileSync(WORK, 'utf8')) : [];
const batch = fs.existsSync(BATCH) ? JSON.parse(fs.readFileSync(BATCH, 'utf8')) : {};
const store = JSON.parse(fs.readFileSync(STORE, 'utf8'));
let w = work.find(x => x.id === ID);
if (w) {
  w.hash = newHash;
  w.text = normalize(text);
  w.author = post.author || w.author || '';
} else {
  work.push({ id: ID, hash: newHash, author: post.author || '', text: normalize(text) });
}
delete batch[oldHash];
if (store[oldHash]) delete store[oldHash];
batch[newHash] = fa;
store[newHash] = fa;

fs.writeFileSync(PARSED, JSON.stringify(parsed), 'utf8');
fs.writeFileSync(WORK, JSON.stringify(work), 'utf8');
fs.writeFileSync(BATCH, JSON.stringify(batch), 'utf8');
fs.writeFileSync(STORE, JSON.stringify(store), 'utf8');
console.log(ID, oldHash.slice(0, 8), '->', newHash.slice(0, 8), 'work', work.length);
