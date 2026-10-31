/* ============================================================
   tests/d03-design-tokens.mjs
   ডিজাইন সিস্টেম parity — প্রোটোটাইপ (চূড়ান্ত ডিজাইন ভিত্তি) বনাম নতুন app/ টোকেন
   নিয়ম: প্রোটোটাইপের কোনো টোকেন মান এখানে বদলানো যাবে না।
   ============================================================ */

import { createSuite } from './_harness.mjs';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { scanText } from '../src/lib/noInterest.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const WORKSPACE = join(ROOT, '..');
const S = createSuite('D-03 · ডিজাইন সিস্টেম টোকেন parity');

/** CSS টেক্সট থেকে নির্দিষ্ট সিলেক্টর ব্লকের --token:value ম্যাপ */
function parseTokens(css, selectorRe) {
  const out = {};
  const re = selectorRe;
  let m;
  while ((m = re.exec(css)) !== null) {
    const start = css.indexOf('{', m.index);
    if (start === -1) continue;
    let depth = 0;
    let end = start;
    for (let i = start; i < css.length; i++) {
      if (css[i] === '{') depth++;
      else if (css[i] === '}') { depth--; if (depth === 0) { end = i; break; } }
    }
    const body = css.slice(start + 1, end).replace(/\/\*[\s\S]*?\*\//g, ' ');
    for (const decl of body.split(';')) {
      const mm = /^\s*(--[a-z0-9-]+)\s*:\s*([\s\S]+?)\s*$/i.exec(decl);
      if (mm) out[mm[1]] = mm[2].replace(/\s+/g, ' ').trim();
    }
  }
  return out;
}

const protoPath = join(WORKSPACE, 'prototype', 'assets', 'ui.css');
const skinsPath = join(WORKSPACE, 'prototype', 'assets', 'skins.css');
const appTokensPath = join(ROOT, 'src', 'styles', 'tokens.css');
const appBasePath = join(ROOT, 'src', 'styles', 'base.css');

if (!existsSync(protoPath) || !existsSync(appTokensPath)) {
  S.note('প্রোটোটাইপ বা app টোকেন ফাইল পাওয়া যায়নি — parity টেস্ট চালানো যাচ্ছে না');
  S.check('টোকেন ফাইল উপস্থিত', false);
  S.report();
} else {
  const protoCss = readFileSync(protoPath, 'utf8');
  const appCss = readFileSync(appTokensPath, 'utf8');
  const skinsCss = existsSync(skinsPath) ? readFileSync(skinsPath, 'utf8') : '';

  const protoTokens = parseTokens(protoCss, /:root\s*\{/g);
  const appTokens = parseTokens(appCss, /:root\s*\{/g);
  const protoQhTheme = parseTokens(skinsCss, /\[data-theme="qh"\]\s*\{/g);
  const appQhTheme = parseTokens(appCss, /\[data-theme="qh"\]\s*\{/g);
  const skinsQhRoot = Object.fromEntries(Object.entries(parseTokens(skinsCss, /:root\s*\{/g)).filter(([k]) => k.startsWith('--qh-')));

  /* Phase 2-এ (কর্জে হাসানা মডিউল) পোর্ট হবে — এখন ইচ্ছাকৃতভাবে বাকি */
  const DEFERRED = ['--mod-pattern', '--mod-pattern-inv', '--mod-pattern-2', '--mod-pattern-2-inv'];

  S.sec('১ · :root টোকেন parity (প্রোটোটাইপ → app)');
  S.check('প্রোটোটাইপ :root টোকেন পাওয়া গেছে', Object.keys(protoTokens).length > 30, `${Object.keys(protoTokens).length}টি`);
  S.note(`প্রোটোটাইপ টোকেন ${Object.keys(protoTokens).length}টি · app টোকেন ${Object.keys(appTokens).length}টি`);

  const missing = Object.keys(protoTokens).filter((k) => !(k in appTokens));
  S.eq('প্রোটোটাইপের কোনো টোকেন বাদ পড়েনি', missing.length, 0);
  if (missing.length) S.note('বাদ: ' + missing.join(', '));

  const drifted = Object.keys(protoTokens).filter((k) => k in appTokens && appTokens[k] !== protoTokens[k]);
  S.eq('কোনো টোকেনের মান বদলায়নি (ডিজাইন ড্রিফট ০)', drifted.length, 0);
  drifted.forEach((k) => S.note(`${k}: প্রোটোটাইপ "${protoTokens[k]}" vs app "${appTokens[k]}"`));

  S.sec('২ · মূল ডিজাইন মান অপরিবর্তিত (spot check)');
  const EXPECT = {
    '--green-700': '#0B6B53', '--green-500': '#12A273', '--lime': '#C9F26E',
    '--paper': '#F4F7F5', '--card': '#FFFFFF', '--line': '#E2EAE6', '--txt': '#0E211A', '--mut': '#63796F',
    '--r-sm': '12px', '--r-md': '16px', '--r-lg': '22px', '--r-xl': '28px', '--r-pill': '999px',
    '--fs-h1': '26px', '--fs-body': '16px', '--fs-sm': '14px', '--fs-xs': '12px', '--lh': '1.62',
    '--tap': '48px', '--tap-lg': '54px',
    '--ok': '#0F8A5F', '--warn': '#B26A00', '--danger': '#C63F35', '--info': '#1E6FB8',
  };
  for (const [k, v] of Object.entries(EXPECT)) {
    S.eq(`${k} = ${v}`, appTokens[k], v);
  }
  S.check('বাংলা-প্রথম ফন্ট স্ট্যাক অক্ষত', /Hind Siliguri/.test(appTokens['--ff'] || '') && /Noto Sans Bengali/.test(appTokens['--ff'] || ''));
  S.check('সংখ্যার ফন্ট আলাদা টোকেনে আছে', Boolean(appTokens['--ff-num']));

  S.sec('৩ · কর্জে হাসানা থিম ([data-theme="qh"])');
  const qhMissing = Object.keys(protoQhTheme).filter((k) => !DEFERRED.includes(k) && !(k in appQhTheme));
  S.eq('QH থিমের রঙ টোকেন বাদ পড়েনি (প্যাটার্ন ছাড়া)', qhMissing.length, 0);
  if (qhMissing.length) S.note('বাদ: ' + qhMissing.join(', '));
  const qhDrift = Object.keys(protoQhTheme).filter((k) => k in appQhTheme && appQhTheme[k] !== protoQhTheme[k]);
  S.eq('QH থিমের কোনো মান বদলায়নি', qhDrift.length, 0);
  const skinsMissing = Object.keys(skinsQhRoot).filter((k) => !(k in appTokens));
  S.eq('skins.css-এর --qh-* স্থির প্যালেট পোর্ট হয়েছে', skinsMissing.length, 0);
  if (skinsMissing.length) S.note('বাদ: ' + skinsMissing.join(', '));
  S.eq('ইচ্ছাকৃতভাবে স্থগিত টোকেন (Phase 2-এ পোর্ট হবে)', DEFERRED.filter((k) => !(k in appQhTheme)).length, DEFERRED.length);
  S.check('সোনালি টেক্সট রঙ (AA) পোর্ট হয়েছে', appTokens['--qh-gold-deep'] === '#7E6410');

  S.sec('৪ · Tailwind v4 ম্যাপিং');
  const themeBlock = /@theme inline\s*\{([\s\S]*?)\n\}/.exec(appCss);
  S.check('@theme inline ব্লক আছে', Boolean(themeBlock));
  if (themeBlock) {
    const refs = [...themeBlock[1].matchAll(/var\((--[a-z0-9-]+)\)/gi)].map((m) => m[1]);
    const all = { ...appTokens, ...appQhTheme };
    const dangling = [...new Set(refs)].filter((r) => !(r in all));
    S.eq('ম্যাপিং-এ ঝুলন্ত var() নেই', dangling.length, 0);
    if (dangling.length) S.note('ঝুলন্ত: ' + dangling.join(', '));
    S.check('রঙ ম্যাপ করা হয়েছে (--color-*)', /--color-brand/.test(themeBlock[1]) && /--color-danger/.test(themeBlock[1]));
    S.check('রেডিয়াস ম্যাপ করা হয়েছে (--radius-r-*)', /--radius-r-md/.test(themeBlock[1]));
    S.check('টাইপ স্কেল ম্যাপ করা হয়েছে (--text-*)', /--text-h1/.test(themeBlock[1]) && /--text-body/.test(themeBlock[1]));
    S.check('ফন্ট ম্যাপ করা হয়েছে (--font-sans)', /--font-sans/.test(themeBlock[1]));
    S.check('শ্যাডো ম্যাপ করা হয়েছে (--shadow-*)', /--shadow-sh-2/.test(themeBlock[1]));
    S.check('Tailwind-এর ডিফল্ট রেডিয়াস নাম (rounded-md=6px) ওভাররাইড করা হয়েছে', /--radius-r-md:\s*var\(--r-md\)/.test(themeBlock[1]));
    S.note(`মোট Tailwind ম্যাপিং = ${refs.length}টি var() রেফারেন্স`);
  }

  S.sec('৫ · base.css শৃঙ্খলা');
  if (existsSync(appBasePath)) {
    const base = readFileSync(appBasePath, 'utf8');
    const hexes = [...base.matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map((m) => m[0]);
    S.eq('base.css-এ কাঁচা hex রঙ নেই (সব টোকেন থেকে)', hexes.length, 0);
    if (hexes.length) S.note(hexes.join(', '));
    S.check('পৃষ্ঠতল টোকেন ব্যবহৃত', /var\(--paper\)/.test(base));
    S.check('টেক্সট টোকেন ব্যবহৃত', /var\(--txt\)/.test(base));
    S.check('ন্যূনতম ট্যাপ টার্গেট টোকেন ব্যবহৃত', /var\(--tap\)/.test(base));
    S.check('বাংলা ফন্ট টোকেন ব্যবহৃত', /var\(--ff\)/.test(base));
    S.check('reduced-motion সম্মানিত', /prefers-reduced-motion/.test(base));
    S.check('focus-visible স্টাইল আছে', /:focus-visible/.test(base));
  } else {
    S.check('base.css উপস্থিত', false);
  }

  S.sec('৬ · ডিজাইন ফাইলে D-01 ভাষা');
  const styleHits = [appTokensPath, appBasePath].filter(existsSync)
    .flatMap((f) => scanText(readFileSync(f, 'utf8')).filter((h) => h.severity === 'error'));
  S.eq('ডিজাইন সিস্টেম ফাইলে সুদ/মুনাফা ভাষা নেই', styleHits.length, 0);
}

S.report();
