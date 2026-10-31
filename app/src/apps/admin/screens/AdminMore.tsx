/* ============================================================
   src/apps/admin/screens/AdminMore.tsx — অ্যাডমিন "আরও" মেনু
   নেভিগেশনের ৪র্থ/৫ম স্লট — সব AM পর্দার গ্রুপ করা তালিকা।
   প্রতিটি সারি আসল রুটে যায় (কোনো মৃত লিংক নেই)।
   ============================================================ */

import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle, BarChart3, Banknote, BookOpen, CheckCheck, ClipboardList, Coins, Download,
  FileSpreadsheet, FileText, GitCompareArrows, ListChecks, Route, Settings, ShieldCheck,
  UserPlus, Users, Wallet,
} from 'lucide-react';
import { Card, SectionHead } from '../../../components/ui';
import { useAdmin } from '../../../store/adminStore';
import { bn } from '../../../lib/bn';

export default function AdminMore() {
  const [params] = useSearchParams();
  const role = params.get('role');
  const qs = role ? `?role=${role}` : '';
  const { state } = useAdmin();

  const groups: { t: string; items: { to: string; icon: typeof Users; label: string; sub: string }[] }[] = [
    {
      t: 'দৈনন্দিন কাজ',
      items: [
        { to: '/a/entry', icon: Coins, label: 'জমা এন্ট্রি', sub: 'দ্রুত কিস্তি' },
        { to: '/a/members', icon: Users, label: 'সদস্য', sub: `${bn(state.members.length)} জন` },
        { to: '/a/approvals', icon: CheckCheck, label: 'অনুমোদন কিউ', sub: `${bn(state.approvals.length)}টি অপেক্ষমাণ` },
        { to: '/a/dues', icon: AlertTriangle, label: 'বকেয়া', sub: `${bn(state.dues.length)}টি কিস্তি` },
        { to: '/a/cashbook', icon: Banknote, label: 'দিনশেষ ক্যাশ', sub: 'গণনা ও বন্ধ' },
        { to: '/a/payouts', icon: Wallet, label: 'পেমেন্ট', sub: 'ভাউচার' },
      ],
    },
    {
      t: 'হিসাব ও নিয়ন্ত্রণ',
      items: [
        { to: '/a/ledger', icon: BookOpen, label: 'সাধারণ লেজার', sub: 'সব এন্ট্রি' },
        { to: '/a/recon', icon: GitCompareArrows, label: 'রিকনসিলিয়েশন', sub: `${bn(state.reconEx.filter((x) => x.status !== 'resolved').length)}টি অমিল` },
        { to: '/a/batch', icon: ListChecks, label: 'বাল্ক ব্যাচ', sub: `${bn(state.batches.length)}টি ব্যাচ` },
        { to: '/a/import', icon: FileSpreadsheet, label: 'CSV ইমপোর্ট', sub: 'ম্যাপিং + ড্রাই-রান' },
        { to: '/a/reversal', icon: Download, label: 'সংশোধন', sub: 'রিভার্সাল' },
        { to: '/a/transfer', icon: Wallet, label: 'তহবিল স্থানান্তর', sub: 'সংস্থার হিসাব' },
      ],
    },
    {
      t: 'নীতি ও গভর্ন্যান্স',
      items: [
        { to: '/a/schemes', icon: FileText, label: 'স্কিম', sub: `${bn(state.schemes.length)}টি স্কিম` },
        { to: '/a/routes', icon: Route, label: 'সংগ্রহ পরিকল্পনা', sub: `${bn(state.routes.length)}টি রুট` },
        { to: '/a/moves', icon: UserPlus, label: 'সদস্য স্থানান্তর', sub: `${bn(state.moves.filter((m) => m.status === 'pending').length)}টি অপেক্ষমাণ` },
        { to: '/a/reminders', icon: BarChart3, label: 'রিমাইন্ডার', sub: `SMS ৳${bn(state.sms.balance)}` },
        { to: '/a/settings', icon: Settings, label: 'সেটিংস', sub: 'নীতি ও টগল' },
        { to: '/a/staff', icon: ShieldCheck, label: 'স্টাফ ও পারমিশন', sub: `${bn(state.staff.length)} জন` },
      ],
    },
    {
      t: 'রিপোর্ট ও নিরীক্ষা',
      items: [
        { to: '/a/finance', icon: BarChart3, label: 'আর্থিক বিবরণ', sub: 'বিবরণী ও রিটার্ন' },
        { to: '/a/reports', icon: FileText, label: 'রিপোর্ট কেন্দ্র', sub: `${bn(state.reports.length)}টি রিপোর্ট` },
        { to: '/a/audit', icon: ClipboardList, label: 'অডিট লগ', sub: 'শুধু পঠন' },
        { to: '/a/claims', icon: AlertTriangle, label: 'মৃত্যু দাবি', sub: 'কমিটি' },
      ],
    },
  ];

  return (
    <div className="p-4 space-y-3 pb-6">
      {groups.map((g) => (
        <Card key={g.t} title={g.t} sub={`${bn(g.items.length)}টি পর্দা`}>
          <div className="-mx-1">
            {g.items.map((it) => {
              const Icon = it.icon;
              return (
                <Link key={it.to} to={`${it.to}${qs}`}
                  className="flex items-center gap-2.5 min-h-tap px-1 py-2 border-b border-line-2 last:border-b-0 hover:bg-green-050">
                  <span className="w-9 h-9 rounded-r-sm bg-green-050 text-green-800 grid place-items-center shrink-0">
                    <Icon size={17} />
                  </span>
                  <span className="grow min-w-0">
                    <span className="block text-sm font-bold text-txt">{it.label}</span>
                    <span className="block text-xs text-mut">{it.sub}</span>
                  </span>
                  <span className="text-mut text-sm">›</span>
                </Link>
              );
            })}
          </div>
        </Card>
      ))}
      <SectionHead title="সব AM পর্দা" sub="AM-01 … AM-35 তৈরি" />
      <p className="text-sm text-txt-2">প্রতিটি পর্দা আসল স্টোর-অ্যাকশনে যুক্ত; কোনো স্ট্যাটিক প্লেসহোল্ডার নেই। ডেমো ডেটা রিফ্রেশে রিসেট হয়।</p>
    </div>
  );
}
