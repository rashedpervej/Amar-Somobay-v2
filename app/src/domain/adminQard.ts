/* ============================================================
   src/domain/adminQard.ts — কর্জে হাসানা · অ্যাডমিন (QAM-01…QAM-17)
   সুদ ৳০ · কোনো মুনাফা/সার্ভিস চার্জ/বিলম্ব ফি নেই (BR-20 · D-41)
   সব হিসাব derived; ডেমো নমুনা ডেটা (প্রোডাকশনে DB থেকে আসবে)।
   ⚠️ কোনো `profit_percentage` বা সুদের হার এখানে নেই — ইচ্ছাকৃত।
   ============================================================ */

export const QH_TODAY = '2026-10-31';
export const QH_SLA_DAYS = 5;
export const QH_MAX_ACTIVE_LOANS = 1;

export type Tone = 'ok' | 'warn' | 'danger' | 'info' | 'neutral';
export type PurposeKey = 'medical' | 'education' | 'disaster' | 'livelihood' | 'family' | 'shelter';
export type RepayKey = 'equal' | 'lump' | 'flexible';
export type ChannelKey = 'cash' | 'bank' | 'wallet' | 'gs';
export type LayerKey = 'gate' | 'scope' | 'financial' | 'window';
export type SevKey = 'block' | 'warn' | 'pass';

export const QH_PURPOSE: { k: PurposeKey; t: string }[] = [
  { k: 'medical', t: 'চিকিৎসা ও ওষুধ' },
  { k: 'education', t: 'শিক্ষা ও পরীক্ষার ফি' },
  { k: 'disaster', t: 'দুর্যোগ পুনরুদ্ধার' },
  { k: 'livelihood', t: 'ক্ষুদ্র ব্যবসা / কৃষি উপকরণ' },
  { k: 'family', t: 'পারিবারিক প্রয়োজন' },
  { k: 'shelter', t: 'গৃহ মেরামত' },
];

export const QH_REPAY: { k: RepayKey; t: string }[] = [
  { k: 'equal', t: 'সমান মাসিক কিস্তি' },
  { k: 'lump', t: 'মেয়াদ শেষে এককালীন' },
  { k: 'flexible', t: 'নমনীয় (যেকোনো সময় যেকোনো অঙ্ক)' },
];

export const QH_CHANNEL: { k: ChannelKey; t: string }[] = [
  { k: 'cash', t: 'নগদ (অফিস/মাঠ)' },
  { k: 'bank', t: 'ব্যাংক খাত' },
  { k: 'wallet', t: 'মোবাইল ওয়ালেট' },
  { k: 'gs', t: 'সদস্যের GS অ্যাকাউন্ট থেকে স্থানান্তর' },
];

export const QH_DOC: { k: string; t: string }[] = [
  { k: 'nid', t: 'NID যাচাই (প্রোফাইলে সংরক্ষিত)' },
  { k: 'purpose', t: 'উদ্দেশ্যের প্রমাণ (প্রেসক্রিপশন / ভর্তি স্লিপ / কোটেশন)' },
  { k: 'income', t: 'আয়ের তথ্য বা পরিবারের আয়-ব্যয় ধারণা' },
  { k: 'ref', t: 'সুপারিশপত্র (সমিতির সদস্য বা স্থানীয় জনপ্রতিনিধি)' },
  { k: 'photo', t: 'ছবি (ক্যামেরা/ফাইল — মান স্বয়ংক্রিয়ভাবে বসবে না)' },
];

export const QH_LAYER: { k: LayerKey; t: string; sub: string }[] = [
  { k: 'gate', t: 'স্তর ১ · গেট — সিস্টেমে চলবে কি না', sub: 'সবার আগে — এখানে আটকালে বাকি পরীক্ষাই চলে না' },
  { k: 'scope', t: 'স্তর ২ · পরিসর — লক্ষ্যদলে আছেন কি না', sub: 'কমিটির তালিকা ও বহিষ্কার' },
  { k: 'financial', t: 'স্তর ৩ · আর্থিক — সমিতির কাছে কী প্রমাণ আছে', sub: 'সঞ্চয়, বকেয়া ও সদস্যত্বকাল' },
  { k: 'window', t: 'স্তর ৪ · জানালা ও কোটা — এখন সুযোগ আছে কি না', sub: 'জানালা, কোটা ও পুল (D-51)' },
];

export const QH_STEP = [
  'আবেদন জমা', 'যোগ্যতা যাচাই (স্ন্যাপশট)', 'কমিটি/ব্যবস্থাপক পর্যালোচনা',
  'সিদ্ধান্ত (maker ≠ checker)', 'বিতরণ + রসিদ', 'মূলধন পরিশোধ', 'সমাপ্তি ও সনদ',
];

export const QH_BLOCK: Record<string, { m: string; a: string; fix: string }> = {
  'QH-B-01': { m: 'আপনার সদস্যপদ এখন সক্রিয় নয়। সমিতির সাথে যোগাযোগ করুন।', a: 'সদস্য নিষ্ক্রিয়/বহিষ্কৃত', fix: '' },
  'QH-B-02': { m: 'এই মুহূর্তে আবেদন গ্রহণ বন্ধ আছে। পরবর্তী জানালা: ১ নভেম্বর ২০২৬।', a: 'জানালা বন্ধ', fix: 'পরবর্তী জানালায় আবেদন করা যাবে।' },
  'QH-B-03': { m: 'এই সহায়তায় আপনার এলাকা/গ্রুপ এখনো অন্তর্ভুক্ত নয়।', a: 'পরিসর বহির্ভূত', fix: 'Admin যোগ্য তালিকায় যোগ করলে আবেদন করা যাবে।' },
  'QH-B-04': { m: 'আপনার সঞ্চয়ে ৳১,০২০ বকেয়া আছে। পরিশোধ করলে আবেদন করতে পারবেন।', a: 'বকেয়া বিদ্যমান (সমাধানযোগ্য)', fix: 'বকেয়া ৳১,০২০ পরিশোধ করুন — জমা হলেই যোগ্যতা আবার যাচাই হবে।' },
  'QH-B-05': { m: 'আপনি কমপক্ষে ৬ মাস সদস্য হলে আবেদন করতে পারবেন।', a: 'সদস্যত্বকাল অপর্যাপ্ত (D-54)', fix: '' },
  'QH-B-06': { m: 'আপনার একটি কর্জে হাসানা এখনো চলছে। পরিশোধ সম্পূর্ণ হলে আবার আবেদন করা যাবে।', a: 'সক্রিয় ঋণ (ডিফল্ট ১টি · D-51)', fix: 'চলমান সহায়তার বাকি কিস্তি সম্পূর্ণ পরিশোধ করুন।' },
  'QH-B-07': { m: 'আপনার পূর্ববর্তী সহায়তা পরিশোধে বিলম্ব হয়েছিল। বিস্তারিত জানতে সমিতির সাথে যোগাযোগ করুন।', a: 'পূর্ব ডিফল্ট/write-off (D-44)', fix: 'কমিটির সিদ্ধান্ত ছাড়া নতুন আবেদন গ্রহণযোগ্য নয়।' },
  'QH-B-08': { m: 'এই মাসের আবেদন কোটা পূর্ণ হয়েছে। পরবর্তী জানালা: ১ নভেম্বর ২০২৬।', a: 'কোটা পূর্ণ (D-51)', fix: 'পরের জানালায় অগ্রাধিকার দেওয়া হবে (ওয়েটলিস্ট)।' },
  'QH-B-09': { m: 'সহায়তা তহবিলে এখন পর্যাপ্ত অর্থ নেই। পরবর্তী বরাদ্দের অপেক্ষায় আছি।', a: 'ফান্ড পুল অপর্যাপ্ত (D-40)', fix: '' },
  'QH-B-10': { m: 'প্রয়োজনীয় নথি আপনার প্রোফাইলে নেই (NID যাচাই বাকি)।', a: 'নথি অসম্পূর্ণ (D-58)', fix: 'NID যাচাই ও উদ্দেশ্যের প্রমাণ জমা দিন।' },
};

export const QH_WARN: Record<string, string> = {
  'QH-W-01': 'জমার ধারা দুর্বল — ম্যানুয়াল পর্যালোচনা হবে',
  'QH-W-02': 'অঙ্ক সীমার ৮০%-এর বেশি — কমিটি বিশেষভাবে দেখবে',
  'QH-W-03': 'একই মাসে দ্বিতীয় আবেদন — পর্যালোচনা বাধ্যতামূলক',
  'QH-W-04': 'পুলের ২০%-এর বেশি একক আবেদন',
  'QH-W-05': 'Admin ম্যানুয়াল এক্সেপশন (কমিটি রেফারেন্সসহ)',
  'QH-W-06': 'নিয়ম পরিবর্তনের ৭ দিনের মধ্যে আবেদন',
};

/* ---------------- পণ্য ---------------- */

export type QhProduct = {
  id: string; code: string; name: string; purposes: PurposeKey[]; min: number; max: number;
  tenure: number; repay: RepayKey; grace: number; status: 'active' | 'window'; version: number;
  since: string; committee: string; note: string;
};

export const SEED_QH_PRODUCTS: QhProduct[] = [
  {
    id: 'qhp1', code: 'QHP-01', name: 'চিকিৎসা সহায়তা', purposes: ['medical', 'family'], min: 2000, max: 25000,
    tenure: 12, repay: 'equal', grace: 30, status: 'active', version: 3, since: '2026-01-05',
    committee: 'CM-2601-02', note: 'সুদ ৳০ · কোনো সেবা চার্জ নেই (D-41) · শুধু মূলধন ফেরত',
  },
  {
    id: 'qhp2', code: 'QHP-02', name: 'শিক্ষা সহায়তা', purposes: ['education'], min: 1000, max: 15000,
    tenure: 10, repay: 'equal', grace: 15, status: 'active', version: 2, since: '2026-06-01',
    committee: 'CM-2606-01', note: 'সুদ ৳০ · পরীক্ষা/ভর্তি মৌসুমে অগ্রাধিকার (D-52)',
  },
  {
    id: 'qhp3', code: 'QHP-03', name: 'দুর্যোগ ও জরুরি সহায়তা', purposes: ['disaster', 'shelter'], min: 1000, max: 10000,
    tenure: 6, repay: 'lump', grace: 45, status: 'window', version: 1, since: '2026-10-01',
    committee: 'CM-2610-01', note: 'সুদ ৳০ · শুধু জানালা খোলা থাকলে (D-51) · এককালীন পরিশোধ (D-53)',
  },
];

/* ---------------- যোগ্যতার নিয়ম ---------------- */

export type QhRule = {
  id: string; layer: LayerKey; key: string; label: string; op: string;
  value: string | number | boolean; unit?: 'paisa' | 'pct' | 'month' | 'count';
  sev: 'block' | 'warn'; reason: string; active: boolean; since: string;
};

export const SEED_QH_RULES: QhRule[] = [
  { id: 'r01', layer: 'gate', key: 'member_status_active', label: 'সদস্যের অবস্থা সক্রিয়', op: '=', value: 'active', sev: 'block', reason: 'QH-B-01', active: true, since: '2026-01-05' },
  { id: 'r02', layer: 'gate', key: 'window_open', label: 'আবেদন জানালা খোলা', op: '=', value: true, sev: 'block', reason: 'QH-B-02', active: true, since: '2026-01-05' },
  { id: 'r03', layer: 'gate', key: 'not_suspended_expelled', label: 'স্থগিত/বহিষ্কৃত নয়', op: '=', value: true, sev: 'block', reason: 'QH-B-01', active: true, since: '2026-01-05' },
  { id: 'r04', layer: 'scope', key: 'in_eligible_list', label: 'যোগ্য তালিকায় আছেন (স্বয়ংক্রিয় বা ম্যানুয়াল)', op: '=', value: true, sev: 'block', reason: 'QH-B-03', active: true, since: '2026-06-01' },
  { id: 'r05', layer: 'scope', key: 'exclusion_list', label: 'বাদ-তালিকায় নেই (সবার উপরে কাজ করে)', op: '=', value: false, sev: 'block', reason: 'QH-B-03', active: true, since: '2026-06-01' },
  { id: 'r06', layer: 'financial', key: 'min_membership_months', label: 'ন্যূনতম সদস্যত্বকাল', op: '>=', value: 6, unit: 'month', sev: 'block', reason: 'QH-B-05', active: true, since: '2026-01-05' },
  { id: 'r07', layer: 'financial', key: 'min_total_savings', label: 'ন্যূনতম মোট সঞ্চয় (GS)', op: '>=', value: 5000, unit: 'paisa', sev: 'block', reason: 'QH-B-04', active: true, since: '2026-01-05' },
  { id: 'r08', layer: 'financial', key: 'no_due_any_module', label: 'কোনো মডিউলে বকেয়া নেই (GS + ROSCA + JG)', op: '=', value: 0, unit: 'paisa', sev: 'block', reason: 'QH-B-04', active: true, since: '2026-06-01' },
  { id: 'r09', layer: 'financial', key: 'deposit_pattern', label: 'শেষ ৬ মাসের কমপক্ষে ৪ মাসে জমা', op: '>=', value: 4, unit: 'count', sev: 'warn', reason: 'QH-W-01', active: true, since: '2026-06-01' },
  { id: 'r10', layer: 'financial', key: 'prev_qh_cleared', label: 'পূর্ববর্তী কর্জে হাসানা সম্পূর্ণ পরিশোধিত', op: '=', value: true, sev: 'block', reason: 'QH-B-06', active: true, since: '2026-01-05' },
  { id: 'r11', layer: 'financial', key: 'max_pct_of_savings', label: 'সর্বোচ্চ অঙ্ক = মোট সঞ্চয়ের ৫০%', op: '<=', value: 50, unit: 'pct', sev: 'block', reason: 'QH-B-04', active: true, since: '2026-01-05' },
  { id: 'r12', layer: 'window', key: 'monthly_quota', label: 'মাসিক আবেদন কোটা (সমিতি)', op: '<=', value: 12, unit: 'count', sev: 'block', reason: 'QH-B-08', active: true, since: '2026-01-05' },
  { id: 'r13', layer: 'window', key: 'active_loans_per_member', label: 'এক সদস্যের সক্রিয় ঋণ সর্বোচ্চ ১টি', op: '<=', value: 1, unit: 'count', sev: 'block', reason: 'QH-B-06', active: true, since: '2026-01-05' },
  { id: 'r14', layer: 'window', key: 'pool_available', label: 'ফান্ড পুলে যথেষ্ট অঙ্ক (হল্ড বাদে)', op: '>=', value: 1, unit: 'paisa', sev: 'block', reason: 'QH-B-09', active: true, since: '2026-06-01' },
];

export type QhRuleVersion = {
  id: string; no: number; validFrom: string; by: string; committee: string; changes: string;
  sim: { eligible: number; newlyBlocked: number; newlyEligible: number; sample: number }; note: string;
};

export const SEED_QH_VERSIONS: QhRuleVersion[] = [
  { id: 'v3', no: 3, validFrom: '2026-10-01', by: 'কামরুল হাসান (সমিতি প্রশাসক)', committee: 'CM-2610-01', changes: 'নতুন নিয়ম: কোনো মডিউলে বকেয়া নেই (r08) · পুলের হিসাব হল্ড বাদে (r14)', sim: { eligible: 3, newlyBlocked: 2, newlyEligible: 0, sample: 9 }, note: 'Simulation আগে চালানো হয়েছে — ব্যক্তিগত তালিকা দেখানো হয়নি (D-57)' },
  { id: 'v2', no: 2, validFrom: '2026-06-01', by: 'কামরুল হাসান (সমিতি প্রশাসক)', committee: 'CM-2606-01', changes: 'যোগ্য তালিকা ও বাদ-তালিকা যোগ (r04/r05) · জমার ধারা সতর্কতা হিসেবে (r09)', sim: { eligible: 5, newlyBlocked: 1, newlyEligible: 2, sample: 9 }, note: 'পুরোনো আবেদন পুরোনো নিয়মেই বিচারিত (D-57)' },
  { id: 'v1', no: 1, validFrom: '2026-01-05', by: 'মোঃ আব্দুল্লাহ (ব্যবস্থাপক)', committee: 'CM-2601-02', changes: 'প্রাথমিক নিয়মসেট (৪ স্তর)', sim: { eligible: 6, newlyBlocked: 0, newlyEligible: 6, sample: 9 }, note: 'মডিউল চালুর প্রথম সংস্করণ · সংরক্ষিত Simulation স্ন্যাপশট (নমুনা ৯ সদস্য)' },
];

/* ---------------- জানালা, কোটা ও পুল ---------------- */

export type QhWindow = {
  open: boolean; start: string; end: string; nextStart: string; nextEnd: string;
  quota: number; used: number; perBranch: Record<string, number>; waitlist: number;
  pool: { allocated: number; held: number; source: string; note: string };
};

export const SEED_QH_WINDOW: QhWindow = {
  open: false, start: '2026-10-01', end: '2026-10-20', nextStart: '2026-11-01', nextEnd: '2026-11-15',
  quota: 12, used: 12, perBranch: { R1: 5, R2: 4, R3: 3 }, waitlist: 3,
  pool: {
    allocated: 80000, held: 15000,
    source: 'সমিতির নিজস্ব তহবিল ৳৫০,০০০ + ওয়াকফ অনুদান ৳৩০,০০০ (D-40)',
    note: 'সদস্যের সঞ্চয় থেকে নেওয়া হয় না — আলাদা ব্যাংক সাব-খাত (D-40)',
  },
};

/* ---------------- যোগ্য সদস্য তালিকা ---------------- */

export type QhEligible = {
  memberId: string; result: 'eligible' | 'conditional' | 'blocked';
  source: 'rule' | 'manual' | 'manual_exception'; ruleVersion: number; reasons: string[];
  maxAmount: number; evaluatedAt: string; validUntil: string; note: string;
};

export const SEED_QH_ELIGIBLE: QhEligible[] = [
  { memberId: 'm1', result: 'blocked', source: 'rule', ruleVersion: 3, reasons: ['QH-B-04', 'QH-B-06'], maxAmount: 8750, evaluatedAt: '2026-10-29', validUntil: '2026-11-05', note: 'সঞ্চয়ে বকেয়া ৳১,০২০ + একটি সক্রিয় কর্জে হাসানা (৩টি কিস্তি বাকি)' },
  { memberId: 'm2', result: 'blocked', source: 'rule', ruleVersion: 3, reasons: ['QH-B-06'], maxAmount: 7175, evaluatedAt: '2026-10-29', validUntil: '2026-11-05', note: 'একটি সক্রিয় কর্জে হাসানা চলছে (QH-2605-0003) — ডিফল্ট সীমা ১টি (D-51)' },
  { memberId: 'm3', result: 'blocked', source: 'rule', ruleVersion: 3, reasons: ['QH-B-10', 'QH-B-04'], maxAmount: 0, evaluatedAt: '2026-10-29', validUntil: '2026-11-05', note: 'KYC/NID যাচাই বাকি + সঞ্চয়ে বকেয়া ৳২,০৪০' },
  { memberId: 'm4', result: 'eligible', source: 'rule', ruleVersion: 3, reasons: [], maxAmount: 18000, evaluatedAt: '2026-10-29', validUntil: '2026-11-05', note: 'সব শর্ত পূরণ · সীমা মোট সঞ্চয়ের ৫০% = ৳১৮,০০০ · অনুমোদিত আবেদন QHA-2610-0010 বিতরণ বাকি' },
  { memberId: 'm5', result: 'blocked', source: 'rule', ruleVersion: 3, reasons: ['QH-B-01', 'QH-B-04', 'QH-B-06', 'QH-W-01'], maxAmount: 0, evaluatedAt: '2026-10-29', validUntil: '2026-11-05', note: 'সদস্যপদ নিষ্ক্রিয় (ডরম্যান্ট) + সঞ্চয়ে বকেয়া ৳৫১০ + চলমান ঋণে ২টি কিস্তি বকেয়া (৪০ দিন) — শ্রেণি: বিলম্বিত (D-44)' },
  { memberId: 'm6', result: 'blocked', source: 'rule', ruleVersion: 3, reasons: ['QH-B-06', 'QH-B-07'], maxAmount: 0, evaluatedAt: '2026-10-29', validUntil: '2026-11-05', note: 'পূর্ব সহায়তা ১১৪ দিন বিলম্বিত — write-off প্রস্তাব বিচারাধীন (BR-23)' },
  { memberId: 'm7', result: 'blocked', source: 'manual', ruleVersion: 3, reasons: ['QH-B-01', 'QH-B-04'], maxAmount: 0, evaluatedAt: '2026-10-29', validUntil: '2026-11-05', note: 'সদস্যপদ স্থগিত + সঞ্চয়ে বকেয়া ৳৩,০৬০ — আগের ম্যানুয়াল এক্সেপশন (CM-2609-02) স্বয়ংক্রিয়ভাবে বাতিল (D-59)' },
  { memberId: 'm8', result: 'conditional', source: 'manual_exception', ruleVersion: 3, reasons: ['QH-B-05', 'QH-W-05'], maxAmount: 2100, evaluatedAt: '2026-10-26', validUntil: '2026-11-30', note: 'সদস্যত্বকাল ৩ মাস (নিয়ম QH-B-05: কমপক্ষে ৬ মাস) — ORG_ADMIN এক্সেপশন, কমিটি CM-2610-03 (D-59)' },
  { memberId: 'm9', result: 'blocked', source: 'rule', ruleVersion: 3, reasons: ['QH-B-01', 'QH-B-07'], maxAmount: 0, evaluatedAt: '2026-10-29', validUntil: '2026-11-05', note: '২০২৬-০৯-১৮-এ write-off সম্পন্ন — নিরীক্ষক অ্যালার্ট আছে (D-44)' },
];

/* ---------------- আবেদন ---------------- */

export type QhSnapLayer = Record<LayerKey, SevKey>;
export type QhApp = {
  id: string; no: string; memberId: string; product: string; ruleVersion: number; amount: number;
  purpose: PurposeKey; purposeText: string; tenure: number;
  status: 'screening' | 'review' | 'returned' | 'approved' | 'rejected' | 'disbursed';
  submittedAt: string; channel: 'office' | 'app' | 'field'; docs: string[];
  snapshot: { result: 'eligible' | 'conditional' | 'blocked'; reasons: string[]; maxAmount: number; layer: QhSnapLayer };
  decision?: { verdict: 'approve' | 'return' | 'reject' | 'refer'; amount?: number; at: string; by: string; appr?: string; committee?: string; note?: string };
  reviewer?: string; waitlist?: boolean; sla: number; slaBreached?: boolean; loan?: string;
};

export const SEED_QH_APPS: QhApp[] = [
  {
    id: 'qa01', no: 'QHA-2602-0001', memberId: 'm1', product: 'qhp1', ruleVersion: 2, amount: 8000,
    purpose: 'medical', purposeText: 'স্ত্রীর অপারেশন — কেশবপুর স্বাস্থ্য কমপ্লেক্স', tenure: 8, status: 'disbursed',
    submittedAt: '2026-02-04', channel: 'office', docs: ['nid', 'purpose', 'income'],
    snapshot: { result: 'eligible', reasons: [], maxAmount: 8750, layer: { gate: 'pass', scope: 'pass', financial: 'pass', window: 'pass' } },
    decision: { verdict: 'approve', amount: 8000, at: '2026-02-09', by: 'মোঃ আব্দুল্লাহ (ব্যবস্থাপক)', appr: 'নাসরিন আক্তার (অনুমোদনকারী)', committee: 'CM-2602-01' },
    loan: 'qh01', sla: 5,
  },
  {
    id: 'qa02', no: 'QHA-2607-0005', memberId: 'm1', product: 'qhp1', ruleVersion: 2, amount: 15000,
    purpose: 'medical', purposeText: 'নিজের চিকিৎসা ও ওষুধ (৩ মাস)', tenure: 6, status: 'disbursed',
    submittedAt: '2026-07-28', channel: 'app', docs: ['nid', 'purpose', 'ref'],
    snapshot: { result: 'eligible', reasons: ['QH-W-02'], maxAmount: 8750, layer: { gate: 'pass', scope: 'pass', financial: 'warn', window: 'pass' } },
    decision: { verdict: 'approve', amount: 8750, at: '2026-08-03', by: 'সুমি রানী দাস (হিসাবরক্ষক)', appr: 'নাসরিন আক্তার (অনুমোদনকারী)', committee: 'CM-2608-02', note: 'আবেদিত ৳১৫,০০০ → অনুমোদিত ৳৮,৭৫০ (সীমার ভেতরে)' },
    loan: 'qh04', sla: 4,
  },
  {
    id: 'qa03', no: 'QHA-2610-0009', memberId: 'm1', product: 'qhp2', ruleVersion: 3, amount: 5000,
    purpose: 'education', purposeText: 'মেয়ের ভর্তি ফি ও বই', tenure: 6, status: 'returned',
    submittedAt: '2026-10-14', channel: 'app', docs: ['nid'],
    snapshot: { result: 'blocked', reasons: ['QH-B-04', 'QH-B-06'], maxAmount: 8750, layer: { gate: 'pass', scope: 'pass', financial: 'block', window: 'pass' } },
    decision: { verdict: 'return', at: '2026-10-16', by: 'মোঃ আব্দুল্লাহ (ব্যবস্থাপক)', note: 'সঞ্চয়ের বকেয়া ৳১,০২০ পরিশোধ ও চলমান সহায়তার কিস্তি নিয়মিত হলে আবার জমা দেওয়া যাবে (D-54)' },
    sla: 2,
  },
  {
    id: 'qa04', no: 'QHA-2610-0010', memberId: 'm4', product: 'qhp1', ruleVersion: 3, amount: 20000,
    purpose: 'medical', purposeText: 'ভাইয়ের কিডনি চিকিৎসা — খুলনা মেডিকেল', tenure: 12, status: 'approved',
    submittedAt: '2026-10-06', channel: 'office', docs: ['nid', 'purpose', 'income', 'ref'],
    snapshot: { result: 'eligible', reasons: [], maxAmount: 18000, layer: { gate: 'pass', scope: 'pass', financial: 'pass', window: 'pass' } },
    decision: { verdict: 'approve', amount: 18000, at: '2026-10-11', by: 'সুমি রানী দাস (হিসাবরক্ষক)', appr: 'নাসরিন আক্তার (অনুমোদনকারী)', committee: 'CM-2610-04', note: 'maker ≠ checker ✓ · কমিটির লিখিত সিদ্ধান্ত ✓ · আবেদিত ৳২০,০০০ → অনুমোদিত ৳১৮,০০০ (সীমা)' },
    loan: 'qh05', sla: 5,
  },
  {
    id: 'qa05', no: 'QHA-2610-0011', memberId: 'm2', product: 'qhp2', ruleVersion: 3, amount: 9000,
    purpose: 'education', purposeText: 'ছেলের পরীক্ষার ফি ও কোচিং', tenure: 10, status: 'review',
    submittedAt: '2026-10-08', channel: 'app', docs: ['nid', 'purpose'],
    snapshot: { result: 'eligible', reasons: ['QH-W-02'], maxAmount: 7175, layer: { gate: 'pass', scope: 'pass', financial: 'warn', window: 'pass' } },
    reviewer: 'মোঃ আব্দুল্লাহ (ব্যবস্থাপক)', sla: 5, slaBreached: true,
  },
  {
    id: 'qa06', no: 'QHA-2610-0012', memberId: 'm3', product: 'qhp3', ruleVersion: 3, amount: 4000,
    purpose: 'disaster', purposeText: 'বন্যায় ক্ষতিগ্রস্ত মাছের পুকুর মেরামত', tenure: 6, status: 'rejected',
    submittedAt: '2026-10-09', channel: 'app', docs: ['purpose'],
    snapshot: { result: 'blocked', reasons: ['QH-B-10', 'QH-B-04'], maxAmount: 0, layer: { gate: 'pass', scope: 'pass', financial: 'block', window: 'pass' } },
    decision: { verdict: 'reject', at: '2026-10-12', by: 'মোঃ আব্দুল্লাহ (ব্যবস্থাপক)', appr: 'নাসরিন আক্তার (অনুমোদনকারী)', committee: 'CM-2610-05', note: 'NID যাচাই বাকি + সঞ্চয়ে বকেয়া ৳২,০৪০ · কারণ সদস্যকে সম্মান রক্ষা করে জানানো হয়েছে' },
    sla: 3,
  },
  {
    id: 'qa07', no: 'QHA-2610-0013', memberId: 'm5', product: 'qhp1', ruleVersion: 3, amount: 10000,
    purpose: 'medical', purposeText: 'মায়ের চোখের অপারেশন', tenure: 12, status: 'returned',
    submittedAt: '2026-10-16', channel: 'field', docs: ['nid', 'purpose', 'photo'],
    snapshot: { result: 'conditional', reasons: ['QH-B-06', 'QH-W-01'], maxAmount: 0, layer: { gate: 'pass', scope: 'pass', financial: 'block', window: 'pass' } },
    decision: { verdict: 'return', at: '2026-10-18', by: 'মোঃ আব্দুল্লাহ (ব্যবস্থাপক)', note: 'চলমান ঋণে ২টি কিস্তি বকেয়া — বকেয়া পরিশোধ ও পুনর্গঠন প্রস্তাবের পর নতুন আবেদন (D-44)' },
    sla: 2,
  },
  {
    id: 'qa08', no: 'QHA-2610-0014', memberId: 'm9', product: 'qhp1', ruleVersion: 3, amount: 3000,
    purpose: 'family', purposeText: 'পারিবারিক জরুরি প্রয়োজন', tenure: 6, status: 'rejected',
    submittedAt: '2026-10-18', channel: 'office', docs: ['nid'],
    snapshot: { result: 'blocked', reasons: ['QH-B-07'], maxAmount: 0, layer: { gate: 'pass', scope: 'pass', financial: 'block', window: 'pass' } },
    decision: { verdict: 'reject', at: '2026-10-19', by: 'মোঃ আব্দুল্লাহ (ব্যবস্থাপক)', appr: 'কামরুল হাসান (সমিতি প্রশাসক)', committee: 'CM-2610-07', note: 'পূর্ব সহায়তা ২০২৬-০৯-১৮-এ ছেড়ে দেওয়া (write-off) — কমিটির সিদ্ধান্ত ছাড়া নতুন সহায়তা নয় (BR-23)' },
    sla: 1,
  },
  {
    id: 'qa09', no: 'QHA-2610-0015', memberId: 'm8', product: 'qhp3', ruleVersion: 3, amount: 3000,
    purpose: 'shelter', purposeText: 'ঘরের ছাউনি মেরামত', tenure: 6, status: 'review',
    submittedAt: '2026-10-26', channel: 'app', docs: ['nid', 'purpose', 'ref', 'photo'],
    snapshot: { result: 'conditional', reasons: ['QH-W-05'], maxAmount: 2100, layer: { gate: 'pass', scope: 'pass', financial: 'warn', window: 'pass' } },
    reviewer: 'কামরুল হাসান (সমিতি প্রশাসক)', sla: 5,
  },
  {
    id: 'qa10', no: 'QHA-2610-0016', memberId: 'm7', product: 'qhp3', ruleVersion: 3, amount: 5000,
    purpose: 'disaster', purposeText: 'বন্যার পর ঘর মেরামত ও খাদ্য', tenure: 6, status: 'rejected',
    submittedAt: '2026-10-19', channel: 'field', docs: ['nid', 'purpose'],
    snapshot: { result: 'blocked', reasons: ['QH-B-08'], maxAmount: 6400, layer: { gate: 'pass', scope: 'pass', financial: 'pass', window: 'block' } },
    decision: { verdict: 'reject', at: '2026-10-19', by: 'সুমি রানী দাস (হিসাবরক্ষক)', appr: 'নাসরিন আক্তার (অনুমোদনকারী)', committee: 'CM-2610-07', note: 'অক্টোবরের কোটা ১২/১২ পূর্ণ — ওয়েটলিস্টে রাখা হয়েছে, ১ নভেম্বরের জানালায় অগ্রাধিকার (D-51)' },
    waitlist: true, sla: 0,
  },
  {
    id: 'qa11', no: 'QHA-2606-0004', memberId: 'm5', product: 'qhp1', ruleVersion: 2, amount: 15000,
    purpose: 'medical', purposeText: 'স্ত্রীর চিকিৎসা', tenure: 12, status: 'disbursed',
    submittedAt: '2026-06-08', channel: 'office', docs: ['nid', 'purpose', 'income'],
    snapshot: { result: 'eligible', reasons: [], maxAmount: 16000, layer: { gate: 'pass', scope: 'pass', financial: 'pass', window: 'pass' } },
    decision: { verdict: 'approve', amount: 15000, at: '2026-06-14', by: 'সুমি রানী দাস (হিসাবরক্ষক)', appr: 'নাসরিন আক্তার (অনুমোদনকারী)', committee: 'CM-2606-03' },
    loan: 'qh03', sla: 4,
  },
  {
    id: 'qa12', no: 'QHA-2605-0003', memberId: 'm2', product: 'qhp2', ruleVersion: 2, amount: 12000,
    purpose: 'education', purposeText: 'মেয়ের কলেজ ভর্তি', tenure: 12, status: 'disbursed',
    submittedAt: '2026-05-06', channel: 'app', docs: ['nid', 'purpose'],
    snapshot: { result: 'eligible', reasons: [], maxAmount: 7175, layer: { gate: 'pass', scope: 'pass', financial: 'pass', window: 'pass' } },
    decision: { verdict: 'approve', amount: 12000, at: '2026-05-11', by: 'মোঃ আব্দুল্লাহ (ব্যবস্থাপক)', appr: 'নাসরিন আক্তার (অনুমোদনকারী)', committee: 'CM-2605-02', note: 'সীমা ছাড়ানোয় কমিটির বিশেষ সিদ্ধান্ত (D-45) — রেফারেন্স সংরক্ষিত' },
    loan: 'qh02', sla: 3,
  },
  {
    id: 'qa13', no: 'QHA-2604-0002', memberId: 'm6', product: 'qhp2', ruleVersion: 2, amount: 6000,
    purpose: 'education', purposeText: 'ছেলের স্কুল ফি', tenure: 6, status: 'disbursed',
    submittedAt: '2026-04-02', channel: 'office', docs: ['nid', 'purpose'],
    snapshot: { result: 'eligible', reasons: [], maxAmount: 7000, layer: { gate: 'pass', scope: 'pass', financial: 'pass', window: 'pass' } },
    decision: { verdict: 'approve', amount: 6000, at: '2026-04-06', by: 'সুমি রানী দাস (হিসাবরক্ষক)', appr: 'নাসরিন আক্তার (অনুমোদনকারী)', committee: 'CM-2604-02' },
    loan: 'qh06', sla: 2,
  },
  {
    id: 'qa14', no: 'QHA-2511-0001', memberId: 'm7', product: 'qhp1', ruleVersion: 1, amount: 5000,
    purpose: 'medical', purposeText: 'ডায়াবেটিস চিকিৎসা', tenure: 5, status: 'disbursed',
    submittedAt: '2025-12-04', channel: 'office', docs: ['nid', 'purpose'],
    snapshot: { result: 'eligible', reasons: [], maxAmount: 6400, layer: { gate: 'pass', scope: 'pass', financial: 'pass', window: 'pass' } },
    decision: { verdict: 'approve', amount: 5000, at: '2025-12-10', by: 'মোঃ আব্দুল্লাহ (ব্যবস্থাপক)', appr: 'নাসরিন আক্তার (অনুমোদনকারী)', committee: 'CM-2512-01' },
    loan: 'qh07', sla: 4,
  },
];

/* ---------------- ঋণ ---------------- */

export type QhLoan = {
  id: string; no: string; app: string | null; memberId: string; product: string; principal: number;
  tenure: number; repay: RepayKey; disbursedAt: string | null; firstDue: string | null;
  status: 'pending' | 'active' | 'arrears' | 'closed' | 'writeoff';
  channel: ChannelKey; committee: string; by: string; appr: string; otp: boolean;
  evidence: string[]; hash: string; cert?: string; closedAt?: string; note: string;
};

export const SEED_QH_LOANS: QhLoan[] = [
  { id: 'qh01', no: 'QH-2602-0001', app: 'qa01', memberId: 'm1', product: 'qhp1', principal: 8000, tenure: 8, repay: 'equal', disbursedAt: '2026-02-10', firstDue: '2026-03-10', status: 'closed', closedAt: '2026-10-10', channel: 'bank', committee: 'CM-2602-01', by: 'সুমি রানী দাস', appr: 'নাসরিন আক্তার', otp: true, evidence: ['ভাউচার QHV-2602-0011', 'ব্যাংক ট্রান্সফার রসিদ'], cert: 'QHC-2610-0001', hash: 'a7f3c219', note: 'সুদ ৳০ · ৮টি কিস্তিতে মূলধন সম্পূর্ণ পরিশোধিত' },
  { id: 'qh02', no: 'QH-2605-0003', app: 'qa12', memberId: 'm2', product: 'qhp2', principal: 12000, tenure: 12, repay: 'equal', disbursedAt: '2026-05-14', firstDue: '2026-06-14', status: 'active', channel: 'wallet', committee: 'CM-2605-02', by: 'সুমি রানী দাস', appr: 'নাসরিন আক্তার', otp: true, evidence: ['ভাউচার QHV-2605-0031', 'ওয়ালেট ট্রান্সেকশন ID'], hash: 'b12e88d4', note: 'সুদ ৳০ · ৫/১২ কিস্তি পরিশোধিত' },
  { id: 'qh03', no: 'QH-2606-0004', app: 'qa11', memberId: 'm5', product: 'qhp1', principal: 15000, tenure: 12, repay: 'equal', disbursedAt: '2026-06-20', firstDue: '2026-07-20', status: 'arrears', channel: 'cash', committee: 'CM-2606-03', by: 'রাজু আহমেদ (সংগ্রহক)', appr: 'নাসরিন আক্তার', otp: true, evidence: ['ভাউচার QHV-2606-0041', 'নগদ প্রদান স্বাক্ষর'], hash: 'c9a41f07', note: '২টি কিস্তি বকেয়া (সেপ্টেম্বর ও অক্টোবর) · শ্রেণি: বিলম্বিত ৩১–৯০ দিন (D-44)' },
  { id: 'qh04', no: 'QH-2608-0005', app: 'qa02', memberId: 'm1', product: 'qhp1', principal: 8750, tenure: 6, repay: 'equal', disbursedAt: '2026-08-12', firstDue: '2026-09-12', status: 'active', channel: 'cash', committee: 'CM-2608-02', by: 'রাজু আহমেদ (সংগ্রহক)', appr: 'নাসরিন আক্তার', otp: true, evidence: ['ভাউচার QHV-2608-0051', 'সদস্যের স্বাক্ষরিত রসিদ'], hash: 'd4c07b31', note: 'সুদ ৳০ · আবেদিত ৳১৫,০০০ → অনুমোদিত ৳৮,৭৫০ (মোট সঞ্চয়ের ৫০%)' },
  { id: 'qh05', no: 'QH-2610-0006', app: 'qa04', memberId: 'm4', product: 'qhp1', principal: 18000, tenure: 12, repay: 'equal', disbursedAt: null, firstDue: null, status: 'pending', channel: 'bank', committee: 'CM-2610-04', by: 'সুমি রানী দাস', appr: 'নাসরিন আক্তার', otp: false, evidence: [], hash: '', note: 'অনুমোদিত — বিতরণ বাকি: maker ≠ checker ✓, OTP যাচাই বাকি (BR-22)' },
  { id: 'qh06', no: 'QH-2604-0002', app: 'qa13', memberId: 'm6', product: 'qhp2', principal: 6000, tenure: 6, repay: 'equal', disbursedAt: '2026-04-08', firstDue: '2026-05-08', status: 'arrears', channel: 'cash', committee: 'CM-2604-02', by: 'রাজু আহমেদ (সংগ্রহক)', appr: 'নাসরিন আক্তার', otp: true, evidence: ['ভাউচার QHV-2604-0021'], hash: 'e5b19a62', note: '১১৪ দিন বিলম্ব · শ্রেণি: সন্দেহজনক ৯১–১৮০ দিন · write-off প্রস্তাব বিচারাধীন (BR-23)' },
  { id: 'qh07', no: 'QH-2512-0007', app: 'qa14', memberId: 'm7', product: 'qhp1', principal: 5000, tenure: 5, repay: 'equal', disbursedAt: '2025-12-15', firstDue: '2026-01-15', status: 'closed', closedAt: '2026-05-15', channel: 'cash', committee: 'CM-2512-01', by: 'রাজু আহমেদ (সংগ্রহক)', appr: 'নাসরিন আক্তার', otp: true, evidence: ['ভাউচার QHV-2512-0071'], cert: 'QHC-2605-0002', hash: 'f03d7c88', note: 'সুদ ৳০ · সম্পূর্ণ পরিশোধিত · সমাপ্তি সনদ ইস্যু' },
  { id: 'qh08', no: 'QH-2511-0008', app: null, memberId: 'm9', product: 'qhp1', principal: 4000, tenure: 8, repay: 'equal', disbursedAt: '2025-11-20', firstDue: '2025-12-20', status: 'writeoff', closedAt: '2026-09-18', channel: 'cash', committee: 'CM-2609-07', by: 'রাজু আহমেদ (সংগ্রহক)', appr: 'কামরুল হাসান', otp: true, evidence: ['ভাউচার QHV-2511-0081'], hash: '1a9c4e55', note: '২/৮ কিস্তি আদায় · বাকি ৳৩,০০০ ছেড়ে দেওয়া (ক্ষতি) — দায় মেটেনি, খাতায় আলাদাভাবে দৃশ্যমান (BR-23)' },
];

/* ---------------- পরিশোধ ---------------- */

export type QhRepayment = { loan: string; inst: number; amount: number; at: string; receipt: string; channel: ChannelKey; by: string; note?: string };

export const SEED_QH_REPAYMENTS: QhRepayment[] = [
  { loan: 'qh01', inst: 1, amount: 1000, at: '2026-03-10', receipt: 'QR-2603-0001', channel: 'bank', by: 'সুমি রানী দাস' },
  { loan: 'qh01', inst: 2, amount: 1000, at: '2026-04-10', receipt: 'QR-2604-0002', channel: 'bank', by: 'সুমি রানী দাস' },
  { loan: 'qh01', inst: 3, amount: 1000, at: '2026-05-11', receipt: 'QR-2605-0003', channel: 'cash', by: 'রাজু আহমেদ' },
  { loan: 'qh01', inst: 4, amount: 1000, at: '2026-06-10', receipt: 'QR-2606-0004', channel: 'cash', by: 'রাজু আহমেদ' },
  { loan: 'qh01', inst: 5, amount: 1000, at: '2026-07-10', receipt: 'QR-2607-0005', channel: 'cash', by: 'রাজু আহমেদ' },
  { loan: 'qh01', inst: 6, amount: 1000, at: '2026-08-10', receipt: 'QR-2608-0006', channel: 'bank', by: 'সুমি রানী দাস' },
  { loan: 'qh01', inst: 7, amount: 1000, at: '2026-09-10', receipt: 'QR-2609-0007', channel: 'bank', by: 'সুমি রানী দাস' },
  { loan: 'qh01', inst: 8, amount: 1000, at: '2026-10-10', receipt: 'QR-2610-0008', channel: 'bank', by: 'সুমি রানী দাস', note: 'চূড়ান্ত কিস্তি — সমাপ্তি সনদ QHC-2610-0001' },
  { loan: 'qh02', inst: 1, amount: 1000, at: '2026-06-14', receipt: 'QR-2606-0009', channel: 'wallet', by: 'সুমি রানী দাস' },
  { loan: 'qh02', inst: 2, amount: 1000, at: '2026-07-14', receipt: 'QR-2607-0010', channel: 'wallet', by: 'সুমি রানী দাস' },
  { loan: 'qh02', inst: 3, amount: 1000, at: '2026-08-16', receipt: 'QR-2608-0011', channel: 'cash', by: 'রাজু আহমেদ', note: '২ দিন বিলম্ব — গ্রেস ১৫ দিনের ভেতরে, কোনো চার্জ নেই (D-41)' },
  { loan: 'qh02', inst: 4, amount: 1000, at: '2026-09-14', receipt: 'QR-2609-0012', channel: 'wallet', by: 'সুমি রানী দাস' },
  { loan: 'qh02', inst: 5, amount: 1000, at: '2026-10-14', receipt: 'QR-2610-0013', channel: 'wallet', by: 'সুমি রানী দাস' },
  { loan: 'qh03', inst: 1, amount: 1250, at: '2026-07-20', receipt: 'QR-2607-0014', channel: 'cash', by: 'রাজু আহমেদ' },
  { loan: 'qh03', inst: 2, amount: 1250, at: '2026-08-20', receipt: 'QR-2608-0015', channel: 'cash', by: 'রাজু আহমেদ' },
  { loan: 'qh04', inst: 1, amount: 1458, at: '2026-09-12', receipt: 'QR-2609-0016', channel: 'cash', by: 'রাজু আহমেদ' },
  { loan: 'qh04', inst: 2, amount: 1458, at: '2026-10-12', receipt: 'QR-2610-0017', channel: 'cash', by: 'রাজু আহমেদ' },
  { loan: 'qh06', inst: 1, amount: 1000, at: '2026-05-08', receipt: 'QR-2605-0018', channel: 'cash', by: 'রাজু আহমেদ' },
  { loan: 'qh06', inst: 2, amount: 1000, at: '2026-06-09', receipt: 'QR-2606-0019', channel: 'cash', by: 'রাজু আহমেদ' },
  { loan: 'qh07', inst: 1, amount: 1000, at: '2026-01-15', receipt: 'QR-2601-0020', channel: 'cash', by: 'রাজু আহমেদ' },
  { loan: 'qh07', inst: 2, amount: 1000, at: '2026-02-15', receipt: 'QR-2602-0021', channel: 'cash', by: 'রাজু আহমেদ' },
  { loan: 'qh07', inst: 3, amount: 1000, at: '2026-03-15', receipt: 'QR-2603-0022', channel: 'cash', by: 'রাজু আহমেদ' },
  { loan: 'qh07', inst: 4, amount: 1000, at: '2026-04-15', receipt: 'QR-2604-0023', channel: 'bank', by: 'সুমি রানী দাস' },
  { loan: 'qh07', inst: 5, amount: 1000, at: '2026-05-15', receipt: 'QR-2605-0024', channel: 'bank', by: 'সুমি রানী দাস', note: 'চূড়ান্ত কিস্তি — সমাপ্তি সনদ QHC-2605-0002' },
  { loan: 'qh08', inst: 1, amount: 500, at: '2025-12-22', receipt: 'QR-2512-0025', channel: 'cash', by: 'রাজু আহমেদ' },
  { loan: 'qh08', inst: 2, amount: 500, at: '2026-01-20', receipt: 'QR-2601-0026', channel: 'cash', by: 'রাজু আহমেদ' },
];

/* ---------------- Write-off ---------------- */

export type QhWriteOff = {
  id: string; no: string; loan: string; amount: number; reason: string; committee: string;
  decidedAt: string | null; by: string; approvedBy: string | null; status: 'proposed' | 'done'; note: string;
};

export const SEED_QH_WRITEOFFS: QhWriteOff[] = [
  { id: 'wo1', no: 'QW-2609-0001', loan: 'qh08', amount: 3000, reason: 'সদস্য দীর্ঘদিন গ্রামের বাইরে, কোনো সম্পদ বা আয়ের উৎস পাওয়া যায়নি', committee: 'CM-2609-07', decidedAt: '2026-09-14', by: 'মোঃ আব্দুল্লাহ (ব্যবস্থাপক)', approvedBy: 'কামরুল হাসান (সমিতি প্রশাসক)', status: 'done', note: 'ক্ষতি — কর্জে হাসানা খাতে ডেবিট; দায় মেটেনি, নিরীক্ষা রিপোর্টে আলাদাভাবে দৃশ্যমান (BR-23)' },
  { id: 'wo2', no: 'QW-2610-0002', loan: 'qh06', amount: 4000, reason: '১১৪ দিন বিলম্ব — প্রস্তাব: আগে পুনর্গঠন, তারপর write-off', committee: 'CM-2610-06', decidedAt: null, by: 'মোঃ আব্দুল্লাহ (ব্যবস্থাপক)', approvedBy: null, status: 'proposed', note: 'প্রস্তাব বিচারাধীন — ORG_ADMIN অনুমোদন + নিরীক্ষক অ্যালার্ট বাধ্যতামূলক (BR-23) · বিকল্প: কিস্তি পুনর্গঠন (D-44)' },
];

/* ---------------- অভিধান ---------------- */

export const QH_APP_ST: Record<QhApp['status'], { t: string; tone: Tone }> = {
  screening: { t: 'যোগ্যতা যাচাই', tone: 'info' },
  review: { t: 'পর্যালোচনায়', tone: 'warn' },
  returned: { t: 'তথ্য চেয়ে ফেরত', tone: 'warn' },
  approved: { t: 'অনুমোদিত', tone: 'ok' },
  rejected: { t: 'প্রত্যাখ্যাত', tone: 'danger' },
  disbursed: { t: 'বিতরণ সম্পন্ন', tone: 'ok' },
};

export const QH_LOAN_ST: Record<QhLoan['status'], { t: string; tone: Tone }> = {
  pending: { t: 'বিতরণ বাকি', tone: 'warn' },
  active: { t: 'চলমান', tone: 'info' },
  arrears: { t: 'বকেয়া (D-44)', tone: 'danger' },
  closed: { t: 'সম্পূর্ণ পরিশোধিত', tone: 'ok' },
  writeoff: { t: 'ছেড়ে দেওয়া (ক্ষতি)', tone: 'neutral' },
};

export const QH_CLASS: Record<string, { t: string; tone: Tone }> = {
  regular: { t: 'নিয়মিত', tone: 'ok' },
  watch: { t: 'বকেয়া ১–৩০ দিন', tone: 'warn' },
  late: { t: 'বিলম্বিত ৩১–৯০ দিন', tone: 'warn' },
  doubt: { t: 'সন্দেহজনক ৯১–১৮০ দিন', tone: 'danger' },
  loss: { t: 'ক্ষতিগ্রস্ত ১৮০+ দিন', tone: 'danger' },
};

export const QH_ELIG_ST: Record<QhEligible['result'], { t: string; tone: Tone }> = {
  eligible: { t: 'যোগ্য', tone: 'ok' },
  conditional: { t: 'শর্তসাপেক্ষ', tone: 'warn' },
  blocked: { t: 'এখন আবেদন করা যাবে না', tone: 'neutral' },
};

export const QH_SRC: Record<QhEligible['source'], { t: string; tone: Tone }> = {
  rule: { t: 'স্বয়ংক্রিয় নিয়ম', tone: 'info' },
  manual: { t: 'Admin ম্যানুয়াল তালিকা', tone: 'neutral' },
  manual_exception: { t: 'ম্যানুয়াল এক্সেপশন (D-59)', tone: 'warn' },
};

export const QH_SEV: Record<SevKey, { t: string; tone: Tone }> = {
  pass: { t: 'পাস', tone: 'ok' },
  warn: { t: 'সতর্কতা', tone: 'warn' },
  block: { t: 'আটকে দেয়', tone: 'danger' },
};

export const QH_VERDICT: Record<string, { t: string; tone: Tone }> = {
  approve: { t: 'অনুমোদন', tone: 'ok' },
  return: { t: 'তথ্য চেয়ে ফেরত', tone: 'warn' },
  reject: { t: 'প্রত্যাখ্যান', tone: 'danger' },
  refer: { t: 'কমিটিতে রেফার', tone: 'info' },
};

/* ---------------- মৌলিক helper ---------------- */

const MONTHS = ['জানু', 'ফেব', 'মার্চ', 'এপ্রি', 'মে', 'জুন', 'জুলা', 'আগ', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'];

/** ISO → '১০ অক্টো ২০২৬' */
export function qhDate(iso?: string | null): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${MONTHS[m - 1]} ${y}`.replace(/[0-9]/g, (x) => '০১২৩৪৫৬৭৮৯'[Number(x)]);
}

export function qhAddMonths(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1 + n, Math.min(d, 28)));
  return dt.toISOString().slice(0, 10);
}

export function qhDaysBetween(from: string, to = QH_TODAY): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / 86400000);
}

export const qhProductById = (list: QhProduct[], id?: string) => list.find((p) => p.id === id || p.code === id);
export const qhPurposeLabel = (k: PurposeKey) => QH_PURPOSE.find((p) => p.k === k)?.t ?? k;
export const qhRepayLabel = (k: RepayKey) => QH_REPAY.find((p) => p.k === k)?.t ?? k;
export const qhChannelLabel = (k: ChannelKey) => QH_CHANNEL.find((p) => p.k === k)?.t ?? k;
export const qhDocLabel = (k: string) => QH_DOC.find((p) => p.k === k)?.t ?? k;
export const qhAppById = (apps: QhApp[], id?: string) => apps.find((a) => a.id === id || a.no === id);
export const qhLoanById = (loans: QhLoan[], id?: string) => loans.find((l) => l.id === id || l.no === id);

/** নিয়ম মানের প্রদর্শন — টাকা/শতাংশ/মাস/সংখ্যা */
export function qhRuleValue(r: QhRule): string {
  if (r.unit === 'paisa') return `৳${r.value.toLocaleString('en-US')}`;
  if (r.unit === 'pct') return `${r.value}%`;
  if (r.unit === 'month') return `${r.value} মাস`;
  if (typeof r.value === 'boolean') return r.value ? 'সত্য' : 'মিথ্যা';
  if (typeof r.value === 'number') return `${r.value}${r.unit === 'count' ? 'টি' : ''}`;
  return String(r.value);
}

/* ---------------- কিস্তি ও বকেয়া ---------------- */

export type QhInst = { no: number; due: string; amount: number; status: 'paid' | 'overdue' | 'upcoming' | 'waived'; at?: string; receipt?: string };

export const qhPerInst = (l: QhLoan) => Math.round(l.principal / l.tenure);

export function qhInsts(l: QhLoan, reps: QhRepayment[]): QhInst[] {
  if (!l.firstDue || l.status === 'pending') return [];
  const paid = reps.filter((r) => r.loan === l.id);
  return Array.from({ length: l.tenure }, (_, i) => {
    const due = qhAddMonths(l.firstDue as string, i);
    const p = paid.find((r) => r.inst === i + 1);
    const status: QhInst['status'] = p ? 'paid' : l.status === 'writeoff' && i >= paid.length ? 'waived' : Date.parse(due) < Date.parse(QH_TODAY) ? 'overdue' : 'upcoming';
    return { no: i + 1, due, amount: qhPerInst(l), status, at: p?.at, receipt: p?.receipt };
  });
}

export const qhRepaid = (l: QhLoan, reps: QhRepayment[]) => reps.filter((r) => r.loan === l.id).reduce((s, r) => s + r.amount, 0);
export const qhWrittenOff = (l: QhLoan, wos: QhWriteOff[]) => wos.filter((w) => w.loan === l.id && w.status === 'done').reduce((s, w) => s + w.amount, 0);
export const qhOutstanding = (l: QhLoan, reps: QhRepayment[], wos: QhWriteOff[]) =>
  Math.max(0, l.principal - qhRepaid(l, reps) - qhWrittenOff(l, wos));
export const qhPaidPct = (l: QhLoan, reps: QhRepayment[]) => (l.principal ? Math.round((qhRepaid(l, reps) / l.principal) * 100) : 0);
export const qhNextInst = (l: QhLoan, reps: QhRepayment[]) => qhInsts(l, reps).find((i) => i.status === 'overdue' || i.status === 'upcoming') ?? null;
export const qhArrearsOf = (l: QhLoan, reps: QhRepayment[]) =>
  qhInsts(l, reps).filter((i) => i.status === 'overdue').reduce((s, i) => s + i.amount, 0);
export const qhDaysLate = (l: QhLoan, reps: QhRepayment[]) => {
  const first = qhInsts(l, reps).find((i) => i.status === 'overdue');
  return first ? qhDaysBetween(first.due) : 0;
};
export const qhClassOf = (l: QhLoan, reps: QhRepayment[]) => {
  if (l.status === 'closed') return 'regular';
  if (l.status === 'writeoff') return 'loss';
  const d = qhDaysLate(l, reps);
  if (d === 0) return 'regular';
  if (d <= 30) return 'watch';
  if (d <= 90) return 'late';
  if (d <= 180) return 'doubt';
  return 'loss';
};

/* ---------------- পোর্টফোলিও, পুল, কিউ ---------------- */

export function qhPortfolio(loans: QhLoan[], reps: QhRepayment[], wos: QhWriteOff[]) {
  const disb = loans.filter((l) => l.status !== 'pending');
  const disbursed = disb.reduce((s, l) => s + l.principal, 0);
  const repaid = reps.reduce((s, r) => s + r.amount, 0);
  const writeOff = wos.filter((w) => w.status === 'done').reduce((s, w) => s + w.amount, 0);
  const outstanding = disb.reduce((s, l) => s + qhOutstanding(l, reps, wos), 0);
  const arrears = disb.reduce((s, l) => s + qhArrearsOf(l, reps), 0);
  return {
    loans: disb.length, disbursed, repaid, outstanding, arrears, writeOff,
    active: loans.filter((l) => l.status === 'active').length,
    arrearsLoans: loans.filter((l) => l.status === 'arrears').length,
    closed: loans.filter((l) => l.status === 'closed').length,
    pendingDisb: loans.filter((l) => l.status === 'pending').length,
    collectionRate: disbursed ? Math.round((repaid / (repaid + outstanding)) * 100) : 0,
  };
}

export function qhPoolState(w: QhWindow, loans: QhLoan[], apps: QhApp[]) {
  const committed = loans.filter((l) => l.status === 'pending').reduce((s, l) => s + l.principal, 0)
    + apps.filter((a) => a.status === 'approved' && !a.loan).reduce((s, a) => s + (a.decision?.amount ?? a.amount), 0);
  return {
    allocated: w.pool.allocated, held: w.pool.held, committed,
    available: Math.max(0, w.pool.allocated - w.pool.held - committed), source: w.pool.source, note: w.pool.note,
  };
}

export const qhQuotaLeft = (w: QhWindow) => Math.max(0, w.quota - w.used);
export const qhQueue = (apps: QhApp[]) => apps.filter((a) => a.status === 'screening' || a.status === 'review' || a.status === 'returned');
export const qhSlaBreaches = (apps: QhApp[]) =>
  apps.filter((a) => (a.status === 'review' || a.status === 'screening') && (a.slaBreached || qhDaysBetween(a.submittedAt) > QH_SLA_DAYS + 6));
export const qhEligibleOf = (list: QhEligible[], memberId?: string) => list.find((e) => e.memberId === memberId);

/** §৭.৭ — সর্বোচ্চ অঙ্ক = min(পণ্য, সঞ্চয়ের %, পুল, মূল্যায়ন) */
export function qhCapBreakdown(p: QhProduct, savings: number, poolAvailable: number, eligMax: number) {
  return [
    { label: 'পণ্যের সর্বোচ্চ সীমা', value: p.max, note: p.code },
    { label: 'মোট সঞ্চয়ের ৫০% (D-54)', value: Math.round(savings * 0.5), note: `৳${savings} এর অর্ধেক` },
    { label: 'ফান্ড পুলে অবশিষ্ট (D-40)', value: poolAvailable, note: 'হল্ড বাদে' },
    { label: 'যোগ্যতা মূল্যায়নের সীমা', value: eligMax, note: 'স্ন্যাপশট' },
  ];
}
export const qhMaxAmount = (p: QhProduct, savings: number, poolAvailable: number, eligMax: number) => {
  const caps = qhCapBreakdown(p, savings, poolAvailable, eligMax).map((c) => c.value).filter((x) => x > 0);
  return caps.length ? Math.min(...caps) : 0;
};

/* ---------------- Simulation (D-57 · গোপনীয়) ---------------- */

export type QhSimResult = {
  members: number; eligible: number; blocked: number; newlyBlocked: number; newlyEligible: number;
  bands: number[]; bandLabels: string[]; privacy: string;
};

export function qhSimulate(draft: { minSavings: number; maxPct: number; minMonths: number }, eligibleNow = 3): QhSimResult {
  const members = 9;
  const eligible = Math.max(0, Math.min(members, Math.round(members - (draft.maxPct - 30) / 10 - (draft.minMonths > 6 ? 2 : 0) - (draft.minSavings > 5000 ? 1 : 0))));
  const crowded = [0, 1, 2, 3, eligible - 3 > 0 ? eligible - 3 : 0];
  return {
    members,
    eligible,
    blocked: members - eligible,
    newlyBlocked: Math.max(0, eligibleNow - eligible),
    newlyEligible: Math.max(0, eligible - eligibleNow),
    bands: crowded,
    bandLabels: ['৳০ — আবেদন করা যাবে না', '৳১ – ২,৫০০', '৳২,৫০১ – ৫,০০০', '৳৫,০০১ – ১০,০০০', '৳১০,০০০+'],
    privacy: '৯ জন নমুনা সদস্যের শুধু সংখ্যা ও ব্যান্ড দেখানো হচ্ছে — কোনো নাম, আইডি বা পরিচয় নেই (D-57)।',
  };
}

/* ---------------- উদ্দেশ্যভিত্তিক বণ্টন (D-69) ---------------- */

export function qhPurposeStats(loans: QhLoan[], apps: QhApp[], wos: QhWriteOff[]) {
  return QH_PURPOSE.map((p) => {
    const ls = loans.filter((l) => l.status !== 'pending' && apps.find((a) => a.id === l.app)?.purpose === p.k);
    return {
      k: p.k, t: p.t, loans: ls.length,
      amount: ls.reduce((s, l) => s + l.principal, 0),
      repaid: ls.reduce((s, l) => s + qhRepaid(l, []) + (l.status === 'writeoff' ? 0 : 0), 0),
    };
  });
}

/* ---------------- পরিশোধের রসিদ ---------------- */

export const qhReceiptNo = (seq: number) => `QR-2610-${String(seq).padStart(4, '0')}`;
export const qhVoucherNo = (loanNo: string) => `QHV-${loanNo.slice(-7)}`;
export const qhCertNo = (seq: number) => `QHC-2610-${String(seq).padStart(4, '0')}`;
