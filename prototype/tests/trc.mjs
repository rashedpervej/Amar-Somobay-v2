/* ROSCA contract harness — prototype/screens.html (মডিউল ২)
   Usage: node prototype/tests/trc.mjs
   যাচাই করে: ৩০টি ROSCA স্ক্রিন রেন্ডার, specs/03 §৫.৩ ভাষা/নিষিদ্ধ শব্দ, §৫.৬ সিট কার্ডের ৪ তথ্য,
   ANAV 'ROSCA চক্র' গ্রুপ ও ড্রয়ার পৌঁছ, AMNAV_SCREEN ম্যাপিং, ফ্লো/নেভ চুক্তি (specs/05 MC-01…MC-18-এর ROSCA অংশ),
   ডেটা অখণ্ডতা (পুল/সংগ্রহ/ঘাটতি, maker≠checker, রসিদ ও হ্যাশ), এবং D-কোড ফ্ল্যাগ। */
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
;globalThis.__rc = {
  META, ANAV, AMNAV_SCREEN, AM_BACK, mount,
  RC_SCHEMES, RC_CIRCLES, RC_DRAWS, RC_SEAT_MAP, RC_WAITLIST, RC_DEFAULTS, RC_ME, RC_PAYOUT, RC_METHOD,
  rcScheme, rcCircle, rcPerDraw, rcTotalPool, rcDraws, rcSeats, rcSeat, rcFilled, rcWaitlist,
  rcCollected, rcShortfall, rcMySeats, rcCandidates, rcDef,
  renderOne: (id) => { const x = META.find(mm => mm.id === id); if (!x) throw new Error('no meta ' + id);
    __AM_CUR = id; try { return x.fn(); } finally { __AM_CUR = null; } },
};`);
const A = w.__rc;
A.mount();

let fail = 0, n = 0;
const ok = (c, msg) => { n++; if (!c) { console.log('  ✗ ' + msg); fail++; } else console.log('  ✓ ' + msg); };
const sec = t => console.log('\n— ' + t);

/* ---------- স্ক্রিন তালিকা ---------- */
const WEB = ['a39','a40','a41','a42','a43','a44','a45','a46','a47','a48','a49','a50'];
const APP = ['am36','am37','am38','am39','am40','am41','am42','am43','am44','am45','am46','am47'];
const MEM = ['m22','m23','m24','m25','m26','m27'];
const ALL = WEB.concat(APP, MEM);
const FLOW = ['am38','am41','am43'];
const H = {};
ALL.forEach(id => { try { H[id] = A.renderOne(id); } catch (e) { H[id] = '\nRENDER_ERROR: ' + e.message + '\n'; } });

console.log('\n=== ROSCA কনট্র্যাক্ট হার্নেস (trc) ===');

sec('১ · META ও কোড ম্যাপিং');
ok(A.META.length === 199, `META = ${A.META.length} (প্রত্যাশিত 199)`);
const codes = id => (A.META.find(x => x.id === id) || {}).code;
ok(WEB.every((id, i) => codes(id) === 'RA-' + String(i + 1).padStart(2, '0')), 'RA-01…RA-12 → a39…a50 ঠিকভাবে ম্যাপ করা');
ok(APP.every((id, i) => codes(id) === 'RAM-' + String(i + 1).padStart(2, '0')), 'RAM-01…RAM-12 → am36…am47 ঠিকভাবে ম্যাপ করা');
ok(MEM.every((id, i) => codes(id) === 'RM-' + String(i + 1).padStart(2, '0')), 'RM-01…RM-06 → m22…m27 ঠিকভাবে ম্যাপ করা');
ok(APP.every(id => { const x = A.META.find(mm => mm.id === id); return x.pres === 'app' && x.variant === 'mobile'; }), '১২টি অ্যাপ স্ক্রিনে pres:app + variant:mobile');
ok(APP.every(id => { const x = A.META.find(mm => mm.id === id); return /^RA-\d\d$/.test(x.logical || ''); }), 'প্রতিটি অ্যাপ স্ক্রিনের logical = সংশ্লিষ্ট RA-কোড');
ok(MEM.every(id => (A.META.find(mm => mm.id === id) || {}).role === 'MEMBER'), '৬টি সদস্য স্ক্রিনে role: MEMBER');

sec('২ · রেন্ডার ও হাইজিন');
ok(ALL.every(id => !/RENDER_ERROR/.test(H[id])), '৩০টি স্ক্রিন ত্রুটি ছাড়া রেন্ডার হয়েছে' + ALL.filter(id => /RENDER_ERROR/.test(H[id])).map(id => ' [' + id + ': ' + (H[id].match(/RENDER_ERROR: ([^\n]+)/) || [])[1] + ']').join(''));
const bad = id => ['undefined', 'NaN', '[object', '${'].filter(t => H[id].indexOf(t) >= 0);
ok(ALL.every(id => bad(id).length === 0), 'কোনো স্ক্রিনে undefined/NaN/[object/${ ফাঁস নেই' + ALL.filter(id => bad(id).length).map(id => ' [' + id + ':' + bad(id) + ']').join(''));
ok(ALL.every(id => H[id].length > 900), 'প্রতিটি স্ক্রিনে পর্যাপ্ত কনটেন্ট (>৯০০ অক্ষর)');

sec('৩ · ভাষা ও নিষিদ্ধ শব্দ (§৫.৩)');
const BAN = ['লোন', 'সুদ', 'বিনিয়োগ', 'মুনাফা', 'ইন্টারেস্ট'];
const hits = [];
ALL.forEach(id => BAN.forEach(b => { if (H[id].indexOf(b) >= 0) hits.push(id + ':' + b); }));
ok(hits.length === 0, 'নিষিদ্ধ শব্দ শূন্য (কোনো নেগেশন ছাড়াই)' + (hits.length ? ' → ' + hits.join(', ') : ''));
const VOC = ['আমার চক্র', 'কিস্তি', 'ড্র'];
ok(MEM.every(id => VOC.every(v => H[id].indexOf(v) >= 0)), 'সদস্য স্ক্রিনে ROSCA ভাষা: আমার চক্র · কিস্তি · ড্র');
ok(MEM.filter(id => /পেয়েছি|পাব/.test(H[id])).length === MEM.length, 'সদস্য স্ক্রিনে "পেয়েছি / পাব" পরিভাষা আছে');
const latin = [];
ALL.forEach(id => { const t = H[id].match(/৳\s*[0-9][0-9,.]*/g); if (t) latin.push(id + ':' + t.slice(0, 2).join('|')); });
ok(latin.length === 0, '৳ এর পরে সব অঙ্ক বাংলায়' + (latin.length ? ' → ' + latin.join(', ') : ''));

sec('৪ · সিট কার্ডের চারটি তথ্য (§৫.৬)');
const facts = H['m22'].split('class="rcc-facts"').length - 1;
ok(facts >= 4, `RM-01 এ ${facts}টি সিট কার্ড (৪টি চক্রের জন্য)`);
ok(['১ · আমি জমা দিয়েছি', '২ · আমি পেয়েছি কি না', '৩ · পরবর্তী ড্র', '৪ · বাকি কারা পায়নি'].every(l => H['m22'].indexOf(l) >= 0), 'RM-01 এর প্রতিটি কার্ডে ৪টি বাধ্যতামূলক তথ্য');
ok(['১ · আমি জমা দিয়েছি', '২ · আমি পেয়েছি কি না', '৩ · পরবর্তী ড্র', '৪ · বাকি কারা পায়নি'].every(l => H['m23'].indexOf(l) >= 0), 'RM-02 (চক্র বিস্তারিত) এও ৪টি তথ্য');
ok(/ড্র .* ইতিহাস|অপরিবর্তনীয়/.test(H['m26']) && H['m26'].indexOf('হ্যাশ') >= 0, 'RM-05 এ অপরিবর্তনীয় ইতিহাস ও হ্যাশ');
ok(H['m27'].indexOf('RP-') >= 0 && H['m27'].indexOf('maker ≠ checker') >= 0, 'RM-06 ভাউচারে রসিদ নম্বর ও maker ≠ checker');

sec('৫ · ANAV ও পৌঁছ (D-35)');
const g = A.ANAV.filter(x => x.g === 'ROSCA চক্র')[0];
ok(!!g, "ANAV এ 'ROSCA চক্র' গ্রুপ আছে");
ok(g && g.items.length === 7, `ROSCA গ্রুপে ${g ? g.items.length : 0}টি এন্ট্রি (প্রত্যাশিত ৭)`);
ok(A.ANAV.length === 9 && A.ANAV.reduce((s, x) => s + x.items.length, 0) === 49, `ANAV: ${A.ANAV.length} গ্রুপ / ${A.ANAV.reduce((s, x) => s + x.items.length, 0)} কী (প্রত্যাশিত ৯/৪৯)`);
ok(g && g.items.every(i => A.META.some(x => x.id === i.go.replace('#', ''))), 'ROSCA ড্রয়ারের প্রতিটি লিঙ্কের স্ক্রিন বিদ্যমান');
const rckeys = g ? g.items.map(i => i.k) : [];
ok(['rcdash', 'rcscheme', 'rccircle', 'rcdraw', 'rccollect', 'rcdefault', 'rcreport'].every(k => rckeys.indexOf(k) >= 0), '৭টি ROSCA নেভ-কী সংজ্ঞায়িত');
ok(APP.every(id => rckeys.indexOf(A.AMNAV_SCREEN[id]) >= 0), 'AMNAV_SCREEN: am36…am47 → ROSCA কী ম্যাপ করা');
const dOn = id => { const d = w.document.querySelector('#' + id + ' .drawer'); return d ? d.querySelectorAll('.drawer-i.on').length : -1; };
const dAll = id => { const d = w.document.querySelector('#' + id + ' .drawer'); return d ? d.querySelectorAll('.drawer-i').length : -1; };
ok(APP.filter(id => FLOW.indexOf(id) < 0).every(id => dOn(id) === 1), 'ফ্লো ছাড়া প্রতিটি অ্যাপ স্ক্রিনে ড্রয়ারের ১টি এন্ট্রি হাইলাইট' + APP.filter(id => FLOW.indexOf(id) < 0 && dOn(id) !== 1).map(id => ' [' + id + '=' + dOn(id) + ']').join(''));
ok(APP.filter(id => FLOW.indexOf(id) < 0).every(id => dAll(id) === 49), 'ড্রয়ারে সম্পূর্ণ ANAV (৪৯ এন্ট্রি)');

sec('৬ · অ্যাপ শেল চুক্তি (specs/05 MC-01…MC-11)');
const q = (id, sel) => { const e = w.document.querySelector('#' + id); return e ? e.querySelectorAll(sel).length : -1; };
ok(APP.every(id => q(id, '.amhead') === 1 && q(id, '.appbody') === 1), 'প্রতিটি অ্যাপ স্ক্রিনে ১টি amhead + ১টি appbody');
ok(APP.every(id => q(id, '.admin-top') === 0 && q(id, '.crumb') === 0), 'অ্যাপ স্ক্রিনে ডেস্কটপ chrome (admin-top/crumb) নেই');
ok(FLOW.every(id => q(id, '.flowbar') === 1 && q(id, '.bottomnav') === 0 && q(id, '.drawer') === 0), 'ফ্লো স্ক্রিনে flowbar আছে, নেভ/ড্রয়ার নেই');
ok(FLOW.every(id => /class="iconbtn[^"]*"[^>]*aria-label="ফিরে|amhead-back|aria-label="পিছনে|class="[^"]*back/.test(H[id])), 'ফ্লো স্ক্রিনে ব্যাক বাটন আছে');
ok(FLOW.every(id => !!A.AM_BACK[id]), 'AM_BACK ম্যাপে ফ্লো স্ক্রিনের প্যারেন্ট সংজ্ঞায়িত');
const nonFlow = APP.filter(id => FLOW.indexOf(id) < 0);
ok(nonFlow.every(id => q(id, '.decbar') === 1), 'ফ্লো ছাড়া প্রতিটি স্ক্রিনে ঠিক ১টি decbar');
ok(APP.every(id => q(id, '.decbar .btn-primary') <= 1), 'decbar এ দৃশ্যমান প্রাইমারি ≤ ১টি');
ok(nonFlow.every(id => q(id, '.bottomnav') === 1 && q(id, '.bnv') === 5), 'ফ্লো ছাড়া স্ক্রিনে ৫-স্লট বটম নেভ');
const tbl = [];
APP.forEach(id => { const t = w.document.querySelectorAll('#' + id + ' table'); t.forEach(x => { const cols = x.querySelectorAll('thead th').length; if (cols > 4 || !x.closest('.xtbl-wrap')) tbl.push(id + ':' + cols); }); });
ok(tbl.length === 0, 'অ্যাপ স্ক্রিনে চওড়া টেবিল নেই (≤৪ কলাম, .xtbl-wrap)' + (tbl.length ? ' → ' + tbl.join(', ') : ''));

sec('৭ · নিষ্ক্রিয় কন্ট্রোল নেই (MC-10)');
const DELEGATED = ['.acc2-h', '.acc-h', '.foldgrp-t', '.radio-card', '.chip-btn', '.chipset', '.seg', '.seg-i', '.seg button',
  '.tabs button', '.tab', '.tabstrip button', 'label.filebtn', '.offq', '.row', '.mrows .row', '.bnv', '.kpi', '.amkpi',
  '.cardlink', '.amburger', '.drawer-i', '.drawer-x', '.sheet-scrim', '.eye', '.bnv'];
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
APP.concat(MEM, WEB).forEach(id => w.document.querySelectorAll('#' + id + ' button.iconbtn').forEach(b => {
  if (!b.getAttribute('aria-label') && !b.getAttribute('title') && !b.textContent.trim()) noLbl.push(id);
}));
ok(noLbl.length === 0, 'আইকন-অনলি বোতামে aria-label/title আছে');
const mrow = [];
MEM.forEach(id => w.document.querySelectorAll('#' + id + ' .row').forEach(r => {
  if (!r.getAttribute('onclick') && !r.classList.contains('static')) mrow.push(id);
}));
ok(mrow.length === 0, 'সদস্য স্ক্রিনের প্রতিটি .row সারিতে নেভিগেশন (নতুবা static চিহ্নিত)' + (mrow.length ? ' → ' + mrow.join(',') : ''));

sec('৮ · ফর্ম লেবেল (MC-18)');
const gaps = [];
APP.concat(MEM, WEB).forEach(id => {
  w.document.querySelectorAll('#' + id + ' input, #' + id + ' select, #' + id + ' textarea').forEach(inp => {
    if (inp.type === 'file' || inp.type === 'hidden') return;
    const field = inp.closest('.field');
    const lbl = inp.id && w.document.querySelector('#' + id + ' label[for="' + inp.id + '"]');
    if (!lbl && !inp.closest('label') && !(field && field.querySelector('label'))) gaps.push(id + ':' + (inp.id || inp.name || inp.type));
  });
});
ok(gaps.length === 0, 'প্রতিটি ইনপুটের সাথে লেবেল যুক্ত' + (gaps.length ? ' → ' + gaps.slice(0, 8).join(', ') : ''));

sec('৯ · ডেটা অখণ্ডতা (R-01/R-02, BR-04, BR-08)');
ok(A.RC_SCHEMES.every(s => A.rcTotalPool(s) === A.rcPerDraw(s) * s.seats && A.rcPerDraw(s) === s.seats * s.contrib), 'পুলের হিসাব: সিট × কিস্তি × সিট');
ok(A.RC_CIRCLES.every(c => A.rcShortfall(c.id) >= 0 && A.rcFilled(c.id) <= A.rcScheme(c.scheme).seats), 'ঘাটতি ≥ ০ এবং সিট সংখ্যা সীমার মধ্যে');
const ex = A.RC_DRAWS.filter(d => d.status === 'executed');
ok(ex.every(d => d.by && d.appr && d.by !== d.appr), `সম্পন্ন ${ex.length}টি ড্রয়ের সবগুলোতে maker ≠ checker (BR-04)`);
ok(ex.every(d => /^RP-\d{4}-\d{4}$/.test(d.receipt)), 'সব রসিদ নম্বরের ফরম্যাট RP-YYMM-#### (BR-08)');
ok(new Set(ex.map(d => d.receipt)).size === ex.length, 'রসিদ নম্বর অনন্য — পুনর্ব্যবহার নেই');
ok(ex.every(d => /^[0-9a-f]{8}$/.test(d.hash)), 'সব ড্রয়ে ৮-অক্ষরের হ্যাশ সংরক্ষিত');
ok(A.RC_PAYOUT.filter(p => !p.on).every(p => /D-12/.test(p.flag || '')), 'নিষ্ক্রিয় পেআউট চ্যানেলে ⚠️D-12 ফ্ল্যাগ');
ok(A.RC_WAITLIST.every(x => A.rcSeats(x.circle).filter(s => s.memberId === x.memberId).length === 0), 'ওয়েটলিস্টের সদস্য ইতোমধ্যে সিটে নেই');
ok(A.RC_DEFAULTS.every(x => !!A.rcSeat(x.circle, x.seatNo)), 'প্রতিটি ডিফল্ট কেসের সিট বিদ্যমান');
const mySeats = A.rcMySeats();
ok(mySeats.length === 4 && mySeats.filter(x => x.wait).length === 1, `ডেমো সদস্যের ${mySeats.length}টি চক্র (১টি ওয়েটলিস্ট)`);

sec('১০ · সিদ্ধান্ত ফ্ল্যাগ (D-কোড)');
const allHtml = ALL.map(id => H[id]).join('\n');
['D-12', 'D-29', 'D-38', 'D-41', 'D-42', 'D-46', 'D-48'].forEach(d => {
  const cnt = ALL.filter(id => H[id].indexOf(d) >= 0).length;
  ok(cnt >= 1, `⚠️${d} অন্তত একটি স্ক্রিনে চিহ্নিত (${cnt}টি স্ক্রিন)`);
});
ok(allHtml.indexOf('⚠️') >= 0, 'অমীমাংসিত নিয়ম ⚠️ চিহ্নসহ দেখানো হচ্ছে');

sec('১১ · সদস্য প্যানেলে পৌঁছ (§৫.৭)');
const R = {}; ['m01', 'm04', 'm08', 'm16', 'm18'].forEach(id => { R[id] = A.renderOne(id); });
ok(R['m01'].indexOf("go('#m22')") >= 0 && R['m01'].indexOf('আমার চক্র') >= 0, 'M-01 হোমে ROSCA মডিউল কার্ড → #m22');
ok(R['m04'].indexOf("go('#m22')") >= 0 && R['m04'].indexOf('চক্রে আমার জমা') >= 0, 'M-04 সঞ্চয় সারাংশে চক্রের পুল আলাদা করে দেখানো');
ok(R['m16'].indexOf('#m24') >= 0 && R['m16'].indexOf('চক্রের খবর') >= 0, 'M-16 নোটিফিকেশনে ড্র ফলাফল ও পরবর্তী ড্র');
ok(R['m18'].indexOf('#m22') >= 0 && R['m18'].indexOf('আমার মডিউল') >= 0, 'M-18 "আমার মডিউল" সেকশনে আমার চক্র লিঙ্ক');
ok(['m01', 'm04', 'm16', 'm18'].every(id => !/undefined|NaN|\[object|\$\{/.test(R[id])), 'সম্প্রসারিত সদস্য স্ক্রিনগুলোতে রেন্ডার ফাঁস নেই');
ok(MEM.every(id => H[id].indexOf('bottomnav') >= 0), 'সদস্য স্ক্রিনে বটম নেভ অটুট');
ok(MEM.every(id => /class="[^"]*phone-scroll/.test(H[id]) && /class="[^"]*appbody/.test(H[id])), 'সদস্য স্ক্রিনে phone-scroll + appbody কাঠামো');

sec('১২ · ওয়েব স্ক্রিনের গঠন');
ok(WEB.every(id => H[id].indexOf('class="scr"') >= 0 && H[id].indexOf('admin-shell') >= 0), '১২টি ওয়েব স্ক্রিনে অ্যাডমিন শেল ও ব্রাউজার ফ্রেম');
ok(WEB.every(id => H[id].indexOf('scr-code') >= 0 && /RA-\d\d/.test(H[id])), 'প্রতিটি ওয়েব স্ক্রিনে RA-কোড হেডারে');
ok(WEB.every(id => H[id].indexOf('sb-item') >= 0), 'ওয়েব সাইডবারে ANAV রেন্ডার হয়েছে');
const wb = WEB.map(id => (H[id].match(/class="sb-item/g) || []).length);
ok(wb.every(x => x === 49), 'সাইডবারে ৪৯টি নেভ এন্ট্রি (৯ গ্রুপ)' + (wb.every(x => x === 49) ? '' : ' → ' + wb.join(',')));
ok(WEB.every(id => /class="sb-item on"/.test(H[id])), 'প্রতিটি ওয়েব স্ক্রিনে নিজের নেভ এন্ট্রি হাইলাইট');
ok(WEB.every(id => H[id].indexOf('scr-goal') >= 0 && H[id].indexOf('MVP 🟢') >= 0), 'প্রতিটি ওয়েব স্ক্রিনে লক্ষ্য ও MVP ট্যাগ');

console.log('\n' + (fail === 0 ? `✅ ALL GREEN — ${n}টি পরীক্ষা পাস` : `❌ ${fail} FAILED / ${n} পরীক্ষা`));
if (warns.length) console.log('console.warn (' + warns.length + '): ' + warns.slice(0, 6).join(' | '));
process.exit(fail ? 1 : 0);
