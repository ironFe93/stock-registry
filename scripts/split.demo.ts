import { ethers } from "hardhat";

async function getContracts(){
  const [ dtccSigner ] = await ethers.getSigners();
  const stockRegistry = await ethers.getContractAt("StockRegistry", '0xe979891Da8c2af95146ef2eE7C6eBD20cBda5F45');
  const tickerRegistry = await ethers.getContractAt("TickerRegistry", '0xdF40141Ea83D30453011fd3ca09d015590CC281C');

  return { stockRegistry, tickerRegistry }
}

async function main() {
  const { stockRegistry, tickerRegistry } = await getContracts();
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

  await (await tickerRegistry.addTicker('TSLA')).wait();
  await (await tickerRegistry.addTicker('GME')).wait();
  await (await tickerRegistry.addTicker('MSFT')).wait();
  await (await tickerRegistry.addTicker('GOOG')).wait();
  await (await tickerRegistry.addTicker('META')).wait();

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

  await (await stockRegistry.addEntity(stocksEntity1, participant1.address)).wait();
  await (await stockRegistry.addEntity(stocksEntity2, participant2.address)).wait();

  console.log('INITIAL VALUES')
  logStocks(participant1.address, 'participant1');
  logStocks(participant2.address, 'participant2');

  //META SPLITS INTO WHATSAPP AND FACEBOOK
  await (await tickerRegistry.removeTicker('META', 4)).wait();

  await (await tickerRegistry.addTicker('WSPP')).wait();
  await (await tickerRegistry.addTicker('FB')).wait();

  const allStocks = await stockRegistry.getAllStocks();

  for (let index = 0; index < allStocks.length; index++) {
    const entity = allStocks[index];
    let newAmount = 0;

    for (let index = 0; index < entity.stocks.length; index++) {
      const stock = entity.stocks[index];

      if(stock.ticker == 'META'){
        newAmount += stock.quantity.toNumber()/2;
        await (await stockRegistry.removeStock(stock.ticker, stock.quantity, entity.wallet)).wait();
        await (await stockRegistry.addStock('WSPP', newAmount, entity.wallet)).wait();
        await (await stockRegistry.addStock('FB', newAmount, entity.wallet)).wait();
      }
    }
  }

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