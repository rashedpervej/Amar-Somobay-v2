import { useNavigate, useParams } from 'react-router-dom';
import { Badge, Button, Card, DataTable } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import { CHANNEL_LABEL } from '../../../domain/admin';
import { Note, Page, StatBar } from './webParts';
import { gsAccount, gsDueLeft } from './gsParts';

export default function GsAccount() {
  const { accId } = useParams();
  const { state } = useAdmin();
  const nav = useNavigate();
  const a = gsAccount(state.accounts, accId) ?? state.accounts[0];
  const m = state.members.find((x) => x.id === a.memberId);
  const txns = state.txns.filter((t) => t.accId === a.id);
  const dues = state.dues.filter((d) => d.accId === a.id);
  const due = gsDueLeft(dues);

  return (
    <Page title={a.no} sub={`${m?.name ?? a.memberId} · ${a.scheme} · খোলা ${a.opened} · ডেমো`} back="/w/members"
      right={<><Button size="sm" variant="secondary" onClick={() => nav(`/w/members/${a.memberId}`)}>সদস্য ৩৬০°</Button><Button size="sm" onClick={() => nav(`/w/deposits/new?account=${a.id}`)}>জমা নিন</Button></>}>
      <StatBar items={[
        { k: 'স্থিতি', v: `৳${bn(a.posted)}`, tone: 'ok' },
        { k: 'হোল্ড', v: `৳${bn(a.hold)}` },
        { k: 'বকেয়া', v: `৳${bn(due)}`, tone: due ? 'danger' : 'ok' },
        { k: 'কিস্তি', v: `৳${bn(a.installment)}` },
      ]} />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-3">
          <Card title="খতিয়ান" sub={`${bn(txns.length)}টি লেনদেন · কোনো সুদ নেই`}>
            <DataTable
              columns={[
                { key: 'no', head: 'লেনদেন', render: (t) => t.no },
                { key: 'date', head: 'তারিখ', render: (t) => t.date },
                { key: 'type', head: 'ধরন', render: (t) => t.type === 'deposit' ? 'জমা' : t.type === 'withdrawal' ? 'উত্তোলন' : t.type === 'fee' ? 'ফি' : 'সমন্বয়' },
                { key: 'amount', head: 'অঙ্ক', align: 'right', render: (t) => <span className={t.type === 'withdrawal' ? 'num text-danger-ink' : 'num text-ok-ink'}>{t.type === 'withdrawal' ? '−' : '+'}৳{bn(Math.abs(t.amount))}</span> },
                { key: 'ch', head: 'মাধ্যম', render: (t) => CHANNEL_LABEL[t.channel] },
                { key: 'bal', head: 'ব্যালেন্স', align: 'right', render: (t) => `৳${bn(t.balanceAfter)}` },
                { key: 'st', head: 'অবস্থা', render: (t) => <Badge tone={t.status === 'posted' ? 'ok' : t.status === 'reversed' ? 'danger' : 'warn'}>{t.status === 'posted' ? 'পোস্টেড' : t.status === 'reversed' ? 'রিভার্সড' : 'অপেক্ষমাণ'}</Badge> },
              ]}
              rows={txns}
              empty="এখনো কোনো লেনদেন নেই"
            />
          </Card>
          <Card title="বকেয়া কিস্তি" sub="গ্রেস ও বিলম্ব ফি আলাদা">
            <DataTable
              columns={[
                { key: 'no', head: 'কিস্তি', render: (d) => `#${bn(d.instNo)}` },
                { key: 'due', head: 'তারিখ', render: (d) => d.due },
                { key: 'amount', head: 'অঙ্ক', align: 'right', render: (d) => `৳${bn(d.amount)}` },
                { key: 'paid', head: 'পরিশোধ', align: 'right', render: (d) => `৳${bn(d.paid)}` },
                { key: 'fee', head: 'বিলম্ব ফি', align: 'right', render: (d) => `৳${bn(d.lateFee)}` },
              ]}
              rows={dues}
              empty="কোনো বকেয়া নেই"
            />
          </Card>
        </div>
        <div className="space-y-3">
          <Card title="অ্যাকাউন্ট শর্ত">
            <div className="text-sm space-y-1">
              <div className="flex justify-between"><span className="text-mut">স্কিম</span><b>{a.scheme}</b></div>
              <div className="flex justify-between"><span className="text-mut">কিস্তি</span><b className="num">৳{bn(a.installment)}</b></div>
              <div className="flex justify-between"><span className="text-mut">মেয়াদ</span><b>{a.tenure ? `${bn(a.tenure)} মাস` : 'মেয়াদহীন'}</b></div>
              <div className="flex justify-between"><span className="text-mut">পরবর্তী কিস্তি</span><b className="num">{a.nextDue}</b></div>
              <div className="flex justify-between"><span className="text-mut">লক-ইন</span><b>{bn(a.lockIn)} মাস</b></div>
              <div className="flex justify-between"><span className="text-mut">নোটিশ</span><b>{bn(a.noticeDays)} দিন</b></div>
              <div className="flex justify-between"><span className="text-mut">অবস্থা</span><Badge tone={a.status === 'active' ? 'ok' : a.status === 'frozen' ? 'warn' : 'neutral'}>{a.status === 'active' ? 'সক্রিয়' : a.status === 'frozen' ? 'ফ্রিজ' : 'বন্ধ'}</Badge></div>
            </div>
          </Card>
          <Note tone="warn">এই হিসাবে <span className="num">{a.missed}</span>টি কিস্তি মিস — গ্রেস শেষে বিলম্ব ফি প্রযোজ্য হতে পারে; কোনো সুদ নেই।</Note>
          <Card title="নিষ্পত্তি"><p className="text-sm text-mut mb-2">প্রস্থান বা হিসাব বন্ধ করতে সদস্য প্রস্থান পর্দা ব্যবহার করুন; সরাসরি ডিলিট হবে না।</p><Button size="sm" variant="secondary" onClick={() => nav(`/w/members/${a.memberId}/exit`)}>নিষ্পত্তি শুরু</Button></Card>
        </div>
      </div>
    </Page>
  );
}
