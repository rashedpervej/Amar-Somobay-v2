import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import MemberApp from '../src/apps/member/MemberApp';
import { MemberProvider } from '../src/store/memberStore';
import { ModuleProvider } from '../src/store/moduleStore';
import { SessionProvider } from '../src/store/sessionStore';
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
