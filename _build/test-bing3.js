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
(async () => {
  const t = await getToken();
  console.log('token', t.ig, t.iid, t.key, t.token && t.token.slice(0,8));
  const body = new URLSearchParams({ fromLang:'en', to:'fa', text:'Hello world. The market is going up.', token:t.token, key:t.key });
  const res = await fetch(`https://www.bing.com/ttranslatev3?isVertical=1&&IG=${t.ig}&IID=${t.iid}`, { method:'POST', headers:{'user-agent':UA,'content-type':'application/x-www-form-urlencoded;charset=UTF-8',referer:'https://www.bing.com/translator'}, body });
  console.log('status', res.status, 'type', res.headers.get('content-type'));
  console.log((await res.text()).slice(0,1200));
})();
