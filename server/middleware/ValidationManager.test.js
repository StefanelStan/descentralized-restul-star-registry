const expect = require('chai').expect;
const sinon = require('sinon');

const {RequestManager} = require('./RequestManager.js');
const {ValidatedRequestsManager} = require('./ValidatedRequestsManager.js');
const {ValidationManager} = require('./ValidationManager.js');
const messageVerifier = require('./../../blockchain/MessageVerifier.js');
const {RegistrationError} = require('./RegistrationError.js');
let requestManager = new RequestManager();
const address = '142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ';
let validatedRequestsManager = new ValidatedRequestsManager();
let requestManagerMock;
let validatedRequestsManagerMock;
let validationManager;

describe('Testing ValidationManager', ()=>{
    beforeEach(() =>{
        requestManagerMock = sinon.mock(requestManager);
        validatedRequestsManagerMock = sinon.mock(validatedRequestsManager);
        validationManager = new ValidationManager(requestManager, validatedRequestsManager);
    });
    afterEach(() =>{
        requestManagerMock.verify();
        validatedRequestsManagerMock.verify();

        requestManagerMock.restore();
        validatedRequestsManagerMock.restore();
    });
    describe('Testing Register Request', () =>{
        
        it('should not allow registration if address is already registered and inform the user', async () =>{

            requestManagerMock.expects('isRequestRegistered').withArgs(address).returns(true);
            requestManagerMock.expects('getRequest').withArgs(address).returns(123);
            validatedRequestsManagerMock.expects('isRequestValidated').never();
            
            try {
                await validationManager.registerRequest(address);
            } catch(err){
                expect(err).to.be.an.instanceof(RegistrationError);
                expect(err.message).to.deep.equal('123');
            }
        });
       
        it('should not allow registration if address is validation and waiting for star registration and inform the user', async () =>{

            requestManagerMock.expects('isRequestRegistered').withArgs(address).returns(false);
            validatedRequestsManagerMock.expects('isRequestValidated').withArgs(address).returns(true);
            
            try {
                await validationManager.registerRequest(address);
            } catch(err){
                expect(err).to.be.an('Error');
                expect(err.message).to.deep.equal(`Address ${address} has already been registered and validated!`);
            }
        });

        it('should allow registration if address has not been registered or waiting for registration', async () =>{
            
            requestManagerMock.expects('isRequestRegistered').withArgs(address).returns(false);
            validatedRequestsManagerMock.expects('isRequestValidated').withArgs(address).returns(false);
            requestManagerMock.expects('addRequest').withArgs(address).returns(123456789);

            let timestamp = await validationManager.registerRequest(address);
            expect(timestamp).to.deep.equal(123456789);
        });
    });

    describe('Testing Is Request Valid', ()=>{
        let messageVerifierStub;
        before(() =>{
            messageVerifierStub = sinon.stub(messageVerifier, 'verifyMessageSignature');
        });

        after(() =>{
            messageVerifierStub.restore();
        });
        
        it('should not perform any kind of validation if not previously registered', async() =>{
            //reject star registreation if request has not previously been put to mempool 
            requestManagerMock.expects('getRequest').withArgs(address).returns(undefined);

            try {
                await validationManager.isRequestValid(address);
            } catch (err){
                expect(err).to.be.an('Error');
                expect(err.message).to.be.equal(`You must register first before attempting to validate a request!`);
            }
        });

        it('should not allow validation if registration time expired', async() =>{
            //reject star registreation if request has expired (>300 seconds) 
            requestManagerMock.expects('getRequest').withArgs(address).returns(11223);

            try {
                await validationManager.isRequestValid(address);
            } catch (err){
                expect(err).to.be.an('Error');
                expect(err.message).to.be.equal(`Validation time window expired! Allowed only for 300 seconds!`);
            }
        });

        it('should not validate request if signature cannot be confirmed', async()=>{
            let signature = 'mockedSignature';
            let currentDate = new Date().getTime().toString().slice(0,-3);
            requestManagerMock.expects('getRequest').withArgs(address).returns(currentDate);
            messageVerifierStub.withArgs(address, currentDate, signature).returns(false);

            try {
                await validationManager.isRequestValid(address);
            } catch(err){
                expect(err).to.be.an('Error');
                expect(err.message).to.be.equal(`Message signature could not be verified`);
            }
        });

        it('should validate if all the expectations are fulfilled', async()=>{
            let signature = 'mockedSignature';
            let currentDate = new Date().getTime().toString().slice(0,-3);
            requestManagerMock.expects('getRequest').withArgs(address).returns(currentDate);
            messageVerifierStub.withArgs(address, currentDate, signature).returns(true);

            expect(await validationManager.isRequestValid(address, signature)).to.be.true;
        });
    });

    describe('Testing Confirm Validation', () =>{
        it('should delete entry from Register manager and write into validated request db', async() =>{
            let currentDate = new Date().getTime().toString().slice(0,-3);
            requestManagerMock.expects('getRequest').withArgs(address).returns(currentDate);
            requestManagerMock.expects('removeRequest').withArgs(address);
            
            validatedRequestsManagerMock.expects('storeValidatedRequest').withArgs(address, currentDate);

            await validationManager.confirmValidation(address);
        });

        it('should throw exception if unable to confirm/perform the validation', async()=>{
            let currentDate = new Date().getTime().toString().slice(0,-3);
            requestManagerMock.expects('getRequest').withArgs(address).returns(currentDate);
            requestManagerMock.expects('removeRequest').withArgs(address);
            validatedRequestsManagerMock.expects('storeValidatedRequest').withArgs(address, currentDate).throws('Some error');

            try{
                await validationManager.confirmValidation(address);
            } catch(err){
                expect(err).to.be.an('Error');
                expect(err.message).to.be.equal(`Unable to confirm validation due to an internal error`);
            }
        });
    });

    describe('Testing Has Been Validated', ()=>{
        it('should return true if the address has already been validated', async()=>{
            validatedRequestsManagerMock.expects('isRequestValidated').withArgs(address).returns(true);
        
            expect(await validationManager.hasBeenValidated(address)).to.be.true;
        });

        it('should return false if the address has not been validated yet', async()=>{
            validatedRequestsManagerMock.expects('isRequestValidated').withArgs(address).returns(false);
        
            expect(await validationManager.hasBeenValidated(address)).to.be.false;
        });
    });

    describe('Testing Remove Validation', ()=>{
        it('should remove the item from the validation db', async()=>{
            validatedRequestsManagerMock.expects('removeValidatedRequest').withArgs(address);

            await(validationManager.removeValidation(address));
        });

        it('should throw exception if unable to remove from the validation db', async()=>{
            validatedRequestsManagerMock.expects('removeValidatedRequest').withArgs(address).throws('Some error');

            try{ 
                await(validationManager.removeValidation(address));
            } catch(err){
                expect(err).to.be.an('Error');
                expect(err.message).to.be.equal(`Unable to remove request from validation db`);
            }
        });
    });
});