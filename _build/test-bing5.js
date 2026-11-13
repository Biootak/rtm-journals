const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
async function getToken() { const res=await fetch('https://www.bing.com/translator',{headers:{'user-agent':UA}}); const html=await res.text(); return {ig:(html.match(/IG:"([^"]+)"/)||[])[1],iid:(html.match(/data-iid="([^"]+)"/)||[])[1],key:(html.match(/params_AbusePreventionHelper\s*=\s*\[\s*(\d+)/)||[])[1],token:(html.match(/params_AbusePreventionHelper\s*=\s*\[\s*\d+\s*,\s*"([^"]+)"/)||[])[1]}; }
async function tr(text,t){ const body=new URLSearchParams({fromLang:'en',to:'fa',text,token:t.token,key:t.key}); const res=await fetch(`https://www.bing.com/ttranslatev3?isVertical=1&&IG=${t.ig}&IID=${t.iid}`,{method:'POST',headers:{'user-agent':UA,'content-type':'application/x-www-form-urlencoded;charset=UTF-8',referer:'https://www.bing.com/translator'},body}); const txt=await res.text(); try{return JSON.parse(txt);}catch(e){return {raw:txt,status:res.status};} }
(async()=>{
  const t=await getToken();
  const texts=[
    'I bought <0> shares of <1> at <2> and sold at <3>',
    'Price broke above <0> and retested the <0> zone',
    'Watch <0> and <1> for a reaction at <2>',
    'SL <0> TP <1> RR <2> on <3>',
    'This is a <0> in the <1>',
    'EURUSD is forming a <0> on the <1> chart',
    '<0> hit. If not, it is just a <1>.',
    '29 Sep 10:24',
    'The daily candle closed above <0>',
    'This flag holds price up',
  ];
  const j=await tr(texts.join('\n'),t);
  const out=j.translations && j.translations[0] && j.translations[0].text;
  console.log('lines', texts.length, out ? out.split('\n').length : 'NONE');
  console.log(out || JSON.stringify(j).slice(0,500));
  console.log('---RAW---');
  console.log(JSON.stringify(out));
})();
