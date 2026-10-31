/* ============================================================
   src/apps/admin/screens/Members.tsx — AM-04 সদস্য খোঁজা ও তালিকা
   নাম / মোবাইল / সদস্য নম্বর / NID দিয়ে লাইভ খোঁজা, অবস্থা-ফিল্টার,
   প্রতিটি কার্ড → ৩৬০° · জমা · সম্পাদনা।
   ============================================================ */

import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Banknote, ChevronRight, Eye, Phone, Search, User, UserPlus } from 'lucide-react';
import { Badge, Button, Card, Chip, Chipset, SectionHead } from '../../../components/ui';
import { EmptyState, inputClass } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import { dueTotal, MEM_STATUS } from '../../../domain/admin';
import { Note, StackedCard, StackHead } from './parts';

const FILTERS = [
  { k: 'all', t: 'সব' },
  { k: 'active', t: 'সক্রিয়' },
  { k: 'due', t: 'বকেয়া আছে' },
  { k: 'dormant', t: 'নিষ্ক্রিয়' },
] as const;

export default function Members() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { state } = useAdmin();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['k']>('all');
  const roleQS = params.get('role') ? `?role=${params.get('role')}` : '';

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return state.members.filter((m) => {
      if (filter === 'due' && dueTotal(state.dues, m.id) <= 0) return false;
      if (filter !== 'all' && filter !== 'due' && m.status !== filter) return false;
      if (!needle) return true;
      return [m.name, m.mobile, m.no, m.nid].some((v) => v.toLowerCase().includes(needle));
    });
  }, [state.members, state.dues, q, filter]);

  return (
    <div className="p-4 space-y-4 pb-6">
      <div className="flex items-start gap-2">
        <div className="grow">
          <h2 className="text-h2 text-txt">সদস্য খুঁজুন</h2>
          <p className="text-sm text-mut">{bn(state.members.length)} জন সদস্য · শাপলা সমবায় সমিতি</p>
        </div>
        <Button size="sm" icon={<UserPlus size={15} />} onClick={() => navigate(`/a/members/new${roleQS}`)}>নতুন</Button>
      </div>

      <Card>
        <label htmlFor="member-search" className="block text-sm font-bold text-txt-2 mb-1.5">
          নাম, মোবাইল, সদস্য নম্বর বা NID
        </label>
        <div className="flex items-center gap-2">
          <input id="member-search" value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="যেমন: রহিমা / ০১৭১১ / RSS-001" className={inputClass() + ' grow'} />
          <Button size="sm" icon={<Search size={16} />} onClick={() => setQ(q.trim())}>খুঁজুন</Button>
        </div>
        <p className="text-xs text-mut mt-1.5">বাংলা বা ইংরেজি সংখ্যা — দুটোই চলে। অন্তত ৩ অক্ষর দরকার।</p>
        <Chipset>
          {FILTERS.map((f) => (
            <Chip key={f.k} active={filter === f.k} onClick={() => setFilter(f.k)}>{f.t}</Chip>
          ))}
        </Chipset>
      </Card>

      <SectionHead title="ফলাফল" sub={`${bn(rows.length)} জন`} right={<Badge tone="neutral">ডেমো</Badge>} />

      {rows.length === 0 ? (
        <EmptyState title={`“${q}” নামে কেউ নেই`} sub="বানান মিলিয়ে দেখুন, অথবা মোবাইল নম্বর দিয়ে খুঁজুন"
          action={<Button size="sm" variant="secondary" onClick={() => { setQ(''); setFilter('all'); }}>ফিল্টার রিসেট</Button>} />
      ) : null}

      {rows.map((m) => {
        const due = dueTotal(state.dues, m.id);
        return (
          <StackedCard key={m.id} tone={due > 0 ? 'warn' : ''}
            head={
              <StackHead title={m.name} sub={`${m.no} · ${m.village}, ${m.union} · রুট ${m.route}`}
                right={
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <Badge tone={MEM_STATUS[m.status].tone}>{MEM_STATUS[m.status].t}</Badge>
                    <Badge tone={m.kyc === 'verified' ? 'ok' : 'warn'}>KYC {m.kyc === 'verified' ? '✓' : 'বাকি'}</Badge>
                  </div>
                } />
            }
            foot={
              <>
                <Button size="sm" variant="secondary" className="grow" icon={<Banknote size={15} />} onClick={() => navigate(`/a/entry?member=${m.id}${roleQS ? `&${roleQS.slice(1)}` : ''}`)}>জমা নিন</Button>
                <Button size="sm" variant="secondary" icon={<Eye size={15} />} onClick={() => navigate(`/a/members/${m.id}${roleQS}`)}>৩৬০°</Button>
                <Button size="sm" variant="ghost" icon={<Phone size={15} />} onClick={() => navigate(`/a/members/${m.id}${roleQS}`)}>কল</Button>
              </>
            }
          >
            <div className="text-sm space-y-1 py-1">
              <div className="flex justify-between"><span className="text-mut text-xs">মোবাইল</span><span className="num font-bold">{m.mobile}</span></div>
              <div className="flex justify-between"><span className="text-mut text-xs">মোট সঞ্চয়</span><span className="num font-bold">৳{bn(m.id === 'm1' ? 57500 : 12800)}</span></div>
              <div className="flex justify-between">
                <span className="text-mut text-xs">বকেয়া</span>
                <span className={`num font-bold ${due ? 'text-danger-ink' : 'text-ok-ink'}`}>{due ? `৳${bn(due)}` : '৳০ ✓'}</span>
              </div>
              <div className="flex justify-between"><span className="text-mut text-xs">যোগদান</span><span className="font-bold">{m.joined} · {m.occupation}</span></div>
            </div>
          </StackedCard>
        );
      })}

      <Note tone="info">
        <b>অফলাইনেও খোঁজা যায়</b> — নিজের রুটের সদস্য তালিকা ডিভাইসে ক্যাশ থাকে; সংযোগ ছাড়াই নাম/মোবাইলে খুঁজে জমা নেওয়া যায় (D-18)।
      </Note>

      <Button variant="ghost" block icon={<User size={15} />} onClick={() => navigate(`/a/members/m1${roleQS}`)}>
        উদাহরণ: রহিমা বেগম-এর ৩৬০° দেখুন
      </Button>
      <div className="flex items-center justify-center gap-1.5 text-xs text-mut">
        <ChevronRight size={13} /> নাম বা নম্বরে ট্যাপ করলে সদস্য ৩৬০°
      </div>
    </div>
  );
}
