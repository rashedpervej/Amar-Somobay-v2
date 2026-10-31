/* S-10 · অনুমোদনের অপেক্ষা — আবেদনের অবস্থা, নথি ও পরবর্তী ধাপ */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Card } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { useSession } from '../../../store/sessionStore';

const STEPS = [
  { t: 'আবেদন জমা', ok: true, at: '৩১ অক্টো, সকাল ৯:১২' },
  { t: 'মোবাইল ও NID যাচাই', ok: true, at: '৩১ অক্টো, সকাল ৯:৩০' },
  { t: 'সংগ্রহক শাখা যাচাই', ok: false, at: 'আসন্ন' },
  { t: 'কমিটির অনুমোদন', ok: false, at: 'আসন্ন' },
];

const DOCS = [
  { t: 'NID-এর সামনের ছবি', ok: true },
  { t: 'NID-এর পিছনের ছবি', ok: false },
  { t: 'নমিনির তথ্য', ok: false },
  { t: 'ছবি (সাম্প্রতিক)', ok: true },
];

export default function Pending() {
  const navigate = useNavigate();
  const { phone } = useSession();
  const [msg, setMsg] = useState('');
  const pending = DOCS.filter((d) => !d.ok);

  return (
    <div className="p-4 space-y-4">
      <div>
        <div className="text-h1 font-extrabold text-txt">অনুমোদনের অপেক্ষায়</div>
        <p className="text-sm text-mut mt-1">আবেদন নম্বর <b className="num">APP-2627-0044</b> · মোবাইল <b className="num">{phone}</b> · জমা ৩১ অক্টোবর ২০২৬</p>
      </div>

      <Card title="আবেদনের অবস্থা" sub="কমিটি অনুমোদনের আগে সদস্যপদ সক্রিয় নয়" right={<Badge tone="warn">অপেক্ষমাণ</Badge>}>
        <div className="space-y-2">
          {STEPS.map((s, i) => (
            <div key={s.t} className="flex items-start gap-3">
              <span className={`w-7 h-7 shrink-0 grid place-items-center rounded-r-pill text-xs font-bold ${s.ok ? 'bg-green-700 text-white' : 'bg-card-2 border border-line text-mut'}`}>
                {s.ok ? '✓' : bn(i + 1)}
              </span>
              <div className="min-w-0">
                <div className="text-sm font-bold text-txt">{s.t}</div>
                <div className="text-xs text-mut">{s.at}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-r-sm border border-info-bd bg-info-bg text-info-ink px-3 py-2 text-xs mt-3">
          সাধারণত ২ কর্মদিবস লাগে। অনুমোদনের পরে SMS যাবে; তার আগে জমা নেওয়া হবে না।
        </div>
      </Card>

      {msg && <div className="rounded-r-sm border border-ok-bd bg-ok-bg text-ok-ink px-3 py-2 text-sm">{msg}</div>}

      <Card title="অসম্পূর্ণ নথি" sub={`${bn(pending.length)}টি নথি বাকি`}>
        <div className="space-y-2">
          {DOCS.map((d) => (
            <div key={d.t} className={`rounded-r-sm border px-3 py-2 text-sm flex items-center justify-between gap-2 ${d.ok ? 'border-ok-bd bg-ok-bg' : 'border-warn-bd bg-warn-bg'}`}>
              <span>{d.ok ? '✓' : '!'} {d.t}</span>
              {!d.ok && <Button size="sm" variant="secondary" onClick={() => setMsg('নথি আপলোড ডেমো — বাস্তবে ফাইল সংরক্ষণ হয় না')}>যোগ করুন</Button>}
            </div>
          ))}
        </div>
      </Card>

      <Card title="পরবর্তী ধাপ">
        <div className="grid gap-2">
          <Button onClick={() => setMsg('অবস্থা হালনাগাদ হয়েছে — এখনো কমিটির অনুমোদন বাকি (ডেমো)')}>অবস্থা রিফ্রেশ করুন</Button>
          <Button variant="secondary" onClick={() => navigate('/m/join')}>অন্য সমিতিতে যোগ দিন</Button>
          <Button variant="ghost" onClick={() => navigate('/m/home')}>ডেমো হোমে যান</Button>
        </div>
      </Card>

      <div className="rounded-r-sm border border-warn-bd bg-warn-bg text-warn-ink px-3 py-2 text-sm">অনুমোদনের আগে কোনো টাকা নেওয়া বা অ্যাকাউন্ট খোলা হবে না। কোনো সুদ নেই।</div>
      <p className="text-[11px] text-mut text-center">এটি ডেমো আবেদন — বাস্তব সদস্যপদ তৈরি হয় না।</p>
    </div>
  );
}
