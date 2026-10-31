/* JAM-08 · বিতরণ ও ভাউচার — কমিটির সিদ্ধান্ত + প্রমাণ ছাড়া অর্থ মুক্তি নেই (D-50) */

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, FileText, Lock, Plus, X } from 'lucide-react';
import { Badge, Button, Card, Kpi, KpiGrid, SectionHead } from '../../../components/ui';
import { ErrorBanner, Field, SuccessBanner, inputClass } from '../../../components/form';
import { bn } from '../../../lib/bn';
import {
  JG_DISB_ST, jgCollected, jgDisbOf, jgGoalById, jgPaidOut,
} from '../../../domain/adminJoint';
import { useAdminJg } from '../../../store/adminJointStore';
import { KV, StackedCard, StackHead } from './parts';
import { PoolRow, tk, useRoleQS } from './rcParts';

const APPROVERS = ['নাসরিন আক্তার', 'মোঃ আব্দুল্লাহ', 'কামরুল হাসান'];

export default function JgDisb() {
  const { goalId = '' } = useParams();
  const navigate = useNavigate();
  const qs = useRoleQS();
  const { state, requestDisb, approveDisb, rejectDisb } = useAdminJg();
  const [form, setForm] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [approver, setApprover] = useState('');
  const [f, setF] = useState({ purpose: '', payee: '', amount: '', channel: 'bank' as 'cash_office' | 'bkash' | 'bank', evidence: '' });
  const g = jgGoalById(state.goals, goalId);
  const list = jgDisbOf(state.disbs, g.id);
  const paid = jgPaidOut(state.disbs, g.id);
  const col = jgCollected(state.contribs, g.id);
  const balance = col - paid;

  const run = (fn: () => { ok: boolean; message: string }) => {
    setErr(''); setMsg('');
    const r = fn();
    if (!r.ok) { setErr(r.message); return; }
    setMsg(r.message);
  };

  const submit = () => {
    setErr(''); setMsg('');
    const r = requestDisb(g.id, {
      purpose: f.purpose, payee: f.payee, amount: Number(f.amount), channel: f.channel, evidence: f.evidence,
    });
    if (!r.ok) { setErr(r.message); return; }
    setMsg(r.message);
    setForm(false);
    setF({ purpose: '', payee: '', amount: '', channel: 'bank', evidence: '' });
  };

  return (
    <div className="p-4 space-y-3 pb-8">
      <Button size="sm" variant="ghost" icon={<ArrowLeft size={15} />} onClick={() => navigate(`/a/jg/goals/${g.id}${qs}`)}>লক্ষ্যে ফিরুন</Button>

      <KpiGrid>
        <Kpi label="সংগৃহীত" value={tk(col)} tone="ok" note={g.code} />
        <Kpi label="ব্যয়িত" value={tk(paid)} note={`${bn(list.filter((d) => d.status === 'paid').length)} ভাউচার`} />
        <Kpi label="অবশিষ্ট" value={tk(Math.max(0, balance))} tone={balance > 0 ? 'warn' : 'ok'} note="লক্ষ্য তহবিল (D-39)" />
        <Kpi label="অনুমোদন বাকি" value={bn(list.filter((d) => d.status === 'approval').length)} tone="warn" note="maker ≠ checker" />
      </KpiGrid>

      {msg ? <SuccessBanner title={msg} /> : null}
      {err ? <ErrorBanner>{err}</ErrorBanner> : null}

      {g.status !== 'achieved' && g.status !== 'settling' ? (
        <Card title="বিতরণ এখন বন্ধ">
          <p className="text-sm text-txt-2">লক্ষ্য পূরণের (বা নিষ্পত্তির) পরেই ভাউচার তৈরি হয় — BR-19 / D-50। বর্তমান অবস্থা: <b>{g.status === 'closed' ? 'সমাপ্ত' : 'অগ্রগতি চলছে'}</b>।</p>
        </Card>
      ) : (
        <>
          <Button block icon={<Plus size={16} />} onClick={() => setForm(!form)}>{form ? 'ফর্ম বন্ধ করুন' : 'নতুন বিতরণ ভাউচার'}</Button>
          {form ? (
            <Card title="ভাউচার তৈরি" sub="প্রমাণের রেফারেন্স ছাড়া সংরক্ষণ হবে না">
              <div className="space-y-3">
                <Field label="কাজের বিবরণ" required hint="কমপক্ষে ৫ অক্ষর">
                  {(id) => <input id={id} className={inputClass()} value={f.purpose} onChange={(e) => setF({ ...f, purpose: e.target.value })} placeholder="যেমন: ২টি নলকূপ স্থাপন" />}
                </Field>
                <Field label="প্রাপক" required>
                  {(id) => <input id={id} className={inputClass()} value={f.payee} onChange={(e) => setF({ ...f, payee: e.target.value })} placeholder="ভেন্ডর / প্রতিষ্ঠানের নাম" />}
                </Field>
                <Field label="অঙ্ক (৳)" required hint="কমপক্ষে ৳১০০">
                  {(id) => <input id={id} type="number" className={inputClass()} value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} />}
                </Field>
                <Field label="প্রমাণের রেফারেন্স" required hint="চালান / কমিটির সিদ্ধান্ত নম্বর / ছবি — কমা দিয়ে আলাদা">
                  {(id) => <input id={id} className={inputClass()} value={f.evidence} onChange={(e) => setF({ ...f, evidence: e.target.value })} placeholder="চালান-২৩১, সভা-২০২৬/১০" />}
                </Field>
                <div>
                  <div className="text-sm font-bold text-txt-2 mb-1.5">মাধ্যম</div>
                  <div className="flex gap-2">
                    {([['bank', 'ব্যাংক'], ['bkash', 'বিকাশ'], ['cash_office', 'নগদ']] as const).map(([k, t]) => (
                      <button key={k} type="button" onClick={() => setF({ ...f, channel: k })}
                        className={`grow min-h-tap rounded-r-sm border text-sm font-bold ${f.channel === k ? 'bg-purple text-white border-purple-ink' : 'bg-card border-line-3 text-txt-2'}`}>{t}</button>
                    ))}
                  </div>
                </div>
                <Button block onClick={submit}>অনুমোদনের জন্য পাঠান</Button>
              </div>
            </Card>
          ) : null}
        </>
      )}

      <SectionHead title="ভাউচার" sub={`${bn(list.length)}টি · সব প্রমাণসহ`} />
      {list.map((d) => (
        <StackedCard key={d.id} tone={d.status === 'paid' ? 'ok' : d.status === 'blocked' ? 'bad' : d.status === 'approval' ? 'warn' : ''}
          head={<StackHead title={`${d.no} · ${tk(d.amount)}`} sub={`${d.purpose}`} right={<Badge tone={JG_DISB_ST[d.status].tone}>{JG_DISB_ST[d.status].t}</Badge>} />}
          foot={d.status === 'approval' ? (
            <div className="space-y-2">
              <select className={inputClass()} value={approver} onChange={(e) => setApprover(e.target.value)} aria-label="অনুমোদনকারী">
                <option value="">অনুমোদনকারী বাছাই</option>
                {APPROVERS.map((a) => <option key={a} value={a}>{a}</option>)}
                <option value={d.by ?? ''}>{d.by} — নিজে (নিষিদ্ধ) ✗</option>
              </select>
              <div className="flex gap-2">
                <Button size="sm" icon={<CheckCircle2 size={14} />} onClick={() => run(() => approveDisb(d.id, approver))}>অনুমোদন ও পরিশোধ</Button>
                <Button size="sm" variant="ghost" icon={<X size={14} />} onClick={() => run(() => rejectDisb(d.id))}>আটকান</Button>
              </div>
            </div>
          ) : undefined}>
          <KV k="প্রাপক" v={d.payee} />
          <KV k="কমিটি / সিদ্ধান্ত" v={`${d.committee} · ${d.decision}`} />
          <KV k="প্রমাণ" v={d.evidence.length ? d.evidence.join(' · ') : 'সংযুক্ত হয়নি'} />
          <KV k="প্রস্তুত → অনুমোদন" v={`${d.by ?? '—'} → ${d.appr ?? 'বাকি'}`} />
          <KV k="হ্যাশ" v={<span className="font-mono text-xs">{d.hash ?? 'পরিশোধের পর'}</span>} />
          <KV k="নোট" v={d.note} />
        </StackedCard>
      ))}
      {list.length === 0 ? <Card><p className="text-sm text-mut">কোনো ভাউচার নেই।</p></Card> : null}

      <Card title="নিয়ম">
        <PoolRow label="ভেন্ডর পেমেন্ট" value="অগ্রাধিকার (D-50)" tone="ok" />
        <div className="mt-2"><PoolRow label="প্রমাণ ছাড়া মুক্তি" value="নিষিদ্ধ" tone="bad" /></div>
        <div className="mt-2"><PoolRow label="ব্যক্তিগত উত্তোলন" value="নিষিদ্ধ (BR-19)" tone="ok" /></div>
        <p className="text-xs text-mut mt-2 flex items-start gap-1"><Lock size={13} className="mt-0.5" /> অনুমোদনের পর ভাউচার রিভার্সাল ছাড়া বদলায় না; হ্যাশ ও OTP নথিভুক্ত হয়।</p>
        <button type="button" className="mt-2 min-h-10 text-sm font-bold text-purple-ink inline-flex items-center gap-1" onClick={() => navigate(`/a/audit${qs}`)}><FileText size={14} /> অডিট লগ দেখুন</button>
      </Card>
    </div>
  );
}
