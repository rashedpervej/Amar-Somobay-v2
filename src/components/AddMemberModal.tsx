import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, UserPlus, Phone, Lock, Mail, MapPin, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMemberAdded: () => void;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  isOpen,
  onClose,
  onMemberAdded,
}) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('123456');
  const [address, setAddress] = useState('');
  const [role, setRole] = useState<'member' | 'admin'>('member');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const resetForm = () => {
    setFullName('');
    setPhone('');
    setEmail('');
    setPassword('123456');
    setAddress('');
    setRole('member');
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMsg('সদস্যের নাম লিখুন।');
      return;
    }

    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 11) {
      setErrorMsg('সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 01712345678)।');
      return;
    }

    const memberEmail = email.trim() || `${cleanPhone}@somobay.local`;
    const memberPassword = password.trim() || '123456';

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase কনফিগারেশন অনুপস্থিত।');
      }

      // Temporary client with NO local session persistence so the active admin is never logged out
      const tempAuthClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      });

      const { data: authData, error: signUpError } = await tempAuthClient.auth.signUp({
        email: memberEmail,
        password: memberPassword,
        options: {
          data: {
            full_name: fullName.trim(),
            phone: cleanPhone,
            address: address.trim(),
          },
        },
      });

      if (signUpError) {
        if (signUpError.message?.toLowerCase().includes('already registered')) {
          throw new Error('এই মোবাইল বা ইমেইলে সদস্য ইতিমধ্যে নিবন্ধিত আছেন।');
        }
        throw signUpError;
      }

      const newUserId = authData.user?.id;
      if (newUserId) {
        // Update profile in database with admin privileges
        await supabase
          .from('profiles')
          .update({
            full_name: fullName.trim(),
            phone: cleanPhone,
            role: role,
            status: 'active',
            bio: address.trim() || null,
          } as any)
          .eq('id', newUserId);

        // Bind member to active organization
        const activeOrgId = useAuthStore.getState().activeOrganizationId;
        if (activeOrgId) {
          await supabase
            .from('organization_members')
            .upsert({
              organization_id: activeOrgId,
              user_id: newUserId,
              role: role === 'admin' ? 'cooperative_admin' : 'member',
              status: 'active',
            }, { onConflict: 'organization_id,user_id' });
        }
      }

      setSuccessMsg(`সদস্য "${fullName}" সফলভাবে যোগ করা হয়েছে!`);
      setTimeout(() => {
        onMemberAdded();
        handleClose();
      }, 1000);
    } catch (err: any) {
      console.error('Add member error:', err);
      setErrorMsg(err.message || 'সদস্য যোগ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ y: 500, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 500, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-[440px] bg-white dark:bg-slate-900 rounded-t-[36px] sm:rounded-[32px] p-6 sm:p-7 relative z-10 max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-100 dark:border-white/10"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-sm">
                  <UserPlus size={22} />
                </div>
                <div>
                  <h3 className="text-[18px] font-bold text-slate-800 dark:text-slate-100 bangla">
                    নতুন সদস্য নিবন্ধন
                  </h3>
                  <p className="text-[11px] text-slate-400 bangla">
                    সরাসরি ম্যানুয়ালি সদস্য একাউন্ট তৈরি করুন
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-[13px] bangla flex items-center gap-2">
                <AlertCircle size={18} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[13px] bangla flex items-center gap-2">
                <CheckCircle2 size={18} className="shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-slate-600 dark:text-slate-400 bangla ml-1">
                  পূর্ণ নাম <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="যেমন: মোঃ রফিকুল ইসলাম"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-[14px] text-slate-800 dark:text-slate-100 outline-none focus:border-primary transition-all bangla"
                  required
                />
              </div>

              {/* Mobile Phone */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-slate-600 dark:text-slate-400 bangla ml-1">
                  মোবাইল নম্বর <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="tel"
                    placeholder="01712345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-4 pl-12 pr-4 text-[14px] text-slate-800 dark:text-slate-100 outline-none focus:border-primary transition-all font-mono"
                    required
                  />
                </div>
              </div>

              {/* Password / PIN */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-slate-600 dark:text-slate-400 bangla ml-1">
                    পাসওয়ার্ড বা পিন
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      placeholder="123456"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-3.5 pl-10 pr-3 text-[13px] text-slate-800 dark:text-slate-100 outline-none focus:border-primary transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-slate-600 dark:text-slate-400 bangla ml-1">
                    রোল (Role)
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-3.5 text-[13px] text-slate-800 dark:text-slate-100 outline-none focus:border-primary transition-all bangla font-bold"
                  >
                    <option value="member">সাধারণ সদস্য</option>
                    <option value="admin">সহকারী অ্যাডমিন</option>
                  </select>
                </div>
              </div>

              {/* Email (Optional) */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[12px] font-bold text-slate-600 dark:text-slate-400 bangla">
                    ইমেইল (ঐচ্ছিক)
                  </label>
                  <span className="text-[10px] text-slate-400 bangla">না দিলে স্বয়ংক্রিয় তৈরি হবে</span>
                </div>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-4 pl-12 pr-4 text-[13px] text-slate-800 dark:text-slate-100 outline-none focus:border-primary transition-all"
                  />
                </div>
              </div>

              {/* Address / Note */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-slate-600 dark:text-slate-400 bangla ml-1">
                  ঠিকানা বা নোট (ঐচ্ছিক)
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="গ্রাম/রোড, পোস্ট, থানা"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-4 pl-12 pr-4 text-[13px] text-slate-800 dark:text-slate-100 outline-none focus:border-primary transition-all bangla"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-primary text-white font-bold text-[15px] bangla rounded-2xl shadow-lg shadow-primary/20 hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>সদস্য নিবন্ধন হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={18} />
                      <span>সদস্য সংরক্ষণ করুন</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
