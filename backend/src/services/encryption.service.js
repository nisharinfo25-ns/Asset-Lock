const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 12; // 96-bit IV recommended for AES-GCM

/**
 * Encrypts a buffer using AES-256-GCM
 * Returns { encryptedData, iv, key, authTag }
 * encryptedData contains ciphertext + 16-byte authentication tag
 */
const encryptBuffer = (buffer) => {
  const key = crypto.randomBytes(KEY_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();
  
  // Encrypted file bytes: ciphertext + authTag
  const encryptedData = Buffer.concat([encrypted, authTag]);

  return {
    encryptedData,
    iv: iv.toString('hex'),
    key: key.toString('hex'),
    authTag: authTag.toString('hex')
  };
};

/**
 * Decrypts an AES-256-GCM encrypted buffer
 */
const decryptBuffer = (encryptedBuffer, keyHex, ivHex, authTagHex) => {
  const key = Buffer.from(keyHex, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  
  let ciphertext;
  let authTag;

  if (authTagHex) {
    authTag = Buffer.from(authTagHex, 'hex');
    ciphertext = encryptedBuffer;
  } else if (encryptedBuffer.length >= 16) {
    ciphertext = encryptedBuffer.subarray(0, encryptedBuffer.length - 16);
    authTag = encryptedBuffer.subarray(encryptedBuffer.length - 16);
  } else {
    throw new Error('Invalid encrypted buffer length for AES-GCM');
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
};

/**
 * Generates SHA-256 hash of a buffer
 */
const generateHash = (buffer) => {
  return crypto.createHash('sha256').update(buffer).digest('hex');
};

module.exports = { encryptBuffer, decryptBuffer, generateHash };
