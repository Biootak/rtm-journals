#!/usr/bin/env node
/* Restore the four empty in2forex Page 1 posts from the PDF text layer. */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..', '..');
const BUILD = path.join(ROOT, '_build');
const PAGE = 'in2forex-p1';
const PARSED = path.join(BUILD, 'parsed.json');
const WORK = path.join(__dirname, 'work', PAGE + '.json');
const BATCH = path.join(__dirname, 'batches', PAGE + '.json');
const STORE = path.join(__dirname, 'posts.json');

const normalize = t => String(t || '').replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ')
  .replace(/\n{3,}/g, '\n\n').trim();
const hashOf = t => crypto.createHash('sha1').update(normalize(t)).digest('hex');

const TARGETS = [
  {
    id: 'in2forex_p1_1',
    text: `Hi

This is the start to my journal, in which I will document my journey into reading the market.

But first a little about me.

After looking at some of the posts and threads in this forum I will consider myself a newbie, rookie, green behind the ears.

I've been interested in trading for about 18 months, and I can identify all the common errors a trader makes in myself.

The connection between my mind and my right index finger, which hits the trigger is often overruled by emotions.

About 3 months ago I started looking at PASR, I focused on candle formations on the HTF. Suddenly I found I was starting to make better decisions and I knew their was more to this.

My trading style is undefined at this stage, but I do tend to favor the HTF's as screen time is limited.

I've decided to take this learning and trading experience seriously, so I'm going to start at the beginning and work my way through all the material do all the homework and practice, practice till its instinctive.

Hopefully the teacher here can help me achieve this.

Thank you to all those people that make this site a reality, It is much appreciated!`,
    fa: `سلام

این شروع ژورنال من است؛ جایی که مسیرم را در خواندن بازار مستند می‌کنم.

اما اول کمی دربارهٔ خودم.

بعد از دیدن بعضی پست‌ها و تاپیک‌های این فروم، خودم را یک تازه‌کار، مبتدی و سبزِ پشت گوش می‌دانم.

حدود 18 ماه است به معامله‌گری علاقه‌مندم و می‌توانم همهٔ خطاهای رایج یک معامله‌گر را در خودم شناسایی کنم.

ارتباط بین ذهنم و انگشت سبابه‌ام که ماشه را می‌زند، اغلب توسط احساسات نادیده گرفته می‌شود.

حدود 3 ماه پیش شروع به بررسی PASR کردم و روی الگوهای کندلی در HTF تمرکز کردم. ناگهان دیدم تصمیم‌های بهتری می‌گیرم و فهمیدم چیز بیشتری در این کار هست.

سبک معامله‌گری‌ام در این مرحله تعریف‌نشده است، ولی تمایل دارم HTFها را ترجیح دهم چون زمان پای نمایشگر محدود است.

تصمیم گرفته‌ام این تجربهٔ یادگیری و معامله‌گری را جدی بگیرم؛ پس از ابتدا شروع می‌کنم و همهٔ مطالب را کار می‌کنم، همهٔ تکالیف را انجام می‌دهم و تمرین می‌کنم تا غریزی شود.

امیدوارم معلم اینجا بتواند در رسیدن به این هدف کمکم کند.

از همهٔ کسانی که این سایت را واقعی می‌کنند سپاسگزارم؛ خیلی ارزشمند است!`,
  },
  {
    id: 'in2forex_p1_3',
    text: `Ok here is my first exercise I've done based on key levels SR.

What I found interesting while doing the exercise is that if you have to write down what you see, you start thinking about it a lot more than just looking at the chart.

Price open (1) and moved down breaking through the lower major level and continuing to the next major level, here it found strong support and retraced back passed its opening price to the higher major level where it found resistance and closed slightly below this level. This was a significant bullish move. The bullish momentum continued breaking through another major level and found resistance at 1.30400 (2) were it stalled for a day but then continued the bullish momentum breaking this major level as well. The price close just above the minor level (3) 1.30740. Price started ranging over the next few days between two major levels 1.31300 and 1.30400 before breaking down, and closing in no man’s land. (4) Price gained significant bullish momentum breaking the 1.31300 major level but found resistance at the next major level 1.31930. (5) Resistance was obviously very strong and price changed direction with a significant move downwards back to the previous day opening, in the process breaking through 2 major levels. It found support at level 1.29960. Price once again started ranging between 1.30400 and 1.31300 (question to self or others does this mean that these 2 levels are becoming more significant 1.30400 and 1.31300, this is the second time price is ranging between them?). (6) Price eventually moves down breaking the 1.30400 level and closing just below the next major level. (7) It continues down to find support at the next major level before retracing to close above its opening price. Price then tries to make a bullish move but fails and retraces back to close near its opening price. ( Price tries again to move up but finds resistance at 1.30400 before breaking this level which then triggers a significant rally up before price finds resistance at the major level 1.31930 (9). The next day price continues up but doesn’t make it to the next major level before it retraces forming a “falling star” candle formation (indicating to me a trend reversal). (10) Price does react to this formation and moves down to find support at level 1.30400 (we are back at 1.30400 interesting). Once again we find price ranging between 1.31300 and 1.30400 it tests the upper level 1.31300 before breaking it and moving up till it finds resistance at the next major level 1.31930 (11). A decision is made and price starts to fall breaking through 2 major levels before finding support just short of the 3rd major level and comes to close at about 1.30400. (12) The momentum continues down with price breaking through the 1.29970 level and finding support at 1.29500. We have a double top formation; price must break the 1.29500 level for the formation to be confirmed. (13) Price retraces back to the previous major level and eventually closes forming a doji candle (the market is unsure of direction). (14) A decision is made price moves down breaking the 1.29500 level and confirming the double top formation. Price continues down before finding some resistance at 1.28400

and eventually moves down to just short of 1.27900 levels (15). Ok I’m going to stop here and continue tomorrow. From this exercise it seems to me that the levels 1.30400 and 1.31300 are significant, or let’s say have more importance than the other levels at this stage in PA on the chart?`,
    fa: `خب این اولین تمرین من است که بر اساس سطوح کلیدی SR انجام داده‌ام.

چیزی که در حین انجام تمرین برایم جالب بود این است که وقتی باید آنچه می‌بینی را بنویسی، خیلی بیشتر از فقط نگاه کردن به چارت درباره‌اش فکر می‌کنی.

قیمت باز شد (1) و پایین رفت، سطح ماژور پایین‌تر را شکست و به سطح ماژور بعدی رسید؛ آنجا حمایت قوی پیدا کرد و برگشت، از قیمت باز شدنش گذشت و به سطح ماژور بالاتر رسید؛ آنجا مقاومت پیدا کرد و کمی زیر آن سطح بسته شد. این یک حرکت صعودی مهم بود. مومنتوم صعودی ادامه یافت، یک سطح ماژور دیگر را شکست و در 1.30400 مقاومت پیدا کرد (2)؛ یک روز آنجا متوقف شد ولی بعد مومنتوم صعودی را ادامه داد و این سطح ماژور را هم شکست. قیمت کمی بالای سطح مینور (3) 1.30740 بسته شد. قیمت در چند روز بعد بین دو سطح ماژور 1.31300 و 1.30400 رنج زد، بعد شکست و در بیابان بسته شد. (4) قیمت مومنتوم صعودی مهمی گرفت و سطح ماژور 1.31300 را شکست ولی در سطح ماژور بعدی 1.31930 مقاومت پیدا کرد. (5) مقاومت واضحاً خیلی قوی بود و قیمت با یک حرکت نزولی مهم به سمت باز شدن روز قبل برگشت و در این مسیر 2 سطح ماژور را شکست. در سطح 1.29960 حمایت پیدا کرد. قیمت دوباره بین 1.30400 و 1.31300 رنج زد (سؤال از خودم یا دیگران: آیا این یعنی این دو سطح مهم‌تر می‌شوند؟ 1.30400 و 1.31300؛ این دومین بار است که قیمت بین آن‌ها رنج می‌زند؟). (6) قیمت در نهایت پایین رفت، سطح 1.30400 را شکست و کمی زیر سطح ماژور بعدی بسته شد. (7) پایین‌تر رفت تا در سطح ماژور بعدی حمایت پیدا کند، بعد برگشت و بالای قیمت باز شدنش بسته شد. سپس تلاش کرد حرکت صعودی کند ولی شکست خورد و برگشت و نزدیک قیمت باز شدنش بسته شد. (8) دوباره تلاش کرد بالا برود ولی در 1.30400 مقاومت پیدا کرد؛ بعد این سطح را شکست که یک رالی مهم صعودی راه انداخت، تا قیمت در سطح ماژور 1.31930 مقاومت پیدا کرد (9). روز بعد قیمت ادامه داد بالا ولی به سطح ماژور بعدی نرسید و برگشت و الگوی کندلی «ستارهٔ دنباله‌دار» را ساخت (که به نظر من نشانهٔ برگشت روند است). (10) قیمت به این الگو واکنش نشان داد و پایین رفت تا در سطح 1.30400 حمایت پیدا کند (دوباره برگشتیم به 1.30400، جالب). دوباره قیمت بین 1.31300 و 1.30400 رنج زد، سطح بالایی 1.31300 را تست کرد، آن را شکست و بالا رفت تا در سطح ماژور بعدی 1.31930 مقاومت پیدا کرد (11). تصمیمی گرفته شد و قیمت شروع به ریزش کرد، 2 سطح ماژور را شکست و کمی قبل از سطح ماژور سوم حمایت پیدا کرد و حدود 1.30400 بسته شد. (12) مومنتوم نزولی ادامه یافت و قیمت سطح 1.29970 را شکست و در 1.29500 حمایت پیدا کرد. یک الگوی دوقلو تشکیل شده؛ برای تأیید الگو قیمت باید سطح 1.29500 را بشکند. (13) قیمت به سطح ماژور قبلی برگشت و در نهایت با تشکیل کندل دوجی بسته شد (بازار در جهت مطمئن نیست). (14) تصمیمی گرفته شد، قیمت پایین رفت، سطح 1.29500 را شکست و الگوی دوقلو را تأیید کرد. قیمت ادامه داد پایین تا در 1.28400 کمی مقاومت پیدا کرد و در نهایت تا کمی قبل از سطوح 1.27900 پایین رفت (15).\n\nخب اینجا متوقف می‌شوم و فردا ادامه می‌دهم. از این تمرین به نظرم می‌رسد سطوح 1.30400 و 1.31300 مهم‌اند، یا بهتر بگویم در این مرحله از PA روی چارت اهمیت بیشتری از بقیهٔ سطوح دارند؟`,
  },
  {
    id: 'in2forex_p1_17',
    text: `So after closing the sell order last night I woke up this morning and saw the engulf on EURUSD set a PO Sell at the source of engulf with a much tighter SL and target at the flag limit from yesterday.

My PO was triggered but I got stopped out. I'm not sure why as the price didn't reach my SL. I thought I had left enough buffer but obviously I didn't. This is the second time I'v been stopped out by such a small margine.

I felt much better with this trade than the PO that was triggered yesterday.`,
    fa: `بعد از بستن سفارش فروش دیشب، صبح بیدار شدم و دیدم engulf روی EURUSD یک PO Sell در منبع engulf با SL خیلی تنگ‌تر و تارگت روی flag limit دیروز گذاشته است.

PO من فعال شد ولی استاپ خوردم. مطمئن نیستم چرا چون قیمت به SL من نرسید. فکر می‌کردم بافر کافی گذاشته‌ام ولی واضحاً نگذاشته بودم. این دومین بار است که با چنین حاشیهٔ کوچکی استاپ می‌خورم.

با این معامله خیلی بهتر از PO‌ای که دیروز فعال شد احساس راحتی داشتم.`,
  },
  {
    id: 'in2forex_p1_23',
    text: `Last week I was traveling. On thursday night I didn't have an internet connection so I started drawing my own charts. I wanted to understand what was happening when price moved and why there would be a pool of orders left behind or consumed. I started to realize that RTM isn't as much about trading than it is about what the name says "Read The Market".

If I can identify key areas, If I can identify the significance of those area's, and if I can READ what pro money wants to do, then trading what I see will be easy. Over the last few weeks I've been a sponge to the information on this site. Now its time to put some

structure and learning goals to that information,

My journal is no long going to be about what trades I've taken, but more about what I see, how I read what I see. Later I'll come back to trading.

This was an Eureka for me. I wanted to add an Eureka moment quote this is one I liked.

The most exciting phrase to hear in science, the one that heralds new discoveries, is not 'Eureka!' but 'That's funny...' Isaac Asimov`,
    fa: `هفتهٔ گذشته در سفر بودم. شب پنجشنبه اتصال اینترنت نداشتم، پس شروع کردم چارت‌های خودم را بکشم. می‌خواستم بفهمم وقتی قیمت حرکت می‌کند چه اتفاقی می‌افتد و چرا استخری از سفارش‌ها جا می‌ماند یا مصرف می‌شود. کم‌کم فهمیدم RTM بیشتر از معامله‌گری دربارهٔ همان چیزی است که اسمش می‌گوید: «بازار را بخوان».

اگر بتوانم نواحی کلیدی را شناسایی کنم، اگر بتوانم اهمیت آن نواحی را بفهمم، و اگر بتوانم بخوانم که پول هوشمند چه می‌خواهد بکند، آن‌وقت معامله کردن بر اساس آنچه می‌بینم آسان خواهد بود. در چند هفتهٔ گذشته اسفنج اطلاعات این سایت بوده‌ام. حالا وقت آن است که کمی

ساختار و اهداف یادگیری به این اطلاعات بدهم.

ژورنال من دیگر دربارهٔ معاملاتی که گرفته‌ام نخواهد بود، بلکه بیشتر دربارهٔ چیزی است که می‌بینم و چطور آن را می‌خوانم. بعداً به معامله‌گری برمی‌گردم.

این یک یوریکا برای من بود. می‌خواستم یک نقل‌قول لحظهٔ یوریکا اضافه کنم؛ این یکی را دوست داشتم.

هیجان‌انگیزترین جمله‌ای که در علم می‌شنوی، جمله‌ای که کشف‌های تازه را نوید می‌دهد، «یوریکا!» نیست، بلکه «عجیبه...» است. آیزاک آسیموف`,
  },
];

const parsed = JSON.parse(fs.readFileSync(PARSED, 'utf8'));
const postById = new Map();
for (const j of parsed.journals) for (const p of j.posts) postById.set(p.id, p);
const work = fs.existsSync(WORK) ? JSON.parse(fs.readFileSync(WORK, 'utf8')) : [];
const batch = fs.existsSync(BATCH) ? JSON.parse(fs.readFileSync(BATCH, 'utf8')) : {};
const store = JSON.parse(fs.readFileSync(STORE, 'utf8'));

for (const t of TARGETS) {
  const post = postById.get(t.id);
  if (!post) throw new Error('missing ' + t.id);
  const oldHash = hashOf(post.text);
  const newHash = hashOf(t.text);
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
  batch[newHash] = t.fa;
  store[newHash] = t.fa;
  console.log(t.id, oldHash.slice(0, 8), '->', newHash.slice(0, 8));
}

fs.writeFileSync(PARSED, JSON.stringify(parsed), 'utf8');
fs.writeFileSync(WORK, JSON.stringify(work), 'utf8');
fs.writeFileSync(BATCH, JSON.stringify(batch), 'utf8');
fs.writeFileSync(STORE, JSON.stringify(store), 'utf8');
console.log('written', PAGE, 'work', work.length);
