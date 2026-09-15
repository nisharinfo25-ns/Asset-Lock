import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderLock,
  UploadCloud,
  CheckCircle2,
  XCircle,
  FileText,
  Activity,
  Cpu,
  HardDrive,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useBlockchain } from '../hooks/useBlockchain';
import { api } from '../services/api';
import { Asset, AuditLog } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { formatDate, truncateHash } from '../utils/crypto';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { blockchain, ipfs } = useBlockchain();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getAssets(), api.getAuditLogs()])
      .then(([allAssets, logs]) => {
        setAssets(allAssets);
        setAuditLogs(logs);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const ownedAssets = assets.filter((a) => a.ownerEmail === user?.email);
  const accessibleAssets = assets;
  const deniedEvents = auditLogs.filter((l) => l.result === 'DENIED');
  const recentEvents = auditLogs.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#0B111E] via-slate-900 to-[#0B111E] border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Security Command Dashboard</h1>
            <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase font-mono font-semibold">
              {user?.role}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Authenticated identity: <span className="text-slate-200 font-medium">{user?.name}</span> ({user?.email})
          </p>
        </div>

        <div className="flex items-center gap-3">
          {(user?.role === 'Owner' || user?.role === 'Admin') && (
            <Link
              to="/upload"
              className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload New Asset</span>
            </Link>
          )}
          <Link
            to="/integrity"
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs transition-colors"
          >
            Verify Integrity
          </Link>
        </div>
      </div>

      {/* Network Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Blockchain Status */}
        <div className="p-4 rounded-xl bg-[#0B111E] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-semibold text-slate-200">Blockchain Smart Contract Network</span>
            </div>
            <StatusBadge status={blockchain?.mode === 'LIVE' ? 'BLOCKCHAIN CONNECTED' : 'BLOCKCHAIN SIMULATION'} size="sm" />
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs font-mono pt-1">
            <div className="p-2 rounded bg-slate-900/80 border border-slate-800/60">
              <div className="text-[10px] text-slate-500 uppercase">Block Height</div>
              <div className="text-slate-200 font-semibold mt-0.5">#{blockchain?.blockNumber || 100}</div>
            </div>
            <div className="p-2 rounded bg-slate-900/80 border border-slate-800/60">
              <div className="text-[10px] text-slate-500 uppercase">Chain ID</div>
              <div className="text-slate-200 font-semibold mt-0.5">{blockchain?.chainId || 31337}</div>
            </div>
            <div className="p-2 rounded bg-slate-900/80 border border-slate-800/60">
              <div className="text-[10px] text-slate-500 uppercase">Engine</div>
              <div className="text-emerald-400 font-semibold mt-0.5">{blockchain?.mode || 'SIMULATION'}</div>
            </div>
          </div>
        </div>

        {/* IPFS Status */}
        <div className="p-4 rounded-xl bg-[#0B111E] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-semibold text-slate-200">Decentralised IPFS File Storage</span>
            </div>
            <StatusBadge status="IPFS CONNECTED" size="sm" />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
            <div className="p-2 rounded bg-slate-900/80 border border-slate-800/60">
              <div className="text-[10px] text-slate-500 uppercase">IPFS Protocol</div>
              <div className="text-indigo-300 font-semibold mt-0.5">V0 Content-Addressed CID</div>
            </div>
            <div className="p-2 rounded bg-slate-900/80 border border-slate-800/60">
              <div className="text-[10px] text-slate-500 uppercase">Target Engine</div>
              <div className="text-indigo-400 font-semibold mt-0.5">{ipfs?.mode === 'PINATA' ? 'Pinata Cloud' : 'Local Node Gateway'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#0B111E] border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Assets</span>
            <FolderLock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{assets.length}</div>
          <div className="text-[10px] text-slate-500">Registered across system</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0B111E] border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Owned Assets</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">{ownedAssets.length}</div>
          <div className="text-[10px] text-slate-500">Created by current identity</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0B111E] border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Accessible Assets</span>
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-indigo-400 font-mono">{accessibleAssets.length}</div>
          <div className="text-[10px] text-slate-500">Within policy boundary</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0B111E] border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Denied Access</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 font-mono">{deniedEvents.length}</div>
          <div className="text-[10px] text-slate-500">Blocked by smart contract</div>
        </div>
      </div>

      {/* Recent Access Events Section */}
      <div className="p-5 rounded-xl bg-[#0B111E] border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-slate-100">Recent Access & Audit Events</h2>
          </div>
          <Link to="/audit" className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1">
            <span>View Full Audit Log</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentEvents.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 font-mono">No access events recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="border-b border-slate-800 text-slate-500 uppercase text-[10px]">
                <tr>
                  <th className="pb-2">Timestamp</th>
                  <th className="pb-2">User Identity</th>
                  <th className="pb-2">Asset ID</th>
                  <th className="pb-2">Action</th>
                  <th className="pb-2">Status / Result</th>
                  <th className="pb-2 text-right">Blockchain Tx</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-300">
                {recentEvents.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-900/50">
                    <td className="py-2.5 text-slate-400">{formatDate(log.createdAt)}</td>
                    <td className="py-2.5 font-medium text-slate-200">{log.user}</td>
                    <td className="py-2.5 text-cyan-400">{log.assetId}</td>
                    <td className="py-2.5 font-semibold">{log.action}</td>
                    <td className="py-2.5">
                      <StatusBadge status={log.result} size="sm" />
                    </td>
                    <td className="py-2.5 text-right text-slate-500">
                      {log.txHash ? truncateHash(log.txHash, 6, 4) : 'Off-chain'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
