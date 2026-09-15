import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Shield,
  LayoutDashboard,
  UploadCloud,
  FolderLock,
  CheckCheck,
  FileText,
  UserCircle,
  LogOut,
  ChevronDown,
  Layers,
  KeyRound,
  HardDrive,
  Cpu,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useBlockchain } from '../hooks/useBlockchain';
import { StatusBadge } from './StatusBadge';
import { truncateHash } from '../utils/crypto';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, login } = useAuth();
  const { blockchain, ipfs } = useBlockchain();
  const location = useLocation();
  const navigate = useNavigate();
  const [personaMenuOpen, setPersonaMenuOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Upload Asset', path: '/upload', icon: UploadCloud, roles: ['Owner', 'Admin'] },
    { label: 'My Assets', path: '/assets', icon: FolderLock },
    { label: 'Integrity Verification', path: '/integrity', icon: CheckCheck },
    { label: 'Audit Log', path: '/audit', icon: FileText },
    { label: 'Profile / Wallet', path: '/profile', icon: UserCircle },
  ];

  const personas = [
    { name: 'Dr. Alice Vance', email: 'alice@security.enclave', role: 'Owner', wallet: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' },
    { name: 'Agent Bob Miller', email: 'bob@security.enclave', role: 'Authorized User', wallet: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' },
    { name: 'Charlie Audit', email: 'charlie@security.enclave', role: 'Authorized User', wallet: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC' },
    { name: 'SysAdmin Enclave', email: 'admin@security.enclave', role: 'Admin', wallet: '0x90F79bf6EB2c4f870365E785982E1f101E93b906' },
  ];

  const handleSwitchPersona = async (email: string) => {
    try {
      await login(email, 'Password123!');
      setPersonaMenuOpen(false);
      window.location.reload();
    } catch (e) {
      console.error('Persona switch failed', e);
    }
  };

  return (
    <div className="min-h-screen bg-[#070A10] text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="h-16 border-b border-slate-800/80 bg-[#0B111E]/95 backdrop-blur sticky top-0 z-40 px-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold shadow-lg shadow-emerald-500/10">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <Link to="/dashboard" className="flex items-center space-x-2">
              <span className="font-bold text-base tracking-wide text-white font-mono">AssetLock</span>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                IAM & ACCESS CONTROL
              </span>
            </Link>
          </div>
        </div>

        {/* Live Network Indicators */}
        <div className="hidden lg:flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Blockchain:</span>
            <span className={blockchain?.mode === 'LIVE' ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>
              {blockchain?.mode === 'LIVE' ? 'Hardhat Live' : 'Simulation Mode'}
            </span>
            <span className="text-slate-500">#{blockchain?.blockNumber || 100}</span>
          </div>

          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300">
            <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400">IPFS:</span>
            <span className="text-indigo-300 font-medium">{ipfs?.mode === 'PINATA' ? 'Pinata Cloud' : 'Local Store'}</span>
          </div>
        </div>

        {/* User Persona & Wallet */}
        <div className="flex items-center space-x-3">
          {user ? (
            <div className="flex items-center space-x-2">
              {/* Persona Switcher Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setPersonaMenuOpen(!personaMenuOpen)}
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 transition-all text-xs"
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <div className="text-left">
                    <div className="font-medium text-slate-200">{user.name}</div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <span className="text-emerald-400 uppercase font-semibold">{user.role}</span>
                      <span>•</span>
                      <span className="font-mono text-slate-400">{truncateHash(user.walletAddress || '0x000', 4, 4)}</span>
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
                </button>

                {personaMenuOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-[#0F172A] border border-slate-700 rounded-xl shadow-2xl p-2 z-50">
                    <div className="px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                      Switch Demo Persona (1-Click)
                    </div>
                    <div className="space-y-1 mt-1">
                      {personas.map((p) => (
                        <button
                          key={p.email}
                          onClick={() => handleSwitchPersona(p.email)}
                          className={`w-full text-left p-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
                            user.email === p.email ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' : 'hover:bg-slate-800 text-slate-300'
                          }`}
                        >
                          <div>
                            <div className="font-medium text-slate-100">{p.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{truncateHash(p.wallet, 6, 4)}</div>
                          </div>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold ${
                              p.role === 'Owner'
                                ? 'bg-cyan-500/20 text-cyan-300'
                                : p.role === 'Admin'
                                ? 'bg-purple-500/20 text-purple-300'
                                : 'bg-slate-700 text-slate-300'
                            }`}
                          >
                            {p.role}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                title="Logout"
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-lg transition-colors border border-transparent hover:border-slate-700"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link to="/login" className="text-xs px-3 py-1.5 text-slate-300 hover:text-white font-medium">
                Login
              </Link>
              <Link
                to="/register"
                className="text-xs px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold shadow-md shadow-emerald-500/20"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Nav */}
        <aside className="w-64 border-r border-slate-800/80 bg-[#0B111E]/60 flex flex-col justify-between p-4 shrink-0">
          <div className="space-y-6">
            <div>
              <div className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2 font-mono">
                System Modules
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Architecture Flow Box */}
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800/80 text-[11px] text-slate-400 space-y-1.5 font-mono">
              <div className="text-slate-300 font-semibold flex items-center gap-1.5 text-xs">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>Security Flow</span>
              </div>
              <div className="space-y-0.5 text-[10px] text-slate-400">
                <div className="text-emerald-400">1. Identity & Auth (JWT)</div>
                <div className="text-cyan-400">2. AES-256 Encryption</div>
                <div className="text-indigo-400">3. IPFS Encrypted Store</div>
                <div className="text-purple-400">4. Smart Contract ACL</div>
                <div className="text-emerald-400">5. SHA-256 Verification</div>
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="pt-4 border-t border-slate-800/80 text-[10px] text-slate-500 space-y-1 font-mono">
            <div>Mini Project: Dec. IAM</div>
            <div>College Cybersec & Web3</div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-[#070A10] p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};
