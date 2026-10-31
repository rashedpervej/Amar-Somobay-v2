# Phase ১ প্রতিবেদন — D-01 (সম্পূর্ণ সুদমুক্ত) ও D-02 (Cross-Tenant Isolation)

**তারিখ:** ৩১ অক্টোবর ২০২৬ · **আওতা:** roadmap Phase ১ · **অবস্থা:** কোড ও পরীক্ষা সম্পন্ন, **DB পরিবর্তন অনুমোদনের অপেক্ষায়**

> এই প্রতিবেদনে আছে: প্রভাব-বিশ্লেষণ (Impact Report), মাইগ্রেশন পরিকল্পনা, টেস্ট ফলাফল,
> নিরাপত্তা-ঝুঁকি তালিকা, অবশিষ্ট ঝুঁকি এবং অনুমোদনের অপেক্ষায় থাকা সিদ্ধান্ত।
> **কোনো production বা staging ডেটাবেসে একটিও কুয়েরি চালানো হয়নি।** সব SQL ফাইল এখনো ড্রাফট।

---

## ১ · সারসংক্ষেপ

| বিষয় | অবস্থা |
|------|-------|
| D-01 নীতি স্তর (কোড) | ✅ তৈরি — `app/src/lib/noInterest.mjs` + স্ক্যানার |
| D-02 নীতি স্তর (কোড) | ✅ তৈরি — `app/src/lib/tenant.mjs` + মক-RLS পরীক্ষা |
| ডিজাইন সিস্টেম পোর্ট (প্রোটোটাইপ → React) | ✅ টোকেন হুবহু পোর্ট, সমতা পরীক্ষা পাস |
| Source A-র জন্য কোড প্যাচ | ✅ ২টি প্যাচ, ৯ ফাইল, ৩২ সম্পাদনা; প্রয়োগযোগ্যতা প্রমাণিত |
| DB অডিট স্ক্রিপ্ট (শুধু SELECT) | ✅ ২টি ফাইল, ২৫টি কুয়েরি — **চালানো হয়নি** |
| DB মাইগ্রেশন / remediation ড্রাফট | ✅ ২টি ফাইল — **অনুমোদন ছাড়া চালানো যাবে না** |
| অফলাইন টেস্ট | ✅ ২৬৩/২৬৩ চেক পাস (৪টি হার্নেস) |
| Staging-এ লাইভ যাচাই | ⏳ বাকি — রানবুক দেওয়া হয়েছে (`app/STAGING_RUNBOOK.md`) |

**যা ইচ্ছাকৃতভাবে বদলানো হয়নি:** বিলম্ব ফি/জরিমানা (`late_fee_amount`, `pending_fine`,
`penalty_paid`), কোনো টেবিল/কলাম DROP, বিদ্যমান কোনো আর্থিক সারি, production DB, GitHub repo।

---

## ২ · কী কী তৈরি হলো

| পথ | বিবরণ | মাপ |
|----|-------|-----|
| `app/src/lib/noInterest.mjs` (+`.d.mts`) | D-01 নীতি স্তর: নিষিদ্ধ ফিল্ড/টার্ম, অনুমোদিত বিকল্প, বাংলা সংখ্যা-সহ পরীক্ষা | browser-safe |
| `app/src/lib/noInterestScan.mjs` | উৎস-ট্রি স্ক্যানার (Node-only) | — |
| `app/src/lib/tenant.mjs` (+`.d.mts`) | D-02 নীতি স্তর: org resolution, ভূমিকা ম্যাপিং, টেবিল-স্কোপিং, অ্যাক্সেস কোড | — |
| `app/src/lib/money.mjs`, `supabaseClient.ts` | টাকা হিসাব, নিরাপদ ক্লায়েন্ট (env না থাকলে থেমে যায়) | — |
| `app/src/styles/tokens.css`, `base.css`, `index.css` | প্রোটোটাইপের `:root`/`--qh-*`/QH থিম হুবহু + Tailwind v4 ম্যাপিং | — |
| `app/src/pages/DesignSystemPage.tsx`, `PolicyPage.tsx`, `components/ui.tsx` | ভিত্তি UI, ডিজাইন সিস্টেম ও নীতি প্রদর্শনী | — |
| `app/tests/d01…d04`, `run-all.mjs`, `_harness.mjs`, `_mockDb.mjs` | ৪টি হার্নেস + একত্রিত রানার | ২৬৩ চেক |
| `app/tools/make-patches.py`, `tools/verify-patch.sh` | প্যাচ উৎপাদন ও প্রয়োগ-যাচাই পাইপলাইন | — |
| `app/db/*.sql` (৪টি) | অডিট ×২, মাইগ্রেশন/remediation ড্রাফট ×২ | ৭.৬ + ১২.৪ + ১০.৬ + ৩৫.৭ KB |
| `app/STAGING_RUNBOOK.md`, `app/README.md`, `patches/README.md` | ধাপে ধাপে যাচাই তালিকা ও নির্দেশিকা | — |
| `patches/0001-D01-zero-interest.patch` | ৪ ফাইল, ২১ যোগ-লাইন | ১৪ ৮৮৭ B |
| `patches/0002-D02-tenant-isolation.patch` | ৬ ফাইল, ৮৪ যোগ-লাইন | ২২ ১৪৭ B |

---

## ৩ · Impact Report

### ৩.১ D-01 — সম্পূর্ণ সুদমুক্ত

**নীতি:** কোনো মডিউলে (সাধারণ সঞ্চয়, ROSCA, Joint Goal, Qard Hasanah) শতকরা-ভিত্তিক সুদ/মুনাফা
থাকতে পারবে না। নিষিদ্ধ ফিল্ড: `profit_percentage`, `interest_rate`, `profit_rate`, `riba_rate`,
`markup_percentage`, `dividend_rate`; নিষিদ্ধ কপি: "X% মুনাফা", "সুদের হার", ইত্যাদি।

| স্তর | প্রভাব | কী করা হলো |
|------|--------|-------------|
| **UI** | স্কিম তৈরি/সম্পাদনার "লভ্যাংশ (%)" ইনপুট, ইনসাইটস-এর "X% মুনাফা" সারি, AGM নমুনা ঘোষণা | ইনপুট সরিয়ে লক-ঘোষণা "সুদ ৳০ (নীতি D-01)"; ইনসাইটস সারি বদলে নীতি-ঘোষণা; AGM কপি পরিমার্জন |
| **Backend/ক্লায়েন্ট লজিক** | `createPlan`/`updatePlan` payload-এ সুদের মান ঢুকতে পারত | দুই পথেই নিষিদ্ধ ফিল্ড মুছে ফেলা + `profit_percentage: 0` বাধ্যতামূলক |
| **API** | সব লেখা ব্রাউজার → Supabase (আলাদা API স্তর নেই); তাই স্কোপ RLS/ট্রিগারে | DB ট্রিগার `tr_enforce_zero_interest_plans` (ড্রাফট) — ০ ছাড়া মান লিখতে গেলে মান ০ হবে ও অডিট লগ পড়বে |
| **Database** | `somobay_plans.profit_percentage` কলাম বিদ্যমান | কলাম **DROP করা হয়নি**; `DEFAULT 0` + `CHECK (COALESCE(profit_percentage,0)=0)` (`NOT VALID`→`VALIDATE`) + কলাম মন্তব্য |
| **Validation** | ক্লায়েন্টে কোনো বাধা ছিল না | নীতি স্তর `noInterest.mjs` + হার্নেস d01/d04 স্বয়ংক্রিয় পরীক্ষা |
| **Reports** | `SavingsInsights` মুনাফা দেখাত | মুনাফা প্রদর্শন বন্ধ; বিলম্ব ফি/জরিমানা প্রদর্শন **বহাল** |

**অপরিবর্তিত (সিদ্ধান্ত Q1 = `only_interest` অনুযায়ী):** `late_fee_amount`, `pending_fine`,
`penalty_paid`, `PlanManagement.tsx:177`-এর `late_fee_amount: 50`, `QuickCollectModal`/`ReceiptModal`-এর
জরিমানা UI, `SOMOBAY_PRODUCTION_MASTER_MIGRATION.sql:135-259`।

**চিহ্নিত কিন্তু পরিবর্তন-বিহীন অসঙ্গতি:** "জিরো পেনাল্টি" লেখা (`GeneralSavingsSettings.tsx:294`,
`PlanManagement.tsx:662`) বিদ্যমান জরিমানা লজিকের সাথে সাংঘর্ষিক — এটি **ফ্ল্যাগ করা হলো**,
কপি বদলানো হয়নি (ব্যবসায়িক সিদ্ধান্ত দরকার)।

### ৩.২ D-02 — Cross-tenant isolation

**নীতি:** এক সমবায়ের ডেটা অন্য সমবায় থেকে পড়া/লেখা যাবে না; ভূমিকা ও সদস্যপদ সার্ভারে যাচাই হবে;
ক্লায়েন্টের পাঠানো org id কখনো বিশ্বাসযোগ্য নয়।

| স্তর | প্রভাব |
|------|--------|
| **কোড (প্যাচ করা)** | ৯টি ঝুঁকিপূর্ণ পথ বন্ধ (§৬-এর F-01…F-06, P6) |
| **RLS** | ১৭টি টেবিলের ৪৬টি অ-নিরাপদ নীতি বাতিলের ড্রাফট → ২১টি টেবিলে ৪৬টি tenant-স্কোপড নীতি; ২১টি টেবিলে RLS চালু |
| **ট্রিগার** | `require_tenant_org()` (১৫টি টেবিলে BEFORE INSERT): NULL org, হার্ডকোডেড ডিফল্ট org, অ-সদস্য → বাতিল |
| **অডিট অখণ্ডতা** | `audit_logs` ও `member_actions`-এ UPDATE/DELETE নীতি নেই; `plan_payments`-এ DELETE নীতি নেই |
| **ফাংশন নিরাপত্তা** | helper ফাংশনগুলো `SET search_path = public, pg_temp` সহ পুনঃতৈরি; `protect_profile_privileged_columns` এখন বৈশ্বিক admin-কে যেকারও `role`/`status` বদলাতে দেয় না |
| **Storage/Realtime/Export** | ড্রাফট কমেন্ট করা অবস্থায় আছে (§৭ অবশিষ্ট ঝুঁকি) — Phase ১-এ চালানো হয়নি |

**ব্যবহারকারী-দৃশ্যমান পরিবর্তন:** membership ছাড়া বৈশ্বিক admin এখন কোনো সমবায়ের ডেটা দেখবেন না;
ড্যাশবোর্ডের সদস্য সংখ্যা শুধু নিজ সমবায়ের হবে; org নির্ধারণ না হলে উত্তোলন/আদায় থেমে যাবে
(নীরবে অন্য সমবায়ে লিখবে না)।

---

## ৪ · Migration Plan (অনুমোদন-সাপেক্ষ)

**মূলনীতি:** additive only · কোনো DROP TABLE/DROP COLUMN/TRUNCATE/DELETE FROM নেই ·
বিদ্যমান আর্থিক সারি অপরিবর্তিত · প্রতিটি ধাপ আগে অডিট, তারপর অনুমোদন, তারপর প্রয়োগ।

| ধাপ | ফাইল | প্রকৃতি | প্রিফ্লাইট |
|----|------|--------|----------|
| ০ | — | ব্যাকআপ + restore পরীক্ষা (staging) | PITR স্ন্যাপশট |
| ১ | `app/db/D02_tenant_isolation__AUDIT_ONLY.sql` (১৪ কুয়েরি) | **শুধু SELECT** | নেই — নিরাপদ |
| ১ | `app/db/D01_zero_interest__AUDIT_ONLY.sql` (১১ কুয়েরি) | **শুধু SELECT** | নেই — নিরাপদ |
| ২ | — | অডিট ফলাফল পর্যালোচনা → লিখিত অনুমোদন | — |
| ৩ | `patches/0001`, `patches/0002` | কোড (branch) | `git apply --check` rc=0, tsc parity ৯=৯ |
| ৪ | `app/db/D02_tenant_isolation__REMEDIATION_DRAFT.sql` (৫২১ লাইন) | নীতি/ট্রিগার/ফাংশন | ১টির বেশি org থাকলে ব্যাকফিল নিজেই থামে (`allow_single_org_backfill := false`) |
| ৫ | `app/db/D01_zero_interest__MIGRATION_DRAFT.sql` (১৮১ লাইন) | DEFAULT + ট্রিগার + CHECK | শূন্য-ভিন্ন `profit_percentage` থাকলে `RAISE EXCEPTION` (কোনো ডেটা বদলায় না) |
| ৬ | `app/STAGING_RUNBOOK.md` §৭ | Negative + positive টেস্ট (২ org, N1–N14) | — |
| ৭ | — | Sign-off → production | লিখিত অনুমোদন |

**রোলব্যাক:** প্রতিটি ধাপের বিপরীত ক্রিয়া সংশ্লিষ্ট ফাইলের শেষে কমেন্ট করা আছে; নীতি ফেরাতে
প্রতিটি `DROP POLICY`-র পাশে লেখা আছে নীতিটি Source A-র কোন ফাইলের কোন লাইন থেকে এসেছিল।
সতর্কতা: Source A-র `MULTI_TENANT_FOUNDATION_DOWN.sql` **কখনো চালানো যাবে না** — এটি অ-নিরাপদ
ফলব্যাক নীতি ফিরিয়ে আনে; রোলব্যাকের জন্য remediation ফাইলের নিজস্ব অনুচ্ছেদ ব্যবহার করুন।

---

## ৫ · Test Results (সব অফলাইন; কোনো DB সংযোগ নেই)

### ৫.১ হার্নেস

| হার্নেস | চেক | ফলাফল | কী প্রমাণ করে |
|--------|-----|-------|----------------|
| `d01-no-interest.mjs` | ৭১ | ✅ ৭১/৭১ | নীতি স্তরের নিয়ম, বাংলা সংখ্যা-সহ কপি পরীক্ষা, প্রোটোটাইপের ১৯৯ স্ক্রিনে লঙ্ঘন ০, Source A baseline-এ ১০টি লঙ্ঘন ধরা পড়ে ও প্যাচের পর ০ |
| `d02-tenant-isolation.mjs` | ৮৭ | ✅ ৮৭/৮৭ | CURRENT নীতিতে ৮টি টেবিল + profiles-এ cross-tenant ফাঁস; REMEDIATED নীতিতে ৬ ভূমিকা × ২০ টেবিলে ফাঁস ০; অডিট অপরিবর্তনীয়; payment মোছা যায় না; suspended সদস্য বাধাপ্রাপ্ত |
| `d03-design-tokens.mjs` | ৫০ | ✅ ৫০/৫০ | প্রোটোটাইপ `:root`-এর সাথে হুবহু সমতা (০ অনুপস্থিত, ০ বিচ্যুত), ৮১টি `@theme` রেফারেন্স (০ ঝুলন্ত), base.css ডিসিপ্লিন |
| `d04-source-a-scan.mjs` | ৫৫ | ✅ ৫৫/৫৫ | Source A baseline-এ D-01 লঙ্ঘন ১০ + D-02 প্যাটার্ন ৯; প্যাচের পর দুটোই ০; প্যাচ গঠন ঠিক; **AUDIT ফাইলে লেখার statement নেই**; ড্রাফটে destructive statement নেই |
| **মোট** | **২৬৩** | ✅ **২৬৩/২৬৩** | `node tests/run-all.mjs` → exit 0 |

### ৫.২ প্যাচ প্রয়োগ ও টাইপ-parity (`bash app/tools/verify-patch.sh` → exit 0)

| যাচাই | ফলাফল |
|-------|-------|
| `git apply --check -p1` (দুই প্যাচ, বিশুদ্ধ কপি) | rc=0, rc=0 |
| ধারাবাহিক প্রয়োগ (0001 → 0002) পর ট্রি == প্রত্যাশিত ট্রি | হুবহু অভিন্ন |
| প্রয়োগের পর Source A `src/`-এ D-01 error | baseline ১০ → **০** |
| প্রয়োগের পর D-02 ঝুঁকিপূর্ণ প্যাটার্ন | baseline ৯ → **০** |
| `npx tsc --noEmit` baseline vs patched | **৯ = ৯**, তালিকা হুবহু এক (নতুন error নেই) |

পুরনো ৯টি error Source A-র নিজস্ব (`ApplyCooperative.tsx` ×৬ `is_admin_blocked`/`admin_blocked_reason`,
`PendingApproval.tsx` ×৩ `user`/`fetchMemberships`) — প্যাচ সেগুলো স্পর্শ করে না।

### ৫.৩ বিল্ড

- `app/`: `npx tsc --noEmit` পরিষ্কার · `vite build` সফল — ২৬৩.৭৩ kB JS (gzip ৮০.৪৮ kB), ২২.৯৪ kB CSS
- Source A (প্যাচড): `npm run build` সফল, tsc parity উপরে

### ৫.৪ টেস্টের সীমা (সৎভাবে)

মক DB (`tests/_mockDb.mjs`) Postgres/RLS-এর **অনুকরণ**, আসল ইঞ্জিন নয়। তাই প্রকৃত RLS আচরণ,
ট্রিগার, `search_path` ও Storage নীতি নিশ্চিত করতে `STAGING_RUNBOOK.md`-এর N1–N14 টেস্ট
staging-এ চালানো বাধ্যতামূলক।

---

## ৬ · Security Findings

**তীব্রতা:** 🔴 উচ্চ · 🟠 মধ্যম · 🟡 নিম্ন · **অবস্থা:** 🩹 = কোড প্যাচে সমাধান · 📄 = SQL ড্রাফটে সমাধান (অনুমোদনের অপেক্ষায়) · ⏳ = পরবর্তী ফেজ

| ID | তীব্রতা | ঝুঁকি | উৎস (file:line) | অবস্থা |
|----|--------|-------|------------------|-------|
| **F-01** | 🔴 | বৈশ্বিক `profiles.role === 'admin'` থাকলেই যেকোনো সমবায়ে প্রবেশ ও `cooperative_admin` ভূমিকা ধরে নেওয়া | `CooperativeTenantGuard.tsx:63,112,142` | 🩹 প্যাচ 0002 |
| **F-02** | 🔴 | নোটিফিকেশন "সব admin"-কে (`profiles.role='admin'`) → অন্য সমবায়ের admin-এর কাছে আর্থিক তথ্য; `organization_id: orgId \|\| null` লেখা | `qardHasanahService.ts` (নোটিফিকেশন ব্লক) | 🩹 প্যাচ 0002 |
| **F-03** | 🔴 | org না পেলে হার্ডকোডেড ডিফল্ট সমবায় `00000000-0000-0000-0000-000000000001`-এ উত্তোলন/আদায় লেখা | `withdrawalService.ts:128`, `QuickCollectModal.tsx:178` | 🩹 প্যাচ 0002 |
| **F-04** | 🔴 | QH তহবিল সারাংশ/বরাদ্দ/বিতরণ/খতিয়ান org স্কোপ ছাড়া (`qard_funds … .limit(1)`) | `qardHasanahService.ts`, কলার `AdminQardHasanah.tsx:89,203` | 🩹 প্যাচ 0002 |
| **F-04b** | 🔴 | `FOR ALL` নীতি যেকোনো বৈশ্বিক `profiles.role='admin'`-কে `plan_payments`, `somobay_plans`, `member_plans`-এ অবাধ লেখার অনুমতি দেয় | `fix_schema.sql:47-59`, `supabase_security_fixes.sql:117-125` | 📄 remediation ধাপ ৩–৫ |
| **F-05** | 🟠 | সদস্য তালিকা/পিকার বৈশ্বিক `profiles.role='member'` থেকে → অন্য সমবায়ের সদস্য দৃশ্যমান | `QuickCollectModal.tsx:183,202`, `qardHasanahService.ts` | 🩹 প্যাচ 0002 |
| **F-06** | 🟠 | `member_actions` টেবিলের কোনো CREATE TABLE ও কোনো RLS নেই (কেবল INSERT নীতি `MASTER_MIGRATION:382`), কিন্তু ৫টি ক্লায়েন্ট কল সাইট | repo SQL | 📄 remediation (RLS + অপরিবর্তনীয়তা) |
| **F-07** | 🔴 | `protect_profile_privileged_columns` (`SECURITY DEFINER`, `search_path` সেট নেই) যেকোনো বৈশ্বিক admin-কে যেকারও `role`/`status` বদলাতে দেয় | `supabase_security_fixes.sql:18-40` | 📄 remediation ধাপ ২ (ফাংশন পুনঃতৈরি + `SET search_path`) |
| **F-08** | 🟠 | `USING (true)` নীতি ৯টি টেবিলে (profiles, organizations, somobay_plans, rosca_periods, joint_goal_expenses, wallet_transactions, qard_funds, app_settings, promotions) — **লাইভ অবস্থা অজানা** (repo-র মাইগ্রেশনগুলো পরস্পরবিরোধী) | একাধিক মাইগ্রেশন ফাইল | 📄 remediation; আগে অডিট চালিয়ে নিশ্চিত হতে হবে |
| **P6** (নতুন) | 🟠 | `fetchAdminStats` সদস্য সংখ্যা বৈশ্বিক `profiles.role='member'` থেকে গুনে **সব সমবায়ের সংখ্যা মিশিয়ে** দেয়; বাকি কুয়েরিও RLS-নির্ভর | `useSomobayStore.ts:261-297` | 🩹 প্যাচ 0002 (এই প্রতিবেদনে যোগ হলো) |
| **S-01** | 🟡 | Storage bucket নীতি org-স্কোপড কিনা অযাচাইত | repo-তে নীতি অস্পষ্ট | ⏳ ড্রাফট কমেন্ট করা; staging-এ যাচাই |
| **S-02** | 🟡 | Realtime publication ও এক্সপোর্ট/রিপোর্ট ডাউনলোডে org স্কোপ নেই | — | ⏳ Phase ২ |
| **S-03** | 🟡 | **২২১/২৬৭** `.from()` কল org-স্কোপ ছাড়া (member_plans ৩৬, profiles ৩০, somobay_plans ২৮, plan_payments ২৬, organizations ১৭, rosca_periods ১০, organization_members ১০, qard_funds ৮, notifications ৮) | পুরো `src/` | ⏳ Phase ২–৩ (RLS সক্রিয় থাকলে ঝুঁকি সীমিত, কিন্তু defense-in-depth অসম্পূর্ণ) |
| **S-04** | 🟡 | ক্লায়েন্ট থেকে org id পাঠানো হয় (`AddMemberModal.tsx:121,125`, `QuickCollectModal.tsx:183,202`) — RLS সক্রিয় না থাকলে বিশ্বাসযোগ্য | কম্পোনেন্ট | 📄 ট্রিগার `require_tenant_org()` + নীতি; কোড সাইড Phase ২ |

**অক্ষত রাখা হয়েছে (নিরাপদ হিসেবে যাচাইকৃত):** `MULTI_TENANT_FOUNDATION_UP.sql`-এর helper ফাংশন
(`is_platform_admin`, `get_user_org_role`, `is_org_member`, `is_org_admin`, `is_org_collector_or_admin` —
সবগুলোতে `SET search_path = public, pg_temp` ও `REVOKE ALL FROM public`), `organization_id` ব্যাকফিল/ইনডেক্স
(১৪ টেবিল), ট্রিগার `protect_org_member_escalation`, `validate_tenant_child_integrity`,
`validate_savings_withdrawal_tenant`, এবং tenant নীতি `:297-580`।

---

## ৭ · অবশিষ্ট ঝুঁকি (residual risk)

1. **লাইভ RLS অবস্থা অজানা।** repo-র মাইগ্রেশন ফাইলগুলো পরস্পরবিরোধী (কোথাও tenant-স্কোপড,
   কোথাও `USING (true)`); last-applied-wins। তাই আসল অবস্থা জানার একমাত্র উপায়
   `D02_tenant_isolation__AUDIT_ONLY.sql` চালানো। **অডিট ছাড়া remediation চালানো নিরাপদ নয়।**
2. **মক ≠ Postgres।** d02 হার্নেস নীতির *যুক্তি* প্রমাণ করে, ইঞ্জিনের আচরণ নয় → N1–N14 staging টেস্ট বাধ্যতামূলক।
3. **ক্লায়েন্ট স্কোপিং অসম্পূর্ণ (S-03)।** ২২১টি কল org-স্কোপ ছাড়া; RLS সক্রিয় থাকলেও defense-in-depth দুর্বল।
4. **Storage/Realtime/Export (S-01, S-02)** Phase ১-এ ড্রাফট মাত্র — ফাইল-স্তরের ফাঁস এখনো সম্ভব।
5. **`member_actions` টেবিলের সংজ্ঞা repo-তে নেই (F-06)** — লাইভ স্কিমা ও repo ভিন্ন হতে পারে;
   remediation-এর ধাপগুলো `information_schema` গার্ড দিয়ে লেখা, তবু অডিট ফলাফল আগে দেখা দরকার।
6. **Source A-র ৯টি পুরনো tsc error** অপসারিত হয়নি (আওতার বাইরে) — `npm run build` চললেও টাইপ-নিরাপত্তা অসম্পূর্ণ।
7. **Super Admin অ্যাপ (পোর্ট ৪০০১) repo-তে নেই** — platform-owner স্তরের অ্যাক্সেস অযাচাইত (gate item ৯)।
8. **ঐতিহাসিক সুদের ডেটা (gate item ১০)** অস্পৃশ্য — অডিটে শূন্য-ভিন্ন `profit_percentage` পাওয়া গেলে
   D-01 migration থেমে যাবে; তখন আলাদা অনুমোদন ও remediation পরিকল্পনা লাগবে।
9. **কপি অসঙ্গতি ("জিরো পেনাল্টি" বনাম সক্রিয় জরিমানা)** — ব্যবহারকারীকে বিভ্রান্ত করতে পারে; সিদ্ধান্ত বাকি।

---

## ৮ · অনুমোদনের অপেক্ষায় থাকা সিদ্ধান্ত

| কোড | প্রশ্ন | ডিফল্ট (যদি অনুমোদন না আসে) |
|-----|--------|------------------------------|
| **D-01c** | `লভ্যাংশ`/dividend কি নিষিদ্ধ? (সমবায় আইনে সঞ্চয়ের লভ্যাংশ বৈধ; ঋণে সুদ নিষিদ্ধ) | বর্তমানে `warn` স্তরে — ব্লক করা হয়নি |
| **D-02a** | `allow_single_org_backfill` — একটিমাত্র org থাকলে NULL সারি ব্যাকফিল করা যাবে? | ডিফল্ট `false` (বন্ধ) |
| **D-02b** | Storage নীতি ড্রাফট staging-এ চালানো হবে? | কমেন্ট করা অবস্থায় রাখা হয়েছে |
| **গেট ২–৭, ৯, ১০** | QH ডুপ্লিকেট স্কিম সারি, hard-delete→void/reversal, atomic withdrawal RPC, একক ভূমিকা মডেল + ৫ নতুন ভূমিকা, ১৫টি নতুন টেবিল, কৃত্রিম সীমা অপসারণ, Super Admin P-01…P-12, ঐতিহাসিক সুদ remediation | **অনুমোদিত নয়** — Phase ১-এ স্পর্শ করা হয়নি |

---

## ৯ · পরবর্তী ধাপ (প্রস্তাব)

1. **অডিট চালান** (staging বা production-এ শুধু SELECT): দুটি AUDIT ফাইল → আউটপুট এই প্রতিবেদনে যুক্ত করুন।
2. অডিট ফলাফলের ভিত্তিতে **ধাপ ৪ ও ৫ অনুমোদন** করুন (বা সংশোধন বলুন)।
3. প্যাচ দুটি Source A branch-এ প্রয়োগ করে `verify-patch.sh` চালান → তালিকার N1–N14 টেস্ট সম্পন্ন করুন।
4. **D-01c** ও "জিরো পেনাল্টি" কপি অসঙ্গতি নিয়ে সিদ্ধান্ত দিন।
5. এরপর Phase ২: স্ক্রিন পোর্টিং (প্রোটোটাইপ ডিজাইন সিস্টেমে), অবশিষ্ট ২২১ কলের org-স্কোপিং,
   Storage/Realtime isolation, এবং গেট ২–৭-এর আইটেম।

---

### সংযুক্তি

- `app/db/D01_zero_interest__AUDIT_ONLY.sql`, `app/db/D02_tenant_isolation__AUDIT_ONLY.sql`
- `app/db/D01_zero_interest__MIGRATION_DRAFT.sql`, `app/db/D02_tenant_isolation__REMEDIATION_DRAFT.sql`
- `patches/0001-D01-zero-interest.patch`, `patches/0002-D02-tenant-isolation.patch` (+`patches/README.md`)
- `app/STAGING_RUNBOOK.md`, `app/README.md`, `app/tools/verify-patch.sh`
- পূর্ববর্তী প্রতিবেদন: `reports/qard-hasanah-phase3a-report.md`, পরিকল্পনা: `specs/06-consolidation-and-integration-plan.md`, `specs/03-multi-module-platform-architecture.md`
