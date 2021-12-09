// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../FixedPrice.sol";
import "../util/Ownable.sol";

contract FixedPriceDeployer is Ownable {
  constructor() Ownable(msg.sender) {}

  function deployFixedPrice(
    string memory _name,
    string memory _symbol,
    string memory _bURI,
    address _erc20,
    address payable _platform,
    address payable _receivingAddress,
    uint256 _rate,
    uint256 _maxSupply,
    uint256 _platformRate
  ) public onlyOwner returns (address) {
    address addr = address(
      new FixedPrice(
        _name,
        _symbol,
        _bURI,
        _erc20,
        _platform,
        _receivingAddress,
        _rate,
        _maxSupply,
        _platformRate
      )
    );
    return addr;
  }
}
