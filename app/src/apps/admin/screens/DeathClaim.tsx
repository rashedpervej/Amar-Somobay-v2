/* ============================================================
   src/apps/admin/screens/DeathClaim.tsx — AM-19 মৃত্যু দাবি নিষ্পত্তি
   দাবি তালিকা, প্রমাণ-চেকলিস্ট, নমিনি যাচাই, কমিটি অনুমোদন,
   একা সিদ্ধান্ত নয় — সব প্রমাণ ছাড়া অনুমোদন আটকায়।
   ============================================================ */

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, FileText, Heart, Lock, Users, X } from 'lucide-react';
import { Badge, Button, Card, DecisionBar, Row, SectionHead } from '../../../components/ui';
import { ErrorBanner, Field, SuccessBanner, inputClass } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import { claimMissing } from '../../../domain/admin';
import { KV, Note, Stepper } from './parts';

export default function DeathClaim() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { state, settleClaim } = useAdmin();
  const [picked, setPicked] = useState(state.claims[0]?.id ?? '');
  const [committeeNo, setCommitteeNo] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const roleQS = params.get('role') ? `?role=${params.get('role')}` : '';
  const claim = state.claims.find((c) => c.id === picked);
  const missing = claim ? claimMissing(claim) : [];

  function approve() {
    setError('');
    if (!claim) return;
    if (missing.length) { setError(`${bn(missing.length)}টি প্রমাণ বাকি — অনুমোদন করা যাবে না`); return; }
    if (!committeeNo.trim()) { setError('কমিটির সিদ্ধান্ত নম্বর দিন'); return; }
    const r = settleClaim(claim.id, true);
    if (!r.ok) { setError(r.message); return; }
    setDone(r.message);
  }

  return (
    <div className="pb-2">
      <div className="p-4 space-y-4">
        <h2 className="text-h2 text-txt">মৃত্যু দাবি নিষ্পত্তি</h2>
        <p className="text-sm text-mut">{bn(state.claims.length)}টি দাবি · {bn(state.claims.filter((c) => c.disputed).length)}টি বিরোধ</p>
        {done ? <SuccessBanner title={done}>নমিনিকে SMS ও অ্যাপ নোটিফিকেশন যাবে (ডেমো)।</SuccessBanner> : null}
        {error ? <ErrorBanner>{error}</ErrorBanner> : null}

        <Card><Stepper steps={['মৃত্যুর খবর', 'প্রমাণ', 'দাবিদার', 'কমিটি', 'প্রদান']} cur={1} /></Card>

        <SectionHead title="দাবি তালিকা" />
        {state.claims.map((c) => (
          <button key={c.id} type="button" onClick={() => setPicked(c.id)}
            className={`w-full min-h-tap text-left rounded-r-md border bg-card shadow-sh-1 px-4 py-3 mb-2 ${picked === c.id ? 'border-green-700' : 'border-line'}`}>
            <div className="flex items-start gap-2">
              <span className="w-9 h-9 grid place-items-center rounded-r-pill bg-warn-bg text-warn-ink shrink-0"><Heart size={16} /></span>
              <span className="grow min-w-0">
                <span className="block font-extrabold text-body">{c.member}</span>
                <span className="block text-xs text-mut">{c.accNo} · মৃত্যু {c.deathAt}</span>
              </span>
              <span className="text-right">
                <span className="num block font-bold">৳{bn(c.amount)}</span>
                <Badge tone={c.disputed ? 'danger' : c.status === 'paid' ? 'ok' : 'warn'}>{c.disputed ? 'বিরোধ' : c.status === 'paid' ? 'প্রদত্ত' : 'যাচাই'}</Badge>
              </span>
            </div>
          </button>
        ))}

        {claim ? (
          <>
            <SectionHead title="প্রমাণ যাচাই" sub={`${bn(claim.docs.length - missing.length)}/${bn(claim.docs.length)}টি ঠিক আছে`} />
            <Card>
              {claim.docs.map((d) => (
                <Row key={d.t} icon={d.ok ? <CheckCircle2 size={16} /> : <X size={16} />} title={d.t} sub={d.ok ? 'সংযুক্ত ও যাচাইকৃত' : 'সংযুক্ত নেই — নিষ্পত্তি আটকাবে'} tone={d.ok ? undefined : 'danger'} />
              ))}
            </Card>

            <SectionHead title="নমিনি ও দাবিদার" />
            <Card>
              <KV k="নমিনি" v={`${claim.nominee} (${claim.relation})`} />
              <KV k="শেয়ার" v={`${bn(claim.sharePct)}%`} />
              <KV k="যোগ্য অঙ্ক" v={`৳${bn(claim.amount)}`} />
              <KV k="বিরোধ" v={claim.disputed ? 'আছে — কমিটি সিদ্ধান্ত বাধ্যতামূলক' : 'নেই'} />
              <div className="flex gap-2 mt-2">
                <Button size="sm" variant="ghost" className="grow" icon={<Users size={14} />} onClick={() => setDone('ওয়ারিশ তালিকা যাচাই শুরু হয়েছে (ডেমো)')}>ওয়ারিশ</Button>
                <Button size="sm" variant="ghost" className="grow" icon={<FileText size={14} />} onClick={() => navigate('/verify')}>প্রমাণ যাচাই</Button>
              </div>
            </Card>

            <SectionHead title="কমিটি অনুমোদন" />
            <Card>
              <Field label="কমিটির সিদ্ধান্ত নম্বর" required hint="একা সিদ্ধান্ত নেওয়া যাবে না">
                {(fid) => <input id={fid} value={committeeNo} onChange={(e) => setCommitteeNo(e.target.value)} placeholder="যেমন ০৯/২০২৬" className={inputClass() + ' num'} />}
              </Field>
              <Note tone="info"><b>নমিনি না থাকলে</b> — ওয়ারিশ তালিকা ও কমিটির সিদ্ধান্ত অনুযায়ী বণ্টন হবে; একক স্টাফ সিদ্ধান্ত নিতে পারবেন না।</Note>
            </Card>

            {missing.length ? (
              <Note tone="danger"><b>{bn(missing.length)}টি প্রমাণ বাকি — নিষ্পত্তি আটকাবে</b> — {missing.map((m) => m.t).join(' · ')}।</Note>
            ) : null}
          </>
        ) : null}

        <div className="flex items-center gap-1.5 text-xs text-mut justify-center"><Lock size={13} /> কমিটি অনুমোদন ও প্রমাণ ছাড়া প্রদান নয় · অডিট লগ</div>
        <div className="flex items-center gap-1.5 text-xs text-mut justify-center"><AlertTriangle size={13} /> ডেমো ডেটা — বাস্তব দাবি নয়</div>
      </div>

      <DecisionBar note={<span>{claim ? `${claim.member} · ৳${bn(claim.amount)}` : '—'}</span>}>
        <Button size="sm" variant="ghost" onClick={() => claim && setDone('কমিটিতে পাঠানো হয়েছে (ডেমো)')} disabled={!claim}>কমিটিতে</Button>
        <Button size="sm" icon={<CheckCircle2 size={15} />} onClick={approve} disabled={!claim || Boolean(done)}>অনুমোদন ও প্রদান</Button>
      </DecisionBar>
    </div>
  );
}
