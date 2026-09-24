-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  wallet_address VARCHAR(42),
  role VARCHAR(50) NOT NULL DEFAULT 'owner' CHECK (role IN ('admin', 'owner', 'authorized_user', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);

-- ASSETS TABLE
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ipfs_cid VARCHAR(255),
  blockchain_asset_id VARCHAR(255),
  file_hash VARCHAR(64) NOT NULL,
  encrypted_file_metadata JSONB,
  file_size BIGINT,
  file_type VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assets_owner ON assets(owner_id);
CREATE INDEX IF NOT EXISTS idx_assets_ipfs_cid ON assets(ipfs_cid);

-- PERMISSIONS TABLE
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission VARCHAR(50) NOT NULL DEFAULT 'read' CHECK (permission IN ('read', 'download')),
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  granted_by UUID REFERENCES users(id),
  UNIQUE(asset_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_permissions_asset ON permissions(asset_id);
CREATE INDEX IF NOT EXISTS idx_permissions_user ON permissions(user_id);

-- ACCESS REQUESTS TABLE
CREATE TABLE IF NOT EXISTS access_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  message TEXT,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  UNIQUE(asset_id, requester_id)
);

CREATE INDEX IF NOT EXISTS idx_requests_asset ON access_requests(asset_id);
CREATE INDEX IF NOT EXISTS idx_requests_requester ON access_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_requests_owner ON access_requests(owner_id);

-- AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  details JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  transaction_hash VARCHAR(255),
  status VARCHAR(50) DEFAULT 'success' CHECK (status IN ('success', 'failed', 'pending'))
);

CREATE INDEX IF NOT EXISTS idx_audit_asset ON audit_logs(asset_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);

-- ROW LEVEL SECURITY
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- COMMENT: Service role bypasses RLS. All backend operations use service role.
-- Anonymous users have no access by default.
-- RLS policies below allow service_role full access (automatic in Supabase).
