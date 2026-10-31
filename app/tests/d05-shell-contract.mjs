/* ============================================================
   tests/d05-shell-contract.mjs — Phase 2 · শেল ও নেভিগেশন চুক্তি
   ১) প্রোটোটাইপের সাথে প্যারিটি (MNAV · ANAV · ADMIN_SHELLS) — লেবেল/ক্রম/সংখ্যা হুবহু
   ২) ৫-স্লট বটম নেভ ও কেন্দ্রীয় FAB-এর নিয়ম
   ৩) নীতি D-01: নেভিগেশন লেবেলে সুদ/মুনাফা-জাতীয় শব্দ নেই
   ৪) ডিজাইন-সিস্টেম শৃঙ্খলা: কাঁচা hex নেই, ট্যাপ টার্গেট ≥৪৮px, safe-area, ফন্ট
   ============================================================ */

import { createSuite } from './_harness.mjs';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const WS = join(ROOT, '..');
const S = createSuite('D-05 · শেল ও নেভিগেশন চুক্তি');

const read = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : '');
const PROTO = read(join(WS, 'prototype', 'assets', 'app.js'));
const MEMBER = read(join(ROOT, 'src', 'nav', 'member.ts'));
const ADM_M = read(join(ROOT, 'src', 'nav', 'adminMobile.ts'));
const ADM_W = read(join(ROOT, 'src', 'nav', 'adminWeb.ts'));
const BOTTOM = read(join(ROOT, 'src', 'components', 'shell', 'BottomNav.tsx'));
const MOBILE = read(join(ROOT, 'src', 'components', 'shell', 'MobileShell.tsx'));
const WEB = read(join(ROOT, 'src', 'components', 'shell', 'AdminWebShell.tsx'));
const TOKENS = read(join(ROOT, 'src', 'styles', 'tokens.css'));
const BASE = read(join(ROOT, 'src', 'styles', 'base.css'));
const INDEX = read(join(ROOT, 'index.html'));

const BN_CHAR = /[\u0980-\u09FF]/;
const labelsIn = (text) => [...text.matchAll(/label: '([^']+)'/g)].map((m) => m[1]);

/* প্রোটোটাইপ থেকে পড়া */
function protoArray(name) {
  const i = PROTO.indexOf(name);
  if (i < 0) return '';
  const j = PROTO.indexOf('[', i);
  let depth = 0;
  for (let k = j; k < PROTO.length; k++) {
    if (PROTO[k] === '[') depth++;
    else if (PROTO[k] === ']') {
      depth--;
      if (depth === 0) return PROTO.slice(j + 1, k);
    }
  }
  return '';
}
const protoLabels = (block) => [...block.matchAll(/l:\s*'([^']+)'/g)].map((m) => m[1]);

const PROTO_MNAV = protoArray('const MNAV =');
const PROTO_ANAV = protoArray('const ANAV =');

/* আমাদের TS থেকে পড়া */
const memberBlock = MEMBER.slice(MEMBER.indexOf('MEMBER_NAV'), MEMBER.indexOf('MEMBER_TAB_COUNT'));
const MEMBER_LABELS = labelsIn(memberBlock);

S.sec('১ · সদস্য অ্যাপ — প্রোটোটাইপ প্যারিটি');
S.eq('MNAV-এ ঠিক ৫টি লেবেল আছে', PROTO_MNAV ? protoLabels(PROTO_MNAV).length : 0, 5);
S.eq('আমাদের MEMBER_NAV-এ ঠিক ৫টি স্লট', MEMBER_LABELS.length, 5);
S.eq('লেবেল ও ক্রম প্রোটোটাইপের সাথে হুবহু', MEMBER_LABELS, protoLabels(PROTO_MNAV));
{
  const fabs = [...memberBlock.matchAll(/fab: true/g)].length;
  S.eq('MEMBER_NAV-এ ঠিক ১টি FAB', fabs, 1);
  const keys = [...memberBlock.matchAll(/key: '([^']+)'/g)].map((m) => m[1]);
  const fabIndex = memberBlock.split(/key: '/).findIndex((chunk) => chunk.includes('fab: true'));
  S.note(`স্লট: ${keys.join(' · ')}`);
  S.check('FAB মাঝের (৩য়) স্লটে', fabIndex === 3, `পাওয়া গেল ${fabIndex}`);
  const tos = [...memberBlock.matchAll(/to: '([^']+)'/g)].map((m) => m[1]);
  S.check('প্রতিটির গন্তব্য আছে (#m…)', tos.length === 5 && tos.every((t) => /^#m\d{2}$/.test(t)), tos.join(','));
}

S.sec('২ · অ্যাডমিন শেল — ৬টি, প্রতিটি ৫ স্লট');
{
  const roles = [...ADM_M.matchAll(/\n  ([A-Z_]+): \{/g)].map((m) => m[1]);
  const six = ['COLLECTOR', 'ACCOUNTANT', 'MANAGER', 'APPROVER', 'ORG_ADMIN', 'AUDITOR'];
  S.eq('ছয়টি শেল সংজ্ঞায়িত', roles.filter((r) => six.includes(r)), six);
  for (const r of six) {
    const start = ADM_M.indexOf(`  ${r}: {`);
    const next = roles
      .map((x) => ADM_M.indexOf(`  ${x}: {`))
      .filter((i) => i > start)
      .sort((a, b) => a - b)[0] ?? ADM_M.indexOf('\n};');
    const body = ADM_M.slice(start, next);
    const n = labelsIn(body).length;
    S.eq(`${r}: ঠিক ৫টি স্লট (নেভ + FAB)`, n, 5);
  }
  S.check('এলিয়াস EXTERNAL_AUDITOR → AUDITOR', /ADMIN_SHELLS\.EXTERNAL_AUDITOR\s*=\s*ADMIN_SHELLS\.AUDITOR/.test(ADM_M));
  S.check('এলিয়াস VIEWER → AUDITOR', /ADMIN_SHELLS\.VIEWER\s*=\s*ADMIN_SHELLS\.AUDITOR/.test(ADM_M));
  S.check('অজানা ভূমিকা ⇒ MANAGER (নীরব ডিফল্ট)', /resolveAdminShell[\s\S]{0,160}ADMIN_SHELLS\.MANAGER/.test(ADM_M));
  S.check('প্রোটোটাইপের ৬টি role কী-ও একই', ['COLLECTOR', 'ACCOUNTANT', 'MANAGER', 'APPROVER', 'ORG_ADMIN', 'AUDITOR'].every((r) => PROTO.includes(`${r}: { code:`)));
}

S.sec('৩ · অ্যাডমিন ওয়েব — সম্পূর্ণ ANAV (৯ গ্রুপ · ৪৯ আইটেম)');
{
  const groups = [...ADM_W.matchAll(/group: '([^']+)'/g)].map((m) => m[1]);
  const protoGroups = [...PROTO_ANAV.matchAll(/g:\s*'([^']+)'/g)].map((m) => m[1]);
  S.eq('গ্রুপের নাম ও ক্রম প্রোটোটাইপের সাথে হুবহু', groups, protoGroups);
  const items = labelsIn(ADM_W.slice(ADM_W.indexOf('ADMIN_WEB_NAV')));
  const protoItems = protoLabels(PROTO_ANAV);
  S.eq('আইটেম সংখ্যা ৪৯', items.length, 49);
  S.eq('প্রতিটি আইটেমের লেবেল ও ক্রম হুবহু', items, protoItems);
}

S.sec('৪ · নীতি D-01 — নেভিগেশন কপি');
{
  const all = [...MEMBER_LABELS, ...labelsIn(ADM_M), ...labelsIn(ADM_W)];
  const banned = ['সুদ', 'মুনাফা', 'রিবা', 'profit', 'interest', 'riba', 'dividend'];
  const hit = all.filter((l) => banned.some((b) => l.toLowerCase().includes(b.toLowerCase())));
  S.check('নেভিগেশনে সুদ/মুনাফা-জাতীয় শব্দ নেই', hit.length === 0, hit.join(', '));
  S.check('সব লেবেল বাংলায়', all.length > 0 && all.every((l) => BN_CHAR.test(l)));
}

S.sec('৫ · শেলের ডিজাইন-সিস্টেম শৃঙ্খলা');
{
  const shells = BOTTOM + MOBILE + WEB;
  const hex = shells.match(/#[0-9a-fA-F]{3,8}\b/g) || [];
  S.check('শেল কম্পোনেন্টে কাঁচা hex নেই (শুধু টোকেন)', hex.length === 0, hex.join(', '));
  S.check('বটম নেভ safe-area সম্মান করে', /env\(safe-area-inset-bottom\)/.test(BOTTOM));
  S.check('ট্যাপ টার্গেট টোকেন ব্যবহৃত (min-h-tap)', /min-h-tap/.test(BOTTOM));
  S.check('নেভ গ্রিড ৫ কলাম (repeat(n, 1fr))', /gridTemplateColumns:\s*`repeat\(\$\{items\.length\},\s*1fr\)`/.test(BOTTOM));
  S.check('ফ্লো মডেলে nav বন্ধ', /isFlow\s*&&|!isFlow\s*&&/.test(MOBILE) && /model === 'flow'/.test(MOBILE));
  S.check('aria-current সক্রিয় স্লটে', /aria-current=\{on \? 'page' : undefined\}/.test(BOTTOM));
  S.check('সাইডবার ডেস্কটপে স্থায়ী, মোবাইলে ড্রয়ার', /hidden lg:block/.test(WEB) && /lg:hidden/.test(WEB));
}

S.sec('৬ · টোকেন ও ফন্ট');
{
  S.check('--tap = 48px', /--tap:\s*48px/.test(TOKENS));
  S.check('base.css ট্যাপ টোকেন ব্যবহার করে', /min-height:\s*var\(--tap\)/.test(BASE));
  S.check('Hind Siliguri primary', /Hind\+Siliguri/.test(INDEX) && /'Hind Siliguri'/.test(TOKENS));
  S.check('Noto Sans Bengali fallback', /Noto\+Sans\+Bengali/.test(INDEX) && /'Noto Sans Bengali'/.test(TOKENS));
  S.check('ফন্ট লোড না হলেও পড়া যায় (display=swap)', /display=swap/.test(INDEX));
  S.check('ভিউপোর্ট safe-area (viewport-fit=cover)', /viewport-fit=cover/.test(INDEX));
}

S.report();
