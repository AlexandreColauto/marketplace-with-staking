//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

contract StakingRewards is ReentrancyGuard, Ownable, ERC1155Holder {
    Counters.Counter private _stakeIds;
    uint256 private _totalSupply;
    uint256 public reward;

    constructor(uint256 _reward) {
        stakeholders.push();
        reward = _reward;
    }

    struct Stake {
        uint256 stakeId;
        uint256 amount;
        address payable stakeOwner;
        uint256 createdDate;
        bool active;
        address nftAddress;
        uint256 nftId;
    }

    struct Stakeholder {
        address user;
        Stake[] address_stakes;
    }
    mapping(address => uint256) internal stakes;
    Stakeholder[] public stakeholders;

    function _addStakeholder(address staker) internal returns (uint256) {
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

    function createStake(address nftAddress, uint256 nftId)
        public
        nonReentrant
    {
        require(nftAddress != address(0) && nftId != 0, "Must stake a nft");

        uint256 index = stakes[msg.sender];
        if (index == 0) {
            index = _addStakeholder(msg.sender);
        }
        stakeholders[index].address_stakes.push(
            Stake(
                stakeholders[index].address_stakes.length,
                1,
                payable(msg.sender),
                block.timestamp,
                true,
                nftAddress,
                nftId
            )
        );
        ERC1155(nftAddress).safeTransferFrom(
            msg.sender,
            address(this),
            nftId,
            1,
            ""
        );
    }

    function retrieveUserStakes(address user)
        public
        view
        returns (Stake[] memory)
    {
        uint256 index = stakes[user];
        return stakeholders[index].address_stakes;
    }

    function claimStake(uint256 stakeIndex) public nonReentrant {
        uint256 index = stakes[msg.sender];
        require(
            stakeholders[index].address_stakes.length > 0,
            "User doesnt have any stake"
        );
        Stake storage currentStake = stakeholders[index].address_stakes[
            stakeIndex
        ];
        require(currentStake.active == true, "This stake has already finished");
        currentStake.active = false;
        uint256 _reward = _calculateReward(currentStake);
        payable(msg.sender).transfer(_reward);
        ERC1155(currentStake.nftAddress).safeTransferFrom(
            address(this),
            msg.sender,
            currentStake.nftId,
            1,
            ""
        );
    }

    function _calculateReward(Stake memory currentStake)
        internal
        view
        returns (uint256)
    {
        uint256 completeReward = ((block.timestamp - currentStake.createdDate) *
            (reward)) / 365 days;
        return completeReward;
    }

    function setReward(uint256 _reward) public onlyOwner {
        reward = _reward;
    }

    function withdraw(uint256 amount) public nonReentrant onlyOwner {
        payable(msg.sender).transfer(amount);
    }

    function fillPool() public payable onlyOwner {}

    function balance() public view onlyOwner returns (uint256) {
        return address(this).balance;
    }

    function estimateReward(uint256 stakeIndex) public view returns (uint256) {
        uint256 index = stakes[msg.sender];
        require(
            stakeholders[index].address_stakes.length > 0,
            "User doesnt have any stake"
        );
        Stake storage currentStake = stakeholders[index].address_stakes[
            stakeIndex
        ];
        uint256 completeReward = ((block.timestamp - currentStake.createdDate) *
            (reward)) / 365 days;
        return completeReward;
    }
}
