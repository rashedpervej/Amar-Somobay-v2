import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MobileLayout } from '../components/layout/MobileLayout';
import { useAuthStore } from '../store/useAuthStore';
import { 
  LayoutDashboard, 
  Users, 
  Layers, 
  PiggyBank, 
  CreditCard, 
  RotateCw, 
  Target, 
  Coins, 
  Sprout, 
  FileText, 
  Megaphone, 
  Settings, 
  ChevronRight, 
  ChevronDown,
  LogOut,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  Banknote,
  Building2,
  Sliders,
  Copy,
  Check,
  Share2
} from 'lucide-react';
import { motion } from 'motion/react';
import { useSettingsStore } from '../store/useSettingsStore';

export default function AdminMore() {
  const navigate = useNavigate();
  const { cooperativeSlug } = useParams<{ cooperativeSlug?: string }>();
  const { profile, signOut, activeOrganization } = useAuthStore();
  const { settings } = useSettingsStore();

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const currentSlug = cooperativeSlug || activeOrganization?.slug;

  const menuItems = [
    {
      id: 'dashboard',
      title: 'ড্যাশবোর্ড',
      path: currentSlug ? `/somobay/${currentSlug}` : '/dashboard',
      icon: <LayoutDashboard size={20} />,
      color: 'text-emerald-700',
      bg: 'bg-emerald-50'
    },
    {
      id: 'members',
      title: 'সদস্য ব্যবস্থাপনা',
      path: currentSlug ? `/somobay/${currentSlug}/members` : '/members',
      icon: <Users size={20} />,
      color: 'text-blue-700',
      bg: 'bg-blue-50'
    },
    {
      id: 'groups',
      title: 'সমিতি ও সঞ্চয় স্কিম',
      path: currentSlug ? `/somobay/${currentSlug}/plans` : '/somobay',
      icon: <Layers size={20} />,
      color: 'text-purple-700',
      bg: 'bg-purple-50'
    },
    {
      id: 'manage-somobay',
      title: 'Manage Somobay (সমবায় পরিচালনা)',
      subtitle: 'Active, Inactive ও Archive সমবায় নিয়ন্ত্রণ',
      path: currentSlug ? `/somobay/${currentSlug}/manage` : '/somobay/manage',
      icon: <Layers size={20} />,
      color: 'text-emerald-700',
      bg: 'bg-emerald-50'
    },
    {
      id: 'cooperative-provisioning',
      title: 'সমবায় অনুমোদন ও প্ল্যাটফর্ম কন্ট্রোল (Super Admin)',
      path: '/admin/cooperatives',
      icon: <Building2 size={20} />,
      color: 'text-sky-700',
      bg: 'bg-sky-50'
    },
    {
      id: 'savings',
      title: 'সাধারণ সমবায় ব্যবস্থাপনা',
      path: currentSlug ? `/somobay/${currentSlug}/general-cooperative` : '/admin/savings',
      icon: <PiggyBank size={20} />,
      color: 'text-primary',
      bg: 'bg-primary-light'
    },
    {
      id: 'savings-settings',
      title: 'সাধারণ সমবায় সেটিংস ও পলিসি',
      path: currentSlug ? `/somobay/${currentSlug}/settings` : '/admin/savings/settings',
      icon: <Sliders size={20} />,
      color: 'text-emerald-700',
      bg: 'bg-emerald-50'
    },
    {
      id: 'bulk-deposit',
      title: 'এককালীন/বাল্ক সঞ্চয় জমা',
      path: '/savings/bulk',
      icon: <Banknote size={20} />,
      color: 'text-emerald-700',
      bg: 'bg-emerald-50'
    },
    {
      id: 'loans',
      title: 'ঋণ ব্যবস্থাপনা',
      path: '/admin/loans',
      icon: <CreditCard size={20} />,
      color: 'text-amber-700',
      bg: 'bg-amber-50'
    },
    {
      id: 'rosca',
      title: 'মেয়াদি/রোসকা (ROSCA)',
      path: '/rosca',
      icon: <RotateCw size={20} />,
      color: 'text-indigo-700',
      bg: 'bg-indigo-50'
    },
    {
      id: 'joint-goal',
      title: 'জয়েন্ট গোল (Collective)',
      path: '/joint-goals',
      icon: <Target size={20} />,
      color: 'text-teal-700',
      bg: 'bg-teal-50'
    },
    {
      id: 'qard',
      title: 'কর্জে হাসানা (সুদমুক্ত ঋণ)',
      path: '/qard',
      icon: <Coins size={20} />,
      color: 'text-primary',
      bg: 'bg-primary-light'
    },
    {
      id: 'installments',
      title: 'কিস্তি ও আদায়',
      path: '/admin/installments',
      icon: <Coins size={20} />,
      color: 'text-rose-700',
      bg: 'bg-rose-50'
    },
    {
      id: 'pending-approvals',
      title: 'অনুমোদন কিউ (জমা ও উত্তোলন)',
      path: '/admin/payments/pending',
      icon: <ShieldCheck size={20} />,
      color: 'text-emerald-700',
      bg: 'bg-emerald-50'
    },
    {
      id: 'reports',
      title: 'লেনদেন ও অডিট রিপোর্ট',
      path: currentSlug ? `/somobay/${currentSlug}/reports` : '/admin/reports',
      icon: <FileText size={20} />,
      color: 'text-sky-700',
      bg: 'bg-sky-50'
    },
    {
      id: 'updates',
      title: 'আপডেটস (নোটিশ, অফার ও নিউজ)',
      path: '/admin/updates',
      icon: <Megaphone size={20} />,
      color: 'text-violet-700',
      bg: 'bg-violet-50'
    },
    {
      id: 'promo-banners',
      title: 'প্রমোশন ব্যানার কন্ট্রোল প্যানেল',
      path: '/admin/updates?tab=promos',
      icon: <Sparkles size={20} />,
      color: 'text-amber-700',
      bg: 'bg-amber-50'
    },
    {
      id: 'settings',
      title: 'সেটিংস',
      path: '/settings',
      icon: <Settings size={20} />,
      color: 'text-slate-700',
      bg: 'bg-slate-100'
    }
  ];

  return (
    <MobileLayout hideHeader={true}>
      {/* Top Branding Section (Matching Screenshot) */}
      <div className="flex flex-col items-center justify-center pt-2 pb-1 text-center">
        <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center p-2 mb-2 shadow-xs">
          <img src={settings?.logo_url || '/icon.svg'} alt="Logo" className="w-full h-full object-contain" />
        </div>
        
        <h1 className="text-[20px] font-bold text-slate-800 bangla leading-tight">
          {settings?.app_name || 'গ্রামীণ সমবায়'}
        </h1>
        
        <div className="mt-1.5 px-3 py-0.5 rounded-full bg-primary text-white shadow-xs">
          <span className="text-[11px] font-bold tracking-wide">Admin Panel</span>
        </div>
      </div>

      {/* Cooperative Identity & Invite Card */}
      {activeOrganization && (
        <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white p-3.5 rounded-[22px] shadow-sm border border-emerald-500/20 flex flex-col gap-3">
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
                      const code = activeOrganization.reg_number || '';
                      navigator.clipboard.writeText(code);
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2500);
                    }}
                    className="inline-flex items-center gap-1 bg-white/15 hover:bg-white/25 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold text-white transition-all active:scale-95 cursor-pointer"
                    title="কোড কপি করুন"
                  >
                    <span>#{activeOrganization.reg_number || 'N/A'}</span>
                    {copiedCode ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Direct Entry Button to Cooperative Dashboard */}
            <button
              type="button"
              onClick={() => {
                const targetSlug = currentSlug || activeOrganization.slug || activeOrganization.reg_number?.toLowerCase() || '';
                navigate(`/somobay/${targetSlug}`);
              }}
              className="py-1.5 px-3 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-emerald-300 hover:text-white transition-all shrink-0 cursor-pointer text-[12px] font-bold bangla flex items-center gap-1 border border-white/15 shadow-xs"
              title="সমিতি ড্যাশবোর্ডে প্রবেশ করুন"
            >
              <span>প্রবেশ করুন</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Invite / Share Actions */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10">
            <button
              type="button"
              onClick={() => {
                const code = activeOrganization.reg_number || '';
                const url = `${window.location.origin}/join/${code}`;
                navigator.clipboard.writeText(url);
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 2500);
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white text-[12px] font-bold bangla transition-all border border-white/10 cursor-pointer"
            >
              {copiedLink ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copiedLink ? 'লিংক কপি হয়েছে!' : 'ইনভাইট লিংক কপি'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const code = activeOrganization.reg_number || '';
                const name = activeOrganization.name;
                const url = `${window.location.origin}/join/${code}`;
                const text = encodeURIComponent(`আসসালামু আলাইকুম, আমাদের "${name}" সমিতিতে যুক্ত হতে নিচের লিংকে ক্লিক করুন:\n${url}\nঅথবা সমিতি কোড ব্যবহার করুন: #${code}`);
                window.open(`https://wa.me/?text=${text}`, '_blank');
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-[12px] font-bold bangla transition-all shadow-sm cursor-pointer"
            >
              <Share2 size={14} />
              <span>হোয়াটসঅ্যাপ শেয়ার</span>
            </button>
          </div>
        </div>
      )}

      {/* Admin Profile Card (Matching Screenshot) */}
      <div 
        onClick={() => navigate('/settings/profile')}
        className="bg-white rounded-[18px] p-3.5 border border-border shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex items-center justify-between cursor-pointer active:scale-[0.99] transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-[46px] h-[46px] rounded-full overflow-hidden border-2 border-emerald-100 shadow-xs bg-emerald-50 text-primary font-bold text-[17px] shrink-0 flex items-center justify-center">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="admin" className="w-full h-full object-cover" />
            ) : (
              <span>{profile?.full_name?.substring(0, 2) || 'রা'}</span>
            )}
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-slate-800 bangla leading-tight">
              {profile?.full_name || 'মোঃ রাসেদ পারভেজ'}
            </h2>
            <p className="text-[12px] text-slate-500 font-medium bangla mt-0.5">
              অ্যাডমিন
            </p>
          </div>
        </div>
        <ChevronDown size={18} className="text-slate-400 shrink-0" />
      </div>

      {/* Admin Menu List */}
      <div className="flex flex-col gap-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            className="w-full bg-white rounded-[16px] p-3 px-3.5 border border-border shadow-[0_2px_6px_rgba(0,0,0,0.02)] flex items-center justify-between active:scale-[0.99] transition-all hover:border-emerald-200 cursor-pointer select-none"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${item.bg} ${item.color} flex items-center justify-center shrink-0`}>
                {item.icon}
              </div>
              <span className="text-[14px] font-semibold text-slate-800 bangla text-left">{item.title}</span>
            </div>
            <ChevronRight size={18} className="text-slate-400 shrink-0" />
          </button>
        ))}
      </div>

      {/* Logout Action */}
      <div className="pt-1 pb-4">
        <button
          onClick={async () => {
            if (confirm('আপনি কি নিশ্চিত যে লগআউট করতে চান?')) {
              await signOut();
              navigate('/login');
            }
          }}
          className="w-full h-[46px] rounded-[14px] bg-rose-50 border border-rose-200 text-rose-600 font-semibold bangla flex items-center justify-center gap-2 text-[14px] active:scale-[0.99] transition-all"
        >
          <LogOut size={18} />
          লগআউট করুন
        </button>
      </div>
    </MobileLayout>
  );
}
