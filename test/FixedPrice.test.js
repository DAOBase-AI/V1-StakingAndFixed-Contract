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
    this.FixedPriceDeployer =
      await this.FixedPriceDeployer.deploy()
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
      this.FixedPriceDeployer.address
    )
  })

  describe('FixPrice  Test', () => {
    describe('FixedPrice with erc20', () => {
      beforeEach(async () => {
        this.rateBN = ethers.utils.parseEther('100')
        this.rate = this.rateBN.toString()

        this.constructorParameter = {
          name: 'test_name',
          symbol: 'test_symbol',
          bURI: 'https://test_url.com/',
          erc20: this.erc20.address,
          rate: this.rate,
          maxSupply: 100,
        }

        const tx = await this.factory
          .connect(this.creator)
          .fixedPriceDeploy(
            this.constructorParameter.name,
            this.constructorParameter.symbol,
            this.constructorParameter.bURI,
            this.constructorParameter.erc20,
            this.constructorParameter.rate,
            this.constructorParameter.maxSupply
          )

        const receipt = await tx.wait()
        for (const event of receipt.events) {
          switch (event.event) {
            case 'FixedPriceDeploy': {
              this.fixedPriceAddr = event.args[0]
            }
          }
        }

        let fixedPriceFactory = await hre.ethers.getContractFactory(
          'FixedPrice'
        )
        this.fixedPrice = fixedPriceFactory.attach(this.fixedPriceAddr)
      })

      describe('Mint Burn & Price Test', () => {
        it('mint succeeds when receive erc20', async () => {
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

        it('mint reverted when receive erc20 failed', async () => {
          // user 2 failed
          await expect(this.fixedPrice.connect(this.user2).mint()).to.be
            .reverted
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

          await this.fixedPrice
            .connect(this.creator)
            .changeBeneficiary(this.user3.address)

          await expect(
            this.fixedPrice.connect(this.user1).withdraw()
          ).to.be.revertedWith(
            `AccessControl: account ${this.user1.address.toLowerCase()} is missing role ${ethers.utils.keccak256(
              ethers.utils.toUtf8Bytes('CREATOR')
            )}`
          )

          await expect(this.fixedPrice.connect(this.user3).withdraw())
            .to.emit(this.fixedPrice, 'Withdraw')
            .withArgs(this.user3.address, this.rate)
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
          this.platformRate = 5
          await this.fixedPrice
            .connect(this.creator)
            .setFeeParameters(this.platform.address, this.platformRate)
          expect(await this.fixedPrice.platform()).to.eq(this.platform.address)
          expect(await this.fixedPrice.platformRate()).to.eq(this.platformRate)

          // user 1 mint a token
          await expect(this.fixedPrice.connect(this.user1).mint())
            .to.emit(this.fixedPrice, 'Mint')
            .withArgs(this.user1.address, 1)
          await expect(this.fixedPrice.connect(this.user2).mint())
            .to.emit(this.fixedPrice, 'Mint')
            .withArgs(this.user2.address, 2)
        })
      })

      describe('Public Info Check', () => {
        it('check base info', async () => {
          expect(await this.fixedPrice.owner()).to.eq(this.creator.address)
          expect(await this.fixedPrice.erc20()).to.eq(this.erc20.address)
          expect(await this.fixedPrice.maxSupply()).to.eq(
            this.constructorParameter.maxSupply
          )
          expect(await this.fixedPrice.platform()).to.eq(
            ethers.constants.AddressZero
          )
          expect(await this.fixedPrice.platformRate()).to.eq(0)
        })

        it('only owner can set baseUrl', async () => {
          const newBaseUrl = 'https://newBaserul.com/'
          await expect(
            this.fixedPrice.setBaseURI(newBaseUrl)
          ).to.be.revertedWith(
            `AccessControl: account ${this.deployer.address.toLowerCase()} is missing role ${ethers.utils.keccak256(
              ethers.utils.toUtf8Bytes('CREATOR')
            )}`
          )
        })

        describe('setFeeParameters', () => {
          it('reverted when not the owner', async () => {
            this.platformRate = 5

            await expect(
              this.fixedPrice.setFeeParameters(
                this.platform.address,
                this.platformRate
              )
            ).to.be.revertedWith(
              `AccessControl: account ${this.deployer.address.toLowerCase()} is missing role ${ethers.utils.keccak256(
                ethers.utils.toUtf8Bytes('CREATOR')
              )}`
            )
          })

          it('can only setFeeParameters once', async () => {
            this.platformRate = 5
            await this.fixedPrice
              .connect(this.creator)
              .setFeeParameters(this.platform.address, this.platformRate)
            expect(await this.fixedPrice.platform()).to.eq(
              this.platform.address
            )
            expect(await this.fixedPrice.platformRate()).to.eq(
              this.platformRate
            )

            await expect(
              this.fixedPrice
                .connect(this.creator)
                .setFeeParameters(this.platform.address, this.platformRate)
            ).to.be.revertedWith('has set beneficiary & rate')
          })
        })
      })
    })

    describe('FixedPrice with ether', () => {
      beforeEach(async () => {
        this.rateBN = ethers.utils.parseEther('100')
        this.rate = this.rateBN.toString()

        this.constructorParameter = {
          name: 'test_name',
          symbol: 'test_symbol',
          bURI: 'https://test_url.com/',
          erc20: ethers.constants.AddressZero,
          rate: this.rate,
          maxSupply: 100,
        }

        const tx = await this.factory
          .connect(this.creator)
          .fixedPriceDeploy(
            this.constructorParameter.name,
            this.constructorParameter.symbol,
            this.constructorParameter.bURI,
            this.constructorParameter.erc20,
            this.constructorParameter.rate,
            this.constructorParameter.maxSupply
          )

        const receipt = await tx.wait()
        for (const event of receipt.events) {
          switch (event.event) {
            case 'FixedPriceDeploy': {
              this.fixedPriceAddr = event.args[0]
            }
          }
        }

        this.options = {
          value: this.rate,
        }
        this.shortOptions = {
          value: ethers.utils.parseEther((this.rateBN / 2).toString()),
        }

        let fixedPriceFactory = await hre.ethers.getContractFactory(
          'FixedPrice'
        )

        this.fixedPrice = fixedPriceFactory.attach(this.fixedPriceAddr)
      })

      describe('Public Info Check: owner, erc20 Address, rate, maxSupply, platform, platformRate', () => {
        it('check base info', async () => {
          expect(await this.fixedPrice.owner()).to.eq(this.creator.address)
          expect(await this.fixedPrice.erc20()).to.eq(
            ethers.constants.AddressZero
          )
          // expect(await this.fixedPrice.rate()).to.eq(
          //   ethers.utils.parseEther(this.rate)
          // )
          expect(await this.fixedPrice.maxSupply()).to.eq(
            this.constructorParameter.maxSupply
          )
          expect(await this.fixedPrice.platform()).to.eq(
            ethers.constants.AddressZero
          )
          expect(await this.fixedPrice.platformRate()).to.eq(0)
        })

        it('only owner can set baseUrl', async () => {
          const newBaseUrl = 'https://newBaserul.com/'
          await expect(
            this.fixedPrice.setBaseURI(newBaseUrl)
          ).to.be.revertedWith(
            `AccessControl: account ${this.deployer.address.toLowerCase()} is missing role ${ethers.utils.keccak256(
              ethers.utils.toUtf8Bytes('CREATOR')
            )}`
          )
        })

        describe('setFeeParameters', () => {
          it('reverted when not the owner', async () => {
            this.platformRate = 5

            await expect(
              this.fixedPrice.setFeeParameters(
                this.platform.address,
                this.platformRate
              )
            ).to.be.revertedWith(
              `AccessControl: account ${this.deployer.address.toLowerCase()} is missing role ${ethers.utils.keccak256(
                ethers.utils.toUtf8Bytes('CREATOR')
              )}`
            )
          })

          it('can only setFeeParameters once', async () => {
            this.platformRate = 5
            await this.fixedPrice
              .connect(this.creator)
              .setFeeParameters(this.platform.address, this.platformRate)
            expect(await this.fixedPrice.platform()).to.eq(
              this.platform.address
            )
            expect(await this.fixedPrice.platformRate()).to.eq(
              this.platformRate
            )

            await expect(
              this.fixedPrice
                .connect(this.creator)
                .setFeeParameters(this.platform.address, this.platformRate)
            ).to.be.revertedWith('has set beneficiary & rate')
          })
        })
      })

      describe('Mint & Burn', () => {
        it('succeeds when receive ether', async () => {
          // user 1 mint with token id 1
          await expect(
            this.fixedPrice.connect(this.user1).mintEth(this.options)
          )
            .to.emit(this.fixedPrice, 'Mint')
            .withArgs(this.user1.address, 1)

          //user 3 mint with token id 2
          await expect(
            this.fixedPrice.connect(this.user3).mintEth(this.options)
          )
            .to.emit(this.fixedPrice, 'Mint')
            .withArgs(this.user3.address, 2)
        })

        it('reverted when receive erc20 failed', async () => {
          // user 2 failed
          await expect(
            this.fixedPrice.connect(this.user2).mintEth(),
            this.shortOptions
          ).to.be.reverted
        })

        it('succeeds when user1 mint (no platform fee)', async () => {
          // user 1 mint a token
          await expect(
            this.fixedPrice.connect(this.user1).mintEth(this.options)
          )
            .to.emit(this.fixedPrice, 'Mint')
            .withArgs(this.user1.address, 1)

          await expect(
            this.fixedPrice.connect(this.user1).withdraw()
          ).to.be.revertedWith(
            `AccessControl: account ${this.user1.address.toLowerCase()} is missing role ${ethers.utils.keccak256(
              ethers.utils.toUtf8Bytes('CREATOR')
            )}`
          )

          await expect(this.fixedPrice.connect(this.creator).withdraw())
            .to.emit(this.fixedPrice, 'Withdraw')
            .withArgs(this.creator.address, this.rate)

          //user 3 mint with token id 2
          await expect(
            this.fixedPrice.connect(this.user3).mintEth(this.options)
          )
            .to.emit(this.fixedPrice, 'Mint')
            .withArgs(this.user3.address, 2)

          //user 3 mint with token id 3
          await expect(
            this.fixedPrice.connect(this.user3).mintEth(this.options)
          )
            .to.emit(this.fixedPrice, 'Mint')
            .withArgs(this.user3.address, 3)

          await expect(this.fixedPrice.connect(this.creator).withdraw())
            .to.emit(this.fixedPrice, 'Withdraw')
            .withArgs(this.creator.address, (this.rateBN * 2).toString())
        })

        it('succeeds when user mint (with platform fee)', async () => {
          // setFeeParameters
          this.platformRate = 5
          await this.fixedPrice
            .connect(this.creator)
            .setFeeParameters(this.platform.address, this.platformRate)
          expect(await this.fixedPrice.platform()).to.eq(this.platform.address)
          expect(await this.fixedPrice.platformRate()).to.eq(this.platformRate)

          // user 1 mint a token
          await expect(
            this.fixedPrice.connect(this.user1).mintEth(this.options)
          )
            .to.emit(this.fixedPrice, 'Mint')
            .withArgs(this.user1.address, 1)
          await expect(
            this.fixedPrice.connect(this.user2).mintEth(this.options)
          )
            .to.emit(this.fixedPrice, 'Mint')
            .withArgs(this.user2.address, 2)
        })
      })
    })
  })
})
