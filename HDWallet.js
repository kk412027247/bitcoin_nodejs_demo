const bip39 = require('bip39');
const bip32 = require('bip32');
const wif = require('wif');
const ecc = require('eosjs-ecc');
const ethers = require('ethers');
let provider = ethers.getDefaultProvider('rinkeby');
const bitcoin = require('bitcoinjs-lib');

// 生成助记词
// const mnemonic = bip39.generateMnemonic();
const mnemonic = 'wagon avocado fee armed clever glory satoshi horror one goat sample trim';

// EOS
const seed = bip39.mnemonicToSeed(mnemonic);
const node = bip32.fromSeed(seed);

const eosPath = "m/44'/194'/0'/0/0";
const child = node.derivePath(eosPath);
const EOSPrivateKey = wif.encode(128, child.privateKey, false);
const EOSPublicKey = ecc.privateToPublic(EOSPrivateKey);
console.log(EOSPublicKey);
// console.log(EOSPrivateKey);


// ETH

const _wallet1 = ethers.Wallet.fromMnemonic(mnemonic);
const ETHWallet = _wallet1.connect(provider);
console.log(ETHWallet.signingKey.address);

// BTC

const btcNetwork = bitcoin.networks.testnet;

const BTCSeed = bip39.mnemonicToSeed(mnemonic);
const BTCNode = bip32.fromSeed(BTCSeed, btcNetwork);
const BTCPath = "m/44'/0'/0'/0/0";
const BTCChild = BTCNode.derivePath(BTCPath);
const BTCPrivateKey = BTCChild.toWIF();
const BTCKeyPair = bitcoin.ECPair.fromWIF(BTCPrivateKey, btcNetwork);
const { address } = bitcoin.payments.p2pkh({ pubkey: BTCKeyPair.publicKey, network: btcNetwork});
console.log(address);



