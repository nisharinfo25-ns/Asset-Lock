export interface User {
  _id: string;
  name: string;
  email: string;
  walletAddress: string;
  role: 'Admin' | 'Owner' | 'Authorized User';
  verified: boolean;
  createdAt: string;
}

export interface Asset {
  _id: string;
  assetId: string;
  name: string;
  description?: string;
  ownerId: string;
  ownerEmail: string;
  ownerWallet: string;
  fileHash: string;
  ipfsCID: string;
  fileType: string;
  fileSize: number;
  txHash: string;
  blockNumber: number;
  blockchainMode: 'LIVE' | 'SIMULATION';
  isOwner?: boolean;
  createdAt: string;
}

export interface Permission {
  _id: string;
  assetId: string;
  userId: string;
  userEmail: string;
  userWallet: string;
  status: 'Active' | 'Revoked';
  grantedBy: string;
  txHash: string;
  createdAt: string;
}

export interface AuditLog {
  _id: string;
  assetId: string;
  assetName?: string;
  user: string;
  action: 'UPLOAD' | 'ACCESS' | 'PERMISSION_GRANTED' | 'PERMISSION_REVOKED' | 'INTEGRITY_CHECK' | 'LOGIN' | 'REGISTER';
  result: 'SUCCESS' | 'GRANTED' | 'DENIED' | 'VERIFIED' | 'TAMPER_DETECTED';
  details: string;
  txHash?: string;
  createdAt: string;
}

export interface BlockchainStatus {
  mode: 'LIVE' | 'SIMULATION';
  connected: boolean;
  blockNumber: number;
  chainId: number;
  rpcUrl: string;
}

export interface IpfsStatus {
  mode: 'PINATA' | 'LOCAL';
  connected: boolean;
  fileCount?: number;
}
