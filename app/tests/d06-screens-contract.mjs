/* ============================================================
   tests/d06-screens-contract.mjs — Phase 3 · পর্দা ও রাউট চুক্তি
   ১) তিনটি অ্যাপের রুট নিবন্ধিত (/, /m, /a, /w)
   ২) প্রতিটি পর্দা শেলের ভেতরে; প্রতিটি রুটের ফাইল বাস্তবে আছে
   ৩) নীতি D-01: শতাংশ-ভিত্তিক মুনাফার কোনো দাবি বা ফিল্ড নেই
   ৪) ডেমো ডেটা স্পষ্ট চিহ্নিত; কাঁচা hex নেই; অঙ্ক বাংলায়
   ============================================================ */

import { createSuite } from './_harness.mjs';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, posix } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const S = createSuite('D-06 · পর্দা ও রাউট চুক্তি');

const read = (p) => (existsSync(join(ROOT, p)) ? readFileSync(join(ROOT, p), 'utf8') : '');

function walk(dir, out = []) {
  const abs = join(ROOT, dir);
  if (!existsSync(abs)) return out;
  for (const name of readdirSync(abs)) {
    const rel = posix.join(dir, name);
    if (statSync(join(ROOT, rel)).isDirectory()) walk(rel, out);
    else out.push(rel);
  }
  return out;
}

const MAIN = read('src/main.tsx');
const MEMBER_APP = read('src/apps/member/MemberApp.tsx');
const ADMIN_APP = read('src/apps/admin/AdminMobileApp.tsx');
const WEB_APP = read('src/apps/admin/AdminWebApp.tsx');
const MEMBER_SCREENS = ['Home', 'Savings', 'Deposit', 'Transactions', 'More'];

S.sec('১ · রুট নিবন্ধন');
{
  S.check('/ → শোকেস পৃষ্ঠা', /path="\/"\s+element=\{<App \/>\}/.test(MAIN));
  S.check(
    '/m/* → MemberProvider + ModuleProvider + MemberApp',
    /path="\/m\/\*"\s+element=\{<MemberProvider>\s*<ModuleProvider>\s*<MemberApp \/>\s*<\/ModuleProvider>\s*<\/MemberProvider>\}/.test(MAIN),
  );
  S.check('শেয়ার্ড ৮ রুট main.tsx-এ নিবন্ধিত', ['/login', '/organizations', '/account', '/account/notifications', '/403', '/error', '/verify', '/sync'].every((r) => MAIN.includes(`path="${r}"`)));
  S.check('/a/* → AdminMobileApp', /path="\/a\/\*"\s+element=\{<AdminMobileApp \/>\}/.test(MAIN));
  S.check('/w/* → AdminWebApp', /path="\/w\/\*"\s+element=\{<AdminWebApp \/>\}/.test(MAIN));
  S.check('অজানা পথ → /', /path="\*"\s+element=\{<Navigate to="\/" replace \/>\}/.test(MAIN));
  S.check('BrowserRouter ব্যবহৃত', /<BrowserRouter>/.test(MAIN));
}

S.sec('২ · সদস্য অ্যাপের পর্দা');
{
  for (const name of MEMBER_SCREENS) {
    const file = `src/apps/member/screens/${name}.tsx`;
    S.check(`${name}.tsx আছে`, existsSync(join(ROOT, file)));
  }
  const routes = [
    ['home', 'MemberHome'],
    ['schemes', 'Schemes'],
    ['schemes/:schemeId', 'SchemeDetail'],
    ['savings', 'Savings'],
    ['savings/:accountId', 'AccountDetail'],
    ['deposit', 'Deposit'],
    ['deposit/receipt/:depositId', 'ReceiptScreen'],
    ['txn', 'Transactions'],
    ['txn/:txnId', 'TxnDetail'],
    ['dues', 'Dues'],
    ['withdrawals', 'Withdrawals'],
    ['withdrawals/new', 'WithdrawNew'],
    ['withdrawals/:id', 'WithdrawalDetail'],
    ['statement', 'Statement'],
    ['nominees', 'Nominees'],
    ['notifications', 'Notifications'],
    ['notices', 'Notices'],
    ['profile', 'Profile'],
    ['settings', 'Settings'],
    ['help', 'Support'],
    ['close-request', 'CloseRequest'],
    ['circles', 'Circles'],
    ['circles/:circleId', 'CircleDetail'],
    ['circles/:circleId/draws', 'CircleDraws'],
    ['circles/:circleId/pay', 'CirclePay'],
    ['circles/:circleId/history', 'CircleHistory'],
    ['circles/:circleId/receipt/:drawId', 'CircleReceipt'],
    ['goals', 'Goals'],
    ['goals/uses', 'GoalUses'],
    ['goals/:goalId', 'GoalDetail'],
    ['goals/:goalId/join', 'GoalJoin'],
    ['goals/:goalId/contribute', 'GoalContribute'],
    ['qard', 'QardHome'],
    ['qard/eligibility', 'QardEligibility'],
    ['qard/products', 'QardProducts'],
    ['qard/apply', 'QardApply'],
    ['qard/applications', 'QardApplications'],
    ['qard/loans', 'QardLoans'],
    ['qard/pay', 'QardPay'],
    ['qard/certificate', 'QardCertificate'],
    ['qard/certificate/:loanId', 'QardCertificate'],
    ['more', 'More'],
  ];
  const missing = routes.filter(([path, comp]) => !new RegExp(`path="${path}"\\s+element=\\{<${comp} />\\}`).test(MEMBER_APP));
  S.check(`সব ${routes.length}টি রুট MemberApp-এ যুক্ত`, missing.length === 0, missing.map(([p]) => p).join(', '));
  S.check('MNAV-এর ৫ কী → ৫ রুট ম্যাপড', (MEMBER_APP.match(/'\/m\/[a-z]+'/g) || []).length >= 5);
  S.check('জমা পর্দা ফ্লো মডেলে (নেভ বন্ধ)', /match: \/\^\\\/m\\\/deposit\$\/[^}]*model: 'flow'/.test(MEMBER_APP));
  S.check('শেল নেভিগেশন MNAV থেকে আসে', /import \{ MEMBER_NAV \}/.test(MEMBER_APP));
}

S.sec('৩ · অ্যাডমিন মোবাইল ও ওয়েব');
{
  S.check('AdminHome.tsx আছে', existsSync(join(ROOT, 'src/apps/admin/screens/AdminHome.tsx')));
  S.check('Approvals.tsx আছে', existsSync(join(ROOT, 'src/apps/admin/screens/Approvals.tsx')));
  S.check('AM হোম রুট', /path="home"\s+element=\{<AdminHome/.test(ADMIN_APP));
  S.check('AM অনুমোদন রুট', /path="approvals"\s+element=\{<Approvals \/>\}/.test(ADMIN_APP));
  S.check('অনুমোদন ফ্লো মডেলে', /location\.pathname === '\/a\/approvals' \? 'flow'/.test(ADMIN_APP));
  S.check('ভূমিকা ?role= থেকে আসে (ডিফল্ট MANAGER)', /resolveAdminShell\(params\.get\('role'\)\)/.test(ADMIN_APP));
  S.check('অজানা নেভ-কী → সৎ "ফেজ ৩" কার্ড', /\/a\/soon\/\$\{slot\.key\}/.test(ADMIN_APP));
  S.check('ওয়েব ড্যাশবোর্ড রুট', /path="dashboard"\s+element=\{<Dashboard \/>\}/.test(WEB_APP));
  S.check('ওয়েব সাইডবার সম্পূর্ণ ANAV থেকে', /import \{ ADMIN_WEB_NAV \}/.test(WEB_APP));
  S.check('ওয়েব টেবিল ≤ ৪ কলাম', (WEB_APP.match(/key: '[a-z]+', head:/g) || []).length <= 4);
}

S.sec('৪ · নীতি D-01 — শতাংশ-ভিত্তিক মুনাফা নেই');
{
  const appFiles = walk('src/apps').map((f) => [f, read(f)]);
  const banned = [
    [/profit_percentage/, 'profit_percentage'],
    [/interest_rate|dividend_rate|profit_rate/, 'interest/dividend field'],
    [/[০-৯0-9]\s*%\s*(মুনাফা|সুদ|লভ্যাংশ|প্রতিদান)/, 'শতাংশ-ভিত্তিক মুনাফার দাবি'],
    [/guaranteed|নিশ্চিত\s*(মুনাফা|প্রতিদান)/i, 'guaranteed return'],
  ];
  const hits = [];
  for (const [file, text] of appFiles) {
    for (const [re, label] of banned) {
      const m = text.match(re);
      if (m) hits.push(`${file} → ${label} (${m[0]})`);
    }
  }
  S.check('পর্দাগুলোতে নিষিদ্ধ ফিল্ড/দাবি নেই', hits.length === 0, hits.join(' | '));

  const demo = read('src/demo/data.ts');
  S.check('ডেমো ডেটায় সুদ-জাতীয় ফিল্ড নেই', !/profit|interest|dividend/i.test(demo));
  S.check('ডেমো ওয়াটারমার্ক সংজ্ঞায়িত', /DEMO_WATERMARK/.test(demo));
  const marked = appFiles.filter(([, t]) => /ডেমো/.test(t)).length;
  S.check('প্রতিটি পর্দায় ডেমো চিহ্ন আছে', marked >= 5, `${marked} ফাইল`);
}

S.sec('৫ · ডিজাইন ও ভাষা শৃঙ্খলা');
{
  const uiFiles = [...walk('src/apps'), ...walk('src/components')];
  const hex = uiFiles.filter((f) => /#[0-9a-fA-F]{3,8}\b/.test(read(f)));
  S.check('অ্যাপ/কম্পোনেন্টে কাঁচা hex নেই', hex.length === 0, hex.join(', '));

  const withMoney = walk('src/apps').filter((f) => /৳/.test(read(f)));
  const bad = withMoney.filter((f) => !/bn\(/.test(read(f)));
  S.check('টাকার অঙ্ক সবসময় bn() দিয়ে (বাংলা অঙ্ক)', bad.length === 0, bad.join(', '));

  const screens = walk('src/apps/member/screens').map((f) => [f, read(f)]);
  /* পর্দার শিরোনাম হয় নিজস্ব heading ক্লাসে, নয়তো শেয়ার্ড <Card title> থেকে আসে
     (Card নিজেই text-h3 রেন্ডার করে) — দুটোর যেকোনো একটি থাকতে হবে। */
  const noSection = screens.filter(([, t]) => !/text-h2|text-h3|text-h1|<Card[^>]*title=/.test(t));
  S.check('প্রতিটি পর্দায় শিরোনাম আছে (heading বা Card title)', noSection.length === 0, noSection.map(([f]) => f).join(', '));

  const tap = walk('src/apps').filter((f) => /<button/.test(read(f)));
  const smallTap = tap.filter((f) => !/min-h-tap|min-h-\[88px\]|min-h-10/.test(read(f)));
  S.check('ইন্টারঅ্যাকটিভ পর্দায় ট্যাপ টার্গেট নির্ধারিত', smallTap.length === 0, smallTap.join(', '));
}

S.report();
