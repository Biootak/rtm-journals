const fs = require('fs');
const path = require('path');
const ROOT = 'E:/Trade/journals';
const EXPERT = path.join(ROOT, '_build', 'expert');

const REPS = {
  'if-p110': [
    ['فقط 2 مشت بانک بزرگ', 'فقط چند بانک بزرگ'],
    ['مستقیم به عرضه شوت می‌کند', 'مستقیم درون عرضه اسپایک می‌کند'],
    ['شوت ناگهانی قیمت به بالا', 'اسپایک ناگهانی قیمت به بالا'],
    ['شوت‌های بزرگ', 'اسپایک‌های بزرگ'],
    ['از شوت به سمت عرضه حرف می‌زنیم', 'از اسپایک به سمت عرضه حرف می‌زنیم'],
    ['میلهٔ حرکت خبر بزرگ', 'پایهٔ حرکت خبر بزرگ'],
    ['Diamond می‌سازند', 'الماس می‌سازند'],
    ['صنعت بیماری است که در آن کار می‌کنیم', 'صنعتی است که در آن کار می‌کنیم و فاسد است'],
  ],
  'if-p111': [
    ['کل پرچم را بگردی', 'کل فلگ را بگردی'],
    ['داخل میله', 'داخل پایه'],
    ['Diamond شکل می‌گیرد', 'الماس شکل می‌گیرد'],
  ],
  'if-p112': [
    ['فروش بی‌رحمانه', 'فروش وحشیانه'],
  ],
  'if-p114': [
    ['jou… drew-s-journey', 'jou...drew-s-journey'],
    ['پرچم', 'فلگ'],
    ['مواد RTM', 'محتوای RTM'],
    ['مواد ما را ارزان', 'محتوای ما را ارزان'],
  ],
  'if-p115': [
    ['پرچم', 'فلگ'],
    ['Diamond', 'الماس'],
    ['مواد موجود در RTM', 'محتوای RTM'],
  ],
  'if-p116': [
    ['پرچم', 'فلگ'],
    ['اگر میله از لبهٔ پایینی FL A مستقیم رد شده باشد', 'اگر پایه از لبهٔ پایینی FL A مستقیم رد شده باشد'],
    ['منظورت از کدام «میله» است؟', 'منظورت از کدام «پایه» است؟'],
  ],
  'if-p117': [
    ['پرچم بعدی', 'فلگ بعدی'],
    ['به کلافی از کادرهای هم‌پوشان تبدیل می‌شود', 'به درهم‌تنیدگی کادرهای هم‌پوشان تبدیل می‌شود'],
  ],
};

for (const [page, reps] of Object.entries(REPS)) {
  const w = JSON.parse(fs.readFileSync(path.join(EXPERT, 'work', page + '.json'), 'utf8'));
  const b = JSON.parse(fs.readFileSync(path.join(EXPERT, 'batches', page + '.json'), 'utf8'));
  let out = '';
  const changed = [];
  for (const p of w) {
    let fa = b[p.hash], o = fa;
    for (const [a, c] of reps) fa = fa.split(a).join(c);
    if (fa !== o) { out += '### ' + p.id + '\n' + fa + '\n\n'; changed.push(p.id); }
  }
  const fp = path.join(EXPERT, 'redraft', page + '-fix.txt');
  fs.writeFileSync(fp, out, 'utf8');
  console.log(page + ': ' + changed.length + ' posts -> ' + changed.join(', '));
}
