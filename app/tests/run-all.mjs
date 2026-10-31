/* ============================================================
   tests/run-all.mjs — Phase 1 হার্নেসগুলো একসাথে (d01 → d04)
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
];

const BN = '০১২৩৪৫৬৭৮৯';
const toLatin = (s) => s.replace(/[০-৯]/g, (d) => BN.indexOf(d));

let totalPass = 0, totalFail = 0, totalAll = 0;
const rows = [];

for (const [label, file] of SUITES) {
  const t0 = Date.now();
  const r = spawnSync(process.execPath, [join(HERE, file)], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  const out = (r.stdout || '') + (r.stderr || '');
  const m = out.match(/মোট:\s*([\d০-৯]+)\s*·\s*পাস\s*([\d০-৯]+)\s*·\s*ফেল\s*([\d০-৯]+)/);
  const all = m ? Number(toLatin(m[1])) : 0;
  const pass = m ? Number(toLatin(m[2])) : 0;
  const fail = m ? Number(toLatin(m[3])) : 0;
  const crashed = r.status !== 0 && !m;
  totalAll += all; totalPass += pass; totalFail += fail;
  rows.push({ label, file, all, pass, fail, crashed, ms: Date.now() - t0 });

  if (fail || crashed) {
    // ব্যর্থ চেকগুলো সরাসরি দেখানো হয় যাতে আলাদা করে না চালানো লাগে
    const tail = out.split('\n').filter((l) => /❌|ব্যর্থ চেক|Error|throw/.test(l)).slice(0, 25);
    console.log(`\n❌ ${label} — ${fail} ফেল`);
    tail.forEach((l) => console.log('   ' + l.trim()));
  } else {
    console.log(`✅ ${label} — ${pass}/${all} (${rows.at(-1).ms} ms)`);
  }
}

console.log('\n════════ সারসংক্ষেপ ════════');
for (const r of rows) {
  const mark = (r.fail || r.crashed) ? '❌' : '✅';
  console.log(`${mark} ${r.file.padEnd(28)} ${String(r.pass).padStart(4)}/${String(r.all).padEnd(4)} ${r.crashed ? '(ক্র্যাশ)' : ''}`);
}
console.log(`\nমোট চেক: ${totalAll} · পাস: ${totalPass} · ফেল: ${totalFail}`);
if (totalFail === 0 && totalAll > 0) console.log('সব হার্নেস সবুজ ✅');
process.exit(totalFail === 0 && totalAll > 0 ? 0 : 1);
