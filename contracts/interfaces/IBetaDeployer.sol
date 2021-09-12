// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface IBetaDeployer {
    function deployBeta(
        string memory _name,
        string memory _symbol,
        address _erc721
    ) external returns (address);
}
