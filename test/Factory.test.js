const hre = require('hardhat')
const { expect, should } = require('chai')
const { ethers } = require('ethers')
const { network } = require('hardhat')

describe('Beeper Dao Contracts', function () {
  before(async () => {
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
    this.FixedPeriodDeployer = await hre.ethers.getContractFactory(
      'FixedPeriodDeployer'
    )
    this.FixedPriceDeployer = await hre.ethers.getContractFactory(
      'FixedPriceDeployer'
    )
    this.Factory = await hre.ethers.getContractFactory('Factory')

    //Deploy Factory & Three deployer & ERC20Token
    this.tokenBaseDeployer = await this.TokenBaseDeployer.deploy()
    this.nftBaseDeployer = await this.NFTBaseDeployer.deploy()
    this.fixedPeriodDeployer = await this.FixedPeriodDeployer.deploy()
    this.fixedPriceDeployer = await this.FixedPriceDeployer.deploy()
    this.erc20 = await this.ERC20Factory.deploy('Test Token', 'TT')

    await this.fixedPeriodDeployer.deployed()
    await this.fixedPriceDeployer.deployed()
    await this.nftBaseDeployer.deployed()
    await this.tokenBaseDeployer.deployed()
    await this.erc20.deployed()
  })

  describe('Factory Timelock Test', () => {
    it('should deploy factory failed when platform address ', async () => {
      let parms = [
        this.tokenBaseDeployer.address,
        this.nftBaseDeployer.address,
        this.fixedPeriodDeployer.address,
        this.fixedPeriodDeployer.address,
        ethers.constants.AddressZero,
        100,
      ]

      await expect(this.Factory.deploy(...parms)).to.be.revertedWith(
        'Curve: platform address is zero'
      )
    })

    it('should deploy factory failed when platform rate > 100 ', async () => {
      let parms = [
        this.tokenBaseDeployer.address,
        this.nftBaseDeployer.address,
        this.fixedPeriodDeployer.address,
        this.fixedPeriodDeployer.address,
        this.platform.address,
        101,
      ]

      await expect(this.Factory.deploy(...parms)).to.be.revertedWith(
        'Curve: wrong rate'
      )
    })

    it('should deploy factory sucessful', async () => {
      let parms = [
        this.tokenBaseDeployer.address,
        this.nftBaseDeployer.address,
        this.fixedPeriodDeployer.address,
        this.fixedPeriodDeployer.address,
        this.platform.address,
        10,
      ]

      await expect(this.Factory.deploy(...parms)).to.be.not.reverted
    })

    it('should failed when change PlatformParms', async () => {
      let parms = [
        this.tokenBaseDeployer.address,
        this.nftBaseDeployer.address,
        this.fixedPeriodDeployer.address,
        this.fixedPeriodDeployer.address,
        this.platform.address,
        10,
      ]

      this.factory = await this.Factory.deploy(...parms)

      let newPlatformParms = [this.platform.address, 20]

      await expect(
        this.factory.connect(this.creator).setPlatformParms(...newPlatformParms)
      ).to.be.revertedWith('Ownable: caller is not the owner')

      await expect(
        this.factory.setPlatformParms(...newPlatformParms)
      ).to.be.revertedWith('OPERATE_WINDOW_FINISHED')
    })

    it('test timelock', async () => {
      let parms = [
        this.tokenBaseDeployer.address,
        this.nftBaseDeployer.address,
        this.fixedPeriodDeployer.address,
        this.fixedPeriodDeployer.address,
        this.platform.address,
        10,
      ]

      this.factory = await this.Factory.deploy(...parms)

      let newPlatformParms = [this.platform.address, 20]

      await expect(
        this.factory.setPlatformParms(...newPlatformParms)
      ).to.be.revertedWith('OPERATE_WINDOW_FINISHED')

      await expect(this.factory.setPlatformParmsUnlock()).to.be.emit(
        this.factory,
        'SetPlatformParmsUnlock'
      )

      let cooldownStartTimestamp = (
        await hre.ethers.provider.getBlock(
          (this.block = await hre.ethers.provider.getBlockNumber())
        )
      ).timestamp

      let one_day = 864_00
      let two_day = one_day * 2

      await network.provider.send('evm_mine', [
        cooldownStartTimestamp + one_day,
      ])

      await expect(
        this.factory.setPlatformParms(...newPlatformParms)
      ).to.be.revertedWith('INSUFFICIENT_COOLDOWN')

      await network.provider.send('evm_mine', [
        cooldownStartTimestamp + two_day + 1,
      ])

      await expect(this.factory.setPlatformParms(...newPlatformParms)).to.be.not
        .reverted

      await network.provider.send('evm_mine', [
        cooldownStartTimestamp + two_day + one_day + 1,
      ])

      await expect(
        this.factory.setPlatformParms(...newPlatformParms)
      ).to.be.revertedWith('OPERATE_WINDOW_FINISHED')
    })
  })
})
