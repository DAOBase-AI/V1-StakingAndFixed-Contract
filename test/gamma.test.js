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

describe(`Factory`, () =>{
  let signer, alice;
  let factory, gamma, erc20;

  before(async () => {
    // retrieve signer
    [ signer, alice ] = await hre.ethers.getSigners();

    // retrieve Contracts
    const Factory = await hre.ethers.getContractFactory('Factory');
    const AlphaDeployer = await hre.ethers.getContractFactory('AlphaDeployer');
    const BetaDeployer = await hre.ethers.getContractFactory('BetaDeployer');
    const GammaDeployer = await hre.ethers.getContractFactory('GammaDeployer');
    const DeltaDeployer = await hre.ethers.getContractFactory('DeltaDeployer');
    const Gamma = await hre.ethers.getContractFactory('Gamma');

    const ERC20Token = await hre.ethers.getContractFactory('ERC20Token');

    // attach contracts
    alphaDeployer = await AlphaDeployer.deploy();
    betaDeoyer = await BetaDeployer.deploy();
    gammaDeployer = await GammaDeployer.deploy();
    deltaDeployer = await DeltaDeployer.deploy();

    factory = await Factory.deploy(alphaDeployer.address, betaDeoyer.address, gammaDeployer.address, deltaDeployer.address);
    erc20 = await ERC20Token.deploy("ERC20", "Token");
    let tx = await factory.gammaDeploy(Id, Name, Symbol, erc20.address, Rate);
    let receipt = await tx.wait();
    gamma = await Gamma.attach(receipt.events[0].args[0]);

    // init
    await erc20.mint(signer.address, Balance);
    console.log(`address: ${signer.address}`);
    console.log(`mint: ${Balance}`);
    console.log(`balanceOf: ${await  erc20.balanceOf(signer.address)}`);
  });

  describe(`unit test`, () => {
    const ERRORS = {
      NONEXISTENT_TOKEN: 'ERC721: owner query for nonexistent token',
      NOPERMISSION: 'Gamma: must have admin role',
    };

    it(`mint()`, async () => {
      let address = signer.address.toLowerCase();

      await erc20.approve(gamma.address, Rate);
      await expect(gamma.ownerOf(1)).to.revertedWith(ERRORS.NONEXISTENT_TOKEN);
      let tx = await gamma.mint();
      expect((await gamma.ownerOf(1)).toLowerCase()).to.eq(address);
      expect(await erc20.balanceOf(address)).to.eq(Balance.sub(Rate));

      console.log(`address: ${address}`);
      console.log(`gama.ownerOf(1): ${(await gamma.ownerOf(1)).toLowerCase()}`);
      console.log(`erc20.balanceOf(address): ${(await erc20.balanceOf(address)).div(Unit).toString()}`);
    });

    it(`withdraw() by alice`, async () => {
      await expect(gamma.connect(alice).withdraw()).to.revertedWith(ERRORS.NOPERMISSION);
    });

    it(`withdraw()`, async () => {
      await gamma.withdraw();
      expect(await erc20.balanceOf(signer.address)).to.eq(Balance);
      console.log(`address: ${signer.address}`);
      console.log(`erc20.balanceOf(address): ${(await erc20.balanceOf(signer.address)).div(Unit).toString()}`);
    });
  });
});
