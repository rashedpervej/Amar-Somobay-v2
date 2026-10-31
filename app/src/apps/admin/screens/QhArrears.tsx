/* QAM-14 · বকেয়া ও ডিফল্ট ব্যবস্থাপনা — শ্রেণিকরণ (D-44) ও ধাপভিত্তিক প্রতিকারের ল্যাডার
   ⚠️ কোথাও বিলম্ব ফি নেই; পুনর্গঠনে মোট = মূলধন (D-41 · D-53)। */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellRing, ChevronRight, MessageSquare, RefreshCw, Scale, Trash2, TriangleAlert, Users } from 'lucide-react';
import { Badge, Button, Card, Kpi, KpiGrid, SectionHead } from '../../../components/ui';
import { Accordion, KV, Note } from './parts';
import { QhZero } from './qhParts';
import { bn } from '../../../lib/bn';
import { SEED_MEMBERS } from '../../../domain/admin';
import {
  QH_CLASS, qhArrearsOf, qhClassOf, qhDaysLate, qhInsts, qhOutstanding, qhProductById, type QhLoan,
} from '../../../domain/adminQard';
import { useAdminQh } from '../../../store/adminQardStore';
import { tk, useRoleQS } from './rcParts';

const LADDER = ['স্মারক', 'যোগাযোগ', 'পুনর্গঠন', 'কমিটি', 'write-off'];
const stageOf = (days: number) => (days <= 7 ? 0 : days <= 30 ? 1 : days <= 120 ? 2 : days <= 180 ? 3 : 4);

export default function QhArrears() {
  const navigate = useNavigate();
  const qs = useRoleQS();
  const { state } = useAdminQh();
  const [msg, setMsg] = useState('');
  const [ladder, setLadder] = useState<string | null>(null);

  const bad: QhLoan[] = state.loans
    .filter((l) => l.status === 'arrears')
    .slice()
    .sort((a, b) => qhDaysLate(b, state.repayments) - qhDaysLate(a, state.repayments));
  const total = bad.reduce((s, l) => s + qhArrearsOf(l, state.repayments), 0);

  return (
    <div className="p-4 space-y-3 pb-8">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="warn"><TriangleAlert size={12} /> {bn(bad.length)}টি বকেয়া</Badge>
        <Badge tone="neutral">মোট {tk(total)}</Badge>
        <QhZero />
      </div>

      <KpiGrid>
        <Kpi label="বকেয়া ঋণ" value={bn(bad.length)} unit="টি" tone="warn" note="বিলম্বের ক্রমে" />
        <Kpi label="বকেয়া অঙ্ক" value={`৳${bn(total)}`} tone="warn" note="কোনো বিলম্ব ফি নেই (D-41)" />
        <Kpi label="সন্দেহজনক+" value={bn(bad.filter((l) => ['doubt', 'loss'].includes(qhClassOf(l, state.repayments))).length)} unit="টি" tone="danger" note="৯১+ দিন (D-44)" />
        <Kpi label="write-off প্রস্তাব" value={bn(state.writeoffs.filter((w) => w.status === 'proposed').length)} unit="টি" tone="warn" note="কমিটি অনুমোদন বাকি" />
      </KpiGrid>

      {msg ? <div className="rounded-r-sm bg-ok-bg border border-ok-bd text-ok-ink px-3 py-2 text-sm">{msg}</div> : null}

      <SectionHead title="বকেয়া তালিকা" sub="বিলম্বের দিন অনুযায়ী — সবচেয়ে পুরোনো আগে" />
      {bad.length === 0 ? <Card><p className="text-sm text-mut">কোনো বকেয়া নেই — সব ঋণ নিয়মিত।</p></Card> : bad.map((l) => {
        const m = SEED_MEMBERS.find((x) => x.id === l.memberId);
        const p = qhProductById(state.products, l.product);
        const days = qhDaysLate(l, state.repayments);
        const cls = qhClassOf(l, state.repayments);
        const stage = stageOf(days);
        const insts = qhInsts(l, state.repayments).filter((i) => i.status === 'overdue');
        const open = ladder === l.id;
        return (
          <div key={l.id} className="rounded-r-md border border-line bg-card shadow-sh-1 overflow-hidden">
            <div className="px-3.5 py-3">
              <div className="flex items-start gap-2">
                <span className="shrink-0 size-9 rounded-r-pill bg-danger-bg text-danger-ink grid place-items-center font-extrabold">{m?.photo ?? 'স'}</span>
                <div className="grow min-w-0">
                  <div className="text-body font-extrabold truncate">{m?.name}</div>
                  <div className="text-xs text-mut num">{l.no} · {p?.code} · {bn(days)} দিন</div>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <Badge tone={QH_CLASS[cls].tone}>{QH_CLASS[cls].t}</Badge>
                    <Badge tone="danger">{bn(insts.length)}টি কিস্তি বাকেয়া</Badge>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="num text-body font-extrabold">{tk(qhArrearsOf(l, state.repayments))}</div>
                  <div className="text-[11px] text-mut">বকেয়া</div>
                </div>
              </div>

              <div className="mt-2 flex items-center gap-1">
                {LADDER.map((s, i) => (
                  <div key={s} className={`grow min-w-0 rounded-r-sm border px-1 py-1 text-center text-[10px] font-bold ${i < stage ? 'bg-ok-bg border-ok-bd text-ok-ink' : i === stage ? 'bg-warn-bg border-warn-bd text-warn-ink' : 'bg-card-2 border-line-2 text-mut'}`}>
                    {s}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2">
                <Button size="sm" variant="secondary" icon={<BellRing size={14} />} onClick={() => setMsg(`${m?.name} — স্মারক নোটিশ পাঠানো হয়েছে (ডেমো); কোনো জরিমানা যোগ হয়নি`)}>স্মারক</Button>
                <Button size="sm" variant="secondary" icon={<MessageSquare size={14} />} onClick={() => setMsg(`${m?.name} — যোগাযোগ রেকর্ড হয়েছে (ডেমো): ফোন ${m?.mobile}`)}>যোগাযোগ</Button>
                <Button size="sm" variant="ghost" icon={<RefreshCw size={14} />} onClick={() => navigate(`/a/qh/loans/${l.id}${qs}`)}>পুনর্গঠন</Button>
                <Button size="sm" variant="ghost" icon={<ChevronRight size={14} />} onClick={() => setLadder(open ? null : l.id)}>{open ? 'গোপন করুন' : 'বিস্তারিত'}</Button>
              </div>

              {open ? (
                <div className="mt-2 rounded-r-sm bg-card-2 border border-line-2 px-2.5 py-2 text-xs">
                  <div className="flex justify-between py-0.5"><span className="text-mut">মূলধন</span><b className="num">{tk(l.principal)}</b></div>
                  <div className="flex justify-between py-0.5"><span className="text-mut">বাকি</span><b className="num">{tk(qhOutstanding(l, state.repayments, state.writeoffs))}</b></div>
                  <div className="flex justify-between py-0.5"><span className="text-mut">বকেয়া কিস্তি</span><b>{insts.map((i) => bn(i.no)).join(', ') || '—'}</b></div>
                  <div className="flex justify-between py-0.5"><span className="text-mut">প্রতিকার</span><b>{['স্মারক পাঠান', 'ফোন/সরাসরি যোগাযোগ', 'মেয়াদ পুনর্গঠন (সুদ ৳০)', 'কমিটি সিদ্ধান্ত', 'write-off (BR-23)'][stage]}</b></div>
                </div>
              ) : null}
            </div>
          </div>
        );
      })}

      <SectionHead title="ধাপভিত্তিক প্রতিকার" sub="স্মারক → যোগাযোগ → পুনর্গঠন → কমিটি → write-off" />
      <Card>
        <div className="space-y-2">
          {[
            ['স্মারক', 'SMS/অ্যাপ নোটিশ — কোনো চার্জ নেই', 'ok'],
            ['যোগাযোগ', 'সংগ্রহক ফোন/সরাসরি — রেকর্ড সংরক্ষিত', 'ok'],
            ['পুনর্গঠন', 'মেয়াদ বাড়িয়ে কিস্তি ছোট — মোট = মূলধন (D-53)', 'warn'],
            ['কমিটি', 'কমিটি রেফারেন্স ও লিখিত সিদ্ধান্ত বাধ্যতামূলক', 'warn'],
            ['write-off', 'ORG_ADMIN + নিরীক্ষক অ্যালার্ট — ক্ষতি হিসেবে দৃশ্যমান (BR-23)', 'danger'],
          ].map(([t, s, tone], i) => (
            <div key={t} className="flex items-start gap-2">
              <span className={`shrink-0 size-6 rounded-r-pill grid place-items-center text-[11px] font-extrabold ${tone === 'danger' ? 'bg-danger-bg text-danger-ink' : tone === 'warn' ? 'bg-warn-bg text-warn-ink' : 'bg-ok-bg text-ok-ink'}`}>{bn(i + 1)}</span>
              <div><b className="text-sm">{t}</b><p className="text-xs text-mut">{s}</p></div>
            </div>
          ))}
        </div>
        <div className="mt-2"><Note tone="warn"><Scale size={13} className="inline mr-1" /> কোথাও বিলম্ব ফি নেই (D-41) — বকেয়া শুধু কিস্তির মূলধন।</Note></div>
      </Card>

      <Accordion title="সুদমুক্ত পুনর্গঠন প্রস্তাব" sub="সদস্যের সম্মতি + কমিটি রেফারেন্স বাধ্যতামূলক">
        <KV k="কী বদলায়" v="শুধু মেয়াদ ও কিস্তির অঙ্ক — মোট ফেরত একই মূলধন" />
        <KV k="কী যোগ হয় না" v="কোনো সুদ, সার্ভিস চার্জ বা বিলম্ব ফি (BR-20)" />
        <KV k="প্রয়োজন" v="সদস্যের সম্মতি · কমিটি CM-YYMM-## · নতুন ছক" />
        <KV k="খাতা" v="পুনর্গঠনের কোনো লাভ-ক্ষতি এন্ট্রি নেই" />
        <div className="mt-2 text-xs text-mut"><Users size={12} className="inline mr-1" />কমিটির সিদ্ধান্ত ছাড়া কিস্তি কাঠামো বদলানো যায় না।</div>
      </Accordion>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" icon={<Users size={15} />} onClick={() => navigate(`/a/qh/loans${qs}`)}>ঋণ হাব</Button>
        <Button icon={<Trash2 size={15} />} variant="ghost" onClick={() => navigate(`/a/qh/writeoff${qs}`)}>Write-off</Button>
        <Button variant="ghost" onClick={() => navigate(`/a/qh/reports${qs}`)}>বকেয়া রিপোর্ট</Button>
        <Button variant="ghost" disabled={!bad.length} onClick={() => navigate(`/a/qh/loans/${bad[0]?.id ?? ''}${qs}`)}>প্রথম ঋণ</Button>
      </div>
    </div>
  );
}
