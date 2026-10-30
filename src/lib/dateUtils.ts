/**
 * Date utility functions designed for Bangladesh (Asia/Dhaka) timezone
 * to prevent UTC midnight date shift bugs (e.g. saving dates 1 day early).
 */

export function formatLocalDate(input?: Date | string | null): string {
  if (!input) return getTodayLocalDate();
  const d = typeof input === 'string' ? new Date(input) : input;
  if (isNaN(d.getTime())) return getTodayLocalDate();

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayLocalDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isDateOverdue(dateString?: string | null): boolean {
  if (!dateString) return false;
  const today = getTodayLocalDate();
  // String comparison on YYYY-MM-DD is completely timezone safe!
  return dateString < today;
}

export function toBanglaDate(input?: Date | string | null): string {
  if (!input) return '';
  const d = typeof input === 'string' ? new Date(input) : input;
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('bn-BD', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}
