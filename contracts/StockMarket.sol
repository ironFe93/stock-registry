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

    function addStock(string memory _ticker, uint256 _quantity, address _client) public onlyOwner{
        Stock memory newStock = Stock(_ticker, _quantity);
        stocksOwned[_client].push(newStock);
        entityRegistry.push(_client);
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