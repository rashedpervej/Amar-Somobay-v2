/* ============================================================
   নীতি D-02 — Cross-Tenant Isolation Guard (Organization-level)
   ------------------------------------------------------------
   ব্যবহারকারীর সিদ্ধান্ত (2026-10-31):
     • প্রতিটি সমবায়ের ডেটা সম্পূর্ণ আলাদা ও সুরক্ষিত।
     • RLS + Backend/API/RPC — দুই স্তরেই isolation।
     • কোনো Org Admin/Member/Collector অন্য org-এর তথ্য দেখতে/বদলাতে পারবে না।
     • Client-পাঠানো organization_id একা বিশ্বাসযোগ্য নয় — Authenticated Membership
       ও Role যাচাই করতে হবে।
     • Storage, Reports, Exports, Realtime ও সব query-তে একই নীতি।
     • কমপক্ষে দুটি Test Organization দিয়ে positive ও negative টেস্ট।

   এই গার্ডটি Source A-তে পাওয়া তিনটি বাস্তব ত্রুটির সরাসরি সমাধান:
     F-01 CooperativeTenantGuard.tsx:112 — বৈশ্বিক profiles.role==='admin' দিয়ে
          যেকোনো সমবায়ে প্রবেশ ও cooperative_admin ভূমিকা (privilege escalation)।
     F-02 qardHasanahService.ts:277-289 — orgId অজানা থাকলে সব org-এর admin-কে
          নোটিফিকেশন (তথ্য ফাঁস) + organization_id: null।
     F-03 withdrawalService.ts:128 — orgId না পেলে হার্ডকোডেড ডিফল্ট org
          '00000000-…-001'-এ লেখা (অন্য tenant-এ ডেটা ঢোকা)।

   নীতি: **কোনো ডিফল্ট org fallback নেই।** না জানা মানেই অস্বীকার (deny-by-default)।
   ============================================================ */

/** Tenant-level ভূমিকা (organization_members.role) — Source A স্কিমা অনুযায়ী */
export const TENANT_ROLES = Object.freeze(['cooperative_admin', 'collector', 'member']);

/** ভবিষ্যতের ভূমিকা (specs/06 E.5) — এখন কোনো অনুমতি দেয় না, শুধু সংরক্ষিত */
export const RESERVED_ROLES = Object.freeze(['accountant', 'manager', 'approver', 'auditor', 'org_admin']);

/** উচ্চতর ক্ষমতার ক্রম (তুলনার জন্য) */
export const ROLE_RANK = Object.freeze({
  member: 1,
  collector: 2,
  accountant: 3,
  manager: 4,
  approver: 5,
  auditor: 5,
  cooperative_admin: 6,
  org_admin: 6,
});

/** organization_id আছে এমন tenant-owned টেবিল (MULTI_TENANT_FOUNDATION_UP.sql §4) */
export const ORG_SCOPED_TABLES = Object.freeze([
  'app_settings', 'somobay_plans', 'member_plans', 'plan_payments',
  'rosca_periods', 'joint_goal_expenses', 'member_wallets', 'wallet_transactions',
  'promotions', 'notifications', 'qard_funds', 'qard_applications',
  'qard_loans', 'qard_repayments', 'audit_logs', 'savings_withdrawals',
]);

/** যেসব টেবিলে organization_id নেই — এগুলো parent-সম্পর্ক দিয়ে স্কোপ করতে হয় */
export const CHILD_TABLE_PARENT = Object.freeze({
  member_plans: { table: 'somobay_plans', via: 'plan_id' },
  plan_payments: { table: 'member_plans', via: 'member_plan_id' },
  rosca_periods: { table: 'somobay_plans', via: 'plan_id' },
  joint_goal_expenses: { table: 'somobay_plans', via: 'plan_id' },
  qard_repayments: { table: 'qard_loans', via: 'loan_id' },
  qard_loans: { table: 'qard_applications', via: 'application_id' },
});

/** হার্ডকোডেড ডিফল্ট org — Source A-তে ব্যবহৃত; এই গার্ডে নিষিদ্ধ */
export const FORBIDDEN_DEFAULT_ORG = '00000000-0000-0000-0000-000000000001';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class TenantViolation extends Error {
  constructor(code, message, detail = {}) {
    super(`[D-02:${code}] ${message}`);
    this.name = 'TenantViolation';
    this.code = code;
    this.detail = detail;
  }
}

/**
 * Authenticated session থেকে tenant context তৈরি।
 * ⚠️ বৈশ্বিক profiles.role কখনো ভূমিকা নির্ধারণ করে না — শুধু organization_members।
 */
export function buildTenantContext({
  userId,
  memberships = [],
  platformAdmin = false,
  activeOrganizationId = null,
}) {
  if (!userId) throw new TenantViolation('NO_SESSION', 'authenticated user ছাড়া tenant context তৈরি করা যাবে না');

  const active = memberships.filter((m) => m && m.status === 'active' && m.organization_id);
  const byOrg = new Map();
  for (const m of active) {
    // একই org-এ একাধিক রোল থাকলে সর্বোচ্চটি
    const prev = byOrg.get(m.organization_id);
    if (!prev || (ROLE_RANK[m.role] || 0) > (ROLE_RANK[prev.role] || 0)) byOrg.set(m.organization_id, m);
  }

  let resolvedActive = null;
  if (activeOrganizationId && (byOrg.has(activeOrganizationId) || platformAdmin)) resolvedActive = activeOrganizationId;
  if (!resolvedActive && byOrg.size === 1) resolvedActive = [...byOrg.keys()][0];
  // একাধিক org থাকলে client-এর পছন্দ ছাড়া নিজে থেকে বেছে নেওয়া হয় না (ambiguous → null)

  return Object.freeze({
    userId,
    platformAdmin: Boolean(platformAdmin),
    memberships: Object.freeze(active),
    orgIds: Object.freeze([...byOrg.keys()]),
    activeOrgId: resolvedActive,
    roleOf(orgId) {
      if (this.platformAdmin && !byOrg.has(orgId)) return 'platform_admin';
      return byOrg.get(orgId)?.role || null;
    },
  });
}

/** orgId বৈধ UUID কিনা এবং নিষিদ্ধ ডিফল্ট org নয় কিনা */
export function assertOrgId(orgId, { allowDefaultOrg = false, label = 'organization_id' } = {}) {
  if (orgId === null || orgId === undefined || orgId === '') {
    throw new TenantViolation('ORG_ID_MISSING', `${label} অনুপস্থিত — ডিফল্ট org ধরে নেওয়া নিষিদ্ধ`, { orgId });
  }
  if (!UUID_RE.test(String(orgId))) {
    throw new TenantViolation('ORG_ID_INVALID', `${label} বৈধ UUID নয়`, { orgId });
  }
  if (!allowDefaultOrg && String(orgId) === FORBIDDEN_DEFAULT_ORG) {
    throw new TenantViolation(
      'ORG_ID_DEFAULT_FALLBACK',
      `${label} হার্ডকোডেড ডিফল্ট সমবায়ে পড়ছে — অন্য tenant-এ ডেটা লেখা নিষিদ্ধ`,
      { orgId },
    );
  }
  return String(orgId);
}

/**
 * কোনো org-তে প্রবেশাধিকার যাচাই।
 * F-01 এর সমাধান: বৈশ্বিক admin রোল এখানে কোনো ছাড় পায় না।
 */
export function assertOrgAccess(ctx, orgId, { minRole = 'member', action = 'access' } = {}) {
  const id = assertOrgId(orgId);
  if (ctx.platformAdmin) return { orgId: id, role: 'platform_admin', granted: true, reason: 'platform_admins টেবিলে তালিকাভুক্ত' };

  const role = ctx.roleOf(id);
  if (!role) {
    throw new TenantViolation(
      'NOT_A_MEMBER',
      `এই সমবায়ের সক্রিয় সদস্য নন — ${action} প্রত্যাখ্যাত`,
      { orgId: id, userId: ctx.userId, action },
    );
  }
  if ((ROLE_RANK[role] || 0) < (ROLE_RANK[minRole] || 0)) {
    throw new TenantViolation(
      'INSUFFICIENT_ROLE',
      `ভূমিকা '${role}' এর জন্য ${action} অনুমোদিত নয় (প্রয়োজন '${minRole}')`,
      { orgId: id, role, minRole, action },
    );
  }
  return { orgId: id, role, granted: true };
}

/**
 * client যে org চেয়েছে (slug/ID) তা membership দিয়ে resolve করা।
 * membership না থাকলে deny — "not found" ও "forbidden" আলাদা করা হয় না (enumeration রোধ)।
 */
export function resolveRequestedOrg(ctx, requested, { knownOrgs = [] } = {}) {
  const want = String(requested || '').trim();
  if (!want) throw new TenantViolation('ORG_NOT_SPECIFIED', 'কোনো সমবায় নির্দিষ্ট করা হয়নি');

  const match = knownOrgs.find(
    (o) => o && (o.id === want || o.slug === want || o.cooperative_code === want || o.reg_number === want),
  );
  const orgId = match?.id || (UUID_RE.test(want) ? want : null);
  // enumeration রোধ: "খুঁজে পাওয়া যায়নি" ও "সদস্য নন" — দুই ক্ষেত্রে একই ত্রুটি কোড
  if (!orgId) throw new TenantViolation('ORG_ACCESS_DENIED', 'সমবায় খুঁজে পাওয়া যায়নি বা প্রবেশাধিকার নেই');

  try {
    assertOrgAccess(ctx, orgId, { action: 'tenant-resolve' });
  } catch {
    throw new TenantViolation('ORG_ACCESS_DENIED', 'সমবায় খুঁজে পাওয়া যায়নি বা প্রবেশাধিকার নেই', { requested: want });
  }
  return { orgId, organization: match || null, role: ctx.roleOf(orgId) };
}

/**
 * Supabase-সদৃশ query builder-কে org-স্কোপ করা।
 * RLS-এর ওপর একা ভরসা না করে client স্তরেও স্কোপ — defence in depth।
 */
export function scopeQuery(query, ctx, { orgId = null, column = 'organization_id', required = true } = {}) {
  const id = orgId || ctx.activeOrgId;
  if (!id) {
    if (required) throw new TenantViolation('NO_ACTIVE_ORG', 'সক্রিয় সমবায় নির্দিষ্ট না করে query চালানো যাবে না');
    return query;
  }
  assertOrgId(id);
  if (typeof query?.eq !== 'function') {
    throw new TenantViolation('BAD_QUERY_BUILDER', 'scopeQuery-কে .eq() সমর্থনকারী builder দিতে হবে');
  }
  return query.eq(column, id);
}

/** একই org-এর নির্দিষ্ট ভূমিকার সদস্য — নোটিফিকেশন/অনুমোদনের জন্য (F-02 এর সমাধান) */
export function orgAudience(query, ctx, { orgId = null, roles = ['cooperative_admin'], includeStatusActive = true } = {}) {
  const id = orgId || ctx.activeOrgId;
  assertOrgId(id);
  let q = query.eq('organization_id', id).in('role', roles);
  if (includeStatusActive) q = q.eq('status', 'active');
  return q;
}

/**
 * Insert/Update-এর আগে সারি যাচাই।
 * - organization_id অবশ্যই সক্রিয় context-এর org হতে হবে (null/অন্য org নিষিদ্ধ)
 * - client পাঠানো orgId কেবল তখনই গ্রহণযোগ্য যখন সেটি membership-এর সঙ্গে মিলে যায়
 */
export function validateTenantRow(table, row, ctx, { orgId = null } = {}) {
  const expected = orgId || ctx.activeOrgId;
  assertOrgId(expected, { label: 'tenant context organization_id' });

  const problems = [];
  if (!ORG_SCOPED_TABLES.includes(table)) {
    problems.push({ field: '(table)', reason: `টেবিল '${table}' org-scoped তালিকায় নেই — স্কোপিং নিয়ম নির্ধারণ করা হয়নি` });
  }
  if (!row || typeof row !== 'object') {
    problems.push({ field: '(row)', reason: 'সারি অবৈধ' });
    return { ok: false, problems };
  }
  if ('organization_id' in row) {
    if (!row.organization_id) problems.push({ field: 'organization_id', reason: 'organization_id null/খালি — tenant ছাড়া সারি লেখা নিষিদ্ধ' });
    else if (String(row.organization_id) !== String(expected)) {
      problems.push({ field: 'organization_id', reason: `সারির organization_id সক্রিয় সমবায়ের (${expected}) সঙ্গে মিলছে না` });
    } else {
      assertOrgId(row.organization_id, { label: 'row.organization_id' });
    }
  } else {
    problems.push({ field: 'organization_id', reason: 'organization_id ছাড়া সারি লেখা যাবে না' });
  }

  try {
    assertOrgAccess(ctx, expected, { action: `write:${table}` });
  } catch (e) {
    problems.push({ field: '(access)', reason: e.message });
  }

  return { ok: problems.length === 0, problems, orgId: expected };
}

/** export/report/CSV — সব জায়গায় একই স্কোপ প্রয়োগের জন্য সাহায্যকারী */
export function scopedRows(rows, ctx, { orgId = null, column = 'organization_id' } = {}) {
  const id = String(orgId || ctx.activeOrgId || '');
  assertOrgId(id);
  return (rows || []).filter((r) => String(r?.[column] ?? '') === id);
}

export default {
  TENANT_ROLES, RESERVED_ROLES, ROLE_RANK, ORG_SCOPED_TABLES, CHILD_TABLE_PARENT,
  FORBIDDEN_DEFAULT_ORG, TenantViolation, buildTenantContext, assertOrgId, assertOrgAccess,
  resolveRequestedOrg, scopeQuery, orgAudience, validateTenantRow, scopedRows,
};
