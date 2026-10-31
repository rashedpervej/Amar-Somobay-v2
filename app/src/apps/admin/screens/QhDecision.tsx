/* QAM-09 · সিদ্ধান্ত — অনুমোদন / কমিয়ে অনুমোদন / ফেরত / প্রত্যাখ্যান / কমিটিতে রেফার
   ৮টি যাচাই · maker ≠ checker (BR-22) · কমিটি রেফারেন্স বাধ্যতামূলক (D-45) · সুদ যোগের কোনো ক্ষেত্র নেই (BR-20)। */

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, CheckCircle2, ShieldCheck, TriangleAlert, Users, X } from 'lucide-react';
import { Badge, Button, Card, SectionHead } from '../../../components/ui';
import { ErrorBanner, SuccessBanner, inputClass } from '../../../components/form';
import { KV, Note } from './parts';
import { QhZero } from './qhParts';
import { bn } from '../../../lib/bn';
import { SEED_MEMBERS } from '../../../domain/admin';
import {
  QH_APP_ST, QH_SLA_DAYS, qhAppById, qhDate, qhDaysBetween, qhPoolState, qhProductById, qhPurposeLabel,
  qhQuotaLeft, type QhApp,
} from '../../../domain/adminQard';
import { useAdminQh } from '../../../store/adminQardStore';
import { tk, useRoleQS } from './rcParts';

type Verdict = 'approve' | 'approve_reduced' | 'return' | 'reject' | 'refer';

const OPTIONS: { k: Verdict; t: string; sub: string; icon: string }[] = [
  { k: 'approve', t: 'অনুমোদন — আবেদিত অঙ্কে', sub: 'সব শর্ত পূরণ · পুল ও কোটা থেকে বরাদ্দ হবে', icon: 'check' },
  { k: 'approve_reduced', t: 'অনুমোদন — সীমা পর্যন্ত কমিয়ে', sub: 'সর্বোচ্চ সীমা · কারণ লিখতে হবে', icon: 'scale' },
  { k: 'return', t: 'তথ্য চেয়ে ফেরত', sub: 'সদস্যকে নথি/ব্যাখ্যা দিতে বলা হবে · আবেদন বাতিল নয়', icon: 'send' },
  { k: 'reject', t: 'প্রত্যাখ্যান', sub: 'কারণ-কোডসহ লিখিত কারণ বাধ্যতামূলক · সদস্যকে সম্মান রক্ষা করে জানানো হবে', icon: 'x' },
  { k: 'refer', t: 'কমিটিতে রেফার', sub: 'নিয়মের বাইরের বিষয় · কমিটির লিখিত সিদ্ধান্ত লাগবে', icon: 'users' },
];

const CHECKS = [
  { k: 'snap', t: 'যোগ্যতা স্ন্যাপশট দেখেছি (BR-21)' },
  { k: 'cap', t: 'যোগ্যতার সীমা যাচাই করেছি' },
  { k: 'maker', t: 'প্রস্তুতকারী ≠ অনুমোদনকারী নিশ্চিত (BR-22)' },
  { k: 'due', t: 'সব মডিউলে বকেয়া নেই / ব্যাখ্যা আছে' },
  { k: 'active', t: 'সক্রিয় ঋণ সীমা (১টি) যাচাই' },
  { k: 'quota', t: 'কোটা ও পুলে জায়গা আছে' },
  { k: 'docs', t: 'প্রয়োজনীয় নথি যাচাই করেছি (D-58)' },
  { k: 'cm', t: 'কমিটি রেফারেন্স সংযুক্ত করেছি (D-45)' },
];

export default function QhDecision() {
  const navigate = useNavigate();
  const qs = useRoleQS();
  const { appId } = useParams();
  const { state, decideApp } = useAdminQh();
  const app: QhApp = qhAppById(state.apps, appId) ?? state.apps.find((a) => a.status === 'review') ?? state.apps[0];
  const member = SEED_MEMBERS.find((m) => m.id === app.memberId);
  const product = qhProductById(state.products, app.product)!;
  const pool = qhPoolState(state.window, state.loans, state.apps);
  const cap = Math.min(app.snapshot.maxAmount, app.amount);
  const approverName = 'নাসরিন আক্তার (অনুমোদনকারী)';

  const [verdict, setVerdict] = useState<Verdict>('approve_reduced');
  const [amount, setAmount] = useState(String(cap));
  const [committee, setCommittee] = useState('CM-2610-08');
  const [note, setNote] = useState('');
  const [checks, setChecks] = useState<string[]>([]);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [done, setDone] = useState(false);

  const toggleCheck = (k: string) => setChecks((c) => (c.includes(k) ? c.filter((x) => x !== k) : [...c, k]));

  const submit = () => {
    setErr(''); setOk('');
    if ((verdict === 'approve' || verdict === 'approve_reduced') && checks.length < CHECKS.length) {
      setErr(`সিদ্ধান্তের আগে ${bn(CHECKS.length)}টি যাচাই ঘর পূরণ করতে হবে (${bn(CHECKS.length - checks.length)}টি বাকি)`);
      return;
    }
    const res = decideApp(app.id, {
      verdict, amount: Number(amount) || 0, committee: committee.trim().toUpperCase(), note,
      approver: approverName, reviewBy: app.reviewer ?? 'মোঃ আব্দুল্লাহ (ব্যবস্থাপক)',
    });
    if (!res.ok) setErr(res.message);
    else { setOk(res.message); setDone(true); }
  };

  return (
    <div className="p-4 space-y-3 pb-8">
      <div className="rounded-r-sm border border-warn-bd bg-warn-bg px-3 py-2.5 text-sm text-warn-ink">
        <b>সিদ্ধান্ত · maker ≠ checker (BR-22)</b>
        <p className="text-xs mt-0.5">একটি সিদ্ধান্ত নেওয়া হলে কিউ-তে ফিরে যাবেন — নেভ ও মেনু বন্ধ (ফ্লো মোড)।</p>
      </div>

      <div className="flex items-center gap-2 text-xs text-mut">
        <button type="button" onClick={() => navigate(`/a/qh/applications/${app.id}${qs}`)} className="min-h-tap inline-flex items-center gap-1 font-bold text-green-800"><ArrowLeft size={14} /> বিস্তারিত</button>
        <span className="num">{app.no}</span>
        <Badge tone={QH_APP_ST[app.status].tone}>{QH_APP_ST[app.status].t}</Badge>
        <QhZero />
      </div>

      {err ? <ErrorBanner>{err}</ErrorBanner> : null}
      {ok ? <SuccessBanner title="সিদ্ধান্ত সংরক্ষিত">{ok}</SuccessBanner> : null}

      <Card>
        <div className="flex items-start gap-3">
          <span className="shrink-0 size-11 rounded-r-pill bg-green-100 text-green-800 grid place-items-center font-extrabold text-lg">{member?.photo ?? 'স'}</span>
          <div className="grow min-w-0">
            <b className="text-body font-extrabold">{member?.name}</b>
            <div className="text-xs text-mut num">{member?.no} · {product.code} · {qhPurposeLabel(app.purpose)}</div>
          </div>
          <div className="text-right"><div className="num text-body font-extrabold">{tk(app.amount)}</div><div className="text-[11px] text-mut">আবেদিত</div></div>
        </div>
        <div className="mt-2">
          <KV k="প্রস্তাবিত অনুমোদন" v={`${tk(cap)}${app.amount > cap ? ` · সীমা পর্যন্ত কমানো (${tk(cap)})` : ' · আবেদিত অঙ্কের ভেতরে'}`} />
          <KV k="মেয়াদ ও ধরন" v={`${bn(app.tenure)} কিস্তি · সুদ ৳০`} />
          <KV k="কারণ (সদস্যের ভাষায়)" v={app.purposeText} />
          <KV k="SLA" v={`${bn(qhDaysBetween(app.submittedAt))} দিন · নির্ধারিত ${bn(QH_SLA_DAYS)} দিন${app.slaBreached ? ' · লঙ্ঘিত ⚠' : ' · ভেতরে ✓'}`} />
          <KV k="প্রস্তুতকারী (maker)" v={app.reviewer ?? 'ব্যবস্থাপক'} />
          <KV k="অনুমোদনকারী (checker)" v={approverName} />
        </div>
      </Card>

      <SectionHead title="যাচাই (সিদ্ধান্তের আগে)" sub={`${bn(checks.length)}/${bn(CHECKS.length)} সম্পন্ন · সব পূরণ না হলে অনুমোদন আটকাবে`} />
      <Card>
        {CHECKS.map((c) => {
          const on = checks.includes(c.k);
          return (
            <button key={c.k} type="button" onClick={() => toggleCheck(c.k)} className="min-h-tap w-full flex items-center gap-2.5 text-left border-b border-line-2 last:border-b-0 py-2">
              <span className={`shrink-0 size-5 rounded-r-sm border-2 grid place-items-center ${on ? 'bg-green-700 border-green-700 text-white' : 'border-line-2 bg-card'}`}>
                {on ? <Check size={12} /> : null}
              </span>
              <span className={`text-sm ${on ? 'font-bold' : 'text-mut'}`}>{c.t}</span>
            </button>
          );
        })}
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-r-sm bg-card-2 border border-line-2 px-2 py-1.5"><i className="not-italic text-mut block">কোটা বাকি</i><b>{bn(qhQuotaLeft(state.window))}টি</b></div>
          <div className="rounded-r-sm bg-card-2 border border-line-2 px-2 py-1.5"><i className="not-italic text-mut block">পুলে মুক্ত</i><b>{tk(pool.available)}</b></div>
        </div>
      </Card>

      <SectionHead title="সিদ্ধান্তের বিকল্প" sub="অডিট লগে অপরিবর্তনীয়ভাবে লেখা হবে" />
      <Card>
        <div className="space-y-2">
          {OPTIONS.map((o) => (
            <button key={o.k} type="button" onClick={() => { setVerdict(o.k); if (o.k === 'approve') setAmount(String(app.amount)); if (o.k === 'approve_reduced') setAmount(String(cap)); }}
              className={`min-h-tap w-full text-left rounded-r-sm border px-3 py-2.5 ${verdict === o.k ? 'border-green-700 bg-green-050' : 'border-line bg-card'}`}>
              <span className="flex items-center gap-2">
                <span className={`size-4 rounded-r-pill border-2 grid place-items-center ${verdict === o.k ? 'border-green-700' : 'border-line-2'}`}>{verdict === o.k ? <span className="size-2 rounded-r-pill bg-green-700" /> : null}</span>
                <b className="text-sm">{o.t}</b>
              </span>
              <span className="block text-xs text-mut mt-0.5 pl-6">{o.sub}</span>
            </button>
          ))}
        </div>

        {verdict === 'approve' || verdict === 'approve_reduced' ? (
          <>
            <label className="block text-sm font-bold mb-1 mt-3" htmlFor="qh-d-amt">অনুমোদনের অঙ্ক (৳)</label>
            <input id="qh-d-amt" className={inputClass()} inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <p className="text-xs text-mut mt-1">সর্বোচ্চ {tk(cap)} · কমিয়ে অনুমোদনে কারণ লিখুন</p>
          </>
        ) : null}

        <label className="block text-sm font-bold mb-1 mt-3" htmlFor="qh-d-cm">কমিটি রেফারেন্স (D-45)</label>
        <input id="qh-d-cm" className={inputClass()} value={committee} onChange={(e) => setCommittee(e.target.value)} placeholder="CM-YYMM-##" />
        <p className="text-xs text-mut mt-1">ফরম্যাট না মিললে অনুমোদন আটকাবে</p>

        <label className="block text-sm font-bold mb-1 mt-3" htmlFor="qh-d-note">মন্তব্য</label>
        <textarea id="qh-d-note" className={inputClass()} rows={2} value={note} onChange={(e) => setNote(e.target.value)}
          placeholder={`যাচাই করা হলো — স্ন্যাপশট v${bn(app.ruleVersion)}, নথি যাচাই, সীমা ${tk(cap)}`} />
        <p className="text-xs text-mut mt-1">প্রত্যাখ্যান/ফেরতে কারণ বাধ্যতামূলক — সদস্য অ্যাপে সেই ব্যাখ্যাই দেখানো হবে।</p>

        <div className="mt-3 rounded-r-sm bg-danger-bg border border-danger-bd text-danger-ink px-3 py-2.5">
          <b className="inline-flex items-center gap-1 text-sm"><ShieldCheck size={14} /> সুদ শূন্য নিশ্চয়তা (BR-20)</b>
          <p className="text-xs mt-1">সিদ্ধান্তে “মুনাফা হার”, “সার্ভিস চার্জ” বা “বিলম্ব ফি” যোগ করার কোনো ক্ষেত্র নেই। অনুমোদিত অঙ্কই ফেরতযোগ্য মূলধন।</p>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3">
          <Button variant="secondary" icon={<X size={15} />} onClick={() => { setVerdict('return'); setErr(''); }}>তথ্য চেয়ে ফেরত</Button>
          <Button icon={<CheckCircle2 size={15} />} onClick={submit} disabled={done}>সিদ্ধান্ত নিশ্চিত</Button>
        </div>
      </Card>

      {done ? (
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" icon={<ArrowLeft size={15} />} onClick={() => navigate(`/a/qh/applications${qs}`)}>কিউ-তে ফিরুন</Button>
          <Button icon={<Users size={15} />} onClick={() => navigate(`/a/qh/applications/${app.id}${qs}`)}>আবেদন দেখুন</Button>
        </div>
      ) : null}

      <SectionHead title="যাচাইয়ের সারাংশ" sub="এক নজরে" />
      <Card>
        <KV k="স্ন্যাপশট ফল" v={<Badge tone={app.snapshot.result === 'blocked' ? 'danger' : app.snapshot.result === 'conditional' ? 'warn' : 'ok'}>{QH_APP_ST[app.status].t} · {app.snapshot.result === 'blocked' ? 'আটকেছে' : app.snapshot.result === 'conditional' ? 'শর্তসাপেক্ষ' : 'যোগ্য'}</Badge>} />
        <KV k="ডকুমেন্ট" v={`${bn(app.docs.length)}টি জমা`} />
        <KV k="জমা" v={qhDate(app.submittedAt)} />
        <div className="mt-2"><Note tone="warn"><TriangleAlert size={13} className="inline mr-1" />প্রস্তুতকারী ও অনুমোদনকারী একই ব্যক্তি হলে সিস্টেম সিদ্ধান্ত আটকে দেবে (BR-22)।</Note></div>
      </Card>
    </div>
  );
}
