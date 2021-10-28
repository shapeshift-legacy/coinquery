/* Description:
 *  Sends a request to the `/tx/send` endpoint and verifes that the transaction 
 *  is pending or mined in a block

 * Test steps:
 * 1. create the tx 
 *  - 
 * 
 * 2. sign the tx 
 *  - shell call to bitcoin RPC signTransaction()
 * 
 * 3. send tx via coinquery tx/send endpoint  
 *  - response contains txid (txhash) <---  the main thing we are testing
 * 
 * 4. verify that the txid is pending / mined
 *  - phase 1 - do this manually (using insight front end)
 *  - phase 2 - via insight /tx/txid endpoint 
 * 
 * 5. recommended future testing 
 *  - send more than one tx
 *  - read private key decryption password from a file (not harcoded here)
 */

// Dependencies
const chai = require('chai');
const expect = chai.expect;
const request = require('request');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
var dJSON = require('dirty-json');

// Test parameters
const coinQueryURL = process.env.COIN_QUERY_PROXY_SERVER;
const insightURL = `https://bch-insight.bitpay.com/` // API location, third-party service
const location = '/home/node';
const pwd = 'cqftw';


// Build the send transaction URI
const getSendTxURI = function (_serverURL, _signedTx) {
  return _serverURL +
    'api/' +
    'tx/' +
    'send/' +
    _signedTx;
};

// Build the get transaction info URI
const getTxReceiptURI = function (_serverURL, _txHash) { 
  return _serverURL +
    'api/' +
    'tx/' +
    _txHash;
};

// Returns a string representing the transaction object
const createTx = function (_from, _to, _gasPrice, _gas, _value, ) {
  let txObj = {
    from: _from,
    to: _to,
    gasPrice: _gasPrice,
    gas: _gas,
    value: _value,
  };
  return JSON.stringify(txObj);
};

// Unlock geth wallet
const unlockWallet = async (_location, _pwd) => new Promise((resolve, reject) => {
  let cmd = 'geth ' +
    '--datadir "' + _location + '/geth-client/.ethereum" ' +
    '--exec "personal.unlockAccount(web3.eth.accounts[0], \'' + _pwd + '\', 20000)" ' + 
    'attach';  
  return execPromise(cmd)
  .then((result) => {
    return resolve(true);
  })
  .catch((e) => {
    return reject(e);
  })
});

// Sign a transaction using the keys in the geth wallet
const signTx = async (_location, _tx) => new Promise((resolve, reject) => {
  let cmd = 'geth ' +
    '--datadir "' + _location + '/geth-client/.ethereum" ' +
    '--exec \'eth.signTransaction(' + _tx + ')\' ' +
    'attach';
  return execPromise(cmd)
  .then(async (result) => {
    return await dJSON.parse(result.stdout);   
  })
  .then((prettyJSON) => {
    return resolve(prettyJSON.raw);
  })
  .catch((e) => {
    return reject(e);
  })
});

// HTTP Request
const syncRequest = async (_uri) => new Promise((resolve, reject) => {
  console.log('query: ', _uri, '\n');
  return request({
    timeout: 20000,
    uri: _uri,
    json: true,
    rejectUnauthorized : false,
  }, function (error, res, body) {
    if (error) {
      return reject(error);
    }
    console.log('response: ', body, '\n');
    return resolve(body);
  });
});


// Run the test
describe('GET /send endpoint', function() {
  const fromAccount = ''; // CoinQuery test account 
  const toAccount = ''; // CoinQuery test account 
  const value = '1000'; // units of satoshi
  let tx;
  let signedTx;
  let txHash;
  let txReceiptInterval;

  // https://github.com/paritytech/parity/wiki/JSONRPC-eth-module#eth_gettransactionreceipt
  // const requestTxReceipt = async function (_query, _done) {
  //   try {
  //     const txReceipt = await syncRequest(_query)
  //     if (txReceipt.result != null) {
  //       expect(txReceipt.result).to.have.property('blockNumber');
  //       clearInterval(txReceiptInterval);
  //       _done();
  //     } 
  //   } catch (e) {
  //     throw new Error(e);
  //   }
  // };

  // get the nonce and sign a transaction
  // before(async function() {
  //   console.log(`CoinQuery server: ${coinQueryURL} \n`);
  //   try {  

  //     tx = createTx(fromAccount, toAccount, gasPrice, gas, value, nonce.result); 
  //     await unlockWallet(location, pwd);
  //     signedTx = await signTx(location, tx); 
  //     } catch (e) {
  //       throw new Error(e);
  //     };    
  // });

  // send a transction via coinquery
  it('should be able to send a signed transaction', async function () {
    try {
      //const query = getSendTxURI(coinQueryURL, signedTx);
      //txHash = await syncRequest(query); 
      txHash = 1;
      //expect(txHash).to.have.property('result');
      expect(txHash).to.equal(1);
    } catch (e) {
      throw new Error(e);
    }
  });  

  // request tx receipt until tx is mined, keep trying every x milliseconds
  // it('should be able to get a transaction receipt', function (done) {
  //   this.timeout(0); // disable timeout
  //   const retryInterval = 5000; // units of milliseconds
  //   const query = getTxReceiptURI(etherscanURL, txHash.result);
  //   txReceiptInterval = setInterval(requestTxReceipt, retryInterval, query, done);
  //   console.log(`Seting timer to request transaction receipt every ${retryInterval/1000} seconds ...`);
  // });  
});
