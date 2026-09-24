import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Files, Share2, InboxIcon, ScrollText,
  ShieldCheck, Wallet, User, LogOut, Shield, Users, Lock
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useWallet } from '../../hooks/useWallet'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { to: '/assets', icon: Files, label: 'My Assets' },
  { to: '/shared', icon: Share2, label: 'Shared Assets' },
  { to: '/requests', icon: InboxIcon, label: 'Access Requests' },
  { to: '/audit', icon: ScrollText, label: 'Audit Logs' },
  { to: '/integrity', icon: ShieldCheck, label: 'Integrity Verification' },
  { to: '/wallet', icon: Wallet, label: 'Wallet' },
  { to: '/profile', icon: User, label: 'Profile' },
]

export default function Sidebar({ onClose }) {
  const { user, logout } = useAuth()
  const { account, shortAddress } = useWallet()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="flex flex-col h-full bg-surface-900 border-r border-surface-800">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-surface-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-accent-600 rounded-lg flex items-center justify-center">
            <Lock className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-sm font-bold text-surface-100 tracking-widest">ASSET-LOCK</span>
            <p className="text-xs text-surface-500">Secure Asset Management</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) => isActive ? 'nav-item-active' : 'nav-item'}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}

        {user?.role?.toUpperCase() === 'ADMIN' && (
          <>
            <div className="pt-4 pb-2">
              <p className="px-3 text-xs font-medium text-surface-600 uppercase tracking-wider">Administration</p>
            </div>
            <NavLink to="/admin" onClick={onClose} className={({ isActive }) => isActive ? 'nav-item-active' : 'nav-item'}>
              <Shield className="w-4 h-4 shrink-0" />
              <span>Admin Dashboard</span>
            </NavLink>
          </>
        )}
      </nav>

      {/* User Section */}
      <div className="px-3 py-4 border-t border-surface-800 space-y-2">
        {account && (
          <div className="px-3 py-2 bg-success/5 border border-success/20 rounded-md">
            <p className="text-xs text-surface-400">Wallet</p>
            <p className="text-xs font-mono text-success">{shortAddress}</p>
          </div>
        )}
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-accent-600 flex items-center justify-center text-xs font-bold text-white">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-surface-200 truncate">{user?.name}</p>
            <p className="text-xs text-surface-500 capitalize">{user?.role}</p>
          </div>
          <button onClick={handleLogout} className="text-surface-500 hover:text-danger transition-colors" title="Logout">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
