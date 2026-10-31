/* ============================================================
   tests/d02-tenant-isolation.mjs
   নীতি D-02 — Cross-Tenant Isolation: positive + negative নিরাপত্তা টেস্ট
   দুইটি পৃথক Test Organization (আদর্শ / উত্তরণ) + ৮ ধরনের actor।

   চালানো:  node tests/d02-tenant-isolation.mjs
   লাইভ:    node tests/d02-tenant-isolation.mjs --live   (Supabase staging + env টোকেন লাগবে)
   কোনো secret এই ফাইলে নেই; লাইভ মোড env থেকে পড়ে।
   ============================================================ */

import { createSuite } from './_harness.mjs';
import { makeEnv, clientFor, ORG_A, ORG_B, USERS } from './_mockDb.mjs';
import {
  buildTenantContext, assertOrgAccess, assertOrgId, resolveRequestedOrg, scopeQuery,
  orgAudience, validateTenantRow, scopedRows, TenantViolation, FORBIDDEN_DEFAULT_ORG, ROLE_RANK,
} from '../src/lib/tenant.mjs';

const S = createSuite('D-02 · Cross-Tenant Isolation (offline RLS simulation)');

const memberships = (userKey) => {
  const env = makeEnv('CURRENT');
  return env.db.organization_members.filter((m) => m.user_id === USERS[userKey].id);
};
const ctxFor = (userKey, activeOrganizationId = null) =>
  buildTenantContext({
    userId: USERS[userKey].id,
    memberships: memberships(userKey),
    platformAdmin: userKey === 'platform',
    activeOrganizationId,
  });

const ALL_TABLES = [
  'somobay_plans', 'member_plans', 'plan_payments', 'rosca_periods', 'joint_goal_expenses',
  'member_wallets', 'wallet_transactions', 'savings_withdrawals', 'qard_funds', 'qard_applications',
  'qard_loans', 'qard_repayments', 'notifications', 'promotions', 'app_settings', 'audit_logs',
  'member_actions', 'organizations', 'profiles', 'organization_members',
];

/* ---------------- ১. গার্ড স্তর (tenant.mjs) ---------------- */
S.sec('১ · Tenant guard — positive (নিজের সমবায়ে প্রবেশ)');
{
  const a = ctxFor('a_admin', ORG_A);
  const c = ctxFor('a_collector', ORG_A);
  const m = ctxFor('a_member', ORG_A);
  S.eq('A-অ্যাডমিনের সক্রিয় org = ORG_A', a.activeOrgId, ORG_A);
  S.eq('A-অ্যাডমিনের ভূমিকা = cooperative_admin', a.roleOf(ORG_A), 'cooperative_admin');
  S.check('A-কালেক্টর org A-তে প্রবেশ করতে পারে', assertOrgAccess(c, ORG_A, { minRole: 'collector', action: 'collect' }).granted);
  S.check('A-সদস্য org A-তে প্রবেশ করতে পারে', assertOrgAccess(m, ORG_A, { action: 'view' }).granted);
  S.check('A-অ্যাডমিন org A-তে admin কাজ করতে পারে', assertOrgAccess(a, ORG_A, { minRole: 'cooperative_admin', action: 'approve' }).granted);

  const two = ctxFor('two_org');
  S.eq('দুই সমবায়ের সদস্য → orgIds ২টি', two.orgIds.length, 2);
  S.eq('স্পষ্ট নির্দেশ ছাড়া activeOrgId নির্ধারিত হয় না (ambiguous)', two.activeOrgId, null);
  const orgs = makeEnv('CURRENT').db.organizations;
  S.eq('slug দিয়ে B resolve → ভূমিকা member', resolveRequestedOrg(two, 'uttaron', { knownOrgs: orgs }).role, 'member');
  S.eq('slug দিয়ে A resolve → orgId ORG_A', resolveRequestedOrg(two, 'adarsha', { knownOrgs: orgs }).orgId, ORG_A);
  S.eq('cooperative_code দিয়ে resolve কাজ করে', resolveRequestedOrg(two, 'UTTR-02', { knownOrgs: orgs }).orgId, ORG_B);

  const p = ctxFor('platform');
  S.eq('platform_admin যেকোনো org-তে প্রবেশ পায়', assertOrgAccess(p, ORG_B, { minRole: 'cooperative_admin' }).role, 'platform_admin');
}

S.sec('২ · Tenant guard — negative (অন্য সমবায়ে প্রবেশ বন্ধ)');
{
  const a = ctxFor('a_admin', ORG_A);
  const m = ctxFor('a_member', ORG_A);
  const c = ctxFor('a_collector', ORG_A);
  S.throwsWith('A-অ্যাডমিন org B-তে প্রবেশ করতে পারে না', () => assertOrgAccess(a, ORG_B), 'NOT_A_MEMBER');
  S.throwsWith('A-সদস্য org B-তে প্রবেশ করতে পারে না', () => assertOrgAccess(m, ORG_B), 'NOT_A_MEMBER');
  S.throwsWith('A-কালেক্টর org B-তে কিস্তি নিতে পারে না', () => assertOrgAccess(c, ORG_B, { minRole: 'collector' }), 'NOT_A_MEMBER');
  S.throwsWith('A-সদস্য admin কাজ করতে পারে না (নিজের org-তেও)', () => assertOrgAccess(m, ORG_A, { minRole: 'cooperative_admin' }), 'INSUFFICIENT_ROLE');
  S.throwsWith('A-কালেক্টর admin কাজ করতে পারে না', () => assertOrgAccess(c, ORG_A, { minRole: 'cooperative_admin' }), 'INSUFFICIENT_ROLE');

  // F-01 — বৈশ্বিক profiles.role='admin' দিয়ে আর অন্য সমবায়ে ঢোকা যায় না
  const g = ctxFor('global_admin');
  S.eq('বৈশ্বিক admin-এর কোনো membership নেই', g.orgIds.length, 0);
  S.throwsWith('F-01 বন্ধ: বৈশ্বিক admin org B-তে প্রবেশ করতে পারে না', () => assertOrgAccess(g, ORG_B), 'NOT_A_MEMBER');
  S.throwsWith('F-01 বন্ধ: বৈশ্বিক admin org A-তেও প্রবেশ করতে পারে না', () => assertOrgAccess(g, ORG_A), 'NOT_A_MEMBER');
  const orgs = makeEnv('CURRENT').db.organizations;
  // enumeration রোধ: "নেই" ও "সদস্য নন" → একই ত্রুটি কোড
  S.throwsWith('অজানা slug → ORG_ACCESS_DENIED', () => resolveRequestedOrg(g, 'onno-kothao', { knownOrgs: orgs }), 'ORG_ACCESS_DENIED');
  S.throwsWith('বিদ্যমান কিন্তু সদস্য নন → একই ORG_ACCESS_DENIED (পার্থক্য ফাঁস হয় না)', () => resolveRequestedOrg(g, 'uttaron', { knownOrgs: orgs }), 'ORG_ACCESS_DENIED');
  S.throwsWith('A-সদস্যও B slug চাইলে একই ত্রুটি পায়', () => resolveRequestedOrg(ctxFor('a_member', ORG_A), 'uttaron', { knownOrgs: orgs }), 'ORG_ACCESS_DENIED');

  // নিষিদ্ধ org id
  S.throwsWith('organization_id অনুপস্থিত → প্রত্যাখ্যান', () => assertOrgId(null), 'ORG_ID_MISSING');
  S.throwsWith('organization_id অবৈধ → প্রত্যাখ্যান', () => assertOrgId('org-a'), 'ORG_ID_INVALID');
  S.throwsWith('F-03 বন্ধ: হার্ডকোডেড ডিফল্ট org → প্রত্যাখ্যান', () => assertOrgId(FORBIDDEN_DEFAULT_ORG), 'ORG_ID_DEFAULT_FALLBACK');
  S.check('ডিফল্ট org ইচ্ছাকৃতভাবে (মাইগ্রেশন) অনুমোদিত হতে পারে', (() => { try { assertOrgId(FORBIDDEN_DEFAULT_ORG, { allowDefaultOrg: true }); return true; } catch { return false; } })());

  // সারি যাচাই
  const bad = validateTenantRow('savings_withdrawals', { organization_id: ORG_B, member_id: USERS.a_member.id }, a);
  S.check('A-context থেকে B-এর সারি লেখা প্রত্যাখ্যাত', !bad.ok && bad.problems.some((p) => /মিলছে না/.test(p.reason)));
  const nul = validateTenantRow('qard_applications', { organization_id: null, member_id: USERS.a_member.id }, a);
  S.check('organization_id=null সারি প্রত্যাখ্যাত (F-02 বন্ধ)', !nul.ok);
  const okRow = validateTenantRow('qard_applications', { organization_id: ORG_A, member_id: USERS.a_member.id }, a);
  S.check('সঠিক org-এর সারি গ্রহণযোগ্য', okRow.ok);
  const def = validateTenantRow('savings_withdrawals', { organization_id: FORBIDDEN_DEFAULT_ORG, member_id: USERS.a_member.id }, ctxFor('a_member', FORBIDDEN_DEFAULT_ORG));
  S.check('ডিফল্ট org-এ উত্তোলন লেখা প্রত্যাখ্যাত', !def.ok);
}

/* ---------------- ৩. বর্তমান নীতিতে ফাঁস (negative evidence) ---------------- */
S.sec('৩ · Source A-র বর্তমান RLS নীতিতে ফাঁস (প্রমাণ)');
{
  const env = makeEnv('CURRENT');
  const aMember = clientFor(env, 'a_member');
  const gAdmin = clientFor(env, 'global_admin');
  const leaks = [];
  const coMemberIds = new Set(
    env.db.organization_members
      .filter((m) => m.organization_id === ORG_A && m.status === 'active')
      .map((m) => m.user_id),
  );
  for (const t of ALL_TABLES) {
    const { data } = await aMember.from(t).select('*');
    const rows = data || [];
    let foreign;
    if (t === 'profiles') foreign = rows.filter((r) => r.id !== USERS.a_member.id && !coMemberIds.has(r.id));
    else if (t === 'organizations') foreign = rows.filter((r) => r.id !== ORG_A);
    else foreign = rows.filter((r) => r.organization_id && r.organization_id !== ORG_A);
    if (foreign.length) leaks.push({ table: t, foreign: foreign.length });
  }
  S.note('A-সদস্য যেসব টেবিলে অন্য সমবায়ের সারি দেখেছে: ' + leaks.map((l) => `${l.table}(${l.foreign})`).join(', '));
  S.check('বর্তমান নীতিতে cross-tenant পড়ার ফাঁস রয়েছে (প্রত্যাশিত — এটাই finding)', leaks.length >= 8);
  for (const t of ['profiles', 'somobay_plans', 'rosca_periods', 'joint_goal_expenses', 'wallet_transactions', 'qard_funds']) {
    S.check(`ফাঁস নিশ্চিত: ${t}`, leaks.some((l) => l.table === t), 'USING(true) নীতির কারণে');
  }
  const { data: allProfiles } = await aMember.from('profiles').select('*');
  S.eq('A-সদস্য সব org-এর প্রোফাইল (নাম+ফোন) দেখে', allProfiles.length, Object.keys(USERS).length);

  // বৈশ্বিক admin-এর cross-tenant WRITE
  const { error: wErr, count: wCount } = await gAdmin.from('somobay_plans').update({ name: 'হ্যাক করা স্কিম' }).eq('id', 'plan-b1');
  S.check('বর্তমান নীতিতে বৈশ্বিক admin অন্য org-এর স্কিম বদলাতে পারে (CRITICAL finding F-04)', !wErr || wCount > 0);
  const { error: pErr, count: pCount } = await gAdmin.from('plan_payments').update({ amount: 1 }).eq('organization_id', ORG_B);
  S.check('বর্তমান নীতিতে বৈশ্বিক admin অন্য org-এর পেমেন্ট বদলাতে পারে (CRITICAL)', !pErr || pCount > 0);
  const { count: maCount } = await gAdmin.from('member_actions').update({ action_type: 'tampered' }).eq('organization_id', ORG_B);
  S.check('member_actions-এ RLS নেই → ট্যাম্পারিং সম্ভব (F-08)', maCount > 0);
}

/* ---------------- ৪. প্রস্তাবিত নীতিতে isolation (positive + negative) ---------------- */
S.sec('৪ · প্রস্তাবিত (REMEDIATED) নীতি — isolation ম্যাট্রিক্স');
{
  const env = makeEnv('REMEDIATED');
  const actors = {
    a_admin: { own: [ORG_A], foreign: [ORG_B] },
    a_collector: { own: [ORG_A], foreign: [ORG_B] },
    a_member: { own: [ORG_A], foreign: [ORG_B] },
    b_admin: { own: [ORG_B], foreign: [ORG_A] },
    b_member: { own: [ORG_B], foreign: [ORG_A] },
    global_admin: { own: [], foreign: [ORG_A, ORG_B] },
  };

  let totalForeign = 0;
  for (const [key, spec] of Object.entries(actors)) {
    const client = clientFor(env, key);
    for (const t of ALL_TABLES) {
      const { data } = await client.from(t).select('*');
      const rows = data || [];
      const foreign = rows.filter((r) => {
        const oid = r.organization_id || (t === 'organizations' ? r.id : null);
        return oid && spec.foreign.includes(oid);
      });
      totalForeign += foreign.length;
      if (foreign.length) S.check(`${key} → ${t}: অন্য org-এর সারি ০`, false, `পাওয়া গেছে ${foreign.length}`);
    }
    // profiles: নিজের + সহ-সদস্য ছাড়া কেউ নয়
    const { data: prof } = await client.from('profiles').select('id');
    const ids = (prof || []).map((p) => p.id);
    const allowedIds = key === 'global_admin' ? [USERS[key].id] : [USERS[key].id];
    const coMembers = env.db.organization_members
      .filter((m) => m.user_id === USERS[key].id && m.status === 'active')
      .flatMap((m) => env.db.organization_members.filter((x) => x.organization_id === m.organization_id && x.status === 'active').map((x) => x.user_id));
    const okSet = new Set([...allowedIds, ...coMembers]);
    S.check(`${key}: profiles-এ কেবল নিজের+সহ-সদস্য দৃশ্যমান`, ids.every((i) => okSet.has(i)), ids.filter((i) => !okSet.has(i)).join(','));
  }
  S.eq('মোট cross-tenant সারি দৃশ্যমান (সব actor × সব টেবিল)', totalForeign, 0);

  // positive: নিজের org-এর ডেটা দৃশ্যমান
  const aAdmin = clientFor(env, 'a_admin');
  const bAdmin = clientFor(env, 'b_admin');
  S.eq('A-অ্যাডমিন A-এর স্কিম দেখে', (await aAdmin.from('somobay_plans').select('*')).data.length, 2);
  S.eq('B-অ্যাডমিন B-এর স্কিম দেখে', (await bAdmin.from('somobay_plans').select('*')).data.length, 1);
  S.eq('A-অ্যাডমিন A-এর QH তহবিল দেখে (১ সারি)', (await aAdmin.from('qard_funds').select('*').eq('organization_id', ORG_A)).data.length, 1);
  S.eq('B-অ্যাডমিনের QH তহবিল আলাদা (৯০০০০০ বরাদ্দ)', (await bAdmin.from('qard_funds').select('total_allocated').eq('organization_id', ORG_B)).data[0].total_allocated, 900000);

  const aMember = clientFor(env, 'a_member');
  S.eq('A-সদস্য নিজের QH আবেদন দেখে', (await aMember.from('qard_applications').select('*')).data.length, 1);
  S.eq('A-সদস্য নিজের কিস্তি দেখে', (await aMember.from('member_plans').select('*')).data.length, 1);
  S.eq('A-সদস্য অন্য org-এর আবেদন দেখে না', (await aMember.from('qard_applications').select('*').eq('organization_id', ORG_B)).data.length, 0);
  S.eq('A-সদস্য নিজের নোটিফিকেশন দেখে না (admin-এর)', (await aMember.from('notifications').select('*')).data.length, 0);

  // suspended সদস্য
  const suspended = buildTenantContext({ userId: 'u-suspended', memberships: [{ organization_id: ORG_A, user_id: 'u-suspended', role: 'member', status: 'suspended' }] });
  S.eq('suspended সদস্যের কোনো সক্রিয় org নেই', suspended.orgIds.length, 0);
  S.throwsWith('suspended সদস্য org A-তে প্রবেশ করতে পারে না', () => assertOrgAccess(suspended, ORG_A), 'NOT_A_MEMBER');
}

S.sec('৫ · প্রস্তাবিত নীতি — লেখার নিয়ন্ত্রণ (write control)');
{
  const env = makeEnv('REMEDIATED');
  const aMember = clientFor(env, 'a_member');
  const aCollector = clientFor(env, 'a_collector');
  const aAdmin = clientFor(env, 'a_admin');
  const gAdmin = clientFor(env, 'global_admin');
  const anon = clientFor(env, null);
  const platform = clientFor(env, 'platform');

  // positive
  await S.allowedAsync('A-সদস্য নিজের org-এ QH আবেদন জমা দিতে পারে',
    aMember.from('qard_applications').insert({ id: 'qa-new', organization_id: ORG_A, member_id: USERS.a_member.id, requested_amount: 5000, status: 'pending' }));
  await S.allowedAsync('A-কালেক্টর নিজের org-এ কিস্তি জমা নিতে পারে',
    aCollector.from('plan_payments').insert({ id: 'pp-new', organization_id: ORG_A, member_plan_id: 'mp-a1', amount: 1000, status: 'approved' }));
  await S.allowedAsync('A-অ্যাডমিন নিজের org-এর স্কিম সম্পাদনা করতে পারে',
    aAdmin.from('somobay_plans').update({ name: 'আপডেট স্কিম' }).eq('id', 'plan-a1'));
  {
    const { data } = await platform.from('somobay_plans').select('*').eq('organization_id', ORG_B);
    S.eq('platform_admin যেকোনো org-এর স্কিম পড়তে পারে', (data || []).length, 1);
  }

  // negative
  await S.deniedAsync('A-সদস্য B org-এর হয়ে আবেদন জমা দিতে পারে না',
    aMember.from('qard_applications').insert({ id: 'qa-x', organization_id: ORG_B, member_id: USERS.a_member.id, requested_amount: 5000 }));
  await S.deniedAsync('A-সদস্য অন্য সদস্যের হয়ে আবেদন জমা দিতে পারে না',
    aMember.from('qard_applications').insert({ id: 'qa-y', organization_id: ORG_A, member_id: USERS.a_collector.id, requested_amount: 5000 }));
  await S.deniedAsync('A-কালেক্টর B org-এ কিস্তি নিতে পারে না',
    aCollector.from('plan_payments').insert({ id: 'pp-x', organization_id: ORG_B, member_plan_id: 'mp-b1', amount: 1000 }));
  await S.deniedAsync('A-কালেক্টর স্কিম সম্পাদনা করতে পারে না (admin-only)',
    aCollector.from('somobay_plans').update({ name: 'অবৈধ' }).eq('id', 'plan-a1'));
  await S.deniedAsync('A-সদস্য স্কিম সম্পাদনা করতে পারে না',
    aMember.from('somobay_plans').update({ name: 'অবৈধ' }).eq('id', 'plan-a1'));
  await S.deniedAsync('A-অ্যাডমিন B org-এর স্কিম সম্পাদনা করতে পারে না',
    aAdmin.from('somobay_plans').update({ name: 'অবৈধ' }).eq('id', 'plan-b1'));
  await S.deniedAsync('বৈশ্বিক admin কোনো স্কিম বদলাতে পারে না (F-04 বন্ধ)',
    gAdmin.from('somobay_plans').update({ name: 'অবৈধ' }).eq('id', 'plan-b1'));
  await S.deniedAsync('বৈশ্বিক admin কোনো পেমেন্ট বদলাতে পারে না',
    gAdmin.from('plan_payments').update({ amount: 1 }).eq('organization_id', ORG_A));
  const gProf = await gAdmin.from('profiles').select('*');
  S.check('বৈশ্বিক admin অন্য ব্যবহারকারীর প্রোফাইল পড়তে পারে না',
    (gProf.data || []).filter((p) => p.id !== USERS.global_admin.id).length === 0,
    (gProf.data || []).map((p) => p.id).join(','));
  const anonSel = await anon.from('somobay_plans').select('*');
  S.check('anonymous (লগইন ছাড়া) কোনো স্কিম পড়তে পারে না', (anonSel.data || []).length === 0);
  await S.deniedAsync('anonymous লিখতে পারে না',
    anon.from('plan_payments').insert({ id: 'pp-z', organization_id: ORG_A, amount: 1 }));
  await S.deniedAsync('অডিট লগ সম্পাদনা অসম্ভব (immutability)',
    aAdmin.from('audit_logs').update({ action: 'tampered' }).eq('id', 'al-a'));
  await S.deniedAsync('member_actions ট্যাম্পারিং অসম্ভব (F-08 বন্ধ)',
    aAdmin.from('member_actions').update({ action_type: 'tampered' }).eq('id', 'ma-a'));
  await S.deniedAsync('A-সদস্য payment মুছে ফেলতে পারে না (audit trail)',
    aMember.from('plan_payments').eq('id', 'pp-a1').delete());
  await S.deniedAsync('A-অ্যাডমিনও payment মুছে ফেলতে পারে না',
    aAdmin.from('plan_payments').eq('id', 'pp-a1').delete());
  S.eq('পেমেন্ট সারি এখনো অক্ষত (hard delete হয়নি)', env.db.plan_payments.filter((p) => p.id === 'pp-a1').length, 1);
}

S.sec('৬ · নোটিফিকেশন অডিয়েন্স (F-02 বন্ধ)');
{
  const env = makeEnv('REMEDIATED');
  const ctxA = ctxFor('a_admin', ORG_A);
  const client = clientFor(env, 'a_admin');
  const { data } = await orgAudience(client.from('organization_members'), ctxA, { roles: ['cooperative_admin', 'collector'] });
  const ids = (data || []).map((r) => r.user_id).sort();
  S.eq('A-এর আবেদনের নোটিশ কেবল A-এর admin+collector পায়', ids, [USERS.a_admin.id, USERS.a_collector.id].sort());
  S.check('B-এর কেউ অডিয়েন্সে নেই', !ids.includes(USERS.b_admin.id));

  // orgId ছাড়া নোটিফিকেশন লেখা যাবে না
  await S.deniedAsync('organization_id=null নোটিফিকেশন প্রত্যাখ্যাত',
    client.from('notifications').insert({ id: 'n-null', organization_id: null, user_id: USERS.a_admin.id, title: 'x' }));
  await S.allowedAsync('সঠিক org-সহ নোটিফিকেশন গ্রহণযোগ্য',
    client.from('notifications').insert({ id: 'n-ok', organization_id: ORG_A, user_id: USERS.a_admin.id, title: 'নতুন কর্জে হাসানা আবেদন' }));
}

S.sec('৭ · রিপোর্ট/এক্সপোর্ট স্কোপিং');
{
  const env = makeEnv('REMEDIATED');
  const ctxA = ctxFor('a_admin', ORG_A);
  const all = env.db.plan_payments;
  S.eq('scopedRows() শুধু A-এর সারি রাখে', scopedRows(all, ctxA).length, 1);
  S.eq('scopedRows() B-এর সারি বাদ দেয়', scopedRows(all, ctxA).every((r) => r.organization_id === ORG_A), true);
  const client = clientFor(env, 'a_admin');
  const q = scopeQuery(client.from('plan_payments').select('*'), ctxA);
  S.eq('scopeQuery() প্রয়োগ করা query শুধু A-এর সারি দেয়', (await q).data.length, 1);
  const ctxTwo = ctxFor('two_org');
  S.throwsWith('সক্রিয় org ছাড়া scopeQuery প্রত্যাখ্যাত', () => scopeQuery(client.from('plan_payments').select('*'), ctxTwo), 'NO_ACTIVE_ORG');
}

S.sec('৮ · লাইভ মোড (Supabase staging)');
{
  const live = process.argv.includes('--live');
  const hasEnv = Boolean(process.env.SOMOBAY_TEST_ORG_A && process.env.SOMOBAY_TEST_ORG_B);
  if (!live) {
    S.note('লাইভ টেস্ট স্কিপ করা হয়েছে (--live দেওয়া হয়নি)। একই চেক ম্যাট্রিক্স tests/d02-live-checklist.md-এ Supabase staging-এর জন্য লেখা আছে।');
    S.check('অফলাইন হার্নেস সম্পন্ন (লাইভ স্টেজ অপেক্ষমাণ)', true);
  } else if (!hasEnv) {
    S.check('--live দেওয়া হয়েছে কিন্তু SOMOBAY_TEST_ORG_A/B env সেট নেই', false, 'env সেট করুন (production মান নয়)');
  } else {
    const { createClient } = await import('@supabase/supabase-js');
    const url = process.env.VITE_SUPABASE_URL;
    const anon = process.env.VITE_SUPABASE_ANON_KEY;
    S.check('লাইভ মোডে URL+anon key আছে', Boolean(url && anon), 'VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY দরকার');
    if (url && anon) {
      for (const [label, org] of [['A', process.env.SOMOBAY_TEST_ORG_A], ['B', process.env.SOMOBAY_TEST_ORG_B]]) {
        const token = process.env[`SOMOBAY_TEST_USER_${label}_TOKEN`];
        const c = createClient(url, anon);
        if (token) await c.auth.setSession({ access_token: token, refresh_token: token });
        const { data } = await c.from('somobay_plans').select('id, organization_id').limit(1000);
        const foreign = (data || []).filter((r) => r.organization_id !== org);
        S.check(`লাইভ: org ${label}-এর সেশনে অন্য org-এর স্কিম দৃশ্যমান নয়`, foreign.length === 0, `${foreign.length} সারি ফাঁস`);
      }
    }
  }
}

S.report();
