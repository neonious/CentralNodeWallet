'use strict';

/*
 * compileContracts.js
 * My script to compile .sol to .json. Not needed for running the wallet.
 */

const fs = require('fs');
const path = require('path');

const solc = require('solc');

function findImports(dependency) {
	const code = fs.readFileSync(path.join(__dirname, 'node_modules', dependency), 'utf8');
	return { contents: code };
}

async function compile(file, pathIn, pathOut) {
	const code = await fs.promises.readFile(path.join(__dirname, pathIn), 'utf8');

	let sources = {};
	sources[file] = { content: code };

	const res = JSON.parse(solc.compile(JSON.stringify({
		language: 'Solidity',
		sources,
		settings: { outputSelection: { '*': { '*': ['*'] } } }
	}), { import: findImports }));

	await fs.promises.writeFile(path.join(__dirname, pathOut), JSON.stringify(res, null, 2));
}

async function run() {
	await compile('walletFactory.sol', 'contracts/walletFactory.sol', 'contracts/walletFactory.json');

	// For test.js
	await compile('simpleToken.sol', 'contracts/simpleToken.sol', 'contracts/simpleToken.json');

	// Needed because solc keeps program running
	process.exit(0);
}
run();
