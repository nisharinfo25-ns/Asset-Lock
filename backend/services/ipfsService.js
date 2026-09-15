'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const LOCAL_STORE = path.join(__dirname, '../../database/ipfs_store');

function toBase58(hex) {
  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let num = BigInt('0x' + hex);
  let str = '';
  while (num > 0n) {
    str = ALPHABET[Number(num % 58n)] + str;
    num = num / 58n;
  }
  return str;
}

function generateCID(buffer) {
  const sha = crypto.createHash('sha256').update(buffer).digest('hex');
  const multihash = '1220' + sha;
  return 'Qm' + toBase58(multihash).padStart(44, '1');
}

async function upload(buffer, filename) {
  // Try Pinata if configured
  if (process.env.PINATA_JWT) {
    try {
      const FormData = require('form-data');
      const axios = require('axios');
      const form = new FormData();
      form.append('file', buffer, { filename: filename || 'asset.enc', contentType: 'application/octet-stream' });
      form.append('pinataOptions', JSON.stringify({ cidVersion: 0 }));
      const res = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', form, {
        headers: { ...form.getHeaders(), Authorization: `Bearer ${process.env.PINATA_JWT}` },
        maxBodyLength: Infinity,
      });
      return { cid: res.data.IpfsHash, mode: 'PINATA', size: buffer.length };
    } catch (e) {
      console.warn('[IPFS] Pinata upload failed, using local store:', e.message);
    }
  }
  // Local content-addressed store
  const cid = generateCID(buffer);
  fs.mkdirSync(LOCAL_STORE, { recursive: true });
  fs.writeFileSync(path.join(LOCAL_STORE, cid), buffer);
  return { cid, mode: 'LOCAL', size: buffer.length };
}

async function retrieve(cid) {
  // Try Pinata gateway if configured
  if (process.env.PINATA_GATEWAY) {
    try {
      const axios = require('axios');
      const res = await axios.get(`${process.env.PINATA_GATEWAY}/${cid}`, { responseType: 'arraybuffer', timeout: 10000 });
      return Buffer.from(res.data);
    } catch (e) {
      console.warn('[IPFS] Gateway retrieve failed, trying local:', e.message);
    }
  }
  const localPath = path.join(LOCAL_STORE, cid);
  if (fs.existsSync(localPath)) return fs.readFileSync(localPath);
  throw new Error('File not found in IPFS store. CID: ' + cid);
}

async function getStatus() {
  if (process.env.PINATA_JWT) {
    try {
      const axios = require('axios');
      await axios.get('https://api.pinata.cloud/data/testAuthentication', {
        headers: { Authorization: `Bearer ${process.env.PINATA_JWT}` }, timeout: 3000,
      });
      return { mode: 'PINATA', connected: true };
    } catch {}
  }
  const count = fs.existsSync(LOCAL_STORE) ? fs.readdirSync(LOCAL_STORE).length : 0;
  return { mode: 'LOCAL', connected: true, fileCount: count };
}

module.exports = { upload, retrieve, getStatus, generateCID };
