/* ============================================================
   src/apps/shared/screens/ReceiptVerify.tsx — S-07 প্রকাশ্য রসিদ যাচাই
   লগইন ছাড়াই চলে। ডেমো লেজারে থাকা রসিদ মিললে সত্য+Few details দেখায়,
   না মিললে সতর্ক করে; গোপনীয়তার জন্য সম্পূর্ণ হিসাব কখনো দেখানো হয় না।
   ============================================================ */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Copy, Download, FileText, Phone, QrCode, Search, ShieldCheck, XCircle } from 'lucide-react';
import { Badge, Button, Card } from '../../../components/ui';
import { ErrorBanner, Field, inputClass } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { SharedShell } from '../../../components/shell/SharedShell';
import { useSession } from '../../../store/sessionStore';

type Doc = {
  receipt: string;
  type: string;
  amount: number;
  date: string;
  account: string;
  channel: string;
  org: string;
  reg: string;
};

const LEDGER: Doc[] = [
  { receipt: 'RCP-১০২৫', type: 'সঞ্চয় জমা', amount: 1000, date: '১০ অক্টোবর ২০২৬ · দুপুর ১২:৪০', account: '****-MS', channel: 'মাঠ সংগ্রহ (নগদ)', org: 'কেশবপুর সমবায় সমিতি', reg: 'RSS-২৬২৭' },
  { receipt: 'RSS-1411-7Q2X', type: 'ROSCA ড্র পেআউট', amount: 12000, date: '০৫ মে ২০২৬ · সকাল ১১:০০', account: 'চক্র-১১ · সিট ৪', channel: 'নগদ', org: 'কেশবপুর সমবায় সমিতি', reg: 'RSS-২৬২৭' },
  { receipt: 'QR-2610-0005', type: 'কর্জে হাসানা কিস্তি', amount: 2500, date: '০৫ অক্টোবর ২০২৬', account: 'QH-LN-১৪০২', channel: 'নগদ', org: 'কেশবপুর সমবায় সমিতি', reg: 'RSS-২৬২৭' },
];

const norm = (v: string) =>
  v.trim().toUpperCase().replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d))).replace(/\s+/g, '');

export default function ReceiptVerify() {
  const navigate = useNavigate();
  const { org } = useSession();
  const [code, setCode] = useState('RCP-১০২৫');
  const [result, setResult] = useState<Doc | null>(null);
  const [state, setState] = useState<'idle' | 'ok' | 'notfound' | 'empty' | 'locked'>('idle');
  const [attempts, setAttempts] = useState(0);
  const [flash, setFlash] = useState('');

  function verify() {
    if (attempts >= 5) {
      setState('locked');
      return;
    }
    if (!code.trim()) {
      setState('empty');
      return;
    }
    const found = LEDGER.find((d) => norm(d.receipt) === norm(code));
    setAttempts((a) => a + 1);
    if (found) {
      setResult(found);
      setState('ok');
    } else {
      setResult(null);
      setState('notfound');
    }
  }

  function copy() {
    if (!result) return;
    navigator.clipboard?.writeText(`${result.receipt} · ৳${bn(result.amount)} · ${result.date}`).catch(() => undefined);
    setFlash('কপি হয়েছে');
    setTimeout(() => setFlash(''), 1600);
  }

  function download() {
    const text = [
      'সমবায় — রসিদ যাচাই ফলাফল',
      `সমিতি: ${result?.org ?? org.name}`,
      `রসিদ: ${result?.receipt ?? code}`,
      result ? `ধরন: ${result.type}\nঅঙ্ক: ৳${bn(result.amount)}\nতারিখ: ${result.date}` : '',
      'যাচাই: সত্য (ডেমো লেজার)',
    ].join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${code}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <SharedShell
      title="রসিদ যাচাই"
      sub="লগইন লাগবে না · যেকেউ যাচাই করতে পারেন"
      onBack={() => navigate('/login')}
      plain
      right={<QrCode size={20} className="text-mut" />}
    >
      <Card title="রসিদ নম্বর বা যাচাই কোড" sub="ডেমো নমুনা: RCP-১০২৫ · RSS-1411-7Q2X · QR-2610-0005">
        <Field label="কোড" hint="রসিদের নিচে লেখা কোডটি হুবহু দিন, অথবা QR স্ক্যান করুন">
          {(id) => (
            <input
              id={id}
              value={code}
              onChange={(e) => { setCode(e.target.value); setState('idle'); }}
              placeholder="RCP-১০২৫"
              className={inputClass() + ' num font-bold tracking-wide'}
            />
          )}
        </Field>
        <Button block size="lg" className="mt-3" icon={<Search size={17} />} onClick={verify}>
          যাচাই করুন
        </Button>
      </Card>

      {state === 'ok' && result ? (
        <div className="rounded-r-md border border-ok-bd bg-card overflow-hidden shadow-sh-1">
          <div className="bg-ok-bg px-4 py-5 text-center">
            <div className="w-16 h-16 rounded-r-lg bg-card border-2 border-ok text-ok-ink grid place-items-center mx-auto">
              <CheckCircle2 size={32} />
            </div>
            <div className="text-h3 font-extrabold text-ok-ink mt-2.5">এই রসিদ সত্য</div>
            <div className="text-xs text-ok-ink/85 mt-1">সমিতির লেজারে এই লেনদেন সংরক্ষিত আছে</div>
          </div>
          <div className="px-4 py-3">
            <dl className="text-sm divide-y divide-line-2">
              {[
                ['সমিতি', result.org],
                ['নিবন্ধন নং', result.reg],
                ['রসিদ নং', result.receipt],
                ['তারিখ', result.date],
                ['ধরন', result.type],
                ['অঙ্ক', `৳${bn(result.amount)}`],
                ['অ্যাকাউন্ট', result.account],
                ['মাধ্যম', result.channel],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 py-2">
                  <dt className="text-mut shrink-0">{k}</dt>
                  <dd className="font-bold text-txt text-right break-words num">{v}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-2 rounded-r-sm bg-info-bg border border-info-bd px-3 py-2 text-xs text-info-ink flex gap-2">
              <ShieldCheck size={14} className="mt-0.5 shrink-0" />
              <span>
                <b>গোপনীয়তা</b> — যাচাইকারী যেন অন্যের সম্পূর্ণ হিসাব না দেখেন, তাই সদস্যের নাম, মোবাইল ও ব্যালেন্স দেখানো হয় না।
              </span>
            </div>

            {flash ? <p className="text-xs text-ok font-bold mt-2">{flash}</p> : null}
            <div className="grid grid-cols-3 gap-2 mt-3">
              <Button variant="ghost" size="sm" icon={<Copy size={14} />} onClick={copy}>কপি</Button>
              <Button variant="ghost" size="sm" icon={<Download size={14} />} onClick={download}>সেভ</Button>
              <a href="tel:+8801700000000" className="min-h-tap rounded-r-sm font-bold text-sm flex items-center justify-center gap-1.5 bg-card border border-line-3">
                <Phone size={14} /> সমিতি
              </a>
            </div>
          </div>
        </div>
      ) : null}

      {state === 'notfound' ? (
        <div className="rounded-r-sm bg-danger-bg border border-danger-bd text-danger-ink px-4 py-3">
          <div className="flex gap-2">
            <XCircle size={18} className="mt-0.5 shrink-0" />
            <div>
              <div className="font-extrabold">এই রসিদ সত্য নয়</div>
              <p className="text-xs mt-1 leading-relaxed">
                কোডটি এই সমিতির কোনো রেকর্ডে নেই। প্রতারণা সন্দেহ হলে এখনই সমিতির অফিসে জানান — ০১৭১১-৪৫৬৭৮৯।
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {state === 'empty' ? <ErrorBanner>কিছু পাওয়া যায়নি — রসিদ নম্বর লিখুন (শেষ অংশে অক্ষর ও সংখ্যা মিশে আছে)।</ErrorBanner> : null}
      {state === 'locked' ? (
        <ErrorBanner>অনেকবার চেষ্টা হয়েছে — নিরাপত্তার জন্য ৫ মিনিট অপেক্ষা করুন (রেট লিমিট)।</ErrorBanner>
      ) : null}

      <Card title="ডকুমেন্ট ভিউয়ার" sub="সেপ্টেম্বর ২০২৬-এর স্টেটমেন্ট" right={<FileText size={16} className="text-mut" />}>
        <div className="rounded-r-sm border border-line-3 bg-card-2 px-3 py-2 flex items-center gap-2">
          <FileText size={18} className="text-mut" />
          <div className="grow">
            <div className="text-sm font-bold text-txt">স্টেটমেন্ট-সেপ্টেম্বর-২০২৬.pdf</div>
            <div className="text-xs text-mut">১৮৪ KB · ৩ পাতা · ০১ অক্টোবর ২০২৬</div>
          </div>
          <Badge tone="ok">প্রস্তুত</Badge>
        </div>
        <div className="h-24 rounded-r-sm bg-line-2 grid place-items-center mt-2 text-mut-2 text-xs">
          প্রিভিউ · এই ব্রাউজারে ডেমো নথি
        </div>
        <Button block variant="secondary" className="mt-2" icon={<Download size={15} />} onClick={download}>
          নমুনা নথি ডাউনলোড
        </Button>
      </Card>

      <p className="text-xs text-mut text-center">এই পেজটি ইন্টারনেটে প্রকাশ্য — লগইন ছাড়াই কাজ করে।</p>
    </SharedShell>
  );
}
