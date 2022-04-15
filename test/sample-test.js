const { expect } = require("chai");
const { ethers } = require("hardhat");
require("@nomiclabs/hardhat-waffle");

let nft;
let market;
let staking;

describe("NFT", function () {
  beforeEach(async () => {
    const NFT = await ethers.getContractFactory("NFT");
    const owner = await ethers.getSigners();
    nft = await NFT.deploy(
      "https://test.com",
      "0x96858Ea614c48Ff07caB52b7d2879676e6AD87cF",
      owner[8].address,
      25,
      owner[5].address
    );
    await nft.deployed();
  });

  it("Should deploy the contract and return the address", async function () {
    expect(nft.address).to.be.ok;
  });
  it("Should be able to mint one token", async () => {
    const owner = await ethers.getSigners();
    await nft.mint(owner[0].address);
    expect(await nft.balanceOf(owner[0].address, 1)).to.equal(
      1,
      "invalid final balance"
    );
  });
  it("Should be able to burn one token", async () => {
    const owner = await ethers.getSigners();
    await nft.mint(owner[0].address);
    expect(await nft.balanceOf(owner[0].address, 1)).to.equal(
      1,
      "invalid final balance"
    );

    nft.burn(1);
    expect(await nft.balanceOf(owner[0].address, 1)).to.equal(
      0,
      "Burn method failed"
    );
  });
});

describe("NFTMarket", function () {
  beforeEach(async () => {
    const owner = await ethers.getSigners();
    const NFTMarket = await ethers.getContractFactory("NFTMarket");
    market = await NFTMarket.deploy();
    await market.deployed();

    const NFT = await ethers.getContractFactory("NFT");
    nft = await NFT.deploy(
      "https://test.com",
      market.address,
      "0x96858Ea614c48Ff07caB52b7d2879676e6AD87cF",
      25,
      owner[5].address
    );
    await nft.deployed();
  });

  it("Should deploy the contract and return the address", async function () {
    expect(market.address).to.be.ok;
  });
  it("Should Be able to list my nft", async function () {
    const owner = await ethers.getSigners();
    await nft.mint(owner[0].address);
    await nft.setApprovalForAll(market.address, true);
    await market.ListNFT(nft.address, nft.address, 1, 10);
  });

  it("Should Be able to fetch all nfts", async function () {
    const owner = await ethers.getSigners();
    await nft.mint(owner[0].address);
    await nft.mint(owner[0].address);
    await nft.mint(owner[0].address);
    nft.setApprovalForAll(market.address, true);
    market.ListNFT(nft.address, nft.address, 1, 10);
    market.ListNFT(nft.address, nft.address, 3, 10);
    market.ListNFT(nft.address, nft.address, 2, 10);
    const collection = await market.fetchAllCollection();

    expect(collection.length).to.equal(3, "not all the items were fetched");
  });

  it("Should Be able to Buy one nft", async function () {
    const owner = await ethers.getSigners();
    await nft.mint(owner[0].address);
    await nft.mint(owner[0].address);
    await nft.mint(owner[0].address);
    nft.setApprovalForAll(market.address, true);
    market.ListNFT(nft.address, nft.address, 1, ethers.utils.parseEther("10"));
    market.ListNFT(nft.address, nft.address, 3, ethers.utils.parseEther("10"));
    market.ListNFT(nft.address, nft.address, 2, ethers.utils.parseEther("10"));
    const marketUser = market.connect(owner[1]);
    await marketUser.performATransaction(1, {
      value: ethers.utils.parseEther("10"),
    });
    collection = await market.fetchAllCollection();

    expect(collection.length).to.equal(2, "the item wasnt sold");
  });
  it("Should have the fee on the wallet", async function () {
    const owner = await ethers.getSigners();
    const _balance = await owner[5].getBalance();
    await nft.mint(owner[0].address);
    await nft.mint(owner[0].address);
    await nft.mint(owner[0].address);
    nft.setApprovalForAll(market.address, true);
    market.ListNFT(nft.address, nft.address, 1, ethers.utils.parseEther("100"));
    market.ListNFT(nft.address, nft.address, 3, ethers.utils.parseEther("10"));
    market.ListNFT(nft.address, nft.address, 2, ethers.utils.parseEther("10"));
    const marketUser = market.connect(owner[1]);
    await marketUser.performATransaction(1, {
      value: ethers.utils.parseEther("100"),
    });
    collection = await market.fetchAllCollection();

    expect(collection.length).to.equal(2, "the item wasnt sold");
    const balance = await owner[5].getBalance();
    const result = balance - _balance;
    const ether = ethers.utils.formatUnits(result.toString(), "ether");
    expect(parseFloat(ether)).to.be.above(2.4);
  });
});

describe("Staking smart contract", function () {
  beforeEach(async () => {
    const owner = await ethers.getSigners();
    const Staking = await ethers.getContractFactory("StakingRewards");
    staking = await Staking.deploy(600000);
    await staking.deployed();

    const NFT = await ethers.getContractFactory("NFT");
    nft = await NFT.deploy(
      "https://test.com",
      "0x96858Ea614c48Ff07caB52b7d2879676e6AD87cF",
      staking.address,
      25,
      owner[5].address
    );
    await nft.deployed();
  });

  it("Should deploy the contract and return the address", async function () {
    expect(market.address).to.be.ok;
  });
  it("Should be able to fill the contract", async function () {
    staking.fillPool({ value: 800000000000000 });
    const balance = await staking.balance();
    expect(balance).to.be.above(0);
  });
  it("Should be able to estimate the reward", async function () {
    const owner = await ethers.getSigners();
    const address = owner[0].address;
    await nft.mint(address);
    await staking.createStake(nft.address, 1);
    await staking.setReward(800000000000);
    await network.provider.send("evm_increaseTime", [36000000]);
    await network.provider.send("evm_mine");
    const est_reward = await staking.estimateReward(0);
    expect(est_reward).to.be.above(0);
  });
  it("Should be able to stake one NFT", async function () {
    const owner = await ethers.getSigners();
    const address = owner[0].address;
    await nft.mint(address);
    await staking.createStake(nft.address, 1);
    const userStakes = await staking.retrieveUserStakes(address);
    expect(userStakes).to.be.ok;
    try {
      await staking.createStake(nft.address, 4);
    } catch (err) {
      //shouldn't be able to stake a nft that it doesnt own yet.
      expect(err).to.be.ok;
    }
  });
  it("should be able to claim a stake", async function () {
    const owner = await ethers.getSigners();
    const address = owner[0].address;
    staking.fillPool({ value: 8000000 });
    const balance = await staking.balance();
    await nft.mint(address);
    await staking.createStake(nft.address, 1);
    await network.provider.send("evm_increaseTime", [360000]);
    await network.provider.send("evm_mine");
    await staking.claimStake(0);
    const _balance = await staking.balance();
    expect(_balance).to.be.below(balance);
  });
});
