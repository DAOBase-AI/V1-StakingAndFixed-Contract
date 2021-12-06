const { expect, should } = require('chai')

const { network } = require('hardhat')

describe('Beeper Dao NFTBase Contracts', function () {
  before(async () => {
    //Preparing the env
    ;[this.deployer, this.creator, this.platform, ...this.user] =
      await hre.ethers.getSigners()

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
    this.FixedPeriodDeployer = await this.FixedPeriodDeployer.deploy()
    this.FixedPriceDeployer = await this.FixedPriceDeployer.deploy()
    this.erc20 = await this.ERC20Factory.deploy('Test Token', 'TT')

    await this.FixedPeriodDeployer.deployed()
    await this.FixedPriceDeployer.deployed()
    await this.nftBaseDeployer.deployed()
    await this.tokenBaseDeployer.deployed()
    await this.erc20.deployed()

    this.factory = await this.Factory.deploy(
      this.tokenBaseDeployer.address,
      this.nftBaseDeployer.address,
      this.FixedPeriodDeployer.address,
      this.FixedPeriodDeployer.address
    )

    let constructorParms = ['test_name', 'test_symbol', 'https://test_url.com/']

    this.ERC721Factory = await ethers.getContractFactory('ERC721Token')
    this.erc721 = await this.ERC721Factory.deploy(...constructorParms)
    await this.erc721.deployed()

    constructorParms.push(this.erc721.address)

    const tx = await this.factory
      .connect(this.creator)
      .nftBaseDeploy(...constructorParms)
    const receipt = await tx.wait()
    // console.log(receipt);
    for (const event of receipt.events) {
      switch (event.event) {
        case 'NFTBaseDeploy': {
          this.nftBaseAddr = event.args[0]
        }
      }
    }

    this.NFTBaseFactory = await hre.ethers.getContractFactory('NFTBase')
    // this.tokerBase = this.tokenBaseFactory.attach(this.tokenBaseAddress)
    this.nftBase = this.NFTBaseFactory.attach(this.nftBaseAddr)
  })

  describe('NFTBase Test', () => {
    before(async () => {
      for (let i = 1; i <= 8; i++) {
        await this.erc721.mint(this.user[i].address)
      }
    })

    it('test mint & burn', async () => {
      for (let i = 1; i <= 8; i++) {
        await this.erc721.connect(this.user[i]).approve(this.nftBase.address, i)
        await this.nftBase.connect(this.user[i]).mint(i)
        await this.nftBase.connect(this.user[i]).burn(i)
      }
    })
  })
})
