/* ============================================================
   src/apps/member/screens/Goals.tsx — JM-01 আমাদের লক্ষ্য
   চলমান লক্ষ্য, যোগ দেওয়ার সুযোগ ও সম্পন্ন লক্ষ্য — প্রতিটি কার্ড থেকে
   বিস্তারিত/অবদান/ব্যবহারের বিবরণে যায়।
   ============================================================ */

import { useNavigate } from 'react-router-dom';
import { ArrowDownToLine, Eye, Plus, Target } from 'lucide-react';
import { Badge, Button, Card, SectionHead } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { useModules } from '../../../store/moduleStore';
import { collected, myContribs, myPaid, myPart, pct, type JgGoal } from '../../../domain/joint';

const statusTone = (s: JgGoal['status']) =>
  s === 'active' ? 'ok' : s === 'forming' ? 'info' : s === 'achieved' ? 'brand' : s === 'settling' ? 'warn' : 'neutral';
const statusText = (s: JgGoal['status']) =>
  s === 'active' ? 'চলমান' : s === 'forming' ? 'গঠনধীন' : s === 'achieved' ? 'লক্ষ্য পূরণ' : s === 'settling' ? 'নিষ্পত্তি' : 'সম্পন্ন';

export default function Goals() {
  const navigate = useNavigate();
  const { goals, parts, contribs } = useModules();

  const mine = goals.filter((g) => myPart(parts, g.id));
  const live = mine.filter((g) => g.status === 'active' || g.status === 'forming');
  const done = mine.filter((g) => g.status === 'achieved' || g.status === 'closed');
  const openJoin = goals.filter((g) => g.join === 'open' && g.status === 'forming' && !myPart(parts, g.id));
  const totalPaid = mine.reduce((s, g) => s + myPaid(contribs, g.id), 0);

  function GoalCard({ g }: { g: JgGoal }) {
    const p = myPart(parts, g.id);
    const paid = myPaid(contribs, g.id);
    const gap = p?.pledged ? Math.max(0, p.pledged - paid) : 0;
    return (
      <Card
        title={g.name}
        sub={`${g.code} · ${g.targetDate} পর্যন্ত`}
        right={<Badge tone={statusTone(g.status)}>{statusText(g.status)}</Badge>}
      >
        <div className="flex items-center justify-between text-xs text-mut">
          <span>
            সংগ্রহ ৳{bn(collected(contribs, g.id))} / ৳{bn(g.target)}
          </span>
          <span className="num font-bold text-txt">{bn(pct(contribs, g))}%</span>
        </div>
        <div className="h-2 rounded-r-pill bg-line-2 overflow-hidden mt-1.5">
          <div className="h-full bg-green-600" style={{ width: `${pct(contribs, g)}%` }} />
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="rounded-r-sm bg-card-2 p-2">
            <div className="text-[11px] text-mut">আমার অবদান</div>
            <div className="num text-sm font-extrabold text-txt">৳{bn(paid)}</div>
            <div className="text-[11px] text-mut">
              {p?.pledged ? `প্রতিশ্রুতি ৳${bn(p.pledged)} · বাকি ৳${bn(gap)}` : 'প্রতিশ্রুতি নির্ধারণ বাকি'}
            </div>
          </div>
          <div className="rounded-r-sm bg-card-2 p-2">
            <div className="text-[11px] text-mut">এই মাসের হিসাব</div>
            <div className={`num text-sm font-extrabold ${gap ? 'text-danger' : 'text-ok'}`}>{gap ? `বকেয়া ৳${bn(gap)}` : 'বকেয়া নেই'}</div>
            <div className="text-[11px] text-mut">
              {g.rule === 'fixed' ? `নির্দিষ্ট ৳${bn(g.monthly ?? 0)}/মাস` : `নমনীয় ৳${bn(g.min ?? 0)}–${bn(g.max ?? 0)}`}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-2">
          <Button size="sm" variant="secondary" icon={<Eye size={14} />} onClick={() => navigate(`/m/goals/${g.id}`)}>
            বিস্তারিত
          </Button>
          {g.status === 'active' || g.status === 'forming' ? (
            <Button size="sm" icon={<ArrowDownToLine size={14} />} onClick={() => navigate(`/m/goals/${g.id}/contribute`)}>
              অবদান দিন
            </Button>
          ) : (
            <Button size="sm" variant="secondary" onClick={() => navigate('/m/goals/uses')}>
              ব্যবহারের বিবরণ
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-6">
      <div className="inline-flex items-center gap-1.5 text-xs font-bold text-info-ink bg-info-bg border border-info-bd rounded-r-pill px-2.5 py-1">
        <Target size={13} /> মডিউল ৩ · যৌথ লক্ষ্য
      </div>

      <div className="rounded-r-lg bg-green-800 text-white p-4 shadow-sh-2">
        <div className="text-xs text-green-100">সব লক্ষ্য মিলিয়ে আমার মোট অবদান</div>
        <div className="num text-display font-extrabold mt-1">৳{bn(totalPaid)}</div>
        <div className="flex gap-4 mt-2 text-xs text-green-100">
          <span>চলমান প্রতিশ্রুতি ৳{bn(live.reduce((s, g) => s + (myPart(parts, g.id)?.pledged ?? 0), 0))}</span>
          <span>সম্পন্ন {bn(done.length)}টি</span>
        </div>
      </div>

      <SectionHead title="চলমান লক্ষ্য" sub={`${bn(live.length)}টি`} />
      {live.map((g) => (
        <GoalCard key={g.id} g={g} />
      ))}

      {openJoin.length ? (
        <>
          <SectionHead title="যোগ দেওয়ার সুযোগ" sub={`${bn(openJoin.length)}টি`} />
          {openJoin.map((g) => (
            <Card key={g.id} title={g.name} sub={`${g.code} · ${bn(parts.filter((p) => p.goalId === g.id).length)}/${bn(g.maxParts)} জন`} right={<Badge tone="info">খোলা</Badge>}>
              <p className="text-sm text-txt-2">{g.desc}</p>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Button size="sm" icon={<Plus size={14} />} onClick={() => navigate(`/m/goals/${g.id}/join`)}>
                  যোগ দিন
                </Button>
                <Button size="sm" variant="secondary" onClick={() => navigate(`/m/goals/${g.id}`)}>
                  বিস্তারিত
                </Button>
              </div>
            </Card>
          ))}
        </>
      ) : null}

      {done.length ? (
        <>
          <SectionHead
            title="পূর্ণ ও সম্পন্ন লক্ষ্য"
            sub={`${bn(done.length)}টি`}
            right={<button type="button" onClick={() => navigate('/m/goals/uses')} className="min-h-tap px-1 inline-flex items-center text-sm font-bold text-green-700">ব্যবহারের বিবরণ</button>}
          />
          {done.map((g) => (
            <GoalCard key={g.id} g={g} />
          ))}
        </>
      ) : null}

      <Card title="লক্ষ্যের টাকা কী — সংক্ষেপে" sub="ব্যক্তিগত সঞ্চয় নয়">
        <p className="text-sm text-txt-2 leading-relaxed">
          আপনার অবদান জমা হয় <b>নির্দিষ্ট লক্ষ্য তহবিলে</b>। এটি সাধারণ সঞ্চয়ের মতো <b>ব্যক্তিগতভাবে তোলা যায় না</b> (BR-19) —
          টাকা ব্যবহার হয় লক্ষ্য পূরণের পরে, কমিটির লিখিত সিদ্ধান্ত ও প্রমাণসহ। লক্ষ্য পূরণ না হলে শুরুতেই লেখা নিয়ম প্রযোজ্য:
          মেয়াদ একবার বাড়ানো, না হলে আনুপাতিক ফেরত। এই টাকা “আমার সঞ্চয়”-এর মোটে যোগ হয় না।
        </p>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Button size="sm" variant="secondary" onClick={() => navigate('/m/goals/uses')}>ব্যবহার ও প্রমাণ</Button>
          <Button size="sm" variant="ghost" onClick={() => navigate('/m/home')}>হোম</Button>
        </div>
      </Card>
    </div>
  );
}
