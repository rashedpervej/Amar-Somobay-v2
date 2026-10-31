/* ============================================================
   src/apps/admin/screens/Approvals.tsx — AM-02 অনুমোদন কিউ
   ট্যাব (উত্তোলন/জমা/সদস্য/সংশোধন) · সীমা-সচেতন ব্যাজ · SLA অ্যালার্ট।
   প্রতিটি কার্ড → AM-03 সিদ্ধান্ত পর্দা।
   ============================================================ */

import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, CheckCheck, ChevronRight, Clock, Eye, Filter, ShieldAlert, Users } from 'lucide-react';
import { Badge, Button, Chip, Chipset, SectionHead } from '../../../components/ui';
import { EmptyState } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import { approvalsOf, CHANNEL_LABEL, type ApprovalKind } from '../../../domain/admin';
import { Note, StackedCard, StackHead } from './parts';

const TABS: { k: ApprovalKind; t: string }[] = [
  { k: 'withdrawal', t: 'উত্তোলন' },
  { k: 'deposit', t: 'জমা' },
  { k: 'member', t: 'সদস্য' },
  { k: 'correction', t: 'সংশোধন' },
];

const KIND_BN: Record<ApprovalKind | 'all', string> = {
  withdrawal: 'উত্তোলন', deposit: 'জমা', member: 'সদস্য নিবন্ধন', correction: 'সংশোধন', all: 'সব',
};

export default function Approvals() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { state } = useAdmin();
  const [tab, setTab] = useState<ApprovalKind | 'all'>('withdrawal');
  const [mine, setMine] = useState(true);
  const [slaOnly, setSlaOnly] = useState(false);

  const roleQS = params.get('role') ? `?role=${params.get('role')}` : '';
  const list = useMemo(() => {
    let rows = approvalsOf(state.approvals, tab);
    if (mine) rows = rows.filter((r) => r.inLimit);
    if (slaOnly) rows = rows.filter((r) => r.hoursAgo > 24);
    return rows;
  }, [state.approvals, tab, mine, slaOnly]);

  const all = state.approvals;
  const overLimit = all.filter((a) => !a.inLimit && a.kind === 'withdrawal');
  const total = list.reduce((s, a) => s + a.amount, 0);

  return (
    <div className="p-4 space-y-4 pb-6">
      <div className="flex items-center gap-2">
        <div className="grow">
          <h2 className="text-h2 text-txt">অনুমোদন কিউ</h2>
          <p className="text-sm text-mut">{bn(all.length)}টি সিদ্ধান্ত বাকি · আপনার সীমা ৳{bn(50000)}</p>
        </div>
        <Badge tone={all.length ? 'danger' : 'ok'}>{bn(all.length)}</Badge>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {TABS.map((t) => {
          const n = approvalsOf(state.approvals, t.k).length;
          return (
            <button key={t.k} type="button" onClick={() => setTab(t.k)}
              className={`min-h-tap shrink-0 px-3.5 rounded-r-pill border text-sm font-bold ${tab === t.k ? 'bg-green-700 text-white border-green-800' : 'bg-card text-txt-2 border-line-3'}`}>
              {t.t} <span className="opacity-80">({bn(n)})</span>
            </button>
          );
        })}
      </div>

      <Chipset>
        <Chip active={mine} onClick={() => setMine((v) => !v)}>আমার সীমার ভিতরে</Chip>
        <Chip active={slaOnly} onClick={() => setSlaOnly((v) => !v)}>SLA অতিক্রম</Chip>
        <Chip active={false} onClick={() => { setMine(false); setSlaOnly(false); }}>
          <Filter size={14} className="inline -mt-0.5 mr-1" />সব
        </Chip>
      </Chipset>

      {overLimit.length ? (
        <Note tone="danger">
          <b>{bn(overLimit.length)}টি আবেদন আপনার সীমার বাইরে</b>
          <span className="block text-xs mt-0.5">এগুলো অনুমোদন করা যাবে না — দেখা ও মন্তব্য করা যাবে, সিদ্ধান্ত APPROVER-এর (D-22, BR-04)।</span>
        </Note>
      ) : null}

      <SectionHead title={`${KIND_BN[tab]} — অপেক্ষমাণ`} sub={`${bn(list.length)}টি · মোট ৳${bn(total)}`} />

      {list.length === 0 ? (
        <EmptyState title="কিউ খালি" sub="এই বিভাগে সিদ্ধান্তের অপেক্ষায় কিছু নেই" action={<Button variant="secondary" size="sm" onClick={() => { setMine(false); setSlaOnly(false); }}>সব দেখুন</Button>} />
      ) : null}

      {list.map((a) => (
        <StackedCard
          key={a.id}
          tone={a.hoursAgo > 24 ? 'warn' : ''}
          head={
            <StackHead
              title={`${a.member} · ৳${bn(a.amount)}`}
              sub={`${a.ref} · ${a.submitted} · ${a.by}`}
              right={
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <Badge tone="info">{KIND_BN[a.kind]}</Badge>
                  {a.hoursAgo > 24 ? <Badge tone="warn"><Clock size={12} /> {bn(a.hoursAgo)} ঘণ্টা</Badge> : null}
                  {a.inLimit ? null : <Badge tone="danger">সীমার বাইরে</Badge>}
                  {a.evidence ? <Badge tone="ok">প্রমাণ আছে</Badge> : <Badge tone="danger">প্রমাণ নেই</Badge>}
                </div>
              }
            />
          }
          foot={
            <>
              <Button size="sm" variant="secondary" className="grow" icon={<Eye size={15} />} onClick={() => navigate(`/a/approvals/${a.id}${a.kind === 'member' ? '/review' : ''}${roleQS}`)}>
                দেখুন ও সিদ্ধান্ত
              </Button>
              <Button size="sm" variant="ghost" icon={<Users size={15} />} onClick={() => navigate(`/a/members/${a.memberId}${roleQS}`)}>৩৬০°</Button>
            </>
          }
        >
          <div className="text-sm text-txt-2 space-y-1 py-1">
            {a.kind === 'withdrawal' ? (
              <>
                <div className="flex justify-between"><span className="text-mut text-xs">উপলব্ধ</span><span className="num font-bold">৳{bn(a.avail)}</span></div>
                <div className="flex justify-between"><span className="text-mut text-xs">কারণ</span><span className="font-bold">{a.reason}</span></div>
                <div className="flex justify-between"><span className="text-mut text-xs">মাধ্যম</span><span className="font-bold">{a.method === 'cash_office' ? 'অফিস কাউন্টার' : CHANNEL_LABEL[a.method]}</span></div>
              </>
            ) : null}
            {a.kind === 'deposit' ? (
              <>
                <div className="flex justify-between"><span className="text-mut text-xs">রসিদ</span><span className="num font-bold">{a.ref}</span></div>
                <div className="flex justify-between"><span className="text-mut text-xs">মিল</span><span className="font-bold">{a.matched === 'auto' ? 'স্বয়ংক্রিয় মিল ✓' : a.matched === 'partial' ? 'আংশিক মিল' : 'মিল নেই'}</span></div>
              </>
            ) : null}
            {a.kind === 'member' ? (
              <>
                <div className="flex justify-between"><span className="text-mut text-xs">আবেদন</span><span className="num font-bold">{a.ref}</span></div>
                <div className="flex justify-between"><span className="text-mut text-xs">প্রথম জমা</span><span className="num font-bold">৳{bn(a.amount)}</span></div>
                <div className="flex justify-between"><span className="text-mut text-xs">নোট</span><span className="font-bold">{a.note}</span></div>
              </>
            ) : null}
            {a.kind === 'correction' ? (
              <>
                <div className="flex justify-between"><span className="text-mut text-xs">সংশোধন</span><span className="num font-bold">{a.ref}</span></div>
                <div className="flex justify-between"><span className="text-mut text-xs">এন্ট্রি করেছেন</span><span className="font-bold text-xs">{a.by}</span></div>
              </>
            ) : null}
          </div>
        </StackedCard>
      ))}

      <Note tone="info">
        <b>maker ≠ checker (BR-04)</b>
        <span className="block text-xs mt-0.5">যিনি এন্ট্রি করেছেন তিনি তা অনুমোদন করতে পারবেন না · অনুমোদন সীমা ভূমিকা অনুযায়ী (D-22)।</span>
      </Note>

      <div className="flex gap-2">
        <Button variant="ghost" className="grow" icon={<Filter size={15} />} onClick={() => { setMine(false); setSlaOnly(false); }}>সব ফিল্টার বাদ</Button>
        <Button className="grow" icon={<CheckCheck size={15} />} onClick={() => list[0] && navigate(`/a/approvals/${list[0].id}${roleQS}`)} disabled={!list.length}>
          প্রথমটি খুলুন
        </Button>
      </div>

      <div className="flex items-center justify-center gap-1.5 text-xs text-mut">
        <ShieldAlert size={13} /> সিদ্ধান্ত অপরিবর্তনীয় — সংশোধন মানে রিভার্সাল (AM-14) ও অডিট লগ।
      </div>
      <div className="flex items-center justify-center gap-1.5 text-xs text-mut">
        <AlertTriangle size={13} /> কোনো সুদ/মুনাফা যোগ হয় না — শুধু জমার অঙ্ক (D-01)।
      </div>
    </div>
  );
}
