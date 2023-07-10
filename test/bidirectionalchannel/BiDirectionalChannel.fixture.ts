// SPDX-License-Identifier: GPL-3.0-or-later
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ethers } from "hardhat";

import type { BiDirectionalChannel } from "../../types/contracts/BiDirectionalChannel";
import { BiDirectionalChannel__factory } from "../../types/factories/contracts/BiDirectionalChannel__factory";

const { BigNumber } = require("ethers");

/**
Deploys the BiDirectionalChannel contract for testing purposes.
@returns An object containing the deployed contract instance and its factory.
*/
export async function deployBiDirectionalChannelFixture() {
  const signers = await ethers.getSigners();
  const seller = signers[0];
  const buyer = signers[1];
  const admin = signers[2];
  const ONE_GWEI = 1_000_000_000;
  const ONE_ETH = 1_000_000_000_000_000_000;
  const ETH = 1000000000000000000;

  // Set up test parameters
  const users = [seller.address, buyer.address];
  const balances = [ethers.utils.parseEther("1"), ethers.utils.parseEther("1")];
  const expiresAt = Math.floor(Date.now() / 1000) + 3600;
  const challengePeriod = 600;
  const amount = ONE_ETH;

  let sellerBal = ethers.utils.parseEther("50");
  let buyerBal = ethers.utils.parseEther("0");
  const endDate: number = new Date().setDate(new Date().getDate());
  const period: number = 86400 * 5; // 5 days
  const provider = ethers.provider;

  const bidirectionalchannelFactory = await ethers.getContractFactory("BiDirectionalChannel");
  const bidirectionalchannel = await bidirectionalchannelFactory.deploy(
    [seller.address, buyer.address],
    [sellerBal, buyerBal],
    endDate,
    period,
    {
      value: sellerBal.add(buyerBal),
    },
  );

  await bidirectionalchannel.deployed();

  //console.log("signer seller: " + seller.address);
  //console.log("signer buyer: " + buyer.address);
  //console.log("bidirectionalchannel address: " + bidirectionalchannel.address);

  return { bidirectionalchannel, bidirectionalchannelFactory };
}
