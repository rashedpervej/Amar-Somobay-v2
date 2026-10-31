# Somobay — Phase 1 ভিত্তি (`app/`)

নতুন React অ্যাপ-ট্রি, যেখানে (১) প্রোটোটাইপের ডিজাইন সিস্টেম হুবহু পোর্ট করা হয়েছে,
(২) **D-01: সম্পূর্ণ সুদমুক্ত** নীতি কোড স্তরে প্রয়োগযোগ্য, (৩) **D-02: cross-tenant isolation**
নীতি ও যাচাই-কাঠামো তৈরি। বিদ্যমান Source A (`amar-somobay-v2`) পরিবর্তন করা হয়নি —
তার জন্য আলাদা প্যাচ `../patches/`-এ আছে, আর DB পরিবর্তনের ড্রাফট `db/`-তে (অনুমোদন-সাপেক্ষ)।

## দ্রুত শুরু

```bash
cd app
npm install
npm run dev          # http://localhost:5173  (০.০.০.০-তে বাইন্ড করা)
npm run build        # dist/
npm run typecheck    # tsc --noEmit
npm test             # ৪টি হার্নেস একসাথে (২৬৩ চেক)
```

`npm test` চালায়: `d01` (৭১) · `d02` (৮৭) · `d03` (৫০) · `d04` (৫৫)। যেকোনো ফেল হলে exit code ১।

## ডিরেক্টরি

| পথ | কী |
|----|----|
| `src/styles/tokens.css` | প্রোটোটাইপের `:root` + `--qh-*` + `[data-theme="qh"]` টোকেন হুবহু (Tailwind v4 `@theme inline`-এ ম্যাপ করা) |
| `src/styles/base.css`, `src/index.css` | বেস ডিসিপ্লিন (টোকেন ছাড়া রং/ফন্ট/স্পেসিং সরাসরি লেখা নিষেধ) |
| `src/lib/noInterest.mjs` | **D-01 নীতি স্তর** — নিষিদ্ধ ফিল্ড/টার্ম, অনুমোদিত বিকল্প, ভাষা-নিরপেক্ষ পরীক্ষা (browser-safe) |
| `src/lib/noInterestScan.mjs` | উৎস-ট্রি স্ক্যানার (শুধু Node; `node:fs` ব্যবহার করে, তাই browser কোড কখনো import করে না) |
| `src/lib/tenant.mjs` | **D-02 নীতি স্তর** — org resolution, ভূমিকা ম্যাপিং, টেবিল-ভিত্তিক স্কোপিং, অ্যাক্সেস-অস্বীকার কোড |
| `src/lib/money.mjs` | টাকা হিসাব (paisa/taka), বাংলা সংখ্যা রূপান্তর `bn()` |
| `src/lib/*.d.mts` | TS টাইপ (প্রকল্পে `allowJs:false`, তাই হাতে লেখা টাইপ) |
| `src/lib/supabaseClient.ts` | Supabase ক্লায়েন্ট — env না থাকলে থেমে যায়, **placeholder ফলব্যাক নেই**, service-role key কখনো ব্রাউজারে নয় |
| `src/components/ui.tsx`, `src/pages/DesignSystemPage.tsx`, `src/pages/PolicyPage.tsx` | ভিত্তি UI + ডিজাইন সিস্টেম ও নীতি প্রদর্শনী |
| `tests/_harness.mjs`, `tests/_mockDb.mjs` | অফলাইন টেস্ট কাঠামো ও মক DB (RLS/নীতি অনুকরণ করে) |
| `tests/d01…d04`, `tests/run-all.mjs` | হার্নেস |
| `tools/make-patches.py` | Source A-র জন্য প্যাচ উৎপাদন (৩২টি সম্পাদনা; বাংলা যুক্তাক্ষরের normalization ফলব্যাক সহ) |
| `tools/verify-patch.sh` | প্যাচ প্রয়োগ → স্ক্যানার → tsc parity, এক কমান্ডে |
| `db/*.sql` | অডিট (শুধু SELECT) ও ড্রাফট মাইগ্রেশন/remediation — **কিছুই চালানো হয়নি** |
| `STAGING_RUNBOOK.md` | staging-এ ধাপে ধাপে যাচাইয়ের তালিকা (২ org, negative টেস্ট, রোলব্যাক, sign-off) |

## নীতি (যা এই ট্রিতে কঠোরভাবে মানা হয়)

1. **সুদ/মুনাফা শূন্য (D-01)** — কোনো মডিউলে শতকরা-ভিত্তিক চার্জ নেই। `profit_percentage`,
   `interest_rate`, `profit_rate`, `riba_rate`, `markup_percentage`, `dividend_rate` নিষিদ্ধ;
   UI-তে লক করা ঘোষণা ("সুদ ৳০ (নীতি D-01)")।
2. **বিলম্ব ফি/জরিমানা অপরিবর্তিত** — `late_fee_amount`, `pending_fine`, `penalty_paid` বহাল
   (ব্যবহারকারীর সিদ্ধান্ত Q1 = `only_interest`)।
3. **ক্লায়েন্টের org id কখনো বিশ্বাস নয় (D-02)** — প্রতিটি পঠন/লেখা সার্ভার-সাইড স্কোপড
   (RLS + ট্রিগার), ভূমিকা যাচাই `organization_members` থেকে।
4. **ডিজাইন সিস্টেম = প্রোটোটাইপ** — টোকেন ছাড়া সরাসরি রং/ফন্ট সাইজ/স্পেসিং লেখা যায় না
   (d03 এটি পরীক্ষা করে)।
5. **গোপন তথ্য কোডে নেই** — `.env.example` শুধু নাম দেখায়; কোনো key ফাইলে লেখা নেই।

## সীমা (জেনে রাখা দরকার)

- এই ট্রি এখন **ভিত্তি**: ডিজাইন সিস্টেম, নীতি স্তর, টেস্ট কাঠামো — পূর্ণ ব্যবসায়িক স্ক্রিন নয়।
  স্ক্রিন পোর্টিং Phase ২-এর কাজ (`specs/06-consolidation-and-integration-plan.md` রোডম্যাপ)।
- Source A-র **২২১/২৬৭** `.from()` কল এখনো org-স্কোপ ছাড়া; Phase 1-এ সবচেয়ে ঝুঁকিপূর্ণ পথগুলো
  (৯টি ফাইল, ৩২টি সম্পাদনা) প্যাচ করা হয়েছে, বাকিগুলো RLS + পরবর্তী ফেজের কোড কাজে ধরা হবে।
- Source A-তে ৯টি পুরনো TypeScript error আছে (`ApplyCooperative.tsx`, `PendingApproval.tsx`) —
  প্যাচ সেগুলো স্পর্শ করে না; parity baseline = ৯।
