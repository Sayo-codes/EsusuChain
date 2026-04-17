const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

const ONE_DAY   = 24 * 60 * 60;
const ONE_WEEK  = 7 * ONE_DAY;
const CONTRIB   = ethers.parseEther("0.1");

describe("EsusuPool", function () {
  let factory, pool;
  let owner, alice, bob, carol, dave;

  beforeEach(async function () {
    [owner, alice, bob, carol, dave] = await ethers.getSigners();

    const EsusuFactory = await ethers.getContractFactory("EsusuFactory");
    factory = await EsusuFactory.deploy();

    const tx = await factory.createPool(
      "Test Circle",
      CONTRIB,
      ONE_WEEK,
      4 // 4 members → 4 rounds
    );
    const receipt = await tx.wait();
    let poolAddress;
    for (const log of receipt.logs) {
      try {
        const parsedLog = factory.interface.parseLog(log);
        if (parsedLog && parsedLog.name === "PoolDeployed") {
          poolAddress = parsedLog.args.pool;
          break;
        }
      } catch (e) {}
    }
    pool = await ethers.getContractAt("EsusuPool", poolAddress);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Deployment
  // ──────────────────────────────────────────────────────────────────────────
  describe("Deployment", function () {
    it("sets correct parameters", async function () {
      expect(await pool.name()).to.equal("Test Circle");
      expect(await pool.contributionAmount()).to.equal(CONTRIB);
      expect(await pool.cycleDuration()).to.equal(ONE_WEEK);
      expect(await pool.maxMembers()).to.equal(4);
      expect(await pool.admin()).to.equal(owner.address);
      expect(await pool.status()).to.equal(0); // Open
    });

    it("rejects invalid parameters", async function () {
      const F = await ethers.getContractFactory("EsusuFactory");
      const f = await F.deploy();

      await expect(
        f.createPool("Bad", CONTRIB, ONE_WEEK, 1)
      ).to.be.revertedWith("EsusuPool: minimum 2 members");

      await expect(
        f.createPool("Bad", 0, ONE_WEEK, 3)
      ).to.be.revertedWith("EsusuPool: amount must be positive");

      await expect(
        f.createPool("Bad", CONTRIB, ONE_DAY - 1, 3)
      ).to.be.revertedWith("EsusuPool: cycle must be at least 1 day");
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Joining
  // ──────────────────────────────────────────────────────────────────────────
  describe("Joining", function () {
    it("allows members to join", async function () {
      await pool.connect(alice).join();
      expect(await pool.isMember(alice.address)).to.equal(true);
      expect(await pool.getMembersCount()).to.equal(1);
    });

    it("emits MemberJoined event", async function () {
      await expect(pool.connect(alice).join())
        .to.emit(pool, "MemberJoined")
        .withArgs(alice.address, 1);
    });

    it("prevents double joining", async function () {
      await pool.connect(alice).join();
      await expect(pool.connect(alice).join()).to.be.revertedWith(
        "EsusuPool: already a member"
      );
    });

    it("auto-starts when full", async function () {
      await pool.connect(alice).join();
      await pool.connect(bob).join();
      await pool.connect(carol).join();
      await pool.connect(dave).join(); // 4th member → starts

      expect(await pool.status()).to.equal(1); // Active
      expect(await pool.currentRound()).to.equal(1);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Contributing
  // ──────────────────────────────────────────────────────────────────────────
  describe("Contributing", function () {
    beforeEach(async function () {
      // Fill pool to start it
      await pool.connect(alice).join();
      await pool.connect(bob).join();
      await pool.connect(carol).join();
      await pool.connect(dave).join();
    });

    it("accepts correct contributions", async function () {
      await pool.connect(alice).contribute({ value: CONTRIB });
      const [round, contribs] = await pool.getRoundInfo();
      expect(round).to.equal(1);
      expect(contribs).to.equal(1);
    });

    it("rejects wrong amount", async function () {
      await expect(
        pool.connect(alice).contribute({ value: ethers.parseEther("0.05") })
      ).to.be.revertedWith("EsusuPool: incorrect contribution amount");
    });

    it("prevents double contribution in same round", async function () {
      await pool.connect(alice).contribute({ value: CONTRIB });
      await expect(
        pool.connect(alice).contribute({ value: CONTRIB })
      ).to.be.revertedWith("EsusuPool: already contributed this round");
    });

    it("completes round and assigns winner when all contribute", async function () {
      await pool.connect(alice).contribute({ value: CONTRIB });
      await pool.connect(bob).contribute({ value: CONTRIB });
      await pool.connect(carol).contribute({ value: CONTRIB });

      await expect(pool.connect(dave).contribute({ value: CONTRIB }))
        .to.emit(pool, "RoundCompleted");

      // Winner should have pending withdrawal of 4 * CONTRIB
      const winner = await pool.roundWinner(1);
      expect(await pool.pendingWithdrawals(winner)).to.equal(CONTRIB * 4n);
    });

    it("advances to next round after completion", async function () {
      for (const signer of [alice, bob, carol, dave]) {
        await pool.connect(signer).contribute({ value: CONTRIB });
      }
      expect(await pool.currentRound()).to.equal(2);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Withdrawal
  // ──────────────────────────────────────────────────────────────────────────
  describe("Withdrawal", function () {
    it("allows winner to withdraw their pot", async function () {
      await pool.connect(alice).join();
      await pool.connect(bob).join();
      await pool.connect(carol).join();
      await pool.connect(dave).join();

      for (const signer of [alice, bob, carol, dave]) {
        await pool.connect(signer).contribute({ value: CONTRIB });
      }

      const winner = await pool.roundWinner(1);
      const winnerSigner = [alice, bob, carol, dave].find(
        (s) => s.address === winner
      );

      const balanceBefore = await ethers.provider.getBalance(winnerSigner.address);
      const tx = await pool.connect(winnerSigner).withdraw();
      const receipt2 = await tx.wait();
      const gasUsed = receipt2.gasUsed * receipt2.gasPrice;
      const balanceAfter = await ethers.provider.getBalance(winnerSigner.address);

      expect(balanceAfter + gasUsed - balanceBefore).to.equal(CONTRIB * 4n);
    });

    it("prevents double withdrawal", async function () {
      await pool.connect(alice).join();
      await pool.connect(bob).join();
      await pool.connect(carol).join();
      await pool.connect(dave).join();

      for (const signer of [alice, bob, carol, dave]) {
        await pool.connect(signer).contribute({ value: CONTRIB });
      }

      const winner = await pool.roundWinner(1);
      const winnerSigner = [alice, bob, carol, dave].find(
        (s) => s.address === winner
      );

      await pool.connect(winnerSigner).withdraw();
      await expect(pool.connect(winnerSigner).withdraw()).to.be.revertedWith(
        "EsusuPool: nothing to withdraw"
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Full cycle: 4 members, 4 rounds
  // ──────────────────────────────────────────────────────────────────────────
  describe("Full cycle", function () {
    it("completes all rounds and marks pool as completed", async function () {
      await pool.connect(alice).join();
      await pool.connect(bob).join();
      await pool.connect(carol).join();
      await pool.connect(dave).join();

      const signers = [alice, bob, carol, dave];
      for (let round = 0; round < 4; round++) {
        for (const signer of signers) {
          await pool.connect(signer).contribute({ value: CONTRIB });
        }
      }

      expect(await pool.status()).to.equal(2); // Completed
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Admin: finalizeRound
  // ──────────────────────────────────────────────────────────────────────────
  describe("Admin: finalizeRound", function () {
    it("allows admin to finalize after deadline", async function () {
      await pool.connect(alice).join();
      await pool.connect(bob).join();
      await pool.connect(carol).join();
      await pool.connect(dave).join();

      // Only alice contributes
      await pool.connect(alice).contribute({ value: CONTRIB });

      // Fast-forward past the cycle deadline
      await time.increase(ONE_WEEK + 1);

      await expect(pool.connect(owner).finalizeRound())
        .to.emit(pool, "RoundCompleted");
    });

    it("reverts if round not yet over", async function () {
      await pool.connect(alice).join();
      await pool.connect(bob).join();
      await pool.connect(carol).join();
      await pool.connect(dave).join();

      await expect(pool.connect(owner).finalizeRound()).to.be.revertedWith(
        "EsusuPool: round cycle not yet over"
      );
    });
  });
});

// ──────────────────────────────────────────────────────────────────────────
// EsusuFactory tests
// ──────────────────────────────────────────────────────────────────────────
describe("EsusuFactory", function () {
  let factory;
  let owner, alice;

  beforeEach(async function () {
    [owner, alice] = await ethers.getSigners();
    const EsusuFactory = await ethers.getContractFactory("EsusuFactory");
    factory = await EsusuFactory.deploy();
  });

  it("creates and tracks pools", async function () {
    await factory.createPool("Circle A", CONTRIB, ONE_WEEK, 3);
    await factory.connect(alice).createPool("Circle B", CONTRIB, ONE_WEEK * 2, 5);

    expect(await factory.getTotalPools()).to.equal(2);
    expect((await factory.getPoolsByCreator(owner.address)).length).to.equal(1);
    expect((await factory.getPoolsByCreator(alice.address)).length).to.equal(1);
  });

  it("emits PoolDeployed event", async function () {
    await expect(factory.createPool("Circle A", CONTRIB, ONE_WEEK, 3))
      .to.emit(factory, "PoolDeployed");
  });
});
