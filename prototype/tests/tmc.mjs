/* tmc.mjs — ধাপ E: প্রতি-পর্দা মোবাইল চুক্তি (per-screen Mobile Contract)
   নিরীক্ষা specs/04 §৪ ধাপ E (১৯–২০) বাস্তবায়ন: ৭৫টি Admin App পর্দার প্রতিটির জন্য
   MC-01…MC-18 চুক্তি মাপে, লঙ্ঘন চিহ্নিত করে, এবং mobile-contract.md ম্যাট্রিক্স তৈরি করে
   (রিঅ্যাক্ট প্রোটোটাইপে প্রতি পর্দা শুরুর আগে এই ছক মিলিয়ে দেখা হবে)।

   MC-01 শেল-গঠন (একমাত্র .amhead/.appbody, ডেস্কটপ ক্রোম নেই)
   MC-02 ব্যাক-মডেল (D-76)        MC-03 নেভ-মডেল (D-75)      MC-04 ড্রয়ার পৌঁছ (D-35)
   MC-05 শেল-চিপ স্ট্রিপ নেই (D-79) MC-06 টেবিল ≤৪ কলাম (D-78)   MC-07 এক প্রাইমারি
   MC-08 সিদ্ধান্ত-বার            MC-09 কেবাব + শিট বন্ধ      MC-10 মৃত নিয়ন্ত্রণ ০
   MC-11 ট্যাপ টার্গেট ≥৪০px ঘোষিত (D-77)  MC-12 রেন্ডার-স্বচ্ছতা
   MC-13 দীর্ঘ পর্দায় ভাঁজ (N11)   MC-14 ৭টি বাধ্যতামূলক স্টেট-কভারেজ
   MC-15 মোবাইল-নেটিভ (D-80/D-18)  MC-16 ভাষা ও সুদমুক্ততা (BR-13)
   MC-17 ওয়েব↔মোবাইল প্যারিটি (D-35)  MC-18 সুগম্যতা (aria/label)

   চালান: node --max-old-space-size=3072 tmc.mjs                              */
import fs from 'fs';
import { loadPage } from './load.mjs';

const { w, d } = await loadPage('/home/user/prototype/screens.html', { runBoot: false });
let pass = 0, fail = 0; const fails = [];
const ok = (c, m) => { if (c) { pass++; console.log('  ✓ ' + m); } else { fail++; fails.push(m); console.log('  ✗ ' + m); } };

const META = w.__X.META;
const BYID = {}; META.forEach(m => { BYID[m.id] = m; });
const AM = META.filter(m => m.pres === 'app' || m.id === 'a02');

/* ধাপ A-তে নির্ধারিত চুক্তি */
const FLOW = ['am03', 'am06', 'am07', 'am08', 'am09', 'am11', 'am14', 'am16', 'am18', 'am19', 'am20', 'am22', 'am23', 'am28', 'am29', 'am38', 'am41', 'am43', 'am50', 'am52', 'am55', 'am66', 'am67', 'am70', 'am73'];
const LANDING = ['am01', 'am04', 'am24'];          /* শেল-রুট: এখানে ব্যাক বাটন থাকবে না */
const GENERIC = 'এই বোতামের কাজ';                   /* amActAuto-এর ফলব্যাক শিট */

/* MC-14 স্টেট-কভারেজ স্ন্যাপশট (ধাপ E বেসলাইন — পরিবর্তন হলে ইচ্ছাকৃতভাবে হালনাগাদ করতে হবে;
   ফাইল না থাকলে প্রথম রানে তৈরি হয়) */
const STATE_URL = new URL('./mobile-contract-states.json', import.meta.url);
let STATE_BASE = null;
if (fs.existsSync(STATE_URL)) STATE_BASE = JSON.parse(fs.readFileSync(STATE_URL, 'utf8'));

/* MC-11: ui.css থেকে ক্লাস-ভিত্তিক ঘোষিত উচ্চতা (jsdom লেআউট চালায় না, তাই ডিক্লেয়ার্ড মান) */
const css = fs.readFileSync(new URL('../assets/ui.css', import.meta.url), 'utf8');
/* শুধু সেই নিয়ম যার সিলেক্টরের শেষ যৌগিক অংশ নিজেই ওই ক্লাস (যেমন `.bnv`) —
   `.bnv svg` বা `.badge`-এর মতো ভেতরের/সাজানো অংশ বাদ, নইলে ভুল উচ্চতা ধরা পড়ে */
const HEIGHT_COMPOUNDS = [];      /* [যৌগিক-সিলেক্টর, px] */
css.replace(/([^{}]+)\{([^{}]*)\}/g, (all, sel, body) => {
  const m = body.match(/(?:min-height|height)\s*:\s*(\d+(?:\.\d+)?)px/);
  if (!m) return all;
  sel.split(',').forEach(part => {
    const c = part.trim().split(/[\s>+~]+/).pop();
    if (!c || !/^\.[\w-]+(\.[\w-]+)*(:[\w-]+(\([^)]*\))?)*$/.test(c)) return;
    if (/::?(before|after|first-line|first-letter)/.test(c)) return;
    HEIGHT_COMPOUNDS.push([c.replace(/::?[\w-]+(\([^)]*\))?$/g, ''), parseFloat(m[1])]);
  });
  return all;
});
const tapHeight = el => {
  let h = 0;
  HEIGHT_COMPOUNDS.forEach(([c, px]) => { try { if (c && el.matches(c)) h = Math.max(h, px); } catch (e) {} });
  return h;
};

/* বাধ্যতামূলক ৭টি স্টেট শনাক্তকরণ (হিউরিস্টিক — মার্কআপ ক্লাস + বাংলা পাঠ্য) */
const STATES = {
  'স্বাভাবিক': (t, b) => true,
  'খালি': (t, b) => b.querySelectorAll('.empty,.live-empty').length > 0 || /কোনো[^।<>]{0,26}(নেই|পাওয়া যায়নি)|তালিকা খালি|খালি আছে/.test(t),
  'লোডিং': (t, b) => b.querySelectorAll('.sk,.sk-line,.sk-card,.skeleton').length > 0 || /লোড হচ্ছে/.test(t),
  'ত্রুটি': (t, b) => b.querySelectorAll('.amalert.danger').length > 0 || /ব্যর্থ|ত্রুটি|সফল হয়নি/.test(t),
  'অনুমতি': (t, b) => /অনুমতি নেই|সীমা অতিক্রম|অনুমোদন সীমা|এই ভূমিকা|ভূমিকার জন্য/.test(t),
  'অফলাইন': (t, b) => b.querySelectorAll('.offq').length > 0 || /অফলাইন|সিঙ্ক|কিউতে/.test(t),
  'আটকে': (t, b) => /লকড|আটকে|বন্ধ আছে|পিরিয়ড লক/.test(t),
};
/* BR-13: সুদ/ইন্টারেস্ট/মুনাফা "নেওয়া বা হিসাব করা" নিষিদ্ধ; অস্বীকারমূলক প্রকাশ
   ("সুদমুক্ত", "সুদবিহীন", "সুদ ৳০", "সুদ নেই") অনুমোদিত */
const BANNED = /সুদ(?!মুক্ত|বিহীন|হীন|মুক্ত)|ইন্টারেস্ট(?!মুক্ত|বিহীন)|মুনাফা(?!বিহীন|মুক্ত)|ঋণের দাম/;

const clickables = box => [...box.querySelectorAll('button, a, input[type=file], [onclick]')]
  .filter(el => !el.closest('.drawer') && !el.closest('.sheet') && !el.closest('.sheet-scrim'));

const rows = [];           /* রিপোর্টের সারি */
const gaps = {};           /* গ্যাপ-কোড → [{screen, detail}] */
const addGap = (code, screen, detail) => { (gaps[code] = gaps[code] || []).push({ screen, detail }); };
const liveHost = d.createElement('div'); liveHost.className = 'phone'; d.body.appendChild(liveHost);
const stObserved = {};                            /* কোড → {স্টেট: bool} */
const BYID2 = {}; AM.forEach(m => { BYID2[m.code] = m; });

AM.forEach(m => {
  const box = d.createElement('div'); box.innerHTML = w.renderScreen(m.id) || '';
  const V = [];                                  /* এই পর্দার লঙ্ঘন */
  const bad = (code, detail) => { V.push(code); addGap(code, m.code, detail); };
  const txt = (box.textContent || '').replace(/\s+/g, ' ').trim();
  const q = s => box.querySelectorAll(s);
  const qa = s => [...box.querySelectorAll(s)];

  /* MC-01 শেল-গঠন */
  if (q('.amhead').length !== 1 || q('.appbody').length !== 1) bad('MC-01', `amhead=${q('.amhead').length} appbody=${q('.appbody').length}`);
  const desk = q('.admin-top').length + q('.crumb').length + q('.adm-top').length;
  if (desk) bad('MC-01', `ডেস্কটপ ক্রোম ${desk}টি (.admin-top/.crumb)`);

  /* MC-02 ব্যাক (D-76) */
  const back = box.querySelector('.amhead .backbtn');
  const backTgt = back ? ((back.getAttribute('onclick') || '').match(/#([a-z0-9]+)/) || [])[1] : null;
  /* চুক্তি: ফ্লো/উইজার্ড ও অ-ANAV গভীর পর্দায় ব্যাক বাধ্যতামূলক (D-76)।
     যেসব পর্দা ড্রয়ারে সরাসরি এন্ট্রি (শীর্ষ-স্তর গন্তব্য) সেখানে Up বাটন প্রয়োজন নেই —
     ড্রয়ার/ডিভাইস-ব্যাকই যথেষ্ট; তবে শীর্ষ-স্তরত্ব হারালে (ড্রয়ার-এন্ট্রি মুছে গেলে) এই চেক লাল হবে। */
  const isTopLevel = !FLOW.includes(m.id) && box.querySelectorAll('.drawer-i.on').length === 1;
  if (FLOW.includes(m.id) || !isTopLevel) {
    if (!back) bad('MC-02', 'ব্যাক বাটন নেই (ফ্লো/গভীর পর্দা)');
    else if (!backTgt || !BYID[backTgt] || backTgt === m.id) bad('MC-02', `ব্যাক টার্গেট অবৈধ: #${backTgt}`);
  }
  const backModel = backTgt ? '#' + backTgt : (isTopLevel ? 'শীর্ষ-স্তর' : '✗');

  /* MC-03 নেভ-মডেল (D-75) */
  const nav = q('.bottomnav').length, slots = q('.bottomnav .bnv').length, fbar = q('.flowbar').length;
  if (FLOW.includes(m.id)) {
    if (nav) bad('MC-03', 'ফ্লো পর্দায় bottom nav আছে');
    if (!fbar) bad('MC-03', 'ফ্লো পর্দায় .flowbar নেই');
    if (q('.drawer').length) bad('MC-03', 'ফ্লো পর্দায় ড্রয়ার আছে');
  } else {
    if (nav !== 1) bad('MC-03', `bottom nav ${nav}টি (১টি প্রত্যাশিত)`);
    else if (slots !== 5) bad('MC-03', `nav স্লট ${slots}টি (৫টি প্রত্যাশিত)`);
    if (fbar) bad('MC-03', 'নন-ফ্লো পর্দায় .flowbar আছে');
  }

  /* MC-04 ড্রয়ার পৌঁছ (D-35) */
  const dItems = q('.drawer .drawer-i').length, dOn = q('.drawer-i.on').length;
  if (!FLOW.includes(m.id)) {
    if (!dItems) bad('MC-04', 'ড্রয়ারে কোনো ANAV আইটেম নেই');
    else if (dOn !== 1) bad('MC-04', `ড্রয়ার হাইলাইট ${dOn}টি (১টি প্রত্যাশিত)`);
  }

  /* MC-05 শেল-চিপ স্ট্রিপ (D-79) */
  const shellChips = qa('.chip-btn,.chip').filter(c => !c.closest('.drawer') && /Shell-/.test(c.textContent || '')).length;
  if (shellChips) bad('MC-05', `${shellChips}টি Shell-চিপ হেডারে`);

  /* MC-06 টেবিল ≤৪ কলাম (D-78) */
  qa('table').forEach(tb => {
    const heads = tb.querySelectorAll('thead th').length ||
      Math.max(0, ...[...tb.querySelectorAll('tr')].map(tr => tr.querySelectorAll('th,td').length));
    if (heads > 4) bad('MC-06', `${heads}-কলাম টেবিল (সীমা ৪)`);
    if (!tb.closest('.xtbl-wrap')) bad('MC-06', 'টেবিল .xtbl-wrap-এ নেই');
  });

  /* MC-07 এক প্রাইমারি */
  const prim = qa('.btn-primary').filter(b => !b.closest('.sheet')).length;
  if (prim > 1) bad('MC-07', `${prim}টি প্রাইমারি বোতাম`);
  const primInBar = qa('.decbar .btn-primary').length;
  if (prim === 1 && q('.decbar').length && !primInBar) bad('MC-07', 'একমাত্র প্রাইমারি সিদ্ধান্ত-বারের বাইরে');

  /* MC-08 সিদ্ধান্ত-বার */
  if (q('.decbar').length !== 1) bad('MC-08', `.decbar ${q('.decbar').length}টি`);

  /* MC-09 কেবাব + শিট বন্ধ */
  const kebab = qa('.amhead .iconbtn').filter(b => /amMore\(this\)/.test(b.getAttribute('onclick') || '')).length;
  if (kebab !== 1) bad('MC-09', `কেবাব ট্রিগার ${kebab}টি`);
  if (qa('.sheet').some(s => s.classList.contains('open'))) bad('MC-09', 'কোনো শিট ডিফল্টে খোলা');
  if (q('.sheet.more').length && !q('.sheet.more .amact').length) bad('MC-09', 'অ্যাকশন শিটে আইটেম নেই');

  /* MC-10 মৃত নিয়ন্ত্রণ — ডেলিগেটেড হ্যান্ডলারওয়ালা কম্পোনেন্ট বাদ
     (এগুলো document-স্তরের লিসেনারে চলে: অ্যাকর্ডিয়ন, ভাঁজ, রেডিও-কার্ড, চিপ/সেগমেন্ট, ফাইল-লেবেল, অফলাইন ব্যাজ, সারি) */
  const DELEGATED = '.acc2-h, .acc-h, .foldgrp-t, .radio-card, .chip-btn, .chipset, .seg, .seg-i, .seg button, .tabs button, .tab, .tabstrip button, ' +
    'label.filebtn, .offq, .row, .mrows .row, .bnv, .kpi, .amkpi, .cardlink, .amburger, .drawer-i';
  /* নিষ্ক্রিয়/আটকে-থাকা নিয়ন্ত্রণ মৃত নয় — এগুলো "আটকে" স্টেটের নমুনা (৭টি বাধ্যতামূলক স্টেটের একটি) */
  const isDisabled = el => el.classList.contains('dis') || el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true';
  const blocked = clickables(box).filter(isDisabled).length;
  const dead = clickables(box).filter(el => !el.getAttribute('onclick') && !el.getAttribute('href') && !isDisabled(el) && !el.closest(DELEGATED));
  let genericHits = 0; const genericLabels = [];
  dead.forEach(el => {
    liveHost.innerHTML = '';
    const live = d.createElement('div'); live.innerHTML = el.outerHTML;
    const node = live.firstElementChild; liveHost.appendChild(node);
    const before = liveHost.querySelectorAll('.sheet.act').length;
    try { w.amActAuto(node); } catch (e) { /* ignore */ }
    const sheet = liveHost.querySelector('.sheet.act .sheet-h b');
    const title = sheet ? sheet.textContent.trim() : '';
    if (before === liveHost.querySelectorAll('.sheet.act').length && !title)
      bad('MC-10', `মৃত নিয়ন্ত্রণ: "${(el.textContent || '').trim().slice(0, 24) || el.className}"`);
    else if (title === GENERIC) { genericHits++; genericLabels.push((el.textContent || '').trim().slice(0, 22) || el.className); }
  });
  if (genericHits) bad('MC-10', `${genericHits}টি বোতামে সুনির্দিষ্ট অ্যাকশন নেই: ${genericLabels.join(' · ')}`);

  /* MC-11 ট্যাপ টার্গেট (ঘোষিত উচ্চতা) */
  let minTap = 999; const small = [];
  clickables(box).forEach(el => {
    const h = tapHeight(el);
    if (h) { minTap = Math.min(minTap, h); if (h < 40) small.push(`${(el.className || el.tagName).toString().slice(0, 26)}:${h}px`); }
  });
  if (small.length) bad('MC-11', `${small.length}টি নিয়ন্ত্রণে ঘোষিত উচ্চতা <৪০px — ${small.slice(0, 3).join(' · ')}`);

  /* MC-12 রেন্ডার-স্বচ্ছতা */
  const leaks = [['${', /\$\{/], ['undefined', /undefined/], ['NaN', /NaN/], ['[object', /\[object /]]
    .filter(([, r]) => r.test(txt)).map(([n]) => n);
  if (leaks.length) bad('MC-12', leaks.join(' · '));

  /* MC-13 দীর্ঘ পর্দায় ভাঁজ */
  const folds = q('.foldgrp').length, accs = q('.acc2').length, tabs = q('.tabs,.tabstrip,.seg').length;
  if (txt.length > 3200 && !folds && !accs && !tabs) bad('MC-13', `${txt.length} অক্ষর, কোনো ভাঁজ/ট্যাব নেই`);

  /* MC-14 স্টেট-কভারেজ */
  const st = {}; Object.keys(STATES).forEach(k => { st[k] = STATES[k](txt, box); });
  stObserved[m.code] = st;
  if (STATE_BASE) {
    const base = STATE_BASE[m.code] || {};
    Object.keys(st).forEach(k => { if (!!base[k] !== st[k]) bad('MC-14', `স্টেট "${k}" বেসলাইনে ${base[k] ? 'ছিল' : 'ছিল না'}, এখন ${st[k] ? 'আছে' : 'নেই'}`); });
    Object.keys(STATE_BASE).forEach(c => { if (!BYID2[c]) bad('MC-14', `বেসলাইনে অজানা পর্দা ${c}`); });
  }

  /* MC-15 মোবাইল-নেটিভ */
  const files = qa('input[type=file]'), fileBtns = q('label.filebtn').length;
  if (files.length !== fileBtns) bad('MC-15', `${files.length}টি ফাইল ইনপুট, ${fileBtns}টি .filebtn`);
  files.forEach(f => { if (!f.getAttribute('accept')) bad('MC-15', 'ফাইল ইনপুটে accept নেই'); });
  qa('a[href^="tel:"],a[href^="sms:"],button[onclick*="tel:"],button[onclick*="sms:"]').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (href && !/^(tel|sms):\+8801[0-9]{9}(\?body=[^\s"]*)?$/.test(href)) bad('MC-15', `অবৈধ লিঙ্ক ${href.slice(0, 40)}`);
  });
  qa('.offq').forEach(o => { if (!o.querySelector('[onclick*="#s08"]')) bad('MC-15', 'অফলাইন ব্যাজে S-08 লিংক নেই'); });

  /* MC-16 ভাষা ও সুদমুক্ততা */
  const latinMoney = txt.match(/৳\s*[0-9][0-9,\.]*/g) || [];
  if (latinMoney.length) bad('MC-16', `ল্যাটিন অঙ্কে টাকা: ${latinMoney.slice(0, 2).join(' · ')}`);
  /* negation-aware: সুদ/মুনাফা শব্দটি শুধু তখনই লঙ্ঘন যখন তার আশপাশে
     অস্বীকার/শূন্য/নিষ্ক্রিয়তার প্রসঙ্গ নেই (BR-13-এর অনুমোদিত প্রকাশ "সুদ ৳০", "সুদ নেই") */
  const ALLOW = /নয়|নেই|হয় না|হবে না|হবেনা|যোগ করা হয়নি|যোগ হয়নি|নিষ্ক্রিয়|মুক্ত|বিহীন|হীন|৳০|শূন্য|BR-13|নিষিদ্ধ|সদৃশ|বাধা|প্রযোজ্য নয়/;
  let banned = null;
  const re = new RegExp(BANNED.source, 'g'); let mm;
  while ((mm = re.exec(txt)) !== null) {
    const win = txt.slice(Math.max(0, mm.index - 46), mm.index + 60);
    if (!ALLOW.test(win)) { banned = win.trim(); break; }
  }
  if (banned) bad('MC-16', `নিষিদ্ধ শব্দ অস্বীকার-প্রসঙ্গ ছাড়া: "${banned}"`);

  /* MC-17 প্যারিটি (D-35) */
  const logical = m.logical || null;
  const logicals = logical ? logical.split(/[+·,]/).map(x => x.trim()).filter(Boolean) : [];
  if (!logical) bad('MC-17', 'META.logical নেই (কোন ওয়েব পর্দার মোবাইল রূপ তা অজানা)');
  else logicals.forEach(L => { if (!META.some(x => x.code === L)) bad('MC-17', `logical-এ ${L} আছে কিন্তু সেই ওয়েব পর্দা নেই`); });

  /* MC-18 সুগম্যতা */
  let unassoc = 0;
  qa('.iconbtn,.backbtn,.burger').forEach(el => {
    const label = (el.textContent || '').trim();
    if (!label && !el.getAttribute('aria-label') && !el.getAttribute('title'))
      bad('MC-18', `আইকন-বোতামে aria-label নেই (${el.className})`);
  });
  qa('input:not([type=file]),select,textarea').forEach(el => {
    const labeled = el.getAttribute('aria-label') || el.getAttribute('placeholder') || el.getAttribute('title') ||
      el.closest('label') || el.parentElement && el.parentElement.querySelector('label') ||
      (el.closest('.field,.inp-wrap,.filepick') || {}).querySelector && el.closest('.field,.inp-wrap,.filepick').querySelector('label');
    if (!labeled) bad('MC-18', `ইনপুটে কোনো লেবেল নেই (${el.className || el.type})`);
    else if (!el.getAttribute('aria-label') && !el.getAttribute('id') && !el.closest('label')) unassoc++;
  });

  /* উপস্থাপন প্যাটার্ন শনাক্তকরণ (রিপোর্টের জন্য) */
  const pat = [];
  if (q('.mrows').length) pat.push('তালিকা');
  if (q('.xtbl-wrap').length) pat.push('টেবিল');
  if (q('.amgrid').length) pat.push('গ্রিড');
  if (q('.acc2').length) pat.push('অ্যাকর্ডিয়ন');
  if (folds) pat.push('ভাঁজ');
  if (q('.tabs,.tabstrip,.seg').length) pat.push('ট্যাব');
  if (q('.kv').length) pat.push('তথ্য-জোড়া');
  if (q('form,.field,.inp').length) pat.push('ফর্ম');
  const nat = [];
  if (files.length) nat.push(`ক্যামেরা/ফাইল ${files.length}`);
  const tels = qa('a[href^="tel:"],a[href^="sms:"]').length; if (tels) nat.push(`কল/SMS ${tels}`);
  if (q('.offq').length) nat.push('অফলাইন কিউ');
  if (q('.radio-card').length) nat.push('রেডিও-কার্ড');
  if (/QR|স্ক্যান/.test(txt)) nat.push('QR/স্ক্যান');

  rows.push({
    code: m.code, id: m.id, name: m.name,
    nav: FLOW.includes(m.id) ? 'ফ্লো' : (LANDING.includes(m.id) ? 'ল্যান্ডিং' : 'গভীর'),
    back: backModel,
    drawer: FLOW.includes(m.id) ? 'বন্ধ' : `${dItems}·হাইলাইট ${dOn}`,
    pat: pat.join(' · ') || 'কার্ড',
    prim: `${prim}${q('.decbar').length ? ' (বারে)' : ''}`,
    bar: q('.decbar').length ? '✓' : '✗',
    ctl: clickables(box).length, dead: dead.length,
    minTap: minTap === 999 ? '—' : minTap + 'px',
    chars: txt.length, folds: folds + accs + tabs,
    states: Object.keys(st).filter(k => st[k]).length + '/৭',
    blocked,
    nat: nat.join(' · ') || '—',
    logical: logical || '✗',
    unassoc,
    V,
  });
  if (V.length) console.log(`  · ${m.code}: ${V.join(', ')}`);
});

/* ---------------- সমষ্টিগত চুক্তি-যাচাই ---------------- */
const allV = rows.flatMap(r => r.V.map(v => ({ code: v, screen: r.code })));
const byCode = c => allV.filter(x => x.code === c).length;
const badRows = rows.filter(r => r.V.length);

ok(AM.length === 75, `৭৫টি Admin App পর্দা মূল্যায়িত (পাওয়া ${AM.length})`);
ok(byCode('MC-01') === 0, `MC-01 শেল-গঠন ও ডেস্কটপ-ক্রোম মুক্ত (লঙ্ঘন ${byCode('MC-01')})`);
ok(byCode('MC-02') === 0, `MC-02 ব্যাক-মডেল D-76 (লঙ্ঘন ${byCode('MC-02')})`);
ok(byCode('MC-03') === 0, `MC-03 নেভ-মডেল D-75 — ফ্লো ${FLOW.length}·নন-ফ্লো ${AM.length - FLOW.length} (লঙ্ঘন ${byCode('MC-03')})`);
ok(byCode('MC-04') === 0, `MC-04 ড্রয়ার পৌঁছ D-35 (লঙ্ঘন ${byCode('MC-04')})`);
ok(byCode('MC-05') === 0, `MC-05 শেল-চিপ স্ট্রিপ বাদ D-79 (লঙ্ঘন ${byCode('MC-05')})`);
ok(byCode('MC-06') === 0, `MC-06 টেবিল ≤৪ কলাম D-78 (লঙ্ঘন ${byCode('MC-06')})`);
ok(byCode('MC-07') === 0, `MC-07 প্রতি পর্দায় ≤১ প্রাইমারি, বারে (লঙ্ঘন ${byCode('MC-07')})`);
ok(byCode('MC-08') === 0, `MC-08 সিদ্ধান্ত-বার ${rows.filter(r => r.bar === '✓').length}/৭৫ (লঙ্ঘন ${byCode('MC-08')})`);
ok(byCode('MC-09') === 0, `MC-09 কেবাব + শিট বন্ধ ডিফল্টে (লঙ্ঘন ${byCode('MC-09')})`);
ok(byCode('MC-10') === 0, `MC-10 মৃত/অনির্দিষ্ট নিয়ন্ত্রণ (লঙ্ঘন ${byCode('MC-10')})`);
ok(byCode('MC-11') === 0, `MC-11 ঘোষিত ট্যাপ উচ্চতা ≥৪০px (লঙ্ঘন ${byCode('MC-11')})`);
ok(byCode('MC-12') === 0, `MC-12 রেন্ডার-স্বচ্ছতা (লঙ্ঘন ${byCode('MC-12')})`);
ok(byCode('MC-13') === 0, `MC-13 দীর্ঘ পর্দায় ভাঁজ/ট্যাব (লঙ্ঘন ${byCode('MC-13')})`);
ok(byCode('MC-14') === 0, `MC-14 স্টেট-কভারেজ স্ন্যাপশট অপরিবর্তিত (লঙ্ঘন ${byCode('MC-14')})`);
ok(byCode('MC-15') === 0, `MC-15 মোবাইল-নেটিভ চুক্তি D-80/D-18 (লঙ্ঘন ${byCode('MC-15')})`);
ok(byCode('MC-16') === 0, `MC-16 বাংলা অঙ্ক ও সুদমুক্ত পাঠ্য BR-13 (লঙ্ঘন ${byCode('MC-16')})`);
ok(byCode('MC-17') === 0, `MC-17 ওয়েব↔মোবাইল প্যারিটি D-35 (লঙ্ঘন ${byCode('MC-17')})`);
ok(byCode('MC-18') === 0, `MC-18 সুগম্যতা aria/label (লঙ্ঘন ${byCode('MC-18')})`);
ok(badRows.length === 0, `প্রতি-পর্দা চুক্তি সম্পূর্ণ — লঙ্ঘনযুক্ত পর্দা ${badRows.length}${badRows.length ? ': ' + badRows.slice(0, 5).map(r => r.code).join(', ') : ''}`);

/* ---------------- রিপোর্ট তৈরি ---------------- */
const stateKeys = Object.keys(STATES);
const stRows = rows.map(r => ({ code: r.code, st: stateKeys.map(k => stObserved[r.code][k] ? '✓' : '–') }));
const cell = s => String(s).replace(/\|/g, ' · ').replace(/\n+/g, ' ');
const out = [];
out.push('# Admin App — প্রতি-পর্দা মোবাইল চুক্তি (ধাপ E)');
out.push('');
out.push(`**তৈরি:** \`prototype/tests/tmc.mjs\` দ্বারা স্বয়ংক্রিয়ভাবে · **তারিখ:** ${new Date().toISOString().slice(0, 10)} · **পর্দা:** ${AM.length}`);
out.push('');
out.push('> এই ছক রিঅ্যাক্ট প্রোটোটাইপে প্রতিটি পর্দা বাস্তবায়নের আগে মিলিয়ে দেখা হবে (নিরীক্ষা `specs/04` §৪ ধাপ E, আইটেম ২০)।');
out.push('> প্রতিটি ঘর মাপা মান — অনুমান নয়। লঙ্ঘন থাকলে \`tmc.mjs\` লাল হয়।');
out.push('');
out.push('## ছক ১ · চুক্তি ম্যাট্রিক্স');
out.push('');
out.push('| কোড | পর্দা | নেভ-মডেল | ব্যাক | ড্রয়ার | উপস্থাপন | প্রাইমারি | বার | নিয়ন্ত্রণ | অটো | আটকে | ট্যাপ-মিন | অক্ষর | ভাঁজ | স্টেট | নেটিভ | ওয়েব-জোড়া | রায় |');
out.push('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
rows.forEach(r => out.push(`| ${r.code} | ${cell(r.name)} | ${r.nav} | ${r.back} | ${cell(r.drawer)} | ${cell(r.pat)} | ${r.prim} | ${r.bar} | ${r.ctl} | ${r.dead} | ${r.blocked} | ${r.minTap} | ${r.chars} | ${r.folds} | ${r.states} | ${cell(r.nat)} | ${cell(r.logical)} | ${r.V.length ? '⚠️ ' + r.V.join(' ') : '✅'} |`));
out.push('');
out.push('ঘরের অর্থ: **অটো** = ইনলাইন হ্যান্ডলার নেই কিন্তু ডেলিগেটেড শিট-হ্যান্ডলারে সুনির্দিষ্ট অ্যাকশন পায় · **আটকে** = ইচ্ছাকৃতভাবে নিষ্ক্রিয় নিয়ন্ত্রণ (Blocked স্টেট) · **ট্যাপ-মিন** = `ui.css`-এর ঘোষিত সর্বনিম্ন উচ্চতা · **ভাঁজ** = অ্যাকর্ডিয়ন+ভাঁজ+ট্যাব · **স্টেট** = ৭টি বাধ্যতামূলক স্টেটের মধ্যে কতগুলোর নমুনা এই পর্দায় আছে।');
out.push('');
out.push('## ছক ২ · ৭টি বাধ্যতামূলক স্টেটের কভারেজ');
out.push('');
out.push('শনাক্তকরণ হিউরিস্টিক (মার্কআপ ক্লাস + বাংলা পাঠ্য)। "–" মানে প্রোটোটাইপে সেই স্টেটের নমুনা নেই — রিঅ্যাক্টে বাস্তবায়ন বাধ্যতামূলক।');
out.push('');
out.push('| কোড | ' + stateKeys.join(' | ') + ' | মোট |');
out.push('|---|' + stateKeys.map(() => '---|').join('') + '---|');
stRows.forEach(r => out.push(`| ${r.code} | ${r.st.join(' | ')} | ${r.st.filter(x => x === '✓').length}/৭ |`));
out.push('');
const gapKeys = Object.keys(gaps).sort();
out.push('## ছক ৩ · গ্যাপ তালিকা');
out.push('');
if (!gapKeys.length) out.push('কোনো গ্যাপ নেই — ৭৫টি পর্দাই চুক্তি পূরণ করেছে।');
else {
  out.push('| গ্যাপ-কোড | পর্দা | বিবরণ |');
  out.push('|---|---|---|');
  gapKeys.forEach(k => gaps[k].forEach(g => out.push(`| ${k} | ${g.screen} | ${cell(g.detail)} |`)));
}
out.push('');
out.push('## ছক ৪ · রিঅ্যাক্ট-পর্বে প্রতি পর্দায় বসানোর কাজ');
out.push('');
out.push('প্রোটোটাইপে স্টেট-নমুনা কেন্দ্রীয়ভাবে আছে (`screens.html#states` গ্যালারি ও S-05/S-06/S-08 পর্দা) — প্রতিটি পর্দায় আলাদাভাবে বসানো নেই।');
out.push('রিঅ্যাক্টে প্রতিটি পর্দায় ৭টি স্টেট বাধ্যতামূলক; নিচের ঘরগুলো সেই কাজের তালিকা। **লেবেল-সংযোগ** = দৃশ্যমান `<label>` আছে কিন্তু `for/id` বা `aria-label` দিয়ে প্রোগ্রাম্যাটিক সংযোগ নেই (`<Field label>` কম্পোনেন্টে স্বয়ংক্রিয়ভাবে সমাধান হবে)।');
out.push('');
out.push('| কোড | যেসব স্টেট বাকি | লেবেল-সংযোগ গ্যাপ | মোট |');
out.push('|---|---|---|---|');
rows.forEach(r => {
  const missing = stateKeys.filter(k => !stObserved[r.code][k]);
  out.push(`| ${r.code} | ${missing.length ? cell(missing.join(' · ')) : '—'} | ${r.unassoc} | ${missing.length + (r.unassoc ? 1 : 0)} |`);
});
out.push('');
out.push('## ছক ৫ · রিঅ্যাক্ট কম্পোনেন্ট ম্যাপিং (প্রোটোটাইপ → কোড)');
out.push('');
out.push('| প্রোটোটাইপ প্যাটার্ন | রিঅ্যাক্ট কম্পোনেন্ট | দায়িত্ব |');
out.push('|---|---|---|');
out.push('| `.amhead` + `.backbtn` + `.iconbtn` (কেবাব) | `<AppHeader title sub back onMore>` | শিরোনাম, ব্যাক-স্ট্যাক (D-76), কেবাব ট্রিগার |');
out.push('| `.drawer` + `.drawer-i` | `<NavDrawer items active onClose>` | সম্পূর্ণ ANAV পৌঁছ (D-35), ভূমিকা-ফিল্টার |');
out.push('| `.bottomnav` (৫ স্লট) | `<TabBar items active>` | শুধু ল্যান্ডিং/গভীর পর্দায়; ফ্লোতে বন্ধ (D-75) |');
out.push('| `.flowbar` | `<WizardBar step total rule>` | ধাপ সংখ্যা, চালানো নিয়ম, স্বয়ংক্রিয় সংরক্ষণ দাবি করবে না (D-80) |');
out.push('| `.decbar` | `<StickyActionBar primary secondary note>` | একমাত্র প্রাইমারি, ৪৮px, নিয়ম-নোট (BR-04/BR-12) |');
out.push('| `.mrows` + `.row` | `<TxnList rows onRowPress>` | ≥৫ কলামের বিকল্প (D-78), আইকন+শিরোনাম+মেটা+অঙ্ক+chevron |');
out.push('| `.xtbl-wrap` + table | `<DataTable maxCols={4}>` | ≤৪ কলাম অনুমোদিত (D-78) |');
out.push('| `.acc2` / `.foldgrp` | `<Collapse>` / `<Accordion>` | বডি সবসময় DOM-এ, টগল কর্তৃক দৃশ্যমানতা |');
out.push('| `.sheet.more` / `.sheet.act` / `.sheet.flt` | `<BottomSheet variant>` | ডিফল্টে বন্ধ, পারস্পরিক বর্জন, Escape/scrim বন্ধ |');
out.push('| `.chip-btn` / `.seg` | `<FilterChips>` / `<Segmented>` | ট্যাপে নির্বাচন বদলায়, ৪০px উচ্চতা |');
out.push('| `label.filebtn` + `input[type=file]` | `<FileField capture accept>` | ক্যামেরা/ফাইল, "স্বয়ংক্রিয় এন্ট্রি নয়" সতর্কতা (D-80) |');
out.push('| `.radio-card` | `<RadioCards options value onChange>` | বড় ট্যাপ-টার্গেট, ব্যাখ্যা সহ |');
out.push('| `.offq` | `<OfflineQueueBadge count onOpen>` | SYNC কিউ সংখ্যা, S-08-এ যায় |');
out.push('| `.amalert` (info/warn/danger) | `<Alert tone>` | ত্রুটি/সতর্কতা/নিয়ম-ব্যাখ্যা |');
out.push('| `.sk*` | `<Skeleton>` | লোডিং স্টেট |');
out.push('');
out.push('## ছক ৬ · পরিমাপের সীমা');
out.push('');
out.push('- jsdom লেআউট ইঞ্জিন চালায় না: **ট্যাপ-মিন** ঘরটি `ui.css`-এর ঘোষিত উচ্চতা (px), ব্রাউজারে মাপা প্রকৃত বাক্স নয়।');
out.push('- প্রকৃত পিক্সেল যাচাই (৩৬০×৮০০ ও ৩৯০×৮৪৪, আড়াআড়ি স্ক্রল, স্থির ক্রোমের উচ্চতা) `prototype/mobile-check.html` দিয়ে আসল ব্রাউজারে/ফোনে চালাতে হয়।');
out.push('- স্টেট-কভারেজ হিউরিস্টিক; "–" চিহ্নিত স্টেট রিঅ্যাক্টে বাস্তবায়নযোগ্য কাজ হিসেবে গণ্য।');
out.push('');
fs.writeFileSync(new URL('./mobile-contract.md', import.meta.url), out.join('\n'), 'utf8');
console.log(`\n  রিপোর্ট লেখা হলো: prototype/tests/mobile-contract.md (${rows.length} সারি, ${out.length} লাইন)`);

if (!STATE_BASE) {
  fs.writeFileSync(STATE_URL, JSON.stringify(stObserved, null, 1), 'utf8');
  console.log('  বেসলাইন তৈরি হলো: prototype/tests/mobile-contract-states.json (এরপর স্টেট-কভারেজ বদলালে MC-14 লাল হবে)');
}
console.log(`\n${fail ? '❌ ' + fail + ' CHECK(S) FAILED' : '✅ tmc: ' + pass + ' passed, 0 failed'}`);
if (fail) { fails.forEach(f => console.log('   → ' + f)); process.exit(1); }
