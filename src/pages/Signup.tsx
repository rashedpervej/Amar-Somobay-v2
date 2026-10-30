import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Mail, Lock, User, UserPlus, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';

export default function Signup() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;
      navigate('/pending');
    } catch (err: any) {
      setError(err.message || 'সাইন আপ করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mobile-container min-h-screen bg-bg-soft p-5 flex flex-col justify-between">
      <div>
        {/* Top Header with Back Button */}
        <div className="flex items-center gap-3 pt-4 mb-6">
          <button 
            type="button"
            onClick={() => navigate('/login')}
            className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center text-text-primary active:scale-95 transition-all shadow-sm"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-[20px] font-bold text-text-primary bangla">নতুন সদস্য নিবন্ধন</h1>
        </div>

        {/* Card Container */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[20px] p-6 border border-border shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
        >
          <div className="mb-6">
            <h2 className="text-[18px] font-bold text-text-primary bangla">একাউন্ট তৈরি করুন</h2>
            <p className="text-[12px] text-text-secondary bangla mt-1">আপনার প্রয়োজনীয় তথ্য দিয়ে সদস্য হিসেবে যুক্ত হন</p>
          </div>

          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-text-primary bangla ml-1">পূর্ণ নাম</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="আপনার নাম লিখুন"
                  className="w-full bg-bg-soft border border-border rounded-[12px] py-3.5 pl-10 pr-3 outline-none text-[14px] text-text-primary bangla focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-text-primary bangla ml-1">ইমেইল ঠিকানা</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@mail.com"
                  className="w-full bg-bg-soft border border-border rounded-[12px] py-3.5 pl-10 pr-3 outline-none text-[14px] text-text-primary focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-text-primary bangla ml-1">পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-bg-soft border border-border rounded-[12px] py-3.5 pl-10 pr-3 outline-none text-[14px] text-text-primary font-mono focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-[#DC2626] bg-[#DC2626]/5 p-3 rounded-[12px] border border-[#DC2626]/20 text-[12px] bangla font-medium">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-[48px] bg-primary hover:bg-primary-dark text-white rounded-[12px] font-bold text-[15px] bangla shadow-md shadow-[#087F5B]/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <span>নিবন্ধন সম্পন্ন করুন</span>
                  <UserPlus size={18} />
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>

      <div className="py-6 text-center">
        <p className="text-text-secondary text-[13px] bangla">
          ইতিমধ্যে একাউন্ট আছে?{' '}
          <Link to="/login" className="font-bold text-primary hover:underline ml-1">
            লগইন করুন
          </Link>
        </p>
      </div>
    </div>
  );
}
