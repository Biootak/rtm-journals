const fs = require('fs');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

async function getToken() {
  const res = await fetch('https://www.bing.com/translator', { headers: { 'user-agent': UA } });
  const html = await res.text();
  const ig = (html.match(/IG:"([^"]+)"/) || [])[1];
  const iid = (html.match(/data-iid="([^"]+)"/) || [])[1];
  const m = html.match(/params_AbusePreventionHelper\s*=\s*\[\s*(\d+)\s*,\s*"([^"]+)"/);
  return { ig, iid, key: m && m[1], token: m && m[2] };
}

async function translate(text, t) {
  const body = new URLSearchParams({
    fromLang: 'en', to: 'fa', text, token: t.token, key: t.key,
  });
  const url = `https://www.bing.com/ttranslatev3?isVertical=1&&IG=${t.ig}&IID=${t.iid}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'user-agent': UA,
      'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
      referer: 'https://www.bing.com/translator',
    },
    body,
  });
  const txt = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status} ${txt.slice(0, 300)}`);
  return JSON.parse(txt);
}

(async () => {
  const all = JSON.parse(fs.readFileSync('E:/Trade/journals/_build/sample1000.json', 'utf8'));
  const texts = all.slice(0, 30);
  const t = await getToken();
  console.log('token', t.ig, t.iid, t.key, t.token.slice(0, 8));
  const joined = texts.join('\n');
  const started = Date.now();
  const j = await translate(joined, t);
  console.log('json', JSON.stringify(j).slice(0, 800));
  if (!j.translations) process.exit(1);
  const out = j.translations[0].text;
  const parts = out.split('\n');
  console.log('ms', Date.now() - started, 'lines in/out', texts.length, parts.length, 'chars', joined.length);
  for (let i = 0; i < Math.min(12, texts.length); i++) {
    console.log('EN:', texts[i]);
    console.log('FA:', parts[i] || '(missing)');
  }
  fs.writeFileSync('E:/Trade/journals/_build/bing-sample-out.json', JSON.stringify({ texts, out, parts }, null, 2));
})();
