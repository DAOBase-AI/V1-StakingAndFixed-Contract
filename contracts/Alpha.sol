// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
// 需要去除mint限制
// erc20 token staking based PASS contract. User stake creator's erc20 tokens to mint PASS and burn PASS to get erc20 tokens back.
contract Alpha is Context, ERC721 {
    using Counters for Counters.Counter;

    event Mint(address indexed from, uint256 indexed tokenId);
    event Burn(address indexed from, uint256 indexed tokenId);

    address public erc20;       // creator's erc20 token address
    uint256 public rate;        // staking rate of erc20 token/PASS
    // token id counter. For erc721 contract, PASS serial number = token id
    Counters.Counter private tokenIdTracker = Counters.Counter({
        _value: 1
    });
//    mapping(address => uint256) private holders;    // check if user minted PASS to limit that only origial minter can burn the same PASS

    constructor(string memory _name, string memory _symbol, address _erc20, uint256 _rate) ERC721(_name, _symbol) {
        erc20 = _erc20;
        rate = _rate;
    }

    function mint() public returns (uint256 tokenId) {
//        require(holders[_msgSender()] == 0, "error: sender has been holder");   

        tokenId = tokenIdTracker.current();                             // accumulate the token id
        // IERC20(erc20).transferFrom(_msgSender(), address(this), rate);  // user stake erc20 tokens into contract
        bool success = IERC20(erc20).transferFrom(_msgSender(), address(this), rate);
        require(success, "Transfer failed.");

        _safeMint(_msgSender(), tokenId);                               // mint PASS to user address
//        holders[_msgSender()] = tokenId;                                // associate the user address with token id 

        emit Mint(_msgSender(), tokenId);

        tokenIdTracker.increment();                                     // automate token id increment
    }
    // 需要解除holder的限制，不需要限制只有某个PASS的原始拥有者才能销毁。
    function burn(uint256 tokenId) public {
//        require(tokenId != 0 && tokenId == holders[_msgSender()], "error: sender is not holder");   
        require(tokenId != 0, "Error: token id cannot be zero");
//        delete holders[_msgSender()];
        _burn(tokenId);
        IERC20(erc20).transfer(_msgSender(), rate);

        emit Burn(_msgSender(), tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
