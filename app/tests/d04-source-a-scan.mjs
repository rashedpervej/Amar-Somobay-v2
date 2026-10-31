/* ============================================================
   tests/d04-source-a-scan.mjs
   ১) Source A (amar-somobay-v2) baseline স্ক্যান — কী কী ঝুঁকি ছিল তার প্রমাণ
   ২) প্যাচ প্রয়োগের পর সেই ঝুঁকি সত্যিই গেছে কিনা যাচাই
   ৩) app/db/*.sql ফাইলগুলোর নিরাপত্তা-শৃঙ্খলা যাচাই:
        • AUDIT ফাইলে শুধু SELECT থাকতে হবে
        • MIGRATION/REMEDIATION ফাইলে destructive statement থাকতে পারবে না
   ============================================================ */

import { createSuite } from './_harness.mjs';
import { scanSourceTree } from '../src/lib/noInterestScan.mjs';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const WORKSPACE = join(ROOT, '..');
// পরিবেশ-চলক দিয়ে উৎস বদলানো যায় (tools/verify-patch.sh এটি ব্যবহার করে)
const REF = process.env.SOURCE_A_ROOT || join(WORKSPACE, 'reference', 'amar-somobay-v2');
const PATCHED_CANDIDATES = process.env.PATCHED_ROOT
  ? [process.env.PATCHED_ROOT]
  : ['/tmp/tspatched', '/tmp/somobay-patched'];
const S = createSuite('D-04 · Source A স্ক্যান + প্যাচ যাচাই + SQL শৃঙ্খলা');

const read = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : '');
const patchedRoot = PATCHED_CANDIDATES.find((p) => existsSync(join(p, 'src')));

/* ---------- ১. D-02 ঝুঁকিপূর্ণ কোড প্যাটার্ন ---------- */
const D02_PATTERNS = [
  { id: 'P1', label: 'হার্ডকোডেড ডিফল্ট সমবায় UUID (অন্য tenant-এ ফলব্যাক)', re: /00000000-0000-0000-0000-000000000001/ },
  { id: 'P2', label: 'বৈশ্বিক profiles.role দিয়ে tenant অ্যাক্সেস (TenantGuard)', re: /currentProfile\?\.role === 'admin'/ },
  { id: 'P3', label: 'সব সমবায়ের admin-কে নোটিশ (profiles.role = admin ফলব্যাক)', re: /from\('profiles'\)\.select\('id'\)\.eq\('role',\s*'admin'\)/ },
  { id: 'P4', label: 'organization_id: orgId || null (tenant ছাড়া সারি)', re: /organization_id:\s*orgId\s*\|\|\s*null/ },
  { id: 'P5', label: 'qard_funds স্কোপ ছাড়া একক সারি পড়া', re: /from\('qard_funds'\)\.select\([^)]*\)\.limit\(1\)/ },
  { id: 'P6', label: 'সদস্য তালিকা বৈশ্বিক role দিয়ে (tenant স্কোপ নেই)', re: /from\('profiles'\)[\s\S]{0,120}?\.eq\('role',\s*'member'\)/ },
  { id: 'P7', label: 'বৈশ্বিক admin ভূমিকা অনুমান (cooperative_admin ফলব্যাক)', re: /currentProfile\?\.role === 'admin' \? 'cooperative_admin'/ },
];

function scanPatterns(root) {
  const hits = [];
  for (const p of D02_PATTERNS) {
    for (const f of ['src/components/CooperativeTenantGuard.tsx', 'src/lib/qardHasanahService.ts',
                     'src/lib/withdrawalService.ts', 'src/components/QuickCollectModal.tsx',
                     'src/pages/qard/AdminQardHasanah.tsx', 'src/store/useSomobayStore.ts',
                     'src/lib/generalSavingsService.ts', 'src/lib/roscaService.ts',
                     'src/pages/AdminReports.tsx', 'src/pages/AdminPendingPayments.tsx']) {
      const text = read(join(root, f));
      if (!text) continue;
      const m = text.match(p.re);
      if (m) hits.push({ id: p.id, label: p.label, file: f, sample: m[0].replace(/\s+/g, ' ').slice(0, 90) });
    }
  }
  return hits;
}

S.sec('১ · Source A baseline (পরিবর্তনের আগে)');
if (!existsSync(REF)) {
  S.note('reference/amar-somobay-v2 পাওয়া যায়নি — Source A স্ক্যান স্কিপ');
  S.check('reference ট্রি উপস্থিত', false);
} else {
  const base = scanSourceTree(join(REF, 'src'), { exts: ['.ts', '.tsx'] });
  const baseErr = base.filter((f) => f.severity === 'error');
  S.check('D-01 লঙ্ঘন baseline-এ আছে (প্রমাণ)', baseErr.length > 0, `মোট ${baseErr.length}`);
  S.note(`baseline D-01: field=${baseErr.filter((f) => f.kind === 'field').length} copy=${baseErr.filter((f) => f.kind === 'copy').length}`);
  const baseP = scanPatterns(REF);
  S.check('D-02 ঝুঁকিপূর্ণ প্যাটার্ন baseline-এ আছে (প্রমাণ)', baseP.length > 0, `মোট ${baseP.length}`);
  baseP.forEach((h) => S.note(`  ${h.id} · ${h.file} → ${h.sample}`));
  S.check('P1 (ডিফল্ট org ফলব্যাক) baseline-এ আছে', baseP.some((h) => h.id === 'P1'));
  S.check('P2 (বৈশ্বিক admin bypass) baseline-এ আছে', baseP.some((h) => h.id === 'P2'));
  S.check('P3 (cross-org নোটিফিকেশন) baseline-এ আছে', baseP.some((h) => h.id === 'P3'));
  S.check('P5 (qard_funds আনস্কোপড) baseline-এ আছে', baseP.some((h) => h.id === 'P5'));
}

S.sec('২ · প্যাচ প্রয়োগের পর (Source A + patches/)');
if (!patchedRoot) {
  S.note('প্যাচড ট্রি পাওয়া যায়নি। তৈরি করুন: python3 app/tools/make-patches.py  (অথবা tools/verify-patch.sh)');
  S.check('প্যাচড ট্রি উপস্থিত', false);
} else {
  S.note(`প্যাচড ট্রি: ${patchedRoot}`);
  const after = scanSourceTree(join(patchedRoot, 'src'), { exts: ['.ts', '.tsx'] });
  const afterErr = after.filter((f) => f.severity === 'error');
  S.eq('D-01: প্যাচের পর Source A-তে error ০', afterErr.length, 0);
  afterErr.slice(0, 10).forEach((e) => S.note(`${e.file}:${e.line} [${e.term}] ${e.text}`));

  const afterP = scanPatterns(patchedRoot);
  S.eq('D-02: প্যাচের পর ঝুঁকিপূর্ণ প্যাটার্ন ০', afterP.length, 0);
  afterP.forEach((h) => S.note(`${h.id} · ${h.file} → ${h.sample}`));

  // গার্ড কোড সত্যিই যোগ হয়েছে কিনা
  const guard = read(join(patchedRoot, 'src/lib/qardHasanahService.ts'));
  S.check('QH তহবিল এখন organization_id দিয়ে স্কোপড', /eq\('organization_id',\s*(organizationId|fundOrgId)\)/.test(guard));
  S.check('QH নোটিফিকেশনে cross-org ফলব্যাক নেই', !/from\('profiles'\)\.select\('id'\)\.eq\('role',\s*'admin'\)/.test(guard));
  const store = read(join(patchedRoot, 'src/store/useSomobayStore.ts'));
  S.check('স্কিম সম্পাদনাতেও শূন্য-লক প্রয়োগ হয়', /updatePlan[\s\S]{0,600}profit_percentage: 0/.test(store));
  const wd = read(join(patchedRoot, 'src/lib/withdrawalService.ts'));
  S.check('উত্তোলনে orgId না পেলে থেমে যায়', /if \(!orgId\) throw new Error/.test(wd));
  const qcm = read(join(patchedRoot, 'src/components/QuickCollectModal.tsx'));
  S.check('কিস্তি আদায়ে সদস্য তালিকা tenant-স্কোপড', /from\('organization_members'\)[\s\S]{0,200}eq\('organization_id', listOrgId\)/.test(qcm));
  const tg = read(join(patchedRoot, 'src/components/CooperativeTenantGuard.tsx'));
  S.check('TenantGuard-এ বৈশ্বিক admin bypass নেই', !/currentProfile\?\.role === 'admin'/.test(tg));
  S.check('D-01/D-02 মন্তব্য কোডে নথিভুক্ত', (guard + store + wd + qcm + tg).split('D-0').length - 1 >= 8);
}

S.sec('৩ · patches/ ফাইল দুটির গঠন');
{
  const dir = process.env.PATCH_DIR || join(WORKSPACE, 'patches');
  for (const f of ['0001-D01-zero-interest.patch', '0002-D02-tenant-isolation.patch']) {
    const text = read(join(dir, f));
    S.check(`${f} উপস্থিত`, text.length > 500);
    if (!text) continue;
    S.check(`${f}: -p1 উপযোগী a/ b/ পাথ`, /^diff --git a\/src\//m.test(text));
    S.check(`${f}: কোনো absolute পাথ নেই`, !/tmp\/patchwork/.test(text));
    S.check(`${f}: DB migration মিশে যায়নি`, !/ALTER TABLE|CREATE POLICY|DROP POLICY/i.test(text));
    S.check(`${f}: প্রয়োগ নির্দেশিকা আছে`, /git apply -p1/.test(text));
    const files = [...text.matchAll(/^diff --git a\/(\S+)/gm)].map((m) => m[1]);
    S.note(`${f} → ${files.length} ফাইল: ${files.join(', ')}`);
    S.check(`${f}: শুধু src/ ফাইল বদলেছে`, files.every((x) => x.startsWith('src/')));
  }
}

S.sec('৪ · SQL শৃঙ্খলা — AUDIT ফাইল সত্যিই শুধু পড়ে');
{
  const audits = [
    join(ROOT, 'db', 'D01_zero_interest__AUDIT_ONLY.sql'),
    join(ROOT, 'db', 'D02_tenant_isolation__AUDIT_ONLY.sql'),
  ];
  for (const f of audits) {
    const text = read(f);
    if (!text) { S.check(`${f} উপস্থিত`, false); continue; }
    // কমেন্ট বাদে বাকি লাইনে লেখার কোনো statement থাকা যাবে না
    const code = text.split('\n')
      .filter((l) => !/^\s*--/.test(l))
      .join('\n')
      .replace(/--.*$/gm, '');
    const forbidden = /\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|GRANT|REVOKE|DO)\b/i;
    const hits = [...code.matchAll(new RegExp(forbidden.source, 'gi'))].map((m) => m[0]);
    S.eq(`AUDIT ফাইলে লেখার statement নেই (${f.split('/').pop()})`, hits.length, 0);
    if (hits.length) S.note([...new Set(hits)].join(', '));
    S.check(`${f.split('/').pop()}: SELECT আছে`, /SELECT/i.test(code));
  }
}

S.sec('৫ · SQL শৃঙ্খলা — MIGRATION/REMEDIATION destructive নয়');
{
  const drafts = [
    join(ROOT, 'db', 'D01_zero_interest__MIGRATION_DRAFT.sql'),
    join(ROOT, 'db', 'D02_tenant_isolation__REMEDIATION_DRAFT.sql'),
  ];
  for (const f of drafts) {
    const text = read(f);
    const name = f.split('/').pop();
    if (!text) { S.check(`${name} উপস্থিত`, false); continue; }
    const codeLines = text.split('\n').filter((l) => !/^\s*--/.test(l));
    const code = codeLines.join('\n');

    const destructive = code.match(/\b(DROP\s+TABLE|DROP\s+COLUMN|TRUNCATE|DELETE\s+FROM)\b/gi) || [];
    S.eq(`${name}: destructive statement নেই (DROP TABLE/COLUMN, TRUNCATE, DELETE)`, destructive.length, 0);
    if (destructive.length) S.note([...new Set(destructive)].join(', '));

    const updates = codeLines.filter((l) => /\bUPDATE\s+(public\.|format)/i.test(l));  // শুধু DML; ট্রিগার/নীতির শব্দ নয়
    if (updates.length) {
      S.check(`${name}: UPDATE কেবল ফ্ল্যাগ-গার্ডেড ব্যাকফিলে`, /allow_single_org_backfill\s+boolean\s*:=\s*false/.test(text));
      S.eq(`${name}: UPDATE লাইন সংখ্যা (১টির বেশি নয়)`, updates.length, 1);
      updates.forEach((u) => S.note('UPDATE → ' + u.trim().slice(0, 110)));
    } else {
      S.check(`${name}: কোনো UPDATE নেই (বিদ্যমান ডেটা অক্ষত)`, true);
    }

    S.check(`${name}: ON_ERROR_STOP সেট`, /\\set\s+ON_ERROR_STOP\s+on/.test(text));
    S.check(`${name}: অনুমোদন-সাপেক্ষ সতর্কবার্তা আছে`, /অনুমোদন ছাড়া/.test(text));
    S.check(`${name}: রোলব্যাক অনুচ্ছেদ আছে`, /রোলব্যাক/i.test(text));
    S.check(`${name}: যাচাই কুয়েরি আছে`, /যাচাই/.test(text));
  }

  const rem = read(join(ROOT, 'db', 'D02_tenant_isolation__REMEDIATION_DRAFT.sql'));
  if (rem) {
    S.check('REMEDIATION: USING(true) নীতি বাতিল করা হয়েছে', (rem.match(/DROP POLICY IF EXISTS/g) || []).length >= 25);
    S.check('REMEDIATION: member_actions-এ RLS যোগ হয়েছে', /member_actions ENABLE ROW LEVEL SECURITY/.test(rem));
    S.check('REMEDIATION: অডিট লগ অপরিবর্তনীয় (UPDATE/DELETE নীতি নেই)', !/audit_logs[\s\S]{0,400}FOR UPDATE/.test(rem));
    S.check('REMEDIATION: helper ফাংশনে search_path সেট', (rem.match(/SET search_path = public, pg_temp/g) || []).length >= 6);
    S.check('REMEDIATION: DOWN মাইগ্রেশনের বিরুদ্ধে সতর্কবার্তা', /MULTI_TENANT_FOUNDATION_DOWN/.test(rem));
    S.check('REMEDIATION: organization_id বাধ্যতামূলক ট্রিগার', /require_tenant_org/.test(rem));
  }
  const mig = read(join(ROOT, 'db', 'D01_zero_interest__MIGRATION_DRAFT.sql'));
  if (mig) {
    S.check('MIGRATION: কলাম DROP করা হয় না', !/DROP\s+COLUMN/i.test(mig));
    S.check('MIGRATION: প্রিফ্লাইটে বিদ্যমান ডেটা পরীক্ষা', /প্রিফ্লাইট/.test(mig) && /RAISE EXCEPTION/.test(mig));
    S.check('MIGRATION: CHECK NOT VALID → VALIDATE পদ্ধতি', /NOT VALID/.test(mig) && /VALIDATE CONSTRAINT/.test(mig));
    S.check('MIGRATION: বিলম্ব ফি স্পর্শ করা হয়নি', !/late_fee_amount|pending_fine|penalty_paid/.test(mig.replace(/--[^\n]*/g, '')));
    S.check('MIGRATION: অডিট লগে প্রচেষ্টা নথিভুক্ত হয়', /policy\.zero_interest\.enforced/.test(mig));
  }
}

S.report();
