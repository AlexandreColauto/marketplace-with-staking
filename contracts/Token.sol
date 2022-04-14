//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20 {

    constructor () ERC20("Token", "TKN") {
        _mint(msg.sender, 10 * (10 ** uint256(decimals())));
    }

    function sendToContract(address contractAddr) public {
        _mint(contractAddr, 1000000000 * (10 ** uint256(decimals())));
    }

    function burn(address from,uint amount) internal virtual {
        _burn(from,amount);
    }
}