// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

contract StockRegistry {
    struct Stock {
        string ticker;
        uint256 quantity;
    }

    struct Entity {
        address wallet;
        Stock[] stocks;
    }

    address private owner;

    mapping(address => Stock[]) private stocksOwned;
    address[] private entityRegistry;

    constructor(address _owner) {
        owner = _owner;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    //helper function 
    function compareStrings(string memory a, string memory b) public pure returns (bool) {
        return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
    }

    //initializes an entity with a set of stocks
    function addEntity(Stock[] memory stocks, address _client) public onlyOwner{
        Stock[] memory clientStocks = stocksOwned[_client];
        require(clientStocks.length == 0, "Entity already exists");
        
        for (uint i = 0; i < stocks.length; i++) {
            stocksOwned[_client].push(Stock(stocks[i].ticker, stocks[i].quantity));  
        }
        entityRegistry.push(_client);
    }

    function addStock(string memory _ticker, uint256 _quantity, address _client) public onlyOwner{
        //check if entity exists
        Stock[] storage clientStocks = stocksOwned[_client];
        require(clientStocks.length > 0, "Entity not registered");

        //check if stock exists in entity
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

    function removeStock(string memory _ticker, uint256 _quantity, address _client) public onlyOwner{
        //check if entity exists
        Stock[] storage clientStocks = stocksOwned[_client];
        require(clientStocks.length > 0, "Entity not registered");

        //check if stock exists in entity
        for (uint i = 0; i < clientStocks.length; i++) {
            if(compareStrings(clientStocks[i].ticker, _ticker)){
                Stock storage stock = clientStocks[i];
                //check if quantity to be removed is less than or equal stocks owned
                require(stock.quantity >= _quantity, 'insufficient stocks');
                stock.quantity = stock.quantity - _quantity;
                return;
            }
        }

        revert('stock not owned by entity');
    }

    function getStocksOwned() public view returns (Stock[] memory) {
        require(msg.sender != owner, "Please Specify an address");
        return stocksOwned[msg.sender];
    }

    function getStocksOwned(address stockOwner) public onlyOwner view returns (Stock[] memory) {
        return stocksOwned[stockOwner];
    }

    function getAllStocks() public onlyOwner view returns (Entity[] memory) {
        Entity[] memory entities = new Entity[](entityRegistry.length);
        for (uint i = 0; i < entityRegistry.length; i++) {
            Entity memory entity = Entity(entityRegistry[i], stocksOwned[entityRegistry[i]]);
            entities[i] = entity;
        }
        return entities;
    }

    function getOwner() public view returns (address) {
        return owner;
    }
}