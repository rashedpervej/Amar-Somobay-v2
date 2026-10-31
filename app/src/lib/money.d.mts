/* src/lib/money.d.mts — অর্থ/অঙ্ক সহায়ক টাইপ ঘোষণা (বাস্তবায়ন money.mjs-এ) */

export function bn(value: unknown): string;
export function tk(paisa: number | string): string;
export function tkFromTaka(taka: number | string): string;
export function money(paisa: number | string): string;
export function moneyTaka(taka: number | string): string;
export function findLatinDigitLeaks(text: string): Array<{ kind: 'currency' | 'classifier'; index: number; text: string }>;

declare const _default: {
  bn: typeof bn;
  tk: typeof tk;
  tkFromTaka: typeof tkFromTaka;
  money: typeof money;
  moneyTaka: typeof moneyTaka;
  findLatinDigitLeaks: typeof findLatinDigitLeaks;
};
export default _default;
