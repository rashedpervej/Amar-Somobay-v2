/* ============================================================
   src/apps/member/screens/More.tsx — "আরও" হাব (MNAV ৫ম স্লট)
   সব সাব-পর্দার প্রবেশদ্বার; সংখ্যা ও অবস্থা স্টোর থেকে আসে, প্রতিটি সারি নেভিগেট করে।
   ============================================================ */

import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Heart,
  RefreshCw,
  Target,
  ChevronRight,
  FileText,
  HelpCircle,
  LogOut,
  Megaphone,
  ShieldCheck,
  UserRound,
  Users,
  Wallet,
  XCircle,
} from 'lucide-react';
import { Badge, Card, Row } from '../../../components/ui';
import { StatusChip } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useMember } from '../../../store/memberStore';

export default function More() {
  const { state, balance, unreadCount, payable } = useMember();
  const navigate = useNavigate();
  const p = state.profile;

  return (
    <div className="p-4 space-y-4">
      <button
        type="button"
        onClick={() => navigate('/m/profile')}
        className="w-full text-left rounded-r-md bg-card border border-line p-4 flex items-center gap-3 shadow-sh-1 min-h-tap"
      >
        <span className="w-12 h-12 grid place-items-center rounded-r-pill bg-green-100 text-green-800 font-extrabold text-h3">
          {p.name.slice(0, 1)}
        </span>
        <span className="grow min-w-0">
          <span className="block font-bold text-txt truncate">{p.name}</span>
          <span className="block text-xs text-mut truncate">
            {p.memberNo} · যোগদান {p.since}
          </span>
          <span className="mt-1 flex items-center gap-2">
            <StatusChip status={p.kycStatus === 'verified' ? 'verified' : p.kycStatus} />
            <span className="text-xs text-mut num">৳{bn(balance)}</span>
          </span>
        </span>
        <ChevronRight size={18} className="text-mut shrink-0" />
      </button>

      <div className="rounded-r-md border border-line bg-card overflow-hidden shadow-sh-1">
        <Row
          icon={<UserRound size={18} />}
          title="প্রোফাইল ও KYC"
          sub="নাম, ঠিকানা, পরিচয়পত্র"
          right={<ChevronRight size={18} className="text-mut" />}
          onClick={() => navigate('/m/profile')}
        />
        <Row
          icon={<Users size={18} />}
          title="নমিনি ব্যবস্থাপনা"
          sub="নমিনির তথ্য ও ভাগ"
          right={<Badge tone="neutral">{bn(state.nominees.length)} জন</Badge>}
          onClick={() => navigate('/m/nominees')}
        />
        <Row
          icon={<Bell size={18} />}
          title="নোটিফিকেশন"
          sub="রিমাইন্ডার ও পছন্দ"
          right={unreadCount > 0 ? <Badge tone="brand">{bn(unreadCount)} নতুন</Badge> : <ChevronRight size={18} className="text-mut" />}
          onClick={() => navigate('/m/notifications')}
        />
        <Row
          icon={<Megaphone size={18} />}
          title="নোটিশ বোর্ড"
          sub="সংস্থার ঘোষণা"
          right={<ChevronRight size={18} className="text-mut" />}
          onClick={() => navigate('/m/notices')}
        />
        <Row
          icon={<Wallet size={18} />}
          title="উত্তোলন আবেদন"
          sub={payable > 0 ? `বকেয়া ৳${bn(payable)}` : 'অপেক্ষমাণ ও ইতিহাস'}
          right={<ChevronRight size={18} className="text-mut" />}
          onClick={() => navigate('/m/withdrawals')}
        />
        <Row
          icon={<FileText size={18} />}
          title="স্টেটমেন্ট ও রসিদ"
          sub="মাস/বছর অনুযায়ী ডাউনলোড"
          right={<ChevronRight size={18} className="text-mut" />}
          onClick={() => navigate('/m/statement')}
        />
        <Row
          icon={<ShieldCheck size={18} />}
          title="অ্যাকাউন্ট ও নিরাপত্তা"
          sub="পিন, ভাষা, বিজ্ঞপ্তি"
          right={<ChevronRight size={18} className="text-mut" />}
          onClick={() => navigate('/m/settings')}
        />
        <Row
          icon={<HelpCircle size={18} />}
          title="সহায়তা ও অভিযোগ"
          sub="রসিদ যাচাই, টিকিট, যোগাযোগ"
          right={<ChevronRight size={18} className="text-mut" />}
          onClick={() => navigate('/m/help')}
        />
      </div>

      <Card title="আমার মডিউল" sub="চারটি মডিউল — আলাদা হিসাব, আলাদা নিয়ম" right={<Badge tone="brand">৩</Badge>}>
        <Row
          icon={<RefreshCw size={18} />}
          title="আমার চক্র (ROSCA)"
          sub="কিস্তি, ড্র ক্রম ও প্রাপ্তি ভাউচার"
          right={<ChevronRight size={18} className="text-mut" />}
          onClick={() => navigate('/m/circles')}
        />
        <Row
          icon={<Target size={18} />}
          title="আমাদের লক্ষ্য"
          sub="যৌথ লক্ষ্য, অবদান ও ব্যবহারের প্রমাণ"
          right={<ChevronRight size={18} className="text-mut" />}
          onClick={() => navigate('/m/goals')}
        />
        <Row
          icon={<Heart size={18} />}
          title="কর্জে হাসানা"
          sub="সুদমুক্ত সহায়তা · শুধু মূলধন ফেরত"
          right={<Badge tone="ok">সুদ ৳০</Badge>}
          onClick={() => navigate('/m/qard')}
        />
      </Card>

      <Card title="শেয়ার্ড সেবা" sub="সব প্যানেলে একই">
        <Row
          icon={<ShieldCheck size={18} />}
          title="রসিদ যাচাই (লগইন ছাড়া)"
          sub="S-07 · প্রকাশ্য যাচাই পেজ"
          right={<ChevronRight size={18} className="text-mut" />}
          onClick={() => navigate('/verify')}
        />
        <Row
          icon={<RefreshCw size={18} />}
          title="অফলাইন Sync ও কিউ"
          sub="S-08 · সংযোগ ছাড়া জমা হওয়া এন্ট্রি"
          right={<ChevronRight size={18} className="text-mut" />}
          onClick={() => navigate('/sync')}
        />
        <Row
          icon={<UserRound size={18} />}
          title="সমিতি ও অ্যাকাউন্ট সেটিংস"
          sub="S-02 / S-03 · সমিতি বদল, ভাষা, পছন্দ"
          right={<ChevronRight size={18} className="text-mut" />}
          onClick={() => navigate('/account')}
        />
      </Card>

      <Card title="আমার সমিতি" sub="সমিতি বদলাতে চাইলে S-02 ব্যবহার করুন">
        <div className="flex items-center gap-2 text-sm text-txt-2">
          <span className="text-ok">✓</span>
          <span>{p.org}</span>
          <Badge tone="brand">সদস্য</Badge>
        </div>
        <button type="button" onClick={() => navigate('/m/close-request')} className="mt-3 min-h-tap w-full rounded-r-sm border border-danger/30 bg-danger-bg text-danger-ink text-sm font-bold flex items-center justify-center gap-2">
          <XCircle size={16} /> সদস্যপদ বন্ধের আবেদন
        </button>
      </Card>

      <Row
        icon={<LogOut size={18} />}
        title="লগআউট"
        sub="ডেমো — সেশন নেই"
        right={<ChevronRight size={18} className="text-mut" />}
        onClick={() => navigate('/login')}
      />
    </div>
  );
}
