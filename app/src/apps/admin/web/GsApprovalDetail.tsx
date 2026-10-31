import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge, Button, Card } from '../../../components/ui';
import { inputCls } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import { accountsOf, CHANNEL_LABEL } from '../../../domain/admin';
import { Note, Page, StatBar } from './webParts';
import { Field } from './gsParts';

export default function GsApprovalDetail() {
  const { id } = useParams();
  const { state, decide, reviewApplication } = useAdmin();
  const nav = useNavigate();
  const a = state.approvals.find((x) => x.id === id) ?? state.approvals[0];
  const m = state.members.find((x) => x.id === a?.memberId);
  const accs = accountsOf(state.accounts, a?.memberId);
  const [reason, setReason] = useState('');
  const [partial, setPartial] = useState(String(Math.floor((a?.amount ?? 0) / 2)));
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  if (!a) return <Page title="অনুমোদন" back="/w/dashboard"><Note tone="warn">আবেদন পাওয়া যায়নি</Note></Page>;

  const out = (r: { ok: boolean; message: string }) => {
    if (!r.ok) { setErr(r.message); setMsg(''); } else { setErr(''); setMsg(r.message); }
  };
  const act = (action: 'approve' | 'reject' | 'partial' | 'escalate') => {
    if (a.kind === 'member') {
      out(reviewApplication(a.id, action === 'reject' ? 'reject' : action === 'escalate' ? 'info' : 'approve', reason));
    } else {
      out(decide(a.id, action, { amount: Number(partial), reason }));
    }
  };

  return (
    <Page title={`${a.kind === 'withdrawal' ? 'উত্তোলন' : a.kind === 'deposit' ? 'জমা' : a.kind === 'member' ? 'সদস্য' : 'সংশোধন'} সিদ্ধান্ত · ${a.ref}`}
      sub={`${a.member} · ${a.submitted} · ${a.by}`} back={a.kind === 'withdrawal' ? '/w/approvals/withdrawals' : a.kind === 'deposit' ? '/w/approvals/deposits' : a.kind === 'member' ? '/w/approvals/members' : '/w/approvals/corrections'}
      right={<Button size="sm" variant="secondary" onClick={() => nav('/w/approvals/deposits')}>সব কিউ</Button>}>
      {err && <Note tone="warn">{err}</Note>}
      {msg && <Note tone="ok">{msg}</Note>}
      <StatBar items={[
        { k: 'অঙ্ক', v: `৳${bn(a.amount)}` },
        { k: 'অপেক্ষা', v: `${bn(a.hoursAgo)} ঘণ্টা`, tone: a.hoursAgo >= 24 ? 'danger' : undefined },
        { k: 'সীমা', v: a.inLimit ? 'ভেতরে' : 'বাইরে', tone: a.inLimit ? 'ok' : 'danger' },
        { k: 'প্রমাণ', v: a.evidence ? 'সংযুক্ত' : 'বাকি', tone: a.evidence ? 'ok' : 'warn' },
      ]} />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-3">
          <Card title="আবেদনের বিবরণ" sub="তথ্য ও প্রমাণ">
            <div className="grid sm:grid-cols-2 gap-2 text-sm">
              <p>সদস্য: <b>{a.member}</b></p>
              <p>মোবাইল: <b className="num">{m?.mobile ?? '—'}</b></p>
              <p>মাধ্যম: <b>{a.method === 'cash_office' ? 'অফিস নগদ' : CHANNEL_LABEL[a.method]}</b></p>
              <p>জমাকারীর নোট: <b>{a.note || '—'}</b></p>
              <p className="sm:col-span-2">কারণ: <b>{a.reason || '—'}</b></p>
              <p className="sm:col-span-2">নমিনি: <b>{a.nominee || '—'}</b></p>
            </div>
          </Card>
          <Card title="যাচাই" sub="হিসাব ও প্রমাণ">
            <div className="grid sm:grid-cols-2 gap-2">
              {[
                ['প্রমাণ / রসিদ', a.evidence],
                ['সীমার ভেতরে', a.inLimit],
                ['রেফারেন্স মিলেছে', a.matched === 'auto'],
                ['বকেয়া নেই', accs.every((x) => x.missed === 0)],
              ].map(([t, ok]) => (
                <div key={String(t)} className={`rounded-r-sm border px-3 py-2 text-sm ${ok ? 'border-ok-bd bg-ok-bg' : 'border-warn-bd bg-warn-bg'}`}>
                  <b>{ok ? '✓' : '!'} {t}</b>
                </div>
              ))}
            </div>
            {!a.evidence && <p className="text-xs text-danger-ink mt-2">প্রমাণ ছাড়া অনুমোদন করা যাবে না — আগে নথি সংগ্রহ করুন।</p>}
          </Card>
        </div>
        <div className="space-y-3">
          <Card title="সিদ্ধান্ত" sub={a.kind === 'member' ? 'সদস্য নিবন্ধন' : 'Maker ≠ checker · সীমা যাচাই'}>
            <Field label="মন্তব্য / কারণ (প্রত্যাখ্যানে বাধ্যতামূলক)">
              <textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} className={`${inputCls} py-2`} />
            </Field>
            {a.kind !== 'member' && (
              <div className="mt-2"><Field label="আংশিক অনুমোদনের অঙ্ক"><input type="number" value={partial} onChange={(e) => setPartial(e.target.value)} className={`${inputCls} num`} /></Field></div>
            )}
            <div className="grid gap-2 mt-3">
              <Button onClick={() => act('approve')} disabled={!a.evidence || !a.inLimit}>অনুমোদন</Button>
              {a.kind !== 'member' && <Button variant="secondary" onClick={() => act('partial')} disabled={!a.evidence || !a.inLimit}>আংশিক অনুমোদন</Button>}
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" onClick={() => act('escalate')}>APPROVER-এ</Button>
                <Button variant="danger" onClick={() => act('reject')}>প্রত্যাখ্যান</Button>
              </div>
            </div>
            {!a.inLimit && <p className="text-xs text-danger-ink mt-2">সীমা ছাড়িয়েছে — approve বন্ধ; APPROVER-এ escalate করুন (D-22)।</p>}
          </Card>
          <Note>সিদ্ধান্তের পর তালিকা হালনাগাদ হবে; সদস্যকে SMS/নোটিফিকেশন যাওয়ার কথা (ডেমো)।</Note>
        </div>
      </div>
    </Page>
  );
}
