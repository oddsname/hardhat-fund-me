// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7; // >=0.8.7 <0.9.0   ^0.8.7

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

library PriceConverter {
    function getEthPrice(AggregatorV3Interface priceFeed) internal view returns (int256) {
        (
        /* uint80 roundID */,
        int256 answer,
        /*uint startedAt*/,
        /*uint timeStamp*/,
        /*uint80 answeredInRound*/
        ) = priceFeed.latestRoundData();

        return answer;
    }

    function getConversionRate(uint256 ethAmount, AggregatorV3Interface priceFeed) internal view returns (uint256) {
        uint256 ethPrice = uint256(getEthPrice(priceFeed));
        //1e18 = 1_000000000000000000
        uint256 ethInUsd = (ethAmount * ethPrice) / 1e8;

        return ethInUsd;
    }
}