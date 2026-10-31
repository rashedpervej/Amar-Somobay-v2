# HANDOFF — Somobay প্রজেক্ট (নতুন চ্যাটে কাজ চালানোর সম্পূর্ণ নির্দেশিকা)

> **এই ফাইলটি আগে পড়ুন।** এখানে প্রজেক্টের অবস্থা, ব্যবহারকারীর অপরিবর্তনীয় নির্দেশনা,
> ফাইল ম্যাপ, চালানোর কমান্ড, মুলতুবি অনুমোদন ও known-gotcha সব আছে।
> নতুন চ্যাটে এই ফাইল + বাকি ওয়ার্কস্পেস আপলোড করলেই পুরো প্রসঙ্গ পাওয়া যাবে।

**সর্বশেষ হালনাগাদ:** ৩১ অক্টোবর ২০২৬ · **ফেজ:** Phase ১ সম্পন্ন (কোড + টেস্ট), DB অনুমোদনের অপেক্ষায়

---

## ১ · প্রজেক্ট কী

**Somobay** = বাংলাদেশের সমবায় সমিতির জন্য multi-tenant SaaS (একেকটি সমবায় = একেকটি org/tenant)।
চারটি আর্থিক মডিউল:

1. **সাধারণ সমবায় সঞ্চয়** (General Cooperative Savings) — প্রাথমিক ডিজাইন রেফারেন্স
2. **ROSCA** (মেয়াদি/রোটেশনাল সঞ্চয়)
3. **Joint Goal** (যৌথ সঞ্চয়)
4. **Qard Hasanah** — সম্পূর্ণ **সুদমুক্ত** সহায়তা মডিউল, আলাদা ওয়ার্কফ্লো, শুধু Admin-অনুমোদিত
   যোগ্য সদস্য আবেদন করতে পারেন

ভাষা বাংলা, অঙ্কে বাংলা সংখ্যা। ব্যবহারকারী: গ্রামীণ + শহরে স্মার্ট, ১৮–৫০ বছর; আধুনিক ফিনটেক ডিজাইন।
ভূমিকা: Admin, Member, Collector, Accountant, Manager, Approver, Org Admin, Auditor (+ প্ল্যাটফর্ম Super Admin)।

**আইনি ভিত্তি:** সমবায় সমিতি আইন ২০০১ (সংশোধিত ২০০২, ২০১৩), বিধিমালা ২০০৪ (সংশোধিত ২০২০),
জাতীয় সমবায় নীতিমালা ২০১২।

**দুটি কোডবেস আছে:**
- **প্রোটোটাইপ** (`prototype/`) — HTML/CSS/JS, ১৯৯ স্ক্রিন (META), ডিজাইন সিস্টেমের **চূড়ান্ত উৎস**
- **Source A** (`reference/amar-somobay-v2/`) — ব্যবহারকারীর বিদ্যমান production React+Supabase অ্যাপ
  (GitHub `rashedpervej/Amar-Somobay-v2`, commit `4f066ed`) — আমাদের push অ্যাক্সেস নেই, তাই **প্যাচ** দেওয়া হয়

---

## ২ · ব্যবহারকারীর অপরিবর্তনীয় নির্দেশনা (লঙ্ঘন করা যাবে না)

1. **কোনো মডিউলে সুদ/মুনাফা নয় (D-01)।** নিষিদ্ধ: `profit_percentage`, `interest_rate`, `profit_rate`,
   `riba_rate`, `markup_percentage`, `dividend_rate`, "X% মুনাফা" কপি।
   **তবে বিলম্ব ফি/জরিমানা বহাল** (`late_fee_amount`, `pending_fine`, `penalty_paid`) — সিদ্ধান্ত Q1 = `only_interest`।
2. **Cross-tenant isolation বাধ্যতামূলক (D-02):** RLS + backend/API/RPC; ভূমিকা ও সদস্যপদ **সার্ভারে** যাচাই;
   ক্লায়েন্টের পাঠানো org id কখনো বিশ্বাস নয়; Storage/Reports/Exports/Realtime আওতায়;
   ≥২টি টেস্ট org দিয়ে positive **ও** negative টেস্ট।
3. **destructive DB migration নয়**, বিদ্যমান আর্থিক ডেটা বদলানো নয়, সরাসরি production DB পরিবর্তন নয় —
   আগে **Migration Plan + Impact Report** দেখিয়ে অনুমোদন নিতে হবে। কোনো কলাম/টেবিল DROP নয়।
4. **প্রতিটি পরিবর্তনের পর রিপোর্ট:** Test Results · Security Findings · অবশিষ্ট ঝুঁকি (residual risk)।
5. **Phase 1-এর কোড নতুন `app/` ট্রিতে** + Source A-র জন্য আলাদা প্যাচ (Q2 = `new_app_tree`)।
   DB/নিরাপত্তা টেস্ট এখন **অফলাইন** (Q3 = `offline_now`); staging ব্যবহারকারী পরে চালাবেন।
6. **প্রোটোটাইপের ডিজাইন ভাষাই চূড়ান্ত ডিজাইন সিস্টেম।** পুরনো অ্যাপের UI/রং/স্পেসিং/টাইপোগ্রাফি/কম্পোনেন্ট
   চাপানো যাবে না; পুরনো ওয়ার্কফ্লো নতুন UI-তে adapt করতে হবে। Web ও Mobile আলাদাভাবে ডিজাইন;
   ভূমিকা অনুযায়ী navigation/UX আলাদা।
7. **Consolidation-এ কিছুই হারানো যাবে না:** প্রোটোটাইপে নেই এমন পুরনো ফিচার যোগ করতে হবে,
   প্রোটোটাইপের নতুন ফিচার রাখতে হবে, ডুপ্লিকেট পেজ/টেবিল/লজিক নয়, কোনো ফিচার/ওয়ার্কফ্লো/পারমিশন বাদ নয়;
   পুরনো ফিচার সরানোর আগে উদ্দেশ্য ও বিকল্প বিশ্লেষণ করতে হবে।
8. **সিক্রেট/service-role key/env ক্রেডেনশিয়াল কখনো প্রকাশ নয়।** RBAC ও multi-tenant নিরাপত্তা,
   আর্থিক/অনুমোদন/অডিট নির্ভুলতা অক্ষুণ্ন রাখতে হবে; নতুন UI বিদ্যমান Supabase ব্যাকএন্ডেই চলবে।
9. **ব্যবসায়িক নিয়ম অনুমান নয়** — অজানা নিয়ম → ফ্ল্যাগ করা সিদ্ধান্ত (D-কোড)।
   "ডিফল্ট ধরে করো আগে" শুধু অ-আর্থিক ডিফল্টের জন্য প্রযোজ্য। অনুমানকে বিদ্যমান ফিচার বলে চালানো যাবে না।
10. **ধাপে ধাপে কাজ** ("Step by step koro"); প্রতিটি ধাপের পর যাচাই।
11. মোডাল/ড্রপডাউন পেজ নয়; Member ও Admin একই পেজ ব্যবহার করলে সেটি **দুই পেজ**; শেয়ার্ড কম্পোনেন্ট পেজ নয়।
    Mobile-first, একক backend/DB/API/নিয়ম; **Admin মোবাইল অ্যাপে Admin ওয়েবের সম্পূর্ণ parity**;
    প্রতিটি ANAV সেকশন হ্যামবার্গার ড্রয়ার থেকে পৌঁছানো যায়।
12. Super Admin প্যানেল আর্কিটেকচারে হিসাব করা আছে কিন্তু এখনো ডিজাইন হয়নি (আলাদা অ্যাপ, পোর্ট ৪০০১, repo-তে নেই)।

---

## ৩ · বর্তমান অবস্থা (কী সম্পন্ন, কী বাকি)

### সম্পন্ন

| অংশ | প্রমাণ/পথ |
|------|-----------|
| প্রোটোটাইপ ১৯৯ স্ক্রিন (Web ৭৭ · App ৭৪ · Member ৪০ · Shared ৮), ১২৫ লজিক্যাল | `prototype/`, `reports/qard-hasanah-phase3a-report.md` |
| Consolidation/ইন্টিগ্রেশন পরিকল্পনা (A–E, ১০-আইটেম গেট, রোডম্যাপ ফেজ ০–৮) | `specs/06-consolidation-and-integration-plan.md` (৬৯৬ লাইন) |
| আর্কিটেকচার (QH §8.4, eligibility §7, BR-20…28, flows §8.8, D-কোড) | `specs/03-multi-module-platform-architecture.md` (১৩৪২ লাইন) |
| Phase ১ React ভিত্তি: ডিজাইন টোকেন পোর্ট, D-01/D-02 নীতি স্তর, ভিত্তি UI | `app/` |
| অফলাইন টেস্ট ২৬৩/২৬৩ | `app/tests/run-all.mjs` |
| Source A প্যাচ ২টি (৯ ফাইল, ৩২ সম্পাদনা) + প্রয়োগযোগ্যতা প্রমাণ | `patches/`, `app/tools/verify-patch.sh` |
| DB অডিট (শুধু SELECT) ও মাইগ্রেশন/remediation ড্রাফট | `app/db/` (৪ ফাইল) |
| Impact Report + Migration Plan + Security Findings + residual risk | `reports/phase1-d01-d02-report.md` |
| Staging রানবুক (২ org, N1–N14 negative টেস্ট, রোলব্যাক, sign-off) | `app/STAGING_RUNBOOK.md` |

### বাকি / মুলতুবি

- **কোনো DB কুয়েরি চালানো হয়নি** — আগে `app/db/*AUDIT_ONLY.sql` চালিয়ে লাইভ অবস্থা জানতে হবে
  (repo-র মাইগ্রেশন ফাইলগুলো পরস্পরবিরোধী, তাই লাইভ RLS অবস্থা **অজানা**)।
- অনুমোদনের অপেক্ষায়: **D-01c** (`লভ্যাংশ`/dividend নিষিদ্ধ কিনা — এখন `warn`),
  **D-02a** (`allow_single_org_backfill`, ডিফল্ট বন্ধ), **D-02b** (Storage নীতি ড্রাফট চালানো হবে কিনা),
  এবং গেটের আইটেম **২–৭, ৯, ১০** (QH ডুপ্লিকেট স্কিম সারি, hard-delete→void/reversal, atomic withdrawal RPC,
  একক ভূমিকা মডেল + ৫ নতুন ভূমিকা, ১৫টি নতুন টেবিল, কৃত্রিম সীমা অপসারণ, Super Admin P-01…P-12,
  ঐতিহাসিক সুদ remediation)।
- Phase ২: প্রোটোটাইপের স্ক্রিন পোর্টিং, Source A-র অবশিষ্ট **২২১/২৬৭** আনস্কোপড `.from()` কলের org-স্কোপিং,
  Storage/Realtime/Export isolation।
- চিহ্নিত কিন্তু অস্পৃশ্য অসঙ্গতি: "জিরো পেনাল্টি" কপি (`GeneralSavingsSettings.tsx:294`, `PlanManagement.tsx:662`)
  বনাম সক্রিয় জরিমানা লজিক — ব্যবসায়িক সিদ্ধান্ত দরকার।

---

## ৪ · ফাইল ম্যাপ (পড়ার ক্রম)

| ক্রম | পথ | কেন |
|----|----|-----|
| ১ | `HANDOFF.md` (এই ফাইল) | পুরো প্রসঙ্গ |
| ২ | `reports/phase1-d01-d02-report.md` | সর্বশেষ Impact/Migration/Test/Security/residual risk |
| ৩ | `specs/06-consolidation-and-integration-plan.md` | গেট + রোডম্যাপ (কী অনুমোদিত, কী নয়) |
| ৪ | `specs/03-multi-module-platform-architecture.md` | মূল আর্কিটেকচার ও ব্যবসায়িক নিয়ম |
| ৫ | `app/README.md`, `app/STAGING_RUNBOOK.md` | Phase ১ কোড + staging ধাপ |
| ６ | `patches/README.md` | প্যাচ কী বদলায় (ফাইল ধরে) |
| ７ | `app/db/*.sql` | অডিট ও ড্রাফট (চালানোর নিয়ম রানবুকে) |
| ８ | `reports/qard-hasanah-phase3a-report.md` | প্রোটোটাইপ/QH বিস্তারিত |
| ９ | `prototype/` | ডিজাইন সিস্টেমের উৎস (`assets/ui.css`-এর `:root`) |
| ১০ | `reference/amar-somobay-v2/` | Source A (প্যাচের লক্ষ্য) |

অন্য স্পেক: `specs/00…06` (মোট ৭টি)। HTML পেজ: রুটে `index.html` (ল্যান্ডিং); বাকি সব `prototype/`-তে —
`preview.html`, `screens.html`, `workspace.html`, `system.html`, `flows.html`, `skins.html`,
`mobile-check.html`, `original-5-screens.html`।

---

## ৫ · কীভাবে চালাবেন

### Phase ১ অ্যাপ ও টেস্ট (`app/`)

```bash
cd app
npm install                # ~96 প্যাকেজ, নেটওয়ার্ক দরকার
npm test                   # ২৬৩ চেক (d01 ৭১ · d02 ৮৭ · d03 ৫০ · d04 ৫৫) → exit 0
npm run typecheck          # tsc --noEmit (পরিষ্কার)
npm run build              # dist/ (~২৬৪ kB JS, gzip ~৮০ kB)
npm run dev                # http://localhost:5173 (0.0.0.0-তে বাইন্ড)
```

### প্যাচ তৈরি ও যাচাই

```bash
python3 app/tools/make-patches.py     # patches/ দুটি নতুন করে বানায় + নিজেই প্রয়োগ করে মিলিয়ে দেখে
bash    app/tools/verify-patch.sh     # প্রয়োগ → d04 স্ক্যানার → tsc parity (সব /tmp-তে, repo স্পর্শ করে না)
```

পাথ পোর্টেবল (স্ক্রিপ্টের নিজের অবস্থান থেকে বের হয়); প্রয়োজনে env:
`SOURCE_A_ROOT`, `PATCH_DIR`, `PATCH_WORK`, `REGEN=0`, `MODULE_CACHE`।

**tsc parity ধাপের জন্য** Source A-র `node_modules` দরকার (না থাকলে ধাপটি SKIP দেখায়, বাকি সব চলে):

```bash
cp -a reference/amar-somobay-v2 /tmp/tsbase && cd /tmp/tsbase && npm install   # ~২৫৯ প্যাকেজ
MODULE_CACHE=/tmp/tsbase/node_modules bash app/tools/verify-patch.sh
```

প্রত্যাশিত ফলাফল: baseline error **৯** = patched error **৯**, তালিকা হুবহু এক
(পুরনো error গুলো `ApplyCooperative.tsx` ×৬ ও `PendingApproval.tsx` ×৩ — প্যাচের অসম্পর্কিত)।

### প্রোটোটাইপ হার্নেস (jsdom)

```bash
cd prototype/tests
cp load.mjs /tmp/load.mjs        # ⚠️ বাধ্যতামূলক: tc/tp/tp2/tsk/tjg/tqh/trc/t ইমপোর্ট/requires /tmp থেকে করে
for f in t.mjs tc.mjs tp.mjs tp2.mjs tsk.mjs tsk2.mjs tui.mjs tmc.mjs trc.mjs tjg.mjs tqh.mjs tw.mjs; do
  [ -f "$f" ] && echo "── $f" && node "$f" | tail -3
done                              # ১২টি হার্নেস সবুজ হওয়ার কথা
```

`mobile-contract-states.json` মুছে দিলে MC-14 নতুন করে তৈরি হয়।
**নোট:** এই হার্নেসগুলোতে `/home/user` ও `/tmp` পাথ লিটারাল আছে — Arena sandbox-এ ঠিক চলে;
অন্য মেশিনে চালাতে হলে `prototype/tests/*.mjs`-এর পাথ বদলে নিতে হবে (Phase ১ টুলগুলো পোর্টেবল করা হয়েছে,
প্রোটোটাইপ হার্নেসগুলো ইচ্ছাকৃতভাবে স্পর্শ করা হয়নি যাতে ১২টি সবুজ টেস্ট ভাঙে না)।

### ব্রাউজারে প্রিভিউ

in-app ভিউয়ার স্ক্রিপ্ট-নির্মিত পেজ ফাঁকা দেখায় → লোকাল সার্ভার ব্যবহার করুন:

```bash
python3 -m http.server 8000 --bind 0.0.0.0     # workspace root থেকে
# http://localhost:8000/index.html
# http://localhost:8000/prototype/preview.html · /prototype/screens.html · /prototype/workspace.html
# http://localhost:8000/prototype/system.html · /prototype/flows.html · /prototype/mobile-check.html
```

---

## ৬ · ক্ষণস্থায়ী জিনিস (নতুন চ্যাটে থাকবে না)

| জিনিস | অবস্থা | পুনরুৎপাদন |
|-------|-------|-------------|
| `/tmp/*` (patchwork, somobay-patched, tsbase, verify-patch) | **মুছে যায়** | `python3 app/tools/make-patches.py` / `verify-patch.sh` আবার বানায় |
| `app/node_modules`, `app/dist` | স্ন্যাপশটে নেই | `npm install` / `npm run build` |
| `reference/amar-somobay-v2/` | ওয়ার্কস্পেসে আছে (৩.৪ MB) | না থাকলে: `curl -L https://github.com/rashedpervej/Amar-Somobay-v2/archive/4f066ed.tar.gz \| tar -xz` |
| ইনস্টল করা সিস্টেম প্যাকেজ, shell history, ব্যাকগ্রাউন্ড প্রসেস | থাকে না | প্রয়োজনে আবার ইনস্টল |

---

## ৭ · Known gotchas (আবার একই ফাঁদে পড়বেন না)

1. **বাংলা যুক্তাক্ষরের Unicode normalization:** Source A-র ফাইলে হাতে টাইপ করা বাংলা anchor টেক্সট
   হুবহু মিলবে না (দেখতে এক, বাইটে ভিন্ন)। সমাধান `tools/make-patches.py`-এর `nfc_index_map()` ফলব্যাক
   (grapheme-cluster ভিত্তিক)। **পুরো ফাইল normalize করবেন না** — অপ্রয়োজনীয় লাইন বদলে diff ফুলে যায়।
2. **`git diff --no-index` নিজের `a/`/`b/` প্রিফিক্স যোগ করে** → ডিরেক্টরির নামও `a`/`b` হলে হেডার `a/a/src/…` হয়
   ও `git apply -p1` ফাইল খুঁজে পায় না। সমাধান স্ক্রিপ্টের `fix_headers()`।
3. **প্যাচ জেনারেটরের ক্রম:** আগে `b1`-এ D-01 বসান, তারপর `b1 → b2` কপি করে D-02 বসান।
   উল্টো করলে দ্বিতীয় প্যাচ প্রথমটিকে উল্টে দেয় (এই বাগটি ধরা পড়েছিল ও ঠিক করা হয়েছে)।
4. **ভাষা-স্ক্যানার নীতি স্তরকেই দোষী ভাবে:** যে ফাইল নিষিদ্ধ শব্দ *সংজ্ঞায়িত* করে (`noInterest*.mjs`, `tenant.mjs`,
   `money.mjs`) সেগুলো টেস্টের `POLICY_LAYER` স্কিপ-লিস্টে। UI/ডেমো লাইনে নিষিদ্ধ টোকেন থাকলে **একই লাইনে**
   allow টোকেন লাগে (`label="সুদ ৳০"`, `// নিষিদ্ধ ফিল্ড (D-01)`) — উইন্ডো −৪৬/+৬২ অক্ষর, তাই ডানদিকের negation বাঁচায় না।
5. **Vite/rollup `node:fs`/`node:path` বান্ডল করতে পারে না** → Node-only হেল্পার আলাদা মডিউলে
   (`noInterestScan.mjs`), ব্রাউজার কোড সেটি কখনো import করে না।
6. **TS + `.mjs` লাইব্রেরি:** `allowJs:false` + হাতে লেখা `.d.mts` (`allowJs:true` দিলে inferred literal টাইপ কল সাইট ভাঙে)।
   `@types/node` নেই → `(globalThis as any).process?.env`।
7. **টাকার একক:** `app.js`-এর অঙ্ক **পয়সা** (`tk(p)`÷১০০); ROSCA ডেটা ছিল টাকা (region-scoped ×১০০ ফিক্স —
   একই নামের GS ফিল্ড স্পর্শ করা যাবে না)। **বাংলা সংখ্যা `\d` ধরে না** → `[\u09E6-\u09EF]`;
   `\b` কাজ করে না → `(?<![\u0980-\u09FF])`।
8. **স্ক্যানারে word boundary + negation দুটোই দরকার** (নাহলে `পারিবারিক`⊃`রিবা`, `nointerest`⊃`interest` ধরায় ৩০ false positive)।
   বৈধ হিটের allowlist **টেস্টে** রাখুন, লাইব্রেরিতে নয়; সবুজ করার জন্য ALLOW_TOKENS আলগা করবেন না।
9. **Source A-র `src/lib/supabase.ts`-এ placeholder-fallback env আছে** — সেই আচরণ `app/`-এ কপি করা যাবে না
   (env না থাকলে থামতে হবে)। `unhandledrejection` ক্লিনআপও নয়।
10. **`MULTI_TENANT_FOUNDATION_DOWN.sql` কখনো চালাবেন না** — অ-নিরাপদ ফলব্যাক নীতি ফিরিয়ে আনে।
11. **`somobay_plans`-এর CREATE TABLE repo-র SQL-এ নেই** → সব মাইগ্রেশন `information_schema`-গার্ডেড,
    `NOT VALID`→`VALIDATE`, কখনো `DROP COLUMN` নয়।
12. **mock write-op খালি Promise রিটার্ন করবে না**; anonymous actor `null` → প্রতিটি `uid(a)` null-safe;
    `resolveRequestedOrg` NOT_A_MEMBER → ORG_ACCESS_DENIED ম্যাপ করতে হবে (নাহলে slug probing-এ org enumeration)।
13. **jsdom অ্যাক্সেস:** শুধু `load.mjs`-এর `__X` এক্সপোর্ট স্ক্রিপ্ট-স্কোপ `const` দেখায়; top-level `function` গ্লোবাল;
    `runScripts:'outside-only'` ইনলাইন হ্যান্ডলার চালায় না।
14. Python heredoc-এর ভিতরে JS regex/কোট রাখলে `SyntaxError` হয় ও কিছু লেখে না → `edit_file` ব্যবহার করুন, stderr পড়ুন।

---

## ৮ · নতুন চ্যাটে শুরু করার নিয়ম

0. **আপলোড করা জিপ হলে আগে ওয়ার্কস্পেস রুটে খুলে নিন** (নাহলে নিচের পাথগুলো মিলবে না):
   ```bash
   cd /home/user            # বা নতুন চ্যাটের ওয়ার্কস্পেস রুট
   unzip -o uploads/somobay-handoff-core.zip -d .    # app/ prototype/ specs/ reports/ patches/ HANDOFF.md index.html
   unzip -o uploads/somobay-source-a.zip     -d .   # reference/amar-somobay-v2/ (ঐচ্ছিক — GitHub থেকেও নামানো যায়)
   ```
   এরপর `[ -d app ] && [ -d prototype ] && [ -f HANDOFF.md ]` দিয়ে যাচাই করুন।
1. এই ফাইল ও `reports/phase1-d01-d02-report.md` পড়ুন।
2. `cd app && npm install && npm test` → ২৬৩/২৬৩ আসছে কিনা দেখুন।
3. `bash app/tools/verify-patch.sh` → exit 0 কিনা দেখুন (reference/ থাকতে হবে)।
4. তারপর ব্যবহারকারীর অনুমোদন নিয়ে এগোন: অডিট SQL চালানো → রিপোর্ট → ধাপ ৪/৫ অনুমোদন → Phase ২।
5. প্রতিটি ধাপের পর রিপোর্টে লিখুন: **Test Results · Security Findings · Residual risk** (নির্দেশনা §২.৪)।

**কখনো করবেন না:** অনুমতি ছাড়া production/staging DB-তে লেখা, সুদ/মুনাফা যোগ করা,
বিলম্ব ফি সরানো, ডিফল্ট org ফলব্যাক রাখা, প্রোটোটাইপের বাইরের ডিজাইন চাপানো, ব্যবসায়িক নিয়ম অনুমান করা।
