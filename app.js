const express = require('express')
const app = express()
const port = 3000
const dotenv = require('dotenv');
dotenv.config();

const { keyStores, KeyPair, utils, transactions, connect, Account } = require("near-api-js");
const fs = require("fs");
const path = require("path");
const { KeyStore } = require('near-api-js/lib/key_stores');
const homedir = require("os").homedir();

const CREDENTIALS_DIR = ".near-credentials";
const ACCOUNT_ID = process.env.ACCOUNT_ID;
const STORAGE_AMOUNT = '6365010000000000000000000';
const TOKEN_LIST = ["ref.fakes.testnet", "hapi.fakes.testnet", "wrap.testnet", "usdc.fakes.testnet", "usdt.fakes.testnet", "paras.fakes.testnet"];
const WASM_PATH = path.join(__dirname, "/wasm-files/blockbelly_defi.wasm");
const keyStore = new keyStores.UnencryptedFileSystemKeyStore('./.near-credentials');

const config = {
    keyStore,
    networkId: "testnet",
    nodeUrl: "https://rpc.testnet.near.org",
};


async function registerContractWithRef(contractId, token_list) {
    const near = await connect(config);
    const account = await near.account(ACCOUNT_ID);
    const result = await account.signAndSendTransaction(
        {
            receiverId: "ref-finance-101.testnet",
            actions: [
                transactions.functionCall(
                    "storage_deposit",
                    Buffer.from(JSON.stringify({ "account_ids": contractId })),
                    10000000000000,
                    "1"
                ),
                transactions.functionCall(
                    "register_tokens",
                    Buffer.from(JSON.stringify({ "token_ids": token_list })),
                    10000000000000,
                    "1"
                ),
            ],
        }
    )
    console.log(result)
    return result
}

async function addStorageDepositsForToken(contractId, tokenAddr) {
    const near = await connect(config);
    const account = await near.account(ACCOUNT_ID);
    const result = await account.signAndSendTransaction(
        {
            receiverId: tokenAddr,
            actions: [
                transactions.functionCall(
                    "storage_deposit",
                    Buffer.from(JSON.stringify({ "account_ids": contractId })),
                    10000000000000,
                    "1250000000000000000000"
                ),
            ],
        }
    )

    console.log(`The result of storage deposit for ${tokenAddr} is this ${result}`)
    return result
}

async function createFullAccessKey(accountId) {
    const near = await connect(config);
    const account = await near.account(accountId);
    await keyStore.setKey(config.networkId, publicKey, keyPair);
    await account.addKey(publicKey);
}

async function createNewIndex(indexContract, contractArgs) {
    const near = await connect(config);
    const creatorAccount = await near.account(ACCOUNT_ID);
    const keyPair = KeyPair.fromRandom("ed25519");
    const publicKey = keyPair.publicKey.toString();
    await keyStore.setKey(config.networkId, indexContract, keyPair);
    let create_and_deploy = await creatorAccount.createAndDeployContract(indexContract, publicKey, fs.readFileSync(WASM_PATH), STORAGE_AMOUNT)
    // console.log("**********create_and_deploy**************" + create_and_deploy);

    // initialize Index Contract
    let initializecontract = await creatorAccount.signAndSendTransaction({
        receiverId: indexContract,
        actions: [
            transactions.functionCall(
                'new',
                contractArgs,
                10000000000000
            )
        ]
    })
    // console.log("**********initializecontract**************" + initializecontract);
    let refstoarge = await registerContractWithRef(indexContract, TOKEN_LIST)
    // console.log("**********refstoarge**************" + refstoarge);
}


app.get('/', (req, res) => {
    // let contractArgs = { "owner_id": ACCOUNT_ID, "total_supply": "0", "metadata": { "spec": "ft-1.0.0", "name": "neccoIndex", "symbol": "DI", "decimals": 8 }, "token_list": ["hapi.fakes.testnet", "wrap.testnet", "usdc.fakes.testnet", "usdt.fakes.testnet", "paras.fakes.testnet"], "token_alloc": ["10", "10", "30", "25", "25"], "token_pool_ids": [114, 17, 374, 31, 299], "input_token": "ref.fakes.testnet", "min_investment": "10000000", "token_manager": "Devendra", "base_price": "100000000", "manager_fee_percent": "200", "platform_fee_percent": "50", "distributor_fee_percent": "50", "manager": "d_c.testnet", "platform": "d_c.testnet", "distributor": "d_c.testnet" };
    // createNewIndex('b3.' + ACCOUNT_ID, contractArgs)
    res.send(`Hello World! Invex`)
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})



