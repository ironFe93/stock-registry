import { ethers } from "hardhat";

async function getContracts(){
  const [ dtccSigner ] = await ethers.getSigners();
  const stockRegistry = await ethers.getContractAt("StockRegistry", '0xe979891Da8c2af95146ef2eE7C6eBD20cBda5F45');
  const tickerRegistry = await ethers.getContractAt("TickerRegistry", '0xdF40141Ea83D30453011fd3ca09d015590CC281C');

  return { stockRegistry, tickerRegistry }
}

async function main() {
  const { stockRegistry, tickerRegistry } = await getContracts();
  const [ dtccSigner, participant1, participant2 ] = await ethers.getSigners();

  async function logStocks(address: string, tag: string) {
    const stocks = await stockRegistry["getStocksOwned(address)"](address);
    console.log('Stocks of ', tag);
    
    const stocksPretty = stocks.map(stock => {
      return {
        ticker: stock.ticker,
        quantity: stock.quantity.toNumber()
      }
    })
    console.table(stocksPretty)
  }

  console.time('addTicker');
  console.time('add5Tickers');
  await (await tickerRegistry.addTicker('TSLA')).wait();
  console.timeEnd('addTicker');
  await (await tickerRegistry.addTicker('GME')).wait();
  await (await tickerRegistry.addTicker('MSFT')).wait();
  await (await tickerRegistry.addTicker('GOOG')).wait();
  await (await tickerRegistry.addTicker('META')).wait();
  console.timeEnd('add5Tickers');

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

  console.time('addEntity');
  await (await stockRegistry.addEntity(stocksEntity1, participant1.address)).wait();
  console.timeEnd('addEntity');
  await (await stockRegistry.addEntity(stocksEntity2, participant2.address)).wait();

  //INITIAL STATUS

  console.log('INITIAL VALUES')
  await logStocks(participant1.address, 'participant1');
  await logStocks(participant2.address, 'participant2');

  //GOOGLE BUYS MICROSOFT
  console.time('merger');
  await (await tickerRegistry.removeTicker('GOOG', 3)).wait();
  await (await tickerRegistry.removeTicker('MSFT', 2)).wait();

  await (await tickerRegistry.addTicker('GOSF')).wait();

  const allStocks = await stockRegistry.getAllStocks();

  for (let index = 0; index < allStocks.length; index++) {
    const entity = allStocks[index];
    let newAmount = 0;

    for (let j = 0; j < entity.stocks.length; j++) {
      const stock = entity.stocks[j];
      if(stock.ticker == 'GOOG'){
        newAmount += stock.quantity.toNumber();
        await (await stockRegistry.removeStock('GOOG', stock.quantity, entity.wallet)).wait();
      }

      if(stock.ticker == 'MSFT' ){
        newAmount += stock.quantity.toNumber();
        await (await stockRegistry.removeStock('MSFT', stock.quantity, entity.wallet)).wait();
      }
    }
    await (await stockRegistry.addStock('GOSF', newAmount, entity.wallet)).wait();
    
  }
  console.timeEnd('merger');

  /// FINAL STATUS

  console.log('\nFINAL VALUES');
  await logStocks(participant1.address, 'participant1');
  await logStocks(participant2.address, 'participant2');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
