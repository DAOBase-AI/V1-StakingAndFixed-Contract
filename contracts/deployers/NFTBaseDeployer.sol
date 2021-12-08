// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../NFTBase.sol";
import "../util/Ownable.sol";

contract NFTBaseDeployer is Ownable {
  constructor() Ownable(msg.sender) {}

  function deployNFTBase(
    string memory _name,
    string memory _symbol,
    string memory _bURI,
    address _erc721
  ) public onlyOwner returns (address) {
    address addr = address(new NFTBase(_name, _symbol, _bURI, _erc721));
    return addr;
  }
}
