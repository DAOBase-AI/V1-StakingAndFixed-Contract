// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "../TokenBase.sol";
import "../util/OwnableUpgradeable.sol";

contract TokenBaseDeployer is OwnableUpgradeable {
  address immutable tokenBaseImplementation;

  constructor() {
    __Ownable_init(msg.sender);
    tokenBaseImplementation = address(new TokenBase());
  }

  function deployTokenBase(
    string memory _name,
    string memory _symbol,
    string memory _bURI,
    address _erc20,
    uint256 _rate
  ) public onlyOwner returns (address) {
    address clone = Clones.clone(tokenBaseImplementation);

    TokenBase(clone).initialize(_name, _symbol, _bURI, _erc20, _rate);
    return clone;
  }
}
