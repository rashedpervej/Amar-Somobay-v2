import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SomobayPlan, MemberPlan } from '../../store/useSomobayStore';
import { SavingsCategoryTheme } from '../../constants/savingsCategoryTokens';
import { SavingsPlanCard, toBn } from './SavingsPlanCard';

export interface SavingsCategorySectionProps {
  theme: SavingsCategoryTheme;
  activePlans: SomobayPlan[];
  enrolledPlanMap: Map<string, MemberPlan>;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onPlanClick: (plan: SomobayPlan) => void;
  onPlanDetailsClick?: (plan: SomobayPlan) => void;
}

export const SavingsCategorySection: React.FC<SavingsCategorySectionProps> = ({
  theme,
  activePlans,
  enrolledPlanMap,
  isExpanded,
  onToggleExpand,
  onPlanClick,
  onPlanDetailsClick
}) => {
  // Rule 1: Hide category if 0 active plans
  if (activePlans.length === 0) {
    return null;
  }

  const IconComp = theme.iconComponent;

  // Rule 2: If exactly 1 active plan, hide the expandable group header and display directly as an individual card
  if (activePlans.length === 1) {
    const singlePlan = activePlans[0];
    const memberPlan = enrolledPlanMap.get(singlePlan.id);

    return (
      <div 
        data-testid={`category-individual-${theme.id}`}
        className={`${theme.containerBg} rounded-[22px] p-2 sm:p-2.5 transition-all shadow-xs`}
      >
        <SavingsPlanCard
          plan={singlePlan}
          theme={theme}
          isIndividualCard={true}
          memberPlan={memberPlan}
          onClick={() => onPlanClick(singlePlan)}
          onDetailsClick={onPlanDetailsClick ? () => onPlanDetailsClick(singlePlan) : undefined}
        />
      </div>
    );
  }

  // Rule 3: If 2 or more active plans, display expandable category group
  return (
    <div 
      data-testid={`category-group-${theme.id}`}
      className={`${theme.containerBg} rounded-[22px] pt-2.5 px-2 pb-2 transition-all shadow-xs`}
    >
      {/* Expandable Group Header */}
      <div
        onClick={onToggleExpand}
        className="flex items-center justify-between cursor-pointer select-none px-2 py-1"
        role="button"
        aria-expanded={isExpanded}
        tabIndex={0}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-11 h-11 rounded-full ${theme.iconBg} ${theme.iconColor} flex items-center justify-center shrink-0 shadow-xs`}>
            <IconComp size={22} />
          </div>
          <div className="min-w-0">
            <h2 className="text-[16px] font-bold text-slate-900 bangla leading-snug truncate">
              {theme.title}
            </h2>
            <p className="text-[12px] text-slate-500 font-normal bangla mt-0.5 truncate">
              {theme.subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-2">
          <span className={`text-[12px] font-bold bangla px-2.5 py-1 rounded-full ${theme.categoryBadgeBg} ${theme.categoryBadgeText}`}>
            {toBn(activePlans.length)}টি প্ল্যান
          </span>
          <div className={theme.iconColor}>
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </div>
      </div>

      {/* Collapsible Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2.5 space-y-2.5">
              {activePlans.map((plan) => {
                const memberPlan = enrolledPlanMap.get(plan.id);
                return (
                  <SavingsPlanCard
                    key={plan.id}
                    plan={plan}
                    theme={theme}
                    isIndividualCard={false}
                    memberPlan={memberPlan}
                    onClick={() => onPlanClick(plan)}
                    onDetailsClick={onPlanDetailsClick ? () => onPlanDetailsClick(plan) : undefined}
                  />
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
