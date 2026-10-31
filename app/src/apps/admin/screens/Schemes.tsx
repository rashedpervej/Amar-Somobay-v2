/* ============================================================
   src/apps/admin/screens/Schemes.tsx — AM-27 স্কিম তালিকা
   সেগমেন্ট (সব/চালু/নতুন বন্ধ/খসড়া) · ৪ KPI · প্রতিটি স্কিমের স্ট্যাকড
   কার্ড (নিয়ম · নতুন সংস্করণ · নামভর্তি) · সংস্করণ ও soft-delete নীতি।
   ============================================================ */

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Eye, Lock, Pencil, Plus } from 'lucide-react';
import { Badge, Button, Card, Kpi, KpiGrid, SectionHead } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import { SCH_STATUS } from '../../../domain/adminOps';
import { Accordion, KV, Note, StackedCard, StackHead } from './parts';

const TABS = ['সব', 'চালু', 'নতুন বন্ধ', 'খসড়া'] as const;

export default function Schemes() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const roleQS = params.get('role') ? `?role=${params.get('role')}` : '';
  const { state } = useAdmin();
  const [tab, setTab] = useState<(typeof TABS)[number]>('সব');
  const list = state.schemes.filter((s) => tab === 'সব' ? true
    : tab === 'চালু' ? s.status === 'active'
      : tab === 'নতুন বন্ধ' ? s.status === 'closed_new'
        : s.status === 'draft' || s.status === 'pending');
  const active = state.schemes.filter((s) => s.status === 'active');
  const closedNew = state.schemes.filter((s) => s.status === 'closed_new');
  const totalMembers = state.schemes.reduce((a, s) => a + s.members, 0);
  const totalBal = state.schemes.reduce((a, s) => a + s.total, 0);

  return (
    <div className="p-4 space-y-3 pb-6">
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={`min-h-tap shrink-0 px-3 rounded-r-pill border text-sm font-bold ${tab === t ? 'bg-green-700 text-white border-green-800' : 'bg-card text-txt-2 border-line-3'}`}>
            {t} {t === 'সব' ? bn(state.schemes.length) : t === 'চালু' ? bn(active.length) : t === 'নতুন বন্ধ' ? bn(closedNew.length) : bn(state.schemes.filter((s) => s.status === 'draft' || s.status === 'pending').length)}
          </button>
        ))}
      </div>

      <KpiGrid>
        <Kpi label="চালু স্কিম" value={bn(active.length)} tone="ok" note="নতুন নামভর্তি খোলা" />
        <Kpi label="মোট সদস্য" value={bn(totalMembers)} note="সব স্কিম মিলিয়ে" />
        <Kpi label="মোট সঞ্চয়" value={`৳${bn(totalBal)}`} note="posted ব্যালেন্স" />
        <Kpi label="নামভর্তি বন্ধ" value={bn(closedNew.length)} tone="warn" note="কিস্তি চলছে" />
      </KpiGrid>

      {list.map((s) => (
        <StackedCard key={s.id} tone={s.status === 'active' ? 'ok' : s.status === 'closed_new' ? 'warn' : ''}
          head={<StackHead title={s.name} sub={`${s.code} · ${s.typeBn} · কিস্তি ৳${bn(s.installment)}${s.tenure ? ` · মেয়াদ ${bn(s.tenure)} মাস` : ''}`}
            right={<Badge tone={SCH_STATUS[s.status].tone}>{SCH_STATUS[s.status].t}</Badge>} />}>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-xs text-mut">মোট সঞ্চয়</div>
              <div className="num text-h3 font-extrabold">৳{bn(s.total)}</div>
            </div>
            <div className="text-xs text-mut">{bn(s.members)} জন সদস্য</div>
          </div>
          <div className="mt-1">
            <KV k="নোটিশ পিরিয়ড" v={`${bn(s.noticeDays)} দিন · মাসে সর্বোচ্চ ${bn(s.maxPerMonth)}বার`} />
            <KV k="লক-ইন / সর্বনিম্ন" v={`${s.lockIn ? `${bn(s.lockIn)} মাস` : 'নেই'} · ৳${bn(s.minBalance)}`} />
            <KV k="ফি" v={`ভর্তি ৳${bn(s.fees.admission)} · বার্ষিক ৳${bn(s.fees.annual)} · উত্তোলন ৳${bn(s.fees.withdrawal)}`} />
            <KV k="সুদ / মুনাফা" v={<b>৳০ — কোনো সুদ নেই (D-01)</b>} />
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <Badge tone="neutral">সংস্করণ {bn(s.version)}</Badge>
            <Badge tone={s.extra ? 'ok' : 'neutral'}>{s.extra ? 'অতিরিক্ত জমা চালু' : 'অতিরিক্ত জমা বন্ধ'}</Badge>
          </div>
          {s.status === 'closed_new' ? <Note tone="warn"><><b>{s.closedReason}</b> — বিদ্যমান {bn(s.members)} জনের কিস্তি চলবে।</></Note> : null}
          <div className="flex gap-2 mt-2.5">
            <Button size="sm" variant="ghost" icon={<Eye size={14} />} onClick={() => navigate(`/a/schemes/${s.id}${roleQS}`)}>নিয়ম</Button>
            <Button size="sm" variant="secondary" className="grow" icon={<Pencil size={14} />} onClick={() => navigate(`/a/schemes/${s.id}/edit${roleQS}`)}>নতুন সংস্করণ</Button>
            <Button size="sm" variant="ghost" icon={<Plus size={14} />} onClick={() => navigate(`/a/members/new${roleQS}`)}>নামভর্তি</Button>
          </div>
        </StackedCard>
      ))}

      <Accordion title="স্কিম বন্ধ করা মানে মুছে ফেলা নয়" sub="soft-delete · ৮ বছর আর্কাইভ (D-30)" defaultOpen>
        <p className="text-sm text-txt-2 leading-relaxed">
          নামভর্তি বন্ধ হলেও বিদ্যমান অ্যাকাউন্ট, লেনদেন ও নিয়ম অটুট থাকে; রেকর্ড ৮ বছর আর্কাইভ থাকে।
          কোনো স্কিমই ডিলিট করা যায় না (R-02)।
        </p>
      </Accordion>

      <Card title="মোট" sub={`${bn(list.length)}টি স্কিম দেখানো হচ্ছে`}>
        <KV k="চালু" v={bn(active.length)} />
        <KV k="নতুন বন্ধ" v={bn(closedNew.length)} />
        <KV k="খসড়া / অপেক্ষমাণ" v={bn(state.schemes.filter((s) => s.status === 'draft' || s.status === 'pending').length)} />
        <KV k="মোট সদস্য" v={bn(totalMembers)} strong />
      </Card>

      <div className="flex gap-2">
        <Button variant="ghost" className="grow" icon={<Check size={15} />} onClick={() => navigate(`/a/reports${roleQS}`)}>রিপোর্ট</Button>
        <Button variant="secondary" className="grow" onClick={() => navigate(`/a/schemes/${state.schemes[0].id}${roleQS}`)}>বিবরণ</Button>
        <Button className="grow" icon={<Plus size={15} />} onClick={() => navigate(`/a/schemes/new${roleQS}`)}>নতুন স্কিম</Button>
      </div>
      <Note tone="info"><><Lock size={14} className="inline -mt-0.5 mr-1" />নতুন স্কিম তৈরি হলে <b>খসড়া</b> থাকবে — কমিটির সিদ্ধান্ত ও অনুমোদন ছাড়া চালু হবে না (D-34)।</></Note>
      <SectionHead title="স্কিমের ধরন" sub="মাসিক · দৈনিক · মেয়াদি" />
      <p className="text-sm text-txt-2">সুদের হার কোনো স্কিমেই নেই — ক্ষেত্রটি ডেটা মডেলেই অনুপস্থিত (BR-13)।</p>
    </div>
  );
}
