/* ============================================================
   নীতি D-01 — "সম্পূর্ণ সুদমুক্ত" (Zero-Interest Policy Engine)
   ------------------------------------------------------------
   ব্যবহারকারীর সিদ্ধান্ত (2026-10-31):
     • কোনো মডিউলে সুদ বা সুদ-সমতুল্য কিছু থাকবে না।
     • `profit_percentage` ও "X% মুনাফা" সম্পূর্ণ বাদ।
     • ঋণ পরিশোধে মূল বিতরণকৃত ঋণের বাইরে কোনো পূর্বনির্ধারিত অতিরিক্ত অর্থ,
       শতাংশভিত্তিক চার্জ বা বাধ্যতামূলক সুবিধা নেই।
     • বিদ্যমান ডেটা/স্কিম নষ্ট না করে আগে dependency ও migration impact দেখতে হবে।

   সীমা (ব্যবহারকারীর পৃথক উত্তর): **বিলম্ব ফি / জরিমানা অপরিবর্তিত থাকবে**।
   তাই `late_fee_amount`, `pending_fine`, `penalty_paid` এই নীতির আওতার বাইরে —
   এগুলো এখানে স্পর্শ করা হয় না, শুধু রিপোর্টে নথিভুক্ত করা হয়।

   এই মডিউলটি framework-নিরপেক্ষ (.mjs) — React UI, Node harness, দুই জায়গাতেই চলে।
   ============================================================ */

export const POLICY = Object.freeze({
  id: 'D-01',
  title: 'সম্পূর্ণ সুদমুক্ত নীতি',
  scope: 'all-modules',
  modules: ['general_savings', 'rosca', 'joint_goal', 'qard_hasanah'],
  bannedConcepts: [
    'নির্দিষ্ট হারে পূর্বঘোষিত মুনাফা/লভ্যাংশ (profit_percentage)',
    'ঋণের ওপর শতাংশভিত্তিক চার্জ',
    'মূল অর্থের বাইরে বাধ্যতামূলক অতিরিক্ত পরিশোধ (কর্জে হাসানা)',
  ],
  outOfScope: [
    'বিলম্ব ফি / জরিমানা (late_fee_amount, pending_fine, penalty_paid) — ব্যবহারকারীর সিদ্ধান্তে অপরিবর্তিত',
  ],
});

/** ডেটা-স্তরে নিষিদ্ধ ফিল্ড (কোনো মডিউলে) */
export const BANNED_FIELDS = Object.freeze([
  'profit_percentage',
  'profit_rate',
  'profitPercent',
  'interest',
  'interest_rate',
  'interestRate',
  'interest_amount',
  'riba',
  'riba_rate',
  'markup_percentage',
  'dividend_rate',
  'profit_share_percentage',
]);

/** শূন্যে বাঁধা ফিল্ড — মুছে ফেলা হয় না (স্কিমা ভাঙবে না), মান সবসময় ০ */
export const ZERO_LOCKED_FIELDS = Object.freeze(['profit_percentage']);

/** কপি/লেবেল-স্তরে নিষিদ্ধ শব্দ */
export const BANNED_TERMS = Object.freeze([
  { term: 'মুনাফা', severity: 'error' },
  { term: 'ইন্টারেস্ট', severity: 'error' },
  { term: 'interest', severity: 'error', caseSensitive: false },
  { term: 'রিবা', severity: 'error' },
  { term: 'riba', severity: 'error', caseSensitive: false },
  { term: 'ঋণের দাম', severity: 'error' },
  { term: 'সুদ', severity: 'error' },
  { term: 'লভ্যাংশ', severity: 'warn' }, // ⚠️ সিদ্ধান্ত বাকি (D-01c): সমবায় লভ্যাংশ = নীতিগত প্রশ্ন
  { term: 'dividend', severity: 'warn', caseSensitive: false },
]);

/**
 * নেতিবাচক/শূন্য-প্রসঙ্গ — এগুলো উপস্থিত থাকলে শব্দটি গ্রহণযোগ্য।
 * যেমন: "সুদমুক্ত", "কোনো সুদ নেই", "সুদ ৳০", "Interest-free", "Zero Interest"।
 */
export const ALLOW_TOKENS = Object.freeze([
  'মুক্ত', 'বিহীন', 'মুক্তি', 'নয়', 'নেই', 'নাই', 'হয় না', 'হবে না', 'যাবে না', 'পারে না', 'থাকে না',
  '৳০', 'শূন্য', 'ছাড়া', 'নিষিদ্ধ', 'প্রযোজ্য নয়', 'কোনো', 'নাস্তি', 'বাতির', 'বাতিল',
  'নিষ্ক্রিয়', 'বন্ধ', 'লকড', 'লক', '🔒', 'এড়ানো', 'গোপন', 'অনুপস্থিত', 'থাকবে না', 'রাখা যাবে না',
  'free', 'zero', 'no ', 'not ', 'never', 'ban', 'prohibit', 'without', 'নিরপেক্ষ',
  'disabled', 'deactivated', 'locked', 'avoid', 'removed', 'নিরুৎসাহিত',
  'হারাম', 'haram', 'অবৈধ', 'নিরুৎসাহিত করা',
]);

/** সরাসরি অনুমোদিত যৌগিক শব্দ (সুদ-এর আগে/পরে বসলে গ্রহণযোগ্য) */
export const ALLOW_COMPOUNDS = Object.freeze([
  'সুদমুক্ত', 'সুদবিহীন', 'সুদমুক্তি', 'সুদ নেই', 'সুদ নয়', 'সুদ ৳০', 'কোনো সুদ',
  'interest-free', 'interest free', 'zero interest', 'no interest', 'riba-free',
]);

const WINDOW_BEFORE = 46;
const WINDOW_AFTER = 62;
const BN_RANGE = '\\u0980-\\u09FF';

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

/**
 * শব্দ-সীমানা সচেতন রেগেক্স।
 *  • ASCII শব্দ: দুই পাশে ইংরেজি অক্ষর থাকলে মেলে না → 'nointerest'-এ 'interest' ধরা পড়ে না।
 *  • বাংলা শব্দ: ঠিক আগে বাংলা অক্ষর/চিহ্ন থাকলে মেলে না → 'পারিবারিক'-এ 'রিবা' ধরা পড়ে না।
 *    ('সুদের হার' ধরা পড়ে; 'সুদমুক্ত' পরের ধাপে ALLOW_COMPOUNDS দিয়ে বাদ পড়ে।)
 */
export function termRegex(term, caseSensitive) {
  const esc = escapeRe(term);
  if (/^[A-Za-z]+$/.test(term)) {
    return new RegExp(`(?<![A-Za-z])${esc}(?![A-Za-z])`, caseSensitive === false ? 'gi' : 'g');
  }
  return new RegExp(`(?<![${BN_RANGE}])${esc}`, 'g');
}

/**
 * কোনো টেক্সটে নিষিদ্ধ শব্দ খোঁজে (নেতিবাচক-প্রসঙ্গ সচেতন)।
 * @returns {Array<{term:string,severity:string,index:number,snippet:string,reason:string}>}
 */
export function scanText(text, { offset = 0, allowComments = true } = {}) {
  const s = String(text ?? '');
  const hay = s.toLowerCase();
  const hits = [];

  for (const { term, severity, caseSensitive } of BANNED_TERMS) {
    const re = termRegex(term, caseSensitive);
    const source = caseSensitive === false ? hay : s;
    let m;
    while ((m = re.exec(source)) !== null) {
      const i = m.index;

      // ০) ASCII শব্দ কোনো identifier-এর অংশ হলে (যেমন CSS ক্লাস `.qh-riba`, key `nointerest`)
      //    সেটি ব্যবহারকারীর কপি নয় → বাদ
      if (/^[A-Za-z]+$/.test(term)) {
        const prevChar = s[i - 1] || '';
        if (prevChar === '-' || prevChar === '_' || prevChar === '.') continue;
      }

      // ১) সরাসরি অনুমোদিত যৌগিক শব্দ (সুদমুক্ত / interest-free …)
      const near = hay.slice(Math.max(0, i - 14), i + term.length + 14);
      if (ALLOW_COMPOUNDS.some((c) => near.includes(c.toLowerCase()))) continue;

      // ২) আশপাশের প্রসঙ্গে নেতিবাচক/শূন্য টোকেন
      const win = hay.slice(Math.max(0, i - WINDOW_BEFORE), i + term.length + WINDOW_AFTER);
      if (ALLOW_TOKENS.some((t) => win.includes(t.toLowerCase()))) continue;

      // ৩) নীতি-বিবরণী কমেন্ট (যেমন "-- D-01: no profit_percentage")
      if (allowComments) {
        const lineStart = s.lastIndexOf('\n', i) + 1;
        const lineEnd = s.indexOf('\n', i);
        const line = s.slice(lineStart, lineEnd === -1 ? s.length : lineEnd);
        if (/^\s*(\/\/|\/\*|\*|#|--|<!--)/.test(line) && /(নীতি|policy|ban|নিষিদ্ধ|zero|শূন্য|must not|never|D-01)/i.test(line)) continue;
      }

      hits.push({
        term,
        severity,
        index: i + offset,
        snippet: s.slice(Math.max(0, i - 30), i + term.length + 30).replace(/\s+/g, ' '),
        reason: 'D-01: নিষিদ্ধ সুদ/মুনাফা পরিভাষা (নেতিবাচক প্রসঙ্গ ছাড়া)',
      });
      if (re.lastIndex === i) re.lastIndex += 1;
    }
  }
  return hits;
}

/**
 * একটি রেকর্ড/পে-লোডে নিষিদ্ধ ফিল্ড আছে কিনা দেখে।
 * ZERO_LOCKED_FIELDS থাকলে মান ০ হতে হবে — অন্যথায় violation।
 */
export function validateRecord(record, { label = 'record' } = {}) {
  const out = [];
  if (!record || typeof record !== 'object') return out;
  for (const key of Object.keys(record)) {
    const banned = BANNED_FIELDS.find((f) => f.toLowerCase() === key.toLowerCase());
    if (!banned) continue;
    const value = record[key];
    const numeric = Number(value);
    const isZeroLocked = ZERO_LOCKED_FIELDS.some((f) => f.toLowerCase() === key.toLowerCase());
    if (isZeroLocked && (value === null || value === undefined || Number.isFinite(numeric) && numeric === 0)) {
      continue; // ০ = নীতি মেনে চলে
    }
    out.push({
      field: key,
      value,
      label,
      severity: 'error',
      reason: isZeroLocked
        ? `D-01: ${key} অবশ্যই ০ হতে হবে (পাওয়া গেছে ${String(value)})`
        : `D-01: ${key} ফিল্ডটি নিষিদ্ধ — কোনো সুদ/মুনাফা ফিল্ড রাখা যাবে না`,
    });
  }
  return out;
}

/**
 * প্ল্যান/স্কিম পে-লোড পরিষ্কার করে: নিষিদ্ধ ফিল্ড বাদ, শূন্য-লকড ফিল্ড ০-এ বাঁধা।
 * বিদ্যমান ফিল্ডের কাঠামো ভাঙে না (স্কিমা পরিবর্তন ছাড়াই নিরাপদ)।
 * বিলম্ব ফি সম্পর্কিত কোনো ফিল্ড স্পর্শ করে না।
 */
export function sanitizePlanPayload(payload, { strict = true } = {}) {
  const src = { ...(payload || {}) };
  const removed = [];
  const violations = [];

  for (const key of Object.keys(src)) {
    const banned = BANNED_FIELDS.find((f) => f.toLowerCase() === key.toLowerCase());
    if (!banned) continue;
    const zeroLocked = ZERO_LOCKED_FIELDS.some((f) => f.toLowerCase() === key.toLowerCase());
    if (zeroLocked) {
      const v = Number(src[key]);
      if (Number.isFinite(v) && v !== 0) violations.push({ field: key, value: src[key], severity: 'error', reason: `D-01: ${key} ০ ছাড়া অন্য মান গ্রহণযোগ্য নয়` });
      src[key] = 0;
    } else {
      const val = src[key];
      removed.push({ field: key, value: val });
      delete src[key];
      if (strict && Number(val) !== 0) {
        violations.push({ field: key, value: val, severity: 'error', reason: `D-01: ${key} নিষিদ্ধ ফিল্ড (মান ${val}) — সরানো হয়েছে` });
      }
    }
  }

  // শূন্য-লকড ফিল্ড না থাকলেও ০ বসিয়ে দেওয়া হয়, যাতে DB CHECK constraint-এর সঙ্গে সামঞ্জস্য থাকে
  for (const f of ZERO_LOCKED_FIELDS) if (!(f in src)) src[f] = 0;

  return { payload: src, removed, violations, compliant: violations.length === 0 };
}

/**
 * কর্জে হাসানা পরিশোধ যাচাই (D-01 এর QH অংশ):
   পরিশোধযোগ্য = মূল ঋণ − ইতোমধ্যে পরিশোধিত। এর বেশি কিছুই নয়।
 * @returns {{ok:boolean, outstanding:number, reason?:string}}
 */
export function qardRepaymentCheck({ principal, totalRepaid = 0, amount }) {
  const p = Number(principal) || 0;
  const r = Number(totalRepaid) || 0;
  const a = Number(amount);
  const outstanding = Math.max(0, p - r);
  if (!Number.isFinite(a) || a <= 0) return { ok: false, outstanding, reason: 'পরিশোধের অর্থ সঠিক নয়' };
  if (a > outstanding) {
    return { ok: false, outstanding, reason: `D-01: মূল ঋণের বাইরে অতিরিক্ত অর্থ (৳${outstanding} বাকি থাকতে ৳${a}) গ্রহণযোগ্য নয়` };
  }
  return { ok: true, outstanding: outstanding - a };
}

/**
 * কিস্তি তালিকা যাচাই: সব কিস্তির সমষ্টি অবশ্যই মূল ঋণের সমান হতে হবে —
 এক paisa বেশি নয় (কোনো সুদ/চার্জ যুক্ত হতে পারবে না)।
 */
export function assertScheduleEqualsPrincipal({ principal, instalments }) {
  const total = (instalments || []).reduce((s, x) => s + (Number(x.amount) || 0), 0);
  const p = Number(principal) || 0;
  return {
    ok: total === p,
    principal: p,
    scheduleTotal: total,
    difference: total - p,
    reason: total === p ? null : `D-01: কিস্তির সমষ্টি (৳${total}) মূল ঋণের (৳${p}) সমান নয় — পার্থক্য ৳${total - p}`,
  };
}

export default {
  POLICY, BANNED_FIELDS, ZERO_LOCKED_FIELDS, BANNED_TERMS, ALLOW_TOKENS, ALLOW_COMPOUNDS,
  scanText, validateRecord, sanitizePlanPayload, qardRepaymentCheck, assertScheduleEqualsPrincipal,
};
