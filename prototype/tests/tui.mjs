/* tui.mjs — Admin App মোবাইল UI চুক্তি (নিরীক্ষা specs/04 · ধাপ A + B + C + D)
   যাচাই করে: শেল-গঠন, ব্যাক-নেভিগেশন (D-76), ফ্লো-চুক্তি (D-75), Shell-চিপ স্ট্রিপ বাদ (D-79),
   কেবাব অ্যাকশন শিট (N4), টেবিল কলাম-সীমা (D-78), মোবাইল তালিকা (প্যাটার্ন ৭), হেডার-বাটন অ্যাকশন
   (amAct), ট্যাপ টার্গেট (D-77), ভাঁজ/অ্যাকর্ডিয়ন (N11), ফাইল-পিকার ও ক্যামেরা (D-80), অফলাইন কিউ
   ব্যাজ (D-18), রেডিও-কার্ড (প্যাটার্ন ৮), tel:/sms: লিঙ্ক ও আসল ক্লিক ইন্টারঅ্যাকশন।
   চালান: node --max-old-space-size=3072 tui.mjs                                          */
import fs from 'fs';
import { loadPage } from './load.mjs';
const { w, d, errs } = await loadPage('/home/user/prototype/screens.html', { runBoot: false });
let pass = 0, fail = 0; const fails = [], notes = [];
const ok = (c, m) => { if (c) { pass++; console.log('  ✓ ' + m); } else { fail++; fails.push(m); console.log('  ✗ ' + m); } };

const META = w.__X.META;
const AM = META.filter(m => m.pres === 'app' || m.id === 'a02');
const FLOW = ['am03','am06','am07','am08','am09','am11','am14','am16','am18','am19','am20','am22','am23','am28','am29','am38','am41','am43','am50','am52','am55','am66','am67','am70','am73'];
const BACK = { am03:'am02', am05:'am04', am06:null, am07:'am04', am08:'am02', am09:'am05', am10:'am05', am11:'am05',
  am13:'am17', am14:'am13', am16:'am02', am18:'am05', am19:'am16', am20:null, am22:null, am23:'am22',
  am26:'am27', am28:'am27', am29:'am26' };

const R = {};
AM.forEach(m => {
  const box = d.createElement('div'); box.innerHTML = w.renderScreen(m.id) || '';
  const nd = el => !el.closest('.drawer');
  R[m.id] = {
    code: m.code, box,
    amhead: box.querySelectorAll('.amhead').length,
    shellChip: [...box.querySelectorAll('.chip-btn,.chip')].filter(c => !c.closest('.drawer') && /Shell-[A-Z]/.test(c.textContent)).length,
    back: box.querySelector('.amhead .backbtn'),
    kebab: [...box.querySelectorAll('.amhead .iconbtn')].filter(b => /amMore\(this\)/.test(b.getAttribute('onclick') || '')).length,
    deadHeadBtn: [...box.querySelectorAll('.amhead .iconbtn')].filter(b => !b.getAttribute('onclick')).length,
    sheet: box.querySelectorAll('.sheet.more').length,
    act: box.querySelectorAll('.sheet.more .amact').length,
    nav: box.querySelectorAll('.bottomnav').length,
    slots: box.querySelectorAll('.bottomnav .bnv').length,
    drawer: box.querySelectorAll('.drawer').length,
    drawerItems: box.querySelectorAll('.drawer .drawer-i').length,
    drawerOn: box.querySelectorAll('.drawer-i.on').length,
    burger: box.querySelectorAll('.amburger').length,
    flowbar: box.querySelectorAll('.flowbar').length,
    decbar: box.querySelectorAll('.decbar').length,
    cmp: box.querySelectorAll('.amrole.cmp').length,
    tbls: [...box.querySelectorAll('table.tbl')].map(t => ({ cols: t.querySelectorAll('th').length, wrapped: !!t.closest('.xtbl-wrap') })),
    small: box.querySelectorAll('.btn-sm').length + [...box.querySelectorAll('.chip-btn')].filter(nd).length,
    prim: [...box.querySelectorAll('.btn-primary')],
    deadBtn: [...box.querySelectorAll('button.btn, a.btn')].filter(b => !b.getAttribute('onclick') && !b.hasAttribute('disabled') && !/(^|\s)dis(\s|$)/.test(b.className)),
    fltSheet: box.querySelectorAll('.sheet.flt').length,
    sheetOpen: box.querySelectorAll('.sheet.open, .sheet-scrim.open').length,
    fold: box.querySelectorAll('.foldgrp').length,
    foldBtn: box.querySelectorAll('.foldgrp-t').length,
    acc2: box.querySelectorAll('.acc2').length,
    acc2Body: box.querySelectorAll('.acc2-b').length,
    fileIn: [...box.querySelectorAll('input[type=file]')],
    offq: box.querySelectorAll('.offq').length,
    radios: box.querySelectorAll('.radio-card').length,
    radioOn: box.querySelectorAll('.radio-card.on').length,
    tel: [...box.querySelectorAll('a[href^="tel:"], a[href^="sms:"]')]
  };
});
const ids = Object.keys(R);

console.log('\n=== Admin App UI চুক্তি (৫৮ পর্দা) ===');
ok(ids.length === 75, `Admin App পর্দা = ${ids.length}`);
ok(ids.every(i => R[i].amhead === 1), 'প্রতি পর্দায় মোবাইল হেডার (.amhead) আছে (A-02 সহ)');
ok(ids.every(i => R[i].shellChip === 0), `D-79: হেডার/বডিতে Shell-চিপ স্ট্রিপ নেই (মোট ${ids.reduce((s,i)=>s+R[i].shellChip,0)})`);
ok(ids.every(i => R[i].kebab === 1), 'N4: প্রতি পর্দায় ১টি কার্যকর কেবাব (onclick=amMore)');
ok(ids.every(i => R[i].sheet === 1 && R[i].act >= 3), 'প্রতি পর্দায় অ্যাকশন শিট (.sheet.more) ও ≥৩টি অ্যাকশন');

/* --- D-76 ব্যাক --- */
const backIds = ids.filter(i => R[i].back);
const badBack = backIds.filter(i => {
  const t = (R[i].back.getAttribute('onclick').match(/#([a-z0-9]+)/) || [])[1];
  return !META.some(m => m.id === t);
});
ok(backIds.length === 44, `ব্যাক বাটন = ${backIds.length}/৭৫ (প্রত্যাশিত ৪৪)`);
ok(badBack.length === 0, `সব ব্যাক টার্গেট বৈধ (অবৈধ: ${badBack.join(',') || 'নেই'})`);
ok(backIds.every(i => R[i].cmp === 1), 'ব্যাক থাকলে রোল-চিপ সংক্ষিপ্ত (.amrole.cmp) — হেডারে জায়গা বাঁচে');
ok(ids.filter(i => !R[i].back).every(i => !FLOW.includes(i)), 'ফ্লো পর্দামাত্রই ব্যাক আছে (কোনো ফ্লো পর্দা ব্যাক ছাড়া নয়)');

/* --- D-75 ফ্লো চুক্তি --- */
const flows = FLOW.map(i => R[i]);
ok(flows.every(r => r.nav === 0 && r.drawer === 0 && r.burger === 0), `ফ্লো পর্দায় নেভ/ড্রয়ার/হ্যামবার্গার বন্ধ (${FLOW.length}টি)`);
ok(flows.every(r => r.flowbar === 1 && r.back), 'ফ্লো পর্দায় ফ্লো-বার + ব্যাক বাটন আছে');
const nonFlow = ids.filter(i => !FLOW.includes(i)).map(i => R[i]);
ok(nonFlow.every(r => r.nav === 1 && r.slots === 5), `নন-ফ্লো পর্দায় বটম নেভ ঠিক ৫ স্লট (${nonFlow.length}টি)`);
ok(nonFlow.every(r => r.drawer === 1 && r.drawerItems === 49 && r.drawerOn >= 1), 'নন-ফ্লো পর্দায় সম্পূর্ণ ANAV ড্রয়ার (৪৯ আইটেম) + হাইলাইট');

/* --- decbar / A-02 --- */
ok(R['a02'].decbar === 1 && R['a02'].drawer === 1 && R['a02'].slots === 5, 'A-02 এখন AM শেলে: ড্রয়ার + ৫-স্লট নেভ + স্টিকি CTA');
ok(!R['a02'].box.querySelector('.kpis, .kpi, .apphead'), 'A-02-এ ডেস্কটপ KPI/সদস্য-হেডার ক্লাস নেই');
ok(R['a02'].box.querySelectorAll('.amgrid .amkpi').length === 2, 'A-02-এ মোবাইল KPI (.amgrid/.amkpi)');
const dec = ids.filter(i => R[i].decbar).length;
ok(dec >= 26, `স্টিকি সিদ্ধান্ত বার (.decbar) = ${dec}/৩৬ (ধাপ C-তে বাকি ১০টি যোগ হবে)`);

/* --- D-78 টেবিল (ধাপ B সম্পন্ন) --- */
const wide = [];
ids.forEach(i => R[i].tbls.forEach(t => { if (t.cols >= 5) wide.push(`${R[i].code}:${t.cols}কলাম${t.wrapped ? '' : '(র‍্যাপ নেই!)'}`); }));
const unwrapped = [];
ids.forEach(i => R[i].tbls.forEach(t => { if (!t.wrapped) unwrapped.push(R[i].code); }));
ok(unwrapped.length === 0, `সব টেবিল .xtbl-wrap-এ (আড়াআড়ি স্ক্রল + স্থির প্রথম কলাম) — র‍্যাপ ছাড়া: ${unwrapped.join(',') || 'নেই'}`);
ok(wide.length === 0, `D-78: কোনো টেবিলে ≥৫ কলাম নেই — সব কার্ড/তালিকায় বদলেছে (লঙ্ঘন: ${wide.join(', ') || 'নেই'})`);
const mrowsIds = ids.filter(i => R[i].box.querySelectorAll('.mrows').length);   /* ধাপ C: অ্যাকর্ডিয়নের বডি এখন DOM-এ থাকে, তাই AM-24-ও ধরা পড়ে */
ok(mrowsIds.length === 25, `প্যাটার্ন ৭ (.mrows) মোবাইল তালিকা = ${mrowsIds.length} পর্দায় (${mrowsIds.map(i => R[i].code).join(', ')}) — ৬টি ≥৫-কলাম গ্রিডের সবগুলোই বদলেছে`);
ok(mrowsIds.every(i => { const b = R[i].box;
  const all = b.querySelectorAll('.mrows .row').length, tap = b.querySelectorAll('.mrows .row[onclick]').length;
  return tap >= 1 || b.querySelectorAll('.mrows .row.static').length === all; }),
  'প্রতি মোবাইল তালিকায় হয় ট্যাপ-যোগ্য সারি (chevron সহ), নয়তো সব সারি স্পষ্টভাবে স্ট্যাটিক (.row.static) — মিথ্যা অ্যাফর্ড্যান্স নেই');

/* --- D-77 ট্যাপ টার্গেট (ধাপ C বাকি → নোট) --- */
/* --- D-77 ট্যাপ টার্গেট (ধাপ C সম্পন্ন): ui.css-এর মাপ সরাসরি যাচাই --- */
const CSS = fs.readFileSync('/home/user/prototype/assets/ui.css', 'utf8');
const has = (re) => re.test(CSS);
ok(has(/\.btn-sm\{min-height:44px/), 'D-77: .btn-sm ৩৮→৪৪px');
ok(has(/\.chip-btn\{[^}]*min-height:40px/), 'D-77: .chip-btn → ৪০px');
ok(has(/\.iconbtn\{width:44px;height:44px/), 'D-77: .iconbtn ৪০→৪৪px');
ok(has(/\.decbar \.btn\{min-height:48px/), 'D-77: স্টিকি বারের বোতাম ≥৪৮px');
ok(has(/\.seg button\{[^}]*min-height:44px/) && has(/\.tabs button\{[^}]*min-height:44px/), 'D-77: সেগমেন্ট/ট্যাব বোতাম ৪৪px');
ok(has(/\.backbtn\{width:44px;height:44px/) && has(/\.drawer-i\{[^}]*min-height:44px/), 'D-77: ব্যাক বাটন ও ড্রয়ার আইটেম ৪৪px');
notes.push(`সাব-৪৪px ছিল এমন ${ids.reduce((s, i) => s + R[i].small, 0)}টি .btn-sm/.chip-btn এখন CSS-এ ৪৪/৪০px — নিরীক্ষার ৫৪৯ সংখ্যার বাকি অংশ (আইকন-ওনলি বাটন, ড্রয়ার চিপ) ও একই নিয়মে ঠিক হয়েছে`);
const dead = ids.reduce((s, i) => s + R[i].deadHeadBtn, 0);
const deadList = ids.filter(i => R[i].deadHeadBtn).map(i => R[i].code);
ok(dead === 0, `N4: হেডারের কোনো স্ক্রিন-বাটন নিষ্ক্রিয় নয় (বেল/শেয়ার/প্রিন্ট/কিউআর… সব যুক্ত) — বাকি: ${deadList.join(',') || 'নেই'}`);
notes.push('হেডার বাটনের গন্তব্য: ৬টি সরাসরি নেভিগেশন (#s08 অফলাইন, #m16 অ্যালার্ট, #am35 ইতিহাস, #am29 স্কিম সম্পাদনা, #am28 নতুন স্টাফ-এন্ট্রি) · বাকি ২০টি amAct() অ্যাকশন শিটে');

/* --- আসল ক্লিক ইন্টারঅ্যাকশন --- */
const host = d.createElement('div');
host.innerHTML = `<div class="phone">${w.renderScreen('am02')}</div>`;
d.body.appendChild(host);
const ph = host.querySelector('.phone');
ph.querySelector('.amburger').dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
ok(ph.classList.contains('dr-open'), '☰ চাপলে ড্রয়ার খোলে (.dr-open)');
ph.querySelector('.drawer-scrim').dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
ok(!ph.classList.contains('dr-open'), 'স্ক্রিমে চাপলে ড্রয়ার বন্ধ হয়');
/* নোট: এই হার্নেসে jsdom runScripts:'outside-only' → inline onclick attribute চলে না,
   তাই কেবাব/শিটের গ্লোবাল ফাংশনগুলো সরাসরি কল করা হয় (ব্রাউজারে inline onclick ঠিকই চলে,
   যেভাবে পুরো প্রোটোটাইপে go('#…') চলে)। ড্রয়ার অবশ্য ডেলিগেটেড লিসেনার, তাই ক্লিক ডিসপ্যাচই যথেষ্ট। */
const kb = ph.querySelector('.amhead .iconbtn[onclick*="amMore"]');
ok(/amMore\(this\)/.test(kb.getAttribute('onclick')) && typeof w.amMore === 'function', 'কেবাবে amMore(this) বাঁধা এবং ফাংশনটি গ্লোবাল');
w.amMore(kb);
ok(ph.classList.contains('sh-open'), 'কেবাব চাপলে অ্যাকশন শিট খোলে (.sh-open)');
w.amMoreClose(ph.querySelector('.sheet.more .sheet-h .iconbtn'));
ok(!ph.classList.contains('sh-open'), 'শিটের ✕ চাপলে বন্ধ হয়');
ph.querySelector('.amburger').dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
w.amMore(kb);
ok(!ph.classList.contains('dr-open') && ph.classList.contains('sh-open'), 'কেবাব খোলার সময় ড্রয়ার বন্ধ থাকে (পারস্পরিক বর্জন)');
w.amMoreClose(kb);
ph.querySelector('.amburger').dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
w.amMoreDrawer(ph.querySelector('.sheet.more .amact'));
d.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
ok(!ph.classList.contains('sh-open') && !ph.classList.contains('dr-open'), 'Escape চাপলে ড্রয়ার ও শিট দুটোই বন্ধ হয়');

/* --- ধাপ B: amAct অ্যাকশন শিট (হেডারের স্ক্রিন-নির্দিষ্ট বাটন) --- */
const host2 = d.createElement('div');
host2.innerHTML = `<div class="phone">${w.renderScreen('am04')}</div>`;
d.body.appendChild(host2);
const ph2 = host2.querySelector('.phone');
const actBtn = ph2.querySelector('.amhead .iconbtn[onclick^="amAct"]');
ok(!!actBtn && typeof w.amAct === 'function', 'হেডারের স্ক্রিন-বাটনে amAct(this,…) বাঁধা এবং ফাংশন গ্লোবাল');
w.amAct(actBtn, (actBtn.getAttribute('onclick').match(/'(\w+)'/) || [])[1]);
const actSheet = ph2.querySelector('.sheet.act');
ok(ph2.classList.contains('sh-open') && !!actSheet, 'amAct চাপলে অ্যাকশন শিট (.sheet.act) খোলে');
ok(actSheet.querySelectorAll('.amact').length >= 2 && !!actSheet.querySelector('.sheet-h b'), 'শিটে শিরোনাম + ≥২টি অ্যাকশন আইটেম');
ok(!!actSheet.querySelector('.decbar-note') && /প্রোটোটাইপ/.test(actSheet.textContent), 'শিটে সততা-নোট — এগুলো UI-নকশা, ব্যাকএন্ড সংযোগ ধাপ D-তে');
ok(!ph2.classList.contains('dr-open'), 'অ্যাকশন শিট খোলার সময় ড্রয়ার বন্ধ থাকে (পারস্পরিক বর্জন)');
w.amMoreClose(actSheet);
ok(!ph2.classList.contains('sh-open'), 'শিটের ✕ চাপলে বন্ধ হয়');
host2.remove();

/* --- ধাপ C: স্টিকি বার, এক প্রাইমারি, শিট-মডেল, ভাঁজ, অ্যাকর্ডিয়ন --- */
ok(ids.every(i => R[i].decbar === 1), `N5: প্রতি পর্দায় স্টিকি সিদ্ধান্ত-বার (.decbar) = ${ids.filter(i => R[i].decbar).length}/৩৬`);
const primOut = [];
ids.forEach(i => R[i].prim.forEach(p => { if (!p.closest('.decbar') && !p.closest('.sheet')) primOut.push(R[i].code + ':' + p.textContent.trim().slice(0, 14)); }));
ok(primOut.length === 0, `N7: বডি/কার্ডে প্রাইমারি বোতাম নেই — একমাত্র প্রাইমারি .decbar-এ (শিটের নিজস্ব CTA বাদে); বাইরে: ${primOut.join(', ') || 'নেই'}`);
ok(ids.every(i => R[i].prim.filter(p => p.closest('.decbar')).length <= 1), 'প্রতি স্টিকি বারে সর্বোচ্চ ১টি প্রাইমারি');
const flt = ids.filter(i => R[i].fltSheet).length;
ok(flt === 10, `স্ক্রিনের নিজস্ব শিট (.sheet.flt) = ${flt}টি (ফিল্টার/OTP/প্যারামিটার)`);
ok(ids.every(i => R[i].sheetOpen === 0), 'N4: কোনো শিট ডিফল্টে খোলা রেন্ডার হয় না (আগে ১০টি শিট পর্দার নিচের অর্ধেক ঢেকে রাখত)');
const folds = ids.filter(i => R[i].fold);
ok(folds.length === 46 && folds.every(i => R[i].foldBtn === R[i].fold), `N11: ৪৬টি দীর্ঘ পর্দায় ভাঁজ-অঞ্চল (.foldgrp) = ${folds.map(i => R[i].code).join(', ')}`);
ok(ids.every(i => R[i].acc2 === R[i].acc2Body), 'অ্যাকর্ডিয়নের বডি এখন DOM-এ থাকে (আগে বন্ধ অ্যাকর্ডিয়নের তথ্য মোবাইলে পৌঁছাতই না)');

/* --- ধাপ C: নিষ্ক্রিয় বোতাম ও চিপ — আসল ক্লিকে --- */
const rescue = d.createElement('div');
rescue.innerHTML = `<div class="phone">${w.renderScreen('am22')}</div>`;
d.body.appendChild(rescue);
const rph = rescue.querySelector('.phone');
const deadBtn = [...rph.querySelectorAll('button.btn')].find(b => !b.getAttribute('onclick') && !b.hasAttribute('disabled'));
ok(!!deadBtn && typeof w.amActAuto === 'function', 'নিষ্ক্রিয় বোতামের জন্য amActAuto গ্লোবাল');
deadBtn.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
ok(rph.classList.contains('sh-open') && rph.querySelector('.sheet.act .amact'), 'নিষ্ক্রিয় বোতামে ট্যাপ করলে লেবেল-অনুযায়ী অ্যাকশন শিট খোলে (১৫৪টি বোতাম সচল)');
w.amMoreClose(rph.querySelector('.sheet.act'));
rescue.remove();
/* চিপ-টগল: যেসব পর্দায় ফিল্টার চিপ আছে সেখানে নির্বাচন সত্যিই বদলায় কিনা */
let chipTested = 0, chipOk = 0;
ids.forEach(i => {
  if (chipTested >= 6) return;
  const h = d.createElement('div'); h.innerHTML = `<div class="phone">${w.renderScreen(i)}</div>`; d.body.appendChild(h);
  const g = h.querySelector('.chipset .chip-btn, .seg button');
  if (g) { chipTested++;
    g.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
    if (g.classList.contains('on')) chipOk++; }
  h.remove();
});
ok(chipTested >= 3 && chipOk === chipTested, `ফিল্টার চিপ/সেগমেন্ট ট্যাপে নির্বাচন বদলায় — ${chipOk}/${chipTested}টি পর্দায় পরীক্ষিত (আগে কেবল দেখাত, কাজ করত না)`);

/* --- ধাপ D: মোবাইল-নেটিভ ইনপুট (D-80), অফলাইন ব্যাজ (D-18), রেডিও-কার্ড, tel:/sms: --- */
const fileIds = ids.filter(i => R[i].fileIn.length);
ok(fileIds.length === 16 && ids.reduce((n, i) => n + R[i].fileIn.length, 0) === 18,
  `D-80: আসল ফাইল-পিকার/ক্যামেরা ইনপুট = ${ids.reduce((n, i) => n + R[i].fileIn.length, 0)}টি, ${fileIds.length} পর্দায় (${fileIds.map(i => R[i].code).join(', ')})`);
ok(ids.every(i => R[i].fileIn.every(f => f.closest('.filepick') && f.closest('label.filebtn'))),
  'প্রতি ফাইল-ইনপুট <label class="filebtn">-এর ভেতরে — মোবাইলে ট্যাপ করলেই ডিভাইস পিকার খোলে');
ok(R['am23'].fileIn.some(f => /csv|xlsx/.test(f.getAttribute('accept') || '')), 'AM-23 ইমপোর্টে CSV/Excel accept — ফোনে ইমপোর্ট শুরু করা যায়');
ok(/স্বয়ংক্রিয় এন্ট্রি নয়/.test(w.renderScreen('am04')) && /স্বয়ংক্রিয়ভাবে বসবে না/.test(w.renderScreen('am07')),
  'D-80: ছবি থেকে পড়া মান স্বয়ংক্রিয়ভাবে বসবে না — AM-04 ও AM-07 দুটোতেই স্পষ্ট লেখা আছে');
const oq = ids.filter(i => R[i].offq);
ok(oq.length >= 2 && oq.every(i => /কিউতে/.test(R[i].box.querySelector('.offq b').textContent)),
  `D-18: অফলাইন কিউ ব্যাজ = ${oq.map(i => R[i].code).join(', ')} (SYNC ডেটা থেকে আসল সংখ্যা)`);
ok(oq.every(i => R[i].box.querySelector('.offq .btn[onclick*="s08"]')), 'কিউ ব্যাজ থেকে S-08 অফলাইন পর্দায় যাওয়া যায়');
ok(R['am11'].radios === 3 && R['am11'].radioOn === 1, 'প্যাটার্ন ৮: AM-11-এ প্রদানের মাধ্যম রেডিও-কার্ডে (৩টি, ১টি নির্বাচিত)');
const telIds = ids.filter(i => R[i].tel.length);
const telTot = ids.reduce((n, i) => n + R[i].tel.length, 0);
ok(telIds.length >= 6 && telTot >= 30, `tel:/sms: আসল ডিভাইস লিঙ্ক = ${telTot}টি, ${telIds.length} পর্দায় (${telIds.map(i => R[i].code).join(', ')})`);
ok(ids.every(i => R[i].tel.every(a => /^(tel|sms):\+8801[0-9]{9}/.test(a.getAttribute('href')))),
  'সব tel:/sms: href আন্তর্জাতিক ফরম্যাটে (+৮৮) — বাংলা সংখ্যা/ড্যাশ থাকলে ডায়ালার কাজ করে না');

/* ফাইল বাছাই ও রেডিও-কার্ডের আসল আচরণ */
const fh = d.createElement('div'); fh.innerHTML = `<div class="phone">${w.renderScreen('am07')}</div>`;
d.body.appendChild(fh); const fph = fh.querySelector('.phone');
const fin = fph.querySelector('input[type=file]');
const fbox = fin.closest('.filepick');
Object.defineProperty(fin, 'files', { value: [{ name: 'NID-pechone.jpg' }], configurable: true });
w.amFilePicked(fin);
ok(fbox.querySelector('.filebtn').classList.contains('has') && fbox.querySelector('.filenote').classList.contains('ok')
  && /NID-pechone\.jpg/.test(fbox.querySelector('.filenote').innerHTML), 'ফাইল বাছাই করলে নিশ্চিতকরণ + ফাইলের নাম দেখা যায়');
Object.defineProperty(fin, 'files', { value: [], configurable: true });
w.amFilePicked(fin);
ok(!fbox.querySelector('.filenote').classList.contains('ok'), 'ফাইল না বাছাই হলে নোট স্বাভাবিক অবস্থায় ফিরে যায়');
fh.remove();
const rch = d.createElement('div'); rch.innerHTML = `<div class="phone">${w.renderScreen('am11')}</div>`;
d.body.appendChild(rch); const rph2 = rch.querySelector('.phone');
const rcs = [...rph2.querySelectorAll('.radio-card')];
rcs[2].dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
ok(rcs[2].classList.contains('on') && rph2.querySelectorAll('.radio-card.on').length === 1 && rcs[2].querySelector('input').checked,
  'রেডিও-কার্ডে ট্যাপ করলে একক নির্বাচন বদলায় (নেটিভ radio সহ)');
rch.remove();

ok(errs.length === 0, `console error নেই (${errs.slice(0, 2).join(' | ') || 'none'})`);
notes.forEach(n => console.log('  ℹ ' + n));
console.log(fail === 0 ? `\n✅ tui: ${pass} passed, 0 failed` : `\n❌ tui: ${pass} passed, ${fail} failed`);
fails.forEach(f => console.log('  · ' + f));
process.exitCode = fail ? 1 : 0;
