// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// fixed price PASS contract. Users pay specific erc20 tokens to purchase PASS from creator DAO
contract Gamma is Context, ERC721 {
    using Counters for Counters.Counter;

    event Mint(address indexed from, uint256 indexed tokenId);
    event Withdraw(address indexed to, uint256 amount);

    address public owner;   // contract owner/admin is normally the creator
    address public erc20;   // erc20 token used to purchase PASS
    uint256 public rate;    // price rate of erc20 tokens/PASS

    // PASS number counters. For erc721 contract, PASS number = token id
    Counters.Counter private tokenIdTracker = Counters.Counter({
        _value: 1
    });
    mapping(address => uint256) private holders;

    constructor(string memory _name, string memory _symbol, address _erc20, uint256 _rate) ERC721(_name, _symbol) {
        owner = tx.origin;      // the creator of DAO will be the owner of PASS contract
        erc20 = _erc20;         
        rate = _rate;
    }
    // user buy PASS from contract with specific erc20 tokens
    function mint() public returns (uint256 tokenId) {
        require(holders[_msgSender()] == 0, "error: each user can only hold one PASS");   // each user can only hold one PASS in this contract

        tokenId = tokenIdTracker.current();                             // accumulate the token id
        IERC20(erc20).transferFrom(_msgSender(), address(this), rate);  // send erc20 tokens from user to contract
        _safeMint(_msgSender(), tokenId);                               // mint PASS to user address
        holders[_msgSender()] = tokenId;                                // associate the user address with token id

        emit Mint(_msgSender(), tokenId);

        tokenIdTracker.increment();                                     // automate token id increment
    }
    // contract owner/admin withdraw erc20 tokens from contract
    function withdraw() public {
        require(owner == _msgSender(), "error: must have admin role");  // only contract owner/admin can withdraw reserve of erc20 tokens
        uint256 amount = IERC20(erc20).balanceOf(address(this));        // get the amount of erc20 tokens reserved in contract
        IERC20(erc20).transfer(_msgSender(), amount);                   // transfer erc20 tokens to contract owner address

        emit Withdraw(_msgSender(), amount);
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
