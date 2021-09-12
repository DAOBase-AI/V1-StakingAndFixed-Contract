const hre = require('hardhat');
const { expect } = require('chai');

const BigNumber = hre.ethers.BigNumber;
const Wallet = hre.ethers.Wallet;
const utils = hre.ethers.utils;

const Decimals = 18;
const Unit = BigNumber.from(10).pow(Decimals);

const Id = 10;
const Name = 'Name';
const Symbol = 'Symbol';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

describe(`Factory`, () => {
  let signer;
  let factory, beta, erc721;

  before(async () => {
    // retrieve signer
    [ signer ] = await hre.ethers.getSigners();

    // retrieve Contracts
    const Factory = await hre.ethers.getContractFactory('Factory');
    const AlphaDeployer = await hre.ethers.getContractFactory('AlphaDeployer');
    const BetaDeployer = await hre.ethers.getContractFactory('BetaDeployer');
    const GammaDeployer = await hre.ethers.getContractFactory('GammaDeployer');
    const DeltaDeployer = await hre.ethers.getContractFactory('DeltaDeployer');
    const Beta = await hre.ethers.getContractFactory('Beta');

    const ERC721Token = await hre.ethers.getContractFactory('ERC721Token');

    // attach contracts
    alphaDeployer = await AlphaDeployer.deploy();
    betaDeoyer = await BetaDeployer.deploy();
    gammaDeployer = await GammaDeployer.deploy();
    deltaDeployer = await DeltaDeployer.deploy();

    factory = await Factory.deploy(alphaDeployer.address, betaDeoyer.address, gammaDeployer.address, deltaDeployer.address);
    erc721 = await ERC721Token.deploy("TestToken", "NFT", "hello_kitty");
    let tx = await factory.betaDeploy(Id, Name, Symbol, erc721.address);
    let receipt = await tx.wait();
    beta = await Beta.attach(receipt.events[0].args[0]);

    // init

    await erc721.mint(signer.address);
    await erc721.mint(signer.address);
    console.log(`address: ${signer.address}`);
    console.log(`erc721.balanceOf(address): ${await  erc721.balanceOf(signer.address)}`);
  });

  describe(`unit test`, () => {
    const ERRORS = {
      NONEXISTENT_TOKEN: 'ERC721: owner query for nonexistent token',
    };

    it(`mint()`, async () => {
      let address = signer.address.toLowerCase();

      await erc721.approve(beta.address, 2);
      await expect(beta.ownerOf(1)).to.revertedWith(ERRORS.NONEXISTENT_TOKEN);
      let tx = await beta.mint(2);
      expect((await beta.ownerOf(1)).toLowerCase()).to.eq(address);
      expect(await erc721.balanceOf(address)).to.eq(1);

      console.log(`address: ${address}`);
      console.log(`beta.ownerOf(1): ${(await beta.ownerOf(1)).toLowerCase()}`);
      console.log(`erc721.balanceOf(address): ${(await erc721.balanceOf(address)).toString()}`);
    });

    it(`burn()`, async () => {
      let address = signer.address.toLowerCase();

      let tx = await beta.burn(1);
      await expect(beta.ownerOf(1)).to.revertedWith(ERRORS.NONEXISTENT_TOKEN);
      expect(await erc721.balanceOf(address)).to.eq(2);

      console.log(`address: ${address}`);
      console.log(`erc721.balanceOf(address): ${(await erc721.balanceOf(address)).toString()}`);
    });
  });
});
