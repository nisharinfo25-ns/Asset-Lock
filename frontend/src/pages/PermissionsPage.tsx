import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Shield, KeyRound, UserCheck, UserX, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { Asset, Permission, User } from '../types';
import { useAuth } from '../hooks/useAuth';
import { StatusBadge } from '../components/StatusBadge';
import { formatDate, truncateHash } from '../utils/crypto';

export const PermissionsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [asset, setAsset] = useState<Asset | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);
  const [selectedUserEmail, setSelectedUserEmail] = useState('');
  const [manualWallet, setManualWallet] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [assetData, perms, users] = await Promise.all([
        api.getAsset(id),
        api.getPermissions(id),
        api.getUsers(),
      ]);
      setAsset(assetData.asset);
      setPermissions(perms);
      setRegisteredUsers(users.filter((u) => u.email !== user?.email));
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setError('');
    setMessage('');
    setSubmitting(true);

    try {
      await api.grantPermission(id, {
        userEmail: selectedUserEmail || undefined,
        userWallet: manualWallet || undefined,
      });
      setMessage('Permission granted successfully on Smart Contract.');
      setSelectedUserEmail('');
      setManualWallet('');
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to grant permission');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (wallet: string) => {
    if (!id) return;
    setError('');
    setMessage('');
    try {
      await api.revokePermission(id, wallet);
      setMessage(`Access revoked for wallet ${truncateHash(wallet, 6, 4)}.`);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to revoke permission');
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs font-mono text-slate-500">Loading access policy configuration...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(`/assets/${id}`)}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors font-mono"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Asset Inspection</span>
        </button>

        <div className="text-xs font-mono text-slate-400">
          Target Asset: <span className="text-cyan-400 font-bold">{id}</span>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-[#0B111E] border border-slate-800 space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">Smart Contract Access Control Policy</h1>
            <p className="text-xs text-slate-400">
              Module 4 & 5 — Manage authorized wallets on the blockchain access control registry
            </p>
          </div>
        </div>

        {message && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Grant Permission Form */}
        <form onSubmit={handleGrant} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
            Grant On-Chain Permission
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Select Registered User</label>
              <select
                value={selectedUserEmail}
                onChange={(e) => setSelectedUserEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="">-- Choose registered persona --</option>
                {registeredUsers.map((u) => (
                  <option key={u.email} value={u.email}>
                    {u.name} ({u.email}) - {u.role}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Or Specific Wallet Address</label>
              <input
                type="text"
                value={manualWallet}
                onChange={(e) => setManualWallet(e.target.value)}
                placeholder="0x71C... or select above"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || (!selectedUserEmail && !manualWallet)}
            className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
          >
            <UserCheck className="w-4 h-4" />
            <span>{submitting ? 'Anchoring Permission to Blockchain...' : 'Execute On-Chain Grant Access'}</span>
          </button>
        </form>
      </div>

      {/* Permissions List */}
      <div className="p-6 rounded-2xl bg-[#0B111E] border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200">Current Permission Registry</h2>
          <span className="text-xs text-slate-400 font-mono">{permissions.length} records</span>
        </div>

        {permissions.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 font-mono">
            No permissions active for this asset. Only owner has access.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="border-b border-slate-800 text-slate-500 uppercase text-[10px]">
                <tr>
                  <th className="pb-2">User Identity</th>
                  <th className="pb-2">Wallet Address</th>
                  <th className="pb-2">Access Status</th>
                  <th className="pb-2">Blockchain Tx</th>
                  <th className="pb-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-300">
                {permissions.map((p) => {
                  const isActive = p.status === 'Active';
                  return (
                    <tr key={p._id} className="hover:bg-slate-900/50">
                      <td className="py-3 font-medium text-slate-200 font-sans">{p.userEmail}</td>
                      <td className="py-3 text-slate-400">{truncateHash(p.userWallet, 6, 4)}</td>
                      <td className="py-3">
                        <StatusBadge status={isActive ? 'ACCESS GRANTED' : 'ACCESS DENIED'} size="sm" />
                      </td>
                      <td className="py-3 text-slate-500 font-mono">
                        {p.txHash ? truncateHash(p.txHash, 6, 4) : 'Genesis'}
                      </td>
                      <td className="py-3 text-right">
                        {isActive && (
                          <button
                            onClick={() => handleRevoke(p.userWallet)}
                            className="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs transition-colors inline-flex items-center gap-1 font-sans"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            <span>Revoke Access</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
