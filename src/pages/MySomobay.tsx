import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '../components/layout/MobileLayout';
import { useAuthStore } from '../store/useAuthStore';
import { SomobayPlan, MemberPlan } from '../store/useSomobayStore';
import { supabase } from '../lib/supabase';
import { Loader2, PiggyBank, RefreshCw } from 'lucide-react';
import { 
  SAVINGS_CATEGORY_THEMES, 
  ORDERED_CATEGORY_IDS, 
  SavingsCategoryId,
  isPlanActive
} from '../constants/savingsCategoryTokens';
import { SavingsCategorySection } from '../components/savings/SavingsCategorySection';
import { motion } from 'motion/react';

export default function MySomobay() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();

  // Collapsible state for each category (default expanded)
  const [expandedMap, setExpandedMap] = useState<Record<SavingsCategoryId, boolean>>({
    savings: true,
    rosca: true,
    joint_goal: true,
    qard: true
  });

  const [loading, setLoading] = useState(true);
  const [allSocietyPlans, setAllSocietyPlans] = useState<SomobayPlan[]>([]);
  const [userMemberPlans, setUserMemberPlans] = useState<MemberPlan[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch all society plans dynamically from database
      const { data: planData, error: planError } = await supabase
        .from('somobay_plans')
        .select('*')
        .order('created_at', { ascending: false });

      if (planError) {
        console.warn('Error fetching somobay plans:', planError);
      } else if (planData) {
        setAllSocietyPlans(planData);
      }

      // 2. Fetch member's own enrollments if logged in
      if (profile?.id) {
        const { data: mpData, error: mpError } = await supabase
          .from('member_plans')
          .select('*, plan:somobay_plans(*)')
          .eq('member_id', profile.id);

        if (mpError) {
          console.warn('Error fetching member plans:', mpError);
        } else if (mpData) {
          setUserMemberPlans(mpData);
        }
      }
    } catch (e) {
      console.error('Error loading my somobay data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [profile?.id]);

  const toggleCategory = (catId: SavingsCategoryId) => {
    setExpandedMap(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  // Build enrolled member map for fast O(1) lookup
  const enrolledPlanMap = useMemo(() => {
    const map = new Map<string, MemberPlan>();
    userMemberPlans.forEach(mp => {
      map.set(mp.plan_id, mp);
    });
    return map;
  }, [userMemberPlans]);

  // Group active plans by category dynamically from database
  const activePlansByCategory = useMemo(() => {
    const activeOnly = allSocietyPlans.filter(isPlanActive);

    const grouped: Record<SavingsCategoryId, SomobayPlan[]> = {
      savings: activeOnly.filter(p => p.scheme_type === 'General' || p.scheme_type === 'savings' || !p.scheme_type),
      rosca: activeOnly.filter(p => p.scheme_type === 'rosca'),
      joint_goal: activeOnly.filter(p => p.scheme_type === 'joint_goal'),
      qard: activeOnly.filter(p => p.scheme_type === 'qard')
    };

    return grouped;
  }, [allSocietyPlans]);

  // Navigation handlers per plan type
  const handlePlanClick = (plan: SomobayPlan) => {
    const schemeType = plan.scheme_type || 'General';
    switch (schemeType) {
      case 'rosca':
        navigate(`/rosca/${plan.id}`);
        break;
      case 'joint_goal':
        navigate(`/goals/${plan.id}`);
        break;
      case 'qard':
        navigate('/qard');
        break;
      case 'General':
      case 'savings':
      default:
        if (profile?.role === 'admin') {
          navigate(`/somobay/manage/${plan.id}`);
        } else {
          navigate(`/savings?planId=${plan.id}`);
        }
        break;
    }
  };

  const handlePlanDetailsClick = (plan: SomobayPlan) => {
    handlePlanClick(plan);
  };

  // Total count of active plans across all categories
  const totalActivePlans = useMemo(() => {
    return ORDERED_CATEGORY_IDS.reduce((sum, id) => sum + activePlansByCategory[id].length, 0);
  }, [activePlansByCategory]);

  return (
    <MobileLayout
      headerTitle="আমার সমবায়"
      headerSubtitle="আপনার সক্রিয় সমবায় স্কিমগুলো এখানে দেখুন"
      showBack={false}
      headerRight={
        <button
          onClick={loadData}
          className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-white active:scale-90 transition-transform focus:outline-none cursor-pointer"
          title="রিফ্রেশ করুন"
          aria-label="রিফ্রেশ করুন"
        >
          <RefreshCw size={21} strokeWidth={2.2} className={loading ? 'animate-spin' : ''} />
        </button>
      }
    >
      <div className="space-y-4 pb-10">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-[13px] text-slate-500 bangla">সমবায় স্কিমসমূহ লোড হচ্ছে...</p>
          </div>
        ) : totalActivePlans === 0 ? (
          // Empty State if no active plans exist in database
          <div className="bg-white rounded-[22px] border border-slate-200/80 p-8 text-center flex flex-col items-center justify-center shadow-xs my-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <PiggyBank size={32} />
            </div>
            <h3 className="text-[17px] font-bold text-slate-900 bangla mb-1">
              বর্তমানে কোনো সক্রিয় সঞ্চয় প্ল্যান নেই
            </h3>
            <p className="text-[13px] text-slate-500 bangla max-w-[280px] leading-relaxed mb-4">
              সমিতির পক্ষ থেকে নতুন কোনো সঞ্চয় বা কিস্তি স্কিম সক্রিয় করা হলে তা এখানে প্রদর্শিত হবে।
            </p>
            <button
              onClick={loadData}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[12px] font-bold bangla transition-all active:scale-95 flex items-center gap-1.5"
            >
              <RefreshCw size={14} />
              <span>পুনরায় চেষ্টা করুন</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/*
              Render categories dynamically in standard order:
              - 0 active plans: completely hidden
              - 1 active plan: expandable group hidden, rendered directly as category-colored individual card
              - 2+ active plans: expandable category group with header & accordion list
            */}
            {ORDERED_CATEGORY_IDS.map((catId, i) => {
              const theme = SAVINGS_CATEGORY_THEMES[catId];
              const activePlans = activePlansByCategory[catId];

              if (!activePlans || activePlans.length === 0) return null;

              return (
                <motion.div
                  key={catId}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.12), duration: 0.18 }}
                >
                  <SavingsCategorySection
                    theme={theme}
                    activePlans={activePlans}
                    enrolledPlanMap={enrolledPlanMap}
                    isExpanded={Boolean(expandedMap[catId])}
                    onToggleExpand={() => toggleCategory(catId)}
                    onPlanClick={handlePlanClick}
                    onPlanDetailsClick={handlePlanDetailsClick}
                  />
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
