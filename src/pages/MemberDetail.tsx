import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MobileLayout } from '../components/layout/MobileLayout';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useTheme } from '../components/ThemeProvider';
import { 
  User, 
  Mail, 
  Calendar, 
  ChevronLeft, 
  Shield, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  History,
  TrendingUp,
  Plus,
  Download,
  Printer,
  FileSpreadsheet,
  Receipt
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QuickCollectModal } from '../components/QuickCollectModal';
import { ReceiptModal, ReceiptData } from '../components/ReceiptModal';

interface MemberProfile {
  id: string;
  full_name: string;
  email: string;
  role: 'admin' | 'member' | 'pending';
  created_at: string;
  avatar_url?: string;
  bio?: string;
}

export default function MemberDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const currentUser = useAuthStore(state => state.profile);
  const settings = useSettingsStore(state => state.settings);
  
  const [member, setMember] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingRole, setPendingRole] = useState<'admin' | 'member' | 'pending' | null>(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  // Quick collection and receipt states
  const [showQuickCollect, setShowQuickCollect] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [memberPlansList, setMemberPlansList] = useState<any[]>([]);
  const [ledgerPayments, setLedgerPayments] = useState<any[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'transactions' | 'loans' | 'fines'>('summary');

  const isAdmin = currentUser?.role === 'admin';

  const fetchMemberActivePlans = async (memberId: string) => {
    try {
      const { data } = await supabase
        .from('member_plans')
        .select(`
          id,
          total_collected,
          pending_fine,
          next_due_date,
          status,
          plan:somobay_plans(id, name, installment_amount, frequency, scheme_type)
        `)
        .eq('member_id', memberId)
        .eq('status', 'active');
      setMemberPlansList(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMemberLedger = async (memberId: string) => {
    try {
      setLedgerLoading(true);
      const { data, error } = await supabase
        .from('plan_payments')
        .select(`
          id,
          amount,
          penalty_paid,
          payment_date,
          created_at,
          note,
          type,
          admin_id,
          member_plans!inner(
            id,
            member_id,
            plan:somobay_plans(id, name, scheme_type)
          )
        `)
        .eq('member_plans.member_id', memberId)
        .order('payment_date', { ascending: true });

      if (error) {
        console.error('Error fetching member ledger:', error);
      } else {
        setLedgerPayments(data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLedgerLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        navigate('/members');
      } else {
        setMember(data);
        fetchMemberActivePlans(id);
        fetchMemberLedger(id);
      }
      setLoading(false);
    };

    loadData();
  }, [id, navigate]);

  const confirmRoleChange = (newRole: 'admin' | 'member' | 'pending') => {
    setPendingRole(newRole);
    setShowConfirm(true);
  };

  const handleRoleChange = async () => {
    if (!id || !member || !pendingRole) return;
    setUpdating(true);
    setMessage({ text: '', type: '' });
    setShowConfirm(false);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: pendingRole })
        .eq('id', id);

      if (error) throw error;
      
      setMember({ ...member, role: pendingRole });
      setMessage({ text: 'রোল সফলভাবে পরিবর্তন করা হয়েছে', type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.message || 'Error updating role', type: 'error' });
    } finally {
      setUpdating(false);
      setPendingRole(null);
    }
  };

  const ledgerRows = useMemo(() => {
    let running = 0;
    return ledgerPayments.map((p) => {
      const amt = Number(p.amount) || 0;
      running += amt;
      return {
        ...p,
        runningBalance: running,
      };
    }).reverse();
  }, [ledgerPayments]);

  const totalNetDeposit = ledgerPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const totalFinesPaid = ledgerPayments.reduce((sum, p) => sum + (Number(p.penalty_paid) || 0), 0);

  const handleDownloadLedgerCSV = () => {
    const BOM = '\uFEFF';
    const headers = ['তারিখ', 'প্ল্যান / বিবরণ', 'ধরন', 'জমা (৳)', 'জরিমানা (৳)', 'চলমান স্থিতি (৳)', 'নোট'];
    const rows = ledgerRows.map(r => [
      r.payment_date || new Date(r.created_at).toLocaleDateString('bn-BD'),
      r.member_plans?.plan?.name || 'সমিতি',
      r.type === 'installment_payment' ? 'কিস্তি জমা' : r.type === 'fine_payment' ? 'জরিমানা' : 'সমন্বয়',
      r.amount,
      r.penalty_paid || 0,
      r.runningBalance,
      r.note || ''
    ]);
    const csvContent = BOM + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `khotian_${member?.full_name || 'member'}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <MobileLayout>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </MobileLayout>
    );
  }

  if (!member) return null;

  return (
    <MobileLayout
      headerTitle="সদস্য বিবরণ"
      backTo="/members"
      showBack={true}
    >
      {/* Member Identity Header Card (Screen 6) */}
      <div className="bg-white rounded-[20px] p-4 border border-border shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex items-center gap-3.5">
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-primary border-2 border-emerald-100 flex items-center justify-center font-bold text-[20px] shrink-0 overflow-hidden shadow-sm">
          {member.avatar_url ? (
            <img src={member.avatar_url} alt={member.full_name} className="w-full h-full object-cover" />
          ) : (
            <span>{member.full_name?.substring(0, 1) || 'স'}</span>
          )}
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <h2 className="text-[17px] font-bold text-slate-800 bangla leading-tight truncate">{member.full_name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[12px] font-medium text-slate-400">SM-{member.id.substring(0, 3).toUpperCase()}</span>
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bangla bg-primary-light text-primary border border-emerald-200">
              {member.role === 'admin' ? 'অ্যাডমিন' : member.role === 'member' ? 'সক্রিয়' : 'অপেক্ষমান'}
            </span>
          </div>
        </div>
      </div>

      {/* Segmented Tabs (Screen 6: সারসংক্ষেপ, লেনদেন, ঋণ, জরিমানা) */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-[14px] text-[12px] font-semibold bangla">
        {[
          { id: 'summary', label: 'সারসংক্ষেপ' },
          { id: 'transactions', label: 'লেনদেন' },
          { id: 'loans', label: 'ঋণ' },
          { id: 'fines', label: 'জরিমানা' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-2 rounded-[10px] transition-all text-center ${
              activeTab === tab.id
                ? 'bg-white text-primary font-bold shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content: সারসংক্ষেপ (Screen 6 Details Card) */}
      {activeTab === 'summary' && (
        <div className="bg-white rounded-[20px] p-4 border border-border shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col divide-y divide-slate-100 text-[13px] bangla">
          <div className="py-2.5 flex items-center justify-between first:pt-0">
            <span className="text-slate-500 font-medium">মোবাইল</span>
            <span className="font-semibold text-slate-800">{member.phone || member.email || 'প্রযোজ্য নয়'}</span>
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <span className="text-slate-500 font-medium">যোগদানের তারিখ</span>
            <span className="font-semibold text-slate-800">
              {new Date(member.created_at).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <span className="text-slate-500 font-medium">সমিতি</span>
            <span className="font-semibold text-slate-800">{memberPlansList[0]?.plan?.name || 'কোনো প্ল্যান নেই'}</span>
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <span className="text-slate-500 font-medium">মাসিক সঞ্চয়</span>
            <span className="font-semibold text-slate-800">
              ৳{(memberPlansList[0]?.plan?.installment_amount || 0).toLocaleString('bn-BD')}
            </span>
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <span className="text-slate-500 font-medium">মোট সঞ্চয়</span>
            <span className="font-bold text-primary">
              ৳{totalNetDeposit.toLocaleString('bn-BD')}
            </span>
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <span className="text-slate-500 font-medium">চলমান ঋণ</span>
            <span className="font-bold text-slate-700">৳০</span>
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <span className="text-slate-500 font-medium">বকেয়া কিস্তি</span>
            <span className="font-semibold text-slate-800">
              ৳{(memberPlansList.reduce((s, mp) => s + (mp.pending_fine || 0), 0)).toLocaleString('bn-BD')}
            </span>
          </div>

          <div className="py-2.5 flex items-center justify-between last:pb-0">
            <span className="text-slate-500 font-medium">জরিমানা</span>
            <span className="font-semibold text-slate-800">৳{(totalFinesPaid || 0).toLocaleString('bn-BD')}</span>
          </div>
        </div>
      )}

        {/* Unified Member Financial Ledger / খতিয়ান */}
        {member.role !== 'pending' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4, ease: "easeOut" }}
            className="flex flex-col gap-[14px] mb-6"
          >
            <div className="flex justify-between items-center px-2">
              <div className="flex items-center gap-2">
                <Receipt size={18} className="text-primary" />
                <h3 className="text-[14px] font-bold text-slate-700 dark:text-slate-300 bangla uppercase tracking-wider">
                  আর্থিক খতিয়ান (Ledger)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadLedgerCSV}
                  disabled={ledgerRows.length === 0}
                  className="p-2 px-3 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 active:scale-95 transition-all text-xs font-bold bangla flex items-center gap-1 disabled:opacity-40"
                  title="CSV ডাউনলোড করুন"
                >
                  <Download size={14} />
                  <span>CSV</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="p-2 px-3 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 active:scale-95 transition-all text-xs font-bold bangla flex items-center gap-1"
                  title="প্রিন্ট করুন"
                >
                  <Printer size={14} />
                  <span>প্রিন্ট</span>
                </button>
              </div>
            </div>

            {/* Ledger Overview Mini-Stats */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="dark-card rounded-[20px] p-3 text-center border border-slate-100 dark:border-white/5">
                <span className="text-[10px] text-slate-400 bangla block font-medium">মোট নিট জমা</span>
                <span className="text-[15px] font-black text-emerald-600 dark:text-emerald-400 bangla">
                  ৳{totalNetDeposit.toLocaleString()}
                </span>
              </div>
              <div className="dark-card rounded-[20px] p-3 text-center border border-slate-100 dark:border-white/5">
                <span className="text-[10px] text-slate-400 bangla block font-medium">জরিমানা প্রদান</span>
                <span className="text-[15px] font-black text-rose-500 bangla">
                  ৳{totalFinesPaid.toLocaleString()}
                </span>
              </div>
              <div className="dark-card rounded-[20px] p-3 text-center border border-slate-100 dark:border-white/5">
                <span className="text-[10px] text-slate-400 bangla block font-medium">মোট লেনদেন</span>
                <span className="text-[15px] font-black text-slate-800 dark:text-slate-100 bangla">
                  {ledgerRows.length.toLocaleString('bn-BD')} টি
                </span>
              </div>
            </div>

            {/* Ledger Transaction Stream */}
            <div className="dark-card rounded-[26px] p-4 sm:p-5 flex flex-col gap-3 border border-slate-100 dark:border-white/5">
              {ledgerLoading ? (
                <div className="py-8 flex justify-center items-center gap-2 text-slate-400 bangla text-xs">
                  <Loader2 size={16} className="animate-spin text-primary" />
                  <span>খতিয়ান লোড হচ্ছে...</span>
                </div>
              ) : ledgerRows.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-white/5">
                  {ledgerRows.map((entry) => {
                    const isFine = entry.type === 'fine' || entry.type === 'fine_payment';
                    const isCredit = Number(entry.amount) > 0;
                    
                    return (
                      <div key={entry.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold bangla ${
                              isCredit ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' :
                              isFine ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' :
                              'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
                            }`}>
                              {entry.type === 'installment_payment' ? 'কিস্তি জমা' :
                               entry.type === 'fine_payment' ? 'জরিমানা আদায়' :
                               entry.type === 'waiver' ? 'জরিমানা মওকুফ' :
                               entry.type === 'refund' ? 'রিফান্ড' : 'সমন্বয়'}
                            </span>
                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 bangla truncate">
                              {entry.member_plans?.plan?.name || 'সমিতি'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 bangla">
                            <span>{entry.payment_date || new Date(entry.created_at).toLocaleDateString('bn-BD')}</span>
                            {entry.note && <span className="truncate max-w-[150px]">• {entry.note}</span>}
                          </div>
                        </div>

                        <div className="flex flex-col items-end shrink-0">
                          <span className={`text-[14px] font-black bangla ${isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                            {isCredit ? `+৳${Math.abs(entry.amount).toLocaleString()}` : `-৳${Math.abs(entry.amount).toLocaleString()}`}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 bangla">
                            স্থিতি: ৳{entry.runningBalance.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs bangla">
                  এখনও কোনো লেনদেনের রেকর্ড পাওয়া যায়নি।
                </div>
              )}
            </div>
          </motion.div>
        )}



        {/* Info List */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4, ease: "easeOut" }}
          className="flex flex-col gap-[14px] mb-6"
        >
          <h3 className="text-[14px] font-bold text-slate-400 dark:text-slate-600 bangla px-2 uppercase tracking-widest">তথ্যসমূহ</h3>
          
          <div className="dark-card rounded-[28px] overflow-hidden divide-y divide-slate-100 dark:divide-white/5">
            <div className="p-5 flex items-center gap-4 text-neutral-800">
              <div className="bg-amber-50 dark:bg-amber-500/10 p-3 rounded-[16px] text-amber-500">
                <Shield size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 bangla uppercase font-bold tracking-wider">পরিচিতি (Bio)</span>
                <span className="text-[14px] font-bold text-slate-700 dark:text-slate-200 bangla leading-relaxed">
                  {member.bio || 'কোন পরিচিতি যোগ করা হয়নি'}
                </span>
              </div>
            </div>

            <div className="p-5 flex items-center gap-4 text-neutral-800">
              <div className="bg-blue-50 dark:bg-blue-500/10 p-3 rounded-[16px] text-blue-500">
                <Mail size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 bangla uppercase font-bold tracking-wider">ইমেইল ঠিকানা</span>
                <span className="text-[15px] font-bold text-slate-700 dark:text-slate-200">{member.email}</span>
              </div>
            </div>

            <div className="p-5 flex items-center gap-4">
              <div className="bg-purple-50 dark:bg-purple-500/10 p-3 rounded-[16px] text-purple-500">
                <Calendar size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 bangla uppercase font-bold tracking-wider">নিবন্ধনের তারিখ</span>
                <span className="text-[15px] font-bold text-slate-700 dark:text-slate-200">
                  {new Date(member.created_at).toLocaleDateString('bn-BD', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Admin Controls */}
        {isAdmin && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4, ease: "easeOut" }}
            className="flex flex-col gap-[14px] pb-10"
          >
            <h3 className="text-[14px] font-bold text-slate-400 dark:text-slate-600 bangla px-2 uppercase tracking-widest">অ্যাডমিন কন্ট্রোল</h3>
            
            <div className="dark-card rounded-[28px] p-6 flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                <span className="text-[13px] font-bold text-slate-500 dark:text-slate-400 bangla ml-1">রোল পরিবর্তন করুন</span>
                <div className="flex flex-wrap gap-2">
                  {member.role === 'pending' && (
                    <button
                      onClick={() => confirmRoleChange('member')}
                      disabled={updating}
                      className="flex-1 py-4 px-4 rounded-[18px] bangla text-[14px] font-bold transition-all bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-white/5 active:scale-[0.98]"
                    >
                      সদস্য হিসেবে অনুমোদন দিন
                    </button>
                  )}
                  {member.role === 'member' && (
                    <button
                      onClick={() => confirmRoleChange('pending')}
                      disabled={updating}
                      className="flex-1 py-4 px-4 rounded-[18px] bangla text-[14px] font-bold transition-all bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 border border-amber-100 dark:border-amber-500/20 active:scale-[0.98]"
                    >
                      সদস্যপদ বাতিল করুন
                    </button>
                  )}
                  {member.role === 'admin' && (
                    <div className="flex-1 p-5 bg-amber-50 dark:bg-amber-500/5 rounded-[18px] border border-amber-100 dark:border-amber-500/10 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                        <Shield size={18} className="text-amber-600 dark:text-amber-500" />
                      </div>
                      <span className="text-[14px] font-bold text-slate-700 dark:text-slate-400 bangla">অ্যাডমিন রোল পরিবর্তনযোগ্য নয়</span>
                    </div>
                  )}
                </div>
              </div>

              {message.text && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`flex items-center gap-3 p-4 rounded-[18px] border ${
                    message.type === 'success' 
                      ? 'bg-primary/10 border-primary/20 text-primary' 
                      : 'bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20 text-red-500'
                  }`}
                >
                  {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                  <span className="text-[13px] bangla font-bold">{message.text}</span>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* Confirmation Modal */}
        <AnimatePresence>
          {showConfirm && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowConfirm(false)}
                className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="bg-white dark:bg-[#1e293b] w-full max-w-[340px] rounded-[40px] p-8 shadow-2xl relative z-10 border border-slate-100 dark:border-white/10 flex flex-col items-center text-center"
              >
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
                  style={{ backgroundColor: `${theme.primary}1A` }}
                >
                  <Shield size={32} style={{ color: theme.primary }} />
                </div>
                
                <h3 className="text-[20px] font-bold text-slate-800 dark:text-slate-100 bangla mb-3">আপনি কি নিশ্চিত?</h3>
                <p className="text-[14px] text-slate-500 dark:text-slate-400 bangla leading-relaxed mb-8">
                  আপনি কি এই সদস্যের রোল <span className="font-bold underline" style={{ color: theme.primary }}>
                    {pendingRole === 'admin' ? 'অ্যাডমিন' : pendingRole === 'member' ? 'সদস্য' : 'অপেক্ষমান'}
                  </span> হিসেবে পরিবর্তন করতে চান?
                </p>

                <div className="flex flex-col w-full gap-3">
                  <button
                    onClick={handleRoleChange}
                    className="w-full text-white py-4 rounded-2xl font-bold bangla text-[16px] shadow-lg active:scale-[0.98] transition-all cursor-pointer"
                    style={{ backgroundColor: theme.primary, boxShadow: `0 12px 24px -6px ${theme.primary}60` }}
                  >
                    হ্যাঁ, পরিবর্তন করুন
                  </button>
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="w-full bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 py-4 rounded-2xl font-bold bangla text-[16px] active:scale-[0.98] transition-all cursor-pointer"
                  >
                    বাতিল করুন
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      {/* Floating Bottom Actions (Screen 6: সম্পাদনা + লেনদেন যুক্ত করুন) */}
      <div className="fixed bottom-[70px] left-1/2 -translate-x-1/2 w-full max-w-[430px] px-4 py-2 bg-white/95 backdrop-blur-md border-t border-border z-40 flex items-center gap-3">
        <button
          onClick={() => navigate('/settings/profile')}
          className="flex-1 h-[46px] rounded-[14px] bg-white border border-primary text-primary font-bold text-[14px] bangla active:scale-[0.98] transition-all shadow-sm flex items-center justify-center gap-1.5"
        >
          সম্পাদনা
        </button>
        <button
          onClick={() => setShowQuickCollect(true)}
          className="flex-1 h-[46px] rounded-[14px] bg-primary text-white font-bold text-[14px] bangla active:scale-[0.98] transition-all shadow-md shadow-emerald-700/20 flex items-center justify-center gap-1.5"
        >
          <Plus size={16} />
          লেনদেন যুক্ত করুন
        </button>
      </div>

      {/* Quick Collect Modal */}
      <QuickCollectModal
        isOpen={showQuickCollect}
        onClose={() => setShowQuickCollect(false)}
          preSelectedMemberId={id}
          onPaymentSuccess={(receipt) => {
            setReceiptData(receipt);
            if (id) {
              fetchMemberActivePlans(id);
              fetchMemberLedger(id);
            }
          }}
        />

        {/* Shareable Receipt Voucher Modal */}
        <ReceiptModal
          isOpen={!!receiptData}
          onClose={() => setReceiptData(null)}
          data={receiptData}
        />
    </MobileLayout>
  );
}
