// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../Delta.sol";

contract DeltaDeployer {
    function deployDelta(
        string memory _name,
        string memory _symbol,
        address _erc20,
        uint256 _ownerRate,
        uint256 _startPrice,
        uint256 _totalSupply,
        address _incentiveAddress,
        uint256 _amount
    ) public returns (address) {
        address addr = address(
            new Delta(
                _name,
                _symbol,
                _erc20,
                _ownerRate,
                _startPrice,
                _totalSupply,
                _incentiveAddress,
                _amount
            )
        );
        return addr;
    }
}
