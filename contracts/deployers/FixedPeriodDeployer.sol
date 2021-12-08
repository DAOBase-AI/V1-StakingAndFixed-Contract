// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../FixedPeriod.sol";
import "../util/Ownable.sol";

contract FixedPeriodDeployer is Ownable {
  constructor() Ownable(msg.sender) {}

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
  ) public onlyOwner returns (address) {
    return
      address(
        new FixedPeriod(
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
        )
      );
  }
}
