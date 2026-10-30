import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '../components/layout/MobileLayout';
import { useAuthStore } from '../store/useAuthStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useTheme } from '../components/ThemeProvider';
import { 
  ArrowLeft, 
  Bell, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  Check,
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Notifications() {
  const navigate = useNavigate();
  const theme = useTheme();
  const profile = useAuthStore(state => state.profile);
  const activeOrganizationId = useAuthStore(state => state.activeOrganizationId);
  const notifications = useNotificationStore(state => state.notifications);
  const settings = useSettingsStore(state => state.settings);
  const loading = useNotificationStore(state => state.loading);

  const [categoryFilter, setCategoryFilter] = useState<'all' | 'payment' | 'fine' | 'other'>('all');

  const filteredNotifications = notifications;
  const fetchNotifications = useNotificationStore(state => state.fetchNotifications);
  const markAsRead = useNotificationStore(state => state.markAsRead);
  const markAllAsRead = useNotificationStore(state => state.markAllAsRead);

  useEffect(() => {
    let active = true;
    let unsubscribe: () => void = () => {};
    
    if (profile?.id) {
      const pId = profile.id;
      fetchNotifications(pId, activeOrganizationId).then(unsub => {
        if (active) unsubscribe = unsub;
        else unsub();
      });
    }
    
    return () => {
      active = false;
      unsubscribe();
    };
  }, [profile?.id, activeOrganizationId, fetchNotifications]);

  const handleMarkAll = () => {
    if (profile?.id) {
      markAllAsRead(profile.id);
    }
  };

  const unreadCount = filteredNotifications.filter(n => !n.is_read).length;

  const displayList = filteredNotifications.filter(n => {
    if (categoryFilter === 'all') return true;
    if (categoryFilter === 'payment') return n.title?.includes('কিস্তি') || n.title?.includes('জমা') || n.source_module === 'plan';
    if (categoryFilter === 'fine') return n.title?.includes('জরিমানা') || n.type === 'warning';
    return true;
  });

  return (
    <MobileLayout
      headerTitle="নোটিফিকেশন"
      showBack={true}
      headerRight={
        unreadCount > 0 ? (
          <button 
            onClick={handleMarkAll}
            className="h-11 min-h-[44px] px-2 flex items-center text-[13px] font-bold text-white bangla active:opacity-75 transition-opacity focus:outline-none cursor-pointer"
            title="সব পড়া হয়েছে"
          >
            সব পড়া হয়েছে
          </button>
        ) : null
      }
    >
      {/* Unread banner if any */}
      {unreadCount > 0 && (
        <div className="p-3 rounded-xl bg-primary-light border border-emerald-200 text-primary text-[12px] font-semibold bangla flex items-center justify-between">
          <span>আপনার {unreadCount.toLocaleString('bn-BD')} টি অপঠিত নোটিফিকেশন রয়েছে</span>
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        </div>
      )}

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'all', label: 'সকল বিজ্ঞপ্তি' },
          { id: 'payment', label: 'কিস্তি ও জমা' },
          { id: 'fine', label: 'জরিমানা' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setCategoryFilter(tab.id as any)}
            className={`px-3 py-1.5 rounded-full text-[12px] font-semibold bangla whitespace-nowrap transition-all border ${
              categoryFilter === tab.id
                ? 'bg-primary text-white border-primary shadow-sm'
                : 'bg-white text-slate-600 border-border hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="flex flex-col gap-2.5 pb-20">
        <AnimatePresence mode="popLayout">
          {displayList.length > 0 ? (
            displayList.map((notification, index) => {
              let displayTitle = notification.title;
              let iconBg = 'bg-primary-light text-primary';
              let icon = <CheckCircle2 size={20} strokeWidth={2.2} />;

              if (displayTitle === 'কিস্তি জমা সফল' || displayTitle === 'কিস্তি পরিশোধ সফল') {
                displayTitle = 'কিস্তি পরিশোধ সম্পন্ন';
              } else if (displayTitle === 'জরিমানা যুক্ত করা হয়েছে' || displayTitle === 'জরিমানা যুক্ত করা হয়েছে') {
                displayTitle = 'বিলম্ব জরিমানা যুক্ত';
                iconBg = 'bg-amber-50 text-amber-600';
                icon = <AlertCircle size={20} strokeWidth={2.2} />;
              } else if (displayTitle === 'জরিমানা মওকুফ করা হয়েছে' || displayTitle === 'জরিমানা মওকুফ করা হয়েছে') {
                displayTitle = 'জরিমানা মওকুফ';
                iconBg = 'bg-indigo-50 text-indigo-600';
                icon = <Sparkles size={20} strokeWidth={2.2} />;
              } else if (displayTitle === 'টাকা রিফান্ড') {
                displayTitle = 'টাকা রিফান্ড সম্পন্ন';
                iconBg = 'bg-rose-50 text-[#DC2626]';
                icon = <AlertCircle size={20} strokeWidth={2.2} />;
              } else {
                if (notification.type === 'error') {
                  iconBg = 'bg-rose-50 text-[#DC2626]';
                  icon = <AlertCircle size={20} strokeWidth={2.2} />;
                } else if (notification.type === 'warning') {
                  iconBg = 'bg-amber-50 text-amber-600';
                  icon = <AlertCircle size={20} strokeWidth={2.2} />;
                }
              }

              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.02, 0.12), duration: 0.18 }}
                  onClick={() => !notification.is_read && markAsRead(notification.id)}
                  className={`bg-white rounded-[16px] p-3.5 border shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex gap-3 cursor-pointer transition-all ${
                    notification.is_read ? 'border-border opacity-80' : 'border-primary/30 bg-emerald-50/20'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
                    {icon}
                  </div>

                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-[14px] font-semibold text-slate-800 bangla leading-tight">
                        {displayTitle}
                      </h3>
                      {!notification.is_read && (
                        <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                      )}
                    </div>
                    <p className="text-[12px] text-slate-500 bangla leading-relaxed mt-1">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-1 mt-1.5 text-[10px] text-slate-400 font-medium">
                      <Clock size={11} />
                      <span>{new Date(notification.created_at).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      <span>•</span>
                      <span>{new Date(notification.created_at).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : !loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <Bell size={28} />
              </div>
              <p className="text-[14px] font-semibold text-slate-500 bangla">কোন নোটিফিকেশন নেই</p>
              <p className="text-[12px] text-slate-400 bangla">আপনার অ্যাকাউন্টের সকল লেনদেন সংক্রান্ত বার্তা এখানে আসবে</p>
            </div>
          ) : (
            <div className="py-16 flex justify-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </AnimatePresence>
      </div>
    </MobileLayout>
  );
}
