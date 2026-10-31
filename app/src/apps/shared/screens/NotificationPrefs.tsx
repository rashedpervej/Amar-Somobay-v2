/* ============================================================
   src/apps/shared/screens/NotificationPrefs.tsx — S-04 নোটিফিকেশন পছন্দ
   চ্যানেল, শান্ত সময়, সারসংক্ষেপ — প্রতিটি পরিবর্তন সেশনে সংরক্ষিত হয়।
   ============================================================ */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCircle2, MoonStar, Smartphone } from 'lucide-react';
import { Badge, Button, Card, Chip, Chipset } from '../../../components/ui';
import { SuccessBanner, Toggle } from '../../../components/form';
import { SharedShell } from '../../../components/shell/SharedShell';
import { useSession } from '../../../store/sessionStore';

const DIGEST = ['দৈনিক', 'সাপ্তাহিক', 'কখনো নয়'] as const;

export default function NotificationPrefs() {
  const navigate = useNavigate();
  const { prefs, updatePrefs } = useSession();
  const [flash, setFlash] = useState('');

  return (
    <SharedShell
      title="নোটিফিকেশন পছন্দ"
      sub="কীভাবে খবর পেতে চান"
      onBack={() => navigate('/account')}
      plain
      right={<Bell size={18} className="text-mut" />}
    >
      {flash ? <SuccessBanner title="সংরক্ষিত">{flash}</SuccessBanner> : null}

      <Card title="চ্যানেল" sub="যেটি বন্ধ করবেন সেটিতে কিছুই যাবে না">
        <div className="divide-y divide-line-2">
          <Toggle
            checked={prefs.push}
            onChange={(v) => { updatePrefs({ push: v }); setFlash(v ? 'অ্যাপ বার্তা চালু' : 'অ্যাপ বার্তা বন্ধ'); }}
            label="অ্যাপ নোটিফিকেশন"
            sub="জমা, অনুমোদন ও ঘোষণা"
          />
          <Toggle
            checked={prefs.sms}
            onChange={(v) => { updatePrefs({ sms: v }); setFlash(v ? 'SMS চালু' : 'SMS বন্ধ'); }}
            label="SMS"
            sub="মোবাইলে ছোট বার্তা — OTP ও নিরাপত্তা বার্তা সবসময় আসবে"
          />
          <Toggle
            checked={prefs.email}
            onChange={(v) => { updatePrefs({ email: v }); setFlash(v ? 'ইমেইল চালু' : 'ইমেইল বন্ধ'); }}
            label="ইমেইল"
            sub="মাসিক স্টেটমেন্ট ও রসিদের কপি"
          />
        </div>
      </Card>

      <Card title="শান্ত সময়" sub="রাতের অপ্রয়োজনীয় বার্তা বন্ধ" right={<MoonStar size={17} className="text-mut" />}>
        <Toggle
          checked={prefs.quiet}
          onChange={(v) => { updatePrefs({ quiet: v }); setFlash(v ? 'শান্ত সময় চালু (রাত ১০ – সকাল ৭)' : 'শান্ত সময় বন্ধ'); }}
          label="রাত ১০টা – সকাল ৭টা"
          sub="জরুরি নিরাপত্তা বার্তা এর বাইরে থাকবে"
        />
      </Card>

      <Card title="সারসংক্ষেপ" sub="একসাথে কত ঘন ঘন" right={<Smartphone size={17} className="text-mut" />}>
        <Chipset>
          {DIGEST.map((d) => (
            <Chip key={d} active={prefs.digest === d} onClick={() => { updatePrefs({ digest: d }); setFlash(`সারসংক্ষেপ: ${d}`); }}>
              {d}
            </Chip>
          ))}
        </Chipset>
        <p className="text-xs text-mut mt-2">
          নির্বাচিত: <b>{prefs.digest}</b> · শান্ত সময় {prefs.quiet ? 'চালু' : 'বন্ধ'} · SMS {prefs.sms ? 'চালু' : 'বন্ধ'}
        </p>
      </Card>

      <Card title="যা কখনো বন্ধ করা যায় না" sub="নিরাপত্তা ও আইনি বাধ্যবাধকতা" right={<Badge tone="info">৩ ধরন</Badge>}>
        <ul className="list-disc pl-4 text-sm text-txt-2 space-y-1">
          <li>OTP ও লগইন সতর্কতা</li>
          <li>পাসওয়ার্ড/পিন পরিবর্তনের নোটিশ</li>
          <li>ঋণ বা কিস্তি সংক্রান্ত আইনি নোটিশ</li>
        </ul>
      </Card>

      <Button block icon={<CheckCircle2 size={16} />} onClick={() => navigate('/m/notifications')}>
        সব নোটিফিকেশন দেখুন
      </Button>
      <Button block variant="ghost" onClick={() => navigate('/account')}>
        অ্যাকাউন্ট সেটিংসে ফিরুন
      </Button>
    </SharedShell>
  );
}
