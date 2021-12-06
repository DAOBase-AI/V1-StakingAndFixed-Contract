// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "../FixedPeriod.sol";

contract FixedPeriodDeployer {
  address immutable fixedPeriodImplementation;

  constructor() {
    fixedPeriodImplementation = address(new FixedPeriod());
  }

  function deployFixedPeriod(
    string memory _name,
    string memory _symbol,
    string memory _bURI,
    address _erc20,
    address payable _platform,
    address payable _beneficiary,
    uint256 _initialRate,
    uint256 _startTime,
    uint256 _endTime,
    uint256 _maxSupply,
    uint256 _platformRate
  ) public returns (address) {
    address clone = Clones.clone(fixedPeriodImplementation);

    FixedPeriod(clone).initialize(
      _name,
      _symbol,
      _bURI,
      _erc20,
      _platform,
      _beneficiary,
      _initialRate,
      _startTime,
      _endTime,
      _maxSupply,
      _platformRate
    );
    return clone;
  }
}
