const axios = require('axios');
const FormData = require('form-data');

const PINATA_API_URL = 'https://api.pinata.cloud';

const isPinataConfigured = () => {
  return !!(process.env.PINATA_JWT || (process.env.PINATA_API_KEY && process.env.PINATA_SECRET_API_KEY));
};

const getAuthHeaders = () => {
  if (process.env.PINATA_JWT) {
    return { Authorization: `Bearer ${process.env.PINATA_JWT}` };
  }
  return {
    pinata_api_key: process.env.PINATA_API_KEY,
    pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY,
  };
};

const uploadToIPFS = async (fileBuffer, fileName, mimeType = 'application/octet-stream') => {
  if (!isPinataConfigured()) {
    throw new Error('IPFS/Pinata is not configured. Please set PINATA_JWT or PINATA_API_KEY and PINATA_SECRET_API_KEY in environment variables.');
  }

  const formData = new FormData();
  formData.append('file', fileBuffer, {
    filename: fileName,
    contentType: mimeType,
  });

  const metadata = JSON.stringify({ name: fileName });
  formData.append('pinataMetadata', metadata);
  formData.append('pinataOptions', JSON.stringify({ cidVersion: 1 }));

  const response = await axios.post(
    `${PINATA_API_URL}/pinning/pinFileToIPFS`,
    formData,
    {
      maxBodyLength: Infinity,
      headers: {
        ...formData.getHeaders(),
        ...getAuthHeaders(),
      },
    }
  );

  return {
    cid: response.data.IpfsHash,
    size: response.data.PinSize,
    timestamp: response.data.Timestamp,
    gatewayUrl: `${process.env.PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs'}/${response.data.IpfsHash}`,
  };
};

const retrieveFromIPFS = async (cid) => {
  const gateway = process.env.PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs';
  const url = `${gateway}/${cid}`;
  
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 30000,
  });
  
  return Buffer.from(response.data);
};

module.exports = { uploadToIPFS, retrieveFromIPFS, isPinataConfigured };
