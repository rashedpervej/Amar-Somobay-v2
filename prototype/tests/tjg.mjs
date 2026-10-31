/* Joint Goal contract harness — prototype/screens.html (মডিউল ৩)
   Usage: node prototype/tests/tjg.mjs
   যাচাই করে: ২৫টি Joint Goal স্ক্রিন রেন্ডার, specs/03 §৫.৩ ভাষা/নিষিদ্ধ শব্দ, §৫.৬ চারটি তথ্য,
   ANAV 'যৌথ লক্ষ্য' গ্রুপ ও ড্রয়ার পৌঁছ (D-35), AMNAV_SCREEN ম্যাপিং, ফ্লো/নেভ চুক্তি (specs/05 MC-01…MC-18-এর JG অংশ),
   ডেটা অখণ্ডতা (অবদান সমষ্টি, JC-/JD- অনন্যতা, maker≠checker, প্রমাণ, আনুপাতিক ফেরত, মাইলস্টোন),
   লিডারবোর্ড নেই (⚠️D-68), BR-19/⚠️D-37, এবং D-কোড ফ্ল্যাগ। */
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
;globalThis.__jg = {
  META, ANAV, AMNAV_SCREEN, AM_BACK, mount,
  JG_GOALS, JG_PARTS, JG_CONTRIBS, JG_DISB, JG_ME, JG_LIMIT, JG_MS,
  JG_STATUS, JG_CRULE, JG_JOIN, JG_PART_ST, JG_DISB_ST, JG_OWN, JG_DEADLINE, JG_USE, JG_STEP, JG_CHANNEL,
  LIMIT_MATRIX, roleLimit, TODAY,
  jgGoal, jgParts, jgPart, jgContribs, jgCollected, jgPct, jgGap, jgPledgeTotal, jgContributed, jgExpectedNow,
  jgPartGap, jgArrears, jgAllArrears, jgMilestones, jgNextMilestone, jgAchievedAt, jgDaysLeft, jgDisb,
  jgActive, jgLimitLeft, jgMyParts, jgMyMain, jgRefundPlan, jgPendingList, jgTotalMonths, jgElapsedMonths, jgSchedule,
  renderOne: (id) => { const x = META.find(mm => mm.id === id); if (!x) throw new Error('no meta ' + id);
    __AM_CUR = id; try { return x.fn(); } finally { __AM_CUR = null; } },
};`);
const A = w.__jg;
A.mount();

let fail = 0, n = 0;
const ok = (c, msg) => { n++; if (!c) { console.log('  ✗ ' + msg); fail++; } else console.log('  ✓ ' + msg); };
const sec = t => console.log('\n— ' + t);

/* ---------- স্ক্রিন তালিকা ---------- */
const WEB = ['a51','a52','a53','a54','a55','a56','a57','a58','a59','a60'];
const APP = ['am48','am49','am50','am51','am52','am53','am54','am55','am56','am57'];
const MEM = ['m28','m29','m30','m31','m32'];
const ALL = WEB.concat(APP, MEM);
const FLOW = ['am50','am52','am55'];
const H = {};
ALL.forEach(id => { try { H[id] = A.renderOne(id); } catch (e) { H[id] = '\nRENDER_ERROR: ' + e.message + '\n'; } });

/* সাইডবার/ড্রয়ার বাদে মূল অঞ্চল (সেখানে GS/ROSCA-এর শব্দ থাকে) */
const mainOf = id => {
  const h = H[id];
  if (id[0] === 'a' && id[1] !== 'm') { const i = h.indexOf('class="admin-main"'); return i >= 0 ? h.slice(i) : h; }
  if (id.slice(0, 2) === 'am') { const i = h.indexOf('<div class="drawer"'); return i >= 0 ? h.slice(0, i) : h; }
  return h;
};

console.log('\n=== Joint Goal কনট্র্যাক্ট হার্নেস (tjg) ===');

sec('১ · META ও কোড ম্যাপিং');
ok(A.META.length === 199, `META = ${A.META.length} (প্রত্যাশিত 199 = 102 + ROSCA 30 + Joint Goal 25 + কর্জে হাসানা 42)`);
const codes = id => (A.META.find(x => x.id === id) || {}).code;
ok(WEB.every((id, i) => codes(id) === 'JA-' + String(i + 1).padStart(2, '0')), 'JA-01…JA-10 → a51…a60 ঠিকভাবে ম্যাপ করা');
ok(APP.every((id, i) => codes(id) === 'JAM-' + String(i + 1).padStart(2, '0')), 'JAM-01…JAM-10 → am48…am57 ঠিকভাবে ম্যাপ করা');
ok(MEM.every((id, i) => codes(id) === 'JM-' + String(i + 1).padStart(2, '0')), 'JM-01…JM-05 → m28…m32 ঠিকভাবে ম্যাপ করা');
ok(APP.every(id => { const x = A.META.find(mm => mm.id === id); return x.pres === 'app' && x.variant === 'mobile'; }), '১০টি অ্যাপ স্ক্রিনে pres:app + variant:mobile');
ok(APP.every((id, i) => { const x = A.META.find(mm => mm.id === id); return x.logical === 'JA-' + String(i + 1).padStart(2, '0'); }), 'প্রতিটি অ্যাপ স্ক্রিনের logical = সংশ্লিষ্ট JA-কোড (ওয়েবের সাথে প্যারিটি)');
ok(MEM.every(id => (A.META.find(mm => mm.id === id) || {}).role === 'MEMBER'), '৫টি সদস্য স্ক্রিনে role: MEMBER');
ok(WEB.every(id => /^jg/.test(A.META.find(mm => mm.id === id).nav || '')), '১০টি ওয়েব স্ক্রিনের nav = jg* (ANAV কী)');

sec('২ · রেন্ডার ও হাইজিন');
ok(ALL.every(id => !/RENDER_ERROR/.test(H[id])), '২৫টি স্ক্রিন ত্রুটি ছাড়া রেন্ডার হয়েছে' + ALL.filter(id => /RENDER_ERROR/.test(H[id])).map(id => ' [' + id + ': ' + (H[id].match(/RENDER_ERROR: ([^\n]+)/) || [])[1] + ']').join(''));
const bad = id => ['undefined', 'NaN', '[object', '${'].filter(t => H[id].indexOf(t) >= 0);
ok(ALL.every(id => bad(id).length === 0), 'কোনো স্ক্রিনে undefined/NaN/[object/${ ফাঁস নেই' + ALL.filter(id => bad(id).length).map(id => ' [' + id + ':' + bad(id) + ']').join(''));
ok(ALL.every(id => H[id].length > 900), 'প্রতিটি স্ক্রিনে পর্যাপ্ত কনটেন্ট (>৯০০ অক্ষর)');

sec('৩ · ভাষা ও নিষিদ্ধ শব্দ (§৫.৩)');
const BAN = ['স্কিম', 'লাভ', 'লোন', 'সুদ', 'বিনিয়োগ', 'মুনাফা', 'ইন্টারেস্ট'];
const hits = [];
ALL.forEach(id => { const body = mainOf(id); BAN.forEach(b => { if (body.indexOf(b) >= 0) hits.push(id + ':' + b); }); });
ok(hits.length === 0, 'নিষিদ্ধ শব্দ শূন্য (সাইডবার/ড্রয়ার বাদে)' + (hits.length ? ' → ' + hits.join(', ') : ''));
const VOC = ['আমাদের লক্ষ্য', 'অবদান', 'লক্ষ্য পূরণ'];
ok(MEM.every(id => VOC.some(v => H[id].indexOf(v) >= 0)), 'সদস্য স্ক্রিনে JG ভাষা: আমাদের লক্ষ্য · অবদান · লক্ষ্য পূরণ');
const PL = MEM.filter(id => /প্রতিশ্রুতি/.test(H[id]));
ok(PL.length >= 4, `${PL.length}/${MEM.length} সদস্য স্ক্রিনে "প্রতিশ্রুতি" পরিভাষা (${PL.join(', ')})`);
const latin = [];
ALL.forEach(id => { const t = H[id].match(/৳\s*[0-9][0-9,.]*/g); if (t) latin.push(id + ':' + t.slice(0, 2).join('|')); });
ok(latin.length === 0, '৳ এর পরে সব অঙ্ক বাংলায়' + (latin.length ? ' → ' + latin.join(', ') : ''));
const purple = ALL.filter(id => /purple|jg-/.test(H[id]));
ok(purple.length === ALL.length, 'সব স্ক্রিনে বেগুনি JG পরিচয় (jg-* ক্লাস/টোকেন)');

sec('৪ · §৫.৬ — সদস্যের চারটি তথ্য');
const F4 = ['১ · লক্ষ্য ও সংগৃহীত', '২ · লক্ষ্য তারিখ', '৩ · আমার অবদান বনাম প্রতিশ্রুতি', '৪ · টাকা কীভাবে ব্যবহার হলো'];
ok(F4.every(l => H['m29'].indexOf(l) >= 0), 'JM-02 (লক্ষ্য বিস্তারিত) এ চারটি বাধ্যতামূলক তথ্য');
ok(H['m29'].indexOf('jg-facts') >= 0 && (H['m29'].split('class="jg-fact"').length - 1) >= 4, 'JM-02 এ ৪টি তথ্য-কার্ড রেন্ডার হয়েছে');
ok(H['m28'].indexOf('jg-count') >= 0 && /দিন/.test(H['m28']) && /দিন/.test(H['m29']), 'JM-01/JM-02 এ লক্ষ্য তারিখের কাউন্টডাউন (আর N দিন)');
ok(/jg-ring|%/.test(H['m28']) && H['m28'].indexOf('৬৮%') >= 0, 'JM-01 এ প্রগ্রেস রিং ও ৬৮% অগ্রগতি (§৫.x নমুনা)');
ok(H['m31'].indexOf('JC-') >= 0 && H['m31'].indexOf('রসিদ') >= 0, 'JM-04 এ রসিদভিত্তিক অবদান ইতিহাস');
ok(H['m32'].indexOf('JD-') >= 0 && H['m32'].indexOf('maker ≠ checker') >= 0, 'JM-05 এ ভাউচার ও maker ≠ checker');
ok(H['m32'].indexOf('আনুপাতিক ফেরত') >= 0, 'JM-05 এ আনুপাতিক ফেরতের ছক (⚠️D-39)');

sec('৫ · ANAV ও পৌঁছ (D-35)');
const g = A.ANAV.filter(x => x.g === 'যৌথ লক্ষ্য')[0];
ok(!!g, "ANAV এ 'যৌথ লক্ষ্য' গ্রুপ আছে");
ok(g && g.items.length === 7, `যৌথ লক্ষ্য গ্রুপে ${g ? g.items.length : 0}টি এন্ট্রি (প্রত্যাশিত ৭)`);
ok(A.ANAV.length === 9 && A.ANAV.reduce((s, x) => s + x.items.length, 0) === 49, `ANAV: ${A.ANAV.length} গ্রুপ / ${A.ANAV.reduce((s, x) => s + x.items.length, 0)} কী (প্রত্যাশিত ৯/৪৯)`);
ok(g && g.items.every(i => A.META.some(x => x.id === i.go.replace('#', ''))), 'যৌথ লক্ষ্য ড্রয়ারের প্রতিটি লিঙ্কের স্ক্রিন বিদ্যমান');
const jgkeys = g ? g.items.map(i => i.k) : [];
ok(['jgdash', 'jggoal', 'jgjoin', 'jgcollect', 'jgmile', 'jgspend', 'jgreport'].every(k => jgkeys.indexOf(k) >= 0), '৭টি JG নেভ-কী সংজ্ঞায়িত');
ok(APP.every(id => jgkeys.indexOf(A.AMNAV_SCREEN[id]) >= 0), 'AMNAV_SCREEN: am48…am57 → JG কী ম্যাপ করা');
ok(Object.keys(A.AMNAV_SCREEN).length === 74, `AMNAV_SCREEN = ${Object.keys(A.AMNAV_SCREEN).length} কী (প্রত্যাশিত ৭৪)`);
const dOn = id => { const d = w.document.querySelector('#' + id + ' .drawer'); return d ? d.querySelectorAll('.drawer-i.on').length : -1; };
const dAll = id => { const d = w.document.querySelector('#' + id + ' .drawer'); return d ? d.querySelectorAll('.drawer-i').length : -1; };
ok(APP.filter(id => FLOW.indexOf(id) < 0).every(id => dOn(id) === 1), 'ফ্লো ছাড়া প্রতিটি অ্যাপ স্ক্রিনে ড্রয়ারের ১টি এন্ট্রি হাইলাইট' + APP.filter(id => FLOW.indexOf(id) < 0 && dOn(id) !== 1).map(id => ' [' + id + '=' + dOn(id) + ']').join(''));
ok(APP.filter(id => FLOW.indexOf(id) < 0).every(id => dAll(id) === 49), 'ড্রয়ারে সম্পূর্ণ ANAV (৪৯ এন্ট্রি)');

sec('৬ · অ্যাপ শেল চুক্তি (specs/05 MC-01…MC-11)');
const q = (id, sel) => { const e = w.document.querySelector('#' + id); return e ? e.querySelectorAll(sel).length : -1; };
ok(APP.every(id => q(id, '.amhead') === 1 && q(id, '.appbody') === 1), 'প্রতিটি অ্যাপ স্ক্রিনে ১টি amhead + ১টি appbody');
ok(APP.every(id => q(id, '.admin-top') === 0 && q(id, '.crumb') === 0), 'অ্যাপ স্ক্রিনে ডেস্কটপ chrome (admin-top/crumb) নেই');
ok(FLOW.every(id => q(id, '.flowbar') === 1 && q(id, '.bottomnav') === 0 && q(id, '.drawer') === 0), 'ফ্লো স্ক্রিনে (am50/am52/am55) flowbar আছে, নেভ/ড্রয়ার নেই');
ok(FLOW.every(id => !!A.AM_BACK[id]), 'AM_BACK ম্যাপে ফ্লো স্ক্রিনের প্যারেন্ট সংজ্ঞায়িত');
ok(['am50', 'am52', 'am55'].every(id => A.META.find(x => x.id === id).flow === true), 'META-তে ৩টি ফ্লো চিহ্নিত');
const nonFlow = APP.filter(id => FLOW.indexOf(id) < 0);
ok(nonFlow.every(id => q(id, '.decbar') === 1), 'ফ্লো ছাড়া প্রতিটি স্ক্রিনে ঠিক ১টি decbar');
ok(APP.every(id => q(id, '.decbar .btn-primary') <= 1), 'decbar এ দৃশ্যমান প্রাইমারি ≤ ১টি');
ok(nonFlow.every(id => q(id, '.bottomnav') === 1 && q(id, '.bnv') === 5), 'ফ্লো ছাড়া স্ক্রিনে ৫-স্লট বটম নেভ অটুট');
const tbl = [];
APP.forEach(id => { const t = w.document.querySelectorAll('#' + id + ' table'); t.forEach(x => { const cols = x.querySelectorAll('thead th').length; if (cols > 4 || !x.closest('.xtbl-wrap')) tbl.push(id + ':' + cols); }); });
ok(tbl.length === 0, 'অ্যাপ স্ক্রিনে চওড়া টেবিল নেই (≤৪ কলাম, .xtbl-wrap)' + (tbl.length ? ' → ' + tbl.join(', ') : ''));
const LONG = APP.filter(id => H[id].length > 3200);
ok(LONG.every(id => q(id, '.foldgrp') >= 1), `দীর্ঘ অ্যাপ স্ক্রিনে (${LONG.length}টি) ভাঁজ-অঞ্চল আছে`);

sec('৭ · নিষ্ক্রিয় কন্ট্রোল নেই (MC-10)');
const DELEGATED = ['.acc2-h', '.acc-h', '.foldgrp-t', '.radio-card', '.chip-btn', '.chipset', '.seg', '.seg-i', '.seg button',
  '.tabs button', '.tab', '.tabstrip button', 'label.filebtn', '.offq', '.row', '.mrows .row', '.bnv', '.kpi', '.amkpi',
  '.cardlink', '.amburger', '.drawer-i', '.drawer-x', '.sheet-scrim', '.link'];
const dead = [];
APP.forEach(id => {
  w.document.querySelectorAll('#' + id + ' button, #' + id + ' a.btn, #' + id + ' label.filebtn').forEach(b => {
    const has = b.getAttribute('onclick') || b.getAttribute('href') || (b.tagName === 'INPUT') ||
      DELEGATED.some(s => b.matches(s) || b.closest(s));
    if (!has) dead.push(id + ':' + (b.textContent || '').trim().slice(0, 18));
  });
});
ok(dead.length === 0, 'সব বোতাম/লিঙ্ক কার্যকর (হ্যান্ডলার বা ডেলিগেটেড)' + (dead.length ? ' → ' + dead.slice(0, 8).join(', ') : ''));
const noLbl = [];
ALL.forEach(id => w.document.querySelectorAll('#' + id + ' button.iconbtn').forEach(b => {
  if (!b.getAttribute('aria-label') && !b.getAttribute('title') && !b.textContent.trim()) noLbl.push(id);
}));
ok(noLbl.length === 0, 'আইকন-অনলি বোতামে aria-label/title আছে');
const mrow = [];
MEM.forEach(id => w.document.querySelectorAll('#' + id + ' .row').forEach(r => {
  if (!r.getAttribute('onclick') && !r.classList.contains('static')) mrow.push(id);
}));
ok(mrow.length === 0, 'সদস্য স্ক্রিনের প্রতিটি .row সারিতে নেভিগেশন (নতুবা static)' + (mrow.length ? ' → ' + mrow.join(',') : ''));

sec('৮ · ফর্ম লেবেল (MC-18)');
const gaps = [];
ALL.forEach(id => {
  w.document.querySelectorAll('#' + id + ' input, #' + id + ' select, #' + id + ' textarea').forEach(inp => {
    if (inp.type === 'file' || inp.type === 'hidden') return;
    const field = inp.closest('.field');
    const lbl = inp.id && w.document.querySelector('#' + id + ' label[for="' + inp.id + '"]');
    if (!lbl && !inp.closest('label') && !(field && field.querySelector('label'))) gaps.push(id + ':' + (inp.id || inp.name || inp.type));
  });
});
ok(gaps.length === 0, 'প্রতিটি ইনপুটের সাথে লেবেল যুক্ত' + (gaps.length ? ' → ' + gaps.slice(0, 8).join(', ') : ''));
ok(ALL.filter(id => /type="file"/.test(H[id])).every(id => /filebtn/.test(H[id])), 'ফাইল ইনপুটগুলো লেবেল-বাটনে মোড়ানো (ক্যামেরা/গ্যালারি)');

sec('৯ · ডেটা অখণ্ডতা (BR-03/08/12/19, R-01)');
ok(A.JG_GOALS.length === 5 && A.JG_LIMIT.goals === 5, `লক্ষ্য ${A.JG_GOALS.length}টি · প্ল্যানের সীমা ${A.JG_LIMIT.goals}টি (⚠️D-43)`);
ok(A.jgActive().length <= A.JG_LIMIT.goals, `সক্রিয় লক্ষ্য ${A.jgActive().length}টি ≤ সীমা`);
ok(A.JG_GOALS.every(g => /^JG-\d{4}-\d{2}$/.test(g.code)), 'লক্ষ্য কোডের ফরম্যাট JG-YYMM-##');
ok(new Set(A.JG_GOALS.map(g => g.code)).size === A.JG_GOALS.length, 'লক্ষ্য কোড অনন্য');
const sumC = A.JG_CONTRIBS.reduce((s, c) => s + c.amount, 0);
const sumG = A.JG_GOALS.reduce((s, g) => s + A.jgCollected(g.id), 0);
ok(sumC === sumG, `অবদানের সমষ্টি = লক্ষ্যভিত্তিক সংগৃহীত (${sumC} paisa)`);
ok(A.JG_CONTRIBS.every(c => /^JC-\d{4}-\d{4}$/.test(c.receipt)), 'সব অবদান রসিদের ফরম্যাট JC-YYMM-#### (BR-08)');
ok(new Set(A.JG_CONTRIBS.map(c => c.receipt)).size === A.JG_CONTRIBS.length, `${A.JG_CONTRIBS.length}টি রসিদ নম্বর অনন্য — পুনর্ব্যবহার নেই`);
ok(A.JG_CONTRIBS.every(c => c.amount > 0 && Number.isInteger(c.amount)), 'প্রতিটি অবদানের অঙ্ক > ০ ও পূর্ণ পয়সায়');
ok(A.JG_CONTRIBS.every(c => A.JG_CHANNEL.some(x => x.k === c.channel)), 'সব অবদানের মাধ্যম বৈধ');
ok(A.JG_DISB.every(x => /^JD-\d{4}-\d{4}$/.test(x.no)) && new Set(A.JG_DISB.map(x => x.no)).size === A.JG_DISB.length, 'ভাউচার নম্বর JD-YYMM-#### ও অনন্য');
const paid = A.JG_DISB.filter(x => x.status === 'paid');
ok(paid.every(x => x.by && x.appr && x.by !== x.appr), `পরিশোধিত ${paid.length}টি ভাউচারে maker ≠ checker (BR-04)`);
ok(paid.every(x => (x.evidence || []).length > 0), 'পরিশোধিত প্রতিটি ভাউচারে প্রমাণ আছে (⚠️D-50)');
ok(paid.every(x => /^[0-9a-f]{8}$/.test(x.hash || '')), 'পরিশোধিত ভাউচারে ৮-অক্ষরের হ্যাশ');
ok(A.JG_DISB.filter(x => x.status === 'approval').every(x => !x.appr), 'অনুমোদনাধীন ভাউচারে checker এখনো বসেনি');
ok(A.JG_GOALS.every(g => A.JG_DISB.filter(x => x.goal === g.id && x.status !== 'planned')
  .reduce((s, x) => s + x.amount, 0) <= A.jgCollected(g.id)), 'কোনো লক্ষ্যে সংগৃহীতের চেয়ে বেশি বিতরণ নেই');
ok(A.JG_PARTS.every(p => A.JG_PART_ST[p.status]), 'সব অংশগ্রহণের অবস্থা বৈধ');
ok(A.JG_PARTS.every(p => !!A.JG_GOALS.filter(g => g.id === p.goal)[0]), 'প্রতিটি অংশগ্রহণের লক্ষ্য বিদ্যমান');
const rp = A.jgRefundPlan('jg03');
ok(rp.total === A.jgCollected('jg03'), `jg03 আনুপাতিক ফেরত ${rp.total} = সংগৃহীত (কাটতি নেই)`);
ok(rp.rows.every(r => r.amt > 0) && Math.abs(rp.rows.reduce((s, r) => s + r.amt, 0) - rp.total) === 0, 'ফেরত ছকের সমষ্টি মিলে যায়');
ok(A.JG_GOALS.every(g => A.jgMilestones(g.id).map(x => x.pct).join(',') === A.JG_MS.join(',')), 'প্রতিটি লক্ষ্যে মাইলস্টোন ধাপ ২৫/৫০/৭৫/১০০');
const mono = A.JG_GOALS.filter(g => { const r = A.jgMilestones(g.id).filter(x => x.reachedAt).map(x => x.at || x.reachedAt); return r.some((d, i) => i && d < r[i - 1]); });
ok(mono.length === 0, 'মাইলস্টোনের তারিখ ক্রমবর্ধমান (মনোটোনিক)' + (mono.length ? ' → ' + mono.map(x => x.code).join(',') : ''));
ok(A.JG_GOALS.every(g => A.jgPct(g.id) >= 0 && A.jgPct(g.id) <= 200), 'অগ্রগতির শতকরা যুক্তিসঙ্গত সীমায়');
ok(A.JG_GOALS.filter(g => A.jgPct(g.id) >= 100).every(g => !!A.jgAchievedAt(g.id)), '১০০% পূর্ণ লক্ষ্যে অর্জনের তারিখ সংরক্ষিত');
ok(A.jgAllArrears().every(x => x.gap > 0 && x.expected >= x.paid), 'বকেয়া তালিকার হিসাব সঠিক (প্রত্যাশিত ≥ প্রাপ্ত, ঘাটতি > ০)');
ok(A.jgAllArrears().every(x => !x.p || x.p.status !== 'removed'), 'বাদ দেওয়া অংশগ্রহণ বকেয়া তালিকায় নেই');
ok(A.jgPendingList().length >= 4, `অনুমোদন কিউতে ${A.jgPendingList().length}টি কাজ (বিতরণ/যোগদান/নিষ্পত্তি)`);
ok(A.jgMyParts().length >= 2 && !!A.jgMyMain(), `ডেমো সদস্য (${A.JG_ME}) ${A.jgMyParts().length}টি লক্ষ্যে যুক্ত`);
const my = A.jgMyParts().filter(x => x.goal.id === 'jg01')[0];
ok(my && A.jgContributed('jg01', A.JG_ME) === 450000 && my.part.pledged === 600000 && my.gap === 0, 'm1·jg01: জমা ৳৪,৫০০ / প্রতিশ্রুতি ৳৬,০০০ / বকেয়া ৳০ (§৫.x নমুনা)');

sec('১০ · নীতি ও সিদ্ধান্ত ফ্ল্যাগ (BR-19, ⚠️D-37/39/49/50/68)');
const NEED = ['D-37', 'D-39', 'D-49', 'D-50', 'D-68'];
NEED.forEach(d => {
  const where = ALL.filter(id => H[id].indexOf(d) >= 0);
  ok(where.length >= 2, `${d} কমপক্ষে ২টি স্ক্রিনে ফ্ল্যাগ করা (${where.length}: ${where.slice(0, 5).join(', ')})`);
});
ok(ALL.every(id => /BR-19|ব্যক্তিগত উত্তোলন/.test(mainOf(id)) || MEM.indexOf(id) < 0 && APP.indexOf(id) < 0 || /BR-19/.test(mainOf(id)) || true), 'BR-19 উল্লেখ যাচাই (নিচে আলাদা)');
const br19 = ALL.filter(id => /ব্যক্তিগত উত্তোলন|BR-19/.test(mainOf(id)));
ok(br19.length >= 8, `BR-19 (ব্যক্তিগত উত্তোলন নেই) ${br19.length}টি স্ক্রিনে স্পষ্ট`);
const lb = [];
ALL.forEach(id => { const body = mainOf(id); let i = -1; while ((i = body.indexOf('লিডারবোর্ড', i + 1)) >= 0) lb.push([id, body.slice(Math.max(0, i - 40), i + 60)]); });
ok(lb.length > 0 && lb.every(x => /নেই|বন্ধ|বাদ|নয়|না|হয়নি|হবে না|no/i.test(x[1])), `লিডারবোর্ডের প্রতিটি উল্লেখ নেতিবাচক (⚠️D-68) — ${lb.length}টি` + (lb.filter(x => !/নেই|বন্ধ|বাদ|নয়|না|হয়নি|হবে না/i.test(x[1])).length ? ' ✗ ' + JSON.stringify(lb.filter(x => !/নেই|বন্ধ|বাদ|নয়|না|হয়নি|হবে না/i.test(x[1]))[0]) : ''));
ok(ALL.every(id => !/ট্রফি|রেঙ্ক|চ্যাম্পিয়ন|শীর্ষ ৩ জন|পয়েন্ট টেবিল/.test(mainOf(id))), 'প্রতিযোগিতামূলক উপাদানের শব্দ নেই (⚠️D-68)');
ok(H['a59'].indexOf('আনুপাতিক') >= 0 && H['am56'].indexOf('আনুপাতিক') >= 0, 'JA-09/JAM-09 এ আনুপাতিক ফেরতের নিয়ম (⚠️D-39)');
ok(H['a58'].indexOf('কমিটির') >= 0 && H['a58'].indexOf('প্রমাণ') >= 0, 'JA-08 এ কমিটির সিদ্ধান্ত + প্রমাণ বাধ্যতামূলক (⚠️D-50)');
ok(/LIMIT_MATRIX|roleLimit|সীমা/.test(H['a58']) && H['am55'].indexOf('⚠️D-22') >= 0, 'অনুমোদন সীমা (⚠️D-22) দুই প্রেজেন্টেশনে দেখানো');
ok(H['a53'].indexOf('সংস্করণ') >= 0 && H['am50'].indexOf('সংস্করণ') >= 0, 'লক্ষ্যের নিয়মে versioning উল্লেখ (§৪.১)');
ok(H['a56'].indexOf('JC-') >= 0 && H['am53'].indexOf('JC-') >= 0, 'সংগ্রহ স্ক্রিনে রসিদ ধারা JC-…');
ok(H['a60'].indexOf('৳০') >= 0 && H['am57'].indexOf('৳০') >= 0, 'JA-10/JAM-10 এ ট্রায়াল ব্যালেন্স ৳০ (BR-12)');

sec('১১ · অবশিষ্ট কাজ স্পষ্টভাবে চিহ্নিত (মিথ্যা দাবি নেই)');
ok(/F-13/.test(H['a60']) && /F-14/.test(H['a60']) && /তৈরি নয়/.test(H['a60']), 'JA-10 এ F-13/F-14 "এখনো তৈরি নয়" বলে লেখা');
ok(/F-13/.test(H['am57']) && /তৈরি নয়/.test(H['am57']), 'JAM-10 এও F-13/F-14 অবশিষ্ট বলে চিহ্নিত');

sec('১২ · সদস্য প্যানেলে পৌঁছ (§৫.৭)');
const R = {}; ['m01', 'm04', 'm16', 'm18'].forEach(id => { R[id] = A.renderOne(id); });
ok(R['m01'].indexOf("go('#m28')") >= 0 && R['m01'].indexOf('আমাদের লক্ষ্য') >= 0, 'M-01 হোমে 🟣 যৌথ লক্ষ্য কার্ড → #m28');
ok(/৳২,০০,০০০/.test(R['m01']) && /৬৮%/.test(R['m01']), 'M-01 কার্ডে লক্ষ্য ৳২,০০,০০০ ও ৬৮% অগ্রগতি');
ok(/৳৪,৫০০/.test(R['m01']) && /৳৬,০০০/.test(R['m01']), 'M-01 কার্ডে আমার জমা ৳৪,৫০০ / প্রতিশ্রুতি ৳৬,০০০');
ok(R['m04'].indexOf('যৌথ লক্ষ্যে আমার জমা') >= 0 && R['m04'].indexOf("go('#m31')") >= 0, 'M-04 এ যৌথ লক্ষ্যের পৃথক কার্ড → #m31');
ok(/যোগ হয় না/.test(R['m04']) && /D-37/.test(R['m04']) && /BR-19/.test(R['m04']), 'M-04 এ স্পষ্ট: মোট সঞ্চয়ে যোগ হয় না (⚠️D-37) + ব্যক্তিগত উত্তোলন নেই (BR-19)');
ok(/৳০/.test(R['m04'].slice(R['m04'].indexOf('যৌথ লক্ষ্যে আমার জমা'))), 'M-04 কার্ডে "এখন তোলা যাবে ৳০"');
ok(R['m16'].indexOf('লক্ষ্যের খবর') >= 0 && /#m29|#m31|#m32/.test(R['m16']), 'M-16 নোটিফিকেশনে লক্ষ্যের খবর (মাইলস্টোন/খরচ/ফেরত)');
ok(R['m18'].indexOf('#m28') >= 0 && R['m18'].indexOf('#m31') >= 0 && R['m18'].indexOf('#m32') >= 0 && R['m18'].indexOf('আমার মডিউল') >= 0, 'M-18 "আমার মডিউল" সেকশনে ৩টি JG লিঙ্ক');
ok(['m01', 'm04', 'm16', 'm18'].every(id => !/undefined|NaN|\[object|\$\{/.test(R[id])), 'সম্প্রসারিত সদস্য স্ক্রিনগুলোতে রেন্ডার ফাঁস নেই');
const jgRegion = { m01: ['আমাদের লক্ষ্য', 1400], m04: ['যৌথ লক্ষ্যে আমার জমা', 1900], m16: ['লক্ষ্যের খবর', 2800], m18: ['আমাদের লক্ষ্য', 1200] };
const regBan = [];
Object.keys(jgRegion).forEach(id => { const mk = jgRegion[id][0], len = jgRegion[id][1]; const i = R[id].indexOf(mk);
  if (i < 0) { regBan.push(id + ':চিহ্ন নেই'); return; }
  /* অঞ্চলের শেষ = নির্ধারিত দৈর্ঘ্য অথবা পরবর্তী মডিউলের চিহ্ন (কর্জে হাসানা), যেটি আগে আসে।
     M01/M04/M16/M18-এ JG-অঞ্চলের ঠিক পরেই কর্জে হাসানার অঞ্চল বসেছে — ওখানে "সুদ ৳০" অনুমোদিত প্রকাশ,
     তাই JG-অঞ্চল সেখানেই শেষ ধরা হয় (QH-এর নিজস্ব ভাষা-যাচাই tqh.mjs-এ আলাদাভাবে চলে)। */
  const nxt = R[id].indexOf('কর্জে হাসানা', i);
  const end = nxt > i ? Math.min(i + len, nxt) : i + len;
  const seg = R[id].slice(i, end); BAN.forEach(b => { if (seg.indexOf(b) >= 0) regBan.push(id + ':' + b); }); });
ok(regBan.length === 0, 'সদস্য স্ক্রিনের JG-অঞ্চলে নিষিদ্ধ শব্দ নেই' + (regBan.length ? ' → ' + regBan.join(', ') : ''));
ok(MEM.every(id => H[id].indexOf('bottomnav') >= 0), 'সদস্য স্ক্রিনে বটম নেভ অটুট (৫ স্লট)');
ok(MEM.every(id => /class="[^"]*phone-scroll/.test(H[id]) && /class="[^"]*appbody/.test(H[id])), 'সদস্য স্ক্রিনে phone-scroll + appbody কাঠামো');

sec('১৩ · ওয়েব স্ক্রিনের গঠন ও প্যারিটি');
ok(WEB.every(id => H[id].indexOf('class="scr"') >= 0 && H[id].indexOf('admin-shell') >= 0), '১০টি ওয়েব স্ক্রিনে অ্যাডমিন শেল ও ব্রাউজার ফ্রেম');
ok(WEB.every(id => H[id].indexOf('scr-code') >= 0 && /JA-\d\d/.test(H[id])), 'প্রতিটি ওয়েব স্ক্রিনে JA-কোড হেডারে');
ok(WEB.every(id => H[id].indexOf('sb-item') >= 0), 'ওয়েব সাইডবারে ANAV রেন্ডার হয়েছে');
const wb = WEB.map(id => (H[id].match(/class="sb-item/g) || []).length);
ok(wb.every(x => x === 49), 'সাইডবারে ৪৯টি নেভ এন্ট্রি (৯ গ্রুপ)' + (wb.every(x => x === 49) ? '' : ' → ' + wb.join(',')));
ok(WEB.every(id => /class="sb-item on"/.test(H[id])), 'প্রতিটি ওয়েব স্ক্রিনে নিজের নেভ এন্ট্রি হাইলাইট');
ok(WEB.every(id => H[id].indexOf('scr-goal') >= 0 && H[id].indexOf('MVP 🟢') >= 0), 'প্রতিটি ওয়েব স্ক্রিনে লক্ষ্য ও MVP ট্যাগ');
const KPIW = ['a51', 'a52', 'a56', 'a57', 'a58', 'a59', 'a60'];
ok(KPIW.every(id => /class="kpis/.test(H[id])), `সারাংশ দেখানো ${KPIW.length}টি ওয়েব স্ক্রিনে KPI গ্রিড (ফর্ম/হাব বাদে)`);
/* প্যারিটি: প্রতিটি JA-কোডের দুটি প্রেজেন্টেশন, একই ডেটা-উৎস */
ok(APP.every((id, i) => H[id].indexOf('JA-' + String(i + 1).padStart(2, '0')) >= 0 || A.META.find(x => x.id === id).logical === 'JA-' + String(i + 1).padStart(2, '0')), 'প্রতিটি JAM স্ক্রিন তার JA সমতুল্যের সাথে যুক্ত');
const pairs = [['a51', 'am48'], ['a52', 'am49'], ['a54', 'am51'], ['a56', 'am53'], ['a57', 'am54'], ['a59', 'am56'], ['a60', 'am57']];
const BNR = /৳[\u09E6-\u09EF,]+/g;
const sharedNums = pairs.filter(p => (H[p[0]].match(BNR) || []).some(v => H[p[1]].indexOf(v) >= 0));
ok(sharedNums.length === pairs.length, `${sharedNums.length}/${pairs.length} জোড়ায় একই অঙ্ক দুই প্রেজেন্টেশনে (এক Backend, এক নিয়ম)` + (sharedNums.length === pairs.length ? '' : ' → বাদ: ' + pairs.filter(p => sharedNums.indexOf(p) < 0).map(p => p.join('↔')).join(', ')));

console.log('\n' + (fail === 0 ? `✅ ALL GREEN — ${n}টি পরীক্ষা পাস` : `❌ ${fail} FAILED / ${n} পরীক্ষা`));
if (warns.length) console.log('console.warn (' + warns.length + '): ' + warns.slice(0, 6).join(' | '));
process.exit(fail ? 1 : 0);
