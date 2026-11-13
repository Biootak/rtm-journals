#!/usr/bin/env node
/* Restore jiri #216 and the three supplydemand posts from their PDF text. */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..', '..');
const BUILD = path.join(ROOT, '_build');
const PARSED = path.join(BUILD, 'parsed.json');
const WORK = path.join(__dirname, 'work');
const BATCH = path.join(__dirname, 'batches');
const STORE = path.join(__dirname, 'posts.json');

const normalize = t => String(t || '').replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ')
  .replace(/\n{3,}/g, '\n\n').trim();
const hashOf = t => crypto.createHash('sha1').update(normalize(t)).digest('hex');

const TARGETS = [
  {
    page: 'jiri-p9', id: 'jiri_p9_216',
    text: `200 Km/h wrote: sorry about that.my mistake Now corrected 47% DD.

in augest i saw your trade explorer .(was visible due to a bug in forexfactory system)

your avg.lot size was 0.02 lots.

avg.trade pips 15. avg wining trade 0.8% avg.losing trade 1.5% winrate 72.6% closed trades 807 weekly trading volume was 2.11 lots

based on above statistics you trade a lot but with small lot size.(which is good imo) overall you are protable 52.4% monthly return. (52 days old account)

well that are right informations because i started on 1.july with 0,01 lot

SD method was by that time 2 weeks old in my head and i wanted to start realy slowly

now the situation is a bit diffrent :) but its truth iam still risking a lot because of the small account

iam actually trading with no proper MM until i have 20-30k USD on my account

this is the account you maybe saw, all money withdrawal at 9.september and i put it to the PRO`,
    fa: `200 Km/h نوشت: ببخشید، اشتباه من بود. حالا اصلاح شد، 47% DD.

در آگوست trade explorer تو را دیدم (به‌خاطر یک باگ در سیستم forexfactory قابل مشاهده بود).

میانگین حجم لات تو 0.02 لات بود.

میانگین پیپ معامله 15، میانگین معاملهٔ برنده 0.8%، میانگین معاملهٔ بازنده 1.5%، وین‌ریت 72.6%، 807 معاملهٔ بسته‌شده، حجم معاملات هفتگی 2.11 لات.

بر اساس آمار بالا، زیاد معامله می‌کنی ولی با حجم کوچک (که به نظر من خوب است). در کل سوددهی 52.4% ماهانه داری (حساب 52 روزه).

خب این اطلاعات درست است چون من از 1 جولای با 0.01 لات شروع کردم.

آن موقع روش SD فقط 2 هفته در ذهنم بود و می‌خواستم واقعاً آهسته شروع کنم.

حالا وضعیت کمی فرق کرده :) ولی راستش هنوز به‌خاطر حساب کوچک ریسک زیادی می‌کنم.

در واقع تا وقتی 20-30 هزار دلار در حسابم داشته باشم، بدون MM مناسب معامله می‌کنم.

این همان حسابی است که شاید دیدی؛ همهٔ پول‌ها در 9 سپتامبر برداشت شد و آن را به PRO منتقل کردم.`,
  },
  {
    page: 'supplydemand-p43', id: 'supplydemand_p43_1052',
    text: `EU long from daily support:`,
    fa: `خرید EU از حمایت روزانه:`,
  },
  {
    page: 'supplydemand-p43', id: 'supplydemand_p43_1057',
    text: `first Picture is DBR

and if we look further left we can see it actually bottomed out of another base before that. see Picture #2 where u have RBR

Edit: come to think of it Again. if u mean basing as in base on base. then its supply on top of another supply etc.`,
    fa: `تصویر اول DBR است.

و اگر بیشتر به چپ نگاه کنیم می‌بینیم که در واقع پیش از آن از یک بیس دیگر هم بیرون آمده. تصویر #2 را ببین که RBR داری.

ویرایش: دوباره فکر می‌کنم. اگر منظور از basing همان base on base باشد، آن‌وقت supply روی supply دیگر است و غیره.`,
  },
  {
    page: 'supplydemand-p43', id: 'supplydemand_p43_1058',
    text: `Dappa wrote: Can someone explain the meaning of basing, that has always confused me. Is basing considered ranging? Isn't ranging considered a sort of equilibream state for price, meaning no imbalance.

Or is basing the acumilation and distributing of orders, can someone explain? Would greatly appreciate it.

Hey Dappa,

i have defined the base with black square (or box). To my understanding - price gets "trapped" between two important prices. (The high of the box and the low of the box.) The price has been given a limited range where it can move. (To understand why it limits the price - you should check engulfing, order-flow and flag limit articles.) Price needs a push from bigger money to break (engulf) the high or the low of the box (HTF can help you getting an idea in which way it will break.) Its indeed almost an equalibrium of price - from where a decision will be needed inin order to break bulish or bearish.

Ofcourse you have 100 pip and 5 pip ranges (bases) . In my case: It wasnt clear to me, and didnt wanna risk it - so i just closed the position.

2 cents MIKY

p.s.: i havent mentioned some things - becouse they are mentioned in great RTM articles.`,
    fa: `Dappa نوشت: کسی می‌تواند معنی basing را توضیح دهد؟ همیشه گیجم کرده. آیا basing همان ranging است؟ آیا ranging نوعی حالت تعادل برای قیمت نیست، یعنی بدون عدم‌تعادل؟

یا basing همان انباشت و توزیع سفارش‌هاست؟ کسی می‌تواند توضیح دهد؟ خیلی ممنون می‌شوم.

سلام Dappa،

بیس را با مربع مشکی (یا باکس) مشخص کرده‌ام. به فهم من، قیمت بین دو قیمت مهم «گیر» می‌افتد (سقف باکس و کف باکس). به قیمت یک محدودهٔ محدود داده شده که در آن حرکت کند. (برای فهم اینکه چرا قیمت را محدود می‌کند، مقاله‌های engulfing، order-flow و flag limit را ببین.) قیمت برای شکستن (engulf) سقف یا کف باکس به هل دادن پول بزرگ‌تر نیاز دارد (HTF می‌تواند کمک کند بفهمی به کدام سمت می‌شکند). واقعاً تقریباً تعادل قیمت است — نقطه‌ای که برای شکستن صعودی یا نزولی تصمیم لازم است.

البته محدوده‌های 100 پیپی و 5 پیپی (بیس‌ها) داری. در مورد من: برایم روشن نبود و نمی‌خواستم ریسک کنم — پس فقط پوزیشن را بستم.

دو سنت از MIKY

پینوشت: بعضی چیزها را نگفتم — چون در مقاله‌های عالی RTM گفته شده‌اند.`,
  },
];

const parsed = JSON.parse(fs.readFileSync(PARSED, 'utf8'));
const postById = new Map();
for (const j of parsed.journals) for (const p of j.posts) postById.set(p.id, p);
const store = JSON.parse(fs.readFileSync(STORE, 'utf8'));

const byPage = new Map();
for (const t of TARGETS) {
  if (!byPage.has(t.page)) byPage.set(t.page, []);
  byPage.get(t.page).push(t);
}

for (const [page, targets] of byPage) {
  const workFile = path.join(WORK, page + '.json');
  const batchFile = path.join(BATCH, page + '.json');
  const work = fs.existsSync(workFile) ? JSON.parse(fs.readFileSync(workFile, 'utf8')) : [];
  const batch = fs.existsSync(batchFile) ? JSON.parse(fs.readFileSync(batchFile, 'utf8')) : {};
  for (const t of targets) {
    const post = postById.get(t.id);
    if (!post) throw new Error('missing post ' + t.id);
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
  fs.writeFileSync(workFile, JSON.stringify(work), 'utf8');
  fs.writeFileSync(batchFile, JSON.stringify(batch), 'utf8');
}
fs.writeFileSync(PARSED, JSON.stringify(parsed), 'utf8');
fs.writeFileSync(STORE, JSON.stringify(store), 'utf8');
console.log('written', byPage.size, 'pages');
