/* A-39 (মোবাইল) · নোটিশ ও প্রমোশন ব্যবস্থাপনা — খসড়া, প্রকাশ ও পিন */
import { useState } from 'react';
import { Badge, Button, Card, Kpi, KpiGrid } from '../../../components/ui';
import { ErrorBanner, Field, SuccessBanner, inputClass } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useNotices } from '../../../store/noticeStore';
import { NOTICE_KIND, NOTICE_STATUS, noticeStats, type NoticeKind } from '../../../domain/notice';
import { Hero, Note } from './parts';

export default function NoticesManager() {
  const { notices, addNotice, togglePublish, togglePin, archiveNotice } = useNotices();
  const st = noticeStats(notices);
  const [f, setF] = useState<{ title: string; body: string; kind: NoticeKind }>({ title: '', body: '', kind: 'notice' });
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('');

  const run = (r: { ok: boolean; message: string }) => {
    if (!r.ok) { setErr(r.message); setMsg(''); } else { setErr(''); setMsg(r.message); }
  };
  const save = () => {
    const r = addNotice({ ...f, audience: 'সব সদস্য', pinned: false });
    run(r);
    if (r.ok) setF({ title: '', body: '', kind: 'notice' });
  };

  return (
    <div className="p-4 space-y-3 pb-6">
      <Hero label="নোটিশ ও প্রমোশন" amount={`${bn(st.published)} প্রকাশিত`} sub="খসড়া তৈরি → কমিটি অনুমোদন → প্রকাশ (ডেমো)"
        chips={<><span className="text-xs">{bn(st.draft)} খসড়া</span><span className="text-xs">{bn(st.pinned)} পিন</span></>} />
      <KpiGrid>
        <Kpi label="মোট" value={bn(st.total)} />
        <Kpi label="প্রকাশিত" value={bn(st.published)} tone="ok" />
        <Kpi label="খসড়া" value={bn(st.draft)} tone="warn" />
        <Kpi label="পিন" value={bn(st.pinned)} />
      </KpiGrid>
      {msg ? <SuccessBanner title={msg}>ডেমো — বাস্তব SMS/Push যায়নি।</SuccessBanner> : null}
      {err ? <ErrorBanner>{err}</ErrorBanner> : null}

      <Card title="নোটিশ তালিকা" sub={`${bn(notices.length)}টি`}>
        <div className="divide-y divide-line-2">
          {notices.map((n) => (
            <div key={n.id} className="py-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-bold text-sm">{n.pinned ? '📌 ' : ''}{n.title}</div>
                  <div className="text-xs text-mut mt-0.5">{NOTICE_KIND[n.kind].t} · {n.at} · {n.audience}</div>
                </div>
                <Badge tone={NOTICE_STATUS[n.status].tone}>{NOTICE_STATUS[n.status].t}</Badge>
              </div>
              <p className="text-xs text-txt-2 mt-1 line-clamp-2">{n.body}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <Button size="sm" variant="secondary" onClick={() => run(togglePublish(n.id))} disabled={n.status === 'archived'}>{n.status === 'published' ? 'অপ্রকাশ' : 'প্রকাশ'}</Button>
                <Button size="sm" variant="secondary" onClick={() => run(togglePin(n.id))} disabled={n.status === 'archived'}>{n.pinned ? 'আনপিন' : 'পিন'}</Button>
                <Button size="sm" variant="ghost" onClick={() => run(archiveNotice(n.id))} disabled={n.status === 'archived'}>আর্কাইভ</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="নতুন নোটিশ" sub="প্রথমে খসড়া">
        <div className="space-y-3">
          <Field label="শিরোনাম">{(id) => <input id={id} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} className={inputClass()} />}</Field>
          <Field label="বিস্তারিত">{(id) => <textarea id={id} rows={3} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} className={inputClass()} />}</Field>
          <Field label="ধরন">{(id) => (
            <select id={id} value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value as NoticeKind })} className={inputClass()}>
              <option value="notice">নোটিশ</option><option value="promotion">প্রমোশন</option><option value="meeting">সভা</option>
            </select>
          )}</Field>
        </div>
        <Button block className="mt-3" onClick={save}>খসড়া সংরক্ষণ</Button>
      </Card>
      <Note tone="warn">শতাংশ-ভিত্তিক মুনাফার দাবি নেই (D-01); আর্কাইভ মানে মুছে ফেলা নয়।</Note>
    </div>
  );
}
