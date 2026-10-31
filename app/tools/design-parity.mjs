#!/usr/bin/env node
/* ============================================================
   design-parity.mjs — প্রোটোটাইপ বনাম অ্যাপ ডিজাইন অডিট
   ব্যবহার: node tools/design-parity.mjs [--csv reports/...]
   চেক: (১) টোকেন মান হুবহু, (২) কাঁচা hex/ফন্ট ওভাররাইড নেই,
         (৩) অপরিচিত Tailwind প্যালেট নেই, (৪) ট্যাপ টার্গেট,
         (৫) কম্পোনেন্ট স্পেক (.card/.btn/.chip/.inp/.kpi/.tbl)।
   ============================================================ */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const APP = path.join(ROOT, 'app');
const read = (p) => fs.readFileSync(p, 'utf8');

/* ---------- ১. টোকেন ---------- */
function tokens(css) {
  const m = new Map();
  for (const [, n, v] of css.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) m.set(n, v.trim());
  return m;
}
const protoTok = tokens(read(path.join(ROOT, 'prototype/assets/ui.css')));
const appTok = tokens(read(path.join(APP, 'src/styles/tokens.css')));
const shared = [...protoTok.keys()].filter((k) => appTok.has(k));
const mismatched = shared.filter((k) => protoTok.get(k) !== appTok.get(k));

/* ---------- ২. সোর্স স্ক্যান ---------- */
const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(tsx|ts|css)$/.test(e.name)) files.push(p);
  }
})(path.join(APP, 'src'));

const HEX = /#[0-9a-fA-F]{3,8}\b/;
const NONLATIN = /[\u0900-\u0963\u0965-\u097F\u0600-\u06FF\u0C00-\u0C7F\uAC00-\uD7AF]/;
const ALLOWED_PX = new Set([10, 11, 13, 15, 21, 29, 30, 32]); // প্রোটোটাইপে ব্যবহৃত ফন্ট-সাইজ
const PALETTE = /\b(?:bg|text|border|from|via|to|ring|fill|stroke)-([a-z]+)-(\d{2,3})\b/g;
const allowed = new Set([...appTok.keys()].filter((k) => k.startsWith('color-')).map((k) => k.slice(6)));
const unknownPalette = new Map();
const rows = [];

for (const f of files) {
  const rel = path.relative(APP, f);
  if (rel === 'src/styles/tokens.css') continue; // টোকেন ফাইলে hex স্বাভাবিক
  const src = read(f);
  const lines = src.split('\n');
  const hex = lines.filter((l) => HEX.test(l)).length;
  const nl = lines.filter((l) => NONLATIN.test(l)).length;
  const font = (src.match(/font-family\s*:|fontFamily|font-\['/g) || []).length;
  const arbRadius = (src.match(/rounded-\[[^\]]+\]/g) || []).length;
  const arbSizes = [...src.matchAll(/text-\[(\d+)px\]/g)].map((m) => Number(m[1]));
  const arbText = arbSizes.length;
  const oddSizes = arbSizes.filter((n) => !ALLOWED_PX.has(n));
  for (const [, name, shade] of src.matchAll(PALETTE)) {
    const key = `${name}-${shade}`;
    if (!allowed.has(key) && !['white', 'black', 'transparent', 'current'].includes(name)) {
      unknownPalette.set(key, (unknownPalette.get(key) || 0) + 1);
    }
  }
  const buttons = (src.match(/<button/g) || []).length;
  let unsafeBtns = 0;
  for (let i = 0; i < src.length; i++) {
    if (!src.startsWith('<button', i)) continue;
    const win = src.slice(i, i + 320);
    if (!/min-h-|s-btn|s-chip/.test(win)) unsafeBtns++;
  }
  const tables = (src.match(/<table/g) || []).length;
  if (oddSizes.length) console.log('ODD_FONT_SIZE', rel, oddSizes.join(','));
  if (/apps\//.test(rel)) rows.push({ file: rel, hex, nl, font, arbRadius, arbText, buttons, unsafeBtns, tables, bytes: src.length });
}

/* ---------- ৩. কম্পোনেন্ট স্পেক ---------- */
const esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function decl(css, cls, prop) {
  const block = css.match(new RegExp(`${esc(cls)}\\s*\\{([^}]*)\\}`));
  if (!block) return null;
  const m = block[1].match(new RegExp(`(?:^|;)\\s*${esc(prop)}\\s*:\\s*([^;]+)`));
  return m ? m[1].trim() : null;
}
const protoUi = read(path.join(ROOT, 'prototype/assets/ui.css'));
const ds = read(path.join(APP, 'src/styles/ds.css'));
const SPECS = [
  ['কার্ড রেডিয়াস', '.card', 'border-radius', '.s-card', 'border-radius'],
  ['কার্ড ছায়া', '.card', 'box-shadow', '.s-card', 'box-shadow'],
  ['বোতাম রেডিয়াস', '.btn', 'border-radius', '.s-btn', 'border-radius'],
  ['বোতাম উচ্চতা', '.btn', 'min-height', '.s-btn', 'min-height'],
  ['বোতাম ফন্ট', '.btn', 'font-size', '.s-btn', 'font-size'],
  ['বোতাম প্যাডিং', '.btn', 'padding', '.s-btn', 'padding'],
  ['চিপ ফন্ট', '.chip', 'font-size', '.s-chip', 'font-size'],
  ['চিপ প্যাডিং', '.chip', 'padding', '.s-chip', 'padding'],
  ['ইনপুট রেডিয়াস', '.inp', 'border-radius', '.s-inp', 'border-radius'],
  ['ইনপুট বর্ডার', '.inp', 'border', '.s-inp', 'border'],
  ['KPI রেডিয়াস', '.kpi', 'border-radius', '.s-kpi', 'border-radius'],
  ['KPI প্যাডিং', '.kpi', 'padding', '.s-kpi', 'padding'],
  ['টেবিল ফন্ট', 'table.tbl', 'font-size', '.s-tbl', 'font-size'],
  ['টেবিল সেল প্যাডিং', 'table.tbl td', 'padding', '.s-tbl td', 'padding'],
];
const specs = SPECS.map(([label, pc, pp, dc, dp]) => {
  const pv = decl(protoUi, pc, pp);
  const dv = decl(ds, dc, dp);
  return { label, proto: pv, app: dv, ok: pv !== null && dv !== null && pv.replace(/\s/g, '') === dv.replace(/\s/g, '') };
});

/* ---------- ৪. রিপোর্ট ---------- */
const totalHex = rows.reduce((a, r) => a + r.hex, 0);
const totalNL = rows.reduce((a, r) => a + r.nl, 0);
const totalFont = rows.reduce((a, r) => a + r.font, 0);
const totalUnsafe = rows.reduce((a, r) => a + r.unsafeBtns, 0);
const specFail = specs.filter((s) => !s.ok);

console.log('TOKEN_PARITY', `${shared.length - mismatched.length}/${shared.length}`, mismatched.length ? `MISMATCH:${mismatched.slice(0, 5).join(',')}` : '');
console.log('COMPONENT_PARITY', `${specs.length - specFail.length}/${specs.length}`, specFail.map((s) => s.label).join(','));
console.log('SCREEN_FILES', rows.length, 'RAW_HEX', totalHex, 'NON_LATIN', totalNL, 'FONT_OVERRIDE', totalFont);
console.log('UNSAFE_RAW_BUTTONS', totalUnsafe, 'ARBITRARY_RADIUS', rows.reduce((a, r) => a + r.arbRadius, 0), 'ARBITRARY_FONT_PX', rows.reduce((a, r) => a + r.arbText, 0));
console.log('UNDEFINED_PALETTE', unknownPalette.size, [...unknownPalette.entries()].map(([k, v]) => `${k}×${v}`).join(','));

const csvIx = process.argv.indexOf('--csv');
if (csvIx > 0 && process.argv[csvIx + 1]) {
  const out = process.argv[csvIx + 1];
  const head = 'file,raw_hex,non_latin,font_override,arbitrary_radius,arbitrary_font_px,raw_buttons,unsafe_buttons,tables\n';
  fs.writeFileSync(out, head + rows.map((r) => [r.file, r.hex, r.nl, r.font, r.arbRadius, r.arbText, r.buttons, r.unsafeBtns, r.tables].join(',')).join('\n') + '\n');
  console.log('CSV_WRITTEN', out);
}

const ok = mismatched.length === 0 && specFail.length === 0 && totalHex === 0 && totalNL === 0 && totalFont === 0 && totalUnsafe === 0 && unknownPalette.size === 0;
console.log(ok ? 'DESIGN_PARITY_OK' : 'DESIGN_PARITY_FAIL');
process.exit(ok ? 0 : 1);
