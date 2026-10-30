import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MobileLayout } from '../../components/layout/MobileLayout';
import { jointGoalService, JointGoalMetrics } from '../../lib/jointGoalService';
import { SomobayPlan, MemberPlan, JointGoalExpense } from '../../store/useSomobayStore';
import { 
  ArrowLeft, 
  FileText, 
  Download, 
  Printer, 
  Users, 
  Target, 
  DollarSign, 
  TrendingUp, 
  CheckCircle2, 
  Loader2, 
  ChevronRight,
  PieChart,
  Calendar
} from 'lucide-react';
import { motion } from 'motion/react';

export default function GoalReports() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [allGoals, setAllGoals] = useState<SomobayPlan[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<string>(id || '');
  const [goal, setGoal] = useState<SomobayPlan | null>(null);
  const [members, setMembers] = useState<MemberPlan[]>([]);
  const [contributions, setContributions] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<JointGoalExpense[]>([]);
  const [metrics, setMetrics] = useState<JointGoalMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const [activeReportTab, setActiveReportTab] = useState<'summary' | 'members' | 'expenses'>('summary');

  // Load all goals for switcher
  useEffect(() => {
    jointGoalService.getGoals().then(goals => {
      setAllGoals(goals);
      if (!selectedGoalId && goals.length > 0) {
        setSelectedGoalId(goals[0].id);
      }
    });
  }, []);

  const loadReportData = async (goalId: string) => {
    if (!goalId) return;
    setLoading(true);
    try {
      const g = await jointGoalService.getGoalById(goalId);
      setGoal(g);

      const [mems, conts, exps] = await Promise.all([
        jointGoalService.getEnrolledMembers(goalId),
        jointGoalService.getContributions(goalId),
        jointGoalService.getExpenses(goalId)
      ]);

      setMembers(mems);
      setContributions(conts);
      setExpenses(exps);

      if (g) {
        setMetrics(jointGoalService.calculateMetrics(g, mems, conts, exps));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedGoalId) {
      loadReportData(selectedGoalId);
    }
  }, [selectedGoalId]);

  // Export CSV
  const handleExportCSV = () => {
    if (!goal) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += `লক্ষ্যের নাম,${goal.name}\n`;
    csvContent += `নির্ধারিত লক্ষ্য,${metrics?.targetAmount || 0}\n`;
    csvContent += `মোট সংগৃহীত,${metrics?.totalCollected || 0}\n`;
    csvContent += `মোট ব্যয়,${metrics?.totalSpent || 0}\n`;
    csvContent += `অবশিষ্ট তহবিল,${metrics?.availableFund || 0}\n\n`;

    csvContent += 'সদস্য নাম,ফোন,মোট অবদান (টাকা),স্ট্যাটাস\n';

    const memberMap = new Map<string, number>();
    contributions.forEach(c => {
      memberMap.set(c.member_plan_id, (memberMap.get(c.member_plan_id) || 0) + Number(c.amount));
    });

    members.forEach(m => {
      const p = (m as any).profile;
      const total = memberMap.get(m.id) || 0;
      csvContent += `"${p?.full_name || 'সদস্য'}","${p?.phone || ''}",${total},"${total > 0 ? 'পরিশোধিত' : 'বাকি'}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `joint_goal_report_${goal.name}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading && !goal) {
    return (
      <MobileLayout>
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-[13px] text-slate-500 bangla">রিপোর্ট প্রস্তুত হচ্ছে...</p>
        </div>
      </MobileLayout>
    );
  }

  // Pre-calculate member contributions
  const memberContributionsMap = new Map<string, number>();
  contributions.forEach(c => {
    const cur = memberContributionsMap.get(c.member_plan_id) || 0;
    memberContributionsMap.set(c.member_plan_id, cur + Number(c.amount));
  });

  return (
    <MobileLayout
      headerTitle="যৌথ সঞ্চয় রিপোর্ট"
      headerSubtitle="সম্মিলিত তহবিল ও অডিট"
      backTo={`/joint-goals/${id || ''}`}
      showBack={true}
      headerRight={
        <div className="flex items-center gap-0.5">
          <button 
            onClick={handleExportCSV}
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-white active:scale-90 transition-transform focus:outline-none cursor-pointer"
            title="CSV এক্সপোর্ট"
            aria-label="CSV এক্সপোর্ট"
          >
            <Download size={21} strokeWidth={2.2} />
          </button>
          <button 
            onClick={handlePrint}
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-white active:scale-90 transition-transform focus:outline-none cursor-pointer"
            title="প্রিন্ট"
            aria-label="প্রিন্ট"
          >
            <Printer size={21} strokeWidth={2.2} />
          </button>
        </div>
      }
    >

      <div className="p-4 space-y-4 pb-28">
        {/* Goal Selector if multiple */}
        {allGoals.length > 1 && (
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 bangla">লক্ষ্য নির্বাচন করুন:</label>
            <select
              value={selectedGoalId}
              onChange={(e) => setSelectedGoalId(e.target.value)}
              className="w-full p-2.5 bg-white border border-border rounded-xl text-[13px] font-bold bangla text-slate-800 outline-none shadow-sm"
            >
              {allGoals.map(g => (
                <option key={g.id} value={g.id}>
                  {g.name} (৳{(g.target_amount || 0).toLocaleString()})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 4 Financial Summary Cards */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-white rounded-2xl border border-border p-3.5 space-y-1 shadow-sm">
            <span className="text-[10px] text-slate-500 font-bold bangla uppercase tracking-wider">মোট লক্ষ্যমাত্রা</span>
            <div className="text-[18px] font-black text-slate-800 bangla">
              ৳{(metrics?.targetAmount || 0).toLocaleString()}
            </div>
            <p className="text-[10px] text-slate-400 bangla">নির্ধারিত ফান্ড</p>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-3.5 space-y-1 shadow-sm">
            <span className="text-[10px] text-emerald-800 font-bold bangla uppercase tracking-wider">মোট সংগৃহীত</span>
            <div className="text-[18px] font-black text-emerald-700 bangla">
              ৳{(metrics?.totalCollected || 0).toLocaleString()}
            </div>
            <p className="text-[10px] text-emerald-600 bangla">{metrics?.progressPercent || 0}% অর্জিত</p>
          </div>

          <div className="bg-rose-50/70 border border-rose-100 rounded-2xl p-3.5 space-y-1 shadow-sm">
            <span className="text-[10px] text-rose-800 font-bold bangla uppercase tracking-wider">মোট খরচ / ব্যয়</span>
            <div className="text-[18px] font-black text-rose-700 bangla">
              ৳{(metrics?.totalSpent || 0).toLocaleString()}
            </div>
            <p className="text-[10px] text-rose-600 bangla">{expenses.length} টি ব্যয় রেকর্ড</p>
          </div>

          <div className="bg-sky-50/70 border border-sky-100 rounded-2xl p-3.5 space-y-1 shadow-sm">
            <span className="text-[10px] text-sky-800 font-bold bangla uppercase tracking-wider">বর্তমান তহবিল স্থিতি</span>
            <div className="text-[18px] font-black text-sky-700 bangla">
              ৳{(metrics?.availableFund || 0).toLocaleString()}
            </div>
            <p className="text-[10px] text-sky-600 bangla">ব্যবহারযোগ্য ক্যাশ</p>
          </div>
        </div>

        {/* Sub-Tabs: সংক্ষিপ্ত | সদস্য অডিট | খরচ */}
        <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveReportTab('summary')}
            className={`flex-1 py-1.5 rounded-lg text-[12px] font-bold bangla transition-all ${
              activeReportTab === 'summary' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
            }`}
          >
            সারসংক্ষেপ
          </button>
          <button
            onClick={() => setActiveReportTab('members')}
            className={`flex-1 py-1.5 rounded-lg text-[12px] font-bold bangla transition-all ${
              activeReportTab === 'members' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
            }`}
          >
            সদস্য অডিট ({members.length})
          </button>
          <button
            onClick={() => setActiveReportTab('expenses')}
            className={`flex-1 py-1.5 rounded-lg text-[12px] font-bold bangla transition-all ${
              activeReportTab === 'expenses' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
            }`}
          >
            ব্যয় বিবরণী ({expenses.length})
          </button>
        </div>

        {/* TAB 1: SUMMARY AUDIT */}
        {activeReportTab === 'summary' && (
          <div className="bg-white rounded-2xl border border-border p-4 shadow-sm space-y-3">
            <h3 className="text-[14px] font-bold text-slate-800 bangla border-b border-slate-100 pb-2">
              সাধারণ বিবরণ ও স্বাস্থ্য সূচক
            </h3>

            <div className="space-y-2 text-[13px] bangla">
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">লক্ষ্যের নাম:</span>
                <span className="font-bold text-slate-800">{goal?.name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">বর্তমান স্ট্যাটাস:</span>
                <span className="font-bold text-emerald-700">{goal?.status === 'completed' ? 'সম্পন্ন' : 'সক্রিয়'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">মোট অংশগ্রহণকারী:</span>
                <span className="font-bold text-slate-800">{members.length} জন</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">অবদানকারী সদস্য:</span>
                <span className="font-bold text-emerald-700">{metrics?.contributorsCount || 0} জন</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">বাকি থাকা সদস্য:</span>
                <span className="font-bold text-amber-700">{metrics?.pendingContributorsCount || 0} জন</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">সদস্যপ্রতি গড় অবদান:</span>
                <span className="font-bold text-slate-800">৳{(metrics?.averageContribution || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">তহবিল ব্যবহার হার:</span>
                <span className="font-bold text-rose-700">
                  {metrics?.totalCollected ? Math.round(((metrics.totalSpent || 0) / metrics.totalCollected) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MEMBER WISE AUDIT */}
        {activeReportTab === 'members' && (
          <div className="bg-white rounded-2xl border border-border p-4 shadow-sm space-y-3">
            <h3 className="text-[14px] font-bold text-slate-800 bangla border-b border-slate-100 pb-2">
              সদস্যভিত্তিক অবদান বিবরণী
            </h3>

            {members.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {members.map(m => {
                  const p = (m as any).profile;
                  const total = memberContributionsMap.get(m.id) || 0;
                  const targetShare = goal?.installment_amount || 
                    (goal?.target_amount && goal.total_members_limit ? Math.round(goal.target_amount / goal.total_members_limit) : 10000);
                  const memberPct = targetShare > 0 ? Math.min(100, Math.round((total / targetShare) * 100)) : 0;

                  return (
                    <div key={m.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <h4 className="text-[13px] font-bold text-slate-800 bangla leading-snug">
                          {p?.full_name || 'সদস্য'}
                        </h4>
                        <p className="text-[11px] text-slate-400 bangla">
                          {p?.phone || 'ফোন নেই'} • অর্জিত: {memberPct}%
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-[14px] font-black text-emerald-700 bangla block">
                          ৳{total.toLocaleString()}
                        </span>
                        <span className={`text-[10px] font-bold bangla px-2 py-0.5 rounded-full inline-block ${
                          total > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {total > 0 ? 'পরিশোধিত' : 'বাকি'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-slate-400 text-center py-6 text-[13px] bangla">কোন সদস্য তথ্য পাওয়া যায়নি</p>
            )}
          </div>
        )}

        {/* TAB 3: EXPENSE AUDIT */}
        {activeReportTab === 'expenses' && (
          <div className="bg-white rounded-2xl border border-border p-4 shadow-sm space-y-3">
            <h3 className="text-[14px] font-bold text-slate-800 bangla border-b border-slate-100 pb-2">
              তহবিল ব্যয় ও খরচ অডিট
            </h3>

            {expenses.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {expenses.map(e => (
                  <div key={e.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <h4 className="text-[13px] font-bold text-slate-800 bangla leading-snug">
                        {e.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 bangla">
                        তারিখ: {e.expense_date} {e.spent_by ? `• ব্যয়কারী: ${e.spent_by}` : ''}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[14px] font-black text-rose-700 bangla block">
                        -৳{Number(e.amount).toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400 bangla">
                        {e.note || 'অনুমোদিত'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-center py-6 text-[13px] bangla">কোন খরচ এন্ট্রি নেই</p>
            )}
          </div>
        )}

        {/* Action Button: Export Actions */}
        <div className="pt-2 flex gap-2">
          <button
            onClick={handleExportCSV}
            className="flex-1 py-3.5 rounded-xl bg-primary text-white font-bold text-[13px] bangla flex items-center justify-center gap-2 active:scale-95 shadow-sm transition-all"
          >
            <Download size={16} />
            <span>Excel / CSV ডাউনলোড</span>
          </button>
          <button
            onClick={handlePrint}
            className="py-3.5 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-[13px] bangla flex items-center justify-center gap-1.5 active:scale-95 transition-all"
          >
            <Printer size={16} />
            <span>প্রিন্ট</span>
          </button>
        </div>
      </div>
    </MobileLayout>
  );
}
