# -*- coding: utf-8 -*-
import json, glob, re, os, sys

J = ['michal238','omidfx','vitaldrug','benhur','homeoffinisher','linos','mukhcin','aran','edges','mel']
issues = []

def paras(t):
    return [p for p in re.split(r'\n\s*\n', t.strip()) if p.strip()]

numre = re.compile(r'\d+(?:\.\d+)?')
fa = re.compile(r'[\u0600-\u06FF]')

def check(j, wf, bf):
    if not os.path.exists(bf):
        issues.append((j, bf, '-', 'NO BATCH'))
        return
    w = json.load(open(wf, encoding='utf-8'))
    b = json.load(open(bf, encoding='utf-8'))
    wh = {x['hash'] for x in w}
    if set(b) != wh:
        issues.append((j, bf, '-', 'HASHSET missing=%s extra=%s' % (wh - set(b), set(b) - wh)))
    for x in w:
        t = b.get(x['hash'])
        if t is None:
            continue
        tag = x['id']
        ep = paras(x['text']); fp = paras(t)
        if len(ep) != len(fp):
            issues.append((j, bf, tag, 'PARA %d!=%d' % (len(ep), len(fp))))
        ew = len(re.findall(r'wrote:', x['text']))
        fw = len(re.findall(r'نوشت:', t))
        if ew != fw:
            issues.append((j, bf, tag, 'WROTE %d!=%d' % (ew, fw)))
        ennums = numre.findall(x['text'])
        missing = [n for n in ennums if n not in t]
        if missing:
            issues.append((j, bf, tag, 'NUMMISS %s' % (missing[:10],)))
        if re.search(r'[۰-۹]', t):
            issues.append((j, bf, tag, 'FA_DIGITS'))
        # leftover English prose: long latin runs that aren't allowed tokens
        # flag posts where translation has >=4 words of >=4 latin letters forming a sentence-like run
        lat_words = re.findall(r"[A-Za-z][A-Za-z'\-]{3,}", t)
        en_words = re.findall(r"[A-Za-z][A-Za-z'\-]{3,}", x['text'])
        # crude: translation contains 4+ latin words that also appear in EN and aren't names/tickers — too noisy; instead count latin words excluding allowlist
        allow = set('''rtm pa fl flr cp cpaz pcp qm sf mpl dbd ftr fo tt po hs ls mm its flag poles paz caps sl tp engulf htf ltf
usd eur gbp jpy aud nzd cad chf btc eth xau xag oil brent wti nas spy qqq dow dax ftse nikkei nasdaq forex pip pips
fed cpi nfp ecb boj boe rba snb pboc ism pmi gdp ppi jolts claims durables vix mt4 mt5 ctrader tradingview metatrader api
ema sma rsi macd atr adx cci obv vwap bollinger keltner ichimoku fib fibonacci gartley harmonic elliott wyckoff reit etf
ndq rty iwm dia uup tlt gld slv uso ung lqd hyg tl xlf xlk xle xlv xly xlp xlu xlc xbi xrt smh soxx ark arkq ibit fbti coin
eth btc sol doge xrp ada dot link avax matic solana ripple cardano polkadot chainlink avalanche uniswap aave maker dydx comp uni
sushi pancakes ape sand mana axie illuvium theta algo vet hbar icp fil near apt sui sei tao render injective ghost crust mantra
fartcoin popcat pengu miela cats dogs bonk wif floki trump melania official pepecoin pepe baby doge shiba inu dogecoin litecoin
bitcoin ethereum ripple cardano solana dogecoin tron avalanche polygon polkadot chainlink near protocol aptos sui sei near internet
'''.split())
        # simpler: flag any translation paragraph containing >=5 consecutive latin words
        seqs = re.findall(r"(?:[A-Za-z][A-Za-z'\-]{1,}\s+){4,}[A-Za-z][A-Za-z'\-]{1,}", t)
        if seqs:
            issues.append((j, bf, tag, 'LATSEQ %r' % seqs[0][:80]))

for j in J:
    for wf in sorted(glob.glob('work/%s-p*.json' % j),
                     key=lambda x: int(re.search(r'p(\d+)', x).group(1))):
        bf = wf.replace('work' + os.sep, 'batches' + os.sep).replace('/work/', '/batches/')
        check(j, wf, bf)

json.dump(issues, open('_review_flags.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
from collections import Counter
c = Counter(i[3].split()[0] for i in issues)
print(c)
print(len(issues), 'flags')
