# নতুন অ্যাপের Vercel প্রিভিউ — অবস্থা ও ধাপে-ধাপে নির্দেশিকা

**তারিখ:** ৩১ অক্টোবর ২০২৬ · **আপনার অনুমোদন:** “হ্যাঁ, আলাদা প্রিভিউ খুলুন”

## ০ · ডেমো ডিপ্লয় (ব্যাকএন্ড/DB ছাড়া — সর্বশেষ সিদ্ধান্ত)

ব্যবহারকারীর নির্দেশ: **আপাতত কোনো backend বা database সংযুক্ত হবে না; ডেমো ডেটাই থাকবে।**
তাই এই ডিপ্লয়ে **কোনো environment variable লাগবে না** —

- Root Directory: `app`
- Framework: Vite · Build: `npm run build` · Output: `dist` · Install: `npm ci`
- Production Branch: **`arena/050e88aa-amar-somobay-v2`** (Vercel → Project → Settings → Git → Production Branch)
  — `main`-এ মার্জ না করেই এই শাখা থেকে বিল্ড হবে; রুটের পুরনো প্রোডাকশন অ্যাপ অপরিবর্তিত থাকবে
- SPA rewrite আগে থেকেই `app/vercel.json`-এ আছে, তাই `/m/home`-এ সরাসরি গেলেও পর্দা খুলবে
- সব ডেটা ইন-মেমরি সিড; রিফ্রেশে রিসেট — এটাই ডেমোর প্রত্যাশিত আচরণ

**Arena Vercel কানেক্টর** সংযুক্ত হলে সেখান থেকেই ব্রাঞ্চ-প্রিভিউ তৈরি করা যাবে; বর্তমানে কানেক্টরটি disconnected।

---

## ১ · অবস্থা — ⛔ এই সেশনে ডিপ্লয় করা যায়নি (প্রোডাকশন অক্ষত)

| যা দরকার | অবস্থা |
|---|---|
| Vercel অ্যাকাউন্টে কোনো টোকেন/সেশন | ❌ নেই (স্যান্ডবক্সে কোনো `VERCEL_TOKEN`, `~/.vercel` বা লগইন নেই) |
| `api.vercel.com`-এ নেটওয়ার্ক | ❌ বন্ধ — এই পরিবেশ শুধু GitHub, npm, PyPI-তে যেতে পারে |
| `vercel` CLI | ❌ ইনস্টল নেই |

নেটওয়ার্ক যাচাই (প্রমাণ):
```
$ curl -sS -m 10 https://api.vercel.com/v2/user
curl: (35) OpenSSL SSL_connect: SSL_ERROR_SYSCALL in connection to api.vercel.com:443
```

> **গুরুত্বপূর্ণ:** এই সেশনে **কোনো ডিপ্লয়মেন্ট হয়নি** — বর্তমান প্রোডাকশন সাইট, `main`-এর Vercel প্রজেক্ট,
> বা কোনো বিদ্যমান ডোমেইন **বদলায়নি**। `.vercelignore` যোগ করার কারণে পুরনো প্রজেক্টের বিল্ডেও নতুন ফোল্ডারগুলো যাবে না।

**পরিবর্তে যা প্রস্তুত আছে:**
1. ✅ লাইভ **প্রোডাকশন-বিল্ড** প্রিভিউ (পোর্ট ৪১৭৩) — `app/dist`, ৩৫ মডিউল, JS ২৬৩.৭৩ kB / gzip ৮০.৪৮
2. ✅ লাইভ **ডেভ** প্রিভিউ (পোর্ট ৫১৭৩)
3. ✅ `app/vercel.json` — ফ্রেমওয়ার্ক, ইনস্টল, বিল্ড, আউটপুট ও SPA রিরাইট সব লেখা আছে
4. ✅ নিচের গাইড — কপি-পেস্ট করার মতো

---

## ২ · ধাপে-ধাপে (আপনি বা আমি, অনুমতি পেলে)

### ২.১ ড্যাশবোর্ড থেকে (সবচেয়ে সহজ)

1. Vercel → **Add New… → Project**
2. GitHub repo **`rashedpervej/Amar-Somobay-v2`** সিলেক্ট করুন
3. ⚠️ **Root Directory → `app`** — এটি সবচেয়ে জরুরি ধাপ (না হলে রুটের পুরনো অ্যাপ বিল্ড হবে)
4. Framework Preset → **Vite** (স্বয়ংক্রিয়ভাবে ধরা উচিত, `app/vercel.json`-ও আছে)
5. Build Command `npm run build` · Output Directory `dist` · Install Command `npm ci`
6. **Environment Variables** (শুধু Preview, Production নয়):
   - `VITE_SUPABASE_URL` — β/staging প্রজেক্টের URL
   - `VITE_SUPABASE_ANON_KEY` — **anon (publishable) key**, `service_role` **কখনো নয়**
7. **Deploy** → প্রিভিউ URL পাবেন (`somobay-app-*.vercel.app`)

### ২.২ CLI থেকে (যদি টোকেন থাকে)

```bash
cd app
npx vercel link            # নতুন প্রজেক্ট তৈরি/লিংক — পুরনো প্রজেক্ট নয়
npx vercel deploy          # প্রিভিউ ডিপ্লয়মেন্ট
npx vercel env add VITE_SUPABASE_URL preview
npx vercel env add VITE_SUPABASE_ANON_KEY preview
```

---

## ৩ · শর্ত ও সতর্কতা

| # | শর্ত |
|---|---|
| ১ | **আলাদা প্রজেক্ট** — `app/` root directory; বিদ্যমান প্রোডাকশন প্রজেক্টের সাথে কোনো ফাইল/সেটিং মেশানো যাবে না |
| ২ | প্রোডাকশন ডোমেইন নতুন প্রজেক্টে **সংযুক্ত করা যাবে না** (আপনার অনুমতি ছাড়া) |
| ৩ | Environment variable শুধু `VITE_…` anon key — `service_role` বা `.env` রেপোতে **নয়** (`app/.gitignore` + `.vercelignore` আগেই ঠেকায়) |
| ৪ | `production` ব্রাঞ্চ = `main`; আমাদের কাজ `arena/…` ব্রাঞ্চে — তাই ডিফল্টভাবে এটি **Preview** ডিপ্লয়মেন্টই হবে |
| ৫ | প্রথম ডিপ্লয়ের পরে যাচাই: `/` লোড হয়, SPA রিরাইট কাজ করে (`/policy` সরাসরি খুললে ২০০), Hind Siliguri ফন্ট আসে, কনসোলে কোনো ৪০৪ নেই |

---

## ৪ · যাচাই যে রুটের পুরনো ডিপ্লয়মেন্ট নিরাপদ

`.vercelignore` (রেপো-রুট):
```
app/
prototype/
specs/
reports/
patches/
docs/
```
অর্থাৎ বিদ্যমান প্রজেক্ট নতুন করে বিল্ড করলেও `app/` বা `prototype/` তার বান্ডলে ঢুকবে না — রুট বিল্ডের
আউটপুট (CSS হ্যাশ, JS হ্যাশ) আগের মতোই থাকবে।
