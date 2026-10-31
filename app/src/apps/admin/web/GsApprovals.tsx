import { useNavigate, useParams } from 'react-router-dom';
import { Badge, Button, Card, DataTable } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import { CHANNEL_LABEL, type ApprovalKind } from '../../../domain/admin';
import { Note, Page, StatBar } from './webParts';

const KIND: Record<string, { t: string; sub: string; kind: ApprovalKind; kindBn: string }> = {
  deposits: { t: 'জমা অনুমোদন কিউ', sub: 'সংগ্রহক/সদস্যের জমা যাচাই ও পোস্ট', kind: 'deposit', kindBn: 'জমা' },
  withdrawals: { t: 'উত্তোলন অনুমোদন কিউ', sub: 'সীমা, হোল্ড ও নমিনি যাচাই (D-22)', kind: 'withdrawal', kindBn: 'উত্তোলন' },
  members: { t: 'সদস্য নিবন্ধন আবেদন', sub: 'NID/মোবাইল যাচাই ও অনুমোদন', kind: 'member', kindBn: 'নিবন্ধন' },
  corrections: { t: 'সংশোধন ও রিভার্সাল প্রস্তাব', sub: 'মূল এন্ট্রি মুছবে না — রিভার্সাল হবে', kind: 'correction', kindBn: 'সংশোধন' },
};

export default function GsApprovals() {
  const { kind } = useParams();
  const cfg = KIND[kind ?? 'deposits'] ?? KIND.deposits;
  const { state } = useAdmin();
  const nav = useNavigate();
  const rows = state.approvals.filter((a) => a.kind === cfg.kind);

  return (
    <Page title={cfg.t} sub={cfg.sub} back="/w/dashboard"
      right={<Button size="sm" variant="secondary" onClick={() => nav('/w/payouts')}>পেমেন্ট / ভাউচার</Button>}>
      <StatBar items={[
        { k: 'অপেক্ষমাণ', v: bn(rows.length), tone: rows.length ? 'warn' : 'ok' },
        { k: '২৪ ঘণ্টা+', v: bn(rows.filter((a) => a.hoursAgo >= 24).length), tone: 'danger' },
        { k: 'প্রমাণহীন', v: bn(rows.filter((a) => !a.evidence).length) },
        { k: 'সীমার বাইরে', v: bn(rows.filter((a) => !a.inLimit).length), tone: 'warn' },
      ]} />
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(KIND).map(([k, v]) => (
          <button key={k} type="button" onClick={() => nav(`/w/approvals/${k}`)}
            className={`min-h-10 px-3 rounded-r-pill border text-xs font-bold ${cfg.kind === v.kind ? 'bg-green-700 text-white border-green-800' : 'bg-card border-line-3'}`}>{v.kindBn}</button>
        ))}
      </div>
      <Card title={`${cfg.kindBn} আবেদন`} sub={`${bn(rows.length)}টি · SLA অনুযায়ী সাজানো`}>
        <DataTable
          columns={[
            {
              key: 'member', head: 'সদস্য / রেফ', render: (r) => (
                <button type="button" onClick={() => nav(`/w/approvals/${r.id}`)} className="min-h-10 text-left">
                  <b className="text-green-800 hover:underline">{r.member}</b>
                  <span className="block text-xs text-mut num">{r.ref} · {r.submitted}</span>
                </button>
              ),
            },
            { key: 'amount', head: 'অঙ্ক', align: 'right', render: (r) => <b className="num">৳{bn(r.amount)}</b> },
            { key: 'channel', head: 'মাধ্যম', render: (r) => r.method === 'cash_office' ? 'অফিস নগদ' : CHANNEL_LABEL[r.method] },
            { key: 'sla', head: 'অপেক্ষা', render: (r) => <Badge tone={r.hoursAgo >= 24 ? 'danger' : 'neutral'}>{bn(r.hoursAgo)} ঘণ্টা</Badge> },
            { key: 'proof', head: 'প্রমাণ', render: (r) => <Badge tone={r.evidence ? 'ok' : 'warn'}>{r.evidence ? 'সংযুক্ত' : 'বাকি'}</Badge> },
            { key: 'limit', head: 'সীমা', render: (r) => <Badge tone={r.inLimit ? 'ok' : 'danger'}>{r.inLimit ? 'ভেতরে' : 'বাইরে'}</Badge> },
            { key: 'act', head: '', align: 'right', render: (r) => <Button size="sm" onClick={() => nav(`/w/approvals/${r.id}`)}>সিদ্ধান্ত</Button> },
          ]}
          rows={rows}
          empty="এই টাইপে কোনো আবেদন নেই ✅"
        />
      </Card>
      <div className="grid gap-3 md:grid-cols-2">
        <Note tone="warn">২৪ ঘণ্টার বেশি অপেক্ষমাণ আবেদনে SLA অ্যালার্ট; অনুমোদনের সীমা ছাড়ালে APPROVER-এ escalate করুন (D-22)।</Note>
        <Note>প্রমাণ ছাড়া জমা/উত্তোলন পোস্ট হবে না; প্রতিটি সিদ্ধান্ত অডিটে যাবে।</Note>
      </div>
    </Page>
  );
}
