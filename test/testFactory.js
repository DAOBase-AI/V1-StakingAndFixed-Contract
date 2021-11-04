const hre = require('hardhat')
const { expect, should } = require('chai')
const { deployMockContract } = require('ethereum-waffle')
const { smock } = require('@defi-wonderland/smock')
const erc20_abi = require('./erc20.json')
const { ethers } = require('ethers')

describe('Beeper Dao Contracts', function () {
  beforeEach(async () => {
    //Preparing the env
    ;[this.deployer, this.creator, this.user1, this.user2, this.user3] =
      await hre.ethers.getSigners()

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

    //Deploy Factory & Three deployer
    this.tokenBaseDeployer = await this.TokenBaseDeployer.deploy()
    this.nftBaseDeployer = await this.NFTBaseDeployer.deploy()
    this.fixedPriceDeployer = await this.FixedPriceDeployer.deploy()

    await this.fixedPriceDeployer.deployed()
    await this.nftBaseDeployer.deployed()
    await this.tokenBaseDeployer.deployed()

    this.factory = await this.Factory.deploy(
      this.tokenBaseDeployer.address,
      this.nftBaseDeployer.address,
      this.fixedPriceDeployer.address
    )
  })

  describe('TokenBase Test', () => {
    beforeEach(async () => {
      this.rate = 1000

      //mock a creator erc20 token
      // this.creatorERC20 = await deployMockContract(this.creator, erc20_abi)
      this.creatorERC20 = await smock.fake(erc20_abi)

      const tx = await this.factory
        .connect(this.creator)
        .tokenBaseDeploy(
          'test_name',
          'test_symbol',
          'https://test_url.com/',
          this.creatorERC20.address,
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
        expect(await this.tokenBase.erc20()).to.eq(this.creatorERC20.address)
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
        // user 1 mint with token id 1
        this.creatorERC20.transferFrom.returns(true)
        await expect(this.tokenBase.connect(this.user1).mint())
          .to.emit(this.tokenBase, 'Mint')
          .withArgs(this.user1.address, 1)

        //user 3 mint with token id 2
        this.creatorERC20.transferFrom.returns(true)
        await expect(this.tokenBase.connect(this.user3).mint())
          .to.emit(this.tokenBase, 'Mint')
          .withArgs(this.user3.address, 2)
      })

      it('reverted when receive erc20 failed', async () => {
        //user 2 failed
        await this.creatorERC20.transferFrom.returns(false)
        await expect(
          this.tokenBase.connect(this.user2).mint()
        ).to.be.revertedWith('ERC20: transfer failed')
      })

      it('succeeds when user1 mint and uesr1 burn', async () => {
        // user 1 mint a token
        this.creatorERC20.transferFrom.returns(true)
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
        // user 1 mint a token
        this.creatorERC20.transferFrom.returns(true)
        await expect(this.tokenBase.connect(this.user1).mint())
          .to.emit(this.tokenBase, 'Mint')
          .withArgs(this.user1.address, 1)

        await expect(
          this.tokenBase.connect(this.user2).burn(1)
        ).to.be.revertedWith('ERC721Burnable: caller is not owner nor approved')
      })

      it('reverted when user burn a nonexistent token', async () => {
        // user 1 mint a token
        this.creatorERC20.transferFrom.returns(true)
        await expect(this.tokenBase.connect(this.user1).mint())
          .to.emit(this.tokenBase, 'Mint')
          .withArgs(this.user1.address, 1)

        await expect(
          this.tokenBase.connect(this.user1).burn(2)
        ).to.be.revertedWith('ERC721: operator query for nonexistent token')
      })
    })
  })
})
