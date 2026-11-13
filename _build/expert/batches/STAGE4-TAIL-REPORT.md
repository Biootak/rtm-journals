# گزارش تکمیل باقی‌ماندهٔ موج مرحلهٔ ۴ (vitaldrug)

## وضعیت ورودی‌ها

| فایل | مقدار خوانده‌شده | نتیجه |
|---|---|---|
| `_build/expert/WAVE.json` | `stage: 4`, `status: "stalled"`, `expect: 87` | فهرست `missing` این فایل قدیمی بود (۱۴ مورد) |
| `_build/expert/remaining.json` | snapshot ساعت ۱۴:۰۲ با `batch:false` برای ۱۰۸ صفحه | snapshot کهنه؛ بسیاری از آن batchها بعداً ساخته شده‌اند |
| بررسی واقعی روی دیسک | `expect` منهای فایل‌های موجود در `batches/` | **۲ فایل missing**: `vitaldrug-p6.json`, `vitaldrug-p7.json` |

صفحات `jurij-p13/p14`، `omidfx-p4..p10` و `vitaldrug-p4/p5/p8` که در `WAVE.json` به‌عنوان missing ثبت شده بودند، در واقع از قبل ساخته شده بودند؛ پس تنها دو صفحهٔ باقی‌ماندهٔ موج جاری همان `vitaldrug-p6` و `vitaldrug-p7` بود.

## کار انجام‌شده

| صفحه | پست‌ها | draft | batch | وضعیت پاراگراف |
|---|---|---|---|---|
| `vitaldrug-p6` | 24 | `drafts/vitaldrug-p6.txt` | `batches/vitaldrug-p6.json` | `paragraphs OK` |
| `vitaldrug-p7` | 25 | `drafts/vitaldrug-p7.txt` | `batches/vitaldrug-p7.json` | `paragraphs OK` |

ترجمه‌ها دستی و حرفه‌ای، با حفظ یک‌به‌یک پاراگراف‌ها، حفظ اعداد به‌صورت ارقام لاتین (`1.3010`، `1.32126`، `1.32851`، `1.32630`، `100%`، `2016.08.16`، `10R`، `3`، `1986`) و حفظ اکید acronymها (`FL`, `FLR`, `FTR`, `LS`, `QM`, `DM`, `iQM`, `BSZ`, `CPAZ`, `PAZ`, `MPL`, `PC`, `SR`, `PA`, `FO`, `UFL`, `LFL`). سرفصل‌های نقل‌قول به شکل `Name نوشت:` و با حفظ ترتیب تودرتو نگه داشته شدند.

## اعتبارسنجی

```
node _build/expert/workflow.js --validate --page vitaldrug-p6,vitaldrug-p7
accepted 49 | rejected 0
```

## وضعیت پس از اجرا

- `WAVE.json` → `expect` منهای موجود: **0 فایل missing**؛ موج مرحلهٔ ۴ کامل است.
- در کل آرشیو، ۹۵ فایل work هنوز batch ندارند و همه متعلق به **موج بعدی (stage 5)** هستند: rinehart, michal238, linos, benhur, mukhcin, edges, aran, mel, einrikr, fxeyes, andrew, moneydeep (+ `if-p1`, `vitaldrug-p9/p10`). این‌ها خارج از دامنهٔ این اجرا بودند.
- فایل‌های وضعیت (`WAVE.json` / `remaining.json`) طبق دامنهٔ کار دست‌نخورده ماندند و باید با `next-wave.js` تازه‌سازی شوند.
