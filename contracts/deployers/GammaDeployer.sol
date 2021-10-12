// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../Gamma.sol";

contract GammaDeployer {
    function deployGamma(
        string memory _name,
        string memory _symbol,
        address _erc20,
        uint256 _rate,
        uint256 _maxSupply
    ) public returns (address) {
        address addr = address(new Gamma(_name, _symbol, _erc20, _rate, _maxSupply));
        return addr;
    }
}
