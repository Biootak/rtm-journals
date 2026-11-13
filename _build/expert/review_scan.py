import json, glob, re, os, sys

# Auto-check batches vs work files. Usage: python _build/expert/review_scan.py
ALLOWED_LATIN = set('''SL TP PA FL FLR CP CPAZ PCP QM SF MPL DBD FTR FO TT PO HS LS MM ITs FLAG POLES PAZ CAPS ENGULF HTF LTF R RR RRR pips pip tick ticks stop loss take profit trader trading trade market price entry exit buy sell long short high low open close range trend support resistance demand supply zone level line break retest order limit pending position risk reward ratio lot lots volume size margin leverage spread swap commission broker account equity balance drawdown winrate profit P&L PnL CPI NFP FOMC GDP PPI ISM PMI Fed ECB BOE BOJ SNB BOC RBA RBNZ CB DXY VIX UST BOND BONDS US10Y US02Y NEWS TIME MT4 MT5 EA API JSON HTML CSS JS PHP SQL USA UK EU JP CN AU NZ CA CH DE FR IT ES NL BE CNY INR BRL MXN ZAR TRY RUB KRW HKD SGD NOK SEK DKK PLN CZK HUF ILS AED SAR QAR KWD BHD OMR JOD LBP EGP MAD TND DZD NGN KES GHS UGX TZS ZMW BWP NAD SZL LSL MZN AOA CDF RWF ETB SDG SSP SOS DJF ERN MRU XOF XAF XPF ANG AWG BBD BMD BSD BZD CAD CLP COP CRC CUP CVE DOP DZD FJD FKP GEL GIP GMD GNF GTQ GYD HNL HTG IDR IQD IRR ISK JMD KGS KHR KMF KPW KZT LAK LKR LRD MGA MKD MMK MNT MOP MRO MUR MVR MWK MYR NIO NPR OMR PAB PEN PGK PKR PYG QAR RON RSD RWF SCR SHP SLE SLL SRD STN SVC SYP THB TJS TMT TOP TTD TWD UAH UYU UZS VES VND VUV WST XCD YER ZWL EURUSD GBPUSD USDJPY AUDUSD USDCAD USDCHF NZDUSD XAUUSD BTCUSD ETHUSD US30 NAS100 GER40 UK100 SPX500 DAX FTSE AAPL TSLA NQ ES YM RTM OK LOL lol http https www com edu org net pdf jpg png gif EUR GBP USD JPY CHF CAD AUD NZD XAU XAG BTC ETH US30 US500 USOIL UKOIL OIL GOLD SILVER OANDA H1 H4 H8 H12 M15 M30 M1 M3 M5 M20 M45 MN W1 D1 D3 W3 W4 WTF SB TF RT RTM PM LOL HGSM '''.split())

SHELL_PATTERNS = ['کبوم','بام','داخ','توپ','پاپ','بام bam','boom']

def main():
    for f in sorted(glob.glob('_build/expert/batches/*-p*.json')):
        base = os.path.basename(f)
        m = re.match(r'(.+)-p(\d+)\.json', base)
        jid, p = m.group(1), m.group(2)
        if jid not in ('dbrrbd', 'aboutcompression'):
            continue
        work_path = f'_build/expert/work/{jid}-p{p}.json'
        if not os.path.exists(work_path):
            continue
        try:
            batch = json.load(open(f, encoding='utf-8'))
            work = json.load(open(work_path, encoding='utf-8'))
        except Exception as e:
            print(f'{base}: JSON FAIL {e}')
            continue
        wids = {x['hash'] for x in work}
        if set(batch.keys()) != wids:
            print(f'{base}: HASH MISMATCH extra={len(set(batch)-wids)} missing={len(wids-set(batch))}')
        for post in work:
            h = post['hash']; en = post['text']; fa = batch.get(h)
            if fa is None:
                continue
            probs = []
            en_paras = [x for x in en.split('\n\n') if x.strip()]
            fa_paras = [x for x in fa.split('\n\n') if x.strip()]
            if len(en_paras) != len(fa_paras):
                probs.append(f'PARA {len(en_paras)}->{len(fa_paras)}')
            en_nums = re.findall(r'\d+', en); fa_nums = re.findall(r'\d+', fa)
            if sorted(en_nums) != sorted(fa_nums):
                probs.append(f'NUM en={en_nums} fa={fa_nums}')
            for name in re.findall(r'([\w\.\-\[\] ]+?) wrote:', en):
                nm = name.strip()
                if f'{nm} نوشت' not in fa:
                    probs.append(f'WROTE:{nm}')
            for m2 in re.findall(r'([A-Za-z]{4,})', fa):
                if m2 not in ALLOWED_LATIN:
                    probs.append(f'LATIN:{m2}')
            for sp in SHELL_PATTERNS:
                if sp in fa:
                    probs.append(f'SLANG:{sp}')
            # persian digits
            if re.search(r'[۰-۹]', fa):
                probs.append('PERSDIGIT')
            if probs:
                print(f'{base} :: {post["id"]} :: {" | ".join(probs[:8])}')

main()
