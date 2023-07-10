// SPDX-License-Identifier: GPL-3.0-or-later
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ethers } from "hardhat";

import type { Marketplace } from "../../types/contracts/Marketplace";
import type { Marketplace__factory } from "../../types/factories/contracts/Marketplace__factory";

/**
 * Deploys the Marketplace contract for testing purposes.
 * @returns An object containing the deployed contract instance.
 */
export async function deployMarketplaceFixture() {
  const signers: SignerWithAddress[] = await ethers.getSigners();
  const admin: SignerWithAddress = signers[0];
  const seller: SignerWithAddress = signers[1];
  const buyer: SignerWithAddress = signers[2];

  const ONE_GWEI = 1_000_000_000;

  // Set up test parameters
  const amount = ethers.utils.parseEther("1");

  const marketplaceFactory = await ethers.getContractFactory("Marketplace");
  const marketplace = await marketplaceFactory.connect(seller).deploy({ value: amount });

  await marketplace.deployed();

  return { marketplace };
}
