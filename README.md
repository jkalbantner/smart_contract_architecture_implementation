## README

License: CC-BY-4.0

This repository contains the Solidity code for the article: J. Kalbantner et al., "A DLT-based Smart Contract Architecture for Atomic and Scalable Trading: A Smart Grid Use-Case". Complete list of authors: J. Kalbantner, K. Markantonakis, D. Hurley-Smith, C. Shepherd, and B. Semal

The implementation includes three main contracts (Marketplace, Product, BiDirectionalChannel) which implement the logic needed for a test-driven evaluation:
- With the marketplace contract a product can be created
- The product contract is then used to create a BiDirectionalChannel (a state channel used for trading)
- One can also directly create a state channel by calling the BiDirectionalChannel contract

For greater detail regarding the test-driven evaluation we would like to refer to the article mentioned above.

Also see the scyther evaluation which can be found [here](https://github.com/jkalbantner/smart_contract_architecture_scyther).

## Usage

### Pre Requisites

Before being able to run any command, you need to create a `.env` file and set a BIP-39 compatible mnemonic as an
environment variable (see the hardhat configuriation file). You can follow the example in `.env.example`. If you don't already have a mnemonic, you can use
this [website](https://iancoleman.io/bip39/) to generate one.

Then, proceed with installing dependencies:

```sh
$ yarn install
```

### Compile

Compile the smart contracts with Hardhat:

```sh
$ yarn compile
```

### TypeChain

Compile the smart contracts and generate TypeChain bindings:

```sh
$ yarn typechain
```

### Test

Run the tests with Hardhat:

```sh
$ yarn test
```

### Coverage

Generate the code coverage report:

```sh
$ yarn coverage
```

### Report Gas

See the gas usage per unit test and average gas per method call:

```sh
$ REPORT_GAS=true yarn test
```

### Clean

Delete the smart contract artifacts, the coverage reports and the Hardhat cache:

```sh
$ yarn clean
```

### Deploy

Deploy the contracts to Hardhat Network:

```sh
$ yarn deploy
```

There are three contracts available which can be deployed:

- Marketplace
- Product
- BiDirectionalChannel

```sh
$ deploy:market
$ deploy:product
$ deploy:bi
```

Furthermore you can deploy the index.ts file

```sh
$ deploy:index
```

### Experimental results

The experiments have been conducted using hardhat tests which can be found within ./test/. For the most important functions gas prices and times have been calculated iteratively (by looping over the code 1000 times). All results can be found within ./test/statistics. With the python code "./test/statistic/statistic_calc.py" we calculated the mean, median, variance and standard deviation. Results can be found int the document ./test/statistic_calc_results.md


### Execute Python tests

```sh
$ python3 test/statistic_calc.py
```

