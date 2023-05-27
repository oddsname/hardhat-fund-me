const { networkConfig, developmentChains} = require("../hepler-hardhat-config");
const { verify } = require("../utils/verify")
const { deployments } = require("hardhat");
module.exports.default = async ({ getNamedAccounts, deployments, network, ethers }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;

    // it will work only for existing chains, so for localhost we need to mock this smart contract
    let ethUsdPriceFeedAddress;
    if (developmentChains.includes(network.config.name || '')) {
        //if it local chain we need to use mock
        //looking for deployed contract
        ethUsdPriceFeedAddress = (await deployments.get('MockV3Aggregator')).address;
    } else {
        //attaching address of existing MockV3Aggregator in testnets
        ethUsdPriceFeedAddress = networkConfig[chainId]['ethUsdPriceFeed'];
    }

    //when going for localhost or hardhat network we want to use a mock
    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: [ethUsdPriceFeedAddress], // constructor arguments
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })
    log('FundMe deployed!')

    //if it's testnet
    if(!developmentChains.includes(network.config.name || '') && process.env.ETHERSCAN_KEY) {
        await verify(fundMe.address, [ethUsdPriceFeedAddress]);
    }
    log('---------------------------------------')
}