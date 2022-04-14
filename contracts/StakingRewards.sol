//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";


contract StakingRewards is ReentrancyGuard, Ownable {
    IERC20 public rewardsToken;
    Counters.Counter private _stakeIds;
    uint private _totalSupply;


    constructor(IERC20 _rewardsToken) {
        stakeholders.push();
        rewardsToken = _rewardsToken;
    }

    struct Stake {
        uint stakeId;
        uint amount;
        address payable stakeOwner;
        uint createdDate;
        uint endDate;
        bool active;
    }

    struct Stakeholder{
        address user;
        Stake[] address_stakes;
        
    }
    mapping(address => uint256) internal stakes;
    Stakeholder[] public stakeholders; 

    function _addStakeholder(address staker) internal returns (uint256){
        // Push a empty item to the Array to make space for our new stakeholder
        stakeholders.push();
        // Calculate the index of the last item in the array by Len-1
        uint256 userIndex = stakeholders.length - 1;
        // Assign the address to the new index
        stakeholders[userIndex].user = staker;
        // Add index to the stakeHolders
        stakes[staker] = userIndex;
        return userIndex; 
    }


    function createStake(
        uint amount,
        uint endDate
    ) public nonReentrant {
        require(amount > 0, "Price must be at least 1 wei");
        require(endDate > 0, "Length must be at least 1 day");

        uint index = stakes[msg.sender];
        if(index == 0){
            index = _addStakeholder(msg.sender);
        }
        uint expireDate = block.timestamp + endDate * 1 days;
        stakeholders[index].address_stakes.push(Stake(
            stakeholders[index].address_stakes.length,
            amount,
            payable(msg.sender),
            block.timestamp,
            expireDate,
            true
        ));
        rewardsToken.transferFrom(msg.sender,address(this),amount);

    }


    function retrieveUserStakes(address user) public view returns(Stake[] memory){
        uint index = stakes[user];
        return stakeholders[index].address_stakes;
    }

    function claimStake(
        uint stakeIndex
    )  public nonReentrant {
        uint index = stakes[msg.sender];
        require(stakeholders[index].address_stakes.length > 0 ,"User doesnt have any stake");
        Stake storage currentStake = stakeholders[index].address_stakes[stakeIndex];
        require(currentStake.active==true,"This stake has already finished");
        currentStake.active = false;
        uint reward = calculateReward(currentStake);
       rewardsToken.transfer(msg.sender,reward);
    }

    function calculateReward(Stake memory currentStake) internal  returns (uint) {
        
        if(block.timestamp > currentStake.endDate ) {
           uint duration = (currentStake.endDate - currentStake.createdDate);
           uint rate = rateCorrection(duration,currentStake.amount/1 ether);
           uint completeReward =  ((currentStake.endDate - currentStake.createdDate) * ((currentStake.amount * rate) / 10000) )  / 365 days;
           
           return completeReward + currentStake.amount;
        } else {

            uint currentDuration = (block.timestamp - currentStake.createdDate );
            uint rate = rateCorrection(currentDuration,(currentStake.amount/ 1 ether));
            uint incompleteReward =  (((block.timestamp - currentStake.createdDate) * currentStake.amount /365 days) * rate) / 10000   ;
            uint estimatedDuration = currentStake.endDate - currentStake.createdDate;
            uint duration = (estimatedDuration - currentDuration);
            uint durationPercentage = (duration * 100) / estimatedDuration;
            uint burnAmount = (currentStake.amount * durationPercentage)/ 100;
            uint remaining = currentStake.amount - burnAmount;
            rewardsToken.transfer(0x000000000000000000000000000000000000dEaD,burnAmount);
            return incompleteReward + remaining;
        }
    }

    function rateCorrection(uint amountDays, uint amount) public view returns(uint) {
        uint anualRate =  500;
        console.log(amountDays);
        if(amountDays/570 days > 0) {
            anualRate= 1000;
        }
        if(amount > 1000000) {
            return anualRate;
        }
        if(amount < 500000) {
            return anualRate + 500;
        }
        uint amountCorrection = ((1000000 - amount)*500)/500000 + anualRate;
        return amountCorrection;
    }
    function withdraw(uint amount) public nonReentrant onlyOwner{
        rewardsToken.transfer(msg.sender,amount);
    }

}