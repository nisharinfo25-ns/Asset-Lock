import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Upload, Files, ExternalLink, Eye } from 'lucide-react'
import { assetsAPI } from '../lib/api'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import { Card } from '../components/ui/Card'

export default function MyAssets() {
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    assetsAPI.getAll().then(r => setAssets(r.data.data.assets || [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-surface-100">My Assets</h2>
          <p className="text-sm text-surface-500">{assets.length} asset{assets.length !== 1 ? 's' : ''} in your vault</p>
        </div>
        <Link to="/app/assets/upload"><Button variant="primary"><Upload className="w-4 h-4" />Upload Asset</Button></Link>
      </div>

      <Card>
        {loading ? (
          <div className="p-12 text-center text-sm text-surface-500">Loading assets...</div>
        ) : assets.length === 0 ? (
          <EmptyState icon={Files} title="No assets yet" description="Upload your first secure asset to get started."
            action={<Link to="/app/assets/upload"><Button variant="primary"><Upload className="w-4 h-4" />Upload Asset</Button></Link>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-800">
                  {['Asset', 'Hash', 'IPFS CID', 'Status', 'Created', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left table-header">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-800">
                {assets.map(asset => (
                  <tr key={asset.id} className="hover:bg-surface-800/50 transition-colors">
                    <td className="table-cell">
                      <div>
                        <p className="font-medium text-surface-200">{asset.name}</p>
                        <p className="text-xs text-surface-500">{asset.encrypted_file_metadata?.originalName || 'Unknown file'}</p>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="font-mono text-xs text-surface-400">{asset.file_hash?.slice(0, 16)}...</span>
                    </td>
                    <td className="table-cell">
                      {asset.ipfs_cid ? (
                        <a href={`https://gateway.pinata.cloud/ipfs/${asset.ipfs_cid}`} target="_blank" rel="noreferrer"
                          className="font-mono text-xs text-accent-400 hover:text-accent-300 flex items-center gap-1">
                          {asset.ipfs_cid.slice(0, 12)}... <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : <span className="text-xs text-surface-600">—</span>}
                    </td>
                    <td className="table-cell">
                      <div className="flex flex-col gap-1">
                        <Badge variant="success">Encrypted</Badge>
                        {asset.ipfs_cid && <Badge variant="accent">IPFS Stored</Badge>}
                      </div>
                    </td>
                    <td className="table-cell text-xs">{new Date(asset.created_at).toLocaleDateString()}</td>
                    <td className="table-cell">
                      <Link to={`/app/assets/${asset.id}`}>
                        <Button variant="secondary" size="sm"><Eye className="w-3.5 h-3.5" />View</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
