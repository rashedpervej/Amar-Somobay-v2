import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '../components/layout/MobileLayout';
import { useAuthStore } from '../store/useAuthStore';
import { useTheme } from '../components/ThemeProvider';
import { supabase } from '../lib/supabase';
import { 
  Building2, 
  Save, 
  Upload, 
  Loader2, 
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Phone,
  MapPin,
  BookOpen,
  Sparkles,
  Info
} from 'lucide-react';
import { motion } from 'motion/react';

export default function AppSettings() {
  const navigate = useNavigate();
  const { activeOrganization, activeOrganizationId, fetchMemberships } = useAuthStore();
  const theme = useTheme();

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Form State Scoped to the Active Cooperative Organization
  const [formData, setFormData] = useState({
    name: '',
    reg_number: '',
    cooperative_code: '',
    logo_url: '',
    helpline_phone: '',
    address: '',
    by_laws: '',
    is_member_quick_actions_enabled: true
  });

  useEffect(() => {
    const loadCooperativeData = async () => {
      if (!activeOrganizationId) {
        setFetching(false);
        return;
      }

      try {
        setFetching(true);
        const { data, error } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', activeOrganizationId)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          const cfg = data.config || {};
          setFormData({
            name: data.name || '',
            reg_number: data.reg_number || '',
            cooperative_code: data.cooperative_code || '',
            logo_url: data.logo_url || cfg.logo_url || '',
            helpline_phone: cfg.helpline_phone || '',
            address: cfg.address || '',
            by_laws: cfg.by_laws || '',
            is_member_quick_actions_enabled: cfg.is_member_quick_actions_enabled !== false
          });
        }
      } catch (err: any) {
        console.error('Error fetching cooperative details:', err);
        setMessage({ text: 'সমিতির তথ্য লোড করতে সমস্যা হয়েছে', type: 'error' });
      } finally {
        setFetching(false);
      }
    };

    loadCooperativeData();
  }, [activeOrganizationId]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeOrganizationId) return;

    setUploading(true);
    setMessage({ text: '', type: '' });
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `coop_logo_${activeOrganizationId}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('branding')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('branding')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, logo_url: publicUrl }));
      setMessage({ text: 'সমিতির মনোগ্রাম সফলভাবে আপলোড হয়েছে', type: 'success' });
    } catch (error: any) {
      console.error('Upload Error:', error);
      setMessage({ 
        text: error.message || 'মনোগ্রাম আপলোডে সমস্যা হয়েছে', 
        type: 'error' 
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!activeOrganizationId) {
      setMessage({ text: 'কোনো সক্রিয় সমিতি নির্বাচিত নেই', type: 'error' });
      return;
    }

    if (!formData.name.trim()) {
      setMessage({ text: 'সমিতির নাম ফাঁকা রাখা যাবে না', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      // Fetch latest config to merge cleanly
      const { data: currentOrg } = await supabase
        .from('organizations')
        .select('config')
        .eq('id', activeOrganizationId)
        .maybeSingle();

      const existingConfig = currentOrg?.config || {};

      const updatedConfig = {
        ...existingConfig,
        helpline_phone: formData.helpline_phone,
        address: formData.address,
        by_laws: formData.by_laws,
        is_member_quick_actions_enabled: formData.is_member_quick_actions_enabled,
        logo_url: formData.logo_url
      };

      const { error } = await supabase
        .from('organizations')
        .update({
          name: formData.name.trim(),
          reg_number: formData.reg_number.trim() || null,
          logo_url: formData.logo_url || null,
          config: updatedConfig,
          updated_at: new Date().toISOString()
        })
        .eq('id', activeOrganizationId);

      if (error) throw error;

      setMessage({ text: 'সমিতির তথ্য ও সেটিংস সফলভাবে সংরক্ষিত হয়েছে', type: 'success' });
      if (fetchMemberships) {
        await fetchMemberships();
      }
    } catch (error: any) {
      console.error('Settings save error:', error);
      setMessage({ 
        text: `সংরক্ষণে সমস্যা হয়েছে: ${error.message || 'Unknown Error'}`, 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <MobileLayout headerTitle="সমিতি সেটিংস" backTo="/settings" showBack={true}>
        <div className="flex flex-col items-center justify-center p-12 gap-3 text-slate-400">
          <Loader2 className="animate-spin text-emerald-500" size={32} />
          <span className="text-sm bangla font-semibold">সমিতির তথ্য লোড হচ্ছে...</span>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout
      headerTitle="সমিতি সেটিংস ও ব্র্যান্ডিং"
      backTo="/settings"
      showBack={true}
    >
      <div className="flex flex-col gap-5 pb-8">
        
        {/* Active Cooperative Context Banner */}
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/40 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Building2 size={22} />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[14px] font-bold text-slate-800 dark:text-slate-100 bangla truncate">
              {formData.name || activeOrganization?.name || 'সমিতি'}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 bangla">
              কোড: #{formData.cooperative_code || formData.reg_number || 'N/A'} • স্বায়ত্তশাসিত কনফিগারেশন
            </span>
          </div>
        </div>

        {/* Cooperative Monogram / Logo Section */}
        <div className="dark-card rounded-[22px] p-6 flex flex-col items-center gap-4 border border-border shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="w-24 h-24 bg-slate-50 dark:bg-white/5 rounded-[28px] border-2 border-dashed border-slate-200 dark:border-white/10 flex items-center justify-center relative group shadow-inner">
            {formData.logo_url ? (
              <img src={formData.logo_url} alt="Cooperative Logo" className="w-full h-full object-contain p-3 rounded-[24px]" />
            ) : (
              <ImageIcon className="text-slate-300 dark:text-slate-600" size={32} />
            )}
            
            <label 
              className="absolute bottom-[-8px] right-[-8px] w-10 h-10 rounded-full shadow-lg flex items-center justify-center cursor-pointer border-4 border-white dark:border-[#151c2c] active:scale-90 transition-transform z-20"
              style={{ backgroundColor: theme.primary }}
              title="নতুন মনোগ্রাম আপলোড করুন"
            >
              <Upload className="text-white" size={18} />
              <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={uploading} />
            </label>
            
            {uploading && (
              <div className="absolute inset-0 bg-white/80 dark:bg-[#151c2c]/80 flex items-center justify-center rounded-[28px]">
                <Loader2 className="animate-spin text-emerald-500" size={24} />
              </div>
            )}
          </div>
          <div className="flex flex-col items-center gap-1 text-center">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bangla uppercase tracking-wider">সমিতির মনোগ্রাম / অফিসিয়াল লোগো</span>
            <span className="text-[11px] text-slate-400 bangla">সদস্য পাসবুক, রসিদ ও প্রত্যয়নপত্রে প্রদর্শিত হবে</span>
          </div>
        </div>

        {/* Basic Organization Profile */}
        <div className="dark-card rounded-[22px] p-6 flex flex-col gap-4 border border-border shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-white/5">
            <Building2 size={18} className="text-emerald-500" />
            <h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-100 bangla">প্রাথমিক পরিচিতি</h3>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-bold text-slate-500 dark:text-slate-400 bangla ml-1">সমিতির পূর্ণ নাম *</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. রূপালী সঞ্চয় ও সমবায় সমিতি"
              className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[14px] px-4 py-3 bangla text-[14px] text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold text-slate-500 dark:text-slate-400 bangla ml-1">রেজিস্ট্রেশন নম্বর</label>
              <input 
                type="text" 
                value={formData.reg_number}
                onChange={e => setFormData(p => ({ ...p, reg_number: e.target.value }))}
                placeholder="REG-2026-X"
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[14px] px-4 py-3 bangla text-[14px] text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold text-slate-500 dark:text-slate-400 bangla ml-1">সমিতি কোড</label>
              <input 
                type="text" 
                value={formData.cooperative_code}
                readOnly
                className="w-full bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 rounded-[14px] px-4 py-3 bangla text-[14px] text-slate-500 cursor-not-allowed outline-none"
              />
            </div>
          </div>
        </div>

        {/* Contact & Support Section */}
        <div className="dark-card rounded-[22px] p-6 flex flex-col gap-4 border border-border shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-white/5">
            <Phone size={18} className="text-emerald-500" />
            <h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-100 bangla">যোগাযোগ ও হেল্পলাইন</h3>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-bold text-slate-500 dark:text-slate-400 bangla ml-1">সমিতির হেল্পলাইন মোবাইল নম্বর</label>
            <div className="relative flex items-center">
              <Phone size={16} className="absolute left-3.5 text-slate-400" />
              <input 
                type="tel" 
                value={formData.helpline_phone}
                onChange={e => setFormData(p => ({ ...p, helpline_phone: e.target.value }))}
                placeholder="+880 1700-000000"
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[14px] pl-10 pr-4 py-3 bangla text-[14px] text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 transition-colors font-mono"
              />
            </div>
            <span className="text-[11px] text-slate-400 bangla ml-1">সদস্যরা তাদের সেটিংসে এই নম্বরে কল দেওয়ার সুবিধা পাবেন।</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-bold text-slate-500 dark:text-slate-400 bangla ml-1">অফিস / কার্যালয়ের ঠিকানা</label>
            <div className="relative flex items-center">
              <MapPin size={16} className="absolute left-3.5 text-slate-400 top-3.5" />
              <textarea 
                rows={2}
                value={formData.address}
                onChange={e => setFormData(p => ({ ...p, address: e.target.value }))}
                placeholder="গ্রাম/রোড, থানা, জেলা"
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[14px] pl-10 pr-4 py-3 bangla text-[14px] text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 transition-colors resize-none"
              />
            </div>
          </div>
        </div>

        {/* Society Constitution / By-laws */}
        <div className="dark-card rounded-[22px] p-6 flex flex-col gap-4 border border-border shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-white/5">
            <BookOpen size={18} className="text-emerald-500" />
            <h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-100 bangla">গঠনতন্ত্র ও নিয়মাবলী (By-Laws)</h3>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-bold text-slate-500 dark:text-slate-400 bangla ml-1">সমিতির অভ্যন্তরীণ সংবিধান ও বিধিবিধান</label>
            <textarea 
              rows={4}
              value={formData.by_laws}
              onChange={e => setFormData(p => ({ ...p, by_laws: e.target.value }))}
              placeholder="১. প্রতি মাসের ৫ তারিখের মধ্যে কিস্তি পরিশোধ বাধ্যতামূলক...&#10;২. ঋণ গ্রহণের পূর্বে ন্যূনতম ৬ মাসের সঞ্চয় থাকতে হবে..."
              className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[14px] px-4 py-3.5 bangla text-[14px] text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 transition-colors resize-y leading-relaxed"
            />
            <span className="text-[11px] text-slate-400 bangla ml-1">সদস্যরা তাদের সেটিংস মেনু থেকে যেকোনো সময় এই বিধিমালা পড়তে পারবেন।</span>
          </div>
        </div>

        {/* Member Dashboard UI Preferences */}
        <div className="dark-card rounded-[22px] p-6 flex flex-col gap-4 border border-border shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-white/5">
            <Sparkles size={18} className="text-emerald-500" />
            <h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-100 bangla">ডিসপ্লে ও ড্যাশবোর্ড প্রেফারেন্স</h3>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
            <div className="flex flex-col gap-0.5">
              <span className="text-[14px] font-bold text-slate-700 dark:text-slate-200 bangla">সদস্য কুইক একশন মেনু</span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 bangla">সদস্যদের হোম ড্যাশবোর্ডে দ্রুত কার্যক্রমের শর্টকাট দেখান</span>
            </div>
            <button 
              type="button"
              onClick={() => setFormData(p => ({ ...p, is_member_quick_actions_enabled: !p.is_member_quick_actions_enabled }))}
              className={`w-12 h-6 rounded-full relative transition-colors duration-200 ${formData.is_member_quick_actions_enabled ? '' : 'bg-slate-300 dark:bg-slate-700'}`}
              style={{ backgroundColor: formData.is_member_quick_actions_enabled ? theme.primary : undefined }}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200 ${formData.is_member_quick_actions_enabled ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </div>

        {/* Feedback Messages */}
        {message.text && (
          <motion.div 
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center gap-2.5 p-4 rounded-[16px] border ${
              message.type === 'success' 
                ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300' 
                : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300'
            }`}
          >
            {message.type === 'success' ? <CheckCircle2 size={18} className="shrink-0" /> : <AlertCircle size={18} className="shrink-0" />}
            <span className="text-[13px] bangla font-bold">{message.text}</span>
          </motion.div>
        )}

        {/* Action Button */}
        <button
          onClick={handleSave}
          disabled={loading || uploading}
          className="w-full text-white h-[56px] rounded-[20px] font-extrabold bangla text-[15px] flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 mt-2 cursor-pointer"
          style={{ backgroundColor: theme.primary }}
        >
          {loading ? <Loader2 className="animate-spin" size={22} /> : <Save size={20} strokeWidth={2.5} />}
          সমিতির সেটিংস সেভ করুন
        </button>

      </div>
    </MobileLayout>
  );
}
