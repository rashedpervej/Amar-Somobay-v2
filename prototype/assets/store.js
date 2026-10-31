/* ============================================================
   Somobay · store.js — ক্লিকেবল ফ্লোর জন্য লাইভ স্টেট
   ------------------------------------------------------------
   নীতি:
   • ACCOUNTS/TX/WITHDRAWALS/DUES... একই অ্যারে — এগুলোই স্টেট,
     সরাসরি mutate হয় (প্রোটোটাইপে এটাই সবচেয়ে সরল ও বিশ্বস্ত)।
   • ব্যালেন্স (posted) প্রতিটি পোস্টিং-এর পর লেজার থেকে
     পুনর্গণনা হয় → R-01/R-08 অনুযায়ী "সংরক্ষিত ব্যালেন্স" নয়।
   • প্রতিটি অ্যাকশনে একটি নোটিফিকেশন ও একটি লগ এন্ট্রি তৈরি হয়
     (অডিট ট্রেইল) — যাতে ফ্লোতে সিস্টেমের আচরণ দেখা যায়।
   • কোথাও সুদ/মুনাফা হিসাব নেই (BR-13)।
   ============================================================ */
(function () {
  'use strict';

  /* ---------- live state that has no other home ---------- */
  window.APP = {
    rev: 0,
    log: [],                 // [{at, who, txt}]  — অডিট ট্রেইল
    session: { user: 'আব্দুল করিম', role: 'MEMBER', member: 'm1', org: 'org1', as: null },
    draft: {},               // ফর্মের অস্থায়ী মান
    counters: { receipt: 1526, wd: 213, je: 32, stmt: 4, clc: 35, sch: 0 },
    dayClose: { date: '2026-10-29', done: false },
    suspense: [],            // ভুল রেফারেন্সে আসা টাকা (H10)
  };
  const A = window.APP;
  const next = (k, pad, prefix) => prefix + String(++A.counters[k]).padStart(pad, '0');

  /* ---------- helpers ---------- */
  const now = () => 'আজ · ' + bn(String(9 + Math.floor(A.rev / 6)).padStart(2, '0') + ':' + String((A.rev * 7) % 60).padStart(2, '0'));
  const who = () => A.session.role === 'MEMBER' ? 'আব্দুল করিম (সদস্য)' : A.session.as || 'মোঃ আব্দুল্লাহ (ম্যানেজার)';

  function commit(txt, extra) {
    A.rev++;
    A.log.unshift({ at: now(), who: who(), txt: txt });
    if (A.log.length > 60) A.log.pop();
    if (typeof window.onStore === 'function') window.onStore({ txt: txt, extra: extra || null });
    if (typeof renderLive === 'function') { try { renderLive(); } catch (e) { console.warn(e); } }
  }

  function notify(kind, title, body, link) {
    NOTIFS.unshift({ id: 'n' + (A.rev + 100), kind: kind, unread: true, at: now(), title: title, body: body, link: link || '#m16' });
    if (NOTIFS.length > 24) NOTIFS.pop();
  }

  /** R-01: ব্যালেন্স সংরক্ষিত নয় — প্রতিবার লেজার থেকে পুনর্গণনা */
  /* app.js-এর recalc()-ই ব্যবহার হয় — ব্যালেন্স কখনো হার্ডকোড নয় (R-01) */

  /** লেজার এন্ট্রি + (নগদ/ব্যাংক/ওয়ালেট) খাতের প্রভাব */
  function ledger(o) {
    const t = tx({
      accId: o.accId, memberId: o.memberId || acc(o.accId).memberId, type: o.type, amount: o.amount,
      date: o.date || '2026-10-30', at: now(), channel: o.channel, status: o.status,
      by: o.by, receipt: o.receipt, note: o.note || '', revOf: o.revOf || null, base: false,
    });
    if (t.status === 'posted') {
      recalc(t.accId);
      const pot = { cash_field: 'cash', cash_office: 'cash', bank: 'bank', bkash: 'wallet', nagad: 'wallet', cheque: 'bank' }[t.channel] || 'cash';
      KPI[pot] += t.type === 'deposit' ? t.amount : -t.amount;
    }
    return t;
  }

  /* ============================================================
     FLOW 3 — জমা
     ============================================================ */
  window.act = {
    notify: function (k, t, b, l) { notify(k, t, b, l); return { ok: true }; },
    commit: function (txt) { commit(txt); return { ok: true }; },
    /* নগদ জমা → সরাসরি Posted (নগদের জন্য আলাদা অনুমোদন লাগে না) */
    depositCash: function (accId, paisa, byName, offline, applyDue) {
      const a = acc(accId), s = scheme(a.schemeId);
      if (paisa > s.maxAmount) return { ok: false, err: 'এই স্কিমে একবারে সর্বোচ্চ ' + tk(s.maxAmount) + ' জমা দেওয়া যাবে।' };
      const rec = next('receipt', 4, 'RCP-2627-');
      const t = ledger({ accId: accId, type: 'deposit', amount: paisa, channel: 'cash_field',
        status: 'posted', by: byName || 'রাজু আহমেদ (সংগ্রহক)', receipt: rec });
      /* বকেয়া কিস্তি থাকলে তা থেকে কাটা হয় (শুধু applyDue হলে — নইলে payDue নিজেই হিসাব রাখে) */
      const due = applyDue ? DUES.find(d => d.accId === accId && d.paid < d.amount) : null;
      if (due) {
        const apply = Math.min(due.amount - due.paid, paisa);
        due.paid += apply;
        t.note = 'বকেয়া ' + bn(due.instNo) + 'তম কিস্তিতে ' + tk(apply) + ' প্রয়োগ হয়েছে';
        if (due.paid >= due.amount) DUES.splice(DUES.indexOf(due), 1);
      }
      a.paidInstallments++; a.missed = Math.max(0, (a.missed || 0) - (due ? 1 : 0));
      a.nextDue = (function () { const d = new Date(a.nextDue || '2026-11-10'); d.setMonth(d.getMonth() + 1); return d.toISOString().slice(0, 10); })();
      notify('txn', tk(paisa) + ' জমা হয়েছে ✓', s.name + ' • ' + rec + ' • সংগ্রহক: ' + (byName || 'রাজু আহমেদ') + '। নতুন ব্যালেন্স ' + tk(a.posted) + '।', '#m07');
      commit('নগদ জমা ' + tk(paisa) + ' → ' + a.no + ' · সরাসরি Posted · রসিদ ' + rec + (offline ? ' · অফলাইন থেকে sync' : ''),
        { accId: accId, receipt: rec, amount: paisa });
      return { ok: true, receipt: rec, txn: t.id, balance: a.posted, offline: !!offline };
    },

    /* ওয়ালেট জমা → PendingVerification (ম্যানুয়াল যাচাই, D-10) */
    depositWallet: function (accId, paisa, channel, ref) {
      const a = acc(accId), s = scheme(a.schemeId);
      if (!ref) return { ok: false, err: 'ওয়ালেটের TrxID/রেফারেন্স দিতে হবে — না হলে মিলিয়ে দেখা যাবে না।' };
      if (paisa > s.maxAmount) return { ok: false, err: 'সীমা ছাড়িয়েছে: ' + tk(s.maxAmount) };
      const rec = next('receipt', 4, 'RCP-2627-');
      const pd = { id: 'PD' + (PENDING_DEPOSITS.length + 1 + A.rev), receipt: rec, memberId: a.memberId, accId: accId,
        amount: paisa, date: '2026-10-30', channel: channel || 'bkash', ref: ref, by: 'সদস্য (নিজে)',
        at: now(), hoursAgo: 0, evidence: true, matched: 'none', sla: 'ok' };
      PENDING_DEPOSITS.unshift(pd);
      a.pending = (a.pending || 0) + paisa;
      KPI.pendingDeposits = PENDING_DEPOSITS.length;
      notify('txn', 'জমা যাচাইয়ের অপেক্ষায়', tk(paisa) + ' (' + ref + ') সমিতি যাচাই করছে। সাধারণত ২৪ ঘণ্টার মধ্যে নিশ্চিত হয় — ততক্ষণ এটি ব্যালেন্সে যোগ হয়নি।', '#m07');
      commit('ওয়ালেট জমা ' + tk(paisa) + ' → PendingVerification · ' + rec + ' · রেফ ' + ref, { accId: accId, receipt: rec });
      return { ok: true, receipt: rec, pd: pd.id, pending: a.pending };
    },

    /* Flow 4 · 5a — অনুমোদন (BR-04: maker ≠ checker) */
    approveDeposit: function (pdId, approver) {
      const i = PENDING_DEPOSITS.findIndex(d => d.id === pdId);
      if (i < 0) return { ok: false, err: 'এন্ট্রিটি আর কিউতে নেই — সম্ভবত অন্য কেউ নিষ্পত্তি করেছেন। তালিকা রিফ্রেশ করুন।' };
      const d = PENDING_DEPOSITS[i];
      const rec = d.recipient || null;
      PENDING_DEPOSITS.splice(i, 1);
      const a = acc(d.accId);
      a.pending = Math.max(0, (a.pending || 0) - d.amount);
      const t = ledger({ accId: d.accId, type: 'deposit', amount: d.amount, channel: d.channel,
        status: 'posted', by: d.by, receipt: d.receipt });
      KPI.pendingDeposits = PENDING_DEPOSITS.length;
      notify('txn', tk(d.amount) + ' জমা নিশ্চিত হয়েছে ✓', 'যাচাই সম্পন্ন — ' + d.receipt + '। নতুন ব্যালেন্স ' + tk(a.posted) + '।', '#m09');
      commit('জমা অনুমোদন ' + d.receipt + ' · ' + tk(d.amount) + ' → Posted · লেজার ' + t.id,
        { accId: d.accId, receipt: d.receipt, amount: d.amount });
      return { ok: true, receipt: d.receipt, txn: t.id, balance: a.posted, rec: rec };
    },

    /* Flow 4 · 5b — প্রত্যাখ্যান (কারণ বাধ্যতামূলক) */
    rejectDeposit: function (pdId, reason) {
      if (!reason) return { ok: false, err: 'প্রত্যাখ্যানের কারণ লিখতেই হবে — সদস্যকে জানাতে হবে কেন।' };
      const i = PENDING_DEPOSITS.findIndex(d => d.id === pdId);
      if (i < 0) return { ok: false, err: 'এন্ট্রিটি আর কিউতে নেই।' };
      const d = PENDING_DEPOSITS[i];
      PENDING_DEPOSITS.splice(i, 1);
      acc(d.accId).pending = Math.max(0, (acc(d.accId).pending || 0) - d.amount);
      KPI.pendingDeposits = PENDING_DEPOSITS.length;
      notify('txn', 'জমা প্রত্যাখ্যাত', d.receipt + ' · কারণ: ' + reason + '। টাকাটি আপনার ওয়ালেটেই আছে — সমিতির অফিসে যোগাযোগ করুন।', '#m16');
      commit('জমা প্রত্যাখ্যান ' + d.receipt + ' · কারণ: ' + reason);
      return { ok: true, receipt: d.receipt, reason: reason };
    },

    /* Flow 4 · 7 — রিভার্সাল (R-02: মূল এন্ট্রি অক্ষত, উল্টো জোড়া বসে) */
    reverse: function (txnId, reason) {
      if (!reason) return { ok: false, err: 'সংশোধনের কারণ বাধ্যতামূলক।' };
      const o = TX.find(t => t.id === txnId);
      if (!o) return { ok: false, err: 'লেনদেনটি পাওয়া যায়নি।' };
      if (o.type === 'reversal') return { ok: false, err: 'সংশোধন সংশোধন করা যায় না।' };
      const je = next('je', 4, 'JE-2627-');
      o.status = 'reversed';
      const r = ledger({ accId: o.accId, type: 'reversal', amount: o.amount, channel: o.channel,
        status: 'posted', by: 'সুমি রানী (হিসাবরক্ষক)', receipt: je, revOf: txnId, note: reason });
      o.revBy = r.id;
      recalc(o.accId);
      notify('txn', 'একটি লেনদেন সংশোধন হয়েছে', o.receipt + ' (' + tk(o.amount) + ') বাতিল হয়েছে। কারণ: ' + reason + '। ব্যালেন্স আবার হিসাব করা হয়েছে — ' + tk(acc(o.accId).posted) + '।', '#m09');
      commit('রিভার্সাল ' + je + ' · মূল ' + txnId + ' (' + tk(o.amount) + ') · মূল এন্ট্রি অক্ষত আছে (R-02)');
      return { ok: true, je: je, reversalTxn: r.id, balance: acc(o.accId).posted };
    },

    /* ============================================================
       FLOW 5 — উত্তোলন
       ============================================================ */
    requestWithdrawal: function (accId, paisa, method, reason) {
      const a = acc(accId), s = scheme(a.schemeId), bb = balanceBreakdown(a);
      if (paisa <= 0) return { ok: false, err: 'পরিমাণ দিন।' };
      if (paisa > bb.avail) return { ok: false, err: 'তোলা যাবে সর্বোচ্চ ' + tk(bb.avail) + ' — এর বেশি চাইলে আটকে যাবে। হিসাবটি নিচে দেখুন।' };
      if (paisa > s.maxAmount) return { ok: false, err: 'একবারে সর্বোচ্চ ' + tk(s.maxAmount) + ' (স্কিমের নিয়ম)।' };
      const thisMonth = WITHDRAWALS.filter(w => w.accId === accId && ['submitted', 'under_review', 'approved', 'disbursing', 'settled'].indexOf(w.status) >= 0).length;
      if (thisMonth >= s.maxPerMonth) return { ok: false, err: 'এই মাসে ইতিমধ্যে ' + bn(thisMonth) + ' বার উত্তোলন হয়েছে — স্কিমে সীমা ' + bn(s.maxPerMonth) + ' বার (D-02)।' };
      if (a.status === 'frozen') return { ok: false, err: 'অ্যাকাউন্ট ফ্রিজ করা — উত্তোলন সম্ভব নয়। কারণ: ' + (a.frozenReason || '—') };
      const no = next('wd', 4, 'WR-2627-');
      const d = new Date(TODAY); d.setDate(d.getDate() + s.noticeDays);
      const w = { id: 'w' + (WITHDRAWALS.length + 1 + A.rev), no: no, memberId: a.memberId, accId: accId,
        amount: paisa, reason: reason || 'অন্যান্য', reasonCode: 'other', method: method || 'bkash',
        payoutRef: member(a.memberId).mobile, submitted: '2026-10-30', at: now(), status: 'under_review',
        step: 'ম্যানেজার', noticeEnds: d.toISOString().slice(0, 10), hoursAgo: 0, nominee: '—', onBehalf: false,
        elig: { posted: bb.posted, hold: 0, min: bb.minBal, locked: bb.locked, avail: bb.avail } };
      WITHDRAWALS.unshift(w);
      a.hold += paisa;                                    /* BR-02: hold তৈরি */
      KPI.pendingWithdrawals = WITHDRAWALS.filter(x => ['submitted', 'under_review', 'approved', 'disbursing'].indexOf(x.status) >= 0).length;
      notify('req', 'উত্তোলনের আবেদন গৃহীত হয়েছে', tk(paisa) + ' (' + no + ') জমা হয়েছে। ' + tk(paisa) + ' আটক (hold) রাখা হয়েছে। নোটিশ পিরিয়ড শেষ হবে ' + dstr(w.noticeEnds) + '।', '#m12');
      commit('উত্তোলন আবেদন ' + no + ' · ' + tk(paisa) + ' · hold তৈরি → তোলা যাবে এখন ' + tk(balanceBreakdown(a).avail));
      return { ok: true, no: no, hold: paisa, avail: balanceBreakdown(a).avail, noticeEnds: w.noticeEnds };
    },

    cancelWithdrawal: function (wid) {
      const w = WITHDRAWALS.find(x => x.id === wid);
      if (!w) return { ok: false, err: 'আবেদনটি পাওয়া যায়নি।' };
      if (['settled', 'rejected', 'cancelled'].indexOf(w.status) >= 0) return { ok: false, err: 'এই আবেদন ইতিমধ্যে ' + w.status + ' — প্রত্যাহার করা যাবে না।' };
      w.status = 'cancelled'; w.step = 'সদস্য প্রত্যাহার করেছেন';
      const a = acc(w.accId); a.hold = Math.max(0, a.hold - w.amount);
      KPI.pendingWithdrawals = WITHDRAWALS.filter(x => ['submitted', 'under_review', 'approved', 'disbursing'].indexOf(x.status) >= 0).length;
      notify('req', 'আবেদন প্রত্যাহার হয়েছে', w.no + ' প্রত্যাহার করা হয়েছে। আটক থাকা ' + tk(w.amount) + ' আবার তোলা যাবে — বর্তমান যোগ্যতা ' + tk(balanceBreakdown(a).avail) + '।', '#m11');
      commit('উত্তোলন প্রত্যাহার ' + w.no + ' · hold মুক্তি ' + tk(w.amount));
      return { ok: true, no: w.no, avail: balanceBreakdown(a).avail };
    },

    /* D-22: অনুমোদনকারীর সীমা — বেশি হলে উপরে রাউট হয় */
    approveWithdrawal: function (wid, role) {
      const w = WITHDRAWALS.find(x => x.id === wid);
      if (!w) return { ok: false, err: 'আবেদনটি পাওয়া যায়নি।' };
      if (w.status !== 'under_review' && w.status !== 'submitted') return { ok: false, err: 'এই আবেদন ইতিমধ্যে ' + w.status + '।' };
      const LIMIT = { ACCOUNTANT: 0, MANAGER: 500000, APPROVER: 20000000, ORG_ADMIN: Infinity };
      /* সদস্যভূমিকায় এই কিউ অ্যাক্সেসই নেই — ডেমোতে MANAGER ধরে এগোনো হয় */
      const eff = LIMIT.hasOwnProperty(role) ? role : 'MANAGER';
      const lim = LIMIT[eff];
      if (eff !== role) A.session.role = eff;
      if (role === 'ACCOUNTANT') return { ok: false, escalate: true, err: 'ACCOUNTANT শুধু প্রস্তাব করতে পারেন, অনুমোদন করতে পারেন না (D-22)। আবেদনটি MANAGER-এর কিউতে পাঠানো হয়েছে।' };
      if (w.amount > lim) return { ok: false, escalate: true, err: 'আপনার সীমা ' + tk(lim) + ' — এই আবেদন ' + tk(w.amount) + '। স্বয়ংক্রিয়ভাবে ' + (role === 'MANAGER' ? 'APPROVER' : 'ORG_ADMIN') + '-এর কাছে পাঠানো হয়েছে (D-22)।' };
      w.status = 'approved'; w.step = 'নিষ্পত্তির অপেক্ষায়';
      w.approvedBy = role === 'APPROVER' ? 'কাজী নুরুন্নবী (অনুমোদনকারী)' : 'মোঃ আব্দুল্লাহ (ম্যানেজার)';
      w.approvedAt = dstr('2026-10-30') + ' ' + now().replace('আজ · ', '');
      notify('req', 'উত্তোলন অনুমোদিত হয়েছে', w.no + ' · ' + tk(w.amount) + ' অনুমোদিত। নিষ্পত্তি হবে ' + dstr(w.noticeEnds) + '-এর পর।', '#m12');
      commit('উত্তোলন অনুমোদন ' + w.no + ' · ' + tk(w.amount) + ' · ' + (role || 'MANAGER') + ' সীমা ' + tk(lim) + '-এর মধ্যে');
      return { ok: true, no: w.no, by: w.approvedBy };
    },

    /* D-26: পরিমাণ কমানো যায়, বাড়ানো নয় */
    reduceWithdrawal: function (wid, newPaisa, reason) {
      const w = WITHDRAWALS.find(x => x.id === wid);
      if (!w) return { ok: false, err: 'আবেদনটি পাওয়া যায়নি।' };
      if (!reason) return { ok: false, err: 'পরিমাণ কমানোর কারণ লিখতে হবে (D-26)।' };
      if (newPaisa >= w.amount) return { ok: false, err: 'কমানো যাবে, বাড়ানো যাবে না — সর্বোচ্চ ' + tk(w.amount - 100) + '।' };
      const diff = w.amount - newPaisa;
      w.amount = newPaisa; w.reducedFrom = newPaisa + diff; w.reduceReason = reason;
      const a = acc(w.accId); a.hold = Math.max(0, a.hold - diff);
      notify('req', 'উত্তোলনের পরিমাণ কমানো হয়েছে', w.no + ' · আবেদন ছিল ' + tk(newPaisa + diff) + ', অনুমোদিত হয়েছে ' + tk(newPaisa) + '। কারণ: ' + reason + '। বাকি ' + tk(diff) + ' আবার তোলা যাবে।', '#m12');
      commit('উত্তোলন হ্রাস ' + w.no + ' · ' + tk(newPaisa + diff) + ' → ' + tk(newPaisa) + ' · hold থেকে ' + tk(diff) + ' মুক্তি (D-26/D-27)');
      return { ok: true, amount: newPaisa, released: diff, avail: balanceBreakdown(a).avail };
    },

    rejectWithdrawal: function (wid, reason) {
      const w = WITHDRAWALS.find(x => x.id === wid);
      if (!w) return { ok: false, err: 'আবেদনটি পাওয়া যায়নি।' };
      if (!reason) return { ok: false, err: 'প্রত্যাখ্যানের কারণ বাধ্যতামূলক।' };
      w.status = 'rejected'; w.step = 'বাতিল'; w.rejectReason = reason; w.rejectedBy = 'মোঃ আব্দুল্লাহ (ম্যানেজার)';
      const a = acc(w.accId); a.hold = Math.max(0, a.hold - w.amount);
      KPI.pendingWithdrawals = WITHDRAWALS.filter(x => ['submitted', 'under_review', 'approved', 'disbursing'].indexOf(x.status) >= 0).length;
      notify('req', 'উত্তোলন প্রত্যাখ্যাত', w.no + ' · কারণ: ' + reason + '। আটক থাকা ' + tk(w.amount) + ' ছেড়ে দেওয়া হয়েছে — এখন তোলা যাবে ' + tk(balanceBreakdown(a).avail) + '।', '#m12');
      commit('উত্তোলন প্রত্যাখ্যান ' + w.no + ' · hold মুক্তি ' + tk(w.amount) + ' · কারণ: ' + reason);
      return { ok: true, avail: balanceBreakdown(a).avail };
    },

    /* Flow 5 · 8 — নিষ্পত্তি (D-27 আংশিক প্রদান; ওয়ালেটে unknown হলে Settled নয়) */
    settleWithdrawal: function (wid, method, partial) {
      const w = WITHDRAWALS.find(x => x.id === wid);
      if (!w) return { ok: false, err: 'আবেদনটি পাওয়া যায়নি।' };
      if (w.status !== 'approved') return { ok: false, err: 'শুধু অনুমোদিত আবেদন নিষ্পত্তি করা যায় — বর্তমান অবস্থা: ' + w.status };
      const s = scheme(acc(w.accId).schemeId);
      const fee = w.amount > 1000000 ? s.fees.withdrawal : 0;          /* D-05: ৳১০,০০০-এর বেশি হলে ৳২০ */
      const pay = partial ? partial : w.amount;
      if (pay > w.amount) return { ok: false, err: 'আবেদনের অঙ্কের বেশি দেওয়া যাবে না।' };
      const a = acc(w.accId);
      if (KPI.cash + KPI.bank + KPI.wallet < pay) return { ok: false, err: 'সমিতির তহবিলে এখন ' + tk(KPI.cash + KPI.bank + KPI.wallet) + ' আছে — ' + tk(pay) + ' দেওয়া যাবে না। অনুমোদিত থাকবে, তহবিল এলে নিষ্পত্তি হবে (D-02)।' };
      const origAmt = w.amount;
      const vch = next('wd', 4, 'WVC-2627-');
      const t = ledger({ accId: w.accId, type: 'withdrawal', amount: pay + fee, channel: method || w.method,
        status: 'posted', by: 'সুমি রানী (হিসাবরক্ষক)', receipt: vch, note: 'উত্তোলন ফি ' + tk(fee) + ' সহ' });
      w.status = pay < w.amount ? 'approved' : 'settled';
      w.settledAt = '2026-10-30'; w.voucher = vch; w.disbursedBy = 'সুমি রানী (হিসাবরক্ষক)'; w.fee = fee;
      a.hold = Math.max(0, a.hold - pay);
      if (pay < origAmt) { w.amount -= pay; notify('req', 'আংশিক নিষ্পত্তি হয়েছে', vch + ' · ' + tk(pay) + ' দেওয়া হয়েছে। বাকি ' + tk(w.amount) + ' কিউতে আছে — তহবিল এলে দেওয়া হবে (D-27)।', '#m12'); }
      else notify('req', 'উত্তোলন সম্পন্ন ✓', tk(pay) + ' (ফি ' + tk(fee) + ' বাদে হাতে ' + tk(pay - fee) + ') পাঠানো হয়েছে · ' + vch + '। নতুন ব্যালেন্স ' + tk(a.posted) + '।', '#m12');
      KPI.disbursedToday += pay;
      KPI.pendingWithdrawals = WITHDRAWALS.filter(x => ['submitted', 'under_review', 'approved', 'disbursing'].indexOf(x.status) >= 0).length;
      commit('নিষ্পত্তি ' + vch + ' · ' + tk(pay) + (fee ? ' + ফি ' + tk(fee) : '') + ' · লেজার ' + t.id + (pay < origAmt ? ' · আংশিক (D-27)' : ''));
      return { ok: true, voucher: vch, fee: fee, paid: pay, txn: t.id, balance: a.posted, avail: balanceBreakdown(a).avail };
    },

    /* ============================================================
       FLOW 1 — নিবন্ধন → সক্রিয় সদস্য
       ============================================================ */
    approveApplication: function (appId) {
      const i = APPLICATIONS.findIndex(x => x.id === appId);
      if (i < 0) return { ok: false, err: 'আবেদনটি আর কিউতে নেই — সম্ভবত অন্য কেউ নিষ্পত্তি করেছেন।' };
      const ap = APPLICATIONS[i];
      const bad = Object.keys(ap.docs).filter(k => ap.docs[k] !== 'ok');
      if (bad.length) return { ok: false, err: bad.length + 'টি ডকুমেন্ট বাকি/অস্পষ্ট — সব ডকুমেন্ট যাচাই না হলে অনুমোদন করা যাবে না।' };
      APPLICATIONS.splice(i, 1);
      const m = ap.memberId ? member(ap.memberId) : null;
      const name = m ? m.name : ap.name;
      const no = m && m.no !== '—' ? m.no : ORG.code + '-2627-0' + bn(216 + A.rev);
      if (m) { m.status = 'active'; m.no = no; m.joined = '2026-10-30'; m.accounts = 1; }
      const s = scheme(ap.schemeId);
      const a = { id: 'a' + (ACCOUNTS.length + 1 + A.rev), memberId: ap.memberId || 'mNew' + A.rev, schemeId: ap.schemeId,
        no: no + '-' + (s.type === 'daily' ? 'DS' : s.type === 'term' ? 'TS' : 'MS'), opened: '2026-10-30',
        posted: 0, pending: 0, hold: 0, totalIn: 0, totalOut: 0, status: 'active',
        day: s.type === 'monthly' ? 10 : null, lastInstallment: 0, paidInstallments: 0, missed: 0,
        nextDue: '2026-11-10', lockInEnds: s.lockIn ? new Date(2027, 3, 30).toISOString().slice(0, 10) : undefined };
      ACCOUNTS.push(a);
      KPI.pendingMembers = APPLICATIONS.length;
      KPI.members++; KPI.activeMembers++;
      commit('সদস্য অনুমোদন · ' + name + ' → ' + no + ' · নতুন অ্যাকাউন্ট ' + a.no + ' (' + s.name + ') · প্রথম জমা বাকি');
      return { ok: true, memberNo: no, accNo: a.no, name: name, accId: a.id };
    },

    /* A-17 → প্রথম জমা (নতুন অ্যাকাউন্ট চালু হয় এখানেই) */
    firstDeposit: function (accId, paisa) {
      const r = act.depositCash(accId, paisa, 'সুমি রানী (হিসাবরক্ষক)');
      if (r.ok) {
        const sc = scheme(acc(accId).schemeId), fee = sc.fees.admission;
        if (fee) {
          ledger({ accId: accId, type: 'fee', amount: fee, channel: 'cash', status: 'posted',
            by: 'সুমি রানী (হিসাবরক্ষক)', note: 'ভর্তি ফি (D-05) — সুদ নয়' });
          commit('ভর্তি ফি ' + tk(fee) + ' · আলাদা রসিদ · লেজার: ডেবিট নগদ / ক্রেডিট সদস্য ফি আয় (D-05, সুদ নয়)');
        }
        commit('প্রথম জমা ' + tk(paisa) + ' → ' + acc(accId).no + ' · অ্যাকাউন্ট Active · সময়সূচি তৈরি');
      }
      return r;
    },

    /* Flow 1 · সিদ্ধান্ত বিন্দু — আবেদন প্রত্যাখ্যান (কারণ বাধ্যতামূলক) */
    rejectApplication: function (appId, reason) {
      const i = APPLICATIONS.findIndex(x => x.id === appId);
      if (i < 0) return { ok: false, err: 'আবেদনটি কিউতে নেই।' };
      const ap = APPLICATIONS[i];
      if (!reason || reason.length < 6) return { ok: false, err: 'প্রত্যাখ্যানের কারণ লিখতে হবে (কমপক্ষে ৬ অক্ষর) — কারণসহ SMS যাবে।' };
      APPLICATIONS.splice(i, 1);
      ap.status = 'rejected'; ap.rejectReason = reason; ap.decidedAt = '2026-10-30';
      const m = ap.memberId ? member(ap.memberId) : null;
      if (m) m.status = 'rejected';
      KPI.pendingMembers = APPLICATIONS.length;
      notify('flag', 'আবেদন প্রত্যাখ্যাত', (m ? m.name : ap.name) + ' · কারণ: ' + reason, '#a11');
      commit('সদস্য আবেদন প্রত্যাখ্যাত · ' + (m ? m.name : ap.name) + ' · কারণ: ' + reason);
      return { ok: true, name: m ? m.name : ap.name, reason: reason };
    },

    /* ============================================================
       FLOW 2 — নতুন স্কিম: Draft → PendingApproval → Approved → Active
       (maker ≠ checker · BR-04; version pinning · D-32)
       ============================================================ */
    draftScheme: function (o) {
      o = o || {};
      const err = [];
      if (!o.name || o.name.length < 3) err.push('স্কিমের নাম দিন (৩ অক্ষরের বেশি)');
      if (!(o.installment > 0)) err.push('কিস্তির পরিমাণ ০-এর বেশি হতে হবে');
      if (o.minBalance > o.maxAmount) err.push('অসঙ্গতি: সর্বনিম্ন ব্যালেন্স সর্বোচ্চ সীমার চেয়ে বেশি');
      if (o.tenure && o.lockIn > o.tenure) err.push('অসঙ্গতি: লক-ইন মেয়াদের চেয়ে বড় হতে পারে না');
      if (o.type === 'term' && !(o.tenure > 0)) err.push('মেয়াদি স্কিমে মেয়াদ (মাস) আবশ্যক');
      if (err.length) return { ok: false, err: err.join(' · ') };
      const n = ++A.counters.sch;
      const sc = {
        id: 'scNew' + n, code: o.code || ('NEW-2627-' + String(n).padStart(2, '0')), name: o.name,
        type: o.type || 'monthly', typeBn: o.type === 'daily' ? 'দৈনিক' : (o.type === 'term' ? 'মেয়াদি' : 'মাসিক'),
        installment: o.installment, mode: 'fixed', tenure: o.tenure || null, lockIn: o.lockIn || 0,
        status: 'draft', enrollable: false, noticeDays: o.noticeDays == null ? 7 : o.noticeDays,
        maxPerMonth: o.maxPerMonth || 1, maxAmount: o.maxAmount || 5000000, minBalance: o.minBalance || 0,
        extra: !!o.extra, members: 0, total: 0, version: 1, started: null,
        desc: o.desc || 'কমিটির সিদ্ধান্ত অনুযায়ী প্রস্তাবিত নতুন স্কিম — এখনো খসড়া।',
        fees: { admission: 10000, annual: 5000, withdrawal: 2000 }, graceDays: 7, lateFee: 2000,
        maker: APP.session.user, madeAt: '2026-10-30', totalPossible: o.tenure ? o.installment * o.tenure : null,
        verHistory: [{ v: 1, at: '2026-10-30', by: 'খসড়া · ' + APP.session.user, ch: 'প্রথম খসড়া (কোনো সুদ-ক্ষেত্র নেই — R-13)' }],
      };
      SCHEMES.push(sc);
      commit('স্কিমের খসড়া · ' + sc.name + ' (' + sc.code + ') · কিস্তি ' + tk(sc.installment) + (sc.tenure ? ' · মেয়াদ ' + bn(sc.tenure) + ' মাস' : '') + ' · Draft');
      return { ok: true, id: sc.id, code: sc.code };
    },
    submitScheme: function (scId) {
      const sc = scheme(scId);
      if (!sc) return { ok: false, err: 'স্কিম খুঁজে পাওয়া যায়নি।' };
      if (sc.status !== 'draft') return { ok: false, err: 'শুধু Draft স্কিম অনুমোদনে পাঠানো যায় (বর্তমান: ' + SCH_STATUS[sc.status].t + ')।' };
      sc.status = 'pending_approval';
      notify('flag', 'স্কিম অনুমোদনের অপেক্ষায়', sc.name + ' — maker ≠ checker যাচাই হবে (BR-04)', '#a04');
      commit('স্কিম জমা · ' + sc.name + ' · Draft → PendingApproval');
      return { ok: true, by: sc.maker };
    },
    approveScheme: function (scId, checkerName) {
      const sc = scheme(scId);
      if (!sc) return { ok: false, err: 'স্কিম খুঁজে পাওয়া যায়নি।' };
      if (sc.status !== 'pending_approval') return { ok: false, err: 'অবস্থা "' + SCH_STATUS[sc.status].t + '" — অনুমোদনযোগ্য নয়।' };
      if ((checkerName || APP.session.user) === sc.maker)
        return { ok: false, err: 'Maker ≠ Checker (BR-04) — খসড়াকারী ' + sc.maker + ' নিজে অনুমোদন করতে পারবেন না। অন্য APPROVER বা কমিটি সদস্য লাগবে।' };
      sc.status = 'approved'; sc.approver = checkerName || APP.session.user; sc.approvedAt = '2026-10-30';
      notify('checkc', 'স্কিম অনুমোদিত', sc.name + ' · অনুমোদনকারী ' + sc.approver, '#a06');
      commit('স্কিম অনুমোদিত · ' + sc.name + ' · ' + sc.approver + ' (BR-04 পাস)');
      return { ok: true, by: sc.approver };
    },
    activateScheme: function (scId) {
      const sc = scheme(scId);
      if (!sc) return { ok: false, err: 'স্কিম খুঁজে পাওয়া যায়নি।' };
      if (sc.status !== 'approved') return { ok: false, err: 'অনুমোদনের পরেই চালু করা যায় (বর্তমান: ' + SCH_STATUS[sc.status].t + ')।' };
      sc.status = 'active'; sc.enrollable = true; sc.started = '2026-10-30';
      notify('sparkle', 'নতুন স্কিম চালু ✓', sc.name + ' — এখন M-02-এ দৃশ্যমান, নোটিশ বোর্ডে ঘোষণা গেছে', '#a06');
      commit('স্কিম চালু · ' + sc.name + ' · version ' + bn(sc.version) + ' · M-02-এ দৃশ্যমান');
      return { ok: true, started: sc.started };
    },
    closeNewScheme: function (scId, reason) {
      const sc = scheme(scId);
      if (!sc) return { ok: false, err: 'স্কিম খুঁজে পাওয়া যায়নি।' };
      if (sc.status !== 'active') return { ok: false, err: 'শুধু চালু স্কিম নতুন নামভর্তির জন্য বন্ধ করা যায়।' };
      sc.status = 'closed_new'; sc.enrollable = false; sc.closedNewOn = '2026-10-30';
      sc.closedReason = reason || ('কমিটির সিদ্ধান্ত — নতুন নামভর্তি বন্ধ; বিদ্যমান ' + bn(sc.members) + ' জনের কিস্তি ও নিয়ম অপরিবর্তিত থাকবে।');
      notify('lock', 'নতুন নামভর্তি বন্ধ', sc.name + ' · বিদ্যমান ' + bn(sc.members) + ' জন সদস্যের কিস্তি চলবে (D-32)', '#a06');
      commit('স্কিম নতুন নামভর্তি বন্ধ · ' + sc.name + ' · বিদ্যমান অ্যাকাউন্টের নিয়ম অপরিবর্তিত (D-32)');
      return { ok: true, members: sc.members };
    },

    /* ============================================================
       FLOW 6 — বকেয়া
       ============================================================ */
    payDue: function (idx, paisa) {
      const d = DUES[idx];
      if (!d) return { ok: false, err: 'বকেয়াটি পাওয়া যায়নি — সম্ভবত পরিশোধ হয়ে গেছে।' };
      const rem = d.amount - d.paid;
      const pay = Math.min(paisa || rem, rem);
      const fee = d.paid === 0 ? d.lateFee : 0;                            /* D-08: নির্ধারিত ৳২০, সময়ের সাথে বাড়ে না */
      const r = act.depositCash(d.accId, pay + fee, 'সদস্য (নিজে)', false, false);
      if (!r.ok) return r;
      d.paid += pay;
      if (d.paid >= d.amount) DUES.splice(idx, 1);
      const a = acc(d.accId), m = member(a.memberId);
      KPI.duesTotal = DUES_BASE + DUES.reduce((s, x) => s + (x.amount - x.paid), 0);
      KPI.dueMembers = DUES.map(x => acc(x.accId).memberId).filter((v, i, arr) => arr.indexOf(v) === i).length + 20;
      m.due = DUES.filter(x => acc(x.accId).memberId === m.id).reduce((s, x) => s + (x.amount - x.paid), 0);
      notify('due', DUES.indexOf(d) < 0 ? 'বকেয়া পরিশোধ সম্পন্ন 🎉' : 'আংশিক পরিশোধ হয়েছে',
        bn(d.instNo) + 'তম কিস্তিতে ' + tk(pay) + (fee ? ' + বিলম্ব ফি ' + tk(fee) : '') + ' জমা হয়েছে। ' +
        (DUES.indexOf(d) < 0 ? 'এই অ্যাকাউন্টে আর কোনো বকেয়া নেই।' : 'বাকি আছে ' + tk(d.amount - d.paid) + '।'), '#m13');
      commit('বকেয়া পরিশোধ · কিস্তি ' + bn(d.instNo) + ' · ' + tk(pay) + (fee ? ' + ফি ' + tk(fee) + ' (সুদ নয়, D-08)' : '') + ' · রেজিস্টারে মোট বকেয়া এখন ' + tk(KPI.duesTotal));
      return { ok: true, paid: pay, fee: fee, remaining: DUES.indexOf(d) < 0 ? 0 : d.amount - d.paid, total: KPI.duesTotal };
    },

    sendReminders: function (count) {
      const n = count || DUES.length;
      commit('বাল্ক রিমাইন্ডার · ' + bn(n) + ' জন সদস্যকে SMS কিউ করা হয়েছে · dry-run প্রিভিউ দেখানো হয়েছিল (A-33)');
      return { ok: true, sent: n };
    },

    /* ============================================================
       FLOW 7 — স্টেটমেন্ট
       ============================================================ */
    generateStatement: function (accId, label, range) {
      const a = acc(accId);
      const rng = range || ['2026-10-01', '2026-10-30'];
      /* শুরুর ব্যালেন্স = সব posted লেনদেনের যোগফল − এই স্টেটমেন্টের ভিতরের লেনদেন।
         তাই ভিতরের তালিকায় শুধু নতুন (base নয়) লেনদেন দেখানো হয় — ডেমোর পুরনো
         লেনদেনগুলো শুরুর ব্যালেন্সেই গুটিয়ে আছে। */
      const all = TX.filter(t => t.accId === accId && t.status === 'posted');
      const sum = (list, dir) => list.filter(t => dir === 'in' ? t.type === 'deposit' : t.type !== 'deposit')
        .reduce((s, t) => s + t.amount, 0);
      const inRange = all.filter(t => !t.base && t.date >= rng[0] && t.date <= rng[1]);
      const before  = all.filter(t => t.date < rng[0]);
      const openBal = a.posted - sum(inRange, 'in') + sum(inRange, 'out');
      const st = { id: 'st' + (++A.counters.stmt), kind: 'custom', accId: accId, daysAhead: daysAhead(0),
        label: label || 'কাস্টম স্টেটমেন্ট', range: rng,
        madeAt: '2026-10-30', fmt: 'PDF', size: bn(40 + inRange.length * 6) + ' KB',
        open: openBal, close: a.posted, inTx: inRange.filter(t => t.type === 'deposit').length,
        outTx: inRange.filter(t => t.type !== 'deposit').length,
        inAmt: sum(inRange, 'in'), outAmt: sum(inRange, 'out'), fresh: true,
        note: inRange.length ? '' : 'নির্বাচিত সময়ে নতুন কোনো লেনদেন নেই — আগের সব লেনদেন শুরুর ব্যালেন্সেই যোগ করা আছে।' };
      STATEMENTS.unshift(st);
      notify('txn', 'স্টেটমেন্ট তৈরি হয়েছে ✓', st.label + ' · ' + bn(inRange.length) + 'টি লেনদেন · শেষ ব্যালেন্স ' + tk(st.close) + '। ডাউনলোড করতে পারবেন।', '#m14');
      commit('স্টেটমেন্ট তৈরি · ' + st.label + ' · ' + bn(inRange.length) + ' লেনদেন · শুরু ' + tk(st.open) + ' → শেষ ' + tk(st.close) + ' (মিলে গেছে ✓)');
      return { ok: true, id: st.id, rows: inRange.length, open: st.open, close: st.close };
    },

    /* ============================================================
       FLOW 8 — বন্ধ ও চূড়ান্ত নিষ্পত্তি
       ============================================================ */
    clearanceCheck: function (accId) {
      const a = acc(accId), m = member(a.memberId);
      const dues = DUES.filter(d => d.accId === accId);
      /* a8-এর মতো পুরনো হিসাবে রেজিস্টারে আরও বকেয়া আছে (৯০+ দিনের ব্যান্ড) */
      const extra = accId === 'a8' ? 291000 : 0;
      const dueAmt = dues.reduce((s, d) => s + (d.amount - d.paid), 0);
      const fee = dues.filter(d => d.paid === 0).length * scheme(a.schemeId).lateFee;
      const hold = a.hold, pendingWd = WITHDRAWALS.filter(w => w.accId === accId && ['submitted', 'under_review', 'approved', 'disbursing'].indexOf(w.status) >= 0);
      const tot = dueAmt + extra;
      return { posted: a.posted, dueAmt: tot, fee: fee, hold: hold, pendingWd: pendingWd.length,
        net: a.posted - tot - fee, payable: Math.max(0, a.posted - tot - fee),
        pass: tot === 0 && hold === 0 && pendingWd === 0, member: m.name, accNo: a.no,
        dueCount: dues.length + (extra ? 6 : 0) };
    },

    closeAccount: function (accId, waivePaisa, decisionNo) {
      const c = act.clearanceCheck(accId), a = acc(accId);
      if (c.pendingWd) return { ok: false, err: bn(c.pendingWd) + 'টি চলমান উত্তোলন আবেদন আছে — আগে নিষ্পত্তি বা বাতিল করতে হবে (Flow 5, A-22/A-24)।', clearance: c };
      /* বকেয়া ও বিলম্ব ফি নিষ্পত্তিতে সমন্বয় হয় — হার্ড ব্লক নয়। সমিতির পাওনা থেকে কম
         পড়লে মওকুফের লিখিত সিদ্ধান্ত লাগবে (D-09); ঋণাত্মক প্রদেয় কখনো দাবি করা হয় না (D-19)। */
      const waived = waivePaisa > 0 ? waivePaisa : 0;
      const net = c.net + waived;
      if (net < 0) return { ok: false, err: 'সমিতির পাওনা ' + tk(Math.abs(net)) + ' বাকি — মওকুফ করতে কমিটির লিখিত সিদ্ধান্ত নম্বর দিন (D-09; নিরীক্ষককে অ্যালার্ট যাবে)।', clearance: c };
      if (waived && !decisionNo) return { ok: false, err: 'মওকুফ ' + tk(waived) + ' — কমিটির সিদ্ধান্ত নম্বর ছাড়া মওকুফ লেখা যাবে না (D-09)।' };
      const pay = Math.max(0, net);
      const cert = 'CLC-2627-00' + (++A.counters.clc);
      if (pay > 0) ledger({ accId: accId, type: 'withdrawal', amount: pay, channel: 'cash_office', status: 'posted',
        by: 'সুমি রানী (হিসাবরক্ষক)', receipt: cert, note: 'চূড়ান্ত নিষ্পত্তি' });
      a.status = 'closed'; a.closedOn = '2026-10-30'; a.certificate = cert; a.hold = 0;
      a.voucher = cert; a.proof = 'স্বাক্ষর + OTP'; recalc(a.id);
      DUES.slice().forEach(d => { if (d.accId === accId) DUES.splice(DUES.indexOf(d), 1); });
      KPI.duesTotal = DUES_BASE + DUES.reduce((x, d) => x + (d.amount - d.paid), 0);
      const m = member(a.memberId);
      m.accounts = ACCOUNTS.filter(x => x.memberId === m.id && x.status !== 'closed').length;
      if (m.accounts === 0 && waivePaisa !== null) { /* সদস্যপদ আলাদা বিষয় — D-19 */ }
      notify('req', 'অ্যাকাউন্ট বন্ধ হয়েছে · সনদ ' + cert, 'চূড়ান্ত প্রদান ' + tk(pay) + (c.net < 0 ? ' (বকেয়া মওকুফ ' + tk(Math.abs(c.net)) + ', সিদ্ধান্ত ' + decisionNo + ')' : '') + '। রেকর্ড ৮ বছর সংরক্ষিত থাকবে।', '#m14');
      commit('অ্যাকাউন্ট বন্ধ ' + a.no + ' · চূড়ান্ত প্রদান ' + tk(pay) + ' · সনদ ' + cert + (c.net < 0 ? ' · মওকুফ ' + tk(Math.abs(c.net)) + ' (' + decisionNo + ') → AUDITOR-কে অ্যালার্ট' : '') + ' · আর্কাইভ ৮ বছর (D-30)');
      return { ok: true, certificate: cert, paid: pay, waived: c.net < 0 ? Math.abs(c.net) : 0 };
    },

    /* A-20/A-21 — বাকি সব যাচাই একসাথে নিষ্পত্তি (দিন সমাপ্তির আগে দরকার) */
    clearPendingQueue: function () {
      let n = 0;
      PENDING_DEPOSITS.slice().forEach(p => { const r = act.approveDeposit(p.id); if (r.ok) n++; });
      const st = TX.filter(t => t.status === 'pending');
      st.forEach(t => { t.status = 'posted'; t.appr = 'সুমি রানী → মোঃ আব্দুল্লাহ'; recalc(t.accId); });
      A.suspense.slice().forEach(sp => { sp.status = 'resolved'; });
      A.suspense = [];
      KPI.pendingDeposits = PENDING_DEPOSITS.length;
      commit('ঝুলন্ত যাচাই কিউ পরিষ্কার · ' + bn(n) + 'টি জমা Posted · ' + bn(st.length) + 'টি লেজার এন্ট্রি নিশ্চিত · suspense নিষ্পত্তি');
      return { ok: true, approved: n, ledger: st.length, left: PENDING_DEPOSITS.length + TX.filter(t => t.status === 'pending').length };
    },

    /* ---------- day close (D-17) ---------- */
    dayClose: function () {
      const pend = PENDING_DEPOSITS.length + TX.filter(t => t.status === 'pending').length;
      if (pend) return { ok: false, err: bn(pend) + 'টি যাচাই বাকি — দিন সমাপ্তির আগে নিষ্পত্তি করুন (মাস বন্ধের জন্য বাধ্যতামূলক)।' };
      A.dayClose = { date: '2026-10-30', done: true };
      KPI.dayClose = true;
      KPI.alerts = KPI.alerts.filter(x => x.t !== 'দিন সমাপ্তি বাকি');
      commit('দিন সমাপ্তি সম্পন্ন · ৩০ অক্টোবর ২০২৬ · ক্যাশ বুক বন্ধ · ডেবিট = ক্রেডিট মিলে গেছে ✓');
      return { ok: true, date: A.dayClose.date };
    },

    /* ---------- সেশন / ভূমিকা বদল ---------- */
    /* ============================================================
       সহায়ক অ্যাকশন — ফ্লোর সিদ্ধান্ত বিন্দু ও সাব-স্টেপ
       ============================================================ */
    /* Flow 1 · ধাপ 5 — স্কিম বাছাই + অ্যাকাউন্ট খোলা (Opened; প্রথম জমার পর Active) */
    proposeAccount: function (memberId, schemeId, firstPaisa) {
      const m = member(memberId), sc = scheme(schemeId);
      if (!m) return { ok: false, err: 'সদস্য খুঁজে পাওয়া যায়নি।' };
      if (!sc) return { ok: false, err: 'স্কিম খুঁজে পাওয়া যায়নি।' };
      if (!sc.enrollable) return { ok: false, err: sc.name + ' বর্তমানে নামভর্তির জন্য বন্ধ (' + SCH_STATUS[sc.status].t + ')।' };
      if (m.status !== 'pending' && m.status !== 'proposed' && m.status !== 'active')
        return { ok: false, err: 'এই সদস্যের অবস্থা "' + (MEM_STATUS[m.status] || {}).t + '" — নতুন অ্যাকাউন্ট খোলা যাবে না।' };
      if (ACCOUNTS.some(a => a.memberId === memberId && a.schemeId === schemeId && a.status !== 'closed'))
        return { ok: false, err: m.name + '-এর এই স্কিমে ইতিমধ্যে একটি সক্রিয় অ্যাকাউন্ট আছে (এক সদস্য = এক স্কিমে একটি অ্যাকাউন্ট)।' };
      const no = m.no !== '—' ? m.no : ORG.code + '-2627-0' + bn(216 + A.rev);
      const a = { id: 'aNew' + (A.rev + 1), memberId: memberId, schemeId: schemeId,
        no: no + '-' + (sc.type === 'daily' ? 'DS' : sc.type === 'term' ? 'TS' : 'MS'),
        opened: '2026-10-30', posted: 0, pending: 0, hold: 0, totalIn: 0, totalOut: 0,
        status: 'opened', _open: 0, day: sc.type === 'monthly' ? 10 : null,
        lastInstallment: 0, paidInstallments: 0, missed: 0,
        nextDue: sc.type === 'monthly' ? '2026-11-10' : null,
        lockInEnds: sc.lockIn ? new Date(2026, 9 + sc.lockIn, 30).toISOString().slice(0, 10) : undefined };
      ACCOUNTS.push(a);
      m.status = 'proposed'; m.accounts = ACCOUNTS.filter(x => x.memberId === memberId).length;
      if (firstPaisa) { a.firstPlan = firstPaisa; }
      commit('অ্যাকাউন্ট খোলা হয়েছে · ' + a.no + ' · ' + sc.name + ' · Opened · সময়সূচি তৈরি' + (sc.lockIn ? ' · লক-ইন শেষ ' + dstr(a.lockInEnds) : ''));
      return { ok: true, accId: a.id, accNo: a.no, scheme: sc.name, lockInEnds: a.lockInEnds || null };
    },

    /* Flow 3B · সিদ্ধান্ত বিন্দু — ভুল রেফারেন্সে টাকা এলে suspense (H10) */
    suspenseDeposit: function (paisa, ref) {
      const rec = next('receipt', 4, 'RCP-2627-');
      const sp = { id: 'SP' + (A.suspense.length + 1), receipt: rec, amount: paisa, ref: ref || '—',
        at: now(), ch: 'bkash', status: 'unmatched', reason: 'রেফারেন্সে কোনো অ্যাকাউন্ট নম্বর মেলেনি' };
      A.suspense.unshift(sp);
      KPI.cash += 0; /* টাকা ওয়ালেটে আছে, সদস্যের ব্যালেন্সে নয় */
      notify('warn', 'টাকা এসেছে কিন্তু মিলছে না', tk(paisa) + ' (' + (ref || '—') + ') — সদস্য শনাক্ত হয়নি। টাকা suspense খাতে রাখা হয়েছে, ফেরত দেওয়া হয়নি। তদন্ত: A-30।', '#a30');
      commit('Suspense এন্ট্রি · ' + tk(paisa) + ' · রেফ ' + (ref || '—') + ' · সদস্য শনাক্ত হয়নি (H10)');
      return { ok: true, sp: sp.id, receipt: rec, count: A.suspense.length };
    },

    /* Flow 7 · ধাপ ২ — reconciliation ব্যতিক্রম নিষ্পত্তি (A-30) */
    resolveVariance: function (i, how) {
      const v = VDIFF[i];
      if (!v) return { ok: false, err: 'সারিটি খুঁজে পাওয়া যায়নি।' };
      if (v.resolved) return { ok: false, err: 'এই ব্যতিক্রম আগেই নিষ্পত্তি হয়েছে।' };
      v.resolved = true; v.how = how || 'ম্যানেজার যাচাই করে মিলিয়ে দিয়েছেন'; v.resolvedAt = '2026-10-30';
      KPI.variance = VDIFF.filter(x => !x.resolved).length;
      notify('checkc', 'ব্যতিক্রম নিষ্পত্তি হয়েছে', v.f + ' · ' + v.how, '#a30');
      commit('Reconciliation ব্যতিক্রম নিষ্পত্তি · ' + v.f + ' · ' + (v.old || '—') + ' → ' + (v.neu || '—') + ' · ' + v.how);
      return { ok: true, left: KPI.variance === undefined ? VDIFF.filter(x => !x.resolved).length : KPI.variance };
    },

    /* Flow 5 · 7c — সদস্য নিজেই আবেদন তুলে নিলে hold ছাড়ে */
    selfWithdraw: function (wdId) {
      const w = WITHDRAWALS.find(x => x.id === wdId);
      if (!w) return { ok: false, err: 'আবেদনটি খুঁজে পাওয়া যায়নি।' };
      if (['settled', 'cancelled', 'rejected'].indexOf(w.status) >= 0)
        return { ok: false, err: 'এই আবেদন ইতিমধ্যে ' + (WD_STATUS[w.status] || {}).t + '।' };
      const a = acc(w.accId);
      a.hold = Math.max(0, a.hold - w.amount);
      w.status = 'withdrawn'; w.withdrawnAt = '2026-10-30';
      notify('req', 'আপনি আবেদন তুলে নিয়েছেন', tk(w.amount) + '-এর আবেদন বাতিল · আটক ছেড়ে দেওয়া হয়েছে · এখন ব্যবহারযোগ্য ' + tk(balanceBreakdown(a).avail) + '।', '#m12');
      commit('সদস্য নিজে আবেদন তুলে নিলেন · ' + w.no + ' · hold ' + tk(w.amount) + ' ছাড়া হয়েছে');
      return { ok: true, no: w.no, avail: balanceBreakdown(a).avail };
    },

    /* Flow 6 · ধাপ ৩ — রিমাইন্ডার (A-33 টেমপ্লেট, dry-run সহ) */
    sendReminders: function (dry) {
      const list = DUES.concat([]);
      /* D-07: ৭ দিন গ্রেস; রিমাইন্ডার ৩ দিন আগে থেকে যায় */
      const soon = list.filter(d => d.paid < d.amount);
      const txt = 'সমিতিতে আপনার ' + bn(list.length) + 'টি কিস্তি বাকি। আজ পরিশোধ করুন — বিলম্ব ফি ৳২০/কিস্তি (সুদ নয়)।';
      if (dry) { commit('রিমাইন্ডার dry-run · ' + bn(soon.length) + ' জনকে যাবে · নমুনা: "' + txt + '" · পাঠানো হয়নি'); return { ok: true, dry: true, count: soon.length, sample: txt }; }
      KPI.reminders = (KPI.reminders || 0) + soon.length;
      notify('send', 'রিমাইন্ডার পাঠানো হয়েছে', bn(soon.length) + ' জন সদস্যকে SMS + পুশ গেছে · ডেলিভারি লগ A-33-এ', '#a33');
      commit('রিমাইন্ডার ক্যাম্পেইন · ' + bn(soon.length) + ' জন · SMS + পুশ · বিলম্ব ফি উল্লেখ আছে, সুদ নেই (BR-13)');
      return { ok: true, dry: false, count: soon.length, sample: txt, sent: soon.length, failed: 0 };
    },

    /* Flow 4 · ধাপ ৮ — দৈনিক integrity পুনর্গণনা (R-08) */
    integrityCheck: function () {
      const before = ACCOUNTS.map(a => ({ id: a.id, v: a.posted }));
      recalcAll();
      const diff = before.filter(b => acc(b.id).posted !== b.v);
      const trialOk = TRIAL.debit === TRIAL.credit;
      const sums = TX.filter(t => t.status === 'posted').reduce((o, t) => { o[t.type === 'deposit' ? 'in' : 'out'] += t.amount; return o; }, { in: 0, out: 0 });
      if (diff.length || !trialOk) notify('warn', 'ইন্টিগ্রিটি অ্যালার্ট', (diff.length ? bn(diff.length) + 'টি অ্যাকাউন্টের ব্যালেন্স মিলেনি। ' : '') + (trialOk ? '' : 'ট্রায়াল ব্যালান্স শূন্য নয়।') + ' A-01-এ লাল ব্যাজ দেখানো হয়েছে।', '#a01');
      commit('দৈনিক integrity পুনর্গণনা (R-08) · ' + bn(ACCOUNTS.length) + 'টি অ্যাকাউন্ট · ' + (diff.length ? bn(diff.length) + 'টি অমিল ⚠️' : 'সব ব্যালেন্স লেজারের সাথে মিলেছে ✓') + ' · ট্রায়াল ' + (trialOk ? 'শূন্য ✓' : 'অমিল ⚠️'));
      return { ok: true, accounts: ACCOUNTS.length, mismatches: diff.length, trialOk: trialOk, in: sums.in, out: sums.out };
    },

    /* Flow 8 · ভ্যারিয়েন্ট — মৃত্যু দাবি (নমিনি যাচাই) */
    deathClaim: function (accId) {
      const a = acc(accId), m = member(a.memberId);
      if (!m.nominee) return { ok: false, err: m.name + '-এর কোনো নমিনি নিবন্ধিত নেই — আদালত/সমিতির সিদ্ধান্ত ছাড়া নিষ্পত্তি হবে না।' };
      a.status = 'closed'; m.status = 'deceased'; a.posted = 0; a._open = 0;
      ledger({ accId: accId, type: 'withdrawal', amount: 0, channel: 'cash_office', status: 'posted',
        by: 'কাজী নুরুন্নবী (APPROVER)', note: 'মৃত্যু দাবি নিষ্পত্তি — নমিনি ' + m.nominee + '-কে হস্তান্তর' });
      notify('heart', 'মৃত্যু দাবি নিষ্পত্তি হয়েছে', m.name + '-এর সঞ্চয় নমিনি ' + m.nominee + '-কে দেওয়া হয়েছে · প্রমাণপত্র সংযুক্ত', '#a14');
      commit('মৃত্যু দাবি নিষ্পত্তি · ' + m.name + ' → নমিনি ' + m.nominee + ' · অ্যাকাউন্ট Closed · সদস্য Deceased');
      return { ok: true, member: m.name, nominee: m.nominee };
    },

    setRole: function (role, name) { A.session.role = role; if (name) A.session.as = name; commit('ভূমিকা বদলানো হয়েছে → ' + role); return { ok: true }; },
    reset: function () { window.location.href = window.location.pathname; return { ok: true }; },
  };

  /* page-level convenience — flows.html নিজের ধাপে এগুলো ব্যবহার করে */
  window.say = notify;
  window.note = commit;
  window.log = A.log;
})();
