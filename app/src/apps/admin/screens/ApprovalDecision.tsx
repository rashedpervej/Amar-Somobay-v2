/* ============================================================
   src/apps/admin/screens/ApprovalDecision.tsx — AM-03 অনুমোদনের সিদ্ধান্ত
   উত্তোলন: যোগ্যতা হিসাব + নীতি যাচাই + আংশিক/প্রত্যাখ্যান/এসকেলেট।
   জমা/সদস্য/সংশোধন: ধরন-অনুযায়ী যাচাই ও সিদ্ধান্ত।
   ============================================================ */

import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Check, CheckCircle2, ChevronRight, Clock, FileText, Lock, Minus, Send, ShieldAlert, X } from 'lucide-react';
import { Badge, Button, Card, DecisionBar, Row, SectionHead } from '../../../components/ui';
import { ErrorBanner, Field, SuccessBanner, inputClass } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import { CHANNEL_LABEL, MEM_STATUS, memberById } from '../../../domain/admin';
import { Hero, HeroChip, Note, Stepper } from './parts';

export default function ApprovalDecision() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { state, decide, reviewApplication } = useAdmin();
  const item = state.approvals.find((a) => a.id === id);
  const member = memberById(state.members, item?.memberId);
  const [reason, setReason] = useState('');
  const [partial, setPartial] = useState<number | ''>('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const roleQS = params.get('role') ? `?role=${params.get('role')}` : '';

  if (!item || !member) {
    return (
      <div className="p-4 space-y-3">
        <Note tone="warn">এই আবেদনটি ইতিমধ্যে নিষ্পত্তি হয়েছে বা পাওয়া যায়নি।</Note>
        <Button onClick={() => navigate(`/a/approvals${roleQS}`)}>কিউতে ফিরুন</Button>
      </div>
    );
  }

  const go = (msg: string) => {
    setDone(msg);
    setError('');
  };

  function act(kind: 'approve' | 'reject' | 'partial' | 'escalate') {
    setError('');
    if (kind === 'partial' && !isWithdrawal) { setError('আংশিক অনুমোদন শুধু উত্তোলনে প্রযোজ্য'); return; }
    if (item!.kind === 'member' && (kind === 'partial' || kind === 'escalate')) {
      setError('সদস্য আবেদনে অনুমোদন / প্রত্যাখ্যান / তথ্য চাওয়া — এই তিনটি পথ'); return;
    }
    if (kind === 'reject') {
      if (reason.trim().length < 5) { setError('প্রত্যাখ্যানের কারণ অন্তত ৫ অক্ষরে লিখুন'); return; }
      if (otp.replace(/\D/g, '').length !== 6) { setError('৬ সংখ্যার OTP দিন (ডেমো: ৪৭১৯০২)'); return; }
    }
    if (kind === 'partial' && (typeof partial !== 'number' || partial < 1)) {
      setError('আংশিক অঙ্ক লিখুন'); return;
    }
    if (current.kind === 'member') {
      const r = reviewApplication(current.id, kind === 'approve' ? 'approve' : 'reject', reason || 'ডকুমেন্ট যাচাই সম্পন্ন');
      if (!r.ok) { setError(r.message); return; }
      go(r.message);
      return;
    }
    const r = decide(current.id, kind, { amount: typeof partial === 'number' ? partial : undefined, reason });
    if (!r.ok) { setError(r.message); return; }
    go(r.message);
  }

  const isWithdrawal = item.kind === 'withdrawal';
  const current = item;

  return (
    <div className="pb-2">
      <div className="p-4 space-y-4">
        <button type="button" onClick={() => navigate(`/a/approvals${roleQS}`)} className="min-h-tap inline-flex items-center gap-1.5 text-sm font-bold text-green-700">
          ← অনুমোদন কিউ
        </button>

        {done ? <SuccessBanner title={done}>ডেমো — কোনো বাস্তব ডেটাবেসে লেখা হয়নি।</SuccessBanner> : null}
        {error ? <ErrorBanner>{error}</ErrorBanner> : null}

        <Hero
          label={isWithdrawal ? 'আবেদিত পরিমাণ' : 'আবেদনের অঙ্ক'}
          amount={`৳${bn(item.amount)}`}
          sub={`${item.ref} · ${item.submitted}`}
          chips={<>
            <HeroChip>{isWithdrawal ? 'উত্তোলন' : item.kind === 'deposit' ? 'জমা' : item.kind === 'member' ? 'সদস্য' : 'সংশোধন'}</HeroChip>
            <HeroChip>{bn(item.hoursAgo)} ঘণ্টা অপেক্ষা</HeroChip>
            {item.inLimit ? <HeroChip>সীমার ভিতরে ✓</HeroChip> : <HeroChip>সীমার বাইরে</HeroChip>}
          </>}
        />

        {done ? (
          <Button block onClick={() => navigate(`/a/approvals${roleQS}`)}>কিউতে ফিরুন</Button>
        ) : null}

        <Card title="সদস্য" sub={`${member.no} · ${member.village} · রুট ${member.route}`}
          right={<Badge tone={MEM_STATUS[member.status].tone}>{MEM_STATUS[member.status].t}</Badge>}>
          <div className="text-sm space-y-1">
            <div className="flex justify-between"><span className="text-mut text-xs">মোবাইল</span><span className="num font-bold">{member.mobile}</span></div>
            <div className="flex justify-between"><span className="text-mut text-xs">KYC</span><span className="font-bold">{member.kyc === 'verified' ? 'যাচাইকৃত ✓' : 'অসম্পূর্ণ'}</span></div>
            <div className="flex justify-between"><span className="text-mut text-xs">নমিনি</span><span className="font-bold text-right">{item.nominee}</span></div>
          </div>
          <div className="flex gap-2 mt-3">
            <Button size="sm" variant="ghost" className="grow" onClick={() => navigate(`/a/members/${member.id}${roleQS}`)}>সম্পূর্ণ ৩৬০°</Button>
            {item.kind === 'member' ? (
              <Button size="sm" variant="secondary" onClick={() => navigate(`/a/approvals/${item.id}/review${roleQS}`)}>ডকুমেন্ট যাচাই</Button>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => navigate(`/a/members/${member.id}/edit${roleQS}`)}>সম্পাদনা</Button>
            )}
          </div>
        </Card>

        {isWithdrawal ? (
          <>
            <SectionHead title="কত তোলা যাবে — হিসাব" sub="R-01 সূত্র · একই ইঞ্জিন" />
            <Card>
              <div className="text-sm">
                <div className="flex justify-between py-1.5 border-b border-line-2"><span className="text-mut">জমা হয়েছে (posted)</span><span className="num font-bold">৳{bn(item.posted)}</span></div>
                <div className="flex justify-between py-1.5 border-b border-line-2"><span className="text-mut">− আটক (hold)</span><span className="num font-bold text-danger-ink">৳{bn(item.hold)}</span></div>
                <div className="flex justify-between py-1.5 border-b border-line-2"><span className="text-mut">− সর্বনিম্ন ব্যালেন্স (D-02)</span><span className="num font-bold">৳{bn(item.min)}</span></div>
                <div className="flex justify-between py-1.5 border-b border-line-2"><span className="text-mut">− লক-ইন (D-06)</span><span className="num font-bold">৳{bn(item.locked)}</span></div>
                <div className="flex justify-between py-2 font-extrabold"><span>= তোলার যোগ্য</span><span className="num text-ok-ink">৳{bn(item.avail)}</span></div>
              </div>
              <Note tone={item.amount <= item.avail ? 'ok' : 'danger'}>
                আবেদন ৳{bn(item.amount)} {item.amount <= item.avail ? '≤' : '>'} যোগ্য ৳{bn(item.avail)} — {item.amount <= item.avail ? 'পর্যাপ্ত ✓' : 'অপর্যাপ্ত'}
              </Note>
            </Card>

            <SectionHead title="নীতি যাচাই" sub="সব নিয়ম সার্ভারে চলে — UI শুধু ফল দেখায়" />
            <Card>
              {[
                ['মাসে উত্তোলনের সংখ্যা', '১ম (সীমা ২)', 'ok'],
                ['সর্বোচ্চ পরিমাণ ৳৫০,০০০', item.inLimit ? 'সীমার ভিতরে' : 'ছাড়িয়েছে', item.inLimit ? 'ok' : 'bad'],
                ['maker ≠ checker (BR-04)', 'সদস্য নিজে আবেদন করেছেন — আপনি অনুমোদন করতে পারবেন', 'ok'],
                ['অনুমোদন সীমা (D-22)', `৳${bn(item.amount)} ${item.inLimit ? '≤' : '>'} ৳${bn(50000)}`, item.inLimit ? 'ok' : 'bad'],
                ['বকেয়া কিস্তি', member.status === 'dormant' ? 'বকেয়া আছে — নিষ্পত্তি দরকার (D-09)' : 'নেই', member.status === 'dormant' ? 'warn' : 'ok'],
              ].map(([t, d, tone]) => (
                <Row key={t as string}
                  icon={tone === 'ok' ? <CheckCircle2 size={16} /> : tone === 'warn' ? <Clock size={16} /> : <X size={16} />}
                  title={t as string}
                  sub={d as string}
                  tone={tone === 'ok' ? undefined : (tone as 'warn' | 'danger')}
                />
              ))}
            </Card>

            <SectionHead title="প্রদানের মাধ্যম" />
            <Card>
              <div className="text-sm space-y-1">
                <div className="flex justify-between"><span className="text-mut text-xs">মাধ্যম</span><span className="font-bold">{item.method === 'cash_office' ? 'অফিস কাউন্টার (নগদ)' : CHANNEL_LABEL[item.method]}</span></div>
                <div className="flex justify-between"><span className="text-mut text-xs">কারণ</span><span className="font-bold">{item.reason}</span></div>
                <div className="flex justify-between"><span className="text-mut text-xs">প্রত্যাশিত সময়</span><span className="font-bold">{item.method === 'cash_office' ? 'কাউন্টারে আজই' : 'অনুমোদনের পর ১ ঘণ্টা'}</span></div>
              </div>
              <Note tone="warn">
                ওয়ালেট পেমেন্ট নিশ্চিত না হওয়া পর্যন্ত “সম্পন্ন” নয় — টাকা কেটে গিয়ে না পৌঁছালে অবস্থা <b>Unknown</b> থাকবে (D-27)।
              </Note>
            </Card>
          </>
        ) : (
          <>
            <SectionHead title="যাচাই" sub={item.kind === 'deposit' ? 'রসিদ ও রেফারেন্স মিলিয়ে দেখুন' : item.kind === 'member' ? 'ডকুমেন্ট ও নীতি' : 'প্রভাব ও কারণ'} />
            <Card>
              {item.kind === 'deposit' ? (
                <>
                  <Row icon={<FileText size={16} />} title={`রসিদ ${item.ref}`} sub={`মাধ্যম ${item.method === 'cash_office' ? 'নগদ' : CHANNEL_LABEL[item.method]}`} />
                  <Row icon={<CheckCircle2 size={16} />} title={item.matched === 'auto' ? 'স্বয়ংক্রিয় মিল ✓' : item.matched === 'partial' ? 'আংশিক মিল' : 'মিল পাওয়া যায়নি'} sub={item.note} />
                  <Row icon={<CheckCircle2 size={16} />} title="একই দিনে দ্বিগুণ জমা নেই" sub="সদস্যের সর্বশেষ লেনদেন যাচাই" />
                </>
              ) : null}
              {item.kind === 'member' ? (
                <>
                  <Row icon={<FileText size={16} />} title="NID ও ছবি" sub={item.evidence ? 'স্পষ্ট ও মিলেছে ✓' : 'অস্পষ্ট — আবার তুলতে বলুন'} tone={item.evidence ? undefined : 'warn'} />
                  <Row icon={<CheckCircle2 size={16} />} title="বয়স ≥ ১৮" sub="NID অনুযায়ী" />
                  <Row icon={<CheckCircle2 size={16} />} title="এক NID = এক সদস্য" sub="ডুপ্লিকেট মেলেনি ✓" />
                  <Row icon={<FileText size={16} />} title="প্রথম জমা" sub={`৳${bn(item.amount)} — স্কিমের ন্যূনতম পূরণ`} />
                </>
              ) : null}
              {item.kind === 'correction' ? (
                <>
                  <Row icon={<Minus size={16} />} title="রিভার্সাল প্রভাবে ব্যালেন্স কমবে" sub="মূল এন্ট্রি মুছবে না, ইতিহাস অক্ষত" tone="warn" />
                  <Row icon={<Clock size={16} />} title="একই দিনে নিষ্পত্তি করুন" sub="দিনশেষের পরে সংশোধন মানে নতুন পিরিয়ড সমন্বয়" />
                </>
              ) : null}
            </Card>
          </>
        )}

        <SectionHead title="সিদ্ধান্ত" sub="D-26 · কমানো যাবে, বাড়ানো যাবে না" />
        <Card>
          {isWithdrawal ? (
            <Stepper steps={['কারণ', 'ব্যাখ্যা', 'OTP ও নিশ্চিত']} cur={1} />
          ) : null}
          <div className="space-y-3 mt-3">
            <Field label="আংশিক অনুমোদনের অঙ্ক" hint={`সর্বোচ্চ ৳${bn(item.amount)} — এর কম দিলে সদস্যকে SMS যাবে`}>
              {(fid) => (
                <input id={fid} inputMode="numeric" value={partial} placeholder={`যেমন ${Math.floor(item.amount / 2)}`}
                  onChange={(e) => setPartial(e.target.value ? Number(e.target.value.replace(/\D/g, '')) : '')}
                  className={inputClass() + ' num'} />
              )}
            </Field>
            <Field label="প্রত্যাখ্যান / মন্তব্যের কারণ" hint="এই লেখা অডিট লগে যাবে">
              {(fid) => (
                <textarea id={fid} rows={2} value={reason} onChange={(e) => setReason(e.target.value)}
                  placeholder="যেমন: নোটিশ পিরিয়ড বাকি — ৬ নভেম্বরের পরে আবেদন করুন"
                  className={inputClass() + ' py-2'} />
              )}
            </Field>
            <Field label="OTP (প্রত্যাখ্যানে বাধ্যতামূলক)" hint="ডেমো: ৪৭১৯০২">
              {(fid) => (
                <input id={fid} inputMode="numeric" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className={inputClass() + ' num tracking-[6px] text-center font-extrabold'} />
              )}
            </Field>
          </div>
        </Card>

        <Note tone="info">
          <b>অপরিবর্তনীয়</b> — সিদ্ধান্তের পর বদলানো যাবে না; সংশোধন মানে রিভার্সাল (AM-14) এবং সবকিছু অডিট লগে যাবে।
        </Note>
        <div className="flex items-center gap-2 text-xs text-mut justify-center">
          <Lock size={13} /> maker ≠ checker · সীমা D-22 · OTP ছাড়া প্রত্যাখ্যান নয়
        </div>
      </div>

      <DecisionBar note={<span><b>৳{bn(item.amount)}</b> · যোগ্য ৳{bn(item.avail)}</span>}>
        <Button size="sm" variant="ghost" icon={<Minus size={14} />} onClick={() => act('partial')} disabled={!isWithdrawal || Boolean(done)}>কমান</Button>
        <Button size="sm" variant="ghost" icon={<Send size={14} />} onClick={() => act('escalate')} disabled={Boolean(done)}>এসকেলেট</Button>
        <Button size="sm" variant="danger" icon={<X size={14} />} onClick={() => act('reject')} disabled={Boolean(done)}>প্রত্যাখ্যান</Button>
        <Button size="sm" icon={<Check size={14} />} onClick={() => act('approve')} disabled={Boolean(done)}>অনুমোদন</Button>
      </DecisionBar>
    </div>
  );
}
