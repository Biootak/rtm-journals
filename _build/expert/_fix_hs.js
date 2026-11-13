const fs = require('fs');
const path = require('path');
const lex = require(path.resolve(__dirname, '..', 'lexicon.js'));
const policy = require(path.resolve(__dirname, '..', 'translation-policy.js'));

// fixes[pageFile] = { hash: [ops] } ; op = {find,repl} | {set} | {cut,tail}
const fixes = {
 'hs-p22': {
  '38bc92a2bb9af758a6f4259115841e0128b68b76': [ // hs_p22_537 paragraphs 4/3
   {find:'تمام شود؟ یا CPPAZ را باید', repl:'تمام شود؟\n\nیا CPPAZ را باید'}
  ],
  '991af111ec29e9842e27d502507bfea699fb7c04': [ // hs_p22_547 paragraphs 6/5
   {find:'خیلی ممنون Hans! یک تصویر', repl:'خیلی ممنون Hans!\n\nیک تصویر'}
  ],
  '05b55ec37288888f0322b2ca1f7385f64deb4800': [ // hs_p22_541 echo برگشت سطح
   {find:'برگشت از سطح S/R نشانهٔ صعود بیشتر است', repl:'جهش از سطح S/R نشانهٔ صعود بیشتر است'}
  ]
 },
 'hs-p7': {
  '8c25d404c95d4141f06265b67d374f538e1f193c': [ // hs_p7_173 echo Drop قوی
   {find:'قیمت Drop قوی دارد', repl:'قیمت Drop شدیدی دارد'}
  ]
 },
 'hs-p8': {
  '07dcfecf7b6c02845f069f9c4ca9610afcd887f5': [ // hs_p8_176 echo دارم! دوست
   {find:'دوست دارم حرکت قیمت را بگیرم!', repl:'گرفتنِ حرکت قیمت را دوست دارم!'}
  ],
  'a8775906945f66e143905fac677bdee17807b2e9': [ // hs_p8_177 echo دارم! دوست
   {find:'دوست دارم حرکت قیمت را بگیرم!', repl:'گرفتنِ حرکت قیمت را دوست دارم!'}
  ]
 },
 'hs-p10': {
  '890f274fcfc28af1d8c418becaf3963863799986': [ // hs_p10_238 echo واکنش نشان
   {find:'که قیمت در آن واکنش نشان می‌دهد', repl:'که قیمت در آن پاسخ می‌دهد'}
  ]
 },
 'hs-p15': {
  '50f87a818baab08ec626e28f5ae8477f4f34befd': [ // hs_p15_366 echo اینجا مثال
   {find:'اینجا یک مثال مشابه روی GBP/JPY:', repl:'یک مثال مشابه دیگر هم روی GBP/JPY هست:'}
  ]
 },
 'hs-p16': {
  '8fec4146d244e35184f05255d0aae443a0bb46f5': [ // hs_p16_385 echo خوبی خرید
   {find:'شاید زمان خوبی برای لانگ باشد', repl:'شاید الان موقعیت مناسبی برای لانگ باشد'},
   {find:'کسی دیگر هم این را جای خوبی برای لانگ می‌بیند؟', repl:'کسی دیگر هم این را نقطهٔ مناسبی برای لانگ می‌بیند؟'}
  ]
 },
 'hs-p19': {
  '98fd327164f3ad9a9a1396ab5a9b7bfce0d057c8': [ // hs_p19_474 echo چارت دقیقه‌ای
   {find:'و یک چارت 1 دقیقه‌ای ضمیمه کردم', repl:'و یک چارت 1-min هم ضمیمه کردم'}
  ]
 },
 'hs-p34': {
  '11b3d2eca0eda956122ad25cbbb054cc80d8c5d4': [ // hs_p34_831 echo حدود پیپ
   {find:'استاپ حدود 4 پیپ با لیمیت حدود 40 پیپ', repl:'استاپ ~ 4 پیپ با لیمیت ~ 40 پیپ'}
  ]
 },
 'hs-p37': {
  '23350b04de295ec3dde7baf44a0d099be3ab60f7': [ // hs_p37_909 echo قیمت ORFL
   {find:'پیش از این که قیمت به ORFL 1 ادامه دهد', repl:'پیش از ادامه به‌سوی ORFL 1'}
  ]
 },
 'hs-p38': {
  '5f03b12789b28568c222e4d3fddf8024634cd712': [ // hs_p38_939 echo swap zone
   {find:'وقتی واقعاً swap zone نیستند', repl:'وقتی واقعاً ناحیهٔ swap نیستند'}
  ]
 },
 'hs-p41': {
  '318f780b58ca4ef35b5793754689a19cb355687b': [ // hs_p41_1025 paragraphs 6/5
   {find:'شگفت‌انگیز است\n\nچون چارت‌هایت هم «از نظر', repl:'شگفت‌انگیز است\n\n، همان‌طور که چارت‌هایت\n\nهم «از نظر'}
  ]
 },
 'hs-p42': {
  '647220c3ed793bd0ed8a67c57aff960ad7b406eb': [ // hs_p42_1033 echo نواحی swap
   {find:'نواحی swap داخل نواحی swap بزرگ‌تر', repl:'نواحی swap درون swap zoneهای بزرگ‌تر'},
   {find:'یک ناحیهٔ swap کوچک‌تر را داخل ناحیهٔ swap تایم‌فریم بالا', repl:'یک ناحیهٔ swap کوچک‌تر را درون ناحیهٔ بزرگ‌ترِ swap تایم‌فریم بالا'}
  ]
 },
 'hs-p45': {
  'fc6131a4573e7debe6fc72863414808cf6f6a560': [ // hs_p45_1110 echo Box ناحیهٔ
   {find:'بالای FL Box B ناحیهٔ FOای وجود ندارد', repl:'بالای FL Box B هیچ ناحیهٔ FOای وجود ندارد'}
  ]
 },
 'hs-p46': {
  '3cf75ae6c7ceb77a9d60114240521df5181dd981': [ // hs_p46_1130 paragraphs 17/21
   {cut:'مفهوم PAZ روی چارت تیک درست است',
    tail:'\n\nقیمت چطور از یک PAZ خارج می‌شود؟ فکر می‌کنم همه‌چیز به FOF برمی‌گردد. باید سفارش‌های قوی وجود داشته باشد تا سطوح قبلاً مهم داخل یک FTR را بشکند. سفارش‌های قوی یعنی گاوها و خرس‌ها می‌جنگند و تیمی که نقدینگی بیشتری دارد برنده می‌شود.\n\nشکستن یک ناحیهٔ تقاضای قوی به سفارش‌های فروش فراوان نیاز دارد و شکستن یک ناحیهٔ عرضهٔ قوی به سفارش‌های خرید فراوان نیاز دارد.'}
  ],
  '7cfc1ddf9abdadb29c24fbd4e51cb1e5d13628cd': [ // hs_p46_1134 paragraphs 13/12
   {find:'تردید نکن... من هنوز در این خیلی تازه‌کار هستم', repl:'تردید نکن... من\n\nهنوز در این خیلی تازه‌کار هستم'}
  ]
 },
 'hs-p48': {
  'b7ec0eaf473d56c6aaf7e51aff35764cc8337b3d': [ // hs_p48_1181 echo supply واقعی
   {find:'ناحیهٔ فشردگی واقع درست بالای supply واقعی را نشان می‌دهد', repl:'ناحیهٔ فشردگی واقع درست بالای عرضهٔ واقعی را نشان می‌دهد'}
  ]
 },
 'hs-p49': {
  '13d0a426bb4f1e58b8f4dc6431d7eb5b3ee29373': [ // hs_p49_1223 echo supply واقعی
   {find:'ناحیهٔ supply واقعی واکنش نشان می‌دهد', repl:'ناحیهٔ عرضهٔ واقعی واکنش نشان می‌دهد'}
  ]
 },
 'hs-p60': {
  'fbe8e9cf46efff6bfbf776a382ff7a2e033af6bd': [ // hs_p60_1480 echo نمای نزدیک
   {find:'نمای نزدیک FL Box آبی:', repl:'نمای بزرگ FL Box آبی:'}
  ]
 },
 'hs-p61': {
  'd117e6d40c07c74642684391ae50336776f3dfdb': [ // hs_p61_1514 paragraphs 4/3 (+ preempt echo لبهٔ نهایی)
   {find:'(اینگالف عرضهٔ واقعی) را در نظر بگیریم', repl:'(اینگالف عرضهٔ\n\nواقعی) را در نظر بگیریم'},
   {find:'که در آن لبهٔ نهایی PAZ به نظر من همان FL روزانهٔ آبی می‌شود', repl:'که در آن کران PAZ به نظر من همان FL روزانهٔ آبی می‌شود'}
  ]
 },
 'hs-p62': {
  '8f565e07632e34bc8ce63e5ef7b4967e191bc0b9': [ // hs_p62_1537 paragraphs 9/10
   {find:'اشتباه می‌کنم؟\n\nخیلی ممنون، بهترین‌ها\n\nسلام Althoufx', repl:'اشتباه می‌کنم؟ خیلی ممنون، بهترین‌ها\n\nسلام Althoufx'}
  ]
 },
 'hs-p65': {
  '52c533be68a73758b59f8de1c3797deebe9af4f7': [ // hs_p65_1612 echo این‌جا مثال (+ preempt echoes)
   {find:'این‌جا مثال سخت‌تری روی USD-JPY:', repl:'مثال سخت‌تری دیگری روی USD-JPY:'},
   {find:'آیا این درست است؟', repl:'این تحلیل درست است؟'}
  ],
  '879bd6aa467d8e614eb18ad7c60722eea70733fb': [ // hs_p65_1622 paragraphs 8/9
   {find:'برآورده‌نشده می‌آید.\n\nنمودار زیر MPL و سطح QM را در جزئیات نشان می‌دهد:', repl:'برآورده‌نشده می‌آید. نمودار زیر MPL و سطح QM را در جزئیات نشان می‌دهد:'}
  ],
  '8ee68cc47cd068c3d00dc777fbea5fbb66935987': [ // hs_p65_1623 paragraphs 10/5
   {set:'AUD-USD - تحلیل معامله ادامه‌دار:\n\nحالا که قیمت به سمت بالا اینگالف کرده و تارگت یک ORFL است، RT عمیق تا آخرین جیب تقاضا را انتظار دار. همچنین به دنبال ناحیه‌ای باش که قیمت بتواند به آن FO کند.\n\nITها می‌خواهند net long باشند، پس در عمیق‌ترین بخش RT یک تلهٔ فروش می‌سازند.\n\nاز آنچه می‌بینم، مستطیل خاکستری پایین به نظر بهترین جای demand است - و چون قیمت قبلاً این سطح را تست کرده و demand ساخته، یک تلهٔ فروش خوب در انتظار است تا قیمت به MPL FO کند.\n\nقیمت از یک تارگت لانگِ نرسیده می‌آید (ORFL - Down). MPL و سطح QM در جزئیات روی نمودار پایین نشان داده شده:\n\n(سفارش لیمیت را نادیده بگیر)\n\nهمچنین، این ناحیهٔ تقاضا را دوست دارم چون در اصل بعد از یک اینگالف شکل گرفته و درست بالای آن یک ستاپ QM تایم‌فریم بالا در حال وقوع است - که ناحیهٔ تقاضا را به یک HTF DM کامل تبدیل می‌کند.\n\nخرده‌فروشان EG اخیر را FO می‌بینند، قیمت تا سطح QM می‌افتد و همه شروع به خریدن می‌کنند. قیمت می‌افتد، استاپ‌لاس‌های معامله‌گران QM با پوزیشن لانگ (شورت‌ها) را تریگر می‌کند. معامله‌گران شکست QM ناموفق را می‌بینند و شروع به فروش شکست نزولی می‌کنند. ITها وارد این سفارش‌های فروش می‌شوند و قیمت به آخرین جیب تقاضا در ناحیهٔ اصلی FO می‌کند، قبل از اینکه قیمت را به بالا برگرداند.\n\nترکیب کاملی از ترفندهای بالقوه برای شورت‌کردن همه قبل از رفتن به لانگ. اگر من IT بودم همین‌طور انجام می‌دادم.\n\nنمای تایم‌فریم بالا:'}
  ]
 },
 'hs-p69': {
  '67dd2029794cd32e90b81cbc18a1521e5912ebd8': [ // hs_p69_1708 paragraphs 14/12
   {find:'. می‌توانم وقتی برسم خانه چند ساعت دیگر یک دیاگرام بکشم اگر ارزش داشته باشد.', repl:'. می‌توانم چند ساعت دیگر وقتی برسم خانه یک دیاگرام بکشم\n\nاگر ارزش داشته باشد.'},
   {find:'Clint عزیز', repl:'موفق باشید،\n\nClint'}
  ],
  'f0669d662dfe837a0a7ed1bb98a12674ed7f1f32': [ // hs_p69_1711 paragraphs 26/24
   {find:'بازهٔ عالی است.\n\nادامه در پست بعدی', repl:'بازهٔ عالی است.\n\nKink در 5 دقیقه\n\nبیایید این را به‌ترتیب روی چارت‌های 30M، 15M و 1M نگاه کنیم. به خاطر داشته باش که سقف/کف kink ممکن است بر اساس تایم‌فریم تغییر کند. البته، تایم‌فریم‌های بالاتر نمای کلی‌تری از kink نشان می‌دهد و تایم‌فریم پایین‌تر FTR ظریف‌شده را نشان می‌دهد.\n\nادامه در پست بعدی'}
  ]
 },
 'hs-p71': {
  'e1215736d24ec5cc66b7feb532f80ba8a45c98a6': [ // hs_p71_1753 paragraphs 6/5
   {find:'که یا لبهٔ CP است یا SR یا LS یا LS نادیده‌گرفته‌شده.', repl:'که یا:\n\n- لبهٔ CP - SR - LS یا LS نادیده‌گرفته‌شده.'}
  ],
  '76c33138574d0fdf6096a4190bc87479458ecde4': [ // hs_p71_1771 paragraphs 4/3
   {find:'وارد شدم - صفر\ndrawdown - آیا تو هم شورت شدی؟', repl:'وارد شدم - صفر\n\nDrawdown - آیا تو هم شورت شدی؟'}
  ],
  '50164f553dc748c6f73d10686b4dd6bbc0fe42b3': [ // hs_p71_1772 paragraphs 7/6
   {find:'پیدا کردم و وارد شدم - صفر\ndrawdown - آیا تو هم شورت شدی؟', repl:'پیدا کردم و\n\nوارد شدم - صفر Drawdown - آیا تو هم شورت شدی؟'}
  ]
 },
 'hs-p73': {
  'f20504e81c9b96006445b713f0aad7a9e0eb0c26': [ // hs_p73_1805 paragraphs 2/1
   {set:'EUR-AUD ادامه:\n\nPA بسیار مشابهی بالای معاملهٔ اولیه شکل می‌گیرد. با این حال این بار، قیمت سقف قابل‌توجهی نساخت، پس فرصت معاملاتی وجود نداشت.'}
  ],
  '9b47759d62a8f5a6683846d91b475d3dab02121a': [ // hs_p73_1815 paragraphs 4/1
   {set:'EUR-JPY ستاپ دقیق:\n\nبه دنبال کندل‌های مومنتوم بزرگ روی چارت 15 دقیقه‌ای بودم و به این رسیدم:\n\nسؤال: قیمت به‌احتمال زیاد کجا RT می‌کند؟ با کشیدن نواحی مهم چارت شروع کن.\n\nنمای نزدیک چارت 1-min:'}
  ],
  'fafa01014cd57e79e4bcbf79a311eea5a9b35520': [ // hs_p73_1821 paragraphs 2/1
   {set:'USD-JPY:\n\nمثالی واقعاً خوب- شبیه‌سازی تست رو به جلو:'}
  ]
 },
 'hs-p75': {
  '2b30b8ea9ac13a188f8fc5d16eb74c5357fe3ee6': [ // hs_p75_1869 echo خیلی سخت
   {find:'با تارگت‌ها خیلی سخت دارم', repl:'تارگت‌ها برایم خیلی سخت‌اند'}
  ]
 },
 'hs-p76': {
  'c2077754ba8fc52e9850df6161a5a33e7ba96d8d': [ // hs_p76_1900 paragraphs 4/1
   {set:'همین حالا روی GU بستم: این معامله از نظر ورود معتبرِ معمولی‌ام کمی غیرمعمول بود، اما خوب جواب داد. SLم خیلی تنگ بود. در IQM تایم‌فریم پایینِ واقع در جعبهٔ پرچم قرمز وارد شدم. روی نمودار HTF صعودی بودم چون قیمت به ناحیهٔ PA فشردگی اینگالف کرد و به سمت پایین اینگالف نکرد.\n\nاین حدود 18:R بود.\n\nاین‌جا نمای ساده‌شدهٔ HTF:\n\nآخرین نمودار، دلیل تارگت را نشان می‌دهد: (می‌خواستم روی QM تایم‌فریم بالاتر خارج شوم در صورت ریزش)'}
  ]
 },
 'hs-p81': {
  '374a07e8f940dcf226b0456d9591507025f56703': [ // hs_p81_2009 echo واکنش نشان
   {find:'فوق‌العاده واکنش نشان می‌دهد', repl:'فوق‌العاده جواب می‌دهد'}
  ]
 },
 'hs-p90': {
  '1a9a1d6e75bab1b75b1f5340b6ba96e6c19474d1': [ // hs_p90_2248 echo همان‌طور شکل
   {find:'تا PA را همان‌طور که شکل می‌گیرد ببینی', repl:'تا PA را در همان لحظه‌ای که شکل می‌گیرد ببینی'}
  ]
 }
};

const B = path.resolve(__dirname, 'batches');
const W = path.resolve(__dirname, 'work');
let changed = 0, problems = [];
for (const [page, hashes] of Object.entries(fixes)) {
  const bp = path.join(B, page + '.json');
  const batch = JSON.parse(fs.readFileSync(bp, 'utf8'));
  const work = JSON.parse(fs.readFileSync(path.join(W, page + '.json'), 'utf8'));
  const wByHash = Object.fromEntries(work.map(w => [w.hash, w]));
  for (const [hash, ops] of Object.entries(hashes)) {
    let v = batch[hash];
    if (v === undefined) { problems.push(page + ' ' + hash + ' MISSING'); continue; }
    const w = wByHash[hash];
    const enParas = String(w.text).split(/\n{2,}/).filter(x => x.trim()).length;
    for (const op of ops) {
      if (op.set !== undefined) { v = op.set; continue; }
      if (op.cut !== undefined) {
        const marker = '\n\n' + op.cut;
        const idx = v.indexOf(marker);
        if (idx < 0) { problems.push(page + ' ' + hash + ' CUT-MISS ' + op.cut.slice(0, 30)); continue; }
        v = v.slice(0, idx) + op.tail;
        continue;
      }
      if (!v.includes(op.find)) { problems.push(page + ' ' + hash + ' FIND-MISS ' + op.find.slice(0, 40)); continue; }
      v = v.split(op.find).join(op.repl);
    }
    const faParas = String(v).split(/\n{2,}/).filter(x => x.trim()).length;
    const cm = policy.cleanMachine(v, w.text);
    const clean = lex.cleanText(cm);
    const bg = lex.repeatedPhrase(clean);
    const echoRisk = clean.length < 400 && bg;
    if (faParas !== enParas) problems.push(page + ' ' + hash + ' PARAS ' + enParas + '/' + faParas);
    if (echoRisk) problems.push(page + ' ' + hash + ' ECHO? "' + bg + '" len=' + clean.length);
    batch[hash] = v;
    changed++;
  }
  fs.writeFileSync(bp, JSON.stringify(batch, null, 1) + '\n');
}
console.log('changed:', changed);
for (const p of problems) console.log('PROBLEM:', p);
