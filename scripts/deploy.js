// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require('hardhat')

async function main() {
  // Deploy deployers
  const TokenBaseDeployer = await hre.ethers.getContractFactory(
    'TokenBaseDeployer'
  )
  const NFTBaseDeployer = await hre.ethers.getContractFactory('NFTBaseDeployer')
  const FixedPricePeriodDeployer = await hre.ethers.getContractFactory(
    'FixedPricePeriodDeployer'
  )
  const FixedPricePeriodicDeployer = await hre.ethers.getContractFactory(
    'FixedPricePeriodicDeployer'
  )

  const tokenBaseDeployer = await TokenBaseDeployer.deploy()
  const nftBaseDeployer = await NFTBaseDeployer.deploy()
  const fixedPricePeriodDeployer = await FixedPricePeriodDeployer.deploy()
  const fixedPricePeriodicDeployer = await FixedPricePeriodicDeployer.deploy()
  await tokenBaseDeployer.deployed()
  await nftBaseDeployer.deployed()
  await fixedPricePeriodDeployer.deployed()
  await fixedPricePeriodicDeployer.deployed()

  console.log('TokenBaseDeployer address: ' + tokenBaseDeployer.address)
  console.log('NFTBaseDeployer address: ' + nftBaseDeployer.address)
  console.log(
    'FixedPricePeriodDeployer address: ' + fixedPricePeriodDeployer.address
  )
  console.log(
    'FixedPricePeriodicDeployer address: ' + fixedPricePeriodicDeployer.address
  )

  // Deploy Factory
  const Factory = await hre.ethers.getContractFactory('Factory')
  const factory = await Factory.deploy(
    tokenBaseDeployer.address,
    nftBaseDeployer.address,
    fixedPricePeriodDeployer.address,
    fixedPricePeriodicDeployer.address
  )
  await factory.deployed()
  console.log('Factory address: ' + factory.address)
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
