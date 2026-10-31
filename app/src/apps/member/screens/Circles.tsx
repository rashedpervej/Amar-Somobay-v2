/* ============================================================
   src/apps/member/screens/Circles.tsx — RM-01 আমার চক্র (ROSCA)
   চলমান/গঠনধীন ও সম্পন্ন চক্র — প্রতিটি কার্ড থেকে বিস্তারিত, কিস্তি ও রসিদে।
   ============================================================ */

import { useNavigate } from 'react-router-dom';
import { ArrowDownToLine, Eye, FileText, Info, Layers, Users } from 'lucide-react';
import { Badge, Button, Card, SectionHead } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { useModules } from '../../../store/moduleStore';
import { doneDraws, myChance, myDraws, perDraw, type RcCircle } from '../../../domain/rosca';

const statusTone = (s: RcCircle['status']) => (s === 'active' ? 'ok' : s === 'forming' ? 'info' : s === 'risk' ? 'warn' : 'neutral');
const statusText = (s: RcCircle['status']) => (s === 'active' ? 'চলমান' : s === 'forming' ? 'গঠনধীন' : s === 'risk' ? 'ঝুঁকি' : 'সম্পন্ন');

export default function Circles() {
  const navigate = useNavigate();
  const { circles } = useModules();

  const active = circles.filter((c) => c.status === 'active' || c.status === 'forming' || c.status === 'risk');
  const done = circles.filter((c) => c.status === 'completed');
  const contributed = circles.reduce((s, c) => s + (c.seatList.find((x) => x.isMe)?.contributed ?? 0), 0);
  const received = circles.reduce((s, c) => s + myDraws(c).reduce((a, d) => a + d.amount, 0), 0);

  function CircleCard({ c }: { c: RcCircle }) {
    const wait = c.seatNo === null;
    return (
      <Card
        title={wait ? `ওয়েটলিস্ট · অবস্থান ${bn(c.waitlistPos ?? 0)}` : `সিট ${bn(c.seatNo ?? 0)} · ${c.route}`}
        sub={`${c.code} · ${c.name}`}
        right={<Badge tone={statusTone(c.status)}>{statusText(c.status)}</Badge>}
      >
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-r-sm bg-card-2 py-2">
            <div className="text-[11px] text-mut">কিস্তি</div>
            <div className="num text-sm font-extrabold text-txt">৳{bn(c.contrib)}</div>
          </div>
          <div className="rounded-r-sm bg-card-2 py-2">
            <div className="text-[11px] text-mut">ড্র সম্পন্ন</div>
            <div className="num text-sm font-extrabold text-txt">
              {bn(doneDraws(c).length)}/{bn(c.seats)}
            </div>
          </div>
          <div className="rounded-r-sm bg-card-2 py-2">
            <div className="text-[11px] text-mut">প্রতি ড্র</div>
            <div className="num text-sm font-extrabold text-txt">৳{bn(perDraw(c))}</div>
          </div>
        </div>

        {wait ? (
          <p className="text-xs text-mut mt-2">সিট খালি হলে SMS পাবেন — এখনো কিস্তি শুরু হয়নি।</p>
        ) : (
          <p className="text-xs text-mut mt-2">
            পরবর্তী ড্র {c.nextDate} · আমার সম্ভাবনা {bn(myChance(c))}% · সাক্ষী {c.witnesses.join(' · ')}
          </p>
        )}

        <div className="grid grid-cols-2 gap-2 mt-2">
          <Button size="sm" variant="secondary" icon={<Eye size={14} />} onClick={() => navigate(`/m/circles/${c.id}`)}>
            বিস্তারিত
          </Button>
          {c.status === 'active' ? (
            <Button size="sm" icon={<ArrowDownToLine size={14} />} onClick={() => navigate(`/m/circles/${c.id}/pay`)}>
              কিস্তি দিন
            </Button>
          ) : myDraws(c).length ? (
            <Button size="sm" icon={<FileText size={14} />} onClick={() => navigate(`/m/circles/${c.id}/receipt/${myDraws(c)[0].id}`)}>
              প্রাপ্তি রসিদ
            </Button>
          ) : (
            <Button size="sm" variant="secondary" icon={<Users size={14} />} onClick={() => navigate(`/m/circles/${c.id}/draws`)}>
              ড্র ক্রম
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-6">
      <div className="inline-flex items-center gap-1.5 text-xs font-bold text-info-ink bg-info-bg border border-info-bd rounded-r-pill px-2.5 py-1">
        <Layers size={13} /> ROSCA · চক্রভিত্তিক সঞ্চয় পুল <span className="font-normal text-mut">মডিউল ২</span>
      </div>

      <div className="rounded-r-lg bg-green-800 text-white p-4 shadow-sh-2">
        <div className="text-xs text-green-100">সব চক্র মিলিয়ে আমি জমা দিয়েছি</div>
        <div className="num text-display font-extrabold mt-1">৳{bn(contributed)}</div>
        <div className="flex gap-4 mt-2 text-xs text-green-100">
          <span>পেয়েছি ৳{bn(received)}</span>
          <span>
            চলমান কিস্তি ৳{bn(circles.filter((c) => c.status === 'active').reduce((s, c) => s + c.contrib, 0))}
          </span>
        </div>
      </div>

      <SectionHead title="চলমান ও গঠনধীন" sub={`${bn(active.length)}টি`} />
      {active.map((c) => (
        <CircleCard key={c.id} c={c} />
      ))}

      {done.length ? (
        <>
          <SectionHead
            title="সম্পন্ন চক্র"
            sub={`${bn(done.length)}টি`}
            right={<button type="button" onClick={() => navigate(`/m/circles/${done[0].id}/history`)} className="min-h-tap px-1 inline-flex items-center text-sm font-bold text-green-700">ইতিহাস</button>}
          />
          {done.map((c) => (
            <CircleCard key={c.id} c={c} />
          ))}
        </>
      ) : null}

      <Card title="চক্রের নিয়ম সংক্ষেপে" right={<Info size={16} className="text-mut" />}>
        <p className="text-sm text-txt-2 leading-relaxed">
          প্রতিটি সদস্য নির্ধারিত কিস্তি জমা দেন; প্রতি ড্র-তে পুলের টাকা <b>একজন</b> পান, যতক্ষণ না সবাই একবার করে পান।
          ড্রয়ের ফল <b>অপরিবর্তনীয়</b> ও সাক্ষীসহ সংরক্ষিত থাকে। কিস্তির টাকা জমা থাকে <b>ROSCA তহবিলে</b> — এটি সাধারণ
          সঞ্চয়ের মতো যেকোনো সময় তোলার টাকা নয়। কোনো সুদ বা মুনাফা নেই; শুধু এককালীন যোগদান ফি ও বকেয়ায় বিলম্ব ফি
          (নীতিগত পর্যালোচনাধীন, এখন কার্যকর নয়)।
        </p>
      </Card>
    </div>
  );
}
