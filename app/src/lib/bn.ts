/* ============================================================
   src/lib/bn.ts — সংখ্যা সবসময় বাংলা অঙ্কে (প্রোটোটাইপের নিয়ম)
   ============================================================ */

const DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

/** 1234 → ১২৩৪ ; null/undefined → '—' */
export function bn(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return String(value).replace(/[0-9]/g, (d) => DIGITS[Number(d)]);
}
