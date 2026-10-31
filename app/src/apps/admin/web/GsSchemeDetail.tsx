import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge, Button, Card, DataTable } from '../../../components/ui';
import { inputCls } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import { SCH_STATUS } from '../../../domain/adminOps';
import { Note, Page, StatBar } from './webParts';

export default function GsSchemeDetail() {
  const { schemeId } = useParams();
  const { state, proposeVersion } = useAdmin();
  const nav = useNavigate();
  const sc = state.schemes.find((s) => s.id === schemeId) ?? state.schemes[0];
  const [decisionNo, setDecisionNo] = useState('');
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  const propose = () => {
    const r = proposeVersion(sc.id, decisionNo);
    if (!r.ok) { setErr(r.message); setMsg(''); } else { setErr(''); setMsg(r.message); setDecisionNo(''); }
  };

  return (
    <Page title={sc.name} sub={<><span className="num">{sc.code}</span> · {sc.typeBn} · সংস্করণ v{bn(sc.version)} · {SCH_STATUS[sc.status].t}</>}
      back="/w/schemes"
      right={<><Button size="sm" variant="secondary" onClick={() => nav('/w/schemes')}>তালিকা</Button><Button size="sm" onClick={() => nav('/w/schemes/new')}>নতুন স্কিম</Button></>}>
      {err && <Note tone="warn">{err}</Note>}
      {msg && <Note tone="ok">{msg}</Note>}
      <StatBar items={[
        { k: 'সদস্য', v: bn(sc.members) },
        { k: 'মোট স্থিতি', v: `৳${bn(sc.total)}` },
        { k: 'কিস্তি', v: `৳${bn(sc.installment)}` },
        { k: 'মেয়াদ', v: sc.tenure ? `${bn(sc.tenure)} মাস` : 'মেয়াদহীন' },
      ]} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-3">
          <Card title="শর্ত ও নিয়ম" sub="বর্তমান সংস্করণ — পুরোনো হিসাব অপরিবর্তিত">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
              {[
                ['লক-ইন', `${bn(sc.lockIn)} মাস`], ['নোটিশ', `${bn(sc.noticeDays)} দিন`],
                ['মাসে সর্বোচ্চ', `${bn(sc.maxPerMonth)} বার`], ['সর্বোচ্চ অঙ্ক', `৳${bn(sc.maxAmount)}`],
                ['সর্বনিম্ন ব্যালেন্স', `৳${bn(sc.minBalance)}`], ['গ্রেস', `${bn(sc.graceDays)} দিন`],
                ['বিলম্ব ফি', `৳${bn(sc.lateFee)}`], ['ভর্তি ফি', `৳${bn(sc.fees.admission)}`],
                ['বার্ষিক ফি', `৳${bn(sc.fees.annual)}`],
              ].map(([k, v]) => (
                <div key={k} className="rounded-r-sm border border-line bg-card-2 px-3 py-2">
                  <span className="text-xs text-mut block">{k}</span><b className="num">{v}</b>
                </div>
              ))}
            </div>
            <p className="text-sm text-mut mt-3 leading-relaxed">{sc.desc}</p>
          </Card>

          <Card title="পরিবর্তনের প্রভাব" sub="নতুন সংস্করণে যা বদলাবে — পুরোনোতে নয়">
            <DataTable
              columns={[
                { key: 'f', head: 'ক্ষেত্র' },
                { key: 'old', head: 'পুরোনো' },
                { key: 'neu', head: 'নতুন' },
                { key: 'lock', head: 'লকড', render: (r) => r.locked ? <Badge tone="neutral">লকড</Badge> : <Badge tone="warn">পরিবর্তনযোগ্য</Badge> },
                { key: 'impact', head: 'প্রভাব', render: (r) => <span className="text-xs text-mut">{r.impact}</span> },
              ]}
              rows={state.sdiff}
            />
          </Card>

          <Card title="এই স্কিমের হিসাব" sub="ডেমো সদস্য অ্যাকাউন্ট">
            <DataTable
              columns={[
                { key: 'no', head: 'হিসাব', render: (r) => r.no },
                { key: 'member', head: 'সদস্য', render: (r) => state.members.find((m) => m.id === r.memberId)?.name ?? r.memberId },
                { key: 'posted', head: 'স্থিতি', align: 'right', render: (r) => `৳${bn(r.posted)}` },
                { key: 'status', head: 'অবস্থা', render: (r) => <Badge tone={r.status === 'active' ? 'ok' : r.status === 'frozen' ? 'warn' : 'neutral'}>{r.status === 'active' ? 'সক্রিয়' : r.status === 'frozen' ? 'ফ্রিজ' : 'বন্ধ'}</Badge> },
              ]}
              rows={state.accounts.filter((a) => a.scheme === sc.name)}
              empty="এই স্কিমে এখনো কোনো হিসাব নেই"
            />
          </Card>
        </div>

        <div className="space-y-3">
          <Card title="নতুন সংস্করণ প্রস্তাব" sub="কমিটির সিদ্ধান্ত ছাড়া নয় (D-32)">
            <div className="text-sm space-y-1 mb-3">
              <div className="flex justify-between"><span className="text-mut">বর্তমান</span><b>v{bn(sc.version)}</b></div>
              <div className="flex justify-between"><span className="text-mut">প্রস্তাবিত</span><b>v{bn(sc.version + 1)}</b></div>
              <div className="flex justify-between"><span className="text-mut">লক-ইন</span><b>৬ মাস</b></div>
              <div className="flex justify-between"><span className="text-mut">নোটিশ</span><b>১৫ দিন</b></div>
              <div className="flex justify-between"><span className="text-mut">বিলম্ব ফি</span><b>৳২৫</b></div>
            </div>
            <label className="block"><span className="text-sm font-bold">কমিটির সিদ্ধান্ত নম্বর</span>
              <input value={decisionNo} onChange={(e) => setDecisionNo(e.target.value)} placeholder="CM-2610-08" className={`${inputCls} mt-1`} />
            </label>
            <Button block className="mt-3" onClick={propose}>সংস্করণ প্রস্তাব করুন</Button>
            <p className="text-xs text-mut mt-2">প্রস্তাব অনুমোদনের অপেক্ষায় যাবে; বিদ্যমান অ্যাকাউন্টের শর্ত বদলাবে না (BR-21)।</p>
          </Card>
          <Note>কোড <span className="num">{sc.code}</span> কখনো বদলায় না — রসিদ ও অ্যাকাউন্ট নম্বরে ব্যবহৃত।</Note>
          <Note tone="warn">শতাংশ-ভিত্তিক মুনাফা/সুদ নেই — এই স্কিমে কোনো লভ্যাংশ হার নেই (D-01)।</Note>
        </div>
      </div>
    </Page>
  );
}
