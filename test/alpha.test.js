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
const Balance = BigNumber.from(100000000).mul(Unit);
const Rate = BigNumber.from(999).mul(Unit);

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

describe(`Factory`, () => {
  let signer;
  let factory, alpha, erc20;
  let alphaDeployer, betaDeoyer, gammaDeployer, deltaDeployer;

  before(async () => {
    // retrieve signer
    [signer] = await hre.ethers.getSigners();

    // retrieve Contracts
    const Factory = await hre.ethers.getContractFactory('Factory');
    const AlphaDeployer = await hre.ethers.getContractFactory('AlphaDeployer');
    const BetaDeployer = await hre.ethers.getContractFactory('BetaDeployer');
    const GammaDeployer = await hre.ethers.getContractFactory('GammaDeployer');
    const DeltaDeployer = await hre.ethers.getContractFactory('DeltaDeployer');
    const Alpha = await hre.ethers.getContractFactory('Alpha');

    const ERC20Token = await hre.ethers.getContractFactory('ERC20Token');

    // attach contracts
    // factory = await Factory.attach("0x5FbDB2315678afecb367f032d93F642f64180aa3");
    alphaDeployer = await AlphaDeployer.deploy();
    betaDeoyer = await BetaDeployer.deploy();
    gammaDeployer = await GammaDeployer.deploy();
    deltaDeployer = await DeltaDeployer.deploy();

    factory = await Factory.deploy(alphaDeployer.address, betaDeoyer.address, gammaDeployer.address, deltaDeployer.address);
    erc20 = await ERC20Token.deploy("ERC20", "FT");
    let tx = await factory.alphaDeploy(Id, Name, Symbol, erc20.address, Rate);
    let receipt = await tx.wait();
    alpha = await Alpha.attach(receipt.events[0].args[0]);
    // init

    await erc20.mint(signer.address, Balance);
    console.log(`address: ${signer.address}`);
    console.log(`mint: ${Balance}`);
    console.log(`balanceOf: ${await erc20.balanceOf(signer.address)}`);
  });

  describe(`unit test`, () => {
    const ERRORS = {
      NONEXISTENT_TOKEN: 'ERC721: owner query for nonexistent token',
    };

    it(`mint()`, async () => {
      let address = signer.address.toLowerCase();

      await erc20.approve(alpha.address, Rate);
      await expect(alpha.ownerOf(1)).to.revertedWith(ERRORS.NONEXISTENT_TOKEN);
      let tx = await alpha.mint();
      expect((await alpha.ownerOf(1)).toLowerCase()).to.eq(address);
      expect(await erc20.balanceOf(address)).to.eq(Balance.sub(Rate));

      console.log(`address: ${address}`);
      console.log(`alpha.ownerOf(1): ${(await alpha.ownerOf(1)).toLowerCase()}`);
      console.log(`erc20.balanceOf(address): ${(await erc20.balanceOf(address)).div(Unit).toString()}`);
    });

    it(`burn()`, async () => {
      let address = signer.address.toLowerCase();

      let tx = await alpha.burn(1);
      await expect(alpha.ownerOf(1)).to.revertedWith(ERRORS.NONEXISTENT_TOKEN);
      expect(await erc20.balanceOf(address)).to.eq(Balance);

      console.log(`address: ${address}`);
      console.log(`erc20.balanceOf(address): ${(await erc20.balanceOf(address)).div(Unit).toString()}`);
    });
  });
});
