/* ============================================================
   src/apps/shared/screens/AccountSettings.tsx — S-03 প্রোফাইল ও অ্যাকাউন্ট সেটিংস
   প্ল্যাটফর্ম-জুড়ে এক: পরিচিতি, ভাষা, নিরাপত্তা, ডেটা — সব কাজ করে,
   ভূমিকা-নির্দিষ্ট বিস্তারিত (KYC) সদস্য অ্যাপের M-18-এ যায়।
   ============================================================ */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BadgeCheck, Bell, ChevronRight, Globe2, KeyRound, LogOut, RefreshCw, ShieldCheck, UserRound } from 'lucide-react';
import { Badge, Button, Card, Chip, Chipset, Row } from '../../../components/ui';
import { Field, SuccessBanner, inputClass } from '../../../components/form';
import { SharedShell } from '../../../components/shell/SharedShell';
import { useSession } from '../../../store/sessionStore';

export default function AccountSettings() {
  const navigate = useNavigate();
  const { org, phone, prefs, updatePrefs, logout, queue } = useSession();
  const [name, setName] = useState('সাবিনা ইয়াসমিন');
  const [email, setEmail] = useState('sabina@example.com');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [flash, setFlash] = useState('');
  const [confirmOut, setConfirmOut] = useState(false);

  function save() {
    const e: Record<string, string> = {};
    if (name.trim().length < 3) e.name = 'পূর্ণ নাম লিখুন';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'ইমেইল সঠিক নয়';
    setErrors(e);
    if (Object.keys(e).length) return;
    setFlash('প্রোফাইল সংরক্ষিত হয়েছে');
  }

  return (
    <SharedShell
      title="প্রোফাইল ও সেটিংস"
      sub={`${org.name} · ${org.role}`}
      onBack={() => navigate('/m/home')}
      plain
      right={<Badge tone="ok" dot>সক্রিয়</Badge>}
    >
      {flash ? <SuccessBanner title="সম্পন্ন">{flash}</SuccessBanner> : null}

      <Card title="পরিচিতি" sub="সব প্ল্যাটফর্মে একই তথ্য ব্যবহৃত হয়" right={<UserRound size={17} className="text-mut" />}>
        <div className="space-y-3">
          <Field label="পূর্ণ নাম" required error={errors.name}>
            {(id) => <input id={id} value={name} onChange={(e) => { setName(e.target.value); setFlash(''); }} className={inputClass(errors.name)} />}
          </Field>
          <Field label="ইমেইল" error={errors.email} hint="রসিদ ও স্টেটমেন্টের কপি এখানে যাবে">
            {(id) => <input id={id} type="email" value={email} onChange={(e) => { setEmail(e.target.value); setFlash(''); }} className={inputClass(errors.email)} />}
          </Field>
          <Field label="মোবাইল নম্বর" hint="পরিবর্তনের জন্য শাখায় পরিচয়পত্র নিয়ে যান">
            {(id) => <input id={id} value={`+৮৮০ ${phone}`} readOnly className={inputClass() + ' num bg-card-2 text-mut'} />}
          </Field>
          <Button block onClick={save} icon={<BadgeCheck size={16} />}>
            সংরক্ষণ করুন
          </Button>
        </div>
      </Card>

      <Card title="ভাষা" sub="সংখ্যা বাংলা অঙ্কে দেখানো হবে" right={<Globe2 size={17} className="text-mut" />}>
        <Chipset>
          <Chip active={prefs.language === 'বাংলা'} onClick={() => { updatePrefs({ language: 'বাংলা' }); setFlash('ভাষা বাংলা করা হয়েছে'); }}>বাংলা</Chip>
          <Chip active={prefs.language === 'English'} onClick={() => { updatePrefs({ language: 'English' }); setFlash('Language set to English'); }}>English</Chip>
        </Chipset>
      </Card>

      <div className="rounded-r-md border border-line bg-card overflow-hidden shadow-sh-1">
        <Row
          icon={<Bell size={18} />}
          title="নোটিফিকেশন পছন্দ"
          sub="চ্যানেল, শান্ত সময়, সারসংক্ষেপ"
          right={<ChevronRight size={18} className="text-mut" />}
          onClick={() => navigate('/account/notifications')}
        />
        <Row
          icon={<UserRound size={18} />}
          title="KYC ও ঠিকানা"
          sub="সদস্য অ্যাপের প্রোফাইলে"
          right={<ChevronRight size={18} className="text-mut" />}
          onClick={() => navigate('/m/profile')}
        />
        <Row
          icon={<RefreshCw size={18} />}
          title="অফলাইন কিউ"
          sub={queue.length ? `${queue.length}টি এন্ট্রি sync-এর অপেক্ষায়` : 'সব sync হয়েছে'}
          right={<Badge tone={queue.length ? 'warn' : 'ok'}>{queue.length ? 'বাকি' : 'ঠিক আছে'}</Badge>}
          onClick={() => navigate('/sync')}
        />
        <Row
          icon={<ShieldCheck size={18} />}
          title="নিরাপত্তা ও সেশন"
          sub="পিন, ডিভাইস, লগইন ইতিহাস"
          right={<ChevronRight size={18} className="text-mut" />}
          onClick={() => navigate('/m/settings')}
        />
      </div>

      <Card title="অ্যাক্সেস" sub="ভূমিকা অনুযায়ী পর্দা বদলায়">
        <div className="flex items-center gap-2 text-sm text-txt-2">
          <KeyRound size={16} className="text-mut" />
          <span>আপনার ভূমিকা</span>
          <Badge tone="brand">{org.role}</Badge>
        </div>
        <p className="text-xs text-mut mt-2">
          অনুমতি না থাকলে ব্যবহারকারী ফাঁকা পেজ নয়, কারণ ও করণীয়সহ পেজ দেখবেন (S-05)।
        </p>
        <Button block variant="secondary" className="mt-2" onClick={() => navigate('/403')}>
          অনুমতি-না পেজ দেখুন
        </Button>
      </Card>

      {confirmOut ? (
        <Card title="লগআউট নিশ্চিত করুন" sub="অফলাইন কিউতে থাকা এন্ট্রি মুছে যাবে না — পরের লগইনে sync হবে">
          <div className="flex gap-2">
            <Button block variant="secondary" onClick={() => setConfirmOut(false)}>বাতিল</Button>
            <Button block variant="danger" icon={<LogOut size={16} />} onClick={() => { logout(); navigate('/login', { replace: true }); }}>
              হ্যাঁ, লগআউট
            </Button>
          </div>
        </Card>
      ) : (
        <Button block variant="ghost" icon={<LogOut size={16} />} onClick={() => setConfirmOut(true)}>
          লগআউট
        </Button>
      )}
    </SharedShell>
  );
}
