const crypto = require('crypto');
const { supabase, isSupabaseConfigured } = require('../config/supabase');

// In-memory fallback store for local development when Supabase key is placeholder/missing
const inMemoryStore = {
  users: [
    {
      id: 'a0000000-0000-0000-0000-000000000001',
      name: 'System Administrator',
      email: 'admin@assetlock.com',
      password_hash: '$2a$10$7mswl6HfJWGxivpwulVtuOTL/W3LUb1iIBfIXwtxO3dfis811XerK', // AdminPassword123!
      role: 'admin',
      wallet_address: null,
      created_at: new Date().toISOString()
    }
  ],
  assets: [],
  permissions: [],
  access_requests: [],
  audit_logs: []
};

const db = {
  users: {
    async findByEmail(email) {
      if (isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email.toLowerCase().trim())
            .single();
          if (!error && data) return data;
        } catch (e) {}
      }
      return inMemoryStore.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim()) || null;
    },
    async findById(id) {
      if (isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
          if (!error && data) return data;
        } catch (e) {}
      }
      return inMemoryStore.users.find(u => u.id === id) || null;
    },
    async create(userData) {
      const newUser = {
        id: crypto.randomUUID(),
        name: userData.name,
        email: userData.email.toLowerCase().trim(),
        password_hash: userData.password_hash,
        wallet_address: userData.wallet_address || null,
        role: userData.role || 'owner',
        created_at: new Date().toISOString()
      };

      if (isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase.from('users').insert(newUser).select().single();
          if (!error && data) return data;
        } catch (e) {}
      }

      inMemoryStore.users.push(newUser);
      return newUser;
    },
    async updateWallet(id, walletAddress) {
      if (isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase
            .from('users')
            .update({ wallet_address: walletAddress })
            .eq('id', id)
            .select()
            .single();
          if (!error && data) return data;
        } catch (e) {}
      }

      const user = inMemoryStore.users.find(u => u.id === id);
      if (user) user.wallet_address = walletAddress;
      return user;
    },
    async getAll() {
      if (isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase.from('users').select('id, name, email, role, wallet_address, created_at');
          if (!error && data) return data;
        } catch (e) {}
      }
      return inMemoryStore.users.map(({ password_hash, ...u }) => u);
    }
  },
  assets: {
    async create(assetData) {
      const newAsset = {
        id: crypto.randomUUID(),
        name: assetData.name,
        description: assetData.description || '',
        owner_id: assetData.owner_id,
        ipfs_cid: assetData.ipfs_cid,
        blockchain_asset_id: assetData.blockchain_asset_id || null,
        file_hash: assetData.file_hash,
        file_size: assetData.file_size,
        file_type: assetData.file_type,
        encrypted_file_metadata: assetData.encrypted_file_metadata,
        created_at: new Date().toISOString()
      };

      if (isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase.from('assets').insert(newAsset).select().single();
          if (!error && data) return data;
        } catch (e) {}
      }

      inMemoryStore.assets.push(newAsset);
      return newAsset;
    },
    async getAll(userId, role) {
      if (isSupabaseConfigured()) {
        try {
          let query = supabase.from('assets').select(`*, owner:users!assets_owner_id_fkey(id, name, email)`);
          if (role !== 'admin') query = query.eq('owner_id', userId);
          const { data, error } = await query;
          if (!error && data) return data;
        } catch (e) {}
      }

      let assets = inMemoryStore.assets;
      if (role !== 'admin') assets = assets.filter(a => a.owner_id === userId);

      return assets.map(a => {
        const owner = inMemoryStore.users.find(u => u.id === a.owner_id);
        return {
          ...a,
          owner: owner ? { id: owner.id, name: owner.name, email: owner.email } : null
        };
      });
    },
    async getById(id) {
      if (isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase.from('assets').select(`*, owner:users!assets_owner_id_fkey(id, name, email)`).eq('id', id).single();
          if (!error && data) return data;
        } catch (e) {}
      }

      const asset = inMemoryStore.assets.find(a => a.id === id);
      if (!asset) return null;

      const owner = inMemoryStore.users.find(u => u.id === asset.owner_id);
      return {
        ...asset,
        owner: owner ? { id: owner.id, name: owner.name, email: owner.email } : null
      };
    },
    async updateBlockchain(id, blockchainTxHash) {
      if (isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase
            .from('assets')
            .update({ blockchain_asset_id: blockchainTxHash })
            .eq('id', id)
            .select()
            .single();
          if (!error && data) return data;
        } catch (e) {}
      }

      const asset = inMemoryStore.assets.find(a => a.id === id);
      if (asset) {
        asset.blockchain_asset_id = blockchainTxHash;
      }
      return asset;
    }
  }
};

module.exports = { db, inMemoryStore };
