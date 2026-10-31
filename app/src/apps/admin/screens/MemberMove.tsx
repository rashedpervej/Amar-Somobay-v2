/* ============================================================
   src/apps/admin/screens/MemberMove.tsx — AM-30 সদস্য স্থানান্তর (রুট/শাখা)
   অবস্থা-সেগমেন্ট · নতুন অনুরোধ ফর্ম (আসল অ্যাকশন) · প্রভাব বিশ্লেষণ ·
   অনুমোদন (শাখায় ORG_ADMIN) · ক্রস-শাখা সমন্বয় · যাচাই-নিয়ম।
   ============================================================ */

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCheck, Eye, Plus, Route as RouteIcon, Users, X } from 'lucide-react';
import { Badge, Button, Card, Chip, Chipset, SectionHead } from '../../../components/ui';
import { ErrorBanner, Field, SuccessBanner, inputClass } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import { MV_STATUS, SEED_MOVES } from '../../../domain/adminOps';
import { Accordion, KV, Note, StackedCard, StackHead } from './parts';

const TABS = ['সব', 'অপেক্ষমাণ', 'কার্যকর', 'বাতিল'] as const;

export default function MemberMove() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const roleQS = params.get('role') ? `?role=${params.get('role')}` : '';
  const { state, requestMove, approveMove } = useAdmin();
  const [tab, setTab] = useState<(typeof TABS)[number]>('অপেক্ষমাণ');
  const [memberId, setMemberId] = useState(state.members[0].id);
  const [to, setTo] = useState('R2 · ঝিকরগাছা');
  const [reason, setReason] = useState('');
  const [effAt, setEffAt] = useState('2026-11-01');
  const [branchBy, setBranchBy] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const list = state.moves.filter((m) => tab === 'সব' ? true
    : tab === 'অপেক্ষমাণ' ? m.status === 'pending'
      : tab === 'কার্যকর' ? m.status === 'done' || m.status === 'approved'
        : m.status === 'cancelled');
  const pend = state.moves.filter((m) => m.status === 'pending').length;
  const m0 = state.moves.find((x) => x.memberId === memberId);

  function submit() {
    setMsg(''); setErr('');
    const r = requestMove(memberId, to, reason, effAt);
    if (!r.ok) { setErr(r.message); return; }
    setMsg(r.message); setReason('');
  }
  function approve(id: string, kind: string) {
    setMsg(''); setErr('');
    const r = approveMove(id, kind === 'branch' ? branchBy : 'MANAGER');
    if (!r.ok) { setErr(r.message); return; }
    setMsg(r.message);
  }

  return (
    <div className="p-4 space-y-3 pb-6">
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={`min-h-tap shrink-0 px-3 rounded-r-pill border text-sm font-bold ${tab === t ? 'bg-green-700 text-white border-green-800' : 'bg-card text-txt-2 border-line-3'}`}>
            {t} {t === 'সব' ? bn(state.moves.length) : t === 'অপেক্ষমাণ' ? bn(pend) : ''}
          </button>
        ))}
      </div>

      {msg ? <SuccessBanner title={msg}>ডেমো — সদস্যের রুট/শাখা এখনই বদলায়নি।</SuccessBanner> : null}
      {err ? <ErrorBanner>{err}</ErrorBanner> : null}

      {list.length === 0 ? <Card><p className="text-sm text-mut">এই অবস্থায় কোনো অনুরোধ নেই।</p></Card> : null}

      {list.map((m) => {
        const mm = state.members.find((x) => x.id === m.memberId);
        return (
          <StackedCard key={m.id} tone={m.status === 'pending' ? 'warn' : m.status === 'done' ? 'ok' : ''}
            head={<StackHead title={`${mm?.name ?? m.memberId} · ${m.no}`} sub={`${m.kindBn} · ${m.at} · ${m.by}`}
              right={<Badge tone={MV_STATUS[m.status].tone}>{MV_STATUS[m.status].t}</Badge>} />}>
            <KV k="কোথা থেকে" v={m.from} />
            <KV k="কোথায়" v={<b>{m.to}</b>} />
            <KV k="কারণ" v={m.reason} />
            <KV k="কার্যকর হবে" v={m.effAt} />
            <KV k="সংগ্রহক পরিবর্তন" v={m.impact.collector} />
            <KV k="রিপোর্টে প্রভাব" v={m.impact.report} />
            <KV k="নগদ/ক্যাশ বুকে প্রভাব" v={m.impact.cash} />
            <KV k="সদস্যের ব্যালেন্স" v={`৳${bn(mm ? state.accounts.filter((a) => a.memberId === mm.id).reduce((s, a) => s + a.posted, 0) : 0)} — অপরিবর্তিত থাকবে`} />
            <KV k="পুরনো লেনদেন" v={m.impact.history} />
            <div className="flex gap-2 mt-2.5">
              <Button size="sm" variant="ghost" icon={
                <X size={14} />} onClick={() => setMsg(`${m.no} বাতিল (ডেমো)`)}>বাতিল</Button>
              <Button size="sm" variant="secondary" className="grow" icon={<Eye size={14} />}
                onClick={() => navigate(`/a/members/${m.memberId}${roleQS}`)}>সদস্য ৩৬০°</Button>
              <Button size="sm" className="grow" icon={<CheckCheck size={14} />} disabled={m.status !== 'pending'}
                onClick={() => approve(m.id, m.kind)}>অনুমোদন</Button>
            </div>
          </StackedCard>
        );
      })}

      <Card title="নতুন স্থানান্তর অনুরোধ" sub="কার্যকর তারিখ ভবিষ্যতে">
        <Field label="সদস্য" required>
          {(fid) => (
            <select id={fid} value={memberId} onChange={(e) => setMemberId(e.target.value)} className={inputClass()}>
              {state.members.map((m) => <option key={m.id} value={m.id}>{m.name} · {m.no} · {m.route}</option>)}
            </select>
          )}
        </Field>
        <Field label="গন্তব্য রুট" required>
          {() => (
            <Chipset>
              {state.routes.map((r) => <Chip key={r.id} active={to.startsWith(r.id)} onClick={() => setTo(`${r.id} · ${r.name}`)}>{r.id} · {r.name}</Chip>)}
            </Chipset>
          )}
        </Field>
        <Field label="কারণ" required hint="৫ অক্ষরের কম হলে জমা হবে না">
          {(fid) => <textarea id={fid} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} className={inputClass()} placeholder="যেমন: ঠিকানা বদলেছে — ঝিকরগাছায় শ্বশুরবাড়ি" />}
        </Field>
        <Field label="কার্যকর হওয়ার তারিখ" required hint="আজ বা অতীতের তারিখ নয় (R-05)">
          {(fid) => <input id={fid} type="date" value={effAt} onChange={(e) => setEffAt(e.target.value)} className={inputClass()} />}
        </Field>
        <Field label="শাখা বদল হলে ORG_ADMIN অনুমোদন (নাম/সিদ্ধান্ত)" hint="রুট বদলে ফাঁকা রাখা যাবে">
          {(fid) => <input id={fid} value={branchBy} onChange={(e) => setBranchBy(e.target.value)} className={inputClass()} placeholder="কামরুল হাসান · শিক্ষা-২০২৬/১১" />}
        </Field>
        <Button className="w-full mt-2" icon={<Plus size={15} />} onClick={submit}>অনুরোধ জমা দিন</Button>
        {m0 ? <p className="text-xs text-mut mt-2">নির্বাচিত সদস্যের বর্তমান রুট: {m0.from}</p> : null}
      </Card>

      <Card title="ক্রস-শাখা সমন্বয়" sub="সমন্বয় বাকি" right={<Badge tone="danger">যাচাই দরকার</Badge>}>
        <p className="text-xs text-mut">বিশেষ ক্ষেত্রে দুই শাখার ক্যাশ হিসাব আলাদা হলে — উদাহরণ (ডেমো):</p>
        <KV k="কেশবপুর — নগদ" v={<span className="num">৳১,৮৬,৪০০ → <b className="text-danger-ink">−৳৬,৫৩,৬০০</b></span>} />
        <KV k="ঝিকরগাছা — নগদ" v={<span className="num">৳০ → <b className="text-ok-ink">৳৮,৪০,০০০</b></span>} />
        <KV k="সদস্যের আমানত" v="অপরিবর্তিত ✓" />
        <Note tone="warn">সমন্বয় এন্ট্রি ছাড়া অনুমোদন নয় — শুধু ORG_ADMIN শাখা স্থানান্তর অনুমোদন করতে পারেন, এবং সমন্বয় এন্ট্রিটি অডিট লগে থাকবে (AM-35)।</Note>
      </Card>

      <Accordion title="স্থানান্তরের আগে যাচাই" sub="৬টি শর্ত">
        {[
          ['নতুন রুটে সংগ্রহক নির্ধারিত আছে', `${state.routes.filter((r) => !r.unassigned).length}/${bn(state.routes.length)} রুটে ঠিক আছে`, true],
          ['চলমান উত্তোলন আবেদন', 'স্থানান্তর হলেও আবেদন পুরনো সংগ্রহকের কাছেই নিষ্পত্তি হবে', false],
          ['বকেয়া কিস্তি', 'বকেয়া সদস্যের সাথেই যাবে — নতুন রুটের রেজিস্টারে যোগ হবে', true],
          ['হাতে থাকা নগদ', 'পুরনো সংগ্রহকের দিনশেষ জমায় হিসাব হবে', true],
          ['সদস্যকে জানানো', 'SMS + অ্যাপ নোটিফিকেশন যাবে (নতুন সংগ্রহকের নামসহ)', true],
          ['শাখা বদল হলে অতিরিক্ত অনুমোদন', 'শুধু ORG_ADMIN শাখা স্থানান্তর অনুমোদন করতে পারেন', false],
        ].map(([a, b, ok]) => (
          <div key={String(a)} className="flex items-start gap-2 py-1.5 border-b border-line-2 last:border-b-0">
            <span className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${ok ? 'bg-ok' : 'bg-warn'}`} />
            <div>
              <div className="text-sm font-bold">{a}</div>
              <div className="text-xs text-mut">{b}</div>
            </div>
          </div>
        ))}
      </Accordion>

      <div className="flex gap-2">
        <Button variant="ghost" className="grow" icon={<RouteIcon size={15} />} onClick={() => navigate(`/a/routes${roleQS}`)}>রুট</Button>
        <Button variant="secondary" className="grow" icon={<Users size={15} />} onClick={() => navigate(`/a/members${roleQS}`)}>সদস্য তালিকা</Button>
      </div>
      <Note tone="info">স্থানান্তর মানে নতুন সদস্য নয় — সদস্য নম্বর, অ্যাকাউন্ট নম্বর ও সব লেনদেন ইতিহাস অপরিবর্তিত থাকে; শুধু রুট/শাখা ও সংগ্রহক বদলায়।</Note>
      <Note tone="warn">কার্যকর হওয়ার তারিখ পেছনে দেওয়া যাবে না — ভুল হলে একমাত্র পথ নতুন অনুরোধ। (ডেমো ডেটায় {bn(SEED_MOVES.length)}টি উদাহরণ)</Note>
      <SectionHead title="গন্তব্যে বোঝা" sub="AM-31-এ দেখুন" />
      <p className="text-sm text-txt-2">R2-তে এখন {bn(state.routes.find((r) => r.id === 'R2')?.members ?? 0)} জন সদস্য — নতুন স্থানান্তরে বাড়বে; রুটের ভারসাম্য পরের পর্দায় দেখে নিন।</p>
    </div>
  );
}
