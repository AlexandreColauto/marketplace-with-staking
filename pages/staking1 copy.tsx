import React, { useEffect, useState } from "react";
import useFetchMarket from "../src/hooks/useFetchMarket";
import { useMoralis } from "react-moralis";
import Moralis from "moralis/types";
import Image from "next/image";
import { useState, useEffect } from "react";
import { ethers, Signer } from "ethers";
import Web3Modal from "web3modal";
import DatePicker from "react-date-picker/dist/entry.nostyle";
import "react-date-picker/dist/DatePicker.css";
import "react-calendar/dist/Calendar.css";

const tokenAddrs = "0x47bB10F98034Ba0b06037601106b0793972816BD";
const stakeAddrs = "0xab0aE94237428DCF6aC3976EF08aB602a6a586B8";

import StakingRewards from "../artifacts/contracts/StakingRewards.sol/StakingRewards.json";
import Token from "../artifacts/contracts/Token.sol/Token.json";
import { func } from "prop-types";

export default fun Home() {
  const [userAddress, setUserAddress] = useState(null);
  const [signer, setsigner] = useState(null);
  const [userStakes, setUserStakes] = useState([]);
  const [userBalance, setUserBalance] = useState(0);
  const [amount, setAmount] = useState(0);
  const [value, onChange] = useState(new Date());
  const [allowed, setAllowed] = useState(false);
  const [createRate, setCreateRate] = useState(false);
  const [createReward, setCreateReward] = useState(false);

  useEffect(() => {
    initialize();
  }, []);

  async function initialize() {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();
    const userAddress = await signer.getAddress();
    const tokenContract = new ethers.Contract(tokenAddrs, Token.abi, signer);
    const userBalance = await tokenContract.balanceOf(userAddress);
    setUserAddress(userAddress);
    setUserBalance(userBalance);
    console.log("user Balance:" + userBalance);
    setsigner(signer);
    getStakes(userAddress, signer);
    isAllowed(userAddress,signer);
  }

  async function createStake() {
    const tokenContract = new ethers.Contract(tokenAddrs, Token.abi, signer);
    const stakeContract = new ethers.Contract(
      stakeAddrs,
      StakingRewards.abi,
      signer
    );

    let allowance = await tokenContract.allowance(userAddress, stakeAddrs);
    const amountWei = ethers.utils.parseEther(amount.toString());
    const isAllowed =
      parseInt(allowance.toString()) < parseInt(amountWei.toString());
    if (isAllowed) {
      let transaction = await tokenContract.approve(
        stakeAddrs,
        100000000000000000000000000000n
      );
      await transaction.wait();
    }
    const today = new Date();
    const days = Math.ceil((value - today) / (1000 * 60 * 60 * 24));

    if (days <= 0) alert("Stake for at least one day");
    if (amountWei <= 0) alert("Cannot stake 0");
    let transaction = await stakeContract.createStake(amountWei, days);
    await transaction.wait();
    getStakes(userAddress, signer);
  }

  function handleChange(e) {
    setAmount((v) => (e.target.validity.valid ? e.target.value : v));
    calculateReward(e.target.value,value);
  }

  async function getStakes(_userAddress, _signer) {
    const stakeContract = new ethers.Contract(
      stakeAddrs,
      StakingRewards.abi,
      _signer
    );
    const userStakes = await stakeContract.retrieveUserStakes(_userAddress);
    const stakesArray = [];
    await Promise.all(userStakes.map(async (stake) => {
      if (!stake.active) return;
      const _stake = {
        _createdDate: stake.createdDate.toString(),
        _endDate: stake.endDate.toString(),
        amount: ethers.utils.formatEther(stake.amount.toString()),
        stakeId: stake.stakeId.toString(),
      };
      let _dateString = new Date(
        parseInt(_stake._createdDate) * 1000
      ).toLocaleDateString();
      _stake.createdDate = _dateString;
      _dateString = new Date(
        parseInt(_stake._endDate) * 1000
      ).toLocaleDateString();
      _stake.endDate = _dateString;

      const stakeLength = (_stake._endDate - _stake._createdDate) * 1000;
      const elapsed = Date.now() - _stake._createdDate * 1000;
      let progress;
      if (elapsed < stakeLength) {
        progress = elapsed / stakeLength;
      }
      _stake.progress = Math.round(progress * 100) ;

      const year = 31536000000;
      const estmReward = ((_stake.amount * elapsed) / year) * 0.11;
      _stake.estmReward = estmReward;
      
      const burnAmount = _stake.amount * (1 - progress);
      _stake.burnAmount = burnAmount;
      const stakeAmount = parseInt(ethers.utils.formatUnits(stake.amount,'ether'))
      const rate =  await stakeContract.rateCorrection(stakeLength/1000,stakeAmount)
      const expecReward = ((_stake.amount * stakeLength) / year) * rate/10000;
      console.log(stakeLength)
      console.log(year)
      console.log(rate.toString())
      console.log(expecReward)
      const apr = expecReward/_stake.amount;
      
      _stake.expecReward = expecReward;
      _stake.apr = rate.toNumber()/100;

      stakesArray.push(_stake);
    }));
    setUserStakes(stakesArray);
  }

  async function claim(index) {
    const stakeContract = new ethers.Contract(
      stakeAddrs,
      StakingRewards.abi,
      signer
    );

    let transaction = await stakeContract.claimStake(index);
    await transaction.wait();
  }

  async function getFunds() {
    const tokenContract = new ethers.Contract(tokenAddrs, Token.abi, signer);

    let transaction = await tokenContract.sendToContract(userAddress);
    await transaction.wait();
  }

  async function isAllowed(userAddress,signer) {
    const tokenContract = new ethers.Contract(tokenAddrs, Token.abi, signer);
    let allowance = await tokenContract.allowance(userAddress, stakeAddrs);
    const _allowed =
      parseInt(allowance.toString()) < 10000;
    if (_allowed) {
      setAllowed(false)
    } else {
      setAllowed(true)
    }
    
  }

  async function setAllowance() {
    const tokenContract = new ethers.Contract(tokenAddrs, Token.abi, signer)
    let transaction = await tokenContract.approve(
      stakeAddrs,
      100000000000000000000000000000n
    )
    await transaction.wait()
    setAllowed(true)

  }

  function setMaxAmount() {
    setAmount(ethers.utils.formatEther(userBalance));
  }

  async function calculateReward(amount,value) {

    console.log(amount);
    const today = new Date();
    const days = Math.ceil((value - today) / (1000));
    const stakeContract = new ethers.Contract(
      stakeAddrs,
      StakingRewards.abi,
      signer
      );
    const rate =  await stakeContract.rateCorrection(days>0?days:1000,amount?amount:1);
    const year = days/(60*60*24*365);
    const estReward = rate/10000 * year * amount;
    setCreateRate(rate/100);
    const reward = (estReward>0.01?estReward:0).toFixed(2)
    setCreateReward(reward);
  }

  function setDate(e) {
    onChange(e);
    calculateReward(amount,e);
  }
  return (
    <div>
      <br />
      <button onClick={() => getFunds()}>Get Funds</button>
      <br />
      <br />
      <br />
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          border: "2px solid",
          margin: "0 50px",
        }}
      >
        <div>
          <br />
          <br />
          <label>
            Days:
            <br />

            <DatePicker  onChange={(e)=>{setDate(e)}} value={value} />
          </label>
          <br />
          <br />
          <label>
            Amount:
            <br />
            <input
              style={{ width: "157px" }}
              type="text"
              pattern="[0-9]*"
              value={amount}
              onChange={(e) => handleChange(e)}
            >
            </input>
              <span><button onClick={()=>setMaxAmount()}>Max</button></span>
          </label>
          <br />
          <br />
          <div>
          <div style={{ padding: "15px", border: "2px solid" }}>
            Estimated APR:
            <br />
            <div>{createRate}%</div>
          </div>
          <div style={{ padding: "15px", border: "2px solid" }}>
            Estimated Reward:
            <br />
            <div>{createReward}</div>
          </div>
          <br />
          </div>
          <br />
          <div> 
            {
              allowed ? (
                <button style={{ width: "157px" }} onClick={() => createStake()}>
                  Create Stake
                </button>    
              ) : (
                <button style={{ width: "157px" }} onClick={() => setAllowance()}>
                  Enable
                </button>
              )

            }
            
          </div>
          <br />
          <br />
          <br />
        </div>
        <br />
        <br />
        <br />
      </div>
      <br />
      <h2 style={{ textAlign: "center" }}>User Stakes:</h2>
      <hr />
      <div>
        {userStakes.length
          ? userStakes.map((stake, i) => (
              <div key={i}>
                <div
                  style={{
                    marginLeft: "50px",
                    display: "flex",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ padding: "15px", border: "2px solid" }}>
                    Created Date:
                    <br />
                    <div>{stake.createdDate}</div>
                  </div>
                  <div style={{ padding: "15px", border: "2px solid" }}>
                    End Date:
                    <br />
                    <div>{stake.endDate}</div>
                  </div>
                  <div style={{ padding: "15px", border: "2px solid" }}>
                    Amount Staked:
                    <br />
                    <div>{stake.amount}</div>
                  </div>
                  <div style={{ padding: "15px", border: "2px solid" }}>
                    Stake Id:
                    <br />
                    <div>{stake.stakeId}</div>
                  </div>
                  <br />
                  <div style={{ padding: "15px", border: "2px solid" }}>
                    Progress:
                    <br />
                    <div>{stake.progress} %</div>
                  </div>
                  <br />
                  <div style={{ padding: "15px", border: "2px solid" }}>
                    Current Reward:
                    <br />
                    <div>{stake.estmReward.toFixed(2)}</div>
                  </div>
                  <br />
                  <div style={{ padding: "15px", border: "2px solid" }}>
                    Reward at maturity:
                    <br />
                    <div>{stake.expecReward.toFixed(2)}</div>
                  </div>
                  <br />
                  <div style={{ padding: "15px", border: "2px solid" }}>
                    APR at maturity:
                    <br />
                    <div>{stake.apr}%</div>
                  </div>
                  <br />
                  <div style={{ padding: "15px", border: "2px solid" }}>
                    Early claim burn amount:
                    <br />
                    <div>{stake.burnAmount.toFixed(2)}</div>
                  </div>
                  <br />
                  <br />
                  <br />
                </div>
                <br />
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <button
                    style={{ width: "500px" }}
                    onClick={() => claim(stake.stakeId)}
                  >
                    Claim
                  </button>
                </div>
                <br />
                <hr />
              </div>
            ))
          : null}
      </div>
    </div>
  );
}
