/* ============================================================
   src/apps/admin/screens/Finance.tsx — AM-24 আর্থিক বিবরণ ও রেগুলেটরি রিটার্ন
   সবুজ হিরো · শূন্য-সুদের ঘোষণা · অ্যাকর্ডিয়নে আয়-ব্যয়, উদ্বৃত্তপত্র,
   নগদ প্রবাহ, স্কিম সারাংশ, সদস্য পরিসংখ্যান, রিটার্ন · সাইন-অফ অ্যাকশন।
   ============================================================ */

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Printer, ShieldCheck, TrendingDown, TrendingUp } from 'lucide-react';
import { Badge, Button, Card, Kpi, KpiGrid, SectionHead } from '../../../components/ui';
import { ErrorBanner, SuccessBanner } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import {
  FIN, FIN_BS_ASSET, FIN_BS_LIAB, FIN_CASHFLOW, FIN_EXPENSE, FIN_INCOME, FIN_MEMBERS, FIN_SCHEME,
  RETURN_STATUS, financeTotals, incomeTotal,
} from '../../../domain/adminOps';
import { Accordion, Hero, KV, Note, SubCard } from './parts';
import { schemeById } from '../../../domain/adminOps';

export default function Finance() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const roleQS = params.get('role') ? `?role=${params.get('role')}` : '';
  const { state, signOffFinance } = useAdmin();
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const t = financeTotals();
  const signed = state.financeSignedOff;
  const prevSurplus = t.incPrev - t.expPrev;

  function signOff() {
    setMsg(''); setErr('');
    const r = signOffFinance();
    if (!r.ok) { setErr(r.message); return; }
    setMsg(r.message);
  }

  return (
    <div className="p-4 space-y-3 pb-6">
      <Hero label={`অর্থবছর ${FIN.fy} · ${FIN.closed ? 'বন্ধ' : 'চলতি'} (D-15)`} amount={`৳${bn(t.surplus)}`}
        sub={FIN.period} chips={<>
          <span className="text-xs">আয় ৳{bn(t.inc)}</span>
          <span className="text-xs">ব্যয় ৳{bn(t.exp)}</span>
          <span className="text-xs">ট্রায়াল পার্থক্য ৳০</span>
          <span className="text-xs">{signed ? 'সাইন-অফ হয়েছে' : 'সাইন-অফ বাকি'}</span>
        </>} />

      <Note tone="danger"><><b>কোনো সুদ/মুনাফা আয় নেই</b> — আয়ের খাতে ভর্তি ফি, বার্ষিক চাঁদা, উত্তোলন ফি, বিলম্ব ফি (নির্ধারিত ফি, সুদ নয়) ও ওয়ালেট কমিশন (D-01)।</></Note>

      {msg ? <SuccessBanner title={msg}>ডেমো — বাস্তব হিসাব নয়।</SuccessBanner> : null}
      {err ? <ErrorBanner>{err}</ErrorBanner> : null}

      <Accordion title="আয়-ব্যয় বিবরণী" sub={`উদ্বৃত্ত ৳${bn(t.surplus)}`} defaultOpen>
        <div className="flex justify-between py-1"><b className="text-sm">আয়</b><b className="num text-sm">৳{bn(t.inc)}</b></div>
        {FIN_INCOME.map((x) => (
          <KV key={x.h} k={x.h} v={<span className="num">৳{bn(x.cur)} <span className="text-mut text-xs">({bn(x.prev)})</span></span>} />
        ))}
        <div className="flex justify-between py-1 mt-1"><b className="text-sm">ব্যয়</b><b className="num text-sm">৳{bn(t.exp)}</b></div>
        {FIN_EXPENSE.map((x) => (
          <KV key={x.h} k={x.h} v={<span className="num">৳{bn(x.cur)} <span className="text-mut text-xs">({bn(x.prev)})</span></span>} />
        ))}
        <KV k="উদ্বৃত্ত" strong v={<span className={`num ${t.surplus >= 0 ? 'text-ok-ink' : 'text-danger-ink'}`}>৳{bn(t.surplus)} <span className="text-mut text-xs">গত বছর ৳{bn(prevSurplus)}</span></span>} />
        {t.surplus < 0 ? (
          <Note tone="warn"><><b>ব্যয় আয়ের চেয়ে বেশি</b> — ঘাটতি ৳{bn(Math.abs(t.surplus))}। সঞ্চয় মডিউলে কোনো সুদ আয় নেই (D-01), তাই ঘাটতি হলে সঞ্চিতি থেকে মেটানো হয়।</></Note>
        ) : null}
      </Accordion>

      <Accordion title="উদ্বৃত্তপত্র (Balance Sheet)" sub={t.balanced ? 'ভারসাম্য ✓' : `পার্থক্য ৳${bn(t.asset - t.liab)}`}>
        <div className="flex justify-between py-1"><b className="text-sm">সম্পদ</b><b className="num text-sm">৳{bn(t.asset)}</b></div>
        {FIN_BS_ASSET.map((x) => <KV key={x.h} k={x.h} v={`৳${bn(x.cur)}`} />)}
        <div className="flex justify-between py-1 mt-1"><b className="text-sm">দায় ও মূলধন</b><b className="num text-sm">৳{bn(t.liab)}</b></div>
        {FIN_BS_LIAB.map((x) => <KV key={x.h} k={x.h} v={`৳${bn(x.cur)}`} />)}
        <KV k="সম্পদ − দায় ও মূলধন" strong v={<span className={t.balanced ? 'text-ok-ink' : 'text-danger-ink'}>৳{bn(t.asset - t.liab)}</span>} />
        {!t.balanced ? <Note tone="warn">দুই পাশ না মেলা পর্যন্ত সাইন-অফ নিষ্ক্রিয় (BR-12)।</Note> : null}
      </Accordion>

      <Accordion title="নগদ প্রবাহ" sub={`শুদ্ধ ৳${bn(incomeTotal(FIN_CASHFLOW))}`}>
        {FIN_CASHFLOW.map((x) => (
          <KV key={x.h} k={x.h} v={<span className={`num ${x.cur < 0 ? 'text-danger-ink' : 'text-ok-ink'}`}>{x.cur < 0 ? '−' : '+'}৳{bn(Math.abs(x.cur))}</span>} />
        ))}
        <KV k="শুদ্ধ নগদ প্রবাহ" strong v={`৳${bn(incomeTotal(FIN_CASHFLOW))}`} />
      </Accordion>

      <Accordion title="স্কিমভিত্তিক সারাংশ" sub={`${bn(FIN_SCHEME.length)}টি স্কিম`}>
        {FIN_SCHEME.map((x) => {
          const sc = schemeById(state.schemes, x.s);
          return <KV key={x.s} k={<span>{sc?.name ?? x.s}<span className="block text-xs text-mut">{bn(x.members)} সদস্য · বকেয়া ৳{bn(x.dues)}</span></span>} v={`৳${bn(x.bal)}`} />;
        })}
        <KV k="মোট" strong v={`${bn(FIN_SCHEME.reduce((s, x) => s + x.members, 0))} সদস্য · ৳${bn(FIN_SCHEME.reduce((s, x) => s + x.bal, 0))}`} />
      </Accordion>

      <Accordion title="সদস্য পরিসংখ্যান" sub={`${bn(FIN_MEMBERS.total)} জন`}>
        <KpiGrid>
          <Kpi label="চালু সদস্য" value={bn(FIN_MEMBERS.open)} tone="ok" />
          <Kpi label="নতুন যোগদান" value={bn(FIN_MEMBERS.joined)} />
          <Kpi label="নিষ্ক্রিয়" value={bn(FIN_MEMBERS.dormant)} tone="warn" note="D-07" />
          <Kpi label="প্রস্থান / মৃত্যু" value={bn(FIN_MEMBERS.exited + FIN_MEMBERS.deceased)} tone="danger" note="দাবি নিষ্পত্তি" />
        </KpiGrid>
      </Accordion>

      <Accordion title="রেগুলেটরি রিটার্ন" sub={`${bn(state.returns.length)}টি ছক`}>
        <div className="divide-y divide-line-2">
          {state.returns.map((r) => (
            <div key={r.code} className="py-2 flex items-start gap-2">
              <ShieldCheck size={15} className={`mt-0.5 shrink-0 ${r.status === 'ready' ? 'text-ok-ink' : 'text-warn-ink'}`} />
              <div className="grow min-w-0">
                <b className="text-sm block">{r.code} · {r.name}</b>
                <div className="text-xs text-mut">{r.fy}{r.at ? ` · ${r.at}` : ''}{r.by ? ` · ${r.by}` : ''}</div>
                <div className="text-xs">{r.fmt}</div>
              </div>
              <Badge tone={RETURN_STATUS[r.status].tone}>{RETURN_STATUS[r.status].t}</Badge>
            </div>
          ))}
        </div>
        <Note tone="warn"><><b>ছকের ফরম্যাট এখনো খোলা সিদ্ধান্ত</b> — সমবায় অধিদপ্তরের হালনাগাদ ছক নিশ্চিত করা বাকি; ফরম্যাট নিশ্চিত হলে শুধু টেমপ্লেট বদলাবে, হিসাব একই থাকবে (D-29)।</></Note>
        <Button size="sm" variant="ghost" className="mt-2 w-full" onClick={() => navigate(`/a/reports${roleQS}`)}>রিপোর্ট কেন্দ্রে যান</Button>
      </Accordion>

      <div className="flex gap-2">
        <Button variant="ghost" className="grow" icon={<Printer size={15} />} onClick={() => window.print()}>প্রিন্ট</Button>
        <Button variant="secondary" className="grow" onClick={() => navigate(`/a/reports${roleQS}`)}>রিপোর্ট কেন্দ্র</Button>
        <Button className="grow" disabled={signed}
          icon={signed ? <ShieldCheck size={15} /> : t.balanced ? <TrendingUp size={15} /> : <Lock size={15} />}
          onClick={signOff}>
          {signed ? 'সাইন-অফ হয়েছে' : t.balanced ? 'সাইন-অফ' : 'সাইন-অফ আটকে'}
        </Button>
      </div>

      <SubCard>
        <div className="flex items-start gap-2">
          <TrendingDown size={15} className="mt-0.5 text-warn-ink" />
          <p className="text-xs text-txt-2">সাইন-অফ করলে অর্থবছর লক হবে — পরে শুধু নিরীক্ষক ও ORG_ADMIN খুলতে পারবেন, এবং খোলাটা অডিট লগে থাকবে (R-05)।</p>
        </div>
      </SubCard>
      <SectionHead title="লব্ধি" sub="সব অঙ্ক ডেমো" />
      <p className="text-sm text-txt-2">আয় ৳{bn(t.inc)} · ব্যয় ৳{bn(t.exp)} · উদ্বৃত্ত ৳{bn(t.surplus)} · সম্পদ = দায় ৳{bn(t.asset)}</p>
    </div>
  );
}
