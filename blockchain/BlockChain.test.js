const expect = require('chai').expect;
const sandBox = require('./../db/levelSandbox.js');
const {Block} = require('./models/Block.js');
const blockBodyUtils = require('./BlockBodyUtils.js');
const {BlockChain} = require('./BlockChain');

let blockBody = blockBodyUtils.buildEncodedBlockBody("142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ1", "ra1", "dec1", "story1");
let blockBody2 = blockBodyUtils.buildEncodedBlockBody("142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ2", "ra2", "dec2", "story2");
let blockBody3= blockBodyUtils.buildEncodedBlockBody("142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ1", "ra3","dec3", "story1");

var blockChain;
var getAllEntries = () => {
    let keyEntries = [];
    return new Promise((resolve, reject) => { 
        sandBox.db.createReadStream({ keys: true, values: false })
            .on('data', (data) => {
                keyEntries.push(data);
            })
            .on('close', ()=> { resolve(keyEntries);});   
    });
};

var deleteAllEntries = async (keys) => {
    const ops = [];
    type = 'del';
    if (keys != null)
        keys.forEach(key => {
            ops.push({type, key});
        });
    await sandBox.db.batch(ops);
    return;
};

beforeEach(async () => {
    let keys = await getAllEntries();
    await deleteAllEntries(keys); 
    blockChain = new BlockChain();
	   await blockChain.createGenesisBlock();   
});
describe('Testing Block Chain', ()=>{
    describe(' Testing genesis block addition', () => {
        it('should add the genesis block before any block if empty chain', async () => {
            await blockChain.addBlock(new Block(blockBody));
            await blockChain.addBlock(new Block(blockBody2));
            let dbSize = await sandBox.getSize();
            let blockchainHeight = await blockChain.getBlockHeight();
            expect(dbSize).to.equal(3);
            expect(blockchainHeight).to.equal(3);
        });
    });

    describe('Testing Validation', () =>{
        it('should validate each block individually', async () => {
            await blockChain.addBlock(new Block(blockBody));
            await blockChain.addBlock(new Block(blockBody2));
            await blockChain.addBlock(new Block(blockBody));
            await blockChain.addBlock(new Block(blockBody2));
            await blockChain.addBlock(new Block(blockBody));

            let validationBlock2 = await blockChain.validateBlock(2);
            let validationBlock3 = await blockChain.validateBlock(3);
            expect(validationBlock2).to.be.true;
            expect(validationBlock3).to.be.true;
        });

        it('should validate whole chain', async () => {
            await blockChain.addBlock(new Block(blockBody));
            await blockChain.addBlock(new Block(blockBody2));
            await blockChain.addBlock(new Block(blockBody));
            await blockChain.addBlock(new Block(blockBody2));
            await blockChain.addBlock(new Block(blockBody));

            let fails = await blockChain.validateChain();
            expect(fails.length).to.equal(0);
        });

        it('should fail block validation if block is changed', async () =>{
            await blockChain.addBlock(new Block(blockBody));
            await blockChain.addBlock(new Block(blockBody2));
            
            //force an override of blocks by tempering with 2nd block 
            await sandBox.db.put(1, JSON.stringify(new Block("hackedData")));

            let validationBlock2 = await blockChain.validateBlock(1);
            expect(validationBlock2).to.be.false;
        });


        it('should fail chain validation if one block is tempered with', async () => {
            await blockChain.addBlock(new Block(blockBody));
            await blockChain.addBlock(new Block(blockBody2));
            await blockChain.addBlock(new Block(blockBody));
            
            //force an override of blocks by tempering with 2nd block 
            let modifiedBlock = new Block("hackedData");
            modifiedBlock.height = 1;
            modifiedBlock.hash = "7462342342";
            await sandBox.db.put(1, JSON.stringify(modifiedBlock));

            //should fail on hash of block1 and linking [B0] -> [B1] and [B1] -> [B2]
            let fails = await blockChain.validateChain();
            expect(fails.length).to.equal(3);
            expect(fails).to.deep.include('Failed validating block hash 1');
        });
    });

    describe('Testing get block by: height, address, hashCode', () =>{
        it('should return block by height', async () => {
            await blockChain.addBlock(new Block(blockBody));
            await blockChain.addBlock(new Block(blockBody2));
            await blockChain.addBlock(new Block(blockBody3));

            let genesisBlock = await blockChain.getBlockByHeight(0);
            let block1 = await blockChain.getBlockByHeight(1);
            let blockchainHeight = await blockChain.getBlockHeight();

            expect(blockchainHeight).to.equal(4);
            
            //assert genesis block expectations
            expect(genesisBlock.hash).to.not.deep.equal("");
            expect(genesisBlock.height).to.equal(0);
            expect(genesisBlock.previousblockhash).to.equal("");
            expect(genesisBlock.body).to.equal('First Block in the chain - Genesis Block');
            expect(parseInt(genesisBlock.time)).to.be.above(0);

            //assert block1 expectations and to be linked by genesis block
            expect(block1.hash).to.not.deep.equal("");
            expect(block1.height).to.equal(1);
            expect(block1.previousblockhash).to.equal(genesisBlock.hash);
            expect(block1.body.star.ra).to.equal("ra1");
            expect(parseInt(block1.time)).to.be.above(0);
        });

        it('should return 0 or more blocks by blockchain wallet address', async() => {
            await blockChain.addBlock(new Block(blockBody));
            await blockChain.addBlock(new Block(blockBody2));
            await blockChain.addBlock(new Block(blockBody3));

            let address1Blocks = await blockChain.getBlocksByWalletAddress('142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ1');
            expect(address1Blocks.length).to.equal(2);
            address1Blocks.forEach(block => {
                expect(block.body.address).to.deep.equal('142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ1');
            });

            let address2Blocks = await blockChain.getBlocksByWalletAddress('142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ2');
            expect(address2Blocks.length).to.equal(1);
            expect(address2Blocks[0].body.address).to.deep.equal('142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ2');

            let inexistentBlocks = await blockChain.getBlocksByWalletAddress('inexistent_Address');
            expect(inexistentBlocks.length).to.equal(0); 
        }); 
        
        it('should get block by block hash', async() =>{
            /*
            blockChain.addBlock() will use system time to hash the blocks; we MUST inject blocks in DB bypassing blockchain and using db direcly
            Thus, we will hardcore the hash
            */
            let modifiedBlock = new Block(blockBody);
            modifiedBlock.height = 0;
            modifiedBlock.hash = "112233hashX";
            await sandBox.db.put(0, JSON.stringify(modifiedBlock));

            let modifiedBlock2 = new Block(blockBody2);
            modifiedBlock2.height = 1;
            modifiedBlock2.hash = "445566hashY";
            await sandBox.db.put(1, JSON.stringify(modifiedBlock2));

            let firstBlock = await blockChain.getBlockByHash('112233hashX');
            expect(firstBlock.hash).to.deep.equal('112233hashX');
            expect(firstBlock.height).to.equal(0);

            let secondBlock = await blockChain.getBlockByHash('445566hashY');
            expect(secondBlock.hash).to.deep.equal('445566hashY');
            expect(secondBlock.height).to.equal(1);

            let inexistentBlock = await blockChain.getBlockByHash('112233');
            expect(inexistentBlock).to.be.null;
        });
    });
});
