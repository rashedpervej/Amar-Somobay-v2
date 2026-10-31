/* RAM-02 · চক্র স্কিম — সংস্করণ, কিস্তি, সিট, ফি ও ডিফল্ট নীতি */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Archive, BookOpen, Plus } from 'lucide-react';
import { Badge, Button, Card, Chip, Kpi, KpiGrid, SectionHead } from '../../../components/ui';
import { ErrorBanner, SuccessBanner } from '../../../components/form';
import { bn } from '../../../lib/bn';
import {
  RC_METHOD, RC_PAYOUT, RC_STEP, rcPerDraw, rcPayoutLabel, rcTotalPool, type RcScheme,
} from '../../../domain/adminRosca';
import { useAdminRo } from '../../../store/adminRoscaStore';
import { KV, StackedCard, StackHead } from './parts';
import { PoolRow, tk, useRoleQS } from './rcParts';

export default function RcSchemes() {
  const navigate = useNavigate();
  const qs = useRoleQS();
  const go = (p: string) => navigate(`${p}${qs}`);
  const { state, archiveScheme } = useAdminRo();
  const [filter, setFilter] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const list = state.schemes.filter((s) => !filter || s.code === filter);

  const archive = (s: RcScheme) => {
    setErr(''); setMsg('');
    const r = archiveScheme(s.id);
    if (!r.ok) { setErr(r.message); return; }
    setMsg(r.message);
  };

  return (
    <div className="p-4 space-y-3 pb-8">
      <KpiGrid>
        <Kpi label="স্কিম" value={bn(state.schemes.length)} note={`সক্রিয় ${bn(state.schemes.filter((s) => s.status === 'active').length)}`} />
        <Kpi label="মোট চক্র" value={bn(state.circles.length)} note="সব স্কিম মিলিয়ে" />
        <Kpi label="সর্বোচ্চ পুল" value={tk(Math.max(...state.schemes.map(rcTotalPool)))} tone="ok" note="স্কিম-ভিত্তিক" />
        <Kpi label="আর্কাইভড" value={bn(state.schemes.filter((s) => s.status === 'archived').length)} note="নতুন ভর্তি বন্ধ" />
      </KpiGrid>

      {msg ? <SuccessBanner title={msg} /> : null}
      {err ? <ErrorBanner>{err}</ErrorBanner> : null}

      <div className="flex flex-wrap gap-2">
        <Chip active={!filter} onClick={() => setFilter('')}>সব</Chip>
        {state.schemes.map((s) => (
          <Chip key={s.id} active={filter === s.code} onClick={() => setFilter(s.code)}>{s.code}</Chip>
        ))}
      </div>

      <Button block icon={<Plus size={16} />} onClick={() => go('/a/rc/schemes/new')}>নতুন স্কিম সংস্করণ</Button>

      <SectionHead title="স্কিম তালিকা" sub="সিট ও কিস্তি চক্র শুরুর পর বদলায় না" />
      {list.map((s) => (
        <StackedCard key={s.id} tone={s.status === 'archived' ? '' : 'ok'}
          head={<StackHead title={`${s.code} · ${s.name}`}
            sub={`${s.freq} · সংস্করণ v${bn(s.version)} · ${bn(state.circles.filter((c) => c.scheme === s.id).length)}টি চক্র`}
            right={<Badge tone={s.status === 'active' ? 'ok' : 'neutral'}>{s.status === 'active' ? 'সক্রিয়' : 'আর্কাইভড'}</Badge>} />}
          foot={<div className="flex gap-2">
            <Button size="sm" variant="ghost" icon={<BookOpen size={13} />} onClick={() => go('/a/rc/circles')}>চক্র</Button>
            <Button size="sm" variant="ghost" icon={<Archive size={13} />} disabled={s.status === 'archived'} onClick={() => archive(s)}>আর্কাইভ</Button>
          </div>}>
          <KV k="কিস্তি ও সিট" v={`${tk(s.contrib)} × ${bn(s.seats)} সিট`} />
          <KV k="প্রতি ড্র" v={`${tk(rcPerDraw(s))} · মোট ${bn(s.seats)} ড্র`} />
          <KV k="মোট পুল" v={tk(rcTotalPool(s))} />
          <KV k="ড্র পদ্ধতি" v={`${RC_METHOD[s.drawMethod]}${s.drawMethod === 'lottery' ? ' · D-42' : ''}`} />
          <KV k="ফি" v={`যোগদান ${tk(s.joinFee)} · বিলম্ব ${tk(s.lateFee)} · D-41`} />
          <KV k="পেআউট" v={s.payout.map((p) => rcPayoutLabel(p)).join(' · ')} />
          <KV k="ডিফল্ট নীতি" v={s.defaultPolicy.map((p) => RC_STEP[p]).join(' → ')} />
          <KV k="নোট" v={s.note} />
        </StackedCard>
      ))}

      <Card title="সীমা">
        <PoolRow label="সঞ্চয় অ্যাকাউন্টে স্থানান্তর" value="নিষ্ক্রিয় (D-12)" tone="warn" />
        <div className="mt-2"><PoolRow label="নিলাম/চাহিদা ভিত্তিক ড্র" value="চালু নেই (BR-13)" tone="bad" /></div>
        <div className="mt-2"><PoolRow label="সময়ভিত্তিক আয়" value="৳০ · নিষিদ্ধ" tone="ok" /></div>
        <p className="text-xs text-mut mt-2">স্কিম বদলালে নতুন সংস্করণ তৈরি হয় — চলমান চক্র পুরোনো সংস্করণেই চলে। পেআউট চ্যানেল: {RC_PAYOUT.filter((p) => p.on).map((p) => p.t).join(' · ')}।</p>
      </Card>
    </div>
  );
}
