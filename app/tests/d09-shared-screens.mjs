/* ============================================================
   tests/d09-shared-screens.mjs — ব্যাচ ২ · শেয়ার্ড/ক্রস-কাটিং পর্দা (S-01…S-08)
   ১) ৮টি ফাইল ও ৮টি রুট main.tsx-এ নিবন্ধিত
   ২) প্রতিটি পর্দা sessionStore ব্যবহার করে; কোনো মৃত বোতাম নেই
   ৩) ফর্ম-বৈধতা, কনফার্মেশন ও পলিসি কপি (D-01 / ব্র্যান্ড)
   ৪) ডিজাইন শৃঙ্খলা: hex নেই, ৳ অঙ্ক bn(), tap ≥ 48px
   ৫) রেন্ডার-স্মোকে ১০টি শেয়ার্ড রুট সত্যিই রেন্ডার হয়
   ============================================================ */

import { createSuite } from './_harness.mjs';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const S = createSuite('D-09 · শেয়ার্ড ও ক্রস-কাটিং পর্দা');
const read = (p) => (existsSync(join(ROOT, p)) ? readFileSync(join(ROOT, p), 'utf8') : '');

const MAIN = read('src/main.tsx');
const SESSION = read('src/store/sessionStore.tsx');
const DIR = 'src/apps/shared/screens';
const FILES = readdirSync(join(ROOT, DIR)).filter((f) => f.endsWith('.tsx'));
const txt = (f) => read(`${DIR}/${f}`);

const SCREENS = {
  'Login.tsx': ['/login'],
  'OrgSwitcher.tsx': ['/organizations'],
  'AccountSettings.tsx': ['/account'],
  'NotificationPrefs.tsx': ['/account/notifications'],
  'Forbidden.tsx': ['/403'],
  'ErrorStates.tsx': ['/error'],
  'ReceiptVerify.tsx': ['/verify'],
  'OfflineSync.tsx': ['/sync'],
};

S.sec('১ · ফাইল ও রুট নিবন্ধন');
{
  S.eq('শেয়ার্ড পর্দার সংখ্যা ৮', FILES.length, 8);
  const missingImport = Object.keys(SCREENS).filter((f) => {
    const comp = f.replace('.tsx', '');
    return !new RegExp(`import ${comp} from './apps/shared/screens/${comp}'`).test(MAIN);
  });
  S.check('main.tsx-এ ৮টি import আছে', missingImport.length === 0, missingImport.join(', '));

  const missingRoute = Object.values(SCREENS).flat().filter((p) => !MAIN.includes(`path="${p}"`));
  S.check('main.tsx-এ ৮টি রুট আছে', missingRoute.length === 0, missingRoute.join(', '));

  const noDefault = FILES.filter((f) => !/export default function/.test(txt(f)));
  S.check('প্রতিটি পর্দা default export করে', noDefault.length === 0, noDefault.join(', '));

  S.check('SessionProvider সর্বোচ্চ স্তরে (সব রুট মোড়া)', /<SessionProvider>[\s\S]*<BrowserRouter>|<BrowserRouter>[\s\S]*<SessionProvider>/.test(MAIN));
  S.check('sessionStore আসল অ্যাকশন দেয়', ['sendOtp', 'verifyOtp', 'switchOrg', 'updatePrefs', 'syncAll', 'retryItem'].every((k) => SESSION.includes(k)));
}

S.sec('২ · স্টোর ব্যবহার ও কোনো মৃত বোতাম নেই');
{
  const noStore = FILES.filter((f) => !/useSession\(\)/.test(txt(f)));
  S.check('প্রতিটি পর্দা sessionStore ব্যবহার করে', noStore.length === 0, noStore.join(', '));

  // ব্যতিক্রম: সাবমিট-ভিত্তিক ফর্ম ছাড়া প্রতিটি <button>-এ onClick থাকতে হবে
  const dead = [];
  for (const f of FILES) {
    const src = txt(f);
    for (const m of src.matchAll(/<button\b[^>]*>/gs)) {
      if (!/onClick=/.test(m[0]) && !/type="submit"/.test(m[0])) dead.push(`${f}: ${m[0].slice(0, 60).replace(/\n/g, ' ')}`);
    }
  }
  S.check('কোনো মৃত <button> নেই', dead.length === 0, dead.slice(0, 6).join(' | '));

  const hardNav = FILES.filter((f) => /window\.location\.(href|assign)/.test(txt(f)));
  S.check('window.location নয় — router navigate', hardNav.length === 0, hardNav.join(', '));

  const noNav = FILES.filter((f) => f !== 'ErrorStates.tsx' && !/navigate\(/.test(txt(f)));
  S.check('প্রতিটি পর্দা সত্যিকারের নেভিগেশন করে', noNav.length === 0, noNav.join(', '));
}

S.sec('৩ · ফর্ম-বৈধতা, কনফার্মেশন ও পলিসি কপি');
{
  const login = txt('Login.tsx');
  S.check('লগইনে ১১-ডিজিট ফোন বৈধতা', /\^01\\d/.test(login));
  S.check('লগইনে সম্মতি চেকবক্স বাধ্যতামূলক', /agree/.test(login) && /disabled=\{!agree|!agree/.test(login));
  S.check('লগইনে OTP + PIN দুই পদ্ধতি', /otp/i.test(login) && /pin/i.test(login));
  S.check('লগইনে ডেমো কোড স্পষ্টভাবে লেবেল করা', /ডেমো/.test(login));

  const org = txt('OrgSwitcher.tsx');
  S.check('সংগঠন বদল আসল অ্যাকশন ডাকে', /switchOrg\(/.test(org));
  S.check('ভুল আমন্ত্রণ কোড → ত্রুটি বার্তা', /sendInvite\(/.test(org) && /setError\(/.test(org));

  const acc = txt('AccountSettings.tsx');
  S.check('অ্যাকাউন্টে নাম/ইমেইল বৈধতা', /errors\.name|e\.name/.test(acc) && /test\(email\)/.test(acc));
  S.check('অ্যাকাউন্টে লগআউট কনফার্মেশন', /confirmOut/.test(acc) && /হ্যাঁ, লগআউট/.test(acc));
  S.check('অ্যাকাউন্ট থেকে Sync-এ যাওয়া যায়', /\/sync/.test(acc) || /sync/i.test(acc));

  const prefs = txt('NotificationPrefs.tsx');
  S.check('নোটিফিকেশন পছন্দ updatePrefs ডাকে', /updatePrefs\(/.test(prefs));
  S.check('ডাইজেস্ট সময় বাছাই আছে', /digest/.test(prefs));

  const forbidden = txt('Forbidden.tsx');
  S.check('403-এ অনুমতি-অনুরোধ প্রবাহ', /sent|request/i.test(forbidden));
  S.check('403-এ খসড়া সংরক্ষণ', /draft/i.test(forbidden));

  const errors = txt('ErrorStates.tsx');
  S.check('ত্রুটি পর্দায় offline/404/500 তিন অবস্থা', ['offline', '404', '500'].every((k) => errors.includes(k)));
  S.check('ত্রুটি পর্দায় আবার চেষ্টা', /setTried/.test(errors));

  const verify = txt('ReceiptVerify.tsx');
  S.check('রসিদ যাচাইয়ে সফল/অনুপস্থিত অবস্থা', /'ok'/.test(verify) && /'notfound'/.test(verify));
  S.check('বারবার ভুল কোডে লক', /'locked'|লক/.test(verify));
  S.check('যাচাইয়ে ভুয়া ডেটা নেই — ডেমো লেবেল', /ডেমো/.test(verify));

  const sync = txt('OfflineSync.tsx');
  S.check('অফলাইন সারিতে retryItem/clearFailed/syncAll', ['retryItem(', 'clearFailed(', 'syncAll('].every((k) => sync.includes(k)));
  S.check('সর্বশেষ sync সময় bn() দিয়ে', /lastSync/.test(sync) && /bn\(/.test(sync));
}

S.sec('৪ · ডিজাইন শৃঙ্খলা');
{
  const hex = FILES.filter((f) => /#[0-9a-fA-F]{3,8}\b/.test(txt(f)));
  S.check('কোনো raw hex রং নেই', hex.length === 0, hex.join(', '));

  const rupee = FILES.filter((f) => /₹/.test(txt(f)));
  S.check('₹ নয় — ৳ ব্যবহার', rupee.length === 0, rupee.join(', '));

  const bad = FILES.filter((f) => /profit_percentage/.test(txt(f)));
  S.check('কোনো profit_percentage নেই', bad.length === 0, bad.join(', '));

  const tap = FILES.filter((f) => /<button/.test(txt(f)) && !/min-h-tap/.test(txt(f)));
  S.check('সব raw বোতামে ৪৮px ট্যাপ টার্গেট', tap.length === 0, tap.join(', '));

  const lazy = FILES.filter((f) => /Coming soon|শীঘ্রই আসছে|TODO/.test(txt(f)));
  S.check('কোনো "শীঘ্রই আসছে" প্লেসহোল্ডার নেই', lazy.length === 0, lazy.join(', '));
}

S.sec('৫ · রেন্ডার স্মোক');
{
  const smoke = read('tools/smoke-entry.js');
  const sharedEntries = ['/login', '/organizations', '/account', '/account/notifications', '/403', '/error?type=offline', '/error?type=404', '/error?type=500', '/verify', '/sync'];
  const missing = sharedEntries.filter((p) => !smoke.includes(p));
  S.check('স্মোক-এ ১০টি শেয়ার্ড রুট তালিকাভুক্ত', missing.length === 0, missing.join(', '));

  const r = spawnSync(process.execPath, ['tools/render-smoke.mjs'], { cwd: ROOT, encoding: 'utf8', timeout: 180000 });
  const out = (r.stdout || '') + (r.stderr || '');
  const sharedLines = out.split('\n').filter((l) => /^(PASS|FAIL) \/(login|organizations|account|403|error|verify|sync)/.test(l));
  const sharedFail = sharedLines.filter((l) => l.startsWith('FAIL'));
  S.check('শেয়ার্ড ১০ রুট সফলভাবে রেন্ডার হয়', r.status === 0 && sharedLines.length >= 10 && sharedFail.length === 0, sharedFail.join(' | '));
  const total = Number((out.match(/^PASS /gm) || []).length);
  S.check('স্মোকে মোট ≥ ৫১ রুট সবুজ', r.status === 0 && total >= 51, `পেয়েছি ${total}`);
}

S.report();
