const expect = require('chai').expect;
const sinon = require('sinon');

const db = require('./../../db/levelValidated.js');
const {ValidatedRequestsManager} = require('./ValidatedRequestsManager.js');

var validatedRequestsManager;

beforeEach(() =>{
    validatedRequestsManager = new ValidatedRequestsManager();
});

describe('Testing Validated Requests Manager', () => {
    describe('Testing is already validated', () => {
        let dbGetAddressStub;
        before(() =>{
            dbGetAddressStub = sinon.stub(db, 'getAddress');
        });

        after(() =>{
            dbGetAddressStub.restore();
        });

        it('should return true if the request is already validated', async () => {
            let address = 'xyz';
            dbGetAddressStub.withArgs(address).returns(true);
            let isAlreadyValidated = await validatedRequestsManager.isRequestValidated(address);
            expect(isAlreadyValidated).to.be.true;
        });

        it('should return false if the request is not validated', async () => {
            let address = '123abc';
            dbGetAddressStub.withArgs(address).returns(false);
            let isAlreadyValidated = await validatedRequestsManager.isRequestValidated(address);
            expect(isAlreadyValidated).to.be.false;
        });
    });

    describe('Testing Store Validated Request', () =>{
        it('should store the given address into db', async() =>{
            let address = 'abc';
            let timeStamp = 120;
            let  dbSpy = sinon.spy(db, 'saveAddress');
            await validatedRequestsManager.storeValidatedRequest(address, timeStamp);
            expect(dbSpy.withArgs(address, timeStamp).calledOnce).to.be.true;
            dbSpy.restore();
        });

        it('should throw exception if unable to store address in db', async() =>{
            let address = 'abc';
            let timeStamp = 120;
            let dbStub = sinon.stub(db, 'saveAddress');
            dbStub.withArgs(address, timeStamp).throws('Some error');
            try {
                await validatedRequestsManager.storeValidatedRequest(address, timeStamp);
            } catch (err){
                expect(err).to.be.an('Error');
                expect(err.message).to.deep.equal('Unable to store validated request into db');
            }
            
            dbStub.restore();
        });
    });

    describe('Testing Remove Validated Request', ()=>{
        it('should remove the given address from the db', async() =>{
            let dbSpy = sinon.spy(db, 'deleteAddress');
            let address =  'abc';
            await validatedRequestsManager.removeValidatedRequest(address);
            expect(dbSpy.withArgs(address).calledOnce).to.be.true;
            dbSpy.restore();
        });

        it('should throw error if unable to remove address from db', async()=>{
            let dbStub = sinon.stub(db, 'deleteAddress');
            let address = 'abc';
            dbStub.withArgs(address).throws('Some Error');
            try{
                await validatedRequestsManager.removeValidatedRequest(address);
            }catch(err){
                expect(err).to.be.an('Error');
                expect(err.message).to.deep.equal(`Unable to remove ${address} from db`);
            }

            dbStub.restore();
        });
    });

    // describe('Testing Is Waiting For Validation', () =>{
    //     let dbGetAddressStub;
    //     before(() =>{
    //         dbGetAddressStub = sinon.stub(db, 'getAddress');
    //     });

    //     after(() =>{
    //         dbGetAddressStub.restore();
    //     });
    //     it('should return false if the address/request is NOT waiting to be validated', async()=>{
    //         let address = 'xyz';
    //         dbGetAddressStub.withArgs(address).returns(undefined);
    //         let isWaitingForStarRegistration = await validatedRequestsManager.isWaitingForStarRegistration(address);
    //         expect(isWaitingForStarRegistration).to.be.false;
    //     });

    //     it('should return false if the address/request is NOT waiting to be validated', async()=>{
    //         let address = 'xyz';
    //         dbGetAddressStub.withArgs(address).returns(true);
    //         let isWaitingForStarRegistration = await validatedRequestsManager.isWaitingForStarRegistration(address);
    //         expect(isWaitingForStarRegistration).to.be.true;
    //     });
    // }); 
});