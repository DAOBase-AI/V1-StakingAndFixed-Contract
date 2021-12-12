const hre = require('hardhat')
const { expect, should } = require('chai')

describe('Beeper Dao FixedPrice Contracts', function () {
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

    this.platformRate = 0

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
      this.platformRate
    )
  })

  it('should failed if factory not the owner of deployer', async () => {
    this.rateBN = hre.ethers.utils.parseEther('100')
    this.rate = this.rateBN.toString()
    this.maxSupply = 100

    this.constructorParameter = [
      'test_name',
      'test_symbol',
      'https://test_url.com/',
      this.erc20.address,
      this.beneficiary.address,
      this.rate,
      this.maxSupply,
    ]

    await this.fixedPriceDeployer.transferOwnership(this.factory.address)

    const tx = await this.factory
      .connect(this.creator)
      .fixedPriceDeploy(...this.constructorParameter)
    await expect(
      this.factory
        .connect(this.creator)
        .fixedPriceDeploy(...constructorParameter)
    ).to.be.revertedWith('Ownable: caller is not the owner')
  })

  describe('FixedPrice Test', () => {
    before(async () => {
      this.rateBN = hre.ethers.utils.parseEther('100')
      this.rate = this.rateBN.toString()
      this.maxSupply = 100

      this.constructorParameter = [
        'test_name',
        'test_symbol',
        'https://test_url.com/',
        this.erc20.address,
        this.beneficiary.address,
        this.rate,
        this.maxSupply,
      ]

      await this.fixedPriceDeployer.transferOwnership(this.factory.address)

      const tx = await this.factory
        .connect(this.creator)
        .fixedPriceDeploy(...this.constructorParameter)

      const receipt = await tx.wait()
      for (const event of receipt.events) {
        switch (event.event) {
          case 'FixedPriceDeploy': {
            this.fixedPriceAddr = event.args[0]
          }
        }
      }

      let fixedPriceFactory = await hre.ethers.getContractFactory('FixedPrice')
      this.fixedPrice = fixedPriceFactory.attach(this.fixedPriceAddr)
    })

    describe('Public Info Check', () => {
      it('check base info', async () => {
        expect(await this.fixedPrice.owner()).to.eq(this.creator.address)
        expect(await this.fixedPrice.erc20()).to.eq(this.erc20.address)
        expect(await this.fixedPrice.maxSupply()).to.eq(this.maxSupply)
        expect(await this.fixedPrice.platform()).to.eq(this.platform.address)
        expect(await this.fixedPrice.platformRate()).to.eq(0)
      })

      it('only owner can set baseUrl', async () => {
        const newBaseUrl = 'https://newBaserul.com/'
        await expect(this.fixedPrice.setBaseURI(newBaseUrl)).to.be.revertedWith(
          'Ownable: caller is not the owner'
        )
      })

      it('shoul failed when freezed url', async () => {
        const newBaseUrl = 'https://newBaserul.com/'
        await expect(
          this.fixedPrice.connect(this.creator).freezeBaseURI()
        ).to.emit(this.fixedPrice, 'BaseURIFrozen')

        await await expect(
          this.fixedPrice.connect(this.creator).setBaseURI(newBaseUrl)
        ).to.be.revertedWith('baseURI has been frozen')
      })
    })

    describe('Mint Burn & Fixed Price Test', () => {
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
        await expect(this.fixedPrice.connect(this.user2).mint()).to.be.reverted
      })

      it('check beneficiary & withdraw', async () => {
        // mock erc20 balance
        await this.erc20.mint(this.user1.address, this.rate)
        await this.erc20
          .connect(this.user1)
          .approve(this.fixedPriceAddr, this.rate)

        // user 1 mint a token
        await expect(this.fixedPrice.connect(this.user1).mint())
          .to.emit(this.fixedPrice, 'Mint')
          .withArgs(this.user1.address, 3)

        await expect(
          this.fixedPrice
            .connect(this.creator)
            .changeBeneficiary(this.user3.address)
        ).to.be.revertedWith('OPERATE_WINDOW_FINISHED')

        await expect(
          this.fixedPrice
            .connect(this.user1)
            .changeBeneficiary(this.user1.address)
        ).to.be.revertedWith('Ownable: caller is not the owner')

        await expect(this.fixedPrice.connect(this.user3).withdraw())
          .to.emit(this.fixedPrice, 'Withdraw')
          .withArgs(
            this.beneficiary.address,
            this.rateBN.mul(hre.ethers.BigNumber.from('3')).toString()
          )
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
      })

      it('test timelock', async () => {
        let cooldownStartTimestamp = (
          await hre.ethers.provider.getBlock(
            (this.block = await hre.ethers.provider.getBlockNumber())
          )
        ).timestamp

        await await expect(
          this.fixedPrice.connect(this.creator).changeBeneficiaryUnlock()
        ).to.emit(this.fixedPrice, 'ChangeBeneficiaryUnlock')

        // console.log(cooldownStartTimestamp)

        let one_day = 864_00
        let two_day = one_day * 2

        await network.provider.send('evm_mine', [
          cooldownStartTimestamp + one_day,
        ])

        await expect(
          this.fixedPrice
            .connect(this.creator)
            .changeBeneficiary(this.user3.address)
        ).to.be.revertedWith('INSUFFICIENT_COOLDOWN')

        await network.provider.send('evm_mine', [
          cooldownStartTimestamp + two_day + 1,
        ])

        await expect(
          this.fixedPrice
            .connect(this.creator)
            .changeBeneficiary(this.user3.address)
        ).to.not.reverted

        await network.provider.send('evm_mine', [
          cooldownStartTimestamp + two_day + one_day + 1,
        ])

        await expect(
          this.fixedPrice
            .connect(this.creator)
            .changeBeneficiary(this.user3.address)
        ).to.be.revertedWith('OPERATE_WINDOW_FINISHED')
      })
    })
  })

  describe('FixedPrice with ether', () => {
    before(async () => {
      this.rateBN = hre.ethers.utils.parseEther('100')
      this.rate = this.rateBN.toString()
      this.maxSupply = 100

      this.constructorParameter = [
        'test_name',
        'test_symbol',
        'https://test_url.com/',
        hre.ethers.constants.AddressZero,
        this.beneficiary.address,
        this.rate,
        this.maxSupply,
      ]

      const tx = await this.factory
        .connect(this.creator)
        .fixedPriceDeploy(...this.constructorParameter)

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
        value: (this.rateBN / 2).toString(),
      }

      let fixedPriceFactory = await hre.ethers.getContractFactory('FixedPrice')

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
        expect(await this.fixedPrice.maxSupply()).to.eq(this.maxSupply)
        expect(await this.fixedPrice.platform()).to.eq(this.platform.address)
        expect(await this.fixedPrice.platformRate()).to.eq(0)
      })

      it('only owner can set baseUrl', async () => {
        const newBaseUrl = 'https://newBaserul.com/'
        await expect(this.fixedPrice.setBaseURI(newBaseUrl)).to.be.revertedWith(
          'Ownable: caller is not the owner'
        )
      })
    })

    describe('Mint & Burn', () => {
      it('succeeds when receive ether', async () => {
        // user 1 mint with token id 1
        await expect(this.fixedPrice.connect(this.user1).mintEth(this.options))
          .to.emit(this.fixedPrice, 'Mint')
          .withArgs(this.user1.address, 1)

        //user 3 mint with token id 2
        await expect(this.fixedPrice.connect(this.user3).mintEth(this.options))
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

      it('check beneficiary & withdraw', async () => {
        // user 1 mint a token
        await expect(this.fixedPrice.connect(this.user1).mintEth(this.options))
          .to.emit(this.fixedPrice, 'Mint')
          .withArgs(this.user1.address, 3)

        await expect(
          this.fixedPrice
            .connect(this.user3)
            .changeBeneficiary(this.user3.address)
        ).to.be.revertedWith('Ownable: caller is not the owner')

        await expect(this.fixedPrice.connect(this.creator).withdraw())
          .to.emit(this.fixedPrice, 'Withdraw')
          .withArgs(this.beneficiary.address, (this.rateBN * 3).toString())

        //user 3 mint with token id 2
        await expect(this.fixedPrice.connect(this.user3).mintEth(this.options))
          .to.emit(this.fixedPrice, 'Mint')
          .withArgs(this.user3.address, 4)

        //user 3 mint with token id 3
        await expect(this.fixedPrice.connect(this.user3).mintEth(this.options))
          .to.emit(this.fixedPrice, 'Mint')
          .withArgs(this.user3.address, 5)

        await expect(this.fixedPrice.connect(this.creator).withdraw())
          .to.emit(this.fixedPrice, 'Withdraw')
          .withArgs(this.beneficiary.address, (this.rateBN * 2).toString())
      })
    })
  })

  //   describe('FixedPrice with ether(with platform fee)', () => {
  //     before(async () => {
  //       this.platformRate = 2
  //       await this.factory.setPlatformParms(this.platform.address, 2)

  //       this.rateBN = hre.ethers.utils.parseEther('100')
  //       this.rate = this.rateBN.toString()
  //       this.maxSupply = 100

  //       this.constructorParameter = [
  //         'test_name',
  //         'test_symbol',
  //         'https://test_url.com/',
  //         hre.ethers.constants.AddressZero,
  //         this.beneficiary.address,
  //         this.rate,
  //         this.maxSupply,
  //       ]

  //       const tx = await this.factory
  //         .connect(this.creator)
  //         .fixedPriceDeploy(...this.constructorParameter)

  //       const receipt = await tx.wait()
  //       for (const event of receipt.events) {
  //         switch (event.event) {
  //           case 'FixedPriceDeploy': {
  //             this.fixedPriceAddr = event.args[0]
  //           }
  //         }
  //       }

  //       this.options = {
  //         value: this.rate,
  //       }
  //       this.shortOptions = {
  //         value: (this.rateBN / 2).toString(),
  //       }

  //       let fixedPriceFactory = await hre.ethers.getContractFactory('FixedPrice')

  //       this.fixedPrice = fixedPriceFactory.attach(this.fixedPriceAddr)
  //     })

  //     describe('Public Info Check: owner, erc20 Address, rate, maxSupply, platform, platformRate', () => {
  //       it('check base info', async () => {
  //         expect(await this.fixedPrice.owner()).to.eq(this.creator.address)
  //         expect(await this.fixedPrice.erc20()).to.eq(
  //           ethers.constants.AddressZero
  //         )
  //         // expect(await this.fixedPrice.rate()).to.eq(
  //         //   ethers.utils.parseEther(this.rate)
  //         // )
  //         expect(await this.fixedPrice.maxSupply()).to.eq(this.maxSupply)
  //         expect(await this.fixedPrice.platform()).to.eq(this.platform.address)
  //         expect(await this.fixedPrice.platformRate()).to.eq(this.platformRate)
  //       })

  //       it('only owner can set baseUrl', async () => {
  //         const newBaseUrl = 'https://newBaserul.com/'
  //         await expect(this.fixedPrice.setBaseURI(newBaseUrl)).to.be.revertedWith(
  //           'Ownable: caller is not the owner'
  //         )
  //       })
  //     })

  //     describe('Mint & Burn', () => {
  //       it('succeeds when receive ether', async () => {
  //         // user 1 mint with token id 1
  //         await expect(this.fixedPrice.connect(this.user1).mintEth(this.options))
  //           .to.emit(this.fixedPrice, 'Mint')
  //           .withArgs(this.user1.address, 1)

  //         //user 3 mint with token id 2
  //         await expect(this.fixedPrice.connect(this.user3).mintEth(this.options))
  //           .to.emit(this.fixedPrice, 'Mint')
  //           .withArgs(this.user3.address, 2)
  //       })

  //       it('reverted when receive erc20 failed', async () => {
  //         // user 2 failed
  //         await expect(
  //           this.fixedPrice.connect(this.user2).mintEth(),
  //           this.shortOptions
  //         ).to.be.reverted
  //       })

  //       it('check beneficiary & withdraw', async () => {
  //         // user 1 mint a token
  //         await expect(this.fixedPrice.connect(this.user1).mintEth(this.options))
  //           .to.emit(this.fixedPrice, 'Mint')
  //           .withArgs(this.user1.address, 3)

  //         await expect(
  //           this.fixedPrice
  //             .connect(this.user3)
  //             .changeBeneficiary(this.user3.address)
  //         ).to.be.revertedWith('Ownable: caller is not the owner')

  //         await expect(this.fixedPrice.connect(this.creator).withdraw())
  //           .to.emit(this.fixedPrice, 'Withdraw')
  //           .withArgs(
  //             this.beneficiary.address,
  //             this.rateBN
  //               .mul(3)
  //               .mul(100 - this.platformRate)
  //               .div(100)
  //               .toString()
  //           )

  //         //user 3 mint with token id 2
  //         await expect(this.fixedPrice.connect(this.user3).mintEth(this.options))
  //           .to.emit(this.fixedPrice, 'Mint')
  //           .withArgs(this.user3.address, 4)

  //         //user 3 mint with token id 3
  //         await expect(this.fixedPrice.connect(this.user3).mintEth(this.options))
  //           .to.emit(this.fixedPrice, 'Mint')
  //           .withArgs(this.user3.address, 5)

  //         await expect(this.fixedPrice.connect(this.creator).withdraw())
  //           .to.emit(this.fixedPrice, 'Withdraw')
  //           .withArgs(
  //             this.beneficiary.address,
  //             this.rateBN
  //               .mul(2)
  //               .mul(100 - this.platformRate)
  //               .div(100)
  //               .toString()
  //           )
  //       })
  //     })
  //   })
})
