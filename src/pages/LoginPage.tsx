import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, ArrowRight, UserCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const demoAccounts = [
    { label: 'Alice (Owner)', email: 'alice@security.enclave', pass: 'Password123!', role: 'Owner' },
    { label: 'Bob (Authorized User)', email: 'bob@security.enclave', pass: 'Password123!', role: 'Authorized User' },
    { label: 'Charlie (Authorized User)', email: 'charlie@security.enclave', pass: 'Password123!', role: 'Authorized User' },
    { label: 'Admin', email: 'admin@security.enclave', pass: 'Password123!', role: 'Admin' },
  ];

  const handleSelectDemo = (acc: { email: string; pass: string }) => {
    setEmail(acc.email);
    setPassword(acc.pass);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070A10] flex items-center justify-center p-6 selection:bg-emerald-500/30 selection:text-emerald-300">
      <div className="w-full max-w-md bg-[#0B111E] border border-slate-800 rounded-2xl p-8 space-y-6 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">System Login</h2>
          <p className="text-xs text-slate-400">Authenticate session & retrieve cryptographic token</p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alice@security.enclave"
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2"
          >
            <span>{submitting ? 'Authenticating...' : 'Authenticate & Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* 1-Click Demo Personas */}
        <div className="pt-2 border-t border-slate-800/80 space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Select Demo Persona for Evaluation</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {demoAccounts.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => handleSelectDemo(acc)}
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left text-xs transition-colors"
              >
                <div className="font-medium text-slate-200 truncate">{acc.label}</div>
                <div className="text-[10px] text-emerald-400 font-mono">{acc.role}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="text-center text-xs text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-emerald-400 hover:underline font-medium">
            Register identity
          </Link>
        </div>
      </div>
    </div>
  );
};
