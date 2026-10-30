# Audit Report: Role-Based Application & Database-Driven Profile Completion

> **Status:** Read-only audit. No code or database changes have been made.
> **Date:** 2026-10-21
> **Scope:** Profile, Role, Application, DB schema, RLS policies, application workflow.

---

## 1. Where data is currently stored

### 1.1 Core tables

| Table | Key columns | Purpose |
|---|---|---|
| `profiles` | `id (FK auth.users)`, `email`, `full_name`, `role ('admin'/'member'/'pending')`, `phone`, `avatar_url`, `bio`, `profile_completed`, `created_at`, `updated_at` | User identity & profile |
| `organizations` | `id`, `name`, `slug`, `reg_number` (= cooperative_code), `status ('active'/'suspended'/'pending')`, `created_at`, `updated_at` | Cooperative (somiti) entity |
| `organization_members` | `id`, `organization_id (FK organizations)`, `user_id (FK profiles)`, `role ('cooperative_admin'/'collector'/'member')`, `status ('active'/'pending'/'suspended')`, `joined_at`, `updated_at`, UNIQUE(org,user) | Membership link + application status |
| `platform_admins` | `id`, `user_id (FK profiles)`, `permission_level ('platform_owner'/'auditor')`, `granted_by`, `created_at` | Super admin registry |
| `app_settings` | `id`, `app_name`, `app_tagline`, `welcome_text`, `footer_text`, `logo_url`, `icon_url`, `primary_color`, `secondary_color`, `bangla_font`, `updated_at` | Platform branding (single row) |
| `audit_logs` | `id`, `organization_id`, `actor_id`, `action`, `entity_type`, `entity_id`, `details (jsonb)`, `ip_address`, `created_at` | Audit trail |

### 1.2 Frontend state (Zustand)

- `useAuthStore`: holds `user`, `profile`, `memberships`, `activeOrganization`, `activeRole`, `loading`, `initialized`.
- `profile_completed` is computed client-side as: `!!full_name && !!avatar_url && !!bio` (see `useAuthStore.updateProfile`).
- `isPending` (in `ProtectedRoute`) = no active membership AND not cooperative admin.

### 1.3 Application flows

| Flow | Entry point | Table writes | Status transitions |
|---|---|---|---|
| Apply as Cooperative Admin | `/cooperative/apply` (`ApplyCooperative.tsx`) | `organizations` (status='pending') + `organization_members` (role='cooperative_admin', status='pending') + `profiles.phone` | pending → (super admin approves) → active |
| Join as Member | `/cooperative/join` (`JoinCooperative.tsx`) | `organization_members` (role='member', status='pending') | pending → (coop admin approves) → active |
| Profile completion | `/settings/profile` (`EditProfile.tsx`) | `profiles` (full_name, avatar_url, bio, phone) | `profile_completed` flag |

### 1.4 RLS policies (current)

- `profiles`: public SELECT; self INSERT; self UPDATE (`auth.uid() = id`); admin UPDATE (where `profiles.role='admin'`).
- `notifications`: self SELECT/UPDATE.
- `organization_members` / `organizations`: policies defined in `MULTI_TENANT_FOUNDATION_UP.sql` (non-recursive security-definer helpers `is_platform_admin`, `get_user_org_role`).
- **No RLS** currently enforces application eligibility or required-field completeness server-side.

### 1.5 What is NOT in the database (gaps)

- ❌ No `field_configs` / requirement configuration table.
- ❌ No per-role required-field definitions (hardcoded in frontend: `ApplyCooperative` requires name/address/phone/role; `EditProfile` requires full_name only).
- ❌ No `terms_text` / `privacy_policy` / `min_age` / `max_members_per_coop` in `app_settings`.
- ❌ No server-side validation of profile completeness before application submit.
- ❌ No "request additional info" channel from admin to member.
- ❌ No audit trail for configuration changes.

---

## 2. Role requirements — currently undefined or inconsistent

### 2.1 Cooperative Admin Application (`ApplyCooperative.tsx`)

Hardcoded required fields (frontend `required` attribute):
- `name` (samiti name) ✅
- `address` (region) ✅
- `phone` ✅
- `roleTitle` ✅ (select)
- `description` optional
- `phone` synced to `profiles.phone` only if `!profile?.phone`

**Undefined/missing rules:**
- No KYC (NID) requirement defined.
- No terms & conditions acceptance checkbox.
- No minimum profile-completion gate (a user with empty profile can apply).
- No server-side re-validation of the same rules.

### 2.2 Member Application (`JoinCooperative.tsx`)

*(Not fully audited here; assumed similar hardcoded required fields.)*

**Undefined/missing rules:**
- No configurable per-cooperative required fields.
- No profile-completion gate before join.
- No terms acceptance.

### 2.3 Profile Completion (`EditProfile.tsx` / `PendingApproval.tsx`)

- `profile_completed` = `full_name && avatar_url && bio` (only 3 fields).
- PendingApproval shows a 3-step gauge (name → photo → bio).
- **Inconsistent:** `EditProfile` only validates `full_name` on save; does not enforce avatar/bio.
- **No server-side enforcement** of profile completion.

### 2.4 Role semantics

- `profiles.role` ∈ { 'admin', 'member', 'pending' }.
- `organization_members.role` ∈ { 'cooperative_admin', 'collector', 'member' }.
- A user can be `pending` (no active membership) and still apply.
- `ProtectedRoute` redirects pending users to `/pending` unless on allowed paths.
- **Gap:** "pending" is overloaded (no membership vs. application under review). No distinct "application_status" field.

---

## 3. How Database-driven requirements & validation will be implemented

### 3.1 New table: `field_configs`

```sql
CREATE TABLE public.field_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL CHECK (scope IN ('platform', 'cooperative')),
  scope_id uuid,                       -- NULL for platform; org id for cooperative
  form_type text NOT NULL CHECK (form_type IN ('apply_cooperative', 'join_cooperative', 'member_profile')),
  field_key text NOT NULL,
  label_bn text,
  is_required boolean NOT NULL DEFAULT false,
  is_visible boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  validation_rule jsonb DEFAULT '{}'::jsonb,  -- e.g. {"min":10,"pattern":"^\\d{11}$"}
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (scope, scope_id, form_type, field_key)
);
```

### 3.2 Extended `app_settings`

Add columns:
- `terms_text text`
- `member_terms_text text`
- `privacy_policy_text text`
- `min_age_for_membership int DEFAULT 18`
- `max_members_per_coop int DEFAULT 5000`
- `require_terms_acceptance boolean DEFAULT true`

### 3.3 Frontend rendering (config-driven)

```ts
// Pseudo: load config from DB, render fields dynamically
const { data: configs } = await supabase
  .from('field_configs')
  .select('field_key, is_required, is_visible, sort_order, validation_rule')
  .eq('scope', scope)          // 'platform' | 'cooperative'
  .eq('scope_id', scopeId)     // null | org id
  .eq('form_type', formType)
  .order('sort_order');

// Map field_key -> component; required flag drives `required` attr + "*" label
```

### 3.4 Eligibility check before submit

A shared function (client + server) that:
1. Fetches `field_configs` for the role.
2. For each required field, checks `profile`/form data is non-empty and valid (against `validation_rule`).
3. Returns `{ eligible: boolean, missing: [{ field_key, label_bn, target_route }] }`.
4. If not eligible → show popup listing missing fields with links to fix them.
5. If eligible → allow submit.

### 3.5 Server-side enforcement

- Supabase RPC `check_application_eligibility(user_id, role, org_id)` returning `{ eligible, missing }`.
- `ApplyCooperative`/`JoinCooperative` submit handlers call this RPC first; reject if not eligible.
- RLS on `organizations`/`organization_members` insert: require a valid eligibility check (via trigger or RPC guard).

### 3.6 Profile update propagation

- `profiles` is the single source of truth.
- `PendingApproval` and `EditProfile` both read from `useAuthStore.profile`.
- After `updateProfile`, store is updated → all pages re-render with new data.
- `profile_completed` should be recomputed by a DB trigger or RPC based on `field_configs` (member_profile scope), not hardcoded.

---

## 4. Required schema / RLS / RPC / frontend changes

### 4.1 Schema changes
- Create `field_configs` table (+ indexes on scope/scope_id/form_type).
- Alter `app_settings` (terms, privacy, min_age, max_members, require_terms_acceptance).
- Add `application_status` column to `organization_members` (or new `applications` table) to distinguish "under review" from membership status.
- Add `profile_completed_at` timestamp to `profiles` (optional, for audit).

### 4.2 RLS policies
- `field_configs`: platform rows readable by all authenticated; writable only by platform admins (via `platform_admins` check). Cooperative rows readable by org members; writable only by cooperative admins of that org.
- `app_settings`: readable by all; writable only by platform admins.

### 4.3 RPC functions
- `get_field_config(scope, scope_id, form_type)` → returns config rows.
- `check_profile_eligibility(user_id, form_type, scope_id)` → returns `{ eligible, missing[] }`.
- `submit_cooperative_application(...)` / `submit_member_application(...)` → server-side validated insert.

### 4.4 Frontend changes
- `ApplyCooperative.tsx`: replace hardcoded required fields with config-driven rendering + eligibility popup.
- `JoinCooperative.tsx`: same, using cooperative scope config.
- `EditProfile.tsx`: config-driven fields (member_profile scope) + progress gauge.
- `PendingApproval.tsx`: eligibility-aware gating + links to fix missing fields.
- `PlatformSettings` (superadmin): new tab "Application Fields" + Terms settings.
- New coop admin page: "আবেদন ফর্ম সেটিংস" (field config UI).
- Shared component: `EligibilityPopup` listing missing fields with navigation links.

### 4.5 Audit trail
- Log all config changes to `audit_logs` (actor, entity, old/new values).
- Log application submit/approve/reject with eligibility snapshot.

---

## 5. Ensuring incomplete profile cannot apply; complete profile can

### 5.1 Client-side
- Before showing the submit button, call `check_profile_eligibility`.
- If ineligible, disable submit and show `EligibilityPopup` with missing fields + "যান" (go fix) links.
- Re-check on return (via `useEffect` on profile change).

### 5.2 Server-side
- RPC `submit_*_application` re-runs eligibility check; raises exception if incomplete.
- RLS insert policy requires eligibility (via security-definer check).
- Direct API/DB requests cannot bypass because policy enforces it.

### 5.3 Edge cases
- Config changes after application submitted: existing applications keep their submitted snapshot; new config applies to future applications.
- Profile updated after approval: does not affect already-approved membership; only future applications.
- Admin changes required fields to include a new field: existing members not forced retroactively; only new applicants must fill it.

---

## 6. Open questions for you

1. **Default required fields** — Is the proposed default list (Section 2 of the earlier message) acceptable, or do you want different defaults?
2. **Config granularity** — Should cooperative admins be able to make *any* field required, or only a predefined set of optional fields (name/phone/address always required)?
3. **Terms acceptance** — Should terms be a single platform-wide text, or per-cooperative customizable?
4. **Request Info flow** — Should admins be able to request specific missing fields from a member, or just a generic "complete your profile" nudge?
5. **Start phase** — Begin with Phase 1 (DB migration SQL) and Phase 2 (super admin UI), or do you want the full plan revised first?

> **No code or database changes have been made. Awaiting your approval before proceeding.**
---

## 7. Summary of my understanding

You want a **fully database-driven, role-aware application system** where:
- Requirements differ by role (Cooperative Admin vs. Member).
- Both super admin and cooperative admin can configure which fields are mandatory.
- Eligibility is checked both client-side (with a guided popup) and server-side (RLS/RPC).
- Profile is a single source of truth; updates propagate everywhere.
- Audit trail exists for config and application lifecycle.
- No business rules are hardcoded in the frontend.

I will not make any changes until you confirm the plan and answer the open questions above.