require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();
require('hardhat-deploy');

const {
  GANACHE_KEY, GANACHE_URL,
  SEPOLIA_KEY, SEPOLIA_URL,
  ETHERSCAN_KEY, COINMARKETCAP_KEY,
} = process.env;

module.exports = {
  //defaultNetwork: "hardhat",
  networks: {
    ganache: {
      name: 'ganache',
      url: GANACHE_URL,
      accounts: [GANACHE_KEY],
      chainId: 1337,
    },
    sepolia: {
      name: "sepolia",
      url: SEPOLIA_URL,
      accounts: [SEPOLIA_KEY],
      chainId: 11155111,
      blockConfirmations: 6,
    },
    localhost: {
      name: 'localhost',
      url: 'http://127.0.0.1:8545',
      accounts: [ '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80']
    }
  },
  etherscan: {
    apiKey: ETHERSCAN_KEY
  },
  namedAccounts: {
      //just a name we grab inside our deploy folder files
      deployer: {
          //if we have a lot of accounts we can specify  index of account we want to use for different networks
          default: 0,
          ganache: 0,
          hardhat: 0,
          localhost: 0,
          //(ChainId):(account index)
          //11155111: 3
      }
  },
  gasReporter: {
    enabled: true,
    outputFile: 'gas-report.txt',
    noColors: true, //because we output to a file
    currency: 'USD',
    coinmarketcap: COINMARKETCAP_KEY, // comment out if you don't need api requests
    token: 'MATIC', //we can select different networks by specifying the currency and get actual price inside these networks
  },
  solidity: "0.8.7",
  //to add multiple solidity versions
  // solidity: { compilers: [{ version: "0.8.8" }, { version: "0.6.6" }]},
};
