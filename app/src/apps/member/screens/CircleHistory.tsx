/* ============================================================
   src/apps/member/screens/CircleHistory.tsx — RM-05 ড্র ইতিহাস ও প্রাপ্তি
   আমার পাওয়া ড্র (রসিদে যায়) + সব ড্র-এর অপরিবর্তনীয় তালিকা ও হ্যাশ।
   ============================================================ */

import { useNavigate, useParams } from 'react-router-dom';
import { Gift, Lock, Receipt, ShieldCheck, Users } from 'lucide-react';
import { Badge, Button, Card, SectionHead } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { useModules } from '../../../store/moduleStore';
import { channelLabel, doneDraws, myDraws, mySeat } from '../../../domain/rosca';

export default function CircleHistory() {
  const { circleId } = useParams();
  const navigate = useNavigate();
  const { circleById } = useModules();
  const c = circleById(circleId);

  if (!c) {
    return (
      <div className="p-4">
        <Card title="চক্র পাওয়া যায়নি">
          <Button onClick={() => navigate('/m/circles')}>তালিকায় ফিরুন</Button>
        </Card>
      </div>
    );
  }

  const done = doneDraws(c);
  const mine = myDraws(c);
  const seat = mySeat(c);
  const received = mine.reduce((s, d) => s + d.amount, 0);

  return (
    <div className="p-4 space-y-4 pb-6">
      <Card title="আমি মোট পেয়েছি" sub={`${c.code} · ${c.name}`} right={<Badge tone="brand">ROSCA</Badge>}>
        <div className="num text-display font-extrabold text-txt">৳{bn(received)}</div>
        <p className="text-xs text-mut mt-1">
          জমা দিয়েছি ৳{bn(seat?.contributed ?? 0)} ({bn(seat?.paidCount ?? 0)} কিস্তি) · পার্থক্য ৳
          {bn(Math.max(0, (seat?.contributed ?? 0) - received))} — চলমান চক্রে বাকি ড্রগুলোতে প্রাপ্য।
        </p>
      </Card>

      <SectionHead title="আমার প্রাপ্তি" sub={`${bn(mine.length)}টি · ভাউচারসহ`} />
      {mine.length ? (
        <div className="rounded-r-md border border-line bg-card overflow-hidden shadow-sh-1 divide-y divide-line-2">
          {mine.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => navigate(`/m/circles/${c.id}/receipt/${d.id}`)}
              className="w-full min-h-tap px-4 py-3 flex items-center gap-3 text-left"
            >
              <span className="w-9 h-9 grid place-items-center rounded-r-pill bg-ok-bg text-ok-ink shrink-0">
                <Gift size={16} />
              </span>
              <span className="grow min-w-0">
                <span className="block text-sm font-bold text-txt">
                  ৳{bn(d.amount)} · {c.code}
                </span>
                <span className="block text-xs text-mut truncate">
                  {d.executed} · ড্র {bn(d.no)} · {channelLabel(d.channel)}
                </span>
              </span>
              <span className="text-right shrink-0">
                <span className="num block text-xs font-bold text-txt">{d.receipt}</span>
                <span className="text-[11px] text-green-700 font-bold">রসিদ ›</span>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <Card>
          <p className="font-bold text-txt text-center">এখনো কোনো ড্র পাননি</p>
          <p className="text-xs text-mut text-center mt-1">চক্র চলমান — আপনার সম্ভাবনা বাকি সদস্যদের মতোই সমান।</p>
        </Card>
      )}

      <SectionHead title="সব ড্র (অপরিবর্তনীয়)" sub={`${bn(done.length)}টি`} />
      <div className="rounded-r-md border border-line bg-card overflow-hidden shadow-sh-1 divide-y divide-line-2">
        {done.map((d) => {
          const st = c.seatList.find((s) => s.no === d.winnerSeat);
          const isMe = d.winnerSeat === c.seatNo;
          return (
            <div key={d.id} className="px-4 py-3 flex items-center gap-3">
              <span className={`w-9 h-9 shrink-0 grid place-items-center rounded-r-pill ${isMe ? 'bg-ok-bg text-ok-ink' : 'bg-card-2 text-mut'}`}>
                {isMe ? <Gift size={16} /> : <Lock size={15} />}
              </span>
              <div className="grow min-w-0">
                <div className="text-sm font-bold text-txt truncate">
                  ড্র {bn(d.no)} · {st?.name ?? '—'}
                  {isMe ? ' (আমি)' : ''}
                </div>
                <div className="text-xs text-mut truncate">
                  {d.executed} · হ্যাশ {d.hash} · {d.receipt}
                </div>
              </div>
              <div className="num text-sm font-bold text-txt shrink-0">৳{bn(d.amount)}</div>
            </div>
          );
        })}
      </div>

      <div className="rounded-r-sm bg-info-bg border border-info-bd text-info-ink px-3 py-2.5 text-xs flex gap-2">
        <ShieldCheck size={15} className="mt-0.5 shrink-0" />
        <span>
          <b>ইতিহাস অপরিবর্তনীয়</b> — কোনো ড্র মুছে ফেলা বা বদলানো যায় না; সংশোধন হলে রিভার্সাল-জোড়া হিসাবে আলাদা এন্ট্রি থাকে।
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" icon={<ShieldCheck size={15} />} onClick={() => navigate('/verify')}>
          রসিদ যাচাই
        </Button>
        <Button variant="secondary" icon={<Users size={15} />} onClick={() => navigate(`/m/circles/${c.id}`)}>
          চক্র বিস্তারিত
        </Button>
      </div>
      {mine.length ? (
        <Button block icon={<Receipt size={16} />} onClick={() => navigate(`/m/circles/${c.id}/receipt/${mine[0].id}`)}>
          সর্বশেষ প্রাপ্তি ভাউচার
        </Button>
      ) : null}
    </div>
  );
}
