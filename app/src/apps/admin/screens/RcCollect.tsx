/* RAM-10 · কিস্তি সংগ্রহ ও বকেয়া — আদায় হার, বকেয়া তালিকা, রিমাইন্ডার ও অফলাইন কিউ */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Phone, Wallet, WifiOff } from 'lucide-react';
import { Badge, Button, Card, Kpi, KpiGrid, SectionHead } from '../../../components/ui';
import { ErrorBanner, SuccessBanner } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { SEED_MEMBERS } from '../../../domain/admin';
import {
  DEMO_EXTRA, RC_STATUS, rcCircleById, rcDone, rcNext, rcPerDraw, rcSchemeById, rcSeats, rcShortfall,
  type RcCircle, type SeatRow,
} from '../../../domain/adminRosca';
import { useAdminRo } from '../../../store/adminRoscaStore';
import { Accordion, KV, StackedCard, StackHead } from './parts';
import { Bar, PoolRow, tk, useRoleQS } from './rcParts';

const mems = [...SEED_MEMBERS.map((m) => ({ id: m.id, name: m.name, no: m.no })), ...DEMO_EXTRA];
const mobileOf = (id: string | null) => SEED_MEMBERS.find((m) => m.id === id)?.mobile ?? '';

export default function RcCollect() {
  const navigate = useNavigate();
  const qs = useRoleQS();
  const { state, collect } = useAdminRo();
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const live = state.circles.filter((c) => c.status === 'active' || c.status === 'risk');
  const exp = live.reduce((s, c) => s + rcDone(state.draws, c.id).length * rcPerDraw(rcSchemeById(state.schemes, c.scheme)), 0);
  const col = live.reduce((s, c) => s + state.draws.filter((d) => d.circle === c.id && d.status === 'executed').reduce((a, d) => a + d.collected, 0), 0);
  const dues: { c: RcCircle; seat: SeatRow; n: number; amount: number }[] = [];
  live.forEach((c) => {
    const sc = rcSchemeById(state.schemes, c.scheme);
    rcSeats(c, sc, state.seats, state.draws, state.missed, mems).forEach((s) => {
      if (s.missed) dues.push({ c, seat: s, n: s.missed, amount: s.missed * sc.contrib });
    });
  });

  const pay = (c: RcCircle, s: SeatRow) => {
    setErr(''); setMsg('');
    const r = collect(c.id, s.no);
    if (!r.ok) { setErr(r.message); return; }
    setMsg(r.message);
  };

  return (
    <div className="p-4 space-y-3 pb-8">
      <div className="rounded-r-md bg-warn-bg border border-warn-bd text-warn-ink px-3 py-2 flex items-start gap-2 text-sm font-bold">
        <WifiOff size={16} className="mt-0.5" /> <span>অফলাইন কিউ: {bn(2)}টি এন্ট্রি সিঙ্কের অপেক্ষায় — সংযোগ পেলে স্বয়ংক্রিয় সিঙ্ক, <code>idempotency_key</code> ব্যবহৃত (BR-03, D-18)</span>
      </div>

      {msg ? <SuccessBanner title={msg} /> : null}
      {err ? <ErrorBanner>{err}</ErrorBanner> : null}

      <KpiGrid>
        <Kpi label="আদায় হার" value={`${bn(Math.round((col / Math.max(1, exp)) * 100))}%`} tone="ok" note={`${tk(col)} / ${tk(exp)}`} />
        <Kpi label="বকেয়া" value={tk(dues.reduce((s, x) => s + x.amount, 0))} tone="warn" note={`${bn(dues.length)} জন · ${bn(dues.reduce((s, x) => s + x.n, 0))} কিস্তি`} />
        <Kpi label="চলমান চক্র" value={bn(live.length)} note={`${bn(live.reduce((s2, c) => s2 + rcSeats(c, rcSchemeById(state.schemes, c.scheme), state.seats, state.draws, state.missed, mems).filter((s3) => s3.memberId).length, 0))} সিট বরাদ্দ`} />
        <Kpi label="ঘাটতি" value={tk(live.reduce((s, c) => s + rcShortfall(c, rcSchemeById(state.schemes, c.scheme), state.seats, state.draws, state.missed, mems), 0))} tone="warn" note="পুল ঘাটতি (D-38)" />
      </KpiGrid>

      <SectionHead title="বকেয়া তালিকা" sub={`${bn(dues.length)} জন · অগ্রাধিকার অনুযায়ী`} />
      {dues.length === 0 ? <Card><p className="text-sm text-ok-ink font-bold">কোনো বকেয়া নেই — সব কিস্তি আদায় হয়েছে।</p></Card> : [...dues].sort((a, b) => b.n - a.n).map(({ c, seat, n, amount }) => {
        const def = state.defaults.find((d) => d.circle === c.id && d.seatNo === seat.no);
        return (
          <StackedCard key={`${c.id}-${seat.no}`} tone="bad"
            head={<StackHead title={`${seat.name} · সিট ${bn(seat.no)}`} sub={`${c.code} · ${c.route} · ${seat.memberId?.toUpperCase()}`}
              right={<Badge tone="danger">{bn(n)} কিস্তি</Badge>} />}
            foot={<div className="flex gap-1.5">
              <Button size="sm" variant="secondary" icon={<Wallet size={13} />} onClick={() => pay(c, seat)}>জমা</Button>
              <a className="grow min-h-9 px-3 inline-flex items-center justify-center gap-1.5 rounded-r-sm border border-line-3 bg-card text-sm font-bold text-txt-2"
                href={`sms:+88${mobileOf(seat.memberId)}?body=%E0%A6%95%E0%A6%BF%E0%A6%B8%E0%A7%8D%E0%A6%A4%E0%A6%BF%20%E0%A6%AC%E0%A6%BE%E0%A6%95%E0%A6%BF`}>
                <MessageSquare size={13} /> SMS
              </a>
              <Button size="sm" variant="ghost" onClick={() => navigate(`/a/rc/defaults${qs}`)}>কেস</Button>
            </div>}>
            <KV k="এ পর্যন্ত জমা" v={`${tk(seat.contributed)} · ${bn(seat.paidCount)} কিস্তি`} />
            <KV k="বকেয়া" v={`${tk(amount)} · ${bn(n)} কিস্তি`} />
            <KV k="বিলম্ব ফি (প্রস্তাবিত)" v={`${tk(def?.lateFee ?? 0)} · D-41 অমীমাংসিত`} />
            <KV k="নোটিশ" v={def?.noticeSent ?? 'পাঠানো হয়নি'} />
            <KV k="যোগাযোগ" v={<a className="text-green-800 underline" href={`tel:+88${mobileOf(seat.memberId)}`}><Phone size={12} className="inline" /> {mobileOf(seat.memberId) || '—'}</a>} />
          </StackedCard>
        );
      })}

      <Accordion title="এই ড্র-এর সংগ্রহ কিউ" sub={`${bn(live.length)}টি চক্র · সিট আদায়`}>
        {live.map((c) => {
          const sc = rcSchemeById(state.schemes, c.scheme);
          const rows = rcSeats(c, sc, state.seats, state.draws, state.missed, mems);
          const paid = rows.filter((s) => s.memberId && !s.missed).length;
          const has = rows.filter((s) => s.memberId).length;
          const nd = rcNext(state.draws, c.id);
          return (
            <button key={c.id} type="button" onClick={() => navigate(`/a/rc/circles/${c.id}${qs}`)} className="min-h-tap w-full text-left py-2 border-b border-line-2 last:border-b-0">
              <div className="flex items-center justify-between gap-2">
                <b className="text-sm">{c.code} · ড্র {bn(nd?.no ?? sc.seats)}</b>
                <Badge tone={RC_STATUS[c.status].tone}>{RC_STATUS[c.status].t}</Badge>
              </div>
              <div className="text-xs text-mut num">{bn(paid)}/{bn(has)} সিট আদায় · {sc.freq} · {c.route}</div>
              <div className="mt-1"><Bar pct={Math.round((paid / Math.max(1, has)) * 100)} tone={paid < has ? 'warn' : 'ok'} /></div>
              <div className="text-xs num mt-1 text-mut">{tk(paid * sc.contrib)} · প্রত্যাশিত {tk(rcPerDraw(sc))}</div>
            </button>
          );
        })}
      </Accordion>

      <Accordion title="নগদ আদায়ের প্রমাণ সংযুক্ত করুন" sub="দিন সমাপ্তির আগে ক্যাশ বুক মিলানো বাধ্যতামূলক (BR-11)">
        <Card>
          <PoolRow label="রসিদের ছবি / স্বাক্ষর" value="ফাইল পিকার (ডেমো)" tone="warn" />
          <p className="text-xs text-mut mt-2">মাঠে নগদ আদায়ের পর রসিদের ছবি তুলুন — অফলাইনে থাকলে এন্ট্রি কিউতে থাকবে, সংযোগ পেলে সিঙ্ক হবে।</p>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <Button size="sm" variant="ghost" onClick={() => navigate(`/a/batch${qs}`)}>বাল্ক এন্ট্রি</Button>
            <Button size="sm" variant="ghost" onClick={() => navigate(`/a/cashbook${qs}`)}>দিন সমাপ্তি</Button>
          </div>
        </Card>
      </Accordion>
      <p className="text-xs text-mut">খোলা ডিফল্ট কেস: {bn(state.defaults.filter((d) => d.status !== 'resolved').length)} · বকেয়া থাকলে সতর্কতা নোটিশ → বিলম্ব ফি → প্রতিস্থাপন (D-46)।</p>
    </div>
  );
}
