import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Shield,
  Lock,
  HardDrive,
  Cpu,
  KeyRound,
  Download,
  CheckCheck,
  Users,
  ExternalLink,
  ArrowLeft,
  FileCheck2,
} from 'lucide-react';
import { api } from '../services/api';
import { Asset, Permission } from '../types';
import { useAuth } from '../hooks/useAuth';
import { StatusBadge } from '../components/StatusBadge';
import { formatBytes, formatDate, truncateHash } from '../utils/crypto';

export const AssetDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [asset, setAsset] = useState<Asset | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [accessResult, setAccessResult] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fetchAsset = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await api.getAsset(id);
      setAsset(data.asset);
      setIsOwner(data.isOwner);
      setHasAccess(data.hasAccess);
      setPermissions(data.permissions);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to fetch asset');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAsset();
  }, [id]);

  const handleAccessAsset = async () => {
    if (!asset) return;
    setDownloading(true);
    setAccessResult(null);
    setError('');
    try {
      await api.downloadAsset(asset.assetId, asset.name);
      setAccessResult('ACCESS GRANTED');
    } catch (err: any) {
      if (err.response?.status === 403) {
        setAccessResult('ACCESS DENIED');
      } else {
        setError(err.response?.data?.error || 'Failed to access decrypted payload');
      }
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs font-mono text-slate-500">Loading asset cryptographic parameters...</div>;
  }

  if (!asset) {
    return (
      <div className="p-8 text-center space-y-3">
        <div className="text-sm font-bold text-rose-400 font-mono">Asset ID '{id}' not found</div>
        <Link to="/assets" className="text-xs text-emerald-400 hover:underline">
          Return to asset ledger →
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button & Title */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/assets')}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors font-mono"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Assets</span>
        </button>

        <div className="flex items-center gap-2">
          {isOwner && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-semibold font-mono">
              YOU ARE ASSET OWNER
            </span>
          )}
          <StatusBadge status={hasAccess ? 'ACCESS GRANTED' : 'ACCESS DENIED'} size="sm" />
        </div>
      </div>

      {/* Main Asset Header Card */}
      <div className="p-6 rounded-2xl bg-[#0B111E] border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">{asset.name}</h1>
            <div className="text-xs text-slate-400 mt-1 font-mono flex items-center gap-2">
              <span className="text-cyan-400 font-bold">{asset.assetId}</span>
              <span>•</span>
              <span>{formatBytes(asset.fileSize)}</span>
              <span>•</span>
              <span>{asset.fileType}</span>
            </div>
          </div>

          {/* Action Buttons strictly according to Section 5 */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Access Asset Button */}
            <button
              onClick={handleAccessAsset}
              disabled={downloading}
              className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? 'Authenticating...' : 'Access Asset (Decrypt)'}</span>
            </button>

            {/* Manage Permissions (Owner Only) */}
            {isOwner && (
              <Link
                to={`/assets/${asset.assetId}/permissions`}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs transition-colors flex items-center gap-1.5"
              >
                <Users className="w-4 h-4 text-purple-400" />
                <span>Manage Permissions</span>
              </Link>
            )}

            {/* Verify Integrity */}
            <Link
              to={`/integrity?id=${asset.assetId}`}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs transition-colors flex items-center gap-1.5"
            >
              <CheckCheck className="w-4 h-4 text-emerald-400" />
              <span>Verify Integrity</span>
            </Link>
          </div>
        </div>

        {/* Dynamic Access Result Banner */}
        {accessResult && (
          <div className="pt-2">
            <div
              className={`p-4 rounded-xl border flex items-center justify-between font-mono text-xs ${
                accessResult === 'ACCESS GRANTED'
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/40 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <StatusBadge status={accessResult} size="md" />
                <span>
                  {accessResult === 'ACCESS GRANTED'
                    ? 'Cryptographic key verified. Decrypted original file downloaded directly to your device.'
                    : 'Smart Contract denied access: Wallet/User lacks required role or permission token.'}
                </span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono">
            {error}
          </div>
        )}
      </div>

      {/* Forensic Parameter Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Module 2: Cryptographic Parameters */}
        <div className="p-5 rounded-xl bg-[#0B111E] border border-slate-800 space-y-3 font-mono text-xs">
          <div className="flex items-center gap-2 font-semibold text-slate-200 font-sans text-xs border-b border-slate-800/80 pb-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span>Cryptographic Proof & Metadata</span>
          </div>

          <div className="space-y-2 text-slate-400">
            <div>
              <div className="text-[10px] uppercase text-slate-500">SHA-256 Original Plaintext Hash</div>
              <div className="text-slate-200 break-all select-all font-semibold mt-0.5 text-[11px]">{asset.fileHash}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-slate-500">Encryption Cipher</div>
              <div className="text-emerald-400 font-semibold mt-0.5">AES-256-GCM (Authenticated Encryption)</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-slate-500">Owner Identity & Wallet</div>
              <div className="text-slate-200 mt-0.5">
                {asset.ownerEmail} <span className="text-slate-500">({truncateHash(asset.ownerWallet, 6, 4)})</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-slate-500">Creation Timestamp</div>
              <div className="text-slate-200 mt-0.5">{formatDate(asset.createdAt)}</div>
            </div>
          </div>
        </div>

        {/* Module 3 & 5: Decentralized Storage & Blockchain */}
        <div className="p-5 rounded-xl bg-[#0B111E] border border-slate-800 space-y-3 font-mono text-xs">
          <div className="flex items-center gap-2 font-semibold text-slate-200 font-sans text-xs border-b border-slate-800/80 pb-2">
            <Cpu className="w-4 h-4 text-purple-400" />
            <span>IPFS & Smart Contract Anchor</span>
          </div>

          <div className="space-y-2 text-slate-400">
            <div>
              <div className="text-[10px] uppercase text-slate-500">IPFS Encrypted CID</div>
              <a
                href={`http://localhost:5000/api/ipfs/${asset.ipfsCID}`}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 hover:text-indigo-300 font-bold hover:underline flex items-center gap-1 break-all mt-0.5"
              >
                <span>{asset.ipfsCID}</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </div>
            <div>
              <div className="text-[10px] uppercase text-slate-500">Blockchain Transaction Hash</div>
              <div className="text-slate-200 break-all select-all mt-0.5 text-[11px]">{asset.txHash}</div>
            </div>
            <div className="flex justify-between">
              <div>
                <div className="text-[10px] uppercase text-slate-500">Block Anchor</div>
                <div className="text-emerald-400 font-bold mt-0.5">#{asset.blockNumber}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-slate-500">Smart Contract Engine</div>
                <div className="text-slate-200 mt-0.5">{asset.blockchainMode}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Permissions Table Section */}
      <div className="p-5 rounded-xl bg-[#0B111E] border border-slate-800 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-400" />
            <h2 className="text-xs font-semibold text-slate-200">Active On-Chain Permissions</h2>
          </div>
          {isOwner && (
            <Link
              to={`/assets/${asset.assetId}/permissions`}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
            >
              + Grant Access to User
            </Link>
          )}
        </div>

        {permissions.length === 0 ? (
          <div className="py-4 text-center text-xs text-slate-500 font-mono">No external permissions granted yet.</div>
        ) : (
          <div className="overflow-x-auto font-mono text-xs">
            <table className="w-full text-left">
              <thead className="text-slate-500 text-[10px] uppercase border-b border-slate-800">
                <tr>
                  <th className="pb-2">User Email</th>
                  <th className="pb-2">Wallet Address</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Granted Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-300">
                {permissions.map((p) => (
                  <tr key={p._id}>
                    <td className="py-2.5 font-medium text-slate-200">{p.userEmail}</td>
                    <td className="py-2.5 text-slate-400">{truncateHash(p.userWallet, 6, 4)}</td>
                    <td className="py-2.5">
                      <StatusBadge status={p.status.toUpperCase()} size="sm" />
                    </td>
                    <td className="py-2.5 text-slate-500">{formatDate(p.createdAt)}</td>
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
