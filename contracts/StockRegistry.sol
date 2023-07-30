// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

contract StockRegistry {
    struct Stock {
        string ticker;
        uint256 quantity;
    }

    struct StockOwner {
        address wallet;
        Stock[] stocks;
    }

    address private registryOwner;

    mapping(address => Stock[]) private stocksOwned;
    address[] private stockOwnerRegistry;

    constructor(address _registryOwner) {
        registryOwner = _registryOwner;
    }

    modifier onlyRegistryOwner() {
        require(msg.sender == registryOwner, "Only registry owner can call this");
        _;
    }

    //helper function 
    function compareStrings(string memory a, string memory b) public pure returns (bool) {
        return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
    }

    //initializes an owner with a set of stocks
    function addOwner(Stock[] memory stocks, address _client) public onlyRegistryOwner{
        Stock[] memory clientStocks = stocksOwned[_client];
        require(clientStocks.length == 0, "owner already exists");
        
        for (uint i = 0; i < stocks.length; i++) {
            stocksOwned[_client].push(Stock(stocks[i].ticker, stocks[i].quantity));  
        }
        stockOwnerRegistry.push(_client);
    }

    function addStock(string memory _ticker, uint256 _quantity, address _client) public onlyRegistryOwner{
        //check if owner exists
        Stock[] storage clientStocks = stocksOwned[_client];
        require(clientStocks.length > 0, "owner not registered");

        //check if stock exists in owner
        for (uint i = 0; i < clientStocks.length; i++) {
            if(compareStrings(clientStocks[i].ticker, _ticker)){
                Stock storage stock = clientStocks[i];
                stock.quantity = stock.quantity + _quantity;
                return;
            }
        }

        Stock memory newStock = Stock(_ticker, _quantity);
        clientStocks.push(newStock);
    }

    function removeStock(string memory _ticker, uint256 _quantity, address _client) public onlyRegistryOwner{
        //check if owner exists
        Stock[] storage clientStocks = stocksOwned[_client];
        require(clientStocks.length > 0, "owner not registered");

        //check if stock exists in owner
        for (uint i = 0; i < clientStocks.length; i++) {
            if(compareStrings(clientStocks[i].ticker, _ticker)){
                Stock storage stock = clientStocks[i];
                //check if quantity to be removed is less than or equal stocks owned
                require(stock.quantity >= _quantity, 'insufficient stocks');
                stock.quantity = stock.quantity - _quantity;
                return;
            }
        }

        revert('stock not found');
    }

    function getStocksOwned() public view returns (Stock[] memory) {
        require(msg.sender != registryOwner, "Please specify an address");
        return stocksOwned[msg.sender];
    }

    function getStocksOwned(address stockOwner) public onlyRegistryOwner view returns (Stock[] memory) {
        return stocksOwned[stockOwner];
    }

    function getAllStocks() public onlyRegistryOwner view returns (StockOwner[] memory) {
        StockOwner[] memory stockOwners = new StockOwner[](stockOwnerRegistry.length);
        for (uint i = 0; i < stockOwnerRegistry.length; i++) {
            StockOwner memory stockOwner = StockOwner(stockOwnerRegistry[i], stocksOwned[stockOwnerRegistry[i]]);
            stockOwners[i] = stockOwner;
        }
        return stockOwners;
    }

    function getRegistryOwner() public view returns (address) {
        return registryOwner;
    }
}