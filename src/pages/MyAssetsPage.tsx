import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FolderLock, ExternalLink, CheckCheck, UploadCloud, Shield, Search } from 'lucide-react';
import { api } from '../services/api';
import { Asset } from '../types';
import { useAuth } from '../hooks/useAuth';
import { formatBytes, formatDate, truncateHash } from '../utils/crypto';

export const MyAssetsPage: React.FC = () => {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [scope, setScope] = useState<'all' | 'mine' | 'shared'>('all');

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const q = scope === 'all' ? undefined : scope;
      const data = await api.getAssets(q);
      setAssets(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [scope]);

  const filtered = assets.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.assetId.toLowerCase().includes(search.toLowerCase()) ||
      a.ipfsCID.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Protected Digital Assets</h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse and manage all encrypted digital assets anchored to the blockchain
          </p>
        </div>

        {(user?.role === 'Owner' || user?.role === 'Admin') && (
          <Link
            to="/upload"
            className="px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Asset</span>
          </Link>
        )}
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0B111E] p-3 rounded-xl border border-slate-800">
        <div className="flex items-center space-x-1 w-full sm:w-auto">
          <button
            onClick={() => setScope('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              scope === 'all' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            All Assets
          </button>
          <button
            onClick={() => setScope('mine')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              scope === 'mine' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            Owned by Me
          </button>
          <button
            onClick={() => setScope('shared')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              scope === 'shared' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            Shared With Me
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, ID, CID..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Asset Table */}
      <div className="bg-[#0B111E] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 font-mono">Loading assets from secure ledger...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 font-mono space-y-2">
            <div>No digital assets found in current view.</div>
            {(user?.role === 'Owner' || user?.role === 'Admin') && (
              <Link to="/upload" className="text-emerald-400 hover:underline inline-block mt-2 font-sans font-semibold">
                Upload your first encrypted digital asset →
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="border-b border-slate-800 bg-slate-900/60 text-slate-500 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Asset Details</th>
                  <th className="py-3 px-4">Owner</th>
                  <th className="py-3 px-4">IPFS CID</th>
                  <th className="py-3 px-4">SHA-256 Hash</th>
                  <th className="py-3 px-4">Smart Contract</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-300">
                {filtered.map((asset) => {
                  const isOwner = asset.ownerEmail === user?.email;
                  return (
                    <tr key={asset._id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-3.5 px-4 font-sans">
                        <Link to={`/assets/${asset.assetId}`} className="font-semibold text-slate-100 hover:text-emerald-400 transition-colors block">
                          {asset.name}
                        </Link>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2 mt-0.5">
                          <span className="text-cyan-400">{asset.assetId}</span>
                          <span>•</span>
                          <span>{formatBytes(asset.fileSize)}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-slate-200 font-sans text-xs">{asset.ownerEmail}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{truncateHash(asset.ownerWallet, 4, 4)}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <a
                          href={`http://localhost:5000/api/ipfs/${asset.ipfsCID}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-400 hover:text-indigo-300 font-bold hover:underline inline-flex items-center gap-1"
                          title="Inspect raw encrypted payload on IPFS gateway"
                        >
                          <span>{truncateHash(asset.ipfsCID, 7, 5)}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>

                      <td className="py-3.5 px-4 text-slate-400" title={asset.fileHash}>
                        {truncateHash(asset.fileHash, 6, 6)}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-emerald-400 text-[11px]">
                          Block #{asset.blockNumber}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            to={`/assets/${asset.assetId}`}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-sans font-medium transition-colors"
                          >
                            Inspect
                          </Link>
                          <Link
                            to={`/integrity?id=${asset.assetId}`}
                            title="Verify Hash Integrity"
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 transition-colors"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                          </Link>
                        </div>
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
