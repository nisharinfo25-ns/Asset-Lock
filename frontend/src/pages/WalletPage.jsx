import { Wallet, Link as LinkIcon, Unlink } from 'lucide-react'
import { useWallet } from '../hooks/useWallet'
import { Card, CardBody } from '../components/ui/Card'
import Button from '../components/ui/Button'
import StatusIndicator from '../components/ui/StatusIndicator'

export default function WalletPage() {
  const { account, network, shortAddress, connectWallet, disconnectWallet, isConnecting } = useWallet()
  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS

  return (
    <div className="max-w-lg space-y-4">
      <div>
        <h2 className="text-base font-semibold text-surface-100">Wallet</h2>
        <p className="text-sm text-surface-500">Connect your MetaMask wallet to sign blockchain transactions</p>
      </div>

      <Card>
        <div className="card-header"><h3 className="text-sm font-semibold text-surface-200">Connection Status</h3></div>
        <CardBody className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-surface-400">Status</span>
            <StatusIndicator status={account ? 'active' : 'inactive'} label={account ? 'Connected' : 'Disconnected'} />
          </div>
          {account && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-surface-400">Address</span>
                <span className="text-xs font-mono text-surface-200">{shortAddress}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-surface-400">Network</span>
                <span className="text-xs text-surface-300">{network?.name || `Chain ${network?.chainId}`}</span>
              </div>
            </>
          )}
          {contractAddress && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-surface-400">Contract</span>
              <span className="text-xs font-mono text-surface-400">{contractAddress.slice(0, 10)}...</span>
            </div>
          )}
          <div className="pt-2">
            {account ? (
              <Button variant="danger" onClick={disconnectWallet} className="w-full justify-center">
                <Unlink className="w-4 h-4" /> Disconnect Wallet
              </Button>
            ) : (
              <Button variant="primary" onClick={connectWallet} loading={isConnecting} className="w-full justify-center">
                <Wallet className="w-4 h-4" /> Connect MetaMask
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      {!window?.ethereum && (
        <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
          <p className="text-sm text-warning">MetaMask not detected.</p>
          <p className="text-xs text-surface-400 mt-1">Install the MetaMask browser extension to connect your wallet.</p>
          <a href="https://metamask.io" target="_blank" rel="noreferrer"
            className="text-xs text-accent-400 hover:text-accent-300 mt-2 inline-block">Download MetaMask →</a>
        </div>
      )}
    </div>
  )
}
