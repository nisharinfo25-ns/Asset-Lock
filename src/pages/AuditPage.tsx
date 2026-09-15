import React, { useState, useEffect } from 'react';
import { FileText, Filter, Shield, Search, RefreshCw, Cpu } from 'lucide-react';
import { api } from '../services/api';
import { AuditLog } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { formatDate, truncateHash } from '../utils/crypto';

export const AuditPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [actionFilter, setActionFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditLogs({ action: actionFilter || undefined });
      setLogs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  const filtered = logs.filter(
    (l) =>
      l.user.toLowerCase().includes(search.toLowerCase()) ||
      l.assetId.toLowerCase().includes(search.toLowerCase()) ||
      (l.details && l.details.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Tamper-Resistant Audit Log</h1>
          <p className="text-xs text-slate-400 mt-1">
            Section 6 — Verifiable audit trail recording every upload, permission modification, access attempt, and integrity check
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Trail</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0B111E] p-3 rounded-xl border border-slate-800">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
          >
            <option value="">All Audit Actions</option>
            <option value="UPLOAD">UPLOAD</option>
            <option value="ACCESS">ACCESS</option>
            <option value="PERMISSION_GRANTED">PERMISSION_GRANTED</option>
            <option value="PERMISSION_REVOKED">PERMISSION_REVOKED</option>
            <option value="INTEGRITY_CHECK">INTEGRITY_CHECK</option>
            <option value="LOGIN">LOGIN</option>
            <option value="REGISTER">REGISTER</option>
          </select>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search identity or asset ID..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-[#0B111E] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 font-mono">Loading immutable audit records...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 font-mono">No audit log records match filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="border-b border-slate-800 bg-slate-900/60 text-slate-500 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">User / Wallet</th>
                  <th className="py-3 px-4">Asset ID</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Result</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4 text-right">Blockchain Tx</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-300">
                {filtered.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">{formatDate(log.createdAt)}</td>
                    <td className="py-3 px-4 font-sans font-medium text-slate-200">{log.user}</td>
                    <td className="py-3 px-4 text-cyan-400">{log.assetId}</td>
                    <td className="py-3 px-4 font-bold text-white">{log.action}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={log.result} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-slate-400 max-w-xs truncate text-[11px]" title={log.details}>
                      {log.details}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500 whitespace-nowrap">
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
