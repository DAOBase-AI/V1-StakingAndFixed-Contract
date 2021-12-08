// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../TokenBase.sol";
import "../util/Ownable.sol";

contract TokenBaseDeployer is Ownable {
  constructor() Ownable(msg.sender) {}

  function deployTokenBase(
    string memory _name,
    string memory _symbol,
    string memory _bURI,
    address _erc20,
    uint256 _rate
  ) public onlyOwner returns (address) {
    TokenBase tokenBase = new TokenBase(_name, _symbol, _bURI, _erc20, _rate);
    address addr = address(tokenBase);
    return addr;
  }
}
