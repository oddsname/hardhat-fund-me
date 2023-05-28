const {
    time,
    loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const {anyValue} = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const {expect, assert} = require("chai");
const {ethers, getNamedAccounts, deployments, network} = require("hardhat");
const {developmentChains} = require("../../hepler-hardhat-config");

//if we are not in testnet chains we skip the test
developmentChains.includes(network.config.name || network.name)
    ? describe.skip
    : describe("FundMe contract", function () {
        let fundMe;
        let deployer;

        const SEND_VALUE = ethers.utils.parseEther('0.1'); // 1 ETH

        beforeEach(async () => {
            deployer = (await getNamedAccounts()).deployer;//get deployer account
            fundMe = await ethers.getContract('FundMe', deployer);// gets most recent deployed contract by name
        });

        it('allows people to fund and withdraw', async () => {
            await fundMe.fund({value: SEND_VALUE});
            await fundMe.withdraw();
            const endingBalance = await fundMe.provider.getBalance(fundMe.address);

            assert.equal(endingBalance.toString(), '0');
        })
    });


