// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
  // Deploy deployers
  const MyERC20Token = await hre.ethers.getContractFactory("MyERC20Token");
  const MyERC721Token = await hre.ethers.getContractFactory("MyERC721Token");

  const myERC20Token = await MyERC20Token.deploy("my20Token", "MY20");
  const myERC721Token = await MyERC721Token.deploy("my721Token", "MY721", "ipfs://");

  console.log("myERC20Token address: " + myERC20Token.address);
  console.log("myERC721Token address: " + myERC721Token.address);

  console.log("Factories on set.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
