// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface IGammaDeployer {
    function deployGamma(
        string memory _name,
        string memory _symbol,
        string memory _bURI,
        address _erc20,
        uint256 _rate,
        uint256 _maxSupply
    ) external returns (address);
}
