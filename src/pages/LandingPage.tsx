import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, FileKey, Database, Cpu, CheckCircle2, ArrowRight } from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#070A10] text-slate-100 flex flex-col justify-between selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Top Bar */}
      <header className="px-8 py-5 flex items-center justify-between border-b border-slate-800/80 bg-[#0B111E]/80 backdrop-blur">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold shadow-lg shadow-emerald-500/10">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="font-bold text-lg tracking-wider text-white font-mono">AssetLock</div>
            <div className="text-[10px] text-emerald-400 font-mono tracking-widest uppercase">Decentralised IAM Platform</div>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Link to="/login" className="text-xs font-semibold text-slate-300 hover:text-white px-4 py-2 transition-colors">
            Sign In
          </Link>
          <Link
            to="/register"
            className="text-xs font-semibold px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
          >
            <span>Get Started</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-6 py-16 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          COLLEGE MINI PROJECT SUBMISSION • CYBERSECURITY & BLOCKCHAIN
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Blockchain Based <span className="text-emerald-400">Decentralised Identity</span> & Access Control For Secure Digital Assets
        </h1>

        <p className="max-w-3xl mx-auto text-base text-slate-400 leading-relaxed font-light">
          A secure cryptographic digital asset management system where sensitive files are encrypted using AES-256-GCM,
          stored immutably in IPFS, and controlled via Smart Contracts with on-chain permissions and SHA-256 integrity audits.
        </p>

        <div className="flex items-center justify-center gap-4 pt-4">
          <Link
            to="/dashboard"
            className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/25 transition-all flex items-center gap-2"
          >
            <span>Enter Live Application</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/login"
            className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm transition-colors"
          >
            Explore Demo Personas
          </Link>
        </div>

        {/* 5 Core Architectural Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-12 text-left">
          <div className="p-4 rounded-xl bg-[#0B111E] border border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div className="font-semibold text-xs text-white">1. Identity & Role</div>
            <div className="text-[11px] text-slate-400">Wallet-linked authentication with JWT session and RBAC policies.</div>
          </div>

          <div className="p-4 rounded-xl bg-[#0B111E] border border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div className="font-semibold text-xs text-white">2. AES-256-GCM</div>
            <div className="text-[11px] text-slate-400">Military-grade symmetric encryption before files ever leave client/server.</div>
          </div>

          <div className="p-4 rounded-xl bg-[#0B111E] border border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div className="font-semibold text-xs text-white">3. IPFS Storage</div>
            <div className="text-[11px] text-slate-400">Decentralized content-addressed store returning verifiable CIDs.</div>
          </div>

          <div className="p-4 rounded-xl bg-[#0B111E] border border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
            <div className="font-semibold text-xs text-white">4. Smart Contract</div>
            <div className="text-[11px] text-slate-400">On-chain permission checks and immutable access control events.</div>
          </div>

          <div className="p-4 rounded-xl bg-[#0B111E] border border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="font-semibold text-xs text-white">5. SHA-256 Audit</div>
            <div className="text-[11px] text-slate-400">Dual-hash verification detecting any bit-level tampering in storage.</div>
          </div>
        </div>

        {/* Architecture Flow Banner */}
        <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-[#0E1729] to-slate-900 border border-slate-800 font-mono text-xs">
          <div className="text-slate-400 font-semibold mb-3">EXACT SYSTEM ARCHITECTURE FLOW</div>
          <div className="flex flex-wrap items-center justify-center gap-2 text-slate-300">
            <span className="px-3 py-1 rounded bg-slate-800 border border-slate-700 text-emerald-400">User Identity</span>
            <span>→</span>
            <span className="px-3 py-1 rounded bg-slate-800 border border-slate-700 text-cyan-400">Authentication</span>
            <span>→</span>
            <span className="px-3 py-1 rounded bg-slate-800 border border-slate-700 text-purple-400">Smart Contract Check</span>
            <span>→</span>
            <span className="px-3 py-1 rounded bg-slate-800 border border-slate-700 text-amber-400">Permission Granted/Denied</span>
            <span>→</span>
            <span className="px-3 py-1 rounded bg-slate-800 border border-slate-700 text-indigo-400">Decrypted from IPFS</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-800/80 text-center text-xs text-slate-500 font-mono">
        Built strictly according to project specifications • College Mini Project Presentation
      </footer>
    </div>
  );
};
