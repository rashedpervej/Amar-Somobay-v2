import { useState } from 'react';
import DesignSystemPage from './pages/DesignSystemPage';
import PolicyPage from './pages/PolicyPage';
import FoundationPage from './pages/FoundationPage';

/* Phase 2 shell — তিনটি ট্যাব: শেল (নতুন), ডিজাইন সিস্টেম, নীতি স্তর।
   ব্যবসায়িক স্ক্রিন ফেজ ৩-এ; এখানে কোনো নতুন পর্দা বা ভূমিকা বানানো হয়নি। */

const TABS = [
  { id: 'shell', label: 'শেল ও নেভিগেশন', sub: 'সদস্য · অ্যাডমিন মোবাইল · অ্যাডমিন ওয়েব' },
  { id: 'design', label: 'ডিজাইন সিস্টেম', sub: 'প্রোটোটাইপ থেকে পোর্ট করা টোকেন' },
  { id: 'policy', label: 'নীতি স্তর (D-01 · D-02)', sub: 'সুদমুক্ত + tenant isolation' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function App() {
  const [tab, setTab] = useState<TabId>('shell');

  return (
    <div className="min-h-screen bg-paper">
      <header className="bg-green-800 text-white px-4 py-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 grid place-items-center rounded-r-sm bg-lime text-green-900 font-extrabold text-h2">স</span>
            <div className="grow">
              <h1 className="text-h2 leading-tight">সমবায় — Phase 2 ভিত্তি</h1>
              <p className="text-sm text-green-100 opacity-90">তিনটি শেল · প্রোটোটাইপ-যাচাই করা নেভিগেশন · সুদমুক্ত নীতি · tenant গার্ড</p>
            </div>
          </div>
          <nav className="mt-4 flex gap-2 overflow-x-auto">
            {TABS.map((t) => (
              <button key={t.id} type="button" onClick={() => setTab(t.id)}
                title={t.sub}
                className={`shrink-0 min-h-tap px-4 rounded-r-pill border text-sm font-bold transition ${
                  tab === t.id ? 'bg-lime text-green-900 border-lime' : 'bg-transparent text-white/85 border-white/25 hover:bg-white/10'}`}>
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-5 pb-16">
        {tab === 'shell' ? <FoundationPage /> : tab === 'design' ? <DesignSystemPage /> : <PolicyPage />}
      </main>

      <footer className="max-w-6xl mx-auto px-4 pb-8 text-xs text-mut">
        Phase 2 — কোনো production database পরিবর্তন করা হয়নি। SQL ড্রাফট শুধু পর্যালোচনার জন্য <span className="num">app/db/</span>-তে আছে।
      </footer>
    </div>
  );
}
