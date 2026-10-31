/* ============================================================
   src/apps/member/screens/Deposit.tsx — M-06 জমা প্রদান (ও M-07 রসিদ)
   তিন ধাপের ফ্লো এক পর্দায়: অঙ্ক → মাধ্যম → নিশ্চিতকরণ → রসিদ।
   এখানে কোনো অর্থ গৃহীত হয় না (ডেমো) — ফেজ ৬-এ API।
   ============================================================ */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Receipt } from 'lucide-react';
import { Badge, Button, Card, Chipset, Chip } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { savingsAccount } from '../../../demo/data';

const QUICK = [500, 1000, 2000, 5000];
const MODES = ['নগদ', 'বিকাশ', 'ব্যাংক'] as const;

export default function Deposit() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState<number | ''>(1000);
  const [mode, setMode] = useState<(typeof MODES)[number]>('নগদ');
  const [done, setDone] = useState(false);

  const value = typeof amount === 'number' ? amount : 0;
  const valid = value >= 100;

  if (done) {
    return (
      <div className="p-4 space-y-4">
        <div className="rounded-r-lg bg-ok-bg border border-ok-bd p-5 text-center">
          <CheckCircle2 className="mx-auto text-ok" size={40} />
          <h2 className="text-h2 text-ok-ink mt-2">জমা নিশ্চিত হয়েছে</h2>
          <p className="text-sm text-ok-ink/80 mt-1">ডেমো রসিদ — বাস্তবে কোনো টাকা নেওয়া হয়নি</p>
        </div>
        <Card title="রসিদ">
          <dl className="text-sm divide-y divide-line-2">
            {[
              ['অঙ্ক', `৳${bn(value)}`],
              ['মাধ্যম', mode],
              ['হিসাব', savingsAccount.planName],
              ['রসিদ নম্বর', 'RCP-১০৩১'],
              ['তারিখ', '৩১ অক্টো ২০২৬'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between py-2">
                <dt className="text-mut">{k}</dt>
                <dd className="font-bold text-txt num">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => { setDone(false); setAmount(1000); }}>
            আরেকটি জমা
          </Button>
          <Button onClick={() => navigate('/m/home')}>হোমে ফিরুন</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <Card title="কত টাকা জমা দিচ্ছেন?" sub="সর্বনিম্ন ৳১০০">
        <div className="rounded-r-sm border border-line-3 bg-card-2 px-3 py-3 flex items-center gap-2">
          <span className="text-h2 text-mut">৳</span>
          <input
            type="number"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
            aria-label="জমার অঙ্ক"
            className="num grow bg-transparent outline-none text-h1 font-extrabold text-txt min-h-tap"
          />
        </div>
        <div className="mt-3">
          <Chipset>
            {QUICK.map((q) => (
              <Chip key={q} active={amount === q} onClick={() => setAmount(q)}>
                ৳{bn(q)}
              </Chip>
            ))}
          </Chipset>
        </div>
      </Card>

      <Card title="মাধ্যম">
        <Chipset>
          {MODES.map((m) => (
            <Chip key={m} active={mode === m} onClick={() => setMode(m)}>
              {m}
            </Chip>
          ))}
        </Chipset>
      </Card>

      <Card title="হিসাব">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-bold text-txt">{savingsAccount.planName}</div>
            <div className="text-sm text-mut">
              কিস্তি ৳{bn(savingsAccount.installment)} · পরবর্তী {savingsAccount.nextDue}
            </div>
          </div>
          <Badge tone="brand">সক্রিয়</Badge>
        </div>
      </Card>

      <Button block size="lg" disabled={!valid} onClick={() => setDone(true)} icon={<Receipt size={18} />}>
        জমা নিশ্চিত করুন {valid ? `· ৳${bn(value)}` : ''}
      </Button>
      {!valid ? <p className="text-xs text-danger text-center">সর্বনিম্ন ৳১০০ দিন</p> : null}
      <p className="text-xs text-mut text-center">
        কোনো সুদ বা মুনাফা যোগ হবে না — জমার অঙ্কই আপনার ব্যালান্স।
      </p>
    </div>
  );
}
