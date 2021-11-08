// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface IFixedPriceDeployer {
  function deployFixedPrice(
    string memory _name,
    string memory _symbol,
    string memory _bURI,
    address _erc20,
    uint256 _initialRate,
    uint256 _startTime,
    uint256 _termOfValidity,
    uint256 _maxSupply
  ) external returns (address);
}
