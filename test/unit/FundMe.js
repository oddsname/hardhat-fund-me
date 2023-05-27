const { expect, assert } = require("chai");
const { deployments, ethers, getNamedAccounts } = require('hardhat');

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
      it("Fails if you don't send enough ETH", async function() {
        await expect(fundMe.fund()).to.be.revertedWith("You have to send at least 50 USD");
      });

      it('updated the amount funded data', async function() {
        await fundMe.fund({ value: SEND_VALUE})
        const response = await fundMe.getList(); //returns value that we passed to fund
        console.log(response.toString() , SEND_VALUE.toString())
        assert.equal(response.toString() , SEND_VALUE.toString());
      });

    it('updated the amount funded data 2', async function() {
      await fundMe.fund({ value: SEND_VALUE})
      await fundMe.fund({ value: SEND_VALUE})
      const response = await fundMe.getList(); //returns value that we passed to fund
      assert.equal(response.toString() , (parseInt(SEND_VALUE) + parseInt(SEND_VALUE)).toString());
    });

    it('Adds funder to array of funders', async function() {
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

      const gasCost = txReceipt.gasUsed.mul(txReceipt.effectiveGasPrice); //calculate gas cost for transaction

      const endFundMeBalance = await fundMe.provider.getBalance(fundMe.address);
      const endDeployerBalance = await fundMe.provider.getBalance(deployer);

      assert.equal(endFundMeBalance, 0);
      assert.equal(
          endDeployerBalance.add(gasCost).toString(),
          startFundMeBalance.add(startDeployerBalance).toString()// we use add func here because it's type of BigInt
      );
    });
  });
});
