// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";

/**
 * @title Storage
 * @dev Store & retrieve value in a variable
 */
contract Storage is TimelockController, Ownable {
  constructor(
    uint256 minDelay,
    address[] memory proposers,
    address[] memory executors
  ) TimelockController(minDelay, proposers, executors) {}

  uint256 number;

  /**
   * @dev Store value in variable
   * @param num value to store
   */
  function store(uint256 num) public onlyOwner {
    number = num;
  }

  /**
   * @dev Return value
   * @return value of 'number'
   */
  function retrieve() public view returns (uint256) {
    return number;
  }
}
