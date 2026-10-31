import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { Badge, Button, Card } from '../../../components/ui';
import { inputCls } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdminQh } from '../../../store/adminQardStore';
import { Note, Page, StatBar } from './webParts';
import { QhCallout, QhZero } from './qhParts';

export default function QhWebSimulation() {
  const { state, runSim, saveRuleVersion } = useAdminQh();
  const nav = useNavigate();
  const [f, setF] = useState({ minSavings: '5000', maxPct: '50', minMonths: '6', approver: 'নাসরিন আক্তার' });
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  const sim = state.sim;
  const run = () => {
    const r = runSim({ minSavings: Number(f.minSavings), maxPct: Number(f.maxPct), minMonths: Number(f.minMonths) });
    if (!r.ok) { setErr(r.message); setMsg(''); } else { setErr(''); setMsg(r.message); }
  };
  const publish = () => {
    const r = saveRuleVersion({ minSavings: Number(f.minSavings), maxPct: Number(f.maxPct), minMonths: Number(f.minMonths) }, f.approver);
    if (!r.ok) { setErr(r.message); setMsg(''); } else { setErr(''); setMsg(r.message); }
  };

  return (
    <Page title="নিয়ম Simulation" sub="মান বদলে দেখুন কারও নাম ছাড়া কতজন যোগ্য — প্রকাশের আগে বাধ্যতামূলক (D-57)"
      back="/w/qh" right={<Button size="sm" variant="secondary" onClick={() => nav('/w/qh/rules')}>নিয়ম ও সংস্করণ</Button>}>
      {err && <Note tone="warn">{err}</Note>}
      {msg && <Note tone="ok">{msg}</Note>}

      <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card title="পরীক্ষার মান" sub="খসড়া নিয়ম — এখনো প্রকাশিত নয়" right={<QhZero />}>
          <div className="space-y-3">
            {([['minSavings', 'ন্যূনতম সঞ্চয় (৳)'], ['maxPct', 'সঞ্চয়ের সর্বোচ্চ শতাংশ'], ['minMonths', 'ন্যূনতম সদস্যত্বকাল (মাস)']] as const).map(([k, label]) => (
              <label key={k} className="block"><span className="text-sm font-bold">{label}</span>
                <input type="number" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} className={`${inputCls} mt-1 num`} />
              </label>
            ))}
            <Button block onClick={run}>Simulation চালান</Button>
            <label className="block"><span className="text-sm font-bold">প্রকাশকারী</span>
              <select value={f.approver} onChange={(e) => setF({ ...f, approver: e.target.value })} className={`${inputCls} mt-1`}>
                {['নাসরিন আক্তার', 'মোঃ আব্দুল্লাহ', 'কামরুল হাসান'].map((x) => <option key={x}>{x}</option>)}
              </select>
            </label>
            <Button variant="secondary" block onClick={publish} disabled={!sim}>ফলাফলসহ সংস্করণ প্রকাশ</Button>
          </div>
        </Card>

        <div className="space-y-3">
          {!sim ? (
            <Card title="এখনো Simulation চালানো হয়নি" sub="মান দিন → চালান">
              <div className="py-10 text-center text-sm text-mut">
                <ShieldCheck size={34} className="mx-auto text-green-700 mb-2" />
                ফলাফলে কোনো সদস্যের নাম, আইডি বা ব্যক্তিগত তথ্য দেখানো হবে না (D-57)।
              </div>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[['নমুনা', sim.members, 'neutral'], ['যোগ্য', sim.eligible, 'ok'], ['অযোগ্য', sim.blocked, 'danger'], ['নতুন যোগ্য', sim.newlyEligible, 'info']].map(([k, v, t]) => (
                  <div key={String(k)} className="bg-card border border-line rounded-r-md px-4 py-3">
                    <div className="text-xs font-bold text-mut">{k}</div>
                    <div className={`num text-h1 font-extrabold ${t === 'ok' ? 'text-ok-ink' : t === 'danger' ? 'text-danger-ink' : t === 'info' ? 'text-info-ink' : 'text-txt'}`}>{bn(Number(v))}</div>
                  </div>
                ))}
              </div>
              <Card title="যোগ্যতার বিতরণ" sub="নমুনা জনসংখ্যা — ব্যক্তি শনাক্তযোগ্য নয়">
                <div className="flex items-end gap-2 h-40 border-b border-line pb-1">
                  {sim.bands.map((v, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="num text-xs font-bold">{bn(v)}</span>
                      <div className="w-full rounded-t-r-sm bg-purple" style={{ height: `${Math.max(6, (v / Math.max(1, sim.members)) * 120)}px` }} />
                      <span className="text-[10px] text-mut text-center">{sim.bandLabels[i]}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge tone="info">নতুন আটকাল: {bn(sim.newlyBlocked)}</Badge>
                  <Badge tone="ok">নতুন যোগ্য: {bn(sim.newlyEligible)}</Badge>
                  <Badge tone="neutral">ব্যক্তিগত তালিকা নেই</Badge>
                </div>
              </Card>
              <QhCallout title="গোপনীয়তা নিশ্চিত" tone="ok">{sim.privacy} — কোনো সদস্যের নাম বা আইডি নেই।</QhCallout>
              <StatBar items={[
                { k: 'নমুনা', v: bn(sim.members) },
                { k: 'যোগ্য', v: bn(sim.eligible), tone: 'ok' },
                { k: 'অযোগ্য', v: bn(sim.blocked), tone: 'danger' },
                { k: 'পুল', v: `৳${bn(state.window.pool.allocated)}` },
              ]} />
            </>
          )}
          <Note>Simulation ফল শুধু নীতি-অনুমোদনের প্রমাণ; এটি কোনো সদস্যকে স্বয়ংক্রিয়ভাবে ঋণ দেয় না। ম্যানুয়াল এক্সেপশন আলাদা রেকর্ড (D-59)।</Note>
        </div>
      </div>
    </Page>
  );
}
