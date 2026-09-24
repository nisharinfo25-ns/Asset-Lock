const { getContract } = require('../config/blockchain');

const isBlockchainConfigured = () => {
  return !!(process.env.CONTRACT_ADDRESS && process.env.BLOCKCHAIN_RPC_URL);
};

const registerAsset = async (assetId, fileHash, ipfsCid, signerAddress) => {
  const contract = getContract();
  if (!contract) {
    throw new Error('Blockchain not configured. Please deploy the smart contract and set CONTRACT_ADDRESS.');
  }
  
  try {
    const tx = await contract.registerAsset(assetId, fileHash, ipfsCid);
    const receipt = await tx.wait();
    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
    };
  } catch (err) {
    throw new Error(`Blockchain transaction failed: ${err.message}`);
  }
};

const grantAccess = async (assetId, userWalletAddress) => {
  const contract = getContract();
  if (!contract) throw new Error('Blockchain not configured.');
  
  try {
    const tx = await contract.grantAccess(assetId, userWalletAddress);
    const receipt = await tx.wait();
    return { transactionHash: receipt.hash, blockNumber: receipt.blockNumber };
  } catch (err) {
    throw new Error(`Grant access transaction failed: ${err.message}`);
  }
};

const revokeAccess = async (assetId, userWalletAddress) => {
  const contract = getContract();
  if (!contract) throw new Error('Blockchain not configured.');
  
  try {
    const tx = await contract.revokeAccess(assetId, userWalletAddress);
    const receipt = await tx.wait();
    return { transactionHash: receipt.hash, blockNumber: receipt.blockNumber };
  } catch (err) {
    throw new Error(`Revoke access transaction failed: ${err.message}`);
  }
};

const verifyIntegrity = async (assetId, currentHash) => {
  const contract = getContract();
  if (!contract) throw new Error('Blockchain not configured.');
  
  try {
    const [owner, fileHash, ipfsCid, registeredAt] = await contract.getAsset(assetId);
    const isMatch = fileHash.toLowerCase() === currentHash.toLowerCase();
    return {
      blockchainHash: fileHash,
      currentHash,
      isMatch,
      owner,
      ipfsCid,
      registeredAt: Number(registeredAt),
    };
  } catch (err) {
    throw new Error(`Integrity verification failed: ${err.message}`);
  }
};

const checkAccess = async (assetId, walletAddress) => {
  const contract = getContract();
  if (!contract) return false;
  
  try {
    return await contract.hasAccess(assetId, walletAddress);
  } catch {
    return false;
  }
};

const recordAccess = async (assetId, action) => {
  const contract = getContract();
  if (!contract) throw new Error('Blockchain not configured.');

  try {
    const tx = await contract.recordAccess(assetId, action);
    const receipt = await tx.wait();
    return { transactionHash: receipt.hash, blockNumber: receipt.blockNumber };
  } catch (err) {
    throw new Error(`Record access transaction failed: ${err.message}`);
  }
};

const getAccessRecordCount = async (assetId) => {
  const contract = getContract();
  if (!contract) return 0;

  try {
    const count = await contract.getAccessRecordCount(assetId);
    return Number(count);
  } catch {
    return 0;
  }
};

module.exports = {
  registerAsset,
  grantAccess,
  revokeAccess,
  verifyIntegrity,
  checkAccess,
  recordAccess,
  getAccessRecordCount,
  isBlockchainConfigured
};
