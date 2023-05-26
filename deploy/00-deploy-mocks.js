const { developmentChains } = require('../hepler-hardhat-config');

const DECIMALS = 8;
const INITIAL_ANSWER = 200000000000;

module.exports.default = async ({ getNamedAccounts, deployments, network }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();

    if (developmentChains.includes(network.config.name || '')) {
        log('Local network detected, start to deploying mocks...');
        const tx = await deploy('MockV3Aggregator', {
            from: deployer,
            log: true,
            args: [DECIMALS, INITIAL_ANSWER],// passing parameters to MockV3Aggregator constructor
        });
        log('Mocks are deployed!');
        log('----------------------------------');
    }
}
// module.exports.tags = ['all', 'mocks']; //will trigger this file only if we pass tags like `yarn hardhat deploy --tags mocks