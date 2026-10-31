/* ============================================================
   src/apps/admin/screens/FundTransfer.tsx — AM-20 তহবিল স্থানান্তর
   উৎস ও গন্তব্য → পরিমাণ → অনুমোদন → নিষ্পত্তি ও রসিদ।
   অনিশ্চিত (unknown) অবস্থা আলাদা — অনুমানে settled নয়।
   ============================================================ */

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRightLeft, Banknote, CheckCircle2, Clock, ShieldAlert } from 'lucide-react';
import { Badge, Button, Card, DecisionBar, Row, SectionHead } from '../../../components/ui';
import { ErrorBanner, Field, SuccessBanner, inputClass } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import { Note, Stepper } from './parts';

export default function FundTransfer() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { state, transferFunds } = useAdmin();
  const [from, setFrom] = useState('oa1');
  const [to, setTo] = useState('oa2');
  const [amount, setAmount] = useState<number | ''>(100000);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const roleQS = params.get('role') ? `?role=${params.get('role')}` : '';
  const total = state.orgAccounts.reduce((s, a) => s + a.balance, 0);
  const src = state.orgAccounts.find((a) => a.id === from);
  const dest = state.orgAccounts.find((a) => a.id === to);

  function submit() {
    setError('');
    if (!amount) { setError('অঙ্ক লিখুন'); return; }
    if (from === to) { setError('উৎস ও গন্তব্য আলাদা হতে হবে'); return; }
    const r = transferFunds(from, to, amount);
    if (!r.ok) { setError(r.message); return; }
    setDone(r.message);
  }

  return (
    <div className="pb-2">
      <div className="p-4 space-y-4">
        <h2 className="text-h2 text-txt">তহবিল স্থানান্তর</h2>
        <p className="text-sm text-mut">{bn(state.orgAccounts.length)}টি হিসাব · মোট ৳{bn(total)}</p>
        {done ? <SuccessBanner title={done}>প্রস্তাব নম্বর সংরক্ষিত — অনুমোদনের পরে নিষ্পত্তি হবে।</SuccessBanner> : null}
        {error ? <ErrorBanner>{error}</ErrorBanner> : null}

        <Card><Stepper steps={['উৎস ও গন্তব্য', 'পরিমাণ ও ফি', 'অনুমোদন', 'নিষ্পত্তি ও রসিদ']} cur={1} /></Card>

        <SectionHead title="সমিতির হিসাব" sub="সঞ্চয় তহবিল থেকে আলাদা" />
        <Card>
          {state.orgAccounts.map((a) => (
            <button key={a.id} type="button" onClick={() => (from === a.id ? null : setTo(a.id))}
              className="w-full min-h-tap text-left flex items-center gap-2 py-2.5 border-b border-line-2 last:border-b-0">
              <span className="w-8 h-8 grid place-items-center rounded-r-pill bg-green-050 text-green-800"><Banknote size={15} /></span>
              <span className="grow min-w-0">
                <span className="block text-sm font-bold truncate">{a.name} {from === a.id ? '· উৎস' : to === a.id ? '· গন্তব্য' : ''}</span>
                <span className="block text-xs text-mut">{a.kind} · {a.no}</span>
              </span>
              <span className="num font-bold text-sm">৳{bn(a.balance)}</span>
            </button>
          ))}
        </Card>

        <SectionHead title="উৎস ও গন্তব্য" sub="ট্যাপ করে বদলান" />
        <Card>
          <label htmlFor="from-sel" className="block text-sm font-bold text-txt-2 mb-1">উৎস</label>
          <select id="from-sel" value={from} onChange={(e) => { setFrom(e.target.value); if (e.target.value === to) setTo(from); }} className={inputClass()}>
            {state.orgAccounts.map((a) => <option key={a.id} value={a.id}>{a.name} — ৳{bn(a.balance)}</option>)}
          </select>
          <div className="flex justify-center my-2"><ArrowRightLeft size={17} className="text-green-700" /></div>
          <label htmlFor="to-sel" className="block text-sm font-bold text-txt-2 mb-1">গন্তব্য</label>
          <select id="to-sel" value={to} onChange={(e) => setTo(e.target.value)} className={inputClass()}>
            {state.orgAccounts.filter((a) => a.id !== from).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <div className="mt-3">
            <Field label="পরিমাণ (৳)" required hint={`উৎসে আছে ৳${bn(src?.balance ?? 0)} · ন্যূনতম ৳১০০`}>
              {(fid) => <input id={fid} inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value ? Number(e.target.value.replace(/\D/g, '')) : '')} className={inputClass() + ' num text-h3 font-extrabold text-center'} />}
            </Field>
          </div>
          <div className="flex justify-between text-sm pt-2"><span className="text-mut">ফি</span><span className="num font-bold">৳০</span></div>
          <div className="flex justify-between text-sm"><span className="text-mut">মোট ছাড়বে</span><span className="num font-extrabold">৳{bn(typeof amount === 'number' ? amount : 0)}</span></div>
        </Card>

        <Note tone="info"><b>এই টাকার সাথে সদস্যের সঞ্চয়ের সম্পর্ক নেই</b> — শুধু সমিতির অভ্যন্তরীণ হিসাব; সদস্য-ব্যালেন্স বদলায় না।</Note>

        <SectionHead title="অনুমোদনের অপেক্ষায়" sub={`${bn(state.transfers.filter((t) => t.status === 'pending').length)}টি`} />
        <div className="rounded-r-md border border-line bg-card overflow-hidden shadow-sh-1">
          {state.transfers.map((t) => (
            <Row key={t.id} icon={<Clock size={16} />}
              title={`${t.no} · ${t.from === 'oa1' ? 'প্রধান' : t.from === 'oa2' ? 'কর্জে হাসানা' : t.from === 'oa3' ? 'খরচ' : 'চ্যারিটি'} → ${t.to === 'oa2' ? 'কর্জে হাসানা' : t.to === 'oa3' ? 'খরচ' : t.to}`}
              sub={`${t.at} · ${t.by} · ${t.approvedBy || 'অনুমোদন বাকি'}`}
              right={<span className="text-right"><span className="num block font-bold">৳{bn(t.amount)}</span><Badge tone={t.status === 'done' ? 'ok' : t.status === 'unknown' ? 'danger' : 'warn'}>{t.status === 'done' ? 'সম্পন্ন' : t.status === 'unknown' ? 'অনিশ্চিত' : 'অপেক্ষমাণ'}</Badge></span>} />
          ))}
        </div>

        <Note tone="danger">
          <b>ব্যর্থ স্থানান্তর “অনিশ্চিত” খাতে</b> — ব্যাংক/ওয়ালেট থেকে নিশ্চিত উত্তর না এলে টাকা নিজ থেকে ফেরত বা কাটা যাবে না; রিকনসিলিয়েশনে মিলিয়ে নিতে হবে (AM-21)।
        </Note>
        <div className="flex items-center gap-1.5 text-xs text-mut justify-center"><ShieldAlert size={13} /> maker ≠ checker · সব স্থানান্তর অডিট লগে</div>
        <div className="flex items-center justify-center"><Badge tone="neutral">ডেমো ডেটা</Badge></div>
      </div>

      <DecisionBar note={<span>{src?.name} → {dest?.name} · ৳{bn(typeof amount === 'number' ? amount : 0)}</span>}>
        <Button size="sm" variant="ghost" onClick={() => navigate(`/a/home${roleQS}`)}>বাতিল</Button>
        <Button size="sm" icon={<CheckCircle2 size={15} />} onClick={submit}>স্থানান্তর প্রস্তাব</Button>
      </DecisionBar>
    </div>
  );
}
