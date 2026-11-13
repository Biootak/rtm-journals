# -*- coding: utf-8 -*-
import json,os,io,sys
sys.stdout=io.TextIOWrapper(sys.stdout.buffer,encoding='utf-8')
B=r'E:\Trade\journals\_build\expert\batches'
def load(p):
    f=os.path.join(B,p+'.json'); return f,json.load(open(f,encoding='utf-8'))
def save(f,d): json.dump(d,open(f,'w',encoding='utf-8'),ensure_ascii=False,indent=1)

# ---------- p6 ----------
f,d=load('constantine-p6')
v=d['d7b500f42866e65028d4d8a0bc616a635c819a9a']
v=v.replace('چشم‌ها را آن‌قدر ورز بدهم','چشم‌ها را آن‌قدر عادت بدهم')
d['d7b500f42866e65028d4d8a0bc616a635c819a9a']=v
v=d['a46eca3cb0a6dbe7f9cc0edb65a10563315aaa1e']
v=v.replace('دربارهٔ «فقط لبه‌ها را ترید کن!»','دربارهٔ «فقط لبه‌ها را معامله کن!»').replace('ترید در لبه‌ها','معامله در لبه‌ها')
d['a46eca3cb0a6dbe7f9cc0edb65a10563315aaa1e']=v
d['6660723756e74ed58e8a8bac8c91f10e1ace5153']="چرا هیچ‌کس روی چیزی که اینجا منتشر می‌کنم نظر نمی‌دهد؟ برای من خیلی مهم است. به‌هرحال، چه درست بگویم چه نه، همهٔ ما می‌توانیم چیز تازه و مفیدی یاد بگیریم. شاید چیزی را برای خودم از خودم درآورده‌ام و اصلاً در مسیر درست نمی‌روم. نمی‌توانم با اطمینان بدانم. برای همین باز هم می‌خواهم: دریغ نکنید و اینجا حرف بزنید."
v=d['e6af15529b763886b80a8598da3c68f5dbbb06b2']
v=v.replace('تریدت','معامله‌ات').replace('ترید کنی','معامله کنی').replace('ترید شوی','معامله شوی').replace('ترید کردنشان','معامله کردنشان').replace('ترید بگیری','معامله بگیری').replace('ترید','معامله').replace('تایم‌چارچوب‌های','تایم‌فریم‌های')
d['e6af15529b763886b80a8598da3c68f5dbbb06b2']=v
v=d['40caabcc41db1f42393b98ebfbf94cfd172083de']
i=v.find('ساده‌ترین راه')
# rebuild: quote head = Lupy نوشت: + substring of p6_139 from 'ساده‌ترین راه' to 'E.'
p139=d['e6af15529b763886b80a8598da3c68f5dbbb06b2']
j=p139.find('ساده‌ترین راه')
k=p139.find('E.',j)
quote=p139[j:k+2]
v='Lupy نوشت: '+quote+'\n\nدوست Lupy، برای این تکه طلا خیلی ممنون!'
d['40caabcc41db1f42393b98ebfbf94cfd172083de']=v
d['33edd115d23ae1e90146485f2c1c766826c1446d']=d['33edd115d23ae1e90146485f2c1c766826c1446d'].replace('باید اینگالفی باشد تا قیمت به جایی که باید برود، رفته باشد','باید اینگالی باشد که قیمت به جایی که باید برود رفته باشد')
d['df02acf05157ec0977466f1c108984a203e49974']=d['df02acf05157ec0977466f1c108984a203e49974'].replace('Fresh Cap‌ها','CAPهای تازه')
d['2784a8dc812fad37c9b6c6b74d8de046eb60f850']="روی این عکس می‌خواستم بنویسم اینجا چه هست و چطور باید آن را برای معامله بپذیریم. اما فهمیدم توضیح دادنش مشکل است. می‌دانم چطور توضیحش بدهم، ولی برای این کار باید ویدئو ضبط کنم و واژهٔ درستی را که باید به کار برد پیدا کنم. در کل، باکس‌ها و چند مفهوم را گذاشته‌ام. امیدوارم برای کسی که چیزی از این‌ها می‌داند روشن باشد"
save(f,d); print('p6 done')

# ---------- p7 ----------
f,d=load('constantine-p7')
w=json.load(open(r'E:\Trade\journals\_build\expert\work\constantine-p7.json',encoding='utf-8'))
hmap={p['id']:p['hash'] for p in w}
d[hmap['constantine_p7_152']]=d[hmap['constantine_p7_152']].replace('یقین دارم که فهمیده نمی‌شوم. دقیق‌تر بگویم، برای اینکه انگلیسی‌ام فهمیده شود سعی می‌کنم کلمات زیادی نگویم. فقط چارت.','مطمئنم که نمی‌توانم بفهمانم. دقیق‌تر بگویم، تا انگلیسی‌ام درست فهمیده شود سعی می‌کنم کلمات زیادی نگوییم. فقط چارت.')
d[hmap['constantine_p7_156']]=d[hmap['constantine_p7_156']].replace('برای معامله‌گری باید','برای معامله کردن باید')
v=d[hmap['constantine_p7_157']]
v=v.replace('هی einrikr','سلام einrikr')
d[hmap['constantine_p7_157']]=v
d[hmap['constantine_p7_159']]=d[hmap['constantine_p7_159']].replace('هر FTBی FL و RSK دارد','هر FTB یک FL و یک RSK دارد')
P159=d[hmap['constantine_p7_159']]
d[hmap['constantine_p7_160']]='dkd11 نوشت: '+P159+'\n\nتازه فهمیدم که Quasimodo کشیده‌ام.'
d[hmap['constantine_p7_162']]=d[hmap['constantine_p7_162']].replace('شاید درست نگویم','شاید درست نیست')
v=d[hmap['constantine_p7_168']]
v=v.replace('یک معنی دارد: به‌روزرسانی Max یا Min','یک معنا دارد: به‌روزرسانی سقف یا کف').replace('در تصویر 3 نشان داده شده','در تصویر 3 نشان داده شده')
d[hmap['constantine_p7_168']]=v
d[hmap['constantine_p7_173']]=d[hmap['constantine_p7_173']].replace('موضوع «قیمت Reading»','موضوع «خواندن قیمت»')
save(f,d); print('p7 done')

# ---------- p8 ----------
f,d=load('constantine-p8')
w=json.load(open(r'E:\Trade\journals\_build\expert\work\constantine-p8.json',encoding='utf-8'))
hmap={p['id']:p['hash'] for p in w}
v=d[hmap['constantine_p8_176']]
v=v.replace('روی چارت QM','روی نمودار QM').replace('در تایم روزانه','در تایم‌فریم روزانه')
d[hmap['constantine_p8_176']]=v
v=d[hmap['constantine_p8_185']]
v=v.replace('هوم، Constantine','سلام Constantine').replace('حالت ftb دارد','حالت FTB دارد')
d[hmap['constantine_p8_185']]=v
# p8_187 quote head = einrikr نوشت: + p8_185fa
v=d[hmap['constantine_p8_187']]
# rebuild: quote = 'einrikr نوشت: '+p185fa ; then body
p185=d[hmap['constantine_p8_185']]
i=v.find('اولش من هم')
body=v[i:] if i>0 else v
v='einrikr نوشت: '+p185+'\n\n'+body
d[hmap['constantine_p8_187']]=v
v=d[hmap['constantine_p8_192']]
v=v.replace('از SRK یعنی حمایت/مقاومت Kink استفاده کنم','از SRK یعنی «Kink حمایت/مقاومت» استفاده کنم')
d[hmap['constantine_p8_192']]=v
save(f,d); print('p8 done')
