import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import App from './App';
import MemberApp from './apps/member/MemberApp';
import { MemberProvider } from './store/memberStore';
import { ModuleProvider } from './store/moduleStore';
import { SessionProvider } from './store/sessionStore';
import { AdminProvider } from './store/adminStore';
import { AdminRoscaProvider } from './store/adminRoscaStore';
import { AdminJointProvider } from './store/adminJointStore';
import Login from './apps/shared/screens/Login';
import OrgSwitcher from './apps/shared/screens/OrgSwitcher';
import AccountSettings from './apps/shared/screens/AccountSettings';
import NotificationPrefs from './apps/shared/screens/NotificationPrefs';
import Forbidden from './apps/shared/screens/Forbidden';
import ErrorStates from './apps/shared/screens/ErrorStates';
import ReceiptVerify from './apps/shared/screens/ReceiptVerify';
import OfflineSync from './apps/shared/screens/OfflineSync';
import AdminMobileApp from './apps/admin/AdminMobileApp';
import AdminWebApp from './apps/admin/AdminWebApp';
import './index.css';

const el = document.getElementById('root');
if (!el) throw new Error('#root নেই');

/* রুট-স্ট্রাকচার (ফেজ ৩):
   /        → ফেজ ২-৩ শোকেস (শেল, ডিজাইন সিস্টেম, নীতি)
   /m/*     → সদস্য অ্যাপ (শুধু মোবাইল)
   /a/*     → অ্যাডমিন অ্যাপ (?role=MANAGER ডিফল্ট)
   /w/*     → অ্যাডমিন ওয়েব (আলাদা ডেস্কটপ) */
createRoot(el).render(
  <StrictMode>
    <BrowserRouter>
      <SessionProvider>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/m/*" element={<MemberProvider><ModuleProvider><MemberApp /></ModuleProvider></MemberProvider>} />
          <Route path="/a/*" element={<AdminProvider><AdminRoscaProvider><AdminJointProvider><AdminMobileApp /></AdminJointProvider></AdminRoscaProvider></AdminProvider>} />
          <Route path="/w/*" element={<AdminWebApp />} />
          {/* শেয়ার্ড পর্দা S-01…S-08 — সব প্যানেলেই ব্যবহৃত */}
          <Route path="/login" element={<Login />} />
          <Route path="/organizations" element={<OrgSwitcher />} />
          <Route path="/account" element={<AccountSettings />} />
          <Route path="/account/notifications" element={<NotificationPrefs />} />
          <Route path="/403" element={<Forbidden />} />
          <Route path="/error" element={<ErrorStates />} />
          <Route path="/verify" element={<ReceiptVerify />} />
          <Route path="/sync" element={<OfflineSync />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SessionProvider>
    </BrowserRouter>
  </StrictMode>,
);
