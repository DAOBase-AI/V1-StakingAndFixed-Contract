// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
  // Deploy deployers
  const AlphaDeployer = await hre.ethers.getContractFactory("AlphaDeployer");
  const BetaDeployer = await hre.ethers.getContractFactory("BetaDeployer");
  const GammaDeployer = await hre.ethers.getContractFactory("GammaDeployer");
  const DeltaDeployer = await hre.ethers.getContractFactory("DeltaDeployer");

  const alphaDeployer = await AlphaDeployer.deploy();
  const betaDeployer = await BetaDeployer.deploy();
  const gammaDeployer = await GammaDeployer.deploy();
  const deltaDeployer = await DeltaDeployer.deploy();

  // Deploy MegaFactory
  const MegaFactory = await hre.ethers.getContractFactory("Factory");
  const megaFactory = await MegaFactory.deploy(
    alphaDeployer.address, 
    betaDeployer.address, 
    gammaDeployer.address, 
    deltaDeployer.address
  );

  await megaFactory.deployed();

  console.log("Factories on set.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
