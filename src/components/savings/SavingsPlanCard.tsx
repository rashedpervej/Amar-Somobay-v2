import React from 'react';
import { ChevronRight, Calendar, AlertTriangle, Clock } from 'lucide-react';
import { SomobayPlan, MemberPlan } from '../../store/useSomobayStore';
import { SavingsCategoryTheme } from '../../constants/savingsCategoryTokens';

// Helper: Convert number to Bengali numerals
export const toBn = (num: number | string): string => {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/\d/g, d => bnDigits[Number(d)]);
};

// Helper: Format currency in Bangladeshi style with Bengali numerals
export const formatBnCurrency = (amount: number): string => {
  return '৳' + toBn(Math.round(amount).toLocaleString('en-IN'));
};

// SVG Illustration: Plant Sprouting from Gold Coins (General Cooperative)
const PlantCoinsIllustration = () => (
  <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-primary-light flex items-center justify-center shrink-0 shadow-xs relative overflow-hidden">
    <svg viewBox="0 0 56 56" className="w-11 h-11 sm:w-12 sm:h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="14" y="27" width="28" height="23" rx="6" fill="#D1FAE5" stroke="#A7F3D0" strokeWidth="1.5" />
      <circle cx="21" cy="42" r="4.5" fill="#FBBF24" stroke="#F59E0B" strokeWidth="1.2" />
      <circle cx="28" cy="42" r="4.5" fill="#FCD34D" stroke="#F59E0B" strokeWidth="1.2" />
      <circle cx="35" cy="42" r="4.5" fill="#FBBF24" stroke="#F59E0B" strokeWidth="1.2" />
      <circle cx="24" cy="35" r="4.5" fill="#FCD34D" stroke="#F59E0B" strokeWidth="1.2" />
      <circle cx="32" cy="35" r="4.5" fill="#FBBF24" stroke="#F59E0B" strokeWidth="1.2" />
      <path d="M28 27V15" stroke="#087F5B" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M28 21C23 19 18 20 17 14C23 13 27 16 28 21Z" fill="#10B981" />
      <path d="M28 17C33 15 38 16 39 10C33 9 29 12 28 17Z" fill="#34D399" />
    </svg>
  </div>
);

// SVG Illustration: Circular Member Rotation Cycle (ROSCA)
const RoscaCycleIllustration = () => (
  <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-[#E0EAFF] flex items-center justify-center shrink-0 shadow-xs relative overflow-hidden">
    <svg viewBox="0 0 56 56" className="w-11 h-11 sm:w-12 sm:h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="28" r="16" stroke="#2563EB" strokeWidth="2" strokeDasharray="4 3" />
      <circle cx="28" cy="13" r="5" fill="#087F5B" />
      <circle cx="28" cy="11.5" r="2.2" fill="#E8F7F1" />
      <circle cx="16" cy="37" r="5" fill="#2563EB" />
      <circle cx="16" cy="35.5" r="2.2" fill="#E0EAFF" />
      <circle cx="40" cy="37" r="5" fill="#D97706" />
      <circle cx="40" cy="35.5" r="2.2" fill="#FEF3C7" />
      <path d="M21 18L28 13L25 9" fill="none" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M36 28L41 35L36 38" fill="none" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M27 40L17 37L19 31" fill="none" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

// SVG Illustration: House & Trees Goal (Joint Goal)
const HouseSavingsIllustration = () => (
  <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-[#FEF3C7] flex items-center justify-center shrink-0 shadow-xs relative overflow-hidden">
    <svg viewBox="0 0 56 56" className="w-11 h-11 sm:w-12 sm:h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="44" width="44" height="4" rx="2" fill="#86EFAC" />
      <circle cx="11" cy="36" r="6" fill="#22C55E" />
      <rect x="10" y="38" width="2" height="6" fill="#78350F" />
      <circle cx="45" cy="36" r="6" fill="#16A34A" />
      <rect x="44" y="38" width="2" height="6" fill="#78350F" />
      <rect x="17" y="27" width="22" height="17" rx="2" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1.5" />
      <path d="M14 27L28 14L42 27H14Z" fill="#0284C7" stroke="#0369A1" strokeWidth="1.5" strokeLinejoin="round" />
      <rect x="25" y="33" width="6" height="11" rx="1.5" fill="#0F172A" />
      <rect x="19" y="31" width="4" height="4" rx="0.5" fill="#38BDF8" stroke="#0284C7" strokeWidth="1" />
      <rect x="33" y="31" width="4" height="4" rx="0.5" fill="#38BDF8" stroke="#0284C7" strokeWidth="1" />
    </svg>
  </div>
);

// SVG Illustration: Qard Hasanah (Hand & Heart in Purple)
const QardHasanahIllustration = () => (
  <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-[#F3E8FF] flex items-center justify-center shrink-0 shadow-xs relative overflow-hidden">
    <svg viewBox="0 0 56 56" className="w-11 h-11 sm:w-12 sm:h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="28" r="22" fill="#FAF5FF" stroke="#E9D5FF" strokeWidth="1.5" />
      <path d="M28 36L20 28C17 25 17 20 21 17C24 15 27 17 28 19C29 17 32 15 35 17C39 20 39 25 36 28L28 36Z" fill="#C084FC" />
      <circle cx="28" cy="24" r="3.5" fill="#7C3AED" />
    </svg>
  </div>
);

export interface SavingsPlanCardProps {
  plan: SomobayPlan;
  theme: SavingsCategoryTheme;
  isIndividualCard?: boolean;
  memberPlan?: MemberPlan;
  onClick: () => void;
  onDetailsClick?: () => void;
}

export const SavingsPlanCard: React.FC<SavingsPlanCardProps> = ({
  plan,
  theme,
  isIndividualCard = false,
  memberPlan,
  onClick,
  onDetailsClick
}) => {
  const schemeType = plan.scheme_type || 'General';

  // Format plan display name
  const displayName = plan.name;

  // Calculation parameters
  const target = plan.target_amount || 0;
  const installment = plan.installment_amount || 0;
  const frequencyLabel = plan.frequency === 'weekly' ? 'সপ্তাহ' : 'মাস';

  // Status badge
  const statusLabel = plan.status === 'active' ? 'সক্রিয়' : 'সমাপ্ত';

  // Render illustration based on category
  const renderIllustration = () => {
    switch (schemeType) {
      case 'rosca':
        return <RoscaCycleIllustration />;
      case 'joint_goal':
        return <HouseSavingsIllustration />;
      case 'qard':
        return <QardHasanahIllustration />;
      case 'General':
      case 'savings':
      default:
        return <PlantCoinsIllustration />;
    }
  };

  // -------------------------------------------------------------
  // Category-Specific Card Layouts
  // -------------------------------------------------------------

  // 1. ROSCA Layout
  if (schemeType === 'rosca') {
    const membersLimit = plan.total_members_limit || 12;
    const totalPayout = installment * membersLimit;
    const completedDraws = plan.current_cycle ? Math.min(plan.current_cycle, membersLimit) : 0;
    const percent = Math.min(100, Math.round((completedDraws / membersLimit) * 100));

    return (
      <div
        onClick={onClick}
        className={`${theme.cardBg} rounded-[18px] p-3.5 shadow-sm border ${theme.cardBorder} ${theme.cardHoverBorder} space-y-3 cursor-pointer transition-all active:scale-[0.99]`}
      >
        {/* Header Row */}
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-3 min-w-0">
            {renderIllustration()}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-[16px] font-bold text-slate-900 bangla leading-snug truncate max-w-full">
                  {displayName}
                </h3>
                {isIndividualCard && (
                  <span className={`text-[10px] sm:text-[11px] font-bold bangla px-2 py-0.5 rounded-full ${theme.categoryBadgeBg} ${theme.categoryBadgeText} shrink-0`}>
                    {theme.badgeLabel}
                  </span>
                )}
                <span className={`text-[11px] font-bold bangla px-2 py-0.5 rounded-full ${theme.statusActiveBg} ${theme.statusActiveText} shrink-0`}>
                  {statusLabel}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[12px] text-slate-500 bangla mt-1">
                <Calendar size={13} className="text-slate-400 shrink-0" />
                <span className="truncate">
                  {toBn(membersLimit)} সদস্য × {formatBnCurrency(installment)} / মাস
                </span>
              </div>
            </div>
          </div>
          <ChevronRight size={18} className="text-slate-400 shrink-0 mt-1" />
        </div>

        {/* 3 Colored Stat Boxes */}
        <div className="grid grid-cols-3 gap-2 pt-0.5">
          <div className={`${theme.statBoxBg1} rounded-xl p-2.5 text-left`}>
            <span className="text-[11px] text-slate-500 bangla block font-medium">
              প্রতি মাসে জমা
            </span>
            <strong className={`text-[14px] sm:text-[15px] font-black ${theme.statBoxText1} bangla block mt-0.5`}>
              {formatBnCurrency(installment)}
            </strong>
          </div>

          <div className={`${theme.statBoxBg2} rounded-xl p-2.5 text-left`}>
            <span className="text-[11px] text-slate-500 bangla block font-medium">
              মোট প্রদান (ড্র)
            </span>
            <strong className={`text-[14px] sm:text-[15px] font-black ${theme.statBoxText2} bangla block mt-0.5`}>
              {formatBnCurrency(totalPayout)}
            </strong>
          </div>

          <div className={`${theme.statBoxBg3} rounded-xl p-2.5 text-left`}>
            <span className="text-[11px] text-slate-500 bangla block font-medium">
              ড্র সম্পন্ন
            </span>
            <strong className={`text-[14px] sm:text-[15px] font-black ${theme.statBoxText3} bangla block mt-0.5`}>
              {toBn(completedDraws)} / {toBn(membersLimit)}
            </strong>
          </div>
        </div>

        {/* Progress Bar Row */}
        <div className="flex items-center gap-3 pt-0.5">
          <div className={`flex-1 h-2 ${theme.progressTrack} rounded-full overflow-hidden`}>
            <div 
              className={`h-full ${theme.progressBar} rounded-full transition-all duration-500`}
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className={`text-[12px] font-bold ${theme.progressText} bangla shrink-0`}>
            {toBn(percent)}% সম্পন্ন
          </span>
        </div>

        {/* Bottom Notice */}
        <div className={`${theme.noticeBg} border ${theme.noticeBorder} rounded-xl px-3.5 py-2 flex items-center justify-between ${theme.noticeText}`}>
          <div className="flex items-center gap-2">
            <Calendar size={14} className="shrink-0" />
            <span className="text-[11.5px] font-bold bangla">
              {plan.current_cycle ? `চলমান ড্র: ${toBn(plan.current_cycle)}` : 'রোটেশনাল লটারি ড্র'}
            </span>
          </div>
          <ChevronRight size={14} />
        </div>
      </div>
    );
  }

  // 2. Joint Goal Layout (Matches User Reference Screen Exactly)
  if (schemeType === 'joint_goal') {
    const collected = memberPlan ? (Number(memberPlan.total_collected) || 0) : 0;
    const remaining = Math.max(0, target - collected);
    const percent = target > 0 ? Math.min(100, Math.round((collected / target) * 100)) : 100;

    return (
      <div
        onClick={onClick}
        className={`${theme.cardBg} rounded-[18px] p-3.5 shadow-sm border ${theme.cardBorder} ${theme.cardHoverBorder} space-y-3 cursor-pointer transition-all active:scale-[0.99]`}
      >
        {/* Header Row */}
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-3 min-w-0">
            {renderIllustration()}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-[16px] font-bold text-slate-900 bangla leading-snug truncate max-w-full">
                  {displayName}
                </h3>
                {isIndividualCard && (
                  <span className={`text-[10px] sm:text-[11px] font-bold bangla px-2 py-0.5 rounded-full ${theme.categoryBadgeBg} ${theme.categoryBadgeText} shrink-0`}>
                    {theme.badgeLabel}
                  </span>
                )}
                <span className={`text-[11px] font-bold bangla px-2 py-0.5 rounded-full ${theme.statusActiveBg} ${theme.statusActiveText} shrink-0`}>
                  {statusLabel}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[12px] text-slate-500 bangla mt-1">
                <Calendar size={13} className="text-slate-400 shrink-0" />
                <span className="truncate">
                  {toBn(plan.duration_months || 12)} মাসের যৌথ সঞ্চয় পরিকল্পনা
                </span>
              </div>
            </div>
          </div>
          <ChevronRight size={18} className="text-slate-400 shrink-0 mt-1" />
        </div>

        {/* 3-Column Financial Grid with vertical dividers */}
        <div className="grid grid-cols-3 divide-x divide-slate-100 pt-0.5">
          <div>
            <span className="text-[11px] font-medium text-slate-400 bangla block">
              লক্ষ্যমাত্রা
            </span>
            <strong className="text-[14px] sm:text-[15px] font-black text-slate-900 bangla block mt-0.5">
              {formatBnCurrency(target)}
            </strong>
          </div>

          <div className="pl-3">
            <span className="text-[11px] font-medium text-slate-400 bangla block">
              এ পর্যন্ত সংগৃহীত
            </span>
            <strong className={`text-[14px] sm:text-[15px] font-black ${theme.statBoxText2} bangla block mt-0.5`}>
              {formatBnCurrency(collected)}
            </strong>
          </div>

          <div className="pl-3">
            <span className="text-[11px] font-medium text-slate-400 bangla block">
              অবশিষ্ট
            </span>
            <strong className={`text-[14px] sm:text-[15px] font-black ${theme.statBoxText3} bangla block mt-0.5`}>
              {formatBnCurrency(remaining)}
            </strong>
          </div>
        </div>

        {/* Progress Bar Row */}
        <div className="flex items-center gap-3 pt-0.5">
          <div className={`flex-1 h-2 ${theme.progressTrack} rounded-full overflow-hidden`}>
            <div 
              className={`h-full ${theme.progressBar} rounded-full transition-all duration-500`}
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className={`text-[12px] font-bold ${theme.progressText} bangla shrink-0`}>
            {toBn(percent)}% সম্পন্ন
          </span>
        </div>

        {/* Bottom Row: লক্ষ্যের মেয়াদ শেষ & বিস্তারিত দেখুন button */}
        <div className={`${theme.noticeBg} border ${theme.noticeBorder} rounded-xl px-3 py-2 flex items-center justify-between ${theme.noticeText} gap-1.5`}>
          <div className="flex items-center gap-1.5 min-w-0">
            <Calendar size={14} className="shrink-0 text-[#D97706]" />
            <span className="text-[11px] sm:text-[11.5px] font-bold bangla whitespace-nowrap truncate">
              {plan.duration_months ? `মেয়াদ: ${toBn(plan.duration_months)} মাস` : 'যৌথ সঞ্চয় লক্ষ্য'}
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onDetailsClick) onDetailsClick();
              else onClick();
            }}
            className={`bg-white border ${theme.actionBorder} ${theme.actionText} ${theme.actionHoverBg} active:scale-95 transition-all text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-0.5 shrink-0`}
          >
            <span>বিস্তারিত দেখুন</span>
            <ChevronRight size={13} />
          </button>
        </div>
      </div>
    );
  }

  // 3. Qard Hasanah Layout
  if (schemeType === 'qard') {
    const maxAmount = target;
    const repaid = memberPlan ? (Number(memberPlan.total_collected) || 0) : 0;
    const remaining = Math.max(0, maxAmount - repaid);
    const percent = maxAmount > 0 ? Math.min(100, Math.round((repaid / maxAmount) * 100)) : 0;

    return (
      <div
        onClick={onClick}
        className={`${theme.cardBg} rounded-[18px] p-3.5 shadow-sm border ${theme.cardBorder} ${theme.cardHoverBorder} space-y-3 cursor-pointer transition-all active:scale-[0.99]`}
      >
        {/* Header Row */}
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-3 min-w-0">
            {renderIllustration()}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-[16px] font-bold text-slate-900 bangla leading-snug truncate max-w-full">
                  {displayName}
                </h3>
                {isIndividualCard && (
                  <span className={`text-[10px] sm:text-[11px] font-bold bangla px-2 py-0.5 rounded-full ${theme.categoryBadgeBg} ${theme.categoryBadgeText} shrink-0`}>
                    {theme.badgeLabel}
                  </span>
                )}
                <span className={`text-[11px] font-bold bangla px-2 py-0.5 rounded-full ${theme.statusActiveBg} ${theme.statusActiveText} shrink-0`}>
                  {statusLabel}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[12px] text-slate-500 bangla mt-1">
                <Clock size={13} className="text-slate-400 shrink-0" />
                <span className="truncate">
                  {toBn(plan.duration_months || 6)} মাসের সুদমুক্ত ঋণ স্কিম
                </span>
              </div>
            </div>
          </div>
          <ChevronRight size={18} className="text-slate-400 shrink-0 mt-1" />
        </div>

        {/* 3-Column Financial Grid */}
        <div className="grid grid-cols-3 divide-x divide-slate-100 pt-0.5">
          <div>
            <span className="text-[11px] font-medium text-slate-400 bangla block">
              সর্বোচ্চ সুবিধা
            </span>
            <strong className={`text-[14px] sm:text-[15px] font-black ${theme.accentText} bangla block mt-0.5`}>
              {formatBnCurrency(maxAmount)}
            </strong>
          </div>

          <div className="pl-3">
            <span className="text-[11px] font-medium text-slate-400 bangla block">
              পরিশোধিত
            </span>
            <strong className="text-[14px] sm:text-[15px] font-black text-slate-900 bangla block mt-0.5">
              {formatBnCurrency(repaid)}
            </strong>
          </div>

          <div className="pl-3">
            <span className="text-[11px] font-medium text-slate-400 bangla block">
              বাকি পরিমাণ
            </span>
            <strong className="text-[14px] sm:text-[15px] font-black text-slate-900 bangla block mt-0.5">
              {formatBnCurrency(remaining)}
            </strong>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-3 pt-0.5">
          <div className={`flex-1 h-2 ${theme.progressTrack} rounded-full overflow-hidden`}>
            <div 
              className={`h-full ${theme.progressBar} rounded-full transition-all duration-500`}
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className={`text-[12px] font-bold ${theme.progressText} bangla shrink-0`}>
            {toBn(percent)}% পরিশোধিত
          </span>
        </div>

        {/* Bottom Notice */}
        <div className={`${theme.noticeBg} border ${theme.noticeBorder} rounded-xl px-3 py-2 flex items-center justify-between ${theme.noticeText} gap-1.5`}>
          <div className="flex items-center gap-1.5 min-w-0">
            <Clock size={14} className="shrink-0" />
            <span className="text-[11.5px] font-bold bangla truncate">
              সুদমুক্ত ও শরিয়াহ সম্মত ঋণ সুবিধা
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onDetailsClick) onDetailsClick();
              else onClick();
            }}
            className={`bg-white border ${theme.actionBorder} ${theme.actionText} ${theme.actionHoverBg} active:scale-95 transition-all text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-0.5 shrink-0`}
          >
            <span>বিস্তারিত দেখুন</span>
            <ChevronRight size={13} />
          </button>
        </div>
      </div>
    );
  }

  // 4. Default: General Cooperative Layout
  const collected = memberPlan ? (Number(memberPlan.total_collected) || 0) : 0;
  const percent = target > 0 ? Math.min(100, Math.round((collected / target) * 100)) : 0;
  const isOverdue = false;

  return (
    <div
      onClick={onClick}
      className={`${theme.cardBg} rounded-[18px] p-3.5 shadow-sm border ${theme.cardBorder} ${theme.cardHoverBorder} space-y-3 cursor-pointer transition-all active:scale-[0.99]`}
    >
      {/* Header Row */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-center gap-3 min-w-0">
          {renderIllustration()}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-[16px] font-bold text-slate-900 bangla leading-snug truncate max-w-full">
                {displayName}
              </h3>
              {isIndividualCard && (
                <span className={`text-[10px] sm:text-[11px] font-bold bangla px-2 py-0.5 rounded-full ${theme.categoryBadgeBg} ${theme.categoryBadgeText} shrink-0`}>
                  {theme.badgeLabel}
                </span>
              )}
              <span className={`text-[11px] font-bold bangla px-2 py-0.5 rounded-full ${theme.statusActiveBg} ${theme.statusActiveText} shrink-0`}>
                {statusLabel}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[12px] text-slate-500 bangla mt-1">
              <Calendar size={13} className="text-slate-400 shrink-0" />
              <span className="truncate">
                {toBn(plan.duration_months || 12)} মাসের প্ল্যান ({formatBnCurrency(installment)} / {frequencyLabel})
              </span>
            </div>
          </div>
        </div>

        <ChevronRight size={18} className="text-slate-400 shrink-0 mt-1" />
      </div>

      {/* 3-Column Financial Grid with vertical dividers */}
      <div className="grid grid-cols-3 divide-x divide-slate-100 pt-0.5">
        <div>
          <span className="text-[11px] font-medium text-slate-400 bangla block">
            প্রতি {frequencyLabel}ে জমা
          </span>
          <strong className={`text-[14px] sm:text-[15px] font-black ${theme.accentText} bangla block mt-0.5`}>
            {formatBnCurrency(installment)}
          </strong>
        </div>

        <div className="pl-3">
          <span className="text-[11px] font-medium text-slate-400 bangla block">
            এ পর্যন্ত সংগৃহীত
          </span>
          <strong className="text-[14px] sm:text-[15px] font-black text-slate-900 bangla block mt-0.5">
            {formatBnCurrency(collected)}
          </strong>
        </div>

        <div className="pl-3">
          <span className="text-[11px] font-medium text-slate-400 bangla block">
            লক্ষ্য (মোট)
          </span>
          <strong className="text-[14px] sm:text-[15px] font-black text-slate-900 bangla block mt-0.5">
            {formatBnCurrency(target)}
          </strong>
        </div>
      </div>

      {/* Progress Bar Row */}
      <div className="flex items-center gap-3 pt-0.5">
        <div className={`flex-1 h-2 ${theme.progressTrack} rounded-full overflow-hidden`}>
          <div 
            className={`h-full ${theme.progressBar} rounded-full transition-all duration-500`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className={`text-[12px] font-bold ${theme.progressText} bangla shrink-0`}>
          {toBn(percent)}% সম্পন্ন
        </span>
      </div>

      {/* Bottom Alert / Status Notice */}
      {isOverdue ? (
        <div className={`${theme.noticeBg} border ${theme.noticeBorder} rounded-xl px-3.5 py-2 flex items-center justify-between ${theme.noticeText}`}>
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} className="shrink-0" />
            <span className="text-[12px] font-bold bangla">
              কিস্তি বকেয়া • {memberPlan?.next_due_date ? new Date(memberPlan.next_due_date).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' }) : 'বকেয়া রয়েছে'}
            </span>
          </div>
          <ChevronRight size={15} />
        </div>
      ) : (
        <div className="bg-slate-50/70 border border-slate-100 rounded-xl px-3 py-1.5 flex items-center justify-between text-slate-500 text-[11.5px] font-medium bangla">
          <span>নিয়মিত সঞ্চয় জমা দিন ও সঞ্চয় বৃদ্ধি করুন</span>
          <span className={`font-bold ${theme.accentText}`}>সক্রিয় খাতা</span>
        </div>
      )}
    </div>
  );
};
