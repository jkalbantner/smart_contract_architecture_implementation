// SPDX-License-Identifier: GPL-3.0-or-later
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ethers } from "hardhat";

import type { Product } from "../../types/contracts/Product";
import type { Product__factory } from "../../types/factories/contracts/Product__factory";

export async function deployProductFixture() {
  const signers: SignerWithAddress[] = await ethers.getSigners();
  const admin: SignerWithAddress = signers[0]; // owner
  const seller: SignerWithAddress = signers[1];
  const buyer: SignerWithAddress = signers[2];

  // Log the signers for debugging purposes
  //console.log(signers);

  const ONE_GWEI = 1_000_000_000;

  // Set up test parameters
  const productSeller = seller.address;
  const name = "Product 1";
  const price = ethers.utils.parseEther("0.5");
  const amount = ethers.utils.parseEther("0.5");

  // Deploy the Product contract
  const productFactory = await ethers.getContractFactory("Product");
  const product = await productFactory.deploy(productSeller, name, price, { value: amount });
  await product.deployed();

  //console.log("Product contract deployed at: ", await product.address);

  // Deploy the BadReceiver contract
  const badReceiverFactory = await ethers.getContractFactory("BadReceiver");
  const badReceiver = await badReceiverFactory.deploy();
  await badReceiver.deployed();

  //console.log("BadReceiver contract deployed at: ", await badReceiver.address);

  // Return the deployed contracts for testing purposes
  return { product, badReceiver };
}
