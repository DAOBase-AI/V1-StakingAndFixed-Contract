const hre = require('hardhat')
const { expect, should } = require('chai')
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
    this.FixedPeriodDeployer = await this.FixedPeriodDeployer.deploy()
    this.FixedPriceDeployer = await this.FixedPriceDeployer.deploy()
    this.erc20 = await this.ERC20Factory.deploy('Test Token', 'TT', 6)

    await this.FixedPeriodDeployer.deployed()
    await this.FixedPriceDeployer.deployed()
    await this.nftBaseDeployer.deployed()
    await this.tokenBaseDeployer.deployed()
    await this.erc20.deployed()

    this.factory = await this.Factory.deploy(
      this.tokenBaseDeployer.address,
      this.nftBaseDeployer.address,
      this.FixedPeriodDeployer.address,
      this.FixedPeriodDeployer.address,
      this.platform.address,
      0
    )
  })

  it('should failed if factory not the owner of deployer', async () => {
    this.initialRate = 1000

    await expect(
      this.factory
        .connect(this.creator)
        .tokenBaseDeploy(
          'test_name',
          'test_symbol',
          'https://test_url.com/',
          this.erc20.address,
          this.initialRate
        )
    ).to.be.revertedWith('Ownable: caller is not the owner')
  })

  describe('TokenBase Test', () => {
    before(async () => {
      this.initialRate = 1000

      await this.tokenBaseDeployer.transferOwnership(this.factory.address)

      const tx = await this.factory
        .connect(this.creator)
        .tokenBaseDeploy(
          'test_name',
          'test_symbol',
          'https://test_url.com/',
          this.erc20.address,
          this.initialRate
        )
      const receipt = await tx.wait()
      // console.log(receipt);
      for (const event of receipt.events) {
        switch (event.event) {
          case 'TokenBaseDeploy': {
            this.tokenBaseAddr = event.args[0]
          }
        }
      }

      let tokenBaseFactory = await hre.ethers.getContractFactory('TokenBase')
      // this.tokerBase = this.tokenBaseFactory.attach(this.tokenBaseAddress)
      this.tokenBase = tokenBaseFactory.attach(this.tokenBaseAddr)
    })

    describe('Public Info Check: owner, erc20 Address, rate', () => {
      it('check base info', async () => {
        expect(await this.tokenBase.owner()).to.eq(this.creator.address)
        expect(await this.tokenBase.erc20()).to.eq(this.erc20.address)
        expect(await this.tokenBase.rate()).to.eq(this.initialRate)
      })

      it('only owner can set baseUrl', async () => {
        const newBaseUrl = 'https://newBaserul.com/'
        await expect(this.tokenBase.setBaseURI(newBaseUrl)).to.be.revertedWith(
          'Ownable: caller is not the owner'
        )

        await expect(
          this.tokenBase.connect(this.creator).setBaseURI(newBaseUrl)
        )
          .to.be.emit(this.tokenBase, 'SetBaseURI')
          .withArgs('https://newBaserul.com/')
      })

      it('shoul failed when freezed url', async () => {
        const newBaseUrl = 'https://newBaserul.com/'
        await expect(
          this.tokenBase.connect(this.creator).freezeBaseURI()
        ).to.emit(this.tokenBase, 'BaseURIFrozen')
        await await expect(
          this.tokenBase.connect(this.creator).setBaseURI(newBaseUrl)
        ).to.be.revertedWith('baseURI has been frozen')
      })
    })

    describe('Mint & Burn', () => {
      it('succeeds when receive erc20 ', async () => {
        // mock erc20 balance
        await this.erc20.mint(this.user1.address, this.initialRate)
        await this.erc20.mint(this.user3.address, this.initialRate)
        await this.erc20
          .connect(this.user1)
          .approve(this.tokenBaseAddr, this.initialRate)
        await this.erc20
          .connect(this.user3)
          .approve(this.tokenBaseAddr, this.initialRate)

        // user 1 mint with token id 1
        await expect(this.tokenBase.connect(this.user1).mint())
          .to.emit(this.tokenBase, 'Mint')
          .withArgs(this.user1.address, 1)

        //user 3 mint with token id 2
        await expect(this.tokenBase.connect(this.user3).mint())
          .to.emit(this.tokenBase, 'Mint')
          .withArgs(this.user3.address, 2)
      })

      it('reverted when receive erc20 failed', async () => {
        //user 2 failed
        await expect(this.tokenBase.connect(this.user2).mint()).to.be.reverted
      })

      it('succeeds when user1 mint and uesr1 burn', async () => {
        // mock erc20 balance
        await this.erc20.mint(this.user1.address, this.initialRate)
        await this.erc20
          .connect(this.user1)
          .approve(this.tokenBaseAddr, this.initialRate)

        // user 1 mint a token
        await expect(this.tokenBase.connect(this.user1).mint())
          .to.emit(this.tokenBase, 'Mint')
          .withArgs(this.user1.address, 3)

        await expect(this.tokenBase.connect(this.user1).burn('3'))
          .to.emit(this.tokenBase, 'Burn')
          .withArgs(this.user1.address, 3)
          .to.emit(this.tokenBase, 'Transfer')
          .withArgs(this.user1.address, ethers.constants.AddressZero, 3)
      })

      it('reverted when user1 mint , user2 burn', async () => {
        // mock erc20 balance
        await this.erc20.mint(this.user1.address, this.initialRate)
        await this.erc20
          .connect(this.user1)
          .approve(this.tokenBaseAddr, this.initialRate)

        // user 1 mint a token
        await expect(this.tokenBase.connect(this.user1).mint())
          .to.emit(this.tokenBase, 'Mint')
          .withArgs(this.user1.address, 4)

        await expect(
          this.tokenBase.connect(this.user2).burn(4)
        ).to.be.revertedWith('ERC721Burnable: caller is not owner nor approved')
      })

      it('reverted when user burn a nonexistent token', async () => {
        // mock erc20 balance
        await this.erc20.mint(this.user1.address, this.initialRate)
        await this.erc20
          .connect(this.user1)
          .approve(this.tokenBaseAddr, this.initialRate)

        // user 1 mint a token
        await expect(this.tokenBase.connect(this.user1).mint())
          .to.emit(this.tokenBase, 'Mint')
          .withArgs(this.user1.address, 5)

        await expect(
          this.tokenBase.connect(this.user1).burn(7)
        ).to.be.revertedWith('ERC721: operator query for nonexistent token')
      })
    })
  })
})
