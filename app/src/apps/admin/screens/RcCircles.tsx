/* RAM-02 · চক্র তালিকা — ফিল্টার, সিট পূর্ণতা, পুল ঘাটতি ও প্রতিটি চক্রের হাব */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { Badge, Button, Card, Chip, Kpi, KpiGrid, SectionHead } from '../../../components/ui';
import { inputCls } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { SEED_MEMBERS } from '../../../domain/admin';
import {
  DEMO_EXTRA, RC_STATUS, rcCollected, rcDone, rcFilled, rcNext, rcSchemeById, rcShortfall, type RcStatus,
} from '../../../domain/adminRosca';
import { useAdminRo } from '../../../store/adminRoscaStore';
import { useRoleQS } from './rcParts';

const mems = [...SEED_MEMBERS.map((m) => ({ id: m.id, name: m.name, no: m.no })), ...DEMO_EXTRA];
const TABS: { k: RcStatus | 'all'; t: string }[] = [
  { k: 'all', t: 'সব' }, { k: 'active', t: 'চলমান' }, { k: 'forming', t: 'গঠন' },
  { k: 'risk', t: 'ঝুঁকি' }, { k: 'completed', t: 'সমাপ্ত' },
];

export default function RcCircles() {
  const navigate = useNavigate();
  const qs = useRoleQS();
  const go = (p: string) => navigate(`${p}${qs}`);
  const { state } = useAdminRo();
  const [q, setQ] = useState('');
  const [tab, setTab] = useState<RcStatus | 'all'>('all');

  const all = state.circles.map((c) => {
    const sc = rcSchemeById(state.schemes, c.scheme);
    return {
      c, sc, done: rcDone(state.draws, c.id), filled: rcFilled(state.seats, c.id),
      collected: rcCollected(c, sc, state.seats, state.draws, state.missed, mems),
      shortfall: rcShortfall(c, sc, state.seats, state.draws, state.missed, mems),
      next: rcNext(state.draws, c.id),
    };
  });
  const list = all.filter((r) => (tab === 'all' || r.c.status === tab)
    && (!q.trim() || r.c.code.includes(q.trim()) || r.c.route.includes(q.trim()) || r.sc.name.includes(q.trim())));

  return (
    <div className="p-4 space-y-3 pb-8">
      <Card>
        <label htmlFor="rc-q" className="block text-sm font-bold text-txt-2 mb-1.5">চক্র খুঁজুন</label>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-mut" />
          <input id="rc-q" className={`${inputCls} pl-9`} value={q} onChange={(e) => setQ(e.target.value)} placeholder="কোড / রুট / স্কিম" />
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {TABS.map((t) => (
            <Chip key={t.k} active={tab === t.k} onClick={() => setTab(t.k)}>
              {t.t} ({bn(t.k === 'all' ? all.length : all.filter((r) => r.c.status === t.k).length)})
            </Chip>
          ))}
        </div>
      </Card>

      <KpiGrid>
        <Kpi label="চলমান চক্র" value={bn(all.filter((r) => r.c.status === 'active').length)} tone="ok" note="ড্র চলছে" />
        <Kpi label="সিট পূর্ণতা" value={`${bn(Math.round((all.reduce((s, r) => s + r.filled, 0) / Math.max(1, all.reduce((s, r) => s + r.sc.seats, 0))) * 100))}%`} note="সব চক্র মিলিয়ে" />
        <Kpi label="মোট সংগ্রহ" value={`৳${bn(all.reduce((s, r) => s + r.collected, 0))}`} note="সিট-ভিত্তিক" />
        <Kpi label="ঘাটতি" value={`৳${bn(all.reduce((s, r) => s + r.shortfall, 0))}`} tone="warn" note="D-38 অমীমাংসিত" />
      </KpiGrid>

      <SectionHead title="চক্র" sub={`${bn(list.length)}টি দেখানো হচ্ছে`}
        right={<Button size="sm" icon={<Plus size={15} />} onClick={() => go('/a/rc/new')}>নতুন চক্র</Button>} />

      <div className="space-y-2">
        {list.length === 0 ? <Card><p className="text-sm text-mut">এই ফিল্টারে কোনো চক্র নেই।</p></Card> : list.map(({ c, sc, done, filled, collected, shortfall, next }) => (
          <button key={c.id} type="button" onClick={() => go(`/a/rc/circles/${c.id}`)}
            className="min-h-tap w-full text-left rounded-r-md bg-card border border-line shadow-sh-1 px-3.5 py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="font-extrabold text-body truncate">{c.code}</div>
                <div className="text-xs text-mut num">{sc.code} · {sc.freq} · ৳{bn(sc.contrib)}/কিস্তি</div>
              </div>
              <Badge tone={RC_STATUS[c.status].tone}>{RC_STATUS[c.status].t}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
              <div className="rounded-r-sm bg-card-2 border border-line px-2 py-1.5">
                <span className="text-mut block">সিট</span><b className="num">{bn(filled)}/{bn(sc.seats)}</b>
              </div>
              <div className="rounded-r-sm bg-card-2 border border-line px-2 py-1.5">
                <span className="text-mut block">ড্র সম্পন্ন</span><b className="num">{bn(done.length)}/{bn(sc.seats)}</b>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs">
              <span className="text-mut">{c.route}</span>
              {shortfall > 0 ? <Badge tone="danger">ঘাটতি ৳{bn(shortfall)}</Badge> : <Badge tone="ok">ঘাটতি নেই</Badge>}
              <span className="ml-auto num text-mut">৳{bn(collected)}</span>
            </div>
            {next ? <div className="text-xs text-mut mt-1 num">পরবর্তী ড্র {bn(next.no)} · {next.scheduled} · {next.status === 'approval' ? 'অনুমোদনের অপেক্ষায়' : 'নির্ধারিত'}</div> : null}
          </button>
        ))}
      </div>

      <Card title="সীমা ও নীতি">
        <p className="text-sm text-txt-2">এক সদস্য সর্বোচ্চ ৩টি চক্রে (D-48); একই কোড পুনরায় ব্যবহার হয় না (BR-08)। ড্র সম্পন্ন হলে অপরিবর্তনীয় — সংশোধন কেবল রিভার্সাল-জোড়া এন্ট্রিতে (R-02)।</p>
      </Card>
    </div>
  );
}
