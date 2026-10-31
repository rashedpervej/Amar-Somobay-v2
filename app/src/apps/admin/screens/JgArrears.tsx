/* JAM-06 · বকেয়া ও অবদান সংগ্রহ — প্রত্যাশিত বনাম জমা, রিমাইন্ডার ও কাউন্টার এন্ট্রি */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Wallet } from 'lucide-react';
import { Badge, Button, Card, Chip, Kpi, KpiGrid, SectionHead } from '../../../components/ui';
import { ErrorBanner, Field, SuccessBanner, inputClass } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { SEED_MEMBERS } from '../../../domain/admin';
import {
  DEMO_EXTRA, jgAllArrears, jgCollected, jgExpectedMonth, jgGotThisMonth, jgStepLabel, jgGoalById,
} from '../../../domain/adminJoint';
import { useAdminJg } from '../../../store/adminJointStore';
import { KV, StackedCard, StackHead } from './parts';
import { tk, useRoleQS } from './rcParts';

const mems = [...SEED_MEMBERS.map((m) => ({ id: m.id, name: m.name, mobile: m.mobile })), ...DEMO_EXTRA.map((m) => ({ id: m.id, name: m.name, mobile: '' }))];

export default function JgArrears() {
  const navigate = useNavigate();
  const qs = useRoleQS();
  const { state, recordContrib } = useAdminJg();
  const [sel, setSel] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [channel, setChannel] = useState<'cash_office' | 'bkash' | 'bank'>('cash_office');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const all = jgAllArrears(state.goals, state.parts, state.contribs);
  const expMonth = jgExpectedMonth(state.goals, state.parts);
  const gotMonth = jgGotThisMonth(state.contribs);
  const [goalId, memberId] = sel.split('|');

  const submit = () => {
    setErr(''); setMsg('');
    if (!sel) { setErr('কোন সদস্যের অবদান তা বাছাই করুন'); return; }
    const r = recordContrib(goalId, memberId, Number(amount), channel);
    if (!r.ok) { setErr(r.message); return; }
    setMsg(r.message);
    setAmount('');
    setSel('');
  };

  return (
    <div className="p-4 space-y-3 pb-8">
      <KpiGrid>
        <Kpi label="এই মাসের সংগ্রহ" value={`${bn(expMonth ? Math.round((gotMonth / expMonth) * 100) : 0)}%`} tone="ok" note={`${tk(gotMonth)} / ${tk(expMonth)}`} />
        <Kpi label="বকেয়া সদস্য" value={`${bn(all.length)} জন`} tone="warn" note="সব লক্ষ্যে" />
        <Kpi label="বকেয়ার অঙ্ক" value={tk(all.reduce((s, x) => s + x.gap, 0))} tone="warn" note="প্রত্যাশিত − জমা" />
        <Kpi label="মোট সংগ্রহ" value={tk(state.contribs.reduce((s, c) => s + c.amount, 0))} note={`${bn(state.contribs.length)} রসিদ`} />
      </KpiGrid>

      {msg ? <SuccessBanner title={msg} /> : null}
      {err ? <ErrorBanner>{err}</ErrorBanner> : null}

      <SectionHead title="অবদান রেকর্ড" sub="কাউন্টারে নগদ/ওয়ালেট/ব্যাংক — লক্ষ্য-নির্দিষ্ট তহবিলে (BR-19)" />
      <Card>
        <div className="space-y-3">
          <Field label="অংশগ্রহণকারী ও লক্ষ্য" required hint="শুধু সক্রিয়/পেছনে থাকা অংশগ্রহণকারী">
            {(id) => (
              <select id={id} className={inputClass()} value={sel} onChange={(e) => setSel(e.target.value)}>
                <option value="">— বাছাই করুন —</option>
                {all.map((x) => (
                  <option key={`${x.goal.id}|${x.part.memberId}`} value={`${x.goal.id}|${x.part.memberId}`}>
                    {mems.find((m) => m.id === x.part.memberId)?.name ?? x.part.memberId} · {x.goal.code} · বাকি {tk(x.gap)}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="অঙ্ক (৳)" required hint="একবারে সর্বোচ্চ ৳১,০০,০০০">
            {(id) => <input id={id} type="number" className={inputClass()} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="1000" />}
          </Field>
          <div>
            <div className="text-sm font-bold text-txt-2 mb-1.5">মাধ্যম</div>
            <div className="flex flex-wrap gap-2">
              {([['cash_office', 'অফিস কাউন্টার'], ['bkash', 'বিকাশ'], ['bank', 'ব্যাংক']] as const).map(([k, t]) => (
                <Chip key={k} active={channel === k} onClick={() => setChannel(k)}>{t}</Chip>
              ))}
            </div>
          </div>
          <Button block icon={<Wallet size={16} />} onClick={submit} disabled={!sel || !Number(amount)}>অবদান রেকর্ড করুন</Button>
          <p className="text-xs text-mut">রসিদ স্বয়ংক্রিয় (JC-2610-####) — ব্যক্তিগত অ্যাকাউন্টে নয়, লক্ষ্য তহবিলে জমা।</p>
        </div>
      </Card>

      <SectionHead title="বকেয়া তালিকা" sub={`${bn(all.length)} জন · অগ্রাধিকার অনুযায়ী`} />
      {all.length === 0 ? <Card><p className="text-sm text-ok-ink font-bold">কোনো বকেয়া নেই — সবাই সময়মতো অবদান দিয়েছেন।</p></Card> : all.map((x) => {
        const m = mems.find((y) => y.id === x.part.memberId);
        return (
          <StackedCard key={`${x.goal.id}-${x.part.memberId}`} tone="warn"
            head={<StackHead title={m?.name ?? x.part.memberId} sub={`${x.goal.code} · ${x.goal.name}`} right={<Badge tone="warn">{tk(x.gap)}</Badge>} />}
            foot={<div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => { setSel(`${x.goal.id}|${x.part.memberId}`); setAmount(String(x.gap)); }}>
                অবদান নিন
              </Button>
              <a className="min-h-9 px-3 inline-flex items-center gap-1.5 rounded-r-sm border border-line-3 bg-card text-sm font-bold text-txt-2"
                href={`sms:+88${m?.mobile ?? ''}?body=%E0%A6%85%E0%A6%AC%E0%A6%A6%E0%A6%BE%E0%A6%A8%20%E0%A6%AC%E0%A6%BE%E0%A6%95%E0%A6%BF`}><MessageSquare size={13} /> SMS</a>
              <Button size="sm" variant="ghost" onClick={() => navigate(`/a/jg/goals/${x.goal.id}/parts${qs}`)}>প্রোফাইল</Button>
            </div>}>
            <KV k="প্রত্যাশিত" v={tk(x.expected)} />
            <KV k="জমা" v={tk(x.paid)} />
            <KV k="পার্থক্য" v={tk(x.gap)} />
            <KV k="প্রতিকার" v={x.part.status === 'behind' ? jgStepLabel(x.part.step) : 'পেছনে পড়েনি'} />
            <KV k="প্রতিশ্রুতি" v={tk(x.part.pledged)} />
          </StackedCard>
        );
      })}

      <Card title="নীতি">
        <p className="text-sm text-txt-2">অবদান না দিলে: অনুস্মারক নোটিশ → কমিটির কাছে প্রতিবেদন → অংশগ্রহণ বাতিল (কারণ লিপিবদ্ধ)। কোনো বিলম্ব ফি নেই — D-49।</p>
        <p className="text-xs text-mut mt-1">লক্ষ্য: {bn(state.goals.filter((g) => g.status === 'active' || g.status === 'forming').length)}টি · সংগ্রহ {tk(jgCollected(state.contribs, jgGoalById(state.goals, state.goals[0].id).id))} (প্রথম লক্ষ্য)</p>
      </Card>
    </div>
  );
}
