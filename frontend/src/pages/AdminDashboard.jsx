import { useEffect, useState } from 'react'
import { Users, Files, Shield, Clock } from 'lucide-react'
import { usersAPI, assetsAPI, requestsAPI, auditAPI } from '../lib/api'
import { Card } from '../components/ui/Card'
import Badge from '../components/ui/Badge'

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-surface-500 uppercase tracking-wider mb-1">{label}</p>
          <p className="text-2xl font-bold text-surface-100">{value ?? '—'}</p>
        </div>
        <div className="w-10 h-10 bg-accent-500/10 rounded-lg flex items-center justify-center">
          <Icon className="w-5 h-5 text-accent-400" />
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [users, setUsers] = useState([])
  const [assets, setAssets] = useState([])
  const [requests, setRequests] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-surface-100">Admin Dashboard</h2>
        <p className="text-sm text-surface-500">System-wide security overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value={users.length} />
        <StatCard icon={Files} label="Total Assets" value={assets.length} />
        <StatCard icon={Clock} label="Access Requests" value={requests.length} />
        <StatCard icon={Shield} label="Audit Events" value={logs.length} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="card-header"><h3 className="text-sm font-semibold text-surface-200">Recent Users</h3></div>
          <div className="divide-y divide-surface-800">
            {loading ? <div className="p-4 text-sm text-surface-500">Loading...</div>
              : users.slice(0, 8).map(u => (
              <div key={u.id} className="px-4 py-3 flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-surface-700 flex items-center justify-center text-xs font-bold text-surface-300">
                  {u.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-surface-200 truncate">{u.name}</p>
                  <p className="text-xs text-surface-500 truncate">{u.email}</p>
                </div>
                <Badge variant={u.role === 'admin' ? 'danger' : 'neutral'} className="shrink-0">{u.role}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="card-header"><h3 className="text-sm font-semibold text-surface-200">Security Events</h3></div>
          <div className="divide-y divide-surface-800">
            {loading ? <div className="p-4 text-sm text-surface-500">Loading...</div>
              : logs.slice(0, 8).map(log => (
              <div key={log.id} className="px-4 py-3 flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-accent-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-surface-300">{log.action?.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-surface-600">{log.user?.name} · {new Date(log.timestamp).toLocaleString()}</p>
                </div>
                <Badge variant={log.status === 'success' ? 'success' : 'danger'}>{log.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
