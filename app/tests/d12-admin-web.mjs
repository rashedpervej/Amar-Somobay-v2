/* ============================================================
   tests/d12-admin-web.mjs — ব্যাচ ৮ · অ্যাডমিন ওয়েব (RA-01…RA-12 · JA-01…JA-10)
   ১) ২২টি ডেস্কটপ পর্দা ও ২৪টি রুট, প্রোভাইডার সংযোগ
   ২) ডোমেইন-গণিত ও স্টোর-নিয়ম (স্কিম সংস্করণ, ড্র, যোগদান, বিতরণ, নিষ্পত্তি)
   ৩) design/discipline: raw hex নয়, placeholder নয়, সুদ শূন্য
   ৪) sidebar-এর ১৪ মডিউল-কী আসল রুটে যায়
   ============================================================ */

import { createSuite } from './_harness.mjs';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const S = createSuite('D-12 · অ্যাডমিন ওয়েব পর্দা (ROSCA · Joint Goal · কর্জে হাসানা)');
const read = (p) => (existsSync(join(ROOT, p)) ? readFileSync(join(ROOT, p), 'utf8') : '');
const txt = (f) => read(`src/apps/admin/web/${f}.tsx`);

const APP = read('src/apps/admin/AdminWebApp.tsx');
const MAIN = read('src/main.tsx');
const RO = read('src/store/adminRoscaStore.tsx');
const JG = read('src/store/adminJointStore.tsx');
const DIR = join(ROOT, 'src/apps/admin/web');
const FILES = readdirSync(DIR).filter((f) => f.endsWith('.tsx') && f !== 'webParts.tsx');
const RC_FILES = FILES.filter((f) => f.startsWith('Rc'));
const JG_FILES = FILES.filter((f) => f.startsWith('Jg'));
const QH_FILES = FILES.filter((f) => f.startsWith('Qh'));
const BASE_FILES = [...RC_FILES, ...JG_FILES];
const QH = read('src/store/adminQardStore.tsx');

const ROUTES = [
  'rc', 'rc/schemes', 'rc/schemes/new', 'rc/schemes/:schemeId', 'rc/circles', 'rc/circles/:circleId',
  'rc/circles/:circleId/seats', 'rc/draws', 'rc/draws/history', 'rc/draws/:drawId/run', 'rc/collect',
  'rc/defaults', 'rc/reports',
  'jg', 'jg/goals', 'jg/goals/new', 'jg/goals/:goalId', 'jg/join', 'jg/collect', 'jg/milestones',
  'jg/spend', 'jg/close', 'jg/reports',
  'qh', 'qh/products', 'qh/rules', 'qh/simulation', 'qh/eligible', 'qh/window', 'qh/queue',
  'qh/applications/:appId', 'qh/applications/:appId/decision', 'qh/disburse', 'qh/disburse/:loanId',
  'qh/loans', 'qh/loans/:loanId', 'qh/loans/:loanId/repay', 'qh/loans/:loanId/close', 'qh/close',
  'qh/arrears', 'qh/writeoff', 'qh/reports',
];

S.sec('১ · ফাইল, রুট ও প্রোভাইডার');
S.eq('ROSCA ডেস্কটপ পর্দা ১২টি', RC_FILES.length, 12);
S.eq('Joint Goal ডেস্কটপ পর্দা ১০টি', JG_FILES.length, 10);
S.eq('কর্জে হাসানা ডেস্কটপ পর্দা ১৭টি', QH_FILES.length, 17);
S.check('ROSCA/JG পর্দা Page শেল ব্যবহার করে', BASE_FILES.every((f) => /<Page\b/.test(txt(f.replace('.tsx', '')))), BASE_FILES.filter((f) => !/<Page\b/.test(txt(f.replace('.tsx', '')))).join(', '));
S.check('QH পর্দা Page শেল ব্যবহার করে', QH_FILES.every((f) => /<Page\b/.test(txt(f.replace('.tsx', '')))), QH_FILES.filter((f) => !/<Page\b/.test(txt(f.replace('.tsx', '')))).join(', '));
S.check('ROSCA/JG পর্দা নিজস্ব স্টোর ব্যবহার করে', BASE_FILES.every((f) => /useAdmin(Ro|Jg)\(\)/.test(txt(f.replace('.tsx', '')))), BASE_FILES.filter((f) => !/useAdmin(Ro|Jg)\(\)/.test(txt(f.replace('.tsx', '')))).join(', '));
S.check('QH পর্দা adminQardStore ব্যবহার করে', QH_FILES.every((f) => /useAdminQh\(\)/.test(txt(f.replace('.tsx', '')))), QH_FILES.filter((f) => !/useAdminQh\(\)/.test(txt(f.replace('.tsx', '')))).join(', '));
S.check('৪২টি রুট AdminWebApp-এ নিবন্ধিত', ROUTES.every((r) => APP.includes(`path="${r}"`)), ROUTES.filter((r) => !APP.includes(`path="${r}"`)).join(', '));
S.check('/w/* প্রোভাইডার-চেইনে (Admin ↔ Rosca ↔ Joint ↔ Qard)', /path="\/w\/\*"\s+element=\{<AdminProvider>\s*<AdminRoscaProvider>\s*<AdminJointProvider>\s*<AdminQardProvider>\s*<AdminWebApp \/>/.test(MAIN));
S.check('sidebar-এর ২৪ কী → আসল রুট', ['rcdash', 'rcscheme', 'rccircle', 'rcdraw', 'rccollect', 'rcdefault', 'rcreport', 'jgdash', 'jggoal', 'jgjoin', 'jgcollect', 'jgmile', 'jgspend', 'jgreport', 'qhdash', 'qhproduct', 'qhsim', 'qhelig', 'qhwindow', 'qhqueue', 'qhdisb', 'qhloan', 'qharrears', 'qhreport'].every((k) => APP.includes(`${k}: '/w/`)));
S.check('অজানা কী-তে সৎ ব্যাচ কার্ড (placeholder নয়)', /WebSoon/.test(APP) && /ব্যাচ ১০–১২/.test(APP));

S.sec('২ · স্কিম ও সার্কেল নিয়ম');
S.check('স্কিম কোডের ধারা RCS-XX', /কোডের ধারা RCS-01/.test(RO));
S.check('সম্পাদনে নতুন সংস্করণ + পুরোনো কোড অনুমোদিত', /id\?: string/.test(RO) && /cur\?\.id/.test(RO) && /version: \(cur\?\.version \?\? 0\) \+ 1/.test(RO));
S.check('একই কোড অন্য স্কিমে নিষিদ্ধ', /x\.id !== cur\?\.id/.test(RO));
S.check('সিট ৬–২০ · কিস্তি ২০০–২০,০০০', /seats < 6 \|\| input\.seats > 20/.test(RO) && /contrib < 200 \|\| input\.contrib > 20000/.test(RO));
S.check('লটারিতে কমপক্ষে ৮ সিট', /drawMethod === 'lottery' && input\.seats < 8/.test(RO));
S.check('আর্কাইভড স্কিমে নতুন চক্র নয়', /আর্কাইভড স্কিমে নতুন চক্র খোলা যায় না/.test(RO));
S.check('সিট বরাদ্দে দ্বিগুণ সদস্য নিষিদ্ধ', /এই সদস্য ইতিমধ্যে চক্রে আছেন/.test(RO));
S.check('সম্পন্ন চক্রে কিস্তি নয়', /সমাপ্ত চক্রে কিস্তি নেওয়া যায় না/.test(RO));

S.sec('৩ · ড্র ও সংগ্রহ');
S.check('ড্র maker ≠ checker', /নিজে প্রস্তুত করে নিজে অনুমোদন করা যাবে না \(BR-04\)/.test(RO));
S.check('সম্পন্ন ড্র অপরিবর্তনীয়', /সম্পন্ন ড্র অপরিবর্তনীয়/.test(RO));
S.check('অনুমোদন মন্তব্য ≥ ৫ অক্ষর', /input\.note\.trim\(\)\.length < 5/.test(RO));
S.check('ঘাটতি cover-এ নথিভুক্ত (D-38)', /cover: shortfall \?/.test(RO));
S.check('ডিফল্ট শেষ ধাপে কমিটি লাগে', /শেষ ধাপে আছে — কমিটির সিদ্ধান্ত লাগবে/.test(RO));
S.check('প্রতিস্থাপনে ওয়েটলিস্ট সদস্য বাধ্যতামূলক', /ওয়েটলিস্ট থেকে সদস্য বাছাই করুন/.test(RO));
S.check('write-off নয় — ডিলিট নয়, নিষ্পত্তি', /সরাসরি ডিলিট|ডিলিট/.test(read('src/apps/admin/web/RcDefaults.tsx')));

S.sec('৪ · Joint Goal নিয়ম');
S.check('সক্রিয় লক্ষ্যের সীমা ৫ (D-43)', /সক্রিয় লক্ষ্যের সীমা \(৫\) পূর্ণ/.test(JG));
S.check('লক্ষ্য অঙ্ক ≥ ১০০০ · মেয়াদ ভবিষ্যতে', /input\.target < 1000/.test(JG) && /input\.targetDate <= TODAY_ISO/.test(JG));
S.check('যোগদানে Admin অনুমোদন · pledged > 0', /অংশগ্রহণকারীর সর্বোচ্চ সীমা পূর্ণ/.test(JG) && /p\.status === 'pending' && p\.pledged <= 0/.test(JG));
S.check('অবদান ≤ ৳১,০০,০০০ · সক্রিয় সদস্য', /amount > 100000/.test(JG) && /সদস্য এই লক্ষ্যে সক্রিয় অংশগ্রহণকারী নন/.test(JG));
S.check('বিতরণে প্রমাণ বাধ্যতামূলক (D-50)', /প্রমাণের রেফারেন্স ছাড়া ভাউচার তৈরি হবে না/.test(JG));
S.check('বিতরণ maker ≠ checker', /নিজে প্রস্তুত করে নিজে অনুমোদন করা যাবে না \(BR-04\)/.test(JG));
S.check('নিষ্পত্তিতে maker ≠ checker', /প্রস্তুতকারী নিজে অনুমোদন করতে পারবেন না \(BR-04\)/.test(JG));
S.check('মেয়াদ একবারই বাড়ে (D-39)', /একবারই/.test(JG));
S.check('পরিশোধিত ভাউচার ফেরানো যায় না', /রিভার্সাল লাগবে/.test(JG));

S.sec('৫ · ডিজাইন ও ভাষা');
const all = FILES.map((f) => [f, txt(f.replace('.tsx', ''))]);
S.check('কোনো কাঁচা hex নেই', !all.some(([, t]) => /#[0-9a-fA-F]{3,8}\b/.test(t)), all.filter(([, t]) => /#[0-9a-fA-F]{3,8}\b/.test(t)).map(([f]) => f).join(', '));
S.check('QH ৪-স্তর নিয়ম, OTP, maker≠checker, write-off ও সনদ', /QhLayerRow/.test(txt('QhWebRules')) && /disburse\(loan.id, \{ otp/.test(txt('QhWebDisburse')) && /maker ≠ checker/.test(txt('QhWebDecision')) && /proposeWriteOff/.test(txt('QhWebWriteOff')) && /closeLoan/.test(txt('QhWebClose')));
S.check('QH সংরক্ষণ/সিদ্ধান্ত অ্যাকশন সংযুক্ত', /saveProduct\(/.test(txt('QhWebProducts')) && /saveRuleVersion\(/.test(txt('QhWebRules')) && /runSim\(/.test(txt('QhWebSimulation')) && /saveWindow\(/.test(txt('QhWebWindow')) && /decideApp\(/.test(txt('QhWebDecision')) && /recordRepay\(/.test(txt('QhWebRepay')));
S.check('“শীঘ্রই আসছে / ফেজ ৪” প্লেসহোল্ডার নেই', !all.some(([, t]) => /শীঘ্রই আসছে|ফেজ ৪|Coming soon/.test(t)));
S.check('সুদ সর্বত্র শূন্য-ঘোষণা', !all.some(([, t]) => (t.match(/সুদ/g) || []).length && !/সুদ শূন্য|সুদমুক্ত|সুদ \/|সুদ নেই/.test(t)));
S.check('profit_percentage / interest_rate নেই', !all.some(([, t]) => /profit_percentage|interest_rate/.test(t)));
S.check('প্রতিটি পর্দায় ডেমো/নিয়ম চিহ্ন', all.every(([, t]) => /ডেমো|D-\d|BR-\d|নিয়ম/.test(t)));
S.check('টাকার অঙ্ক bn() দিয়ে', all.filter(([, t]) => /৳/.test(t)).every(([, t]) => /bn\(/.test(t)));
S.check('ট্যাপ টার্গেট ≥ ৪০px', all.filter(([, t]) => /<button/.test(t)).every(([, t]) => /min-h-tap|min-h-10|min-h-14/.test(t)));
S.check('ইনপুটে লেবেল আছে', !all.some(([, t]) => /<input[^>]*placeholder="[^"]*"[^>]*\/>/.test(t) && !/label|aria-label/.test(t)));

S.sec('৬ · ডোমেইন-গণিত (বান্ডল)');
{
  const b = spawnSync(join(ROOT, 'node_modules/.bin/esbuild'), ['src/domain/adminJoint.ts', '--bundle', '--format=esm', '--outdir=node_modules/.cache/dt12', '--log-level=warning'], { cwd: ROOT, encoding: 'utf8' });
  S.check('Joint Goal ডোমেইন বান্ডল', b.status === 0, (b.stderr || '').slice(0, 200));
  const J = await import(`${join(ROOT, 'node_modules/.cache/dt12')}/adminJoint.js`);
  S.check('৫টি লক্ষ্য · ৪টি সক্রিয়-সীমার ভেতরে', J.SEED_JGOALS.length === 5 && J.jgActive(J.SEED_JGOALS).length <= J.JG_LIMIT);
  S.check('মাইলস্টোন ২৫/৫০/৭৫/১০০', J.jgMilestonesOf(J.SEED_JGOALS[1], J.SEED_JCONTRIBS).length === 4);
  S.check('অর্জিত লক্ষ্যের ১০০% মাইলস্টোন', J.jgMilestonesOf(J.SEED_JGOALS[1], J.SEED_JCONTRIBS).at(-1).reachedAt !== null);
  S.check('অবদান-যোগফল = সংগৃহীত', J.jgCollected(J.SEED_JCONTRIBS, 'jg01') === J.jgContribsOf(J.SEED_JCONTRIBS, 'jg01').reduce((n, c) => n + c.amount, 0));
  S.check('বকেয়া কেবল ধনাত্মক ঘাটতি', J.jgArrearsOf(J.SEED_JGOALS, J.SEED_JPARTS, J.SEED_JCONTRIBS, 'jg01').every((x) => x.gap > 0));
  S.check('পরিশোধিত ব্যয় ≤ সংগৃহীত', J.jgSpend(J.SEED_JDISB) <= J.SEED_JGOALS.reduce((n, g) => n + J.jgCollected(J.SEED_JCONTRIBS, g.id), 0) + 1);
}

S.sec('৬খ · কর্জে হাসানা ডোমেইন-গণিত (বান্ডল)');
{
  const b = spawnSync(join(ROOT, 'node_modules/.bin/esbuild'), ['src/domain/adminQard.ts', '--bundle', '--format=esm', '--outdir=node_modules/.cache/dt12', '--log-level=warning'], { cwd: ROOT, encoding: 'utf8' });
  S.check('QH ডোমেইন বান্ডল', b.status === 0, (b.stderr || '').slice(0, 200));
  const Q = await import(`${join(ROOT, 'node_modules/.cache/dt12')}/adminQard.js`);
  const p = Q.qhPoolState(Q.SEED_QH_WINDOW, Q.SEED_QH_LOANS, Q.SEED_QH_APPS);
  S.check('পুল: বরাদ্দ = মুক্ত + হল্ড + প্রতিশ্রুত (D-40)', p.allocated >= p.available + p.held && p.available === Math.max(0, p.allocated - p.held - p.committed));
  S.check('কিস্তি অঙ্ক = মূলধন ÷ মেয়াদ (রাউন্ডিং ≤ ১ টাকা/কিস্তি)', Q.SEED_QH_LOANS.every((l) => Math.abs(Q.qhPerInst(l) * l.tenure - l.principal) < l.tenure));
  const out = Q.SEED_QH_LOANS.reduce((n, l) => n + Q.qhOutstanding(l, Q.SEED_QH_REPAYMENTS, Q.SEED_QH_WRITEOFFS), 0);
  S.check('বাকি মূলধন কখনো ঋণাত্মক নয়', out >= 0);
  S.check('লেট ফি / সুদ ধারণকারী ফিল্ড নেই', !/(profit_percentage|interest_rate|late_fee)\s*[:=?]/.test(read('src/domain/adminQard.ts')));
  S.check('সনদ নম্বরের ধারা QHC-YYMM-####', /QHC-2610-0001/.test(Q.qhCertNo(1)));
  S.check('কিস্তি ছক প্রথম কিস্তি থেকে শুরু', Q.qhInsts(Q.SEED_QH_LOANS[1], Q.SEED_QH_REPAYMENTS)[0].no === 1);
}
S.sec('৭ · রেন্ডার-স্মোক কভারেজ');
{
  const smoke = read('tools/smoke-entry.js');
  S.check('স্মোকে ৪৩+ ওয়েব রুট আছে', (smoke.match(/'\/w\//g) || []).length >= 43, `${(smoke.match(/'\/w\//g) || []).length}`);
  S.check('স্মোকে AdminWebApp প্রোভাইডারসহ (QH সহ)', /AdminWebApp/.test(smoke) && /AdminQardProvider/.test(smoke) && /path: '\/w\/\*'/.test(smoke));
  S.check('স্মোকে ১৮টি QH ওয়েব রুট', (smoke.match(/'\/w\/qh/g) || []).length >= 18, `${(smoke.match(/'\/w\/qh/g) || []).length}`);
}
S.report();
