import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Card, DataTable } from '../../../components/ui';
import { inputCls } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdminQh } from '../../../store/adminQardStore';
import {
  QH_CLASS, QH_LOAN_ST, qhArrearsOf, qhClassOf, qhDaysLate, qhInsts, qhNextInst, qhOutstanding, qhPaidPct, qhPerInst,
} from '../../../domain/adminQard';
import { Chips, Note, Page, StatBar } from './webParts';
import { memName } from './qhParts';

export default function QhWebLoans() {
  const { state } = useAdminQh();
  const nav = useNavigate();
  const [st, setSt] = useState('all');
  const [q, setQ] = useState('');
  const rows = state.loans.filter((l) => (st === 'all' || l.status === st) && (q.trim() === '' || l.no.includes(q) || memName(l.memberId).includes(q)));
  const [sel, setSel] = useState(rows[0]?.id ?? state.loans[0].id);
  const loan = state.loans.find((l) => l.id === sel) ?? rows[0] ?? state.loans[0];
  const insts = qhInsts(loan, state.repayments);
  const next = qhNextInst(loan, state.repayments);

  return (
    <Page title="ঋণ, ছক ও পরিশোধ" sub="সব ঋণ · কিস্তি ছক · বকেয়া ও পরিশোধ — সুদ শূন্য, শুধু মূলধন"
      back="/w/qh" right={<><Button size="sm" variant="secondary" onClick={() => nav('/w/qh/disburse')}>বিতরণ বাকি</Button><Button size="sm" onClick={() => nav('/w/qh/arrears')}>বকেয়া</Button></>}>
      <StatBar items={[
        { k: 'মোট ঋণ', v: bn(state.loans.length) },
        { k: 'চলমান', v: bn(state.loans.filter((l) => l.status === 'active').length) },
        { k: 'বকেয়া', v: bn(state.loans.filter((l) => l.status === 'arrears').length), tone: 'danger' },
        { k: 'মোট মূলধন', v: `৳${bn(state.loans.reduce((n, l) => n + l.principal, 0))}` },
      ]} />
      <div className="flex flex-wrap items-end gap-3">
        <label className="block grow max-w-sm"><span className="text-sm font-bold">খুঁজুন</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ঋণ নম্বর বা সদস্য" className={`${inputCls} mt-1`} />
        </label>
        <div><span className="text-xs font-bold text-mut block mb-1">অবস্থা</span>
          <Chips value={st} onChange={setSt} items={[['all', 'সব'], ...Object.entries(QH_LOAN_ST).map(([k, v]) => [k, v.t] as [string, string])]} />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        <Card title="ঋণ তালিকা" sub={`${bn(rows.length)}টি · কিস্তি ছক দেখতে সারি বাছুন`}>
          <DataTable
            columns={[
              {
                key: 'no', head: 'ঋণ', render: (r) => (
                  <button type="button" onClick={() => { setSel(r.id); }} className="min-h-10 text-left">
                    <b className="num text-green-800 hover:underline">{r.no}</b>
                    <span className="block text-xs text-mut">{memName(r.memberId)}</span>
                  </button>
                ),
              },
              { key: 'principal', head: 'মূলধন', align: 'right', render: (r) => `৳${bn(r.principal)}` },
              { key: 'paid', head: 'পরিশোধ', align: 'center', render: (r) => `${bn(qhPaidPct(r, state.repayments))}%` },
              { key: 'out', head: 'বাকি', align: 'right', render: (r) => `৳${bn(qhOutstanding(r, state.repayments, state.writeoffs))}` },
              { key: 'inst', head: 'কিস্তি', align: 'right', render: (r) => <>{bn(qhPerInst(r))}<span className="block text-xs text-mut">{bn(qhInsts(r, state.repayments).filter((i) => i.status === 'paid').length)}/{bn(r.tenure)}</span></> },
              { key: 'late', head: 'বিলম্ব', align: 'center', render: (r) => <span className={qhDaysLate(r, state.repayments) ? 'text-danger-ink font-bold' : ''}>{bn(qhDaysLate(r, state.repayments))} দিন</span> },
              { key: 'cls', head: 'শ্রেণি', render: (r) => <Badge tone={QH_CLASS[qhClassOf(r, state.repayments)].tone}>{QH_CLASS[qhClassOf(r, state.repayments)].t}</Badge> },
              { key: 'st', head: 'অবস্থা', render: (r) => <Badge tone={QH_LOAN_ST[r.status].tone}>{QH_LOAN_ST[r.status].t}</Badge> },
              {
                key: 'act', head: '', align: 'right', render: (r) => (
                  <div className="flex justify-end gap-1.5">
                    <Button size="sm" variant="secondary" onClick={() => setSel(r.id)}>ছক</Button>
                    <Button size="sm" onClick={() => nav(`/w/qh/loans/${r.id}`)}>খুলুন</Button>
                  </div>
                ),
              },
            ]}
            rows={rows}
          />
        </Card>

        <div className="space-y-3">
          <Card title={`কিস্তি ছক · ${loan.no}`} sub={`${memName(loan.memberId)} · ${bn(loan.tenure)} কিস্তি`} right={<Button size="sm" variant="secondary" onClick={() => nav(`/w/qh/loans/${loan.id}`)}>বিস্তারিত</Button>}>
            <div className="grid grid-cols-3 gap-2 text-sm mb-2">
              <div><span className="text-xs text-mut block">মূলধন</span><b className="num">৳{bn(loan.principal)}</b></div>
              <div><span className="text-xs text-mut block">কিস্তি</span><b className="num">৳{bn(qhPerInst(loan))}</b></div>
              <div><span className="text-xs text-mut block">বাকি</span><b className="num">৳{bn(qhOutstanding(loan, state.repayments, state.writeoffs))}</b></div>
            </div>
            <div className="max-h-72 overflow-y-auto border border-line rounded-r-sm">
              <table className="w-full text-sm">
                <thead className="bg-card-2 sticky top-0"><tr><th className="px-2 py-1.5 text-left text-xs">#</th><th className="px-2 py-1.5 text-left text-xs">তারিখ</th><th className="px-2 py-1.5 text-right text-xs">অঙ্ক</th><th className="px-2 py-1.5 text-right text-xs">অবস্থা</th></tr></thead>
                <tbody>
                  {insts.map((i) => (
                    <tr key={i.no} className="border-t border-line-2">
                      <td className="px-2 py-1.5 num">{bn(i.no)}</td>
                      <td className="px-2 py-1.5 num">{i.due.slice(5)}</td>
                      <td className="px-2 py-1.5 text-right num">৳{bn(i.amount)}</td>
                      <td className={`px-2 py-1.5 text-right text-xs font-bold ${i.status === 'paid' ? 'text-ok-ink' : i.status === 'overdue' ? 'text-danger-ink' : 'text-mut'}`}>
                        {i.status === 'paid' ? 'পরিশোধিত' : i.status === 'overdue' ? 'বকেয়া' : 'আসন্ন'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {next && <p className="text-xs text-mut mt-2">পরবর্তী কিস্তি: {next.due} · ৳{bn(next.amount)}</p>}
            <p className="text-xs text-ok-ink font-bold mt-1">সুদ ৳০ · অতিরিক্ত কোনো চার্জ নেই</p>
          </Card>
          <Note>কিস্তি ছক মূলধন ÷ মেয়াদ; কোনো সুদ/মুনাফা যোগ হয় না। বকেয়া হলে বিলম্ব ফি নয় — শুধু প্রতিকার ধাপ (D-44)।</Note>
        </div>
      </div>
    </Page>
  );
}
