/* ============================================================
   src/apps/admin/screens/Reversal.tsx — AM-14 সংশোধন ও রিভার্সাল
   অনুমোদনের অপেক্ষায় সংশোধন তালিকা, নির্বাচিত লেনদেনের প্রভাব,
   কারণ বাধ্যতামূলক — মূল এন্ট্রি মুছে না, উল্টো এন্ট্রি বসে।
   ============================================================ */

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, RefreshCw, ShieldAlert } from 'lucide-react';
import { Badge, Button, Card, DecisionBar, Row, SectionHead } from '../../../components/ui';
import { ErrorBanner, Field, SuccessBanner, inputClass } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import { Note, Stepper, StackedCard, StackHead } from './parts';

export default function Reversal() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { state, reverseTxn } = useAdmin();
  const [picked, setPicked] = useState<string>(state.txns[0]?.id ?? '');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const roleQS = params.get('role') ? `?role=${params.get('role')}` : '';
  const txn = state.txns.find((t) => t.id === picked);

  function submit() {
    setError('');
    if (!txn) { setError('লেনদেন বাছাই করুন'); return; }
    const r = reverseTxn(txn.id, reason);
    if (!r.ok) { setError(r.message); return; }
    setDone(r.message);
    setReason('');
  }

  return (
    <div className="pb-2">
      <div className="p-4 space-y-4">
        <h2 className="text-h2 text-txt">সংশোধন ও রিভার্সাল</h2>
        <p className="text-sm text-mut">{bn(state.corrections.filter((c) => c.status === 'pending').length)}টি অনুমোদনের অপেক্ষায় · {bn(state.corrections.length)}টি মোট</p>
        {done ? <SuccessBanner title={done}>মূল এন্ট্রি অক্ষত — ইতিহাসে নতুন সারি যুক্ত হয়েছে।</SuccessBanner> : null}
        {error ? <ErrorBanner>{error}</ErrorBanner> : null}

        <Card><Stepper steps={['লেনদেন বাছাই', 'প্রভাব দেখা', 'কারণ', 'জমা']} cur={1} /></Card>

        <SectionHead title="অনুমোদনের অপেক্ষায় সংশোধন" sub={`${bn(state.corrections.filter((c) => c.status === 'pending').length)}টি`} />
        {state.corrections.filter((c) => c.status === 'pending').map((c) => (
          <StackedCard key={c.id} tone="warn" head={<StackHead title={`${c.no} · ${c.kind}`} sub={`লেনদেন ${c.txnNo} · ${c.by} · ${c.at}`} right={<Badge tone="warn">অপেক্ষমাণ</Badge>} />}
            foot={<>
              <Button size="sm" variant="secondary" className="grow" onClick={() => setDone(`${c.no} অনুমোদিত (ডেমো)`)}>অনুমোদন</Button>
              <Button size="sm" variant="danger" onClick={() => setDone(`${c.no} প্রত্যাখ্যাত (ডেমো)`)}>বাতিল</Button>
            </>}>
            <div className="flex justify-between text-xs"><span className="text-mut">কারণ</span><span className="font-bold">{c.reason}</span></div>
            <div className="flex justify-between text-xs mt-1"><span className="text-mut">প্রভাব</span><span className="num font-bold">৳{bn(c.impact.balance)} · {c.impact.reports}</span></div>
          </StackedCard>
        ))}

        <SectionHead title="লেনদেন বাছাই" sub="যেটি রিভার্স করবেন" />
        <div className="rounded-r-md border border-line bg-card overflow-hidden shadow-sh-1">
          {state.txns.slice(0, 5).map((t) => (
            <Row key={t.id} icon={<RefreshCw size={16} />} title={`${t.no} · ৳${bn(t.amount)}`}
              sub={`${t.date} · ${t.type === 'deposit' ? 'জমা' : t.type === 'withdrawal' ? 'উত্তোলন' : t.type} · ${t.status === 'reversed' ? 'রিভার্স হয়েছে' : 'পোস্টেড'}`}
              right={picked === t.id ? <Badge tone="brand">নির্বাচিত</Badge> : <Badge tone={t.status === 'reversed' ? 'neutral' : 'ok'}>{t.status === 'reversed' ? 'রিভার্সড' : 'সক্রিয়'}</Badge>}
              onClick={() => setPicked(t.id)} />
          ))}
        </div>

        {txn ? (
          <Card title="প্রভাব" sub={txn.no}>
            <div className="text-sm space-y-1">
              <div className="flex justify-between"><span className="text-mut text-xs">ব্যালেন্স</span><span className={`num font-bold ${txn.type === 'deposit' ? 'text-danger-ink' : 'text-ok-ink'}`}>{txn.type === 'deposit' ? '−' : '+'}৳{bn(txn.amount)}</span></div>
              <div className="flex justify-between"><span className="text-mut text-xs">রিপোর্ট</span><span className="font-bold">সঞ্চয় ও ক্যাশ বুক</span></div>
              <div className="flex justify-between"><span className="text-mut text-xs">মূল এন্ট্রি</span><span className="font-bold">মুছবে না — ইতিহাস অক্ষত</span></div>
            </div>
            <Note tone="warn">দিনশেষ হওয়ার আগেই নিষ্পত্তি করুন — পরে হলে নতুন পিরিয়ডে সমন্বয় লাগবে।</Note>
          </Card>
        ) : null}

        <Card title="কারণ" sub="বাধ্যতামূলক — অডিট লগে যাবে">
          <Field label="রিভার্সালের কারণ" required hint="অন্তত ৫ অক্ষর">
            {(fid) => <textarea id={fid} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="যেমন: একই রসিদ দুইবার পোস্ট হয়েছে" className={inputClass() + ' py-2'} />}
          </Field>
        </Card>

        <Note tone="info"><b>maker ≠ checker</b> — যে এন্ট্রি করেছে সে-ই রিভার্স অনুমোদন করতে পারবে না; নিরীক্ষক অ্যালার্ট পাবেন।</Note>
        <div className="flex items-center gap-1.5 text-xs text-mut justify-center"><ShieldAlert size={13} /> রিভার্সাল নতুন এন্ট্রি — পুরোনোটি অপরিবর্তিত থাকে (R-02)</div>
      </div>

      <DecisionBar note={<span><AlertTriangle size={13} className="inline -mt-0.5" /> নির্বাচিত {txn?.no ?? '—'}</span>}>
        <Button size="sm" variant="ghost" onClick={() => navigate(`/a/ledger${roleQS}`)}>লেজার</Button>
        <Button size="sm" variant="danger" icon={<RefreshCw size={15} />} onClick={submit}>রিভার্স করুন</Button>
        <Button size="sm" variant="secondary" icon={<CheckCircle2 size={15} />} onClick={() => setDone('সংশোধন নোট সংরক্ষিত (ডেমো)')}>শুধু সংরক্ষণ</Button>
      </DecisionBar>
    </div>
  );
}
