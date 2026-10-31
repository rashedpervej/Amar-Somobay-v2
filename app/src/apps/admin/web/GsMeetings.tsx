/* A-40 · সভা ও হাজিরা — সভা তৈরি, কোরাম, উপস্থিতি ও কার্যবিবরণী */
import { useState } from 'react';
import { Badge, Button, Card, DataTable } from '../../../components/ui';
import { inputCls } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useNotices } from '../../../store/noticeStore';
import { SEED_MEMBERS } from '../../../domain/admin';
import { ATTEND, meetingStats, presentCount, type AttendStatus } from '../../../domain/notice';
import { Note, Page, StatBar } from './webParts';
import { Field, ProgressBar } from './gsParts';

export default function GsMeetings() {
  const { meetings, addMeeting, setAttendance, closeMeeting } = useNotices();
  const stats = meetingStats(meetings);
  const [f, setF] = useState({ title: '', at: '', time: 'সকাল ১০:০০', venue: '', agenda: '', quorum: '6' });
  const [sel, setSel] = useState(meetings.find((m) => m.status === 'scheduled')?.id ?? meetings[0]?.id ?? '');
  const [minutes, setMinutes] = useState('');
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  const m = meetings.find((x) => x.id === sel) ?? meetings[0];

  const run = (r: { ok: boolean; message: string }) => {
    if (!r.ok) { setErr(r.message); setMsg(''); } else { setErr(''); setMsg(r.message); }
  };
  const create = () => {
    const r = addMeeting({ ...f, quorum: Number(f.quorum) });
    run(r);
    if (r.ok) setF({ ...f, title: '', at: '', venue: '', agenda: '' });
  };
  const mark = (memberId: string, status: AttendStatus) => run(setAttendance(sel, memberId, status));

  return (
    <Page title="সভা ও হাজিরা" sub="সভা তৈরি · কোরাম · উপস্থিতি · কার্যবিবরণী · ডেমো" back="/w/dashboard">
      {err && <Note tone="warn">{err}</Note>}
      {msg && <Note tone="ok">{msg}</Note>}
      <StatBar items={[
        { k: 'মোট সভা', v: bn(stats.total) },
        { k: 'আসন্ন', v: bn(stats.scheduled), tone: 'warn' },
        { k: 'সমাপ্ত', v: bn(stats.done), tone: 'ok' },
        { k: 'মোট উপস্থিতি', v: bn(stats.present) },
      ]} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-3">
          <Card title="সভা তালিকা" sub="‘বাছাই’ করে হাজিরা নিন">
            <DataTable
              columns={[
                { key: 'title', head: 'সভা', render: (x) => <span><b>{x.title}</b><span className="block text-xs text-mut">{x.at} · {x.time} · {x.venue}</span></span> },
                { key: 'q', head: 'কোরাম', align: 'right', render: (x) => <span className="num">{bn(x.quorum)}</span> },
                { key: 'p', head: 'উপস্থিত', align: 'right', render: (x) => <b className="num">{bn(presentCount(x))}</b> },
                { key: 'st', head: 'অবস্থা', render: (x) => <Badge tone={x.status === 'done' ? 'ok' : 'warn'}>{x.status === 'done' ? 'সমাপ্ত' : 'আসন্ন'}</Badge> },
                { key: 'act', head: '', align: 'right', render: (x) => <Button size="sm" variant="secondary" onClick={() => setSel(x.id)}>বাছাই</Button> },
              ]}
              rows={meetings}
              empty="কোনো সভা নেই"
            />
          </Card>

          {m && (
            <Card title={`${m.title} · হাজিরা`} sub={`${m.at} · ${m.venue} · ডেমো`}
              right={<Badge tone={m.status === 'done' ? 'ok' : 'warn'}>{m.status === 'done' ? 'সমাপ্ত' : 'আসন্ন'}</Badge>}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span>কোরাম <b className="num">{bn(m.quorum)}</b> · উপস্থিত <b className="num">{bn(presentCount(m))}</b></span>
                <b className="num">{bn(Math.round((presentCount(m) / Math.max(1, m.attendance.length)) * 100))}%</b>
              </div>
              <ProgressBar pct={Math.round((presentCount(m) / Math.max(1, m.attendance.length)) * 100)} tone={presentCount(m) >= m.quorum ? 'ok' : 'warn'} />
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr><th className="text-left px-2 py-2 border-b border-line">সদস্য</th>
                      {(['present', 'absent', 'excused'] as AttendStatus[]).map((s) => <th key={s} className="px-2 py-2 border-b border-line text-center">{ATTEND[s].t}</th>)}</tr>
                  </thead>
                  <tbody>
                    {(m.attendance.length ? m.attendance : SEED_MEMBERS.map((x) => ({ memberId: x.id, name: x.name, status: 'absent' as AttendStatus }))).map((a) => (
                      <tr key={a.memberId}>
                        <td className="px-2 py-1.5 border-b border-line-2">{a.name}</td>
                        {(['present', 'absent', 'excused'] as AttendStatus[]).map((s) => (
                          <td key={s} className="px-2 py-1.5 border-b border-line-2 text-center">
                            <button type="button" onClick={() => mark(a.memberId, s)} disabled={m.status === 'done'}
                              aria-label={`${a.name} — ${ATTEND[s].t}`}
                              className={`min-h-10 w-9 rounded-r-pill border ${a.status === s ? 'bg-green-700 text-white border-green-800' : 'bg-card border-line-3'} disabled:opacity-40`}>
                              {a.status === s ? '✓' : ''}
                            </button>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {m.minutes && <p className="text-xs text-mut mt-2">কার্যবিবরণী: {m.minutes}</p>}
              {m.status === 'scheduled' && (
                <>
                  <div className="mt-3">
                    <Field label="কার্যবিবরণী" hint="সভা সমাপ্ত করতে অন্তত ১০ অক্ষর">
                      <textarea rows={2} value={minutes} onChange={(e) => setMinutes(e.target.value)} className={`${inputCls} py-2`} placeholder="গৃহীত সিদ্ধান্ত ও দায়িত্ব" />
                    </Field>
                  </div>
                  <Button className="mt-2" onClick={() => run(closeMeeting(m.id, minutes))}>সভা সমাপ্ত করুন</Button>
                </>
              )}
            </Card>
          )}
        </div>

        <div className="space-y-3">
          <Card title="নতুন সভা" sub="তারিখ, স্থান, আলোচ্যসূচি ও কোরাম">
            <div className="space-y-3">
              <Field label="সভার নাম"><input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} className={inputCls} placeholder="যেমন: কমিটি সভা" /></Field>
              <Field label="তারিখ"><input value={f.at} onChange={(e) => setF({ ...f, at: e.target.value })} className={inputCls} placeholder="১৫ নভেম্বর ২০২৬" /></Field>
              <Field label="সময়"><input value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} className={inputCls} /></Field>
              <Field label="স্থান"><input value={f.venue} onChange={(e) => setF({ ...f, venue: e.target.value })} className={inputCls} placeholder="সমবায় ভবন" /></Field>
              <Field label="আলোচ্যসূচি"><textarea rows={2} value={f.agenda} onChange={(e) => setF({ ...f, agenda: e.target.value })} className={`${inputCls} py-2`} /></Field>
              <Field label="কোরাম (জন)"><input type="number" value={f.quorum} onChange={(e) => setF({ ...f, quorum: e.target.value })} className={`${inputCls} num`} /></Field>
            </div>
            <Button block className="mt-3" onClick={create}>সভা তৈরি করুন</Button>
          </Card>
          <Note tone="warn">কোরাম পূরণ না হলে সিদ্ধান্ত গ্রহণ করা যাবে না; হাজিরা অপরিবর্তনীয় রাখতে সভা সমাপ্ত করুন।</Note>
          <Note>ডেমো — সভা বা হাজিরা বাস্তব সংস্থায় যায় না; কোনো সুদ নেই।</Note>
        </div>
      </div>
    </Page>
  );
}
