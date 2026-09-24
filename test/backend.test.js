const assert = require('assert');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { encryptBuffer, decryptBuffer, generateHash } = require('../backend/src/services/encryption.service');
const { validateEmail, validatePassword, validateWalletAddress } = require('../backend/src/utils/validators');

console.log('========================================================');
console.log('RUNNING ASSET-LOCK UNIFIED SECURITY & COMPONENT TESTS');
console.log('========================================================\n');

let passed = 0;
let failed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log('[PASS] ' + name);
    passed++;
  } catch (err) {
    console.error('[FAIL] ' + name + ': ' + err.message);
    failed++;
  }
}

// 1. AES-256 ENCRYPTION & DECRYPTION
runTest('AES-256: Original buffer matches decrypted buffer byte-for-byte', () => {
  const original = Buffer.from('TOP SECRET CONFIDENTIAL FILE DATA - PATENT #98234-A', 'utf8');
  const { encryptedData, iv, key } = encryptBuffer(original);

  assert.notDeepStrictEqual(encryptedData, original, 'Ciphertext must not equal plaintext');
  assert.strictEqual(typeof iv, 'string', 'IV must be a hex string');
  assert.strictEqual(typeof key, 'string', 'Key must be a hex string');

  const decrypted = decryptBuffer(encryptedData, key, iv);
  assert.deepStrictEqual(decrypted, original, 'Decrypted buffer must match original byte-for-byte');
  assert.strictEqual(decrypted.toString('utf8'), original.toString('utf8'));
});

// 2. SHA-256 HASH VERIFICATION
runTest('SHA-256: Hash generation is deterministic and 64 hex characters', () => {
  const buffer = Buffer.from('AssetLock Test File Content for SHA-256 Digest', 'utf8');
  const hash1 = generateHash(buffer);
  const hash2 = generateHash(buffer);

  assert.strictEqual(hash1, hash2, 'Hash must be deterministic');
  assert.strictEqual(hash1.length, 64, 'SHA-256 digest hex string must be 64 characters');
  assert.match(hash1, /^[0-9a-f]{64}$/, 'Hash must contain only lowercase hex characters');
});

// 3. TAMPERING DETECTION TEST
runTest('TAMPERING DETECTION: Modifying 1 byte causes integrity hash mismatch', () => {
  const original = Buffer.from('Original authentic financial report Q4', 'utf8');
  const originalHash = generateHash(original);

  const tampered = Buffer.from('Original authentic financial report Q5', 'utf8');
  const tamperedHash = generateHash(tampered);

  assert.notStrictEqual(originalHash, tamperedHash, 'Tampered file hash must not equal original hash');
});

// 4. BCRYPT PASSWORD HASHING
runTest('BCRYPT: Password hashing and secure comparison', () => {
  const password = 'SuperSecurePassword123!';
  const hash = bcrypt.hashSync(password, 10);

  assert.notStrictEqual(password, hash, 'Password must be hashed, never plaintext');
  assert.strictEqual(bcrypt.compareSync(password, hash), true, 'Valid password must verify');
  assert.strictEqual(bcrypt.compareSync('WrongPassword', hash), false, 'Invalid password must fail');
});

// 5. JWT AUTHENTICATION
runTest('JWT: Sign and verify payload integrity with expiration', () => {
  const secret = 'test-jwt-secret-key-32-chars-long!';
  const payload = { userId: '123e4567-e89b-12d3-a456-426614174000', role: 'owner' };
  const token = jwt.sign(payload, secret, { expiresIn: '1h' });

  const decoded = jwt.verify(token, secret);
  assert.strictEqual(decoded.userId, payload.userId);
  assert.strictEqual(decoded.role, payload.role);

  assert.throws(() => {
    jwt.verify(token, 'wrong-secret');
  }, /invalid signature/);
});

// 6. VALIDATORS
runTest('VALIDATORS: Email, password, and Ethereum wallet format checks', () => {
  assert.strictEqual(validateEmail('security@assetlock.io'), true);
  assert.strictEqual(validateEmail('invalid-email'), false);

  assert.strictEqual(validatePassword('12345678'), true);
  assert.strictEqual(validatePassword('short'), false);

  assert.strictEqual(validateWalletAddress('0x70997970C51812dc3A010C7d01b50e0d17dc79C8'), true);
  assert.strictEqual(validateWalletAddress('0xInvalidWalletAddress'), false);
  assert.strictEqual(validateWalletAddress('70997970C51812dc3A010C7d01b50e0d17dc79C8'), false);
});

console.log('\n========================================================');
console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('========================================================');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
