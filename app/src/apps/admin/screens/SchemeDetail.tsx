/* ============================================================
   src/apps/admin/screens/SchemeDetail.tsx — AM-26 স্কিম বিবরণ ও পরিসংখ্যান
   স্কিম চিপ · সবুজ হিরো · ৪ KPI · অ্যাকর্ডিয়নে কিস্তি/মেয়াদ, উত্তোলনের নিয়ম,
   ফি, অবস্থা · সংস্করণ-পিনিং নীতি · সব স্কিমের তুলনা (ট্যাপ → সম্পাদনা)।
   ============================================================ */

import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Badge, Button, Card, Kpi, KpiGrid, SectionHead } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import { SCH_STATUS, schemeById } from '../../../domain/adminOps';
import { Accordion, Hero, KV, Note } from './parts';

export default function SchemeDetail() {
  const { schemeId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const roleQS = params.get('role') ? `?role=${params.get('role')}` : '';
  const { state } = useAdmin();
  const s = schemeById(state.schemes, schemeId) ?? state.schemes[0];
  const accounts = state.accounts.filter((a) => a.scheme === s.name);
  const dues = state.dues.filter((d) => accounts.some((a) => a.id === d.accId));
  const dueAmt = dues.reduce((x, d) => x + (d.amount - d.paid), 0);
  const postedTotal = accounts.reduce((x, a) => x + a.posted, 0);
  const holdTotal = accounts.reduce((x, a) => x + a.hold, 0);

  return (
    <div className="p-4 space-y-3 pb-6">
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {state.schemes.map((x) => (
          <button key={x.id} type="button" onClick={() => navigate(`/a/schemes/${x.id}${roleQS}`)}
            className={`min-h-tap shrink-0 px-3 rounded-r-pill border text-sm font-bold ${x.id === s.id ? 'bg-green-700 text-white border-green-800' : 'bg-card text-txt-2 border-line-3'}`}>
            {x.name}
          </button>
        ))}
      </div>

      <Hero label={`${s.code} · ${s.typeBn} · সংস্করণ ${bn(s.version)} (D-32)`} amount={s.name} sub={s.desc}
        chips={<>
          <span className="text-xs">{bn(s.members)} সদস্য</span>
          <span className="text-xs">সঞ্চয় ৳{bn(s.total)}</span>
          <span className="text-xs">কিস্তি ৳{bn(s.installment)}</span>
          <Badge tone={SCH_STATUS[s.status].tone}>{SCH_STATUS[s.status].t}</Badge>
        </>} />

      <KpiGrid>
        <Kpi label="সক্রিয় অ্যাকাউন্ট" value={bn(accounts.length)} tone="ok" note={`মোট ৳${bn(postedTotal)}`} />
        <Kpi label="বকেয়া" value={`৳${bn(dueAmt)}`} tone={dueAmt ? 'danger' : 'ok'} note={`${bn(dues.length)}টি কিস্তি`} />
        <Kpi label="গড় ব্যালেন্স" value={`৳${bn(accounts.length ? Math.round(postedTotal / accounts.length) : 0)}`} note="প্রতি অ্যাকাউন্টে" />
        <Kpi label="হোল্ড" value={`৳${bn(holdTotal)}`} tone="warn" note="উত্তোলন আবেদনে আটক" />
      </KpiGrid>

      <Accordion title="কিস্তি ও মেয়াদ" sub={s.typeBn} defaultOpen>
        <KV k="কিস্তির পরিমাণ" v={`৳${bn(s.installment)} (${s.type === 'monthly' ? 'নির্ধারিত' : s.typeBn})`} />
        <KV k="মেয়াদ" v={s.tenure ? `${bn(s.tenure)} মাস` : 'চলমান (কোনো মেয়াদ নেই)'} />
        <KV k="লক-ইন" v={s.lockIn ? `${bn(s.lockIn)} মাস — এর আগে তোলা যাবে না` : 'নেই'} />
        <KV k="অতিরিক্ত জমা" v={s.extra ? 'অনুমোদিত' : 'অনুমোদিত নয়'} />
        <KV k="গ্রেস পিরিয়ড" v={`${bn(s.graceDays)} দিন (D-07)`} />
      </Accordion>

      <Accordion title="উত্তোলনের নিয়ম" sub={`নোটিশ ${bn(s.noticeDays)} দিন`}>
        <KV k="নোটিশ পিরিয়ড" v={`${bn(s.noticeDays)} দিন (D-02)`} />
        <KV k="মাসে সর্বোচ্চ" v={`${bn(s.maxPerMonth)}বার`} />
        <KV k="একবারে সর্বোচ্চ" v={`৳${bn(s.maxAmount)}`} />
        <KV k="সর্বনিম্ন ব্যালেন্স রাখতে হবে" v={`৳${bn(s.minBalance)}`} />
        <KV k="উত্তোলনযোগ্য হিসাব" v="posted − hold − সর্বনিম্ন − লক-ইন (R-01)" />
      </Accordion>

      <Accordion title="ফি ও চার্জ" sub="সুদ নেই">
        <KV k="ভর্তি ফি" v={`৳${bn(s.fees.admission)} (D-05)`} />
        <KV k="বার্ষিক চাঁদা" v={`৳${bn(s.fees.annual)}`} />
        <KV k="উত্তোলন ফি" v={`৳${bn(s.fees.withdrawal)} (৳১০,০০০-এর বেশি হলে)`} />
        <KV k="বিলম্ব ফি" v={`৳${bn(s.lateFee)} · বছরে সর্বোচ্চ ৳${bn(20000)} (D-08)`} />
        <KV k="সুদ / মুনাফা" v={<b>৳০ — কোনো সুদ নেই (D-01)</b>} />
      </Accordion>

      <Accordion title="অবস্থা ও নামভর্তি" sub={SCH_STATUS[s.status].t}>
        <KV k="বর্তমান অবস্থা" v={<Badge tone={SCH_STATUS[s.status].tone}>{SCH_STATUS[s.status].t}</Badge>} />
        {s.closedNewOn ? <KV k="নতুন নামভর্তি বন্ধ" v={s.closedNewOn} /> : null}
        {s.closedReason ? <Note tone="warn"><><b>নতুন নামভর্তি বন্ধ</b> — {s.closedReason}</></Note> : null}
        <KV k="বিদ্যমান সদস্যের কিস্তি" v="চলবে — বন্ধ হবে না" />
      </Accordion>

      <Note tone="warn"><><b>নিয়ম বদলালে পুরনো অ্যাকাউন্টে লাগবে না</b> — প্রতিটি অ্যাকাউন্ট খোলার সময়ের <b>স্কিম সংস্করণে</b> আটকানো থাকে। নিয়ম বদলালে নতুন সংস্করণ তৈরি হয়; বিদ্যমান সদস্যের কিস্তি, নোটিশ পিরিয়ড বা ফি বদলায় না (D-32/D-23)।</></Note>

      <Card title="সব স্কিমের তুলনা" sub="ট্যাপ করলে স্কিম সম্পাদনা">
        <div className="divide-y divide-line-2">
          {state.schemes.map((x) => (
            <button key={x.id} type="button" onClick={() => navigate(`/a/schemes/${x.id}/edit${roleQS}`)}
              className="w-full min-h-tap text-left py-2.5 flex items-center gap-2">
              <span className="grow min-w-0">
                <span className="block text-sm font-bold">{x.name}</span>
                <span className="block text-xs text-mut">{x.code} · কিস্তি ৳{bn(x.installment)} · {bn(x.members)} সদস্য · লক-ইন {x.lockIn ? `${bn(x.lockIn)} মাস` : 'নেই'}</span>
              </span>
              <span className="num text-sm font-bold shrink-0">৳{bn(x.total)}</span>
            </button>
          ))}
        </div>
      </Card>

      <div className="flex gap-2">
        <Button variant="ghost" className="grow" onClick={() => navigate(`/a/reports${roleQS}`)}>রিপোর্ট</Button>
        <Button variant="secondary" className="grow" onClick={() => navigate(`/a/dues${roleQS}`)}>এই স্কিমের বকেয়া</Button>
        <Button className="grow" onClick={() => navigate(`/a/schemes/${s.id}/edit${roleQS}`)}>নিয়ম সম্পাদনা</Button>
      </div>
      <SectionHead title="সংস্করণ" sub={`বর্তমান v${bn(s.version)}`} />
      <p className="text-sm text-txt-2">সম্পাদনা করলে <b>নতুন সংস্করণ</b> তৈরি হবে — পুরনো সংস্করণের অ্যাকাউন্ট অপরিবর্তিত থাকবে; কমিটির সিদ্ধান্ত নম্বর লাগবে।</p>
    </div>
  );
}
