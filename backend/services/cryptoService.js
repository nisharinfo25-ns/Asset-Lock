'use strict';
const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LEN = 16;
const SALT_LEN = 32;
const KEY_LEN = 32;
const ITERATIONS = 100000;

function getMasterKey() {
  return process.env.ENCRYPTION_MASTER_KEY || 'AssetLock_DEFAULT_MASTER_KEY_CHANGE_IN_PRODUCTION_32B';
}

function deriveKey(salt) {
  return crypto.pbkdf2Sync(getMasterKey(), salt, ITERATIONS, KEY_LEN, 'sha256');
}

function encrypt(buffer) {
  const salt = crypto.randomBytes(SALT_LEN);
  const iv = crypto.randomBytes(IV_LEN);
  const key = deriveKey(salt);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    ciphertext: encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    salt: salt.toString('hex'),
    algorithm: ALGORITHM,
  };
}

function decrypt(ciphertext, ivHex, authTagHex, saltHex) {
  const salt = Buffer.from(saltHex, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const key = deriveKey(salt);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const buf = Buffer.isBuffer(ciphertext) ? ciphertext : Buffer.from(ciphertext);
  return Buffer.concat([decipher.update(buf), decipher.final()]);
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

module.exports = { encrypt, decrypt, sha256 };
