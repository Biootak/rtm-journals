const fs = require('fs');
const path = require('path');
const lex = require(path.resolve(__dirname, '..', 'lexicon.js'));
const policy = require(path.resolve(__dirname, '..', 'translation-policy.js'));

const fixes = {
 'hs-p7': {
  '8c25d404c95d4141f06265b67d374f538e1f193c': [
   {find:'بعد از فقط CP با L، LL', repl:'دوباره فقط CP با L، LL'}
  ]
 },
 'hs-p8': {
  '07dcfecf7b6c02845f069f9c4ca9610afcd887f5': [
   {find:'گرفتنِ حرکت قیمت را دوست دارم!', repl:'گرفتنِ حرکت قیمت، علاقهٔ من است!'}
  ],
  'a8775906945f66e143905fac677bdee17807b2e9': [
   {find:'گرفتنِ حرکت قیمت را دوست دارم!', repl:'گرفتنِ حرکت قیمت، علاقهٔ من است!'}
  ]
 },
 'hs-p16': {
  '8fec4146d244e35184f05255d0aae443a0bb46f5': [
   {find:'کسی دیگر هم این را نقطهٔ مناسبی برای لانگ می‌بیند؟', repl:'کسی دیگر هم این را جای خوبی برای لانگ می‌بیند؟'}
  ]
 },
 'hs-p75': {
  '2b30b8ea9ac13a188f8fc5d16eb74c5357fe3ee6': [
   {find:'آیا آن تارگت نرسیده بود؟', repl:'آیا آن تارگت برآورده نشده بود؟'}
  ]
 },
 'hs-p81': {
  '374a07e8f940dcf226b0456d9591507025f56703': [
   {find:'اطلاعات بیشتری در سمت چپ نشان می‌دهد', repl:'اطلاعات بیشتری در سمت چپ دیده می‌شود'}
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
    const w = wByHash[hash];
    for (const op of ops) {
      if (!v.includes(op.find)) { problems.push(page + ' ' + hash + ' FIND-MISS ' + op.find.slice(0, 40)); continue; }
      v = v.split(op.find).join(op.repl);
    }
    const cm = policy.cleanMachine(v, w.text);
    const clean = lex.cleanText(cm);
    const bg = lex.repeatedPhrase(clean);
    if (clean.length < 400 && bg) problems.push(page + ' ' + hash + ' STILL-ECHO "' + bg + '"');
    batch[hash] = v;
    changed++;
  }
  fs.writeFileSync(bp, JSON.stringify(batch, null, 1) + '\n');
}
console.log('changed:', changed);
for (const p of problems) console.log('PROBLEM:', p);
