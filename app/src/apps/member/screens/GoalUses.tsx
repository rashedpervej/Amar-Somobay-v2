/* ============================================================
   src/apps/member/screens/GoalUses.tsx — JM-05 অর্জন ও ব্যবহারের বিবরণ
   লক্ষ্য পূরণের পর প্রতিটি টাকা কীভাবে ব্যবহার হলো — ভাউচার, ভেন্ডর,
   কমিটির সিদ্ধান্ত ও প্রমাণ। প্রমাণ ছাড়া অর্থ ছাড়া হয় না (BR-19/D-50)।
   ============================================================ */

import { useNavigate } from 'react-router-dom';
import { ChevronRight, Download, FileText, ShieldCheck, Target } from 'lucide-react';
import { Badge, Button, Card, SectionHead } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { channelLabel } from '../../../domain/joint';
import { useModules } from '../../../store/moduleStore';
import { collected, disbOf, myPaid, paidOut, pct } from '../../../domain/joint';

const stTone = (s: 'paid' | 'pending' | 'approved') => (s === 'paid' ? 'ok' : s === 'approved' ? 'info' : 'warn');
const stText = (s: 'paid' | 'pending' | 'approved') => (s === 'paid' ? 'পরিশোধিত' : s === 'approved' ? 'অনুমোদিত' : 'অনুমোদনের অপেক্ষায়');

export default function GoalUses() {
  const navigate = useNavigate();
  const { goals, contribs, disbursements } = useModules();
  const done = goals.filter((g) => g.status === 'achieved' || g.status === 'closed' || g.status === 'settling');
  const allPaid = disbursements.filter((d) => d.status === 'paid').reduce((s, d) => s + d.amount, 0);

  return (
    <div className="p-4 space-y-4 pb-6">
      <div className="inline-flex items-center gap-1.5 text-xs font-bold text-info-ink bg-info-bg border border-info-bd rounded-r-pill px-2.5 py-1">
        <Target size={13} /> মডিউল ৩ · ব্যবহারের স্বচ্ছতা
      </div>

      <div className="rounded-r-md bg-green-800 text-white p-4">
        <div className="text-xs text-green-100">সব লক্ষ্যে ব্যয়িত</div>
        <div className="num text-display font-extrabold mt-1">৳{bn(allPaid)}</div>
        <div className="text-xs text-green-100 mt-1">{bn(disbursements.length)}টি ভাউচার · {bn(done.length)}টি সম্পন্ন লক্ষ্য</div>
      </div>

      <div className="rounded-r-sm bg-info-bg border border-info-bd text-info-ink px-3 py-2 text-xs flex gap-2">
        <ShieldCheck size={15} className="mt-0.5 shrink-0" />
        <span>
          <b>স্বচ্ছতাই আস্থা</b> — প্রতিটি টাকা কীভাবে ব্যবহার হলো (ভাউচার, ভেন্ডর, কমিটির সিদ্ধান্ত ও প্রমাণ) এখানে দেখা যায়।
          কোনো এন্ট্রি মুছে যায় না।
        </span>
      </div>

      {done.map((g) => {
        const ds = disbOf(disbursements, g.id);
        const paid = paidOut(disbursements, g.id);
        return (
          <div key={g.id} className="space-y-2">
            <SectionHead
              title={g.name}
              sub={`${g.code} · ${bn(pct(contribs, g))}%`}
              right={<Badge tone="brand">{g.status === 'achieved' ? 'লক্ষ্য পূরণ' : 'সম্পন্ন'}</Badge>}
            />
            <Card>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-r-sm bg-card-2 p-2">
                  <div className="text-[11px] text-mut">লক্ষ্য পূরণ</div>
                  <div className="text-sm font-extrabold text-txt">{g.settledOn ?? 'পূর্ণ'}</div>
                  <div className="num text-[11px] text-mut">৳{bn(collected(contribs, g.id))} / ৳{bn(g.target)}</div>
                </div>
                <div className="rounded-r-sm bg-card-2 p-2">
                  <div className="text-[11px] text-mut">ব্যবহৃত / ব্যয়িত</div>
                  <div className="num text-sm font-extrabold text-txt">৳{bn(paid)}</div>
                  <div className="text-[11px] text-mut">
                    {bn(ds.length)}টি ভাউচার · বাকি ৳{bn(Math.max(0, collected(contribs, g.id) - paid))}
                  </div>
                </div>
                <div className="rounded-r-sm bg-card-2 p-2">
                  <div className="text-[11px] text-mut">আমার অবদান</div>
                  <div className="num text-sm font-extrabold text-txt">৳{bn(myPaid(contribs, g.id))}</div>
                  <div className="text-[11px] text-mut">
                    মোট সংগ্রহের {bn(collected(contribs, g.id) ? Math.round((myPaid(contribs, g.id) / collected(contribs, g.id)) * 100) : 0)}%
                  </div>
                </div>
                <div className="rounded-r-sm bg-card-2 p-2">
                  <div className="text-[11px] text-mut">নিষ্পত্তি</div>
                  <div className="text-sm font-extrabold text-txt">{g.settledOn ?? 'চলমান'}</div>
                  <div className="text-[11px] text-mut">রেকর্ড অপরিবর্তনীয়</div>
                </div>
              </div>
              {g.note ? <p className="text-xs text-mut mt-2">{g.note}</p> : null}
            </Card>

            {ds.length === 0 ? (
              <Card>
                <p className="text-sm text-txt-2">এখনো কোনো ভাউচার তৈরি হয়নি — কমিটির সিদ্ধান্তের অপেক্ষায়।</p>
              </Card>
            ) : null}

            {ds.map((v) => (
              <Card key={v.id} title={v.purpose} sub={`${v.no} · ${v.at}`} right={<Badge tone={stTone(v.status)}>{stText(v.status)}</Badge>}>
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm text-txt-2">
                    {v.payee}
                    <div className="text-xs text-mut">{channelLabel(v.channel)}</div>
                  </div>
                  <div className="num text-h3 font-extrabold text-txt">৳{bn(v.amount)}</div>
                </div>

                {v.evidence.length ? (
                  <div className="mt-2 space-y-1">
                    {v.evidence.map((e) => (
                      <div key={e} className="rounded-r-sm bg-card-2 border border-line-2 px-2 py-1.5 text-xs flex items-center gap-2">
                        <FileText size={13} className="text-mut" />
                        <span className="grow truncate">{e}</span>
                        <Badge tone="ok">সংযুক্ত</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-2 rounded-r-sm bg-warn-bg border border-warn-bd text-warn-ink px-2 py-1.5 text-xs">
                    <b>প্রমাণ সংযুক্ত না হওয়া পর্যন্ত অর্থ ছাড়া হবে না</b> · BR-19
                  </div>
                )}

                <dl className="text-sm divide-y divide-line-2 mt-2">
                  <div className="flex justify-between py-1.5">
                    <dt className="text-mut">কমিটির সিদ্ধান্ত</dt>
                    <dd className="font-bold text-txt text-right">{v.committee}</dd>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <dt className="text-mut">সিদ্ধান্তের ধরন</dt>
                    <dd className="font-bold text-txt text-right">{v.decision}</dd>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <dt className="text-mut">প্রস্তুত → অনুমোদন</dt>
                    <dd className="font-bold text-txt text-right">{v.by} → {v.appr ?? 'অপেক্ষমাণ'}</dd>
                  </div>
                  {v.hash ? (
                    <div className="flex justify-between py-1.5">
                      <dt className="text-mut">ভাউচার হ্যাশ</dt>
                      <dd className="num font-bold text-txt text-right text-xs">{v.hash}</dd>
                    </div>
                  ) : null}
                </dl>
                {v.note ? <p className="text-xs text-mut mt-1">{v.note}</p> : null}
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Button size="sm" variant="ghost" icon={<Download size={14} />} onClick={() => navigate('/verify')}>যাচাই</Button>
                  <Button size="sm" variant="ghost" icon={<ChevronRight size={14} />} onClick={() => navigate(`/m/goals/${g.id}`)}>লক্ষ্য</Button>
                </div>
              </Card>
            ))}
          </div>
        );
      })}

      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={() => navigate('/m/goals')}>সব লক্ষ্য</Button>
        <Button variant="ghost" onClick={() => navigate('/m/txn')}>লেনদেন ইতিহাস</Button>
      </div>
    </div>
  );
}
