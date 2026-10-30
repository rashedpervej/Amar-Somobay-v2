import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  Share2, 
  Copy, 
  Check, 
  X, 
  Receipt,
  MessageCircle,
  Calendar,
  User,
  ShieldCheck
} from 'lucide-react';

export interface ReceiptData {
  transactionId: string;
  memberName: string;
  memberPhone?: string;
  planName: string;
  schemeType?: 'General' | 'savings' | 'rosca' | 'joint_goal' | 'qard';
  amount: number;
  penaltyPaid?: number;
  totalCollected: number;
  adminName: string;
  paymentDate: string;
  nextDueDate?: string | null;
  note?: string;
}

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ReceiptData | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, data }) => {
  const [copied, setCopied] = useState(false);

  const totalPaid = Number(data?.amount || 0) + Number(data?.penaltyPaid || 0);

  const bn = (num: number | string) => {
    return Number(num || 0).toLocaleString('bn-BD');
  };

  const schemeLabels: Record<string, string> = {
    General: 'সাধারণ সমবায়',
    savings: 'সাধারণ সঞ্চয় সমিতি',
    rosca: 'রোটেশনাল লটারি সমিতি (ROSCA)',
    joint_goal: 'যৌথ লক্ষ্য সমিতি',
    qard: 'সুদমুক্ত ঋণ (কর্জে হাসানা)'
  };

  const receiptText = data ? `
*আমার সমবায় — ডিজিটাল জমা রসিদ*
--------------------------------
রসিদ নং: #${data.transactionId}
তারিখ: ${new Date(data.paymentDate).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })}
সদস্য: ${data.memberName}
সমিতি: ${data.planName}
কিস্তি জমা: ৳${bn(data.amount)}
${data.penaltyPaid && data.penaltyPaid > 0 ? `জরিমানা আদায়: ৳${bn(data.penaltyPaid)}\n` : ''}সর্বমোট নগদ প্রাপ্তি: ৳${bn(totalPaid)}
${data.nextDueDate ? `পরবর্তী কিস্তির তারিখ: ${new Date(data.nextDueDate).toLocaleDateString('bn-BD')}\n` : ''}আদায়কারী: ${data.adminName}
--------------------------------
ধন্যবাদ! আপনার সঞ্চয় নিরাপদ ও নিশ্চিত।
`.trim() : '';

  const handleCopy = () => {
    if (!receiptText) return;
    navigator.clipboard.writeText(receiptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    if (!data) return;
    const encoded = encodeURIComponent(receiptText);
    const phoneClean = data.memberPhone ? data.memberPhone.replace(/[^0-9]/g, '') : '';
    const url = phoneClean 
      ? `https://wa.me/${phoneClean.startsWith('88') ? phoneClean : '88' + phoneClean}?text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank');
  };

  return (
    <AnimatePresence>
      {isOpen && data && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-[380px] bg-white dark:bg-[#0f172a] rounded-[28px] overflow-hidden shadow-2xl border border-slate-100 dark:border-white/10"
        >
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-5 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                <Receipt size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold bangla leading-tight">জমা রসিদ (মেমো)</h3>
                <span className="text-[11px] text-emerald-100 font-mono tracking-wider">#{data.transactionId}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Receipt Body */}
          <div className="p-5 flex flex-col gap-4">
            {/* Success indicator */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/30">
              <CheckCircle2 size={16} className="shrink-0" />
              <span className="text-xs font-bold bangla">কিস্তি সফলভাবে জমা গ্রহণ করা হয়েছে</span>
            </div>

            {/* Receipt Summary Slip */}
            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 flex flex-col gap-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 bangla">সদস্যের নাম:</span>
                <span className="font-bold text-slate-800 dark:text-slate-100 bangla">{data.memberName}</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 bangla">সমিতির নাম:</span>
                <span className="font-bold text-slate-800 dark:text-slate-100 bangla">{data.planName}</span>
              </div>

              {data.schemeType && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 bangla">স্কিমের ধরন:</span>
                  <span className="font-medium text-slate-600 dark:text-slate-300 bangla text-[11px]">
                    {schemeLabels[data.schemeType] || 'সমবায়'}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 bangla">তারিখ ও সময়:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300 bangla">
                  {new Date(data.paymentDate).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>

              <div className="h-px bg-slate-200 dark:bg-slate-800 my-1" />

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 bangla">কিস্তি পরিমাণ:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 bangla">৳{bn(data.amount)}</span>
              </div>

              {Boolean(data.penaltyPaid && data.penaltyPaid > 0) && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-rose-500 bangla">বিলম্ব জরিমানা:</span>
                  <span className="font-bold text-rose-500 bangla">৳{bn(data.penaltyPaid || 0)}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-sm pt-1 border-t border-slate-200 dark:border-slate-800">
                <span className="font-extrabold text-slate-900 dark:text-white bangla">মোট নগদ আদায়:</span>
                <span className="text-base font-black text-emerald-600 dark:text-emerald-400 bangla">৳{bn(totalPaid)}</span>
              </div>

              {data.nextDueDate && (
                <div className="flex justify-between items-center text-[11px] pt-1 text-slate-500">
                  <span className="bangla">পরবর্তী কিস্তির তারিখ:</span>
                  <span className="font-bold text-primary bangla">
                    {new Date(data.nextDueDate).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-1">
              <button
                onClick={handleWhatsAppShare}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#25D366] hover:bg-[#20ba59] active:scale-[0.98] text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-[#25D366]/20 bangla"
              >
                <MessageCircle size={18} />
                <span>WhatsApp-এ রসিদ পাঠান</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all bangla"
                >
                  {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                  <span>{copied ? 'কপি হয়েছে!' : 'রসিদ কপি'}</span>
                </button>

                <button
                  onClick={onClose}
                  className="flex items-center justify-center py-2.5 px-3 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-all bangla"
                >
                  ঠিক আছে
                </button>
              </div>
            </div>
          </div>
        </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
