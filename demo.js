const bitcoin = require('bitcoinjs-lib');
const testnet = bitcoin.networks.testnet;
const fetch = require('node-fetch');

// 根据随机字符构造两个函数
function rng () { return Buffer.from('tmd123zzzzzzzzzzzzzzzzzzzzzzzzzz') }
function rng2 () { return Buffer.from('tmd321333zzzzzzzzzzzzzzzzzzzzzzz') }

// 生成钱包1， 指定测试链
const alice = bitcoin.ECPair.makeRandom({network: testnet, rng});
const { address } = bitcoin.payments.p2pkh({ pubkey: alice.publicKey, network: testnet });
// console.log(address);
// console.log(alice.toWIF())
// 地址: mmH6e8tfLyvrrnFF3o1scaNsPXShGY89rb
// 私钥: L182iNrxy9rSPQfEg5X1P1sR9qAbS1pbxPosguD8Sx5tYauV3bYm

// 生成钱包2
const bob = bitcoin.ECPair.makeRandom({network: testnet, rng: rng2 });
const { address:address2 } = bitcoin.payments.p2pkh({ pubkey: bob.publicKey, network: testnet });
// console.log(address2);
// console.log(bob.toWIF())
// 地址: miAMpCdoM3SuRMRoEVHp8smFdDAz29WA9g
// 私钥: L182iNub4Z8Ly6H13jcx7i82jKq3czc7WzFso3z249LuMcMjzQXo

// 比特币转账需要提取或合并所有未花费的交易中的比特币，才能实现交易。
// 描述起来比较复杂，下图是个例子，我们从区块浏览器查到我最近一笔未花费支出，某个地址转了0.03个BTC给我,在这一笔交易中，我有0.03个BTC，
// 如果我要转出0.5个BTC给他人，我需要合并其他的交易，否则将会余额不足，虽然在我这个地址中有足够的BTC。

// 单个哈希交易，从 bob 转给 alice。
const transfer1 = async () => {

  // 注意要指定交易对象是测试链的
  const txb = new bitcoin.TransactionBuilder(testnet);
  txb.setVersion(1);
  // 在这个交易中， bob在第0个位置，上图所示
  txb.addInput('5799a647d6b89a9f73122d75faee6f5a0210bd3cb22c48a70d35eac33ce5d426', 0);
  
  // 这里把btc转给 alice 的地址，金额是0.02 但是要*100000000, 也就是2000000,
  // 剩余的金额没有设置招零地址接收，则被视为手续费，被区块网络收取
  // 每一笔交易只有已花费和未花费两种状态，不存在消费一部分的状态，
  // 所以合并多笔交易的话，只要未花费，都可以合并。
  txb.addOutput('mmH6e8tfLyvrrnFF3o1scaNsPXShGY89rb', 2000000);

  // 签名交易，0代表索引，输入排序，这里只有一个输入，所以是第0位。
  txb.sign(0, bob);

  // 序列化成一串字符
  const tx = txb.build().toHex();
  console.log(tx);

  // 在一个测试链的节点把交易广布出去
  const result = await fetch('https://api.blockcypher.com/v1/btc/test3/txs/push',{
    method:'post',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({tx})
  });

  // 打印结果
  console.log(result);
};

// transfer1();

// 转账的时候需要手动寻找每一笔未花费记录实在太费时，所以需要一个辅助节点来提取未来花费的记录
// https://api.blockcypher.com/v1/btc/test3/addrs/miAMpCdoM3SuRMRoEVHp8smFdDAz29WA9g

const transfer2 = async () => {
  const url = 'https://api.blockcypher.com/v1/btc/test3/addrs/';
  const res = await fetch(url+address2);
  const json = await res.json();
  const balance = json.balance;
  // console.log(balance/100000000);

  const txrefs = json.txrefs;

  // 过滤掉已经被花费了的交易，以及自己不在接收列表的交易
  const unspentList = txrefs.filter(item=> !item.spent_by && item.tx_output_n !== -1);
  // 这个地址还可以查询余额
  // console.log(unspentList);

  // 构建交易对象
  const txb = new bitcoin.TransactionBuilder(testnet);
  txb.setVersion(1);

  // 批量插入未花费交易
  unspentList.forEach(item=>txb.addInput(item.tx_hash, item.tx_output_n));

  // 转出账户
  txb.addOutput('mmH6e8tfLyvrrnFF3o1scaNsPXShGY89rb', 2000000);

  // 设置找零地址，如果忘记了，就会丢失所有BTC ！！！！！！！！
  // 如果不预留手续费，则默认为0.03
  txb.addOutput('miAMpCdoM3SuRMRoEVHp8smFdDAz29WA9g',balance - 2000000);
  
  // 批量签名，根据索引即可
  unspentList.forEach((item,index)=>{txb.sign(index, bob)});

  // 序列化交易
  const tx = txb.build().toHex();
  // console.log(tx);

  // 在一个测试链的节点把交易广布出去
  const result = await fetch('https://api.blockcypher.com/v1/btc/test3/txs/push',{
    method:'post',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({tx})
  });

  // 打印结果
  console.log(result);


};

// transfer2();
