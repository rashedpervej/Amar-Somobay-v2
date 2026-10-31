import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge, Button, Card } from '../../../components/ui';
import { inputCls } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdminQh } from '../../../store/adminQardStore';
import { QH_BLOCK, qhProductById, qhPurposeLabel } from '../../../domain/adminQard';
import { Note, Page, StatBar } from './webParts';
import { QhCallout, QhLayerRow, memName } from './qhParts';

const CHECKS = [
  'যোগ্যতা স্ন্যাপশট দেখেছি (BR-21)',
  'যোগ্যতার সীমা ও পণ্যের সীমা যাচাই করেছি',
  'প্রস্তুতকারী ≠ অনুমোদনকারী নিশ্চিত (BR-22)',
  'সব মডিউলে বকেয়া নেই',
  'সক্রিয় QH ঋণ সীমা (D-51)',
  'কোটা ও পুলে পর্যাপ্ত জায়গা (D-40)',
  'প্রয়োজনীয় নথি যাচাই করেছি (D-58)',
  'কমিটি রেফারেন্স সংযুক্ত (D-45)',
];

export default function QhWebDecision() {
  const { appId } = useParams();
  const { state, decideApp } = useAdminQh();
  const nav = useNavigate();
  const a = state.apps.find((x) => x.id === appId) ?? state.apps[0];
  const p = qhProductById(state.products, a.product);
  const cap = Math.min(a.amount, a.snapshot.maxAmount);
  const [verdict, setVerdict] = useState<'approve' | 'approve_reduced' | 'return' | 'reject' | 'refer'>(a.snapshot.result === 'blocked' ? 'return' : cap < a.amount ? 'approve_reduced' : 'approve');
  const [amount, setAmount] = useState(String(cap));
  const [committee, setCommittee] = useState('CM-2610-10');
  const [note, setNote] = useState('');
  const [approver, setApprover] = useState('নাসরিন আক্তার');
  const [reviewBy] = useState(a.reviewer ?? 'কামরুল হাসান');
  const [done, setDone] = useState<string[]>([]);
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  const doneNow = !!a.decision;

  const submit = () => {
    if (done.length < CHECKS.length) { setErr('সব ৮টি যাচাই ঘর পূরণ করতে হবে'); setMsg(''); return; }
    const r = decideApp(a.id, { verdict, amount: Number(amount), committee, note, approver, reviewBy });
    if (!r.ok) { setErr(r.message); setMsg(''); } else { setErr(''); setMsg(r.message); }
  };

  return (
    <Page title="সিদ্ধান্ত · অনুমোদন / প্রত্যাখ্যান / ফেরত" sub={`${a.no} · ${memName(a.memberId)} · ${qhPurposeLabel(a.purpose)}`}
      back={`/w/qh/applications/${a.id}`}
      right={<Button size="sm" variant="secondary" onClick={() => nav(`/w/qh/applications/${a.id}`)}>আবেদনে ফিরুন</Button>}>
      {err && <Note tone="warn">{err}</Note>}
      {msg && <Note tone="ok">{msg}</Note>}
      {doneNow && <Note tone="ok">এই আবেদনের সিদ্ধান্ত ইতিমধ্যে সম্পন্ন — পুনরায় সিদ্ধান্ত নেওয়া যাবে না (অডিট অপরিবর্তনীয়)।</Note>}

      <StatBar items={[
        { k: 'আবেদিত', v: `৳${bn(a.amount)}` },
        { k: 'স্ন্যাপশট সীমা', v: `৳${bn(a.snapshot.maxAmount)}` },
        { k: 'স্ন্যাপশট ফল', v: a.snapshot.result === 'blocked' ? 'আটকানো' : a.snapshot.result === 'conditional' ? 'শর্তসাপেক্ষ' : 'যোগ্য', tone: a.snapshot.result === 'blocked' ? 'danger' : 'ok' },
        { k: 'সুদ', v: '৳০', tone: 'ok' },
      ]} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-3">
          <Card title="সিদ্ধান্তের বিকল্প" sub="একটি বাছুন — অঙ্ক ও কমিটি যাচাই হবে">
            <div className="grid sm:grid-cols-2 gap-2">
              {([
                ['approve', 'অনুমোদন', 'আবেদিত পূর্ণ অঙ্ক'],
                ['approve_reduced', 'কমিয়ে অনুমোদন', 'স্ন্যাপশট সীমার মধ্যে'],
                ['return', 'তথ্য চেয়ে ফেরত', 'নথি/স্পষ্টতা বাকি'],
                ['reject', 'প্রত্যাখ্যান', 'কারণসহ'],
                ['refer', 'কমিটিতে পাঠান', 'বিশেষ সিদ্ধান্ত'],
              ] as const).map(([k, t, sub]) => (
                <button key={k} type="button" onClick={() => setVerdict(k)} disabled={doneNow}
                  className={`min-h-tap rounded-r-sm border px-3 py-2 text-left disabled:opacity-60 ${verdict === k ? 'border-green-600 bg-green-050' : 'border-line-3 bg-card'}`}>
                  <b className="text-sm">{t}</b><span className="block text-xs text-mut">{sub}</span>
                </button>
              ))}
            </div>
            {a.snapshot.result === 'blocked' && (verdict === 'approve' || verdict === 'approve_reduced') && (
              <div className="mt-2"><QhCallout title="স্ন্যাপশটে আটকানো" tone="danger">{a.snapshot.reasons.map((r) => QH_BLOCK[r]?.a ?? r).join(' · ')} — অনুমোদন সম্ভব নয়; ফেরত বা প্রত্যাখ্যান করুন।</QhCallout></div>
            )}
            <div className="grid sm:grid-cols-2 gap-3 mt-3">
              <label className="block"><span className="text-sm font-bold">অনুমোদনের অঙ্ক (৳)</span>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={doneNow || (verdict !== 'approve' && verdict !== 'approve_reduced')} className={`${inputCls} mt-1 num`} />
              </label>
              <label className="block"><span className="text-sm font-bold">কমিটি রেফারেন্স</span>
                <input value={committee} onChange={(e) => setCommittee(e.target.value)} disabled={doneNow || (verdict !== 'approve' && verdict !== 'approve_reduced')} className={`${inputCls} mt-1`} placeholder="CM-YYMM-##" />
              </label>
              <label className="block"><span className="text-sm font-bold">প্রস্তুতকারী</span>
                <input value={reviewBy} readOnly className={`${inputCls} mt-1 bg-card-2`} />
              </label>
              <label className="block"><span className="text-sm font-bold">অনুমোদনকারী *</span>
                <select value={approver} onChange={(e) => setApprover(e.target.value)} disabled={doneNow} className={`${inputCls} mt-1`}>
                  {['নাসরিন আক্তার', 'মোঃ আব্দুল্লাহ', 'কামরুল হাসান', 'সুমি রানী দাস'].map((x) => <option key={x}>{x}</option>)}
                </select>
              </label>
              <label className="block sm:col-span-2"><span className="text-sm font-bold">সিদ্ধান্তের মন্তব্য {verdict === 'reject' || verdict === 'return' ? '*' : ''}</span>
                <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} disabled={doneNow} className={`${inputCls} mt-1 py-2`} placeholder="কারণ, শর্ত বা প্রয়োজনীয় নথি" />
              </label>
            </div>
          </Card>

          <Card title="স্ন্যাপশট পুনরায় দেখুন" sub="সিদ্ধান্তের আগে ৪ স্তর">
            <div className="space-y-2">
              {(['gate', 'scope', 'financial', 'window'] as const).map((k, i) => (
                <QhLayerRow key={k} no={i + 1} title={k === 'gate' ? 'স্তর ১ · গেট' : k === 'scope' ? 'স্তর ২ · পরিসর' : k === 'financial' ? 'স্তর ৩ · আর্থিক' : 'স্তর ৪ · জানালা ও কোটা'}
                  value={a.snapshot.layer[k]} sub={a.snapshot.layer[k] === 'block' ? QH_BLOCK[a.snapshot.reasons[0]]?.a : 'পাস — কোনো বাধা নেই'} />
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-3">
          <Card title="৮টি বাধ্যতামূলক যাচাই" sub={`${bn(done.length)}/${bn(CHECKS.length)} সম্পন্ন · maker ≠ checker`}>
            <div className="space-y-1.5">
              {CHECKS.map((c) => {
                const on = done.includes(c);
                return (
                  <button key={c} type="button" disabled={doneNow}
                    onClick={() => setDone((v) => on ? v.filter((x) => x !== c) : [...v, c])}
                    className={`min-h-tap w-full flex items-center gap-2 rounded-r-sm border px-3 py-2 text-left text-sm disabled:opacity-60 ${on ? 'border-ok-bd bg-ok-bg' : 'border-line-3 bg-card'}`}>
                    <span className={`size-5 shrink-0 rounded-r-sm border-2 grid place-items-center text-[10px] ${on ? 'bg-green-700 border-green-700 text-white' : 'border-line-3'}`}>{on ? '✓' : ''}</span>
                    <span className={on ? 'font-bold' : ''}>{c}</span>
                  </button>
                );
              })}
            </div>
            {approver.trim() === reviewBy.trim() && <div className="mt-2"><QhCallout title="maker ≠ checker লঙ্ঘন" tone="danger">প্রস্তুতকারী নিজে অনুমোদন করতে পারবেন না — অন্য অনুমোদনকারী বাছুন (BR-22)।</QhCallout></div>}
            <Button block className="mt-3" onClick={submit} disabled={doneNow}>সিদ্ধান্ত নিশ্চিত করুন</Button>
            <p className="text-xs text-mut mt-2">সিদ্ধান্ত অপরিবর্তনীয়; ভুল হলে নতুন আবেদন বা রিভার্সাল প্রক্রিয়া।</p>
          </Card>
          <Card title="আবেদনের পণ্য" sub={p?.code}>
            <p className="text-sm"><b>{p?.name}</b></p>
            <p className="text-xs text-mut">সীমা ৳{bn(p?.min ?? 0)}–{bn(p?.max ?? 0)} · মেয়াদ {bn(p?.tenure ?? 0)} মাস</p>
            <p className="text-xs text-mut mt-1">অনুমোদিত অঙ্ক ≤ স্ন্যাপশট সীমা ≤ পণ্যের সীমা।</p>
            <Badge tone="ok">সুদ শূন্য · ফি নেই</Badge>
          </Card>
        </div>
      </div>
    </Page>
  );
}
