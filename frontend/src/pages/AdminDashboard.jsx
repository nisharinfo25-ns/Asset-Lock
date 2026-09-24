import { useEffect, useState, useRef } from 'react'
import { Users, Files, Shield, Clock, ShieldCheck, Upload, Check, Copy, FileCheck, FileX, AlertCircle, Database, Cpu } from 'lucide-react'
import { usersAPI, assetsAPI, requestsAPI, auditAPI } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { Card, CardHeader, CardBody } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import toast from 'react-hot-toast'

function StatCard({ icon: Icon, label, value, sublabel }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-surface-500 uppercase tracking-wider mb-1">{label}</p>
          <p className="text-2xl font-bold text-surface-100">{value ?? '—'}</p>
          {sublabel && <p className="text-[11px] text-surface-400 mt-1">{sublabel}</p>}
        </div>
        <div className="w-10 h-10 bg-accent-500/10 rounded-lg flex items-center justify-center">
          <Icon className="w-5 h-5 text-accent-400" />
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [assets, setAssets] = useState([])
  const [requests, setRequests] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  // Admin Integrity Verification state
  const [selectedAssetId, setSelectedAssetId] = useState('')
  const [verificationFile, setVerificationFile] = useState(null)
  const [verifying, setVerifying] = useState(false)
  const [verifyResult, setVerifyResult] = useState(null)
  const [copiedField, setCopiedField] = useState(null)
  const fileInputRef = useRef(null)

  const copyToClipboard = (text, fieldName) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedField(fieldName)
    toast.success('Copied to clipboard')
    setTimeout(() => setCopiedField(null), 2000)
  }

  useEffect(() => {
    Promise.allSettled([
      usersAPI.getAll(), assetsAPI.getAll(), requestsAPI.getAll(), auditAPI.getAll({ limit: 20 })
    ]).then(([u, a, r, l]) => {
      if (u.status === 'fulfilled') setUsers(u.value.data.data.users || [])
      if (a.status === 'fulfilled') setAssets(a.value.data.data.assets || [])
      if (r.status === 'fulfilled') setRequests(r.value.data.data.requests || [])
      if (l.status === 'fulfilled') setLogs(l.value.data.data.logs || [])
    }).finally(() => setLoading(false))
  }, [])

  const selectedAsset = assets.find(a => a.id === selectedAssetId)

  const handleAdminVerify = async () => {
    if (!selectedAssetId) return toast.error('Please select an asset')
    if (!verificationFile) return toast.error('Please select an encrypted file to verify')

    if (!selectedAsset?.file_hash) {
      setVerifyResult({
        status: 'FAILED',
        isMatch: false,
        message: 'Selected asset has no stored encrypted-file hash reference.',
        assetName: selectedAsset?.name,
        owner: selectedAsset?.owner?.name || selectedAsset?.owner?.email || 'N/A',
        storedHash: 'Not available',
        currentHash: '—',
        verifiedAt: new Date().toISOString()
      })
      return toast.error('Asset has no stored encrypted hash')
    }

    setVerifying(true)
    try {
      // 1. Read binary bytes directly in browser
      const arrayBuffer = await verificationFile.arrayBuffer()

      // 2. Compute exact SHA-256 hash using Web Crypto API
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', arrayBuffer)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const currentHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toLowerCase()
      const storedHash = selectedAsset.file_hash.trim().toLowerCase()

      // 3. Compare with stored encrypted-file hash
      const isMatch = currentHash === storedHash

      // Also trigger audit log verification via API
      try {
        await assetsAPI.verifyIntegrity(selectedAssetId, currentHash)
      } catch (_) {}

      if (isMatch) {
        setVerifyResult({
          status: 'VERIFIED',
          isMatch: true,
          message: 'The selected encrypted file matches the stored encrypted asset.',
          assetName: selectedAsset.name,
          owner: selectedAsset.owner?.name || selectedAsset.owner?.email || 'Owner',
          storedHash: selectedAsset.file_hash,
          currentHash,
          verifiedAt: new Date().toISOString()
        })
        toast.success('INTEGRITY VERIFIED: Hashes match')
      } else {
        setVerifyResult({
          status: 'TAMPER_DETECTED',
          isMatch: false,
          message: 'TAMPER DETECTED: The selected encrypted file hash does not match the stored hash.',
          assetName: selectedAsset.name,
          owner: selectedAsset.owner?.name || selectedAsset.owner?.email || 'Owner',
          storedHash: selectedAsset.file_hash,
          currentHash,
          verifiedAt: new Date().toISOString()
        })
        toast.error('TAMPER DETECTED: Hashes do not match')
      }
    } catch (err) {
      console.error('Admin verification error:', err)
      setVerifyResult({
        status: 'FAILED',
        isMatch: false,
        message: 'Failed to calculate file hash: ' + (err.message || 'Unknown error'),
        assetName: selectedAsset?.name,
        owner: selectedAsset?.owner?.name || 'Owner',
        storedHash: selectedAsset?.file_hash || 'N/A',
        currentHash: '—',
        verifiedAt: new Date().toISOString()
      })
      toast.error('Verification failed')
    } finally {
      setVerifying(false)
    }
  }

  const blockchainCount = assets.filter(a => a.blockchain_asset_id).length

  return (
    <div className="space-y-6">
      {/* Header Banner with Admin Identity & System Status */}
      <div className="p-5 bg-surface-900 border border-surface-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-surface-100">{user?.name || 'Nexshield@Admin'}</h2>
            <Badge variant="danger" className="font-mono text-xs">ROLE: ADMIN</Badge>
          </div>
          <p className="text-xs text-surface-400">
            System-Level Administrator · Full oversight of users, assets, and global integrity verification
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-950 border border-surface-800 rounded-lg text-xs">
            <Cpu className="w-3.5 h-3.5 text-success" />
            <span className="text-surface-400">Blockchain:</span>
            <span className="text-success font-medium">Localhost (Hardhat)</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-950 border border-surface-800 rounded-lg text-xs">
            <Database className="w-3.5 h-3.5 text-accent-400" />
            <span className="text-surface-400">IPFS:</span>
            <span className="text-accent-300 font-medium">Pinata Configured</span>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value={users.length} sublabel="All Registered Accounts" />
        <StatCard icon={Files} label="Total Assets" value={assets.length} sublabel={`${blockchainCount} On Blockchain`} />
        <StatCard icon={Clock} label="Access Requests" value={requests.length} sublabel="Cross-User Requests" />
        <StatCard icon={Shield} label="Audit Events" value={logs.length} sublabel="Immutable Log Records" />
      </div>

      {/* Global Integrity Verification (Admin can verify ANY asset) */}
      <Card className="border-accent-500/20 bg-surface-900/60">
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent-500/10 flex items-center justify-center text-accent-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-surface-100">Global Asset Integrity Verification</h3>
              <p className="text-xs text-surface-400">
                Perform read-only integrity verification on ANY registered digital asset in the system
              </p>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Step 1: Select Asset */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-surface-400 uppercase tracking-wider">
                1. Select Asset to Inspect
              </label>
              <select
                value={selectedAssetId}
                onChange={e => {
                  setSelectedAssetId(e.target.value)
                  setVerifyResult(null)
                }}
                className="input-field"
              >
                <option value="">Choose an asset...</option>
                {assets.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name} (Owner: {a.owner?.name || a.owner?.email || 'User'})
                  </option>
                ))}
              </select>
            </div>

            {/* Step 2: Select Local Encrypted File */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-surface-400 uppercase tracking-wider">
                2. Select Encrypted File (.bin)
              </label>
              <div className="flex gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={e => {
                    const f = e.target.files?.[0]
                    if (f) {
                      setVerificationFile(f)
                      setVerifyResult(null)
                    }
                  }}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!selectedAssetId}
                  className="shrink-0"
                >
                  <Upload className="w-4 h-4 mr-1.5 text-surface-400" />
                  {verificationFile ? 'Change File' : 'Choose File'}
                </Button>
                <div className="flex-1 px-3 py-2 bg-surface-950 rounded-lg border border-surface-800 text-xs text-surface-400 truncate flex items-center">
                  {verificationFile ? (
                    <span className="text-surface-200 font-mono truncate">
                      {verificationFile.name} ({(verificationFile.size / 1024).toFixed(2)} KB)
                    </span>
                  ) : (
                    <span className="text-surface-500 italic">No file chosen</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {selectedAsset && (
            <div className="p-3 bg-surface-950 rounded-lg border border-surface-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-surface-500 block">Asset Name:</span>
                <span className="font-semibold text-surface-200 truncate block">{selectedAsset.name}</span>
              </div>
              <div>
                <span className="text-surface-500 block">Owner:</span>
                <span className="text-surface-300 truncate block">{selectedAsset.owner?.name || selectedAsset.owner?.email || 'N/A'}</span>
              </div>
              <div>
                <span className="text-surface-500 block">Blockchain:</span>
                <Badge variant={selectedAsset.blockchain_asset_id ? 'success' : 'neutral'} className="mt-0.5">
                  {selectedAsset.blockchain_asset_id ? 'Registered' : 'Not registered'}
                </Badge>
              </div>
              <div className="sm:col-span-3 pt-2 border-t border-surface-800/60">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-surface-500">Stored Encrypted File Hash:</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(selectedAsset.file_hash, 'admin_ref_hash')}
                    className="p-1 text-surface-400 hover:text-surface-200"
                    title="Copy hash"
                  >
                    {copiedField === 'admin_ref_hash' ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="font-mono text-accent-400 text-xs break-all select-all">{selectedAsset.file_hash}</p>
              </div>
            </div>
          )}

          <Button
            type="button"
            variant="primary"
            onClick={handleAdminVerify}
            loading={verifying}
            disabled={!selectedAssetId || !verificationFile || verifying}
            className="w-full justify-center"
          >
            <ShieldCheck className="w-4 h-4 mr-2" /> Perform Integrity Verification
          </Button>

          {/* Verification Result Display */}
          {verifyResult && (
            <div
              className={`p-4 rounded-xl border transition-all ${
                verifyResult.status === 'VERIFIED'
                  ? 'bg-success/5 border-success/30'
                  : verifyResult.status === 'TAMPER_DETECTED'
                  ? 'bg-danger/5 border-danger/30'
                  : 'bg-warning/5 border-warning/30'
              }`}
            >
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-surface-800/60">
                <div className="flex items-center gap-2.5">
                  {verifyResult.status === 'VERIFIED' && (
                    <>
                      <div className="w-7 h-7 rounded-full bg-success/20 flex items-center justify-center">
                        <FileCheck className="w-4 h-4 text-success" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-success">✅ INTEGRITY VERIFIED</span>
                        <p className="text-xs text-surface-300">{verifyResult.message}</p>
                      </div>
                    </>
                  )}
                  {verifyResult.status === 'TAMPER_DETECTED' && (
                    <>
                      <div className="w-7 h-7 rounded-full bg-danger/20 flex items-center justify-center">
                        <FileX className="w-4 h-4 text-danger" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-danger">⚠️ TAMPER DETECTED</span>
                        <p className="text-xs text-surface-300">{verifyResult.message}</p>
                      </div>
                    </>
                  )}
                  {verifyResult.status === 'FAILED' && (
                    <>
                      <div className="w-7 h-7 rounded-full bg-warning/20 flex items-center justify-center">
                        <AlertCircle className="w-4 h-4 text-warning" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-warning">❌ VERIFICATION FAILED</span>
                        <p className="text-xs text-surface-300">{verifyResult.message}</p>
                      </div>
                    </>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-surface-500 block">Verification Result</span>
                  <Badge variant={verifyResult.isMatch ? 'success' : 'danger'}>
                    {verifyResult.status}
                  </Badge>
                </div>
              </div>

              {/* Exact Fields specified in Requirement 21 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 bg-surface-950/80 rounded-lg border border-surface-800">
                  <span className="text-surface-500 block mb-0.5">Asset Name:</span>
                  <span className="text-surface-200 font-semibold">{verifyResult.assetName}</span>
                </div>
                <div className="p-2.5 bg-surface-950/80 rounded-lg border border-surface-800">
                  <span className="text-surface-500 block mb-0.5">Owner:</span>
                  <span className="text-surface-200">{verifyResult.owner}</span>
                </div>
                <div className="p-2.5 bg-surface-950/80 rounded-lg border border-surface-800">
                  <span className="text-surface-500 block mb-0.5">Stored Encrypted Hash:</span>
                  <span className="font-mono text-accent-400 break-all select-all">{verifyResult.storedHash}</span>
                </div>
                <div className="p-2.5 bg-surface-950/80 rounded-lg border border-surface-800">
                  <span className="text-surface-500 block mb-0.5">Current Encrypted Hash:</span>
                  <span className={`font-mono break-all select-all ${verifyResult.isMatch ? 'text-success' : 'text-danger'}`}>
                    {verifyResult.currentHash}
                  </span>
                </div>
              </div>

              {verifyResult.verifiedAt && (
                <p className="text-[11px] text-surface-500 text-right mt-2">
                  Verification Time: {new Date(verifyResult.verifiedAt).toLocaleString()}
                </p>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Users and Assets Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registered Users */}
        <Card>
          <div className="card-header flex items-center justify-between">
            <h3 className="text-sm font-semibold text-surface-200">Registered Users & Roles</h3>
            <span className="text-xs text-surface-500">{users.length} total</span>
          </div>
          <div className="divide-y divide-surface-800 max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-sm text-surface-500">Loading users...</div>
            ) : (
              users.map(u => (
                <div key={u.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-surface-700 flex items-center justify-center text-xs font-bold text-surface-300 shrink-0">
                      {u.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-surface-200 truncate">{u.name}</p>
                      <p className="text-[11px] text-surface-500 truncate">{u.email}</p>
                    </div>
                  </div>
                  <Badge variant={u.role?.toUpperCase() === 'ADMIN' ? 'danger' : 'neutral'} className="shrink-0 font-mono text-[10px]">
                    {u.role?.toUpperCase()}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Security Audit Activity */}
        <Card>
          <div className="card-header flex items-center justify-between">
            <h3 className="text-sm font-semibold text-surface-200">System Security Audit Activity</h3>
            <span className="text-xs text-surface-500">{logs.length} events</span>
          </div>
          <div className="divide-y divide-surface-800 max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-sm text-surface-500">Loading audit activity...</div>
            ) : (
              logs.map(log => (
                <div key={log.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-surface-300">{log.action?.replace(/_/g, ' ')}</p>
                    <p className="text-[11px] text-surface-600 truncate">
                      {log.user?.name || log.user?.email || 'System'} · {new Date(log.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant={log.status === 'success' ? 'success' : 'danger'} className="shrink-0 text-[10px]">
                    {log.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
