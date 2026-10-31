/* ============================================================
   src/apps/member/screens/More.tsx — M-18/M-19/M-20/M-21 "আরও" হাব
   প্রোটোটাইপের MNAV-এর ৫ম স্লট। নতুন পর্দা বানানো হয়নি — শুধু হাব।
   ============================================================ */

import { BadgeCheck, Bell, ChevronRight, HelpCircle, LogOut, ShieldCheck, UserRound, Users } from 'lucide-react';
import { Badge, Card, Row } from '../../../components/ui';
import { member } from '../../../demo/data';

export default function More() {
  return (
    <div className="p-4 space-y-4">
      <div className="rounded-r-md bg-card border border-line p-4 flex items-center gap-3 shadow-sh-1">
        <span className="w-12 h-12 grid place-items-center rounded-r-pill bg-green-100 text-green-800 font-extrabold text-h3">
          র
        </span>
        <div className="grow min-w-0">
          <div className="font-bold text-txt truncate">{member.name}</div>
          <div className="text-xs text-mut truncate">
            {member.memberNo} · যোগদান {member.since}
          </div>
        </div>
        <Badge tone="ok" dot>
          {member.status}
        </Badge>
      </div>

      <div className="rounded-r-md border border-line bg-card overflow-hidden shadow-sh-1">
        <Row icon={<UserRound size={18} />} title="প্রোফাইল ও KYC" sub="নাম, ঠিকানা, পরিচয়পত্র" right={<ChevronRight size={18} className="text-mut" />} onClick={() => undefined} />
        <Row icon={<Users size={18} />} title="নমিনি ব্যবস্থাপনা" sub="নমিনির তথ্য ও ভাগ" right={<Badge tone="neutral">২ জন</Badge>} onClick={() => undefined} />
        <Row icon={<Bell size={18} />} title="নোটিফিকেশন" sub="রিমাইন্ডার ও পছন্দ" right={<ChevronRight size={18} className="text-mut" />} onClick={() => undefined} />
        <Row icon={<ShieldCheck size={18} />} title="অ্যাকাউন্ট ও নিরাপত্তা" sub="পিন, সেশন, ডিভাইস" right={<ChevronRight size={18} className="text-mut" />} onClick={() => undefined} />
        <Row icon={<HelpCircle size={18} />} title="সহায়তা ও অভিযোগ" sub="রসিদ যাচাই, যোগাযোগ" right={<ChevronRight size={18} className="text-mut" />} onClick={() => undefined} />
      </div>

      <Card title="আমার সমিতি" sub="সমিতি বদলাতে চাইলে S-02 ব্যবহার করুন">
        <div className="flex items-center gap-2 text-sm text-txt-2">
          <BadgeCheck size={16} className="text-ok" />
          <span>{member.org}</span>
          <Badge tone="brand">সদস্য</Badge>
        </div>
      </Card>

      <Row icon={<LogOut size={18} />} title="লগআউট" sub="ডেমো — সেশন নেই" right={<ChevronRight size={18} className="text-mut" />} onClick={() => undefined} />
    </div>
  );
}
