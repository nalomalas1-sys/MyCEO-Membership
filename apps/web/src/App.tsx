import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { ToastProvider } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

// Public pages
import LoginPage from '@/pages/Login';
import SignupPage from '@/pages/Signup';
import ForgotPasswordPage from '@/pages/ForgotPassword';
import ResetPasswordPage from '@/pages/ResetPassword';
import LandingPage from '@/pages/Landing';
import PricingPage from '@/pages/Pricing';
import SignupSuccessPage from '@/pages/SignupSuccess';

// Parent pages
import DashboardPage from '@/pages/Dashboard';
import ManageChildrenPage from '@/pages/ManageChildren';
import ChildDetailPage from '@/pages/ChildDetail';
import SettingsPage from '@/pages/Settings';

// Admin pages
import AdminDashboardPage from '@/pages/AdminDashboard';
import AdminUsersPage from '@/pages/admin/AdminUsers';
import AdminContentPage from '@/pages/admin/AdminContent';
import AdminModuleCreatePage from '@/pages/admin/AdminModuleCreate';
import AdminModuleEditPage from '@/pages/admin/AdminModuleEdit';
import AdminAnalyticsPage from '@/pages/admin/AdminAnalytics';
import AdminSettingsPage from '@/pages/admin/AdminSettings';


// Child pages
import ChildLoginPage from '@/pages/ChildLogin';
import ChildDashboardPage from '@/pages/ChildDashboard';
import ModulesPage from '@/pages/Modules';
import ModuleDetailPage from '@/pages/ModuleDetail';
import LessonViewerPage from '@/pages/LessonViewer';
import AchievementsPage from '@/pages/Achievements';
import CompanyPage from '@/pages/Company';
import MarketplacePage from '@/pages/Marketplace';
import LeaderboardPage from '@/pages/Leaderboard';

// Protected Route Wrapper
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

function HomePage() {
  const { isAuthenticated, user } = useAuth();
  
  if (isAuthenticated) {
    // Check if user is admin or parent
    const isAdmin = user?.user_metadata?.role === 'admin';
    if (isAdmin) {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }
  
  return <LandingPage />;
}

function App() {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Routes>
          {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/signup-success" element={<SignupSuccessPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/pricing" element={<PricingPage />} />
          <Route path="/company" element={<CompanyPage />} />

          {/* Parent Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute requireRole="parent">
              <DashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/children" element={
            <ProtectedRoute requireRole="parent">
              <ManageChildrenPage />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/children/:childId" element={
            <ProtectedRoute requireRole="parent">
              <ChildDetailPage />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/settings" element={
            <ProtectedRoute requireRole="parent">
              <SettingsPage />
            </ProtectedRoute>
          } />

          {/* Admin Protected Routes */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute requireRole="admin">
              <AdminDashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute requireRole="admin">
              <AdminUsersPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/content" element={
            <ProtectedRoute requireRole="admin">
              <AdminContentPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/content/create" element={
            <ProtectedRoute requireRole="admin">
              <AdminModuleCreatePage />
            </ProtectedRoute>
          } />
          <Route path="/admin/content/:id/edit" element={
            <ProtectedRoute requireRole="admin">
              <AdminModuleEditPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/analytics" element={
            <ProtectedRoute requireRole="admin">
              <AdminAnalyticsPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/settings" element={
            <ProtectedRoute requireRole="admin">
              <AdminSettingsPage />
            </ProtectedRoute>
          } />
       

          {/* Child Routes */}
        <Route path="/child/login" element={<ChildLoginPage />} />
          <Route path="/child/dashboard" element={
            <ProtectedRoute requireRole="child">
              <ChildDashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/child/modules" element={
            <ProtectedRoute requireRole="child">
              <ModulesPage />
            </ProtectedRoute>
          } />
          <Route path="/child/modules/:moduleId" element={
            <ProtectedRoute requireRole="child">
              <ModuleDetailPage />
            </ProtectedRoute>
          } />
          <Route path="/child/lessons/:lessonId" element={
            <ProtectedRoute requireRole="child">
              <LessonViewerPage />
            </ProtectedRoute>
          } />
          <Route path="/child/achievements" element={
            <ProtectedRoute requireRole="child">
              <AchievementsPage />
            </ProtectedRoute>
          } />
          <Route path="/child/company" element={
            <ProtectedRoute requireRole="child">
              <CompanyPage />
            </ProtectedRoute>
          } />
          <Route path="/child/marketplace" element={
            <ProtectedRoute requireRole="child">
              <MarketplacePage />
            </ProtectedRoute>
          } />
          <Route path="/child/leaderboard" element={
            <ProtectedRoute requireRole="child">
              <LeaderboardPage />
            </ProtectedRoute>
          } />

          {/* Redirects */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/child" element={<Navigate to="/child/dashboard" replace />} />
          <Route path="/modules" element={<Navigate to="/child/modules" replace />} />
          <Route path="/achievements" element={<Navigate to="/child/achievements" replace />} />
          <Route path="/leaderboard" element={<Navigate to="/child/leaderboard" replace />} />
          <Route path="/marketplace" element={<Navigate to="/child/marketplace" replace />} />

          {/* 404 Catch-all */}
          <Route path="*" element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-slate-800 mb-4">404</h1>
                <p className="text-slate-600 mb-6">Page not found</p>
                <a href="/" className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-medium hover:shadow-lg transition-shadow">
                  Go Home
                </a>
              </div>
            </div>
          } />
      </Routes>
      <Toaster />
    </div>
    </ToastProvider>
  );
}

export default App;

