var express = require('express');
var bodyParser = require('body-parser');
var validator = require('validator');
var _ = require('lodash')
var {BlockChain} = require('./../blockchain/BlockChain.js');
var blockUtils = require('././../blockchain/BlockBodyUtils.js');
var {ValidationManager} = require('./middleware/ValidationManager.js');
var {RequestManager} = require('./middleware/RequestManager.js');
var {RegistrationError} = require('./middleware/RegistrationError.js');
var {ValidatedRequestsManager} = require('./middleware/ValidatedRequestsManager.js');

var app = express();
const port = 8000;
const blockchain = new BlockChain();
const validationManager = new ValidationManager(new RequestManager(), new ValidatedRequestsManager());
//const requestMempool = new requestMempool();
app.use(bodyParser.json());

// app.get('/', (response, request) =>{
// 	return response.status(200).send();
// });

app.post('/requestValidation', async(request, response) =>{
	let address = request.body.address;
	if (isNotBlank(address)){
		try {
			let timeStamp = await validationManager.registerRequest(address);
			return response.status(200).send({
				address,
				'requestTimeStamp': timeStamp,
				'message': `${address}:${timeStamp}:starRegistry`,
				'validationWindow' : 300
			});
		} catch(err){
			if (err instanceof RegistrationError){
				return response.status(200).send({
					address,
					'requestTimeStamp': err.message,
					'message': `${address}:${err.message}:starRegistry`,
					"validationWindow" : 300 - (parseInt(new Date().getTime().toString().slice(0, -3) - parseInt(err.message)))
				});
			}
			return response.status(403).send(err.message);
		}
	}
	return response.status(400).send('Invalid Address');
});

app.post('/message-signature/validate', async(request, response) =>{
	let address = request.body.address;
	let signature = request.body.signature;
	if (isNotBlank(address) && isNotBlank(signature)){
		try{
			let isSignatureValid = await validationManager.isRequestValid(address, signature);
			if (isSignatureValid){
				let confirmationValidationTimestamp = await validationManager.confirmValidation(address);
				let validationWindow = 300 - (parseInt(new Date().getTime().toString().slice(0, -3)) - parseInt(confirmationValidationTimestamp));
				return response.status(200).send({
					'registerStar': true,
					'status': {
						address,
						'requestTimeStamp': confirmationValidationTimestamp,
						'message': `${address}:${confirmationValidationTimestamp}:starRegistry`,
						validationWindow,
						'messageSignature': 'valid'
					}
				});
			}
			else {
				let requestTimeStamp = validationManager.getRegistrationRequestTime(address);
				let validationWindow = 300 - (parseInt(new Date().getTime().toString().slice(0, -3)) - parseInt(requestTimeStamp));
				return response.status(403).send({
					'registerStar': false,
					'status': {
						address,
						'requestTimeStamp': requestTimeStamp,
						'message': `${address}:${requestTimeStamp}:starRegistry`,
						validationWindow,
						'messageSignature': 'invalid'
					}
				});
			}
		} catch(err){
			return response.status(403).send(err.message);
		}
	}
	return response.status(400).send('Empty address or empty signature');
});

app.post('/block', async (request, response) =>{
	let blockBody = request.body;
	if (blockHasAllElements(blockBody) && storyHasCorrectFormat(blockBody.star.story)){
		try {
			let address = blockBody.address;
			let hasAddressBeenValidated = await validationManager.hasBeenValidated(address);
			if (hasAddressBeenValidated){
				blockUtils.buildEncodedStoryBlockBody(blockBody);
				let newBlock = await blockchain.appendBlock(blockBody);
				await validationManager.removeValidation(address);
				return response.status(200).send(newBlock);
			} else {
				return response.status(403).send('You have to validate your star registration request-message signature!')
			}	
		} catch (err){
			return response.status(500).send(err.message);
		}
	}
	return response.status(400).send('Request body has missing parameters, non ascii characters or > 500 bytes size');
});

app.get('/block/:id', async (request, response) => {
	let id = Number(request.params.id);
	if (!_.isFinite(id)){
		return response.status(404).send();
	}
	try {
		let block = await blockchain.getBlockByHeight(id);
		if (parseInt(block.height) > 0) {
			blockUtils.buildDecodedStoryBlockBody(block.body);
		}
		return response.status(200).send(block);
	} catch (error){
		return response.status(404).send(error.message);
	}
});

app.get('/stars/address:walletAddress', async (request, response) => {
	let walletAddress = request.params.walletAddress.substring(1);
	if (isNotBlank(walletAddress) == false) {
		return reject404(response);
	}
	try {
		let blocks = await blockchain.getBlocksByWalletAddress(walletAddress);
		if (blocks.length == 0) {
			return reject404(response);
		}
		blocks.forEach(block => {
			if (parseInt(block.height) > 0){
				blockUtils.buildDecodedStoryBlockBody(block.body);
			}
		});
		return response.status(200).send(blocks);
	} catch (err) {
		return response.status(500).send(error);
	}
});

app.get('/stars/hash:blockhash', async (request, response) => {
	let blockhash = request.params.blockhash.substring(1);
	if(isNotBlank(blockhash)){
		try{
			let block = await blockchain.getBlockByHash(blockhash);
			if (block != null){ 
				if(parseInt(block.height) > 0)
					blockUtils.buildDecodedStoryBlockBody(block.body);
				return response.status(200).send(block);
			}
			return response.status(404).send();
		} catch(err){
			return response.status(500).send(error);
		}
	}
	return response.status(400).send('Empty of missing blockhash value!');
});

var isNotBlank = (value) =>{
	if (value != null && JSON.stringify(value).length >2)
		return true;
	return false;		
};

var blockHasAllElements = (block) => {
	return isNotBlank(block) && isNotBlank(block.address) && isNotBlank(block.star) &&
		   isNotBlank(block.star.dec) && isNotBlank(block.star.ra) && isNotBlank(block.star.story);
};

var storyHasCorrectFormat = (story) =>{
	return validator.isAscii(story) && validator.isByteLength(story, {min:0, max:500});
};

var server = app.listen(port, () => {
	blockchain.createGenesisBlock();
	console.log(`Express Server started listening on port ${port}`);
});

module.exports = {
	app,
	server,
	validationManager
};

function reject404(request) {
	return request.status(404).send();
}
