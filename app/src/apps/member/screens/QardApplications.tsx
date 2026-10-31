/* ============================================================
   src/apps/member/screens/QardApplications.tsx — QM-05 আবেদন অবস্থা ও ইতিহাস
   প্রতিটি আবেদনের অবস্থা, সিদ্ধান্তের কারণ, কমিটি ও পরবর্তী ধাপ।
   ============================================================ */

import { useLocation, useNavigate } from 'react-router-dom';
import { Badge, Button, Card, SectionHead } from '../../../components/ui';
import { SuccessBanner } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useModules } from '../../../store/moduleStore';

const tone = (s: string) => (s === 'pending' ? 'warn' : s === 'disbursed' ? 'ok' : s === 'approved' ? 'info' : 'danger');
const text = (s: string) => (s === 'pending' ? 'অপেক্ষমাণ' : s === 'disbursed' ? 'বিতরণ হয়েছে' : s === 'approved' ? 'অনুমোদিত' : 'প্রত্যাখ্যাত');
const step = (s: string) => (s === 'pending' ? 2 : s === 'approved' ? 3 : s === 'disbursed' ? 4 : 2);

export default function QardApplications() {
  const navigate = useNavigate();
  const { applications, products } = useModules();
  const created = (useLocation().state as { created?: string } | null)?.created;

  return (
    <div className="p-4 space-y-4 pb-6">
      {created ? <SuccessBanner title="আবেদন জমা হয়েছে">আবেদন নম্বর {created} — কমিটি যাচাই করবে; সিদ্ধান্ত এলে নোটিফিকেশন পাবেন।</SuccessBanner> : null}

      <Card title="আমার আবেদন" sub={`${bn(applications.length)}টি · সুদ ৳০`}>
        <p className="text-sm text-txt-2">
          আবেদনের অবস্থা সবসময় দেখা যায়। প্রত্যাখ্যাত হলে কারণ লেখা থাকে এবং কী করলে আবার আবেদন করা যাবে তাও বলা থাকে।
        </p>
      </Card>

      {applications.map((a) => {
        const product = products.find((p) => p.id === a.productId);
        const s = step(a.status);
        return (
          <Card key={a.id} title={a.no} sub={`${a.submittedAt} · ${a.purpose}`} right={<Badge tone={tone(a.status)}>{text(a.status)}</Badge>}>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-xs text-mut">আবেদনের অঙ্ক</div>
                <div className="num text-h2 font-extrabold text-txt">৳{bn(a.amount)}</div>
              </div>
              <div className="text-right text-xs text-mut">{product?.name}</div>
            </div>

            <div className="mt-3 flex items-center gap-1">
              {['জমা', 'যাচাই', 'অনুমোদন', 'বিতরণ'].map((label, i) => (
                <div key={label} className="flex-1">
                  <div className={`h-1.5 rounded-r-pill ${i + 1 <= s ? 'bg-green-700' : 'bg-line-3'}`} />
                  <div className={`text-[10px] mt-1 ${i + 1 <= s ? 'text-green-700 font-bold' : 'text-mut'}`}>{label}</div>
                </div>
              ))}
            </div>

            <dl className="text-sm divide-y divide-line-2 mt-2">
              <div className="flex justify-between py-1.5">
                <dt className="text-mut">সিদ্ধান্ত</dt>
                <dd className="font-bold text-txt">{a.decidedAt ?? 'অপেক্ষমাণ'}</dd>
              </div>
              <div className="flex justify-between py-1.5">
                <dt className="text-mut">কমিটি</dt>
                <dd className="font-bold text-txt">{a.committee ?? 'নিয়োগ হবে'}</dd>
              </div>
              <div className="flex justify-between py-1.5">
                <dt className="text-mut">সুদ ৳০ (ফি নেই)</dt>
                <dd className="font-bold text-ok">প্রযোজ্য নয়</dd>
              </div>
              {a.reason ? (
                <div className="flex justify-between py-1.5">
                  <dt className="text-mut">কারণ</dt>
                  <dd className="font-bold text-danger text-right">{a.reason}</dd>
                </div>
              ) : null}
            </dl>

            <div className="grid grid-cols-2 gap-2 mt-2">
              {a.status === 'disbursed' ? (
                <Button size="sm" onClick={() => navigate('/m/qard/loans')}>ঋণ ও ছক</Button>
              ) : (
                <Button size="sm" variant="secondary" onClick={() => navigate('/m/qard/eligibility')}>যোগ্যতা</Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => navigate('/m/qard/products')}>পণ্য</Button>
            </div>
          </Card>
        );
      })}

      <SectionHead title="নতুন আবেদন" />
      <Button block onClick={() => navigate('/m/qard/apply')}>আবেদন করুন</Button>
      <Button block variant="ghost" onClick={() => navigate('/m/qard')}>কর্জে হাসানা হোম</Button>
    </div>
  );
}
