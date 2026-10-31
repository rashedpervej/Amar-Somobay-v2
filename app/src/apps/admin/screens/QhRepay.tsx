/* QAM-13 · পরিশোধ এন্ট্রি ও রসিদ — অপরিবর্তনীয় রসিদ (BR-08), COLLECTOR সীমা ৳০ (এন্ট্রি শুধু) */

import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Banknote, Camera, Check, QrCode, ReceiptText, ShieldCheck, Upload } from 'lucide-react';
import { Badge, Button, Card, Chipset, Chip, SectionHead } from '../../../components/ui';
import { ErrorBanner, SuccessBanner, inputClass } from '../../../components/form';
import { KV, Note } from './parts';
import { QhZero } from './qhParts';
import { bn } from '../../../lib/bn';
import { SEED_MEMBERS } from '../../../domain/admin';
import {
  QH_CHANNEL, QH_TODAY, qhChannelLabel, qhDate, qhInsts, qhOutstanding, qhPerInst, qhProductById, type ChannelKey,
} from '../../../domain/adminQard';
import { useAdminQh } from '../../../store/adminQardStore';
import { tk, useRoleQS } from './rcParts';

export default function QhRepay() {
  const navigate = useNavigate();
  const qs = useRoleQS();
  const { loanId } = useParams();
  const [params] = useSearchParams();
  const { state, recordRepay } = useAdminQh();
  const loan = state.loans.find((l) => l.id === loanId) ?? state.loans.find((l) => l.status === 'arrears') ?? state.loans[0];
  const insts = qhInsts(loan, state.repayments);
  const firstUnpaid = insts.find((i) => i.status === 'overdue' || i.status === 'upcoming');
  const preset = Number(params.get('inst')) || firstUnpaid?.no || 1;
  const [inst, setInst] = useState(String(preset));
  const [amount, setAmount] = useState(String(qhPerInst(loan)));
  const [channel, setChannel] = useState<ChannelKey>('cash');
  const [cashNote, setCashNote] = useState('');
  const [photo, setPhoto] = useState('');
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [receipt, setReceipt] = useState<string | null>(null);

  const member = SEED_MEMBERS.find((m) => m.id === loan.memberId);
  const product = qhProductById(state.products, loan.product)!;
  const out = qhOutstanding(loan, state.repayments, state.writeoffs);
  const selected = useMemo(() => insts.find((i) => i.no === Number(inst)), [insts, inst]);
  const latest = state.repayments[0];

  const submit = () => {
    setErr(''); setOk('');
    if (photo === '' && channel === 'cash') {
      setErr('নগদ গ্রহণে গণনার ছবি বা স্বাক্ষর সংযুক্ত করতে হবে (D-50)');
      return;
    }
    const res = recordRepay(loan.id, Number(inst), Number(amount) || 0, channel, 'রাজু আহমেদ (সংগ্রহক)');
    if (!res.ok) { setErr(res.message); return; }
    setOk(res.message);
    setReceipt('QR-…');
  };

  return (
    <div className="p-4 space-y-3 pb-8">
      <div className="rounded-r-sm border border-line bg-card-2 px-3 py-2.5 text-sm">
        <b>পরিশোধ এন্ট্রি · COLLECTOR</b>
        <p className="text-xs text-mut mt-0.5">সীমা ৳০ — এন্ট্রি শুধু; রসিদ নম্বর অপরিবর্তনীয়, ভুল হলে বিপরীত এন্ট্রি (R-02)।</p>
      </div>

      <div className="flex items-center gap-2 text-xs text-mut">
        <button type="button" onClick={() => navigate(`/a/qh/loans/${loan.id}${qs}`)} className="min-h-tap inline-flex items-center gap-1 font-bold text-green-800"><ArrowLeft size={14} /> ঋণ</button>
        <span className="num">{loan.no}</span>
        <Badge tone="neutral">বাকি {tk(out)}</Badge>
        <QhZero />
      </div>

      {err ? <ErrorBanner>{err}</ErrorBanner> : null}
      {ok ? <SuccessBanner title="রসিদ ইস্যু">{ok}</SuccessBanner> : null}

      <Card>
        <div className="flex items-start gap-2">
          <span className="shrink-0 size-10 rounded-r-pill bg-green-100 text-green-800 grid place-items-center font-extrabold">{member?.photo ?? 'স'}</span>
          <div className="grow min-w-0">
            <b className="text-body font-extrabold">{member?.name}</b>
            <div className="text-xs text-mut num">{member?.no} · {product.code} · কিস্তি {bn(qhPerInst(loan))}</div>
          </div>
          <div className="text-right"><div className="num font-extrabold">{tk(out)}</div><div className="text-[11px] text-mut">বাকি মূলধন</div></div>
        </div>
      </Card>

      <SectionHead title="কিস্তি বাছাই" sub={`${bn(insts.filter((i) => i.status === 'overdue').length)}টি বকেয়া · ${bn(insts.filter((i) => i.status === 'upcoming').length)}টি আসন্ন`} />
      <Card>
        <label className="block text-sm font-bold mb-1" htmlFor="qh-r-inst">কিস্তি নম্বর</label>
        <select id="qh-r-inst" className={inputClass()} value={inst} onChange={(e) => {
          setInst(e.target.value);
          const s = insts.find((i) => i.no === Number(e.target.value));
          if (s) setAmount(String(s.amount));
        }}>
          {insts.map((i) => <option key={i.no} value={i.no} disabled={i.status === 'paid' || i.status === 'waived'}>
            কিস্তি {bn(i.no)} · {qhDate(i.due)} · {tk(i.amount)} {i.status === 'overdue' ? '(বকেয়া)' : i.status === 'paid' ? '(পরিশোধিত)' : ''}
          </option>)}
        </select>
        {selected ? (
          <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
            <div className="rounded-r-sm bg-card-2 border border-line-2 px-2 py-1.5"><i className="not-italic text-mut block">নির্ধারিত</i><b>{qhDate(selected.due)}</b></div>
            <div className="rounded-r-sm bg-card-2 border border-line-2 px-2 py-1.5"><i className="not-italic text-mut block">কিস্তি</i><b className="num">{tk(selected.amount)}</b></div>
            <div className="rounded-r-sm bg-card-2 border border-line-2 px-2 py-1.5"><i className="not-italic text-mut block">অবস্থা</i><b>{selected.status === 'overdue' ? 'বকেয়া' : selected.status === 'paid' ? 'পরিশোধিত' : 'আসন্ন'}</b></div>
          </div>
        ) : null}

        <label className="block text-sm font-bold mb-1 mt-3" htmlFor="qh-r-amt">অঙ্ক (৳)</label>
        <input id="qh-r-amt" className={inputClass()} inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <p className="text-xs text-mut mt-1">সর্বোচ্চ বাকি {tk(out)} — বেশি গ্রহণ করা যাবে না; কোনো সুদ/ফি নেই।</p>

        <div className="text-sm font-bold mt-3 mb-1">মাধ্যম</div>
        <Chipset>
          {QH_CHANNEL.map((c) => <Chip key={c.k} active={channel === c.k} onClick={() => setChannel(c.k)}>{c.t}</Chip>)}
        </Chipset>

        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="rounded-r-sm bg-card-2 border border-line-2 px-2 py-1.5 text-xs"><i className="not-italic text-mut block">তারিখ</i><b>{qhDate(QH_TODAY)}</b></div>
          <div className="rounded-r-sm bg-card-2 border border-line-2 px-2 py-1.5 text-xs"><i className="not-italic text-mut block">গ্রহণকারী</i><b>রাজু আহমেদ</b></div>
        </div>

        {channel === 'cash' ? (
          <>
            <label className="block text-sm font-bold mb-1 mt-3" htmlFor="qh-r-note">নগদ গণনার টীকা</label>
            <input id="qh-r-note" className={inputClass()} value={cashNote} onChange={(e) => setCashNote(e.target.value)} placeholder="যেমন: ৫০০×২ + ১০০×৩ = ১,৩০০ যাচাই" />
            <label className="mt-2 flex items-center gap-2 min-h-tap rounded-r-sm border border-dashed border-line-2 bg-card-2 px-3 py-2.5 text-sm font-bold text-green-800">
              <Camera size={15} /> নগদ গণনার ছবি / স্বাক্ষর
              <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => setPhoto(e.target.files?.[0]?.name ?? 'ছবি')} />
            </label>
            {photo ? <p className="text-xs text-ok-ink mt-1">সংযুক্ত: {photo}</p> : null}
            <button type="button" onClick={() => setPhoto('নগদ গণনা যাচাই — সংগ্রহক স্বাক্ষর')}
              className={`mt-2 min-h-tap w-full flex items-center gap-2 rounded-r-sm border px-3 py-2.5 text-left text-sm ${photo.includes('গণনা') ? 'border-ok-bd bg-ok-bg' : 'border-line bg-card'}`}>
              <span className={`size-5 shrink-0 rounded-r-sm border-2 grid place-items-center ${photo.includes('গণনা') ? 'bg-green-700 border-green-700 text-white' : 'border-line-2'}`}>
                {photo.includes('গণনা') ? <Check size={12} /> : null}
              </span>
              <span className="font-bold">নগদ গণনা যাচাই করেছি (D-50)</span>
            </button>
          </>
        ) : (
          <div className="mt-3 flex items-center gap-2">
            <label className="flex items-center gap-2 min-h-tap rounded-r-sm border border-dashed border-line-2 bg-card-2 px-3 py-2.5 text-sm font-bold text-green-800 grow">
              <Upload size={15} /> রেফারেন্স / স্ক্রিনশট
              <input type="file" accept="image/*" className="sr-only" onChange={(e) => setPhoto(e.target.files?.[0]?.name ?? 'রেফারেন্স')} />
            </label>
          </div>
        )}
      </Card>

      <SectionHead title="রসিদ প্রিভিউ" sub="অপরিবর্তনীয় · QR + হ্যাশ" right={<Badge tone="warn"><ReceiptText size={11} /> ডেমো</Badge>} />
      <Card>
        <div className="rounded-r-sm bg-green-800 text-white px-4 py-4 text-center">
          <span className="inline-flex items-center gap-1 rounded-r-pill border border-qh-gold-hi/70 bg-qh-gold/20 px-2 py-0.5 text-[11px] font-bold text-qh-gold-soft"><ReceiptText size={11} /> পরিশোধ রসিদ (প্রিভিউ)</span>
          <div className="num text-[30px] font-extrabold mt-1">{tk(Number(amount) || 0)}</div>
          <div className="text-xs text-green-100">কিস্তি {bn(Number(inst) || 0)} · {qhChannelLabel(channel)} · সুদ ৳০</div>
          <div className="inline-flex items-center gap-1 mt-2 rounded-r-sm bg-white/15 border border-white/30 px-3 py-1.5 text-xs"><QrCode size={14} /> রসিদ যাচাই কোড</div>
          <div className="text-[11px] text-green-100 mt-1">রসিদ নম্বর: {receipt ? (latest?.receipt ?? 'QR-…') : 'গ্রহণের পর বসবে'} · হ্যাশ {receipt ? (latest?.receipt.slice(-4) ?? '') : '—'}</div>
        </div>
        <div className="mt-2 grid grid-cols-4 gap-1 px-2 py-1.5 text-[11px] font-bold text-mut bg-card-2 rounded-r-sm">
          <span>খাত</span><span className="text-right">ডেবিট</span><span className="text-right">ক্রেডিট</span><span className="text-right">বিবরণ</span>
        </div>
        {[
          ['নগদ/ব্যাংক', tk(Number(amount) || 0), '—', 'সম্পদ বৃদ্ধি'],
          ['কর্জে হাসানা আদায়যোগ্য', '—', tk(Number(amount) || 0), 'দায় হ্রাস'],
          ['সুদ আয়', '৳০', '৳০', 'খাতাই নেই (BR-20)'],
        ].map((r) => (
          <div key={r[0]} className="grid grid-cols-4 gap-1 px-2 py-1.5 text-[11px] border-t border-line-2">
            <span>{r[0]}</span><span className="text-right num">{r[1]}</span><span className="text-right num">{r[2]}</span><span className="text-right text-mut">{r[3]}</span>
          </div>
        ))}
        <div className="mt-2"><Note tone="info">ডেবিট = ক্রেডিট → ট্রায়াল ব্যালেন্স ৳০ (BR-12)। ভুল হলে বিপরীত এন্ট্রি + নতুন রসিদ; মুছে ফেলা যায় না (BR-08/R-02)।</Note></div>
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" icon={<ArrowLeft size={15} />} onClick={() => navigate(`/a/qh/loans/${loan.id}${qs}`)}>বাতিল</Button>
        <Button icon={<Check size={15} />} onClick={submit}>গ্রহণ ও রসিদ ইস্যু</Button>
        <Button variant="ghost" icon={<Banknote size={15} />} onClick={() => navigate(`/a/qh/loans${qs}`)}>ঋণ হাব</Button>
        <Button variant="ghost" icon={<ShieldCheck size={15} />} onClick={() => navigate(`/a/qh/reports${qs}`)}>রিপোর্ট</Button>
      </div>

      <Card title="লেনদেনের নিয়ম" sub="D-22 · BR-08">
        <KV k="COLLECTOR সীমা" v="৳০ — এন্ট্রি শুধু, অনুমোদন নয়" />
        <KV k="রসিদ" v="অপরিবর্তনীয় · QR-YYMM-####" />
        <KV k="বিলম্ব ফি" v={<b className="text-ok-ink">৳০ (D-41)</b>} />
        <KV k="অফলাইন কিউ" v="নেটওয়ার্ক না থাকলে এন্ট্রি কিউতে থাকবে (D-60)" />
        <div className="mt-2 flex items-center gap-1 text-xs text-mut"><ShieldCheck size={13} /> কোনো ক্ষেত্রেই সুদ বা সার্ভিস চার্জ যোগ হয় না (BR-20)।</div>
      </Card>
    </div>
  );
}
