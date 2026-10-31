/* ============================================================
   Somobay · mock data + helpers  (demo only — values follow the
   DEFAULT decisions in specs/02-open-decisions.md)
   ============================================================ */

/* ---------- helpers ---------- */
const BND = '০১২৩৪৫৬৭৮৯';
const bn = (s) => String(s).replace(/[0-9]/g, d => BND[+d]);
const en = (s) => String(s).replace(/[০-৯]/g, d => '0123456789'.indexOf(d));

/** paisa -> "১২,৫০০" ( Bangla digits, Indian/south-Asian grouping ) */
function taka(paisa, bangla = true) {
  const neg = paisa < 0; paisa = Math.abs(Math.round(paisa));
  const t = Math.floor(paisa / 100), p = paisa % 100;
  // south-asian grouping: last 3 digits, then groups of 2  -> 12500 => "12,500"
  let s = String(t);
  if (s.length > 3) {
    const last3 = s.slice(-3), rest = s.slice(0, -3);
    s = rest.replace(/\B(?=(\d\d)+$)/g, ',') + ',' + last3;
  }
  if (p) s = `${s}.${String(p).padStart(2, '0')}`;
  return (neg ? '−' : '') + (bangla ? bn(s) : s);
}
const tk = (p) => '৳' + taka(p);
const tkEn = (p) => 'Tk ' + taka(p, false);

/** Bangla number words 0..999 — exact table (no algorithmic guessing) */
const BNW = ['শূন্য','এক','দুই','তিন','চার','পাঁচ','ছয়','সাত','আট','নয়','দশ','এগারো','বারো','তেরো','চৌদ্দ','পনেরো','ষোল','সতেরো','আঠারো','উনিশ',
 'বিশ','একুশ','বাইশ','তেইশ','চব্বিশ','পঁচিশ','ছাব্বিশ','সাতাশ','আটাশ','উনত্রিশ','ত্রিশ','একত্রিশ','বত্রিশ','তেত্রিশ','চৌত্রিশ','পঁয়ত্রিশ','ছত্রিশ','সাঁইত্রিশ','আটত্রিশ','উনচল্লিশ',
 'চল্লিশ','একচল্লিশ','বিয়াল্লিশ','তেতাল্লিশ','চুয়াল্লিশ','পঁয়তাল্লিশ','ছেচল্লিশ','সাতচল্লিশ','আটচল্লিশ','উনপঞ্চাশ','পঞ্চাশ','একান্ন','বাহান্ন','তিপ্পান্ন','চুয়ান্ন','পঞ্চান্ন','ছাপ্পান্ন','সাতান্ন','আটান্ন','উনষাট',
 'ষাট','একষট্টি','বাষট্টি','তেষট্টি','চৌষট্টি','পঁয়ষট্টি','ছেষট্টি','সাতষট্টি','আটষট্টি','উনসত্তর','সত্তর','একাত্তর','বাহাত্তর','তিয়াত্তর','চুয়াত্তর','পঁচাত্তর','ছিয়াত্তর','সাতাত্তর','আটাত্তর','উনআশি',
 'আশি','একাশি','বিরাশি','তিরাশি','চুরাশি','পঁচাশি','ছিয়াশি','সাতাশি','আটাশি','উননব্বই','নব্বই','একানব্বই','বিরানব্বই','তিরানব্বই','চুরানব্বই','পঁচানব্বই','ছিয়ানব্বই','সাতানব্বই','আটানব্বই','নিরানব্বই'];
/** paisa -> "বারো হাজার পাঁচ শত টাকা মাত্র" */
function words(paisa) {
  const n = Math.floor(Math.abs(paisa) / 100);
  if (n === 0) return 'শূন্য টাকা মাত্র';
  const parts = [];
  const lakh = Math.floor(n / 100000);
  if (lakh) {
    const ll = Math.floor(lakh / 100);           // কোটি-level, shown as "X লক্ষ"
    parts.push((ll ? twoWord(ll) + ' ' : '') + twoWord(lakh % 100 === 0 ? 100 : lakh % 100) + (lakh % 100 === 0 ? '' : '') + ' লক্ষ');
  }
  const thou = Math.floor((n % 100000) / 1000);
  if (thou) parts.push(twoWord(thou) + ' হাজার');
  const hund = Math.floor((n % 1000) / 100);
  if (hund) parts.push(BNW[hund] + ' শত');
  const rest = n % 100;
  if (rest) parts.push(BNW[rest]);
  return parts.join(' ') + ' টাকা মাত্র';
}
function twoWord(x) { return x <= 99 ? BNW[x] : words(x * 100).replace(' টাকা মাত্র', ''); }

/* date helpers — demo "today" is 30 Oct 2026 */
const TODAY = new Date(2026, 9, 30);
const MB = ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রি', 'মে', 'জুন', 'জুলা', 'আগ', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'];
const MBF = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
const DB = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহস্পতি', 'শুক্র', 'শনি'];
function dstr(d, full) { d = new Date(d); return bn(d.getDate()) + ' ' + (full ? MBF[d.getMonth()] : MB[d.getMonth()]) + ' ' + bn(d.getFullYear()); }
function dshort(d) { d = new Date(d); return bn(d.getDate()) + ' ' + MB[d.getMonth()]; }
function dday(d) { return DB[new Date(d).getDay()] + 'বার'; }
function tstr(t) { return bn(t); }
function daysAgo(n) { const d = new Date(TODAY); d.setDate(d.getDate() - n); return d; }
function daysAhead(n) { const d = new Date(TODAY); d.setDate(d.getDate() + n); return d; }

/* ---------- icons ---------- */
const IP = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9.5 21v-6h5v6"/>',
  wallet: '<rect x="3" y="6" width="18" height="13" rx="3.5"/><path d="M16 12.5h3"/><path d="M3 9.5h12"/>',
  users: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/><path d="M16 5.2a3.2 3.2 0 0 1 0 6"/><path d="M18 20c0-2.2-.8-3.9-2-5"/>',
  plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="2.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="2.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="2.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="2.5"/>',
  bell: '<path d="M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-1-2-2-6"/><path d="M10.5 20a2 2 0 0 0 3 0"/>',
  down: '<path d="M12 4v13"/><path d="M6.5 11.5 12 17l5.5-5.5"/>',
  up: '<path d="M12 20V7"/><path d="M6.5 12.5 12 7l5.5 5.5"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  warn: '<path d="M12 8v5"/><circle cx="12" cy="16.5" r=".9" fill="currentColor" stroke="none"/><path d="M12 3.5 21.5 19.5H2.5Z"/>',
  check: '<path d="M5 12.5 10 17.5 19 7"/>',
  checkc: '<circle cx="12" cy="12" r="9"/><path d="M8 12.3 11 15.3 16.2 9.5"/>',
  x: '<path d="M6 6l12 12"/><path d="M18 6 6 18"/>',
  xc: '<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6"/><path d="M15 9l-6 6"/>',
  shield: '<path d="M12 3 20 6v6c0 4.4-3.3 7.6-8 9-4.7-1.4-8-4.6-8-9V6Z"/><path d="M9 12.2l2.2 2.3L15.3 10"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
  file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5"/>',
  doc: '<path d="M6 3h8l4 4v14H6Z"/><path d="M9 12h6"/><path d="M9 16h6"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.6"/>',
  eyeoff: '<path d="M4 4l16 16"/><path d="M9.5 5.9A9.7 9.7 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-3.3 4.1"/><path d="M6.3 7.9A16.7 16.7 0 0 0 2.5 12S6 18.5 12 18.5c1.2 0 2.3-.2 3.3-.6"/>',
  chev: '<path d="M9.5 5.5 16 12l-6.5 6.5"/>',
  back: '<path d="M14.5 5.5 8 12l6.5 6.5"/>',
  chart: '<path d="M4 19V5"/><path d="M4 19h16"/><path d="M8 16v-4"/><path d="M13 16V8"/><path d="M18 16v-6"/>',
  cash: '<rect x="2.5" y="6" width="19" height="12" rx="2.5"/><circle cx="12" cy="12" r="2.6"/><path d="M6 10v4"/><path d="M18 10v4"/>',
  bank: '<path d="M3 9.5 12 4l9 5.5"/><path d="M5 10v9"/><path d="M9.5 10v9"/><path d="M14.5 10v9"/><path d="M19 10v9"/><path d="M3 19h18"/>',
  phone: '<rect x="6.5" y="2.5" width="11" height="19" rx="3"/><path d="M10.5 18.5h3"/>',
  user: '<circle cx="12" cy="8" r="3.6"/><path d="M4.5 20c0-3.6 3.3-6 7.5-6s7.5 2.4 7.5 6"/>',
  gift: '<rect x="3.5" y="9" width="17" height="11" rx="2.5"/><path d="M3.5 13.5h17"/><path d="M12 9v11"/>',
  cal: '<rect x="3.5" y="5" width="17" height="16" rx="3"/><path d="M3.5 10h17"/><path d="M8 3v4"/><path d="M16 3v4"/>',
  lock: '<rect x="4.5" y="10" width="15" height="10.5" rx="3"/><path d="M8 10V7.5a4 4 0 0 1 8 0V10"/>',
  refresh: '<path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20 4v4.5h-4.5"/>',
  send: '<path d="M21 3 10.5 13.5"/><path d="M21 3l-6.8 18-3.7-7.5L3 9.8Z"/>',
  print: '<path d="M7 8V3.5h10V8"/><rect x="3.5" y="8" width="17" height="8" rx="2.5"/><path d="M7 14h10v6.5H7Z"/>',
  download: '<path d="M12 3.5v11"/><path d="M7.5 10.5 12 15l4.5-4.5"/><path d="M4 19.5h16"/>',
  share: '<circle cx="18" cy="5.5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="18.5" r="2.5"/><path d="M8.3 10.8 15.7 6.7"/><path d="M8.3 13.2l7.4 4.1"/>',
  filter: '<path d="M3.5 5.5h17l-6.5 7.5v6l-4 2v-8Z"/>',
  sort: '<path d="M7 4v16"/><path d="M3.5 16.5 7 20l3.5-3.5"/><path d="M17 20V4"/><path d="M13.5 7.5 17 4l3.5 3.5"/>',
  menu: '<path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h10"/>',
  more: '<circle cx="5.5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="18.5" cy="12" r="1.4"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16Z"/><path d="M14.5 5.5 18.5 9.5"/>',
  trash: '<path d="M4.5 6.5h15"/><path d="M9 6.5V4h6v2.5"/><path d="M6.5 6.5 7.5 20h9l1-13.5"/>',
  freeze: '<path d="M12 3v18"/><path d="M4 7.5 20 16.5"/><path d="M20 7.5 4 16.5"/>',
  qr: '<rect x="4" y="4" width="6" height="6" rx="1.5"/><rect x="14" y="4" width="6" height="6" rx="1.5"/><rect x="4" y="14" width="6" height="6" rx="1.5"/><path d="M14 14h2.5v2.5H14Z"/><path d="M18 18h2v2h-2Z"/><path d="M14 19.5h2"/><path d="M19.5 14v2"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5"/><circle cx="12" cy="7.9" r=".95" fill="currentColor" stroke="none"/>',
  route: '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.5 6h5a4 4 0 0 1 0 8h-3a4 4 0 0 0 0 4h5"/>',
  flag: '<path d="M5.5 21V4"/><path d="M5.5 5h11l-2 3.5 2 3.5h-11"/>',
  book: '<path d="M4 4.5h6a3 3 0 0 1 3 3V20a2.5 2.5 0 0 0-2.5-2.5H4Z"/><path d="M20 4.5h-6a3 3 0 0 0-3 3V20a2.5 2.5 0 0 1 2.5-2.5H20Z"/>',
  scale: '<path d="M12 4v16"/><path d="M6 8h12"/><path d="M6 8 3 15h6Z"/><path d="M18 8l-3 7h6Z"/>',
  logout: '<path d="M15 4.5h3.5a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H15"/><path d="M10 8 6 12l4 4"/><path d="M6 12h9"/>',
  settings: '<circle cx="12" cy="12" r="3.2"/><path d="M19.4 14a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1v.3a2 2 0 1 1-4 0v-.2a1.6 1.6 0 0 0-2.8-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3.5 13H3a2 2 0 1 1 0-4h.2a1.6 1.6 0 0 0 1.1-2.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 10 3.5V3a2 2 0 1 1 4 0v.2a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7h.3a2 2 0 1 1 0 4h-.2a1.6 1.6 0 0 0-1.5 1Z"/>',
  audit: '<path d="M9 3.5h6l1 2.5h3.5v14.5H4.5V6H8Z"/><path d="M9 12h6"/><path d="M9 15.5h4"/>',
  star: '<path d="m12 4 2.5 5.2 5.5.8-4 3.9 1 5.6-5-2.8-5 2.8 1-5.6-4-3.9 5.5-.8Z"/>',
  sparkle: '<path d="M12 3.5 13.7 9l5.5 1.7-5.5 1.7L12 18l-1.7-5.6L4.8 10.7 10.3 9Z"/><path d="M18.5 16.5 19.2 18.6 21.3 19.3 19.2 20 18.5 22 17.8 20 15.7 19.3 17.8 18.6Z"/>',
  arrowupright: '<path d="M7 17 17 7"/><path d="M9 7h8v8"/>',
  history: '<path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1"/><path d="M3.5 4v4.5H8"/><path d="M12 8v4.3l3 1.8"/>',
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>',
  heart: '<path d="M12 20s-7.5-4.4-7.5-9.3A4.2 4.2 0 0 1 12 7.7a4.2 4.2 0 0 1 7.5 3c0 4.9-7.5 9.3-7.5 9.3Z"/>',
  book2: '<path d="M4 5.5A2 2 0 0 1 6 3.5h13v15H6a2 2 0 0 0-2 2Z"/><path d="M4 18.5A2 2 0 0 1 6 16.5h13"/>',
  cam: '<path d="M4 8.5h3l1.5-2.5h7L17 8.5h3v10H4Z"/><circle cx="12" cy="13" r="3.2"/>',
  wifi: '<path d="M2.5 9a14 14 0 0 1 19 0"/><path d="M6 12.5a9 9 0 0 1 12 0"/><path d="M9.3 16a4.5 4.5 0 0 1 5.4 0"/><circle cx="12" cy="19.3" r="1" fill="currentColor" stroke="none"/>',
  wifioff: '<path d="M3 3.5 21 21"/><path d="M2.5 9a14 14 0 0 1 5-3.2"/><path d="M16 6.2A14 14 0 0 1 21.5 9"/><path d="M6 12.5a9 9 0 0 1 3-2"/><path d="M9.3 16a4.5 4.5 0 0 1 5.4 0"/><circle cx="12" cy="19.3" r="1" fill="currentColor" stroke="none"/>',
};
const ic = (k, c = '') => `<svg class="i ${c}" viewBox="0 0 24 24">${IP[k] || ''}</svg>`;

/* ---------- status maps (chip + icon) ---------- */
const ACC_STATUS = {
  active: { t: 'সক্রিয়', c: 'chip-ok', i: 'check' },
  opened: { t: 'খোলা হয়েছে (প্রথম জমা বাকি)', c: 'chip-info', i: 'clock' },
  frozen: { t: 'ফ্রিজ করা', c: 'chip-danger', i: 'freeze' },
  matured: { t: 'মেয়াদ পূর্ণ', c: 'chip-lime', i: 'star' },
  dormant: { t: 'নিষ্ক্রিয়', c: 'chip-neutral', i: 'clock' },
  closure_requested: { t: 'বন্ধের আবেদন', c: 'chip-warn', i: 'clock' },
  closed: { t: 'বন্ধ', c: 'chip-neutral', i: 'xc' },
};
const MEM_STATUS = {
  active: { t: 'সক্রিয়', c: 'chip-ok', i: 'check' },
  dormant: { t: 'নিষ্ক্রিয়', c: 'chip-neutral', i: 'clock' },
  suspended: { t: 'স্থগিত', c: 'chip-warn', i: 'warn' },
  exited: { t: 'প্রস্থান', c: 'chip-neutral', i: 'logout' },
  deceased: { t: 'মৃত', c: 'chip-purple', i: 'heart' },
  pending: { t: 'যাচাইয়ের অপেক্ষায়', c: 'chip-info', i: 'clock' },
  proposed: { t: 'প্রস্তাবিত (অনুমোদন বাকি)', c: 'chip-info', i: 'file' },
  rejected: { t: 'প্রত্যাখ্যাত', c: 'chip-danger', i: 'xc' },
};
const DEP_STATUS = {
  posted: { t: 'জমা হয়েছে', c: 'chip-ok', i: 'checkc' },
  pending: { t: 'যাচাই বাকি', c: 'chip-warn', i: 'clock' },
  rejected: { t: 'প্রত্যাখ্যাত', c: 'chip-danger', i: 'xc' },
  reversed: { t: 'সংশোধিত', c: 'chip-purple', i: 'refresh' },
};
const WD_STATUS = {
  submitted: { t: 'জমা দেওয়া', c: 'chip-info', i: 'send' },
  under_review: { t: 'পর্যালোচনায়', c: 'chip-warn', i: 'clock' },
  approved: { t: 'অনুমোদিত', c: 'chip-ok', i: 'checkc' },
  disbursing: { t: 'নিষ্পত্তি চলছে', c: 'chip-info', i: 'refresh' },
  settled: { t: 'নিষ্পন্ন', c: 'chip-ok', i: 'checkc' },
  rejected: { t: 'প্রত্যাখ্যাত', c: 'chip-danger', i: 'xc' },
  cancelled: { t: 'প্রত্যাহৃত', c: 'chip-neutral', i: 'x' },
};
const SCH_STATUS = {
  draft: { t: 'খসড়া', c: 'chip-neutral', i: 'edit' },
  pending_approval: { t: 'অনুমোদনের অপেক্ষায়', c: 'chip-info', i: 'clock' },
  active: { t: 'চালু', c: 'chip-ok', i: 'check' },
  suspended: { t: 'স্থগিত', c: 'chip-warn', i: 'freeze' },
  closed_new: { t: 'নতুন নামভর্তি বন্ধ', c: 'chip-purple', i: 'lock' },
  closed: { t: 'বন্ধ', c: 'chip-neutral', i: 'xc' },
};
const CHIP = (m, k) => m[k] ? `<span class="chip ${m[k].c}">${ic(m[k].i)}${m[k].t}</span>` : '';
const channel = {
  cash_field: { t: 'মাঠ সংগ্রহ (নগদ)', i: 'route', c: 'in' },
  cash_office: { t: 'অফিস কাউন্টার (নগদ)', i: 'bank', c: 'in' },
  bkash: { t: 'বিকাশ', i: 'phone', c: 'info' },
  nagad: { t: 'নগদ', i: 'phone', c: 'info' },
  bank: { t: 'ব্যাংক ট্রান্সফার', i: 'bank', c: 'neutral' },
  cheque: { t: 'চেক', i: 'doc', c: 'neutral' },
};

/* ---------- orgs / schemes ---------- */
const ORG = {
  id: 'org1', code: 'RSS', name: 'রহিমা সঞ্চয় সমিতি', reg: 'খুলনা-প্রা-০৪১৭', area: 'কেশবপুর, খুলনা',
  fy: '২০২৬–২৭', invite: 'RSS-2627', phone: '০১৭১১-৪৫৬৭৮৯',
};
const ORG2 = { id: 'org2', code: 'SKS', name: 'সবুজ কৃষক সমবায় সমিতি', reg: 'যশোর-প্রা-১১২৯', area: 'ঝিকরগাছা, যশোর', fy: '২০২৬–২৭', invite: 'SKS-2627' };

const SCHEMES = [
  {
    id: 'sc1', code: 'DAILY-50', name: 'দৈনিক সঞ্চয়', type: 'daily', typeBn: 'দৈনিক',
    installment: 5000, mode: 'fixed', tenure: null, lockIn: 0, status: 'active',
    noticeDays: 7, maxPerMonth: 2, maxAmount: 5000000, minBalance: 50000, extra: true,
    members: 42, total: 38650000, desc: 'প্রতিদিন ৳৫০ করে ছোট ছোট জমা — সংগ্রহক আপনার বাড়ি থেকে নিয়ে যাবেন।',
    fees: { admission: 10000, annual: 5000, withdrawal: 2000 }, graceDays: 7, lateFee: 2000,
  },
  {
    id: 'sc2', code: 'MONTH-1000', name: 'মাসিক সাধারণ সঞ্চয়', type: 'monthly', typeBn: 'মাসিক',
    installment: 100000, mode: 'fixed', tenure: null, lockIn: 0, status: 'active',
    noticeDays: 7, maxPerMonth: 2, maxAmount: 5000000, minBalance: 50000, extra: true,
    members: 36, total: 51200000, desc: 'মাসে একবার ৳১,০০০ — বেতন বা ফসল বিক্রির পর সহজে জমা দিন।',
    fees: { admission: 10000, annual: 5000, withdrawal: 2000 }, graceDays: 7, lateFee: 2000,
  },
  {
    id: 'sc3', code: 'TERM-36', name: 'মেয়াদি সঞ্চয় (৩ বছর)', type: 'term', typeBn: 'মেয়াদি',
    installment: 100000, mode: 'fixed', tenure: 36, lockIn: 6, status: 'active',
    noticeDays: 15, maxPerMonth: 1, maxAmount: 5000000, minBalance: 500000, extra: false,
    members: 18, total: 64800000, desc: '৩ বছরের জন্য নির্দিষ্ট কিস্তি — প্রথম ৬ মাস তোলা যাবে না (লক-ইন)।',
    fees: { admission: 10000, annual: 5000, withdrawal: 2000 }, graceDays: 7, lateFee: 2000,
  },
  {
    id: 'sc4', code: 'FEST-26', name: 'ঈদ বিশেষ সঞ্চয় ২০২৬', type: 'monthly', typeBn: 'মাসিক (বিশেষ)',
    installment: 200000, mode: 'fixed', tenure: 8, lockIn: 8, status: 'closed_new',
    noticeDays: 0, maxPerMonth: 1, maxAmount: 2000000, minBalance: 0, extra: false,
    members: 64, total: 102400000, desc: 'ঈদুল ফিতরের আগে এককালীন প্রাপ্য — ৮ মাসের নির্দিষ্ট কিস্তি।',
    fees: { admission: 0, annual: 0, withdrawal: 0 }, graceDays: 7, lateFee: 2000,
    started: '2026-01-05', closedNewOn: '2026-08-31', version: 1,
    closedReason: 'নামভর্তির সময়সীমা শেষ (৩১ আগস্ট ২০২৬)। বিদ্যমান ৬৪ জন সদস্যের কিস্তি চলবে, নতুন নামভর্তি বন্ধ।',
  },
];
/* per-scheme presentation metadata (version pinning → D-32) */
SCHEMES.forEach((s, i) => {
  s.started = s.started || ['2023-07-01', '2023-07-01', '2024-01-15'][i] || '2024-01-15';
  s.version = s.version || (i === 2 ? 3 : 2);
  s.enrollable = s.status === 'active';
  s.totalPossible = s.tenure ? s.installment * s.tenure : null;
  s.verHistory = s.verHistory || [
    { v: s.version, at: ['2026-07-01', '2026-07-01', '2025-09-01'][i] || '2026-01-01',
      by: 'কমিটির সিদ্ধান্ত ২০২৬/' + (11 + i), ch: s.version === 3 ? 'লক-ইন ৩ → ৬ মাস, নোটিশ ৭ → ১৫ দিন' : 'সর্বনিম্ন ব্যালেন্স ৳৩০০ → ৳৫০০' },
    { v: s.version - 1, at: '2024-07-01', by: 'কমিটির সিদ্ধান্ত ২০২৪/০৭', ch: 'বার্ষিক ফি ৳৩০ → ৳৫০' },
    { v: 1, at: s.started, by: 'নিবন্ধনকালীন অনুমোদন', ch: 'প্রথম সংস্করণ' },
  ];
});
const scheme = (id) => SCHEMES.find(s => s.id === id);
const openSchemes = () => SCHEMES.filter(s => s.enrollable);

/* ---------- members ---------- */
const MEMBERS = [
  { id: 'm1', no: 'RSS-2627-0042', name: 'আব্দুল করিম', father: 'মৃত হাশেম আলী', mobile: '01711-456789', mobileRaw: '01711456789',
    village: 'কেশবপুর', union: 'সুফলাকাটি', upazila: 'কেশবপুর', district: 'খুলনা', nid: '1985****4471',
    joined: '2024-03-12', status: 'active', kyc: 'verified', occupation: 'কৃষি', route: 'R1', photo: 'ক', accounts: 2, total: 1750000, due: 102000 },
  { id: 'm2', no: 'RSS-2627-0087', name: 'রহিমা বেগম', father: 'আব্দুল জলিল', mobile: '01822-334455', mobileRaw: '01822334455',
    village: 'গৌরীঘোনা', union: 'ত্রিমোহনী', upazila: 'কেশবপুর', district: 'খুলনা', nid: '1990****8812',
    joined: '2024-08-02', status: 'active', kyc: 'verified', occupation: 'গৃহিণী + সেলাই', route: 'R2', photo: 'র', accounts: 1, total: 1435000, due: 0 },
  { id: 'm3', no: 'RSS-2627-0119', name: 'নুরুজ্জামান', father: 'মোঃ ইদ্রিস', mobile: '01933-778811', mobileRaw: '01933778811',
    village: 'বিদ্যানন্দকাঠি', union: 'বিদ্যানন্দকাঠি', upazila: 'কেশবপুর', district: 'খুলনা', nid: '1978****2260',
    joined: '2025-01-18', status: 'active', kyc: 'pending', occupation: 'মৎস্য চাষ', route: 'R1', photo: 'ন', accounts: 1, total: 520000, due: 204000 },
  { id: 'm4', no: 'RSS-2627-0056', name: 'শাহানারা খাতুন', father: 'মৃত করিম বক্স', mobile: '01644-229911', mobileRaw: '01644229911',
    village: 'হাসানপুর', union: 'সুফলাকাটি', upazila: 'কেশবপুর', district: 'খুলনা', nid: '1988****5533',
    joined: '2024-05-22', status: 'active', kyc: 'verified', occupation: 'দোকানদার', route: 'R2', photo: 'শ', accounts: 1, total: 3600000, due: 0 },
  { id: 'm5', no: 'RSS-2627-0134', name: 'মোঃ আলমগীর হোসেন', father: 'আব্দুর রশিদ', mobile: '01755-661122', mobileRaw: '01755661122',
    village: 'পাঁজিয়া', union: 'পাঁজিয়া', upazila: 'কেশবপুর', district: 'খুলনা', nid: '1993****7714',
    joined: '2025-06-09', status: 'dormant', kyc: 'verified', occupation: 'রিকশাচালক', route: 'R3', photo: 'আ', accounts: 1, total: 360000, due: 51000 },
  { id: 'm6', no: 'RSS-2627-0201', name: 'নুসরাত জাহান', father: 'মোঃ শফিকুল ইসলাম', mobile: '01866-445577', mobileRaw: '01866445577',
    village: 'কেশবপুর সদর', union: 'কেশবপুর', upazila: 'কেশবপুর', district: 'খুলনা', nid: '1999****1188',
    joined: '2026-02-14', status: 'active', kyc: 'verified', occupation: 'স্কুল শিক্ষিকা', route: 'R1', photo: 'নু', accounts: 2, total: 860000, due: 0 },
  { id: 'm7', no: 'RSS-2627-0178', name: 'রফিকুল ইসলাম', father: 'মৃত নুর মোহাম্মদ', mobile: '01977-883344', mobileRaw: '01977883344',
    village: 'মাগুরা', union: 'ত্রিমোহনী', upazila: 'কেশবপুর', district: 'খুলনা', nid: '1982****9902',
    joined: '2025-11-03', status: 'suspended', kyc: 'verified', occupation: 'ঠিকাদার শ্রমিক', route: 'R3', photo: 'র', accounts: 1, total: 180000, due: 306000 },
  { id: 'm8', no: 'RSS-2627-0215', name: 'সালমা আক্তার', father: 'আব্দুল হাকিম', mobile: '01688-990022', mobileRaw: '01688990022',
    village: 'গৌরীঘোনা', union: 'ত্রিমোহনী', upazila: 'কেশবপুর', district: 'খুলনা', nid: '2001****3345',
    joined: '2026-07-21', status: 'active', kyc: 'verified', occupation: 'নার্স', route: 'R2', photo: 'সা', accounts: 1, total: 420000, due: 0 },
  { id: 'm9', no: 'RSS-2627-0009', name: 'মৃত আব্দুর রহমান', father: 'মৃত কাসেম আলী', mobile: '—', mobileRaw: '',
    village: 'হাসানপুর', union: 'সুফলাকাটি', upazila: 'কেশবপুর', district: 'খুলনা', nid: '1961****7788',
    joined: '2023-11-30', status: 'deceased', kyc: 'verified', occupation: 'কৃষি', route: 'R2', photo: 'আ', accounts: 1, total: 1250000, due: 0, nominee: 'ফাতেমা খাতুন (স্ত্রী)' },
  { id: 'm10', no: '—', name: 'জসিম উদ্দিন', father: 'মোঃ ইউসুফ', mobile: '01511-227788', mobileRaw: '01511227788',
    village: 'বিদ্যানন্দকাঠি', union: 'বিদ্যানন্দকাঠি', upazila: 'কেশবপুর', district: 'খুলনা', nid: '1996****4419',
    joined: null, status: 'pending', kyc: 'pending', occupation: 'মোবাইল দোকান', route: 'R1', photo: 'জ', accounts: 0, total: 0, due: 50000, applied: '2026-10-28' },
];
const member = (id) => MEMBERS.find(m => m.id === id);
const ME = 'm1'; // logged-in member for the member panel demo

/* ---------- savings accounts ---------- */
const ACCOUNTS = [
  { id: 'a1', memberId: 'm1', schemeId: 'sc2', no: 'RSS-2627-0042-MS', opened: '2024-03-12',
    posted: 1250000, pending: 30000, hold: 0, totalIn: 1410000, totalOut: 160000, status: 'active',
    day: 10, lastInstallment: 18, paidInstallments: 18, missed: 1, nextDue: '2026-11-10' },
  { id: 'a2', memberId: 'm1', schemeId: 'sc1', no: 'RSS-2627-0042-DS', opened: '2024-06-01',
    posted: 500000, pending: 30000, hold: 0, totalIn: 540000, totalOut: 40000, status: 'active',
    day: null, lastInstallment: 148, paidInstallments: 148, missed: 0, nextDue: '2026-10-30' },
  { id: 'a3', memberId: 'm2', schemeId: 'sc2', no: 'RSS-2627-0087-MS', opened: '2024-08-02',
    posted: 1435000, pending: 0, hold: 500000, totalIn: 1435000, totalOut: 0, status: 'active',
    day: 5, lastInstallment: 26, paidInstallments: 26, missed: 0, nextDue: '2026-11-05' },
  { id: 'a4', memberId: 'm3', schemeId: 'sc2', no: 'RSS-2627-0119-MS', opened: '2025-01-18',
    posted: 520000, pending: 0, hold: 0, totalIn: 520000, totalOut: 0, status: 'active',
    day: 15, lastInstallment: 21, paidInstallments: 19, missed: 2, nextDue: '2026-11-15' },
  { id: 'a5', memberId: 'm4', schemeId: 'sc3', no: 'RSS-2627-0056-TS', opened: '2023-11-01',
    posted: 3600000, pending: 0, hold: 0, totalIn: 3600000, totalOut: 0, status: 'matured',
    day: 1, lastInstallment: 36, paidInstallments: 36, missed: 0, maturedOn: '2026-10-31', lockInEnds: '2024-05-01' },
  { id: 'a6', memberId: 'm5', schemeId: 'sc1', no: 'RSS-2627-0134-DS', opened: '2025-06-09',
    posted: 360000, pending: 0, hold: 0, totalIn: 360000, totalOut: 0, status: 'frozen',
    day: null, lastInstallment: 72, paidInstallments: 72, missed: 0,
    frozenReason: 'কমিটির সিদ্ধান্ত নং ২০২৬/১৪ — ঠিকানা যাচাই না হওয়া পর্যন্ত উত্তোলন স্থগিত', frozenBy: 'মোঃ আব্দুল্লাহ (ম্যানেজার)', frozenAt: '2026-09-18' },
  { id: 'a7', memberId: 'm6', schemeId: 'sc2', no: 'RSS-2627-0201-MS', opened: '2026-02-14',
    posted: 860000, pending: 20000, hold: 0, totalIn: 860000, totalOut: 0, status: 'active',
    day: 14, lastInstallment: 8, paidInstallments: 8, missed: 0, nextDue: '2026-11-14' },
  { id: 'a8', memberId: 'm7', schemeId: 'sc1', no: 'RSS-2627-0178-DS', opened: '2025-11-03',
    posted: 180000, pending: 0, hold: 0, totalIn: 180000, totalOut: 0, status: 'dormant',
    day: null, lastInstallment: 36, paidInstallments: 36, missed: 6, nextDue: null },
  { id: 'a9', memberId: 'm8', schemeId: 'sc3', no: 'RSS-2627-0215-TS', opened: '2026-07-21',
    posted: 420000, pending: 0, hold: 0, totalIn: 420000, totalOut: 0, status: 'active',
    day: 21, lastInstallment: 3, paidInstallments: 3, missed: 0, nextDue: '2026-11-21', lockInEnds: '2027-01-21' },
];
const acc = (id) => ACCOUNTS.find(a => a.id === id);
const myAccounts = () => ACCOUNTS.filter(a => a.memberId === ME);

/* opening baseline per account — demo ledger only holds recent transactions,
   so recomputation starts from the opening balance instead of wiping history (R-08) */
ACCOUNTS.forEach(a => { a._open = a.posted; });

/** R-01/R-08: ব্যালেন্স সংরক্ষিত নয় — প্রতিবার লেজার থেকে পুনর্গণনা */
function recalc(accId) {
  const a = acc(accId);
  if (!a) return a && a.posted;
  if (a._open === undefined) a._open = a.posted;
  a.posted = a._open + TX.filter(t => t.accId === accId && t.status === 'posted' && !t.base)
    .reduce((s, t) => s + (t.type === 'deposit' ? t.amount : -t.amount), 0);
  return a.posted;
}
/** সব অ্যাকাউন্ট একসাথে পুনর্গণনা (দৈনিক integrity check — Flow 4 ধাপ ৮) */
function recalcAll() { return ACCOUNTS.map(a => recalc(a.id)); }

/* derived — never stored (spec R-04) */
function balanceBreakdown(a) {
  const s = scheme(a.schemeId);
  const minBal = a.status === 'matured' ? 0 : s.minBalance;
  let locked = 0, lockReason = '';
  if (s.lockIn && a.lockInEnds && new Date(a.lockInEnds) > TODAY) { locked = a.posted; lockReason = 'লক-ইন মেয়াদ চলছে'; }
  const frozenAmt = a.status === 'frozen' ? a.posted : 0;
  const avail = Math.max(0, a.posted - a.hold - minBal - locked - frozenAmt);
  return { posted: a.posted, pending: a.pending, hold: a.hold, minBal, locked, frozenAmt, avail, lockReason };
}

/* ---------- transactions ---------- */
let TXC = 0;
const TX = [];
/* demo rows carry `base:true` — they are already inside each account's opening
   baseline, so recalc() must not count them twice. Live actions create rows
   without the flag, and those DO move the balance. */
function tx(o) { o.id = 'TX' + String(++TXC).padStart(5, '0'); if (o.base === undefined) o.base = true; TX.push(o); return o; }

/* a1 — monthly ৳1,000 */
[[12, '2025-11-10', 'cash_field', 'posted', 'রাজু আহমেদ'], [11, '2025-12-10', 'cash_field', 'posted', 'রাজু আহমেদ'],
 [10, '2026-01-10', 'cash_field', 'posted', 'রাজু আহমেদ'], [9, '2026-02-10', 'bkash', 'posted', '—'],
 [8, '2026-03-10', 'cash_office', 'posted', 'সুমি রানী'], [7, '2026-04-10', 'cash_field', 'posted', 'রাজু আহমেদ'],
 [6, '2026-05-10', 'cash_field', 'posted', 'রাজু আহমেদ'], [5, '2026-06-10', 'bkash', 'posted', '—'],
 [4, '2026-07-10', 'cash_field', 'posted', 'রাজু আহমেদ'], [3, '2026-08-10', 'cash_field', 'posted', 'রাজু আহমেদ'],
 [2, '2026-09-10', 'cash_office', 'posted', 'সুমি রানী'],
].forEach(([n, d, ch, st, by]) => tx({ accId: 'a1', no: 19 - n + 1, type: 'deposit', amount: 100000, date: d, channel: ch, status: st, by, receipt: 'RCP-2627-' + (1200 - n * 7) }));
tx({ accId: 'a1', no: 20, type: 'deposit', amount: 100000, date: '2026-10-10', channel: 'cash_field', status: 'posted', by: 'রাজু আহমেদ', receipt: 'RCP-2627-1418' });
tx({ accId: 'a1', no: 21, type: 'deposit', amount: 30000, date: '2026-10-29', channel: 'bkash', status: 'pending', by: 'সদস্য (নিজে)', receipt: null, note: 'বিকাশ TrxID: BK8N2XQ71M' });
tx({ accId: 'a1', no: 0, type: 'withdrawal', amount: 100000, date: '2026-06-22', channel: 'bkash', status: 'posted', by: 'মোঃ আব্দুল্লাহ (ম্যানেজার)', receipt: 'WVC-2627-0091', wd: 'WR-2627-0091' });
tx({ accId: 'a1', no: 0, type: 'withdrawal', amount: 60000, date: '2026-09-04', channel: 'cash_office', status: 'posted', by: 'মোঃ আব্দুল্লাহ (ম্যানেজার)', receipt: 'WVC-2627-0147', wd: 'WR-2627-0147' });
tx({ accId: 'a1', no: 0, type: 'fee', amount: 5000, date: '2026-07-01', channel: 'cash_office', status: 'posted', by: 'সিস্টেম (বার্ষিক ফি)', receipt: 'FEE-2627-0042' });

/* a2 — daily ৳50 (last 14 shown) */
for (let i = 14; i >= 1; i--) {
  tx({ accId: 'a2', no: 148 - i + 1, type: 'deposit', amount: 5000, date: daysAgo(i - 1).toISOString().slice(0, 10), channel: 'cash_field', status: 'posted', by: 'রাজু আহমেদ', receipt: 'RCP-2627-' + (1500 - i) });
}
tx({ accId: 'a2', no: 0, type: 'withdrawal', amount: 40000, date: '2026-08-15', channel: 'cash_office', status: 'posted', by: 'মোঃ আব্দুল্লাহ (ম্যানেজার)', receipt: 'WVC-2627-0122' });

/* a4 — নুরুজ্জামান, has reversal */
tx({ accId: 'a4', no: 20, type: 'deposit', amount: 100000, date: '2026-09-15', channel: 'cash_field', status: 'reversed', by: 'রাজু আহমেদ', receipt: 'RCP-2627-1301', note: 'সদস্য ভুল — প্রকৃত জমা ৳৫০০' });
tx({ accId: 'a4', no: 0, type: 'reversal', amount: 100000, date: '2026-09-16', channel: 'cash_office', status: 'posted', by: 'সুমি রানী (হিসাবরক্ষক)', receipt: 'REV-2627-0018', note: 'RCP-2627-1301 বাতিল' });
tx({ accId: 'a4', no: 20, type: 'deposit', amount: 50000, date: '2026-09-16', channel: 'cash_field', status: 'posted', by: 'রাজু আহমেদ', receipt: 'RCP-2627-1309' });

/* pending deposits (approval queue) */
const PENDING_DEPOSITS = [
  { id: 'PD0', receipt: 'RCP-2627-1520', memberId: 'm1', accId: 'a1', amount: 30000, date: '2026-10-29', channel: 'bkash',
    ref: 'BK3M7QT91X', by: 'সদস্য (নিজে)', at: 'গতকাল · সন্ধ্যা ৬:১৫', hoursAgo: 15, evidence: true, matched: 'none', sla: 'ok',
    note: 'আব্দুল করিম নিজেই বিকাশে পাঠিয়ে রেফারেন্স দিয়েছেন' },
  { id: 'PD1', receipt: 'RCP-2627-1522', memberId: 'm2', accId: 'a3', amount: 500000, date: '2026-10-29', channel: 'bkash',
    ref: 'BK7K9LM22P', by: 'সদস্য (নিজে)', at: 'সন্ধ্যা ৬:১২', hoursAgo: 16, evidence: true, matched: 'auto', sla: 'warn' },
  { id: 'PD2', receipt: 'RCP-2627-1523', memberId: 'm6', accId: 'a7', amount: 200000, date: '2026-10-30', channel: 'nagad',
    ref: 'NG55TQ8841', by: 'সদস্য (নিজে)', at: 'সকাল ৯:০৪', hoursAgo: 3, evidence: true, matched: 'auto', sla: 'ok' },
  { id: 'PD3', receipt: 'RCP-2627-1524', memberId: 'm8', accId: 'a9', amount: 50000, date: '2026-10-30', channel: 'bank',
    ref: 'BEFTNS-99341277', by: 'সুমি রানী (হিসাবরক্ষক)', at: 'সকাল ১০:৩৮', hoursAgo: 2, evidence: true, matched: 'manual', sla: 'ok' },
  { id: 'PD4', receipt: 'RCP-2627-1525', memberId: 'm3', accId: 'a4', amount: 100000, date: '2026-10-27', channel: 'cash_field',
    ref: '—', by: 'রাজু আহমেদ (সংগ্রহক)', at: '৩ দিন আগে', hoursAgo: 78, evidence: false, matched: 'none', sla: 'breach', note: 'প্রমাণ ছবি সংযুক্ত নেই' },
];

/* ---------- withdrawal requests ---------- */
const WITHDRAWALS = [
  { id: 'w1', no: 'WR-2627-0212', memberId: 'm1', accId: 'a1', amount: 500000, reason: 'চিকিৎসা', reasonCode: 'medical',
    method: 'bkash', payoutRef: '017****6789', submitted: '2026-10-30', at: 'সকাল ৮:৪২', status: 'under_review', step: 'ম্যানেজার',
    noticeEnds: '2026-11-06', hoursAgo: 5, nominee: 'রোকেয়া বেগম (স্ত্রী)', onBehalf: false,
    elig: { posted: 1250000, hold: 0, min: 50000, locked: 0, avail: 1200000 } },
  { id: 'w2', no: 'WR-2627-0211', memberId: 'm4', accId: 'a5', amount: 2500000, reason: 'মেয়ের বিয়ে', reasonCode: 'family',
    method: 'bank', payoutRef: 'কৃষি ব্যাংক •••৪৪৭১', submitted: '2026-10-29', at: 'দুপুর ১:১৫', status: 'approved', step: 'নিষ্পত্তির অপেক্ষায়',
    noticeEnds: '2026-11-13', hoursAgo: 26, nominee: 'জহিরুল ইসলাম (পুত্র)', onBehalf: false,
    elig: { posted: 3600000, hold: 0, min: 0, locked: 0, avail: 3600000 }, approvedBy: 'কাজী নুরুন্নবী (অনুমোদনকারী)', approvedAt: '2026-10-30 সকাল ১০:২০' },
  { id: 'w3', no: 'WR-2627-0209', memberId: 'm6', accId: 'a7', amount: 200000, reason: 'শিক্ষা', reasonCode: 'education',
    method: 'cash_office', payoutRef: 'অফিস কাউন্টার', submitted: '2026-10-28', at: 'সকাল ১১:০৫', status: 'approved', step: 'নিষ্পত্তির অপেক্ষায়',
    noticeEnds: '2026-11-04', hoursAgo: 50, nominee: '—', onBehalf: false,
    elig: { posted: 860000, hold: 0, min: 50000, locked: 0, avail: 810000 }, approvedBy: 'মোঃ আব্দুল্লাহ (ম্যানেজার)', approvedAt: '2026-10-29 দুপুর ২:৪০' },
  { id: 'w4', no: 'WR-2627-0205', memberId: 'm2', accId: 'a3', amount: 500000, reason: 'ব্যবসা', reasonCode: 'business',
    method: 'nagad', payoutRef: '018****4455', submitted: '2026-10-26', at: 'বিকাল ৪:২০', status: 'settled', step: 'সম্পন্ন',
    settledAt: '2026-10-27', voucher: 'WVC-2627-0205', disbursedBy: 'সুমি রানী (হিসাবরক্ষক)' },
  { id: 'w5', no: 'WR-2627-0198', memberId: 'm7', accId: 'a8', amount: 150000, reason: 'অন্যান্য', reasonCode: 'other',
    method: 'cash_office', payoutRef: 'অফিস কাউন্টার', submitted: '2026-10-18', at: 'সকাল ১০:০০', status: 'rejected', step: 'বাতিল',
    rejectReason: 'লক-ইন মেয়াদ শেষ হয়নি (মেয়াদি স্কিম, ৬ মাস) — মেয়াদ শেষ হবে ০১ মে ২০২৭', rejectedBy: 'মোঃ আব্দুল্লাহ (ম্যানেজার)', rejectedAt: '2026-10-19' },
  { id: 'w6', no: 'WR-2627-0210', memberId: 'm3', accId: 'a4', amount: 100000, reason: 'চিকিৎসা', reasonCode: 'medical',
    method: 'bkash', payoutRef: '019****8811', submitted: '2026-10-29', at: 'সন্ধ্যা ৭:৩০', status: 'cancelled', step: 'সদস্য প্রত্যাহার করেছেন',
    onBehalf: true, onBehalfBy: 'রাজু আহমেদ (সংগ্রহক)' },
];

/* ---------- dues ---------- */
/* sample rows shown in the register; the rest of the 23-member register is aggregated here */
const DUES_BASE = 8475000;
const DUES = [
  { accId: 'a1', instNo: 19, due: '2026-10-10', amount: 100000, paid: 0, age: 20, band: '০–৩০ দিন', lateFee: 2000 },
  { accId: 'a4', instNo: 21, due: '2026-10-15', amount: 100000, paid: 0, age: 15, band: '০–৩০ দিন', lateFee: 2000 },
  { accId: 'a4', instNo: 20, due: '2026-09-15', amount: 100000, paid: 50000, age: 45, band: '৩১–৬০ দিন', lateFee: 2000 },
  { accId: 'a8', instNo: 36, due: '2026-05-15', amount: 5000, paid: 0, age: 168, band: '৯০+ দিন', lateFee: 2000 },
  { accId: 'a8', instNo: 35, due: '2026-04-15', amount: 5000, paid: 0, age: 198, band: '৯০+ দিন', lateFee: 2000 },
  { accId: 'a8', instNo: 34, due: '2026-03-15', amount: 5000, paid: 0, age: 229, band: '৯০+ দিন', lateFee: 2000 },
];

/* ---------- admin KPIs (30 Oct 2026) ---------- */
const KPI = {
  collected: 2845000, target: 4200000, txns: 96, newMembers: 4,
  totalSavings: 154650000, members: 284, activeMembers: 261,
  cash: 186400, bank: 9420000, wallet: 318500,
  duesTotal: 8640000, dueMembers: 23,
  pendingDeposits: 4, pendingWithdrawals: 6, pendingMembers: 3, pendingCorrections: 2,
  disbursedToday: 700000, monthProgress: 71, dayClose: false,
  alerts: [
    { k: 'danger', t: 'দিন সমাপ্তি বাকি', d: '২৯ অক্টোবরের ক্যাশ বুক এখনো বন্ধ করা হয়নি (D-17 ডিফল্ট: কাজ চলবে, কিন্তু অ্যালার্ট থাকবে)' },
    { k: 'warn', t: 'রিকনসিলিয়েশনে ৪টি অমিল', d: 'বিকাশ স্টেটমেন্টের সাথে ৩টি, ব্যাংকের সাথে ১টি লেনদেন মিলছে না' },
    { k: 'warn', t: '১টি জমা ৭৮ ঘণ্টা ধরে ঝুলন্ত', d: 'RCP-2627-1525 — প্রমাণ ছবি সংযুক্ত নেই (SLA ৪৮ ঘণ্টা অতিক্রম)' },
  ],
  last7: [1950000, 2410000, 1780000, 3120000, 2640000, 2280000, 2845000],
  schemeSplit: [{ n: 'দৈনিক সঞ্চয়', v: 38650000, p: 25 }, { n: 'মাসিক সাধারণ', v: 51200000, p: 33 }, { n: 'মেয়াদি (৩ বছর)', v: 64800000, p: 42 }],
  collectorRank: [{ n: 'রাজু আহমেদ', v: 1240000, p: 100 }, { n: 'সালমা আক্তার', v: 980000, p: 79 }, { n: 'হাবিবুর রহমান', v: 625000, p: 50 }],
};

/* ---------- notifications ---------- */
const NOTIFS = [
  { id: 'n1', kind: 'txn', unread: true, at: 'আজ · সকাল ৮:৪৫', title: 'উত্তোলনের আবেদন গৃহীত হয়েছে',
    body: '৳৫,০০০ এর আবেদন (WR-2627-0212) জমা হয়েছে। নোটিশ পিরিয়ড শেষ হবে ৬ নভেম্বর।', link: '#m12' },
  { id: 'n2', kind: 'due', unread: true, at: 'আজ · সকাল ৭:০০', title: 'এই মাসের কিস্তি বাকি',
    body: 'মাসিক সাধারণ সঞ্চয় — ১৯তম কিস্তির ৳১,০০০ এখনো বাকি। ২০ দিন পেরিয়েছে।', link: '#m13' },
  { id: 'n3', kind: 'txn', unread: false, at: 'গতকাল · সন্ধ্যা ৬:১৫', title: 'জমা যাচাইয়ের অপেক্ষায়',
    body: 'বিকাশে পাঠানো ৳৩০০ সমিতি যাচাই করছে। সাধারণত ২৪ ঘণ্টার মধ্যে নিশ্চিত হয়।', link: '#m07' },
  { id: 'n4', kind: 'txn', unread: false, at: '১০ অক্টোবর · দুপুর ১২:৪০', title: '৳১,০০০ জমা হয়েছে ✓',
    body: 'মাসিক সাধারণ সঞ্চয় • কিস্তি ২০ • সংগ্রহক: রাজু আহমেদ। নতুন ব্যালেন্স ৳১২,৫০০।', link: '#m09' },
  { id: 'n5', kind: 'notice', unread: false, at: '৮ অক্টোবর', title: 'বার্ষিক সাধারণ সভার নোটিশ',
    body: '১৫ নভেম্বর ২০২৬, সকাল ১০টা, সমিতি কার্যালয়। হিসাব ও নিরীক্ষা প্রতিবেদন উপস্থাপন করা হবে।', link: '#m17' },
  { id: 'n6', kind: 'security', unread: false, at: '৫ অক্টোবর', title: 'নতুন ডিভাইসে লগইন',
    body: 'Symphony D80 (কেশবপুর) থেকে লগইন হয়েছে। আপনি না হলে এখনই পিন বদলান।', link: '#m20' },
];

/* ---------- audit log ---------- */
const AUDIT = [
  { at: '2026-10-30 10:20', who: 'কাজী নুরুন্নবী', role: 'APPROVER', act: 'approve', ent: 'withdrawal_request', id: 'WR-2627-0211', res: 'success', detail: '৳২৫,০০০ অনুমোদন (সীমা ৳২,০০,০০০ এর মধ্যে)' },
  { at: '2026-10-30 09:58', who: 'সুমি রানী', role: 'ACCOUNTANT', act: 'create', ent: 'deposit', id: 'RCP-2627-1524', res: 'success', detail: 'ব্যাংক ট্রান্সফার ৳৫০০ — যাচাইয়ের অপেক্ষায়' },
  { at: '2026-10-30 09:41', who: 'রাজু আহমেদ', role: 'COLLECTOR', act: 'create', ent: 'deposit', id: 'RCP-2627-1521', res: 'success', detail: 'নগদ ৳১,০০০ — অফলাইন থেকে sync হয়েছে' },
  { at: '2026-10-30 09:12', who: 'মোঃ আব্দুল্লাহ', role: 'MANAGER', act: 'reject', ent: 'withdrawal_request', id: 'WR-2627-0198', res: 'success', detail: 'কারণ: লক-ইন মেয়াদ শেষ হয়নি' },
  { at: '2026-10-29 17:30', who: 'রাজু আহমেদ', role: 'COLLECTOR', act: 'create', ent: 'withdrawal_request', id: 'WR-2627-0210', res: 'success', detail: 'সদস্যের হয়ে আবেদন (OTP যাচাইকৃত) ⚠️ D-11' },
  { at: '2026-10-29 16:02', who: 'অজ্ঞাত', role: '—', act: 'login', ent: 'user', id: 'u-114', res: 'denied', detail: 'ভুল OTP — ৩ বার (আইপি ১০৩.৪৮.১২.৭)' },
  { at: '2026-10-29 11:44', who: 'সুমি রানী', role: 'ACCOUNTANT', act: 'update', ent: 'member', id: 'RSS-2627-0119', res: 'success', detail: 'ঠিকানা: গ্রাম পরিবর্তন — আগে "হাসানপুর" → পরে "বিদ্যানন্দকাঠি"' },
  { at: '2026-10-28 15:20', who: 'মোঃ আব্দুল্লাহ', role: 'MANAGER', act: 'status_change', ent: 'member', id: 'RSS-2627-0178', res: 'success', detail: 'active → suspended (কারণ: ধারাবাহিক বকেয়া ৬ কিস্তি)' },
];

/* ---------- statements & receipts (M-14) ---------- */
const STATEMENTS = [
  { id: 'st1', kind: 'monthly', accId: 'a1', label: 'সেপ্টেম্বর ২০২৬ · মাসিক', range: ['2026-09-01', '2026-09-30'],
    madeAt: '2026-10-01', fmt: 'PDF', size: '১৮৪ KB', open: 1050000, close: 1150000, inTx: 1, outTx: 0, inAmt: 100000, outAmt: 0 },
  { id: 'st2', kind: 'fy', accId: 'a1', label: 'অর্থবছর ২০২৫–২৬ · বার্ষিক', range: ['2025-07-01', '2026-06-30'],
    madeAt: '2026-07-05', fmt: 'PDF', size: '৪১২ KB', open: 450000, close: 1050000, inTx: 8, outTx: 1, inAmt: 800000, outAmt: 160000 },
  { id: 'st3', kind: 'custom', accId: 'a2', label: 'দৈনিক সঞ্চয় · ১–৩০ অক্টোবর', range: ['2026-10-01', '2026-10-30'],
    madeAt: '2026-10-30', fmt: 'PDF', size: '৯৬ KB', open: 470000, close: 500000, inTx: 26, outTx: 0, inAmt: 30000, outAmt: 0, fresh: true },
];
const RECEIPTS = [
  { no: 'RCP-2627-1521', date: '2026-10-30', accId: 'a1', amount: 30000, ch: 'bkash', status: 'pending', code: 'RSS-1521-4H8N' },
  { no: 'RCP-2627-1418', date: '2026-10-10', accId: 'a1', amount: 100000, ch: 'cash_field', status: 'posted', code: 'RSS-1418-7Q2X' },
  { no: 'RCP-2627-1301', date: '2026-09-16', accId: 'a4', amount: 100000, ch: 'cash_office', status: 'reversed', code: 'RSS-1301-2K5D' },
  { no: 'WVC-2627-0205', date: '2026-10-27', accId: 'a3', amount: 500000, ch: 'nagad', status: 'settled', code: 'RSS-W205-8T3R', kind: 'withdrawal' },
  { no: 'FEE-2627-0042', date: '2026-07-01', accId: 'a1', amount: 5000, ch: 'cash_office', status: 'posted', code: 'RSS-F042-9P1M', kind: 'fee' },
];

/* ---------- KYC documents (M-18 / A-08) ---------- */
const KYC_DOCS = [
  { k: 'photo', t: 'ছবি', at: '2024-03-12', status: 'verified', by: 'সুমি রানী' },
  { k: 'nid_front', t: 'NID — সামনে', at: '2024-03-12', status: 'verified', by: 'সুমি রানী' },
  { k: 'nid_back', t: 'NID — পেছনে', at: '2024-03-12', status: 'verified', by: 'সুমি রানী' },
  { k: 'signature', t: 'সাক্ষর', at: '2024-03-12', status: 'verified', by: 'সুমি রানী' },
  { k: 'nominee_nid', t: 'নমিনির NID', at: null, status: 'missing', by: null },
];

/* ---------- general ledger rows (A-25) ---------- */
const LEDGER = [
  { id: 'TX00096', at: '2026-10-30 10:20', type: 'withdrawal', memberId: 'm4', accId: 'a5', debit: 0, credit: 2500000, ch: 'bank',
    status: 'approved', by: 'রাজু আহমেদ', appr: 'কাজী নুরুন্নবী', period: 'open', ref: 'WR-2627-0211' },
  { id: 'TX00095', at: '2026-10-30 09:58', type: 'deposit', memberId: 'm8', accId: 'a9', debit: 50000, credit: 0, ch: 'bank',
    status: 'pending', by: 'সুমি রানী', appr: '—', period: 'open', ref: 'RCP-2627-1524' },
  { id: 'TX00094', at: '2026-10-30 09:41', type: 'deposit', memberId: 'm1', accId: 'a1', debit: 100000, credit: 0, ch: 'cash_field',
    status: 'posted', by: 'রাজু আহমেদ', appr: 'স্বয়ংক্রিয়', period: 'open', ref: 'RCP-2627-1521' },
  { id: 'TX00093', at: '2026-10-29 17:30', type: 'withdrawal', memberId: 'm3', accId: 'a4', debit: 0, credit: 100000, ch: 'bkash',
    status: 'cancelled', by: 'রাজু আহমেদ', appr: '—', period: 'open', ref: 'WR-2627-0210' },
  { id: 'TX00092', at: '2026-10-27 14:05', type: 'withdrawal', memberId: 'm2', accId: 'a3', debit: 0, credit: 500000, ch: 'nagad',
    status: 'settled', by: 'সুমি রানী', appr: 'মোঃ আব্দুল্লাহ', period: 'open', ref: 'WVC-2627-0205' },
  { id: 'TX00091', at: '2026-09-16 11:12', type: 'reversal', memberId: 'm3', accId: 'a4', debit: 0, credit: 100000, ch: 'cash_office',
    status: 'reversed', by: 'সুমি রানী', appr: 'কাজী নুরুন্নবী', period: 'locked', ref: 'JE-2627-0031', revOf: 'TX00088' },
  { id: 'TX00090', at: '2026-09-16 11:12', type: 'reversal', memberId: 'm3', accId: 'a4', debit: 100000, credit: 0, ch: 'cash_office',
    status: 'reversed', by: 'সুমি রানী', appr: 'কাজী নুরুন্নবী', period: 'locked', ref: 'JE-2627-0031', revOf: 'TX00088' },
  { id: 'TX00088', at: '2026-09-15 16:40', type: 'deposit', memberId: 'm3', accId: 'a4', debit: 100000, credit: 0, ch: 'cash_office',
    status: 'reversed', by: 'রাজু আহমেদ', appr: 'সুমি রানী', period: 'locked', ref: 'RCP-2627-1301', revBy: 'TX00090' },
  { id: 'TX00087', at: '2026-07-01 09:00', type: 'fee', memberId: 'm1', accId: 'a1', debit: 0, credit: 5000, ch: 'cash_office',
    status: 'posted', by: 'সিস্টেম', appr: 'স্বয়ংক্রিয়', period: 'locked', ref: 'FEE-2627-0042' },
];
const TRIAL = { period: 'অক্টোবর ২০২৬ (চলতি)', debit: 4652000, credit: 4652000, matched: true,
  heads: [['সদস্য সঞ্চয় দায়', 0, 154650000], ['নগদ (ক্যাশ বুক)', 186400, 0], ['ব্যাংক', 9420000, 0],
          ['ওয়ালেট (বিকাশ/নগদ)', 318500, 0], ['উত্তোলন প্রদেয়', 0, 2500000], ['ফি আয়', 0, 1180000]] };

/* ---------- pending member applications (A-11) ---------- */
const APPLICATIONS = [
  { id: 'app1', memberId: 'm10', src: 'self_app', srcBn: 'নিজে আবেদন (অ্যাপ)', invite: 'RSS-2627', at: '2026-10-28',
    schemeId: 'sc2', firstDeposit: 100000, otp: true, kyc: 'partial',
    docs: { photo: 'ok', nid_front: 'ok', nid_back: 'blur', signature: 'missing' },
    dup: 'none', status: 'pending', age: 30,
    note: 'মোবাইল দোকান, বিদ্যানন্দকাঠি। আবেদনকারী নিজেই মোবাইলে ফর্ম পূরণ করেছেন।' },
  { id: 'app2', memberId: 'm3', src: 'field', srcBn: 'মাঠ (সংগ্রহক এন্ট্রি)', at: '2026-10-29',
    schemeId: 'sc1', firstDeposit: 5000, otp: true, kyc: 'complete',
    docs: { photo: 'ok', nid_front: 'ok', nid_back: 'ok', signature: 'ok' },
    dup: 'warn', status: 'pending', age: 26,
    note: 'সংগ্রহক রাজু আহমেদ অফলাইনে এন্ট্রি করেছেন, sync হয়েছে সকাল ৯:৪১-এ (D-18)।' },
  { id: 'app3', memberId: null, src: 'office', srcBn: 'অফিস কাউন্টার', at: '2026-10-30',
    schemeId: 'sc3', firstDeposit: 200000, otp: false, kyc: 'complete',
    name: 'সুফিয়া খাতুন', nid: '1992****6614', mobile: '01744-556677',
    docs: { photo: 'ok', nid_front: 'ok', nid_back: 'ok', signature: 'ok' },
    dup: 'none', status: 'pending', age: 4 },
];

/* ---------- clearance check & final settlement (A-15) ---------- */
const CLEARANCE = {
  memberId: 'm7', accId: 'a8',
  checks: [
    { k: 'running_wd', t: 'চলমান উত্তোলন আবেদন', ok: true, d: '১টি আবেদন প্রত্যাখ্যাত হয়ে গেছে — কিছু ঝুলন্ত নেই', go: '#a22' },
    { k: 'dues', t: 'বকেয়া কিস্তি', ok: false, d: '৬টি কিস্তি বাকি · ৳৩,০০০ · সর্বোচ্চ ১৯৮ দিন', amt: 300000, go: '#a31' },
    { k: 'late_fee', t: 'অপরিশোধিত বিলম্ব ফি', ok: false, d: '৬ × ৳২০ = ৳১২০ (D-08 নির্ধারিত)', amt: 12000, go: '#a31' },
    { k: 'charges', t: 'অপরিশোধিত চার্জ', ok: false, d: 'বার্ষিক ফি ২০২৫–২৬ বাকি', amt: 6000, go: '#a13' },
    { k: 'hold', t: 'আটক (Hold) অঙ্ক', ok: true, d: 'কোনো হোল্ড নেই' },
    { k: 'kyc', t: 'KYC ও নমিনি', ok: true, d: 'যাচাইকৃত · নমিনি নেই (মৃত্যু দাবির ঝুঁকি নোট করা আছে)', go: '#a10' },
    { k: 'share', t: 'শেয়ার মূলধন', ok: true, d: '৳৫০০ — আলাদা হিসাবে ফেরত যাবে (D-04)', amt2: 50000 },
  ],
  settle: { posted: 180000, dues: 300000, fee: 12000, charges: 6000 },
  waiver: { allowed: true, by: 'ORG_ADMIN + কমিটির লিখিত সিদ্ধান্ত', note: 'D-09 ডিফল্ট — মওকুফ হলে AUDITOR-কে স্বয়ংক্রিয় অ্যালার্ট যাবে' },
};

/* ---------- scheme version diff (A-05) ---------- */
const VDIFF = [
  { f: 'লক-ইন', old: '৩ মাস', neu: '৬ মাস', locked: false, impact: 'নতুন অ্যাকাউন্টে প্রযোজ্য · বিদ্যমান ১৮টি অ্যাকাউন্ট পুরনো নিয়মেই চলবে' },
  { f: 'নোটিশ পিরিয়ড', old: '৭ দিন', neu: '১৫ দিন', locked: false, impact: 'চলমান ২টি উত্তোলন আবেদনে প্রভাব পড়বে না (আবেদনের সময়ের নিয়ম সংরক্ষিত)' },
  { f: 'কিস্তির পরিমাণ', old: '৳১,০০০', neu: '—', locked: true, impact: 'চালু স্কিমে বদলানো যাবে না — বিদ্যমান সদস্যের প্রতিশ্রুতি ভঙ্গ হয়' },
  { f: 'সর্বনিম্ন ব্যালেন্স', old: '৳৫০০', neu: '৳৫০০', locked: false, impact: 'পরিবর্তন নেই' },
  { f: 'বিলম্ব ফি', old: '৳২০', neu: '৳২৫', locked: false, impact: 'D-08 ডিফল্ট থেকে সরে যাচ্ছে — কমিটির সিদ্ধান্ত সংযুক্ত করুন' },
];

/* ---------- member change requests (A-09) ---------- */
const CHANGES = [
  { f: 'ঠিকানা (গ্রাম)', old: 'হাসানপুর', neu: 'বিদ্যানন্দকাঠি', at: '2026-10-29 11:44', by: 'সুমি রানী',
    status: 'applied', reason: 'সদস্য বিয়ের পর শ্বশুরবাড়িতে উঠে গেছেন — NID-এর ঠিকানার সাথে মিল', proof: 'ইউপি সদস্যের প্রত্যয়নপত্র' },
  { f: 'মোবাইল নম্বর', old: '01811-223344', neu: '01933-778811', at: '2026-10-27 16:10', by: 'রাজু আহমেদ',
    status: 'approved', reason: 'পুরনো সিম বন্ধ হয়ে গেছে', proof: 'পুরনো + নতুন দুই নম্বরে OTP যাচাই (D-21)' },
  { f: 'নামের বানান', old: 'নুরুজ্জামান', neu: 'মোঃ নুরুজ্জামান', at: '2026-10-30 09:15', by: 'সুমি রানী',
    status: 'pending', reason: 'NID-এ "মোঃ" আছে, ব্যাংক হিসাবে মিলছে না', proof: 'NID সামনের পাতা (পুনরায় আপলোড)' },
];

/* ---------- bottom nav ---------- */
/* ============================================================
   PHASE 2 ডেটা সেট (১৯ পেজ) — A-02, A-12, A-14, A-18, A-19,
   A-26…A-30, A-32…A-34 · M-15, M-17, M-19, M-20 · S-03, S-08
   টাকা সবসময় paisa (BIGINT) — কোথাও float নয়, কোথাও সুদ নয়।
   ============================================================ */

/* ---------- M-17 · নোটিশ বোর্ড ---------- */
const NOTICES = [
  { id: 'nt1', title: 'বার্ষিক সাধারণ সভা ২০২৬', kind: 'meeting', kindBn: 'সভা', published: '2026-10-22', validTill: '2026-11-14',
    by: 'কাজী নুরুন্নবী (সভাপতি)', body: 'আগামী ১৪ নভেম্বর ২০২৬, সকাল ১০টা, কেশবপুর উচ্চ বিদ্যালয় মাঠে বার্ষিক সাধারণ সভা অনুষ্ঠিত হবে। আলোচ্যসূচি: ২০২৫–২৬ অর্থবছরের হিসাব অনুমোদন, ২০২৬–২৭ বাজেট, নতুন স্কিম প্রস্তাব ও নির্বাচন।',
    attach: 'AGM-2026-নোটিশ.pdf', size: '২১৪ KB', pinned: true, urgent: false, read: false },
  { id: 'nt2', title: 'ঈদ বিশেষ সঞ্চয় ২০২৬ — নতুন নামভর্তি বন্ধ', kind: 'scheme', kindBn: 'স্কিম', published: '2026-08-31', validTill: '2026-12-31',
    by: 'মোঃ আব্দুল্লাহ (ম্যানেজার)', body: 'ঈদ বিশেষ সঞ্চয় ২০২৬ স্কিমে নতুন নামভর্তি ৩১ আগস্ট ২০২৬ থেকে বন্ধ। বিদ্যমান ৬৪ জন সদস্যের কিস্তি ও নিয়ম অপরিবর্তিত থাকবে (সংস্করণ পিনিং)।',
    attach: null, size: null, pinned: false, urgent: false, read: true },
  { id: 'nt3', title: '১ নভেম্বর অফিস বন্ধ', kind: 'general', kindBn: 'সাধারণ', published: '2026-10-28', validTill: '2026-11-01',
    by: 'সুমি রানী (হিসাবরক্ষক)', body: '১ নভেম্বর ২০২৬ (শনিবার) সমিতির অফিস বন্ধ থাকবে। মাঠ সংগ্রহকরা তাদের রুট অনুযায়ী সংগ্রহ চালিয়ে যাবেন; অফিস কাউন্টারে জমা গ্রহণ বন্ধ থাকবে।',
    attach: null, size: null, pinned: false, urgent: false, read: false },
  { id: 'nt4', title: 'জরুরি: বিকাশ সার্ভিসে সাময়িক সমস্যা', kind: 'urgent', kindBn: 'জরুরি', published: '2026-10-29', validTill: '2026-10-31',
    by: 'সিস্টেম', body: 'বিকাশের সার্ভিসে সাময়িক সমস্যার কারণে গতকাল সন্ধ্যা থেকে পাঠানো জমাগুলো এখনো যাচাইয়ের অপেক্ষায়। আপনার টাকা নিরাপদ — যাচাই শেষ হলে SMS পাবেন। নগদ জমা দিতে চাইলে সংগ্রহক বা অফিস কাউন্টার ব্যবহার করুন।',
    attach: null, size: null, pinned: true, urgent: true, read: false },
  { id: 'nt5', title: 'নতুন স্কিম প্রস্তাব — মতামত আহ্বান', kind: 'scheme', kindBn: 'স্কিম', published: '2026-10-15', validTill: '2026-10-25',
    by: 'কাজী নুরুন্নবী (সভাপতি)', body: '“বিদ্যালয় সঞ্চয় ২০২৭” নামে একটি নতুন স্কিমের প্রস্তাব বিবেচনাধীন। সদস্যদের মতামত ২৫ অক্টোবরের মধ্যে অফিসে জমা দেওয়ার অনুরোধ।',
    attach: 'প্রস্তাব-বিদ্যালয়-সঞ্চয়.pdf', size: '৯৮ KB', pinned: false, urgent: false, read: true, expired: true },
];
const NOTICE_KIND = { meeting: { t: 'সভা', c: 'chip-info', i: 'users' }, urgent: { t: 'জরুরি', c: 'chip-danger', i: 'warn' },
  scheme: { t: 'স্কিম', c: 'chip-lime', i: 'book2' }, general: { t: 'সাধারণ', c: 'chip-neutral', i: 'doc' } };

/* ---------- M-19 / A-14 · নমিনি ---------- */
const NOMINEES = [
  { id: 'nm1', memberId: 'm1', name: 'রোকেয়া বেগম', rel: 'স্ত্রী', nid: '1988****2210', share: 60, photo: 'র',
    accIds: ['a1', 'a2'], docs: { nid: 'ok', photo: 'ok', consent: 'ok' }, addedAt: '2024-03-12', approvedBy: 'মোঃ আব্দুল্লাহ', status: 'active' },
  { id: 'nm2', memberId: 'm1', name: 'সাজেদুল করিম', rel: 'পুত্র', nid: '2005****8871', share: 40, photo: 'স',
    accIds: ['a1', 'a2'], docs: { nid: 'ok', photo: 'blur', consent: 'ok' }, addedAt: '2024-03-12', approvedBy: 'মোঃ আব্দুল্লাহ', status: 'active' },
  { id: 'nm3', memberId: 'm2', name: 'জলিল আহমেদ', rel: 'পুত্র', nid: '1996****4419', share: 100, photo: 'জ',
    accIds: ['a3'], docs: { nid: 'ok', photo: 'ok', consent: 'pending' }, addedAt: '2024-08-02', approvedBy: '—', status: 'pending' },
];
const NOMINEE_CHANGE = { id: 'nc1', memberId: 'm1', at: '2026-10-27', by: 'আব্দুল করিম (সদস্য)', status: 'pending',
  from: [{ name: 'রোকেয়া বেগম', share: 60 }, { name: 'সাজেদুল করিম', share: 40 }],
  to: [{ name: 'রোকেয়া বেগম', share: 50 }, { name: 'সাজেদুল করিম', share: 30 }, { name: 'ফারহানা করিম', share: 20, rel: 'কন্যা', nid: '2008****1174' }],
  reason: 'কন্যাকেও নমিনি করা হলো', approver: 'মোঃ আব্দুল্লাহ (ম্যানেজার)' };

/* ---------- M-20 / S-03 · ডিভাইস, সম্মতি, পছন্দ ---------- */
const DEVICES = [
  { id: 'dv1', name: 'Symphony Z60 · Android 13', place: 'কেশবপুর, খুলনা', last: 'এখন (এই ডিভাইস)', current: true, ip: '103.৪৮.••.••' },
  { id: 'dv2', name: 'Nokia 105 (ফিচার ফোন · SMS)', place: 'কেশবপুর, খুলনা', last: '২৭ অক্টোবর, সন্ধ্যা ৭:১২', current: false, ip: '—' },
  { id: 'dv3', name: 'অচেনা ডিভাইস · Chrome/Windows', place: 'যশোর (আনুমানিক)', last: '২১ অক্টোবর, রাত ১১:৪৮', current: false, ip: '45.১১২.••.••', suspect: true },
];
const CONSENTS = [
  { id: 'cs1', v: 3, title: 'সেবার শর্তাবলি', at: '2026-07-01', required: true, state: 'accepted',
    change: 'উত্তোলনের নোটিশ পিরিয়ড ৭ দিনে অপরিবর্তিত; বিলম্ব ফির সীমা ৳২০০/বছর স্পষ্ট করা হয়েছে।' },
  { id: 'cs2', v: 2, title: 'গোপনীয়তা নীতি', at: '2026-07-01', required: true, state: 'accepted',
    change: 'ডেটা সংরক্ষণের মেয়াদ ৮ বছর (সমবায় বিধিমালা) স্পষ্ট করা হয়েছে।' },
  { id: 'cs3', v: 1, title: 'SMS নোটিফিকেশন (অবাধ্যতামূলক)', at: '2026-07-01', required: false, state: 'accepted',
    change: 'প্রথম সংস্করণ।' },
  { id: 'cs4', v: 1, title: 'ডেটা শেয়ারিং (গবেষণা)', at: null, required: false, state: 'declined',
    change: 'আপনি সম্মতি দেননি — কোনো ডেটা শেয়ার হয় না।' },
];
const PREFS = { lang: 'bn', digits: 'bn', textSize: 'normal', theme: 'light',
  notif: { txn: true, dues: true, scheme: true, notice: true, sms: true, push: true },
  pin: true, bio: false, timeout: 5, txnLimit: 500000, appVersion: '0.9.4 (প্রোটোটাইপ)' };

/* ---------- A-02 / A-32 · রুট ও সংগ্রহ পরিকল্পনা ---------- */
const ROUTES = [
  { id: 'R1', name: 'কেশবপুর সদর – পূর্ব', area: 'সুফলাকাটি, বিদ্যানন্দকাঠি', collector: 'রাজু আহমেদ', day: 'প্রতিদিন',
    members: 46, unassigned: 0, target: 2300000, collected: 1610000, dues: 4, overdueAmt: 420000, cashInHand: 1610000, load: 'ok' },
  { id: 'R2', name: 'ত্রিমোহনী – দক্ষিণ', area: 'গৌরীঘোনা, ত্রিমোহনী', collector: 'সালমা আক্তার', day: 'সোম–বৃহস্পতি',
    members: 38, unassigned: 0, target: 1900000, collected: 980000, dues: 3, overdueAmt: 306000, cashInHand: 980000, load: 'ok' },
  { id: 'R3', name: 'হরিণাকুণ্ডু সীমানা', area: 'ঝিনাইদহ সীমান্তবর্তী', collector: 'হাবিবুর রহমান', day: 'মঙ্গল–শুক্র',
    members: 27, unassigned: 12, target: 1350000, collected: 625000, dues: 2, overdueAmt: 204000, cashInHand: 625000, load: 'over' },
];
const ROUTE_DUE_MEMBERS = [
  { route: 'R1', memberId: 'm3', name: 'নুরুজ্জামান', mobile: '01933-778811', addr: 'বিদ্যানন্দকাঠি', due: 204000, age: 15, last: '১৫ অক্টোবর' },
  { route: 'R1', memberId: 'm5', name: 'কুলসুম বেগম', mobile: '01744-908812', addr: 'সুফলাকাটি উত্তরপাড়া', due: 102000, age: 20, last: '১০ অক্টোবর' },
  { route: 'R2', memberId: 'm7', name: 'রফিকুল ইসলাম', mobile: '01866-221144', addr: 'গৌরীঘোনা বাজার', due: 306000, age: 168, last: '১৫ মে' },
  { route: 'R3', memberId: 'm8', name: 'জাহানারা খাতুন', mobile: '01522-778899', addr: 'হরিণাকুণ্ডু', due: 5000, age: 45, last: '১৫ সেপ্টেম্বর' },
];

/* ---------- A-12 · সদস্য অবস্থার ইতিহাস ও পরিণতি ---------- */
const STATUS_HIST = [
  { memberId: 'm7', at: '2026-09-12', from: 'active', to: 'dormant', reason: '৯০ দিন কোনো কিস্তি জমা হয়নি (D-07)', by: 'সিস্টেম (স্বয়ংক্রিয়)', approved: 'মোঃ আব্দুল্লাহ', notified: true },
  { memberId: 'm7', at: '2026-08-01', from: 'active', to: 'active', reason: 'মোবাইল নম্বর পরিবর্তন — দ্বৈত OTP যাচাই সম্পন্ন (D-21)', by: 'সুমি রানী', approved: '—', notified: true },
  { memberId: 'm6', at: '2026-06-20', from: 'active', to: 'suspended', reason: 'কমিটির সিদ্ধান্ত ২০২৬/০৯ — সমিতির ক্ষতিসাধনের অভিযোগ তদন্তাধীন', by: 'কাজী নুরুন্নবী', approved: 'কমিটি', notified: true },
  { memberId: 'm9', at: '2026-05-04', from: 'active', to: 'deceased', reason: 'মৃত্যু সনদ যাচাইকৃত · নমিনি দাবি নিষ্পত্তি চলছে', by: 'সুমি রানী', approved: 'কাজী নুরুন্নবী', notified: false },
];
const STATUS_CONSEQ = {
  suspended: { blocks: ['নতুন জমা', 'উত্তোলন', 'নতুন অ্যাকাউন্ট'], keeps: ['বিদ্যমান ব্যালেন্স সংরক্ষিত', 'বকেয়া হিসাব চলবে'], tone: 'danger',
    note: 'চলমান ১টি উত্তোলন আবেদন আটকে যাবে এবং সদস্যকে কারণসহ SMS যাবে।' },
  dormant: { blocks: ['উত্তোলন'], keeps: ['জমা দেওয়া যাবে', 'বকেয়া রেজিস্টারে থাকবে'], tone: 'warn',
    note: 'নিষ্ক্রিয় অবস্থায় জমা চলবে — আবার সক্রিয় করতে একটি কিস্তি জমা + ম্যানেজার অনুমোদন লাগবে।' },
  active: { blocks: [], keeps: ['সব স্বাভাবিক'], tone: 'ok', note: 'পূর্বাবস্থায় ফেরানো — আগের সীমাবদ্ধতাগুলো উঠে যাবে।' },
  exited: { blocks: ['সব লেনদেন'], keeps: ['রেকর্ড ৮ বছর আর্কাইভ (D-30)'], tone: 'neutral', note: '⚠️ এটি থেকে ফেরা কঠিন — নতুন সদস্যপদ আলাদা প্রক্রিয়া।' },
};
const STATUS_REASONS = ['বকেয়া কিস্তি (৯০+ দিন)', 'কমিটির সিদ্ধান্ত', 'সদস্যের নিজের অনুরোধ', 'তদন্ত চলছে', 'মৃত্যু', 'ভুয়া/ডুপ্লিকেট সদস্য', 'এলাকা ত্যাগ'];

/* ---------- A-14 · মৃত্যু দাবি ---------- */
const DEATH_CLAIMS = [
  { id: 'dc1', memberId: 'm9', member: 'আব্দুল গফফার', accNo: 'RSS-2627-0163-MS', claimed: 1250000, balance: 1250000,
    nominee: 'ফাতেমা খাতুন (স্ত্রী)', nomineeNid: '1972****5518', share: 100, at: '2026-10-18', status: 'proof_pending',
    proofs: { death: 'ok', nomineeNid: 'ok', witness: 'missing', affidavit: 'missing' },
    notice: 'কাগজের নোটিশ প্রকাশিত (দৈনিক খুলনা বার্তা, ২২ অক্টোবর)', claimants: 1, dispute: false,
    note: 'নমিনির NID মিলে গেছে; দুই সাক্ষীর স্বাক্ষর ও হলফনামা বাকি।' },
  { id: 'dc2', memberId: 'm11', member: 'মৃত শাহজাহান আলী', accNo: 'RSS-2627-0098-DS', claimed: 480000, balance: 480000,
    nominee: '— (নমিনি নিবন্ধিত নেই)', nomineeNid: null, share: 0, at: '2026-09-30', status: 'dispute',
    proofs: { death: 'ok', nomineeNid: 'na', witness: 'na', affidavit: 'na' },
    notice: 'প্রকাশিত নয়', claimants: 3, dispute: true,
    note: 'তিনজন দাবিদার (স্ত্রী ও দুই পুত্র) — বিরোধ নিষ্পত্তিতে কমিটির সিদ্ধান্ত ও ইউনিয়ন পরিষদ সনদ প্রয়োজন।' },
  { id: 'dc3', memberId: 'm12', member: 'মৃত রেজিয়া সুলতানা', accNo: 'RSS-2627-0141-TS', claimed: 860000, balance: 860000,
    nominee: 'নাসরিন আক্তার (কন্যা)', nomineeNid: '1994****7712', share: 100, at: '2026-08-14', status: 'settled',
    proofs: { death: 'ok', nomineeNid: 'ok', witness: 'ok', affidavit: 'ok' },
    notice: 'প্রকাশিত ও নিষ্পত্তি সম্পন্ন', claimants: 1, dispute: false, settledAt: '2026-09-02',
    voucher: 'WVC-2627-0198', note: 'চূড়ান্ত প্রদান নমিনির বিকাশ নম্বরে; অ্যাকাউন্ট Closed।' },
];
const DC_STATUS = { proof_pending: { t: 'প্রমাণ বাকি', c: 'chip-warn', i: 'doc' }, verification: { t: 'যাচাইধীন', c: 'chip-info', i: 'eye' },
  approved: { t: 'অনুমোদিত', c: 'chip-ok', i: 'checkc' }, dispute: { t: 'বিরোধ', c: 'chip-purple', i: 'warn' },
  settled: { t: 'নিষ্পত্তি সম্পন্ন', c: 'chip-ok', i: 'checkc' }, rejected: { t: 'প্রত্যাখ্যাত', c: 'chip-danger', i: 'xc' } };

/* ---------- A-18 · বাল্ক/ব্যাচ জমা ---------- */
const BATCHES = [
  { id: 'bt1', no: 'BAT-2627-048', by: 'রাজু আহমেদ (সংগ্রহক)', route: 'R1', at: '2026-10-30 সকাল ১১:২০', rows: 42, valid: 42, invalid: 0,
    amount: 2100000, status: 'posted', txn: 'TX00090', dup: 0 },
  { id: 'bt2', no: 'BAT-2627-049', by: 'সুমি রানী (হিসাবরক্ষক)', route: 'অফিস কাউন্টার', at: '2026-10-30 দুপুর ১:০৫', rows: 18, valid: 15, invalid: 3,
    amount: 900000, status: 'partial', txn: null, dup: 1,
    errors: [{ r: 6, why: 'অ্যাকাউন্ট নম্বর মেলেনি (RSS-2627-0442-MS)' }, { r: 11, why: 'পরিমাণ স্কিমের সর্বোচ্চ সীমার বেশি' }, { r: 14, why: 'ডুপ্লিকেট সারি — একই সদস্য, একই পরিমাণ, সারি ৩-এ আছে' }] },
  { id: 'bt3', no: 'BAT-2627-050', by: 'সালমা আক্তার (সংগ্রহক)', route: 'R2', at: '2026-10-30 দুপুর ২:৪০', rows: 64, valid: 64, invalid: 0,
    amount: 3200000, status: 'validating', txn: null, dup: 0, progress: 68 },
];
const BATCH_STATUS = { draft: { t: 'খসড়া', c: 'chip-neutral', i: 'edit' }, validating: { t: 'যাচাই চলছে', c: 'chip-info', i: 'refresh' },
  partial: { t: 'আংশিক সফল', c: 'chip-warn', i: 'warn' }, posted: { t: 'পোস্ট হয়েছে', c: 'chip-ok', i: 'checkc' },
  failed: { t: 'ব্যর্থ', c: 'chip-danger', i: 'xc' } };

/* ---------- A-19 · ইমপোর্ট ---------- */
const IMPORTS = [
  { id: 'im1', file: 'সঞ্চয়-অক্টোবর-২০২৬.xlsx', size: '৩৪৮ KB', by: 'সুমি রানী', at: '2026-10-30', rows: 214, valid: 214, invalid: 0,
    amount: 10700000, status: 'committed', mapping: 'স্বয়ংক্রিয় (টেমপ্লেট)', dup: 0, effect: '+৳১,০৭,০০০' },
  { id: 'im2', file: 'পুরনো-খাতা-২০২৩-২৪.csv', size: '১.২ MB', by: 'সুমি রানী', at: '2026-10-26', rows: 1846, valid: 1791, invalid: 55,
    amount: 89250000, status: 'dry_run', mapping: 'হাতে ম্যাপ করা', dup: 12, effect: '+৳৮,৯২,৫০০ (প্রস্তাবিত)' },
  { id: 'im3', file: 'bkash-statement-oct.csv', size: '৯৬ KB', by: 'মোঃ আব্দুল্লাহ', at: '2026-10-25', rows: 310, valid: 0, invalid: 310,
    amount: 0, status: 'parse_error', mapping: '—', dup: 0,
    err: 'ফাইলটি UTF-8 নয় (Windows-1252 এনকোডিং) — বাংলা কলাম পড়া যায়নি। Excel থেকে “CSV UTF-8” হিসেবে সংরক্ষণ করুন।' },
];
const IMPORT_STATUS = { uploaded: { t: 'আপলোড হয়েছে', c: 'chip-info', i: 'download' }, mapped: { t: 'ম্যাপ করা', c: 'chip-info', i: 'sort' },
  dry_run: { t: 'ড্রাই-রান সম্পন্ন', c: 'chip-warn', i: 'eye' }, committed: { t: 'ইমপোর্ট সম্পন্ন', c: 'chip-ok', i: 'checkc' },
  parse_error: { t: 'পড়া যায়নি', c: 'chip-danger', i: 'warn' }, rolled_back: { t: 'ফেরত নেওয়া', c: 'chip-neutral', i: 'refresh' } };
const IMPORT_MAP = [['A — তারিখ', 'txn_date'], ['B — সদস্য নম্বর', 'member_no'], ['C — অ্যাকাউন্ট নম্বর', 'account_no'],
  ['D — পরিমাণ (টাকা)', 'amount_taka → paisa ×১০০'], ['E — মাধ্যম', 'channel'], ['F — রসিদ/রেফারেন্স', 'ref'], ['G — মন্তব্য', 'note']];

/* ---------- A-26/A-27 · অডিট ট্রেইল ও সংশোধনী ---------- */
const AUDIT_TRAIL = [
  { at: '2026-10-30 09:41:22', who: 'রাজু আহমেদ (সংগ্রহক)', role: 'COLLECTOR', act: 'এন্ট্রি তৈরি', field: '—', from: '—', to: '৳১,০০০ জমা', ip: '103.৪৮.••.••', dev: 'Symphony Z60 · অ্যাপ 0.9.4', gps: '২২.৯০°N, ৮৯.২৪°E (সুফলাকাটি)' },
  { at: '2026-10-30 09:41:23', who: 'সিস্টেম', role: 'SYSTEM', act: 'idempotency key বসানো', field: 'idempotency_key', from: '—', to: 'dk_8f3a…c21', ip: '—', dev: '—', gps: '—' },
  { at: '2026-10-30 09:41:24', who: 'সিস্টেম', role: 'SYSTEM', act: 'লেজার এন্ট্রি (ডাবল)', field: 'ledger', from: '—', to: 'ডেবিট নগদ ৳১,০০০ / ক্রেডিট সদস্য সঞ্চয় আমানত ৳১,০০০', ip: '—', dev: '—', gps: '—' },
  { at: '2026-10-30 09:41:24', who: 'সিস্টেম', role: 'SYSTEM', act: 'ব্যালেন্স পুনর্গণনা (R-01)', field: 'posted', from: '৳১১,৫০০', to: '৳১২,৫০০', ip: '—', dev: '—', gps: '—' },
  { at: '2026-10-30 09:41:26', who: 'সিস্টেম', role: 'SYSTEM', act: 'SMS পাঠানো', field: 'notification', from: '—', to: '01711-456789 · ডেলিভার্ড', ip: '—', dev: '—', gps: '—' },
  { at: '2026-10-30 10:12:05', who: 'সুমি রানী (হিসাবরক্ষক)', role: 'ACCOUNTANT', act: 'মন্তব্য যোগ', field: 'note', from: '—', to: 'সংগ্রহকের কাগজের খাতার সাথে মিলে গেছে', ip: '103.৯৫.••.••', dev: 'Chrome · অফিস পিসি', gps: '—' },
  { at: '2026-10-30 10:14:48', who: 'কাজী নুরুন্নবী (APPROVER)', role: 'APPROVER', act: 'রিভার্সালের অনুরোধ প্রত্যাখ্যান', field: 'status', from: 'correction_requested', to: 'posted', ip: '103.৯৫.••.••', dev: 'Chrome · অফিস পিসি', gps: '—' },
];
const CORRECTIONS = [
  { id: 'cr1', no: 'COR-2627-012', txn: 'TX00094', kind: 'amount', kindBn: 'পরিমাণ ভুল', by: 'সুমি রানী', at: '2026-10-30',
    from: 100000, to: 120000, reason: 'সংগ্রহক ৳১,০০০-এর বদলে ৳১,২০০ লিখে ফেলেছেন — কাগজের খাতায় ৳১,২০০ আছে', status: 'pending',
    impact: { balance: +20000, reports: 'আজকের সংগ্রহ +৳২০০, ক্যাশ বুক +৳২০০', notifyMember: true, period: 'চলতি (খোলা)' },
    approval: 'MANAGER', evidence: 'কাগজের খাতার ছবি সংযুক্ত' },
  { id: 'cr2', no: 'COR-2627-011', txn: 'TX00088', kind: 'member', kindBn: 'ভুল সদস্যের অ্যাকাউন্ট', by: 'সুমি রানী', at: '2026-10-29',
    from: 50000, to: 50000, reason: 'একই নামের দুই সদস্য — ভুল অ্যাকাউন্টে পোস্ট হয়েছে', status: 'approved',
    impact: { balance: -50000, reports: 'a7 থেকে ৳৫০০ বিয়োগ, a4-এ যোগ', notifyMember: true, period: 'চলতি (খোলা)' },
    approval: 'MANAGER → APPROVER', approvedBy: 'মোঃ আব্দুল্লাহ', evidence: 'দুই রসিদের তুলনা' },
  { id: 'cr3', no: 'COR-2627-010', txn: 'TX00071', kind: 'date', kindBn: 'তারিখ ভুল', by: 'রাজু আহমেদ', at: '2026-10-27',
    from: 0, to: 0, reason: '২৫ অক্টোবরের জমা ২৬ অক্টোবর লেখা হয়েছে', status: 'rejected',
    impact: { balance: 0, reports: 'শুধু তারিখ বদলাবে — ব্যালেন্সে প্রভাব নেই', notifyMember: false, period: 'সেপ্টেম্বর (লকড) ⚠️' },
    approval: 'MANAGER', rejectReason: 'পিরিয়ড লকড — চলতি পিরিয়ডে উল্টো এন্ট্রি দিয়ে তারিখ ঠিক করতে হবে (R-05)' },
];
const COR_STATUS = { pending: { t: 'অনুমোদনের অপেক্ষায়', c: 'chip-warn', i: 'clock' }, approved: { t: 'অনুমোদিত', c: 'chip-ok', i: 'checkc' },
  rejected: { t: 'প্রত্যাখ্যাত', c: 'chip-danger', i: 'xc' }, posted: { t: 'পোস্ট হয়েছে', c: 'chip-ok', i: 'check' } };

/* ---------- A-28 · ক্যাশ বুক ও দিন সমাপ্তি ---------- */
const CASH_DAYS = [
  { date: '2026-10-30', status: 'open', openBal: 186400, deposits: 2845000, payouts: 700000, toBank: 2000000, toWallet: 0, other: 0,
    sysClose: 331400, counted: null, diff: null, note: 'দিন চলছে — সংগ্রহকদের ঘোষণা বাকি' },
  { date: '2026-10-29', status: 'closed', openBal: 164000, deposits: 2620000, payouts: 450000, toBank: 2000000, toWallet: 147600, other: 0,
    sysClose: 186400, counted: 186400, diff: 0, note: 'মিলে গেছে ✓ · ম্যানেজার অনুমোদিত', closedAt: 'সন্ধ্যা ৬:৪০', approvedBy: 'মোঃ আব্দুল্লাহ' },
  { date: '2026-10-28', status: 'closed', openBal: 210000, deposits: 2310000, payouts: 900000, toBank: 1400000, toWallet: 56000, other: 0,
    sysClose: 174000, counted: 164000, diff: -10000, note: 'ঘাটতি ৳১০০ — কারণ: ভাংতি না থাকায় ৳১০ বেশি ফেরত', closedAt: 'সন্ধ্যা ৭:০৫', approvedBy: 'মোঃ আব্দুল্লাহ', mismatch: true },
];
const CASH_COUNT = [['৳১,০০০ নোট', 12, 1200000], ['৳৫০০ নোট', 24, 1200000], ['৳১০০ নোট', 31, 310000], ['৳৫০ নোট', 18, 90000],
  ['৳২০ নোট', 22, 44000], ['৳১০ নোট', 40, 40000], ['৳৫ ও নিচরের মুদ্রা', '—', 6000]];   /* মোট = CASH_DAYS[0].sysClose → আজ গণনা ও সিস্টেম মিলে গেছে */
const COLLECTOR_SETTLE = [
  { name: 'রাজু আহমেদ', route: 'R1', declared: 1610000, counted: 1610000, diff: 0, at: 'বিকেল ৫:২০', status: 'matched' },
  { name: 'সালমা আক্তার', route: 'R2', declared: 980000, counted: 980000, diff: 0, at: 'বিকেল ৫:৪৫', status: 'matched' },
  { name: 'হাবিবুর রহমান', route: 'R3', declared: 625000, counted: 615000, diff: -10000, at: 'সন্ধ্যা ৬:১০', status: 'short',
    reason: 'এক সদস্যকে ৳১০০ ভুলে বেশি ফেরত দেওয়া হয়েছে' },
];

/* ---------- A-29 · তহবিল স্থানান্তর ---------- */
const ORG_ACCOUNTS = [
  { id: 'oa1', name: 'হাতের নগদ (অফিস ক্যাশ)', kind: 'cash', bal: 186400, bank: '—', no: '—' },
  { id: 'oa2', name: 'কৃষি ব্যাংক — কেশবপুর শাখা', kind: 'bank', bal: 9420000, bank: 'কৃষি ব্যাংক', no: '•••৪৪৭১' },
  { id: 'oa3', name: 'সোনালী ব্যাংক — সংরক্ষণ হিসাব', kind: 'bank', bal: 4200000, bank: 'সোনালী ব্যাংক', no: '•••৯০২২' },
  { id: 'oa4', name: 'বিকাশ (সমিতির মার্চেন্ট)', kind: 'wallet', bal: 318500, bank: 'বিকাশ', no: '01711-000227' },
  { id: 'oa5', name: 'নগদ (সমিতির হিসাব)', kind: 'wallet', bal: 0, bank: 'নগদ', no: '01822-000114' },
];
const TRANSFERS = [
  { id: 'ft1', no: 'FT-2627-031', from: 'oa1', to: 'oa2', amount: 2000000, at: '2026-10-29', by: 'সুমি রানী', approvedBy: 'মোঃ আব্দুল্লাহ',
    status: 'completed', fee: 0, ref: 'নগদ জমা স্লিপ ৪৪৭১', eta: 'তাৎক্ষণিক' },
  { id: 'ft2', no: 'FT-2627-032', from: 'oa4', to: 'oa1', amount: 147600, at: '2026-10-29', by: 'সুমি রানী', approvedBy: 'মোঃ আব্দুল্লাহ',
    status: 'completed', fee: 2175, ref: 'বিকাশ ক্যাশ-আউট TRX8841', eta: '১০ মিনিট' },
  { id: 'ft3', no: 'FT-2627-033', from: 'oa4', to: 'oa2', amount: 300000, at: '2026-10-30', by: 'সুমি রানী', approvedBy: null,
    status: 'pending_approval', fee: 0, ref: '—', eta: 'অনুমোদনের পর ১ ঘণ্টা' },
  { id: 'ft4', no: 'FT-2627-030', from: 'oa2', to: 'oa4', amount: 500000, at: '2026-10-27', by: 'সুমি রানী', approvedBy: 'মোঃ আব্দুল্লাহ',
    status: 'failed', fee: 0, ref: 'ব্যাংক রিসিট নেই', eta: '—', failReason: 'ব্যাংক সার্ভার বন্ধ ছিল — টাকা কাটা হয়নি, আবার চেষ্টা করা যাবে' },
];
const FT_STATUS = { pending_approval: { t: 'অনুমোদনের অপেক্ষায়', c: 'chip-warn', i: 'clock' }, in_transit: { t: 'পথে আছে', c: 'chip-info', i: 'route' },
  completed: { t: 'সম্পন্ন', c: 'chip-ok', i: 'checkc' }, failed: { t: 'ব্যর্থ', c: 'chip-danger', i: 'xc' },
  unknown: { t: 'অনিশ্চিত', c: 'chip-purple', i: 'warn' } };

/* ---------- A-30 · রিকনসিলিয়েশন ---------- */
const RECON = {
  id: 'rc1', period: 'অক্টোবর ২০২৬', source: 'বিকাশ + কৃষি ব্যাংক', status: 'in_progress', signedOff: false,
  sysTotal: 9738500, extTotal: 9688500, diff: 50000,
  matched: 182, unmatched: 4, suspense: 1,
  statements: [
    { src: 'বিকাশ মার্চেন্ট স্টেটমেন্ট', file: 'bkash-merchant-oct.pdf', rows: 214, matched: 211, diff: 3, uploadedAt: '2026-10-30 সকাল ৯:১০' },
    { src: 'কৃষি ব্যাংক স্টেটমেন্ট', file: 'krishi-bank-oct.csv', rows: 46, matched: 44, diff: 2, uploadedAt: '2026-10-30 সকাল ৯:১৫' },
  ],
};
const RECON_EX = [
  { id: 'ex1', kind: 'sys_only', kindBn: 'সিস্টেমে আছে, ব্যাংকে নেই', txn: 'TX00095', member: 'সাজেদা বেগম', amount: 50000, date: '2026-10-29',
    cause: 'ব্যাংক স্টেটমেন্ট কাটার সময়ের আগে এন্ট্রি — পরের দিনে মিলবে (timing)', status: 'open', action: 'পরবর্তী পিরিয়ডে মিলবে — অপেক্ষা' },
  { id: 'ex2', kind: 'ext_only', kindBn: 'ব্যাংকে আছে, সিস্টেমে নেই', txn: '—', member: 'শনাক্ত হয়নি', amount: 25000, date: '2026-10-28',
    cause: 'রেফারেন্সে অ্যাকাউন্ট নম্বর ছিল না', status: 'suspense', action: 'suspense খাতে রাখা হয়েছে (H10) — তদন্ত চলছে' },
  { id: 'ex3', kind: 'amount_diff', kindBn: 'পরিমাণ ভিন্ন', txn: 'TX00091', member: 'নুরুজ্জামান', amount: 15000, date: '2026-10-27',
    cause: 'সিস্টেমে ৳৫০০, স্টেটমেন্টে ৳৩৫০ — ওয়ালেট ফি ৳১৫০ আলাদা লাইনে', status: 'open', action: 'সংশোধন প্রস্তাব → A-27 (ফি আলাদা খাতায়)' },
  { id: 'ex4', kind: 'dup', kindBn: 'ডুপ্লিকেট', txn: 'TX00084', member: 'কুলসুম বেগম', amount: 10000, date: '2026-10-25',
    cause: 'অফলাইন sync-এ একই এন্ট্রি দুবার এসেছে — idempotency key ভিন্ন ছিল', status: 'resolved', action: 'উল্টো এন্ট্রি বসানো হয়েছে (R-02)', resolvedAt: '2026-10-26', by: 'মোঃ আব্দুল্লাহ' },
];
const RECON_KIND = { sys_only: { t: 'সিস্টেমে আছে', c: 'chip-info' }, ext_only: { t: 'বাইরে আছে', c: 'chip-warn' },
  amount_diff: { t: 'পরিমাণ ভিন্ন', c: 'chip-danger' }, dup: { t: 'ডুপ্লিকেট', c: 'chip-purple' } };

/* ---------- A-33 · রিমাইন্ডার টেমপ্লেট ও শিডিউল ---------- */
const TEMPLATES = [
  { id: 'tp1', code: 'DUE-REMIND-03', name: 'বকেয়া রিমাইন্ডার (৩ দিন আগে)', lang: 'bn', channel: ['SMS', 'Push'], trigger: 'কিস্তির ৩ দিন আগে', on: true,
    body: 'প্রিয় {নাম}, {সমিতি}-তে আপনার {কিস্তি}তম কিস্তি {তারিখ}-এ বাকি। পরিমাণ {পরিমাণ}। আজ পরিশোধ করুন — নিকটস্থ সংগ্রহক বা বিকাশে। বিলম্ব হলে ৳২০ ফি (সুদ নয়)।',
    sent: 184, delivered: 179, failed: 5, cost: 64400 },
  { id: 'tp2', code: 'DUE-OVER-07', name: 'গ্রেস পার (৭ দিন পরে)', lang: 'bn', channel: ['SMS'], trigger: 'কিস্তির ৭ দিন পরে', on: true,
    body: '{নাম}, আপনার {পরিমাণ} বকেয়া হয়েছে এবং ৭ দিনের গ্রেস শেষ। বিলম্ব ফি ৳২০ যোগ হয়েছে (সুদ নয়)। অনুগ্রহ করে আজ পরিশোধ করুন।',
    sent: 62, delivered: 60, failed: 2, cost: 21700 },
  { id: 'tp3', code: 'DUE-DORMANT-90', name: 'নিষ্ক্রিয় হওয়ার পূর্বনোটিশ (৯০ দিন)', lang: 'bn', channel: ['SMS', 'চিঠি'], trigger: 'বকেয়া ৯০ দিন হলে', on: true,
    body: '{নাম}, ৯০ দিন বকেয়ার কারণে আপনার অ্যাকাউন্ট নিষ্ক্রিয় হতে যাচ্ছে। উত্তোলন বন্ধ হবে, জমা চলবে। অফিসে যোগাযোগ করুন।',
    sent: 9, delivered: 8, failed: 1, cost: 3150 },
  { id: 'tp4', code: 'WD-SETTLED', name: 'উত্তোলন নিষ্পত্তি নিশ্চিতকরণ', lang: 'bn', channel: ['SMS', 'Push'], trigger: 'নিষ্পত্তির সাথে সাথে', on: true,
    body: '{নাম}, {পরিমাণ} আপনার {মাধ্যম}-এ পাঠানো হয়েছে। ভাউচার {ভাউচার}। নতুন ব্যালেন্স {ব্যালেন্স}। ধন্যবাদ।',
    sent: 41, delivered: 41, failed: 0, cost: 14350 },
  { id: 'tp5', code: 'AGM-NOTICE', name: 'সাধারণ সভার নোটিশ', lang: 'bn', channel: ['SMS'], trigger: 'ম্যানুয়াল (বাল্ক)', on: false,
    body: '{সমিতি}-এর বার্ষিক সাধারণ সভা {তারিখ}, {সময়}, {স্থান}। উপস্থিতি আবশ্যক।', sent: 0, delivered: 0, failed: 0, cost: 0 },
];
const SMS_BALANCE = { balance: 412000, perSms: 350, lowAt: 100000, validNumbers: 261, invalidNumbers: 12 };
const DELIVERY_LOG = [
  { at: '2026-10-30 সকাল ১০:০০', tpl: 'DUE-REMIND-03', sent: 6, delivered: 6, failed: 0, by: 'স্বয়ংক্রিয় শিডিউল' },
  { at: '2026-10-29 সকাল ১০:০০', tpl: 'DUE-OVER-07', sent: 3, delivered: 2, failed: 1, by: 'স্বয়ংক্রিয় শিডিউল', failList: '01944-••••11 (নম্বর বন্ধ)' },
  { at: '2026-10-28 দুপুর ২:৩০', tpl: 'AGM-NOTICE', sent: 261, delivered: 254, failed: 7, by: 'মোঃ আব্দুল্লাহ (বাল্ক)' },
];
const OPT_OUT = [{ name: 'আব্দুল করিম', mobile: '01711-456789', why: 'শুধু গুরুত্বপূর্ণ নোটিশ চাই', at: '2026-09-18' }];

/* ---------- A-34 · রিপোর্ট ক্যাটালগ ---------- */
const REPORTS = [
  { g: 'দৈনিক', code: 'D-01', name: 'দৈনিক সংগ্রহ সারসংক্ষেপ', params: ['তারিখ', 'রুট'], fmt: ['PDF', 'Excel'], time: '৫ সেকেন্ড', roles: 'সব অ্যাডমিন' },
  { g: 'দৈনিক', code: 'D-02', name: 'ক্যাশ বুক ও দিন সমাপ্তি', params: ['তারিখ'], fmt: ['PDF', 'Excel'], time: '৮ সেকেন্ড', roles: 'ACCOUNTANT+' },
  { g: 'সদস্য', code: 'M-01', name: 'সদস্য তালিকা (সব ফিল্ড)', params: ['রুট', 'অবস্থা', 'যোগদানের সময়'], fmt: ['Excel', 'CSV'], time: '২০ সেকেন্ড', roles: 'MANAGER+' },
  { g: 'সদস্য', code: 'M-02', name: 'নমিনি ও মৃত্যু দাবি রেজিস্টার', params: ['সময়'], fmt: ['PDF', 'Excel'], time: '১২ সেকেন্ড', roles: 'MANAGER+' },
  { g: 'সঞ্চয়', code: 'S-01', name: 'স্কিমভিত্তিক সঞ্চয় ও সদস্য', params: ['স্কিম', 'সময়'], fmt: ['PDF', 'Excel'], time: '১৫ সেকেন্ড', roles: 'সব অ্যাডমিন' },
  { g: 'সঞ্চয়', code: 'S-02', name: 'মেয়াদ পূর্ণ ও নিষ্পত্তির তালিকা', params: ['সময়'], fmt: ['Excel'], time: '১০ সেকেন্ড', roles: 'ACCOUNTANT+' },
  { g: 'বকেয়া', code: 'DU-01', name: 'বকেয়া রেজিস্টার (aging সহ)', params: ['ব্যান্ড', 'রুট'], fmt: ['PDF', 'Excel'], time: '১৮ সেকেন্ড', roles: 'সব অ্যাডমিন' },
  { g: 'আর্থিক', code: 'F-01', name: 'ট্রায়াল ব্যালান্স', params: ['পিরিয়ড'], fmt: ['PDF', 'Excel'], time: '২৫ সেকেন্ড', roles: 'ACCOUNTANT+' },
  { g: 'আর্থিক', code: 'F-02', name: 'আয়-ব্যয় বিবরণী (সুদবিহীন)', params: ['পিরিয়ড', 'তুলনামূলক'], fmt: ['PDF', 'Excel'], time: '৪০ সেকেন্ড', roles: 'MANAGER+' },
  { g: 'আর্থিক', code: 'F-03', name: 'রিকনসিলিয়েশন সনদ', params: ['পিরিয়ড', 'উৎস'], fmt: ['PDF'], time: '৩০ সেকেন্ড', roles: 'ACCOUNTANT+' },
  { g: 'নিরীক্ষা', code: 'AU-01', name: 'অডিট ট্রেইল (সম্পূর্ণ)', params: ['সময়', 'ব্যবহারকারী', 'লেনদেন'], fmt: ['CSV', 'PDF'], time: '১–৩ মিনিট', roles: 'AUDITOR, ORG_ADMIN' },
  { g: 'নিরীক্ষা', code: 'AU-02', name: 'সংশোধন ও রিভার্সাল রেজিস্টার', params: ['সময়'], fmt: ['Excel'], time: '২০ সেকেন্ড', roles: 'AUDITOR+' },
  { g: 'রেগুলেটরি', code: 'RG-01', name: 'সমবায় অধিদপ্তরের নির্ধারিত ছক', params: ['অর্থবছর'], fmt: ['Excel'], time: '২–৫ মিনিট', roles: 'ORG_ADMIN' },
];
const REPORT_RECENT = [
  { code: 'D-01', name: 'দৈনিক সংগ্রহ সারসংক্ষেপ', at: '2026-10-30 সকাল ৮:০০', by: 'স্বয়ংক্রিয়', fmt: 'PDF', size: '১৪২ KB', status: 'ready' },
  { code: 'DU-01', name: 'বকেয়া রেজিস্টার (aging সহ)', at: '2026-10-29 সন্ধ্যা ৬:১৫', by: 'মোঃ আব্দুল্লাহ', fmt: 'Excel', size: '৯৬ KB', status: 'ready' },
  { code: 'AU-01', name: 'অডিট ট্রেইল (সম্পূর্ণ)', at: '2026-10-29 দুপুর ১২:৪০', by: 'নিরীক্ষক (বাহ্যিক)', fmt: 'CSV', size: '৪.৮ MB', status: 'running' },
  { code: 'F-02', name: 'আয়-ব্যয় বিবরণী', at: '2026-10-28', by: 'সুমি রানী', fmt: 'PDF', size: '—', status: 'failed', err: 'এক্সপোর্ট ব্যর্থ — রেঞ্জ ছোট করে আবার চেষ্টা করুন' },
];

/* ---------- S-08 · অফলাইন sync কিউ ---------- */
const SYNC = {
  device: 'Symphony Z60 · অ্যাপ 0.9.4', storage: { used: 18, total: 32, unit: 'MB' },
  lastSync: '2026-10-30 দুপুর ১:১২', online: false, queued: 7, conflicts: 1, dups: 1, failed: 2,
};
const SYNCQ = [
  { id: 'sq1', kind: 'deposit', no: '(রসিদ নম্বর বরাদ্দ বাকি)', member: 'কুলসুম বেগম', acc: 'RSS-2627-0107-MS', amount: 100000, at: 'দুপুর ১২:৪৮', status: 'queued', offline: true },
  { id: 'sq2', kind: 'deposit', no: '(রসিদ নম্বর বরাদ্দ বাকি)', member: 'জাহাঙ্গীর হোসেন', acc: 'RSS-2627-0132-DS', amount: 5000, at: 'দুপুর ১২:৫২', status: 'queued', offline: true },
  { id: 'sq3', kind: 'deposit', no: 'RCP-2627-1523', member: 'সালমা বেগম', acc: 'RSS-2627-0088-MS', amount: 100000, at: 'সকাল ১১:৩০', status: 'synced', offline: true },
  { id: 'sq4', kind: 'deposit', no: 'RCP-2627-1524', member: 'সাজেদা বেগম', acc: 'RSS-2627-0154-MS', amount: 50000, at: 'সকাল ১১:৪১', status: 'conflict', offline: true,
    local: 'পরিমাণ ৳৫০০ · সময় সকাল ১১:৪১', server: 'পরিমাণ ৳৫০০ · সময় সকাল ১১:৩৯', why: 'সংগ্রহক একই এন্ট্রি দুই ডিভাইসে করেছেন' },
  { id: 'sq5', kind: 'deposit', no: '(বাতিল)', member: 'সাজেদা বেগম', acc: 'RSS-2627-0154-MS', amount: 50000, at: 'সকাল ১১:৪২', status: 'duplicate', offline: true,
    why: 'idempotency key মিলে গেছে — একটি রাখা হয়েছে, এটি বাতিল (লগসহ)' },
  { id: 'sq6', kind: 'member_edit', no: '—', member: 'নুরুজ্জামান', acc: '—', amount: 0, at: 'দুপুর ১:০২', status: 'failed', offline: true,
    err: 'সার্ভার প্রত্যাখ্যান করেছে: KYC যাচাই বাকি — সংশোধন করতে হবে' },
  { id: 'sq7', kind: 'deposit', no: '(রসিদ নম্বর বরাদ্দ বাকি)', member: 'রহিমা বেগম', acc: 'RSS-2627-0087-MS', amount: 100000, at: 'দুপুর ১:০৮', status: 'failed', offline: true,
    err: 'সংযোগ বিচ্ছিন্ন — স্বয়ংক্রিয়ভাবে আবার চেষ্টা চলবে' },
];
const SYNC_STATUS = { queued: { t: 'কিউতে', c: 'chip-warn', i: 'clock' }, syncing: { t: 'পাঠানো হচ্ছে', c: 'chip-info', i: 'refresh' },
  synced: { t: 'জমা হয়েছে ✓', c: 'chip-ok', i: 'checkc' }, conflict: { t: 'সংঘর্ষ', c: 'chip-purple', i: 'warn' },
  duplicate: { t: 'ডুপ্লিকেট (বাতিল)', c: 'chip-neutral', i: 'xc' }, failed: { t: 'ব্যর্থ', c: 'chip-danger', i: 'warn' } };

/* ---------- M-15 · ক্লোজার প্রিভিউ (ডেমো হিসাব) ---------- */
const CLOSURE_PREVIEW = { accId: 'a8', requested: false, noticeDays: 7,
  steps: [['মোট জমা (posted)', 180000, 'ok'], ['বকেয়া ৬ কিস্তি', -300000, 'danger'], ['বিলম্ব ফি (৬ × ৳২০)', -12000, 'warn'],
    ['অপরিশোধিত বার্ষিক চার্জ', -6000, 'warn'], ['আটক (hold)', 0, 'ok']],
  net: -138000, payable: 0 };

/* ============================================================
   PHASE 3 DATASETS · M-21, A-16, A-35, A-36, A-37, A-38, S-04
   সব অঙ্ক paisa-তে · কোনো সুদ নেই (BR-13)
   ============================================================ */

/* ---------- M-21 · সহায়তা ও অভিযোগ ---------- */
const SUPPORT = {
  helpline: '১৬২৪৭', helplineTime: 'সকাল ৯টা – সন্ধ্যা ৬টা (শুক্রবার বন্ধ)',
  office: { addr: 'সমিতি কার্যালয়, কেশবপুর বাজার, কেশবপুর, খুলনা', hours: 'শনি–বৃহস্পতি · সকাল ১০টা – বিকাল ৪টা', map: '২৩.০° উত্তর, ৮৯.২° পূর্ব' },
  whatsapp: '০১৭১১-৪৫৬৭৮৯', email: 'help@rahima-somobay.org',
  slaHours: 48, slaNote: 'সাধারণ অভিযোগে ৪৮ ঘণ্টা, টাকার অভিযোগে ২৪ ঘণ্টার মধ্যে প্রথম সাড়া'
};
const TICKETS = [
  { id: 'TKT-2627-0041', type: 'money', typeBn: 'টাকার সমস্যা', at: '2026-10-29T10:12', status: 'open',
    title: 'বিকাশে ৳৩০০ পাঠিয়েছি, হিসাবে জমা দেখাচ্ছে না',
    body: '২৮ অক্টোবর সন্ধ্যা ৭টায় বিকাশে ৳৩০০ পাঠিয়েছি, TrxID 8HK22Q1R। অ্যাপে এখনো "যাচাই চলছে" দেখাচ্ছে।',
    sla: '২৪ ঘণ্টা', due: '2026-10-30T10:12', replies: 1, attach: 1, ref: 'RCP-2627-1525' },
  { id: 'TKT-2627-0038', type: 'profile', typeBn: 'তথ্য সংশোধন', at: '2026-10-22T14:40', status: 'progress',
    title: 'মোবাইল নম্বর বদলাতে চাই — পুরনো নম্বরটি বন্ধ',
    body: 'আমার পুরনো নম্বর ০১৭১১-৪৫৬৭৮৯ বন্ধ হয়ে গেছে। নতুন নম্বর ০১৮১১-২২৩৩৪৪।',
    sla: '৪৮ ঘণ্টা', due: '2026-10-24T14:40', replies: 2, attach: 0, note: 'D-21 অনুযায়ী দুই নম্বরে OTP যাচাই বাকি' },
  { id: 'TKT-2627-0029', type: 'app', typeBn: 'অ্যাপ সমস্যা', at: '2026-10-08T09:05', status: 'resolved',
    title: 'রসিদ ডাউনলোড হচ্ছে না', body: 'M-07 থেকে PDF ডাউনলোড চাপলে কিছুই হয় না।',
    sla: '৪৮ ঘণ্টা', due: '2026-10-10T09:05', replies: 3, attach: 0,
    resolution: 'অ্যাপ ২.৪.১-এ ঠিক করা হয়েছে। পুরনো রসিদগুলো আবার ডাউনলোড করা যাবে।', closedAt: '2026-10-09T16:20' },
  { id: 'TKT-2627-0021', type: 'other', typeBn: 'অন্যান্য', at: '2026-09-18T11:30', status: 'closed',
    title: 'সভার সময় জানতে চাই', body: 'বার্ষিক সাধারণ সভা কবে হবে?',
    sla: '৪৮ ঘণ্টা', due: '2026-09-20T11:30', replies: 1, attach: 0,
    resolution: '১৫ নভেম্বর ২০২৬, সকাল ১০টা — নোটিশ বোর্ডে (M-17) প্রকাশ করা হয়েছে।', closedAt: '2026-09-18T15:02' }
];
const TICKET_STATUS = {
  open: { t: 'খোলা', c: 'chip-warn', i: 'opened' }, progress: { t: 'কাজ চলছে', c: 'chip-info', i: 'refresh' },
  resolved: { t: 'সমাধান হয়েছে', c: 'chip-ok', i: 'checkc' }, closed: { t: 'বন্ধ', c: 'chip-neutral', i: 'lock' }
};
const TICKET_TYPES = [
  { k: 'money', t: 'টাকার সমস্যা', i: 'cash', sla: '২৪ ঘণ্টা', hint: 'জমা দেখাচ্ছে না, ভুল পরিমাণ, উত্তোলন আটকে আছে' },
  { k: 'profile', t: 'তথ্য সংশোধন', i: 'user', sla: '৪৮ ঘণ্টা', hint: 'নাম, মোবাইল, ঠিকানা, নমিনি' },
  { k: 'app', t: 'অ্যাপ সমস্যা', i: 'phone', sla: '৪৮ ঘণ্টা', hint: 'লগইন, রসিদ, স্ক্রিন কাজ করছে না' },
  { k: 'complaint', t: 'আচরণগত অভিযোগ', i: 'warn', sla: '৭২ ঘণ্টা', hint: 'সংগ্রহক বা স্টাফ সম্পর্কে — গোপন রাখা হয়' },
  { k: 'other', t: 'অন্যান্য', i: 'more', sla: '৪৮ ঘণ্টা', hint: 'উপরের কোনোটি নয়' }
];
const FAQS = [
  { q: 'আমার ব্যালেন্সের সব টাকা কি তুলতে পারব?',
    a: 'না। তোলার যোগ্য = জমা হওয়া টাকা − আটক (hold) − সর্বনিম্ন ব্যালেন্স − লক-ইন। প্রতিটি বিয়োগের কারণ M-05 পেজে আলাদা করে দেখানো হয়।', go: '#m05' },
  { q: 'বিকাশে টাকা পাঠালাম, কখন জমা হবে?',
    a: 'সমিতি মার্চেন্ট স্টেটমেন্টে মিলিয়ে যাচাই করে পোস্ট করে — সাধারণত ২৪ ঘণ্টার ভিতরে। যাচাই না হওয়া পর্যন্ত ব্যালেন্সে যোগ হয় না, কিন্তু রসিদ সাথে সাথেই পাবেন (M-07)।', go: '#m12' },
  { q: 'কিস্তি দিতে দেরি হলে কী হবে?',
    a: '৭ দিন গ্রেস (D-07)। এরপর ৳২০ বিলম্ব ফি — এটি <b>সুদ নয়</b>, বছরে সর্বোচ্চ ৳২০০ (D-08)। ৯০ দিন বকেয়া হলে অ্যাকাউন্ট dormant হতে পারে।', go: '#m13' },
  { q: 'উত্তোলনের আগে কতদিন নোটিশ দিতে হবে?',
    a: '৭ দিন (D-02)। মাসে সর্বোচ্চ ২ বার, একবারে সর্বোচ্চ ৳৫০,০০০। ৳৫০০-এর কম তোলা যাবে না। জরুরি ক্ষেত্রে fast-track আছে (D-25)।', go: '#m10' },
  { q: 'রসিদ সত্যি কি না বুঝব কীভাবে?',
    a: 'প্রতিটি রসিদে একটি যাচাই কোড ও QR আছে। S-07 পেজে লগইন ছাড়াই কোড দিলে সত্যতা দেখা যাবে — নাম ও পরিমাণ মেলে কি না মিলিয়ে নিন।', go: '#s07' },
  { q: 'নমিনি বদলাতে চাই, কী করতে হবে?',
    a: 'M-19 থেকে পরিবর্তনের অনুরোধ দিন। নতুন নমিনির NID ও সম্মতি লাগবে, সমিতি অনুমোদন করলে কার্যকর হবে। পুরনো রেকর্ড মুছে যাবে না — ইতিহাসে থাকবে।', go: '#m19' },
  { q: 'অ্যাকাউন্ট বন্ধ করলে কত টাকা পাব?',
    a: 'M-15 পেজে বন্ধ করার আগেই পুরো হিসাব দেখানো হয়। সমিতির পাওনা ব্যালেন্সের বেশি হলে প্রদেয় ৳০ — সমিতি সদস্যের কাছে দাবি করে না (D-19)।', go: '#m15' }
];

/* ---------- A-16 · সদস্য স্থানান্তর ---------- */
const TRANSFERS_M = [
  { id: 'mv1', memberId: 'm4', no: 'MV-2627-0012', kind: 'route', kindBn: 'রুট/সংগ্রহক পরিবর্তন',
    from: 'R1 · রাজু আহমেদ (কেশবপুর সদর)', to: 'R2 · সালমা খাতুন (চন্দ্রপুর)',
    reason: 'সদস্য চন্দ্রপুরে বাড়ি বদলেছেন — নতুন ঠিকানায় সংগ্রহ সহজ',
    effAt: '2026-11-01', at: '2026-10-28', by: 'মোঃ আব্দুল্লাহ', status: 'pending',
    impact: { collector: 'রাজু আহমেদ → সালমা খাতুন', report: 'R1-এর লক্ষ্য ৳৫০০ কমবে, R2-তে যোগ হবে', cash: 'কোনো প্রভাব নেই (একই শাখা)', history: 'পুরনো লেনদেন R1-এই থাকবে' } },
  { id: 'mv2', memberId: 'm7', no: 'MV-2627-0009', kind: 'branch', kindBn: 'শাখা স্থানান্তর',
    from: 'কেশবপুর শাখা (রহিমা সঞ্চয় সমিতি)', to: 'ঝিকরগাছা শাখা (সবুজ কৃষক সমবায়)',
    reason: 'সদস্য চাকরিসূত্রে যশোরে বদলি হয়েছেন',
    effAt: '2026-11-15', at: '2026-10-20', by: 'সুমি রানী', status: 'approved', approvedBy: 'মোঃ আব্দুল্লাহ',
    impact: { collector: 'সমিতির বাইরে — নতুন সমিতিতে নতুন সংগ্রহক', report: '১৫ নভেম্বর থেকে দুই সমিতির রিপোর্টে আলাদা', cash: '৳৮,৪০০ সমন্বয় দরকার (দুই শাখার ক্যাশ আলাদা)', history: 'পুরো ইতিহাস নতুন সমিতিতে কপি হবে, মূল রেকর্ড এখানেই থাকবে' } },
  { id: 'mv3', memberId: 'm2', no: 'MV-2627-0004', kind: 'route', kindBn: 'রুট পরিবর্তন',
    from: 'R3 · হাবিবুর রহমান (হরিণাকুণ্ডু)', to: 'R1 · রাজু আহমেদ (কেশবপুর সদর)',
    reason: 'সংগ্রহকের বোঝা কমানো (R3-তে ২৭ জন)',
    effAt: '2026-09-01', at: '2026-08-26', by: 'মোঃ আব্দুল্লাহ', status: 'done', approvedBy: 'মোঃ আব্দুল্লাহ',
    impact: { collector: 'হাবিবুর রহমান → রাজু আহমেদ', report: 'সেপ্টেম্বর থেকে R1-এ গণনা', cash: 'প্রভাব নেই', history: 'আগস্ট পর্যন্ত R3-এ' } },
  { id: 'mv4', memberId: 'm9', no: 'MV-2627-0002', kind: 'branch', kindBn: 'শাখা স্থানান্তর',
    from: 'কেশবপুর শাখা', to: 'মণিরামপুর শাখা',
    reason: 'ঠিকানা ভুল ছিল', effAt: '2026-07-10', at: '2026-07-08', by: 'সুমি রানী', status: 'cancelled',
    cancelledBy: 'মোঃ আব্দুল্লাহ', cancelReason: 'সদস্যের ব্যালেন্স ও শেয়ার হিসাব মিলছিল না — আগে সংশোধন দরকার' }
];
const MV_STATUS = { pending: { t: 'অনুমোদনের অপেক্ষায়', c: 'chip-warn', i: 'clock' }, approved: { t: 'অনুমোদিত', c: 'chip-info', i: 'checkc' },
  done: { t: 'কার্যকর হয়েছে', c: 'chip-ok', i: 'check' }, cancelled: { t: 'বাতিল', c: 'chip-neutral', i: 'xc' } };

/* ---------- A-35 · আর্থিক বিবরণ ও রেগুলেটরি রিটার্ন ---------- */
const FIN = {
  fy: '২০২৫–২৬', fyEn: '2025-26', period: '১ জুলাই ২০২৫ – ৩০ জুন ২০২৬',
  closed: true, signedOff: false, trialOk: true,
  compare: { fy: '২০২৪–২৫' }
};
/* আয়-ব্যয় বিবরণী (paisa) — কোনো সুদ আয় নেই */
const FIN_INCOME = [
  { h: 'ভর্তি ফি', cur: 420000, prev: 360000 },
  { h: 'বার্ষিক চাঁদা', cur: 285000, prev: 260000 },
  { h: 'উত্তোলন ফি', cur: 310000, prev: 275000 },
  { h: 'বিলম্ব ফি (সুদ নয়)', cur: 96000, prev: 118000 },
  { h: 'স্টেটমেন্ট/সনদ ফি', cur: 70000, prev: 45000 },
  { h: 'ওয়ালেট কমিশন', cur: 184000, prev: 0 }
];
const FIN_EXPENSE = [
  { h: 'স্টাফ বেতন ও ভাতা', cur: 2160000, prev: 1980000 },
  { h: 'সংগ্রহক পরিবহন', cur: 288000, prev: 264000 },
  { h: 'অফিস ভাড়া ও বিদ্যুৎ', cur: 216000, prev: 204000 },
  { h: 'SMS ও যোগাযোগ', cur: 84000, prev: 60000 },
  { h: 'ওয়ালেট ক্যাশ-আউট ফি (সমিতির ব্যয়)', cur: 26100, prev: 0 },
  { h: 'নিরীক্ষা ফি', cur: 150000, prev: 140000 },
  { h: 'স্টেশনারি ও ছাপা', cur: 62000, prev: 71000 }
];
/* উদ্বৃত্তপত্র (Balance Sheet) */
const FIN_BS_ASSET = [
  { h: 'নগদ (ক্যাশ বুক)', cur: 186400, prev: 142000 },
  { h: 'ব্যাংক — কৃষি ব্যাংক', cur: 9420000, prev: 7180000 },
  { h: 'ব্যাংক — সোনালী ব্যাংক', cur: 4200000, prev: 3600000 },
  { h: 'ওয়ালেট (বিকাশ/নগদ)', cur: 318500, prev: 0 },
  { h: 'সদস্যদের কাছে বকেয়া (দাবিযোগ্য)', cur: 8625000, prev: 6120000 },
  { h: 'অগ্রিম ও প্রদেয় খরচ', cur: 96000, prev: 74000 }
];
const FIN_BS_LIAB = [
  { h: 'সদস্য সঞ্চয় আমানত (দায়)', cur: 154650000, prev: 128900000 },
  { h: 'প্রদেয় উত্তোলন', cur: 2500000, prev: 1800000 },
  { h: 'সদস্য শেয়ার মূলধন (D-04 আলাদা)', cur: 620000, prev: 540000 },
  { h: 'সঞ্চিতি / উদ্বৃত্ত', cur: 3600000, prev: 2900000 },
  { h: 'দায় ও মূলধন মোট', cur: 161430000, prev: 134140000 }
];
const FIN_CASHFLOW = [
  { h: 'সদস্যদের কাছ থেকে সংগৃহীত', cur: 38420000, prev: 31200000 },
  { h: 'উত্তোলন প্রদান', cur: -21680000, prev: -17450000 },
  { h: 'ফি ও চার্জ আয়', cur: 1180000, prev: 1058000 },
  { h: 'পরিচালন ব্যয়', cur: -2986200, prev: -2719000 },
  { h: 'ব্যাংক/ওয়ালেট স্থানান্তর (শুদ্ধ)', cur: 462000, prev: 380000 }
];
const FIN_SCHEME = [
  { s: 'sc1', members: 412, bal: 61800000, collected: 18400000, dues: 3120000, closed: 8 },
  { s: 'sc2', members: 268, bal: 54200000, collected: 12600000, dues: 2840000, closed: 5 },
  { s: 'sc3', members: 143, bal: 32400000, collected: 6200000, dues: 1980000, closed: 3 },
  { s: 'sc4', members: 61, bal: 6250000, collected: 1220000, dues: 685000, closed: 1 }
];
const FIN_MEMBERS = { open: 884, joined: 126, exited: 34, dormant: 23, deceased: 6, total: 884 };
/* রেগুলেটরি রিটার্ন — ছকের ফরম্যাট অনিশ্চিত (D-29 খোলা সিদ্ধান্ত) */
const RETURNS = [
  { code: 'RR-01', name: 'বার্ষিক প্রতিবেদন (সমবায় অধিদপ্তর)', fy: '২০২৫–২৬', status: 'ready', fmt: 'অধিদপ্তরের নির্ধারিত ছক ⚠️', at: '2026-07-18', by: 'সুমি রানী' },
  { code: 'RR-02', name: 'সঞ্চয় আমানতের বিবরণী', fy: '২০২৫–২৬', status: 'ready', fmt: 'নির্ধারিত ছক ⚠️', at: '2026-07-18', by: 'সুমি রানী' },
  { code: 'RR-03', name: 'নিরীক্ষা প্রতিবেদন সংযুক্তি', fy: '২০২৫–২৬', status: 'pending', fmt: 'নিরীক্ষকের ছক', at: null, by: null },
  { code: 'RR-04', name: 'ত্রৈমাসিক অগ্রগতি বিবরণী', fy: 'জুলাই–সেপ্টেম্বর ২০২৬', status: 'draft', fmt: 'ছক নিশ্চিত নয় ⚠️', at: null, by: null }
];
const RETURN_STATUS = { ready: { t: 'প্রস্তুত', c: 'chip-ok', i: 'checkc' }, pending: { t: 'অপেক্ষমাণ', c: 'chip-warn', i: 'clock' },
  draft: { t: 'খসড়া', c: 'chip-info', i: 'edit' } };

/* ---------- A-36 · সেটিংস হাব ---------- */
const ORG_SETTINGS = [
  { g: 'সমিতি', i: 'bank', items: [
    { k: 'profile', t: 'সমিতির প্রোফাইল', d: 'নাম, নিবন্ধন নম্বর, ঠিকানা, কার্যালয়ের সময়', v: 'সম্পূর্ণ', ok: true, go: null },
    { k: 'logo', t: 'লোগো ও স্ট্যাম্প', d: 'রসিদ ও সনদে ব্যবহৃত হয়', v: 'আপলোড করা', ok: true, go: null },
    { k: 'fy', t: 'অর্থবছর', d: '১ জুলাই – ৩০ জুন (D-15)', v: '২০২৬–২৭ চলছে', ok: true, go: null },
    { k: 'holidays', t: 'ছুটির ক্যালেন্ডার', d: 'দিন সমাপ্তি ও রিমাইন্ডারের সময় গণনায় লাগে', v: '১৪ দিন', ok: true, go: null }] },
  { g: 'সঞ্চয় নীতি', i: 'book2', items: [
    { k: 'fees', t: 'ফি ও চার্জ (D-05)', d: 'ভর্তি ৳১০০ · বার্ষিক ৳৫০ · উত্তোলন ৳২০ (>৳১০,০০০) · স্টেটমেন্ট ৳০', v: 'সেট করা', ok: true, go: '#a04' },
    { k: 'latefee', t: 'বিলম্ব ফি (D-08)', d: '৳২০/কিস্তি · বছরে সর্বোচ্চ ৳২০০ · সুদ নয়', v: 'সেট করা', ok: true, go: '#a04' },
    { k: 'grace', t: 'গ্রেস ও dormant (D-07)', d: 'গ্রেস ৭ দিন · ৯০ দিনে dormant', v: 'সেট করা', ok: true, go: '#a12' },
    { k: 'waiver', t: 'মওকুফ নীতি (D-09)', d: 'লিখিত কমিটি সিদ্ধান্ত বাধ্যতামূলক + নিরীক্ষক অ্যালার্ট', v: 'সেট করা', ok: true, go: '#a31' },
    { k: 'nointerest', t: 'সুদ/মুনাফা নিষ্ক্রিয় (D-01)', d: 'এই মডিউলে কোনো সুদ হিসাব হয় না — বন্ধ করা যায় না', v: '🔒 লকড', ok: true, locked: true, go: null }] },
  { g: 'নম্বর ও ফরম্যাট', i: 'file', items: [
    { k: 'patterns', t: 'নম্বর প্যাটার্ন', d: 'সদস্য RSS-YYMM-#### · রসিদ RCP-… · উত্তোলন WR-…', v: '৭টি প্যাটার্ন', ok: true, go: null },
    { k: 'digits', t: 'সংখ্যা পদ্ধতি', d: 'মোবাইলে বাংলা, অ্যাডমিন ও রসিদে দুটোই', v: 'বাংলা + ইংরেজি', ok: true, go: null },
    { k: 'lang', t: 'ভাষা', d: 'বাংলা (প্রধান), ইংরেজি (অ্যাডমিন)', v: '২টি', ok: true, go: null },
    { k: 'print', t: 'রসিদ ও সনদের ছক', d: 'প্রিন্ট মাপ, QR, যাচাই কোডের অবস্থান', v: 'A5 + থার্মাল', ok: true, go: null }] },
  { g: 'অনুমোদন ও নিয়ন্ত্রণ', i: 'shield', items: [
    { k: 'limits', t: 'অনুমোদন সীমা (D-22)', d: 'ACCOUNTANT ৳০ · MANAGER ৳৫০,০০০ · APPROVER ৳২,০০,০০০ · ORG_ADMIN অসীম', v: 'সেট করা', ok: true, go: '#a37' },
    { k: 'flow', t: 'অনুমোদন প্রবাহ (D-34)', d: 'maker ≠ checker বাধ্যতামূলক (BR-04) · এসকেলেশন নিয়ম', v: '২ ধাপ', ok: true, go: '#a20' },
    { k: 'dayclose', t: 'দিন সমাপ্তি (D-17)', d: 'দিন বন্ধ না হলে কাজ চলবে কিন্তু লাল অ্যালার্ট থাকবে', v: 'অ্যালার্টসহ চালু', ok: true, go: '#a28' },
    { k: 'period', t: 'পিরিয়ড লক (R-05)', d: 'বন্ধ মাসে এন্ট্রি নিষিদ্ধ — সংশোধন চলতি মাসে পোস্ট', v: 'সেপ্টেম্বর লকড', ok: true, go: '#a30' },
    { k: 'correction', t: 'সংশোধন নীতি (R-02)', d: 'মুছে ফেলা নয়, রিভার্সাল এন্ট্রি — লগ অপরিবর্তনীয়', v: '🔒 লকড', ok: true, locked: true, go: '#a27' }] },
  { g: 'পেমেন্ট মাধ্যম', i: 'phone', items: [
    { k: 'wallets', t: 'ওয়ালেট', d: 'বিকাশ (মার্চেন্ট) · নগদ — যাচাই ম্যানুয়াল (D-10)', v: '২টি চালু', ok: true, go: '#a29' },
    { k: 'banks', t: 'ব্যাংক খাত', d: 'কৃষি ব্যাংক · সোনালী ব্যাংক', v: '২টি', ok: true, go: '#a29' },
    { k: 'cash', t: 'নগদ সংগ্রহ', d: 'মাঠ সংগ্রহক · অফিস কাউন্টার', v: 'চালু', ok: true, go: '#a28' },
    { k: 'feePolicy', t: 'মাধ্যম ফি কে বহন করে', d: 'ওয়ালেট ক্যাশ-আউট ফি সমিতির ব্যয় — সদস্যের নয়', v: 'সমিতি', ok: true, go: '#a29' }] },
  { g: 'যোগাযোগ', i: 'send', items: [
    { k: 'sms', t: 'SMS প্রদানকারী ও ব্যালেন্স', d: 'অবশিষ্ট ৳৪,১২০ · ৳৩.৫০/SMS', v: 'চালু', ok: true, go: '#a33' },
    { k: 'templates', t: 'বার্তার টেমপ্লেট', d: '৫টি · বাংলা · সংখ্যা বাংলায়', v: '৫টি', ok: true, go: '#a33' },
    { k: 'quiet', t: 'নিরব ঘণ্টা', d: 'রাত ৯টা – সকাল ৮টা বার্তা যাবে না', v: 'চালু', ok: true, go: null },
    { k: 'optout', t: 'বাদ দেওয়ার নীতি', d: 'আইনি নোটিশ বাদ দেওয়া যাবে না', v: '🔒 লকড', ok: true, locked: true, go: '#a33' }] },
  { g: 'নিরাপত্তা ও ডেটা', i: 'lock', items: [
    { k: 'security', t: 'লগইন ও সেশন', d: 'OTP সীমা · সেশন টাইমআউট · ডিভাইস লক', v: 'সেট করা', ok: true, go: '#a37' },
    { k: 'staff', t: 'স্টাফ ও পারমিশন', d: '৬ জন স্টাফ · ২টি আমন্ত্রণ বাকি', v: '২টি বাকি', ok: false, go: '#a37' },
    { k: 'backup', t: 'ব্যাকআপ', d: 'প্রতিদিন রাত ২টা · শেষ সফল ব্যাকআপ আজ', v: 'স্বয়ংক্রিয়', ok: true, go: null },
    { k: 'archive', t: 'আর্কাইভ মেয়াদ (D-30)', d: 'আর্থিক রেকর্ড ৮ বছর · মুছে ফেলা নয়', v: '🔒 ৮ বছর', ok: true, locked: true, go: null },
    { k: 'audit', t: 'অডিট লগ', d: 'অপরিবর্তনীয় · ফিল্টার ও এক্সপোর্ট', v: '৪,১৮২ এন্ট্রি', ok: true, go: '#a38' }] }
];
const SETUP_CHECK = [
  { t: 'সমিতির প্রোফাইল ও নিবন্ধন নম্বর', ok: true },
  { t: 'কমপক্ষে একটি স্কিম চালু', ok: true },
  { t: 'অনুমোদন সীমা নির্ধারণ (D-22)', ok: true },
  { t: 'কমপক্ষে একজন ORG_ADMIN', ok: true },
  { t: 'SMS প্রদানকারী যুক্ত', ok: true },
  { t: 'ব্যাংক/ওয়ালেট খাত যুক্ত', ok: true },
  { t: 'ছুটির ক্যালেন্ডার', ok: true },
  { t: 'রেগুলেটরি রিটার্নের ছক নিশ্চিত (D-29)', ok: false }
];

/* ---------- A-37 · স্টাফ, রোল ও পারমিশন ---------- */
const STAFF = [
  { id: 'u1', name: 'মোঃ আব্দুল্লাহ', role: 'MANAGER', roleBn: 'ম্যানেজার', mobile: '০১৭১১-৪৫৬৭৮৯',
    status: 'active', last: '2026-10-30T08:42', scope: 'সব রুট', limit: 5000000, since: '2024-01-15' },
  { id: 'u2', name: 'সুমি রানী দাস', role: 'ACCOUNTANT', roleBn: 'হিসাবরক্ষক', mobile: '০১৮১৯-২২৩৩৪৪',
    status: 'active', last: '2026-10-30T09:05', scope: 'সব রুট', limit: 0, since: '2024-03-02' },
  { id: 'u3', name: 'রাজু আহমেদ', role: 'COLLECTOR', roleBn: 'মাঠ সংগ্রহক', mobile: '০১৯১১-৫৫৬৬৭৭',
    status: 'active', last: '2026-10-30T07:18', scope: 'R1 · কেশবপুর সদর', limit: 0, since: '2024-06-11' },
  { id: 'u4', name: 'সালমা খাতুন', role: 'COLLECTOR', roleBn: 'মাঠ সংগ্রহক', mobile: '০১৬২২-৮৮৯৯০০',
    status: 'active', last: '2026-10-30T08:02', scope: 'R2 · চন্দ্রপুর', limit: 0, since: '2025-01-08' },
  { id: 'u5', name: 'হাবিবুর রহমান', role: 'COLLECTOR', roleBn: 'মাঠ সংগ্রহক', mobile: '০১৫৩৩-১১২২৩৩',
    status: 'suspended', last: '2026-10-12T16:40', scope: 'R3 · হরিণাকুণ্ডু', limit: 0, since: '2025-05-20',
    note: 'দিনশেষ জমায় ৳১০০ ঘাটতি দুইবার — তদন্ত চলছে (A-28)' },
  { id: 'u6', name: 'কামরুল হাসান', role: 'ORG_ADMIN', roleBn: 'সমিতি প্রশাসক', mobile: '০১৭৪৪-৭৭৮৮৯৯',
    status: 'active', last: '2026-10-29T18:11', scope: 'সব', limit: null, since: '2023-11-01' },
  { id: 'u7', name: 'নাসরিন আক্তার', role: 'APPROVER', roleBn: 'অনুমোদনকারী', mobile: '০১৯৭৭-৩৩৪৪৫৫',
    status: 'invited', last: null, scope: 'সব রুট', limit: 20000000, invitedAt: '2026-10-27',
    note: 'SMS আমন্ত্রণ পাঠানো হয়েছে — গ্রহণের অপেক্ষায়' },
  { id: 'u8', name: 'এস. এম. ফারুক', role: 'EXTERNAL_AUDITOR', roleBn: 'বহিঃনিরীক্ষক', mobile: '০১৭১২-৯৯০০১১',
    status: 'timeboxed', last: '2026-10-28T11:20', scope: 'শুধু পঠন · ১–৩০ নভেম্বর', limit: 0, since: '2026-10-25',
    note: 'সময়সীমাবদ্ধ read-only অ্যাক্সেস — ৩০ নভেম্বর স্বয়ংক্রিয়ভাবে বন্ধ হবে' }
];
const STAFF_STATUS = { active: { t: 'সক্রিয়', c: 'chip-ok', i: 'check' },   /* 'active' নামে কোনো আইকন নেই — ফাঁকা SVG এড়ানো হলো */ suspended: { t: 'নিষ্ক্রিয়', c: 'chip-danger', i: 'freeze' },
  invited: { t: 'আমন্ত্রিত', c: 'chip-warn', i: 'send' }, timeboxed: { t: 'সময়সীমাবদ্ধ', c: 'chip-purple', i: 'clock' } };
/* CRUDA পারমিশন ম্যাট্রিক্স (স্পেক §2.2) — C/U/R/D/A */
const PERM_ROLES = ['ORG_ADMIN', 'MANAGER', 'APPROVER', 'ACCOUNTANT', 'COLLECTOR', 'AUDITOR'];
const PERM_MATRIX = [
  { e: 'সদস্য (member)', c: ['CRUDA', 'CRUA', 'R', 'CRU', 'CR', 'R'] },
  { e: 'স্কিম (scheme)', c: ['CRUDA', 'CRU', 'R', 'R', 'R', 'R'] },
  { e: 'জমা এন্ট্রি (deposit)', c: ['CRUDA', 'CRUA', 'A', 'CRU', 'C', 'R'] },
  { e: 'উত্তোলন (withdrawal)', c: ['CRUDA', 'A', 'A', 'CRU', '—', 'R'] },
  { e: 'সংশোধন/রিভার্সাল', c: ['CRU', 'A', 'A', 'C', '—', 'R'] },
  { e: 'দিন সমাপ্তি', c: ['CRU', 'A', '—', 'CU', 'C', 'R'] },
  { e: 'তহবিল স্থানান্তর', c: ['CRUA', 'A', 'A', 'C', '—', 'R'] },
  { e: 'সেটিংস', c: ['CRU', 'RU', 'R', 'R', '—', 'R'] },
  { e: 'স্টাফ ও পারমিশন', c: ['CRUD', 'R', 'R', '—', '—', 'R'] },
  { e: 'অডিট লগ', c: ['R', 'R (সীমিত)', 'R', '—', '—', 'R'] },
  { e: 'মৃত্যু দাবি', c: ['CRUDA', 'CRU', 'A', 'CU', '—', 'R'] }
];
const LIMIT_MATRIX = [
  { r: 'ACCOUNTANT', amt: 0, note: 'শুধু প্রস্তাব করতে পারেন — অনুমোদন নয় (D-22)' },
  { r: 'COLLECTOR', amt: 0, note: 'এন্ট্রি করে, অনুমোদন নয়' },
  { r: 'MANAGER', amt: 5000000, note: '৳৫০,০০০ পর্যন্ত' },
  { r: 'APPROVER', amt: 20000000, note: '৳২,০০,০০০ পর্যন্ত' },
  { r: 'ORG_ADMIN', amt: null, note: 'সীমা নেই — কিন্তু maker ≠ checker তবুও প্রযোজ্য' }
];
/* D-22-এর একমাত্র উৎস: ভূমিকার অনুমোদন সীমা (paisa)। null = সীমা নেই।
   UI-তে হার্ডকোড না করে সর্বদা roleLimit(role)/tk(roleLimit(role)) ব্যবহার করুন। */
function roleLimit(role) {
  const r = LIMIT_MATRIX.find(x => x.r === role);
  return r ? r.amt : 0;
}
function limitNote(role) {
  if (role === 'COLLECTOR' || role === 'ACCOUNTANT') return 'এন্ট্রি কর্তৃপক্ষ · অনুমোদন সীমা নেই (D-22)';
  const v = roleLimit(role);
  return v === null ? 'সীমা নেই · maker ≠ checker তবুও প্রযোজ্য (D-22)' : 'সীমা ' + tk(v) + ' (D-22)';
}

const ACCESS_LOG = [
  { at: '2026-10-30T08:42', who: 'মোঃ আব্দুল্লাহ', role: 'MANAGER', what: 'লগইন', ip: '103.108.••.••42', dev: 'Chrome · Windows', ok: true },
  { at: '2026-10-30T08:03', who: 'রাজু আহমেদ', role: 'COLLECTOR', what: 'লগইন (অফলাইন → sync)', ip: '—', dev: 'Symphony D80', ok: true },
  { at: '2026-10-29T22:14', who: 'অজ্ঞাত', role: '—', what: 'ভুল পিন ৩ বার', ip: '45.118.••.••7', dev: 'অজানা অ্যান্ড্রয়েড', ok: false, note: 'সুমি রানীর অ্যাকাউন্টে — ১৫ মিনিট লক' },
  { at: '2026-10-28T11:20', who: 'এস. এম. ফারুক', role: 'EXTERNAL_AUDITOR', what: 'লগইন (সময়সীমাবদ্ধ)', ip: '103.95.••.••18', dev: 'Firefox · Linux', ok: true }
];

/* ---------- A-38 · অডিট লগ ---------- */
const AUDIT_LOG = [
  { id: 'al1', at: '2026-10-30T09:12:44', who: 'সুমি রানী দাস', role: 'ACCOUNTANT', action: 'update', actionBn: 'সম্পাদনা',
    entity: 'scheme', entityBn: 'স্কিম', ref: 'sc2', refLabel: 'মাসিক সাধারণ সঞ্চয়', result: 'success',
    before: 'সর্বনিম্ন ব্যালেন্স ৳৩০০', after: 'সর্বনিম্ন ব্যালেন্স ৳৫০০', ip: '103.108.••.••44', dev: 'Chrome · Windows' },
  { id: 'al2', at: '2026-10-30T08:57:02', who: 'মোঃ আব্দুল্লাহ', role: 'MANAGER', action: 'approve', actionBn: 'অনুমোদন',
    entity: 'withdrawal', entityBn: 'উত্তোলন', ref: 'WR-2627-0212', refLabel: '৳৫,০০০ · আব্দুল করিম', result: 'success',
    before: 'pending_approval', after: 'approved', ip: '103.108.••.••42', dev: 'Chrome · Windows', link: '#a23' },
  { id: 'al3', at: '2026-10-30T08:41:19', who: 'রাজু আহমেদ', role: 'COLLECTOR', action: 'create', actionBn: 'তৈরি',
    entity: 'deposit', entityBn: 'জমা', ref: 'RCP-2627-1531', refLabel: '৳৫০০ · মর্জিনা বেগম (অফলাইন)', result: 'success',
    before: '—', after: 'posted ৳৫০০', ip: '—', dev: 'Symphony D80', link: '#a17', tag: 'অফলাইন → sync' },
  { id: 'al4', at: '2026-10-29T17:22:08', who: 'মোঃ আব্দুল্লাহ', role: 'MANAGER', action: 'reject', actionBn: 'প্রত্যাখ্যান',
    entity: 'correction', entityBn: 'সংশোধন', ref: 'cr3', refLabel: 'তারিখ সংশোধনের অনুরোধ', result: 'success',
    before: 'pending', after: 'rejected', ip: '103.108.••.••42', dev: 'Chrome · Windows', link: '#a27',
    note: 'সেপ্টেম্বর পিরিয়ড লকড (R-05)' },
  { id: 'al5', at: '2026-10-29T16:04:55', who: 'সুমি রানী দাস', role: 'ACCOUNTANT', action: 'export', actionBn: 'এক্সপোর্ট',
    entity: 'report', entityBn: 'রিপোর্ট', ref: 'F-02', refLabel: 'আর্থিক সারাংশ (Excel)', result: 'failed',
    before: '—', after: '—', ip: '103.108.••.••44', dev: 'Chrome · Windows', link: '#a34',
    note: 'সার্ভার টাইমআউট — ব্যাকগ্রাউন্ড জবে নেওয়া হয়েছে' },
  { id: 'al6', at: '2026-10-29T11:38:12', who: 'কামরুল হাসান', role: 'ORG_ADMIN', action: 'update', actionBn: 'সম্পাদনা',
    entity: 'settings', entityBn: 'সেটিংস', ref: 'limits', refLabel: 'অনুমোদন সীমা', result: 'success',
    before: 'APPROVER ৳১,০০,০০০', after: 'APPROVER ৳২,০০,০০০', ip: '103.95.••.••90', dev: 'Chrome · macOS', link: '#a37' },
  { id: 'al7', at: '2026-10-28T22:14:03', who: 'অজ্ঞাত', role: '—', action: 'login', actionBn: 'লগইন চেষ্টা',
    entity: 'user', entityBn: 'ব্যবহারকারী', ref: 'u2', refLabel: 'সুমি রানী দাস', result: 'failed',
    before: '—', after: 'ভুল পিন ৩ বার → ১৫ মিনিট লক', ip: '45.118.••.••7', dev: 'অজানা অ্যান্ড্রয়েড', link: '#a37',
    alert: 'নিরাপত্তা অ্যালার্ট' },
  { id: 'al8', at: '2026-10-28T15:47:31', who: 'মোঃ আব্দুল্লাহ', role: 'MANAGER', action: 'approve', actionBn: 'মওকুফ অনুমোদন',
    entity: 'waiver', entityBn: 'বকেয়া মওকুফ', ref: 'WV-2627-0007', refLabel: '৳১,৩২০ · কমিটি সিদ্ধান্ত ০৭/২০২৬', result: 'success',
    before: 'বকেয়া ৳১,৩২০', after: 'মওকুফ (D-09)', ip: '103.108.••.••42', dev: 'Chrome · Windows', link: '#a31',
    note: 'নিরীক্ষককে স্বয়ংক্রিয় অ্যালার্ট পাঠানো হয়েছে' },
  { id: 'al9', at: '2026-10-28T10:02:44', who: 'হাবিবুর রহমান', role: 'COLLECTOR', action: 'create', actionBn: 'দিনশেষ জমা',
    entity: 'cash_day', entityBn: 'ক্যাশ দিন', ref: '2026-10-28', refLabel: 'সংগৃহীত ৳৪,৮৬০ · গণনা ৳৪,৭৬০', result: 'success',
    before: '—', after: 'পার্থক্য −৳১০০ (কারণ লেখা)', ip: '—', dev: 'Symphony Z60', link: '#a28', alert: 'নগদ পার্থক্য' },
  { id: 'al10', at: '2026-10-27T13:19:57', who: 'কামরুল হাসান', role: 'ORG_ADMIN', action: 'update', actionBn: 'ভূমিকা বরাদ্দ',
    entity: 'user', entityBn: 'স্টাফ', ref: 'u7', refLabel: 'নাসরিন আক্তার', result: 'success',
    before: '—', after: 'APPROVER · সীমা ৳২,০০,০০০', ip: '103.95.••.••90', dev: 'Chrome · macOS', link: '#a37' }
];
const AUDIT_ACTIONS = { create: { t: 'তৈরি', c: 'chip-info', i: 'plus' }, update: { t: 'সম্পাদনা', c: 'chip-warn', i: 'edit' },
  approve: { t: 'অনুমোদন', c: 'chip-ok', i: 'checkc' }, reject: { t: 'প্রত্যাখ্যান', c: 'chip-danger', i: 'xc' },
  export: { t: 'এক্সপোর্ট', c: 'chip-purple', i: 'download' }, login: { t: 'লগইন', c: 'chip-neutral', i: 'logout' },
  reverse: { t: 'রিভার্সাল', c: 'chip-danger', i: 'refresh' }, delete: { t: 'soft-delete', c: 'chip-neutral', i: 'trash' } };
const AUDIT_TOTAL = 4182;
const AUDIT_RETENTION = { years: 8, note: 'D-30 · লগ অপরিবর্তনীয় — কোনো ভূমিকায় মুছে ফেলার বা বদলানোর UI নেই', oldest: '2018-11-04' };

/* ---------- S-04 · নোটিফিকেশন সেটিংস ---------- */
const NOTIF_CATS = [
  { k: 'txn', t: 'লেনদেন', i: 'history', d: 'জমা, উত্তোলন, সংশোধন, রিভার্সাল',
    ch: { sms: true, push: true, inapp: true }, locked: ['sms'], lockWhy: 'রসিদের ডিজিটাল প্রমাণ — সমিতির নিয়মে বাধ্যতামূলক' },
  { k: 'dues', t: 'বকেয়া ও কিস্তি', i: 'warn', d: 'কিস্তির ৩ দিন আগে, গ্রেস শেষ, dormant নোটিশ',
    ch: { sms: true, push: true, inapp: true }, locked: ['sms'], lockWhy: 'D-07 গ্রেস ও dormant নোটিশ আইনত পাঠাতে হয়' },
  { k: 'app', t: 'আবেদন ও অনুমোদন', i: 'checkc', d: 'নামভর্তি, উত্তোলন আবেদন, সিদ্ধান্তের ফলাফল',
    ch: { sms: false, push: true, inapp: true }, locked: [], lockWhy: null },
  { k: 'notice', t: 'ঘোষণা', i: 'bell', d: 'সভা, ছুটি, নতুন স্কিম, নোটিশ বোর্ড',
    ch: { sms: false, push: true, inapp: true }, locked: [], lockWhy: null },
  { k: 'security', t: 'নিরাপত্তা', i: 'shield', d: 'নতুন লগইন, পিন পরিবর্তন, মোবাইল বদল',
    ch: { sms: true, push: true, inapp: true }, locked: ['sms', 'push', 'inapp'], lockWhy: 'সব চ্যানেল বাধ্যতামূলক — বন্ধ করা যাবে না' },
  { k: 'marketing', t: 'প্রচারণা', i: 'sparkle', d: 'নতুন স্কিমের আমন্ত্রণ, উৎসবের বার্তা',
    ch: { sms: false, push: false, inapp: true }, locked: [], lockWhy: null }
];
const NOTIF_QUIET = { on: true, from: '21:00', to: '08:00', note: 'নিরব ঘণ্টায় শুধু নিরাপত্তা ও আইনি নোটিশ যাবে' };

/* ============================================================
   ADMIN MOBILE (App layer) — role-based shells (D-35)
   একই ANAV, একই ডেটা, একই নিয়ম; শুধু ৩৯০px-এর নেভিগেশন রূপ।
   ============================================================ */
const ADMIN_SHELLS = {
  /* ৫ স্লটের চুক্তি: ৪টি নেভ + কেন্দ্রীয় FAB (Shell-A/B/C/D), Shell-E-তে ৫টি নেভ (শুধু পঠন, FAB নেই)।
     সদস্য অ্যাপের MNAV-এর সাথে একই গ্রিড — .bottomnav = repeat(5,1fr)। বাকি সব ড্রয়ারে। */
  COLLECTOR: { code: 'Shell-A', role: 'COLLECTOR', nameBn: 'মাঠ', roleBn: 'মাঠ সংগ্রহক', fab: { k: 'entry', l: 'জমা এন্ট্রি', i: 'plus', go: '#am06' },
    nav: [
      { k: 'today', l: 'আজকের রুট', i: 'route', go: '#am04' },
      { k: 'dues', l: 'বকেয়া', i: 'warn', go: '#am12' },
      { k: 'dayclose', l: 'দিনশেষ', i: 'cash', go: '#am15' },
      { k: 'more', l: 'আরও', i: 'grid', go: '#s03' }] },
  ACCOUNTANT: { code: 'Shell-B', role: 'ACCOUNTANT', nameBn: 'হিসাব', roleBn: 'হিসাবরক্ষক', fab: { k: 'entry', l: 'এন্ট্রি', i: 'plus', go: '#am06' },
    nav: [
      { k: 'home', l: 'হোম', i: 'home', go: '#am01' },
      { k: 'queue', l: 'কিউ', i: 'checkc', go: '#am02', cnt: 10 },
      { k: 'cash', l: 'ক্যাশ', i: 'cash', go: '#am15' },
      { k: 'more', l: 'আরও', i: 'grid', go: '#s03' }] },
  MANAGER: { code: 'Shell-C', role: 'MANAGER', nameBn: 'অনুমোদন', roleBn: 'ব্যবস্থাপক', fab: { k: 'entry', l: 'দ্রুত এন্ট্রি', i: 'plus', go: '#am06' },
    nav: [
      { k: 'home', l: 'হোম', i: 'home', go: '#am01' },
      { k: 'approve', l: 'অনুমোদন', i: 'checkc', go: '#am02', cnt: 10 },
      { k: 'alert', l: 'অ্যালার্ট', i: 'bell', go: '#m16', cnt: 3 },
      { k: 'more', l: 'আরও', i: 'grid', go: '#s03' }] },
  APPROVER: { code: 'Shell-C', role: 'APPROVER', nameBn: 'অনুমোদন', roleBn: 'অনুমোদনকারী কর্তৃপক্ষ', fab: null,
    nav: [
      { k: 'home', l: 'হোম', i: 'home', go: '#am01' },
      { k: 'approve', l: 'অনুমোদন', i: 'checkc', go: '#am02', cnt: 4 },
      { k: 'member', l: 'সদস্য', i: 'users', go: '#am04' },
      { k: 'alert', l: 'অ্যালার্ট', i: 'bell', go: '#m16', cnt: 3 },
      { k: 'more', l: 'আরও', i: 'grid', go: '#s03' }] },
  ORG_ADMIN: { code: 'Shell-D', role: 'ORG_ADMIN', nameBn: 'প্রশাসন', roleBn: 'সমিতি প্রশাসক', fab: null,
    nav: [
      { k: 'home', l: 'হোম', i: 'home', go: '#am01' },
      { k: 'approve', l: 'অনুমোদন', i: 'checkc', go: '#am02', cnt: 10 },
      { k: 'control', l: 'নিয়ন্ত্রণ', i: 'shield', go: '#am21', cnt: 4 },
      { k: 'staff', l: 'স্টাফ', i: 'users', go: '#am34' },
      { k: 'more', l: 'আরও', i: 'grid', go: '#s03' }] },
  AUDITOR: { code: 'Shell-E', role: 'AUDITOR', nameBn: 'পর্যবেক্ষণ', roleBn: 'নিরীক্ষক (শুধু পঠন)', fab: null, readOnly: true,
    nav: [
      { k: 'summary', l: 'সারাংশ', i: 'chart', go: '#am24' },
      { k: 'reports', l: 'রিপোর্ট', i: 'file', go: '#am25' },
      { k: 'audit', l: 'অডিট লগ', i: 'audit', go: '#am35' },
      { k: 'alert', l: 'অ্যালার্ট', i: 'bell', go: '#m16', cnt: 3 },
      { k: 'more', l: 'আরও', i: 'grid', go: '#s03' }] }
};
ADMIN_SHELLS.EXTERNAL_AUDITOR = ADMIN_SHELLS.AUDITOR;
ADMIN_SHELLS.VIEWER = ADMIN_SHELLS.AUDITOR;

/* ড্রয়ারে সব ANAV আইটেমই থাকবে — বটম নেভ শুধু রোলের শীর্ষ ৫টি */
function drawerFor(role) { return role && ADMIN_SHELLS[role] ? role : 'MANAGER'; }

/* AM স্ক্রিন → ANAV কী: হ্যামবার্গার ড্রয়ারে ঠিক কোন আইটেম আলোকিত হবে তা নির্ধারণ করে।
   (ড্রয়ারের আইটেম ডেস্কটপ স্ক্রিনে যায়, তাই শুধু #amNN মিলিয়ে হাইলাইট করা যেত না।) */
const AMNAV_SCREEN = {
  am01: 'dash', am02: 'wdappr', am03: 'wdappr', am04: 'member', am05: 'member', am06: 'deposit',
  am07: 'member', am08: 'depappr', am09: 'member', am10: 'ledger', am11: 'claim', am12: 'dues',
  am13: 'txn', am14: 'corr', am15: 'cash', am16: 'wdappr', am17: 'ledger', am18: 'status', am19: 'claim',
  am20: 'transfer', am21: 'recon', am22: 'batch', am23: 'batch', am24: 'fin', am25: 'reports', am26: 'scheme',
  am27: 'scheme', am28: 'scheme', am29: 'scheme', am30: 'mv', am31: 'plan', am32: 'remind',
  am33: 'settings', am34: 'staff', am35: 'audit',
  /* ROSCA (মডিউল ২) — ANAV-এর 'ROSCA চক্র' গ্রুপের কী */
  am36: 'rcdash', am37: 'rcscheme', am38: 'rcscheme', am39: 'rccircle', am40: 'rccircle', am41: 'rccircle',
  am42: 'rcdraw', am43: 'rcdraw', am44: 'rcdraw', am45: 'rccollect', am46: 'rcdefault', am47: 'rcreport',
  /* Joint Goal (মডিউল ৩) — ANAV-এর 'যৌথ লক্ষ্য' গ্রুপের কী */
  am48: 'jgdash', am49: 'jggoal', am50: 'jggoal', am51: 'jggoal', am52: 'jgjoin',
  am53: 'jgcollect', am54: 'jgmile', am55: 'jgspend', am56: 'jgspend', am57: 'jgreport',
  /* Qard Hasanah (মডিউল ৪) — ANAV-এর 'কর্জে হাসানা' গ্রুপের কী */
  am58: 'qhdash', am59: 'qhproduct', am60: 'qhproduct', am61: 'qhsim', am62: 'qhelig',
  am63: 'qhwindow', am64: 'qhqueue', am65: 'qhqueue', am66: 'qhqueue', am67: 'qhdisb',
  am68: 'qhloan', am69: 'qhloan', am70: 'qhloan', am71: 'qharrears', am72: 'qhreport',
  am73: 'qharrears', am74: 'qhreport'
};

const MNAV = [
  { k: 'home', l: 'হোম', i: 'home', go: '#m01' },
  { k: 'savings', l: 'সঞ্চয়', i: 'wallet', go: '#m04' },
  { k: 'deposit', l: 'জমা দিন', i: 'plus', fab: true, go: '#m06' },
  { k: 'txn', l: 'লেনদেন', i: 'history', go: '#m08' },
  { k: 'more', l: 'আরও', i: 'grid', go: '#m18' },
];
function bottomNav(active) {
  return `<div class="bottomnav">${MNAV.map(n => n.fab
    ? `<button class="bnv bnv-fab ${active === n.k ? 'on' : ''}" onclick="go('${n.go}')"><span class="fab">${ic(n.i)}</span><span>${n.l}</span></button>`
    : `<button class="bnv ${active === n.k ? 'on' : ''}" onclick="go('${n.go}')">${ic(n.i)}<span>${n.l}</span></button>`).join('')}</div>`;
}
function statusBar(light) {
  return `<div class="statusbar ${light ? 'light' : ''}"><span>${bn('9:41')}</span><span class="sig">▮▮▮ ◗ ${bn('84')}%</span></div>`;
}

/* ---------- admin sidebar ---------- */
const ANAV = [
  { g: 'ওভারভিউ', items: [
    { k: 'dash', l: 'ড্যাশবোর্ড', i: 'grid', go: '#a01', cnt: null },
  ]},
  { g: 'সঞ্চয় পরিচালনা', items: [
    { k: 'scheme', l: 'স্কিম', i: 'book2', go: '#a03' },
    { k: 'member', l: 'সদস্য', i: 'users', go: '#a07', cnt: 3 },
    { k: 'deposit', l: 'জমা রেকর্ড', i: 'down', go: '#a17' },
    { k: 'depappr', l: 'জমা অনুমোদন', i: 'checkc', go: '#a20', cnt: 4 },
    { k: 'wdappr', l: 'উত্তোলন অনুমোদন', i: 'up', go: '#a22', cnt: 6 },
    { k: 'ledger', l: 'লেনদেন / খতিয়ান', i: 'book', go: '#a25' },
  ]},
  { g: 'ROSCA চক্র', items: [
    { k: 'rcdash', l: 'ROSCA ড্যাশবোর্ড', i: 'history', go: '#a39' },
    { k: 'rcscheme', l: 'চক্র স্কিম', i: 'book2', go: '#a40' },
    { k: 'rccircle', l: 'সক্রিয় চক্র', i: 'users', go: '#a42', cnt: 4 },
    { k: 'rcdraw', l: 'ড্র ক্যালেন্ডার ও ক্রম', i: 'cal', go: '#a45' },
    { k: 'rccollect', l: 'কিস্তি সংগ্রহ ও বকেয়া', i: 'down', go: '#a48', cnt: 2 },
    { k: 'rcdefault', l: 'ডিফল্ট ও প্রতিস্থাপন', i: 'warn', go: '#a49', cnt: 2, soft: true },
    { k: 'rcreport', l: 'ROSCA রিপোর্ট', i: 'chart', go: '#a50' },
  ]},
  { g: 'যৌথ লক্ষ্য', items: [
    { k: 'jgdash', l: 'Joint Goal ড্যাশবোর্ড', i: 'target', go: '#a51' },
    { k: 'jggoal', l: 'লক্ষ্য তালিকা', i: 'flag', go: '#a52', cnt: 4 },
    { k: 'jgjoin', l: 'অংশগ্রহণ ও যোগদান', i: 'users', go: '#a55', cnt: 3 },
    { k: 'jgcollect', l: 'অবদান সংগ্রহ ও বকেয়া', i: 'down', go: '#a56', cnt: 4, soft: true },
    { k: 'jgmile', l: 'মাইলস্টোন ও অগ্রগতি', i: 'chart', go: '#a57' },
    { k: 'jgspend', l: 'অর্থ ব্যবহার ও নিষ্পত্তি', i: 'cash', go: '#a58', cnt: 2 },
    { k: 'jgreport', l: 'Joint Goal রিপোর্ট', i: 'book', go: '#a60' },
  ]},
  { g: 'কর্জে হাসানা', items: [
    { k: 'qhdash', l: 'QH ড্যাশবোর্ড', i: 'heart', go: '#a61' },
    { k: 'qhproduct', l: 'পণ্য ও যোগ্যতা নিয়ম', i: 'book2', go: '#a62', cnt: null },
    { k: 'qhsim', l: 'নিয়ম Simulation ⚠️D-57', i: 'chart', go: '#a64' },
    { k: 'qhelig', l: 'যোগ্য সদস্য তালিকা', i: 'users', go: '#a65', cnt: 4 },
    { k: 'qhwindow', l: 'জানালা ও কোটা ⚠️D-51', i: 'cal', go: '#a66' },
    { k: 'qhqueue', l: 'আবেদন কিউ ও সিদ্ধান্ত', i: 'file', go: '#a67', cnt: 3 },
    { k: 'qhdisb', l: 'বিতরণ (maker ≠ checker)', i: 'cash', go: '#a70', cnt: 1 },
    { k: 'qhloan', l: 'ঋণ, ছক ও পরিশোধ', i: 'scale', go: '#a72', cnt: 5 },
    { k: 'qharrears', l: 'বকেয়া ও write-off', i: 'warn', go: '#a74', cnt: 2, soft: true },
    { k: 'qhreport', l: 'QH রিপোর্ট ও সমাপ্তি', i: 'book', go: '#a77' },
  ]},
  { g: 'মাঠ সংগ্রহ', items: [
    { k: 'route', l: 'আজকের রুট (সংগ্রহক)', i: 'route', go: '#a02' },
    { k: 'plan', l: 'সংগ্রহ পরিকল্পনা', i: 'target', go: '#a32' },
    { k: 'batch', l: 'বাল্ক জমা ও ইমপোর্ট', i: 'grid', go: '#a18' },
  ]},
  { g: 'নিয়ন্ত্রণ', items: [
    { k: 'dues', l: 'বকেয়া রেজিস্টার', i: 'warn', go: '#a31', cnt: 23, soft: true },
    { k: 'cash', l: 'ক্যাশ বুক ও দিন সমাপ্তি', i: 'cash', go: '#a28', cnt: 1, soft: true },
    { k: 'transfer', l: 'তহবিল স্থানান্তর', i: 'refresh', go: '#a29' },
    { k: 'recon', l: 'রিকনসিলিয়েশন', i: 'scale', go: '#a30', cnt: 4, soft: true },
    { k: 'txn', l: 'লেনদেন বিবরণ / অডিট', i: 'audit', go: '#a26' },
    { k: 'corr', l: 'সংশোধন ও রিভার্সাল', i: 'edit', go: '#a27', cnt: 1, soft: true },
  ]},
  { g: 'সদস্য ও দাবি', items: [
    { k: 'status', l: 'অবস্থা পরিবর্তন', i: 'flag', go: '#a12' },
    { k: 'claim', l: 'নমিনি ও মৃত্যু দাবি', i: 'heart', go: '#a14', cnt: 2, soft: true },
    { k: 'mv', l: 'সদস্য স্থানান্তর', i: 'route', go: '#a16' },
    { k: 'remind', l: 'রিমাইন্ডার শিডিউল', i: 'send', go: '#a33' },
  ]},
  { g: 'ব্যবস্থাপনা', items: [
    { k: 'reports', l: 'রিপোর্ট কেন্দ্র', i: 'chart', go: '#a34' },
    { k: 'fin', l: 'আর্থিক বিবরণ ও রিটার্ন', i: 'book', go: '#a35' },
    { k: 'staff', l: 'স্টাফ ও পারমিশন', i: 'shield', go: '#a37', cnt: 2, soft: true },
    { k: 'settings', l: 'সেটিংস', i: 'settings', go: '#a36' },
    { k: 'audit', l: 'অডিট লগ', i: 'audit', go: '#a38' },
  ]},
];
/* ---- Live Workspace ওভাররাইড (অ্যাডিটিভ) ------------------------------------
   window.__WS_WEB = { name, roleBn, limitText, ro } সেট থাকলে সাইডবারের ফুটার সেই স্টাফ দেখায়;
   সেট না থাকলে বিদ্যমান ডিফল্ট (মোঃ আব্দুল্লাহ · ম্যানেজার) অপরিবর্তিত থাকে।            */
function wsWebWho() {
  const w = (typeof window !== 'undefined' && window.__WS_WEB) ? window.__WS_WEB : null;
  if (w && w.name) return w;
  return { name: 'মোঃ আব্দুল্লাহ', roleBn: 'ম্যানেজার', limitText: tk(5000000), ro: false };
}
function sidebar(active) {
  const who = wsWebWho();
  return `<aside class="sidebar">
    <div class="sb-brand"><div class="avatar">র</div><div><b>${ORG.name}</b><i>${ORG.reg}</i></div></div>
    ${ANAV.map(g => `<div class="sb-group">${g.g}</div>${g.items.map(i => `
      <div class="sb-item ${active === i.k ? 'on' : ''}" onclick="go('${i.go}')">${ic(i.i)}<span>${i.l}</span>
        ${i.cnt ? `<span class="cnt ${i.soft ? 'soft' : ''}">${bn(i.cnt)}</span>` : ''}</div>`).join('')}`).join('')}
    <div class="sb-foot">
      <div class="hrow" style="gap:8px"><div class="avatar sm ghost">${who.name.charAt(0)}</div><div style="min-width:0"><b style="color:#DCEDE6;font-size:12.5px;display:block">${who.name}</b><i style="font-style:normal;font-size:11px;color:#7C9A8E">${who.roleBn}${who.ro ? ' · শুধু পঠন' : ''} · সীমা ${who.limitText}</i></div></div>
    </div>
  </aside>`;
}
function adminTop(title, crumb, right) {
  return `<div class="admin-top"><div class="grow"><h1>${title}</h1>${crumb ? `<div class="crumb">${crumb}</div>` : ''}</div>
    <div class="hrow" style="gap:9px">${right || ''}</div></div>`;
}

/* ---------- navigation helper ---------- */
function go(sel) {
  if (!sel) return;
  const [file, anchor] = sel.startsWith('#') ? [null, sel] : sel.split('#');
  if (file) { location.href = sel; return; }
  const el = document.querySelector(anchor);
  if (!el) { notBuilt(anchor.replace('#', '').toUpperCase()); return; }
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
}
/* screens that exist in the 67-page inventory but are not part of the
   Phase 1A/1B design cut — tell the reviewer instead of failing silently */
function notBuilt(code) {
  if (typeof document === 'undefined' || !document.body) return;
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div'); t.id = 'toast'; t.className = 'toast';
    document.body.appendChild(t);
  }
  t.innerHTML = `${ic('info')} <b>${code}</b> এই আইটেমটি একটি <b>সাব-প্যানেল</b> — ৬৭টি পেজের ডিজাইন সম্পূর্ণ, তাই এটি আলাদা স্ক্রিন হিসেবে নেই (D-34)। সংশ্লিষ্ট হাব পেজে বিভাগটি দেখানো আছে।`;
  t.classList.add('on');
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), 3400);
}
function goto(file, anchor) { location.href = file + anchor; }

/* ---------- shared bits ---------- */
function defChip(code) { return `<span class="tg def">ডিফল্ট · ${code}</span>`; }
function staleNote() { return `<span class="stale">${ic('clock', 'sm')} সর্বশেষ হালনাগাদ: ${bn('9:41')} · আজ ${dstr(TODAY)}</span>`; }

/* ---------- receipt template (P-08: reused in M-07, M-09, M-14, A-17, A-21, A-24, S-07) ---------- */
function receiptBlock(o) {
  return `<div class="receipt">
    <div class="rc-h">
      <div class="hrow" style="justify-content:center;gap:9px"><div class="avatar sm">র</div>
        <div class="t-c"><div class="org">${ORG.name}</div>
        <div class="sub">নিবন্ধন নং ${ORG.reg} · ${ORG.area}<br>সমবায় সমিতি বিধিমালা ২০০৪ (সংশোধিত ২০২০) অনুযায়ী নিবন্ধিত</div></div></div>
      <div class="chip chip-ok chip-lg mt-12">${ic('checkc')} ${o.title || 'সঞ্চয় জমা গ্রহণ করা হয়েছে'}</div>
    </div>
    <div class="rc-big"><div class="amt amt-hero">${tk(o.amount)}</div><div class="w">${words(o.amount)} মাত্র</div>
      <div class="amt-alt mt-4">${tkEn(o.amount)}</div></div>
    <div class="rc-rows">
      ${(o.rows || []).map(r => `<div class="rc-r"><i>${r[0]}</i><b>${r[1]}</b></div>`).join('')}
    </div>
    <div class="rc-qr"><div class="qr"></div>
      <div class="rc-verify"><b>${o.code}</b>
        এই রসিদের সত্যতা যাচাই করুন — somobay.app/v/${o.code} অথবা QR স্ক্যান করুন।
        লগইন ছাড়াই যে কেউ যাচাই করতে পারবেন (S-07)।</div></div>
    <div class="rc-f">${o.foot || 'এটি ডিজিটাল রসিদ — প্রিন্ট করা বৈধ। কোনো সুদ বা মুনাফা অন্তর্ভুক্ত নয়।'}</div>
  </div>`;
}

/* ---------- shared render helpers (used by both prototype pages) ---------- */
function brkRow(label, hint, val, cls, why) {
  return `<div class="brk-r ${cls || ''}">
    <div class="lbl"><b>${label}</b>${hint ? `<i>${hint}</i>` : ''}</div>
    ${why ? `<span class="why" title="${why}">?</span>` : ''}
    <span class="v">${val}</span></div>`;
}

function txRow(t) {
  const isIn = t.type === 'deposit';
  const st = DEP_STATUS[t.status] || WD_STATUS[t.status] || { t: t.status, c: 'chip-neutral', i: 'info' };
  const a = acc(t.accId);
  return `<div class="row" onclick="go('#m09')">
    <div class="txi ${isIn ? 'in' : 'out'}">${ic(isIn ? 'down' : 'up')}</div>
    <div class="row-tx"><b>${isIn ? 'সঞ্চয় জমা' : t.type === 'withdrawal' ? 'উত্তোলন' : t.type === 'fee' ? 'বার্ষিক ফি' : 'সংশোধন'}</b>
      <i>${dstr(t.date)} · ${(channel[t.channel] || {}).t || ''}${t.by && t.by !== '—' ? ' · ' + t.by : ''}</i>
      <div class="meta">${CHIP(DEP_STATUS, t.status === 'posted' ? 'posted' : t.status)}${t.receipt ? `<span class="fs-xs mut2">${t.receipt}</span>` : ''}</div></div>
    <div class="row-amt"><div class="amt amt-body ${isIn ? 'amt-pos' : 'amt-neg'}">${isIn ? '+' : '−'}${tk(t.amount)}</div>
      <div class="amt-alt">${tkEn(t.amount)}</div></div>
    <span class="row-chev">${ic('chev','sm')}</span></div>`;
}

function accCard(a) {
  const s = scheme(a.schemeId), b = balanceBreakdown(a), st = ACC_STATUS[a.status];
  const prog = s.tenure ? Math.round(a.paidInstallments / s.tenure * 100) : Math.min(100, Math.round(a.paidInstallments / 24 * 100));
  return `<div class="acc ${a.status}" onclick="go('#m05')">
    <div class="acc-top">
      <div class="txi ${a.status === 'frozen' ? 'hold' : a.status === 'matured' ? 'lime' : 'in'}">${ic(s.type === 'daily' ? 'cal' : s.type === 'term' ? 'lock' : 'wallet')}</div>
      <div class="acc-scheme"><b>${s.name}</b><i>${a.no} · খোলা ${dshort(a.opened)}</i></div>
      <span class="chip ${st.c}">${ic(st.i)}${st.t}</span>
    </div>
    ${a.status === 'frozen' ? `<div class="alert alert-danger mt-12" style="padding:10px 12px;font-size:12.8px">${ic('freeze','sm')}<div><b>উত্তোলন স্থগিত</b>${a.frozenReason}</div></div>` : ''}
    ${a.status === 'matured' ? `<div class="alert alert-ok mt-12" style="padding:10px 12px;font-size:12.8px">${ic('star','sm')}<div><b>মেয়াদ পূর্ণ — পুরো টাকা তোলা যাবে</b>সর্বনিম্ন ব্যালেন্সের নিয়ম এখন প্রযোজ্য নয় (D-02 ডিফল্ট)</div></div>` : ''}
    <div class="acc-bal">
      <div class="l"><i>বর্তমান ব্যালেন্স</i><div class="amt amt-h1">${tk(a.posted)}</div><div class="amt-alt">${tkEn(a.posted)}</div></div>
      <div class="r"><i>এখন তোলা যাবে</i><div class="amt amt-h2 ${b.avail === 0 ? 'amt-mut' : ''}">${tk(b.avail)}</div>
        ${a.pending ? `<div class="chip chip-warn" style="margin-top:6px">${ic('clock')}+${tk(a.pending)} যাচাই বাকি</div>` : ''}</div>
    </div>
    <div class="acc-prog">
      <div class="prog ${a.status === 'frozen' ? 'danger' : ''}"><i style="width:${prog}%"></i></div>
      <div class="prog-meta"><span>${s.tenure ? `কিস্তি ${bn(a.paidInstallments)}/${bn(s.tenure)}` : `${bn(a.paidInstallments)}টি কিস্তি জমা`}</span>
        <span>${bn(prog)}%</span></div>
    </div>
    <div class="acc-acts">
      <button class="btn btn-primary btn-sm grow" onclick="event.stopPropagation();go('#m06')">${ic('down','sm')} জমা দিন</button>
      <button class="btn btn-ghost btn-sm grow ${b.avail === 0 ? 'dis' : ''}" onclick="event.stopPropagation();go('#m10')">${ic('up','sm')} টাকা তুলুন</button>
      <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();go('#m08')">${ic('history','sm')}</button>
    </div>
  </div>`;
}


/* ============================================================
   ROSCA (মডিউল ২) — মক ডেটা ও হেল্পার
   এন্টিটি: rosca_schemes · rosca_circles · rosca_seats · rosca_draws · rosca_draw_pool · rosca_defaults
   উৎস: specs/03 §৪.১ (এন্টিটি), §৮.২ (পেজ RA-01…RA-12 · RM-01…RM-06), §৬.২-খ (Admin নিয়ন্ত্রণ)
   নিয়ম: ড্র অপরিবর্তনীয় (R-02/R-05) · maker≠checker (BR-04) · রসিদ নম্বর পুনর্ব্যবহার নয় (BR-08)
        · অফলাইন কিস্তিতে idempotency_key (BR-03) · কোনো সুদ/মুনাফা নেই (BR-13)
   অমীমাংসিত: ⚠️D-12 (পেআউট সঞ্চয় অ্যাকাউন্টে) · D-38 (তহবিল খাত) · D-41 (বিলম্ব ফি)
             · D-42 (ড্র পদ্ধতি) · D-46 (ডিফল্ট প্রতিকার) · D-48 (এক সদস্যের সর্বোচ্চ চক্র)
   ============================================================ */
const RC_METHOD = {
  lottery: { t: 'লটারি', c: 'chip-info', i: 'star' },
  fixed:   { t: 'পূর্বনির্ধারিত ক্রম', c: 'chip-neutral', i: 'sort' },
  admin:   { t: 'Admin-নির্ধারিত ⚠️D-42', c: 'chip-warn', i: 'shield' },
};
const RC_STATUS = {
  forming:   { t: 'গঠন চলছে', c: 'chip-info', i: 'clock' },
  active:    { t: 'চলমান', c: 'chip-ok', i: 'refresh' },
  risk:      { t: 'ডিফল্ট ঝুঁকি', c: 'chip-warn', i: 'warn' },
  completed: { t: 'সমাপ্ত ও নিষ্পত্তি', c: 'chip-neutral', i: 'check' },
  blocked:   { t: 'সমাপ্তি আটকে', c: 'chip-danger', i: 'lock' },
  archived:  { t: 'আর্কাইভড (নতুন ভর্তি বন্ধ)', c: 'chip-neutral', i: 'freeze' },
}
/* ডিফল্ট কেসের অবস্থা ও ধাপ (RA-11 / RAM-11) */
const RC_DEF = {
  open:                { t: 'খোলা', c: 'chip-warn', i: 'warn' },
  'pending-committee': { t: 'কমিটিতে অনুমোদনের অপেক্ষায়', c: 'chip-info', i: 'users' },
  resolved:            { t: 'নিষ্পত্তি হয়েছে', c: 'chip-neutral', i: 'check' },
};
const RC_STEP_CHIP = {
  warn:     { t: 'ধাপ ১ · সতর্কতা নোটিশ', c: 'chip-info', i: 'bell' },
  late_fee: { t: 'ধাপ ২ · বিলম্ব ফি ⚠️D-41', c: 'chip-warn', i: 'clock' },
  replace:  { t: 'ধাপ ৩ · সিট প্রতিস্থাপন ⚠️D-46', c: 'chip-danger', i: 'refresh' },
  forfeit:  { t: 'ধাপ ৪ · বাতিল ও ঘাটতি নিষ্পত্তি ⚠️D-46', c: 'chip-danger', i: 'freeze' },
};;
const RC_SEAT_ST = {
  active:   { t: 'চলমান', c: 'chip-info', i: 'refresh' },
  won:      { t: 'পেয়ে গেছে', c: 'chip-ok', i: 'check' },
  due:      { t: 'বকেয়া', c: 'chip-warn', i: 'warn' },
  dflt:     { t: 'ডিফল্ট', c: 'chip-danger', i: 'freeze' },
  waitlist: { t: 'ওয়েটলিস্ট', c: 'chip-neutral', i: 'clock' },
  vacant:   { t: 'খালি সিট', c: 'chip-neutral', i: 'minus' },
};
const RC_DRAW_ST = {
  executed:  { t: 'সম্পন্ন · অপরিবর্তনীয়', c: 'chip-ok', i: 'lock' },
  approval:  { t: 'অনুমোদনের অপেক্ষায়', c: 'chip-warn', i: 'checkc' },
  scheduled: { t: 'নির্ধারিত', c: 'chip-info', i: 'cal' },
};
const RC_ACTION = [
  ['warn', 'ধাপ ১ · সতর্কতা নোটিশ'],
  ['late_fee', 'ধাপ ২ · বিলম্ব ফি ⚠️D-41'],
  ['replace', 'ধাপ ৩ · সিট প্রতিস্থাপন ⚠️D-46'],
  ['forfeit', 'ধাপ ৪ · বাতিল ও ঘাটতি নিষ্পত্তি ⚠️D-46'],
];
/* পেআউট চ্যানেল — channel (app.js) পুনর্ব্যবহার; savings_transfer ⚠️D-12 পুনঃসিদ্ধান্তের কারণে নিষ্ক্রিয় */
const RC_PAYOUT = [
  { k: 'cash_office', t: 'অফিস কাউন্টার (নগদ)', on: true },
  { k: 'bkash', t: 'বিকাশ / ওয়ালেট', on: true },
  { k: 'bank', t: 'ব্যাংক ট্রান্সফার', on: true },
  { k: 'savings', t: 'সঞ্চয় অ্যাকাউন্টে স্থানান্তর', on: false, flag: '⚠️D-12 পুনরায় খোলা — এখন নিষ্ক্রিয়' },
];

/* ---- rosca_schemes: চক্রের নমুনা/কনফিগারেশন (নিয়ম সংস্করণসহ) ---- */
const RC_SCHEMES = [
  { id: 'rs01', code: 'RCS-01', name: 'মাসিক চক্র ৳৫,০০০ · ৮ সিট', seats: 8, contrib: 500000, freq: 'মাসিক',
    joinFee: 10000, drawMethod: 'lottery', minMembers: 6, maxCirclesPerMember: 3, lateFee: 10000,
    payout: ['cash_office', 'bkash', 'bank'], defaultPolicy: ['warn', 'late_fee', 'replace', 'forfeit'],
    version: 3, status: 'active', circles: 2, note: 'কিশ্তির অঙ্ক ও সিট সংখ্যা অপরিবর্তনীয় — চক্র মাঝপথে বদলায় না (নিয়ম সংস্করণ ৩)' },
  { id: 'rs02', code: 'RCS-02', name: 'সাপ্তাহিক চক্র ৳২,০০০ · ১২ সিট', seats: 12, contrib: 200000, freq: 'সাপ্তাহিক',
    joinFee: 5000, drawMethod: 'fixed', minMembers: 12, maxCirclesPerMember: 3, lateFee: 5000,
    payout: ['cash_office', 'bkash'], defaultPolicy: ['warn', 'late_fee', 'replace'],
    version: 1, status: 'active', circles: 1, note: '১২ সিট পূর্ণ না হলে প্রথম ড্র হয় না' },
  { id: 'rs03', code: 'RCS-03', name: 'ঈদ চক্র ৳১০,০০০ · ৮ সিট', seats: 8, contrib: 1000000, freq: 'মাসিক',
    joinFee: 0, drawMethod: 'fixed', minMembers: 8, maxCirclesPerMember: 2, lateFee: 20000,
    payout: ['cash_office', 'bank'], defaultPolicy: ['warn', 'late_fee', 'forfeit'],
    version: 2, status: 'archived', circles: 1, note: '২০২৫-২৬ মৌসুম সম্পন্ন; নতুন চক্র খোলা বন্ধ' },
];

/* ---- rosca_circles: একটি নির্দিষ্ট চালু চক্র ---- */
const RC_CIRCLES = [
  { id: 'rc01', code: 'RC-2606-01', scheme: 'rs01', start: '2026-06-05', end: '2027-01-05', status: 'active',
    route: 'R2 · গৌরীঘোনা', branch: 'কেশবপুর শাখা', manager: 'মোঃ আব্দুল্লাহ', drawn: 5, nextDrawNo: 6,
    nextDate: '2026-11-05', witnesses: ['কমিটি সভাপতি · মোঃ আব্দুল্লাহ', 'নিরীক্ষক · এস. এম. ফারুক'] },
  { id: 'rc02', code: 'RC-2610-02', scheme: 'rs02', start: '2026-11-15', end: '2027-01-31', status: 'forming',
    route: 'R3 · সুফলাকাটি', branch: 'কেশবপুর শাখা', manager: 'সুমি রানী দাস', drawn: 0, nextDrawNo: 1,
    nextDate: '2026-11-15', witnesses: ['কমিটি সভাপতি · মোঃ আব্দুল্লাহ'] },
  { id: 'rc03', code: 'RC-2504-03', scheme: 'rs03', start: '2025-06-10', end: '2026-01-10', status: 'completed',
    route: 'R1 · কেশবপুর সদর', branch: 'কেশবপুর শাখা', manager: 'মোঃ আব্দুল্লাহ', drawn: 8, nextDrawNo: null,
    nextDate: null, witnesses: ['কমিটি সভাপতি · মোঃ আব্দুল্লাহ', 'নিরীক্ষক · এস. এম. ফারুক'], settledOn: '2026-01-12' },
  { id: 'rc04', code: 'RC-2608-04', scheme: 'rs01', start: '2026-08-05', end: '2027-03-05', status: 'risk',
    route: 'R2 · গৌরীঘোনা', branch: 'কেশবপুর শাখা', manager: 'নাসরিন আক্তার', drawn: 3, nextDrawNo: 4,
    nextDate: '2026-11-05', witnesses: ['কমিটি সভাপতি · মোঃ আব্দুল্লাহ'] },
];

/* ---- rosca_draws + rosca_draw_pool (প্রতি ড্রের অপরিবর্তনীয় রেকর্ড ও পুল স্ন্যাপশট) ---- */
const RC_DRAWS = [
  /* rc01 · লটারি · ৮ সিট × ৳৫,০০০ = প্রতি ড্র ৳৪০,০০০ */
  { circle: 'rc01', no: 1, scheduled: '2026-06-05', executed: '2026-06-05', method: 'lottery', winnerSeat: 7,
    amount: 4000000, receipt: 'RP-2606-0007', hash: 'a3f9c17d', channel: 'cash_office', status: 'executed',
    pool: { expected: 4000000, collected: 4000000, shortfall: 0, cover: null }, by: 'সুমি রানী দাস', appr: 'নাসরিন আক্তার' },
  { circle: 'rc01', no: 2, scheduled: '2026-07-05', executed: '2026-07-05', method: 'lottery', winnerSeat: 1,
    amount: 4000000, receipt: 'RP-2607-0001', hash: 'b71e4402', channel: 'bkash', status: 'executed',
    pool: { expected: 4000000, collected: 4000000, shortfall: 0, cover: null }, by: 'সুমি রানী দাস', appr: 'নাসরিন আক্তার' },
  { circle: 'rc01', no: 3, scheduled: '2026-08-05', executed: '2026-08-05', method: 'lottery', winnerSeat: 5,
    amount: 4000000, receipt: 'RP-2608-0005', hash: 'c92d55aa', channel: 'cash_office', status: 'executed',
    pool: { expected: 4000000, collected: 4000000, shortfall: 0, cover: null }, by: 'রাজু আহমেদ', appr: 'মোঃ আব্দুল্লাহ' },
  { circle: 'rc01', no: 4, scheduled: '2026-09-05', executed: '2026-09-05', method: 'lottery', winnerSeat: 8,
    amount: 4000000, receipt: 'RP-2609-0008', hash: 'd40f8b31', channel: 'bank', status: 'executed',
    pool: { expected: 4000000, collected: 3800000, shortfall: 200000, cover: 'বিলম্ব ফি থেকে পূরণ ⚠️D-41' }, by: 'রাজু আহমেদ', appr: 'মোঃ আব্দুল্লাহ' },
  { circle: 'rc01', no: 5, scheduled: '2026-10-05', executed: '2026-10-05', method: 'lottery', winnerSeat: 2,
    amount: 4000000, receipt: 'RP-2610-0002', hash: 'e6a1c094', channel: 'cash_office', status: 'executed',
    pool: { expected: 4000000, collected: 4000000, shortfall: 0, cover: null }, by: 'সুমি রানী দাস', appr: 'নাসরিন আক্তার' },
  { circle: 'rc01', no: 6, scheduled: '2026-11-05', executed: null, method: 'lottery', winnerSeat: null,
    amount: 4000000, receipt: null, hash: null, channel: null, status: 'approval',
    pool: { expected: 4000000, collected: 3500000, shortfall: 500000, cover: 'অপেক্ষমাণ — বকেয়া আদায় বা রিজার্ভ ⚠️D-38' },
    by: 'সুমি রানী দাস', appr: null, candidates: [3, 4, 6] },
  /* rc03 · পূর্বনির্ধারিত ক্রম · ৮ সিট × ৳১০,০০০ = প্রতি ড্র ৳৮০,০০০ */
  { circle: 'rc03', no: 1, scheduled: '2025-06-10', executed: '2025-06-10', method: 'fixed', winnerSeat: 4,
    amount: 8000000, receipt: 'RP-2506-0004', hash: '1f0c77b2', channel: 'bank', status: 'executed',
    pool: { expected: 8000000, collected: 8000000, shortfall: 0, cover: null }, by: 'সুমি রানী দাস', appr: 'মোঃ আব্দুল্লাহ' },
  { circle: 'rc03', no: 2, scheduled: '2025-07-10', executed: '2025-07-10', method: 'fixed', winnerSeat: 7,
    amount: 8000000, receipt: 'RP-2507-0007', hash: '2a8d31ef', channel: 'cash_office', status: 'executed',
    pool: { expected: 8000000, collected: 8000000, shortfall: 0, cover: null }, by: 'রাজু আহমেদ', appr: 'মোঃ আব্দুল্লাহ' },
  { circle: 'rc03', no: 3, scheduled: '2025-08-10', executed: '2025-08-10', method: 'fixed', winnerSeat: 2,
    amount: 8000000, receipt: 'RP-2508-0002', hash: '3c5b90d4', channel: 'cash_office', status: 'executed',
    pool: { expected: 8000000, collected: 8000000, shortfall: 0, cover: null }, by: 'রাজু আহমেদ', appr: 'নাসরিন আক্তার' },
  { circle: 'rc03', no: 4, scheduled: '2025-09-10', executed: '2025-09-10', method: 'fixed', winnerSeat: 5,
    amount: 8000000, receipt: 'RP-2509-0005', hash: '4d7e12aa', channel: 'bank', status: 'executed',
    pool: { expected: 8000000, collected: 8000000, shortfall: 0, cover: null }, by: 'সুমি রানী দাস', appr: 'নাসরিন আক্তার' },
  { circle: 'rc03', no: 5, scheduled: '2025-10-10', executed: '2025-10-10', method: 'fixed', winnerSeat: 1,
    amount: 8000000, receipt: 'RP-2510-0001', hash: '5e2f6b18', channel: 'cash_office', status: 'executed',
    pool: { expected: 8000000, collected: 8000000, shortfall: 0, cover: null }, by: 'রাজু আহমেদ', appr: 'মোঃ আব্দুল্লাহ' },
  { circle: 'rc03', no: 6, scheduled: '2025-11-10', executed: '2025-11-10', method: 'fixed', winnerSeat: 8,
    amount: 8000000, receipt: 'RP-2511-0008', hash: '6f4a8c27', channel: 'bkash', status: 'executed',
    pool: { expected: 8000000, collected: 8000000, shortfall: 0, cover: null }, by: 'সুমি রানী দাস', appr: 'মোঃ আব্দুল্লাহ' },
  { circle: 'rc03', no: 7, scheduled: '2025-12-10', executed: '2025-12-10', method: 'fixed', winnerSeat: 3,
    amount: 8000000, receipt: 'RP-2512-0003', hash: '7a9b2d35', channel: 'cash_office', status: 'executed',
    pool: { expected: 8000000, collected: 8000000, shortfall: 0, cover: null }, by: 'রাজু আহমেদ', appr: 'নাসরিন আক্তার' },
  { circle: 'rc03', no: 8, scheduled: '2026-01-10', executed: '2026-01-10', method: 'fixed', winnerSeat: 6,
    amount: 8000000, receipt: 'RP-2601-0006', hash: '8b1c4e46', channel: 'bank', status: 'executed',
    pool: { expected: 8000000, collected: 8000000, shortfall: 0, cover: null }, by: 'সুমি রানী দাস', appr: 'মোঃ আব্দুল্লাহ' },
  /* rc04 · লটারি · ডিফল্ট ঝুঁকিতে */
  { circle: 'rc04', no: 1, scheduled: '2026-08-05', executed: '2026-08-05', method: 'lottery', winnerSeat: 3,
    amount: 4000000, receipt: 'RP-2608-0013', hash: '9c3d5f57', channel: 'cash_office', status: 'executed',
    pool: { expected: 4000000, collected: 4000000, shortfall: 0, cover: null }, by: 'রাজু আহমেদ', appr: 'নাসরিন আক্তার' },
  { circle: 'rc04', no: 2, scheduled: '2026-09-05', executed: '2026-09-05', method: 'lottery', winnerSeat: 6,
    amount: 4000000, receipt: 'RP-2609-0016', hash: 'ad5e7a68', channel: 'bkash', status: 'executed',
    pool: { expected: 4000000, collected: 3500000, shortfall: 500000, cover: 'রিজার্ভ থেকে ⚠️D-38' }, by: 'রাজু আহমেদ', appr: 'নাসরিন আক্তার' },
  { circle: 'rc04', no: 3, scheduled: '2026-10-05', executed: '2026-10-05', method: 'lottery', winnerSeat: 1,
    amount: 4000000, receipt: 'RP-2610-0011', hash: 'be7f9b79', channel: 'cash_office', status: 'executed',
    pool: { expected: 4000000, collected: 3500000, shortfall: 500000, cover: 'রিজার্ভ থেকে ⚠️D-38' }, by: 'সুমি রানী দাস', appr: 'মোঃ আব্দুল্লাহ' },
  { circle: 'rc04', no: 4, scheduled: '2026-11-05', executed: null, method: 'lottery', winnerSeat: null,
    amount: 4000000, receipt: null, hash: null, channel: null, status: 'scheduled',
    pool: { expected: 4000000, collected: 2500000, shortfall: 1500000, cover: 'ডিফল্ট নিষ্পত্তি ছাড়া ড্র হবে না' },
    by: null, appr: null, candidates: [2, 4, 5, 7, 8] },
];

/* ---- সিট বরাদ্দ: সিট নম্বর → সদস্য (বিদ্যমান MEMBERS রেকর্ড, নতুন ব্যক্তি আবিষ্কার করা হয়নি) ---- */
const RC_SEAT_MAP = {
  rc01: ['m2', 'm3', 'm4', 'm1', 'm5', 'm6', 'm7', 'm8'],
  rc03: ['m2', 'm3', 'm4', 'm1', 'm5', 'm6', 'm7', 'm8'],
  rc04: ['m3', 'm4', 'm5', 'm6', 'm2', 'm8', 'm7', 'm1'],
  rc02: ['m2', 'm3', 'm5', 'm6', 'm7', 'm8'],        /* ৬টি পূর্ণ · ৭–১২ খালি */
};
const RC_WAITLIST = [
  { circle: 'rc02', memberId: 'm1', pos: 1, applied: '2026-10-18' },
  { circle: 'rc02', memberId: 'm4', pos: 2, applied: '2026-10-21' },
];
/* কোন সিট কতটি কিস্তি দেয়নি (বকেয়া/ডিফল্ট হিসাবের উৎস) */
const RC_MISSED = { rc01: { 6: 1 }, rc04: { 5: 2, 7: 1 } };

/* ---- rosca_defaults: ডিফল্ট ও প্রতিকার ---- */
const RC_DEFAULTS = [
  { id: 'rd01', circle: 'rc01', seatNo: 6, missedDraws: [6], amount: 500000, step: 'late_fee', lateFee: 10000,
    status: 'open', decidedBy: null, committee: null, noticeSent: '2026-10-22',
    note: 'ধাপ ১ সতর্কতা পাঠানো হয়েছে; ধাপ ২ বিলম্ব ফি ৳১০০ প্রযোজ্য ⚠️D-41 (চূড়ান্ত নয়)' },
  { id: 'rd02', circle: 'rc04', seatNo: 5, missedDraws: [2, 3], amount: 1000000, step: 'replace', lateFee: 20000,
    status: 'pending-committee', decidedBy: 'নাসরিন আক্তার', committee: 'CM-2610-02', noticeSent: '2026-09-08',
    note: 'প্রতিস্থাপন প্রস্তাব কমিটিতে; ঘাটতি ৳১০,০০০ রিজার্ভ থেকে মেটানো হয়েছে ⚠️D-38' },
  { id: 'rd03', circle: 'rc04', seatNo: 7, missedDraws: [3], amount: 500000, step: 'warn', lateFee: 0,
    status: 'open', decidedBy: null, committee: null, noticeSent: '2026-10-06',
    note: 'প্রথম বার; সতর্কতা নোটিশ দেওয়া হয়েছে' },
  { id: 'rd04', circle: 'rc03', seatNo: 3, missedDraws: [7], amount: 1000000, step: 'forfeit', lateFee: 20000,
    status: 'resolved', decidedBy: 'মোঃ আব্দুল্লাহ', committee: 'CM-2601-01', noticeSent: '2025-11-12',
    note: 'সমাপ্ত চক্রে ঘাটতি ক্ষতিপূরণ খাত থেকে নিষ্পত্তি; ড্র ইতিহাস অপরিবর্তিত আছে' },
];

/* ---- হেল্পার ---- */
function rcScheme(id) { return RC_SCHEMES.filter(x => x.id === id || x.code === id)[0] || RC_SCHEMES[0]; }
function rcCircle(id) { return RC_CIRCLES.filter(x => x.id === id || x.code === id)[0] || RC_CIRCLES[0]; }
function rcPerDraw(sc) { return sc.seats * sc.contrib; }
function rcTotalPool(sc) { return rcPerDraw(sc) * sc.seats; }
function rcDraws(cid, onlyDone) {
  const l = RC_DRAWS.filter(d => d.circle === cid);
  return onlyDone ? l.filter(d => d.status === 'executed') : l;
}
function rcDraw(cid, no) { return RC_DRAWS.filter(d => d.circle === cid && d.no === no)[0] || null; }
function rcNextDraw(cid) { return RC_DRAWS.filter(d => d.circle === cid && d.status !== 'executed')[0] || null; }
/* rosca_seats: ড্র-রেকর্ড থেকে হিসাব করা হয় (সংখ্যা যেন কখনো না মেলে না না হয়) */
function rcSeats(cid) {
  const c = rcCircle(cid), sc = rcScheme(c.scheme);
  const done = rcDraws(cid, true);
  const map = RC_SEAT_MAP[cid] || [];
  const rows = map.map((mid, i) => {
    const no = i + 1, mem = MEMBERS.filter(m => m.id === mid)[0] || { name: '—', no: '—', mobile: '' };
    const won = done.filter(d => d.winnerSeat === no)[0] || null;
    const missed = (RC_MISSED[cid] && RC_MISSED[cid][no]) || 0;
    const paid = Math.max(0, done.length - missed);
    return {
      circle: cid, no: no, memberId: mid, name: mem.name, mno: mem.no, mobile: mem.mobile, village: mem.village || '',
      joined: c.start, contributed: paid * sc.contrib, paidCount: paid, missed: missed, missedAmt: missed * sc.contrib,
      receivedAt: won ? won.executed : null, receivedAmt: won ? won.amount : 0, receipt: won ? won.receipt : null,
      drawNo: won ? won.no : null,
      status: won ? 'won' : (missed ? 'due' : 'active'),
    };
  });
  for (let n = map.length + 1; n <= sc.seats; n++)
    rows.push({ circle: cid, no: n, memberId: null, name: 'খালি সিট', mno: '—', mobile: '', village: '', joined: null,
      contributed: 0, paidCount: 0, missed: 0, missedAmt: 0, receivedAt: null, receivedAmt: 0, receipt: null, drawNo: null, status: 'vacant' });
  return rows;
}
function rcSeat(cid, no) { return rcSeats(cid).filter(s => s.no === Number(no))[0] || null; }
function rcFilled(cid) { const sc = rcScheme(rcCircle(cid).scheme); return Math.min(sc.seats, (RC_SEAT_MAP[cid] || []).length); }
function rcWaitlist(cid) { return RC_WAITLIST.filter(x => x.circle === cid); }
function rcDef(cid, seatNo) { return RC_DEFAULTS.filter(x => x.circle === cid && (seatNo ? x.seatNo === Number(seatNo) : true)); }
function rcCollected(cid) { return rcSeats(cid).reduce((s, x) => s + x.contributed, 0); }
function rcShortfall(cid) {
  const c = rcCircle(cid), sc = rcScheme(c.scheme);
  return Math.max(0, rcDraws(cid, true).length * rcPerDraw(sc) - rcCollected(cid));
}
/* সদস্য-পক্ষ: আব্দুল করিম (m1) যে চক্রে আছেন */
const RC_ME = 'm1';
function rcMySeats() {
  const out = [];
  RC_CIRCLES.forEach(c => {
    const st = rcSeats(c.id).filter(x => x.memberId === RC_ME)[0];
    if (st) out.push({ circle: c, scheme: rcScheme(c.scheme), seat: st, wait: null });
    else {
      const wl = rcWaitlist(c.id).filter(x => x.memberId === RC_ME)[0];
      if (wl) out.push({ circle: c, scheme: rcScheme(c.scheme), seat: null, wait: wl });
    }
  });
  return out;
}
/* পরবর্তী ড্রের সম্ভাব্য প্রাপক (যারা এখনো পায়নি) */
function rcCandidates(cid) { return rcSeats(cid).filter(s => s.status !== 'won' && s.status !== 'vacant'); }
/* ড্র ক্রম (পূর্বনির্ধারিত হলে) */
function rcOrder(cid) { return rcDraws(cid).slice().sort((a, b) => a.no - b.no).map(d => ({ no: d.no, seat: d.winnerSeat, date: d.executed || d.scheduled, done: d.status === 'executed' })); }
function rcActionLabel(k) { const h = RC_ACTION.filter(x => x[0] === k)[0]; return h ? h[1] : k; }
function rcPayoutLabel(k) { const h = RC_PAYOUT.filter(x => x.k === k)[0]; return h ? h.t : (channel[k] ? channel[k].t : k); }

/* ============================================================
   Joint Goal (যৌথ লক্ষ্য সঞ্চয়) — মডিউল ৩ · Phase 2A
   স্পেক: specs/03 §৮.৩ (JA-01…JA-10 · JM-01…JM-05) · §৩.৪ Goal Progress Engine · §৫.৩ ভাষা/রঙ · §৫.৬ সদস্য অভিজ্ঞতা
   ভাষা: "আমাদের লক্ষ্য · অবদান · লক্ষ্য পূরণ" · রঙ: বেগুনি (purple) · এড়ানো শব্দ: "স্কিম", "লাভ"
   হিসাব: দায় — নির্দিষ্ট লক্ষ্য তহবিল ⚠️D-39 · ব্যক্তিগত উত্তোলন নেই (BR-19) · কোনো সুদ/মুনাফা নেই (BR-13)
   নিয়ম: BR-04 maker≠checker · BR-08 রসিদ অনন্য · R-05 পিরিয়ড লক · BR-24 মডিউল এনটাইটেলমেন্ট · BR-25 দিনশেষ গেট
   অমীমাংসিত: ⚠️D-37 (মোট সঞ্চয়ের সংজ্ঞা) · D-39 (মালিকানা ও ব্যর্থতার নিয়ম) · D-49 (অবদান/pledge/যোগদান অনুমোদন)
             · D-50 (অর্থ ব্যবহারের কর্তৃত্ব) · D-68 (মাইলস্টোন হ্যাঁ, লিডারবোর্ড নয়) · D-43 (প্ল্যান সীমা)
   সব অঙ্ক পয়সায় (MEMBERS-এর একক) — tk() দিয়ে প্রদর্শন।
   ============================================================ */
const JG_LIMIT = { goals: 5 };                 /* §২.৪ প্ল্যান সীমা: একসাথে সর্বোচ্চ ৫টি লক্ষ্য ⚠️D-43 */
const JG_MS = [25, 50, 75, 100];               /* মাইলস্টোন শতকরা ⚠️D-68 — লিডারবোর্ড নেই */

const JG_STATUS = {
  forming:  { t: 'যোগদান চলছে', c: 'chip-info', i: 'users' },
  active:   { t: 'চলমান', c: 'chip-purple', i: 'refresh' },
  achieved: { t: 'লক্ষ্য পূরণ', c: 'chip-ok', i: 'check' },
  expired:  { t: 'মেয়াদোত্তীর্ণ ⚠️D-39', c: 'chip-danger', i: 'warn' },
  settling: { t: 'নিষ্পত্তি চলছে', c: 'chip-warn', i: 'scale' },
  closed:   { t: 'সমাপ্ত ও নিষ্পত্তি', c: 'chip-neutral', i: 'lock' },
};
const JG_CRULE = {                              /* অবদানের নিয়ম ⚠️D-49 */
  fixed:    { t: 'নির্দিষ্ট অঙ্ক (মাসিক)', c: 'chip-info', i: 'cal' },
  flexible: { t: 'নমনীয় (সীমার ভেতরে)', c: 'chip-purple', i: 'scale' },
};
const JG_JOIN = {                               /* কে যোগ দিতে পারবে ⚠️D-49 */
  open:    { t: 'সব সদস্য যোগ দিতে পারবে', c: 'chip-ok', i: 'users' },
  invited: { t: 'শুধু আমন্ত্রিত সদস্য', c: 'chip-info', i: 'send' },
  route:   { t: 'নির্দিষ্ট রুটের সদস্য', c: 'chip-neutral', i: 'route' },
  group:   { t: 'নির্দিষ্ট গোষ্ঠীর সদস্য', c: 'chip-neutral', i: 'flag' },
};
const JG_PART_ST = {
  invited: { t: 'আমন্ত্রিত · উত্তরের অপেক্ষায়', c: 'chip-neutral', i: 'send' },
  pending: { t: 'যোগদান অনুমোদনের অপেক্ষায় ⚠️D-49', c: 'chip-warn', i: 'clock' },
  active:  { t: 'সক্রিয় অংশগ্রহণ', c: 'chip-ok', i: 'check' },
  behind:  { t: 'অবদানে পেছনে', c: 'chip-warn', i: 'warn' },
  removed: { t: 'বাদ দেওয়া (কারণসহ)', c: 'chip-danger', i: 'x' },
};
const JG_DISB_ST = {
  planned:  { t: 'পরিকল্পিত', c: 'chip-neutral', i: 'doc' },
  approval: { t: 'অনুমোদনের অপেক্ষায়', c: 'chip-warn', i: 'checkc' },
  paid:     { t: 'পরিশোধিত · প্রমাণসহ', c: 'chip-ok', i: 'lock' },
  blocked:  { t: 'প্রমাণ ছাড়াই আটকে', c: 'chip-danger', i: 'lock' },
};
const JG_OWN = [                                /* মালিকানা মডেল ⚠️D-39 */
  ['earmarked', 'সমিতির নির্দিষ্ট-উদ্দেশ্য তহবিল (ডিফল্ট)'],
  ['joint', 'সদস্যদের যৌথ দাবি — অবিভাজ্য'],
  ['trust', 'আস্থারত তহবিল (ট্রাস্ট-সদৃশ খাত)'],
];
const JG_DEADLINE = [                           /* লক্ষ্য না পৌঁছালে করণীয় ⚠️D-39 */
  ['extend', 'মেয়াদ একবার বাড়ানো (ডিফল্ট)'],
  ['refund', 'আনুপাতিক ফেরত (অবদান অনুযায়ী)'],
  ['to_gs', 'সাধারণ সঞ্চয় অ্যাকাউন্টে রূপান্তর'],
  ['cancel', 'বাতিল — কমিটির লিখিত সিদ্ধান্তসহ'],
];
const JG_USE = [                                /* অর্থ ব্যবহারের কর্তৃত্ব ⚠️D-50 */
  ['vendor', 'ভেন্ডর পেমেন্ট (অগ্রাধিকার)'],
  ['committee', 'কমিটির লিখিত সিদ্ধান্ত অনুযায়ী খরচ'],
  ['member_hand', 'দায়িত্বপ্রাপ্ত সদস্যের হাতে — প্রমাণ বাধ্যতামূলক'],
  ['assembly', 'সাধারণ সভার অনুমোদনসহ'],
];
const JG_CHANNEL = [
  { k: 'cash_office', t: 'অফিস কাউন্টার (নগদ)' },
  { k: 'bkash', t: 'বিকাশ / ওয়ালেট' },
  { k: 'bank', t: 'ব্যাংক ট্রান্সফার' },
];
const JG_STEP = [                               /* অবদান না দিলে প্রতিকারের ধাপ ⚠️D-49 */
  ['notice', 'ধাপ ১ · অনুস্মারক নোটিশ (SMS/কাগজ)'],
  ['committee', 'ধাপ ২ · কমিটির কাছে প্রতিবেদন'],
  ['remove', 'ধাপ ৩ · অংশগ্রহণ বাতিল (কারণ লিপিবদ্ধ)'],
];
const JG_SETTLE = [                             /* নিষ্পত্তির ধাপ (JA-09) */
  ['review', 'ধাপ ১ · অগ্রগতি পর্যালোচনা'],
  ['decide', 'ধাপ ২ · কমিটির লিখিত সিদ্ধান্ত ⚠️D-39'],
  ['approve', 'ধাপ ৩ · অনুমোদন (maker ≠ checker)'],
  ['execute', 'ধাপ ৪ · ফেরত/রূপান্তর সম্পাদন + রসিদ'],
];

/* ---- joint_goals: লক্ষ্যের সংজ্ঞা (৫টি = প্ল্যান সীমা পূর্ণ) ---- */
const JG_GOALS = [
  { id: 'jg01', code: 'JG-2605-01', name: 'মসজিদ সংস্কার ও ছাদ মেরামত',
    desc: 'কেশবপুর কেন্দ্রীয় জামে মসজিদের ছাদ, ওজুখানা ও বৈদ্যুতিক লাইন সংস্কার। খরচ ভেন্ডরের মাধ্যমে সরাসরি পরিশোধ হবে।',
    target: 20000000, targetDate: '2026-12-31', start: '2026-05-05', payDay: 5,
    crule: 'flexible', min: 50000, max: 1000000, monthlyMin: 100000, oneTime: true,
    join: 'invited', maxParts: 10, needApproval: true, ownership: 'earmarked',
    deadlinePolicy: ['extend', 'refund'], use: ['vendor', 'committee'],
    status: 'active', version: 2, createdBy: 'মোঃ আব্দুল্লাহ', createdAt: '2026-04-28',
    owner: 'মোঃ আব্দুল্লাহ', branch: 'কেশবপুর শাখা', committee: 'CM-2604-06',
    publish: true, note: 'লক্ষ্য অঙ্ক কমানো যাবে না; বাড়ানো হলে নতুন সংস্করণ ও কমিটির সিদ্ধান্ত লাগবে ⚠️D-49' },
  { id: 'jg02', code: 'JG-2606-02', name: 'গভীর নলকূপ ও পানি সরবরাহ',
    desc: 'সুফলাকাটি গ্রামে ২টি গভীর নলকূপ স্থাপন ও পানির লাইন সংযোগ — নিরাপদ পানির সুবিধা সবার জন্য।',
    target: 8000000, targetDate: '2026-11-30', start: '2026-06-05', payDay: 5,
    crule: 'fixed', monthly: 200000, min: null, max: null, monthlyMin: 200000, oneTime: true,
    join: 'open', maxParts: 12, needApproval: true, ownership: 'earmarked',
    deadlinePolicy: ['extend', 'refund'], use: ['vendor'],
    status: 'achieved', version: 1, createdBy: 'নাসরিন আক্তার', createdAt: '2026-05-20',
    owner: 'নাসরিন আক্তার', branch: 'কেশবপুর শাখা', committee: 'CM-2605-02',
    publish: true, note: 'লক্ষ্য পূরণ হয়েছে; বিতরণ চলছে — প্রমাণ ছাড়া কোনো খরচ হবে না (BR-19)' },
  { id: 'jg03', code: 'JG-2602-03', name: 'ঈদ সামগ্রী ও ইফতার বিতরণ',
    desc: 'ঈদ-উল-ফিতর উপলক্ষে ৪০টি পরিবারের জন্য পণ্য ক্রয় ও ইফতার আয়োজন। মেয়াদ শেষে অর্জিত হয়নি।',
    target: 6000000, targetDate: '2026-06-15', start: '2026-02-05', payDay: 5,
    crule: 'fixed', monthly: 100000, min: null, max: null, monthlyMin: 100000, oneTime: true,
    join: 'invited', maxParts: 10, needApproval: true, ownership: 'joint',
    deadlinePolicy: ['refund'], use: ['vendor', 'member_hand'],
    status: 'settling', version: 1, createdBy: 'মোঃ আব্দুল্লাহ', createdAt: '2026-01-22',
    owner: 'মোঃ আব্দুল্লাহ', branch: 'কেশবপুর শাখা', committee: 'CM-2607-02',
    settleDecision: 'refund', settleBy: 'সুমি রানী দাস', settleAppr: null, publish: true,
    note: 'মেয়াদোত্তীর্ণ: কমিটি আনুপাতিক ফেরতের সিদ্ধান্ত দিয়েছে (CM-2607-02) ⚠️D-39 — অনুমোদনের অপেক্ষায়' },
  { id: 'jg04', code: 'JG-2610-04', name: 'সদস্য মিলনায়তন নির্মাণ',
    desc: 'সমিতির নিজস্ব জমিতে একতলা মিলনায়তন — সভা, প্রশিক্ষণ ও বিপদের সময় আশ্রয়কেন্দ্র হিসেবে ব্যবহার হবে।',
    target: 50000000, targetDate: '2027-06-30', start: '2026-10-05', payDay: 5,
    crule: 'flexible', min: 100000, max: 2000000, monthlyMin: 100000, oneTime: true,
    join: 'invited', maxParts: 20, needApproval: true, ownership: 'earmarked',
    deadlinePolicy: ['extend', 'to_gs', 'refund'], use: ['vendor', 'assembly'],
    status: 'forming', version: 1, createdBy: 'কামরুল হাসান', createdAt: '2026-09-30',
    owner: 'কামরুল হাসান', branch: 'কেশবপুর শাখা', committee: 'CM-2609-01',
    publish: true, note: 'আমন্ত্রণ পাঠানো হয়েছে; যোগদানে Admin অনুমোদন বাধ্যতামূলক ⚠️D-49' },
  { id: 'jg05', code: 'JG-2511-05', name: 'শিক্ষা কেন্দ্রের কম্পিউটার ক্রয়',
    desc: 'সদস্যদের সন্তানদের জন্য ৫টি কম্পিউটার ও ইন্টারনেট সংযোগ — বিদ্যানন্দকাঠি শিক্ষা কেন্দ্রে স্থাপিত।',
    target: 5000000, targetDate: '2026-03-31', start: '2025-11-05', payDay: 5,
    crule: 'fixed', monthly: 100000, min: null, max: null, monthlyMin: 100000, oneTime: true,
    join: 'open', maxParts: 10, needApproval: true, ownership: 'earmarked',
    deadlinePolicy: ['extend', 'refund'], use: ['vendor'],
    status: 'closed', version: 1, createdBy: 'মোঃ আব্দুল্লাহ', createdAt: '2025-10-18',
    owner: 'মোঃ আব্দুল্লাহ', branch: 'কেশবপুর শাখা', committee: 'CM-2602-01',
    settledOn: '2026-03-15', publish: true,
    note: 'লক্ষ্য পূরণ ও সম্পূর্ণ বিতরণ নিষ্পত্তি হয়েছে — রেকর্ড অপরিবর্তনীয়ভাবে সংরক্ষিত' },
];

/* ---- goal_participations: অংশগ্রহণকারী, প্রতিশ্রুতি (pledge) ও অবদানের ছক ----
   `paid` = এখন পর্যন্ত মোট অবদান (পয়সা) · `install` = প্রতিবারের পছন্দের অঙ্ক
   অবদানের রেকর্ড (goal_contributions) এই ছক থেকেই তৈরি হয় — দুই জায়গায় আলাদা করে লেখা নেই,
   তাই মোট আর প্রতিশ্রুতি কখনো অমিল হবে না (Goal Progress Engine-এর একক উৎস)। */
const JG_PARTS = [
  /* jg01 · মসজিদ সংস্কার · নমনীয় অবদান (মে'–অক্টোবর পর্যন্ত ৬ মাস, লক্ষ্য ডিসেম্বর) */
  { goal: 'jg01', memberId: 'm1', pledged: 600000, paid: 450000, install: 150000, joinedAt: '2026-05-04', status: 'active', approvedBy: 'মোঃ আব্দুল্লাহ' },
  { goal: 'jg01', memberId: 'm2', pledged: 3000000, paid: 2700000, install: 500000, joinedAt: '2026-05-04', status: 'active', approvedBy: 'মোঃ আব্দুল্লাহ' },
  { goal: 'jg01', memberId: 'm3', pledged: 2500000, paid: 2500000, install: 500000, joinedAt: '2026-05-06', status: 'active', approvedBy: 'মোঃ আব্দুল্লাহ' },
  { goal: 'jg01', memberId: 'm4', pledged: 4000000, paid: 3200000, install: 800000, joinedAt: '2026-05-06', status: 'active', approvedBy: 'নাসরিন আক্তার' },
  { goal: 'jg01', memberId: 'm5', pledged: 2000000, paid: 2000000, install: 500000, joinedAt: '2026-05-08', status: 'active', approvedBy: 'নাসরিন আক্তার' },
  { goal: 'jg01', memberId: 'm6', pledged: 3500000, paid: 1800000, install: 300000, joinedAt: '2026-05-08', status: 'behind', approvedBy: 'মোঃ আব্দুল্লাহ', step: 'notice', noticeSent: '2026-10-06' },
  { goal: 'jg01', memberId: 'm7', pledged: 2400000, paid: 950000, install: 250000, joinedAt: '2026-05-10', status: 'behind', approvedBy: 'মোঃ আব্দুল্লাহ', step: 'committee', noticeSent: '2026-09-05' },
  { goal: 'jg01', memberId: 'm8', pledged: 2000000, paid: 0, install: 250000, joinedAt: '2026-05-12', status: 'behind', approvedBy: 'নাসরিন আক্তার', step: 'notice', noticeSent: '2026-10-06' },

  /* jg02 · নলকূপ · নির্দিষ্ট মাসিক ৳২,০০০ (জুন–অক্টোবর) + ৩টি এককালীন অবদান ⚠️D-49 */
  { goal: 'jg02', memberId: 'm1', pledged: 1000000, paid: 1000000, install: 200000, joinedAt: '2026-06-02', status: 'active', approvedBy: 'নাসরিন আক্তার' },
  { goal: 'jg02', memberId: 'm2', pledged: 1000000, paid: 1000000, install: 200000, joinedAt: '2026-06-02', status: 'active', approvedBy: 'নাসরিন আক্তার', extra: [{ at: '2026-10-12', amt: 100000, note: 'এককালীন অনুমতি ⚠️D-49' }] },
  { goal: 'jg02', memberId: 'm3', pledged: 1000000, paid: 1000000, install: 200000, joinedAt: '2026-06-03', status: 'active', approvedBy: 'নাসরিন আক্তার' },
  { goal: 'jg02', memberId: 'm4', pledged: 1000000, paid: 1000000, install: 200000, joinedAt: '2026-06-03', status: 'active', approvedBy: 'মোঃ আব্দুল্লাহ' },
  { goal: 'jg02', memberId: 'm5', pledged: 1000000, paid: 1000000, install: 200000, joinedAt: '2026-06-04', status: 'active', approvedBy: 'মোঃ আব্দুল্লাহ', extra: [{ at: '2026-10-18', amt: 100000, note: 'লক্ষ্য পূরণে সহায়ক অবদান ⚠️D-49' }] },
  { goal: 'jg02', memberId: 'm6', pledged: 1000000, paid: 1000000, install: 200000, joinedAt: '2026-06-04', status: 'active', approvedBy: 'মোঃ আব্দুল্লাহ', extra: [{ at: '2026-10-22', amt: 50000, note: 'এককালীন অনুমতি ⚠️D-49' }] },
  { goal: 'jg02', memberId: 'm7', pledged: 1000000, paid: 1000000, install: 200000, joinedAt: '2026-06-06', status: 'active', approvedBy: 'নাসরিন আক্তার' },
  { goal: 'jg02', memberId: 'm8', pledged: 1000000, paid: 1000000, install: 200000, joinedAt: '2026-06-06', status: 'active', approvedBy: 'নাসরিন আক্তার' },

  /* jg03 · ঈদ সামগ্রী · নির্দিষ্ট মাসিক ৳১,০০০ (ফেব–জুন) · মেয়াদোত্তীর্ণ ⚠️D-39 */
  { goal: 'jg03', memberId: 'm1', pledged: 500000, paid: 500000, install: 100000, joinedAt: '2026-02-03', status: 'active', approvedBy: 'মোঃ আব্দুল্লাহ', extra: [{ at: '2026-06-08', amt: 200000, note: 'মেয়াদের শেষ সপ্তাহে অতিরিক্ত অবদান ⚠️D-49' }] },
  { goal: 'jg03', memberId: 'm2', pledged: 500000, paid: 500000, install: 100000, joinedAt: '2026-02-03', status: 'active', approvedBy: 'মোঃ আব্দুল্লাহ' },
  { goal: 'jg03', memberId: 'm3', pledged: 500000, paid: 500000, install: 100000, joinedAt: '2026-02-04', status: 'active', approvedBy: 'মোঃ আব্দুল্লাহ' },
  { goal: 'jg03', memberId: 'm4', pledged: 500000, paid: 500000, install: 100000, joinedAt: '2026-02-04', status: 'active', approvedBy: 'নাসরিন আক্তার', extra: [{ at: '2026-06-10', amt: 200000, note: 'এককালীন অনুমতি ⚠️D-49' }] },
  { goal: 'jg03', memberId: 'm5', pledged: 500000, paid: 500000, install: 100000, joinedAt: '2026-02-05', status: 'active', approvedBy: 'নাসরিন আক্তার', extra: [{ at: '2026-06-12', amt: 150000, note: 'এককালীন অনুমতি ⚠️D-49' }] },
  { goal: 'jg03', memberId: 'm6', pledged: 500000, paid: 500000, install: 100000, joinedAt: '2026-02-05', status: 'active', approvedBy: 'মোঃ আব্দুল্লাহ', extra: [{ at: '2026-06-14', amt: 150000, note: 'এককালীন অনুমতি ⚠️D-49' }] },
  { goal: 'jg03', memberId: 'm7', pledged: 500000, paid: 200000, install: 100000, joinedAt: '2026-02-06', status: 'removed', approvedBy: 'মোঃ আব্দুল্লাহ', removedAt: '2026-04-20', removeReason: 'টানা ২ মাস অবদান নেই · কমিটির সিদ্ধান্ত CM-2604-03 · ফেরত প্রাপ্য সংরক্ষিত' },
  { goal: 'jg03', memberId: 'm8', pledged: 500000, paid: 300000, install: 100000, joinedAt: '2026-02-06', status: 'behind', approvedBy: 'নাসরিন আক্তার', step: 'committee', noticeSent: '2026-06-02' },

  /* jg04 · মিলনায়তন · আমন্ত্রণ ও যোগদান অনুমোদনের অপেক্ষায় ⚠️D-49 */
  { goal: 'jg04', memberId: 'm2', pledged: 5000000, paid: 1000000, install: 1000000, joinedAt: '2026-10-04', status: 'active', approvedBy: 'কামরুল হাসান' },
  { goal: 'jg04', memberId: 'm5', pledged: 3000000, paid: 1500000, install: 1500000, joinedAt: '2026-10-04', status: 'active', approvedBy: 'কামরুল হাসান' },
  { goal: 'jg04', memberId: 'm1', pledged: 4000000, paid: 0, install: 500000, joinedAt: '2026-10-06', status: 'pending', approvedBy: null },
  { goal: 'jg04', memberId: 'm3', pledged: 2500000, paid: 0, install: 500000, joinedAt: '2026-10-08', status: 'pending', approvedBy: null },
  { goal: 'jg04', memberId: 'm4', pledged: 6000000, paid: 0, install: 1000000, joinedAt: '2026-10-11', status: 'pending', approvedBy: null },
  { goal: 'jg04', memberId: 'm6', pledged: null, paid: 0, install: null, joinedAt: null, status: 'invited', invitedAt: '2026-10-02', invitedBy: 'কামরুল হাসান', channel: 'sms' },
  { goal: 'jg04', memberId: 'm7', pledged: null, paid: 0, install: null, joinedAt: null, status: 'invited', invitedAt: '2026-10-02', invitedBy: 'কামরুল হাসান', channel: 'sms' },
  { goal: 'jg04', memberId: 'm8', pledged: null, paid: 0, install: null, joinedAt: null, status: 'invited', invitedAt: '2026-10-02', invitedBy: 'কামরুল হাসান', channel: 'call' },

  /* jg05 · শিক্ষা কেন্দ্র · সম্পন্ন ও নিষ্পত্তি (নভে'২৫–মার্চ'২৬) */
  { goal: 'jg05', memberId: 'm1', pledged: 500000, paid: 500000, install: 100000, joinedAt: '2025-11-03', status: 'active', approvedBy: 'মোঃ আব্দুল্লাহ' },
  { goal: 'jg05', memberId: 'm2', pledged: 500000, paid: 500000, install: 100000, joinedAt: '2025-11-03', status: 'active', approvedBy: 'মোঃ আব্দুল্লাহ', extra: [{ at: '2026-02-20', amt: 500000, note: 'লক্ষ্য পূরণে এককালীন অবদান ⚠️D-49' }] },
  { goal: 'jg05', memberId: 'm3', pledged: 500000, paid: 500000, install: 100000, joinedAt: '2025-11-04', status: 'active', approvedBy: 'মোঃ আব্দুল্লাহ', extra: [{ at: '2026-02-25', amt: 300000, note: 'এককালীন অনুমতি ⚠️D-49' }] },
  { goal: 'jg05', memberId: 'm4', pledged: 500000, paid: 500000, install: 100000, joinedAt: '2025-11-04', status: 'active', approvedBy: 'নাসরিন আক্তার' },
  { goal: 'jg05', memberId: 'm5', pledged: 500000, paid: 500000, install: 100000, joinedAt: '2025-11-05', status: 'active', approvedBy: 'নাসরিন আক্তার' },
  { goal: 'jg05', memberId: 'm6', pledged: 500000, paid: 500000, install: 100000, joinedAt: '2025-11-05', status: 'active', approvedBy: 'মোঃ আব্দুল্লাহ', extra: [{ at: '2026-03-02', amt: 200000, note: 'এককালীন অনুমতি ⚠️D-49' }] },
  { goal: 'jg05', memberId: 'm7', pledged: 500000, paid: 500000, install: 100000, joinedAt: '2025-11-06', status: 'active', approvedBy: 'মোঃ আব্দুল্লাহ' },
  { goal: 'jg05', memberId: 'm8', pledged: 500000, paid: 500000, install: 100000, joinedAt: '2025-11-06', status: 'active', approvedBy: 'নাসরিন আক্তার' },
];

/* ---- goal_disbursements: লক্ষ্য অর্জনের পর অর্থ ব্যবহার/বিতরণ (প্রমাণ বাধ্যতামূলক, BR-19) ---- */
const JG_DISB = [
  { goal: 'jg02', no: 'JD-2611-0001', purpose: '২টি গভীর নলকূপ স্থাপন ও মেশিন ক্রয়', payee: 'মেসার্স খুলনা ড্রিলিং এন্টারপ্রাইজ',
    payeeType: 'vendor', amount: 7800000, at: '2026-11-08', status: 'approval', channel: 'bank',
    committee: 'CM-2611-03', decision: 'ভেন্ডর পেমেন্ট অগ্রাধিকার ⚠️D-50', by: 'সুমি রানী দাস', appr: null,
    evidence: ['চালান · inv-KDE-2291', 'কমিটির সিদ্ধান্ত · CM-2611-03', 'দরপত্র তুলনা · ৩টি'], otp: false,
    note: 'maker ≠ checker (BR-04) · অনুমোদন সীমা ⚠️D-22 · প্রমাণ ছাড়া অর্থ ছাড়া হবে না' },
  { goal: 'jg02', no: 'JD-2611-0002', purpose: 'পরিবহন, সেটআপ ও প্রথম বছরের রক্ষণাবেক্ষণ', payee: 'স্থানীয় পরিবহন ও মিস্ত্রি খরচ',
    payeeType: 'member_hand', amount: 450000, at: '2026-11-20', status: 'planned', channel: 'cash_office',
    committee: 'CM-2611-03', decision: 'দায়িত্বপ্রাপ্ত সদস্যের হাতে — প্রমাণ ও সাক্ষী বাধ্যতামূলক ⚠️D-50', by: null, appr: null,
    evidence: [], otp: false, note: 'প্রথম ভাউচার সম্পন্ন হলে প্রস্তুত হবে' },
  { goal: 'jg03', no: 'JD-2607-0001', purpose: 'আনুপাতিক ফেরত — ৮ জন অংশগ্রহণকারীকে তাদের অবদান ফেরত', payee: 'অংশগ্রহণকারী (আনুপাতিক হারে)',
    payeeType: 'refund', amount: 4200000, at: '2026-11-10', status: 'approval', channel: 'bkash',
    committee: 'CM-2607-02', decision: 'মেয়াদোত্তীর্ণ লক্ষ্যে আনুপাতিক ফেরত ⚠️D-39', by: 'সুমি রানী দাস', appr: null,
    evidence: ['কমিটির সিদ্ধান্ত · CM-2607-02', 'ফেরত ছক (সদস্যভিত্তিক)', 'নোটিশ প্রমাণ · ৮টি'], otp: false,
    note: 'ব্যক্তিগত উত্তোলন নয় — লক্ষ্য ব্যর্থ হওয়ায় নিষ্পত্তির অংশ (BR-19)' },
  { goal: 'jg05', no: 'JD-2603-0001', purpose: '৫টি কম্পিউটার ও মনিটর ক্রয়', payee: 'মেসার্স কম্পিউটার সেন্টার, খুলনা',
    payeeType: 'vendor', amount: 4500000, at: '2026-03-08', status: 'paid', channel: 'bank',
    committee: 'CM-2602-01', decision: 'ভেন্ডর পেমেন্ট ⚠️D-50', by: 'সুমি রানী দাস', appr: 'নাসরিন আক্তার',
    evidence: ['চালান · inv-CS-8821', 'স্থাপনার ছবি · ৪টি', 'কমিটির সিদ্ধান্ত · CM-2602-01'], otp: true, hash: 'b71e04c9' },
  { goal: 'jg05', no: 'JD-2603-0002', purpose: 'পরিবহন, ইন্টারনেট সংযোগ ও সেটআপ', payee: 'স্থানীয় সরবরাহকারী ও সংযোগকারী',
    payeeType: 'vendor', amount: 500000, at: '2026-03-11', status: 'paid', channel: 'cash_office',
    committee: 'CM-2602-01', decision: 'ভেন্ডর পেমেন্ট ⚠️D-50', by: 'সুমি রানী দাস', appr: 'নাসরিন আক্তার',
    evidence: ['রসিদ · ৩টি', 'সেটআপ সনদ'], otp: true, hash: 'c09a5e17' },
];

/* সদস্য-পক্ষ: আব্দুল করিম (m1) */
const JG_ME = 'm1';

/* ---------- Goal Progress Engine: অবদানের রেকর্ড ও মাইলস্টোন ছক থেকে গণনা ---------- */
function jgGoal(id) { return JG_GOALS.filter(g => g.id === id)[0] || null; }
function jgParts(gid, st) { const l = JG_PARTS.filter(p => p.goal === gid); return st ? l.filter(p => p.status === st) : l; }
function jgPart(gid, mid) { return JG_PARTS.filter(p => p.goal === gid && p.memberId === mid)[0] || null; }
function jgLabel(arr, k) { const h = arr.filter(x => x[0] === k)[0]; return h ? h[1] : k; }
function jgChanLabel(k) { const h = JG_CHANNEL.filter(x => x.k === k)[0]; return h ? h.t : k; }
function jgStepLabel(k) { return jgLabel(JG_STEP, k); }

/* লক্ষ্যের এখন পর্যন্ত প্রাপ্য মাসগুলোর তারিখ (প্রতি মাসে payDay) */
function jgDates(g) {
  const out = [], st = new Date(g.start);
  const tiso = TODAY.getFullYear() + '-' + String(TODAY.getMonth() + 1).padStart(2, '0') + '-' + String(TODAY.getDate()).padStart(2, '0');
  const lim = g.targetDate < tiso ? g.targetDate : tiso;
  let y = st.getFullYear(), m = st.getMonth();
  for (let i = 0; i < 60; i++) {
    const ds = y + '-' + String(m + 1).padStart(2, '0') + '-' + String(g.payDay).padStart(2, '0');
    if (ds > lim) break;
    out.push(ds);
    m++; if (m > 11) { m = 0; y++; }
  }
  return out;
}
/* লক্ষ্যের মোট মেয়াদ (মাস) — নমনীয় ছকের অগ্রগতির হার হিসাবের জন্য */
function jgTotalMonths(g) {
  const a = new Date(g.start), b = new Date(g.targetDate);
  return Math.max(1, (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth()) + 1);
}
function jgElapsedMonths(g) { return jgDates(g).length; }

/* একজন অংশগ্রহণকারীর অবদানের ছক (তারিখ + অঙ্ক) — নিয়মের সীমার ভেতরে ভাগ করা */
function jgSchedule(paid, dates, install) {
  const out = []; let left = paid || 0;
  for (let i = 0; i < dates.length && left > 0; i++) {
    const amt = Math.min(install || left, left);
    out.push({ at: dates[i], amt: amt });
    left -= amt;
  }
  if (left > 0 && out.length) out[out.length - 1].amt += left;
  return out;
}
/* goal_contributions — রসিদ নম্বর JC-YYMM-#### প্রতি মাসে সব লক্ষ্য মিলিয়ে অনন্য (BR-08) */
const JG_CONTRIBS = (function build() {
  const rows = [], seq = {};
  JG_GOALS.forEach(g => {
    const dates = jgDates(g);
    jgParts(g.id).forEach(p => {
      const items = jgSchedule(p.paid, dates, p.install);
      (p.extra || []).forEach(x => items.push({ at: x.at, amt: x.amt, note: x.note }));
      items.forEach(it => {
        const ym = it.at.slice(2, 4) + it.at.slice(5, 7);
        seq[ym] = (seq[ym] || 0) + 1;
        rows.push({
          goal: g.id, memberId: p.memberId, amount: it.amt, at: it.at,
          receipt: 'JC-' + ym + '-' + String(seq[ym]).padStart(4, '0'),
          channel: (it.at.slice(5, 7) === '06' ? 'bkash' : (p.memberId === 'm2' || p.memberId === 'm5') ? 'cash_office' : 'bank'),
          by: (g.join === 'open' ? 'রাজু আহমেদ' : 'অফিস কাউন্টার · সুমি রানী দাস'),
          note: it.note || null, txn: 'TXN-' + it.at.slice(2, 4) + it.at.slice(5, 7) + '-' + String(seq[ym]).padStart(4, '0'),
        });
      });
    });
  });
  return rows.sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : (a.receipt < b.receipt ? -1 : 1)));
})();
function jgContribs(gid, mid) {
  return JG_CONTRIBS.filter(c => c.goal === gid && (!mid || c.memberId === mid));
}
function jgCollected(gid) { return jgContribs(gid).reduce((s, c) => s + c.amount, 0); }
function jgPct(gid) { const g = jgGoal(gid); return Math.round(jgCollected(gid) / g.target * 100); }
function jgGap(gid) { const g = jgGoal(gid); return Math.max(0, g.target - jgCollected(gid)); }
function jgPledgeTotal(gid) { return jgParts(gid).reduce((s, p) => s + (p.pledged || 0), 0); }
function jgContributed(gid, mid) { return jgContribs(gid, mid).reduce((s, c) => s + c.amount, 0); }
/* আজ পর্যন্ত প্রত্যাশিত অবদান (নির্দিষ্ট নিয়ম = মাস × অঙ্ক; নমনীয় = প্রতিশ্রুতির আনুপাতিক হার) */
function jgExpectedNow(g, p) {
  if (!p || !p.pledged) return 0;
  if (g.crule === 'fixed') return Math.min(p.pledged, jgElapsedMonths(g) * g.monthly);
  return Math.min(p.pledged, Math.round(p.pledged * jgElapsedMonths(g) / jgTotalMonths(g)));
}
function jgPartGap(g, p) { return Math.max(0, jgExpectedNow(g, p) - jgContributed(g.id, p.memberId)); }
/* বকেয়া তালিকা (JA-06) */
function jgArrears(gid) {
  const g = jgGoal(gid);
  return jgParts(gid).filter(p => p.status === 'active' || p.status === 'behind')
    .map(p => ({ p: p, mem: member(p.memberId), expected: jgExpectedNow(g, p), paid: jgContributed(g.id, p.memberId), gap: jgPartGap(g, p) }))
    .filter(x => x.gap > 0).sort((a, b) => b.gap - a.gap);
}
function jgAllArrears() {
  const out = [];
  JG_GOALS.forEach(g => { if (g.status === 'active' || g.status === 'expired' || g.status === 'forming') jgArrears(g.id).forEach(x => out.push(Object.assign({ goal: g }, x))); });
  return out;
}
/* মাইলস্টোন — goal_contributions থেকে গণনা (হাতে লেখা নয়) ⚠️D-68 */
function jgMilestones(gid) {
  const g = jgGoal(gid); const cs = jgContribs(gid).slice().sort((a, b) => (a.at < b.at ? -1 : 1));
  let cum = 0; const hit = {};
  cs.forEach(c => {
    cum += c.amount;
    const pct = cum / g.target * 100;
    JG_MS.forEach(m => { if (!hit[m] && pct >= m) hit[m] = { pct: m, reachedAt: c.at, notified: m < 100 }; });
  });
  return JG_MS.map(m => hit[m] || { pct: m, reachedAt: null, notified: false });
}
function jgNextMilestone(gid) { return jgMilestones(gid).filter(x => !x.reachedAt)[0] || null; }
function jgAchievedAt(gid) { const h = jgMilestones(gid).filter(x => x.pct === 100 && x.reachedAt)[0]; return h ? h.reachedAt : null; }
function jgDaysLeft(gid) {
  const g = jgGoal(gid); const a = TODAY, b = new Date(g.targetDate);
  return Math.round((b - a) / 86400000);
}
function jgDisb(gid) { return JG_DISB.filter(x => x.goal === gid); }
function jgActive() { return JG_GOALS.filter(g => g.status !== 'closed'); }
function jgLimitLeft() { return Math.max(0, JG_LIMIT.goals - jgActive().length); }
/* সদস্য-পক্ষ */
function jgMyParts() {
  return JG_PARTS.filter(p => p.memberId === JG_ME).map(p => ({
    goal: jgGoal(p.goal), part: p, paid: jgContributed(p.goal, JG_ME), gap: jgPartGap(jgGoal(p.goal), p),
  }));
}
function jgMyMain() {
  const mine = jgMyParts().filter(x => x.goal.status === 'active' || x.goal.status === 'forming' || x.goal.status === 'expired');
  return mine.sort((a, b) => (a.goal.targetDate < b.goal.targetDate ? -1 : 1))[0] || jgMyParts()[0] || null;
}
/* মেয়াদোত্তীর্ণ লক্ষ্যের আনুপাতিক ফেরত ছক ⚠️D-39 */
function jgRefundPlan(gid) {
  const rows = jgParts(gid).filter(p => jgContributed(gid, p.memberId) > 0)
    .map(p => ({ mem: member(p.memberId), part: p, amt: jgContributed(gid, p.memberId) }));
  const total = rows.reduce((s, r) => s + r.amt, 0);
  return { rows: rows, total: total };
}
/* দিন/মাস সমাপ্তির গেটে অমীমাংসিত এন্ট্রি (BR-25) */
/* দিন/মাস সমাপ্তির গেটে আটকানো অমীমাংসিত এন্ট্রি (BR-25) */
function jgPendingList() {
  const out = [];
  JG_DISB.filter(x => x.status === 'approval').forEach(x => out.push({ kind: 'বিতরণ অনুমোদন', goal: jgGoal(x.goal), ref: x.no, amt: x.amount, since: x.at }));
  JG_PARTS.filter(p => p.status === 'pending').forEach(p => out.push({ kind: 'যোগদান অনুমোদন ⚠️D-49', goal: jgGoal(p.goal), ref: member(p.memberId).name, amt: p.pledged, since: p.joinedAt }));
  JG_GOALS.filter(g => g.status === 'settling' && !g.settleAppr).forEach(g => out.push({ kind: 'নিষ্পত্তি অনুমোদন ⚠️D-39', goal: g, ref: g.committee, amt: jgCollected(g.id), since: g.targetDate }));
  return out;
}
function jgPending() { return jgPendingList().length; }

/* ============================================================
   Qard Hasanah (কর্জে হাসানা) — মডিউল ৪ · Phase 2B/3A
   স্পেক: specs/03 §৮.৪ (QA-01…QA-17 · QM-01…QM-08) · §৭ Eligibility Engine (৪ স্তর) · §৩.৪ Loan Schedule Engine
   ভাষা: "কর্জে হাসানা · সুদমুক্ত সহায়তা · মূলধন পরিশোধ" · রঙ: কমলা/অ্যাম্বার · ইসলামিক স্কিন data-theme="qh"
   নিষিদ্ধ শব্দ: "সুদ", "ইন্টারেস্ট", "মুনাফা", "ঋণের দাম" — কোথাও নয় (BR-20) · প্রতিটি অঙ্কের পাশে "সুদ ৳০"
   হিসাব: সম্পদ — কর্জে হাসানা আদায়যোগ্য · শুধু মূলধন বিভাজন, সুদ নেই · write-off = ক্ষতি (দায় মেটে না)
   নিয়ম: BR-20 সুদ ৳০ · BR-21 active সদস্য + snapshot অপরিবর্তনীয় · BR-22 maker≠checker + OTP + কমিটি রেফারেন্স
         BR-23 write-off শুধু ORG_ADMIN + কমিটি + নিরীক্ষক অ্যালার্ট · BR-04 নিয়ম-পরিবর্তনকারী অনুমোদন করবেন না
   অমীমাংসিত: ⚠️D-40 (ফান্ড উৎস) · D-41 (ফি/বিলম্ব ফি) · D-44 (শ্রেণিকরণ ও write-off) · D-45 (সীমা + কমিটি)
             · D-51 (জানালা/কোটা) · D-52 (অগ্রাধিকার) · D-53 (পরিশোধ ধরন) · D-54 (আর্থিক থ্রেশহোল্ড)
             · D-57 (ভার্শন + Simulation) · D-58 (নথি/গ্যারান্টার) · D-59 (ম্যানুয়াল এক্সেপশন) · D-69 (উদ্দেশ্য ও প্রভাব)
   সব অঙ্ক পয়সায় (MEMBERS-এর একক) — tk() দিয়ে প্রদর্শন।
   ============================================================ */
const QH_ME = 'm1';
const QH_LIMIT = { activeLoans: 1, activeApps: 1, monthlyQuota: 12 };   /* ⚠️D-51 ডিফল্ট */
const QH_SLA_DAYS = 5;                                                   /* পর্যালোচনা SLA (কার্যদিবস) */
const QH_FEE = 'none';                                                   /* ⚠️D-41 ডিফল্ট: কোনো ফি/বিলম্ব ফি নেই → সুদ ৳০ */

/* ── অভিধান (অবজেক্ট → CHIP(dict,k)) ── */
const QH_APP_ST = {
  draft:     { t: 'খসড়া', c: 'chip-neutral', i: 'edit' },
  screening: { t: 'যোগ্যতা যাচাই', c: 'chip-info', i: 'shield' },
  review:    { t: 'পর্যালোচনায়', c: 'chip-warn', i: 'eye' },
  returned:  { t: 'তথ্য চেয়ে ফেরত', c: 'chip-warn', i: 'send' },
  approved:  { t: 'অনুমোদিত', c: 'chip-ok', i: 'checkc' },
  rejected:  { t: 'প্রত্যাখ্যাত', c: 'chip-danger', i: 'xc' },
  withdrawn: { t: 'সদস্য প্রত্যাহৃত', c: 'chip-neutral', i: 'x' },
  disbursed: { t: 'বিতরণ সম্পন্ন', c: 'chip-ok', i: 'cash' },
};
const QH_LOAN_ST = {
  pending:   { t: 'বিতরণ বাকি', c: 'chip-warn', i: 'clock' },
  active:    { t: 'চলমান', c: 'chip-info', i: 'refresh' },
  arrears:   { t: 'বকেয়া ⚠️D-44', c: 'chip-danger', i: 'warn' },
  closed:    { t: 'সম্পূর্ণ পরিশোধিত', c: 'chip-ok', i: 'checkc' },
  writeoff:  { t: 'ছেড়ে দেওয়া (ক্ষতি)', c: 'chip-neutral', i: 'trash' },
};
const QH_SEV = {
  block: { t: 'ব্লকিং — আবেদন হবে না', c: 'chip-danger', i: 'xc' },
  warn:  { t: 'সতর্কতা — ম্যানুয়াল পর্যালোচনা বাধ্যতামূলক', c: 'chip-warn', i: 'warn' },
};
const QH_SRC = {
  rule:              { t: 'স্বয়ংক্রিয় নিয়ম', c: 'chip-info', i: 'shield' },
  manual:            { t: 'Admin ম্যানুয়াল তালিকা', c: 'chip-neutral', i: 'users' },
  manual_exception:  { t: 'ম্যানুয়াল এক্সেপশন ⚠️D-59', c: 'chip-warn', i: 'star' },
};
const QH_ELIG = {
  eligible:    { t: 'যোগ্য', c: 'chip-ok', i: 'checkc' },
  conditional: { t: 'শর্তসাপেক্ষ', c: 'chip-warn', i: 'warn' },
  blocked:     { t: 'এখন আবেদন করা যাবে না', c: 'chip-neutral', i: 'lock' },
};
const QH_VERDICT = {
  approve: { t: 'অনুমোদন', c: 'chip-ok', i: 'checkc' },
  reject:  { t: 'প্রত্যাখ্যান', c: 'chip-danger', i: 'xc' },
  return:  { t: 'তথ্য চেয়ে ফেরত', c: 'chip-warn', i: 'send' },
};
const QH_CLASS = {                                  /* পোর্টফোলিও শ্রেণিকরণ ⚠️D-44 */
  regular: { t: 'নিয়মিত', c: 'chip-ok', i: 'check' },
  watch:   { t: 'বকেয়া ১–৩০ দিন', c: 'chip-warn', i: 'clock' },
  late:    { t: 'বিলম্বিত ৩১–৯০ দিন', c: 'chip-warn', i: 'warn' },
  doubt:   { t: 'সন্দেহজনক ৯১–১৮০ দিন', c: 'chip-danger', i: 'warn' },
  loss:    { t: 'ক্ষতিগ্রস্ত ১৮০+ দিন', c: 'chip-danger', i: 'trash' },
};
const QH_DISB_ST = {
  planned:  { t: 'বিতরণ প্রস্তুত', c: 'chip-info', i: 'clock' },
  approval: { t: 'অনুমোদনের অপেক্ষায়', c: 'chip-warn', i: 'shield' },
  otp:      { t: 'OTP যাচাই বাকি', c: 'chip-warn', i: 'phone' },
  paid:     { t: 'বিতরণ সম্পন্ন', c: 'chip-ok', i: 'cash' },
};

/* ── অভিধান (অ্যারে → qhLabel/CHIP2) ── */
const QH_LAYER = [
  ['gate', 'স্তর ১ · গেট — সিস্টেমে চলবে কি না'],
  ['scope', 'স্তর ২ · পরিসর — লক্ষ্যদলে আছেন কি না'],
  ['financial', 'স্তর ৩ · আর্থিক — সমিতির কাছে কী প্রমাণ আছে'],
  ['window', 'স্তর ৪ · জানালা ও কোটা — এখন সুযোগ আছে কি না'],
];
const QH_PURPOSE = [                                    /* উদ্দেশ্য-ক্যাটাগরি ⚠️D-69 */
  ['medical', 'চিকিৎসা ও ওষুধ'],
  ['education', 'শিক্ষা ও পরীক্ষার ফি'],
  ['disaster', 'দুর্যোগ পুনরুদ্ধার'],
  ['livelihood', 'ক্ষুদ্র ব্যবসা / কৃষি উপকরণ'],
  ['family', 'পারিবারিক প্রয়োজন'],
  ['shelter', 'গৃহ মেরামত'],
];
const QH_REPAY = [                                      /* পরিশোধের ধরন ⚠️D-53 */
  ['equal', 'সমান মাসিক কিস্তি'],
  ['lump', 'মেয়াদ শেষে এককালীন'],
  ['flexible', 'নমনীয় (যেকোনো সময় যেকোনো অঙ্ক)'],
];
const QH_CHANNEL = [
  { k: 'cash', t: 'নগদ (অফিস/মাঠ)' }, { k: 'bank', t: 'ব্যাংক খাত' },
  { k: 'wallet', t: 'মোবাইল ওয়ালেট' }, { k: 'gs', t: 'সদস্যের GS অ্যাকাউন্ট থেকে স্থানান্তর' },
];
const QH_DOC = [                                        /* প্রয়োজনীয় নথি ⚠️D-58 */
  ['nid', 'NID যাচাই (প্রোফাইলে সংরক্ষিত)'],
  ['purpose', 'উদ্দেশ্যের প্রমাণ (প্রেসক্রিপশন / ভর্তি স্লিপ / কোটেশন)'],
  ['income', 'আয়ের তথ্য বা পরিবারের আয়-ব্যয় ধারণা'],
  ['ref', 'সুপারিশপত্র (সমিতির সদস্য বা স্থানীয় জনপ্রতিনিধি)'],
  ['photo', 'ছবি (ক্যামেরা/ফাইল — মান স্বয়ংক্রিয়ভাবে বসবে না)'],
];
const QH_STEP = [
  ['submit', 'আবেদন জমা'], ['screen', 'যোগ্যতা যাচাই (স্ন্যাপশট)'], ['review', 'কমিটি/ব্যবস্থাপক পর্যালোচনা'],
  ['decision', 'সিদ্ধান্ত (maker ≠ checker)'], ['disburse', 'বিতরণ + রসিদ'], ['repay', 'মূলধন পরিশোধ'], ['close', 'সমাপ্তি ও সনদ'],
];

/* ── কারণ-কোড (§৭.৪) — সদস্যকে সম্মান রক্ষা করে বাক্য + প্রতিকার ── */
const QH_BLOCK = {
  'QH-B-01': { m: 'আপনার সদস্যপদ এখন সক্রিয় নয়। সমিতির সাথে যোগাযোগ করুন।', a: 'সদস্য নিষ্ক্রিয়/বহিষ্কৃত', fix: '' },
  'QH-B-02': { m: 'এই মুহূর্তে আবেদন গ্রহণ বন্ধ আছে। পরবর্তী জানালা: ১ নভেম্বর ২০২৬।', a: 'জানালা বন্ধ', fix: 'পরবর্তী জানালায় আবেদন করা যাবে।' },
  'QH-B-03': { m: 'এই সহায়তায় আপনার এলাকা/গ্রুপ এখনো অন্তর্ভুক্ত নয়।', a: 'পরিসর বহির্ভূত', fix: 'Admin যোগ্য তালিকায় যোগ করলে আবেদন করা যাবে।' },
  'QH-B-04': { m: 'আপনার সঞ্চয়ে ৳১,০২০ বকেয়া আছে। পরিশোধ করলে আবেদন করতে পারবেন।', a: 'বকেয়া বিদ্যমান (সমাধানযোগ্য)', fix: 'বকেয়া ৳১,০২০ পরিশোধ করুন — জমা হলেই যোগ্যতা আবার যাচাই হবে।' },
  'QH-B-05': { m: 'আপনি কমপক্ষে ৬ মাস সদস্য হলে আবেদন করতে পারবেন।', a: 'সদস্যত্বকাল অপর্যাপ্ত ⚠️D-54', fix: '' },
  'QH-B-06': { m: 'আপনার একটি কর্জে হাসানা এখনো চলছে। পরিশোধ সম্পূর্ণ হলে আবার আবেদন করা যাবে।', a: 'সক্রিয় ঋণ (ডিফল্ট ১টি ⚠️D-51)', fix: 'চলমান সহায়তার বাকি কিস্তি সম্পূর্ণ পরিশোধ করুন।' },
  'QH-B-07': { m: 'আপনার পূর্ববর্তী সহায়তা পরিশোধে বিলম্ব হয়েছিল। বিস্তারিত জানতে সমিতির সাথে যোগাযোগ করুন।', a: 'পূর্ব ডিফল্ট/write-off ⚠️D-44', fix: 'কমিটির সিদ্ধান্ত ছাড়া নতুন আবেদন গ্রহণযোগ্য নয়।' },
  'QH-B-08': { m: 'এই মাসের আবেদন কোটা পূর্ণ হয়েছে। পরবর্তী জানালা: ১ নভেম্বর ২০২৬।', a: 'কোটা পূর্ণ ⚠️D-51', fix: 'পরের জানালায় অগ্রাধিকার দেওয়া হবে (ওয়েটলিস্ট ⚠️D-51)।' },
  'QH-B-09': { m: 'সহায়তা তহবিলে এখন পর্যাপ্ত অর্থ নেই। পরবর্তী বরাদ্দের অপেক্ষায় আছি।', a: 'ফান্ড পুল অপর্যাপ্ত ⚠️D-40', fix: '' },
  'QH-B-10': { m: 'প্রয়োজনীয় নথি আপনার প্রোফাইলে নেই (NID যাচাই বাকি)।', a: 'নথি অসম্পূর্ণ ⚠️D-58', fix: 'NID যাচাই ও উদ্দেশ্যের প্রমাণ জমা দিন।' },
};
const QH_WARN = {
  'QH-W-01': { m: 'আপনার নিয়মিত জমার ধারা দুর্বল — আবেদন জমা দেওয়া যাবে, তবে ম্যানুয়াল পর্যালোচনা হবে।', a: 'জমার ধারা দুর্বল ⚠️D-52', fix: '' },
  'QH-W-02': { m: 'আবেদিত অঙ্ক আপনার সীমার ৮০%-এর বেশি — কমিটি বিশেষভাবে দেখবে।', a: 'অঙ্ক সীমার ৮০%+', fix: '' },
  'QH-W-03': { m: 'একই মাসে দ্বিতীয় আবেদন — পর্যালোচনা বাধ্যতামূলক।', a: 'একই মাসে দ্বিতীয় আবেদন', fix: '' },
  'QH-W-04': { m: 'আবেদিত অঙ্ক তহবিল পুলের অবশিষ্টের ২০%-এর বেশি।', a: 'পুলের ২০%+ একক আবেদন', fix: '' },
  'QH-W-05': { m: 'Admin ম্যানুয়াল এক্সেপশন দিয়েছে (কমিটি রেফারেন্সসহ)।', a: 'ম্যানুয়াল এক্সেপশন ⚠️D-59', fix: '' },
  'QH-W-06': { m: 'নিয়ম পরিবর্তনের ৭ দিনের মধ্যে আবেদন — অতিরিক্ত পর্যালোচনা।', a: 'নিয়ম-পরিবর্তনের পরপরই আবেদন ⚠️D-57', fix: '' },
};

/* ── পণ্য (qh_products) ── */
const QH_PRODUCTS = [
  { id: 'qhp1', code: 'QHP-01', name: 'চিকিৎসা সহায়তা', module: 'qard_hasanah',
    purposes: ['medical', 'family'], min: 200000, max: 2500000, tenure: 12, repay: 'equal',
    grace: 30, fee: 'none', status: 'active', version: 3, since: '2026-01-05',
    note: 'সুদ ৳০ · কোনো সেবা চার্জ নেই (⚠️D-41) · শুধু মূলধন ফেরত', committee: 'CM-2601-02' },
  { id: 'qhp2', code: 'QHP-02', name: 'শিক্ষা সহায়তা', module: 'qard_hasanah',
    purposes: ['education'], min: 100000, max: 1500000, tenure: 10, repay: 'equal',
    grace: 15, fee: 'none', status: 'active', version: 2, since: '2026-06-01',
    note: 'সুদ ৳০ · পরীক্ষা/ভর্তি মৌসুমে অগ্রাধিকার (⚠️D-52)', committee: 'CM-2606-01' },
  { id: 'qhp3', code: 'QHP-03', name: 'দুর্যোগ ও জরুরি সহায়তা', module: 'qard_hasanah',
    purposes: ['disaster', 'shelter'], min: 100000, max: 1000000, tenure: 6, repay: 'lump',
    grace: 45, fee: 'none', status: 'window', version: 1, since: '2026-10-01',
    note: 'সুদ ৳০ · শুধু জানালা খোলা থাকলে (⚠️D-51) · এককালীন পরিশোধ (⚠️D-53)', committee: 'CM-2610-01' },
];

/* ── যোগ্যতার নিয়ম (qh_eligibility_rules · ৪ স্তর) ── */
const QH_RULES = [
  { id: 'r01', layer: 'gate', key: 'member_status_active', label: 'সদস্যের অবস্থা সক্রিয়', op: '=', value: 'active', sev: 'block', reason: 'QH-B-01', active: true, since: '2026-01-05' },
  { id: 'r02', layer: 'gate', key: 'window_open', label: 'আবেদন জানালা খোলা', op: '=', value: true, sev: 'block', reason: 'QH-B-02', active: true, since: '2026-01-05' },
  { id: 'r03', layer: 'gate', key: 'not_suspended_expelled', label: 'স্থগিত/বহিষ্কৃত নয়', op: '=', value: true, sev: 'block', reason: 'QH-B-01', active: true, since: '2026-01-05' },
  { id: 'r04', layer: 'scope', key: 'in_eligible_list', label: 'যোগ্য তালিকায় আছেন (স্বয়ংক্রিয় বা ম্যানুয়াল)', op: '=', value: true, sev: 'block', reason: 'QH-B-03', active: true, since: '2026-06-01' },
  { id: 'r05', layer: 'scope', key: 'exclusion_list', label: 'বাদ-তালিকায় নেই (সবার উপরে কাজ করে)', op: '=', value: false, sev: 'block', reason: 'QH-B-03', active: true, since: '2026-06-01' },
  { id: 'r06', layer: 'financial', key: 'min_membership_months', label: 'ন্যূনতম সদস্যত্বকাল', op: '>=', value: 6, unit: 'month', sev: 'block', reason: 'QH-B-05', active: true, since: '2026-01-05' },
  { id: 'r07', layer: 'financial', key: 'min_total_savings', label: 'ন্যূনতম মোট সঞ্চয় (GS)', op: '>=', value: 500000, unit: 'paisa', sev: 'block', reason: 'QH-B-04', active: true, since: '2026-01-05' },
  { id: 'r08', layer: 'financial', key: 'no_due_any_module', label: 'কোনো মডিউলে বকেয়া নেই (GS + ROSCA + JG)', op: '=', value: 0, unit: 'paisa', sev: 'block', reason: 'QH-B-04', active: true, since: '2026-06-01' },
  { id: 'r09', layer: 'financial', key: 'deposit_pattern', label: 'শেষ ৬ মাসের কমপক্ষে ৪ মাসে জমা', op: '>=', value: 4, unit: 'count', sev: 'warn', reason: 'QH-W-01', active: true, since: '2026-06-01' },
  { id: 'r10', layer: 'financial', key: 'prev_qh_cleared', label: 'পূর্ববর্তী কর্জে হাসানা সম্পূর্ণ পরিশোধিত', op: '=', value: true, sev: 'block', reason: 'QH-B-06', active: true, since: '2026-01-05' },
  { id: 'r11', layer: 'financial', key: 'max_pct_of_savings', label: 'সর্বোচ্চ অঙ্ক = মোট সঞ্চয়ের ৫০%', op: '<=', value: 50, unit: 'pct', sev: 'block', reason: 'QH-B-04', active: true, since: '2026-01-05' },
  { id: 'r12', layer: 'window', key: 'monthly_quota', label: 'মাসিক আবেদন কোটা (সমিতি)', op: '<=', value: 12, unit: 'count', sev: 'block', reason: 'QH-B-08', active: true, since: '2026-01-05' },
  { id: 'r13', layer: 'window', key: 'active_loans_per_member', label: 'এক সদস্যের সক্রিয় ঋণ সর্বোচ্চ ১টি', op: '<=', value: 1, unit: 'count', sev: 'block', reason: 'QH-B-06', active: true, since: '2026-01-05' },
  { id: 'r14', layer: 'window', key: 'pool_available', label: 'ফান্ড পুলে যথেষ্ট অঙ্ক (হল্ড বাদে)', op: '>=', value: 1, unit: 'paisa', sev: 'block', reason: 'QH-B-09', active: true, since: '2026-06-01' },
];

/* ── নিয়ম-ভার্শন (BR-14 অনুকরণ · ⚠️D-57) ── */
const QH_RULE_VERSIONS = [
  { id: 'v3', no: 3, validFrom: '2026-10-01', by: 'কামরুল হাসান (সমিতি প্রশাসক)', committee: 'CM-2610-01',
    changes: 'নতুন নিয়ম: কোনো মডিউলে বকেয়া নেই (r08) · পুলের হিসাব হল্ড বাদে (r14)', sim: { eligible: 3, newlyBlocked: 2, newlyEligible: 0, sample: 9 },
    note: 'Simulation আগে চালানো হয়েছে — ব্যক্তিগত তালিকা দেখানো হয়নি (⚠️D-57)' },
  { id: 'v2', no: 2, validFrom: '2026-06-01', by: 'কামরুল হাসান (সমিতি প্রশাসক)', committee: 'CM-2606-01',
    changes: 'যোগ্য তালিকা ও বাদ-তালিকা যোগ (r04/r05) · জমার ধারা সতর্কতা হিসেবে (r09)', sim: { eligible: 5, newlyBlocked: 1, newlyEligible: 2, sample: 9 },
    note: 'পুরোনো আবেদন পুরোনো নিয়মেই বিচারিত (BR-14 অনুকরণ ⚠️D-57)' },
  { id: 'v1', no: 1, validFrom: '2026-01-05', by: 'মোঃ আব্দুল্লাহ (ব্যবস্থাপক)', committee: 'CM-2601-02',
    changes: 'প্রাথমিক নিয়মসেট (৪ স্তর)', sim: { eligible: 6, newlyBlocked: 0, newlyEligible: 6, sample: 9 }, note: 'মডিউল চালুর প্রথম সংস্করণ · সংরক্ষিত Simulation স্ন্যাপশট (নমুনা ৯ সদস্য)' },
];

/* ── আবেদন জানালা ও কোটা (⚠️D-51) + ফান্ড পুল (⚠️D-40) ── */
const QH_WINDOW = {
  open: false, start: '2026-10-01', end: '2026-10-20',
  next: { start: '2026-11-01', end: '2026-11-15' },
  quota: { monthly: 12, used: 12, perBranch: { R1: 5, R2: 4, R3: 3 }, waitlist: 3 },
  pool: { allocated: 8000000, held: 1500000, source: 'সমিতির নিজস্ব তহবিল ৳৫০,০০০ + ওয়াকফ অনুদান ৳৩০,০০০ ⚠️D-40',
          note: 'সদস্যের সঞ্চয় থেকে নেওয়া হয় না — আলাদা ব্যাংক সাব-খাত (⚠️D-40)' },
};

/* ── যোগ্য সদস্য তালিকা (qh_eligible_members) ── */
const QH_ELIGIBLE = [
  { memberId: 'm1', result: 'blocked', source: 'rule', ruleVersion: 3, reasons: ['QH-B-04', 'QH-B-06'],
    maxAmount: 875000, evaluatedAt: '2026-10-29', validUntil: '2026-11-05',
    note: 'সঞ্চয়ে বকেয়া ৳১,০২০ + একটি সক্রিয় কর্জে হাসানা (৩টি কিস্তি বাকি)' },
  { memberId: 'm2', result: 'blocked', source: 'rule', ruleVersion: 3, reasons: ['QH-B-06'],
    maxAmount: 717500, evaluatedAt: '2026-10-29', validUntil: '2026-11-05',
    note: 'একটি সক্রিয় কর্জে হাসানা চলছে (QH-2605-0003) — ডিফল্ট সীমা ১টি (⚠️D-51); তাই বিচারাধীন আবেদন QHA-2610-0011 এগোবে না। পরিশোধ সম্পূর্ণ হলে সীমা ৳৭,১৭৫ প্রযোজ্য হবে' },
  { memberId: 'm3', result: 'blocked', source: 'rule', ruleVersion: 3, reasons: ['QH-B-10', 'QH-B-04'],
    maxAmount: 0, evaluatedAt: '2026-10-29', validUntil: '2026-11-05',
    note: 'KYC/NID যাচাই বাকি + সঞ্চয়ে বকেয়া ৳২,০৪০' },
  { memberId: 'm4', result: 'eligible', source: 'rule', ruleVersion: 3, reasons: [],
    maxAmount: 1800000, evaluatedAt: '2026-10-29', validUntil: '2026-11-05',
    note: 'সব শর্ত পূরণ · সীমা মোট সঞ্চয়ের ৫০% = ৳১৮,০০০ · অনুমোদিত আবেদন QHA-2610-0010 বিতরণ বাকি — বিতরণ হলে নতুন আবেদন QH-B-06-তে আটকাবে' },
  { memberId: 'm5', result: 'blocked', source: 'rule', ruleVersion: 3, reasons: ['QH-B-01', 'QH-B-04', 'QH-B-06', 'QH-W-01'],
    maxAmount: 0, evaluatedAt: '2026-10-29', validUntil: '2026-11-05',
    note: 'সদস্যপদ নিষ্ক্রিয় (ডরম্যান্ট) + সঞ্চয়ে বকেয়া ৳৫১০ + চলমান ঋণে ২টি কিস্তি বকেয়া (৪০ দিন) — শ্রেণি: বিলম্বিত ⚠️D-44' },
  { memberId: 'm6', result: 'blocked', source: 'rule', ruleVersion: 3, reasons: ['QH-B-06', 'QH-B-07'],
    maxAmount: 0, evaluatedAt: '2026-10-29', validUntil: '2026-11-05',
    note: 'পূর্ব সহায়তা ১১৪ দিন বিলম্বিত — write-off প্রস্তাব বিচারাধীন (BR-23) ⚠️D-44' },
  { memberId: 'm7', result: 'blocked', source: 'manual', ruleVersion: 3, reasons: ['QH-B-01', 'QH-B-04'],
    maxAmount: 0, evaluatedAt: '2026-10-29', validUntil: '2026-11-05',
    note: 'সদস্যপদ স্থগিত + সঞ্চয়ে বকেয়া ৳৩,০৬০ — আগের ম্যানুয়াল এক্সেপশন (কমিটি CM-2609-02, দুর্যোগে ক্ষতিগ্রস্ত) স্বয়ংক্রিয়ভাবে বাতিল; স্থগিতাদেশ উঠলে ও বকেয়া মিটলে পুনর্মূল্যায়ন হবে ⚠️D-59' },
  { memberId: 'm8', result: 'conditional', source: 'manual_exception', ruleVersion: 3, reasons: ['QH-B-05', 'QH-W-05'],
    maxAmount: 210000, evaluatedAt: '2026-10-26', validUntil: '2026-11-30',
    note: 'সদস্যত্বকাল ৩ মাস (নিয়ম QH-B-05: কমপক্ষে ৬ মাস) — ORG_ADMIN এক্সেপশন, কমিটি রেফারেন্স CM-2610-03 (⚠️D-59) · ম্যানুয়াল অনুমোদন বাধ্যতামূলক · সীমা মোট সঞ্চয়ের ৫০% = ৳২,১০০' },
  { memberId: 'm9', result: 'blocked', source: 'rule', ruleVersion: 3, reasons: ['QH-B-01', 'QH-B-07'],
    maxAmount: 0, evaluatedAt: '2026-10-29', validUntil: '2026-11-05',
    note: '২০২৬-০৯-১৮-এ write-off সম্পন্ন — নিরীক্ষক অ্যালার্ট আছে (⚠️D-44)' },
];

/* ── আবেদন (qh_applications) ── */
const QH_APPS = [
  { id: 'qa01', no: 'QHA-2602-0001', memberId: 'm1', product: 'qhp1', ruleVersion: 2, amount: 800000,
    purpose: 'medical', purposeText: 'স্ত্রীর অপারেশন — কেশবপুর স্বাস্থ্য কমপ্লেক্স', tenure: 8,
    status: 'disbursed', submittedAt: '2026-02-04', channel: 'office', docs: ['nid', 'purpose', 'income'],
    snapshot: { result: 'eligible', reasons: [], maxAmount: 875000, layer: { gate: 'pass', scope: 'pass', financial: 'pass', window: 'pass' } },
    decision: { verdict: 'approve', amount: 800000, at: '2026-02-09', by: 'মোঃ আব্দুল্লাহ (ব্যবস্থাপক)', appr: 'নাসরিন আক্তার (অনুমোদনকারী)', committee: 'CM-2602-01' },
    loan: 'qh01', sla: 5 },
  { id: 'qa02', no: 'QHA-2607-0005', memberId: 'm1', product: 'qhp1', ruleVersion: 2, amount: 1500000,
    purpose: 'medical', purposeText: 'নিজের চিকিৎসা ও ওষুধ (৩ মাস)', tenure: 6,
    status: 'disbursed', submittedAt: '2026-07-28', channel: 'app', docs: ['nid', 'purpose', 'ref'],
    snapshot: { result: 'eligible', reasons: ['QH-W-02'], maxAmount: 875000, layer: { gate: 'pass', scope: 'pass', financial: 'warn', window: 'pass' } },
    decision: { verdict: 'approve', amount: 875000, at: '2026-08-03', by: 'সুমি রানী দাস (হিসাবরক্ষক)', appr: 'নাসরিন আক্তার (অনুমোদনকারী)', committee: 'CM-2608-02',
      note: 'আবেদিত ৳১৫,০০০ → অনুমোদিত ৳৮,৭৫০ (সীমার ভেতরে) · সতর্কতা QH-W-02 ম্যানুয়াল পর্যালোচনা হয়েছে' },
    loan: 'qh04', sla: 4 },
  { id: 'qa03', no: 'QHA-2610-0009', memberId: 'm1', product: 'qhp2', ruleVersion: 3, amount: 500000,
    purpose: 'education', purposeText: 'মেয়ের ভর্তি ফি ও বই', tenure: 6,
    status: 'returned', submittedAt: '2026-10-14', channel: 'app', docs: ['nid'],
    snapshot: { result: 'blocked', reasons: ['QH-B-04', 'QH-B-06'], maxAmount: 875000, layer: { gate: 'pass', scope: 'pass', financial: 'block', window: 'pass' } },
    decision: { verdict: 'return', at: '2026-10-16', by: 'মোঃ আব্দুল্লাহ (ব্যবস্থাপক)',
      note: 'সঞ্চয়ের বকেয়া ৳১,০২০ পরিশোধ ও চলমান সহায়তার কিস্তি নিয়মিত হলে আবার জমা দেওয়া যাবে (⚠️D-54)' },
    need: ['purpose', 'income'], sla: 2 },
  { id: 'qa04', no: 'QHA-2610-0010', memberId: 'm4', product: 'qhp1', ruleVersion: 3, amount: 2000000,
    purpose: 'medical', purposeText: 'ভাইয়ের কিডনি চিকিৎসা — খুলনা মেডিকেল', tenure: 12,
    status: 'approved', submittedAt: '2026-10-06', channel: 'office', docs: ['nid', 'purpose', 'income', 'ref'],
    snapshot: { result: 'eligible', reasons: [], maxAmount: 1800000, layer: { gate: 'pass', scope: 'pass', financial: 'pass', window: 'pass' } },
    decision: { verdict: 'approve', amount: 1800000, at: '2026-10-11', by: 'সুমি রানী দাস (হিসাবরক্ষক)', appr: 'নাসরিন আক্তার (অনুমোদনকারী)', committee: 'CM-2610-04',
      note: 'maker ≠ checker ✓ · কমিটির লিখিত সিদ্ধান্ত ✓ · আবেদিত ৳২০,০০০ → অনুমোদিত ৳১৮,০০০ (সীমা)' },
    loan: 'qh05', sla: 5 },
  { id: 'qa05', no: 'QHA-2610-0011', memberId: 'm2', product: 'qhp2', ruleVersion: 3, amount: 900000,
    purpose: 'education', purposeText: 'ছেলের পরীক্ষার ফি ও কোচিং', tenure: 10,
    status: 'review', submittedAt: '2026-10-08', channel: 'app', docs: ['nid', 'purpose'],
    snapshot: { result: 'eligible', reasons: ['QH-W-02'], maxAmount: 717500, layer: { gate: 'pass', scope: 'pass', financial: 'warn', window: 'pass' } },
    reviewer: 'মোঃ আব্দুল্লাহ (ব্যবস্থাপক)', sla: 5, slaBreached: true,
    note: 'SLA লঙ্ঘন: ৫ কার্যদিবসের জায়গায় ১৬ দিন ধরে পর্যালোচনায়' },
  { id: 'qa06', no: 'QHA-2610-0012', memberId: 'm3', product: 'qhp3', ruleVersion: 3, amount: 400000,
    purpose: 'disaster', purposeText: 'বন্যায় ক্ষতিগ্রস্ত মাছের পুকুর মেরামত', tenure: 6,
    status: 'rejected', submittedAt: '2026-10-09', channel: 'app', docs: ['purpose'],
    snapshot: { result: 'blocked', reasons: ['QH-B-10', 'QH-B-04'], maxAmount: 0, layer: { gate: 'pass', scope: 'pass', financial: 'block', window: 'pass' } },
    decision: { verdict: 'reject', at: '2026-10-12', by: 'মোঃ আব্দুল্লাহ (ব্যবস্থাপক)', appr: 'নাসরিন আক্তার (অনুমোদনকারী)', committee: 'CM-2610-05',
      note: 'NID যাচাই বাকি + সঞ্চয়ে বকেয়া ৳২,০৪০ · কারণ সদস্যকে সম্মান রক্ষা করে জানানো হয়েছে (§৫.৫)' },
    sla: 3 },
  { id: 'qa07', no: 'QHA-2610-0013', memberId: 'm5', product: 'qhp1', ruleVersion: 3, amount: 1000000,
    purpose: 'medical', purposeText: 'মায়ের চোখের অপারেশন', tenure: 12,
    status: 'returned', submittedAt: '2026-10-16', channel: 'field', docs: ['nid', 'purpose', 'photo'],
    snapshot: { result: 'conditional', reasons: ['QH-B-06', 'QH-W-01'], maxAmount: 0, layer: { gate: 'pass', scope: 'pass', financial: 'block', window: 'pass' } },
    decision: { verdict: 'return', at: '2026-10-18', by: 'মোঃ আব্দুল্লাহ (ব্যবস্থাপক)',
      note: 'চলমান ঋণে ২টি কিস্তি বকেয়া — বকেয়া পরিশোধ ও পুনর্গঠন প্রস্তাবের পর নতুন আবেদন (⚠️D-44)' },
    need: ['income'], sla: 2 },
  { id: 'qa08', no: 'QHA-2610-0014', memberId: 'm9', product: 'qhp1', ruleVersion: 3, amount: 300000,
    purpose: 'family', purposeText: 'পারিবারিক জরুরি প্রয়োজন', tenure: 6,
    status: 'rejected', submittedAt: '2026-10-18', channel: 'office', docs: ['nid'],
    snapshot: { result: 'blocked', reasons: ['QH-B-07'], maxAmount: 0, layer: { gate: 'pass', scope: 'pass', financial: 'block', window: 'pass' } },
    decision: { verdict: 'reject', at: '2026-10-19', by: 'মোঃ আব্দুল্লাহ (ব্যবস্থাপক)', appr: 'কামরুল হাসান (সমিতি প্রশাসক)', committee: 'CM-2610-07',
      note: 'পূর্ব সহায়তা ২০২৬-০৯-১৮-এ ছেড়ে দেওয়া (write-off) — কমিটির সিদ্ধান্ত ছাড়া নতুন সহায়তা নয় (BR-23)' },
    sla: 1 },
  { id: 'qa09', no: 'QHA-2610-0015', memberId: 'm8', product: 'qhp3', ruleVersion: 3, amount: 300000,
    purpose: 'shelter', purposeText: 'ঘরের ছাউনি মেরামত', tenure: 6,
    status: 'review', submittedAt: '2026-10-26', channel: 'app', docs: ['nid', 'purpose', 'ref', 'photo'],
    snapshot: { result: 'conditional', reasons: ['QH-W-05'], maxAmount: 300000, layer: { gate: 'pass', scope: 'pass', financial: 'warn', window: 'pass' } },
    reviewer: 'কামরুল হাসান (সমিতি প্রশাসক)', sla: 5,
    note: 'ম্যানুয়াল এক্সেপশন — নিয়ম বদলেছেন যিনি, তিনি অনুমোদন করতে পারবেন না (BR-04 প্রসারণ ⚠️D-59)' },
  { id: 'qa10', no: 'QHA-2610-0016', memberId: 'm7', product: 'qhp3', ruleVersion: 3, amount: 500000,
    purpose: 'disaster', purposeText: 'বন্যার পর ঘর মেরামত ও খাদ্য', tenure: 6,
    status: 'rejected', submittedAt: '2026-10-19', channel: 'field', docs: ['nid', 'purpose'],
    snapshot: { result: 'blocked', reasons: ['QH-B-08'], maxAmount: 640000, layer: { gate: 'pass', scope: 'pass', financial: 'pass', window: 'block' } },
    decision: { verdict: 'reject', at: '2026-10-19', by: 'সুমি রানী দাস (হিসাবরক্ষক)', appr: 'নাসরিন আক্তার (অনুমোদনকারী)', committee: 'CM-2610-07',
      note: 'অক্টোবরের কোটা ১২/১২ পূর্ণ — ওয়েটলিস্টে রাখা হয়েছে, ১ নভেম্বরের জানালায় অগ্রাধিকার (⚠️D-51)' },
    waitlist: true, sla: 0 },
  { id: 'qa11', no: 'QHA-2606-0004', memberId: 'm5', product: 'qhp1', ruleVersion: 2, amount: 1500000,
    purpose: 'medical', purposeText: 'স্ত্রীর চিকিৎসা', tenure: 12,
    status: 'disbursed', submittedAt: '2026-06-08', channel: 'office', docs: ['nid', 'purpose', 'income'],
    snapshot: { result: 'eligible', reasons: [], maxAmount: 1600000, layer: { gate: 'pass', scope: 'pass', financial: 'pass', window: 'pass' } },
    decision: { verdict: 'approve', amount: 1500000, at: '2026-06-14', by: 'সুমি রানী দাস (হিসাবরক্ষক)', appr: 'নাসরিন আক্তার (অনুমোদনকারী)', committee: 'CM-2606-03' },
    loan: 'qh03', sla: 4 },
  { id: 'qa12', no: 'QHA-2605-0003', memberId: 'm2', product: 'qhp2', ruleVersion: 2, amount: 1200000,
    purpose: 'education', purposeText: 'মেয়ের কলেজ ভর্তি', tenure: 12,
    status: 'disbursed', submittedAt: '2026-05-06', channel: 'app', docs: ['nid', 'purpose'],
    snapshot: { result: 'eligible', reasons: [], maxAmount: 717500, layer: { gate: 'pass', scope: 'pass', financial: 'pass', window: 'pass' } },
    decision: { verdict: 'approve', amount: 1200000, at: '2026-05-11', by: 'মোঃ আব্দুল্লাহ (ব্যবস্থাপক)', appr: 'নাসরিন আক্তার (অনুমোদনকারী)', committee: 'CM-2605-02',
      note: 'সীমা ছাড়ানোয় কমিটির বিশেষ সিদ্ধান্ত (⚠️D-45) — রেফারেন্স সংরক্ষিত' },
    loan: 'qh02', sla: 3 },
  { id: 'qa13', no: 'QHA-2604-0002', memberId: 'm6', product: 'qhp2', ruleVersion: 2, amount: 600000,
    purpose: 'education', purposeText: 'ছেলের স্কুল ফি', tenure: 6,
    status: 'disbursed', submittedAt: '2026-04-02', channel: 'office', docs: ['nid', 'purpose'],
    snapshot: { result: 'eligible', reasons: [], maxAmount: 700000, layer: { gate: 'pass', scope: 'pass', financial: 'pass', window: 'pass' } },
    decision: { verdict: 'approve', amount: 600000, at: '2026-04-06', by: 'সুমি রানী দাস (হিসাবরক্ষক)', appr: 'নাসরিন আক্তার (অনুমোদনকারী)', committee: 'CM-2604-02' },
    loan: 'qh06', sla: 2 },
  { id: 'qa14', no: 'QHA-2511-0001', memberId: 'm7', product: 'qhp1', ruleVersion: 1, amount: 500000,
    purpose: 'medical', purposeText: 'ডায়াবেটিস চিকিৎসা', tenure: 5,
    status: 'disbursed', submittedAt: '2025-12-04', channel: 'office', docs: ['nid', 'purpose'],
    snapshot: { result: 'eligible', reasons: [], maxAmount: 640000, layer: { gate: 'pass', scope: 'pass', financial: 'pass', window: 'pass' } },
    decision: { verdict: 'approve', amount: 500000, at: '2025-12-10', by: 'মোঃ আব্দুল্লাহ (ব্যবস্থাপক)', appr: 'নাসরিন আক্তার (অনুমোদনকারী)', committee: 'CM-2512-01' },
    loan: 'qh07', sla: 4 },
];

/* ── ঋণ (qh_loans) ── */
const QH_LOANS = [
  { id: 'qh01', no: 'QH-2602-0001', app: 'qa01', memberId: 'm1', product: 'qhp1', principal: 800000,
    tenure: 8, repay: 'equal', disbursedAt: '2026-02-10', firstDue: '2026-03-10', status: 'closed', closedAt: '2026-10-10',
    channel: 'bank', committee: 'CM-2602-01', by: 'সুমি রানী দাস', appr: 'নাসরিন আক্তার', otp: true,
    evidence: ['ভাউচার QHV-2602-0011', 'ব্যাংক ট্রান্সফার রসিদ'], cert: 'QHC-2610-0001',
    hash: 'a7f3c219', note: 'সুদ ৳০ · ৮টি কিস্তিতে মূলধন সম্পূর্ণ পরিশোধিত' },
  { id: 'qh02', no: 'QH-2605-0003', app: 'qa12', memberId: 'm2', product: 'qhp2', principal: 1200000,
    tenure: 12, repay: 'equal', disbursedAt: '2026-05-14', firstDue: '2026-06-14', status: 'active',
    channel: 'wallet', committee: 'CM-2605-02', by: 'সুমি রানী দাস', appr: 'নাসরিন আক্তার', otp: true,
    evidence: ['ভাউচার QHV-2605-0031', 'ওয়ালেট ট্রান্সেকশন ID'], hash: 'b12e88d4',
    note: 'সুদ ৳০ · ৫/১২ কিস্তি পরিশোধিত' },
  { id: 'qh03', no: 'QH-2606-0004', app: 'qa11', memberId: 'm5', product: 'qhp1', principal: 1500000,
    tenure: 12, repay: 'equal', disbursedAt: '2026-06-20', firstDue: '2026-07-20', status: 'arrears',
    channel: 'cash', committee: 'CM-2606-03', by: 'রাজু আহমেদ (সংগ্রহক)', appr: 'নাসরিন আক্তার', otp: true,
    evidence: ['ভাউচার QHV-2606-0041', 'নগদ প্রদান স্বাক্ষর'], hash: 'c9a41f07',
    note: '২টি কিস্তি বকেয়া (সেপ্টেম্বর ও অক্টোবর) · শ্রেণি: বিলম্বিত ৩১–৯০ দিন ⚠️D-44' },
  { id: 'qh04', no: 'QH-2608-0005', app: 'qa02', memberId: 'm1', product: 'qhp1', principal: 875000,
    tenure: 6, repay: 'equal', disbursedAt: '2026-08-12', firstDue: '2026-09-12', status: 'active',
    channel: 'cash', committee: 'CM-2608-02', by: 'রাজু আহমেদ (সংগ্রহক)', appr: 'নাসরিন আক্তার', otp: true,
    evidence: ['ভাউচার QHV-2608-0051', 'সদস্যের স্বাক্ষরিত রসিদ'], hash: 'd4c07b31',
    note: 'সুদ ৳০ · আবেদিত ৳১৫,০০০ → অনুমোদিত ৳৮,৭৫০ (মোট সঞ্চয়ের ৫০% ⚠️D-54)' },
  { id: 'qh05', no: 'QH-2610-0006', app: 'qa04', memberId: 'm4', product: 'qhp1', principal: 1800000,
    tenure: 12, repay: 'equal', disbursedAt: null, firstDue: null, status: 'pending',
    channel: 'bank', committee: 'CM-2610-04', by: 'সুমি রানী দাস', appr: 'নাসরিন আক্তার', otp: false,
    evidence: [], hash: '', note: 'অনুমোদিত — বিতরণ বাকি: maker ≠ checker ✓, OTP যাচাই বাকি (BR-22)' },
  { id: 'qh06', no: 'QH-2604-0002', app: 'qa13', memberId: 'm6', product: 'qhp2', principal: 600000,
    tenure: 6, repay: 'equal', disbursedAt: '2026-04-08', firstDue: '2026-05-08', status: 'arrears',
    channel: 'cash', committee: 'CM-2604-02', by: 'রাজু আহমেদ (সংগ্রহক)', appr: 'নাসরিন আক্তার', otp: true,
    evidence: ['ভাউচার QHV-2604-0021'], hash: 'e5b19a62',
    note: '১১৪ দিন বিলম্ব · শ্রেণি: সন্দেহজনক ৯১–১৮০ দিন · write-off প্রস্তাব বিচারাধীন (BR-23 ⚠️D-44)' },
  { id: 'qh07', no: 'QH-2512-0007', app: 'qa14', memberId: 'm7', product: 'qhp1', principal: 500000,
    tenure: 5, repay: 'equal', disbursedAt: '2025-12-15', firstDue: '2026-01-15', status: 'closed', closedAt: '2026-05-15',
    channel: 'cash', committee: 'CM-2512-01', by: 'রাজু আহমেদ (সংগ্রহক)', appr: 'নাসরিন আক্তার', otp: true,
    evidence: ['ভাউচার QHV-2512-0071'], cert: 'QHC-2605-0002', hash: 'f03d7c88',
    note: 'সুদ ৳০ · সম্পূর্ণ পরিশোধিত · সমাপ্তি সনদ ইস্যু' },
  { id: 'qh08', no: 'QH-2511-0008', app: null, memberId: 'm9', product: 'qhp1', principal: 400000,
    tenure: 8, repay: 'equal', disbursedAt: '2025-11-20', firstDue: '2025-12-20', status: 'writeoff', closedAt: '2026-09-18',
    channel: 'cash', committee: 'CM-2609-07', by: 'রাজু আহমেদ (সংগ্রহক)', appr: 'কামরুল হাসান', otp: true,
    evidence: ['ভাউচার QHV-2511-0081'], hash: '1a9c4e55',
    note: '২/৮ কিস্তি আদায় · বাকি ৳৩,০০০ ছেড়ে দেওয়া (ক্ষতি) — দায় মেটেনি, খাতায় আলাদাভাবে দৃশ্যমান (BR-23)' },
];

/* ── প্রকৃত পরিশোধ (qh_repayments) — রসিদ QR-YYMM-#### অপরিবর্তনীয় (BR-08) ── */
const QH_REPAYMENTS = [
  { loan: 'qh01', inst: 1, amount: 100000, at: '2026-03-10', receipt: 'QR-2603-0001', channel: 'bank', by: 'সুমি রানী দাস' },
  { loan: 'qh01', inst: 2, amount: 100000, at: '2026-04-10', receipt: 'QR-2604-0002', channel: 'bank', by: 'সুমি রানী দাস' },
  { loan: 'qh01', inst: 3, amount: 100000, at: '2026-05-11', receipt: 'QR-2605-0003', channel: 'cash', by: 'রাজু আহমেদ' },
  { loan: 'qh01', inst: 4, amount: 100000, at: '2026-06-10', receipt: 'QR-2606-0004', channel: 'cash', by: 'রাজু আহমেদ' },
  { loan: 'qh01', inst: 5, amount: 100000, at: '2026-07-10', receipt: 'QR-2607-0005', channel: 'cash', by: 'রাজু আহমেদ' },
  { loan: 'qh01', inst: 6, amount: 100000, at: '2026-08-10', receipt: 'QR-2608-0006', channel: 'bank', by: 'সুমি রানী দাস' },
  { loan: 'qh01', inst: 7, amount: 100000, at: '2026-09-10', receipt: 'QR-2609-0007', channel: 'bank', by: 'সুমি রানী দাস' },
  { loan: 'qh01', inst: 8, amount: 100000, at: '2026-10-10', receipt: 'QR-2610-0008', channel: 'bank', by: 'সুমি রানী দাস', note: 'চূড়ান্ত কিস্তি — সমাপ্তি সনদ QHC-2610-0001' },
  { loan: 'qh02', inst: 1, amount: 100000, at: '2026-06-14', receipt: 'QR-2606-0009', channel: 'wallet', by: 'সুমি রানী দাস' },
  { loan: 'qh02', inst: 2, amount: 100000, at: '2026-07-14', receipt: 'QR-2607-0010', channel: 'wallet', by: 'সুমি রানী দাস' },
  { loan: 'qh02', inst: 3, amount: 100000, at: '2026-08-16', receipt: 'QR-2608-0011', channel: 'cash', by: 'রাজু আহমেদ', note: '২ দিন বিলম্ব — গ্রেস ১৫ দিনের ভেতরে, কোনো চার্জ নেই (⚠️D-41)' },
  { loan: 'qh02', inst: 4, amount: 100000, at: '2026-09-14', receipt: 'QR-2609-0012', channel: 'wallet', by: 'সুমি রানী দাস' },
  { loan: 'qh02', inst: 5, amount: 100000, at: '2026-10-14', receipt: 'QR-2610-0013', channel: 'wallet', by: 'সুমি রানী দাস' },
  { loan: 'qh03', inst: 1, amount: 125000, at: '2026-07-20', receipt: 'QR-2607-0014', channel: 'cash', by: 'রাজু আহমেদ' },
  { loan: 'qh03', inst: 2, amount: 125000, at: '2026-08-20', receipt: 'QR-2608-0015', channel: 'cash', by: 'রাজু আহমেদ' },
  { loan: 'qh04', inst: 1, amount: 145833, at: '2026-09-12', receipt: 'QR-2609-0016', channel: 'cash', by: 'রাজু আহমেদ' },
  { loan: 'qh04', inst: 2, amount: 145833, at: '2026-10-12', receipt: 'QR-2610-0017', channel: 'cash', by: 'রাজু আহমেদ' },
  { loan: 'qh06', inst: 1, amount: 100000, at: '2026-05-08', receipt: 'QR-2605-0018', channel: 'cash', by: 'রাজু আহমেদ' },
  { loan: 'qh06', inst: 2, amount: 100000, at: '2026-06-09', receipt: 'QR-2606-0019', channel: 'cash', by: 'রাজু আহমেদ' },
  { loan: 'qh07', inst: 1, amount: 100000, at: '2026-01-15', receipt: 'QR-2601-0020', channel: 'cash', by: 'রাজু আহমেদ' },
  { loan: 'qh07', inst: 2, amount: 100000, at: '2026-02-15', receipt: 'QR-2602-0021', channel: 'cash', by: 'রাজু আহমেদ' },
  { loan: 'qh07', inst: 3, amount: 100000, at: '2026-03-15', receipt: 'QR-2603-0022', channel: 'cash', by: 'রাজু আহমেদ' },
  { loan: 'qh07', inst: 4, amount: 100000, at: '2026-04-15', receipt: 'QR-2604-0023', channel: 'bank', by: 'সুমি রানী দাস' },
  { loan: 'qh07', inst: 5, amount: 100000, at: '2026-05-15', receipt: 'QR-2605-0024', channel: 'bank', by: 'সুমি রানী দাস', note: 'চূড়ান্ত কিস্তি — সমাপ্তি সনদ QHC-2605-0002' },
  { loan: 'qh08', inst: 1, amount: 50000, at: '2025-12-22', receipt: 'QR-2512-0025', channel: 'cash', by: 'রাজু আহমেদ' },
  { loan: 'qh08', inst: 2, amount: 50000, at: '2026-01-20', receipt: 'QR-2601-0026', channel: 'cash', by: 'রাজু আহমেদ' },
];

/* ── write-off (qh_write_offs) — কমিটি রেফারেন্স বাধ্যতামূলক (BR-23 ⚠️D-44) ── */
const QH_WRITEOFFS = [
  { id: 'wo1', no: 'QW-2609-0001', loan: 'qh08', amount: 300000, reason: 'সদস্য দীর্ঘদিন গ্রামের বাইরে, কোনো সম্পদ বা আয়ের উৎস পাওয়া যায়নি',
    committee: 'CM-2609-07', decidedAt: '2026-09-14', by: 'মোঃ আব্দুল্লাহ (ব্যবস্থাপক)', approvedBy: 'কামরুল হাসান (সমিতি প্রশাসক)',
    auditorAlertedAt: '2026-09-18', status: 'done',
    note: 'ক্ষতি — কর্জে হাসানা খাতে ডেবিট; দায় মেটেনি, নিরীক্ষা রিপোর্টে আলাদাভাবে দৃশ্যমান (BR-23)' },
  { id: 'wo2', no: 'QW-2610-0002', loan: 'qh06', amount: 400000, reason: '১১৪ দিন বিলম্ব — প্রস্তাব: আগে পুনর্গঠন, তারপর write-off',
    committee: 'CM-2610-06', decidedAt: null, by: 'মোঃ আব্দুল্লাহ (ব্যবস্থাপক)', approvedBy: null,
    auditorAlertedAt: null, status: 'proposed',
    note: 'প্রস্তাব বিচারাধীন — ORG_ADMIN অনুমোদন + নিরীক্ষক অ্যালার্ট বাধ্যতামূলক (BR-23) · বিকল্প: কিস্তি পুনর্গঠন ⚠️D-44' },
];

/* ── সামাজিক প্রভাব (⚠️D-69) — ঋণ ডেটা থেকে derived, হার্ডকোড নয় ── */
const QH_IMPACT = (function () {
  const ls = QH_LOANS.filter(l => l.status !== 'pending');
  const fams = new Set(ls.map(l => l.memberId));
  const cnt = k => ls.filter(l => { const a = QH_APPS.filter(x => x.id === l.app)[0]; return a && a.purpose === k; }).length;
  return { families: fams.size, loans: ls.length,
    medical: cnt('medical'), education: cnt('education'), disaster: cnt('disaster') + cnt('shelter'),
    livelihood: cnt('livelihood'), family: cnt('family'),
    amount: ls.reduce((s2, l) => s2 + l.principal, 0),
    since: '2026-01-05', note: 'এই প্রোটোটাইপের নমুনা ডেটা থেকে গণনা; প্রোডাকশনে সব সদস্যের উপর চলবে' };
})();

/* ── QH হেল্পার (সব হিসাব derived — হার্ডকোড নেই) ── */
function qhProduct(id) { return QH_PRODUCTS.filter(p => p.id === id || p.code === id)[0] || null; }
function qhLoan(id) { return QH_LOANS.filter(l => l.id === id || l.no === id)[0] || null; }
function qhApp(id) { return QH_APPS.filter(a => a.id === id || a.no === id)[0] || null; }
function qhLabel(arr, k) { const h = arr.filter(x => x[0] === k)[0]; return h ? h[1] : k; }
function qhChanLabel(k) { const h = QH_CHANNEL.filter(x => x.k === k)[0]; return h ? h.t : k; }
function qhPurposeLabel(k) { return qhLabel(QH_PURPOSE, k); }
function qhRepayLabel(k) { return qhLabel(QH_REPAY, k); }
function qhLayerLabel(k) { return qhLabel(QH_LAYER, k); }
function qhDocLabel(k) { return qhLabel(QH_DOC, k); }
function qhReason(code) {
  if (QH_BLOCK[code]) return { code: code, sev: 'block', m: QH_BLOCK[code].m, a: QH_BLOCK[code].a, fix: QH_BLOCK[code].fix };
  if (QH_WARN[code]) return { code: code, sev: 'warn', m: QH_WARN[code].m, a: QH_WARN[code].a, fix: QH_WARN[code].fix };
  return { code: code, sev: 'warn', m: code, a: code, fix: '' };
}
function qhVersion(no) { return QH_RULE_VERSIONS.filter(v => v.no === Number(no))[0] || QH_RULE_VERSIONS[0]; }
function qhRules(layer) { return layer ? QH_RULES.filter(r => r.layer === layer) : QH_RULES; }
function qhZero(cls) { return `<span class="qard-zero${cls ? ' ' + cls : ''}">${ic('shield', 'sm')}সুদ ৳০</span>`; }

/* তারিখ: মাস যোগ (ISO স্ট্রিং ভিত্তিক — গ্রেগরিয়ান) */
function qhAddMonth(iso, n) {
  const p = String(iso).split('-').map(Number); let y = p[0], m = p[1] + n; const d = p[2];
  while (m > 12) { y += 1; m -= 12; }
  const last = new Date(y, m, 0).getDate();
  return y + '-' + String(m).padStart(2, '0') + '-' + String(Math.min(d, last)).padStart(2, '0');
}
function qhDateDiff(iso) { return Math.round((TODAY - new Date(iso)) / 86400000); }

/* কিস্তি ছক — শুধু মূলধন বিভাজন, সুদ নেই (BR-20 · Loan Schedule Engine) */
function qhInsts(l) {
  if (!l || !l.firstDue) return [];
  const base = Math.round(l.principal / l.tenure);
  const reps = QH_REPAYMENTS.filter(r => r.loan === l.id);
  const out = [];
  let acc = 0;
  for (let i = 1; i <= l.tenure; i++) {
    const dueP = i === l.tenure ? l.principal - acc : base; acc += dueP;
    const due = qhAddMonth(l.firstDue, i - 1);
    const r = reps.filter(x => x.inst === i)[0];
    const paid = r ? r.amount : 0;
    let status = 'upcoming';
    if (paid >= dueP) status = 'paid';
    else if (qhDateDiff(due) > (l.grace || 0)) status = 'overdue';
    else if (qhDateDiff(due) >= 0) status = 'late';
    else if (qhDateDiff(due) >= -45) status = 'due';
    out.push({ no: i, due: due, duePaisa: dueP, paidPaisa: paid, paidAt: r ? r.at : null,
      receipt: r ? r.receipt : null, channel: r ? r.channel : null, by: r ? r.by : null,
      note: r && r.note ? r.note : '', status: status });
  }
  return out;
}
function qhRepaid(l) { return QH_REPAYMENTS.filter(r => r.loan === l.id).reduce((s, r) => s + r.amount, 0); }
function qhWrittenOff(l) { return QH_WRITEOFFS.filter(w => w.loan === l.id && w.status === 'done').reduce((s, w) => s + w.amount, 0); }
function qhOutstanding(l) { return Math.max(0, l.principal - qhRepaid(l) - qhWrittenOff(l)); }
function qhPaidPct(l) { return l.principal ? Math.round(qhRepaid(l) / l.principal * 100) : 0; }
function qhNextInst(l) { const s = qhInsts(l).filter(x => x.status !== 'paid'); return s[0] || null; }
function qhArrearsOf(l) {
  if (l.status === 'writeoff' || l.status === 'closed') return 0;   /* ছেড়ে দেওয়া অঙ্ক বকেয়া নয় — ক্ষতি খাতায় আলাদা (BR-23) */
  return qhInsts(l).filter(x => x.status === 'overdue' || x.status === 'late')
    .reduce((s, x) => s + Math.max(0, x.duePaisa - x.paidPaisa), 0);
}
function qhMissedCount(l) { return qhInsts(l).filter(x => x.status === 'overdue' || x.status === 'late').length; }
function qhDaysLate(l) { const s = qhInsts(l).filter(x => x.status === 'overdue' || x.status === 'late'); return s.length ? qhDateDiff(s[0].due) : 0; }
function qhClassOf(l) {
  if (l.status === 'closed') return 'regular';
  if (l.status === 'writeoff') return 'loss';
  const d = qhDaysLate(l);
  if (d <= 0) return 'regular';
  if (d <= 30) return 'watch';
  if (d <= 90) return 'late';
  if (d <= 180) return 'doubt';
  return 'loss';
}
function qhGraceNote(l) { const p = qhProduct(l.product); return `গ্রেস ${bn(p ? p.grace : 0)} দিন — এই সময়ের ভেতরে পরিশোধে কোনো চার্জ নেই (⚠️D-41)`; }

/* তালিকা/ফিল্টার */
function qhLoans(st) { const l = QH_LOANS.slice(); return st ? l.filter(x => x.status === st) : l; }
function qhMemberLoans(mid) { return QH_LOANS.filter(l => l.memberId === mid); }
function qhApps(st) { const a = QH_APPS.slice(); return st ? a.filter(x => x.status === st) : a; }
function qhMemberApps(mid) { return QH_APPS.filter(a => a.memberId === mid); }
function qhEligList(result) { const e = QH_ELIGIBLE.slice(); return result ? e.filter(x => x.result === result) : e; }
function qhEligFor(mid) { return QH_ELIGIBLE.filter(e => e.memberId === mid)[0] || null; }
function qhSlaBreaches() { return QH_APPS.filter(a => (a.status === 'review' || a.status === 'screening') &&
  qhDateDiff(a.submittedAt) > QH_SLA_DAYS + 6); }
function qhQueue() { return QH_APPS.filter(a => ['screening', 'review', 'returned'].indexOf(a.status) >= 0); }
/* ব্যতিক্রম রেজিস্টার: মূল্যায়িত সীমা ছাড়ানো অনুমোদন (⚠️D-45 · ⚠️D-59)।
   এমন প্রতিটি অনুমোদনে কমিটি রেফারেন্স ও লিখিত কারণ বাধ্যতামূলক — নিরীক্ষক রিপোর্টে আলাদাভাবে দেখানো হয়। */
function qhOverCapList() {
  return QH_APPS.filter(a => a.decision && a.decision.amount && a.snapshot && a.decision.amount > (a.snapshot.maxAmount || 0))
    .map(a => ({ a: a, cap: a.snapshot.maxAmount, amt: a.decision.amount, over: a.decision.amount - a.snapshot.maxAmount,
      committee: a.decision.committee || '—', note: a.decision.note || 'কারণ লেখা নেই — নিরীক্ষকের জন্য চিহ্নিত' }));
}

/* পোর্টফোলিও (সব derived) */
function qhPortfolio() {
  const act = QH_LOANS.filter(l => l.status !== 'pending');
  const disb = act.reduce((s, l) => s + l.principal, 0);
  const rep = QH_REPAYMENTS.reduce((s, r) => s + r.amount, 0);
  const wo = QH_WRITEOFFS.filter(w => w.status === 'done').reduce((s, w) => s + w.amount, 0);
  const outs = act.reduce((s, l) => s + qhOutstanding(l), 0);
  const arr = act.reduce((s, l) => s + qhArrearsOf(l), 0);
  return { loans: act.length, disbursed: disb, repaid: rep, outstanding: outs, arrears: arr, writeOff: wo,
    active: QH_LOANS.filter(l => l.status === 'active').length,
    arrearsLoans: QH_LOANS.filter(l => l.status === 'arrears').length,
    closed: QH_LOANS.filter(l => l.status === 'closed').length,
    pendingDisb: QH_LOANS.filter(l => l.status === 'pending').length,
    collectionRate: disb ? Math.round(rep / (rep + outs) * 100) : 0 };
}
/* ফান্ড পুল (⚠️D-40) — বরাদ্দ, হল্ড, প্রতিশ্রুতি, মুক্ত */
function qhPoolState() {
  const p = QH_WINDOW.pool;
  const committed = QH_LOANS.filter(l => l.status === 'pending').reduce((s, l) => s + l.principal, 0)
    + QH_APPS.filter(a => a.status === 'approved' && !a.loan).reduce((s, a) => s + (a.decision ? a.decision.amount : a.amount), 0);
  return { allocated: p.allocated, held: p.held, committed: committed,
    available: Math.max(0, p.allocated - p.held - committed), source: p.source, note: p.note };
}
function qhQuotaLeft() { return Math.max(0, QH_WINDOW.quota.monthly - QH_WINDOW.quota.used); }
function qhWindowOpen() { return !!QH_WINDOW.open; }

/* সর্বোচ্চ অঙ্ক (§৭.৭) = min(পণ্যের সর্বোচ্চ, নিয়মের সীমা, পুলে অবশিষ্ট, কোটার অবশিষ্ট) */
function qhMaxAmount(mid, productId) {
  const m = member(mid), p = qhProduct(productId || 'qhp1'), e = qhEligFor(mid);
  const bySavings = Math.round((m.total || 0) * 0.5);          /* ⚠️D-54 ডিফল্ট: মোট সঞ্চয়ের ৫০% */
  const pool = qhPoolState().available;
  const caps = [p ? p.max : 0, bySavings, pool, e && e.maxAmount ? e.maxAmount : bySavings].filter(x => x > 0);
  return caps.length ? Math.min.apply(null, caps) : 0;
}
function qhCapBreakdown(mid, productId) {
  const m = member(mid), p = qhProduct(productId || 'qhp1');
  return [
    ['পণ্যের সর্বোচ্চ সীমা', p ? p.max : 0, p ? p.code : ''],
    ['মোট সঞ্চয়ের ৫০% ⚠️D-54', Math.round((m.total || 0) * 0.5), tk(m.total || 0) + ' এর অর্ধেক'],
    ['ফান্ড পুলে অবশিষ্ট ⚠️D-40', qhPoolState().available, ''],
    ['যোগ্যতা মূল্যায়নের সীমা', (qhEligFor(mid) || {}).maxAmount || 0, ''],
  ];
}
/* সব মডিউলে মোট বকেয়া (নিয়ম r08) */
function qhDueAll(mid) {
  const m = member(mid); let d = m.due || 0; const parts = [];
  if (m.due) parts.push('সাধারণ সঞ্চয় ' + tk(m.due));
  JG_PARTS.filter(p => p.memberId === mid).forEach(p => {
    const g = jgGoal(p.goal); if (!g || g.status === 'closed') return;
    const gap = jgPartGap(g, p); if (gap > 0) { d += gap; parts.push('যৌথ লক্ষ্য ' + tk(gap)); }
  });
  return { total: d, parts: parts };
}

/* সদস্যপক্ষ (QM-*) */
function qhMyLoans() { return qhMemberLoans(QH_ME); }
function qhMyActive() { return qhMyLoans().filter(l => l.status === 'active' || l.status === 'arrears')[0] || null; }
function qhMyClosed() { return qhMyLoans().filter(l => l.status === 'closed'); }
function qhMyApps() { return qhMemberApps(QH_ME); }
function qhMyElig() { return qhEligFor(QH_ME); }
function qhMyState() {
  const e = qhMyElig(); const blocks = (e ? e.reasons : []).filter(c => QH_BLOCK[c]);
  const warns = (e ? e.reasons : []).filter(c => QH_WARN[c]);
  const st = !e ? 'blocked' : blocks.length ? (e.result === 'blocked' ? 'blocked' : 'conditional') : (warns.length ? 'conditional' : 'eligible');
  return { key: st, dict: QH_ELIG[st], blocks: blocks.map(qhReason), warns: warns.map(qhReason),
    max: e ? e.maxAmount : 0, validUntil: e ? e.validUntil : null, note: e ? e.note : '' };
}
function qhMyNextDue() { const l = qhMyActive(); return l ? qhNextInst(l) : null; }

/* উদ্দেশ্যভিত্তিক বণ্টন ও সামাজিক প্রভাব (⚠️D-69) */
function qhPurposeStats() {
  return QH_PURPOSE.map(x => {
    const ls = QH_LOANS.filter(l => { const a = qhApp(l.app); return a && a.purpose === x[0] && l.status !== 'pending'; });
    return { key: x[0], label: x[1], loans: ls.length,
      amount: ls.reduce((s, l) => s + l.principal, 0),
      repaid: ls.reduce((s, l) => s + qhRepaid(l), 0) };
  });
}
/* Simulation (⚠️D-57) — শুধু সংখ্যা ও বণ্টন, ব্যক্তিগত তালিকা নয় */
function qhSimulate(draft) {
  const d = draft || {};
  const cur = QH_ELIGIBLE.filter(e => e.result === 'eligible').length;
  const minSave = d.min_total_savings !== undefined ? d.min_total_savings : 500000;
  const pct = d.max_pct_of_savings !== undefined ? d.max_pct_of_savings : 50;
  const months = d.min_membership_months !== undefined ? d.min_membership_months : 6;
  const rows = MEMBERS.map(m => {
    const joinedMonths = Math.max(0, Math.round((TODAY - new Date(m.joined)) / 2592000000));
    const cap = Math.min(pct / 100 * (m.total || 0), 2500000);
    const ok = m.status === 'active' && m.kyc === 'verified' && (m.total || 0) >= minSave &&
      (m.due || 0) === 0 && joinedMonths >= months && cap > 0;
    return { pass: ok, band: cap <= 0 ? 0 : cap < 300000 ? 1 : cap < 800000 ? 2 : cap < 1500000 ? 3 : 4 };
  });
  const pass = rows.filter(r => r.pass).length;
  const bands = [0, 0, 0, 0, 0]; rows.forEach(r => { if (r.pass) bands[r.band]++; });
  return { eligible: pass, blocked: rows.length - pass, newlyBlocked: Math.max(0, cur - pass), newlyEligible: Math.max(0, pass - cur),
    bands: bands, bandLabels: ['সীমা ০', '০–৳৩,০০০', '৳৩,০০০–৳৮,০০০', '৳৮,০০০–৳১৫,০০০', '৳১৫,০০০+'],
    members: rows.length, privacy: 'Simulation-এ শুধু সংখ্যা ও বণ্টন দেখানো হয় — ব্যক্তিগত তালিকা নয় (⚠️D-57)' };
}
/* দিন/মাস সমাপ্তির গেটে অমীমাংসিত QH এন্ট্রি (BR-25) */
function qhPendingList() {
  const out = [];
  QH_LOANS.filter(l => l.status === 'pending').forEach(l => out.push({ kind: 'বিতরণ বাকি (OTP) BR-22', ref: l.no, amt: l.principal, since: l.committee }));
  QH_APPS.filter(a => a.status === 'review').forEach(a => out.push({ kind: 'আবেদন পর্যালোচনা', ref: a.no, amt: a.amount, since: a.submittedAt }));
  QH_WRITEOFFS.filter(w => w.status === 'proposed').forEach(w => out.push({ kind: 'write-off অনুমোদন BR-23 ⚠️D-44', ref: w.no, amt: w.amount, since: w.committee }));
  return out;
}
function qhPending() { return qhPendingList().length; }

/* কারণ-কোড → সদস্যভিত্তিক ব্যক্তিগত বাক্য (§৫.৫ নীতি ১: কারণ + সম্মান + প্রতিকার) */
function qhReasonText(code, mid) {
  const m = member(mid || QH_ME), r = qhReason(code);
  if (code === 'QH-B-04') {
    const d = qhDueAll(mid || QH_ME);
    return 'আপনার হিসাবে ' + tk(d.total) + ' বকেয়া আছে (' + (d.parts.join(' + ') || 'সাধারণ সঞ্চয়') + ')। পরিশোধ করলে আবেদন করতে পারবেন।';
  }
  if (code === 'QH-B-06') {
    const l = qhMemberLoans(mid || QH_ME).filter(x => x.status === 'active' || x.status === 'arrears')[0];
    if (l) { const nx = qhNextInst(l), left = qhInsts(l).filter(x => x.status !== 'paid').length;
      return 'আপনার একটি কর্জে হাসানা (' + l.no + ') চলছে — আর ' + bn(left) + 'টি কিস্তি বাকি। সম্পূর্ণ পরিশোধ হলে আবার আবেদন করা যাবে।'; }
    return r.m;
  }
  if (code === 'QH-B-05') {
    const mo = Math.max(0, Math.round((TODAY - new Date(m.joined)) / 2592000000));
    return 'আপনি কমপক্ষে ৬ মাস সদস্য হলে আবেদন করতে পারবেন। আপনার সদস্যত্বকাল ' + bn(mo) + ' মাস (আর ' + bn(Math.max(0, 6 - mo)) + ' মাস বাকি)।';
  }
  if (code === 'QH-B-02' || code === 'QH-B-08') {
    return r.m.replace('১ নভেম্বর ২০২৬', dstr(QH_WINDOW.next.start, true));
  }
  if (code === 'QH-B-09') {
    return 'সহায়তা তহবিলে এখন মুক্ত অঙ্ক ' + tk(qhPoolState().available) + ' — আপনার আবেদিত অঙ্কের জন্য যথেষ্ট নয়।';
  }
  return r.m;
}
function qhReasonList(mid) {
  const e = qhEligFor(mid || QH_ME); if (!e) return [];
  return e.reasons.map(c => { const r = qhReason(c); return { code: c, sev: r.sev, text: qhReasonText(c, mid || QH_ME), a: r.a, fix: r.fix }; });
}
