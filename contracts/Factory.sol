// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./util/Ownable.sol";
import "./interfaces/ITokenBaseDeployer.sol";
import "./interfaces/INFTBaseDeployer.sol";
import "./interfaces/IFixedPeriodDeployer.sol";
import "./interfaces/IFixedPriceDeployer.sol";

contract Factory is Ownable {
  address private tokenBaseDeployer;    // staking erc20 tokens to mint PASS
  address private nftBaseDeployer;      // staking erc721 tokens to mint PASS
  address private fixedPeriodDeployer;  // pay erc20 tokens to mint PASS in a fixed period with linearly decreasing price
  address private fixedPriceDeployer;   // pay erc20 tokens to mint PASS with fixed price

  address payable private platform;     // The PASS platform commission account
  uint256 private platformRate;         // The PASS platform commission rate in pph

  constructor(
    address _tokenBaseDeployer,         
    address _nftBaseDeployer,
    address _fixedPeriodDeployer,
    address _fixedPriceDeployer
  ) Ownable(msg.sender) {
    tokenBaseDeployer = _tokenBaseDeployer;
    nftBaseDeployer = _nftBaseDeployer;
    fixedPeriodDeployer = _fixedPeriodDeployer;
    fixedPriceDeployer = _fixedPriceDeployer;
  }

  event TokenBaseDeploy(
    address indexed _addr,   // address of deployed NFT PASS contract
    string _name,            // name of PASS
    string _symbol,          // symbol of PASS
    string _bURI,            // baseuri of NFT PASS
    address _erc20,          // address of staked erc20 tokens
    uint256 _rate            // staking rate of erc20 tokens/PASS
  );
  event NFTBaseDeploy(
    address indexed _addr,
    string _name,
    string _symbol,
    string _bURI,
    address _erc721          // address of staked erc721 tokens
  );
  event FixedPeriodDeploy(
    address indexed _addr,
    string _name,
    string _symbol,
    string _bURI,
    address _erc20,          // payment erc20 tokens
    address _platform,
    address _beneficiary,    // creator's beneficiary account to receive erc20 tokens
    uint256 _initialRate,    // initial exchange rate of erc20 tokens/PASS
    uint256 _startTime,      // start time of sales period
    uint256 _salesValidity,  // period of sales validity
    uint256 _maxSupply,      // maximum supply of PASS
    uint256 _platformRate    
  );

  event FixedPriceDeploy(
    address indexed _addr,
    string _name,
    string _symbol,
    string _bURI,
    address _erc20,           // payment erc20 tokens
    address _platform,
    address _beneficiary,
    uint256 _rate,
    uint256 _maxSupply,
    uint256 _platformRate
  );

  event SetPlatformParm(address _platform, uint256 _platformRate);

  // set the platform account and commission rate, only operable by contract owner, _platformRate is in pph
  function setPlatformParm(address payable _platform, uint256 _platformRate)
    public
    onlyOwner
  {
    platform = _platform;
    platformRate = _platformRate;
    emit SetPlatformParm(_platform, _platformRate);
  }

  function tokenBaseDeploy(
    string memory _name,
    string memory _symbol,
    string memory _bURI,
    address _erc20,
    uint256 _rate
  ) public {
    ITokenBaseDeployer factory = ITokenBaseDeployer(tokenBaseDeployer);
    //return the address of deployed NFT PASS contract
    address addr = factory.deployTokenBase(_name, _symbol, _bURI, _erc20, _rate);
    emit TokenBaseDeploy(addr, _name, _symbol, _bURI, _erc20, _rate);
  }

  function nftBaseDeploy(
    string memory _name,
    string memory _symbol,
    string memory _bURI,
    address _erc721
  ) public {
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
    uint256 _salesValidity,
    uint256 _maxSupply
  ) public {
    address addr = IFixedPeriodDeployer(fixedPeriodDeployer).deployFixedPeriod(
      _name,
      _symbol,
      _bURI,
      _erc20,
      platform,
      _beneficiary,
      _initialRate,
      _startTime,
      _salesValidity,
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
      _salesValidity,
      _maxSupply,
      platformRate
    );
  }

  function fixedPriceDeploy(
    string memory _name,
    string memory _symbol,
    string memory _bURI,
    address _erc20,
    address payable _beneficiary,
    uint256 _rate,
    uint256 _maxSupply
  ) public {
    IFixedPriceDeployer factory = IFixedPriceDeployer(fixedPriceDeployer);
    address addr = factory.deployFixedPrice(
      _name,
      _symbol,
      _bURI,
      _erc20,
      platform,
      _beneficiary,
      _rate,
      _maxSupply,
      platformRate
    );
    emit FixedPriceDeploy(
      addr,
      _name,
      _symbol,
      _bURI,
      _erc20,
      platform,
      _beneficiary,
      _rate,
      _maxSupply,
      platformRate
    );
  }
}
