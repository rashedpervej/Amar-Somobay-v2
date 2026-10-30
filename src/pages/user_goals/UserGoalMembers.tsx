import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MobileLayout } from '../../components/layout/MobileLayout';
import { jointGoalService } from '../../lib/jointGoalService';
import { useAuthStore } from '../../store/useAuthStore';
import { SomobayPlan, MemberPlan } from '../../store/useSomobayStore';
import { 
  ArrowLeft, 
  Search, 
  ChevronDown, 
  ChevronRight, 
  Loader2, 
  Home, 
  Users,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'motion/react';

export default function UserGoalMembers() {
  const { goalId } = useParams<{ goalId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuthStore();

  const [allGoals, setAllGoals] = useState<SomobayPlan[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<string>(goalId || '');
  const [members, setMembers] = useState<MemberPlan[]>([]);
  const [contributions, setContributions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    jointGoalService.getGoals().then(goals => {
      setAllGoals(goals);
      if (!selectedGoalId && goals.length > 0) {
        setSelectedGoalId(goals[0].id);
      }
    });
  }, []);

  const loadMembers = async (gid: string) => {
    if (!gid) return;
    setLoading(true);
    try {
      const [mems, conts] = await Promise.all([
        jointGoalService.getEnrolledMembers(gid),
        jointGoalService.getContributions(gid)
      ]);
      setMembers(mems);
      setContributions(conts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedGoalId) {
      loadMembers(selectedGoalId);
    }
  }, [selectedGoalId]);

  // Map member contributions
  const contributionMap = new Map<string, number>();
  contributions.forEach(c => {
    const cur = contributionMap.get(c.member_plan_id) || 0;
    contributionMap.set(c.member_plan_id, cur + Number(c.amount));
  });

  const filteredMembers = members.filter(m => {
    const p = (m as any).profile;
    const name = p?.full_name || '';
    const phone = p?.phone || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase()) || phone.includes(searchQuery);
  });

  return (
    <MobileLayout
      headerTitle="সদস্য সমূহ"
      backTo={`/goals/${selectedGoalId}`}
      showBack={true}
    >
      <div className="space-y-4 pb-12">

        {/* Goal Selector Pill */}
        <div className="relative">
          <select
            value={selectedGoalId}
            onChange={(e) => {
              setSelectedGoalId(e.target.value);
              navigate(`/goals/${e.target.value}/members`);
            }}
            className="w-full pl-12 pr-10 py-3 bg-white border border-border rounded-2xl text-[14px] font-bold text-slate-800 bangla appearance-none outline-none shadow-sm cursor-pointer"
          >
            {allGoals.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>

          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center pointer-events-none">
            <Home size={15} />
          </div>
          <ChevronDown size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        {/* Search Field */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="নাম বা সদস্য আইডি দিয়ে খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-border rounded-xl text-[13px] bangla text-slate-800 outline-none focus:border-primary focus:bg-white transition-all"
          />
        </div>

        {/* Members List */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-[13px] text-slate-500 bangla">সদস্য তালিকা লোড হচ্ছে...</p>
          </div>
        ) : filteredMembers.length > 0 ? (
          <div className="bg-white rounded-2xl border border-border divide-y divide-slate-100 shadow-sm overflow-hidden">
            {filteredMembers.map((m, idx) => {
              const p = (m as any).profile;
              const isCurrentUser = p?.id === profile?.id;
              const total = contributionMap.get(m.id) || 0;
              const code = `SM-${String(idx + 1).padStart(3, '0')}`;

              return (
                <div
                  key={m.id}
                  onClick={() => {
                    if (isCurrentUser) {
                      navigate(`/goals/${selectedGoalId}/members/me`);
                    } else {
                      navigate(`/goals/${selectedGoalId}/my-contribution`);
                    }
                  }}
                  className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-[13px] bangla shrink-0">
                      {p?.avatar_url ? (
                        <img src={p.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        p?.full_name?.charAt(0) || 'স'
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-[14px] font-bold text-slate-800 bangla leading-snug truncate">
                          {p?.full_name || 'সদস্য'}
                        </h4>
                        {isCurrentUser && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded bangla">
                            আপনি
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 bangla block mt-0.5">
                        {code}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[14px] font-black text-primary bangla">
                      ৳ {total.toLocaleString()}
                    </span>
                    <ChevronRight size={16} className="text-slate-400" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 bg-white rounded-2xl border border-dashed border-slate-200 text-center p-6 space-y-2">
            <Users size={32} className="mx-auto text-slate-300" />
            <h4 className="text-[14px] font-bold text-slate-700 bangla">কোন সদস্য পাওয়া যায়নি</h4>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
