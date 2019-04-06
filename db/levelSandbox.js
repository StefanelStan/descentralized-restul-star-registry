/* ===== Persist data with LevelDB ===================================
|  Learn more: level: https://github.com/Level/level     |
|  =============================================================*/

const level = require('level');
var chainDB = './chaindata';
if (process.env.NODE_ENV === 'test'){
    chainDB = './chaindata_test';
}
const db = level(chainDB);

/**
 * Persist a block to the blockchain 
 * @param {*} block the value (the block)
 */
var saveBlock = async (height, block) => {
    await db.put(height, block);
    return;
}

/**
 * Get a block from blockchain by its height
 * @param {*} blockHeight block height
 */
var getBlockByHeight = async (blockHeight) => {
    let block = await db.get(blockHeight);
    return block;
}

var getBlocksByWalletAddress = async(walletAddress) =>{
    let blocks = [];
    return new Promise ((resolve, reject) => {
        db.createReadStream({ keys: false, values: true })
            .on('data', (data) => {
                let currentBlock = JSON.parse(data);
                if (currentBlock.body.address == walletAddress){
                    blocks.push(currentBlock);
                }
            })
            .on('error', (err) => { reject( `Unable to read data stream! because  ${err.message}`); })
            .on('close', ()=> { resolve(blocks); });
    });
}

var getBlockByHash = async (blockHash) => {
    let foundBlock = null;
    let stoppingLimit = -1;
    return new Promise ((resolve, reject) => {
        db.createReadStream({ keys: false, values: true, limit: stoppingLimit})
            .on('data', (data) => {
                let currentBlock = JSON.parse(data);
                if (currentBlock.hash == blockHash){
                    foundBlock = currentBlock;
                    stoppingLimit = 1;
                }
            })
            .on('error', (err) => { reject( `Unable to read data stream! because  ${err.message}`); })
            .on('close', ()=> { resolve(foundBlock); });
    });
}

/**
 * Get the size of the chain
 */
var getSize = () => {
    let i = 0;
    return new Promise ((resolve, reject) => {
        db.createReadStream()
            .on('data', (data) => {i++;})
            .on('error', (err) => { reject( `Unable to read data stream! because  ${err.message}`)})
            .on('close', ()=> { resolve(i);});
    });
}

module.exports = {
    saveBlock,
    getBlocksByWalletAddress,
    getBlockByHeight,
    getBlockByHash,
    getSize,
    db
}

