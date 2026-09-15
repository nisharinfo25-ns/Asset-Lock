import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, File, Shield, Lock, Database, Cpu, CheckCircle2, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { sha256Browser, formatBytes, truncateHash } from '../utils/crypto';
import { StatusBadge } from '../components/StatusBadge';

export const UploadAssetPage: React.FC = () => {
  const navigate = useNavigate();

  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [fileHashPreview, setFileHashPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      if (!name) setName(selected.name);
      // Compute browser-side SHA-256 preview
      const hash = await sha256Browser(selected);
      setFileHashPreview(hash);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setError('');
    setUploading(true);
    setCurrentStep(1); // 1: Hashing

    try {
      setTimeout(() => setCurrentStep(2), 300); // 2: Encrypting
      setTimeout(() => setCurrentStep(3), 600); // 3: IPFS
      setTimeout(() => setCurrentStep(4), 900); // 4: Blockchain

      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', name);
      formData.append('description', description);

      const res = await api.uploadAsset(formData);
      setCurrentStep(5); // Complete
      setResult(res);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Upload failed');
      setCurrentStep(0);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Upload Digital Asset</h1>
        <p className="text-xs text-slate-400 mt-1">
          Module 2 & 3 — SHA-256 Hash → AES-256-GCM Encryption → IPFS Storage → Smart Contract Registration
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono">
          {error}
        </div>
      )}

      {result ? (
        /* Upload Success Receipt */
        <div className="p-6 rounded-2xl bg-[#0B111E] border border-emerald-500/30 space-y-6 shadow-2xl">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Digital Asset Encrypted & Anchored</h2>
              <p className="text-xs text-emerald-400 font-mono">Asset successfully secured under zero-knowledge storage</p>
            </div>
          </div>

          <div className="space-y-2 bg-slate-900/80 p-4 rounded-xl border border-slate-800 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Asset Identifier</span>
              <span className="text-cyan-400 font-bold">{result.asset.assetId}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Original SHA-256 Hash</span>
              <span className="text-slate-200" title={result.asset.fileHash}>
                {truncateHash(result.asset.fileHash, 14, 10)}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">IPFS Encrypted CID</span>
              <span className="text-indigo-400 font-bold" title={result.asset.ipfsCID}>
                {result.asset.ipfsCID}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Blockchain Tx Hash</span>
              <span className="text-slate-300 font-mono">{truncateHash(result.blockchain.txHash, 10, 8)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Smart Contract Block</span>
              <span className="text-emerald-400 font-bold">#{result.blockchain.blockNumber}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/assets/${result.asset.assetId}`)}
              className="flex-1 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
            >
              <span>View Asset Details & Permissions</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setResult(null);
                setFile(null);
                setName('');
                setFileHashPreview('');
              }}
              className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
            >
              Upload Another
            </button>
          </div>
        </div>
      ) : (
        /* Upload Form */
        <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-[#0B111E] border border-slate-800 space-y-6">
          {/* File Dropzone */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">Select Digital Asset (File)</label>
            <label className="border-2 border-dashed border-slate-700 hover:border-emerald-500/60 bg-slate-900/50 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors group">
              <UploadCloud className="w-8 h-8 text-slate-500 group-hover:text-emerald-400 transition-colors mb-2" />
              <div className="text-xs text-slate-300 font-medium">
                {file ? file.name : 'Click or drop digital file to upload'}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                {file ? `${formatBytes(file.size)} • ${file.type || 'Binary'}` : 'PDF, DOCX, ZIP, PNG, JSON (Max 50MB)'}
              </div>
              <input type="file" required onChange={handleFileChange} className="hidden" />
            </label>
          </div>

          {/* SHA-256 Real-time Integrity Hash Preview */}
          {fileHashPreview && (
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs font-mono space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase tracking-wider font-semibold">
                <span>Calculated SHA-256 Hash of Original File</span>
                <span className="text-emerald-400">Pre-Encryption Hash</span>
              </div>
              <div className="text-slate-200 break-all text-[11px] select-all">{fileHashPreview}</div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Asset Title / Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Confidential Defense Procurement Agreement"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Security Notes / Description</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Classified defense specifications with strict dual-custody access policy..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* 5-Step Pipeline Visualizer */}
          {uploading && (
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 font-mono text-xs">
              <div className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
                Cryptographic Execution Pipeline
              </div>
              <div className="grid grid-cols-4 gap-2 text-[10px]">
                <div className={`p-2 rounded border text-center ${currentStep >= 1 ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-bold' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                  1. SHA-256 Hash
                </div>
                <div className={`p-2 rounded border text-center ${currentStep >= 2 ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 font-bold' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                  2. AES-256 Encrypt
                </div>
                <div className={`p-2 rounded border text-center ${currentStep >= 3 ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300 font-bold' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                  3. IPFS Store
                </div>
                <div className={`p-2 rounded border text-center ${currentStep >= 4 ? 'bg-purple-500/15 border-purple-500/40 text-purple-300 font-bold' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                  4. Blockchain Anchor
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={uploading || !file}
            className="w-full py-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2"
          >
            <UploadCloud className="w-4 h-4" />
            <span>{uploading ? 'Processing Security Pipeline...' : 'Encrypt & Anchor Digital Asset'}</span>
          </button>
        </form>
      )}
    </div>
  );
};
