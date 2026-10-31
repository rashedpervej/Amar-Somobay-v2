/* ============================================================
   src/apps/admin/screens/Dues.tsx — AM-12 বকেয়া রেজিস্টার
   মোট বকেয়া হিরো · বয়স-ব্যান্ড KPI · ঝুঁকিপূর্ণ সদস্য কার্ড · সংগ্রহ CTA।
   ============================================================ */

import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, Banknote, Eye, Filter, Phone } from 'lucide-react';
import { Badge, Button, Card, Chip, Chipset, Kpi, KpiGrid, SectionHead } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import { MEM_STATUS, memberById } from '../../../domain/admin';
import { Note, StackedCard, StackHead } from './parts';

export default function Dues() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { state } = useAdmin();
  const [band, setBand] = useState<'all' | '31' | '90'>('all');
  const roleQS = params.get('role') ? `?role=${params.get('role')}` : '';

  const groups = useMemo(() => {
    const map = new Map<string, { memberId: string; rows: typeof state.dues; amt: number; fee: number; age: number }>();
    state.dues.forEach((d) => {
      const g = map.get(d.memberId) ?? { memberId: d.memberId, rows: [], amt: 0, fee: 0, age: 0 };
      g.rows.push(d);
      g.amt += d.amount - d.paid;
      g.fee += d.lateFee;
      g.age = Math.max(g.age, d.age);
      map.set(d.memberId, g);
    });
    return [...map.values()].sort((a, b) => b.age - a.age);
  }, [state.dues]);

  const shown = groups.filter((g) => band === 'all' || (band === '31' ? g.age >= 31 : g.age >= 90));
  const total = groups.reduce((s, g) => s + g.amt, 0);
  const fee = Math.min(20000, groups.reduce((s, g) => s + g.fee, 0));

  return (
    <div className="p-4 space-y-4 pb-6">
      <div className="flex items-start gap-2">
        <div className="grow">
          <h2 className="text-h2 text-txt">বকেয়া রেজিস্টার</h2>
          <p className="text-sm text-mut">{bn(state.members.length)} জন সদস্য · শাপলা সমবায় সমিতি</p>
        </div>
        <Badge tone={total ? 'danger' : 'ok'}>{bn(groups.length)} জন</Badge>
      </div>

      <div className="rounded-r-md bg-danger-ink text-white px-4 py-4">
        <div className="text-xs opacity-90">মোট বকেয়া (কিস্তি)</div>
        <div className="num text-[30px] font-extrabold leading-tight">৳{bn(total)}</div>
        <div className="flex gap-4 mt-2 text-xs">
          <div><div className="opacity-80">বিলম্ব ফি (বার্ষিক সীমা)</div><b className="num">৳{bn(fee)}</b></div>
          <div><div className="opacity-80">ঝুঁকিপূর্ণ</div><b className="num">{bn(groups.filter((g) => g.age >= 90).length)} জন</b></div>
        </div>
        <p className="text-xs mt-2 opacity-90">বিলম্ব ফি একটি নির্ধারিত ফি — কোনো সুদ বা মুনাফা নয় (D-01)। বছরে সর্বোচ্চ ৳২০,০০০।</p>
      </div>

      <KpiGrid>
        <Kpi label="৯০ দিন+" value={bn(groups.filter((g) => g.age >= 90).length)} unit="জন" tone="danger" note="নিষ্ক্রিয় হওয়ার ঝুঁকি (D-07)" />
        <Kpi label="৩১–৯০ দিন" value={bn(groups.filter((g) => g.age >= 31 && g.age < 90).length)} unit="জন" tone="warn" note="রিমাইন্ডার পাঠানো" />
        <Kpi label="আজ সংগ্রহ" value={`৳${bn(state.cashDays[0].declared)}`} note="রুট R1–R3" />
        <Kpi label="কল তালিকা" value={bn(groups.length)} unit="জন" note="সবচেয়ে পুরনো আগে" />
      </KpiGrid>

      <Chipset>
        <Chip active={band === 'all'} onClick={() => setBand('all')}>সব বকেয়া</Chip>
        <Chip active={band === '31'} onClick={() => setBand('31')}>৩১+ দিন</Chip>
        <Chip active={band === '90'} onClick={() => setBand('90')}>৯০+ দিন</Chip>
        <Chip active={false} onClick={() => setBand('all')}><Filter size={13} className="inline -mt-0.5 mr-1" />রিসেট</Chip>
      </Chipset>

      <SectionHead title="বয়স অনুযায়ী সবচেয়ে ঝুঁকিপূর্ণ" sub="কল বা সংগ্রহ করুন" />
      {shown.map((g) => {
        const m = memberById(state.members, g.memberId)!;
        const tone = g.age >= 90 ? 'bad' : g.age >= 31 ? 'warn' : '';
        return (
          <StackedCard key={g.memberId} tone={tone}
            head={<StackHead title={m.name} sub={`${m.no} · ${m.village} · রুট ${m.route} · ${m.mobile}`}
              right={<div className="flex flex-wrap gap-1.5 mt-2">
                <Badge tone={MEM_STATUS[m.status].tone}>{MEM_STATUS[m.status].t}</Badge>
                <Badge tone="warn">সর্বোচ্চ {bn(g.age)} দিন</Badge>
              </div>} />}
            foot={<>
              <Button size="sm" variant="ghost" icon={<Phone size={14} />} onClick={() => navigate(`/a/members/${m.id}${roleQS}`)}>কল</Button>
              <Button size="sm" variant="secondary" className="grow" icon={<Eye size={14} />} onClick={() => navigate(`/a/members/${m.id}${roleQS}`)}>বিবরণ</Button>
              <Button size="sm" className="grow" icon={<Banknote size={14} />} onClick={() => navigate(`/a/entry?member=${m.id}`)}>সংগ্রহ</Button>
            </>}>
            <div className="flex justify-between items-baseline py-1">
              <span className="text-xs text-mut">{bn(g.rows.length)}টি কিস্তি বাকি</span>
              <span className="num text-h3 font-extrabold text-danger-ink">৳{bn(g.amt)}</span>
            </div>
            {g.rows.slice(0, 3).map((d) => (
              <div key={d.id} className="flex justify-between text-xs py-1 border-t border-line-2">
                <span className="text-mut">{bn(d.instNo)}তম কিস্তি · {d.due} · {d.band}</span>
                <span className="num font-bold">৳{bn(d.amount - d.paid)}{d.paid ? ` (আংশিক ৳${bn(d.paid)})` : ''}</span>
              </div>
            ))}
            {g.age >= 90 ? (
              <Note tone="danger">৯০ দিন পেরিয়েছে — আরও {bn(Math.max(0, g.age - 90))} দিনে অ্যাকাউন্ট নিষ্ক্রিয় (dormant) হবে (D-07)।</Note>
            ) : g.age >= 31 ? (
              <Note tone="warn">গ্রেস ৭ দিন পেরিয়েছে — বিলম্ব ফি ৳{bn(g.fee)} যোগ হয়েছে (D-07 + D-08)।</Note>
            ) : null}
          </StackedCard>
        );
      })}

      <Note tone="warn">
        <b>মওকুফ করতে কমিটির সিদ্ধান্ত লাগবে</b> — বিলম্ব ফি বা বকেয়া মওকুফ শুধু লিখিত সিদ্ধান্ত নম্বরে (D-09); করলে নিরীক্ষকের কাছে অ্যালার্ট যাবে।
      </Note>
      <div className="flex items-center gap-1.5 text-xs text-mut justify-center"><AlertTriangle size={13} /> ডেমো ডেটা — কোনো বাস্তব অর্থ নয়</div>
    </div>
  );
}
