import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Files, Share2, ShieldCheck, Clock, ArrowRight, Upload } from 'lucide-react'
import { assetsAPI, requestsAPI, auditAPI } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { Card, CardBody } from '../components/ui/Card'
import Badge from '../components/ui/Badge'

function StatCard({ icon: Icon, label, value, color = 'accent', to }) {
  const colors = { accent: 'text-accent-400 bg-accent-500/10', success: 'text-success bg-success/10', warning: 'text-warning bg-warning/10', info: 'text-info bg-info/10' }
  const content = (
    <div className="card p-5 hover:border-surface-700 transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-surface-500 uppercase tracking-wider mb-1">{label}</p>
          <p className="text-2xl font-bold text-surface-100">{value ?? '—'}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  )
  return to ? <Link to={to}>{content}</Link> : content
}

export default function Dashboard() {
  const { user } = useAuth()
  const [assets, setAssets] = useState([])
  const [shared, setShared] = useState([])
  const [requests, setRequests] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [a, s, r, l] = await Promise.allSettled([
          assetsAPI.getAll(), assetsAPI.getShared(), requestsAPI.getAll(), auditAPI.getAll({ limit: 5 })
        ])
        if (a.status === 'fulfilled') setAssets(a.value.data.data.assets || [])
        if (s.status === 'fulfilled') setShared(s.value.data.data.shared || [])
        if (r.status === 'fulfilled') setRequests(r.value.data.data.requests || [])
        if (l.status === 'fulfilled') setLogs(l.value.data.data.logs || [])
      } catch {} finally { setLoading(false) }
    }
    load()
  }, [])

  const pendingRequests = requests.filter(r => r.status === 'pending')

  const actionColors = {
    ASSET_UPLOADED: 'success', ACCESS_GRANTED: 'accent', ACCESS_REVOKED: 'danger',
    ACCESS_REQUESTED: 'warning', INTEGRITY_VERIFIED: 'info', USER_LOGIN: 'neutral'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-surface-100">Welcome back, {user?.name?.split(' ')[0]}</h2>
          <p className="text-sm text-surface-500">Here's your security overview</p>
        </div>
        <Link to="/app/assets/upload" className="btn-primary flex items-center gap-2">
          <Upload className="w-4 h-4" /> Upload Asset
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Files} label="Total Assets" value={assets.length} to="/app/assets" />
        <StatCard icon={Share2} label="Shared Assets" value={shared.length} color="success" to="/app/shared" />
        <StatCard icon={Clock} label="Pending Requests" value={pendingRequests.length} color="warning" to="/app/requests" />
        <StatCard icon={ShieldCheck} label="Audit Events" value={logs.length} color="info" to="/app/audit" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <div className="card-header flex items-center justify-between">
            <h3 className="text-sm font-semibold text-surface-200">Recent Activity</h3>
            <Link to="/app/audit" className="text-xs text-accent-400 hover:text-accent-300 flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></Link>
          </div>
          <div className="divide-y divide-surface-800">
            {loading ? (
              <div className="p-6 text-center text-sm text-surface-500">Loading...</div>
            ) : logs.length === 0 ? (
              <div className="p-6 text-center text-sm text-surface-500">No activity yet</div>
            ) : logs.map(log => (
              <div key={log.id} className="px-6 py-3 flex items-center gap-3">
                <Badge variant={actionColors[log.action] || 'neutral'} className="shrink-0">
                  {log.action?.replace(/_/g, ' ')}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-surface-400 truncate">{log.asset?.name || 'System'}</p>
                </div>
                <span className="text-xs text-surface-600 shrink-0">
                  {new Date(log.timestamp).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Access */}
        <Card>
          <div className="card-header">
            <h3 className="text-sm font-semibold text-surface-200">Quick Actions</h3>
          </div>
          <CardBody className="space-y-3">
            {[
              { to: '/app/assets/upload', icon: Upload, label: 'Upload New Asset', desc: 'Encrypt and store a secure file' },
              { to: '/app/requests', icon: Clock, label: 'Access Requests', desc: `${pendingRequests.length} pending approval` },
              { to: '/app/integrity', icon: ShieldCheck, label: 'Verify Integrity', desc: 'Check blockchain hash match' },
              { to: '/app/audit', icon: Files, label: 'Audit Logs', desc: 'Review security events' },
            ].map(({ to, icon: Icon, label, desc }) => (
              <Link key={to} to={to} className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-800 transition-colors group">
                <div className="w-8 h-8 bg-surface-800 group-hover:bg-surface-700 rounded-lg flex items-center justify-center">
                  <Icon className="w-4 h-4 text-surface-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-surface-200">{label}</p>
                  <p className="text-xs text-surface-500">{desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-surface-600 ml-auto" />
              </Link>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
