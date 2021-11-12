// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// fixed price PASS contract. Users pay specific erc20 tokens to purchase PASS from creator DAO
contract FixedPeriod is Context, AccessControl, ERC721, ReentrancyGuard {
  using Counters for Counters.Counter;
  using Strings for uint256;
  using SafeERC20 for IERC20;

  event Mint(address indexed from, uint256 indexed tokenId);
  event Withdraw(address indexed to, uint256 amount);

  uint256 public initialRate; // price rate of erc20 tokens/PASS
  uint256 public startTime;
  uint256 public termOfValidity;
  uint256 public endTime; // endTime = startTime + termOfValidity
  uint256 public maxSupply; // Maximum supply of PASS
  uint256 public slope; // slope = initialRate / termOfValidity
  address public owner; // contract owner is normally the creator
  address public erc20; // erc20 token used to purchase PASS
  address payable public platform; // thePass platform's commission account
  address payable public beneficiary; // thePass benfit receiving account
  uint256 public platformRate; // thePass platform's commission rate in pph

  // Optional mapping for token URIs
  mapping(uint256 => string) private _tokenURIs;

  // Base URI
  string private _baseURIextended;

  // token id counter. For erc721 contract, PASS number = token id
  Counters.Counter private tokenIdTracker = Counters.Counter({_value: 1});

  constructor(
    string memory _name,
    string memory _symbol,
    string memory _bURI,
    address _erc20,
    address payable _platform,
    address payable _beneficiary,
    uint256 _initialRate,
    uint256 _startTime,
    uint256 _termOfValidity,
    uint256 _maxSupply,
    uint256 _platformRate
  ) ERC721(_name, _symbol) {
    _setupRole(DEFAULT_ADMIN_ROLE, tx.origin); //contract owner is the creator
    _setupBasicInfo(
      _bURI,
      tx.origin,
      _erc20,
      _beneficiary,
      _initialRate,
      _startTime,
      _termOfValidity,
      _maxSupply
    );
    _setupPlateformParm(_platform, _platformRate);
  }

  // only contract owner can setTokenURI
  function setBaseURI(string memory baseURI_)
    public
    onlyRole(DEFAULT_ADMIN_ROLE)
  {
    _baseURIextended = baseURI_;
  }

  function _setupPlateformParm(address payable _platform, uint256 _platformRate)
    internal
  {
    platform = _platform;
    platformRate = _platformRate;
  }

  function _setupBasicInfo(
    string memory _bURI,
    address _owner,
    address _erc20,
    address payable _beneficiary,
    uint256 _initialRate,
    uint256 _startTime,
    uint256 _termOfValidity,
    uint256 _maxSupply
  ) internal {
    _baseURIextended = _bURI;
    owner = _owner;
    erc20 = _erc20;
    initialRate = _initialRate;
    startTime = _startTime;
    termOfValidity = _termOfValidity;
    endTime = _startTime + _termOfValidity;
    slope = _initialRate / _termOfValidity;
    maxSupply = _maxSupply;
    beneficiary = _beneficiary;
  }

  // commission account and rate initilization

  function _baseURI() internal view virtual override returns (string memory) {
    return _baseURIextended;
  }

  function _getBalance() internal view returns (uint256) {
    return address(this).balance;
  }

  function getCurrentCostToMint() public view returns (uint256 cost) {
    return _getCurrentCostToMint();
  }

  function _getCurrentCostToMint() internal view returns (uint256) {
    require(
      (block.timestamp >= startTime) && (block.timestamp <= endTime),
      "FixedPrice: not in time"
    );
    return initialRate - (slope * (block.timestamp - startTime));
  }

  function changeBeneficiary(address payable _newBeneficiary)
    public
    nonReentrant
    onlyRole(DEFAULT_ADMIN_ROLE)
  {
    beneficiary = _newBeneficiary;
  }

  function tokenURI(uint256 tokenId)
    public
    view
    virtual
    override
    returns (string memory)
  {
    require(_exists(tokenId), "URI query for nonexistent token");

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
    require(_exists(tokenId), "URI set of nonexistent token");
    _tokenURIs[tokenId] = _tokenURI;
  }

  // only contract owner can setTokenURI
  function setTokenURI(uint256 tokenId, string memory _tokenURI)
    public
    onlyRole(DEFAULT_ADMIN_ROLE)
  {
    _setTokenURI(tokenId, _tokenURI);
  }

  // user buy PASS from contract with specific erc20 tokens
  function mint() public nonReentrant returns (uint256 tokenId) {
    require(address(erc20) != address(0), "FixPrice: erc20 address is null.");
    require((tokenIdTracker.current() <= maxSupply), "exceeds maximum supply");
    uint256 rate = _getCurrentCostToMint();

    tokenId = tokenIdTracker.current(); // accumulate the token id

    IERC20(erc20).safeTransferFrom(_msgSender(), address(this), rate);

    if (platform != address(0)) {
      IERC20(erc20).safeTransfer(platform, (rate * platformRate) / 100);
    }

    _safeMint(_msgSender(), tokenId); // mint PASS to user address
    emit Mint(_msgSender(), tokenId);

    tokenIdTracker.increment(); // automate token id increment
  }

  function mintEth() public payable nonReentrant returns (uint256 tokenId) {
    require(address(erc20) == address(0), "ERC20 address is NOT null.");
    require((tokenIdTracker.current() <= maxSupply), "Exceeds maximum supply");

    uint256 rate = _getCurrentCostToMint();
    require(msg.value >= rate, "Not enough ether sent.");

    tokenId = tokenIdTracker.current(); // accumulate the token id

    _safeMint(_msgSender(), tokenId); // mint PASS to user address
    emit Mint(_msgSender(), tokenId);

    if (platform != address(0)) {
      (bool success, ) = platform.call{value: (rate * (platformRate)) / 100}(
        ""
      );
      require(success, "Failed to send Ether");
    }

    tokenIdTracker.increment(); // automate token id increment
  }

  // withdraw erc20 tokens from contract
  // anyone can withdraw reserve of erc20 tokens to beneficiary
  function withdraw() public nonReentrant {
    if (address(erc20) == address(0)) {
      uint256 amount = _getBalance();
      (bool success, ) = beneficiary.call{value: amount}("");
      require(success, "Failed to send Ether");

      emit Withdraw(beneficiary, amount);
    } else {
      uint256 amount = IERC20(erc20).balanceOf(address(this)); // get the amount of erc20 tokens reserved in contract
      IERC20(erc20).safeTransfer(beneficiary, amount); // transfer erc20 tokens to contract owner address

      emit Withdraw(beneficiary, amount);
    }
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
