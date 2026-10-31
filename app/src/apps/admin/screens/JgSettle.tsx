/* JAM-09 · নিষ্পত্তি — মেয়াদোত্তীর্ণ বা সমাপ্ত লক্ষ্যের টাকা ফেরত/রূপান্তর (D-39) */

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Lock } from 'lucide-react';
import { Badge, Button, Card, Kpi, KpiGrid, SectionHead } from '../../../components/ui';
import { ErrorBanner, SuccessBanner, inputClass } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { SEED_MEMBERS } from '../../../domain/admin';
import {
  DEMO_EXTRA, JG_DEADLINE, JG_SETTLE, jgCollected, jgContribsOf, jgGoalById, jgPctOf, jgPaidOut,
} from '../../../domain/adminJoint';
import { useAdminJg } from '../../../store/adminJointStore';
import { KV, StackedCard, StackHead } from './parts';
import { Ladder, PoolRow, tk, useRoleQS } from './rcParts';

const mems = [...SEED_MEMBERS.map((m) => ({ id: m.id, name: m.name })), ...DEMO_EXTRA.map((m) => ({ id: m.id, name: m.name }))];
const APPROVERS = ['নাসরিন আক্তার', 'কামরুল হাসান', 'মোঃ আব্দুল্লাহ'];

export default function JgSettle() {
  const { goalId = '' } = useParams();
  const navigate = useNavigate();
  const qs = useRoleQS();
  const { state, settleApprove, extendGoal } = useAdminJg();
  const [approver, setApprover] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const g = jgGoalById(state.goals, goalId);
  const col = jgCollected(state.contribs, g.id);
  const spend = jgPaidOut(state.disbs, g.id);
  const refundable = Math.max(0, col - spend);
  const contributors = mems
    .map((m) => ({ m, paid: jgContribsOf(state.contribs, g.id, m.id).reduce((s, c) => s + c.amount, 0) }))
    .filter((x) => x.paid > 0);

  const run = (fn: () => { ok: boolean; message: string }) => {
    setErr(''); setMsg('');
    const r = fn();
    if (!r.ok) { setErr(r.message); return; }
    setMsg(r.message);
  };

  return (
    <div className="p-4 space-y-3 pb-8">
      <Button size="sm" variant="ghost" icon={<ArrowLeft size={15} />} onClick={() => navigate(`/a/jg/goals/${g.id}${qs}`)}>লক্ষ্যে ফিরুন</Button>

      <Card>
        <div className="flex items-center justify-between gap-2">
          <div>
            <b>{g.code} · {g.name}</b>
            <div className="text-xs text-mut num">মেয়াদ {g.targetDate} · অগ্রগতি {bn(jgPctOf(state.contribs, g))}%</div>
          </div>
          <Badge tone="warn">{g.status === 'settling' ? 'নিষ্পত্তি চলছে' : g.status === 'expired' ? 'মেয়াদোত্তীর্ণ' : 'নিষ্পত্তি প্রযোজ্য নয়'}</Badge>
        </div>
      </Card>

      {msg ? <SuccessBanner title={msg} /> : null}
      {err ? <ErrorBanner>{err}</ErrorBanner> : null}

      <KpiGrid>
        <Kpi label="সংগৃহীত" value={tk(col)} tone="ok" note={`${bn(contributors.length)} জন অবদানকারী`} />
        <Kpi label="ব্যয়িত" value={tk(spend)} note="প্রমাণসহ" />
        <Kpi label="ফেরতযোগ্য" value={tk(refundable)} tone="warn" note="সংগৃহীত − ব্যয়িত" />
        <Kpi label="সিদ্ধান্ত" value={g.settleDecision ? JG_DEADLINE.find((d) => d[0] === g.settleDecision)?.[1] ?? g.settleDecision : 'ঘোষিত হয়নি'} note="D-39" />
      </KpiGrid>

      <SectionHead title="নিষ্পত্তির ধাপ (৪)" sub="কমিটি → অনুমোদন → সম্পাদন" />
      <Card>
        <Ladder steps={JG_SETTLE.map((label, i) => ({ key: `s${i}`, label }))} active={g.settleAppr ? 's3' : g.status === 'settling' ? 's2' : 's0'} />
      </Card>

      <SectionHead title="সদস্যভিত্তিক ফেরত" sub="আনুপাতিক — অবদান অনুযায়ী" />
      <Card>
        {contributors.map(({ m, paid }) => (
          <div key={m.id} className="flex items-center justify-between gap-2 border-b border-line-2 last:border-b-0 py-2">
            <div>
              <div className="text-sm font-bold">{m.name}</div>
              <div className="text-xs text-mut num">{m.id.toUpperCase()} · জমা {tk(paid)}</div>
            </div>
            <b className="num text-sm">{tk(col ? Math.round((paid / col) * refundable) : 0)}</b>
          </div>
        ))}
        {contributors.length === 0 ? <p className="text-sm text-mut">এই লক্ষ্যে কোনো অবদান নেই।</p> : null}
        <p className="text-xs text-mut mt-2">ফেরত কেবল কমিটির লিখিত সিদ্ধান্ত ও অনুমোদনের পর; ব্যক্তিগত উত্তোলন নয় (BR-19)।</p>
      </Card>

      <Card title="অনুমোদন" sub="maker ≠ checker (BR-04)">
        {g.status === 'settling' && !g.settleAppr ? (
          <>
            <PoolRow label="প্রস্তুতকারী" value={g.settleBy ?? '—'} />
            <div className="mt-3">
              <label htmlFor="jg-appr" className="block text-sm font-bold text-txt-2 mb-1.5">অনুমোদনকারী</label>
              <select id="jg-appr" className={inputClass()} value={approver} onChange={(e) => setApprover(e.target.value)}>
                <option value="">— বাছাই করুন —</option>
                {APPROVERS.map((a) => <option key={a} value={a}>{a}</option>)}
                <option value={g.settleBy ?? ''}>{g.settleBy} — নিজে (নিষিদ্ধ) ✗</option>
              </select>
            </div>
            <Button block className="mt-3" icon={<CheckCircle2 size={16} />} onClick={() => run(() => settleApprove(g.id, approver))}>নিষ্পত্তি অনুমোদন করুন</Button>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Button size="sm" variant="ghost" onClick={() => run(() => extendGoal(g.id))}>মেয়াদ বাড়ান</Button>
              <Button size="sm" variant="ghost" onClick={() => navigate(`/a/jg/goals/${g.id}/disbursements${qs}`)}>ভাউচার দেখুন</Button>
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <KV k="অবস্থা" v={g.status === 'closed' ? 'সমাপ্ত ও নিষ্পত্তি' : 'অনুমোদনের অপেক্ষায়'} />
            <KV k="প্রস্তুতকারী" v={g.settleBy ?? '—'} />
            <KV k="অনুমোদনকারী" v={g.settleAppr ?? 'বাকি'} />
            <KV k="নিষ্পত্তির তারিখ" v={g.settledOn ?? '—'} />
            {g.status !== 'closed' ? <Button block onClick={() => run(() => extendGoal(g.id))}>মেয়াদ ছয় মাস বাড়ান (একবার)</Button> : null}
          </div>
        )}
      </Card>

      <Card title="নীতিগত সীমা">
        <PoolRow label="ফেরতের ভিত্তি" value="অবদান অনুযায়ী আনুপাতিক" tone="ok" />
        <div className="mt-2"><PoolRow label="সাধারণ সঞ্চয়ে রূপান্তর" value="D-37 — আলাদা কার্ডে, মোট সঞ্চয়ে নয়" tone="warn" /></div>
        <div className="mt-2"><PoolRow label="মেয়াদ বাড়ানো" value="একবারই, নতুন নোটিশসহ" tone="warn" /></div>
        <p className="text-xs text-mut mt-2 flex items-start gap-1"><Lock size={13} className="mt-0.5" /> নিষ্পত্তির পর রেকর্ড অপরিবর্তনীয়; ভুল হলে রিভার্সাল-জোড়া এন্ট্রি।</p>
      </Card>

      <StackedCard tone="" head={<StackHead title="সিদ্ধান্তের রেফারেন্স" sub={`${g.committee} · ${g.note}`} right={<Badge tone="neutral">D-39</Badge>} />}>
        <KV k="লক্ষ্যের মেয়াদ" v={g.targetDate} />
        <KV k="নীতি" v={g.deadlinePolicy.map((d) => JG_DEADLINE.find((x) => x[0] === d)?.[1]).join(' · ')} />
      </StackedCard>
    </div>
  );
}
