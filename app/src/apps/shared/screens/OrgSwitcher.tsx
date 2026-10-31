/* ============================================================
   src/apps/shared/screens/OrgSwitcher.tsx — S-02 সমিতি নির্বাচন
   একাধিক সমিতির সদস্য হলে কোনটির হিসাব দেখছেন তা বেছে নিতে হয়;
   নির্বাচন করলে সেশন বদলে হোমে যায়। ইনভাইট কোড দিয়ে যোগদানের অনুরোধও কাজ করে।
   ============================================================ */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Check, ChevronRight, Info, LogOut, Send, ShieldCheck } from 'lucide-react';
import { Badge, Button, Card } from '../../../components/ui';
import { Field, SuccessBanner, inputClass } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { SharedShell } from '../../../components/shell/SharedShell';
import { useSession } from '../../../store/sessionStore';

export default function OrgSwitcher() {
  const navigate = useNavigate();
  const { orgs, org, switchOrg, inviteSent, sendInvite, logout } = useSession();
  const [picked, setPicked] = useState(org.id);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function enter() {
    switchOrg(picked);
    navigate('/m/home', { replace: true });
  }

  async function invite() {
    if (code.trim().length < 4) {
      setError('কমপক্ষে ৪ অক্ষরের ইনভাইট কোড দিন');
      return;
    }
    setError('');
    setBusy(true);
    await sendInvite(code.trim());
    setBusy(false);
  }

  return (
    <SharedShell
      title="আমার সমিতিসমূহ"
      sub={`${bn(orgs.length)}টি সমিতিতে আপনার সদস্যপদ আছে`}
      onBack={() => navigate('/login')}
      plain
      right={
        <button type="button" onClick={() => { logout(); navigate('/login', { replace: true }); }} aria-label="লগআউট" className="w-11 h-11 grid place-items-center rounded-r-sm hover:bg-card-2">
          <LogOut size={19} className="text-mut" />
        </button>
      }
    >
      <div className="rounded-r-sm bg-info-bg border border-info-bd text-info-ink px-3 py-2.5 text-xs flex gap-2">
        <Info size={15} className="mt-0.5 shrink-0" />
        <span>
          <b>কোন সমিতির হিসাব দেখছেন তা সবসময় উপরে লেখা থাকবে</b> — একাধিক সমিতির ব্যালান্স মিশে যাওয়ার ঝুঁকি এড়াতে।
        </span>
      </div>

      {inviteSent ? <SuccessBanner title="অনুরোধ পাঠানো হয়েছে">ইনভাইট কোড যাচাইয়ের অপেক্ষায় আছে — অনুমোদনের পর তালিকায় যুক্ত হবে।</SuccessBanner> : null}

      <div className="space-y-3">
        {orgs.map((o) => {
          const on = picked === o.id;
          return (
            <div key={o.id} className={`rounded-r-md border bg-card overflow-hidden shadow-sh-1 ${on ? 'border-green-700 ring-1 ring-green-700/20' : 'border-line'}`}>
              <button type="button" onClick={() => setPicked(o.id)} className="w-full min-h-tap text-left px-4 pt-3.5 pb-3 flex gap-3">
                <span className={`mt-1 w-5 h-5 rounded-r-pill border-2 grid place-items-center shrink-0 ${on ? 'border-green-700 bg-green-700 text-white' : 'border-line-3'}`}>
                  {on ? <Check size={12} /> : null}
                </span>
                <span className="grow min-w-0">
                  <span className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-txt">{o.name}</span>
                    {o.id === org.id ? <Badge tone="ok">বর্তমান</Badge> : null}
                  </span>
                  <span className="block text-xs text-mut mt-1">
                    নিবন্ধন {o.reg} · {o.area}
                  </span>
                  <span className="inline-flex items-center gap-1 mt-2 text-[11px] font-bold text-info-ink bg-info-bg border border-info-bd rounded-r-pill px-2 py-0.5">
                    <ShieldCheck size={11} /> আপনার ভূমিকা: {o.role}
                  </span>
                  <span className="mt-2.5 flex items-end justify-between gap-2">
                    <span>
                      <span className="block text-[11px] text-mut">মোট সঞ্চয়</span>
                      <span className="num block font-extrabold text-txt">৳{bn(o.saving)}</span>
                    </span>
                    <span className="text-right">
                      <span className="block text-[11px] text-mut">সর্বশেষ ব্যবহার</span>
                      <span className="block text-sm font-bold text-txt">{o.lastUsed}</span>
                    </span>
                  </span>
                </span>
              </button>
              <div className="border-t border-line-2 px-4 py-1.5">
                <button
                  type="button"
                  onClick={() => { switchOrg(o.id); navigate('/m/home', { replace: true }); }}
                  className="min-h-tap inline-flex items-center gap-1 text-sm font-bold text-green-700"
                >
                  এই সমিতিতে প্রবেশ <ChevronRight size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <Card title="নতুন সমিতিতে যোগ দিন" sub="সমিতির দেওয়া ইনভাইট কোড থাকলে দিন">
        <Field label="ইনভাইট কোড" error={error} hint="কোড সমিতির নোটিশ বোর্ডে বা SMS-এ পাওয়া যাবে">
          {(id) => (
            <input
              id={id}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="RSS-২৬২৭"
              className={inputClass(error) + ' tracking-wider font-bold'}
            />
          )}
        </Field>
        <Button block variant="secondary" className="mt-2" icon={<Send size={15} />} onClick={invite} disabled={busy}>
          {busy ? 'পাঠানো হচ্ছে…' : 'যোগদানের অনুরোধ পাঠান'}
        </Button>
      </Card>

      <Card title="একটি সমিতি থাকলে এই পেজ আসবে না" sub="অপ্রয়োজনীয় ধাপ এড়ানো হয়">
        <p className="text-sm text-txt-2">
          শুধু এক সমিতির সদস্য হলে লগইনের পর সরাসরি হোমে চলে যাবেন। এখানে আপনি{' '}
          <b>{bn(orgs.length)}</b>টি সমিতির সদস্য, তাই বাছাই দরকার।
        </p>
      </Card>

      <Button block icon={<Building2 size={16} />} onClick={enter}>
        {orgs.find((o) => o.id === picked)?.name ?? 'সমিতি'} — প্রবেশ করুন
      </Button>
      <Button block variant="ghost" icon={<LogOut size={16} />} onClick={() => { logout(); navigate('/login', { replace: true }); }}>
        লগআউট
      </Button>
    </SharedShell>
  );
}
