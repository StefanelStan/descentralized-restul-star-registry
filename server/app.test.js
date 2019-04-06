const supertest = require('supertest');
const expect = require('chai').expect;

const {Block} = require('./../blockchain/models/Block.js');
const blockBodyUtils = require('../blockchain/BlockBodyUtils.js');
const app = require('./app.js').app;
const server = require('./app.js').server;
const validationManager = require('./app.js').validationManager;
const db = require('./../db/levelSandbox.js').db;
const validateddb = require('./../db/levelValidated');
const {BlockChain} = require('./../blockchain/BlockChain.js');

var getAllBlockChainDBEntries = () => {
    let keyEntries = [];
    return new Promise((resolve, reject) => { 
        db.createReadStream({ keys: true, values: false })
            .on('data', (data) => {
                keyEntries.push(data);
            })
            .on('close', ()=> { resolve(keyEntries);});   
    });
};

var deleteBlockChainDBEntries = async (keys) => {
    const ops = [];
    type = 'del';
    keys.forEach(key => {
        ops.push({type, key});
    });
    await db.batch(ops);
    return;
};
beforeEach(async () => {
    let keys = await getAllBlockChainDBEntries();
    await deleteBlockChainDBEntries(keys); 
    await validateddb.deleteAllAddresses();
    await validationManager.clearEverything();
});

after(async () =>{
    await server.close();
});

describe('Server Testing', ()=>{
    
    describe('Testing - VALIDATION', () =>{
        describe('Testing requestValidation', ()=>{
            it('should allow to do a new registration if none is registrered or validated', async() =>{
                let currentDate = new Date().getTime().toString().slice(0,-3);
                let address = '142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ';
    
                let response = await supertest(app).post('/requestValidation').send({address});
                expect(response.status).to.equal(200);
                expect(response.body).to.deep.equal({"address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
                                                    "requestTimeStamp": currentDate,
                                                    "message": `142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ:${currentDate}:starRegistry`,
                                                    "validationWindow": 300
                                                });
    
            });
    
            it('should not allow to do a new registration if the address has been validated and waiting for star registration', async() =>{
                let currentDate = new Date().getTime().toString().slice(0,-3);
                let address = '142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ';
                await validateddb.saveAddress(address, currentDate);
    
                let response = await supertest(app).post('/requestValidation').send({address: '142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ'});
                expect(response.status).to.equal(403);
                expect(response.error.text).to.deep.equal(`Address ${address} has already been registered and validated!`);
    
            });
    
            it('should not allow to do a new registration if the address has been registered and waiting for validation', async() =>{
                let currentDate = new Date().getTime().toString().slice(0,-3);
                let address = '142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ';
    
                let response = await supertest(app).post('/requestValidation').send({address});
                expect(response.status).to.equal(200);
                expect(response.body).to.deep.equal({"address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
                                                    "requestTimeStamp": currentDate,
                                                    "message": `142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ:${currentDate}:starRegistry`,
                                                    "validationWindow": 300
                                                });
                //sleep for 2100 ms to allow validation window to shrink by 2 seconds
                await sleep(2100);                                

                let errorResponse = await supertest(app).post('/requestValidation').send({address: '142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ'});
                expect(errorResponse.status).to.equal(200);
                expect(errorResponse.body).to.deep.equal({"address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
                                                    "requestTimeStamp": currentDate,
                                                    "message": `142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ:${currentDate}:starRegistry`,
                                                    "validationWindow": 298
                                                });                               
            });
        });
    
        describe('Testing message-signature/validate', ()=>{
            it('should reject message signature validation if there has been no previous request to register', async()=>{
                let address = '14UtjbYhx7shNqXmHe1vAYaLjs9BDC6C4R';
                let signature = 'abcde';
                let errorResponse = await supertest(app).post('/message-signature/validate').send({address, signature});
                expect(errorResponse.status).to.equal(403);
                expect(errorResponse.error.text).to.deep.equal(`You must register first before attempting to validate a request!`); 
            });
    
            it('should reject validation if message signature is not valid', async()=>{
                let address = '14UtjbYhx7shNqXmHe1vAYaLjs9BDC6C4R';
                let signature = 'abcde';
                await supertest(app).post('/requestValidation').send({address});
                let errorResponse = await supertest(app).post('/message-signature/validate').send({address, signature});
    
                expect(errorResponse.status).to.equal(403);
                expect(errorResponse.body.registerStar).to.be.false;
                expect(errorResponse.body.status.messageSignature).to.deep.equal('invalid');
            });
    
            //This test can only run with valid & signed data and not with pre-hardcoded values as the time & signature generated at runtime
            it('should pass message signature validation if request has been made and signature is valid', async()=>{
            });
        });
    });
    
    describe('Testing - POST /block', () => {
        let validStarRequestBody = {
            "address": "14UtjbYhx7shNqXmHe1vAYaLjs9BDC6C4R",
            "star": {
                "dec": "-26° 29'\'' 24.9",
                "ra": "16h 29m 1.0s",
                "story": "Found star using https://www.google.com/sky/"
            }
        }
        let address = '14UtjbYhx7shNqXmHe1vAYaLjs9BDC6C4R';
        
        it('should return 400 if star registration request has missing or empty mandatory parameters', async()=>{
            let badStarRequestBody = {
                "address": "14UtjbYhx7shNqXmHe1vAYaLjs9BDC6C4R",
                "star": {"dec": "-26° 29'\'' 24.9", "ra": "", "story": "Found star using https://www.google.com/sky/"}
            }
            let result = await supertest(app).post('/block').send(badStarRequestBody);
            expect(result.status).to.equal(400);
            expect(result.error.text).to.deep.equal('Request body has missing parameters, non ascii characters or > 500 bytes size');
    
        });
    
        it('should not allow to register a star if story has NON-ASCII characters', async()=>{
            let badStarRequestBody = {
                "address": "14UtjbYhx7shNqXmHe1vAYaLjs9BDC6C4R",
                "star": {"dec": "-26° 29'\'' 24.9", "ra": "94 19", "story": "•╪Â"}
            }
            let result = await supertest(app).post('/block').send(badStarRequestBody);
            expect(result.status).to.equal(400);
            expect(result.error.text).to.deep.equal('Request body has missing parameters, non ascii characters or > 500 bytes size');
        });

        it('should not allow to register a star if story length has more than 500 bytes', async()=>{
            let badStarRequestBody = {
                "address": "14UtjbYhx7shNqXmHe1vAYaLjs9BDC6C4R",
                "star": {"dec": "-26° 29'\'' 24.9", "ra": "94 19", 
                "story": "11111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111"
                        + "1111111111222222222222222222222222222222222222222222222222222222222222222222222222333333333333333333333"
                        + "3333333333333333333333333333333333333333333333333444444444444444444444444444444444444444444444444444444"
                        + "5555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555"
                        + "6666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666"
                        + "7777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777"
                        + "8888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888"
                    }
            }
            let result = await supertest(app).post('/block').send(badStarRequestBody);
            expect(result.status).to.equal(400);
            expect(result.error.text).to.deep.equal('Request body has missing parameters, non ascii characters or > 500 bytes size');
        });

        it('should not allow to register a star if address is not registered or validated', async()=>{
            let result = await supertest(app).post('/block').send(validStarRequestBody);
            
            expect(result.status).to.equal(403);
            expect(result.error.text).to.deep.equal('You have to validate your star registration request-message signature!');
        });
    
        it('should not allow to register a star if address is registered but not validated', async()=>{
            let currentDate = new Date().getTime().toString().slice(0,-3);
            
            //register a request
            let response = await supertest(app).post('/requestValidation').send({address});
            expect(response.status).to.equal(200);
            expect(response.body).to.deep.equal({address,
                                                "requestTimeStamp": currentDate,
                                                "message": `${address}:${currentDate}:starRegistry`,
                                                "validationWindow": 300
                                            });
            //attempt to register a star without validating the message signature, only with the request registered
            let result = await supertest(app).post('/block').send(validStarRequestBody);
            expect(result.status).to.equal(403);
            expect(result.error.text).to.deep.equal('You have to validate your star registration request-message signature!');
        });
        
        it('should allow to register a star and save it to db successfully only after registration and validation', async () => {
            //inject into validatedDB the address to bypass the registration and validation
            validateddb.saveAddress(address, '1233452');
    
            let result = await supertest(app).post('/block').send(validStarRequestBody);
            expect(result.status).to.equal(200);
        
            //assert it exists in DB under the key 1 as key0 is genesis block
            let block1 = JSON.parse(await db.get('1'));
            expect(block1.hash).to.not.deep.equal("");
            expect(block1.height).to.equal(1);
            expect(block1.previousblockhash).to.not.deep.equal("");
            expect(block1.body.address).to.equal(address);
            expect(parseInt(block1.time)).to.be.above(0);
    
            expect(result.body).to.deep.include(block1);
    
            //check the validated DB not to contain this recording
            expect(await validationManager.hasBeenValidated(address)).to.be.false;
        });
    
        it('should not allow to register twice/two stars using a single succesful validation', async()=>{
            //inject into validatedDB the address to bypass the registration and validation
            validateddb.saveAddress(address, '1233452');
    
            //attempt to register twice/two stars after a successful validation
            let result = await supertest(app).post('/block').send(validStarRequestBody);
            expect(result.status).to.equal(200);
    
            let result2 = await supertest(app).post('/block').send(validStarRequestBody);
            expect(result2.status).to.equal(403);
            expect(result2.error.text).to.deep.equal('You have to validate your star registration request-message signature!');
        });
    });
    
    // describe('STARS', () => {
    //     describe('STARS GET /stars/address:[ADDRESS]', () => {
    //         it('should return 200, array of blocks with decoded star story for wallet address', async () => {
    //             let blockchain = new BlockChain();
    //             let blockBody = bodyBlockConstructor.buildEncodedBlockBody("142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ1", "ra1", "dec1", "story1");
    //             let blockBody2 = bodyBlockConstructor.buildEncodedBlockBody("142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ2", "ra2", "dec2", "story2");
    //             let blockBody3= bodyBlockConstructor.buildEncodedBlockBody("142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ1", "ra3","dec3", "story1");
    //             await blockchain.appendBlock(blockBody);
    //             await blockchain.appendBlock(blockBody2);
    //             await blockchain.appendBlock(blockBody3);
    
    //             let response = await supertest(app).get('/stars/address:142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ1');
    //             expect(response.status).to.equal(200);
    //             expect(response.body).to.not.be.null;
    //             expect(response.body.length).to.equal(2);
    //             response.body.forEach(block => {
    //                 expect(block.body.address).to.deep.equal('142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ1');
    //                 expect(block.body.star.storyDecoded).to.not.be.undefined;
    //                 expect(block.body.star.storyDecoded).to.deep.equal(Buffer.from(block.body.star.story, 'hex').toString());
    //             });
    //         });
    
    //         it('should return 404 if no blocks found', async() => {
    //             let blockchain = new BlockChain();
    //             let blockBody = bodyBlockConstructor.buildEncodedBlockBody("142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ1", "ra1", "dec1", "");
    //             await blockchain.appendBlock(blockBody);
    //             let response = await supertest(app).get('/stars/address:142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ2');
    //             expect(response.status).to.equal(404);
    //             expect(response.body).to.be.empty;
    //         });
    //     });
    // });
    
    
    describe('Testing GET /block/id', () => {
        it('should get the correct block id and status 200 and the decoded story', async () => {
            let blockBody = blockBodyUtils.buildEncodedBlockBody("142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ1", "ra1", "dec1", "");
            let block0 = new Block(blockBody);
            block0.hash = '12345fakeHash';
            block0.time = 123;
            await db.put(block0.height, JSON.stringify(block0));
            
            let blockBody2 = blockBodyUtils.buildEncodedBlockBody("dummyaddress", "ra1", "dec1", "some random story");
            let block1 = new Block(blockBody2);
            block1.hash = '12345fakeHash11';
            block1.time = 1235;
            block1.height = 1;
            await db.put(block1.height, JSON.stringify(block1));
    
            let result = await supertest(app).get('/block/0');
            expect(result.status).to.equal(200);
            expect(result.body).to.deep.include(block0);
    
            let result2 = await supertest(app).get('/block/1');
            blockBodyUtils.buildDecodedStoryBlockBody(block1.body);
            expect(result2.status).to.equal(200);
            expect(result2.body).to.deep.include(block1);
        });
    
        it('should return 404 if block does not exist', async () => {
            let result = await supertest(app).get('/block/0');
            expect(result.status).to.equal(404);
            expect(result.body).to.be.empty;
        });
    
        it('should return 404 if wrong non-number is send on request', async() => {
            let result = await supertest(app).get('/block/tr23#$');
            expect(result.status).to.equal(404);
            expect(result.body).to.be.empty;
        });
    });

    describe('Testing GET /block/hash stars/hash:[hash]', ()=>{
        it('should return 404 if no block exists', async()=>{
            let result = await supertest(app).get('/stars/hash:1234');
            expect(result.status).to.equal(404);
            expect(result.body).to.be.empty;
        });

        it('should return the specific block by block hash', async() =>{
            let blockBody2 = blockBodyUtils.buildEncodedBlockBody("dummyaddress", "ra1", "dec1", "some random story");
            let block1 = new Block(blockBody2);
            block1.hash = '12345fakeHash11';
            block1.time = 1235;
            block1.height = 1;
            await db.put(block1.height, JSON.stringify(block1));

            let result = await supertest(app).get('/stars/hash:12345fakeHash11');
            blockBodyUtils.buildDecodedStoryBlockBody(block1.body);
            expect(result.status).to.equal(200);
            expect(result.body).to.deep.include(block1);

        });
    });

    describe('Testing GET /block/address stars/address:[wallet_address]', ()=>{
        it('should return 404 if no block exists', async()=>{
            let result = await supertest(app).get('/stars/address:1234');
            expect(result.status).to.equal(404);
            expect(result.body).to.be.empty;
        });

        it('should return a list of blocks made by that address', async() =>{
            //add 5 blocks: 3 belonging to 1 address and 2 random ones
            var blocks = [];
            blocks.push(await addBlockToDB('wallet_address1', 'ra1', 'dec1', 'randomStory1', 'hash1', 111, 1));
            blocks.push(await addBlockToDB('wallet_address2', 'ra2', 'dec2', 'randomStory2', 'hash2', 222, 2));
            blocks.push(await addBlockToDB('wallet_address1', 'ra3', 'dec3', 'randomStory3', 'hash3', 333, 3));
            blocks.push(await addBlockToDB('wallet_address4', 'ra4', 'dec4', 'randomStory4', 'hash4', 444, 4));
            blocks.push(await addBlockToDB('wallet_address1', 'ra5', 'dec5', 'randomStory5', 'hash5', 555, 5));

            let result = await supertest(app).get('/stars/address:wallet_address1');
            expect(result.status).to.equal(200);
            expect(result.body.length).to.equal(3);
            expect(result.body).to.deep.include(blocks[0]);
            expect(result.body).to.deep.include(blocks[2]);
            expect(result.body).to.deep.include(blocks[4]);
        });

        var addBlockToDB = async (address, ra, dec, story, hash, time, height) =>{
            let tempBlock = blockBodyUtils.buildEncodedBlockBody(address, ra, dec, story);
            let block = new Block(tempBlock);
            block.hash = hash;
            block.time = time;
            block.height = height;
            await db.put(block.height, JSON.stringify(block));
            blockBodyUtils.buildDecodedStoryBlockBody(block.body);
            return block;
        };
    });
});

function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    })
};