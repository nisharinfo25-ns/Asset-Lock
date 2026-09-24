import { useEffect, useState } from 'react'
import { ShieldCheck, AlertCircle } from 'lucide-react'
import { assetsAPI } from '../lib/api'
import { Card, CardBody } from '../components/ui/Card'
import Button from '../components/ui/Button'
import toast from 'react-hot-toast'

export default function IntegrityVerification() {
  const [assets, setAssets] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    assetsAPI.getAll().then(r => setAssets(r.data.data.assets || [])).catch(() => {})
  }, [])

  const verify = async () => {
    if (!selectedId) return toast.error('Please select an asset')
    setLoading(true)
    setResult(null)
    try {
      const res = await assetsAPI.verifyIntegrity(selectedId)
      setResult(res.data.data.verification)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Verification failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h2 className="text-base font-semibold text-surface-100">Integrity Verification</h2>
        <p className="text-sm text-surface-500">Compare stored file hash against blockchain record</p>
      </div>

      <Card>
        <CardBody className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-surface-400 uppercase tracking-wider">Select Asset</label>
            <select value={selectedId} onChange={e => { setSelectedId(e.target.value); setResult(null) }}
              className="input-field">
              <option value="">Choose an asset...</option>
              {assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <Button variant="primary" onClick={verify} loading={loading} disabled={!selectedId} className="w-full justify-center">
            <ShieldCheck className="w-4 h-4" /> Verify Integrity
          </Button>
        </CardBody>
      </Card>

      {result && (
        <Card className={result.isMatch === false ? 'border-danger/30' : result.isMatch ? 'border-success/30' : ''}>
          <div className="card-header">
            <div className="flex items-center gap-2">
              {result.isMatch === true && <><ShieldCheck className="w-5 h-5 text-success" /><span className="text-sm font-semibold text-success">INTEGRITY VERIFIED</span></>}
              {result.isMatch === false && <><AlertCircle className="w-5 h-5 text-danger" /><span className="text-sm font-semibold text-danger">POSSIBLE MODIFICATION DETECTED</span></>}
              {result.isMatch === null && <><ShieldCheck className="w-5 h-5 text-surface-400" /><span className="text-sm font-semibold text-surface-300">VERIFICATION COMPLETE</span></>}
            </div>
          </div>
          <CardBody className="space-y-3">
            <div className="p-3 bg-surface-800 rounded-lg">
              <p className="text-xs text-surface-500 mb-1">Stored Hash</p>
              <p className="text-xs font-mono text-surface-300 break-all">{result.blockchainHash || result.storedHash}</p>
            </div>
            {result.currentHash && (
              <div className="p-3 bg-surface-800 rounded-lg">
                <p className="text-xs text-surface-500 mb-1">Current File Hash</p>
                <p className="text-xs font-mono text-surface-300 break-all">{result.currentHash}</p>
              </div>
            )}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-surface-500">Source</span>
              <span className="text-xs text-surface-300 capitalize">{result.source}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-surface-500">Verified at</span>
              <span className="text-xs text-surface-300">{new Date(result.verifiedAt).toLocaleString()}</span>
            </div>
            {result.error && <p className="text-xs text-warning">{result.error}</p>}
          </CardBody>
        </Card>
      )}
    </div>
  )
}
