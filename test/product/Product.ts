// SPDX-License-Identifier: GPL-3.0-or-later
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ethers } from "hardhat";

import type { Signers } from "../types";
import { shouldBehaveLikeProduct } from "./Product.behavior";
import { deployProductFixture } from "./Product.fixture";

describe("Unit tests", function () {
  before(async function () {
    this.signers = {} as Signers;

    // Get the signers (admin, seller, buyer)
    const signers: SignerWithAddress[] = await ethers.getSigners();
    this.signers.admin = signers[0];
    this.signers.seller = signers[1];
    this.signers.buyer = signers[2];

    this.loadFixture = loadFixture;
  });

  describe("Product", function () {
    beforeEach(async function () {
      // Load the product fixture to deploy the contracts
      const { product, badReceiver } = await this.loadFixture(deployProductFixture);
      this.product = product;
      this.badReceiver = badReceiver;
    });

    // Run the shared behavior tests for the Product contract
    shouldBehaveLikeProduct();
  });
});
