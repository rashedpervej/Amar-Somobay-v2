import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { Mail, Lock, Phone, AlertCircle, Loader2, ArrowRight, Eye, EyeOff, Sprout } from 'lucide-react';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [useEmailMode, setUseEmailMode] = useState(false);
  const { signInWithEmail, user, loading: authLoading } = useAuthStore();
  const { settings, loading: settingsLoading } = useSettingsStore();
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const loading = authLoading || settingsLoading;

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanInput = identifier.trim();
    if (!cleanInput) {
      setError('মোবাইল নম্বর অথবা ইমেইল দিন');
      return;
    }

    // Support both phone number and email
    let finalEmail = cleanInput;
    if (!cleanInput.includes('@')) {
      const cleanPhone = cleanInput.replace(/\D/g, '');
      finalEmail = `${cleanPhone}@somobay.local`;
    }

    try {
      await signInWithEmail(finalEmail, password);
    } catch (err: any) {
      setError(err.message?.includes('Invalid') ? 'মোবাইল নম্বর/ইমেইল বা পাসওয়ার্ড ভুল হয়েছে।' : (err.message || 'লগইন করতে সমস্যা হয়েছে।'));
    }
  };

  if (settingsLoading) {
    return (
      <div className="mobile-container flex items-center justify-center min-h-screen bg-bg-soft">
        <Loader2 className="animate-spin text-primary" size={36} />
      </div>
    );
  }

  return (
    <div className="mobile-container min-h-screen bg-bg-soft flex flex-col justify-between">
      {/* Top Visual Graphic & Logo */}
      <div className="relative w-full bg-gradient-to-b from-[#E8F7F1]/80 via-[#F8FAFC] to-[#F8FAFC] pt-12 pb-6 px-6 flex flex-col items-center">
        {/* Decorative Nature Motif */}
        <div className="w-20 h-20 rounded-full bg-white shadow-md border border-border p-4 flex items-center justify-center mb-4 relative">
          <div className="w-14 h-14 rounded-full bg-primary-light flex items-center justify-center overflow-hidden">
            <img
              src={settings?.logo_url || '/icon.svg'}
              alt="Logo"
              className="w-10 h-10 object-contain"
            />
          </div>
        </div>

        <h1 className="text-[22px] font-bold text-text-primary bangla tracking-tight text-center">
          {settings?.app_name || 'গ্রামীণ সমবায় সমিতি'}
        </h1>
        <p className="text-[13px] text-primary bangla font-semibold mt-1 text-center">
          {settings?.app_tagline || 'একসাথে সঞ্চয়, সমৃদ্ধ আগামী'}
        </p>
      </div>

      {/* Main Login Card */}
      <div className="flex-1 px-5 pb-8 flex flex-col justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[20px] p-6 border border-border shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex flex-col gap-5"
        >
          <div className="text-center">
            <h2 className="text-[18px] font-bold text-text-primary bangla">লগইন করুন</h2>
            <p className="text-[12px] text-text-secondary bangla mt-1">
              আপনার একাউন্টে সহজে লগইন করতে তথ্য দিন
            </p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            {/* Phone or Email Input */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-text-primary bangla">
                {useEmailMode ? 'ইমেইল ঠিকানা' : 'মোবাইল নম্বর'}
              </label>
              
              {!useEmailMode ? (
                <div className="flex items-center bg-bg-soft border border-border rounded-[12px] overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-[#087F5B]/10 transition-all">
                  <div className="flex items-center gap-1.5 px-3 py-3.5 bg-white border-r border-border text-[13px] font-bold text-text-primary">
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 tracking-wider">BD</span>
                    <span>+880</span>
                  </div>
                  <input
                    type="tel"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="flex-1 bg-transparent px-3 py-3.5 outline-none text-[14px] text-text-primary font-mono"
                    required
                  />
                </div>
              ) : (
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                  <input
                    type="email"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-bg-soft border border-border rounded-[12px] py-3.5 pl-10 pr-3 outline-none text-[14px] text-text-primary focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                    required
                  />
                </div>
              )}
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[12px] font-semibold text-text-primary bangla">পাসওয়ার্ড বা পিন</label>
                <button
                  type="button"
                  onClick={() => setUseEmailMode(!useEmailMode)}
                  className="text-[11px] font-semibold text-primary bangla hover:underline"
                >
                  {useEmailMode ? 'মোবাইল দিয়ে লগইন' : 'ইমেইল দিয়ে লগইন'}
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-bg-soft border border-border rounded-[12px] py-3.5 pl-10 pr-10 outline-none text-[14px] text-text-primary focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-[#DC2626] bg-[#DC2626]/5 p-3 rounded-[12px] border border-[#DC2626]/20 text-[12px] bangla font-medium">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[48px] bg-primary hover:bg-primary-dark text-white rounded-[12px] font-bold text-[15px] bangla shadow-md shadow-[#087F5B]/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
            >
              {authLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <span>লগইন করুন</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Divider "অথবা" */}
          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-[1px] bg-[#E2E8F0]" />
            <span className="text-[11px] text-text-secondary bangla font-medium">অথবা</span>
            <div className="flex-1 h-[1px] bg-[#E2E8F0]" />
          </div>

          {/* Secondary Action: New Member Registration */}
          <Link
            to="/signup"
            className="w-full h-[46px] bg-white border border-primary text-primary hover:bg-primary-light/50 rounded-[12px] font-bold text-[14px] bangla active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            নতুন সদস্য নিবন্ধন
          </Link>
        </motion.div>
      </div>

      {/* Footer Info */}
      <div className="py-4 text-center border-t border-border bg-white">
        <div className="flex justify-center items-center gap-4 text-[12px] text-text-secondary bangla font-medium">
          <button type="button" className="hover:text-primary">সমিতি সম্পর্কে</button>
          <span>•</span>
          <button type="button" className="hover:text-primary">সহায়তা</button>
          <span>•</span>
          <button type="button" className="hover:text-primary">যোগাযোগ</button>
        </div>
        <p className="text-[10px] text-text-secondary/70 bangla mt-1">
          {settings?.organization_name || 'গ্রামীণ সমিতি লিমিটেড'} • ভার্সন ১.০.০
        </p>
      </div>
    </div>
  );
}
