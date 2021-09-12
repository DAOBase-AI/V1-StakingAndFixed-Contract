// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface IDeltaDeployer {
    function deployDelta(
        string memory _name,
        string memory _symbol,
        address _erc20,
        uint256 _ownerRate,
        uint256 _startPrice,
        uint256 _totalSupply,
        address _incentiveAddress,
        uint256 _amount
    ) external returns (address);
}
