/* JAM-05 · অংশগ্রহণকারী ও যোগদান অনুমোদন — প্রতিশ্রুতি, বকেয়া ও প্রতিকার ধাপ (D-49) */

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, MessageSquare, X } from 'lucide-react';
import { Badge, Button, Card, Chip, Kpi, KpiGrid, SectionHead } from '../../../components/ui';
import { ErrorBanner, SuccessBanner } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { SEED_MEMBERS } from '../../../domain/admin';
import {
  DEMO_EXTRA, JG_PART_ST, jgArrearsOf, jgContribsOf, jgGoalById, jgPartsOf, jgPledgeTotal, jgStepLabel,
  type JPartStatus,
} from '../../../domain/adminJoint';
import { useAdminJg } from '../../../store/adminJointStore';
import { KV, StackedCard, StackHead } from './parts';
import { tk, useRoleQS } from './rcParts';

const mems = [...SEED_MEMBERS.map((m) => ({ id: m.id, name: m.name, mobile: m.mobile })), ...DEMO_EXTRA.map((m) => ({ id: m.id, name: m.name, mobile: '' }))];

export default function JgParts() {
  const { goalId = '' } = useParams();
  const navigate = useNavigate();
  const qs = useRoleQS();
  const { state, approveJoin, rejectJoin, advancePart } = useAdminJg();
  const [tab, setTab] = useState<'all' | JPartStatus>('all');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const g = jgGoalById(state.goals, goalId);
  const parts = jgPartsOf(state.parts, g.id);
  const list = parts.filter((p) => tab === 'all' || p.status === tab);
  const pending = parts.filter((p) => p.status === 'pending');
  const ar = jgArrearsOf(state.goals, state.parts, state.contribs, g.id);

  const run = (fn: () => { ok: boolean; message: string }) => {
    setErr(''); setMsg('');
    const r = fn();
    if (!r.ok) { setErr(r.message); return; }
    setMsg(r.message);
  };

  return (
    <div className="p-4 space-y-3 pb-8">
      <Button size="sm" variant="ghost" icon={<ArrowLeft size={15} />} onClick={() => navigate(`/a/jg/goals/${g.id}${qs}`)}>লক্ষ্যে ফিরুন</Button>

      <KpiGrid>
        <Kpi label="অংশগ্রহণকারী" value={`${bn(parts.filter((p) => p.status !== 'removed').length)}/${bn(g.maxParts)}`} note="সীমা" />
        <Kpi label="সক্রিয়" value={bn(parts.filter((p) => p.status === 'active').length)} tone="ok" note="অবদান চলছে" />
        <Kpi label="অনুমোদন বাকি" value={bn(pending.length)} tone="warn" note="D-49" />
        <Kpi label="বকেয়া" value={bn(ar.length)} tone="warn" note={tk(ar.reduce((s, x) => s + x.gap, 0))} />
      </KpiGrid>

      {msg ? <SuccessBanner title={msg} /> : null}
      {err ? <ErrorBanner>{err}</ErrorBanner> : null}

      {pending.length > 0 ? (
        <>
          <SectionHead title="যোগদান অনুমোদন" sub={`${bn(pending.length)}টি আবেদন · Admin অনুমোদন বাধ্যতামূলক (D-49)`} />
          {pending.map((p) => {
            const m = mems.find((x) => x.id === p.memberId);
            return (
              <StackedCard key={p.memberId} tone="warn" head={<StackHead title={m?.name ?? p.memberId} sub={`${g.code} · আবেদন ${p.joinedAt ?? '—'}`} right={<Badge tone="warn">অপেক্ষমাণ</Badge>} />}
                foot={<div className="flex gap-2">
                  <Button size="sm" icon={<Check size={14} />} onClick={() => run(() => approveJoin(g.id, p.memberId))}>অনুমোদন</Button>
                  <Button size="sm" variant="ghost" icon={<X size={14} />} onClick={() => run(() => rejectJoin(g.id, p.memberId))}>প্রত্যাখ্যান</Button>
                </div>}>
                <KV k="প্রতিশ্রুতি" v={tk(p.pledged)} />
                <KV k="কিস্তি পরিকল্পনা" v={tk(p.install)} />
                <KV k="সদস্য" v={`${p.memberId.toUpperCase()} · ${m?.mobile || '—'}`} />
                <KV k="নোট" v="অনুমোদনের পর সক্রিয় অংশগ্রহণ শুরু; প্রথম কিস্তির তারিখ নির্ধারিত হয়।" />
              </StackedCard>
            );
          })}
        </>
      ) : null}

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <Chip active={tab === 'all'} onClick={() => setTab('all')}>সব ({bn(parts.length)})</Chip>
        {(['active', 'behind', 'invited', 'removed'] as JPartStatus[]).map((k) => (
          <Chip key={k} active={tab === k} onClick={() => setTab(k)}>{JG_PART_ST[k].t.split(' ·')[0]} ({bn(parts.filter((p) => p.status === k).length)})</Chip>
        ))}
      </div>

      <SectionHead title="অংশগ্রহণকারী" sub={`${bn(list.length)} জন · ${tk(jgPledgeTotal(state.parts, g.id))} প্রতিশ্রুতি`} />
      {list.map((p) => {
        const m = mems.find((x) => x.id === p.memberId);
        const paid = jgContribsOf(state.contribs, g.id, p.memberId).reduce((s, c) => s + c.amount, 0);
        const gap = ar.find((x) => x.part.memberId === p.memberId)?.gap ?? 0;
        return (
          <StackedCard key={p.memberId} tone={p.status === 'behind' ? 'warn' : p.status === 'removed' ? 'bad' : ''}
            head={<StackHead title={m?.name ?? p.memberId} sub={`${p.memberId.toUpperCase()} · যোগদান ${p.joinedAt ?? '—'}`}
              right={<Badge tone={JG_PART_ST[p.status].tone}>{JG_PART_ST[p.status].t.split(' ·')[0]}</Badge>} />}
            foot={p.status === 'behind' ? (
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => run(() => advancePart(g.id, p.memberId))}>প্রতিকার ধাপ বাড়ান</Button>
                <a className="min-h-9 px-3 inline-flex items-center gap-1.5 rounded-r-sm border border-line-3 bg-card text-sm font-bold text-txt-2"
                  href={`sms:+88${m?.mobile ?? ''}?body=%E0%A6%85%E0%A6%AC%E0%A6%A6%E0%A6%BE%E0%A6%A8`}><MessageSquare size={13} /> SMS</a>
              </div>
            ) : undefined}>
            <KV k="প্রতিশ্রুতি" v={tk(p.pledged)} />
            <KV k="জমা" v={`${tk(paid)} · ${bn(jgContribsOf(state.contribs, g.id, p.memberId).length)} রসিদ`} />
            {gap ? <KV k="বকেয়া" v={tk(gap)} /> : null}
            {p.status === 'behind' ? <KV k="প্রতিকার" v={`${jgStepLabel(p.step)} · নোটিশ ${p.noticeSent ?? '—'}`} /> : null}
            <KV k="অনুমোদনকারী" v={p.approvedBy ?? '—'} />
          </StackedCard>
        );
      })}
      {list.length === 0 ? <Card><p className="text-sm text-mut">এই তালিকায় কেউ নেই।</p></Card> : null}

      <Card title="নীতি">
        <p className="text-sm text-txt-2">অবদান লক্ষ্য-নির্দিষ্ট তহবিলে যায়, ব্যক্তিগত উত্তোলন নেই (BR-19)। পেছনে থাকলে অনুস্মারক → কমিটি → অংশগ্রহণ বাতিল; কোনো বিলম্ব ফি নেই (D-49)।</p>
      </Card>
    </div>
  );
}
