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

async function tr(text, t) {
  const body = new URLSearchParams({ fromLang: 'en', to: 'fa', text, token: t.token, key: t.key });
  const res = await fetch(`https://www.bing.com/ttranslatev3?isVertical=1&&IG=${t.ig}&IID=${t.iid}`, {
    method: 'POST',
    headers: {
      'user-agent': UA,
      'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
      referer: 'https://www.bing.com/translator',
    },
    body,
  });
  const txt = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status} ${txt.slice(0, 200)}`);
  return JSON.parse(txt).translations[0].text;
}

const texts = [
  'The market is going up and down today.',
  'I bought 500 shares of AAPL at 182.50',
  'Price broke above resistance at 1.2345',
  'Watch the 4 hour chart for a breakout',
  'This flag holds price up',
  'TG hit. If not, it is just a non-event.',
  'EURUSD is forming a fair value gap on the H1 chart',
  'SL 1.2300 TP 1.2450 RR 2',
  '29 Sep 10:24',
  'Good morning everyone',
];

(async () => {
  const t = await getToken();
  for (const [name, sep] of [
    ['newline', '\n'],
    ['at', '\n@@@\n'],
    ['bar', '\n|||\n'],
    ['tag', '\n<SEP>\n'],
    ['num', '\n[#]\n'],
  ]) {
    const out = await tr(texts.join(sep), t);
    const parts = out.split(sep.trim() ? new RegExp(sep.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g') : /\n/);
    console.log(`\n=== ${name} === in ${texts.length} out ${parts.length}`);
    console.log(JSON.stringify(out).slice(0, 500));
  }
})();
