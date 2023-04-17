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

    //ticker1 buys ticker2
    /*function mergeTickers(string memory ticker1, string memory ticker2, string memory newTicker) public onlyOwner {
        require(tickers[ticker1] == true && tickers[ticker2], "Both Tickers not on system");

        uint256 ticker1Index = getTickerIndex(ticker1);
        uint256 ticker2Index = getTickerIndex(ticker2);
        
        removeTicker(ticker1, ticker1Index);
        removeTicker(ticker2, ticker2Index);

        StockRegistry.Entity[] memory entities = stockregistry.getAllStocks();

        for (uint i = 0; i < entities.length; i++) {
            StockRegistry.Entity memory entity = entities[i];
            StockRegistry.Stock[] memory stocks = stockregistry.getStocksOwned(entity.wallet);

            uint newAmount = 0;
            for (uint j = 0; j < stocks.length; j++) {
                StockRegistry.Stock memory stock = stocks[j];
                if(compareStrings(stock.ticker, ticker1 )){
                    newAmount += stock.quantity;
                    stockregistry.removeStock(ticker1, stock.quantity, entity.wallet);
                }

                if(compareStrings(stock.ticker, ticker2 )){
                    newAmount += stock.quantity;
                    stockregistry.removeStock(ticker2, stock.quantity, entity.wallet);
                }
            }
            stockregistry.addStock(newTicker, newAmount, entity.wallet);
        }

        addTicker(newTicker);
    }

    function splitTickers(string memory ticker, string memory newTicker1, string memory newTicker2) public onlyOwner {
        require(tickers[ticker], "Ticker not on system");

        uint256 tickerIndex = getTickerIndex(ticker);
        removeTicker(ticker, tickerIndex);

        StockRegistry.Entity[] memory entities = stockregistry.getAllStocks();

        for (uint i = 0; i < entities.length; i++) {
            StockRegistry.Entity memory entity = entities[i];
            StockRegistry.Stock[] memory stocks = stockregistry.getStocksOwned(entity.wallet);

            uint newAmount = 0;
            for (uint j = 0; j < stocks.length; j++) {
                StockRegistry.Stock memory stock = stocks[j];
                if(compareStrings(stock.ticker, ticker)){
                    newAmount += stock.quantity/2;
                    stockregistry.removeStock(ticker, stock.quantity, entity.wallet);
                }
            }
            stockregistry.addStock(newTicker1, newAmount, entity.wallet);
            stockregistry.addStock(newTicker2, newAmount, entity.wallet);
        }

        addTicker(newTicker1);
        addTicker(newTicker2);
    }*/
}