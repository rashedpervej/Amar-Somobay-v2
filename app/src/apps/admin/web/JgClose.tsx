import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Card, DataTable } from '../../../components/ui';
import { inputCls } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdminJg } from '../../../store/adminJointStore';
import { JG_DEADLINE, JG_STATUS, jgCollected, jgDaysLeft, jgLabel, jgPaidOut, jgPctOf } from '../../../domain/adminJoint';
import { Note, Page, StatBar } from './webParts';

export default function JgClose() {
  const s = useAdminJg();
  const nav = useNavigate();
  const [approver, setApprover] = useState('মোঃ আব্দুল্লাহ');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const settling = s.state.goals.filter((g) => g.status === 'settling');
  const running = s.state.goals.filter((g) => g.status === 'active' || g.status === 'forming' || g.status === 'expired');

  const act = (r: { ok: boolean; message: string }) => {
    if (!r.ok) { setErr(r.message); setMsg(''); } else { setErr(''); setMsg(r.message); }
  };

  return (
    <Page title="মেয়াদোত্তীর্ণ ও নিষ্পত্তি" sub="আনুপাতিক ফেরত · কাটতি নেই · প্রস্তুতকারী ≠ অনুমোদনকারী (BR-04 · D-39)"
      back="/w/jg"
      right={<Button size="sm" variant="secondary" onClick={() => nav('/w/jg/reports')}>রিপোর্ট</Button>}>
      {err && <Note tone="warn">{err}</Note>}
      {msg && <Note tone="ok">{msg}</Note>}
      <StatBar items={[
        { k: 'নিষ্পত্তি বাকি', v: bn(settling.filter((g) => !g.settleAppr).length), tone: settling.length ? 'warn' : 'ok' },
        { k: 'সম্পন্ন', v: bn(s.state.goals.filter((g) => g.status === 'closed').length), tone: 'ok' },
        { k: 'চলমান', v: bn(running.length) },
        { k: 'ফেরতযোগ্য (আনুমানিক)', v: `৳${bn(settling.reduce((n, g) => n + jgCollected(s.state.contribs, g.id), 0))}` },
      ]} />

      {settling.map((g) => (
        <Card key={g.id} title={`${g.code} · ${g.name}`} sub={`মেয়াদ ${g.targetDate} · অর্জিত ${bn(jgPctOf(s.state.contribs, g))}% · সিদ্ধান্ত ${jgLabel(JG_DEADLINE, g.settleDecision)}`}
          right={<Badge tone="danger">নিষ্পত্তি</Badge>}>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-r-sm border border-line p-3"><span className="text-xs text-mut block">সংগৃহীত</span><b className="num">৳{bn(jgCollected(s.state.contribs, g.id))}</b></div>
            <div className="rounded-r-sm border border-line p-3"><span className="text-xs text-mut block">ব্যয়</span><b className="num">৳{bn(jgPaidOut(s.state.disbs, g.id))}</b></div>
            <div className="rounded-r-sm border border-line p-3"><span className="text-xs text-mut block">ফেরত</span><b className="num">৳{bn(jgCollected(s.state.contribs, g.id) - jgPaidOut(s.state.disbs, g.id))}</b></div>
          </div>
          <p className="text-sm text-mut mt-3">{g.note}</p>
          <p className="text-xs text-mut mt-1">নিষ্পত্তি প্রস্তুতকারী: {g.settleBy ?? '—'} · অনুমোদন: {g.settleAppr ?? 'বাকি'}</p>
          {!g.settleAppr ? (
            <div className="flex flex-wrap gap-2 mt-3">
              <select value={approver} onChange={(e) => setApprover(e.target.value)} className={`${inputCls} min-h-9 max-w-52 text-sm`}>
                {['মোঃ আব্দুল্লাহ', 'নাসরিন আক্তার', 'কামরুল হাসান', 'সুমি রানী দাস'].map((x) => <option key={x}>{x}</option>)}
              </select>
              <Button size="sm" onClick={() => act(s.settleApprove(g.id, approver))}>নিষ্পত্তি অনুমোদন</Button>
              <Button size="sm" variant="secondary" onClick={() => act(s.extendGoal(g.id))}>মেয়াদ বাড়ান</Button>
            </div>
          ) : (
            <p className="text-sm text-ok-ink font-bold mt-3">✅ নিষ্পত্তি সম্পন্ন — অনুমোদনকারী {g.settleAppr} · {g.settledOn}</p>
          )}
        </Card>
      ))}

      <Card title="চলমান লক্ষ্যের মেয়াদ" sub="মেয়াদ বাড়ানো একবারই — নীতিতে অনুমোদিত হলে">
        <DataTable
          columns={[
            { key: 'code', head: 'লক্ষ্য', render: (r) => <>{r.code}<span className="block text-xs text-mut">{r.name}</span></> },
            { key: 'date', head: 'মেয়াদ', render: (r) => r.targetDate },
            { key: 'days', head: 'দিন বাকি', align: 'right', render: (r) => <span className={jgDaysLeft(r) < 0 ? 'text-danger-ink font-bold' : ''}>{bn(jgDaysLeft(r))}</span> },
            { key: 'pct', head: 'অর্জিত', align: 'center', render: (r) => `${bn(Math.min(100, jgPctOf(s.state.contribs, r)))}%` },
            { key: 'policy', head: 'নীতিমালা', render: (r) => r.deadlinePolicy.map((d) => jgLabel(JG_DEADLINE, d)).join(' · ') },
            { key: 'st', head: 'অবস্থা', render: (r) => <Badge tone={JG_STATUS[r.status].tone}>{JG_STATUS[r.status].t}</Badge> },
            {
              key: 'act', head: '', align: 'right', render: (r) => (
                <Button size="sm" variant="secondary" disabled={r.deadlinePolicy.indexOf('extend') < 0} onClick={() => act(s.extendGoal(r.id))}>৬ মাস বাড়ান</Button>
              ),
            },
          ]}
          rows={running}
        />
      </Card>
      <Note>নিষ্পত্তিতে সদস্যভিত্তিক আনুপাতিক ফেরতের রসিদ তৈরি হয়; কোনো কাটতি/জরিমানা নেই। একটি লক্ষ্য বন্ধ হলে তার রেকর্ড অপরিবর্তনীয় (D-39)।</Note>
    </Page>
  );
}
