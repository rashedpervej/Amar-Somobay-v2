/* ============================================================
   src/components/shell/AdminWebShell.tsx — অ্যাডমিন ওয়েব (ডেস্কটপ)
   আলাদা অভিজ্ঞতা — অ্যাডমিন মোবাইলের রেসপন্সিভ সংস্করণ নয় (আপনার নির্দেশ)।
   D-35: সাইডবারে সবসময় সম্পূর্ণ ANAV (৯ গ্রুপ · ৪৯ আইটেম), ভূমিকা-ফিল্টার নয়।
   ============================================================ */

import type { ReactNode } from 'react';
import { Menu, X } from 'lucide-react';
import { ADMIN_WEB_NAV } from '../../nav/adminWeb';
import type { NavSlot } from '../../nav/types';
import { bn } from '../../lib/bn';

export function AdminWebShell({
  title,
  breadcrumb,
  active,
  onNavigate,
  actions,
  orgName = 'সমিতির নাম',
  orgReg = 'নিবন্ধন নম্বর',
  userName = 'ব্যবহারকারী',
  userRole = 'ম্যানেজার',
  drawerOpen = false,
  onToggleDrawer,
  children,
}: {
  title: ReactNode;
  breadcrumb?: ReactNode;
  active?: string;
  onNavigate?: (slot: NavSlot) => void;
  actions?: ReactNode;
  orgName?: string;
  orgReg?: string;
  userName?: string;
  userRole?: string;
  drawerOpen?: boolean;
  onToggleDrawer?: () => void;
  children: ReactNode;
}) {
  const sidebar = (
    <aside className="w-[264px] shrink-0 h-full bg-green-900 text-white flex flex-col">
      <div className="px-4 py-4 flex items-center gap-2.5 border-b border-white/10">
        <span className="w-9 h-9 grid place-items-center rounded-r-xs bg-lime text-green-900 font-extrabold">
          স
        </span>
        <div className="min-w-0">
          <b className="block text-sm truncate">{orgName}</b>
          <i className="block not-italic text-[11px] text-white/55 truncate">{orgReg}</i>
        </div>
      </div>

      <div className="grow overflow-y-auto py-2">
        {ADMIN_WEB_NAV.map((group) => (
          <div key={group.group}>
            <div className="px-4 pt-3 pb-1 text-[11px] font-bold tracking-wide text-white/40">
              {group.group}
            </div>
            {group.items.map((item) => {
              const Icon = item.icon;
              const on = item.key === active;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onNavigate?.(item)}
                  className={
                    'w-full flex items-center gap-2.5 px-4 min-h-10 text-[13px] text-left transition ' +
                    (on
                      ? 'bg-white/12 text-white font-bold border-l-2 border-lime'
                      : 'text-white/80 hover:bg-white/8 hover:text-white border-l-2 border-transparent')
                  }
                >
                  <Icon size={17} className="shrink-0 opacity-85" />
                  <span className="truncate grow">{item.label}</span>
                  {item.badge ? (
                    <i
                      className={
                        'not-italic text-[10px] font-extrabold min-w-4 h-4 px-1 grid place-items-center rounded-r-pill ' +
                        (item.soft ? 'bg-warn text-white' : 'bg-lime text-green-900')
                      }
                    >
                      {bn(item.badge)}
                    </i>
                  ) : null}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="px-4 py-3 border-t border-white/10 flex items-center gap-2.5">
        <span className="w-8 h-8 grid place-items-center rounded-r-pill bg-white/10 text-xs font-bold">
          {userName.charAt(0)}
        </span>
        <div className="min-w-0">
          <b className="block text-xs truncate">{userName}</b>
          <i className="block not-italic text-[11px] text-white/55 truncate">{userRole}</i>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="h-full flex bg-paper">
      {/* ডেস্কটপে স্থায়ী সাইডবার */}
      <div className="hidden lg:block h-full">{sidebar}</div>

      {/* মোবাইলে ড্রয়ার */}
      {drawerOpen ? (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-green-900/45" onClick={onToggleDrawer} />
          <div className="absolute inset-y-0 left-0">{sidebar}</div>
          <button
            type="button"
            onClick={onToggleDrawer}
            aria-label="বন্ধ করুন"
            className="absolute top-3 left-[276px] w-11 h-11 grid place-items-center rounded-r-sm bg-card text-txt shadow-sh-2"
          >
            <X size={20} />
          </button>
        </div>
      ) : null}

      <div className="grow min-w-0 flex flex-col">
        <header className="shrink-0 bg-card border-b border-line px-4 lg:px-6 py-3 flex items-center gap-3">
          {onToggleDrawer ? (
            <button
              type="button"
              onClick={onToggleDrawer}
              aria-label="সব বিভাগ"
              className="lg:hidden w-11 h-11 -ml-1 grid place-items-center rounded-r-sm hover:bg-line-2"
            >
              <Menu size={22} />
            </button>
          ) : null}
          <div className="grow min-w-0">
            <h1 className="text-h2 truncate">{title}</h1>
            {breadcrumb ? <div className="text-xs text-mut mt-0.5 truncate">{breadcrumb}</div> : null}
          </div>
          {actions ? <div className="flex items-center gap-2 shrink-0">{actions}</div> : null}
        </header>

        <main className="grow overflow-y-auto px-4 lg:px-6 py-4">{children}</main>
      </div>
    </div>
  );
}
