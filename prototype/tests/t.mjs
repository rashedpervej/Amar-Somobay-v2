/* Baseline harness — prototype/screens.html
   Usage: node /tmp/t.mjs [pathToScreensHtml]
   Checks: META count, phone/browser split, TOC, jump list, render hygiene (NaN/undefined/[object/template-leak), dead go() targets,
           drawer highlight per AM screen. */
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire('/tmp/');
const { JSDOM } = require('jsdom');

const ROOT = '/home/user';
const file = process.argv[2] || path.join(ROOT, 'prototype/screens.html');
const html = fs.readFileSync(file, 'utf8');
const dir = path.dirname(file);

/* --- collect JS: external srcs (in order) + inline blocks --- */
const js = [];
const re = /<script([^>]*)>([\s\S]*?)<\/script>/g;
let m;
while ((m = re.exec(html))) {
  const attrs = m[1], body = m[2];
  const src = /src="([^"]+)"/.exec(attrs);
  if (src) js.push(fs.readFileSync(path.join(dir, src[1]), 'utf8'));
  else if (body.trim()) js.push(body);
}
const code = js.join('\n;\n');

/* --- strip scripts so jsdom doesn't double-run --- */
const clean = html.replace(/<script[\s\S]*?<\/script>/g, '');
const dom = new JSDOM(clean, { runScripts: 'outside-only', pretendToBeVisual: true, url: 'http://localhost/' });
const w = dom.window;
w.scrollTo = () => {};
w.HTMLElement.prototype.scrollIntoView = function () {};
/* console.warn collector */
const warns = [];
w.console = { log: () => {}, warn: (...a) => warns.push(a.join(' ')), error: () => {}, info: () => {} };

let fail = 0;
const ok = (c, msg) => { if (!c) { console.log('  ✗ ' + msg); fail++; } else console.log('  ✓ ' + msg); };

try {
  w.eval(code + `
;globalThis.__api = { META, mount, go, ADMIN_SHELLS, AMNAV_SCREEN, ANAV, MNAV, phoneScr, states,
  renderOne: (id) => { const x = META.find(m => m.id === id); if (!x) throw new Error('no meta ' + id);
    __AM_CUR = id; try { return x.fn(); } finally { __AM_CUR = null; } },
  roles: () => Object.keys(ADMIN_SHELLS) };`);
} catch (e) {
  console.log('EVAL ERROR:', e.message);
  process.exit(1);
}
const api = w.__api;
w.mount();

const d = w.document;
const META = api.META;
const phone = META.filter(x => x.id[0] === 'm' || x.pres === 'app' || x.variant === 'mobile').length;
const browser = META.length - phone;

console.log('\n=== ' + path.basename(file) + ' ===');
ok(META.length === 199, `META = ${META.length} (প্রত্যাশিত 199 = 102 + ROSCA 30 + Joint Goal 25 + কর্জে হাসানা 42)`);
console.log(`  · phone-variant = ${phone} · browser-variant = ${browser}`);
ok(d.querySelectorAll('#toc button').length === META.length + 1, `TOC buttons = ${d.querySelectorAll('#toc button').length} (প্রত্যাশিত ${META.length + 1})`);
ok(d.querySelectorAll('#jumpList option').length === META.length, `jump options = ${d.querySelectorAll('#jumpList option').length}`);

/* every META id present in DOM */
const missing = META.filter(x => !d.getElementById(x.id));
ok(missing.length === 0, `সব স্ক্রিন DOM-এ আছে (অনুপস্থিত: ${missing.map(x => x.id).join(',') || 'নেই'})`);

/* dead go() targets */
const body = d.body.innerHTML;
const targets = [...body.matchAll(/go\('#([a-z0-9]+)'\)/g)].map(x => x[1]);
const ids = new Set(META.map(x => x.id));
ids.add('states');
const dead = [...new Set(targets.filter(t => !ids.has(t)))];
ok(dead.length === 0, `go() টার্গেট মৃত: ${dead.join(',') || 'নেই'}`);

/* NaN / undefined leakage */
const nan = (body.match(/NaN/g) || []).length;
const und = (body.match(/>undefined<|undefined\s*(?:·|<)/g) || []).length;
ok(nan === 0, `NaN occurrences = ${nan}`);
ok(und === 0, `suspicious undefined = ${und}`);

/* per-screen isolation render: every fn() callable with __AM_CUR set */
let errs = [];
for (const x of META) {
  try {
    const out = api.renderOne(x.id);
    if (typeof out !== 'string' || out.length < 80) errs.push(x.id + ':short');
    if (/NaN/.test(out)) errs.push(x.id + ':NaN');
    /* রেন্ডার-স্বচ্ছতা: টেমপ্লেট-লিটারেল ফাঁস (সিঙ্গেল-কোটে ${…} লিখলে লিটারেল টেক্সট হয়ে যায়),
       undefined/[object ফাঁস — ধাপ B–D-তে এভাবেই A-15 ও A-25-এর দুটি পুরনো বাগ ধরা পড়েছে */
    const txt = out.replace(/<[^>]*>/g, ' ');   /* এই হার্নেসে jsdom-এর document নেই — ট্যাগ ছেঁকেই পরীক্ষা */
    if (/\$\{/.test(txt)) errs.push(x.id + ':template-leak');
    if (/undefined/.test(txt)) errs.push(x.id + ':undefined');
    if (/\[object /.test(txt)) errs.push(x.id + ':object');
  } catch (e) { errs.push(x.id + ':' + e.message.slice(0, 60)); }
}
ok(errs.length === 0, `প্রতিটি স্ক্রিন আলাদাভাবে রেন্ডারযোগ্য ও স্বচ্ছ — NaN/undefined/[object/টেমপ্লেট-লিটারেল ফাঁস নেই (ত্রুটি: ${errs.slice(0, 6).join(' | ') || 'নেই'})`);

/* role shells: 5 slots each */
const slotIssues = [];
for (const [r, sh] of Object.entries(api.ADMIN_SHELLS)) {
  const n = sh.nav.length + (sh.fab ? 1 : 0);
  if (n > 5) slotIssues.push(`${r}:${n}`);
}
ok(slotIssues.length === 0, `শেল স্লট ≤ ৫ (সমস্যা: ${slotIssues.join(',') || 'নেই'}) · warns=${warns.length}`);

/* drawer highlight check per AM screen
   D-75 (নিরীক্ষা N2): কার্যপ্রবাহ পর্দায় ড্রয়ার/বটম নেভ থাকে না — তখন ব্যাক বাটন + ফ্লো-বার বাধ্যতামূলক। */
const FLOW = ['am03','am06','am07','am08','am09','am11','am14','am16','am18','am19','am20','am22','am23','am28','am29','am38','am41','am43','am50','am52','am55','am66','am67','am70','am73'];
let noHL = [], flowBad = [];
for (const x of META.filter(z => z.pres === 'app')) {
  const out = api.renderOne(x.id);
  const dd = new JSDOM(`<div id="r">${out}</div>`);
  const doc = dd.window.document;
  if (FLOW.includes(x.id)) {
    const bad = [];
    if (doc.querySelectorAll('.bottomnav').length) bad.push('bottomnav');
    if (doc.querySelectorAll('.drawer').length) bad.push('drawer');
    if (doc.querySelectorAll('.amburger').length) bad.push('hamburger');
    if (!doc.querySelector('.flowbar')) bad.push('flowbar নেই');
    if (!doc.querySelector('.amhead .backbtn')) bad.push('ব্যাক নেই');
    if (bad.length) flowBad.push(x.id + ':' + bad.join('+'));
  } else {
    const on = doc.querySelectorAll('.drawer-i.on').length;
    if (on === 0) noHL.push(x.id);
  }
}
ok(noHL.length === 0, `ড্রয়ার হাইলাইট আছে (নেই: ${noHL.join(',') || 'সবগুলোতে আছে'})`);
ok(flowBad.length === 0, `ফ্লো পর্দায় নেভ/ড্রয়ার বন্ধ + ব্যাক ও ফ্লো-বার আছে (${FLOW.length}টি) — সমস্যা: ${flowBad.join(',') || 'নেই'}`);

console.log(fail === 0 ? '\n✅ ALL GREEN' : `\n❌ ${fail} CHECK(S) FAILED`);
process.exit(fail === 0 ? 0 : 1);
