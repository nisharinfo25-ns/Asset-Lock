const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

let provider = null;
let contract = null;
let signer = null;

function getProvider() {
  if (!provider) {
    const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545';
    provider = new ethers.JsonRpcProvider(rpcUrl);
  }
  return provider;
}

function getContractABI() {
  // Try to load from blockchain artifacts
  const artifactPaths = [
    path.join(__dirname, '../../../blockchain/artifacts/contracts/AssetLock.sol/AssetLock.json'),
  ];
  
  for (const p of artifactPaths) {
    if (fs.existsSync(p)) {
      const artifact = JSON.parse(fs.readFileSync(p, 'utf8'));
      return artifact.abi;
    }
  }
  
  // Fallback ABI
  return [
    "function registerAsset(string memory assetId, string memory fileHash, string memory ipfsCid) external",
    "function grantAccess(string memory assetId, address user) external",
    "function revokeAccess(string memory assetId, address user) external",
    "function hasAccess(string memory assetId, address user) external view returns (bool)",
    "function getAsset(string memory assetId) external view returns (address owner, string memory fileHash, string memory ipfsCid, uint256 registeredAt)",
    "function recordAccess(string memory assetId, string memory action) external",
    "event AssetRegistered(string indexed assetId, address indexed owner, string fileHash, string ipfsCid, uint256 timestamp)",
    "event AccessGranted(string indexed assetId, address indexed owner, address indexed user, uint256 timestamp)",
    "event AccessRevoked(string indexed assetId, address indexed owner, address indexed user, uint256 timestamp)",
    "event AssetAccessed(string indexed assetId, address indexed user, string action, uint256 timestamp)"
  ];
}

function getContract() {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!contractAddress) {
    return null;
  }
  
  if (!contract) {
    const p = getProvider();
    const abi = getContractABI();
    
    if (process.env.DEPLOYER_PRIVATE_KEY) {
      signer = new ethers.NonceManager(new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, p));
      contract = new ethers.Contract(contractAddress, abi, signer);
    } else {
      contract = new ethers.Contract(contractAddress, abi, p);
    }
  }
  
  return contract;
}

module.exports = { getProvider, getContract, getContractABI };
