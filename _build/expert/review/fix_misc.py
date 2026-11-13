# -*- coding: utf-8 -*-
import json,os,io,sys
sys.stdout=io.TextIOWrapper(sys.stdout.buffer,encoding='utf-8')
os.chdir(r'E:\Trade\journals\_build\expert')
B='batches'
def load(p):
    f=os.path.join(B,p+'.json'); return f,json.load(open(f,encoding='utf-8'))
def save(f,d): json.dump(d,open(f,'w',encoding='utf-8'),ensure_ascii=False,indent=1)
def hmap(jid,p):
    w=json.load(open(f'work/{jid}-{p}.json',encoding='utf-8'))
    return {x['id']:x['hash'] for x in w}
def workpost(jid,p,pid):
    w=json.load(open(f'work/{jid}-{p}.json',encoding='utf-8'))
    for x in w:
        if x['id']==pid: return x
    return None

# warren p2 43
f,d=load('warren-p2'); h=hmap('warren','p2')
d[h['warren_p2_43']]=u"آیا 25 روز صبر می‌کردی، یا با کوچک‌ترین برگشت plug را می‌کشیدی؟\n\nنگاه کن چقدر دقیق پیش رفت.\n\nسرتاسر"
save(f,d); print('warren ok')

# fishing p6
f,d=load('fishing-p6'); h=hmap('fishing','p6')
Q="gizzo نوشت: Im شورت USDCAD\n\nسلام رفیق.. فقط کنجکاوم این اسکالپ سریع است یا پوزیشن بلندمدت؟ الان هم توی معامله هستم اما بهترین قیمت را نگرفتم؛ فکر می‌کنی gapی که امروز زودتر رخ داد مهم بود؟ خیلی ممنون\n\nبه‌روزرسانی: زود ضرر را قطع کردم و تونستم ورود را در زمان LO مدیریت کنم.."
d[h['fishing_p6_128']]=Q
d[h['fishing_p6_129']]=u"gembel نوشت:\n\n"+Q+"\n\nسلام gembelinooo:)\n\nنه، فقط یک معاملهٔ کوتاه‌مدت بود اما آن‌قدر مدیریتش نکردم.. طمع کردم و SL را در BE خوردم:( الان دوباره دارم تلاش می‌کنم"
save(f,d); print('fishing-p6 ok')

# fishing p9 206
f,d=load('fishing-p9'); h=hmap('fishing','p9')
d[h['fishing_p9_206']]=u"تبریک Gizzo، نتیجه واقعاً عالی بود. امیدوارم ادامه‌دار باشد"
save(f,d); print('fishing-p9 ok')

# engulf p3 73
f,d=load('engulf-p3'); h=hmap('engulf','p3')
d[h['engulf_p3_73']]=u"Andy، یک نکتهٔ دیگر، دربارهٔ FTR همان‌طور که در پست # 55 گفتی، قبل از ساخته شدن FTR قیمت باید سفارش‌های بالا را بردارد یعنی اینگالی از سقف یا کف - کاملاً درست است."
save(f,d); print('engulf ok')

# whenever p2 47 - print full EN/FA
p=workpost('whenever','p2','whenever_p2_47')
print('EN:',p['text'])
print('FA:',json.load(open('batches/whenever-p2.json',encoding='utf-8'))[p['hash']])

# robbie p9 206 full
p=workpost('robbie','p9','robbie_p9_206')
print('EN:',p['text'])
print('FA:',json.load(open('batches/robbie-p9.json',encoding='utf-8'))[p['hash']])
