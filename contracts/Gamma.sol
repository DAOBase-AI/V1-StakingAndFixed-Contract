// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Gamma is Context, ERC721 {
    using Counters for Counters.Counter;

    event Mint(address indexed from, uint256 indexed tokenId);
    event Withdraw(address indexed to, uint256 amount);

    address public owner;
    address public erc20;
    uint256 public rate;

    Counters.Counter private tokenIdTracker = Counters.Counter({
        _value: 1
    });
    mapping(address => uint256) private holders;

    constructor(string memory _name, string memory _symbol, address _erc20, uint256 _rate) ERC721(_name, _symbol) {
        owner = tx.origin;

        erc20 = _erc20;
        rate = _rate;
    }

    function mint() public returns (uint256 tokenId) {
        require(holders[_msgSender()] == 0, "Gamma: sender has been holder");

        tokenId = tokenIdTracker.current();
        IERC20(erc20).transferFrom(_msgSender(), address(this), rate);
        _safeMint(_msgSender(), tokenId);
        holders[_msgSender()] = tokenId;

        emit Mint(_msgSender(), tokenId);

        tokenIdTracker.increment();
    }

    function withdraw() public {
        require(owner == _msgSender(), "Gamma: must have admin role");
        uint256 amount = IERC20(erc20).balanceOf(address(this));
        IERC20(erc20).transfer(_msgSender(), amount);

        emit Withdraw(_msgSender(), amount);
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
