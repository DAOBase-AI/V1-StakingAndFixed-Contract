// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "../NFTBase.sol";

contract NFTBaseDeployer {
  address immutable nftBaseImplementation;

  constructor() {
    nftBaseImplementation = address(new NFTBase());
  }

  function deployNFTBase(
    string memory _name,
    string memory _symbol,
    string memory _bURI,
    address _erc721
  ) public returns (address clone) {
    clone = Clones.clone(nftBaseImplementation);

    NFTBase(clone).initialize(_name, _symbol, _bURI, _erc721);
  }
}
