// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./util/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";

// NFT staking based PASS contract. User stake creator's NFT to mint PASS and burn PASS to get creator's NFT back
contract NFTBase is Context, Ownable, ERC721, ERC721Burnable {
  using Counters for Counters.Counter;
  using Strings for uint256;

  event Mint(address indexed from, uint256 indexed tokenId);
  event Burn(address indexed from, uint256 indexed tokenId);
  event SetBaseURI(string baseURI_);
  event SetTokenURI(uint256 indexed tokenId, string _tokenURI);
  event BaseURIFrozen();

  bool public baseURIFrozen;
  address public admin; // contract admin
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
  ) Ownable(tx.origin) ERC721(_name, _symbol) {
    _baseURIextended = _bURI;
    erc721 = _erc721;
  }

  // only admin can set BaseURI
  function setBaseURI(string memory baseURI_) public onlyOwner {
    require(!baseURIFrozen, "baseURI has been frozen");
    _baseURIextended = baseURI_;
    emit SetBaseURI(baseURI_);
  }

  // only contract admin can freeze Base URI
  function freezeBaseURI() public onlyOwner {
    require(!baseURIFrozen, "baseURI has been frozen");
    baseURIFrozen = true;
    emit BaseURIFrozen();
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

    // If token URI exists, return the token URI.
    if (bytes(_tokenURI).length > 0) {
      return _tokenURI;
    } else {
      return super.tokenURI(tokenId);
    }
  }

  function _setTokenURI(uint256 tokenId, string memory _tokenURI)
    internal
    virtual
  {
    require(_exists(tokenId), "URI set of nonexistent token");

    string memory tokenURI_ = _tokenURIs[tokenId];
    require(bytes(tokenURI_).length == 0, "already set TokenURI");

    _tokenURIs[tokenId] = _tokenURI;
    emit SetTokenURI(tokenId, _tokenURI);
  }

  // only admin can set TokenURI
  function setTokenURI(uint256 tokenId, string memory _tokenURI)
    public
    onlyOwner
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

  // burn PASS to get staked NFT back
  function burn(uint256 tokenId) public virtual override {
    super.burn(tokenId);
    IERC721(erc721).safeTransferFrom(
      address(this),
      _msgSender(),
      vault[tokenId]
    );
    delete vault[tokenId];

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
