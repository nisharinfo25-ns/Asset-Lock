import { useState, useEffect } from 'react';
import { BlockchainStatus, IpfsStatus } from '../types';
import { api } from '../services/api';

export function useBlockchain() {
  const [blockchain, setBlockchain] = useState<BlockchainStatus | null>(null);
  const [ipfs, setIpfs] = useState<IpfsStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const data = await api.getStatus();
      setBlockchain(data.blockchain);
      setIpfs(data.ipfs);
    } catch (e) {
      // Offline fallback
      setBlockchain({
        mode: 'SIMULATION',
        connected: false,
        blockNumber: 100,
        chainId: 31337,
        rpcUrl: 'Local cryptographic simulation engine',
      });
      setIpfs({
        mode: 'LOCAL',
        connected: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 10000);
    return () => clearInterval(interval);
  }, []);

  return { blockchain, ipfs, loading, refresh };
}
