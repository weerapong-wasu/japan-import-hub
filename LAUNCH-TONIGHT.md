# 🚀 LAUNCH TONIGHT — Linkage Guide
### Japan Import Hub · Full Stack Edition
### เว็บขึ้น online คืนนี้ = ทำแค่ PHASE 1 (15 นาที) · Stripe/Supabase เปิดตามทีหลังได้ ไม่ block

---

## PHASE 1 — เว็บ ONLINE คืนนี้ (ฟรี, ~15 นาที)

### 1.1 Push ขึ้น GitHub
```bash
# แตก zip แล้ว cd เข้าโฟลเดอร์
cd japan-import-hub
git init
git add .
git commit -m "Japan Import Hub — full stack launch"
# สร้าง repo ใหม่ (Private ได้) ที่ github.com/new ชื่อ japan-import-hub แล้ว:
git remote add origin https://github.com/YOUR_USERNAME/japan-import-hub.git
git branch -M main
git push -u origin main
```

### 1.2 Connect Vercel (ฟรี)
1. ไป [vercel.com](https://vercel.com) → **Sign up with GitHub**
2. **Add New → Project** → เลือก repo `japan-import-hub` → **Import**
3. Vercel เห็นเป็น Astro อัตโนมัติ → กด **Deploy** (ไม่ต้องตั้งอะไรเลย)
4. ~2 นาที → ได้ URL `https://japan-import-hub-xxx.vercel.app`

**🎉 แค่นี้เว็บ online 24 ชม. แล้ว!** ทุกหน้า content ทำงานครบ
ปุ่ม Buy/Newsletter จะขึ้นข้อความ "not configured yet" อย่างสุภาพ — ไม่ error ไม่พัง

### 1.3 (Optional คืนนี้) Custom domain
Vercel → Project → Settings → Domains → ใส่ domain ที่ซื้อไว้
แล้วแก้ `astro.config.mjs` บรรทัด `site:` เป็น domain จริง + push อีกครั้ง

---

## PHASE 2 — DATABASE (Supabase, ฟรี, ~10 นาที)

1. [supabase.com](https://supabase.com) → New project (ตั้ง password เก็บไว้)
2. **SQL Editor** → New query → copy ทั้งไฟล์ `supabase/schema.sql` → **Run**
   → ได้ตาราง `subscribers`, `orders` + RLS ล็อคเรียบร้อย
3. **Storage** → New bucket ชื่อ `products` → ⚠️ **ปิด Public** (ต้อง Private!)
   → Upload ไฟล์ `toolkit.zip` (อยู่ในของที่ยายาส่งให้) เข้า bucket นี้
4. Settings → API → copy 3 ค่า:
   - `Project URL` → ใช้เป็น `SUPABASE_URL` และ `PUBLIC_SUPABASE_URL` (ค่าเดียวกัน)
   - `service_role` key (secret!) → ใช้เป็น `SUPABASE_SERVICE_ROLE_KEY`
   - `anon public` key → ใช้เป็น `PUBLIC_SUPABASE_ANON_KEY` (ตัวนี้เปิดเผยได้ RLS คุ้มครองอยู่)
5. **Authentication → Providers → Email** เปิดอยู่แล้วโดย default (magic link)
   → Authentication → URL Configuration → ใส่ Site URL เป็น URL เว็บจริง
   (ทำให้ระบบ Member login + Wishlist หน้า `/account` ทำงาน)

---

## PHASE 3 — STRIPE (~15 นาที, เริ่ม Test mode)

1. [dashboard.stripe.com](https://dashboard.stripe.com) → สมัคร/login → เปิด **Test mode** (toggle มุมขวาบน)
2. **Products → Add product**
   - Name: `Japan Import Master Toolkit`
   - Price: `$9.99` One-time
   - Save → copy **Price ID** (`price_...`) → ใช้เป็น `STRIPE_TOOLKIT_PRICE_ID`
3. **Developers → API keys** → copy `Secret key` (`sk_test_...`) → `STRIPE_SECRET_KEY`
4. **Developers → Webhooks → Add endpoint**
   - URL: `https://YOUR-VERCEL-URL/api/stripe-webhook`
   - Events: เลือก `checkout.session.completed` อย่างเดียว
   - Save → copy **Signing secret** (`whsec_...`) → `STRIPE_WEBHOOK_SECRET`

---

## PHASE 4 — LINKAGE (ผูกทุกอย่างเข้า Vercel, ~5 นาที)

Vercel → Project → **Settings → Environment Variables** → ใส่ทั้ง 6 ตัว
(เลือก Production + Preview ทั้งคู่):

| Key | Value จากไหน |
|---|---|
| `STRIPE_SECRET_KEY` | Stripe → API keys (`sk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Webhooks (`whsec_...`) |
| `STRIPE_TOOLKIT_PRICE_ID` | Stripe → Products (`price_...`) |
| `SUPABASE_URL` | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API (service_role) |
| `PUBLIC_SUPABASE_URL` | ค่าเดียวกับ SUPABASE_URL |
| `PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API (anon public) |
| `PUBLIC_SITE_URL` | URL เว็บจริง เช่น `https://japan-import-hub-xxx.vercel.app` (ไม่มี / ท้าย) |

จากนั้น **Deployments → ⋯ → Redeploy** เพื่อให้ env มีผล

### ทดสอบ end-to-end (Test mode)
1. เปิดเว็บ → `/toolkit` → กด **Buy now**
2. หน้า Stripe Checkout → ใช้บัตรทดสอบ `4242 4242 4242 4242` · วันหมดอายุอนาคตอะไรก็ได้ · CVC อะไรก็ได้
3. จ่ายเสร็จ → เด้งกลับหน้า Thanks → กด **Download** → ได้ toolkit.zip ✅
4. เช็ค Supabase → Table Editor → `orders` → มี order ใหม่ ✅
5. ทดสอบ Newsletter form ท้ายหน้า → เช็คตาราง `subscribers` ✅

### เปิดขายจริง (เมื่อพร้อม)
Stripe → ปิด Test mode → ทำข้อ 2-4 ซ้ำใน **Live mode** (ได้ `sk_live_...`, `price_...`, `whsec_...` ชุดใหม่)
→ อัปเดต 3 ตัวแรกใน Vercel env → Redeploy → **เปิดรับเงินจริง** 💰
(Stripe จะขอข้อมูลธุรกิจ + บัญชีธนาคารตอน activate — เป็นขั้นตอนปกติ)

---

## PHASE 5 — AUTONOMOUS CONTENT (มีอยู่แล้ว, เปิดเมื่อพร้อม)

`.github/workflows/daily-article.yml` พร้อมอยู่แล้ว — ใส่ `ANTHROPIC_API_KEY`
ใน GitHub → Settings → Secrets → Actions เมื่อไหร่ ระบบเขียนบทความรายวัน + เปิด PR
ให้พี่ review เมื่อนั้น ไม่ใส่ = ปิดอยู่เฉยๆ ไม่มีผลอะไร

---

## 🔒 SECURITY NOTES (Integrity Shield)
- `service_role` key และ `sk_` keys = **ห้าม commit ลง git เด็ดขาด** (`.gitignore` กัน `.env` ไว้แล้ว) ใส่เฉพาะใน Vercel env เท่านั้น
- Webhook มี signature verification — ปลอม order ไม่ได้
- Download ต้องมี Stripe session ที่จ่ายจริง — โหลดฟรีไม่ได้
- ตาราง DB ล็อค RLS หมด — อ่านจากภายนอกไม่ได้ เขียนได้เฉพาะ server
- บัคเก็ต `products` ต้อง **Private** — ถ้าเปิด Public ไฟล์หลุดฟรีทันที ⚠️

## 💸 COST (Middle Path)
Vercel Free + Supabase Free + GitHub Free = **฿0/เดือน**
Stripe คิดเฉพาะเมื่อขายได้ (~2.9% + 30¢/รายการ) — ไม่มี fixed cost
