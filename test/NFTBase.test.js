const { expect, should } = require('chai')

const { network } = require('hardhat')

describe('Beeper Dao Contracts', function () {
  before(async () => {
    //Preparing the env
    ;[this.deployer, this.creator, this.platform, ...this.user] =
      await ethers.getSigners()

    this.NFTBaseFactory = await ethers.getContractFactory('NFTBase')

    let constructorParms = ['test_name', 'test_symbol', 'https://test_url.com/']

    this.ERC721Factory = await ethers.getContractFactory('ERC721Token')
    this.erc721 = await this.ERC721Factory.deploy(...constructorParms)
    await this.erc721.deployed()

    constructorParms.push(this.erc721.address)    
    this.nftBase = await this.NFTBaseFactory.deploy(...constructorParms)
    await this.nftBase.deployed()
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
