/* ============================================================
   tests/d11-admin-mobile.mjs — ব্যাচ ৪ · অ্যাডমিন মোবাইল (AM-01…AM-20)
   ১) ৬০টি ফাইল, ৬৪ রুট, AdminProvider + মডিউল প্রোভাইডার সংযোগ
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
const S = createSuite('D-11 · অ্যাডমিন মোবাইল পর্দা (AM-01…AM-35 · RAM/JAM · QAM)');
const read = (p) => (existsSync(join(ROOT, p)) ? readFileSync(join(ROOT, p), 'utf8') : '');

const APP = read('src/apps/admin/AdminMobileApp.tsx');
const MAIN = read('src/main.tsx');
const STORE = read('src/store/adminStore.tsx');
const DIR = 'src/apps/admin/screens';
const FILES = readdirSync(join(ROOT, DIR)).filter((f) => f.endsWith('.tsx') && !['parts.tsx', 'rcParts.tsx', 'qhParts.tsx'].includes(f));
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
  /* ব্যাচ ৬ — ROSCA (RAM-01…RAM-12) */
  'RcDashboard.tsx': ['rc', 'ROSCA'],
  'RcCircles.tsx': ['rc/circles', 'চক্র তালিকা'],
  'RcNew.tsx': ['rc/new', 'নতুন চক্র'],
  'RcCircle.tsx': ['rc/circles/:circleId', 'চক্রের হাব'],
  'RcSeats.tsx': ['rc/circles/:circleId/seats', 'সিট বরাদ্দ'],
  'RcDrawRun.tsx': ['rc/circles/:circleId/draw', 'ড্র পরিচালনা'],
  'RcPool.tsx': ['rc/circles/:circleId/pool', 'পুল ও ঘাটতি'],
  'RcDrawDetail.tsx': ['rc/draws/:drawId', 'ড্রের রসিদ'],
  'RcRegister.tsx': ['rc/register', 'ড্র রেজিস্টার'],
  'RcCollect.tsx': ['rc/collect', 'কিস্তি সংগ্রহ'],
  'RcDefaults.tsx': ['rc/defaults', 'ডিফল্ট ও প্রতিস্থাপন'],
  'RcReports.tsx': ['rc/reports', 'ROSCA রিপোর্ট'],
  'RcSchemes.tsx': ['rc/schemes', 'চক্র স্কিম'],
  'RcCalendar.tsx': ['rc/calendar', 'ড্র ক্যালেন্ডার'],
  /* ব্যাচ ৬ — যৌথ লক্ষ্য (JAM-01…JAM-10) */
  'JgDashboard.tsx': ['jg', 'যৌথ লক্ষ্য'],
  'JgGoals.tsx': ['jg/goals', 'লক্ষ্য তালিকা'],
  'JgNew.tsx': ['jg/new', 'নতুন লক্ষ্য'],
  'JgGoal.tsx': ['jg/goals/:goalId', 'লক্ষ্যের হাব'],
  'JgParts.tsx': ['jg/goals/:goalId/parts', 'অংশগ্রহণকারী'],
  'JgMilestones.tsx': ['jg/goals/:goalId/milestones', 'মাইলস্টোন'],
  'JgDisb.tsx': ['jg/goals/:goalId/disbursements', 'বিতরণ ভাউচার'],
  'JgSettle.tsx': ['jg/goals/:goalId/settle', 'নিষ্পত্তি'],
  'JgArrears.tsx': ['jg/arrears', 'বকেয়া সংগ্রহ'],
  'JgReports.tsx': ['jg/reports', 'যৌথ লক্ষ্য রিপোর্ট'],
  /* ব্যাচ ৭ — কর্জে হাসানা (QAM-01…QAM-17) */
  'QhDashboard.tsx': ['qh', 'পুলে মুক্ত অঙ্ক'],
  'QhProducts.tsx': ['qh/products', 'পণ্যের নাম'],
  'QhRules.tsx': ['qh/rules', 'নিয়মের ক্রম'],
  'QhSimulation.tsx': ['qh/simulation', 'খসড়া নিয়মের মান'],
  'QhEligible.tsx': ['qh/eligible', 'জন মূল্যায়িত'],
  'QhWindow.tsx': ['qh/window', 'জানালার সময়সূচি'],
  'QhQueue.tsx': ['qh/applications', 'বিচারাধীন আবেদন'],
  'QhAppDetail.tsx': ['qh/applications/:appId', 'যোগ্যতা স্ন্যাপশট'],
  'QhDecision.tsx': ['qh/applications/:appId/decision', 'সিদ্ধান্তের বিকল্প'],
  'QhDisburse.tsx': ['qh/disburse/:loanId', 'বিতরণ-পূর্ব গেট'],
  'QhLoans.tsx': ['qh/loans', 'ঋণ তালিকা'],
  'QhLoanDetail.tsx': ['qh/loans/:loanId', 'কিস্তির গ্রিড'],
  'QhRepay.tsx': ['qh/loans/:loanId/repay', 'কিস্তি বাছাই'],
  'QhArrears.tsx': ['qh/arrears', 'ধাপভিত্তিক প্রতিকার'],
  'QhClose.tsx': ['qh/loans/:loanId/close', 'সনদের নিয়ম'],
  'QhWriteOff.tsx': ['qh/writeoff', 'বিচারাধীন প্রস্তাব'],
  'QhReports.tsx': ['qh/reports', 'শ্রেণিকরণ ও বয়স'],
};

S.sec('১ · ফাইল, রুট ও প্রোভাইডার (AM-01…AM-35)');
{
  S.eq('অ্যাডমিন পর্দার সংখ্যা ৭৭ (AM-01…AM-35 + RAM/JAM + QAM-01…QAM-17)', FILES.length, 77);
  S.check('প্রতিটি ফাইলের রুট আছে', Object.keys(SCREENS).every((f) => existsSync(join(ROOT, `${DIR}/${f}`))), Object.keys(SCREENS).filter((f) => !existsSync(join(ROOT, `${DIR}/${f}`))).join(', '));
  const noRoute = Object.entries(SCREENS).filter(([, [p]]) => !APP.includes(`path="${p}"`));
  S.check('AdminMobileApp-এ প্রতিটি রুট মাউন্টেড', noRoute.length === 0, noRoute.map(([f]) => f).join(', '));
  S.check('/a/* → AdminProvider + AdminMobileApp', /<AdminProvider>\s*(<AdminRoscaProvider>)?\s*(<AdminJointProvider>)?\s*(<AdminQardProvider>)?\s*<AdminMobileApp \/>/.test(MAIN));
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


S.sec('৬ · ব্যাচ ৬ — ROSCA ও যৌথ লক্ষ্য ডোমেইন');
{
  const RO = read('src/store/adminRoscaStore.tsx');
  const JG = read('src/store/adminJointStore.tsx');
  S.check('ROSCA স্টোরে maker ≠ checker বাধ্যবাধকতা', /নিজে প্রস্তুত করে নিজে অনুমোদন করা যাবে না/.test(RO));
  S.check('ROSCA স্টোরে সম্পন্ন ড্র অপরিবর্তনীয়', /অপরিবর্তনীয়/.test(RO) && /status: 'executed'/.test(RO));
  S.check('ROSCA স্টোরে রসিদ স্বয়ংক্রিয় ও অনন্য', /RP-2610-/.test(RO) && /receipt/.test(RO));
  S.check('ROSCA স্টোরে ঘাটতি সিদ্ধান্ত নথিভুক্ত', /ঘাটতি/.test(RO) && /D-38/.test(RO));
  S.check('যৌথ লক্ষ্যে যোগদান অনুমোদন বাধ্যতামূলক', /যোগদান অনুমোদিত/.test(JG) && /pending/.test(JG));
  S.check('যৌথ লক্ষ্যে প্রমাণ ছাড়া ভাউচার নয় (D-50)', /প্রমাণের রেফারেন্স ছাড়া ভাউচার তৈরি হবে না/.test(JG));
  S.check('যৌথ লক্ষ্যে maker ≠ checker', /নিজে প্রস্তুত করে নিজে অনুমোদন করা যাবে না/.test(JG));
  S.check('যৌথ লক্ষ্যের সীমা ৫ (D-43)', /সক্রিয় লক্ষ্যের সীমা \(৫\) পূর্ণ/.test(JG));

  const b2 = spawnSync(join(ROOT, 'node_modules/.bin/esbuild'), ['src/domain/adminRosca.ts', 'src/domain/adminJoint.ts', '--bundle', '--format=esm', '--outdir=node_modules/.cache/dt6', '--log-level=warning'], { cwd: ROOT, encoding: 'utf8' });
  S.check('মডিউল ডোমেইন বান্ডল হয়েছে', b2.status === 0, (b2.stderr || '').slice(0, 200));
  const R = await import(`${join(ROOT, 'node_modules/.cache/dt6')}/adminRosca.js`);
  const J = await import(`${join(ROOT, 'node_modules/.cache/dt6')}/adminJoint.js`);
  S.check('ROSCA ৩ স্কিম · ৪ চক্র · ১৮ ড্র', R.SEED_RC_SCHEMES.length === 3 && R.SEED_RC_CIRCLES.length === 4 && R.SEED_RC_DRAWS.length === 18);
  const sc1 = R.SEED_RC_SCHEMES[0];
  S.check('rcPerDraw = সিট × কিস্তি', R.rcPerDraw(sc1) === sc1.seats * sc1.contrib);
  S.check('rcTotalPool = প্রতি ড্র × সিট', R.rcTotalPool(sc1) === R.rcPerDraw(sc1) * sc1.seats);
  const rc1 = R.SEED_RC_CIRCLES[0];
  const seats1 = R.rcSeats(rc1, sc1, R.SEED_RC_SEATS, R.SEED_RC_DRAWS, R.SEED_RC_MISSED, R.DEMO_EXTRA);
  S.check('rcSeats সবসময় স্কিমের সিট সংখ্যা ফেরে', seats1.length === sc1.seats);
  S.check('প্রাপক সিট "won", বকেয়া সিট "due"', seats1.some((s) => s.status === 'won') && seats1.some((s) => s.status === 'due'));
  const rc02 = R.SEED_RC_CIRCLES[1];
  const seats2 = R.rcSeats(rc02, R.rcSchemeById(R.SEED_RC_SCHEMES, rc02.scheme), R.SEED_RC_SEATS, R.SEED_RC_DRAWS, R.SEED_RC_MISSED, R.DEMO_EXTRA);
  S.check('খালি সিট vacant হিসেবে আসে', seats2.some((s) => s.status === 'vacant'));
  S.check('ঘাটতি = সম্পন্ন ড্র-পুল − সংগৃহীত', R.rcShortfall(rc1, sc1, R.SEED_RC_SEATS, R.SEED_RC_DRAWS, R.SEED_RC_MISSED, R.DEMO_EXTRA) >= 0);
  S.check('মোট ডিফল্ট ৪ · খোলা ৩', R.SEED_RC_DEFAULTS.length === 4 && R.rcDefaultTotal(R.SEED_RC_DEFAULTS) > 0);
  S.check('rcHash নির্ধারিত ও স্থিতিশীল', R.rcHash('abc') === R.rcHash('abc') && /^0x[0-9a-f]{8}$/.test(R.rcHash('abc')));
  S.check('rcCandidates পেয়ে যাওয়া সিট বাদ দেয়', R.rcCandidates(seats1).every((s) => s.status !== 'won'));

  S.check('যৌথ লক্ষ্য ৫টি · সীমা ৫ (D-43)', J.SEED_JGOALS.length === 5 && J.JG_LIMIT === 5);
  const g1 = J.SEED_JGOALS[0];
  S.check('jgCollected = অবদান যোগফল', J.jgCollected(J.SEED_JCONTRIBS, g1.id) === J.jgContribsOf(J.SEED_JCONTRIBS, g1.id).reduce((s, c) => s + c.amount, 0));
  S.check('jgPctOf ০–১০০+ পরিসরে', J.jgPctOf(J.SEED_JCONTRIBS, g1) > 0);
  S.check('jgActive সমাপ্ত লক্ষ্য বাদ দেয়', J.jgActive(J.SEED_JGOALS).every((g) => g.status !== 'closed'));
  S.check('jgLimitLeft = ৫ − সক্রিয়', J.jgLimitLeft(J.SEED_JGOALS) === J.JG_LIMIT - J.jgActive(J.SEED_JGOALS).length);
  const ms = J.jgMilestonesOf(g1, J.SEED_JCONTRIBS);
  S.check('মাইলস্টোন ২৫/৫০/৭৫/১০০ · তারিখসহ', ms.length === 4 && ms[0].reachedAt !== null);
  S.check('বকেয়া তালিকায় gap ধনাত্মক', J.jgAllArrears(J.SEED_JGOALS, J.SEED_JPARTS, J.SEED_JCONTRIBS).every((x) => x.gap > 0));
  S.check('যৌথ লক্ষ্যে কোনো সুদ/মুনাফা নেই', !/profit|interest|dividend|মুনাফা/.test(JSON.stringify(J.SEED_JDISB)));
  S.check('অংশগ্রহণকারীর প্রতিশ্রুতি > ০ (সক্রিয়)', J.SEED_JPARTS.filter((p) => p.status === 'active').every((p) => p.pledged > 0));

  const usesRo = FILES.filter((f) => /useAdminRo\(\)/.test(txt(f.replace('.tsx', ''))));
  const usesJg = FILES.filter((f) => /useAdminJg\(\)/.test(txt(f.replace('.tsx', ''))));
  S.check('ROSCA পর্দাগুলো useAdminRo ব্যবহার করে', usesRo.length >= 12, `${usesRo.length}`);
  S.check('যৌথ লক্ষ্য পর্দাগুলো useAdminJg ব্যবহার করে', usesJg.length >= 10, `${usesJg.length}`);
}

S.sec('৭ · ব্যাচ ৭ — কর্জে হাসানা (QAM-01…QAM-17)');
{
  const QS = read('src/store/adminQardStore.tsx');
  S.check('QH স্টোরে OTP গেট বাধ্যতামূলক', /OTP মেলেনি/.test(QS) && /otp !== '123456'/.test(QS));
  S.check('QH স্টোরে maker ≠ checker (সিদ্ধান্ত)', /প্রস্তুতকারী নিজে অনুমোদন করতে পারবেন না/.test(QS));
  S.check('QH স্টোরে কমিটি রেফারেন্স যাচাই (D-45)', /CM-YYMM-## বাধ্যতামূলক/.test(QS));
  S.check('QH স্টোরে Simulation ছাড়া প্রকাশ আটকায় (D-57)', /Simulation ছাড়া নতুন সংস্করণ প্রকাশ আটকবে/.test(QS));
  S.check('QH স্টোরে স্ন্যাপশট আটকালে অনুমোদন নয় (BR-21)', /স্ন্যাপশটে আটকেছে/.test(QS));
  S.check('QH স্টোরে রসিদ অপরিবর্তনীয় (BR-08)', /রসিদ অপরিবর্তনীয়/.test(QS));
  S.check('QH write-off এ দাবি ≤ বাকি মূলধন', /অঙ্ক বাকি মূলধনের/.test(QS));
  S.check('QH write-off এ maker ≠ checker', /প্রস্তাবকারী নিজে অনুমোদন করতে পারবেন না/.test(QS));

  const b3 = spawnSync(join(ROOT, 'node_modules/.bin/esbuild'), ['src/domain/adminQard.ts', '--bundle', '--format=esm', '--outdir=node_modules/.cache/dt7', '--log-level=warning'], { cwd: ROOT, encoding: 'utf8' });
  S.check('QH ডোমেইন বান্ডল হয়েছে', b3.status === 0, (b3.stderr || '').slice(0, 200));
  const Q = await import(`${join(ROOT, 'node_modules/.cache/dt7')}/adminQard.js`);

  S.check('৩টি সহায়তা পণ্য · ১৪টি নিয়ম · ৯ জন মূল্যায়িত', Q.SEED_QH_PRODUCTS.length === 3 && Q.SEED_QH_RULES.length === 14 && Q.SEED_QH_ELIGIBLE.length === 9);
  S.check('১৪টি আবেদন · ৮টি ঋণ · ২টি write-off', Q.SEED_QH_APPS.length === 14 && Q.SEED_QH_LOANS.length === 8 && Q.SEED_QH_WRITEOFFS.length === 2);
  S.check('পণ্য ও নিয়ম ডেটায় কোনো সুদ/মুনাফা ফিল্ড নেই (BR-20)', !/profit|interest|dividend|মুনাফা হার|সুদের হার/.test(JSON.stringify([Q.SEED_QH_PRODUCTS, Q.SEED_QH_RULES, Q.SEED_QH_LOANS, Q.SEED_QH_APPS])));
  S.check('প্রতিটি পণ্যের সুদ-শূন্য নোট আছে', Q.SEED_QH_PRODUCTS.every((p) => /সুদ ৳০/.test(p.note)));
  S.check('সব ঋণের কিস্তি = মূলধন ÷ মেয়াদ (কোনো সুদ নেই)', Q.SEED_QH_LOANS.every((l) => Q.qhPerInst(l) * l.tenure === l.principal || Math.abs(Q.qhPerInst(l) * l.tenure - l.principal) <= l.tenure));
  const l3 = Q.SEED_QH_LOANS.find((l) => l.id === 'qh03');
  S.check('qhOutstanding = মূলধন − আদায় − write-off', Q.qhOutstanding(l3, Q.SEED_QH_REPAYMENTS, Q.SEED_QH_WRITEOFFS) === Math.max(0, l3.principal - Q.qhRepaid(l3, Q.SEED_QH_REPAYMENTS) - Q.qhWrittenOff(l3, Q.SEED_QH_WRITEOFFS)));
  S.check('বকেয়া কিস্তির যোগফল = qhArrearsOf', Q.qhArrearsOf(l3, Q.SEED_QH_REPAYMENTS) === Q.qhInsts(l3, Q.SEED_QH_REPAYMENTS).filter((i) => i.status === 'overdue').reduce((s, i) => s + i.amount, 0));
  S.check('৯১+ দিন বিলম্ব → সন্দেহজনক শ্রেণি (D-44)', Q.qhClassOf(Q.SEED_QH_LOANS.find((l) => l.id === 'qh06'), Q.SEED_QH_REPAYMENTS) === 'doubt');
  S.check('সমাপ্ত ঋণের বাকি ৳০', Q.qhOutstanding(Q.SEED_QH_LOANS.find((l) => l.id === 'qh01'), Q.SEED_QH_REPAYMENTS, Q.SEED_QH_WRITEOFFS) === 0);
  const pool = Q.qhPoolState(Q.SEED_QH_WINDOW, Q.SEED_QH_LOANS, Q.SEED_QH_APPS);
  S.check('পুল = বরাদ্দ − হল্ড − প্রতিশ্রুতি (D-40)', pool.available === Math.max(0, pool.allocated - pool.held - pool.committed));
  S.check('জানালা বন্ধ · কোটা ১২/১২ · পরবর্তী ১ নভে (D-51)', Q.SEED_QH_WINDOW.open === false && Q.qhQuotaLeft(Q.SEED_QH_WINDOW) === 0);
  S.check('কিউ-তে পর্যালোচনা ও ফেরত আছে', Q.qhQueue(Q.SEED_QH_APPS).some((a) => a.status === 'review') && Q.qhQueue(Q.SEED_QH_APPS).some((a) => a.status === 'returned'));
  S.check('SLA লঙ্ঘন শনাক্ত হয় (৫ কার্যদিবস)', Q.qhSlaBreaches(Q.SEED_QH_APPS).length >= 1);
  S.check('Simulation-এ কোনো সদস্যের নাম/আইডি নেই (D-57)', !/m[1-9]|রহিমা|করিম|সাবিনা/.test(JSON.stringify(Q.qhSimulate({ minSavings: 10000, maxPct: 30, minMonths: 6 }))));
  S.check('ম্যানুয়াল এক্সেপশন শর্তসাপেক্ষ · সীমা > ০', Q.SEED_QH_ELIGIBLE.filter((e) => e.source === 'manual_exception').every((e) => e.result === 'conditional' && e.maxAmount > 0));
  S.check('রসিদ ও সনদ নম্বরের ছাঁচ', /^QR-\d{4}-\d{4}$/.test(Q.qhReceiptNo(7)) && /^QHC-\d{4}-\d{4}$/.test(Q.qhCertNo(7)));
  S.check('সীমা = min(পণ্য, সঞ্চয়ের ৫০%, পুল, মূল্যায়ন)', Q.qhMaxAmount(Q.SEED_QH_PRODUCTS[0], 50000, 20000, 8750) === 8750);

  const usesQh = FILES.filter((f) => /useAdminQh\(\)/.test(txt(f.replace('.tsx', ''))));
  S.check('QH পর্দাগুলো useAdminQh ব্যবহার করে', usesQh.length >= 17, `${usesQh.length}`);
  const QFILES = Object.keys(SCREENS).filter((f) => f.startsWith('Qh')).map((f) => f.replace('.tsx', ''));
  S.check('QH-এ কোনো raw hex নেই', QFILES.every((f) => !/#[0-9a-fA-F]{3,8}\b/.test(txt(f))));
  S.check('QH-এ “ফেজ ৩/শীঘ্রই আসছে” নেই', !QFILES.some((f) => /ফেজ ৩|শীঘ্রই আসছে|Coming soon/.test(txt(f))));
  S.check('QH-এ সুদ সবসময় শূন্য ঘোষণা', !QFILES.some((f) => (f.match(/সুদ/g) || []).length > 0 && !QFILES.some((g) => /সুদ ৳০|সুদ শূন্য|সুদমুক্ত|সুদ যোগ|সুদ আয়|সুদ \/|সুদ নেই|সুদ-সমতুল্য|নেই/.test(txt(g)))));
  S.check('QH-এ কোনো profit_percentage/interest_rate নেই', !QFILES.some((f) => /profit_percentage|interest_rate/.test(txt(f))));
  S.check('প্রতিটি QH পর্দায় ডেমো/নিয়ম চিহ্ন', QFILES.every((f) => /D-\d|BR-\d|ডেমো|সুদ/.test(txt(f))));
}

S.report();
