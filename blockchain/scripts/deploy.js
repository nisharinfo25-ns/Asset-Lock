const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying AssetLock contract...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  const AssetLock = await ethers.getContractFactory("AssetLock");
  const assetLock = await AssetLock.deploy();
  await assetLock.waitForDeployment();

  const contractAddress = await assetLock.getAddress();
  console.log("AssetLock deployed to:", contractAddress);

  // Save deployment info
  const deploymentInfo = {
    contractAddress,
    deployerAddress: deployer.address,
    network: hre.network.name,
    deployedAt: new Date().toISOString(),
  };

  const deploymentPath = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentPath)) {
    fs.mkdirSync(deploymentPath, { recursive: true });
  }

  fs.writeFileSync(
    path.join(deploymentPath, `${hre.network.name}.json`),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("Deployment info saved to deployments/" + hre.network.name + ".json");
  console.log("\n=== NEXT STEPS ===");
  console.log(`Set VITE_CONTRACT_ADDRESS=${contractAddress} in frontend/.env.local`);
  console.log(`Set CONTRACT_ADDRESS=${contractAddress} in backend/.env`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
