// contracts/erc20/ERC20Token.sol
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/presets/ERC20PresetMinterPauser.sol";

contract ERC20Token is ERC20PresetMinterPauser {
  uint8 private __decimals;

  constructor(
    string memory name,
    string memory symbol,
    uint8 _decimals
  ) ERC20PresetMinterPauser(name, symbol) {
    __decimals = _decimals;
  }

  function decimals() public view virtual override returns (uint8) {
    return __decimals;
  }

  function faucet(uint256 amount) public {
    _mint(msg.sender, amount);
  }
}
