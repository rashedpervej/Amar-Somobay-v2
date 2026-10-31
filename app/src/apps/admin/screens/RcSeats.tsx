/* RAM-05 · সিট বরাদ্দ ও ওয়েটলিস্ট — খালি সিটে সদস্য বসানো, বকেয়া চিহ্নিত করা */

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { Badge, Button, Card, SectionHead } from '../../../components/ui';
import { ErrorBanner, Field, SuccessBanner, inputClass } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { SEED_MEMBERS } from '../../../domain/admin';
import { DEMO_EXTRA, rcCircleById, rcSchemeById, rcSeats } from '../../../domain/adminRosca';
import { useAdminRo } from '../../../store/adminRoscaStore';
import { useRoleQS } from './rcParts';

const mems = [...SEED_MEMBERS.map((m) => ({ id: m.id, name: m.name, no: m.no })), ...DEMO_EXTRA];

export default function RcSeats() {
  const { circleId = '' } = useParams();
  const roleQS = useRoleQS();
  const navigate = useNavigate();
  const { state, assignSeat } = useAdminRo();
  const circle = rcCircleById(state.circles, circleId);
  const scheme = rcSchemeById(state.schemes, circle.scheme);
  const seats = rcSeats(circle, scheme, state.seats, state.draws, state.missed, mems);
  const vacant = seats.filter((s) => !s.memberId);
  const wait = state.waitlist[circle.id] ?? [];
  const [seatNo, setSeatNo] = useState(String(vacant[0]?.no ?? 1));
  const [memberId, setMemberId] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const submit = () => {
    setErr(''); setMsg('');
    const r = assignSeat(circle.id, Number(seatNo), memberId);
    if (!r.ok) { setErr(r.message); return; }
    setMsg(r.message);
    setMemberId('');
    const left = seats.filter((s) => !s.memberId && s.no !== Number(seatNo));
    if (left[0]) setSeatNo(String(left[0].no));
  };

  return (
    <div className="p-4 space-y-3 pb-8">
      <Button size="sm" variant="ghost" icon={<ArrowLeft size={15} />} onClick={() => navigate(`/a/rc/circles/${circle.id}${roleQS}`)}>চক্রে ফিরুন</Button>

      <Card title={`${circle.code} · সিট বরাদ্দ`} sub={`${bn(scheme.seats)} সিট · ${bn(seats.filter((s) => s.memberId).length)} বরাদ্দ · ${bn(vacant.length)} খালি`}>
        {msg ? <SuccessBanner title={msg} /> : null}
        {err ? <ErrorBanner>{err}</ErrorBanner> : null}
        {vacant.length === 0 ? <p className="text-sm text-ok-ink font-bold mt-2">সব সিট পূর্ণ — প্রথম ড্র প্রস্তুত।</p> : (
          <div className="space-y-3 mt-2">
            <Field label="খালি সিট" required>
              {(id) => (
                <select id={id} className={inputClass()} value={seatNo} onChange={(e) => setSeatNo(e.target.value)}>
                  {vacant.map((s) => <option key={s.no} value={s.no}>সিট {bn(s.no)}</option>)}
                </select>
              )}
            </Field>
            <div>
              <label htmlFor="rc-seat-mem" className="block text-sm font-bold text-txt-2 mb-1.5">সদস্য <span className="text-danger">*</span></label>
              <select id="rc-seat-mem" className={inputClass()} value={memberId} onChange={(e) => setMemberId(e.target.value)}>
                <option value="">— বাছাই করুন —</option>
                {mems.filter((m) => !(state.seats[circle.id] ?? []).includes(m.id)).map((m) => (
                  <option key={m.id} value={m.id}>{m.name} · {m.no}</option>
                ))}
              </select>
            </div>
            <Button block icon={<UserPlus size={16} />} onClick={submit} disabled={!memberId}>সিট বরাদ্দ করুন</Button>
            <p className="text-xs text-mut">এক সদস্য সর্বোচ্চ ৩টি চক্রে (D-48); বরাদ্দ একবার ড্র শুরু হলে বদলাতে প্রতিস্থাপন কর্মপ্রবাহ লাগে (D-46)।</p>
          </div>
        )}
      </Card>

      <SectionHead title="সব সিট" sub={`${bn(seats.length)}টি · সিট নম্বর অপরিবর্তনীয়`} />
      <Card>
        {seats.map((s) => (
          <div key={s.no} className="flex items-center gap-2 border-b border-line-2 last:border-b-0 py-2">
            <span className={`w-8 h-8 shrink-0 grid place-items-center rounded-r-pill text-xs font-extrabold num ${!s.memberId ? 'bg-line-2 text-mut' : s.status === 'won' ? 'bg-ok-bg text-ok-ink' : s.status === 'due' ? 'bg-danger-bg text-danger-ink' : 'bg-card-2 text-txt'}`}>{bn(s.no)}</span>
            <div className="grow min-w-0">
              <div className="text-sm font-bold truncate">{s.name}</div>
              <div className="text-xs text-mut num">{s.memberId ? `${bn(s.paidCount)} কিস্তি · ৳${bn(s.contributed)}${s.missed ? ` · বকেয়া ${bn(s.missed)}` : ''}` : 'খালি সিট'}</div>
            </div>
            {s.status === 'won' ? <Badge tone="ok">পেয়ে গেছে</Badge> : s.status === 'due' ? <Badge tone="danger">বকেয়া</Badge> : !s.memberId ? <Badge tone="neutral">খালি</Badge> : <Badge tone="info">চলমান</Badge>}
          </div>
        ))}
      </Card>

      <Card title="ওয়েটলিস্ট" sub={`${bn(wait.length)} জন অপেক্ষমাণ`} right={<Badge tone={wait.length ? 'warn' : 'neutral'}>{bn(wait.length)}</Badge>}>
        {wait.length === 0 ? <p className="text-sm text-mut">এই চক্রে কেউ অপেক্ষমাণ নেই।</p> : wait.map((w) => {
          const m = mems.find((x) => x.id === w.memberId);
          return (
            <div key={w.memberId} className="flex items-center justify-between gap-2 border-b border-line-2 last:border-b-0 py-2">
              <div>
                <div className="text-sm font-bold">{m?.name ?? w.memberId}</div>
                <div className="text-xs text-mut num">ক্রম {bn(w.pos)} · আবেদন {w.applied}</div>
              </div>
              <Button size="sm" variant="secondary" onClick={() => { setMemberId(w.memberId); setSeatNo(String(vacant[0]?.no ?? 1)); }}>
                বাছাই
              </Button>
            </div>
          );
        })}
        <p className="text-xs text-mut mt-2">প্রতিস্থাপনে ওয়েটলিস্ট থেকে বাছাই হয় — কমিটির লিখিত সিদ্ধান্ত ছাড়া নয় (D-46)।</p>
      </Card>
    </div>
  );
}
