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
      this.initialRate = 1000

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
          `AccessControl: account ${this.deployer.address.toLowerCase()} is missing role ${ethers.utils.keccak256(
            ethers.utils.toUtf8Bytes('CREATOR')
          )}`
        )
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
          .withArgs(this.user1.address, 1)

        await expect(this.tokenBase.connect(this.user1).burn('1'))
          .to.emit(this.tokenBase, 'Burn')
          .withArgs(this.user1.address, 1)
          .to.emit(this.tokenBase, 'Transfer')
          .withArgs(this.user1.address, ethers.constants.AddressZero, 1)
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
          .withArgs(this.user1.address, 1)

        await expect(
          this.tokenBase.connect(this.user2).burn(1)
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
          .withArgs(this.user1.address, 1)

        await expect(
          this.tokenBase.connect(this.user1).burn(2)
        ).to.be.revertedWith('ERC721: operator query for nonexistent token')
      })
    })
  })

  describe('FixPrice Test', () => {
    describe('FixedPrice with erc20', () => {
      beforeEach(async () => {
        // price = slope * (termOfValidity - now)

        this.initialRateBN = ethers.utils.parseEther('100')
        this.initialRate = this.initialRateBN.toString()
        this.termOfValidityBN = ethers.BigNumber.from('3600')
        this.termOfValidity = this.termOfValidityBN.toString()
        this.startTime = Date.parse(new Date()) / 1000 + 360
        this.endTimeBN =
          ethers.BigNumber.from(this.startTime) + this.termOfValidityBN
        this.endTime = this.endTimeBN.toString()
        this.slopeBN = this.initialRateBN.div(this.termOfValidityBN)
        this.slope = this.slopeBN.toString()

        // console.log('slope', this.slope)
        // console.log('constructor time', this.startTime)

        this.constructorParameter = {
          name: 'test_name',
          symbol: 'test_symbol',
          bURI: 'https://test_url.com/',
          erc20: this.erc20.address,
          initialRate: this.initialRate,
          startTime: this.startTime,
          termOfValidity: this.termOfValidity,
          maxSupply: 100,
        }

        const tx = await this.factory
          .connect(this.creator)
          .fixedPriceDeploy(
            this.constructorParameter.name,
            this.constructorParameter.symbol,
            this.constructorParameter.bURI,
            this.constructorParameter.erc20,
            this.constructorParameter.initialRate,
            this.constructorParameter.startTime,
            this.constructorParameter.termOfValidity,
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
        const testPrice = async time => {
          await network.provider.send('evm_setNextBlockTimestamp', [
            this.startTime + time,
          ])
          await network.provider.send('evm_mine')

          const price = ethers.utils.formatEther(
            await this.fixedPrice.getCurrentCostToMint()
          )
          let expectPrice = ethers.utils.formatEther(
            this.initialRateBN.sub(
              this.slopeBN.mul(ethers.BigNumber.from(time))
            )
          )
          expect(price).to.eq(expectPrice)
        }

        it('reverted when not begin', async () => {
          await network.provider.send('evm_setNextBlockTimestamp', [
            this.startTime - 100,
          ])
          await network.provider.send('evm_mine')

          await expect(
            this.fixedPrice.getCurrentCostToMint()
          ).to.be.revertedWith('FixedPrice: not in time')
        })
        it('just begin time', async () => {
          testPrice(0)
        })
        it('last 200 second', async () => {
          testPrice(200)
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

          const price = ethers.utils.formatEther(
            await this.fixedPrice.getCurrentCostToMint()
          )
          await expect(this.fixedPrice.connect(this.user2).mint()).to.be
            .reverted
        })

        it('succeeds when user1 mint (no platform fee)', async () => {
          // mock erc20 balance
          await this.erc20.mint(this.user1.address, this.initialRate)
          await this.erc20
            .connect(this.user1)
            .approve(this.fixedPriceAddr, this.initialRate)

          // user 1 mint a token
          await expect(this.fixedPrice.connect(this.user1).mint())
            .to.emit(this.fixedPrice, 'Mint')
            .withArgs(this.user1.address, 1)

          const price = (
            await this.fixedPrice.getCurrentCostToMint()
          ).toString()

          await expect(
            this.fixedPrice.connect(this.user1).withdraw()
          ).to.be.revertedWith(
            `AccessControl: account ${this.user1.address.toLowerCase()} is missing role ${ethers.utils.keccak256(
              ethers.utils.toUtf8Bytes('CREATOR')
            )}`
          )

          await expect(this.fixedPrice.connect(this.creator).withdraw())
            .to.emit(this.fixedPrice, 'Withdraw')
            .withArgs(this.creator.address, price)
        })

        it('succeeds when user1 mint (with platform fee)', async () => {
          // mock erc20 balance
          await this.erc20.mint(this.user1.address, this.initialRate)
          await this.erc20
            .connect(this.user1)
            .approve(this.fixedPriceAddr, this.initialRate)
          await this.erc20.mint(this.user2.address, this.initialRate)
          await this.erc20
            .connect(this.user2)
            .approve(this.fixedPriceAddr, this.initialRate)

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

        it('last 1600 second', async () => {
          testPrice(800)
        })

        it('last 3422 second', async () => {
          testPrice(3422)
        })

        it('last 3700 second', async () => {
          let time = 3700
          await network.provider.send('evm_setNextBlockTimestamp', [
            this.startTime + time,
          ])
          await network.provider.send('evm_mine')

          await expect(
            this.fixedPrice.getCurrentCostToMint()
          ).to.be.revertedWith('FixedPrice: not in time')
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
        this.initialRateBN = ethers.BigNumber.from('100')
        this.initialRate = this.initialRateBN.toString()
        this.termOfValidityBN = ethers.BigNumber.from('3600')
        this.termOfValidity = this.termOfValidityBN.toString()
        this.startTime = Date.parse(new Date()) / 1000 + 3600
        this.endTimeBN =
          ethers.BigNumber.from(this.startTime) + this.termOfValidityBN
        this.endTime = this.endTimeBN.toString()
        this.slopeBN = this.initialRateBN.div(this.termOfValidityBN)
        this.slope = this.slopeBN.toString()

        // console.log('slope', this.slope)
        // console.log('constructor time', this.startTime)

        this.constructorParameter = {
          name: 'test_name',
          symbol: 'test_symbol',
          bURI: 'https://test_url.com/',
          erc20: ethers.constants.AddressZero,
          initialRate: this.initialRate,
          startTime: this.startTime,
          termOfValidity: this.termOfValidity,
          maxSupply: 100,
        }

        const tx = await this.factory
          .connect(this.creator)
          .fixedPriceDeploy(
            this.constructorParameter.name,
            this.constructorParameter.symbol,
            this.constructorParameter.bURI,
            this.constructorParameter.erc20,
            this.constructorParameter.initialRate,
            this.constructorParameter.startTime,
            this.constructorParameter.termOfValidity,
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
          value: ethers.utils.parseEther(this.initialRate),
        }
        this.shortOptions = {
          value: ethers.utils.parseEther((this.initialRate / 2).toString()),
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
          //   ethers.utils.parseEther(this.initialRate)
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
          await network.provider.send('evm_setNextBlockTimestamp', [
            this.startTime + 660,
          ])
          await network.provider.send('evm_mine')

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
            .withArgs(
              this.creator.address,
              ethers.utils.parseEther(this.initialRate).toString()
            )

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
            .withArgs(
              this.creator.address,
              ethers.utils
                .parseEther((this.initialRate * 2).toString())
                .toString()
            )
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
