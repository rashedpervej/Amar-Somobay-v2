/* ============================================================
   src/components/ui.tsx — Somobay design-system primitives (Phase 1)
   সব মান tokens.css থেকে (Tailwind v4 @theme ম্যাপিং)। কোনো কাঁচা hex/px এখানে নেই।
   মোবাইল-প্রথম; ট্যাপ টার্গেট ≥ ৪৮px (--tap)।
   ============================================================ */

import type { ReactNode, CSSProperties } from 'react';

export type Tone = 'ok' | 'warn' | 'danger' | 'info' | 'neutral' | 'purple' | 'brand';

const TONE_CHIP: Record<Tone, string> = {
  ok: 's-chip-ok',
  warn: 's-chip-warn',
  danger: 's-chip-danger',
  info: 's-chip-info',
  neutral: 's-chip-neutral',
  purple: 's-chip-purple',
  brand: 's-chip-brand',
};

const TONE_BG: Record<Tone, string> = {
  ok: 'bg-ok-bg text-ok-ink border-ok-bd',
  warn: 'bg-warn-bg text-warn-ink border-warn-bd',
  danger: 'bg-danger-bg text-danger-ink border-danger-bd',
  info: 'bg-info-bg text-info-ink border-info-bd',
  neutral: 'bg-neutral-bg text-neutral-ink border-neutral-bd',
  purple: 'bg-purple-bg text-purple-ink border-purple-bd',
  brand: 'bg-green-100 text-green-800 border-green-100',
};

/* ---------------- Card ---------------- */
export function Card({
  title, sub, right, children, footer, tone = 'neutral', className = '', pad = true,
}: {
  title?: ReactNode; sub?: ReactNode; right?: ReactNode; children?: ReactNode;
  footer?: ReactNode; tone?: Tone; className?: string; pad?: boolean;
}) {
  return (
    <section className={`s-card overflow-hidden ${className}`}>
      {(title || right) && (
        <header className="s-card-h">
          <div className="grow min-w-0">
            {title && <h3 className="text-txt truncate">{title}</h3>}
            {sub && <p className="sub">{sub}</p>}
          </div>
          {right && <div className="shrink-0">{right}</div>}
        </header>
      )}
      <div className={pad ? 's-card-b' : ''}>{children}</div>
      {footer && (
        <footer className="s-card-f text-mut flex items-center gap-2">
          {footer}
        </footer>
      )}
    </section>
  );
}

/* ---------------- Button ---------------- */
export function Button({
  children, variant = 'primary', size = 'md', block, disabled, onClick, type = 'button', icon, title, className = '',
}: {
  children: ReactNode; variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold';
  size?: 'sm' | 'md' | 'lg'; block?: boolean; disabled?: boolean; onClick?: () => void;
  type?: 'button' | 'submit'; icon?: ReactNode; title?: string; className?: string;
}) {
  const base = 's-btn';
  const sizes = { sm: 's-btn-sm', md: '', lg: 's-btn-lg' }[size];
  const variants = {
    primary: 's-btn-primary',
    secondary: 's-btn-ghost',
    ghost: 'bg-transparent text-txt-2 border-transparent hover:bg-line-2',
    danger: 's-btn-danger-solid',
    gold: 's-btn-soft',
  }[variant];
  return (
    <button type={type} title={title} aria-label={typeof children === 'string' ? children : title}
      className={`${base} ${sizes} ${variants} ${block ? 'w-full' : ''} ${className}`} disabled={disabled} onClick={onClick}>
      {icon}{children}
    </button>
  );
}

/* ---------------- Badge ---------------- */
export function Badge({ children, tone = 'neutral', dot }: { children: ReactNode; tone?: Tone; dot?: boolean }) {
  return (
    <span className={`s-chip ${TONE_CHIP[tone]}`}>
      {dot && <span className="w-2 h-2 rounded-r-pill bg-current opacity-70" />}
      {children}
    </span>
  );
}

/* ---------------- Chip ---------------- */
export function Chip({ children, active, onClick }: { children: ReactNode; active?: boolean; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`s-chip min-h-10 ${active ? 's-chip-on' : 'bg-card text-txt-2 border-line-3 hover:bg-green-050'}`}>
      {children}
    </button>
  );
}

export function Chipset({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>;
}

/* ---------------- KPI ---------------- */
export function Kpi({ label, value, unit, tone = 'neutral', note, href }: {
  label: ReactNode; value: ReactNode; unit?: ReactNode; tone?: Tone; note?: ReactNode; href?: string;
}) {
  const inner = (
    <>
      <div className="s-kpi-l">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="num s-kpi-v text-txt">{value}</span>
        {unit && <span className="text-sm text-mut">{unit}</span>}
      </div>
      {note && <div className="s-kpi-a">{note}</div>}
    </>
  );
  const cls = `s-kpi block hover:shadow-sh-2 transition`;
  return href ? <a href={href} className={cls}>{inner}</a> : <div className={cls}>{inner}</div>;
}

export function KpiGrid({ children, cols = 2 }: { children: ReactNode; cols?: 2 | 3 | 4 }) {
  const g = { 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3', 4: 'sm:grid-cols-2 lg:grid-cols-4' }[cols];
  return <div className={`grid grid-cols-2 gap-3 ${cols === 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : g}`}>{children}</div>;
}

/* ---------------- Section head ---------------- */
export function SectionHead({ title, sub, right }: { title: ReactNode; sub?: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-end gap-3 mt-6 mb-3">
      <div className="grow">
        <h2 className="text-h2 text-txt">{title}</h2>
        {sub && <p className="text-sm text-mut mt-0.5">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

/* ---------------- Data table (মোবাইলে ≤ ৪ কলাম) ---------------- */
export type Column<T> = { key: string; head: ReactNode; render?: (row: T) => ReactNode; align?: 'left' | 'right' | 'center'; mono?: boolean };

export function DataTable<T extends Record<string, any>>({ columns, rows, empty, caption }: {
  columns: Column<T>[]; rows: T[]; empty?: ReactNode; caption?: ReactNode;
}) {
  return (
    <div className="s-tbl-wrap overflow-x-auto">
      <table className="s-tbl">
        {caption && <caption className="text-left text-xs text-mut px-3 py-2 bg-card-2 border-b border-line-2">{caption}</caption>}
        <thead>
          <tr className="bg-card-2">
            {columns.map((c) => (
              <th key={c.key} className={`${
                c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left'}`}>{c.head}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={columns.length} className="px-3 py-8 text-center text-mut">{empty ?? 'কোনো তথ্য নেই'}</td></tr>
          )}
          {rows.map((r, i) => (
            <tr key={String(r.id ?? i)}>
              {columns.map((c) => (
                <td key={c.key} className={`align-top ${c.mono ? 'num' : ''} ${
                  c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left'}`}>
                  {c.render ? c.render(r) : String(r[c.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------- Decision bar (প্রোটোটাইপের .decbar) ---------------- */
export function DecisionBar({ note, children, style }: { note?: ReactNode; children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={style} className="sticky bottom-0 bg-card border-t border-line-3 px-4 py-3 shadow-sh-3 flex items-center gap-3">
      {note && <div className="grow text-xs text-mut">{note}</div>}
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

/* ---------------- Policy banner (D-01 / D-02 স্ট্যাটাস) ---------------- */
export function PolicyBanner({ tone = 'brand', title, children }: { tone?: Tone; title: ReactNode; children?: ReactNode }) {
  return (
    <div className={`rounded-r-md border px-4 py-3 ${TONE_BG[tone]}`}>
      <div className="font-bold text-body">{title}</div>
      {children && <div className="text-sm mt-1 opacity-90">{children}</div>}
    </div>
  );
}

/* ---------------- Row (প্রোটোটাইপের .row লিস্ট আইটেম) ---------------- */
export function Row({ icon, title, sub, right, onClick, tone }: {
  icon?: ReactNode; title: ReactNode; sub?: ReactNode; right?: ReactNode; onClick?: () => void; tone?: Tone;
}) {
  const Comp: any = onClick ? 'button' : 'div';
  return (
    <Comp type={onClick ? 'button' : undefined} onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 border-b border-line-2 last:border-b-0 text-left ${
        onClick ? 'hover:bg-green-050 active:bg-green-100 min-h-tap' : ''} ${tone ? TONE_BG[tone] : 'bg-card'}`}>
      {icon && <span className="shrink-0 w-9 h-9 grid place-items-center rounded-r-sm bg-green-050 border border-line-2 text-green-700">{icon}</span>}
      <span className="grow min-w-0">
        <span className="block font-bold text-body text-txt truncate">{title}</span>
        {sub && <span className="block text-sm text-mut truncate">{sub}</span>}
      </span>
      {right && <span className="shrink-0">{right}</span>}
    </Comp>
  );
}
