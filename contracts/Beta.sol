// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract Beta is Context, ERC721 {
    using Counters for Counters.Counter;

    event Mint(address indexed from, uint256 indexed tokenId);
    event Burn(address indexed from, uint256 indexed tokenId);

    address public erc721;
    mapping (address => uint256) private vault;

    Counters.Counter private tokenIdTracker = Counters.Counter({
        _value: 1
    });
    mapping(address => uint256) private holders;

    constructor(string memory _name, string memory _symbol, address _erc721) ERC721(_name, _symbol) {
        erc721 = _erc721;
    }

    function mint(uint256 _tokenId) public returns (uint256 tokenId) {
        require(holders[_msgSender()] == 0, "Beta: sender has been holder");

        tokenId = tokenIdTracker.current();
        vault[_msgSender()] = _tokenId;
        IERC721(erc721).transferFrom(_msgSender(), address(this), _tokenId);
        holders[_msgSender()] = tokenId;
        _safeMint(_msgSender(), tokenId);

        emit Mint(_msgSender(), tokenId);

        tokenIdTracker.increment();
    }

    function burn(uint256 tokenId) public {
        require(tokenId != 0 && tokenId == holders[_msgSender()], "Beta: sender is not holder");

        _burn(tokenId);
        delete holders[_msgSender()];
        IERC721(erc721).transferFrom(address(this), _msgSender(), vault[_msgSender()]);
        delete vault[_msgSender()];

        emit Burn(_msgSender(), tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
