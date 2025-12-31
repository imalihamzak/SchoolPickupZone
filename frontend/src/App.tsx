import { Routes, Route } from 'react-router-dom'
import 'react-toastify/dist/ReactToastify.css'
import { ToastContainer } from 'react-toastify'
import Login from './pages/auth/login'
import Signup from './pages/auth/signup'
import ForgotPassword from './pages/auth/forgot-password'
import ResetPassword from './pages/auth/reset-password'
import ParentDashboard from './pages/parent'
import SubParents from './pages/parent/sub-parents'
import ParentProfiles from './pages/parent/profiles'
import AdminDashboard from './pages/admin/dashboard'
import Profiles from './pages/admin/profile/index'
import QRCodes from './pages/admin/qr-codes'
import Activity from './pages/admin/activity'
import SuperAdminDashboard from './pages/super-admin'
import Admins from './pages/super-admin/admins/index'
import Subscriptions from './pages/super-admin/subscriptions/index'
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
import GuardLayout from './components/layouts/GuardLayout'
import NewPassword from "./pages/auth/NewPassword"
import LandingPage from './pages/Landing Page/Landing'


import AOS from 'aos';
import 'aos/dist/aos.css';


export default function App() {
  useEffect(() => {
    const unlockAudio = () => {
      const audio = new Audio('/sounds/notification.mp3')
      audio.play().then(() => audio.pause()).catch(() => { })
      window.removeEventListener('click', unlockAudio)
    }
    window.addEventListener('click', unlockAudio, { once: true })
    return () => window.removeEventListener('click', unlockAudio)
  }, [])

  useEffect(() => {
    AOS.init({ duration: 1000 });
  }, []);
  
  return (
    <>
      <Routes>
        {/* Auth Routes */}
        <Route path="/" element={<LandingPage />} />

        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/set-new-password" element={<NewPassword />} />


        {/* Parent Routes */}
        <Route path="/parent" element={<ParentDashboard />} />
        <Route path="/parent/sub-parents" element={<SubParents />} />
        <Route path="/parent/profiles" element={<ParentProfiles />} />
        <Route path="/parent/child/:id" element={<ChildDetailPage />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/profiles" element={<Profiles />} />
        <Route path="/admin/pending-profiles" element={<PendingProfiles />} />
        <Route path="/admin/qr-codes" element={<QRCodes />} />
        <Route path="/admin/activity" element={<Activity />} />
        <Route path="/admin/scanner" element={<ScannerView />} />
        <Route path="/admin/users" element={<Users />} />

        {/* Super Admin Routes */}
        <Route path="/super-admin" element={<SuperAdminDashboard />} />
        <Route path="/super-admin/admins" element={<Admins />} />
        <Route path="/super-admin/schools" element={<Schools />} />
        <Route path="/super-admin/subscriptions" element={<Subscriptions />} />

        <Route
          path="/guard"
          element={
            <GuardLayout>
              <PickupScanner />
            </GuardLayout>
          }
        />

        {/* Shared Routes */}
        <Route path="/profile" element={<Profile />} />
        <Route path="/register-device" element={<RegisterDevice />} />
        <Route path="/" element={<Login />} />

        <Route path="/payment-success" element={<PaymentSuccess />} />
<Route path="/payment-cancel" element={<PaymentCancel />} />

      </Routes>

      <ToastContainer position="top-right" autoClose={3000} />
    </>
  )
}
