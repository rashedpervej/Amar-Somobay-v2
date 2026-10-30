import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MobileLayout } from '../components/layout/MobileLayout';
import { useSomobayStore } from '../store/useSomobayStore';
import { useWalletStore } from '../store/useWalletStore';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../lib/supabase';
import { 
  ArrowLeft, 
  FileSpreadsheet, 
  Download, 
  Printer, 
  Users, 
  PiggyBank, 
  CreditCard, 
  RotateCw, 
  Target, 
  AlertCircle, 
  Check, 
  ChevronRight,
  FileText,
  Calendar
} from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminReports() {
  const navigate = useNavigate();
  const { cooperativeSlug } = useParams<{ cooperativeSlug?: string }>();
  const { profile, activeOrganizationId } = useAuthStore();
  const { plans, memberPlans, adminStats } = useSomobayStore();
  const { allActivity } = useWalletStore();
  const [activeTab, setActiveTab] = useState<'summary' | 'members' | 'savings' | 'loans'>('summary');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const downloadCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const BOM = '\uFEFF';
    const csvContent = BOM + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportMembers = async (format: 'csv' | 'print') => {
    setDownloadingId('members');
    try {
      let query = supabase
        .from('organization_members')
        .select(`
          id,
          role,
          status,
          joined_at,
          profile:user_id(id, full_name, phone, created_at)
        `)
        .eq('status', 'active');

      if (activeOrganizationId) {
        query = query.eq('organization_id', activeOrganizationId);
      }

      const { data } = await query;
      const rows = (data || []).map((m: any, i: number) => [
        i + 1,
        `SM-${(m.profile?.id || m.id).substring(0, 3).toUpperCase()}`,
        m.profile?.full_name || 'নাম নেই',
        m.profile?.phone || '—',
        m.role === 'cooperative_admin' || m.role === 'admin' ? 'অ্যাডমিন' : 'সদস্য',
        m.joined_at ? new Date(m.joined_at).toLocaleDateString('bn-BD') : '—'
      ]);

      if (format === 'csv') {
        downloadCSV('shodoshsho_talika', ['ক্রমিক', 'আইডি', 'সদস্যের নাম', 'মোবাইল', 'রোল', 'যোগদানের তারিখ'], rows);
      } else {
        window.print();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleExportSavings = async (format: 'csv' | 'print') => {
    setDownloadingId('savings');
    try {
      let query = supabase
        .from('plan_payments')
        .select(`
          id, amount, penalty_paid, payment_date, note, type,
          member_plan:member_plan_id!inner(
            id,
            plan:somobay_plans!inner(id, organization_id)
          )
        `);

      if (activeOrganizationId) {
        query = query.eq('member_plan.plan.organization_id', activeOrganizationId);
      }

      const { data } = await query;
      const rows = (data || []).map((p: any, i: number) => [
        i + 1,
        p.payment_date || 'আজ',
        p.type === 'installment_payment' ? 'কিস্তি জমা' : 'সঞ্চয়',
        p.amount,
        p.penalty_paid || 0,
        p.note || '—'
      ]);

      if (format === 'csv') {
        downloadCSV('shonchoy_report', ['ক্রমিক', 'তারিখ', 'ধরণ', 'আদায় (৳)', 'জরিমানা (৳)', 'নোট'], rows);
      } else {
        window.print();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleExportOverdue = async (format: 'csv' | 'print') => {
    setDownloadingId('overdue');
    try {
      const rows = memberPlans
        .filter(mp => mp.status === 'active' && mp.next_due_date && new Date(mp.next_due_date) < new Date())
        .map((mp, i) => [
          i + 1,
          mp.profile?.full_name || 'সদস্য',
          mp.plan?.name || 'সমিতি',
          mp.plan?.installment_amount || 0,
          mp.pending_fine || 0,
          mp.next_due_date || '—'
        ]);

      if (format === 'csv') {
        downloadCSV('bokeya_sodoshsho', ['ক্রমিক', 'সদস্যের নাম', 'সমিতি', 'বকেয়া কিস্তি (৳)', 'জরিমানা (৳)', 'নির্ধারিত তারিখ'], rows);
      } else {
        window.print();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDownloadingId(null);
    }
  };

  const reportsList = [
    {
      id: 'members',
      title: 'সদস্য তালিকা রিপোর্ট',
      desc: 'PDF / Excel ডাউনলোড',
      icon: <Users size={20} />,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      onDownload: () => handleExportMembers('csv')
    },
    {
      id: 'savings',
      title: 'মাসিক সঞ্চয় রিপোর্ট',
      desc: 'PDF / Excel ডাউনলোড',
      icon: <Calendar size={20} />,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      onDownload: () => handleExportSavings('csv')
    },
    {
      id: 'loans',
      title: 'ঋণ রিপোর্ট',
      desc: 'PDF / Excel ডাউনলোড',
      icon: <CreditCard size={20} />,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      onDownload: () => handleExportSavings('csv')
    },
    {
      id: 'rosca',
      title: 'রোসকা ড্র রিপোর্ট',
      desc: 'PDF / Excel ডাউনলোড',
      icon: <RotateCw size={20} />,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      onDownload: () => handleExportSavings('csv')
    },
    {
      id: 'joint-goal',
      title: 'জয়েন্ট গোল অগ্রগতি',
      desc: 'PDF / Excel ডাউনলোড',
      icon: <Target size={20} />,
      color: 'text-teal-600',
      bg: 'bg-teal-50',
      onDownload: () => handleExportSavings('csv')
    },
    {
      id: 'overdue',
      title: 'বকেয়া সদস্য তালিকা',
      desc: 'PDF / Excel ডাউনলোড',
      icon: <AlertCircle size={20} />,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      onDownload: () => handleExportOverdue('csv')
    }
  ];

  return (
    <MobileLayout
      headerTitle="রিপোর্ট ও অডিট হিসাব"
      showBack={true}
      backTo={cooperativeSlug ? `/somobay/${cooperativeSlug}` : '/dashboard'}
    >

      {/* Segmented Tabs (Screen 11: সারসংক্ষেপ, সদস্য, সঞ্চয়, ঋণ) */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-[14px] text-[12px] font-semibold bangla">
        {[
          { id: 'summary', label: 'সারসংক্ষেপ' },
          { id: 'members', label: 'সদস্য' },
          { id: 'savings', label: 'সঞ্চয়' },
          { id: 'loans', label: 'ঋণ' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-2 rounded-[10px] transition-all text-center ${
              activeTab === tab.id
                ? 'bg-white text-primary font-bold shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Reports Download List (Screen 11) */}
      <div className="flex flex-col gap-2.5 pb-20">
        {reportsList.map((rep) => (
          <div
            key={rep.id}
            className="bg-white p-3.5 rounded-[18px] border border-border shadow-[0_2px_6px_rgba(0,0,0,0.02)] flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-2xl ${rep.bg} ${rep.color} flex items-center justify-center shrink-0`}>
                {rep.icon}
              </div>
              <div>
                <h3 className="text-[14px] font-bold text-slate-800 bangla leading-tight">{rep.title}</h3>
                <p className="text-[11px] text-slate-400 bangla mt-0.5">{rep.desc}</p>
              </div>
            </div>

            <button
              onClick={rep.onDownload}
              disabled={downloadingId === rep.id}
              className="px-3 py-1.5 rounded-xl bg-primary-light text-primary text-[12px] font-bold bangla border border-emerald-200 active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
            >
              <Download size={14} />
              <span>ডাউনলোড</span>
            </button>
          </div>
        ))}
      </div>
    </MobileLayout>
  );
}
