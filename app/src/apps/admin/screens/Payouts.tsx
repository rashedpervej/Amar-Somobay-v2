/* ============================================================
   src/apps/admin/screens/Payouts.tsx — AM-16 নিষ্পত্তি ও পেমেন্ট
   অনুমোদিত উত্তোলন কিউ → মাধ্যম → ভাউচার → প্রদান।
   ওয়ালেট/ব্যাংক অনিশ্চিত হলে “Unknown” — অনুমানে Settled নয় (D-27)।
   ============================================================ */

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Banknote, CheckCircle2, Clock, ShieldAlert, Wallet } from 'lucide-react';
import { Badge, Button, Card, DecisionBar, SectionHead } from '../../../components/ui';
import { ErrorBanner, Field, SuccessBanner, inputClass } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import { CHANNEL_LABEL, type Channel } from '../../../domain/admin';
import { KV, Note, Stepper } from './parts';

const METHODS: Channel[] = ['cash', 'bkash', 'bank'];

export default function Payouts() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { state, payPayout } = useAdmin();
  const [picked, setPicked] = useState<string>(state.payouts.find((p) => p.status === 'approved')?.id ?? '');
  const [method, setMethod] = useState<Channel>('cash');
  const [voucher, setVoucher] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const roleQS = params.get('role') ? `?role=${params.get('role')}` : '';
  const queue = state.payouts.filter((p) => p.status === 'approved');
  const item = state.payouts.find((p) => p.id === picked);
  const total = queue.reduce((s, p) => s + p.amount, 0);

  function submit() {
    setError('');
    if (!item) { setError('একটি নিষ্পত্তি বাছাই করুন'); return; }
    if (voucher.trim().length < 2) { setError('ভাউচার নম্বর দিন'); return; }
    const r = payPayout(item.id, method, voucher.trim());
    if (!r.ok) { setError(r.message); return; }
    setDone(r.message);
    setVoucher('');
  }

  return (
    <div className="pb-2">
      <div className="p-4 space-y-4">
        <div className="flex items-start gap-2">
          <div className="grow">
            <h2 className="text-h2 text-txt">নিষ্পত্তি ও পেমেন্ট</h2>
            <p className="text-sm text-mut">{bn(queue.length)}টি অনুমোদিত · মোট ৳{bn(total)}</p>
          </div>
          <Badge tone={queue.length ? 'warn' : 'ok'}>{bn(queue.length)}</Badge>
        </div>
        {done ? <SuccessBanner title={done}>রসিদ ও ভাউচার সংরক্ষিত (ডেমো)।</SuccessBanner> : null}
        {error ? <ErrorBanner>{error}</ErrorBanner> : null}

        <Card><Stepper steps={['অনুমোদিত', 'মাধ্যম', 'প্রদান ও ভাউচার', 'সদস্যকে জানানো']} cur={1} /></Card>

        <SectionHead title="প্রদানের অপেক্ষায়" sub="অনুমোদিত উত্তোলন" />
        {queue.length === 0 ? <Note tone="ok">কিউ খালি — সব নিষ্পত্তি সম্পন্ন ✓</Note> : null}
        {queue.map((p) => (
          <button key={p.id} type="button" onClick={() => setPicked(p.id)}
            className={`w-full text-left rounded-r-md border bg-card shadow-sh-1 px-4 py-3 mb-2 ${picked === p.id ? 'border-green-700' : 'border-line'}`}>
            <div className="flex items-start gap-2">
              <span className="w-9 h-9 grid place-items-center rounded-r-pill bg-green-050 text-green-800 shrink-0"><Wallet size={16} /></span>
              <span className="grow min-w-0">
                <span className="block font-extrabold text-body">{p.member}</span>
                <span className="block text-xs text-mut">{p.no} · অনুমোদন {p.approvedBy}</span>
              </span>
              <span className="num font-extrabold text-body">৳{bn(p.amount)}</span>
            </div>
            {picked === p.id ? <div className="mt-1 text-xs font-bold text-green-800">নির্বাচিত</div> : null}
          </button>
        ))}

        {item ? (
          <>
            <SectionHead title="মাধ্যম" sub="প্রদানের সময় ও প্রমাণ বদলায়" />
            <Card>
              {METHODS.map((mth) => (
                <button key={mth} type="button" onClick={() => setMethod(mth)}
                  className={`w-full min-h-tap text-left rounded-r-sm border px-3 py-2 mb-2 ${method === mth ? 'border-green-700 bg-green-050' : 'border-line bg-card'}`}>
                  <span className="block text-sm font-bold">{CHANNEL_LABEL[mth]}</span>
                  <span className="block text-xs text-mut">{mth === 'cash' ? 'তাৎক্ষণিক · স্বাক্ষর ও রসিদ' : mth === 'bank' ? 'BEFTN · ১ কর্মদিবস' : 'ট্রানজেকশন আইডি সংরক্ষিত'}</span>
                </button>
              ))}
              <Field label="ভাউচার নম্বর" required hint="প্রদানের পরে সিস্টেম নিজেও তৈরি করে">
                {(fid) => <input id={fid} value={voucher} onChange={(e) => setVoucher(e.target.value)} placeholder="যেমন V-১০২২" className={inputClass() + ' num'} />}
              </Field>
            </Card>

            <SectionHead title="প্রদান সারাংশ" />
            <Card>
              <KV k="সদস্য" v={item.member} />
              <KV k="অঙ্ক" v={`৳${bn(item.amount)}`} />
              <KV k="মাধ্যম" v={CHANNEL_LABEL[method]} />
              <KV k="অনুমোদন" v={item.approvedBy} />
              <KV k="প্রদানের পর" v="লেজারে পোস্ট · সদস্যকে SMS · ভাউচার" />
              <Note tone="warn"><b>প্রদান করলেই লেজারে বসে যাবে</b> — ভুল হলে রিভার্সাল (AM-14) ছাড়া সংশোধন নেই।</Note>
            </Card>

            <Note tone="info">
              <b>ওয়ালেট পেমেন্ট</b> — নিশ্চিত উত্তর না এলে অবস্থা <b>Unknown</b>; টাকা কেটে না পৌঁছালে অনুমানে Settled ধরা হবে না।
            </Note>
            <div className="flex items-center gap-1.5 text-xs text-mut justify-center"><Clock size={13} /> {bn(1)}টি প্রদান অনিশ্চিত (Unknown) — রিকনসিলিয়েশনে মিলিয়ে নিন</div>
          </>
        ) : null}

        <div className="flex items-center gap-1.5 text-xs text-mut justify-center"><ShieldAlert size={13} /> ক্যাশ বুকে ঘোষিত নগদের বেশি প্রদান করা যাবে না</div>
        <Badge tone="neutral">ডেমো ডেটা</Badge>
      </div>

      <DecisionBar note={<span><Banknote size={13} className="inline -mt-0.5" /> {item ? `৳${bn(item.amount)} · ${CHANNEL_LABEL[method]}` : 'কিছু বাছাই করা হয়নি'}</span>}>
        <Button size="sm" variant="ghost" onClick={() => navigate(`/a/members${roleQS}`)}>সদস্য</Button>
        <Button size="sm" icon={<CheckCircle2 size={15} />} onClick={submit} disabled={!item}>প্রদান ও ভাউচার</Button>
      </DecisionBar>
    </div>
  );
}
