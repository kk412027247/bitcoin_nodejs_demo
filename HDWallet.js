const bitcoin = require('bitcoinjs-lib');
const bip39 = require('bip39');
const HDKey = require('bip32');

const mnemonic = bip39.generateMnemonic();
console.log(mnemonic);

const seed = bip39.mnemonicToSeed( "muscle skate dawn remember pumpkin foil vacuum such brass grass bullet shoulder" ).toString( 'hex' );

const root = HDKey.fromSeed(new Buffer(seed, 'hex'));

const path = "m/44'/0'/0'/0/0";

const derived = root.derivePath(path);

const publicKey = derived.publicKey.toString('hex');

const { address } = bitcoin.payments.p2pkh({ pubkey: derived.publicKey });

const privKey = bitcoin.ECPair.fromPrivateKey(derived.privateKey).toWIF();

console.log(publicKey, address, privKey);
