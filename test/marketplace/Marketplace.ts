// SPDX-License-Identifier: GPL-3.0-or-later
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ethers } from "hardhat";

import type { Signers } from "../types";
import { shouldBehaveLikeMarketplace } from "./Marketplace.behavior";
import { deployMarketplaceFixture } from "./Marketplace.fixture";

const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");

describe("Unit tests", function () {
  before(async function () {
    this.signers = {} as Signers;

    const signers: SignerWithAddress[] = await ethers.getSigners();
    this.signers.admin = signers[0];
    this.signers.seller = signers[1];
    this.signers.buyer = signers[2];

    this.loadFixture = loadFixture;
  });

  describe("Marketplace", function () {
    beforeEach(async function () {
      const { marketplace } = await this.loadFixture(deployMarketplaceFixture);
      this.marketplace = marketplace;
    });

    shouldBehaveLikeMarketplace();
  });
});
