import { expect } from "chai";
import { ethers } from "hardhat";
import { StockRegistry } from '../typechain-types'
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("StockRegistry", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployContract() {
    const [ dtccSigner ] = await ethers.getSigners();
      const stockRegistryFactory = await ethers.getContractFactory("StockRegistry");
      const stockRegistry = await stockRegistryFactory.deploy(dtccSigner.address);

    return { stockRegistry };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const [ dtccSigner ] = await ethers.getSigners();
      const stockRegistryFactory = await ethers.getContractFactory("StockRegistry");
      const stockRegistry = await stockRegistryFactory.deploy(dtccSigner.address);

      const queriedOwner = await stockRegistry.getOwner();

      expect(queriedOwner).to.equal(dtccSigner.address);
    });
  });

  describe("Functions", function () {
    let stockRegistry: StockRegistry;
    let dtccSigner: SignerWithAddress;
    let participant1: SignerWithAddress;
    let participant2: SignerWithAddress;
    let participant3: SignerWithAddress;

    beforeEach(async function(){
      ({ stockRegistry } = await deployContract());
      ([dtccSigner, participant1, participant2, participant3] = await ethers.getSigners());
    })

    describe("addEntity", function () {
      it("Should add an Entity with Stocks", async function () {

        const stocks: StockRegistry.StockStruct[] = [
          {
            quantity: 100,
            ticker: 'AAPL',
          },
          {
            quantity: 50,
            ticker: 'TSLA',
          }
        ]

        //DTCC adds an entity
        await stockRegistry.addEntity(stocks, participant1.address);
        
        const [ AAPLStock, TSLAStock ] = await stockRegistry["getStocksOwned(address)"](participant1.address);
  
        expect(AAPLStock.ticker).to.equal('AAPL');
        expect(AAPLStock.quantity).to.equal(100);

        expect(TSLAStock.ticker).to.equal('TSLA');
        expect(TSLAStock.quantity).to.equal(50);
      });
    });

    describe("addStock", function () {

      beforeEach(async function() {
        //Register an entity
        const stocks: StockRegistry.StockStruct[] = [
          {
            quantity: 100,
            ticker: 'TSLA',
          },
          {
            quantity: 50,
            ticker: 'AAPL',
          },
        ]

        //DTCC adds an entity
        await stockRegistry.addEntity(stocks, participant1.address);
      })

      it("Should add stocks for an Entity", async function () {
        //DTCC adds a stock
        await stockRegistry.addStock('TSLA', 100, participant1.address);

        const [ TSLAStock ] = await stockRegistry["getStocksOwned(address)"](participant1.address);
  
        expect(TSLAStock.ticker).to.equal('TSLA');
        expect(TSLAStock.quantity).to.equal(200);
      });

      it("Should fail if entity is not registered", async function () {
        const removeCall = stockRegistry.addStock('TSLA', 50, participant3.address);
        await expect(removeCall).to.be.revertedWith('Entity not registered');
      });

      it("Should reject if not called by the owner", async function () {
        //Participant 1 attempts to add stocks
        const addStockCall = stockRegistry.connect(participant1).addStock('TSLA', 100, participant1.address);
  
        await expect(addStockCall).to.be.revertedWith('Only owner can call this');
      });
    });

    describe("removeStock", function () {

      beforeEach(async function() {
        //Register an entity
        const stocks: StockRegistry.StockStruct[] = [
          {
            quantity: 100,
            ticker: 'TSLA',
          },
          {
            quantity: 50,
            ticker: 'AAPL',
          },
        ]

        //DTCC adds an entity
        await stockRegistry.addEntity(stocks, participant1.address);
      })

      it("Should remove stocks from an entity", async function () {
        //DTCC removes a stock
        await stockRegistry.removeStock('TSLA', 50, participant1.address);

        const [ TSLAStock ] = await stockRegistry["getStocksOwned(address)"](participant1.address);
  
        expect(TSLAStock.ticker).to.equal('TSLA');
        expect(TSLAStock.quantity).to.equal(50);
      });

      it("Should fail if attempting to remove more stocks than available", async function () {
        const removeCall = stockRegistry.removeStock('TSLA', 150, participant1.address);
  
        await expect(removeCall).to.be.revertedWith('insufficient stocks');
      });

      it("Should fail if entity is not registered", async function () {
        const removeCall = stockRegistry.removeStock('TSLA', 50, participant3.address);
  
        await expect(removeCall).to.be.revertedWith('Entity not registered');
      });

      it("Should fail if entity is registered but does not own the stock", async function () {
        const removeCall = stockRegistry.removeStock('GME', 50, participant1.address);
  
        await expect(removeCall).to.be.revertedWith('stock not owned by entity');
      });

      it("Should reject if not called by the owner", async function () {
        //Participant 1 attempts to add stocks
        const addStockCall = stockRegistry.connect(participant1).addStock('TSLA', 100, participant1.address);
  
        await expect(addStockCall).to.be.revertedWith('Only owner can call this');
      });
    });

    describe("getStocksOwned", function () {

      beforeEach(async function() {

        const stocksEntity1: StockRegistry.StockStruct[] = [
          {
            quantity: 100,
            ticker: 'TSLA',
          },
        ]

        const stocksEntity2: StockRegistry.StockStruct[] = [
          {
            quantity: 100,
            ticker: 'GME',
          },
          {
            quantity: 50,
            ticker: 'AAPL',
          },
        ]

        await stockRegistry.addEntity(stocksEntity1, participant1.address);
        await stockRegistry.addEntity(stocksEntity2, participant2.address);
      })
      it("should get the sender's stocks", async function () {
        //Participant2 wants to view his stocks
        const [GMEStock, AAPLStock] = await stockRegistry.connect(participant2.address)["getStocksOwned()"]();
  
        expect(GMEStock.ticker).to.equal('GME');
        expect(GMEStock.quantity).to.equal(100);

        expect(AAPLStock.ticker).to.equal('AAPL');
        expect(AAPLStock.quantity).to.equal(50);
      });

      it("Should reject if owner calls method without specifying an address", async function () {
        const getStocksOwnedCall = stockRegistry["getStocksOwned()"]();
  
        await expect(getStocksOwnedCall).to.be.revertedWith('Please Specify an address');
      });

      it("should get participant stocks if owner specifies address", async function () {
        const [ TSLAstock ] = await stockRegistry["getStocksOwned(address)"](participant1.address);
  
        expect(TSLAstock.ticker).to.equal('TSLA');
        expect(TSLAstock.quantity).to.equal(100);
      });

      it("should get empty array if owner specifies unknown address", async function () {
        //random address
        const randomAddress = ethers.Wallet.createRandom().address;

        const result = await stockRegistry["getStocksOwned(address)"](randomAddress);
  
        expect(result.length).to.equal(0);
      });

      it("should get empty array if participant has no shares", async function () {
        //Participant3 wants to view his stocks
        const result = await stockRegistry.connect(participant3)["getStocksOwned()"]();
  
        expect(result.length).to.equal(0);
      });
    });

    describe('getAllStocks', function(){
      beforeEach(async function() {
        const stocksEntity1: StockRegistry.StockStruct[] = [
          {
            quantity: 100,
            ticker: 'TSLA',
          },
        ]

        const stocksEntity2: StockRegistry.StockStruct[] = [
          {
            quantity: 100,
            ticker: 'GME',
          },
          {
            quantity: 50,
            ticker: 'AAPL',
          },
        ]

        await stockRegistry.addEntity(stocksEntity1, participant1.address);
        await stockRegistry.addEntity(stocksEntity2, participant2.address);
      })

      it('should retrieve all participants and stocks', async function(){
        //dtcc retrieves all stock data
        const [ participant1, participant2 ] = await stockRegistry.getAllStocks();

        expect(participant1.stocks.length).to.equal(1);
        expect(participant1.stocks[0].ticker).to.equal('TSLA');
        
        expect(participant2.stocks.length).to.equal(2);
        expect(participant2.stocks[0].ticker).to.equal('GME');
        expect(participant2.stocks[1].ticker).to.equal('AAPL');

      })

      it('should fail if not called by owner', async function(){
        //participant1 tries to access all stocks
        const getAllStocksCall = stockRegistry.connect(participant1).getAllStocks();

        await expect(getAllStocksCall).to.be.rejectedWith('Only owner can call this');
      })
    })
  })
});
