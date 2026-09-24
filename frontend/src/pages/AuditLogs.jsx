import { useEffect, useState } from 'react'
import { ScrollText } from 'lucide-react'
import { auditAPI } from '../lib/api'
import { Card } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'

const ACTION_LABELS = {
  ASSET_UPLOADED: 'Asset Uploaded', ACCESS_GRANTED: 'Access Granted',
  ACCESS_REVOKED: 'Access Revoked', ACCESS_REQUESTED: 'Access Requested',
  INTEGRITY_VERIFIED: 'Integrity Verified', USER_LOGIN: 'User Login',
  USER_REGISTERED: 'User Registered', WALLET_CONNECTED: 'Wallet Connected'
}
const ACTION_VARIANTS = {
  ASSET_UPLOADED: 'success', ACCESS_GRANTED: 'accent', ACCESS_REVOKED: 'danger',
  ACCESS_REQUESTED: 'warning', INTEGRITY_VERIFIED: 'info'
}

export default function AuditLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    auditAPI.getAll({ limit: 100 }).then(r => setLogs(r.data.data.logs || [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const filtered = filter ? logs.filter(l => l.action === filter) : logs
  const uniqueActions = [...new Set(logs.map(l => l.action))]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-surface-100">Audit Logs</h2>
          <p className="text-sm text-surface-500">{filtered.length} security events</p>
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)}
          className="input-field w-48">
          <option value="">All Actions</option>
          {uniqueActions.map(a => <option key={a} value={a}>{ACTION_LABELS[a] || a}</option>)}
        </select>
      </div>

      <Card>
        {loading ? <div className="p-6 text-sm text-surface-500">Loading...</div>
          : filtered.length === 0 ? <EmptyState icon={ScrollText} title="No audit logs" description="Security events will appear here." />
          : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-surface-800">
                  {['Action', 'Asset', 'User', 'Timestamp', 'Tx Hash', 'Status'].map(h => (
                    <th key={h} className="px-4 py-3 text-left table-header">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-surface-800">
                  {filtered.map(log => (
                    <tr key={log.id} className="hover:bg-surface-800/50">
                      <td className="table-cell">
                        <Badge variant={ACTION_VARIANTS[log.action] || 'neutral'}>
                          {ACTION_LABELS[log.action] || log.action}
                        </Badge>
                      </td>
                      <td className="table-cell text-xs">{log.asset?.name || '—'}</td>
                      <td className="table-cell text-xs">{log.user?.name || '—'}</td>
                      <td className="table-cell text-xs">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="table-cell">
                        {log.transaction_hash
                          ? <span className="font-mono text-xs text-surface-500">{log.transaction_hash.slice(0, 12)}...</span>
                          : <span className="text-xs text-surface-700">—</span>}
                      </td>
                      <td className="table-cell">
                        <Badge variant={log.status === 'success' ? 'success' : log.status === 'failed' ? 'danger' : 'warning'}>
                          {log.status}
                        </Badge>
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
