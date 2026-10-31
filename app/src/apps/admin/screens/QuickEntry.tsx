/* ============================================================
   src/apps/admin/screens/QuickEntry.tsx — AM-06 দ্রুত জমা এন্ট্রি
   সদস্য → অ্যাকাউন্ট → অঙ্ক → মাধ্যম ও রেফারেন্স → রসিদ (লাইভ)।
   অফলাইন-প্রথম নোট, ভ্যালিডেশন ও ডুপ্লিকেট সতর্কতা সহ।
   ============================================================ */

import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Banknote, CheckCircle2, User, WifiOff } from 'lucide-react';
import { Badge, Button, Card, DecisionBar, SectionHead } from '../../../components/ui';
import { ErrorBanner, Field, SuccessBanner, inputClass } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import { accountById, accountsOf, CHANNEL_LABEL, memberById, type Channel } from '../../../domain/admin';
import { Note, Stepper } from './parts';

const CHANNELS: Channel[] = ['cash', 'bkash', 'nagad', 'bank'];

export default function QuickEntry() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { state, addDeposit } = useAdmin();
  const preMember = params.get('member') ?? undefined;
  const preAcc = params.get('account') ?? undefined;
  const member = memberById(state.members, preMember ?? 'm1')!;
  const accs = accountsOf(state.accounts, member.id);
  const [accId, setAccId] = useState(preAcc ?? accs[0]?.id ?? '');
  const acc = accountById(state.accounts, accId);
  const [amount, setAmount] = useState<number | ''>(acc?.installment ?? 0);
  const [channel, setChannel] = useState<Channel>('cash');
  const [reference, setReference] = useState('');
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<{ no: string; amount: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const roleQS = params.get('role') ? `?role=${params.get('role')}` : '';

  const duplicate = useMemo(() => {
    if (!acc) return false;
    return state.txns.some((t) => t.accId === acc.id && t.amount === amount && t.type === 'deposit' && t.date === '2026-10-31');
  }, [state.txns, acc, amount]);

  function submit() {
    setError('');
    if (!acc) { setError('অ্যাকাউন্ট বাছাই করুন'); return; }
    if (!amount || amount < 1) { setError('সঠিক অঙ্ক লিখুন'); return; }
    if (amount > 50000) { setError('এক এন্ট্রিতে সর্বোচ্চ ৳৫০,০০০ — বেশি হলে ভাগ করুন'); return; }
    if (channel !== 'cash' && reference.trim().length < 4) { setError('ওয়ালেট/ব্যাংকে ট্রানজেকশন রেফারেন্স দিন'); return; }
    setBusy(true);
    const r = addDeposit({ accountId: acc.id, amount, channel, reference: reference.trim() || 'নগদ কাউন্টার' });
    setBusy(false);
    if (!r.ok) { setError(r.message); return; }
    setReceipt({ no: r.receipt, amount });
  }

  if (receipt) {
    return (
      <div className="p-4 space-y-4 pb-6">
        <SuccessBanner title="জমা পোস্ট হয়েছে">৳{bn(receipt.amount)} · {member.name} · রসিদ {receipt.no}</SuccessBanner>
        <Card title="রসিদ" sub={receipt.no}>
          <div className="text-sm space-y-1">
            <div className="flex justify-between"><span className="text-mut text-xs">সদস্য</span><span className="font-bold">{member.name} · {member.no}</span></div>
            <div className="flex justify-between"><span className="text-mut text-xs">অ্যাকাউন্ট</span><span className="font-bold">{acc?.scheme} · {acc?.no}</span></div>
            <div className="flex justify-between"><span className="text-mut text-xs">অঙ্ক</span><span className="num font-extrabold">৳{bn(receipt.amount)}</span></div>
            <div className="flex justify-between"><span className="text-mut text-xs">মাধ্যম</span><span className="font-bold">{CHANNEL_LABEL[channel]}</span></div>
            <div className="flex justify-between"><span className="text-mut text-xs">রেফারেন্স</span><span className="num font-bold">{reference || 'নগদ কাউন্টার'}</span></div>
          </div>
          <p className="text-xs text-mut mt-2">রসিদ নম্বর পুনর্ব্যবহার হয় না — যাচাই করতে S-07 ব্যবহার করুন।</p>
        </Card>
        <div className="flex gap-2">
          <Button className="grow" icon={<CheckCircle2 size={15} />} onClick={() => { setReceipt(null); setAmount(acc?.installment ?? 0); setReference(''); }}>
            আরেকটি জমা
          </Button>
          <Button variant="secondary" className="grow" onClick={() => navigate(`/a/members/${member.id}${roleQS}`)}>৩৬০°</Button>
        </div>
        <Button variant="ghost" block onClick={() => navigate('/verify')}>রসিদ যাচাই</Button>
        <div className="flex items-center justify-center gap-1.5 text-xs text-mut"><WifiOff size={13} /> অফলাইনে থাকলে এন্ট্রি কিউতে যেত — এখানে ডেমো পোস্ট</div>
      </div>
    );
  }

  return (
    <div className="pb-2">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-h2 text-txt">জমা এন্ট্রি</h2>
          <Button size="sm" variant="ghost" icon={<WifiOff size={14} />} onClick={() => navigate('/sync')}>sync</Button>
        </div>

        <Note tone="warn">
          <b>ডেমো এন্ট্রি</b> — অফলাইনে থাকলে এন্ট্রি ডিভাইসে সংরক্ষিত হবে, সংযোগ পেলে sync হবে (D-18)।
        </Note>

        <Card>
          <Stepper steps={['সদস্য', 'পরিমাণ', 'মাধ্যম ও রসিদ']} cur={1} />
        </Card>

        <SectionHead title="কোন অ্যাকাউন্টে" sub={`${bn(accs.length)}টি অ্যাকাউন্ট`} />
        <Card>
          {accs.map((a) => (
            <button key={a.id} type="button" onClick={() => { setAccId(a.id); setAmount(a.installment); }}
              className={`w-full min-h-tap text-left flex items-center gap-2 py-2.5 border-b border-line-2 last:border-b-0 ${accId === a.id ? '' : 'opacity-80'}`}>
              <span className={`w-8 h-8 grid place-items-center rounded-r-pill ${accId === a.id ? 'bg-green-100 text-green-800' : 'bg-card-2 text-mut'}`}>
                <Banknote size={16} />
              </span>
              <span className="grow min-w-0">
                <span className="block text-sm font-bold truncate">{a.scheme}</span>
                <span className="block text-xs text-mut num">{a.no} · কিস্তি ৳{bn(a.installment)} · জমা ৳{bn(a.posted)}</span>
              </span>
              {accId === a.id ? <Badge tone="ok">নির্বাচিত</Badge> : null}
            </button>
          ))}
        </Card>

        <SectionHead title="অঙ্ক" sub="কিস্তির কম নয় — বেশি হলে পরের কিস্তিতে যোগ হবে" />
        <Card>
          {error ? <ErrorBanner>{error}</ErrorBanner> : null}
          <Field label="জমার অঙ্ক" required hint="বাংলা বা ইংরেজি 숫자 — দুটোই গ্রহণযোগ্য">
            {(fid) => (
              <input id={fid} inputMode="numeric" value={amount}
                onChange={(e) => setAmount(e.target.value ? Number(e.target.value.replace(/\D/g, '')) : '')}
                className={inputClass() + ' num text-h2 font-extrabold text-center'} />
            )}
          </Field>
          <div className="flex gap-2 mt-2">
            {[acc?.installment ?? 0, (acc?.installment ?? 0) * 2, 5000].map((v, i) => (
              <Button key={i} size="sm" variant="secondary" className="grow" onClick={() => setAmount(v)}>৳{bn(v)}</Button>
            ))}
          </div>
          {duplicate ? (
            <Note tone="warn">
              <b>একই অঙ্কে আজ আরেকটি জমা আছে</b> — দ্বিগুণ এন্ট্রি নয় তো? রসিদ মিলিয়ে দেখুন।
            </Note>
          ) : null}
        </Card>

        <SectionHead title="মাধ্যম ও রেফারেন্স" />
        <Card>
          <div className="grid grid-cols-2 gap-2">
            {CHANNELS.map((ch) => (
              <button key={ch} type="button" onClick={() => setChannel(ch)}
                className={`min-h-tap rounded-r-sm border px-3 py-2 text-left text-sm font-bold ${channel === ch ? 'border-green-700 bg-green-050 text-green-800' : 'border-line bg-card text-txt-2'}`}>
                {CHANNEL_LABEL[ch]}
              </button>
            ))}
          </div>
          <div className="mt-3">
            <Field label="রেফারেন্স / রসিদ নম্বর" hint={channel === 'cash' ? 'নগদে খালি রাখলে “নগদ কাউন্টার” বসবে' : 'ওয়ালেট/ব্যাংকে বাধ্যতামূলক'}>
              {(fid) => (
                <input id={fid} value={reference} onChange={(e) => setReference(e.target.value)}
                  placeholder={channel === 'cash' ? 'ঐচ্ছিক' : 'যেমন TXN-৯৯২১'} className={inputClass() + ' num'} />
              )}
            </Field>
          </div>
        </Card>

        <Note tone="info">
          <b>সদস্য ও রসিদ</b> — জমা পোস্ট হলে সদস্যের অ্যাপে ও SMS-এ রসিদ যাবে, এবং AML/অডিট লগে কে-কখন-কোথা থেকে লিখেছেন তা থাকবে।
        </Note>
        <div className="flex items-center justify-center gap-1.5 text-xs text-mut"><User size={13} /> {member.name} · {member.mobile}</div>
      </div>

      <DecisionBar note={<span>জমা ৳{bn(typeof amount === 'number' ? amount : 0)} · {CHANNEL_LABEL[channel]}</span>}>
        <Button size="sm" variant="ghost" onClick={() => navigate(`/a/members${roleQS}`)}>বাতিল</Button>
        <Button size="sm" icon={<CheckCircle2 size={15} />} onClick={submit} disabled={busy}>জমা পোস্ট করুন</Button>
      </DecisionBar>
    </div>
  );
}
