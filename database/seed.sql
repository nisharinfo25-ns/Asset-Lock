-- Sample seed data for Asset-Lock platform
-- Default Admin credentials:
-- Email: admin@assetlock.com
-- Password: AdminPassword123!

INSERT INTO users (id, name, email, password_hash, role, created_at)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'System Administrator',
  'admin@assetlock.com',
  '$2a$10$7mswl6HfJWGxivpwulVtuOTL/W3LUb1iIBfIXwtxO3dfis811XerK',
  'admin',
  NOW()
)
ON CONFLICT (email) DO NOTHING;
