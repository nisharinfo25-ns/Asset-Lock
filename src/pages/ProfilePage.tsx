import React from 'react';
import { UserCircle, Shield, Wallet, Key, CheckCircle, Mail, Clock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { formatDate } from '../utils/crypto';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">User Identity & Wallet Profile</h1>
        <p className="text-xs text-slate-400 mt-1">
          Module 1 — Verified digital identity, cryptographic wallet binding, and role authorization
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-[#0B111E] border border-slate-800 space-y-6 shadow-2xl">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
            <UserCircle className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">{user?.name}</h2>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold uppercase font-mono">
                {user?.role}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>
          </div>
        </div>

        {/* Identity Credentials Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs pt-2">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase">
              <Wallet className="w-3.5 h-3.5 text-cyan-400" />
              <span>Associated Ethereum Wallet</span>
            </div>
            <div className="text-slate-200 select-all break-all text-[11px] font-bold">
              {user?.walletAddress || '0x0000000000000000000000000000000000000000'}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Identity Verification Status</span>
            </div>
            <div className="text-emerald-400 font-bold flex items-center gap-1.5 mt-0.5">
              <CheckCircle className="w-4 h-4" />
              <span>VERIFIED CYBERSECURITY IDENTITY</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase">
              <Mail className="w-3.5 h-3.5 text-indigo-400" />
              <span>Enclave Communication Handle</span>
            </div>
            <div className="text-slate-200 font-sans text-xs">{user?.email}</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              <span>Account Registration Timestamp</span>
            </div>
            <div className="text-slate-200 text-[11px]">{formatDate(user?.createdAt || '')}</div>
          </div>
        </div>

        {/* Security Policy Information */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs">
          <div className="text-slate-300 font-semibold font-mono text-[11px] flex items-center gap-2">
            <Key className="w-3.5 h-3.5 text-emerald-400" />
            <span>Role-Based Permissions Assigned</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            {user?.role === 'Owner' &&
              'As an Asset Owner, you have administrative custody to encrypt files, anchor hashes to the blockchain, and grant or revoke access permissions to other registered users.'}
            {user?.role === 'Authorized User' &&
              'As an Authorized User, your wallet is eligible to receive asset decryption permissions from Asset Owners. Access checks are verified on-chain before file retrieval.'}
            {user?.role === 'Admin' &&
              'As an Enclave Administrator, you have complete oversight across all audit trails, smart contract event logs, and user identity registers.'}
          </p>
        </div>
      </div>
    </div>
  );
};
