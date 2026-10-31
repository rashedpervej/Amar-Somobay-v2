/* ============================================================
   src/apps/admin/screens/ApplicationReview.tsx — AM-08 আবেদন বিবরণ ও যাচাই
   নিবন্ধন আবেদন: ডকুমেন্ট যাচাই টগল, নীতি পরীক্ষা, মন্তব্য,
   অনুমোদন / প্রত্যাখ্যান / আরও তথ্য চাই — তিনটিই আসল অ্যাকশন।
   ============================================================ */

import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Camera, CheckCircle2, Clock, FileText, Send, ShieldAlert, X } from 'lucide-react';
import { Badge, Button, Card, DecisionBar, Row, SectionHead } from '../../../components/ui';
import { ErrorBanner, Field, SuccessBanner, inputClass } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import { memberById } from '../../../domain/admin';
import { KV, Note, Stepper } from './parts';

export default function ApplicationReview() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { state, reviewApplication } = useAdmin();
  const item = state.approvals.find((a) => a.id === id);
  const member = memberById(state.members, item?.memberId);
  const [docs, setDocs] = useState<Record<string, boolean>>({ photo: true, nid_front: true, nid_back: false, signature: true });
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const roleQS = params.get('role') ? `?role=${params.get('role')}` : '';

  if (!item || !member) {
    return (
      <div className="p-4 space-y-3">
        <Note tone="warn">এই আবেদনটি নিষ্পত্তি হয়েছে বা পাওয়া যায়নি।</Note>
        <Button onClick={() => navigate(`/a/approvals${roleQS}`)}>কিউতে ফিরুন</Button>
      </div>
    );
  }

  const ok = Object.values(docs).filter(Boolean).length;

  function act(kind: 'approve' | 'reject' | 'info') {
    setError('');
    if (kind === 'approve' && ok < 4) { setError('সব ডকুমেন্ট যাচাই ছাড়া অনুমোদন করা যাবে না'); return; }
    if (kind !== 'approve' && comment.trim().length < 5) { setError('কারণ/মন্তব্য অন্তত ৫ অক্ষরে লিখুন'); return; }
    const r = reviewApplication(item!.id, kind, comment || 'ডকুমেন্ট যাচাই সম্পন্ন');
    if (!r.ok) { setError(r.message); return; }
    setDone(r.message);
  }

  return (
    <div className="pb-2">
      <div className="p-4 space-y-4">
        <button type="button" onClick={() => navigate(`/a/approvals${roleQS}`)} className="min-h-tap inline-flex items-center gap-1.5 text-sm font-bold text-green-700">← আবেদন কিউ</button>
        {done ? <SuccessBanner title={done}>ডেমো — কোনো বাস্তব তথ্য সংরক্ষিত হয়নি।</SuccessBanner> : null}
        {error ? <ErrorBanner>{error}</ErrorBanner> : null}

        <div className="flex items-start gap-2">
          <div className="w-12 h-12 rounded-r-lg bg-green-100 text-green-800 grid place-items-center text-xl font-extrabold">{member.photo}</div>
          <div className="grow">
            <h2 className="text-h2 leading-tight">{member.name}</h2>
            <p className="text-xs text-mut">{item.ref} · {item.submitted} · আমন্ত্রণ কোড {member.route}</p>
          </div>
          <Badge tone="warn">{bn(28)} বছর</Badge>
        </div>

        <Card>
          <Stepper steps={['আবেদন', 'ডকুমেন্ট', 'যাচাই', 'সিদ্ধান্ত']} cur={2} />
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Card title="স্কিম" sub={item.kind === 'member' ? 'মাসিক সঞ্চয়' : 'জমা'}><p className="text-sm font-bold text-txt-2">কিস্তি ৳{bn(1000)}</p></Card>
          <Card title="প্রথম জমা" sub={item.evidence ? 'রসিদ আছে' : 'রসিদ বাকি'}><p className="num text-h3 font-extrabold text-ok-ink">৳{bn(item.amount)}</p></Card>
        </div>

        <SectionHead title="ডকুমেন্ট যাচাই" sub={`${bn(ok)}/৪টি ঠিক আছে`} />
        <Card>
          {([['photo', 'ছবি'], ['nid_front', 'NID — সামনে'], ['nid_back', 'NID — পেছনে'], ['signature', 'সাক্ষর']] as const).map(([k, t]) => (
            <div key={k} className="flex items-center gap-2 py-2.5 border-b border-line-2 last:border-b-0">
              <span className={`w-8 h-8 grid place-items-center rounded-r-pill ${docs[k] ? 'bg-ok-bg text-ok-ink' : 'bg-warn-bg text-warn-ink'}`}>
                {docs[k] ? <CheckCircle2 size={15} /> : <Camera size={15} />}
              </span>
              <span className="grow">
                <span className="block text-sm font-bold">{t}</span>
                <span className="block text-xs text-mut">{docs[k] ? 'স্পষ্ট · NID-এর সাথে মিলেছে' : 'অস্পষ্ট / সংযুক্ত নেই'}</span>
              </span>
              <Button size="sm" variant={docs[k] ? 'ghost' : 'secondary'} onClick={() => setDocs((d) => ({ ...d, [k]: !d[k] }))}>
                {docs[k] ? 'বাতিল' : 'যাচাই'}
              </Button>
            </div>
          ))}
        </Card>

        <SectionHead title="নীতি ও ঝুঁকি যাচাই" />
        <Card>
          <Row icon={<CheckCircle2 size={16} />} title="বয়স ≥ ১৮ (D-14)" sub="২৮ বছর ✓" />
          <Row icon={<CheckCircle2 size={16} />} title="এক NID = এক সদস্য (D-16)" sub="ডুপ্লিকেট মেলেনি ✓" />
          <Row icon={ok === 4 ? <CheckCircle2 size={16} /> : <Clock size={16} />} title="KYC সম্পূর্ণতা" sub={ok === 4 ? 'সম্পূর্ণ ✓' : 'আংশিক — ডকুমেন্ট বাকি'} tone={ok === 4 ? undefined : 'warn'} />
          <Row icon={<CheckCircle2 size={16} />} title="এলাকা সমিতির ভিতরে" sub={`${member.village} ✓`} />
          <Row icon={<ShieldAlert size={16} />} title="maker ≠ checker (BR-04)" sub="সংগ্রহক এন্ট্রি করেছেন — আপনি অনুমোদন করতে পারবেন ✓" />
        </Card>

        <SectionHead title="মন্তব্য" sub="অডিট লগে যাবে" />
        <Card>
          <Field label="আপনার মন্তব্য" hint="যাচাইয়ে কী দেখলেন, কেন অনুমোদন/প্রত্যাখ্যান">
            {(fid) => <textarea id={fid} rows={2} value={comment} onChange={(e) => setComment(e.target.value)} className={inputClass() + ' py-2'} />}
          </Field>
        </Card>

        <SectionHead title="সিদ্ধান্তের ফল" />
        <Card>
          <KV k="অনুমোদন করলে" v="সদস্য নম্বর → প্রথম জমা পোস্ট → SMS → রসিদ" />
          <KV k="প্রত্যাখ্যান করলে" v="কারণ + SMS · আবেদন আর্কাইভে থাকবে (মুছবে না)" />
          <KV k="তথ্য চাইলে" v="আবেদনকারীকে SMS · ৭ দিনে সাড়া না দিলে বাতিল" />
          <Note tone="warn">ডকুমেন্ট অস্পষ্ট হলে অনুমোদন আটকাবে — অনুমান করে অনুমোদন করা যাবে না।</Note>
        </Card>

        <div className="flex items-center gap-2 text-xs text-mut justify-center"><FileText size={13} /> {item.ref} · {item.by}</div>
      </div>

      <DecisionBar note={<span><b>৳{bn(item.amount)}</b> প্রথম জমা</span>}>
        <Button size="sm" variant="danger" icon={<X size={14} />} onClick={() => act('reject')} disabled={Boolean(done)}>প্রত্যাখ্যান</Button>
        <Button size="sm" variant="ghost" icon={<Send size={14} />} onClick={() => act('info')} disabled={Boolean(done)}>তথ্য চাই</Button>
        <Button size="sm" icon={<CheckCircle2 size={14} />} onClick={() => act('approve')} disabled={Boolean(done)}>অনুমোদন</Button>
      </DecisionBar>
    </div>
  );
}
