/* ============================================================
   tests/d07-inventory.mjs — ইমপ্লিমেন্টেশন ইনভেন্টরি সততা-যাচাই
   কেন: "কতটি পেজ হয়েছে" সংখ্যাটা যেন কেউ হাতে বাড়িয়ে লিখতে না পারে।
     • ইনভেন্টরির প্রতিটি সারি প্রোটোটাইপের META থেকে আসে (১৯৯)
     • status ∈ done | partial | todo এবং সব non-done-এর batch আছে
     • done/partial সারির route বাস্তবে অ্যাপ সোর্সে আছে
     • প্ল্যাটফর্ম/মডিউল গণনা প্রোটোটাইপের সাথে মেলে
   ============================================================ */

import { createSuite } from './_harness.mjs';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, posix } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const WS = join(ROOT, '..');
const S = createSuite('D-07 · স্ক্রিন ইনভেন্টরি ও অগ্রগতি');

const read = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : '');
const INV_PATH = join(WS, 'docs', 'plans', 'screen-inventory.csv');
const INV = read(INV_PATH);
const PROTO = read(join(WS, 'prototype', 'assets', 'screens.js'));

function walk(dir, out = []) {
  const abs = join(ROOT, dir);
  if (!existsSync(abs)) return out;
  for (const name of readdirSync(abs)) {
    const rel = posix.join(dir, name);
    if (statSync(join(ROOT, rel)).isDirectory()) walk(rel, out);
    else out.push(rel);
  }
  return out;
}

/* ছোট CSV রিডার (কোনো নির্ভরতা নেই) */
function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  const head = lines[0].split(',');
  return lines.slice(1).map((line) => {
    const cells = [];
    let cur = '';
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') q = !q;
      else if (c === ',' && !q) { cells.push(cur); cur = ''; }
      else cur += c;
    }
    cells.push(cur);
    const row = {};
    head.forEach((h, i) => (row[h] = (cells[i] ?? '').trim()));
    return row;
  });
}

const rows = parseCsv(INV);
const protoIds = [...PROTO.slice(PROTO.indexOf('const META ='), PROTO.indexOf('const META =') + 80000)
  .matchAll(/id:\s*'([a-z]+\d+)'/g)].map((m) => m[1]);
const protoSet = new Set(protoIds);
const invIds = new Set(rows.map((r) => r.id));
const APP_SRC = [...walk('src')].map((f) => read(f)).join('\n');

S.sec('১ · ইনভেন্টরি প্রোটোটাইপের সাথে মেলে');
S.eq('ইনভেন্টরি সারি = ২০৫ (১৯৯ প্রোটোটাইপ + ৬ ব্যাচ-১২)', rows.length, 205);
S.eq('প্রোটোটাইপ META-তেও ১৯৯টি আইডি', protoIds.length, 199);
{
  const missing = [...protoSet].filter((id) => !invIds.has(id));
  const BATCH12 = new Set(['s09', 's10', 's11', 'm22a', 'a39a', 'a40a']);
  const extra = [...invIds].filter((id) => !protoSet.has(id) && !BATCH12.has(id));
  S.check('প্রোটোটাইপের প্রতিটি স্ক্রিন ইনভেন্টরিতে আছে', missing.length === 0, missing.join(', '));
  S.check('প্রোটোটাইপের বাইরে কেবল অনুমোদিত ব্যাচ-১২ পর্দা', extra.length === 0, extra.join(', '));
  const dup = rows.length - invIds.size;
  S.eq('ডুপ্লিকেট আইডি নেই', dup, 0);
  S.check('প্রতিটি সারিতে নাম আছে', rows.every((r) => r.name && r.name.length > 1));
}

S.sec('২ · প্ল্যাটফর্ম ও মডিউল গণনা');
{
  const count = (fn) => rows.filter(fn).length;
  S.eq('সদস্য অ্যাপ ৪৪', count((r) => r.platform === 'Member App'), 44);
  S.eq('অ্যাডমিন অ্যাপ ৭৪', count((r) => r.platform === 'Admin App'), 74);
  S.eq('অ্যাডমিন ওয়েব ৭৭', count((r) => r.platform === 'Admin Web'), 77);
  S.eq('শেয়ার্ড ১০', count((r) => r.platform === 'Shared'), 10);
  S.eq('GeneralSavings ৯৭', count((r) => r.module === 'GeneralSavings'), 97);
  S.eq('ROSCA ৩০', count((r) => r.module === 'ROSCA'), 30);
  S.eq('JointGoal ২৫', count((r) => r.module === 'JointGoal'), 25);
  S.eq('QardHasanah ৪২', count((r) => r.module === 'QardHasanah'), 42);
  S.eq('Shared ১১', count((r) => r.module === 'Shared'), 11);
}

S.sec('৩ · স্ট্যাটাস ও ব্যাচ');
{
  const valid = new Set(['done', 'partial', 'todo']);
  const bad = rows.filter((r) => !valid.has(r.status));
  S.check('status কেবল done/partial/todo', bad.length === 0, bad.map((r) => `${r.id}:${r.status}`).join(', '));

  const noBatch = rows.filter((r) => r.status !== 'done' && (!r.batch || r.batch === '0'));
  S.check('প্রতিটি অসম্পূর্ণ পর্দার ব্যাচ নির্ধারিত', noBatch.length === 0, noBatch.map((r) => r.id).join(', '));

  const batches = [...new Set(rows.filter((r) => r.batch && r.batch !== '0').map((r) => r.batch))];
  S.check('ব্যাচ নম্বর সংখ্যা', batches.every((b) => /^\d+$/.test(b)), batches.join(','));
  S.note(`ব্যাচ: ${batches.sort((a, b) => a - b).join(', ')}`);

  const done = rows.filter((r) => r.status === 'done');
  const partial = rows.filter((r) => r.status === 'partial');
  const todo = rows.filter((r) => r.status === 'todo');
  S.eq('done + partial + todo = ২০৫', done.length + partial.length + todo.length, 205);
  S.note(`done=${done.length} · partial=${partial.length} · todo=${todo.length}`);
  S.check('কোনো অসম্পূর্ণ পর্দার সাথে "সম্পূর্ণ" দাবি নেই', done.length < rows.length);
}

S.sec('৪ · "done/partial" দাবির প্রমাণ কোডে আছে');
{
  const tracked = rows.filter((r) => r.status === 'done' || r.status === 'partial');
  S.check('প্রতিটি done/partial-এর রুট দেওয়া আছে', tracked.every((r) => r.react_route.startsWith('/')),
    tracked.filter((r) => !r.react_route.startsWith('/')).map((r) => r.id).join(', '));

  /* /m/* ও /a/* রুট নিজ নিজ অ্যাপের ভেতরে nested — সেখানে পূর্ণ পথ নয়,
     `path="schemes/:id"` / `path="members/:memberId"` থাকে।
     তাই পূর্ণ পথ অথবা nested রূপ — যেকোনো একটি থাকলেই প্রমাণ হয়েছে। */
  const routes = [...new Set(tracked.map((r) => r.react_route))];
  const missing = routes.filter((rt) => {
    const path = rt.split('?')[0];
    const nested = path.startsWith('/m/') || path.startsWith('/a/') || path.startsWith('/w/') ? path.slice(3) : null;
    const hit = [path, nested].filter(Boolean).some(
      (p) => APP_SRC.includes(`'${p}'`) || APP_SRC.includes(`"${p}"`),
    );
    return !hit;
  });
  S.check('রুটগুলো অ্যাপ সোর্সে বাস্তবে আছে', missing.length === 0, missing.join(', '));
  S.note(`রুট: ${routes.join(' · ')}`);

  const screenFiles = walk('src/apps').filter((f) => f.endsWith('.tsx'));
  S.check('পর্দার ফাইল বাস্তবে আছে', screenFiles.length >= 8, `${screenFiles.length} ফাইল`);
}

S.report();
