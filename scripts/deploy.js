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
  const FixedPeriodDeployer = await hre.ethers.getContractFactory(
    'FixedPeriodDeployer'
  )
  const FixedPriceDeployer = await hre.ethers.getContractFactory(
    'FixedPriceDeployer'
  )

  const tokenBaseDeployer = await TokenBaseDeployer.deploy()
  const nftBaseDeployer = await NFTBaseDeployer.deploy()
  const fixedPeriodDeployer = await FixedPeriodDeployer.deploy()
  const fixedPriceDeployer = await FixedPriceDeployer.deploy()
  await tokenBaseDeployer.deployed()
  await nftBaseDeployer.deployed()
  await fixedPeriodDeployer.deployed()
  await fixedPriceDeployer.deployed()

  console.log('TokenBaseDeployer address: ' + tokenBaseDeployer.address)
  console.log('NFTBaseDeployer address: ' + nftBaseDeployer.address)
  console.log('FixedPeriodDeployer address: ' + fixedPeriodDeployer.address)
  console.log('FixedPriceDeployer address: ' + fixedPriceDeployer.address)

  const platformAddr = '0x98a6a913a8d51ac1235a6fec2ba74eb0ab80f772'
  const platformRate = 2

  const constructorParameter = [
    tokenBaseDeployer.address,
    nftBaseDeployer.address,
    fixedPeriodDeployer.address,
    fixedPriceDeployer.address,
    platformAddr,
    platformRate,
  ]

  // Deploy Factory
  const Factory = await hre.ethers.getContractFactory('Factory')
  const factory = await Factory.deploy(...constructorParameter)
  await factory.deployed()
  console.log('Factory address: ' + factory.address)
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
