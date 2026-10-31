import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Card, DataTable } from '../../../components/ui';
import { inputCls } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdminQh } from '../../../store/adminQardStore';
import { QH_LAYER, QH_SEV, QH_WARN } from '../../../domain/adminQard';
import { Note, Page, StatBar } from './webParts';
import { QhLayerRow, memName } from './qhParts';

export default function QhWebRules() {
  const { state, grantException, saveRuleVersion } = useAdminQh();
  const nav = useNavigate();
  const [member, setMember] = useState(state.eligible[0]?.memberId ?? '');
  const [committee, setCommittee] = useState('');
  const [note, setNote] = useState('');
  const [vals, setVals] = useState({ minSavings: '5000', maxPct: '50', minMonths: '6', approver: 'নাসরিন আক্তার' });
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  const act = (r: { ok: boolean; message: string }) => { if (!r.ok) { setErr(r.message); setMsg(''); } else { setErr(''); setMsg(r.message); } };
  const exceptions = state.eligible.filter((e) => e.source === 'manual_exception');
  const v3 = state.versions[0];

  return (
    <Page title="যোগ্যতা নিয়ম ব্যবস্থাপনা" sub="৪ স্তর · থ্রেশহোল্ড · ম্যানুয়াল এক্সেপশন · সংস্করণ — Simulation ছাড়া প্রকাশ নয় (D-57)"
      back="/w/qh"
      right={<><Button size="sm" variant="secondary" onClick={() => nav('/w/qh/simulation')}>Simulation চালান</Button></>}>
      {err && <Note tone="warn">{err}</Note>}
      {msg && <Note tone="ok">{msg}</Note>}

      <StatBar items={[
        { k: 'সক্রিয় নিয়ম', v: bn(state.rules.filter((r) => r.active).length) },
        { k: 'বর্তমান সংস্করণ', v: `v${bn(v3?.no ?? 0)}`, tone: 'ok' },
        { k: 'এক্সেপশন', v: bn(exceptions.length), tone: exceptions.length ? 'warn' : 'ok' },
        { k: 'সর্বশেষ Simulation', v: state.sim ? `${bn(state.sim.eligible)} জন` : 'চালানো হয়নি', tone: state.sim ? 'ok' : 'warn' },
      ]} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          {QH_LAYER.map((layer, li) => (
            <Card key={layer.k} title={layer.t} sub={layer.sub} right={<Badge tone="info">{bn(state.rules.filter((r) => r.layer === layer.k).length)} নিয়ম</Badge>}>
              <div className="space-y-2">
                {state.rules.filter((r) => r.layer === layer.k).map((r) => (
                  <QhLayerRow key={r.id} no={li * 10 + state.rules.filter((x) => x.layer === layer.k).indexOf(r) + 1}
                    title={r.label} sub={<span className="num">{r.op} {String(r.value)}{r.unit === 'paisa' ? ' (৳)' : r.unit === 'month' ? ' মাস' : ''} · {r.reason}</span>}
                    value={r.sev} note={r.sev === 'warn' ? QH_WARN[r.reason] ?? 'সতর্কতা — কমিটি দেখবে' : undefined} />
                ))}
              </div>
            </Card>
          ))}

          <Card title="ম্যানুয়াল এক্সেপশন রেজিস্টার" sub="ORG_ADMIN/কমিটি — অডিটে চিহ্নিত (D-59)">
            <DataTable
              columns={[
                { key: 'member', head: 'সদস্য', render: (r) => <b>{memName(r.memberId)}</b> },
                { key: 'note', head: 'কারণ', render: (r) => <span className="text-xs">{r.note}</span> },
                { key: 'max', head: 'সীমা', align: 'right', render: (r) => `৳${bn(r.maxAmount)}` },
                { key: 'until', head: 'বৈধতা', render: (r) => r.validUntil },
                { key: 'st', head: 'ফল', render: (r) => <Badge tone="warn">শর্তসাপেক্ষ</Badge> },
              ]}
              rows={exceptions}
              empty="কোনো ম্যানুয়াল এক্সেপশন নেই"
            />
          </Card>
        </div>

        <div className="space-y-3">
          <Card title="নতুন সংস্করণ" sub="মান → Simulation → কমিটি অনুমোদন">
            <div className="space-y-2">
              <label className="block"><span className="text-sm font-bold">ন্যূনতম সঞ্চয় (৳)</span>
                <input type="number" value={vals.minSavings} onChange={(e) => setVals({ ...vals, minSavings: e.target.value })} className={`${inputCls} mt-1 num`} />
              </label>
              <label className="block"><span className="text-sm font-bold">সঞ্চয়ের সর্বোচ্চ শতাংশ</span>
                <input type="number" value={vals.maxPct} onChange={(e) => setVals({ ...vals, maxPct: e.target.value })} className={`${inputCls} mt-1 num`} />
              </label>
              <label className="block"><span className="text-sm font-bold">ন্যূনতম সদস্যত্বকাল (মাস)</span>
                <input type="number" value={vals.minMonths} onChange={(e) => setVals({ ...vals, minMonths: e.target.value })} className={`${inputCls} mt-1 num`} />
              </label>
              <label className="block"><span className="text-sm font-bold">প্রকাশকারী</span>
                <select value={vals.approver} onChange={(e) => setVals({ ...vals, approver: e.target.value })} className={`${inputCls} mt-1`}>
                  {['নাসরিন আক্তার', 'মোঃ আব্দুল্লাহ', 'কামরুল হাসান'].map((x) => <option key={x}>{x}</option>)}
                </select>
              </label>
              <Button block onClick={() => act(saveRuleVersion({ minSavings: Number(vals.minSavings), maxPct: Number(vals.maxPct), minMonths: Number(vals.minMonths) }, vals.approver))}>
                সংস্করণ প্রকাশ
              </Button>
              <p className="text-xs text-mut">Simulation না চালালে প্রকাশ আটকাবে (D-57)। পুরোনো আবেদনের স্ন্যাপশট বদলাবে না (BR-21)।</p>
            </div>
          </Card>

          <Card title="ম্যানুয়াল এক্সেপশন" sub="কমিটি রেফারেন্স বাধ্যতামূলক">
            <div className="space-y-2">
              <select value={member} onChange={(e) => setMember(e.target.value)} className={inputCls}>
                {state.eligible.map((e) => <option key={e.memberId} value={e.memberId}>{memName(e.memberId)} · {e.result === 'blocked' ? 'অযোগ্য' : e.result === 'eligible' ? 'যোগ্য' : 'শর্তসাপেক্ষ'}</option>)}
              </select>
              <input value={committee} onChange={(e) => setCommittee(e.target.value)} placeholder="কমিটি CM-YYMM-##" className={inputCls} />
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="কারণ (৮+ অক্ষর)" className={`${inputCls} py-2`} />
              <Button variant="secondary" block onClick={() => act(grantException(member, committee, note))}>এক্সেপশন রেকর্ড করুন</Button>
            </div>
          </Card>

          <Card title="সংস্করণ ইতিহাস" sub="নিয়ম ও Simulation ফল">
            <div className="space-y-2">
              {state.versions.slice(0, 4).map((v) => (
                <div key={v.id} className="rounded-r-sm border border-line p-2.5 text-sm">
                  <div className="flex items-center gap-2"><b className="grow">v{bn(v.no)} · {v.validFrom}</b><Badge tone="info">{bn(v.sim.eligible)} যোগ্য</Badge></div>
                  <p className="text-xs text-mut mt-0.5">{v.changes}</p>
                  <p className="text-[11px] text-mut">{v.by} · {v.committee}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
      <Note>স্তর ৫-এর মতো কোনো লুকানো নিয়ম নেই; প্রতিটি ব্লকের কারণ কোড ও সমাধান সদস্যকে দেখানো হয় (QH_BLOCK)।</Note>
    </Page>
  );
}
