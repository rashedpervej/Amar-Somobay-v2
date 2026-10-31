import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Card, DataTable } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { useAdminJg } from '../../../store/adminJointStore';
import { rcMembers } from '../../../store/adminRoscaStore';
import {
  JG_STATUS, jgGoalById, jgPartsOf, jgPledgeTotal, jgPendingJoins,
} from '../../../domain/adminJoint';
import { Chips, Note, Page, StatBar } from './webParts';

const mem = (id: string) => rcMembers.find((m) => m.id === id)?.name ?? id;

export default function JgJoin() {
  const s = useAdminJg();
  const nav = useNavigate();
  const [st, setSt] = useState('pending');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const pending = jgPendingJoins(s.state.parts);
  const invited = s.state.parts.filter((p) => p.status === 'invited');
  const rows = s.state.parts.filter((p) => p.status !== 'removed' && (st === 'all' || p.status === st));

  const act = (r: { ok: boolean; message: string }) => {
    if (!r.ok) { setErr(r.message); setMsg(''); } else { setErr(''); setMsg(r.message); }
  };

  return (
    <Page title="অংশগ্রহণ ব্যবস্থাপনা ও যোগদান অনুমোদন" sub="Admin অনুমোদন ছাড়া কেউ যোগ দিতে পারে না (D-49) · maker ≠ checker (BR-04)"
      back="/w/jg"
      right={<Button size="sm" variant="secondary" onClick={() => nav('/w/jg/goals')}>লক্ষ্য তালিকা</Button>}>
      {err && <Note tone="warn">{err}</Note>}
      {msg && <Note tone="ok">{msg}</Note>}
      <StatBar items={[
        { k: 'অনুমোদন বাকি', v: bn(pending.length), tone: pending.length ? 'warn' : 'ok' },
        { k: 'আমন্ত্রণ', v: bn(invited.length) },
        { k: 'সক্রিয় অংশগ্রহণ', v: bn(s.state.parts.filter((p) => p.status === 'active').length), tone: 'ok' },
        { k: 'মোট প্রতিশ্রুতি', v: `৳${bn(s.state.goals.reduce((n, g) => n + jgPledgeTotal(s.state.parts, g.id), 0))}` },
      ]} />

      <Card title="অনুমোদনের অপেক্ষায়" sub="প্রতিশ্রুতি ও লক্ষ্যের সীমা যাচাই করুন">
        {pending.length === 0 && <p className="text-sm text-mut">অনুমোদনের অপেক্ষায় কেউ নেই ✅</p>}
        <div className="grid gap-3 lg:grid-cols-2">
          {pending.map((p) => {
            const g = jgGoalById(s.state.goals, p.goal);
            return (
              <div key={`${p.goal}-${p.memberId}`} className="rounded-r-sm border border-line p-3">
                <div className="flex items-center gap-2">
                  <b className="grow">{mem(p.memberId)}</b>
                  <Badge tone="warn">অপেক্ষমাণ</Badge>
                </div>
                <p className="text-xs text-mut mt-1">{g.name} · {g.code}</p>
                <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                  <div><span className="text-xs text-mut block">প্রতিশ্রুতি</span><b className="num">৳{bn(p.pledged)}</b></div>
                  <div><span className="text-xs text-mut block">কিস্তি</span><b className="num">৳{bn(p.install)}</b></div>
                  <div><span className="text-xs text-mut block">আবেদন</span><b>{p.joinedAt ?? '—'}</b></div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" block onClick={() => act(s.approveJoin(p.goal, p.memberId))}>অনুমোদন</Button>
                  <Button size="sm" variant="secondary" block onClick={() => act(s.rejectJoin(p.goal, p.memberId))}>প্রত্যাখ্যান</Button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Chips value={st} onChange={setSt} items={[['pending', 'অপেক্ষমাণ'], ['invited', 'আমন্ত্রিত'], ['active', 'সক্রিয়'], ['behind', 'পিছিয়ে'], ['all', 'সব']]} />
        <span className="text-sm text-mut">সদস্য তালিকা · {bn(rows.length)} জন</span>
      </div>
      <Card title="অংশগ্রহণ" sub="প্রতিটি লক্ষ্যের প্রতিশ্রুতি ও জমা">
        <DataTable
          columns={[
            { key: 'member', head: 'সদস্য', render: (r) => <b>{mem(r.memberId)}</b> },
            { key: 'goal', head: 'লক্ষ্য', render: (r) => <><span className="block">{jgGoalById(s.state.goals, r.goal).code}</span><span className="text-xs text-mut">{JG_STATUS[jgGoalById(s.state.goals, r.goal).status].t}</span></> },
            { key: 'pledged', head: 'প্রতিশ্রুতি', align: 'right', render: (r) => `৳${bn(r.pledged)}` },
            { key: 'paid', head: 'জমা', align: 'right', render: (r) => `৳${bn(r.paid)}` },
            { key: 'install', head: 'কিস্তি', align: 'right', render: (r) => `৳${bn(r.install)}` },
            { key: 'joined', head: 'যোগদান', render: (r) => r.joinedAt ?? '—' },
            { key: 'st', head: 'অবস্থা', render: (r) => <Badge tone={r.status === 'pending' ? 'warn' : r.status === 'behind' ? 'danger' : r.status === 'active' ? 'ok' : 'info'}>{r.status === 'pending' ? 'অপেক্ষমাণ' : r.status === 'behind' ? 'পিছিয়ে' : r.status === 'active' ? 'সক্রিয়' : r.status === 'invited' ? 'আমন্ত্রিত' : r.status}</Badge> },
            { key: 'appr', head: 'অনুমোদনকারী', render: (r) => r.approvedBy ?? '—' },
          ]}
          rows={rows}
        />
      </Card>

      <Note>প্রত্যাখ্যাত আবেদন ডিলিট হয় না — ইতিহাসে থাকে; পুনরায় আবেদন করলে নতুন সিদ্ধান্ত লাগবে। আমন্ত্রণ পাঠানোর পর সদস্য সম্মতি দিলে অনুমোদন কিউতে আসবে।</Note>
      <p className="text-sm text-mut">আমন্ত্রণ ব্যবস্থাপনা: {bn(invited.length)} জন আমন্ত্রিত · <button type="button" className="min-h-10 inline-flex items-center underline font-bold text-green-800" onClick={() => nav('/w/jg/goals')}>লক্ষ্য থেকে আমন্ত্রণ পাঠান</button></p>
      {pending.length > 0 && <p className="text-xs text-mut">মোট অপেক্ষমাণ প্রতিশ্রুতি ৳{bn(pending.reduce((n, p) => n + p.pledged, 0))} · {bn(jgPartsOf(s.state.parts, pending[0].goal).length)} জনের সীমা যাচাই হয়েছে</p>}
    </Page>
  );
}
