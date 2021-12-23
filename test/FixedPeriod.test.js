const hre = require('hardhat')
const { expect, should } = require('chai')
const { network } = require('hardhat')
const { ethers } = require('ethers')

describe('Beeper Dao FixedPeriod Contracts', function () {
  before(async () => {
    //Preparing the env
    ;[
      this.deployer,
      this.creator,
      this.platform,
      this.user1,
      this.user2,
      this.user3,
      this.platform,
      this.beneficiary,
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

    //Deploy Factory & Four deployer & ERC20Token
    this.tokenBaseDeployer = await this.TokenBaseDeployer.deploy()
    this.nftBaseDeployer = await this.NFTBaseDeployer.deploy()
    this.fixedPeriodDeployer = await this.FixedPeriodDeployer.deploy()
    this.fixedPriceDeployer = await this.FixedPriceDeployer.deploy()
    this.erc20 = await this.ERC20Factory.deploy('Test Token', 'TT', 6)

    await this.tokenBaseDeployer.deployed()
    await this.nftBaseDeployer.deployed()
    await this.fixedPeriodDeployer.deployed()
    await this.fixedPriceDeployer.deployed()
    await this.erc20.deployed()

    this.factory = await this.Factory.deploy(
      this.tokenBaseDeployer.address,
      this.nftBaseDeployer.address,
      this.fixedPeriodDeployer.address,
      this.fixedPriceDeployer.address,
      this.platform.address,
      0
    )

    this.getTimestampBeforeWithDelay = async () => {
      return (
        (
          await hre.ethers.provider.getBlock(
            (this.block = await hre.ethers.provider.getBlockNumber())
          )
        ).timestamp + 300
      )
    }

    this.testPrice = async time => {
      try {
        await network.provider.send('evm_mine', [this.startTime + time])

        let price = ethers.utils.formatEther(
          await this.fixedPeriod.getCurrentCostToMint()
        )
        let expectPrice = ethers.utils.formatEther(
          this.initialRateBN.sub(this.slopeBN.mul(ethers.BigNumber.from(time)))
        )
        expect(price).to.eq(expectPrice)
      } catch (error) {
        console.log(error)
      }
    }
  })

  it('should failed if factory not the owner of deployer', async () => {
    let constructorParameter
    const initialRateBN = ethers.utils.parseEther('100')
    const initialRate = initialRateBN.toString()
    const startTime = await this.getTimestampBeforeWithDelay()
    const startTimeBN = ethers.BigNumber.from(startTime)
    const endTimeBN = startTimeBN.add(ethers.BigNumber.from(3600))
    const endTime = endTimeBN.toString()
    const slopeBN = initialRateBN.div(endTimeBN.sub(startTimeBN))
    const maxSupply = 100
    const baseURI = 'https://test_url.com/'
    constructorParameter = [
      'test_name',
      'test_symbol',
      baseURI,
      this.erc20.address,
      this.beneficiary.address,
      initialRate,
      startTime,
      endTime,
      maxSupply,
    ]
    await expect(
      this.factory
        .connect(this.creator)
        .fixedPeriodDeploy(...constructorParameter)
    ).to.be.revertedWith('Ownable: caller is not the owner')
  })

  describe('FixedPeriod Test (without platform fee)', () => {
    before(async () => {
      // price = slope * (termOfValidity - now)

      this.initialRateBN = ethers.utils.parseEther('100')
      this.initialRate = this.initialRateBN.toString()

      this.startTime = await this.getTimestampBeforeWithDelay()
      this.startTimeBN = ethers.BigNumber.from(this.startTime)

      this.endTimeBN = this.startTimeBN.add(ethers.BigNumber.from(3600))
      this.endTime = this.endTimeBN.toString()

      this.slopeBN = this.initialRateBN.div(
        this.endTimeBN.sub(this.startTimeBN)
      )
      this.slope = this.slopeBN.toString()

      this.maxSupply = 100

      this.baseURI = 'https://test_url.com/'

      this.constructorParameter = [
        'test_name',
        'test_symbol',
        this.baseURI,
        this.erc20.address,
        this.beneficiary.address,
        this.initialRate,
        this.startTime,
        this.endTime,
        this.maxSupply,
      ]

      await this.fixedPeriodDeployer.transferOwnership(this.factory.address)

      const tx = await this.factory
        .connect(this.creator)
        .fixedPeriodDeploy(...this.constructorParameter)

      const receipt = await tx.wait()
      for (const event of receipt.events) {
        switch (event.event) {
          case 'FixedPeriodDeploy': {
            this.fixedPriceAddr = event.args[0]
          }
        }
      }

      let fixedPricePeriodFactory = await hre.ethers.getContractFactory(
        'FixedPeriod'
      )
      this.fixedPeriod = fixedPricePeriodFactory.attach(this.fixedPriceAddr)
    })

    describe('Public Info Check', () => {
      it('check base info', async () => {
        expect(await this.fixedPeriod.owner()).to.eq(this.creator.address)
        expect(await this.fixedPeriod.erc20()).to.eq(this.erc20.address)
        expect(await this.fixedPeriod.maxSupply()).to.eq(this.maxSupply)
        expect(await this.fixedPeriod.platform()).to.eq(this.platform.address)
        expect(await this.fixedPeriod.platformRate()).to.eq(0)
        expect(await this.fixedPeriod.COOLDOWN_SECONDS()).to.eq(172800)
        expect(await this.fixedPeriod.OPERATE_WINDOW()).to.eq(86400)
      })

      it('only owner can set baseURI', async () => {
        const newBaseUrl = 'https://newBaserul.com/'
        await expect(
          this.fixedPeriod.setBaseURI(newBaseUrl)
        ).to.be.revertedWith('Ownable: caller is not the owner')
      })

      it('shoul failed when freezed url', async () => {
        const newBaseUrl = 'https://newBaserul.com/'
        await expect(
          this.fixedPeriod.connect(this.creator).freezeBaseURI()
        ).to.emit(this.fixedPeriod, 'BaseURIFrozen')

        await await expect(
          this.fixedPeriod.connect(this.creator).setBaseURI(newBaseUrl)
        ).to.be.revertedWith('baseURI has been frozen')
      })
    })

    describe('Mint Burn (Price Period decline) Test', () => {
      it('reverted when not begin', async () => {
        await network.provider.send('evm_setNextBlockTimestamp', [
          this.startTime - 100,
        ])
        await network.provider.send('evm_mine')

        await expect(
          this.fixedPeriod.getCurrentCostToMint()
        ).to.be.revertedWith('Not in the period')
      })
      it('just begin time', async () => {
        await this.testPrice(0)
      })
      it('last 200 second', async () => {
        await this.testPrice(200)
      })

      it('mint succeeds when receive erc20', async () => {
        // mock erc20 balance
        await this.erc20.mint(this.user1.address, this.initialRate)
        await this.erc20.mint(this.user3.address, this.initialRate)
        await this.erc20
          .connect(this.user1)
          .approve(this.fixedPriceAddr, this.initialRate)
        await this.erc20
          .connect(this.user3)
          .approve(this.fixedPriceAddr, this.initialRate)

        await expect(this.fixedPeriod.connect(this.user1).mint())
          .to.emit(this.fixedPeriod, 'Mint')
          .withArgs(this.user1.address, 1)
        await expect(this.fixedPeriod.connect(this.user3).mint())
          .to.emit(this.fixedPeriod, 'Mint')
          .withArgs(this.user3.address, 2)
      })

      it('mint and set token uri', async () => {
        // mock erc20 balance
        await this.erc20.mint(this.user1.address, this.initialRate)
        await this.erc20.mint(this.user3.address, this.initialRate)
        await this.erc20
          .connect(this.user1)
          .approve(this.fixedPriceAddr, this.initialRate)
        await this.erc20
          .connect(this.user3)
          .approve(this.fixedPriceAddr, this.initialRate)

        await expect(this.fixedPeriod.connect(this.user1).mint())
          .to.emit(this.fixedPeriod, 'Mint')
          .withArgs(this.user1.address, 3)
        await expect(this.fixedPeriod.connect(this.user3).mint())
          .to.emit(this.fixedPeriod, 'Mint')
          .withArgs(this.user3.address, 4)

        await expect(
          this.fixedPeriod
            .connect(this.creator)
            .setTokenURI(3, 'this is whole token uri')
        )
          .to.emit(this.fixedPeriod, 'SetTokenURI')
          .withArgs(3, 'this is whole token uri')

        expect(await this.fixedPeriod.tokenURI(3)).eq('this is whole token uri')
        expect(await this.fixedPeriod.tokenURI(4)).eq(this.baseURI + '4')
      })

      it('mint reverted when receive erc20 failed', async () => {
        // user 2 failed

        const price = ethers.utils.formatEther(
          await this.fixedPeriod.getCurrentCostToMint()
        )
        await expect(this.fixedPeriod.connect(this.user2).mint()).to.be.reverted
      })

      describe('check beneficiary & withdraw', () => {
        it('should reverted when changeBeneficiary by others', async () => {
          await expect(
            this.fixedPeriod
              .connect(this.user3)
              .changeBeneficiary(this.user3.address)
          ).to.be.revertedWith('Ownable: caller is not the owner')
        })

        it('should success when user withdraw', async () => {
          await expect(this.fixedPeriod.connect(this.user1).withdraw())
            .to.emit(this.fixedPeriod, 'Withdraw')
            .withArgs(
              this.user3.address,
              await this.erc20.balanceOf(this.fixedPeriod.address)
            )
        })
      })

      it('last 1600 second', async () => {
        await this.testPrice(800)
      })

      it('last 3422 second', async () => {
        await this.testPrice(3422)
      })

      it('last 3700 second', async () => {
        let time = 3700
        await network.provider.send('evm_mine', [this.startTime + time])

        await expect(
          this.fixedPeriod.getCurrentCostToMint()
        ).to.be.revertedWith('Not in the period')
      })

      it('test timelock', async () => {
        let cooldownStartTimestamp = (
          await hre.ethers.provider.getBlock(
            (this.block = await hre.ethers.provider.getBlockNumber())
          )
        ).timestamp

        await await expect(
          this.fixedPeriod.connect(this.creator).changeBeneficiaryUnlock()
        ).to.emit(this.fixedPeriod, 'ChangeBeneficiaryUnlock')

        let one_day = 864_00
        let two_day = one_day * 2

        await network.provider.send('evm_mine', [
          cooldownStartTimestamp + one_day,
        ])

        await expect(
          this.fixedPeriod
            .connect(this.creator)
            .changeBeneficiary(this.user3.address)
        ).to.be.revertedWith('INSUFFICIENT_COOLDOWN')

        await network.provider.send('evm_mine', [
          cooldownStartTimestamp + two_day + 1,
        ])

        await expect(
          this.fixedPeriod
            .connect(this.creator)
            .changeBeneficiary(this.user3.address)
        ).to.not.reverted

        await network.provider.send('evm_mine', [
          cooldownStartTimestamp + two_day + one_day + 1,
        ])

        await expect(
          this.fixedPeriod
            .connect(this.creator)
            .changeBeneficiary(this.user3.address)
        ).to.be.revertedWith('OPERATE_WINDOW_FINISHED')
      })
    })
  })

  //   describe('FixedPeriod Test (whit platform fee)', () => {
  //     before(async () => {
  //       this.platformRate = 2
  //       await this.factory.setPlatformParms(this.platform.address, 2)

  //       this.initialRateBN = ethers.utils.parseEther('100')
  //       this.initialRate = this.initialRateBN.toString()

  //       this.startTime = await this.getTimestampBeforeWithDelay()
  //       this.startTimeBN = ethers.BigNumber.from(this.startTime)

  //       this.endTimeBN = this.startTimeBN.add(ethers.BigNumber.from(3600))
  //       this.endTime = this.endTimeBN.toString()

  //       this.slopeBN = this.initialRateBN.div(
  //         this.endTimeBN.sub(this.startTimeBN)
  //       )
  //       this.slope = this.slopeBN.toString()

  //       this.maxSupply = 100

  //       this.constructorParameter = [
  //         'test_name',
  //         'test_symbol',
  //         'https://test_url.com/',
  //         this.erc20.address,
  //         this.beneficiary.address,
  //         this.initialRate,
  //         this.startTime,
  //         this.endTime,
  //         this.maxSupply,
  //       ]

  //       const tx = await this.factory
  //         .connect(this.creator)
  //         .fixedPeriodDeploy(...this.constructorParameter)

  //       const receipt = await tx.wait()
  //       for (const event of receipt.events) {
  //         switch (event.event) {
  //           case 'FixedPeriodDeploy': {
  //             this.fixedPriceAddr = event.args[0]
  //           }
  //         }
  //       }

  //       let fixedPricePeriodFactory = await hre.ethers.getContractFactory(
  //         'FixedPeriod'
  //       )
  //       this.fixedPeriod = fixedPricePeriodFactory.attach(this.fixedPriceAddr)
  //     })

  //     describe('Mint Burn (Price Period decline) Test', () => {
  //       it('reverted when not begin', async () => {
  //         await network.provider.send('evm_mine', [this.startTime - 100])

  //         await expect(
  //           this.fixedPeriod.getCurrentCostToMint()
  //         ).to.be.revertedWith('Not in the period')
  //       })
  //       it('just begin time', async () => {
  //         await this.testPrice(0)
  //       })
  //       it('last 200 second', async () => {
  //         await this.testPrice(200)
  //       })

  //       it('mint succeeds when receive erc20', async () => {
  //         // mock erc20 balance
  //         await this.erc20.mint(this.user1.address, this.initialRate)
  //         await this.erc20.mint(this.user3.address, this.initialRate)
  //         await this.erc20
  //           .connect(this.user1)
  //           .approve(this.fixedPriceAddr, this.initialRate)
  //         await this.erc20
  //           .connect(this.user3)
  //           .approve(this.fixedPriceAddr, this.initialRate)

  //         // user 1 mint with token id 1
  //         await expect(this.fixedPeriod.connect(this.user1).mint())
  //           .to.emit(this.fixedPeriod, 'Mint')
  //           .withArgs(this.user1.address, 1)

  //         //user 3 mint with token id 2
  //         await expect(this.fixedPeriod.connect(this.user3).mint())
  //           .to.emit(this.fixedPeriod, 'Mint')
  //           .withArgs(this.user3.address, 2)
  //       })

  //       it('last 1600 second', async () => {
  //         await this.testPrice(1600)
  //       })

  //       it('mint reverted when receive erc20 failed', async () => {
  //         // user 2 failed
  //         await expect(this.fixedPeriod.connect(this.user2).mint()).to.be.reverted
  //       })

  //       it('check beneficiary & withdraw', async () => {
  //         // mock erc20 balance
  //         await this.erc20.mint(this.user3.address, this.initialRate)
  //         await this.erc20
  //           .connect(this.user3)
  //           .approve(this.fixedPriceAddr, this.initialRate)

  //         // user 3 mint a token with id 3
  //         await expect(this.fixedPeriod.connect(this.user3).mint())
  //           .to.emit(this.fixedPeriod, 'Mint')
  //           .withArgs(this.user3.address, 3)

  //         await expect(
  //           this.fixedPeriod
  //             .connect(this.user3)
  //             .changeBeneficiary(this.user3.address)
  //         ).to.be.revertedWith('Ownable: caller is not the owner')

  //         // await this.fixedPeriod
  //         //   .connect(this.creator)
  //         //   .changeBeneficiary(this.user3.address)

  //         // await expect(this.fixedPeriod.connect(this.user1).withdraw())
  //         //   .to.emit(this.fixedPeriod, 'Withdraw')
  //         //   .withArgs(
  //         //     this.user3.address,
  //         //     await this.erc20.balanceOf(this.fixedPeriod.address)
  //         //   )
  //       })

  //       it('last 3422 second', async () => {
  //         await this.testPrice(3422)
  //       })

  //       it('last 3700 second', async () => {
  //         let time = 3700
  //         await network.provider.send('evm_setNextBlockTimestamp', [
  //           this.startTime + time,
  //         ])
  //         await network.provider.send('evm_mine')

  //         await expect(
  //           this.fixedPeriod.getCurrentCostToMint()
  //         ).to.be.revertedWith('Not in the period')
  //       })
  //     })
  //   })

  //   describe('FixedPeriod with ether (without platform fee)', () => {
  //     before(async () => {
  //       this.initialRateBN = ethers.utils.parseEther('100')
  //       this.initialRate = this.initialRateBN.toString()

  //       this.startTime = await this.getTimestampBeforeWithDelay()
  //       this.startTimeBN = ethers.BigNumber.from(this.startTime)

  //       this.endTimeBN = this.startTimeBN.add(ethers.BigNumber.from(3600))
  //       this.endTime = this.endTimeBN.toString()

  //       this.slopeBN = this.initialRateBN.div(
  //         this.endTimeBN.sub(this.startTimeBN)
  //       )
  //       this.slope = this.slopeBN.toString()

  //       this.maxSupply = 100

  //       this.constructorParameter = [
  //         'test_name',
  //         'test_symbol',
  //         'https://test_url.com/',
  //         ethers.constants.AddressZero,
  //         this.beneficiary.address,
  //         this.initialRate,
  //         this.startTime,
  //         this.endTime,
  //         this.maxSupply,
  //       ]

  //       const tx = await this.factory
  //         .connect(this.creator)
  //         .fixedPeriodDeploy(...this.constructorParameter)

  //       const receipt = await tx.wait()
  //       for (const event of receipt.events) {
  //         switch (event.event) {
  //           case 'FixedPeriodDeploy': {
  //             this.fixedPriceAddr = event.args[0]
  //           }
  //         }
  //       }

  //       this.options = {
  //         value: this.initialRate,
  //       }
  //       this.shortOptions = {
  //         value: (this.initialRateBN / 2).toString(),
  //       }

  //       let fixedPricePeriodFactory = await hre.ethers.getContractFactory(
  //         'FixedPeriod'
  //       )
  //       this.fixedPeriod = fixedPricePeriodFactory.attach(this.fixedPriceAddr)
  //     })

  //     describe('Public Info Check: owner, erc20 Address, rate, maxSupply, platform, platformRate', () => {
  //       it('check base info', async () => {
  //         expect(await this.fixedPeriod.owner()).to.eq(this.creator.address)
  //         expect(await this.fixedPeriod.erc20()).to.eq(
  //           ethers.constants.AddressZero
  //         )
  //         // expect(await this.fixedPeriod.rate()).to.eq(
  //         //   ethers.utils.parseEther(this.initialRate)
  //         // )
  //         expect(await this.fixedPeriod.maxSupply()).to.eq(this.maxSupply)
  //         expect(await this.fixedPeriod.platform()).to.eq(this.platform.address)
  //         expect(await this.fixedPeriod.platformRate()).to.eq(this.platformRate)
  //       })

  //       it('only owner can set baseURI', async () => {
  //         const newBaseUrl = 'https://newBaserul.com/'
  //         await expect(
  //           this.fixedPeriod.setBaseURI(newBaseUrl)
  //         ).to.be.revertedWith('Ownable: caller is not the owner')
  //       })
  //     })

  //     describe('Mint & Burn', () => {
  //       it('last 200 second', async () => {
  //         await this.testPrice(200)
  //       })

  //       it('succeeds when receive ether', async () => {
  //         await network.provider.send('evm_mine', [this.startTime + 300])

  //         // user 1 mint with token id 1
  //         await expect(this.fixedPeriod.connect(this.user1).mintEth(this.options))
  //           .to.emit(this.fixedPeriod, 'Mint')
  //           .withArgs(this.user1.address, 1)

  //         //user 3 mint with token id 2
  //         await expect(this.fixedPeriod.connect(this.user3).mintEth(this.options))
  //           .to.emit(this.fixedPeriod, 'Mint')
  //           .withArgs(this.user3.address, 2)
  //       })

  //       it('reverted when receive erc20 failed', async () => {
  //         // user 2 failed
  //         await expect(
  //           this.fixedPeriod.connect(this.user2).mintEth(),
  //           this.shortOptions
  //         ).to.be.reverted
  //       })

  //       it('succeeds when user1 mint (no platform fee)', async () => {
  //         // user 1 mint a token
  //         await expect(this.fixedPeriod.connect(this.user1).mintEth(this.options))
  //           .to.emit(this.fixedPeriod, 'Mint')
  //           .withArgs(this.user1.address, 3)

  //         await expect(this.fixedPeriod.connect(this.user1).withdraw())
  //           .to.emit(this.fixedPeriod, 'Withdraw')
  //           .withArgs(
  //             this.beneficiary.address,
  //             this.initialRateBN.sub(this.initialRateBN.mul(this.platformRate))
  //               .toString
  //           )

  //         //user 3 mint with token id 2
  //         await expect(this.fixedPeriod.connect(this.user3).mintEth(this.options))
  //           .to.emit(this.fixedPeriod, 'Mint')
  //           .withArgs(this.user3.address, 4)

  //         //user 3 mint with token id 3
  //         await expect(this.fixedPeriod.connect(this.user3).mintEth(this.options))
  //           .to.emit(this.fixedPeriod, 'Mint')
  //           .withArgs(this.user3.address, 5)

  //         await expect(this.fixedPeriod.connect(this.creator).withdraw())
  //           .to.emit(this.fixedPeriod, 'Withdraw')
  //           .withArgs(
  //             this.beneficiary.address,
  //             await hre.ethers.provider.getBalance(this.fixedPeriod.address)
  //           )
  //       })
  //     })
  //   })
})
