// SPDX-License-Identifier: GPL-3.0-or-later
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";

import type { Signers } from "../types";
import { shouldBehaveLikeBiDirectionalChannel } from "./BiDirectionalChannel.behavior";
import { deployBiDirectionalChannelFixture } from "./BiDirectionalChannel.fixture";

/**
Unit tests for the BiDirectionalChannel contract.
*/
describe("Unit tests", function () {
  before(async function () {
    this.signers = {} as Signers;

    const signers = await ethers.getSigners();
    this.signers.seller = signers[0];
    this.signers.buyer = signers[1];

    this.loadFixture = loadFixture;
  });

  describe("BiDirectionalChannel", function () {
    beforeEach(async function () {
      const { bidirectionalchannel, bidirectionalchannelFactory } = await this.loadFixture(
        deployBiDirectionalChannelFixture,
      );
      this.bidirectionalchannel = bidirectionalchannel;
      this.bidirectionalchannelFactory = bidirectionalchannelFactory;
    });

    shouldBehaveLikeBiDirectionalChannel();
  });
});
