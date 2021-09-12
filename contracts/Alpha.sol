// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Alpha is Context, ERC721 {
    using Counters for Counters.Counter;

    event Mint(address indexed from, uint256 indexed tokenId);
    event Burn(address indexed from, uint256 indexed tokenId);

    address public erc20;
    uint256 public rate;

    Counters.Counter private tokenIdTracker = Counters.Counter({
        _value: 1
    });
    mapping(address => uint256) private holders;

    constructor(string memory _name, string memory _symbol, address _erc20, uint256 _rate) ERC721(_name, _symbol) {
        erc20 = _erc20;
        rate = _rate;
    }

    function mint() public returns (uint256 tokenId) {
        require(holders[_msgSender()] == 0, "Alpha: sender has been holder");

        tokenId = tokenIdTracker.current();
        IERC20(erc20).transferFrom(_msgSender(), address(this), rate);
        _safeMint(_msgSender(), tokenId);
        holders[_msgSender()] = tokenId;

        emit Mint(_msgSender(), tokenId);

        tokenIdTracker.increment();
    }

    function burn(uint256 tokenId) public {
        require(tokenId != 0 && tokenId == holders[_msgSender()], "Alpha: sender is not holder");

        delete holders[_msgSender()];
        _burn(tokenId);
        IERC20(erc20).transfer(_msgSender(), rate);

        emit Burn(_msgSender(), tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
