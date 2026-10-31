/* ============================================================
   Somobay — Money helpers (Phase 1)
   নীতি: প্রোটোটাইপের অঙ্ক = paisa (১ টাকা = ১০০ paisa)।
   UI-তে সবসময় বাংলা অঙ্ক। Latin digit দেখানো নিষেধ।
   ============================================================ */

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

/** Latin digit string → Bangla digit string */
export function bn(value) {
  return String(value ?? '').replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
}

/** paisa → formatted taka with Bangla digits, e.g. 187500 → "১,৮৭৫" */
export function tk(paisa) {
  const n = Math.round(Number(paisa) || 0) / 100;
  return bn(group(n));
}

/** taka (already taka) → Bangla grouped string */
export function tkFromTaka(taka) {
  return bn(group(Number(taka) || 0));
}

/** "৳১,৮৭৫" */
export function money(paisa) {
  return '৳' + tk(paisa);
}

export function moneyTaka(taka) {
  return '৳' + tkFromTaka(taka);
}

function group(n) {
  const neg = n < 0;
  const fixed = Math.abs(n);
  const isInt = Number.isInteger(fixed);
  // Bangladeshi grouping: 1,00,000
  const [intPart, decPart] = String(isInt ? fixed : fixed.toFixed(2)).split('.');
  let out = intPart;
  if (intPart.length > 3) {
    const head = intPart.slice(0, -3);
    const tail = intPart.slice(-3);
    out = head.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + tail;
  }
  const s = decPart ? `${out}.${decPart}` : out;
  return (neg ? '-' : '') + s;
}

/** কোনো Latin digit + বাংলা classifier মিশে গেছে কিনা (প্রোটোটাইপের MC-16 নিয়ম) */
export function findLatinDigitLeaks(text) {
  const out = [];
  const re1 = /৳\s*[0-9]/g;
  const re2 = /(?<![A-Za-z0-9\-#./:])[0-9]+\s*(?:টি|দিন|মাস|জন|বার|গুণ|শতাংশ|বছর)/g;
  let m;
  while ((m = re1.exec(String(text)))) out.push({ kind: 'currency', index: m.index, text: m[0] });
  while ((m = re2.exec(String(text)))) out.push({ kind: 'classifier', index: m.index, text: m[0] });
  return out;
}

export default { bn, tk, tkFromTaka, money, moneyTaka, findLatinDigitLeaks };
