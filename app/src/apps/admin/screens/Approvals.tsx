/* ============================================================
   src/apps/admin/screens/Approvals.tsx — AM-02 অনুমোদন কিউ (+ AM-03 সিদ্ধান্ত)
   ফ্লো পর্দা: নেভ বন্ধ, ব্যাক বাধ্যতামূলক (specs/05 §৪)।
   ডেমো — কোনো সিদ্ধান্ত সংরক্ষিত হয় না, কোনো ডেটাবেস ছোঁয়া হয় না।
   ============================================================ */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Eye, X } from 'lucide-react';
import { Badge, Button, Card, DecisionBar, Row } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { approvals as seed, type DemoApproval } from '../../../demo/data';

export default function Approvals() {
  const navigate = useNavigate();
  const [items, setItems] = useState<DemoApproval[]>(seed);
  const [selected, setSelected] = useState<DemoApproval | null>(null);
  const [result, setResult] = useState<string>('');

  function decide(action: 'approve' | 'reject') {
    if (!selected) return;
    setResult(
      action === 'approve'
        ? `${selected.member}-এর ${selected.kind} অনুমোদিত হলো (ডেমো — সংরক্ষিত হয়নি)`
        : `${selected.member}-এর ${selected.kind} প্রত্যাখ্যাত হলো (ডেমো — সংরক্ষিত হয়নি)`,
    );
    setItems((prev) => prev.filter((x) => x.id !== selected.id));
    setSelected(null);
  }

  if (selected) {
    return (
      <div className="relative min-h-full flex flex-col">
        <div className="p-4 grow space-y-3">
          <Card title="অনুমোদনের সিদ্ধান্ত" sub={`${selected.member} · ${selected.kind}`}>
            <dl className="text-sm divide-y divide-line-2">
              {[
                ['সদস্য', selected.member],
                ['ধরন', selected.kind],
                ['অঙ্ক', selected.amount ? `৳${bn(selected.amount)}` : 'প্রযোজ্য নয়'],
                ['জমা দিয়েছেন', selected.by],
                ['সময়', selected.submitted],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-2">
                  <dt className="text-mut">{k}</dt>
                  <dd className="font-bold text-txt">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="text-xs text-mut mt-3">
              অনুমোদনে কোনো সুদ/মুনাফা যোগ হয় না — শুধু জমার অঙ্ক।
            </p>
          </Card>
          <Card title="যাচাই">
            <ul className="pl-5 text-sm text-txt-2 space-y-1.5">
              <li>সদস্যের পরিচয় ও সদস্য নম্বর মিলেছে</li>
              <li>জমার রসিদ ও অঙ্ক মিলেছে</li>
              <li>একই দিনে দ্বিগুণ জমা নেই</li>
            </ul>
          </Card>
        </div>
        <DecisionBar note={`${bn(items.length)}টি বাকি`}>
          <Button variant="secondary" icon={<X size={16} />} onClick={() => decide('reject')}>
            প্রত্যাখ্যান
          </Button>
          <Button icon={<Check size={16} />} onClick={() => decide('approve')}>
            অনুমোদন
          </Button>
        </DecisionBar>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      {result ? (
        <div className="rounded-r-md bg-ok-bg border border-ok-bd text-ok-ink px-4 py-3 text-sm font-bold">
          {result}
        </div>
      ) : null}

      <div className="flex items-center gap-2">
        <h2 className="text-h3 text-txt grow">অনুমোদনের অপেক্ষায়</h2>
        <Badge tone={items.length ? 'danger' : 'ok'}>{bn(items.length)}টি</Badge>
      </div>

      <div className="rounded-r-md border border-line bg-card overflow-hidden shadow-sh-1">
        {items.map((a) => (
          <Row
            key={a.id}
            title={a.member}
            sub={`${a.kind} · ${a.submitted} · ${a.by}`}
            right={
              <span className="text-right">
                <span className="num block font-bold text-txt">{a.amount ? `৳${bn(a.amount)}` : '—'}</span>
                <span className="text-xs text-green-700 font-bold">দেখুন</span>
              </span>
            }
            onClick={() => setSelected(a)}
          />
        ))}
        {items.length === 0 ? (
          <div className="px-4 py-10 text-center text-mut text-sm">
            সব অনুমোদন সম্পন্ন — ডেমো, কিছুই সংরক্ষিত হয়নি
          </div>
        ) : null}
      </div>

      <div className="flex gap-2">
        <Button variant="secondary" block icon={<Eye size={16} />} onClick={() => setSelected(items[0] ?? null)}>
          প্রথমটি খুলুন
        </Button>
        <Button variant="ghost" block onClick={() => navigate('/a/home')}>
          হোমে ফিরুন
        </Button>
      </div>

      <p className="text-xs text-mut text-center">
        ফ্লো পর্দা — নেভ বন্ধ, ব্যাক বাধ্যতামূলক (MC-03)।
      </p>
    </div>
  );
}
