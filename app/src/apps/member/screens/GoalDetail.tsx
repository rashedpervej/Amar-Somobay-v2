/* ============================================================
   src/apps/member/screens/GoalDetail.tsx — JM-02 লক্ষ্য বিস্তারিত
   চারটি জরুরি তথ্য, মাইলস্টোন, আমার অবদান ইতিহাস ও অংশগ্রহণকারীদের অগ্রগতি।
   ============================================================ */

import { useNavigate, useParams } from 'react-router-dom';
import { ArrowDownToLine, CalendarClock, ChevronRight, FileText, ShieldCheck, Users } from 'lucide-react';
import { Badge, Button, Card, Row, SectionHead } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { useModules } from '../../../store/moduleStore';
import {
  collected, contribsOf, milestones, myContribs, myPaid, myPart, partsOf, paidOut, pct, pledgeTotal,
} from '../../../domain/joint';

export default function GoalDetail() {
  const { goalId } = useParams();
  const navigate = useNavigate();
  const { goalById, parts, contribs, disbursements } = useModules();
  const g = goalById(goalId);

  if (!g) {
    return (
      <div className="p-4">
        <Card title="লক্ষ্য পাওয়া যায়নি">
          <Button onClick={() => navigate('/m/goals')}>তালিকায় ফিরুন</Button>
        </Card>
      </div>
    );
  }

  const p = myPart(parts, g.id);
  const paid = myPaid(contribs, g.id);
  const myList = myContribs(contribs, g.id);
  const progress = pct(contribs, g);
  const members = partsOf(parts, g.id).filter((x) => x.status !== 'invited');
  const reached = milestones.filter((m) => progress >= m.pct);

  return (
    <div className="p-4 space-y-4 pb-6">
      <div className="rounded-r-lg bg-green-800 text-white p-4">
        <div className="text-xs text-green-100">{g.code} · {members.length} জন অংশগ্রহণকারী</div>
        <div className="font-extrabold text-h2 mt-0.5">{g.name}</div>
        <div className="flex items-center justify-between mt-3 text-xs text-green-100">
          <span>সংগ্রহ ৳{bn(collected(contribs, g.id))} / ৳{bn(g.target)}</span>
          <span className="num font-bold text-white">{bn(progress)}%</span>
        </div>
        <div className="h-2 rounded-r-pill bg-white/20 overflow-hidden mt-1.5">
          <div className="h-full bg-lime" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-xs text-green-100 mt-2">{g.desc}</p>
      </div>

      <SectionHead title="চারটি জরুরি তথ্য" />
      <Card>
        <dl className="text-sm divide-y divide-line-2">
          {[
            ['লক্ষ্য', `৳${bn(g.target)} · ${g.targetDate}`],
            ['আমার প্রতিশ্রুতি', p?.pledged ? `৳${bn(p.pledged)} · জমা ৳${bn(paid)}` : 'নির্ধারিত হয়নি'],
            ['নিয়ম', g.rule === 'fixed' ? `নির্দিষ্ট ৳${bn(g.monthly ?? 0)}/মাস` : `নমনীয় ৳${bn(g.min ?? 0)}–৳${bn(g.max ?? 0)}`],
            ['ব্যবহার', g.use.join(' · ')],
            ['মেয়াদ শেষে', g.deadlinePolicy.join(' → ')],
            ['কমিটি', g.committee],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3 py-2">
              <dt className="text-mut shrink-0">{k}</dt>
              <dd className="font-bold text-txt text-right">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="text-xs text-warn-ink mt-2">
          এই টাকা ব্যক্তিগতভাবে তোলা যায় না (BR-19) — লক্ষ্য-নির্দিষ্ট তহবিল।
        </p>
      </Card>

      <SectionHead title="মাইলস্টোন" sub={`${bn(reached.length)}/৪ পূর্ণ`} />
      <Card>
        <div className="grid grid-cols-4 gap-2">
          {milestones.map((m) => {
            const ok = progress >= m.pct;
            return (
              <div key={m.pct} className={`rounded-r-sm border px-2 py-2 text-center ${ok ? 'border-ok-bd bg-ok-bg' : 'border-line bg-card-2'}`}>
                <div className={`num text-sm font-extrabold ${ok ? 'text-ok-ink' : 'text-mut'}`}>{bn(m.pct)}%</div>
                <div className="text-[10px] text-mut">{ok ? 'পূর্ণ' : 'বাকি'}</div>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-mut mt-2">
          মাইলস্টোন পূর্ণ হলে নোটিশ পাবেন; লিডারবোর্ড বা প্রতিযোগিতার তালিকা নেই — যৌথ লক্ষ্যে সামাজিক চাপ তৈরি করা হয় না।
        </p>
      </Card>

      <SectionHead
        title="আমার অবদান ইতিহাস"
        sub={`${bn(myList.length)}টি · ৳${bn(paid)}`}
        right={<button type="button" onClick={() => navigate(`/m/goals/${g.id}/contribute`)} className="text-sm font-bold text-green-700">অবদান</button>}
      />
      <div className="rounded-r-md border border-line bg-card overflow-hidden shadow-sh-1 divide-y divide-line-2">
        {myList.slice(0, 5).map((c) => (
          <button key={c.id} type="button" onClick={() => navigate('/verify')} className="w-full min-h-tap px-4 py-2.5 flex items-center gap-3 text-left">
            <span className="w-9 h-9 grid place-items-center rounded-r-pill bg-green-100 text-green-800 shrink-0">
              <ArrowDownToLine size={15} />
            </span>
            <span className="grow min-w-0">
              <span className="block text-sm font-bold text-txt">{c.at} · ৳{bn(c.amount)}</span>
              <span className="block text-xs text-mut truncate">রসিদ {c.receipt} · {c.by}</span>
            </span>
            <ChevronRight size={15} className="text-mut shrink-0" />
          </button>
        ))}
        {myList.length === 0 ? <div className="px-4 py-6 text-center text-sm text-mut">এখনো কোনো অবদান নেই</div> : null}
      </div>

      <SectionHead title="অংশগ্রহণকারী" sub={`${bn(members.length)} জন · মোট প্রতিশ্রুতি ৳${bn(pledgeTotal(parts, g.id))}`} />
      <Card>
        <ul className="divide-y divide-line-2">
          {members.slice(0, 6).map((x) => {
            const xPaid = contribsOf(contribs, g.id).filter((c) => c.memberId === x.memberId).reduce((s, c) => s + c.amount, 0);
            const pc = x.pledged ? Math.round((xPaid / x.pledged) * 100) : 0;
            return (
              <li key={x.memberId} className="py-2 flex items-center gap-3">
                <span className="w-9 h-9 rounded-r-pill bg-green-050 text-green-800 grid place-items-center text-xs font-extrabold shrink-0">
                  {x.name.slice(0, 1)}
                </span>
                <div className="grow min-w-0">
                  <div className="text-sm font-bold text-txt truncate">
                    {x.isMe ? 'আমি · ' : ''}
                    {x.name}
                  </div>
                  <div className="h-1.5 rounded-r-pill bg-line-2 overflow-hidden mt-1">
                    <div className={`h-full ${pc >= 100 ? 'bg-ok' : pc < 50 ? 'bg-warn' : 'bg-green-600'}`} style={{ width: `${Math.min(100, pc)}%` }} />
                  </div>
                  <div className="text-[11px] text-mut mt-0.5">প্রতিশ্রুতি ৳{bn(x.pledged)} · {bn(pc)}% জমা</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="num text-sm font-bold text-txt">৳{bn(xPaid)}</div>
                  <div className="text-[11px] text-mut">{bn(contribsOf(contribs, g.id).filter((c) => c.memberId === x.memberId).length)} বার</div>
                </div>
              </li>
            );
          })}
        </ul>
        {members.length > 6 ? <p className="text-xs text-mut mt-2">আরও {bn(members.length - 6)} জন — গোপনীয়তা রক্ষায় নাম সংক্ষেপে।</p> : null}
      </Card>

      <div className="rounded-r-sm bg-warn-bg border border-warn-bd text-warn-ink px-3 py-2.5 text-xs flex gap-2">
        <ShieldCheck size={15} className="mt-0.5 shrink-0" />
        <span>
          <b>টাকার নিরাপত্তা ও নিয়ম</b> — অবদান জমা হয় লক্ষ্য তহবিলে; খরচ হয় পূর্বনির্ধারিত পদ্ধতিতে ({g.use.join(' · ') }),
          কমিটির লিখিত সিদ্ধান্ত ({g.committee}) ও প্রমাণসহ।
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button icon={<ArrowDownToLine size={15} />} onClick={() => navigate(`/m/goals/${g.id}/contribute`)}>অবদান দিন</Button>
        <Button variant="secondary" icon={<FileText size={15} />} onClick={() => navigate('/m/goals/uses')}>ব্যবহার</Button>
      </div>
      <Row
        icon={<Users size={18} />}
        title="যোগদান ও প্রতিশ্রুতি"
        sub={p ? `আমার প্রতিশ্রুতি ৳${bn(p.pledged)}` : 'প্রতিশ্রুতি নির্ধারণ করুন'}
        right={<ChevronRight size={18} className="text-mut" />}
        onClick={() => navigate(`/m/goals/${g.id}/join`)}
      />
      {g.status === 'achieved' ? (
        <Row
          icon={<CalendarClock size={18} />}
          title="নিষ্পত্তি হয়েছে"
          sub={`ব্যয়িত ৳${bn(paidOut(disbursements, g.id))} · ${g.settledOn ?? ''}`}
          right={<Badge tone="brand">সম্পন্ন</Badge>}
          onClick={() => navigate('/m/goals/uses')}
        />
      ) : null}
    </div>
  );
}
