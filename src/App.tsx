import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { useApp } from '@/context/AppContext';

const PublicLayout = lazy(() => import('@/components/public/PublicLayout'));
const HomePage = lazy(() => import('@/pages/public/HomePage'));
const PropertiesPage = lazy(() => import('@/pages/public/PropertiesPage'));
const PropertyDetailPage = lazy(() => import('@/pages/public/PropertyDetailPage'));
const ContactPage = lazy(() => import('@/pages/public/ContactPage'));
const AboutPage = lazy(() => import('@/pages/public/AboutPage'));
const DynamicPage = lazy(() => import('@/pages/public/DynamicPage'));
const AuthPage = lazy(() => import('@/pages/public/AuthPage'));
const UserDashboard = lazy(() => import('@/pages/public/UserDashboard'));

const AdminLayout = lazy(() => import('@/components/admin/AdminLayout'));
const AdminLogin = lazy(() => import('@/pages/admin/AdminLogin'));
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminProperties = lazy(() => import('@/pages/admin/AdminProperties'));
const AdminPropertyEdit = lazy(() => import('@/pages/admin/AdminPropertyEdit'));
const AdminPages = lazy(() => import('@/pages/admin/AdminPages'));
const AdminPageEdit = lazy(() => import('@/pages/admin/AdminPageEdit'));
const AdminSettings = lazy(() => import('@/pages/admin/AdminSettings'));
const AdminTelegram = lazy(() => import('@/pages/admin/AdminTelegram'));
const AdminInquiries = lazy(() => import('@/pages/admin/AdminInquiries'));

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
    </div>
  );
}

function App() {
  const { loadingSettings } = useApp();

  if (loadingSettings) return <LoadingScreen />;

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Public routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/properties" element={<PropertiesPage />} />
          <Route path="/properties/:id" element={<PropertyDetailPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/page/:slug" element={<DynamicPage />} />
        </Route>

        {/* Admin routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="properties" element={<AdminProperties />} />
          <Route path="properties/new" element={<AdminPropertyEdit />} />
          <Route path="properties/:id" element={<AdminPropertyEdit />} />
          <Route path="pages" element={<AdminPages />} />
          <Route path="pages/new" element={<AdminPageEdit />} />
          <Route path="pages/:id" element={<AdminPageEdit />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="telegram" element={<AdminTelegram />} />
          <Route path="inquiries" element={<AdminInquiries />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;
