/* M-22 · সভা ও নোটিশ — আসন্ন সভা, হাজিরা/উপস্থিতি জানানো ও সংস্থার নোটিশ */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, MapPin, Megaphone, Pin, Users } from 'lucide-react';
import { Badge, Button, Card, Chip, Chipset } from '../../../components/ui';
import { EmptyState } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useNotices } from '../../../store/noticeStore';
import { ATTEND, NOTICE_KIND, presentCount, type AttendStatus } from '../../../domain/notice';

export default function Meetings() {
  const navigate = useNavigate();
  const { notices, meetings, setAttendance } = useNotices();
  const [tab, setTab] = useState<'meetings' | 'notices'>('meetings');
  const [openId, setOpenId] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const published = useMemo(() => notices.filter((n) => n.status === 'published'), [notices]);
  const upcoming = meetings.filter((m) => m.status === 'scheduled');

  const rsvp = (id: string, status: AttendStatus) => {
    const r = setAttendance(id, 'm1', status);
    setMsg(r.message);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-h1 font-extrabold text-txt">সভা ও নোটিশ</div>
          <p className="text-sm text-mut mt-1">আসন্ন সভা · উপস্থিতি · সংস্থার ঘোষণা · ডেমো</p>
        </div>
        <Badge tone="brand">M-22</Badge>
      </div>

      <Chipset>
        <Chip active={tab === 'meetings'} onClick={() => setTab('meetings')}>সভা ({bn(meetings.length)})</Chip>
        <Chip active={tab === 'notices'} onClick={() => setTab('notices')}>নোটিশ ({bn(published.length)})</Chip>
      </Chipset>

      {msg && <div className="rounded-r-sm border border-ok-bd bg-ok-bg text-ok-ink px-3 py-2 text-sm">{msg}</div>}

      {tab === 'meetings' && (
        <div className="space-y-3">
          {upcoming.length > 0 && (
            <Card title="আসন্ন সভা" sub="উপস্থিতি জানালে কমিটি আগেই প্রস্তুতি নিতে পারে">
              <div className="space-y-3">
                {upcoming.map((m) => {
                  const mine = m.attendance.find((a) => a.memberId === 'm1');
                  return (
                    <div key={m.id} className="rounded-r-md border border-line bg-card-2 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-bold text-sm">{m.title}</div>
                          <div className="text-xs text-mut mt-0.5 flex items-center gap-1"><CalendarDays size={13} /> {m.at} · {m.time}</div>
                          <div className="text-xs text-mut mt-0.5 flex items-center gap-1"><MapPin size={13} /> {m.venue}</div>
                        </div>
                        <Badge tone="ok">আসন্ন</Badge>
                      </div>
                      <p className="text-sm text-txt-2 mt-2">{m.agenda}</p>
                      <div className="flex items-center gap-2 text-xs text-mut mt-2"><Users size={13} /> কোরাম {bn(m.quorum)} জন · উপস্থিতি {bn(presentCount(m))}</div>
                      <div className="grid grid-cols-3 gap-1.5 mt-2">
                        {(['present', 'absent', 'excused'] as AttendStatus[]).map((s) => {
                          const active = mine?.status === s;
                          return (
                            <button key={s} type="button" onClick={() => rsvp(m.id, s)}
                              className={`min-h-tap rounded-r-sm border text-xs font-bold px-2 ${active ? 'bg-green-700 text-white border-green-800' : 'bg-card border-line-3 text-txt-2'}`}>
                              {ATTEND[s].t}
                            </button>
                          );
                        })}
                      </div>
                      {mine && <p className="text-[11px] text-mut mt-1">আপনার উত্তর: <b>{ATTEND[mine.status].t}</b> — বদলানো যাবে (ডেমো)।</p>}
                    </div>
                  );
                })}
              </div>
              <Button block variant="secondary" className="mt-3" onClick={() => navigate('/m/notifications')}>সভার রিমাইন্ডার দেখুন</Button>
            </Card>
          )}

          <Card title="সভার ইতিহাস" sub="সমাপ্ত সভা ও কার্যবিবরণী">
            <div className="space-y-2">
              {meetings.filter((m) => m.status === 'done').map((m) => (
                <div key={m.id} className="rounded-r-sm border border-line px-3 py-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-bold text-sm">{m.title}</div>
                      <div className="text-xs text-mut">{m.at} · {m.venue}</div>
                    </div>
                    <Badge tone="neutral">সমাপ্ত</Badge>
                  </div>
                  {m.minutes && <p className="text-xs text-txt-2 mt-1.5">{m.minutes}</p>}
                  <div className="text-[11px] text-mut mt-1">উপস্থিত <b className="num">{bn(presentCount(m))}</b> / {bn(m.attendance.length)} · কোরাম {bn(m.quorum)}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === 'notices' && (
        <div className="space-y-2">
          {published.length === 0 ? (
            <Card><EmptyState title="কোনো নোটিশ নেই" sub="নতুন ঘোষণা এলে এখানে দেখা যাবে" /></Card>
          ) : published.map((n) => {
            const open = openId === n.id;
            return (
              <div key={n.id} className="rounded-r-md border border-line bg-card shadow-sh-1 overflow-hidden">
                <button type="button" onClick={() => setOpenId(open ? null : n.id)} className="w-full min-h-tap px-4 py-3 flex items-start gap-3 text-left">
                  <span className="w-9 h-9 shrink-0 grid place-items-center rounded-r-pill bg-green-050 text-green-700">
                    {n.pinned ? <Pin size={16} /> : <Megaphone size={16} />}
                  </span>
                  <span className="grow min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="font-bold text-sm text-txt">{n.title}</span>
                      {n.pinned ? <Badge tone="warn">পিন</Badge> : null}
                    </span>
                    <span className="block text-xs text-mut mt-0.5">{NOTICE_KIND[n.kind].t} · {n.at} · {n.audience}</span>
                    {!open && <span className="block text-sm text-txt-2 mt-1 line-clamp-2">{n.body}</span>}
                  </span>
                </button>
                {open && (
                  <div className="px-4 pb-4 -mt-1">
                    <p className="text-sm text-txt leading-relaxed whitespace-pre-line">{n.body}</p>
                    <Button size="sm" variant="secondary" className="mt-3" onClick={() => navigate('/m/help')}>নোটিশ নিয়ে প্রশ্ন</Button>
                  </div>
                )}
              </div>
            );
          })}
          <p className="text-[11px] text-mut text-center">ডেমো নোটিশ — বাস্তব সংস্থার ঘোষণা নয়; কোনো সুদ নেই।</p>
        </div>
      )}
    </div>
  );
}
