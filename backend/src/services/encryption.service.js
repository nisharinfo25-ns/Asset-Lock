const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;

/**
 * Encrypts a buffer using AES-256-CBC
 * Returns { encryptedData, iv, key } - key should be stored securely by caller
 */
const encryptBuffer = (buffer) => {
  const key = crypto.randomBytes(KEY_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  
  return {
    encryptedData: encrypted,
    iv: iv.toString('hex'),
    key: key.toString('hex')
  };
};

/**
 * Decrypts a buffer using AES-256-CBC
 */
const decryptBuffer = (encryptedBuffer, keyHex, ivHex) => {
  const key = Buffer.from(keyHex, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  return Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
};

/**
 * Generates SHA-256 hash of a buffer
 */
const generateHash = (buffer) => {
  return crypto.createHash('sha256').update(buffer).digest('hex');
};

module.exports = { encryptBuffer, decryptBuffer, generateHash };
