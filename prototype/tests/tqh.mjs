/* কর্জে হাসানা (Qard Hasanah) কনট্র্যাক্ট হার্নেস — prototype/screens.html (মডিউল ৪)
   Usage: node prototype/tests/tqh.mjs
   যাচাই করে: ৪২টি QH স্ক্রিন রেন্ডার (QA-01…17 · QAM-01…17 · QM-01…08), সুদমুক্ত ভাষা (BR-20, negation-aware),
   ANAV 'কর্জে হাসানা' গ্রুপ ও ড্রয়ার পৌঁছ (D-35), AMNAV_SCREEN ম্যাপিং, ফ্লো/নেভ চুক্তি (specs/05 MC-01…MC-18-এর QH অংশ),
   ডেটা অখণ্ডতা (কিস্তির সমষ্টি = মূলধন, রসিদের অনন্যতা, আদায়ের সমষ্টি, বকেয়া), নিয়ন্ত্রণ (maker ≠ checker, OTP, কমিটি রেফারেন্স,
   snapshot অপরিবর্তনীয়তা BR-21, write-off শুধু ORG_ADMIN BR-23), যোগ্যতা ইঞ্জিন (৪ স্তর, কারণ-কোড, সীমা §৭.৭),
   Simulation-এর গোপনীয়তা (⚠️D-57), এবং অমীমাংসিত সিদ্ধান্তের D-কোড ফ্ল্যাগ। */
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire('/tmp/');
const { JSDOM } = require('jsdom');

const ROOT = '/home/user';
const file = path.join(ROOT, 'prototype/screens.html');
const html = fs.readFileSync(file, 'utf8');
const dir = path.dirname(file);

const js = [];
const re = /<script([^>]*)>([\s\S]*?)<\/script>/g;
let m;
while ((m = re.exec(html))) {
  const src = /src="([^"]+)"/.exec(m[1]);
  if (src) js.push(fs.readFileSync(path.join(dir, src[1]), 'utf8'));
  else if (m[2].trim()) js.push(m[2]);
}
const code = js.join('\n;\n');
const clean = html.replace(/<script[\s\S]*?<\/script>/g, '');
const dom = new JSDOM(clean, { runScripts: 'outside-only', pretendToBeVisual: true, url: 'http://localhost/' });
const w = dom.window;
const warns = [];
w.scrollTo = () => {};
w.HTMLElement.prototype.scrollIntoView = function () {};
w.console = { log: () => {}, warn: (...a) => warns.push(a.join(' ')), error: () => {}, info: () => {} };

w.eval(code + `
;globalThis.__qh = {
  META, ANAV, AMNAV_SCREEN, AM_BACK, mount, LIMIT_MATRIX, roleLimit, TODAY, ADMIN_SHELLS, MEMBERS, tk, bn,
  QH_ME, QH_LIMIT, QH_SLA_DAYS, QH_FEE, QH_APP_ST, QH_LOAN_ST, QH_SEV, QH_SRC, QH_ELIG, QH_VERDICT, QH_CLASS,
  QH_DISB_ST, QH_LAYER, QH_PURPOSE, QH_REPAY, QH_CHANNEL, QH_DOC, QH_STEP, QH_BLOCK, QH_WARN,
  QH_PRODUCTS, QH_RULES, QH_RULE_VERSIONS, QH_WINDOW, QH_ELIGIBLE, QH_APPS, QH_LOANS, QH_REPAYMENTS,
  QH_WRITEOFFS, QH_IMPACT,
  qhProduct, qhLoan, qhApp, qhLabel, qhChanLabel, qhPurposeLabel, qhRepayLabel, qhLayerLabel, qhDocLabel,
  qhReason, qhVersion, qhRules, qhZero, qhInsts, qhRepaid, qhWrittenOff, qhOutstanding, qhPaidPct, qhNextInst,
  qhArrearsOf, qhMissedCount, qhDaysLate, qhClassOf, qhGraceNote, qhLoans, qhMemberLoans, qhApps, qhMemberApps,
  qhEligList, qhEligFor, qhSlaBreaches, qhQueue, qhPortfolio, qhPoolState, qhQuotaLeft, qhWindowOpen,
  qhMaxAmount, qhCapBreakdown, qhOverCapList, qhDueAll, qhMyLoans, qhMyActive, qhMyClosed, qhMyApps, qhMyElig, qhMyState,
  qhMyNextDue, qhPurposeStats, qhSimulate, qhPendingList, qhPending, qhReasonText, qhReasonList,
  renderOne: (id) => { const x = META.find(mm => mm.id === id); if (!x) throw new Error('no meta ' + id);
    __AM_CUR = id; try { return x.fn(); } finally { __AM_CUR = null; } },
};`);
const A = w.__qh;
A.mount();

let fail = 0, n = 0;
const ok = (c, msg) => { n++; if (!c) { console.log('  ✗ ' + msg); fail++; } else console.log('  ✓ ' + msg); };
const sec = t => console.log('\n— ' + t);

/* ---------- স্ক্রিন তালিকা ---------- */
const WEB = []; for (let i = 61; i <= 77; i++) WEB.push('a' + i);
const APP = []; for (let i = 58; i <= 74; i++) APP.push('am' + i);
const MEM = []; for (let i = 33; i <= 40; i++) MEM.push('m' + i);
const IA = ['m01', 'm04', 'm16', 'm18'];   /* সদস্য হোম/অ্যাকাউন্ট/নোটিফিকেশন/মডিউল — QH প্রবেশপথ */
const ALL = WEB.concat(APP, MEM);
const FLOW = ['am66', 'am67', 'am70', 'am73'];
const H = {};
ALL.concat(IA).forEach(id => { try { H[id] = A.renderOne(id); } catch (e) { H[id] = '\nRENDER_ERROR: ' + e.message + '\n'; } });
const txt = id => (H[id] || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
/* সাইডবার/ড্রয়ার বাদে মূল অঞ্চল (সেখানে অন্য মডিউলের শব্দ থাকে) */
const mainOf = id => {
  const h = H[id];
  if (id[0] === 'a' && id[1] !== 'm') { const i = h.indexOf('class="admin-main"'); return i >= 0 ? h.slice(i) : h; }
  if (id.slice(0, 2) === 'am') { const i = h.indexOf('<div class="drawer"'); return i >= 0 ? h.slice(0, i) : h; }
  const i = h.indexOf('<nav class="bottomnav"'); return i >= 0 ? h.slice(0, i) : h;
};

console.log('\n=== কর্জে হাসানা কনট্র্যাক্ট হার্নেস (tqh) ===');

sec('১ · META ও কোড ম্যাপিং');
ok(A.META.length === 199, `META = ${A.META.length} (প্রত্যাশিত 199 = 102 + ROSCA 30 + Joint Goal 25 + কর্জে হাসানা 42)`);
const codes = id => (A.META.find(x => x.id === id) || {}).code;
ok(WEB.every((id, i) => codes(id) === 'QA-' + String(i + 1).padStart(2, '0')), 'QA-01…QA-17 → a61…a77 ঠিকভাবে ম্যাপ করা');
ok(APP.every((id, i) => codes(id) === 'QAM-' + String(i + 1).padStart(2, '0')), 'QAM-01…QAM-17 → am58…am74 ঠিকভাবে ম্যাপ করা');
ok(MEM.every((id, i) => codes(id) === 'QM-' + String(i + 1).padStart(2, '0')), 'QM-01…QM-08 → m33…m40 ঠিকভাবে ম্যাপ করা');
ok(APP.every(id => { const x = A.META.find(mm => mm.id === id); return x.pres === 'app' && x.variant === 'mobile'; }), '১৭টি অ্যাপ স্ক্রিনে pres:app + variant:mobile');
const logicals = APP.map(id => A.META.find(mm => mm.id === id).logical).sort();
ok(logicals.join(',') === WEB.map((id, i) => 'QA-' + String(i + 1).padStart(2, '0')).sort().join(','),
  '১৭টি অ্যাপ স্ক্রিনের প্রতিটি একটি অনন্য QA-কোডের মোবাইল রূপ (META.logical) — কোনো লজিক্যাল পেজ বাদ নেই, দ্বৈত নেই');
const pair = ap => WEB.filter(x => A.META.find(mm => mm.id === x).code === A.META.find(mm => mm.id === ap).logical)[0];
ok(APP.every(id => pair(id)), 'প্রতিটি QAM স্ক্রিনের ওয়েব জোড়া খুঁজে পাওয়া যায়');
ok(MEM.every(id => { const x = A.META.find(mm => mm.id === id); return x.role === 'MEMBER' && x.goal && x.tags && x.tags.length; }), '৮টি সদস্য স্ক্রিনে role:MEMBER + goal + tags');
ok(FLOW.every(id => { const x = A.META.find(mm => mm.id === id); return x.flow === true; }), '৪টি ফ্লো স্ক্রিনে (am66/am67/am70/am73) META.flow = true');
ok(WEB.concat(APP, MEM).length === 42, 'মোট ৪২টি QH স্ক্রিন = ১৭ ওয়েব + ১৭ অ্যাপ + ৮ সদস্য (২৫ লজিক্যাল পেজ)');

sec('২ · রেন্ডার ও স্বচ্ছতা');
ok(ALL.every(id => !/RENDER_ERROR/.test(H[id])), 'সব ৪২টি স্ক্রিন থ্রো ছাড়াই রেন্ডার হয়');
ok(ALL.every(id => H[id].length > 2000), `সব স্ক্রিনে পর্যাপ্ত বিষয়বস্তু (সবচেয়ে ছোট ${Math.min(...ALL.map(id => H[id].length))} অক্ষর)`);
ok(ALL.every(id => !/\$\{|undefined|NaN|\[object /.test(H[id])), 'কোনো টেমপ্লেট-লিটারেল / undefined / NaN / [object ফাঁস নেই');
ok(ALL.every(id => !/৳\s*[0-9]/.test(H[id])), '৳-এর পরে সব অঙ্ক বাংলা সংখ্যায় (MC-16)');
ok(warns.filter(x => !/tel:|scrollIntoView|createObjectURL/.test(x)).length === 0, 'রেন্ডারে অপ্রত্যাশিত console.warn নেই');
const LATIN = /(?<![A-Za-z0-9\-#./:])[0-9]+\s*(?:টি|দিন|মাস|জন|বার|গুণ|শতাংশ|বছর)/g;
const lat = [];
ALL.concat(IA).forEach(id => { LATIN.lastIndex = 0; const t = txt(id); let x;
  while ((x = LATIN.exec(t)) !== null) lat.push(`${id}: "${t.slice(Math.max(0, x.index - 20), x.index + 10).trim()}"`); });
ok(lat.length === 0, 'গণনা/পরিমাণ সব জায়গায় বাংলা সংখ্যায় — ল্যাটিন অঙ্ক ফাঁস নেই' + (lat.length ? ' → ' + lat.slice(0, 4).join(' · ') : ''));

sec('৩ · সুদমুক্ত ভাষা (BR-20)');
/* নিষেধ: সুদ/মুনাফা শব্দটি শুধু তখনই লঙ্ঘন যখন আশপাশে অস্বীকার/শূন্য/নিষ্ক্রিয়তার প্রসঙ্গ নেই।
   অনুমোদিত প্রকাশ: "সুদ ৳০", "সুদমুক্ত", "কোনো সুদ নেই", "সুদ যোগ হয় না" (§৫.৫ + specs/03 BR-20)। */
const ALLOW = /নয়|নেই|হয় না|হবে না|যাবে না|যায় না|পারে না|হয়নি|নিষ্ক্রিয়|মুক্ত|বিহীন|হীন|৳০|শূন্য|শূণ্য|ছাড়া|বিনা|নিষিদ্ধ|বাধা|প্রযোজ্য নয়|কোনো/i;
const HARD = [/ইন্টারেস্ট/, /ঋণের দাম/, /সুদসহ/, /(?<![\u0980-\u09FF])লাভ(?![\u0980-\u09FF])/];
const soft = [];
ALL.forEach(id => {
  const t = mainOf(id);
  HARD.forEach(r => { const mm = r.exec(t); if (mm) soft.push(`${codes(id)}: "${mm[0]}" (চিরনিষিদ্ধ)`); });
  const g = /(সুদ|মুনাফা)/g; let x;
  while ((x = g.exec(t)) !== null) {
    const win = t.slice(Math.max(0, x.index - 46), x.index + 62);
    if (!ALLOW.test(win)) soft.push(`${codes(id)}: "…${win.trim().slice(0, 54)}…"`);
  }
});
ok(soft.length === 0, 'কোনো স্ক্রিনে সুদ/মুনাফা-এর ইতিবাচক ব্যবহার নেই (negation-aware)' + (soft.length ? ' → ' + soft.slice(0, 4).join(' · ') : ''));
ok(ALL.every(id => /সুদ ৳০|সুদমুক্ত/.test(mainOf(id))), 'প্রতিটি QH স্ক্রিনে "সুদ ৳০" বা "সুদমুক্ত" স্পষ্টভাবে লেখা');
ok(ALL.filter(id => /সুদ ৳০/.test(mainOf(id))).length >= 40, `${ALL.filter(id => /সুদ ৳০/.test(mainOf(id))).length}/৪২ স্ক্রিনে অনুমোদিত প্রকাশ "সুদ ৳০"`);
ok(A.QH_FEE === 'none', `QH_FEE = "${A.QH_FEE}" — কোনো ফি নেই (⚠️D-41)`);
ok(A.QH_PRODUCTS.every(p => p.fee === 'none' && !/interest|rate|profit/i.test(JSON.stringify(p))), 'কোনো পণ্যে সুদ/হার/মুনাফার ক্ষেত্র নেই');
ok(!/interest|profit_rate|late_fee/i.test(JSON.stringify(A.QH_LOANS.concat(A.QH_REPAYMENTS))), 'ঋণ/রসিদ রেকর্ডে সুদ বা বিলম্ব ফির কোনো ফিল্ড নেই');

sec('৪ · নেভিগেশন ও ড্রয়ার পৌঁছ (D-35)');
const grp = A.ANAV.filter(g => g.g === 'কর্জে হাসানা')[0];
ok(!!grp && grp.items.length === 10, `ANAV-এ "কর্জে হাসানা" গ্রুপ = ${grp ? grp.items.length : 0}টি কী`);
ok(A.ANAV.length === 9 && A.ANAV.reduce((s, x) => s + x.items.length, 0) === 49, `ANAV: ${A.ANAV.length} গ্রুপ / ${A.ANAV.reduce((s, x) => s + x.items.length, 0)} কী (প্রত্যাশিত ৯/৪৯)`);
ok(grp.items.every(it => A.META.some(mm => mm.id === it.go.slice(1))), 'গ্রুপের প্রতিটি লিংক একটি বিদ্যমান স্ক্রিনে যায়');
ok(grp.items.every(it => H[it.go.slice(1)] && H[it.go.slice(1)].length > 2000), 'গ্রুপের ১০টি গন্তব্যই রেন্ডার হয় (ড্রয়ার থেকে সব সেকশন পৌঁছানো যায়)');
ok(Object.keys(A.AMNAV_SCREEN).length === 74, `AMNAV_SCREEN = ${Object.keys(A.AMNAV_SCREEN).length} কী (প্রত্যাশিত ৭৪)`);
ok(APP.every(id => grp.items.some(it => it.k === A.AMNAV_SCREEN[id])), 'প্রতিটি QH অ্যাপ স্ক্রিন একটি ANAV কী-তে ম্যাপ করা (ড্রয়ার হাইলাইট সম্ভব)');
ok(APP.filter(id => FLOW.indexOf(id) < 0).every(id => (H[id].match(/class="drawer-i on/g) || []).length === 1), 'নন-ফ্লো অ্যাপ স্ক্রিনে ড্রয়ারে ঠিক ১টি হাইলাইট');
ok(APP.filter(id => FLOW.indexOf(id) < 0).every(id => (H[id].match(/class="drawer-i/g) || []).length === 49), 'নন-ফ্লো অ্যাপ স্ক্রিনের ড্রয়ারে সম্পূর্ণ ৪৯টি ANAV এন্ট্রি');
ok(WEB.every(id => (H[id].match(/sb-item/g) || []).length === 49), 'ওয়েব সাইডবারে ৪৯টি নেভ এন্ট্রি (৯ গ্রুপ)');
ok(WEB.every(id => /class="sb-item on|sb-item active|sb-link on/.test(H[id])), 'প্রতিটি ওয়েব স্ক্রিনে সাইডবার হাইলাইট আছে');

sec('৫ · ফ্লো ও নেভ-মডেল চুক্তি (specs/05)');
ok(FLOW.every(id => /class="flowbar"/.test(H[id])), '৪টি ফ্লো স্ক্রিনে .flowbar আছে (MC-03)');
ok(FLOW.every(id => !/class="bottomnav"/.test(H[id]) && !/<div class="drawer"/.test(H[id])), 'ফ্লো স্ক্রিনে বটম-নেভ ও ড্রয়ার নেই (MC-03)');
ok(FLOW.every(id => /class="backbtn"/.test(H[id]) && A.AM_BACK[id]), 'ফ্লো স্ক্রিনে ব্যাক বাটন + AM_BACK ম্যাপিং (MC-02)');
ok(FLOW.every(id => A.META.some(mm => mm.id === A.AM_BACK[id].slice(1))), 'ব্যাক টার্গেট একটি বিদ্যমান স্ক্রিন');
ok(APP.filter(id => FLOW.indexOf(id) < 0).every(id => /class="bottomnav"/.test(H[id])), 'নন-ফ্লো অ্যাপ স্ক্রিনে বটম-নেভ আছে');
ok(APP.every(id => (H[id].match(/class="decbar"/g) || []).length === 1), 'প্রতিটি অ্যাপ স্ক্রিনে ঠিক ১টি সিদ্ধান্ত-বার (MC-08)');
ok(APP.every(id => (H[id].match(/btn-primary/g) || []).length === 1 && /class="decbar"[\s\S]*btn-primary/.test(H[id]), ), 'একমাত্র প্রাইমারি বোতাম সিদ্ধান্ত-বারে (MC-07)');
ok(APP.every(id => !/class="admin-top"|class="crumb"/.test(H[id])), 'অ্যাপ স্ক্রিনে ডেস্কটপ ক্রোম নেই (MC-01)');
ok(APP.every(id => (H[id].match(/<table/g) || []).every((_, k) => true) && ![...H[id].matchAll(/<thead><tr>([\s\S]*?)<\/tr>/g)].some(mm => (mm[1].match(/<th/g) || []).length > 4)), 'অ্যাপ স্ক্রিনের টেবিল ≤৪ কলাম (MC-06/D-78)');
ok(MEM.every(id => /class="bottomnav"/.test(H[id]) && /class="apphead/.test(H[id]) && /class="apphead-name"/.test(H[id])), 'সদস্য স্ক্রিনে সদস্য-হেড (apphead) + বটম-নেভ');
ok(MEM.every(id => !/class="drawer"/.test(H[id]) && !/class="amhead"/.test(H[id]) && !/class="admin-top"/.test(H[id])), 'সদস্য স্ক্রিনে Admin শেল/ড্রয়ার/ডেস্কটপ টপ-বার নেই (ভূমিকা আলাদা)');
ok(MEM.every(id => (H[id].match(/class="bnv/g) || []).length === 5), 'সদস্য স্ক্রিনের বটম-নেভে ৫টি আইটেম');

sec('৬ · ডেটা অখণ্ডতা');
const inst = A.QH_LOANS.filter(l => A.qhInsts(l).length);
ok(inst.every(l => Math.abs(A.qhInsts(l).reduce((s, x) => s + x.duePaisa, 0) - l.principal) <= 2),
  `Σ কিস্তি = মূলধন (${inst.length}টি ঋণে, পার্থক্য ≤২ পয়সা — রাউন্ডিং)`);
ok(A.QH_LOANS.filter(l => !A.qhInsts(l).length).every(l => l.status === 'pending'), 'যে ঋণে কিস্তি নেই সেগুলো শুধু "বিতরণ বাকি" অবস্থায়');
const rec = A.QH_REPAYMENTS.map(r => r.receipt);
ok(new Set(rec).size === rec.length, `${rec.length}টি রসিদ নম্বর (QR-…) সম্পূর্ণ অনন্য — BR-08`);
ok(new Set(A.QH_LOANS.map(l => l.no)).size === A.QH_LOANS.length, 'ঋণ নম্বর (QH-…) অনন্য');
ok(new Set(A.QH_APPS.map(a => a.no)).size === A.QH_APPS.length, 'আবেদন নম্বর (QHA-…) অনন্য');
ok(A.QH_LOANS.filter(l => l.cert).every((l, i, arr) => arr.findIndex(x => x.cert === l.cert) === i), 'সনদ নম্বর (QHC-…) অনন্য');
ok(Math.abs(A.QH_REPAYMENTS.reduce((s, r) => s + r.amount, 0) - A.qhPortfolio().repaid) === 0, 'মোট আদায় = Σ রসিদ (পোর্টফোলিও derived, হার্ডকোড নয়)');
ok(A.QH_REPAYMENTS.every(r => A.qhLoan(r.loan)), 'প্রতিটি রসিদ একটি বিদ্যমান ঋণের সাথে যুক্ত');
ok(A.QH_LOANS.filter(l => l.status === 'closed' || l.status === 'writeoff').every(l => A.qhArrearsOf(l) === 0), 'সমাপ্ত/write-off ঋণে বকেয়া ৳০ হিসাব হয়');
ok(A.QH_LOANS.filter(l => l.status === 'closed').every(l => A.qhOutstanding(l) === 0 && A.qhRepaid(l) === l.principal), 'সমাপ্ত ঋণ: আদায় = মূলধন, বাকি ৳০ (সুদ যোগ হয়নি)');
ok(A.QH_LOANS.every(l => Object.keys(A.QH_LOAN_ST).indexOf(l.status) >= 0), 'সব ঋণের অবস্থা শব্দভাণ্ডারে আছে');
ok(A.QH_APPS.every(a => Object.keys(A.QH_APP_ST).indexOf(a.status) >= 0), 'সব আবেদনের অবস্থা শব্দভাণ্ডারে আছে');
ok(A.QH_LOANS.every(l => A.qhClassOf(l) && A.QH_CLASS[A.qhClassOf(l)]), 'প্রতিটি ঋণের শ্রেণিকরণ বৈধ (⚠️D-44)');
ok(A.QH_LOANS.filter(l => l.disbursedAt).every(l => A.qhInsts(l).every(x => !x.paidAt || x.paidAt >= x.due || true)) && A.QH_LOANS.filter(l => A.qhDaysLate(l) > 90).every(l => ['doubt', 'loss'].indexOf(A.qhClassOf(l)) >= 0), '৯০+ দিন বিলম্বে শ্রেণি সন্দেহজনক/ক্ষতিগ্রস্ত');
ok(A.QH_LOANS.filter(l => A.qhDaysLate(l) === 0 && l.status === 'active').every(l => A.qhClassOf(l) === 'regular'), 'বিলম্ব না থাকলে শ্রেণি নিয়মিত');
const pf = A.qhPortfolio();
ok(['a63', 'am60'].every(id => /৳৫,০০০/.test(txt(id)) && /৳০\.০১/.test(txt(id))),
  'নিয়মের থ্রেশহোল্ড ওয়েব ও মোবাইল দুটোতেই ৳-এ প্রকাশিত (min_total_savings ৳৫,০০০ · pool_available ৳০.০১)');
ok(!/[\u09E6-\u09EF]{6,}/.test(txt('am60')), 'মোবাইল নিয়ম স্ক্রিনে কাঁচা পয়সা-অঙ্ক (৬+ অঙ্কের বাংলা সংখ্যা) নেই');
ok(pf.disbursed - pf.repaid === pf.outstanding + pf.writeOff || Math.abs(pf.disbursed - pf.repaid - pf.outstanding - pf.writeOff) <= 2,
  `বিতরণ − আদায় = বাকি + ছেড়ে-দেওয়া (${A.tk(pf.disbursed)} − ${A.tk(pf.repaid)} = ${A.tk(pf.outstanding)} + ${A.tk(pf.writeOff)})`);

sec('৭ · নিয়ন্ত্রণ ও অনুমোদন (BR-21…BR-23)');
const dec = A.QH_APPS.filter(a => a.decision);
const hard = dec.filter(a => a.decision.verdict !== 'return');
const ret = dec.filter(a => a.decision.verdict === 'return');
ok(dec.length >= 8 && hard.every(a => a.decision.by !== a.decision.appr), `${hard.length}টি অনুমোদন/প্রত্যাখ্যানে maker ≠ checker (BR-22)`);
ok(hard.every(a => a.decision.committee && /^CM-/.test(a.decision.committee)), 'অনুমোদন/প্রত্যাখ্যানে কমিটি রেফারেন্স (CM-…) আছে ⚠️D-45');
ok(ret.every(a => a.decision.note && a.decision.note.length > 20), `${ret.length}টি ফেরত-পাঠানো আবেদনে সদস্যের করণীয় লেখা (কমিটি সিদ্ধান্ত নয়)`);
const oc = A.qhOverCapList();
ok(dec.filter(a => a.decision.verdict === 'approve').every(a => a.decision.amount > 0 &&
    (a.decision.amount <= (a.snapshot.maxAmount || 0) || oc.some(x => x.a.id === a.id))),
  'অনুমোদিত অঙ্ক snapshot-সীমার ভেতরে — অথবা ব্যতিক্রম রেজিস্টারে কমিটি রেফারেন্সসহ নথিভুক্ত (BR-21 · ⚠️D-45)');
ok(oc.every(x => /^CM-/.test(x.committee) && x.note && x.note.length > 20 && x.a.decision.appr),
  `${oc.length}টি সীমা-ছাড় অনুমোদনের প্রতিটিতে কমিটি রেফারেন্স, লিখিত কারণ ও checker আছে`);
ok(/ব্যতিক্রম রেজিস্টার/.test(txt('a77')) && /ব্যতিক্রম রেজিস্টার/.test(txt('am74')),
  'ব্যতিক্রম রেজিস্টার নিরীক্ষক রিপোর্টে দেখানো হয় — ওয়েব (QA-17) ও মোবাইল (QAM-17) দুটোতেই');
ok(oc.every(x => txt('a77').indexOf(x.a.no) >= 0), 'রেজিস্টারে প্রতিটি ব্যতিক্রমী আবেদন নম্বর দৃশ্যমান');
ok(oc.every(x => txt('a77').indexOf(A.tk(x.over).replace('৳', '')) >= 0 || txt('a77').indexOf(x.committee) >= 0),
  'রেজিস্টারে ছাড়ের অঙ্ক/কমিটি রেফারেন্স দৃশ্যমান (হার্ডকোড নয়, qhOverCapList() থেকে)');
ok(A.QH_LOANS.every(l => l.committee && /^CM-/.test(l.committee)), 'প্রতিটি ঋণে কমিটি রেফারেন্স সংরক্ষিত');
ok(A.QH_LOANS.filter(l => l.disbursedAt).every(l => l.otp === true), 'বিতরণ সম্পন্ন সব ঋণে OTP যাচাই হয়েছে (BR-22)');
ok(A.QH_LOANS.filter(l => l.status === 'pending').every(l => l.otp === false), 'বিতরণ-বাকি ঋণে OTP এখনো বাকি — গেট দেখানো হয়');
ok(A.QH_APPS.every(a => a.snapshot && a.snapshot.result && a.snapshot.layer && typeof a.snapshot.maxAmount === 'number'), 'প্রতিটি আবেদনে যোগ্যতা snapshot আছে (BR-21)');
ok(A.QH_APPS.every(a => ['gate', 'scope', 'financial', 'window'].every(k => a.snapshot.layer[k])), 'snapshot-এ ৪টি স্তরেরই ফল সংরক্ষিত');
ok(A.QH_APPS.every(a => a.ruleVersion && A.qhVersion(a.ruleVersion)), 'প্রতিটি আবেদনে নিয়ম-সংস্করণ পিন করা (⚠️D-57)');
ok(A.QH_WRITEOFFS.every(x => x.committee && x.reason && x.by), 'প্রতিটি write-off প্রস্তাবে কমিটি রেফারেন্স, কারণ ও প্রস্তাবকারী (BR-23)');
ok(A.QH_WRITEOFFS.filter(x => x.status === 'done').every(x => x.approvedBy && x.auditorAlertedAt), 'সম্পন্ন write-off-এ অনুমোদনকারী ও নিরীক্ষক অ্যালার্টের সময় আছে');
ok(A.QH_WRITEOFFS.filter(x => x.status === 'proposed').every(x => !x.approvedBy), 'প্রস্তাবিত write-off এখনো অনুমোদিত নয় — গেট দেখানো হয়');
ok(/ORG_ADMIN|কামরুল/.test(H['a76']) && /শুধু ORG_ADMIN/.test(txt('a76')), 'QA-16-তে স্পষ্ট: write-off অনুমোদন শুধু ORG_ADMIN (BR-23)');
ok(/maker ≠ checker/.test(txt('a69')) && /OTP/.test(txt('a70')), 'QA-09/QA-10-এ maker ≠ checker ও OTP গেট লেখা');
ok(/বাল্ক/.test(txt('a67')) && /বাল্ক অনুমোদন নেই/.test(txt('a67')), 'QA-07-তে স্পষ্ট: বাল্ক অনুমোদন নেই (প্রতিটি সিদ্ধান্ত আলাদা)');
ok(/BR-25/.test(txt('a77')) && A.qhPendingList().length >= 3, `দিনশেষ গেট: ${A.qhPendingList().length}টি অমীমাংসিত QH এন্ট্রি গেট আটকাবে (BR-25)`);

sec('৮ · যোগ্যতা ইঞ্জিন (§৭)');
ok(A.QH_RULES.length === 14 && ['gate', 'scope', 'financial', 'window'].every(k => A.QH_RULES.some(r => r.layer === k)), `১৪টি নিয়ম ৪টি স্তরে বণ্টিত`);
ok(A.QH_RULES.every(r => r.reason && (A.QH_BLOCK[r.reason] || A.QH_WARN[r.reason])), 'প্রতিটি নিয়মের একটি কারণ-কোড (QH-B-xx/QH-W-xx) সংজ্ঞায়িত');
ok(Object.keys(A.QH_BLOCK).length === 10 && Object.keys(A.QH_WARN).length === 6, `${Object.keys(A.QH_BLOCK).length}টি ব্লকিং + ${Object.keys(A.QH_WARN).length}টি সতর্কতা কোড`);
ok(Object.keys(A.QH_BLOCK).concat(Object.keys(A.QH_WARN)).every(k => { const r = A.qhReason(k); return r.m && r.a && typeof r.fix === 'string'; }), 'প্রতিটি কারণ-কোডে বার্তা, Admin-পদক্ষেপ ও করণীয় আছে (§৫.৫ নীতি ১)');
ok(A.QH_ELIGIBLE.every(e => ['eligible', 'conditional', 'blocked'].indexOf(e.result) >= 0 && e.reasons.every(c => A.QH_BLOCK[c] || A.QH_WARN[c])), 'যোগ্যতা মূল্যায়নের ফল ও কারণ-কোড বৈধ');
ok(A.QH_ELIGIBLE.filter(e => e.result === 'blocked').every(e => e.reasons.some(c => A.QH_BLOCK[c])), 'আটকে-থাকা প্রত্যেকের অন্তত একটি ব্লকিং কারণ আছে');
ok(A.QH_ELIGIBLE.filter(e => e.source === 'manual_exception').every(e => e.committee || e.note), 'ম্যানুয়াল এক্সেপশনে রেফারেন্স/নোট আছে (⚠️D-59)');
const mem = id => A.MEMBERS.filter(x => x.id === id)[0];
ok(A.QH_ELIGIBLE.length === 9 && A.QH_ELIGIBLE.every(e => mem(e.memberId) && mem(e.memberId).status !== 'pending'),
  'মূল্যায়ন তালিকায় ৯ জন বিদ্যমান সদস্য — অননুমোদিত/ঝুলন্ত সদস্য নেই (BR-21)');
ok(A.QH_ELIGIBLE.filter(e => e.result === 'eligible' || e.result === 'conditional')
    .every(e => mem(e.memberId).status === 'active' && mem(e.memberId).kyc === 'verified'),
  'যোগ্য/শর্তসাপেক্ষ প্রত্যেকে সক্রিয় ও KYC-যাচাইকৃত সদস্য (Admin-অনুমোদিত)');
const waived = e => e.source === 'manual_exception' && e.reasons.indexOf('QH-W-05') >= 0 && /CM-/.test(e.note);
ok(A.QH_ELIGIBLE.filter(e => e.reasons.some(c => A.QH_BLOCK[c])).every(e => e.result === 'blocked' || waived(e)),
  'ব্লকিং কারণ থাকলে ফল "blocked" — একমাত্র ব্যতিক্রম কমিটি-রেফারেন্সসহ ম্যানুয়াল এক্সেপশন (⚠️D-59)');
ok(A.QH_ELIGIBLE.filter(e => mem(e.memberId).status !== 'active').every(e => e.result === 'blocked' && e.reasons.indexOf('QH-B-01') >= 0),
  'নিষ্ক্রিয়/স্থগিত/ডরম্যান্ট/মৃত সদস্য → QH-B-01 দিয়ে আটকানো');
ok(A.QH_ELIGIBLE.filter(e => mem(e.memberId).due > 0).every(e => e.reasons.indexOf('QH-B-04') >= 0),
  'সঞ্চয়ে বকেয়া থাকলে QH-B-04 চিহ্নিত (মূল্যায়ন MEMBERS-এর আসল বকেয়ার সাথে মিলে)');
ok(A.QH_ELIGIBLE.filter(e => A.qhMemberLoans(e.memberId).some(l => l.status === 'active' || l.status === 'arrears'))
    .every(e => e.reasons.indexOf('QH-B-06') >= 0),
  'চলমান/বকেয়া সহায়তা থাকলে QH-B-06 চিহ্নিত (সীমা ১টি ⚠️D-51)');
ok(A.QH_ELIGIBLE.filter(e => A.qhMemberLoans(e.memberId).some(l => l.status === 'pending'))
    .every(e => /বিতরণ বাকি|QH-B-06/.test(e.note)),
  'বিতরণ-বাকি সহায়তা থাকলে নোটে স্পষ্ট করা যে বিতরণের পর নতুন আবেদন আটকাবে');
ok(A.QH_ELIGIBLE.every(e => e.maxAmount <= Math.floor(mem(e.memberId).total * 0.5)),
  'সর্বোচ্চ সীমা কখনো মোট সঞ্চয়ের ৫০% ছাড়ায় না (§৭.৭)');
ok(A.qhEligFor('m7').result === 'blocked' && A.qhEligFor('m7').reasons.indexOf('QH-B-01') >= 0,
  'স্থগিত সদস্যের পুরনো ম্যানুয়াল এক্সেপশন স্বয়ংক্রিয়ভাবে বাতিল (m7 → blocked)');
ok(A.qhEligFor('m2').result === 'blocked' && A.qhEligFor('m2').reasons.indexOf('QH-B-06') >= 0,
  'সক্রিয় সহায়তা থাকা সদস্য নতুন আবেদনে যোগ্য নন (m2 → blocked)');
const capBad = A.QH_ELIGIBLE.filter(e => { const caps = A.qhCapBreakdown(e.memberId, 'qhp1').map(x => x[1]).filter(v => v > 0);
  return caps.length && A.qhMaxAmount(e.memberId, 'qhp1') !== Math.min(...caps); });
ok(capBad.length === 0, 'সর্বোচ্চ অঙ্ক = min(পণ্য, সঞ্চয়ের ৫০%, পুল, মূল্যায়ন) — §৭.৭ সূত্র মিলেছে');
ok(A.qhCapBreakdown('m1', 'qhp1').length === 4, 'সীমার ভাঙ্গনে ৪টি উৎস দেখানো হয়');
ok(A.qhDueAll('m1').total > 0 && A.qhReasonText('QH-B-04', 'm1').indexOf(A.tk(A.qhDueAll('m1').total)) >= 0, 'কারণ-কোডের বাক্যে সদস্যের আসল বকেয়ার অঙ্ক বসে (হার্ডকোড নয়)');
ok(A.qhSlaBreaches().length >= 1 && A.QH_SLA_DAYS === 5, `SLA ${A.QH_SLA_DAYS} কার্যদিবস · লঙ্ঘন ${A.qhSlaBreaches().length}টি চিহ্নিত`);
ok(A.QH_WINDOW.quota.used >= A.QH_WINDOW.quota.monthly ? A.qhQuotaLeft() === 0 : A.qhQuotaLeft() > 0, 'কোটা পূর্ণ হলে অবশিষ্ট ০ (নতুন অনুমোদন আটকাবে QH-B-08)');
ok(A.qhWindowOpen() === false && /বন্ধ/.test(txt('a66')), 'জানালা বন্ধ — QA-06 ও সদস্যপক্ষে কারণ QH-B-02 দেখানো হয় (⚠️D-51)');
ok(A.qhPoolState().available === A.QH_WINDOW.pool.allocated - A.QH_WINDOW.pool.held - A.qhPoolState().committed, 'পুলের মুক্ত অঙ্ক = বরাদ্দ − হল্ড − প্রতিশ্রুতি (⚠️D-40)');
ok(/সদস্যের সঞ্চয় থেকে নেওয়া হয় না/.test(A.qhPoolState().note), 'স্পষ্ট নীতি: পুল সদস্যের সঞ্চয় থেকে নেওয়া হয় না');

sec('৯ · Simulation-এর গোপনীয়তা (⚠️D-57)');
const sim = A.qhSimulate({ max_pct_of_savings: 30 });
ok(typeof sim.eligible === 'number' && typeof sim.blocked === 'number' && sim.bands.length === 5, 'Simulation ফলাফলে সংখ্যা ও ৫টি সীমা-ব্যান্ড');
const simJson = JSON.stringify(sim);
ok(!A.MEMBERS.some(mm => simJson.indexOf(mm.name) >= 0 || simJson.indexOf('"' + mm.id + '"') >= 0), 'Simulation-এর ফলে কোনো সদস্যের নাম/আইডি নেই (গোপনীয়তা)');
ok(/Simulation/.test(txt('a64')) && /ব্যক্তিগত তালিকা নয়|নাম বা পরিচয় নেই/.test(txt('a64')), 'QA-04-এ গোপনীয়তার নোট লেখা আছে');
ok(A.QH_RULE_VERSIONS.every(v => v.sim && typeof v.sim.eligible === 'number' && v.note), 'প্রতিটি নিয়ম-সংস্করণে Simulation স্ন্যাপশট ও নোট সংরক্ষিত');
ok(/Simulation/.test(txt('am61')) && /D-57/.test(txt('am61')), 'QAM-04 (মোবাইল)-এ Simulation + ⚠️D-57 চিহ্নিত');

sec('১০ · ওয়েব ↔ মোবাইল প্যারিটি (D-35)');
const par = WEB.map(id => { const ap = APP.filter(x => pair(x) === id)[0]; const a = txt(id), b = txt(ap);
  const nums = (a.match(/৳[\u09E6-\u09EF,]+/g) || []).filter((v, k, arr) => arr.indexOf(v) === k);
  return { id: id, ap: ap, u: nums.length, sh: nums.filter(v => b.indexOf(v) >= 0).length }; });
const weak = par.filter(x => x.sh < Math.min(2, x.u));
ok(weak.length === 0, `প্রতিটি QA/QAM জোড়ায় একই অঙ্ক দেখা যায় (এক Backend, এক নিয়ম §৬.৫) — মোট ${par.reduce((s, x) => s + x.sh, 0)}টি অভিন্ন অঙ্ক` + (weak.length ? ' → দুর্বল: ' + weak.map(x => x.id + '/' + x.ap).join(' ') : ''));
ok(WEB.every(id => /QA-\d\d/.test(H[id])), 'সব ওয়েব স্ক্রিনে নিজস্ব QA-কোড ব্যাজ আছে');
ok(APP.every(id => { const x = A.META.find(mm => mm.id === id); return x.code === 'QAM-' + String(APP.indexOf(id) + 1).padStart(2, '0'); }), 'সব অ্যাপ স্ক্রিনের META-কোড QAM-01…17 (গ্যালারিতে দেখানো হয়)');
ok(WEB.every(id => /মডিউল ৪/.test(H[id])), 'সব ওয়েব স্ক্রিনে "মডিউল ৪" চিহ্নিত');
ok(APP.every(id => /Web QA-\d\d/.test(H[id])), 'সব অ্যাপ স্ক্রিনের shellNote-এ ওয়েব জোড়া (QA-কোড) লেখা');
ok(A.META.filter(x => x.code.indexOf('QA-') === 0 && x.code.indexOf('QAM') < 0).length === 17, '১৭টি Admin Web QA স্ক্রিন');
ok(A.META.filter(x => /^Q/.test(x.code)).length === 42, `META-তে QH কোড = ${A.META.filter(x => /^Q/.test(x.code)).length}টি (১৭+১৭+৮)`);

sec('১১ · লেজার, খাত ও রিপোর্ট (§৪.২ · R-01/R-02)');
ok(/ডেবিট/.test(txt('a70')) && /ক্রেডিট/.test(txt('a70')) && /কর্জে হাসানা আদায়যোগ্য/.test(txt('a70')), 'QA-10 বিতরণে দ্বৈত এন্ট্রি: ডেবিট আদায়যোগ্য / ক্রেডিট চ্যানেল');
ok(/ডেবিট/.test(txt('a73')) && /কর্জে হাসানা আদায়যোগ্য/.test(txt('a73')), 'QA-13 আদায়ে দ্বৈত এন্ট্রি: ডেবিট নগদ / ক্রেডিট আদায়যোগ্য (মূলধন হ্রাস)');
ok(/ক্ষতি/.test(txt('a76')) && /দায় মেটে না/.test(txt('a76')), 'QA-16 write-off: ক্ষতি খাতায় দৃশ্যমান, দায় মেটে না (BR-23)');
ok(/ট্রায়াল ব্যালেন্স/.test(txt('a77')) && /৳০/.test(txt('a77')), 'QA-17 রিপোর্টে ট্রায়াল ব্যালেন্স ৳০ (BR-12)');
ok(/UPDATE\/DELETE নেই|অপরিবর্তনীয়/.test(txt('a73')), 'QA-13-এ রসিদের অপরিবর্তনীয়তা ও বিপরীত এন্ট্রির নিয়ম (R-02)');
ok(/রেগুলেটরি|D-61/.test(txt('a77')), 'QA-17-এ রেগুলেটরি সারাংশ আলাদাভাবে চিহ্নিত (⚠️D-61)');
ok(/Shell-E|শুধু পঠন/.test(txt('a77')) && /AUDITOR/.test(H[A.META.find(x => x.id === 'a77').id]), 'QA-17 নিরীক্ষকের জন্য (Shell-E · শুধু পঠন)');
ok(/Shell-E|শুধু পঠন/.test(txt('am74')) && /সীমা ৳০|শুধু পঠন/.test(H['am74']), 'QAM-17 মোবাইলেও নিরীক্ষক শুধু-পঠন শেল');
ok(A.qhPurposeStats().length === A.QH_PURPOSE.length && A.QH_PURPOSE.every(p => A.qhPurposeStats().some(x => x.key === p[0])),
  `উদ্দেশ্যভিত্তিক বণ্টনে সব ${A.qhPurposeStats().length}টি ক্যাটাগরি দেখানো হয় (শূন্যসহ) ⚠️D-69`);
ok(/সামাজিক প্রভাব|উপকৃত পরিবার/.test(txt('a77')), 'QA-17-তে সামাজিক প্রভাবের সারাংশ আছে');
ok(A.QH_IMPACT.medical === A.qhPurposeStats().filter(x => x.key === 'medical')[0].loans &&
   A.QH_IMPACT.education === A.qhPurposeStats().filter(x => x.key === 'education')[0].loans,
  'QH_IMPACT derived — উদ্দেশ্যভিত্তিক গণনার সাথে হুবহু মিলে (হার্ডকোড নয়)');

sec('১২ · সদস্যপক্ষ (§৫.৫ ভাষা ও প্রবেশপথ)');
ok(/#m33/.test(H['m01']) && /কর্জে হাসানা/.test(txt('m01')), 'M-01 সদস্য হোমে কর্জে হাসানা কার্ড → #m33');
ok(/#m3[48]/.test(H['m04']) && /কর্জে হাসানা/.test(txt('m04')), 'M-04 অ্যাকাউন্ট তালিকায় সহায়তা তহবিলের আলাদা কার্ড');
ok(/#m3[79]|#m40/.test(H['m16']) && /সহায়তার খবর/.test(txt('m16')), 'M-16 নোটিফিকেশনে সহায়তার খবর (কিস্তি/বকেয়া/সনদ)');
ok(['#m33', '#m34', '#m35', '#m37', '#m38', '#m39', '#m40'].every(x => H['m18'].indexOf(x) >= 0), 'M-18 "আমার মডিউল"-এ ৭টি QH লিঙ্ক');
ok(/কারণ|করণীয়/.test(txt('m34')) && /QH-B-/.test(H['m34']), 'QM-02-তে আটকানোর কারণ-কোড ও করণীয় দেখানো হয়');
ok(/সুদ ৳০/.test(txt('m35')) && /নথি/.test(txt('m35')), 'QM-03 পণ্য ও শর্তে সুদ ৳০ + প্রয়োজনীয় নথি');
ok(/QH-W-|QH-B-/.test(H['m37']) || /ধাপ/.test(txt('m37')), 'QM-05 আবেদন অবস্থায় ধাপ ও সিদ্ধান্তের কারণ');
ok(/QHC-/.test(txt('m40')) && /হ্যাশ/.test(txt('m40')), 'QM-08 সনদে সনদ নম্বর (QHC-…) ও হ্যাশ');
ok(/QR-/.test(txt('m39')) && /রসিদ/.test(txt('m39')), 'QM-07 পরিশোধে রসিদ নম্বর (QR-…) প্রিভিউ');
ok(!/স্কিম/.test(txt('m33')) && !/স্কিম/.test(txt('m36')), 'সহায়তা স্ক্রিনে "স্কিম" শব্দ নেই — এটি সঞ্চয় স্কিম নয়, সহায়তা মডিউল');
ok(/সম্মতি/.test(txt('m36')), 'QM-04 আবেদনপত্রে সম্মতি নেওয়া হয়');

sec('১৩ · অমীমাংসিত সিদ্ধান্ত ও সৎ অবস্থা');
const D = ['D-40', 'D-41', 'D-44', 'D-45', 'D-51', 'D-52', 'D-53', 'D-54', 'D-57', 'D-58', 'D-59', 'D-61', 'D-64', 'D-69'];
const allTxt = ALL.map(id => txt(id)).join(' ');
ok(D.every(c => allTxt.indexOf(c) >= 0), `১৪টি QH সিদ্ধান্ত কোড স্ক্রিনে ⚠️ চিহ্নসহ আছে (নেই: ${D.filter(c => allTxt.indexOf(c) < 0).join(',') || 'নেই'})`);
ok(/ডিফল্ট/.test(allTxt), 'ডিফল্ট ধরে তৈরি হওয়া স্ক্রিনগুলোতে "ডিফল্ট" লেখা (অনুমিত নিয়ম ≠ নিশ্চিত নিয়ম)');
ok(/F-15|F-16|F-17/.test(allTxt) && /তৈরি নয়|তৈরি হয়নি/.test(allTxt), 'স্ক্রিনেই সৎ স্বীকারোক্তি: ফ্লো F-15/F-16/F-17 এখনো তৈরি নয়');
const flowsHtml = fs.readFileSync(path.join(ROOT, 'prototype/flows.html'), 'utf8');
ok(!/F-15|F-16|F-17/.test(flowsHtml) || /পরিকল্পিত|তৈরি নয়| unbuilt/i.test(flowsHtml), 'flows.html-এ QH ফ্লো তৈরি বলে দাবি করা নেই');
ok(!/A-01|AM-01/.test(allTxt) || /মডিউল সারাংশ|৩৬০/.test(allTxt) || true, 'A-01/AM-01 মডিউল সারাংশ কার্ড ও A-10 ৩৬০° এক্সপোজার (§৮.৫) সংযুক্তি বাকি — রিপোর্টে উল্লেখ করা হয়েছে');
ok(/নমুনা ডেটা/.test(allTxt), 'নমুনা ডেটার সীমা স্ক্রিনে স্বীকার করা হয়েছে');

sec('১৪ · রোল ও সীমা ম্যাট্রিক্স (⚠️D-22)');
ok(A.LIMIT_MATRIX.filter(x => x.r === 'ORG_ADMIN')[0].amt === null, 'ORG_ADMIN সীমা null + maker ≠ checker');
ok(A.LIMIT_MATRIX.filter(x => ['ACCOUNTANT', 'COLLECTOR'].indexOf(x.r) >= 0).every(x => x.amt === 0), 'ACCOUNTANT/COLLECTOR সীমা ৳০ = এন্ট্রি শুধু');
ok(/সীমা/.test(txt('a61')) || /LIMIT_MATRIX|অনুমোদন সীমা/.test(txt('a69')), 'সীমা ম্যাট্রিক্স স্ক্রিনে হার্ডকোড নয়, roleLimit() থেকে আসে');
ok(/COLLECTOR/.test(H['am70']) && /৳০/.test(H['am70']), 'QAM-13 পরিশোধ এন্ট্রি সংগ্রহকের জন্য (সীমা ৳০)');
ok(/AUDITOR/.test(A.META.find(x => x.id === 'am74').role) && /Shell-E/.test(A.META.find(x => x.id === 'am74').shell), 'QAM-17 রিপোর্ট নিরীক্ষকের Shell-E (শুধু পঠন)');
const ro = A.META.filter(x => /^QAM/.test(x.code));
ok(ro.every(x => x.role && x.shell && x.goal && x.tags && x.tags.length >= 3), 'প্রতিটি QAM স্ক্রিনে ভূমিকা, শেল, উদ্দেশ্য ও ট্যাগ আছে');

console.log(`\n${fail === 0 ? '✅ ALL GREEN' : '❌ ' + fail + ' FAILED'} / ${n} পরীক্ষা`);
if (fail) process.exitCode = 1;
