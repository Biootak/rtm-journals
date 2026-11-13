# بازبینی معنایی باقی‌مانده — ۸۲ صفحه

هدف: بازخوانی EN↔FA تمام ۸۲ صفحه‌ای که هنوز verdict ندارند، ثبت اصلاح‌های واقعی،
سپس apply → validate → bake → build → QA → انتشار.

قواعد بازبین: فقط نقص واقعی ثبت شود؛ متن جانشین کامل با همان تعداد پاراگراف؛
`\n` escape شود؛ لینک/handle/سرواژه/نام که باید لاتین بماند نقص نیست؛
جابه‌جایی پاراگراف، معکوس‌شدن نفی، ترجمهٔ اصطلاح به‌صورت تحت‌اللفظی و
پاراگراف انگلیسیِ بی‌فارسی نقص است.

**نقص ریشه‌ای پیدا و رفع شد (۲۰۲۶-۱۱-۰۹):** build به‌خاطر سه قاعدهٔ منبع‌ناآگاه
(`english-left`, `latin-junk`, `hallucination`) ترجمهٔ ۱٬۱۰۳ پست را بی‌صدا دور
می‌ریخت؛ در `_build/lexicon.js` قواعد منبع‌آگاه شدند. پس از rebuild، پست‌های
ترجمه‌دار ۹٬۲۰۶ → **۹٬۸۷۳**؛ ۴۳۶ بدون فارسی فقط متن خالی/امضا/تیکر/لینک‌اند.

| گروه | ژورنال | صفحه‌ها | وضعیت |
|---|---|---|---|
| 1 | salivan | 14–16 | done — 1 defect |
| 2 | salivan | 17–19 | done — 3 defects |
| 3 | salivan | 20–22 | done — 3 defects |
| 4 | salivan | 23–25 | done — 0 |
| 5 | salivan | 26–28 | done — 1 defect |
| 6 | salivan | 29–31 | done — 4 defects |
| 7 | salivan | 32–34 | done — 3 defects |
| 8 | salivan | 35–37 | done — 2 defects |
| 9 | salivan | 38–40 | done — 1 defect |
| 10 | salivan | 41–43 | done — 0 |
| 11 | salivan | 44–46 | done — 0 |
| 12 | sniffing | 1–3 | done — 0 |
| 13 | sniffing | 4–6 | done — 3 defects |
| 14 | sniffing | 7–9 | done — 2 defects |
| 15 | sniffing | 10–12 | done — 0 |
| 16 | sniffing | 13–14 | done — 0 |
| 17 | staurum | 8–10 | done — 1 defect |
| 18 | staurum | 11–13 | done — 0 |
| 19 | staurum | 14–16 | done — 0 |
| 20 | staurum | 17–19 | done — 1 defect |
| 21 | rinehart | 1–3 | done — 2 defects |
| 22 | rinehart | 4–6 | done — 3 defects |
| 23 | rinehart | 7–9 | done — 7 defects |
| 24 | rinehart | 10–11 | done — 0 |
| 25 | rinehart | 12–13 | done — 0 |
| 26 | vitaldrug | 1–3 | done — 1 defect |
| 27 | vitaldrug | 4–6 | done — 1 defect |
| 28 | vitaldrug | 7–8 | done — 2 defects |
| 29 | vitaldrug | 9–10 | done — 2 defects |

**همهٔ ۸۲ صفحه تمام شد.** مجموع نقص‌های این موج: **۴۴**.

| 13 | sniffing | 4–6 | pending |
| 14 | sniffing | 7–9 | pending |
| 15 | sniffing | 10–12 | pending |
| 16 | sniffing | 13–14 | pending |
| 17 | staurum | 8–10 | pending |
| 18 | staurum | 11–13 | pending |
| 19 | staurum | 14–16 | pending |
| 20 | staurum | 17–19 | pending |
| 21 | rinehart | 1–3 | pending |
| 22 | rinehart | 4–6 | pending |
| 23 | rinehart | 7–9 | pending |
| 24 | rinehart | 10–11 | pending |
| 25 | rinehart | 12–13 | pending |
| 26 | vitaldrug | 1–3 | pending |
| 27 | vitaldrug | 4–6 | pending |
| 28 | vitaldrug | 7–8 | pending |
| 29 | vitaldrug | 9–10 | pending |

**باقی‌ماندهٔ شناخته‌شده:** ۱۹ پست در ترجمه `[/quote]` را به `/quote` تبدیل می‌کنند،
چون `cleanMachine` همهٔ براکت‌ها را حذف می‌کند؛ نمایش انگلیسی سالم است. این مورد
جزو کارهای بعدی است و روی پوشش ترجمه اثر ندارد.

## سه ژورنال تازه — ۲۰۲۶-۱۱-۰۹

| ژورنال | صفحه‌ها | وضعیت بازبینی |
|---|---|---|
| Kruger | 1–21 | done — 5 نقص (p9×2، p19×2، p21×1) |
| Frosty's Igloo | 1–13 | done — 15 نقص (p2×1، p5×2، p8×4، p9×1، p10×1، p11×6) |
| MM | 1–16 | done — 3 نقص (p7×2، p12×1) |

هر ۵۰ فایل verdict موجود است؛ `apply-review.js` → **applied 445 | refused 0**.
در همین اجرا verdictهای قبلی (۴۲۲) و ۱۴۵ ورودی class-sweep دوباره اعمال شدند،
چون اعمالِ دوبارهٔ verdictهای قدیمی اصلاح‌های FL/CAPS/تاریخ را برمی‌گرداند؛
همهٔ ۱۴۵ مورد sweep بازگردانده و تأیید شد. اکنون هیچ «فلگ» ساختاری در سه
ژورنال تازه نمانده و تنها «پرچم»های lowercase/پرچم‌کشورها مجاز مانده‌اند.
