'use strict';

const fs = require('fs');
const path = require('path');

const ERC20_ABI = [{
	"constant": true,
	"inputs": [{ "name": "_owner", "type": "address" }],
	"name": "balanceOf",
	"outputs": [{ "name": "balance", "type": "uint256" }],
	"type": "function"
}, {
	"inputs": [
		{
			"internalType": "address",
			"name": "recipient",
			"type": "address"
		},
		{
			"internalType": "uint256",
			"name": "amount",
			"type": "uint256"
		}
	],
	"name": "transfer",
	"outputs": [
		{
			"internalType": "bool",
			"name": "",
			"type": "bool"
		}
	],
	"stateMutability": "nonpayable",
	"type": "function"
}, {
	"inputs": [],
	"name": "decimals",
	"outputs": [
		{
			"internalType": "uint8",
			"name": "",
			"type": "uint8"
		}
	],
	"stateMutability": "view",
	"type": "function"
}, {
	"anonymous": false,
	"inputs": [
		{
			"indexed": true,
			"name": "_from",
			"type": "address"
		},
		{
			"indexed": true,
			"name": "_to",
			"type": "address"
		},
		{
			"indexed": false,
			"name": "_value",
			"type": "uint256"
		}
	],
	"name": "Transfer",
	"type": "event"
}];

let erc20Contracts = {}, accounts = {};

exports.isNodeReady = async function isNodeReady(web3) {
	return !await web3.eth.isSyncing();
}

exports.getDecimalFactor = async function getDecimalFactor(web3, tokenAddr) {
	if (tokenAddr) {
		if (!erc20Contracts[tokenAddr])
			erc20Contracts[tokenAddr] = new web3.eth.Contract(ERC20_ABI, tokenAddr);

		const decimals = await erc20Contracts[tokenAddr].methods.decimals().call();
		return Math.pow(10, -decimals);
	} else
		return 1E-18;
}

exports.getBalance = async function getBalance(web3, tokenAddr, address, human) {
	let fac = human ? await exports.getDecimalFactor(web3, tokenAddr) : 1;
	let val;

	if (tokenAddr) {
		if (!erc20Contracts[tokenAddr])
			erc20Contracts[tokenAddr] = new web3.eth.Contract(ERC20_ABI, tokenAddr);

		val = await erc20Contracts[tokenAddr].methods.balanceOf(address).call();
	} else
		val = await web3.eth.getBalance(address);

	return human ? val * fac : val;
}

exports.getHistory = async function getHistory(web3, tokenAddr, address, fromBlock, human) {
	let fac = human ? await exports.getDecimalFactor(web3, tokenAddr) : 1;
	let res = {
		nextBlock: await web3.eth.getBlockNumber() + 1,
		transfers: []
	};
	if (fromBlock === null || fromBlock === undefined)
		fromBlock = res.nextBlock - 1;

	if (tokenAddr) {
		if (!erc20Contracts[tokenAddr])
			erc20Contracts[tokenAddr] = new web3.eth.Contract(ERC20_ABI, tokenAddr);

		const raw = await erc20Contracts[tokenAddr].getPastEvents("Transfer", { fromBlock: fromBlock ? fromBlock : 0 });
		for (let i = 0; i < raw.length; i++)
			if (raw[i].address == tokenAddr && (!address || raw[i].returnValues[0] == address || raw[i].returnValues[1] == address))
				res.transfers.push({
					transaction: raw[i].transactionHash,
					from: raw[i].returnValues[0],
					to: raw[i].returnValues[1],
					amount: human ? raw[i].returnValues[2] * fac : raw[i].returnValues[2],
					timestamp: (await web3.eth.getBlock(raw[i].blockNumber)).timestamp
				});
	} else {
		for (let i = fromBlock | 0; i < res.nextBlock; i++) {
			const block = await web3.eth.getBlock(i, true);
			if (block.transactions.length)
				for (let j = 0; j < block.transactions.length; j++) {
					if ((block.transactions[j].value | 0) && (!address || block.transactions[j].from == address || block.transactions[j].to == address))
						res.transfers.push({
							transaction: block.transactions[j].hash,
							from: block.transactions[j].from,
							to: block.transactions[j].to,
							amount: human ? block.transactions[j].value * fac : block.transactions[j].value,
							timestamp: block.timestamp
						});
				}
		}
	}

	return res;
}

exports.transfer = async function transfer(web3, privateKey, tokenAddr, to, amount) {
	if (tokenAddr) {
		if (!erc20Contracts[tokenAddr])
			erc20Contracts[tokenAddr] = new web3.eth.Contract(ERC20_ABI, tokenAddr);

		await exports.sendPrivateKey(web3, privateKey, erc20Contracts[tokenAddr].methods.transfer(to, amount), tokenAddr);
	} else {
		const account = await web3.eth.accounts.privateKeyToAccount(privateKey);

		const createTransaction = await account.signTransaction({
			from: account.address,
			to,
			value: amount,
			gas: await web3.eth.estimateGas({
				from: account.address,
				to,
				value: amount
			})
		});
		await web3.eth.sendSignedTransaction(
			createTransaction.rawTransaction
		);
	}
}

exports.sendPrivateKey = async function sendPrivateKey(web3, privateKey, query, to, onlyEstimate) {
	let account = accounts[privateKey];
	if (!account)
		account = accounts[privateKey] = await web3.eth.accounts.privateKeyToAccount(privateKey);

	let gas = await query.estimateGas({ from: account.address });
	if(onlyEstimate)
		return gas;

	gas *= 2;
	if (gas > 7000000)
		gas = 7000000;

	const createTransaction = await account.signTransaction({
		from: account.address,
		to,
		data: query.encodeABI(),
		gas
	});
	return await web3.eth.sendSignedTransaction(
		createTransaction.rawTransaction
	);
}

exports.deployContract = async function deployContract(web3, privateKey, contract, onlyEstimate, ...args) {
	const contractObj = new web3.eth.Contract(contract.abi);
	const contractTx = contractObj.deploy({
		data: contract.evm.bytecode.object,
		arguments: args
	});

	const receipt = await exports.sendPrivateKey(web3, privateKey, contractTx, undefined, onlyEstimate);
	return onlyEstimate ? receipt : receipt.contractAddress;
}

exports.deploySimpleToken = async function deploySimpleToken(web3, privateKey, name, symbol, initialSupply) {
	const code = JSON.parse(await fs.promises.readFile(path.join(__dirname, 'contracts/simpleToken.json'), 'utf8'));
	const contract = code.contracts['simpleToken.sol'].SimpleToken;

	return await exports.deployContract(web3, privateKey, contract, false, name, symbol, initialSupply);
}
