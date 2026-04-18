/**
 * @module esusuchain-sdk
 * @description JavaScript/TypeScript SDK for interacting with EsusuChain
 *              Soroban smart contracts on the Stellar network.
 * @version 2.0.0
 *
 * Prerequisites: @stellar/stellar-sdk
 *   npm install @stellar/stellar-sdk
 */

// ─── Pool Status ──────────────────────────────────────────────────────────────

export const PoolStatus = {
  0: "Open",
  1: "Active",
  2: "Completed",
  3: "Cancelled",
};

// ─── Network Config ───────────────────────────────────────────────────────────

export const NETWORKS = {
  testnet: {
    rpcUrl: "https://soroban-testnet.stellar.org",
    networkPassphrase: "Test SDF Network ; September 2015",
    horizonUrl: "https://horizon-testnet.stellar.org",
  },
  mainnet: {
    rpcUrl: "https://soroban-mainnet.stellar.org",
    networkPassphrase: "Public Global Stellar Network ; September 2015",
    horizonUrl: "https://horizon.stellar.org",
  },
};

// ─── SDK Class ────────────────────────────────────────────────────────────────

export class EsusuChainSDK {
  /**
   * @param {object} server     - SorobanRpc.Server instance from @stellar/stellar-sdk
   * @param {string} contractId - Deployed EsusuPool contract ID (C...)
   * @param {string} network    - "testnet" | "mainnet"
   */
  constructor(server, contractId, network = "testnet") {
    this.server = server;
    this.contractId = contractId;
    this.network = NETWORKS[network];
  }

  /**
   * Get the current pool status.
   * @returns {Promise<string>} "Open" | "Active" | "Completed" | "Cancelled"
   */
  async getStatus() {
    const { SorobanRpc, Contract, scValToNative } = await import("@stellar/stellar-sdk");
    const contract = new Contract(this.contractId);
    const result = await this.server.simulateTransaction(
      // build a transaction that calls get_status
      // (caller should build + submit using their Freighter-signed keypair)
    );
    return scValToNative(result.result.retval);
  }

  /**
   * Build a transaction to join a pool.
   * Sign and submit with Freighter / a Stellar keypair.
   *
   * @param {string} memberPublicKey - Member's Stellar public key (G...)
   * @returns {Promise<Transaction>} Unsigned transaction ready for signing
   */
  async buildJoinTx(memberPublicKey) {
    const {
      TransactionBuilder, Networks, BASE_FEE,
      Contract, SorobanRpc, Address,
    } = await import("@stellar/stellar-sdk");

    const account = await this.server.getAccount(memberPublicKey);
    const contract = new Contract(this.contractId);

    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: this.network.networkPassphrase,
    })
      .addOperation(
        contract.call("join", Address.fromString(memberPublicKey).toScVal())
      )
      .setTimeout(30)
      .build();

    return await this.server.prepareTransaction(tx);
  }

  /**
   * Build a contribute transaction for the current round.
   *
   * @param {string} memberPublicKey
   * @returns {Promise<Transaction>}
   */
  async buildContributeTx(memberPublicKey) {
    const {
      TransactionBuilder, BASE_FEE, Contract, Address,
    } = await import("@stellar/stellar-sdk");

    const account = await this.server.getAccount(memberPublicKey);
    const contract = new Contract(this.contractId);

    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: this.network.networkPassphrase,
    })
      .addOperation(
        contract.call("contribute", Address.fromString(memberPublicKey).toScVal())
      )
      .setTimeout(30)
      .build();

    return await this.server.prepareTransaction(tx);
  }

  /**
   * Build a finalize_round transaction (admin only).
   *
   * @param {string} adminPublicKey
   * @returns {Promise<Transaction>}
   */
  async buildFinalizeRoundTx(adminPublicKey) {
    const {
      TransactionBuilder, BASE_FEE, Contract, Address,
    } = await import("@stellar/stellar-sdk");

    const account = await this.server.getAccount(adminPublicKey);
    const contract = new Contract(this.contractId);

    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: this.network.networkPassphrase,
    })
      .addOperation(
        contract.call("finalize_round", Address.fromString(adminPublicKey).toScVal())
      )
      .setTimeout(30)
      .build();

    return await this.server.prepareTransaction(tx);
  }

  /**
   * Submit a signed transaction to the network.
   *
   * @param {Transaction} signedTx - Transaction signed by Freighter or keypair
   * @returns {Promise<object>}    - Soroban RPC send result
   */
  async submitTransaction(signedTx) {
    const { SorobanRpc } = await import("@stellar/stellar-sdk");
    let sendResponse = await this.server.sendTransaction(signedTx);

    // Poll until confirmed
    while (sendResponse.status === "PENDING" || sendResponse.status === "NOT_FOUND") {
      await new Promise((r) => setTimeout(r, 1500));
      sendResponse = await this.server.getTransaction(sendResponse.hash);
    }

    if (sendResponse.status !== SorobanRpc.Api.GetTransactionStatus.SUCCESS) {
      throw new Error(`Transaction failed: ${JSON.stringify(sendResponse)}`);
    }

    return sendResponse;
  }
}

export default EsusuChainSDK;
