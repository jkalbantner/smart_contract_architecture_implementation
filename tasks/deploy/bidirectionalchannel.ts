import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

import type { BiDirectionalChannel } from "../../types/contracts/BiDirectionalChannel";
import type { BiDirectionalChannel__factory } from "../../types/factories/contracts/BiDirectionalChannel__factory";

// TODO: addParam
task("deploy:BiDirectionalChannel").setAction(async function (taskArguments: TaskArguments, { ethers }) {
  const signers = await ethers.getSigners();
  const admin = signers[0];
  const seller = signers[1];
  const buyer = signers[2];

  const ONE_GWEI = 1_000_000_000;

  // Set up test parameters
  const users = [seller.address, buyer.address];
  const balances = [ethers.utils.parseEther("1"), ethers.utils.parseEther("2")];
  const expiresAt = Math.floor(Date.now() / 1000) + 3600;
  const challengePeriod = 600;
  const amount = ONE_GWEI;

  const bidirectionalchannelFactory = await ethers.getContractFactory("BiDirectionalChannel");

  // TODO: remove taskArguments.greeting
  // .connect(admin)
  const bidirectionalchannel = await bidirectionalchannelFactory.deploy(users, balances, expiresAt, challengePeriod, {
    value: amount,
  });
  await bidirectionalchannel.deployed();

  //console.log("BiDirectionalChannel deployed to: ", bidirectionalchannel.address);
});
