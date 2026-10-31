/* স্ট্যাটিক অডিট: স্কোপিং, ui.css অপরিবর্তনশীলতা, CSS ক্লাস কভারেজ */
import fs from 'fs';
import { loadPage } from './load.mjs';

let pass = 0, fail = 0; const fails = [];
const ok = (c, m) => { if (c) { pass++; console.log('  ✓ ' + m); } else { fail++; fails.push(m); console.log('  ✗ ' + m); } };
console.log('\n=== skins.css · স্ট্যাটিক অডিট ===');

const SK = fs.readFileSync('/home/user/prototype/assets/skins.css', 'utf8');
const UI = fs.readFileSync('/home/user/prototype/assets/ui.css', 'utf8');
/* বেসলাইন = ধাপ C (Admin App UX সংশোধন) পর্যন্ত ui.css। ui.css ইচ্ছাকৃতভাবে বদলালে এই ফাইল হালনাগাদ করতে হবে:
   cp prototype/assets/ui.css prototype/tests/baseline-ui.css */
const BASELINE = '/home/user/prototype/tests/baseline-ui.css';
/* বেসলাইন: ধাপ A (Admin App UX সংশোধন) পর্যন্ত ui.css — ব্যাকবাটন ৪৪px, .amrole.cmp,
   .amhead.deep ও .flowbar ইচ্ছাকৃতভাবে যোগ হয়েছে। এরপর ui.css বদলালে এই বেসলাইন হালনাগাদ করতে হবে। */
const UIBAK = fs.readFileSync(BASELINE, 'utf8');

/* ---- ১. ui.css-এ কী বদলেছে ---- */
const diffLines = [];
const A = UIBAK.split('\n'), B = UI.split('\n');
for (let i = 0, j = 0; i < A.length || j < B.length;) {
  if (A[i] === B[j]) { i++; j++; continue; }
  diffLines.push('+' + (B[j] || '').trim()); j++;
  if (j > B.length) break;
}
const added = diffLines.filter(l => l.startsWith('+')).join(' ');
ok(diffLines.length === 0, `ui.css বেসলাইনের (ধাপ A পর্যন্ত) সাথে হুবহু মিলছে — পার্থক্য ${diffLines.length} লাইন`);
/* বেসলাইন হালনাগাদের পর এলিয়াস টোকেনগুলো এখন ui.css-এর :root-এ উপস্থিত আছে কি না তাই দেখা হয় */
const ROOTBLK = (UI.match(/:root\s*\{([\s\S]*?)\}/) || [, ''])[1];
ok(/--green:\s*#0B6B53/.test(ROOTBLK) && /--mint:\s*#E6F7EF/.test(ROOTBLK) && /--rose:\s*#E2574C/.test(ROOTBLK),
   'স্কিনের প্রয়োজনীয় ৩টি এলিয়াস টোকেন ui.css-এর :root-এ আছে');
ok(/--rose-bg\s*:/.test(ROOTBLK), 'চতুর্থ এলিয়াস টোকেন --rose-bg :root-এ আছে');
const uiRulesBak = (UIBAK.match(/\{/g) || []).length, uiRulesNow = (UI.match(/\{/g) || []).length;
ok(uiRulesBak === uiRulesNow, `ui.css-এর রুল সংখ্যা অপরিবর্তিত (${uiRulesNow})`);

/* ---- ২. skins.css-এর প্রতিটি রুল স্কোপড ---- */
const noComment = SK.replace(/\/\*[\s\S]*?\*\//g, '');
const uiRootNames = new Set([...UI.matchAll(/:root\s*\{([\s\S]*?)\}/g)]
  .flatMap(m => [...m[1].matchAll(/(--[a-zA-Z0-9-]+)\s*:/g)].map(x => x[1])));
const rules = [];
let depth = 0, buf = '', prelude = '';
for (let i = 0; i < noComment.length; i++) {
  const ch = noComment[i];
  if (ch === '{') { rules.push({ sel: prelude.trim(), body: '', depth }); prelude = ''; depth++; buf = ''; }
  else if (ch === '}') { depth--; prelude = ''; }
  else if (depth >= 0) { if (ch === ';') prelude += ch; else prelude += ch; }
}
const selRules = rules.filter(r => r.sel && !r.sel.startsWith('@'));
const atRules = rules.filter(r => r.sel && r.sel.startsWith('@'));
const ALLOWED = /^(:root|\[data-theme([^\]]*)?\]|\[data-module([^\]]*)?\]|\.qh-|\.sk-|\.skg-)/;
const badScope = [];
selRules.forEach(r => {
  r.sel.split(',').forEach(part => {
    const p = part.trim();
    if (!p) return;
    if (!ALLOWED.test(p)) badScope.push(p);
  });
});
ok(badScope.length === 0, `প্রতিটি সিলেক্টর স্কোপড ([data-theme]/[data-module]/.qh-/.sk-/.skg-) → বাদ পড়া: ${[...new Set(badScope)].slice(0,5).join(', ') || 'নেই'}`);
console.log(`    মোট রুল = ${selRules.length} · @media/@supports = ${atRules.length}`);

/* :root ব্লকে শুধু নতুন টোকেন */
const rootBlocks = [...noComment.matchAll(/:root\s*\{([\s\S]*?)\}/g)].map(m => m[1]);
const rootNames = rootBlocks.flatMap(b => [...b.matchAll(/(--[a-zA-Z0-9-]+)\s*:/g)].map(x => x[1]));
const clash = rootNames.filter(n => uiRootNames.has(n));
ok(rootNames.length > 0 && clash.length === 0,
   `:root ব্লকে ${rootNames.length}টি নতুন টোকেন, ui.css-এর সাথে সংঘর্ষ নেই (${clash.join(',') || 'শূন্য'})`);
ok(rootNames.every(n => n.startsWith('--qh-') || n.startsWith('--sk-')),
   'নতুন টোকেনের নাম শুধু --qh-* ও --sk-* প্রিফিক্সে');

/* গ্লোবাল এলিমেন্ট সিলেক্টর (body/html/*) একেবারেই নেই */
const globalSel = selRules.filter(r => /(^|,)\s*(body|html|\*)(\s|,|\{|:)/.test(r.sel));
ok(globalSel.length === 0, `গ্লোবাল body/html/* সিলেক্টর নেই (${globalSel.map(r => r.sel).join(' | ') || 'শূন্য'})`);
ok(!/@import/.test(SK), '@import নেই (বাইরের CSS লাগে না)');
ok(!/url\((?!["']?data:)/.test(SK), 'বাইরের ফাইল/ছবি রেফারেন্স নেই — শুধু data: URI');

/* ---- ৩. স্ক্রিন-ক্লাস কভারেজ (skins.html রেন্ডার করে) ---- */
const { w, d, errs } = await loadPage('/home/user/prototype/skins.html');
const pageCss = [...d.querySelectorAll('style')].map(s => s.textContent).join('\n');
const css = UI + '\n' + SK + '\n' + pageCss;
const used = new Set();
[...d.querySelectorAll('body *')].forEach(el => (el.getAttribute('class') || '').split(/\s+/).forEach(c => c && used.add(c)));
const missing = [...used].filter(c => !new RegExp('\\.' + c.replace(/[-]/g, '\\-') + '(?![\\w-])').test(css));
console.log(`\n=== skins.html · ক্লাস কভারেজ ===`);
console.log(`    ব্যবহৃত ক্লাস = ${used.size}`);
ok(missing.length === 0, `সব ক্লাসের স্টাইল রুল আছে (নেই: ${missing.slice(0,12).join(', ') || 'শূন্য'})`);
ok(errs.length === 0, `console error নেই (${errs.slice(0,2).join(' | ') || 'none'})`);

/* ---- ৪. বিদ্যমান পেজগুলো skins.css লোড করে না (ডিফল্ট অক্ষুণ্ণ) ---- */
['screens.html', 'preview.html', 'workspace.html', 'flows.html', 'system.html'].forEach(f => {
  const p = '/home/user/prototype/' + f;
  if (!fs.existsSync(p)) return;
  const h = fs.readFileSync(p, 'utf8');
  ok(!/skins\.css/.test(h), `${f} skins.css লোড করে না → বিদ্যমান ডিজাইন অক্ষুণ্ণ`);
});
ok(/data-theme/.test(fs.readFileSync('/home/user/prototype/skins.html', 'utf8')), 'skins.html data-theme ব্যবহার করে');

console.log(`\n${fail ? '❌' : '✅'} ${pass} passed, ${fail} failed`);
fails.forEach(f => console.log('  · ' + f));
if (fail) process.exitCode = 1;
