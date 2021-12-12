// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "../NFTBase.sol";
import "../util/OwnableUpgradeable.sol";

contract NFTBaseDeployer is OwnableUpgradeable {
  address immutable nftBaseImplementation;

  constructor() {
    __Ownable_init(msg.sender);
    nftBaseImplementation = address(new NFTBase());
  }

  function deployNFTBase(
    string memory _name,
    string memory _symbol,
    string memory _bURI,
    address _erc721
  ) public onlyOwner returns (address) {
    address clone = Clones.clone(nftBaseImplementation);

    NFTBase(clone).initialize(_name, _symbol, _bURI, _erc721);
    return clone;
  }
}
