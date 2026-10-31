/* ============================================================================
   Somobay · Preview Dashboard + Live Prototype Workspace — ইঞ্জিন
   ---------------------------------------------------------------------------
   নীতি: এখানে **কোনো নতুন স্ক্রিন, নতুন ফিচার বা নতুন বিজনেস রুল নেই**।
   একমাত্র উৎস = `assets/screens.js` (১০২ স্ক্রিনের রেন্ডারার + META) এবং
   `assets/app.js` (মক ডেটা · ADMIN_SHELLS · ANAV · MNAV · LIMIT_MATRIX · STAFF)।
   এই ফাইলটি শুধু সেই বিদ্যমান স্ক্রিনগুলোকে **ক্যাটাগরি ও ভূমিকা অনুযায়ী সাজায়**
   এবং একটি একটি করে স্ক্রিন দেখার (Live Workspace) ব্যবস্থা করে।
   মোবাইল ও ডেস্কটপ সম্পূর্ণ আলাদা স্টেজ — কোনো ভিউ-টগল নেই।
   ============================================================================ */

/* ---------------------------------------------------------------- ভূমিকা তালিকা
   প্রতিটি ভূমিকার নিজস্ব ড্যাশবোর্ড (landing), নিজস্ব নেভিগেশন শেল ও পরিচয়।
   তথ্যসূত্র: ADMIN_SHELLS (Shell-A…E), STAFF (u1…u8), LIMIT_MATRIX (D-22), ANAV/MNAV। */
const WS_MEMBER = {
  key: 'MEMBER', platform: 'mob', bn: 'সদস্য', en: 'MEMBER', shell: '—',
  person: 'আব্দুল করিম', personNote: 'RSS-2627-0042 · কেশবপুর, খুলনা · বয়স ৪১',
  landing: 'm01', limit: null, ro: false,
  note: 'মোবাইল-ফার্স্ট সদস্য অ্যাপ। বটম নেভ = MNAV (৫ স্লট): হোম · সঞ্চয় · [+] জমা দিন · লেনদেন · আরও।'
};

const WS_ROLES = [
  /* ---- মোবাইল অ্যাপ (Admin App / Collector App / Other Roles App) ---- */
  Object.assign({}, WS_MEMBER),
  { key: 'COLLECTOR', platform: 'mob', bn: 'মাঠ সংগ্রহক', en: 'COLLECTOR', shell: 'Shell-A',
    person: 'রাজু আহমেদ', personNote: 'u3 · R1 কেশবপুর সদর · সীমা ৳০ (D-22)',
    landing: 'am04', limit: 0, ro: false,
    note: 'মাঠে দাঁড়িয়ে সংগ্রহ: আজকের রুট, সদস্য খোঁজা, দ্রুত জমা এন্ট্রি (FAB), বকেয়া, দিনশেষ। অফলাইন sync (S-08)। অনুমোদন ক্ষমতা নেই।' },
  { key: 'ACCOUNTANT', platform: 'mob', bn: 'হিসাবরক্ষক', en: 'ACCOUNTANT', shell: 'Shell-B',
    person: 'সুমি রানী দাস', personNote: 'u2 · সব রুট · সীমা ৳০ (D-22)',
    landing: 'am01', limit: 0, ro: false,
    note: 'এন্ট্রি ও হিসাব: জমা/উত্তোলন এন্ট্রি, সাধারণ লেজার, ক্যাশ বুক, রিকনসিলিয়েশন। প্রস্তাব দেয়, অনুমোদন করে না (BR-04)।' },
  { key: 'MANAGER', platform: 'mob', bn: 'ব্যবস্থাপক', en: 'MANAGER', shell: 'Shell-C',
    person: 'মোঃ আব্দুল্লাহ', personNote: 'u1 · সব রুট · সীমা ৳৫০,০০০ (D-22)',
    landing: 'am01', limit: 5000000, ro: false,
    note: 'অনুমোদন সীমা ৳৫০,০০০ পর্যন্ত। কিউ, অ্যালার্ট, নিয়ন্ত্রণ ও সদস্য ব্যবস্থাপনা।' },
  { key: 'APPROVER', platform: 'mob', bn: 'অনুমোদনকারী', en: 'APPROVER', shell: 'Shell-C',
    person: 'নাসরিন আক্তার', personNote: 'u7 · সব রুট · সীমা ৳২,০০,০০০ (D-22)',
    landing: 'am01', limit: 20000000, ro: false,
    note: 'সীমা ৳২,০০,০০০ পর্যন্ত অনুমোদন। FAB নেই — শুধু পর্যালোচনা ও সিদ্ধান্ত।' },
  { key: 'ORG_ADMIN', platform: 'mob', bn: 'সমিতি প্রশাসক', en: 'ORG_ADMIN', shell: 'Shell-D',
    person: 'কামরুল হাসান', personNote: 'u6 · সীমা নেই · maker ≠ checker তবুও প্রযোজ্য',
    landing: 'am01', limit: null, ro: false,
    note: 'সম্পূর্ণ ক্ষমতা: স্কিম, স্টাফ ও পারমিশন, সেটিংস, নিয়ন্ত্রণ। তবুও নিজের এন্ট্রি নিজে অনুমোদন করতে পারবেন না (BR-04)।' },
  { key: 'AUDITOR', platform: 'mob', bn: 'নিরীক্ষক', en: 'AUDITOR', shell: 'Shell-E',
    person: 'অভ্যন্তরীণ নিরীক্ষক', personNote: 'শুধু পঠন · কোনো এন্ট্রি নয়',
    landing: 'am24', limit: 0, ro: true,
    note: 'শুধু পঠন: আর্থিক বিবরণ ও রিটার্ন, রিপোর্ট কেন্দ্র, অডিট লগ, অ্যালার্ট।' },
  { key: 'EXTERNAL_AUDITOR', platform: 'mob', bn: 'বহিঃনিরীক্ষক', en: 'EXTERNAL_AUDITOR', shell: 'Shell-E',
    person: 'এস. এম. ফারুক', personNote: 'u8 · সময়সীমাবদ্ধ (১–৩০ নভেম্বর) · শুধু পঠন',
    landing: 'am24', limit: 0, ro: true,
    note: 'সময়সীমাবদ্ধ read-only অ্যাক্সেস; ৩০ নভেম্বর স্বয়ংক্রিয়ভাবে বন্ধ হবে।' },
  { key: 'VIEWER', platform: 'mob', bn: 'পর্যবেক্ষক', en: 'VIEWER', shell: 'Shell-E',
    person: 'কমিটি পর্যবেক্ষক', personNote: 'শুধু পঠন',
    landing: 'am24', limit: 0, ro: true,
    note: 'কার্যক্রম পর্যবেক্ষণ — কোনো পরিবর্তন করার অধিকার নেই।' },

  /* ---- ডেস্কটপ ওয়েব প্যানেল (Admin Web) ---- */
  { key: 'W_ORG_ADMIN', platform: 'web', role: 'ORG_ADMIN', bn: 'সমিতি প্রশাসক', en: 'ORG_ADMIN', shell: 'Shell-D',
    person: 'কামরুল হাসান', personNote: 'u6 · সীমা নেই · maker ≠ checker',
    landing: 'a01', limit: null, ro: false,
    note: 'ডেস্কটপ ড্যাশবোর্ড: সম্পূর্ণ ANAV (৬ গ্রুপ · ২৫ আইটেম), স্টাফ ও পারমিশন, সেটিংস, অডিট লগ।' },
  { key: 'W_MANAGER', platform: 'web', role: 'MANAGER', bn: 'ব্যবস্থাপক', en: 'MANAGER', shell: 'Shell-C',
    person: 'মোঃ আব্দুল্লাহ', personNote: 'u1 · সীমা ৳৫০,০০০ (D-22)',
    landing: 'a01', limit: 5000000, ro: false,
    note: 'ওভারভিউ ড্যাশবোর্ড থেকে কিউতে সরাসরি প্রবেশ; ৳৫০,০০০ পর্যন্ত অনুমোদন।' },
  { key: 'W_APPROVER', platform: 'web', role: 'APPROVER', bn: 'অনুমোদনকারী', en: 'APPROVER', shell: 'Shell-C',
    person: 'নাসরিন আক্তার', personNote: 'u7 · সীমা ৳২,০০,০০০ (D-22)',
    landing: 'a20', limit: 20000000, ro: false,
    note: 'সরাসরি অনুমোদন কিউতে অবতরণ (জমা → উত্তোলন); ৳২,০০,০০০ পর্যন্ত।' },
  { key: 'W_ACCOUNTANT', platform: 'web', role: 'ACCOUNTANT', bn: 'হিসাবরক্ষক', en: 'ACCOUNTANT', shell: 'Shell-B',
    person: 'সুমি রানী দাস', personNote: 'u2 · সীমা ৳০ (D-22)',
    landing: 'a28', limit: 0, ro: false,
    note: 'ক্যাশ বুক ও দিন সমাপ্তি থেকে শুরু; এন্ট্রি, লেজার, রিকনসিলিয়েশন, বাল্ক ইমপোর্ট।' },
  { key: 'W_COLLECTOR', platform: 'web', role: 'COLLECTOR', bn: 'মাঠ সংগ্রহক', en: 'COLLECTOR', shell: 'Shell-A',
    person: 'রাজু আহমেদ', personNote: 'u3 · R1 কেশবপুর সদর · সীমা ৳০ (D-22)',
    landing: 'a32', limit: 0, ro: false,
    note: 'সংগ্রহকের আসল ড্যাশবোর্ড A-02 একটি **মোবাইল ভ্যারিয়েন্ট** (মাঠে দাঁড়িয়ে ব্যবহার) — তাই ডেস্কটপ ওয়েবে তিনি সংগ্রহ পরিকল্পনা ও রুট (A-32), বাল্ক জমা (A-18) ও দিনশেষ জমা (A-28)-এ কাজ করেন। A-02 দেখতে মোবাইল অ্যাপ ওয়ার্কস্পেসে যান।' },
  { key: 'W_AUDITOR', platform: 'web', role: 'AUDITOR', bn: 'নিরীক্ষক', en: 'AUDITOR', shell: 'Shell-E',
    person: 'এস. এম. ফারুক', personNote: 'বহিঃনিরীক্ষক · সময়সীমাবদ্ধ · শুধু পঠন',
    landing: 'a35', limit: 0, ro: true,
    note: 'আর্থিক বিবরণ ও রেগুলেটরি রিটার্ন থেকে শুরু; রিপোর্ট কেন্দ্র ও অডিট লগ। কোনো এন্ট্রি নয়।' }
];

/* Super Admin (প্ল্যাটফর্ম মালিক) — ব্যবহারকারীর নির্দেশ: **এখন ডিজাইন করা হচ্ছে না**।
   তালিকাটি `specs/03-multi-module-platform-architecture.md` §৮.৬ থেকে নেওয়া (পরিকল্পিত, তৈরি নয়)। */
const WS_SUPERADMIN_PLANNED = [
  ['P-01', 'প্ল্যাটফর্ম ড্যাশবোর্ড', 'টেনান্ট, সক্রিয় মডিউল, স্বাস্থ্য'],
  ['P-02', 'সমিতির আবেদন কিউ', 'যাচাই, প্রত্যাখ্যান, তথ্য চেয়ে ফেরত'],
  ['P-03', 'আবেদন বিস্তারিত ও অনুমোদন', 'নথি যাচাই, NID ডেডুপ (D-36-খ)'],
  ['P-04', 'টেনান্ট তালিকা ও প্রোফাইল', 'অবস্থা, প্ল্যান, মেয়াদ'],
  ['P-05', 'প্ল্যান ব্যবস্থাপনা', 'মডিউল, সীমা, মূল্য (D-43)'],
  ['P-06', 'সাবস্ক্রিপশন ও এনটাইটেলমেন্ট', 'snapshot, পরিবর্তন ইতিহাস'],
  ['P-07', 'মডিউল রেজিস্ট্রি', 'module_key, সংস্করণ, চালু/বন্ধ'],
  ['P-08', 'প্ল্যাটফর্ম অডিট লগ', 'সব break-glass প্রবেশ এখানে'],
  ['P-09', 'টেনান্ট সাসপেনশন/অফবোর্ডিং', 'ডেটা রপ্তানি, আর্কাইভ (D-30)'],
  ['P-10', 'SMS কোটা ও টেমপ্লেট নিয়ন্ত্রণ', 'টেনান্টভিত্তিক'],
  ['P-11', 'প্ল্যাটফর্ম সেটিংস', 'ব্র্যান্ডিং (D-70), লোকাল, সময় অঞ্চল'],
  ['P-12', 'প্ল্যাটফর্ম রিপোর্ট', 'ব্যবহার, রাজস্ব (D-71)']
];

/* ---------------------------------------------------------------- অবস্থা */
const WS = { built: false, html: {}, graph: {}, d2m: {}, m2d: {}, byCode: {}, stages: {} };

function wsRole(key) { return WS_ROLES.find(r => r.key === key) || null; }
function wsMeta(id) { return (typeof screenMeta === 'function') ? screenMeta(id) : META.find(m => m.id === id) || null; }
function wsIsMob(id) { const m = wsMeta(id); return !!m && (m.id[0] === 'm' || m.pres === 'app' || m.variant === 'mobile'); }

/* সব স্ক্রিন একবার রেন্ডার করে ক্যাশে — গ্রাফ, থাম্বনেইল ও স্টেজ সবাই একই ক্যাশ ব্যবহার করে */
function wsBuild() {
  if (WS.built) return WS;
  META.forEach(m => {
    let out = '';
    try { out = renderScreen(m.id) || ''; } catch (e) { out = ''; console.warn('[ws] render fail ' + m.id, e.message); }
    WS.html[m.id] = out;
    const t = new Set();
    let mm;
    const re1 = /go\('#([a-z0-9]+)'\)/g;
    while ((mm = re1.exec(out))) t.add(mm[1]);
    const re2 = /href="#([a-z0-9]+)"/g;
    while ((mm = re2.exec(out))) t.add(mm[1]);
    WS.graph[m.id] = [...t].filter(x => x !== m.id && META.some(z => z.id === x));
  });
  /* কোড → আইডি এবং মোবাইল ↔ ডেস্কটপ ম্যাপ (META.logical থেকে, হাতে লেখা নয়) */
  META.forEach(m => { WS.byCode[m.code.toUpperCase()] = m.id; });
  META.filter(m => m.pres === 'app').forEach(m => {
    WS.m2d[m.id] = [];
    String(m.logical || '').split('+').forEach(part => {
      const code = part.trim().toUpperCase();
      const did = WS.byCode[code];
      if (did) { WS.m2d[m.id].push(did); WS.d2m[did] = m.id; }
    });
  });
  /* A-01/A-02 ড্যাশবোর্ড ও কিউ — যেগুলোর মোবাইল রূপ ভিন্ন AM স্ক্রিনে আছে */
  const extra = { a01: 'am01', a02: 'am04', a20: 'am02', a22: 'am02', a21: 'am03', a23: 'am03', a07: 'am04' };
  Object.keys(extra).forEach(k => { if (!WS.d2m[k]) WS.d2m[k] = extra[k]; });
  WS.built = true;
  return WS;
}

/* একটি স্ক্রিন থেকে পৌঁছানো যায় এমন স্ক্রিন (লিংক-ভিত্তিক প্রবাহ) */
function wsLinks(id) { wsBuild(); return WS.graph[id] || []; }

/* ভূমিকাভিত্তিক পৌঁছানোর তালিকা ------------------------------------------------
   মোবাইল: শেল নেভ (৫ স্লট) + হ্যামবার্গার ড্রয়ারের সম্পূর্ণ ANAV (D-35 চুক্তি) + স্ক্রিনের নিজস্ব লিংক।
   ওয়েব: সাইডবারের সম্পূর্ণ ANAV + স্ক্রিনের নিজস্ব লিংক। */
function wsRoleNav(platform, roleKey) {
  wsBuild();
  const r = wsRole(roleKey);
  if (!r) return { primary: [], drawer: [], all: [] };
  if (platform === 'mob') {
    if (r.key === 'MEMBER') {
      const primary = MNAV.map(n => ({ label: n.l, id: n.go.replace('#', ''), fab: !!n.fab }));
      const all = wsBfs('m01', id => wsIsMob(id));
      return { primary, drawer: [], all };
    }
    const sh = ADMIN_SHELLS[r.key] || ADMIN_SHELLS.MANAGER;
    const nav = sh.nav.slice();
    if (sh.fab) nav.splice(Math.ceil(nav.length / 2), 0, Object.assign({ fab: true }, sh.fab));
    const primary = nav.slice(0, 5).map(n => ({ label: n.l, id: n.go.replace('#', ''), fab: !!n.fab, cnt: n.cnt }));
    /* ড্রয়ার = সম্পূর্ণ ANAV → মোবাইল রূপে ম্যাপ করা */
    const drawer = [];
    ANAV.forEach(g => g.items.forEach(i => {
      const mob = WS.d2m[i.go.replace('#', '')] || i.go.replace('#', '');
      drawer.push({ group: g.g, label: i.l, id: mob, deskId: i.go.replace('#', ''), cnt: i.cnt });
    }));
    /* শুধু মোবাইল স্ক্রিন — শেয়ার্ড পেজের ডেস্কটপ ভ্যারিয়েন্ট (S-05/S-06/S-08) মোবাইল তালিকায় আসবে না */
    const all = wsBfs(r.landing, id => wsIsMob(id), r.key);
    return { primary, drawer, all };
  }
  const drawer = [];
  ANAV.forEach(g => g.items.forEach(i => drawer.push({ group: g.g, label: i.l, id: i.go.replace('#', ''), cnt: i.cnt })));
  const all = wsBfs(r.landing, id => !wsIsMob(id) || id[0] === 's', r.role || r.key);
  return { primary: drawer.slice(0, 1), drawer, all };
}

function wsBfs(start, allow, roleKey) {
  wsBuild();
  const seen = new Set([start]), q = [start], out = [start];
  const sh = roleKey && ADMIN_SHELLS[roleKey] ? ADMIN_SHELLS[roleKey] : null;
  while (q.length) {
    const cur = q.shift();
    const next = new Set(wsLinks(cur));
    if (sh && wsMeta(cur) && (wsMeta(cur).pres === 'app' || cur[0] === 's')) {
      sh.nav.forEach(n => next.add(n.go.replace('#', '')));
      if (sh.fab) next.add(sh.fab.go.replace('#', ''));
      ANAV.forEach(g => g.items.forEach(i => {
        const did = i.go.replace('#', '');
        next.add(WS.d2m[did] || did);
      }));
    }
    next.forEach(n => {
      if (seen.has(n) || !wsMeta(n)) return;
      const mob = wsIsMob(n) ? n : (WS.d2m[n] || n);
      if (seen.has(mob)) return;
      if (!allow(mob)) return;
      seen.add(mob); out.push(mob); q.push(mob);
    });
  }
  return out;
}

/* ---------------------------------------------------------------- ক্যাটাগরি
   ১ Admin App · ২ Member App · ৩ Collector App · ৪ Other Roles App · ৫ Web Panel · ৬ Live Prototype */
function wsCategories() {
  wsBuild();
  const appScreens = META.filter(m => m.pres === 'app');
  const memScreens = META.filter(m => m.id[0] === 'm');
  const shMob = META.filter(m => m.id[0] === 's' && m.variant === 'mobile');
  const shDesk = META.filter(m => m.id[0] === 's' && m.variant !== 'mobile');
  const webScreens = META.filter(m => m.id[0] === 'a' && m.pres !== 'app');
  const groupOf = id => {
    const key = (typeof AMNAV_SCREEN !== 'undefined' ? AMNAV_SCREEN : {})[id];
    if (!key) return 'অন্যান্য';
    let g = 'অন্যান্য';
    ANAV.forEach(gr => gr.items.forEach(i => { if (i.k === key) g = gr.g; }));
    return g;
  };
  const byGroup = list => {
    const map = {};
    list.forEach(m => { const g = groupOf(m.id); (map[g] = map[g] || []).push(m.id); });
    return map;
  };
  return [
    { key: 'adminapp', num: '১', title: 'Admin App', bn: 'অ্যাডমিন মোবাইল অ্যাপ', platform: 'mob',
      sub: 'একই Backend · একই নিয়ম · আলাদা UI (D-35 রোলভিত্তিক শেল)',
      ids: appScreens.map(m => m.id), groups: byGroup(appScreens), count: appScreens.length,
      roles: ['COLLECTOR', 'ACCOUNTANT', 'MANAGER', 'APPROVER', 'ORG_ADMIN', 'AUDITOR', 'EXTERNAL_AUDITOR', 'VIEWER'] },
    { key: 'memberapp', num: '২', title: 'Member App', bn: 'সদস্য মোবাইল অ্যাপ', platform: 'mob',
      sub: 'মোবাইল-ফার্স্ট · MNAV ৫ স্লট · লগইন করা সদস্য: আব্দুল করিম',
      ids: memScreens.map(m => m.id).concat(shMob.filter(m => ['s01', 's02', 's03', 's04', 's07'].includes(m.id)).map(m => m.id)),
      groups: { 'সদস্য অ্যাপ': memScreens.map(m => m.id), 'শেয়ার্ড (মোবাইল)': shMob.map(m => m.id) },
      count: memScreens.length + shMob.length, roles: ['MEMBER'] },
    { key: 'collectorapp', num: '৩', title: 'Collector App', bn: 'মাঠ সংগ্রহক অ্যাপ', platform: 'mob',
      sub: 'Shell-A · রাজু আহমেদ (u3) · অনুমোদন সীমা ৳০ · অফলাইন sync',
      ids: wsRoleNav('mob', 'COLLECTOR').all, groups: null, count: 0, roles: ['COLLECTOR'] },
    { key: 'otherroles', num: '৪', title: 'Other Roles App', bn: 'অন্যান্য ভূমিকার মোবাইল অ্যাপ', platform: 'mob',
      sub: 'হিসাবরক্ষক · ব্যবস্থাপক · অনুমোদনকারী · সমিতি প্রশাসক · নিরীক্ষক · বহিঃনিরীক্ষক · পর্যবেক্ষক',
      ids: [], groups: null, count: 0,
      roles: ['ACCOUNTANT', 'MANAGER', 'APPROVER', 'ORG_ADMIN', 'AUDITOR', 'EXTERNAL_AUDITOR', 'VIEWER'] },
    { key: 'webpanel', num: '৫', title: 'Web Panel', bn: 'ডেস্কটপ ওয়েব প্যানেল', platform: 'web',
      sub: 'Admin Web (সাইডবার IA) · Super Admin Web = পরিকল্পিত, ডিজাইন স্থগিত',
      ids: webScreens.map(m => m.id).concat(shDesk.map(m => m.id)),
      groups: byGroup(webScreens), count: webScreens.length + shDesk.length,
      roles: ['W_ORG_ADMIN', 'W_MANAGER', 'W_APPROVER', 'W_ACCOUNTANT', 'W_COLLECTOR', 'W_AUDITOR'] },
    { key: 'live', num: '৬', title: 'Live Prototype', bn: 'ইন্টারঅ্যাকটিভ প্রোটোটাইপ ওয়ার্কস্পেস', platform: 'both',
      sub: 'প্রতিটি ভূমিকা ও প্ল্যাটফর্মের অ্যাপ বাস্তব অ্যাপের মতো চালিয়ে দেখুন',
      ids: [], groups: null, count: 0, roles: [] }
  ];
}

/* ---------------------------------------------------------------- স্টেজ রেন্ডার */
function wsRewire(html, platform) {
  return String(html)
    .replace(/onclick="go\(/g, `onclick="wsgo('${platform}',`)
    .replace(/onclick='go\(/g, `onclick='wsgo('${platform}',`);
}

/* মোবাইল স্টেজ: ফোন ফ্রেম (৩৯০ × ৮৪৪) — গ্যালারির একই চুক্তি */
function wsMobileStage(id, roleKey) {
  const r = wsRole(roleKey);
  window.__AM_ROLE = (r && r.key !== 'MEMBER' && ADMIN_SHELLS[r.key]) ? r.key : null;
  window.__WS_MOB = { name: r ? r.person : 'মোঃ আব্দুল্লাহ' };
  const inner = renderScreen(id) || '';
  window.__AM_ROLE = null;
  return `<div class="phone ws-phone"><div class="notch"></div>${wsRewire(inner, 'mob')}</div>`;
}

/* ডেস্কটপ স্টেজ: ব্রাউজার ফ্রেম — গ্যালারির `.scr-h/.scr-f` বাদে শুধু অ্যাপ অংশ */
function wsWebStage(id, roleKey) {
  const m = wsMeta(id);
  /* কিছু স্ক্রিন ডিজাইনগতভাবেই মোবাইল ভ্যারিয়েন্ট (যেমন A-02 মাঠ সংগ্রহক ড্যাশবোর্ড) —
     সেগুলো ডেস্কটপ স্টেজে ফোন ফ্রেমে দেখানো হয়, সাথে স্পষ্ট নোট (ভিউ টগল নয়)। */
  if (m && m.variant === 'mobile') {
    const note = `<div class="ws-mobnote">📱 <b>${m.code} ${m.name}</b> ডিজাইনগতভাবে একটি <b>মোবাইল ভ্যারিয়েন্ট</b> — তাই ডেস্কটপ ওয়ার্কস্পেসে ফোন ফ্রেমে দেখানো হচ্ছে। মোবাইল অ্যাপ ওয়ার্কস্পেসে খুলতে: <a href="workspace.html#mob::${id}" style="color:var(--lime)">এখানে চাপুন</a>।</div>`;
    return note + `<div class="ws-stage mob" style="justify-content:center;padding-top:14px">${wsMobileStage(id, roleKey && wsRole(roleKey) && wsRole(roleKey).role ? wsRole(roleKey).role : null)}</div>`;
  }
  const r = wsRole(roleKey);
  const lim = r ? (r.limit === null ? 'নেই' : (r.limit === 0 ? '৳০' : tk(r.limit))) : tk(5000000);
  window.__WS_WEB = r ? { name: r.person, roleBn: r.bn, limitText: lim, ro: !!r.ro } : null;
  const raw = renderScreen(id) || '';
  window.__WS_WEB = null;
  const d = document.createElement('div');
  d.innerHTML = raw;
  const body = d.querySelector('.browser');
  const out = body ? body.outerHTML : (d.querySelector('.scr-b') ? d.querySelector('.scr-b').innerHTML : raw);
  return `<div class="ws-webframe">${wsRewire(out, 'web')}</div>`;
}

/* থাম্বনেইল (প্রিভিউ ড্যাশবোর্ডের কার্ডে) — wsBuild()-এর ক্যাশ ব্যবহার করে, তাই অতিরিক্ত রেন্ডার হয় না */
function wsThumbHtml(id, platform) {
  wsBuild();
  const raw = WS.html[id] || '';
  if (platform === 'web' && !wsIsMob(id)) {
    const d = document.createElement('div'); d.innerHTML = raw;
    const b = d.querySelector('.browser');
    return b ? b.outerHTML : raw;
  }
  return `<div class="phone"><div class="notch"></div>${raw}</div>`;
}
function wsThumb(id, platform, scale) {
  const m = wsMeta(id);
  if (!m) return '';
  const isWeb = platform === 'web' && !wsIsMob(id);
  const sc = scale || (isWeb ? 0.17 : 0.3);
  return `<div class="ws-thumb ${isWeb ? 'web' : 'mob'}"><div class="ws-thumb-in" style="transform:scale(${sc})">${wsThumbHtml(id, platform)}</div></div>`;
}

/* ---------------------------------------------------------------- নেভিগেশন */
function wsResolve(platform, sel) {
  if (!sel) return null;
  if (!sel.startsWith('#')) return { external: sel };
  let id = sel.slice(1);
  if (!wsMeta(id)) return { missing: id };
  if (platform === 'mob' && !wsIsMob(id)) {
    const mob = WS.d2m[id];
    if (mob && wsMeta(mob)) return { id: mob, mapped: id };
    return { deskOnly: id };
  }
  if (platform === 'web' && wsIsMob(id) && id[0] !== 's') {
    const list = WS.m2d[id] || [];
    if (list.length && wsMeta(list[0])) return { id: list[0], mapped: id };
    return { mobOnly: id };
  }
  return { id };
}

function wsgo(platform, sel) {
  const st = WS.stages[platform];
  const res = wsResolve(platform, sel);
  if (!res) return;
  if (res.external) { location.href = res.external; return; }
  if (res.missing || res.deskOnly || res.mobOnly) {
    const code = (res.missing || res.deskOnly || res.mobOnly).toUpperCase();
    wsToast(platform, res.deskOnly
      ? `<b>${wsMeta(res.deskOnly).code}</b> এই স্ক্রিনের মোবাইল রূপ নেই — ডেস্কটপ ওয়েব ওয়ার্কস্পেসে খুলুন (নিচের লিংক)।`
      : res.mobOnly
        ? (() => { const mm = wsMeta(res.mobOnly); return `<b>${mm.code} ${mm.name}</b> একটি <b>মোবাইল অ্যাপ স্ক্রিন</b> (ভূমিকা: ${mm.role || '—'}) — ডেস্কটপ ওয়েব প্যানেলে এর রূপ নেই; নিচের বোতামে মোবাইল অ্যাপ ওয়ার্কস্পেসে খুলুন।`; })()
        : `<b>${code}</b> স্ক্রিনটি তৈরি নেই (সাব-প্যানেল, D-34)।`);
    if (res.deskOnly) wsOfferOther(platform, res.deskOnly, 'web');
    if (res.mobOnly) wsOfferOther(platform, res.mobOnly, 'mob');
    return;
  }
  if (!st) return;
  st.stack = st.stack.slice(0, st.idx + 1);
  st.stack.push(res.id);
  st.idx = st.stack.length - 1;
  wsRenderStage(platform);
  wsSyncHash();
}

function wsOfferOther(platform, id, target) {
  const st = WS.stages[platform];
  if (!st || !st.el) return;
  const bar = st.el.querySelector('.ws-jumpbar');
  if (bar) bar.innerHTML = `<button class="ws-btn ghost" onclick="wsLaunch('${target}','${id}')">এখনই ${target === 'web' ? 'ডেস্কটপ ওয়েব' : 'মোবাইল অ্যাপ'} ওয়ার্কস্পেসে খুলুন →</button>`;
}

function wsToast(platform, html) {
  const st = WS.stages[platform];
  const host = st && st.toastEl ? st.toastEl : document.body;
  let t = host.querySelector('.ws-toast');
  if (!t) { t = document.createElement('div'); t.className = 'ws-toast'; host.appendChild(t); }
  t.innerHTML = html;
  t.classList.add('on');
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), 4200);
}

function wsBack(platform) {
  const st = WS.stages[platform];
  if (!st || st.idx <= 0) return;
  st.idx--; wsRenderStage(platform); wsSyncHash();
}
function wsFwd(platform) {
  const st = WS.stages[platform];
  if (!st || st.idx >= st.stack.length - 1) return;
  st.idx++; wsRenderStage(platform); wsSyncHash();
}
function wsSetRole(platform, roleKey) {
  const st = WS.stages[platform];
  const r = wsRole(roleKey);
  if (!st || !r) return;
  st.role = roleKey;
  st.stack = [r.landing]; st.idx = 0;
  wsRenderStage(platform); wsSyncHash();
}
function wsLaunch(platform, id, roleKey) {
  const st = WS.stages[platform];
  if (!st) { location.href = `workspace.html#${platform}:${roleKey || ''}:${id}`; return; }
  if (roleKey) st.role = roleKey;
  st.stack = [id]; st.idx = 0;
  wsRenderStage(platform); wsSyncHash();
  st.el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function wsSyncHash() {
  const m = WS.stages.mob, w = WS.stages.web;
  const parts = [];
  if (m) parts.push(`mob:${m.role}:${m.stack[m.idx]}`);
  if (w) parts.push(`web:${w.role}:${w.stack[w.idx]}`);
  const h = parts.join('|');
  if (location.hash.slice(1) !== h) history.replaceState(null, '', '#' + h);
}

function wsReadHash() {
  const h = decodeURIComponent(location.hash.slice(1));
  if (!h) return {};
  const out = {};
  h.split('|').forEach(p => {
    const [plat, role, id] = p.split(':');
    if (plat && id) out[plat] = { role, id };
    else if (plat && role && !id) out[plat] = { role, id: null };
  });
  /* সহজ ফরম্যাট: #am12 বা #a01 */
  if (!out.mob && !out.web) {
    const id = h.replace('#', '');
    if (wsMeta(id)) { if (wsIsMob(id)) out.mob = { role: null, id }; else out.web = { role: null, id }; }
  }
  return out;
}

/* ---------------------------------------------------------------- স্টেজ মাউন্ট */
function wsCreateStage(platform, els) {
  const st = {
    platform, el: els.root, stageEl: els.stage, roleEl: els.roles, listEl: els.list,
    crumbEl: els.crumb, infoEl: els.info, toastEl: els.toast || els.root,
    role: els.role || (platform === 'mob' ? 'MEMBER' : 'W_MANAGER'), stack: [], idx: -1
  };
  WS.stages[platform] = st;
  const r = wsRole(st.role);
  st.stack = [r ? r.landing : (platform === 'mob' ? 'm01' : 'a01')];
  st.idx = 0;
  wsRenderStage(platform);
  return st;
}

function wsRenderStage(platform) {
  const st = WS.stages[platform];
  if (!st) return;
  const id = st.stack[st.idx];
  const r = wsRole(st.role);
  const m = wsMeta(id);
  /* ১) স্ক্রিন */
  st.stageEl.innerHTML = platform === 'mob' ? wsMobileStage(id, st.role) : wsWebStage(id, st.role);
  const ph = st.stageEl.querySelector('.phone-scroll');
  if (ph) ph.scrollTop = 0;
  const bb = st.stageEl.querySelector('.browser-body');
  if (bb) bb.scrollTop = 0;
  /* ২) ভূমিকা ট্যাব */
  if (st.roleEl) {
    st.roleEl.innerHTML = WS_ROLES.filter(x => x.platform === platform).map(x =>
      `<button class="ws-role ${x.key === st.role ? 'on' : ''}" onclick="wsSetRole('${platform}','${x.key}')" title="${x.personNote}">
         <b>${x.bn}</b><i>${x.shell || (x.key === 'MEMBER' ? 'MNAV' : '')}</i>${x.ro ? '<u>শুধু পঠন</u>' : ''}</button>`).join('');
  }
  /* ৩) এই ভূমিকার নেভিগেশন তালিকা */
  if (st.listEl) {
    const nav = wsRoleNav(platform, st.role);
    let h = '';
    if (platform === 'mob') {
      h += `<div class="ws-lbl">বটম নেভ (৫ স্লট)${r && r.key !== 'MEMBER' ? ' · ' + r.shell : ''}</div><div class="ws-navlist">` +
        nav.primary.map(n => `<button class="ws-nav ${n.id === id ? 'on' : ''}" onclick="wsgo('${platform}','#${n.id}')">${n.fab ? '⊕ ' : ''}${n.label}<code>${wsMeta(n.id) ? wsMeta(n.id).code : n.id}</code></button>`).join('') + '</div>';
      if (nav.drawer && nav.drawer.length) {
        h += `<div class="ws-lbl">হ্যামবার্গার ড্রয়ার — সম্পূর্ণ ANAV (২৫ আইটেম / ৬ গ্রুপ)</div>`;
        let lastG = null;
        nav.drawer.forEach(n => {
          if (n.group !== lastG) { h += `<div class="ws-g">${n.group}</div>`; lastG = n.group; }
          const mm = wsMeta(n.id);
          h += `<button class="ws-nav ${n.id === id ? 'on' : ''} ${mm ? '' : 'dis'}" ${mm ? `onclick="wsgo('${platform}','#${n.id}')"` : 'disabled'}>${n.label}<code>${mm ? mm.code : 'মোবাইল রূপ নেই'}</code></button>`;
        });
      }
    } else {
      h += `<div class="ws-lbl">সাইডবার — সম্পূর্ণ ANAV</div>`;
      let lastG = null;
      nav.drawer.forEach(n => {
        if (n.group !== lastG) { h += `<div class="ws-g">${n.group}</div>`; lastG = n.group; }
        h += `<button class="ws-nav ${n.id === id ? 'on' : ''}" onclick="wsgo('${platform}','#${n.id}')">${n.label}<code>${wsMeta(n.id) ? wsMeta(n.id).code : n.id}</code></button>`;
      });
    }
    st.listEl.innerHTML = h;
  }
  /* ৪) ব্রেডক্রাম্ব + স্ক্রিন তথ্য */
  if (st.crumbEl) {
    st.crumbEl.innerHTML = `<button class="ws-btn sm" onclick="wsBack('${platform}')" ${st.idx === 0 ? 'disabled' : ''}>← পেছনে</button>
      <button class="ws-btn sm" onclick="wsFwd('${platform}')" ${st.idx >= st.stack.length - 1 ? 'disabled' : ''}>সামনে →</button>
      <span class="ws-trail">${st.stack.slice(0, st.idx + 1).map((s, i) =>
        `<b class="${i === st.idx ? 'on' : ''}" onclick="wsJumpTo('${platform}',${i})">${wsMeta(s) ? wsMeta(s).code : s}</b>`).join('<i>→</i>')}</span>
      <button class="ws-btn sm ghost" onclick="wsSetRole('${platform}','${st.role}')">রোল রিসেট</button>
      <a class="ws-btn sm ghost" href="screens.html#${id}">গ্যালারিতে দেখুন</a>`;
  }
  if (st.infoEl && m) {
    st.infoEl.innerHTML = `<div class="ws-info">
      <div class="ws-irow"><b>${m.code}</b><span>${m.name}</span></div>
      <div class="ws-irow mut">ভূমিকা: <b>${r ? r.bn : '—'}</b> · ${r ? r.person : ''} ${m.pres === 'app' ? '· প্রেজেন্টেশন: মোবাইল অ্যাপ (লজিক্যাল পেজ ' + (m.logical || m.code) + ')' : (wsIsMob(m.id) ? '· মোবাইল' : '· ডেস্কটপ ওয়েব')}</div>
      <div class="ws-irow mut">লক্ষ্য: ${m.goal}</div>
      ${r ? `<div class="ws-irow mut">${r.note}</div>` : ''}
      <div class="ws-jumpbar"></div>
    </div>`;
    st.el.querySelector('.ws-jumpbar') && (st.toastHost = st.el.querySelector('.ws-jumpbar'));
  }
}

function wsJumpTo(platform, i) {
  const st = WS.stages[platform];
  if (!st) return;
  st.idx = i; wsRenderStage(platform); wsSyncHash();
}
