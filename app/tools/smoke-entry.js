import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import MemberApp from '../src/apps/member/MemberApp';
import { MemberProvider } from '../src/store/memberStore';

const ROUTES = [
  ['/m/home', 'সঞ্চয় হোম'], ['/m/schemes', 'স্কিম তালিকা'], ['/m/schemes/gs-1', 'স্কিমের বিবরণ'],
  ['/m/savings', 'আমার সঞ্চয়'], ['/m/savings/acc-1', 'অ্যাকাউন্ট বিবরণ'],
  ['/m/deposit', 'জমা দিন'], ['/m/deposit/receipt/dep-1', 'জমার রসিদ'],
  ['/m/txn', 'লেনদেন'], ['/m/txn/dep-1', 'লেনদেন বিবরণ'], ['/m/txn/wd-1', 'লেনদেন বিবরণ'],
  ['/m/dues', 'বকেয়া কিস্তি'], ['/m/withdrawals', 'আমার উত্তোলন'], ['/m/withdrawals/new', 'উত্তোলনের আবেদন'],
  ['/m/withdrawals/wd-1', 'উত্তোলন বিবরণ'], ['/m/statement', 'স্টেটমেন্ট'], ['/m/nominees', 'নমিনি'],
  ['/m/notifications', 'নোটিফিকেশন'], ['/m/notices', 'নোটিশ বোর্ড'], ['/m/profile', 'প্রোফাইল ও KYC'],
  ['/m/settings', 'সেটিংস'], ['/m/help', 'সহায়তা কেন্দ্র'], ['/m/close-request', 'সদস্যপদ বন্ধ'], ['/m/more', 'আরও'],
];

let fail = 0;
for (const [route, title] of ROUTES) {
  try {
    const html = renderToStaticMarkup(
      React.createElement(MemoryRouter, { initialEntries: [route] },
        React.createElement(MemberProvider, null,
          React.createElement(Routes, null,
            React.createElement(Route, { path: '/m/*', element: React.createElement(MemberApp) })))),
    );
    const ok = html.length > 1500 && /<h[1-3]/.test(html) && html.includes(title);
    console.log(`${ok ? 'PASS' : 'FAIL'} ${route} — ${html.length} bytes`);
    if (!ok) fail++;
  } catch (e) {
    console.log(`FAIL ${route} — ${e.message}`);
    fail++;
  }
}
console.log(fail === 0 ? 'ALL_ROUTES_RENDER' : `${fail} failures`);
process.exit(fail === 0 ? 0 : 1);
