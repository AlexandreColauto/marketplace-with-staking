//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFT is ERC1155, Ownable {
    uint256 public fee;
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    address creator;

    constructor(
        string memory tokenURI,
        address marketAddress,
        address stakingAddress,
        uint256 _fee,
        address _owner
    ) ERC1155(tokenURI) {
        setApprovalForAll(marketAddress, true);
        setApprovalForAll(stakingAddress, true);

        fee = _fee;
        creator = _owner;
    }

    function mint(address reciever) public onlyOwner {
        _tokenIds.increment();
        _mint(reciever, _tokenIds.current(), 1, "");
    }

    function burn(uint256 id) public onlyOwner {
        _burn(msg.sender, id, 1);
    }

    function currentId() public view returns (uint256[2] memory) {
        return [_tokenIds.current(), fee];
    }

    function getFee() public view returns (uint256) {
        return fee;
    }

    function getCreator() public view returns (address) {
        return creator;
    }
}
