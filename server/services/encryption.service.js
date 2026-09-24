const crypto = require('crypto');

function encryptBuffer(buffer, keyHex) {
  const key = Buffer.from(keyHex, 'hex');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  let encryptedData = cipher.update(buffer);
  encryptedData = Buffer.concat([encryptedData, cipher.final()]);
  const authTag = cipher.getAuthTag();
  
  return { 
    encryptedData: encryptedData.toString('hex'), 
    iv: iv.toString('hex'), 
    authTag: authTag.toString('hex'), 
    key: keyHex 
  };
}

function decryptBuffer(encryptedBufferHex, keyHex, ivHex, authTagHex) {
  const key = Buffer.from(keyHex, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const encryptedData = Buffer.from(encryptedBufferHex, 'hex');
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedData);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  
  return decrypted;
}

function generateHash(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

module.exports = {
  encryptBuffer,
  decryptBuffer,
  generateHash
};