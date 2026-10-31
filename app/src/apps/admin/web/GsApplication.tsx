import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge, Button, Card } from '../../../components/ui';
import { inputCls } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import { Note, Page } from './webParts';

export default function GsApplication() {
  const { appId } = useParams();
  const { state, reviewApplication } = useAdmin();
  const nav = useNavigate();
  const a = state.approvals.find((x) => x.id === appId) ?? state.approvals.find((x) => x.kind === 'member') ?? state.approvals[0];
  const m = state.members.find((x) => x.id === a?.memberId);
  const [comment, setComment] = useState('');
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  const act = (action: 'approve' | 'reject' | 'info') => {
    const r = reviewApplication(a.id, action, comment);
    if (!r.ok) { setErr(r.message); setMsg(''); } else { setErr(''); setMsg(r.message); }
  };
  if (!a) return <Page title="আবেদন" back="/w/members"><Note tone="warn">কোনো আবেদন নেই</Note></Page>;

  return (
    <Page title={`সদস্য আবেদন · ${a.ref}`} sub={`${a.member} · ${a.submitted} · জমা দিয়েছেন ${a.by} · ডেমো`} back="/w/members"
      right={<Button size="sm" variant="secondary" onClick={() => nav('/w/approvals/members')}>সব আবেদন</Button>}>
      {err && <Note tone="warn">{err}</Note>}
      {msg && <Note tone="ok">{msg}</Note>}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-3">
          <Card title="আবেদনের তথ্য" sub="NID ও মোবাইল যাচাই">
            <div className="grid sm:grid-cols-2 gap-2 text-sm">
              <p>নাম: <b>{a.member}</b></p>
              <p>সদস্য আইডি: <b className="num">{a.memberId}</b></p>
              <p>মোবাইল: <b className="num">{m?.mobile ?? '—'}</b></p>
              <p>NID: <b className="num">{m?.nid ?? '—'}</b></p>
              <p>ঠিকানা: <b>{m ? `${m.village}, ${m.union}` : '—'}</b></p>
              <p>প্রাথমিক জমা: <b className="num">৳{bn(a.amount)}</b></p>
            </div>
          </Card>
          <Card title="যাচাই চেকলিস্ট" sub="প্রমাণ ছাড়া অনুমোদন নয়">
            {['NID কপি স্পষ্ট', 'মোবাইল যাচাই', 'ছবি ও স্বাক্ষর', 'নমিনি তথ্য', 'দ্বৈত সদস্যপদ নেই'].map((x, i) => (
              <div key={x} className="flex items-center justify-between py-2 border-b border-line-2 last:border-0 text-sm"><span>{x}</span><Badge tone={i === 4 || a.evidence ? 'ok' : 'warn'}>{i === 4 || a.evidence ? '✓ যাচাই' : 'বাকি'}</Badge></div>
            ))}
          </Card>
        </div>
        <div className="space-y-3">
          <Card title="সিদ্ধান্ত" sub="অনুমোদন / প্রত্যাখ্যান / তথ্য চেয়ে ফেরত">
            <label className="block"><span className="text-sm font-bold">মন্তব্য (প্রত্যাখ্যান/তথ্য চাইলে বাধ্যতামূলক)</span>
              <textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} className={`${inputCls} mt-1 py-2`} /></label>
            <div className="grid gap-2 mt-3">
              <Button onClick={() => act('approve')} disabled={!a.evidence}>অনুমোদন ও সক্রিয় করুন</Button>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" onClick={() => act('info')}>তথ্য চাই</Button>
                <Button variant="danger" onClick={() => act('reject')}>প্রত্যাখ্যান</Button>
              </div>
            </div>
            {!a.evidence && <p className="text-xs text-danger-ink mt-2">প্রমাণ নেই — অনুমোদন বন্ধ। আগে নথি সংগ্রহ করুন।</p>}
          </Card>
          <Note>অনুমোদনের পর সদস্য সক্রিয় ও KYC verified হবে; প্রত্যাখ্যানে কারণ সংরক্ষিত থাকবে।</Note>
        </div>
      </div>
    </Page>
  );
}
