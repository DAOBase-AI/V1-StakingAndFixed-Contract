// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

// import "@openzeppelin/contracts/access/Ownable.sol";

// NFT staking based PASS contract. User stake creator's NFT to mint PASS and burn PASS to get creator's NFT back
contract NFTBase is Context, AccessControl, ERC721 {
  using Counters for Counters.Counter;
  using Strings for uint256;

  event Mint(address indexed from, uint256 indexed tokenId);
  event Burn(address indexed from, uint256 indexed tokenId);

  bytes32 public constant CREATOR = keccak256("CREATOR");

  address public owner; // contract owner is normally the creator
  address public erc721; // creator's NFT address
  mapping(uint256 => uint256) private vault; // associate the PASS id with staked NFT token id

  // Optional mapping for token URIs
  mapping(uint256 => string) private _tokenURIs;

  // Base URI
  string private _baseURIextended;

  // token id counter. For erc721 contract, PASS serial number = token id
  Counters.Counter private tokenIdTracker = Counters.Counter({_value: 1});

  constructor(
    string memory _name,
    string memory _symbol,
    string memory _bURI,
    address _erc721
  ) ERC721(_name, _symbol) {
    _setupRole(CREATOR, tx.origin);
    owner = tx.origin; // the creator of DAO will be the owner of PASS contract
    _baseURIextended = _bURI;
    erc721 = _erc721;
  }

  // only contract owner can setTokenURI
  function setBaseURI(string memory baseURI_) public onlyRole(CREATOR) {
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

  // only contract owner can setTokenURI
  function setTokenURI(uint256 tokenId, string memory _tokenURI)
    public
    onlyRole(CREATOR)
  {
    _setTokenURI(tokenId, _tokenURI);
  }

  // stake creator's NFT to mint PASS
  function mint(uint256 _tokenId) public returns (uint256 tokenId) {
    tokenId = tokenIdTracker.current(); // accumulate the token id
    vault[tokenId] = _tokenId; // associate PASS token id with NFT token id

    IERC721(erc721).transferFrom(_msgSender(), address(this), _tokenId);

    _safeMint(_msgSender(), tokenId); // mint PASS to user address
    emit Mint(_msgSender(), tokenId);

    tokenIdTracker.increment(); // automate token id increment
  }

  // burn PASS to get creator's NFT back
  function burn(uint256 tokenId) public {
    require(tokenId != 0, "NFTBase: token id cannot be zero");

    _burn(tokenId);
    IERC721(erc721).transferFrom(address(this), _msgSender(), vault[tokenId]);
    delete vault[tokenId];

    emit Burn(_msgSender(), tokenId);
  }

  function supportsInterface(bytes4 interfaceId)
    public
    view
    virtual
    override(AccessControl, ERC721)
    returns (bool)
  {
    return super.supportsInterface(interfaceId);
  }
}
