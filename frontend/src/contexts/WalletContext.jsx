import { createContext, useContext, useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { authAPI } from '../lib/api'
import toast from 'react-hot-toast'

const WalletContext = createContext(null)
export const useWalletContext = () => useContext(WalletContext)

export function WalletProvider({ children }) {
  const [account, setAccount] = useState(null)
  const [network, setNetwork] = useState(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [provider, setProvider] = useState(null)

  useEffect(() => {
    if (window.ethereum) {
      const p = new ethers.BrowserProvider(window.ethereum)
      setProvider(p)
      window.ethereum.on('accountsChanged', handleAccountsChanged)
      window.ethereum.on('chainChanged', () => window.location.reload())
    }
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
      }
    }
  }, [])

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      setAccount(null)
    } else {
      setAccount(accounts[0])
    }
  }

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error('MetaMask not detected. Please install MetaMask.')
      return null
    }
    try {
      setIsConnecting(true)
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      const address = accounts[0]
      setAccount(address)

      const p = new ethers.BrowserProvider(window.ethereum)
      const net = await p.getNetwork()
      setNetwork(net)
      setProvider(p)

      // Update wallet in backend
      try {
        await authAPI.updateWallet(address)
      } catch (err) {
        console.warn('Could not update wallet on server:', err.message)
      }

      toast.success(`Wallet connected: ${address.slice(0, 6)}...${address.slice(-4)}`)
      return address
    } catch (err) {
      toast.error('Failed to connect wallet: ' + err.message)
      return null
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectWallet = () => {
    setAccount(null)
    setNetwork(null)
    toast.success('Wallet disconnected')
  }

  const getContract = (address, abi) => {
    if (!provider || !account) return null
    const signer = provider.getSigner()
    return new ethers.Contract(address, abi, signer)
  }

  const shortAddress = account ? `${account.slice(0, 6)}...${account.slice(-4)}` : null

  return (
    <WalletContext.Provider value={{ account, network, isConnecting, provider, connectWallet, disconnectWallet, getContract, shortAddress }}>
      {children}
    </WalletContext.Provider>
  )
}
