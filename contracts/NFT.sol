//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFT is ERC1155 , Ownable {
    uint public fee;
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    address creator;

    constructor(string memory tokenURI,address marketAddress, uint _fee, address _owner) ERC1155(tokenURI){
       setApprovalForAll(marketAddress,true);
       fee = _fee;
       creator = _owner;
    }

    function mint( address  reciever ) public onlyOwner {
        _tokenIds.increment();
        _mint(reciever, _tokenIds.current(), 1, "");
    }

    function burn( uint id ) public onlyOwner {
        _burn(msg.sender, id, 1);
    }

    function currentId() public view returns(uint) {
        return _tokenIds.current() ;
    }
    function getFee() public view returns(uint) {
        return fee;
    }
    function getCreator() public view returns(address) {
        return creator;
    }


}