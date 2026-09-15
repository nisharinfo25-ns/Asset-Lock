import { useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('assetlock_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('assetlock_jwt_token');
    if (token) {
      api.getMe()
        .then((u) => setUser(u))
        .catch(() => {
          setUser(null);
          localStorage.removeItem('assetlock_jwt_token');
          localStorage.removeItem('assetlock_user');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    setUser(res.user);
    return res;
  };

  const register = async (data: { name: string; email: string; password: string; walletAddress?: string; role: string }) => {
    const res = await api.register(data);
    setUser(res.user);
    return res;
  };

  const logout = () => {
    api.logout();
    setUser(null);
  };

  return { user, loading, login, register, logout, isAuthenticated: !!user };
}
