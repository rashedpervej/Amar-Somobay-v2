/* ============================================================
   tests/run-all.mjs — ডি-হার্নেসগুলো একসাথে (d01 → d11)
   যেকোনো একটি ফেল করলে exit code অ-শূন্য হয় (CI-উপযোগী)।
   চালান:  node tests/run-all.mjs
   ============================================================ */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const SUITES = [
  ['D-01 · সুদমুক্ত নীতি', 'd01-no-interest.mjs'],
  ['D-02 · Cross-tenant isolation', 'd02-tenant-isolation.mjs'],
  ['D-03 · ডিজাইন টোকেন সমতা', 'd03-design-tokens.mjs'],
  ['D-04 · Source A স্ক্যান + SQL শৃঙ্খলা', 'd04-source-a-scan.mjs'],
  ['D-05 · শেল ও নেভিগেশন চুক্তি', 'd05-shell-contract.mjs'],
  ['D-06 · পর্দা ও রাউট চুক্তি', 'd06-screens-contract.mjs'],
  ['D-07 · স্ক্রিন ইনভেন্টরি ও অগ্রগতি', 'd07-inventory.mjs'],
  ['D-08 · সদস্য অ্যাপ পর্দা ও কার্যকারিতা', 'd08-member-screens.mjs'],
  ['D-09 · শেয়ার্ড ও ক্রস-কাটিং পর্দা', 'd09-shared-screens.mjs'],
  ['D-10 · সদস্য মডিউল (ROSCA · JM · QH)', 'd10-member-modules.mjs'],
  ['D-11 · অ্যাডমিন মোবাইল পর্দা (AM-01…AM-20)', 'd11-admin-mobile.mjs'],
];

const BN = '০১২৩৪৫৬৭৮৯';
const toLatin = (s) => s.replace(/[০-৯]/g, (d) => BN.indexOf(d));

let totalPass = 0, totalFail = 0, totalAll = 0, totalSkip = 0;
const rows = [];

for (const [label, file] of SUITES) {
  const t0 = Date.now();
  const r = spawnSync(process.execPath, [join(HERE, file)], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  const out = (r.stdout || '') + (r.stderr || '');
  const m = out.match(/মোট:\s*([\d০-৯]+)\s*·\s*পাস\s*([\d০-৯]+)\s*·\s*ফেল\s*([\d০-৯]+)/);
  const all = m ? Number(toLatin(m[1])) : 0;
  const pass = m ? Number(toLatin(m[2])) : 0;
  const fail = m ? Number(toLatin(m[3])) : 0;
  const sm = out.match(/·\s*স্কিপ\s*([\d০-৯]+)/);
  const skip = sm ? Number(toLatin(sm[1])) : 0;
  totalSkip += skip;
  const crashed = r.status !== 0 && !m;
  totalAll += all; totalPass += pass; totalFail += fail;
  rows.push({ label, file, all, pass, fail, skip, crashed, ms: Date.now() - t0 });

  if (fail || crashed) {
    // ব্যর্থ চেকগুলো সরাসরি দেখানো হয় যাতে আলাদা করে না চালানো লাগে
    const tail = out.split('\n').filter((l) => /❌|ব্যর্থ চেক|Error|throw/.test(l)).slice(0, 25);
    console.log(`\n❌ ${label} — ${fail} ফেল`);
    tail.forEach((l) => console.log('   ' + l.trim()));
  } else {
    console.log(`✅ ${label} — ${pass}/${all}` + (skip ? ` · স্কিপ ${skip}` : '') + ` (${rows.at(-1).ms} ms)`);
  }
}

console.log('\n════════ সারসংক্ষেপ ════════');
for (const r of rows) {
  const mark = (r.fail || r.crashed) ? '❌' : '✅';
  console.log(`${mark} ${r.file.padEnd(28)} ${String(r.pass).padStart(4)}/${String(r.all).padEnd(4)}`
    + (r.skip ? `${String(r.skip).padStart(2)} স্কিপ` : '        ')
    + ` ${r.crashed ? '(ক্র্যাশ)' : ''}`);
}
console.log(`\nমোট চেক: ${totalAll} · পাস: ${totalPass} · ফেল: ${totalFail}`
  + (totalSkip ? ` · স্কিপ: ${totalSkip} (কারণসহ, ওপরের তালিকায়)` : ''));
if (totalFail === 0 && totalAll > 0) console.log('সব হার্নেস সবুজ ✅');
process.exit(totalFail === 0 && totalAll > 0 ? 0 : 1);
