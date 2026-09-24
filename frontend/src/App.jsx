import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import AppLayout from './components/layout/AppLayout'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import Dashboard from './pages/Dashboard'
import MyAssets from './pages/MyAssets'
import UploadAsset from './pages/UploadAsset'
import AssetDetail from './pages/AssetDetail'
import SharedAssets from './pages/SharedAssets'
import AccessRequests from './pages/AccessRequests'
import AuditLogs from './pages/AuditLogs'
import IntegrityVerification from './pages/IntegrityVerification'
import WalletPage from './pages/WalletPage'
import ProfilePage from './pages/ProfilePage'
import AdminDashboard from './pages/AdminDashboard'
import { AuthProvider } from './contexts/AuthContext'
import { WalletProvider } from './contexts/WalletContext'

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen bg-surface-950"><div className="w-8 h-8 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" /></div>
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="assets" element={<MyAssets />} />
        <Route path="assets/upload" element={<UploadAsset />} />
        <Route path="assets/:id" element={<AssetDetail />} />
        <Route path="shared" element={<SharedAssets />} />
        <Route path="requests" element={<AccessRequests />} />
        <Route path="audit" element={<AuditLogs />} />
        <Route path="integrity" element={<IntegrityVerification />} />
        <Route path="wallet" element={<WalletPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <WalletProvider>
        <AppRoutes />
      </WalletProvider>
    </AuthProvider>
  )
}
