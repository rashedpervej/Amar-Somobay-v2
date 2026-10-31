/* ============================================================
   src/apps/shared/screens/Forbidden.tsx — S-05 অনুমতি প্রত্যাখ্যান (403)
   শুধু "403" নয় — আপনার ভূমিকা, কী অনুমতি লাগবে, কার কাছে চাইবেন ও বিকল্প পথ।
   ============================================================ */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Home, Lock, Phone, Send, X } from 'lucide-react';
import { Badge, Button, Card } from '../../../components/ui';
import { SuccessBanner } from '../../../components/form';
import { SharedShell } from '../../../components/shell/SharedShell';
import { useSession } from '../../../store/sessionStore';

const PERMS: [string, boolean][] = [
  ['স্কিম পড়া', true],
  ['স্কিম প্রস্তাব', true],
  ['স্কিম চালু', false],
];

export default function Forbidden() {
  const navigate = useNavigate();
  const { org } = useSession();
  const [sent, setSent] = useState(false);
  const [draft, setDraft] = useState(false);

  return (
    <SharedShell title="অনুমতি নেই" sub="403 · নতুন স্কিম চালু" onBack={() => navigate(-1)} plain>
      {sent ? <SuccessBanner title="অনুরোধ পাঠানো হয়েছে">APPROVER-কে অনুমতির অনুরোধ পাঠানো হয়েছে — সিদ্ধান্ত এলে নোটিফিকেশন পাবেন।</SuccessBanner> : null}
      {draft ? <SuccessBanner title="খসড়া সংরক্ষিত">কাজ হারায়নি — অনুমোদনের পর চালু করা যাবে।</SuccessBanner> : null}

      <div className="rounded-r-md bg-card border border-line shadow-sh-1 p-5 text-center">
        <div className="w-20 h-20 rounded-r-lg bg-info-bg text-info-ink grid place-items-center mx-auto">
          <Lock size={34} />
        </div>
        <h2 className="text-h2 font-extrabold text-txt mt-3">আপনার এই কাজটির অনুমতি নেই</h2>
        <p className="text-sm text-txt-2 mt-2 leading-relaxed">
          আপনি নতুন সঞ্চয় স্কিম তৈরি করতে চেয়েছেন। আপনার বর্তমান ভূমিকায় স্কিম <b>পড়া ও প্রস্তাব করা</b> যায়,
          কিন্তু <b>চালু করা</b> যায় না।
        </p>
      </div>

      <Card title="আপনার ভূমিকা" sub={org.name}>
        <div className="flex items-center gap-2">
          <span className="w-10 h-10 rounded-r-pill bg-green-100 text-green-800 grid place-items-center font-extrabold">স</span>
          <div>
            <div className="font-bold text-txt">সাবিনা ইয়াসমিন</div>
            <div className="text-xs text-mut">
              {org.role} · {org.reg}
            </div>
          </div>
        </div>
        <div className="mt-3 divide-y divide-line-2">
          {PERMS.map(([label, ok]) => (
            <div key={label} className="flex items-center justify-between py-2 text-sm">
              <span className="text-mut">{label}</span>
              <span className={`inline-flex items-center gap-1 font-bold ${ok ? 'text-ok' : 'text-danger'}`}>
                {ok ? <Check size={15} /> : <X size={15} />} {ok ? 'আছে' : 'নেই'}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <Card title="কী দরকার" sub="কার কাছে চাইবেন" right={<Badge tone="warn">APPROVER</Badge>}>
        <p className="text-sm text-txt-2">
          স্কিম চালু করা একটি নীতিগত সিদ্ধান্ত — কমিটির লিখিত সিদ্ধান্তসহ <b>APPROVER</b> অনুমোদন লাগে।
        </p>
        <div className="mt-2 text-sm text-txt-2 space-y-1">
          <div>কার কাছে: <b>কাজী নুরুন্নবী (APPROVER)</b></div>
          <div>অথবা: <b>সমিতির সভাপতি / সচিব</b></div>
        </div>
      </Card>

      <Card title="বিকল্প পথ">
        <div className="space-y-2">
          <Button block variant="secondary" onClick={() => setDraft(true)}>খসড়া হিসেবে সংরক্ষণ করুন</Button>
          <Button block variant="secondary" icon={<Send size={15} />} onClick={() => setSent(true)}>অনুমোদনের জন্য পাঠান</Button>
          <a href="tel:+8801700000000" className="min-h-tap w-full rounded-r-sm border border-line-3 bg-card text-txt-2 font-bold text-sm flex items-center justify-center gap-2">
            <Phone size={15} /> APPROVER-কে জানান
          </a>
        </div>
        <p className="text-xs text-mut mt-2">খসড়া সংরক্ষণ করলে কাজ হারাবে না — অনুমোদনের পর চালু করা যাবে।</p>
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <Button icon={<Home size={15} />} onClick={() => navigate('/a/home')}>ড্যাশবোর্ড</Button>
        <Button variant="ghost" onClick={() => navigate('/account')}>অ্যাকাউন্ট</Button>
      </div>
    </SharedShell>
  );
}
