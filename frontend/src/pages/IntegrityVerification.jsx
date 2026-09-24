import { useEffect, useState, useRef } from 'react'
import { ShieldCheck, AlertCircle, Upload, Copy, Check, FileCheck, FileX } from 'lucide-react'
import { assetsAPI } from '../lib/api'
import { Card, CardHeader, CardBody } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import toast from 'react-hot-toast'

export default function IntegrityVerification() {
  const [assets, setAssets] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [copiedField, setCopiedField] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    assetsAPI.getAll().then(r => setAssets(r.data.data.assets || [])).catch(() => {})
  }, [])

  const selectedAsset = assets.find(a => a.id === selectedId)

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
      setResult(null)
    }
  }

  const verify = async () => {
    if (!selectedId) return toast.error('Please select an asset')
    if (!selectedFile) return toast.error('Please select an encrypted file to verify')

    if (!selectedAsset?.file_hash) {
      setResult({
        status: 'FAILED',
        isMatch: false,
        message: 'Selected asset has no stored encrypted-file hash reference.',
        storedHash: 'Not available',
        currentHash: '—'
      })
      return toast.error('Asset has no stored encrypted-file hash')
    }

    setLoading(true)
    try {
      // 1. Read the selected encrypted file bytes directly in the client browser
      const arrayBuffer = await selectedFile.arrayBuffer()

      // 2. Calculate exact SHA-256 hash using Web Crypto API
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', arrayBuffer)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const currentHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toLowerCase()
      const storedHash = selectedAsset.file_hash.trim().toLowerCase()

      // 3. Compare with stored encrypted reference hash
      const isMatch = currentHash === storedHash

      if (isMatch) {
        setResult({
          status: 'VERIFIED',
          isMatch: true,
          message: 'The selected encrypted file matches the stored encrypted asset.',
          storedHash: selectedAsset.file_hash,
          currentHash,
          verifiedAt: new Date().toISOString()
        })
        toast.success('Integrity Verified: Encrypted file matches stored hash')
      } else {
        setResult({
          status: 'TAMPER_DETECTED',
          isMatch: false,
          message: 'The selected encrypted file does not match the stored encrypted asset.',
          storedHash: selectedAsset.file_hash,
          currentHash,
          verifiedAt: new Date().toISOString()
        })
        toast.error('Tamper Detected: Encrypted file hash does not match')
      }
    } catch (err) {
      console.error('Integrity verification error:', err)
      setResult({
        status: 'FAILED',
        isMatch: false,
        message: 'Failed to calculate file hash: ' + (err.message || 'Unknown error'),
        storedHash: selectedAsset.file_hash || 'N/A',
        currentHash: '—'
      })
      toast.error('Hash calculation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-base font-semibold text-surface-100">Integrity Verification</h2>
        <p className="text-sm text-surface-500">
          Verify whether a local copy of an existing asset has been modified
        </p>
      </div>

      <Card>
        <CardBody className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-surface-400 uppercase tracking-wider">
              1. Select Asset
            </label>
            <select
              value={selectedId}
              onChange={e => {
                setSelectedId(e.target.value)
                setResult(null)
              }}
              className="input-field"
            >
              <option value="">Choose an asset...</option>
              {assets.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          {selectedAsset && (
            <div className="p-3 bg-surface-950 rounded-lg border border-surface-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-surface-500">Stored Encrypted File Hash:</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(selectedAsset.file_hash, 'ref_hash')}
                  className="p-1 text-surface-400 hover:text-surface-200"
                  title="Copy stored hash"
                >
                  {copiedField === 'ref_hash' ? (
                    <Check className="w-3.5 h-3.5 text-success" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <p className="text-xs font-mono text-accent-400 break-all select-all">
                {selectedAsset.file_hash}
              </p>
              <div className="flex items-center justify-between pt-1 border-t border-surface-800/60 text-xs">
                <span className="text-surface-500">Blockchain Status:</span>
                <Badge variant={selectedAsset.blockchain_asset_id ? 'success' : 'neutral'}>
                  {selectedAsset.blockchain_asset_id ? 'Registered' : 'Not registered'}
                </Badge>
              </div>
            </div>
          )}

          <div className="space-y-2 pt-2 border-t border-surface-800">
            <label className="block text-xs font-medium text-surface-400 uppercase tracking-wider">
              2. Select Encrypted File to Verify
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
                disabled={!selectedId}
                className="shrink-0"
              >
                <Upload className="w-4 h-4 mr-2 text-surface-400" />
                {selectedFile ? 'Change File' : 'Choose File'}
              </Button>
              <div className="flex-1 px-3 py-2 bg-surface-950 rounded-lg border border-surface-800 text-xs text-surface-400 truncate">
                {selectedFile ? (
                  <span className="text-surface-200 font-mono">
                    {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                  </span>
                ) : (
                  <span className="text-surface-500 italic">No file selected. Choose the encrypted file (.bin).</span>
                )}
              </div>
            </div>
            <p className="text-[11px] text-surface-500">
              Verification is 100% local. Select the encrypted file (.bin) — its SHA-256 is compared to the stored encrypted-file hash.
            </p>
          </div>

          <Button
            variant="primary"
            onClick={verify}
            loading={loading}
            disabled={!selectedId || !selectedFile || loading}
            className="w-full justify-center mt-2"
          >
            <ShieldCheck className="w-4 h-4 mr-2" /> Verify Integrity
          </Button>
        </CardBody>
      </Card>

      {result && (
        <Card
          className={
            result.status === 'VERIFIED'
              ? 'border-success/30 bg-success/5'
              : result.status === 'TAMPER_DETECTED'
              ? 'border-danger/30 bg-danger/5'
              : 'border-warning/30 bg-warning/5'
          }
        >
          <div className="card-header border-b border-surface-800/60 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {result.status === 'VERIFIED' && (
                  <>
                    <div className="w-7 h-7 rounded-full bg-success/20 flex items-center justify-center">
                      <FileCheck className="w-4 h-4 text-success" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-success">
                        ✅ INTEGRITY VERIFIED
                      </span>
                      <p className="text-xs text-surface-300">{result.message}</p>
                    </div>
                  </>
                )}
                {result.status === 'TAMPER_DETECTED' && (
                  <>
                    <div className="w-7 h-7 rounded-full bg-danger/20 flex items-center justify-center">
                      <FileX className="w-4 h-4 text-danger" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-danger">
                        ⚠️ TAMPER DETECTED
                      </span>
                      <p className="text-xs text-surface-300">{result.message}</p>
                    </div>
                  </>
                )}
                {result.status === 'FAILED' && (
                  <>
                    <div className="w-7 h-7 rounded-full bg-warning/20 flex items-center justify-center">
                      <AlertCircle className="w-4 h-4 text-warning" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-warning">
                        ❌ VERIFICATION FAILED
                      </span>
                      <p className="text-xs text-surface-300">{result.message}</p>
                    </div>
                  </>
                )}
              </div>
              <div className="text-right">
                <span className="text-[11px] text-surface-500 block">Hash Match</span>
                <Badge variant={result.isMatch ? 'success' : 'danger'}>
                  {result.isMatch ? 'YES' : 'NO'}
                </Badge>
              </div>
            </div>
          </div>

          <CardBody className="space-y-3 pt-3">
            <div className="p-3 bg-surface-950/80 rounded-lg border border-surface-800">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-surface-400 font-medium">Stored Encrypted Hash:</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(result.storedHash, 'res_reg_hash')}
                  className="p-1 text-surface-400 hover:text-surface-200"
                  title="Copy stored hash"
                >
                  {copiedField === 'res_reg_hash' ? (
                    <Check className="w-3.5 h-3.5 text-success" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <p className="text-xs font-mono text-surface-200 break-all select-all">
                {result.storedHash}
              </p>
            </div>

            <div className="p-3 bg-surface-950/80 rounded-lg border border-surface-800">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-surface-400 font-medium">Current File Hash:</span>
                {result.currentHash && result.currentHash !== '—' && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(result.currentHash, 'res_cur_hash')}
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
                  result.isMatch ? 'text-success' : 'text-danger'
                }`}
              >
                {result.currentHash}
              </p>
            </div>

            {result.verifiedAt && (
              <p className="text-[11px] text-surface-500 text-right">
                Verified at: {new Date(result.verifiedAt).toLocaleString()}
              </p>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  )
}

