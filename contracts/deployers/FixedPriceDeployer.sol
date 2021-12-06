// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "../FixedPrice.sol";

contract FixedPriceDeployer {
  address immutable fixedPriceImplementation;

  constructor() {
    fixedPriceImplementation = address(new FixedPrice());
  }

  function deployFixedPrice(
    string memory _name,
    string memory _symbol,
    string memory _bURI,
    address _erc20,
    address payable _platform,
    address payable _beneficiary,
    uint256 _rate,
    uint256 _maxSupply,
    uint256 _platformRate
  ) public returns (address clone) {
    clone = Clones.clone(fixedPriceImplementation);
    FixedPrice(clone).initialize(
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
