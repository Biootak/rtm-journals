/*
 * Domain lexicon for the RTM trading-journal archive.
 *
 * The archive is full of short chart labels: "FL hold", "true supply",
 * "price down", "clean order", "M15", "EURUSD, H4, scale 100%". A generic
 * machine translator mangles exactly these, because it has no idea that FL is
 * a fair-value-gap flag, that "supply" means a supply zone, or that "1H" is a
 * timeframe and not the English word "hour" in company with a digit.
 *
 * So this module holds the expert terminology, and it decides what a text is:
 *
 *   chrome  – symbol / timeframe / date / scale / window furniture.
 *             Nothing to translate: the original line is the answer.
 *   noise   – OCR garbage ("ur area hergzr", "inside Swa"). Nothing to
 *             translate either: inventing Persian for it is worse than empty.
 *   label   – a short domain phrase built from known terms. Translated
 *             word-by-word from this lexicon, which is consistent and expert.
 *   prose   – real sentences. Those go to the machine translator, then
 *             through postEdit() + the token policy.
 *
 * Everything here is plain data plus pure functions so both the bake step and
 * the site build can use it, and the test file can assert on it.
 */

/* ------------------------------------------------------------------ *
 * Multi-word terms. Longest match wins, so order does not matter here.
 * ------------------------------------------------------------------ */
const PHRASES = [
  // --- order flow / supply & demand ---
  ['clean order', 'سفارش تمیز'],
  ['clean orders', 'سفارش‌های تمیز'],
  ['order flow', 'جریان سفارش'],
  ['order block', 'بلاک سفارش'],
  ['order blocks', 'بلاک‌های سفارش'],
  ['limit order', 'سفارش لیمیت'],
  ['stop order', 'سفارش استاپ'],
  ['market order', 'سفارش مارکت'],
  ['pending order', 'سفارش در انتظار'],
  ['true supply', 'عرضه واقعی'],
  ['true demand', 'تقاضای واقعی'],
  ['false supply', 'عرضه کاذب'],
  ['false demand', 'تقاضای کاذب'],
  ['supply zone', 'ناحیه عرضه'],
  ['demand zone', 'ناحیه تقاضا'],
  ['supply area', 'ناحیه عرضه'],
  ['demand area', 'ناحیه تقاضا'],
  ['supply and demand', 'عرضه و تقاضا'],
  ['supply/demand', 'عرضه/تقاضا'],
  ['untouched supply', 'عرضه دست‌نخورده'],
  ['untouched demand', 'تقاضای دست‌نخورده'],
  ['fresh supply', 'عرضه تازه'],
  ['fresh demand', 'تقاضای تازه'],
  ['zone to zone', 'ناحیه به ناحیه'],

  // --- liquidity ---
  ['liquidity grab', 'شکار نقدینگی'],
  ['liquidity grabss', 'شکارهای نقدینگی'],
  ['liquidity sweep', 'جاروی نقدینگی'],
  ['liquidity sweepss', 'جاروهای نقدینگی'],
  ['liquidity void', 'خلأ نقدینگی'],
  ['liquidity pool', 'مجموعه نقدینگی'],
  ['liquidity poolss', 'مجموعه‌های نقدینگی'],
  ['liquidity zone', 'ناحیه نقدینگی'],
  ['liquidity levels', 'سطوح نقدینگی'],
  ['draw on liquidity', 'کشش به سمت نقدینگی'],
  ['draw liquidity', 'کشش نقدینگی'],
  ['grab liquidity', 'شکار نقدینگی'],
  ['stop hunt', 'شکار حد ضرر'],
  ['stop huntss', 'شکارهای حد ضرر'],
  ['stop hunts', 'شکار حد ضرر'],
  ['hunt stop', 'شکار حد ضرر'],
  ['equal highs', 'سقف‌های برابر'],
  ['equal lows', 'کف‌های برابر'],
  ['equal high', 'سقف برابر'],
  ['equal low', 'کف برابر'],

  // --- market structure / ICT ---
  ['break of structure', 'شکست ساختار'],
  ['change of character', 'تغییر کاراکتر'],
  ['market structure', 'ساختار بازار'],
  ['market structure shift', 'تغییر ساختار بازار'],
  ['fair value gap', 'شکاف ارزش منصفانه'],
  ['fair value gape', 'شکاف ارزش منصفانه'],
  ['mitigation block', 'بلاک تعدیل'],
  ['breaker block', 'بلاک شکسته'],
  ['rejection block', 'بلاک رد شدن'],
  ['decision point', 'نقطه تصمیم'],
  ['kill zone', 'کیل‌زون'],
  ['kill zones', 'کیل‌زون'],
  ['optimal trade entry', 'ورود بهینه معاملاتی'],
  ['premium', 'پرمیوم'],
  ['discount', 'دیسکانت'],
  ['premium zone', 'ناحیه پرمیوم'],
  ['discount zone', 'ناحیه دیسکانت'],
  ['equilibrium', 'تعادل'],
  ['imbalance', 'عدم تعادل'],
  ['inefficiency', 'ناکارآمدی'],
  ['swing high', 'سقف سوئینگ'],
  ['swing low', 'کف سوئینگ'],
  ['swing point', 'نقطه سوئینگ'],
  ['higher high', 'سقف بالاتر'],
  ['higher low', 'کف بالاتر'],
  ['lower high', 'سقف پایین‌تر'],
  ['lower low', 'کف پایین‌تر'],
  ['lower timeframe', 'تایم‌فریم پایین‌تر'],
  ['higher timeframe', 'تایم‌فریم بالاتر'],
  ['time frame', 'تایم‌فریم'],
  ['time frames', 'تایم‌فریم‌ها'],
  ['institutional traders', 'معامله‌گران نهادی'],
  ['institutional trader', 'معامله‌گر نهادی'],
  ['smart money', 'پول هوشمند'],
  ['engineering', 'مهندسی قیمت'],
  ['manipulation', 'دستکاری'],
  ['accumulation', 'انباشت'],
  ['distribution', 'توزیع'],
  ['expansion', 'انبساط'],
  ['contraction', 'انقباض'],
  ['price action', 'پرایس اکشن'],
  ['price delivery', 'جریان قیمت'],
  ['price range', 'محدوده قیمت'],

  // --- price / trend ---
  ['price up', 'صعود قیمت'],
  ['price down', 'نزول قیمت'],
  ['hold price up', 'حفظ قیمت در بالا'],
  ['hold price down', 'حفظ قیمت در پایین'],
  ['hold price', 'حفظ قیمت'],
  ['price is', 'قیمت'],
  ['clean move', 'حرکت تمیز'],
  ['up move', 'حرکت صعودی'],
  ['down move', 'حرکت نزولی'],
  ['strong move', 'حرکت قوی'],
  ['leg up', 'موج صعودی'],
  ['leg down', 'موج نزولی'],
  ['bullish', 'صعودی'],
  ['bearish', 'نزولی'],
  ['bull run', 'روند صعودی'],
  ['trend up', 'روند صعودی'],
  ['trend down', 'روند نزولی'],
  ['uptrend', 'روند صعودی'],
  ['downtrend', 'روند نزولی'],
  ['sideways', 'روند خنثی'],
  ['consolidation', 'تثبیت'],
  ['retracement', 'اصلاح'],
  ['pullback', 'پولبک'],
  ['pull back', 'پولبک'],
  ['reversal', 'برگشت روند'],
  ['continuation', 'ادامه روند'],
  ['exhaustion', 'فرسودگی'],
  ['momentum', 'مومنتوم'],
  ['breakout', 'شکست'],
  ['fake out', 'شکست جعلی'],
  ['false break', 'شکست جعلی'],
  ['break out', 'شکست به بیرون'],
  ['break down', 'شکست به پایین'],
  ['broke out', 'شکست به بیرون'],
  ['top down', 'از بالا به پایین'],
  ['bottom up', 'از پایین به بالا'],
  ['long term', 'بلندمدت'],
  ['short term', 'کوتاه‌مدت'],
  ['mid term', 'میان‌مدت'],

  // --- levels ---
  ['support and resistance', 'حمایت و مقاومت'],
  ['support/resistance', 'حمایت/مقاومت'],
  ['key level', 'سطح کلیدی'],
  ['key levels', 'سطوح کلیدی'],
  ['major level', 'سطح اصلی'],
  ['minor level', 'سطح فرعی'],
  ['round number', 'عدد رند'],
  ['daily open', 'باز شدن روزانه'],
  ['weekly open', 'باز شدن هفتگی'],
  ['monthly open', 'باز شدن ماهانه'],
  ['previous week', 'هفته گذشته'],
  ['previous day', 'روز گذشته'],
  ['previous high', 'سقف قبلی'],
  ['previous low', 'کف قبلی'],
  ['old high', 'سقف قدیمی'],
  ['old low', 'کف قدیمی'],
  ['all time high', 'بالاترین سقف تاریخی'],
  ['session high', 'سقف سشن'],
  ['session low', 'کف سشن'],
  ['asian session', 'سشن آسیا'],
  ['london session', 'سشن لندن'],
  ['new york session', 'سشن نیویورک'],
  ['london open', 'باز شدن لندن'],
  ['new york open', 'باز شدن نیویورک'],
  ['est time', 'به وقت نیویورک'],

  // --- trade management ---
  ['stop loss', 'حد ضرر'],
  ['stop losses', 'حد ضررها'],
  ['take profit', 'حد سود'],
  ['take profits', 'حد سود'],
  ['risk reward', 'ریسک به ریوارد'],
  ['risk management', 'مدیریت ریسک'],
  ['money management', 'مدیریت سرمایه'],
  ['position size', 'حجم پوزیشن'],
  ['break even', 'نقطه سر به سر'],
  ['breakeven', 'نقطه سر به سر'],
  ['partial close', 'بستن بخشی'],
  ['take partials', 'برداشت بخشی از سود'],
  ['scale in', 'ورود پله‌ای'],
  ['scale out', 'خروج پله‌ای'],
  ['add position', 'افزایش پوزیشن'],
  ['close position', 'بستن پوزیشن'],
  ['open position', 'باز کردن پوزیشن'],
  ['buy position', 'پوزیشن خرید'],
  ['sell position', 'پوزیشن فروش'],
  ['long position', 'پوزیشن خرید'],
  ['short position', 'پوزیشن فروش'],
  ['holding position', 'نگه‌داشتن پوزیشن'],
  ['entry', 'ورود'],
  ['entries', 'ورودها'],
  ['exit', 'خروج'],
  ['target', 'هدف'],
  ['targets', 'اهداف'],
  ['trade plan', 'پلن معاملاتی'],
  ['trading plan', 'پلن معاملاتی'],
  ['my plan', 'پلن من'],
  ['setup', 'ستاپ'],
  ['setups', 'ستاپ‌ها'],
  ['confirmation', 'تأیید'],
  ['confluence', 'هم‌گرایی'],
  ['invalidated', 'باطل شد'],
  ['invalid', 'باطل'],
  ['valid', 'معتبر'],
  ['stop out', 'خروج با حد ضرر'],
  ['stopped out', 'با حد ضرر خارج شدم'],
  ['took profit', 'سود گرفتم'],
  ['profit', 'سود'],
  ['profits', 'سودها'],
  ['loss', 'ضرر'],
  ['losses', 'ضررها'],
  ['win', 'برد'],
  ['lose', 'باخت'],
  ['risk', 'ریسک'],
  ['reward', 'پاداش'],
  ['trade', 'معامله'],
  ['trades', 'معاملات'],
  ['trader', 'معامله‌گر'],
  ['traders', 'معامله‌گران'],
  ['trading', 'معامله‌گری'],
  ['account', 'حساب'],
  ['balance', 'بالانس'],
  ['equity', 'اکوییتی'],
  ['drawdown', 'دراودان'],
  ['leverage', 'لوریج'],
  ['lot', 'لات'],
  ['lots', 'لات'],
  ['pips', 'پیپ'],
  ['pip', 'پیپ'],
  ['spread', 'اسپرد'],

  // --- chart furniture (classification keeps these as chrome, but inside a
  // longer caption they still need Persian, so the values are translated) ---
  ['scale', 'مقیاس'],
  ['realtime', 'بلادرنگ'],
  ['real time', 'بلادرنگ'],
  ['history', 'تاریخچه'],
  ['chart', 'نمودار'],
  ['candle', 'کندل'],
  ['candles', 'کندل‌ها'],
  ['wick', 'سایه'],
  ['body', 'بدنه'],
  ['close', 'بسته شدن'],
  ['closing', 'بسته شدن'],
  ['open', 'باز شدن'],
  ['opening', 'باز شدن'],
  ['high', 'سقف'],
  ['low', 'کف'],
  ['range', 'محدوده'],
  ['box', 'باکس'],
  ['zone', 'ناحیه'],
  ['level', 'سطح'],
  ['line', 'خط'],
  ['trend line', 'خط روند'],
  ['arrow', 'فلش'],
  ['note', 'یادداشت'],
  ['notes', 'یادداشت‌ها'],
  ['blue', 'آبی'],
  ['red', 'قرمز'],
  ['green', 'سبز'],
  ['yellow', 'زرد'],
  ['white', 'سفید'],
  ['black', 'مشکی'],
  ['orange', 'نارنجی'],
  ['purple', 'بنفش'],
  ['grey', 'خاکستری'],
  ['gray', 'خاکستری'],
  ['dashed', 'خط‌چین'],
  ['solid', 'ممتد'],

  // --- everyday journal phrasing ---
  ['good morning', 'صبح بخیر'],
  ['good evening', 'عصر بخیر'],
  ['good luck', 'موفق باشید'],
  ['well done', 'خوب انجام شد'],
  ['thank you', 'ممنون'],
  ['thanks', 'ممنون'],
  ['hello', 'سلام'],
  ['hey guys', 'سلام دوستان'],
  ['let me know', 'خبرم کنید'],
  ['of course', 'البته'],
  ['for now', 'فعلاً'],
  ['for example', 'برای نمونه'],
  ['as you can see', 'همان‌طور که می‌بینید'],
  ['last week', 'هفته گذشته'],
  ['next week', 'هفته آینده'],
  ['this week', 'این هفته'],
  ['this month', 'این ماه'],
  ['last month', 'ماه گذشته'],
  ['today', 'امروز'],
  ['yesterday', 'دیروز'],
  ['tomorrow', 'فردا'],
  ['every day', 'هر روز'],
  ['every week', 'هر هفته'],
  ['at the moment', 'در این لحظه'],
  ['right now', 'همین حالا'],
  ['so far', 'تا اینجا'],
  ['as always', 'مثل همیشه'],
  ['of the day', 'امروز'],
  ['in the future', 'در آینده'],
  ['from the past', 'از گذشته'],
  ['look at', 'نگاه کنید به'],
  ['looks like', 'به نظر می‌رسد'],
  ['wait for', 'منتظرِ'],
  ['waiting for', 'در انتظارِ'],
  ['i think', 'به نظرم'],
  ['i believe', 'باور دارم'],
  ['i see', 'می‌بینم'],
  ['i will', 'خواهم'],
  ['i am', 'من هستم'],
  ['i have', 'دارم'],
  ['we need', 'باید'],
  ['we will', 'خواهیم'],
  ['let us', 'بیایید'],
  ['this is', 'این است'],
  ['it is', 'است'],
  ['there is', 'وجود دارد'],
  ['is it', 'آیا'],
  ['price reacted', 'قیمت واکنش داد'],
  ['reacted to', 'واکنش داد به'],
  ['going to', 'قصد دارم'],
  ['want to', 'می‌خوام'],
  ['need to', 'باید'],
  ['have to', 'مجبورم'],
  ['a lot of', 'بسیاری از'],
  ['a bit', 'کمی'],
  ['once again', 'دوباره'],
  ['by the way', 'راستی'],
  ['such as', 'مانند'],
  ['instead of', 'به جای'],
  ['because of', 'به دلیل'],
  ['in my opinion', 'به نظر من'],
  ['in this case', 'در این حالت'],
  ['at least', 'دست‌کم'],
  ['more than', 'بیشتر از'],
  ['less than', 'کمتر از'],
];

/* ------------------------------------------------------------------ *
 * Single words. Labels are usually these plus a symbol and a timeframe.
 * ------------------------------------------------------------------ */
const WORDS = {
  // action / state
  buy: 'خرید', bought: 'خرید', buying: 'خرید', sell: 'فروش', sold: 'فروش',
  selling: 'فروش', long: 'خرید', short: 'فروش', hold: 'نگه‌داشتن',
  holdin: 'نگه‌داشتن', holding: 'نگه‌داشتن', wait: 'صبر', waiting: 'در انتظار',
  waitin: 'در انتظار', entry: 'ورود', exit: 'خروج', add: 'افزودن', added: 'افزوده شد',
  close: 'بسته شد', closed: 'بسته شد', opened: 'باز شد',
  move: 'حرکت', moves: 'حرکات', moving: 'در حرکت', went: 'رفت', goes: 'می‌رود',
  take: 'گرفتن', took: 'گرفتم', taking: 'گرفتن', hit: 'برخورد', hits: 'برخورد',
  touch: 'لمس', touched: 'لمس شد', tap: 'لمس', tapped: 'لمس شد',
  reject: 'رد شدن', rejected: 'رد شد', rejection: 'رد شدن', accept: 'پذیرش',
  grab: 'شکار', grabbed: 'شکار شد', sweep: 'جارو', swept: 'جارو شد',
  hunt: 'شکار', fill: 'پر شدن', filled: 'پر شد', mitigate: 'تعدیل',
  taping: 'لمس کردن', test: 'تست', tested: 'تست شد',
  break: 'شکست', broke: 'شکست', broken: 'شکسته', bounce: 'بازگشت',
  bounced: 'بازگشت کرد', retest: 'ریتست', reclaim: 'بازپس‌گیری',
  target: 'هدف', targets: 'اهداف', stop: 'استاپ', stops: 'استاپ‌ها',
  protect: 'حفاظت', shift: 'تغییر', shifted: 'تغییر کرد', turn: 'چرخش',
  turned: 'چرخید', pause: 'توقف', start: 'شروع', started: 'شروع شد',

  // price / structure
  price: 'قیمت', prices: 'قیمت‌ها', chart: 'نمودار', charts: 'نمودارها',
  area: 'ناحیه', areas: 'نواحی', zone: 'ناحیه', zones: 'نواحی',
  level: 'سطح', levels: 'سطوح', range: 'محدوده', ranges: 'محدوده‌ها',
  high: 'سقف', highs: 'سقف‌ها', low: 'کف', lows: 'کف‌ها',
  top: 'سقف', bottom: 'کف', side: 'سمت', sides: 'سمت‌ها',
  order: 'سفارش', orders: 'سفارش‌ها', supply: 'عرضه', demand: 'تقاضا',
  liquidity: 'نقدینگی', imbalance: 'عدم تعادل', gap: 'شکاف', gaps: 'شکاف‌ها',
  void: 'خلأ', pool: 'مجموعه', structure: 'ساختار', trend: 'روند',
  trendline: 'خط روند', line: 'خط', lines: 'خطوط', box: 'باکس', boxes: 'باکس‌ها',
  candle: 'کندل', candles: 'کندل‌ها', wick: 'سایه', body: 'بدنه',
  valley: 'دره', peak: 'قله', middle: 'میانه', mid: 'میانه',
  origin: 'مبدأ', source: 'منبع', direction: 'جهت', bias: 'سوگیری',
  momentum: 'مومنتوم', volume: 'حجم', session: 'سشن', open: 'باز شدن',

  // supply & demand adjectives
  clean: 'تمیز', cleanest: 'تمیزترین', true: 'واقعی', false: 'کاذب',
  fresh: 'تازه', untouched: 'دست‌نخورده', mitigated: 'تعدیل‌شده',
  strong: 'قوی', weak: 'ضعیف', major: 'اصلی', minor: 'فرعی',
  bullish: 'صعودی', bearish: 'نزولی', neutral: 'خنثی', valid: 'معتبر',
  fake: 'جعلی', real: 'واقعی', key: 'کلیدی', old: 'قدیمی', new: 'جدید',
  equal: 'برابر', previous: 'قبلی', next: 'بعدی', last: 'آخرین',

  // trade management
  trade: 'معامله', trades: 'معاملات', position: 'پوزیشن', positions: 'پوزیشن‌ها',
  risk: 'ریسک', reward: 'ریوارد', profit: 'سود', loss: 'ضرر',
  pip: 'پیپ', pips: 'پیپ', point: 'نقطه', points: 'نقطه', percent: 'درصد',
  half: 'نیم', quarter: 'یک‌چهارم', partial: 'بخشی', full: 'کامل',
  breakeven: 'سر به سر', invalidation: 'ابطال', confirmed: 'تأییدشده',

  // time
  time: 'زمان', times: 'بار', day: 'روز', days: 'روزها', week: 'هفته',
  weeks: 'هفته‌ها', month: 'ماه', months: 'ماه‌ها', year: 'سال', years: 'سال‌ها',
  hour: 'ساعت', hours: 'ساعت', minute: 'دقیقه', minutes: 'دقیقه',
  daily: 'روزانه', weekly: 'هفتگی', monthly: 'ماهانه', yearly: 'سالانه',
  now: 'حالا', then: 'سپس', today: 'امروز', soon: 'به‌زودی', later: 'بعدتر',
  morning: 'صبح', evening: 'عصر', night: 'شب', london: 'لندن', asia: 'آسیا',
  york: 'نیویورک',

  // connectors / small words
  and: 'و', or: 'یا', but: 'اما', so: 'پس', if: 'اگر', when: 'وقتی',
  then: 'سپس', than: 'از', because: 'چون', also: 'همچنین', again: 'دوباره',
  still: 'هنوز', maybe: 'شاید', only: 'فقط', very: 'خیلی', more: 'بیشتر',
  less: 'کمتر', all: 'همه', both: 'هر دو', other: 'دیگر', another: 'دیگری',
  this: 'این', that: 'آن', these: 'این‌ها', those: 'آن‌ها', here: 'اینجا',
  there: 'آنجا', above: 'بالای', below: 'پایینِ', under: 'زیرِ', over: 'روی',
  into: 'به داخل', from: 'از', with: 'با', without: 'بدون', about: 'درباره',
  before: 'قبل از', after: 'پس از', between: 'بین', during: 'در طول',
  until: 'تا', while: 'در حالی که', just: 'فقط', even: 'حتی', well: 'خوب',
  limit: 'لیمیت', till: 'تا', way: 'مسیر', plan: 'پلن', planning: 'برنامه‌ریزی',
  weekend: 'آخر هفته', monday: 'دوشنبه', friday: 'جمعه', tomorrow: 'فردا',
  market: 'بازار', markets: 'بازارها', swing: 'سوئینگ', scalp: 'اسکالپ',
  hedge: 'هج', bias: 'سوگیری', narrative: 'روایت', idea: 'ایده',
  analysis: 'تحلیل', review: 'مرور', journal: 'ژورنال', journaling: 'ژورنال‌نویسی',
  lesson: 'درس', mistake: 'اشتباه', mistakes: 'اشتباه‌ها', rule: 'قاعده',
  rules: 'قواعد', discipline: 'نظم', emotion: 'احساس', fear: 'ترس', greedy: 'طمع',
  comparison: 'مقایسه', probability: 'احتمال', edge: 'مزیت', strategy: 'استراتژی',
  chapter: 'فصل', question: 'سؤال', questions: 'سؤال‌ها', answer: 'پاسخ',
  nothing: 'هیچ', loading: 'بارگذاری', error: 'خطا', menu: 'منو', doubt: 'شک',
  pure: 'خالص', massive: 'عظیم', million: 'میلیون', millions: 'میلیون‌ها',
  billion: 'میلیارد', reload: 'بارگذاری', pocket: 'جیب', pockets: 'جیب‌ها',
  elite: 'نخبه', beginner: 'تازه‌کار', professional: 'حرفه‌ای', novice: 'تازه‌کار',
  diagram: 'نمودار', diagrams: 'نمودارها', image: 'تصویر', images: 'تصویرها',
  picture: 'تصویر', picture_: 'تصویر', draw: 'رسم کردن', drawn: 'رسم‌شده',
  identif: 'شناسایی', identify: 'شناسایی', learning: 'یادگیری', learn: 'یاد گرفتن',
  understand: 'فهمیدن', understanding: 'درک', explained: 'توضیح داده شد',
  explain: 'توضیح دادن', hope: 'امیدوارم', wish: 'آرزو', sorry: 'متأسفم',
  remind: 'یادآوری', believe: 'باور', disagree: 'مخالفم', agree: 'موافقم',
  share: 'به اشتراک گذاشتن', posted: 'منتشر شد', post: 'پست', posts: 'پست‌ها',
  thread: 'تاپیک', comment: 'نظر', comments: 'نظرات', reply: 'پاسخ',
  welcome: 'خوش آمدید', please: 'لطفاً', really: 'واقعاً', actually: 'در واقع',
  almost: 'تقریباً', already: 'قبلاً', always: 'همیشه', never: 'هرگز',
  often: 'اغلب', sometimes: 'گاهی', usually: 'معمولاً', finally: 'در نهایت',
  good: 'خوب', bad: 'بد', nice: 'خوب', best: 'بهترین', better: 'بهتر',
  big: 'بزرگ', small: 'کوچک', little: 'کمی', huge: 'بزرگ', ok: 'باشه',
  yes: 'بله', no: 'نه', not: 'نه', dont: 'نکن', do: 'انجام بده', did: 'انجام شد',
  can: 'می‌توان', could: 'می‌شد', will: 'خواهد', would: 'می‌خواست',
  should: 'باید', must: 'باید', need: 'نیاز', want: 'می‌خواهم',
  think: 'فکر می‌کنم', know: 'می‌دانم', see: 'می‌بینم', seen: 'دیده',
  look: 'نگاه', looking: 'در حال نگاه', looks: 'به نظر می‌رسد',
  let: 'بگذار', get: 'گرفتن', got: 'گرفتم', make: 'ساختن', made: 'ساخته شد',
  keep: 'نگه‌داشتن', kept: 'نگه داشته شد', stay: 'ماندن', stayed: 'ماند',
  comes: 'می‌آید', come: 'بیا', came: 'آمد', going: 'در حال رفتن',
  give: 'دادن', gave: 'داد', put: 'قرار دادن', pay: 'پرداخت', went: 'رفت',
  am: 'هستم', is: 'است', are: 'هستند', was: 'بود', were: 'بودند',
  be: 'باشد', been: 'بوده', have: 'دارم', has: 'دارد', had: 'داشت',
  mine: 'مال من', my: 'من', me: 'من', we: 'ما', our: 'ما', you: 'شما',
  your: 'شما', they: 'آن‌ها', their: 'آن‌ها', it: 'آن', its: 'آن',
  he: 'او', she: 'او', his: 'او', her: 'او', us: 'ما', them: 'آن‌ها',
  i: 'من', a: '', an: '', the: '', of: '', to: 'به', in: 'در', on: 'روی',
  engulf: 'اینگالف', engulfed: 'اینگالف شد', engulfing: 'اینگالف',
  at: 'در', for: 'برای', as: 'به‌عنوان', up: 'بالا', down: 'پایین',
  out: 'بیرون', off: 'خاموش', back: 'بازگشت', away: 'دور', through: 'از میان',
  any: 'هر', some: 'برخی', no: 'نه', own: 'خود',
};

/* ------------------------------------------------------------------ *
 * Chart chrome: symbol / timeframe / dates / numeric furniture. These
 * never need Persian, and translating them is what produced the old
 * "سلت 430" / "مقیاس ۱۰۰٪" noise.
 * ------------------------------------------------------------------ */
const CHROME_WORDS = new Set([
  'm1', 'm5', 'm15', 'm30', 'h1', 'h2', 'h4', 'h8', 'h12', 'd1', 'w1', 'mn',
  'mn1', '1m', '5m', '15m', '30m', '1h', '2h', '4h', '8h', '12h', '1d', '1w',
  'tf', 'tfs', 'scale', 'realtime', 'real-time', 'history', 'fxcm', 'mt4',
  'mt5', 'tradingview', 'forex', 'broker', 'session', 'candle', 'app',
  'chart', 'window', 'zoom', 'cell', 'col', 'row', 'px', 'pips', 'date',
  'time', 'open', 'close', 'high', 'low', 'o', 'h', 'l', 'c', 'vol',
  'spread', 'bar', 'bars', 'tick', 'ticks', 'sil', 'next', 'prev', 'oanda',
]);

/*
 * Words that carry no domain meaning. They do not stop a line from being
 * classified as OCR noise, because a single "area" must not turn
 * "ur area hergzr" into prose.
 */
const GENERIC = new Set([
  'area', 'areas', 'thing', 'things', 'way', 'kind', 'sort', 'here', 'there',
  'now', 'then', 'ok', 'yes', 'good', 'bad', 'nice', 'sure', 'well', 'just',
  'only', 'also', 'more', 'less', 'some', 'any', 'other', 'back', 'part',
  'mean', 'means', 'place', 'stuff', 'today', 'time', 'long', 'short',
]);

/* Month abbreviations – kept verbatim, never localised. */
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'sept', 'oct', 'nov', 'dec'];

/* ------------------------------------------------------------------ *
 * Machine-translation post-editing. Only unambiguous, well-known
 * mistranslations are rewritten; the point is consistency of domain
 * terms, not stylistic rewriting.
 * ------------------------------------------------------------------ */
const MT_FIXES = [
  [/\bتایم\s*فریم\b/g, 'تایم‌فریم'],
  [/\bتایمفریم\b/g, 'تایم‌فریم'],
  [/\bاستاپ\s*لاس\b/g, 'حد ضرر'],
  [/\bاستاپلاس\b/g, 'حد ضرر'],
  [/\bتیک\s*پرافیت\b/g, 'حد سود'],
  [/\bتیك\s*پرافیت\b/g, 'حد سود'],
  [/\bبریک\s*ایون\b/g, 'نقطه سر به سر'],
  [/\bپول\s*بک\b/g, 'پولبک'],
  [/\bپول\s*باک\b/g, 'پولبک'],
  [/\bکندل\s*استیک\b/g, 'کندل'],
  [/\bکندلستیک\b/g, 'کندل'],
  [/\bپرایس\s*اکشن\b/g, 'پرایس اکشن'],
  [/\bاکشن\s*قیمت\b/g, 'پرایس اکشن'],
  [/\bعمل\s*قیمت\b/g, 'پرایس اکشن'],
  [/\bناحیه\s*عرضه\s*و\s*تقاضا\b/g, 'ناحیه عرضه و تقاضا'],
  [/\bبلوک\s*سفارش\b/g, 'بلاک سفارش'],
  [/\bتریدرها\b/g, 'معامله‌گران'],
  [/\bتریدر\b/g, 'معامله‌گر'],
  [/\bتریدینگ\b/g, 'معامله‌گری'],
  [/\bترید\b/g, 'معامله'],
  [/\bلانگ\b/g, 'خرید'],
  [/\bشورت\b/g, 'فروش'],
  [/\bاسکالپینگ\b/g, 'اسکالپ'],
  [/\bحد ضرر\s*ی\b/g, 'حد ضرر'],
  [/\bشکار\s*استاپ\b/g, 'شکار حد ضرر'],
  [/\bمایع\b/g, 'نقدینگی'],
  [/\bسرمایه\s*گذاری\b/g, 'سرمایه‌گذاری'],
  [/\bصعود\s*کننده\b/g, 'صعودی'],
  [/\bنزول\s*کننده\b/g, 'نزولی'],
  [/\bفرو\s+ریز(?:ها)?\b/g, 'خرد'],
  [/\bآپشن(?:ها)?\b/g, 'اختیار معامله'],
  [/\bاندیکاتور(?:ها)?\b/g, 'اندیکاتور'],
  [/\bچهار\s?F\b/g, 'FOF'],
  [/\bF\s+TR\b/g, 'FTR'],
  [/\bF\s+LS\b/g, 'FLS'],
  [/\bF\s+TB\b/g, 'FTB'],
  [/\biQM\b/g, 'QM'],
  [/\bجریان\s+سفارش\s+رایگان\b/g, 'جریان سفارش آزاد'],
  [/\bنظم\s+آزاد\b/g, 'جریان سفارش آزاد'],
  // "journal" is the forum word for a trader's thread, not a paper notebook
  // or a newspaper. "دفترچه" was the single most common wrong term in the
  // corpus (over 500 posts), so it is corrected everywhere.
  [/\bدفترچه(?:های)?\b/g, 'ژورنال'],
  [/\bروزنامه(?:های)?\b/g, 'ژورنال'],
  [/\bژورنال\s+ها\b/g, 'ژورنال‌ها'],
  // "trader/institutional trader" – keep one wording for the whole archive.
  [/\bتاجران\s+نهادی\b/g, 'معامله‌گران سازمانی'],
  [/\bتاجر\s+نهادی\b/g, 'معامله‌گر سازمانی'],
  [/\bتاجران\b/g, 'معامله‌گران'],
  [/\bتاجر\b/g, 'معامله‌گر'],
  // Short selling is a position, not a duration.
  [/\bفروش\s+کوتاه\s*مدت\b/g, 'پوزیشن فروش'],
  [/\bفروشنده\s+کوتاه\b/g, 'فروشنده'],
];

/* Phrases that mean the machine got confused – they never belong here. */
const HALLUCINATION = /(?:دانلود|زیرنویس|موسیقی متن|آهنگ|فیلم|سریال|تماشا|اینستاگرام|تلگرام)/;
const HALLUCINATION_SOURCE = /download|subtitle|soundtrack|song|music|film|movie|series|episode|watch|view|instagram|telegram/i;

/* ------------------------------------------------------------------ *
 * The report vocabulary. Single source of truth: _build/report-labels.js
 * ------------------------------------------------------------------ */

const REPORT = require('./report-labels.js');
const { compileFixes } = require('./fa-boundary.js');

// Existing entries win: the archive already reads "ضرر" for a loss, and one
// wording across 63k lines beats a better wording introduced halfway through.
for (const [en, fa] of Object.entries(REPORT.WORDS)) {
  if (WORDS[en] === undefined) WORDS[en] = fa;
}
// Report labels go to the front so they beat any shorter generic phrase.
for (let i = REPORT.PHRASES.length - 1; i >= 0; i--) {
  PHRASES.unshift(REPORT.PHRASES[i]);
}
for (const fix of REPORT.FIXES) MT_FIXES.push(fix);

/*
 * `\b` in JavaScript ignores Persian letters, so every Persian rule written
 * above is dead as authored. Compile the tables once at load so the rules
 * people keep adding to the source stay readable and still fire.
 */
for (let i = 0; i < MT_FIXES.length; i++) MT_FIXES[i] = compileFixes([MT_FIXES[i]])[0];
const REPAIR = compileFixes(REPORT.REPAIR);

/** Undo the OCR damage that stopped a label matching the dictionary. */
function repairOcr(text) {
  let s = String(text || '');
  for (const [re, rep] of REPAIR) s = s.replace(re, rep);
  return s;
}

/* ------------------------------------------------------------------ *
 * Classification helpers
 * ------------------------------------------------------------------ */

const ALPHA_RE = /[A-Za-z]/;
const WORD_RE = /[A-Za-z][A-Za-z'’]*/g;

function cleanText(value) {
  return String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
}

function words(text) {
  const out = [];
  const src = cleanText(text);
  let m;
  WORD_RE.lastIndex = 0;
  while ((m = WORD_RE.exec(src)) !== null) out.push(m[0]);
  return out;
}

function tokenCount(text) {
  return words(text).length;
}

/** Symbol-like token: EU, EURUSD, USD/CAD, USDCAD, XAUUSD, M15, H4. */
function isSymbolToken(token) {
  const t = token.replace(/[^A-Za-z0-9]/g, '');
  if (!t) return false;
  if (/^(?:M|H|D|W)\d+$/.test(t)) return true;                   // M15, H4, D1
  if (/^\d+(?:M|H|D|W)$/.test(t)) return true;                   // 15M, 4H
  if (/^[A-Z]{2,4}$/.test(token)) return true;                   // FL, HTF, MPL, ORFL
  if (/^[A-Z]{1,4}\d{1,2}$/.test(token)) return true;            // FL2, TG1, H4
  if (/^[A-Z]{3}\/[A-Z]{3}$/.test(token)) return true;          // GBP/JPY
  if (/^[A-Z]{6}$/.test(token)) return true;                     // EURUSD, USDCAD
  return false;
}

/** Date-ish token: 11dec'16, 3 Jan 2017, 04:00, 2017. */
function isDateTimeToken(token) {
  if (/^\d{1,2}:\d{2}(?::\d{2})?$/.test(token)) return true;
  if (/^\d{1,2}[a-z]{3,9}'?\d{0,4}$/i.test(token)) return true;
  if (MONTHS.includes(token.slice(0, 3).toLowerCase()) && token.length >= 3) return true;
  return false;
}

/** Does this text contain any English prose at all? */
function hasProse(text) {
  const list = words(text);
  if (!list.length) return false;
  return list.some(w => {
    const k = w.toLowerCase();
    if (CHROME_WORDS.has(k)) return false;
    if (isSymbolToken(w) && !WORDS[k]) return false;
    return Object.prototype.hasOwnProperty.call(WORDS, k) && WORDS[k].length > 3;
  });
}

/**
 * Chart furniture and nothing else: a symbol plus a timeframe plus numbers.
 * These lines are already readable for a trader, so the site shows them
 * unchanged with a "no translation needed" tag instead of fake Persian.
 */
function isChrome(text) {
  const src = cleanText(text);
  if (!ALPHA_RE.test(src)) return true;                       // pure numbers/symbols
  const list = words(src);
  if (!list.length) return true;
  let unknown = 0;
  let hasDomain = false;
  for (const w of list) {
    const k = w.toLowerCase();
    if (w.length === 1) continue;                                // OCR truncation: "S Jan"
    if (CHROME_WORDS.has(k) || isSymbolToken(w) || isDateTimeToken(w)) continue;
    if (WORDS[k] !== undefined) {
      if (WORDS[k].length > 2) hasDomain = true;   // "hold", "price", "supply"
      continue;
    }
    unknown++;
  }
  if (hasDomain) return false;
  // Unreadable chart furniture: one stray token is still just a label.
  return unknown <= Math.max(1, Math.floor(list.length / 4));
}

/**
 * Text that is not English at all – OCR noise such as "ur area hergzr".
 * The signal is a high share of tokens that are neither known words, nor
 * symbols, nor numbers.
 */
function isNoise(text) {
  const src = cleanText(text);
  const list = words(src);
  if (list.length < 2) return false;
  let unknown = 0;
  for (const w of list) {
    const k = w.toLowerCase();
    if (w.length === 1) continue;
    if (WORDS[k] !== undefined) continue;
    if (CHROME_WORDS.has(k) || isSymbolToken(w) || isDateTimeToken(w)) continue;
    unknown++;
  }
  const ratio = unknown / list.length;
  if (list.length <= 2) return ratio === 1;
  if (unknown < 2 || ratio < 0.5) return false;
  // One real trading word is enough to treat the line as meaningful text.
  const hasDomainWord = list.some(w => {
    const k = w.toLowerCase();
    if (GENERIC.has(k)) return false;
    return WORDS[k] !== undefined && WORDS[k].length > 2;
  });
  return !hasDomainWord;
}

/** How much of the text the lexicon can actually explain. */
function coverage(text) {
  const list = words(text);
  if (!list.length) return 1;
  let hit = 0;
  for (const w of list) {
    const k = w.toLowerCase();
    if (WORDS[k] !== undefined || CHROME_WORDS.has(k) || isSymbolToken(w) || isDateTimeToken(w)) hit++;
  }
  return hit / list.length;
}

/* ------------------------------------------------------------------ *
 * Dictionary translation (labels)
 * ------------------------------------------------------------------ */

const PHRASE_INDEX = (() => {
  const index = new Map();
  for (const [en, fa] of PHRASES) {
    const key = cleanText(en).toLowerCase();
    if (!key || index.has(key)) continue;
    index.set(key, fa);
  }
  return index;
})();

const PHRASE_KEYS = Array.from(PHRASE_INDEX.keys()).sort((a, b) => b.length - a.length);

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Word-by-word translation for short labels.
 * Returns { fa, hits, misses } – misses are left in Latin script on purpose,
 * because "FL" must stay "FL".
 */
function dictionaryTranslate(text) {
  let s = ' ' + cleanText(repairOcr(text)) + ' ';
  const hits = [];
  // Longest phrases first so "clean order" never becomes "تمیز سفارش".
  for (const key of PHRASE_KEYS) {
    const re = new RegExp('(?<![A-Za-z])' + escapeRe(key) + '(?![A-Za-z])', 'gi');
    if (!re.test(s)) continue;
    const fa = PHRASE_INDEX.get(key);
    s = s.replace(re, () => {
      hits.push(key);
      return '\u0001' + fa + '\u0002';
    });
  }
  const misses = [];
  s = s.replace(/[A-Za-z][A-Za-z'’0-9]*/g, (w) => {
    const k = w.toLowerCase();
    if (WORDS[k] !== undefined) {
      hits.push(k);
      const fa = WORDS[k];
      return fa ? '\u0001' + fa + '\u0002' : '';
    }
    if (CHROME_WORDS.has(k) || isSymbolToken(w) || isDateTimeToken(w)) return '\u0001' + w + '\u0002';
    misses.push(w);
    return '\u0001' + w + '\u0002';
  });
  let out = s
    .replace(/\u0001/g, '')
    .replace(/\u0002/g, ' ');
  // Latin commas left between Persian words read as noise: use the Persian
  // comma whenever the text around them is Persian.
  if (/[\u0600-\u06FF]/.test(out)) out = out.replace(/([\u0600-\u06FF])\s*,\s*/g, '$1، ');
  out = out
    .replace(/[ \t]{2,}/g, ' ')
    // Persian heads the noun: "QM level" is "سطح QM", never "qm سطح".
    .replace(/(?:^|\s)([A-Za-z][A-Za-z0-9]*)\s+سطح(?=[\s،,.!؟:;)]|$)/g, ' سطح $1')
    .replace(/\s+([،,.!؟:;)）\]])/g, '$1')
    .replace(/([(（])\s+/g, '$1')
    .replace(/([،,.!؟:;]){2,}/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return { fa: out, hits, misses };
}

/** Post-edit a machine translation: terminology, artefacts, spacing. */
function postEdit(persian, english) {
  let s = cleanText(persian);
  if (!s) return '';
  for (const [re, rep] of MT_FIXES) s = s.replace(re, rep);
  // Persian digits belong to the source numbers; the policy writes Latin ones.
  s = s.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
       .replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
  // ZWNJ hygiene: no double ZWNJ, never after a space.
  s = s.replace(/\u200c{2,}/g, '\u200c').replace(/ \u200c/g, ' ').trim();
  // Placeholders that survived as bare bracketed digits are never content.
  s = s.replace(/\(\s*\d{1,2}\s*\)/g, ' ').replace(/[ \t]{2,}/g, ' ').trim();
  return s;
}

/* Persian function words – a repeated pair of these means nothing. */
const FA_STOP = new Set([
  'و', 'در', 'به', 'از', 'که', 'این', 'آن', 'را', 'با', 'برای', 'است', 'می',
  'های', 'یا', 'هم', 'تا', 'بر', 'اگر', 'وقتی', 'هر', 'یک', 'اما', 'پس',
  'شود', 'شد', 'کرد', 'کند', 'دارد', 'نیز', 'بود', 'هست', 'خود', 'شما', 'من',
]);

/**
 * A machine translation that says the same thing twice is broken, even when
 * the words are not identical ("... تغییر در زمان در تغییر در زمان ...").
 * Detect it on content bigrams, not on exact tokens.
 */
function repeatedPhrase(persian) {
  // A repeated two-word pair is ordinary Persian ("چارت خیلی …" twice). The
  // machine artefact repeats a whole three-word clause, so key on trigrams and
  // ignore punctuation-only tokens (a post of dotted lines is not an echo).
  const toks = String(persian || '').split(/\s+/)
    .filter(t => t.length >= 3 && !FA_STOP.has(t) && /[\p{L}\p{N}]/u.test(t));
  const seen = new Set();
  for (let i = 0; i + 2 < toks.length; i++) {
    const key = toks[i] + ' ' + toks[i + 1] + ' ' + toks[i + 2];
    if (seen.has(key)) return key;
    seen.add(key);
  }
  return '';
}

/** Cheap, explicit quality signals used by the bake step and the tests. */
function audit(persian, english) {
  const fa = cleanText(persian);
  const en = cleanText(english);
  const issues = [];
  if (!fa) issues.push('empty');
  if (fa && en && fa === en) issues.push('untranslated');
  if (fa && !/[\u0600-\u06FF]/.test(fa)) issues.push('no-persian');
  // «تماشا/دانلود/…» is MT padding only when the source never says
  // watch/download; a post that really talks about watching a level is fine.
  if (fa && HALLUCINATION.test(fa) && !HALLUCINATION_SOURCE.test(en)) issues.push('hallucination');
  if (fa && /[۰-۹٠-٩]/.test(fa)) issues.push('persian-digits');
  // Back-to-back BBCode tags ([/quote][/quote]) are furniture, not placeholders.
  if (fa && /[<>\[\]{}]{2,}/.test(fa.replace(/\[\/?[a-z][a-z0-9]*(?:=[^\]]*)?\]/gi, ' '))) issues.push('placeholder');
  if (fa && /\\[a-z]{2,}|displaystyle/.test(fa)) issues.push('latex');
  if (fa && en && fa.length > Math.max(90, en.length * 3.2)) issues.push('rambling');
  // Punctuation-only lines (a post of dotted rules) are not repeated words.
  const doubled = fa.match(/(?:^|\s)(\S*[\p{L}\p{N}]\S*)(?:\s+\1){2,}(?=\s|$)/u);
  if (doubled) issues.push('repetition');
  if (fa && fa.length < 400 && repeatedPhrase(fa)) issues.push('echo');
  const enWords = words(en);
  const faLen = fa.length;
  if (enWords.length >= 3 && faLen < 3) issues.push('truncated');
  // Machine output that still carries ordinary English words ("بازی Reload,
  // Great") is not a translation; acronyms, tickers and dates are exempt.
  // Long texts mix in English on purpose (quotes, names), so this only
  // guards short chart lines.
  if (fa && fa.length < 200) {
    // A Latin word the English itself uses is a name, ticker, URL fragment or
    // BBCode tag being preserved on purpose; only words absent from the source
    // are leftover machine English.
    const left = (fa.match(/[A-Za-z]{3,}/g) || [])
      .filter(w => !/^[A-Z]{2,}$/.test(w) && !isSymbolToken(w) && !/^(?:ok|OK|Ok)$/.test(w) && !MONTHS.includes(w.slice(0, 3).toLowerCase()))
      .filter(w => !en.toLowerCase().includes(w.toLowerCase()));
    if (left.length >= 2) issues.push('english-left');
  }
  // English welded onto a Persian word ("در این بخش decisionخواهم…") is
  // always model damage, at any length.
  if (fa) {
    const welded = (fa.match(/[\u0621-\u064A\u067E\u0686\u0698\u06A9\u06AF\u06CC][A-Za-z]{3,}|[A-Za-z]{3,}[\u0621-\u064A\u067E\u0686\u0698\u06A9\u06AF\u06CC]/g) || [])
      .filter(s => !/^(?:EURUSD|USD|EUR|GBP|JPY|AUD|CAD|CHF|XAU)/i.test(s.replace(/^[\u0621-\u064A\u067E\u0686\u0698\u06A9\u06AF\u06CC]/, '')));
    // A short chart line is judged strictly. A long post mixes names, quotes
    // and tickers on purpose, so one accidental weld must not throw the whole
    // translation away – it would still be far better than no Persian at all.
    const weldLimit = fa.length >= 400 ? 3 : 2;
    if (welded.length >= weldLimit) issues.push('latin-junk');
  }
  return issues;
}

module.exports = {
  PHRASES,
  WORDS,
  CHROME_WORDS,
  MT_FIXES,
  HALLUCINATION,
  MONTHS,
  cleanText,
  words,
  tokenCount,
  isSymbolToken,
  isDateTimeToken,
  hasProse,
  isChrome,
  isNoise,
  coverage,
  dictionaryTranslate,
  repairOcr,
  postEdit,
  audit,
  repeatedPhrase,
  PHRASE_INDEX,
};
