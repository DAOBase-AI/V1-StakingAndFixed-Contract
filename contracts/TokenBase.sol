// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// import "@openzeppelin/contracts/access/Ownable.sol";

// erc20 token staking based PASS contract. User stake creator's erc20 tokens to mint PASS and burn PASS to get erc20 tokens back.
contract TokenBase is Context, ERC721, ERC721Burnable {
  using Counters for Counters.Counter;
  using Strings for uint256;

  event Mint(address indexed from, uint256 indexed tokenId);
  event Burn(address indexed from, uint256 indexed tokenId);

  address public owner; // contract owner is normally the creator
  address public erc20; // creator's erc20 token address
  uint256 public rate; // staking rate of erc20 token/PASS

  // Optional mapping for token URIs
  mapping(uint256 => string) private _tokenURIs;

  // Base URI
  string private _baseURIextended;

  // token id counter. For erc721 contract, PASS index number = token id
  Counters.Counter private tokenIdTracker = Counters.Counter({_value: 1});

  constructor(
    string memory _name,
    string memory _symbol,
    string memory _bURI,
    address _erc20,
    uint256 _rate
  ) ERC721(_name, _symbol) {
    owner = tx.origin; // the creator of DAO will be the owner of PASS contract
    _baseURIextended = _bURI;
    erc20 = _erc20;
    rate = _rate;
  }

  function setBaseURI(string memory baseURI_) public {
    require(owner == _msgSender(), "TokenBase: not the owner"); // only contract owner can setTokenURI
    _baseURIextended = baseURI_;
  }

  function _baseURI() internal view virtual override returns (string memory) {
    return _baseURIextended;
  }

  function tokenURI(uint256 tokenId)
    public
    view
    virtual
    override
    returns (string memory)
  {
    require(
      _exists(tokenId),
      "ERC721Metadata: URI query for nonexistent token"
    );

    string memory _tokenURI = _tokenURIs[tokenId];
    string memory base = _baseURI();

    // If there is no base URI, return the token URI.
    if (bytes(base).length == 0) {
      return _tokenURI;
    }
    // If both are set, concatenate the baseURI and tokenURI (via abi.encodePacked).
    if (bytes(_tokenURI).length > 0) {
      return string(abi.encodePacked(base, _tokenURI));
    }
    // If there is a baseURI but no tokenURI, concatenate the tokenID to the baseURI.
    return string(abi.encodePacked(base, tokenId.toString()));
  }

  function _setTokenURI(uint256 tokenId, string memory _tokenURI)
    internal
    virtual
  {
    require(_exists(tokenId), "ERC721Metadata: URI set of nonexistent token");
    _tokenURIs[tokenId] = _tokenURI;
  }

  function setTokenURI(uint256 tokenId, string memory _tokenURI) public {
    require(owner == _msgSender(), "TokenBase: caller is not the owner"); // only contract owner can setTokenURI
    _setTokenURI(tokenId, _tokenURI);
  }

  // stake creator's erc20 tokens to mint PASS
  function mint() public returns (uint256 tokenId) {
    tokenId = tokenIdTracker.current(); // accumulate the token id

    bool success = IERC20(erc20).transferFrom(
      _msgSender(),
      address(this),
      rate
    );
    // in case old contract only return false when transfer fails
    require(success, "ERC20: transfer failed.");

    _safeMint(_msgSender(), tokenId); // mint PASS to user address
    emit Mint(_msgSender(), tokenId);

    tokenIdTracker.increment(); // automate token id increment
  }

  // burn PASS to get erc20 tokens back
  function burn(uint256 tokenId) public virtual override {
    require(tokenId != 0, "TokenBase: token id cannot be zero");

    super.burn(tokenId);
    IERC20(erc20).transfer(_msgSender(), rate);
    emit Burn(_msgSender(), tokenId);
  }

  function supportsInterface(bytes4 interfaceId)
    public
    view
    virtual
    override(ERC721)
    returns (bool)
  {
    return super.supportsInterface(interfaceId);
  }
}
