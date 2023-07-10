// SPDX-License-Identifier: GPL-3.0-or-later
import { expect } from "chai";
import exp from "constants";
import { channel } from "diagnostics_channel";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";

const { execSync } = require("child_process");

/**
Test suite for the Marketplace contract.
*/
export function shouldBehaveLikeMarketplace(): void {
  const provider = ethers.provider;

  const fs = require("fs");
  const path = require("path");

  /*
  Test case to check if a new product can be added.
  */
  it("should add a new product", async function () {
    // Define the required variables inside the test case
    const seller = this.signers.seller;
    const buyer = this.signers.buyer;
    const admin = this.signers.admin;

    // Call the addProduct function with the seller, name, and price
    await this.marketplace.addProduct(seller.address, "Product A", ethers.utils.parseEther("1"));
    // Check that a new product was added
    const productCount = await this.marketplace.getProductCount();
    expect(productCount).to.equal(1);

    // Check that the product details are correct
    let product = await this.marketplace.getProduct(0);

    // seller, name, price, prodAddr
    expect(product[0]).to.equal(seller.address);
    expect(product[1]).to.equal("Product A");
    expect(product[2]).to.equal(ethers.utils.parseEther("1"));
    expect(product[3]).to.equal(await this.marketplace.products(0));
  });

  it("Should allow a buyer to purchase a product", async function () {
    // Define the required variables inside the test case
    const seller = this.signers.seller;
    const buyer = this.signers.buyer;
    const admin = this.signers.admin;
    const amount = ethers.utils.parseEther("1");

    // add product to marketplace
    await this.marketplace.connect(seller).addProduct(seller.address, "Product A", amount);

    // Get initial product count
    const initialProductCount = await this.marketplace.getProductCount();

    // Execute purchase
    await this.marketplace
      .connect(buyer)
      .buyProduct(buyer.address, "Product A", amount, this.marketplace.address, { value: amount });

    // Get final product count
    const finalProductCount = await this.marketplace.getProductCount();

    expect(BigNumber.from(finalProductCount)).to.equal(BigNumber.from(initialProductCount).sub(1));
  });

  /**
  Test case to check if the correct index of a product is returned.
  */
  it("should return correct product index", async function () {
    // Define the required variables inside the test case
    const seller = this.signers.seller;
    const buyer = this.signers.buyer;
    const admin = this.signers.admin;

    // Add some products to the contract
    await this.marketplace.addProduct(seller.address, "Product A", ethers.utils.parseEther("1"));
    await this.marketplace.addProduct(seller.address, "Product B", ethers.utils.parseEther("2"));

    // Call the `getProductIndex` function to retrieve the index of Product B
    const index = (await this.marketplace.getProductIndex("Product B")).toNumber();

    // Check that the returned index is correct
    expect(index).to.equal(ethers.BigNumber.from(1));
  });

  /**
  Test case to check if zero is returned when a product is not found.
  */
  it("should return zero if product is not found", async function () {
    // Define the required variables inside the test case
    const seller = this.signers.seller;
    const buyer = this.signers.buyer;
    const admin = this.signers.admin;

    // Add some products to the contract
    await this.marketplace.addProduct(seller.address, "Product A", ethers.utils.parseEther("1"));
    await this.marketplace.addProduct(seller.address, "Product B", ethers.utils.parseEther("2"));

    // Call the `getProductIndex` function to retrieve the index of an unknown product
    const index = (await this.marketplace.getProductIndex("Unknown Product")).toNumber();

    // Check the returned index
    expect(index).to.equal(-1);
  });

  it("Should create a new BiDirectionalChannel", async function () {
    // Define initial balances
    const initialBalances = [1000, 2000];
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const expiresAt = BigNumber.from(new Date().setDate(new Date().getDate()));
    const challengePeriod = 86400 * 5; // 5 days
    const seller = this.signers.seller;
    const buyer = this.signers.buyer;
    const admin = this.signers.admin;

    // Listen for the ChannelCreated event
    const channelAddress = await expect(
      this.marketplace.createBiDirectionalChannel(
        [seller.address, buyer.address],
        [initialBalances[0], initialBalances[1]],
        expiresAt,
        challengePeriod,
        { value: initialBalances[0] + initialBalances[1] },
      ),
    )
      .to.emit(this.marketplace, "ChannelCreated")
      .withArgs(seller.address, buyer.address, await this.marketplace.channels);
  });

  it("Should withdraw funds from a BiDirectionalChannel", async function () {
    // Define initial balances
    const initialBalances = [1000, 2000];
    const expiresAt = BigNumber.from(new Date().setDate(new Date().getDate()));
    const challengePeriod = 86400 * 5; // 5 days
    const seller = this.signers.seller;
    const buyer = this.signers.buyer;
    const admin = this.signers.admin;

    const channelAddress = await this.marketplace.createBiDirectionalChannel(
      [seller.address, buyer.address],
      [initialBalances[0], initialBalances[1]],
      expiresAt,
      challengePeriod,
      { value: initialBalances[0] + initialBalances[1] },
    );

    expect(channelAddress)
      .to.emit(this.marketplace, "ChannelCreated")
      .withArgs(seller.address, buyer.address, await this.marketplace.channels);

    const events = await this.marketplace.queryFilter("ChannelCreated");

    // Get current block timestamp and the contract's end date
    const currentTimestamp = (await ethers.provider.getBlock("latest")).timestamp;

    // Calculate the time to increase
    const timeIncrease = expiresAt.toNumber() - currentTimestamp + 1;

    // Increase the time
    await ethers.provider.send("evm_increaseTime", [timeIncrease]);
    await ethers.provider.send("evm_mine", []);

    try {
      const withdrawChannelTx = await this.marketplace
        .connect(seller)
        .withdrawBiDirectionalChannel(events[0].args.channelAddress);
    } catch (error) {
      console.error(error);
    }
  });

  it("should measure execution time and gas cost for critical functions", async function () {
    // Define the required variables inside the test case
    const seller = this.signers.seller;
    const buyer = this.signers.buyer;
    const admin = this.signers.admin;

    const amountTransfer = ethers.utils.parseEther("1");
    const balances = [amountTransfer, amountTransfer];
    const _productIndex = 0; // Modify this to the index of a valid product in your contract
    const _productName = "Product A"; // Modify this to the name of a valid product in your contract
    const _productPrice = ethers.utils.parseEther("0.5"); // Modify this to the price of a valid product in your contract
    const _newExpiresAt = BigNumber.from(new Date().setDate(new Date().getDate()));
    const _challengePeriod = 1000;

    console.log("Marketplace");

    // Deposit funds into the marketplace contract
    await this.marketplace.deposit({ value: amountTransfer.mul(2) });

    // Add product
    const addProductStartTime = Date.now();
    const addProductTx = await this.marketplace.addProduct(seller.address, _productName, _productPrice);
    const addProductEndTime = Date.now();
    const addProductExecutionTime = addProductEndTime - addProductStartTime;
    const addProductGasUsed = (await addProductTx.wait()).gasUsed.toNumber();
    console.log("Add Product Execution Time:", addProductExecutionTime, "ms");
    console.log("Add Product Gas Used:", addProductGasUsed);

    // Buy product
    const buyProductStartTime = Date.now();
    const buyProductTx = await this.marketplace.buyProduct(
      buyer.address,
      _productName,
      _productPrice,
      this.marketplace.address,
      { value: _productPrice },
    );
    const buyProductEndTime = Date.now();
    const buyProductExecutionTime = buyProductEndTime - buyProductStartTime;
    const buyProductGasUsed = (await buyProductTx.wait()).gasUsed.toNumber();
    console.log("Buy Product Execution Time:", buyProductExecutionTime, "ms");
    console.log("Buy Product Gas Used:", buyProductGasUsed);

    // Create bi-directional channel
    const createChannelStartTime = Date.now();
    const createChannelTx = await this.marketplace.createBiDirectionalChannel(
      [seller.address, buyer.address],
      [balances[0], balances[1]],
      _newExpiresAt,
      _challengePeriod,
      { value: amountTransfer.mul(2) },
    );
    const createChannelEndTime = Date.now();
    const createChannelExecutionTime = createChannelEndTime - createChannelStartTime;
    const createChannelGasUsed = (await createChannelTx.wait()).gasUsed.toNumber();
    console.log("Create Channel Execution Time:", createChannelExecutionTime, "ms");
    console.log("Create Channel Gas Used:", createChannelGasUsed);

    await this.marketplace.connect(buyer).deposit({ value: amountTransfer.mul(2) });

    const _channel = await this.marketplace.createBiDirectionalChannel(
      [seller.address, buyer.address],
      [balances[0], balances[1]],
      _newExpiresAt,
      _challengePeriod,
      { value: amountTransfer.mul(2) },
    );

    // Get current block timestamp and the contract's end date
    const currentTimestamp = (await ethers.provider.getBlock("latest")).timestamp;

    // Calculate the time to increase
    const timeIncrease = _newExpiresAt.toNumber() - currentTimestamp + 1;

    // Increase the time
    await ethers.provider.send("evm_increaseTime", [timeIncrease]);
    await ethers.provider.send("evm_mine", []); // Get current block timestamp and the contract's end date

    const events = await this.marketplace.queryFilter("ChannelCreated");

    const channelAddress = events[1].args.channelAddress;

    expect(channelAddress).to.not.equal(this.marketplace.address);

    // Withdraw from bi-directional channel
    const withdrawChannelStartTime = Date.now();
    const withdrawChannelTx = await this.marketplace.withdrawBiDirectionalChannel(events[0].args.channelAddress);
    const withdrawChannelEndTime = Date.now();
    const withdrawChannelExecutionTime = withdrawChannelEndTime - withdrawChannelStartTime;
    const withdrawChannelGasUsed = (await withdrawChannelTx.wait()).gasUsed.toNumber();
    console.log("Withdraw Channel Execution Time:", withdrawChannelExecutionTime, "ms");
    console.log("Withdraw Channel Gas Used:", withdrawChannelGasUsed);
  });

  /**
   * Make measurements and write them to a file.
   */
  for (let i = 0; i < 1000; i++) {
    it("make measurements and write them to file", async function () {
      // Define the required variables inside the test case
      const seller = this.signers.seller;
      const buyer = this.signers.buyer;
      const admin = this.signers.admin;

      const amountTransfer = ethers.utils.parseEther("1");
      const balances = [amountTransfer, amountTransfer];
      const _productIndex = 0; // Modify this to the index of a valid product in your contract
      const _productName = "Product A"; // Modify this to the name of a valid product in your contract
      const _productPrice = ethers.utils.parseEther("0.5"); // Modify this to the price of a valid product in your contract
      const _newExpiresAt = BigNumber.from(new Date().setDate(new Date().getDate()));
      const _challengePeriod = 1000;

      console.log("Marketplace");

      // Deposit funds into the marketplace contract
      await this.marketplace.deposit({ value: amountTransfer.mul(2) });

      // Add product
      const addProductStartTime = Date.now();
      const addProductTx = await this.marketplace.addProduct(seller.address, _productName, _productPrice);
      const addProductEndTime = Date.now();
      const addProductExecutionTime = addProductEndTime - addProductStartTime;
      const addProductGasUsed = (await addProductTx.wait()).gasUsed.toNumber();

      // Buy product
      const buyProductStartTime = Date.now();
      const buyProductTx = await this.marketplace.buyProduct(
        buyer.address,
        _productName,
        _productPrice,
        this.marketplace.address,
        { value: _productPrice },
      );
      const buyProductEndTime = Date.now();
      const buyProductExecutionTime = buyProductEndTime - buyProductStartTime;
      const buyProductGasUsed = (await buyProductTx.wait()).gasUsed.toNumber();

      // Create bi-directional channel
      const createChannelStartTime = Date.now();
      const createChannelTx = await this.marketplace.createBiDirectionalChannel(
        [seller.address, buyer.address],
        [balances[0], balances[1]],
        _newExpiresAt,
        _challengePeriod,
        { value: amountTransfer.mul(2) },
      );
      const createChannelEndTime = Date.now();
      const createChannelExecutionTime = createChannelEndTime - createChannelStartTime;
      const createChannelGasUsed = (await createChannelTx.wait()).gasUsed.toNumber();

      await this.marketplace.connect(buyer).deposit({ value: amountTransfer.mul(2) });

      const _channel = await this.marketplace.createBiDirectionalChannel(
        [seller.address, buyer.address],
        [balances[0], balances[1]],
        _newExpiresAt,
        _challengePeriod,
        { value: amountTransfer.mul(2) },
      );

      // Get current block timestamp and the contract's end date
      const currentTimestamp = (await ethers.provider.getBlock("latest")).timestamp;

      // Calculate the time to increase
      const timeIncrease = _newExpiresAt.toNumber() - currentTimestamp + 1;

      // Increase the time
      await ethers.provider.send("evm_increaseTime", [timeIncrease]);
      await ethers.provider.send("evm_mine", []); // Get current block timestamp and the contract's end date

      const events = await this.marketplace.queryFilter("ChannelCreated");

      const channelAddress = events[1].args.channelAddress;

      expect(channelAddress).to.not.equal(this.marketplace.address);

      // Withdraw from bi-directional channel
      const withdrawChannelStartTime = Date.now();
      const withdrawChannelTx = await this.marketplace.withdrawBiDirectionalChannel(events[0].args.channelAddress);
      const withdrawChannelEndTime = Date.now();
      const withdrawChannelExecutionTime = withdrawChannelEndTime - withdrawChannelStartTime;
      const withdrawChannelGasUsed = (await withdrawChannelTx.wait()).gasUsed.toNumber();

      // After each action, write the execution time and gas used to a file.
      const folder = "./test/statistics/";

      if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder);
      }

      const name = "marketplace_test";
      fs.appendFileSync(folder + name + "_add_product_execution_time.txt", `${addProductExecutionTime}\n`);
      fs.appendFileSync(folder + name + "_add_product_gas_used.txt", `${addProductGasUsed}\n`);
      fs.appendFileSync(folder + name + "_buy_product_execution_time.txt", `${buyProductExecutionTime}\n`);
      fs.appendFileSync(folder + name + "_buy_product_gas_used.txt", `${buyProductGasUsed}\n`);
      fs.appendFileSync(folder + name + "_create_channel_execution_time.txt", `${createChannelExecutionTime}\n`);
      fs.appendFileSync(folder + name + "_create_channel_gas_used.txt", `${createChannelGasUsed}\n`);
      fs.appendFileSync(folder + name + "_withdraw_channel_execution_time.txt", `${withdrawChannelExecutionTime}\n`);
      fs.appendFileSync(folder + name + "_withdraw_channel_gas_used.txt", `${withdrawChannelGasUsed}\n`);
    });
  }
}

// Function to calculate gas statistics (mean, median, etc.)
function getGasStatistics(gasData: any[]) {
  const sortedData = gasData.sort((a: number, b: number) => a - b);
  const mean = gasData.reduce((acc: any, val: any) => acc + val, 0) / gasData.length;
  const median = sortedData[Math.floor(sortedData.length / 2)];
  const min = sortedData[0];
  const max = sortedData[sortedData.length - 1];
  const stdDev = calculateStandardDeviation(gasData, mean);

  return {
    mean,
    median,
    min,
    max,
    stdDev,
  };
}

// Function to calculate standard deviation
function calculateStandardDeviation(data: any[], mean: number) {
  const sum = data.reduce((acc: number, val: number) => acc + Math.pow(val - mean, 2), 0);
  const variance = sum / data.length;
  const stdDev = Math.sqrt(variance);
  return stdDev;
}
