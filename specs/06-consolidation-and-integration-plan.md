# Somobay — Complete Product Consolidation & UI/UX Integration
### বিদ্যমান অ্যাপ (Source A) + নতুন প্রোটোটাইপ (Source B) → একক চূড়ান্ত পণ্য পরিকল্পনা

**তারিখ:** ৩১ অক্টোবর ২০২৬
**অবস্থা:** 🔵 **রিপোর্ট — অনুমোদনের অপেক্ষায়। কোনো কোড/ডেটাবেস পরিবর্তন করা হয়নি।**
**Source A:** GitHub `rashedpervej/Amar-Somobay-v2` (main, commit `4f066ed`) — ১৮১ ফাইল, ৩.০ MB; স্থানীয় কপি `reference/amar-somobay-v2/`
**Source B:** এই ওয়ার্কস্পেসের প্রোটোটাইপ — ১৯৯ স্ক্রিন / ১২৫ লজিক্যাল পেজ, ১২টি হার্নেস সবুজ
**নীতিগত ভিত্তি:** চারটি আর্থিক মডিউল (সাধারণ সঞ্চয় · ROSCA · যৌথ লক্ষ্য · কর্জে হাসানা) · সম্পূর্ণ সুদমুক্ত · প্রোটোটাইপের ডিজাইন ভাষাই চূড়ান্ত ডিজাইন সিস্টেম · মোবাইল-ফার্স্ট · এক Backend/DB/নিয়ম, দুই প্রেজেন্টেশন

---

# A · বিদ্যমান অ্যাপ অডিট (Source A)

## A.1 প্রকৃত স্ট্যাক ও গঠন

| স্তর | কী আছে | প্রমাণ |
|---|---|---|
| ফ্রন্টএন্ড | React 19 + TypeScript 5.8 + Vite 6 + Tailwind CSS v4 + `motion` + `lucide-react` + `react-easy-crop` | `package.json` |
| রাউটিং | `react-router-dom` v7 — ৯৬টি `<Route>` (৬২টি মূল অ্যাপ + ১২টি সুপার অ্যাডমিন + বাকি রিডাইরেক্ট) | `routes_list.txt` |
| স্টেট | Zustand — ৭টি স্টোর (`useAuthStore` 11KB, `useSomobayStore` 25KB, `useWalletStore` 13KB, `usePromotionStore` 12.5KB, settings/notification/theme) | `src/store/` |
| ব্যাকএন্ড | Supabase (Postgres + Auth + RLS + Storage) — ক্লায়েন্ট থেকে সরাসরি `.from()` কল; Express সার্ভার (`server.ts`) শুধু প্রমোশন/ব্র্যান্ডিং/ফন্ট/হেলথ + স্ট্যাটিক ফাইল | `src/lib/supabase.ts`, `server.ts` |
| DB অবজেক্ট | ২২টি টেবিল কোডে ব্যবহৃত · ১৯টি ফাংশন · ১৬টি ট্রিগার · ৭৯টি অনন্য RLS পলিসি (১৪০টি বাক্য) · ২৫টি SQL মাইগ্রেশন ফাইল | `*.sql`, কোড স্ক্যান |
| PWA | `manifest.json` + service worker রেজিস্ট্রেশন আছে | `index.html:9,65` |
| সুপার অ্যাডমিন | **আলাদা অ্যাপ, আলাদা পোর্ট (4001)** — এই রিপোতে নেই (`CooperativeApproval.tsx` রিপোতে অনুপস্থিত) | অডিট রিপোর্ট §10 |
| অপ্রয়োজনীয় নির্ভরতা | `@google/genai` `package.json`-এ আছে কিন্তু `src/`-এ কোথাও ব্যবহৃত হয়নি | grep: 0 hit |

**গুরুত্বপূর্ণ পর্যবেক্ষণ:** আর্থিক লেখার (deposit, withdrawal approval, draw, disbursement, repayment) কোনো সার্ভার-সাইড API নেই — ব্রাউজার থেকে সরাসরি Supabase-এ লেখা হয়, নির্ভরতা শুধু RLS + DB ট্রিগারের ওপর। অ্যাটমিক ট্রানজ্যাকশন, idempotency key বা সার্ভার-সাইড ভ্যালিডেশন নেই।

## A.2 পেজ ইনভেন্টরি (৭৩টি পেজ ফাইল)

| ক্লাস্টার | পেজ | মন্তব্য |
|---|---|---|
| Auth/অনবোর্ডিং | Splash, Login, Signup, PendingApproval (33KB), ApplyCooperative (41KB), JoinCooperative (48KB) | সদস্য ও নতুন সমিতি — দুই ধরনের আবেদনই আছে |
| শেল/হোম | Dashboard (52KB), Settings, EditProfile (39KB), Security, Notifications, Notices, Updates, PromotionDetail | |
| সাধারণ সঞ্চয় | SavingsHistory, SavingsInsights (40KB), SingleDeposit, BulkDeposit, MemberWithdrawalRequest | |
| সমিতি/টেন্যান্ট | SomobayList, CooperativeTypeSelect, CreateGeneralCooperative, GeneralSavingsWizard (32KB), CooperativeDashboard (28KB), PlanManagement (**96KB**), ManageSomobay, MySomobay, AdminMore, GeneralSavingsSettings | `PlanManagement.tsx` এক ফাইলে স্কিম + সদস্য + কিস্তি + ঋণ + সেটিংস |
| সদস্য ব্যবস্থাপনা | MemberList (28KB), MemberDetail (30KB) + `AddMemberModal`, `QuickCollectModal`, `ReceiptModal` | |
| Admin কিউ/রিপোর্ট | AdminSavings, AdminPendingPayments (21KB), AdminInstallments, AdminReports, AdminUpdates (74KB), ManagePromotions (52KB), AppSettings (20KB) | |
| ROSCA | RoscaList, RoscaDetail (**54KB**), RoscaMemberDetail, RoscaDrawResult, RoscaProgress, RoscaSettings, RoscaReports, RoscaCompleted | |
| Joint Goal (Admin) | GoalList, CreateGoal, GoalDetail (35KB), GoalMemberDetail, AddContribution, GoalProgress, GoalTransactions, GoalReports, GoalSettings, GoalCompleted | |
| Joint Goal (Member) | UserGoalDetails, UserMyContribution, UserContributionHistory, UserAddContribution, UserGoalMembers, UserMyMemberDetails, UserGoalProgress, UserGoalInformation, UserGoalNotices, UserGoalCompleted | সদস্যপক্ষের আলাদা ১০ পেজ — **ভালো দিক** |
| কর্জে হাসানা | QardMenu, MemberQardHasanah (22.5KB), AdminQardHasanah (37.8KB) | **১১টি রুট একই `AdminQardHasanah` কম্পোনেন্টে** (`/qard/loans`, `/qard/overdue`, `/qard/reports`, `/qard/settings` সব একই পর্দা) |

**বড় ফাইলের ঝুঁকি:** ৬টি ফাইল ৪০KB+ (সর্বোচ্চ ৯৬KB) — একেকটিতে একাধিক পর্দার দায়িত্ব, ফলে রক্ষণাবেক্ষণ ও টেস্টিং কঠিন।

## A.3 ডেটাবেস গঠন (কোডে ব্যবহৃত ২২টি টেবিল)

| টেবিল | ভূমিকা | RLS | মূল কলাম (কোড থেকে যাচাইকৃত) |
|---|---|---|---|
| `organizations` | টেন্যান্ট (সমিতি) | ✅ | name, slug, reg_number, status, logo_url, **config JSONB** (`enabled_modules`) |
| `organization_members` | টেন্যান্ট-স্কোপড সদস্যপদ | ✅ | organization_id, user_id, **role** (cooperative_admin/collector/member), status, rejection_reason |
| `profiles` | গ্লোবাল ইউজার প্রোফাইল | ✅ | full_name, phone, **role** (admin/member/pending), avatar_url, profile_completed |
| `platform_admins` | প্ল্যাটফর্ম সুপার অ্যাডমিন | ✅ | user_id, permission_level (platform_owner/auditor) |
| `audit_logs` | অডিট | ✅ | organization_id, actor_id, action, entity_type, entity_id, details, ip_address |
| `somobay_plans` | **সব স্কিমের একক টেবিল** | ✅ | scheme_type (**savings/rosca/joint_goal/qard**), name, duration_months, installment_amount, target_amount, due_day, status, is_active, **profit_percentage**, **late_fee_amount** |
| `member_plans` | সদস্যের নামভর্তি | ✅ | plan_id, member_id, status, total_collected, next_due_date, installment_amount, frequency, **pending_fine** |
| `plan_payments` | সব কিস্তি/জমা/উত্তোলন এন্ট্রি | ✅ | member_plan_id, amount, type, status, payment_date, admin_id, note, **penalty_paid**, current_cycle |
| `savings_withdrawals` | উত্তোলন আবেদন | ✅ | member_plan_id, amount, purpose, status, processed_by/at, rejection_reason, payment_method, account_number, trx_ref |
| `wallet_transactions` | ওয়ালেট | ✅ | member_id, admin_id, amount, transaction_type, note |
| `member_wallets` | ওয়ালেট ব্যালেন্স | ✅ | — |
| `rosca_periods` | ROSCA ড্র পিরিয়ড | ✅ | plan_id, cycle_no, period_no, due_date, recipient_id, payout_amount, **draw_method, draw_seed**, drawn_at, status |
| `joint_goal_expenses` | যৌথ লক্ষ্যের খরচ | ✅ | plan_id, title, amount, expense_date, spent_by, approved_by, proof_url, note |
| `qard_funds` | QH তহবিল | ✅ | fund_name, total_allocated, total_disbursed, total_recovered |
| `qard_applications` | QH আবেদন | ✅ | code, member_id, requested_amount, approved_amount, duration_months, purpose, status, rejection_reason, disbursement_date/ref, **member_savings_snapshot**, **consent_public_sharing** |
| `qard_loans` | QH ঋণ | ✅ | code, member_id, scheme_id, application_id, principal_amount, total_repaid, outstanding_principal, monthly_installment, duration_months, disbursement_date, **next_due_date**, status |
| `qard_repayments` | QH পরিশোধ | ✅ | loan_id, amount, payment_date, payment_method, trx_ref, receipt_no, note, status, admin_id |
| `notifications` | নোটিফিকেশন | ✅ | user_id, organization_id, title, message, type, is_read |
| `promotions` | নোটিশ/প্রমোশন/সভা | ✅ | ২৬ কলাম (template_type, show_in_notices/meetings/popup, right_widget_type, meeting_time/location/status, viewers, attendees) |
| `app_settings` | প্ল্যাটফর্ম সেটিংস | ✅ | app_name, tagline, welcome_text, logo_url, primary/secondary_color, footer_text |
| `member_actions` | সদস্যের ক্রিয়া লগ | ❌ **RLS নেই** | — |
| `branding`, `avatars` | Storage বাকেট | — | — |

**মডেলের সারকথা:** একটি **ইউনিফায়েড প্ল্যান মডেল** — `somobay_plans` (স্কিম) + `member_plans` (নামভর্তি) + `plan_payments` (এন্ট্রি) তিনটি মডিউল (savings/rosca/joint_goal) বহন করে; মডিউল-নির্দিষ্ট টেবিল শুধু `rosca_periods` ও `joint_goal_expenses`। কর্জে হাসানা আলাদা ৪টি টেবিলে, **কিন্তু একই সাথে `somobay_plans`-এ `scheme_type='qard'` সারিও তৈরি হয়** (`QARD_HASANAH_STANDARDIZATION.sql:157-180`) → ডুপ্লিকেশন।

**নেই:** দ্বৈত-এন্ট্রি লেজার/খতিয়ান টেবিল, ভাউচার, ক্যাশ বুক, ব্যাংক রিকনসিলিয়েশন, শ্রেণিকরণ (classification), write-off, কমিটি সিদ্ধান্ত রেফারেন্স, নিয়ম-সংস্করণ (rule version), যোগ্যতা snapshot, OTP লগ, ডকুমেন্ট/KYC টেবিল, নমিনি, সদস্য স্থানান্তর, মৃত্যু দাবি, দিনশেষ ব্যাচ।

## A.4 Auth ও রোল মডেল

- **দ্বৈত রোল ব্যবস্থা (নিজেদের অডিটেও চিহ্নিত):** `profiles.role` = `admin | member | pending` (গ্লোবাল) **এবং** `organization_members.role` = `cooperative_admin | collector | member` (টেন্যান্ট-স্কোপড)। কোডে এখনো বহু জায়গায় `profile.role === 'admin'` চেক হয় → সমিতি B-তে সাধারণ সদস্য হয়েও নিজেকে অ্যাডমিন দেখানোর ঝুঁকি।
- **ভূমিকা ৪টি:** Member · Cooperative Admin · Collector · Platform Super Admin (`platform_owner` / `auditor`)।
- **নেই:** হিসাবরক্ষক, ব্যবস্থাপক, অনুমোদনকারী, নিরীক্ষক — অর্থাৎ **maker ≠ checker বাধ্য করার মতো রোল বিভাজন নেই**; একজন `cooperative_admin` একাই এন্ট্রি ও অনুমোদন করেন।
- **অনুমোদন সীমা (limit matrix) নেই** — কোনো অঙ্কভিত্তিক এসকেলেশন নেই।
- নতুন সদস্য: `organization_members.status = pending` → অ্যাডমিন অনুমোদনে `active`, স্বয়ংক্রিয় নোটিফিকেশন ✅।
- প্রোফাইল সুরক্ষা: `protect_profile_privileged_columns`, `check_profile_role_update`, `FIX_PROFILES_RECURSION.sql` (RLS রিকারশন ঠিক করা) ✅ — ভালো দিক।

## A.5 মডিউলভিত্তিক বিদ্যমান ব্যবসায়িক লজিক

**সাধারণ সঞ্চয় (`generalSavingsService`, ৬ মেথড):** getMemberSavingsSummary · recordDeposit · recordReversal · requestWithdrawal · processWithdrawal · **calculateSavingsBalance (ক্লায়েন্ট-সাইডে payments − withdrawals)**। উত্তোলন অনুমোদনে ব্যালেন্স কর্তন নির্ভর করে DB ট্রিগার `trg_handle_approved_withdrawal`-এর ওপর (নিজেদের অডিটে ঝুঁকি চিহ্নিত)।

**ROSCA (`roscaService`, ১১ মেথড):** getRoscaPlans/ById · createRoscaPlan · updateRoscaPlan · getEnrolledMembers · enrollMember · getRoscaPeriods · **generateRoscaSchedule** · **conductDraw (draw_method + draw_seed সংরক্ষণ)** · recordInstallment · bulkRecordInstallments · **startNextCycle**। pot = duration × installment; payout = installment × total_members_limit।

**যৌথ লক্ষ্য (`jointGoalService`, ১৫ মেথড):** getGoals/ById · createGoal · updateGoal · getEnrolledMembers · enrollMember · addContribution · getContributions · getExpenses · addExpense · removeMember · **deleteExpense** · **deleteGoal** · calculateMetrics · getUserParticipatingGoals · getUserGoalSummary · userAddContribution। খরচে `spent_by` + `approved_by` + `proof_url` আছে ✅।

**কর্জে হাসানা (`qardHasanahService`, ১০ মেথড):** getFundSummary (DB থেকে রিকনসাইল করা, ডিফল্ট বরাদ্দ ৳৫০,০০০ হার্ডকোড) · updateFundAllocation · **getMemberSavingsSnapshot** · getApplications · submitApplication · reviewApplication · disburseLoan · recordRepayment · getLoans · getRepayments।
*নিয়ন্ত্রণ আছে:* ডুপ্লিকেট বিতরণ প্রতিরোধ · অনুমোদন ছাড়া বিতরণ নয় · তহবিল যথেষ্ট না থাকলে বিতরণ আটকে দেয় · পরিশোধ > বকেয়া হলে আটকে দেয় · `outstanding = principal − total_repaid` (কোনো সুদ যোগ হয় না) ✅ · আবেদনের সময় সঞ্চয়ের snapshot সংরক্ষণ ✅।
*নেই:* যোগ্যতার ৪-স্তরীয় নিয়ম ইঞ্জিন, কারণ-কোড, কোটা/জানালা, পুল হিসাব (শুধু একটি `qard_funds` সারি), SLA, কমিটি রেফারেন্স, maker ≠ checker, OTP, শ্রেণিকরণ, বকেয়া প্রতিকারের ধাপ, write-off, পুনর্গঠন, সনদ, নিয়ম-সংস্করণ, Simulation। আবেদন কোড = `QH-${৪টি এলোমেলো অঙ্ক}` → **সংঘর্ষের ঝুঁকি, অনুসন্ধানযোগ্য নয়**।

## A.6 নিজেদের দুটি অডিট রিপোর্টের সারসংক্ষেপ (রিপোতেই আছে)

`AMAR_SOMOBAY_CORE_STRUCTURE_UX_AUDIT.md` (53KB) ও `AMAR_SOMOBAY_INTERACTIVE_UX_QA_AUDIT.md` (26KB) — ৭৪ রুট, ৪ ভিউপোর্ট, ৩ পার্সোনা পরীক্ষিত। প্রধান সিদ্ধান্ত:

| কোড | ফাইন্ডিং | অবস্থা (আজও) |
|---|---|---|
| **P0 / SEC-01** | `AdminPendingPayments.tsx` — `plan_payments` কুয়েরিতে `organization_id` ফিল্টার নেই → ক্রস-টেন্যান্ট ফাঁস | কোডে এখনো আছে |
| **P0 / SEC-02** | `AdminReports.tsx` — `profiles` ও `plan_payments` থেকে গ্লোবাল CSV এক্সপোর্ট | কোডে এখনো আছে |
| **P0** | `withdrawalService.ts` — টেন্যান্ট স্কোপিং ঘাটতি | কোডে এখনো আছে |
| P1 NAV-01…08 | ৮টি ব্যাক-বাটন রিগ্রেশন, হার্ডকোড `backTo`, ফর্মে dirty-guard নেই, মোডাল হিস্টোরি ট্র্যাপ | আংশিক (`useAppBack.ts` যোগ হয়েছে, 838B) |
| P1 | `SomobayList.tsx` — এক সমিতিতে ১টি স্কিমের কৃত্রিম সীমা; `RoscaList.tsx` — `activeCount >= 1` দিয়ে একাধিক চক্র আটকানো | কোডে আছে |
| P2 | সদস্য ভিউতে অ্যাডমিন কন্ট্রোল লিক; URL-এ ফিল্টার স্টেট নেই; `inputMode="numeric"` নেই; MFS নম্বর কপি বাটন নেই | কোডে আছে |
| Financial-1 | `SingleDeposit.tsx`-এ `totalPaid = amount + fine`, `penalty_paid` ফিল্ড | `penalty_paid: 0` লেখা হয়, কিন্তু `member_plans.pending_fine` এখনো UI-তে দেখানো হয় (`QuickCollectModal.tsx:414-416` "বকেয়া জরিমানা ৳X") |
| Financial-2 | উত্তোলন অনুমোদনে ব্যালেন্স কর্তন ট্রিগার-নির্ভর (অ্যাটমিক নয়) | অপরিবর্তিত |
| Structural | রুট দ্বৈততা (`/somobay/manage`, `/somobay/my`, `/savings`, `/goals`, `/rosca`, `/qard`) ও বটম-নেভ অমিল | `routes_list.txt`-এ ২০+ রিডাইরেক্ট তার প্রমাণ |

## A.8 ঝুঁকি তালিকা (সংহতকরণের আগে সমাধান বাধ্যতামূলক)

| # | ঝুঁকি | প্রমাণ | প্রভাব |
|---|---|---|---|
| **R-A1** | **`profit_percentage` একটি জীবন্ত, সম্পাদনাযোগ্য ফিল্ড** — নতুন স্কিমে ডিফল্ট **১০**, সম্পাদনা ফর্মে ইনপুট বক্স, এবং সদস্যকে দেখানো হয় "**X% মুনাফা**" | `PlanManagement.tsx:177,365,1054-1055` · `SavingsInsights.tsx:663` · `QARD_HASANAH_STANDARDIZATION.sql:164` | 🔴 সরাসরি সুদ/মুনাফা — পণ্যের মূল নীতির (BR-13) লঙ্ঘন। ঐতিহাসিক ডেটায় ০-এর বেশি মান থাকলে লেজারই দূষিত |
| **R-A2** | `late_fee_amount` কলাম স্কিম টেবিলে আছে | `QARD_HASANAH_STANDARDIZATION.sql:165` | বিলম্ব ফি = সুদের সমতুল্য (⚠️D-41 নীতি) |
| **R-A3** | `pending_fine` সদস্যকে দেখানো হয় | `QuickCollectModal.tsx:414-416` | একই |
| R-A4 | QH আবেদন কোড এলোমেলো ৪ অঙ্ক | `qardHasanahService.ts:228` | সংঘর্ষ + অডিট অসম্ভব |
| R-A5 | `deleteGoal`, `deleteExpense`, `removeMember` — হার্ড ডিলিট | `jointGoalService.ts:273-301` | আর্থিক রেকর্ড মুছে যায়; R-02 (অপরিবর্তনীয়তা) লঙ্ঘন |
| R-A6 | ব্যালেন্স ক্লায়েন্ট-সাইডে গণনা, লেজার টেবিল নেই | `generalSavingsService.calculateSavingsBalance` | ট্রায়াল ব্যালেন্স/সমন্বয় অসম্ভব |
| R-A7 | `member_actions` টেবিলে RLS নেই | SQL স্ক্যানে ENABLE RLS নেই | ক্রস-টেন্যান্ট পঠন ঝুঁকি |
| R-A8 | দ্বৈত রোল মডেল | A.4 | অনুমোদন বাইপাসের সম্ভাবনা |
| R-A9 | আর্থিক অপারেশনে সার্ভার-সাইড এনফোর্সমেন্ট নেই | A.1 | RLS ভুল হলে সরাসরি অর্থ-লেখা |
| R-A10 | `@google/genai` অব্যবহৃত নির্ভরতা | grep 0 hit | সাপ্লাই-চেইন পৃষ্ঠতল বৃদ্ধি |
| R-A11 | QH ডুপ্লিকেট মডেল (টেবিল + `scheme_type='qard'` সারি) | A.3 | একই কাজের দুই উৎস |
| R-A12 | ১১টি QH রুট এক কম্পোনেন্টে | A.2 | পৃথক পর্দার অভাব, অডিট অস্পষ্ট |

---

# B · নতুন প্রোটোটাইপ অডিট (Source B)

## B.1 কী আছে

| মাপ | মান |
|---|---|
| মোট স্ক্রিন (META) | **১৯৯** |
| লজিক্যাল পেজ | **১২৫** = ৬৭ সাধারণ সঞ্চয় + ১৮ ROSCA + ১৫ যৌথ লক্ষ্য + ২৫ কর্জে হাসানা |
| প্রেজেন্টেশন | Admin Web **৭৭** · Admin App **৭৪** · Member **৪০** · Shared **৮** |
| নেভিগেশন | ANAV ৯ গ্রুপ / ৪৯ কী (ড্রয়ার থেকে সব সেকশন পৌঁছানো যায়) · ৭টি ভূমিকার নিজস্ব ল্যান্ডিং + ৫-স্লট নেভ |
| ফ্লো পর্দা | ২৫ (কোনো বটম-নেভ/ড্রয়ার নেই, ব্যাক বাধ্যতামূলক) |
| মোবাইল চুক্তি | ৭৫ পর্দার মাপা চুক্তি (MC-01…MC-18), `mobile-contract.md`, আসল-ব্রাউজার অডিটর `mobile-check.html` |
| ডিজাইন | `ui.css` ৯৯.৬KB (টোকেন + মডিউল কিট `rc-*`/`jg-*`/`qard-*`) + `skins.css` (৫টি স্কিন, `data-theme` অ্যাট্রিবিউট) |
| ডেটা | একক `app.js` (২৯৩KB) — পয়সা-ভিত্তিক অঙ্ক, এক লেজার উৎস, সব স্ক্রিন derived মান দেখায় |
| স্বয়ংক্রিয় যাচাই | ১২টি হার্নেস (`t, tw, tui, tc, tsk, tsk2, tmc, tp, tp2, trc, tjg, tqh`) = ৬০০+ চেক, সব সবুজ |
| ডকুমেন্টেশন | `specs/00`–`specs/05` (ডিজাইন স্পেক, ডিফল্ট সিদ্ধান্ত, বহু-মডিউল আর্কিটেকচার, মোবাইল চুক্তি) + এই `specs/06` |

## B.2 ডিজাইন সিস্টেম (এটাই চূড়ান্ত — পুরনো অ্যাপের UI প্রয়োগ করা হবে না)

- **টোকেন-চালিত:** রঙ/ব্যাসার্ধ/ফাঁকা/টাইপোগ্রাফি CSS ভেরিয়েবলে; প্রতিটি মডিউলের নিজস্ব অ্যাকসেন্ট (সবুজ=সাধারণ সঞ্চয়, নীল=ROSCA, বেগুনি=যৌথ লক্ষ্য, অ্যাম্বার/পান্না-সোনালি=কর্জে হাসানা)।
- **কার্ড ভাষা:** `.card > .card-h + .card-b`, `.tbl-scroll > table.tbl + .tbl-sum`, `.kpis`, `.mrows`, `.xtbl` (মোবাইলে ≤৪ কলাম), `.qard-*`/`.jg-*`/`.rcc-*` মডিউল কিট।
- **নেভিগেশন:** ডেস্কটপ = সাইডবার + টপ-বার + ব্রেডক্রাম্ব; মোবাইল = অ্যাপ-হেড + ৫-স্লট বটম নেভ + হ্যামবার্গার ড্রয়ার + সিদ্ধান্ত-বার (`decbar`) + ফ্লো-বার। ভূমিকাভিত্তিক শেল (Shell-A…Shell-E), নিরীক্ষকের জন্য শুধু-পঠন শেল।
- **মোবাইল বাজেট:** ট্যাপ টার্গেট ≥৪৪px, স্থির ক্রোমের বাজেট, >৩২০০ অক্ষরের পর্দায় ফোল্ড/ট্যাব বাধ্যতামূলক (MC-13)।
- **ভাষা:** সম্পূর্ণ বাংলা, সব অঙ্ক বাংলা সংখ্যায়, ৳-এর পরে ল্যাটিন অঙ্ক নিষিদ্ধ; সুদ/মুনাফা/লাভ/ঋণের দাম শব্দ নিষিদ্ধ (নেতিবাচক প্রসঙ্গ ছাড়া), অনুমোদিত প্রকাশ "সুদ ৳০"।
- **অ্যাক্সেসিবিলিটি:** আইকন বোতানে `aria-label` + `title` (MC-18), WCAG AA কনট্রাস্ট যাচাই (স্কিন গ্যালারিতে)।

## B.3 শক্তি (যা পুরনো অ্যাপে নেই)

1. **নিয়ন্ত্রণ স্তর:** maker ≠ checker, ৫-স্তরের অনুমোদন সীমা ম্যাট্রিক্স (⚠️D-22), OTP গেট (BR-22), অপরিবর্তনীয় রসিদ + হ্যাশ (BR-08/R-02), সংশোধন-রিভার্সাল JE, অপরিবর্তনীয় অডিট লগ (A-38), দিনশেষ গেট (BR-25)।
2. **লেজার শৃঙ্খলা:** প্রতিটি মডিউলে ডেবিট/ক্রেডিট উল্লেখ, ট্রায়াল ব্যালেন্স ৳০, আলাদা খাত (নগদ/ব্যাংক/ওয়ালেট/সদস্য সঞ্চয়/লক্ষ্য তহবিল/QH আদায়যোগ্য), write-off ক্ষতি খাতায়।
3. **যোগ্যতা ইঞ্জিন (QH):** ৪ স্তর · ১৪ নিয়ম · ১০ ব্লকিং + ৬ সতর্কতা কারণ-কোড (করণীয়সহ) · নিয়ম-সংস্করণ v1–v3 · অপরিবর্তনীয় snapshot (BR-21) · Simulation (ব্যক্তিগত তালিকা প্রকাশ ছাড়া) · কোটা/জানালা/পুল · SLA · শ্রেণিকরণ · বকেয়া প্রতিকারের ধাপ · সনদ।
4. **প্যারিটি শৃঙ্খলা:** প্রতিটি Admin Web পেজের মোবাইল রূপ, একই ডেটা/নিয়ম, হার্নেসে অঙ্ক-মিল যাচাই।
5. **অমীমাংসিত সিদ্ধান্তের স্বচ্ছতা:** ৮০+ D-কোড স্ক্রিনে ⚠️ চিহ্নসহ — অনুমান কখনো "নিশ্চিত ফিচার" হিসেবে দেখানো হয় না।
6. **স্বয়ংক্রিয় যাচাই:** ৬০০+ চেক; রেন্ডার, নেভ, ভাষা, অঙ্ক, CSS, মোবাইল চুক্তি — সব মেশিন-পরীক্ষিত।

## B.4 সীমাবদ্ধতা (সৎ স্বীকারোক্তি)

| সীমাবদ্ধতা | বিবরণ |
|---|---|
| মক ডেটা | কোনো ব্যাকএন্ড/Supabase সংযোগ নেই; সব ডেটা `app.js`-এ |
| আসল auth নেই | S-01 লগইন/OTP পর্দা ডিজাইন করা, কিন্তু প্রকৃত প্রমাণীকরণ নেই |
| ফ্লো অসম্পূর্ণ | F-09…F-12 (ROSCA), F-13/F-14 (JG), F-15…F-17 (QH) ক্লিক-থ্রু ফ্লো তৈরি নয় (সংশ্লিষ্ট পর্দা আছে) |
| Super Admin | P-01…P-12 ডিজাইন স্থগিত (আপনার সিদ্ধান্ত), আর্কিটেকচারে হিসাব রাখা |
| সংযুক্তি বাকি | A-01/AM-01 মডিউল সারাংশ কার্ড, A-10/AM-05 ৩৬০° ক্রস-মডিউল এক্সপোজার (§8.5 মার্জ), M-08 মডিউল ফিল্টার |
| টেন্যান্ট অনবোর্ডিং নেই | নতুন সমিতির আবেদন/অনুমোদন, সদস্যের join-request পর্দা নেই (পুরনো অ্যাপে আছে) |
| প্রমোশন/নোটিশ ব্যবস্থাপনা হালকা | M-17 নোটিশ বোর্ড আছে, কিন্তু পুরনো অ্যাপের ২৬-কলাম টেমপ্লেট/মিটিং/পপআপ/উইজেট সিস্টেম নেই |
| PWA/অফলাইন বাস্তবায়ন | S-08 অফলাইন sync পর্দা ডিজাইন আছে, বাস্তব service worker নেই |

---

# C · ফিচার তুলনা ম্যাট্রিক্স

**স্ট্যাটাস কোড:** 🟦 **A** = শুধু বিদ্যমান অ্যাপে · 🟩 **B** = শুধু নতুন প্রোটোটাইপে · 🟨 **AB** = দুটোতেই আছে · 🟧 **I** = অসম্পূর্ণ · 🟥 **M** = দুটোতেই নেই · 🟪 **D** = ডুপ্লিকেট · 🟡 **N** = উন্নতি দরকার

## C.1 প্রমাণীকরণ ও অনবোর্ডিং

| ফিচার | বিদ্যমান অ্যাপ | প্রোটোটাইপ | স্ট্যাটাস | সংহতকরণে করণীয় |
|---|---|---|---|---|
| ইমেইল/ফোন লগইন + পাসওয়ার্ড | ✅ Supabase Auth | S-01 ডিজাইন (OTP) | 🟨 AB | Supabase Auth রাখা; নতুন UI-তে S-01 প্রয়োগ |
| OTP/দ্বৈত যাচাই | ⚠️ শুধু মোবাইল নম্বর বদলে (D-21 উল্লেখ) | S-01 + বিতরণে OTP গেট | 🟡 N | OTP লগ টেবিল যোগ (অনুমোদন দরকার) |
| স্ব-নিবন্ধন (Signup) | ✅ `/signup` → `/pending` | ❌ নেই | 🟦 **A** | নতুন ডিজাইনে Signup + PendingApproval পর্দা যোগ করতে হবে |
| অনুমোদনের অপেক্ষায় পর্দা (আবেদনকারীর দৃষ্টি) | ✅ PendingApproval (33KB) | ❌ | 🟦 **A** | M-22 হিসেবে নতুন পর্দা প্রস্তাব |
| নতুন সমিতির আবেদন | ✅ ApplyCooperative (41KB) | ❌ (P-01…P-12 স্থগিত) | 🟦 **A** | Super Admin ফেজে নতুন ডিজাইনে |
| সমিতিতে যোগদানের আবেদন (কোড/স্লাগ) | ✅ JoinCooperative (48KB), `/join/:slug` | ❌ | 🟦 **A** | নতুন পর্দা প্রস্তাব (M-23) |
| প্রোফাইল সম্পূর্ণতা গেট | ✅ `profile_completed` + সুরক্ষিত কলাম ট্রিগার | M-18 KYC পর্দা | 🟨 AB + 🟡 | দুটো মিলিয়ে এক নিয়ম |
| ছবি আপলোড/ক্রপ | ✅ `react-easy-crop`, `avatars` বাকেট | ডিজাইনে ছবি আছে, আপলোড ফ্লো নেই | 🟦 **A** | Storage + crop নতুন UI-তে |
| পাসওয়ার্ড/নিরাপত্তা সেটিংস | ✅ Security.tsx | M-20 অ্যাকাউন্ট ও নিরাপত্তা | 🟨 AB | M-20-এ মার্জ |
| ৪০৩ / ত্রুটি / অফলাইন / ৪০৪ পর্দা | ⚠️ ErrorBoundary আছে, নির্দিষ্ট পর্দা নেই | ✅ S-05, S-06 | 🟩 **B** | প্রোটোটাইপের পর্দাই ব্যবহার |

## C.2 টেন্যান্ট ও সমিতি ব্যবস্থাপনা

| ফিচার | বিদ্যমান অ্যাপ | প্রোটোটাইপ | স্ট্যাটাস | করণীয় |
|---|---|---|---|---|
| মাল্টি-টেন্যান্ট মডেল (organizations + organization_members) | ✅ + RLS + ভ্যালিডেশন ট্রিগার | আর্কিটেকচারে স্বীকৃত, UI নেই | 🟦 **A** | **অপরিবর্তিত রাখা** (কাজ করা অংশ) |
| সমিতি সুইচার | ✅ CooperativeTenantGuard, `/somobay/:slug` | ✅ S-02 Organization Switcher | 🟨 AB | নতুন UI |
| প্রতি-সমিতি মডিউল টগল (`organizations.config.enabled_modules`) | ✅ ৭টি মডিউল আইডি | ❌ নেই | 🟦 **A** | **অবশ্যই নেওয়া** — A-36 সেটিংস হাবে মডিউল টগল; ANAV অনুযায়ী লুকানো |
| সমিতির ব্র্যান্ডিং (logo, রঙ, ফন্ট) | ✅ AppSettings + `server.ts` API + app_settings টেবিল | ❌ | 🟦 **A** | **অবশ্যই নেওয়া** — কিন্তু নতুন টোকেন সিস্টেমে ম্যাপ করে (ডিজাইন সিস্টেম ভাঙা যাবে না) |
| সমিতি সেটিংস (নিয়ম, কিস্তি, ডিউ-ডে) | ✅ GeneralSavingsSettings (25KB) | A-36, A-03…A-06 | 🟨 AB + 🟡 | প্রোটোটাইপের স্কিম-সংস্করণ মডেলে মার্জ |
| সমিতির রেজিস্ট্রেশন/আইনগত তথ্য | ✅ GeneralSavingsWizard ধাপ ২ (নিবন্ধন ও আইন) | ❌ | 🟦 **A** | টেন্যান্ট অনবোর্ডিং ফেজে |
| কমিটি/পরিচালনা পর্ষদ রেকর্ড | ⚠️ wizard ধাপ ৩ "সদস্য ও কমিটি" | ✅ AM-30 কমিটি | 🟨 AB | প্রোটোটাইপের মডেল + পুরনো ডেটা |

## C.3 সদস্য ব্যবস্থাপনা

| ফিচার | বিদ্যমান অ্যাপ | প্রোটোটাইপ | স্ট্যাটাস | করণীয় |
|---|---|---|---|---|
| সদস্য তালিকা + সার্চ/ফিল্টার | ✅ MemberList (URL স্টেট নেই) | ✅ A-07, AM-04 | 🟨 AB + 🟡 | নতুন UI + URL কুয়েরি স্টেট (পুরনো অডিটের P1) |
| সদস্য বিবরণ | ✅ MemberDetail (30KB) | ✅ A-10 ৩৬০° (QH/JG এক্সপোজার বাকি) | 🟨 AB + 🟧 I | §8.5 মার্জ সম্পূর্ণ করা |
| সদস্য যোগ (অ্যাডমিন) | ✅ AddMemberModal | ✅ A-08 উইজার্ড, AM-07 | 🟨 AB | উইজার্ড রাখা |
| আবেদন যাচাই/অনুমোদন কিউ | ✅ MemberList "আবেদন" ট্যাব | ✅ A-11, AM-08 | 🟨 AB | |
| KYC/NID যাচাই | ⚠️ ফিল্ড আছে, যাচাই ফ্লো নেই | ✅ A-08/A-11 + QH-এ QH-B-10 গেট | 🟩 **B** | নথি টেবিল + ভেরিফিকেশন লগ (অনুমোদন দরকার) |
| সদস্য অবস্থা (active/dormant/suspended/frozen) | ✅ profiles.status + অবস্থা ইতিহাস | ✅ A-12, AM-18 | 🟨 AB | |
| মৃত্যু দাবি নিষ্পত্তি | ❌ | ✅ A-14, AM-19 | 🟩 **B** | নতুন টেবিল/ফ্লো (অনুমোদন দরকার) |
| নমিনি ব্যবস্থাপনা | ❌ | ✅ M-19 | 🟩 **B** | নতুন টেবিল (অনুমোদন দরকার) |
| সদস্য প্রস্থান/হিসাব নিষ্পত্তি | ❌ (পুরনো অডিটেও "critical missing") | ✅ A-15, M-15, AM-11 | 🟩 **B** | নতুন ফ্লো |
| সদস্য স্থানান্তর (রুট/শাখা) | ❌ | ✅ A-16, AM-30 | 🟩 **B** | |
| ডিজিটাল পাসবুক | ❌ (পুরনো অডিটে চিহ্নিত) | ✅ M-14 স্টেটমেন্ট ও রসিদ কেন্দ্র | 🟩 **B** | পাসবুক ভিউ M-14-এ যোগ (বই নম্বর, কিস্তি নম্বর, সংগ্রহকের নাম) |

## C.4 সাধারণ সঞ্চয়

| ফিচার | বিদ্যমান অ্যাপ | প্রোটোটাইপ | স্ট্যাটাস | করণীয় |
|---|---|---|---|---|
| স্কিম/প্ল্যান তৈরি ও সংস্করণ | ✅ (সংস্করণ নেই) | ✅ A-04/A-05 সংস্করণ তুলনা | 🟨 AB + 🟩 | প্রোটোটাইপের সংস্করণ মডেল |
| একক জমা (সদস্য) | ✅ SingleDeposit | ✅ M-06/M-07 রসিদসহ | 🟨 AB | |
| দ্রুত সংগ্রহ (অ্যাডমিন/সংগ্রহক) | ✅ QuickCollectModal | ✅ AM-06, A-17 | 🟨 AB | |
| বাল্ক জমা/কিস্তি | ✅ BulkDeposit + RPC `bulk_deposit_selected`, `record_bulk_plan_installments` | ✅ A-18, AM-22 | 🟨 AB | **RPC রাখা** (সার্ভার-সাইড অ্যাটমিক — ভালো দিক) |
| CSV ইমপোর্ট ও ম্যাপিং | ❌ | ✅ A-19, AM-23 | 🟩 **B** | নতুন সার্ভার এন্ডপয়েন্ট |
| উত্তোলন আবেদন ও অনুমোদন | ✅ (ট্রিগার-নির্ভর ব্যালেন্স কর্তন) | ✅ M-10…M-12, A-22/A-23 | 🟨 AB + 🟡 | **অ্যাটমিক ট্রানজ্যাকশনে নেওয়া** (RPC) |
| উত্তোলনযোগ্য ব্যালেন্স সূত্র (posted − hold − সর্বনিম্ন − লক-ইন) | ❌ (শুধু total_collected) | ✅ সব পর্দায় একই সূত্র | 🟩 **B** | `member_plans`-এ hold/minimum/lock-in কলাম (অনুমোদন দরকার) |
| লেনদেন সংশোধন/রিভার্সাল | ⚠️ `recordReversal` আছে, UI নেই | ✅ A-27, AM-14 (JE) | 🟨 AB + 🟧 | প্রোটোটাইপের JE মডেল |
| ফরেনসিক লেনদেন বিবরণ/অডিট ট্রেইল | ❌ | ✅ A-26, AM-13 | 🟩 **B** | |
| স্টেটমেন্ট/রসিদ কেন্দ্র + রসিদ যাচাই | ⚠️ ReceiptModal | ✅ M-09, M-14, S-07 হ্যাশ যাচাই | 🟩 **B** | |
| বকেয়া রেজিস্টার | ⚠️ next_due_date/pending_fine | ✅ A-31, AM-12, M-13 | 🟩 **B** | |
| সঞ্চয় বিশ্লেষণ (ইনসাইটস) | ✅ SavingsInsights (40KB) | ⚠️ A-01/A-06 পরিসংখ্যান | 🟦 **A** + 🟡 | ইনসাইটসের গ্রাফ নতুন ডিজাইনে A-06-এ মার্জ |
| জরিমানা/পেনাল্টি | 🟥 আছে (R-A1…R-A3) | ❌ (নীতিগতভাবে নিষিদ্ধ) | 🟪 **D** + 🔴 | **সরানো বাধ্যতামূলক** — আপনার অনুমোদন দরকার (ডেটাবেস কলাম ও পুরনো ডেটা) |

## C.5 মাঠ সংগ্রহ ও ক্যাশ ব্যবস্থাপনা

| ফিচার | বিদ্যমান অ্যাপ | প্রোটোটাইপ | স্ট্যাটাস | করণীয় |
|---|---|---|---|---|
| সংগ্রহক ড্যাশবোর্ড | ⚠️ collector রোল আছে, আলাদা ড্যাশবোর্ড নেই | ✅ A-02 (মোবাইল ভ্যারিয়েন্ট) | 🟩 **B** | |
| দৈনিক সংগ্রহ শিট (বাড়ি বাড়ি) | ❌ (পুরনো অডিটে "critical missing") | ✅ A-32 রুট পরিকল্পনা + AM-06 | 🟩 **B** | |
| ক্যাশ বুক/দিনশেষ রেজিস্টার | ❌ | ✅ A-28, AM-15 | 🟩 **B** | নতুন টেবিল |
| তহবিল স্থানান্তর (নগদ↔ব্যাংক↔ওয়ালেট) | ⚠️ wallet_transactions টেবিল আছে, ফ্লো নেই | ✅ A-29, AM-20 | 🟨 AB + 🟧 | |
| ব্যাংক রিকনসিলিয়েশন | ❌ | ✅ A-30, AM-21 | 🟩 **B** | |
| রিমাইন্ডার/যোগাযোগ শিডিউল | ⚠️ notifications টেবিল | ✅ A-33, AM-32 | 🟨 AB | |
| অফলাইন সংগ্রহ + কিউ sync | ❌ | ✅ S-08, D-18 অফলাইন কিউ ব্যাজ | 🟩 **B** | বাস্তবায়নে service worker + কিউ টেবিল |

## C.6 ROSCA

| ফিচার | বিদ্যমান অ্যাপ | প্রোটোটাইপ | স্ট্যাটাস | করণীয় |
|---|---|---|---|---|
| চক্র তৈরি/সম্পাদনা | ✅ createRoscaPlan | ✅ RA-02/03, RAM-02/03 | 🟨 AB | |
| সিডিউল জেনারেশন | ✅ generateRoscaSchedule (periods) | ✅ RA-06 ড্র ক্যালেন্ডার | 🟨 AB | |
| ড্র সম্পাদন | ✅ conductDraw + চাকা অ্যানিমেশন | ✅ RA-07 (পুল গণনা → প্রাপক → maker≠checker → বিতরণ → রসিদ+হ্যাশ) | 🟨 AB + 🟩 | **প্রোটোটাইপের নিয়ন্ত্রণ + পুরনো অ্যানিমেশন/seed** |
| যাচাইযোগ্য এলোমেলোতা (draw_method + draw_seed) | ✅ সংরক্ষিত | ❌ | 🟦 **A** | **অবশ্যই নেওয়া** — RA-07-এ seed প্রকাশ |
| একাধিক চক্র/সাইকেল | ✅ startNextCycle (কিন্তু UI-তে `activeCount>=1` ব্লক) | ✅ একাধিক চক্র | 🟪 **D** + 🟡 | **কৃত্রিম সীমা সরানো** (নিজেদের অডিটের P1) |
| সিট ম্যাপ/ওয়েটলিস্ট | ⚠️ সদস্য তালিকা | ✅ RA-05 সিট বরাদ্দ + ওয়েটলিস্ট (⚠️D-48 যাচাই, KYC/মৃত্যু বাদ) | 🟩 **B** | |
| অপরিবর্তনীয় ড্র রেজিস্টার | ❌ | ✅ RA-08 | 🟩 **B** | |
| ডিফল্ট প্রতিকারের ধাপ | ❌ | ✅ RA-09 (⚠️D-41/D-46) | 🟩 **B** | |
| ডিফল্ট নীতি ও কমিটি | ❌ | ✅ RA-10 | 🟩 **B** | |
| চক্র রিপোর্ট/নিরীক্ষা | ✅ RoscaReports | ✅ RA-12, RAM-12 | 🟨 AB | |
| সদস্যপক্ষের চক্র ভিউ | ✅ RoscaMemberDetail, RoscaProgress | ✅ RM-01…RM-06 | 🟨 AB | |
| এক সমিতিতে ১টি স্কিমের কৃত্রিম সীমা | 🟥 আছে (SomobayList) | ❌ | 🟡 N | সরানো |

## C.7 যৌথ লক্ষ্য (Joint Goal)

| ফিচার | বিদ্যমান অ্যাপ | প্রোটোটাইপ | স্ট্যাটাস | করণীয় |
|---|---|---|---|---|
| লক্ষ্য তৈরি/সম্পাদনা | ✅ CreateGoal | ✅ JA-03 (⚠️D-43 সীমা ৫টি, সংস্করণ) | 🟨 AB | |
| সদস্য যোগদান/অনুমোদন | ✅ enrollMember (অনুমোদন নেই) | ✅ JA-05 যোগদান অনুমোদন (⚠️D-49) | 🟩 **B** | |
| অবদান সংগ্রহ | ✅ addContribution, userAddContribution | ✅ JA-06 কিউ + JM-03 | 🟨 AB | |
| খরচ ও প্রমাণ | ✅ addExpense (spent_by, approved_by, proof_url) | ✅ JA-08 বিতরণ অনুমোদন (maker≠checker, ⚠️D-50) | 🟨 AB | **পুরনো ফিল্ড মডেল ভালো — রাখা** |
| খরচ/লক্ষ্য হার্ড ডিলিট | 🟥 deleteGoal/deleteExpense | ❌ (নিষিদ্ধ, বিপরীত এন্ট্রি) | 🟪 **D** + 🔴 | **ডিলিট বন্ধ করে আর্কাইভ/রিভার্সাল** (অনুমোদন দরকার) |
| মাইলস্টোন/পূর্বাভাস | ⚠️ GoalProgress | ✅ JA-07 (⚠️D-68 লিডারবোর্ড নেই) | 🟨 AB | |
| মেয়াদোত্তীর্ণ ও নিষ্পত্তি (বৃদ্ধি/আনুপাতিক ফেরত) | ⚠️ GoalCompleted | ✅ JA-09 (⚠️D-39 দায় খাত) | 🟩 **B** | |
| লেনদেন তালিকা | ✅ GoalTransactions | ✅ JA-04 হাব | 🟨 AB | |
| লক্ষ্য রিপোর্ট | ✅ GoalReports | ✅ JA-10, JAM-10 (ট্রায়াল ব্যালেন্স ৳০) | 🟨 AB | |
| সদস্যপক্ষের ১০টি আলাদা পর্দা | ✅ UserGoal* (10 পেজ) | ✅ JM-01…JM-05 | 🟨 AB + 🟡 | পুরনো অ্যাপের নোটিশ/তথ্য পর্দা নতুন ডিজাইনে মার্জ |

## C.8 কর্জে হাসানা

| ফিচার | বিদ্যমান অ্যাপ | প্রোটোটাইপ | স্ট্যাটাস | করণীয় |
|---|---|---|---|---|
| আলাদা মডিউল (স্কিম নয়) | ⚠️ আলাদা টেবিল **আবার** `scheme_type='qard'` সারি | ✅ আলাদা মডিউল (মডিউল ৪) | 🟪 **D** | **ডুপ্লিকেশন দূর করা** — টেবিলই একমাত্র উৎস |
| তহবিল ব্যালেন্স | ✅ qard_funds (allocated/disbursed/recovered, ডিফল্ট ৳৫০,০০০ হার্ডকোড) | ✅ পুল: বরাদ্দ − হল্ড − প্রতিশ্রুতি (⚠️D-40) | 🟨 AB + 🟩 | হল্ড/প্রতিশ্রুতি কলাম (অনুমোদন দরকার) |
| সঞ্চয়ের snapshot | ✅ member_savings_snapshot | ✅ পূর্ণ snapshot (৪ স্তর + নিয়ম-সংস্করণ + সীমা) | 🟨 AB + 🟩 | প্রোটোটাইপের মডেলে উন্নীত |
| যোগ্যতা নিয়ম ইঞ্জিন | ❌ ("admin-configured" লেখা, কোড নেই) | ✅ ৪ স্তর · ১৪ নিয়ম · ১৬ কারণ-কোড · সংস্করণ v1–v3 | 🟩 **B** | নতুন টেবিল `qh_rules`, `qh_rule_versions` (অনুমোদন দরকার) |
| নিয়ম Simulation | ❌ | ✅ QA-04/QAM-04 (⚠️D-57 গোপনীয়তা) | 🟩 **B** | |
| কোটা/জানালা/ওয়েটলিস্ট | ❌ | ✅ QA-06 (⚠️D-51) | 🟩 **B** | |
| আবেদন কিউ + SLA | ⚠️ getApplications (status ফিল্টার) | ✅ QA-07 (SLA ৫ কার্যদিবস, লঙ্ঘন চিহ্নিত) | 🟩 **B** | |
| সিদ্ধান্ত: maker ≠ checker + কমিটি রেফারেন্স | ❌ (একজনই অনুমোদন) | ✅ QA-09 (⚠️D-45) + সীমা-ছাড় ব্যতিক্রম রেজিস্টার | 🟩 **B** | **নিয়ন্ত্রণ যোগ করা বাধ্যতামূলক** |
| আংশিক অনুমোদন (অঙ্ক কমানো) | ✅ approved_amount | ✅ + snapshot সীমার সাথে তুলনা | 🟨 AB | |
| বিতরণ + OTP গেট | ✅ disburseLoan (তহবিল যাচাই, ডুপ্লিকেট প্রতিরোধ) | ✅ QA-10 + OTP (BR-22) + ভাউচার/হ্যাশ | 🟨 AB + 🟩 | OTP লগ যোগ |
| পরিশোধ এন্ট্রি + রসিদ | ✅ recordRepayment (receipt_no, trx_ref) | ✅ QA-13 + অপরিবর্তনীয় রসিদ + QR | 🟨 AB + 🟩 | receipt_no ফরম্যাট এক করা (QR-YYMM-NNNN) |
| কিস্তি ছক (schedule) | ⚠️ monthly_installment + next_due_date | ✅ পূর্ণ ছক (গ্রেস, আগাম, গোলাকার সমন্বয়) | 🟩 **B** | `qh_installments` টেবিল (অনুমোদন দরকার) |
| বকেয়া/শ্রেণিকরণ/প্রতিকার | ❌ (status শুধু active/completed) | ✅ QA-14 (regular/watch/late/doubt/loss ⚠️D-44) | 🟩 **B** | |
| write-off নিয়ন্ত্রণ | ❌ | ✅ QA-16 (শুধু ORG_ADMIN, নিরীক্ষক অ্যালার্ট, BR-23) | 🟩 **B** | |
| পুনর্গঠন (restructuring) | ❌ | ⚠️ নীতি লেখা (⚠️D-52), পর্দা আংশিক | 🟧 I | |
| সমাপ্তি সনদ | ❌ | ✅ QA-15/QM-08 (QHC-… + হ্যাশ) | 🟩 **B** | |
| প্রকাশ্য সম্মতি (consent_public_sharing) | ✅ ফিল্ড আছে | ❌ নেই | 🟦 **A** | **নেওয়া** — QM-04 আবেদনপত্রে সম্মতি চেকবক্স |
| উদ্দেশ্যভিত্তিক শ্রেণি ও সামাজিক প্রভাব | ⚠️ শুধু `purpose` টেক্সট | ✅ ৬ ক্যাটাগরি + প্রভাব রিপোর্ট (⚠️D-69) | 🟩 **B** | |
| QH রিপোর্ট/নিরীক্ষা | ⚠️ একই AdminQardHasanah পর্দা | ✅ QA-17/QAM-17 (রেগুলেটরি সারাংশ ⚠️D-61) | 🟩 **B** | |
| আবেদন কোড ফরম্যাট | 🟥 এলোমেলো ৪ অঙ্ক | ✅ QHA-YYMM-NNNN | 🟡 N | **সিকোয়েন্স জেনারেটর** (DB sequence) |
| ১১টি রুট এক পর্দায় | 🟥 ডুপ্লিকেট | ✅ ১৭টি আলাদা পর্দা × ২ প্রেজেন্টেশন | 🟪 **D** | প্রোটোটাইপের ভাগই চূড়ান্ত |

## C.9 রিপোর্ট, নিরীক্ষা ও শাসন

| ফিচার | বিদ্যমান অ্যাপ | প্রোটোটাইপ | স্ট্যাটাস | করণীয় |
|---|---|---|---|---|
| রিপোর্ট কেন্দ্র | ⚠️ AdminReports (টেন্যান্ট ফিল্টার নেই) | ✅ A-34, AM-25 | 🟨 AB + 🔴 | **ফিল্টার ঠিক করা আগে** |
| CSV/প্রিন্ট এক্সপোর্ট | ✅ | ✅ ডিজাইন | 🟨 AB | এক্সপোর্টে টেন্যান্ট স্কোপ |
| আর্থিক বিবরণ/রেগুলেটরি রিটার্ন | ❌ | ✅ A-35, AM-24 | 🟩 **B** | |
| সাধারণ লেজার/খতিয়ান | ❌ | ✅ A-25, AM-17 | 🟩 **B** | |
| ট্রায়াল ব্যালেন্স ৳০ যাচাই | ❌ | ✅ প্রতিটি মডিউল রিপোর্টে | 🟩 **B** | |
| অডিট লগ | ✅ audit_logs টেবিল + ইনসার্ট পলিসি | ✅ A-38, AM-35 (অপরিবর্তনীয়) | 🟨 AB | টেবিল রাখা; UI নতুন |
| স্টাফ/রোল/পারমিশন (CRUDA ম্যাট্রিক্স) | ❌ | ✅ A-37, AM-34 | 🟩 **B** | |
| অনুমোদন সীমা ম্যাট্রিক্স | ❌ | ✅ ৫ স্তর (⚠️D-22) | 🟩 **B** | |
| দিনশেষ গেট (অমীমাংসিত এন্ট্রি) | ❌ | ✅ BR-25 | 🟩 **B** | |

## C.10 নোটিফিকেশন, নোটিশ ও যোগাযোগ

| ফিচার | বিদ্যমান অ্যাপ | প্রোটোটাইপ | স্ট্যাটাস | করণীয় |
|---|---|---|---|---|
| নোটিফিকেশন ট্রে | ✅ Notifications + `MODULARIZE_NOTIFICATIONS.sql` | ✅ M-16 | 🟨 AB | |
| নোটিফিকেশন পছন্দ | ❌ | ✅ S-04 | 🟩 **B** | |
| নোটিশ বোর্ড (সদস্য) | ✅ Notices/Updates | ✅ M-17 | 🟨 AB | |
| প্রমোশন/মিটিং টেমপ্লেট সিস্টেম (২৬ কলাম: popup, widget, meeting_time/location/status, viewers, attendees) | ✅ ManagePromotions (52KB) + AdminUpdates (74KB) + promotions টেবিল | ❌ | 🟦 **A** | **অবশ্যই নেওয়া** — নতুন ডিজাইনে A-33-এর সাথে মার্জ (মিটিং/হাজিরা আলাদা পর্দা) |
| পপআপ ব্যানার | ✅ NoticePopupBanner | ❌ | 🟦 **A** | নতুন কম্পোনেন্ট হিসেবে |
| সভার হাজিরা (attendees) | ✅ | ❌ | 🟦 **A** | নতুন পর্দা প্রস্তাব |
| SMS/যোগাযোগ শিডিউল | ⚠️ | ✅ A-33 | 🟨 AB | |

## C.11 প্ল্যাটফর্ম ও প্রযুক্তি

| ফিচার | বিদ্যমান অ্যাপ | প্রোটোটাইপ | স্ট্যাটাস | করণীয় |
|---|---|---|---|---|
| সুপার অ্যাডমিন প্যানেল (আলাদা অ্যাপ, ১২ রুট) | ✅ | ⚠️ P-01…P-12 লক করা কার্ড | 🟦 **A** | নতুন ডিজাইনে P-01…P-12 (আপনার অনুমোদনের পর) |
| সমিতি অনুমোদন (প্ল্যাটফর্ম) | ✅ CooperativeApproval (আলাদা অ্যাপে) | ❌ | 🟦 **A** | |
| PWA (manifest + service worker) | ✅ | ❌ | 🟦 **A** | **নেওয়া** — নতুন UI-তে PWA |
| ফন্ট/ব্র্যান্ডিং কনফিগ API | ✅ server.ts | ❌ | 🟦 **A** | নেওয়া (ডিজাইন টোকেনের সাথে ম্যাপ) |
| ডেস্কটপ-নির্দিষ্ট অ্যাডমিন লেআউট | ⚠️ রেসপনসিভ, আলাদা লেআউট নেই | ✅ আলাদা Web Panel (৭৭ পেজ) | 🟩 **B** | |
| ভূমিকাভিত্তিক আলাদা শেল/নেভ | ⚠️ (পুরনো অডিটে লিক চিহ্নিত) | ✅ Shell-A…E + ৭ ভূমিকার ল্যান্ডিং | 🟩 **B** | |
| স্বয়ংক্রিয় চুক্তি পরীক্ষা | ⚠️ puppeteer-core (devDep), স্ক্রিপ্ট নেই | ✅ ১২ হার্নেস + mobile-check.html | 🟩 **B** | React সংস্করণে টেস্ট হিসেবে নেওয়া |
| ডকুমেন্টেশন/স্পেক | ⚠️ README + ২ অডিট | ✅ specs/00…06 | 🟩 **B** | |

---

# D · গ্যাপ বিশ্লেষণ (দুই দিকে)

## D.1 প্রোটোটাইপে নেই — পুরনো অ্যাপ থেকে আনতেই হবে (হারানো যাবে না)

| # | ফিচার | উৎস | নতুন ডিজাইনে কোথায় বসবে | অগ্রাধিকার |
|---|---|---|---|---|
| G1 | **প্রতি-সমিতি মডিউল টগল** (`organizations.config.enabled_modules`) | `cooperativeService.ts:116`, `GeneralSavingsWizard.tsx:108` | A-36 সেটিংস হাব / AM-33 + ANAV ফিল্টার (যে মডিউল বন্ধ, তার গ্রুপ লুকানো) | 🔴 P0 |
| G2 | **স্ব-নিবন্ধন + অনুমোদনের অপেক্ষা** (Signup → PendingApproval) | `Signup.tsx`, `PendingApproval.tsx` | নতুন Shared পেজ S-09 (সাইনআপ) + S-10 (অপেক্ষমান) + A-11-এ কিউ | 🔴 P0 |
| G3 | **সমিতিতে যোগদানের আবেদন** (কোড/স্লাগ, `/join/:slug`) | `JoinCooperative.tsx` (48KB) | S-11 যোগদান আবেদন + A-11 যাচাই (ইতিমধ্যে কিউ আছে) | 🔴 P0 |
| G4 | **ব্র্যান্ডিং/ফন্ট/রঙ কনফিগ** (app_settings + organizations.logo_url + Express API) | `AppSettings.tsx`, `server.ts:310-447` | A-36-এ "ব্র্যান্ডিং" ট্যাব — **শুধু টোকেন-ম্যাপেবল মান** (accent, logo, ফন্ট) | 🟠 P1 |
| G5 | **প্রমোশন/নোটিশ/সভা টেমপ্লেট সিস্টেম** (২৬ কলাম, পপআপ, উইজেট, হাজিরা) | `promotions` টেবিল, `ManagePromotions.tsx` | A-33 রিমাইন্ডার ও যোগাযোগ → "নোটিশ ও সভা" উপ-পর্দা + M-17 নোটিশ বোর্ড + নতুন পপআপ কম্পোনেন্ট | 🟠 P1 |
| G6 | **PWA** (manifest + service worker) | `index.html:9,65`, `server.ts:448` | নতুন অ্যাপের শেলে; S-08 অফলাইন sync পর্দা এর সাথে যুক্ত | 🟠 P1 |
| G7 | **ছবি আপলোড ও ক্রপ** (`react-easy-crop`, avatars বাকেট) | `EditProfile.tsx` (39KB) | M-18 প্রোফাইল/KYC + A-08 নিবন্ধন উইজার্ড | 🟡 P2 |
| G8 | **নিরাপত্তা সেটিংস** (পাসওয়ার্ড, সেশন) | `Security.tsx` | M-20 অ্যাকাউন্ট ও নিরাপত্তা | 🟡 P2 |
| G9 | **সঞ্চয় ইনসাইটস/গ্রাফ** (SavingsInsights 40KB) | `SavingsInsights.tsx` | A-06 স্কিম বিবরণ ও পরিসংখ্যান + M-08 লেনদেন ইতিহাসে সারাংশ | 🟡 P2 |
| G10 | **সুপার অ্যাডমিন প্যানেল** (আলাদা অ্যাপ, ১২ রুট, সমিতি অনুমোদন) | পুরনো অডিট §10 | P-01…P-12 (ডিজাইন এখনো স্থগিত — আর্কিটেকচারে জায়গা রাখা) | 🟡 P2 |
| G11 | **RPC বাল্ক অপারেশন** (`bulk_deposit_selected`, `record_bulk_plan_installments`) | `generalSavingsService`, SQL | A-18/AM-22 বাল্ক জমা — সার্ভার-সাইড অ্যাটমিক হিসেবেই রাখা | 🔴 P0 |
| G12 | **প্রোফাইল কলাম সুরক্ষা ট্রিগার** (`protect_profile_privileged_columns`, `check_profile_role_update`, `protect_org_member_escalation`) | SQL ফাংশন/ট্রিগার | অপরিবর্তিত রাখা — নতুন UI এগুলো ভাঙবে না | 🔴 P0 |
| G13 | **consent_public_sharing** (QH আবেদনে প্রকাশ্য সম্মতি) | `qard_applications` | QM-04 আবেদনপত্রে সম্মতি চেকবক্স + QA-08-এ দৃশ্যমান | 🟡 P2 |
| G14 | **draw_seed / draw_method** (যাচাইযোগ্য লটারি) | `rosca_periods` | RA-07/RAM-08 ড্র সম্পাদনে seed প্রকাশ ও হ্যাশ | 🔴 P0 |
| G15 | **কমিটি/পরিচালনা তথ্য** (wizard ধাপ ৩) | `GeneralSavingsWizard.tsx` | AM-30 কমিটি পর্দায় মার্জ | 🟡 P2 |
| G16 | **নোটিফিকেশন মডুলার টেবিল গঠন** (organization_id সহ) | `MODULARIZE_NOTIFICATIONS.sql` | M-16/A-33 — অপরিবর্তিত রাখা | 🟠 P1 |

## D.2 পুরনো অ্যাপে নেই — প্রোটোটাইপ থেকে ব্যাকএন্ডে বাস্তবায়ন করতে হবে

| # | ফিচার | প্রোটোটাইপ | ব্যাকএন্ডে কী লাগবে | অগ্রাধিকার |
|---|---|---|---|---|
| N1 | **maker ≠ checker + অনুমোদন সীমা ম্যাট্রিক্স** | A-20/A-21, QA-09, ⚠️D-22 | নতুন রোল (accountant/manager/approver/auditor) + `approval_limits` + প্রতিটি সিদ্ধান্তে দুই স্বাক্ষর | 🔴 P0 |
| N2 | **দ্বৈত-এন্ট্রি লেজার + ট্রায়াল ব্যালেন্স ৳০** | A-25, A-35, প্রতিটি মডিউল রিপোর্ট | `ledger_entries` (debit/credit, account, module, ref, hash, prev_hash) — **সবচেয়ে বড় স্কিমা পরিবর্তন** | 🔴 P0 |
| N3 | **অপরিবর্তনীয় রসিদ + হ্যাশ + QR যাচাই** | M-09, S-07, QA-13 | রসিদ টেবিলে hash/checksum, UPDATE/DELETE বন্ধ (RLS + ট্রিগার) | 🔴 P0 |
| N4 | **সংশোধন/রিভার্সাল JE** (মুছে ফেলা নয়) | A-27, AM-14 | রিভার্সাল এন্ট্রি + `superseded_by` | 🔴 P0 |
| N5 | **যোগ্যতা ইঞ্জিন** (৪ স্তর, ১৪ নিয়ম, ১৬ কারণ-কোড, সংস্করণ, snapshot) | QA-03…QA-05, QAM-03…05 | `qh_rules`, `qh_rule_versions`, `qh_eligibility_evaluations` | 🟠 P1 |
| N6 | **Simulation** (নিয়ম বদলের প্রভাব, গোপনীয়তা-নিরাপদ) | QA-04, QAM-04 | সার্ভার-সাইড গণনা (ক্লায়েন্টে নয়) + ফলাফল লগ | 🟠 P1 |
| N7 | **কোটা/জানালা/পুল** (বরাদ্দ − হল্ড − প্রতিশ্রুতি) | QA-06, QAM-06 | `qard_funds`-এ held/committed কলাম + `qh_windows` | 🟠 P1 |
| N8 | **ঋণ শ্রেণিকরণ ও বকেয়া প্রতিকারের ধাপ** | QA-14, QAM-14 | শ্রেণি গণনা (ডেটা-ভিত্তিক) + প্রতিকার ধাপের লগ | 🟠 P1 |
| N9 | **write-off নিয়ন্ত্রণ** (শুধু ORG_ADMIN + নিরীক্ষক অ্যালার্ট) | QA-16, QAM-16 | `qard_writeoffs` টেবিল | 🟠 P1 |
| N10 | **সমাপ্তি সনদ** (QHC-… + হ্যাশ) | QA-15, QM-08 | সনদ টেবিল/PDF জেনারেটর | 🟡 P2 |
| N11 | **OTP গেট বিতরণে** (BR-22) | QA-10, QAM-10 | OTP লগ + ভেরিফিকেশন সার্ভিস | 🟠 P1 |
| N12 | **দিনশেষ ক্যাশ বুক ও দিনশেষ গেট** | A-28, AM-15, BR-25 | `cash_book_days` + অমীমাংসিত এন্ট্রি গেট | 🟠 P1 |
| N13 | **রিকনসিলিয়েশন ও ব্যতিক্রম নিষ্পত্তি** | A-30, AM-21 | ব্যাংক স্টেটমেন্ট ইমপোর্ট + মিল/অমিল টেবিল | 🟡 P2 |
| N14 | **মৃত্যু দাবি, নমিনি, প্রস্থান নিষ্পত্তি, স্থানান্তর** | A-14/A-15/A-16, M-15/M-19 | নতুন টেবিল + ওয়ার্কফ্লো | 🟡 P2 |
| N15 | **CSV ইমপোর্ট ও ম্যাপিং** | A-19, AM-23 | সার্ভার এন্ডপয়েন্ট + ভ্যালিডেশন + রোলব্যাক | 🟡 P2 |
| N16 | **স্টাফ/রোল/পারমিশন (CRUDA ম্যাট্রিক্স)** | A-37, AM-34 | `staff`, `roles`, `permissions` + RLS ম্যাপিং | 🟠 P1 |
| N17 | **রেগুলেটরি রিটার্ন/আর্থিক বিবরণ** | A-35, AM-24 | রিপোর্ট জেনারেশন (⚠️D-61) | 🟡 P2 |
| N18 | **অফলাইন কিউ ও sync** (D-18) | S-08 | কিউ টেবিল + সংঘর্ষ সমাধান নীতি | 🟡 P2 |
| N19 | **ফোল্ড/ট্যাব-ভিত্তিক মোবাইল তথ্য-বাজেট শৃঙ্খলা** (MC-13) | সব AM পর্দা | শুধু UI — ব্যাকএন্ড লাগবে না | 🟢 সহজ |
| N20 | **সুদমুক্ত ভাষা চুক্তি** (নিষিদ্ধ শব্দ + "সুদ ৳০") | সব ১৯৯ স্ক্রিন | কনটেন্ট লিন্ট টেস্ট হিসেবে CI-তে | 🟢 সহজ |

## D.3 ডুপ্লিকেট ও বিরোধ — সমাধান বাধ্যতামূলক

| # | বিরোধ | বিশ্লেষণ (উদ্দেশ্য ও বিকল্প) | প্রস্তাব |
|---|---|---|---|
| X1 | **কর্জে হাসানা দুই জায়গায়:** `qard_*` টেবিল **এবং** `somobay_plans`-এ `scheme_type='qard'` সারি (সিড করা) | উদ্দেশ্য ছিল স্কিম তালিকায় QH দেখানো; ফলে একই তথ্যের দুই উৎস। বিকল্প: (ক) সারি রেখে টেবিলকে সত্য ধরা → বিভ্রান্তি থেকে যায়; (খ) সারি বাদ দিয়ে মডিউল তালিকায় আলাদাভাবে দেখানো | **(খ)** — `scheme_type='qard'` সারি নিষ্ক্রিয় (ডিলিট নয়, `is_active=false` + মাইগ্রেশন নোট); UI-তে QH আলাদা মডিউল কার্ড। **আপনার অনুমোদন দরকার** |
| X2 | **দ্বৈত রোল মডেল:** `profiles.role` বনাম `organization_members.role` | উদ্দেশ্য: গ্লোবাল অ্যাডমিন শনাক্ত করা; ফলে টেন্যান্ট-সীমা ঝুঁকি। বিকল্প: (ক) গ্লোবাল রোল রেখে টেন্যান্ট রোলও চেক; (খ) গ্লোবাল রোলকে শুধু `platform_admins`-এ নেওয়া | **(খ)** — অ্যাডমিন-ত্ব নির্ধারণ শুধু `organization_members.role` + `platform_admins`; `profiles.role` পঠন-অনুমতি থেকে বাদ। **RLS পরিবর্তন → অনুমোদন দরকার** |
| X3 | **`profit_percentage`, `late_fee_amount`, `pending_fine`** | উদ্দেশ্য ছিল সম্ভবত ঐতিহ্যবাহী সমবায় মুনাফা/জরিমানা; কিন্তু পণ্যনীতি (README + BR-13) সুদমুক্ত। বিকল্প: (ক) কলাম রেখে ০-এ লক; (খ) কলাম বাদ + ঐতিহাসিক ডেটা যাচাই | **(ক) আগে, (খ) পরে** — প্রথমে সব লেখায় ০ বাধ্যতামূলক (CHECK + ট্রিগার) ও UI থেকে সরানো; তারপর ঐতিহাসিক ডেটায় ০-এর বেশি মান আছে কি না নিরীক্ষা করে সিদ্ধান্ত। **আর্থিক লজিক পরিবর্তন → আপনার অনুমোদন দরকার** |
| X4 | **১১টি QH রুট → এক কম্পোনেন্ট** (`AdminQardHasanah`) | উদ্দেশ্য: দ্রুত ডেভেলপমেন্ট; ফলে প্রতিটি কাজের আলাদা পর্দা/অডিট নেই। বিকল্প: কম্পোনেন্ট ভেঙে ১৭টি পর্দা | প্রোটোটাইপের ১৭+১৭ ভাগই চূড়ান্ত (QA/QAM কোড ম্যাপিং) |
| X5 | **রুট দ্বৈততা** (`/somobay/manage`, `/somobay/my`, `/savings`, `/goals`, `/qard` + ২০ রিডাইরেক্ট) | উদ্দেশ্য: পুরনো লিংক সংরক্ষণ; ফলে নেভিগেশন গোলকধাঁধা (নিজেদের অডিটে চিহ্নিত) | একটি ক্যানোনিক্যাল রুট ম্যাপ (E.6) + বাকিগুলো ৩০১ রিডাইরেক্ট |
| X6 | **কৃত্রিম সীমা:** এক সমিতিতে ১ স্কিম, ১ সক্রিয় ROSCA চক্র | উদ্দেশ্য: পরীক্ষামূলক সরলীকরণ; বাস্তব সমিতির প্রয়োজনের বিরোধী | সরানো (নিজেদের অডিটের P1) — কোনো ডেটা পরিবর্তন লাগবে না |
| X7 | **হার্ড ডিলিট** (`deleteGoal`, `deleteExpense`) | উদ্দেশ্য: ভুল এন্ট্রি মুছে ফেলা; বিকল্প আছে — আর্কাইভ + বিপরীত এন্ট্রি (প্রোটোটাইপে প্রদর্শিত) | ডিলিট বন্ধ, `status='void'` + রিভার্সাল। **আর্থিক লজিক পরিবর্তন → অনুমোদন দরকার** |
| X8 | **একই কাজের দুই ব্যালেন্স উৎস:** `member_plans.total_collected` বনাম ক্লায়েন্ট-সাইড `calculateSavingsBalance` | উদ্দেশ্য: দ্রুত পঠন; ঝুঁকি: অমিল | একমাত্র উৎস = লেজার (N2); `total_collected` ক্যাশ হিসেবে ট্রিগারে sync |

## D.4 দুই দিকেই উন্নতি দরকার

| বিষয় | বিদ্যমান অ্যাপে সমস্যা | প্রোটোটাইপে সমস্যা | সমাধান |
|---|---|---|---|
| সদস্য ৩৬০° | MemberDetail-এ মডিউলভিত্তিক এক্সপোজার অসম্পূর্ণ | A-10/AM-05-এ QH/JG এক্সপোজার সংযুক্তি বাকি (§8.5) | একই কম্পোনেন্টে চার মডিউলের এক্সপোজার |
| অ্যাডমিন হোম | Dashboard 52KB, ভূমিকা অনুযায়ী ভাগ নেই | A-01/AM-01-এ মডিউল সারাংশ কার্ড বাকি | ভূমিকাভিত্তিক হোম + চার মডিউলের সারাংশ |
| সার্চ/ফিল্টার স্টেট | URL-এ সংরক্ষিত নয় → ব্যাকে হারায় | প্রোটোটাইপে হ্যাশ-নেভ, কিন্তু ফিল্টার স্টেট নেই | URL কুয়েরি প্যারামিটারে ফিল্টার (দুটোতেই) |
| খালি অবস্থা | সাধারণ "তথ্য নেই" টেক্সট | অধিকাংশ পর্দায় নির্দেশনাসহ খালি অবস্থা আছে, কয়েকটিতে নেই | প্রোটোটাইপের প্যাটার্ন সব জায়গায় |
| ব্যাক নেভিগেশন | ৮টি রিগ্রেশন; `useAppBack` আংশিক | `AM_BACK` ম্যাপ + ফ্লো-বার (হার্নেসে যাচাইকৃত) | প্রোটোটাইপের ম্যাপই ভিত্তি; ওয়েবে ব্রাউজার হিস্টরি |
| মোবাইল ইনপুট | `inputMode="numeric"` নেই | চুক্তিতে আছে (MC-11/15/16) | প্রোটোটাইপের চুক্তি প্রয়োগ |

---

# E · চূড়ান্ত সংহতকরণ পরিকল্পনা

## E.1 চূড়ান্ত আর্কিটেকচার

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ক্লায়েন্ট স্তর — এক ডিজাইন সিস্টেম, দুই প্রেজেন্টেশন                      │
│  ১) Mobile App (React + PWA): Member Shell · Collector Shell ·            │
│     Admin Shell A–E (ভূমিকাভিত্তিক ল্যান্ডিং + ৫-স্লট নেভ + ড্রয়ার)         │
│  ২) Desktop Web Panel: সাইডবার (ANAV ৯+ গ্রুপ) + টপ-বার + ব্রেডক্রাম্ব      │
│     একই লজিক্যাল পেজ → ভিন্ন লেআউট কম্পোনেন্ট (ভিউ টগল নয়)                │
├──────────────────────────────────────────────────────────────────────────┤
│  অ্যাপ্লিকেশন স্তর — একক ডোমেইন লজিক (ক্লায়েন্টে নয়)                     │
│  domain/  eligibility-engine · ledger · approval(limits+maker/checker)    │
│           schedule(instalments/draws) · classification · reconciliation   │
│  services/ gsService · roscaService · jointGoalService · qhService        │
│            memberService · tenantService · reportService · notifyService  │
│  contract/ একই TS টাইপ + ভ্যালিডেশন স্কিমা দুই প্রেজেন্টেশনের জন্য        │
├──────────────────────────────────────────────────────────────────────────┤
│  API স্তর (নতুন, Express/Edge Functions) — আর্থিক লেখা শুধু এখানে         │
│  POST /tx/deposit · /tx/withdraw/approve · /rosca/draw · /qh/apply        │
│       /qh/decide · /qh/disburse · /qh/repay · /qh/writeoff · /ledger/day  │
│  প্রতিটিতে: টেন্যান্ট স্কোপ + রোল + সীমা + idempotency-key + অডিট লেখা     │
│  (পঠন সরাসরি Supabase RLS দিয়ে চলতে পারে; লেখা সার্ভার দিয়ে বাধ্যতামূলক)   │
├──────────────────────────────────────────────────────────────────────────┤
│  ডেটা স্তর — Supabase Postgres (বিদ্যমান) + Auth + Storage                │
│  অপরিবর্তিত: organizations · organization_members · profiles ·            │
│              platform_admins · audit_logs · notifications · promotions    │
│  সম্প্রসারিত: somobay_plans · member_plans · plan_payments ·              │
│              savings_withdrawals · rosca_periods · joint_goal_expenses ·  │
│              qard_funds · qard_applications · qard_loans · qard_repayments│
│  নতুন: ledger_entries · receipts · qh_rules · qh_rule_versions ·          │
│        qh_eligibility_evaluations · qh_windows · qh_installments ·        │
│        qh_writeoffs · qh_certificates · otp_logs · approval_limits ·      │
│        cash_book_days · reconciliation_runs · documents (KYC) · nominees  │
└──────────────────────────────────────────────────────────────────────────┘
```

**মূল নীতি:**
1. **এক Backend, এক DB, এক নিয়ম** — UI আলাদা, লজিক কখনো আলাদা নয় (§৬.৫)।
2. **আর্থিক লেখা ক্লায়েন্ট থেকে নয়** — বর্তমান ঝুঁকি (R-A9) দূর করতে API স্তর; বিদ্যমান RLS অতিরিক্ত সুরক্ষা হিসেবে থাকবে।
3. **বিদ্যমান কাজ করা অংশ অক্ষুণ্ণ** — টেন্যান্ট মডেল, RPC বাল্ক ফাংশন, প্রোফাইল-সুরক্ষা ট্রিগার, QH-এর তহবিল/বিতরণ/পরিশোধ যাচাই বজায় থাকবে।
4. **প্রোটোটাইপের ডিজাইন ভাষাই চূড়ান্ত** — পুরনো অ্যাপের লেআউট/রঙ/কম্পোনেন্ট চাপানো হবে না; পুরনো জটিল ওয়ার্কফ্লো নতুন UI-তে সাজানো হবে।
5. **কোনো ডুপ্লিকেট পর্দা/টেবিল নয়** — একই কাজের একই পর্দা (E.2), একই তথ্যের একই উৎস (D.3)।
6. **সুদমুক্ততা অপরিবর্তনীয়** — কোনো ফিল্ড, গণনা বা ভাষায় সুদ/মুনাফা/বিলম্ব ফি থাকবে না (X3)।

## E.2 সম্পূর্ণ পেজ ইনভেন্টরি (চূড়ান্ত)

| গ্রুপ | লজিক্যাল পেজ | স্ক্রিন (Web + App + Member) | অবস্থা |
|---|---|---|---|
| সাধারণ সঞ্চয় (GS) | ৬৭ | ৩৮ Admin Web + ৩৫ Admin App + ২১ Member = **৯৪** | ✅ তৈরি |
| ROSCA | ১৮ | ১২ + ১২ + ৬ = **৩০** | ✅ তৈরি |
| যৌথ লক্ষ্য (JG) | ১৫ | ১০ + ১০ + ৫ = **২৫** | ✅ তৈরি |
| কর্জে হাসানা (QH) | ২৫ | ১৭ + ১৭ + ৮ = **৪২** | ✅ তৈরি |
| Shared (লগইন, সুইচার, সেটিংস, নোটিফিকেশন পছন্দ, ৪০৩/৪০৪, ডকুমেন্ট ভিউয়ার, অফলাইন) | ৮ | **৮** (+৩ শেয়ার্ড ডেস্কটপ ভ্যারিয়েন্ট) | ✅ তৈরি |
| **নতুন: অনবোর্ডিং** (S-09 সাইনআপ · S-10 অনুমোদনের অপেক্ষা · S-11 সমিতিতে যোগদান) | ৩ | ৩ (শেয়ার্ড) | 🔵 প্রস্তাবিত (G2, G3) |
| **নতুন: নোটিশ ও সভা** (A-39 নোটিশ/প্রমোশন ব্যবস্থাপনা · A-40 সভা ও হাজিরা · M-22 সভা ও নোটিশ — সদস্য) | ৩ | ২ Web + ২ App + ১ Member = ৫ | 🔵 প্রস্তাবিত (G5) |
| **Super Admin** (P-01…P-12: সমিতি অনুমোদন, প্ল্যাটফর্ম কনফিগ, নিরীক্ষা, বিলিং ইত্যাদি) | ১২ | ১২ (Web) + পরে App | ⏸ ডিজাইন স্থগিত (আপনার সিদ্ধান্ত) |
| **মোট (সুপার অ্যাডমিন বাদে)** | **১৩১** | **২০৭** | |
| **মোট (সুপার অ্যাডমিনসহ)** | **১৪৩** | **২১৯** | |

> বর্তমানে তৈরি: ১২৫ লজিক্যাল পেজ / ১৯৯ স্ক্রিন। নতুন যোগ হবে ৬ পেজ / ৮ স্ক্রিন; সুপার অ্যাডমিন ১২/১২।
> ব্র্যান্ডিং কনফিগ (G4) আলাদা পেজ নয় — A-36 সেটিংস হাবের ট্যাব। ডিজিটাল পাসবুক (C.3) আলাদা পেজ নয় — M-14-এর ভিউ। ইনসাইটস (G9) আলাদা পেজ নয় — A-06-এ মার্জ।

## E.3 ভূমিকাভিত্তিক পেজ ম্যাপিং

| ভূমিকা | শেল | ল্যান্ডিং | পৌঁছানো পর্দা | অনুমোদন সীমা (⚠️D-22) | বিদ্যমান অ্যাপের রোল ম্যাপিং |
|---|---|---|---|---|---|
| **MEMBER** (সদস্য) | Member Shell (বটম নেভ ৫ স্লট) | M-01 | ৪০টি মোবাইল পর্দা (GS ২১ + RM ৬ + JM ৫ + QM ৮) + নতুন ৩ (S-09/10/11, M-22) | নেই (শুধু নিজের এন্ট্রি) | `organization_members.role='member'` |
| **COLLECTOR** (সংগ্রহক) | Shell-A | A-02 মাঠ ড্যাশবোর্ড | AM-04, AM-06, AM-12, AM-22, AM-31, AM-32, QAM-13 | ৳০ (এন্ট্রি শুধু, অনুমোদন নয়) | `role='collector'` ✅ |
| **ACCOUNTANT** (হিসাবরক্ষক) | Shell-B | AM-01 (হিসাব) | AM-10…AM-26 (লেজার, ক্যাশ বুক, রিকন, রিপোর্ট) | ৳০ (এন্ট্রি শুধু) | **নতুন রোল** (বর্তমানে নেই) |
| **MANAGER** (ব্যবস্থাপক) | Shell-C | AM-01 (অনুমোদন কিউ) | AM-02…AM-03, AM-14, AM-16, QAM-09 | ৳৫০,০০০ | **নতুন রোল** |
| **APPROVER** (অনুমোদনকারী) | Shell-C | AM-02 | AM-03, AM-11, AM-19, RAM-08, JAM-08, QAM-09/10 | ৳২,০০,০০০ | **নতুন রোল** |
| **ORG_ADMIN** (সমিতি প্রশাসক) | Shell-B | AM-01 | সব ৭৪টি অ্যাপ পর্দা + A-36/A-37/A-38 | সীমা নেই, কিন্তু maker ≠ checker বাধ্য | `role='cooperative_admin'` ✅ |
| **AUDITOR** (নিরীক্ষক) | Shell-E (শুধু পঠন) | AM-35/রিপোর্ট | রিপোর্ট, অডিট লগ, লেজার — লেখা নেই | ৳০ (পঠন) | `platform_admins.permission_level='auditor'` (আংশিক) |
| **EXTERNAL AUDITOR** (বহিঃনিরীক্ষক) | Shell-E | A-35 | রেগুলেটরি রিটার্ন, ট্রায়াল ব্যালেন্স | ৳০ (পঠন) | নেই |
| **OBSERVER** (পর্যবেক্ষক) | Shell-E | A-01 | শুধু ড্যাশবোর্ড/রিপোর্ট | ৳০ (পঠন) | নেই |
| **PLATFORM OWNER** (সুপার অ্যাডমিন) | Super Admin শেল | P-01 | P-01…P-12 | প্ল্যাটফর্ম-স্তর | ✅ `permission_level='platform_owner'` |

**নীতি:** একই ব্যক্তি সমিতি A-তে প্রশাসক ও সমিতি B-তে সদস্য হতে পারেন → ভূমিকা সবসময় `organization_members` থেকে, কখনো `profiles.role` থেকে নয় (X2)। প্রতিটি ভূমিকার নেভিগেশন, ল্যান্ডিং ও পারমিশন আলাদা (কোনো লিক নয়)।

## E.4 চার-মডিউল ফিচার ম্যাপিং

| মডিউল | লজিক্যাল পেজ | Admin Web | Admin App | Member | বিদ্যমান টেবিল | নতুন টেবিল/কলাম | বিদ্যমান সার্ভিস → নতুন |
|---|---|---|---|---|---|---|---|
| **১ · সাধারণ সঞ্চয়** | ৬৭ | A-01…A-38 | AM-01…AM-35 (+A-02) | M-01…M-21 | somobay_plans, member_plans, plan_payments, savings_withdrawals, wallet_transactions, member_wallets | ledger_entries, receipts, cash_book_days, reconciliation_runs, documents, nominees; member_plans-এ hold/minimum/lock_in | generalSavingsService (৬) → gsService + ledgerService; withdrawalService → API |
| **২ · ROSCA** | ১৮ | RA-01…RA-12 | RAM-01…RAM-12 | RM-01…RM-06 | somobay_plans(scheme_type='rosca'), member_plans, plan_payments, rosca_periods | rosca_periods-এ seat_no, waitlist, hash, seed প্রকাশ; draw_register (অপরিবর্তনীয়) | roscaService (১১) → roscaService + drawService (maker≠checker) |
| **৩ · যৌথ লক্ষ্য** | ১৫ | JA-01…JA-10 | JAM-01…JAM-10 | JM-01…JM-05 | somobay_plans(scheme_type='joint_goal'), member_plans, plan_payments, joint_goal_expenses | joint_goal_expenses-এ reversal/void, proof_hash; goal_versions | jointGoalService (১৫) → jointGoalService (ডিলিট বন্ধ, রিভার্সাল) |
| **৪ · কর্জে হাসানা** | ২৫ | QA-01…QA-17 | QAM-01…QAM-17 | QM-01…QM-08 | qard_funds, qard_applications, qard_loans, qard_repayments | qh_rules, qh_rule_versions, qh_eligibility_evaluations, qh_windows, qh_installments, qh_writeoffs, qh_certificates, otp_logs; qard_funds-এ held/committed; qard_applications-এ rule_version/snapshot/committee/consent | qardHasanahService (১০) → qhService (১০ + eligibility/quota/classification/writeoff/certificate) |

**মডিউল-সাধারণ (ক্রস-মডিউল) ফিচার:** সদস্য ৩৬০° (A-10/AM-05) · অনুমোদন কিউ (A-20/A-21 + AM-02/03) · বকেয়া রেজিস্টার (A-31) · রিপোর্ট কেন্দ্র (A-34) · অডিট লগ (A-38) · নোটিফিকেশন (M-16) · রসিদ যাচাই (S-07) · অফলাইন কিউ (S-08)। এগুলো প্রতিটি মডিউলের ডেটা একই পর্দায় দেখায় — **ডুপ্লিকেট পর্দা তৈরি করা হবে না**।

## E.5 চূড়ান্ত ডিজাইন সিস্টেম

**উৎস:** `prototype/assets/ui.css` (৯৯.৬KB) + `skins.css` (৩৫.৭KB) + `specs/00`। পুরনো অ্যাপের Tailwind কম্পোনেন্ট/লেআউট **প্রয়োগ করা হবে না**; Tailwind v4 শুধু ইউটিলিটি হিসেবে থাকতে পারে, কিন্তু টোকেন ও কম্পোনেন্ট চুক্তি `ui.css` থেকেই আসবে।

| স্তর | চুক্তি |
|---|---|
| **টোকেন** | রঙ (primary/accent/warn/danger/ok/info + bg/card/border/ink), ব্যাসার্ধ, ফাঁকা (৪/৮/১২/১৬/২৪), ছায়া, টাইপ স্কেল — সব CSS ভেরিয়েবলে; React-এ একই নামের ডিজাইন টোকেন ম্যাপ |
| **মডিউল অ্যাকসেন্ট** | সবুজ = সাধারণ সঞ্চয় · নীল = ROSCA · বেগুনি = যৌথ লক্ষ্য · অ্যাম্বার/পান্না-সোনালি = কর্জে হাসানা (`data-theme="qh"`) |
| **কম্পোনেন্ট** | card (card-h/card-b) · kpis · tbl-scroll+tbl+tbl-sum · mrows · xtbl (মোবাইলে ≤৪ কলাম) · seg/chipset · radio-card · field/inp · alert/amalert · tl (টাইমলাইন) · foldgrp/acc2/tabs · decbar · flowbar · bottomnav · drawer · prog/ring/bar · filebtn · qr · who/avatar · iconbtn |
| **মডিউল কিট** | `rc-*` (ROSCA), `jg-*` (যৌথ লক্ষ্য), `qard-*` (কর্জে হাসানা — ২০ ক্লাস/১১৬ নিয়ম), `.qh-*` (ইসলামিক স্কিন) |
| **নেভ প্যাটার্ন** | ডেস্কটপ: সাইডবার + টপ-বার + ব্রেডক্রাম্ব · মোবাইল: অ্যাপ-হেড + ৫-স্লট বটম নেভ + হ্যামবার্গার ড্রয়ার (৪৯ এন্ট্রি) + সিদ্ধান্ত-বার + ফ্লো-বার |
| **শেল** | Shell-A (মাঠ) · Shell-B (হিসাব/প্রশাসন) · Shell-C (অনুমোদন) · Shell-D (সদস্য) · Shell-E (শুধু পঠন/নিরীক্ষক) |
| **ভাষা ও অঙ্ক** | সম্পূর্ণ বাংলা কপি · সব অঙ্ক বাংলা সংখ্যায় · ৳-এর পরে ল্যাটিন অঙ্ক নিষিদ্ধ · নিষিদ্ধ শব্দ সুদ/মুনাফা/লাভ/ঋণের দাম (নেতিবাচক প্রসঙ্গ ছাড়া) · অনুমোদিত প্রকাশ "সুদ ৳০" |
| **অ্যাক্সেসিবিলিটি** | ট্যাপ টার্গেট ≥৪৪px (মোবাইলে ≥৪০px বাধ্য) · আইকন বোতানে aria-label+title · WCAG AA কনট্রাস্ট · >৩২০০ অক্ষরের পর্দায় ফোল্ড/ট্যাব বাধ্যতামূলক |
| **ব্র্যান্ডিং (G4)** | সমিতি-নির্দিষ্ট logo/accent/ফন্ট শুধু **টোকেন ম্যাপেবল মান** হিসেবে বসবে — লেআউট/ব্যাসার্ধ/স্পেসিং বদলানোর সুযোগ নেই |
| **স্কিন** | additive/scoped (`data-theme`), কোনো স্ক্রিনের গঠন/হিসাব/স্ট্যাটাস রঙ বদলায় না |
| **যাচাই** | `tc/tui/tsk/tsk2/tmc` হার্নেস React সংস্করণে টেস্ট হিসেবে স্থানান্তর (কম্পোনেন্ট স্টোরি + ভিজ্যুয়াল রিগ্রেশন) |

## E.6 নেভিগেশন ও ইউজার ফ্লো

**ক্যানোনিক্যাল রুট ম্যাপ (দ্বৈততা দূর):** প্রতিটি লজিক্যাল পেজের একটিই রুট; পুরনো সব রুট ৩০১ রিডাইরেক্ট।

| অঞ্চল | রুট প্যাটার্ন | উদাহরণ |
|---|---|---|
| প্রমাণীকরণ | `/login` · `/signup` · `/pending` · `/join/:slug` | S-01, S-09, S-10, S-11 |
| সমিতি নির্বাচন | `/org` | S-02 |
| সদস্য | `/m/<module>/<page>` | `/m/savings`, `/m/savings/deposit`, `/m/rosca`, `/m/goals`, `/m/qard`, `/m/qard/apply` |
| Admin — সাধারণ সঞ্চয় | `/a/savings/...` | `/a/savings/members`, `/a/savings/queue`, `/a/savings/cashbook` |
| Admin — ROSCA | `/a/rosca/...` | `/a/rosca/circles/:id/draw` |
| Admin — যৌথ লক্ষ্য | `/a/goals/...` | `/a/goals/:id/payout` |
| Admin — কর্জে হাসানা | `/a/qard/...` | `/a/qard/rules`, `/a/qard/queue`, `/a/qard/disburse`, `/a/qard/writeoff` |
| Admin — শাসন | `/a/governance/...` | `/a/governance/staff`, `/a/governance/audit`, `/a/governance/reports` |
| সুপার অ্যাডমিন | `/p/...` (আলাদা বিল্ড/পোর্ট নয় — একই অ্যাপে রোল-গেটেড) | P-01…P-12 |

**তিন নেভ-মডেল (মোবাইল চুক্তি অনুযায়ী):**
1. **ল্যান্ডিং (৩টি):** ভূমিকার হোম — বটম নেভ ৫ স্লট + ড্রয়ার (৪৯ এন্ট্রি) + ব্যাক নেই।
2. **গভীর (৪৭টি):** ব্যাক বাধ্যতামূলক (ম্যাপ করা টার্গেট), বটম নেভ থাকে, ড্রয়ারে সক্রিয় এন্ট্রি হাইলাইট।
3. **ফ্লো (২৫টি):** ব্যাক + ফ্লো-বার, বটম নেভ/ড্রয়ার নেই, একটিমাত্র প্রাইমারি বোতাম সিদ্ধান্ত-বারে।

**ফ্লো তালিকা ও অবস্থা:**

| কোড | ফ্লো | অবস্থা |
|---|---|---|
| F-01…F-08 | সাধারণ সঞ্চয়ের ৮টি ফ্লো (নিবন্ধন → জমা → অনুমোদন → উত্তোলন → নিষ্পত্তি → সংশোধন → দিনশেষ → দাবি) | ✅ তৈরি (`flows.html`) |
| F-09 | ROSCA সার্কেল প্রস্তুতি (স্কিম → সিট বরাদ্দ → ক্রম) | ⬜ তৈরি নয় (পর্দা RA-02…RA-06 আছে) |
| F-10 | ROSCA মাসিক কিস্তি সংগ্রহ | ⬜ (পর্দা RA-10 আছে) |
| F-11 | ROSCA ড্র দিবস (পুল → প্রাপক → অনুমোদন → বিতরণ → রসিদ) | ⬜ (পর্দা RA-07 + RAM-08 ফ্লো পর্দা আছে) |
| F-12 | ROSCA ডিফল্ট ও প্রতিকার | ⬜ — **স্পেকে "বিলম্ব ফি" ধাপ আছে; ⚠️D-41 অনুযায়ী ফি নেই → ধাপ পুনর্নির্ধারণ করতে আপনার সিদ্ধান্ত দরকার** |
| F-13 | Joint Goal প্রস্তুতি ও যোগদান | ⬜ (পর্দা JA-03…JA-05, JAM-05 আছে) |
| F-14 | Joint Goal অর্জন ও অর্থ ব্যবহার | ⬜ (পর্দা JA-07/JA-08, JAM-08 আছে) |
| F-15 | QH যোগ্যতা কনফিগারেশন (নিয়ম → simulation → প্রকাশ) | ⬜ (পর্দা QA-03/QA-04, QAM-03/04 আছে) |
| F-16 | QH আবেদন → বিতরণ | ⬜ (পর্দা QM-04…QM-06, QA-07…QA-10, QAM-06/07 আছে) |
| F-17 | QH পরিশোধ → সমাপ্তি (+ ডিফল্ট → পুনর্গঠন → write-off শাখা) | ⬜ (পর্দা QM-07/QM-08, QA-11…QA-16, QAM-10/13/16 আছে) |

**ব্যাক-ম্যাপ নীতি:** প্রতিটি গভীর/ফ্লো পর্দার ব্যাক টার্গেট ডেটাতে সংজ্ঞায়িত (`AM_BACK`), হার্ডকোড স্ট্রিং নয়; হার্নেস যাচাই করে যে টার্গেট বিদ্যমান ও নিজের সমান নয়।

## E.7 বিদ্যমান DB/ব্যাকএন্ড সংযুক্তি পরিকল্পনা

**মূলনীতি:** কাজ করা স্কিমা/আর্থিক লজিক কারণ ছাড়া বদলানো হবে না; প্রতিটি পরিবর্তন নিচে চিহ্নিত এবং **আপনার অনুমোদন ছাড়া প্রয়োগ করা হবে না**।

### ধাপ ১ — অপরিবর্তিত রাখা হবে (কোনো মাইগ্রেশন নেই)
`organizations`, `organization_members`, `profiles` (গঠন), `platform_admins`, `audit_logs`, `notifications`, `promotions`, `app_settings`, `wallet_transactions`, `member_wallets`, এবং বিদ্যমান RLS পলিসি/ট্রিগার (`tr_val_*`, `protect_profile_privileged_columns`, `check_profile_role_update`, `protect_org_member_escalation`, `handle_new_user`, `sync_member_plan_summary`, `record_bulk_plan_installments`, `bulk_deposit_selected`)।

### ধাপ ২ — অ্যাডিটিভ পরিবর্তন (বিদ্যমান কলাম/ডেটা অক্ষুণ্ণ; শুধু যোগ)
| টেবিল | যোগ হবে | কেন | ঝুঁকি |
|---|---|---|---|
| `member_plans` | `hold_amount`, `minimum_balance`, `lock_in_until`, `status_history jsonb` | উত্তোলনযোগ্য ব্যালেন্সের সূত্র (posted − hold − সর্বনিম্ন − লক-ইন) | কম — ডিফল্ট ০/NULL |
| `plan_payments` | `receipt_no`, `hash`, `prev_hash`, `reversed_by`, `channel`, `collected_by` | অপরিবর্তনীয় রসিদ ও রিভার্সাল (N3, N4) | কম — নতুন এন্ট্রিতে만 |
| `somobay_plans` | `version`, `superseded_by`, `rules jsonb` | স্কিম সংস্করণ (A-05) | কম |
| `rosca_periods` | `seat_no`, `recipient_hash`, `approval_by`, `approval_appr`, `receipt_no` | সিট ম্যাপ + maker≠checker + রসিদ | কম |
| `joint_goal_expenses` | `status` (posted/void), `reversal_of`, `proof_hash` | হার্ড ডিলিট বন্ধ (X7) | মাঝারি — কোড পরিবর্তন লাগবে |
| `qard_funds` | `held_amount`, `committed_amount`, `source_note`, `window_id` | পুল হিসাব (⚠️D-40) | কম |
| `qard_applications` | `rule_version`, `snapshot jsonb`, `committee_ref`, `maker_id`, `checker_id`, `sla_due_at`, `waitlist` | BR-21/BR-22/⚠️D-45/SLA | কম |
| `qard_loans` | `first_due`, `grace_days`, `repay_mode`, `class`, `otp_verified_at`, `evidence jsonb`, `hash`, `cert_no`, `committee_ref` | ছক, শ্রেণিকরণ, OTP, সনদ | কম |
| `qard_repayments` | `installment_no`, `hash`, `channel`, `receipt_qr` | কিস্তি-ভিত্তিক রসিদ | কম |

### ধাপ ৩ — নতুন টেবিল (১৫টি)
`ledger_entries` (দ্বৈত এন্ট্রি, মডিউল/খাত/ref/hash/prev_hash) · `receipts` · `cash_book_days` · `reconciliation_runs` · `documents` (KYC/নথি) · `nominees` · `member_status_history` · `approval_limits` · `staff_roles` + `role_permissions` (CRUDA) · `otp_logs` · `qh_rules` · `qh_rule_versions` · `qh_eligibility_evaluations` · `qh_windows` · `qh_installments` · `qh_writeoffs` · `qh_certificates`।
প্রতিটিতে `organization_id` (টেন্যান্ট) + RLS + ভ্যালিডেশন ট্রিগার (বিদ্যমান `validate_tenant_child_integrity` প্যাটার্ন অনুসরণ)।

### ধাপ ৪ — সুরক্ষামূলক পরিবর্তন (**আর্থিক লজিক/আচরণ বদলায় → অনুমোদন বাধ্যতামূলক**)
| # | পরিবর্তন | প্রভাব | বিকল্প |
|---|---|---|---|
| M1 | `profit_percentage` ও `late_fee_amount`-এ CHECK (=0) + ট্রিগার + UI থেকে অপসারণ (X3) | নতুন স্কিমে মুনাফা/ফি দেওয়া যাবে না | শুধু UI লুকানো (ঝুঁকি থেকে যায়) |
| M2 | `pending_fine` প্রদর্শন বন্ধ (QuickCollectModal) | সদস্য আর "বকেয়া জরিমানা" দেখবেন না | ডিসক্লেমারসহ দেখানো |
| M3 | `deleteGoal`/`deleteExpense` বন্ধ → `status='void'` + রিভার্সাল (X7) | পুরনো রেকর্ড মুছবে না | শুধু নিষ্ক্রিয়করণ |
| M4 | `scheme_type='qard'` সিড সারি নিষ্ক্রিয় (X1) | QH একমাত্র উৎস = qard_* টেবিল | দুটোই রাখা (ডুপ্লিকেট থেকে যায়) |
| M5 | উত্তোলন অনুমোদন অ্যাটমিক RPC-তে (A.5 ঝুঁকি) | ট্রিগার ব্যর্থ হলেও ব্যালেন্স অমিল হবে না | অপরিবর্তিত (ঝুঁকি রয়ে যায়) |
| M6 | আর্থিক লেখা API স্তরে (E.1 নীতি ২) | ব্রাউজার থেকে সরাসরি লেখা বন্ধ | শুধু RLS নির্ভরতা |
| M7 | রোল মডেল একক করা (X2) | অ্যাডমিন-ত্ব শুধু টেন্যান্ট-স্কোপড | দ্বৈত মডেল রাখা |
| M8 | QH কোড সিকোয়েন্স (QHA-YYMM-NNNN) + পুরনো কোড অপরিবর্তিত | সংঘর্ষ ও অডিটযোগ্যতা | এলোমেলো কোড রাখা |

### ধাপ ৫ — ডেটা যাচাই ও রোলব্যাক
প্রতিটি মাইগ্রেশনের আগে/পরে একই যাচাই স্ক্রিপ্ট: (ক) প্রতিটি টেবিলে `organization_id` উপস্থিতি ও টেন্যান্ট-ফিল্টার টেস্ট, (খ) বিদ্যমান ব্যালেন্স = নতুন লেজার সমষ্টি (পার্থক্য ৳০), (গ) `profit_percentage > 0` বা `pending_fine > 0` বা `penalty_paid > 0` এমন সারির সংখ্যা ও তালিকা (নিরীক্ষার জন্য, পরিবর্তন নয়), (ঘ) সব মাইগ্রেশনের `DOWN` স্ক্রিপ্ট (বিদ্যমান `MULTI_TENANT_FOUNDATION_DOWN.sql` প্যাটার্ন)।

## E.8 অনুপস্থিত ও নতুন ফিচারের চূড়ান্ত তালিকা

**পুরনো অ্যাপ থেকে আনতে হবে (১৬টি):** G1…G16 (D.1) — এর মধ্যে P0: মডিউল টগল, সাইনআপ/অপেক্ষমান, যোগদান আবেদন, বাল্ক RPC, প্রোফাইল-সুরক্ষা ট্রিগার, draw_seed।
**প্রোটোটাইপ থেকে ব্যাকএন্ডে বাস্তবায়ন (২০টি):** N1…N20 (D.2) — এর মধ্যে P0: maker≠checker + সীমা, দ্বৈত-এন্ট্রি লেজার, অপরিবর্তনীয় রসিদ, রিভার্সাল JE।
**নতুন পর্দা (৬টি):** S-09 সাইনআপ · S-10 অনুমোদনের অপেক্ষা · S-11 সমিতিতে যোগদান · A-39 নোটিশ/প্রমোশন ব্যবস্থাপনা · A-40 সভা ও হাজিরা · M-22 সভা ও নোটিশ (সদস্য)।
**সংযুক্তি সম্পূর্ণ করতে হবে (৩টি):** A-01/AM-01 মডিউল সারাংশ কার্ড · A-10/AM-05 ৩৬০° ক্রস-মডিউল এক্সপোজার · M-08 মডিউল ফিল্টার।
**ফ্লো তৈরি করতে হবে (৯টি):** F-09…F-17।
**ডিজাইন স্থগিত (১২টি):** P-01…P-12 সুপার অ্যাডমিন (আপনার সিদ্ধান্তে খোলা হবে)।

## E.9 নিরাপত্তা ও আর্থিক অখণ্ডতা চেকলিস্ট

**নিরাপত্তা (টেন্যান্ট ও প্রমাণীকরণ):**
- [ ] প্রতিটি কুয়েরিতে `organization_id` স্কোপ — `AdminReports`, `AdminPendingPayments`, `withdrawalService` সহ (P0, নিজেদের অডিটের SEC-01/02)
- [ ] `member_actions` টেবিলে RLS চালু (R-A7)
- [ ] সব টেবিলে `FORCE ROW LEVEL SECURITY` ও পলিসি পর্যালোচনা (৭৯টি পলিসি)
- [ ] রোল নির্ধারণ শুধু `organization_members` + `platform_admins` থেকে (X2/M7)
- [ ] আর্থিক লেখা API স্তরে; প্রতিটিতে idempotency-key (ডুপ্লিকেট সাবমিশন প্রতিরোধ)
- [ ] সার্ভিস-রোল কি কখনো ক্লায়েন্টে নয়; `.env` রিপোতে নয় (`.env.example` প্যাটার্ন বজায়) — **রিপোর্ট/কোডে কোনো secret প্রকাশ করা হয়নি**
- [ ] অব্যবহৃত নির্ভরতা (`@google/genai`) সরানো (R-A10)
- [ ] Storage বাকেট পলিসি (avatars/proof/documents) — শুধু নিজ টেন্যান্ট
- [ ] এক্সপোর্ট (CSV/প্রিন্ট) টেন্যান্ট-স্কোপড + অডিট লগে রেকর্ড
- [ ] OTP লগ ও রেট লিমিট; লগইন ব্রুট-ফোর্স সুরক্ষা

**আর্থিক অখণ্ডতা:**
- [ ] সুদ/মুনাফা/বিলম্ব ফি শূন্য — স্কিমা, গণনা ও ভাষা তিন স্তরেই (M1/M2 + ভাষা লিন্ট টেস্ট)
- [ ] দ্বৈত এন্ট্রি: প্রতিটি লেনদেনে ডেবিট = ক্রেডিট; মডিউলভিত্তিক ট্রায়াল ব্যালেন্স ৳০ (BR-12)
- [ ] অপরিবর্তনীয়তা: রসিদ/ড্র/সিদ্ধান্ত/অডিট লগে UPDATE/DELETE বন্ধ; সংশোধন শুধু বিপরীত এন্ট্রি (R-02)
- [ ] maker ≠ checker প্রতিটি আর্থিক সিদ্ধান্তে; একই ব্যক্তি দুটোই হতে পারবে না (BR-04/BR-22)
- [ ] অনুমোদন সীমা ম্যাট্রিক্স প্রয়োগ; সীমা ছাড়ালে এসকেলেশন (⚠️D-22)
- [ ] সীমা-ছাড় ব্যতিক্রম রেজিস্টার (কমিটি রেফারেন্স + লিখিত কারণ) নিরীক্ষক রিপোর্টে
- [ ] ব্যালেন্সের একমাত্র উৎস লেজার; `total_collected` শুধু ক্যাশ (X8)
- [ ] উত্তোলন: অ্যাটমিক কর্তন + hold/সর্বনিম্ন/লক-ইন যাচাই (M5)
- [ ] বিতরণে তহবিল যথেষ্টতা + OTP; ডুপ্লিকেট বিতরণ প্রতিরোধ (বিদ্যমান লজিক রাখা)
- [ ] পরিশোধ ≤ বাকি মূলধন; অতিরিক্ত অঙ্ক আটকে দেওয়া (বিদ্যমান লজিক রাখা)
- [ ] write-off শুধু ORG_ADMIN + কমিটি রেফারেন্স + নিরীক্ষক অ্যালার্ট (BR-23)
- [ ] দিনশেষ গেট: অমীমাংসিত এন্ট্রি থাকলে দিন সমাপ্তি নয় (BR-25)
- [ ] কোড/রসিদ নম্বর সিকোয়েন্স (এলোমেলো নয়) + অনন্যত্ব যাচাই
- [ ] অঙ্ক পূর্ণসংখ্যা পয়সায় সংরক্ষণ (ভাসমান বিন্দু নয়); প্রদর্শনে বাংলা সংখ্যা
- [ ] সময় অঞ্চল ও কার্যদিবস গণনা একক উৎস থেকে (SLA, গ্রেস, শ্রেণিকরণ)
- [ ] প্রতিটি ফেজে গ্রহণ-পরীক্ষা: টেন্যান্ট-ফাঁস টেস্ট, লেজার সমন্বয় টেস্ট, ভাষা লিন্ট, মোবাইল চুক্তি

## E.10 ধাপভিত্তিক রোডম্যাপ

| ধাপ | বিষয় | প্রধান কাজ | প্রস্থান-মানদণ্ড |
|---|---|---|---|
| **০ · অনুমোদন** (এখন) | এই রিপোর্ট পর্যালোচনা | E.7 ধাপ ৪-এর M1…M8, D.3-এর X1…X8, D-কোড ও F-12-এর ফি প্রশ্নে সিদ্ধান্ত | আপনার লিখিত অনুমোদন ছাড়া কোনো মাইগ্রেশন নয় |
| **১ · ভিত্তি** | React + নতুন ডিজাইন সিস্টেম | Vite+React+TS প্রজেক্ট, ডিজাইন টোকেন/কম্পোনেন্ট লাইব্রেরি (ui.css → CSS variables + components), রাউট ম্যাপ (E.6), শেল (Shell-A…E), ANAV ৪৯-কী ড্রয়ার, রোল-গেট, P0 টেন্যান্ট-স্কোপ ফিক্স | কম্পোনেন্ট লাইব্রেরি + ৫ শেল রেন্ডার; টেন্যান্ট-ফাঁস টেস্ট পাস; ভাষা লিন্ট পাস |
| **২ · সাধারণ সঞ্চয়** | GS ৬৭ পেজ | member_plans/plan_payments সংযোগ, লেজার (ledger_entries) চালু, জমা/উত্তোলন API, রসিদ+হ্যাশ, রিভার্সাল JE, ক্যাশ বুক, বকেয়া রেজিস্টার, স্টেটমেন্ট/পাসবুক | ব্যালেন্স = লেজার সমষ্টি (পার্থক্য ৳০); maker≠checker এনফোর্সড; F-01…F-08 ক্লিক-থ্রু |
| **৩ · ROSCA** | ১৮ পেজ | rosca_periods সংযুক্তি, সিট/ওয়েটলিস্ট, draw_seed + maker≠checker, ড্র রেজিস্টার, কিস্তি সংগ্রহ, ডিফল্ট প্রতিকার (ফি ছাড়া), কৃত্রিম সীমা অপসারণ | ড্র যাচাইযোগ্য (seed+hash); একাধিক চক্র সম্ভব; F-09…F-12 |
| **৪ · যৌথ লক্ষ্য** | ১৫ পেজ | joint_goal_expenses + proof, যোগদান অনুমোদন, মাইলস্টোন, মেয়াদোত্তীর্ণ নিষ্পত্তি, ডিলিট বন্ধ → void+রিভার্সাল | ট্রায়াল ব্যালেন্স ৳০; কোনো হার্ড ডিলিট নেই; F-13/F-14 |
| **৫ · কর্জে হাসানা** | ২৫ পেজ | qh_rules/rule_versions/evaluations/windows/installments/writeoffs/certificates, যোগ্যতা ইঞ্জিন (৪ স্তর), Simulation (সার্ভার-সাইড), কোটা/জানালা/পুল, SLA, শ্রেণিকরণ, OTP, সনদ, X1 ডুপ্লিকেশন নিরসন, কোড সিকোয়েন্স | সব আবেদনে snapshot + নিয়ম-সংস্করণ; সুদ ৳০ যাচাই; ব্যতিক্রম রেজিস্টার; F-15…F-17 |
| **৬ · শাসন ও রিপোর্ট** | ক্রস-মডিউল | স্টাফ/রোল/CRUDA, অনুমোদন সীমা, অডিট লগ UI, রিপোর্ট কেন্দ্র, আর্থিক বিবরণ/রেগুলেটরি রিটার্ন, রিকনসিলিয়েশন, দিনশেষ গেট | প্রতিটি রিপোর্টে টেন্যান্ট স্কোপ; নিরীক্ষক শেল শুধু-পঠন |
| **৭ · অনবোর্ডিং, নোটিশ ও প্ল্যাটফর্ম** | নতুন ৬ পেজ + P-01…P-12 | সাইনআপ/অপেক্ষমান/যোগদান, নোটিশ-সভা-হাজিরা, ব্র্যান্ডিং কনফিগ (টোকেন-ম্যাপড), PWA + অফলাইন কিউ, সুপার অ্যাডমিন প্যানেল | নতুন সমিতি → সদস্য যোগদান → প্রথম জমা এন্ড-টু-এন্ড চলে |
| **৮ · শক্তিশালীকরণ ও গ্রহণ** | প্রোডাকশন প্রস্তুতি | পারফরম্যান্স, অ্যাক্সেসিবিলিটি অডিট, মোবাইল চুক্তি রি-রান (আসল ডিভাইসে), নিরাপত্তা পরীক্ষা, আর্থিক সমন্বয় নিরীক্ষা, ডকুমেন্টেশন ও প্রশিক্ষণ | সব চেকলিস্ট (E.9) টিক; গ্রহণ-পরীক্ষা পাস; রোলব্যাক প্রস্তুত |

> প্রতিটি ধাপে পুরনো অ্যাপ চালু থাকবে (সমান্তরাল রান) যত দিন না ডেটা সমন্বয় যাচাই হচ্ছে। কোনো ধাপে আর্থিক ডেটা অমিল পাওয়া গেলে পরের ধাপে যাওয়া হবে না।

---

# অনুমোদন গেট — আপনার সিদ্ধান্ত ছাড়া যা করা হবে না

| # | বিষয় | কেন অনুমোদন দরকার |
|---|---|---|
| 1 | `profit_percentage` / `late_fee_amount` / `pending_fine` লক বা অপসারণ (M1, M2) | আর্থিক লজিক ও ঐতিহাসিক ডেটা প্রভাবিত |
| 2 | `scheme_type='qard'` সিড সারি নিষ্ক্রিয়করণ (M4, X1) | বিদ্যমান স্কিম তালিকা বদলায় |
| 3 | হার্ড ডিলিট বন্ধ করে void + রিভার্সাল (M3, X7) | আচরণগত পরিবর্তন |
| 4 | উত্তোলন অনুমোদন অ্যাটমিক RPC (M5) ও আর্থিক লেখা API স্তরে (M6) | কাজ করা ওয়ার্কফ্লো বদলায় |
| 5 | একক রোল মডেল (M7, X2) + নতুন ৫টি ভূমিকা (ACCOUNTANT/MANAGER/APPROVER/AUDITOR/OBSERVER) | RLS ও পারমিশন বদলায় |
| 6 | ১৫টি নতুন টেবিল ও ধাপ ২-এর অ্যাডিটিভ কলাম | স্কিমা পরিবর্তন |
| 7 | কৃত্রিম সীমা অপসারণ (X6) | ব্যবসায়িক আচরণ বদলায় |
| 8 | F-12-এর "বিলম্ব ফি" ধাপ বাদ (⚠️D-41) | স্পেকের ধাপ বদলায় |
| 9 | Super Admin P-01…P-12 ডিজাইন শুরু | আপনি স্থগিত রেখেছেন |
| 10 | বিদ্যমান ডেটায় সুদ/মুনাফা চিহ্নিত হলে করণীয় (নিরীক্ষা প্রতিবেদন → সমন্বয়) | আর্থিক ইতিহাস |

**এই রিপোর্টে যা করা হয়নি:** কোনো কোড পরিবর্তন নেই · কোনো মাইগ্রেশন চালানো হয়নি · কোনো secret/service-role কি কপি বা প্রকাশ করা হয়নি · বিদ্যমান অ্যাপের সোর্স শুধু পড়া হয়েছে (`reference/amar-somobay-v2/`-এ বিশ্লেষণের সুবিধার্থে সংরক্ষিত)।

**প্রোটোটাইপ পক্ষে এই রিপোর্ট লেখার সময় করা পরিবর্তন (Part 1-এর অংশ, আগেই সম্পন্ন):** কর্জে হাসানা মডিউল (৪২ স্ক্রিন) + `tqh.mjs` হার্নেস + যাচাইয়ে ধরা পড়া ১৪টি ত্রুটি সংশোধন (বিস্তারিত `reports/qard-hasanah-phase3a-report.md`)।
