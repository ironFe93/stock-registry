import { ethers } from "hardhat";

async function main() {
  
  const [ dtccSigner ] = await ethers.getSigners();
  const stockRegistryFactory = await ethers.getContractFactory("StockRegistry");
  const stockRegistry = await stockRegistryFactory.deploy(dtccSigner.address);

  console.log('stockRegistry: ', stockRegistry.address);

  const tickerRegistryFactory = await ethers.getContractFactory("TickerRegistry");
  const tickerRegistry = await tickerRegistryFactory.deploy(dtccSigner.address, stockRegistry.address);
  console.log('tickerRegistry: ', tickerRegistry.address);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
