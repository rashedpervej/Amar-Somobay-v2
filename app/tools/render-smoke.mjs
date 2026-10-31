/* ============================================================
   tools/render-smoke.mjs — সদস্য অ্যাপের প্রতিটি রুট সত্যিই রেন্ডার হয় কি না
   ১) tools/smoke-entry.js-কে esbuild দিয়ে Node-উপযোগী CJS বান্ডলে পরিণত করে
   ২) বান্ডলটি চালায় — প্রতিটি রুটের HTML-এ শিরোনাম ও কনটেন্ট থাকতে হবে
   চালান: node tools/render-smoke.mjs   (ফেল করলে exit 1)
   ============================================================ */

import { build } from 'esbuild';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdirSync } from 'node:fs';

const HERE = dirname(fileURLToPath(import.meta.url));
/* বান্ডল app/ ভেতরে রাখা হয় যাতে react/react-dom node_modules থেকে রিজলভ হয় */
const OUT_DIR = join(HERE, '..', 'node_modules', '.cache');
mkdirSync(OUT_DIR, { recursive: true });
const OUT = join(OUT_DIR, `somobay-smoke-${process.pid}.cjs`);

await build({
  entryPoints: [join(HERE, 'smoke-entry.js')],
  bundle: true,
  format: 'cjs',
  platform: 'node',
  outfile: OUT,
  external: ['react', 'react-dom'],
  logLevel: 'warning',
});

const r = spawnSync(process.execPath, [OUT], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
process.stdout.write(r.stdout || '');
process.stderr.write(r.stderr || '');
process.exit(r.status ?? 1);
