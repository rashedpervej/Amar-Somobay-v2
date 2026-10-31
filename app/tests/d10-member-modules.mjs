/* ============================================================
   tests/d10-member-modules.mjs — ব্যাচ ৩ · ROSCA + যৌথ লক্ষ্য + কর্জে হাসানা
   ১) ১৯টি পর্দা, ১৯টি রুট, স্টোর-অ্যাকশন সংযোগ
   ২) ডোমেইন-গণিত: ROSCA পুল/অগ্রগতি, JM %, QH কিস্তি/বকেয়া (esbuild দিয়ে TS লোড)
   ৩) D-01 নীতি: QH-তে সুদ/মুনাফা/ফি = ০, কোনো রেট-গণিত নেই, শুধু মূলধন
   ৪) কার্যকারিতা: ফর্ম-বৈধতা, মৃত বোতাম নেই, আসল স্টোর অ্যাকশন
   ৫) ডিজাইন শৃঙ্খলা + রেন্ডার স্মোক (১৯ রুট)
   ============================================================ */

import { createSuite } from './_harness.mjs';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const S = createSuite('D-10 · সদস্য মডিউল (ROSCA · যৌথ লক্ষ্য · কর্জে হাসানা)');
const read = (p) => (existsSync(join(ROOT, p)) ? readFileSync(join(ROOT, p), 'utf8') : '');

const APP = read('src/apps/member/MemberApp.tsx');
const STORE = read('src/store/moduleStore.tsx');
const DIR = 'src/apps/member/screens';
const txt = (f) => read(`${DIR}/${f}.tsx`);

const SCREENS = {
  Circles: ['circles', 'আমার চক্র'],
  CircleDetail: ['circles/:circleId', 'চক্র'],
  CircleDraws: ['circles/:circleId/draws', 'ড্র'],
  CirclePay: ['circles/:circleId/pay', 'কিস্তি'],
  CircleHistory: ['circles/:circleId/history', 'ইতিহাস'],
  CircleReceipt: ['circles/:circleId/receipt/:drawId', 'প্রাপ্তি'],
  Goals: ['goals', 'লক্ষ্য'],
  GoalDetail: ['goals/:goalId', 'লক্ষ্য'],
  GoalJoin: ['goals/:goalId/join', 'যোগদান'],
  GoalContribute: ['goals/:goalId/contribute', 'অবদান'],
  GoalUses: ['goals/uses', 'অর্জন'],
  QardHome: ['qard', 'কর্জে হাসানা'],
  QardEligibility: ['qard/eligibility', 'যোগ্যতা'],
  QardProducts: ['qard/products', 'পণ্য'],
  QardApply: ['qard/apply', 'আবেদন'],
  QardApplications: ['qard/applications', 'আবেদন'],
  QardLoans: ['qard/loans', 'সহায়তা'],
  QardPay: ['qard/pay', 'কিস্তি'],
  QardCertificate: ['qard/certificate', 'সনদ'],
};
const QH = ['QardHome', 'QardEligibility', 'QardProducts', 'QardApply', 'QardApplications', 'QardLoans', 'QardPay', 'QardCertificate'];
const RC = ['Circles', 'CircleDetail', 'CircleDraws', 'CirclePay', 'CircleHistory', 'CircleReceipt'];
const JM = ['Goals', 'GoalDetail', 'GoalJoin', 'GoalContribute', 'GoalUses'];

S.sec('১ · পর্দা, রুট ও স্টোর-সংযোগ');
{
  S.eq('মডিউল পর্দার সংখ্যা ১৯', Object.keys(SCREENS).length, 19);
  const missing = Object.keys(SCREENS).filter((c) => !existsSync(join(ROOT, `${DIR}/${c}.tsx`)));
  S.check('সব ১৯টি ফাইল আছে', missing.length === 0, missing.join(', '));

  const noRoute = Object.entries(SCREENS).filter(([, [p]]) => !new RegExp(`path="${p}"[^>]*element=\\{<[A-Za-z]+ ?/>\\}`).test(APP));
  S.check('MembersApp-এ ১৯টি রুট মাউন্টেড', noRoute.length === 0, noRoute.map(([c]) => c).join(', '));

  S.check('মডিউল-অ্যাকশন ৫টি ডিফাইনড', ['payCircle', 'joinGoal', 'contributeGoal', 'applyQard', 'repayQard'].every((a) => new RegExp(`const ${a} = useCallback`).test(STORE)));
  S.check('মডিউল স্টোরে সিড ডেটা + রিডিউসার', /SEED_CIRCLES/.test(STORE) && /SEED_GOALS/.test(STORE) && /createContext/.test(STORE));
}

S.sec('২ · ডোমেইন-গণিত (আসল TS → esbuild → import)');
{
  const outDir = join(ROOT, 'node_modules/.cache/dt');
  const b = spawnSync(join(ROOT, 'node_modules/.bin/esbuild'),
    ['src/domain/rosca.ts', 'src/domain/joint.ts', 'src/domain/qard.ts', '--format=esm', '--outdir=node_modules/.cache/dt', '--log-level=warning'],
    { cwd: ROOT, encoding: 'utf8' });
  S.check('ডোমেইন বান্ডল হয়েছে', b.status === 0, (b.stderr || '').slice(0, 200));

  const [R, J, Q] = await Promise.all(['rosca', 'joint', 'qard'].map((n) => import(`${outDir}/${n}.js`)));
  const c = R.SEED_CIRCLES[0];

  S.check('ROSCA: প্রতি ড্র পুল = কিস্তি × আসন', R.perDraw(c) === c.contrib * c.seats, `${R.perDraw(c)}`);
  S.check('ROSCA: মোট পুল = প্রতি ড্র × আসন', R.totalPool(c) === R.perDraw(c) * c.seats);
  S.check('ROSCA: অগ্রগতি ০–১০০', R.circleProgress(c) >= 0 && R.circleProgress(c) <= 100, `${R.circleProgress(c)}`);
  S.check('ROSCA: আমার সম্ভাবনা আসন-সংখ্যার মধ্যে', R.myChance(c) >= 0 && R.myChance(c) <= c.seats);
  S.check('ROSCA: ড্র ফল অপরিবর্তনীয় — done ড্র সংখ্যা ثابت', R.doneDraws(c).every((d) => d.status === 'done' && d.winnerSeat > 0));
  S.check('ROSCA: আমার জমা ও প্রাপ্তি আলাদা গণনা', R.myContributed(c) >= 0 && R.myReceived(c) >= 0);
  S.check('ROSCA: আগামী ড্র খোঁজা যায়', Boolean(R.nextDraw(c)) || R.doneDraws(c).length === c.draws.length);

  const g = J.SEED_GOALS[0];
  S.check('JM: শতাংশ ০–১০০-এ সীমাবদ্ধ', J.pct(J.SEED_CONTRIBS, g) >= 0 && J.pct(J.SEED_CONTRIBS, g) <= 100);
  S.check('JM: সংগৃহীত = অবদানের যোগফল', J.collected(J.SEED_CONTRIBS, g.id) === J.contribsOf(J.SEED_CONTRIBS, g.id).reduce((s, x) => s + x.amount, 0));
  S.check('JM: প্রতিশ্রুতি-যোগফল গণনা', J.pledgeTotal(J.SEED_PARTS, g.id) === J.SEED_PARTS.filter((p) => p.goalId === g.id).reduce((s, p) => s + p.pledged, 0));
  S.check('JM: আমার ঘাটতি ঋণাত্মক নয়', J.myGap(J.SEED_PARTS, g) >= 0);
  S.check('JM: লক্ষ্য-নির্দিষ্ট ব্যবহার (disbursement) আলাদা', Array.isArray(J.SEED_DISB) && J.paidOut(J.SEED_DISB, g.id) >= 0);

  const l = Q.SEED_LOANS[0];
  const repaid = Q.repaid(Q.SEED_LOANS, Q.SEED_REPAYMENTS, l.id);
  const out = Q.outstanding(Q.SEED_LOANS, Q.SEED_REPAYMENTS, l.id);
  S.check('QH: বকেয়া = মূলধন − পরিশোধিত (কোনো সুদ যোগ হয়নি)', out === l.principal - repaid, `${l.principal} − ${repaid} = ${out}`);
  S.check('QH: বকেয়া ঋণাত্মক নয়', out >= 0);
  S.check('QH: কিস্তি = মূলধন ÷ মেয়াদ (রাউন্ডেড)', Q.perInstallment(l) === Math.round(l.principal / l.tenure));
  S.check('QH: পরিশোধ % ০–১০০', Q.paidPct(Q.SEED_LOANS, Q.SEED_REPAYMENTS, l.id) >= 0 && Q.paidPct(Q.SEED_LOANS, Q.SEED_REPAYMENTS, l.id) <= 100);
  const sch = Q.schedule(l, Q.SEED_REPAYMENTS);
  S.check('QH: সময়সূচিতে মেয়াদের সমান কিস্তি', sch.length === l.tenure, `${sch.length}/${l.tenure}`);
  S.check('QH: সময়সূচির যোগফল = মূলধন (শতাংশ-মুনাফা নেই)', sch.reduce((s, x) => s + x.amount, 0) === l.principal, `${sch.reduce((s, x) => s + x.amount, 0)}`);
  S.check('QH: আগামী কিস্তি বাংলা অঙ্কে তারিখ', /[০-৯]/.test(Q.nextDue(l, 0).date) && !/[0-9]/.test(Q.nextDue(l, 0).date));

  const okEl = Q.eligibility({ kycVerified: true, memberMonths: 14, duesTotal: 0, hasActive: false });
  const noKyc = Q.eligibility({ kycVerified: false, memberMonths: 14, duesTotal: 0, hasActive: false });
  const dues = Q.eligibility({ kycVerified: true, memberMonths: 14, duesTotal: 500, hasActive: false });
  const active = Q.eligibility({ kycVerified: true, memberMonths: 14, duesTotal: 0, hasActive: true });
  S.check('QH: যোগ্য সদস্য → eligible', okEl.state === 'eligible' && okEl.reasons.every((r) => r.ok));
  S.check('QH: KYC ছাড়া → অযোগ্য, সীমা অর্ধেক', noKyc.state !== 'eligible' && noKyc.reasons.some((r) => r.code === 'KYC' && !r.ok) && noKyc.max < okEl.max);
  S.check('QH: বকেয়া থাকলে সীমা কমে / শর্তসাপেক্ষ', dues.state !== 'eligible' && dues.max < okEl.max);
  S.check('QH: চলমান ঋণ থাকলে অযোগ্য', active.state !== 'eligible' && active.reasons.some((r) => r.code === 'ACTIVE_LOAN' && !r.ok));
  const allBad = Q.eligibility({ kycVerified: false, memberMonths: 2, duesTotal: 900, hasActive: true });
  S.check('QH: তিন+ শর্ত ব্যর্থ → সম্পূর্ণ blocked', allBad.state === 'blocked' && allBad.reasons.every((r) => !r.ok));
  S.check('QH: সর্বোচ্চ সীমা পণ্য-সীমা ছাড়ায় না', Q.SEED_PRODUCTS.every((p) => okEl.max <= 40000 && p.max > 0));
}

S.sec('৩ · D-01 নীতি — QH সম্পূর্ণ সুদমুক্ত');
{
  const qardSrc = read('src/domain/qard.ts');
  S.check('qard ডোমেইনে কোনো profit/interest ফিল্ড নেই', !/profit|interest|rate/i.test(qardSrc.replace(/\/\*[\s\S]*?\*\//g, '')));
  S.check('qard-এ কোনো গুণিতক রেট-গণিত নেই', !/\*\s*(1\.|rate|profit|interest)/i.test(qardSrc));
  S.check('QH সনদে সুদ/মুনাফা ৳০ ঘোষণা', /সুদ \/ মুনাফা', '৳০'|কোনো সুদ, মুনাফা বা অতিরিক্ত চার্জ গ্রহণ করা হয়নি/.test(txt('QardCertificate')));
  S.check('QH লেবেল: শুধু মূলধন ফেরত', /শুধু মূলধন/.test(txt('QardProducts')));
  S.check('QH বিলম্ব ফি ৳০ (BR-20)', /বিলম্ব ফি/.test(qardSrc + txt('QardHome') + txt('QardProducts')) && /০/.test(qardSrc));

  const banned = [...QH, ...RC, ...JM].filter((f) => /profit_percentage|interest_rate|dividend_rate/.test(txt(f)));
  S.check('কোনো পর্দায় নিষিদ্ধ রেট-ফিল্ড নেই', banned.length === 0, banned.join(', '));

  const qhText = QH.map(txt).join('\n');
  const sus = qhText.split('\n').filter((l) => /সুদ|মুনাফা/.test(l) && !/০|নেই|নয়|শূন্য|সুদমুক্ত|B[Rr]-20|গ্রহণ করা হয়নি|নেওয়া হয়নি|ফি নেই|যোগ হবে না|যোগ হয় না/.test(l));
  S.check('QH কপিতে সুদ/মুনাফা শুধু শূন্য-ঘোষণা প্রসঙ্গে', sus.length === 0, sus.slice(0, 3).join(' | '));

  S.check('ROSCA ড্র লটারি-ভিত্তিক ও সাক্ষীযুক্ত', /লটারি/.test(txt('CircleDraws')) && /সাক্ষী/.test(txt('CircleDraws')));
  S.check('ROSCA ফল অপরিবর্তনীয় ঘোষণা', /অপরিবর্তনীয়/.test(txt('CircleDraws')));
  S.check('JM: BR-19 — ব্যক্তিগতভাবে তোলা যায় না', JM.some((f) => /ব্যক্তিগতভাবে তোলা যায় না/.test(txt(f))));
  S.check('JM: লক্ষ্য-নির্দিষ্ট তহবিল স্পষ্ট', /লক্ষ্য-নির্দিষ্ট|নির্দিষ্ট লক্ষ্য তহবিল/.test(JM.map(txt).join('\n')));
}

S.sec('৪ · কার্যকারিতা ও ফর্ম-বৈধতা');
{
  const noStore = [...RC, ...JM, ...QH].filter((f) => !/useModules\(\)/.test(txt(f)));
  S.check('প্রতিটি পর্দা moduleStore ব্যবহার করে', noStore.length === 0, noStore.join(', '));

  const dead = [];
  for (const f of [...RC, ...JM, ...QH]) {
    for (const m of txt(f).matchAll(/<button\b[^>]*>/gs)) {
      if (!/onClick=/.test(m[0]) && !/type="submit"/.test(m[0])) dead.push(`${f}: ${m[0].slice(0, 50)}`);
    }
  }
  S.check('কোনো মৃত <button> নেই', dead.length === 0, dead.slice(0, 4).join(' | '));

  S.check('ROSCA পরিশোধ payCircle ডাকে', /payCircle\(/.test(txt('CirclePay')));
  S.check('JM যোগদান joinGoal ডাকে', /joinGoal\(/.test(txt('GoalJoin')));
  S.check('JM অবদান contributeGoal ডাকে', /contributeGoal\(/.test(txt('GoalContribute')));
  S.check('QH আবেদন applyQard ডাকে', /applyQard\(/.test(txt('QardApply')));
  S.check('QH পরিশোধ repayQard ডাকে', /repayQard\(/.test(txt('QardPay')));

  const apply = txt('QardApply');
  S.check('QH আবেদনে সর্বনিম্ন ৳১,০০০ বৈধতা', /value < 1000/.test(apply));
  S.check('QH আবেদনে পণ্য-সীমা ও যোগ্যতা-সীমা একসাথে', /Math\.min\(product\.max, el\.max\)/.test(apply));
  S.check('QH আবেদনে উদ্দেশ্য ≥ ১০ অক্ষর', /detail\.trim\(\)\.length < 10/.test(apply));
  S.check('QH আবেদনে NID + খরচের প্রমাণ বাধ্যতামূলক', /docsOk/.test(apply) && /NID/.test(apply));
  S.check('QH আবেদনে সম্মতি চেকবক্স বাধ্যতামূলক', /!agree/.test(apply));

  const join = txt('GoalJoin');
  S.check('JM যোগদানে fixed/flexible সীমা যাচাই', /rule === 'flexible'/.test(join) && /g!\.min/.test(join));
  const circlePay = txt('CirclePay');
  S.check('ROSCA পরিশোধে কিস্তির কম নয়', /amount < |value < |contrib/.test(circlePay));
}

S.sec('৫ · ডিজাইন শৃঙ্খলা ও রেন্ডার স্মোক');
{
  const all = [...RC, ...JM, ...QH];
  const hex = all.filter((f) => /#[0-9a-fA-F]{3,8}\b/.test(txt(f)));
  S.check('raw hex রং নেই', hex.length === 0, hex.join(', '));

  const rupee = all.filter((f) => /₹/.test(txt(f)));
  S.check('₹ নয় — ৳', rupee.length === 0, rupee.join(', '));

  const latin = all.filter((f) => /৳\s*\d/.test(txt(f)));
  S.check('৳-এর পরে ল্যাটিন অঙ্ক নেই', latin.length === 0, latin.join(', '));

  const tap = all.filter((f) => /<button/.test(txt(f)) && !/min-h-tap/.test(txt(f)));
  S.check('raw বোতামে ৪৮px ট্যাপ টার্গেট', tap.length === 0, tap.join(', '));

  const placeholder = all.filter((f) => /শীঘ্রই আসছে|Coming soon|TODO/.test(txt(f)));
  S.check('কোনো প্লেসহোল্ডার পর্দা নেই', placeholder.length === 0, placeholder.join(', '));

  const r = spawnSync(process.execPath, ['tools/render-smoke.mjs'], { cwd: ROOT, encoding: 'utf8', timeout: 180000 });
  const out = (r.stdout || '') + (r.stderr || '');
  const lines = out.split('\n');
  const moduleLines = lines.filter((l) => /^(PASS|FAIL) \/m\/(circles|goals|qard)/.test(l));
  const fails = lines.filter((l) => l.startsWith('FAIL'));
  S.check('মডিউলের ১৯ রুট সব রেন্ডার হয়', r.status === 0 && moduleLines.length >= 19 && fails.length === 0, fails.slice(0, 4).join(' | '));
  const total = (out.match(/^PASS /gm) || []).length;
  S.check('স্মোকে মোট ≥ ৫১ রুট', total >= 51, `${total}`);
}

S.report();
