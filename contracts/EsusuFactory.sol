// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./EsusuPool.sol";

/**
 * @title EsusuFactory
 * @author EsusuChain
 * @notice Factory contract that deploys and tracks all EsusuPool instances.
 *         Anyone can create a new savings circle by calling `createPool`.
 */
contract EsusuFactory {

    // ─── State ────────────────────────────────────────────────────────────────

    address[] public allPools;
    mapping(address => address[]) public poolsByCreator;

    // ─── Events ───────────────────────────────────────────────────────────────

    event PoolDeployed(
        address indexed pool,
        address indexed creator,
        string  name,
        uint256 contributionAmount,
        uint256 cycleDuration,
        uint256 maxMembers
    );

    // ─── Functions ────────────────────────────────────────────────────────────

    /**
     * @notice Deploy a new EsusuPool savings circle.
     * @param _name               Human-readable name (e.g. "Lagos Friends Circle")
     * @param _contributionAmount Amount in wei each member contributes per round
     * @param _cycleDuration      Round duration in seconds (min 86400 = 1 day)
     * @param _maxMembers         Number of members (determines number of rounds)
     * @return pool               Address of the newly deployed EsusuPool
     */
    function createPool(
        string  calldata _name,
        uint256          _contributionAmount,
        uint256          _cycleDuration,
        uint256          _maxMembers
    ) external returns (address pool) {
        EsusuPool newPool = new EsusuPool(
            _name,
            _contributionAmount,
            _cycleDuration,
            _maxMembers,
            msg.sender
        );

        pool = address(newPool);
        allPools.push(pool);
        poolsByCreator[msg.sender].push(pool);

        emit PoolDeployed(pool, msg.sender, _name, _contributionAmount, _cycleDuration, _maxMembers);
    }

    // ─── View Functions ───────────────────────────────────────────────────────

    /// @notice Returns all deployed pool addresses
    function getAllPools() external view returns (address[] memory) {
        return allPools;
    }

    /// @notice Returns all pools created by a specific address
    function getPoolsByCreator(address creator) external view returns (address[] memory) {
        return poolsByCreator[creator];
    }

    /// @notice Total number of pools ever deployed
    function getTotalPools() external view returns (uint256) {
        return allPools.length;
    }
}
