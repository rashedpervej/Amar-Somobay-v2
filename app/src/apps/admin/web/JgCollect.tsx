import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Card, DataTable } from '../../../components/ui';
import { inputCls } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdminJg } from '../../../store/adminJointStore';
import { rcMembers } from '../../../store/adminRoscaStore';
import {
  jgArrearsOf, jgChannelLabel, jgCollected, jgContribsOf, jgGoalById, jgPartsOf, jgPendingJoins, jgPctOf,
} from '../../../domain/adminJoint';
import { Note, Page, StatBar } from './webParts';

const mem = (id: string) => rcMembers.find((m) => m.id === id)?.name ?? id;

export default function JgCollect() {
  const s = useAdminJg();
  const nav = useNavigate();
  const open = s.state.goals.filter((g) => g.status !== 'closed' && g.status !== 'settling');
  const [goal, setGoal] = useState(open[0]?.id ?? '');
  const g = jgGoalById(s.state.goals, goal);
  const parts = jgPartsOf(s.state.parts, g.id).filter((p) => p.status === 'active' || p.status === 'behind');
  const [member, setMember] = useState(parts[0]?.memberId ?? '');
  const [amount, setAmount] = useState(String(g.monthly ?? g.monthlyMin ?? 1000));
  const [channel, setChannel] = useState<'cash_office' | 'bkash' | 'bank'>('cash_office');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const queue = jgArrearsOf(s.state.goals, s.state.parts, s.state.contribs, g.id);
  const cs = jgContribsOf(s.state.contribs, g.id).slice().reverse();

  const submit = () => {
    const r = s.recordContrib(g.id, member, Number(amount), channel);
    if (!r.ok) { setErr(r.message); setMsg(''); return; }
    setErr(''); setMsg(r.message);
  };

  return (
    <Page title="অবদান সংগ্রহ ও বকেয়া" sub="লক্ষ্য-নির্দিষ্ট তহবিল · রসিদ · কোনো ব্যক্তিগত উত্তোলন নেই (BR-19)"
      back="/w/jg"
      right={<Button size="sm" variant="secondary" onClick={() => nav('/w/jg/join')}>যোগদান</Button>}>
      {err && <Note tone="warn">{err}</Note>}
      {msg && <Note tone="ok">{msg}</Note>}

      <div className="grid gap-3 md:grid-cols-3">
        <label className="block"><span className="text-sm font-bold">লক্ষ্য</span>
          <select value={goal} onChange={(e) => { setGoal(e.target.value); setMember(''); }} className={`${inputCls} mt-1`}>
            {open.map((x) => <option key={x.id} value={x.id}>{x.code} · {x.name}</option>)}
          </select>
        </label>
        <label className="block"><span className="text-sm font-bold">সদস্য</span>
          <select value={member} onChange={(e) => setMember(e.target.value)} className={`${inputCls} mt-1`}>
            <option value="">— বাছাই —</option>
            {parts.map((p) => <option key={p.memberId} value={p.memberId}>{mem(p.memberId)} · জমা ৳{bn(p.paid)}</option>)}
          </select>
        </label>
        <label className="block"><span className="text-sm font-bold">অঙ্ক (৳)</span>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className={`${inputCls} mt-1 num`} />
        </label>
      </div>

      <StatBar items={[
        { k: 'সংগৃহীত', v: `৳${bn(jgCollected(s.state.contribs, g.id))}`, tone: 'ok' },
        { k: 'অগ্রগতি', v: `${bn(Math.min(100, jgPctOf(s.state.contribs, g)))}%` },
        { k: 'বকেয়া জন', v: bn(queue.length), tone: queue.length ? 'warn' : 'ok' },
        { k: 'অপেক্ষমাণ যোগদান', v: bn(jgPendingJoins(s.state.parts).filter((p) => p.goal === g.id).length) },
      ]} />

      <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card title="অবদান এন্ট্রি" sub="একবারে সর্বোচ্চ ৳১,০০,০০০">
          <div className="space-y-3">
            <div>
              <span className="text-sm font-bold">মাধ্যম</span>
              <div className="grid gap-1.5 mt-1">
                {(['cash_office', 'bkash', 'bank'] as const).map((k) => (
                  <button key={k} type="button" onClick={() => setChannel(k)}
                    className={`min-h-10 rounded-r-sm border px-3 text-left text-sm ${channel === k ? 'border-green-600 bg-green-050 font-bold' : 'border-line-3 bg-card'}`}>
                    {jgChannelLabel(k)}
                  </button>
                ))}
              </div>
            </div>
            <Button block onClick={submit}>অবদান রেকর্ড করুন</Button>
            <p className="text-xs text-mut">রসিদ নম্বর স্বয়ংক্রিয় (JC-2610-####); একই রসিদ দুইবার নয়।</p>
            <div className="rounded-r-sm border border-line p-2.5 text-sm">
              <span className="text-xs text-mut block">নির্বাচিত সদস্যের প্রতিশ্রুতি</span>
              <b>{parts.find((p) => p.memberId === member)?.pledged ? `৳${bn(parts.find((p) => p.memberId === member)?.pledged ?? 0)}` : '—'}</b>
              <span className="block text-xs text-mut mt-1">জমা: ৳{bn(parts.find((p) => p.memberId === member)?.paid ?? 0)}</span>
            </div>
          </div>
        </Card>

        <div className="space-y-3">
          <Card title="বকেয়া কিউ" sub="প্রথমে বেশি ঘাটতি">
            <DataTable
              columns={[
                { key: 'name', head: 'সদস্য', render: (r) => <b>{mem(r.part.memberId)}</b> },
                { key: 'exp', head: 'প্রাপ্য', align: 'right', render: (r) => `৳${bn(r.expected)}` },
                { key: 'paid', head: 'জমা', align: 'right', render: (r) => `৳${bn(r.paid)}` },
                { key: 'gap', head: 'ঘাটতি', align: 'right', render: (r) => <span className="text-danger-ink font-bold">৳{bn(r.gap)}</span> },
                {
                  key: 'act', head: '', align: 'right', render: (r) => (
                    <Button size="sm" variant="secondary" onClick={() => { setMember(r.part.memberId); setAmount(String(Math.min(r.gap, 100000))); }}>বাছাই</Button>
                  ),
                },
              ]}
              rows={queue}
              empty="এই লক্ষ্যে কোনো বকেয়া নেই ✅"
            />
          </Card>
          <Card title="সাম্প্রতিক রসিদ" sub="অপরিবর্তনীয় · সংশোধন = রিভার্সাল">
            <DataTable
              columns={[
                { key: 'receipt', head: 'রসিদ', render: (r) => <b className="num">{r.receipt}</b> },
                { key: 'member', head: 'সদস্য', render: (r) => mem(r.memberId) },
                { key: 'amount', head: 'অঙ্ক', align: 'right', render: (r) => `৳${bn(r.amount)}` },
                { key: 'at', head: 'তারিখ', render: (r) => r.at },
                { key: 'channel', head: 'মাধ্যম', render: (r) => jgChannelLabel(r.channel) },
              ]}
              rows={cs.slice(0, 8)}
            />
          </Card>
        </div>
      </div>
      <Note>বকেয়ার প্রতিকার: নোটিশ → কমিটি → প্রতিস্থাপন — স্বয়ংক্রিয় জরিমানা নয় (D-49)। কোনো অতিরিক্ত চার্জ নেই — সুদ শূন্য।</Note>
    </Page>
  );
}
