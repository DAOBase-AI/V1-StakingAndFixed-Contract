// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../Alpha.sol";

contract AlphaDeployer {
    function deployAlpha(
        string memory _name,
        string memory _symbol,
        string memory _bURI,
        address _erc20,
        uint256 _rate
    ) public returns (address) {
        Alpha alpha = new Alpha(_name, _symbol, _bURI, _erc20, _rate);
        address addr = address(alpha);
        return addr;
    }
}
