import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MobileLayout } from '../../components/layout/MobileLayout';
import { roscaService } from '../../lib/roscaService';
import { SomobayPlan, MemberPlan, RoscaPeriod } from '../../store/useSomobayStore';
import { 
  ArrowLeft, 
  BarChart3, 
  Download, 
  FileText, 
  FileSpreadsheet, 
  Calendar, 
  ChevronDown, 
  TrendingUp, 
  Users, 
  Loader2 
} from 'lucide-react';
import { motion } from 'motion/react';

export default function RoscaReports() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [plan, setPlan] = useState<SomobayPlan | null>(null);
  const [periods, setPeriods] = useState<RoscaPeriod[]>([]);
  const [enrolledMembers, setEnrolledMembers] = useState<MemberPlan[]>([]);
  const [loading, setLoading] = useState(true);

  // Sub-tabs: 'summary' | 'members' | 'financial' | 'draws'
  const [activeTab, setActiveTab] = useState<'summary' | 'members' | 'financial' | 'draws'>('summary');

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const p = await roscaService.getRoscaPlanById(id);
        setPlan(p);
        const per = await roscaService.getRoscaPeriods(id);
        setPeriods(per);
        const mem = await roscaService.getEnrolledMembers(id);
        setEnrolledMembers(mem);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleExportPdf = () => {
    window.print();
  };

  const handleExportExcel = () => {
    if (!plan) return;
    const headers = ['Round', 'Winner', 'Amount', 'Date', 'Status'];
    const rows = periods.map(p => [
      `Month ${p.period_no}`,
      p.recipient?.full_name || 'N/A',
      p.payout_amount || plan.installment_amount * (plan.total_members_limit || 12),
      p.drawn_at || p.due_date || '',
      p.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${plan.name}_rosca_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading || !plan) {
    return (
      <MobileLayout>
        <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-2">
          <Loader2 className="animate-spin text-primary" size={32} />
          <span className="text-[14px] bangla">রিপোর্ট লোড হচ্ছে...</span>
        </div>
      </MobileLayout>
    );
  }

  const durationMonths = plan.duration_months || 12;
  const membersCount = enrolledMembers.length || plan.total_members_limit || 12;
  const potAmount = membersCount * plan.installment_amount;
  const completedDrawn = periods.filter(p => p.status === 'drawn').length;

  const totalCollected = completedDrawn * potAmount;
  const totalPayout = completedDrawn * potAmount;
  const totalPaidEstimate = Math.round(totalCollected * 0.85);
  const totalDueEstimate = totalCollected - totalPaidEstimate;

  const monthlyBars = [
    { label: 'জুন', value: 65 },
    { label: 'জুলাই', value: 85 },
    { label: 'আগ', value: 70 },
    { label: 'সেপ্ট', value: 50 },
    { label: 'অক্টো', value: 95 }
  ];

  return (
    <MobileLayout
      headerTitle="রোসকা রিপোর্ট"
      backTo={`/rosca/${id}`}
      showBack={true}
    >
      {/* Sub-tabs: সারসংক্ষেপ | সদস্য | অর্থনৈতিক | ড্র */}
      <div className="flex border-b border-border gap-4 text-[13px] bangla font-medium">
        {[
          { key: 'summary', label: 'সারসংক্ষেপ' },
          { key: 'members', label: 'সদস্য' },
          { key: 'financial', label: 'অর্থনৈতিক' },
          { key: 'draws', label: 'ড্র' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as any)}
            className={`pb-2 whitespace-nowrap relative transition-colors ${
              activeTab === t.key ? 'text-primary font-bold' : 'text-text-secondary'
            }`}
          >
            {t.label}
            {activeTab === t.key && (
              <motion.div layoutId="report-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

      <div className="bg-white px-3.5 py-2.5 rounded-2xl border border-border flex items-center justify-between text-[13px] font-bold text-text-primary bangla">
        <span>সাইকেল {(plan?.current_cycle || 1).toLocaleString('bn-BD')}</span>
        <ChevronDown size={18} className="text-slate-400" />
      </div>

      {/* 4 Financial Metrics (Screen 11) */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-white p-3.5 rounded-2xl border border-border shadow-xs">
          <span className="text-[11px] text-text-secondary bangla block">মোট সংগৃহীত</span>
          <span className="text-[17px] font-bold text-text-primary bangla block mt-0.5">
            ৳ {totalCollected.toLocaleString()}
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-border shadow-xs">
          <span className="text-[11px] text-text-secondary bangla block">মোট ড্র প্রদান</span>
          <span className="text-[17px] font-bold text-text-primary bangla block mt-0.5">
            ৳ {totalPayout.toLocaleString()}
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-border shadow-xs">
          <span className="text-[11px] text-text-secondary bangla block">পরিশোধিত</span>
          <span className="text-[17px] font-bold text-[#16A34A] bangla block mt-0.5">
            ৳ {totalPaidEstimate.toLocaleString()}
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-border shadow-xs">
          <span className="text-[11px] text-text-secondary bangla block">বকেয়া</span>
          <span className="text-[17px] font-bold text-[#DC2626] bangla block mt-0.5">
            ৳ {totalDueEstimate.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Bar Chart Section: মাসভিত্তিক সংগ্রহ (Screen 11) */}
      <div className="bg-white rounded-3xl p-5 border border-border shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[14px] font-bold text-text-primary bangla">মাসভিত্তিক সংগ্রহ</h3>
          <span className="text-[11px] font-semibold text-primary bg-primary-light px-2.5 py-0.5 rounded-lg bangla flex items-center gap-1">
            <span>সংগ্রহ</span>
            <ChevronDown size={12} />
          </span>
        </div>

        {/* Visual Bar Chart */}
        <div className="h-44 flex items-end justify-between gap-3 pt-6 px-2 border-b border-slate-100">
          {monthlyBars.map((b, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${b.value}%` }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="w-full max-w-[32px] bg-primary rounded-t-xl hover:bg-primary-dark transition-colors relative group"
              >
                {/* Tooltip on hover */}
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] bg-slate-800 text-white px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  {b.value}%
                </span>
              </motion.div>
              <span className="text-[11px] font-bold text-text-secondary bangla">
                {b.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Export Buttons (Screen 11) */}
      <div className="flex gap-2.5 pt-1">
        <button
          onClick={handleExportPdf}
          className="flex-1 h-[46px] bg-white border border-border hover:bg-slate-50 text-text-primary rounded-xl font-semibold bangla text-[13.5px] flex items-center justify-center gap-1.5 shadow-xs active:scale-[0.99] transition-all"
        >
          <FileText size={16} className="text-primary" />
          <span>PDF ডাউনলোড</span>
        </button>

        <button
          onClick={handleExportExcel}
          className="flex-1 h-[46px] bg-white border border-border hover:bg-slate-50 text-text-primary rounded-xl font-semibold bangla text-[13.5px] flex items-center justify-center gap-1.5 shadow-xs active:scale-[0.99] transition-all"
        >
          <FileSpreadsheet size={16} className="text-[#16A34A]" />
          <span>Excel ডাউনলোড</span>
        </button>
      </div>
    </MobileLayout>
  );
}
