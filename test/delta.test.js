const hre = require('hardhat');
const { expect } = require('chai');

const BigNumber = hre.ethers.BigNumber;

const Decimals = 18;
const Unit = BigNumber.from(10).pow(Decimals);

const Id = 10;
const Name = 'Name';
const Symbol = 'Symbol';
const Balance = BigNumber.from(100000000).mul(Unit);
const Rate = BigNumber.from(999).mul(Unit);
const TxRate = BigNumber.from(15);
const OwnerRate = BigNumber.from(30);
const StartPrice = BigNumber.from(1).mul(Unit);
const TotalSupply = BigNumber.from(10000);
const IncentiveAddress = "0x5322d18080C18ED152C03C13f09817bB0B51a486";
const Amount = BigNumber.from(3);

describe(`Factory`, () => {
  let signer, alice;
  let factory, delta, erc20;

  beforeEach(async () => {
    [signer, alice] = await hre.ethers.getSigners();

    const Factory = await hre.ethers.getContractFactory('Factory');
    const AlphaDeployer = await hre.ethers.getContractFactory('AlphaDeployer');
    const BetaDeployer = await hre.ethers.getContractFactory('BetaDeployer');
    const GammaDeployer = await hre.ethers.getContractFactory('GammaDeployer');
    const DeltaDeployer = await hre.ethers.getContractFactory('DeltaDeployer');

    const Delta = await hre.ethers.getContractFactory('Delta');
    const Erc20Token = await hre.ethers.getContractFactory('ERC20Token');

    alphaDeployer = await AlphaDeployer.deploy();
    betaDeoyer = await BetaDeployer.deploy();
    gammaDeployer = await GammaDeployer.deploy();
    deltaDeployer = await DeltaDeployer.deploy();

    factory = await Factory.deploy(alphaDeployer.address, betaDeoyer.address, gammaDeployer.address, deltaDeployer.address);
    erc20 = await Erc20Token.deploy("ERC20", "Token");
    let tx = await factory.deltaDeploy(Id, Name, Symbol, erc20.address, OwnerRate, StartPrice, TotalSupply, IncentiveAddress, Amount);
    let receipt = await tx.wait();
    delta = await Delta.attach(receipt.events[0].args[0]);

    await erc20.mint(signer.address, Balance);
    console.log(`address: ${signer.address}`);
    console.log(`mint: ${Balance}`);
    console.log(`BalanceOf: ${await erc20.balanceOf(signer.address)}`);
  });

  describe('delta unit test', () => {
    const ERRORS = {
      NONEXISTENT_TOKEN: 'ERC721: owner query for nonexistent token',
      NO_PERMISSION: 'Delta: must have admin role',
      FULL_SUPPLY: 'Delta: supply is full',
      DUPLICATE_MINT: 'Delta: sender has been holder',
    };

    it('mint', async () => {
      await erc20.approve(delta.address, Balance);
      await expect(delta.ownerOf(1)).to.be.revertedWith(ERRORS.NONEXISTENT_TOKEN);
      let tx = await delta.mint();
      let receipt = await tx.wait();
      expect((await delta.ownerOf(1)).toLowerCase()).to.eq(signer.address.toLowerCase());
      // expect(await erc20.balanceOf(signer.address)).to.eq(Balance.sub(Rate));
      // await delta.mint();
      // await delta.mint();
      // expect(await delta.mint()).to.be.revertedWith(ERRORS.FULL_SUPPLY);
    });

    it('withdraw() by alice', async () => {
      await delta.withdraw();
      expect(await erc20.balanceOf(signer.address)).to.eq(Balance);
      console.log(`address: ${signer.address}`);
      console.log(`erc20.BalanceOf(address): ${(await erc20.balanceOf(signer.address)).div(Unit).toString()}`)
    });

    it('withdraw()', async () => {
      await delta.withdraw();
      expect(await erc20.balanceOf(signer.address)).to.eq(Balance);
    })
  })
});
