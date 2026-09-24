// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract AssetLock is Ownable, ReentrancyGuard {
    struct Asset {
        string assetId;        // UUID from Supabase
        address owner;
        string fileHash;       // SHA-256 hash
        string ipfsCid;        // IPFS CID
        uint256 registeredAt;
        bool exists;
    }

    struct AccessRecord {
        address user;
        uint256 accessedAt;
        string action;
    }

    // assetId => Asset
    mapping(string => Asset) private assets;
    
    // assetId => user address => hasAccess
    mapping(string => mapping(address => bool)) private assetPermissions;
    
    // assetId => access records
    mapping(string => AccessRecord[]) private accessRecords;

    event AssetRegistered(
        string indexed assetId,
        address indexed owner,
        string fileHash,
        string ipfsCid,
        uint256 timestamp
    );

    event AccessGranted(
        string indexed assetId,
        address indexed owner,
        address indexed user,
        uint256 timestamp
    );

    event AccessRevoked(
        string indexed assetId,
        address indexed owner,
        address indexed user,
        uint256 timestamp
    );

    event AssetAccessed(
        string indexed assetId,
        address indexed user,
        string action,
        uint256 timestamp
    );

    modifier assetExists(string memory assetId) {
        require(assets[assetId].exists, "Asset does not exist");
        _;
    }

    modifier onlyAssetOwner(string memory assetId) {
        require(assets[assetId].exists, "Asset does not exist");
        require(assets[assetId].owner == msg.sender, "Not the asset owner");
        _;
    }

    constructor() Ownable(msg.sender) {}

    function registerAsset(
        string memory assetId,
        string memory fileHash,
        string memory ipfsCid
    ) external nonReentrant {
        require(bytes(assetId).length > 0, "Asset ID required");
        require(bytes(fileHash).length > 0, "File hash required");
        require(!assets[assetId].exists, "Asset already registered");

        assets[assetId] = Asset({
            assetId: assetId,
            owner: msg.sender,
            fileHash: fileHash,
            ipfsCid: ipfsCid,
            registeredAt: block.timestamp,
            exists: true
        });

        // Owner automatically has access
        assetPermissions[assetId][msg.sender] = true;

        emit AssetRegistered(assetId, msg.sender, fileHash, ipfsCid, block.timestamp);
    }

    function grantAccess(
        string memory assetId,
        address user
    ) external onlyAssetOwner(assetId) nonReentrant {
        require(user != address(0), "Invalid user address");
        require(user != msg.sender, "Owner already has access");
        require(!assetPermissions[assetId][user], "User already has access");

        assetPermissions[assetId][user] = true;

        emit AccessGranted(assetId, msg.sender, user, block.timestamp);
    }

    function revokeAccess(
        string memory assetId,
        address user
    ) external onlyAssetOwner(assetId) nonReentrant {
        require(user != address(0), "Invalid user address");
        require(user != msg.sender, "Cannot revoke owner access");
        require(assetPermissions[assetId][user], "User does not have access");

        assetPermissions[assetId][user] = false;

        emit AccessRevoked(assetId, msg.sender, user, block.timestamp);
    }

    function hasAccess(
        string memory assetId,
        address user
    ) external view assetExists(assetId) returns (bool) {
        return assetPermissions[assetId][user];
    }

    function getAsset(
        string memory assetId
    ) external view assetExists(assetId) returns (
        address owner,
        string memory fileHash,
        string memory ipfsCid,
        uint256 registeredAt
    ) {
        Asset memory asset = assets[assetId];
        return (asset.owner, asset.fileHash, asset.ipfsCid, asset.registeredAt);
    }

    function recordAccess(
        string memory assetId,
        string memory action
    ) external assetExists(assetId) nonReentrant {
        require(assetPermissions[assetId][msg.sender], "Access denied");

        accessRecords[assetId].push(AccessRecord({
            user: msg.sender,
            accessedAt: block.timestamp,
            action: action
        }));

        emit AssetAccessed(assetId, msg.sender, action, block.timestamp);
    }

    function getAccessRecordCount(
        string memory assetId
    ) external view assetExists(assetId) returns (uint256) {
        return accessRecords[assetId].length;
    }
}
