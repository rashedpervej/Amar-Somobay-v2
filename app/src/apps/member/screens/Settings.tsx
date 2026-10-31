/* ============================================================
   src/apps/member/screens/Settings.tsx — M-20 সেটিংস
   বিজ্ঞপ্তি/SMS/ভাষা/পিন — প্রতিটি পরিবর্তন সাথে সাথে স্টোরে যায়।
   ============================================================ */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe2, KeyRound, LogOut, Settings2, ShieldCheck, Smartphone } from 'lucide-react';
import { Badge, Button, Card, Chip, Chipset } from '../../../components/ui';
import { SuccessBanner, Toggle } from '../../../components/form';
import { useMember } from '../../../store/memberStore';

export default function Settings() {
  const { state, updateSettings } = useMember();
  const navigate = useNavigate();
  const [flash, setFlash] = useState('');
  const s = state.settings;

  async function toggle(key: 'notifications' | 'sms', value: boolean) {
    await updateSettings({ [key]: value } as never);
    setFlash(value ? 'চালু করা হয়েছে' : 'বন্ধ করা হয়েছে');
  }

  return (
    <div className="p-4 space-y-4">
      <button type="button" onClick={() => navigate(-1)} className="min-h-tap flex items-center gap-1.5 text-sm font-bold text-green-700">
        <ArrowLeft size={16} /> ফিরে যান
      </button>

      {flash ? <SuccessBanner title="সেটিংস হালনাগাদ">{flash}</SuccessBanner> : null}

      <Card title="বিজ্ঞপ্তি" sub="জমা, অনুমোদন ও বকেয়ার কথা" right={<Settings2 size={16} className="text-mut" />}>
        <div className="divide-y divide-line-2">
          <Toggle checked={s.notifications} onChange={(v) => toggle('notifications', v)} label="অ্যাপ নোটিফিকেশন" sub="নতুন ঘোষণা ও অনুমোদনের খবর" />
          <Toggle checked={s.sms} onChange={(v) => toggle('sms', v)} label="SMS বার্তা" sub="মোবাইলে ছোট বার্তা পাঠানো হবে" />
        </div>
      </Card>

      <Card title="ভাষা" sub="অ্যাপের ভাষা বেছে নিন" right={<Globe2 size={16} className="text-mut" />}>
        <Chipset>
          <Chip active={s.language === 'বাংলা'} onClick={() => updateSettings({ language: 'বাংলা' }).then(() => setFlash('ভাষা বাংলা করা হয়েছে'))}>
            বাংলা
          </Chip>
          <Chip active={s.language === 'English'} onClick={() => updateSettings({ language: 'English' }).then(() => setFlash('Language: English'))}>
            English
          </Chip>
        </Chipset>
        <p className="text-xs text-mut mt-2">
          {s.language === 'বাংলা' ? 'সংখ্যা বাংলা অঙ্কে দেখানো হবে।' : 'Numbers will be shown in Latin digits where possible.'}
        </p>
      </Card>

      <Card title="নিরাপত্তা" sub="পিন ও লগইন" right={<ShieldCheck size={16} className="text-ok" />}>
        <div className="flex items-center justify-between gap-3 py-2">
          <div className="flex items-center gap-2">
            <KeyRound size={16} className="text-mut" />
            <div>
              <div className="text-sm font-bold text-txt">অ্যাপ পিন</div>
              <div className="text-xs text-mut">{s.pinSet ? 'সেট করা আছে' : 'এখনো সেট করা হয়নি'}</div>
            </div>
          </div>
          <Badge tone={s.pinSet ? 'ok' : 'warn'}>{s.pinSet ? 'সক্রিয়' : 'সেট করুন'}</Badge>
        </div>
        <div className="flex items-center justify-between gap-3 py-2 border-t border-line-2">
          <div className="flex items-center gap-2">
            <Smartphone size={16} className="text-mut" />
            <div>
              <div className="text-sm font-bold text-txt">নিবন্ধিত মোবাইল</div>
              <div className="text-xs text-mut num">{state.profile.phone}</div>
            </div>
          </div>
          <Button size="sm" variant="secondary" onClick={() => navigate('/m/profile')}>বদলান</Button>
        </div>
      </Card>

      <Card title="অ্যাকাউন্ট" sub="সদস্যপদ ও ডেটা">
        <div className="space-y-2">
          <Button block variant="secondary" onClick={() => navigate('/m/close-request')}>
            সদস্যপদ বন্ধের আবেদন
          </Button>
          <Button block variant="ghost" icon={<LogOut size={16} />} onClick={() => navigate('/m/home')}>
            লগআউট
          </Button>
        </div>
      </Card>

      <p className="text-xs text-mut text-center leading-relaxed">
        অ্যাপ সংস্করণ ২.০ · নীতি D-01 অনুযায়ী কোনো সুদ বা মুনাফা প্রদান করা হয় না।
        <br />
        তথ্য গোপনীয়তা: আপনার KYC তথ্য শুধু সংস্থার অনুমোদিত কর্মকর্তা দেখতে পারেন।
      </p>
    </div>
  );
}
