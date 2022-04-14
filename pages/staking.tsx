import React, { useEffect, useState } from "react";
import Image from "next/image";
import { ethers, Signer } from "ethers";
import { useQuery } from "react-query";
import { useMoralis } from "react-moralis";
import Web3Modal from "web3modal";
import DatePicker from "react-date-picker/dist/entry.nostyle";
import "react-date-picker/dist/DatePicker.css";
import "react-calendar/dist/Calendar.css";

const tokenAddrs = "0x47bB10F98034Ba0b06037601106b0793972816BD";
const stakeAddrs = "0xab0aE94237428DCF6aC3976EF08aB602a6a586B8";

import StakingRewards from "../artifacts/contracts/StakingRewards.sol/StakingRewards.json";
import Token from "../artifacts/contracts/Token.sol/Token.json";



interface stake {
  stakeId: number?;
  amount: number;
  stakeOwnerAddress: string; 
  createdDate:number;
  endDate:number;
  active:boolean;
  progress?: number,
  estmReward?: number,
  burnAmount?: number,
  expecReward?: number,
  apr?: number,

}


function Staking() {
  const { Moralis, isWeb3Enabled, web3 } = useMoralis();
  const stake = async (props: stake) => {
        !isWeb3Enabled ? await Moralis.enableWeb3() : null;
    const userAddress = await Moralis.account;
    if (!userAddress) return;
    console.log(userAddress);
    const {stakeId, amount, stakeOwnerAddress, createdDate, endDate, active } = props;
  
  const [userStakes, setUserStakes] = useState<stake[]>();
  const [allowed, setAllowed] = useState(false);
  const web3Modal = new Web3Modal();
  const provider = web3;
  const signer = provider?.getSigner();
  const tokenContract = new ethers.Contract(tokenAddrs, Token.abi, signer);
  const balance = async () => {
    console.log(stakeOwnerAddress);
    return await tokenContract.balanceOf(stakeOwnerAddress);
  };
  const [value, onChange] = useState(new Date());
  const [createRate, setCreateRate] = useState<number>();
  const [createReward, setCreateReward] = useState<number>();
  const [reward, setReward] = useState<string>();


  async function getStakes(_userAddress:string , _signer: ethers.providers.Provider | ethers.Signer | undefined) {
    const stakeContract = new ethers.Contract(
      stakeAddrs,
      StakingRewards.abi,
      _signer
    );
    const userStakes = await stakeContract.retrieveUserStakes(_userAddress);
    const stakesArray : stake[]=[];
    await Promise.all(
      userStakes.map(async (props: stake) => {
        if (!props.active) return;
        const _stake = {
          stakeId: props.stakeId,
          amount: parseFloat(ethers.utils.formatEther(props.amount)),
          stakeOwnerAddress: props.stakeOwnerAddress,
          createdDate: parseInt(props.createdDate.toString()),
          endDate: parseInt(props.endDate.toString()),
          active:props.active,
          progress: 0,
          estmReward: 0,
          burnAmount: 0,
          expecReward: 0,
          apr: 0,
        };

        const _dateCreated = new Date(
          _stake.createdDate * 1000
        ).toLocaleDateString();
        _stake.createdDate = parseInt(_dateCreated);
        const _dateEnd = new Date(
          _stake.endDate* 1000
        ).toLocaleDateString();
        _stake.endDate = parseInt(_dateEnd);

        const stakeLength = (_stake.endDate - _stake.createdDate) * 1000;
        const elapsed = Date.now() - _stake.createdDate * 1000;
        let progress;
        if (elapsed < stakeLength) {
          progress = elapsed / stakeLength;
        }
        if (!progress) {return;}
        _stake.progress = Math.round(progress * 100);
        
        const year = 31536000000;
        const estmReward = ((_stake.amount * elapsed) / year) * 0.11;
        _stake.estmReward = estmReward;

        const burnAmount = _stake.amount * (1 - progress);
        _stake.burnAmount = burnAmount;
        const stakeAmount = parseInt(
          ethers.utils.formatUnits(props.amount, "ether")
        );
        const rate = await stakeContract.rateCorrection(
          stakeLength / 1000,
          stakeAmount
        );
        const expecReward =
          (((_stake.amount * stakeLength) / year) * rate) / 10000;
        console.log(stakeLength);
        console.log(year);
        console.log(rate.toString());
        console.log(expecReward);
        const apr = expecReward / _stake.amount;

        _stake.expecReward = expecReward;
        _stake.apr = rate.toNumber() / 100;

        stakesArray.push(_stake);
      })
    );
    setUserStakes(stakesArray);
  }

  async function createStake() {
    const tokenContract = new ethers.Contract(tokenAddrs, Token.abi, signer);
    const stakeContract = new ethers.Contract(
      stakeAddrs,
      StakingRewards.abi,
      signer
    );

    let allowance = await tokenContract.allowance(
      stakeOwnerAddress,
      stakeAddrs
    );
    const amountWei = ethers.utils.parseEther(balance.toString());
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
    const days = Math.ceil(
      parseInt(value.toString()) -
        parseInt(today.toString()) / (1000 * 60 * 60 * 24)
    );

    if (days <= 0) alert("Stake for at least one day");
    if (parseInt(amountWei.toString()) == 0) alert("Cannot stake 0");
    let transaction = await stakeContract.createStake(amountWei, days);
    await transaction.wait();
    getStakes(stakeOwnerAddress, signer);
  }
  function setDate(e: React.SetStateAction<Date>) {
    onChange(e);
    calculateReward(amount, e);
  }

  async function calculateReward(amount:number, dateSetted: React.SetStateAction<Date>) {
    console.log(amount);
    const today = new Date();
    const days = Math.ceil(parseInt(dateSetted.toString()) - parseInt(today.toString()) / 1000);
    const stakeContract = new ethers.Contract(
      stakeAddrs,
      StakingRewards.abi,
      signer
    );
    const rate = await stakeContract.rateCorrection(
      days > 0 ? days : 1000,
      amount ? amount : 1
    );
    const year = days / (60 * 60 * 24 * 365);
    const estReward = (rate / 10000) * year * amount;
    setCreateRate(rate / 100);
    const reward = parseInt((estReward > 0.01 ? estReward : 0).toFixed(2));
    setCreateReward(reward);
  }

  function handleChange(e:React.ChangeEvent<HTMLSelectElement>) {
    setReward((v) => (e.target.validity.valid ? e.target.value : v));
    calculateReward(reward , value);
  }
  async function claim(index:number) {
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

    let transaction = await tokenContract.sendToContract(stakeOwnerAddress);
    await transaction.wait();
  }

  async function isAllowed(userAddress:string, signer:ethers.providers.Provider | ethers.Signer | undefined) {
    const tokenContract = new ethers.Contract(tokenAddrs, Token.abi, signer);
    let allowance = await tokenContract.allowance(userAddress, stakeAddrs);
    const _allowed = parseInt(allowance.toString()) < 10000;
    if (_allowed) {
      setAllowed(false);
    } else {
      setAllowed(true);
    }
  }

  async function setAllowance() {
    const tokenContract = new ethers.Contract(tokenAddrs, Token.abi, signer);
    let transaction = await tokenContract.approve(
      stakeAddrs,
      100000000000000000000000000000n
    );
    await transaction.wait();
    setAllowed(true);
  }

  const maxamount = balance();

  async function setMaxAmount() {
    setAmount(parseInt(ethers.utils.formatEther(await maxamount)));
  }

  return (
    <div className="">

      <button onClick={() => getFunds()}>Get Funds</button>

      <div className="flex justify-center mx-auto w-3/4 bg-[#1B1C17] border-4 rounded-lg border-[#E8C39C]">
        <div className="">
          <div id="left-inputs" className="inline-block float-left ">

            <label className="w-full">
              Days:
              <br />
              <DatePicker
                onChange={(e) => {
                  setDate(e);
                }}
                value={value}
              />
            </label>

            <label>
              Amount:

              <input
                style={{ width: "157px" }}
                type="text"
                pattern="[0-9]*"
                value={amount}
                onChange={(e) => handleChange(e)}
              ></input>
              <span>
                <button onClick={() => setMaxAmount()}>Max</button>
              </span>
            </label>

            <div>
            {allowed ? (
              <button style={{ width: "157px" }} onClick={() => createStake()}>
                Create Stake
              </button>
            ) : (
              <button style={{ width: "157px" }} onClick={() => setAllowance()}>
                Enable
              </button>
            )}
          </div>
          </div>
          <div id="right-outputs" className="float-right inline-block">
            <div style={{ padding: "15px", border: "2px solid" }}>
              Estimated APR:

              <div>{createRate}%</div>
            </div>
            <div style={{ padding: "15px", border: "2px solid" }}>
              Estimated Reward:
              <div>{createReward}</div>
            </div>
          </div>
        </div>

      </div>
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
export default Staking;
