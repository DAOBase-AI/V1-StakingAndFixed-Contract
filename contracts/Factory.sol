// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/ITokenBaseDeployer.sol";
import "./interfaces/INFTBaseDeployer.sol";
import "./interfaces/IFixedPeriodDeployer.sol";
import "./interfaces/IFixedPriceDeployer.sol";

contract Factory is Ownable {
  address private tokenBaseDeployer;
  address private nftBaseDeployer;
  address private fixedPeriodDeployer;
  address private fixedPriceDeployer;

  address payable private platform;
  uint256 private platformRate;

  constructor(
    address _tokenBaseDeployer,
    address _nftBaseDeployer,
    address _fixedPeriodDeployer,
    address _fixedPriceDeployer
  ) {
    tokenBaseDeployer = _tokenBaseDeployer;
    nftBaseDeployer = _nftBaseDeployer;
    fixedPeriodDeployer = _fixedPeriodDeployer;
    fixedPriceDeployer = _fixedPriceDeployer;
  }

  event TokenBaseDeploy(
    address indexed _addr, //address of deployed NFT PASS contract
    string _name,
    string _symbol,
    string _bURI, //baseuri of NFT PASS
    address _erc20,
    uint256 _rate
  );
  event NFTBaseDeploy(
    address indexed _addr,
    string _name,
    string _symbol,
    string _bURI,
    address _erc721
  );
  event FixedPeriodDeploy(
    address indexed _addr,
    string _name,
    string _symbol,
    string _bURI,
    address _erc20,
    address _platform,
    address _beneficiary,
    uint256 _initialRate,
    uint256 _startTime,
    uint256 _termOfValidity,
    uint256 _maxSupply,
    uint256 _platformRate
  );

  event FixedPriceDeploy(
    address indexed _addr,
    string _name,
    string _symbol,
    string _bURI,
    address _erc20,
    address _platform,
    address _beneficiary,
    uint256 _rate,
    uint256 _maxSupply,
    uint256 _platformRate
  );

  // set up the platform commission account
  function setPlatform(address payable _platform) public onlyOwner {
    platform = _platform;
  }

  // set the platform commission rate, only operable by contract owner, _platformRate is in pph
  function setPlatformRate(uint256 _platformRate) public onlyOwner {
    platformRate = _platformRate;
  }

  function tokenBaseDeploy(
    string memory _name,
    string memory _symbol,
    string memory _bURI,
    address _erc20,
    uint256 _rate
  ) public payable {
    ITokenBaseDeployer factory = ITokenBaseDeployer(tokenBaseDeployer);
    //return the address of deployed NFT PASS contract
    address addr = factory.deployTokenBase(
      _name,
      _symbol,
      _bURI,
      _erc20,
      _rate
    );
    emit TokenBaseDeploy(addr, _name, _symbol, _bURI, _erc20, _rate);
  }

  function nftBaseDeploy(
    string memory _name,
    string memory _symbol,
    string memory _bURI,
    address _erc721
  ) public payable {
    INFTBaseDeployer factory = INFTBaseDeployer(nftBaseDeployer);
    address addr = factory.deployNFTBase(_name, _symbol, _bURI, _erc721);
    emit NFTBaseDeploy(addr, _name, _symbol, _bURI, _erc721);
  }

  function fixedPeriodDeploy(
    string memory _name,
    string memory _symbol,
    string memory _bURI,
    address _erc20,
    address payable _beneficiary,
    uint256 _initialRate,
    uint256 _startTime,
    uint256 _termOfValidity,
    uint256 _maxSupply
  ) public payable {
    address addr = IFixedPeriodDeployer(fixedPeriodDeployer).deployFixedPeriod(
      _name,
      _symbol,
      _bURI,
      _erc20,
      platform,
      _beneficiary,
      _initialRate,
      _startTime,
      _termOfValidity,
      _maxSupply,
      platformRate
    );
    emit FixedPeriodDeploy(
      addr,
      _name,
      _symbol,
      _bURI,
      _erc20,
      platform,
      _beneficiary,
      _initialRate,
      _startTime,
      _termOfValidity,
      _maxSupply,
      platformRate
    );
  }

  function fixedPriceDeploy(
    string memory _name,
    string memory _symbol,
    string memory _bURI,
    address _erc20,
    address payable _platform,
    address payable _beneficiary,
    uint256 _rate,
    uint256 _maxSupply,
    uint256 _platformRate
  ) public payable {
    IFixedPriceDeployer factory = IFixedPriceDeployer(fixedPriceDeployer);
    address addr = factory.deployFixedPrice(
      _name,
      _symbol,
      _bURI,
      _erc20,
      _platform,
      _beneficiary,
      _rate,
      _maxSupply,
      _platformRate
    );
    emit FixedPriceDeploy(
      addr,
      _name,
      _symbol,
      _bURI,
      _erc20,
      _platform,
      _beneficiary,
      _rate,
      _maxSupply,
      _platformRate
    );
  }
}
