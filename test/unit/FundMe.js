const {expect, assert} = require("chai");
const {deployments, ethers, getNamedAccounts} = require('hardhat');

describe("FundMe contract", () => {
    let fundMe;
    let deployer;
    let mockV3aggregator;

    const SEND_VALUE = ethers.utils.parseEther('1'); // 1 ETH

    beforeEach(async () => {
        //deploy FundMe contract
        //using hardhat deploy
        // const accounts = await ethers.getSigners();//will return accounts from hardhat.config
        deployer = (await getNamedAccounts()).deployer;//get deployer account
        await deployments.fixture(['all']);

        mockV3aggregator = await ethers.getContract('MockV3Aggregator', deployer);
        fundMe = await ethers.getContract('FundMe', deployer);// gets most recent deployed contract by name
        console.log(fundMe.address, mockV3aggregator.address);
    });

    describe('constructor', async () => {
        it('sets the aggregator addresses correctly', async () => {
            //we get MockV3Aggregator address passed to fundMe contract and compare it with latest MockV3Aggregator we have deployed
            const priceFeedAddress = await fundMe.priceFeed();
            assert.equal(priceFeedAddress, mockV3aggregator.address);
        })
    });

    describe('fund', async () => {
        it("Fails if you don't send enough ETH", async function () {
            await expect(fundMe.fund()).to.be.revertedWith("You have to send at least 50 USD");
        });

        it('updated the amount funded data', async function () {
            await fundMe.fund({value: SEND_VALUE})
            const response = await fundMe.getList(); //returns value that we passed to fund
            assert.equal(response.toString(), SEND_VALUE.toString());
        });

        it('updated the amount funded data 2', async function () {
            await fundMe.fund({value: SEND_VALUE})
            await fundMe.fund({value: SEND_VALUE})
            const response = await fundMe.getList(); //returns value that we passed to fund
            assert.equal(response.toString(), (parseInt(SEND_VALUE) + parseInt(SEND_VALUE)).toString());
        });

        it('Adds funder to array of funders', async function () {
            await fundMe.fund({value: SEND_VALUE});
            const funder = await fundMe.funders(0);
            assert.equal(funder, deployer);
        });
    })

    describe('withdraw', async () => {
        beforeEach(async () => {
            await fundMe.fund({value: SEND_VALUE});
        });

        it("withdraw ETH from a single founder", async () => {
            const startFundMeBalance = await fundMe.provider.getBalance(fundMe.address);
            const startDeployerBalance = await fundMe.provider.getBalance(deployer);

            const txResponse = await fundMe.withdraw();
            const txReceipt = await txResponse.wait(1);

            const gasCost = txReceipt.gasUsed.mul(txReceipt.effectiveGasPrice);

            const endFundMeBalance = await fundMe.provider.getBalance(fundMe.address);
            const endDeployerBalance = await fundMe.provider.getBalance(deployer);

            assert.equal(endFundMeBalance, 0);
            assert.equal(
                endDeployerBalance.add(gasCost).toString(),
                startFundMeBalance.add(startDeployerBalance).toString()// we use add func here because it's type of BigInt
            );
        });

        it('allows us to withdraw with multiple funders', async () => {
            const accounts = await ethers.getSigners();
            //we start from 1 index because 0 it's a deployer
            for (let i = 1; i < accounts.length; i++) {
                //connect different account to fund me contract
                const fundMeConnectedContract = await fundMe.connect(accounts[i])
                await fundMeConnectedContract.fund({value: SEND_VALUE});
            }

            const startFundMeBalance = await fundMe.provider.getBalance(fundMe.address);
            const startDeployerBalance = await fundMe.provider.getBalance(deployer);

            const txResponse = await fundMe.withdraw();
            const txReceipt = await txResponse.wait(1);
            const {gasUsed, effectiveGasPrice} = txReceipt;
            const gasCost = gasUsed.mul(effectiveGasPrice); //calculate gas cost for transaction

            const endFundMeBalance = await fundMe.provider.getBalance(fundMe.address);
            const endDeployerBalance = await fundMe.provider.getBalance(deployer);

            assert.equal(endFundMeBalance, 0);
            assert.equal(
                endDeployerBalance.add(gasCost).toString(),
                startFundMeBalance.add(startDeployerBalance).toString()// we use add func here because it's type of BigInt
            );

            //make sure that the funders are reset properly (we should clear array after withdraw function)
            await expect(fundMe.funders(0)).to.be.reverted;

            for (let i = 1; i < accounts.length; i++) {
                //check if we clear contract's mapper properly
                assert.equal(await fundMe.addressToAmountFunded(accounts[i].address), 0);
            }
        });

        it("Only allows to owner to withdraw", async () => {
            const accounts = await ethers.getSigners();
            const attacker = accounts[1]; //we grab random account to act as attacker on contract
            const attackerConnectedContract = await fundMe.connect(attacker);

            await expect(attackerConnectedContract.withdraw()).to.be.reverted;
        });
    })
});

