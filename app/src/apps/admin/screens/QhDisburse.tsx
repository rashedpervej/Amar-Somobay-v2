/* QAM-10 · বিতরণ — maker ≠ checker, OTP গেট, পুলের মুক্ত অঙ্ক ও ভাউচার (BR-22 · D-40) */

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Banknote, Check, FileCheck2, Printer, QrCode, ShieldAlert, ShieldCheck, Upload } from 'lucide-react';
import { Badge, Button, Card, SectionHead } from '../../../components/ui';
import { ErrorBanner, SuccessBanner, inputClass } from '../../../components/form';
import { Accordion, KV, Note } from './parts';
import { QhZero } from './qhParts';
import { bn } from '../../../lib/bn';
import { SEED_MEMBERS } from '../../../domain/admin';
import {
  QH_LOAN_ST, qhAppById, qhChannelLabel, qhPoolState, qhProductById, qhPurposeLabel, qhVoucherNo,
} from '../../../domain/adminQard';
import { useAdminQh } from '../../../store/adminQardStore';
import { tk, useRoleQS } from './rcParts';

export default function QhDisburse() {
  const navigate = useNavigate();
  const qs = useRoleQS();
  const { loanId } = useParams();
  const { state, disburse } = useAdminQh();
  const loan = state.loans.find((l) => l.id === loanId) ?? state.loans.find((l) => l.status === 'pending');
  const [otp, setOtp] = useState('');
  const [evidence, setEvidence] = useState<string[]>([]);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [done, setDone] = useState(false);

  if (!loan) {
    return (
      <div className="p-4 space-y-3 pb-8">
        <Card><p className="text-sm text-mut">বিতরণের অপেক্ষায় কোনো ঋণ নেই।</p>
          <Button className="mt-3" onClick={() => navigate(`/a/qh/loans${qs}`)}>ঋণ হাব</Button>
        </Card>
      </div>
    );
  }

  const member = SEED_MEMBERS.find((m) => m.id === loan.memberId);
  const product = qhProductById(state.products, loan.product)!;
  const app = qhAppById(state.apps, loan.app ?? undefined);
  const pool = qhPoolState(state.window, state.loans, state.apps);
  const existing = [...loan.evidence, ...evidence];

  const submit = () => {
    setErr(''); setOk('');
    const res = disburse(loan.id, { otp: otp.trim(), approver: 'নাসরিন আক্তার (অনুমোদনকারী)', note: '', evidence: evidence.map((e) => `প্রমাণ: ${e}`) });
    if (!res.ok) setErr(res.message); else { setOk(res.message); setDone(true); }
  };

  return (
    <div className="p-4 space-y-3 pb-8">
      <div className="rounded-r-sm border border-warn-bd bg-warn-bg px-3 py-2.5 text-sm text-warn-ink">
        <b>বিতরণ · OTP যাচাই বাধ্যতামূলক (BR-22)</b>
        <p className="text-xs mt-0.5">OTP মিল না হলে টাকা ছাড়া হবে না — নেভ ও মেনু বন্ধ (ফ্লো মোড)।</p>
      </div>

      <div className="flex items-center gap-2 text-xs text-mut">
        <button type="button" onClick={() => navigate(`/a/qh/loans/${loan.id}${qs}`)} className="min-h-tap inline-flex items-center gap-1 font-bold text-green-800"><ArrowLeft size={14} /> ঋণ</button>
        <span className="num">{loan.no}</span>
        <Badge tone={QH_LOAN_ST[loan.status].tone}>{QH_LOAN_ST[loan.status].t}</Badge>
        <QhZero />
      </div>

      {err ? <ErrorBanner>{err}</ErrorBanner> : null}
      {ok ? <SuccessBanner title="বিতরণ সম্পন্ন">{ok}</SuccessBanner> : null}

      <Card>
        <div className="flex items-start gap-3">
          <span className="shrink-0 size-11 rounded-r-pill bg-green-100 text-green-800 grid place-items-center font-extrabold text-lg">{member?.photo ?? 'স'}</span>
          <div className="grow min-w-0">
            <b className="text-body font-extrabold">{member?.name}</b>
            <div className="text-xs text-mut num">{member?.no} · {member?.mobile} · {product.code}</div>
          </div>
          <div className="text-right"><div className="num text-body font-extrabold">{tk(loan.principal)}</div><div className="text-[11px] text-mut">মূলধন · সুদ ৳০</div></div>
        </div>
        <div className="mt-2">
          <KV k="মাধ্যম" v={qhChannelLabel(loan.channel)} />
          <KV k="কমিটি রেফারেন্স" v={loan.committee} />
          <KV k="আবেদন" v={app ? `${app.no} · ${qhPurposeLabel(app.purpose)}` : '— (পুরোনো রেকর্ড)'} />
          <KV k="মেয়াদ" v={`${bn(loan.tenure)} কিস্তি · গ্রেস ${bn(product.grace)} দিন`} />
        </div>
      </Card>

      <SectionHead title="বিতরণ-পূর্ব গেট" sub="একটিও ব্যর্থ হলে ছাড় আটকাবে" />
      <Card>
        <KV k="maker ≠ checker" v={<Badge tone="ok"><Check size={11} /> {loan.by} ≠ {loan.appr}</Badge>} />
        <KV k="OTP যাচাই" v={loan.otp ? <Badge tone="ok"><ShieldCheck size={11} /> সম্পন্ন</Badge> : <Badge tone="danger"><ShieldAlert size={11} /> বাকি</Badge>} />
        <KV k="পুলে মুক্ত অঙ্ক (D-40)" v={<Badge tone={pool.available >= loan.principal ? 'ok' : 'danger'}><Banknote size={11} /> {tk(pool.available)} {pool.available >= loan.principal ? '≥' : '<'} {tk(loan.principal)}</Badge>} />
        <KV k="কমিটি রেফারেন্স (D-45)" v={<Badge tone="ok"><FileCheck2 size={11} /> {loan.committee}</Badge>} />
        <KV k="প্রমাণ সংযুক্তি" v={<Badge tone={existing.length ? 'ok' : 'warn'}>{bn(existing.length)}টি {existing.length ? '✓' : '— রসিদ/স্বাক্ষর যুক্ত করুন'}</Badge>} />
        <KV k="কিস্তি ছক" v={`বিতরণের পরেই তৈরি হবে (মূলধন ÷ ${bn(loan.tenure)})`} />
        {!done ? (
          <>
            <label className="block text-sm font-bold mb-1 mt-3" htmlFor="qh-otp">OTP (৬ সংখ্যা)</label>
            <input id="qh-otp" className={inputClass()} inputMode="numeric" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="ডেমো OTP: 123456" />
            <label className="mt-2 flex items-center gap-2 min-h-tap rounded-r-sm border border-dashed border-line-2 bg-card-2 px-3 py-2.5 text-sm font-bold text-green-800">
              <Upload size={15} /> প্রমাণ সংযুক্ত করুন
              <input type="file" accept="image/*" className="sr-only" onChange={(e) => setEvidence((v) => [...v, e.target.files?.[0]?.name ?? 'স্বাক্ষর/ছবি'])} />
            </label>
            {evidence.length ? <p className="text-xs text-ok-ink mt-1">যুক্ত: {evidence.join(', ')}</p> : null}
            <button type="button" onClick={() => setEvidence((v) => (v.includes('সদস্যের স্বাক্ষরিত রসিদ') ? v : [...v, 'সদস্যের স্বাক্ষরিত রসিদ']))}
              className={`mt-2 min-h-tap w-full flex items-center gap-2 rounded-r-sm border px-3 py-2.5 text-left text-sm ${evidence.includes('সদস্যের স্বাক্ষরিত রসিদ') ? 'border-ok-bd bg-ok-bg' : 'border-line bg-card'}`}>
              <span className={`size-5 shrink-0 rounded-r-sm border-2 grid place-items-center ${evidence.includes('সদস্যের স্বাক্ষরিত রসিদ') ? 'bg-green-700 border-green-700 text-white' : 'border-line-2'}`}>
                {evidence.includes('সদস্যের স্বাক্ষরিত রসিদ') ? <Check size={12} /> : null}
              </span>
              <span className="font-bold">সদস্যের স্বাক্ষর ও টাকার ছবি সংযুক্ত হয়েছে (D-50)</span>
            </button>
          </>
        ) : null}
      </Card>

      <SectionHead title="ভাউচার ও রসিদ" sub="অপরিবর্তনীয় · হ্যাশসহ" />
      <Card>
        <div className="rounded-r-sm bg-green-800 text-white px-4 py-4 text-center">
          <span className="inline-flex items-center gap-1 rounded-r-pill border border-qh-gold-hi/70 bg-qh-gold/20 px-2 py-0.5 text-[11px] font-bold text-qh-gold-soft"><Banknote size={11} /> বিতরণ ভাউচার (প্রিভিউ)</span>
          <div className="num text-[30px] font-extrabold mt-1">{tk(loan.principal)}</div>
          <div className="text-xs text-green-100">মাত্র · সুদ ৳০ · কোনো চার্জ নেই</div>
          <div className="inline-flex items-center gap-1 mt-2 rounded-r-sm bg-white/15 border border-white/30 px-3 py-1.5 text-xs"><QrCode size={14} /> ভাউচার যাচাই কোড</div>
          <div className="text-[11px] text-green-100 mt-1 num">{qhVoucherNo(loan.no)} · হ্যাশ {done ? 'যুক্ত হয়েছে' : 'বিতরণের পর বসবে'}</div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Button variant="secondary" size="sm" onClick={() => setOk('ভাউচার লিংক কপি হয়েছে (ডেমো) — সদস্যকে SMS/অ্যাপে পাঠানো হবে')}>সদস্যকে পাঠান</Button>
          <Button variant="ghost" size="sm" icon={<Printer size={14} />} onClick={() => setOk('থার্মাল রসিদ প্রিভিউ প্রস্তুত (ডেমো) — প্রিন্টার সংযুক্ত নয়')}>থার্মাল রসিদ</Button>
        </div>
      </Card>

      <SectionHead title="লেজার প্রভাব" sub="ডাবল-এন্ট্রি · R-01" />
      <Card>
        <div className="grid grid-cols-4 gap-1 bg-card-2 px-2 py-1.5 text-[11px] font-bold text-mut rounded-r-sm">
          <span>খাত</span><span className="text-right">ডেবিট</span><span className="text-right">ক্রেডিট</span><span className="text-right">বিবরণ</span>
        </div>
        {[
          ['কর্জে হাসানা আদায়যোগ্য', tk(loan.principal), '—', 'সম্পদ বৃদ্ধি'],
          [qhChannelLabel(loan.channel), '—', tk(loan.principal), `${loan.no} বিতরণ`],
          ['সুদ / মুনাফা আয়', '৳০', '৳০', 'খাতাই নেই (BR-20)'],
        ].map((r) => (
          <div key={r[0]} className="grid grid-cols-4 gap-1 px-2 py-1.5 text-[11px] border-t border-line-2">
            <span>{r[0]}</span><span className="text-right num">{r[1]}</span><span className="text-right num">{r[2]}</span><span className="text-right text-mut">{r[3]}</span>
          </div>
        ))}
        <p className="text-xs text-mut mt-2">মোট ডেবিট = মোট ক্রেডিট → ট্রায়াল ব্যালেন্স ৳০ (BR-12)।</p>
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={() => navigate(`/a/qh/loans${qs}`)}>বিতরণ স্থগিত</Button>
        <Button icon={<ShieldCheck size={15} />} onClick={submit} disabled={done}>OTP যাচাই ও ছাড়</Button>
        <Button variant="ghost" onClick={() => navigate(`/a/qh/loans/${loan.id}${qs}`)}>ঋণ বিস্তারিত</Button>
        <Button variant="ghost" onClick={() => navigate(`/a/qh/applications${qs}`)}>আবেদন কিউ</Button>
      </div>

      <Accordion title="নিয়ন্ত্রণ ও সিদ্ধান্ত (D-22/40/45)" sub="সীমা ম্যাট্রিক্স ও প্রমাণ">
        <KV k="maker" v={loan.by} />
        <KV k="checker" v={loan.appr} />
        <KV k="প্রমাণ" v={existing.join(', ') || 'কিছু নেই'} />
        <KV k="বিলম্ব হলে" v="হল্ড অঙ্ক পুলে থেকে যায়; দিনশেষে অমীমাংসিত হিসেবে গেট আটকায় (BR-25)" />
        <div className="mt-2"><Note tone="warn">এই বিতরণে কোনো সুদ, সার্ভিস চার্জ বা বিলম্ব ফি নেই — শুধু মূলধন (BR-20 · D-41)।</Note></div>
      </Accordion>
    </div>
  );
}
