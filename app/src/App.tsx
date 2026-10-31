import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, HelpCircle, LayoutDashboard, Monitor, ShieldCheck, Smartphone, WifiOff } from 'lucide-react';

/* ============================================================
   App.tsx — লাইভ ডেমোর প্রবেশদ্বার
   এখানে কোনো ব্যবসায়িক পর্দা নেই; শুধু তিনটি আসল অ্যাপে যাওয়ার
   স্পষ্ট দরজা + ডেমোর সীমা। প্রোটোটাইপই ডিজাইনের সোর্স।
   ============================================================ */

const APPS = [
  {
    to: '/m/home',
    icon: Smartphone,
    tag: 'সদস্য অ্যাপ',
    title: 'সদস্যের নিজের অ্যাপ',
    sub: 'মোবাইল-অনলি · ৩৬০–৪৩০px',
    detail: 'সঞ্চয়, ROSCA, যৌথ লক্ষ্য, কর্জে হাসানা — সদস্যের নিজের হিসাব ও আবেদন।',
    links: [
      ['হোম', '/m/home'],
      ['কর্জে হাসানা', '/m/qard'],
      ['আমার সঞ্চয়', '/m/savings'],
    ],
    tone: 'border-green-100 bg-green-050',
    btn: 'bg-green-700 text-white',
  },
  {
    to: '/a/home?role=MANAGER',
    icon: LayoutDashboard,
    tag: 'অ্যাডমিন মোবাইল',
    title: 'ম্যানেজার / সংগ্রহকের অ্যাপ',
    sub: 'মোবাইল-ফার্স্ট · ৩৬০–৪৩০px',
    detail: 'অনুমোদন, সদস্য, আদায়, ROSCA, যৌথ লক্ষ্য ও কর্জে হাসানা — মাঠে ব্যবহারের জন্য।',
    links: [
      ['হোম', '/a/home?role=MANAGER'],
      ['অনুমোদন কিউ', '/a/approvals'],
      ['QH ড্যাশবোর্ড', '/a/qh'],
    ],
    tone: 'border-qh-100 bg-qh-050',
    btn: 'bg-qh-700 text-white',
  },
  {
    to: '/w/dashboard',
    icon: Monitor,
    tag: 'অ্যাডমিন ওয়েব',
    title: 'ডেস্কটপ অ্যাডমিন প্যানেল',
    sub: 'ডেস্কটপ-শুধু · ১২৮০px+',
    detail: 'ঘন টেবিল, নিয়ম, জানালা/কোটা, বিতরণ ও রিপোর্ট — আলাদা ডেস্কটপ ইন্টারফেস।',
    links: [
      ['ড্যাশবোর্ড', '/w/dashboard'],
      ['QH ড্যাশবোর্ড', '/w/qh'],
      ['QH আবেদন কিউ', '/w/qh/queue'],
    ],
    tone: 'border-line bg-card',
    btn: 'bg-green-800 text-white',
  },
] as const;

export default function App() {
  return (
    <div className="min-h-screen bg-paper text-txt">
      <header className="bg-green-800 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-start gap-3">
            <span className="w-11 h-11 shrink-0 grid place-items-center rounded-r-sm bg-lime text-green-900 font-extrabold text-h2">স</span>
            <div className="grow min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-h2 leading-tight">আমার সমবায় — লাইভ ডেমো</h1>
                <span className="rounded-r-pill border border-lime/50 bg-lime/15 px-2.5 py-1 text-[11px] font-bold text-lime">ডেমো ডেটা</span>
              </div>
              <p className="text-sm text-green-100 mt-1">
                নিচের তিনটি কার্ডই আসল অ্যাপ — কোনো স্ক্রিনশট বা মকআপ নয়। যেটায় ঢুকবেন, সেটাই পুরো পর্দাজুড়ে চলবে।
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-r-pill bg-white/10 border border-white/20 px-3 py-1.5"><ShieldCheck size={13} /> সুদ শূন্য নীতি</span>
            <span className="inline-flex items-center gap-1.5 rounded-r-pill bg-white/10 border border-white/20 px-3 py-1.5"><WifiOff size={13} /> ইন-মেমরি · রিফ্রেশে সিড</span>
            <span className="inline-flex items-center gap-1.5 rounded-r-pill bg-white/10 border border-white/20 px-3 py-1.5"><BookOpen size={13} /> ১৯৯ পর্দার ১৬১টি সম্পন্ন</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-16">
        <div className="grid gap-4 md:grid-cols-3">
          {APPS.map((a) => {
            const Icon = a.icon;
            return (
              <section key={a.tag} className={`rounded-r-md border ${a.tone} p-4 sm:p-5 flex flex-col shadow-sh-1`}>
                <div className="flex items-center gap-2">
                  <span className="size-9 grid place-items-center rounded-r-sm bg-white/70 text-green-800"><Icon size={19} /></span>
                  <span className="text-xs font-extrabold tracking-wide text-mut">{a.tag}</span>
                </div>
                <h2 className="text-h3 mt-3 leading-snug">{a.title}</h2>
                <p className="text-xs text-mut mt-1">{a.sub}</p>
                <p className="text-sm text-mut mt-2 grow leading-relaxed">{a.detail}</p>
                <Link to={a.to} className={`mt-4 min-h-tap inline-flex items-center justify-center gap-2 rounded-r-sm px-4 text-sm font-extrabold ${a.btn}`}>
                  খুলুন <ArrowRight size={16} />
                </Link>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {a.links.map(([label, to]) => (
                    <Link key={to} to={to} className="min-h-10 inline-flex items-center rounded-r-pill border border-line bg-white/70 px-2.5 text-xs font-bold text-txt hover:border-green-600">
                      {label}
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="rounded-r-md border border-line bg-card p-4 sm:p-5">
            <h2 className="text-h3 flex items-center gap-2"><HelpCircle size={18} /> কোথায় কী দেখছি?</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-r-sm border border-line-2 bg-card-2 p-3">
                <b className="text-sm block">১ · এটাই অ্যাপ, আলাদা ওয়েবসাইট নয়</b>
                <p className="text-xs text-mut mt-1 leading-relaxed">
                  Arena-র প্রিভিউ প্যানেলের ভেতরেই React অ্যাপ চলছে। প্যানেলের উপরের ডান দিকের <b>⤢ / Open</b> চাপলে বড় করে দেখা যায়।
                </p>
              </div>
              <div className="rounded-r-sm border border-line-2 bg-card-2 p-3">
                <b className="text-sm block">২ · ফোনে কোনটা?</b>
                <p className="text-xs text-mut mt-1 leading-relaxed">
                  ফোনে <b>সদস্য অ্যাপ</b> বা <b>অ্যাডমিন মোবাইল</b> খুলুন — এগুলোই মোবাইলের জন্য বানানো। অ্যাডমিন ওয়েব ডেস্কটপের জন্য; ফোনে টেবিলগুলো ছোট লাগবে, সেটা ব্যর্থতা নয়।
                </p>
              </div>
              <div className="rounded-r-sm border border-line-2 bg-card-2 p-3">
                <b className="text-sm block">৩ · রিফ্রেশ করলে?</b>
                <p className="text-xs text-mut mt-1 leading-relaxed">
                  সব ডেটা ইন-মেমরি ডেমো — রিফ্রেশে সিডে ফিরে যায়। কোনো আসল সদস্যের তথ্য বা DB সংযুক্ত নেই; কিছুই স্থায়ীভাবে জমা হচ্ছে না।
                </p>
              </div>
              <div className="rounded-r-sm border border-line-2 bg-card-2 p-3">
                <b className="text-sm block">৪ · লগইন লাগবে?</b>
                <p className="text-xs text-mut mt-1 leading-relaxed">
                  ডেমোতে লগইন ছাড়াই ঢোকা যায়। ভূমিকা বদলাতে URL-এ <span className="num">?role=MANAGER</span>, <span className="num">ACCOUNTANT</span>, <span className="num">COLLECTOR</span> ব্যবহার করুন।
                </p>
              </div>
            </div>
          </section>

          <aside className="rounded-r-md border border-warn-bd bg-warn-bg p-4 sm:p-5">
            <h2 className="text-h3 text-warn-ink">সীমা স্পষ্ট</h2>
            <ul className="mt-2 space-y-2 text-xs text-warn-ink/90 leading-relaxed">
              <li>• এটি <b>ডেমো প্রিভিউ</b> — প্রোডাকশন অ্যাপ নয়।</li>
              <li>• OTP ডেমো: <b className="num">123456</b>; প্রকৃত SMS যায় না।</li>
              <li>• CSV/PDF বোতাম শুধু “ডেমো” বার্তা দেখায়।</li>
              <li>• কোনো DB মাইগ্রেশন, ডিপ্লয় বা <span className="num">main</span> মার্জ হয়নি।</li>
            </ul>
            <div className="mt-4 pt-3 border-t border-warn-bd/50 flex flex-wrap gap-2">
              <Link to="/login" className="min-h-10 inline-flex items-center rounded-r-sm border border-warn-bd bg-white/60 px-3 text-xs font-bold">লগইন পর্দা</Link>
              <Link to="/error?type=404" className="min-h-10 inline-flex items-center rounded-r-sm border border-warn-bd bg-white/60 px-3 text-xs font-bold">ত্রুটি পর্দা</Link>
            </div>
          </aside>
        </div>

        <p className="mt-6 text-xs text-mut text-center">
          প্রোটোটাইপ = ডিজাইনের সোর্স · রং/ফন্ট/স্পেসিং টোকেন একই ·{' '}
          <Link to="/m/home" className="font-bold underline">সদস্য</Link> ·{' '}
          <Link to="/a/home?role=MANAGER" className="font-bold underline">অ্যাডমিন মোবাইল</Link> ·{' '}
          <Link to="/w/dashboard" className="font-bold underline">অ্যাডমিন ওয়েব</Link>
        </p>
      </main>
    </div>
  );
}
