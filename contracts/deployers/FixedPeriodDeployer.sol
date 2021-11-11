// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../FixedPeriod.sol";

contract FixedPeriodDeployer {
  function deployFixedPeriod(
    string memory _name,
    string memory _symbol,
    string memory _bURI,
    address _erc20,
    address payable _platform,
    uint256 _initialRate,
    uint256 _startTime,
    uint256 _termOfValidity,
    uint256 _maxSupply,
    uint256 _platformRate
  ) public returns (address) {
    return
      address(
        new FixedPeriod(
          _name,
          _symbol,
          _bURI,
          _erc20,
          _platform,
          _initialRate,
          _startTime,
          _termOfValidity,
          _maxSupply,
          _platformRate
        )
      );
  }
}
