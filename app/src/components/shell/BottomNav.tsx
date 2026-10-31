/* ============================================================
   src/components/shell/BottomNav.tsx — ৫-স্লট বটম নেভ (Member + Admin Mobile)
   চুক্তি (specs/05 MC-03 · D-35):
     • ঠিক ৫টি স্লট, grid repeat(5, 1fr) — দুই অ্যাপে একই গ্রিড
     • প্রতিটি ট্যাপ টার্গেট ≥ ৪৮px (min-h-tap), স্পর্শে active:scale
     • FAB থাকলে মাঝের (৩য়) স্লট, উপরে ভেসে থাকে
     • iOS safe-area সম্মান করে (env(safe-area-inset-bottom))
     • ফ্লো পর্দায় nav বন্ধ — সেটি শেলের `hideNav` দিয়ে নিয়ন্ত্রিত হয়
   ============================================================ */

import type { NavSlot } from '../../nav/types';
import { bn } from '../../lib/bn';

export function BottomNav({
  items,
  active,
  onSelect,
  ariaLabel = 'প্রধান নেভিগেশন',
}: {
  items: NavSlot[];
  active?: string;
  onSelect?: (slot: NavSlot) => void;
  ariaLabel?: string;
}) {
  return (
    <nav
      aria-label={ariaLabel}
      className="shrink-0 bg-card border-t border-line"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="grid m-0 p-0 list-none" style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
        {items.map((slot) => {
          const Icon = slot.icon;
          const on = slot.key === active;
          const fab = Boolean(slot.fab);
          return (
            <li key={slot.key} className="relative">
              <button
                type="button"
                onClick={() => onSelect?.(slot)}
                aria-current={on ? 'page' : undefined}
                className={
                  'w-full min-h-tap px-1 pt-2 pb-1.5 flex flex-col items-center justify-center gap-1 ' +
                  'text-xs font-bold transition active:scale-[.97] ' +
                  (on ? 'text-green-700' : 'text-mut hover:text-txt-2')
                }
              >
                {fab ? (
                  <span
                    className={
                      'w-[52px] h-[52px] -mt-6 grid place-items-center rounded-r-pill shadow-sh-2 border-2 border-card transition ' +
                      (on ? 'bg-green-800 text-lime' : 'bg-green-700 text-white')
                    }
                  >
                    <Icon size={24} strokeWidth={2.2} />
                  </span>
                ) : (
                  <Icon size={22} strokeWidth={on ? 2.4 : 2} />
                )}
                <span className="leading-none">{slot.label}</span>
                {slot.badge ? (
                  <i
                    className={
                      'absolute top-1 right-1/2 translate-x-4 not-italic text-[10px] font-extrabold ' +
                      'min-w-4 h-4 px-1 grid place-items-center rounded-r-pill ' +
                      (slot.soft ? 'bg-warn-bg text-warn-ink' : 'bg-danger text-white')
                    }
                  >
                    {bn(slot.badge)}
                  </i>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
