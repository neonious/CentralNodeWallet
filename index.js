'use strict';

const fs = require('fs');
const path = require('path');

const util = require('./util.js');

let contractCode;
let contracts = {};

async function initContract(web3, walletAddr) {
	if (!contractCode)
		contractCode = JSON.parse(await fs.promises.readFile(path.join(__dirname, 'contracts/walletFactory.json'), 'utf8'))
			.contracts['walletFactory.sol'].Factory;

	if (walletAddr) {
		if (!contracts[walletAddr])
			contracts[walletAddr] = new web3.eth.Contract(contractCode.abi, walletAddr);
		return contracts[walletAddr];
	}
}

exports.create = async function create(web3, privateKey) {
	await initContract(web3);

	return await util.deployContract(web3, privateKey, contractCode);
}

exports.addAddresses = async function addAddresses(web3, privateKey, walletAddr, addrCount) {
	const contract = await initContract(web3, walletAddr);

	await util.sendPrivateKey(web3, privateKey, contract.methods.addAddresses(addrCount), walletAddr);
}

exports.getAddresses = async function getAddresses(web3, walletAddr) {
	const contract = await initContract(web3, walletAddr);

	let addresses = [];
	let count = await contract.methods.receiverCount().call();
	for (let i = 0; i < count; i++)
		addresses.push(await contract.methods.receiversMap(i).call());

	return addresses;
}

exports.transfer = async function transfer(web3, privateKey, walletAddr, tokenAddr, address, to, amount) {
	const contract = await initContract(web3, walletAddr);

	if (tokenAddr)
		await util.sendPrivateKey(web3, privateKey, contract.methods.sendERC20To(tokenAddr, address, to, amount), walletAddr);
	else
		await util.sendPrivateKey(web3, privateKey, contract.methods.sendEthTo(address, to, amount), walletAddr);
}

exports.transferBatch = async function transferBatch(web3, privateKey, walletAddr, tokenAddr, addresses, to, amounts) {
	if (addresses.length != amounts.length)
		throw new Error('arrays not same length');

	const contract = await initContract(web3, walletAddr);

	if (tokenAddr)
		await util.sendPrivateKey(web3, privateKey, contract.methods.batchSendERC20To(tokenAddr, addresses, to, amounts), walletAddr);
	else
		await util.sendPrivateKey(web3, privateKey, contract.methods.batchSendEthTo(addresses, to, amounts), walletAddr);
}

exports.transferBatch2 = async function transferBatch2(web3, privateKey, walletAddr, tokenAddr, addresses, tos, amounts) {
	if (addresses.length != amounts.length || addresses.length != tos.length)
		throw new Error('arrays not same length');

	const contract = await initContract(web3, walletAddr);

	if (tokenAddr)
		await util.sendPrivateKey(web3, privateKey, contract.methods.batchSendERC20To2(tokenAddr, addresses, tos, amounts), walletAddr);
	else
		await util.sendPrivateKey(web3, privateKey, contract.methods.batchSendEthTo2(addresses, tos, amounts), walletAddr);
}
