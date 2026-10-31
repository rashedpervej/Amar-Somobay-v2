/* ============================================================
   src/apps/member/screens/QardEligibility.tsx — QM-02 যোগ্যতা ও আমার অবস্থা
   "অযোগ্য" শব্দ নয় — কারণ, করণীয় ও প্রতিকার। চার স্তরের যাচাই ও সীমার হিসাব।
   ============================================================ */

import { useNavigate } from 'react-router-dom';
import { ArrowDownToLine, Check, Info, Scale, ShieldCheck, X } from 'lucide-react';
import { Badge, Button, Card, SectionHead } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { useMember } from '../../../store/memberStore';
import { useModules } from '../../../store/moduleStore';
import { eligibility, outstanding } from '../../../domain/qard';

export default function QardEligibility() {
  const navigate = useNavigate();
  const { state, balance, payable } = useMember();
  const { loans, repayments, products } = useModules();
  const active = loans.filter((l) => l.status === 'active' || l.status === 'arrears');
  const el = eligibility({ kycVerified: state.profile.kycStatus === 'verified', memberMonths: 14, duesTotal: payable, hasActive: active.length > 0 }, 40000);
  const productMax = products[0].max;
  const savingHalf = Math.round(balance / 2);
  const fundFree = 250000;
  const cap = Math.min(productMax, savingHalf || productMax, fundFree, el.max);

  return (
    <div className="p-4 space-y-4 pb-6">
      <div className="inline-flex items-center gap-1.5 text-xs font-bold text-qh-gold-ink bg-qh-gold-soft border border-qh-gold-bd rounded-r-pill px-2.5 py-1">
        <ShieldCheck size={13} /> যোগ্যতা · সুদ ৳০
      </div>

      <Card
        title={el.state === 'eligible' ? 'আপনি আবেদন করতে পারবেন' : el.state === 'conditional' ? 'আরও শর্ত পূরণ দরকার' : 'এখন আবেদন করা যাবে না'}
        sub={`সর্বোচ্চ ৳${bn(cap)} পর্যন্ত`}
        right={<Badge tone={el.state === 'eligible' ? 'ok' : 'warn'}>{el.state === 'eligible' ? 'যোগ্য' : el.state === 'conditional' ? 'শর্তসাপেক্ষ' : 'সীমিত'}</Badge>}
      >
        <dl className="text-sm divide-y divide-line-2">
          <div className="flex justify-between py-1.5">
            <dt className="text-mut">মূল্যায়ন হয়েছে</dt>
            <dd className="font-bold">৩১ অক্টোবর ২০২৬</dd>
          </div>
          <div className="flex justify-between py-1.5">
            <dt className="text-mut">মেয়াদ</dt>
            <dd className="font-bold">৩১ জানুয়ারি ২০২৭ পর্যন্ত</dd>
          </div>
          <div className="flex justify-between py-1.5">
            <dt className="text-mut">উৎস</dt>
            <dd className="font-bold">স্বয়ংক্রিয় নিয়ম</dd>
          </div>
          <div className="flex justify-between py-1.5">
            <dt className="text-mut">নিয়ম সংস্করণ</dt>
            <dd className="font-bold">৩ (০১ জুলাই ২০২৬)</dd>
          </div>
        </dl>
      </Card>

      <SectionHead title="চার স্তরের যাচাই" right={<button type="button" onClick={() => navigate('/m/qard/products')} className="min-h-tap px-1 inline-flex items-center text-sm font-bold text-green-700">পণ্য দেখুন</button>} />
      <Card>
        <ul className="space-y-2">
          {el.reasons.map((r) => (
            <li key={r.code} className="flex items-start gap-2">
              <span className={`mt-0.5 w-5 h-5 rounded-r-pill grid place-items-center shrink-0 ${r.ok ? 'bg-ok-bg text-ok-ink' : 'bg-warn-bg text-warn-ink'}`}>
                {r.ok ? <Check size={12} /> : <X size={12} />}
              </span>
              <div className="grow">
                <div className={`text-sm font-bold ${r.ok ? 'text-txt' : 'text-warn-ink'}`}>{r.title}</div>
                <div className="text-xs text-mut">{r.detail}</div>
              </div>
              <span className="text-[11px] text-mut shrink-0">{r.ok ? 'পূরণ ✓' : 'করণীয়'}</span>
            </li>
          ))}
        </ul>
      </Card>

      <SectionHead title="সর্বোচ্চ অঙ্ক যেভাবে হিসাব হয়" right={<Scale size={16} className="text-mut" />} />
      <Card>
        <dl className="text-sm divide-y divide-line-2">
          {[
            ['পণ্যের সর্বোচ্চ', `৳${bn(productMax)}`],
            ['মোট সঞ্চয়ের ৫০%', `৳${bn(savingHalf)}`],
            ['ফান্ড পুলে অবশিষ্ট', `৳${bn(fundFree)}`],
            ['যোগ্যতা মূল্যায়নের সীমা', `৳${bn(el.max)}`],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between py-1.5">
              <dt className="text-mut">{k}</dt>
              <dd className="num font-bold text-txt">{v}</dd>
            </div>
          ))}
          <div className="flex justify-between py-2">
            <dt className="font-extrabold text-txt">চূড়ান্ত সীমা (সর্বনিম্ন)</dt>
            <dd className="num font-extrabold text-green-700">৳{bn(cap)}</dd>
          </div>
        </dl>
        <div className="rounded-r-sm bg-warn-bg border border-warn-bd text-warn-ink px-3 py-2 text-xs mt-2">
          <b>চূড়ান্ত সীমা = এগুলোর সর্বনিম্ন</b> — আবেদনের আগেই সীমা জানানো হয়, যাতে করে প্রত্যাখ্যাত হতে না হয়।
        </div>
      </Card>

      <SectionHead title="কী করলে যোগ্য হব" />
      <Card>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className={`w-5 h-5 rounded-r-pill grid place-items-center shrink-0 ${payable === 0 ? 'bg-ok-bg text-ok-ink' : 'bg-warn-bg text-warn-ink'}`}>
              {payable === 0 ? <Check size={12} /> : <X size={12} />}
            </span>
            <div className="grow">
              <b>সব মডিউলের বকেয়া শূন্য করুন</b>
              <div className="text-xs text-mut">{payable ? `এখন বকেয়া ৳${bn(payable)}` : 'বকেয়া নেই'}</div>
            </div>
          </li>
          <li className="flex items-start gap-2">
            <span className={`w-5 h-5 rounded-r-pill grid place-items-center shrink-0 ${active.length ? 'bg-warn-bg text-warn-ink' : 'bg-ok-bg text-ok-ink'}`}>
              {active.length ? <X size={12} /> : <Check size={12} />}
            </span>
            <div className="grow">
              <b>চলমান সহায়তার পরিশোধ সম্পূর্ণ করুন</b>
              <div className="text-xs text-mut">
                {active.length ? `${active[0].no} · বাকি ৳${bn(outstanding(loans, repayments, active[0].id))}` : 'কোনো সক্রিয় ঋণ নেই'}
              </div>
            </div>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-r-pill grid place-items-center shrink-0 bg-ok-bg text-ok-ink"><Check size={12} /></span>
            <div className="grow">
              <b>সদস্যত্বকাল ৬ মাস+</b>
              <div className="text-xs text-mut">যোগদান {state.profile.since} · KYC {state.profile.kycStatus === 'verified' ? 'যাচাইকৃত ✓' : 'বাকি'}</div>
            </div>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-r-pill grid place-items-center shrink-0 bg-ok-bg text-ok-ink"><Check size={12} /></span>
            <div className="grow">
              <b>আবেদন জানালা খোলা</b>
              <div className="text-xs text-mut">পরবর্তী জানালা ০১–১০ নভেম্বর ২০২৬</div>
            </div>
          </li>
        </ul>
        <div className="grid grid-cols-2 gap-2 mt-3">
          <Button size="sm" variant="secondary" icon={<ArrowDownToLine size={14} />} onClick={() => navigate('/m/dues')}>বকেয়া জমা</Button>
          <Button size="sm" variant="secondary" onClick={() => navigate('/m/qard/pay')}>কিস্তি পরিশোধ</Button>
        </div>
      </Card>

      <div className="rounded-r-sm bg-info-bg border border-info-bd text-info-ink px-3 py-2 text-xs flex gap-2">
        <Info size={15} className="mt-0.5 shrink-0" />
        <span>
          <b>সম্মান রক্ষার নীতি</b> — “অযোগ্য” লেখা হয় না; কারণ, করণীয় ও প্রতিকার লেখা হয়। নিয়ম বদলালে সংস্করণ বাড়ে, কিন্তু
          আপনার জমা দেওয়া আবেদন তৎকালীন নিয়মেই বিচারিত হয়।
        </span>
      </div>

      <Button block onClick={() => navigate('/m/qard/apply')}>আবেদনপত্রে যান</Button>
    </div>
  );
}
