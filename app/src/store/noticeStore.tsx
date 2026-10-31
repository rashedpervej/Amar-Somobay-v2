/* ============================================================
   src/store/noticeStore.tsx — নোটিশ ও সভার একক ডেমো স্টোর
   সদস্য (M-22), অ্যাডমিন মোবাইল ও ডেস্কটপ (A-39/A-40) একই স্টেট পড়ে।
   ============================================================ */

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import {
  SEED_MEETINGS, SEED_NOTICES,
  type AttendStatus, type Meeting, type Notice, type NoticeKind,
} from '../domain/notice';
import { SEED_MEMBERS } from '../domain/admin';

type Result = { ok: boolean; message: string };

type Ctx = {
  notices: Notice[];
  meetings: Meeting[];
  addNotice: (input: { title: string; body: string; kind: NoticeKind; audience: Notice['audience']; pinned: boolean }) => Result;
  togglePublish: (id: string) => Result;
  togglePin: (id: string) => Result;
  archiveNotice: (id: string) => Result;
  addMeeting: (input: { title: string; at: string; time: string; venue: string; agenda: string; quorum: number }) => Result;
  setAttendance: (meetingId: string, memberId: string, status: AttendStatus) => Result;
  closeMeeting: (id: string, minutes: string) => Result;
};

const NoticeCtx = createContext<Ctx | null>(null);
let seq = 7000;

export function NoticeProvider({ children }: { children: ReactNode }) {
  const [notices, setNotices] = useState<Notice[]>(SEED_NOTICES);
  const [meetings, setMeetings] = useState<Meeting[]>(SEED_MEETINGS);

  const addNotice: Ctx['addNotice'] = useCallback((input) => {
    if (input.title.trim().length < 5) return { ok: false, message: 'শিরোনাম অন্তত ৫ অক্ষরে লিখুন' };
    if (input.body.trim().length < 15) return { ok: false, message: 'বিস্তারিত অন্তত ১৫ অক্ষরে লিখুন' };
    const n: Notice = {
      id: `n${++seq}`, title: input.title.trim(), body: input.body.trim(), kind: input.kind,
      audience: input.audience, pinned: input.pinned, status: 'draft', at: '৩১ অক্টো ২০২৬', by: 'আপনি (স্টাফ)',
    };
    setNotices((s) => [n, ...s]);
    return { ok: true, message: 'নোটিশ খসড়া তৈরি — প্রকাশের আগে কমিটির অনুমোদন লাগবে (ডেমো)' };
  }, []);

  const togglePublish: Ctx['togglePublish'] = useCallback((id) => {
    const n = notices.find((x) => x.id === id);
    if (!n) return { ok: false, message: 'নোটিশ পাওয়া যায়নি' };
    if (n.status === 'archived') return { ok: false, message: 'আর্কাইভ করা নোটিশ প্রকাশ করা যায় না' };
    setNotices((s) => s.map((x) => (x.id === id ? { ...x, status: x.status === 'published' ? 'draft' as const : 'published' as const } : x)));
    return { ok: true, message: n.status === 'published' ? 'নোটিশ অপ্রকাশিত (খসড়া) হয়েছে' : 'নোটিশ প্রকাশিত — সদস্য অ্যাপে দেখা যাবে (ডেমো)' };
  }, [notices]);

  const togglePin: Ctx['togglePin'] = useCallback((id) => {
    const n = notices.find((x) => x.id === id);
    if (!n) return { ok: false, message: 'নোটিশ পাওয়া যায়নি' };
    setNotices((s) => s.map((x) => (x.id === id ? { ...x, pinned: !x.pinned } : x)));
    return { ok: true, message: n.pinned ? 'পিন সরানো হয়েছে' : 'নোটিশ পিন করা হয়েছে' };
  }, [notices]);

  const archiveNotice: Ctx['archiveNotice'] = useCallback((id) => {
    const n = notices.find((x) => x.id === id);
    if (!n) return { ok: false, message: 'নোটিশ পাওয়া যায়নি' };
    setNotices((s) => s.map((x) => (x.id === id ? { ...x, status: 'archived' as const, pinned: false } : x)));
    return { ok: true, message: 'নোটিশ আর্কাইভ হয়েছে — মুছে ফেলা হয়নি (R-02)' };
  }, [notices]);

  const addMeeting: Ctx['addMeeting'] = useCallback((input) => {
    if (input.title.trim().length < 4) return { ok: false, message: 'সভার নাম লিখুন' };
    if (!input.at.trim()) return { ok: false, message: 'তারিখ দিন' };
    if (!input.venue.trim()) return { ok: false, message: 'স্থান লিখুন' };
    if (!input.quorum || input.quorum < 2) return { ok: false, message: 'কোরাম কমপক্ষে ২ জন' };
    const id = `mt${++seq}`;
    setMeetings((s) => [{
      id, title: input.title.trim(), at: input.at, time: input.time || 'সকাল ১০:০০', venue: input.venue.trim(),
      agenda: input.agenda.trim() || 'আলোচ্যসূচি পরে যোগ হবে', status: 'scheduled', quorum: input.quorum, attendance: [],
    }, ...s]);
    return { ok: true, message: 'সভা তৈরি হয়েছে — হাজিরা নেওয়া যাবে (ডেমো)' };
  }, []);

  const setAttendance: Ctx['setAttendance'] = useCallback((meetingId, memberId, status) => {
    const m = meetings.find((x) => x.id === meetingId);
    if (!m) return { ok: false, message: 'সভা পাওয়া যায়নি' };
    if (m.status === 'done') return { ok: false, message: 'সমাপ্ত সভার হাজিরা বদলানো যায় না' };
    setMeetings((s) => s.map((x) => {
      if (x.id !== meetingId) return x;
      const exists = x.attendance.some((a) => a.memberId === memberId);
      return {
        ...x,
        attendance: exists
          ? x.attendance.map((a) => (a.memberId === memberId ? { ...a, status } : a))
          : [...x.attendance, { memberId, name: SEED_MEMBERS.find((mm) => mm.id === memberId)?.name ?? memberId, status }],
      };
    }));
    return { ok: true, message: 'হাজিরা সংরক্ষিত (ডেমো)' };
  }, [meetings]);

  const closeMeeting: Ctx['closeMeeting'] = useCallback((id, minutes) => {
    const m = meetings.find((x) => x.id === id);
    if (!m) return { ok: false, message: 'সভা পাওয়া যায়নি' };
    if (m.status === 'done') return { ok: false, message: 'সভা আগেই সমাপ্ত' };
    if (minutes.trim().length < 10) return { ok: false, message: 'কার্যবিবরণী অন্তত ১০ অক্ষরে লিখুন' };
    setMeetings((s) => s.map((x) => (x.id === id ? { ...x, status: 'done' as const, minutes: minutes.trim() } : x)));
    return { ok: true, message: 'সভা সমাপ্ত — কার্যবিবরণী সংরক্ষিত (ডেমো)' };
  }, [meetings]);

  const value = useMemo<Ctx>(() => ({
    notices, meetings, addNotice, togglePublish, togglePin, archiveNotice, addMeeting, setAttendance, closeMeeting,
  }), [notices, meetings, addNotice, togglePublish, togglePin, archiveNotice, addMeeting, setAttendance, closeMeeting]);

  return <NoticeCtx.Provider value={value}>{children}</NoticeCtx.Provider>;
}

export function useNotices(): Ctx {
  const ctx = useContext(NoticeCtx);
  if (!ctx) throw new Error('useNotices শুধু <NoticeProvider> ভেতরে ব্যবহার করুন');
  return ctx;
}
