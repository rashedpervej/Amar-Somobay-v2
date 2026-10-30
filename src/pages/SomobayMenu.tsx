import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '../components/layout/MobileLayout';
import { 
  ArrowLeft, 
  Sprout, 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Wallet, 
  Handshake, 
  AlertCircle, 
  Receipt, 
  BarChart3, 
  ChevronRight,
  Settings
} from 'lucide-react';
import { motion } from 'motion/react';

export default function SomobayMenu() {
  const navigate = useNavigate();

  const menuItems = [
    {
      id: 'dashboard',
      title: 'ড্যাশবোর্ড',
      subtitle: 'সারসংক্ষেপ ও গুরুত্বপূর্ণ তথ্য',
      path: '/admin/savings',
      icon: <LayoutDashboard size={22} />,
      bg: 'bg-emerald-50',
      color: 'text-primary'
    },
    {
      id: 'schemes',
      title: 'প্ল্যান ব্যবস্থাপনা',
      subtitle: 'সঞ্চয় প্ল্যান তৈরি, সম্পাদনা ও সেটিংস',
      path: '/somobay/manage',
      icon: <Calendar size={22} />,
      bg: 'bg-amber-50',
      color: 'text-amber-600'
    },
    {
      id: 'members',
      title: 'সদস্য ব্যবস্থাপনা',
      subtitle: 'প্ল্যানে সদস্য যুক্ত/বিযুক্ত ও স্থিতি',
      path: '/members',
      icon: <Users size={22} />,
      bg: 'bg-emerald-50',
      color: 'text-primary'
    },
    {
      id: 'repayments',
      title: 'জমা/কিস্তি ব্যবস্থাপনা',
      subtitle: 'কিস্তি আদায়, জমা এন্ট্রি ও বাল্ক এন্ট্রি',
      path: '/admin/installments',
      icon: <Wallet size={22} />,
      bg: 'bg-purple-50',
      color: 'text-purple-600'
    },
    {
      id: 'loans',
      title: 'ঋণ ব্যবস্থাপনা',
      subtitle: 'ঋণ আবেদন, অনুমোদন ও কিস্তি বিতরণ',
      path: '/admin/loans',
      icon: <Handshake size={22} />,
      bg: 'bg-blue-50',
      color: 'text-blue-600'
    },
    {
      id: 'overdue',
      title: 'বকেয়া তালিকা ও ফলোআপ',
      subtitle: 'বকেয়া তালিকা ও যোগাযোগ (রিমাইন্ডার)',
      path: '/admin/installments',
      icon: <AlertCircle size={22} />,
      bg: 'bg-rose-50',
      color: 'text-rose-500'
    },
    {
      id: 'transactions',
      title: 'লেনদেন হিসাব',
      subtitle: 'সব ধরনের ট্রানজেকশন লেজার',
      path: '/savings',
      icon: <Receipt size={22} />,
      bg: 'bg-sky-50',
      color: 'text-sky-600'
    },
    {
      id: 'reports',
      title: 'রিপোর্ট ও বিশ্লেষণ',
      subtitle: 'সঞ্চয়, কিস্তি ও সদস্য রিপোর্ট',
      path: '/admin/reports',
      icon: <BarChart3 size={22} />,
      bg: 'bg-teal-50',
      color: 'text-teal-700'
    }
  ];

  return (
    <MobileLayout
      headerTitle="সমবায় সমিতি মেনু"
      backTo="/dashboard"
      showBack={true}
      headerRight={
        <button
          onClick={() => navigate('/settings')}
          className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-white active:scale-90 transition-transform focus:outline-none cursor-pointer"
          title="সেটিংস"
          aria-label="সেটিংস"
        >
          <Settings size={22} strokeWidth={2.2} />
        </button>
      }
    >
      <div className="space-y-4 pb-20">

        {/* Hero Hub Card (Screen 01 reference: Green rounded icon + Title & Subtitle) */}
        <div className="flex items-center gap-3.5 bg-white p-3 rounded-2xl border border-slate-100 shadow-xs">
          <div className="w-13 h-13 rounded-2xl bg-primary-light flex items-center justify-center text-primary shrink-0 shadow-xs">
            <Sprout size={30} className="stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[20px] font-bold text-slate-900 bangla leading-tight">
                সাধারণ সমবায়
              </h1>
              <span className="text-[10px] font-bold bangla px-2 py-0.5 rounded-full bg-emerald-50 text-primary border border-emerald-200">
                অ্যাডমিন হাব
              </span>
            </div>
            <p className="text-[12px] text-slate-500 font-normal bangla mt-0.5">
              নিয়মিত সঞ্চয়, কিস্তি আদায়, ঋণ ও সমিতি ব্যবস্থাপনা
            </p>
          </div>
        </div>

        {/* 8 Menu Item Cards (Screen 01 exact reproduction) */}
        <div className="space-y-2.5">
          {menuItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.02, 0.2), duration: 0.2, ease: 'easeOut' }}
              onClick={() => navigate(item.path)}
              className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center justify-between cursor-pointer hover:border-emerald-200 active:scale-[0.99] transition-all"
            >
              <div className="flex items-center gap-3.5">
                <div className={`w-12 h-12 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center shrink-0`}>
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-slate-900 bangla leading-tight">
                    {item.title}
                  </h3>
                  <p className="text-[12px] text-slate-400 font-normal bangla mt-0.5">
                    {item.subtitle}
                  </p>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-300" />
            </motion.div>
          ))}
        </div>
      </div>
    </MobileLayout>
  );
}
