/* ============================================================
   src/apps/admin/screens/Member360.tsx — AM-05 সদস্য ৩৬০° সারাংশ
   অ্যাকাউন্ট, তোলার যোগ্যতা, ঝুঁকির নোট, KYC, লেনদেন, পরিবর্তন, বার্তা ও নিরাপত্তা।
   ============================================================ */

import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AlertTriangle, Banknote, ChevronDown, ChevronUp, FileText, Heart, Lock, Pencil, Phone, ShieldCheck, Wallet } from 'lucide-react';
import { Badge, Button, Card, Kpi, KpiGrid, Row, SectionHead } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import { accountsOf, availOf, dueTotal, MEM_STATUS, memberById } from '../../../domain/admin';
import { KV, Note } from './parts';

function Accordion({ title, sub, children, open: initial = false }: {
  title: string; sub?: string; children: React.ReactNode; open?: boolean;
}) {
  const [open, setOpen] = useState(initial);
  return (
    <div className="rounded-r-md border border-line bg-card shadow-sh-1 overflow-hidden">
      <button type="button" onClick={() => setOpen((v) => !v)} className="w-full min-h-tap px-4 py-3 flex items-center gap-2 text-left">
        <span className="grow">
          <span className="block font-extrabold text-body">{title}</span>
          {sub ? <span className="block text-xs text-mut">{sub}</span> : null}
        </span>
        {open ? <ChevronUp size={17} className="text-mut" /> : <ChevronDown size={17} className="text-mut" />}
      </button>
      {open ? <div className="px-4 pb-4">{children}</div> : null}
    </div>
  );
}

export default function Member360() {
  const { memberId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { state } = useAdmin();
  const m = memberById(state.members, memberId ?? 'm1');
  const roleQS = params.get('role') ? `?role=${params.get('role')}` : '';

  if (!m) return <div className="p-4"><Note tone="warn">সদস্য পাওয়া যায়নি</Note></div>;

  const accs = accountsOf(state.accounts, m.id);
  const due = dueTotal(state.dues, m.id);
  const txns = state.txns.filter((t) => t.memberId === m.id).slice(0, 4);

  return (
    <div className="p-4 space-y-4 pb-6">
      <div className="flex items-start gap-2">
        <div className="w-14 h-14 rounded-r-lg bg-green-100 text-green-800 grid place-items-center text-2xl font-extrabold shrink-0">{m.photo}</div>
        <div className="grow min-w-0">
          <h2 className="text-h2 leading-tight truncate">{m.name}</h2>
          <p className="text-xs text-mut truncate">{m.father} · {m.occupation}</p>
          <div className="flex flex-wrap gap-1.5 mt-1">
            <Badge tone={MEM_STATUS[m.status].tone}>{MEM_STATUS[m.status].t}</Badge>
            <Badge tone={m.kyc === 'verified' ? 'ok' : 'warn'}>KYC {m.kyc === 'verified' ? 'যাচাইকৃত' : 'বাকি'}</Badge>
          </div>
        </div>
        <Badge tone="brand">{m.no}</Badge>
      </div>

      <KpiGrid cols={3}>
        <Kpi label="মোট সঞ্চয়" value={`৳${bn(accs.reduce((s, a) => s + a.posted, 0))}`} />
        <Kpi label="বকেয়া" value={`৳${bn(due)}`} tone={due ? 'danger' : 'ok'} note={`${bn(state.dues.filter((d) => d.memberId === m.id).length)}টি কিস্তি`} />
        <Kpi label="অ্যাকাউন্ট" value={bn(accs.length)} unit="টি" note={`যোগদান ${m.joined}`} />
      </KpiGrid>

      <Card>
        <KV k="মোবাইল" v={<span className="num">{m.mobile}</span>} />
        <KV k="NID" v={<span className="num">{m.nid}</span>} />
        <KV k="ঠিকানা" v={`${m.village}, ${m.union}, ${m.upazila}, ${m.district}`} />
        <KV k="সংগ্রহক" v={`রাজু আহমেদ · রুট ${m.route} (সোমবার)`} />
        <KV k="নমিনি" v="রোকেয়া বেগম (স্ত্রী) ৬০% · রাবেয়া ৪০%" />
      </Card>

      <div className="flex gap-2">
        <Button size="sm" variant="secondary" className="grow" icon={<Banknote size={15} />} onClick={() => navigate(`/a/entry?member=${m.id}`)}>জমা নিন</Button>
        <Button size="sm" variant="secondary" className="grow" icon={<Pencil size={15} />} onClick={() => navigate(`/a/members/${m.id}/edit${roleQS}`)}>সম্পাদনা</Button>
        <Button size="sm" variant="ghost" icon={<Phone size={15} />} onClick={() => navigate(`/a/claims${roleQS}`)}>কল</Button>
      </div>

      <SectionHead title="অ্যাকাউন্ট ও তোলার যোগ্যতা" sub="R-01 সূত্র · একই ইঞ্জিন" />
      {accs.map((a) => {
        const avail = availOf(a);
        return (
          <Card key={a.id} title={a.scheme} sub={`${a.no} · কিস্তি ${bn(a.paid)}/${bn(a.tenure ?? '—')}`}
            right={<Badge tone={a.status === 'frozen' ? 'danger' : a.status === 'closed' ? 'neutral' : 'ok'}>{a.status === 'frozen' ? 'ফ্রিজ' : a.status === 'closed' ? 'বন্ধ' : 'সক্রিয়'}</Badge>}>
            <KV k="জমা হয়েছে (posted)" v={`৳${bn(a.posted)}`} />
            {a.pending ? <KV k="+ যাচাই বাকি" v={`৳${bn(a.pending)}`} /> : null}
            <KV k="− আটক (hold)" v={`৳${bn(a.hold)}`} />
            <KV k="− সর্বনিম্ন ব্যালেন্স" v={`৳${bn(a.minBal)}`} />
            <KV k="− লক-ইন" v={`৳${bn(a.locked)}`} />
            <KV k="= তোলার যোগ্য" v={<span className="text-ok-ink text-base">৳{bn(avail)}</span>} strong />
            <KV k="পরবর্তী কিস্তি" v={`${a.nextDue}${a.missed ? ` · ${bn(a.missed)}টি বাকি` : ''}`} />
            <div className="flex gap-2 mt-3">
              <Button size="sm" variant="secondary" className="grow" onClick={() => navigate(`/a/entry?account=${a.id}`)}>জমা নিন</Button>
              <Button size="sm" variant="ghost" className="grow" onClick={() => navigate(`/a/accounts/${a.id}${roleQS}`)}>লেজার</Button>
              <Button size="sm" variant="ghost" onClick={() => navigate(`/a/members/${m.id}/close${roleQS}`)}>প্রস্থান</Button>
            </div>
          </Card>
        );
      })}

      <SectionHead title="ঝুঁকির নোট" sub="নিরীক্ষক এগুলো খুঁজবেন" />
      <Card>
        <Row icon={<ShieldCheck size={16} />} title="নমিনির NID সংযুক্ত আছে ✓" sub="মৃত্যু দাবিতে বিলম্ব হবে না" />
        <Row icon={<AlertTriangle size={16} />} title={due ? 'বকেয়া কিস্তি আছে' : 'কোনো বকেয়া নেই'} sub={due ? `৳${bn(due)} — নিষ্পত্তি বা মওকুফ (D-09)` : 'সব কিস্তি সময়মতো'} tone={due ? 'warn' : undefined} />
        <Row icon={<Lock size={16} />} title="শেয়ার মূলধন আলাদা" sub="সঞ্চয়ের সাথে যোগ হবে না (D-04)" />
      </Card>

      <Accordion title="KYC ও ডকুমেন্ট" sub="৩/৪ যাচাইকৃত" open>
        {[['ছবি', 'যাচাইকৃত'], ['NID — সামনে', 'যাচাইকৃত'], ['NID — পেছনে', 'অস্পষ্ট'], ['সাক্ষর', 'যাচাইকৃত']].map(([t, s]) => (
          <div key={t} className="flex items-center justify-between py-2 border-b border-line-2 last:border-b-0">
            <span className="text-sm text-txt">{t}</span>
            <Badge tone={s === 'যাচাইকৃত' ? 'ok' : 'warn'}>{s}</Badge>
          </div>
        ))}
      </Accordion>

      <Accordion title="সাম্প্রতিক লেনদেন" sub={`${bn(txns.length)}টি`}>
        {txns.length === 0 ? <p className="text-sm text-mut">কোনো লেনদেন নেই</p> : null}
        {txns.map((t) => (
          <Row key={t.id} icon={<Wallet size={16} />} title={t.type === 'deposit' ? 'সঞ্চয় জমা' : t.type === 'withdrawal' ? 'উত্তোলন' : t.type === 'fee' ? 'ফি' : 'সংশোধন'}
            sub={`${t.date} · ${t.no} · ${t.status === 'posted' ? 'পোস্টেড' : t.status}`}
            right={<span className={`num font-bold ${t.type === 'deposit' ? 'text-ok' : 'text-danger-ink'}`}>{t.type === 'deposit' ? '+' : '−'}৳{bn(t.amount)}</span>}
            onClick={() => navigate(`/a/txn/${t.id}${roleQS}`)} />
        ))}
        <Button size="sm" variant="ghost" block className="mt-2" onClick={() => navigate(`/a/ledger${roleQS}`)}>সম্পূর্ণ লেজার</Button>
      </Accordion>

      <Accordion title="তথ্য পরিবর্তনের অনুরোধ" sub={`${bn(2)}টি`}>
        <Row icon={<Pencil size={16} />} title="মোবাইল: ০১৭১১ → ০১৮১১" sub="৩০ অক্টো · সংগ্রহক · প্রমাণ: NID" right={<Badge tone="warn">অপেক্ষমাণ</Badge>} />
        <Row icon={<Pencil size={16} />} title="ঠিকানা: গ্রাম — শাপলা" sub="১২ অক্টো · হিসাবরক্ষক · প্রমাণ: NID" right={<Badge tone="ok">প্রযোজ্য</Badge>} />
      </Accordion>

      <Accordion title="পাঠানো বার্তা" sub="৩টি">
        <Row icon={<Phone size={16} />} title="কিস্তির রিমাইন্ডার" sub="৩ দিন আগে · SMS ডেলিভার্ড" />
        <Row icon={<Phone size={16} />} title="জমার রসিদ" sub="আজ · SMS ডেলিভার্ড" />
        <Row icon={<AlertTriangle size={16} />} title="সভার নোটিশ" sub="২৫ অক্টো · SMS ব্যর্থ" tone="warn" />
      </Accordion>

      <Accordion title="অ্যাক্সেস ও নিরাপত্তা" sub="শুধু পঠন">
        <KV k="সদস্যের লগইন" v="মোবাইল + OTP" />
        <KV k="শেষ লগইন" v="২৯ অক্টো · Symphony D80" />
        <KV k="সদস্যের অভিযোগ" v="১টি খোলা (M-21)" />
        <Note tone="info">সদস্যের পিন/পাসওয়ার্ড স্টাফ দেখতে বা বদলাতে পারেন না — রিসেট লিংক SMS-এ যায়।</Note>
      </Accordion>

      <div className="flex gap-2">
        <Button variant="secondary" className="grow" icon={<Heart size={15} />} onClick={() => navigate(`/a/claims${roleQS}`)}>মৃত্যু দাবি</Button>
        <Button variant="ghost" className="grow" icon={<FileText size={15} />} onClick={() => navigate(`/a/members/${m.id}/status${roleQS}`)}>অবস্থা বদলান</Button>
      </div>
    </div>
  );
}
