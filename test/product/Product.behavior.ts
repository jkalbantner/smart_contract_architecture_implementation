// SPDX-License-Identifier: GPL-3.0-or-later
import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";

/**
@dev Represents the behavior of a product in the marketplace.
*/

export function shouldBehaveLikeProduct(): void {
  const fs = require("fs");

  /**
  @test Test the purchase of a product by a buyer.
  */
  it("should allow a buyer to purchase a product", async function () {
    const seller = this.signers.seller;
    const buyer = this.signers.buyer;

    // Set the product price and make the product available
    const price = ethers.utils.parseEther("0.5");
    await this.product.connect(seller).setPrice(price); // Connect as the seller to set the price
    await this.product.connect(seller).setAvailable(true); // Also connect as the seller to make the product available

    // check initial balance of seller
    const initialSellerBalance = await ethers.provider.getBalance(seller.address);

    // check balance of buyer
    //console.log("Buyer balance: " + (await ethers.provider.getBalance(buyer.address)));

    // Send enough ether from the buyer's address to the contract's address
    const amount = ethers.utils.parseEther("1");
    await buyer.sendTransaction({ to: this.product.address, value: amount });

    //console.log("Seller balance after: " + (await ethers.provider.getBalance(seller.address)));

    // Call the `buy` function from the buyer's address
    const tx = await this.product.connect(buyer).buy({ value: price });

    // Check that the `BuyEvent` event was emitted with the correct values
    await expect(tx).to.emit(this.product, "BuyEvent").withArgs(buyer.address, price);

    // Check that the product is no longer available
    const isAvailable = await this.product.isAvailable();
    expect(isAvailable).to.equal(false);

    // Check that the seller received the correct amount of ether
    const finalSellerBalance = await ethers.provider.getBalance(seller.address);
    expect(finalSellerBalance).to.equal(initialSellerBalance.add(price));
  });

  /**
  @test Test that the purchase reverts if the buyer sends less than the product price.
  */
  it("should revert if the buyer sends less than the product price", async function () {
    const seller = this.signers.seller;
    const buyer = this.signers.buyer;

    // Set the product price and make the product available
    const price = ethers.utils.parseEther("1");
    await this.product.connect(seller).setPrice(price); // Connect as the seller to set the price
    await this.product.connect(seller).setAvailable(true); // Also connect as the seller to make the product available

    // Call the `buy` function from the buyer's address with less ether than the product price
    await expect(this.product.connect(buyer).buy({ value: BigNumber.from(price).sub(1) })).to.be.revertedWith(
      "The ETH amount sent is less than the product price.",
    );

    // Check that the product is still available
    const isAvailable = await this.product.isAvailable();
    expect(isAvailable).to.equal(true);
  });

  /**
  @test Test that the purchase reverts if the seller address is invalid.
  */
  it("should revert if the seller address is invalid", async function () {
    const seller = this.signers.seller;
    const buyer = this.signers.buyer;

    // Set the product price and make the product available
    const price = ethers.utils.parseEther("1");
    await this.product.connect(seller).setPrice(price); // Connect as the seller to set the price
    await this.product.connect(seller).setAvailable(true); // Also connect as the seller to make the product available

    const zeroAddress = ethers.constants.AddressZero;
    await this.product.connect(seller).setOwner(zeroAddress); // Change the owner to the zero address

    await expect(this.product.connect(buyer).buy({ value: price })).to.be.revertedWith("Invalid address"); // Expect the buy operation to fail

    // Check that the product is still available
    const isAvailable = await this.product.isAvailable();
    expect(isAvailable).to.equal(true);
  });

  /**
  @test Test that the purchase reverts if the product is not available.
  */
  it("should revert if the product is not available", async function () {
    const seller = this.signers.seller;
    const buyer = this.signers.buyer;

    // Set the product price and make the product unavailable
    const price = ethers.utils.parseEther("1");
    await this.product.connect(seller).setPrice(price); // Connect as the seller to set the price
    await this.product.connect(seller).setAvailable(false); // Also connect as the seller to make the product available

    // Call the `buy` function from the buyer's address
    await expect(this.product.connect(buyer).buy({ value: price })).to.be.revertedWith("Error: Product not available");

    // Check that the product is still unavailable
    const isAvailable = await this.product.isAvailable();
    expect(isAvailable).to.equal(false);
  });

  /**
  @test Test that the purchase reverts if the seller fails to receive the ether.
  */
  it("should revert if the seller fails to receive the ether", async function () {
    const seller = this.signers.seller;
    const buyer = this.signers.buyer;
    const badReceiver = this.badReceiver;

    // Set the product price and make the product available
    const price = ethers.utils.parseEther("1");
    await this.product.connect(seller).setPrice(price); // Connect as the seller to set the price
    await this.product.connect(seller).setAvailable(true); // Also connect as the seller to make the product available

    // Deploy a BadReceiver and set it as the product owner
    await this.product.connect(seller).setOwner(badReceiver.address);
    const productOwner = await this.product.owner();
    await expect(productOwner).to.equal(badReceiver.address);

    // Call the `buy` function from the buyer's address
    await expect(this.product.connect(buyer).buy({ value: price })).to.be.revertedWith("Transaction failed");

    // Check that the product is still available
    const isAvailable = await this.product.isAvailable();
    expect(isAvailable).to.equal(true);
  });

  /**
  @test Test the update of product details by the owner.
  */
  it("should update the product details when called by the owner", async function () {
    const seller = this.signers.seller;
    const buyer = this.signers.buyer;
    const admin = this.signers.admin;

    // Set the initial product name and price
    const initialName = "Product 1";
    const initialPrice = ethers.utils.parseEther("1");
    await this.product.connect(seller).setPrice(initialPrice); // Connect as the seller to set the price
    await this.product.connect(seller).setAvailable(true); // Also connect as the seller to make the product available
    await this.product.connect(seller).setName(initialName);

    // Update the product details
    const newName = "Product 2";
    const newPrice = ethers.utils.parseEther("2");
    await expect(this.product.connect(seller).update(newName, newPrice))
      .to.emit(this.product, "UpdateEvent")
      .withArgs(newName, newPrice);

    // Check that the product details have been updated
    const name = await this.product.connect(seller).name();
    const price = await this.product.connect(seller).price();
    expect(name).to.equal(newName);
    expect(price).to.equal(newPrice);
  });

  /**
  @test Test that the update reverts if called by a non-owner.
  */
  it("should revert if called by a non-owner", async function () {
    const seller = this.signers.seller;
    const buyer = this.signers.buyer;

    // Call the `update` function from a non-owner address
    await expect(this.product.connect(buyer).update("Product 2", ethers.utils.parseEther("2"))).to.be.revertedWith(
      "Only the contract owner can call this function",
    );

    // Check that the product details have not been updated
    const name = await this.product.name();
    const price = await this.product.price();
    expect(name).to.not.equal("Product 2");
    expect(price).to.not.equal(ethers.utils.parseEther("2"));
  });

  /**
  @test Test that the update reverts if the product is not available for update.
  */
  it("should revert if the product is not available for update", async function () {
    const seller = this.signers.seller;
    const buyer = this.signers.buyer;
    const admin = this.signers.admin;

    // Set the product price and make the product unavailable
    const price = ethers.utils.parseEther("1");
    await this.product.connect(seller).setPrice(price); // Connect as the seller to set the price
    await this.product.connect(seller).setAvailable(false); // Also connect as the seller to make the product unavailable

    // Call the `update` function from the owner address
    await expect(this.product.connect(seller).update("Product 2", ethers.utils.parseEther("2"))).to.be.revertedWith(
      "Product is not available for update",
    );

    // Check that the product details have not been updated
    const name = await this.product.name();
    const newPrice = await this.product.price();
    expect(name).to.equal("Product 1");
    expect(newPrice).to.equal(price);
  });

  /**
  @test Test that the update reverts if the price is not positive.
  */
  it("should revert if the price is not positive", async function () {
    const seller = this.signers.seller;
    const buyer = this.signers.buyer;
    const admin = this.signers.admin;

    // Set the product price and make the product available
    const price = ethers.utils.parseEther("1");
    await this.product.connect(seller).setPrice(price); // Connect as the seller to set the price
    await this.product.connect(seller).setAvailable(true); // Also connect as the seller to make the product available

    // Call the `update` function from the owner address with a non-positive price
    await expect(this.product.connect(seller).update("Product 2", ethers.utils.parseEther("0"))).to.be.revertedWith(
      "Price must be a positive value",
    );

    // Check that the product details have not been updated
    const name = await this.product.name();
    const newPrice = await this.product.price();
    expect(name).to.equal("Product 1");
    expect(newPrice).to.equal(price);
  });

  it("should measure execution time and gas cost for critical functions", async function () {
    // Define the required variables inside the test case
    const seller = this.signers.seller;
    const buyer = this.signers.buyer;
    const admin = this.signers.admin;

    const amountToSend = ethers.utils.parseEther("1"); // Modify this to the price of a valid product in your contract
    const newName = "Product B";
    const newPrice = ethers.utils.parseEther("0.5"); // Modify this to a new price

    console.log("Product Contract");

    // Send enough ether from the buyer's address to the contract's address
    await buyer.sendTransaction({ to: this.product.address, value: amountToSend });

    // Buy product
    const buyProductStartTime = Date.now();
    const buyProductTx = await this.product.connect(buyer).buy({ value: amountToSend });
    const buyProductEndTime = Date.now();
    const buyProductExecutionTime = buyProductEndTime - buyProductStartTime;
    const buyProductGasUsed = (await buyProductTx.wait()).gasUsed.toNumber();

    console.log("Buy Product Execution Time:", buyProductExecutionTime, "ms");
    console.log("Buy Product Gas Used:", buyProductGasUsed);

    // Set product available
    const setAvailableStartTime = Date.now();
    const setAvailableTx = await this.product.connect(seller).setAvailable(true);
    const setAvailableEndTime = Date.now();
    const setAvailableExecutionTime = setAvailableEndTime - setAvailableStartTime;
    const setAvailableGasUsed = (await setAvailableTx.wait()).gasUsed.toNumber();

    console.log("Set Available Execution Time:", setAvailableExecutionTime, "ms");
    console.log("Set Available Gas Used:", setAvailableGasUsed);

    // Set product price
    const setPriceStartTime = Date.now();
    const setPriceTx = await this.product.connect(seller).setPrice(newPrice);
    const setPriceEndTime = Date.now();
    const setPriceExecutionTime = setPriceEndTime - setPriceStartTime;
    const setPriceGasUsed = (await setPriceTx.wait()).gasUsed.toNumber();

    console.log("Set Price Execution Time:", setPriceExecutionTime, "ms");
    console.log("Set Price Gas Used:", setPriceGasUsed);

    // Set product name
    const setNameStartTime = Date.now();
    const setNameTx = await this.product.connect(seller).setName(newName);
    const setNameEndTime = Date.now();
    const setNameExecutionTime = setNameEndTime - setNameStartTime;
    const setNameGasUsed = (await setNameTx.wait()).gasUsed.toNumber();

    console.log("Set Name Execution Time:", setNameExecutionTime, "ms");
    console.log("Set Name Gas Used:", setNameGasUsed);

    // Update product
    const updateStartTime = Date.now();
    const updateTx = await this.product.connect(seller).update(newName, newPrice);
    const updateEndTime = Date.now();
    const updateExecutionTime = updateEndTime - updateStartTime;
    const updateGasUsed = (await updateTx.wait()).gasUsed.toNumber();

    console.log("Update Product Execution Time:", updateExecutionTime, "ms");
    console.log("Update Product Gas Used:", updateGasUsed);

    // Set product owner
    const setOwnerStartTime = Date.now();
    const setOwnerTx = await this.product.connect(seller).setOwner(buyer.address);
    const setOwnerEndTime = Date.now();
    const setOwnerExecutionTime = setOwnerEndTime - setOwnerStartTime;
    const setOwnerGasUsed = (await setOwnerTx.wait()).gasUsed.toNumber();

    console.log("Set Owner Execution Time:", setOwnerExecutionTime, "ms");
    console.log("Set Owner Gas Used:", setOwnerGasUsed);
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

      const amountToSend = ethers.utils.parseEther("1"); // Modify this to the price of a valid product in your contract
      const newName = "Product B";
      const newPrice = ethers.utils.parseEther("0.5"); // Modify this to a new price

      console.log("Product Contract");

      // Send enough ether from the buyer's address to the contract's address
      await buyer.sendTransaction({ to: this.product.address, value: amountToSend });

      // Buy product
      const buyProductStartTime = Date.now();
      const buyProductTx = await this.product.connect(buyer).buy({ value: amountToSend });
      const buyProductEndTime = Date.now();
      const buyProductExecutionTime = buyProductEndTime - buyProductStartTime;
      const buyProductGasUsed = (await buyProductTx.wait()).gasUsed.toNumber();

      // Set product available
      const setAvailableStartTime = Date.now();
      const setAvailableTx = await this.product.connect(seller).setAvailable(true);
      const setAvailableEndTime = Date.now();
      const setAvailableExecutionTime = setAvailableEndTime - setAvailableStartTime;
      const setAvailableGasUsed = (await setAvailableTx.wait()).gasUsed.toNumber();

      // Set product price
      const setPriceStartTime = Date.now();
      const setPriceTx = await this.product.connect(seller).setPrice(newPrice);
      const setPriceEndTime = Date.now();
      const setPriceExecutionTime = setPriceEndTime - setPriceStartTime;
      const setPriceGasUsed = (await setPriceTx.wait()).gasUsed.toNumber();

      // Set product name
      const setNameStartTime = Date.now();
      const setNameTx = await this.product.connect(seller).setName(newName);
      const setNameEndTime = Date.now();
      const setNameExecutionTime = setNameEndTime - setNameStartTime;
      const setNameGasUsed = (await setNameTx.wait()).gasUsed.toNumber();

      // Update product
      const updateStartTime = Date.now();
      const updateTx = await this.product.connect(seller).update(newName, newPrice);
      const updateEndTime = Date.now();
      const updateExecutionTime = updateEndTime - updateStartTime;
      const updateGasUsed = (await updateTx.wait()).gasUsed.toNumber();

      // Set product owner
      const setOwnerStartTime = Date.now();
      const setOwnerTx = await this.product.connect(seller).setOwner(buyer.address);
      const setOwnerEndTime = Date.now();
      const setOwnerExecutionTime = setOwnerEndTime - setOwnerStartTime;
      const setOwnerGasUsed = (await setOwnerTx.wait()).gasUsed.toNumber();

      // After each action, write the execution time and gas used to a file.
      const folder = "./test/statistics/";

      if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder);
      }

      const name = "product_test";
      fs.appendFileSync(folder + name + "_buy_execution_time.txt", `${buyProductExecutionTime}\n`);
      fs.appendFileSync(folder + name + "_buy_product_gas_used.txt", `${buyProductGasUsed}\n`);
      fs.appendFileSync(folder + name + "_available_execution_time.txt", `${setAvailableExecutionTime}\n`);
      fs.appendFileSync(folder + name + "_available_gas_used.txt", `${setAvailableGasUsed}\n`);
      fs.appendFileSync(folder + name + "_price_execution_time.txt", `${setPriceExecutionTime}\n`);
      fs.appendFileSync(folder + name + "_price_gas_used.txt", `${setPriceGasUsed}\n`);
      fs.appendFileSync(folder + name + "_name_execution_time.txt", `${setNameExecutionTime}\n`);
      fs.appendFileSync(folder + name + "_name_gas_used.txt", `${setNameGasUsed}\n`);
      fs.appendFileSync(folder + name + "_update_product_execution_time.txt", `${updateExecutionTime}\n`);
      fs.appendFileSync(folder + name + "_update_product_gas_used.txt", `${updateGasUsed}\n`);
      fs.appendFileSync(folder + name + "_owner_execution_time.txt", `${setOwnerExecutionTime}\n`);
      fs.appendFileSync(folder + name + "_owner_gas_used.txt", `${setOwnerGasUsed}\n`);
    });
  }
}
