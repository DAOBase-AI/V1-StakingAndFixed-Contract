// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
// import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "prb-math/contracts/PRBMathUD60x18Typed.sol";

// TODO: Remove on production
import "hardhat/console.sol";

contract Delta is Context, ERC721 {
    using Counters for Counters.Counter;
    using PRBMathUD60x18Typed for PRBMath.UD60x18;
    // using SafeMath for uint256;

    event Mint(address indexed from, uint256 indexed tokenId);
    event Withdraw(address indexed from, uint256 indexed tokenId);

    // TODO: Check before deploy
    address public constant PLATFORM_ADDRESS =
        0x5322d18080C18ED152C03C13f09817bB0B51a486;
    uint256 public constant PLATFORM_RATE = 10;
    uint256 public constant _N = 5;
    address public owner;
    address public erc20;
    uint256 public ownerRate;
    uint256 public startPrice;
    uint256 public totalSupply; // Max supply
    address public incentiveAddress; // address for sending incentive tokens
    uint256 public amount; // Top amount one account can buy
    mapping(uint256 => uint256) public balances;

    Counters.Counter private tokenIdTracker = Counters.Counter({_value: 1});
    mapping(address => uint256) private holders;

    constructor(
        string memory _name,
        string memory _symbol,
        address _erc20,
        uint256 _ownerRate,
        uint256 _startPrice,
        uint256 _totalSupply,
        address _incentiveAddress,
        uint256 _amount
    ) ERC721(_name, _symbol) {
        ownerRate = _ownerRate;
        owner = msg.sender;
        erc20 = _erc20;
        startPrice = _startPrice;
        totalSupply = _totalSupply;
        incentiveAddress = _incentiveAddress;
        amount = _amount;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Owner only action");
        _;
    }

    function mint() public returns (uint256 tokenId) {
        require((holders[_msgSender()] == 0), "Delta: sender has been holder");
        require(
            (tokenIdTracker.current() < totalSupply),
            "Delta: supply is full"
        );
        require(balanceOf(msg.sender) <= amount, "Delta: over amount limit");

        tokenId = tokenIdTracker.current();
        uint256 tokens = getPrice();

        console.log("======Tokens", tokens);

        IERC20(erc20).transferFrom(
            _msgSender(),
            address(this),
            tokens - (tokens - (tokens * PLATFORM_RATE) / 1000)
        );
        IERC20(erc20).transferFrom(
            _msgSender(),
            PLATFORM_ADDRESS,
            (tokens * PLATFORM_RATE) / 1000
        );
        IERC20(erc20).transferFrom(
            _msgSender(),
            incentiveAddress,
            (tokens * PLATFORM_RATE) / 1000
        );

        _safeMint(_msgSender(), tokenId);
        holders[_msgSender()] = tokenId;

        emit Mint(_msgSender(), tokenId);

        tokenIdTracker.increment();

        balances[tokenIdTracker.current()] =
            tokens -
            ((tokens * (ownerRate + PLATFORM_RATE)) / 1000);
    }

    function withdraw() public {
        require(holders[_msgSender()] != 0, "Delta: no pass owned");

        IERC20(erc20).transfer(
            _msgSender(),
            balances[tokenIdTracker.current()] -
                ((balances[tokenIdTracker.current()] * ownerRate) / 1000)
        );
        IERC20(erc20).transfer(
            PLATFORM_ADDRESS,
            (amount * PLATFORM_RATE) / 1000
        );

        emit Withdraw(_msgSender(), amount);
    }

    // TODO: Submit issue to openzeppelin for safe math overflow/underflow issue
    function getPrice() internal view returns (uint256) {
        uint256 supply = totalSupply * 1e18;
        PRBMath.UD60x18 memory udSupply = PRBMath.UD60x18({value: supply});
        uint256 current = balanceOf(address(this));
        uint256 divider = udSupply.log10().value / 1e18;
        unchecked {
            uint256 deltaR = (primitive(totalSupply + (current + 1)) -
                primitive(totalSupply));
            console.log("=====deltaR: ", deltaR);
            console.log(primitive(totalSupply + current + 1));
            console.log(primitive(totalSupply));
            console.log(deltaR / (10**(divider + 6)) + startPrice);
            return deltaR / (10**(divider + 6)) + startPrice;
        }
    }

    function primitive(uint256 s) internal view returns (uint256) {
        unchecked {
            return s + equation(s);
        }
    }

    function equation(uint256 x) internal view returns (uint256) {
        for (uint256 index = 1; index <= _N; index++) {
            unchecked {
                x = (x * x) / totalSupply;
            }
        }
        return x;
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
