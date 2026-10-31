import { loadPage, report } from './load.mjs';
const P = '/home/user/prototype/workspace.html';
const { w, d, warns, errs } = await loadPage(P);
const checks = [];
const ok = (c, m) => checks.push([!!c, m]);

/* ---- structure ---- */
ok(d.getElementById('sec-mob'), 'মোবাইল সেকশন (#sec-mob) আছে');
ok(d.getElementById('sec-web'), 'ডেস্কটপ সেকশন (#sec-web) আছে');
const mobStage0 = d.getElementById('mobStage'), webStage0 = d.getElementById('webStage');
ok(mobStage0 && webStage0 && mobStage0.querySelector('.phone') && webStage0.querySelector('.browser'),
   'মোবাইল ও ডেস্কটপ স্টেজ একসাথে স্বতন্ত্রভাবে রেন্ডার হয়েছে (কোনো ভিউ-টগল নেই)');

const mobRoles = d.querySelectorAll('#mobRoles .ws-role').length;
const webRoles = d.querySelectorAll('#webRoles .ws-role').length;
ok(mobRoles === 9, `মোবাইল ভূমিকা ট্যাব = ${mobRoles} (প্রত্যাশিত ৯)`);
ok(webRoles === 6, `ওয়েব ভূমিকা ট্যাব = ${webRoles} (প্রত্যাশিত ৬)`);

/* ---- initial render ---- */
const mobStage = d.getElementById('mobStage');
const webStage = d.getElementById('webStage');
ok(mobStage.querySelector('.phone'), 'মোবাইল স্টেজে ফোন ফ্রেম রেন্ডার হয়েছে');
ok(mobStage.querySelector('.bottomnav'), 'মোবাইল স্টেজে বটম নেভ আছে');
ok(mobStage.querySelectorAll('.bottomnav .bnv').length === 5, `মোবাইল বটম নেভ স্লট = ${mobStage.querySelectorAll('.bottomnav .bnv').length} (৫ হওয়ার কথা)`);
ok(!mobStage.querySelector('.drawer'), 'সদস্য ভূমিকায় অ্যাডমিন ড্রার নেই (MNAV অ্যাপ)');
ok(webStage.querySelector('.browser'), 'ওয়েব স্টেজে ব্রাউজার ফ্রেম আছে');
ok(webStage.querySelector('.sidebar'), 'ওয়েব স্টেজে সাইডবার আছে');
ok(webStage.querySelectorAll('.sidebar .sb-item').length === 49, `সাইডবার ANAV আইটেম = ${webStage.querySelectorAll('.sidebar .sb-item').length} (৪৯ — ROSCA, Joint Goal ও কর্জে হাসানা গ্রুপসহ)`);

/* member landing = M-01 */
ok(w.__X.WS.stages.mob.stack[0] === 'm01' && d.querySelector('#mobCrumb .ws-trail b.on').textContent === 'M-01',
   'মোবাইল ডিফল্ট ভূমিকা = সদস্য, ল্যান্ডিং = M-01');
ok(d.querySelectorAll('#mobList .ws-nav').length >= 5, `সদস্যের নেভ তালিকা = ${d.querySelectorAll('#mobList .ws-nav').length} আইটেম`);
ok(/a01|ওভারভিউ/.test(webStage.innerHTML) || d.getElementById('webStage').innerHTML.length > 2000, 'ওয়েব ডিফল্ট ল্যান্ডিং রেন্ডার হয়েছে');

/* ---- navigation works ---- */
const before = d.querySelector('#mobCrumb .ws-trail b.on').textContent;
w.wsgo('mob', '#m04');
const after = d.querySelector('#mobCrumb .ws-trail b.on').textContent;
ok(before !== after, `মোবাইল নেভিগেশন কাজ করছে (${before} → ${after})`);
ok(d.getElementById('mobStage').innerHTML.includes('id="m04"') || /M-04|আমার সঞ্চয়/.test(d.getElementById('mobInfo').innerHTML), 'টার্গেট স্ক্রিন স্টেজে এসেছে');
w.wsBack('mob');
ok(d.querySelector('#mobCrumb .ws-trail b.on').textContent === before, '← পেছনে কাজ করছে');
w.wsFwd('mob');
ok(d.querySelector('#mobCrumb .ws-trail b.on').textContent === after, 'সামনে → কাজ করছে');

/* ---- role switch changes shell ---- */
w.wsSetRole('mob', 'COLLECTOR');
ok(!!d.querySelector('#mobStage .drawer'), 'অ্যাডমিন ভূমিকায় হ্যামবার্গার ড্রয়ার আছে');
ok(!d.querySelector('#mobStage .phone.dr-open'), 'ড্রয়ার ডিফল্টে বন্ধ');
ok(d.querySelectorAll('#mobStage .drawer .drawer-i').length === 49, `ড্রয়ারে সম্পূর্ণ ANAV = ${d.querySelectorAll('#mobStage .drawer .drawer-i').length} আইটেম`);
let navTxt = [...d.querySelectorAll('#mobStage .bottomnav .bnv span')].map(x => x.textContent).join('|');
ok(/জমা এন্ট্রি|আজকের রুট|বকেয়া/.test(navTxt), `COLLECTOR শেলের নেভ: ${navTxt.slice(0, 60)}`);
ok(/রাজু আহমেদ/.test(d.getElementById('mobStage').innerHTML), 'ড্রয়ার ফুটারে সংগ্রহকের নাম (রাজু আহমেদ)');
w.wsSetRole('mob', 'ORG_ADMIN');
navTxt = [...d.querySelectorAll('#mobStage .bottomnav .bnv span')].map(x => x.textContent).join('|');
ok(/নিয়ন্ত্রণ|স্টাফ/.test(navTxt), `ORG_ADMIN শেলের নেভ: ${navTxt.slice(0, 60)}`);
ok(/কামরুল হাসান/.test(d.getElementById('mobStage').innerHTML), 'ORG_ADMIN পরিচয় (কামরুল হাসান)');
w.wsSetRole('mob', 'AUDITOR');
ok(d.getElementById('mobStage').innerHTML.includes('am24') || /নিরীক্ষক/.test(d.getElementById('mobStage').innerHTML), 'AUDITOR ল্যান্ডিং = AM-24');
ok(/শুধু পঠন/.test(d.getElementById('mobStage').innerHTML), 'নিরীক্ষক = শুধু পঠন চিহ্ন');

/* ---- cross-platform mapping (drawer → desktop id on mobile) ---- */
w.wsSetRole('mob', 'MANAGER');
const drawerTarget = [...d.querySelectorAll('#mobList .ws-nav')].find(b => /বকেয়া রেজিস্টার/.test(b.textContent));
ok(drawerTarget, 'ড্রয়ার তালিকায় বকেয়া রেজিস্টার আইটেম');
if (drawerTarget) {
  const onclick = drawerTarget.getAttribute('onclick') || '';
  ok(/#am12/.test(onclick), `ড্রয়ার আইটেম মোবাইল রূপে ম্যাপ হয়েছে (${onclick})`);
}

/* ---- web role switch changes sidebar identity ---- */
w.wsSetRole('web', 'W_COLLECTOR');
ok(/রাজু আহমেদ/.test(d.getElementById('webStage').innerHTML), 'ওয়েব COLLECTOR → সাইডবারে রাজু আহমেদ');
ok(/সংগ্রহ পরিকল্পনা|A-32/.test(d.getElementById('webStage').innerHTML), 'ওয়েব COLLECTOR ল্যান্ডিং = A-32 (ডেস্কটপ)');
/* মোবাইল-ভ্যারিয়েন্ট স্ক্রিন ডেস্কটপ স্টেজে ঢুকবে না — আলাদা প্ল্যাটফর্ম, টগল নয় */
const resA02 = w.wsResolve('web', '#a02');
ok(resA02 && resA02.mobOnly === 'a02', 'wsResolve: A-02 ডেস্কটপে mobOnly চিহ্নিত');
w.wsgo('web', '#a02');
const webToast = d.querySelector('#sec-web .ws-toast');
ok(!!webToast && /মোবাইল অ্যাপ স্ক্রিন/.test(webToast.textContent), 'ডেস্কটপে মোবাইল স্ক্রিন চাইলে সতর্ক বার্তা দেখায়');
ok(!!d.querySelector('#sec-web .ws-jumpbar button'), 'মোবাইল অ্যাপ ওয়ার্কস্পেসে খোলার বোতাম আছে');
ok(!d.getElementById('webStage').querySelector('.phone'), 'ডেস্কটপ স্টেজে ফোন ফ্রেম ঢোকেনি');
const map = w.wsResolve('mob', '#a20');
ok(map && map.id === 'am02', 'মোবাইলে ডেস্কটপ স্ক্রিন AM রূপে ম্যাপ হয় (A-20 → AM-02)');
ok(w.wsResolve('web', '#am02').id === 'a20', 'ওয়েবে মোবাইল স্ক্রিন ডেস্কটপ রূপে ম্যাপ হয় (AM-02 → A-20)');
ok(w.wsResolve('mob', '#zz99').missing === 'zz99', 'অস্তিত্বহীন স্ক্রিনে missing রিপোর্ট');
w.wsSetRole('web', 'W_COLLECTOR');
w.wsSetRole('web', 'W_AUDITOR');
ok(/ফারুক|শুধু পঠন/.test(d.getElementById('webStage').innerHTML), 'ওয়েব AUDITOR → শুধু পঠন পরিচয়');
w.wsSetRole('web', 'W_MANAGER');

/* ---- every screen renders in the right stage ---- */
let bad = [];
const META = w.__X.META;
META.forEach(m => {
  try {
    const isMob = w.wsIsMob(m.id);
    const html = isMob ? w.wsMobileStage(m.id, 'ORG_ADMIN') : w.wsWebStage(m.id, 'W_MANAGER');
    if (!html || html.length < 200) bad.push(m.id + ':short');
    if (/NaN/.test(html)) bad.push(m.id + ':NaN');
    if (isMob && !/wsgo\('mob'/.test(html) && /onclick="go\(/.test(html)) bad.push(m.id + ':unwired-mob');
    if (!isMob && /onclick="go\(/.test(html)) bad.push(m.id + ':unwired-web');
  } catch (e) { bad.push(m.id + ':' + e.message.slice(0, 50)); }
});
ok(bad.length === 0, `সব ১৫৭ স্ক্রিন দুই স্টেজে রেন্ডারযোগ্য ও রিওয়্যারড (সমস্যা: ${bad.slice(0, 5).join(' | ') || 'নেই'})`);

/* ---- deep link ---- */
w.location.hash = '#mob:APPROVER:am03|web:W_ACCOUNTANT:a28';
const parsed = w.wsReadHash();
ok(parsed.mob && parsed.mob.role === 'APPROVER' && parsed.mob.id === 'am03', 'ডিপ লিংক পার্স (মোবাইল)');
ok(parsed.web && parsed.web.role === 'W_ACCOUNTANT' && parsed.web.id === 'a28', 'ডিপ লিংক পার্স (ওয়েব)');

/* ---- Super Admin honesty ---- */
const saCards = d.querySelectorAll('#saGrid .ws-sa-card').length;
ok(saCards === 12, `Super Admin পরিকল্পিত পেজ কার্ড = ${saCards} (১২)`);
ok(/ডিজাইন স্থগিত/.test(d.body.innerHTML), 'Super Admin = "ডিজাইন স্থগিত" স্পষ্টভাবে লেখা');

/* ---- no console errors / NaN leakage ---- */
ok(errs.length === 0, `console error নেই (${errs.slice(0, 2).join(' | ') || 'none'})`);
ok(warns.filter(x => /amnav/.test(x)).length === 0, `৫-স্লট সতর্কতা নেই (${warns.filter(x => /amnav/.test(x)).join(' | ') || 'none'})`);
const bodyHtml = d.body.innerHTML;
ok(!/NaN/.test(bodyHtml), 'পেজে NaN নেই');
ok((bodyHtml.match(/>undefined</g) || []).length === 0, 'পেজে ফাঁকা undefined নেই');

let fail = report('workspace.html', checks);
console.log('  · warns:', warns.length, warns.slice(0, 3).join(' | '));
process.exit(fail ? 1 : 0);
