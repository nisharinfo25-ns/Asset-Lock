import React from 'react';
import { Shield, ShieldAlert, CheckCircle, XCircle, HardDrive, Link } from 'lucide-react';

interface StatusBadgeProps {
  status:
    | 'INTEGRITY VERIFIED'
    | 'TAMPER DETECTED'
    | 'ACCESS GRANTED'
    | 'ACCESS DENIED'
    | 'BLOCKCHAIN CONNECTED'
    | 'BLOCKCHAIN SIMULATION'
    | 'IPFS CONNECTED'
    | 'ACTIVE'
    | 'REVOKED'
    | string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const norm = status.toUpperCase();

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold',
  }[size];

  if (norm === 'INTEGRITY VERIFIED' || norm === 'VERIFIED') {
    return (
      <span className={`inline-flex items-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 ${sizeClasses}`}>
        <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        INTEGRITY VERIFIED
      </span>
    );
  }

  if (norm === 'TAMPER DETECTED') {
    return (
      <span className={`inline-flex items-center rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/40 animate-pulse ${sizeClasses}`}>
        <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
        TAMPER DETECTED
      </span>
    );
  }

  if (norm === 'ACCESS GRANTED' || norm === 'GRANTED') {
    return (
      <span className={`inline-flex items-center rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 ${sizeClasses}`}>
        <Shield className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
        ACCESS GRANTED
      </span>
    );
  }

  if (norm === 'ACCESS DENIED' || norm === 'DENIED') {
    return (
      <span className={`inline-flex items-center rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 ${sizeClasses}`}>
        <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
        ACCESS DENIED
      </span>
    );
  }

  if (norm === 'BLOCKCHAIN CONNECTED' || norm === 'LIVE') {
    return (
      <span className={`inline-flex items-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 ${sizeClasses}`}>
        <Link className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        Blockchain Connected
      </span>
    );
  }

  if (norm === 'BLOCKCHAIN SIMULATION' || norm === 'SIMULATION') {
    return (
      <span className={`inline-flex items-center rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 ${sizeClasses}`}>
        <Link className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        Blockchain Simulation Mode
      </span>
    );
  }

  if (norm === 'IPFS CONNECTED' || norm === 'LOCAL' || norm === 'PINATA') {
    return (
      <span className={`inline-flex items-center rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 ${sizeClasses}`}>
        <HardDrive className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
        IPFS Connected
      </span>
    );
  }

  if (norm === 'ACTIVE') {
    return (
      <span className={`inline-flex items-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ${sizeClasses}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1" />
        Active
      </span>
    );
  }

  if (norm === 'REVOKED') {
    return (
      <span className={`inline-flex items-center rounded-full bg-slate-700/50 text-slate-400 border border-slate-600/30 ${sizeClasses}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1" />
        Revoked
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center rounded-full bg-slate-800 text-slate-300 border border-slate-700 ${sizeClasses}`}>
      {status}
    </span>
  );
};
