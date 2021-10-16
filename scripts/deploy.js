// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
  // Deploy deployers
  const TokenBaseDeployer = await hre.ethers.getContractFactory("TokenBaseDeployer");
  const NFTBaseDeployer = await hre.ethers.getContractFactory("NFTBaseDeployer");
  const FixedPriceDeployer = await hre.ethers.getContractFactory("FixedPriceDeployer");
  // const DeltaDeployer = await hre.ethers.getContractFactory("DeltaDeployer");

  const tokenBaseDeployer = await TokenBaseDeployer.deploy();
  const nftBaseDeployer = await NFTBaseDeployer.deploy();
  const fixedPriceDeployer = await FixedPriceDeployer.deploy();
  // const deltaDeployer = await DeltaDeployer.deploy();

  console.log("TokenBaseDeployer address: " + tokenBaseDeployer.address);
  console.log("NFTBaseDeployer address: " + nftBaseDeployer.address);
  console.log("FixedPriceDeployer address: " + fixedPriceDeployer.address);

  // Deploy MegaFactory
  const MegaFactory = await hre.ethers.getContractFactory("Factory");
  const megaFactory = await MegaFactory.deploy(
    tokenBaseDeployer.address, 
    nftBaseDeployer.address, 
    fixedPriceDeployer.address
    // deltaDeployer.address
  );
  await megaFactory.deployed();  
  console.log("Factory address: " + megaFactory.address);

  console.log("Factories on set.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
