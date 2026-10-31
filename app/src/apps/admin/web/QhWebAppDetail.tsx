import { useNavigate, useParams } from 'react-router-dom';
import { Badge, Button, Card, DataTable } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { useAdminQh } from '../../../store/adminQardStore';
import { SEED_ACCOUNTS, SEED_MEMBERS, accountsOf } from '../../../domain/admin';
import {
  QH_APP_ST, QH_BLOCK, QH_DOC, QH_LAYER, qhEligibleOf, qhProductById, qhPurposeLabel,
} from '../../../domain/adminQard';
import { Desk, Go, Note, Page, Rail, StatBar } from './webParts';
import { QhCallout, QhLayerRow, QhZero, memName } from './qhParts';

export default function QhWebAppDetail() {
  const { appId } = useParams();
  const { state } = useAdminQh();
  const nav = useNavigate();
  const a = state.apps.find((x) => x.id === appId) ?? state.apps[0];
  const member = SEED_MEMBERS.find((m) => m.id === a.memberId);
  const p = qhProductById(state.products, a.product);
  const el = qhEligibleOf(state.eligible, a.memberId);
  const accs = accountsOf(SEED_ACCOUNTS, a.memberId);
  const canDecide = a.status === 'review' || a.status === 'screening' || a.status === 'returned';

  return (
    <Page title={`${a.no} · আবেদন বিস্তারিত`} sub={`${memName(a.memberId)} · ${p?.name ?? a.product} · জমা ${a.submittedAt}`}
      back="/w/qh/applications"
      right={<><Button size="sm" variant="secondary" onClick={() => nav('/w/qh/applications')}>কিউ</Button><Button size="sm" disabled={!canDecide} onClick={() => nav(`/w/qh/applications/${a.id}/decision`)}>সিদ্ধান্ত নিন</Button></>}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={QH_APP_ST[a.status].tone}>{QH_APP_ST[a.status].t}</Badge>
        <QhZero />
        <span className="text-sm text-mut">নিয়ম সংস্করণ v{bn(a.ruleVersion)} · SLA {bn(a.sla)} দিন {a.slaBreached ? '· লঙ্ঘিত' : ''}</span>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card title="আবেদনের সারসংক্ষেপ" sub={qhPurposeLabel(a.purpose)}>
          <dl className="text-sm space-y-2">
            {[['আবেদিত অঙ্ক', `৳${bn(a.amount)}`], ['যোগ্যতার সীমা', `৳${bn(a.snapshot.maxAmount)}`], ['মেয়াদ', `${bn(a.tenure)} মাস`], ['পরিশোধ', p?.repay === 'equal' ? 'সমান কিস্তি' : p?.repay === 'lump' ? 'এককালীন' : 'নমনীয়'], ['সুদের হার', '০% — সুদ নেই']].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-2 border-b border-line-2 pb-1.5"><dt className="text-mut">{k}</dt><dd className="font-bold num">{v}</dd></div>
            ))}
          </dl>
          <p className="text-xs text-mut mt-2">{a.purposeText}</p>
        </Card>
        <Card title="সদস্য" sub={member?.no ?? a.memberId}>
          <div className="text-sm space-y-1.5">
            <p className="text-h3">{member?.name ?? memName(a.memberId)}</p>
            <p className="text-mut">{member ? `${member.village}, ${member.union}` : 'প্রোফাইল সিডে নেই'}</p>
            <p>মোবাইল: <b className="num">{member?.mobile ?? '—'}</b></p>
            <p>KYC: <Badge tone={member?.kyc === 'verified' ? 'ok' : 'warn'}>{member?.kyc === 'verified' ? 'যাচাইকৃত' : 'অসম্পূর্ণ'}</Badge></p>
            <p>সঞ্চয়: <b className="num">৳{bn(accs.reduce((n, x) => n + x.posted, 0))}</b> · বকেয়া: <b className="num">{bn(accs.reduce((n, x) => n + x.missed, 0))} কিস্তি</b></p>
          </div>
        </Card>
        <Card title="পণ্য ও নিয়ম" sub={p?.code}>
          <div className="text-sm space-y-1">
            <p className="font-bold">{p?.name}</p>
            <p>সীমা: ৳{bn(p?.min ?? 0)}–{bn(p?.max ?? 0)}</p>
            <p>মেয়াদ: {bn(p?.tenure ?? 0)} মাস · গ্রেস {bn(p?.grace ?? 0)} দিন</p>
            <p className="text-xs text-mut mt-1">আবেদন-স্ন্যাপশট অপরিবর্তনীয় (BR-21)।</p>
          </div>
        </Card>
      </div>

      <Desk>
        <div className="space-y-3">
          <Card title="৪-স্তরের যোগ্যতা স্ন্যাপশট" sub="জমার সময়ে গণনা — পরে বদলায় না (BR-21)">
            <div className="space-y-2">
              {QH_LAYER.map((layer, i) => (
                <QhLayerRow key={layer.k} no={i + 1} title={layer.t} sub={layer.sub}
                  value={a.snapshot.layer[layer.k]}
                  note={a.snapshot.layer[layer.k] === 'block' ? QH_BLOCK[a.snapshot.reasons[0]]?.fix : undefined} />
              ))}
            </div>
            {a.snapshot.reasons.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {a.snapshot.reasons.map((code) => (
                  <div key={code} className="text-xs text-danger-ink"><b>{code}</b> — {QH_BLOCK[code]?.a ?? code}</div>
                ))}
              </div>
            )}
          </Card>

          <Card title="নথি যাচাই" sub="নথি ছাড়া অনুমোদন নয় (D-58)">
            <div className="grid sm:grid-cols-2 gap-2">
              {QH_DOC.map((d) => {
                const has = a.docs.includes(d.k);
                return (
                  <div key={d.k} className={`rounded-r-sm border px-3 py-2 text-sm ${has ? 'border-ok-bd bg-ok-bg' : 'border-warn-bd bg-warn-bg'}`}>
                    <b>{has ? '✓' : '!'} {d.t}</b>
                    <span className="block text-xs text-mut">{has ? 'সংযুক্ত ও যাচাইকৃত' : 'সংযুক্ত নয় — ফেরত দিন'}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="space-y-3">
          <StatBar items={[
            { k: 'স্ন্যাপশট', v: a.snapshot.result === 'eligible' ? 'যোগ্য' : a.snapshot.result === 'conditional' ? 'শর্তসাপেক্ষ' : 'আটকানো', tone: a.snapshot.result === 'blocked' ? 'danger' : a.snapshot.result === 'conditional' ? 'warn' : 'ok' },
            { k: 'সীমা', v: `৳${bn(a.snapshot.maxAmount)}` },
            { k: 'SLA', v: `${bn(a.sla)} দিন`, tone: a.slaBreached ? 'danger' : a.sla <= 2 ? 'warn' : 'ok' },
            { k: 'সুদ', v: '৳০', tone: 'ok' },
          ]} />
          <Card title="সিদ্ধান্ত" sub={a.decision ? 'ইতিমধ্যে সম্পন্ন' : 'পাঁচটি বিকল্প'}>
            {a.decision ? (
              <div className="text-sm space-y-1">
                <Badge tone={a.decision.verdict === 'approve' ? 'ok' : a.decision.verdict === 'reject' ? 'danger' : 'warn'}>
                  {a.decision.verdict === 'approve' ? 'অনুমোদিত' : a.decision.verdict === 'reject' ? 'প্রত্যাখ্যাত' : 'তথ্য চেয়ে ফেরত'}
                </Badge>
                <p>অঙ্ক: <b className="num">৳{bn(a.decision.amount ?? 0)}</b></p>
                <p>প্রস্তুত: {a.decision.by}</p>
                <p>অনুমোদন: {a.decision.appr ?? '—'}</p>
                <p>কমিটি: {a.decision.committee ?? '—'} · {a.decision.at}</p>
                <p className="text-xs text-mut">{a.decision.note}</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-mut">সিদ্ধান্ত পর্দায় ৮টি যাচাই সম্পন্ন করে maker ≠ checker নিশ্চিত করুন (BR-22)।</p>
                <Button className="mt-2" block disabled={!canDecide} onClick={() => nav(`/w/qh/applications/${a.id}/decision`)}>সিদ্ধান্ত নিন</Button>
              </>
            )}
          </Card>
          <Card title="যোগ্যতা বর্তমান অবস্থা" sub={`মূল্যায়ন ${el?.evaluatedAt ?? '—'}`}>
            <p className="text-sm">{el ? (el.result === 'eligible' ? 'যোগ্য' : el.result === 'conditional' ? 'শর্তসাপেক্ষ' : 'এখন অযোগ্য') : 'তালিকায় নেই'}</p>
            <p className="text-xs text-mut mt-1">{el?.note}</p>
          </Card>
          <Rail title="সংযোগ">
            <Go to="/w/qh/eligible">যোগ্য সদস্য তালিকা</Go>
            <Go to="/w/qh/loans">ঋণ হাব</Go>
            <Go to="/w/qh/reports">QH রিপোর্ট</Go>
          </Rail>
          <QhCallout title="সুদ শূন্য" tone="ok">এই আবেদনে কোনো সুদ, সার্ভিস চার্জ বা বিলম্ব ফি নেই — শুধু মূলধন ফেরত (BR-20 · D-41)।</QhCallout>
        </div>
      </Desk>
      <Note>নথি অসম্পূর্ণ হলে “তথ্য চেয়ে ফেরত” দিন — প্রত্যাখ্যান নয়। স্ন্যাপশটে আটকানো আবেদন অনুমোদন করা যায় না (BR-21)।</Note>
    </Page>
  );
}
