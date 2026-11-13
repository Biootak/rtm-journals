// auto-fix3.js — safe domain-term cleanup for supplydemand flagged values.
// Domain terms only; no function words, no verbs, no handles.
const fs = require('fs');
const path = require('path');
const dir = __dirname;
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const R = (t, a, b) => t.replace(new RegExp('\\b' + esc(a) + '\\b', 'g'), b);
const RI = (t, a, b) => t.replace(new RegExp('\\b' + esc(a) + '\\b', 'gi'), b);

const MAP = [
  // phrases first
  ['flag limit', 'FL'], ['Flag Limit', 'FL'], ['break even', 'سر به سر'], ['Break Even', 'سر به سر'],
  ['pin bar', 'پین‌بار'], ['Pin Bar', 'پین‌بار'], ['screen time', 'زمان روی صفحه'],
  ['supply and demand', 'عرضه و تقاضا'], ['Supply and Demand', 'عرضه و تقاضا'],
  ['supply & demand', 'عرضه و تقاضا'], ['supply/demand', 'عرضه/تقاضا'], ['sup/dem', 'عرضه/تقاضا'],
  ['support and resistance', 'حمایت و مقاومت'], ['Support and Resistance', 'حمایت و مقاومت'],
  ['big boys', 'بزرگ‌ها'], ['Big Boys', 'بزرگ‌ها'], ['trade call', 'ندای معامله'], ['trade calls', 'ندای‌های معامله'],
  ['position trading', 'معامله‌گری پوزیشنی'], ['outside bar', 'کندل بیرونی'], ['Outside Bar', 'کندل بیرونی'],
  ['mid line', 'خط میانی'], ['swing lows', 'کف‌های سوئینگ'], ['swing low', 'کف سوئینگ'],
  ['swing highs', 'سقف‌های سوئینگ'], ['swing high', 'سقف سوئینگ'],
  ['img size', 'اندازهٔ تصویر'], ['image size', 'اندازهٔ تصویر'], ['RTM chat room', 'اتاق چت RTM'],
  ['London ICE', 'ICE لندن'], ['WTI Crude Oil', 'نفت خام WTI'], ['crude oil', 'نفت خام'], ['Crude Oil', 'نفت خام'],
  ['of the day discussion', 'بحث روز'], ['FX Majors', 'جفت‌های اصلی'], ['thread QM', 'ترد QM'],
  ['data feed', 'فید داده'], ['take profit', 'برداشت سود'], ['Take Profit', 'برداشت سود'],
  ['stop loss', 'استاپ‌لاس'], ['Stop Loss', 'استاپ‌لاس'], ['trend lines', 'خطوط روند'], ['trend line', 'خط روند'],
  ['time frames', 'تایم‌فریم‌ها'], ['time frame', 'تایم‌فریم'], ['order flow', 'جریان سفارش'],
  ['smart money', 'پول هوشمند'], ['new york', 'نیویورک'], ['New York', 'نیویورک'],
  ['shooting star', 'ستارهٔ ثاقب'], ['price action', 'حرکت قیمت'], ['past price action', 'حرکت قیمت گذشته'],
  ['supply zone', 'ناحیهٔ عرضه'], ['demand zone', 'ناحیهٔ تقاضا'], ['news release', 'انتشار خبر'],
  ['head and shoulders', 'سر و شانه'], ['rising wedge', 'گوهٔ صعودی'], ['wax on wax off', 'موم روی موم خاموش'],
  ['shake out', 'شیک‌اوت'], ['shakeout', 'شیک‌اوت'], ['brag start', 'شروع آسان'], ['zoom out', 'بزرگ‌نمایی خروج'],
  ['zoomed out', 'بزرگ‌نمایی خروج'], ['micro structure', 'ریزساختار'], ['wide range bodies', 'بدنه‌های رنج پهن'],
  ['wide range body', 'بدنهٔ رنج پهن'], ['PA Watch', 'پایش PA'], ['pm gmt', 'ساعت بعدازظهر گرینویچ'],
  ['yen crosses', 'کراس‌های ین'], ['execution', 'اجرا'], ['futures', 'قراردادهای آتی'], ['tp', 'تارگت'],
  ['action', 'اقدام'], ['break', 'شکست'], ['study', 'مطالعه'], ['screens', 'صفحه‌ها'],
  ['brag end', 'پایان آسان'], ['stop out', 'استاپ‌اوت'], ['Extended Range', 'رنج گسترده'],
  ['close over', 'بسته شدن بالای'], ['same stuff here', 'همان چیزها اینجا'], ['First Time', 'اولین بار'],
  ['mid range', 'میان‌رنج'], ['to Return', 'برای بازگشت'], ['to return', 'برای بازگشت'],
  ['PA confirm', 'تأیید PA'], ['higher high', 'سقف بالاتر'], ['lower low', 'کف پایین‌تر'],
  ['New Structure High', 'سقف ساختار جدید'], ['FX street', 'وال‌استریت FX'], ['DBR which is now missing', 'DBR که الان نیست'],
  ['Did anyone catch this at 1', 'کسی این را در 1 گرفت'], ['pm gmt', 'ساعت بعدازظهر گرینویچ'],
  ['Stops', 'استاپ‌ها'], ['Stop', 'استاپ'], ['Limits', 'لیمیت‌ها'], ['limit', 'لیمیت'], ['bar', 'کندل'],
  ['wedge', 'گوه'], ['obvious', 'آشکار'], ['add', 'اضافه'], ['Also', 'همچنین'], ['forums', 'فروم‌ها'],
  ['images', 'تصاویر'], ['image', 'تصویر'],
  // single words
  ['supply', 'عرضه'], ['supplies', 'عرضه‌ها'], ['demand', 'تقاضا'], ['demands', 'تقاضا‌ها'.replace('_','')],
  ['flag', 'پرچم'], ['flags', 'پرچم‌ها'], ['Flag', 'پرچم'], ['Flags', 'پرچم‌ها'],
  ['pennant', 'پیرامید'], ['pennants', 'پیرامیدها'], ['fakeout', 'فیک‌اوت'], ['fake', 'فیک'],
  ['source', 'مبدأ'], ['sources', 'مبدأها'],
  ['sell', 'فروش'], ['sells', 'فروش‌ها'], ['selling', 'فروش'], ['seller', 'فروشنده'], ['sellers', 'فروشندگان'],
  ['buy', 'خرید'], ['buys', 'خریدها'], ['buying', 'خرید'], ['buyer', 'خریدار'], ['buyers', 'خریداران'],
  ['image', 'تصویر'], ['images', 'تصاویر'], ['size', 'اندازه'], ['session', 'سشن'], ['sessions', 'سشن‌ها'],
  ['momentum', 'مومنتوم'], ['Momentum', 'مومنتوم'], ['community', 'جامعه'], ['Community', 'جامعه'],
  ['confirmation', 'تأییدیه'], ['edge', 'لبه'], ['Edge', 'لبه'], ['resistance', 'مقاومت'], ['Resistance', 'مقاومت'],
  ['approach', 'رویکرد'], ['approaches', 'رویکردها'], ['reject', 'رد'], ['rejects', 'رد'], ['rejection', 'ریجکشن'],
  ['master', 'استاد'], ['Master', 'استاد'], ['trader', 'تریدر'], ['traders', 'تریدرها'], ['Trader', 'تریدر'],
  ['trading', 'معامله‌گری'], ['trade', 'معامله'], ['trades', 'معامله‌ها'], ['traded', 'معامله کرد'],
  ['setup', 'ستاپ'], ['setups', 'ستاپ‌ها'], ['Setup', 'ستاپ'], ['Setups', 'ستاپ‌ها'],
  ['pattern', 'الگو'], ['patterns', 'الگوها'], ['chart', 'چارت'], ['charts', 'چارت‌ها'], ['Chart', 'چارت'],
  ['candle', 'کندل'], ['candles', 'کندل‌ها'], ['Candle', 'کندل'], ['Candles', 'کندل‌ها'],
  ['engulf', 'اینگالف'], ['engulfing', 'اینگالف'], ['engulfs', 'اینگالف‌ها'], ['Engulf', 'اینگالف'], ['Engulfing', 'اینگالف'],
  ['wick', 'فیتیله'], ['wicks', 'فیتیله‌ها'], ['trendline', 'خط روند'], ['trendlines', 'خطوط روند'],
  ['timeframe', 'تایم‌فریم'], ['timeframes', 'تایم‌فریم‌ها'], ['level', 'سطح'], ['levels', 'سطح‌ها'], ['Level', 'سطح'],
  ['zone', 'ناحیه'], ['zones', 'ناحیه‌ها'], ['Zone', 'ناحیه'], ['Zones', 'ناحیه‌ها'],
  ['area', 'ناحیه'], ['areas', 'نواحی'], ['order', 'سفارش'], ['orders', 'سفارش‌ها'], ['Order', 'سفارش'],
  ['position', 'پوزیشن'], ['positions', 'پوزیشن‌ها'], ['profit', 'سود'], ['profits', 'سودها'], ['Profit', 'سود'],
  ['loss', 'ضرر'], ['losses', 'ضررها'], ['risk', 'ریسک'], ['Risk', 'ریسک'], ['reward', 'پاداش'], ['Reward', 'پاداش'],
  ['support', 'حمایت'], ['Support', 'حمایت'], ['pivot', 'پیوت'], ['pivots', 'پیوت‌ها'], ['Pivot', 'پیوت'],
  ['daily', 'روزانه'], ['Daily', 'روزانه'], ['weekly', 'هفتگی'], ['Weekly', 'هفتگی'], ['monthly', 'ماهانه'],
  ['bull', 'گاو'], ['bulls', 'گاوها'], ['bear', 'خرس'], ['bears', 'خرس‌ها'], ['bullish', 'صعودی'], ['bearish', 'نزولی'],
  ['market', 'بازار'], ['markets', 'بازارها'], ['price', 'قیمت'], ['prices', 'قیمت‌ها'], ['Price', 'قیمت'],
  ['liquidity', 'نقدینگی'], ['volatility', 'نوسان'], ['correlation', 'همبستگی'], ['correlations', 'همبستگی‌ها'],
  ['confluence', 'تطابق'], ['divergence', 'واگرایی'], ['reversal', 'برگشتی'], ['breakout', 'شکست'],
  ['pullback', 'پول‌بک'], ['pullbacks', 'پول‌بک‌ها'], ['retest', 'ریتست'], ['retests', 'ریتست‌ها'],
  ['consolidation', 'تثبیت'], ['correction', 'اصلاح'], ['retracement', 'بازپس‌گیری'], ['impulse', 'ضربه'],
  ['account', 'حساب'], ['accounts', 'حساب‌ها'], ['balance', 'موجودی'], ['margin', 'مارجین'], ['leverage', 'اهرم'],
  ['spread', 'اسپرد'], ['swap', 'سواپ'], ['broker', 'بروکر'], ['brokers', 'بروکرها'], ['feed', 'فید'], ['feeds', 'فیدها'],
  ['platform', 'پلتفرم'], ['update', 'آپدیت'], ['updates', 'آپدیت‌ها'], ['thread', 'ترد'], ['threads', 'تردها'],
  ['post', 'پست'], ['posts', 'پست‌ها'], ['reply', 'پاسخ'], ['replies', 'پاسخ‌ها'], ['comment', 'نظر'], ['comments', 'نظرها'],
  ['forum', 'فروم'], ['room', 'روم'], ['rooms', 'روم‌ها'], ['chat', 'چت'], ['member', 'عضو'], ['members', 'عضوها'],
  ['analysis', 'تحلیل'], ['analyses', 'تحلیل‌ها'], ['analyze', 'تحلیل'], ['analysed', 'تحلیل شد'], ['studies', 'مطالعه‌ها'],
  ['signal', 'سیگنال'], ['signals', 'سیگنال‌ها'], ['strategy', 'استراتژی'], ['strategies', 'استراتژی‌ها'],
  ['method', 'روش'], ['methods', 'روش‌ها'], ['lesson', 'درس'], ['lessons', 'درس‌ها'],
  ['video', 'ویدئو'], ['videos', 'ویدئوها'], ['picture', 'تصویر'], ['pictures', 'تصاویر'], ['photo', 'عکس'], ['photos', 'عکس‌ها'],
  ['screenshot', 'عکس از صفحه'], ['example', 'مثال'], ['examples', 'مثال‌ها'], ['question', 'سؤال'], ['questions', 'سؤال‌ها'],
  ['answer', 'جواب'], ['answers', 'جواب‌ها'], ['beginner', 'تازه‌کار'], ['beginners', 'تازه‌کارها'], ['expert', 'متخصص'], ['experts', 'متخصص‌ها'],
  ['indicator', 'ایندیکاتور'], ['indicators', 'ایندیکاتورها'], ['hedge', 'پوشش'], ['hedges', 'پوشش‌ها'],
  ['scalp', 'اسکلپ'], ['scalping', 'اسکلپ کردن'], ['scalper', 'اسکالپر'], ['scalpers', 'اسکالپرها'],
  ['swing', 'سوئینگ'], ['swings', 'سوئینگ‌ها'], ['flip', 'فلیپ'], ['flips', 'فلیپ‌ها'],
  ['decision', 'تصمیم'], ['decisions', 'تصمیم‌ها'], ['pair', 'جفت'], ['pairs', 'جفت‌ها'], ['Pair', 'جفت'],
  ['index', 'ایندکس'], ['indices', 'ایندکس‌ها'], ['currency', 'ارز'], ['currencies', 'ارزها'],
  ['forex', 'فارکس'], ['Forex', 'فارکس'], ['euro', 'یورو'], ['Euro', 'یورو'], ['dollar', 'دلار'], ['Dollar', 'دلار'],
  ['gold', 'طلا'], ['Gold', 'طلا'], ['silver', 'نقره'], ['Silver', 'نقره'], ['oil', 'نفت'], ['Oil', 'نفت'],
  ['pip', 'پیپ'], ['pips', 'پیپ‌ها'], ['entry', 'ورود'], ['entries', 'ورودها'],
  ['exit', 'خروج'], ['exits', 'خروج‌ها'], ['shorts', 'شورت‌ها'], ['hammer', 'چکش'], ['doji', 'دوجی'],
  ['pole', 'پول'], ['poles', 'پول‌ها'], ['news', 'اخبار'], ['calendar', 'تقویم'], ['london', 'لندن'], ['London', 'لندن'],
  ['asia', 'آسیا'], ['pound', 'پوند'], ['yen', 'ین'], ['crude', 'نفت'], ['emini', 'امینی'], ['commodity', 'کالا'],
  ['commodities', 'کالاها'], ['mentor', 'راهنما'], ['majors', 'اصلی‌ها'], ['lurker', 'کمین‌کننده'], ['lurkers', 'کمین‌کنندگان'],
  ['homework', 'تمرین'], ['classroom', 'کلاس'], ['webinar', 'وبینار'], ['article', 'مقاله'], ['articles', 'مقالات'],
  ['website', 'وب‌سایت'], ['link', 'لینک'], ['links', 'لینک‌ها'], ['download', 'دانلود'], ['upload', 'آپلود'],
  ['file', 'فایل'], ['files', 'فایل‌ها'], ['folder', 'پوشه'], ['screen', 'صفحه'], ['resolution', 'رزولوشن'],
  ['monitor', 'مانیتور'], ['laptop', 'لپ‌تاپ'], ['desktop', 'دسکتاپ'], ['profile', 'پروفایل'],
  ['signature', 'امضا'], ['nickname', 'نام مستعار'], ['admin', 'مدیر'], ['moderator', 'ناظر'], ['guest', 'مهمان'],
  ['idea', 'ایده'], ['ideas', 'ایده‌ها'], ['view', 'دیدگاه'], ['views', 'دیدگاه‌ها'], ['opinion', 'نظر'],
  ['feedback', 'بازخورد'], ['note', 'نکته'], ['notes', 'نکته‌ها'], ['point', 'نکته'], ['points', 'نکته‌ها'],
  ['detail', 'جزئیات'], ['step', 'قدم'], ['steps', 'قدم‌ها'], ['result', 'نتیجه'], ['results', 'نتیجه‌ها'],
  ['reason', 'دلیل'], ['reasons', 'دلایل'], ['factor', 'عامل'], ['factors', 'عوامل'], ['feature', 'ویژگی'],
  ['features', 'ویژگی‌ها'], ['aspect', 'جنبه'], ['issue', 'مسئله'], ['issues', 'مسئله‌ها'], ['error', 'خطا'],
  ['errors', 'خطاها'], ['mistake', 'اشتباه'], ['mistakes', 'اشتباه‌ها'], ['success', 'موفقیت'], ['failure', 'شکست'],
  ['win', 'برد'], ['wins', 'بردها'], ['winner', 'برنده'], ['loser', 'بازنده'], ['losers', 'بازنده‌ها'],
  ['goal', 'هدف'], ['goals', 'هدف‌ها'], ['target', 'تارگت'], ['targets', 'تارگت‌ها'], ['rule', 'قانون'],
  ['rules', 'قوانین'], ['plan', 'برنامه'], ['plans', 'برنامه‌ها'], ['system', 'سیستم'], ['systems', 'سیستم‌ها'],
  ['tool', 'ابزار'], ['tools', 'ابزارها'], ['Aussie', 'AUD'], ['aussie', 'AUD'], ['Loonie', 'دلار کانادا'], ['loonie', 'دلار کانادا'],
  ['Kiwi', 'NZD'], ['kiwi', 'NZD'], ['nzd', 'NZD'], ['Nzd', 'NZD'], ['swissy', 'CHF'], ['Bund', 'بوند'], ['bund', 'بوند'],
];

const URL_RE = /(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/\S*)?/gi;
const SENS = [['Long', 'لانگ']];
function fixValue(v) {
  const urls = [];
  let s = v.replace(URL_RE, m => { urls.push(m); return '\u0000' + (urls.length - 1) + '\u0000'; });
  for (const [a, b] of MAP) s = RI(s, a, b);
  for (const [a, b] of SENS) s = R(s, a, b);
  s = s.replace(/\u0000(\d+)\u0000/g, (_, i) => urls[+i]);
  return s;
}

const report = JSON.parse(fs.readFileSync(path.join(dir, 'untranslated-report.json'), 'utf8'));
const byFile = {};
for (const r of report) {
  if (!/^(supplydemand|quasimodo)-p\d+\.json$/.test(r.file) || !r.hash) continue;
  (byFile[r.file] = byFile[r.file] || []).push(r.hash);
}
let total = 0, changed = 0;
for (const [file, hashes] of Object.entries(byFile)) {
  const fp = path.join(dir, 'batches', file);
  let obj;
  try { obj = JSON.parse(fs.readFileSync(fp, 'utf8')); } catch (e) { continue; }
  const set = new Set(hashes);
  let dirty = false;
  for (const h of set) {
    if (!(h in obj) || typeof obj[h] !== 'string') continue;
    total++;
    const nv = fixValue(obj[h]);
    if (nv !== obj[h]) { obj[h] = nv; dirty = true; changed++; }
  }
  if (dirty) fs.writeFileSync(fp, JSON.stringify(obj, null, 1).replace(/\n/g, '\r\n'), 'utf8');
}
console.log('processed', total, 'changed', changed);
