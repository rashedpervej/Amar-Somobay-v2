import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '../../components/layout/MobileLayout';
import { useAuthStore } from '../../store/useAuthStore';
import { useTheme } from '../../components/ThemeProvider';
import { 
  qardHasanahService, 
  QardApplication, 
  QardLoan, 
  QardRepayment,
  formatBnCurrency, 
  toBn 
} from '../../lib/qardHasanahService';
import { 
  HeartHandshake, 
  Plus, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Wallet, 
  ChevronRight, 
  Receipt, 
  Calendar, 
  Loader2,
  X,
  Lock,
  ArrowDownLeft,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function MemberQardHasanah() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { profile } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [savingsSnapshot, setSavingsSnapshot] = useState(0);
  const [applications, setApplications] = useState<QardApplication[]>([]);
  const [loans, setLoans] = useState<QardLoan[]>([]);
  const [repayments, setRepayments] = useState<QardRepayment[]>([]);

  // Application Modal state
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [requestAmount, setRequestAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [durationMonths, setDurationMonths] = useState('6');
  const [consentPublicSharing, setConsentPublicSharing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    if (profile?.id) {
      loadData();
    }
  }, [profile?.id]);

  const loadData = async () => {
    if (!profile?.id) return;
    try {
      setLoading(true);
      const [savings, apps, memberLoans, memberRepays] = await Promise.all([
        qardHasanahService.getMemberSavingsSnapshot(profile.id),
        qardHasanahService.getApplications(profile.id),
        qardHasanahService.getLoans(profile.id),
        qardHasanahService.getRepayments(profile.id)
      ]);

      setSavingsSnapshot(savings);
      setApplications(apps);
      setLoans(memberLoans);
      setRepayments(memberRepays);
    } catch (err) {
      console.error('Error loading member Qard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const activeLoan = loans.find(l => l.status === 'active');
  const completedLoans = loans.filter(l => l.status === 'completed');

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(requestAmount);
    if (!amount || amount <= 0) {
      setMessage({ text: 'সঠিক টাকার পরিমাণ লিখুন।', type: 'error' });
      return;
    }
    if (!purpose.trim()) {
      setMessage({ text: 'প্রয়োজন বা সমস্যার বিবরণ লিখুন।', type: 'error' });
      return;
    }

    try {
      setSubmitting(true);
      setMessage({ text: '', type: '' });
      await qardHasanahService.submitApplication({
        requested_amount: amount,
        purpose: purpose.trim(),
        duration_months: Number(durationMonths) || 6,
        consent_public_sharing: consentPublicSharing
      });

      setShowApplyModal(false);
      setRequestAmount('');
      setPurpose('');
      setConsentPublicSharing(false);
      await loadData();
    } catch (err: any) {
      setMessage({ text: err.message || 'আবেদন জমা দিতে সমস্যা হয়েছে।', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MobileLayout
      headerTitle="কর্জে হাসানা"
      backTo="/somobay"
      showBack={true}
    >
      <div className="flex flex-col gap-4 pb-20">

        {/* 1. Islamic Hero Card: Pure Interest-Free Cooperative Concept */}
        <div className="bg-gradient-to-br from-[#064E3B] to-[#047857] text-white rounded-[24px] p-5 shadow-lg relative overflow-hidden">
          <div className="absolute right-[-20px] top-[-20px] w-36 h-36 rounded-full bg-white/5 pointer-events-none" />
          
          <div className="flex items-center gap-3.5 mb-3 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white shrink-0">
              <HeartHandshake size={28} />
            </div>
            <div>
              <h2 className="text-[19px] font-bold bangla leading-tight">সুদমুক্ত আর্থিক সহায়তা</h2>
              <p className="text-[12px] text-emerald-100 bangla mt-0.5">১০০% সুদমুক্ত ও পারস্পরিক সহযোগিতা ব্যবস্থা</p>
            </div>
          </div>

          <p className="text-[13px] text-white/90 bangla leading-relaxed relative z-10">
            সমবায়ের নিয়মিত সদস্যদের আপদকালীন প্রয়োজনের জন্য এটি একটি নির্ভরযোগ্য সুদমুক্ত আর্থিক সুবিধা।
          </p>

          {/* Savings Balance Notice Pill (Clear Rule: Savings Unaffected!) */}
          <div className="mt-4 pt-3.5 border-t border-white/15 flex items-center justify-between text-[12px] bangla relative z-10">
            <div className="flex items-center gap-1.5 text-emerald-100">
              <ShieldCheck size={16} className="text-emerald-300 shrink-0" />
              <span>আপনার সাধারণ সঞ্চয়:</span>
            </div>
            <div className="flex items-center gap-1.5 font-bold text-white">
              <span>{formatBnCurrency(savingsSnapshot)}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200">অক্ষত থাকবে</span>
            </div>
          </div>
        </div>

        {/* 2. Active Loan Card (If Member has an active disbursed loan) */}
        {activeLoan && (
          <div className="bg-white rounded-[22px] p-5 border border-slate-100 shadow-sm flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h3 className="text-[15px] font-bold text-slate-800 bangla">চলমান কর্জের বিবরণ</h3>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 bangla">
                রেফারেন্স: #{activeLoan.code}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-2xl text-center">
              <div>
                <p className="text-[11px] text-slate-400 bangla">গৃহীত আসল</p>
                <p className="text-[14px] font-bold text-slate-800 bangla mt-0.5">{formatBnCurrency(activeLoan.principal_amount)}</p>
              </div>
              <div className="border-x border-slate-200">
                <p className="text-[11px] text-slate-400 bangla">পরিশোধিত</p>
                <p className="text-[14px] font-bold text-emerald-600 bangla mt-0.5">{formatBnCurrency(activeLoan.total_repaid)}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 bangla">বর্তমান বকেয়া</p>
                <p className="text-[14px] font-bold text-rose-600 bangla mt-0.5">{formatBnCurrency(activeLoan.outstanding_principal)}</p>
              </div>
            </div>

            {/* Repayment Progress Bar */}
            <div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 bangla mb-1">
                <span>পরিশোধের অগ্রগতি</span>
                <span className="font-bold text-slate-700">
                  {Math.round(((activeLoan.total_repaid || 0) / activeLoan.principal_amount) * 100)}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.round(((activeLoan.total_repaid || 0) / activeLoan.principal_amount) * 100))}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* 3. Action Button: "কর্জে হাসানা চাই" (Request Qard Hasanah) */}
        {!activeLoan && (
          <button
            onClick={() => setShowApplyModal(true)}
            className="w-full h-[56px] rounded-[20px] text-white font-bold bangla text-[16px] flex items-center justify-center gap-2.5 shadow-md active:scale-[0.98] transition-all"
            style={{ backgroundColor: theme.primary }}
          >
            <Plus size={22} strokeWidth={2.5} />
            কর্জে হাসানা চাই (নতুন আবেদন)
          </button>
        )}

        {/* 4. My Applications Section */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[16px] font-bold text-slate-800 bangla">আমার আবেদনসমূহ</h3>
            <span className="text-[12px] text-slate-400 bangla">{toBn(applications.length)} টি আবেদন</span>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl p-8 flex items-center justify-center border border-slate-100">
              <Loader2 className="animate-spin text-primary" size={24} />
            </div>
          ) : applications.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center border border-slate-100 text-slate-400 bangla text-[13px]">
              আপনার কোনো পূর্ববর্তী কর্জে হাসানা আবেদন নেই।
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {applications.map((app) => (
                <div 
                  key={app.id}
                  className="bg-white rounded-[20px] p-4 border border-slate-100 shadow-xs flex flex-col gap-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[14px] text-slate-800 font-mono">#{app.code}</span>
                      <span className="text-[11px] text-slate-400 bangla">
                        {new Date(app.created_at).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>

                    {/* Status Badges */}
                    {app.status === 'pending' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-bold bangla flex items-center gap-1">
                        <Clock size={12} /> পর্যালোচনা চলছে
                      </span>
                    )}
                    {app.status === 'approved' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold bangla flex items-center gap-1">
                        <CheckCircle2 size={12} /> অনুমোদিত (বিতরণ বাকি)
                      </span>
                    )}
                    {app.status === 'disbursed' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold bangla flex items-center gap-1">
                        <CheckCircle2 size={12} /> অর্থ বিতরণকৃত
                      </span>
                    )}
                    {app.status === 'completed' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold bangla flex items-center gap-1">
                        <ShieldCheck size={12} /> পরিশোধ সম্পন্ন
                      </span>
                    )}
                    {app.status === 'rejected' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[11px] font-bold bangla flex items-center gap-1">
                        <AlertCircle size={12} /> বাতিল হয়েছে
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline justify-between pt-1 border-t border-slate-50">
                    <div>
                      <p className="text-[11px] text-slate-400 bangla">চাহিত অর্থ</p>
                      <p className="text-[16px] font-extrabold text-slate-900 bangla">
                        {formatBnCurrency(app.requested_amount)}
                      </p>
                    </div>

                    {app.approved_amount && app.status !== 'pending' && app.status !== 'rejected' && (
                      <div className="text-right">
                        <p className="text-[11px] text-slate-400 bangla">অনুমোদিত অর্থ</p>
                        <p className="text-[15px] font-bold text-emerald-600 bangla">
                          {formatBnCurrency(app.approved_amount)}
                        </p>
                      </div>
                    )}
                  </div>

                  <p className="text-[12px] text-slate-600 bangla bg-slate-50/70 p-2.5 rounded-xl">
                    <span className="font-semibold text-slate-700">কারণ: </span>
                    {app.purpose}
                  </p>

                  {app.rejection_reason && (
                    <div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-100 text-rose-700 text-[12px] bangla">
                      <span className="font-semibold">বাতিলের কারণ: </span>{app.rejection_reason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 5. Repayment History Section */}
        {repayments.length > 0 && (
          <div className="flex flex-col gap-2.5">
            <h3 className="text-[16px] font-bold text-slate-800 bangla px-1">পরিশোধের ইতিহাস</h3>
            <div className="flex flex-col gap-2">
              {repayments.map((r) => (
                <div key={r.id} className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Receipt size={18} />
                    </div>
                    <div>
                      <p className="text-[14px] font-bold text-slate-800 bangla">
                        {formatBnCurrency(r.amount)} পরিশোধ
                      </p>
                      <p className="text-[11px] text-slate-400 bangla">
                        {r.payment_date} • {r.payment_method}
                      </p>
                    </div>
                  </div>
                  {r.receipt_no && (
                    <span className="text-[11px] font-mono text-slate-400">
                      #{r.receipt_no}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* 6. Application Form Modal */}
      <AnimatePresence>
        {showApplyModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs">
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="w-full max-w-lg bg-white rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <HeartHandshake className="text-primary" size={24} />
                  <h3 className="text-[18px] font-bold text-slate-800 bangla">কর্জে হাসানা আবেদন</h3>
                </div>
                <button 
                  onClick={() => setShowApplyModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Informational notice: Savings will NOT be deducted */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-start gap-2.5">
                <Info size={18} className="text-emerald-700 shrink-0 mt-0.5" />
                <div className="text-[12px] text-emerald-800 bangla leading-relaxed">
                  আপনার সঞ্চয়ে <strong>{formatBnCurrency(savingsSnapshot)}</strong> রয়েছে। কর্জে হাসানার কারণে সঞ্চয় থেকে কোনো টাকা কাটা যাবে না। এটি সম্পূর্ণ সুদমুক্ত সহায়তা।
                </div>
              </div>

              <form onSubmit={handleApply} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold text-slate-700 bangla">প্রয়োজনীয় টাকার পরিমাণ (৳)*</label>
                  <input
                    type="number"
                    value={requestAmount}
                    onChange={(e) => setRequestAmount(e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 bangla text-[16px] font-bold text-slate-800 focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': theme.primary } as any}
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold text-slate-700 bangla">সমস্যা বা প্রয়োজনের বিবরণ*</label>
                  <textarea
                    rows={3}
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="কী কারণে আপনার এই অর্থ প্রয়োজন সংক্ষেপে লিখুন..."
                    className="w-full p-3.5 rounded-xl border border-slate-200 bangla text-[14px] text-slate-800 focus:outline-none focus:ring-2 resize-none"
                    style={{ '--tw-ring-color': theme.primary } as any}
                    required
                  />
                  <p className="text-[11px] text-slate-400 bangla">
                    * আপনার এই বিবরণ সম্পূর্ণ গোপনীয় থাকবে এবং শুধুমাত্র অ্যাডমিন যাচাই করবেন।
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold text-slate-700 bangla">সম্ভাব্য পরিশোধের মেয়াদ</label>
                  <select
                    value={durationMonths}
                    onChange={(e) => setDurationMonths(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 bangla text-[14px] text-slate-800 bg-white focus:outline-none"
                  >
                    <option value="3">৩ মাস</option>
                    <option value="6">৬ মাস</option>
                    <option value="12">১২ মাস</option>
                  </select>
                </div>

                {/* Consent Checkbox */}
                <label className="flex items-start gap-2.5 cursor-pointer select-none pt-1">
                  <input 
                    type="checkbox"
                    checked={consentPublicSharing}
                    onChange={(e) => setConsentPublicSharing(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-primary focus:ring-0"
                  />
                  <span className="text-[12px] text-slate-600 bangla leading-tight">
                    প্রয়োজনে সমবায়ের অন্যান্য সদস্যদের তহবিল সহায়তার জন্য অবহিত করার সম্মতি দিচ্ছি (ঐচ্ছিক)।
                  </span>
                </label>

                {message.text && (
                  <div className={`p-3 rounded-xl text-[13px] bangla font-semibold ${
                    message.type === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    {message.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-[52px] rounded-2xl text-white font-bold bangla text-[15px] flex items-center justify-center gap-2 active:scale-95 transition-all mt-2"
                  style={{ backgroundColor: theme.primary }}
                >
                  {submitting ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                  আবেদন জমা দিন
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </MobileLayout>
  );
}
