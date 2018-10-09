const fs = require('fs')
const crypto = require('crypto')

const getBlockHash = data => {
  const bin = crypto.createHash('sha256').update(JSON.stringify({ data }), 'utf8').digest('binary')
  const tmp = crypto.createHash('sha256').update(bin, 'binary').digest().reverse()
  return tmp.toString('hex')
}

// ブロックのハッシュ更新
const setDataHash = block => {
  block.header.dataHash = getBlockHash(block.data)
}

// マイニング関数
const mining = block => {
  while (!getBlockHash(block).startsWith('0'.repeat(block.header.target))) {
    block.header.nonce++
  }
}

// 起源ブロック
const genesisBlock = {
  blockNumber: 0,
  header: {
    previousBlockHeaderHash: '0000000000000000000000000000000000000000000000000000000000000000',
    dataHash: '',
    time: 1539030232006,
    target: 1,
    nonce: 17
  },
  data: {}
}

// ファイル書き出し
const createBlockFile = block => {
  const blockHash = getBlockHash(block)
  fs.writeFileSync(`./chain/${blockHash}.json`, JSON.stringify(block, null, ''))
}

const getBlockList = _ => {
  const files = fs.readdirSync('./chain')
  const blockList =
    files
      .filter(file => {
        return fs
          .statSync(`./chain/${file}`)
          .isFile() &&
          /.*\.json$/.test(file)
      })
      .map(file => {
        return getBlockFromFile(file)
      })
  return blockList.sort((a, b) => b.blockNumber - a.blockNumber)
}

const getBlockFromFile = fileName => {
  const text = fs.readFileSync(`./chain/${fileName}`)
  return JSON.parse(text)
}

const getLatestBlock = _ => {
  const BlockList = getBlockList()
  return BlockList[0]
}

const makeNextBlock = block => {
  return {
    blockNumber: block.blockNumber + 1,
    header: {
      previousBlockHeaderHash: getBlockHash(block),
      time: Date.now(),
      target: block.header.target,
      nonce: 0
    },
    data: {}
  }
}

const checkChain = _ => {
  const blockList = getBlockList().reverse()
  if (blockList.length === 1) return true
  for (let [i, block] in blockList.entries()) {
    const lastBlock = blockList[i - 1]
    const curBlock = block
    setDataHash(lastBlock)
    if (curBlock.header.previousBlockHeaderHash !== getBlockHash(lastBlock)) {
      console.log(`block ${curBlock.blockNumber}.header.previousBlockHash or ${lastBlock.blockNumber}.data is wrong!`)
      return false
    }
  }
  return true
}

const main = _ => {
  setDataHash(genesisBlock)
  mining(genesisBlock)
  createBlockFile(genesisBlock)

  for (let i = 0; i < 5; i++) {
    const latestBlock = getLatestBlock()
    const nextBlock = makeNextBlock(latestBlock)
    nextBlock.data.tx = { hoge: 'foo' }
    setDataHash(nextBlock)
    mining(nextBlock)
    createBlockFile(nextBlock)
  }

  checkChain()
}

main()
