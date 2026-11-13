# وضعیت انتشار — تا اینجا و ادامهٔ کار

**تاریخ:** ۲۰۲۶-۱۱-۰۹ — انتشار کامل شد.
**مخزن عمومی:** https://github.com/Biootak/rtm-journals (شاخهٔ `main`)
**سایت زنده:** https://biootak.github.io/rtm-journals/

## موج کامل RTM — ۲۰۲۶-۱۱-۱۳

- **زنده:** ۸۹ ژورنال / ۳۵٬۸۶۹ پست؛ artifact ~۱۱۸ مگابایت (کامیت `064133e`، ران Pages `43372454807`).
- **تصاویر:** ۳۲٬۵۴۴ تصویر + ۳۲٬۴۰۸ thumb (~۲٫۳۴ گیگ) در باکت خصوصی `fm-blog` (Filebase) زیر `general/rtm-img-*` و `general/rtm-thumb-*`؛ از طریق `https://financialmarket.page/uploads/general` سرو می‌شوند. باکت عمومی نشد.
- **نحوهٔ دیپلوی:** `site/index.html` کامیت‌شده `RTM_ASSETS_BASE` خالی دارد (لوکال از فایل‌ها). workflow با sed مقدار `https://financialmarket.page/uploads/general` را تزریق می‌کند و دیگر `fetch-assets.mjs` را اجرا نمی‌کند.
- **لوکال:** چهار قسمت `assets-v6-part*.tar.gz` به ۳۷ تکهٔ ۶۴ مگابایتی در Release `assets-v1` آپلود شد (۰ خطا). `fetch-assets.mjs` تکه‌ها را با Range ادامه می‌دهد، می‌چسباند و SHA-256 کل قسمت را چک می‌کند.
- **محدودیت:** Filebase free ~۵ گیگ فضا (۲٫۳۴ گیگ استفاده) و سقف egress ماهانه دارد؛ Cloudflare تصاویر را ۳۰۰ ثانیه کش می‌کند. برای ترافیک بالاتر می‌توان Cache Rule روی `/uploads/general/rtm-*` گذاشت.

## وضعیت نهایی (۲۰۲۶-۱۱-۰۹)

- بستهٔ تصاویر آپلود شد: asset `726184315`، `823,745,490` بایت، وضعیت `uploaded`، SHA-256 تأیید شد.
- باگ `fetch-assets.mjs` (سایه‌افتادن نام `URL`) اصلاح و کامیت شد: `90d980b`.
- GitHub Pages با `build_type: workflow` فعال و `Deploy site` با موفقیت اجرا شد.
- بررسی زنده: صفحهٔ اصلی ۲۰۰ (۶۲٬۵۲۹ بایت)، ۴۸ کارت، `lang=fa` و `dir=rtl`، استخراج `6796 images, 6796 thumbnails` با checksum سالم، نمونهٔ تصویر ۲۰۰ با اندازهٔ درست، کنسول بدون خطا.
- Cloudflare Pages همچنان گزینهٔ جایگزین است (نیاز به ورود یک‌بارهٔ مالک).
- **۲۰۲۶-۱۱-۰۹ (commit `d6f8b6a`):** تابلوی تصاویر از گرید تودرتو/تک‌ستونه به
  ستون‌های متراکم تبدیل شد — ۳ ستون در عرض ۵۸۹px، ارتفاع ۵٬۹۶۱ → ۱٬۵۲۶px،
  ۲۹/۲۹ تصویر سالم، بدون خطای کنسول. ترجمهٔ متن تصاویر طبق درخواست مالک انجام نمی‌شود.
- **۲۰۲۶-۱۱-۰۹ (commit `c6487ba`):** موج نهایی اصطلاحات — ۱۴۵ ورودی verdict
  (FL/FLAG، CAPS، ماه‌ها) روی ۹۹ پست اعمال شد؛ `workflow.js --validate` →
  `accepted 9874 | rejected 0`؛ دادهٔ بازسازی‌شده ۹٬۸۷۳ پست ترجمه‌دار.
  ادعای «ترجمهٔ ماشینی» در پاورقی و خروجی Markdown با وضعیت واقعی جایگزین شد؛
  `site/assets/fonts/LICENSE-FONTS.md` اضافه شد. Deploy `42567122329` موفق.
  بررسی زنده (reload سخت): پاورقی جدید، ۴ تصویر در ردیف در عرض ۷۵۰px،
  عبارت اصلاح‌شدهٔ FL در `#/j/if/99`، بدون خطای کنسول.

## تصمیم معماری

repo زیر ۱۰۰ مگابایت می‌ماند؛ تصاویر ۹۰۶ مگابایتی در **Release** با تگ `assets-v1` نگه داشته می‌شوند.
هنگام کلون، `node scripts/fetch-assets.mjs` بسته را دانلود، SHA-256 را بررسی و در `site/assets` استخراج می‌کند.

## انجام‌شده

- پوشهٔ سبک `release-build/` ساخته و پوش شد: ۴۵ فایل، ۴۶ مگابایت روی دیسک، `~۱۵ مگابایت` فشرده.
  - کامیت‌ها: `27f08b3` (نسخهٔ سبک) و `8493c0d` (ثبت checksum)
  - شامل: `site/` (بدون images/thumbs)، `scripts/fetch-assets.mjs`، README، `package.json`، `.github/workflows/pages.yml`
- Release `assets-v1` ساخته شد — شناسه: **438203568** — فعلاً **هیچ asset ندارد**.
- بستهٔ تصاویر ساخته شد:
  - `_build/release/assets-v1.tar.gz` — **823,745,490 بایت (۷۸۶ مگابایت)**
  - SHA-256: `c099e6031b8377e307ff89f0412ac4c93695f33bf059c742ed2d530ebd108b15`
  - محتوا: ۶٬۷۹۶ تصویر + ۶٬۷۹۶ بندانگشتی (ساختار `assets/images/...` و `assets/thumbs/...`)
- آپلود آزمایشی تا ۱۰۰٪ رفت ولی وقتی متوقف شد asset در وضعیت `starter` ماند و لینک ۴۰۴ داد؛
  همان asset ناقص پاک شد. **فایل بسته سالم است و باید دوباره آپلود شود.**

## ادامهٔ کار (فردا)

### ۱) آپلود بستهٔ تصاویر (~۱۰ تا ۲۰ دقیقه)

```bash
cd "//vmware-host/Shared Folders/Journals"
bash _build/release/upload-asset.sh
```

خروجی درست: `HTTP 201` و `asset ... 823745490 uploaded`.
اگر قطع شد، دوباره اجرا کن؛ asset ناقص را اول با API حذف کن (فایل `rel.json` شناسه را دارد).

### ۲) بررسی Release

```bash
TOKEN=$(printf "protocol=https\nhost=github.com\n\n" | git credential fill | sed -n 's/^password=//p')
curl --http1.1 -s -H "Authorization: Bearer $TOKEN" \
  https://api.github.com/repos/Biootak/rtm-journals/releases/438203568/assets |
  node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const a=JSON.parse(s);console.log(a.map(x=>[x.name,x.size,x.state]))})"
curl -I -L --http1.1 https://github.com/Biootak/rtm-journals/releases/download/assets-v1/assets-v1.tar.gz | grep -i "^HTTP"
```

باید `uploaded` و `823745490` و `HTTP 200` ببینی.

### ۳) آزمون کلون تازه

```bash
cd ~
git clone https://github.com/Biootak/rtm-journals.git rtm-test
cd rtm-test
node scripts/fetch-assets.mjs     # باید counts: 6796 images, 6796 thumbnails بدهد
npx.cmd serve site                # یا npx http-server site -p 5173
```

### ۴) انتشار سایت

**Cloudflare Pages (انتخاب مالک):** نیاز به ورود یک‌باره دارد.

```bash
cd "//vmware-host/Shared Folders/Journals/release-build"
node scripts/fetch-assets.mjs      # اگر site/assets خالی است
npx.cmd wrangler login
npx.cmd wrangler pages deploy site --project-name rtm-journals
```

**جایگزین بدون ورود Cloudflare — GitHub Pages:** با توکن موجود می‌توان Pages را فعال کرد:

```bash
curl --http1.1 -X POST -H "Authorization: Bearer $TOKEN" -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/Biootak/rtm-journals/pages -d '{"build_type":"workflow"}'
curl --http1.1 -X POST -H "Authorization: Bearer $TOKEN" -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/Biootak/rtm-journals/actions/workflows/pages.yml/dispatches -d '{"ref":"main"}'
```

سایت منتشرشده ~۹۵۲ مگابایت و ۱۳٬۶۳۰ فایل است؛ سقف GitHub Pages یک گیگابایت (نزدیک حد) و سقف Cloudflare Pages ۲۰٬۰۰۰ فایل / ۲۵ مگابایت هر فایل (راحت جا می‌شود).

## نکات

- `npx` در Git Bash موجود نیست؛ از `npx.cmd` استفاده کن.
- توکن از Git Credential Manager خوانده می‌شود؛ آن را چاپ نکن.
- بستهٔ `site/` در workspace اصلی کامل است (`site/assets`)، پس برای انتشار فوری Cloudflare نیازی به دانلود دوباره نیست.
- `RELEASE-STATUS.md` و `release-build/` نباید به مخزن عمومی اضافه شوند (مخزن عمومی از قبل پوش شده است).
