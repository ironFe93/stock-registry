// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;
import './StockRegistry.sol';

contract TickerRegistry {

    address private owner;
    mapping(string => bool) private tickers;
    string[] private tickersArray;
    StockRegistry private stockregistry;

    constructor(address _owner, address _stockRegistry) {
        owner = _owner;
        stockregistry = StockRegistry(_stockRegistry);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    function compareStrings(string memory a, string memory b) public pure returns (bool) {
        return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
    }

    function getOwner() public view returns (address) {
        return owner;
    }

    function getStockRegistry() public view returns (address) {
        return address(stockregistry);
    }

    function checkTicker(string memory ticker) public onlyOwner view returns (bool) {
        return tickers[ticker];
    }

    function addTicker(string memory newTicker) public onlyOwner {
        require(tickers[newTicker] == false, "Ticker already maintained");
        tickers[newTicker] = true;
        tickersArray.push(newTicker);
    }

    function removeTicker(string memory ticker, uint256 tickerIndex) public onlyOwner {
        require(tickers[ticker] == true, "Ticker not on system");
        require(compareStrings(tickersArray[tickerIndex], ticker), "Incorrect ticker");
        delete tickers[ticker];
        tickersArray[tickerIndex] = tickersArray[tickersArray.length - 1];
        tickersArray.pop();
    }

    function getTickers() public view onlyOwner returns (string[] memory) {
        return tickersArray;
    }

    function getTickerIndex(string memory ticker) public view onlyOwner returns (uint256) {
        for (uint i = 0; i < tickersArray.length; i++) {
            if(compareStrings(tickersArray[i], ticker)){
                return i;
            }
        }
        revert('not found');
    }
}
