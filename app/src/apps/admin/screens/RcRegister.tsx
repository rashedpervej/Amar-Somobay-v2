/* RAM-09 · ড্র রেজিস্টার — সম্পন্ন ড্র অপরিবর্তনীয় রেকর্ড, রসিদ অনন্যতা ও এক্সপোর্ট */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download } from 'lucide-react';
import { Badge, Button, Card, Chip, Kpi, KpiGrid, SectionHead } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { SEED_MEMBERS } from '../../../domain/admin';
import {
  DEMO_EXTRA, RC_DRAW_ST, RC_METHOD, rcCircleById, rcPayoutLabel, rcSchemeById, rcSeats,
} from '../../../domain/adminRosca';
import { useAdminRo } from '../../../store/adminRoscaStore';
import { Accordion, KV, StackedCard, StackHead } from './parts';
import { tk, useRoleQS } from './rcParts';

const mems = [...SEED_MEMBERS.map((m) => ({ id: m.id, name: m.name, no: m.no })), ...DEMO_EXTRA];

export default function RcRegister() {
  const navigate = useNavigate();
  const qs = useRoleQS();
  const { state } = useAdminRo();
  const [filter, setFilter] = useState<'all' | '2026' | '2025'>('all');
  const exec = state.draws.filter((d) => d.status === 'executed');
  const list = exec.filter((d) => filter === 'all' || d.scheduled.startsWith(filter.replace('2026', '২০২৬').replace('2025', '২০২৫')));
  const allExec = [...list].reverse();
  const uniqueReceipts = new Set(exec.map((d) => d.receipt)).size;
  const makerChecker = exec.filter((d) => d.by !== d.appr).length;

  const exportCsv = () => {
    const rows = [['ড্র', 'চক্র', 'অঙ্ক', 'প্রাপক সিট', 'রসিদ', 'হ্যাশ', 'প্রস্তুতকারী', 'অনুমোদনকারী', 'মাধ্যম']]
      .concat(exec.map((d) => [String(d.no), d.circle.toUpperCase(), String(d.amount), String(d.winnerSeat ?? ''), d.receipt ?? '', d.hash ?? '', d.by, d.appr ?? '', rcPayoutLabel(d.channel)]));
    try {
      const url = URL.createObjectURL(new Blob([rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv;charset=utf-8' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'rosca-draw-register.csv';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1200);
    } catch {
      /* ব্লকড হলে স্ক্রিনেই রেকর্ড */
    }
  };

  const card = (id: string) => {
    const d = state.draws.find((x) => x.id === id);
    if (!d) return null;
    const c = rcCircleById(state.circles, d.circle);
    const sc = rcSchemeById(state.schemes, c.scheme);
    const st = rcSeats(c, sc, state.seats, state.draws, state.missed, mems).find((s) => s.no === d.winnerSeat);
    return (
      <StackedCard key={d.id} tone="ok" head={<StackHead title={`${c.code} · ড্র ${bn(d.no)}`}
        sub={`${d.executed ?? d.scheduled} · ${RC_METHOD[d.method]} · ${d.amount ? tk(d.amount) : ''}`}
        right={<Badge tone={RC_DRAW_ST[d.status].tone}>{RC_DRAW_ST[d.status].t}</Badge>} />}
        foot={<div className="flex gap-2"><Button size="sm" variant="ghost" onClick={() => navigate(`/a/rc/draws/${d.id}${qs}`)}>রসিদ</Button></div>}>
        <KV k="প্রাপক" v={`${st?.name ?? '—'} · সিট ${bn(d.winnerSeat ?? 0)}`} />
        <KV k="রসিদ" v={d.receipt ?? '—'} />
        <KV k="হ্যাশ" v={<span className="font-mono text-xs">{d.hash ?? '—'}</span>} />
        <KV k="প্রস্তুত → অনুমোদন" v={`${d.by} → ${d.appr ?? '—'}`} />
        <KV k="মাধ্যম" v={rcPayoutLabel(d.channel)} />
        <KV k="পিরিয়ড" v={(d.executed ?? '') < '২০২৬-১০-০১' ? 'লকড — সংশোধন বন্ধ (R-05)' : 'খোলা'} />
      </StackedCard>
    );
  };

  return (
    <div className="p-4 space-y-3 pb-8">
      <KpiGrid>
        <Kpi label="সম্পন্ন ড্র" value={bn(exec.length)} tone="ok" note="অপরিবর্তনীয়" />
        <Kpi label="রসিদ অনন্য" value={`${bn(uniqueReceipts)}/${bn(exec.length)}`} tone={uniqueReceipts === exec.length ? 'ok' : 'danger'} note="BR-08" />
        <Kpi label="maker ≠ checker" value={`${bn(makerChecker)}/${bn(exec.length)}`} tone={makerChecker === exec.length ? 'ok' : 'warn'} note="BR-04" />
        <Kpi label="মোট বিতরণ" value={tk(exec.reduce((s, d) => s + d.amount, 0))} note="সম্পন্ন ড্র" />
      </KpiGrid>

      <div className="flex gap-2">
        <Chip active={filter === 'all'} onClick={() => setFilter('all')}>সব চক্র</Chip>
        <Chip active={filter === '2026'} onClick={() => setFilter('2026')}>২০২৬</Chip>
        <Chip active={filter === '2025'} onClick={() => setFilter('2025')}>২০২৫</Chip>
      </div>

      <Button block variant="secondary" icon={<Download size={15} />} onClick={exportCsv}>রেজিস্টার CSV এক্সপোর্ট</Button>

      <SectionHead title="ড্র রেজিস্টার" sub={`${bn(list.length)}টি সম্পন্ন · অপরিবর্তনীয়`} />
      <div className="space-y-2">
        {allExec.slice(0, 3).map((d) => card(d.id))}
        {allExec.length > 3 ? (
          <Accordion title={`আরও ${bn(allExec.length - 3)}টি পুরোনো ড্র`} sub="রেকর্ড DOM-এ থাকে, মুছে যায় না">
            <div className="space-y-2">{allExec.slice(3).map((d) => card(d.id))}</div>
          </Accordion>
        ) : null}
        {allExec.length === 0 ? <Card><p className="text-sm text-mut">এই ফিল্টারে কোনো ড্র নেই।</p></Card> : null}
      </div>

      <Card>
        <p className="text-sm text-txt-2">রেজিস্টার অপরিবর্তনীয় — কোনো এন্ট্রি মুছে বা বদলে যায় না। সংশোধন হলে রিভার্সাল-জোড়া এন্ট্রি যোগ হয় (R-02), দুটোই এখানে দেখা যাবে।</p>
      </Card>
    </div>
  );
}
