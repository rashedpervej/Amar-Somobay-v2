import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { useSettingsStore } from './store/useSettingsStore';
import { ThemeProvider } from './components/ThemeProvider';

// Pages
import Splash from './pages/Splash';
import Login from './pages/Login';
import Signup from './pages/Signup';
import PendingApproval from './pages/PendingApproval';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import AppSettings from './pages/AppSettings';
import MemberList from './pages/MemberList';
import MemberDetail from './pages/MemberDetail';
import EditProfile from './pages/EditProfile';
import Security from './pages/Security';
import SingleDeposit from './pages/SingleDeposit';
import BulkDeposit from './pages/BulkDeposit';
import Notifications from './pages/Notifications';
import Updates from './pages/Updates';
import Notices from './pages/Notices';
import SavingsHistory from './pages/SavingsHistory';
import ManageSomobay from './pages/ManageSomobay';
import PlanManagement from './pages/PlanManagement';
import SomobayMenu from './pages/SomobayMenu';
import MySomobay from './pages/MySomobay';
import SavingsInsights from './pages/SavingsInsights';
import PromotionDetail from './pages/PromotionDetail';
import ManagePromotions from './pages/ManagePromotions';
import AdminMore from './pages/AdminMore';
import AdminSavings from './pages/AdminSavings';
import AdminInstallments from './pages/AdminInstallments';
import AdminReports from './pages/AdminReports';
import AdminNotices from './pages/AdminNotices';
import AdminUpdates from './pages/AdminUpdates';
import AdminPendingPayments from './pages/AdminPendingPayments';
import MemberWithdrawalRequest from './pages/MemberWithdrawalRequest';
import CooperativeTypeSelect from './pages/CooperativeTypeSelect';
import CreateGeneralCooperative from './pages/CreateGeneralCooperative';
import ApplyCooperative from './pages/ApplyCooperative';
import JoinCooperative from './pages/JoinCooperative';
import GeneralSavingsWizard from './pages/GeneralSavingsWizard';
import GeneralSavingsSettings from './pages/GeneralSavingsSettings';
import SomobayList from './pages/SomobayList';
import SomobayHub from './pages/SomobayHub';
import CooperativeDashboard from './pages/CooperativeDashboard';
import { CooperativeTenantGuard } from './components/CooperativeTenantGuard';

// ROSCA Module (12 Target Screens)
import RoscaList from './pages/rosca/RoscaList';
import RoscaDetail from './pages/rosca/RoscaDetail';
import RoscaMemberDetail from './pages/rosca/RoscaMemberDetail';
import RoscaDrawResult from './pages/rosca/RoscaDrawResult';
import RoscaProgress from './pages/rosca/RoscaProgress';
import RoscaSettings from './pages/rosca/RoscaSettings';
import RoscaReports from './pages/rosca/RoscaReports';
import RoscaCompleted from './pages/rosca/RoscaCompleted';

// Joint Goals / Collective Savings (12 Target Screens - Admin)
import GoalList from './pages/joint_goals/GoalList';
import GoalDetail from './pages/joint_goals/GoalDetail';
import GoalMemberDetail from './pages/joint_goals/GoalMemberDetail';
import AddContribution from './pages/joint_goals/AddContribution';
import GoalProgress from './pages/joint_goals/GoalProgress';
import GoalTransactions from './pages/joint_goals/GoalTransactions';
import GoalReports from './pages/joint_goals/GoalReports';
import GoalSettings from './pages/joint_goals/GoalSettings';
import GoalCompleted from './pages/joint_goals/GoalCompleted';
import CreateGoal from './pages/joint_goals/CreateGoal';

// Joint Goals / Collective Savings — User-Side (JG-U03 - JG-U12)
import UserGoalDetails from './pages/user_goals/UserGoalDetails';
import UserMyContribution from './pages/user_goals/UserMyContribution';
import UserContributionHistory from './pages/user_goals/UserContributionHistory';
import UserAddContribution from './pages/user_goals/UserAddContribution';
import UserGoalMembers from './pages/user_goals/UserGoalMembers';
import UserMyMemberDetails from './pages/user_goals/UserMyMemberDetails';
import UserGoalProgress from './pages/user_goals/UserGoalProgress';
import UserGoalInformation from './pages/user_goals/UserGoalInformation';
import UserGoalNotices from './pages/user_goals/UserGoalNotices';
import UserGoalCompleted from './pages/user_goals/UserGoalCompleted';

// Qard Hasanah (কর্জে হাসানা) Module
import QardMenu from './pages/qard/QardMenu';
import MemberQardHasanah from './pages/qard/MemberQardHasanah';
import AdminQardHasanah from './pages/qard/AdminQardHasanah';

import { ProtectedRoute } from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';

export default function App() {
  const initialize = useAuthStore(state => state.initialize);

  useEffect(() => {
    initialize();
    useSettingsStore.getState().fetchSettings();
  }, [initialize]);

  return (
    <ThemeProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Splash />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/pending" element={<PendingApproval />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/admin/app-settings" element={<AppSettings />} />
            <Route path="/members" element={<MemberList />} />
            <Route path="/members/:id" element={<MemberDetail />} />
            <Route path="/settings/profile" element={<EditProfile />} />
            <Route path="/settings/security" element={<Security />} />
            <Route path="/savings" element={<SavingsHistory />} />
            <Route path="/savings/insights" element={<SavingsInsights />} />
            <Route path="/savings/deposit" element={<SingleDeposit />} />
            <Route path="/savings/bulk" element={<BulkDeposit />} />
            <Route path="/savings/withdraw" element={<MemberWithdrawalRequest />} />

            {/* Standardized Multi-Tenant Cooperative Routes */}
            <Route path="/somobay" element={<SomobayHub />} />
            <Route path="/somobay/create" element={<CooperativeTypeSelect />} />
            <Route path="/somobay/create/general" element={<CreateGeneralCooperative />} />
            <Route path="/somobay/create/general-savings" element={<Navigate to="/somobay/create/general" replace />} />
            <Route path="/somobay/create/rosca" element={<Navigate to="/rosca" replace />} />
            <Route path="/somobay/create/joint-goal" element={<Navigate to="/joint-goals/create" replace />} />

            {/* Tenant-Isolated Guarded Routes (/somobay/:cooperativeSlug/*) */}
            <Route path="/somobay/:cooperativeSlug" element={<CooperativeTenantGuard />}>
              <Route index element={<CooperativeDashboard />} />
              <Route path="plans" element={<PlanManagement />} />
              <Route path="plans/:planId" element={<PlanManagement />} />
              <Route path="general-cooperative" element={<PlanManagement />} />
              <Route path="general-savings" element={<Navigate to="plans" replace />} />
              <Route path="general-savings/plans" element={<Navigate to="plans" replace />} />
              <Route path="manage" element={<ManageSomobay />} />
              <Route path="members" element={<MemberList />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="settings" element={<GeneralSavingsSettings />} />
              <Route path="more" element={<AdminMore />} />
            </Route>

            {/* Preserved Routes & Compatibility Redirects */}
            <Route path="/somobay/menu" element={<Navigate to="/somobay" replace />} />
            <Route path="/somobay/manage" element={<Navigate to="/somobay" replace />} />
            <Route path="/somobay/manage/:id" element={<PlanManagement />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/updates" element={<Updates />} />
            <Route path="/updates/:id" element={<PromotionDetail />} />
            <Route path="/notices" element={<Navigate to="/updates" replace />} />
            <Route path="/promotions/manage" element={<AdminUpdates />} />
            <Route path="/promotions/:id" element={<PromotionDetail />} />
            <Route path="/admin/updates" element={<AdminUpdates />} />
            <Route path="/admin/notices" element={<Navigate to="/admin/updates" replace />} />
            <Route path="/cooperative/apply" element={<ApplyCooperative />} />
            <Route path="/cooperative/join" element={<JoinCooperative />} />
            <Route path="/join/:slug" element={<JoinCooperative />} />
            <Route path="/admin/cooperatives" element={<Navigate to="/somobay" replace />} />
            <Route path="/admin/savings/settings" element={<GeneralSavingsSettings />} />
            <Route path="/admin/savings" element={<AdminSavings />} />
            <Route path="/admin/loans" element={<AdminQardHasanah />} />
            <Route path="/admin/installments" element={<AdminInstallments />} />
            <Route path="/admin/reports" element={<AdminReports />} />
            <Route path="/admin/payments/pending" element={<AdminPendingPayments />} />

            {/* ROSCA Dedicated Routes (12 Target Screens) */}
            <Route path="/rosca" element={<RoscaList />} />
            <Route path="/rosca/:id" element={<RoscaDetail />} />
            <Route path="/rosca/:id/members/:memberId" element={<RoscaMemberDetail />} />
            <Route path="/rosca/:id/draw-result/:periodId" element={<RoscaDrawResult />} />
            <Route path="/rosca/:id/progress" element={<RoscaProgress />} />
            <Route path="/rosca/:id/settings" element={<RoscaSettings />} />
            <Route path="/rosca/:id/reports" element={<RoscaReports />} />
            <Route path="/rosca/:id/completed" element={<RoscaCompleted />} />

            {/* Joint Goals / Collective Savings Dedicated Routes (12 Target Screens - Admin) */}
            <Route path="/joint-goals" element={<GoalList />} />
            <Route path="/joint-goals/create" element={<CreateGoal />} />
            <Route path="/joint-goals/:id" element={<GoalDetail />} />
            <Route path="/joint-goals/:id/members/:memberId" element={<GoalMemberDetail />} />
            <Route path="/joint-goals/:id/contribute" element={<AddContribution />} />
            <Route path="/joint-goals/:id/progress" element={<GoalProgress />} />
            <Route path="/joint-goals/:id/transactions" element={<GoalTransactions />} />
            <Route path="/joint-goals/:id/reports" element={<GoalReports />} />
            <Route path="/joint-goals/:id/settings" element={<GoalSettings />} />
            <Route path="/joint-goals/:id/completed" element={<GoalCompleted />} />

            {/* Joint Goals User-Side (12 Target Screens JG-U01 - JG-U12) */}
            <Route path="/goals" element={<Navigate to="/somobay" replace />} />
            <Route path="/goals/list" element={<Navigate to="/somobay" replace />} />
            <Route path="/goals/:goalId" element={<UserGoalDetails />} />
            <Route path="/goals/:goalId/my-contribution" element={<UserMyContribution />} />
            <Route path="/goals/:goalId/contributions" element={<UserContributionHistory />} />
            <Route path="/goals/:goalId/contribute" element={<UserAddContribution />} />
            <Route path="/goals/:goalId/members" element={<UserGoalMembers />} />
            <Route path="/goals/:goalId/members/me" element={<UserMyMemberDetails />} />
            <Route path="/goals/:goalId/progress" element={<UserGoalProgress />} />
            <Route path="/goals/:goalId/information" element={<UserGoalInformation />} />
            <Route path="/goals/:goalId/notices" element={<UserGoalNotices />} />
            <Route path="/goals/:goalId/completed" element={<UserGoalCompleted />} />

            {/* Qard Hasanah Module */}
            <Route path="/qard" element={<QardMenu />} />
            <Route path="/qard/member" element={<MemberQardHasanah />} />
            <Route path="/admin/qard" element={<AdminQardHasanah />} />
            <Route path="/qard/dashboard" element={<AdminQardHasanah />} />
            <Route path="/qard/schemes" element={<AdminQardHasanah />} />
            <Route path="/qard/schemes/:id" element={<MemberQardHasanah />} />
            <Route path="/qard/members" element={<AdminQardHasanah />} />
            <Route path="/qard/members/:memberId/history" element={<AdminQardHasanah />} />
            <Route path="/qard/repayments" element={<AdminQardHasanah />} />
            <Route path="/qard/loans" element={<AdminQardHasanah />} />
            <Route path="/qard/overdue" element={<AdminQardHasanah />} />
            <Route path="/qard/reports" element={<AdminQardHasanah />} />
            <Route path="/qard/settings" element={<AdminQardHasanah />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}
