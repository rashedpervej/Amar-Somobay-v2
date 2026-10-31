/* ============================================================
   src/apps/member/screens/QardProducts.tsx — QM-03 পণ্য ও শর্তাবলি
   তিনটি পণ্য — সর্বোচ্চ অঙ্ক, মেয়াদ, গ্রেস ও শর্ত; প্রতিটি থেকে আবেদনে যায়।
   ============================================================ */

import { useNavigate } from 'react-router-dom';
import { Check, Info, ShieldCheck } from 'lucide-react';
import { Badge, Button, Card } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { useModules } from '../../../store/moduleStore';

export default function QardProducts() {
  const navigate = useNavigate();
  const { products } = useModules();

  return (
    <div className="p-4 space-y-4 pb-6">
      <div className="inline-flex items-center gap-1.5 text-xs font-bold text-qh-gold-ink bg-qh-gold-soft border border-qh-gold-bd rounded-r-pill px-2.5 py-1">
        <ShieldCheck size={13} /> {bn(products.length)}টি পণ্য · সুদ ৳০
      </div>

      {products.map((p) => (
        <Card key={p.id} title={p.name} sub={`সর্বোচ্চ ৳${bn(p.max)} · ${bn(p.tenureMin)}–${bn(p.tenureMax)} কিস্তি`} right={<Badge tone="ok">সুদমুক্ত</Badge>}>
          <p className="text-sm text-txt-2">{p.desc}</p>
          <dl className="text-sm divide-y divide-line-2 mt-2">
            <div className="flex justify-between py-1.5">
              <dt className="text-mut">সর্বোচ্চ অঙ্ক</dt>
              <dd className="num font-bold text-txt">৳{bn(p.max)}</dd>
            </div>
            <div className="flex justify-between py-1.5">
              <dt className="text-mut">মেয়াদ</dt>
              <dd className="font-bold text-txt">{bn(p.tenureMin)}–{bn(p.tenureMax)} কিস্তি</dd>
            </div>
            <div className="flex justify-between py-1.5">
              <dt className="text-mut">গ্রেস</dt>
              <dd className="font-bold text-txt">{bn(p.grace)} দিন (চার্জ নেই)</dd>
            </div>
            <div className="flex justify-between py-1.5">
              <dt className="text-mut">সুদ ৳০ · মুনাফা ৳০</dt>
              <dd className="font-bold text-ok">শুধু মূলধন ফেরত</dd>
            </div>
          </dl>

          <div className="mt-2">
            <div className="text-xs font-bold text-mut mb-1">প্রয়োজনীয় শর্ত</div>
            <ul className="space-y-1">
              {p.security.map((s) => (
                <li key={s} className="flex items-center gap-1.5 text-sm text-txt-2">
                  <Check size={13} className="text-ok shrink-0" /> {s}
                </li>
              ))}
            </ul>
          </div>

          <Button block className="mt-3" onClick={() => navigate(`/m/qard/apply?product=${p.id}`)}>
            এই পণ্যে আবেদন করুন
          </Button>
        </Card>
      ))}

      <Card title="শর্তাবলি — সংক্ষেপে" right={<Info size={16} className="text-mut" />}>
        <ul className="list-disc pl-4 text-sm text-txt-2 space-y-1">
          <li>ফেরত দিতে হয় শুধু অনুমোদিত মূলধন — কোনো সুদ, মুনাফা, সময়ভিত্তিক চার্জ বা প্রসেসিং ফি নেই।</li>
          <li>বিলম্বে অতিরিক্ত চার্জ নেই (৳০); শুধু পোর্টফোলিও শ্রেণি ও স্মারক নোটিশ প্রযোজ্য।</li>
          <li>আগাম পরিশোধে কোনো ছাড় বা জরিমানা নেই — শুধু বাকি মূলধন কমে।</li>
          <li>একই সময়ে একটির বেশি সহায়তা নেওয়া যায় না; সম্পূর্ণ পরিশোধের পর আবার আবেদন করা যায়।</li>
          <li>তথ্য গোপনীয় — যোগ্যতা মূল্যায়নের ব্যক্তিগত তালিকা প্রকাশ করা হয় না।</li>
        </ul>
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={() => navigate('/m/qard/eligibility')}>আমার যোগ্যতা</Button>
        <Button variant="ghost" onClick={() => navigate('/m/qard')}>কর্জে হাসানা হোম</Button>
      </div>
    </div>
  );
}
