# `patches/` — Source A (`amar-somobay-v2`) এর জন্য Phase 1 প্যাচ

দুটি প্যাচ। **প্রয়োগের ক্রম বাধ্যতামূলক** (দ্বিতীয়টির লাইন-নম্বর প্রথমটি প্রয়োগের পরের অবস্থা ধরে লেখা):

```bash
cd <amar-somobay-v2 repo root>          # যেখানে src/ আছে
git switch -c phase1-d01-d02
git apply -p1 patches/0001-D01-zero-interest.patch
git apply -p1 patches/0002-D02-tenant-isolation.patch
npm install && npx tsc --noEmit && npm run build
```

`patch -p1 < …` ব্যবহার করলে শুরুতে কমেন্ট লাইন বাদ দিতে হয়: `grep -v '^#' file.patch | patch -p1`।

এই প্যাচগুলো **শুধু কোড** বদলায়। কোনো SQL/DB পরিবর্তন এখানে নেই — DB অংশ
`../app/db/`-তে আলাদা ফাইলে, সব ড্রাফট ও অনুমোদন-সাপেক্ষ (চালানোর নিয়ম `../app/STAGING_RUNBOOK.md`)।

---

## 0001-D01-zero-interest.patch — সম্পূর্ণ সুদমুক্ত (৪ ফাইল, ২১ যোগ-লাইন)

| ফাইল | কী বদলালো |
|------|-----------|
| `src/pages/PlanManagement.tsx` | নতুন স্কিম তৈরির payload থেকে `profit_percentage: 10` সরে গেল → হার্ড `0`; `planData.profit_percentage` কপি বন্ধ; ঋণ মোডালের `profitPercent` ফিল্ড ও রিসেট সরানো; **"লভ্যাংশ (%)" ইনপুট বক্স সরিয়ে লক করা ঘোষণা** — "সুদ ৳০ (নীতি D-01) / সম্পূর্ণ সুদমুক্ত — এই মান পরিবর্তনযোগ্য নয়" |
| `src/store/useSomobayStore.ts` | `SomobayPlan.profit_percentage` টাইপে নীতি-মন্তব্য (সর্বদা ০); `createPlan` ও `updatePlan` দুটোতেই নিষিদ্ধ ফিল্ড মুছে ফেলা (`interest_rate`, `profit_rate`, `riba_rate`, `markup_percentage`, `dividend_rate`) + `profit_percentage: 0` বাধ্যতামূলক |
| `src/pages/SavingsInsights.tsx` | `${bn(profit_percentage)}% মুনাফা` সারি → "সুদ ৳০ (নীতি D-01)"; নিচের নোটে জরিমানা-সংক্রান্ত বাক্য **বহাল রেখে** যোগ করা হলো "কোনো সুদ বা মুনাফা হিসাব হয় না (নীতি D-01)" |
| `src/pages/AdminUpdates.tsx` | AGM নমুনা ঘোষণার "সদস্য সঞ্চয়ের লভ্যাংশ ঘোষণা ও মুনাফা বণ্টন" → "সদস্য সঞ্চয়ের হিসাব ও নিরীক্ষা প্রতিবেদন উপস্থাপন" |

**অস্পৃশ্য (ইচ্ছাকৃত):** `late_fee_amount`, `pending_fine`, `penalty_paid` এবং সংশ্লিষ্ট UI —
বিলম্ব ফি/জরিমানা সুদ নয় (সিদ্ধান্ত Q1 = `only_interest`)।

## 0002-D02-tenant-isolation.patch — cross-tenant isolation (৬ ফাইল, ৮৪ যোগ-লাইন)

| ফাইল | ঝুঁকি (আগে) | কী বদলালো |
|------|--------------|-----------|
| `src/components/CooperativeTenantGuard.tsx` | **F-01** বৈশ্বিক `profiles.role === 'admin'` থাকলেই যেকোনো সমবায়ে প্রবেশ, ভূমিকা `cooperative_admin` ধরে নেওয়া | বৈশ্বিক-ভূমিকা escape বাদ; অ্যাক্সেস ও ভূমিকা শুধু `organization_members` সারি থেকে |
| `src/lib/qardHasanahService.ts` | **F-02** নোটিফিকেশন "সব admin"-কে (`profiles.role='admin'`) → অন্য সমবায়ের admin-এর কাছে তথ্য; `organization_id: orgId \|\| null`; **F-04** `qard_funds`/আবেদন/খতিয়ান স্কোপ ছাড়া; **F-05** সদস্য তালিকা বৈশ্বিক role দিয়ে | সব কুয়েরি `organization_id` দিয়ে স্কোপড; নোটিফিকেশন শুধু নিজ org-এর ভূমিকাধারীকে; NULL-org লেখা বন্ধ; সদস্য তালিকা `organization_members` থেকে |
| `src/lib/withdrawalService.ts` | **F-03** org না পেলে হার্ডকোডেড ডিফল্ট সমবায় `00000000-0000-0000-0000-000000000001`-এ লেখা | orgId না পেলে `throw` — অন্য tenant-এ ডেটা পড়তে/লিখতে পারবে না |
| `src/components/QuickCollectModal.tsx` | একই ডিফল্ট-org ফলব্যাক + সদস্য তালিকা বৈশ্বিক `profiles.role='member'` থেকে | ডিফল্ট-org বাদ; সদস্য তালিকা `organization_members` + `organization_id` দিয়ে |
| `src/pages/qard/AdminQardHasanah.tsx` | তহবিল সারাংশ/বরাদ্দ কল org ছাড়া | `useAuthStore.getState().activeOrganizationId` পাঠানো হয় |
| `src/store/useSomobayStore.ts` | **P6** `fetchAdminStats` সদস্য সংখ্যা বৈশ্বিক `profiles.role='member'` থেকে গুনে সব সমবায়ের সংখ্যা মিশিয়ে দিত; বাকি কুয়েরি RLS-নির্ভর | সদস্য সংখ্যা `organization_members` (সক্রিয়, নিজ org); `somobay_plans`, `member_plans`, `plan_payments`, overdue কুয়েরিতে `organization_id` স্কোপ |

## যাচাই (সব অফলাইন, production স্পর্শ করে না)

```bash
bash ../app/tools/verify-patch.sh     # প্যাচ বানায় → বিশুদ্ধ কপিতে প্রয়োগ → স্ক্যানার → tsc parity
node ../app/tests/run-all.mjs         # ২৬৩ চেক (d01 ৭১ · d02 ৮৭ · d03 ৫০ · d04 ৫৫)
```

সর্বশেষ ফলাফল:

- `git apply --check -p1` দুই প্যাচেই **rc=0**; ধারাবাহিক প্রয়োগের পর ট্রি **হুবহু** প্রত্যাশিত ট্রি-এর সমান
- প্রয়োগের পর Source A `src/`-এ **D-01 error ০**, **D-02 ঝুঁকিপূর্ণ প্যাটার্ন ০** (baseline-এ ছিল ১০ + ৯)
- `npx tsc --noEmit`: baseline **৯** error = patched **৯** error, তালিকা হুবহু এক
  (পুরনো error গুলো `ApplyCooperative.tsx` ও `PendingApproval.tsx`-এ — প্যাচের অসম্পর্কিত)
- `npm run build` সফল

## প্যাচ আবার তৈরি করা

```bash
python3 ../app/tools/make-patches.py   # সম্পাদনাগুলো tools/make-patches.py-এর EDITS-এ নথিভুক্ত
```

স্ক্রিপ্টটি `/tmp/patchwork/{a,b1,b2}`-তে তিনটি ট্রি রাখে (অপরিবর্তিত → D-01 → D-01+D-02),
`git diff --no-index` দিয়ে দুটি প্যাচ বানায়, তারপর নিজেই প্রয়োগ করে মিলিয়ে দেখে।
Source A-র ফাইলে বাংলা যুক্তাক্ষরের Unicode normalization আলাদা থাকলে grapheme-cluster ভিত্তিক
ফলব্যাক ব্যবহৃত হয় (এতে অপ্রয়োজনীয় লাইন বদলায় না)।
