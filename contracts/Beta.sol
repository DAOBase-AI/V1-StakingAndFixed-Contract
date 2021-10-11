// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
// 需要去除mint限制，改地址与NFT token id绑定为PASS token id与NFT token id绑定
// NFT staking based PASS contract. User stake creator's NFT to mint PASS and burn PASS to get creator's NFT back
contract Beta is Context, ERC721 {
    using Counters for Counters.Counter;

    event Mint(address indexed from, uint256 indexed tokenId);
    event Burn(address indexed from, uint256 indexed tokenId);

    address public erc721;      // creator's NFT address
    mapping (address => uint256) private vault;     // associate the PASS id with staked NFT token id
    // token id counter. For erc721 contract, PASS serial number = token id
    Counters.Counter private tokenIdTracker = Counters.Counter({
        _value: 1
    });
//    mapping(address => uint256) private holders;    // check if user minted PASS

    constructor(string memory _name, string memory _symbol, address _erc721) ERC721(_name, _symbol) {
        erc721 = _erc721;       
    }
//  需要绑定token id与PASS id
    function mint(uint256 _tokenId) public returns (uint256 tokenId) {
//        require(holders[_msgSender()] == 0, "error: sender has been holder");

        tokenId = tokenIdTracker.current();                                     // accumulate the token id
        vault[tokenId] = _tokenId;                                              /* associate PASS token id with NFT token id*/
        IERC721(erc721).transferFrom(_msgSender(), address(this), _tokenId);    // send NFT from user to contract
//        holders[_msgSender()] = tokenId;                                      // associate the user address with token id
        _safeMint(_msgSender(), tokenId);                                       // mint PASS to user address

        emit Mint(_msgSender(), tokenId);                                       

        tokenIdTracker.increment();                                             // automate token id increment
    }
    // 需要解除holder的限制，不需要限制只有某个PASS的原始拥有者才能销毁
    function burn(uint256 tokenId) public {
//        require(tokenId != 0 && tokenId == holders[_msgSender()], "error: sender is not holder");
        require(tokenId != 0, "error: token id cannot be zero");

        _burn(tokenId);
//        delete holders[_msgSender()];
        IERC721(erc721).transferFrom(address(this), _msgSender(), vault[tokenId]);
//        delete vault[_msgSender()];

        emit Burn(_msgSender(), tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
