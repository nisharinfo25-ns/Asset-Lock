import { Menu, Bell, Wallet } from 'lucide-react'
import { useWallet } from '../../hooks/useWallet'
import Button from '../ui/Button'

export default function Topbar({ title, onMenuClick }) {
  const { account, shortAddress, connectWallet, isConnecting } = useWallet()

  return (
    <header className="h-14 bg-surface-900 border-b border-surface-800 flex items-center px-4 gap-4">
      <button onClick={onMenuClick} className="lg:hidden text-surface-400 hover:text-surface-100">
        <Menu className="w-5 h-5" />
      </button>
      <h1 className="text-sm font-semibold text-surface-100 flex-1">{title}</h1>
      <div className="flex items-center gap-3">
        {account ? (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-success/10 border border-success/20 rounded-md">
            <span className="w-1.5 h-1.5 rounded-full bg-success" />
            <span className="text-xs font-mono text-success">{shortAddress}</span>
          </div>
        ) : (
          <Button variant="secondary" size="sm" onClick={connectWallet} loading={isConnecting}>
            <Wallet className="w-3.5 h-3.5" />
            Connect Wallet
          </Button>
        )}
        <button className="text-surface-400 hover:text-surface-100 relative">
          <Bell className="w-5 h-5" />
        </button>
      </div>
    </header>
  )
}
