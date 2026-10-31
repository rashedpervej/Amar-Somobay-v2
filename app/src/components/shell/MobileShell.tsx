/* ============================================================
   src/components/shell/MobileShell.tsx — মোবাইল শেল (Member App + Admin App)
   specs/05 §৪: ল্যান্ডিং / গভীর / ফ্লো — তিন মডেল।
     • ল্যান্ডিং ও গভীর → ৫-স্লট নেভ, ড্রয়ার, শিরোনাম-বার
     • ফ্লো → nav ও ড্রয়ার বন্ধ, ব্যাক বাধ্যতামূলক, শিরোনাম-বার
   মোবাইল-প্রথম: কনটেন্ট সর্বোচ্চ ৪৩০px, ডেস্কটপে কেন্দ্রে — ট্যাবলেটে টান দেয় না।
   ============================================================ */

import type { ReactNode } from 'react';
import { ArrowLeft, Menu } from 'lucide-react';
import type { NavSlot } from '../../nav/types';
import { BottomNav } from './BottomNav';

export type ShellModel = 'landing' | 'deep' | 'flow';

export function MobileShell({
  title,
  subtitle,
  model = 'deep',
  nav,
  activeNav,
  onNavigate,
  onBack,
  onMenu,
  headerRight,
  tone = 'brand',
  children,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  /** landing/deep → নেভ দেখা যায়; flow → নেভ ও ড্রয়ার বন্ধ (MC-03) */
  model?: ShellModel;
  nav: NavSlot[];
  activeNav?: string;
  onNavigate?: (slot: NavSlot) => void;
  onBack?: () => void;
  onMenu?: () => void;
  headerRight?: ReactNode;
  tone?: 'brand' | 'qh' | 'plain';
  children: ReactNode;
}) {
  const isFlow = model === 'flow';
  const headBg =
    tone === 'qh'
      ? 'bg-qh-700 text-white'
      : tone === 'plain'
        ? 'bg-card text-txt border-b border-line'
        : 'bg-green-800 text-white';
  const sub = tone === 'plain' ? 'text-mut' : 'text-green-100';

  return (
    <div className="h-full flex flex-col bg-paper">
      <header className={`${headBg} shrink-0`}>
        <div className="flex items-center gap-2 px-3 pt-3 pb-2.5">
          {isFlow && onBack ? (
            <button
              type="button"
              onClick={onBack}
              aria-label="ফিরে যান"
              className="w-11 h-11 -ml-1 grid place-items-center rounded-r-sm hover:bg-white/10"
            >
              <ArrowLeft size={22} />
            </button>
          ) : null}
          <div className="grow min-w-0">
            <h1 className="text-h3 truncate">{title}</h1>
            {subtitle ? <p className={`text-xs mt-0.5 truncate ${sub}`}>{subtitle}</p> : null}
          </div>
          {headerRight}
          {!isFlow && onMenu ? (
            <button
              type="button"
              onClick={onMenu}
              aria-label="সব বিভাগ"
              className="w-11 h-11 grid place-items-center rounded-r-sm hover:bg-white/10"
            >
              <Menu size={22} />
            </button>
          ) : null}
        </div>
      </header>

      <main className="grow overflow-y-auto">{children}</main>

      {/* ফ্লো পর্দায় nav বন্ধ — MC-03 */}
      {!isFlow && <BottomNav items={nav} active={activeNav} onSelect={onNavigate} />}
    </div>
  );
}
