import { useEffect, useState } from 'react';
import { Card, Button, Badge, Chip, Chipset, Kpi, KpiGrid, SectionHead, DataTable, PolicyBanner, Row } from '../components/ui';
import { bn, tk, money } from '../lib/money.mjs';

/* ============================================================
   ডিজাইন সিস্টেম পৃষ্ঠা — প্রোটোটাইপের টোকেন হুবহু কাজ করছে কিনা তার প্রমাণ।
   মানগুলো রানটাইমে getComputedStyle থেকে পড়া হয় (হার্ডকোড নয়)।
   ============================================================ */

const COLOR_TOKENS = [
  ['--green-900', 'ব্র্যান্ড ৯০০'], ['--green-800', 'ব্র্যান্ড ৮০০'], ['--green-700', 'ব্র্যান্ড ৭০০ (প্রাথমিক)'],
  ['--green-600', 'ব্র্যান্ড ৬০০'], ['--green-500', 'ব্র্যান্ড ৫০০'], ['--green-100', 'ব্র্যান্ড ১০০'],
  ['--green-050', 'ব্র্যান্ড ০৫০'], ['--lime', 'অ্যাকসেন্ট (লাইম)'], ['--lime-soft', 'অ্যাকসেন্ট নরম'],
  ['--paper', 'পৃষ্ঠতল'], ['--card', 'কার্ড'], ['--card-2', 'কার্ড বিকল্প'],
  ['--line', 'সীমানা'], ['--line-2', 'সীমানা হালকা'], ['--line-3', 'সীমানা গাঢ়'],
  ['--txt', 'মূল টেক্সট'], ['--txt-2', 'টেক্সট ২'], ['--mut', 'ম্লান'], ['--mut-2', 'ম্লান ২'],
  ['--ok', 'সফল'], ['--ok-bg', 'সফল পটভূমি'], ['--warn', 'সতর্ক'], ['--warn-bg', 'সতর্ক পটভূমি'],
  ['--danger', 'বিপদ'], ['--danger-bg', 'বিপদ পটভূমি'], ['--info', 'তথ্য'], ['--info-bg', 'তথ্য পটভূমি'],
  ['--neutral', 'নিরপেক্ষ'], ['--purple', 'বেগুনি'],
  ['--qh-emerald-700', 'কর্জে হাসানা ৭০০'], ['--qh-gold', 'কর্জে হাসানা সোনালি'],
  ['--qh-gold-deep', 'কর্জে হাসানা সোনালি (টেক্সট, AA)'],
] as const;

const SIZE_TOKENS = [
  ['--r-xs', 'রেডিয়াস xs'], ['--r-sm', 'রেডিয়াস sm'], ['--r-md', 'রেডিয়াস md'],
  ['--r-lg', 'রেডিয়াস lg'], ['--r-xl', 'রেডিয়াস xl'], ['--r-pill', 'রেডিয়াস pill'],
  ['--fs-display', 'ফন্ট display'], ['--fs-hero', 'ফন্ট hero'], ['--fs-h1', 'ফন্ট h1'],
  ['--fs-h2', 'ফন্ট h2'], ['--fs-h3', 'ফন্ট h3'], ['--fs-body', 'ফন্ট body'],
  ['--fs-body-l', 'ফন্ট body-l'], ['--fs-sm', 'ফন্ট sm'], ['--fs-xs', 'ফন্ট xs'],
  ['--lh', 'লাইন-উচ্চতা'], ['--tap', 'ট্যাপ টার্গেট'], ['--tap-lg', 'ট্যাপ বড়'],
] as const;

const DEMO_ROWS = [
  { id: 'r1', name: 'আব্দুল করিম', amount: 187500, status: 'সক্রিয়', tone: 'ok' as const },
  { id: 'r2', name: 'সুমি রানী দাস', amount: 42000, status: 'বকেয়া', tone: 'warn' as const },
  { id: 'r3', name: 'মোঃ আব্দুল্লাহ', amount: 0, status: 'বন্ধ', tone: 'danger' as const },
];

export default function DesignSystemPage() {
  const [vars, setVars] = useState<Record<string, string>>({});
  const [qh, setQh] = useState(false);

  useEffect(() => {
    const read = () => {
      const cs = getComputedStyle(document.documentElement);
      const out: Record<string, string> = {};
      for (const [name] of [...COLOR_TOKENS, ...SIZE_TOKENS]) out[name] = cs.getPropertyValue(name).trim();
      setVars(out);
    };
    read();
    document.documentElement.dataset.theme = qh ? 'qh' : '';
    const t = setTimeout(read, 30);
    return () => clearTimeout(t);
  }, [qh]);

  return (
    <div className="space-y-4">
      <PolicyBanner tone="brand" title="চূড়ান্ত ডিজাইন ভিত্তি = নতুন প্রোটোটাইপ">
        রঙ, টাইপোগ্রাফি, স্পেসিং, কর্নার রেডিয়াস ও লেআউট প্রোটোটাইপ (<span className="num">prototype/assets/ui.css</span>) থেকে হুবহু পোর্ট করা।
        পুরনো অ্যাপের UI এখানে চাপানো হয়নি। প্রতিটি মান <span className="num">tests/d03-design-tokens.mjs</span> দিয়ে যাচাই করা।
      </PolicyBanner>

      <SectionHead title="রঙের তালিকা" sub="রানটাইমে computed value পড়ে দেখানো হচ্ছে"
        right={<Chipset><Chip active={!qh} onClick={() => setQh(false)}>ডিফল্ট</Chip><Chip active={qh} onClick={() => setQh(true)}>কর্জে হাসানা থিম</Chip></Chipset>} />
      <Card pad={false}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px bg-line-2">
          {COLOR_TOKENS.map(([name, label]) => (
            <div key={name} className="bg-card p-3">
              <div className="h-10 rounded-r-sm border border-line" style={{ background: `var(${name})` }} />
              <div className="mt-2 text-sm font-bold text-txt truncate">{label}</div>
              <div className="num text-xs text-mut truncate">{name}</div>
              <div className="num text-xs text-mut-2 truncate">{vars[name] || '—'}</div>
            </div>
          ))}
        </div>
      </Card>

      <SectionHead title="রেডিয়াস, টাইপ স্কেল ও ট্যাপ টার্গেট" />
      <Card>
        <div className="flex flex-wrap gap-3">
          {(['--r-xs', '--r-sm', '--r-md', '--r-lg', '--r-xl'] as const).map((r) => (
            <div key={r} className="w-20 h-20 bg-green-100 border-2 border-green-600 grid place-items-center num text-xs text-green-800"
              style={{ borderRadius: `var(${r})` }}>{vars[r]}</div>
          ))}
          <div className="w-24 h-20 bg-lime-soft border-2 border-green-600 grid place-items-center num text-xs text-green-800"
            style={{ borderRadius: 'var(--r-pill)' }}>pill</div>
        </div>
        <div className="mt-5 space-y-2">
          <div style={{ fontSize: 'var(--fs-display)' }} className="font-extrabold leading-none">ডিসপ্লে <span className="num">{vars['--fs-display']}</span></div>
          <div style={{ fontSize: 'var(--fs-h1)' }} className="font-bold">শিরোনাম ১ <span className="num text-mut">{vars['--fs-h1']}</span></div>
          <div style={{ fontSize: 'var(--fs-h2)' }} className="font-bold">শিরোনাম ২ <span className="num text-mut">{vars['--fs-h2']}</span></div>
          <div style={{ fontSize: 'var(--fs-h3)' }} className="font-bold">শিরোনাম ৩</div>
          <div style={{ fontSize: 'var(--fs-body)' }}>মূল টেক্সট — বাংলা প্রথম, লাইন-উচ্চতা <span className="num">{vars['--lh']}</span></div>
          <div style={{ fontSize: 'var(--fs-sm)' }} className="text-txt-2">ছোট টেক্সট (সহায়ক তথ্য)</div>
          <div style={{ fontSize: 'var(--fs-xs)' }} className="text-mut">অতি ছোট টেক্সট (ফুটার/নোট)</div>
        </div>
      </Card>

      <SectionHead title="বাটন" sub="ন্যূনতম উচ্চতা ৪৮px (--tap)" />
      <Card>
        <div className="flex flex-wrap gap-2">
          <Button>প্রাথমিক</Button>
          <Button variant="secondary">দ্বিতীয়</Button>
          <Button variant="ghost">ঘোস্ট</Button>
          <Button variant="danger">বিপদ</Button>
          <Button variant="gold">কর্জে হাসানা</Button>
          <Button disabled>নিষ্ক্রিয়</Button>
          <Button size="sm" variant="secondary">ছোট</Button>
          <Button size="lg">বড়</Button>
        </div>
        <div className="mt-4">
          <Button block>পূর্ণ প্রস্থ (মোবাইল প্রাথমিক ক্রিয়া)</Button>
        </div>
      </Card>

      <SectionHead title="ব্যাজ, চিপ ও স্ট্যাটাস রঙ" sub="স্ট্যাটাসের অর্থ কোনো থিমে বদলায় না" />
      <Card>
        <Chipset>
          <Badge tone="ok" dot>অনুমোদিত</Badge>
          <Badge tone="warn" dot>অপেক্ষমাণ</Badge>
          <Badge tone="danger" dot>বকেয়া</Badge>
          <Badge tone="info" dot>তথ্য</Badge>
          <Badge tone="neutral">খসড়া</Badge>
          <Badge tone="purple">যৌথ লক্ষ্য</Badge>
          <Badge tone="brand">সুদ ৳০</Badge>
        </Chipset>
        <div className="mt-4">
          <Chipset>
            <Chip active>সব</Chip><Chip>সক্রিয়</Chip><Chip>অপেক্ষমাণ</Chip><Chip>বন্ধ</Chip>
          </Chipset>
        </div>
      </Card>

      <SectionHead title="KPI ও সংখ্যা" sub="সব অঙ্ক বাংলায়; অর্থ paisa → টাকা" />
      <KpiGrid cols={4}>
        <Kpi label="মোট সঞ্চয়" value={tk(125000000)} unit="টাকা" tone="ok" note="সব সদস্য মিলিয়ে" />
        <Kpi label="আদায়" value={tk(2641666)} unit="টাকা" note={`${bn(26)}টি রশিদ`} />
        <Kpi label="বকেয়া" value={tk(6500000)} unit="টাকা" tone="warn" note={`${bn(3)} জন সদস্য`} />
        <Kpi label="সুদ ৳০" value="০" unit="টাকা" tone="brand" note="নীতি D-01 — সম্পূর্ণ সুদমুক্ত" />
      </KpiGrid>

      <SectionHead title="টেবিল" sub="মোবাইলে সর্বোচ্চ ৪ কলাম (প্রোটোটাইপের নিয়ম)" />
      <DataTable
        caption="নমুনা সদস্য তালিকা"
        columns={[
          { key: 'name', head: 'সদস্য' },
          { key: 'amount', head: 'জমা', align: 'right', mono: true, render: (r) => money(r.amount) },
          { key: 'status', head: 'অবস্থা', render: (r) => <Badge tone={r.tone}>{r.status}</Badge> },
        ]}
        rows={DEMO_ROWS}
      />

      <SectionHead title="তালিকা সারি (Row)" sub="মোবাইল নেভিগেশনের মূল একক" />
      <Card pad={false}>
        <Row title="কর্জে হাসানা" sub="সুদমুক্ত সহায়তা তহবিল" right={<Badge tone="warn">জানালা বন্ধ</Badge>} onClick={() => {}} />
        <Row title="সাধারণ সঞ্চয়" sub={`${bn(3)}টি স্কিম · ${money(125000000)}`} right={<span className="text-mut">›</span>} onClick={() => {}} />
        <Row title="ঘূর্ণায়মান সঞ্চয় (ROSCA)" sub={`${bn(1)}টি সক্রিয় চক্র`} right={<span className="text-mut">›</span>} onClick={() => {}} />
        <Row title="যৌথ লক্ষ্য" sub={`${bn(2)}টি চলমান লক্ষ্য`} right={<span className="text-mut">›</span>} />
      </Card>

      <SectionHead title="টোকেন মান (সব)" sub="প্রোটোটাইপের সঙ্গে হুবহু মিল — d03 হার্নেস যাচাই করে" />
      <Card pad={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead><tr className="bg-card-2"><th className="text-left px-3 py-2 text-xs text-mut">টোকেন</th><th className="text-left px-3 py-2 text-xs text-mut">ব্যবহার</th><th className="text-left px-3 py-2 text-xs text-mut">মান</th></tr></thead>
            <tbody>
              {[...SIZE_TOKENS].map(([name, label]) => (
                <tr key={name} className="border-b border-line-2">
                  <td className="num px-3 py-2 text-mut">{name}</td>
                  <td className="px-3 py-2">{label}</td>
                  <td className="num px-3 py-2 font-bold">{vars[name] || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
