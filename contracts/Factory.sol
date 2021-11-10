// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./interfaces/ITokenBaseDeployer.sol";
import "./interfaces/INFTBaseDeployer.sol";
import "./interfaces/IFixedPricePeriodDeployer.sol";
import "./interfaces/IFixedPricePeriodicDeployer.sol";

contract Factory {
  address private tokenBaseDeployer;
  address private nftBaseDeployer;
  address private fixedPricePeriodDeployer;
  address private fixedPricePeriodicDeployer;

  constructor(
    address _tokenBaseDeployer,
    address _nftBaseDeployer,
    address _fixedPricePeriodDeployer,
    address _fixedPricePeriodicDeployer
  ) {
    tokenBaseDeployer = _tokenBaseDeployer;
    nftBaseDeployer = _nftBaseDeployer;
    fixedPricePeriodDeployer = _fixedPricePeriodDeployer;
    fixedPricePeriodicDeployer = _fixedPricePeriodicDeployer;
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
  event FixedPricePeriodDeploy(
    address indexed _addr,
    string _name,
    string _symbol,
    string _bURI,
    address _erc20,
    uint256 _initialRate,
    uint256 _startTime,
    uint256 _termOfValidity,
    uint256 _maxSupply
  );

  event FixedPricePeriodicDeploy(
    address indexed _addr,
    string _name,
    string _symbol,
    string _bURI,
    address _erc20,
    uint256 _rate,
    uint256 _maxSupply
  );

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

  function fixedPricePeriodDeploy(
    string memory _name,
    string memory _symbol,
    string memory _bURI,
    address _erc20,
    uint256 _initialRate,
    uint256 _startTime,
    uint256 _termOfValidity,
    uint256 _maxSupply
  ) public payable {
    IFixedPricePeriodDeployer factory = IFixedPricePeriodDeployer(
      fixedPricePeriodDeployer
    );
    address addr = factory.deployFixedPrice(
      _name,
      _symbol,
      _bURI,
      _erc20,
      _initialRate,
      _startTime,
      _termOfValidity,
      _maxSupply
    );
    emit FixedPricePeriodDeploy(
      addr,
      _name,
      _symbol,
      _bURI,
      _erc20,
      _initialRate,
      _startTime,
      _termOfValidity,
      _maxSupply
    );
  }

  function fixedPricePeriodicDeploy(
    string memory _name,
    string memory _symbol,
    string memory _bURI,
    address _erc20,
    uint256 _rate,
    uint256 _maxSupply
  ) public payable {
    IFixedPricePeriodicDeployer factory = IFixedPricePeriodicDeployer(
      fixedPricePeriodicDeployer
    );
    address addr = factory.deployFixedPrice(
      _name,
      _symbol,
      _bURI,
      _erc20,
      _rate,
      _maxSupply
    );
    emit FixedPricePeriodicDeploy(
      addr,
      _name,
      _symbol,
      _bURI,
      _erc20,
      _rate,
      _maxSupply
    );
  }
}
