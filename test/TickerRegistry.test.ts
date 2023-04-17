import { expect } from "chai";
import { ethers } from "hardhat";
import { StockRegistry, TickerRegistry } from '../typechain-types'
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe.only("TickerRegistry", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployContract() {
    const [ dtccSigner ] = await ethers.getSigners();
      const stockRegistryFactory = await ethers.getContractFactory("StockRegistry");
      const stockRegistry = await stockRegistryFactory.deploy(dtccSigner.address);

      const tickerRegistryFactory = await ethers.getContractFactory("TickerRegistry");
      const tickerRegistry = await tickerRegistryFactory.deploy(dtccSigner.address, stockRegistry.address)

    return { tickerRegistry, stockRegistry };
  }

  describe("Deployment", function () {
    it("Should set the right owner and Stock Registry", async function () {
      const [ dtccSigner ] = await ethers.getSigners();
      const stockRegistryFactory = await ethers.getContractFactory("StockRegistry");
      const stockRegistry = await stockRegistryFactory.deploy(dtccSigner.address);

      const tickerRegistryFactory = await ethers.getContractFactory("TickerRegistry");
      const TickerRegistry = await tickerRegistryFactory.deploy(dtccSigner.address, stockRegistry.address);

      const queriedOwner = await TickerRegistry.getOwner();
      const queriedStockRegistry = await TickerRegistry.getStockRegistry();

      expect(queriedOwner).to.equal(dtccSigner.address);
      expect(queriedStockRegistry).to.equal(stockRegistry.address);
    });
  });

  describe("Functions", function () {
    let tickerRegistry: TickerRegistry;
    let stockRegistry: StockRegistry;
    let dtccSigner: SignerWithAddress;
    let participant1: SignerWithAddress;
    let participant2: SignerWithAddress;

    beforeEach(async function(){
      ({ tickerRegistry, stockRegistry } = await deployContract());
      ([dtccSigner, participant1, participant2] = await ethers.getSigners());
      tickerRegistry.addTicker('TSLA');
      tickerRegistry.addTicker('GME');
      tickerRegistry.addTicker('MSFT');
      tickerRegistry.addTicker('GOOG');
      tickerRegistry.addTicker('META');

      const stocksEntity1: StockRegistry.StockStruct[] = [
        {
          quantity: 100,
          ticker: 'GOOG',
        },
      ]

      const stocksEntity2: StockRegistry.StockStruct[] = [
        {
          quantity: 100,
          ticker: 'META',
        },
        {
          quantity: 50,
          ticker: 'MSFT',
        },
      ]

      await stockRegistry.addEntity(stocksEntity1, participant1.address);
      await stockRegistry.addEntity(stocksEntity2, participant2.address);
    })

    describe("addTicker", function () {
      it("Should add a Ticker to the contract", async function () {

        //DTCC adds AAPL
        await tickerRegistry.addTicker('AAPL');
        
        const result = await tickerRegistry.checkTicker('AAPL')
        expect(result).to.equal(true);
      });
    });

    describe("removeTicker", function () {
      it("Should remove a Ticker from the contract", async function () {

        const index = await tickerRegistry.getTickerIndex('TSLA');

        //DTCC removes TSLA
        await tickerRegistry.removeTicker('TSLA', index);
        
        const result = await tickerRegistry.checkTicker('TSLA')
        expect(result).to.equal(false);
      });
    });
  })
});
