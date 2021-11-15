// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract MyERC20Token is ERC20, Ownable {
  using SafeMath for uint256;

  uint256 private constant maxSupply = 100000000 * 1e18; // the total supply

  constructor(string memory _name, string memory _symbol)
    ERC20(_name, _symbol)
  {}

  // mint with max supply
  function mint(address _to, uint256 _amount) public onlyOwner returns (bool) {
    if (_amount.add(totalSupply()) > maxSupply) {
      return false;
    }
    _mint(_to, _amount);
    return true;
  }
}
