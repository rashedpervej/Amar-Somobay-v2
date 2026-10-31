import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import App from './App';
import MemberApp from './apps/member/MemberApp';
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
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/m/*" element={<MemberApp />} />
        <Route path="/a/*" element={<AdminMobileApp />} />
        <Route path="/w/*" element={<AdminWebApp />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
