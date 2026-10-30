import React, { useState, useEffect } from 'react';
import { MobileLayout } from '../components/layout/MobileLayout';
import { useAuthStore } from '../store/useAuthStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useTheme } from '../components/ThemeProvider';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, 
  User, 
  Shield, 
  Info, 
  ChevronRight, 
  Bell, 
  Settings as SettingsIcon, 
  Camera, 
  Phone, 
  FileText, 
  HelpCircle, 
  Share2, 
  ExternalLink,
  Users,
  Sparkles,
  CheckCircle2,
  Check,
  X,
  Building2,
  Copy,
  ChevronDown,
  PlusCircle,
  ArrowRightLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Settings() {
  const { 
    profile, 
    signOut, 
    activeOrganization, 
    memberships, 
    setActiveOrganizationId, 
    fetchMemberships 
  } = useAuthStore();
  const { settings } = useSettingsStore();
  const navigate = useNavigate();
  const theme = useTheme();

  const isAdmin = profile?.role === 'admin';
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showAllCooperatives, setShowAllCooperatives] = useState(false);

  useEffect(() => {
    fetchMemberships();
  }, [fetchMemberships]);

  const accountItems = [
    { 
      icon: <User size={18} />, 
      label: 'প্রোফাইল সম্পাদন', 
      desc: 'নাম, ছবি ও ব্যক্তিগত তথ্য পরিবর্তন',
      color: 'text-primary', 
      bg: 'bg-primary-light',
      path: '/settings/profile'
    },
    { 
      icon: <Shield size={18} />, 
      label: 'নিরাপত্তা ও পাসওয়ার্ড', 
      desc: 'অ্যাকাউন্টের পাসওয়ার্ড পরিবর্তন',
      color: 'text-blue-600', 
      bg: 'bg-blue-50',
      path: '/settings/security'
    },
    { 
      icon: <Bell size={18} />, 
      label: 'নোটিফিকেশন ও অ্যালার্ট', 
      desc: 'বিজ্ঞপ্তি ও এসএমএস পছন্দসমূহ',
      color: 'text-purple-600', 
      bg: 'bg-purple-50',
      path: '/notifications'
    },
  ];

  const societyItems = [
    { 
      icon: <FileText size={18} />, 
      label: 'সমিতি পরিচিতি ও নিয়মাবলী', 
      desc: 'সমিতির গঠনতন্ত্র ও শর্তাবলী',
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50',
      onClick: () => setShowAboutModal(true)
    },
    isAdmin ? { 
      icon: <Users size={18} />, 
      label: 'সদস্য ব্যবস্থাপনা', 
      desc: 'সদস্য তালিকা ও অনুমোদন',
      color: 'text-indigo-600', 
      bg: 'bg-indigo-50',
      path: '/members'
    } : null,
    isAdmin ? { 
      icon: <Sparkles size={18} />, 
      label: 'প্রমোশন ও ব্যানার ব্যবস্থাপনা', 
      desc: 'হোম স্ক্রিন নোটিশ ও অফার পরিচালনা',
      color: 'text-amber-600', 
      bg: 'bg-amber-50',
      path: '/promotions/manage'
    } : null,
  ].filter(Boolean);

  const supportItems = [
    { 
      icon: <Phone size={18} />, 
      label: 'যোগাযোগ ও হেল্পলাইন', 
      desc: 'অফিস হেল্পলাইনে সরাসরি কথা বলুন',
      color: 'text-teal-600', 
      onClick: () => {
        if (settings?.contact_phone) {
          window.location.href = `tel:${settings.contact_phone}`;
        } else {
          alert('কোনো হেল্পলাইন নম্বর এখনো যুক্ত করা হয়নি।');
        }
      }
    },
    { 
      icon: <HelpCircle size={18} />, 
      label: 'সচরাচর জিজ্ঞাসিত প্রশ্ন (FAQ)', 
      desc: 'সমবায় কিস্তি ও সঞ্চয় সম্পর্কিত তথ্য',
      color: 'text-slate-600', 
      bg: 'bg-slate-100',
      onClick: () => setShowAboutModal(true)
    },
    { 
      icon: <Info size={18} />, 
      label: 'অ্যাপ সম্পর্কে', 
      desc: `${settings?.app_name || 'আমার সমবায়'} সংস্করণ ও বিবরণ`,
      color: 'text-slate-600', 
      bg: 'bg-slate-100',
      onClick: () => setShowAboutModal(true)
    },
  ];

  return (
    <MobileLayout>
      {/* Cooperative Identity & Multi-Cooperative Switcher (Matching Admin Panel) */}
      {activeOrganization ? (
        <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white p-3.5 rounded-[22px] shadow-sm border border-emerald-500/20 flex flex-col gap-3 mb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300 shrink-0">
                <Building2 size={20} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-[14px] font-bold bangla text-white leading-tight truncate">
                    {activeOrganization.name}
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bangla bg-emerald-500/20 text-emerald-300 border border-emerald-400/20 shrink-0">
                    সক্রিয় সমিতি
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[11px] text-emerald-200/80 bangla font-medium">সমিতি কোড:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const code = activeOrganization.cooperative_code || activeOrganization.reg_number || '';
                      if (code) {
                        navigator.clipboard.writeText(code);
                        setCopiedCode(true);
                        setTimeout(() => setCopiedCode(false), 2500);
                      }
                    }}
                    className="inline-flex items-center gap-1 bg-white/15 hover:bg-white/25 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold text-white transition-all active:scale-95 cursor-pointer"
                    title="কোড কপি করুন"
                  >
                    <span>#{activeOrganization.cooperative_code || activeOrganization.reg_number || 'N/A'}</span>
                    {copiedCode ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>
            </div>

            {/* View Cooperative Public Page */}
            <button
              type="button"
              onClick={() => {
                const code = activeOrganization.cooperative_code || activeOrganization.reg_number || activeOrganization.slug;
                navigate(`/somobay/${code}`);
              }}
              className="py-1.5 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-emerald-300 hover:text-white transition-all shrink-0 cursor-pointer text-[11px] font-bold bangla flex items-center gap-1 border border-white/10"
              title="সমিতি পেজ দেখুন"
            >
              <span>বিস্তারিত</span>
              <ExternalLink size={12} />
            </button>
          </div>

          {/* Multi-Cooperative Switcher / Enrolled Cooperatives List */}
          {memberships && memberships.length > 1 && (
            <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setShowAllCooperatives(!showAllCooperatives)}
                className="flex items-center justify-between w-full text-left text-xs text-emerald-200 hover:text-white font-medium bangla transition-colors py-0.5 cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <ArrowRightLeft size={13} className="text-emerald-400" />
                  <span>আপনি মোট {memberships.length}টি সমিতিতে যুক্ত আছেন</span>
                </span>
                <span className="text-[11px] underline flex items-center gap-1">
                  {showAllCooperatives ? 'লুকান' : 'সবগুলো দেখুন / পরিবর্তন করুন'}
                  <ChevronDown size={13} className={`transform transition-transform ${showAllCooperatives ? 'rotate-180' : ''}`} />
                </span>
              </button>

              <AnimatePresence>
                {showAllCooperatives && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex flex-col gap-1.5 overflow-hidden pt-1"
                  >
                    {memberships.map((m) => {
                      const org = m.organization;
                      if (!org) return null;
                      const isCurrent = org.id === activeOrganization.id;
                      return (
                        <div
                          key={m.id || org.id}
                          onClick={() => {
                            if (!isCurrent) {
                              setActiveOrganizationId(org.id);
                            }
                          }}
                          className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                            isCurrent
                              ? 'bg-emerald-500/20 border-emerald-400/40 text-white font-bold'
                              : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-200 cursor-pointer active:scale-[0.99]'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${isCurrent ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                            <div className="min-w-0">
                              <p className="text-[13px] truncate bangla leading-tight">{org.name}</p>
                              <p className="text-[10px] text-slate-300 font-mono mt-0.5">
                                #{org.cooperative_code || org.reg_number || org.slug} • {
                                  m.role === 'cooperative_admin' ? 'অ্যাডমিন' : m.role === 'collector' ? 'কালেক্টর' : 'সদস্য'
                                }
                              </p>
                            </div>
                          </div>
                          {isCurrent ? (
                            <span className="text-[10px] bg-emerald-400 text-slate-900 px-2 py-0.5 rounded-full font-bold bangla shrink-0">
                              বর্তমান
                            </span>
                          ) : (
                            <span className="text-[11px] text-emerald-300 hover:text-emerald-200 bangla shrink-0">
                              সুইচ করুন
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Quick Join another cooperative */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
            <span className="text-emerald-200/70 bangla">নতুন সমিতিতে যুক্ত হতে চান?</span>
            <button
              type="button"
              onClick={() => navigate('/cooperative/join')}
              className="inline-flex items-center gap-1 text-emerald-300 hover:text-white font-bold bangla transition-colors cursor-pointer"
            >
              <PlusCircle size={13} />
              <span>কোড দিয়ে যোগ দিন</span>
            </button>
          </div>
        </div>
      ) : (
        /* If user is not yet part of any active organization */
        <div className="bg-gradient-to-br from-slate-900 via-teal-950 to-emerald-950 text-white p-4 rounded-[22px] shadow-sm border border-emerald-500/20 mb-3 flex flex-col gap-2.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300 shrink-0">
              <Building2 size={20} />
            </div>
            <div>
              <h3 className="text-[14px] font-bold bangla text-white leading-tight">
                কোনো সমিতিতে যুক্ত নেই
              </h3>
              <p className="text-[11px] text-emerald-200/80 bangla mt-0.5">
                সমিতি কোড ব্যবহার করে যেকোনো অনুমোদিত সমিতিতে যোগ দিন
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/cooperative/join')}
            className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-[12px] bangla transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer mt-1"
          >
            <PlusCircle size={14} />
            <span>সমিতি কোড দিয়ে যোগ দিন</span>
          </button>
        </div>
      )}

      {/* Profile Header Hero Card (Reference Screen 9) */}
      <div 
        className="bg-white rounded-[20px] p-4.5 border border-border shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex items-center justify-between mb-3"
      >
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div 
              onClick={() => navigate('/settings/profile')}
              className="w-[58px] h-[58px] rounded-full flex items-center justify-center border-2 border-white shadow-sm overflow-hidden shrink-0 cursor-pointer"
              style={{ backgroundColor: `${theme.primary}15` }}
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[20px] font-bold bangla" style={{ color: theme.primary }}>
                  {profile?.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2) || 'ন'}
                </span>
              )}
            </div>
            <button 
              onClick={() => navigate('/settings/profile')}
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shadow-sm border border-white"
            >
              <Camera size={12} />
            </button>
          </div>

          <div className="flex flex-col">
            <h1 className="text-[17px] font-bold text-slate-800 bangla leading-tight">{profile?.full_name || 'সদস্য'}</h1>
            <p className="text-slate-400 text-[12px] mt-0.5">{profile?.phone || profile?.email || 'কোন নম্বর যুক্ত নেই'}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="inline-flex items-center px-2 py-0.2 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                আইডি: SM-{profile?.id ? profile.id.slice(0, 4).toUpperCase() : '1024'}
              </span>
              <span className="inline-flex items-center px-2 py-0.2 rounded-full text-[10px] font-medium bg-primary-light text-primary">
                {isAdmin ? 'প্রধান অ্যাডমিন' : 'সক্রিয় সদস্য'}
              </span>
            </div>
          </div>
        </div>

        <button 
          onClick={() => navigate('/settings/profile')}
          className="text-slate-400 p-1 rounded-full hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Menu Group 1: আমার অ্যাকাউন্ট */}
      <div className="flex flex-col gap-1.5 mb-3">
        <h2 className="text-[12px] font-semibold text-slate-400 bangla px-1 uppercase tracking-wider">আমার অ্যাকাউন্ট</h2>
        <div className="bg-white rounded-[18px] border border-border shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
          {accountItems.map((item, index) => (
            <button 
              key={index}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3.5 p-3.5 text-left active:bg-slate-50 active:scale-[0.99] transition-all cursor-pointer select-none ${
                index !== accountItems.length - 1 ? 'border-b border-slate-100' : ''
              }`}
            >
              <div className={`w-9 h-9 rounded-xl ${item.bg} ${item.color} flex items-center justify-center shrink-0`}>
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-slate-800 bangla text-[14px] block leading-tight">{item.label}</span>
                <span className="text-[11px] text-slate-400 bangla truncate block mt-0.5">{item.desc}</span>
              </div>
              <ChevronRight size={16} className="text-slate-300 shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Menu Group 2: সমিতি ও ডকুমেন্টস */}
      <div className="flex flex-col gap-1.5 mb-3">
        <h2 className="text-[12px] font-semibold text-slate-400 bangla px-1 uppercase tracking-wider">সমিতি ও সেবা</h2>
        <div className="bg-white rounded-[18px] border border-border shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
          {societyItems.map((item: any, index) => (
            <button 
              key={index}
              onClick={() => item.onClick ? item.onClick() : navigate(item.path)}
              className={`w-full flex items-center gap-3.5 p-3.5 text-left active:bg-slate-50 active:scale-[0.99] transition-all cursor-pointer select-none ${
                index !== societyItems.length - 1 ? 'border-b border-slate-100' : ''
              }`}
            >
              <div className={`w-9 h-9 rounded-xl ${item.bg} ${item.color} flex items-center justify-center shrink-0`}>
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-slate-800 bangla text-[14px] block leading-tight">{item.label}</span>
                <span className="text-[11px] text-slate-400 bangla truncate block mt-0.5">{item.desc}</span>
              </div>
              <ChevronRight size={16} className="text-slate-300 shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Admin Quick Link */}
      {isAdmin && (
        <div className="flex flex-col gap-1.5 mb-3">
          <h2 className="text-[12px] font-semibold text-slate-400 bangla px-1 uppercase tracking-wider">সমিতি প্রশাসন</h2>
          <div className="bg-white rounded-[18px] border border-border shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
            <button 
              onClick={() => navigate('/admin/app-settings')}
              className="w-full flex items-center gap-3.5 p-3.5 text-left active:bg-slate-50 active:scale-[0.99] transition-all cursor-pointer select-none"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                <Building2 size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-slate-800 bangla text-[14px] block leading-tight">সমিতি সেটিংস ও ব্র্যান্ডিং</span>
                <span className="text-[11px] text-slate-400 bangla truncate block mt-0.5">সমিতির লোগো, তথ্য, গঠনতন্ত্র ও ড্যাশবোর্ড প্রেফারেন্স</span>
              </div>
              <ChevronRight size={16} className="text-slate-300 shrink-0" />
            </button>
          </div>
        </div>
      )}

      {/* Menu Group 3: সহায়তা ও যোগাযোগ */}
      <div className="flex flex-col gap-1.5 mb-3">
        <h2 className="text-[12px] font-semibold text-slate-400 bangla px-1 uppercase tracking-wider">সহায়তা</h2>
        <div className="bg-white rounded-[18px] border border-border shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
          {supportItems.map((item, index) => (
            <button 
              key={index}
              onClick={item.onClick}
              className={`w-full flex items-center gap-3.5 p-3.5 text-left active:bg-slate-50 active:scale-[0.99] transition-all cursor-pointer select-none ${
                index !== supportItems.length - 1 ? 'border-b border-slate-100' : ''
              }`}
            >
              <div className={`w-9 h-9 rounded-xl ${item.bg} ${item.color} flex items-center justify-center shrink-0`}>
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-slate-800 bangla text-[14px] block leading-tight">{item.label}</span>
                <span className="text-[11px] text-slate-400 bangla truncate block mt-0.5">{item.desc}</span>
              </div>
              <ChevronRight size={16} className="text-slate-300 shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Logout Row */}
      <div className="bg-white rounded-[18px] border border-border shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden mb-4">
        <button 
          onClick={signOut}
          className="w-full flex items-center gap-3.5 p-3.5 text-left active:bg-rose-50 active:scale-[0.99] transition-all text-[#DC2626] cursor-pointer select-none"
        >
          <div className="w-9 h-9 rounded-xl bg-rose-50 text-[#DC2626] flex items-center justify-center shrink-0">
            <LogOut size={18} />
          </div>
          <span className="flex-1 font-semibold bangla text-[14px]">লগ আউট করুন</span>
          <ChevronRight size={16} className="text-rose-300 shrink-0" />
        </button>
      </div>

      {/* App Version Footer */}
      <div className="text-center pb-8">
        <p className="text-slate-400 text-[11px] bangla font-medium">
          {settings?.app_name || 'আমার সমবায়'} সংস্করণ ১.০.০
        </p>
      </div>

      {/* About & Policies Modal */}
      <AnimatePresence>
        {showAboutModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAboutModal(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="bg-white dark:bg-[#0f172a] w-full max-w-md rounded-t-[28px] sm:rounded-[28px] p-5 flex flex-col gap-4 max-h-[85vh] overflow-y-auto relative z-10 shadow-2xl border-t sm:border border-slate-100 dark:border-white/10"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-[16px] font-bold text-slate-800 dark:text-slate-100 bangla">সমিতি পরিচিতি ও নিয়মাবলী</h3>
                <button 
                  onClick={() => setShowAboutModal(false)} 
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="flex flex-col gap-3 text-[13px] bangla text-slate-600 dark:text-slate-300 leading-relaxed">
                <p>
                  <strong>{settings?.app_name || 'আমাদের সমবায় সমিতি'}</strong> একটি বিশ্বস্ত ও নিবন্ধিত সমবায় সঞ্চয় ও ঋণ সংগঠন। সদস্যদের আর্থিক নিরাপত্তা ও স্বাবলম্বিতা অর্জনে আমরা ঐক্যবদ্ধ।
                </p>
                <div className="p-3 bg-primary-light rounded-xl text-primary text-[12px] flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <Check size={14} className="shrink-0" />
                    <span>শতভাগ স্বচ্ছ হিসাব ও ডিজিটাল রসিদ</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check size={14} className="shrink-0" />
                    <span>যথাসময়ে কিস্তি জমা ও লভ্যাংশ বণ্টন</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check size={14} className="shrink-0" />
                    <span>২৪/৭ হেল্পলাইন ও কেন্দ্রীয় সহায়তা</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  যেকোনো প্রয়োজনে আমাদের অফিসিয়াল হেল্পলাইনে যোগাযোগ করুন।
                </p>
              </div>
              <button
                onClick={() => setShowAboutModal(false)}
                className="w-full py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold bangla text-[14px] active:scale-[0.98] transition-all cursor-pointer shadow-sm"
              >
                ঠিক আছে
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </MobileLayout>
  );
}
