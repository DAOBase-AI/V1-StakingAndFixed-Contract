// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "../TokenBase.sol";
import "../util/OwnableUpgradeable.sol";
import "../interfaces/ITokenBaseDeployer.sol";

contract TokenBaseDeployer is ITokenBaseDeployer, OwnableUpgradeable {
  address public immutable TOKENBASE_IMPL;

  constructor() {
    __Ownable_init(msg.sender);
    TOKENBASE_IMPL = address(new TokenBase());
  }

  function deployTokenBase(
    string memory _name,
    string memory _symbol,
    string memory _bURI,
    address _timelock,
    address _erc20,
    uint256 _rate
  ) public override onlyOwner returns (address) {
    address clone = Clones.clone(TOKENBASE_IMPL);

    TokenBase(clone).initialize(
      _name,
      _symbol,
      _bURI,
      _timelock,
      _erc20,
      _rate
    );
    return clone;
  }
}
