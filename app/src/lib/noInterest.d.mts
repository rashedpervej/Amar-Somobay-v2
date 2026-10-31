/* src/lib/noInterest.d.mts — D-01 নীতি ইঞ্জিনের টাইপ ঘোষণা (বাস্তবায়ন noInterest.mjs-এ) */

export interface PolicyViolation {
  field?: string;
  value?: unknown;
  label?: string;
  severity: 'error' | 'warn';
  reason: string;
}

export interface SanitizeResult<T = Record<string, unknown>> {
  payload: T & { profit_percentage: number };
  removed: Array<{ field: string; value: unknown }>;
  violations: PolicyViolation[];
  compliant: boolean;
}

export interface TextHit {
  term: string;
  severity: 'error' | 'warn';
  index: number;
  snippet: string;
  reason: string;
}

export interface ScanFinding {
  file: string;
  line: number;
  kind: 'copy' | 'field';
  term: string;
  severity: 'error' | 'warn';
  text: string;
  reason: string;
}

export const POLICY: Readonly<{
  id: string;
  title: string;
  scope: string;
  modules: string[];
  bannedConcepts: string[];
  outOfScope: string[];
}>;

export const BANNED_FIELDS: readonly string[];
export const ZERO_LOCKED_FIELDS: readonly string[];
export const BANNED_TERMS: ReadonlyArray<{ term: string; severity: 'error' | 'warn'; caseSensitive?: boolean }>;
export const ALLOW_TOKENS: readonly string[];
export const ALLOW_COMPOUNDS: readonly string[];

export function termRegex(term: string, caseSensitive?: boolean): RegExp;

export function scanText(text: string, opts?: { offset?: number; allowComments?: boolean }): TextHit[];

export function validateRecord(record: unknown, opts?: { label?: string }): PolicyViolation[];

export function sanitizePlanPayload<T extends Record<string, any>>(payload: T, opts?: { strict?: boolean }): SanitizeResult<T>;

export function qardRepaymentCheck(o: {
  principal: number;
  totalRepaid?: number;
  amount: number;
}): { ok: boolean; outstanding: number; reason?: string };

export function assertScheduleEqualsPrincipal(o: {
  principal: number;
  instalments: Array<{ amount: number }>;
}): { ok: boolean; principal: number; scheduleTotal: number; difference: number; reason: string | null };

export function scanSourceTree(
  root: string,
  opts?: { exts?: string[]; skip?: string[]; scanCopy?: boolean; scanFields?: boolean },
): ScanFinding[];
