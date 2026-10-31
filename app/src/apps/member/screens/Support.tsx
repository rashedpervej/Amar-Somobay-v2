/* ============================================================
   src/apps/member/screens/Support.tsx — M-21 সহায়তা কেন্দ্র ও টিকিট
   সাধারণ প্রশ্নের উত্তর, টিকিট তৈরি (স্টোরে সংরক্ষিত) ও টিকিটের অবস্থা।
   ============================================================ */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, LifeBuoy, MessageSquarePlus, Phone, Send } from 'lucide-react';
import { Badge, Button, Card, Chip, Chipset } from '../../../components/ui';
import { ErrorBanner, Field, SuccessBanner, inputClass } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useMember } from '../../../store/memberStore';

const TOPICS = ['জমা ও রসিদ', 'উত্তোলন', 'কিস্তি ও বকেয়া', 'KYC ও নমিনি', 'অন্য কিছু'];

const FAQ: { q: string; a: string }[] = [
  { q: 'জমা দেওয়ার সাথে সাথে রসিদ পাব কীভাবে?', a: 'জমা নিশ্চিত করার পরই রসিদ নম্বরসহ ডিজিটাল রসিদ তৈরি হয়, যা ডাউনলোড বা প্রিন্ট করা যায় (M-07/M-09)।' },
  { q: 'উত্তোলনে কত সময় লাগে?', a: 'আবেদন যাচাই ও অনুমোদনের পর সাধারণত ২ কর্মদিবসের মধ্যে বিতরণ হয়। বর্তমানে অপেক্ষমাণ আবেদন M-11-এ দেখা যায়।' },
  { q: 'কোনো সুদ বা মুনাফা কি যোগ হয়?', a: 'না। এই সংস্থায় সঞ্চয়ে শতাংশভিত্তিক মুনাফা দেওয়া হয় না (নীতি D-01)। আপনার জমা যেমন আছে তেমনই থাকে।' },
  { q: 'বকেয়া কিস্তি কীভাবে শোধ করব?', a: 'M-13 বকেয়া পর্দা থেকে "জমা দিন" চাপলে নির্দিষ্ট কিস্তির অঙ্কসহ জমার ফর্ম খুলবে।' },
];

export default function Support() {
  const { state, createTicket } = useMember();
  const navigate = useNavigate();
  const [topic, setTopic] = useState(TOPICS[0]);
  const [reference, setReference] = useState('');
  const [body, setBody] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [flash, setFlash] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [busy, setBusy] = useState(false);

  async function submit() {
    const e: Record<string, string> = {};
    if (body.trim().length < 10) e.body = 'সমস্যাটি অন্তত ১০ অক্ষরে লিখুন';
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setBusy(true);
    try {
      const t = await createTicket({ subject: reference ? `${topic} · ${reference}` : topic, body: body.trim() });
      setBody('');
      setReference('');
      setFlash(`টিকিট তৈরি হয়েছে — নম্বর ${t.id}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-4 space-y-4">
      {flash ? <SuccessBanner title="টিকিট জমা হয়েছে">{flash}</SuccessBanner> : null}

      <Card title="সহায়তা" sub="প্রশ্নের উত্তর বা টিকিট — দুটোই এখানে" right={<LifeBuoy size={18} className="text-green-700" />}>
        <div className="grid grid-cols-2 gap-2">
          <a href="tel:+8801700000000" className="min-h-tap rounded-r-sm bg-green-050 border border-line-2 flex flex-col items-center justify-center gap-1 text-xs font-bold text-green-800">
            <Phone size={16} /> হেল্পলাইন
          </a>
          <button type="button" onClick={() => navigate('/m/notices')} className="min-h-tap rounded-r-sm bg-card-2 border border-line flex flex-col items-center justify-center gap-1 text-xs font-bold text-txt-2">
            <MessageSquarePlus size={16} /> নোটিশ বোর্ড
          </button>
        </div>
        <p className="text-xs text-mut mt-2">শনি–বৃহস্পতি, সকাল ১০টা – বিকেল ৫টা · শুক্রবার বন্ধ</p>
      </Card>

      <Card title="সাধারণ প্রশ্ন" sub="অনেকে যা জিজ্ঞেস করেন">
        <div className="divide-y divide-line-2">
          {FAQ.map((f, i) => (
            <div key={f.q}>
              <button type="button" onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full min-h-tap py-2 flex items-start gap-2 text-left">
                <span className="grow text-sm font-bold text-txt">{f.q}</span>
                <ChevronDown size={16} className={`text-mut shrink-0 mt-0.5 transition ${openFaq === i ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === i ? <p className="text-sm text-txt-2 pb-3 leading-relaxed">{f.a}</p> : null}
            </div>
          ))}
        </div>
      </Card>

      <Card title="নতুন টিকিট" sub="সমস্যার ধরন বেছে নিন" right={<Badge tone="brand">M-21</Badge>}>
        <Chipset>
          {TOPICS.map((t) => (
            <Chip key={t} active={topic === t} onClick={() => setTopic(t)}>
              {t}
            </Chip>
          ))}
        </Chipset>
        <div className="space-y-3 mt-3">
          <Field label="রেফারেন্স নম্বর (ঐচ্ছিক)" hint="রসিদ বা উত্তোলনের নম্বর থাকলে দিন">
            {(id) => <input id={id} value={reference} onChange={(e) => setReference(e.target.value)} className={inputClass() + ' num'} placeholder="RCP-১০২৫" />}
          </Field>
          <Field label="সমস্যার বিবরণ" required error={errors.body}>
            {(id) => (
              <textarea
                id={id}
                rows={4}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className={inputClass(errors.body) + ' py-2 min-h-[96px]'}
                placeholder="কী ঘটেছে, কবে — সংক্ষেপে লিখুন"
              />
            )}
          </Field>
          {Object.keys(errors).length > 0 ? <ErrorBanner>বিবরণ লিখুন</ErrorBanner> : null}
          <Button block icon={<Send size={16} />} onClick={submit} disabled={busy}>
            {busy ? 'পাঠানো হচ্ছে…' : 'টিকিট জমা দিন'}
          </Button>
        </div>
      </Card>

      {state.tickets.length > 0 ? (
        <Card title="আমার টিকিট" sub={`${bn(state.tickets.length)} টি`}>
          <ul className="divide-y divide-line-2">
            {state.tickets.map((t) => (
              <li key={t.id} className="py-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-txt truncate grow">{t.subject}</span>
                  <Badge tone={t.status === 'answered' ? 'ok' : 'warn'}>{t.status === 'answered' ? 'উত্তর দেওয়া' : 'খোলা'}</Badge>
                </div>
                <div className="text-xs text-mut mt-0.5">
                  {t.id} · {t.at}
                </div>
                <p className="text-sm text-txt-2 mt-1">{t.body}</p>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
