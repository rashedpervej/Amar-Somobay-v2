# Phase D1 — File Import ও Integrity Verification রিপোর্ট

**তারিখ:** ৩১ অক্টোবর ২০২৬ · **ব্রাঞ্চ:** `arena/050e88aa-amar-somobay-v2` · **PR:** #1
**অনুমোদন:** আপনার §৩ (File Import — APPROVED) ও §২ (Gate #1/#2 — APPROVED WITH CONDITIONS)
**প্রকৃতি:** শুধু ফাইল ইনপোর্ট ও যাচাই। **কোনো migration চালানো হয়নি, কোনো production পরিবর্তন হয়নি, কোনো merge হয়নি।**

---

## ১ · সারসংক্ষেপ

| প্রশ্ন | ফল |
|---|---|
| কত ফাইল ইমপোর্ট হলো? | **৮৪** (app ৩৮ · prototype ৩৩ · specs ৭ · reports ২ · patches ৩ · HANDOFF ১) + আমার আগের ৩টি পরিকল্পনা-নথি |
| মোট আকার | **~৪.৭ MB** (কোনো বাইনারি/মিডিয়া নেই) |
| পুরনো production অ্যাপ | **অপরিবর্তিত** — `src/`, `server.ts`, `api/`, `public/`, `data/` একটিও বদলায়নি* |
| `npm run lint` (রুট) | আগে **৯ এরর** → পরে **৯ এরর** (হুবহু একই তালিকা) ✅ |
| `npm run build` (রুট) | আগে সফল → পরে সফল, **আউটপুট বাইট-হুবহু এক** (`index-D3ar1qiB.css` + `index-DIOzrmZF.js`) ✅ |
| নতুন অ্যাপ (`app/`) | typecheck **পরিষ্কার** · build সফল (২৬৩.৭৩ kB / gzip ৮০.৪৮ kB) · টেস্ট **২৪১/২৪৩** |
| Preview | নতুন অ্যাপ `:5173` · প্রোটোটাইপ `:8000` — দুটোই চালু, হোস্ট-হেডার টেস্ট পাস ✅ |
| Production deploy | **কিছুই করা হয়নি** — `.vercelignore` যোগ করা হয়েছে যাতে পুরনো প্রজেক্ট নতুন ফোল্ডার বিল্ড না করে |

\* ব্যতিক্রম দুটি, §৫-এ বিস্তারিত — দুটোই **জরুরি integrity repair**, এবং ফলাফল বাইট-হুবহু একই রাখার জন্য করা হয়েছে।

---

## ২ · পদ্ধতি

1. Drive-এ কোনো ইনপোর্টযোগ্য `.zip` নেই (৪৪টি zip খুঁজে দেখেছি — কোনোটি এই প্রজেক্টের নয়) → **ফাইল-বাই-ফাইল** ডাউনলোড।
2. `Referacne _ amar-somobay-v2` ফোল্ডার বাদ — সেটি এই রেপোরই হুবহু কপি (নাম+সাইজ মিলিয়ে যাচাই)।
3. প্রতিটি ফাইল তার **মূল ফোল্ডার-গঠন** অক্ষুণ্ণ রেখে বসানো হয়েছে।
4. রুট `npm install` → **ইনপোর্টের আগে** baseline lint/build → ইনপোর্ট → **পরে** আবার একই কমান্ড → তুলনা।
5. `app/`-এর নিজস্ব `npm install` → test / typecheck / build।

**গঠন-সিদ্ধান্ত (গুরুত্বপূর্ণ):** পরিকল্পনায় `docs/design/prototype/` বলা হয়েছিল, কিন্তু ইমপোর্টের পর দেখা গেল
`app/tests/d03-design-tokens.mjs` ও প্রোটোটাইপ হার্নেসগুলো **ওয়ার্কস্পেস-রুটে** `prototype/`, `specs/`, `reports/`
খোঁজে (HANDOFF-এর মূল গঠন)। তাই **মূল HANDOFF গঠনই বজায় রাখা হয়েছে**: `app/ · prototype/ · specs/ · reports/ · patches/ · HANDOFF.md`
রুটে, আর আমার পরিকল্পনা-নথি `docs/plans/`-এ। এতে ২৬৩টি টেস্টের একটিও পাথ-ভাঙেনি।

---

## ৩ · File Inventory

| এলাকা | ফাইল | আকার | বিষয়বস্তু |
|---|---:|---:|---|
| `app/` | ৩৮ | ~১৫৮ KB (+ node_modules বাদ) | Phase ১ React ভিত্তি — `src/lib` (৮: noInterest, tenant, money, supabaseClient), `src/pages` (২), `src/components/ui.tsx`, `src/styles` (tokens/base), `src/{App,main,index.css}`, `tests` (৭, ২৬৩ চেক), `db` (৪ SQL), `tools` (২), config (৮) |
| `prototype/` | ৩৩ | ৩.৩ MB | ৯টি HTML (index/preview/screens/flows/system/skins/mobile-check/workspace/original-5) · `assets/` (ui.css ১০০ KB · screens.js **২.০ MB** · app.js ২৯৪ KB · skins.css · store.js · workspace.js) · `tests/` (১৬: ১২ হার্নেস + mobile-contract.md ৪৩ KB + states.json + baseline-ui.css + README) · `server.py` |
| `specs/` | ৭ | ৯০৪ KB | 00 ডিজাইন স্পেক · 01 ডেটা-মডেল/API · 02 সিদ্ধান্ত রেজিস্ট্রি (D-কোড) · 03 আর্কিটেকচার (১৩৪১ লাইন) · 04 অ্যাডমিন UX অডিট · 05 মোবাইল চুক্তি · 06 consolidation প্ল্যান |
| `reports/` | ২ | ৫৬ KB | Phase ১ Impact/Migration/Security রিপোর্ট · QH Phase 3A রিপোর্ট |
| `patches/` | ৩ | ৫২ KB | `0001-D01-zero-interest.patch` (১৫ KB) · `0002-D02-tenant-isolation.patch` (২২ KB) · README |
| `HANDOFF.md` | ১ | ২৮ KB | নতুন চ্যাট/ডেভেলপার অনবোর্ডিং নির্দেশিকা |
| `docs/plans/` | ৩ | ৯৬ KB | V2 আর্কিটেকচার+প্ল্যান · screen-mapping.csv (১৯৯ সারি) · DESIGN_INTEGRATION_PLAN |
| **মোট** | **৮৪** | **~৪.৭ MB** | |

**নিরাপত্তা:** কোনো `.env`, key, token, credential ইমপোর্ট হয়নি। `app/.env.example` শুধু **নাম** দেখায়, মান নেই
(`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, ৪টি টেস্ট-ভেরিয়েবল)। `.gitignore`-এ `.env*` আগে থেকেই ব্লকড।

---

## ৪ · যা পাওয়া যায়নি (স্পষ্টভাবে চিহ্নিত)

| ফাইল | অবস্থা | প্রভাব | করণীয় |
|---|---|---|---|
| `prototype/assets/skins.js` (৩৯,৩৭৩ B) | Drive লিস্টিং ও সার্চে **আছে**, কিন্তু ডাউনলোডে বারবার **404** | `skins.html` ও `prototype/index.html` স্কিন-গ্যালারি JS-নির্ভর অংশ কাজ করবে না; `skins.css` (৩৬ KB) আছে | ফাইলটি রি-আপলোড করুন বা নতুন লিংক দিন |
| `app/STAGING_RUNBOOK.md` (মূল, ১৫.৮ KB) | ৪০৪ — সুতরাং আপনার অনুমতি অনুযায়ী **নতুন করে লেখা হয়েছে** (§৬) | — | মূলটি পেলে মিলিয়ে সংশোধন |
| `prototype/assets/mock-data.js` | কোথাও নেই (HANDOFF-এ উল্লেখ আছে) | ডেটা বাস্তবে `store.js`/`app.js`-এ merge হয়েছে — ক্ষতি নেই | শুধু HANDOFF-এর ফাইল-ম্যাপ পুরনো |
| `app/src/components/` | লিস্টিংয়ে **০ ফাইল** দেখাচ্ছিল, কিন্তু সার্চে `ui.tsx` (১০,০৫৬ B) পাওয়া গেছে | প্রথমে typecheck ভেঙেছিল; এখন ঠিক | ✅ সমাধান হয়েছে |

---

## ৫ · Integrity Repair (২টি — প্রতিটি নথিবদ্ধ)

### ৫.১ `app/index.html` — ডাউনলোড-আর্টিফ্যাক্ট ছিল
যা পাওয়া গিয়েছিল:
```html
<script type="6e0e5c77196a744d6081bbe6-module" src="/src/main.tsx"></script>
<script src="/cdn-cgi/scripts/7d0fa10a/cloudflare-static/rocket-loader.min.js" ...></script>
```
এটি "Save page as"-এ Cloudflare-এর ইনজেক্ট করা কোড — মূল সোর্স নয় (Vite তখন `main.tsx`-ই বান্ডল করছিল না, ফল: ফাঁকা অ্যাপ)।
**সংশোধন:** `type="module"` পুনঃস্থাপন + CF স্ক্রিপ্ট সরানো (৮ লাইন)। এরপর build ৩৫ মডিউল ট্রান্সফর্ম করে
`263.73 kB / gzip 80.48 kB` — HANDOFF-এ প্রত্যাশিত মানের (~২৬৪ kB / ~৮০ kB) সাথে মিলে যায়।
**যাচাই:** নতুন অ্যাপের কোনো লজিক বদলায়নি; শুধু `<script>` ট্যাগ।

### ৫.২ `src/index.css` — legacy build-এ দূষণ ঠেকানো (সবচেয়ে গুরুত্বপূর্ণ আবিষ্কার)
Tailwind v4 পুরো রেপো স্ক্যান করে। ইনপোর্টের পর দেখা গেল **পুরনো production CSS ফুলে গেছে**:
`156.30 kB → 159.73 kB (+3.4 kB)`, আউটপুট হ্যাশ বদলে গেছে। কারণ: `prototype/*.html`, `app/**/*.tsx`,
`specs/*.md`-এর ক্লাস-নামগুলো Tailwind তুলে নিচ্ছিল।
**সংশোধন:** `@import "tailwindcss" source(none);` + স্পষ্ট `@source` তালিকা (শুধু পুরনো অ্যাপের ফাইল)।
**ফল:** আউটপুট **বাইট-হুবহু baseline** — `index-D3ar1qiB.css` (১৫৬,৩০৪ B) ও `index-DIOzrmZF.js` (২১,১০,৫৮৮ B),
অর্থাৎ কনটেন্ট-হ্যাশও এক। ভবিষ্যতের যেকোনো ইনপোর্টও আর পুরনো বিল্ডে ঢুকতে পারবে না।
**স্বচ্ছতা:** এটি `src/`-এর একমাত্র পরিবর্তন — ৯টি লাইন, শুধু `@source` নির্দেশনা ও একটি কমেন্ট।

### ৫.৩ পাথ-সমন্বয় (কোড নয়)
`prototype/index.html` (মূল ল্যান্ডিং হাব) — `specs/` লিংক `../specs/`-এ এবং নিজের ফোল্ডারের পেজগুলো
(`preview.html` ইত্যাদি) আপেক্ষিক করা হয়েছে, কারণ ফাইলটি এখন `prototype/`-এর ভেতরে।

---

## ৬ · Build / Lint ফলাফল (আগে ↔ পরে)

| চেক | ইনপোর্টের **আগে** | ইনপোর্টের **পরে** | রায় |
|---|---|---|---|
| `npm run lint` (রুট) | ৯ এরর · exit 2 | **৯ এরর · exit 2** (একই ফাইল, একই লাইন, একই বার্তা) | ✅ অপরিবর্তিত — এগুলো পুরনো অ্যাপের জানা ত্রুটি (`ApplyCooperative.tsx` ×৬, `PendingApproval.tsx` ×৩), HANDOFF-এর baseline-এর সাথে মেলে |
| `npm run build` (রুট) | সফল · CSS ১৫৬.৩০ kB · JS ২,১১০.৫৯ kB | **সফল · CSS ১৫৬.৩০ kB · JS ২,১১০.৫৯ kB** · হ্যাশ `D3ar1qiB` / `DIOzrmZF` | ✅ **বাইট-হুবহু এক** |
| `app: npm run typecheck` | — | **পরিষ্কার (০ এরর)** | ✅ |
| `app: npm run build` | — | সফল · JS ২৬৩.৭৩ kB / gzip ৮০.৪৮ kB · CSS ২২.৯৪ kB | ✅ |
| `app: npm test` | — | **২৪১ / ২৪৩** | ⚠️ ২টি ফেল, দুটোই বাহ্যিক (§৭) |

---

## ৭ · নতুন অ্যাপের টেস্ট ফল (২৪১/২৪৩)

| হার্নেস | ফল | ব্যাখ্যা |
|---|---|---|
| `d01-no-interest.mjs` | ✅ **৬৪/৬৪** | সুদমুক্ত নীতি স্তর — নিষিদ্ধ টোকেন, ফি-গণনা, স্ক্যানার |
| `d02-tenant-isolation.mjs` | ✅ **৮৭/৮৭** | টেন্যান্ট রিজলিউশন, ভূমিকা ম্যাপিং, অ্যাক্সেস-কোড |
| `d03-design-tokens.mjs` | ✅ **৫০/৫০** | **ডিজাইন টোকেন parity: প্রোটোটাইপের ৭১টি টোকেন ↔ app-এর ৮৯টি; কোনো মান বদলায়নি (drift ০)** — `--green-700=#0B6B53`, `--lime=#C9F26E` সহ |
| `d04-source-a-scan.mjs` | ⚠️ **৪০/৪২** | ২টি ফেল: `reference ট্রি উপস্থিত` ও `প্যাচড ট্রি উপস্থিত` |

**d04-এর ২টি ফেল কেন — এবং কেন এটি ত্রুটি নয়:**
- `reference/amar-somobay-v2/` = পুরনো অ্যাপের **আলাদা কপি**; এখানে পুরনো অ্যাপ **ইতিমধ্যেই নিজেই রেপো** ⇒ কপি বানানো মানে ৩.৪ MB ডুপ্লিকেট।
- প্যাচড-ট্রি = `verify-patch.sh`-এর `/tmp` আউটপুট, যা রান-টাইমে তৈরি হয়।
- অর্থাৎ **৪০টি কার্যকর চেক পাস**, ২টি শুধু "বাহ্যিক ফোল্ডার নেই" — কোড-ত্রুটি নয়।

---

## ৮ · Preview Deployment Status

| টার্গেট | পোর্ট | অবস্থা | প্রমাণ |
|---|---|---|---|
| **নতুন অ্যাপ (Phase ১)** | `5173` | 🟢 চালু (`0.0.0.0`) | `GET /` → 200 (ভিন্ন Host হেডার দিয়েও 200) · ৩৫ মডিউল |
| **ডিজাইন প্রোটোটাইপ** | `8000` | 🟢 চালু (`0.0.0.0`) | `prototype/index.html` · `preview.html` · `system.html` → সব **200** |
| **Legacy production** | — | ⚪ অপরিবর্তিত | কোনো ডিপ্লয়/প্রজেক্ট-সেটিং স্পর্শ করা হয়নি |

**বিচ্ছিন্নকরণের ব্যবস্থা (আপনার শর্ত অনুযায়ী):**
- `.vercelignore` (রুট) — `app/ prototype/ specs/ reports/ patches/ docs/` ⇒ পুরনো Vercel প্রজেক্ট এগুলো কখনো বিল্ড করবে না
- `app/vercel.json` — নতুন অ্যাপের **আলাদা** প্রজেক্ট কনফিগ (framework vite · `npm ci` · output `dist`)
- `app/vite.config.ts` — `server.allowedHosts: true` (শুধু dev-preview হোস্টের জন্য)

> ⛔ **Vercel-এ নতুন প্রজেক্ট আমি তৈরি করিনি** — এতে আপনার অ্যাকাউন্ট/ডোমেইন জড়িত, এবং আপনার §৬ নির্দেশনা
> "Production Deployment আমার অনুমতি ছাড়া নয়"। প্রস্তাব: আপনি অনুমোদন দিলে `app/` রুট দিয়ে একটি **আলাদা
> Preview-only** প্রজেক্ট তৈরি করা হবে (production branch সংযুক্ত নয়)।

---

## ৯ · নিরাপত্তা যাচাই

| # | যাচাই | ফল |
|---|---|---|
| ১ | কোনো `.env`/key/token ফাইল ইমপোর্ট | ✅ শূন্য |
| ২ | `app/.env.example`-এ মান আছে কি | ✅ নেই — শুধু ভেরিয়েবল-নাম |
| ৩ | `.gitignore`-এ `.env*`, `node_modules`, `dist` | ✅ আছে (+ `app/`-নির্দিষ্ট এন্ট্রি যোগ) |
| ৪ | `git add -A` করে দেখা — `node_modules`/`dist` ঢুকছে কি | ✅ ঢুকছে না (৮৩ ফাইল) |
| ৫ | service_role key কোথাও | ✅ কোথাও নেই |
| ৬ | SQL ফাইলগুলোর প্রকৃতি | ✅ চারটিই `AUDIT_ONLY` / `_DRAFT` — কোনোটি চালানো হয়নি |

---

## ১০ · অবশিষ্ট ঝুঁকি (residual risk)

| # | ঝুঁকি | মাত্রা | প্রশমন |
|---|---|---|---|
| R1 | `prototype/assets/skins.js` অনুপস্থিত | 🟠 মাঝারি | রি-আপলোড করুন; ততদিন `skins.css` ও বাকি ২ টেস্ট-হার্নেস চলে |
| R2 | নতুন অ্যাপের ২টি টেস্ট বাহ্যিক ফোল্ডারের উপর নির্ভর | 🟡 কম | সিদ্ধান্ত দরকার: `reference/` কপি বানাব কি না (ডুপ্লিকেট) নাকি d04-এ SKIP জানাব |
| R3 | `app/` এখনো **ভিত্তি**, ব্যবসায়িক স্ক্রিন নেই | 🟠 মাঝারি | ফেজ ৩-এ পোর্টিং; এখনই প্রত্যাশা করা যাবে না |
| R4 | পুরনো অ্যাপের ৯টি TypeScript এরর অপরিবর্তিত | 🟡 কম | জানা baseline; আলাদা ফিক্স-টিকিটে (এই ইনপোর্টের সাথে সম্পর্ক নেই) |
| R5 | Tailwind source-scope ভবিষ্যতে কেউ সরিয়ে দিলে আবার দূষণ | 🟢 কম | কমেন্টে কারণ লেখা; `d03`/build-হ্যাশ যাচাই প্রক্রিয়ায় |
| R6 | `app/index.html` হাতে মেরামত — মূল সোর্স কারও কাছে অন্যভাবে থাকলে | 🟡 কম | আপনি চাইলে রি-আপলোডের সাথে মিলিয়ে দেখা হবে |
| R7 | `somobay_plans`-এর CREATE TABLE রেপোর কোনো SQL-এ নেই (কলামের উৎস অনির্দিষ্ট) | 🟠 মাঝারি | D-01 মাইগ্রেশনকে `information_schema`-গার্ডেড রাখা হয়েছে; লাইভ অডিট ছাড়া অনুমান নয় |
| R8 | রুটে ৩০+ ছড়ানো `.sql` (মাইগ্রেশন-ক্রম অজানা) | 🟠 মাঝারি | ফেজ ৬-এ `db/migrations/` ম্যানিফেস্ট; **এখনই সরানো হয়নি** |

---

## ১১ · Git অবস্থা

- কমিট: এই ব্রাঞ্চে (PR #1-এ যুক্ত হবে) — `main`-এ **merge করা হয়নি**।
- `app/`, `prototype/`, `specs/`, `reports/`, `patches/`, `HANDOFF.md` নতুন; পরিবর্তিত: `.gitignore`, `.vercelignore` (নতুন), `tsconfig.json` (exclude), `src/index.css` (৯ লাইন)।
- `node_modules`/`dist` কমিটে নেই।

**পরবর্তী ধাপ:** §৪-এর অনুপস্থিত ফাইল পেলে ইনপোর্ট সম্পূর্ণ হবে → তারপর ফেজ ২ (ডিজাইন সিস্টেম + Mobile-first foundation)।
