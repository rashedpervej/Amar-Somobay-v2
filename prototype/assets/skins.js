/* ============================================================
   Somobay · Skin System runtime  (prototype/assets/skins.js)
   শুধু গ্যালারি/ডেমো চালানোর জন্য। আসল অ্যাপে স্কিন প্রয়োগ = `data-theme` অ্যাট্রিবিউট
   (assets/skins.css-এর চুক্তি দেখুন)। কোনো বিদ্যমান স্ক্রিনের মার্কআপ এখানে বদলানো হয় না।
   ============================================================ */

const SKINS = [
  { key: 'default', theme: '', module: 'general_savings', bn: 'ডিফল্ট (বর্তমান)', en: 'Default · বিদ্যমান ui.css',
    tag: 'data-theme ছাড়া — বিদ্যমান ১০২ স্ক্রিন হুবহু অপরিবর্তিত',
    status: 'live', islamic: false, pages: 'সব ১০২ স্ক্রিন (M · A · AM · S)' },
  { key: 'gs', theme: 'gs', module: 'general_savings', bn: 'General Savings', en: 'সাধারণ সঞ্চয়',
    tag: 'মডিউল ১ · বিদ্যমান সবুজ পরিচয় · ডিজাইন রেফারেন্স',
    status: 'live', islamic: false, pages: 'বিদ্যমান সঞ্চয় স্ক্রিন (M-01…M-21, A-01…A-38, AM-01…AM-35)' },
  { key: 'rosca', theme: 'rosca', module: 'rosca', bn: 'ROSCA', en: 'চক্রভিত্তিক সঞ্চয় পুল',
    tag: 'মডিউল ২ · নীল · সদস্য-চক্র জ্যামিতি · ১৮ পেজ পরিকল্পিত',
    status: 'planned', islamic: false, pages: 'RA-01…RA-12 · RM-01…RM-06 — এখনো তৈরি হয়নি (Phase 1B)' },
  { key: 'jg', theme: 'jg', module: 'joint_goal', bn: 'Joint Goal', en: 'যৌথ লক্ষ্য সঞ্চয়',
    tag: 'মডিউল ৩ · বেগুনি · যুগ্ম-ত্রিভুজ জ্যামিতি · ১৫ পেজ পরিকল্পিত',
    status: 'planned', islamic: false, pages: 'JA-01…JA-10 · JM-01…JM-05 — এখনো তৈরি হয়নি (Phase 2A)' },
  { key: 'qh', theme: 'qh', module: 'qard_hasanah', bn: 'Qard Hasanah · ইসলামিক', en: 'সুদমুক্ত সহায়তা তহবিল',
    tag: 'মডিউল ৪ · পান্না সবুজ + সোনালি · ৮-কোণা তারকা ও গিরিহ প্যাটার্ন · মিহরাব আর্চ · ক্যালিগ্রাফি',
    status: 'planned', islamic: true, pages: 'QA-01…QA-17 · QM-01…QM-08 — এখনো তৈরি হয়নি (D-36…D-45 চূড়ান্ত হলে)' },
  { key: 'platform', theme: 'platform', module: 'platform', bn: 'Platform / Super Admin', en: 'প্ল্যাটফর্ম মালিক',
    tag: 'গ্রাফাইট + হালকা বেগুনি · টেনান্ট-গ্রিড জ্যামিতি · ১২ পেজ পরিকল্পিত',
    status: 'planned', islamic: false, pages: 'P-01…P-12 — ডিজাইন স্থগিত (আপনার নির্দেশ)' }
];

/* স্কোপড টোকেন — গ্যালারিতে সোয়াচ হিসেবে দেখানো হয় */
const SK_TOKENS = [
  ['--mod-950', 'গাঢ়তম (সাইডবার নিচ)'], ['--mod-900', 'গাঢ় (সাইডবার/ড্রয়ার)'],
  ['--mod-800', 'হেডার গাঢ়'], ['--mod-700', 'প্রাইমারি ব্র্যান্ড'],
  ['--mod-600', 'বাটন গ্রেডিয়েন্ট'], ['--mod-500', 'হোভার/লিংক'],
  ['--mod-100', 'হালকা টিন্ট'], ['--mod-050', 'পৃষ্ঠতল টিন্ট'],
  ['--mod-hi', 'হাইলাইট (--lime)'], ['--mod-hi-2', 'হাইলাইট জোড়া'],
  ['--mod-hi-soft', 'চিপ পটভূমি'], ['--mod-hi-ink', 'চিপ লেখা'],
  ['--mod-sub', 'গাঢ় হেডারের সাব-টেক্সট'], ['--mod-hero-3', 'হিরো গ্রেডিয়েন্ট শেষ'],
  ['--mod-g28', 'হাইলাইট আভা (২৮%)']
];

/* skins.css-এর মানের হুবহু প্রতিচ্ছবি — যেসব ব্রাউজার/পরিবেশ getComputedStyle দিয়ে
   কাস্টম প্রপার্টি সমাধান করতে পারে না, সেখানে সোয়াচ ও কনট্রাস্ট হিসাব এই টেবিল থেকে হয়।
   ⚠️ skins.css বদলালে এই টেবিলও বদলাতে হবে (হার্নেস /tmp/tsk.mjs ড্রিফট ধরে)। */
const SK_VALUES = {
  'gs': {
    '--mod-950': '#052A20',
    '--mod-900': '#04231A',
    '--mod-800': '#064437',
    '--mod-700': '#0B6B53',
    '--mod-600': '#0E8266',
    '--mod-500': '#12A273',
    '--mod-100': '#E6F7EF',
    '--mod-050': '#F2FBF7',
    '--mod-hi': '#C9F26E',
    '--mod-hi-2': '#7FD98D',
    '--mod-hi-3': '#A8E85C',
    '--mod-on-hi': '#06281F',
    '--mod-hi-soft': '#EAFBC4',
    '--mod-hi-ink': '#4A6B00',
    '--mod-hi-bd': '#D6EEA0',
    '--mod-sub': '#9FC4B6',
    '--mod-hero-3': '#0A5A47',
    '--mod-glow': 'rgba(11,107,83,.95)',
    '--mod-glow-hi': 'rgba(168,232,92,.95)',
    '--mod-g13': 'rgba(201,242,110,.13)',
    '--mod-g14': 'rgba(201,242,110,.14)',
    '--mod-g28': 'rgba(201,242,110,.28)',
    '--mod-hero-glow': 'rgba(201,242,110,.28)'
  },
  'rosca': {
    '--mod-950': '#04203F',
    '--mod-900': '#062A52',
    '--mod-800': '#0A3C74',
    '--mod-700': '#0F4E96',
    '--mod-600': '#1668C8',
    '--mod-500': '#2A86E8',
    '--mod-100': '#E4EEFB',
    '--mod-050': '#F3F8FE',
    '--mod-hi': '#9BE0FF',
    '--mod-hi-2': '#67C7F5',
    '--mod-hi-3': '#7FD4FF',
    '--mod-on-hi': '#06283F',
    '--mod-hi-soft': '#E1F3FF',
    '--mod-hi-ink': '#0B4A73',
    '--mod-hi-bd': '#B6E0F7',
    '--mod-sub': '#A6C6E8',
    '--mod-hero-3': '#0D4E8F',
    '--mod-glow': 'rgba(15,78,150,.95)',
    '--mod-glow-hi': 'rgba(103,199,245,.9)',
    '--mod-g13': 'rgba(155,224,255,.15)',
    '--mod-g14': 'rgba(155,224,255,.16)',
    '--mod-g28': 'rgba(155,224,255,.32)',
    '--mod-hero-glow': 'rgba(155,224,255,.3)'
  },
  'jg': {
    '--mod-950': '#1E1440',
    '--mod-900': '#251A4E',
    '--mod-800': '#33246B',
    '--mod-700': '#4A3588',
    '--mod-600': '#5C43AE',
    '--mod-500': '#6B4FC0',
    '--mod-100': '#F0EBFC',
    '--mod-050': '#F8F5FE',
    '--mod-hi': '#D9C4FF',
    '--mod-hi-2': '#B79BF5',
    '--mod-hi-3': '#C9B2FF',
    '--mod-on-hi': '#22143F',
    '--mod-hi-soft': '#EFE7FF',
    '--mod-hi-ink': '#4A3588',
    '--mod-hi-bd': '#D8CDF3',
    '--mod-sub': '#BEB0DE',
    '--mod-hero-3': '#4A3588',
    '--mod-glow': 'rgba(74,53,136,.95)',
    '--mod-glow-hi': 'rgba(183,155,245,.9)',
    '--mod-g13': 'rgba(217,196,255,.15)',
    '--mod-g14': 'rgba(217,196,255,.16)',
    '--mod-g28': 'rgba(217,196,255,.3)',
    '--mod-hero-glow': 'rgba(217,196,255,.28)'
  },
  'qh': {
    '--mod-950': '#03211A',
    '--mod-900': '#04231C',
    '--mod-800': '#064437',
    '--mod-700': '#0B6B52',
    '--mod-600': '#0E8264',
    '--mod-500': '#12A273',
    '--mod-100': '#E8F5EF',
    '--mod-050': '#F4FBF7',
    '--mod-hi': '#E9CE8B',
    '--mod-hi-2': '#D4B464',
    '--mod-hi-3': '#E3C67F',
    '--mod-on-hi': '#3A2E08',
    '--mod-hi-soft': '#FBF3DE',
    '--mod-hi-ink': '#6B5210',
    '--mod-hi-bd': '#E7D6A6',
    '--mod-sub': '#A9CFC0',
    '--mod-hero-3': '#0A5A47',
    '--mod-glow': 'rgba(11,107,82,.95)',
    '--mod-glow-hi': 'rgba(212,180,100,.85)',
    '--mod-g13': 'rgba(233,206,139,.15)',
    '--mod-g14': 'rgba(233,206,139,.16)',
    '--mod-g28': 'rgba(233,206,139,.34)',
    '--mod-hero-glow': 'rgba(233,206,139,.26)',
    '--mod-gold': '#C9A227',
    '--mod-gold-deep': '#7E6410',
    '--mod-gold-soft': '#F6EBD2'
  },
  'platform': {
    '--mod-950': '#12151B',
    '--mod-900': '#171B23',
    '--mod-800': '#1F2530',
    '--mod-700': '#2B3444',
    '--mod-600': '#3A465A',
    '--mod-500': '#4C5C74',
    '--mod-100': '#E9ECF2',
    '--mod-050': '#F5F7FA',
    '--mod-hi': '#B9A6E8',
    '--mod-hi-2': '#9A85D6',
    '--mod-hi-3': '#C4B4EE',
    '--mod-on-hi': '#1B1430',
    '--mod-hi-soft': '#EFEBFB',
    '--mod-hi-ink': '#4A3D75',
    '--mod-hi-bd': '#D8CEF2',
    '--mod-sub': '#A8B2C4',
    '--mod-hero-3': '#2B3444',
    '--mod-glow': 'rgba(43,52,68,.9)',
    '--mod-glow-hi': 'rgba(185,166,232,.8)',
    '--mod-g13': 'rgba(185,166,232,.15)',
    '--mod-g14': 'rgba(185,166,232,.16)',
    '--mod-g28': 'rgba(185,166,232,.3)',
    '--mod-hero-glow': 'rgba(185,166,232,.24)'
  }
};

const SK_IC = (typeof ic === 'function') ? ic : () => '';
const SK_TK = (typeof tk === 'function') ? tk : (n) => '৳' + n;
const SK_BN = (typeof bn === 'function') ? bn : (n) => String(n);

function skOf(key) { return SKINS.find(s => s.key === key) || SKINS[0]; }
function skCurrent() { return (document.body.getAttribute('data-skin')) || 'default'; }

/* -------- প্রয়োগ -------- */
function skApply(key, root) {
  const s = skOf(key);
  const el = root || document.body;
  if (s.theme) el.setAttribute('data-theme', s.theme); else el.removeAttribute('data-theme');
  el.setAttribute('data-module', s.module);
  el.setAttribute('data-skin', s.key);
  document.querySelectorAll('[data-sk-switch] [data-sk]').forEach(b =>
    b.classList.toggle('on', b.getAttribute('data-sk') === s.key));
  const out = document.getElementById('skNow');
  if (out) out.innerHTML = s.theme
    ? `&lt;div data-theme="<b>${s.theme}</b>" data-module="${s.module}"&gt;`
    : `&lt;div&gt; <i style="opacity:.7">(data-theme নেই — বিদ্যমান ডিজাইন)</i>`;
  /* স্কিন-নির্ভর প্যানেলগুলো আবার রেন্ডার */
  ['skTokens', 'skTokensAll', 'skComp', 'skContrast'].forEach(id => {
    const host = document.getElementById(id);
    if (!host) return;
    if (id === 'skTokens') host.innerHTML = skTokenGrid(key);
    if (id === 'skTokensAll') host.innerHTML = skTokenTable();
    if (id === 'skComp') host.innerHTML = skComponents(key);
    if (id === 'skContrast') host.innerHTML = `<table class="sk-tbl"><thead><tr><th>জোড়া</th><th>লেখার রঙ</th><th>পটভূমি</th><th>অনুপাত</th><th>ফলাফল</th></tr></thead><tbody>${skContrast(key)}</tbody></table>`;
  });
  return s;
}
window.setSkin = skApply;   /* ভবিষ্যতে preview/workspace থেকেও ডাকা যাবে */

/* -------- টোকেন সোয়াচ -------- */
function skResolve(key, names) {
  const probe = document.createElement('div');
  const s = skOf(key);
  if (s.theme) probe.setAttribute('data-theme', s.theme);
  probe.style.position = 'absolute'; probe.style.left = '-9999px'; probe.style.top = '0';
  document.body.appendChild(probe);
  const cs = getComputedStyle(probe);
  const mirror = (s.theme && SK_VALUES[s.theme]) || {};
  const out = names.map(n => {
    const v = (cs.getPropertyValue(n) || '').trim();
    return [n, v || mirror[n] || ''];
  });
  probe.remove();
  return out;
}
function skTokenGrid(key) {
  const vals = skResolve(key, SK_TOKENS.map(t => t[0]));
  return `<div class="sk-tok">${vals.map(([n, v], i) => `
    <div class="sk-tok-c"><b style="background:${v || '#eee'}"></b>
      <span>${SK_TOKENS[i][1]}</span><code>${n}: ${v || '(সংজ্ঞাহীন)'}</code></div>`).join('')}</div>`;
}
function skTokenTable() {
  const rows = SK_TOKENS.map(([n, d]) => {
    const cells = SKINS.filter(s => s.theme).map(s => skResolve(s.key, [n])[0][1] || '—');
    return `<tr><td><b>${n}</b><div class="mut" style="font-size:11.4px">${d}</div></td>${
      cells.map(c => `<td><span class="sk-dot" style="background:${c}"></span><code>${c}</code></td>`).join('')}</tr>`;
  }).join('');
  return `<table class="sk-tbl"><thead><tr><th>টোকেন</th>${
    SKINS.filter(s => s.theme).map(s => `<th>${s.bn}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>`;
}

/* -------- প্যাটার্ন -------- */
function skPatterns() {
  /* ক্লাসভিত্তিক — প্যাটার্নের মান skins.css-এই থাকে, JS-এ কপি নেই */
  const P = [
    ['p-star-l', '৮-কোণা তারকা (খাতাম)', '--sk-p-star-l', 'qh', ''],
    ['p-star-d', '৮-কোণা তারকা — গাঢ় পৃষ্ঠতলে', '--sk-p-star-d', 'qh', 'dark'],
    ['p-girih-l', 'ছেদী বৃত্ত (গিরিহ)', '--sk-p-girih-l', 'qh', ''],
    ['p-girih-d', 'ছেদী বৃত্ত — গাঢ় পৃষ্ঠতলে', '--sk-p-girih-d', 'qh', 'dark'],
    ['p-band', 'আরবেস্ক ব্যান্ড', '--sk-p-band', 'qh', ''],
    ['p-div', 'জ্যামিতিক ডিভাইডার', '--sk-p-div', 'qh', ''],
    ['p-arch', 'মিহরাব আর্চ মাস্ক', '--sk-p-arch', 'qh', ''],
    ['p-ring-l', 'সদস্য-চক্র (ROSCA)', '--sk-p-ring-l', 'rosca', ''],
    ['p-ring-d', 'সদস্য-চক্র — গাঢ়', '--sk-p-ring-d', 'rosca', 'dark'],
    ['p-joint-l', 'যুগ্ম ত্রিভুজ (Joint Goal)', '--sk-p-joint-l', 'jg', ''],
    ['p-leaf-l', 'সঞ্চয় পাতা (General Savings)', '--sk-p-leaf-l', 'gs', ''],
    ['p-grid-l', 'টেনান্ট গ্রিড (Platform)', '--sk-p-grid-l', 'platform', '']
  ];
  return `<div class="sk-patgrid">${P.map(([cls, label, varName, skin, tone]) => `
    <div class="sk-patcard">
      <div class="sk-pat ${cls} ${tone}" data-var="${varName}"></div>
      <b>${label}</b><code>${varName}</code>
      <i>স্কিন: ${skOf(skin).bn} · ${tone === 'dark' ? 'গাঢ় পৃষ্ঠতলে' : 'হালকা পৃষ্ঠতলে'}</i>
    </div>`).join('')}</div>`;
}

/* -------- কম্পোনেন্ট নমুনা (বিদ্যমান ui.css ক্লাস, নতুন মার্কআপ নয়) -------- */
function skComponents(key) {
  const s = skOf(key);
  return `
  <div class="sk-lab">অ্যাপ হেডার ও স্ট্যাটাস বার</div>
  <div class="sk-surface">
    <div class="statusbar"><span>৯:৪১</span><span class="sig">●●● ᯤ ▮</span></div>
    <div class="apphead"><div class="apphead-row">
      <div class="avatar">ক</div>
      <div><div class="apphead-name">আব্দুল করিম</div><div class="apphead-sub">RSS-2627-0042 · রহিমা সঞ্চয় সমিতি</div></div>
      <button class="iconbtn">${SK_IC('bell')}<span class="badge">৩</span></button>
    </div></div>
    <div style="padding:14px 16px 18px">
      <div class="bal-hero">
        <div class="bal-lbl">${SK_IC('wallet','sm')} মোট সঞ্চয় (পোস্টেড)</div>
        <div class="bal-val">${SK_TK(12500)}</div>
        <div class="bal-alt">এখন তোলা যাবে ${SK_TK(12000)} · সর্বনিম্ন ${SK_TK(500)} (D-02)</div>
        <div class="bal-grid"><div class="bal-cell"><i>আটক</i><b>${SK_TK(0)}</b></div>
          <div class="bal-cell"><i>লক-ইন</i><b>${SK_TK(0)}</b></div></div>
      </div>
    </div>
  </div>

  <div class="sk-lab">বাটন ও চিপ</div>
  <div class="sk-surface">
    <div class="skg-row">
      <button class="btn btn-primary">${SK_IC('check','sm')} অনুমোদন করুন</button>
      <button class="btn btn-lime">${SK_IC('down','sm')} জমা নিশ্চিত</button>
      <button class="btn btn-soft">বিস্তারিত</button>
      <button class="btn btn-ghost">বাতিল</button>
      <button class="btn btn-danger-solid">প্রত্যাখ্যান</button>
    </div>
    <div class="skg-row" style="margin-top:11px">
      <span class="chip chip-lime">সক্রিয়</span><span class="chip chip-ok">অনুমোদিত</span>
      <span class="chip chip-warn">অপেক্ষমাণ</span><span class="chip chip-danger">বকেয়া</span>
      <span class="chip chip-info">যাচাই চলছে</span><span class="chip chip-neutral">খসড়া</span>
      <button class="chip-btn on">সব (${SK_BN(12)})</button><button class="chip-btn">চলমান</button>
    </div>
    <div class="skg-row" style="margin-top:11px">
      <span class="sk-mod-badge"><i></i>${s.bn}</span>
      ${s.islamic ? '<span class="qh-riba">সুদমুক্ত · <s>সুদ</s> <em>৳০</em></span>' : ''}
      ${s.status === 'planned' ? '<span class="qh-lock">🔒 পরিকল্পিত · ডিজাইন স্থগিত</span>' : '<span class="chip chip-ok">✓ ডিজাইন তৈরি</span>'}
    </div>
  </div>

  <div class="sk-lab">লেনদেন সারি, ফর্ম, ট্যাব, স্টেপার</div>
  <div class="sk-surface">
    <div class="rows">
      <div class="row"><div class="txi in">${SK_IC('down')}</div>
        <div class="row-tx"><b>মাসিক জমা — নগদ</b><span>আজ · ৯:১২ · রসিদ RCP-0042</span></div>
        <div class="row-amt"><b class="amt amt-pos">+${SK_TK(500)}</b><span class="amt amt-xs">ব্যালেন্স ${SK_TK(12500)}</span></div></div>
      <div class="row"><div class="txi out">${SK_IC('up')}</div>
        <div class="row-tx"><b>উত্তোলন — অনুমোদিত</b><span>গতকাল · ব্যাংক ট্রান্সফার</span></div>
        <div class="row-amt"><b class="amt amt-neg">−${SK_TK(2000)}</b><span class="amt amt-xs">ব্যালেন্স ${SK_TK(12000)}</span></div></div>
      <div class="row"><div class="txi hold">${SK_IC('clock')}</div>
        <div class="row-tx"><b>উত্তোলন আবেদন — অপেক্ষমাণ</b><span>MANAGER অনুমোদনের জন্য (D-22 সীমা ${SK_TK(50000)})</span></div>
        <div class="row-amt"><b class="amt">${SK_TK(3000)}</b><span class="amt amt-xs">আটক</span></div></div>
    </div>
    <div class="hr"></div>
    <div class="stepper"><i class="on"></i><i class="on"></i><i></i></div>
    <div class="stepper-l"><b>২. মাধ্যম</b><span>৩. নিশ্চিত · খসড়া সংরক্ষিত</span></div>
    <div class="tabs" style="margin-top:12px"><button class="on">সব</button><button>জমা</button><button>উত্তোলন</button></div>
    <div class="field" style="margin-top:12px"><label>জমার পরিমাণ <span class="req">*</span>
        <span class="hint">সীমা ${SK_TK(100)}–${SK_TK(50000)}</span></label>
      <input class="inp" value="৫০০" inputmode="numeric">
      <div class="hlp">নগদ জমায় ফি ${SK_TK(0)} (D-05)। প্রতিটি এন্ট্রি লেজারে ডাবল-এন্ট্রি হিসেবে বসে (R-01)।</div></div>
  </div>

  <div class="sk-lab">ডেস্কটপ সাইডবার ও স্টিকি সিদ্ধান্ত বার</div>
  <div class="sk-surface">
    <div class="sidebar" style="position:relative;height:auto;border-radius:16px">
      <div class="sb-brand"><div class="avatar">র</div><div><b>রহিমা সঞ্চয় সমিতি</b><i>খুলনা-প্রা-০৪১৭</i></div></div>
      <div class="sb-group">অনুমোদন</div>
      <div class="sb-item on">${SK_IC('check')} অনুমোদন কিউ <span class="cnt">৭</span></div>
      <div class="sb-item">${SK_IC('wallet')} উত্তোলন আবেদন <span class="cnt soft">২</span></div>
      <div class="sb-foot">মোঃ আব্দুল্লাহ · ম্যানেজার · সীমা ${SK_TK(50000)}</div>
    </div>
    <div class="stickyfoot" style="position:relative;margin-top:14px">
      <div class="sum"><i>এখন তোলা যাবে</i><b>${SK_TK(12000)}</b></div>
      <button class="btn btn-ghost">${SK_IC('down','sm')} জমা</button>
      <button class="btn btn-primary">${SK_IC('up','sm')} টাকা তুলুন</button>
    </div>
  </div>

  <div class="sk-lab">৭টি বাধ্যতামূলক অবস্থা (স্ট্যাটাস রঙ স্কিনে বদলায় না)</div>
  <div class="sk-surface">
    <div class="sk-states">
      <div class="state-sm"><div class="state-ico ok">${SK_IC('checkc')}</div><b>Normal</b><span>সব ঠিক আছে</span></div>
      <div class="state-sm"><div class="state-ico neutral">${SK_IC('doc')}</div><b>Empty</b><span>এখনো কোনো লেনদেন নেই</span></div>
      <div class="state-sm"><div class="sk sk-card" style="width:44px;height:44px;border-radius:14px"></div><b>Loading</b><span>লেজার হিসাব হচ্ছে…</span></div>
      <div class="state-sm"><div class="state-ico danger">${SK_IC('x')}</div><b>Error</b><span>সার্ভারে পাঠানো যায়নি</span></div>
      <div class="state-sm"><div class="state-ico info">${SK_IC('lock')}</div><b>Permission</b><span>এই কাজের অনুমতি নেই</span></div>
      <div class="state-sm"><div class="state-ico warn">${SK_IC('refresh')}</div><b>Offline</b><span>সংরক্ষিত খসড়া · sync বাকি</span></div>
      <div class="state-sm"><div class="state-ico lime">${SK_IC('lock')}</div><b>Blocked</b><span>নিয়মে আটকেছে (BR-11)</span></div>
    </div>
  </div>`;
}

/* -------- কনট্রাস্ট যাচাই (WCAG 2.1) -------- */
function skHex(v) {
  const m = /^#([0-9a-f]{3,8})$/i.exec((v || '').trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function skLum(rgb) {
  const a = rgb.map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); });
  return .2126 * a[0] + .7152 * a[1] + .0722 * a[2];
}
function skRatio(fg, bg) {
  const A = skHex(fg), B = skHex(bg);
  if (!A || !B) return null;
  const l1 = skLum(A), l2 = skLum(B);
  return (Math.max(l1, l2) + .05) / (Math.min(l1, l2) + .05);
}
const SK_PAIRS = [
  ['হেডারে লেখা', '#FFFFFF', '--mod-800', 4.5],
  ['হেডারে সাব-টেক্সট', '--mod-sub', '--mod-800', 4.5],
  ['প্রাইমারি বাটনে লেখা', '#FFFFFF', '--mod-700', 4.5],
  ['হাইলাইট বাটনে লেখা', '--mod-on-hi', '--mod-hi', 4.5],
  ['চিপে লেখা', '--mod-hi-ink', '--mod-hi-soft', 4.5],
  ['কার্ডে ব্র্যান্ড লিংক', '--mod-700', '#FFFFFF', 4.5]
];
function skContrast(key) {
  const names = [...new Set(SK_PAIRS.flatMap(p => [p[1], p[2]]).filter(n => n.startsWith('--')))];
  const vals = skResolve(key, names.concat(['--mod-800', '--mod-700', '--mod-hi', '--mod-hi-soft']));
  const map = {}; vals.forEach(([n, v]) => map[n] = v);
  const get = x => x.startsWith('--') ? (map[x] || '') : x;
  return SK_PAIRS.map(([label, fg, bg, need]) => {
    const F = get(fg), B = get(bg);
    const r = skRatio(F, B);
    const pass = r !== null && r >= need;
    return `<tr><td>${label}</td><td><span class="sk-dot" style="background:${F}"></span><code>${F}</code></td>
      <td><span class="sk-dot" style="background:${B}"></span><code>${B}</code></td>
      <td><b style="color:${pass ? '#8FE3B4' : '#FFB4A8'}">${r === null ? '—' : r.toFixed(2)}:1</b></td>
      <td>${pass ? '<span class="chip chip-ok">✓ AA</span>' : '<span class="chip chip-danger">✗ AA নয়</span>'}</td></tr>`;
  }).join('');
}
function skContrastQh() {
  const pairs = [
    ['বিসমিল্লাহ (সোনালি) / পান্না হেডার', '#E9CE8B', '#064437', 4.5],
    ['সোনালি চিপে লেখা', '#6B5210', '#FBF3DE', 4.5],
    ['গাঢ় সোনালি টেক্সট / সাদা', '#7E6410', '#FFFFFF', 4.5],
    ['সোনালি KPI টেক্সট / সোনালি টিন্ট', '#7E6410', '#FBF3DE', 4.5],
    ['পান্না টেক্সট / সাদা', '#0B6B52', '#FFFFFF', 4.5],
    ['দোয়া ব্লকে লেখা', '#04231C', '#F4FBF7', 4.5],
    ['মিহরাব আর্চে সাব-টেক্সট', '#6B5210', '#FBF3DE', 4.5]
  ];
  return pairs.map(([label, fg, bg, need]) => {
    const r = skRatio(fg, bg);
    const pass = r >= need;
    return `<tr><td>${label}</td><td><span class="sk-dot" style="background:${fg}"></span><code>${fg}</code></td>
      <td><span class="sk-dot" style="background:${bg}"></span><code>${bg}</code></td>
      <td><b style="color:${pass ? '#8FE3B4' : '#FFB4A8'}">${r.toFixed(2)}:1</b></td>
      <td>${pass ? '<span class="chip chip-ok">✓ AA</span>' : '<span class="chip chip-danger">✗ AA নয়</span>'}</td></tr>`;
  }).join('');
}

/* -------- বিদ্যমান স্ক্রিন একই সাথে কয়েকটি স্কিনে -------- */
function skCompare(id, keys, platform, role) {
  const isWeb = platform === 'web';
  return `<div class="sk-cmp">${keys.map(k => {
    const s = skOf(k);
    let inner = '';
    try {
      inner = isWeb ? wsWebStage(id, role || 'W_MANAGER') : wsMobileStage(id, role || null);
    } catch (e) { inner = `<div class="qh-note">রেন্ডার করা যায়নি: ${e.message}</div>`; }
    return `<div class="sk-cmpcard"${s.theme ? ` data-theme="${s.theme}" data-module="${s.module}"` : ''}>
      <div class="sk-cmp-h"><b>${s.bn}</b><code>${s.theme ? `data-theme="${s.theme}"` : 'data-theme নেই'}</code></div>
      <div class="sk-cmp-stage">${inner}</div>
      <div class="sk-cmp-f">${s.status === 'planned' ? '🔒 এই মডিউলের পেজ এখনো তৈরি নয় — স্কিনটি প্রস্তুত রাখা হয়েছে' : '✓ বিদ্যমান স্ক্রিন, শুধু স্কিন বদলেছে'}</div>
    </div>`;
  }).join('')}</div>`;
}

/* -------- প্রয়োগের কোড নমুনা -------- */
function skSnippets() {
  return [
    ['HTML — একটি মডিউল রুটে', `<div data-theme="qh" data-module="qard_hasanah">\n  <!-- QM-01…QM-08 স্ক্রিন — মার্কআপ একই, শুধু রঙ বদলাবে -->\n</div>`],
    ['JS — ব্যবহারকারী/টেনান্ট পছন্দে', `document.documentElement.dataset.theme = skin;   // 'gs' | 'rosca' | 'jg' | 'qh' | 'platform'\n// অথবা window.setSkin('qh')  (এই প্রোটোটাইপের হেলপার)`],
    ['React — থিম প্রোভাইডার', `<ModuleRoute module="qard_hasanah">\n  <div data-theme={skinOf(module)} data-module={module}>{children}</div>\n</ModuleRoute>`],
    ['CSS — নতুন স্কিন যোগ করতে', `[data-theme="নতুন"]{\n  --mod-950:#…; --mod-900:#…; --mod-800:#…; --mod-700:#…;\n  --mod-600:#…; --mod-500:#…; --mod-100:#…; --mod-050:#…;\n  --mod-hi:#…; --mod-hi-2:#…; --mod-hi-3:#…; --mod-on-hi:#…;\n  --mod-hi-soft:#…; --mod-hi-ink:#…; --mod-hi-bd:#…;\n  --mod-sub:#…; --mod-hero-3:#…; --mod-glow:…; --mod-glow-hi:…;\n  --mod-g13:…; --mod-g14:…; --mod-g28:…; --mod-hero-glow:…;\n  --mod-pattern:url("data:image/svg+xml,…");\n}`]
  ];
}

/* -------- QH ইসলামিক কিটের নমুনা কম্পোনেন্ট (পেজ নয়) -------- */
function skQhSamples() {
  return `
  <div class="sk-lab">নমুনা ১ · করজে হাসানা আবেদন কার্ড <span class="qh-lock">নমুনা কম্পোনেন্ট — পেজ নয়</span></div>
  <div data-theme="qh" data-module="qard_hasanah">
    <div class="qh-hero">
      <div class="qh-bismillah">
        <div class="ar">بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ</div>
        <div class="bn">পরম করুণাময় অসীম দয়ালু আল্লাহর নামে</div>
        <div class="rule"></div>
      </div>
      <div class="qh-hero-b">
        <div class="lbl">কর্জে হাসানা তহবিল — এই সদস্যের জন্য বরাদ্দসীমা</div>
        <div class="val">${SK_TK(15000)}</div>
        <div class="sub">মূল ফেরত ${SK_TK(15000)} · অতিরিক্ত কিছুই নয় · সুদ ৳০</div>
      </div>
      <div class="qh-hero-f">
        <span class="qh-riba">সুদমুক্ত · <s>সুদ</s> <em>৳০</em></span>
        <span class="qh-ref"><b>কুরআন ২:২৪৫</b> <span class="ar">قَرْضًا حَسَنًا</span></span>
        <span class="qh-ref hadith"><b>নীতি</b> শুধু মূল (প্রিন্সিপাল) ফেরত — BR-13</span>
      </div>
      <div style="padding:14px 16px 16px">
        <div class="qh-kpi">
          <div class="qh-kpi-c"><b>${SK_TK(15000)}</b><i>অনুমোদিত মূল</i></div>
          <div class="qh-kpi-c"><b>${SK_TK(5000)}</b><i>পরিশোধিত মূল</i></div>
          <div class="qh-kpi-c"><b>${SK_TK(10000)}</b><i>বাকি মূল (আদায়যোগ্য)</i></div>
          <div class="qh-kpi-c zero"><b>৳০</b><i>সুদ / অতিরিক্ত চার্জ</i></div>
        </div>
        <div class="sk-lab" style="margin-top:14px">কিস্তি অগ্রগতি (তাসবিহ-মোটিফ)</div>
        <div class="qh-tasbih">
          <i class="done"></i><i class="done"></i><i class="cur"></i><i></i><i></i><i></i>
          <span>৩য় কিস্তি চলমান · ৬ কিস্তিতে পরিশোধ · বিলম্বে শুধু মওকুফ/সময়-বৃদ্ধি, জরিমানা নয় (D-08 প্রযোজ্য নয়)</span>
        </div>
      </div>
    </div>
  </div>

  <div class="sk-lab">নমুনা ২ · ইলিজিবিলিটি গেট (৪ স্তর) <span class="qh-lock">নমুনা কম্পোনেন্ট — পেজ নয়</span></div>
  <div data-theme="qh" data-module="qard_hasanah" class="stack-12">
    <div class="qh-gate pass"><div class="no">১</div><div><b>Gate — সদস্যপদ</b>
      <p>সক্রিয় সদস্য ১৪ মাস · এক NID = এক সদস্য (D-16) ✓</p></div></div>
    <div class="qh-gate pass"><div class="no">২</div><div><b>Scope — পণ্যের আওতা</b>
      <p>চিকিৎসা সহায়তা পণ্যটি এই সদস্যের জন্য চালু ✓</p></div></div>
    <div class="qh-gate fail"><div class="no">৩</div><div><b>Financial — সীমা</b>
      <p>চাইছেন ${SK_TK(20000)} · নিয়ম-সীমা ${SK_TK(15000)} → কারণ কোড QH-B-04 (সীমা অতিক্রম)। আবেদন আটকাবে, সুদ নয়।</p></div></div>
    <div class="qh-gate"><div class="no">৪</div><div><b>Window / Quota — সময় ও কোটা</b>
      <p>এই মাসের পুল কোটা বাকি ${SK_TK(45000)} · আবেদনে soft hold, অনুমোদনে hard hold</p></div></div>
  </div>

  <div class="sk-lab">নমুনা ৩ · মিহরাব আর্চ হেডার ও দোয়া ব্লক</div>
  <div data-theme="qh" data-module="qard_hasanah" class="stack-12">
    <div class="qh-arch emerald"><b>কর্জে হাসানা — সুদমুক্ত সহায়তা</b>
      <i>সদস্যদের জন্য · শুধু মূল ফেরত · কমিটি নির্ধারিত যোগ্যতা</i></div>
    <div class="qh-arch"><b>۞ মাসিক পুল অবস্থা</b><i>এই মাসে বরাদ্দ ${SK_TK(60000)} · ব্যবহৃত ${SK_TK(15000)}</i></div>
    <div class="qh-dua">
      <div class="ar">مَّن ذَا الَّذِي يُقْرِضُ اللَّهَ قَرْضًا حَسَنًا</div>
      <div class="bn">"কে আছে যে আল্লাহকে করজে হাসানা (উত্তম ঋণ) দেবে?" — সূরা আল-বাকারা ২:২৪৫।
        এই আয়াত থেকেই "কর্জে হাসানা" নামটি এসেছে; তাই মডিউলটিতে কোনো সুদ বা অতিরিক্ত চার্জ নেই।</div>
    </div>
    <div class="qh-divider"></div>
    <div class="qh-ref-row">
      <span class="qh-ref"><b>কুরআন ২:২৭৫</b> <span class="ar">وَأَحَلَّ اللَّهُ الْبَيْعَ وَحَرَّمَ الرِّبَا</span> — ব্যবসা বৈধ, সুদ হারাম</span>
      <span class="qh-ref"><b>কুরআন ৫৭:১১</b> করজে হাসানা দ্বিগুণ প্রতিদানের প্রতিশ্রুতি</span>
      <span class="qh-ref hadith"><b>সহীহ মুসলিম</b> অভাবগ্রস্ত ঋণগ্রহীতাকে সময় দিলে বা মওকুফ করলে আল্লাহর ছায়ায় আশ্রয়</span>
    </div>
    <div class="qh-note">⚠️ <b>রেফারেন্স প্রদর্শনের নিয়ম:</b> আয়াত/হাদিস শুধু তথ্যমূলক চিপে দেখানো হবে, কোনো বিপণন বা
      চাপ সৃষ্টির ভাষায় নয়; প্রকাশের আগে শরীয়াহ বোর্ড/ইমাম কর্তৃক যাচাই বাধ্যতামূলক (খোলা সিদ্ধান্ত <b>D-74</b>)।
      হাদিসের নম্বর এখানে ইচ্ছাকৃতভাবে দেওয়া হয়নি — যাচাইয়ের পরে যোগ হবে।</div>
  </div>`;
}

/* -------- শব্দচয়ন চুক্তি -------- */
function skWords() {
  const rows = [
    ['সুদ / ইন্টারেস্ট / মুনাফা / ঋণের দাম', 'সুদ ৳০ · সুদমুক্ত', 'কোনো অতিরিক্ত অঙ্ক হিসাব বা প্রদর্শন করা যাবে না (BR-13)'],
    ['ঋণ / লোন অ্যামাউন্ট + চার্জ', 'কর্জে হাসানা · সহায়তা · মূল (প্রিন্সিপাল)', 'মডিউলটি ঋণপণ্য নয়, সুদমুক্ত সহায়তা তহবিল'],
    ['বিলম্ব ফি / পেনাল্টি (QH-এ)', 'সময় বৃদ্ধি (respite) · মওকুফ · ছাড়', 'D-08 জরিমানা QH-এ প্রযোজ্য নয় — চূড়ান্ত নিয়ম D-40/D-41'],
    ['লাভ/ক্ষতি ভাগ', 'না — QH অংশীদারিত্ব পণ্য নয়', 'মুদারাবা/মুশারাকা এই সংস্করণের আওতা বাইরে'],
    ['ছবি/প্রতিকৃতি অলংকরণ', 'জ্যামিতিক প্যাটার্ন ও ক্যালিগ্রাফি', 'কোনো প্রাণী/মানুষের ছবি ব্যবহার করা হবে না']
  ];
  return `<table class="qh-word"><thead><tr><th>নিষিদ্ধ ভাষা</th><th>অনুমোদিত ভাষা</th><th>কারণ / সূত্র</th></tr></thead>
    <tbody>${rows.map(r => `<tr><td class="no">✗ ${r[0]}</td><td class="yes">✓ ${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</tbody></table>`;
}

/* -------- বুট -------- */
function skBoot() {
  const sw = document.querySelector('[data-sk-switch]');
  if (sw) sw.innerHTML = SKINS.map(s => `
    <button data-sk="${s.key}" onclick="skApply('${s.key}')">
      <b>${s.bn}</b><i>${s.en}</i>${s.status === 'planned' ? '<u>পরিকল্পিত</u>' : '<u class="ok">তৈরি</u>'}</button>`).join('');

  const set = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };
  set('skMap', `<table class="sk-tbl"><thead><tr><th>স্কিন</th><th>module_key</th><th>কোন পেজে</th><th>অবস্থা</th></tr></thead><tbody>${
    SKINS.map(s => `<tr><td><b>${s.bn}</b><div class="mut" style="font-size:11.6px">${s.tag}</div></td>
      <td><code>${s.module}</code></td><td>${s.pages}</td>
      <td>${s.status === 'live' ? '<span class="chip chip-ok">✓ স্ক্রিন তৈরি</span>' : '<span class="qh-lock">🔒 পেজ পরিকল্পিত</span>'}</td></tr>`).join('')
  }</tbody></table>`);
  set('skTokens', skTokenGrid(skCurrent()));
  set('skTokensAll', skTokenTable());
  set('skPatterns', skPatterns());
  set('skComp', skComponents(skCurrent()));
  set('skQhSamples', skQhSamples());
  set('skWords', skWords());
  set('skContrastQh', `<table class="sk-tbl"><thead><tr><th>জোড়া</th><th>লেখার রঙ</th><th>পটভূমি</th><th>অনুপাত</th><th>ফলাফল</th></tr></thead><tbody>${skContrastQh()}</tbody></table>`);
  set('skSnips', skSnippets().map(([t, c]) => `<div class="sk-snip"><b>${t}</b><pre>${
    c.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre></div>`).join(''));

  /* বিদ্যমান স্ক্রিনের তুলনা — মোবাইল ও ডেস্কটপ */
  if (typeof wsMobileStage === 'function') {
    set('skCmpMob', skCompare('m01', ['default', 'rosca', 'jg', 'qh'], 'mob'));
    set('skCmpMob2', skCompare('am01', ['default', 'qh'], 'mob', 'MANAGER'));
    set('skCmpWeb', skCompare('a01', ['default', 'qh', 'platform'], 'web', 'W_MANAGER'));
  }
  skApply(skCurrent());
}

if (typeof window !== 'undefined') {
  window.skApply = skApply; window.skBoot = skBoot; window.SKINS = SKINS;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', skBoot);
}
