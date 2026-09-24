import { useAuth } from '../hooks/useAuth'
import { useWallet } from '../hooks/useWallet'
import { Card, CardBody } from '../components/ui/Card'
import Badge from '../components/ui/Badge'

export default function ProfilePage() {
  const { user } = useAuth()
  const { account } = useWallet()
  const roleVariant = { admin: 'danger', owner: 'accent', authorized_user: 'success', viewer: 'neutral' }

  return (
    <div className="max-w-lg space-y-4">
      <h2 className="text-base font-semibold text-surface-100">Profile</h2>
      <Card>
        <div className="card-header flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-accent-600 flex items-center justify-center text-lg font-bold text-white">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <h3 className="text-base font-semibold text-surface-100">{user?.name}</h3>
            <p className="text-sm text-surface-400">{user?.email}</p>
          </div>
        </div>
        <CardBody className="space-y-4">
          {[
            { label: 'Role', value: <Badge variant={roleVariant[user?.role]}>{user?.role?.replace('_', ' ')}</Badge> },
            { label: 'Wallet Address', value: <span className="text-xs font-mono">{account || user?.wallet_address || 'Not connected'}</span> },
            { label: 'Member Since', value: new Date(user?.created_at).toLocaleDateString() },
            { label: 'Account Status', value: <Badge variant="success">Active</Badge> },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-surface-800 last:border-0">
              <span className="text-sm text-surface-400">{label}</span>
              <span className="text-sm text-surface-200">{value}</span>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  )
}
