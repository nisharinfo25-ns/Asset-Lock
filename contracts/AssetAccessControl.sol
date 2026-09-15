// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AssetAccessControl
 * @notice Blockchain-Based Decentralised Identity & Access Control
 *         for Secure Digital Asset Management
 * Stores ONLY: asset hash, IPFS CID, owner, permissions, access events.
 * The actual encrypted file lives in IPFS — NOT on-chain.
 */
contract AssetAccessControl {

    struct Asset {
        string  assetId;
        string  fileHash;   // SHA-256 of the ORIGINAL plaintext file
        string  ipfsCID;    // IPFS CID of the encrypted file
        address owner;
        uint256 createdAt;
        bool    exists;
    }

    mapping(string => Asset)                        private assets;
    mapping(string => mapping(address => bool))     public  permissions;
    mapping(string => address[])                    private authorizedUsers;
    string[]                                        private allAssetIds;

    event AssetRegistered(string indexed assetId, string fileHash, string ipfsCID, address indexed owner, uint256 timestamp);
    event PermissionGranted(string indexed assetId, address indexed user, address indexed grantedBy, uint256 timestamp);
    event PermissionRevoked(string indexed assetId, address indexed user, address indexed revokedBy, uint256 timestamp);
    event AccessAttempted(string indexed assetId, address indexed user, bool granted, string action, uint256 timestamp);

    modifier assetMustExist(string memory assetId) {
        require(assets[assetId].exists, "Asset not registered");
        _;
    }

    modifier onlyOwner(string memory assetId) {
        require(assets[assetId].exists, "Asset not registered");
        require(assets[assetId].owner == msg.sender, "Not the asset owner");
        _;
    }

    function registerAsset(string memory assetId, string memory fileHash, string memory ipfsCID) external {
        require(bytes(assetId).length > 0, "assetId required");
        require(bytes(fileHash).length > 0, "fileHash required");
        require(bytes(ipfsCID).length > 0, "ipfsCID required");
        require(!assets[assetId].exists, "Asset already registered");

        assets[assetId] = Asset({ assetId: assetId, fileHash: fileHash, ipfsCID: ipfsCID, owner: msg.sender, createdAt: block.timestamp, exists: true });
        permissions[assetId][msg.sender] = true;
        allAssetIds.push(assetId);
        emit AssetRegistered(assetId, fileHash, ipfsCID, msg.sender, block.timestamp);
    }

    function grantAccess(string memory assetId, address user) external onlyOwner(assetId) {
        require(user != address(0), "Invalid address");
        if (!permissions[assetId][user]) {
            permissions[assetId][user] = true;
            authorizedUsers[assetId].push(user);
        }
        emit PermissionGranted(assetId, user, msg.sender, block.timestamp);
    }

    function revokeAccess(string memory assetId, address user) external onlyOwner(assetId) {
        require(user != assets[assetId].owner, "Cannot revoke owner");
        require(permissions[assetId][user], "User has no access");
        permissions[assetId][user] = false;
        emit PermissionRevoked(assetId, user, msg.sender, block.timestamp);
    }

    function hasAccess(string memory assetId, address user) external view assetMustExist(assetId) returns (bool granted, bool isOwner) {
        isOwner = (assets[assetId].owner == user);
        granted = permissions[assetId][user];
    }

    function getAsset(string memory assetId) external view assetMustExist(assetId) returns (string memory fileHash, string memory ipfsCID, address owner, uint256 createdAt) {
        Asset memory a = assets[assetId];
        return (a.fileHash, a.ipfsCID, a.owner, a.createdAt);
    }

    function recordAccess(string memory assetId, string memory action, bool granted) external assetMustExist(assetId) {
        emit AccessAttempted(assetId, msg.sender, granted, action, block.timestamp);
    }

    function getAllAssetIds() external view returns (string[] memory) { return allAssetIds; }

    function getAuthorizedUsers(string memory assetId) external view onlyOwner(assetId) returns (address[] memory) {
        return authorizedUsers[assetId];
    }
}
