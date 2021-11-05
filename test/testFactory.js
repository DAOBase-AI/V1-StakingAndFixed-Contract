const hre = require('hardhat')
const { expect, should } = require('chai')
const { ethers } = require('ethers')

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
    this.FixedPriceDeployer = await hre.ethers.getContractFactory(
      'FixedPriceDeployer'
    )
    this.Factory = await hre.ethers.getContractFactory('Factory')

    //Deploy Factory & Three deployer & ERC20Token
    this.tokenBaseDeployer = await this.TokenBaseDeployer.deploy()
    this.nftBaseDeployer = await this.NFTBaseDeployer.deploy()
    this.fixedPriceDeployer = await this.FixedPriceDeployer.deploy()
    this.erc20 = await this.ERC20Factory.deploy('Test Token', 'TT')

    await this.fixedPriceDeployer.deployed()
    await this.nftBaseDeployer.deployed()
    await this.tokenBaseDeployer.deployed()
    await this.erc20.deployed()

    this.factory = await this.Factory.deploy(
      this.tokenBaseDeployer.address,
      this.nftBaseDeployer.address,
      this.fixedPriceDeployer.address
    )
  })

  describe('TokenBase Test', () => {
    beforeEach(async () => {
      this.rate = 1000

      const tx = await this.factory
        .connect(this.creator)
        .tokenBaseDeploy(
          'test_name',
          'test_symbol',
          'https://test_url.com/',
          this.erc20.address,
          this.rate
        )
      const receipt = await tx.wait()
      // console.log(receipt);
      this.tokenBaseAddr = receipt.events[0].args[0]
      let tokenBaseFactory = await hre.ethers.getContractFactory('TokenBase')
      // this.tokerBase = this.tokenBaseFactory.attach(this.tokenBaseAddress)
      this.tokenBase = tokenBaseFactory.attach(this.tokenBaseAddr)
    })

    describe('Public Info Check: owner, erc20 Address, rate', () => {
      it('check base info', async () => {
        expect(await this.tokenBase.owner()).to.eq(this.creator.address)
        expect(await this.tokenBase.erc20()).to.eq(this.erc20.address)
        expect(await this.tokenBase.rate()).to.eq(this.rate)
      })

      it('only owner can set baseUrl', async () => {
        const newBaseUrl = 'https://newBaserul.com/'
        await expect(this.tokenBase.setBaseURI(newBaseUrl)).to.be.revertedWith(
          'TokenBase: not the owner'
        )
      })
    })

    describe('Mint & Burn', () => {
      it('succeeds when receive erc20 ', async () => {
        // mock erc20 balance
        await this.erc20.mint(this.user1.address, this.rate)
        await this.erc20.mint(this.user3.address, this.rate)
        await this.erc20
          .connect(this.user1)
          .approve(this.tokenBaseAddr, this.rate)
        await this.erc20
          .connect(this.user3)
          .approve(this.tokenBaseAddr, this.rate)

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
        await this.erc20.mint(this.user1.address, this.rate)
        await this.erc20
          .connect(this.user1)
          .approve(this.tokenBaseAddr, this.rate)

        // user 1 mint a token
        await expect(this.tokenBase.connect(this.user1).mint())
          .to.emit(this.tokenBase, 'Mint')
          .withArgs(this.user1.address, 1)

        await expect(this.tokenBase.connect(this.user1).burn('1'))
          .to.emit(this.tokenBase, 'Burn')
          .withArgs(this.user1.address, 1)
          .to.emit(this.tokenBase, 'Transfer')
          .withArgs(this.user1.address, ethers.constants.AddressZero, 1)
      })

      it('reverted when user1 mint , user2 burn', async () => {
        // mock erc20 balance
        await this.erc20.mint(this.user1.address, this.rate)
        await this.erc20
          .connect(this.user1)
          .approve(this.tokenBaseAddr, this.rate)

        // user 1 mint a token
        await expect(this.tokenBase.connect(this.user1).mint())
          .to.emit(this.tokenBase, 'Mint')
          .withArgs(this.user1.address, 1)

        await expect(
          this.tokenBase.connect(this.user2).burn(1)
        ).to.be.revertedWith('ERC721Burnable: caller is not owner nor approved')
      })

      it('reverted when user burn a nonexistent token', async () => {
        // mock erc20 balance
        await this.erc20.mint(this.user1.address, this.rate)
        await this.erc20
          .connect(this.user1)
          .approve(this.tokenBaseAddr, this.rate)

        // user 1 mint a token
        await expect(this.tokenBase.connect(this.user1).mint())
          .to.emit(this.tokenBase, 'Mint')
          .withArgs(this.user1.address, 1)

        await expect(
          this.tokenBase.connect(this.user1).burn(2)
        ).to.be.revertedWith('ERC721: operator query for nonexistent token')
      })
    })
  })

  describe('FixPrice Test', () => {
    beforeEach(async () => {
      this.rate = 1000
      this.maxSupply = 100

      const tx = await this.factory
        .connect(this.creator)
        .fixedPriceDeploy(
          'test_name',
          'test_symbol',
          'https://test_url.com/',
          this.erc20.address,
          this.rate,
          this.maxSupply
        )
      const receipt = await tx.wait()
      // console.log(receipt);
      this.fixedPriceAddr = receipt.events[0].args[0]
      let fixedPriceFactory = await hre.ethers.getContractFactory('FixedPrice')
      this.fixedPrice = fixedPriceFactory.attach(this.fixedPriceAddr)
    })

    describe('Public Info Check: owner, erc20 Address, rate, maxSupply, platform, platformRate', () => {
      it('check base info', async () => {
        expect(await this.fixedPrice.owner()).to.eq(this.creator.address)
        expect(await this.fixedPrice.erc20()).to.eq(this.erc20.address)
        expect(await this.fixedPrice.rate()).to.eq(this.rate)
        expect(await this.fixedPrice.maxSupply()).to.eq(this.maxSupply)
        expect(await this.fixedPrice.platform()).to.eq(
          ethers.constants.AddressZero
        )
        expect(await this.fixedPrice.platformRate()).to.eq(0)
      })

      it('only owner can set baseUrl', async () => {
        const newBaseUrl = 'https://newBaserul.com/'
        await expect(this.fixedPrice.setBaseURI(newBaseUrl)).to.be.revertedWith(
          'FixedPrice: not the owner'
        )
      })

      it('setFeeParameters', async () => {
        this.platformRate = 5
        await this.fixedPrice.setFeeParameters(
          this.platform.address,
          this.platformRate
        )
        expect(await this.fixedPrice.platform()).to.eq(this.platform.address)
        expect(await this.fixedPrice.platformRate()).to.eq(this.platformRate)

        await expect(
          this.fixedPrice.setFeeParameters(
            this.platform.address,
            this.platformRate
          )
        ).to.be.revertedWith(
          'FixedPrice: commission account and rate cannot be modified.'
        )
      })
    })

    describe('Mint & Bunr', () => {
      it('succeeds when receive erc20', async () => {
        // mock erc20 balance
        await this.erc20.mint(this.user1.address, this.rate)
        await this.erc20.mint(this.user3.address, this.rate)
        await this.erc20
          .connect(this.user1)
          .approve(this.fixedPriceAddr, this.rate)
        await this.erc20
          .connect(this.user3)
          .approve(this.fixedPriceAddr, this.rate)

        // user 1 mint with token id 1
        await expect(this.fixedPrice.connect(this.user1).mint())
          .to.emit(this.fixedPrice, 'Mint')
          .withArgs(this.user1.address, 1)

        //user 3 mint with token id 2
        await expect(this.fixedPrice.connect(this.user3).mint())
          .to.emit(this.fixedPrice, 'Mint')
          .withArgs(this.user3.address, 2)
      })

      it('reverted when receive erc20 failed', async () => {
        // user 2 failed
        await expect(this.fixedPrice.connect(this.user2).mint()).to.be.reverted
      })

      it('succeeds when user1 mint (no platform fee)', async () => {
        // mock erc20 balance
        await this.erc20.mint(this.user1.address, this.rate)
        await this.erc20
          .connect(this.user1)
          .approve(this.fixedPriceAddr, this.rate)

        // user 1 mint a token
        await expect(this.fixedPrice.connect(this.user1).mint())
          .to.emit(this.fixedPrice, 'Mint')
          .withArgs(this.user1.address, 1)

        await expect(
          this.fixedPrice.connect(this.user1).withdraw()
        ).to.be.revertedWith('FixedPrice: caller is not the owner')

        await expect(this.fixedPrice.connect(this.creator).withdraw())
          .to.emit(this.fixedPrice, 'Withdraw')
          .withArgs(this.creator.address, this.rate)
      })

      it('succeeds when user1 mint (with platform fee)', async () => {
        // mock erc20 balance
        await this.erc20.mint(this.user1.address, this.rate)
        await this.erc20
          .connect(this.user1)
          .approve(this.fixedPriceAddr, this.rate)
        await this.erc20.mint(this.user2.address, this.rate)
        await this.erc20
          .connect(this.user2)
          .approve(this.fixedPriceAddr, this.rate)

        // setFeeParameters
        await expect(
          this.fixedPrice.connect(this.user1).withdraw()
        ).to.be.revertedWith('FixedPrice: caller is not the owner')

        this.platformRate = 5
        await this.fixedPrice.setFeeParameters(
          this.platform.address,
          this.platformRate
        )
        expect(await this.fixedPrice.platform()).to.eq(this.platform.address)
        expect(await this.fixedPrice.platformRate()).to.eq(this.platformRate)

        // user 1 mint a token
        await expect(this.fixedPrice.connect(this.user1).mint())
          .to.emit(this.fixedPrice, 'Mint')
          .withArgs(this.user1.address, 1)
        await expect(this.fixedPrice.connect(this.user2).mint())
          .to.emit(this.fixedPrice, 'Mint')
          .withArgs(this.user2.address, 2)

        await expect(this.fixedPrice.connect(this.creator).withdraw())
          .to.emit(this.fixedPrice, 'Withdraw')
          .withArgs(
            this.creator.address,
            this.rate * 2 * (1 - this.platformRate / 100)
          )
      })
    })
  })
})
