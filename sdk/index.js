/**
 * @module esusuchain-sdk
 * @description JavaScript/TypeScript SDK for interacting with EsusuChain smart contracts.
 * @version 1.0.0
 */

// ─── ABI ─────────────────────────────────────────────────────────────────────

export const ESUSU_FACTORY_ABI = [
  "function createPool(string _name, uint256 _contributionAmount, uint256 _cycleDuration, uint256 _maxMembers) returns (address)",
  "function getAllPools() view returns (address[])",
  "function getPoolsByCreator(address creator) view returns (address[])",
  "function getTotalPools() view returns (uint256)",
  "event PoolDeployed(address indexed pool, address indexed creator, string name, uint256 contributionAmount, uint256 cycleDuration, uint256 maxMembers)",
];

export const ESUSU_POOL_ABI = [
  // State
  "function name() view returns (string)",
  "function contributionAmount() view returns (uint256)",
  "function cycleDuration() view returns (uint256)",
  "function maxMembers() view returns (uint256)",
  "function admin() view returns (address)",
  "function status() view returns (uint8)",
  "function currentRound() view returns (uint256)",
  "function roundStartTime() view returns (uint256)",
  "function isMember(address) view returns (bool)",
  "function hasWon(address) view returns (bool)",
  "function pendingWithdrawals(address) view returns (uint256)",
  "function roundWinner(uint256) view returns (address)",
  // Actions
  "function join()",
  "function contribute() payable",
  "function withdraw()",
  "function finalizeRound()",
  "function cancelPool(string reason)",
  "function pause()",
  "function unpause()",
  // Views
  "function getMembersCount() view returns (uint256)",
  "function getMembers() view returns (address[])",
  "function getMemberStatus(address member) view returns (bool, bool, bool, uint256)",
  "function getRoundInfo() view returns (uint256, uint256, uint256, uint256, address)",
  "function getPoolInfo() view returns (string, uint256, uint256, uint256, uint256, uint8, uint256, uint256)",
  // Events
  "event MemberJoined(address indexed member, uint256 totalMembers)",
  "event PoolStarted(uint256 startTime, uint256 cycleDuration)",
  "event Contributed(address indexed member, uint256 round, uint256 amount)",
  "event RoundCompleted(uint256 round, address indexed winner, uint256 amount)",
  "event Withdrawal(address indexed member, uint256 amount)",
  "event PoolCompleted(uint256 totalRounds)",
];

// ─── Pool Status Enum ─────────────────────────────────────────────────────────

export const PoolStatus = {
  0: "Open",
  1: "Active",
  2: "Completed",
  3: "Cancelled",
};

// ─── SDK Class ────────────────────────────────────────────────────────────────

export class EsusuChainSDK {
  /**
   * @param {object} provider  - ethers.js provider
   * @param {string} factoryAddress - Deployed EsusuFactory address
   */
  constructor(provider, factoryAddress) {
    this.provider = provider;
    this.factoryAddress = factoryAddress;
  }

  _getFactory(signerOrProvider) {
    const { ethers } = require("ethers");
    return new ethers.Contract(
      this.factoryAddress,
      ESUSU_FACTORY_ABI,
      signerOrProvider || this.provider
    );
  }

  _getPool(poolAddress, signerOrProvider) {
    const { ethers } = require("ethers");
    return new ethers.Contract(
      poolAddress,
      ESUSU_POOL_ABI,
      signerOrProvider || this.provider
    );
  }

  /**
   * Create a new savings pool.
   * @param {object} signer
   * @param {string} name
   * @param {bigint} contributionAmount  - in wei
   * @param {number} cycleDurationDays
   * @param {number} maxMembers
   * @returns {Promise<string>} New pool address
   */
  async createPool(signer, name, contributionAmount, cycleDurationDays, maxMembers) {
    const factory = this._getFactory(signer);
    const cycleSec = cycleDurationDays * 24 * 60 * 60;
    const tx = await factory.createPool(name, contributionAmount, cycleSec, maxMembers);
    const receipt = await tx.wait();
    const parsed = factory.interface.parseLog(receipt.logs[0]);
    return parsed.args.pool;
  }

  /** @returns {Promise<string[]>} All pool addresses */
  async getAllPools() {
    const factory = this._getFactory(this.provider);
    return factory.getAllPools();
  }

  /** @returns {Promise<string[]>} Pools created by a specific address */
  async getPoolsByCreator(creatorAddress) {
    const factory = this._getFactory(this.provider);
    return factory.getPoolsByCreator(creatorAddress);
  }

  /**
   * @param {string} poolAddress
   * @returns {Promise<object>} Parsed pool info
   */
  async getPoolInfo(poolAddress) {
    const pool = this._getPool(poolAddress);
    const [name, contributionAmount, cycleDuration, maxMembers, currentMembers, status, currentRound, balance] =
      await pool.getPoolInfo();
    return {
      address: poolAddress,
      name,
      contributionAmount,
      cycleDuration,
      maxMembers: Number(maxMembers),
      currentMembers: Number(currentMembers),
      status: PoolStatus[Number(status)],
      currentRound: Number(currentRound),
      balance,
    };
  }

  /** Join a pool */
  async joinPool(signer, poolAddress) {
    const pool = this._getPool(poolAddress, signer);
    const tx = await pool.join();
    return tx.wait();
  }

  /** Contribute to current round */
  async contribute(signer, poolAddress, contributionAmount) {
    const pool = this._getPool(poolAddress, signer);
    const tx = await pool.contribute({ value: contributionAmount });
    return tx.wait();
  }

  /** Withdraw pending winnings */
  async withdraw(signer, poolAddress) {
    const pool = this._getPool(poolAddress, signer);
    const tx = await pool.withdraw();
    return tx.wait();
  }
}

export default EsusuChainSDK;
