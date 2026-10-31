import { loadPage } from '/tmp/load.mjs';
const { w, d, errs } = await loadPage('/home/user/prototype/preview.html');   /* থাম্বনেইল আসল pvFill দিয়ে */
let pass = 0, fail = 0; const fails = [];
const ok = (c, m) => { if (c) { pass++; console.log('  ✓ ' + m); } else { fail++; fails.push(m); console.log('  ✗ ' + m); } };
console.log('\n=== preview.html · Phase B (থাম্বনেইল) ===');
const thumbs = [...d.querySelectorAll('#pv-adminapp .pv-thumb')];
ok(thumbs.length === 74, `§1 থাম্বনেইল হোল্ডার = ${thumbs.length}`);
const filled = thumbs.filter(t => t.querySelector('.phone'));
ok(filled.length === 74, `§1 থাম্বনেইল ফোন ফ্রেমসহ ভরা = ${filled.length}/74`);
ok(filled.every(t => t.innerHTML.length > 2000), 'প্রতিটি থাম্বনেইলে আসল স্ক্রিন HTML');
ok(filled.every(t => /scale\(/.test(t.innerHTML)), 'থাম্বনেইল স্কেল করা (ছোট প্রিভিউ)');
/* §3 খুলে থাম্বনেইল */
w.pvOpen('collectorapp');
const t3 = [...d.querySelectorAll('#pv-collectorapp .pv-thumb')];
ok(t3.length > 0 && t3.every(t => t.querySelector('.phone')), `§3 থাম্বনেইল ভরা = ${t3.filter(t => t.querySelector('.phone')).length}/${t3.length}`);
/* ডেস্কটপ থাম্বনেইল সরাসরি ইঞ্জিন থেকে */
const webThumb = w.wsThumbHtml('a20', 'web');
ok(/class="browser/.test(webThumb) && /sidebar/.test(webThumb), 'ডেস্কটপ থাম্বনেইলে ব্রাউজার ফ্রেম + সাইডবার');
const mobThumb = w.wsThumbHtml('am04', 'mob');
ok(/class="phone"/.test(mobThumb) && /bottomnav/.test(mobThumb), 'মোবাইল থাম্বনেইলে ফোন ফ্রেম + বটম নেভ');
ok(!/NaN/.test(webThumb + mobThumb), 'থাম্বনেইলে NaN নেই');
ok(errs.length === 0, `console error নেই (${errs.slice(0,2).join(' | ') || 'none'})`);
console.log(`\n${fail ? '❌' : '✅'} Phase B: ${pass} passed, ${fail} failed`);
fails.forEach(f => console.log('  · ' + f));
process.exitCode = fail ? 1 : 0;
