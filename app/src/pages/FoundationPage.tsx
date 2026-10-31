/* ============================================================
   src/pages/FoundationPage.tsx — Phase 2: Mobile-first foundation
   এখানে ব্যবসায়িক স্ক্রিন নেই (সেগুলো ফেজ ৩+)। শুধু তিনটি শেল ও তাদের চুক্তি দেখানো হয়:
     ১) সদস্য অ্যাপ   — MNAV ৫ স্লট (শুধু মোবাইল)
     ২) অ্যাডমিন অ্যাপ  — ৬টি শেল, প্রতি ভূমিকায় ৫ স্লট (মোবাইল-প্রথম)
     ৩) অ্যাডমিন ওয়েব — ৯ গ্রুপ · ৪৯ আইটেমের সাইডবার (ডেস্কটপ)
   কোনো সংখ্যা/তথ্য বানানো হয়নি — প্লেসহোল্ডার ব্লক ব্যবহার করা হয়েছে।
   ============================================================ */

import { useState } from 'react';
import { MobileShell } from '../components/shell/MobileShell';
import { AdminWebShell } from '../components/shell/AdminWebShell';
import { ADMIN_ROLES, ADMIN_SHELLS, bottomSlots, resolveAdminShell } from '../nav/adminMobile';
import { MEMBER_NAV } from '../nav/member';
import { ADMIN_WEB_NAV, ADMIN_WEB_ITEM_COUNT } from '../nav/adminWeb';
import type { NavSlot } from '../nav/types';
import { Badge, Button, Card, Chip, SectionHead } from '../components/ui';

/* ---------- প্লেসহোল্ডার ব্লক (স্কেলেটন, কোনো ভুয়া তথ্য নয়) ---------- */
function Skeleton({ lines = 2, tall }: { lines?: number; tall?: boolean }) {
  return (
    <div className="bg-card border border-line rounded-r-md p-4 shadow-sh-1">
      <div className="h-3 w-24 rounded-r-pill bg-line-2 mb-3" />
      {tall ? <div className="h-16 rounded-r-sm bg-line-2 mb-3" /> : null}
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-3 rounded-r-pill bg-line-2 mb-2" style={{ width: `${92 - i * 14}%` }} />
      ))}
    </div>
  );
}

function PhoneFrame({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="shrink-0">
      <div className="text-xs font-bold text-mut mb-2 px-1">{label}</div>
      <div className="w-[390px] max-w-full h-[720px] rounded-r-xl border border-line-3 bg-card shadow-sh-3 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

/* ---------- ১. সদস্য অ্যাপ ---------- */
function MemberDemo() {
  const [active, setActive] = useState<string>('home');
  const current = MEMBER_NAV.find((n) => n.key === active) ?? MEMBER_NAV[0];

  return (
    <PhoneFrame label="সদস্য অ্যাপ · MNAV ৫ স্লট">
      <MobileShell
        title="সঞ্চয় হোম"
        subtitle="সদস্য • মোবাইল-শুধু"
        model="landing"
        nav={MEMBER_NAV}
        activeNav={active}
        onNavigate={(s: NavSlot) => setActive(s.key)}
        headerRight={
          <span className="w-9 h-9 grid place-items-center rounded-r-pill bg-white/15 text-xs font-bold">
            স
          </span>
        }
      >
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Badge tone="ok">সক্রিয়</Badge>
            <Badge tone="neutral">প্লেসহোল্ডার</Badge>
          </div>
          <div className="rounded-r-md bg-green-700 text-white p-4">
            <div className="text-xs text-green-100">নির্বাচিত ট্যাব</div>
            <div className="text-h2 mt-1">{current.label}</div>
            <div className="text-xs text-green-100 mt-1">
              গন্তব্য {current.to} — ফেজ ৩-এ আসল স্ক্রিন আসবে
            </div>
          </div>
          <Skeleton tall lines={2} />
          <Skeleton lines={3} />
          <div className="text-xs text-mut text-center pb-4">
            এই শেলে কোনো আর্থিক সংখ্যা নেই — পরিকল্পিত পর্দা এখনো পোর্ট হয়নি।
          </div>
        </div>
      </MobileShell>
    </PhoneFrame>
  );
}

/* ---------- ২. অ্যাডমিন মোবাইল ---------- */
function AdminMobileDemo() {
  const [role, setRole] = useState('MANAGER');
  const [active, setActive] = useState<string>('');
  const shell = resolveAdminShell(role);
  const slots = bottomSlots(shell);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {ADMIN_ROLES.map((r) => (
          <Chip key={r} active={r === role} onClick={() => { setRole(r); setActive(''); }}>
            {ADMIN_SHELLS[r].roleBn}
          </Chip>
        ))}
      </div>

      <PhoneFrame label={`অ্যাডমিন অ্যাপ · ${shell.code} · ${shell.roleBn}`}>
        <MobileShell
          title={shell.nameBn}
          subtitle={`${shell.roleBn}${shell.readOnly ? ' · শুধু পঠন' : ''}`}
          model="landing"
          nav={slots}
          activeNav={active}
          onNavigate={(s) => setActive(s.key)}
          onMenu={() => undefined}
        >
          <div className="p-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge tone="brand">{shell.code}</Badge>
              {shell.readOnly ? <Badge tone="info">পঠন-শুধু</Badge> : null}
              <Badge tone="neutral">৫ স্লট</Badge>
            </div>
            <div className="rounded-r-md bg-card border border-line p-4 shadow-sh-1">
              <div className="text-xs text-mut">বটম নেভের স্লট</div>
              <ol className="mt-2 mb-0 pl-4 space-y-1 text-sm text-txt-2">
                {slots.map((s, i) => (
                  <li key={s.key}>
                    {s.label}
                    {s.fab ? <span className="text-xs text-green-700 font-bold"> · কেন্দ্রীয় FAB</span> : null}
                    {i === 2 && s.fab ? <span className="text-xs text-mut"> (মাঝের স্লট)</span> : null}
                  </li>
                ))}
              </ol>
            </div>
            <Skeleton lines={3} />
            <div className="text-xs text-mut text-center pb-4">
              বাকি সব বিভাগ ড্রয়ারে (সম্পূর্ণ ANAV) — D-35।
            </div>
          </div>
        </MobileShell>
      </PhoneFrame>
    </div>
  );
}

/* ---------- ৩. অ্যাডমিন ওয়েব ---------- */
function AdminWebDemo() {
  const [active, setActive] = useState<string>('dash');
  const [drawer, setDrawer] = useState(false);

  return (
    <div className="w-full h-[620px] rounded-r-lg border border-line-3 overflow-hidden shadow-sh-3 bg-card">
      <AdminWebShell
        title="অ্যাডমিন ওয়েব"
        breadcrumb="ওভারভিউ › ড্যাশবোর্ড (প্লেসহোল্ডার)"
        active={active}
        onNavigate={(s) => setActive(s.key)}
        drawerOpen={drawer}
        onToggleDrawer={() => setDrawer((v) => !v)}
        actions={<Button size="sm" variant="secondary">নমুনা অ্যাকশন</Button>}
      >
        <div className="grid gap-3 md:grid-cols-3">
          <Skeleton tall lines={2} />
          <Skeleton tall lines={2} />
          <Skeleton tall lines={2} />
        </div>
        <div className="mt-3">
          <Skeleton tall lines={4} />
        </div>
        <p className="text-xs text-mut mt-4">
          এই ডেস্কটপ শেল আলাদা অভিজ্ঞতা — অ্যাডমিন মোবাইল UI-এর রেসপন্সিভ সংস্করণ নয়।
        </p>
      </AdminWebShell>
    </div>
  );
}

/* ---------- পৃষ্ঠা ---------- */
export default function FoundationPage() {
  return (
    <div className="space-y-6">
      <Card
        title="Phase 2 · Mobile-first foundation"
        sub="তিনটি শেল, নেভিগেশন চুক্তি ও টোকেন — সবই প্রোটোটাইপ থেকে যাচাই করা (d05)"
        right={<Badge tone="ok">চুক্তি পাস</Badge>}
      >
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            ['সদস্য অ্যাপ', '৫ স্লট · শুধু মোবাইল'],
            ['অ্যাডমিন অ্যাপ', '৬ শেল · ভূমিকা-ভিত্তিক ৫ স্লট'],
            ['অ্যাডমিন ওয়েব', `${ADMIN_WEB_NAV.length} গ্রুপ · ${ADMIN_WEB_ITEM_COUNT} আইটেম`],
            ['ট্যাপ টার্গেট', '≥ ৪৮px · safe-area সম্মানিত'],
          ].map(([t, s]) => (
            <div key={t} className="rounded-r-sm bg-card-2 border border-line-2 px-3 py-2">
              <div className="text-sm font-bold text-txt">{t}</div>
              <div className="text-xs text-mut">{s}</div>
            </div>
          ))}
        </div>
      </Card>

      <SectionHead title="১ · সদস্য অ্যাপ" sub="MNAV — হোম · সঞ্চয় · জমা দিন (FAB) · লেনদেন · আরও" />
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        <MemberDemo />
        <div className="grow space-y-3 w-full">
          <Card title="কেন এই ক্রম" sub="প্রোটোটাইপের MNAV হুবহু — নতুন স্লট বানানো হয়নি">
            <ul className="pl-5 text-sm text-txt-2 space-y-1.5">
              <li>মাঝের স্লট = জমা দিন (কেন্দ্রীয় FAB) — সবচেয়ে ঘন ঘন কাজ</li>
              <li>বাকি চারটি ল্যান্ডিং গন্তব্য — ব্যাক বাটন নেই (শীর্ষ-স্তর)</li>
              <li>নেভিগেশন লেবেল বাংলায়; সংখ্যা বাংলা অঙ্কে</li>
            </ul>
          </Card>
          <Card title="যা এখনো নেই" sub="পরিকল্পিত, কিন্তু বানানো হয়নি">
            <ul className="pl-5 text-sm text-txt-2 space-y-1.5">
              <li>আসল পর্দা (M-01…M-21) — ফেজ ৩</li>
              <li>লগইন/OTP ও সমিতি-নির্বাচন — ফেজ ৩-এর শুরুতে</li>
              <li>কোনো ডেটা/API সংযোগ — ব্যাকএন্ড ফেজ ৬</li>
            </ul>
          </Card>
        </div>
      </div>

      <SectionHead title="২ · অ্যাডমিন অ্যাপ (মোবাইল-প্রথম)" sub="ভূমিকা বদলালে শেল ও নেভ বদলায়" />
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        <AdminMobileDemo />
        <div className="grow w-full">
          <Card title="৬টি শেল" sub="সবগুলোই ঠিক ৫ স্লট — একই গ্রিড, একই নিয়ম">
            <div className="space-y-2">
              {ADMIN_ROLES.map((r) => {
                const s = ADMIN_SHELLS[r];
                return (
                  <div key={r} className="flex items-center gap-2 text-sm">
                    <Badge tone="brand">{s.code}</Badge>
                    <span className="font-bold text-txt">{s.roleBn}</span>
                    <span className="text-mut text-xs">
                      {bottomSlots(s).map((x) => x.label).join(' · ')}
                    </span>
                    {s.readOnly ? <Badge tone="info">R</Badge> : null}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      <SectionHead title="৩ · অ্যাডমিন ওয়েব" sub="আলাদা ডেস্কটপ অভিজ্ঞতা · সম্পূর্ণ ANAV সাইডবারে" />
      <AdminWebDemo />

      <Card title="চুক্তি যাচাই (d05)" sub="প্রোটোটাইপের সাথে প্যারিটি — স্বয়ংক্রিয় টেস্ট">
        <ul className="pl-5 text-sm text-txt-2 space-y-1.5">
          <li>MNAV: ঠিক ৫ স্লট, ঠিক ১টি FAB — প্রোটোটাইপের লেবেল/গন্তব্যের সাথে হুবহু</li>
          <li>অ্যাডমিন শেল: ৬টি, প্রতিটি ৫ স্লট; এলিয়াস (EXTERNAL_AUDITOR, VIEWER) → AUDITOR</li>
          <li>ANAV: ৯ গ্রুপ · ৪৯ আইটেম — লেবেল হুবহু প্রোটোটাইপের</li>
          <li>নেভিগেশন লেবেলে সুদ/মুনাফা-জাতীয় নিষিদ্ধ শব্দ নেই (D-01)</li>
          <li>ট্যাপ টার্গেট ≤ ৪৮px নয়; safe-area ব্যবহৃত</li>
        </ul>
      </Card>
    </div>
  );
}
