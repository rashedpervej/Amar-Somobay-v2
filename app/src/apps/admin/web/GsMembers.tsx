import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { Badge, Button, Card, DataTable } from '../../../components/ui';
import { inputCls } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import { accountsOf, duesOfMember, type MemStatus } from '../../../domain/admin';
import { Chips, Note, Page, StatBar } from './webParts';
import { MEMBER_STATUS, MemberStatus, gsDueLeft } from './gsParts';

export default function GsMembers() {
  const { state } = useAdmin();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [st, setSt] = useState('all');
  const rows = state.members.filter((m) => {
    const okQ = q.trim() === '' || `${m.name} ${m.no} ${m.mobile} ${m.nid}`.includes(q.trim());
    return okQ && (st === 'all' || m.status === st);
  });

  return (
    <Page title="সদস্য তালিকা" sub="নাম, মোবাইল, NID বা সদস্য নম্বর দিয়ে খুঁজুন · ডেমো ডেটা"
      back="/w/dashboard"
      right={<Button icon={<Plus size={15} />} onClick={() => nav('/w/members/new')}>নতুন সদস্য</Button>}>
      <StatBar items={[
        { k: 'মোট সদস্য', v: bn(state.members.length) },
        { k: 'সক্রিয়', v: bn(state.members.filter((m) => m.status === 'active').length), tone: 'ok' },
        { k: 'KYC বাকি', v: bn(state.members.filter((m) => m.kyc !== 'verified').length), tone: 'warn' },
        { k: 'মোট হিসাব', v: bn(state.accounts.length) },
      ]} />
      <div className="flex flex-wrap items-end gap-3">
        <label className="block grow max-w-md"><span className="text-sm font-bold">সদস্য খুঁজুন</span>
          <div className="relative mt-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-mut" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="নাম / মোবাইল / NID / সদস্য নম্বর" className={`${inputCls} pl-9`} />
          </div>
        </label>
        <div><span className="text-xs font-bold text-mut block mb-1">অবস্থা</span>
          <Chips value={st} onChange={setSt} items={[['all', 'সব'], ...Object.entries(MEMBER_STATUS).map(([k, v]) => [k, v.t] as [string, string])]} />
        </div>
      </div>
      <Card title="সদস্য" sub={`${bn(rows.length)} জন`}>
        <DataTable
          columns={[
            {
              key: 'name', head: 'সদস্য', render: (m) => (
                <button type="button" onClick={() => nav(`/w/members/${m.id}`)} className="min-h-10 text-left">
                  <b className="text-green-800 hover:underline">{m.name}</b>
                  <span className="block text-xs text-mut"><span className="num">{m.no}</span> · {m.mobile}</span>
                </button>
              ),
            },
            { key: 'route', head: 'রুট', render: (m) => <Badge tone="neutral">{m.route}</Badge> },
            { key: 'kyc', head: 'KYC', render: (m) => <Badge tone={m.kyc === 'verified' ? 'ok' : m.kyc === 'pending' ? 'warn' : 'danger'}>{m.kyc === 'verified' ? 'যাচাইকৃত' : m.kyc === 'pending' ? 'যাচাই বাকি' : 'সমস্যা'}</Badge> },
            { key: 'acc', head: 'হিসাব', align: 'right', render: (m) => bn(accountsOf(state.accounts, m.id).length) },
            { key: 'balance', head: 'মোট স্থিতি', align: 'right', render: (m) => <b className="num">৳{bn(accountsOf(state.accounts, m.id).reduce((n, a) => n + a.posted, 0))}</b> },
            { key: 'dues', head: 'বকেয়া', align: 'right', render: (m) => <span className={`num ${gsDueLeft(duesOfMember(state.dues, m.id)) ? 'text-danger-ink font-bold' : ''}`}>৳{bn(gsDueLeft(duesOfMember(state.dues, m.id)))}</span> },
            { key: 'st', head: 'অবস্থা', render: (m) => <MemberStatus s={m.status} /> },
            {
              key: 'act', head: '', align: 'right', render: (m) => (
                <div className="flex justify-end gap-1.5">
                  <Button size="sm" variant="secondary" onClick={() => nav(`/w/members/${m.id}`)}>৩৬০°</Button>
                  <Button size="sm" onClick={() => nav(`/w/deposits/new?member=${m.id}`)}>জমা</Button>
                </div>
              ),
            },
          ]}
          rows={rows}
          empty="কোনো সদস্য মেলেনি"
        />
      </Card>
      <div className="grid gap-3 md:grid-cols-2">
        <Note>সদস্যের তথ্য বদলালে কারণ ও প্রমাণ ছাড়া সংরক্ষণ হবে না; maker ≠ checker প্রযোজ্য।</Note>
        <Note tone="warn">নিষ্ক্রিয়/বহিষ্কৃত সদস্যের হিসাব আগের মতোই থাকে — কোনো ডিলিট নেই, শুধু অবস্থা বদলায়।</Note>
      </div>
    </Page>
  );
}

export const MEMBER_STATUS_KEYS: MemStatus[] = ['active', 'dormant', 'suspended', 'exited'];
