import fs from 'fs';
import { loadPage } from '/tmp/load.mjs';

let pass = 0, fail = 0; const fails = [];
const ok = (c, m) => { if (c) { pass++; console.log('  ✓ ' + m); } else { fail++; fails.push(m); console.log('  ✗ ' + m); } };

const { w, d, errs, warns } = await loadPage('/home/user/prototype/skins.html');
const META = w.__X.META;
console.log('\n=== skins.html ===');

/* ---- ১. গঠন ও সুইচার ---- */
const btns = [...d.querySelectorAll('[data-sk-switch] button')];
ok(btns.length === 6, `স্কিন সুইচারে ৬টি বটন (${btns.length})`);
ok(typeof w.setSkin === 'function', 'window.setSkin() API আছে');
['s1','s2','s3','s4','s5','s6','s7'].forEach(id => ok(!!d.getElementById(id), `সেকশন #${id} আছে`));
ok(d.querySelectorAll('.skp-st').length === 6, `স্ট্যাট টাইল = ${d.querySelectorAll('.skp-st').length}`);

/* ---- ২. প্রতিটি স্কিন প্রয়োগ ---- */
const keys = ['default','gs','rosca','jg','qh','platform'];
let applyErr = [];
keys.forEach(k => {
  try {
    const s = w.skApply(k);
    const th = d.body.getAttribute('data-theme');
    if (k === 'default' && th !== null) applyErr.push(k+':theme-not-removed');
    if (k !== 'default' && th !== s.theme) applyErr.push(k+':theme='+th);
    if (d.body.getAttribute('data-module') !== s.module) applyErr.push(k+':module');
  } catch (e) { applyErr.push(k+':'+e.message); }
});
ok(applyErr.length === 0, `৬টি স্কিনই ঠিকভাবে প্রয়োগ হয় (সমস্যা: ${applyErr.join(',') || 'নেই'})`);
ok(errs.length === 0, `console error নেই (${errs.slice(0,2).join(' | ') || 'none'})`);

/* ---- ৩. ডিফল্ট অক্ষুণ্ণ: data-theme ছাড়া বিদ্যমান টোকেন ---- */
/* jsdom কাস্টম প্রপার্টি সমাধান করতে পারে না — তাই মান CSS ফাইল থেকেই পার্স করে যাচাই */
const UI = fs.readFileSync('/home/user/prototype/assets/ui.css', 'utf8');
const SKC = fs.readFileSync('/home/user/prototype/assets/skins.css', 'utf8');
const SKCSS = SKC;
const uiRoot = Object.fromEntries([...UI.matchAll(/(--[a-zA-Z0-9-]+)\s*:\s*([^;]+);/g)].map(m => [m[1], m[2].trim()]));
function themeVals(name) {
  const m = new RegExp('\\[data-theme="' + name + '"\\]\\{([\\s\\S]*?)\\}').exec(SKC);
  return m ? Object.fromEntries([...m[1].matchAll(/(--[a-zA-Z0-9-]+)\s*:\s*([^;]+);/g)].map(x => [x[1], x[2].trim()])) : {};
}
const bridge = (() => {
  const m = /\[data-theme\]\{([\s\S]*?)\}/.exec(SKC);
  return m ? Object.fromEntries([...m[1].matchAll(/(--[a-zA-Z0-9-]+)\s*:\s*var\((--[a-zA-Z0-9-]+)\)/g)].map(x => [x[1], x[2]])) : {};
})();
const res = (theme, tok) => {           /* theme=null → ui.css ডিফল্ট */
  if (!theme) return uiRoot[tok] || '';
  const tv = themeVals(theme);
  if (tv[tok]) return tv[tok].replace(/^var\((--[a-zA-Z0-9-]+)\)$/, (_, n) => tv[n] || '');
  const via = bridge[tok];
  return via ? (tv[via] || '') : (uiRoot[tok] || '');
};
const MIRROR = w.__X.SK_VALUES || null;
ok(res(null, '--green-700') === '#0B6B53', `ডিফল্টে --green-700 = ${res(null, '--green-700')} (ui.css অপরিবর্তিত)`);
ok(res(null, '--lime') === '#C9F26E', `ডিফল্টে --lime = ${res(null, '--lime')}`);
ok(res(null, '--rose') === '#E2574C' && res(null, '--mint') === '#E6F7EF' && res(null, '--green') === '#0B6B53',
   'হারানো ৩টি এলিয়াস টোকেন এখন সংজ্ঞায়িত (--rose/--mint/--green)');
ok(res('qh', '--green-700') === '#0B6B52' && res('qh', '--lime') === '#E9CE8B',
   `QH ব্রিজ কাজ করছে: --green-700=${res('qh','--green-700')} · --lime=${res('qh','--lime')} (সোনালি)`);
ok(res('rosca', '--green-700') === '#0F4E96' && res('jg', '--green-700') === '#4A3588' && res('platform', '--green-700') === '#2B3444',
   'ROSCA/JG/Platform ব্রিজও কাজ করছে');
ok(Object.keys(bridge).length === 11, `ব্রিজে ১১টি টোকেন ম্যাপ হয়েছে (${Object.keys(bridge).length})`);
/* JS মিরর টেবিল ও CSS-এর মধ্যে ড্রিফট নেই */
let drift = [];
if (MIRROR) Object.keys(MIRROR).forEach(t => Object.entries(MIRROR[t]).forEach(([n, v]) => {
  const cssV = res(t, n);
  if (cssV && cssV !== v) drift.push(`${t}.${n}: js=${v} css=${cssV}`);
}));
else drift.push('SK_VALUES নেই');
ok(drift.length === 0, `skins.js-এর মিরর টেবিল skins.css-এর সাথে মিলে যায় (অমিল: ${drift.slice(0,3).join(', ') || 'নেই'})`);

/* ---- ৪. টোকেন টেবিল ---- */
const tokCells = [...d.querySelectorAll('#skTokens .sk-tok-c')];
ok(tokCells.length === 15, `সক্রিয় স্কিনের টোকেন কার্ড = ${tokCells.length}`);
const undef = [...d.querySelectorAll('#skTokensAll code')].filter(c => /সংজ্ঞাহীন|—/.test(c.textContent));
ok(undef.length === 0, `তুলনা টেবিলে সংজ্ঞাহীন টোকেন নেই (${undef.length})`);
ok(d.querySelectorAll('#skTokensAll tbody tr').length === 15, 'তুলনা টেবিলে ১৫টি টোকেন সারি');

/* ---- ৫. প্যাটার্ন ---- */
const pats = [...d.querySelectorAll('#skPatterns .sk-pat')];
ok(pats.length === 12, `প্যাটার্ন কার্ড = ${pats.length} (গ্যালারিতে ১২টি, CSS-এ ১৫ ভ্যারিয়েন্ট)`);
const patCls = pats.map(p => [...p.classList].find(c => c.startsWith('p-')));
ok(patCls.length === 12 && patCls.every(Boolean), `প্যাটার্ন টাইল = ${patCls.length}টি (ক্লাসভিত্তিক)`);
const patVars = pats.map(p => p.getAttribute('data-var'));
const cssHasPat = patVars.every(v => new RegExp(v.replace(/-/g, '\\-') + '\\s*:').test(SKCSS));
ok(cssHasPat, 'প্রতিটি প্যাটার্ন ভ্যারিয়েন্ট skins.css-এ সংজ্ঞায়িত');
const dataUri = (SKCSS.match(/data:image\/svg\+xml/g) || []).length;
ok(dataUri >= 15, `skins.css-এ ইনলাইন SVG ডেটা-URI = ${dataUri}টি (বাইরের ছবি নেই)`);
ok(!/url\(['"]?(?!data:|#)['A-Za-z0-9.\/]+\.(png|jpg|jpeg|gif|webp|svg)/.test(SKCSS), 'কোনো এক্সটার্নাল ছবি ফাইল রেফারেন্স নেই');
ok(!/<img/i.test(d.body.innerHTML), 'পেজে কোনো <img> ট্যাগ নেই (সব জ্যামিতি ইনলাইন)');

/* ---- ৬. কম্পোনেন্ট নমুনা ---- */
const comp = d.getElementById('skComp');
const need = ['.statusbar','.apphead','.avatar','.bal-hero','.bal-val','.btn-primary','.btn-lime','.btn-soft',
  '.btn-ghost','.chip-lime','.chip-btn.on','.txi.in','.txi.out','.txi.hold','.field','.inp','.hlp',
  '.tabs','.stepper','.sidebar','.sb-item.on','.stickyfoot','.state-sm'];
const miss = need.filter(sel => !comp.querySelector(sel));
ok(miss.length === 0, `কম্পোনেন্ট নমুনায় সব বিদ্যমান ক্লাস আছে (নেই: ${miss.join(',') || 'কিছুই না'})`);
ok(comp.querySelectorAll('.state-sm').length === 7, `৭টি বাধ্যতামূলক অবস্থার নমুনা = ${comp.querySelectorAll('.state-sm').length}`);
ok(comp.querySelectorAll('.skg-row').length === 3, 'বাটন/চিপ সারি (skg-row) ৩টি');
ok(!comp.querySelector('.sk-row'), 'ui.css-এর স্কেলিটন .sk-row-এর সাথে সংঘর্ষ নেই');

/* ---- ৭. ইসলামিক কিট ---- */
const qhRoot = d.getElementById('skQhSamples');
ok(/بِسْمِ/.test(qhRoot.textContent), 'বিসমিল্লাহ ক্যালিগ্রাফি আছে');
ok(/قَرْضًا حَسَنًا|يُقْرِضُ/.test(qhRoot.textContent), 'কুরআনের আরবি টেক্সট (কর্জে হাসানা) আছে');
ok(qhRoot.querySelectorAll('.qh-bismillah').length === 1, 'বিসমিল্লাহ হেডার ১টি');
ok(qhRoot.querySelectorAll('.qh-arch').length === 2, 'মিহরাব আর্চ ২টি (একটি এমেরাল্ড, একটি হালকা)');
ok(qhRoot.querySelectorAll('.qh-ref').length >= 3, `আয়াত/হাদিস রেফারেন্স চিপ = ${qhRoot.querySelectorAll('.qh-ref').length}`);
ok(!!qhRoot.querySelector('.qh-ref.hadith'), 'হাদিস রেফারেন্স চিপ আলাদা স্টাইলে');
ok(qhRoot.querySelectorAll('.qh-dua').length === 1, 'দোয়া ব্লক ১টি');
const riba = [...qhRoot.querySelectorAll('.qh-riba')];
ok(riba.length >= 1 && riba.some(r => /৳০/.test(r.textContent) && r.querySelector('s')),
   '"সুদমুক্ত · সুদ ৳০" ব্যাজ (স্ট্রাইক-থ্রু সহ) আছে');
ok(qhRoot.querySelectorAll('.qh-kpi-c').length === 4, 'KPI গ্রিডে ৪টি সেল (মূল · পরিশোধিত · বাকি · সুদ ৳০)');
const zero = qhRoot.querySelector('.qh-kpi-c.zero');
ok(zero && /^৳০$/.test(zero.querySelector('b').textContent.trim()), 'সুদের সেলটি ৳০ (শূন্য)');
ok(qhRoot.querySelectorAll('.qh-tasbih i').length === 6, 'তাসবিহ-মোটিফ কিস্তি অগ্রগতি ৬ দানা');
ok(qhRoot.querySelectorAll('.qh-gate').length === 4 && !!qhRoot.querySelector('.qh-gate.fail'),
   'ইলিজিবিলিটি গেটের ৪ স্তর (একটি fail নমুনা)');
ok(/QH-B-04/.test(qhRoot.textContent), 'কারণ-কোড (QH-B-04) দেখানো হয়েছে');
const words = d.getElementById('skWords');
ok(words.querySelectorAll('tbody tr').length === 5, 'শব্দচয়ন চুক্তি টেবিলে ৫ সারি');
ok(!!words.querySelector('td.no') && !!words.querySelector('td.yes'), 'নিষিদ্ধ ও অনুমোদিত — দুই স্তম্ভই আছে');
ok(d.querySelectorAll('#skQhSamples [data-theme="qh"]').length >= 3, 'QH কিট সর্বদা data-theme="qh"-এ (সুইচার থেকে স্বাধীন)');
ok(/নমুনা কম্পোনেন্ট — পেজ নয়/.test(qhRoot.textContent), 'নমুনাগুলো "পেজ নয়" বলে স্পষ্ট চিহ্নিত');
ok(/২৫টি পেজ.*তৈরি করা হয়নি|এখনো তৈরি করা হয়নি/.test(d.getElementById('s5').textContent), 'QH-এর ২৫ পেজ তৈরি নয় — স্পষ্ট ঘোষণা');

/* ---- ৮. নিষিদ্ধ ভাষা শুধু নিষেধ-প্রসঙ্গে ---- */
const banned = ['মুনাফা', 'ইন্টারেস্ট'];
const NEG = /(নেই|নয়|নিষিদ্ধ|করা হয়নি|হয় না|করা যাবে না|বন্ধ)/;
let leak = [];
banned.forEach(word => {
  [...d.querySelectorAll('body *')].forEach(el => {
    if (el.children.length === 0 && el.textContent.includes(word)) {
      const ctx = el.closest('.qh-word td.no, .skp-rule-c, .skp-note, .skp-sec-h, .skp-foot, .skp-dc-c, h1, .skp-lead');
      /* বিদ্যমান স্ক্রিনে শব্দটি শুধু অস্বীকরণ বাক্যে থাকতে পারে ("কোনো সুদ/মুনাফা নেই") */
      if (!ctx && !NEG.test(el.textContent)) leak.push(word + '→' + el.className + ':' + el.textContent.trim().slice(0, 42));
    }
  });
});
ok(leak.length === 0, `"মুনাফা/ইন্টারেস্ট" শুধু নিষেধ-প্রসঙ্গে (${[...new Set(leak)].join(',') || 'অন্য কোথাও নেই'})`);
const amtEls = [...d.querySelectorAll('.amt, .bal-val, .qh-kpi-c b, .bal-alt')];
ok(amtEls.every(e => !/সুদ|ইন্টারেস্ট|মুনাফা/.test(e.textContent) || /৳০/.test(e.textContent)),
   'কোনো অঙ্কের ঘরে সুদ-ভিত্তিক মান নেই');

/* ---- ৯. কনট্রাস্ট (WCAG AA) ---- */
function ratio(fg, bg) {
  const h = s => { const m = /^#([0-9a-f]{6})$/i.exec(s.trim()); return m ? [0,2,4].map(i => parseInt(m[1].substr(i,2),16)) : null; };
  const L = rgb => { const a = rgb.map(v => { v/=255; return v<=.03928 ? v/12.92 : Math.pow((v+.055)/1.055,2.4); }); return .2126*a[0]+.7152*a[1]+.0722*a[2]; };
  const A = h(fg), B = h(bg); if (!A || !B) return null;
  const l1 = L(A), l2 = L(B); return (Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05);
}
const rows = [...d.querySelectorAll('#skContrast tbody tr')].map(tr => [...tr.querySelectorAll('td')].map(td => td.textContent.trim()));
const bad = rows.filter(r => { const m = /([\d.]+):1/.exec(r[3]); return !m || parseFloat(m[1]) < 4.5; });
ok(rows.length === 6 && bad.length === 0, `সক্রিয় স্কিনের কনট্রাস্ট AA পাস (${rows.length - bad.length}/${rows.length})`);
const qrows = [...d.querySelectorAll('#skContrastQh tbody tr')].map(tr => [...tr.querySelectorAll('td')].map(td => td.textContent.trim()));
const qbad = qrows.filter(r => { const m = /([\d.]+):1/.exec(r[3]); return !m || parseFloat(m[1]) < 4.5; });
ok(qrows.length === 7 && qbad.length === 0, `ইসলামিক প্যালেটের কনট্রাস্ট AA পাস (${qrows.length - qbad.length}/${qrows.length})`);
/* প্রতিটি স্কিনের প্রধান জোড়া CSS থেকে নিজে থেকেও যাচাই */
let themeBad = [];
['gs','rosca','jg','qh','platform'].forEach(k => {
  const v = n => res(k, n);
  const pairs = [['হেডার', '#FFFFFF', v('--mod-800')], ['হেডার-সাব', v('--mod-sub'), v('--mod-800')],
                 ['প্রাইমারি বাটন', '#FFFFFF', v('--mod-700')], ['হাইলাইট বাটন', v('--mod-on-hi'), v('--mod-hi')],
                 ['চিপ', v('--mod-hi-ink'), v('--mod-hi-soft')], ['ব্র্যান্ড লিংক', v('--mod-700'), '#FFFFFF'],
                 ['হিরো-সাব', v('--mod-sub'), v('--mod-hero-3')]];
  pairs.forEach(([label, f, bg]) => {
    const r = ratio(f, bg);
    if (r === null || r < 4.5) themeBad.push(`${k}·${label}(${f}/${bg})=${r ? r.toFixed(2) : '?'}`);
  });
});
/* বিদ্যমান ডিজাইনের একটি জোড়া (gs·হিরো-সাব ৪.৩০:১) ইচ্ছাকৃতভাবে অক্ষুণ্ণ — পেজে নথিভুক্ত */
const inherited = themeBad.filter(x => x.startsWith('gs·হিরো-সাব'));
const realBad = themeBad.filter(x => !x.startsWith('gs·হিরো-সাব'));
ok(realBad.length === 0, `৫টি স্কিনের ৩৫টি জোড়ার মধ্যে নতুন কোনো AA ব্যর্থতা নেই (ব্যর্থ: ${realBad.slice(0,4).join(', ') || 'নেই'})`);
ok(inherited.length === 1 && /4\.30/.test(inherited[0]), `বিদ্যমান ডিজাইনের ১টি জোড়া ৪.৩০:১ — অক্ষুণ্ণ রাখা হয়েছে (${inherited[0] || 'নেই'})`);
ok(/৪\.৩০|4\.30/.test(d.body.textContent) && /bal-alt/.test(d.body.textContent), 'ফলাফলটি পেজে স্পষ্টভাবে নথিভুক্ত');
/* সোনালি অলংকরণ-রঙ টেক্সটে ব্যবহৃত হচ্ছে না */
ok(/\.qh-star8\{[^}]*var\(--qh-gold-deep\)/.test(SKC.replace(/\s+/g, ' ')) || /qh-star8[^}]*gold-deep/.test(SKC),
   '.qh-star8 টেক্সটে AA-পাস করা gold-deep ব্যবহৃত (অলংকরণী --qh-gold নয়)');

/* ---- ১০. বিদ্যমান স্ক্রিনের তুলনা ---- */
const cmp1 = [...d.querySelectorAll('#skCmpMob .sk-cmpcard')];
ok(cmp1.length === 4, `M-01 তুলনা কার্ড = ${cmp1.length}`);
ok(cmp1.every(c => c.querySelector('.phone')), 'প্রতিটি তুলনায় ফোন ফ্রেমে আসল স্ক্রিন');
ok(cmp1.some(c => c.getAttribute('data-theme') === 'qh') && cmp1[0].getAttribute('data-theme') === null,
   'তুলনায় ডিফল্ট ও QH দুটোই আছে');
ok([...d.querySelectorAll('#skCmpWeb .sk-cmpcard')].every(c => c.querySelector('.browser')), 'A-01 তুলনায় ব্রাউজার ফ্রেম');
ok(d.querySelectorAll('#skCmpMob2 .sk-cmpcard').length === 2, 'AM-01 তুলনা = ২ কার্ড (ডিফল্ট বনাম ইসলামিক)');
const cmpHtml = [...d.querySelectorAll('.sk-cmp-stage')].map(e => e.innerHTML).join('');
ok(!/NaN/.test(cmpHtml), 'রেন্ডার করা স্ক্রিনে NaN নেই');
ok(!/>undefined</.test(cmpHtml), 'রেন্ডার করা স্ক্রিনে ফাঁকা undefined নেই');
ok(d.querySelectorAll('#skSnips .sk-snip').length === 4, `প্রয়োগের কোড নমুনা = ${d.querySelectorAll('#skSnips .sk-snip').length}`);

/* ---- ১১. D-72…D-74 ---- */
ok(/D-72/.test(d.body.textContent) && /D-73/.test(d.body.textContent) && /D-74/.test(d.body.textContent),
   'খোলা সিদ্ধান্ত D-72, D-73, D-74 পেজে আছে');
ok(d.querySelectorAll('.skp-dc-c').length === 3, '৩টি সিদ্ধান্ত কার্ড (ডিফল্টসহ)');
ok(/১৯৯/.test(d.body.textContent) && /১২৫/.test(d.body.textContent) && /গণনা অপরিবর্তিত/.test(d.body.textContent), 'পেজ/স্ক্রিন গণনা অপরিবর্তিত বলে উল্লেখ আছে (১২৫ লজিক্যাল পেজ · ১৯৯ স্ক্রিন)');

/* ---- ১২. পেজ-স্তরের স্বাস্থ্য ---- */
ok(!/NaN/.test(d.body.innerHTML), 'পুরো পেজে NaN নেই');
ok(!/>undefined</.test(d.body.innerHTML), 'পুরো পেজে ফাঁকা undefined নেই');
ok(META.length === 199, `META = ১৯৯ স্ক্রিন (${META.length})`);
console.log(`\n${fail ? '❌' : '✅'} ${pass} passed, ${fail} failed`);
fails.forEach(f => console.log('  · ' + f));
console.log('  · warns:', warns.length, warns.slice(0,3).join(' | '));
if (fail) process.exitCode = 1;
