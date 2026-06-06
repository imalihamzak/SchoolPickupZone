import { Routes, Route } from 'react-router-dom'
import { AppToastContainer } from './components/ui/toast'
import Login from './pages/auth/login'
import Signup from './pages/auth/signup'
import ForgotPassword from './pages/auth/forgot-password'
import ResetPassword from './pages/auth/reset-password'
import ParentDashboard from './pages/parent'
import SubParents from './pages/parent/sub-parents'
import ParentProfiles from './pages/parent/profiles'
import ParentQRCodes from './pages/parent/qr-codes'
import ParentDocuments from './pages/parent/documents'
import AdminDashboard from './pages/admin/dashboard'
import Profiles from './pages/admin/profile/index'
import AdminDocuments from './pages/admin/documents'
import QRCodes from './pages/admin/qr-codes'
import Activity from './pages/admin/activity'
import AdminBilling from './pages/admin/billing'
import SuperAdminDashboard from './pages/super-admin'
import Admins from './pages/super-admin/admins/index'
import Subscriptions from './pages/super-admin/subscriptions/index'
import AuditLogs from './pages/super-admin/audit-logs/index'
import SuperAdminInquiries from './pages/super-admin/inquiries/index'
import Profile from './pages/profile/index'
import ScannerView from './pages/admin/scanner/index'
import PendingProfiles from './pages/admin/pending-profiles'
import Schools from './pages/super-admin/schools/index'
import Users from './pages/admin/users'
import ChildDetailPage from './pages/parent/components/ChildDetailPage'
import RegisterDevice from './pages/admin/RegisterDevice'
import { useEffect } from 'react'
import PaymentSuccess from './pages/PaymentSuccess'
import PaymentCancel from './pages/PaymentCancel'
import PickupScanner from './pages/guard/PickupScanner'
import ReleaseQueue from './pages/guard/ReleaseQueue'
import GuardLayout from './components/layouts/GuardLayout'
import DutyRoster from './pages/admin/duty-roster'
import NewPassword from "./pages/auth/NewPassword"
import LandingPage from './pages/Landing Page/Landing'
import {
  AboutPage,
  BlogsPage,
  CancellationPolicyPage,
  ContactPage,
  FeaturesPage,
  PricingPage,
  PrivacyPolicyPage,
  TermsConditionsPage,
} from './pages/Landing Page/PublicPages'
import { installNotificationSoundUnlock } from './lib/notifications/notificationSound'


import AOS from 'aos';
import 'aos/dist/aos.css';


export default function App() {
  useEffect(() => {
    installNotificationSoundUnlock()
  }, [])

  useEffect(() => {
    AOS.init({ duration: 1000 });
  }, []);
  
  return (
    <>
      <Routes>
        {/* Auth Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/blogs" element={<BlogsPage />} />
        <Route path="/blog" element={<BlogsPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/terms" element={<TermsConditionsPage />} />
        <Route path="/terms-and-conditions" element={<TermsConditionsPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/cancellation-policy" element={<CancellationPolicyPage />} />

        <Route path="/login" element={<Login />} />
        <Route path="/superadmin/login" element={<Login superAdminOnly />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/set-new-password" element={<NewPassword />} />


        {/* Parent Routes */}
        <Route path="/parent" element={<ParentDashboard />} />
        <Route path="/parent/sub-parents" element={<SubParents />} />
        <Route path="/parent/profiles" element={<ParentProfiles />} />
        <Route path="/parent/documents" element={<ParentDocuments />} />
        <Route path="/parent/qr-codes" element={<ParentQRCodes />} />
        <Route path="/parent/child/:id" element={<ChildDetailPage />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/profiles" element={<Profiles />} />
        <Route path="/admin/documents" element={<AdminDocuments />} />
        <Route path="/admin/pending-profiles" element={<PendingProfiles />} />
        <Route path="/admin/qr-codes" element={<QRCodes />} />
        <Route path="/admin/activity" element={<Activity />} />
        <Route path="/admin/billing" element={<AdminBilling />} />
        <Route path="/admin/scanner" element={<ScannerView />} />
        <Route path="/admin/users" element={<Users />} />
        <Route path="/admin/duty-roster" element={<DutyRoster />} />
        <Route path="/admin/profile-settings" element={<Profile initialRole="admin" />} />

        {/* Super Admin Routes */}
        <Route path="/super-admin" element={<SuperAdminDashboard />} />
        <Route path="/super-admin/admins" element={<Admins />} />
        <Route path="/super-admin/schools" element={<Schools />} />
        <Route path="/super-admin/inquiries" element={<SuperAdminInquiries />} />
        <Route path="/super-admin/subscriptions" element={<Subscriptions />} />
        <Route path="/super-admin/audit-logs" element={<AuditLogs />} />
        <Route path="/super-admin/profile-settings" element={<Profile initialRole="super-admin" />} />

        <Route
          path="/guard"
          element={
            <GuardLayout>
              <PickupScanner />
            </GuardLayout>
          }
        />
        <Route
          path="/guard/release"
          element={
            <GuardLayout>
              <ReleaseQueue />
            </GuardLayout>
          }
        />
        <Route path="/guard/profile" element={<Profile initialRole="guard" />} />

        {/* Shared Routes */}
        <Route path="/profile" element={<Profile />} />
        <Route path="/register-device" element={<RegisterDevice />} />

        <Route path="/payment-success" element={<PaymentSuccess />} />
<Route path="/payment-cancel" element={<PaymentCancel />} />

      </Routes>

      <AppToastContainer />
    </>
  )
}
