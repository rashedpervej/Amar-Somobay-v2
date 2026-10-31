/* ============================================================
   src/components/shell/SharedShell.tsx — শেয়ার্ড পর্দার হালকা শেল
   S-01…S-08 Member ও Admin দুই জায়গাতেই ব্যবহৃত হয়, তাই কোনো প্যানেল-নেভ নেই —
   শুধু শিরোনাম-বার, ঐচ্ছিক ব্যাক ও কনটেন্ট (মোবাইল-প্রথম, ডেস্কটপে কেন্দ্রে)।
   ============================================================ */

import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';

export function SharedShell({
  title,
  sub,
  onBack,
  right,
  plain = false,
  children,
  footer,
}: {
  title: ReactNode;
  sub?: ReactNode;
  onBack?: () => void;
  right?: ReactNode;
  plain?: boolean;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-[430px] min-h-full flex flex-col bg-paper border-x border-line">
      <header className={plain ? 'bg-card text-txt border-b border-line' : 'bg-green-800 text-white'}>
        <div className="flex items-center gap-2 px-3 pt-3 pb-2.5">
          {onBack ? (
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
            {sub ? <p className={`text-xs mt-0.5 truncate ${plain ? 'text-mut' : 'text-green-100'}`}>{sub}</p> : null}
          </div>
          {right}
        </div>
      </header>
      <main className="grow p-4 space-y-4">{children}</main>
      {footer}
    </div>
  );
}
