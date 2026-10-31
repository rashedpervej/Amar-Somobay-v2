import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import { Badge, Button, Card, DataTable } from '../../../components/ui';
import { inputCls } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import { accountsOf, duesOfMember, CHANNEL_LABEL } from '../../../domain/admin';
import { Note, Page, StatBar } from './webParts';
import { Field, MemberStatus, gsDueLeft } from './gsParts';

const TABS = ['সারসংক্ষেপ', 'হিসাব', 'লেনদেন', 'বকেয়া', 'KYC ও নথি'] as const;

export default function GsMemberDetail() {
  const { memberId } = useParams();
  const { state, saveMemberChange } = useAdmin();
  const nav = useNavigate();
  const m = state.members.find((x) => x.id === memberId) ?? state.members[0];
  const accs = accountsOf(state.accounts, m.id);
  const dues = duesOfMember(state.dues, m.id);
  const txns = state.txns.filter((t) => t.memberId === m.id);
  const [tab, setTab] = useState<(typeof TABS)[number]>('সারসংক্ষেপ');
  const [edit, setEdit] = useState(false);
  const [f, setF] = useState({ name: m.name, mobile: m.mobile, village: m.village, occupation: m.occupation });
  const [reason, setReason] = useState(''); const [proof, setProof] = useState('');
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  const total = accs.reduce((n, a) => n + a.posted, 0);
  const due = gsDueLeft(dues);

  const save = () => {
    const r = saveMemberChange(m.id, { name: f.name, mobile: f.mobile, village: f.village, occupation: f.occupation }, reason, proof);
    if (!r.ok) { setErr(r.message); setMsg(''); } else { setErr(''); setMsg(r.message); setEdit(false); }
  };

  return (
    <Page title={m.name} sub={<><span className="num">{m.no}</span> · {m.mobile} · রুট {m.route} · যোগদান {m.joined} · ডেমো</>}
      back="/w/members"
      right={<><Button size="sm" variant="secondary" icon={<Pencil size={14} />} onClick={() => setEdit((v) => !v)}>তথ্য সম্পাদনা</Button><Button size="sm" variant="secondary" onClick={() => nav(`/w/members/${m.id}/exit`)}>প্রস্থান / নিষ্পত্তি</Button><Button size="sm" onClick={() => nav(`/w/deposits/new?member=${m.id}`)}>নতুন জমা</Button></>}>
      {err && <Note tone="warn">{err}</Note>}
      {msg && <Note tone="ok">{msg}</Note>}

      <div className="flex flex-wrap items-center gap-2">
        <span className="size-11 rounded-r-pill bg-green-100 text-green-800 grid place-items-center font-extrabold">{m.photo || m.name.slice(0, 1)}</span>
        <MemberStatus s={m.status} />
        <Badge tone={m.kyc === 'verified' ? 'ok' : 'warn'}>{m.kyc === 'verified' ? 'KYC যাচাইকৃত' : 'KYC বাকি'}</Badge>
        <span className="text-sm text-mut">{m.village}, {m.union} · {m.occupation}</span>
      </div>

      <StatBar items={[
        { k: 'মোট স্থিতি', v: `৳${bn(total)}` },
        { k: 'হিসাব', v: bn(accs.length) },
        { k: 'বকেয়া', v: `৳${bn(due)}`, tone: due ? 'danger' : 'ok' },
        { k: 'লেনদেন', v: bn(txns.length) },
      ]} />

      <div className="flex flex-wrap gap-1.5">
        {TABS.map((t) => <button key={t} type="button" onClick={() => setTab(t)} className={`min-h-10 px-3 rounded-r-pill border text-xs font-bold ${tab === t ? 'bg-green-700 text-white border-green-800' : 'bg-card border-line-3 text-txt-2'}`}>{t}</button>)}
      </div>

      {edit && (
        <Card title="তথ্য সম্পাদনা" sub="কারণ ও প্রমাণ ছাড়া সংরক্ষণ হবে না · maker ≠ checker">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="নাম"><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={inputCls} /></Field>
            <Field label="মোবাইল"><input value={f.mobile} onChange={(e) => setF({ ...f, mobile: e.target.value })} className={`${inputCls} num`} /></Field>
            <Field label="গ্রাম"><input value={f.village} onChange={(e) => setF({ ...f, village: e.target.value })} className={inputCls} /></Field>
            <Field label="পেশা"><input value={f.occupation} onChange={(e) => setF({ ...f, occupation: e.target.value })} className={inputCls} /></Field>
            <Field label="পরিবর্তনের কারণ"><textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} className={`${inputCls} py-2`} /></Field>
            <Field label="প্রমাণ / নথি রেফারেন্স"><input value={proof} onChange={(e) => setProof(e.target.value)} className={inputCls} placeholder="NID কপি / সাক্ষীর নাম" /></Field>
          </div>
          <Button className="mt-3" onClick={save}>পরিবর্তন জমা</Button>
        </Card>
      )}

      {tab === 'সারসংক্ষেপ' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="ব্যক্তিগত তথ্য">
            <div className="grid sm:grid-cols-2 gap-2 text-sm">
              <p>পিতা/স্বামী: <b>{m.father}</b></p>
              <p>NID: <b className="num">{m.nid}</b></p>
              <p>মোবাইল: <b className="num">{m.mobile}</b></p>
              <p>যোগদান: <b className="num">{m.joined}</b></p>
              <p className="sm:col-span-2">ঠিকানা: <b>{m.village}, {m.union}, {m.upazila}, {m.district}</b></p>
            </div>
          </Card>
          <Card title="দ্রুত কাজ" sub="সব পর্দা কার্যকরী">
            <div className="grid sm:grid-cols-2 gap-2">
              {[
                ['অবস্থা পরিবর্তন', `/w/members/${m.id}/status`],
                ['মৃত্যু দাবি', '/w/claims'],
                ['সদস্য স্থানান্তর', '/w/moves'],
                ['দিনশেষ ক্যাশ', '/w/cashbook'],
              ].map(([t, to]) => <Button key={t} size="sm" variant="secondary" onClick={() => nav(to)}>{t}</Button>)}
            </div>
          </Card>
        </div>
      )}

      {tab === 'হিসাব' && (
        <Card title="সঞ্চয় হিসাব" sub="প্রতিটি হিসাব আলাদা খতিয়ান">
          <DataTable
            columns={[
              { key: 'no', head: 'হিসাব', render: (a) => <button type="button" className="min-h-10 font-bold text-green-800 hover:underline num" onClick={() => nav(`/w/accounts/${a.id}`)}>{a.no}</button> },
              { key: 'scheme', head: 'স্কিম', render: (a) => a.scheme },
              { key: 'posted', head: 'স্থিতি', align: 'right', render: (a) => `৳${bn(a.posted)}` },
              { key: 'hold', head: 'হোল্ড', align: 'right', render: (a) => `৳${bn(a.hold)}` },
              { key: 'next', head: 'পরবর্তী কিস্তি', render: (a) => a.nextDue },
              { key: 'st', head: 'অবস্থা', render: (a) => <Badge tone={a.status === 'active' ? 'ok' : a.status === 'frozen' ? 'warn' : 'neutral'}>{a.status === 'active' ? 'সক্রিয়' : a.status === 'frozen' ? 'ফ্রিজ' : 'বন্ধ'}</Badge> },
            ]}
            rows={accs}
            empty="কোনো হিসাব নেই"
          />
        </Card>
      )}

      {tab === 'লেনদেন' && (
        <Card title="লেনদেন" sub="সব পোস্টেড এন্ট্রি">
          <DataTable
            columns={[
              { key: 'no', head: 'লেনদেন', render: (t) => t.no },
              { key: 'type', head: 'ধরন', render: (t) => t.type === 'deposit' ? 'জমা' : t.type === 'withdrawal' ? 'উত্তোলন' : t.type === 'fee' ? 'ফি' : 'সমন্বয়' },
              { key: 'amount', head: 'অঙ্ক', align: 'right', render: (t) => `৳${bn(t.amount)}` },
              { key: 'ch', head: 'মাধ্যম', render: (t) => CHANNEL_LABEL[t.channel] },
              { key: 'date', head: 'তারিখ', render: (t) => t.date },
              { key: 'st', head: 'অবস্থা', render: (t) => <Badge tone={t.status === 'posted' ? 'ok' : t.status === 'reversed' ? 'danger' : 'warn'}>{t.status === 'posted' ? 'পোস্টেড' : t.status === 'reversed' ? 'রিভার্সড' : 'অপেক্ষমাণ'}</Badge> },
            ]}
            rows={txns}
            empty="কোনো লেনদেন নেই"
          />
        </Card>
      )}

      {tab === 'বকেয়া' && (
        <Card title="বকেয়া কিস্তি" sub="বিলম্ব ফি নির্ধারিত ফি — সুদ নেই">
          <DataTable
            columns={[
              { key: 'inst', head: 'কিস্তি', render: (d) => `#${bn(d.instNo)}` },
              { key: 'due', head: 'নির্ধারিত', render: (d) => d.due },
              { key: 'amount', head: 'অঙ্ক', align: 'right', render: (d) => `৳${bn(d.amount)}` },
              { key: 'paid', head: 'পরিশোধ', align: 'right', render: (d) => `৳${bn(d.paid)}` },
              { key: 'late', head: 'বিলম্ব ফি', align: 'right', render: (d) => `৳${bn(d.lateFee)}` },
              { key: 'band', head: 'ব্যান্ড', render: (d) => d.band },
            ]}
            rows={dues}
            empty="কোনো বকেয়া নেই"
          />
        </Card>
      )}

      {tab === 'KYC ও নথি' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="KYC চেকলিস্ট" sub="প্রমাণ ছাড়া যাচাই complete নয়">
            {['NID সামনে ও পিছনে', 'মোবাইল মালিকানা', 'ছবি ও স্বাক্ষর', 'নমিনি তথ্য'].map((x, i) => (
              <div key={x} className="flex items-center justify-between py-2 border-b border-line-2 last:border-0 text-sm">
                <span>{x}</span><Badge tone={i < 2 || m.kyc === 'verified' ? 'ok' : 'warn'}>{i < 2 || m.kyc === 'verified' ? 'সংযুক্ত' : 'বাকি'}</Badge>
              </div>
            ))}
          </Card>
          <Card title="নমিনি"><p className="text-sm text-mut">নমিনি তথ্য মোবাইল অ্যাপের প্রোফাইল থেকে নেওয়া; ডেস্কটপে এখানে দেখা যাবে। লভ্যাংশ নেই; সুদ নেই।</p></Card>
        </div>
      )}
    </Page>
  );
}
