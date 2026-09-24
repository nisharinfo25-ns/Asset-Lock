import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Share2, Eye } from 'lucide-react'
import { assetsAPI } from '../lib/api'
import { Card } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'

export default function SharedAssets() {
  const [shared, setShared] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    assetsAPI.getShared().then(r => setShared(r.data.data.shared || [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-surface-100">Shared Assets</h2>
        <p className="text-sm text-surface-500">Assets shared with you by other users</p>
      </div>
      <Card>
        {loading ? <div className="p-6 text-sm text-surface-500">Loading...</div>
          : shared.length === 0 ? <EmptyState icon={Share2} title="No shared assets" description="Assets shared with you will appear here." />
          : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-surface-800">
                  {['Asset', 'Owner', 'Permission', 'Granted', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left table-header">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-surface-800">
                  {shared.map(item => (
                    <tr key={item.id} className="hover:bg-surface-800/50 transition-colors">
                      <td className="table-cell font-medium text-surface-200">{item.asset?.name}</td>
                      <td className="table-cell">{item.asset?.owner?.name}</td>
                      <td className="table-cell"><Badge variant="accent">{item.permission}</Badge></td>
                      <td className="table-cell text-xs">{new Date(item.granted_at).toLocaleDateString()}</td>
                      <td className="table-cell"><Badge variant={item.status === 'active' ? 'success' : 'danger'}>{item.status}</Badge></td>
                      <td className="table-cell">
                        <Link to={`/app/assets/${item.asset?.id}`}>
                          <Button size="sm" variant="secondary"><Eye className="w-3.5 h-3.5" />View</Button>
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
