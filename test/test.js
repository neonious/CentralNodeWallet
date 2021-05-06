'use strict';

const wallet = require('../index.js');
const util = require('../util.js');

const Web3 = require('web3');
const net = require('net');

const web3 = new Web3('/opt/gethtest/.ethereum/geth.ipc', net);

// Does not exist in mainnet, only for testing
const INITIAL_ETH_ACCOUNT = {
	address: '0xdc48161C3AA199A2ba580023d62F419506EF1b91',
	privateKey: '0x28949df9705ea27b1ac3e8a3297002345eb10b742855f59d379354a6e2dd29a2'
};
// If not set, we create contracts in run() below
let SIMPLETOKEN_CONTRACT;// = '0x0A25dc0CCf9E43Fe43bb063445849B8393b1DD28';
let WALLET_CONTRACT;// = '0x9c85eFD9c12E48B5dd8FF1158248900FaCf94E1b';

async function run() {
        console.log("Node ready:", await util.isNodeReady(web3));

	console.log("Initial ETH: ", await util.getBalance(web3, null, INITIAL_ETH_ACCOUNT.address));
	if(!SIMPLETOKEN_CONTRACT) {
		SIMPLETOKEN_CONTRACT = await util.deploySimpleToken(web3, INITIAL_ETH_ACCOUNT.privateKey, "TEST", "TEST", 1000000);
		console.log("SimpleToken Contract deployed at: ", SIMPLETOKEN_CONTRACT);
	}
	console.log("Initial SimpleToken: ", await util.getBalance(web3, SIMPLETOKEN_CONTRACT, INITIAL_ETH_ACCOUNT.address));

	if(!WALLET_CONTRACT) {
		WALLET_CONTRACT = await wallet.create(web3, INITIAL_ETH_ACCOUNT.privateKey);
		console.log("Wallet deployed at: ", WALLET_CONTRACT);
	}

	console.log("Adding 20 addresses.");
	await wallet.addAddresses(web3, INITIAL_ETH_ACCOUNT.privateKey, WALLET_CONTRACT, 20);

	const walletInfo = {addresses: await wallet.getAddresses(web3, WALLET_CONTRACT)};
	console.log(walletInfo);

	console.log("ETH on first: ", await util.getBalance(web3, null, walletInfo.addresses[0]));
	await util.transfer(web3, INITIAL_ETH_ACCOUNT.privateKey, null, walletInfo.addresses[0], 100);
	console.log("ETH on first after transaction: ", await util.getBalance(web3, null, walletInfo.addresses[0]));

	console.log("ST on first: ", await util.getBalance(web3, SIMPLETOKEN_CONTRACT, walletInfo.addresses[0]));
	await util.transfer(web3, INITIAL_ETH_ACCOUNT.privateKey, SIMPLETOKEN_CONTRACT, walletInfo.addresses[0], 100);
	console.log("ST on first after transaction: ", await util.getBalance(web3, SIMPLETOKEN_CONTRACT, walletInfo.addresses[0]));

	console.log("ETH on first before transaction: ", await util.getBalance(web3, null, walletInfo.addresses[0]));
	console.log("ETH on second before transaction: ", await util.getBalance(web3, null, walletInfo.addresses[1]));
	await wallet.transfer(web3, INITIAL_ETH_ACCOUNT.privateKey, WALLET_CONTRACT, null, walletInfo.addresses[0], walletInfo.addresses[1], 100);
	console.log("ETH on first after transaction: ", await util.getBalance(web3, null, walletInfo.addresses[0]));
	console.log("ETH on second after transaction: ", await util.getBalance(web3, null, walletInfo.addresses[1]));

	console.log("ST on first before transaction: ", await util.getBalance(web3, SIMPLETOKEN_CONTRACT, walletInfo.addresses[0]));
	console.log("ST on second before transaction: ", await util.getBalance(web3, SIMPLETOKEN_CONTRACT, walletInfo.addresses[1]));
	await wallet.transfer(web3, INITIAL_ETH_ACCOUNT.privateKey, WALLET_CONTRACT, SIMPLETOKEN_CONTRACT, walletInfo.addresses[0], walletInfo.addresses[1], 100);
	console.log("ST on first after transaction: ", await util.getBalance(web3, SIMPLETOKEN_CONTRACT, walletInfo.addresses[0]));
	console.log("ST on second after transaction: ", await util.getBalance(web3, SIMPLETOKEN_CONTRACT, walletInfo.addresses[1]));

	let addresses = [
		walletInfo.addresses[0],
		walletInfo.addresses[1]
	];
	let addresses2 = [
		walletInfo.addresses[2],
		walletInfo.addresses[3]
	];
	let amounts = [
		await util.getBalance(web3, SIMPLETOKEN_CONTRACT, walletInfo.addresses[0]),
		await util.getBalance(web3, SIMPLETOKEN_CONTRACT, walletInfo.addresses[1])
	];
	await wallet.transferBatch2(web3, INITIAL_ETH_ACCOUNT.privateKey, WALLET_CONTRACT, SIMPLETOKEN_CONTRACT, addresses, addresses2, amounts);
	console.log("ST on first after big move transaction: ", await util.getBalance(web3, SIMPLETOKEN_CONTRACT, walletInfo.addresses[0]));
	console.log("ST on second after big move transaction: ", await util.getBalance(web3, SIMPLETOKEN_CONTRACT, walletInfo.addresses[1]));
	console.log("ST on three after big move transaction: ", await util.getBalance(web3, SIMPLETOKEN_CONTRACT, walletInfo.addresses[2]));
	console.log("ST on three after big move transaction: ", await util.getBalance(web3, SIMPLETOKEN_CONTRACT, walletInfo.addresses[3]));

	amounts = [
		await util.getBalance(web3, null, walletInfo.addresses[0]),
		await util.getBalance(web3, null, walletInfo.addresses[1])
	];
	await wallet.transferBatch2(web3, INITIAL_ETH_ACCOUNT.privateKey, WALLET_CONTRACT, null, addresses, addresses2, amounts);
	console.log("ETH on first after big move transaction: ", await util.getBalance(web3, null, walletInfo.addresses[0]));
	console.log("ETH on second after big move transaction: ", await util.getBalance(web3, null, walletInfo.addresses[1]));
	console.log("ETH on three after big move transaction: ", await util.getBalance(web3, null, walletInfo.addresses[2]));
	console.log("ETH on three after big move transaction: ", await util.getBalance(web3, null, walletInfo.addresses[3]));

	console.log("Done.");
	process.exit(0);
}
run();
