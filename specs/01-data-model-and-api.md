# Somobay — General Cooperative Savings
## ডেটা মডেল, স্টেট ও API কন্ট্রাক্ট (প্রপোজাল v0.1)

**সহায়ক ডকুমেন্ট:** `specs/00-somobay-savings-module-spec.md`
**উদ্দেশ্য:** পেজ স্পেক ও React Prototype — দুটোর জন্যই একটি সাধারণ ডেটা ভাষা তৈরি করা।

> ⚠️ এটি একটি **প্রস্তাবিত** মডেল। ⚠️ **[DECISION]** রেজিস্টারের (`specs/02-open-decisions.md`) উত্তর পাওয়ার পর এটি চূড়ান্ত হবে।

---

## ১. মূল নীতি

| নীতি | বিবরণ |
|---|---|
| **No interest anywhere** | কোনো এনটিটিতে `interest_rate`, `interest_amount`, `interest_accrued` ফিল্ড **নেই**। ✅ **[CONFIRMED]** |
| **Ledger is source of truth** | ব্যালেন্স একটি ক্যাশ (cache) মাত্র; আসল সত্য `ledger_entry` টেবিল। |
| **Append-only** | আর্থিক টেবিলগুলোতে `updated_at` থাকলেও মান কখনো বদলাবে না; সংশোধন নতুন সারি দিয়ে। |
| **Money as integer taka+paisa** | ভাসমান সংখ্যা (float) নয় — `amount_paisa BIGINT` (১ টাকা = ১০০ পয়সা)। হিসাবের নির্ভুলতার জন্য অপরিহার্য। |
| **Multi-tenant ready** | সব টেবিলে `org_id` — যদিও D-13 এখনো অমীমাংসিত, আর্কিটেকচারে জায়গা রাখা নিরাপদ। |
| **Soft delete only** | কোনো রেকর্ড ভৌতভাবে মুছবে না; `deleted_at` + `deleted_by`। |

---

## ২. এনটিটি তালিকা (২৪টি)

### ২.১ কাঠামো ও পরিচয়

#### `organizations` — সমবায় সমিতি
| ফিল্ড | টাইপ | নোট |
|---|---|---|
| id | uuid PK | |
| name_bn, name_en | text | |
| registration_no | text unique | নিবন্ধন নম্বর |
| registrar_office | text | উপজেলা/জেলা/কেন্দ্রীয় |
| society_type | enum | প্রাথমিক বহুমুখী/কৃষি/মহিলা/… ⚠️D-31 |
| address_village, union, upazila, district | text | |
| phone, email | text | |
| logo_url, primary_color | text | ব্র্যান্ডিং |
| fiscal_year_start_month | int | ⚠️D-15 |
| byelaw_document_id | fk | ⚠️D-31 |
| status | enum | active, suspended, dissolved |
| created_at, updated_at | timestamptz | |

#### `branches` / `areas` — শাখা ও এলাকা
`id, org_id, name, type(branch/area/ward), parent_id, address, status`

#### `collection_routes` — সংগ্রহ রুট
`id, org_id, area_id, name, day_of_week, assigned_collector_id, status`

#### `route_members` — রুটে সদস্য বরাদ্দ
`id, route_id, member_id, effective_from, effective_to, sequence_no`

#### `users` — প্ল্যাটফর্ম ব্যবহারকারী (স্টাফ ও সদস্য উভয়)
| ফিল্ড | নোট |
|---|---|
| id, org_id | |
| mobile (unique per org), mobile_verified_at | লগইনের প্রধান চাবি |
| password_hash, pin_hash | |
| biometric_enabled | |
| language_pref (`bn`/`en`), numeral_pref (`bn`/`en`) | |
| last_login_at, last_login_device | |
| status | active, disabled, locked |

#### `roles` ও `user_roles`
`roles: id, org_id(null=system), code, name, is_system, permissions jsonb`
`user_roles: user_id, org_id, role_id, scope_type(all/branch/area/route), scope_id, approval_limit_paisa, valid_from, valid_to` ⚠️D-22

#### `members` — সদস্য (ব্যক্তি)
| ফিল্ড | নোট |
|---|---|
| id, org_id, user_id (nullable) | অ্যাপ অ্যাকাউন্ট না থাকলেও সদস্য হতে পারবে |
| member_no | অদ্বিতীয়, নম্বর প্যাটার্ন অনুযায়ী ⚠️D-16 |
| name_bn, name_en | |
| father_or_husband_name, mother_name | |
| date_of_birth, gender | বয়স যাচাই ⚠️D-14 |
| nid_number (encrypted), nid_type (nid/birth_cert/passport) | ⚠️D-16 |
| mobile, mobile_alt | |
| photo_document_id | |
| address_village, union, upazila, district | |
| occupation, monthly_income_range | |
| area_id, route_id | |
| joined_at, member_since | |
| status | application, pending_verification, active, dormant, suspended, frozen, exited, deceased, rejected |
| status_reason, status_changed_by, status_changed_at | |
| kyc_status | incomplete, pending, verified, rejected |
| duplicate_of_member_id | একীভূতকরণের জন্য |
| consent_given_at, consent_version | ⚠️D-23 |
| created_by, created_at | |

#### `member_applications` — নিবন্ধন আবেদন
`id, org_id, applicant_mobile, source(app/office/field), submitted_by, status(pending/approved/rejected/info_requested), member_id(অনুমোদিত হলে), reviewer_id, reviewed_at, rejection_reason, requested_info_note`

#### `kyc_documents`
`id, member_id, doc_type(nid_front/nid_back/birth_cert/photo/signature/death_cert/other), file_url, file_hash, uploaded_by, verification_status, verified_by, verified_at, rejection_reason, expires_at`

#### `nominees`
`id, member_id, name, relation, nid_number, photo_document_id, share_percent, mobile, address, status(active/replaced/pending_approval), effective_from, effective_to, added_by, approved_by`

---

### ২.২ স্কিম ও অ্যাকাউন্ট

#### `schemes` — সঞ্চয় স্কিম
| ফিল্ড | নোট |
|---|---|
| id, org_id, version_no | সংস্করণ ⚠️D-32 |
| code, name_bn, name_en, description | |
| scheme_type | daily, weekly, fortnightly, monthly, term, special |
| applicable_area_ids | jsonb |
| installment_amount_paisa | নির্ধারিত হলে |
| amount_mode | fixed, flexible |
| min_amount_paisa, max_amount_paisa | |
| frequency_per_month | |
| installment_day_rule | fixed_date(1-28) / nth_weekday / collector_visit |
| allow_extra_deposit | bool ⚠️D-03 |
| allow_advance_installment | bool |
| tenure_months | null = open-ended ⚠️D-06 |
| lock_in_months | ⚠️D-06 |
| withdrawal_notice_days | ⚠️D-02 |
| withdrawal_max_per_month, withdrawal_max_count_per_month | ⚠️D-02 |
| min_balance_paisa | ⚠️D-02 |
| partial_withdrawal_allowed | bool ⚠️D-06 |
| admission_fee_paisa, annual_fee_paisa, withdrawal_fee_paisa | ⚠️D-05 (সুদ নয়) |
| late_fee_policy | jsonb ⚠️D-08 |
| grace_days | int ⚠️D-07 |
| approval_flow_id | fk |
| status | draft, pending_approval, active, suspended, closed_for_new_entry, maturing, closed |
| effective_from, effective_to | |
| created_by, approved_by, approved_at | |

> ❌ **এই টেবিলে কোনো সুদের ফিল্ড নেই।**

#### `savings_accounts` — সদস্যের সঞ্চয় অ্যাকাউন্ট
| ফিল্ড | নোট |
|---|---|
| id, org_id, member_id, scheme_id, **scheme_version_id** | কোন সংস্করণের নিয়মে চলছে ⚠️D-32 |
| account_no | নম্বর প্যাটার্ন অনুযায়ী |
| opened_at, opened_by | |
| first_installment_date, installment_day | |
| **posted_balance_paisa** | ক্যাশ — লেজার থেকে নির্ণীত |
| **pending_balance_paisa** | যাচাইয়ের অপেক্ষায় থাকা জমা |
| **hold_amount_paisa** | চলমান উত্তোলন আবেদনের জন্য আটক |
| total_deposit_paisa, total_withdrawal_paisa | দ্রুত প্রদর্শনের জন্য |
| status | opened, active, frozen, matured, closure_requested, settling, closed |
| frozen_reason, frozen_by, frozen_at, frozen_until | |
| closed_at, closed_by | |
| share_capital_paisa | ⚠️D-04 (আলাদা রাখা — সঞ্চয়ের সাথে যোগ হবে না) |
| last_deposit_at, last_installment_no | |

> **উত্তোলনযোগ্য ব্যালেন্স (derived):**
> `available = posted_balance − hold_amount − min_balance − locked_amount`
> কোথাও সংরক্ষিত থাকবে না; সবসময় হিসাব করা হবে।

#### `installment_schedules` — কিস্তির সময়সূচি
`id, savings_account_id, installment_no, due_date, due_amount_paisa, paid_amount_paisa, paid_at, status(pending/partial/paid/overdue/waived/skipped), grace_until, reminder_sent_at, waived_by, waived_reason` ⚠️D-03/D-07/D-09

---

### ২.৩ লেনদেন ও লেজার

#### `transactions` — লেনদেনের শিরোনাম রেকর্ড
| ফিল্ড | নোট |
|---|---|
| id, org_id, txn_no | প্রদর্শনযোগ্য নম্বর |
| txn_type | deposit, withdrawal, correction, reversal, fee, transfer_internal, settlement, share_purchase ⚠️D-04 |
| member_id, savings_account_id, scheme_id | |
| amount_paisa | সর্বদা ধনাত্মক; দিক নির্ধারিত হয় ledger_entry-তে |
| direction | in, out |
| channel | cash_field, cash_office, bkash, nagad, upay, bank_transfer, cheque |
| channel_reference | ওয়ালেট TrxID / ব্যাংক রেফারেন্স |
| txn_date | লেনদেনের তারিখ (ব্যাকডেট হতে পারে) |
| recorded_at | সিস্টেমে ঢোকার সময় |
| status | created, pending_verification, verified, posted, rejected, reversed |
| recorded_by, recorded_role, recorded_device_id | |
| verified_by, verified_at | maker ≠ checker (R-04) |
| approval_chain jsonb | [{role, user_id, action, at, note}] |
| **idempotency_key** | unique — ডুপ্লিকেট প্রতিরোধ (BR-03) |
| is_offline_entry, synced_at | P1/P2 |
| receipt_no | ক্রমিক, অর্থবছরভিত্তিক |
| reversed_by_txn_id | reversal হলে মূল লেনদেনের লিংক |
| reversal_reason | |
| period_id | কোন পিরিয়ডে পোস্ট হয়েছে |
| evidence_document_ids jsonb | ⚠️D-26 |
| note | |

#### `ledger_entries` — ডাবল-এন্ট্রি লেজার
| ফিল্ড | নোট |
|---|---|
| id, org_id, transaction_id | |
| entry_no | ক্রমিক |
| coa_account_id | চার্ট অফ অ্যাকাউন্ট |
| member_id, savings_account_id | (nullable — সমিতির নিজস্ব অ্যাকাউন্ট হলে) |
| debit_paisa, credit_paisa | একটি সারিতে একটিই অশূন্য |
| entry_date, period_id | |
| is_reversal, reverses_entry_id | |
| created_by, created_at | |
| **immutable** | কোনো UPDATE/DELETE নেই (R-02) |

#### `coa_accounts` — চার্ট অফ অ্যাকাউন্ট
`id, org_id, code, name_bn, name_en, type(asset/liability/income/expense/equity), subtype(savings_deposit/share_capital/cash/bank/wallet/service_charge_income/operating_expense/suspense/dues_receivable), is_system, parent_id, normal_balance(debit/credit)`

> **সুদ-সংক্রান্ত কোনো CoA অ্যাকাউন্ট থাকবে না।** প্রস্তাবিত আয় অ্যাকাউন্ট: `service_charge_income`, `admission_fee_income`, `annual_fee_income` ⚠️D-01/D-05।

#### `receipts`
`id, transaction_id, receipt_no, fiscal_year, org_id, verification_code(unique), qr_payload, printed_at, print_count, shared_at, template_version`

#### `withdrawal_requests`
| ফিল্ড | নোট |
|---|---|
| id, org_id, request_no | |
| member_id, savings_account_id | |
| requested_amount_paisa, approved_amount_paisa, disbursed_amount_paisa | আংশিক অনুমোদন ⚠️D-26/D-27 |
| reason_code, reason_note | |
| payment_method, payout_account_ref (আংশিক লুকানো) | |
| nominee_id, witness_name, witness_nid | ⚠️D-14 |
| requested_by (member or staff user_id), requested_on_behalf | ⚠️D-11 |
| submitted_at, notice_ends_at | ⚠️D-02 |
| status | draft, submitted, under_review, approved, rejected, withdrawn, disbursing, settled, failed, cancelled |
| current_step, approval_flow_id | |
| eligibility_snapshot jsonb | আবেদনের মুহূর্তের হিসাব সংরক্ষণ (পরে ব্যালেন্স বদলালেও প্রমাণ থাকে) |
| hold_transaction_id | BR-02 |
| rejection_reason, rejection_reason_code | |
| otp_verified_at, member_confirmed_at | |
| transaction_id (নিষ্পত্তি হলে) | |

#### `disbursements`
`id, withdrawal_request_id, settlement_id, method(cash/bank/bkash/nagad/cheque), amount_paisa, fee_paisa, net_amount_paisa, reference, status(pending/processing/unknown/success/failed), provider_txn_id, status_checked_at, disbursed_by, disbursed_at, receiver_signature_document_id, receiver_photo_document_id, receiver_otp_verified_at, attempt_count`

> ⚠️ **`unknown` অবস্থাটি গুরুত্বপূর্ণ** — ওয়ালেট পেমেন্ট টাইমআউট হলে অনুমান করে success/failed করা যাবে না; status query API দিয়ে নিশ্চিত হতে হবে (A-24 স্টেট)।

#### `settlements` — চূড়ান্ত নিষ্পত্তি
`id, org_id, member_id, savings_account_id(null=সব অ্যাকাউন্ট), type(account_closure/member_exit/death_claim), clearance_check jsonb, gross_amount_paisa, deductions jsonb, net_payable_paisa, status(preview/requested/approved/disbursed/cancelled), approved_by, disbursed_at, certificate_document_id, created_by`

#### `death_claims` ⚠️D-14
`id, org_id, member_id, claimant_name, claimant_relation, claimant_nid, nominee_id, documents jsonb, claimed_amount_paisa, status(submitted/verifying/approved/settled/rejected), investigated_by, notes, settled_at, settlement_id`

---

### ২.৪ হিসাব নিয়ন্ত্রণ

#### `fiscal_periods`
`id, org_id, fiscal_year, period_type(day/month/year), start_date, end_date, status(open/closing/locked), locked_by, locked_at, reopened_by, reopened_at, reopen_reason`

#### `day_closes`
`id, org_id, branch_id, close_date, opening_cash_paisa, cash_in_paisa, cash_out_paisa, transfer_to_bank_paisa, expected_closing_paisa, counted_closing_paisa, variance_paisa, variance_reason, collector_settlements jsonb, status(open/pending_approval/closed/reopened), closed_by, approved_by, pending_sync_count`

#### `reconciliations`
`id, org_id, source(bank/bkash/nagad/cash), period_id, statement_document_id, system_total_paisa, external_total_paisa, difference_paisa, auto_matched_count, exception_count, status(pending/matching/exceptions/resolved/signed_off), signed_off_by, signed_off_at`

#### `reconciliation_exceptions`
`id, reconciliation_id, transaction_id(null), external_line jsonb, exception_type(in_system_not_bank/in_bank_not_system/amount_mismatch/date_mismatch), resolved_by, resolution_code, resolution_note, correction_transaction_id, suspense_account_id, status(open/resolved/moved_to_suspense)`

#### `fund_transfers`
`id, org_id, from_account(cash/bank/wallet:ref), to_account, amount_paisa, fee_paisa, reference, status(pending/success/failed/unknown), transaction_id, created_by, approved_by`

---

### ২.৫ যোগাযোগ, নিরাপত্তা ও সহায়ক

#### `notifications`
`id, org_id, recipient_user_id, recipient_member_id, channel(in_app/sms/push/email), template_code, trigger_code(deposit_posted/due_reminder/approval_status/…), payload jsonb, rendered_text, status(queued/sent/delivered/failed/read), sent_at, delivered_at, read_at, related_entity_type, related_entity_id, deep_link, sms_cost`

#### `notification_templates`
`id, org_id(null=default), code, channel, language(bn/en), subject, body_template, variables jsonb, is_mandatory, active`

#### `reminder_schedules` ⚠️D-07/D-08
`id, org_id, scheme_id(null=all), trigger(due_before_3d/due_on/overdue_1d/overdue_7d/overdue_30d), channel, template_code, enabled, audience_filter jsonb, last_run_at, next_run_at`

#### `audit_logs`
`id, org_id, actor_user_id, actor_role, action(create/update/approve/reject/login/logout/export/delete_attempt/status_change/…), entity_type, entity_id, before_value jsonb, after_value jsonb, ip_address, user_agent, device_id, result(success/failure/denied), failure_reason, created_at` — **append-only, কোনো UPDATE/DELETE নেই**

#### `approval_flows` ও `approval_steps` ⚠️D-22
`approval_flows: id, org_id, name, applies_to(deposit/withdrawal/correction/settlement/scheme), min_amount_paisa, max_amount_paisa, active`
`approval_steps: id, flow_id, step_order, role_code, limit_paisa, required(bool), sla_hours, escalation_role_code`

#### `documents`
`id, org_id, doc_type, file_url, file_hash, mime, size_bytes, uploaded_by, member_id(null), entity_type, entity_id, access_level(private/staff/public), encrypted, created_at`

#### `support_tickets` 🔵
`id, org_id, member_id, category, subject, description, related_entity_type, related_entity_id, status(open/in_progress/resolved/closed), priority, assigned_to, created_at, resolved_at, ticket_no`

#### `notices` (নোটিশ বোর্ড) 🟡
`id, org_id, title_bn, body_bn, notice_type(general/urgent/meeting/holiday/scheme), published_at, valid_until, attachment_document_id, published_by, status(draft/published/expired/archived)`

#### `sync_queue` (ক্লায়েন্ট-সাইড/সার্ভার-সাইড লগ) 🟡
`id, device_id, user_id, entity_type, local_uuid, idempotency_key, payload jsonb, status(queued/synced/conflict/failed), conflict_with_id, conflict_resolution, attempts, last_error, created_at, synced_at`

#### `user_devices`
`id, user_id, device_name, platform, push_token, last_seen_at, ip, is_trusted, revoked_at`

---

## ৩. এনটিটি সম্পর্ক (সংক্ষিপ্ত ERD)

```
organizations ──< branches/areas ──< collection_routes ──< route_members >── members
      │                                                                        │
      ├──< users >──< user_roles >── roles                                     │
      │                                                                        │
      ├──< schemes ──< scheme_versions                                         │
      │        │                                                               │
      │        └──< savings_accounts >────────────────────────────────────────┘
      │                   │
      │                   ├──< installment_schedules
      │                   ├──< transactions ──< ledger_entries >── coa_accounts
      │                   │         │
      │                   │         ├──< receipts
      │                   │         └──< evidence documents
      │                   └──< settlements ──< disbursements
      │
      ├──< withdrawal_requests >── members
      │            └──< disbursements
      ├──< death_claims >── members, nominees
      ├──< fiscal_periods ──< day_closes
      │                   └──< reconciliations ──< reconciliation_exceptions
      ├──< notifications ──< notification_templates
      ├──< reminder_schedules
      ├──< audit_logs
      ├──< approval_flows ──< approval_steps
      ├──< notices
      └──< support_tickets

members ──< kyc_documents, nominees, member_applications
```

---

## ৪. ডেরিভড মান ও সূত্র

| মান | সূত্র | কোথায় ব্যবহৃত |
|---|---|---|
| `available_balance` | `posted_balance − hold_amount − scheme.min_balance − locked_amount` | M-05, M-10, A-13, A-22 |
| `locked_amount` | lock-in শেষ না হওয়া কিস্তির মোট জমা (যদি নিয়ম থাকে) ⚠️D-06 | M-10 ব্যাখ্যা |
| `due_amount` | `Σ(schedules.due_amount − paid_amount) WHERE status IN (pending, partial, overdue) AND due_date < today − grace_days` | M-13, A-31 |
| `aging_band` | `today − earliest_unpaid_due_date` → 0-30 / 31-60 / 61-90 / 90+ | A-31 |
| `net_settlement` | `available_balance − pending_fees − outstanding_dues(if policy)` ⚠️D-19 | M-15, A-15 |
| `cash_position` | `Σ(coa cash accounts) + Σ(wallet accounts)` | A-01, A-22, A-24, A-28 |
| `collection_achievement` | `collected_today / target_today × 100` | A-02 |
| `trial_balance_check` | `Σ(debit) − Σ(credit) == 0` | A-35 (BR-12) |

---

## ৫. API কন্ট্রাক্ট (প্রস্তাবিত এন্ডপয়েন্ট)

### ৫.১ Member API

```
# ড্যাশবোর্ড ও অ্যাকাউন্ট
GET    /member/dashboard-summary
GET    /member/savings-accounts?status=&page=
GET    /member/savings-accounts/{id}
GET    /member/savings-accounts/{id}/balance-breakdown
GET    /member/savings-accounts/{id}/schedule?range=
GET    /member/savings-accounts/{id}/withdrawal-eligibility
GET    /member/savings-accounts/{id}/transactions?type=&status=&from=&to=&page=
GET    /member/savings-accounts/{id}/closure-preview

# স্কিম
GET    /schemes?status=active&enrollable=true
GET    /schemes/{id}
GET    /schemes/{id}/rules
POST   /member/enrollments

# জমা
GET    /member/savings-accounts/{id}/deposit-limits
GET    /payment-methods?org_id=
POST   /deposits                       # Idempotency-Key হেডার বাধ্যতামূলক
GET    /deposits/{id}
GET    /deposits/{id}/receipt

# উত্তোলন
POST   /withdrawal-requests
GET    /member/withdrawal-requests?status=&page=
GET    /member/withdrawal-requests/{id}
POST   /member/withdrawal-requests/{id}/cancel

# বকেয়া
GET    /member/dues?status=outstanding
GET    /member/dues/summary

# স্টেটমেন্ট
POST   /member/statements/generate      # → job id
GET    /member/statements
GET    /member/statements/{id}/download
GET    /member/receipts

# প্রোফাইল
GET    /member/profile
PUT    /member/profile
POST   /member/kyc/documents
POST   /member/mobile/change-request     # ⚠️D-21
GET    /member/nominees
POST   /member/nominees
PUT    /member/nominees/{id}

# নোটিফিকেশন ও সহায়তা
GET    /member/notifications?page=
POST   /member/notifications/{id}/read
POST   /member/notifications/read-all
GET    /org/notices?status=published
POST   /member/support/tickets
```

### ৫.২ Admin API

```
# ড্যাশবোর্ড
GET    /admin/dashboard/kpis?date=&branch=
GET    /admin/dashboard/pending-approvals
GET    /admin/dashboard/alerts
GET    /admin/cash-position
GET    /admin/cash-availability

# স্কিম
GET    /schemes?status=&type=&page=
GET    /scheme-templates
POST   /schemes
GET    /schemes/{id}?version=
PUT    /schemes/{id}
POST   /schemes/{id}/versions
GET    /schemes/{id}/impact-preview
GET    /schemes/{id}/stats
POST   /schemes/{id}/submit-for-approval
POST   /schemes/{id}/activate | /suspend | /close

# সদস্য
GET    /members?search=&status=&area=&scheme=&has_due=&page=&sort=
POST   /members/duplicate-check           # ⚠️D-16
POST   /members
GET    /members/{id}
PUT    /members/{id}
GET    /members/{id}/summary | /savings-accounts | /transactions | /dues | /kyc | /nominees | /activity-log
POST   /members/{id}/change-requests
POST   /members/{id}/status-changes        # A-12; নীতি ⚠️D-07/D-20
POST   /members/{id}/transfers             # 🔵
POST   /members/export
GET    /member-applications?status=pending
GET    /member-applications/{id}
POST   /member-applications/{id}/approve | /reject | /request-info

# অ্যাকাউন্ট
GET    /savings-accounts/{id}
GET    /savings-accounts/{id}/ledger
GET    /savings-accounts/{id}/balance-breakdown
POST   /savings-accounts/{id}/freeze | /unfreeze

# জমা
GET    /deposits?status=&channel=&from=&min_amount=&page=
POST   /deposits                            # স্টাফ রেকর্ড
POST   /deposits/batch/validate
POST   /deposits/batch                      # 🟡
POST   /deposits/{id}/verify
POST   /deposits/{id}/reject
POST   /deposits/bulk-verify
GET    /deposits/{id}/evidence | /ledger-entries | /audit-trail
GET    /imports/template
POST   /imports/upload | /{id}/map | /{id}/dry-run | /{id}/commit | /{id}/rollback

# উত্তোলন
GET    /withdrawal-requests?status=&step=&page=
GET    /withdrawal-requests/{id}
GET    /withdrawal-requests/{id}/eligibility-breakdown
POST   /withdrawal-requests/{id}/approve | /reject | /request-info
POST   /withdrawal-requests/bulk-approve
GET    /disbursements?status=pending
POST   /disbursements
POST   /disbursements/{id}/confirm | /fail
GET    /disbursements/{id}/status-query      # ওয়ালেট unknown সমাধান
GET    /disbursements/{id}/voucher

# লেজার ও সংশোধন
GET    /transactions?type=&status=&from=&to=&account_id=&member_id=&min=&max=&page=
GET    /transactions/{id}
GET    /transactions/{id}/audit-trail | /related
GET    /transactions/export
POST   /transactions/{id}/corrections/preview
POST   /transactions/{id}/corrections
POST   /corrections/{id}/approve
GET    /ledger/trial-balance?period=

# ক্যাশ ও সমন্বয়
GET    /cash-book?date=
POST   /day-close/preview
POST   /day-close
POST   /day-close/{date}/reopen
GET    /collectors/{id}/day-settlement
GET    /org-accounts
POST   /fund-transfers
POST   /reconciliations/upload
POST   /reconciliations/{id}/auto-match
GET    /reconciliations/{id}/exceptions
POST   /reconciliations/{id}/exceptions/{eid}/resolve
POST   /reconciliations/{id}/sign-off

# বকেয়া
GET    /dues?aging=&route=&scheme=&collector=&page=
GET    /dues/summary
POST   /dues/remind

# রুট ও রিমাইন্ডার
GET    /routes ; POST /routes ; PUT /routes/{id}
POST   /routes/{id}/assign-members
GET    /routes/{id}/progress
GET    /notification-templates ; PUT /notification-templates/{id}
GET    /reminder-schedules ; POST /reminder-schedules
POST   /notifications/broadcast
GET    /notifications/delivery-log

# নিষ্পত্তি ও দাবি
GET    /members/{id}/clearance-check
POST   /settlements/preview
POST   /settlements
POST   /settlements/{id}/approve | /disburse
GET    /settlements/{id}/certificate
GET    /death-claims?status= ; POST /death-claims
POST   /death-claims/{id}/approve | /settle

# রিপোর্ট
GET    /reports/catalog
POST   /reports/{code}/run
GET    /reports/{id}/download
GET    /reports/recent
GET    /reports/financial-statements?fy=
GET    /reports/regulatory-return?fy=&format=    # ⚠️D-29

# ব্যবস্থাপনা
GET    /org/settings ; PUT /org/settings/{key} ; GET /org/settings/change-log
GET    /users ; POST /users/invite
PUT    /users/{id}/roles | /scopes | /approval-limits
GET    /roles ; POST /roles
GET    /audit-logs?user_id=&action=&entity_type=&from=&to=&result=&page=
GET    /audit-logs/export
```

### ৫.৩ Shared / Public API

```
POST   /auth/otp/send
POST   /auth/otp/verify
POST   /auth/login
POST   /auth/consent                        # ⚠️D-23
GET    /auth/organizations
POST   /auth/organizations/select
GET    /me
PUT    /me/preferences
GET    /me/permissions
GET    /me/devices ; DELETE /me/sessions/{id}
GET    /me/notification-preferences ; PUT …
POST   /public/receipts/verify              # লগইন ছাড়া (রেট-লিমিটেড)
GET    /public/receipts/{code}
GET    /documents/{id}
POST   /sync/push ; GET /sync/status ; POST /sync/resolve-conflict
```

---

## ৬. API ডিজাইন নীতি

| নীতি | বিবরণ |
|---|---|
| **Idempotency** | সব `POST` আর্থিক এন্ডপয়েন্টে `Idempotency-Key` হেডার বাধ্যতামূলক; একই কী = একই ফলাফল (BR-03)। |
| **Money format** | সব পরিমাণ `*_paisa` (integer) হিসেবে যাবে; UI স্তরে ফরম্যাট হবে। |
| **Pagination** | `page` + `page_size`; বড় এক্সপোর্ট ব্যাকগ্রাউন্ড জব + নোটিফিকেশন। |
| **Error shape** | `{ code, message_bn, message_en, field_errors[], reference_id }` — `message_bn` সরাসরি UI-তে দেখানো যাবে এমন ভাষায়। |
| **Versioning** | `/v1/` প্রিফিক্স। |
| **Auth** | JWT (স্বল্পমেয়াদি) + refresh token; role ও scope ক্লেমে। |
| **Data scoping** | সার্ভার স্তরে `org_id` + route/area scope enforced — ক্লায়েন্ট ফিল্টারের উপর নির্ভর নয়। |
| **Audit** | সব লেখা অপারেশন স্বয়ংক্রিয়ভাবে `audit_logs`-এ যাবে (মিডলওয়্যার স্তরে)। |
| **Optimistic locking** | `version` ফিল্ড দিয়ে কনকারেন্সি সংঘর্ষ শনাক্তকরণ (A-20/A-22 "already processed" স্টেট)। |

---

## ৭. React Prototype-এর জন্য Mock ডেটা পরিকল্পনা

| ডেটাসেট | পরিমাণ | উদ্দেশ্য |
|---|---|---|
| সমিতি | ১ (রহিমা সঞ্চয় সমিতি — আপনার প্রোটোটাইপের নাম) বা ২ (S-02 টেস্ট করতে) | টেনান্ট |
| স্কিম | ৩ (দৈনিক ৳৫০, মাসিক ৳১,০০০, মেয়াদি ৩ বছর) | বৈচিত্র্য: fixed/flexible, lock-in আছে/নেই |
| সদস্য | ৫০ (বিভিন্ন অবস্থা: active ৪০, dormant ৪, suspended ২, exited ২, deceased ১, application ১) | সব অবস্থার UI টেস্ট |
| সঞ্চয় অ্যাকাউন্ট | ৬৫ (কিছু সদস্যের একাধিক) | M-04 তালিকা |
| লেনদেন | ~১,২০০ (৬ মাসের) | ইতিহাস, পেজিনেশন, স্টেটমেন্ট |
| কিস্তি সময়সূচি | ~৬০০ | বকেয়া, aging ব্যান্ড |
| জমা কিউ | ৮টি pending_verification | A-20 |
| উত্তোলন আবেদন | ৬টি বিভিন্ন ধাপে | A-22, A-23, A-24, M-11, M-12 |
| রিকনসিলিয়েশন ব্যতিক্রম | ৪টি | A-30 |
| অডিট লগ | ~২০০ | A-38 |
| নোটিফিকেশন | ২৫ | M-16 |

**প্রোটোটাইপে লেজার সিমুলেশন:** একটি সরল in-memory store রাখা হবে যেখানে জমা পোস্ট করলে `posted_balance` সত্যিই বাড়ে এবং লেজার এন্ট্রি তৈরি হয় — যাতে ডেমোতে **Available Balance, Hold, Eligibility** সত্যিকারের হিসাব দেখায়, হার্ডকোড সংখ্যা নয়। এটি Flow 3, 4, 5 প্রমাণ করার জন্য অত্যন্ত কার্যকর।
