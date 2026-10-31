/* ============================================================
   src/apps/shared/screens/ErrorStates.tsx — S-06 ত্রুটি, অফলাইন ও 404
   তিনটি ভ্যারিয়েন্ট এক পেজে (?type=offline|404|500) — প্রতিটিতে রেফারেন্স কোড,
   মানুষের ভাষায় কারণ ও কার্যকর "আবার চেষ্টা"।
   ============================================================ */

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Home, Phone, RefreshCw, SearchX, TriangleAlert, WifiOff } from 'lucide-react';
import { Badge, Button, Card, Chip, Chipset } from '../../../components/ui';
import { SharedShell } from '../../../components/shell/SharedShell';
import { useSession } from '../../../store/sessionStore';

type Kind = 'offline' | '404' | '500';

const META: Record<Kind, { title: string; code: string; ref: string; msg: string; icon: typeof WifiOff; tone: string; note: string }> = {
  offline: {
    title: 'ইন্টারনেট সংযোগ নেই',
    code: 'OFFLINE',
    ref: '—',
    msg: 'আপনার তৈরি করা কোনো এন্ট্রি হারাবে না — ফোনে সংরক্ষিত আছে। সংযোগ ফিরলে নিজে থেকেই সার্ভারে পাঠানো হবে।',
    icon: WifiOff,
    tone: 'bg-warn-bg text-warn-ink border-warn-bd',
    note: 'sync-এর অপেক্ষায় থাকা এন্ট্রি এখানে দেখতে পারবেন।',
  },
  404: {
    title: 'এই পেজটি খুঁজে পাওয়া যায়নি',
    code: '404',
    ref: '404-A7F2',
    msg: 'ঠিকানাটি বদলে গেছে বা ভুল লেখা হয়েছে। নিচের বোতাম থেকে এগিয়ে যান — আপনার কোনো কাজ হারায়নি।',
    icon: SearchX,
    tone: 'bg-card-2 text-txt-2 border-line-3',
    note: 'পুরনো বুকমার্ক থেকে এলে এমন হতে পারে — লিংক হালনাগাদ করে নিন।',
  },
  500: {
    title: 'আমাদের দিকে সমস্যা হয়েছে',
    code: '500',
    ref: 'ERR-2627-9K4M',
    msg: 'দুঃখিত — সার্ভারে অপ্রত্যাশিত ত্রুটি। আপনার তথ্য নিরাপদ আছে। রেফারেন্স কোডটি সাপোর্টে জানালে দ্রুত সমাধান হবে।',
    icon: TriangleAlert,
    tone: 'bg-danger-bg text-danger-ink border-danger-bd',
    note: 'টাকা সংক্রান্ত কাজ আধা-অবস্থায় থাকলে ব্যালেন্স দেখানো হয় না — "নিশ্চিত করা যায়নি, আবার চেষ্টা করুন"।',
  },
};

export default function ErrorStates() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { queue } = useSession();
  const [tried, setTried] = useState(0);
  const kind = (params.get('type') as Kind) || 'offline';
  const meta = META[kind] ?? META.offline;
  const Icon = meta.icon;

  return (
    <SharedShell
      title="সিস্টেম বার্তা"
      sub="Error · Offline · Not Found"
      onBack={() => navigate(-1)}
      plain
      right={
        <button type="button" onClick={() => setTried((t) => t + 1)} className="min-h-tap px-3 inline-flex items-center gap-1.5 text-sm font-bold text-green-700">
          <RefreshCw size={15} /> চেষ্টা
        </button>
      }
    >
      <Chipset>
        {(Object.keys(META) as Kind[]).map((k) => (
          <Chip key={k} active={kind === k} onClick={() => setParams({ type: k })}>
            {k === 'offline' ? 'অফলাইন' : k === '404' ? '404' : '500'}
          </Chip>
        ))}
      </Chipset>

      {tried > 0 ? (
        <div className="rounded-r-sm bg-info-bg border border-info-bd text-info-ink px-3 py-2 text-xs">
          {tried} বার চেষ্টা করা হয়েছে — আবার ব্যর্থ হলে সহায়তায় রেফারেন্স কোড দিন। (প্রতি চেষ্টার আগে ১s → ৩s → ৯s বিরতি)
        </div>
      ) : null}

      <Card title={meta.code} sub={meta.title} right={<Badge tone={kind === '500' ? 'danger' : kind === 'offline' ? 'warn' : 'neutral'}>{meta.code}</Badge>}>
        <div className={`rounded-r-sm border ${meta.tone} px-4 py-6 text-center`}>
          <Icon size={40} className="mx-auto" />
          <div className="font-extrabold text-h3 mt-2">{meta.title}</div>
          <p className="text-sm mt-2 leading-relaxed">{meta.msg}</p>
          {meta.ref !== '—' ? <div className="num text-xs font-bold mt-2">রেফ: {meta.ref}</div> : null}
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3">
          <Button variant="secondary" icon={<RefreshCw size={15} />} onClick={() => setTried((t) => t + 1)}>
            আবার চেষ্টা
          </Button>
          {kind === 'offline' ? (
            <Button icon={<WifiOff size={15} />} onClick={() => navigate('/sync')}>
              সংরক্ষিত ডেটা
            </Button>
          ) : (
            <Button icon={<Home size={15} />} onClick={() => navigate('/m/home')}>
              হোম
            </Button>
          )}
        </div>
        {kind === 'online' as string ? null : null}
        <Button block variant="ghost" className="mt-2" icon={<Phone size={15} />} onClick={() => navigate('/m/help')}>
          সহায়তা
        </Button>
      </Card>

      <Card title="বিশেষ ক্ষেত্র" sub="নেটওয়ার্ক টাইমআউটে অনুমান নয়">
        <p className="text-sm text-txt-2 leading-relaxed">
          ওয়ালেট/ব্যাংকে টাকা পাঠানোর সময় সংযোগ বিচ্ছিন্ন হলে অবস্থা <b>unknown</b> হিসেবে সংরক্ষিত হয়।
          তখন “ব্যর্থ” বা “সফল” — কিছুই অনুমান করা হয় না; প্রদানকারীর কাছে নিশ্চিত হয়ে অবস্থা ঠিক করা হয়।
        </p>
      </Card>

      {queue.length ? (
        <Card title="অপেক্ষমাণ এন্ট্রি" sub={`${queue.length}টি sync বাকি`}>
          <Button block onClick={() => navigate('/sync')}>কিউ দেখুন</Button>
        </Card>
      ) : null}
    </SharedShell>
  );
}
