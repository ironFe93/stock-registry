import { ethers } from "hardhat";

async function deployContracts(){
  const [ dtccSigner ] = await ethers.getSigners();
  const stockRegistryFactory = await ethers.getContractFactory("StockRegistry");
  const stockRegistry = await stockRegistryFactory.deploy(dtccSigner.address);

  const tickerRegistryFactory = await ethers.getContractFactory("TickerRegistry");
  const tickerRegistry = await tickerRegistryFactory.deploy(dtccSigner.address, stockRegistry.address);

  return { stockRegistry, tickerRegistry }
}

async function main() {
  
  const { stockRegistry, tickerRegistry } = await deployContracts();
  const [ dtccSigner, participant1, participant2 ] = await ethers.getSigners()

  async function logStocks(address: string, tag: string) {
    const stocks = await stockRegistry["getStocksOwned(address)"](address);
    console.log('Stocks of ', tag)
    
    const stocksPretty = stocks.map(stock => {
      return {
        ticker: stock.ticker,
        quantity: stock.quantity.toNumber()
      }
    })
    console.table(stocksPretty)
  }

  tickerRegistry.addTicker('TSLA');
  tickerRegistry.addTicker('GME');
  tickerRegistry.addTicker('MSFT');
  tickerRegistry.addTicker('GOOG');
  tickerRegistry.addTicker('META');

  const stocksEntity1 = [
    {
      quantity: 100,
      ticker: 'GOOG',
    },
  ]

  const stocksEntity2 = [
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

  //INITIAL STATUS
  let participant1Stocks = await stockRegistry["getStocksOwned(address)"](participant1.address);
  let participant2Stocks = await stockRegistry["getStocksOwned(address)"](participant2.address);

  console.log('INITIAL VALUES')
  logStocks(participant1.address, 'participant1');
  logStocks(participant2.address, 'participant2');

  //META SPLITS INTO WHATSAPP AND FACEBOOK
  await tickerRegistry.removeTicker('META', 4);

  await tickerRegistry.addTicker('WSPP');
  await tickerRegistry.addTicker('FB');

  const allStocks = await stockRegistry.getAllStocks();

  allStocks.forEach(async entity => {
    let newAmount = 0;
    
    entity.stocks.forEach(stock => {
      if(stock.ticker == 'META'){
        newAmount += stock.quantity.toNumber()/2;
        stockRegistry.removeStock(stock.ticker, stock.quantity, entity.wallet);
        stockRegistry.addStock('WSPP', newAmount, entity.wallet);
        stockRegistry.addStock('FB', newAmount, entity.wallet);
      }
    })
  })

  /// FINAL STATUS
  participant1Stocks = await stockRegistry["getStocksOwned(address)"](participant1.address);
  participant2Stocks = await stockRegistry["getStocksOwned(address)"](participant2.address);

  console.log('\nFINAL VALUES');
  logStocks(participant1.address, 'participant1');
  logStocks(participant2.address, 'participant2');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});