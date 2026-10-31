/* A-39 · নোটিশ ও প্রমোশন ব্যবস্থাপনা — খসড়া, প্রকাশ, পিন, আর্কাইভ */
import { useState } from 'react';
import { Badge, Button, Card, DataTable } from '../../../components/ui';
import { inputCls } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useNotices } from '../../../store/noticeStore';
import { NOTICE_KIND, NOTICE_STATUS, noticeStats, type NoticeKind } from '../../../domain/notice';
import { Note, Page, StatBar } from './webParts';
import { Field } from './gsParts';

export default function GsNotices() {
  const { notices, addNotice, togglePublish, togglePin, archiveNotice } = useNotices();
  const stats = noticeStats(notices);
  const [f, setF] = useState<{ title: string; body: string; kind: NoticeKind; audience: 'সব সদস্য' | 'শুধু সদস্য' | 'কমিটি'; pinned: boolean }>({
    title: '', body: '', kind: 'notice', audience: 'সব সদস্য', pinned: false,
  });
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('');

  const run = (r: { ok: boolean; message: string }) => {
    if (!r.ok) { setErr(r.message); setMsg(''); } else { setErr(''); setMsg(r.message); }
  };
  const save = () => {
    const r = addNotice(f);
    run(r);
    if (r.ok) setF({ title: '', body: '', kind: 'notice', audience: 'সব সদস্য', pinned: false });
  };

  return (
    <Page title="নোটিশ ও প্রমোশন" sub="খসড়া → প্রকাশ → আর্কাইভ · পিন করা নোটিশ সদস্য অ্যাপে উপরে · ডেমো" back="/w/dashboard"
      right={<Button size="sm" variant="secondary" onClick={() => window.print()}>তালিকা প্রিন্ট (ডেমো)</Button>}>
      {err && <Note tone="warn">{err}</Note>}
      {msg && <Note tone="ok">{msg}</Note>}
      <StatBar items={[
        { k: 'মোট', v: bn(stats.total) },
        { k: 'প্রকাশিত', v: bn(stats.published), tone: 'ok' },
        { k: 'খসড়া', v: bn(stats.draft), tone: 'warn' },
        { k: 'পিন করা', v: bn(stats.pinned) },
      ]} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        <Card title="নোটিশ তালিকা" sub="প্রকাশ/অপ্রকাশ ও পিন সরাসরি কাজ করে">
          <DataTable
            columns={[
              { key: 'title', head: 'শিরোনাম', render: (n) => <span><b>{n.title}</b><span className="block text-xs text-mut">{n.at} · {n.by}</span></span> },
              { key: 'kind', head: 'ধরন', render: (n) => <Badge tone={NOTICE_KIND[n.kind].tone}>{NOTICE_KIND[n.kind].t}</Badge> },
              { key: 'aud', head: 'শ্রোতা', render: (n) => n.audience },
              { key: 'st', head: 'অবস্থা', render: (n) => <Badge tone={NOTICE_STATUS[n.status].tone}>{NOTICE_STATUS[n.status].t}</Badge> },
              { key: 'act', head: '', align: 'right', render: (n) => (
                <div className="flex justify-end gap-1">
                  <Button size="sm" variant="secondary" onClick={() => run(togglePublish(n.id))} disabled={n.status === 'archived'}>{n.status === 'published' ? 'অপ্রকাশ' : 'প্রকাশ'}</Button>
                  <Button size="sm" variant="secondary" onClick={() => run(togglePin(n.id))} disabled={n.status === 'archived'}>{n.pinned ? 'আনপিন' : 'পিন'}</Button>
                  <Button size="sm" variant="danger" onClick={() => run(archiveNotice(n.id))} disabled={n.status === 'archived'}>আর্কাইভ</Button>
                </div>
              ) },
            ]}
            rows={notices}
            empty="কোনো নোটিশ নেই"
          />
        </Card>

        <div className="space-y-3">
          <Card title="নতুন নোটিশ" sub="প্রথমে খসড়া তৈরি হবে — প্রকাশ আলাদা ধাপ">
            <div className="space-y-3">
              <Field label="শিরোনাম"><input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} className={inputCls} placeholder="যেমন: কিস্তি জমার সময়সূচি" /></Field>
              <Field label="বিস্তারিত" hint="অন্তত ১৫ অক্ষর"><textarea rows={4} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} className={`${inputCls} py-2`} placeholder="কী, কখন, কার জন্য — স্পষ্টভাবে লিখুন" /></Field>
              <Field label="ধরন">
                <select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value as NoticeKind })} className={inputCls}>
                  <option value="notice">নোটিশ</option>
                  <option value="promotion">প্রমোশন</option>
                  <option value="meeting">সভা</option>
                </select>
              </Field>
              <Field label="শ্রোতা">
                <select value={f.audience} onChange={(e) => setF({ ...f, audience: e.target.value as typeof f.audience })} className={inputCls}>
                  {['সব সদস্য', 'শুধু সদস্য', 'কমিটি'].map((a) => <option key={a}>{a}</option>)}
                </select>
              </Field>
              <button type="button" onClick={() => setF({ ...f, pinned: !f.pinned })} className="min-h-10 w-full flex items-center gap-2 text-left text-sm">
                <span className={`w-5 h-5 rounded-r-sm border grid place-items-center ${f.pinned ? 'bg-green-700 border-green-800 text-white' : 'border-line-3 bg-card'}`}>{f.pinned ? '✓' : ''}</span>
                উপরে পিন করুন
              </button>
            </div>
            <Button block className="mt-3" onClick={save}>খসড়া সংরক্ষণ</Button>
          </Card>
          <Card title="প্রমোশনের নীতি" sub="D-01 · D-18">
            <ul className="text-sm text-mut space-y-1.5">
              <li>• কোনো শতাংশ-ভিত্তিক মুনাফা বা নিশ্চিত প্রাপ্তির দাবি নয়।</li>
              <li>• প্রকাশের আগে কমিটির অনুমোদন; খসড়া সদস্য অ্যাপে দেখায় না।</li>
              <li>• আর্কাইভ = মুছে ফেলা নয়; ইতিহাস অডিটে থাকে (R-02)।</li>
              <li>• সভার নোটিশ একই স্টোরে সভা-হাজিরার সাথে যুক্ত।</li>
            </ul>
          </Card>
          <Note tone="warn">ডেমো — বাস্তব SMS/Push বা সদস্য অ্যাপে বার্তা যায় না।</Note>
        </div>
      </div>
    </Page>
  );
}
