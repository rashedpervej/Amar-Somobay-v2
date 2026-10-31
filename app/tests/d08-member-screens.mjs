/* ============================================================
   tests/d08-member-screens.mjs — ব্যাচ ১ · সদস্য অ্যাপের পর্দা ও কার্যকারিতা
   ১) M-01…M-21 রুট ও ফাইল বাস্তবে আছে
   ২) প্রতিটি পর্দা স্টোর ব্যবহার করে; কোনো মৃত বোতাম নেই
   ৩) প্রতিটি স্টোর-অ্যাকশন অন্তত একটি পর্দা থেকে ডাকা হয়
   ৪) ডিজাইন/নীতি শৃঙ্খলা (hex নেই, অঙ্ক bn(), নিষিদ্ধ FIELDS নেই)
   ৫) ২৩টি রুট সত্যিই রেন্ডার হয় (render-smoke)
   ============================================================ */

import { createSuite } from './_harness.mjs';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const S = createSuite('D-08 · সদস্য অ্যাপ পর্দা ও কার্যকারিতা');
const read = (p) => (existsSync(join(ROOT, p)) ? readFileSync(join(ROOT, p), 'utf8') : '');

const MEMBER_APP = read('src/apps/member/MemberApp.tsx');
const MAIN = read('src/main.tsx');
const STORE = read('src/store/memberStore.tsx');
const SCREENS = readdirSync(join(ROOT, 'src/apps/member/screens')).filter((f) => f.endsWith('.tsx'));
const screenText = (f) => read(`src/apps/member/screens/${f}`);

S.sec('১ · রুট ও ফাইল');
{
  const EXPECTED = [
    ['home', 'MemberHome'], ['schemes', 'Schemes'], ['schemes/:schemeId', 'SchemeDetail'],
    ['savings', 'Savings'], ['savings/:accountId', 'AccountDetail'], ['deposit', 'Deposit'],
    ['deposit/receipt/:depositId', 'ReceiptScreen'], ['txn', 'Transactions'], ['txn/:txnId', 'TxnDetail'],
    ['dues', 'Dues'], ['withdrawals', 'Withdrawals'], ['withdrawals/new', 'WithdrawNew'],
    ['withdrawals/:id', 'WithdrawalDetail'], ['statement', 'Statement'], ['nominees', 'Nominees'],
    ['notifications', 'Notifications'], ['notices', 'Notices'], ['profile', 'Profile'],
    ['settings', 'Settings'], ['help', 'Support'], ['close-request', 'CloseRequest'],
    ['circles', 'Circles'], ['circles/:circleId', 'CircleDetail'], ['circles/:circleId/draws', 'CircleDraws'],
    ['circles/:circleId/pay', 'CirclePay'], ['circles/:circleId/history', 'CircleHistory'],
    ['circles/:circleId/receipt/:drawId', 'CircleReceipt'],
    ['goals', 'Goals'], ['goals/uses', 'GoalUses'], ['goals/:goalId', 'GoalDetail'],
    ['goals/:goalId/join', 'GoalJoin'], ['goals/:goalId/contribute', 'GoalContribute'],
    ['qard', 'QardHome'], ['qard/eligibility', 'QardEligibility'], ['qard/products', 'QardProducts'],
    ['qard/apply', 'QardApply'], ['qard/applications', 'QardApplications'], ['qard/loans', 'QardLoans'],
    ['qard/pay', 'QardPay'], ['qard/certificate', 'QardCertificate'],
    ['more', 'More'],
  ];
  const fileOf = (comp) => (comp === 'MemberHome' ? 'Home' : comp);
  const missingFile = EXPECTED.filter(([, comp]) => !existsSync(join(ROOT, `src/apps/member/screens/${fileOf(comp)}.tsx`)));
  S.check('সব পর্দার ফাইল আছে', missingFile.length === 0, missingFile.map(([p]) => p).join(', '));

  const missingRoute = EXPECTED.filter(([path, comp]) => !new RegExp(`path="${path}"\\s+element=\\{<${comp} />\\}`).test(MEMBER_APP));
  S.check(`সব ${EXPECTED.length}টি রুট MemberApp-এ আছে`, missingRoute.length === 0, missingRoute.map(([p]) => p).join(', '));

  S.check('MemberProvider + ModuleProvider দিয়ে সদস্য গাছ মোড়া', /<MemberProvider>\s*<ModuleProvider>\s*<MemberApp \/>\s*<\/ModuleProvider>\s*<\/MemberProvider>/.test(MAIN));
  S.check('অজানা পথ → /m/home', /path="\*"\s+element=\{<Navigate to="\/m\/home" replace \/>\}/.test(MEMBER_APP));
  S.check('MNAV ৫ কী-ই ম্যাপড', ['home', 'savings', 'deposit', 'txn', 'more'].every((k) => new RegExp(`${k}: '/m/${k === 'txn' ? 'txn' : k}'`).test(MEMBER_APP)));
}

S.sec('২ · কোনো মৃত বোতাম/প্লেসহোল্ডার নেই');
{
  const dead = SCREENS.filter((f) => /onClick=\{\(\)\s*=>\s*undefined\}|onClick=\{undefined\}/.test(screenText(f)));
  S.check('onClick={() => undefined} নেই', dead.length === 0, dead.join(', '));

  const placeholder = SCREENS.filter((f) => /SoonCard|শীঘ্রই আসছে|ফেজ ৩-এ আসবে|placeholder page/i.test(screenText(f)));
  S.check('প্লেসহোল্ডার কার্ড/বার্তা নেই', placeholder.length === 0, placeholder.join(', '));

  const usesStore = SCREENS.filter((f) => /useMember\(\)|useModules\(\)|useSession\(\)|useNotices\(\)/.test(screenText(f)));
  S.check(
    'প্রতিটি পর্দা স্টোর ব্যবহার করে',
    usesStore.length === SCREENS.length,
    SCREENS.filter((f) => !usesStore.includes(f)).join(', '),
  );

  const navScreens = SCREENS.filter((f) => /navigate\(/.test(screenText(f)));
  S.check('অন্তত ১৮টি পর্দায় সত্যিকারের নেভিগেশন', navScreens.length >= 18, `${navScreens.length} ফাইল`);
}

S.sec('৩ · স্টোর অ্যাকশন কভারেজ');
{
  const ACTIONS = [
    'addDeposit', 'enroll', 'requestWithdrawal', 'cancelWithdrawal', 'saveProfile',
    'addNominee', 'updateNominee', 'removeNominee', 'markNotificationRead',
    'markAllNotificationsRead', 'createTicket', 'requestClose', 'updateSettings',
  ];
  const all = SCREENS.map(screenText).join('\n');
  const unused = ACTIONS.filter((a) => !new RegExp(`\\b${a}\\b`).test(all));
  S.check('প্রতিটি স্টোর অ্যাকশন UI থেকে ডাকা হয়', unused.length === 0, unused.join(', '));

  {
    const home = read('src/apps/member/screens/Home.tsx');
    S.check('ব্যালান্স/বকেয়া স্টোর থেকে আসে', /useMember\(\)/.test(home) && /\bbalance\b/.test(home) && !/demo\/data/.test(home));
  }
  S.check('জমা দিলে রসিদ রুটে যায়', /\/m\/deposit\/receipt\/\$\{dep\.id\}/.test(read('src/apps/member/screens/Deposit.tsx')));
  S.check('উত্তোলন জমা হলে বিবরণে যায়', /\/m\/withdrawals\/\$\{wd\.id\}/.test(read('src/apps/member/screens/WithdrawNew.tsx')));
  S.check('বকেয়া থেকে প্রি-ফিল জমা', /\/m\/deposit\?amount=/.test(read('src/apps/member/screens/Dues.tsx')));
  S.check('KYC সেভ করে', /await saveProfile\(form\)/.test(read('src/apps/member/screens/Profile.tsx')));
  S.check('টিকিট তৈরি করে', /await createTicket\(/.test(read('src/apps/member/screens/Support.tsx')));
}

S.sec('৪ · ডিজাইন ও নীতি');
{
  const hex = SCREENS.filter((f) => /#[0-9a-fA-F]{3,8}\b/.test(screenText(f)));
  S.check('পর্দায় কাঁচা hex নেই', hex.length === 0, hex.join(', '));

  const withMoney = SCREENS.filter((f) => /৳/.test(screenText(f)));
  const badMoney = withMoney.filter((f) => !/bn\(/.test(screenText(f)));
  S.check('৳ দেখানো প্রতিটি পর্দায় bn()', badMoney.length === 0, badMoney.join(', '));

  const latinMoney = SCREENS.filter((f) => /৳\s*\d/.test(screenText(f)));
  S.check('৳-এর পরে কাঁচা ল্যাটিন সংখ্যা নেই', latinMoney.length === 0, latinMoney.join(', '));

  const banned = SCREENS.filter((f) => /profit_percentage|interest_rate|dividend_rate|গ্যারান্টিড?\s*মুনাফা/.test(screenText(f)));
  S.check('নিষিদ্ধ মুনাফা-ফিল্ড/দাবি নেই', banned.length === 0, banned.join(', '));

  S.check('নীতি D-01 স্পষ্ট উল্লেখ আছে', SCREENS.filter((f) => /সুদ|মুনাফা/.test(screenText(f))).length >= 3);
  S.check('স্টোরে ১৩টি অ্যাকশনই ডিফাইনড', ['addDeposit', 'enroll', 'requestWithdrawal', 'cancelWithdrawal', 'saveProfile', 'addNominee', 'updateNominee', 'removeNominee', 'markNotificationRead', 'markAllNotificationsRead', 'createTicket', 'requestClose', 'updateSettings'].every((a) => new RegExp(`const ${a} = useCallback|${a}:`).test(STORE)));
}

S.sec('৫ · রেন্ডার স্মোক (২৩ রুট)');
{
  const r = spawnSync(process.execPath, [join(ROOT, 'tools/render-smoke.mjs')], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, cwd: ROOT });
  const out = (r.stdout || '') + (r.stderr || '');
  const pass = (out.match(/^PASS /gm) || []).length;
  const fail = (out.match(/^FAIL /gm) || []).length;
  S.check('রেন্ডার স্ক্রিপ্ট সব রুটে সফল', r.status === 0 && fail === 0 && pass >= 50, `${pass} পাস · ${fail} ফেল${fail ? `\n${out.split('\n').filter((l) => l.startsWith('FAIL')).slice(0, 8).join('\n')}` : ''}`);
}

S.report();
