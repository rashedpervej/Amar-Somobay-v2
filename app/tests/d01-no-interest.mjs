/* ============================================================
   tests/d01-no-interest.mjs
   নীতি D-01 — সম্পূর্ণ সুদমুক্ত: policy engine unit test + স্ট্যাটিক স্ক্যান
   সীমা: বিলম্ব ফি/জরিমানা এই নীতির বাইরে (ব্যবহারকারীর সিদ্ধান্ত) — টেস্টে তা যাচাই করা হয়।
   ============================================================ */

import { createSuite } from './_harness.mjs';
import {
  POLICY, BANNED_FIELDS, ZERO_LOCKED_FIELDS, scanText, validateRecord, sanitizePlanPayload,
  qardRepaymentCheck, assertScheduleEqualsPrincipal,
} from '../src/lib/noInterest.mjs';
import { scanSourceTree } from '../src/lib/noInterestScan.mjs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync } from 'node:fs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const WORKSPACE = join(ROOT, '..');

const S = createSuite('D-01 · Zero-Interest Policy (সুদমুক্ত)');

/* ---------- ১. নীতি সংজ্ঞা ---------- */
S.sec('১ · নীতি সংজ্ঞা ও আওতা');
S.eq('নীতি আইডি', POLICY.id, 'D-01');
S.eq('আওতা = সব মডিউল', POLICY.scope, 'all-modules');
S.eq('চারটি মডিউল অন্তর্ভুক্ত', POLICY.modules.length, 4);
S.check('কর্জে হাসানা আওতায় আছে', POLICY.modules.includes('qard_hasanah'));
S.check('profit_percentage নিষিদ্ধ ফিল্ড তালিকায়', BANNED_FIELDS.includes('profit_percentage'));
S.check('interest_rate নিষিদ্ধ ফিল্ড তালিকায়', BANNED_FIELDS.includes('interest_rate'));
S.eq('শূন্য-লকড ফিল্ড (স্কিমা ভাঙবে না)', ZERO_LOCKED_FIELDS, ['profit_percentage']);
S.check('বিলম্ব ফি আওতার বাইরে বলে নথিভুক্ত', POLICY.outOfScope.some((x) => x.includes('বিলম্ব ফি')));
S.check('late_fee_amount নিষিদ্ধ তালিকায় নেই (ব্যবহারকারীর সিদ্ধান্ত)', !BANNED_FIELDS.includes('late_fee_amount'));
S.check('pending_fine নিষিদ্ধ তালিকায় নেই', !BANNED_FIELDS.includes('pending_fine'));
S.check('penalty_paid নিষিদ্ধ তালিকায় নেই', !BANNED_FIELDS.includes('penalty_paid'));

/* ---------- ২. পে-লোড পরিষ্কারকরণ ---------- */
S.sec('২ · sanitizePlanPayload() — Database/API স্তর');
{
  const src = {
    name: 'মাসিক সঞ্চয়',
    installment_amount: 1000,
    target_amount: 12000,
    duration_months: 12,
    late_fee_amount: 50,          // ← বৈধ (বিলম্ব ফি অপরিবর্তিত)
    profit_percentage: 10,        // ← নিষিদ্ধ মান
    interest_rate: 8,             // ← নিষিদ্ধ ফিল্ড
    scheme_type: 'savings',
  };
  const r = sanitizePlanPayload(src);
  S.eq('profit_percentage ০-এ বাঁধা', r.payload.profit_percentage, 0);
  S.check('interest_rate ফিল্ড সরানো হয়েছে', !('interest_rate' in r.payload));
  S.eq('late_fee_amount অক্ষত (স্পর্শ করা হয়নি)', r.payload.late_fee_amount, 50);
  S.eq('installment_amount অক্ষত', r.payload.installment_amount, 1000);
  S.eq('target_amount অক্ষত', r.payload.target_amount, 12000);
  S.eq('অবৈধ মানের সংখ্যা (profit_percentage:10 + interest_rate:8)', r.violations.length, 2);
  S.eq('compliant ফ্ল্যাগ', r.compliant, false);
  S.check('সরানো ফিল্ড নথিভুক্ত', r.removed.some((x) => x.field === 'interest_rate'));

  const zeroForeign = sanitizePlanPayload({ name: 'x', interest_rate: 0 });
  S.check('নিষিদ্ধ ফিল্ডের মান ০ হলে সরানো হয় কিন্তু লঙ্ঘন নয়', !('interest_rate' in zeroForeign.payload) && zeroForeign.violations.length === 0);
  S.eq('তবু compliant', zeroForeign.compliant, true);

  const clean = sanitizePlanPayload({ name: 'কর্জে হাসানা', profit_percentage: 0, late_fee_amount: 0 });
  S.eq('আগে থেকেই ০ হলে compliant', clean.compliant, true);
  S.eq('ফিল্ড না থাকলেও ০ বসানো হয় (DB CHECK-এর সঙ্গে সামঞ্জস্য)', clean.payload.profit_percentage, 0);

  const nested = sanitizePlanPayload({ profitPercent: 12, riba: 3, name: 'x' });
  S.check('profitPercent (camelCase) সরানো হয়েছে', !('profitPercent' in nested.payload));
  S.check('riba সরানো হয়েছে', !('riba' in nested.payload));

  const empty = sanitizePlanPayload({});
  S.eq('খালি পে-লোডেও শূন্য-লকড ফিল্ড বসে', empty.payload.profit_percentage, 0);
}

S.sec('৩ · validateRecord() — Validation স্তর');
{
  S.eq('profit_percentage=0 → কোনো লঙ্ঘন নেই', validateRecord({ profit_percentage: 0 }).length, 0);
  S.eq('profit_percentage=10 → ১টি লঙ্ঘন', validateRecord({ profit_percentage: 10 }).length, 1);
  S.eq('profit_percentage=null → গ্রহণযোগ্য (DB default)', validateRecord({ profit_percentage: null }).length, 0);
  S.check('interest_rate থাকলে লঙ্ঘন', validateRecord({ interest_rate: 0 }).length === 1);
  const v = validateRecord({ profit_percentage: 5 }, { label: 'somobay_plans' });
  S.check('লঙ্ঘনে উৎস লেবেল থাকে', v[0].label === 'somobay_plans' && /D-01/.test(v[0].reason));
}

/* ---------- ৪. কর্জে হাসানা পরিশোধ ---------- */
S.sec('৪ · কর্জে হাসানা — মূল ঋণের বাইরে কিছুই নয়');
{
  const ok = qardRepaymentCheck({ principal: 20000, totalRepaid: 5000, amount: 15000 });
  S.eq('ঠিক বাকি মূল পরিশোধ → ok', ok.ok, true);
  S.eq('পরিশোধের পর বাকি ০', ok.outstanding, 0);

  const over = qardRepaymentCheck({ principal: 20000, totalRepaid: 5000, amount: 15001 });
  S.eq('মূল ঋণের বেশি → প্রত্যাখ্যাত', over.ok, false);
  S.check('প্রত্যাখ্যানের কারণে D-01 উল্লেখ', /D-01/.test(over.reason));

  S.eq('ঋণাত্মক/শূন্য পরিশোধ → প্রত্যাখ্যাত', qardRepaymentCheck({ principal: 20000, amount: 0 }).ok, false);
  S.eq('NaN পরিশোধ → প্রত্যাখ্যাত', qardRepaymentCheck({ principal: 20000, amount: NaN }).ok, false);
  S.eq('মোট পরিশোধ মূল ঋণের বেশি হলে outstanding ০-এ বাঁধা', qardRepaymentCheck({ principal: 1000, totalRepaid: 1500, amount: 1 }).outstanding, 0);

  const sched = assertScheduleEqualsPrincipal({ principal: 20000, instalments: [{ amount: 5000 }, { amount: 5000 }, { amount: 5000 }, { amount: 5000 }] });
  S.eq('৪ কিস্তিতে মূল ঋণের হুবহু সমান', sched.ok, true);
  const bad = assertScheduleEqualsPrincipal({ principal: 20000, instalments: [{ amount: 5000 }, { amount: 5000 }, { amount: 5000 }, { amount: 5100 }] });
  S.eq('অতিরিক্ত ১০০ টাকা যুক্ত হলে ব্যর্থ', bad.ok, false);
  S.eq('পার্থক্য ধরা পড়ে', bad.difference, 100);
  S.check('কারণে D-01 উল্লেখ', /D-01/.test(bad.reason));
}

/* ---------- ৫. কপি/লেবেল স্ক্যান ---------- */
S.sec('৫ · scanText() — UI ও রিপোর্টের ভাষা');
{
  const hit = (t) => scanText(t).filter((h) => h.severity === 'error');
  S.check('"১০% মুনাফা" → লঙ্ঘন', hit('১০% মুনাফা').length === 1);
  S.check('"প্রত্যাশিত লভ্যাংশ হার: ১০% মুনাফা" → লঙ্ঘন', hit('প্রত্যাশিত লভ্যাংশ হার: ১০% মুনাফা').length >= 1);
  S.check('"interest charged monthly" → লঙ্ঘন', hit('interest charged monthly').length === 1);
  S.check('"ঋণের দাম" → লঙ্ঘন', hit('ঋণের দাম').length === 1);
  S.check('"রিবা ভিত্তিক হিসাব" → লঙ্ঘন', hit('রিবা ভিত্তিক হিসাব').length === 1);
  S.check('"সুদ নেওয়া হবে" → লঙ্ঘন', hit('সুদ নেওয়া হবে').length === 1);

  // অনুমোদিত (নেতিবাচক/শূন্য প্রসঙ্গ)
  for (const t of [
    'সুদমুক্ত ঋণ (কর্জে হাসানা)',
    '১০০% সুদমুক্ত নীতিমালা',
    'কোনো প্রকার সুদ বা বিলম্ব জরিমানা গ্রহণযোগ্য নয়',
    'সুদ ৳০ (BR-20)',
    'সুদমুক্ত ও শরিয়াহ সম্মত ঋণ সুবিধা',
    'Interest-free financial assistance',
    'Zero interest policy — no profit percentage',
    'এই মডিউলে কোনো সুদ নেই',
    'সম্পূর্ণ সুদবিহীন সহায়তা',
    'বিলম্ব ফি প্রযোজ্য হতে পারে',           // ব্যবহারকারীর সিদ্ধান্ত: বিলম্ব ফি বৈধ
    'বকেয়া জরিমানা ৳৫০',                    // জরিমানা বৈধ
  ]) {
    S.check(`অনুমোদিত: "${t.slice(0, 34)}"`, hit(t).length === 0, JSON.stringify(hit(t)));
  }

  const warn = scanText('সদস্য সঞ্চয়ের লভ্যাংশ ঘোষণা');
  S.check('লভ্যাংশ → warn (সিদ্ধান্ত বাকি D-01c, error নয়)', warn.some((h) => h.term === 'লভ্যাংশ' && h.severity === 'warn'));
  S.check('লভ্যাংশ error নয়', warn.filter((h) => h.severity === 'error').length === 0);
}

/* ---------- ৬. নতুন React ট্রি স্ক্যান ---------- */
S.sec('৬ · নতুন app/ ট্রি স্ক্যান (Phase 1 কোড)');
{
  // নীতি-স্তরের ফাইলগুলো বাদ: এগুলো নিষেধের *সংজ্ঞা* রাখে, তাই এদের নিজস্ব শব্দতালিকা
  // লঙ্ঘন নয়। বাকি সব ফাইল (UI, কম্পোনেন্ট, স্টাইল) কঠোরভাবে স্ক্যান হয়।
  const POLICY_LAYER = ['noInterest.mjs', 'noInterestScan.mjs', 'noInterest.d.mts', 'tenant.mjs', 'tenant.d.mts', 'money.mjs', 'money.d.mts'];
  const findings = scanSourceTree(join(ROOT, 'src'), { skip: ['node_modules', ...POLICY_LAYER] });
  const errors = findings.filter((f) => f.severity === 'error');
  const warns = findings.filter((f) => f.severity === 'warn');
  S.eq('app/src-এ error-স্তরের D-01 লঙ্ঘন ০', errors.length, 0);
  if (errors.length) errors.slice(0, 8).forEach((e) => S.note(`${e.file}:${e.line} [${e.term}] ${e.text}`));
  S.note(`warn (লভ্যাংশ/dividend) = ${warns.length} — সিদ্ধান্ত D-01c-এর অপেক্ষায়`);
}

/* ---------- ৭. বিদ্যমান প্রোটোটাইপ স্ক্যান ---------- */
S.sec('৭ · বিদ্যমান প্রোটোটাইপ স্ক্যান (সব মডিউল)');
{
  const dir = join(WORKSPACE, 'prototype');
  if (!existsSync(dir)) { S.note('prototype/ পাওয়া যায়নি — স্কিপ'); }
  else {
    const findings = scanSourceTree(dir, { exts: ['.js', '.css', '.html'], skip: ['tests', 'node_modules'] });
    const errors = findings.filter((f) => f.severity === 'error');
    const warns = findings.filter((f) => f.severity === 'warn');

    // পর্যালোচিত-নিরাপদ প্যাটার্ন: এগুলো সুদ প্রচার করে না, বরং সুদকে অস্বীকার/শূন্য দেখায়।
    // তালিকাটি ছোট ও নথিভুক্ত রাখা হয়েছে যাতে স্ক্যানার ঢিলে না হয়।
    const KNOWN_SAFE = [
      { re: /সুদমুক্ত · <s>সুদ<\/s> <em>৳০<\/em>/, why: 'সুদ কেটে দেওয়া (strikethrough) + ৳০ — সুদ শূন্য ঘোষণা' },
      { re: /সুদ-সম্পর্কিত ফিচার/, why: '"সুদ-সম্পর্কিত ফিচার: ০" — গণনা শূন্য দেখানোর স্ট্যাট' },
    ];
    const unreviewed = errors.filter((e) => !KNOWN_SAFE.some((k) => k.re.test(e.text)));
    S.eq('প্রোটোটাইপে (৪ মডিউল, ১৯৯ স্ক্রিন, JS+CSS+HTML) পর্যালোচনা-বহির্ভূত সুদ/মুনাফা লঙ্ঘন ০', unreviewed.length, 0);
    if (unreviewed.length) unreviewed.slice(0, 12).forEach((e) => S.note(`${e.file}:${e.line} [${e.term}] ${e.text}`));
    S.note(`পর্যালোচিত-নিরাপদ হিট = ${errors.length - unreviewed.length} (সুদ-অস্বীকারক কপি): ` +
      errors.filter((e) => KNOWN_SAFE.some((k) => k.re.test(e.text))).map((e) => `${e.file}:${e.line}`).join(', '));
    S.note(`warn (লভ্যাংশ/dividend) = ${warns.length}`);

    const rootHtml = join(WORKSPACE, 'index.html');
    if (existsSync(rootHtml)) {
      const { readFileSync } = await import('node:fs');
      const hits = scanText(readFileSync(rootHtml, 'utf8')).filter((h) => h.severity === 'error');
      S.eq('index.html (ল্যান্ডিং)-এ error-স্তরের লঙ্ঘন ০', hits.length, 0);
    }

    const specDir = join(WORKSPACE, 'specs');
    if (existsSync(specDir)) {
      const specHits = scanSourceTree(specDir, { exts: ['.md'] }).filter((f) => f.severity === 'error');
      S.note(`তথ্যমূলক: specs/*.md-তে ${specHits.length}টি শব্দ-স্তরের হিট (নীতি-আলোচনা; অ্যাপ কোড নয়)`);
    }
  }
}

/* ---------- ৮. Source A baseline ---------- */
S.sec('৮ · Source A (amar-somobay-v2) baseline ও patch যাচাই');
{
  const ref = join(WORKSPACE, 'reference', 'amar-somobay-v2');
  const patched = '/tmp/somobay-patched';
  if (!existsSync(ref)) {
    S.note('reference/amar-somobay-v2 নেই — baseline স্কিপ');
  } else {
    const base = scanSourceTree(join(ref, 'src'), { exts: ['.ts', '.tsx'] });
    const baseErr = base.filter((f) => f.severity === 'error');
    const fieldHits = baseErr.filter((f) => f.kind === 'field');
    const copyHits = baseErr.filter((f) => f.kind === 'copy');
    S.check('Source A-তে D-01 লঙ্ঘন রয়েছে (baseline প্রমাণ)', baseErr.length > 0, `মোট ${baseErr.length}`);
    S.check('profit_percentage ফিল্ড ব্যবহার ধরা পড়েছে', fieldHits.some((f) => f.term === 'profit_percentage'), `field hits ${fieldHits.length}`);
    S.check('মুনাফা কপি ধরা পড়েছে', copyHits.some((f) => f.term === 'মুনাফা'), `copy hits ${copyHits.length}`);
    S.note(`baseline: field=${fieldHits.length} copy=${copyHits.length}`);
    S.check('PlanManagement.tsx-এ লঙ্ঘন আছে', baseErr.some((f) => f.file.includes('PlanManagement.tsx')));
    S.check('SavingsInsights.tsx-এ লঙ্ঘন আছে', baseErr.some((f) => f.file.includes('SavingsInsights.tsx')));

    if (existsSync(patched)) {
      const after = scanSourceTree(join(patched, 'src'), { exts: ['.ts', '.tsx'] });
      const afterErr = after.filter((f) => f.severity === 'error');
      S.eq('patch প্রয়োগের পর Source A-এর src-এ D-01 error ০', afterErr.length, 0);
      if (afterErr.length) afterErr.slice(0, 10).forEach((e) => S.note(`${e.file}:${e.line} [${e.term}] ${e.text}`));
      S.check('patch-এর পর baseline-এর তুলনায় কমেছে', afterErr.length < baseErr.length);
    } else {
      S.note('/tmp/somobay-patched নেই — patch যাচাই স্কিপ (patches/ ডিরেক্টরিতে diff আছে; tests/run-all.mjs আগে patch তৈরি করে)');
    }
  }
}

S.report();
