/* S-11 · সমিতিতে যোগদান (কোড/স্লাগ) — আমন্ত্রণ কোড, সমিতি বাছাই ও যোগদান */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Card } from '../../../components/ui';
import { ErrorBanner, Field, inputClass } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useSession } from '../../../store/sessionStore';

export default function JoinOrg() {
  const navigate = useNavigate();
  const { orgs, org, sendInvite, inviteSent, inviteCode, switchOrg } = useSession();
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function join() {
    setError(''); setMsg('');
    const c = code.trim().toUpperCase();
    if (!/^[A-Z0-9-]{5,12}$/.test(c)) { setError('কোড ৫–১২ অক্ষর/অঙ্কে হতে হবে (যেমন: KESB-2026)'); return; }
    setBusy(true);
    await sendInvite(c);
    setBusy(false);
    setMsg(`কোড ${c} যাচাই হয়েছে — সমিতি বেছে নিয়ে যোগদানের অনুরোধ পাঠান (ডেমো)`);
  }

  async function requestJoin(id: string) {
    switchOrg(id);
    setMsg('যোগদানের অনুরোধ পাঠানো হয়েছে — সদস্য অনুমোদনের অপেক্ষায় (ডেমো)');
  }

  return (
    <div className="p-4 space-y-4">
      <div>
        <div className="text-h1 font-extrabold text-txt">সমিতিতে যোগ দিন</div>
        <p className="text-sm text-mut mt-1">আমন্ত্রণ কোড বা স্লাগ দিয়ে সংস্থা খুঁজুন · ডেমো</p>
      </div>

      {error && <ErrorBanner>{error}</ErrorBanner>}
      {msg && <div className="rounded-r-sm border border-ok-bd bg-ok-bg text-ok-ink px-3 py-2 text-sm">{msg}</div>}

      <Card title="আমন্ত্রণ কোড" sub="সংস্থা থেকে পাওয়া কোড লিখুন">
        <Field label="কোড / স্লাগ" required hint="যেমন: KESB-2026 বা keshabpur">
          {(id) => <input id={id} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className={`${inputClass} num`} placeholder="KESB-2026" />}
        </Field>
        <Button block className="mt-3" onClick={join} disabled={busy}>{busy ? 'যাচাই হচ্ছে…' : 'কোড যাচাই করুন'}</Button>
        {inviteSent && <p className="text-xs text-mut mt-2">সর্বশেষ যাচাই: <b className="num">{inviteCode}</b> — ডেমো ফল, বাস্তব সংস্থা নয়।</p>}
      </Card>

      <Card title="আমার সংস্থা" sub="যোগদানের অনুরোধ পাঠাতে সমিতি বাছুন">
        <div className="space-y-2">
          {orgs.map((o) => (
            <div key={o.id} className={`rounded-r-sm border px-3 py-2.5 ${o.id === org.id ? 'border-green-700 bg-green-050' : 'border-line-3 bg-card'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-bold text-sm truncate">{o.name}</div>
                  <div className="text-xs text-mut">নিবন্ধন <span className="num">{o.reg}</span> · {o.area}</div>
                  <div className="text-xs text-mut mt-0.5">সঞ্চয় <b className="num">৳{bn(o.saving)}</b> · শেষ ব্যবহার {o.lastUsed}</div>
                </div>
                {o.id === org.id ? <Badge tone="ok">সক্রিয়</Badge> : <Button size="sm" variant="secondary" onClick={() => requestJoin(o.id)}>যোগ দিন</Button>}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="কোড নেই?">
        <p className="text-sm text-txt-2">সংস্থার অফিস বা সংগ্রহকের কাছ থেকে আমন্ত্রণ কোড নিন। কোড ছাড়া যোগদানের অনুরোধ পাঠানো যাবে না।</p>
        <Button block variant="secondary" className="mt-3" onClick={() => navigate('/m/help')}>সহায়তা নিন</Button>
      </Card>

      <p className="text-[11px] text-mut text-center">ডেমো — কোনো বাস্তব সংস্থায় যোগদান হয় না; তথ্য মেমোরিতে থাকে।</p>
    </div>
  );
}
