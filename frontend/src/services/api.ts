import axios from 'axios';
import { User, Asset, Permission, AuditLog, BlockchainStatus, IpfsStatus } from '../types';

const API_BASE =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? '/api'
    : 'http://localhost:5000/api');

const client = axios.create({
  baseURL: API_BASE,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('assetlock_jwt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't loop if on login/register
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register') && window.location.pathname !== '/') {
        localStorage.removeItem('assetlock_jwt_token');
        localStorage.removeItem('assetlock_user');
      }
    }
    return Promise.reject(error);
  }
);

export const api = {
  // Auth
  register: async (data: { name: string; email: string; password: string; walletAddress?: string; role: string }) => {
    const res = await client.post<{ token: string; user: User }>('/auth/register', data);
    localStorage.setItem('assetlock_jwt_token', res.data.token);
    localStorage.setItem('assetlock_user', JSON.stringify(res.data.user));
    return res.data;
  },

  login: async (data: { email: string; password: string }) => {
    const res = await client.post<{ token: string; user: User }>('/auth/login', data);
    localStorage.setItem('assetlock_jwt_token', res.data.token);
    localStorage.setItem('assetlock_user', JSON.stringify(res.data.user));
    return res.data;
  },

  getMe: async () => {
    const res = await client.get<{ user: User }>('/auth/me');
    localStorage.setItem('assetlock_user', JSON.stringify(res.data.user));
    return res.data.user;
  },

  getUsers: async () => {
    const res = await client.get<{ users: User[] }>('/auth/users');
    return res.data.users;
  },

  logout: () => {
    localStorage.removeItem('assetlock_jwt_token');
    localStorage.removeItem('assetlock_user');
  },

  // Assets
  uploadAsset: async (formData: FormData) => {
    const res = await client.post<{
      message: string;
      asset: Asset;
      ipfs: { cid: string; mode: string };
      blockchain: { txHash: string; blockNumber: number; mode: string };
    }>('/assets/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  getAssets: async (scope?: 'mine' | 'shared') => {
    const res = await client.get<{ assets: Asset[] }>('/assets', { params: { scope } });
    return res.data.assets;
  },

  getAsset: async (assetId: string) => {
    const res = await client.get<{
      asset: Asset;
      isOwner: boolean;
      hasAccess: boolean;
      permissions: Permission[];
    }>(`/assets/${assetId}`);
    return res.data;
  },

  downloadAsset: async (assetId: string, filename: string) => {
    const res = await client.get(`/assets/${assetId}/access`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    return { status: res.headers['x-access-status'] || 'GRANTED' };
  },

  // Permissions
  getPermissions: async (assetId: string) => {
    const res = await client.get<{ permissions: Permission[] }>(`/assets/${assetId}/permissions`);
    return res.data.permissions;
  },

  grantPermission: async (assetId: string, data: { userEmail?: string; userWallet?: string }) => {
    const res = await client.post(`/assets/${assetId}/permissions`, data);
    return res.data;
  },

  revokePermission: async (assetId: string, wallet: string) => {
    const res = await client.delete(`/assets/${assetId}/permissions/${wallet}`);
    return res.data;
  },

  // Integrity Verification
  verifyIntegrity: async (assetId: string) => {
    const res = await client.get<{
      status: 'INTEGRITY VERIFIED' | 'TAMPER DETECTED';
      verified: boolean;
      currentHash: string;
      storedHash: string;
      match: boolean;
      asset: { assetId: string; name: string; ipfsCID: string };
    }>(`/assets/${assetId}/verify`);
    return res.data;
  },

  // Audit
  getAuditLogs: async (params?: { assetId?: string; action?: string }) => {
    const res = await client.get<{ logs: AuditLog[] }>('/audit', { params });
    return res.data.logs;
  },

  getAssetAudit: async (assetId: string) => {
    const res = await client.get<{ logs: AuditLog[] }>(`/assets/${assetId}/audit`);
    return res.data.logs;
  },

  // Blockchain & IPFS Status
  getStatus: async () => {
    const res = await client.get<{ blockchain: BlockchainStatus; ipfs: IpfsStatus }>('/blockchain/status');
    return res.data;
  },
};
