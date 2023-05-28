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

    uint256 public constant MINIMUM_USD = 50 * 1e8;

    address[] private s_funders;
    mapping (address => uint256) private s_addressToAmountFunded;

    address private immutable i_owner;
    AggregatorV3Interface private immutable s_priceFeed;

    constructor(address _priceFeed) {
        s_priceFeed = AggregatorV3Interface(_priceFeed);
        i_owner = msg.sender;
    }

    function getOwner() public view returns(address) {
        return i_owner;
    }

    function getFunder(uint256 index) public view returns(address) {
        return s_funders[index];
    }

    function getAmountFunded(address adr) public view returns(uint256) {
        return s_addressToAmountFunded[adr];
    }

    function getPriceFeed() public view returns(AggregatorV3Interface) {
        return s_priceFeed;
    }

    function fund() public payable {
        require(msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD, "You have to send at least 50 USD");

        s_funders.push(msg.sender);
        uint256 prevValue = s_addressToAmountFunded[msg.sender];
        s_addressToAmountFunded[msg.sender] = prevValue + msg.value;
    }

    function getList() public view returns (uint256) {
        return s_addressToAmountFunded[msg.sender];
    }

    function withdraw() public onlyOwner {
        for(uint256 funderI = 0; funderI < s_funders.length; funderI++) {
            address funder = s_funders[funderI];
            s_addressToAmountFunded[funder] = 0;
        }

        s_funders = new address[](0);
        (bool success, ) = payable(msg.sender).call{value: address(this).balance}("");
        require(success, "Call failed");
    }

    function cheaperWithdraw() public onlyOwner {
        address[] memory funders = s_funders;
        //mappings can't be in memory
        for(uint256 funderI = 0; funderI < funders.length; funderI++) {
            address funder = funders[funderI];
            s_addressToAmountFunded[funder] = 0;
        }

        s_funders = new address[](0);
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
        if(msg.sender != i_owner) revert FundMe__NotOwner();
        _;
    }
}