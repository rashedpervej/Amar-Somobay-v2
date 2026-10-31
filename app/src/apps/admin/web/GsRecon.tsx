/* A-30 · রিকনসিলিয়েশন ও ব্যতিক্রম নিষ্পত্তি — ম্যাচিং, সাসপেন্স H10, সাইন-অফ */
import { useState } from 'react';
import { Badge, Button, Card, DataTable } from '../../../components/ui';
import { inputCls } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import { RECON_KIND, reconPct } from '../../../domain/adminOps';
import { Note, Page, StatBar } from './webParts';
import { Field } from './gsParts';

export default function GsRecon() {
  const { state, resolveException, signOffRecon } = useAdmin();
  const [sel, setSel] = useState(state.reconEx.find((x) => x.status !== 'resolved')?.id ?? state.reconEx[0]?.id ?? '');
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  const r = state.recon;
  const ex = state.reconEx.find((x) => x.id === sel);

  const act = (mode: 'resolve' | 'suspense') => {
    const res = resolveException(sel, mode, note);
    if (!res.ok) { setErr(res.message); setMsg(''); } else { setErr(''); setMsg(res.message); setNote(''); }
  };
  const signOff = () => {
    const res = signOffRecon();
    if (!res.ok) { setErr(res.message); setMsg(''); } else { setErr(''); setMsg(res.message); }
  };

  return (
    <Page title="রিকনসিলিয়েশন" sub="বিকাশ/ব্যাংক স্টেটমেন্ট মিলিয়ে · ব্যতিক্রম বাদে সাইন-অফ নয় · ডেমো" back="/w/cashbook">
      {err && <Note tone="warn">{err}</Note>}
      {msg && <Note tone="ok">{msg}</Note>}
      <StatBar items={[
        { k: 'মিলেছে', v: `${bn(reconPct(r))}%`, tone: 'ok' },
        { k: 'সিস্টেম মোট', v: `৳${bn(r.sysTotal)}` },
        { k: 'স্টেটমেন্ট মোট', v: `৳${bn(r.extTotal)}` },
        { k: 'পার্থক্য', v: `৳${bn(r.diff)}`, tone: r.diff === 0 ? 'ok' : 'danger' },
      ]} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-3">
          <Card title={`${r.period} · ${r.source}`} sub={`মিলেছে ${bn(r.matched)} · বাকি ${bn(r.unmatched)} · সাসপেন্স ${bn(r.suspense)}`}
            right={<Badge tone={r.signedOff ? 'ok' : 'warn'}>{r.signedOff ? 'সাইন-অফ' : 'চলছে'}</Badge>}>
            <div className="space-y-2">
              {r.statements.map((s) => (
                <div key={s.src} className="flex flex-wrap items-center justify-between gap-2 border-b border-line-2 last:border-0 pb-2 text-sm">
                  <div><b>{s.src}</b> <span className="text-xs text-mut">· {s.file} · {s.uploadedAt}</span></div>
                  <div className="num text-xs">{bn(s.matched)}/{bn(s.rows)} মিলেছে · পার্থক্য ৳{bn(s.diff)}</div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <Button onClick={signOff} disabled={r.signedOff || state.reconEx.some((x) => x.status === 'open')}>পিরিয়ড সাইন-অফ</Button>
              <Button variant="secondary" onClick={() => setSel(state.reconEx[0]?.id ?? '')}>প্রথম ব্যতিক্রম</Button>
            </div>
          </Card>

          <Card title="ব্যতিক্রম তালিকা" sub="প্রতিটি অমিলের কারণ ও লিখিত নিষ্পত্তি লাগবে">
            <DataTable
              columns={[
                { key: 'id', head: 'আইডি', render: (x) => <b className="num">{x.id}</b> },
                { key: 'kind', head: 'ধরন', render: (x) => <Badge tone={RECON_KIND[x.kind].tone}>{x.kindBn}</Badge> },
                { key: 'txn', head: 'লেনদেন', render: (x) => <span className="num text-xs">{x.txn}</span> },
                { key: 'member', head: 'সদস্য', render: (x) => x.member },
                { key: 'amt', head: 'অঙ্ক', align: 'right', render: (x) => <b className="num">৳{bn(x.amount)}</b> },
                { key: 'st', head: 'অবস্থা', render: (x) => <Badge tone={x.status === 'resolved' ? 'ok' : x.status === 'suspense' ? 'info' : 'warn'}>{x.status === 'resolved' ? 'নিষ্পত্তি' : x.status === 'suspense' ? 'সাসপেন্স' : 'খোলা'}</Badge> },
                { key: 'act', head: '', align: 'right', render: (x) => <Button size="sm" variant="secondary" onClick={() => setSel(x.id)}>বাছাই</Button> },
              ]}
              rows={state.reconEx}
              empty="কোনো ব্যতিক্রম নেই"
            />
          </Card>
        </div>

        <div className="space-y-3">
          {ex && (
            <Card title={`${ex.kindBn} · ${ex.txn}`} sub={`${ex.member} · ${ex.date} · ডেমো`}
              right={<Badge tone={RECON_KIND[ex.kind].tone}>{ex.kindBn}</Badge>}>
              <p className="text-sm">কারণ: <b>{ex.cause}</b></p>
              <p className="text-sm mt-1">প্রস্তাবিত ব্যবস্থা: <b>{ex.action}</b></p>
              <p className="text-sm mt-1">অঙ্ক: <b className="num">৳{bn(ex.amount)}</b></p>
              <div className="mt-3">
                <Field label="নিষ্পত্তির কারণ / ব্যাখ্যা" hint="অন্তত ৫ অক্ষর">
                  <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} className={`${inputCls} py-2`} placeholder="স্টেটমেন্ট রেফারেন্স, সাক্ষীর নাম, সিদ্ধান্ত" />
                </Field>
              </div>
              <div className="grid gap-2 mt-3">
                <Button onClick={() => act('resolve')} disabled={ex.status === 'resolved'}>নিষ্পত্তি করুন</Button>
                <Button variant="secondary" onClick={() => act('suspense')} disabled={ex.status === 'resolved'}>সাসপেন্স খাতায় (H10)</Button>
              </div>
            </Card>
          )}
          <Note tone="warn">সাইন-অফের আগে সব খোলা ব্যতিক্রম নিষ্পত্তি করতে হবে; কোনো সারি ডিলিট হয় না।</Note>
          <Note>ডেমো স্টেটমেন্ট — বাস্তব ব্যাংক/বিকাশ ফাইল নয়।</Note>
        </div>
      </div>
    </Page>
  );
}
