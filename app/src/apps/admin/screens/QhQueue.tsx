/* QAM-07 · আবেদন কিউ — SLA ৫ কার্যদিবস, বাল্ক অনুমোদন নেই, স্ন্যাপশট অপরিবর্তনীয় */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Clock, FileText, TriangleAlert, Users } from 'lucide-react';
import { Badge, Button, Card, Chip, Chipset, Kpi, KpiGrid, SectionHead } from '../../../components/ui';
import { Accordion, Note } from './parts';
import { QhZero } from './qhParts';
import { bn } from '../../../lib/bn';
import { SEED_MEMBERS } from '../../../domain/admin';
import {
  QH_APP_ST, QH_SLA_DAYS, QH_STEP, qhAppById, qhDate, qhDaysBetween, qhProductById, qhPurposeLabel,
  qhQueue, qhSlaBreaches, type QhApp,
} from '../../../domain/adminQard';
import { useAdminQh } from '../../../store/adminQardStore';
import { tk, useRoleQS } from './rcParts';

type Filter = 'queue' | 'returned' | 'approved' | 'rejected';

export default function QhQueue() {
  const navigate = useNavigate();
  const qs = useRoleQS();
  const { state } = useAdminQh();
  const [tab, setTab] = useState<Filter>('queue');
  const [slaFirst, setSlaFirst] = useState(true);

  const queue = qhQueue(state.apps);
  const sla = qhSlaBreaches(state.apps);
  const list = (tab === 'queue' ? queue : state.apps.filter((a) => a.status === tab))
    .slice()
    .sort((a, b) => (slaFirst ? Number(Boolean(b.slaBreached)) - Number(Boolean(a.slaBreached)) || qhDaysBetween(b.submittedAt) - qhDaysBetween(a.submittedAt) : 0));
  const recent = state.apps.filter((a) => a.status === 'approved' || a.status === 'rejected' || a.status === 'disbursed').slice(-3).reverse();

  return (
    <div className="p-4 space-y-3 pb-8">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="warn">{bn(queue.length)}টি বিচারাধীন</Badge>
        <Badge tone="danger">{bn(sla.length)}টি SLA লঙ্ঘন ({bn(QH_SLA_DAYS)} দিন)</Badge>
        <QhZero />
      </div>

      <KpiGrid>
        <Kpi label="বিচারাধীন" value={bn(queue.length)} unit="টি" tone="warn" note="প্রত্যেকটি আলাদা সিদ্ধান্ত" />
        <Kpi label="SLA লঙ্ঘন" value={bn(sla.length)} unit="টি" tone="danger" note={`${bn(QH_SLA_DAYS)} কার্যদিবসের বেশি`} />
        <Kpi label="ফেরত" value={bn(state.apps.filter((a) => a.status === 'returned').length)} unit="টি" note="তথ্য চেয়ে" />
        <Kpi label="ওয়েটলিস্ট" value={bn(state.apps.filter((a) => a.waitlist).length)} unit="টি" tone="warn" note="পরবর্তী জানালায় অগ্রাধিকার" />
      </KpiGrid>

      <Chipset>
        <Chip active={tab === 'queue'} onClick={() => setTab('queue')}>বিচারাধীন ({bn(queue.length)})</Chip>
        <Chip active={tab === 'returned'} onClick={() => setTab('returned')}>ফেরত ({bn(state.apps.filter((a) => a.status === 'returned').length)})</Chip>
        <Chip active={tab === 'approved'} onClick={() => setTab('approved')}>অনুমোদিত ({bn(state.apps.filter((a) => a.status === 'approved').length)})</Chip>
        <Chip active={tab === 'rejected'} onClick={() => setTab('rejected')}>প্রত্যাখ্যাত ({bn(state.apps.filter((a) => a.status === 'rejected').length)})</Chip>
      </Chipset>
      <Chipset>
        <Chip active={slaFirst} onClick={() => setSlaFirst(true)}>SLA আগে</Chip>
        <Chip active={!slaFirst} onClick={() => setSlaFirst(false)}>জমার ক্রম</Chip>
      </Chipset>

      {sla.length ? (
        <div className="rounded-r-sm bg-danger-bg border border-danger-bd text-danger-ink px-3 py-2.5 text-sm">
          <b className="inline-flex items-center gap-1"><TriangleAlert size={14} /> SLA লঙ্ঘন {bn(sla.length)}টি</b>
          <p className="text-xs mt-1 num">{sla.map((a) => `${a.no} (${bn(qhDaysBetween(a.submittedAt))} দিন)`).join(' · ')} — নির্ধারিত সময় {bn(QH_SLA_DAYS)} দিন (§৭.৫)।</p>
        </div>
      ) : null}

      <SectionHead title={tab === 'queue' ? 'বিচারাধীন আবেদন' : 'আবেদন তালিকা'} sub={`${bn(list.length)}টি · ${slaFirst ? 'SLA লঙ্ঘন আগে' : 'জমার ক্রমে'}`} />
      {list.length === 0 ? <Card><p className="text-sm text-mut">এই তালিকায় কোনো আবেদন নেই।</p></Card> : list.map((a: QhApp) => {
        const m = SEED_MEMBERS.find((x) => x.id === a.memberId);
        const p = qhProductById(state.products, a.product);
        const days = qhDaysBetween(a.submittedAt);
        return (
          <button key={a.id} type="button" onClick={() => navigate(`/a/qh/applications/${a.id}${qs}`)}
            className="min-h-tap w-full text-left rounded-r-md bg-card border border-line shadow-sh-1 px-3.5 py-3">
            <div className="flex items-start gap-2">
              <span className={`shrink-0 size-9 rounded-r-pill grid place-items-center ${a.slaBreached ? 'bg-danger-bg text-danger-ink' : 'bg-warn-bg text-warn-ink'}`}><FileText size={15} /></span>
              <div className="grow min-w-0">
                <div className="text-body font-extrabold truncate">{m?.name ?? a.memberId} · {tk(a.amount)}</div>
                <div className="text-xs text-mut num">{a.no} · {p?.code} · {qhPurposeLabel(a.purpose)}</div>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  <Badge tone={QH_APP_ST[a.status].tone}>{QH_APP_ST[a.status].t}</Badge>
                  <Badge tone={a.slaBreached ? 'danger' : 'neutral'}><Clock size={11} /> {bn(days)} দিন{a.slaBreached ? ' · SLA লঙ্ঘন' : ''}</Badge>
                  {a.waitlist ? <Badge tone="warn"><Users size={11} /> ওয়েটলিস্ট</Badge> : null}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="num text-body font-extrabold">{tk(a.decision?.amount ?? a.amount)}</div>
                <div className="text-[11px] text-mut">{a.decision?.amount ? 'প্রস্তাবিত' : 'আবেদিত'}</div>
                <ArrowRight size={14} className="text-mut ml-auto mt-1" />
              </div>
            </div>
          </button>
        );
      })}
      <Note tone="info">স্ন্যাপশট (নিয়ম সংস্করণ, কারণ, সীমা) আবেদনের সাথে অপরিবর্তনীয়ভাবে সংরক্ষিত — BR-21। <b>বাল্ক অনুমোদন নেই</b> — প্রতিটি সিদ্ধান্তে maker ≠ checker (BR-22)।</Note>

      <SectionHead title="সাম্প্রতিক সিদ্ধান্ত" sub={`${bn(recent.length)}টি`} />
      <Card>
        {recent.map((a) => {
          const m = SEED_MEMBERS.find((x) => x.id === a.memberId);
          return (
            <button key={a.id} type="button" onClick={() => navigate(`/a/qh/applications/${a.id}${qs}`)} className="min-h-tap w-full text-left border-b border-line-2 last:border-b-0 py-2">
              <div className="flex items-start gap-2">
                <CheckCircle2 size={15} className={a.status === 'rejected' ? 'text-danger-ink mt-0.5' : 'text-ok-ink mt-0.5'} />
                <div className="grow min-w-0">
                  <div className="text-sm font-bold truncate">{m?.name} · {tk(a.decision?.amount ?? a.amount)}</div>
                  <div className="text-xs text-mut num">{a.no} · {a.decision?.by ?? '—'} ≠ {a.decision?.appr ?? '—'}</div>
                  <div className="flex gap-1.5 mt-1"><Badge tone={QH_APP_ST[a.status].tone}>{QH_APP_ST[a.status].t}</Badge><Badge tone="neutral">{a.decision?.committee ?? 'কমিটি রেফারেন্স বাকি'}</Badge></div>
                </div>
              </div>
            </button>
          );
        })}
      </Card>

      <Accordion title="কিউ-এর ধাপ ও অনুমোদন সীমা" sub="D-22 · maker ≠ checker · OTP">
        <div className="space-y-2">
          {QH_STEP.map((s, i) => (
            <div key={s} className="flex items-start gap-2.5 rounded-r-sm border border-line px-2.5 py-2">
              <span className={`shrink-0 size-6 rounded-r-pill grid place-items-center text-xs font-extrabold ${i < 3 ? 'bg-green-100 text-green-800' : i === 3 ? 'bg-warn-bg text-warn-ink' : 'bg-card-2 text-mut'}`}>{bn(i + 1)}</span>
              <div>
                <b className="text-sm">{s}</b>
                <p className="text-xs text-mut mt-0.5">{[
                  'সদস্য অ্যাপে (QM-04) — জানালা খোলা থাকলে',
                  'নিয়ম ইঞ্জিন স্বয়ংক্রিয়ভাবে চালায় ও স্ন্যাপশট রাখে (BR-21)',
                  `নথি ও প্রয়োজন যাচাই · SLA ${bn(QH_SLA_DAYS)} দিন (§৭.৫)`,
                  'প্রস্তাব ও অনুমোদন আলাদা ব্যক্তি (BR-22 · D-22)',
                  'OTP যাচাই ছাড়া টাকা ছাড়া হবে না (BR-22) · ভাউচার + QR',
                  'প্রতিটি কিস্তিতে অপরিবর্তনীয় রসিদ (BR-08) · সুদ ৳০',
                  'বাকি মূলধন ৳০ হলে সনদ ইস্যু (QAM-15)',
                ][i]}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-r-sm border border-line-2 overflow-hidden">
          <div className="grid grid-cols-4 gap-1 bg-card-2 px-2.5 py-1.5 text-[11px] font-bold text-mut">
            <span>ভূমিকা</span><span className="text-right">সীমা</span><span className="text-center">maker</span><span className="text-center">checker</span>
          </div>
          {[
            ['ACCOUNTANT', '৳৫,০০০', '✓', '—'], ['COLLECTOR', '৳০ (এন্ট্রি)', '✓', '—'],
            ['MANAGER', '৳১০,০০০', '✓', '—'], ['APPROVER', '৳২৫,০০০', '—', '✓'], ['ORG_ADMIN', 'সীমা নেই', '—', '✓'],
          ].map((r) => (
            <div key={r[0]} className="grid grid-cols-4 gap-1 px-2.5 py-1.5 text-xs border-t border-line-2">
              <span className="font-bold text-[11px]">{r[0]}</span><span className="text-right num">{r[1]}</span>
              <span className="text-center">{r[2]}</span><span className="text-center">{r[3]}</span>
            </div>
          ))}
        </div>
        <div className="mt-2"><Note tone="warn">একই ব্যক্তি প্রস্তাব ও অনুমোদন করতে পারবেন না (BR-22 · D-22)। কিউ থেকে সরাসরি বাল্ক অনুমোদনের কোনো সুযোগ নেই।</Note></div>
      </Accordion>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" icon={<Users size={15} />} onClick={() => navigate(`/a/qh/eligible${qs}`)}>যোগ্য তালিকা</Button>
        <Button icon={<FileText size={15} />} onClick={() => navigate(`/a/qh/applications/${(list[0] ?? qhAppById(state.apps, 'qa05'))?.id}${qs}`)}>প্রথমটি খুলুন</Button>
        <Button variant="ghost" icon={<Clock size={15} />} onClick={() => navigate(`/a/qh/arrears${qs}`)}>বকেয়া</Button>
        <Button variant="ghost" icon={<ArrowRight size={15} />} onClick={() => navigate(`/a/qh/reports${qs}`)}>রিপোর্ট</Button>
      </div>
      <p className="text-xs text-mut">জমার তারিখ: {qhDate(state.apps[4]?.submittedAt)} নির্ধারিত SLA শুরু — আজ {qhDate('2026-10-31')}।</p>
    </div>
  );
}
