import React, { useEffect, useState } from 'react';
import { MobileLayout } from '../components/layout/MobileLayout';
import { supabase } from '../lib/supabase';
import { 
  Search, 
  User, 
  ChevronRight, 
  Filter, 
  ChevronDown, 
  SortAsc, 
  SortDesc, 
  Calendar, 
  Wallet, 
  HandCoins, 
  UserPlus, 
  Copy, 
  Check, 
  Share2, 
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Users,
  ShieldCheck,
  Mail,
  Phone
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../components/ThemeProvider';
import { useSettingsStore } from '../store/useSettingsStore';
import { useAuthStore } from '../store/useAuthStore';
import { QuickCollectModal } from '../components/QuickCollectModal';
import { ReceiptModal, ReceiptData } from '../components/ReceiptModal';
import { AddMemberModal } from '../components/AddMemberModal';
import { isDateOverdue } from '../lib/dateUtils';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: 'admin' | 'member' | 'pending';
  phone?: string;
  avatar_url?: string;
  created_at: string;
  member_wallets?: { balance: number }[];
  member_plans?: { status: string; next_due_date: string | null }[];
}

interface JoinRequest {
  id: string;
  organization_id: string;
  user_id: string;
  role: string;
  status: 'pending' | 'active' | 'rejected';
  joined_at: string;
  profile?: {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    avatar_url: string | null;
    created_at: string;
  };
}

type SortOption = 'name' | 'date' | 'balance';
type FilterType = 'all' | 'admin' | 'member' | 'pending' | 'overdue';

export default function MemberList() {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const settings = useSettingsStore(state => state.settings);
  const profile = useAuthStore(state => state.profile);
  const activeOrganization = useAuthStore(state => state.activeOrganization);
  const fetchMemberships = useAuthStore(state => state.fetchMemberships);
  const isAdmin = profile?.role === 'admin';

  // Tabs: 'members' (সক্রিয় সদস্য) or 'requests' (যোগদানের আবেদন)
  const [mainTab, setMainTab] = useState<'members' | 'requests'>('members');
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestActionLoadingId, setRequestActionLoadingId] = useState<string | null>(null);

  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);

  // Quick Collect State
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [selectedMemberForCollect, setSelectedMemberForCollect] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  useEffect(() => {
    fetchMemberships();
  }, [fetchMemberships]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'requests') {
      setMainTab('requests');
    }
    const filterParam = params.get('filter');
    if (filterParam === 'overdue') {
      setRoleFilter('overdue');
      setShowFilters(true);
    } else if (filterParam && ['all', 'admin', 'member', 'pending'].includes(filterParam)) {
      setRoleFilter(filterParam as FilterType);
    }
    const qParam = params.get('q');
    if (qParam) {
      setSearchQuery(qParam);
    }
    fetchMembers();
  }, [location.search, activeOrganization?.id]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    const params = new URLSearchParams(location.search);
    if (val.trim()) {
      params.set('q', val.trim());
    } else {
      params.delete('q');
    }
    navigate({ search: params.toString() ? `?${params.toString()}` : '' }, { replace: true });
  };

  const handleFilterChange = (filterId: FilterType) => {
    setRoleFilter(filterId);
    const params = new URLSearchParams(location.search);
    if (filterId !== 'all') {
      params.set('filter', filterId);
    } else {
      params.delete('filter');
    }
    navigate({ search: params.toString() ? `?${params.toString()}` : '' }, { replace: true });
  };

  const handleTabChange = (newTab: 'members' | 'requests') => {
    setMainTab(newTab);
    const params = new URLSearchParams(location.search);
    if (newTab === 'requests') {
      params.set('tab', 'requests');
    } else {
      params.delete('tab');
    }
    navigate({ search: params.toString() ? `?${params.toString()}` : '' }, { replace: true });
  };

  useEffect(() => {
    if (activeOrganization?.id) {
      fetchJoinRequests();
    }
  }, [activeOrganization?.id]);

  const fetchJoinRequests = async () => {
    if (!activeOrganization?.id) return;
    try {
      setRequestsLoading(true);
      const { data, error } = await supabase
        .from('organization_members')
        .select(`
          id,
          organization_id,
          user_id,
          role,
          status,
          joined_at,
          profile:profiles (
            id,
            full_name,
            email,
            phone,
            avatar_url,
            created_at
          )
        `)
        .eq('organization_id', activeOrganization.id)
        .eq('status', 'pending')
        .order('joined_at', { ascending: false });

      if (error) {
        console.error('Error fetching join requests:', error);
      } else {
        setJoinRequests((data as any) || []);
      }
    } catch (err) {
      console.error('Fatal fetching join requests:', err);
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleApproveRequest = async (request: JoinRequest) => {
    const applicantName = request.profile?.full_name || 'এই আবেদনকারী';
    if (!confirm(`আপনি কি "${applicantName}"-এর যোগদানের আবেদন অনুমোদন করতে চান?`)) return;

    setRequestActionLoadingId(request.id);
    try {
      const { error: omErr } = await supabase
        .from('organization_members')
        .update({
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', request.id);

      if (omErr) throw omErr;

      // Upgrade profile role from pending to member if applicable
      await supabase
        .from('profiles')
        .update({
          role: 'member',
          status: 'active',
        } as any)
        .eq('id', request.user_id)
        .eq('role', 'pending');

      // Create notification
      await supabase
        .from('notifications')
        .insert([{
          user_id: request.user_id,
          organization_id: request.organization_id,
          title: 'সমিতিতে যোগদানের আবেদন অনুমোদিত!',
          message: `অভিনন্দন! "${activeOrganization?.name || 'সমিতি'}"-তে আপনার যোগদানের আবেদন অনুমোদিত হয়েছে। এখন আপনি নিয়মিত সঞ্চয় ও কার্যক্রমে অংশ নিতে পারবেন।`,
          type: 'system',
          is_read: false,
        }]);

      alert(`"${applicantName}" সফলভাবে সদস্য হিসেবে অনুমোদিত হয়েছে!`);
      await Promise.all([fetchJoinRequests(), fetchMembers()]);
    } catch (err: any) {
      console.error('Error approving request:', err);
      alert(err.message || 'অনুমোদন করতে সমস্যা হয়েছে।');
    } finally {
      setRequestActionLoadingId(null);
    }
  };

  const handleRejectRequest = async (request: JoinRequest) => {
    const applicantName = request.profile?.full_name || 'এই আবেদনকারী';
    const reason = prompt(`"${applicantName}"-এর যোগদানের আবেদন বাতিলের কারণ বা মন্তব্য লিখুন:`, 'তথ্য অসম্পূর্ণ বা এলাকা বহির্ভূত');
    if (reason === null) return;

    setRequestActionLoadingId(request.id);
    try {
      try {
        await supabase
          .from('organization_members')
          .update({
            status: 'rejected',
            rejection_reason: reason.trim() || 'তথ্য অসম্পূর্ণ বা এলাকা বহির্ভূত',
            rejected_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', request.id);
      } catch {
        await supabase
          .from('organization_members')
          .update({
            status: 'rejected',
            updated_at: new Date().toISOString(),
          })
          .eq('id', request.id);
      }

      await supabase
        .from('notifications')
        .insert([{
          user_id: request.user_id,
          organization_id: request.organization_id,
          title: 'যোগদানের আবেদন বাতিল',
          message: `দুঃখিত, "${activeOrganization?.name || 'সমিতি'}"-তে আপনার যোগদানের আবেদনটি বাতিল করা হয়েছে। কারণ: ${reason.trim() || 'প্রয়োজনীয় শর্তাবলী অপূর্ণ'}`,
          type: 'system',
          is_read: false,
        }]);

      if (typeof BroadcastChannel !== 'undefined') {
        try { new BroadcastChannel('amar_somobay_live_sync').postMessage({ type: 'DATA_CHANGED' }); } catch (_) {}
      }

      alert(`"${applicantName}"-এর আবেদন সফলভাবে বাতিল করা হয়েছে।`);
      await fetchJoinRequests();
    } catch (err: any) {
      console.error('Error rejecting request:', err);
      alert(err.message || 'আবেদন বাতিল করতে সমস্যা হয়েছে।');
    } finally {
      setRequestActionLoadingId(null);
    }
  };

  const fetchMembers = async () => {
    try {
      setLoading(true);
      if (activeOrganization?.id) {
        const { data: orgMembers, error: orgErr } = await supabase
          .from('organization_members')
          .select(`
            user_id,
            role,
            status,
            user:profiles (
              *,
              member_wallets (
                balance
              ),
              member_plans (
                status,
                next_due_date
              )
            )
          `)
          .eq('organization_id', activeOrganization.id)
          .eq('status', 'active');

        if (!orgErr && orgMembers && orgMembers.length > 0) {
          const mapped = orgMembers
            .map((om: any) => om.user)
            .filter(Boolean);
          setMembers(mapped);
          return;
        }
      }

      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          member_wallets (
            balance
          ),
          member_plans (
            status,
            next_due_date
          )
        `);

      if (error) {
        console.error('Error fetching members:', error);
        const { data: basicData, error: basicError } = await supabase
          .from('profiles')
          .select('*');
        
        if (basicError) throw basicError;
        setMembers(basicData || []);
      } else {
        setMembers(data || []);
      }
    } catch (err) {
      console.error('Fatal error fetching members:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedMembers = members
    .filter(member => {
      const matchesSearch = 
        member.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || 
                         (roleFilter === 'overdue' 
                           ? member.member_plans?.some(p => p.status === 'active' && isDateOverdue(p.next_due_date))
                           : member.role === roleFilter);
      
      return matchesSearch && matchesRole;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = (a.full_name || '').localeCompare(b.full_name || '');
      } else if (sortBy === 'date') {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortBy === 'balance') {
        const balanceA = a.member_wallets?.[0]?.balance || 0;
        const balanceB = b.member_wallets?.[0]?.balance || 0;
        comparison = balanceA - balanceB;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const totalCount = members.length;
  const overdueMembersList = members.filter(m => m.member_plans?.some(p => p.status === 'active' && isDateOverdue(p.next_due_date)));
  const overdueCount = overdueMembersList.length;
  const activeCount = members.filter(m => m.role === 'member' || m.role === 'admin').length - overdueCount;

  return (
    <MobileLayout
      headerTitle="সদস্য ব্যবস্থাপনা"
      headerRight={
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-white active:scale-90 transition-transform focus:outline-none cursor-pointer"
          title="ফিল্টার"
          aria-label="ফিল্টার"
        >
          <Filter size={22} strokeWidth={showFilters ? 2.8 : 2.2} />
        </button>
      }
    >

      {/* 2 Primary Tabs: সক্রিয় সদস্য / যোগদানের আবেদন */}
      {isAdmin && (
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-2xl">
          <button
            type="button"
            onClick={() => handleTabChange('members')}
            className={`py-2.5 px-3 rounded-xl text-[13px] font-bold bangla flex items-center justify-center gap-2 transition-all cursor-pointer ${
              mainTab === 'members'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users size={16} />
            <span>সক্রিয় সদস্য ({members.length})</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('requests')}
            className={`py-2.5 px-3 rounded-xl text-[13px] font-bold bangla flex items-center justify-center gap-2 transition-all cursor-pointer relative ${
              mainTab === 'requests'
                ? 'bg-white text-amber-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock size={16} className={mainTab === 'requests' ? 'text-amber-600' : ''} />
            <span>যোগদানের আবেদন</span>
            {joinRequests.length > 0 && (
              <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-white text-[10px] font-black flex items-center justify-center">
                {joinRequests.length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* TAB 1: MEMBERS */}
      {mainTab === 'members' && (
        <>
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="নাম, মোবাইল বা সদস্য আইডি দিয়ে খুঁজুন..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full bg-white border border-border rounded-[16px] py-2.5 pl-10 pr-4 text-[13px] bangla text-slate-800 shadow-[0_2px_6px_rgba(0,0,0,0.02)] focus:outline-none focus:border-primary"
            />
          </div>

          {/* Filter Chips (Screen 3: সকল, সক্রিয়, বকেয়া) */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            {[
              { id: 'all', label: `সকল (${totalCount})` },
              { id: 'member', label: `সক্রিয় (${Math.max(0, activeCount)})` },
              { id: 'overdue', label: `বকেয়া (${overdueCount})` }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => handleFilterChange(f.id as any)}
                className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold bangla shrink-0 transition-all ${
                  roleFilter === f.id
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-border'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Member List */}
          <div className="flex flex-col gap-2.5 pb-20">
            {loading ? (
              <div className="flex flex-col gap-2.5">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-16 bg-white rounded-[16px] border border-border animate-pulse" />
                ))}
              </div>
            ) : filteredAndSortedMembers.length > 0 ? (
              filteredAndSortedMembers.map((member, i) => {
                const isOverdue = member.member_plans?.some(p => p.status === 'active' && isDateOverdue(p.next_due_date));
                const memberIdFormatted = `SM-${member.id.substring(0, 3).toUpperCase()}`;

                return (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.02, 0.14), duration: 0.2 }}
                  >
                    <Link 
                      to={`/members/${member.id}`}
                      className="bg-white p-3 rounded-[16px] border border-border shadow-[0_2px_6px_rgba(0,0,0,0.02)] flex items-center justify-between active:scale-[0.99] transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-full bg-emerald-50 text-primary border border-emerald-100 flex items-center justify-center font-bold text-[14px] shrink-0 overflow-hidden">
                          {member.avatar_url ? (
                            <img src={member.avatar_url} alt={member.full_name} className="w-full h-full object-cover" />
                          ) : (
                            <span>{member.full_name?.substring(0, 1) || 'স'}</span>
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <h3 className="text-[14px] font-bold text-slate-800 bangla leading-tight truncate">{member.full_name || 'সদস্য'}</h3>
                          <span className="text-[12px] text-slate-400 font-medium mt-0.5">{memberIdFormatted}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end shrink-0 gap-1">
                        <span className="text-[12px] text-slate-500 font-medium">{member.phone || member.email?.split('@')[0] || '০১৭১২ ৩৪৫৬৭৮'}</span>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold bangla border ${
                          isOverdue 
                            ? 'bg-rose-50 text-rose-600 border-rose-200' 
                            : 'bg-primary-light text-primary border-emerald-200'
                        }`}>
                          {isOverdue ? 'বকেয়া' : 'সক্রিয়'}
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                );
              })
            ) : (
              <div className="py-16 flex flex-col items-center justify-center gap-2">
                <User size={32} className="text-slate-300" />
                <p className="text-[14px] font-medium text-slate-400 bangla">কোন সদস্য পাওয়া যায়নি</p>
              </div>
            )}
          </div>

          {/* Floating Bottom Button: + নতুন সদস্য */}
          {isAdmin && (
            <div className="fixed bottom-[74px] left-1/2 -translate-x-1/2 w-full max-w-[430px] px-4 pointer-events-none z-40">
              <button
                type="button"
                onClick={() => setShowAddMember(true)}
                className="pointer-events-auto ml-auto flex items-center gap-1.5 px-5 py-3 rounded-full bg-primary text-white font-bold text-[13px] bangla shadow-lg shadow-emerald-700/25 active:scale-95 transition-all cursor-pointer"
              >
                <UserPlus size={18} />
                <span>নতুন সদস্য</span>
              </button>
            </div>
          )}
        </>
      )}

      {/* TAB 2: JOIN REQUESTS */}
      {mainTab === 'requests' && (
        <div className="flex flex-col gap-3 pb-20">
          {requestsLoading ? (
            <div className="flex flex-col gap-2.5">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-28 bg-white rounded-[20px] border border-border animate-pulse" />
              ))}
            </div>
          ) : joinRequests.length > 0 ? (
            joinRequests.map((req, i) => {
              const reqProfile = req.profile;
              const isActioning = requestActionLoadingId === req.id;

              return (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.15), duration: 0.2 }}
                  className="bg-white p-4 rounded-[20px] border border-slate-200 shadow-xs flex flex-col gap-3"
                >
                  {/* Applicant Details */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-700 border border-amber-200/60 flex items-center justify-center font-bold text-[15px] shrink-0 overflow-hidden">
                        {reqProfile?.avatar_url ? (
                          <img src={reqProfile.avatar_url} alt={reqProfile.full_name || ''} className="w-full h-full object-cover" />
                        ) : (
                          <span>{reqProfile?.full_name?.substring(0, 1) || 'আ'}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-[14.5px] font-bold text-slate-800 bangla leading-snug truncate">
                          {reqProfile?.full_name || 'নতুন আবেদনকারী'}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[12px] text-slate-500 font-medium">
                          <Phone size={12} className="text-slate-400" />
                          <span>{reqProfile?.phone || reqProfile?.email || 'যোগাযোগ নেই'}</span>
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bangla bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                      অপেক্ষমাণ
                    </span>
                  </div>

                  {/* Submission Info */}
                  <div className="text-[11px] text-slate-400 bangla px-1 flex items-center justify-between">
                    <span>আবেদনের সময়: {new Date(req.joined_at).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <span className="text-slate-300">•</span>
                    <span>রোল: সাধারণ সদস্য</span>
                  </div>

                  {/* Actions (Approve & Reject) */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      disabled={isActioning}
                      onClick={() => handleRejectRequest(req)}
                      className="py-2.5 px-3 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 active:scale-95 text-[12.5px] font-bold bangla transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isActioning ? (
                        <Loader2 size={15} className="animate-spin text-rose-600" />
                      ) : (
                        <XCircle size={15} />
                      )}
                      <span>বাতিল করুন</span>
                    </button>

                    <button
                      type="button"
                      disabled={isActioning}
                      onClick={() => handleApproveRequest(req)}
                      className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs active:scale-95 text-[12.5px] font-bold bangla transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isActioning ? (
                        <Loader2 size={15} className="animate-spin text-white" />
                      ) : (
                        <CheckCircle2 size={15} />
                      )}
                      <span>অনুমোদন দিন</span>
                    </button>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-center px-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mb-3">
                <Clock size={28} />
              </div>
              <h4 className="text-[15px] font-bold text-slate-700 bangla mb-1">
                কোনো পেন্ডিং যোগদানের আবেদন নেই
              </h4>
              <p className="text-[12px] text-slate-400 bangla max-w-[260px] leading-relaxed">
                নতুন সদস্যরা সমিতির কোড (#{activeOrganization?.reg_number || 'SAM-1042'}) বা ইনভাইট লিংক দিয়ে আবেদন করলে এখানে জমা হবে।
              </p>
            </div>
          )}
        </div>
      )}

        {/* Quick Collect & Shareable Receipt Modals */}
        <QuickCollectModal
          isOpen={showCollectModal}
          onClose={() => {
            setShowCollectModal(false);
            setSelectedMemberForCollect(null);
          }}
          preSelectedMemberId={selectedMemberForCollect}
          onPaymentSuccess={(receipt) => {
            setReceiptData(receipt);
            fetchMembers();
          }}
        />

        <ReceiptModal
          isOpen={!!receiptData}
          onClose={() => setReceiptData(null)}
          receipt={receiptData}
        />

        {/* Admin Add Member Modal */}
        <AddMemberModal
          isOpen={showAddMember}
          onClose={() => setShowAddMember(false)}
          onMemberAdded={fetchMembers}
        />
    </MobileLayout>
  );
}
