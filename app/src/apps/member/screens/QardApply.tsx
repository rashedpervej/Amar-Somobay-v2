/* ============================================================
   src/apps/member/screens/QardApply.tsx — QM-04 সহায়তার আবেদনপত্র
   পণ্য → অঙ্ক (সীমার মধ্যে) → মেয়াদ ও উদ্দেশ্য → কাগজপত্র → সম্মতি → জমা।
   জমা হলে আবেদন "অপেক্ষমাণ" হিসেবে স্টোরে যায় ও সেখানে দেখা যায়।
   ============================================================ */

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Send, ShieldCheck } from 'lucide-react';
import { Badge, Button, Card, Chip, Chipset } from '../../../components/ui';
import { ErrorBanner, Field, inputClass } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useMember } from '../../../store/memberStore';
import { useModules } from '../../../store/moduleStore';
import { eligibility } from '../../../domain/qard';

const PURPOSES = ['চিকিৎসা', 'কৃষি উপকরণ', 'শিক্ষা', 'ক্ষুদ্র ব্যবসা', 'অন্য কিছু'];

export default function QardApply() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { state, payable } = useMember();
  const { products, loans, applications, applyQard } = useModules();
  const active = loans.filter((l) => l.status === 'active' || l.status === 'arrears');
  const el = eligibility({ kycVerified: state.profile.kycStatus === 'verified', memberMonths: 14, duesTotal: payable, hasActive: active.length > 0 }, 40000);

  const first = products.find((p) => p.id === params.get('product')) ?? products[0];
  const [productId, setProductId] = useState(first.id);
  const product = products.find((p) => p.id === productId) ?? products[0];
  const [amount, setAmount] = useState<number | ''>(10000);
  const [tenure, setTenure] = useState(product.tenureMax);
  const [purpose, setPurpose] = useState('চিকিৎসা');
  const [detail, setDetail] = useState('');
  const [docs, setDocs] = useState<Record<string, boolean>>({ nid: true, bill: false });
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const value = typeof amount === 'number' ? amount : 0;
  const cap = Math.min(product.max, el.max);
  const docsOk = docs.nid && docs.bill;

  function validate() {
    const e: Record<string, string> = {};
    if (!value) e.amount = 'অঙ্ক লিখুন';
    else if (value < 1000) e.amount = 'সর্বনিম্ন ৳১,০০০';
    else if (value > cap) e.amount = `এই পণ্যে সর্বোচ্চ ৳${bn(cap)}`;
    if (detail.trim().length < 10) e.detail = 'উদ্দেশ্য অন্তত ১০ অক্ষরে লিখুন';
    if (!docsOk) e.docs = 'NID ও খরচের প্রমাণ সংযুক্ত করুন';
    if (!agree) e.agree = 'শর্তে সম্মতি দিন';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit() {
    if (!validate()) return;
    setBusy(true);
    try {
      const app = await applyQard({ amount: value, purpose, productId, tenure });
      navigate('/m/qard/applications', { state: { created: app.no } });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-4 space-y-4 pb-6">
      <button type="button" onClick={() => navigate(-1)} className="min-h-tap flex items-center gap-1.5 text-sm font-bold text-green-700">
        <ArrowLeft size={16} /> ফিরে যান
      </button>

      <Card
        title="সহায়তার আবেদন"
        sub={`যোগ্যতা: ${el.state === 'eligible' ? 'যোগ্য' : el.state === 'conditional' ? 'শর্তসাপেক্ষ' : 'সীমিত'} · সীমা ৳${bn(el.max)}`}
        right={<Badge tone="ok">সুদ ৳০</Badge>}
      >
        <div className="text-xs font-bold text-mut mb-1.5">পণ্য বেছে নিন</div>
        <div className="space-y-2">
          {products.map((p) => {
            const on = p.id === productId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => { setProductId(p.id); setTenure(p.tenureMax); setErrors({}); }}
                className={`w-full min-h-tap text-left rounded-r-sm border px-3 py-2 flex items-center gap-2 ${on ? 'border-green-700 bg-green-050' : 'border-line bg-card'}`}
              >
                <span className={`w-4 h-4 rounded-r-pill border-2 shrink-0 ${on ? 'border-green-700 bg-green-700' : 'border-line-3'}`} />
                <span className="grow">
                  <span className="block text-sm font-bold text-txt">{p.name}</span>
                  <span className="block text-xs text-mut">
                    সর্বোচ্চ ৳{bn(p.max)} · {bn(p.tenureMin)}–{bn(p.tenureMax)} কিস্তি
                  </span>
                </span>
                {on ? <Badge tone="ok">নির্বাচিত</Badge> : null}
              </button>
            );
          })}
        </div>
      </Card>

      <Card title="অঙ্ক ও মেয়াদ" sub={`এই পণ্যে সর্বোচ্চ ৳${bn(cap)}`}>
        <Field label="সহায়তার অঙ্ক (৳)" required error={errors.amount}>
          {(id) => (
            <input
              id={id}
              type="number"
              inputMode="numeric"
              value={amount}
              onChange={(e) => { setAmount(e.target.value === '' ? '' : Number(e.target.value)); setErrors({}); }}
              className={inputClass(errors.amount) + ' num min-h-tap text-h3 font-extrabold'}
            />
          )}
        </Field>
        <div className="mt-2">
          <Chipset>
            {[5000, 10000, 20000, cap].map((v) => (
              <Chip key={v} active={amount === v} onClick={() => setAmount(v)}>৳{bn(v)}</Chip>
            ))}
          </Chipset>
        </div>
        <Field label="কিস্তির সংখ্যা" required hint={`প্রতি কিস্তি ৳${bn(value ? Math.round(value / tenure) : 0)} · সুদ ৳০`}>
          {(id) => (
            <select id={id} value={tenure} onChange={(e) => setTenure(Number(e.target.value))} className={inputClass()}>
              {Array.from({ length: product.tenureMax - product.tenureMin + 1 }, (_, i) => product.tenureMin + i).map((t) => (
                <option key={t} value={t}>{bn(t)} কিস্তি</option>
              ))}
            </select>
          )}
        </Field>
        <p className="text-xs text-mut mt-1">
          প্রত্যাশিত পরিশোধ ৳{bn(value)} (শুধু মূলধন) · কোনো সুদ/ফি যোগ হবে না।
        </p>
      </Card>

      <Card title="উদ্দেশ্য" sub="যে কাজে সহায়তা লাগবে">
        <Chipset>
          {PURPOSES.map((p) => (
            <Chip key={p} active={purpose === p} onClick={() => setPurpose(p)}>{p}</Chip>
          ))}
        </Chipset>
        <Field label="বিস্তারিত" required error={errors.detail}>
          {(id) => (
            <textarea
              id={id}
              rows={3}
              value={detail}
              onChange={(e) => { setDetail(e.target.value); setErrors({}); }}
              className={inputClass(errors.detail) + ' py-2 min-h-[84px]'}
              placeholder="কী কাজে লাগবে, কোথায় — সংক্ষেপে লিখুন"
            />
          )}
        </Field>
      </Card>

      <Card title="কাগজপত্র" sub="আবেদনের সাথে সংযুক্ত করুন" right={<ShieldCheck size={16} className="text-mut" />}>
        <div className="space-y-2">
          {[
            ['nid', 'NID / জন্ম নিবন্ধন কপি'],
            ['bill', purpose === 'চিকিৎসা' ? 'হাসপাতালের প্রেসক্রিপশন/বিল' : 'খরচের প্রমাণ (কোটেশন/বিল)'],
          ].map(([k, label]) => (
            <label key={k} className="flex items-center gap-2 min-h-tap rounded-r-sm border border-line bg-card px-3">
              <input type="checkbox" checked={!!docs[k]} onChange={(e) => { setDocs((d) => ({ ...d, [k]: e.target.checked })); setErrors({}); }} className="w-5 h-5" />
              <span className="text-sm text-txt-2">{label}</span>
            </label>
          ))}
        </div>
        {errors.docs ? <p className="text-xs text-danger font-bold mt-1">{errors.docs}</p> : null}
      </Card>

      <label className="flex items-start gap-2 py-1">
        <input type="checkbox" checked={agree} onChange={(e) => { setAgree(e.target.checked); setErrors({}); }} className="mt-1 w-5 h-5" />
        <span className="text-xs text-txt-2 leading-relaxed">
          আমি জানি এই সহায়তায় <b>কোনো সুদ, মুনাফা বা ফি নেই</b>; শুধু অনুমোদিত মূলধন ফেরত দিতে হবে। মিথ্যা তথ্য দিলে আবেদন বাতিল হতে পারে।
        </span>
      </label>
      {errors.agree ? <p className="text-xs text-danger font-bold">{errors.agree}</p> : null}

      <div className="rounded-r-sm bg-info-bg border border-info-bd text-info-ink px-3 py-2 text-xs">
        এখন পর্যন্ত জমা: {bn(applications.length)}টি আবেদন · চলমান ঋণ {bn(active.length)}টি। অনুমোদন হলে কমিটি ও maker≠checker যাচাই হয়।
      </div>

      {Object.keys(errors).length ? <ErrorBanner>উপরের তথ্যগুলো ঠিক করুন</ErrorBanner> : null}

      <Button block size="lg" icon={<Send size={17} />} onClick={submit} disabled={busy}>
        {busy ? 'জমা হচ্ছে…' : 'আবেদন জমা দিন'}
      </Button>

      <Button block variant="ghost" icon={<CheckCircle2 size={15} />} onClick={() => navigate('/m/qard/applications')}>
        আমার আবেদন দেখুন
      </Button>
    </div>
  );
}
