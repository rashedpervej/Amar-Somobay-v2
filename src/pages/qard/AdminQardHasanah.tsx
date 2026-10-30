import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '../../components/layout/MobileLayout';
import { useAuthStore } from '../../store/useAuthStore';
import { useTheme } from '../../components/ThemeProvider';
import { 
  qardHasanahService, 
  QardFundSummary, 
  QardApplication, 
  QardLoan, 
  QardRepayment,
  formatBnCurrency, 
  toBn 
} from '../../lib/qardHasanahService';
import { 
  HeartHandshake, 
  Search, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Wallet, 
  Receipt, 
  ChevronRight, 
  Loader2, 
  Edit3, 
  Send, 
  ShieldCheck,
  Check,
  X,
  CreditCard,
  User,
  Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminQardHasanah() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { profile } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'applications' | 'loans' | 'repayments'>('applications');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'disbursed' | 'rejected'>('pending');

  const [fundSummary, setFundSummary] = useState<QardFundSummary>({
    total_allocated: 0,
    total_disbursed: 0,
    total_recovered: 0,
    available_balance: 0
  });

  const [applications, setApplications] = useState<QardApplication[]>([]);
  const [loans, setLoans] = useState<QardLoan[]>([]);
  const [repayments, setRepayments] = useState<QardRepayment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [selectedApp, setSelectedApp] = useState<QardApplication | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approved' | 'rejected'>('approved');
  const [approvedAmountInput, setApprovedAmountInput] = useState('');
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');

  const [showDisburseModal, setShowDisburseModal] = useState(false);
  const [disburseRefInput, setDisburseRefInput] = useState('');

  const [selectedLoan, setSelectedLoan] = useState<QardLoan | null>(null);
  const [showRepayModal, setShowRepayModal] = useState(false);
  const [repayAmountInput, setRepayAmountInput] = useState('');
  const [repayMethod, setRepayMethod] = useState('নগদ');
  const [repayNote, setRepayNote] = useState('');

  const [showFundModal, setShowFundModal] = useState(false);
  const [newFundAmount, setNewFundAmount] = useState('');

  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [fund, apps, allLoans, allRepays] = await Promise.all([
        qardHasanahService.getFundSummary(),
        qardHasanahService.getApplications(),
        qardHasanahService.getLoans(),
        qardHasanahService.getRepayments()
      ]);

      setFundSummary(fund);
      setApplications(apps);
      setLoans(allLoans);
      setRepayments(allRepays);
    } catch (err) {
      console.error('Error loading admin Qard data:', err);
    } finally {
      setLoading(false);
    }
  };

  // 1. Handle Approve / Reject
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;

    try {
      setActionLoading(true);
      setErrorMessage('');
      await qardHasanahService.reviewApplication({
        applicationId: selectedApp.id,
        status: reviewAction,
        approvedAmount: reviewAction === 'approved' ? Number(approvedAmountInput) : undefined,
        rejectionReason: reviewAction === 'rejected' ? rejectionReasonInput : undefined
      });

      setShowReviewModal(false);
      setSelectedApp(null);
      setSuccessMessage(reviewAction === 'approved' ? 'আবেদনটি সফলভাবে অনুমোদিত হয়েছে।' : 'আবেদনটি বাতিল করা হয়েছে।');
      await loadAllData();
    } catch (err: any) {
      setErrorMessage(err.message || 'সিদ্ধান্ত সংরক্ষণে সমস্যা হয়েছে।');
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Handle Disbursement (with fund verification)
  const handleDisburseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;

    try {
      setActionLoading(true);
      setErrorMessage('');
      await qardHasanahService.disburseLoan({
        applicationId: selectedApp.id,
        disbursementRef: disburseRefInput.trim()
      });

      setShowDisburseModal(false);
      setSelectedApp(null);
      setSuccessMessage('অর্থ সফলভাবে বিতরণ করা হয়েছে এবং ঋণ একাউন্ট সক্রিয় হয়েছে।');
      await loadAllData();
    } catch (err: any) {
      setErrorMessage(err.message || 'অর্থ বিতরণে সমস্যা হয়েছে।');
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Handle Repayment Entry (Principal only)
  const handleRepaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan) return;

    const amount = Number(repayAmountInput);
    if (!amount || amount <= 0) {
      setErrorMessage('সঠিক টাকার অংক লিখুন।');
      return;
    }

    try {
      setActionLoading(true);
      setErrorMessage('');
      await qardHasanahService.recordRepayment({
        loanId: selectedLoan.id,
        memberId: selectedLoan.member_id,
        amount,
        paymentMethod: repayMethod,
        note: repayNote.trim()
      });

      setShowRepayModal(false);
      setSelectedLoan(null);
      setRepayAmountInput('');
      setRepayNote('');
      setSuccessMessage('মূল টাকা পরিশোধ সফলভাবে জমা হয়েছে।');
      await loadAllData();
    } catch (err: any) {
      setErrorMessage(err.message || 'পরিশোধ সংরক্ষণে সমস্যা হয়েছে।');
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Update Fund Allocation
  const handleFundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(newFundAmount);
    if (!amount || amount < 0) {
      setErrorMessage('সঠিক ফান্ডের অংক লিখুন।');
      return;
    }

    try {
      setActionLoading(true);
      setErrorMessage('');
      await qardHasanahService.updateFundAllocation(amount);
      setShowFundModal(false);
      setSuccessMessage('কর্জে হাসানা অনুমোদিত তহবিল সফলভাবে হালনাগাদ করা হয়েছে।');
      await loadAllData();
    } catch (err: any) {
      setErrorMessage(err.message || 'তহবিল সংরক্ষণে সমস্যা হয়েছে।');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredApps = applications.filter(a => {
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    const matchesSearch = !searchQuery || 
      a.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.member?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.member?.phone?.includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

  const activeLoans = loans.filter(l => l.status === 'active');
  const completedLoans = loans.filter(l => l.status === 'completed');

  return (
    <MobileLayout
      headerTitle="কর্জে হাসানা ব্যবস্থাপনা"
      backTo="/dashboard"
      showBack={true}
    >
      <div className="flex flex-col gap-4 pb-20">

        {/* 1. Authorized Fund Ledger Card */}
        <div className="bg-gradient-to-br from-[#0F172A] to-[#1E293B] text-white rounded-[24px] p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400">
                <HeartHandshake size={22} />
              </div>
              <div>
                <h2 className="text-[16px] font-bold bangla">সুদমুক্ত সহায়তা তহবিল</h2>
                <p className="text-[11px] text-slate-300 bangla">সমিতির অনুমোদিত ফান্ড স্থিতি</p>
              </div>
            </div>

            <button
              onClick={() => {
                setNewFundAmount(String(fundSummary.total_allocated));
                setShowFundModal(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[12px] font-bold bangla text-emerald-300 flex items-center gap-1.5"
            >
              <Edit3 size={14} /> ফান্ড সমন্বয়
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 p-3 bg-white/5 rounded-2xl text-center border border-white/10">
            <div>
              <p className="text-[11px] text-slate-300 bangla">মোট তহবিল</p>
              <p className="text-[14px] font-bold text-white bangla mt-0.5">{formatBnCurrency(fundSummary.total_allocated)}</p>
            </div>
            <div className="border-x border-white/10">
              <p className="text-[11px] text-slate-300 bangla">বিতরণকৃত আসল</p>
              <p className="text-[14px] font-bold text-amber-300 bangla mt-0.5">{formatBnCurrency(fundSummary.total_disbursed)}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-300 bangla">আদায়কৃত ফেরত</p>
              <p className="text-[14px] font-bold text-emerald-300 bangla mt-0.5">{formatBnCurrency(fundSummary.total_recovered)}</p>
            </div>
          </div>

          {/* Available for New Disbursement Pill */}
          <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[13px] bangla">
            <span className="text-slate-300">নতুন বিতরণের জন্য উপলব্ধ ব্যালেন্স:</span>
            <span className="font-extrabold text-[15px] text-emerald-400">
              {formatBnCurrency(fundSummary.available_balance)}
            </span>
          </div>
        </div>

        {/* Global Alert Messages */}
        {successMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-[13px] bangla font-bold flex items-center justify-between">
            <span>{successMessage}</span>
            <button onClick={() => setSuccessMessage('')}><X size={16} /></button>
          </div>
        )}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-[13px] bangla font-bold flex items-center justify-between">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage('')}><X size={16} /></button>
          </div>
        )}

        {/* 2. Three Clean Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-2xl">
          {[
            { id: 'applications', label: 'আবেদনসমূহ', count: applications.filter(a => a.status === 'pending').length },
            { id: 'loans', label: 'চলমান কর্জ', count: activeLoans.length },
            { id: 'repayments', label: 'পরিশোধ হিস্ট্রি', count: repayments.length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-2.5 rounded-xl text-[13px] font-bold bangla transition-all flex items-center justify-center gap-1.5 ${
                activeTab === tab.id 
                  ? 'bg-white text-slate-900 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === tab.id ? 'bg-primary text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {toBn(tab.count)}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* 3. TAB 1: APPLICATIONS LIST */}
        {activeTab === 'applications' && (
          <div className="flex flex-col gap-3">
            {/* Status Filter Pills */}
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {[
                { id: 'pending', label: 'অপেক্ষমাণ' },
                { id: 'approved', label: 'অনুমোদিত' },
                { id: 'disbursed', label: 'বিতরণকৃত' },
                { id: 'rejected', label: 'বাতিল' },
                { id: 'all', label: 'সকল' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-[12px] font-bold bangla shrink-0 transition-all ${
                    statusFilter === f.id 
                      ? 'bg-slate-900 text-white' 
                      : 'bg-white border border-slate-200 text-slate-600'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="bg-white rounded-2xl p-8 flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={24} />
              </div>
            ) : filteredApps.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-slate-100 text-slate-400 bangla text-[13px]">
                এই স্ট্যাটাসে কোনো আবেদন পাওয়া যায়নি।
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredApps.map(app => (
                  <div key={app.id} className="bg-white rounded-[22px] p-4 border border-slate-100 shadow-xs flex flex-col gap-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold bangla shrink-0 overflow-hidden">
                          {app.member?.avatar_url ? (
                            <img src={app.member.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User size={20} />
                          )}
                        </div>
                        <div>
                          <h4 className="text-[15px] font-bold text-slate-900 bangla leading-tight">
                            {app.member?.full_name || 'সদস্য'}
                          </h4>
                          <p className="text-[12px] text-slate-400 font-mono">{app.member?.phone || 'ফোন নেই'}</p>
                        </div>
                      </div>

                      <span className="text-[11px] font-mono font-bold text-slate-400">#{app.code}</span>
                    </div>

                    {/* Member's savings snapshot (for informed admin decision, NOT to be deducted!) */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-[12px] bangla">
                      <span className="text-slate-500">সমিতিতে সাধারণ সঞ্চয়:</span>
                      <span className="font-bold text-slate-800">{formatBnCurrency(app.member_savings_snapshot || 0)}</span>
                    </div>

                    <div className="flex items-baseline justify-between pt-1">
                      <div>
                        <p className="text-[11px] text-slate-400 bangla">চাহিত অর্থ</p>
                        <p className="text-[16px] font-extrabold text-slate-900 bangla">
                          {formatBnCurrency(app.requested_amount)}
                        </p>
                      </div>

                      {app.approved_amount && app.status !== 'pending' && (
                        <div className="text-right">
                          <p className="text-[11px] text-slate-400 bangla">অনুমোদিত অর্থ</p>
                          <p className="text-[15px] font-bold text-emerald-600 bangla">
                            {formatBnCurrency(app.approved_amount)}
                          </p>
                        </div>
                      )}
                    </div>

                    <p className="text-[13px] text-slate-700 bangla bg-slate-50 p-2.5 rounded-xl">
                      <span className="font-semibold text-slate-500">প্রয়োজনের কারণ: </span>
                      {app.purpose}
                    </p>

                    {/* Actions based on Status */}
                    {app.status === 'pending' && (
                      <div className="flex gap-2 pt-1 border-t border-slate-100">
                        <button
                          onClick={() => {
                            setSelectedApp(app);
                            setReviewAction('approved');
                            setApprovedAmountInput(String(app.requested_amount));
                            setShowReviewModal(true);
                          }}
                          className="flex-1 h-11 rounded-xl bg-emerald-600 text-white font-bold bangla text-[13px] flex items-center justify-center gap-1.5 active:scale-95"
                        >
                          <CheckCircle2 size={16} /> অনুমোদন
                        </button>
                        <button
                          onClick={() => {
                            setSelectedApp(app);
                            setReviewAction('rejected');
                            setRejectionReasonInput('');
                            setShowReviewModal(true);
                          }}
                          className="flex-1 h-11 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 font-bold bangla text-[13px] flex items-center justify-center gap-1.5 active:scale-95"
                        >
                          <XCircle size={16} /> বাতিল
                        </button>
                      </div>
                    )}

                    {app.status === 'approved' && (
                      <div className="pt-1 border-t border-slate-100">
                        <button
                          onClick={() => {
                            setSelectedApp(app);
                            setDisburseRefInput(`DISB-${app.code}`);
                            setShowDisburseModal(true);
                          }}
                          className="w-full h-11 rounded-xl bg-slate-900 text-white font-bold bangla text-[13px] flex items-center justify-center gap-1.5 active:scale-95"
                        >
                          <CreditCard size={16} /> অর্থ বিতরণ করুন (Disburse)
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 4. TAB 2: ACTIVE LOANS & REPAYMENT */}
        {activeTab === 'loans' && (
          <div className="flex flex-col gap-3">
            {loading ? (
              <div className="bg-white rounded-2xl p-8 flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={24} />
              </div>
            ) : activeLoans.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-slate-100 text-slate-400 bangla text-[13px]">
                বর্তমানে কোনো সক্রিয় চলমান কর্জ নেই।
              </div>
            ) : (
              activeLoans.map(loan => (
                <div key={loan.id} className="bg-white rounded-[22px] p-4 border border-slate-100 shadow-xs flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-[15px] font-bold text-slate-900 bangla leading-tight">
                        {loan.member?.full_name || 'সদস্য'}
                      </h4>
                      <p className="text-[12px] text-slate-400 font-mono">{loan.member?.phone || ''}</p>
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 bangla">
                      #{loan.code}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-2xl text-center">
                    <div>
                      <p className="text-[11px] text-slate-400 bangla">মোট আসল</p>
                      <p className="text-[14px] font-bold text-slate-800 bangla mt-0.5">{formatBnCurrency(loan.principal_amount)}</p>
                    </div>
                    <div className="border-x border-slate-200">
                      <p className="text-[11px] text-slate-400 bangla">পরিশোধিত</p>
                      <p className="text-[14px] font-bold text-emerald-600 bangla mt-0.5">{formatBnCurrency(loan.total_repaid)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-400 bangla">বকেয়া আসল</p>
                      <p className="text-[14px] font-bold text-rose-600 bangla mt-0.5">{formatBnCurrency(loan.outstanding_principal)}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedLoan(loan);
                      setRepayAmountInput('');
                      setShowRepayModal(true);
                    }}
                    className="w-full h-11 rounded-xl text-white font-bold bangla text-[13px] flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
                    style={{ backgroundColor: theme.primary }}
                  >
                    <Receipt size={16} /> টাকা ফেরত গ্রহণ এন্ট্রি
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* 5. TAB 3: REPAYMENTS HISTORY */}
        {activeTab === 'repayments' && (
          <div className="flex flex-col gap-2.5">
            {repayments.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-slate-100 text-slate-400 bangla text-[13px]">
                এখনো কোনো কর্জ পরিশোধ রেকর্ড নেই।
              </div>
            ) : (
              repayments.map(r => (
                <div key={r.id} className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs flex items-center justify-between">
                  <div>
                    <h5 className="text-[14px] font-bold text-slate-900 bangla">
                      {r.member?.full_name || 'সদস্য'} — {formatBnCurrency(r.amount)}
                    </h5>
                    <p className="text-[11px] text-slate-400 bangla mt-0.5">
                      তারিখ: {r.payment_date} • মাধ্যম: {r.payment_method}
                    </p>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    #{r.receipt_no || r.id.slice(0, 6)}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

      </div>

      {/* MODAL 1: Review Application (Approve/Reject) */}
      <AnimatePresence>
        {showReviewModal && selectedApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white rounded-[28px] p-6 shadow-2xl flex flex-col gap-4"
            >
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-[17px] font-bold text-slate-800 bangla">
                  {reviewAction === 'approved' ? 'আবেদন অনুমোদন' : 'আবেদন বাতিল'}
                </h3>
                <button onClick={() => setShowReviewModal(false)}><X size={18} /></button>
              </div>

              <form onSubmit={handleReviewSubmit} className="flex flex-col gap-3.5">
                {reviewAction === 'approved' ? (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-bold text-slate-700 bangla">অনুমোদিত টাকার পরিমাণ (৳)*</label>
                    <input
                      type="number"
                      value={approvedAmountInput}
                      onChange={(e) => setApprovedAmountInput(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl border border-slate-200 bangla text-[15px] font-bold text-slate-800 focus:outline-none"
                      required
                    />
                    <p className="text-[11px] text-slate-400 bangla">
                      * আবেদনকারী চেয়েছিলেন: {formatBnCurrency(selectedApp.requested_amount)}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-bold text-slate-700 bangla">বাতিলের কারণ*</label>
                    <textarea
                      rows={3}
                      value={rejectionReasonInput}
                      onChange={(e) => setRejectionReasonInput(e.target.value)}
                      placeholder="বাতিলের সুনির্দিষ্ট কারণ লিখুন..."
                      className="w-full p-3 rounded-xl border border-slate-200 bangla text-[13px] text-slate-800 focus:outline-none resize-none"
                      required
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={actionLoading}
                  className={`w-full h-11 rounded-xl text-white font-bold bangla text-[14px] flex items-center justify-center gap-2 mt-2 ${
                    reviewAction === 'approved' ? 'bg-emerald-600' : 'bg-rose-600'
                  }`}
                >
                  {actionLoading ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                  নিশ্চিত করুন
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Disburse Loan (Atomic Fund Verification) */}
      <AnimatePresence>
        {showDisburseModal && selectedApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white rounded-[28px] p-6 shadow-2xl flex flex-col gap-4"
            >
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-[17px] font-bold text-slate-800 bangla">অর্থ বিতরণ নিশ্চিতকরণ</h3>
                <button onClick={() => setShowDisburseModal(false)}><X size={18} /></button>
              </div>

              {/* Fund sufficiency alert */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col gap-1 text-[12px] bangla">
                <div className="flex justify-between">
                  <span className="text-slate-500">অনুমোদিত পরিমাণ:</span>
                  <span className="font-bold text-slate-900">{formatBnCurrency(selectedApp.approved_amount || selectedApp.requested_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">উপলব্ধ তহবিল:</span>
                  <span className="font-bold text-emerald-600">{formatBnCurrency(fundSummary.available_balance)}</span>
                </div>
              </div>

              <form onSubmit={handleDisburseSubmit} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold text-slate-700 bangla">বিতরণ রেফারেন্স ভাউচার নং</label>
                  <input
                    type="text"
                    value={disburseRefInput}
                    onChange={(e) => setDisburseRefInput(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 font-mono text-[14px] text-slate-800 focus:outline-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={actionLoading || fundSummary.available_balance < (selectedApp.approved_amount || selectedApp.requested_amount)}
                  className="w-full h-11 rounded-xl bg-slate-900 text-white font-bold bangla text-[14px] flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="animate-spin" size={18} /> : <CreditCard size={18} />}
                  অর্থ বিতরণ সম্পন্ন করুন
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: Repayment Entry (Principal Only) */}
      <AnimatePresence>
        {showRepayModal && selectedLoan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white rounded-[28px] p-6 shadow-2xl flex flex-col gap-4"
            >
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-[17px] font-bold text-slate-800 bangla">টাকা ফেরত গ্রহণ এন্ট্রি</h3>
                <button onClick={() => setShowRepayModal(false)}><X size={18} /></button>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-[13px] bangla">
                <span className="text-slate-500">বর্তমান বকেয়া আসল:</span>
                <span className="font-extrabold text-rose-600">{formatBnCurrency(selectedLoan.outstanding_principal)}</span>
              </div>

              <form onSubmit={handleRepaySubmit} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold text-slate-700 bangla">পরিশোধের পরিমাণ (৳)*</label>
                  <input
                    type="number"
                    max={selectedLoan.outstanding_principal}
                    value={repayAmountInput}
                    onChange={(e) => setRepayAmountInput(e.target.value)}
                    placeholder="e.g. 1000"
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 bangla text-[15px] font-bold text-slate-800 focus:outline-none"
                    required
                  />
                  <p className="text-[11px] text-slate-400 bangla">* শুধুমাত্র গৃহীত মূল টাকা জমা হবে (সুদমুক্ত নীতি)।</p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold text-slate-700 bangla">পরিশোধ মাধ্যম</label>
                  <select
                    value={repayMethod}
                    onChange={(e) => setRepayMethod(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 bangla text-[13px] text-slate-800 bg-white focus:outline-none"
                  >
                    <option value="নগদ">নগদ (Cash)</option>
                    <option value="বিকাশ">বিকাশ (bKash)</option>
                    <option value="নগদ/রকেট">নগদ/রকেট (Nagad/Rocket)</option>
                    <option value="ব্যাংক ট্রান্সফার">ব্যাংক ট্রান্সফার</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold text-slate-700 bangla">মন্তব্য বা ট্রানজেকশন আইডি (ঐচ্ছিক)</label>
                  <input
                    type="text"
                    value={repayNote}
                    onChange={(e) => setRepayNote(e.target.value)}
                    placeholder="e.g. TRX-12345"
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 bangla text-[13px] text-slate-800 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full h-11 rounded-xl text-white font-bold bangla text-[14px] flex items-center justify-center gap-2 mt-2"
                  style={{ backgroundColor: theme.primary }}
                >
                  {actionLoading ? <Loader2 className="animate-spin" size={18} /> : <Receipt size={18} />}
                  পরিশোধ রেকর্ড করুন
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 4: Fund Allocation Management */}
      <AnimatePresence>
        {showFundModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white rounded-[28px] p-6 shadow-2xl flex flex-col gap-4"
            >
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-[17px] font-bold text-slate-800 bangla">অনুমোদিত তহবিল সমন্বয়</h3>
                <button onClick={() => setShowFundModal(false)}><X size={18} /></button>
              </div>

              <form onSubmit={handleFundSubmit} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold text-slate-700 bangla">মোট অনুমোদিত তহবিল (৳)*</label>
                  <input
                    type="number"
                    value={newFundAmount}
                    onChange={(e) => setNewFundAmount(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 bangla text-[15px] font-bold text-slate-800 focus:outline-none"
                    required
                  />
                  <p className="text-[11px] text-slate-400 bangla">
                    * সমবায় কমিটি কর্তৃক নির্ধারিত প্রারম্ভিক বা বর্ধিত মূল ফান্ড।
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full h-11 rounded-xl bg-slate-900 text-white font-bold bangla text-[14px] flex items-center justify-center gap-2 mt-2"
                >
                  {actionLoading ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                  তহবিল সেভ করুন
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </MobileLayout>
  );
}
