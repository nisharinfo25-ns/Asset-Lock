import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ShieldCheck, ExternalLink, Shield, Clock, User, AlertCircle } from 'lucide-react'
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
  const [verifying, setVerifying] = useState(false)
  const [verifyResult, setVerifyResult] = useState(null)
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

  const handleVerify = async () => {
    setVerifying(true)
    try {
      const res = await assetsAPI.verifyIntegrity(id)
      setVerifyResult(res.data.data.verification)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Verification failed')
    } finally {
      setVerifying(false) }
  }

  const handleRequestAccess = async () => {
    try {
      await assetsAPI.requestAccess(id, '')
      toast.success('Access request submitted')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Request failed')
    }
  }

  if (loading) return <div className="text-sm text-surface-500">Loading...</div>
  if (!asset) return <div className="text-sm text-danger">Asset not found</div>

  const isOwner = user?.id === asset.owner_id
  const isAdmin = user?.role === 'admin'

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-surface-100">{asset.name}</h2>
          <p className="text-sm text-surface-500">{asset.description}</p>
        </div>
        <div className="flex gap-2">
          {!isOwner && !isAdmin && (
            <Button variant="secondary" onClick={handleRequestAccess}>Request Access</Button>
          )}
          <Button variant="secondary" onClick={handleVerify} loading={verifying}>
            <ShieldCheck className="w-4 h-4" /> Verify Integrity
          </Button>
        </div>
      </div>

      {verifyResult && (
        <div className={`p-4 rounded-lg border ${
          verifyResult.isMatch ? 'bg-success/5 border-success/20' : 'bg-danger/5 border-danger/20'
        }`}>
          <div className="flex items-center gap-2 mb-3">
            {verifyResult.isMatch
              ? <><ShieldCheck className="w-5 h-5 text-success" /><span className="text-sm font-medium text-success">Integrity Verified</span></>
              : <><AlertCircle className="w-5 h-5 text-danger" /><span className="text-sm font-medium text-danger">Warning: Possible Unauthorized Modification</span></>}
          </div>
          <div className="space-y-1">
            <p className="text-xs text-surface-500">Blockchain Hash: <span className="font-mono text-surface-300">{verifyResult.blockchainHash || verifyResult.storedHash}</span></p>
            {verifyResult.currentHash && <p className="text-xs text-surface-500">Current Hash: <span className="font-mono text-surface-300">{verifyResult.currentHash}</span></p>}
            <p className="text-xs text-surface-500">Verified at: {new Date(verifyResult.verifiedAt).toLocaleString()}</p>
          </div>
        </div>
      )}

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
