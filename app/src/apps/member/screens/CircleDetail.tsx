/* ============================================================
   src/apps/member/screens/CircleDetail.tsx — RM-02 চক্র বিস্তারিত
   ড্র-অগ্রগতি রিং, আমার সিট, সিট/প্রাপক গ্রিড, পুল হিসাব ও পরবর্তী ড্র।
   ============================================================ */

import { useNavigate, useParams } from 'react-router-dom';
import { ArrowDownToLine, CalendarClock, ChevronRight, Info, Users } from 'lucide-react';
import { Badge, Button, Card, Row, SectionHead } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { useModules } from '../../../store/moduleStore';
import {
  candidates, channelLabel, circleProgress, doneDraws, mySeat, nextDraw, perDraw, totalPool,
} from '../../../domain/rosca';

export default function CircleDetail() {
  const { circleId } = useParams();
  const navigate = useNavigate();
  const { circleById } = useModules();
  const c = circleById(circleId);

  if (!c) {
    return (
      <div className="p-4">
        <Card title="চক্র পাওয়া যায়নি" sub="লিংকটি পুরনো হতে পারে">
          <Button onClick={() => navigate('/m/circles')}>চক্র তালিকায় ফিরুন</Button>
        </Card>
      </div>
    );
  }

  const me = mySeat(c);
  const next = nextDraw(c);
  const pct = circleProgress(c);
  const done = doneDraws(c);

  return (
    <div className="p-4 space-y-4 pb-6">
      <div className="rounded-r-lg bg-green-800 text-white p-4">
        <div className="flex items-center gap-4">
          <div
            className="w-20 h-20 rounded-r-pill grid place-items-center shrink-0"
            style={{ background: `conic-gradient(var(--lime) ${pct}%, rgba(255,255,255,.18) 0)` }}
          >
            <div className="w-16 h-16 rounded-r-pill bg-green-800 grid place-items-center">
              <div className="text-center">
                <div className="num text-sm font-extrabold">
                  {bn(done.length)}/{bn(c.seats)}
                </div>
                <div className="text-[10px] text-green-100">ড্র</div>
              </div>
            </div>
          </div>
          <div className="grow min-w-0">
            <div className="text-xs text-green-100">{c.code} · {c.route}</div>
            <div className="font-extrabold text-h3 mt-0.5">{c.name}</div>
            <div className="text-xs text-green-100 mt-1">
              প্রতি ড্র ৳{bn(perDraw(c))} · মোট পুল ৳{bn(totalPool(c))}
            </div>
            <div className="text-xs text-green-100">
              {c.start} – {c.end}
            </div>
          </div>
        </div>
      </div>

      <SectionHead title="আমার সিট" sub={me ? `সিট ${bn(me.no)}` : 'ওয়েটলিস্ট'} />
      <Card
        title={me ? `${me.name} · সিট ${bn(me.no)}` : `ওয়েটলিস্ট · অবস্থান ${bn(c.waitlistPos ?? 0)}`}
        sub={`জমা দিয়েছি ৳${bn(me?.contributed ?? 0)} · ${bn(me?.paidCount ?? 0)} কিস্তি`}
        right={<Badge tone={me?.status === 'won' ? 'ok' : me?.missed ? 'warn' : 'info'}>{me?.status === 'won' ? 'পেয়েছি' : me?.missed ? 'বকেয়া' : 'অপেক্ষমাণ'}</Badge>}
      >
        <dl className="text-sm divide-y divide-line-2">
          <div className="flex justify-between py-1.5">
            <dt className="text-mut">পেয়েছি</dt>
            <dd className="num font-bold">{me?.receivedAt ? `৳${bn(me.receivedAmt)} · ${me.receivedAt}` : 'এখনো পাইনি'}</dd>
          </div>
          <div className="flex justify-between py-1.5">
            <dt className="text-mut">বকেয়া</dt>
            <dd className={`num font-bold ${me?.missed ? 'text-danger' : 'text-ok'}`}>{me?.missed ? `৳${bn(me.missed * c.contrib)}` : 'নেই'}</dd>
          </div>
          <div className="flex justify-between py-1.5">
            <dt className="text-mut">আগামী ড্র-তে সম্ভাবনা</dt>
            <dd className="num font-bold">{bn(Math.round(100 / Math.max(1, candidates(c))))}%</dd>
          </div>
        </dl>
        <div className="grid grid-cols-2 gap-2 mt-3">
          {c.status === 'active' ? (
            <Button icon={<ArrowDownToLine size={15} />} onClick={() => navigate(`/m/circles/${c.id}/pay`)}>
              কিস্তি দিন
            </Button>
          ) : null}
          <Button variant="secondary" icon={<CalendarClock size={15} />} onClick={() => navigate(`/m/circles/${c.id}/draws`)}>
            ড্র ক্রম
          </Button>
        </div>
      </Card>

      <SectionHead title="সিট ও প্রাপক" sub={`${bn(c.seatList.filter((s) => s.status === 'won').length)} জন পেয়েছেন · ${bn(candidates(c))} জন বাকি`} />
      <Card>
        <div className="grid grid-cols-6 gap-1.5">
          {c.seatList.map((s) => (
            <div
              key={s.no}
              title={`সিট ${bn(s.no)} · ${s.name}`}
              className={`aspect-square rounded-r-sm border grid place-items-center text-center ${
                s.isMe ? 'border-green-700 bg-green-100' : s.status === 'won' ? 'border-ok-bd bg-ok-bg' : s.status === 'due' ? 'border-danger-bd bg-danger-bg' : 'border-line bg-card-2'
              }`}
            >
              <div>
                <div className="num text-xs font-extrabold text-txt">{bn(s.no)}</div>
                <div className="text-[9px] text-mut truncate px-0.5">{s.name.split(' ')[0]}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-mut mt-2 flex items-center gap-1">
          <Info size={12} /> নীল ঘর = আমি · সবুজ = পেয়ে গেছেন · লাল = বকেয়া। প্রতিটি সিট একবারই পাবে।
        </p>
      </Card>

      <SectionHead title="পুল হিসাব" sub={`ড্র ${bn(done.length)} পর্যন্ত`} />
      <Card>
        <dl className="text-sm divide-y divide-line-2">
          <div className="flex justify-between py-1.5">
            <dt className="text-mut">প্রত্যাশিত (ড্র × পুল)</dt>
            <dd className="num font-bold">৳{bn(done.length * perDraw(c))}</dd>
          </div>
          <div className="flex justify-between py-1.5">
            <dt className="text-mut">সংগৃহীত</dt>
            <dd className="num font-bold text-ok">৳{bn(c.collected)}</dd>
          </div>
          <div className="flex justify-between py-1.5">
            <dt className="text-mut">ঘাটতি</dt>
            <dd className={`num font-bold ${c.shortfall ? 'text-danger' : 'text-ok'}`}>৳{bn(c.shortfall)}</dd>
          </div>
        </dl>
        <p className="text-xs text-mut mt-2">
          হিসাব দায়-খাত ভিত্তিক: কিস্তি → ROSCA তহবিল; ড্র পেআউট → নগদ/ব্যাংক/বিকাশ (ডাবল এন্ট্রি)।
        </p>
      </Card>

      <SectionHead title="পরবর্তী ড্র" sub={next ? `ড্র ${bn(next.no)}` : 'সম্পন্ন'} />
      {next ? (
        <Row
          icon={<CalendarClock size={18} />}
          title={next.scheduled}
          sub={`পদ্ধতি: লটারি (সাক্ষীসহ) · সম্ভাব্য প্রাপক ${bn(candidates(c))} জন · ৳${bn(next.amount)}`}
          right={<ChevronRight size={18} className="text-mut" />}
          onClick={() => navigate(`/m/circles/${c.id}/draws`)}
        />
      ) : (
        <Card>
          <p className="text-sm text-txt-2">সব ড্র সম্পন্ন — হিসাব নিষ্পত্তির পর সনদ পাবেন।</p>
        </Card>
      )}

      <Row
        icon={<Users size={18} />}
        title="ড্র ইতিহাস ও আমার প্রাপ্তি"
        sub="অপরিবর্তনীয় রেকর্ড, রসিদসহ"
        right={<ChevronRight size={18} className="text-mut" />}
        onClick={() => navigate(`/m/circles/${c.id}/history`)}
      />

      <p className="text-xs text-mut text-center">
        ড্রয়ের ফল প্রকাশের সাথে সাথে SMS ও অ্যাপ নোটিশ পাবেন · {channelLabel('cash')} সহ ৩টি মাধ্যম
      </p>
    </div>
  );
}
