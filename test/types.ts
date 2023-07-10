// SPDX-License-Identifier: GPL-3.0-or-later
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

import type { Hashing } from "../types";
import type { BadReceiver } from "../types/contracts/BadReceiver";
import type { BiDirectionalChannel } from "../types/contracts/BiDirectionalChannel";
import type { Marketplace } from "../types/contracts/Marketplace";
import type { Product } from "../types/contracts/Product";

// Define the fixture type as a function that returns a promise of type T
type Fixture<T> = () => Promise<T>;

// Extend the Mocha Context interface to include the necessary properties for testing
declare module "mocha" {
  export interface Context {
    signers: Signers;
    marketplace: Marketplace;
    product: Product;
    bidirectionalchannel: BiDirectionalChannel;
    badReceiver: BadReceiver;
    hashing: Hashing;
    loadFixture: <T>(fixture: Fixture<T>) => Promise<T>;
  }
}

// Define the Signers interface to represent the different signer addresses
export interface Signers {
  admin: SignerWithAddress; // owner
  seller: SignerWithAddress;
  buyer: SignerWithAddress;
}
