# Advanced Sample Hardhat Project

This project demonstrates an advanced Hardhat use case, integrating other tools commonly used alongside Hardhat in the ecosystem.

The project comes with a sample contract, a test for that contract, a sample script that deploys that contract, and an example of a task implementation, which simply lists the available accounts. It also comes with a variety of other tools, preconfigured to work with the project code.

Try running some of the following tasks:

```shell
npx hardhat accounts
npx hardhat compile
npx hardhat clean
npx hardhat test
npx hardhat node
npx hardhat help
REPORT_GAS=true npx hardhat test
npx hardhat coverage
npx hardhat run scripts/deploy.js
node scripts/deploy.js
npx eslint '**/*.js'
npx eslint '**/*.js' --fix
npx prettier '**/*.{json,sol,md}' --check
npx prettier '**/*.{json,sol,md}' --write
npx solhint 'contracts/**/*.sol'
npx solhint 'contracts/**/*.sol' --fix
```

# Etherscan verification

To try out Etherscan verification, you first need to deploy a contract to an Ethereum network that's supported by Etherscan, such as Ropsten.

In this project, copy the .env.template file to a file named .env, and then edit it to fill in the details. Enter your Etherscan API key, your Ropsten node URL (eg from Alchemy), and the private key of the account which will send the deployment transaction. With a valid .env file in place, first deploy your contract:

```shell
hardhat run --network ropsten scripts/deploy.js
```

Then, copy the deployment address and paste it in to replace `DEPLOYED_CONTRACT_ADDRESS` in this command:

```shell
npx hardhat verify --network ropsten DEPLOYED_CONTRACT_ADDRESS "Hello, Hardhat!"
```
testPas

# Rinkeby

## Deploy&verify
npx hardhat run scripts/deploy.js --network rinkeby
npx hardhat verify --network rinkeby 0x6B758f2394b8Fc35Bcaa75eD4d15486B76b24db1 0xE30EC7cb7a3ba0E1DCEEceC2673B1f4A5c4aC8F5 0x467E0f99972d7e22017bFcCf2464Ee90477e6582 0x16f8DFEEcB29c4a70A2eA7F13F44e1A3316d9b66
npx hardhat verify --network rinkeby 0xE30EC7cb7a3ba0E1DCEEceC2673B1f4A5c4aC8F5
npx hardhat verify --network rinkeby 0x467E0f99972d7e22017bFcCf2464Ee90477e6582
npx hardhat verify --network rinkeby 0x16f8DFEEcB29c4a70A2eA7F13F44e1A3316d9b66

## Verify Qinshun(Please use Qinshun's PRIVATE_KEY)
npx hardhat verify --network rinkeby 0xfbec59329b202b75194b6c2ade154927e400b69f "testPass" PASS "https://ipfs/" 0x0ccc24a6b8285468bb7aba8e86b090b7e6d44219 5
npx hardhat verify --network rinkeby 0xb4463dc27a17866a250e7b59c08cd926930a2466 "beta test" betat "https://ipfs/" 0x5ed46ff8b506c36e2e7e767ed9b45c51ed910dab
npx hardhat verify --network rinkeby 0xbed985de730750e6e59fe25080da1d666f7b03a7 3gamma1 3g1 "https://ipfs/" 0x0ccc24a6b8285468bb7aba8e86b090b7e6d44219 3000000000000000000 10000000000000000000

## Deploy&verify ERC20&721
npx hardhat run scripts/deployMine.js --network rinkeby

npx hardhat verify --network rinkeby 0xaF6cdDcCA19cc04954FaC72Dd5ddc4de46B10F0C my20Token MY20
npx hardhat verify --network rinkeby --contract contracts/MyERC721Token.sol:MyERC721Token 0x5Ed46Ff8B506C36e2E7e767eD9b45C51Ed910dAB my721Token MY721 "ipfs://"

# Polygon
npx hardhat run scripts/deploy.js --network polygon
npx hardhat verify --network polygon 0x754019Eee371a26CC29A3B5F2c8A21e014b13042 0xeC38c1320bFe708B8C2F443579D3E58D10081806 0x8ce2bb600D965F52C722Ea8AA357d5e649fB20E6 0xB21c70b62c15f2BEFAaaE5091Ac83a8B42a4beBf
npx hardhat verify --network polygon 0xeC38c1320bFe708B8C2F443579D3E58D10081806
npx hardhat verify --network polygon 0x8ce2bb600D965F52C722Ea8AA357d5e649fB20E6
npx hardhat verify --network polygon 0xB21c70b62c15f2BEFAaaE5091Ac83a8B42a4beBf

# Polygon Mumbai
npx hardhat run scripts/deploy.js --network polygonMumbai
npx hardhat verify --network polygonMumbai
npx hardhat verify --network polygonMumbai  
npx hardhat verify --network polygonMumbai  
npx hardhat verify --network polygonMumbai  