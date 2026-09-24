import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Clock } from 'lucide-react'
import { requestsAPI } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { Card } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import toast from 'react-hot-toast'

export default function AccessRequests() {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [responding, setResponding] = useState({})

  const load = () => {
    requestsAPI.getAll().then(r => setRequests(r.data.data.requests || [])).catch(() => {}).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const respond = async (id, action) => {
    setResponding(p => ({ ...p, [id]: action }))
    try {
      await requestsAPI.respond(id, action)
      toast.success(`Request ${action}d`)
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed')
    } finally {
      setResponding(p => ({ ...p, [id]: null }))
    }
  }

  const incoming = requests.filter(r => r.owner_id === user?.id)
  const outgoing = requests.filter(r => r.requester_id === user?.id)

  const statusVariant = { pending: 'warning', approved: 'success', rejected: 'danger' }

  const RequestTable = ({ items, showActions }) => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead><tr className="border-b border-surface-800">
          {['Asset', showActions ? 'Requester' : 'Owner', 'Date', 'Status', ...(showActions ? ['Actions'] : [])].map(h => (
            <th key={h} className="px-4 py-3 text-left table-header">{h}</th>
          ))}
        </tr></thead>
        <tbody className="divide-y divide-surface-800">
          {items.map(r => (
            <tr key={r.id} className="hover:bg-surface-800/50 transition-colors">
              <td className="table-cell font-medium text-surface-200">{r.asset?.name}</td>
              <td className="table-cell">{showActions ? r.requester?.name : r.owner?.name}</td>
              <td className="table-cell text-xs">{new Date(r.requested_at).toLocaleDateString()}</td>
              <td className="table-cell"><Badge variant={statusVariant[r.status]}>{r.status}</Badge></td>
              {showActions && (
                <td className="table-cell">
                  {r.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="success" loading={responding[r.id] === 'approve'} onClick={() => respond(r.id, 'approve')}>
                        <CheckCircle className="w-3.5 h-3.5" />Approve
                      </Button>
                      <Button size="sm" variant="danger" loading={responding[r.id] === 'reject'} onClick={() => respond(r.id, 'reject')}>
                        <XCircle className="w-3.5 h-3.5" />Reject
                      </Button>
                    </div>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="space-y-6">
      <Card>
        <div className="card-header"><h3 className="text-sm font-semibold text-surface-200">Incoming Requests</h3></div>
        {loading ? <div className="p-6 text-sm text-surface-500">Loading...</div>
          : incoming.length === 0 ? <EmptyState icon={Clock} title="No incoming requests" />
          : <RequestTable items={incoming} showActions={true} />}
      </Card>

      <Card>
        <div className="card-header"><h3 className="text-sm font-semibold text-surface-200">Outgoing Requests</h3></div>
        {loading ? <div className="p-6 text-sm text-surface-500">Loading...</div>
          : outgoing.length === 0 ? <EmptyState icon={Clock} title="No outgoing requests" />
          : <RequestTable items={outgoing} showActions={false} />}
      </Card>
    </div>
  )
}
