import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MobileLayout } from '../../components/layout/MobileLayout';
import { jointGoalService } from '../../lib/jointGoalService';
import { usePromotionStore } from '../../store/usePromotionStore';
import { SomobayPlan } from '../../store/useSomobayStore';
import { useAuthStore } from '../../store/useAuthStore';
import { 
  ArrowLeft, 
  Search, 
  Bell, 
  Megaphone, 
  FileText, 
  CheckCircle2, 
  Loader2, 
  ChevronRight,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function UserGoalNotices() {
  const { goalId } = useParams<{ goalId: string }>();
  const navigate = useNavigate();
  const activeOrganizationId = useAuthStore(state => state.activeOrganizationId);
  const { promotions, fetchPromotions } = usePromotionStore();

  const [goal, setGoal] = useState<SomobayPlan | null>(null);
  const [selectedNotice, setSelectedNotice] = useState<any | null>(null);

  useEffect(() => {
    fetchPromotions(activeOrganizationId);
    if (goalId) {
      jointGoalService.getGoalById(goalId).then(g => setGoal(g));
    }
  }, [goalId, activeOrganizationId, fetchPromotions]);

  // Contextual goal notices
  const goalName = goal?.name || 'যৌথ সঞ্চয় তহবিল';

  const realGoalNotices = promotions
    .filter(p => p.is_active && (
      (!p.organization_id || p.organization_id === activeOrganizationId) &&
      (p.show_in_notices || (p.category || '').includes('নোটিশ') || (p.category || '').includes('যৌথ') || p.title.includes(goalName))
    ))
    .map(p => ({
      id: p.id,
      title: p.title,
      desc: p.subtitle || p.details_content,
      date: p.created_at ? new Date(p.created_at).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' }) : 'আজ',
      color: 'bg-primary-light text-primary',
      icon: <Bell size={18} />
    }));

  return (
    <MobileLayout
      headerTitle="নোটিশ ও আপডেট"
      backTo={`/goals/${goalId}`}
      showBack={true}
    >
      <div className="space-y-4 pb-12">

        {/* Notices List */}
        {realGoalNotices.length > 0 ? (
          <div className="bg-white rounded-2xl border border-border divide-y divide-slate-100 shadow-sm overflow-hidden">
            {realGoalNotices.map((n) => (
              <div
                key={n.id}
                onClick={() => setSelectedNotice(n)}
                className="p-4 flex items-start gap-3.5 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className={`w-10 h-10 rounded-full ${n.color} flex items-center justify-center shrink-0 mt-0.5 shadow-sm`}>
                  {n.icon}
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="text-[14px] font-bold text-slate-800 bangla leading-snug">
                    {n.title}
                  </h4>
                  <p className="text-[12px] text-slate-600 bangla line-clamp-2 mt-0.5 leading-relaxed">
                    {n.desc}
                  </p>
                  <span className="text-[11px] text-slate-400 bangla block mt-1">
                    {n.date}
                  </span>
                </div>

                <ChevronRight size={16} className="text-slate-300 shrink-0 mt-2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 bg-white rounded-2xl border border-dashed border-border text-center p-6 flex flex-col items-center justify-center gap-2">
            <Bell size={32} className="text-slate-300" />
            <p className="text-[13px] font-medium text-slate-500 bangla">
              বর্তমানে এই যৌথ তহবিলের কোনো নোটিশ নেই
            </p>
          </div>
        )}
      </div>

      {/* Notice Detail Modal */}
      <AnimatePresence>
        {selectedNotice && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl p-5 space-y-4 max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full ${selectedNotice.color} flex items-center justify-center`}>
                    {selectedNotice.icon}
                  </div>
                  <h3 className="text-[15px] font-bold text-slate-800 bangla">{selectedNotice.title}</h3>
                </div>
                <button
                  onClick={() => setSelectedNotice(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] text-slate-400 bangla block">
                  প্রকাশিত: {selectedNotice.date}
                </span>
                <p className="text-[13px] text-slate-700 bangla leading-relaxed">
                  {selectedNotice.desc}
                </p>
              </div>

              <button
                onClick={() => setSelectedNotice(null)}
                className="w-full py-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-[13px] bangla"
              >
                বন্ধ করুন
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </MobileLayout>
  );
}
