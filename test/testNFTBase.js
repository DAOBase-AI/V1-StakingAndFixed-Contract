const hre = require('hardhat')
const { expect, should } = require('chai')
const { ethers } = require('ethers')
const { network } = require('hardhat')

describe('Beeper Dao Contracts', function () {
  beforeEach(async () => {
    //Preparing the env
    ;[
      this.deployer,
      this.creator,
      this.platform,
      this.user1,
      this.user2,
      this.user3,
    ] = await hre.ethers.getSigners()

    this.ERC20Factory = await hre.ethers.getContractFactory('ERC20Token')

    this.TokenBaseDeployer = await hre.ethers.getContractFactory(
      'TokenBaseDeployer'
    )
    this.NFTBaseDeployer = await hre.ethers.getContractFactory(
      'NFTBaseDeployer'
    )
    this.FixedPricePeriodDeployer = await hre.ethers.getContractFactory(
      'FixedPricePeriodDeployer'
    )
    this.FixedPricePeriodicDeployer = await hre.ethers.getContractFactory(
      'FixedPricePeriodicDeployer'
    )
    this.Factory = await hre.ethers.getContractFactory('Factory')

    //Deploy Factory & Three deployer & ERC20Token
    this.tokenBaseDeployer = await this.TokenBaseDeployer.deploy()
    this.nftBaseDeployer = await this.NFTBaseDeployer.deploy()
    this.FixedPricePeriodDeployer = await this.FixedPricePeriodDeployer.deploy()
    this.FixedPricePeriodicDeployer =
      await this.FixedPricePeriodicDeployer.deploy()
    this.erc20 = await this.ERC20Factory.deploy('Test Token', 'TT')

    await this.FixedPricePeriodDeployer.deployed()
    await this.FixedPricePeriodicDeployer.deployed()
    await this.nftBaseDeployer.deployed()
    await this.tokenBaseDeployer.deployed()
    await this.erc20.deployed()

    this.factory = await this.Factory.deploy(
      this.tokenBaseDeployer.address,
      this.nftBaseDeployer.address,
      this.FixedPricePeriodDeployer.address,
      this.FixedPricePeriodDeployer.address
    )
  })

  describe('NFTBase Test', () => {})
})
