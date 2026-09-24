import { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import {
  ShieldCheck,
  ExternalLink,
  Shield,
  Clock,
  User,
  AlertCircle,
  Copy,
  Check,
  Upload,
  FileCheck,
  FileX
} from 'lucide-react'
import { assetsAPI } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { Card, CardHeader, CardBody } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import toast from 'react-hot-toast'

export default function AssetDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [asset, setAsset] = useState(null)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  // Local Integrity Verification State
  const [selectedFile, setSelectedFile] = useState(null)
  const [verifying, setVerifying] = useState(false)
  const [verifyResult, setVerifyResult] = useState(null)
  const [copiedField, setCopiedField] = useState(null)
  const fileInputRef = useRef(null)

  const [grantModal, setGrantModal] = useState(false)
  const [grantEmail, setGrantEmail] = useState('')
  const [allUsers, setAllUsers] = useState([])

  useEffect(() => {
    Promise.all([
      assetsAPI.getById(id),
      assetsAPI.getAuditLogs(id)
    ]).then(([ar, lr]) => {
      setAsset(ar.data.data.asset)
      setLogs(lr.data.data.logs || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [id])

  const copyToClipboard = (text, fieldName) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedField(fieldName)
    toast.success('Copied to clipboard')
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setVerifyResult(null)
    }
  }

  const handleVerifyIntegrity = async () => {
    if (!selectedFile) {
      toast.error('Please select a file to verify')
      return
    }

    if (!asset?.file_hash) {
      setVerifyResult({
        status: 'FAILED',
        isMatch: false,
        message: 'Asset has no registered reference SHA-256 hash.',
        registeredHash: 'Not available',
        currentHash: '—'
      })
      toast.error('Asset has no registered reference hash')
      return
    }

    setVerifying(true)
    try {
      // 1. Read the selected file bytes directly in the client browser
      const arrayBuffer = await selectedFile.arrayBuffer()

      // 2. Calculate exact SHA-256 hash of the selected file bytes using Web Crypto API
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', arrayBuffer)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const currentHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toLowerCase()
      const registeredHash = asset.file_hash.trim().toLowerCase()

      // 3. Compare with the original registered reference hash
      const isMatch = currentHash === registeredHash

      if (isMatch) {
        setVerifyResult({
          status: 'VERIFIED',
          isMatch: true,
          message: 'The selected file matches the original registered asset.',
          registeredHash: asset.file_hash,
          currentHash,
          verifiedAt: new Date().toISOString()
        })
        toast.success('Integrity Verified: File matches registered asset')
      } else {
        setVerifyResult({
          status: 'TAMPER_DETECTED',
          isMatch: false,
          message: 'The selected file does not match the original registered asset.',
          registeredHash: asset.file_hash,
          currentHash,
          verifiedAt: new Date().toISOString()
        })
        toast.error('Tamper Detected: Hashes do not match')
      }
    } catch (err) {
      console.error('Integrity hash calculation error:', err)
      setVerifyResult({
        status: 'FAILED',
        isMatch: false,
        message: 'Failed to calculate file hash: ' + (err.message || 'Unknown error'),
        registeredHash: asset.file_hash || 'N/A',
        currentHash: '—'
      })
      toast.error('Failed to calculate file hash')
    } finally {
      setVerifying(false)
    }
  }

  const handleRequestAccess = async () => {
    try {
      await assetsAPI.requestAccess(id, '')
      toast.success('Access request submitted')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Request failed')
    }
  }

  if (loading) return <div className="text-sm text-surface-500">Loading asset details...</div>
  if (!asset) return <div className="text-sm text-danger">Asset not found</div>

  const isOwner = user?.id === asset.owner_id
  const isAdmin = user?.role === 'admin'

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-surface-100">{asset.name}</h2>
          <p className="text-sm text-surface-500">{asset.description || 'No description provided'}</p>
        </div>
        <div className="flex gap-2">
          {!isOwner && !isAdmin && (
            <Button variant="secondary" onClick={handleRequestAccess}>
              Request Access
            </Button>
          )}
        </div>
      </div>

      {/* Main Integrity Verification Card */}
      <Card className="border-surface-700 bg-surface-900/50">
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent-500/10 flex items-center justify-center text-accent-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-surface-100">Integrity Verification</h3>
              <p className="text-xs text-surface-400">
                Verify whether a local copy of this asset has been modified
              </p>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-5">
          {/* Reference Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 p-3.5 bg-surface-950/60 rounded-lg border border-surface-800">
            <div>
              <p className="text-xs text-surface-500 mb-0.5">Asset Name</p>
              <p className="text-xs font-semibold text-surface-200 truncate">{asset.name}</p>
            </div>

            <div className="sm:col-span-2">
              <p className="text-xs text-surface-500 mb-0.5">Original / Registered SHA-256 Hash</p>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono text-accent-400 break-all select-all">
                  {asset.file_hash}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(asset.file_hash, 'ref_hash')}
                  className="p-1 text-surface-400 hover:text-surface-200 shrink-0 transition-colors"
                  title="Copy reference hash"
                >
                  {copiedField === 'ref_hash' ? (
                    <Check className="w-3.5 h-3.5 text-success" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <p className="text-xs text-surface-500 mb-0.5">Blockchain Status</p>
              <div className="mt-0.5">
                {asset.blockchain_asset_id ? (
                  <Badge variant="success">Registered</Badge>
                ) : (
                  <Badge variant="neutral">Not registered</Badge>
                )}
              </div>
            </div>

            {asset.ipfs_cid && (
              <div className="sm:col-span-4 border-t border-surface-800/60 pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-xs text-surface-500">IPFS Reference CID:</span>
                <span className="text-xs font-mono text-surface-400 break-all">{asset.ipfs_cid}</span>
              </div>
            )}
          </div>

          {/* File Picker & Action */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-surface-300">
              Select File to Verify
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                className="shrink-0"
              >
                <Upload className="w-4 h-4 mr-2 text-surface-400" />
                {selectedFile ? 'Change File' : 'Choose File'}
              </Button>

              <div className="flex-1 px-3.5 py-2 bg-surface-950 rounded-lg border border-surface-800 text-xs text-surface-400 truncate flex items-center justify-between">
                {selectedFile ? (
                  <span className="text-surface-200 font-mono truncate">
                    {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                  </span>
                ) : (
                  <span className="text-surface-500 italic">No file selected. Choose a local file to compare with the registered hash.</span>
                )}
              </div>

              <Button
                type="button"
                variant="primary"
                onClick={handleVerifyIntegrity}
                loading={verifying}
                disabled={!selectedFile || verifying}
                className="shrink-0"
              >
                <ShieldCheck className="w-4 h-4 mr-1.5" />
                Verify Integrity
              </Button>
            </div>
            <p className="text-[11px] text-surface-500">
              File stays 100% local in your browser. Exact bytes are hashed with SHA-256 and compared to the registered reference.
            </p>
          </div>

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
              {/* Header Status Badge */}
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-surface-800/60">
                <div className="flex items-center gap-2.5">
                  {verifyResult.status === 'VERIFIED' && (
                    <>
                      <div className="w-7 h-7 rounded-full bg-success/20 flex items-center justify-center">
                        <FileCheck className="w-4 h-4 text-success" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-success tracking-wide">
                          ✅ INTEGRITY VERIFIED
                        </span>
                        <p className="text-xs text-surface-300 mt-0.5">{verifyResult.message}</p>
                      </div>
                    </>
                  )}

                  {verifyResult.status === 'TAMPER_DETECTED' && (
                    <>
                      <div className="w-7 h-7 rounded-full bg-danger/20 flex items-center justify-center">
                        <FileX className="w-4 h-4 text-danger" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-danger tracking-wide">
                          ⚠️ TAMPER DETECTED
                        </span>
                        <p className="text-xs text-surface-300 mt-0.5">{verifyResult.message}</p>
                      </div>
                    </>
                  )}

                  {verifyResult.status === 'FAILED' && (
                    <>
                      <div className="w-7 h-7 rounded-full bg-warning/20 flex items-center justify-center">
                        <AlertCircle className="w-4 h-4 text-warning" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-warning tracking-wide">
                          ❌ VERIFICATION FAILED
                        </span>
                        <p className="text-xs text-surface-300 mt-0.5">{verifyResult.message}</p>
                      </div>
                    </>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-surface-500 block">Hash Match</span>
                  <Badge variant={verifyResult.isMatch ? 'success' : 'danger'}>
                    {verifyResult.isMatch ? 'YES' : 'NO'}
                  </Badge>
                </div>
              </div>

              {/* Hash Details Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 bg-surface-950/80 rounded-lg border border-surface-800/80">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-surface-400">Registered Hash:</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(verifyResult.registeredHash, 'res_reg_hash')}
                      className="p-1 text-surface-400 hover:text-surface-200"
                      title="Copy registered hash"
                    >
                      {copiedField === 'res_reg_hash' ? (
                        <Check className="w-3.5 h-3.5 text-success" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs font-mono text-surface-200 break-all select-all">
                    {verifyResult.registeredHash}
                  </p>
                </div>

                <div className="p-3 bg-surface-950/80 rounded-lg border border-surface-800/80">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-surface-400">Current File Hash:</span>
                    {verifyResult.currentHash && verifyResult.currentHash !== '—' && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(verifyResult.currentHash, 'res_cur_hash')}
                        className="p-1 text-surface-400 hover:text-surface-200"
                        title="Copy current file hash"
                      >
                        {copiedField === 'res_cur_hash' ? (
                          <Check className="w-3.5 h-3.5 text-success" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                  <p
                    className={`text-xs font-mono break-all select-all ${
                      verifyResult.isMatch
                        ? 'text-success'
                        : verifyResult.status === 'TAMPER_DETECTED'
                        ? 'text-danger'
                        : 'text-surface-400'
                    }`}
                  >
                    {verifyResult.currentHash}
                  </p>
                </div>
              </div>

              {verifyResult.verifiedAt && (
                <p className="text-[11px] text-surface-500 mt-2 text-right">
                  Verified at: {new Date(verifyResult.verifiedAt).toLocaleString()}
                </p>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><h3 className="text-sm font-semibold text-surface-200">Security Status</h3></CardHeader>
          <CardBody className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-surface-500">Encryption</span>
              <Badge variant="success">AES-256 Encrypted</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-surface-500">IPFS Storage</span>
              <Badge variant={asset.ipfs_cid ? 'accent' : 'neutral'}>{asset.ipfs_cid ? 'Stored' : 'Not stored'}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-surface-500">Blockchain</span>
              <Badge variant={asset.blockchain_asset_id ? 'success' : 'neutral'}>{asset.blockchain_asset_id ? 'Registered' : 'Not registered'}</Badge>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><h3 className="text-sm font-semibold text-surface-200">Asset Information</h3></CardHeader>
          <CardBody className="space-y-3">
            <div>
              <p className="text-xs text-surface-500">Owner</p>
              <p className="text-sm text-surface-200">{asset.owner?.name || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-xs text-surface-500">Created</p>
              <p className="text-sm text-surface-200">{new Date(asset.created_at).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-surface-500">File Hash (SHA-256)</p>
              <p className="text-xs font-mono text-surface-400 break-all">{asset.file_hash}</p>
            </div>
          </CardBody>
        </Card>

        {asset.ipfs_cid && (
          <Card>
            <CardHeader><h3 className="text-sm font-semibold text-surface-200">Storage Information</h3></CardHeader>
            <CardBody className="space-y-3">
              <div>
                <p className="text-xs text-surface-500">IPFS CID</p>
                <a href={`https://gateway.pinata.cloud/ipfs/${asset.ipfs_cid}`} target="_blank" rel="noreferrer"
                  className="text-xs font-mono text-accent-400 hover:text-accent-300 flex items-center gap-1 break-all">
                  {asset.ipfs_cid} <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              </div>
            </CardBody>
          </Card>
        )}

        {asset.blockchain_asset_id && (
          <Card>
            <CardHeader><h3 className="text-sm font-semibold text-surface-200">Blockchain Details</h3></CardHeader>
            <CardBody className="space-y-3">
              <div>
                <p className="text-xs text-surface-500">Transaction Hash</p>
                <p className="text-xs font-mono text-accent-400 break-all">{asset.blockchain_asset_id}</p>
              </div>
              <div>
                <p className="text-xs text-surface-500">Contract Address</p>
                <p className="text-xs font-mono text-surface-300 break-all">{import.meta.env.VITE_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3'}</p>
              </div>
              <div>
                <p className="text-xs text-surface-500">Network</p>
                <p className="text-xs text-surface-300">Localhost (Chain ID: 31337)</p>
              </div>
            </CardBody>
          </Card>
        )}

        {(isOwner || isAdmin) && (
          <Card>
            <CardHeader><h3 className="text-sm font-semibold text-surface-200">Audit History</h3></CardHeader>
            <div className="divide-y divide-surface-800 max-h-48 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="p-4 text-xs text-surface-500">No audit entries</div>
              ) : logs.map(log => (
                <div key={log.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent-400 shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-surface-300">{log.action?.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-surface-600">{new Date(log.timestamp).toLocaleString()}</p>
                  </div>
                  {log.status && <Badge variant={log.status === 'success' ? 'success' : 'danger'}>{log.status}</Badge>}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
