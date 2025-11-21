import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import LoginPage from '@/pages/Login';
import SignupPage from '@/pages/Signup';
import ForgotPasswordPage from '@/pages/ForgotPassword';
import ResetPasswordPage from '@/pages/ResetPassword';
import DashboardPage from '@/pages/Dashboard';
import AdminDashboardPage from '@/pages/AdminDashboard';
import AdminUsersPage from '@/pages/admin/AdminUsers';
import AdminContentPage from '@/pages/admin/AdminContent';
import AdminModuleCreatePage from '@/pages/admin/AdminModuleCreate';
import AdminModuleEditPage from '@/pages/admin/AdminModuleEdit';
import AdminAnalyticsPage from '@/pages/admin/AdminAnalytics';
import ChildLoginPage from '@/pages/ChildLogin';
import ChildDashboardPage from '@/pages/ChildDashboard';
import ChildDetailPage from '@/pages/ChildDetail';
import ModulesPage from '@/pages/Modules';
import ModuleDetailPage from '@/pages/ModuleDetail';
import LessonViewerPage from '@/pages/LessonViewer';
import AchievementsPage from '@/pages/Achievements';
import CompanyPage from '@/pages/Company';
import LandingPage from '@/pages/Landing';
import SettingsPage from '@/pages/Settings';
import PricingPage from '@/pages/Pricing';
import SignupSuccessPage from '@/pages/SignupSuccess';
import { useAuth } from '@/hooks/useAuth';

function HomePage() {
  const { isAuthenticated } = useAuth();
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <LandingPage />;
}

function App() {
  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/signup-success" element={<SignupSuccessPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/dashboard/children/:childId" element={<ChildDetailPage />} />
        <Route path="/dashboard/settings" element={<SettingsPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/content" element={<AdminContentPage />} />
        <Route path="/admin/content/create" element={<AdminModuleCreatePage />} />
        <Route path="/admin/content/:id/edit" element={<AdminModuleEditPage />} />
        <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
        <Route path="/child/login" element={<ChildLoginPage />} />
        <Route path="/child/dashboard" element={<ChildDashboardPage />} />
        <Route path="/child/modules" element={<ModulesPage />} />
        <Route path="/child/modules/:moduleId" element={<ModuleDetailPage />} />
        <Route path="/child/lessons/:lessonId" element={<LessonViewerPage />} />
        <Route path="/child/achievements" element={<AchievementsPage />} />
        <Route path="/child/company" element={<CompanyPage />} />
      </Routes>
      <Toaster />
    </div>
  );
}

export default App;

