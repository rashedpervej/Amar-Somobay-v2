/* ============================================================
   tests/_mockDb.mjs — offline Supabase simulator (D-02 security harness)
   ------------------------------------------------------------
   কেন: ব্যবহারকারীর নির্দেশ — production DB স্পর্শ করা যাবে না; এখন offline harness,
   পরে একই টেস্ট Supabase staging-এ চালানো যাবে (--live মোড, দ্রষ্টব্য d02 ফাইল)।

   এটি আসল Supabase নয়। এটি RLS নীতিকে JS-এ মডেল করে, যাতে দুইটি পৃথক
   Test Organization দিয়ে positive ও negative টেস্ট চালানো যায়।
   কোনো secret/credential এখানে নেই।
   ============================================================ */

export const ORG_A = '11111111-1111-4111-8111-111111111111';
export const ORG_B = '22222222-2222-4222-8222-222222222222';

export const USERS = {
  a_admin:      { id: 'u-a-admin',      name: 'কামরুল হাসান (A)',   phone: '01711000001', globalRole: 'member' },
  a_collector:  { id: 'u-a-collector',  name: 'রাজু আহমেদ (A)',    phone: '01711000002', globalRole: 'member' },
  a_member:     { id: 'u-a-member',     name: 'আব্দুল করিম (A)',   phone: '01711000003', globalRole: 'member' },
  b_admin:      { id: 'u-b-admin',      name: 'নাসরিন আক্তার (B)',  phone: '01722000001', globalRole: 'member' },
  b_member:     { id: 'u-b-member',     name: 'সুমি রানী দাস (B)',  phone: '01722000002', globalRole: 'member' },
  // F-01 attacker: বৈশ্বিক profiles.role='admin', কিন্তু কোনো সমবায়ে সদস্য নয়
  global_admin: { id: 'u-global-admin', name: 'বহিরাগত অ্যাডমিন',    phone: '01733000001', globalRole: 'admin' },
  // বৈধ multi-tenant ব্যবহারকারী (দুই সমবায়ে সদস্য)
  two_org:      { id: 'u-two-org',      name: 'দ্বৈত-সদস্য ব্যবহারকারী', phone: '01744000001', globalRole: 'member' },
  platform:     { id: 'u-platform',     name: 'প্ল্যাটফর্ম অডির্ট',   phone: '01755000001', globalRole: 'member' },
};

const M = (organization_id, user_id, role, status = 'active') => ({ organization_id, user_id, role, status });

export function seedDb() {
  return {
    organizations: [
      { id: ORG_A, name: 'আদর্শ সমবায় সমিতি লিমিটেড', slug: 'adarsha', cooperative_code: 'ADRS-01', reg_number: 'R-01' },
      { id: ORG_B, name: 'উত্তরণ সমবায় সমিতি লিমিটেড', slug: 'uttaron', cooperative_code: 'UTTR-02', reg_number: 'R-02' },
    ],
    profiles: Object.values(USERS).map((u) => ({ id: u.id, full_name: u.name, phone: u.phone, role: u.globalRole })),
    organization_members: [
      M(ORG_A, USERS.a_admin.id, 'cooperative_admin'),
      M(ORG_A, USERS.a_collector.id, 'collector'),
      M(ORG_A, USERS.a_member.id, 'member'),
      M(ORG_A, USERS.two_org.id, 'member'),
      M(ORG_B, USERS.b_admin.id, 'cooperative_admin'),
      M(ORG_B, USERS.b_member.id, 'member'),
      M(ORG_B, USERS.two_org.id, 'member'),
      M(ORG_A, 'u-suspended', 'member', 'suspended'),
    ],
    platform_admins: [{ user_id: USERS.platform.id, permission_level: 'platform_owner' }],
    somobay_plans: [
      { id: 'plan-a1', organization_id: ORG_A, name: 'মাসিক সঞ্চয় (A)', scheme_type: 'savings', profit_percentage: 0, late_fee_amount: 50 },
      { id: 'plan-a2', organization_id: ORG_A, name: 'কর্জে হাসানা তহবিল স্কিম (A)', scheme_type: 'qard', profit_percentage: 0, late_fee_amount: 0 },
      { id: 'plan-b1', organization_id: ORG_B, name: 'মাসিক সঞ্চয় (B)', scheme_type: 'savings', profit_percentage: 0, late_fee_amount: 50 },
    ],
    member_plans: [
      { id: 'mp-a1', organization_id: ORG_A, plan_id: 'plan-a1', member_id: USERS.a_member.id, total_collected: 12000, pending_fine: 0 },
      { id: 'mp-b1', organization_id: ORG_B, plan_id: 'plan-b1', member_id: USERS.b_member.id, total_collected: 45000, pending_fine: 500 },
    ],
    plan_payments: [
      { id: 'pp-a1', organization_id: ORG_A, member_plan_id: 'mp-a1', amount: 1000, type: 'installment', status: 'approved', penalty_paid: 0 },
      { id: 'pp-b1', organization_id: ORG_B, member_plan_id: 'mp-b1', amount: 2000, type: 'installment', status: 'approved', penalty_paid: 0 },
    ],
    rosca_periods: [
      { id: 'rp-a1', organization_id: ORG_A, plan_id: 'plan-a1', cycle_no: 1, payout_amount: 12000, draw_seed: 'seed-a', status: 'open' },
      { id: 'rp-b1', organization_id: ORG_B, plan_id: 'plan-b1', cycle_no: 1, payout_amount: 24000, draw_seed: 'seed-b', status: 'open' },
    ],
    joint_goal_expenses: [
      { id: 'jg-a1', organization_id: ORG_A, plan_id: 'plan-a1', amount: 500, note: 'A-এর খরচ' },
      { id: 'jg-b1', organization_id: ORG_B, plan_id: 'plan-b1', amount: 900, note: 'B-এর খরচ' },
    ],
    member_wallets: [
      { id: 'mw-a', organization_id: ORG_A, user_id: USERS.a_member.id, balance: 500 },
      { id: 'mw-b', organization_id: ORG_B, user_id: USERS.b_member.id, balance: 700 },
    ],
    wallet_transactions: [
      { id: 'wt-a1', organization_id: ORG_A, wallet_id: 'mw-a', amount: 500, type: 'credit' },
      { id: 'wt-b1', organization_id: ORG_B, wallet_id: 'mw-b', amount: 700, type: 'credit' },
    ],
    savings_withdrawals: [
      { id: 'sw-a1', organization_id: ORG_A, member_id: USERS.a_member.id, amount: 300, status: 'pending' },
      { id: 'sw-b1', organization_id: ORG_B, member_id: USERS.b_member.id, amount: 800, status: 'approved' },
    ],
    qard_funds: [
      { id: 'qf-a', organization_id: ORG_A, fund_name: 'কর্জে হাসানা তহবিল (A)', total_allocated: 500000, total_disbursed: 120000, total_recovered: 40000 },
      { id: 'qf-b', organization_id: ORG_B, fund_name: 'কর্জে হাসানা তহবিল (B)', total_allocated: 900000, total_disbursed: 300000, total_recovered: 90000 },
    ],
    qard_applications: [
      { id: 'qa-a1', organization_id: ORG_A, code: 'QHA-A-001', member_id: USERS.a_member.id, requested_amount: 20000, status: 'pending' },
      { id: 'qa-b1', organization_id: ORG_B, code: 'QHA-B-001', member_id: USERS.b_member.id, requested_amount: 60000, status: 'pending' },
    ],
    qard_loans: [
      { id: 'ql-a1', organization_id: ORG_A, application_id: 'qa-a1', member_id: USERS.a_member.id, principal_amount: 20000, total_repaid: 5000, outstanding_principal: 15000 },
      { id: 'ql-b1', organization_id: ORG_B, application_id: 'qa-b1', member_id: USERS.b_member.id, principal_amount: 60000, total_repaid: 0, outstanding_principal: 60000 },
    ],
    qard_repayments: [
      { id: 'qr-a1', organization_id: ORG_A, loan_id: 'ql-a1', member_id: USERS.a_member.id, amount: 5000, status: 'approved' },
      { id: 'qr-b1', organization_id: ORG_B, loan_id: 'ql-b1', member_id: USERS.b_member.id, amount: 0, status: 'pending' },
    ],
    notifications: [
      { id: 'n-a', organization_id: ORG_A, user_id: USERS.a_admin.id, title: 'A-এর নোটিশ' },
      { id: 'n-b', organization_id: ORG_B, user_id: USERS.b_admin.id, title: 'B-এর নোটিশ' },
    ],
    promotions: [
      { id: 'pr-a', organization_id: ORG_A, title: 'A প্রচার', is_active: true },
      { id: 'pr-b', organization_id: ORG_B, title: 'B প্রচার', is_active: true },
    ],
    app_settings: [
      { id: 'set-a', organization_id: ORG_A, org_name_display: 'আদর্শ' },
      { id: 'set-b', organization_id: ORG_B, org_name_display: 'উত্তরণ' },
    ],
    audit_logs: [
      { id: 'al-a', organization_id: ORG_A, actor_id: USERS.a_admin.id, action: 'plan.update' },
      { id: 'al-b', organization_id: ORG_B, actor_id: USERS.b_admin.id, action: 'plan.update' },
    ],
    // repo SQL-এ এই টেবিলের CREATE/RLS নেই → runtime-এ RLS অবস্থা অজানা (finding F-08)
    member_actions: [
      { id: 'ma-a', organization_id: ORG_A, user_id: USERS.a_member.id, action_type: 'login' },
      { id: 'ma-b', organization_id: ORG_B, user_id: USERS.b_member.id, action_type: 'login' },
    ],
  };
}

/* ---------------- RLS helper functions (SQL-এর JS মডেল) ---------------- */

function mkHelpers(db) {
  const isPlatformAdmin = (uid) => db.platform_admins.some((p) => p.user_id === uid);
  const membership = (orgId, uid) =>
    db.organization_members.find((m) => m.organization_id === orgId && m.user_id === uid && m.status === 'active');
  const isOrgMember = (orgId, uid) => Boolean(membership(orgId, uid));
  const orgRole = (orgId, uid) => membership(orgId, uid)?.role || null;
  const isOrgAdmin = (orgId, uid) => orgRole(orgId, uid) === 'cooperative_admin';
  const isOrgCollectorOrAdmin = (orgId, uid) => ['cooperative_admin', 'collector'].includes(orgRole(orgId, uid));
  const sharesOrgWith = (uidA, uidB) => {
    const orgsA = db.organization_members.filter((m) => m.user_id === uidA && m.status === 'active').map((m) => m.organization_id);
    return db.organization_members.some((m) => m.user_id === uidB && m.status === 'active' && orgsA.includes(m.organization_id));
  };
  return { isPlatformAdmin, isOrgMember, isOrgAdmin, isOrgCollectorOrAdmin, orgRole, sharesOrgWith };
}

/* ---------------- নীতি সেট ----------------
   CURRENT  = repo-তে পাওয়া নীতি (permissive USING(true) সহ — যেটি শেষে apply হয়েছে সেটিই জেতে)
   REMEDIATED = app/db/D02_tenant_isolation__REMEDIATION_DRAFT.sql-এর মডেল
-------------------------------------------------- */
export function buildPolicies(db, mode) {
  const H = mkHelpers(db);
  const uid = (a) => a?.uid ?? null;   // anonymous (লগইন ছাড়া) → null → সব নীতিতে অস্বীকৃত
  const permissive = [{ cmd: 'SELECT', using: () => true }];
  // fix_schema.sql:47-59 ও supabase_security_fixes.sql:117-125 — বৈশ্বিক profiles.role='admin'
  // দিয়ে tenant-owned আর্থিক টেবিলে FOR ALL নীতি (cross-tenant WRITE ঝুঁকি)
  const isGlobalAdmin = (u) => db.profiles.find((p) => p.id === u)?.role === 'admin';
  const globalAdminAll = [
    { cmd: 'SELECT', using: (r, a) => isGlobalAdmin(uid(a)) },
    { cmd: 'INSERT', check: (r, a) => isGlobalAdmin(uid(a)) },
    { cmd: 'UPDATE', using: (r, a) => isGlobalAdmin(uid(a)), check: (r, a) => isGlobalAdmin(uid(a)) },
    { cmd: 'DELETE', using: (r, a) => isGlobalAdmin(uid(a)) },
  ];

  const isolatedMember = [
    { cmd: 'SELECT', using: (r, a) => H.isOrgMember(r.organization_id, uid(a)) || H.isPlatformAdmin(uid(a)) },
    { cmd: 'INSERT', check: (r, a) => H.isOrgMember(r.organization_id, uid(a)) || H.isPlatformAdmin(uid(a)) },
    { cmd: 'UPDATE', using: (r, a) => H.isOrgAdmin(r.organization_id, uid(a)) || H.isPlatformAdmin(uid(a)),
      check: (r, a) => H.isOrgAdmin(r.organization_id, uid(a)) || H.isPlatformAdmin(uid(a)) },
    { cmd: 'DELETE', using: (r, a) => H.isPlatformAdmin(uid(a)) },
  ];

  const memberOwnRow = [
    { cmd: 'SELECT', using: (r, a) => r.member_id === uid(a) || r.user_id === uid(a) || H.isOrgAdmin(r.organization_id, uid(a)) || H.isPlatformAdmin(uid(a)) },
    { cmd: 'INSERT', check: (r, a) => (r.member_id === uid(a) || r.user_id === uid(a)) && H.isOrgMember(r.organization_id, uid(a)) },
    { cmd: 'UPDATE', using: (r, a) => H.isOrgAdmin(r.organization_id, uid(a)) || H.isPlatformAdmin(uid(a)),
      check: (r, a) => H.isOrgAdmin(r.organization_id, uid(a)) || H.isPlatformAdmin(uid(a)) },
  ];

  const collectorCanInsert = [
    ...isolatedMember.slice(0, 1),
    { cmd: 'INSERT', check: (r, a) => H.isOrgCollectorOrAdmin(r.organization_id, uid(a)) || H.isPlatformAdmin(uid(a)) },
    { cmd: 'UPDATE', using: (r, a) => H.isOrgAdmin(r.organization_id, uid(a)) || H.isPlatformAdmin(uid(a)),
      check: (r, a) => H.isOrgAdmin(r.organization_id, uid(a)) || H.isPlatformAdmin(uid(a)) },
  ];

  const P = {
    // --- CURRENT (repo as-found) ---
    CURRENT: {
      profiles: permissive.concat([                            // FIX_PROFILES_RECURSION.sql:46 / MASTER:37
        { cmd: 'INSERT', check: (r, a) => r.id === uid(a) },    // FIX_PROFILES_RECURSION.sql:51
        { cmd: 'UPDATE', using: (r, a) => r.id === uid(a) || isGlobalAdmin(uid(a)),
          check: (r, a) => r.id === uid(a) || isGlobalAdmin(uid(a)) },
      ]),
      organizations: permissive.concat([                       // FIX_ALL_RLS_AND_STORAGE.sql:115
        { cmd: 'INSERT', check: (r, a) => H.isPlatformAdmin(uid(a)) },
        { cmd: 'UPDATE', using: (r, a) => H.isPlatformAdmin(uid(a)) },
      ]),
      somobay_plans: permissive.concat(globalAdminAll),         // fix_schema.sql:51-54, supabase_security_fixes.sql:112-125
      rosca_periods: permissive,                              // MASTER:97 / STEP1:96
      joint_goal_expenses: permissive,                        // MASTER:124 / STEP1:122
      wallet_transactions: permissive,                        // PHASE_3_WORKFLOWS.sql:23
      qard_funds: permissive,                                 // QARD_HASANAH_PRODUCTION_MIGRATION.sql:92
      app_settings: permissive,                               // APP_SETTINGS_SETUP.sql:26
      promotions: permissive,                                 // PROMOTIONS_AND_NOTICES_SCHEMA.sql:61/71
      member_actions: permissive.concat([{ cmd: 'INSERT', check: () => true }, { cmd: 'UPDATE', using: () => true, check: () => true }, { cmd: 'DELETE', using: () => true }]), // RLS নেই (finding F-08)
      organization_members: [
        { cmd: 'SELECT', using: (r, a) => H.isOrgMember(r.organization_id, uid(a)) || H.isPlatformAdmin(uid(a)) },
        { cmd: 'INSERT', check: (r, a) => H.isOrgAdmin(r.organization_id, uid(a)) || H.isPlatformAdmin(uid(a)) },
        { cmd: 'UPDATE', using: (r, a) => H.isOrgAdmin(r.organization_id, uid(a)) || H.isPlatformAdmin(uid(a)) },
      ],
      platform_admins: [{ cmd: 'SELECT', using: (r, a) => H.isPlatformAdmin(uid(a)) }],
      member_plans: [                                          // fix_schema.sql:56-59
        { cmd: 'SELECT', using: (r, a) => r.member_id === uid(a) || isGlobalAdmin(uid(a)) || H.isOrgMember(r.organization_id, uid(a)) || H.isPlatformAdmin(uid(a)) },
        ...globalAdminAll.slice(1),
      ],
      plan_payments: globalAdminAll.concat(collectorCanInsert), // fix_schema.sql:47-48
      member_wallets: isolatedMember,
      savings_withdrawals: memberOwnRow,
      qard_applications: memberOwnRow,
      qard_loans: memberOwnRow,
      qard_repayments: memberOwnRow,
      notifications: [
        { cmd: 'SELECT', using: (r, a) => r.user_id === uid(a) || H.isPlatformAdmin(uid(a)) },
        { cmd: 'INSERT', check: (r, a) => H.isOrgMember(r.organization_id, uid(a)) || H.isPlatformAdmin(uid(a)) },
      ],
      audit_logs: [
        { cmd: 'SELECT', using: (r, a) => H.isOrgAdmin(r.organization_id, uid(a)) || H.isPlatformAdmin(uid(a)) },
        { cmd: 'INSERT', check: (r, a) => H.isOrgMember(r.organization_id, uid(a)) || H.isPlatformAdmin(uid(a)) },
      ],
    },

    // --- REMEDIATED (প্রস্তাবিত; SQL ড্রাফটের JS মডেল) ---
    REMEDIATED: {
      profiles: [
        { cmd: 'SELECT', using: (r, a) => r.id === uid(a) || H.sharesOrgWith(uid(a), r.id) || H.isPlatformAdmin(uid(a)) },
        { cmd: 'INSERT', check: (r, a) => r.id === uid(a) },
        { cmd: 'UPDATE', using: (r, a) => r.id === uid(a), check: (r, a) => r.id === uid(a) },
      ],
      organizations: [
        { cmd: 'SELECT', using: (r, a) => H.isOrgMember(r.id, uid(a)) || H.isPlatformAdmin(uid(a)) },
        { cmd: 'INSERT', check: (r, a) => H.isPlatformAdmin(uid(a)) },
        { cmd: 'UPDATE', using: (r, a) => H.isOrgAdmin(r.id, uid(a)) || H.isPlatformAdmin(uid(a)) },
      ],
      somobay_plans: isolatedMember,
      member_plans: isolatedMember,
      plan_payments: collectorCanInsert,
      rosca_periods: isolatedMember,
      joint_goal_expenses: isolatedMember,
      member_wallets: isolatedMember,
      wallet_transactions: isolatedMember,
      savings_withdrawals: memberOwnRow,
      qard_funds: [
        { cmd: 'SELECT', using: (r, a) => H.isOrgMember(r.organization_id, uid(a)) || H.isPlatformAdmin(uid(a)) },
        { cmd: 'INSERT', check: (r, a) => H.isOrgAdmin(r.organization_id, uid(a)) || H.isPlatformAdmin(uid(a)) },
        { cmd: 'UPDATE', using: (r, a) => H.isOrgAdmin(r.organization_id, uid(a)) || H.isPlatformAdmin(uid(a)) },
      ],
      qard_applications: memberOwnRow,
      qard_loans: memberOwnRow,
      qard_repayments: memberOwnRow,
      notifications: [
        { cmd: 'SELECT', using: (r, a) => r.user_id === uid(a) || H.isPlatformAdmin(uid(a)) },
        { cmd: 'INSERT', check: (r, a) => Boolean(r.organization_id) && (H.isOrgMember(r.organization_id, uid(a)) || H.isPlatformAdmin(uid(a))) },
      ],
      promotions: isolatedMember,
      app_settings: isolatedMember,
      audit_logs: [
        { cmd: 'SELECT', using: (r, a) => H.isOrgAdmin(r.organization_id, uid(a)) || H.isPlatformAdmin(uid(a)) },
        { cmd: 'INSERT', check: (r, a) => Boolean(r.organization_id) && (H.isOrgMember(r.organization_id, uid(a)) || H.isPlatformAdmin(uid(a))) },
        { cmd: 'UPDATE', using: () => false },   // অডিট লগ অপরিবর্তনীয়
        { cmd: 'DELETE', using: () => false },
      ],
      member_actions: [
        { cmd: 'SELECT', using: (r, a) => r.user_id === uid(a) || H.isOrgAdmin(r.organization_id, uid(a)) || H.isPlatformAdmin(uid(a)) },
        { cmd: 'INSERT', check: (r, a) => Boolean(r.organization_id) && r.user_id === uid(a) && H.isOrgMember(r.organization_id, uid(a)) },
        { cmd: 'UPDATE', using: () => false },
        { cmd: 'DELETE', using: () => false },
      ],
      organization_members: [
        { cmd: 'SELECT', using: (r, a) => H.isOrgMember(r.organization_id, uid(a)) || H.isPlatformAdmin(uid(a)) },
        { cmd: 'INSERT', check: (r, a) => H.isOrgAdmin(r.organization_id, uid(a)) || H.isPlatformAdmin(uid(a)) },
        { cmd: 'UPDATE', using: (r, a) => H.isOrgAdmin(r.organization_id, uid(a)) || H.isPlatformAdmin(uid(a)) },
      ],
      platform_admins: [{ cmd: 'SELECT', using: (r, a) => H.isPlatformAdmin(uid(a)) }],
    },
  };
  return P[mode] || P.CURRENT;
}

/* ---------------- মক ক্লায়েন্ট ---------------- */

export class PolicyDenied extends Error {
  constructor(msg) { super(msg); this.name = 'PolicyDenied'; this.code = '42501'; }
}

/**
 * @param {object} opts { db, policies, actor: {uid} | null }
 */
export function createMockClient({ db, policies, actor = null }) {
  const allow = (table, cmd, row) => {
    if (!actor) return false;                        // anonymous → RLS default deny
    const list = policies[table] || [];
    return list.some((p) => p.cmd === cmd && (cmd === 'SELECT' || cmd === 'DELETE' ? p.using?.(row, actor) !== false : true));
  };
  const passes = (table, cmd, row) => {
    const list = policies[table] || [];
    return list.some((p) => p.cmd === cmd && (cmd === 'INSERT' ? p.check?.(row, actor) : p.using?.(row, actor) && (p.check ? p.check(row, actor) : true)));
  };

  const from = (table) => {
    if (!db[table]) throw new Error(`unknown table ${table}`);
    let pending = null;
    const filters = [];
    let limitN = null;

    const api = {
      select: () => api,
      eq: (c, v) => { filters.push((r) => String(r[c] ?? '') === String(v)); return api; },
      neq: (c, v) => { filters.push((r) => String(r[c] ?? '') !== String(v)); return api; },
      in: (c, arr) => { filters.push((r) => arr.map(String).includes(String(r[c] ?? ''))); return api; },
      ilike: (c, pat) => { filters.push((r) => String(r[c] ?? '').toLowerCase().includes(String(pat).replace(/%/g, '').toLowerCase())); return api; },
      or: (expr) => {
        const parts = String(expr).split(',');
        filters.push((r) => parts.some((p) => {
          const [col, op, val] = p.split('.');
          if (op === 'eq') return String(r[col] ?? '') === String(val);
          if (op === 'ilike') return String(r[col] ?? '').toLowerCase().includes(String(val).replace(/%/g, '').toLowerCase());
          return false;
        }));
        return api;
      },
      order: () => api,
      limit: (n) => { limitN = n; return api; },
      single: () => terminal('single'),
      maybeSingle: () => terminal('maybeSingle'),
      then: (res, rej) => execute().then(res, rej),

      insert: (payload) => { pending = { type: 'insert', payload }; return api; },
      update: (patch) => { pending = { type: 'update', patch }; return api; },
      delete: () => { pending = { type: 'delete' }; return api; },
    };

    function execute() {
      if (!pending) return terminal('many');
      if (pending.type === 'insert') {
        const arr = Array.isArray(pending.payload) ? pending.payload : [pending.payload];
        for (const row of arr) {
          if (!passes(table, 'INSERT', row)) return Promise.resolve({ data: null, error: new PolicyDenied(`RLS: ${table} INSERT প্রত্যাখ্যাত`), count: 0 });
        }
        db[table].push(...arr.map((r) => ({ ...r })));
        return Promise.resolve({ data: arr, error: null, count: arr.length });
      }
      if (pending.type === 'update') {
        let touched = 0;
        db[table] = db[table].map((r) => {
          if (!filters.every((f) => f(r))) return r;
          if (!passes(table, 'UPDATE', r)) return r;
          touched += 1;
          return { ...r, ...pending.patch };
        });
        return Promise.resolve({
          data: null,
          error: touched === 0 ? new PolicyDenied(`RLS: ${table} UPDATE প্রত্যাখ্যাত`) : null,
          count: touched,
        });
      }
      // delete
      let removed = 0;
      db[table] = db[table].filter((r) => {
        if (!filters.every((f) => f(r))) return true;
        if (passes(table, 'DELETE', r)) { removed += 1; return false; }
        return true;
      });
      return Promise.resolve({ data: null, error: removed === 0 ? new PolicyDenied(`RLS: ${table} DELETE প্রত্যাখ্যাত`) : null, count: removed });
    }

    function terminal(mode) {
      let visible = db[table].filter((r) => allow(table, 'SELECT', r)).filter((r) => filters.every((f) => f(r)));
      if (limitN != null) visible = visible.slice(0, limitN);
      if (mode === 'single') return visible.length === 1 ? Promise.resolve({ data: visible[0], error: null }) : Promise.resolve({ data: null, error: new Error('not single') });
      if (mode === 'maybeSingle') return Promise.resolve({ data: visible[0] ?? null, error: null });
      return Promise.resolve({ data: visible, error: null });
    }
    return api;
  };

  return {
    from,
    auth: { getUser: () => Promise.resolve({ data: { user: actor ? { id: actor.uid } : null }, error: null }) },
    rpc: async (fn, args = {}) => {
      // Phase 1-এ শুধু অডিট-যোগ্য দুটি bulk RPC মডেল করা হলো
      if (fn === 'assert_tenant_scope') {
        const ok = actor && policies.__helpers ? true : false;
        return { data: ok, error: ok ? null : new PolicyDenied('tenant scope') };
      }
      return { data: null, error: new Error(`rpc ${fn} not modelled in offline harness`) };
    },
  };
}

export function makeEnv(mode = 'CURRENT') {
  const db = seedDb();
  const policies = buildPolicies(db, mode);
  return { db, policies };
}

export function clientFor(env, userKey) {
  const actor = userKey ? { uid: USERS[userKey].id } : null;
  return createMockClient({ db: env.db, policies: env.policies, actor });
}
