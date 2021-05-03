// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0 < 0.9.0;   // 0.8.0 has SafeMath included

// Based on https://github.com/Meshugah/ERC20-CommonGasWallet/blob/master/contracts/Factory.sol
// But supports ETH, too

abstract contract ERC20 {
    function transfer(address to, uint256 amount) virtual public returns (bool success);
}

contract Receiver  {
	address public owner;

	modifier onlyOwner {
		require(msg.sender == owner);
		_;
	}

    constructor () {
        owner = msg.sender;
    }

    function sendERC20To(address tokenAddress, address to, uint256 amount) public onlyOwner {
        require(ERC20(tokenAddress).transfer(to, amount));
    }

    function sendEthTo(address payable to, uint256 amount) public onlyOwner {
        to.transfer(amount);
    }

    // So we can receive ETH
    receive() external payable {}
}

/*
    Factory Contract
*/
contract Factory {
    mapping ( uint256 => address payable ) public receiversMap;
    uint256 public receiverCount = 0;

	address public owner;

	modifier onlyOwner {
		require(msg.sender == owner);
		_;
	}

    constructor() {
        owner = msg.sender;
    }

    function addAddresses(uint8 number) public onlyOwner {
        for(uint8 i = 0; i < number; i++)
            receiversMap[receiverCount++] = payable(address(new Receiver()));
    }

    function sendERC20To(address tokenAddress, address payable from, address to, uint256 amount) public onlyOwner {
        Receiver(from).sendERC20To(tokenAddress, to, amount);
    }

    function sendEthTo(address payable from, address payable to, uint256 amount) public onlyOwner {
        Receiver(from).sendEthTo(to, amount);
    }

    function batchSendERC20To(address tokenAddress, address payable[] memory froms, address to, uint256[] memory amounts) public onlyOwner {
        for(uint256 i = 0; i < froms.length; i++)
            Receiver(froms[i]).sendERC20To(tokenAddress, to, amounts[i]);
    }

    function batchSendEthTo(address payable[] memory froms, address payable to, uint256[] memory amounts) public onlyOwner {
        for(uint256 i = 0; i < froms.length; i++)
            Receiver(froms[i]).sendEthTo(to, amounts[i]);
    }

    function batchSendERC20To2(address tokenAddress, address payable[] memory froms, address[] memory tos, uint256[] memory amounts) public onlyOwner {
        for(uint256 i = 0; i < froms.length; i++)
            Receiver(froms[i]).sendERC20To(tokenAddress, tos[i], amounts[i]);
    }

    function batchSendEthTo2(address payable[] memory froms, address payable[] memory tos, uint256[] memory amounts) public onlyOwner {
        for(uint256 i = 0; i < froms.length; i++)
            Receiver(froms[i]).sendEthTo(tos[i], amounts[i]);
    }
}
