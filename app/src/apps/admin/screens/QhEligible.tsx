/* QAM-05 · যোগ্য সদস্য তালিকা — যোগ্য / শর্তসাপেক্ষ / আটকেছে (D-59) */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarClock, ChevronDown, ChevronUp, Scale, ShieldCheck, UserCog, Users } from 'lucide-react';
import { Badge, Button, Card, Chip, Chipset, Kpi, KpiGrid, SectionHead } from '../../../components/ui';
import { Accordion, KV, Note } from './parts';
import { QhZero } from './qhParts';
import { bn } from '../../../lib/bn';
import { SEED_ACCOUNTS, SEED_MEMBERS, accountsOf } from '../../../domain/admin';
import {
  QH_BLOCK, QH_ELIG_ST, QH_SRC, qhCapBreakdown, qhDate, qhMaxAmount, qhPoolState, qhProductById,
  type QhEligible,
} from '../../../domain/adminQard';
import { useAdminQh } from '../../../store/adminQardStore';
import { tk, useRoleQS } from './rcParts';

const savingsOf = (id: string) => accountsOf(SEED_ACCOUNTS, id).reduce((s, a) => s + a.posted, 0);

export default function QhEligible() {
  const navigate = useNavigate();
  const qs = useRoleQS();
  const { state } = useAdminQh();
  const [tab, setTab] = useState<'all' | QhEligible['result']>('all');
  const [open, setOpen] = useState<string | null>(null);

  const list = state.eligible.filter((e) => tab === 'all' || e.result === tab);
  const pool = qhPoolState(state.window, state.loans, state.apps);
  const selected = state.eligible.find((e) => e.memberId === open);

  return (
    <div className="p-4 space-y-3 pb-8">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="brand"><Users size={12} /> {bn(state.eligible.length)} জন মূল্যায়িত</Badge>
        <Badge tone="neutral">নিয়ম v3</Badge>
        <QhZero />
      </div>

      <KpiGrid>
        <Kpi label="যোগ্য" value={bn(state.eligible.filter((e) => e.result === 'eligible').length)} unit="জন" tone="ok" note="আবেদন করতে পারবেন" />
        <Kpi label="শর্তসাপেক্ষ" value={bn(state.eligible.filter((e) => e.result === 'conditional').length)} unit="জন" tone="warn" note="এক্সেপশন · ম্যানুয়াল অনুমোদন" />
        <Kpi label="আটকেছে" value={bn(state.eligible.filter((e) => e.result === 'blocked').length)} unit="জন" note="কারণ-কোডসহ" />
        <Kpi label="ম্যানুয়াল" value={bn(state.eligible.filter((e) => e.source !== 'rule').length)} unit="জন" tone="warn" note="D-59 · অডিটে চিহ্নিত" />
      </KpiGrid>

      <Chipset>
        <Chip active={tab === 'all'} onClick={() => setTab('all')}>সব ({bn(state.eligible.length)})</Chip>
        <Chip active={tab === 'eligible'} onClick={() => setTab('eligible')}>যোগ্য ({bn(state.eligible.filter((e) => e.result === 'eligible').length)})</Chip>
        <Chip active={tab === 'conditional'} onClick={() => setTab('conditional')}>শর্তসাপেক্ষ ({bn(state.eligible.filter((e) => e.result === 'conditional').length)})</Chip>
        <Chip active={tab === 'blocked'} onClick={() => setTab('blocked')}>আটকেছে ({bn(state.eligible.filter((e) => e.result === 'blocked').length)})</Chip>
      </Chipset>

      <div className="space-y-2">
        {list.map((e) => {
          const m = SEED_MEMBERS.find((x) => x.id === e.memberId);
          const isOpen = open === e.memberId;
          return (
            <div key={e.memberId} className="rounded-r-md border border-line bg-card shadow-sh-1 overflow-hidden">
              <button type="button" onClick={() => setOpen(isOpen ? null : e.memberId)} className="min-h-tap w-full text-left px-3.5 py-3">
                <div className="flex items-start gap-2.5">
                  <span className="shrink-0 size-10 rounded-r-pill bg-green-100 text-green-800 grid place-items-center font-extrabold">{m?.photo ?? 'স'}</span>
                  <div className="grow min-w-0">
                    <div className="text-body font-extrabold truncate">{m?.name ?? e.memberId}</div>
                    <div className="text-xs text-mut num">{m?.no} · {m?.route} · {m?.mobile}</div>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      <Badge tone={QH_ELIG_ST[e.result].tone}>{QH_ELIG_ST[e.result].t}</Badge>
                      <Badge tone={QH_SRC[e.source].tone}>{QH_SRC[e.source].t}</Badge>
                      <Badge tone="neutral">সীমা {tk(e.maxAmount)}</Badge>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="num text-body font-extrabold">{tk(e.maxAmount)}</div>
                    <div className="text-[11px] text-mut">সর্বোচ্চ</div>
                    {isOpen ? <ChevronUp size={16} className="text-mut ml-auto mt-1" /> : <ChevronDown size={16} className="text-mut ml-auto mt-1" />}
                  </div>
                </div>
              </button>
              {isOpen ? (
                <div className="px-3.5 pb-3 border-t border-line-2 pt-2">
                  <div className="flex flex-wrap gap-1.5">
                    {e.reasons.length ? e.reasons.map((c) => (
                      <Badge key={c} tone={c.includes('-W-') ? 'warn' : 'danger'}>{c} · {QH_BLOCK[c]?.a ?? 'সতর্কতা'}</Badge>
                    )) : <Badge tone="ok">কোনো বাধা নেই</Badge>}
                  </div>
                  <p className="text-xs text-mut mt-2 leading-relaxed">{e.note}</p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-r-sm bg-card-2 border border-line-2 px-2 py-1.5">
                      <i className="not-italic text-mut block">মূল্যায়ন</i><b>{qhDate(e.evaluatedAt)}</b>
                    </div>
                    <div className="rounded-r-sm bg-card-2 border border-line-2 px-2 py-1.5">
                      <i className="not-italic text-mut block">বৈধতা</i><b>{qhDate(e.validUntil)}</b>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Button size="sm" variant="secondary" icon={<UserCog size={14} />} onClick={() => navigate(`/a/members/${e.memberId}${qs}`)}>সদস্য ৩৬০°</Button>
                    <Button size="sm" variant="ghost" icon={<ArrowRight size={14} />} onClick={() => navigate(`/a/qh/rules${qs}`)}>এক্সেপশন</Button>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
        {list.length === 0 ? <Card><p className="text-sm text-mut">এই গ্রুপে কোনো সদস্য নেই।</p></Card> : null}
      </div>

      <Note tone="info">শুধু Admin-অনুমোদিত সক্রিয় সদস্য তালিকায় আসেন (BR-21)। ফিল্টার চিপে উৎস (নিয়ম/ম্যানুয়াল/এক্সেপশন) দেখা যায়।</Note>

      {selected ? (
        <>
          <SectionHead title="সীমা গণনার ভাঙ্গন (§৭.৭)" sub={`${SEED_MEMBERS.find((m) => m.id === selected.memberId)?.name} · ${qhProductById(state.products, 'qhp1')?.code}`} />
          <Card>
            {qhCapBreakdown(qhProductById(state.products, 'qhp1')!, savingsOf(selected.memberId), pool.available, selected.maxAmount).map((c) => (
              <KV key={c.label} k={c.label} v={`${tk(c.value)} · ${c.note}`} />
            ))}
            <KV k="চূড়ান্ত সীমা (min)" v={<b className="text-green-800">{tk(qhMaxAmount(qhProductById(state.products, 'qhp1')!, savingsOf(selected.memberId), pool.available, selected.maxAmount))}</b>} strong />
            <p className="text-xs text-mut mt-2"><ShieldCheck size={12} className="inline mr-1" />সব অঙ্ক মূলধন — কোনো সুদ বা ফি এই হিসাবে নেই (BR-20)।</p>
          </Card>
          <Card title="আবেদনের ইতিহাস" sub={`${bn(state.apps.filter((a) => a.memberId === selected.memberId).length)}টি আবেদন`}>
            {state.apps.filter((a) => a.memberId === selected.memberId).map((a) => (
              <button key={a.id} type="button" onClick={() => navigate(`/a/qh/applications/${a.id}${qs}`)} className="min-h-tap w-full text-left border-b border-line-2 last:border-b-0 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold num">{a.no}</span>
                  <span className="text-sm num">{tk(a.amount)}</span>
                </div>
                <div className="text-xs text-mut">{qhDate(a.submittedAt)} · {a.status === 'review' ? 'পর্যালোচনায়' : a.status === 'approved' ? 'অনুমোদিত' : a.status === 'disbursed' ? 'বিতরণ সম্পন্ন' : a.status === 'returned' ? 'তথ্য চেয়ে ফেরত' : 'প্রত্যাখ্যাত'}</div>
              </button>
            ))}
          </Card>
        </>
      ) : null}

      <Accordion title="সীমা ও নিয়মের সারাংশ" sub="D-52 · D-54 · D-59">
        <KV k="এক সদস্যের সক্রিয় ঋণ" v="সর্বোচ্চ ১টি (D-51)" />
        <KV k="সীমা" v="min(পণ্য, সঞ্চয়ের ৫০%, পুল, মূল্যায়ন)" />
        <KV k="ম্যানুয়াল এক্সেপশন" v="ORG_ADMIN · কমিটি রেফারেন্স বাধ্যতামূলক (D-59)" />
        <KV k="অগ্রাধিকার" v="প্রয়োজন → ওয়েটলিস্ট → সদস্যত্বকাল → জমার ধারা (D-52)" />
        <div className="mt-2 flex items-center gap-1.5 text-xs text-mut"><Scale size={13} /> যোগ্যতা কেবল নিয়ম ইঞ্জিন থেকে — হাতে লেখা যায় না।</div>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-mut"><CalendarClock size={13} /> মূল্যায়ন ৭ দিনে মেয়াদোত্তীর্ণ — পুনর্মূল্যায়ন স্বয়ংক্রিয়।</div>
      </Accordion>
    </div>
  );
}
