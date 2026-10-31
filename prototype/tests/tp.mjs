import { loadPage } from '/tmp/load.mjs';

/* ---------- Phase A: গঠন, কার্ড সংখ্যা, কভারেজ, ডিপ লিংক, ফিল্টার (থাম্বনেইল বন্ধ) ---------- */
const { w, d, errs, warns } = await loadPage('/home/user/prototype/preview.html', {
  pre: (win) => { win.pvFill = function () {}; }   /* ভারী থাম্বনেইল HTML বাদে শুধু গঠন যাচাই */
});
const META = w.__X.META;
let pass = 0, fail = 0; const fails = [];
const ok = (c, m) => { if (c) { pass++; console.log('  ✓ ' + m); } else { fail++; fails.push(m); console.log('  ✗ ' + m); } };
console.log('\n=== preview.html · Phase A ===');

const secs = [...d.querySelectorAll('#pvSections .pv-sec')];
ok(secs.length === 6, `৬টি সেকশন আছে (${secs.length})`);
const keys = secs.map(s => s.dataset.key);
ok(JSON.stringify(keys) === JSON.stringify(['adminapp', 'memberapp', 'collectorapp', 'otherroles', 'webpanel', 'live']),
   `সেকশন ক্রম: ${keys.join(' · ')}`);
const nums = [...d.querySelectorAll('#pvSections .pv-sec-h .num')].map(e => e.textContent.trim().split(' ')[0]);
ok(nums.join('') === '১২৩৪৫৬', `সেকশন নম্বর: ${nums.join(' ')}`);
const titles = [...d.querySelectorAll('#pvSections .pv-sec-h h2')].map(e => e.textContent.trim().replace(/\s+/g, ' '));
titles.forEach((t, i) => console.log(`    ${nums[i]} ${t}`));
ok(/Admin App/.test(titles[0]) && /Member App/.test(titles[1]) && /Collector App/.test(titles[2]) &&
   /Other Roles/.test(titles[3]) && /Web Panel/.test(titles[4]) && /Live Prototype/.test(titles[5]),
   '৬টি সেকশনের শিরোনাম ঠিক আছে');

keys.forEach(k => w.pvOpen(k));
const cardsOf = key => [...d.querySelectorAll(`#pv-${key} .pv-card`)].map(c => c.dataset.id);
const c1 = cardsOf('adminapp'), c2 = cardsOf('memberapp'), c3 = cardsOf('collectorapp'),
      c4 = cardsOf('otherroles'), c5 = cardsOf('webpanel');
console.log(`    কার্ড: §1=${c1.length} §2=${c2.length} §3=${c3.length} §4=${c4.length} §5=${c5.length}`);
ok(c1.length === 74 && c1.every(id => META.find(m => m.id === id).pres === 'app'),
   `§1 Admin App = 74 (AM-01…AM-35 + RAM-01…RAM-12 + JAM-01…JAM-10 + QAM-01…QAM-17) → ${c1.length}`);
ok(c2.length === 45, `§2 Member App = 45 (40 সদস্য + 5 শেয়ার্ড মোবাইল) → ${c2.length}`);
ok(c5.length === 80, `§5 Web Panel = 80 (77 ডেস্কটপ + 3 শেয়ার্ড ডেস্কটপ) → ${c5.length}`);
const union = new Set([...c1, ...c2, ...c5]);
const missing = META.map(m => m.id).filter(id => !union.has(id));
ok(union.size === 199 && missing.length === 0, `§1+§2+§5 = ১৯৯ স্ক্রিন কভার (বাদ: ${missing.join(',') || 'নেই'})`);
ok(c3.length >= 6, `§3 Collector App = ${c3.length} স্ক্রিন`);
ok(c4.length >= 20, `§4 Other Roles App = ${c4.length} স্ক্রিন`);
ok(new Set(c3).size === c3.length, `§3-এ ডুপ্লিকেট কার্ড নেই (${c3.length} অদ্বিতীয়)`);
ok(c4.length >= 20 && c4.length <= 80, `§4 = ভূমিকা প্রতি ল্যান্ডিং + ৫ স্লট → ${c4.length} কার্ড (ডুপ্লিকেট স্তূপ নেই)`);

/* মোবাইল ও ডেস্কটপ সম্পূর্ণ আলাদা সেকশনে */
ok(c1.every(id => w.wsIsMob(id)) && c2.every(id => w.wsIsMob(id)), '§1 ও §2-এর সব কার্ড মোবাইল স্ক্রিন');
ok(c5.filter(id => !w.wsIsMob(id)).length === 79, `§5-এ ৭৯টি ডেস্কটপ স্ক্রিন (৭৬ Admin Web + ৩ শেয়ার্ড ডেস্কটপ) → ${c5.filter(id => !w.wsIsMob(id)).length}`);
ok(c5.includes('a02'), '§5-এ A-02 আছে (মোবাইল ভ্যারিয়েন্ট হিসেবে চিহ্নিত)');
ok(!/ভিউ টগল|view-toggle|pvToggleView/.test(d.body.innerHTML), 'কোনো ডেস্কটপ↔মোবাইল ভিউ টগল নেই');

/* ভূমিকা ব্লক + চিপ */
const blocks = [...d.querySelectorAll('#pvSections .pv-role-block')];
console.log(`    ভূমিকা ব্লক = ${blocks.length}`);
ok(blocks.length === 15, `ভূমিকা-ভিত্তিক ব্লক = ${blocks.length} (১ সদস্য + ১ সংগ্রহক + ৭ অন্যান্য + ৬ ওয়েব)`);
const flows = [...d.querySelectorAll('#pvSections .pv-flow')];
ok(flows.length === 7, `§4-এ ভূমিকাভিত্তিক প্রবাহ রেখা = ${flows.length}`);
const chips = [...d.querySelectorAll('#pvSections .pv-chip[data-f]')].map(c => c.getAttribute('data-f'));
ok(new Set(chips).size >= 6, `ফিল্টার চিপ = ${new Set(chips).size} ধরনের`);

/* সার্চ ও চিপ ফিল্টার (§1) */
const body1 = d.querySelector('#pv-adminapp [data-body]');
const search1 = body1 && body1.querySelector('[data-search]');
ok(!!search1, '§1-এ সার্চ বক্স আছে');
if (search1) {
  search1.value = 'দিনশেষ';
  search1.dispatchEvent(new w.Event('input', { bubbles: true }));
  const shown = [...body1.querySelectorAll('.pv-card')].filter(c => c.style.display !== 'none');
  ok(shown.length > 0 && shown.length < c1.length, `সার্চ "দিনশেষ" → ${shown.length}/${c1.length} কার্ড`);
  search1.value = ''; search1.dispatchEvent(new w.Event('input', { bubbles: true }));
  const back = [...body1.querySelectorAll('.pv-card')].filter(c => c.style.display !== 'none');
  ok(back.length === c1.length, 'সার্চ মুছলে সব কার্ড ফিরে আসে');
}
const chipEl = body1 && body1.querySelector('.pv-chip[data-f]:not([data-f="all"])');
if (chipEl) {
  chipEl.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
  const shown = [...body1.querySelectorAll('.pv-card')].filter(c => c.style.display !== 'none');
  ok(shown.length > 0 && shown.length < c1.length, `চিপ "${chipEl.textContent.trim()}" → ${shown.length} কার্ড`);
  const all = body1.querySelector('.pv-chip[data-f="all"]');
  if (all) all.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
}

/* ডিপ লিংক */
const links = [...d.querySelectorAll('#pvSections a[href^="workspace.html#"]')].map(a => a.getAttribute('href'));
ok(links.length >= 40, `ওয়ার্কস্পেস ডিপ লিংক = ${links.length}`);
const bad = [];
links.forEach(h => {
  const p = decodeURIComponent(h.split('#')[1] || '');
  if (p === 'sec-mob' || p === 'sec-web') return;   /* §6-এর সেকশন অ্যাংকর — বৈধ */
  const m = p.match(/^(mob|web):([A-Za-z_]*):([a-z0-9]+)$/);
  if (!m) { bad.push('parse:' + h); return; }
  const [, plat, role, id] = m;
  if (!META.some(x => x.id === id)) bad.push('noscreen:' + id);
  if (role && !w.wsRole(role)) bad.push('norole:' + role);
  if (plat === 'mob' && !w.wsIsMob(id)) bad.push('mob↛mob:' + id);
  if (plat === 'web' && w.wsIsMob(id) && id[0] !== 's') bad.push('web↛desk:' + id);
});
ok(bad.length === 0, `ডিপ লিংক বৈধ (সমস্যা: ${bad.slice(0, 5).join(', ') || 'নেই'})`);

/* §6 + পরিসংখ্যান */
const liveSec = d.getElementById('pv-live');
const live = liveSec;
ok(/workspace\.html/.test(live.innerHTML), '§6 ওয়ার্কস্পেসে লিংক করে');
ok(/পরিকল্পিত|স্থগিত|তৈরি নয়/.test(live.innerHTML) && /Super Admin/.test(live.innerHTML),
   '§6-এ Super Admin প্যানেলের স্থিতি (স্ক্রিন তৈরি নয় / পরিকল্পিত) স্পষ্ট');
const sa = [...d.querySelectorAll('#pv-webpanel .pv-sa-card code')].map(e => e.textContent.trim());
ok(sa.length === 12 && sa[0] === 'P-01' && sa[11] === 'P-12', `§5-এ Super Admin পরিকল্পিত পেজ কার্ড = ${sa.length} (P-01…P-12)`);
ok(/ডিজাইন স্থগিত|তৈরি নয়/.test(d.getElementById('pv-webpanel').textContent), '§5-এ Super Admin = ডিজাইন স্থগিত স্পষ্ট');
console.log(`    §6-এ পরিকল্পিত পেজ কোড = ${sa.length}`);
const stats = d.getElementById('pvStats').textContent.trim().replace(/\s+/g, ' ');
ok(/[\d০-৯]/.test(stats) && /১৯৯|199/.test(stats) && /১২৫|125/.test(stats), 'পরিসংখ্যান প্যানেল ভরা: ' + stats.slice(0, 110));
ok(!/NaN/.test(d.body.innerHTML), 'পেজে NaN নেই');
ok(!/>undefined</.test(d.body.innerHTML), 'পেজে ফাঁকা undefined নেই');
ok(errs.length === 0, `console error নেই (${errs.slice(0, 2).join(' | ') || 'none'})`);

console.log(`\n${fail ? '❌' : '✅'} Phase A: ${pass} passed, ${fail} failed`);
fails.forEach(f => console.log('  · ' + f));
console.log('  · warns:', warns.length, warns.slice(0, 3).join(' | '));
process.exitCode = fail ? 1 : 0;
