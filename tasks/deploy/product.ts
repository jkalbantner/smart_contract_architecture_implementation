import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

import type { Product } from "../../types/contracts/Product";
import type { Product__factory } from "../../types/factories/contracts/Product__factory";

// TODO: remove addParam
task("deploy:Product").setAction(async function (taskArguments: TaskArguments, { ethers }) {
  const signers: SignerWithAddress[] = await ethers.getSigners();
  const admin: SignerWithAddress = signers[0]; // owner
  const seller: SignerWithAddress = signers[1];
  const buyer: SignerWithAddress = signers[2];

  //console.log(signers);

  const ONE_GWEI = 1_000_000_000;

  // Set up test parameters
  const productSeller = seller.address;
  const name = "Product 1";
  const price = ethers.utils.parseEther("0.5");
  const amount = ONE_GWEI;

  const productFactory = await ethers.getContractFactory("Product");
  // TODO: remove taskArguments.greeting
  // .connect(admin)
  const product = await productFactory.deploy(productSeller, name, price, { value: amount });

  await product.deployed();

  //console.log("Product deployed to: ", product.address);
});
