import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCheck, ShieldAlert, ShieldCheck, Database, RefreshCw, FileText, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { Asset } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { truncateHash } from '../utils/crypto';

export const IntegrityPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const preselectedId = searchParams.get('id');

  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState(preselectedId || '');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<{
    status: 'INTEGRITY VERIFIED' | 'TAMPER DETECTED';
    verified: boolean;
    currentHash: string;
    storedHash: string;
    match: boolean;
    asset: { assetId: string; name: string; ipfsCID: string };
  } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getAssets().then((data) => {
      setAssets(data);
      if (!selectedAssetId && data.length > 0) {
        setSelectedAssetId(data[0].assetId);
      }
    });
  }, []);

  const handleVerify = async () => {
    if (!selectedAssetId) return;
    setError('');
    setVerifying(true);
    setResult(null);

    try {
      const res = await api.verifyIntegrity(selectedAssetId);
      setResult(res);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Verification check failed');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Cryptographic Integrity Verification Lab</h1>
        <p className="text-xs text-slate-400 mt-1">
          Module 6 — Recalculates decrypted SHA-256 hash and compares with immutable hash stored in the Smart Contract
        </p>
      </div>

      {/* Target Asset Selector */}
      <div className="p-6 rounded-2xl bg-[#0B111E] border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
          <div className="flex-1 w-full">
            <label className="block text-xs font-medium text-slate-300 mb-1">Select Target Digital Asset</label>
            <select
              value={selectedAssetId}
              onChange={(e) => {
                setSelectedAssetId(e.target.value);
                setResult(null);
              }}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
            >
              {assets.map((a) => (
                <option key={a.assetId} value={a.assetId}>
                  {a.name} ({a.assetId})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleVerify}
            disabled={verifying || !selectedAssetId}
            className="w-full sm:w-auto px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${verifying ? 'animate-spin' : ''}`} />
            <span>{verifying ? 'Performing SHA-256 Audit...' : 'Execute Integrity Verification'}</span>
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono">
            {error}
          </div>
        )}
      </div>

      {/* Verification Results Panel */}
      {result && (
        <div className="p-6 rounded-2xl bg-[#0B111E] border border-slate-800 space-y-6 animate-fade-in shadow-2xl">
          {/* Main Status Callout */}
          <div className="flex items-center justify-between p-4 rounded-xl border bg-slate-900/90 border-slate-700/80">
            <div className="flex items-center space-x-3">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  result.match ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                }`}
              >
                {result.match ? <ShieldCheck className="w-7 h-7" /> : <ShieldAlert className="w-7 h-7" />}
              </div>
              <div>
                <div className="text-base font-bold text-white tracking-wide">
                  {result.match ? 'INTEGRITY VERIFIED' : 'TAMPER DETECTED'}
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  {result.match
                    ? 'Decrypted file hash matches on-chain blockchain anchor precisely.'
                    : 'CRITICAL ALERT: File hash differs from blockchain anchor! Content has been altered.'}
                </div>
              </div>
            </div>
            <StatusBadge status={result.status} size="lg" />
          </div>

          {/* Dual-Hash Comparison Breakdown */}
          <div className="space-y-4 font-mono text-xs">
            <div className="text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              Cryptographic Hash Comparison
            </div>

            {/* Hash 1: Current Recalculated Hash */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase">
                <span>1. Recalculated SHA-256 (Decrypted from IPFS)</span>
                <span className="text-cyan-400 font-semibold">Live Computed</span>
              </div>
              <div className="text-slate-200 select-all break-all text-[11px] font-bold">{result.currentHash}</div>
            </div>

            {/* Hash 2: Blockchain Stored Anchor */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase">
                <span>2. Immutable SHA-256 (Smart Contract Storage)</span>
                <span className="text-emerald-400 font-semibold">Blockchain Truth</span>
              </div>
              <div className="text-slate-200 select-all break-all text-[11px] font-bold">{result.storedHash}</div>
            </div>

            {/* Mathematical Match Flag */}
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Byte-for-Byte Cryptographic Match:</span>
              <span className={`font-bold font-mono ${result.match ? 'text-emerald-400' : 'text-rose-400'}`}>
                {result.match ? 'MATCH CONFIRMED (0x00 DIFF)' : 'MISMATCH DETECTED (INTEGRITY COMPROMISED)'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <Link
              to={`/assets/${result.asset.assetId}`}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 font-mono"
            >
              <span>Inspect asset parameters</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
