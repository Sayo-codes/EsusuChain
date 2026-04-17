const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("─────────────────────────────────────────");
  console.log("  EsusuChain Deployment");
  console.log("─────────────────────────────────────────");
  console.log(`  Deployer : ${deployer.address}`);
  console.log(
    `  Balance  : ${hre.ethers.formatEther(
      await hre.ethers.provider.getBalance(deployer.address)
    )} ETH`
  );
  console.log("─────────────────────────────────────────");

  // Deploy EsusuFactory
  console.log("\n[1/2] Deploying EsusuFactory...");
  const EsusuFactory = await hre.ethers.getContractFactory("EsusuFactory");
  const factory = await EsusuFactory.deploy();
  await factory.waitForDeployment();

  const factoryAddr = await factory.getAddress();
  console.log(`      ✅ EsusuFactory deployed to: ${factoryAddr}`);

  // Create a demo pool via the factory
  console.log("\n[2/2] Creating demo pool via factory...");
  const tx = await factory.createPool(
    "Demo Savings Circle",
    hre.ethers.parseEther("0.01"), // 0.01 ETH per round
    7 * 24 * 60 * 60,              // 7-day cycles
    5                               // 5 members
  );
  const receipt = await tx.wait();

  // Parse PoolDeployed event
  const factoryInterface = EsusuFactory.interface;
  let poolAddress;
  for (const log of receipt.logs) {
    try {
      const parsed = factoryInterface.parseLog(log);
      if (parsed && parsed.name === "PoolDeployed") {
        poolAddress = parsed.args.pool;
      }
    } catch {}
  }

  console.log(`      ✅ Demo EsusuPool deployed to: ${poolAddress}`);

  console.log("\n─────────────────────────────────────────");
  console.log("  Deployment Summary");
  console.log("─────────────────────────────────────────");
  console.log(`  EsusuFactory : ${factoryAddr}`);
  console.log(`  Demo Pool    : ${poolAddress}`);
  console.log("─────────────────────────────────────────");
  console.log("\nSave these addresses in your .env and frontend config!");

  // Write addresses to a JSON file for the frontend
  const fs = require("fs");
  const deployData = {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    factory: factoryAddr,
    demoPool: poolAddress,
    deployedAt: new Date().toISOString(),
  };

  fs.writeFileSync(
    "deployments.json",
    JSON.stringify(deployData, null, 2)
  );
  console.log("\n  ✅ Saved to deployments.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
