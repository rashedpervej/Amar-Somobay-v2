/* RAM-07 · ড্রের রসিদ ও যাচাই — অপরিবর্তনীয় রেকর্ড, হ্যাশ ও maker≠checker প্রমাণ */

import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Lock, Share2 } from 'lucide-react';
import { Badge, Button, Card, Kpi, KpiGrid, SectionHead } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { SEED_MEMBERS } from '../../../domain/admin';
import {
  DEMO_EXTRA, RC_DRAW_ST, RC_METHOD, rcCircleById, rcPayoutLabel, rcSchemeById, rcSeats,
} from '../../../domain/adminRosca';
import { useAdminRo } from '../../../store/adminRoscaStore';
import { PoolRow, RcHero, tk, useRoleQS } from './rcParts';

const mems = [...SEED_MEMBERS.map((m) => ({ id: m.id, name: m.name, no: m.no })), ...DEMO_EXTRA];

export default function RcDrawDetail() {
  const { drawId = '' } = useParams();
  const navigate = useNavigate();
  const qs = useRoleQS();
  const { state } = useAdminRo();
  const draw = state.draws.find((d) => d.id === drawId) ?? state.draws[0];
  const circle = rcCircleById(state.circles, draw.circle);
  const scheme = rcSchemeById(state.schemes, circle.scheme);
  const seat = rcSeats(circle, scheme, state.seats, state.draws, state.missed, mems).find((s) => s.no === draw.winnerSeat);

  const copy = async () => {
    const text = `${circle.code} · ড্র ${draw.no} · ${tk(draw.amount)} · রসিদ ${draw.receipt ?? '—'} · হ্যাশ ${draw.hash ?? '—'}`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ক্লিপবোর্ড না থাকলে চুপচাপ — প্রিভিউ iframe-এ ব্লক হতে পারে */
    }
  };

  const exportReceipt = () => {
    const lines = [
      `রসিদ,${draw.receipt ?? '—'}`, `চক্র,${circle.code}`, `ড্র,${draw.no}`,
      `অঙ্ক,${draw.amount}`, `প্রাপক সিট,${draw.winnerSeat ?? '—'}`, `প্রস্তুতকারী,${draw.by}`,
      `অনুমোদনকারী,${draw.appr ?? '—'}`, `হ্যাশ,${draw.hash ?? '—'}`, `মাধ্যম,${rcPayoutLabel(draw.channel)}`,
    ].join('\n');
    try {
      const url = URL.createObjectURL(new Blob([lines], { type: 'text/csv;charset=utf-8' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${draw.receipt ?? draw.id}.csv`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1200);
    } catch {
      /* ডাউনলোড ব্লকড হলে স্ক্রিনেই তথ্য আছে */
    }
  };

  return (
    <div className="p-4 space-y-3 pb-8">
      <Button size="sm" variant="ghost" icon={<ArrowLeft size={15} />} onClick={() => navigate(`/a/rc/circles/${circle.id}${qs}`)}>চক্রে ফিরুন</Button>

      <RcHero label={`${circle.code} · ড্র ${bn(draw.no)}`} amount={tk(draw.amount)}
        sub={`${RC_METHOD[draw.method]} · ${rcPayoutLabel(draw.channel)} · ${draw.executed ?? draw.scheduled}`}>
        <div className="mt-3 flex items-center gap-2">
          <Badge tone={RC_DRAW_ST[draw.status].tone}>{RC_DRAW_ST[draw.status].t}</Badge>
          {draw.status === 'executed' ? <span className="text-xs text-green-100 inline-flex items-center gap-1"><Lock size={12} /> অপরিবর্তনীয়</span> : null}
        </div>
      </RcHero>

      <KpiGrid>
        <Kpi label="সংগৃহীত" value={tk(draw.collected)} tone="ok" note="ড্র-পুল স্ন্যাপশট" />
        <Kpi label="ঘাটতি" value={tk(draw.shortfall)} tone={draw.shortfall ? 'warn' : 'ok'} note={draw.cover ?? 'কোনো ঘাটতি নেই'} />
        <Kpi label="প্রাপক সিট" value={draw.winnerSeat ? bn(draw.winnerSeat) : '—'} note={seat?.name ?? 'নির্ধারিত নয়'} />
        <Kpi label="কিস্তি" value={tk(scheme.contrib)} note={`${bn(scheme.seats)} সিট`} />
      </KpiGrid>

      <SectionHead title="যাচাই" sub="প্রমাণ ও অপরিবর্তনীয়তার চেইন" />
      <Card>
        <PoolRow label="প্রাপক" value={seat ? `${seat.name} · সিট ${bn(seat.no)} · ${seat.memberId?.toUpperCase()}` : '—'} />
        <div className="mt-2"><PoolRow label="রসিদ নম্বর" value={draw.receipt ?? 'রসিদ তৈরি হয়নি'} tone={draw.receipt ? 'ok' : 'warn'} /></div>
        <div className="mt-2"><PoolRow label="হ্যাশ" value={<span className="font-mono text-xs">{draw.hash ?? 'সম্পাদনের পর গণনা হবে'}</span>} /></div>
        <div className="mt-2"><PoolRow label="প্রস্তুত → অনুমোদন" value={`${draw.by} → ${draw.appr ?? 'বাকি'}`} tone={draw.appr && draw.appr !== draw.by ? 'ok' : 'warn'} /></div>
        <div className="mt-2"><PoolRow label="সাক্ষী" value={circle.witnesses.join(' · ')} /></div>
        <div className="mt-2"><PoolRow label="পিরিয়ড" value={draw.executed && draw.executed < '২০২৬-১০-০১' ? 'লকড — সংশোধন বন্ধ (R-05)' : 'খোলা'} /></div>
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" icon={<Download size={15} />} onClick={exportReceipt}>CSV এক্সপোর্ট</Button>
        <Button variant="ghost" icon={<Share2 size={15} />} onClick={copy}>শেয়ার / কপি</Button>
      </div>

      <Card title="একই সিটের অন্য ড্র">
        {state.draws.filter((d) => d.circle === circle.id && d.no !== draw.no).slice(-3).reverse().map((d) => (
          <button key={d.id} type="button" onClick={() => navigate(`/a/rc/draws/${d.id}${qs}`)}
            className="min-h-tap w-full text-left border-b border-line-2 last:border-b-0 py-2 flex items-center justify-between gap-2">
            <span className="text-sm font-bold">ড্র {bn(d.no)} · {d.winnerSeat ? `সিট ${bn(d.winnerSeat)}` : 'প্রাপক বাকি'}</span>
            <span className="text-xs num text-mut">{tk(d.amount)}</span>
          </button>
        ))}
        <p className="text-xs text-mut mt-2">সম্পন্ন ড্র মুছে ফেলা বা সম্পাদনা করা যায় না — সংশোধন হলে রিভার্সাল-জোড়া এন্ট্রি যোগ হয় (R-02), অডিট লগে দেখা যায়।</p>
      </Card>
    </div>
  );
}
