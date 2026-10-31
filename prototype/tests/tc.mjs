/* CSS কভারেজ: রেন্ডার করা HTML-এ ব্যবহৃত প্রতিটি ক্লাসের স্টাইল রুল আছে কি না */
import fs from 'fs';
import { loadPage } from '/tmp/load.mjs';
const ui = fs.readFileSync('/home/user/prototype/assets/ui.css', 'utf8');

async function check(file, open) {
  const { w, d } = await loadPage(file, { pre: (win) => { if (file.endsWith('preview.html')) win.pvFill = function () {}; } });
  if (open) open.forEach(k => w.pvOpen && w.pvOpen(k));
  const style = [...d.querySelectorAll('style')].map(s => s.textContent).join('\n');
  const css = style + '\n' + ui;
  const used = new Set();
  [...d.querySelectorAll('#pvSections *, #sec-mob *, #sec-web *, .ws-wrap *, body *')].forEach(el => {
    (el.getAttribute('class') || '').split(/\s+/).forEach(c => { if (c) used.add(c); });
  });
  const missing = [...used].filter(c => !new RegExp('\\.' + c.replace(/[-]/g, '\\-') + '(?![\\w-])').test(css));
  console.log(`\n=== ${file.split('/').pop()} ===`);
  console.log(`  ব্যবহৃত ক্লাস = ${used.size} · স্টাইল রুল ছাড়া = ${missing.length}`);
  if (missing.length) console.log('  · ' + missing.slice(0, 40).join(', '));
  return missing;
}
const a = await check('/home/user/prototype/workspace.html');
const b = await check('/home/user/prototype/preview.html', ['adminapp','memberapp','collectorapp','otherroles','webpanel','live']);
process.exitCode = (a.length + b.length) ? 1 : 0;
console.log(a.length + b.length === 0 ? '\n✅ সব ক্লাসের স্টাইল আছে' : '\n⚠️ কিছু ক্লাসের স্টাইল নেই');
