// SPDX-License-Identifier: GPL-3.0-or-later
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";

const { execSync } = require("child_process");

/**
This function defines the tests for the BiDirectionalChannel contract.
*/
export function shouldBehaveLikeBiDirectionalChannel(): void {
  const provider = ethers.provider;

  const fs = require("fs");
  const path = require("path");

  /**
  Test case to check if the contract is deployed successfully.
  */
  it("Contract Deployed Successfully !!", async function () {
    const address: string = this.bidirectionalchannel.address;
    expect(address).to.not.equal(ethers.constants.AddressZero);
    expect(address).to.not.equal(undefined);
    expect(address).to.not.equal(null);
    expect(address).to.not.equal("");
  });

  /**
  Test case to check if the contract is initialized with correct values.
  */
  it("should initialize with correct values", async function () {
    const endDate = BigNumber.from(new Date().setDate(new Date().getDate()));
    const period: number = 86400 * 5;

    const _seller = await this.bidirectionalchannel.users(0);

    const _buyer = await this.bidirectionalchannel.users(1);
    const _endDate = await this.bidirectionalchannel.endDate();
    const _period = await this.bidirectionalchannel.period();

    expect(_seller).to.equal(this.signers.seller.address);
    expect(_buyer).to.equal(this.signers.buyer.address);
    //expect(_endDate).to.equal(endDate);
    expect(_period).to.equal(period);

    expect(await this.bidirectionalchannel.isUser(_seller)).to.be.true;
    expect(await this.bidirectionalchannel.isUser(_buyer)).to.be.true;
  });

  /**
  Test case to check if the contract maintains correct balances.
  */
  it("should maintain correct balances", async function () {
    const _contractBalance = await this.bidirectionalchannel.getContractBalance();
    const _user1Balance = await this.bidirectionalchannel.balances(this.signers.seller.address);
    const _user2Balance = await this.bidirectionalchannel.balances(this.signers.buyer.address);

    let sellerBal = ethers.utils.parseEther("50");

    let buyerBal = ethers.utils.parseEther("0");

    expect(_user1Balance).to.equal(sellerBal);
    expect(_user2Balance).to.equal(buyerBal);
    expect(_contractBalance).to.equal(sellerBal.add(buyerBal));
  });

  /**
  Test case to check if balance changes that don't match current balances are prevented.
  */
  it("should not allow balance changes that don't match current balances", async function () {
    const seller = this.signers.seller;
    const buyer = this.signers.buyer;

    const sellerBal = await this.bidirectionalchannel.balances(seller.address);

    const buyerBal = await this.bidirectionalchannel.balances(buyer.address);

    const amountTransfer = BigNumber.from(ethers.utils.parseEther("25"));
    const sellerBalAfter = BigNumber.from(sellerBal.sub(amountTransfer).toString());
    const buyerBalAfter = BigNumber.from(buyerBal.add(amountTransfer).toString());

    const _nonce = 0;

    const message = await this.bidirectionalchannel.getMessage(
      this.bidirectionalchannel.address,
      [sellerBalAfter, buyerBalAfter],
      _nonce + 1,
    );

    const messageHash = ethers.utils.hashMessage(message);

    const sellerSign = await seller.signMessage(ethers.utils.arrayify(messageHash));
    const buyerSign = await buyer.signMessage(ethers.utils.arrayify(messageHash));

    // Check
    let balanceSeller = await this.bidirectionalchannel.balances(seller.address); // seller
    let balanceBuyer = await this.bidirectionalchannel.balances(buyer.address); // buyer

    const totalContractBalance = await this.bidirectionalchannel.getContractBalance();

    // Set new balances that will definitely exceed the contract's balance
    const sellerBalAfterInvalid = totalContractBalance.add(10);
    const buyerBalInvalid = totalContractBalance.add(10);

    // Incorrect balance change, should revert
    await expect(
      this.bidirectionalchannel
        .connect(seller)
        .changeBalance(messageHash, [sellerSign, buyerSign], _nonce + 1, [sellerBalAfterInvalid, buyerBalInvalid]),
    ).to.be.revertedWith("Balance of contract must be greater or equal to the balances of users !!");
  });

  /**
  Test case to check if balance changes with incorrect nonce are prevented.
  */
  it("should not allow balance changes with incorrect nonce", async function () {
    const seller = this.signers.seller;
    const buyer = this.signers.buyer;

    const sellerBal = await this.bidirectionalchannel.balances(seller.address);

    const buyerBal = await this.bidirectionalchannel.balances(buyer.address);

    const amountTransfer = BigNumber.from(ethers.utils.parseEther("10"));
    const sellerBalAfter = BigNumber.from(sellerBal.sub(amountTransfer).toString());
    const buyerBalAfter = BigNumber.from(buyerBal.add(amountTransfer).toString());

    const _nonce = 0;

    const message = await this.bidirectionalchannel.getMessage(
      this.bidirectionalchannel.address,
      [sellerBalAfter, buyerBalAfter],
      _nonce + 1,
    );

    const messageHash = ethers.utils.hashMessage(message);

    const sellerSign = await seller.signMessage(ethers.utils.arrayify(messageHash));
    const buyerSign = await buyer.signMessage(ethers.utils.arrayify(messageHash));

    await expect(
      this.bidirectionalchannel.changeBalance(messageHash, [sellerSign, buyerSign], _nonce + 2, [
        sellerBalAfter,
        buyerBalAfter,
      ]),
    );
  });

  /**
  Test case to check if balances are correctly changed.
  */
  it("should correctly change balances", async function () {
    // Define the required variables inside the test case
    const seller = this.signers.seller;
    const buyer = this.signers.buyer;
    const sellerBal = await this.bidirectionalchannel.balances(seller.address);
    const buyerBal = await this.bidirectionalchannel.balances(buyer.address);
    const amountTransfer = ethers.utils.parseEther("10");
    const sellerBalAfter = sellerBal.sub(amountTransfer);
    const buyerBalAfter = buyerBal.add(amountTransfer);
    const _nonce = 0; // Adjust this as necessary based on your contract logic

    const message = await this.bidirectionalchannel.getMessage(
      this.bidirectionalchannel.address,
      [sellerBalAfter, buyerBalAfter],
      _nonce + 1,
    );

    const messageHash = ethers.utils.hashMessage(message);

    const sellerSign = await seller.signMessage(ethers.utils.arrayify(messageHash));
    const buyerSign = await buyer.signMessage(ethers.utils.arrayify(messageHash));

    await this.bidirectionalchannel.changeBalance(messageHash, [sellerSign, buyerSign], _nonce + 1, [
      sellerBalAfter,
      buyerBalAfter,
    ]);

    const _sellerBalance = await this.bidirectionalchannel.balances(seller.address);
    const _buyerBalance = await this.bidirectionalchannel.balances(buyer.address);

    expect(_sellerBalance).to.equal(sellerBalAfter);
    expect(_buyerBalance).to.equal(buyerBalAfter);
  });

  /**
  Test case to check if a user can withdraw after the expiration period.
  */
  it("should allow withdrawing after the expiration period", async function () {
    // Try to withdraw before expiration period
    await expect(this.bidirectionalchannel.connect(this.signers.seller).withdraw()).to.be.revertedWith(
      "Period is not expired yet !!",
    );

    // Get current block timestamp and the contract's end date
    const currentTimestamp = (await ethers.provider.getBlock("latest")).timestamp;
    const endDate = await this.bidirectionalchannel.endDate();

    // Calculate the time to increase
    const timeIncrease = endDate.toNumber() - currentTimestamp + 1;

    // Increase the time
    await ethers.provider.send("evm_increaseTime", [timeIncrease]);
    await ethers.provider.send("evm_mine", []);

    // Check balances before withdrawal
    const balanceBefore = await provider.getBalance(this.bidirectionalchannel.address);
    expect(balanceBefore).to.not.equal(0);

    // Perform withdrawal
    await this.bidirectionalchannel.connect(this.signers.seller).withdraw();

    // Verify the balance
    const balanceAfter = await provider.getBalance(this.bidirectionalchannel.address);
    expect(balanceAfter).to.equal(0);
  });

  /**
  Test case to check if a user can withdraw after the challenge period has expired.
  */
  it("should allow a user to withdraw after the challenge period has expired", async function () {
    // Set up test parameters
    const initialBalances = [10, 10];
    const user = this.signers.seller;

    // Get current block timestamp and the contract's end date
    const currentTimestamp = (await ethers.provider.getBlock("latest")).timestamp;
    const endDate = await this.bidirectionalchannel.endDate();

    // Calculate the time to increase
    const timeIncrease = endDate.toNumber() - currentTimestamp + 1;

    // Increase the time
    await ethers.provider.send("evm_increaseTime", [timeIncrease]);
    await ethers.provider.send("evm_mine", []);

    // Call the withdraw function
    await this.bidirectionalchannel.connect(user).withdraw();

    // Get the final balance of the user
    const finalBalance = await this.bidirectionalchannel.balances(user.address);

    // Expect the user's balance to be zero
    expect(finalBalance).to.equal(0);

    // Expect the Withdraw event to be emitted
    const events = await this.bidirectionalchannel.queryFilter("WithdrawAmount");

    expect(events.length).to.equal(1);

    //console.log("events", events[0].args);

    expect(events[0].args._address).to.equal(user.address);
  });

  /**
  Test case to check if reverting occurs when a user with no balance tries to withdraw.
  */
  it("should revert if the user has no balance", async function () {
    // Get current block timestamp and the contract's end date
    const currentTimestamp = (await ethers.provider.getBlock("latest")).timestamp;
    const endDate = await this.bidirectionalchannel.endDate();

    // Calculate the time to increase
    const timeIncrease = endDate.toNumber() - currentTimestamp + 1;

    // Increase the time
    await ethers.provider.send("evm_increaseTime", [timeIncrease]);
    await ethers.provider.send("evm_mine", []);

    const getBalance = await this.bidirectionalchannel.balances(this.signers.buyer.address);
    //console.log("getBalance", getBalance.toString());

    // Set up test parameters
    const user = this.signers.buyer;

    // Call the withdraw function with a user who has no balance
    await expect(this.bidirectionalchannel.connect(user).withdraw()).to.be.revertedWith("User has no balance");
  });

  it("should measure execution time and gas cost for critical functions", async function () {
    // Define the required variables inside the test case
    const seller = this.signers.seller;
    const buyer = this.signers.buyer;
    const sellerBal = await this.bidirectionalchannel.balances(seller.address);
    const buyerBal = await this.bidirectionalchannel.balances(buyer.address);
    const amountTransfer = ethers.utils.parseEther("10");
    const sellerBalAfter = sellerBal.sub(amountTransfer);
    const buyerBalAfter = buyerBal.add(amountTransfer);
    const _nonce = 0; // Adjust this as necessary based on your contract logic
    const newExpiresAt = BigNumber.from(new Date().setDate(new Date().getDate()));
    const depositAmount = 1000;

    const message = await this.bidirectionalchannel.getMessage(
      this.bidirectionalchannel.address,
      [sellerBalAfter, buyerBalAfter],
      _nonce + 1,
    );

    const messageHash = ethers.utils.hashMessage(message);

    const sellerSign = await seller.signMessage(ethers.utils.arrayify(messageHash));
    const buyerSign = await buyer.signMessage(ethers.utils.arrayify(messageHash));

    console.log("BiDirectionalChannel");

    // Change the balances and update the nonce
    const changeBalanceStartTime = Date.now();
    const changeBalanceTx = await this.bidirectionalchannel.changeBalance(
      messageHash,
      [sellerSign, buyerSign],
      _nonce + 1,
      [sellerBalAfter, buyerBalAfter],
    );
    const changeBalanceEndTime = Date.now();
    const changeBalanceExecutionTime = changeBalanceEndTime - changeBalanceStartTime;
    const changeBalanceGasUsed = (await changeBalanceTx.wait()).gasUsed.toNumber();
    console.log("Change Balance Execution Time:", changeBalanceExecutionTime, "ms");
    console.log("Change Balance Gas Used:", changeBalanceGasUsed);

    // Get current block timestamp and the contract's end date
    const currentTimestamp = (await ethers.provider.getBlock("latest")).timestamp;
    const endDate = await this.bidirectionalchannel.endDate();

    // Calculate the time to increase
    const timeIncrease = endDate.toNumber() - currentTimestamp + 1;

    // Increase the time
    await ethers.provider.send("evm_increaseTime", [timeIncrease]);
    await ethers.provider.send("evm_mine", []);

    // Withdraw the balance after the expiration period
    const withdrawStartTime = Date.now();
    const withdrawTx = await this.bidirectionalchannel.withdraw();
    const withdrawEndTime = Date.now();
    const withdrawExecutionTime = withdrawEndTime - withdrawStartTime;
    const withdrawGasUsed = (await withdrawTx.wait()).gasUsed.toNumber();
    console.log("Withdraw Execution Time:", withdrawExecutionTime, "ms");
    console.log("Withdraw Gas Used:", withdrawGasUsed);

    // Set a new expiration date for the channel
    const setExpiresAtStartTime = Date.now();
    const setExpiresAtTx = await this.bidirectionalchannel.setExpiresAt(newExpiresAt);
    const setExpiresAtEndTime = Date.now();
    const setExpiresAtExecutionTime = setExpiresAtEndTime - setExpiresAtStartTime;
    const setExpiresAtGasUsed = (await setExpiresAtTx.wait()).gasUsed.toNumber();
    console.log("Set Expires At Execution Time:", setExpiresAtExecutionTime, "ms");
    console.log("Set Expires At Gas Used:", setExpiresAtGasUsed);

    // Deposit funds into the channel
    const depositStartTime = Date.now();
    const depositTx = await this.bidirectionalchannel.deposit({ value: depositAmount });
    const depositEndTime = Date.now();
    const depositExecutionTime = depositEndTime - depositStartTime;
    const depositGasUsed = (await depositTx.wait()).gasUsed.toNumber();
    console.log("Deposit Execution Time:", depositExecutionTime, "ms");
    console.log("Deposit Gas Used:", depositGasUsed);

    // Get the balance of the contract
    const getContractBalanceStartTime = Date.now();
    const contractBalance = await this.bidirectionalchannel.getContractBalance();
    const getContractBalanceEndTime = Date.now();
    const getContractBalanceExecutionTime = getContractBalanceEndTime - getContractBalanceStartTime;
    console.log("Get Contract Balance Execution Time:", getContractBalanceExecutionTime, "ms");

    // Get the current block timestamp
    const getBlockTimestampStartTime = Date.now();
    const blockTimestamp = await this.bidirectionalchannel.getBlockTimestamp();
    const getBlockTimestampEndTime = Date.now();
    const getBlockTimestampExecutionTime = getBlockTimestampEndTime - getBlockTimestampStartTime;
    console.log("Get Block Timestamp Execution Time:", getBlockTimestampExecutionTime, "ms");

    // Add assertions or further analysis based on the results if needed
  });

  /**
   * Make measurements and write them to a file.
   */
  for (let i = 0; i < 1000; i++) {
    it("make measurements and write them to file", async function () {
      // Define the required variables inside the test case
      const seller = this.signers.seller;
      const buyer = this.signers.buyer;
      const sellerBal = await this.bidirectionalchannel.balances(seller.address);
      const buyerBal = await this.bidirectionalchannel.balances(buyer.address);
      const amountTransfer = ethers.utils.parseEther("10");
      const sellerBalAfter = sellerBal.sub(amountTransfer);
      const buyerBalAfter = buyerBal.add(amountTransfer);
      const _nonce = 0; // Adjust this as necessary based on your contract logic
      const newExpiresAt = BigNumber.from(new Date().setDate(new Date().getDate()));
      const depositAmount = 1000;

      const message = await this.bidirectionalchannel.getMessage(
        this.bidirectionalchannel.address,
        [sellerBalAfter, buyerBalAfter],
        _nonce + 1,
      );

      const messageHash = ethers.utils.hashMessage(message);

      const sellerSign = await seller.signMessage(ethers.utils.arrayify(messageHash));
      const buyerSign = await buyer.signMessage(ethers.utils.arrayify(messageHash));

      console.log("BiDirectionalChannel");

      // Change the balances and update the nonce
      const changeBalanceStartTime = Date.now();
      const changeBalanceTx = await this.bidirectionalchannel.changeBalance(
        messageHash,
        [sellerSign, buyerSign],
        _nonce + 1,
        [sellerBalAfter, buyerBalAfter],
      );
      const changeBalanceEndTime = Date.now();
      const changeBalanceExecutionTime = changeBalanceEndTime - changeBalanceStartTime;
      const changeBalanceGasUsed = (await changeBalanceTx.wait()).gasUsed.toNumber();

      // Get current block timestamp and the contract's end date
      const currentTimestamp = (await ethers.provider.getBlock("latest")).timestamp;
      const endDate = await this.bidirectionalchannel.endDate();

      // Calculate the time to increase
      const timeIncrease = endDate.toNumber() - currentTimestamp + 1;

      // Increase the time
      await ethers.provider.send("evm_increaseTime", [timeIncrease]);
      await ethers.provider.send("evm_mine", []);

      // Withdraw the balance after the expiration period
      const withdrawStartTime = Date.now();
      const withdrawTx = await this.bidirectionalchannel.withdraw();
      const withdrawEndTime = Date.now();
      const withdrawExecutionTime = withdrawEndTime - withdrawStartTime;
      const withdrawGasUsed = (await withdrawTx.wait()).gasUsed.toNumber();

      // Set a new expiration date for the channel
      const setExpiresAtStartTime = Date.now();
      const setExpiresAtTx = await this.bidirectionalchannel.setExpiresAt(newExpiresAt);
      const setExpiresAtEndTime = Date.now();
      const setExpiresAtExecutionTime = setExpiresAtEndTime - setExpiresAtStartTime;
      const setExpiresAtGasUsed = (await setExpiresAtTx.wait()).gasUsed.toNumber();

      // Deposit funds into the channel
      const depositStartTime = Date.now();
      const depositTx = await this.bidirectionalchannel.deposit({ value: depositAmount });
      const depositEndTime = Date.now();
      const depositExecutionTime = depositEndTime - depositStartTime;
      const depositGasUsed = (await depositTx.wait()).gasUsed.toNumber();

      // Get the balance of the contract
      const getContractBalanceStartTime = Date.now();
      const contractBalance = await this.bidirectionalchannel.getContractBalance();
      const getContractBalanceEndTime = Date.now();
      const getContractBalanceExecutionTime = getContractBalanceEndTime - getContractBalanceStartTime;

      // Get the current block timestamp
      const getBlockTimestampStartTime = Date.now();
      const blockTimestamp = await this.bidirectionalchannel.getBlockTimestamp();
      const getBlockTimestampEndTime = Date.now();
      const getBlockTimestampExecutionTime = getBlockTimestampEndTime - getBlockTimestampStartTime;

      // After each action, write the execution time and gas used to a file.
      const folder = "./test/statistics/";

      if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder);
      }

      const name = "bidirectionalchannel_test";
      fs.appendFileSync(folder + name + "_change_balance_execution_time.txt", `${changeBalanceExecutionTime}\n`);
      fs.appendFileSync(folder + name + "_change_balance_gas_used.txt", `${changeBalanceGasUsed}\n`);
      fs.appendFileSync(folder + name + "_withdraw_execution_time.txt", `${withdrawExecutionTime}\n`);
      fs.appendFileSync(folder + name + "_withdraw_gas_used.txt", `${withdrawGasUsed}\n`);
      fs.appendFileSync(folder + name + "_expires_at_execution_time.txt", `${setExpiresAtExecutionTime}\n`);
      fs.appendFileSync(folder + name + "_expires_at_gas_used.txt", `${setExpiresAtGasUsed}\n`);
      fs.appendFileSync(folder + name + "_deposit_execution_time.txt", `${depositExecutionTime}\n`);
      fs.appendFileSync(folder + name + "_deposit_gas_used.txt", `${depositGasUsed}\n`);
      fs.appendFileSync(folder + name + "_contract_balance_execution_time.txt", `${getContractBalanceExecutionTime}\n`);
      fs.appendFileSync(folder + name + "_block_timestamp_execution_time.txt", `${getBlockTimestampExecutionTime}\n`);
    });
  }

  /*
  it("should generate a violin plot for gas consumption", async function () {
    // Define the required variables inside the test case
    const seller = this.signers.seller;
    const buyer = this.signers.buyer;
    const sellerBal = await this.bidirectionalchannel.balances(seller.address);
    const buyerBal = await this.bidirectionalchannel.balances(buyer.address);
    const amountTransfer = ethers.utils.parseEther("10");
    const sellerBalAfter = sellerBal.sub(amountTransfer);
    const buyerBalAfter = buyerBal.add(amountTransfer);
    var _nonce = 0; // Adjust this as necessary based on your contract logic
    const newExpiresAt = BigNumber.from(new Date().setDate(new Date().getDate()));
    //const depositAmount = 1000;

    const message = await this.bidirectionalchannel.getMessage(
      this.bidirectionalchannel.address,
      [sellerBalAfter, buyerBalAfter],
      _nonce + 1,
    );

    const messageHash = ethers.utils.hashMessage(message);

    const sellerSign = await seller.signMessage(ethers.utils.arrayify(messageHash));
    const buyerSign = await buyer.signMessage(ethers.utils.arrayify(messageHash));

    // Perform gas-consuming actions multiple times and store the gas consumption data
    const numExecutions = 10; // Number of executions to perform
    const gasData = [];

    _nonce = _nonce + 1;

    for (let i = 0; i < numExecutions; i++) {
      _nonce = _nonce + i;

      const tx = await this.bidirectionalchannel.changeBalance(messageHash, [sellerSign, buyerSign], _nonce, [
        sellerBalAfter,
        buyerBalAfter,
      ]);

      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed.toNumber();
      gasData.push(gasUsed);
    }

    // Export gas consumption data to a file
    const gasDataFileName = "bidirectional_gas_consumption_data.txt";
    const gasDataFilePath = "./test/gnuplot/" + gasDataFileName;

    // Create the directory if it doesn't exist
    const gasDataDir = path.dirname(gasDataFilePath);
    if (!fs.existsSync(gasDataDir)) {
      fs.mkdirSync(gasDataDir, { recursive: true });
    }

    // Export gas consumption data to a file
    const gasDataContent = gasData.join("\n");
    fs.writeFileSync(gasDataFilePath, gasDataContent);

    // Generate the violin plot using gnuplot
    const gnuplotScriptFilePath = "./test/gnuplot/bidirectional_violin_plot.gp";

    // Create the directory if it doesn't exist
    const gnuplotScriptDataDir = path.dirname(gnuplotScriptFilePath);
    if (!fs.existsSync(gnuplotScriptDataDir)) {
      fs.mkdirSync(gnuplotScriptDataDir, { recursive: true });
    }

    const gnuplotScriptContent = `
      set terminal pngcairo enhanced font "arial,10" fontscale 1.0 size 800, 600
      set output 'bidirectional_violin_plot.png'

      # Set plot style and options
      set style fill transparent solid 0.5 noborder
      set boxwidth 0.05 relative
      set style data points
      set title ''

      # Create plot
      plot '${gasDataFileName}' using 1:1

      # Save the plot
      set output
    `;
    fs.writeFileSync(gnuplotScriptFilePath, gnuplotScriptContent);

    // Execute gnuplot to generate the violin plot
    const command = `gnuplot ${gnuplotScriptFilePath}`;
    execSync(command);

    // Perform assertions and analysis based on the generated violin plot
    const gasStats = getGasStatistics(gasData); // Function to calculate gas statistics (mean, median, etc.)
    expect(gasStats.mean).to.be.below(100000, "Mean gas consumption should be below 100000");
    expect(gasStats.median).to.be.below(80000, "Median gas consumption should be below 80000");
  });
  */
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
