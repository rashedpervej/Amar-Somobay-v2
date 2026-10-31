/* ============================================================
   src/apps/member/screens/CircleDraws.tsx — RM-03 ড্র ক্রম ও পরবর্তী ড্র
   পরবর্তী ড্র, আমার অবস্থান, ড্র-ক্রমের তালিকা ও সাক্ষীর তথ্য।
   বকেয়া থাকলে সতর্কতা — ড্রয়ের আগে শোধ করলে পুলের ঘাটতি এড়ানো যায়।
   ============================================================ */

import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowDownToLine, CalendarClock, ChevronRight, Lock, Users } from 'lucide-react';
import { Badge, Button, Card, Row, SectionHead } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { useModules } from '../../../store/moduleStore';
import { candidates, channelLabel, doneDraws, myChance, myDraws, mySeat, nextDraw } from '../../../domain/rosca';

export default function CircleDraws() {
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

  const next = nextDraw(c);
  const done = doneDraws(c);
  const me = mySeat(c);
  const won = myDraws(c)[0];

  return (
    <div className="p-4 space-y-4 pb-6">
      <div className="inline-flex items-center gap-1.5 text-xs font-bold text-info-ink bg-info-bg border border-info-bd rounded-r-pill px-2.5 py-1">
        <Lock size={13} /> ড্রয়ের ফল অপরিবর্তনীয় · {c.code}
      </div>

      {next ? (
        <Card title="পরবর্তী ড্র" sub={`ড্র ${bn(next.no)} · ${c.route}`} right={<Badge tone="warn">অপেক্ষমাণ</Badge>}>
          <div className="flex items-end gap-3">
            <div className="num text-h1 font-extrabold text-txt">{next.scheduled.split(' ').slice(0, 2).join(' ')}</div>
            <div className="grow text-right">
              <div className="text-xs text-mut">পুল</div>
              <div className="num font-bold text-txt">৳{bn(next.amount)}</div>
            </div>
          </div>
          <p className="text-xs text-txt-2 mt-2">
            পদ্ধতি <b>লটারি</b> — ক্রম আগে থেকে ঠিক করা নয়, ড্রয়ের দিন সাক্ষী সামনে লটারি হয়। সাক্ষী: {c.witnesses.join(' · ')}।
          </p>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <Button variant="secondary" icon={<Users size={15} />} onClick={() => navigate(`/m/circles/${c.id}`)}>
              সিট দেখুন
            </Button>
            <Button icon={<ArrowDownToLine size={15} />} onClick={() => navigate(`/m/circles/${c.id}/pay`)}>
              কিস্তি দিন
            </Button>
          </div>
        </Card>
      ) : (
        <Card title="সব ড্র সম্পন্ন" sub="হিসাব নিষ্পত্তির অপেক্ষায়" />
      )}

      <SectionHead title="আমার অবস্থান" sub={me ? `সিট ${bn(me.no)}` : 'ওয়েটলিস্ট'} />
      <Card>
        <dl className="text-sm divide-y divide-line-2">
          <div className="flex justify-between py-1.5">
            <dt className="text-mut">আমি পেয়েছি কি না</dt>
            <dd className="font-bold">{won ? `৳${bn(won.amount)} · ${won.executed}` : `পাইনি — ${bn(candidates(c))} জনের একজন`}</dd>
          </div>
          <div className="flex justify-between py-1.5">
            <dt className="text-mut">সম্ভাবনা</dt>
            <dd className="num font-bold">{bn(myChance(c))}% (প্রতি ড্র-তে সমান)</dd>
          </div>
          <div className="flex justify-between py-1.5">
            <dt className="text-mut">জমা দিয়েছি</dt>
            <dd className="num font-bold">৳{bn(me?.contributed ?? 0)} · {bn(me?.paidCount ?? 0)} কিস্তি</dd>
          </div>
        </dl>
      </Card>

      {me?.missed ? (
        <div className="rounded-r-sm bg-danger-bg border border-danger-bd text-danger-ink px-3 py-2.5 text-sm flex gap-2">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>
            <b>৳{bn(me.missed * c.contrib)} বকেয়া</b> — ড্রয়ের আগে শোধ করলে পুলের ঘাটতি এড়ানো যায়। বিলম্বে অতিরিক্ত চার্জ নেই (নীতিগত পর্যালোচনাধীন)।
          </span>
        </div>
      ) : null}

      <SectionHead title="ড্র ক্রম" sub={`${bn(done.length)}টি সম্পন্ন`} />
      <div className="rounded-r-md border border-line bg-card overflow-hidden shadow-sh-1 divide-y divide-line-2">
        {c.draws.map((d) => {
          const seat = c.seatList.find((s) => s.no === d.winnerSeat);
          const isMe = d.winnerSeat === c.seatNo;
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => (d.status === 'done' ? navigate(`/m/circles/${c.id}/receipt/${d.id}`) : navigate(`/m/circles/${c.id}/pay`))}
              className="w-full min-h-tap px-4 py-3 flex items-center gap-3 text-left hover:bg-green-050/50"
            >
              <span className={`w-9 h-9 shrink-0 grid place-items-center rounded-r-pill text-xs font-extrabold ${d.status === 'done' ? 'bg-ok-bg text-ok-ink' : 'bg-warn-bg text-warn-ink'}`}>
                {bn(d.no)}
              </span>
              <span className="grow min-w-0">
                <span className="block text-sm font-bold text-txt truncate">
                  {d.status === 'done' ? `${seat?.name ?? '—'}${isMe ? ' (আমি)' : ''}` : 'লটারি হবে'}
                </span>
                <span className="block text-xs text-mut">
                  {d.status === 'done' ? `${d.executed} · ${channelLabel(d.channel)}` : `${d.scheduled} · সাক্ষীসহ`}
                </span>
              </span>
              <span className="text-right shrink-0">
                <span className="num block text-sm font-bold text-txt">৳{bn(d.amount)}</span>
                <span className="text-[11px] text-mut">{d.status === 'done' ? d.receipt : 'সcheduled'}</span>
              </span>
              <ChevronRight size={16} className="text-mut shrink-0" />
            </button>
          );
        })}
      </div>

      <Row
        icon={<CalendarClock size={18} />}
        title="আমার প্রাপ্তি ইতিহাস"
        sub={won ? `${won.executed} · ৳${bn(won.amount)}` : 'এখনো কোনো প্রাপ্তি নেই'}
        right={<ChevronRight size={18} className="text-mut" />}
        onClick={() => navigate(`/m/circles/${c.id}/history`)}
      />
    </div>
  );
}
