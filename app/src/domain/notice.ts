/* ============================================================
   src/domain/notice.ts — নোটিশ, প্রমোশন, সভা ও হাজিরা (S-09…S-11, M-22, A-39, A-40)
   সব ডেমো; কোনো বাস্তব সদস্য বা অর্থ নয়। কোনো সুদ/মুনাফা নেই (D-01)।
   ============================================================ */

export type NoticeKind = 'notice' | 'promotion' | 'meeting';
export type NoticeStatus = 'draft' | 'published' | 'archived';

export type Notice = {
  id: string;
  title: string;
  body: string;
  kind: NoticeKind;
  audience: 'সব সদস্য' | 'শুধু সদস্য' | 'কমিটি';
  pinned: boolean;
  status: NoticeStatus;
  at: string;
  by: string;
};

export const NOTICE_KIND: Record<NoticeKind, { t: string; tone: 'ok' | 'warn' | 'info' }> = {
  notice: { t: 'নোটিশ', tone: 'info' },
  promotion: { t: 'প্রমোশন', tone: 'warn' },
  meeting: { t: 'সভা', tone: 'ok' },
};

export const NOTICE_STATUS: Record<NoticeStatus, { t: string; tone: 'ok' | 'warn' | 'neutral' }> = {
  draft: { t: 'খসড়া', tone: 'warn' },
  published: { t: 'প্রকাশিত', tone: 'ok' },
  archived: { t: 'আর্কাইভ', tone: 'neutral' },
};

export const SEED_NOTICES: Notice[] = [
  { id: 'n1', title: 'সাধারণ সভা — ১৫ নভেম্বর', body: 'সমিতির সাধারণ সভা ১৫ নভেম্বর ২০২৬, সকাল ১০টায় কেশবপুর সমবায় ভবনে অনুষ্ঠিত হবে। সব সদস্যকে উপস্থিত থাকার অনুরোধ রইল। আলোচ্যসূচি: বার্ষিক বাজেট, সঞ্চয় নীতি পর্যালোচনা ও নতুন স্কিম।', kind: 'meeting', audience: 'সব সদস্য', pinned: true, status: 'published', at: '৩১ অক্টো ২০২৬', by: 'কামরুল হাসান' },
  { id: 'n2', title: 'কিস্তি জমার সময়সূচি', body: 'প্রতি মাসের ৫ তারিখের মধ্যে কিস্তি জমা দেওয়ার অনুরোধ। গ্রেস ১০ দিন; এর পরে নির্ধারিত বিলম্ব ফি প্রযোজ্য হতে পারে — এটি সুদ নয়।', kind: 'notice', audience: 'সব সদস্য', pinned: true, status: 'published', at: '২৮ অক্টো ২০২৬', by: 'নাসরিন আক্তার' },
  { id: 'n3', title: 'শিক্ষা সঞ্চয় স্কিম — নতুন সদস্য আহ্বান', body: 'সন্তানের শিক্ষার জন্য শিক্ষা সঞ্চয় স্কিমে নতুন সদস্য নেওয়া হচ্ছে। ন্যূনতম কিস্তি ৳৫০০। কোনো শতাংশ-ভিত্তিক মুনাফা নেই; শুধু জমা ও শর্ত।', kind: 'promotion', audience: 'সব সদস্য', pinned: false, status: 'published', at: '২৫ অক্টো ২০২৬', by: 'কামরুল হাসান' },
  { id: 'n4', title: 'কমিটি সভার কার্যবিবরণী', body: '১২ অক্টোবরের কমিটি সভায় নতুন স্কিম খসড়া ও ঋণ-নীতি পর্যালোচনা হয়েছে। সিদ্ধান্ত নম্বর CM-2610-12; বিস্তারিত অফিসে দেখা যাবে।', kind: 'notice', audience: 'কমিটি', pinned: false, status: 'published', at: '১৩ অক্টো ২০২৬', by: 'কামরুল হাসান' },
  { id: 'n5', title: 'বার্ষিক চাঁদা নোটিশ (খসড়া)', body: 'বার্ষিক চাঁদা ৳৫০ — প্রকাশের আগে কমিটির অনুমোদন প্রয়োজন।', kind: 'notice', audience: 'সব সদস্য', pinned: false, status: 'draft', at: '৩১ অক্টো ২০২৬', by: 'নাসরিন আক্তার' },
];

export type AttendStatus = 'present' | 'absent' | 'excused';

export const ATTEND: Record<AttendStatus, { t: string; tone: 'ok' | 'warn' | 'danger' }> = {
  present: { t: 'উপস্থিত', tone: 'ok' },
  absent: { t: 'অনুপস্থিত', tone: 'danger' },
  excused: { t: 'ছুটি', tone: 'warn' },
};

export type MeetingStatus = 'scheduled' | 'done';

export type Attendance = { memberId: string; name: string; status: AttendStatus };

export type Meeting = {
  id: string;
  title: string;
  at: string;
  time: string;
  venue: string;
  agenda: string;
  status: MeetingStatus;
  quorum: number;
  attendance: Attendance[];
  minutes?: string;
};

export const SEED_MEETINGS: Meeting[] = [
  {
    id: 'mt1', title: 'সাধারণ সভা (AGM)', at: '১৫ নভেম্বর ২০২৬', time: 'সকাল ১০:০০', venue: 'কেশবপুর সমবায় ভবন',
    agenda: 'বার্ষিক বাজেট · সঞ্চয় নীতি পর্যালোচনা · নতুন স্কিম অনুমোদন', status: 'scheduled', quorum: 60,
    attendance: [
      { memberId: 'm1', name: 'রহিমা বেগম', status: 'present' },
      { memberId: 'm2', name: 'করিম উদ্দিন', status: 'present' },
      { memberId: 'm3', name: 'সাবিনা ইয়াসমিন', status: 'excused' },
      { memberId: 'm4', name: 'আব্দুল্লাহ আল মামুন', status: 'absent' },
      { memberId: 'm5', name: 'ফাতেমা খাতুন', status: 'absent' },
      { memberId: 'm6', name: 'নাসির হোসেন', status: 'present' },
    ],
  },
  {
    id: 'mt2', title: 'কমিটি সভা', at: '১২ অক্টোবর ২০২৬', time: 'বিকেল ৪:০০', venue: 'অফিস কক্ষ',
    agenda: 'নতুন স্কিম খসড়া · ঋণ-নীতি · বকেয়া পর্যালোচনা', status: 'done', quorum: 5,
    minutes: 'নতুন স্কিম খসড়া অনুমোদিত (CM-2610-12); বকেয়া আদায়ে রুটভিত্তিক লক্ষ্য নির্ধারিত।',
    attendance: [
      { memberId: 'm1', name: 'রহিমা বেগম', status: 'present' },
      { memberId: 'm2', name: 'করিম উদ্দিন', status: 'present' },
      { memberId: 'm3', name: 'সাবিনা ইয়াসমিন', status: 'present' },
      { memberId: 'm4', name: 'আব্দুল্লাহ আল মামুন', status: 'excused' },
      { memberId: 'm5', name: 'ফাতেমা খাতুন', status: 'absent' },
    ],
  },
  {
    id: 'mt3', title: 'বার্ষিক সাধারণ সভা ২০২৫', at: '২০ ডিসেম্বর ২০২৫', time: 'সকাল ১১:০০', venue: 'কেশবপুর সমবায় ভবন',
    agenda: 'বার্ষিক হিসাব অনুমোদন · নির্বাচন', status: 'done', quorum: 60,
    minutes: 'বার্ষিক হিসাব সর্বসম্মতভাবে অনুমোদিত; ২০২৬ সালের বাজেট প্রস্তাব গৃহীত।',
    attendance: [
      { memberId: 'm1', name: 'রহিমা বেগম', status: 'present' },
      { memberId: 'm2', name: 'করিম উদ্দিন', status: 'present' },
      { memberId: 'm3', name: 'সাবিনা ইয়াসমিন', status: 'present' },
      { memberId: 'm4', name: 'আব্দুল্লাহ আল মামুন', status: 'present' },
      { memberId: 'm5', name: 'ফাতেমা খাতুন', status: 'present' },
      { memberId: 'm6', name: 'নাসির হোসেন', status: 'present' },
    ],
  },
];

export const noticeStats = (list: Notice[]) => ({
  total: list.length,
  published: list.filter((n) => n.status === 'published').length,
  draft: list.filter((n) => n.status === 'draft').length,
  pinned: list.filter((n) => n.pinned).length,
});

export const meetingStats = (list: Meeting[]) => ({
  total: list.length,
  scheduled: list.filter((m) => m.status === 'scheduled').length,
  done: list.filter((m) => m.status === 'done').length,
  present: list.reduce((n, m) => n + m.attendance.filter((a) => a.status === 'present').length, 0),
});

export const presentCount = (m: Meeting) => m.attendance.filter((a) => a.status === 'present').length;
