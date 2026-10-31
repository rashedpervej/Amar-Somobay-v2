import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import MemberApp from '../src/apps/member/MemberApp';
import { MemberProvider } from '../src/store/memberStore';
import { ModuleProvider } from '../src/store/moduleStore';
import { SessionProvider } from '../src/store/sessionStore';
import { AdminProvider } from '../src/store/adminStore';
import { AdminRoscaProvider } from '../src/store/adminRoscaStore';
import { AdminJointProvider } from '../src/store/adminJointStore';
import { AdminQardProvider } from '../src/store/adminQardStore';
import AdminMobileApp from '../src/apps/admin/AdminMobileApp';
import AdminWebApp from '../src/apps/admin/AdminWebApp';
import Login from '../src/apps/shared/screens/Login';
import OrgSwitcher from '../src/apps/shared/screens/OrgSwitcher';
import AccountSettings from '../src/apps/shared/screens/AccountSettings';
import NotificationPrefs from '../src/apps/shared/screens/NotificationPrefs';
import Forbidden from '../src/apps/shared/screens/Forbidden';
import ErrorStates from '../src/apps/shared/screens/ErrorStates';
import ReceiptVerify from '../src/apps/shared/screens/ReceiptVerify';
import OfflineSync from '../src/apps/shared/screens/OfflineSync';

const MEMBER_ROUTES = [
  ['/m/home', 'সঞ্চয় হোম'], ['/m/schemes', 'স্কিম তালিকা'], ['/m/schemes/gs-1', 'স্কিমের বিবরণ'],
  ['/m/savings', 'আমার সঞ্চয়'], ['/m/savings/acc-1', 'অ্যাকাউন্ট বিবরণ'],
  ['/m/deposit', 'জমা দিন'], ['/m/deposit/receipt/dep-1', 'জমার রসিদ'],
  ['/m/txn', 'লেনদেন'], ['/m/txn/dep-1', 'লেনদেন বিবরণ'], ['/m/txn/wd-1', 'লেনদেন বিবরণ'],
  ['/m/dues', 'বকেয়া কিস্তি'], ['/m/withdrawals', 'আমার উত্তোলন'], ['/m/withdrawals/new', 'উত্তোলনের আবেদন'],
  ['/m/withdrawals/wd-1', 'উত্তোলন বিবরণ'], ['/m/statement', 'স্টেটমেন্ট'], ['/m/nominees', 'নমিনি'],
  ['/m/notifications', 'নোটিফিকেশন'], ['/m/notices', 'নোটিশ বোর্ড'], ['/m/profile', 'প্রোফাইল ও KYC'],
  ['/m/settings', 'সেটিংস'], ['/m/help', 'সহায়তা কেন্দ্র'], ['/m/close-request', 'সদস্যপদ বন্ধ'], ['/m/more', 'আরও'],
  // ব্যাচ ৩ — ROSCA / যৌথ লক্ষ্য / কর্জে হাসানা
  ['/m/circles', 'আমার চক্র'], ['/m/circles/rc01', 'চক্র বিস্তারিত'], ['/m/circles/rc01/draws', 'ড্র ক্রম'],
  ['/m/circles/rc01/pay', 'কিস্তি পরিশোধ'], ['/m/circles/rc02/history', 'ড্র ইতিহাস'], ['/m/circles/rc02/receipt/dr-07-3', 'প্রাপ্তি ভাউচার'],
  ['/m/goals', 'আমাদের লক্ষ্য'], ['/m/goals/jg01', 'লক্ষ্য বিস্তারিত'], ['/m/goals/jg02/join', 'যোগদান'],
  ['/m/goals/jg01/contribute', 'অবদান দিন'], ['/m/goals/uses', 'অর্জন ও ব্যবহার'],
  ['/m/qard', 'কর্জে হাসানা'], ['/m/qard/eligibility', 'যোগ্যতা'], ['/m/qard/products', 'পণ্য ও শর্তাবলি'],
  ['/m/qard/apply', 'সহায়তার আবেদন'], ['/m/qard/applications', 'আবেদনের অবস্থা'],
  ['/m/qard/loans', 'আমার সহায়তা'], ['/m/qard/pay', 'কিস্তি পরিশোধ'], ['/m/qard/certificate/ql2', 'সমাপ্তি সনদ'],
];


const WEB_ROUTES = [
  ['/w/dashboard', 'সাধারণ সঞ্চয় ড্যাশবোর্ড'],
  ['/w/schemes', 'স্কিম তালিকা'], ['/w/schemes/new', 'নতুন স্কিম তৈরি'], ['/w/schemes/sc1', 'মাসিক সঞ্চয়'],
  ['/w/members', 'সদস্য তালিকা'], ['/w/members/new', 'নতুন সদস্য নিবন্ধন'], ['/w/members/m1', 'রহিমা বেগম'],
  ['/w/members/m1/exit', 'সদস্য প্রস্থান ও চূড়ান্ত নিষ্পত্তি'], ['/w/accounts/a1', 'SAV-001-01'],
  ['/w/applications/ap4', 'সদস্য আবেদন'], ['/w/deposits', 'জমা রেকর্ড'], ['/w/deposits/new', 'দ্রুত জমা এন্ট্রি'],
  ['/w/approvals/deposits', 'জমা অনুমোদন কিউ'], ['/w/approvals/withdrawals', 'উত্তোলন অনুমোদন কিউ'],
  ['/w/approvals/members', 'সদস্য নিবন্ধন আবেদন'], ['/w/approval/ap1', 'উত্তোলন সিদ্ধান্ত'],
  ['/w/payouts', 'নিষ্পত্তি ও পেমেন্ট'], ['/w/ledger', 'লেনদেন / সাধারণ খতিয়ান'], ['/w/dues', 'বকেয়া রেজিস্টার'],
  ['/w/collector', 'আজকের রুট (সংগ্রহক)'], ['/w/routes', 'সংগ্রহ পরিকল্পনা ও রুট'],
  ['/w/status', 'সদস্য অবস্থা পরিবর্তন'], ['/w/claims', 'নমিনি ও মৃত্যু দাবি'], ['/w/claims/cl1', 'নমিনি ও মৃত্যু দাবি'],
  ['/w/moves', 'সদস্য স্থানান্তর'], ['/w/bulk', 'বাল্ক জমা ও ইমপোর্ট'], ['/w/bulk/import', 'CSV ইমপোর্ট ও ম্যাপিং'],
  ['/w/txn', 'লেনদেন ও অডিট'], ['/w/txn/t1', 'লেনদেন ও অডিট'], ['/w/reversal', 'সংশোধন ও রিভার্সাল'],
  ['/w/cashbook', 'ক্যাশ বুক ও দিন সমাপ্তি'], ['/w/transfer', 'তহবিল স্থানান্তর'], ['/w/recon', 'রিকনসিলিয়েশন'],
  ['/w/reminders', 'রিমাইন্ডার শিডিউল'], ['/w/reports', 'রিপোর্ট কেন্দ্র'], ['/w/finance', 'আর্থিক বিবরণ ও রিটার্ন'],
  ['/w/settings', 'সেটিংস'], ['/w/staff', 'স্টাফ ও পারমিশন'], ['/w/audit', 'অডিট লগ'],
  ['/w/rc', 'ROSCA ড্যাশবোর্ড'], ['/w/rc/schemes', 'ROSCA স্কিম'], ['/w/rc/schemes/new', 'নতুন ROSCA স্কিম'],
  ['/w/rc/schemes/rc1', 'স্কিম সম্পাদনা'], ['/w/rc/circles', 'সক্রিয় সার্কেল'],
  ['/w/rc/circles/rc01', 'সার্কেল হাব'], ['/w/rc/circles/rc01/seats', 'সিট বরাদ্দ ও সদস্য নির্বাচন'],
  ['/w/rc/draws', 'ড্র ক্যালেন্ডার ও ক্রম'], ['/w/rc/draws/history', 'ড্র ইতিহাস ও রেজিস্টার'],
  ['/w/rc/draws/rc01-d6/run', 'সম্পাদন'], ['/w/rc/collect', 'কিস্তি সংগ্রহ ও বকেয়া'],
  ['/w/rc/defaults', 'ডিফল্ট ও প্রতিস্থাপন'], ['/w/rc/reports', 'ROSCA রিপোর্ট'],
  ['/w/jg', 'Joint Goal ড্যাশবোর্ড'], ['/w/jg/goals', 'লক্ষ্য তালিকা ও পরিকল্পনা সীমা'],
  ['/w/jg/goals/new', 'নতুন যৌথ লক্ষ্য'], ['/w/jg/goals/jg01', 'মসজিদ সংস্কার'],
  ['/w/jg/join', 'অংশগ্রহণ ব্যবস্থাপনা ও যোগদান অনুমোদন'], ['/w/jg/collect', 'অবদান সংগ্রহ ও বকেয়া'],
  ['/w/jg/milestones', 'মাইলস্টোন ও অগ্রগতি'], ['/w/jg/spend', 'অর্থ ব্যবহার ও বিতরণ'],
  ['/w/jg/close', 'মেয়াদোত্তীর্ণ ও নিষ্পত্তি'], ['/w/jg/reports', 'Joint Goal রিপোর্ট ও নিরীক্ষা'],
  ['/w/qh', 'QH ড্যাশবোর্ড'], ['/w/qh/products', 'সহায়তা পণ্য কনফিগারেশন'],
  ['/w/qh/rules', 'যোগ্যতা নিয়ম ব্যবস্থাপনা'], ['/w/qh/simulation', 'নিয়ম Simulation'],
  ['/w/qh/eligible', 'যোগ্য সদস্য তালিকা ব্যবস্থাপনা'], ['/w/qh/window', 'আবেদন জানালা ও কোটা নিয়ন্ত্রণ'],
  ['/w/qh/queue', 'আবেদন কিউ'], ['/w/qh/applications/qa04', 'আবেদনের সারসংক্ষেপ'],
  ['/w/qh/applications/qa04/decision', 'সিদ্ধান্ত · অনুমোদন'], ['/w/qh/disburse', 'বিতরণ ব্যবস্থাপনা'],
  ['/w/qh/disburse/qh05', 'OTP যাচাই'], ['/w/qh/loans', 'ঋণ, ছক ও পরিশোধ'],
  ['/w/qh/loans/qh03', 'ঋণ হাব'], ['/w/qh/loans/qh03/repay', 'পরিশোধ এন্ট্রি ও রসিদ'],
  ['/w/qh/loans/qh03/close', 'সমাপ্তি ও সনদ'], ['/w/qh/arrears', 'বকেয়া ও ডিফল্ট ব্যবস্থাপনা'],
  ['/w/qh/writeoff', 'Write-off ব্যবস্থাপনা'], ['/w/qh/reports', 'কর্জে হাসানা রিপোর্ট'],
];

const ADMIN_ROUTES = [
  ['/a/home', 'সমিতির অবস্থা'], ['/a/approvals', 'অনুমোদন কিউ'], ['/a/approvals/ap1', 'অনুমোদনের সিদ্ধান্ত'],
  ['/a/members', 'সদস্য খুঁজুন'], ['/a/members/new', 'নতুন সদস্য নিবন্ধন'], ['/a/members/m1', 'মোট সঞ্চয়'],
  ['/a/members/m1/edit', 'সদস্য সম্পাদনা'], ['/a/members/m1/status', 'অবস্থা পরিবর্তন'],
  ['/a/members/m1/close', 'প্রস্থান ও নিষ্পত্তি'], ['/a/entry', 'জমা এন্ট্রি'],
  ['/a/accounts/a1', 'জমা হয়েছে (posted)'], ['/a/txn/t1', 'Who · When · Where'],
  ['/a/reversal', 'সংশোধন ও রিভার্সাল'], ['/a/cashbook', 'দিনশেষ ক্যাশ বুক'],
  ['/a/payouts', 'নিষ্পত্তি ও পেমেন্ট'], ['/a/ledger', 'সাধারণ লেজার'],
  ['/a/claims', 'মৃত্যু দাবি নিষ্পত্তি'], ['/a/transfer', 'তহবিল স্থানান্তর'], ['/a/dues', 'বকেয়া রেজিস্টার'],
  ['/a/recon', 'রিকনসিলিয়েশন'], ['/a/batch', 'বাল্ক জমা এন্ট্রি'], ['/a/import', 'CSV / Excel ইমপোর্ট'],
  ['/a/finance', 'আর্থিক বিবরণ'], ['/a/reports', 'রিপোর্ট কেন্দ্র'], ['/a/schemes', 'স্কিম তালিকা'],
  ['/a/schemes/sc1', 'স্কিম বিবরণ'], ['/a/schemes/new', 'নতুন স্কিম তৈরি'], ['/a/schemes/sc1/edit', 'স্কিম সম্পাদনা'],
  ['/a/moves', 'সদস্য স্থানান্তর'], ['/a/routes', 'সংগ্রহ পরিকল্পনা'], ['/a/reminders', 'রিমাইন্ডার শিডিউল'],
  ['/a/settings', 'সেটিংস হাব'], ['/a/staff', 'স্টাফ ও পারমিশন'], ['/a/audit', 'অডিট লগ'], ['/a/more', 'সব বিভাগ'],
  // ব্যাচ ৬ — ROSCA (RAM-01…RAM-12)
  ['/a/rc', 'ROSCA তহবিলের দায় ব্যালেন্স'], ['/a/rc/circles', 'চক্র খুঁজুন'], ['/a/rc/new', 'নতুন চক্র'], ['/a/rc/schemes', 'চক্র স্কিম'], ['/a/rc/calendar', 'ড্র ক্যালেন্ডার'],
  ['/a/rc/circles/rc01', 'চক্রের তথ্য'], ['/a/rc/circles/rc01/seats', 'সিট বরাদ্দ'], ['/a/rc/circles/rc01/draw', 'পুল গণনা'],
  ['/a/rc/circles/rc01/pool', 'ঘাটতির সিদ্ধান্ত'], ['/a/rc/draws/rc01-d1', 'যাচাই'], ['/a/rc/register', 'ড্র রেজিস্টার'],
  ['/a/rc/collect', 'বকেয়া তালিকা'], ['/a/rc/defaults', 'প্রতিকারের ল্যাডার'], ['/a/rc/reports', 'চক্রভিত্তিক সারাংশ'],
  // ব্যাচ ৬ — যৌথ লক্ষ্য (JAM-01…JAM-10)
  ['/a/jg', 'মোট নির্দিষ্ট লক্ষ্য তহবিল'], ['/a/jg/goals', 'লক্ষ্য খুঁজুন'], ['/a/jg/new', 'মৌলিক তথ্য'],
  ['/a/jg/goals/jg01', 'মাইলস্টোন'], ['/a/jg/goals/jg01/parts', 'প্রতিশ্রুতি'],
  ['/a/jg/goals/jg01/milestones', 'অবদানের ধারা'], ['/a/jg/goals/jg02/disbursements', 'বিতরণ ভাউচার'],
  ['/a/jg/goals/jg03/settle', 'নিষ্পত্তির ধাপ'], ['/a/jg/arrears', 'অবদান রেকর্ড'], ['/a/jg/reports', 'মাধ্যমভিত্তিক সংগ্রহ'],
  // ব্যাচ ৭ — কর্জে হাসানা (QAM-01…QAM-17)
  ['/a/qh', 'পুলে মুক্ত অঙ্ক'], ['/a/qh/products', 'পণ্যের নাম'], ['/a/qh/rules', 'নিয়মের ক্রম'],
  ['/a/qh/simulation', 'খসড়া নিয়মের মান'], ['/a/qh/eligible', 'জন মূল্যায়িত'], ['/a/qh/window', 'জানালার সময়সূচি'],
  ['/a/qh/applications', 'বিচারাধীন আবেদন'], ['/a/qh/applications/qa05', 'যোগ্যতা স্ন্যাপশট'],
  ['/a/qh/applications/qa05/decision', 'সিদ্ধান্তের বিকল্প'], ['/a/qh/disburse/qh05', 'বিতরণ-পূর্ব গেট'],
  ['/a/qh/loans', 'ঋণ তালিকা'], ['/a/qh/loans/qh03', 'কিস্তির গ্রিড'], ['/a/qh/loans/qh03/repay', 'কিস্তি বাছাই'],
  ['/a/qh/arrears', 'ধাপভিত্তিক প্রতিকার'], ['/a/qh/loans/qh01/close', 'সনদের নিয়ম'],
  ['/a/qh/writeoff', 'বিচারাধীন প্রস্তাব'], ['/a/qh/reports', 'শ্রেণিকরণ ও বয়স'],
];

const SHARED_ROUTES = [
  ['/login', Login, 'মোবাইল নম্বর দিয়ে প্রবেশ'],
  ['/organizations', OrgSwitcher, 'আমার সমিতিসমূহ'],
  ['/account', AccountSettings, 'প্রোফাইল ও সেটিংস'],
  ['/account/notifications', NotificationPrefs, 'নোটিফিকেশন পছন্দ'],
  ['/403', Forbidden, 'অনুমতি নেই'],
  ['/error?type=offline', ErrorStates, 'সিস্টেম বার্তা'],
  ['/error?type=404', ErrorStates, 'সিস্টেম বার্তা'],
  ['/error?type=500', ErrorStates, 'সিস্টেম বার্তা'],
  ['/verify', ReceiptVerify, 'রসিদ যাচাই'],
  ['/sync', OfflineSync, 'অফলাইন Sync'],
];

let fail = 0;

for (const [route, title] of MEMBER_ROUTES) {
  try {
    const html = renderToStaticMarkup(
      React.createElement(MemoryRouter, { initialEntries: [route] },
        React.createElement(MemberProvider, null,
          React.createElement(ModuleProvider, null,
            React.createElement(Routes, null,
              React.createElement(Route, { path: '/m/*', element: React.createElement(MemberApp) }))))),
    );
    const ok = html.length > 1200 && /<h[1-3]/.test(html) && html.includes(title);
    console.log(`${ok ? 'PASS' : 'FAIL'} ${route} — ${html.length} bytes`);
    if (!ok) fail++;
  } catch (e) {
    console.log(`FAIL ${route} — ${e.message}`);
    fail++;
  }
}

for (const [route, title] of ADMIN_ROUTES) {
  try {
    const html = renderToStaticMarkup(
      React.createElement(MemoryRouter, { initialEntries: [route] },
        React.createElement(AdminProvider, null,
          React.createElement(AdminRoscaProvider, null,
            React.createElement(AdminJointProvider, null,
              React.createElement(AdminQardProvider, null,
                React.createElement(Routes, null,
                  React.createElement(Route, { path: '/a/*', element: React.createElement(AdminMobileApp) }))))))),
    );
    const ok = html.length > 1200 && html.includes(title);
    console.log(`${ok ? 'PASS' : 'FAIL'} ${route} — ${html.length} bytes`);
    if (!ok) fail++;
  } catch (e) {
    console.log(`FAIL ${route} — ${e.message}`);
    fail++;
  }
}


for (const [route, title] of WEB_ROUTES) {
  try {
    const html = renderToStaticMarkup(
      React.createElement(MemoryRouter, { initialEntries: [route] },
        React.createElement(AdminProvider, null,
          React.createElement(AdminRoscaProvider, null,
            React.createElement(AdminJointProvider, null,
              React.createElement(AdminQardProvider, null,
                React.createElement(Routes, null,
                  React.createElement(Route, { path: '/w/*', element: React.createElement(AdminWebApp) }))))))),
    );
    const ok = html.length > 1200 && html.includes(title);
    console.log(`${ok ? 'PASS' : 'FAIL'} ${route} — ${html.length} bytes`);
    if (!ok) fail++;
  } catch (e) {
    console.log(`FAIL ${route} — ${e.message}`);
    fail++;
  }
}

for (const [route, Component, title] of SHARED_ROUTES) {
  try {
    const html = renderToStaticMarkup(
      React.createElement(MemoryRouter, { initialEntries: [route] },
        React.createElement(SessionProvider, null,
          React.createElement(Routes, null,
            React.createElement(Route, { path: route.split('?')[0], element: React.createElement(Component) })))),
    );
    const ok = html.length > 900 && html.includes(title);
    console.log(`${ok ? 'PASS' : 'FAIL'} ${route} — ${html.length} bytes`);
    if (!ok) fail++;
  } catch (e) {
    console.log(`FAIL ${route} — ${e.message}`);
    fail++;
  }
}

console.log(fail === 0 ? 'ALL_ROUTES_RENDER' : `${fail} failures`);
process.exit(fail === 0 ? 0 : 1);
