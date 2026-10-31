/* A-40 (মোবাইল) · সভা ও হাজিরা — আসন্ন সভা, কোরাম, উপস্থিতি ও সমাপ্তি */
import { useState } from 'react';
import { Badge, Button, Card, Kpi, KpiGrid } from '../../../components/ui';
import { ErrorBanner, Field, SuccessBanner, inputClass } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { SEED_MEMBERS } from '../../../domain/admin';
import { useNotices } from '../../../store/noticeStore';
import { ATTEND, meetingStats, presentCount, type AttendStatus } from '../../../domain/notice';
import { Hero, Note } from './parts';

export default function MeetingsManager() {
  const { meetings, addMeeting, setAttendance, closeMeeting } = useNotices();
  const st = meetingStats(meetings);
  const [sel, setSel] = useState(meetings.find((m) => m.status === 'scheduled')?.id ?? meetings[0]?.id ?? '');
  const [title, setTitle] = useState('');
  const [at, setAt] = useState('');
  const [venue, setVenue] = useState('');
  const [minutes, setMinutes] = useState('');
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  const m = meetings.find((x) => x.id === sel);

  const run = (r: { ok: boolean; message: string }) => {
    if (!r.ok) { setErr(r.message); setMsg(''); } else { setErr(''); setMsg(r.message); }
  };
  const create = () => {
    const r = addMeeting({ title, at, time: 'সকাল ১০:০০', venue, agenda: 'আলোচ্যসূচি পরে যোগ হবে', quorum: 5 });
    run(r);
    if (r.ok) { setTitle(''); setAt(''); setVenue(''); }
  };

  return (
    <div className="p-4 space-y-3 pb-6">
      <Hero label="সভা ও হাজিরা" amount={`${bn(st.scheduled)} আসন্ন`} sub="কোরাম, উপস্থিতি ও কার্যবিবরণী (ডেমো)"
        chips={<><span className="text-xs">{bn(st.done)} সমাপ্ত</span><span className="text-xs">{bn(st.present)} উপস্থিতি</span></>} />
      <KpiGrid>
        <Kpi label="সভা" value={bn(st.total)} />
        <Kpi label="আসন্ন" value={bn(st.scheduled)} tone="warn" />
        <Kpi label="সমাপ্ত" value={bn(st.done)} tone="ok" />
        <Kpi label="উপস্থিতি" value={bn(st.present)} />
      </KpiGrid>
      {msg ? <SuccessBanner title={msg}>ডেমো — বাস্তব সভার তথ্য নয়।</SuccessBanner> : null}
      {err ? <ErrorBanner>{err}</ErrorBanner> : null}

      <Card title="সভা বাছাই" sub="হাজিরা নিতে সভা নির্বাচন করুন">
        <div className="space-y-2">
          {meetings.map((x) => (
            <button key={x.id} type="button" onClick={() => setSel(x.id)}
              className={`w-full min-h-tap text-left rounded-r-sm border px-3 py-2 ${x.id === sel ? 'border-green-700 bg-green-050' : 'border-line-3 bg-card'}`}>
              <span className="flex items-center justify-between gap-2">
                <b className="text-sm">{x.title}</b>
                <Badge tone={x.status === 'done' ? 'ok' : 'warn'}>{x.status === 'done' ? 'সমাপ্ত' : 'আসন্ন'}</Badge>
              </span>
              <span className="block text-xs text-mut mt-0.5">{x.at} · {x.venue} · উপস্থিত {bn(presentCount(x))}/{bn(x.attendance.length)}</span>
            </button>
          ))}
        </div>
      </Card>

      {m && (
        <Card title={m.title} sub={`কোরাম ${bn(m.quorum)} · ${m.at}`}>
          <div className="space-y-2">
            {(m.attendance.length ? m.attendance : SEED_MEMBERS.map((x) => ({ memberId: x.id, name: x.name, status: 'absent' as AttendStatus }))).map((a) => (
              <div key={a.memberId} className="rounded-r-sm border border-line px-2.5 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold">{a.name}</span>
                  <span className="text-xs text-mut">{ATTEND[a.status].t}</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 mt-1.5">
                  {(['present', 'absent', 'excused'] as AttendStatus[]).map((s) => (
                    <button key={s} type="button" onClick={() => run(setAttendance(m.id, a.memberId, s))} disabled={m.status === 'done'}
                      className={`min-h-tap rounded-r-sm border text-xs font-bold ${a.status === s ? 'bg-green-700 text-white border-green-800' : 'bg-card border-line-3 text-txt-2'} disabled:opacity-40`}>
                      {ATTEND[s].t}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {m.status === 'scheduled' && (
            <>
              <div className="mt-3"><Field label="কার্যবিবরণী">{(id) => <textarea id={id} rows={2} value={minutes} onChange={(e) => setMinutes(e.target.value)} className={inputClass()} placeholder="গৃহীত সিদ্ধান্ত" />}</Field></div>
              <Button block className="mt-2" onClick={() => run(closeMeeting(m.id, minutes))}>সভা সমাপ্ত করুন</Button>
            </>
          )}
          {m.minutes && <p className="text-xs text-mut mt-2">{m.minutes}</p>}
        </Card>
      )}

      <Card title="নতুন সভা" sub="তারিখ ও স্থান দিন">
        <div className="space-y-3">
          <Field label="নাম">{(id) => <input id={id} value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass()} />}</Field>
          <Field label="তারিখ">{(id) => <input id={id} value={at} onChange={(e) => setAt(e.target.value)} className={inputClass()} placeholder="১৫ নভেম্বর ২০২৬" />}</Field>
          <Field label="স্থান">{(id) => <input id={id} value={venue} onChange={(e) => setVenue(e.target.value)} className={inputClass()} />}</Field>
        </div>
        <Button block className="mt-3" onClick={create}>সভা তৈরি করুন</Button>
      </Card>
      <Note tone="warn">সমাপ্ত সভার হাজিরা বদলানো যায় না; কোরাম কম হলে সিদ্ধান্ত নয়।</Note>
    </div>
  );
}
