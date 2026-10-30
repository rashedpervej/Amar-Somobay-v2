import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '../components/layout/MobileLayout';
import { useAuthStore } from '../store/useAuthStore';
import { useTheme } from '../components/ThemeProvider';
import { supabase } from '../lib/supabase';
import { 
  ChevronLeft, 
  Lock, 
  Shield, 
  Loader2, 
  CheckCircle2,
  Save,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';

export default function Security() {
  const navigate = useNavigate();
  const { user, updatePassword } = useAuthStore();
  const theme = useTheme();
  
  const [loading, setLoading] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.oldPassword || !formData.newPassword || !formData.confirmPassword) {
      setMessage({ text: 'সবগুলো ঘর পূরণ করুন', type: 'error' });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ text: 'নতুন পাসওয়ার্ড দুটি মিলছে না', type: 'error' });
      return;
    }

    if (formData.newPassword.length < 6) {
      setMessage({ text: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে', type: 'error' });
      return;
    }
    
    setLoading(true);
    setMessage({ text: '', type: '' });
    
    try {
      // 1. Verify old password by attempting sign in
      if (!user?.email) throw new Error('User email not found');
      
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: formData.oldPassword
      });

      if (signInError) {
        throw new Error('পুরাতন পাসওয়ার্ডটি সঠিক নয়');
      }

      // 2. Update to new password
      await updatePassword(formData.newPassword);

      setMessage({ text: 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে', type: 'success' });
      setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => navigate('/settings'), 1500);
    } catch (err: any) {
      setMessage({ text: err.message || 'Error updating password', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileLayout
      headerTitle="নিরাপত্তা ও পাসওয়ার্ড"
      showBack={true}
    >
      <div className="flex flex-col gap-4">
        {/* Info Card */}
        <div className="bg-amber-50 border border-amber-200 rounded-[16px] p-4 flex gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 text-amber-700">
            <AlertCircle size={18} />
          </div>
          <div className="flex flex-col">
            <h3 className="text-[13px] font-bold text-amber-900 bangla">সতর্কবার্তা</h3>
            <p className="text-[12px] text-amber-800 bangla mt-0.5 leading-relaxed">
              পাসওয়ার্ড পরিবর্তনের জন্য বর্তমান পাসওয়ার্ড প্রয়োজন। নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।
            </p>
          </div>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSave} className="flex flex-col gap-4 pb-10">
          <div className="bg-white rounded-[20px] p-4.5 border border-border shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col gap-4">

            {/* Old Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-slate-700 bangla">পুরাতন পাসওয়ার্ড</label>
              <div className="relative flex items-center">
                <input 
                  type={showOld ? "text" : "password"} 
                  value={formData.oldPassword}
                  onChange={e => setFormData(p => ({ ...p, oldPassword: e.target.value }))}
                  placeholder="বর্তমান পাসওয়ার্ড লিখুন"
                  className="w-full bg-bg-soft border border-border rounded-xl px-3.5 py-3 pl-10 pr-10 text-[14px] outline-none text-slate-800 focus:border-primary"
                />
                <Lock className="absolute left-3.5 text-slate-400" size={16} />
                <button 
                  type="button"
                  onClick={() => setShowOld(!showOld)}
                  className="absolute right-3.5 text-slate-400 hover:text-slate-600"
                >
                  {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-slate-700 bangla">নতুন পাসওয়ার্ড</label>
              <div className="relative flex items-center">
                <input 
                  type={showNew ? "text" : "password"} 
                  value={formData.newPassword}
                  onChange={e => setFormData(p => ({ ...p, newPassword: e.target.value }))}
                  placeholder="কমপক্ষে ৬ অক্ষরের নতুন পাসওয়ার্ড"
                  className="w-full bg-bg-soft border border-border rounded-xl px-3.5 py-3 pl-10 pr-10 text-[14px] outline-none text-slate-800 focus:border-primary"
                />
                <Lock className="absolute left-3.5 text-slate-400" size={16} />
                <button 
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3.5 text-slate-400 hover:text-slate-600"
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-slate-700 bangla">নতুন পাসওয়ার্ড নিশ্চিত করুন</label>
              <div className="relative flex items-center">
                <input 
                  type="password" 
                  value={formData.confirmPassword}
                  onChange={e => setFormData(p => ({ ...p, confirmPassword: e.target.value }))}
                  placeholder="নতুন পাসওয়ার্ড পুনরায় লিখুন"
                  className="w-full bg-bg-soft border border-border rounded-xl px-3.5 py-3 pl-10 text-[14px] outline-none text-slate-800 focus:border-primary"
                />
                <Lock className="absolute left-3.5 text-slate-400" size={16} />
              </div>
            </div>
          </div>

          {message.text && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`flex items-center gap-2 p-3 rounded-xl border text-[13px] bangla font-semibold ${
                message.type === 'success' 
                  ? 'bg-emerald-50 border-emerald-200 text-primary' 
                  : 'bg-rose-50 border-rose-200 text-[#DC2626]'
              }`}
            >
              {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{message.text}</span>
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-dark text-white py-3.5 px-4 rounded-[16px] font-semibold text-[15px] bangla flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={18} />}
            <span>পাসওয়ার্ড আপডেট করুন</span>
          </button>
        </form>
      </div>
    </MobileLayout>
  );
}
