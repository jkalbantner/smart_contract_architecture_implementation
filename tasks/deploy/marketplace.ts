import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

import type { Marketplace } from "../../types/contracts/Marketplace";
import type { Marketplace__factory } from "../../types/factories/contracts/Marketplace__factory";

// TODO: remove greeting
task("deploy:Marketplace").setAction(async function (taskArguments: TaskArguments, { ethers }) {
  const signers = await ethers.getSigners();
  const admin = signers[0];
  const seller = signers[1];
  const buyer = signers[2];

  const ONE_GWEI = 1_000_000_000;

  // Set up test parameters
  const amount = ONE_GWEI;

  const marketplaceFactory = await ethers.getContractFactory("Marketplace");
  // TODO: remove taskArguments.greeting
  // .connect(admin)
  const marketplace = await marketplaceFactory.deploy({ value: amount });

  await marketplace.deployed();

  //console.log("Marketplace deployed to: ", marketplace.address);
});
