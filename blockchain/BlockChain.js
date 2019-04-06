const {SHA256} = require('crypto-js');
const {Block} = require('./models/Block.js');
const db = require('./../db/levelSandbox.js');
const blockUtils = require('./BlockBodyUtils.js');

/**
- createGenesisBlock()                         
- getLatestBlock()                              
- addBlock()                                    
- getBlock()                                     
- validateBlock()                                
- validateChain()      
*/
class BlockChain {
    constructor() {}

    async createGenesisBlock() {
        try {
            let chainLength = await db.getSize();
			if (chainLength == 0) {
				let genesisBlock = new Block("First Block in the chain - Genesis Block");
				genesisBlock.height = 0;
				genesisBlock.time = new Date().getTime().toString().slice(0, -3);
				genesisBlock.hash = SHA256(JSON.stringify(genesisBlock)).toString();
                await db.saveBlock(genesisBlock.height, JSON.stringify(genesisBlock));
            }
		} catch (err){
            throw new Exception(`Unable to create genesis block due to ${err.message}`);
        }    
        return;
    }

    /**
     *  Add block to the block chain
     * @param {*} newBlock the new block to add
     */
    async addBlock(newBlock){
        try {
            let chainLength = await db.getSize();
            if (chainLength == 0) {
                await this.createGenesisBlock();
                chainLength++;
            }
            newBlock.previousblockhash = (await this.getBlockByHeight(chainLength -1)).hash;
            newBlock.height = chainLength;
            newBlock.time = new Date().getTime().toString().slice(0,-3);
            newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
            await db.saveBlock(newBlock.height, JSON.stringify(newBlock));
            return newBlock;
        } catch (err){
            return Promise.reject(`Unable to add block because ${err}`);
        }    
    }
    /**
     *  Append a block to the block chain (given by the block body)
     * @param {*} blockBody the block body
     */
    async appendBlock(blockBody){
        try {
            let newBlock = await this.addBlock(new Block(blockBody));
            return newBlock;
        } catch (err){
            throw err;
        }
    }

    /**
     */
    async getBlockHeight(){
        try {
            let height = await db.getSize();
            return height;
        } catch (err){
            return Promise.reject(`Unable to get block height because ${err.message}`);
        }
    }

    /**
     * Returns the stored block in the db given by the height
     * @param {*} blockHeight block's height to return
     */
    async getBlockByHeight(blockHeight){
        try {
            let block = JSON.parse(await db.getBlockByHeight(blockHeight));
            return block;
        } catch (err){
            return Promise.reject(`Unable to get block by height because ${err}`);
        }    
    }

    /**
     * validate a given block from the chain given by the height
     * @param {*} blockHeight block's height to validate
     */
    async validateBlock(blockHeight){
        try {
            let persistedBlock = await this.getBlockByHeight(blockHeight);
            let persistedBlockHash = persistedBlock.hash;
            persistedBlock.hash = "";
            return persistedBlockHash == SHA256(JSON.stringify(persistedBlock)).toString();
        } catch (err){
            return Promise.reject(`Unable to validate block because ${err}`);
        }    
    }
    
    async validateBlockLinks(block) {
        try {
            let nextBlock = await this.getBlockByHeight(block.height + 1);
            return block.hash == nextBlock.previousblockhash;
        } catch (err){
            return Promise.reject(`Unable to validati block links becuuse ${err.message}`);
        }    
    }

    async validateChain(){
        try {
            let size = await db.getSize();
            let fails = [];
            for (let i=0; i < size -1 ; i++){
                let currentBlock = await this.getBlockByHeight(i);
                if ((await this.validateBlock(i)) === false){
                    fails.push(`Failed validating block hash ${i}`);
                }
                if ((await this.validateBlockLinks(currentBlock)) === false){
                    fails.push(`Failed validating block link ${i}`);
                }
            }
            return fails;
        } catch (err){
            return Promise.reject (`Unable to validate chain because ${err.message}`);
        }
    }

    async getBlocksByWalletAddress(walletAddress) {
        try {
            let blocks = await db.getBlocksByWalletAddress(walletAddress);
            return blocks;
        } catch (err) {
            return Promise.reject(err.message);
        }
    }

    async getBlockByHash(blockHash){
        try {
            let block = await db.getBlockByHash(blockHash);
            return block;
        } catch (err){
            return Promise.reject(err.message);
        }
    }
}

module.exports = {
    BlockChain
}