import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { StockRegistry } from '../typechain-types'
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("StockMarket", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployContract() {
    const [ dtccSigner ] = await ethers.getSigners();
      const stockMarketFactory = await ethers.getContractFactory("StockRegistry");
      const stockMarket = await stockMarketFactory.deploy(dtccSigner.address);

    return { stockMarket };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const [ dtccSigner ] = await ethers.getSigners();
      const stockMarketFactory = await ethers.getContractFactory("StockRegistry");
      const stockMarket = await stockMarketFactory.deploy(dtccSigner.address);

      const queriedOwner = await stockMarket.getOwner();

      expect(queriedOwner).to.equal(dtccSigner.address);
    });
  });

  describe("Functions", function () {
    let stockMarket: StockRegistry;
    let dtccSigner: SignerWithAddress;
    let participant1: SignerWithAddress;
    let participant2: SignerWithAddress;
    let participant3: SignerWithAddress;

    beforeEach(async function(){
      ({ stockMarket } = await deployContract());
      ([dtccSigner, participant1, participant2, participant3] = await ethers.getSigners());
    })

    describe("addStock", function () {
      it("Should add a stock registry", async function () {
        //DTCC adds a stock
        await stockMarket.addStock('TSLA', 100, participant1.address);

        const [ TSLAStock ] = await stockMarket["getStocksOwned(address)"](participant1.address);
  
        expect(TSLAStock.ticker).to.equal('TSLA');
        expect(TSLAStock.quantity).to.equal(100);
      });

      it("Should reject if not called by the owner", async function () {
        //Participant 1 attempts to add stocks
        const addStockCall = stockMarket.connect(participant1).addStock('TSLA', 100, participant1.address);
  
        await expect(addStockCall).to.be.revertedWith('Only owner can call this');
      });
    });

    describe("getStocksOwned", function () {

      beforeEach(async function() {
        //DTCC adds a stock
        await stockMarket.addStock('TSLA', 100, participant1.address);
        await stockMarket.addStock('GME', 100, participant2.address);
        await stockMarket.addStock('AAPL', 50, participant2.address);
        //participant3 has no stocks

      })
      it("should get the sender's stocks", async function () {
        //Participant2 wants to view his stocks
        const [GMEStock, AAPLStock] = await stockMarket.connect(participant2.address)["getStocksOwned()"]();
  
        expect(GMEStock.ticker).to.equal('GME');
        expect(GMEStock.quantity).to.equal(100);

        expect(AAPLStock.ticker).to.equal('AAPL');
        expect(AAPLStock.quantity).to.equal(50);
      });

      it("Should reject if owner calls method without specifying an address", async function () {
        const getStocksOwnedCall = stockMarket["getStocksOwned()"]();
  
        await expect(getStocksOwnedCall).to.be.revertedWith('Please Specify an address');
      });

      it("should get participant stocks if owner specifies address", async function () {
        const [ TSLAstock ] = await stockMarket["getStocksOwned(address)"](participant1.address);
  
        expect(TSLAstock.ticker).to.equal('TSLA');
        expect(TSLAstock.quantity).to.equal(100);
      });

      it("should get empty array if owner specifies unknown address", async function () {
        //random address
        const randomAddress = ethers.Wallet.createRandom().address;

        const result = await stockMarket["getStocksOwned(address)"](randomAddress);
  
        expect(result.length).to.equal(0);
      });

      it("should get empty array if participant has no shares", async function () {
        //Participant3 wants to view his stocks
        const result = await stockMarket.connect(participant3)["getStocksOwned()"]();
  
        expect(result.length).to.equal(0);
      });
    });

    describe('getAllStocks', function(){
      beforeEach(async function() {
        await stockMarket.addStock('TSLA', 100, participant1.address);
        await stockMarket.addStock('GME', 100, participant2.address);
        await stockMarket.addStock('AAPL', 50, participant2.address);
        //participant3 has no stocks
      })

      it('should retrieve all participants and stocks', async function(){
        //dtcc retrieves all stock data
        const [ participant1, participant2 ] = await stockMarket.getAllStocks();

        expect(participant1.stocks.length).to.equal(1);
        expect(participant1.stocks[0].ticker).to.equal('TSLA');
        
        expect(participant2.stocks.length).to.equal(2);
        expect(participant2.stocks[0].ticker).to.equal('GME');
        expect(participant2.stocks[1].ticker).to.equal('AAPL');

      })

      it('should fail if not called by owner', async function(){
        //participant1 tries to access all stocks
        const getAllStocksCall = stockMarket.connect(participant1).getAllStocks();

        await expect(getAllStocksCall).to.be.rejectedWith('Only owner can call this');
      })
    })
  })
});
