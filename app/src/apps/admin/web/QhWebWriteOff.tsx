import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Card } from '../../../components/ui';
import { inputCls } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdminQh } from '../../../store/adminQardStore';
import { qhOutstanding, qhArrearsOf } from '../../../domain/adminQard';
import { Note, Page, StatBar } from './webParts';
import { QhCallout, memName } from './qhParts';

export default function QhWebWriteOff() {
  const { state, proposeWriteOff, approveWriteOff } = useAdminQh();
  const nav = useNavigate();
  const candidates = state.loans.filter((l) => l.status === 'arrears');
  const [loan, setLoan] = useState(candidates[0]?.id ?? '');
  const [amount, setAmount] = useState(String(candidates[0] ? qhOutstanding(candidates[0], state.repayments, state.writeoffs) : ''));
  const [reason, setReason] = useState('');
  const [committee, setCommittee] = useState('');
  const [approver, setApprover] = useState('কামরুল হাসান (সমিতি প্রশাসক)');
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  const act = (r: { ok: boolean; message: string }) => { if (!r.ok) { setErr(r.message); setMsg(''); } else { setErr(''); setMsg(r.message); } };
  const proposed = state.writeoffs.filter((w) => w.status === 'proposed');
  const done = state.writeoffs.filter((w) => w.status === 'done');
  const selLoan = state.loans.find((l) => l.id === loan);

  return (
    <Page title="Write-off ব্যবস্থাপনা" sub="আদায়ের সব চেষ্টা ব্যর্থ হলে · ORG_ADMIN অনুমোদন · নিরীক্ষক অ্যালার্ট (BR-23)"
      back="/w/qh" right={<Button size="sm" variant="secondary" onClick={() => nav('/w/qh/arrears')}>বকেয়া তালিকা</Button>}>
      {err && <Note tone="warn">{err}</Note>}
      {msg && <Note tone="ok">{msg}</Note>}
      <StatBar items={[
        { k: 'বিচারাধীন', v: bn(proposed.length), tone: proposed.length ? 'warn' : 'ok' },
        { k: 'অনুমোদিত', v: bn(done.length), tone: 'neutral' },
        { k: 'প্রস্তাবিত অঙ্ক', v: `৳${bn(proposed.reduce((n, w) => n + w.amount, 0))}` },
        { k: 'সুদ / ফি', v: '৳০', tone: 'ok' },
      ]} />
      <QhCallout title="write-off = ক্ষতি, ঋণ মাফ নয়" tone="danger">
        অনুমোদিত হলে দায় মেটেনি — খাতায় ক্ষতি হিসেবে দৃশ্যমান থাকে, নিরীক্ষক অ্যালার্ট যায়। কারণ ছাড়া বা কমিটি ছাড়া প্রস্তাব গ্রহণযোগ্য নয়; বিকল্প হিসেবে পুনর্গঠন আগে বিবেচনা করুন (D-44)।
      </QhCallout>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-3">
          <Card title="বিচারাধীন প্রস্তাব" sub="প্রস্তাবকারী নিজে অনুমোদন করতে পারবেন না (BR-22)">
            {proposed.length === 0 && <p className="text-sm text-mut">কোনো বিচারাধীন write-off নেই ✅</p>}
            {proposed.map((w) => (
              <div key={w.id} className="rounded-r-sm border border-warn-bd bg-warn-bg/40 p-3 mb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <b className="grow">{w.no} · ৳{bn(w.amount)}</b>
                  <Badge tone="warn">বিচারাধীন</Badge>
                </div>
                <p className="text-sm mt-1">{w.reason}</p>
                <p className="text-xs text-mut mt-1">ঋণ {state.loans.find((l) => l.id === w.loan)?.no ?? w.loan} · কমিটি {w.committee} · প্রস্তাবকারী {w.by}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <select value={approver} onChange={(e) => setApprover(e.target.value)} className={`${inputCls} min-h-9 max-w-64 text-sm`}>
                    {['কামরুল হাসান (সমিতি প্রশাসক)', 'নাসরিন আক্তার (অনুমোদনকারী)', 'মোঃ আব্দুল্লাহ (ব্যবস্থাপক)'].map((x) => <option key={x}>{x}</option>)}
                  </select>
                  <Button size="sm" onClick={() => act(approveWriteOff(w.id, approver))}>অনুমোদন ও নিরীক্ষক অ্যালার্ট</Button>
                </div>
              </div>
            ))}
          </Card>

          <Card title="write-off রেজিস্টার" sub="সব প্রস্তাব · অপরিবর্তনীয়">
            {state.writeoffs.map((w) => (
              <div key={w.id} className="flex flex-wrap items-center gap-2 py-2 border-b border-line-2 last:border-0 text-sm">
                <b className="num">{w.no}</b>
                <span className="text-mut grow">{state.loans.find((l) => l.id === w.loan)?.no} · ৳{bn(w.amount)}</span>
                <Badge tone={w.status === 'done' ? 'neutral' : 'warn'}>{w.status === 'done' ? 'অনুমোদিত · ক্ষতি' : 'বিচারাধীন'}</Badge>
                <span className="text-xs text-mut w-full">{w.reason} · {w.committee} · {w.approvedBy ?? 'অনুমোদন বাকি'}</span>
              </div>
            ))}
          </Card>
        </div>

        <div className="space-y-3">
          <Card title="নতুন প্রস্তাব" sub="শুধু বকেয়া ঋণের জন্য">
            <div className="space-y-2">
              <label className="block"><span className="text-sm font-bold">ঋণ</span>
                <select value={loan} onChange={(e) => { setLoan(e.target.value); const l = state.loans.find((x) => x.id === e.target.value); setAmount(String(l ? qhOutstanding(l, state.repayments, state.writeoffs) : '')); }} className={`${inputCls} mt-1`}>
                  <option value="">— বাছাই —</option>
                  {candidates.map((l) => <option key={l.id} value={l.id}>{l.no} · {memName(l.memberId)} · বকেয়া ৳{bn(qhArrearsOf(l, state.repayments))}</option>)}
                </select>
              </label>
              {selLoan && <p className="text-xs text-mut">বাকি মূলধন ৳{bn(qhOutstanding(selLoan, state.repayments, state.writeoffs))} · বকেয়া ৳{bn(qhArrearsOf(selLoan, state.repayments))}</p>}
              <label className="block"><span className="text-sm font-bold">দাবির অঙ্ক (৳)</span>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className={`${inputCls} mt-1 num`} />
              </label>
              <label className="block"><span className="text-sm font-bold">কারণ (১০+ অক্ষর)</span>
                <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="আদায়ের চেষ্টা, সদস্যের অবস্থা, সম্পদের অনুপস্থিতি" className={`${inputCls} mt-1 py-2`} />
              </label>
              <label className="block"><span className="text-sm font-bold">কমিটি রেফারেন্স</span>
                <input value={committee} onChange={(e) => setCommittee(e.target.value)} placeholder="CM-YYMM-##" className={`${inputCls} mt-1`} />
              </label>
              <Button block onClick={() => act(proposeWriteOff(loan, Number(amount), reason, committee))} disabled={!candidates.length}>প্রস্তাব সংরক্ষণ</Button>
              <p className="text-xs text-mut">প্রস্তাব অনুমোদনের আগে ঋণ সক্রিয় থাকে; অনুমোদনের পর নিরীক্ষক অ্যালার্ট যায়।</p>
            </div>
          </Card>
          <Note>কোনো সুদ বা অতিরিক্ত চার্জ মাফ করার প্রশ্নই নেই — write-off শুধু মূলধনের আদায়-অক্ষমতা।</Note>
        </div>
      </div>
    </Page>
  );
}
