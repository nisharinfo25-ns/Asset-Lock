const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AssetLock", function () {
  let assetLock;
  let owner, user1, user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    const AssetLock = await ethers.getContractFactory("AssetLock");
    assetLock = await AssetLock.deploy();
  });

  describe("registerAsset", function () {
    it("Should register an asset successfully", async function () {
      const assetId = "test-asset-001";
      const fileHash = "abc123def456";
      const ipfsCid = "QmTestCID123";

      await expect(assetLock.registerAsset(assetId, fileHash, ipfsCid))
        .to.emit(assetLock, "AssetRegistered")
        .withArgs(assetId, owner.address, fileHash, ipfsCid, await ethers.provider.getBlock("latest").then(b => b.timestamp + 1));
    });

    it("Should not allow duplicate asset registration", async function () {
      const assetId = "test-asset-002";
      await assetLock.registerAsset(assetId, "hash1", "cid1");
      await expect(
        assetLock.registerAsset(assetId, "hash2", "cid2")
      ).to.be.revertedWith("Asset already registered");
    });
  });

  describe("grantAccess", function () {
    it("Should grant access to a user", async function () {
      const assetId = "test-asset-003";
      await assetLock.registerAsset(assetId, "hash1", "cid1");

      await expect(assetLock.grantAccess(assetId, user1.address))
        .to.emit(assetLock, "AccessGranted");

      expect(await assetLock.hasAccess(assetId, user1.address)).to.be.true;
    });

    it("Should not allow non-owner to grant access", async function () {
      const assetId = "test-asset-004";
      await assetLock.registerAsset(assetId, "hash1", "cid1");

      await expect(
        assetLock.connect(user1).grantAccess(assetId, user2.address)
      ).to.be.revertedWith("Not the asset owner");
    });
  });

  describe("revokeAccess", function () {
    it("Should revoke access from a user", async function () {
      const assetId = "test-asset-005";
      await assetLock.registerAsset(assetId, "hash1", "cid1");
      await assetLock.grantAccess(assetId, user1.address);

      await expect(assetLock.revokeAccess(assetId, user1.address))
        .to.emit(assetLock, "AccessRevoked");

      expect(await assetLock.hasAccess(assetId, user1.address)).to.be.false;
    });
  });
});
