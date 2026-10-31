/* ============================================================
   tests/d11-admin-mobile.mjs — ব্যাচ ৪ · অ্যাডমিন মোবাইল (AM-01…AM-20)
   ১) ২০টি ফাইল, ১৯+ রুট, AdminProvider সংযোগ
   ২) ডোমেইন-গণিত: availOf / dueTotal / cashDiff / claimMissing / transferTotal
   ৩) নীতি: সুদমুক্ত কপি, maker≠checker, D-22 সীমা, অনিশ্চিত পেমেন্ট
   ৪) ফর্ম-বৈধতা ও মৃত বোতাম নেই
   ৫) ডিজাইন শৃঙ্খলা + ৭১ রুটের রেন্ডার স্মোক
   ============================================================ */

import { createSuite } from './_harness.mjs';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const S = createSuite('D-11 · অ্যাডমিন মোবাইল পর্দা (AM-01…AM-20)');
const read = (p) => (existsSync(join(ROOT, p)) ? readFileSync(join(ROOT, p), 'utf8') : '');

const APP = read('src/apps/admin/AdminMobileApp.tsx');
const MAIN = read('src/main.tsx');
const STORE = read('src/store/adminStore.tsx');
const DIR = 'src/apps/admin/screens';
const FILES = readdirSync(join(ROOT, DIR)).filter((f) => f.endsWith('.tsx') && f !== 'parts.tsx');
const txt = (f) => read(`${DIR}/${f}.tsx`);

const SCREENS = {
  'AdminHome.tsx': ['home', 'সমিতির অবস্থা'],
  'Approvals.tsx': ['approvals', 'অনুমোদন কিউ'],
  'ApplicationReview.tsx': ['approvals/:id/review', 'আবেদন'],
  'ApprovalDecision.tsx': ['approvals/:id', 'অনুমোদনের সিদ্ধান্ত'],
  'Members.tsx': ['members', 'সদস্য খুঁজুন'],
  'Member360.tsx': ['members/:memberId', 'মোট সঞ্চয়'],
  'MemberRegister.tsx': ['members/new', 'নতুন সদস্য নিবন্ধন'],
  'MemberEdit.tsx': ['members/:memberId/edit', 'সদস্য সম্পাদনা'],
  'MemberStatus.tsx': ['members/:memberId/status', 'অবস্থা পরিবর্তন'],
  'QuickEntry.tsx': ['entry', 'জমা এন্ট্রি'],
  'AccountLedger.tsx': ['accounts/:accountId', 'জমা হয়েছে (posted)'],
  'CloseSettlement.tsx': ['members/:memberId/close', 'প্রস্থান ও নিষ্পত্তি'],
  'Dues.tsx': ['dues', 'বকেয়া রেজিস্টার'],
  'TxnForensics.tsx': ['txn/:txnId', 'Who · When · Where'],
  'Reversal.tsx': ['reversal', 'সংশোধন ও রিভার্সাল'],
  'CashBook.tsx': ['cashbook', 'দিনশেষ ক্যাশ বুক'],
  'Payouts.tsx': ['payouts', 'নিষ্পত্তি ও পেমেন্ট'],
  'LedgerAdmin.tsx': ['ledger', 'সাধারণ লেজার'],
  'DeathClaim.tsx': ['claims', 'মৃত্যু দাবি নিষ্পত্তি'],
  'FundTransfer.tsx': ['transfer', 'তহবিল স্থানান্তর'],
  'Reconciliation.tsx': ['recon', 'রিকনসিলিয়েশন'],
  'BulkBatches.tsx': ['batch', 'বাল্ক জমা এন্ট্রি'],
  'ImportCsv.tsx': ['import', 'CSV / Excel ইমপোর্ট'],
  'Finance.tsx': ['finance', 'আর্থিক বিবরণ'],
  'ReportCenter.tsx': ['reports', 'রিপোর্ট কেন্দ্র'],
  'Schemes.tsx': ['schemes', 'স্কিম তালিকা'],
  'SchemeDetail.tsx': ['schemes/:schemeId', 'স্কিম বিবরণ'],
  'SchemeNew.tsx': ['schemes/new', 'নতুন স্কিম তৈরি'],
  'SchemeEdit.tsx': ['schemes/:schemeId/edit', 'স্কিম সম্পাদনা'],
  'MemberMove.tsx': ['moves', 'সদস্য স্থানান্তর'],
  'RoutePlan.tsx': ['routes', 'সংগ্রহ পরিকল্পনা'],
  'Reminders.tsx': ['reminders', 'রিমাইন্ডার শিডিউল'],
  'Settings.tsx': ['settings', 'সেটিংস হাব'],
  'Staff.tsx': ['staff', 'স্টাফ ও পারমিশন'],
  'AuditLog.tsx': ['audit', 'অডিট লগ'],
  'AdminMore.tsx': ['more', 'সব বিভাগ'],
};

S.sec('১ · ফাইল, রুট ও প্রোভাইডার (AM-01…AM-35)');
{
  S.eq('অ্যাডমিন পর্দার সংখ্যা ৩৬ (AM-01…AM-35 + আরও, + parts)', FILES.length, 36);
  S.check('প্রতিটি ফাইলের রুট আছে', Object.keys(SCREENS).every((f) => existsSync(join(ROOT, `${DIR}/${f}`))), Object.keys(SCREENS).filter((f) => !existsSync(join(ROOT, `${DIR}/${f}`))).join(', '));
  const noRoute = Object.entries(SCREENS).filter(([, [p]]) => !APP.includes(`path="${p}"`));
  S.check('AdminMobileApp-এ প্রতিটি রুট মাউন্টেড', noRoute.length === 0, noRoute.map(([f]) => f).join(', '));
  S.check('/a/* → AdminProvider + AdminMobileApp', /<AdminProvider>\s*<AdminMobileApp \/>\s*<\/AdminProvider>/.test(MAIN));
  S.check('ভূমিকা ?role= থেকে (ডিফল্ট MANAGER)', /resolveAdminShell\(params\.get\('role'\)\)/.test(APP));
  S.check('কোনো AM পর্দায় "ফেজ ৩" প্লেসহোল্ডার নেই', FILES.every((f) => !/ফেজ ৩|শীঘ্রই আসছে|Coming soon/.test(txt(f.replace('.tsx', '')))));
  S.check('প্রতিটি পর্দায় ব্যবহারকারীর জন্য শিরোনাম আছে', FILES.every((f) => /text-h2|text-h3|text-h1|<Card[^>]*title=|<SectionHead[^>]*title=|<Hero[^>]*label=/.test(txt(f.replace('.tsx', '')))));
}

S.sec('২ · স্টোর ও ডোমেইন-গণিত');
{
  const actions = ['decide', 'addDeposit', 'registerMember', 'reviewApplication', 'saveMemberChange', 'closeAccount', 'reverseTxn', 'closeCashDay', 'payPayout', 'changeStatus', 'settleClaim', 'transferFunds'];
  S.check('১২টি অ্যাকশনই ডিফাইনড', actions.every((a) => new RegExp(`const ${a}: Ctx\\['${a}'\\]`).test(STORE)));
  S.check('সিড ডেটা স্টোরে যুক্ত', /SEED_MEMBERS/.test(STORE) && /SEED_APPROVALS/.test(STORE) && /SEED_TXNS/.test(STORE));
  S.check('অনুমোদনের পরে কিউ থেকে বাদ যায়', /approvals: s\.approvals\.filter\(\(a\) => a\.id !== id\)/.test(STORE));
  S.check('রিভার্সালে মূল এন্ট্রি থাকে (মোছে না)', /status: 'reversed'/.test(STORE) && /amount: -txn\.amount/.test(STORE));
  S.check('সদস্য বন্ধ হলে Exited হয়', /status: 'exited'/.test(STORE));
  S.check('নিষ্পত্তিতে বকেয়া থাকলে মওকুফ নম্বর বাধ্যতামূলক', /মওকুফ নম্বর ছাড়া নিষ্পত্তি হবে না/.test(STORE));
  S.check('দিনশেষে পার্থক্যের কারণ বাধ্যতামূলক', /পার্থক্যের কারণ লেখা বাধ্যতামূলক/.test(STORE));
  S.check('সীমার বাইরে অনুমোদন আটকায় (D-22)', /অনুমোদন সীমা ছাড়িয়েছে/.test(STORE));

  const outDir = join(ROOT, 'node_modules/.cache/dt');
  const b = spawnSync(join(ROOT, 'node_modules/.bin/esbuild'), ['src/domain/admin.ts', '--format=esm', '--outdir=node_modules/.cache/dt', '--log-level=warning'], { cwd: ROOT, encoding: 'utf8' });
  S.check('ডোমেইন বান্ডল হয়েছে', b.status === 0, (b.stderr || '').slice(0, 200));
  const A = await import(`${outDir}/admin.js`);
  const acc = A.SEED_ACCOUNTS[0];
  S.check('availOf = posted − hold − min − locked', A.availOf(acc) === Math.max(0, acc.posted - acc.hold - acc.minBal - acc.locked));
  S.check('availOf কখনো ঋণাত্মক নয়', A.SEED_ACCOUNTS.every((a) => A.availOf(a) >= 0));
  const m1Due = A.SEED_DUES.filter((d) => d.memberId === 'm1').reduce((s, d) => s + (d.amount - d.paid), 0);
  S.check('dueTotal সদস্যের বকেয়া যোগফল', A.dueTotal(A.SEED_DUES, 'm1') === m1Due);
  S.check('cashDiff = counted − declared', A.cashDiff(A.SEED_CASH_DAYS[0]) === A.SEED_CASH_DAYS[0].counted - A.SEED_CASH_DAYS[0].declared);
  S.check('claimMissing শুধু অসম্পূর্ণ প্রমাণ', A.claimMissing(A.SEED_CLAIMS[0]).every((d) => !d.ok) && A.claimMissing(A.SEED_CLAIMS[0]).length === A.SEED_CLAIMS[0].docs.filter((d) => !d.ok).length);
  S.check('transferTotal = amount + fee', A.transferTotal(A.SEED_TRANSFERS[0]) === A.SEED_TRANSFERS[0].amount + A.SEED_TRANSFERS[0].fee);
  S.check('অনুমোদন তালিকা ধরন অনুযায়ী ফিল্টার হয়', A.approvalsOf(A.SEED_APPROVALS, 'withdrawal').every((a) => a.kind === 'withdrawal'));
  S.check('সব অ্যাকাউন্টের সদস্য আছে', A.SEED_ACCOUNTS.every((a) => Boolean(A.memberById(A.SEED_MEMBERS, a.memberId))));
  S.check('সব বকেয়ার অ্যাকাউন্ট আছে', A.SEED_DUES.every((d) => Boolean(A.accountById(A.SEED_ACCOUNTS, d.accId))));
  S.check('সব লেনদেনের ব্যালেন্স ধনাত্মক', A.SEED_TXNS.every((t) => t.balanceAfter >= 0));
}

S.sec('৩ · নীতি ও সততা');
{
  const all = Object.keys(SCREENS).map((f) => txt(f.replace('.tsx', ''))).join('\n');
  S.check('কোনো profit_percentage/interest_rate নেই', !/profit_percentage|interest_rate|dividend_rate/.test(all));
  const sus = all.split('\n').filter((l) => /সুদ|মুনাফা/.test(l) && !/০|নেই|নয়|শূন্য|সুদমুক্ত|D-01|যোগ হয় না|গ্রহণ/.test(l));
  S.check('সুদ/মুনাফা শুধু শূন্য-ঘোষণা প্রসঙ্গে', sus.length === 0, sus.slice(0, 3).join(' | '));
  S.check('maker ≠ checker নীতি লেখা আছে', /maker ≠ checker/.test(txt('Approvals')) && /maker ≠ checker/.test(txt('ApprovalDecision')));
  S.check('D-22 অনুমোদন সীমা দেখানো হয়', /D-22/.test(txt('Approvals')) && /সীমার বাইরে/.test(txt('Approvals')));
  S.check('অনিশ্চিত পেমেন্ট = Unknown (D-27)', /Unknown/.test(txt('Payouts')) && /অনিশ্চিত/.test(txt('FundTransfer')));
  S.check('মৃত্যু দাবিতে একা সিদ্ধান্ত নয়', /একা সিদ্ধান্ত নেওয়া যাবে না|কমিটি/.test(txt('DeathClaim')));
  S.check('বকেয়ায় নির্দিষ্ট ফি — সুদ নয়', /কোনো সুদ বা মুনাফা নয়/.test(txt('Dues')));
  S.check('সব পর্দায় ডেমো চিহ্ন', ['AdminHome', 'Members', 'QuickEntry', 'CashBook', 'FundTransfer'].every((f) => /ডেমো/.test(txt(f))));
  S.check('BR-15 চূড়ান্ত নিষ্পত্তি ঘোষণা', /BR-15/.test(txt('CloseSettlement')));
}

S.sec('৪ · কার্যকারিতা ও ফর্ম-বৈধতা');
{
  const dead = [];
  for (const f of FILES) {
    const src = txt(f.replace('.tsx', ''));
    for (const m of src.matchAll(/<button\b[^>]*>/gs)) {
      if (!/onClick=|type="submit"/.test(m[0])) dead.push(`${f}: ${m[0].slice(0, 50)}`);
    }
  }
  S.check('কোনো মৃত <button> নেই', dead.length === 0, dead.slice(0, 4).join(' | '));

  const usesStore = FILES.filter((f) => /useAdmin\(\)/.test(txt(f.replace('.tsx', ''))));
  S.check('প্রায় সব পর্দা useAdmin স্টোর ব্যবহার করে', usesStore.length >= 17, `${usesStore.length}/${FILES.length}`);

  S.check('নিবন্ধনে ফোন বৈধতা ^01', /\^01\\d\{9\}\$/.test(txt('MemberRegister')));
  S.check('নিবন্ধনে NID ১০/১৩/১৭', /10, 13, 17/.test(txt('MemberRegister')));
  S.check('নিবন্ধনে সম্মতি বাধ্যতামূলক', /form\.agree/.test(txt('MemberRegister')));
  S.check('জমা এন্ট্রিতে অঙ্ক ও রেফারেন্স যাচাই', /amount > 50000/.test(txt('QuickEntry')) && /reference\.trim\(\)\.length < 4/.test(txt('QuickEntry')));
  S.check('সম্পাদনে কারণ ও প্রমাণ বাধ্যতামূলক', /reason\.trim\(\)\.length < 5/.test(txt('MemberEdit')) && /প্রমাণ/.test(txt('MemberEdit')));
  S.check('সিদ্ধান্তে OTP ৬ সংখ্যা যাচাই', /replace\(\/\\D\/g, ''\)\.length !== 6/.test(txt('ApprovalDecision')));
  S.check('প্রত্যাখ্যানের কারণ বাধ্যতামূলক', /প্রত্যাখ্যানের কারণ অন্তত ৫ অক্ষরে/.test(txt('ApprovalDecision')));
  S.check('প্রস্থানে OTP ও মওকুফ নম্বর', /otp/.test(txt('CloseSettlement')) && /waiver/.test(txt('CloseSettlement')));
  S.check('দিনশেষে গণনা ইনপুট ও কারণ', /counted/.test(txt('CashBook')) && /reasonPick/.test(txt('CashBook')));
  S.check('তহবিলে উৎস ≠ গন্তব্য যাচাই', /from === to/.test(txt('FundTransfer')));
  S.check('অবস্থা বদলে কমিটি নম্বর বাধ্যতামূলক', /committeeNo/.test(txt('MemberStatus')));
  S.check('রেন্ডার স্ক্রিপ্ট সব রুটে সফল', (() => {
    const r = spawnSync(process.execPath, ['tools/render-smoke.mjs'], { cwd: ROOT, encoding: 'utf8', timeout: 180000 });
    const out = (r.stdout || '') + (r.stderr || '');
    return r.status === 0 && (out.match(/^PASS /gm) || []).length >= 71;
  })());
}

S.sec('৫ · ডিজাইন শৃঙ্খলা');
{
  const files = Object.keys(SCREENS).map((f) => f.replace('.tsx', ''));
  S.check('কোনো raw hex নেই', files.every((f) => !/#[0-9a-fA-F]{3,8}\b/.test(txt(f))));
  S.check('₹ নয় — ৳', files.every((f) => !/₹/.test(txt(f))));
  S.check('৳-এর পরে কাঁচা ল্যাটিন অঙ্ক নেই', files.every((f) => !/৳\s*\d/.test(txt(f))));
  S.check('raw বোতামে ৪৮px ট্যাপ টার্গেট', files.every((f) => !/<button/.test(txt(f)) || /min-h-tap/.test(txt(f))));
  S.check('কোনো window.location নেই', files.every((f) => !/window\.location/.test(txt(f))));
}


S.sec('৬ · ব্যাচ ৫ — নীতি, গণিত ও স্টোর-অ্যাকশন');
{
  const B5 = ['Reconciliation', 'BulkBatches', 'ImportCsv', 'Finance', 'ReportCenter', 'Schemes', 'SchemeDetail',
    'SchemeNew', 'SchemeEdit', 'MemberMove', 'RoutePlan', 'Reminders', 'Settings', 'Staff', 'AuditLog'];
  S.check('ব্যাচ ৫-এর ১৫টি ফাইলই আছে', B5.every((f) => existsSync(join(ROOT, `${DIR}/${f}.tsx`))), B5.filter((f) => !existsSync(join(ROOT, `${DIR}/${f}.tsx`))).join(', '));

  const B5ACTIONS = ['resolveException', 'signOffRecon', 'postBatch', 'commitImport', 'signOffFinance', 'createScheme',
    'proposeVersion', 'requestMove', 'approveMove', 'createRoute', 'assignAll', 'toggleTemplate', 'toggleSetting',
    'addStaff', 'suspendStaff', 'runReport'];
  S.check('১৫টি নতুন অ্যাকশনই ডিফাইনড', B5ACTIONS.every((a) => new RegExp(`const ${a}: Ctx\\['${a}'\\]`).test(STORE)), B5ACTIONS.filter((a) => !new RegExp(`const ${a}: Ctx\\['${a}'\\]`).test(STORE)).join(', '));
  S.check('শুধু ড্রাই-রান কমিট হয়', /শুধু ড্রাই-রান ফাইল কমিট করা যায়/.test(STORE));
  S.check('সাইন-অফে অমিল বাকি থাকলে আটকায়', /অমিল নিষ্পত্তি বাকি — সাইন-অফ আটকে আছে/.test(STORE));
  S.check('স্কিম কোড সংঘর্ষ আটকায়', /কোড আগেই ব্যবহৃত/.test(STORE));
  S.check('শাখা স্থানান্তরে ORG_ADMIN গেট', /শাখা স্থানান্তর শুধু ORG_ADMIN/.test(STORE));
  S.check('শেষ ORG_ADMIN নিষ্ক্রিয় করা যায় না', /কমপক্ষে ১ জন সক্রিয় ORG_ADMIN/.test(STORE));
  S.check('কমিটির সিদ্ধান্ত ছাড়া সংস্করণ নয়', /কমিটির সিদ্ধান্ত নম্বর ছাড়া নতুন সংস্করণ/.test(STORE));

  const OPS = read('src/domain/adminOps.ts');
  S.check('কোনো সুদ/মুনাফার ফিল্ড নেই (D-01)', !/profit_percentage|interest_rate|dividend_rate/.test(OPS));

  const outDir = join(ROOT, 'node_modules/.cache/dt');
  const b = spawnSync(join(ROOT, 'node_modules/.bin/esbuild'), ['src/domain/adminOps.ts', '--format=esm', '--outdir=node_modules/.cache/dt', '--log-level=warning'], { cwd: ROOT, encoding: 'utf8' });
  S.check('adminOps বান্ডল হয়েছে', b.status === 0, (b.stderr || '').slice(0, 200));
  const O = await import(`${outDir}/adminOps.js`);

  S.check('আয়ের খাতে সুদ/মুনাফা লাইন নেই', O.FIN_INCOME.every((x) => !/সুদ|মুনাফা/.test(x.h) || /সুদ নয়/.test(x.h)));
  S.check('উদ্বৃত্তপত্রের দুই পাশ সমান (BR-12)', O.financeTotals().balanced);

  S.eq('batchTotals সারি যোগফল', O.batchTotals(O.SEED_BATCHES).rows, O.SEED_BATCHES.reduce((s, x) => s + x.rows, 0));
  S.eq('batchTotals অঙ্ক যোগফল', O.batchTotals(O.SEED_BATCHES).amount, O.SEED_BATCHES.reduce((s, x) => s + x.amount, 0));
  S.eq('routeTotals লক্ষ্য যোগফল', O.routeTotals(O.SEED_ROUTES).target, O.SEED_ROUTES.reduce((s, r) => s + r.target, 0));
  S.eq('বরাদ্দহীন সদস্য সংখ্যা', O.routeTotals(O.SEED_ROUTES).unassigned, O.SEED_UNASSIGNED.length);
  S.eq('templateTotals পাঠানো', O.templateTotals(O.SEED_TEMPLATES).sent, O.SEED_TEMPLATES.reduce((s, t) => s + t.sent, 0));
  S.eq('settingsTotals লকড', O.settingsTotals(O.SEED_SETTINGS).locked, O.SEED_SETTINGS.reduce((n, g) => n + g.items.filter((i) => i.locked).length, 0));
  S.eq('auditStats ব্যর্থ', O.auditStats(O.SEED_AUDIT).failed, O.SEED_AUDIT.filter((l) => l.result !== 'success').length);
  S.eq('reconPct = matched/(matched+unmatched)', O.reconPct(O.SEED_RECON), Math.round((O.SEED_RECON.matched / (O.SEED_RECON.matched + O.SEED_RECON.unmatched)) * 100));
  S.eq('আয়ের যোগফল ঠিক', O.incomeTotal(O.FIN_INCOME), O.FIN_INCOME.reduce((s, r) => s + r.cur, 0));
  S.check('প্রতিটি স্কিমের কোড অনন্য', new Set(O.SEED_SCHEMES.map((s) => s.code)).size === O.SEED_SCHEMES.length);
  S.check('প্রতিটি স্টাফের ভূমিকা বৈধ', O.SEED_STAFF.every((u) => Boolean(O.ROLE_BY_NAME[u.role])));
  S.check('সব টেমপ্লেটে “সুদ নয়” শব্দচয়ন (বিলম্ব ফি)', O.SEED_TEMPLATES.filter((t) => /বিলম্ব|ফি/.test(t.name + t.body)).every((t) => /সুদ নয়/.test(t.body)));
  S.check('রিপোর্ট গ্রুপিং ঠিক', O.reportGroups(O.SEED_REPORTS).reduce((n, g) => n + g.items.length, 0) === O.SEED_REPORTS.length);

  /* পর্দা-স্তরের বৈধতা */
  const B5FILES = B5.map((f) => txt(f)).join('\n');
  S.check('রিকনসিলিয়েশনে কারণ ≥৫ বাধ্যতামূলক', /note\.trim\(\)\.length < 5/.test(STORE) && /resolveException\(ex\.id/.test(txt('Reconciliation')));
  S.check('ইমপোর্টে এক্সটেনশন যাচাই', /\\\.\(csv\|xlsx\|xls\)/i.test(txt('ImportCsv')) || /csv\|xlsx\|xls/.test(txt('ImportCsv')));
  S.check('স্কিম কোডের ছাঁচ যাচাই', /\[A-Z\]\{2\}-\\d\{2\}/.test(txt('SchemeNew')) || /\[A-Z\]\{2\}-\\d\{2\}/.test(STORE));
  S.check('স্থানান্তরে অতীত তারিখ আটকায়', /effAt <= '2026-10-31'/.test(STORE) && /effAt/.test(txt('MemberMove')));
  S.check('স্টাফ ফর্মে ০১ ফোন যাচাই', /\^01\\d\{9\}\$/.test(STORE));
  S.check('সেটিংসে type-to-confirm রিসেট', /খুলনা-২৩৪\/২০১৯/.test(txt('Settings')));
  S.check('অডিট লগ CSV এক্সপোর্ট আসল ব্লব', /Blob\(/.test(txt('AuditLog')) && /text\/csv/.test(txt('AuditLog')));
  S.check('ব্যাচ ৫-এর সব পর্দা স্টোর ব্যবহার করে', B5.every((f) => /useAdmin\(\)/.test(txt(f))), B5.filter((f) => !/useAdmin\(\)/.test(txt(f))).join(', '));
  S.check('ব্যাচ ৫-এ কোনো raw hex নেই', B5.every((f) => !/#[0-9a-fA-F]{3,8}\b/.test(txt(f))));
  S.check('ব্যাচ ৫-এ “ফেজ ৩/শীঘ্রই আসছে” নেই', !/ফেজ ৩|শীঘ্রই আসছে/.test(B5FILES));
}

S.report();
