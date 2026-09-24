const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { supabase, isSupabaseConfigured } = require('../config/supabase');

/**
 * Enforce only TWO roles: ADMIN and USER.
 * Migrates old roles (owner, authorized_user, viewer, etc.) to USER.
 */
const normalizeRole = (role) => {
  if (!role) return 'USER';
  const r = String(role).trim().toUpperCase();
  if (r === 'ADMIN') return 'ADMIN';
  return 'USER';
};

// Predefined Admin Account
// Username: Nexshield@Admin
// Password: Admin@Nexshield
// Role: ADMIN
const ADMIN_NAME = 'Nexshield@Admin';
const ADMIN_EMAIL = 'nexshield@admin';
const ADMIN_PASSWORD_HASH = bcrypt.hashSync('Admin@Nexshield', 10);

const PREDEFINED_ADMIN = {
  id: 'a0000000-0000-0000-0000-000000000001',
  name: ADMIN_NAME,
  email: ADMIN_EMAIL,
  password_hash: ADMIN_PASSWORD_HASH,
  role: 'ADMIN',
  wallet_address: null,
  created_at: new Date().toISOString()
};

// In-memory fallback store for local development when Supabase key is placeholder/missing
const inMemoryStore = {
  users: [
    { ...PREDEFINED_ADMIN }
  ],
  assets: [],
  permissions: [],
  access_requests: [],
  audit_logs: []
};

const formatUser = (user) => {
  if (!user) return null;
  return {
    ...user,
    role: normalizeRole(user.role)
  };
};

const db = {
  users: {
    async findByEmailOrIdentifier(identifier) {
      if (!identifier) return null;
      const clean = identifier.trim().toLowerCase();

      // Check predefined Admin shortcuts
      if (clean === 'nexshield@admin' || clean === 'admin@assetlock.com') {
        const found = inMemoryStore.users.find(u => u.name.toLowerCase() === 'nexshield@admin' || u.email.toLowerCase() === 'nexshield@admin');
        if (found) return formatUser(found);
      }

      if (isSupabaseConfigured()) {
        try {
          // Check email
          const { data: byEmail } = await supabase
            .from('users')
            .select('*')
            .eq('email', clean)
            .single();
          if (byEmail) return formatUser(byEmail);

          // Check name/username
          const { data: byName } = await supabase
            .from('users')
            .select('*')
            .eq('name', identifier.trim())
            .single();
          if (byName) return formatUser(byName);
        } catch (e) {}
      }

      const localUser = inMemoryStore.users.find(
        u => u.email.toLowerCase() === clean || u.name.toLowerCase() === clean
      );
      return formatUser(localUser);
    },

    async findByEmail(email) {
      return this.findByEmailOrIdentifier(email);
    },

    async findById(id) {
      if (isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
          if (!error && data) return formatUser(data);
        } catch (e) {}
      }
      return formatUser(inMemoryStore.users.find(u => u.id === id));
    },

    async create(userData) {
      // Security: ONLY server-side code can create ADMIN (via isInternalAdmin flag).
      // Normal public registrations are ALWAYS forced to role: 'USER'.
      const role = userData.isInternalAdmin === true ? 'ADMIN' : 'USER';

      const newUser = {
        id: crypto.randomUUID(),
        name: userData.name,
        email: userData.email.toLowerCase().trim(),
        password_hash: userData.password_hash,
        wallet_address: userData.wallet_address || null,
        role,
        created_at: new Date().toISOString()
      };

      if (isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase.from('users').insert(newUser).select().single();
          if (!error && data) return formatUser(data);
        } catch (e) {}
      }

      inMemoryStore.users.push(newUser);
      return formatUser(newUser);
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
          if (!error && data) return formatUser(data);
        } catch (e) {}
      }

      const user = inMemoryStore.users.find(u => u.id === id);
      if (user) user.wallet_address = walletAddress;
      return formatUser(user);
    },

    async updateRole(id, newRole) {
      const normalized = normalizeRole(newRole);
      if (isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase
            .from('users')
            .update({ role: normalized })
            .eq('id', id)
            .select('id, name, email, role')
            .single();
          if (!error && data) return formatUser(data);
        } catch (e) {}
      }

      const user = inMemoryStore.users.find(u => u.id === id);
      if (user) user.role = normalized;
      return formatUser(user);
    },

    async getAll() {
      if (isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase.from('users').select('id, name, email, role, wallet_address, created_at');
          if (!error && data) return data.map(formatUser);
        } catch (e) {}
      }
      return inMemoryStore.users.map(({ password_hash, ...u }) => formatUser(u));
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
      const isAdmin = normalizeRole(role) === 'ADMIN';

      if (isSupabaseConfigured()) {
        try {
          let query = supabase.from('assets').select(`*, owner:users!assets_owner_id_fkey(id, name, email)`);
          if (!isAdmin) query = query.eq('owner_id', userId);
          const { data, error } = await query;
          if (!error && data) return data;
        } catch (e) {}
      }

      let assets = inMemoryStore.assets;
      if (!isAdmin) {
        assets = assets.filter(a => a.owner_id === userId);
      }

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

module.exports = { db, inMemoryStore, normalizeRole };
