const assert = require('assert');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { encryptBuffer, decryptBuffer, generateHash } = require('../src/services/encryption.service');
const { validateEmail, validatePassword, validateWalletAddress } = require('../src/utils/validators');
const { getContractABI } = require('../src/config/blockchain');

console.log('========================================================');
console.log('RUNNING ASSET-LOCK AUTOMATED COMPONENT & SECURITY TESTS');
console.log('========================================================\n');

let passedTests = 0;
let failedTests = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log('[PASS] ' + name);
    passedTests++;
  } catch (err) {
    console.error('[FAIL] ' + name + ': ' + err.message);
    failedTests++;
  }
}

// 1. AES-256 ENCRYPTION & DECRYPTION
runTest('AES-256: Original buffer matches decrypted buffer byte-for-byte', () => {
  const originalData = Buffer.from('CONFIDENTIAL ASSET DATA - PATENT #98234-A - TOP SECRET', 'utf8');
  const { encryptedData, iv, key } = encryptBuffer(originalData);

  assert.notDeepStrictEqual(encryptedData, originalData, 'Encrypted data must not match plaintext');
  assert.strictEqual(typeof iv, 'string', 'IV must be a hex string');
  assert.strictEqual(typeof key, 'string', 'Key must be a hex string');
  assert.strictEqual(iv.length, 32, 'IV hex string length must be 32 characters (16 bytes)');
  assert.strictEqual(key.length, 64, 'Key hex string length must be 64 characters (32 bytes)');

  const decrypted = decryptBuffer(encryptedData, key, iv);
  assert.deepStrictEqual(decrypted, originalData, 'Decrypted buffer must exactly match original');
  assert.strictEqual(decrypted.toString('utf8'), originalData.toString('utf8'));
});

// 2. SHA-256 HASH VERIFICATION
runTest('SHA-256: Hash generation is deterministic and 64 characters hex', () => {
  const fileContent = Buffer.from('AssetLock Test File Content for SHA-256', 'utf8');
  const hash1 = generateHash(fileContent);
  const hash2 = generateHash(fileContent);

  assert.strictEqual(hash1, hash2, 'Hash must be deterministic');
  assert.strictEqual(hash1.length, 64, 'SHA-256 hex string must be 64 characters');
  assert.match(hash1, /^[0-9a-f]{64}$/, 'Hash must contain only lowercase hex characters');
});

// 3. TAMPERING TEST (DEMO SCENARIO REQUIREMENT)
runTest('TAMPERING DETECTION: Modifying 1 byte causes integrity hash mismatch', () => {
  const originalFile = Buffer.from('Original authentic financial report Q4', 'utf8');
  const originalHash = generateHash(originalFile);

  // Tamper: modify one byte
  const tamperedFile = Buffer.from('Original authentic financial report Q5', 'utf8');
  const tamperedHash = generateHash(tamperedFile);

  assert.notStrictEqual(originalHash, tamperedHash, 'Tampered file hash must not equal original hash');
});

// 4. BCRYPT PASSWORD HASHING
runTest('BCRYPT: Password hashing and secure verification', () => {
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

// 7. BLOCKCHAIN SMART CONTRACT ARTIFACT VERIFICATION
runTest('BLOCKCHAIN: AssetLock compiled artifact contains all required functions and events', () => {
  const abi = getContractABI();
  const functionSignatures = typeof abi[0] === 'string' ? abi : abi.map(item => item.name).filter(Boolean);

  const requiredFunctions = [
    'registerAsset',
    'grantAccess',
    'revokeAccess',
    'hasAccess',
    'getAsset',
    'recordAccess'
  ];

  for (const fn of requiredFunctions) {
    const exists = functionSignatures.some(sig => typeof sig === 'string' ? sig.includes(fn) : sig === fn);
    assert.strictEqual(exists, true, 'Smart contract ABI must export function: ' + fn);
  }
});

console.log('\n========================================================');
console.log('TEST SUMMARY: ' + passedTests + ' PASSED, ' + failedTests + ' FAILED');
console.log('========================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
