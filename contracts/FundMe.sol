// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7; // >=0.8.7 <0.9.0   ^0.8.7
//imports
import "./PriceConverter.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
//error codes
error FundMe__NotOwner();
//interfaces, libraries, Contracts

contract FundMe {
    using PriceConverter for uint256;

    uint minimumUSD = 50 * 1e8;

    address[] public funders;
    mapping (address => uint256) public addressToAmountFunded;

    address public immutable owner;
    AggregatorV3Interface public immutable priceFeed;

    constructor(address _priceFeed) {
        priceFeed = AggregatorV3Interface(_priceFeed);
        owner = msg.sender;
    }

    function fund() public payable {
        require(msg.value.getConversionRate(priceFeed) >= minimumUSD, "You have to send at least 50 USD");

        funders.push(msg.sender);
        uint256 prevValue = addressToAmountFunded[msg.sender];
        addressToAmountFunded[msg.sender] = prevValue + msg.value;
    }

    function getList() public view returns (uint256) {
        return addressToAmountFunded[msg.sender];
    }

    function withdraw() public onlyOwner {
        for(uint256 funderI = 0; funderI < funders.length; funderI++) {
            address funder = funders[funderI];
            addressToAmountFunded[funder] = 0;
        }

        funders = new address[](0);
        (bool success, ) = payable(msg.sender).call{value: address(this).balance}("");
        require(success, "Call failed");
    }

    receive() external payable {
        fund();
    }

    fallback() external payable {
        fund();
    }

    modifier onlyOwner() {
        if(msg.sender != owner) revert FundMe__NotOwner();
        _;
    }
}