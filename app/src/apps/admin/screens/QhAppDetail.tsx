/* QAM-08 · আবেদন বিস্তারিত — ৪ স্তরের স্ন্যাপশট, কারণ-কোড, নথি ও সীমা (BR-21) */

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, CheckCircle2, FileText, Info, Lock, ShieldCheck, Upload, UserRound } from 'lucide-react';
import { Badge, Button, Card, SectionHead } from '../../../components/ui';
import { Accordion, KV, Note } from './parts';
import { QhAmount, QhLayer, QhReason, QhZero } from './qhParts';
import { bn } from '../../../lib/bn';
import { SEED_ACCOUNTS, SEED_MEMBERS, accountsOf } from '../../../domain/admin';
import {
  QH_APP_ST, QH_BLOCK, QH_DOC, QH_ELIG_ST, QH_LAYER, QH_SRC, qhAppById, qhCapBreakdown, qhDate, qhDaysBetween,
  qhEligibleOf, qhMaxAmount, qhPoolState, qhProductById, qhPurposeLabel, qhRepayLabel, qhWrittenOff, qhOutstanding,
  qhPortfolio, type LayerKey,
} from '../../../domain/adminQard';
import { useAdminQh } from '../../../store/adminQardStore';
import { tk, useRoleQS } from './rcParts';

const savingsOf = (id: string) => accountsOf(SEED_ACCOUNTS, id).reduce((s, a) => s + a.posted, 0);
const layerNote = (k: LayerKey, reasons: string[]) => {
  const rs = reasons.filter((c) => QH_BLOCK[c]);
  if (!rs.length) return {
    gate: 'সদস্যের অবস্থা, জানালা ও বহিষ্কার-শর্ত পূরণ',
    scope: 'যোগ্য তালিকায় আছেন · বহিষ্কার তালিকায় নেই',
    financial: 'সঞ্চয়, বকেয়া, সদস্যত্বকাল ও পূর্ব সহায়তার শর্ত পূরণ',
    window: 'জানালা, কোটা ও পুলের শর্ত পূরণ',
  }[k];
  return rs.map((c) => QH_BLOCK[c].m).join(' · ').slice(0, 190);
};

export default function QhAppDetail() {
  const navigate = useNavigate();
  const qs = useRoleQS();
  const { appId } = useParams();
  const { state } = useAdminQh();
  const app = qhAppById(state.apps, appId) ?? state.apps.find((a) => a.status === 'review') ?? state.apps[0];
  const member = SEED_MEMBERS.find((m) => m.id === app.memberId);
  const product = qhProductById(state.products, app.product)!;
  const elig = qhEligibleOf(state.eligible, app.memberId);
  const pool = qhPoolState(state.window, state.loans, state.apps);
  const [docMsg, setDocMsg] = useState('');
  const [uploaded, setUploaded] = useState<string[]>([]);

  const cap = qhMaxAmount(product, savingsOf(app.memberId), pool.available, elig?.maxAmount ?? app.snapshot.maxAmount);
  const appLoans = state.loans.filter((l) => l.memberId === app.memberId);
  const pf = qhPortfolio(state.loans, state.repayments, state.writeoffs);
  const unavailable = app.status === 'disbursed';

  return (
    <div className="p-4 space-y-3 pb-8">
      <div className="flex items-center gap-2 text-xs text-mut">
        <button type="button" onClick={() => navigate(`/a/qh/applications${qs}`)} className="min-h-tap inline-flex items-center gap-1 font-bold text-green-800"><ArrowLeft size={14} /> কিউ</button>
        <span>·</span><span className="num">{app.no}</span>
        <Badge tone={QH_APP_ST[app.status].tone}>{QH_APP_ST[app.status].t}</Badge>
        <QhZero />
      </div>

      <Card>
        <div className="flex items-start gap-3">
          <span className="shrink-0 size-11 rounded-r-pill bg-green-100 text-green-800 grid place-items-center font-extrabold text-lg">{member?.photo ?? 'স'}</span>
          <div className="grow min-w-0">
            <b className="text-body font-extrabold">{member?.name ?? app.memberId}</b>
            <div className="text-xs text-mut num">{member?.no} · {member?.village} · {member?.mobile}</div>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              <Badge tone={QH_ELIG_ST[app.snapshot.result].tone}>{QH_ELIG_ST[app.snapshot.result].t}</Badge>
              <Badge tone="neutral">স্ন্যাপশট v{bn(app.ruleVersion)} · BR-21</Badge>
            </div>
          </div>
          <QhAmount value={tk(app.amount)} sub="আবেদিত" />
        </div>
        <div className="mt-2">
          <KV k="পণ্য" v={`${product.code} · ${product.name}`} />
          <KV k="উদ্দেশ্য (D-69)" v={qhPurposeLabel(app.purpose)} />
          <KV k="মেয়াদ" v={`${bn(app.tenure)} কিস্তি · ${qhRepayLabel(product.repay)}`} />
          <KV k="জমা" v={`${qhDate(app.submittedAt)} · ${bn(qhDaysBetween(app.submittedAt))} দিন আগে`} />
          <KV k="মাধ্যম" v={app.channel === 'office' ? 'অফিস' : app.channel === 'app' ? 'সদস্য অ্যাপ' : 'মাঠ সংগ্রহ'} />
          <KV k="বিবরণ" v={app.purposeText} />
          <KV k="সিদ্ধান্ত" v={app.decision ? `${app.decision.by} ≠ ${app.decision.appr ?? '—'} · ${app.decision.committee ?? '—'}` : 'বাকি'} />
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-mut"><Info size={13} /> স্ন্যাপশট অপরিবর্তনীয় — নিয়ম বদলালেও পুরোনো আবেদন পুরোনো নিয়মেই বিচারিত (BR-21)।</div>
      </Card>

      <SectionHead title="যোগ্যতা স্ন্যাপশট" sub="আবেদনের মুহূর্তের নিয়ম ও ফল — অপরিবর্তনীয় (BR-21)" />
      <div className="space-y-2">
        {QH_LAYER.map((l, i) => (
          <QhLayer key={l.k} no={i + 1} title={l.t} value={app.snapshot.layer[l.k]} note={layerNote(l.k, app.snapshot.reasons)} />
        ))}
      </div>
      <div className="rounded-r-sm border border-line bg-card px-3 py-2 text-xs text-mut">
        মূল্যায়ন {qhDate(elig?.evaluatedAt)} · সীমা {tk(app.snapshot.maxAmount)} · উৎস {elig ? QH_SRC[elig.source].t : 'স্ন্যাপশট'}
      </div>

      <SectionHead title="কারণ ও করণীয়" sub={`${bn(app.snapshot.reasons.length)}টি কারণ-কোড`} />
      <Card>
        {app.snapshot.reasons.length ? app.snapshot.reasons.map((c) => {
          const b = QH_BLOCK[c];
          return <QhReason key={c} code={c} title={b?.m ?? 'সতর্কতা — ম্যানুয়াল পর্যালোচনা বাধ্যতামূলক'} warn={!b} fix={b ? (b.fix || `Admin প্যানেলে: ${b.a}`) : 'ম্যানুয়াল পর্যালোচনা প্রয়োজন'} />;
        }) : (
          <div className="flex items-center gap-2 rounded-r-sm bg-ok-bg border border-ok-bd px-3 py-2.5 text-sm text-ok-ink">
            <CheckCircle2 size={16} /> <b>কোনো বাধা নেই</b> — সব স্তরের নিয়ম পাস করেছে, সিদ্ধান্ত নেওয়া যাবে।
          </div>
        )}
      </Card>

      <SectionHead title="নথি যাচাই (D-58)" sub={`${bn(QH_DOC.length)}টি প্রয়োজন · ${bn(QH_DOC.filter((d) => app.docs.includes(d.k)).length)}টি জমা`} />
      <Card>
        <div className="space-y-2">
          {QH_DOC.map((d) => {
            const has = app.docs.includes(d.k) || uploaded.includes(d.k);
            return (
              <div key={d.k} className={`flex items-start gap-2 rounded-r-sm border px-3 py-2 ${has ? 'border-ok-bd bg-ok-bg' : 'border-warn-bd bg-warn-bg'}`}>
                {has ? <Check size={15} className="text-ok-ink mt-0.5" /> : <FileText size={15} className="text-warn-ink mt-0.5" />}
                <div className="grow min-w-0">
                  <div className="text-sm font-bold">{d.t}</div>
                  <div className="text-xs text-mut">{has ? 'জমা ও যাচাই করা ✓' : 'জমা বাকি — ফেরত দেওয়া যেতে পারে'}</div>
                </div>
                <button type="button" onClick={() => { setUploaded((u) => (u.includes(d.k) ? u : [...u, d.k])); setDocMsg(`${d.t.split(' ')[0]} — ডেমোতে নথি “যাচাইকৃত” হিসেবে যুক্ত হলো`); }}
                  className="min-h-tap px-2 text-xs font-bold text-green-800">{has ? 'দেখুন' : 'যুক্ত করুন'}</button>
              </div>
            );
          })}
        </div>
        <label className="mt-3 flex items-center gap-2 min-h-tap rounded-r-sm border border-dashed border-line-2 bg-card-2 px-3 py-2.5 text-sm font-bold text-green-800">
          <Upload size={15} /> অতিরিক্ত নথি যুক্ত করুন
          <input type="file" accept="image/*,.pdf" className="sr-only" onChange={() => setDocMsg('ফাইল নির্বাচিত — ডেমো ক্লায়েন্টে সংরক্ষণ হবে না; মান স্বয়ংক্রিয়ভাবে বসবে না (D-80)')} />
        </label>
        {docMsg ? <p className="text-xs text-ok-ink mt-1.5">{docMsg}</p> : null}
      </Card>

      <Accordion title="আর্থিক অবস্থা ও সীমা যাচাই" sub="সীমা = min(পণ্য, সঞ্চয়ের ৫০%, পুল, মূল্যায়ন) — §৭.৭">
        <KV k="মোট সঞ্চয়" v={`${tk(savingsOf(app.memberId))} · ≥ ৳৫,০০০ (r07)`} />
        <KV k="সব মডিউলে বকেয়া" v={app.snapshot.reasons.includes('QH-B-04') ? 'বকেয়া আছে — আটকে দেয় (r08)' : '৳০ ✓'} />
        <KV k="সক্রিয় QH ঋণ" v={`${bn(appLoans.filter((l) => l.status === 'active' || l.status === 'arrears').length)}টি · সীমা ১টি (D-51)`} />
        <KV k="আবেদিত বনাম সীমা" v={`${tk(app.amount)} → ${tk(cap)}`} />
        {qhCapBreakdown(product, savingsOf(app.memberId), pool.available, elig?.maxAmount ?? app.snapshot.maxAmount).map((c) => (
          <KV key={c.label} k={c.label} v={`${tk(c.value)} · ${c.note}`} />
        ))}
        <div className="mt-2"><Note tone="warn">আবেদিত অঙ্ক সীমা ছাড়ালে কমিয়ে অনুমোদন করা যায় ({tk(app.amount)} → {tk(app.snapshot.maxAmount)}) — কারণ লিখতে হবে (D-54)।</Note></div>
        <div className="mt-2 text-xs text-mut">পোর্টফোলিও: বিতরণ {tk(pf.disbursed)} · আদায় {tk(pf.repaid)} · বকেয়া {tk(pf.arrears)} · সুদ ৳০।</div>
      </Accordion>

      <Card title="পূর্ব ইতিহাস" sub={`${bn(appLoans.length)}টি ঋণ · ${bn(state.apps.filter((a) => a.memberId === app.memberId).length)}টি আবেদন`}>
        {appLoans.length ? appLoans.map((l) => (
          <button key={l.id} type="button" onClick={() => navigate(`/a/qh/loans/${l.id}${qs}`)} className="min-h-tap w-full text-left border-b border-line-2 last:border-b-0 py-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold num">{l.no}</span>
              <span className="text-sm num">{tk(qhOutstanding(l, state.repayments, state.writeoffs))} বাকি</span>
            </div>
            <div className="text-xs text-mut">{tk(l.principal)} · {l.status === 'closed' ? 'সম্পূর্ণ পরিশোধিত' : l.status === 'writeoff' ? `ছেড়ে দেওয়া ${tk(qhWrittenOff(l, state.writeoffs))}` : l.status === 'arrears' ? 'বকেয়া' : l.status === 'pending' ? 'বিতরণ বাকি' : 'চলমান'}</div>
          </button>
        )) : <p className="text-sm text-mut">এটি প্রথম আবেদন — পূর্ব কোনো কর্জে হাসানা নেই।</p>}
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" icon={<ArrowLeft size={15} />} onClick={() => navigate(`/a/qh/applications${qs}`)}>কিউ</Button>
        <Button icon={<ShieldCheck size={15} />} onClick={() => navigate(`/a/qh/applications/${app.id}/decision${qs}`)} disabled={unavailable}>সিদ্ধান্ত নিন</Button>
        <Button variant="ghost" icon={<UserRound size={15} />} onClick={() => navigate(`/a/members/${app.memberId}${qs}`)}>সদস্য ৩৬০°</Button>
        <Button variant="ghost" icon={<Lock size={15} />} onClick={() => navigate(`/a/qh/rules${qs}`)}>যোগ্যতা নিয়ম</Button>
      </div>
      {unavailable ? <p className="text-xs text-mut">এই আবেদনের সিদ্ধান্ত সম্পন্ন — নতুন সিদ্ধান্ত সম্ভব নয় (অডিট অপরিবর্তনীয়)।</p> : null}
    </div>
  );
}
