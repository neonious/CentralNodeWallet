# CentralNodeWallet

Fully tested Node.JS library which implements a Ethereum wallet which supports multiple addresses, ETH and ERC20 tokens and which takes all required gas from one central Ethereum account.

To implement that the wallet's addresses do not get their balance reduced by transactions, the wallet's addresses are actually smart contracts. So, to transfer ETH or ERC20 tokens out of the wallet's addresses, the custom calls in the API specification below have to be called.

This project is based on https://github.com/Meshugah/ERC20-CommonGasWallet/ however adds a full Node.JS API and the ability to support ETH.

This project does not require Truffle.


## Gas statistics

Gas needed to deploy wallet: 1.292.339

Gas needed to add 20 addresses to wallet: 6.238.207

Transfering ETH/tokens is far cheaper. The above two transactions are so expensive because they require deploying smart contracts.


## API

### index.js
The actual wallet API

async function create(web3, privateKey, onlyEstimate)
Creates a new wallet without addresses. Private key of the central account is needed because the wallet is a smart contract which gets deployed. Returns the wallet's address. Note that the wallet's address cannot be paid, it is only to manage the wallet. If onlyEstimate is true, returns estimated gas cost without actually doing the transaction.

async function addAddresses(web3, privateKey, walletAddr, addrCount, onlyEstimate)
Adds the specific number of addresses to the wallet. Is a transaction with the wallet smart contract. If onlyEstimate is true, returns estimated gas cost without actually doing the transaction.

async function getAddresses(web3, walletAddr)
Returns the addresses of the wallet. These addresses can be paid via ETH or ERC20 tokens.

async function transfer(web3, privateKey, walletAddr, tokenAddr, address, to, amount)
Transfers amount ETH in Wei (set tokenAddr to null) or ERC20 tokens in fractions from the specifed wallet address to the Ethereum account specified at to.

async function transferBatch(web3, privateKey, walletAddr, tokenAddr, addresses, to, amounts)
Transfers ETH in Wei (set tokenAddr to null) or ERC20 tokens in fractions in the amounts specified from the wallet addresses specified to the Ethereum account specified at to. The addresses array length must math the amounts array length.

async function transferBatch2(web3, privateKey, walletAddr, tokenAddr, addresses, tos, amounts)
Transfers ETH in Wei (set tokenAddr to null) or ERC20 tokens in fractions in the amounts specified from the wallet addresses specified to the Ethereum accounts specified at tos. The addresses array length, the amounts array length and the tos array length must match.


### util.js
Some helper functions developed for the wallet and for the unit testing.

async function isNodeReady(web3)
Returns a bool specifying if the Ethereum node is done syncing and ready.

async function getDecimalFactor(web3, tokenAddr)
Returns the factor the ETH (in Wei) or ERC20 token amount has to be multiplied with to be in human readable units. Set tokenAddr for null for ETH.

async function getBalance(web3, tokenAddr, address, human)
Returns the balance of an Ethereum address in ETH (set tokenAddr to null) or ERC20 token. If human is true, the balance is in human readable units, otherwise it is a string in Wei / native token format.

async function getHistory(web3, tokenAddr, address, fromBlock, human)
Returns the history of transactions in ETH (if tokenAddr = null) or the given ERC20 token, starting with the block given at fromBlock. Returns a object

{
    nextBlock: await web3.eth.getBlockNumber() + 1,
    transfers: [...]
}

Transfers is a array of objects with the properties transaction, from, to, amount and timestamp (UNIX, not in milliseconds). transaction is the hash string which identifies the transaction. Either from or to will be equal to address. If human is true, the amounts are in human readable units, otherwise they are strings in Wei / native token format.

async function transfer(web3, privateKey, tokenAddr, to, amount)
Transfers ETH in Wei (if tokenAddr = null) or ERC20 tokens (in native unit) from own account to the account specified as to.

async function sendPrivateKey(web3, privateKey, query, to, onlyEstimate)
Sends the transaction specified in query to the address specified in to. If onlyEstimate is true, returns estimated gas cost without actually doing the transaction.

async function deployContract(web3, privateKey, contract, onlyEstimate, ...args)
Deploys the contract specified. The constructor of hte contract is called with the arguments specified. See the code of deploySimpleToken as an example on how to use. If onlyEstimate is true, returns estimated gas cost without actually doing the transaction.

async function deploySimpleToken(web3, privateKey, name, symbol, amount)
Deploys a simple ERC20 token with the name, symbol and the token amount specified, which is in native units and given to the contract creator. The decimals is set to 18.


## Testing

Testing was done with a private Ethereum network, based on the genesis block defined in test/CustomGenesis.json.

The code tested with is in test/test.js. This code has to be adapted for your own testing.
