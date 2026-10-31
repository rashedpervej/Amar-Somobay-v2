/* ============================================================
   src/apps/member/screens/Schemes.tsx — M-02 উপলব্ধ স্কিম ব্রাউজ
   ফিল্টার (সব / মাসিক াপ্তাহিক) → স্কিম কার্ড → M-03 বিস্তারিত।
   কোনো সুদ/মুনাফার হার দেখানো হয় না (নীতি D-01)।
   ============================================================ */

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarClock, Repeat } from 'lucide-react';
import { Badge, Card, Chip, Chipset, SectionHead } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { useMember } from '../../../store/memberStore';

export default function Schemes() {
  const { state } = useMember();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'মাসিক' | 'সাপ্তাহিক'>('all');

  const list = useMemo(
    () => (filter === 'all' ? state.schemes : state.schemes.filter((s) => s.frequency === filter)),
    [filter, state.schemes],
  );

  return (
    <div className="p-4 space-y-4">
      <div className="rounded-r-md bg-green-050 border border-line-2 px-4 py-3">
        <p className="text-sm text-txt-2">
          স্কিম বেছে নিয়ে নামভর্তি করুন। সব স্কিমে <b>কোনো সুদ বা শতাংশভিত্তিক মুনাফা নেই</b> — শুধু আপনার জমা।
        </p>
      </div>

      <Chipset>
        {(['all', 'মাসিক', 'সাপ্তাহিক'] as const).map((f) => (
          <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>
            {f === 'all' ? 'সব স্কিম' : f}
          </Chip>
        ))}
      </Chipset>

      <SectionHead title={`উপলব্ধ স্কিম (${bn(list.length)}টি)`} sub="প্রতিটি স্কিমের নিয়ম পড়ে নিন" />

      <div className="space-y-3">
        {list.map((s) => (
          <Card key={s.id} title={s.name} sub={s.summary}>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-r-sm bg-card-2 border border-line-2 px-3 py-2">
                <div className="text-xs text-mut">কিস্তি</div>
                <div className="num font-bold text-txt">৳{bn(s.installment)}</div>
              </div>
              <div className="rounded-r-sm bg-card-2 border border-line-2 px-3 py-2">
                <div className="text-xs text-mut">মেয়াদ</div>
                <div className="num font-bold text-txt">{bn(s.durationMonths)} মাস</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-3">
              <Badge tone="brand">
                <Repeat size={12} /> {s.frequency}
              </Badge>
              <Badge tone="neutral">
                <CalendarClock size={12} /> ন্যূনতম ৳{bn(s.minDeposit)}
              </Badge>
            </div>

            <button
              type="button"
              onClick={() => navigate(`/m/schemes/${s.id}`)}
              className="mt-3 w-full min-h-tap rounded-r-sm bg-green-700 text-white font-bold text-sm flex items-center justify-center gap-1.5 active:scale-[.98] transition"
            >
              বিস্তারিত ও নামভর্তি <ArrowRight size={16} />
            </button>
          </Card>
        ))}
      </div>

      <p className="text-xs text-mut text-center">
        স্কিমের শর্ত ও কিস্তির সময়সূচি সমিতি নির্ধারণ করে — কোনো লুকানো চার্জ নেই।
      </p>
    </div>
  );
}
