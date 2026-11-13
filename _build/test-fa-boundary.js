/* Test the Persian boundary converter: every case the fix tables rely on. */
const { convertBoundary, withBoundary } = require('./fa-boundary.js');

let pass = 0, fail = 0;
function t(name, re, input, expect) {
  const fixed = withBoundary(re);
  const got = input.replace(fixed, '«$&»');
  const ok = got === expect;
  if (ok) pass++; else fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
  if (!ok) {
    console.log(`      src   ${re.source}  ->  ${fixed.source}`);
    console.log(`      want  ${expect}`);
    console.log(`      got   ${got}`);
  }
}

// left boundary before a Persian stem
t('left-only', /\bترید/, 'بازار ترید است', 'بازار «ترید» است');
// right boundary after a Persian stem: preceded by a space, followed by a space
t('both', /\bترید\b/g, 'یک ترید دو ترید', 'یک «ترید» دو «ترید»');
// must not fire inside a longer Persian word
t('no-inside', /\bترید\b/g, 'آتریدب تریدد', 'آتریدب تریدد');
// a bare stem is strict: it does not swallow a suffix glued to it
t('ezafe-plural-needs-own-rule', /\bتریدر\b/g, 'تریدرهای این بازار', 'تریدرهای این بازار');
// ... which is why the tables write the plural out
t('plural-alternation', /\bتریدر(?:های|ها)?\b/g, 'تریدرها و تریدرهای بزرگ', '«تریدرها» و «تریدرهای» بزرگ');
// a plain plural is left to its own longer rule
t('plural-not-swallowed', /\bتریدر\b/g, 'تریدرها', 'تریدرها');
// \s between compound halves also accepts ZWNJ
t('space-class', /\bاستاپ\s*لاس\b/g, 'استاپ لاس و استاپ‌لاس', '«استاپ لاس» و «استاپ‌لاس»');
// optional group before the trailing boundary
t('optional-group', /\bفرو\s+ریز(?:ها)?\b/g, 'فرو ریز و ریزش‌ها', '«فرو ریز» و ریزش‌ها');
t('optional-group-with-plural', /\bاندیکاتور(?:ها)?\b/g, 'اندیکاتورها و اندیکاتور', '«اندیکاتورها» و «اندیکاتور»');
// ASCII-only rules keep their native \b
t('ascii-kept', /\bF\s+TR\b/g, 'the F TR level', 'the «F TR» level');
t('ascii-inside-kept', /\biQM\b/g, 'xiQMy iQM', 'xiQMy «iQM»');
// mixed: Persian stem then Latin letter
t('mixed-tail', /\bچهار\s?F\b/g, 'چهار F بود', '«چهار F» بود');
t('mixed-tail-no-fire', /\bچهار\s?F\b/g, 'چهار FF بود', 'چهار FF بود');
// Arabic-script kaf/ya variants
t('arabic-kaf', /[کك]لمه/g, 'كلمه و کلمه', '«كلمه» و «کلمه»');
// a Persian stem glued to a Latin letter is a longer token, not this word
t('letter-glued-blocks', /\bسطح\b/g, 'سطح ۲ و بالاسطح', '«سطح» ۲ و بالاسطح');

// converter itself: untouched patterns must round-trip
const same = /\btotal\s+net\b/i;
console.log(convertBoundary(same.source) === same.source ? 'PASS  ascii source unchanged' : 'FAIL  ascii source unchanged');
